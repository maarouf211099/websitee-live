// Site details (hotline, phone, WhatsApp, email, address, social links, footer text): GET / PUT /api/console/site.
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
const PAY = ["off", "demo", "live"], PROVIDERS = ["paymob", "mpgs"];
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
  const out = {
    payMode: PAY.includes(src.payMode) ? src.payMode : "off",
    ...(PROVIDERS.includes(src.payProvider) ? { payProvider: src.payProvider } : {}), // only once the console saved one
    hotline: str(src.hotline, 20), phone: str(src.phone, 20), whatsapp: str(src.whatsapp, 20),
    email: str(src.email, 120), address: str(src.address, 200), social: {},
    footer: { name: str(footer.name, 120), text: str(footer.text, 400) },
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
  return null;
}

// JS object literal with unquoted keys (so the settings endpoint's `payMode: "…"` regex keeps matching)
function toJs(v, ind) {
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
      const p = await requireAdmin(req);
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

module.exports = { parseSite, normalize, validate, render, toJs, SOCIAL, siteRev };
