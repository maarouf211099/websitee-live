// Paymob through the Mersal app's own backend (payProvider "app"): the same Supabase Edge Functions the Mersal mobile app
// and the other Mersal website (maarouf211099/mersal-website, src/app/api/donate) already use, so the Paymob keys stay in
// that Supabase project and this site needs no PAYMOB_* settings. The donation is recorded there, in the app's
// `donations` table (sub_option "website"), next to the app's own donations.
//   POST <functions>/payments-donations  { campaignId, amountEgp, donorName, donorPhone, donorEmail?, subOption }
//        headers apikey + Authorization: Bearer <publishable key>, x-idempotency-key, x-client-info
//        -> { iframeUrl, orderId: "mersal-…" }   (Paymob checkout, shown inside the donate page)
//   GET  <functions>/donation-status?order_id=…[&cancelled=true]
//        -> { status: "paid" | "pending" | "failed" | "refunded" | "unknown" | …, amount_egp, campaign_id, campaign_title_ar }
// The publishable key is Supabase's browser key (the app and the other site ship it to every device; Row Level Security
// decides what it can do), not a secret. MERSAL_SUPABASE_URL / MERSAL_SUPABASE_KEY override both defaults.
"use strict";

const DEFAULT_URL = "https://uakgepdjtqrxgcavxpdm.supabase.co";
const DEFAULT_KEY = "sb_publishable__8Lm_5dEVR4_iuMgWI1GpA_ipun_mZr";
const env = (k) => String(process.env[k] || "").trim();
const CREATE_TIMEOUT = 15000, STATUS_TIMEOUT = 8000;

