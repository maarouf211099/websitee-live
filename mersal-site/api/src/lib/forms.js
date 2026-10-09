// Public request forms (volunteer / help): validation, bot checks, rate limit and storage.
//
// Storage, in order of preference:
//   1. Azure Table "requests" in the DONATIONS_STORAGE account (partitionKey = type, rowKey = reference id)
//   2. GitHub: api/data/requests/<id>.json + api/data/requests/index.json committed through lib/admin.js
//      (api/ is not served publicly, and only those paths are whitelisted there)
// Optional: FORMS_WEBHOOK_URL gets a POST per request, signed with FORMS_WEBHOOK_SECRET (or DONATION_WEBHOOK_SECRET)
// the same way verify.js forwards donations. FORMS_RATE_LIMIT (default 5) = submissions per IP per hour.
const crypto = require("crypto");
const admin = require("./admin");
let TableClient = null;
try { ({ TableClient } = require("@azure/data-tables")); } catch { /* dependency not installed */ }

const TABLE = "requests";
const INDEX = "api/data/requests/index.json";
const INDEX_MAX = 2000; // the GitHub contents API only returns files under 1 MB; older requests stay as single files
const fileOf = (id) => `api/data/requests/${id}.json`;

const TYPES = { volunteer: { prefix: "MV", label: "تطوع" }, help: { prefix: "MH", label: "طلب مساعدة" } };
const STATUSES = ["new", "contacted", "done", "rejected"];
const STATUS_LABELS = { new: "جديد", contacted: "تم التواصل", done: "تم", rejected: "مرفوض" };
const HOW = { hospital: "مستشفى", convoys: "قوافل", design: "تصميم / سوشيال ميديا", fundraising: "جمع تبرعات", other: "أخرى" };
const AVAILABILITY = { weekdays: "أيام الأسبوع", weekends: "نهاية الأسبوع", flexible: "مرن / حسب الحاجة", online: "أونلاين فقط" };
const RELATION = { self: "المريض نفسه", parent: "الأب / الأم", child: "الابن / الابنة", spouse: "الزوج / الزوجة", sibling: "الأخ / الأخت", relative: "قريب", other: "أخرى" };
const CASE_TYPES = { monthly: "علاج شهري", surgery: "عملية", oncology: "أورام", children: "أطفال", other: "أخرى" };
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
const pickKey = (map, v) => (v != null && Object.prototype.hasOwnProperty.call(map, String(v)) ? String(v) : "");
const truthy = (v) => v === true || v === 1 || v === "1" || v === "true" || v === "on" || v === "yes";

// ---------- validation: { ok, errors: { field: message }, data } ----------
function validate(type, body) {
  const errors = {};
  if (!TYPES[type]) return { ok: false, errors: { type: "نوع الطلب غير معروف" }, data: null };
  const b = body && typeof body === "object" ? body : {};
  const err = (k, m) => { errors[k] = m; };
  const d = {};

  d.phone = normalizePhone(b.phone);
  if (!isEgyptMobile(d.phone)) err("phone", "اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)");

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

// Honeypot field "website" must stay empty; "t" = seconds the person spent on the page (sent by the page)
function botCheck(body) {
  const b = body && typeof body === "object" ? body : {};
  if (String(b.website || "").trim()) return "honeypot";
  if (b.t !== undefined && b.t !== null && b.t !== "") { const t = Number(b.t); if (!(t >= 2)) return "too-fast"; }
  return null;
}

// ---------- rate limit: FORMS_RATE_LIMIT (5) accepted submissions per IP per hour, per function instance ----------
const hits = new Map();
const WINDOW = 3600e3;
function rateAllowed(ip, now = Date.now()) {
  const limit = Math.max(1, parseInt(process.env.FORMS_RATE_LIMIT, 10) || 5);
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  hits.set(ip, arr);
  return arr.length < limit;
}
function rateHit(ip, now = Date.now()) {
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW); arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k);
}
function clientIp(req) {
  let ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, "");
  else if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]"));
  return ip || "local";
}

