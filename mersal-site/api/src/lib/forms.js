// Public request forms: validation, bot checks, rate limit and storage.
//   volunteer (MV) /volunteer.html, help (MH) /help.html, contact (MC) /contact.html,
//   transfer (MT) "سجّل تبرعك" and pickup (MP) "مندوب لحد البيت" on /donate.html
//
// Storage: the Azure Table "requests" in the DONATIONS_STORAGE account (partitionKey = type, rowKey = reference id).
// Nothing else: the GitHub repository is public, so patient details, phones and home addresses must never be
// committed there. Without the table (or when it fails) a request is only delivered when FORMS_WEBHOOK_URL accepts
// it; otherwise the visitor gets a 503 with the 19340 hotline and the console's requests tab shows a red blocker.
// Optional: FORMS_WEBHOOK_URL gets a POST per request, signed with FORMS_WEBHOOK_SECRET (or DONATION_WEBHOOK_SECRET)
// the same way verify.js forwards donations.
// Limits (lib/limits.js, shared by every instance when the table is set): FORMS_RATE_LIMIT (default 5) accepted
// submissions per visitor IP per hour, FORMS_GLOBAL_LIMIT (default 300) accepted submissions per hour from everyone.
const crypto = require("crypto");
const cairo = require("./cairo");
const limits = require("./limits");
let TableClient = null;
try { ({ TableClient } = require("@azure/data-tables")); } catch { /* dependency not installed */ }

const TABLE = "requests";
const has = (map, k) => k != null && Object.prototype.hasOwnProperty.call(map, String(k));

const TYPES = {
  volunteer: { prefix: "MV", label: "تطوع" },
  help: { prefix: "MH", label: "طلب مساعدة" },
  transfer: { prefix: "MT", label: "تبرع مسجّل" },
  pickup: { prefix: "MP", label: "مندوب" },
  contact: { prefix: "MC", label: "رسالة" },
};
const STATUSES = ["new", "contacted", "done", "rejected"];
const STATUS_LABELS = { new: "جديد", contacted: "تم التواصل", done: "تم", rejected: "مرفوض" };
const HOW = { hospital: "مستشفى", convoys: "قوافل", design: "تصميم / سوشيال ميديا", fundraising: "جمع تبرعات", other: "أخرى" };
const AVAILABILITY = { weekdays: "أيام الأسبوع", weekends: "نهاية الأسبوع", flexible: "مرن / حسب الحاجة", online: "أونلاين فقط" };
const RELATION = { self: "المريض نفسه", parent: "الأب / الأم", child: "الابن / الابنة", spouse: "الزوج / الزوجة", sibling: "الأخ / الأخت", relative: "قريب", other: "أخرى" };
const CASE_TYPES = { monthly: "علاج شهري", surgery: "عملية", oncology: "أورام", children: "أطفال", other: "أخرى" };
// transfer / pickup. PURPOSES keys match the card donation select on donate.html; any campaign page "p<id>" is accepted too
// (the same rule as /api/checkout), labelled from pages.json in the console.
const METHODS = { bank: "تحويل بنكي", instapay: "إنستاباي", vodafone: "فودافون كاش", etisalat: "اتصالات كاش (e& cash)", wepay: "WE Pay", orange: "أورانج كاش", fawry: "فوري / MyFawry", masary: "مصاري", aman: "أمان", megakheir: "ميجا خير", bankwallet: "محافظ البنوك (من خلال فوري)" };
const CURRENCIES = { EGP: "جنيه مصري", USD: "دولار أمريكي", EUR: "يورو", SAR: "ريال سعودي", AED: "درهم إماراتي" };
const PURPOSES = { general: "تبرع عام - حيث الحاجة أكبر", zakat: "زكاة المال", sadaqa: "صدقة", p30: "مستشفى مرسال للأطفال", p31: "مركز مرسال لعلاج الأورام", cases: "حالات المرضى" };
const KINDS = { money: "فلوس", goods: "تبرع عيني" };
const SLOTS = { morning: "صباحاً", afternoon: "بعد الظهر", evening: "مساءً" };
const MAX_AMOUNT = 10000000;
const GOVERNORATES = ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];