const URL_RE = /^https:\/\/[A-Za-z0-9.-]+(:\d+)?\/*$/;
function cfg() {
  const u = env("MERSAL_SUPABASE_URL");
  const url = u && URL_RE.test(u) ? u.replace(/\/+$/, "") : DEFAULT_URL;
  return { url, key: env("MERSAL_SUPABASE_KEY") || DEFAULT_KEY, functions: `${url}/functions/v1` };
}
// Names of the overrides that are set but unusable ([] = ready; the defaults always are)
function missing() {
  const out = [];
  if (env("MERSAL_SUPABASE_URL") && !URL_RE.test(env("MERSAL_SUPABASE_URL"))) out.push("MERSAL_SUPABASE_URL");
  return out;
}
const err = (status, message) => Object.assign(new Error(message), { status });
const redact = (t) => { let s = String(t == null ? "" : t); const k = cfg().key; if (k.length >= 8) s = s.split(k).join("***"); return s.slice(0, 300); };

// The app's campaigns (its `campaigns` table) for this site's purposes. Same choices as the foundation's own dashboard for
// the other website (web_projects.campaign_id): the hospital and most projects go to the general donation campaign, the
// oncology centre to "zakat - oncology patients", the monthly treatment to "zakat - Sanad card".
const GENERAL = "c4835befefa";
const CAMPAIGNS = {
  general: GENERAL, cases: GENERAL, hospital: GENERAL,
  zakat: "zakat:zakat-patients", sadaqa: "sadaqa:sadaqa-general",
  oncology: "zakat:zakat-oncology", p31: "zakat:zakat-oncology", p4: "zakat:zakat-oncology", p5: "zakat:zakat-oncology",
  p37: "zakat:zakat-sanad",
};
const campaignFor = (purpose) => (Object.prototype.hasOwnProperty.call(CAMPAIGNS, purpose) ? CAMPAIGNS[purpose] : GENERAL);

// Arabic-Indic / Persian digits -> 0-9
const asciiDigits = (s) => String(s == null ? "" : s).replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0));
// An Egyptian mobile number as 01xxxxxxxxx (+20 / 0020 / 20 prefixes accepted, with or without the trunk 0), or null. The app's function takes only these.
function egyptMobile(p) {
  let d = asciiDigits(p).replace(/[^\d+]/g, "");
  d = d.replace(/^\+/, "").replace(/^00/, "");
  if (/^200?1[0125]\d{8}$/.test(d)) d = "0" + d.replace(/^200?/, ""); // +20 1…, and +20 01… with the trunk 0 kept
  else if (/^1[0125]\d{8}$/.test(d)) d = "0" + d;
  return /^01[0125]\d{8}$/.test(d) ? d : null;
}
// The app's order references: "mersal-…" (what the other website accepts), printable, at most 160 characters
const validOrderId = (id) => typeof id === "string" && id.length <= 160 && /^mersal-[^\s\u0000-\u001f\u007f]{1,153}$/.test(id);
// Paymob's own pages only, never another address inside the donate page
function checkoutUrlOk(u) {
  try { const x = new URL(String(u)); return x.protocol === "https:" && (x.hostname === "paymob.com" || x.hostname.endsWith(".paymob.com")); }
  catch { return false; }
}

async function call(method, path, { body, headers = {}, timeout }) {
  const c = cfg();
  try {
    const res = await fetch(c.functions + path, {
      method,
      headers: { Accept: "application/json", apikey: c.key, Authorization: `Bearer ${c.key}`, ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    return { status: res.status, data: data && typeof data === "object" ? data : {} };
  } catch (e) {
    return { status: 0, data: { error: e && e.name === "TimeoutError" ? "timeout" : "network" } };
  }
}

// -> { orderId, checkoutUrl }; throws { status: 400 } when the app's function refuses the donation itself, 502 otherwise
async function createDonation({ amount, purpose, name, email, phone, idempotencyKey }) {
  const donorPhone = egyptMobile(phone);
  if (!donorPhone) throw err(400, "phone");
  if (!Number.isInteger(amount) || amount <= 0) throw err(400, "amount");
  const r = await call("POST", "/payments-donations", {
    headers: { "x-idempotency-key": idempotencyKey, "x-client-info": "mersal-website" },
    body: {
      campaignId: campaignFor(purpose), amountEgp: amount, donorName: String(name || "").slice(0, 120), donorPhone,
      ...(email ? { donorEmail: String(email).slice(0, 120) } : {}), subOption: "website",
    },
    timeout: CREATE_TIMEOUT,
  });
  if (r.status === 400) throw err(400, redact(r.data.error || "rejected"));
  if (r.status < 200 || r.status >= 300) throw err(502, `payments-donations ${r.status}: ${redact(r.data.error || r.data.raw || "")}`);
  const orderId = r.data.orderId, url = r.data.iframeUrl;
  if (!validOrderId(orderId)) throw err(502, "payments-donations: no order reference");
  if (!checkoutUrlOk(url)) throw err(502, "payments-donations: checkout URL is not a Paymob page");
  return { orderId, checkoutUrl: String(url) };
}

// -> { orderId, paid, status: "CAPTURED" | "PENDING" | "UNKNOWN" | "FAILED" | "REFUNDED" | …, amount, campaign } or { error }
async function donationStatus(orderId, { cancelled = false } = {}) {
  if (!validOrderId(orderId)) return { error: "bad order" };
  const r = await call("GET", `/donation-status?order_id=${encodeURIComponent(orderId)}${cancelled ? "&cancelled=true" : ""}`, { timeout: STATUS_TIMEOUT });
  if (r.status < 200 || r.status >= 300) return { error: `donation-status ${r.status}: ${redact(r.data.error || r.data.raw || "")}` };
  const raw = String(r.data.status || "unknown").toLowerCase();
  const status = raw === "paid" ? "CAPTURED" : /^[a-z_]{1,20}$/.test(raw) ? raw.toUpperCase() : "UNKNOWN";
  const amount = Number(r.data.amount_egp);
  return {
    orderId, paid: raw === "paid", status,
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    campaign: typeof r.data.campaign_title_ar === "string" ? r.data.campaign_title_ar.slice(0, 80) : null,
  };
}

module.exports = { cfg, missing, campaignFor, CAMPAIGNS, GENERAL, egyptMobile, asciiDigits, validOrderId, checkoutUrlOk, createDonation, donationStatus, redact, DEFAULT_URL, CREATE_TIMEOUT, STATUS_TIMEOUT };
