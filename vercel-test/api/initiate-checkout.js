// POST /api/initiate-checkout  { amount, email }
// Mirrors the INITIATE_CHECKOUT body that the patched UserUI.dll (hco-v100c) sends.
const { call, send } = require("../lib/mpgs");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
      return send(res, 400, { error: "amount must be between 1 and 100000 EGP" });
    }

    const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const orderId = `VTEST-${ts}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const returnUrl = `${proto}://${host}/?hcoReturn=1`;

    const payload = {
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        merchant: { name: process.env.MERCHANT_DISPLAY_NAME || "MERSAL CHARITY" },
        returnUrl,
      },
      order: {
        id: orderId,
        reference: orderId, // required by the bank — without it 3DS passes but PAYMENT never runs
        amount: amount.toFixed(2),
        currency: "EGP",
        description: "Donation",
      },
      transaction: { reference: orderId },
    };

    const r = await call("POST", "/session", payload);
    if (r.status >= 300 || !r.data.session || !r.data.session.id) {
      return send(res, 502, { error: "Gateway rejected INITIATE_CHECKOUT", gatewayStatus: r.status, gateway: r.data });
    }
    return send(res, 200, {
      orderId,
      sessionId: r.data.session.id,
      successIndicator: r.data.successIndicator,
      returnUrl,
    });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message });
  }
};
