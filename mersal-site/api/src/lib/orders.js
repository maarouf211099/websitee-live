// One routine turns a gateway order into a recorded and forwarded donation. Used by GET /api/verify (the donor came
// back), POST /api/console/donations/reconcile (the console checks sessions the donor never came back from),
// POST /api/mpgs/notify (Banque Misr's notification) and POST /api/paymob/callback (Paymob's transaction callback).
// The gateway is always asked directly:
//   Banque Misr (MPGS): RETRIEVE ORDER; a donation counts only when it reports CAPTURED with a successful PAYMENT.
//   Paymob: the transaction as Paymob's own API returns it (retrieval by transaction id / inquiry by order), never a callback
//     body or a browser query; it counts only when it is successful, not pending, not voided / refunded, and its amount,
//     currency, Integration ID and Paymob order match OUR pending order (amount and purpose come from that order).
// orderId is the idempotency key: the row is upserted by orderId and the webhook is sent by one request at a time (an etag
// conditional claim on the row) and not again once it accepted the donation.
// Paymob test-key payments (no real money) are recorded marked `test`, left out of the report and never forwarded.
"use strict";
const { cfg, mpgs, forwardDonation } = require("./mpgs");
const donations = require("./donations");
const paymob = require("./paymob");

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

// Record + forward a verified donation d (once per orderId). -> { recorded, forwarded, already } (+ test: true)
async function settleDonation(d, log = () => {}) {
  const recorded = await donations.record(d).catch((e) => { log("donation record failed", e.message); return false; });
  // paidAt is kept on the order so a later callback / verify / reconcile files the donation under the same month
  await donations.setOrder(d.orderId, { status: "captured", paidAt: d.paidAt, ...(d.test ? { test: true } : {}) }).catch((e) => log("order update failed", e.message));
  if (d.test) { log("test payment (Paymob test keys): recorded as test, not forwarded", d.orderId); return { recorded, forwarded: false, already: false, test: true }; }
  // Paymob's callback and the donor's return usually arrive together: only the request that claims the row sends it.
  // No row to claim (no table, storage down): sent anyway - the receiver de-duplicates by orderId, a lost donation is worse.
  const claim = await donations.claimForward(d.orderId, d.paidAt).catch((e) => { log("donation claim failed", e.message); return "unavailable"; });
  if (claim === "busy") return { recorded, forwarded: true, already: true };
  const fwd = await forwardDonation(d, log);
  if (claim === "claimed") {
    if (fwd.forwarded) await donations.markForwarded(d.orderId, d.paidAt).catch((e) => log("donation mark failed", e.message));
    else await donations.releaseForward(d.orderId, d.paidAt).catch((e) => log("donation release failed", e.message));
  }
  return { recorded, forwarded: fwd.forwarded, already: false };
}
// Record + forward a paid Banque Misr order (once).
const settlePaid = (o, payment, log = () => {}) => settleDonation(donationOf(o, payment), log);

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

