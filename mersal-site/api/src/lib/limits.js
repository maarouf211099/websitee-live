// Client IP and hourly counters, shared by the public forms, /api/checkout and the console login.
//
// clientIp(): the address the platform saw, never a value the visitor chose. Azure's front end overwrites
// X-Azure-ClientIP / X-Client-IP; X-Forwarded-For is only appended to, so its FIRST entry is whatever the visitor sent
// and the useful one is the right-most public address. CLIENT_IP_HEADER (optional) names another header to trust.
//
// Counters are fixed one-hour buckets. They live in this instance's memory, and also in the Azure Table "ratelimits"
// of the DONATIONS_STORAGE account when it is set (partitionKey = <scope>-<yyyymmddhh UTC>, rowKey = hash of the key),
// so every instance shares them and a deploy does not reset them. A failing table never blocks anyone: the memory
// counter still applies. The key "*" is the global (all visitors) counter of a scope.
"use strict";
const crypto = require("crypto");
let TableClient = null;
try { ({ TableClient } = require("@azure/data-tables")); } catch { /* dependency not installed */ }

// ---------- client IP ----------
const PRIVATE = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1?$|f[cd][0-9a-f]{0,2}:|fe[89ab][0-9a-f]?:)/i;
// "41.2.3.4:5050" / "[2001:db8::1]:443" / "::ffff:41.2.3.4" -> bare address ("" when it does not look like one)
function bare(v) {
  let ip = String(v || "").trim();
  if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]") > 0 ? ip.indexOf("]") : undefined);
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, "");
  ip = ip.replace(/^::ffff:(?=\d{1,3}(\.\d{1,3}){3}$)/i, "");
  return /^[0-9a-f:.]{2,45}$/i.test(ip) && /[.:]/.test(ip) ? ip.toLowerCase() : "";
}
function clientIp(req) {
  const h = (k) => String((req && req.headers && req.headers.get(k)) || "");
  const custom = String(process.env.CLIENT_IP_HEADER || "").trim().toLowerCase();
  for (const k of [custom, "x-azure-clientip", "x-client-ip"]) {
    if (!k) continue;
    const v = bare(h(k).split(",")[0]);
    if (v) return v;
  }
  const hops = h("x-forwarded-for").split(",").map(bare).filter(Boolean);
  for (let i = hops.length - 1; i >= 0; i--) if (!PRIVATE.test(hops[i])) return hops[i];
  return hops[hops.length - 1] || "local";
}

// ---------- counters ----------
const hourOf = (now) => new Date(now).toISOString().slice(0, 13).replace(/\D/g, ""); // yyyymmddhh (UTC)
const mem = new Map(); // "<scope>|<key>" -> { hour, n }
const MEM_MAX = 10000;
function memGet(scope, key, hour) { const e = mem.get(scope + "|" + key); return e && e.hour === hour ? e.n : 0; }
function memHit(scope, key, hour) {
  const k = scope + "|" + key, e = mem.get(k);
  mem.set(k, { hour, n: e && e.hour === hour ? e.n + 1 : 1 });
  if (mem.size > MEM_MAX) {
    for (const [kk, v] of mem) if (v.hour !== hour) mem.delete(kk);
    while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value); // still too many: drop the oldest
  }
}

function table() {
  const cs = process.env.DONATIONS_STORAGE;
  if (!cs || !TableClient) return null;
  try { return TableClient.fromConnectionString(cs, "ratelimits"); } catch { return null; }
}
let tableReady = false;
const rowOf = (key) => (key === "*" ? "all" : crypto.createHash("sha256").update("mersal-limit:" + key).digest("hex").slice(0, 32));
const notFound = (e) => e && (e.statusCode === 404 || /ResourceNotFound|EntityNotFound/.test(e.message || ""));

async function tableGet(c, pk, rk) {
  try { const e = await c.getEntity(pk, rk); return { n: Number(e.n) || 0, etag: e.etag }; }
  catch (e) { if (notFound(e)) return { n: 0, etag: null }; throw e; }
}
async function tableHit(c, pk, rk) {
  for (let i = 0; i < 4; i++) {
    const cur = await tableGet(c, pk, rk);
    try {
      if (cur.etag) await c.updateEntity({ partitionKey: pk, rowKey: rk, n: cur.n + 1 }, "Replace", { etag: cur.etag });
      else if (typeof c.createEntity === "function") await c.createEntity({ partitionKey: pk, rowKey: rk, n: 1 });
      else await c.upsertEntity({ partitionKey: pk, rowKey: rk, n: cur.n + 1 }, "Replace");
      return;
    } catch (e) { if (!(e.statusCode === 409 || e.statusCode === 412)) throw e; } // someone else counted first: read again
  }
}

// Current count of scope/key in this hour (the larger of memory and the shared table)
async function count(scope, key, now = Date.now(), log = () => {}) {
  const hour = hourOf(now), m = memGet(scope, key, hour), c = table();
  if (!c) return m;
  try {
    if (!tableReady) { try { await c.createTable(); } catch { /* exists */ } tableReady = true; }
    return Math.max(m, (await tableGet(c, scope + "-" + hour, rowOf(key))).n);
  } catch (e) { log("limits: table read failed", e.message); return m; }
}
async function hit(scope, key, now = Date.now(), log = () => {}) {
  const hour = hourOf(now);
  memHit(scope, key, hour);
  const c = table();
  if (!c) return;
  try {
    if (!tableReady) { try { await c.createTable(); } catch { /* exists */ } tableReady = true; }
    await tableHit(c, scope + "-" + hour, rowOf(key));
  } catch (e) { log("limits: table write failed", e.message); }
}
async function allowed(scope, key, limit, now = Date.now(), log) {
  return (await count(scope, key, now, log)) < limit;
}
// Positive integer from an application setting, else the default
const setting = (name, def) => { const n = parseInt(process.env[name], 10); return n > 0 ? n : def; };

module.exports = { clientIp, bare, count, hit, allowed, setting, hourOf, _mem: mem };
