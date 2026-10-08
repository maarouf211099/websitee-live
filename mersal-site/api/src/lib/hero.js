// Home hero renderer. The slides from content.json are baked into public/index.html (between
// <!-- mersal:… --> markers) so the first paint already shows the real banner: no placeholder, no
// swap, and the LCP image is discoverable by the browser's preload scanner.
// Used by the admin API (when home content is saved) and by tools/render-home.js (after hand edits).
// Keep rev() byte-identical to heroRev() in public/js/home.js.
"use strict";

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// tools/optimize_images.py guarantees a .webp sibling for every jpg/png under /img/ except /img/uploads/
const webp = (u) => (/^\/img\/(?!uploads\/)[^?#]+\.(jpe?g|png)$/i.test(u || "") ? u.replace(/\.(jpe?g|png)$/i, ".webp") : null);
const SIZES = "(max-width: 1400px) 100vw, 1400px";
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

function picture(s, i, opts) {
  const full = s.banner, sm = s.bannerSm, mobile = s.mobile || (opts.mobileFor ? opts.mobileFor(full) : null);
  const pre = i >= 2 ? "data-" : ""; // cards 3+ wake up after window load (see home.js)
  let h = "<picture>";
  if (mobile) {
    const mw = webp(mobile);
    if (mw) h += `<source media="(max-width: 760px)" type="image/webp" ${pre}srcset="${esc(mw)}">`;
    h += `<source media="(max-width: 760px)" ${pre}srcset="${esc(mobile)}">`;
  }
  const set = sm ? `${esc(sm)} 1200w, ${esc(full)} 1600w` : esc(full);
  const setW = sm ? (webp(sm) && webp(full) ? `${webp(sm)} 1200w, ${webp(full)} 1600w` : null) : webp(full);
  if (setW) h += `<source type="image/webp" ${pre}srcset="${setW}"${sm ? ` sizes="${SIZES}"` : ""}>`;
  const prio = i === 0 ? ' fetchpriority="high"' : i === 1 ? ' fetchpriority="low"' : "";
  h += `<img ${pre}src="${esc(full)}"${sm ? ` ${pre}srcset="${set}" sizes="${SIZES}"` : ""} width="1600" height="475" alt="${esc(s.alt || s.title || "")}"${prio} decoding="async"></picture>`;
  return h;
}

function card(s, i, n, opts) {
  const title = s.title || s.alt || "مؤسسة مرسال";
  const copy =
    '<span class="sl-copy">' +
    (s.kicker ? `<span class="sl-kicker">${esc(s.kicker)}</span>` : "") +
    (i === 0 ? `<h2 class="sl-title">${esc(title)}</h2>` : `<h2 class="sl-title">${esc(title)}</h2>`) +
    (s.text ? `<span class="sl-pill">${esc(s.text)}</span>` : "") +
    `<span class="sl-btn">${esc(s.button || "تبرع الآن")} ${ARROW}</span>` +
    "</span>";
  const style = s.banner ? ` style="--focus:${esc(s.focus || "50% 50%")}"` : ` style="--bg:url('${esc(s.image || "/img/hero.jpg")}')"`;
  return `<a class="sl-card${i === 0 ? " on" : ""}${s.banner ? "" : " txt"}" href="${esc(s.link || "/donate.html")}"${style} aria-roledescription="slide" aria-label="${esc(title)} (${i + 1} من ${n})">` +
    (s.banner ? picture(s, i, opts) : "") + copy + "</a>";
}

function html(slides, opts) {
  slides = (slides || []).filter((s) => s && (s.banner || s.image));
  return slides.map((s, i) => card(s, i, slides.length, opts || {})).join("\n");
}

function dots(n) {
  let h = "";
  for (let i = 0; i < n; i++) h += `<button type="button" role="tab" aria-label="الشريحة ${i + 1}" aria-selected="${i === 0}"></button>`;
  return h;
}

function preload(s, opts) {
  if (!s || !s.banner) return "";
  opts = opts || {};
  const mobile = s.mobile || (opts.mobileFor ? opts.mobileFor(s.banner) : null);
  const out = [];
  if (mobile) {
    const mw = webp(mobile);
    out.push(`<link rel="preload" as="image" media="(max-width: 760px)"${mw ? ` type="image/webp" href="${esc(mw)}"` : ` href="${esc(mobile)}"`} fetchpriority="high">`);
  }
  const sm = s.bannerSm, full = s.banner;
  const setW = sm && webp(sm) && webp(full) ? `${webp(sm)} 1200w, ${webp(full)} 1600w` : webp(full) || null;
  const media = mobile ? ' media="(min-width: 761px)"' : "";
  if (setW && sm) out.push(`<link rel="preload" as="image"${media} type="image/webp" imagesrcset="${setW}" imagesizes="${SIZES}" fetchpriority="high">`);
  else out.push(`<link rel="preload" as="image"${media}${setW ? ' type="image/webp"' : ""} href="${esc(setW || full)}" fetchpriority="high">`);
  return out.join("\n");
}

// Inline data for the parts of the home page that render above the fold (slides, campaigns, numbers).
function data(content) {
  const d = { slides: content.slides || [], campaigns: content.campaigns || [], numbers: content.numbers || [] };
  return '<script type="application/json" id="home-data">' + JSON.stringify(d).replace(/</g, "\\u003c") + "</script>";
}

function rev(slides) {
  const str = JSON.stringify(slides || []);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Rewrite every marked block of index.html from content. Throws when a marker is missing.
function apply(indexHtml, content, opts) {
  const slides = (content.slides || []).filter((s) => s && (s.banner || s.image));
  const put = (h, tag, inner) => {
    const re = new RegExp(`<!-- ${tag} -->[\\s\\S]*?<!-- /${tag} -->`);
    if (!re.test(h)) throw new Error("index.html is missing the " + tag + " marker");
    return h.replace(re, () => `<!-- ${tag} -->\n${inner}\n<!-- /${tag} -->`);
  };
  let out = put(indexHtml, "mersal:hero-preload", preload(slides[0], opts));
  out = put(out, "mersal:hero", html(slides, opts));
  out = put(out, "mersal:hero-dots", dots(slides.length));
  out = put(out, "mersal:home-data", data(content));
  if (!/id="slides" data-rev="[^"]*"/.test(out)) throw new Error('index.html is missing data-rev on #slides');
  return out.replace(/(id="slides" data-rev=")[^"]*(")/, `$1${rev(content.slides || [])}$2`);
}

module.exports = { html, dots, preload, data, rev, apply, webp };
