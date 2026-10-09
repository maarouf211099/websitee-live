// POST /api/paymob/callback?hmac=…   Paymob's "transaction processed callback" (server to server, the source of truth).
// Set as notification_url on every intention (lib/paymob.js) and, in the Paymob dashboard, as the Webhook URL of every
// Integration ID. Steps:
//   1. type other than TRANSACTION (card tokens, ...) -> 200, nothing done
//   2. HMAC-SHA512 over the 20 documented fields of body.obj must equal ?hmac= (constant-time) -> else 401, nothing done
//   3. the transaction is read back from Paymob's own API by its id (the body's amounts and flags are never trusted); its
//      Paymob order must be the hmac-covered obj.order.id
//   4. lib/orders.js settles it against OUR pending order (amount, currency, Integration ID, Paymob order id, test/live):
//      recorded and forwarded to DONATION_WEBHOOK_URL once per orderId (a repeated callback changes nothing)
// Answers 200 once handled (recorded or not), 502 when Paymob or the orders table could not be asked, and 503 when Paymob's
// API does not (yet) know the hmac-verified transaction (test/live scoping or a lag): a retry may follow in both cases.
const { app } = require("@azure/functions");
const paymob = require("../lib/paymob");
const orders = require("../lib/orders");

app.http("paymobCallback", {
  methods: ["POST"], authLevel: "anonymous", route: "paymob/callback",
  handler: async (req, ctx) => {
    if (!paymob.cfg().hmacSecret) return { status: 404 }; // Paymob not set up on this site
    const q = req.query && typeof req.query.get === "function" ? req.query : new URL(req.url).searchParams;
    let b;
    try { b = await req.json(); } catch { return { status: 400 }; }
    if (!b || typeof b !== "object") return { status: 400 };
    if (b.type !== "TRANSACTION") { ctx.log("paymob callback: ignored", String(b.type || "").slice(0, 20)); return { status: 200 }; }
    const obj = b.obj;
    if (!paymob.verifyCallback(obj, q.get("hmac") || "")) { ctx.warn("paymob callback: bad hmac"); return { status: 401 }; }

    const r = await paymob.retrieveTransaction(obj.id);
    if (r.error) { ctx.warn("paymob callback: retrieval failed", r.error, String(obj.id).slice(0, 20)); return { status: 502 }; }
    // the hmac proves Paymob sent it, so "not found" is Paymob's lookup lagging (or scoped to the other mode): ask for a retry
    if (!r.found || String(r.txn.id) !== String(obj.id)) { ctx.warn("paymob callback: transaction not found at Paymob yet", String(obj.id).slice(0, 20)); return { status: 503 }; }

    const s = await orders.settlePaymobTxn(r.txn, { paymobOrderId: obj.order && obj.order.id, log: (...a) => ctx.warn(...a) });
    if (s.error) return { status: 502 };
    ctx.log("paymob callback", s.orderId, s.status, s.paid ? (s.already ? "already recorded" : "recorded") : "");
    return { status: 200 };
  },
});
