// GET /api/verify?orderId=...
// Asks the bank directly (RETRIEVE ORDER). A donation counts only when the bank reports
// CAPTURED with a successful PAYMENT; only then is it recorded and forwarded to the new system
// (lib/orders.js, the same routine the console's reconcile and the bank notification use).
const { app } = require("@azure/functions");
const orders = require("../lib/orders");

app.http("verify", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "verify",
  handler: async (req, ctx) => {
    const orderId = req.query.get("orderId") || "";
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
