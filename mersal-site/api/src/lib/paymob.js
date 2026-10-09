// Paymob (Accept, Egypt) helpers: Intention API + Unified Checkout redirect, HMAC verification of the transaction
// callbacks (server POST and browser redirect), and the authoritative transaction retrieval (Transaction Inquiry).
// All credentials come from the Static Web App's application settings - never from code (the repository is public):
//   PAYMOB_SECRET_KEY       Secret Key (egy_sk_test_… / egy_sk_live_…)  "Authorization: Token …" on /v1/intention/
//   PAYMOB_PUBLIC_KEY       Public Key (egy_pk_…), the only key that reaches the browser (in the checkout URL)
//   PAYMOB_API_KEY          API Key (same in test and live), only for POST /api/auth/tokens -> Bearer token for retrieval
//   PAYMOB_HMAC_SECRET      HMAC Secret, verifies the callback and the redirect
//   PAYMOB_INTEGRATION_IDS  comma-separated integer Integration IDs, same mode as the keys (first = card, e.g. card,wallet)
//   PAYMOB_BASE_URL         optional, default https://accept.paymob.com (the same host serves test and live)
//   PAYMOB_CHECKOUT_URL     optional, default https://eg.checkout.paymob.com/
// Amounts are integer piasters ("cents") everywhere: 100.00 EGP = 10000. Nothing secret is ever logged or returned.
"use strict";
const crypto = require("crypto");
const cairo = require("./cairo");

const env = (k) => String(process.env[k] || "").trim();
const DEFAULT_BASE = "https://accept.paymob.com", DEFAULT_CHECKOUT = "https://eg.checkout.paymob.com/";
const REQUIRED = ["PAYMOB_SECRET_KEY", "PAYMOB_PUBLIC_KEY", "PAYMOB_API_KEY", "PAYMOB_HMAC_SECRET", "PAYMOB_INTEGRATION_IDS"];
const httpsUrl = (v, def) => (/^https:\/\/[A-Za-z0-9.-]+(:\d+)?(\/[^\s]*)?$/.test(v) ? v : def);

// [1234567, 7654321] from "1234567, 7654321" ([] when empty or when any entry is not an integer)
function integrationIds() {
  const parts = env("PAYMOB_INTEGRATION_IDS").split(/[\s,;]+/).filter(Boolean);
  if (!parts.length || !parts.every((x) => /^\d{1,12}$/.test(x))) return [];
  return [...new Set(parts.map(Number))];
}
function cfg() {
  return {
    base: httpsUrl(env("PAYMOB_BASE_URL"), DEFAULT_BASE).replace(/\/+$/, ""),
    checkout: httpsUrl(env("PAYMOB_CHECKOUT_URL"), DEFAULT_CHECKOUT),
    secretKey: env("PAYMOB_SECRET_KEY"), publicKey: env("PAYMOB_PUBLIC_KEY"), apiKey: env("PAYMOB_API_KEY"), hmacSecret: env("PAYMOB_HMAC_SECRET"),
    integrationIds: integrationIds(),
  };
}
// Names (never values) of the Paymob settings that are missing or invalid
const missing = () => REQUIRED.filter((k) => (k === "PAYMOB_INTEGRATION_IDS" ? !integrationIds().length : !env(k)));
const configured = () => missing().length === 0;
// "test" | "live" from the Secret Key's prefix, null when it cannot be told (prefixes are not validated strictly)
function mode() {
  const k = env("PAYMOB_SECRET_KEY").toLowerCase();
  return /sk_?test/.test(k) ? "test" : /sk_?live/.test(k) ? "live" : null;
}

const err = (status, message) => Object.assign(new Error(message), { status });
// Text safe for logs and error messages: configured secrets, bearer tokens and client secrets removed, 300 chars
function redact(text) {
  let t = String(text == null ? "" : text);
  for (const k of ["PAYMOB_SECRET_KEY", "PAYMOB_API_KEY", "PAYMOB_HMAC_SECRET", "PAYMOB_PUBLIC_KEY"]) { const v = env(k); if (v.length >= 6) t = t.split(v).join("***"); }
  return t.replace(/\b(eyJ|ZXlK)[A-Za-z0-9._=-]{16,}/g, "***").replace(/egy_csk_[A-Za-z0-9_]+/g, "egy_csk_***").slice(0, 300);
}

