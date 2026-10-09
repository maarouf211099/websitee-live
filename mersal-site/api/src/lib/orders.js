// One routine turns a Banque Misr order into a recorded and forwarded donation. Used by GET /api/verify (the donor
// came back), POST /api/console/donations/reconcile (the console checks sessions the donor never came back from) and
// POST /api/mpgs/notify (the bank's own notification, when Banque Misr enables it). The bank is always asked directly
// (RETRIEVE ORDER): a donation counts only when it reports CAPTURED with a successful PAYMENT. orderId is the
// idempotency key: the row is upserted by orderId and the webhook is not sent again once it accepted the donation.
"use strict";
const { cfg, mpgs, forwardDonation } = require("./mpgs");
const donations = require("./donations");

function validOrderId(orderId) {
  const prefix = cfg().orderPrefix.replace(/[^A-Za-z0-9-]/g, "");
  return new RegExp(`^${prefix}-\\d{14}-[0-9A-F]{6}$`).test(String(orderId || ""));
}

// -> { found: false } | { error: status } | { found: true, order, paid, payment }
async function retrieve(orderId) {
  const r = await mpgs("GET", `/order/${encodeURIComponent(orderId)}`).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
  if (r.status === 404 || r.data?.error?.cause === "INVALID_REQUEST") return { found: false };
  if (r.status >= 300) return { error: r.status, data: r.data };
  const o = r.data;
  const txns = Array.isArray(o.transaction) ? o.transaction : [];
  const payment = txns.find((t) => t.result === "SUCCESS" && ["PAYMENT", "CAPTURE"].includes(t.transaction?.type));
  return { found: true, order: o, payment, paid: o.status === "CAPTURED" && !!payment };
}

function donationOf(o, payment) {
  return {
    source: "mersal-website",
    orderId: o.id,
    amount: Number(o.amount),
    currency: o.currency,
    purpose: String(o.description || "").split(" - ")[1] || "general",
    donor: {
      name: [o.customer?.firstName, o.customer?.lastName].filter((x) => x && x !== "-").join(" "),
      email: o.customer?.email || null,
      phone: o.customer?.mobilePhone || null,
    },
    paidAt: payment.timeOfRecord || o.lastUpdatedTime || new Date().toISOString(),
    gatewayTransactionId: payment.transaction?.id || null,
    receipt: payment.transaction?.receipt || null,
  };
}

// Record + forward a paid order (once). -> { recorded, forwarded, already }
async function settlePaid(o, payment, log = () => {}) {
  const d = donationOf(o, payment);
  const prev = await donations.find(d.orderId, d.paidAt).catch((e) => { log("donation lookup failed", e.message); return null; });
  const recorded = await donations.record(d).catch((e) => { log("donation record failed", e.message); return false; });
  await donations.setOrder(d.orderId, { status: "captured" }).catch((e) => log("order update failed", e.message));
  if (prev && prev.forwarded) return { recorded, forwarded: true, already: true };
  const fwd = await forwardDonation(d, log);
  if (fwd.forwarded && recorded) await donations.markForwarded(d.orderId, d.paidAt).catch((e) => log("donation mark failed", e.message));
  return { recorded, forwarded: fwd.forwarded, already: false };
}

// Ask the bank about orderId and settle it when it is paid.
// -> { orderId, found, paid, status, amount, currency } or { orderId, error } when the bank could not be asked
async function settle(orderId, log = () => {}) {
  const r = await retrieve(orderId);
  if (r.error) { log("RETRIEVE ORDER failed", r.error, JSON.stringify(r.data || {}).slice(0, 1000)); return { orderId, error: r.error }; }
  if (!r.found) return { orderId, found: false, paid: false, status: "NOT_FOUND" };
  const o = r.order, out = { orderId: o.id, found: true, paid: r.paid, status: o.status, amount: Number(o.amount), currency: o.currency };
  if (r.paid) Object.assign(out, await settlePaid(o, r.payment, log));
  return out;
}

// Console: check the checkout sessions still "pending" after 15 minutes (the donor closed the tab, lost the network
// or the redirect failed). Paid ones are recorded; ones still unpaid (or unknown to the bank) a day after the session
// was created are marked expired so they are not asked about again. At most `max` per run.
const PENDING_AFTER = 15 * 60e3, EXPIRE_AFTER = 24 * 3600e3;
async function reconcile({ max = 25, now = Date.now(), log = () => {} } = {}) {
  const rows = await donations.pendingOrders(PENDING_AFTER, now);
  if (rows === null) return null; // no table
  const res = { checked: 0, captured: 0, expired: 0, pending: 0, errors: 0, remaining: Math.max(0, rows.length - max), captures: [] };
  for (const row of rows.slice(0, max)) {
    res.checked++;
    const s = await settle(row.orderId, log);
    const old = now - Date.parse(row.createdAt) > EXPIRE_AFTER;
    if (s.error) res.errors++;
    else if (s.paid) { res.captured++; res.captures.push({ orderId: s.orderId, amount: s.amount, currency: s.currency }); }
    else if (old) { res.expired++; await donations.setOrder(row.orderId, { status: "expired", bankStatus: s.status || "" }).catch((e) => log("order update failed", e.message)); }
    else res.pending++;
  }
  return res;
}

module.exports = { validOrderId, retrieve, donationOf, settle, settlePaid, reconcile, PENDING_AFTER, EXPIRE_AFTER };
