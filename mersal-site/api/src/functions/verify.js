// GET /api/verify?orderId=...
// Asks the bank directly (RETRIEVE ORDER). A donation counts only when the bank reports
// CAPTURED with a successful PAYMENT; only then is it forwarded to the new system.
const { app } = require("@azure/functions");
const { cfg, mpgs, forwardDonation } = require("../lib/mpgs");
const donations = require("../lib/donations");

app.http("verify", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "verify",
  handler: async (req, ctx) => {
    const orderId = req.query.get("orderId") || "";
    const prefix = cfg().orderPrefix.replace(/[^A-Za-z0-9-]/g, "");
    if (!new RegExp(`^${prefix}-\\d{14}-[0-9A-F]{6}$`).test(orderId)) {
      return { status: 400, jsonBody: { message: "رقم عملية غير صحيح" } };
    }

    const r = await mpgs("GET", `/order/${encodeURIComponent(orderId)}`).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
    if (r.status === 404 || r.data?.error?.cause === "INVALID_REQUEST") {
      return { status: 200, jsonBody: { orderId, paid: false, status: "NOT_FOUND" } };
    }
    if (r.status >= 300) {
      ctx.error("RETRIEVE ORDER failed", r.status, JSON.stringify(r.data).slice(0, 1000));
      return { status: 502, jsonBody: { message: "تعذّر التأكد من العملية" } };
    }

    const o = r.data;
    const txns = Array.isArray(o.transaction) ? o.transaction : [];
    const payment = txns.find((t) => t.result === "SUCCESS" && ["PAYMENT", "CAPTURE"].includes(t.transaction?.type));
    const paid = o.status === "CAPTURED" && !!payment;

    if (paid) {
      const purpose = String(o.description || "").split(" - ")[1] || "general";
      const donation = {
        source: "mersal-website",
        orderId: o.id,
        amount: Number(o.amount),
        currency: o.currency,
        purpose,
        donor: {
          name: [o.customer?.firstName, o.customer?.lastName].filter((x) => x && x !== "-").join(" "),
          email: o.customer?.email || null,
          phone: o.customer?.mobilePhone || null,
        },
        paidAt: payment.timeOfRecord || o.lastUpdatedTime || new Date().toISOString(),
        gatewayTransactionId: payment.transaction?.id || null,
        receipt: payment.transaction?.receipt || null,
      };
      await donations.record(donation).catch((e) => ctx.warn("donation record failed", e.message));
      await forwardDonation(donation, (...a) => ctx.warn(...a));
    }

    return {
      status: 200,
      headers: { "Cache-Control": "no-store" },
      jsonBody: { orderId: o.id, paid, status: o.status, amount: Number(o.amount), currency: o.currency },
    };
  },
});