// ---------- amounts ----------
// 150.5 / "150.50" -> 15050 piasters without float maths (null when it is not a positive amount with at most 2 decimals)
function toPiasters(amount) {
  const s = typeof amount === "number" ? (Number.isFinite(amount) ? amount.toFixed(2) : "") : String(amount == null ? "" : amount).trim();
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const p = Number(m[1]) * 100 + Number((m[2] || "").padEnd(2, "0"));
  return p > 0 ? p : null;
}

// ---------- HTTP ----------
// Time limits: an Azure Functions request ends at about 45 s, and the callback / verify path is auth + lookup (+ one
// re-auth and lookup, only while RETRY_WITHIN allows) + the 15 s donation webhook, so: 8 s per auth / lookup call,
// 15 s for creating the payment (the donor is waiting on that one alone). Worst case ~26 s at Paymob + 15 s webhook.
const LOOKUP_TIMEOUT = 8000, CREATE_TIMEOUT = 15000, RETRY_WITHIN = 10000;
// -> { status, data } ; status 0 when Paymob could not be reached (timeout / network). Never throws.
async function call(method, path, { body, headers = {}, timeout = LOOKUP_TIMEOUT } = {}) {
  try {
    const res = await fetch(cfg().base + path, {
      method,
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: { error: e && e.name === "TimeoutError" ? "timeout" : "network" } };
  }
}

// ---------- create payment (Intention API) + Unified Checkout URL ----------
function phoneOf(p) {
  let d = String(p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (/^0\d{10}$/.test(d)) d = "+2" + d; // 01xxxxxxxxx -> +201xxxxxxxxx
  else if (/^20\d{10}$/.test(d)) d = "+" + d;
  else if (/^1\d{9}$/.test(d)) d = "+20" + d;
  return d.replace(/\D/g, "").length >= 8 ? d.slice(0, 20) : "NA";
}
// Paymob always wants first_name, last_name, email and phone_number; the other address fields are "NA".
// The donor's name is optional (anonymous = "فاعل خير").
function billingData({ name, email, phone } = {}) {
  const words = String(name || "").replace(/[\u0000-\u001f<>]/g, "").trim().split(/\s+/).filter(Boolean);
  const all = words.length ? words : ["فاعل", "خير"];
  const mail = String(email || "").trim();
  return {
    first_name: all[0].slice(0, 50), last_name: (all.slice(1).join(" ") || "NA").slice(0, 50),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail.slice(0, 120) : "NA",
    phone_number: phoneOf(phone),
    apartment: "NA", floor: "NA", street: "NA", building: "NA", city: "NA", state: "NA", country: "EG",
  };
}
function checkoutUrl(clientSecret) {
  const u = new URL(cfg().checkout);
  u.searchParams.set("publicKey", cfg().publicKey);
  u.searchParams.set("clientSecret", String(clientSecret));
  return u.toString();
}
// The exact /v1/intention/ body for one donation (no secrets in it)
function intentionBody({ orderId, amount, purpose, purposeTitle, name, email, phone, origin }) {
  const cents = toPiasters(amount);
  if (!cents) throw err(400, "invalid amount");
  const base = String(origin || "").replace(/\/+$/, "");
  return {
    amount: cents,
    currency: "EGP",
    payment_methods: cfg().integrationIds,
    items: [{ name: String(purposeTitle || "تبرع لمؤسسة مرسال").slice(0, 50), amount: cents, quantity: 1 }], // sum must equal amount
    billing_data: billingData({ name, email, phone }),
    special_reference: orderId, // unique per attempt; comes back as order.merchant_order_id
    extras: { order_id: orderId, purpose: purpose || "general" },
    expiration: 3600,
    notification_url: base + "/api/paymob/callback", // transaction processed callback (POST, source of truth)
    redirection_url: base + "/donate.html?gw=paymob", // transaction response callback (browser GET, UX only)
  };
}
// -> { redirect, intentionId, paymobOrderId } ; throws { status, message } (message has no secrets)
async function createIntention(order) {
  if (!configured()) throw err(500, "Paymob is not configured (" + missing().join(", ") + ")");
  const body = intentionBody(order);
  const r = await call("POST", "/v1/intention/", { body, headers: { Authorization: "Token " + cfg().secretKey }, timeout: CREATE_TIMEOUT });
  const d = r.data || {};
  if ((r.status !== 201 && r.status !== 200) || !d.client_secret || d.intention_order_id == null) {
    throw err(r.status >= 400 ? r.status : 502, "Paymob intention " + (r.status || "unreachable") + ": " + redact(JSON.stringify(d)));
  }
  return { redirect: checkoutUrl(d.client_secret), intentionId: String(d.id || ""), paymobOrderId: d.intention_order_id };
}

// ---------- HMAC (transaction callbacks) ----------
// HMAC-SHA512(PAYMOB_HMAC_SECRET) over these 20 values joined with no separator; lowercase hex.
const POST_FIELDS = ["amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id", "integration_id",
  "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment", "is_voided", "order.id", "owner", "pending",
  "source_data.pan", "source_data.sub_type", "source_data.type", "success"];
const GET_FIELDS = POST_FIELDS.map((f) => (f === "order.id" ? "order" : f));
// null / missing -> "" (never "null"), booleans -> "true" / "false", numbers -> String(n), strings verbatim
const canon = (v) => (v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "true" : "false") : String(v));
const at = (o, p) => p.split(".").reduce((c, k) => (c != null && typeof c === "object" ? c[k] : undefined), o);
function sign(str) {
  const secret = cfg().hmacSecret;
  if (!secret) return null;
  return crypto.createHmac("sha512", secret).update(str, "utf8").digest("hex");
}
function safeEq(expectedHex, got) {
  if (!expectedHex || typeof got !== "string" || !/^[0-9a-f]{128}$/i.test(got)) return false;
  const a = Buffer.from(expectedHex, "hex"), b = Buffer.from(got.toLowerCase(), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const postString = (obj) => POST_FIELDS.map((f) => canon(at(obj, f))).join("");
// q: URLSearchParams (dotted keys literal, values URL-decoded); "order" is the Paymob order id (order_id only as fallback)
const getString = (q) => GET_FIELDS.map((k) => canon(k === "order" ? (q.get("order") ?? q.get("order_id")) : q.get(k))).join("");
// Server callback: verifyCallback(body.obj, ?hmac=)
const verifyCallback = (obj, hmac) => !!obj && typeof obj === "object" && safeEq(sign(postString(obj)), hmac);
// Browser redirect: verifyRedirect(searchParams) (hmac is one of the query keys)
const verifyRedirect = (q) => !!q && typeof q.get === "function" && safeEq(sign(getString(q)), q.get("hmac"));

// ---------- authoritative retrieval ----------
// Bearer token from the API Key, cached 50 minutes (it lives 60); one re-auth on a 401 while the request has time for it.
let tokenCache = null;
async function authToken(force = false) {
  const c = cfg(), id = crypto.createHash("sha256").update(c.base + "\n" + c.apiKey).digest("hex");
  if (!force && tokenCache && tokenCache.id === id && Date.now() - tokenCache.at < 50 * 60e3) return tokenCache.token;
  if (!c.apiKey) throw err(500, "PAYMOB_API_KEY is not set");
  const r = await call("POST", "/api/auth/tokens", { body: { api_key: c.apiKey } });
  if (r.status !== 200 && r.status !== 201 || !r.data || typeof r.data.token !== "string") { tokenCache = null; throw err(r.status || 502, "Paymob auth " + (r.status || "unreachable")); }
  tokenCache = { id, token: r.data.token, at: Date.now() };
  return r.data.token;
}
async function authed(fn) {
  const started = Date.now();
  let tok;
  try { tok = await authToken(); } catch (e) { return { status: e.status || 502, data: null, auth: true }; }
  let r = await fn(tok);
  // a slow Paymob gets no second round: the caller answers an error (Paymob retries the callback) instead of timing out
  if (r.status === 401 && Date.now() - started < RETRY_WITHIN) {
    try { tok = await authToken(true); } catch (e) { return { status: e.status || 502, data: null, auth: true }; }
    r = await fn(tok);
  }
  return r;
}
const isTxn = (d) => !!d && typeof d === "object" && Number.isSafeInteger(d.id) && !!d.order && typeof d.order === "object";
// GET /api/acceptance/transactions/{id} -> { found: true, txn } | { found: false } | { error: status }
async function retrieveTransaction(id) {
  const tid = String(id == null ? "" : id);
  if (!/^\d{1,18}$/.test(tid)) return { found: false };
  const r = await authed((t) => call("GET", "/api/acceptance/transactions/" + tid, { headers: { Authorization: "Bearer " + t } }));
  if (r.status === 200 && isTxn(r.data)) return { found: true, txn: r.data };
  if (r.status === 404 && !r.auth) return { found: false };
  return { error: r.status || 502 };
}
// POST /api/ecommerce/orders/transaction_inquiry by Paymob order id or by our reference (special_reference = orderId):
// the most recent transaction of that order. -> { found: true, txn } | { found: false } | { error: status }
async function inquire({ paymobOrderId, merchantOrderId } = {}) {
  const key = paymobOrderId != null && /^\d{1,18}$/.test(String(paymobOrderId)) ? { order_id: String(paymobOrderId) }
    : merchantOrderId ? { merchant_order_id: String(merchantOrderId) } : null;
  if (!key) return { found: false };
  const r = await authed((t) => call("POST", "/api/ecommerce/orders/transaction_inquiry", { body: { auth_token: t, ...key }, headers: { Authorization: "Bearer " + t } }));
  if (r.status === 200) return isTxn(r.data) ? { found: true, txn: r.data } : { found: false };
  // only "not found" means no payment yet; any other answer (a 400 for a request Paymob could not read, auth, 5xx) is an
  // error, so an order that may be paid is never expired on it (the console's review counts it as an error)
  if (r.status === 404 && !r.auth) return { found: false };
  return { error: r.status || 502 };
}

// ---------- reading a transaction ----------
const T = (v) => v === true || v === "true";
// "REFUNDED" | "PAID" | "PENDING" | "DECLINED" (PAID = the official plugin's predicate)
function classify(t) {
  if (!t || typeof t !== "object") return "DECLINED";
  if (T(t.is_refund) || T(t.is_refunded) || T(t.is_void) || T(t.is_voided)) return "REFUNDED";
  if (T(t.success) && !T(t.pending) && !T(t.error_occured)) return "PAID";
  if (T(t.pending)) return "PENDING"; // card OTP still open, or a kiosk reference waiting to be paid
  return "DECLINED";
}
// The donor as Paymob stored it at intention time (billing_data), "NA" placeholders dropped
function donorOf(t) {
  const b = (t && t.payment_key_claims && t.payment_key_claims.billing_data) || (t && t.order && t.order.shipping_data) || {};
  const v = (x) => { const s = String(x == null ? "" : x).trim(); return s && s.toUpperCase() !== "NA" ? s : ""; };
  return { name: [v(b.first_name), v(b.last_name)].filter(Boolean).join(" "), email: v(b.email) || null, phone: v(b.phone_number) || null };
}
// Paymob timestamps -> ISO UTC. With an offset ("…+04:00", "Z") as given; without one ("2024-06-13T11:33:44.592345") they
// are Cairo local time (the docs sample's data.created_at, which is UTC, is 3 hours behind on a Cairo summer day).
function isoTime(s) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(String(s || ""));
  if (!m) return null;
  const ms = m[3] ? Math.floor(Number("0" + m[3]) * 1000) : 0;
  let t;
  if (m[4]) t = Date.parse(m[1] + "T" + m[2] + (m[4] === "Z" ? "Z" : m[4].slice(0, 3) + ":" + m[4].slice(-2))) + ms;
  else { const base = Date.parse(m[1] + "T" + m[2] + "Z") + ms; t = base - cairo.offsetMinutes(base) * 60e3; t = base - cairo.offsetMinutes(t) * 60e3; }
  return isNaN(t) ? null : new Date(t).toISOString();
}

module.exports = {
  cfg, missing, configured, mode, integrationIds, redact, toPiasters, billingData, checkoutUrl, intentionBody, createIntention,
  POST_FIELDS, GET_FIELDS, postString, getString, sign, verifyCallback, verifyRedirect,
  authToken, retrieveTransaction, inquire, classify, donorOf, isoTime, REQUIRED, LOOKUP_TIMEOUT, CREATE_TIMEOUT, RETRY_WITHIN,
  _reset: () => { tokenCache = null; },
};
