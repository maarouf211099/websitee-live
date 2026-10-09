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
//   ADMIN_LOGIN_LIMIT / ADMIN_LOGIN_GLOBAL_LIMIT optional: wrong passwords per IP / from everyone per hour (20 / 200)
//
// Sessions: the cookie is signed with a key derived from the secret seed AND the current password (ADMIN_PASSWORD or the
// saved hash), so a password change ends every other session. It lives 4 hours, is renewed while the console is open
// (GET /api/console/me), and never outlives 12 hours from its login. settings.json "sessionsValidAfter" (bumped by a
// password change and by "تسجيل الخروج من كل الأجهزة") ends every session issued before it.

const crypto = require("crypto");
const limits = require("./limits");
const { retry } = require("./commit");

const SITE_ROOT = (process.env.SITE_ROOT || "mersal-site").replace(/^\/+|\/+$/g, "");
const DEFAULT_USER = "admin", COOKIE = "mersal_admin";
const TTL = 4 * 3600, MAX_AGE = 12 * 3600, RENEW_AFTER = 15 * 60; // seconds
const httpError = (status, message, cause) => Object.assign(new Error(message), { status }, cause ? { cause } : {});

// ---- secrets: only Azure application settings, never a file in the (public) repository ----
const env = (k) => String(process.env[k] || "").trim();
// First-login code: ADMIN_SETUP_CODE, else the last 8 characters of GITHUB_TOKEN ("" = setup not possible yet)
function setupCode() {
  if (env("ADMIN_SETUP_CODE")) return env("ADMIN_SETUP_CODE");
  const t = env("GITHUB_TOKEN");
  return t.length >= 16 ? t.slice(-8) : "";
}
const setupHint = () => (env("ADMIN_SETUP_CODE") ? "env-code" : setupCode() ? "token-tail" : "unavailable");
// ---- settings.json (password hash, sessionsValidAfter), cached 60 s per instance ----
// Only "GitHub 404" means "no settings yet"; any other failure (outage, bad token, rate limit) is a 503, never
// "no password" (which would flip the console into first-login setup and reject the real password).
const SETTINGS = "public/data/settings.json";
let settingsCache = null;
async function readSettingsFresh() {
  if (!githubReady()) return {};
  let text;
  try { text = await readFile(SETTINGS); }
  catch (e) { if (/GitHub 404/.test(e.message || "")) return {}; throw httpError(503, "GitHub مش متاح دلوقتي، حاول بعد شوية", e); }
  try { const d = JSON.parse(text); return d && typeof d === "object" ? d : {}; }
  catch (e) { throw httpError(503, "ملف الإعدادات (data/settings.json) مش سليم", e); }
}
async function settings() {
  if (settingsCache && Date.now() - settingsCache.at < 60e3) return settingsCache.data;
  const data = await readSettingsFresh();
  settingsCache = { data, at: Date.now() };
  return data;
}
const primeSettings = (data) => { settingsCache = { data, at: Date.now() }; };
// Merge patch into settings.json (fresh read, retried when another commit lands first) and cache the result
async function saveSettings(patch, message, author) {
  let merged = null;
  const sha = await retry(commitFiles, async () => {
    merged = Object.assign({}, await readSettingsFresh(), patch);
    return [{ path: SETTINGS, content: JSON.stringify(merged, null, 2) + "\n" }];
  }, message, author);
  primeSettings(merged);
  return sha;
}

