// Admin API (console login with a cookie session). Every change is one git commit to
// the deploy branch, so the site republishes itself about a minute later.
const { app } = require("@azure/functions");
const { requireAdmin, readFile, commitFiles, json, fail, makeToken, sessionCookie, verifyPassword, passwordSource, hashPassword, setupCodeOk, adminUser, throttle, loginFailed, loginOk, TTL } = require("../lib/admin");
const donations = require("../lib/donations");
const hero = require("../lib/hero");

const JSON_FILES = { content: "public/content.json", albums: "public/data/albums.json", pages: "public/data/pages.json", menu: "public/data/menu.json" };
const who = (p) => ({ name: p.userDetails || "Mersal admin", email: /@/.test(p.userDetails || "") ? p.userDetails : "admin@mersal-ngo.org" });

async function saveSettings(patch, message, p) {
  let settings = {};
  try { settings = JSON.parse(await readFile("public/data/settings.json")); } catch (e) { settings = {}; }
  Object.assign(settings, patch);
  return commitFiles([{ path: "public/data/settings.json", content: JSON.stringify(settings, null, 2) + "\n" }], message, who(p));
}

// GET /api/admin/status (public): does the console still need its first-login setup?
app.http("adminStatus", {
  methods: ["GET"], authLevel: "anonymous", route: "admin/status",
  handler: async (req, ctx) => {
    try { return json(200, { user: adminUser(), setup: (await passwordSource()) === "setup", github: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) }); }
    catch (e) { return fail(e, ctx); }
  },
});

// POST /api/admin/login { user, password, code? } -> session cookie (12h).
// First login (no password yet): the one-time code from api/setup.json is required and the given password becomes the console password.
app.http("adminLogin", {
  methods: ["POST"], authLevel: "anonymous", route: "admin/login",
  handler: async (req, ctx) => {
    try {
      throttle(req);
      const b = await req.json().catch(() => ({}));
      const user = String(b.user || "").trim(), pass = String(b.password || "");
      const source = await passwordSource();
      if (source === "setup") {
        if (!setupCodeOk(b.code)) { loginFailed(req); return json(401, { message: "كود التفعيل غلط", setup: true }); }
        if (user !== adminUser()) return json(400, { message: "اسم المستخدم لازم يكون " + adminUser(), setup: true });
        if (pass.length < 8) return json(400, { message: "كلمة السر لازم 8 حروف على الأقل", setup: true });
        await saveSettings({ adminPasswordHash: hashPassword(pass) }, "admin: set console password", { userDetails: user });
      } else if (!(await verifyPassword(user, pass))) { loginFailed(req); return json(401, { message: "اسم المستخدم أو كلمة السر غلط" }); }
      loginOk(req);
      return { ...json(200, { ok: true, user }), cookies: [sessionCookie(req, makeToken(user), TTL)] };
    } catch (e) { return fail(e, ctx); }
  },
});
app.http("adminLogout", {
  methods: ["POST"], authLevel: "anonymous", route: "admin/logout",
  handler: async (req) => ({ ...json(200, { ok: true }), cookies: [sessionCookie(req, "", 0)] }),
});
// POST /api/admin/password { current, next } -> new scrypt hash in data/settings.json (unless ADMIN_PASSWORD is fixed in Azure)
app.http("adminPassword", {
  methods: ["POST"], authLevel: "anonymous", route: "admin/password",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      if (p.via !== "password") return json(409, { message: "الحساب ده بيدخل بمايكروسوفت، مفيش كلمة سر هنا" });
      if (process.env.ADMIN_PASSWORD) return json(409, { message: "كلمة السر متظبطة من إعدادات Azure (ADMIN_PASSWORD)، غيّرها من هناك" });
      const b = await req.json().catch(() => ({}));
      if (!(await verifyPassword(p.userDetails, String(b.current || "")))) return json(401, { message: "كلمة السر الحالية غلط" });
      const next = String(b.next || "");
      if (next.length < 8) return json(400, { message: "كلمة السر الجديدة لازم 8 حروف على الأقل" });
      const sha = await saveSettings({ adminPasswordHash: hashPassword(next) }, "admin: change console password", p);
      return json(200, { ok: true, commit: sha });
    } catch (e) { return fail(e, ctx); }
  },
});