// ---------- records ----------
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRef(type, date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rnd = Array.from(crypto.randomBytes(5), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${TYPES[type].prefix}-${ymd}-${rnd}`;
}
const ID_RE = /^M([VH])-\d{8}-[A-Z2-9]{5}$/;
function typeOf(id) { const m = ID_RE.exec(String(id || "")); return m ? (m[1] === "V" ? "volunteer" : "help") : null; }

function summary(type, d) {
  if (type === "volunteer") {
    const how = d.how.map((k) => (k === "other" && d.howOther ? d.howOther : HOW[k])).join("، ");
    return [how, AVAILABILITY[d.availability], d.message].filter(Boolean).join(" · ").slice(0, 160);
  }
  return [CASE_TYPES[d.caseType], d.hospital, d.description].filter(Boolean).join(" · ").slice(0, 160);
}
function makeRecord(type, d, now = new Date()) {
  return {
    id: makeRef(type, now), type, createdAt: now.toISOString(), status: "new", note: "",
    name: type === "help" ? d.patient : d.name, phone: d.phone, altPhone: d.altPhone || "", email: d.email || "",
    city: d.city || "", gov: d.gov || "", summary: summary(type, d), source: "website", data: d,
  };
}
const compact = (r) => { const { data, ...rest } = r; return rest; };
const toEntity = (r) => ({ partitionKey: r.type, rowKey: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt || "", status: r.status, note: r.note || "", name: r.name, phone: r.phone, altPhone: r.altPhone || "", email: r.email || "", city: r.city || "", gov: r.gov || "", summary: r.summary || "", source: r.source || "website", payload: JSON.stringify(r.data || {}) });
function fromEntity(e) {
  let data = {}; try { data = JSON.parse(e.payload || "{}"); } catch { /* keep {} */ }
  return { id: e.rowKey, type: e.partitionKey, createdAt: e.createdAt, updatedAt: e.updatedAt || "", status: e.status, note: e.note || "", name: e.name, phone: e.phone, altPhone: e.altPhone || "", email: e.email || "", city: e.city || "", gov: e.gov || "", summary: e.summary || "", source: e.source || "", data };
}

// ---------- storage ----------
function tableClient() {
  const cs = process.env.DONATIONS_STORAGE;
  if (!cs || !TableClient) return null;
  return TableClient.fromConnectionString(cs, TABLE);
}
const githubReady = () => !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
const enabled = () => ({ table: !!(process.env.DONATIONS_STORAGE && TableClient), github: githubReady(), webhook: !!process.env.FORMS_WEBHOOK_URL });
const BOT = { name: "Mersal website", email: "forms@mersal-ngo.org" };

async function readJson(path, fallback) {
  try { return JSON.parse(await admin.readFile(path)); }
  catch (e) { if (/GitHub 404/.test(e.message)) return fallback; throw e; }
}
// commitFiles refuses a stale parent (force: false); two requests in the same second just retry.
// build() returns the files to commit, or null to skip (e.g. unknown id).
async function commitRetry(build, message, who) {
  for (let i = 0; ; i++) {
    try { const files = await build(); return files ? await admin.commitFiles(files, message, who) : null; }
    catch (e) { if (i >= 2 || !/GitHub (409|422)/.test(e.message)) throw e; }
  }
}

// Returns "table" | "github" | null (nothing configured). A failing table falls back to GitHub.
async function save(rec, log = () => {}) {
  const c = tableClient();
  if (c) {
    try { try { await c.createTable(); } catch { /* exists */ } await c.upsertEntity(toEntity(rec), "Merge"); return "table"; }
    catch (e) { log("requests: table save failed, trying GitHub", e.message); if (!githubReady()) throw e; }
  }
  if (!githubReady()) return null;
  await commitRetry(async () => {
    const index = await readJson(INDEX, []);
    const next = [compact(rec)].concat((Array.isArray(index) ? index : []).filter((r) => r.id !== rec.id)).slice(0, INDEX_MAX);
    return [{ path: fileOf(rec.id), content: JSON.stringify(rec, null, 2) + "\n" }, { path: INDEX, content: JSON.stringify(next) + "\n" }];
  }, `request: ${TYPES[rec.type].label} ${rec.id}`, BOT);
  return "github";
}

const dateOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
// { store: "table" | "github" | null, rows } - newest first. Table rows carry .data; GitHub index rows need get(id) for it.
async function list(f = {}) {
  let rows = null, store = null;
  const c = tableClient();
  if (c) {
    try { await c.createTable(); } catch { /* exists */ }
    rows = [];
    const opts = TYPES[f.type] ? { queryOptions: { filter: `PartitionKey eq '${f.type}'` } } : undefined;
    for await (const e of c.listEntities(opts)) rows.push(fromEntity(e));
    store = "table";
  } else if (githubReady()) {
    const idx = await readJson(INDEX, []); rows = Array.isArray(idx) ? idx : []; store = "github";
  }
  if (!rows) return { store: null, rows: [] };
  rows = rows.filter((r) => (!TYPES[f.type] || r.type === f.type) && (!STATUSES.includes(f.status) || r.status === f.status)
    && (!dateOk(f.from) || r.createdAt >= f.from) && (!dateOk(f.to) || r.createdAt <= f.to + "T23:59:59.999Z"));
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return { store, rows };
}

async function get(id) {
  const type = typeOf(id); if (!type) return null;
  const c = tableClient();
  if (c) {
    try { return fromEntity(await c.getEntity(type, id)); }
    catch (e) { if (e.statusCode === 404 || /ResourceNotFound/.test(e.message)) return null; throw e; }
  }
  if (!githubReady()) return null;
  return readJson(fileOf(id), null);
}

// patch = { status?, note? } -> updated record (or null when the id is unknown)
async function update(id, patch, who) {
  const type = typeOf(id);
  if (!type) { const e = new Error("رقم طلب غير صحيح"); e.status = 400; throw e; }
  const p = {};
  if (patch.status !== undefined) { if (!STATUSES.includes(patch.status)) { const e = new Error("حالة غير معروفة"); e.status = 400; throw e; } p.status = patch.status; }
  if (patch.note !== undefined) p.note = clean(patch.note, 500, true);
  if (!Object.keys(p).length) { const e = new Error("مفيش حاجة تتعدل"); e.status = 400; throw e; }
  p.updatedAt = new Date().toISOString();
  const c = tableClient();
  if (c) {
    try { await c.updateEntity({ partitionKey: type, rowKey: id, ...p }, "Merge"); }
    catch (e) { if (e.statusCode === 404 || /ResourceNotFound/.test(e.message)) return null; throw e; }
    return fromEntity(await c.getEntity(type, id));
  }
  if (!githubReady()) { const e = new Error("مفيش مكان تخزين متظبط (DONATIONS_STORAGE أو GITHUB_TOKEN)"); e.status = 503; throw e; }
  let out = null;
  await commitRetry(async () => {
    const rec = await readJson(fileOf(id), null);
    if (!rec) return null;
    Object.assign(rec, p); out = rec;
    const index = await readJson(INDEX, []);
    const next = (Array.isArray(index) ? index : []).map((r) => (r.id === id ? { ...r, ...p } : r));
    if (!next.some((r) => r.id === id)) next.unshift(compact(rec));
    return [{ path: fileOf(id), content: JSON.stringify(rec, null, 2) + "\n" }, { path: INDEX, content: JSON.stringify(next.slice(0, INDEX_MAX)) + "\n" }];
  }, `request: ${id} -> ${p.status || "note"}`, who || BOT);
  return out;
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
  TYPES, STATUSES, STATUS_LABELS, HOW, AVAILABILITY, RELATION, CASE_TYPES, GOVERNORATES, INDEX, fileOf,
  latinDigits, clean, normalizePhone, isEgyptMobile, isEmail, validate, botCheck,
  rateAllowed, rateHit, clientIp, makeRef, typeOf, summary, makeRecord, toEntity, fromEntity,
  enabled, save, list, get, update, forward, _hits: hits,
};
