// GET /api/verify?orderId=...                       Banque Misr: asks the bank directly (RETRIEVE ORDER). A donation counts
//                                                    only when the bank reports CAPTURED with a successful PAYMENT.
// GET /api/verify?gw=paymob&id=…&order=…&hmac=…     Paymob: the donor's return (the redirect's own query, passed on by
//                                                    donate.js). The hmac must verify; then the transaction is read from
//                                                    Paymob itself (never from the query) and checked against our order.
//                                                    A bad hmac with our own reference (merchant_order_id) falls back to
//                                                    the inquiry below, which needs no hmac and is just as authoritative.
// GET /api/verify?gw=paymob&orderId=...             Paymob without redirect parameters: inquiry by our order reference;
//                                                    only with the orders table (only this site's own saved orders reach
//                                                    Paymob), else 400.
// GET /api/verify?gw=app&orderId=mersal-…[&cancelled=1]  Paymob through the Mersal app's backend: the app's donation-status
//                                                    function answers (it asks Paymob while the order is pending) and the
//                                                    app records the donation itself. The donate page asks every 4 s while
//                                                    the checkout is open, and once with cancelled=1 when the donor closes
//                                                    it. Answer: { orderId, paid, status, amount, currency } (+ campaign).
// Paymob is asked at most VERIFY_RATE_LIMIT (30) times per visitor IP per hour (lib/limits.js), so a replayed return
// link cannot get the merchant account rate-limited.
// Only then is it recorded and forwarded to the new system (lib/orders.js, the same routine the console's reconcile and the
// gateways' notifications use). Answer: { orderId, paid, status, amount, currency } (+ purpose for Paymob, + test: true
// for a payment made with Paymob's test keys: no money moved and it is not recorded as a donation).
const { app } = require("@azure/functions");
const orders = require("../lib/orders");
const paymob = require("../lib/paymob");
const donations = require("../lib/donations");
const limits = require("../lib/limits");
const mersalapp = require("../lib/mersalapp");

const answer = (s) => ({
  status: 200,
  headers: { "Cache-Control": "no-store" },
  jsonBody: s.found === false ? { orderId: s.orderId, paid: false, status: "NOT_FOUND" }
    : { orderId: s.orderId, paid: !!s.paid, status: s.status, amount: s.amount, currency: s.currency, ...(s.purpose ? { purpose: s.purpose } : {}), ...(s.test ? { test: true } : {}) },
});
const unsure = (status) => ({ status, headers: { "Cache-Control": "no-store" }, jsonBody: { message: "تعذّر التأكد من العملية" } });

async function verifyPaymob(q, req, ctx) {
  const log = (...a) => ctx.warn(...a);
  // signed = the redirect's hmac verified; else orderId = our own reference to ask Paymob about
  let signed = false, orderId = "";
  if (q.get("hmac")) {
    signed = paymob.verifyRedirect(q);
    if (!signed) {
      ctx.warn("verify: Paymob redirect with a bad hmac");
      orderId = q.get("merchant_order_id") || "";
      if (!orders.validOrderId(orderId)) return unsure(400);
    }
  } else {
    orderId = q.get("orderId") || "";
    if (!orders.validOrderId(orderId)) return { status: 400, jsonBody: { message: "رقم عملية غير صحيح" } };
  }
  // without the orders table a bare reference could be anything: Paymob is not asked about it
  if (!signed && !donations.enabled()) return unsure(400);
  const ip = limits.clientIp(req), now = Date.now();
  if (!(await limits.allowed("verify", ip, limits.setting("VERIFY_RATE_LIMIT", 30), now, log))) {
    ctx.warn("verify: rate limited", ip);
    return { status: 429, headers: { "Cache-Control": "no-store" }, jsonBody: { message: "محاولات كتير دلوقتي. حاول بعد شوية أو كلمنا على 19340." } };
  }
  await limits.hit("verify", ip, now, log);

  let s;
  if (signed) {
    const r = await paymob.retrieveTransaction(q.get("id"));
    if (r.error) { ctx.error("Paymob retrieval failed", r.error); return unsure(502); }
    if (!r.found) return answer({ orderId: "", found: false });
    // the Paymob order in the (hmac-covered) query must be the one of the transaction Paymob returns
    s = await orders.settlePaymobTxn(r.txn, { paymobOrderId: q.get("order") ?? q.get("order_id") ?? "", log });
  } else {
    s = await orders.settlePaymob(orderId, log);
  }
  if (s.error) { ctx.error("Paymob verify failed", s.orderId, s.error); return unsure(502); }
  return answer(s);
}

async function verifyApp(q, ctx) {
  const orderId = q.get("orderId") || "";
  if (!mersalapp.validOrderId(orderId)) return { status: 400, headers: { "Cache-Control": "no-store" }, jsonBody: { message: "رقم عملية غير صحيح" } };
  const s = await mersalapp.donationStatus(orderId, { cancelled: q.get("cancelled") === "1" });
  if (s.error) { ctx.warn("verify: app donation-status failed", orderId, s.error); return unsure(502); }
  return {
    status: 200, headers: { "Cache-Control": "no-store" },
    jsonBody: { orderId, paid: s.paid, status: s.status, amount: s.amount, currency: "EGP", ...(s.campaign ? { campaign: s.campaign } : {}) },
  };
}

app.http("verify", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "verify",
  handler: async (req, ctx) => {
    // URLSearchParams keeps Paymob's dotted keys (source_data.pan) literal and decodes %2B to +
    const q = req.query && typeof req.query.get === "function" ? req.query : new URL(req.url).searchParams;
    if (q.get("gw") === "paymob") return verifyPaymob(q, req, ctx);
    if (q.get("gw") === "app") return verifyApp(q, ctx);

    const orderId = q.get("orderId") || "";
    if (!orders.validOrderId(orderId)) {
      return { status: 400, jsonBody: { message: "رقم عملية غير صحيح" } };
    }

    const s = await orders.settle(orderId, (...a) => ctx.warn(...a));
    if (s.error) {
      ctx.error("RETRIEVE ORDER failed", orderId, s.error);
      return { status: 502, jsonBody: { message: "تعذّر التأكد من العملية" } };
    }
    if (!s.found) return { status: 200, jsonBody: { orderId, paid: false, status: "NOT_FOUND" } };

    return {
      status: 200,
      headers: { "Cache-Control": "no-store" },
      jsonBody: { orderId: s.orderId, paid: s.paid, status: s.status, amount: s.amount, currency: s.currency },
    };
  },
});
