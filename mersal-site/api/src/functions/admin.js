// Admin API (console login with a cookie session). Every change is one git commit to
// the deploy branch, so the site republishes itself about a minute later.
// Saves that replace a whole file (data/*, pages) need the revision the console read (X-Mersal-Base, see lib/commit.js):
// a file changed by someone else in between is a 409 instead of a silent overwrite.
const { app } = require("@azure/functions");
const { requireAdmin, readFile, commitFiles, fileExists, json, fail, sessionFor, sessionCookie, verifyPassword, passwordSource, hashPassword, setupCodeOk, adminUser, throttle, loginFailed, loginOk, githubReady, setupHint, saveSettings } = require("../lib/admin");
const donations = require("../lib/donations");
const hero = require("../lib/hero");
const pay = require("../lib/pay");
const paymob = require("../lib/paymob");
const { rev, retry, checkBase, baseOf, SHA_HEADER } = require("../lib/commit");

const JSON_FILES = { content: "public/content.json", albums: "public/data/albums.json", pages: "public/data/pages.json", menu: "public/data/menu.json", donate: "public/data/donate.json", community: "public/data/community.json", news: "public/data/news.json", impact: "public/data/impact.json", announce: "public/data/announce.json", partners: "public/data/partners.json" };
// what each file must hold (the public pages break on anything else)
const ARRAYS = ["menu", "albums", "news", "partners"];
const MAX_JSON = 1024 * 1024;
// links the pages render as href: site paths, #anchors, http(s), tel: and mailto: only (no javascript:, data:, //host)
const LINK_KEYS = /^(link|href|whatsappGroup|eventsLink|logo)$/;
const SAFE_LINK = /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)/i;
const who = (p) => ({ name: p.userDetails || "Mersal admin", email: /@/.test(p.userDetails || "") ? p.userDetails : "admin@mersal-ngo.org" });
const withRev = (res, sha) => ({ ...res, headers: { ...(res.headers || {}), [SHA_HEADER]: sha } });

// Arabic message for the first problem in a PUT /api/console/data/{name} body, or null
function checkData(name, data) {
  if (ARRAYS.includes(name) ? !Array.isArray(data) : !(data && typeof data === "object" && !Array.isArray(data))) {
    return ARRAYS.includes(name) ? "البيانات لازم تكون قائمة" : "البيانات ناقصة أو مش بالشكل الصحيح";
  }
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_JSON) return "الملف أكبر من 1 ميجا";
  let bad = null;
  (function walk(v, key) {
    if (bad) return;
    if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") Object.keys(v).forEach((k) => walk(v[k], k));
    else if (typeof v === "string" && LINK_KEYS.test(key || "") && v.trim() && !SAFE_LINK.test(v.trim())) bad = v;
  })(data, "");
  return bad ? "رابط مش مسموح: " + String(bad).slice(0, 80) + " (لازم يبدأ بـ / أو https:// أو tel: أو mailto:)" : null;
}

// &quot; &#39; &lt; &gt; &nbsp; ... &amp; last, so the editor shows (and pages.json stores) plain text
function decodeEntities(t) {
  return String(t || "")
    .replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d{1,6});/g, (m, n) => (+n > 0 && +n < 0x110000 ? String.fromCodePoint(+n) : m))
    .replace(/&#x([0-9a-f]{1,6});/gi, (m, n) => (parseInt(n, 16) > 0 && parseInt(n, 16) < 0x110000 ? String.fromCodePoint(parseInt(n, 16)) : m))
    .replace(/&amp;/g, "&");
}

