// Site details (hotline, phone, WhatsApp, email, address, social links, footer text, footer links, legal line): GET / PUT /api/console/site.
// They live in public/js/layout.js between the /* mersal:site */ … /* /mersal:site */ markers (the SITE object literal),
// so pages need no extra request; the API rewrites that block and mirrors it to public/data/site.json in one commit.
// payMode (card payment) and payProvider (its gateway, lib/pay.js) stay inside the same object but are only changed by
// the settings endpoint (adminSettings). Revision (X-Mersal-Sha / X-Mersal-Base, lib/commit.js) = the site details
// without them, so flipping the card switch does not block a details save, but another admin's details edit does (409).
const { app } = require("@azure/functions");
const { requireAdmin, readFile, commitFiles, json, fail } = require("../lib/admin");
const { rev, retry, checkBase, baseOf, SHA_HEADER } = require("../lib/commit");

const LAYOUT = "public/js/layout.js", COPY = "public/data/site.json";
const MARK = /\/\* mersal:site \*\/([\s\S]*?)\/\* \/mersal:site \*\//;
const SOCIAL = ["facebook", "instagram", "x", "linkedin", "youtube", "tiktok"];
const PAY = ["off", "demo", "live"], PROVIDERS = ["app", "paymob", "mpgs"];
const who = (p) => ({ name: p.userDetails || "Mersal admin", email: /@/.test(p.userDetails || "") ? p.userDetails : "admin@mersal-ngo.org" });
const err = (status, message) => Object.assign(new Error(message), { status });

// The block is a JS object literal with one `key: value` per line: quote the keys and read it as JSON (no code is executed).
function parseSite(js) {
  const m = MARK.exec(js);
  if (!m) throw err(409, "علامات mersal:site مش موجودة في js/layout.js");
  const text = m[1].replace(/^(\s*)([A-Za-z_$][\w$]*)\s*:/gm, '$1"$2":').replace(/,(\s*[}\]])/g, "$1");
  try { return normalize(JSON.parse(text)); } catch (e) { throw err(500, "تعذّر قراءة بيانات الموقع من layout.js: " + e.message); }
}

