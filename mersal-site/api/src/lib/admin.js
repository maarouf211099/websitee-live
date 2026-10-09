// Admin helpers: console login (username + password, cookie session) and committing files to GitHub.
// Settings (Static Web App -> Environment variables):
//   GITHUB_TOKEN   fine-grained PAT with "Contents: read & write" on the repo
//   GITHUB_REPO    e.g. maarouf211099/websitee-live
//   GITHUB_BRANCH  e.g. main (the branch the Static Web App deploys from)
//   SITE_ROOT      folder of the site inside the repo (default mersal-site)
//   ADMIN_USER     console username (default "admin")
//   ADMIN_PASSWORD optional: fixes the password from Azure. Otherwise the password chosen on first login is kept
//                  in public/data/settings.json as a scrypt hash peppered with a secret (useless without it)
//   ADMIN_SETUP_CODE optional: code for the first login. Default: the last 8 characters of GITHUB_TOKEN, so only
//                  whoever configured Azure can claim the console (the repository is public: no secret lives in it)
//   ADMIN_SECRET   optional: cookie signing key and password pepper (defaults to keys derived from GITHUB_TOKEN)

const crypto = require("crypto");

const SITE_ROOT = (process.env.SITE_ROOT || "mersal-site").replace(/^\/+|\/+$/g, "");
const DEFAULT_USER = "admin", COOKIE = "mersal_admin", TTL = 12 * 3600;

// ---- secrets: only Azure application settings, never a file in the (public) repository ----
const env = (k) => String(process.env[k] || "").trim();
// First-login code: ADMIN_SETUP_CODE, else the last 8 characters of GITHUB_TOKEN ("" = setup not possible yet)
function setupCode() {
  if (env("ADMIN_SETUP_CODE")) return env("ADMIN_SETUP_CODE");
  const t = env("GITHUB_TOKEN");
  return t.length >= 16 ? t.slice(-8) : "";
}
const setupHint = () => (env("ADMIN_SETUP_CODE") ? "env-code" : setupCode() ? "token-tail" : "unavailable");
// ---- session cookie: base64url(payload) + "." + HMAC ----
function signingKey() {
  const seed = env("ADMIN_SECRET") || env("GITHUB_TOKEN") || env("ADMIN_PASSWORD");
  if (!seed) { const e = new Error("GITHUB_TOKEN لازم يتظبط في إعدادات Azure قبل الدخول"); e.status = 503; throw e; }
  return crypto.createHash("sha256").update("mersal-admin-session:" + seed).digest();
}
// Does a public image exist on the deploy branch? (read-only, images only)
async function fileExists(relPath) {
  if (!/^public\/img\/[A-Za-z0-9._\/-]+$/.test(relPath)) return false;
  try { const { api, repo, branch } = gh(); await api(`/repos/${repo}/contents/${encodeURI(`${SITE_ROOT}/${relPath}`)}?ref=${encodeURIComponent(branch)}`); return true; } catch { return false; }
}
const sign = (payload) => crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + TTL * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}
function readToken(token) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  let good;
  try { good = sign(payload); } catch { return null; }
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  try { const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return d.exp > Date.now() ? d : null; } catch { return null; }
}
function cookies(req) {
  const out = {};
  (req.headers.get("cookie") || "").split(";").forEach((part) => { const i = part.indexOf("="); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); });
  return out;
}
const sessionCookie = (req, token, maxAge) => ({ name: COOKIE, value: token, path: "/", httpOnly: true, secure: /^https:/i.test(req.url), sameSite: "Strict", maxAge, ...(maxAge ? {} : { expires: new Date(0) }) });