// GET /api/console/status (public): does the console still need its first-login setup?
app.http("adminStatus", {
  methods: ["GET"], authLevel: "anonymous", route: "console/status",
  handler: async (req, ctx) => {
    try {
      // settings: which Azure application settings the API can see (names only, never values), so a
      // misspelled or misplaced setting shows up on the login screen instead of a blind failure
      const EXPECTED = ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH", "ADMIN_PASSWORD", "DONATIONS_STORAGE"];
      const norm = (n) => n.replace(/[\s_-]+/g, "").toLowerCase();
      const names = Object.keys(process.env), settings = {};
      for (const k of EXPECTED) {
        if (String(process.env[k] || "").trim()) settings[k] = "ok";
        else if (k === "GITHUB_REPO" || k === "GITHUB_BRANCH") settings[k] = "default";
        else if (k in process.env) settings[k] = "empty";
        else { const near = names.find((n) => n !== k && norm(n) === norm(k)); settings[k] = near ? `found as "${near}"` : "missing"; }
      }
      return json(200, { user: adminUser(), setup: (await passwordSource()) === "setup", setupHint: setupHint(), github: githubReady(), settings });
    } catch (e) { return fail(e, ctx); }
  },
});

// POST /api/console/login { user, password, code? } -> session cookie (4h, renewed while the console is open, 12h at most).
// First login (no usable password yet): the setup code (ADMIN_SETUP_CODE, else the last 8 characters of GITHUB_TOKEN) is required
// and the given password becomes the console password.
app.http("adminLogin", {
  methods: ["POST"], authLevel: "anonymous", route: "console/login",
  handler: async (req, ctx) => {
    try {
      await throttle(req);
      const b = await req.json().catch(() => ({}));
      const user = String((b && b.user) || "").trim(), pass = String((b && b.password) || "");
      const source = await passwordSource();
      if (source === "setup") {
        if (setupHint() === "unavailable") return json(503, { message: "ضيف GITHUB_TOKEN في إعدادات Azure الأول، وبعدها كود التفعيل هو آخر 8 حروف منه", setup: true });
        if (!setupCodeOk(b && b.code)) { await loginFailed(req); return json(401, { message: "كود التفعيل غلط", setup: true }); }
        if (user !== adminUser()) return json(400, { message: "اسم المستخدم لازم يكون " + adminUser(), setup: true });
        if (pass.length < 8) return json(400, { message: "كلمة السر لازم 8 حروف على الأقل", setup: true });
        await saveSettings({ adminPasswordHash: await hashPassword(pass), sessionsValidAfter: Date.now() }, "admin: set console password", { name: user, email: "admin@mersal-ngo.org" });
      } else if (!(await verifyPassword(user, pass))) { await loginFailed(req); return json(401, { message: "اسم المستخدم أو كلمة السر غلط" }); }
      loginOk(req);
      return { ...json(200, { ok: true, user }), cookies: [await sessionFor(req, user)] };
    } catch (e) { return fail(e, ctx); }
  },
});
// POST /api/console/logout            -> clears this browser's cookie
// POST /api/console/logout {everywhere: true} (admin) -> also ends every session on every device (sessionsValidAfter)
app.http("adminLogout", {
  methods: ["POST"], authLevel: "anonymous", route: "console/logout",
  handler: async (req, ctx) => {
    try {
      const b = await req.json().catch(() => ({}));
      if (b && b.everywhere) {
        const p = await requireAdmin(req);
        await saveSettings({ sessionsValidAfter: Date.now() }, "admin: sign out everywhere", who(p));
      }
      return { ...json(200, { ok: true }), cookies: [sessionCookie(req, "", 0)] };
    } catch (e) { return fail(e, ctx); }
  },
});
// POST /api/console/password { current, next } -> new scrypt hash in data/settings.json (unless ADMIN_PASSWORD is fixed in Azure).
// Every other session ends (the signing key follows the hash, and sessionsValidAfter moves); this browser gets a fresh cookie.
app.http("adminPassword", {
  methods: ["POST"], authLevel: "anonymous", route: "console/password",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
      if (p.via !== "password") return json(409, { message: "الحساب ده بيدخل بمايكروسوفت، مفيش كلمة سر هنا" });
      if (process.env.ADMIN_PASSWORD) return json(409, { message: "كلمة السر متظبطة من إعدادات Azure (ADMIN_PASSWORD)، غيّرها من هناك" });
      await throttle(req); // a stolen cookie must not allow unlimited guesses at the current password
      const b = await req.json().catch(() => ({}));
      if (!(await verifyPassword(p.userDetails, String((b && b.current) || "")))) { await loginFailed(req); return json(401, { message: "كلمة السر الحالية غلط" }); }
      loginOk(req);
      const next = String((b && b.next) || "");
      if (next.length < 8) return json(400, { message: "كلمة السر الجديدة لازم 8 حروف على الأقل" });
      const sha = await saveSettings({ adminPasswordHash: await hashPassword(next), sessionsValidAfter: Date.now() }, "admin: change console password", who(p));
      return { ...json(200, { ok: true, commit: sha }), cookies: [await sessionFor(req, p.userDetails)] };
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/console/me: who is logged in + what is configured. Also renews the session cookie (sliding 4 hours).
app.http("adminMe", {
  methods: ["GET"], authLevel: "anonymous", route: "console/me",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
      const res = json(200, { user: p.userDetails, roles: p.userRoles, via: p.via, github: githubReady(), donations: donations.enabled(),
        password: p.via === "password" ? await passwordSource() : "aad",
        mpgs: !!(process.env.MPGS_MERCHANT && process.env.MPGS_API_PASSWORD), merchant: process.env.MPGS_MERCHANT || null,
        // Paymob: ready to take real donations, or the NAMES of the missing settings + why the keys cannot (never values),
        // and test/live from the key prefix
        paymob: paymob.ready(), paymobMissing: pay.missingFor("paymob"), paymobMode: paymob.mode(),
        app: pay.ready("app"), appMissing: pay.missingFor("app"), // Paymob through the Mersal app's backend (+ why not, when not)
        payModeEnv: String(process.env.PAY_MODE || "").trim().toLowerCase() || null });
      return p.renew ? { ...res, cookies: [await sessionFor(req, p.userDetails, p.auth)] } : res;
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/console/data/{name}   PUT /api/console/data/{name}  { data, message? }  (+ X-Mersal-Base header)
app.http("adminData", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "console/data/{name}",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
      const name = String(req.params.name || "");
      const path = Object.prototype.hasOwnProperty.call(JSON_FILES, name) ? JSON_FILES[name] : null;
      if (!path) return json(404, { message: "ملف غير معروف" });
      if (req.method === "GET") { const text = await readFile(path); return withRev(json(200, JSON.parse(text)), rev(text)); }
      const body = await req.json().catch(() => null);
      const data = body && body.data;
      const bad = checkData(name, data);
      if (bad) return json(400, { message: bad });
      const base = baseOf(req);
      checkBase(base, base || ""); // 428 when the console sent no revision
      if (name === "content") {
        // the tool-made phone crop (-m) next to each banner (does not depend on the file's current state: done once)
        for (const sl of data.slides || []) {
          if (sl && typeof sl.banner === "string" && !sl.mobile && /^\/img\/(?!uploads\/)[A-Za-z0-9._\/-]+\.(jpe?g|png)$/i.test(sl.banner)) {
            const m = sl.banner.replace(/\.(jpe?g|png)$/i, "-m.jpg");
            if (m !== sl.banner && (await fileExists("public" + m))) sl.mobile = m;
          }
        }
      }
      const content = JSON.stringify(data, null, 2) + "\n";
      let msFor = null;
      const sha = await retry(commitFiles, async () => {
        checkBase(base, rev(await readFile(path)));
        const files = [{ path, content }];
        if (name === "content") {
          // the hero is baked into index.html: regenerate it in the same commit so the two never drift
          const idx = await readFile("public/index.html");
          if (!msFor) {
            // the tool-made 1.5x phone crop (-ms) next to each 2x one (-m): lighter file for dpr-2 phones
            msFor = {};
            for (const sl of data.slides || []) {
              if (sl && typeof sl.mobile === "string" && /^\/img\/(?!uploads\/)[A-Za-z0-9._\/-]+-m\.jpg$/i.test(sl.mobile)) {
                const ms = sl.mobile.replace(/-m\.jpg$/i, "-ms.jpg");
                if (await fileExists("public" + ms)) msFor[sl.mobile] = ms;
              }
            }
          }
          const mobileSet = (sl) => (msFor[sl.mobile] ? [{ src: msFor[sl.mobile], w: 1324 }, { src: sl.mobile, w: 1766 }] : null);
          files.push({ path: "public/index.html", content: hero.apply(idx, data, { mobileSet }) });
        }
        return files;
      }, String((body && body.message) || `admin: update ${name}`).slice(0, 200), who(p));
      return withRev(json(200, { ok: true, commit: sha }), rev(content));
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/console/page/{id}  -> { title, desc, body, url, static }     PUT -> { title, desc, body }  (+ X-Mersal-Base)
// id = number (imported page public/p/<id>.html) or one of the fixed static pages (public/<id>.html).
// "عن مرسال" is /p/3.html (an imported page): the old /about.html is not offered any more.
const STATIC = ["contact", "afia", "zakat"];
app.http("adminPage", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "console/page/{id}",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
      const raw = String(req.params.id || "").trim(), isStatic = STATIC.includes(raw);
      const id = isStatic ? raw : raw.replace(/\D/g, "").slice(0, 4);
      if (!id) return json(404, { message: "صفحة غير معروفة" });
      const path = isStatic ? `public/${id}.html` : `public/p/${id}.html`;
      const MARK = /<!-- mersal:content -->([\s\S]*?)<!-- \/mersal:content -->/;
      const parse = (html) => {
        const m = MARK.exec(html), get = (re) => decodeEntities((re.exec(html) || [])[1] || "");
        return { m, cur: { id, static: isStatic, url: isStatic ? `/${id}.html` : `/p/${id}.html`, title: get(/<h1>([^<]*)<\/h1>/), desc: get(/<meta name="description" content="([^"]*)"/), body: m ? m[1].trim() : "" } };
      };
      if (req.method === "GET") { const html = await readFile(path); return withRev(json(200, parse(html).cur), rev(html)); }
      const b = (await req.json().catch(() => null)) || {};
      const title = String(b.title || "").trim(), desc = String(b.desc || "").trim(), body = String(b.body || "").trim();
      const base = baseOf(req);
      checkBase(base, base || "");
      const esc = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      let out = null;
      const sha = await retry(commitFiles, async () => {
        const html = await readFile(path);
        checkBase(base, rev(html));
        const { m } = parse(html);
        if (!m) throw Object.assign(new Error("الصفحة دي من غير علامات تحرير، شغّل سكربت النقل تاني"), { status: 409 });
        // function replacers: "$&", "$'", "$`" and "$$" in the text stay literal (100$&nbsp; must not paste the old page)
        out = html
          .replace(m[0], () => "<!-- mersal:content -->\n" + body + "\n<!-- /mersal:content -->")
          .replace(/<h1>[^<]*<\/h1>/, () => "<h1>" + esc(title) + "</h1>")
          .replace(/<title>[^<]*<\/title>/, () => "<title>" + esc(title) + " | مؤسسة مرسال</title>")
          .replace(/<meta name="description" content="[^"]*">/, () => '<meta name="description" content="' + esc(desc) + '">')
          .replace(/<meta property="og:title" content="[^"]*">/, () => '<meta property="og:title" content="' + esc(title) + '">')
          .replace(/<meta property="og:description" content="[^"]*">/, () => '<meta property="og:description" content="' + esc(desc) + '">');
        const files = [{ path, content: out }];
        if (!isStatic) {
          // the imported pages are listed in pages.json (search + campaign links) as plain text; the static ones are not
          const pages = JSON.parse(await readFile(JSON_FILES.pages));
          const photo = (/<img[^>]+src="(\/img\/[^"]+)"/.exec(body) || [])[1];
          pages[id] = { ...(pages[id] || {}), title, desc: desc.slice(0, 140), ...(photo && !/checklist|logo/.test(photo) ? { photo, photoSm: photo } : {}) };
          files.push({ path: JSON_FILES.pages, content: JSON.stringify(pages, null, 1) + "\n" });
        }
        return files;
      }, `admin: edit page ${id} (${title.slice(0, 80)})`, who(p));
      return withRev(json(200, { ok: true, commit: sha }), rev(out));
    } catch (e) { return fail(e, ctx); }
  },
});

// POST /api/console/upload  { files: [{ name, data(base64) }], message? } -> { urls: [] }
// Images are resized in the browser before upload; this only stores them.
app.http("adminUpload", {
  methods: ["POST"], authLevel: "anonymous", route: "console/upload",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
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
      const sha = await retry(commitFiles, async () => files, b.message || `admin: upload ${files.length} image(s)`, who(p));
      return json(200, { ok: true, commit: sha, urls: files.map((f) => f.url) });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/console/settings -> { payMode, payProvider, payProviderSaved, providers: { paymob, mpgs } }
// PUT { payMode, payProvider? }  ("paymob" | "mpgs"; left out = keep the saved one)
// Only the payMode / payProvider tokens change (lib/pay.js, read fresh on every try), so there is nothing to overwrite:
// no base revision needed. payProvider not saved yet = Banque Misr; going live always saves the gateway it goes live
// on, so the live gateway is always written down and never follows which settings exist.
app.http("adminSettings", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "console/settings",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req);
      const path = "public/js/layout.js";
      const providers = () => ({ app: pay.ready("app"), paymob: pay.ready("paymob"), mpgs: pay.ready("mpgs") });
      if (req.method === "GET") {
        const s = pay.read(await readFile(path));
        return json(200, { payMode: s.mode, payProvider: pay.effective(s.provider), payProviderSaved: s.provider, providers: providers() });
      }
      const b = (await req.json().catch(() => null)) || {};
      if (!pay.MODES.includes(b.payMode)) return json(400, { message: "قيمة غير صحيحة" });
      if (b.payProvider != null && !pay.PROVIDERS.includes(b.payProvider)) return json(400, { message: "بوابة دفع غير معروفة" });
      const fixed = String(process.env.PAY_MODE || "").trim().toLowerCase();
      if (fixed && fixed !== b.payMode) return json(409, { message: `PAY_MODE في إعدادات Azure = "${fixed}" وهو اللي /api/checkout بيمشي عليه. غيّره هناك الأول (أو امسحه) عشان الموقع والدفع يفضلوا متفقين` });
      let provider = null;
      const sha = await retry(commitFiles, async () => {
        const js = await readFile(path);
        provider = b.payProvider || pay.effective(pay.read(js).provider);
        // real payments only through a gateway whose settings are in Azure (names only in the message)
        if (b.payMode === "live" && !pay.ready(provider)) {
          throw Object.assign(new Error(provider === "mpgs" ? "إعدادات بنك مصر (MPGS_MERCHANT / MPGS_API_PASSWORD) مش متظبطة في Azure"
            : provider === "app" ? "MERSAL_SUPABASE_URL في إعدادات Azure مش رابط https صحيح (امسحه عشان يرجع للعنوان الأصلي)"
            : "إعدادات Paymob مش متظبطة في Azure، ناقص: " + pay.missingFor("paymob").join("، ")), { status: 409 });
        }
        return [{ path, content: pay.write(js, b.payMode, b.payProvider || (b.payMode === "live" ? provider : null)) }];
      }, `admin: payMode -> ${b.payMode}` + (b.payProvider ? `, payProvider -> ${b.payProvider}` : ""), who(p));
      return json(200, { ok: true, commit: sha, payMode: b.payMode, payProvider: provider, providers: providers() });
    } catch (e) { return fail(e, ctx); }
  },
});

// GET /api/console/donations?from=yyyy-mm-dd&to=yyyy-mm-dd  (Cairo days)
app.http("adminDonations", {
  methods: ["GET"], authLevel: "anonymous", route: "console/donations",
  handler: async (req, ctx) => {
    try {
      await requireAdmin(req);
      const rows = await donations.list({ from: req.query.get("from") || "", to: req.query.get("to") || "" });
      if (rows === null) return json(200, { enabled: false, rows: [] });
      return json(200, { enabled: true, rows });
    } catch (e) { return fail(e, ctx); }
  },
});

module.exports = { checkData, decodeEntities };
