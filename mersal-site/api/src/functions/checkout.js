// POST /api/checkout  { amount, purpose, name, email, phone }
// Starts a card payment at the gateway chosen in the console ("بوابة الدفع" = payProvider in js/layout.js, lib/pay.js;
// not chosen yet = Banque Misr, whatever settings exist; a chosen gateway whose settings are missing = 503, never another):
//   Paymob:      creates a payment intention (lib/paymob.js) -> { orderId, provider: "paymob", redirect } (Unified Checkout URL)
//   Banque Misr: creates a Hosted Checkout session with the same INITIATE_CHECKOUT body that is live today (hco-v100c)
//                -> { orderId, sessionId, successIndicator }
// Server-side gate: sessions are created only while card payment is "live": the PAY_MODE application setting when it
// is set, else payMode in js/layout.js (the console's "الدفع بالبطاقة" switch, cached 60 s): read through GitHub, or
// from the live site itself when there is no GITHUB_TOKEN or GitHub fails (lib/pay.js readDeployed).
// GET /api/checkout/status -> { mode, provider, ready, missing? }: can a card donation start right now (setting NAMES
// only, never values), to check a go-live from outside. The donor never needs it: an unavailable gateway answers
// { unavailable: true } and the donate page shows the other ways to give.
// Limits (lib/limits.js): CHECKOUT_RATE_LIMIT (10) sessions per visitor IP per hour, CHECKOUT_GLOBAL_LIMIT (300) per hour
// from everyone, so the merchant account cannot be used for card testing.
// Each session is saved as a pending order (lib/donations.js, when DONATIONS_STORAGE is set) so a payment whose donor
// never comes back to /donate.html is still recorded by the console's reconcile (lib/orders.js). For Paymob the order
// is saved BEFORE the donor is sent to pay (its amount and purpose are what the callback is checked against).
const { app } = require("@azure/functions");
const { cfg, mpgs, newOrderId } = require("../lib/mpgs");
const { readFile, githubReady } = require("../lib/admin");
const limits = require("../lib/limits");
const donations = require("../lib/donations");
const paymob = require("../lib/paymob");
const pay = require("../lib/pay");

const PURPOSES = {
  general: "تبرع عام", zakat: "زكاة", sadaqa: "صدقة",
  hospital: "مستشفى مرسال الخيري", oncology: "مركز مرسال للأورام", cases: "حالات تحتاج مساندة",
};
const MIN = Number(process.env.MIN_AMOUNT || 10);
const MAX = Number(process.env.MAX_AMOUNT || 1000000);

const bad = (message) => ({ status: 400, jsonBody: { message } });
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const OTHER_WAYS = "تقدر تتبرع بالتحويل البنكي أو المحافظ من صفحة طرق التبرع، أو كلمنا على 19340.";
// card payment cannot start at all right now (switch off / unknown, gateway settings missing): the page offers the rest
const unavailable = (status, message) => ({ status, jsonBody: { message, unavailable: true } });

// -> { mode: "off" | "demo" | "live", provider: "paymob" | "mpgs" }
let payCache = null;
const settled = (mode, saved) => ({ mode, provider: pay.effective(saved) });
async function paySettings() {
  const fixed = String(process.env.PAY_MODE || "").trim().toLowerCase();
  const fixedMode = fixed ? (pay.MODES.includes(fixed) ? fixed : "off") : null;
  if (fixedMode && fixedMode !== "live") return settled(fixedMode, null); // the gateway does not matter
  if (payCache && Date.now() - payCache.at < 60e3) return settled(fixedMode || payCache.mode, payCache.provider);
  try {
    const s = await readSwitch();
    payCache = { mode: s.mode, provider: s.provider, at: Date.now() };
    return settled(fixedMode || s.mode, s.provider);
  } catch (e) {
    if (payCache) return settled(fixedMode || payCache.mode, payCache.provider); // GitHub hiccup: keep the last known switch
    if (fixedMode) return settled(fixedMode, null); // PAY_MODE=live and neither source answers: the default gateway (Banque Misr)
    throw e;
  }
}
// GitHub first (a console change counts at once), the deployed file when GitHub is not set up or does not answer
async function readSwitch() {
  if (githubReady()) {
    try { return pay.read(await within(5000, readFile("public/js/layout.js"))); } catch { /* the deployed file below */ }
  }
  return pay.readDeployed();
}
// Never wait long on GitHub for a label
const within = (ms, p) => Promise.race([p, new Promise((_, rej) => { const t = setTimeout(() => rej(new Error("timeout")), ms); if (t.unref) t.unref(); })]);
// Item name shown on Paymob's checkout page: the cause's title (project pages from data/pages.json, cached 10 minutes)
let pagesCache = null;
async function purposeTitle(purpose) {
  if (Object.prototype.hasOwnProperty.call(PURPOSES, purpose)) return PURPOSES[purpose];
  try {
    if (!pagesCache || Date.now() - pagesCache.at > 10 * 60e3) pagesCache = { pages: JSON.parse(await within(3000, readFile("public/data/pages.json"))), at: Date.now() };
    const p = pagesCache.pages && pagesCache.pages[purpose.slice(1)];
    if (p && typeof p.title === "string" && clean(p.title, 50)) return clean(p.title, 50);
  } catch { /* GitHub hiccup: the generic title */ }
  return "تبرع لمؤسسة مرسال";
}

