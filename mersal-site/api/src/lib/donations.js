// Card donations in Azure Table Storage (optional). Setting: DONATIONS_STORAGE = connection string of a storage account.
//   table "donations": one row per CAPTURED order (partitionKey = yyyy-mm of paidAt, rowKey = orderId): the admin report.
//     `forwarded` = DONATION_WEBHOOK_URL accepted it, so a second verify / reconcile does not send it again.
//   table "orders": one row per checkout session (partitionKey = "order", rowKey = orderId, status pending | captured |
//     expired), written by /api/checkout, so a payment whose donor never came back to /donate.html can still be found
//     and recorded by the console's "مراجعة العمليات المعلقة" (lib/orders.js).
// Tables are created on first use.
let TableClient = null;
try { ({ TableClient } = require("@azure/data-tables")); } catch { /* dependency not installed */ }
const cairo = require("./cairo");

function client(name = "donations") {
  const cs = process.env.DONATIONS_STORAGE;
  if (!cs || !TableClient) return null;
  return TableClient.fromConnectionString(cs, name);
}
async function ready(c) { try { await c.createTable(); } catch { /* exists */ } return c; }
const notFound = (e) => e && (e.statusCode === 404 || /ResourceNotFound|EntityNotFound/.test(e.message || ""));
const monthOf = (paidAt) => String(paidAt || new Date().toISOString()).slice(0, 7); // yyyy-mm

async function record(d) {
  const c = client();
  if (!c) return false;
  await ready(c);
  // Merge keeps `forwarded` from an earlier call
  await c.upsertEntity({
    partitionKey: monthOf(d.paidAt),
    rowKey: d.orderId,
    amount: Number(d.amount) || 0, currency: d.currency || "EGP", purpose: d.purpose || "general",
    donorName: d.donor?.name || "", email: d.donor?.email || "", phone: d.donor?.phone || "",
    paidAt: d.paidAt || new Date().toISOString(), txnId: d.gatewayTransactionId || "", receipt: d.receipt || "",
  }, "Merge");
  return true;
}
// The stored row of a donation, or null (unknown, or no table)
async function find(orderId, paidAt) {
  const c = client();
  if (!c) return null;
  try { return await (await ready(c)).getEntity(monthOf(paidAt), orderId); }
  catch (e) { if (notFound(e)) return null; throw e; }
}
async function markForwarded(orderId, paidAt) {
  const c = client();
  if (!c) return false;
  await c.updateEntity({ partitionKey: monthOf(paidAt), rowKey: orderId, forwarded: true, forwardedAt: new Date().toISOString() }, "Merge");
  return true;
}

// from / to = Cairo calendar days (YYYY-MM-DD)
async function list({ from, to } = {}) {
  const c = client();
  if (!c) return null;
  await ready(c);
  const r = cairo.range(from, to), out = [];
  for await (const e of c.listEntities()) {
    if (!cairo.inRange(e.paidAt, r)) continue;
    out.push({ orderId: e.rowKey, amount: e.amount, currency: e.currency, purpose: e.purpose, donorName: e.donorName, email: e.email, phone: e.phone, paidAt: e.paidAt, txnId: e.txnId, receipt: e.receipt });
  }
  out.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  return out;
}

// ---------- checkout sessions ("orders") ----------
async function addPending({ orderId, amount, purpose, createdAt }) {
  const c = client("orders");
  if (!c) return false;
  await (await ready(c)).upsertEntity({ partitionKey: "order", rowKey: orderId, amount: Number(amount) || 0, purpose: purpose || "general", createdAt: createdAt || new Date().toISOString(), status: "pending" }, "Merge");
  return true;
}
// Pending sessions created at least olderThanMs ago, oldest first (null when there is no table)
async function pendingOrders(olderThanMs, now = Date.now()) {
  const c = client("orders");
  if (!c) return null;
  await ready(c);
  const out = [];
  for await (const e of c.listEntities({ queryOptions: { filter: "PartitionKey eq 'order' and status eq 'pending'" } })) {
    const t = Date.parse(e.createdAt || "");
    if (e.status === "pending" && !isNaN(t) && t <= now - olderThanMs) out.push({ orderId: e.rowKey, amount: e.amount, purpose: e.purpose, createdAt: e.createdAt });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return out;
}
async function setOrder(orderId, patch) {
  const c = client("orders");
  if (!c) return false;
  try { await c.updateEntity({ partitionKey: "order", rowKey: orderId, ...patch, updatedAt: new Date().toISOString() }, "Merge"); return true; }
  catch (e) { if (notFound(e)) return false; throw e; }
}

module.exports = { record, find, markForwarded, list, addPending, pendingOrders, setOrder, enabled: () => !!process.env.DONATIONS_STORAGE };
