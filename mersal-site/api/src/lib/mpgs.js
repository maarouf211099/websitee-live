// Banque Misr (Mastercard MPGS) REST API v100 helpers.
// All credentials come from the Static Web App's application settings - never from code.
const crypto = require("crypto");

const cfg = () => ({
  gateway: (process.env.MPGS_GATEWAY || "https://banquemisr.gateway.mastercard.com").replace(/\/+$/, ""),
  version: process.env.MPGS_API_VERSION || "100",
  merchant: process.env.MPGS_MERCHANT || "",
  password: process.env.MPGS_API_PASSWORD || "",
  merchantName: process.env.MERCHANT_DISPLAY_NAME || "MERSAL CHARITY",
  orderPrefix: process.env.ORDER_PREFIX || "MERSAL-WEB",
});

async function mpgs(method, path, body) {
  const c = cfg();
  if (!c.merchant || !c.password) {
    const e = new Error("Payment gateway is not configured (MPGS_MERCHANT / MPGS_API_PASSWORD).");
    e.status = 500;
    throw e;
  }
  const url = `${c.gateway}/api/rest/version/${c.version}/merchant/${encodeURIComponent(c.merchant)}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`merchant.${c.merchant}:${c.password}`).toString("base64"),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

function newOrderId() {
  const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${cfg().orderPrefix}-${ts}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

// Sends a verified, CAPTURED donation to the new system. The receiver must treat
// orderId as the idempotency key (the same order can be reported more than once).
async function forwardDonation(donation, log) {
  const url = process.env.DONATION_WEBHOOK_URL;
  if (!url) { log("DONATION_WEBHOOK_URL not set - donation not forwarded", donation.orderId); return { forwarded: false }; }
  const body = JSON.stringify(donation);
  const headers = { "Content-Type": "application/json", "X-Mersal-Event": "donation.captured" };
  if (process.env.DONATION_WEBHOOK_SECRET) {
    headers["X-Mersal-Signature"] = "sha256=" + crypto.createHmac("sha256", process.env.DONATION_WEBHOOK_SECRET).update(body).digest("hex");
  }
  try {
    const r = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
    if (!r.ok) log("webhook returned", r.status, donation.orderId);
    return { forwarded: r.ok };
  } catch (e) {
    log("webhook failed", e.message, donation.orderId);
    return { forwarded: false };
  }
}

module.exports = { cfg, mpgs, newOrderId, forwardDonation };