app.http("checkout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "checkout",
  handler: async (req, ctx) => {
    let ps;
    try { ps = await paySettings(); } catch (e) {
      ctx.error("checkout: payMode unknown", e.message);
      return unavailable(503, "الدفع بالبطاقة مش متاح دلوقتي. " + OTHER_WAYS);
    }
    if (ps.mode !== "live") return unavailable(403, "الدفع بالبطاقة مش مفعّل دلوقتي. " + OTHER_WAYS);
    // the chosen gateway cannot start a payment (settings missing, Paymob test keys): before the limits, nothing to count
    if (!pay.ready(ps.provider)) {
      ctx.error(ps.provider === "paymob" ? "checkout: Paymob not ready:" : "checkout: Banque Misr settings missing:", pay.missingFor(ps.provider).join(", "));
      return unavailable(503, "الدفع بالبطاقة مش متاح دلوقتي. " + OTHER_WAYS);
    }

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

    const orderId = newOrderId();
    const origin = String(process.env.PUBLIC_BASE_URL || new URL(req.url).origin).trim().replace(/\/+$/, "");
    if (ps.provider === "paymob") return paymobCheckout({ orderId, amount, purpose, name, email, phone, origin }, ctx);
    if (!pay.ready("mpgs")) {
      ctx.error("checkout: Banque Misr settings missing:", pay.missingFor("mpgs").join(", "));
      return unavailable(503, "الدفع بالبطاقة مش متاح دلوقتي. " + OTHER_WAYS);
    }

    const c = cfg();
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
    await donations.addPending({ orderId, amount, purpose, createdAt: new Date().toISOString(), provider: "mpgs" })
      .catch((e) => ctx.warn("checkout: pending order not saved", orderId, e.message));
    return {
      status: 200,
      headers: { "Cache-Control": "no-store" },
      jsonBody: { orderId, sessionId: r.data.session.id, successIndicator: r.data.successIndicator },
    };
  },
});

app.http("checkoutStatus", {
  methods: ["GET"], authLevel: "anonymous", route: "checkout/status",
  handler: async (req, ctx) => {
    const out = (body) => ({ status: 200, headers: { "Cache-Control": "no-store" }, jsonBody: body });
    let ps;
    try { ps = await paySettings(); } catch (e) { ctx.warn("checkout status: payMode unknown", e.message); return out({ mode: null, ready: false }); }
    const missing = ps.mode === "live" ? pay.missingFor(ps.provider) : [];
    return out({ mode: ps.mode, provider: ps.provider, ready: ps.mode === "live" && !missing.length, ...(missing.length ? { missing } : {}) });
  },
});

// Paymob: pending order first (when the orders table exists: no payment is started that the callback could not match),
// then the intention; the donor is sent to Paymob's Unified Checkout with the returned URL (public key + client secret).
async function paymobCheckout({ orderId, amount, purpose, name, email, phone, origin }, ctx) {
  if (!paymob.ready()) {
    ctx.error("checkout: Paymob not ready:", pay.missingFor("paymob").join(", "));
    return unavailable(503, "الدفع بالبطاقة مش متاح دلوقتي. " + OTHER_WAYS);
  }
  if (donations.enabled()) {
    try { await donations.addPending({ orderId, amount, purpose, createdAt: new Date().toISOString(), provider: "paymob" }); }
    catch (e) {
      ctx.error("checkout: pending order not saved", orderId, e.message);
      return { status: 503, jsonBody: { message: "تعذّر بدء عملية الدفع دلوقتي، حاول تاني بعد شوية. " + OTHER_WAYS } };
    }
  }
  let it;
  try {
    it = await paymob.createIntention({ orderId, amount, purpose, purposeTitle: await purposeTitle(purpose), name, email, phone, origin });
  } catch (e) {
    ctx.error("Paymob intention failed", orderId, e.status || "", paymob.redact(e.message));
    await donations.setOrder(orderId, { status: "failed" }).catch(() => {});
    return { status: 502, jsonBody: { message: "تعذّر الاتصال ببوابة الدفع. حاول مرة أخرى بعد قليل." } };
  }
  await donations.setOrder(orderId, { gatewayOrderId: String(it.paymobOrderId), intentionId: it.intentionId })
    .catch((e) => ctx.warn("checkout: Paymob order id not saved", orderId, e.message));
  ctx.log("checkout created", orderId, amount, purpose, "paymob");
  return { status: 200, headers: { "Cache-Control": "no-store" }, jsonBody: { orderId, provider: "paymob", redirect: it.redirect } };
}