// ---------- Paymob ----------
const PURPOSE_RE = /^(general|zakat|sadaqa|hospital|oncology|cases|p\d{1,4})$/;
const yes = (v) => v === true || v === "true";
// txn = a Paymob transaction from Paymob's API (retrieveTransaction / inquire). opts: { orderId: expected orderId,
// paymobOrderId: expected Paymob order id (from a verified hmac), row: the pending order (undefined = read it), log }.
// -> { orderId, found, paid, status: CAPTURED | PENDING | DECLINED | REFUNDED | MISMATCH | NOT_FOUND, amount, currency, purpose }
//    or { orderId, error } when the orders table could not be read
async function settlePaymobTxn(txn, opts = {}) {
  const log = opts.log || (() => {}), want = opts.orderId || "";
  const orderId = String((txn && txn.order && txn.order.merchant_order_id) || "");
  if (!validOrderId(orderId)) { log("paymob: transaction is not one of this site's orders", txn && txn.id); return { orderId: want, found: false, paid: false, status: "NOT_FOUND" }; }
  const reject = (why, extra) => { log("paymob: transaction not accepted (" + why + ")", orderId, txn.id); return { orderId: want || orderId, found: true, paid: false, status: "MISMATCH", ...(extra || {}) }; };
  if (want && want !== orderId) return reject("another order");
  if (opts.paymobOrderId != null && String(txn.order.id) !== String(opts.paymobOrderId)) return reject("another Paymob order");
  let row = opts.row;
  if (row === undefined) {
    try { row = donations.enabled() ? await donations.getOrder(orderId) : null; }
    catch (e) { log("paymob: order lookup failed", e.message); return { orderId, error: 503 }; }
  }
  // with the orders table, only this site's own Paymob checkout sessions can be recorded
  if (donations.enabled() && !row) return { orderId, found: false, paid: false, status: "NOT_FOUND" };
  if (row && row.provider && row.provider !== "paymob") return reject("not a Paymob order");
  if (row && row.gatewayOrderId && String(row.gatewayOrderId) !== String(txn.order.id)) return reject("Paymob order id differs");
  // amount and purpose: our pending order; without the table, the order this site created at Paymob (amount_cents + extras)
  const cents = row ? paymob.toPiasters(row.amount) : (Number.isSafeInteger(txn.order.amount_cents) && txn.order.amount_cents > 0 ? txn.order.amount_cents : null);
  const extra = (txn.payment_key_claims && txn.payment_key_claims.extra) || {};
  const purpose = row ? String(row.purpose || "general") : PURPOSE_RE.test(String(extra.purpose || "")) ? String(extra.purpose) : "general";
  const status = paymob.classify(txn);
  const out = { orderId, found: true, paid: false, status, amount: cents != null ? cents / 100 : null, currency: "EGP", purpose };
  if (status === "REFUNDED") {
    log("paymob: refund / void reported", orderId, txn.id);
    if (row) await donations.setOrder(orderId, { refunded: true }).catch((e) => log("order update failed", e.message));
    return out;
  }
  if (status !== "PAID") return out;
  const md = paymob.mode(), checks = {
    amount: cents != null && txn.amount_cents === cents && (txn.order.amount_cents == null || txn.order.amount_cents === cents),
    currency: txn.currency === "EGP",
    integration: paymob.integrationIds().includes(Number(txn.integration_id)),
    mode: md == null || yes(txn.is_live) === (md === "live"),
  };
  const bad = Object.keys(checks).filter((k) => !checks[k]);
  if (bad.length) return reject(bad.join(", "), { amount: out.amount, purpose });
  // test keys (or a transaction Paymob marks not live): the flow is real, the money is not
  const test = md === "test" || !yes(txn.is_live);
  const d = {
    source: "mersal-website", orderId, amount: cents / 100, currency: "EGP", purpose, donor: paymob.donorOf(txn),
    paidAt: (row && row.paidAt) || paymob.isoTime(txn.created_at) || new Date().toISOString(),
    gatewayTransactionId: String(txn.id), receipt: (txn.data && txn.data.receipt_no) || null,
    ...(test ? { test: true } : {}),
  };
  return { ...out, paid: true, status: "CAPTURED", ...(await settleDonation(d, log)) };
}
// Ask Paymob about one of our orders (inquiry by Paymob order id, else by our reference) and settle it when it is paid.
async function settlePaymob(orderId, log = () => {}, row) {
  if (!validOrderId(orderId)) return { orderId, found: false, paid: false, status: "NOT_FOUND" };
  if (row === undefined) {
    try { row = donations.enabled() ? await donations.getOrder(orderId) : null; }
    catch (e) { log("paymob: order lookup failed", e.message); return { orderId, error: 503 }; }
  }
  if (donations.enabled() && (!row || (row.provider && row.provider !== "paymob"))) return { orderId, found: false, paid: false, status: "NOT_FOUND" };
  const r = await paymob.inquire(row && row.gatewayOrderId ? { paymobOrderId: row.gatewayOrderId } : { merchantOrderId: orderId });
  if (r.error) { log("Paymob inquiry failed", r.error, orderId); return { orderId, error: r.error }; }
  if (!r.found) return { orderId, found: false, paid: false, status: "NOT_FOUND" };
  return settlePaymobTxn(r.txn, { orderId, row, log });
}