// ---- passwords (never stored in clear) ----
const digest = (t) => crypto.createHash("sha256").update(String(t)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));
// The stored hash is public (settings.json is in the public repo and served), so it is peppered:
// "scrypt2$<kid>$<salt>$<HMAC(pepper, scrypt(pass, salt))>". Without the pepper (from ADMIN_SECRET or GITHUB_TOKEN)
// it cannot be brute-forced offline. <kid> names the pepper: a new token makes the old hash stale -> first login again.
function pepper() {
  const seed = env("ADMIN_SECRET") || env("GITHUB_TOKEN");
  return seed ? crypto.createHash("sha256").update("mersal-admin-pepper:" + seed).digest() : null;
}
const kidOf = (pep) => crypto.createHash("sha256").update(pep).update("kid").digest("base64url").slice(0, 10);
function hashPassword(pass) {
  const pep = pepper();
  if (!pep) { const e = new Error("GITHUB_TOKEN لازم يتظبط في إعدادات Azure قبل حفظ كلمة السر"); e.status = 503; throw e; }
  const salt = crypto.randomBytes(16), k = crypto.scryptSync(pass, salt, 32);
  return "scrypt2$" + kidOf(pep) + "$" + salt.toString("base64url") + "$" + crypto.createHmac("sha256", pep).update(k).digest("base64url");
}
// "ok" | "stale" (other pepper or the old unpeppered format) | "none"
function hashState(hash) {
  if (!hash) return "none";
  const [alg, kid] = String(hash).split("$"), pep = pepper();
  return alg === "scrypt2" && pep && kid === kidOf(pep) ? "ok" : "stale";
}
function checkHash(pass, hash) {
  if (hashState(hash) !== "ok") return false;
  const [, , salt, key] = String(hash).split("$"), pep = pepper();
  const k = crypto.createHmac("sha256", pep).update(crypto.scryptSync(pass, Buffer.from(salt, "base64url"), 32)).digest(), kk = Buffer.from(key, "base64url");
  return k.length === kk.length && crypto.timingSafeEqual(k, kk);
}
async function savedHash() {
  try { return JSON.parse(await readFile("public/data/settings.json")).adminPasswordHash || null; } catch { return null; }
}
// "env" = fixed in Azure, "saved" = chosen from the console, "setup" = nothing usable yet (first login creates it)
async function passwordSource() {
  if (env("ADMIN_PASSWORD")) return "env";
  return hashState(await savedHash()) === "ok" ? "saved" : "setup";
}
const adminUser = () => process.env.ADMIN_USER || DEFAULT_USER;
async function verifyPassword(user, pass) {
  if (!user || !pass || !safeEq(user, adminUser())) return false;
  if (env("ADMIN_PASSWORD")) return safeEq(pass, env("ADMIN_PASSWORD"));
  const hash = await savedHash();
  return hash ? checkHash(pass, hash) : false;
}
// Code for the first login (see setupCode)
function setupCodeOk(code) {
  const c = setupCode();
  return !!c && safeEq(String(code || ""), c);
}

// ---- brute-force throttle per client (per function instance): 5 wrong tries -> 10 minutes ----
const attempts = new Map();
const clientIp = (req) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
function throttle(req) { const a = attempts.get(clientIp(req)); if (a && a.until > Date.now()) { const e = new Error("محاولات كتير غلط، استنى 10 دقايق"); e.status = 429; throw e; } }
function loginFailed(req) { const ip = clientIp(req), a = attempts.get(ip) || { n: 0, until: 0 }; a.n++; if (a.n >= 5) { a.until = Date.now() + 10 * 60e3; a.n = 0; } attempts.set(ip, a); }
function loginOk(req) { attempts.delete(clientIp(req)); }

// Only the console's own signed cookie counts (no client-supplied identity headers)
function principal(req) {
  const t = readToken(cookies(req)[COOKIE]);
  return t ? { userDetails: t.u, userRoles: ["admin"], via: "password" } : null;
}

// Returns the principal or throws a 401 error
function requireAdmin(req) {
  const p = principal(req);
  if (!p) { const e = new Error("يلزم تسجيل الدخول"); e.status = 401; throw e; }
  return p;
}