// ---- session cookie: base64url(payload) + "." + HMAC ----
async function signingKey() {
  const seed = env("ADMIN_SECRET") || env("GITHUB_TOKEN") || env("ADMIN_PASSWORD");
  if (!seed) throw httpError(503, "GITHUB_TOKEN لازم يتظبط في إعدادات Azure قبل الدخول");
  const cred = env("ADMIN_PASSWORD") ? "env:" + env("ADMIN_PASSWORD") : "hash:" + ((await settings()).adminPasswordHash || "");
  return crypto.createHash("sha256").update("mersal-admin-session:" + seed + "\n" + cred).digest();
}
// Does a public image exist on the deploy branch? (read-only, images only)
async function fileExists(relPath) {
  if (!/^public\/img\/[A-Za-z0-9._\/-]+$/.test(relPath)) return false;
  try { const { api, repo, branch } = gh(); await api(`/repos/${repo}/contents/${encodeURI(`${SITE_ROOT}/${relPath}`)}?ref=${encodeURIComponent(branch)}`); return true; } catch { return false; }
}
const sign = async (payload) => crypto.createHmac("sha256", await signingKey()).update(payload).digest("base64url");
// auth = when the person logged in (kept across renewals, for the 12-hour cap)
async function makeToken(user, auth) {
  const key = await signingKey(), now = Date.now();
  // strictly after sessionsValidAfter, even within the same millisecond as the change that moved it
  const iat = Math.max(now, (Number((await settings()).sessionsValidAfter) || 0) + 1);
  const payload = Buffer.from(JSON.stringify({ u: user, iat, auth: auth || iat, exp: now + TTL * 1000 })).toString("base64url");
  return payload + "." + crypto.createHmac("sha256", key).update(payload).digest("base64url");
}
async function readToken(token) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  const good = await sign(payload); // throws 503 when the settings cannot be read: not the same as "logged out"
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  let d;
  try { d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { return null; }
  const now = Date.now(), iat = Number(d.iat) || 0, auth = Number(d.auth) || iat;
  if (!(d.exp > now) || !iat || now - auth > MAX_AGE * 1000) return null;
  if (iat <= (Number((await settings()).sessionsValidAfter) || 0)) return null; // "logout everywhere" / password changed
  return { ...d, iat, auth };
}
function cookies(req) {
  const out = {};
  (req.headers.get("cookie") || "").split(";").forEach((part) => {
    const i = part.indexOf("="); if (i <= 0) return;
    let v = part.slice(i + 1).trim();
    try { v = decodeURIComponent(v); } catch { /* another script's cookie with a stray "%": keep it raw */ }
    out[part.slice(0, i).trim()] = v;
  });
  return out;
}
const sessionCookie = (req, token, maxAge) => ({ name: COOKIE, value: token, path: "/", httpOnly: true, secure: /^https:/i.test(req.url), sameSite: "Strict", maxAge, ...(maxAge ? {} : { expires: new Date(0) }) });
// Cookie for a fresh or renewed session of p (renewal keeps the original login time; never past the 12-hour cap)
async function sessionFor(req, user, auth) {
  const token = await makeToken(user, auth);
  const left = auth ? Math.floor((auth + MAX_AGE * 1000 - Date.now()) / 1000) : TTL;
  return sessionCookie(req, token, Math.max(60, Math.min(TTL, left)));
}

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
const scrypt = (pass, salt) => new Promise((res, rej) => crypto.scrypt(String(pass), salt, 32, (e, k) => (e ? rej(e) : res(k)))); // off the event loop
async function hashPassword(pass) {
  const pep = pepper();
  if (!pep) throw httpError(503, "GITHUB_TOKEN لازم يتظبط في إعدادات Azure قبل حفظ كلمة السر");
  const salt = crypto.randomBytes(16), k = await scrypt(pass, salt);
  return "scrypt2$" + kidOf(pep) + "$" + salt.toString("base64url") + "$" + crypto.createHmac("sha256", pep).update(k).digest("base64url");
}
// "ok" | "stale" (other pepper or the old unpeppered format) | "none"
function hashState(hash) {
  if (!hash) return "none";
  const [alg, kid] = String(hash).split("$"), pep = pepper();
  return alg === "scrypt2" && pep && kid === kidOf(pep) ? "ok" : "stale";
}
async function checkHash(pass, hash) {
  if (hashState(hash) !== "ok") return false;
  const [, , salt, key] = String(hash).split("$"), pep = pepper();
  const k = crypto.createHmac("sha256", pep).update(await scrypt(pass, Buffer.from(salt, "base64url"))).digest(), kk = Buffer.from(key, "base64url");
  return k.length === kk.length && crypto.timingSafeEqual(k, kk);
}
async function savedHash() { return (await settings()).adminPasswordHash || null; }
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
  return hash ? await checkHash(pass, hash) : false;
}
// Code for the first login (see setupCode)
function setupCodeOk(code) {
  const c = setupCode();
  return !!c && safeEq(String(code || ""), c);
}