// Console: check the checkout sessions still "pending" after 15 minutes (the donor closed the tab, lost the network
// or the redirect failed). Paid ones are recorded; ones still unpaid (or unknown to the gateway) a day after the session
// was created are marked expired so they are not asked about again. Ones a person has to check move to "review" and leave
// the queue (so they never hold it up): the gateway says paid but it does not match the order (Paymob: amount,
// Integration ID, test/live), or it could not be asked on REVIEW_ERRORS runs and the session is over a day old.
// At most `max` per run. -> { checked, captured, test, expired, pending, errors, flagged (moved to review now),
//   review / reviews (every order waiting for a person, from its own query), remaining, captures }
const PENDING_AFTER = 15 * 60e3, EXPIRE_AFTER = 24 * 3600e3, REVIEW_ERRORS = 3;
const mpgsReady = () => !!(process.env.MPGS_MERCHANT && process.env.MPGS_API_PASSWORD);
async function reconcile({ max = 25, now = Date.now(), log = () => {} } = {}) {
  const rows = await donations.pendingOrders(PENDING_AFTER, now);
  if (rows === null) return null; // no table
  const res = { checked: 0, captured: 0, test: 0, expired: 0, pending: 0, errors: 0, flagged: 0, review: 0, remaining: Math.max(0, rows.length - max), captures: [], reviews: [] };
  const patch = (row, p) => donations.setOrder(row.orderId, p).then(() => true, (e) => { log("order update failed", e.message); return false; });
  for (const row of rows.slice(0, max)) {
    res.checked++;
    // each order is asked from the gateway it was created at (a gateway whose settings are gone counts as an error)
    const isPaymob = row.provider === "paymob";
    const s = isPaymob ? (paymob.configured() ? await settlePaymob(row.orderId, log, row) : { orderId: row.orderId, error: "paymob-not-configured" })
      : mpgsReady() ? await settle(row.orderId, log) : { orderId: row.orderId, error: "mpgs-not-configured" };
    const old = now - Date.parse(row.createdAt) > EXPIRE_AFTER;
    if (s.error) {
      // never expired on an error (it may be paid); one that keeps failing goes to a person instead of blocking the queue
      res.errors++;
      const n = (Number(row.checkErrors) || 0) + 1;
      if (old && n >= REVIEW_ERRORS) { if (await patch(row, { status: "review", bankStatus: "ERROR " + s.error, checkErrors: n })) res.flagged++; }
      else await patch(row, { checkErrors: n });
    } else if (s.paid && s.test) res.test++; // Paymob test keys: recorded as test, not a donation
    else if (s.paid) { res.captured++; res.captures.push({ orderId: s.orderId, amount: s.amount, currency: s.currency }); }
    // Paymob reports it paid but it does not match the order (amount, Integration ID, test/live): never expired, a person checks it
    else if (s.status === "MISMATCH") { if (await patch(row, { status: "review", bankStatus: "MISMATCH" })) res.flagged++; }
    else if (old) { res.expired++; await patch(row, { status: "expired", bankStatus: s.status || "" }); }
    else res.pending++;
  }
  const waiting = (await donations.reviewOrders().catch((e) => { log("review list failed", e.message); return null; })) || [];
  res.review = waiting.length;
  res.reviews = waiting.slice(0, 20).map((r) => r.orderId);
  return res;
}

module.exports = { validOrderId, retrieve, donationOf, settle, settlePaid, settleDonation, settlePaymobTxn, settlePaymob, reconcile, PENDING_AFTER, EXPIRE_AFTER, REVIEW_ERRORS };
