// Shared helpers for the Banque Misr (Mastercard MPGS) REST API, v100.
// Credentials come only from Vercel environment variables — never commit them.

const GATEWAY = (process.env.MPGS_GATEWAY || "https://banquemisr.gateway.mastercard.com").replace(/\/+$/, "");
const VERSION = process.env.MPGS_API_VERSION || "100";
const MERCHANT = process.env.MPGS_MERCHANT || "TESTMERSAL";
const PASSWORD = process.env.MPGS_API_PASSWORD || "";

function config() {
  if (!PASSWORD) {
    const e = new Error("MPGS_API_PASSWORD is not set in the Vercel project environment.");
    e.status = 500;
    throw e;
  }
  // Safety net: this is a public test deployment, so refuse a live merchant unless explicitly allowed.
  if (!/^TEST/i.test(MERCHANT) && process.env.ALLOW_LIVE_MERCHANT !== "1") {
    const e = new Error(`Merchant "${MERCHANT}" is not a TEST merchant. Set ALLOW_LIVE_MERCHANT=1 to override.`);
    e.status = 500;
    throw e;
  }
  return { GATEWAY, VERSION, MERCHANT, PASSWORD };
}

async function call(method, path, body) {
  const c = config();
  const url = `${c.GATEWAY}/api/rest/version/${c.VERSION}/merchant/${encodeURIComponent(c.MERCHANT)}${path}`;
  const auth = Buffer.from(`merchant.${c.MERCHANT}:${c.PASSWORD}`).toString("base64");
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

module.exports = { call, send, config, MERCHANT, GATEWAY, VERSION };
