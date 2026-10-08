// Admin helpers: Static Web Apps auth (role "admin") and committing files to GitHub.
// Settings (Static Web App -> Environment variables):
//   GITHUB_TOKEN   fine-grained PAT with "Contents: read & write" on the repo
//   GITHUB_REPO    e.g. maarouf211099/websitee-live
//   GITHUB_BRANCH  e.g. main (the branch the Static Web App deploys from)
//   SITE_ROOT      folder of the site inside the repo (default mersal-site)

const SITE_ROOT = (process.env.SITE_ROOT || "mersal-site").replace(/^\/+|\/+$/g, "");

function principal(req) {
  const h = req.headers.get("x-ms-client-principal");
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h, "base64").toString("utf8")); } catch { return null; }
}

// Returns the principal or throws a 401/403 response-like error
function requireAdmin(req) {
  const p = principal(req);
  if (!p) { const e = new Error("يلزم تسجيل الدخول"); e.status = 401; throw e; }
  if (!(p.userRoles || []).includes("admin")) { const e = new Error("الحساب ده مش أدمن"); e.status = 403; throw e; }
  return p;
}

// Paths the admin may read/write, relative to the site root
const ALLOWED = [
  /^public\/content\.json$/, /^public\/data\/(menu|albums|pages|settings)\.json$/,
  /^public\/p\/\d{1,4}\.html$/, /^public\/js\/layout\.js$/,
  /^public\/img\/uploads\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif)$/,
];
function checkPath(p) {
  if (!ALLOWED.some((r) => r.test(p))) { const e = new Error("مسار غير مسموح: " + p); e.status = 400; throw e; }
  return `${SITE_ROOT}/${p}`;
}

function gh() {
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO, branch = process.env.GITHUB_BRANCH || "main";
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

module.exports = { principal, requireAdmin, readFile, commitFiles, checkPath, json, fail, SITE_ROOT };