// ---------- sanitising ----------
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩", FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function latinDigits(v) {
  return String(v == null ? "" : v).replace(/[٠-٩۰-۹]/g, (c) => { const i = AR_DIGITS.indexOf(c); return String(i >= 0 ? i : FA_DIGITS.indexOf(c)); });
}
// Trim, drop control / invisible characters, collapse whitespace (keeps paragraphs when multiline), cut to max
function clean(v, max, multiline) {
  let s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g, "");
  s = multiline
    ? s.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : s.replace(/\s+/g, " ").trim();
  return s.slice(0, max);
}
// "+20 10 1234 5678", "٠١٠١٢٣٤٥٦٧٨", "1012345678" -> "01012345678"
function normalizePhone(v) {
  let s = latinDigits(v).replace(/[^\d+]/g, "");
  if (s.startsWith("+20")) s = "0" + s.slice(3);
  else if (s.startsWith("0020")) s = "0" + s.slice(4);
  else if (/^20\d{10}$/.test(s)) s = "0" + s.slice(2);
  else if (/^1\d{9}$/.test(s)) s = "0" + s;
  return s.replace(/\D/g, "");
}
const isEgyptMobile = (s) => /^01[0125]\d{8}$/.test(s);
const isEmail = (s) => s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const toInt = (v) => { const s = latinDigits(v).replace(/[\s,]/g, ""); return /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN; };
const pickKey = (map, v) => (has(map, v) ? String(v) : "");
// "" -> general; a PURPOSES key; or a campaign page "p<id>". "" when it is none of those.
const pickPurpose = (v) => (v == null || v === "" ? "general" : has(PURPOSES, v) ? String(v) : /^p\d{1,4}$/.test(String(v)) ? String(v) : "");
const purposeLabel = (p) => PURPOSES[p] || (/^p(\d{1,4})$/.test(p || "") ? "مشروع " + p.slice(1) : p || "");
const truthy = (v) => v === true || v === 1 || v === "1" || v === "true" || v === "on" || v === "yes";
// "5,000", "٥٠٠٠٫٥", 1500 -> number with at most 2 decimals; NaN when it is not a plain positive amount
function toAmount(v) {
  const s = latinDigits(v).replace(/[\s,\u066C]/g, "").replace("\u066B", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return NaN;
  const n = Math.round(parseFloat(s) * 100) / 100;
  return n > 0 && n <= MAX_AMOUNT ? n : NaN;
}
// Today's date in Egypt as YYYY-MM-DD; +/- days. Date checks allow one day of slack for visitors in other time zones.
const cairoDay = cairo.cairoDay;
// a real calendar date "YYYY-MM-DD" (rejects 2026-02-30)
function isDay(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
const fmtAmount = (n) => (n == null || isNaN(n) ? "" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }));