// Clean copy of a site object: trimmed strings, fixed key order, nothing that could break the JS block
const str = (v, max) => String(v == null ? "" : v).replace(/\*\//g, "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
function normalize(src) {
  src = src && typeof src === "object" ? src : {};
  const social = src.social && typeof src.social === "object" ? src.social : {}, footer = src.footer && typeof src.footer === "object" ? src.footer : {};
  const legal = src.legal && typeof src.legal === "object" ? src.legal : {};
  const out = {
    payMode: PAY.includes(src.payMode) ? src.payMode : "off",
    ...(PROVIDERS.includes(src.payProvider) ? { payProvider: src.payProvider } : {}), // only once the console saved one
    hotline: str(src.hotline, 20), phone: str(src.phone, 20), whatsapp: str(src.whatsapp, 20),
    email: str(src.email, 120), address: str(src.address, 200), social: {},
    footer: {
      name: str(footer.name, 120), text: str(footer.text, 400),
      // the strip above the footer on inner pages (empty = the built-in wording) and the footer links (empty = the built-in list)
      stripTitle: str(footer.stripTitle, 80), stripText: str(footer.stripText, 120),
      links: (Array.isArray(footer.links) ? footer.links : []).slice(0, 40).map((l) => ({ title: str(l && l.title, 60), href: str(l && l.href, 300) })).filter((l) => l.title && l.href),
    },
    // legal identity line in the footer and on privacy.html (registration / fundraising permit); nothing shows while regNo is empty
    legal: { regNo: str(legal.regNo, 40), regYear: str(legal.regYear, 10), regBody: str(legal.regBody, 120), permitNo: str(legal.permitNo, 40), permitUntil: str(legal.permitUntil, 40) },
  };
  // a bare host ("tiktok.com/@mersal") gets https://; anything with another scheme (javascript:, ftp:) is left for validate() to reject
  SOCIAL.forEach((k) => { let u = str(social[k], 300); if (u && !/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u; out.social[k] = u; });
  return out;
}

// Returns an Arabic message for the first invalid field, or null
function validate(site) {
  const num = (v) => !v || /^\+?\d[\d ]{2,18}$/.test(v);
  if (!num(site.hotline)) return "الخط الساخن لازم يكون أرقام بس";
  if (!num(site.phone)) return "رقم الهاتف لازم يكون أرقام بس";
  if (!num(site.whatsapp)) return "رقم الواتساب لازم يكون أرقام بس (مثال 01xxxxxxxxx)";
  if (site.email && !/^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/.test(site.email)) return "البريد الإلكتروني مش صحيح";
  for (const k of SOCIAL) { const u = site.social[k]; if (u && !/^https?:\/\/[^\s"'<>]+$/i.test(u)) return "رابط " + k + " مش صحيح"; }
  if (!site.footer.name) return "اسم المؤسسة في الفوتر مطلوب";
  // footer links: site paths, #anchors, http(s), tel:, mailto:, or {youtube} / {facebook} … (follows that social link)
  for (const l of site.footer.links) {
    if (!/^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)[^\s"'<>]*$/i.test(l.href) && !new RegExp("^\\{(" + SOCIAL.join("|") + ")\\}$").test(l.href)) return "رابط «" + l.title + "» في الفوتر مش مسموح (لازم يبدأ بـ / أو https://)";
  }
  return null;
}

// JS object literal with unquoted keys (so the settings endpoint's `payMode: "…"` regex keeps matching)
function toJs(v, ind) {
  if (Array.isArray(v)) return v.length ? "[\n" + v.map((x) => ind + "  " + toJs(x, ind + "  ")).join(",\n") + "\n" + ind + "]" : "[]";
  if (v && typeof v === "object") return "{\n" + Object.keys(v).map((k) => ind + "  " + k + ": " + toJs(v[k], ind + "  ")).join(",\n") + "\n" + ind + "}";
  return JSON.stringify(v);
}
function render(js, site) {
  if (!MARK.test(js)) throw err(409, "علامات mersal:site مش موجودة في js/layout.js");
  return js.replace(MARK, () => "/* mersal:site */ " + toJs(site, "  ") + " /* /mersal:site */");
}

// (the same text as before payProvider existed when it is not saved, so open consoles keep a valid revision)
const siteRev = (site) => { const { payMode, payProvider, ...rest } = site || {}; return rev(JSON.stringify({ payMode: "", ...rest })); };
const withRev = (res, sha) => ({ ...res, headers: { ...(res.headers || {}), [SHA_HEADER]: sha } });

app.http("adminSite", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "console/site",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req, req.method === "GET" ? null : "site");
      if (req.method === "GET") { const cur = parseSite(await readFile(LAYOUT)); return withRev(json(200, cur), siteRev(cur)); }
      const b = (await req.json().catch(() => ({}))) || {};
      const draft = normalize({ ...(b.site || b), payMode: "off", payProvider: null });
      const bad = validate(draft);
      if (bad) return json(400, { message: bad });
      const base = baseOf(req);
      checkBase(base, base || ""); // 428 when the console sent no revision
      let next = null;
      const sha = await retry(commitFiles, async () => {
        const js = await readFile(LAYOUT), cur = parseSite(js);
        checkBase(base, siteRev(cur));
        next = normalize({ ...draft, payMode: cur.payMode, payProvider: cur.payProvider }); // changed from the settings tab only
        return [{ path: LAYOUT, content: render(js, next) }, { path: COPY, content: JSON.stringify(next, null, 2) + "\n" }];
      }, b.message || "admin: site details", who(p));
      return withRev(json(200, { ok: true, commit: sha, site: next }), siteRev(next));
    } catch (e) { return fail(e, ctx); }
  },
});

// ---- page titles and descriptions for search engines and sharing: GET / PUT /api/console/seo (perm "content") ----
// The fixed pages below keep <title>, meta description and og:title / og:description in their own HTML; this rewrites those
// four tags only (one commit for every page that changed). The content pages (/p/*.html) and contact / afia / zakat keep
// their title and description in the page editor ("الصفحات"), which also writes their <h1>.
const SEO_PAGES = { index: "الرئيسية", donate: "طرق التبرع", gift: "اهدي تبرعك", news: "الأخبار", albums: "ألبومات الصور", volunteer: "تطوع معنا", help: "طلب مساعدة" };
const SEO_RE = {
  title: /<title>([^<]*)<\/title>/, desc: /<meta name="description" content="([^"]*)">/,
  ogTitle: /<meta property="og:title" content="([^"]*)">/, ogDesc: /<meta property="og:description" content="([^"]*)">/,
};
const unent = (t) => String(t || "").replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attr = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const seoOf = (html) => { const o = {}; for (const k of Object.keys(SEO_RE)) o[k] = unent((SEO_RE[k].exec(html) || [])[1] || ""); return o; };
const seoPath = (id) => (id === "index" ? "public/index.html" : `public/${id}.html`);
async function readSeo() {
  const out = {};
  for (const id of Object.keys(SEO_PAGES)) out[id] = { id, name: SEO_PAGES[id], url: id === "index" ? "/" : `/${id}.html`, ...seoOf(await readFile(seoPath(id))) };
  return out;
}
const seoRev = (all) => rev(JSON.stringify(Object.keys(SEO_PAGES).map((id) => [all[id].title, all[id].desc, all[id].ogTitle, all[id].ogDesc])));
// one page's tags with the new values (a tag the page does not have is left out, never added)
function writeSeo(html, v) {
  let out = html;
  out = out.replace(SEO_RE.title, () => "<title>" + attr(v.title) + "</title>");
  out = out.replace(SEO_RE.desc, () => '<meta name="description" content="' + attr(v.desc) + '">');
  out = out.replace(SEO_RE.ogTitle, () => '<meta property="og:title" content="' + attr(v.ogTitle || v.title) + '">');
  out = out.replace(SEO_RE.ogDesc, () => '<meta property="og:description" content="' + attr(v.ogDesc || v.desc) + '">');
  return out;
}
const seoStr = (v, max) => String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
app.http("adminSeo", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "console/seo",
  handler: async (req, ctx) => {
    try {
      const p = await requireAdmin(req, req.method === "GET" ? null : "content");
      if (req.method === "GET") { const all = await readSeo(); return withRev(json(200, { pages: Object.keys(SEO_PAGES).map((id) => all[id]) }), seoRev(all)); }
      const b = (await req.json().catch(() => null)) || {}, want = {};
      for (const id of Object.keys((b && b.pages) || {})) {
        if (!Object.prototype.hasOwnProperty.call(SEO_PAGES, id)) return json(400, { message: "صفحة غير معروفة: " + String(id).slice(0, 40) });
        const v = b.pages[id] || {};
        want[id] = { title: seoStr(v.title, 120), desc: seoStr(v.desc, 300), ogTitle: seoStr(v.ogTitle, 120), ogDesc: seoStr(v.ogDesc, 300) };
        if (!want[id].title) return json(400, { message: "عنوان صفحة «" + SEO_PAGES[id] + "» مطلوب" });
        if (!want[id].desc) return json(400, { message: "وصف صفحة «" + SEO_PAGES[id] + "» مطلوب" });
      }
      if (!Object.keys(want).length) return json(400, { message: "مفيش تغييرات" });
      const base = baseOf(req);
      checkBase(base, base || "");
      let after = null;
      const sha = await retry(commitFiles, async () => {
        const all = await readSeo();
        checkBase(base, seoRev(all));
        const files = [];
        for (const id of Object.keys(want)) {
          const html = await readFile(seoPath(id)), out = writeSeo(html, want[id]);
          if (out !== html) { files.push({ path: seoPath(id), content: out }); all[id] = { ...all[id], ...seoOf(out) }; }
        }
        after = all;
        return files.length ? files : null;
      }, b.message || "admin: page titles and descriptions", who(p));
      return withRev(json(200, { ok: true, commit: sha, pages: Object.keys(SEO_PAGES).map((id) => after[id]) }), seoRev(after));
    } catch (e) { return fail(e, ctx); }
  },
});

module.exports = { parseSite, normalize, validate, render, toJs, SOCIAL, siteRev, writeSeo, seoOf, SEO_PAGES };