// ---- brute-force throttle per client IP (lib/limits.js picks the platform's address, not a client-chosen header) ----
// 5 wrong tries -> 10 minutes (this instance), plus hourly caps shared by every instance when DONATIONS_STORAGE is set:
// ADMIN_LOGIN_LIMIT (20) wrong passwords per IP and ADMIN_LOGIN_GLOBAL_LIMIT (200) from everyone.
const attempts = new Map(); // ip -> { n, until, last }
const ATTEMPTS_MAX = 5000;
function pruneAttempts(now) {
  for (const [k, a] of attempts) if (a.until < now && now - a.last > 3600e3) attempts.delete(k);
  while (attempts.size > ATTEMPTS_MAX) attempts.delete(attempts.keys().next().value); // oldest first
}
async function throttle(req) {
  const ip = limits.clientIp(req), a = attempts.get(ip), now = Date.now();
  if (a && a.until > now) throw httpError(429, "محاولات كتير غلط، استنى 10 دقايق");
  if (!(await limits.allowed("login", ip, limits.setting("ADMIN_LOGIN_LIMIT", 20), now)) || !(await limits.allowed("login", "*", limits.setting("ADMIN_LOGIN_GLOBAL_LIMIT", 200), now))) {
    throw httpError(429, "محاولات كتير غلط، حاول بعد ساعة");
  }
}
async function loginFailed(req) {
  const ip = limits.clientIp(req), now = Date.now(), a = attempts.get(ip) || { n: 0, until: 0, last: 0 };
  a.n++; a.last = now; if (a.n >= 5) { a.until = now + 10 * 60e3; a.n = 0; }
  attempts.delete(ip); attempts.set(ip, a); // re-insert: Map order = least recently failed first
  if (attempts.size > ATTEMPTS_MAX) pruneAttempts(now);
  await limits.hit("login", ip, now); await limits.hit("login", "*", now);
}
function loginOk(req) { attempts.delete(limits.clientIp(req)); }

// Only the console's own signed cookie counts (no client-supplied identity headers)
async function principal(req) {
  const t = await readToken(cookies(req)[COOKIE]);
  if (!t) return null;
  const renew = Date.now() - t.iat > RENEW_AFTER * 1000 && Date.now() - t.auth < MAX_AGE * 1000;
  return { userDetails: t.u, userRoles: ["admin"], via: "password", auth: t.auth, renew };
}

// Returns the principal or throws a 401 error (503 when GitHub cannot be read to check the session)
async function requireAdmin(req) {
  const p = await principal(req);
  if (!p) throw httpError(401, "يلزم تسجيل الدخول");
  return p;
}

// Paths the admin may read/write, relative to the site root
const ALLOWED = [
  /^public\/index\.html$/,
  /^public\/(contact|afia|zakat|donate|albums|volunteer|help)\.html$/,
  /^public\/content\.json$/, /^public\/data\/(menu|albums|pages|settings|site|donate|community|news|impact|announce|partners)\.json$/,
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

// Read a file (utf8 string or Buffer) from the branch. The contents API leaves `content` empty for files over 1 MB:
// those are read through the blobs API (up to 100 MB) instead of coming back as "".
async function readFile(relPath, { binary = false } = {}) {
  const { api, repo, branch } = gh();
  const full = checkPath(relPath);
  const d = await api(`/repos/${repo}/contents/${encodeURI(full)}?ref=${encodeURIComponent(branch)}`);
  let b64 = d.content || "";
  if (!b64 && d.size > 0 && d.sha) b64 = (await api(`/repos/${repo}/git/blobs/${d.sha}`)).content || "";
  const buf = Buffer.from(b64, "base64");
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
  makeToken, sessionCookie, sessionFor, verifyPassword, passwordSource, hashPassword, setupCodeOk, adminUser, throttle, loginFailed, loginOk,
  TTL, MAX_AGE, githubReady, setupHint, hashState, settings, saveSettings, clientIp: limits.clientIp, cookies, _attempts: attempts };
