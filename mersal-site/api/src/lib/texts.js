// Site texts edited from the console tab "نصوص الموقع" (public/data/texts.json, perm "content").
// The home page sections and the donate page's amount chips are baked into the HTML between
// <!-- mersal:t-NAME --> … <!-- /mersal:t-NAME --> markers (like the hero in lib/hero.js), so visitors get them in the
// first paint: no extra request, no text swapping after load, and search engines see them.
//   clean(data)            -> { data } (a normalised copy: known keys only, trimmed, length-capped) or { error }
//   apply(html, data, ctx) -> html with every section that data holds re-rendered; sections it does not hold stay as
//                             they are, so a missing or partial texts.json leaves the page exactly as it was.
//   ctx = { hotline, banks }  the hotline (data/site.json) and the number of banks (data/donate.json) written in the
//                             markup; layout.js / home.js refresh both at runtime anyway.
// Every text is HTML-escaped; links must be site paths, #anchors, http(s), tel:, mailto: or sms:. Two tokens are
// allowed in texts: {hotline} (the hotline, kept in sync by layout.js) and, in the trust tiles, {banks} ("7 بنوك",
// counted from data/donate.json by home.js). A link "tel:{hotline}" follows the hotline too.
// Used by the admin API (api/src/functions/admin.js) and tools/render-home.js.
"use strict";

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/ /g, "&nbsp;");
const fmtEn = (n) => Number(n || 0).toLocaleString("en-US");
const SAFE_LINK = /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:|sms:)[^\s"'<>]*$/i;
const SAFE_IMG = /^(\/(?!\/)|https:\/\/)[^\s"'<>]+$/i;
const webp = (u) => (/^\/img\/(?!uploads\/)[A-Za-z0-9._\/-]+\.(jpe?g|png)$/i.test(u || "") ? u.replace(/\.(jpe?g|png)$/i, ".webp") : null);

// ---------- icons (the exact SVGs of the current page, per section) ----------
const ICONS = {
  trust: {
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  },
  niyya: {
    zakat: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h6"/>',
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
    hospital: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-5h6v5M12 9v5M9.5 11.5h5"/>',
    moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10z M17.5 4.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
    gift: '<path d="M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7c-2-4-7-4-6 0M12 7c2-4 7-4 6 0"/>',
  },
  services: {
    pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>',
    stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    hospital: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-5h6v5M12 8v5M9.5 10.5h5"/>',
    debt: '<path d="M3 12l4-4 4 3 3-3 4 1 3 3"/><path d="M7 8v6l4 4 3-1 4-4"/>',
    wheelchair: '<circle cx="10" cy="17" r="4"/><path d="M8 4h2v7h6l2 6"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>',
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
  },
  ways: {
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
  },
};
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

// ---------- normalising (the API refuses anything it cannot render safely) ----------
// Each field: [type, max] with type s (one-line text), t (multi-line text), l (link), i (image), n (number), b (boolean),
// e:<a|b|c> (one of), or a nested shape / [shape] (list, at most 30 items).
const S = (max) => ["s", max || 120], T = (max) => ["t", max || 600], L = ["l", 300], I = ["i", 300], N = ["n"], B = ["b"];
const E = (...v) => ["e", v];
const SHOW = E("all", "online", "offline");
const SHAPE = {
  home: {
    quick: { title: S(60), trust: S(120), amounts: ["list", N, 8], default: N, offlineLabel: S(60), offlineNumber: S(40) },
    trust: {
      items: [{ icon: E(...Object.keys(ICONS.trust)), title: S(80), sub: S(80), link: L, show: SHOW }],
      ways: [{ label: S(40), code: S(20), image: I, w: N, h: N, link: L }],
    },
    campaigns: { eyebrow: S(60), title: S(60), sub: S(200), cta: S(40) },
    niyya: { eyebrow: S(60), title: S(80), sub: S(200), items: [{ icon: E(...Object.keys(ICONS.niyya)), title: S(60), sub: S(120), link: L, highlight: B }] },
    about: {
      eyebrow: S(60), title: S(60), mark: S(80), text: T(900), values: [{ title: S(60), text: S(120) }], button: S(60), link: L,
      image: I, imageSm: I, w: N, h: N, alt: S(160), capEyebrow: S(60), capTitle: S(80), capText: S(160),
    },
    numbers: { title: S(60) },
    hospital: {
      campaign: S(20), status: S(80), image: I, imageSm: I, w: N, h: N, alt: S(160), eyebrow: S(60), title: S(60), mark: S(80), text: T(900),
      facts: [{ value: N, label: S(40) }], dua: S(240), shares: [{ amount: N, label: S(60), tag: S(40) }],
      donate: S(60), gift: S(60), more: S(60), moreLink: L,
    },
    services: { eyebrow: S(60), title: S(60), sub: S(200), items: [{ icon: E(...Object.keys(ICONS.services)), title: S(60), text: S(160), link: L }] },
    projects: { eyebrow: S(60), title: S(60) },
    ways: { eyebrow: S(60), title: S(60), sub: S(240), items: [{ icon: E(...Object.keys(ICONS.ways)), image: I, title: S(60), sub: S(80), link: L, show: SHOW }] },
    slogan: {
      ayah: S(300), cite: S(80), text: T(400), button: S(60), link: L, hotTitle: S(80), hotSub: S(40),
      branchesLabel: S(40), branchesText: S(60), branchesLink: L,
    },
  },
  donate: { amounts: ["list", N, 8], default: N },
};
const LABEL = { title: "العنوان", sub: "السطر الصغير", link: "الرابط", image: "الصورة", imageSm: "الصورة الصغيرة", moreLink: "رابط التفاصيل", branchesLink: "رابط الفروع", text: "النص" };

function cleanValue(spec, v, path) {
  if (Array.isArray(spec) && spec.length === 1 && typeof spec[0] === "object" && !Array.isArray(spec[0])) {
    if (!Array.isArray(v)) return [];
    if (v.length > 30) throw new Error("القائمة " + path + " فيها أكتر من 30 عنصر");
    return v.filter((x) => x && typeof x === "object" && !Array.isArray(x)).map((x, i) => cleanObj(spec[0], x, path + "[" + (i + 1) + "]"));
  }
  if (!Array.isArray(spec)) return cleanObj(spec, v && typeof v === "object" && !Array.isArray(v) ? v : {}, path);
  const [type, arg, max] = spec;
  if (type === "list") {
    const list = (Array.isArray(v) ? v : []).map((x) => Math.round(Number(x))).filter((x) => x >= 1 && x <= 1000000);
    if (list.length > (max || 8)) throw new Error("أقصى عدد للمبالغ " + (max || 8));
    return list;
  }
  if (type === "n") { const n = Math.round(Number(v)); return isFinite(n) && n >= 0 && n <= 100000000 ? n : 0; }
  if (type === "b") return v === true;
  if (type === "e") return arg.includes(v) ? v : arg[0];
  let s = String(v == null ? "" : v);
  s = type === "t" ? s.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim() : s.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  if (s.length > arg) throw new Error((LABEL[path.split(".").pop()] || path) + " أطول من " + arg + " حرف (" + path + ")");
  if (type === "l" && s && !SAFE_LINK.test(s)) throw new Error("رابط مش مسموح: " + s.slice(0, 80) + " (لازم يبدأ بـ / أو https:// أو tel: أو mailto: أو sms:)");
  if (type === "i" && s && !SAFE_IMG.test(s)) throw new Error("مسار صورة مش صحيح: " + s.slice(0, 80) + " (لازم يبدأ بـ / أو https://)");
  return s;
}
function cleanObj(shape, src, path) {
  const out = {};
  for (const k of Object.keys(shape)) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = cleanValue(shape[k], src[k], path ? path + "." + k : k);
  return out;
}
// -> { data } or { error }
function clean(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { error: "البيانات ناقصة أو مش بالشكل الصحيح" };
  try {
    const out = cleanObj(SHAPE, data, "");
    if (typeof data._note === "string") out._note = data._note.slice(0, 600);
    const q = out.home && out.home.quick, d = out.donate;
    for (const [o, name] of [[q, "التبرع السريع"], [d, "صفحة التبرع"]]) {
      if (!o || !("amounts" in o)) continue;
      if (o.amounts.length < 2) throw new Error("حط مبلغين على الأقل في " + name);
      if (!o.amounts.includes(o.default)) throw new Error("المبلغ الافتراضي في " + name + " لازم يكون واحد من المبالغ");
    }
    if (q && q.offlineNumber && !/^[0-9][0-9 -]{3,38}$/.test(q.offlineNumber)) throw new Error("رقم الحساب في صندوق التبرع (من غير بطاقة) مش صحيح");
    const hc = out.home && out.home.hospital;
    if (hc && "campaign" in hc && !/^(p\d{1,4}|general|zakat|sadaqa)$/.test(hc.campaign)) throw new Error("كود حملة المستشفى لازم يكون زي p30");
    return { data: out };
  } catch (e) { return { error: e.message }; }
}

// ---------- rendering (exactly the markup of the current page for the current texts) ----------
function tok(s, ctx) {
  return esc(s).replace(/\{hotline\}/g, '<bdi data-site="hotline">' + esc(ctx.hotline) + "</bdi>")
    .replace(/\{banks\}/g, '<span data-bank-count>' + esc(ctx.banks) + '</span> <span data-bank-word>' + (ctx.banks <= 10 ? "بنوك" : "بنك") + "</span>");
}
// href (+ data-site-href when it follows the hotline)
function href(link, ctx, fallback) {
  const l = String(link || fallback || "/donate.html");
  if (l === "tel:{hotline}") return 'href="tel:' + esc(ctx.hotline) + '" data-site-href="hotline"';
  return 'href="' + esc(l) + '"';
}
const showCls = (s) => (s === "online" ? "only-online" : s === "offline" ? "only-offline" : "");
const svgIn = (set, name) => ICONS[set][name] || ICONS[set][Object.keys(ICONS[set])[0]];
// <picture> of a photo with its small version: webp siblings only for the optimised site images (not /img/uploads/)
function pic(o, sizes) {
  const big = o.image, sm = o.imageSm || "", w = o.w || 1200, h = o.h || 900;
  const set = sm && sm !== big ? esc(sm) + " 600w, " + esc(big) + " " + w + "w" : "";
  const ws = webp(big), wsm = sm && sm !== big ? webp(sm) : null;
  const src = set ? (ws && wsm ? '<source type="image/webp" srcset="' + esc(wsm) + " 600w, " + esc(ws) + " " + w + 'w" sizes="' + sizes + '">' : "")
    : ws ? '<source type="image/webp" srcset="' + esc(ws) + '">' : "";
  return "<picture>" + src + '<img src="' + esc(set ? sm : big) + '"' + (set ? ' srcset="' + set + '" sizes="' + sizes + '"' : "") + ' alt="' + esc(o.alt) + '" loading="lazy" width="' + w + '" height="' + h + '"></picture>';
}
const title = (cls, o, id) => '<div class="section-title' + (cls ? " " + cls : "") + '"><span class="eyebrow">' + esc(o.eyebrow) + "</span><h2" + (id ? ' id="' + id + '"' : "") + ">" + esc(o.title) + "</h2>" + (o.sub ? "<p>" + esc(o.sub) + "</p>" : "") + "</div>";

const R = {
  "t-quick": (h, q, ctx) => {
    const amts = q.amounts && q.amounts.length ? q.amounts : [100, 250, 500, 1000], def = amts.includes(q.default) ? q.default : amts[0];
    return ['<div class="qd-text"><b>' + esc(q.title) + '</b><span class="qd-trust"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.trust.lock + "</svg>" + tok(q.trust, ctx) + "</span></div>",
      '<div class="amounts" role="group" aria-label="المبلغ">']
      .concat(amts.map((v) => '  <button type="button" data-v="' + v + '"' + (v === def ? ' class="on"' : "") + ' aria-pressed="' + (v === def) + '" aria-label="' + fmtEn(v) + ' جنيه">' + fmtEn(v) + "</button>"))
      .concat(['  <label class="amt-other"><span>مبلغ تاني</span><input id="qd-other" type="text" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="اكتب المبلغ" aria-label="اكتب مبلغ تاني بالجنيه"><span>جنيه</span></label>', "</div>"]);
  },
  "t-quick-go": (h, q) => {
    const amts = q.amounts && q.amounts.length ? q.amounts : [100, 250, 500, 1000], def = amts.includes(q.default) ? q.default : amts[0];
    return ['<input type="hidden" id="qa" name="amount" value="' + def + '">', '<button class="btn btn-gold qd-go" type="submit">تبرع بـ <b id="qd-amt">' + fmtEn(def) + "</b> ج</button>"];
  },
  "t-quick-offline": (h, q) => ['<div class="qo-item"><span>' + esc(q.offlineLabel) + "</span><span><code>" + esc(q.offlineNumber) + '</code> <button class="copy" type="button" data-copy="' + esc(q.offlineNumber) + '">نسخ</button></span></div>'],
  "t-trust": (h, t, ctx) => ['<ul class="ts-grid" role="list">']
    .concat((t.items || []).map((it) => {
      const c = showCls(it.show);
      return "  <li" + (c ? ' class="' + c + '"' : "") + '><a class="ts-tile" ' + href(it.link, ctx) + '><span class="ts-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + svgIn("trust", it.icon) + "</svg></span><span><b>" + tok(it.title, ctx) + "</b><small>" + tok(it.sub, ctx) + "</small></span></a></li>";
    }))
    .concat(["</ul>", '<div class="ts-ways" role="group" aria-label="طرق تانية للتبرع">'])
    .concat((t.ways || []).map((w) => {
      const wp = webp(w.image), wh = w.w && w.h ? ' width="' + w.w + '" height="' + w.h + '"' : ' height="20"';
      const img = w.image ? "<picture>" + (wp ? '<source type="image/webp" srcset="' + esc(wp) + '">' : "") + "<img" + (w.w && w.w === w.h ? ' class="ts-ip"' : "") + ' src="' + esc(w.image) + '" alt=""' + wh + ' loading="lazy" decoding="async"></picture>' : "";
      return "  <a " + href(w.link, ctx, "/donate.html#wallets") + ">" + img + "<span>" + tok(w.label, ctx) + (w.code ? ' <b dir="ltr">' + esc(w.code) + "</b>" : "") + "</span></a>";
    }))
    .concat(["</div>"]),
  "t-campaigns": (h, c) => ['<div class="section-title split camp-title"><div><span class="eyebrow live">' + esc(c.eyebrow) + "</span><h2>" + esc(c.title) + ' <small class="count" id="camp-count"></small></h2></div>' + (c.sub ? "<p>" + esc(c.sub) + "</p>" : "") + "</div>" +
    (c.cta ? '<button type="button" class="btn btn-ghost camp-all" id="camp-all" hidden>' + esc(c.cta) + "</button>" : "")],
  "t-niyya": (h, n, ctx) => ['<div class="section-title split"><div><span class="eyebrow">' + esc(n.eyebrow) + '</span><h2 id="niyya-h">' + esc(n.title) + "</h2></div>" + (n.sub ? "<p>" + esc(n.sub) + "</p>" : "") + "</div>", '<ul class="niyya" role="list">']
    .concat((n.items || []).map((it) => "  <li" + (it.highlight ? ' class="n-zakat"' : "") + "><a " + href(it.link, ctx) + '><span class="n-ico" aria-hidden="true"><svg viewBox="0 0 24 24">' + svgIn("niyya", it.icon) + "</svg></span><b>" + tok(it.title, ctx) + "</b><small>" + tok(it.sub, ctx) + "</small></a></li>"))
    .concat(["</ul>"]),
  "t-about": (h, a, ctx) => ["<div>", '  <span class="eyebrow">' + esc(a.eyebrow) + "</span>", '  <h2 class="big-title">' + esc(a.title) + (a.mark ? " <mark>" + esc(a.mark) + "</mark>" : "") + "</h2>"]
    .concat(String(a.text || "").split("\n").filter(Boolean).map((p) => "  <p>" + tok(p, ctx) + "</p>"))
    .concat((a.values || []).length ? ['  <ul class="values">'].concat(a.values.map((v) => "    <li><b>" + esc(v.title) + "</b><span>" + esc(v.text) + "</span></li>")).concat(["  </ul>"]) : [])
    .concat(a.button ? ['  <a class="btn btn-teal" ' + href(a.link, ctx, "/p/3.html") + ">" + esc(a.button) + "</a>"] : [])
    .concat(["</div>"])
    .concat(a.image ? ['<figure class="about-pic">', "  " + pic({ ...a, w: a.w || 1600, h: a.h || 1067 }, "(max-width: 760px) 92vw, 460px"),
      "  <figcaption>" + (a.capEyebrow ? '<span class="cap-eyebrow">' + esc(a.capEyebrow) + "</span>" : "") + "<b>" + esc(a.capTitle) + "</b>" + (a.capText ? "<span>" + esc(a.capText) + "</span>" : "") + "</figcaption>", "</figure>"] : []),
  "t-numbers": (h, n) => ['<h2 class="numbers-title">' + esc(n.title) + "</h2>"],
  "t-hospital": (h, x, ctx) => {
    const camp = x.campaign || "p30", base = "/donate.html?for=" + camp;
    return ['<div class="hf-pic" data-illus>' + (x.status ? '<span class="hf-status">' + esc(x.status) + "</span>" : "") + (x.image ? pic(x, "(max-width: 760px) 92vw, 560px") : "") + "</div>",
      "<div>", '  <span class="eyebrow">' + esc(x.eyebrow) + "</span>", '  <h2 class="big-title">' + esc(x.title) + (x.mark ? " <mark>" + esc(x.mark) + "</mark>" : "") + "</h2>"]
      .concat(String(x.text || "").split("\n").filter(Boolean).map((p) => "  <p>" + tok(p, ctx) + "</p>"))
      .concat((x.facts || []).length ? ['  <div class="facts">'].concat(x.facts.map((f) => '    <div><b data-count="' + f.value + '">' + fmtEn(f.value) + "</b><span>" + esc(f.label) + "</span></div>")).concat(["  </div>"]) : [])
      .concat(x.dua ? ['  <p class="dua hf-lead">' + tok(x.dua, ctx) + "</p>"] : [])
      .concat((x.shares || []).length ? ['  <div class="hf-shares">'].concat(x.shares.map((s) => "    <a" + (s.tag ? ' class="waqf"' : "") + ' href="' + esc(base) + "&amp;amount=" + s.amount + '#online">' + (s.tag ? "<em>" + esc(s.tag) + "</em> " : "") + "<b>" + fmtEn(s.amount) + " <small>جنيه</small></b> <span>" + esc(s.label) + "</span></a>")).concat(["  </div>"]) : [])
      .concat(['  <div class="hf-cta" data-campaign="' + esc(camp) + '">',
        '    <a class="btn btn-gold" href="' + esc(base) + '#online">' + esc(x.donate || "تبرع الآن") + "</a>"])
      .concat(x.gift ? ['    <a class="btn btn-ghost-teal" href="/gift.html?occasion=soul&amp;for=' + esc(camp) + '">' + esc(x.gift) + "</a>"] : [])
      .concat(x.more ? ['    <a class="hf-more" ' + href(x.moreLink, ctx, "/p/30.html") + ">" + esc(x.more) + "</a>"] : [])
      .concat(["  </div>", "</div>"]);
  },
  "t-services": (h, s, ctx) => [title("", s), '<div class="grid grid-3 services">']
    .concat((s.items || []).map((it) => '  <a class="card svc" ' + href(it.link, ctx) + '><span class="svc-i"><svg viewBox="0 0 24 24" aria-hidden="true">' + svgIn("services", it.icon) + "</svg></span><h3>" + esc(it.title) + "</h3><p>" + tok(it.text, ctx) + "</p></a>"))
    .concat(["</div>"]),
  "t-projects": (h, p) => [title("", p)],
  "t-ways": (h, w, ctx) => [title("", w), '<div class="ways-grid">']
    .concat((w.items || []).map((it) => {
      const c = showCls(it.show);
      const ico = it.image ? '<span class="w-ico img"><img src="' + esc(it.image) + '" alt="" loading="lazy"></span>' : '<span class="w-ico"><svg viewBox="0 0 24 24">' + svgIn("ways", it.icon) + "</svg></span>";
      return '  <a class="card way2' + (c ? " " + c : "") + '" ' + href(it.link, ctx) + ">" + ico + "<b>" + esc(it.title) + "</b><small>" + tok(it.sub, ctx) + "</small></a>";
    }))
    .concat(["</div>"]),
  "t-slogan": (h, s, ctx) => {
    const hot = esc(ctx.hotline);
    return (s.ayah ? ['<blockquote class="ayah" lang="ar"><p><span class="orn" aria-hidden="true">﴿</span>' + esc(s.ayah) + '<span class="orn" aria-hidden="true">﴾</span></p>' + (s.cite ? "<cite>" + esc(s.cite) + "</cite>" : "") + "</blockquote>"] : [])
      .concat(['<div class="sb-grid">', '  <div class="sb-copy">', '    <div class="slogan-art"><img src="/img/slogan.png" alt="ابعت فرحة" width="520" height="297" loading="lazy"></div>'])
      .concat(String(s.text || "").split("\n").filter(Boolean).map((p) => "    <p>" + tok(p, ctx) + "</p>"))
      .concat(s.button ? ['    <a class="btn btn-gold btn-lg" ' + href(s.link, ctx, "/donate.html#online") + ">" + esc(s.button) + "</a>"] : [])
      .concat(["  </div>", '  <div class="sb-side">',
        '    <a class="hot-card" href="tel:' + hot + '" data-site-href="hotline" aria-label="اتصل بالخط الساخن ' + hot + " و" + esc(s.hotTitle) + '">',
        '      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.2"/><path d="M5 21v-2.5A5.5 5.5 0 0 1 10.5 13h3a5.5 5.5 0 0 1 5.5 5.5V21M12 13l-1 4 1 2 1-2z"/></svg>',
        '      <span class="hc-t">' + esc(s.hotTitle) + "</span>", '      <b data-site="hotline">' + hot + "</b>", '      <span class="hc-s">' + esc(s.hotSub) + "</span>", "    </a>",
        '    <div class="contact-cards">',
        '      <a href="tel:' + esc(ctx.phone) + '" data-site-href="phone"><span>الهاتف</span><b dir="ltr" data-site="phone">' + esc(ctx.phone) + "</b></a>"])
      .concat(s.branchesText ? ['      <a ' + href(s.branchesLink, ctx, "/p/46.html") + "><span>" + esc(s.branchesLabel) + "</span><b>" + esc(s.branchesText) + "</b></a>"] : [])
      .concat(["    </div>", "  </div>", "</div>"]);
  },
  "t-donate-amounts": (h, d) => {
    const amts = d.amounts && d.amounts.length ? d.amounts : [100, 250, 500, 1000, 2500, 5000], def = amts.includes(d.default) ? d.default : amts[0];
    return ['<div class="amounts big" role="group" aria-label="المبلغ">']
      .concat(amts.map((v) => '  <button type="button" data-v="' + v + '"' + (v === def ? ' class="on"' : "") + ' aria-pressed="' + (v === def) + '" aria-label="' + fmtEn(v) + ' جنيه">' + fmtEn(v) + "</button>"))
      .concat(["</div>"]);
  },
};
// which data section each block renders, per page
const BLOCKS = {
  index: { "t-quick": "home.quick", "t-quick-go": "home.quick", "t-quick-offline": "home.quick", "t-trust": "home.trust", "t-campaigns": "home.campaigns", "t-niyya": "home.niyya",
    "t-about": "home.about", "t-numbers": "home.numbers", "t-hospital": "home.hospital", "t-services": "home.services", "t-projects": "home.projects", "t-ways": "home.ways", "t-slogan": "home.slogan" },
  donate: { "t-donate-amounts": "donate" },
};
const get = (o, path) => path.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);
// a block is re-rendered only when its section exists, and the offline account only when it has a number
const usable = (name, sec) => !!sec && typeof sec === "object" && (name !== "t-quick-offline" || !!sec.offlineNumber) && (!/^t-quick(-go)?$|^t-donate-amounts$/.test(name) || Array.isArray(sec.amounts));

function apply(html, data, ctx, page) {
  ctx = { hotline: "19340", phone: "01200002870", banks: 7, ...(ctx || {}) };
  let out = String(html);
  const blocks = BLOCKS[page || "index"] || {};
  for (const name of Object.keys(blocks)) {
    const sec = get(data, blocks[name]);
    if (!usable(name, sec)) continue;
    const re = new RegExp("^([ \\t]*)<!-- mersal:" + name + " -->\\n[\\s\\S]*?\\n[ \\t]*<!-- /mersal:" + name + " -->", "m");
    out = out.replace(re, (m, ind) => ind + "<!-- mersal:" + name + " -->\n" + R[name](out, sec, ctx).map((l) => ind + l).join("\n") + "\n" + ind + "<!-- /mersal:" + name + " -->");
  }
  if ((page || "index") === "index") {
    const n = get(data, "home.numbers");
    if (n && n.title) out = out.replace(/(<section class="numbers brand-bg" aria-label=")[^"]*(")/, (m, a, b) => a + esc(n.title) + b);
  }
  if (page === "donate") {
    const d = data && data.donate;
    if (usable("t-donate-amounts", d)) {
      const def = d.amounts.includes(d.default) ? d.default : d.amounts[0];
      out = out.replace(/(<input id="amount" name="amount"[^>]*? value=")\d*(")/, (m, a, b) => a + def + b);
    }
  }
  return out;
}

// the bank count the trust tile shows: distinct bank names that have an account number (same rule as js/home.js)
function bankCount(donate) {
  const seen = new Set();
  ((donate && donate.banks) || []).forEach((b) => { const n = String((b && b.name) || "").trim(); if (n && String((b && b.number) || "").trim()) seen.add(n); });
  return seen.size >= 3 ? seen.size : 7;
}

module.exports = { clean, apply, bankCount, ICONS, SHAPE, BLOCKS, esc };
