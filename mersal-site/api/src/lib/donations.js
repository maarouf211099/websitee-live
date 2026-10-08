// Donation records in Azure Table Storage (optional).
// Setting: DONATIONS_STORAGE = connection string of a storage account. Table "donations" is created on first use.
let TableClient = null;
try { ({ TableClient } = require("@azure/data-tables")); } catch { /* dependency not installed */ }

function client() {
  const cs = process.env.DONATIONS_STORAGE;
  if (!cs || !TableClient) return null;
  return TableClient.fromConnectionString(cs, "donations");
}

async function record(d) {
  const c = client();
  if (!c) return false;
  try { await c.createTable(); } catch { /* exists */ }
  await c.upsertEntity({
    partitionKey: (d.paidAt || new Date().toISOString()).slice(0, 7), // yyyy-mm
    rowKey: d.orderId,
    amount: Number(d.amount) || 0, currency: d.currency || "EGP", purpose: d.purpose || "general",
    donorName: d.donor?.name || "", email: d.donor?.email || "", phone: d.donor?.phone || "",
    paidAt: d.paidAt || new Date().toISOString(), txnId: d.gatewayTransactionId || "", receipt: d.receipt || "",
  }, "Merge");
  return true;
}

async function list({ from, to } = {}) {
  const c = client();
  if (!c) return null;
  try { await c.createTable(); } catch { /* exists */ }
  const out = [];
  for await (const e of c.listEntities()) {
    if (from && e.paidAt < from) continue;
    if (to && e.paidAt > to + "T23:59:59Z") continue;
    out.push({ orderId: e.rowKey, amount: e.amount, currency: e.currency, purpose: e.purpose, donorName: e.donorName, email: e.email, phone: e.phone, paidAt: e.paidAt, txnId: e.txnId, receipt: e.receipt });
  }
  out.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  return out;
}

module.exports = { record, list, enabled: () => !!process.env.DONATIONS_STORAGE };