app.http("adminMe", {
  methods: ["GET"], authLevel: "anonymous", route: "admin/me",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      return json(200, { user: p.userDetails, roles: p.userRoles, via: p.via, github: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO), donations: donations.enabled(),
        password: p.via === "password" ? await passwordSource() : "aad",
        mpgs: !!(process.env.MPGS_MERCHANT && process.env.MPGS_API_PASSWORD), merchant: process.env.MPGS_MERCHANT || null });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/admin/data/{name}   PUT /api/admin/data/{name}  { data, message? }
app.http("adminData", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "admin/data/{name}",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      const path = JSON_FILES[req.params.name];
      if (!path) return json(404, { message: "ملف غير معروف" });
      if (req.method === "GET") return json(200, JSON.parse(await readFile(path)));
      const body = await req.json();
      const files = [{ path, content: JSON.stringify(body.data, null, 2) + "\n" }];
      if (req.params.name === "content") {
        // the hero is baked into index.html: regenerate it in the same commit so the two never drift
        const idx = await readFile("public/index.html");
        files.push({ path: "public/index.html", content: hero.apply(idx, body.data) });
      }
      const sha = await commitFiles(files, body.message || `admin: update ${req.params.name}`, who(p));
      return json(200, { ok: true, commit: sha });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/admin/page/{id}  -> { title, desc, body }     PUT -> { title, desc, body }
app.http("adminPage", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "admin/page/{id}",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      const id = String(req.params.id).replace(/\D/g, "");
      const path = `public/p/${id}.html`;
      const html = await readFile(path);
      const m = /<!-- mersal:content -->([\s\S]*?)<!-- \/mersal:content -->/.exec(html);
      const get = (re) => (re.exec(html) || [])[1] || "";
      const cur = { id, title: get(/<h1>([^<]*)<\/h1>/), desc: get(/<meta name="description" content="([^"]*)"/), body: m ? m[1].trim() : "" };
      if (req.method === "GET") return json(200, cur);
      if (!m) return json(409, { message: "الصفحة دي من غير علامات تحرير، شغّل سكربت النقل تاني" });
      const b = await req.json();
      const esc = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      let out = html
        .replace(m[0], "<!-- mersal:content -->\n" + String(b.body || "").trim() + "\n<!-- /mersal:content -->")
        .replace(/<h1>[^<]*<\/h1>/, "<h1>" + esc(b.title) + "</h1>")
        .replace(/<title>[^<]*<\/title>/, "<title>" + esc(b.title) + " | مؤسسة مرسال</title>")
        .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(b.desc) + '">')
        .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(b.title) + '">')
        .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(b.desc) + '">');
      const pages = JSON.parse(await readFile(JSON_FILES.pages));
      const photo = (/<img[^>]+src="(\/img\/[^"]+)"/.exec(b.body || "") || [])[1];
      pages[id] = { ...(pages[id] || {}), title: b.title, desc: String(b.desc || "").slice(0, 140), ...(photo && !/checklist|logo/.test(photo) ? { photo, photoSm: photo } : {}) };
      const sha = await commitFiles([{ path, content: out }, { path: JSON_FILES.pages, content: JSON.stringify(pages, null, 1) + "\n" }], `admin: edit page ${id} (${b.title})`, who(p));
      return json(200, { ok: true, commit: sha });
    } catch (e) { return fail(e, ctx); }
  },
});

// POST /api/admin/upload  { files: [{ name, data(base64) }], message? } -> { urls: [] }
// Images are resized in the browser before upload; this only stores them.
app.http("adminUpload", {
  methods: ["POST"], authLevel: "anonymous", route: "admin/upload",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      const b = await req.json();
      const files = (b.files || []).slice(0, 40).map((f, i) => {
        const ext = (/\.(jpe?g|png|webp|gif)$/i.exec(f.name || "") || [, "jpg"])[1].toLowerCase();
        const stem = String(f.name || "img").replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "img";
        const name = `${Date.now().toString(36)}${i}-${stem}.${ext}`;
        return { path: `public/img/uploads/${name}`, content: Buffer.from(f.data, "base64"), binary: true, url: `/img/uploads/${name}` };
      });
      if (!files.length) return json(400, { message: "مفيش ملفات" });
      const total = files.reduce((n, f) => n + f.content.length, 0);
      if (total > 40 * 1024 * 1024) return json(413, { message: "الملفات أكبر من 40 ميجا، ارفع على دفعات" });
      const sha = await commitFiles(files, b.message || `admin: upload ${files.length} image(s)`, who(p));
      return json(200, { ok: true, commit: sha, urls: files.map((f) => f.url) });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/admin/settings -> { payMode }   PUT { payMode }
app.http("adminSettings", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "admin/settings",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      const path = "public/js/layout.js";
      const js = await readFile(path);
      const cur = (/payMode:\s*"(off|demo|live)"/.exec(js) || [])[1] || "off";
      if (req.method === "GET") return json(200, { payMode: cur });
      const b = await req.json();
      if (!["off", "demo", "live"].includes(b.payMode)) return json(400, { message: "قيمة غير صحيحة" });
      if (b.payMode === "live" && !(process.env.MPGS_MERCHANT && process.env.MPGS_API_PASSWORD)) return json(409, { message: "إعدادات بنك مصر (MPGS_MERCHANT / MPGS_API_PASSWORD) مش متظبطة في Azure" });
      const out = js.replace(/payMode:\s*"(off|demo|live)"/, `payMode: "${b.payMode}"`);
      const sha = await commitFiles([{ path, content: out }], `admin: payMode -> ${b.payMode}`, who(p));
      return json(200, { ok: true, commit: sha, payMode: b.payMode });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/admin/donations?from=yyyy-mm-dd&to=yyyy-mm-dd
app.http("adminDonations", {
  methods: ["GET"], authLevel: "anonymous", route: "admin/donations",
  handler: async (req, ctx) => {
    try {
      requireAdmin(req);
      const rows = await donations.list({ from: req.query.get("from") || "", to: req.query.get("to") || "" });
      if (rows === null) return json(200, { enabled: false, rows: [] });
      return json(200, { enabled: true, rows });
    } catch (e) { return fail(e, ctx); }
  },
});