// Paths the admin may read/write, relative to the site root
const ALLOWED = [
  /^public\/index\.html$/,
  /^public\/(about|contact|afia|zakat|donate|albums|volunteer|help)\.html$/,
  /^public\/content\.json$/, /^public\/data\/(menu|albums|pages|settings|site|donate|community|news|impact)\.json$/,
  /^api\/data\/requests\/[A-Za-z0-9_-]+\.json$/, /^api\/data\/requests\/index\.json$/,
  /^public\/p\/\d{1,4}\.html$/, /^public\/js\/layout\.js$/,
  /^public\/img\/uploads\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif)$/,
];
function checkPath(p) {
  if (!ALLOWED.some((r) => r.test(p))) { const e = new Error("مسار غير مسموح: " + p); e.status = 400; throw e; }
  return `${SITE_ROOT}/${p}`;
}

// This site's own repository and branch: only the token is secret, so Azure needs GITHUB_TOKEN alone
const DEFAULT_REPO = "maarouf211099/websitee-live";
const githubRepo = () => String(process.env.GITHUB_REPO || "").trim() || DEFAULT_REPO;
const githubReady = () => !!String(process.env.GITHUB_TOKEN || "").trim();

function gh() {
  const token = process.env.GITHUB_TOKEN, repo = githubRepo(), branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) { const e = new Error("GITHUB_TOKEN / GITHUB_REPO مش متظبطين في إعدادات Azure"); e.status = 500; throw e; }
  const api = async (path, init = {}) => {
    const r = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "mersal-admin", ...(init.headers || {}) },
    });
    if (!r.ok) { const t = await r.text(); const e = new Error(`GitHub ${r.status}: ${t.slice(0, 300)}`); e.status = 502; throw e; }
    return r.status === 204 ? null : r.json();
  };
  return { api, repo, branch };
}

// Read a file (utf8 string or Buffer) from the branch
async function readFile(relPath, { binary = false } = {}) {
  const { api, repo, branch } = gh();
  const full = checkPath(relPath);
  const d = await api(`/repos/${repo}/contents/${encodeURI(full)}?ref=${encodeURIComponent(branch)}`);
  const buf = Buffer.from(d.content || "", "base64");
  return binary ? buf : buf.toString("utf8");
}

// Commit several files at once (Git Data API): files = [{path, content(string|Buffer), binary?, delete?}]
async function commitFiles(files, message, author) {
  const { api, repo, branch } = gh();
  const ref = await api(`/repos/${repo}/git/ref/heads/${branch}`);
  const headSha = ref.object.sha;
  const headCommit = await api(`/repos/${repo}/git/commits/${headSha}`);
  const tree = [];
  for (const f of files) {
    const path = checkPath(f.path);
    if (f.delete) { tree.push({ path, mode: "100644", type: "blob", sha: null }); continue; }
    const blob = await api(`/repos/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify(f.binary
        ? { content: Buffer.from(f.content).toString("base64"), encoding: "base64" }
        : { content: String(f.content), encoding: "utf-8" }),
    });
    tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await api(`/repos/${repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }) });
  const commit = await api(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha], author: author ? { name: author.name || "Mersal admin", email: author.email || "admin@mersal-ngo.org" } : undefined }),
  });
  await api(`/repos/${repo}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit.sha;
}

const json = (status, body) => ({ status, headers: { "Cache-Control": "no-store" }, jsonBody: body });
const fail = (e, ctx) => { if (ctx && (e.status || 500) >= 500) ctx.error(e); return json(e.status || 500, { message: e.message }); };

module.exports = { principal, requireAdmin, readFile, commitFiles, checkPath, fileExists, json, fail, SITE_ROOT,
  makeToken, sessionCookie, verifyPassword, passwordSource, hashPassword, setupCodeOk, adminUser, throttle, loginFailed, loginOk, TTL, githubReady, setupHint, hashState };