// ---------- validation: { ok, errors: { field: message }, data } ----------
function validate(type, body) {
  const errors = {};
  if (!has(TYPES, type)) return { ok: false, errors: { type: "نوع الطلب غير معروف" }, data: null };
  const b = body && typeof body === "object" ? body : {};
  const err = (k, m) => { errors[k] = m; };
  const d = {};

  d.phone = normalizePhone(b.phone);
  // the contact form may leave the phone empty when it gives an email instead (checked in its branch)
  const phoneGiven = String(b.phone == null ? "" : b.phone).trim() !== "";
  if ((type !== "contact" || phoneGiven) && !isEgyptMobile(d.phone)) err("phone", "اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)");
  if (type === "contact" && !phoneGiven) d.phone = "";

  if (type === "volunteer") {
    d.name = clean(b.name, 80); if (d.name.length < 2) err("name", "اكتب اسمك");
    d.email = clean(b.email, 120).toLowerCase(); if (d.email && !isEmail(d.email)) err("email", "البريد الإلكتروني مش صحيح");
    d.city = clean(b.city, 80); if (d.city.length < 2) err("city", "اكتب المدينة أو المنطقة");
    const age = toInt(b.age); d.age = age >= 16 && age <= 80 ? age : null; if (d.age === null) err("age", "السن من 16 إلى 80 سنة");
    const how = Array.isArray(b.how) ? b.how : typeof b.how === "string" ? b.how.split(",") : [];
    d.how = how.map((k) => pickKey(HOW, String(k).trim())).filter((k, i, a) => k && a.indexOf(k) === i);
    if (!d.how.length) err("how", "اختار طريقة واحدة على الأقل");
    d.howOther = clean(b.howOther, 120); if (d.how.includes("other") && !d.howOther) err("howOther", "اكتب إزاي تحب تساعد");
    d.availability = pickKey(AVAILABILITY, b.availability); if (!d.availability) err("availability", "اختار الوقت المناسب ليك");
    d.message = clean(b.message, 1000, true);
  } else if (type === "transfer") {
    d.name = clean(b.name, 80); if (d.name.length < 2) err("name", "اكتب اسمك");
    d.email = clean(b.email, 120).toLowerCase(); if (d.email && !isEmail(d.email)) err("email", "البريد الإلكتروني مش صحيح");
    d.method = pickKey(METHODS, b.method); if (!d.method) err("method", "اختار طريقة التبرع");
    d.bank = d.method === "bank" ? clean(b.bank, 80) : "";
    if (d.method === "bank" && d.bank.length < 2) err("bank", "اختار البنك اللي حوّلت عليه");
    d.amount = toAmount(b.amount); if (isNaN(d.amount)) { d.amount = null; err("amount", "اكتب المبلغ (رقم أكبر من صفر)"); }
    d.currency = b.currency == null || b.currency === "" ? "EGP" : pickKey(CURRENCIES, String(b.currency).toUpperCase());
    if (!d.currency) err("currency", "اختار العملة");
    d.date = clean(b.date, 10);
    if (!isDay(d.date)) { d.date = ""; err("date", "اختار تاريخ التحويل"); }
    else if (d.date > cairoDay(1)) err("date", "تاريخ التحويل مينفعش يكون في المستقبل");
    else if (d.date < cairoDay(-731)) err("date", "التاريخ ده قديم أوي - كلمنا على 19340");
    d.txRef = clean(b.txRef, 60);
    d.purpose = pickPurpose(b.purpose); if (!d.purpose) err("purpose", "اختار الغرض من التبرع");
    d.caseCode = latinDigits(clean(b.caseCode, 40)).replace(/\s+/g, "").toUpperCase();
    if (d.caseCode && !/^[A-Z0-9-]{1,20}$/.test(d.caseCode)) err("caseCode", "كود الحالة حروف إنجليزي وأرقام بس (لحد 20)");
    d.notes = clean(b.notes, 1000, true);
  } else if (type === "pickup") {
    d.name = clean(b.name, 80); if (d.name.length < 2) err("name", "اكتب اسمك");
    d.altPhone = normalizePhone(b.altPhone); if (d.altPhone && !isEgyptMobile(d.altPhone)) err("altPhone", "الرقم التاني مش صحيح (01xxxxxxxxx)");
    if (d.altPhone && d.altPhone === d.phone) d.altPhone = "";
    d.gov = clean(b.gov, 40); if (!GOVERNORATES.includes(d.gov)) { d.gov = ""; err("gov", "اختار المحافظة"); }
    d.area = clean(b.area, 80); if (d.area.length < 2) err("area", "اكتب المنطقة أو الحي");
    d.address = clean(b.address, 300, true); if (d.address.length < 8) err("address", "اكتب العنوان بالتفصيل (الشارع ورقم العمارة والدور)");
    d.kind = pickKey(KINDS, b.kind); if (!d.kind) err("kind", "اختار نوع التبرع");
    d.amount = null; d.purpose = ""; d.goods = "";
    if (d.kind === "money") {
      d.amount = toAmount(b.amount); if (isNaN(d.amount)) { d.amount = null; err("amount", "اكتب المبلغ (رقم أكبر من صفر)"); }
      d.purpose = pickPurpose(b.purpose); if (!d.purpose) err("purpose", "اختار الغرض من التبرع");
    } else if (d.kind === "goods") {
      d.goods = clean(b.goods, 500, true); if (d.goods.length < 3) err("goods", "اكتب إيه اللي حابب تتبرع بيه");
    }
    d.date = clean(b.date, 10);
    if (!isDay(d.date)) { d.date = ""; err("date", "اختار اليوم المناسب للتحصيل"); }
    else if (d.date < cairoDay(-1)) err("date", "اختار يوم من النهارده أو بعده");
    else if (d.date > cairoDay(62)) err("date", "اختار يوم خلال الشهرين الجايين");
    d.slot = pickKey(SLOTS, b.slot); if (!d.slot) err("slot", "اختار الوقت المناسب");
    d.notes = clean(b.notes, 1000, true);
  } else if (type === "contact") {
    d.name = clean(b.name, 80); if (d.name.length < 2) err("name", "اكتب اسمك");
    d.email = clean(b.email, 120).toLowerCase(); if (d.email && !isEmail(d.email)) err("email", "البريد الإلكتروني مش صحيح");
    if (!phoneGiven && !d.email && !errors.email) err("phone", "اكتب رقم موبايل أو بريد إلكتروني عشان نقدر نرد عليك");
    d.message = clean(b.message, 2000, true); if (d.message.length < 10) err("message", "اكتب رسالتك (10 حروف على الأقل)");
  } else {
    d.patient = clean(b.patient, 80); if (d.patient.length < 2) err("patient", "اكتب اسم المريض");
    d.requester = clean(b.requester, 80); if (d.requester.length < 2) err("requester", "اكتب اسم مقدم الطلب");
    d.relation = pickKey(RELATION, b.relation); if (!d.relation) err("relation", "اختار صلة القرابة");
    d.altPhone = normalizePhone(b.altPhone); if (d.altPhone && !isEgyptMobile(d.altPhone)) err("altPhone", "الرقم البديل مش صحيح (01xxxxxxxxx)");
    if (d.altPhone && d.altPhone === d.phone) d.altPhone = "";
    d.gov = clean(b.gov, 40); if (!GOVERNORATES.includes(d.gov)) { d.gov = ""; err("gov", "اختار المحافظة"); }
    d.city = clean(b.city, 80);
    d.caseType = pickKey(CASE_TYPES, b.caseType); if (!d.caseType) err("caseType", "اختار نوع الحالة");
    d.hospital = clean(b.hospital, 160);
    d.description = clean(b.description, 1500, true); if (d.description.length < 10) err("description", "اكتب وصف مختصر للحالة (10 حروف على الأقل)");
    if (b.income === "" || b.income == null) d.income = null;
    else { const inc = toInt(b.income); d.income = inc >= 0 && inc <= 1000000 ? inc : null; if (d.income === null) err("income", "الدخل الشهري رقم من 0 إلى 1,000,000"); }
    d.consent = truthy(b.consent); if (!d.consent) err("consent", "لازم توافق على استخدام بياناتك عشان نقدر نتواصل معاك");
  }
  return { ok: !Object.keys(errors).length, errors, data: d };
}

