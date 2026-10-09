// Card donations in Azure Table Storage (optional). Setting: DONATIONS_STORAGE = connection string of a storage account.
//   table "donations": one row per CAPTURED order (partitionKey = yyyy-mm of paidAt, rowKey = orderId): the admin report.
//     `forwarded` = DONATION_WEBHOOK_URL accepted it, so a second verify / reconcile does not send it again;
//     `forwardingAt` = a request is sending it right now (claimForward), so a request arriving at the same moment does not;
//     `test` = paid with Paymob's test keys (no real money): kept, but left out of the report and never forwarded.
//   table "orders": one row per checkout session (partitionKey = "order", rowKey = orderId, status pending | captured |
//     expired | failed | review, provider mpgs | paymob), written by /api/checkout, so a payment whose donor never came back
//     to /donate.html can still be found and recorded by the console's "مراجعة العمليات المعلقة" (lib/orders.js).
//     review = a person has to check it (the gateway says paid but it does not match the order, or asking it failed on 3
//     reviews of a session over a day old, counted in checkErrors); it is no longer asked about automatically.
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
    ...(d.test ? { test: true } : {}),
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
  await c.updateEntity({ partitionKey: monthOf(paidAt), rowKey: orderId, forwarded: true, forwardedAt: new Date().toISOString(), forwardingAt: "" }, "Merge");
  return true;
}
// Sending a donation to the webhook, one request at a time and once: Paymob's callback and the donor's return usually
// arrive together. The claim is a write conditional on the row's etag (a 412 = the row changed since it was read: read it
// again); a claim older than CLAIM_TTL is from a request that died and can be taken over.
// -> "claimed" (send it, then markForwarded / releaseForward) | "busy" (already sent, or another request is sending it)
//    | "unavailable" (no table, or no row to claim: nothing to coordinate with)
const CLAIM_TTL = 60e3;
async function claimForward(orderId, paidAt) {
  const c = client();
  if (!c) return "unavailable";
  await ready(c);
  for (let i = 0; i < 4; i++) {
    let e;
    try { e = await c.getEntity(monthOf(paidAt), orderId); }
    catch (err) { if (notFound(err)) return "unavailable"; throw err; }
    if (e.forwarded === true || e.forwarded === "true") return "busy";
    const since = Date.now() - Date.parse(e.forwardingAt || ""); // NaN = no claim; negative = another instance's clock is ahead
    if (since < CLAIM_TTL) return "busy";
    try {
      await c.updateEntity({ partitionKey: monthOf(paidAt), rowKey: orderId, forwardingAt: new Date().toISOString() }, "Merge", { etag: e.etag });
      return "claimed";
    } catch (err) { if (err.statusCode !== 412) throw err; }
  }
  return "busy"; // the row keeps changing: other requests are on it
}
// The webhook did not take it: the next verify / callback may try again
async function releaseForward(orderId, paidAt) {
  const c = client();
  if (!c) return false;
  await c.updateEntity({ partitionKey: monthOf(paidAt), rowKey: orderId, forwardingAt: "" }, "Merge");
  return true;
}

// from / to = Cairo calendar days (YYYY-MM-DD)
async function list({ from, to } = {}) {
  const c = client();
  if (!c) return null;
  await ready(c);
  const r = cairo.range(from, to), out = [];
  for await (const e of c.listEntities()) {
    if (e.test === true || !cairo.inRange(e.paidAt, r)) continue; // test payments are not donations
    out.push({ orderId: e.rowKey, amount: e.amount, currency: e.currency, purpose: e.purpose, donorName: e.donorName, email: e.email, phone: e.phone, paidAt: e.paidAt, txnId: e.txnId, receipt: e.receipt });
  }
  out.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  return out;
}

// ---------- checkout sessions ("orders") ----------
// provider = "mpgs" | "paymob" (the gateway that will be asked about it); Paymob orders later get gatewayOrderId (Paymob's
// order id, the correlation key of its callbacks) and intentionId
async function addPending({ orderId, amount, purpose, createdAt, provider }) {
  const c = client("orders");
  if (!c) return false;
  await (await ready(c)).upsertEntity({ partitionKey: "order", rowKey: orderId, amount: Number(amount) || 0, purpose: purpose || "general", createdAt: createdAt || new Date().toISOString(), status: "pending", provider: provider || "mpgs" }, "Merge");
  return true;
}
// One checkout session row, or null (unknown, or no table)
async function getOrder(orderId) {
  const c = client("orders");
  if (!c) return null;
  try { return await (await ready(c)).getEntity("order", orderId); }
  catch (e) { if (notFound(e)) return null; throw e; }
}
// Pending sessions created at least olderThanMs ago, oldest first (null when there is no table)
async function pendingOrders(olderThanMs, now = Date.now()) {
  const c = client("orders");
  if (!c) return null;
  await ready(c);
  const out = [];
  for await (const e of c.listEntities({ queryOptions: { filter: "PartitionKey eq 'order' and status eq 'pending'" } })) {
    const t = Date.parse(e.createdAt || "");
    if (e.status === "pending" && !isNaN(t) && t <= now - olderThanMs) out.push({ orderId: e.rowKey, amount: e.amount, purpose: e.purpose, createdAt: e.createdAt, provider: e.provider || "mpgs", gatewayOrderId: e.gatewayOrderId || "", checkErrors: Number(e.checkErrors) || 0 });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return out;
}
// Sessions waiting for a person (status "review"), oldest first (null when there is no table)
async function reviewOrders() {
  const c = client("orders");
  if (!c) return null;
  await ready(c);
  const out = [];
  for await (const e of c.listEntities({ queryOptions: { filter: "PartitionKey eq 'order' and status eq 'review'" } })) {
    if (e.status === "review") out.push({ orderId: e.rowKey, amount: e.amount, createdAt: e.createdAt, provider: e.provider || "mpgs", bankStatus: e.bankStatus || "" });
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

module.exports = { record, find, markForwarded, claimForward, releaseForward, CLAIM_TTL, list, addPending, getOrder, pendingOrders, reviewOrders, setOrder, enabled: () => !!process.env.DONATIONS_STORAGE };
