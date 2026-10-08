// GET /api/order?id=<orderId>
// Server-side RETRIEVE ORDER — the check the live site is still missing:
// a donation should only be recorded when the bank itself reports CAPTURED.
const { call, send } = require("../lib/mpgs");

module.exports = async (req, res) => {
  try {
    const id = new URL(req.url, "http://x").searchParams.get("id") || "";
    if (!/^VTEST-[A-Z0-9-]{1,40}$/.test(id)) return send(res, 400, { error: "invalid order id" });

    const r = await call("GET", `/order/${encodeURIComponent(id)}`);
    if (r.status >= 300) return send(res, 502, { error: "RETRIEVE ORDER failed", gatewayStatus: r.status, gateway: r.data });

    const o = r.data;
    const txns = (o.transaction || []).map((t) => ({
      type: t.transaction && t.transaction.type,
      result: t.result,
      gatewayCode: t.response && t.response.gatewayCode,
      amount: t.transaction && t.transaction.amount,
    }));
    const paid = o.status === "CAPTURED" && txns.some((t) => t.type === "PAYMENT" && t.result === "SUCCESS");
    return send(res, 200, {
      orderId: o.id,
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      paid,
      transactions: txns,
    });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message });
  }
};