// Honeypot field "website" must stay empty; "t" = seconds the person spent on the page (js/forms.js always sends it).
// "honeypot" / "too-fast" are dropped quietly (the bot sees a success); "no-time" (t missing or not a number) is a 400.
function botCheck(body) {
  const b = body && typeof body === "object" ? body : {};
  if (String(b.website || "").trim()) return "honeypot";
  const t = typeof b.t === "number" ? b.t : typeof b.t === "string" && /^\s*\d{1,7}(\.\d+)?\s*$/.test(b.t) ? Number(b.t) : NaN;
  if (!Number.isFinite(t)) return "no-time";
  if (t < 2) return "too-fast";
  return null;
}

// ---------- rate limit (lib/limits.js): per visitor IP and for everyone, per hour ----------
const perIp = () => limits.setting("FORMS_RATE_LIMIT", 5);
const perHour = () => limits.setting("FORMS_GLOBAL_LIMIT", 300);
async function rateAllowed(ip, now = Date.now(), log) {
  return (await limits.allowed("forms", ip, perIp(), now, log)) && (await limits.allowed("forms", "*", perHour(), now, log));
}
async function rateHit(ip, now = Date.now(), log) { await limits.hit("forms", ip, now, log); await limits.hit("forms", "*", now, log); }
const clientIp = limits.clientIp;

