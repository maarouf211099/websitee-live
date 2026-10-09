// POST /api/checkout  { amount, purpose, name, email, phone }
// Creates a Hosted Checkout session with the same INITIATE_CHECKOUT body that is live today (hco-v100c).
// Server-side gate: sessions are created only while card payment is "live": the PAY_MODE application setting when it
// is set, else payMode in js/layout.js (the console's "الدفع بالبطاقة" switch, read through GitHub, cached 60 s).
// Limits (lib/limits.js): CHECKOUT_RATE_LIMIT (10) sessions per visitor IP per hour, CHECKOUT_GLOBAL_LIMIT (300) per hour
// from everyone, so the merchant account cannot be used for card testing.
// Each session is saved as a pending order (lib/donations.js, when DONATIONS_STORAGE is set) so a payment whose donor
// never comes back to /donate.html is still recorded by the console's reconcile (lib/orders.js).
const { app } = require("@azure/functions");
const { cfg, mpgs, newOrderId } = require("../lib/mpgs");
const { readFile } = require("../lib/admin");
const limits = require("../lib/limits");
const donations = require("../lib/donations");

const PURPOSES = {
  general: "تبرع عام", zakat: "زكاة", sadaqa: "صدقة",
  hospital: "مستشفى مرسال الخيري", oncology: "مركز مرسال للأورام", cases: "حالات تحتاج مساندة",
};
const MIN = Number(process.env.MIN_AMOUNT || 10);
const MAX = Number(process.env.MAX_AMOUNT || 1000000);

const bad = (message) => ({ status: 400, jsonBody: { message } });
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const OTHER_WAYS = "تقدر تتبرع بالتحويل البنكي أو المحافظ من صفحة طرق التبرع، أو كلمنا على 19340.";

// "off" | "demo" | "live"
let modeCache = null;
async function payMode() {
  const fixed = String(process.env.PAY_MODE || "").trim().toLowerCase();
  if (fixed) return ["off", "demo", "live"].includes(fixed) ? fixed : "off";
  if (modeCache && Date.now() - modeCache.at < 60e3) return modeCache.mode;
  try {
    const mode = (/payMode:\s*"(off|demo|live)"/.exec(await readFile("public/js/layout.js")) || [])[1] || "off";
    modeCache = { mode, at: Date.now() };
    return mode;
  } catch (e) {
    if (modeCache) return modeCache.mode; // GitHub hiccup: keep the last known switch
    throw e;
  }
}

app.http("checkout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "checkout",
  handler: async (req, ctx) => {
    let mode;
    try { mode = await payMode(); } catch (e) {
      ctx.error("checkout: payMode unknown", e.message);
      return { status: 503, jsonBody: { message: "الدفع بالبطاقة مش متاح دلوقتي. " + OTHER_WAYS } };
    }
    if (mode !== "live") return { status: 403, jsonBody: { message: "الدفع بالبطاقة مش مفعّل دلوقتي. " + OTHER_WAYS } };

    let b;
    try { b = await req.json(); } catch { return bad("بيانات غير صحيحة"); }
    if (!b || typeof b !== "object") return bad("بيانات غير صحيحة");

    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return bad(`المبلغ يجب أن يكون بين ${MIN} و ${MAX} جنيه`);
    const name = clean(b.name, 80);
    const email = clean(b.email, 120);
    const phone = clean(b.phone, 20).replace(/[^\d+]/g, "");
    // general/zakat/... or a project page from the old site ("p30" = /p/30.html); own keys only ("constructor" is not one)
    const pk = typeof b.purpose === "string" ? b.purpose : "";
    const purpose = Object.prototype.hasOwnProperty.call(PURPOSES, pk) || /^p\d{1,4}$/.test(pk) ? pk : "general";
    if (name.length < 2) return bad("من فضلك اكتب الاسم");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
    if (phone.length < 8) return bad("رقم الموبايل غير صحيح");

    // every session counts (the bank call is what card testing abuses)
    const ip = limits.clientIp(req), log = (...a) => ctx.warn(...a), now = Date.now();
    if (!(await limits.allowed("checkout", ip, limits.setting("CHECKOUT_RATE_LIMIT", 10), now, log))
      || !(await limits.allowed("checkout", "*", limits.setting("CHECKOUT_GLOBAL_LIMIT", 300), now, log))) {
      ctx.warn("checkout: rate limited", ip);
      return { status: 429, jsonBody: { message: "محاولات دفع كتير دلوقتي. حاول بعد ساعة. " + OTHER_WAYS } };
    }
    await limits.hit("checkout", ip, now, log);
    await limits.hit("checkout", "*", now, log);

    const c = cfg();
    const orderId = newOrderId();
    const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
    const [firstName, ...rest] = name.split(/\s+/);

    const payload = {
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        merchant: { name: c.merchantName },
        returnUrl: `${origin}/donate.html?hcoReturn=1`,
      },
      order: {
        id: orderId,
        reference: orderId, // required by the bank: without it 3DS passes but the PAYMENT never runs
        amount: amount.toFixed(2),
        currency: "EGP",
        description: `Donation - ${purpose}`,
      },
      transaction: { reference: orderId },
      // Donor details are stored on the bank's order, so /api/verify reads them back
      // from the bank instead of trusting the browser.
      customer: { firstName: firstName.slice(0, 50), lastName: (rest.join(" ") || "-").slice(0, 50), email, mobilePhone: phone },
    };

    let r = await mpgs("POST", "/session", payload).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
    if (r.status >= 400 && r.status < 500 && r.status !== 401) {
      // If the merchant profile rejects optional fields, retry with the exact body that is proven live.
      ctx.warn("INITIATE_CHECKOUT rejected, retrying with minimal body", JSON.stringify(r.data).slice(0, 500));
      delete payload.customer;
      r = await mpgs("POST", "/session", payload).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
    }
    if (r.status >= 300 || !r.data?.session?.id) {
      ctx.error("INITIATE_CHECKOUT failed", r.status, JSON.stringify(r.data).slice(0, 1000));
      return { status: 502, jsonBody: { message: "تعذّر الاتصال ببوابة الدفع. حاول مرة أخرى بعد قليل." } };
    }

    ctx.log("checkout created", orderId, amount, purpose);
    await donations.addPending({ orderId, amount, purpose, createdAt: new Date().toISOString() })
      .catch((e) => ctx.warn("checkout: pending order not saved", orderId, e.message));
    return {
      status: 200,
      headers: { "Cache-Control": "no-store" },
      jsonBody: { orderId, sessionId: r.data.session.id, successIndicator: r.data.successIndicator },
    };
  },
});