// ---------- records ----------
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRef(type, date = new Date()) {
  const ymd = cairoDay(0, date).replace(/-/g, ""); // the Egyptian calendar day, like the console's date filters
  const rnd = Array.from(crypto.randomBytes(5), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${TYPES[type].prefix}-${ymd}-${rnd}`;
}
const BY_PREFIX = Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [t.prefix, k]));
const ID_RE = /^(M[A-Z])-\d{8}-[A-Z2-9]{5}$/;
function typeOf(id) { const m = ID_RE.exec(String(id || "")); return m && has(BY_PREFIX, m[1]) ? BY_PREFIX[m[1]] : null; }

function summary(type, d) {
  if (type === "volunteer") {
    const how = d.how.map((k) => (k === "other" && d.howOther ? d.howOther : HOW[k])).join("، ");
    return [how, AVAILABILITY[d.availability], d.message].filter(Boolean).join(" · ").slice(0, 160);
  }
  if (type === "transfer") {
    const via = METHODS[d.method] + (d.bank ? " - " + d.bank : "");
    return [fmtAmount(d.amount) + " " + CURRENCIES[d.currency], via, d.date, purposeLabel(d.purpose), d.caseCode && "كود الحالة " + d.caseCode, d.notes].filter(Boolean).join(" · ").slice(0, 160);
  }
  if (type === "pickup") {
    const what = d.kind === "money" ? "فلوس " + fmtAmount(d.amount) + " جنيه" : "تبرع عيني: " + d.goods;
    return [what, d.kind === "money" && purposeLabel(d.purpose), d.date + " " + SLOTS[d.slot], d.notes].filter(Boolean).join(" · ").slice(0, 160);
  }
  if (type === "contact") return d.message.replace(/\s+/g, " ").slice(0, 160);
  return [CASE_TYPES[d.caseType], d.hospital, d.description].filter(Boolean).join(" · ").slice(0, 160);
}
// meta = the few fields the admin list and its CSV need without parsing the full data
function metaOf(type, d) {
  if (type === "transfer") return { amount: d.amount, currency: d.currency, method: d.method, bank: d.bank, date: d.date, purpose: d.purpose, caseCode: d.caseCode };
  if (type === "pickup") return { kind: d.kind, amount: d.amount, currency: d.kind === "money" ? "EGP" : "", purpose: d.purpose, area: d.area, date: d.date, slot: d.slot };
  return null;
}
function makeRecord(type, d, now = new Date()) {
  const rec = {
    id: makeRef(type, now), type, createdAt: now.toISOString(), status: "new", note: "",
    name: type === "help" ? d.patient : d.name, phone: d.phone, altPhone: d.altPhone || "", email: d.email || "",
    city: (type === "pickup" ? d.area : d.city) || "", gov: d.gov || "", summary: summary(type, d), source: "website", data: d,
  };
  const meta = metaOf(type, d); if (meta) rec.meta = meta;
  return rec;
}
const compact = (r) => { const { data, ...rest } = r; return rest; };
const toEntity = (r) => ({ partitionKey: r.type, rowKey: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt || "", status: r.status, note: r.note || "", name: r.name, phone: r.phone, altPhone: r.altPhone || "", email: r.email || "", city: r.city || "", gov: r.gov || "", summary: r.summary || "", source: r.source || "website", payload: JSON.stringify(r.data || {}), ...(r.meta ? { meta: JSON.stringify(r.meta) } : {}) });
function fromEntity(e) {
  let data = {}; try { data = JSON.parse(e.payload || "{}"); } catch { /* keep {} */ }
  const r = { id: e.rowKey, type: e.partitionKey, createdAt: e.createdAt, updatedAt: e.updatedAt || "", status: e.status, note: e.note || "", name: e.name, phone: e.phone, altPhone: e.altPhone || "", email: e.email || "", city: e.city || "", gov: e.gov || "", summary: e.summary || "", source: e.source || "", data };
  if (e.meta) { try { r.meta = JSON.parse(e.meta); } catch { /* skip */ } }
  return r;
}

// ---------- storage: Azure Table only ----------
function tableClient() {
  const cs = process.env.DONATIONS_STORAGE;
  if (!cs || !TableClient) return null;
  return TableClient.fromConnectionString(cs, TABLE);
}
const enabled = () => ({ table: !!(process.env.DONATIONS_STORAGE && TableClient), webhook: !!process.env.FORMS_WEBHOOK_URL });
const unavailable = (message) => Object.assign(new Error(message), { status: 503 });
const NO_TABLE = "الطلبات مش بتتحفظ: ضيف DONATIONS_STORAGE (Azure Table) في إعدادات Azure";

// Returns "table", or null when no table is configured. Throws (status 503) when the table write fails.
async function save(rec, log = () => {}) {
  const c = tableClient();
  if (!c) return null;
  try { try { await c.createTable(); } catch { /* exists */ } await c.upsertEntity(toEntity(rec), "Merge"); return "table"; }
  catch (e) { log("requests: table save failed", e.message); const x = unavailable("تعذّر حفظ الطلب دلوقتي"); x.cause = e; throw x; }
}

// { store: "table" | null, rows } - newest first. from / to are Cairo calendar days.
async function list(f = {}) {
  const c = tableClient();
  if (!c) return { store: null, rows: [] };
  try { await c.createTable(); } catch { /* exists */ }
  const type = has(TYPES, f.type) ? f.type : "";
  let rows = [];
  const opts = type ? { queryOptions: { filter: `PartitionKey eq '${type}'` } } : undefined;
  for await (const e of c.listEntities(opts)) rows.push(fromEntity(e));
  const r = cairo.range(f.from, f.to);
  rows = rows.filter((x) => (!type || x.type === type) && (!STATUSES.includes(f.status) || x.status === f.status) && cairo.inRange(x.createdAt, r));
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return { store: "table", rows };
}

async function get(id) {
  const type = typeOf(id); if (!type) return null;
  const c = tableClient();
  if (!c) return null;
  try { return fromEntity(await c.getEntity(type, id)); }
  catch (e) { if (e.statusCode === 404 || /ResourceNotFound/.test(e.message)) return null; throw e; }
}

// patch = { status?, note? } -> updated record (or null when the id is unknown)
async function update(id, patch) {
  const type = typeOf(id);
  if (!type) { const e = new Error("رقم طلب غير صحيح"); e.status = 400; throw e; }
  const p = {};
  if (patch.status !== undefined) { if (!STATUSES.includes(patch.status)) { const e = new Error("حالة غير معروفة"); e.status = 400; throw e; } p.status = patch.status; }
  if (patch.note !== undefined) p.note = clean(patch.note, 500, true);
  if (!Object.keys(p).length) { const e = new Error("مفيش حاجة تتعدل"); e.status = 400; throw e; }
  p.updatedAt = new Date().toISOString();
  const c = tableClient();
  if (!c) throw unavailable(NO_TABLE);
  try { await c.updateEntity({ partitionKey: type, rowKey: id, ...p }, "Merge"); }
  catch (e) { if (e.statusCode === 404 || /ResourceNotFound/.test(e.message)) return null; throw e; }
  return fromEntity(await c.getEntity(type, id));
}

// ---------- webhook (same shape as the donation forward in lib/mpgs.js) ----------
async function forward(rec, log = () => {}) {
  const url = process.env.FORMS_WEBHOOK_URL;
  if (!url) return { forwarded: false };
  const body = JSON.stringify({ ...rec, source: "mersal-website", event: `request.${rec.type}` });
  const headers = { "Content-Type": "application/json", "X-Mersal-Event": `request.${rec.type}` };
  const secret = process.env.FORMS_WEBHOOK_SECRET || process.env.DONATION_WEBHOOK_SECRET;
  if (secret) headers["X-Mersal-Signature"] = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    const r = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
    if (!r.ok) log("requests: webhook returned", r.status, rec.id);
    return { forwarded: r.ok };
  } catch (e) { log("requests: webhook failed", e.message, rec.id); return { forwarded: false }; }
}

module.exports = {
  TYPES, STATUSES, STATUS_LABELS, HOW, AVAILABILITY, RELATION, CASE_TYPES, GOVERNORATES, METHODS, CURRENCIES, PURPOSES, KINDS, SLOTS,
  latinDigits, clean, normalizePhone, isEgyptMobile, isEmail, toAmount, cairoDay, isDay, validate, botCheck, pickPurpose, purposeLabel, hasType: (t) => has(TYPES, t),
  rateAllowed, rateHit, clientIp, makeRef, typeOf, summary, metaOf, makeRecord, toEntity, fromEntity,
  enabled, save, list, get, update, forward, _hits: limits._mem,
};
