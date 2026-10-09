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
// Phone crops are landscape (the banner's photo half, 883x570) shown with object-fit:cover in a portrait card, so the
// browser scales them by HEIGHT: the photo is 80% of a 4:5.4 card that is 100vw-28px wide, which draws the crop
// ~140vw wide. Saying so in sizes is what makes a dpr-2 phone pick the 1.5x crop and a 3x phone the 2x one.
const M_SIZES = "(max-width: 760px) 140vw";

// Phone candidates for a slide: [{src, w}] from opts.mobileSet (tools/render-home.js: the -ms/-m pair written by
// tools/optimize_images.py with their real widths) or the single slide.mobile / opts.mobileFor(banner) file.
function mobileSet(s, opts) {
  if (opts.mobileSet) { const set = opts.mobileSet(s); if (set && set.length) return set; }
  const m = s.mobile || (opts.mobileFor ? opts.mobileFor(s.banner) : null);
  return m ? [{ src: m }] : [];
}
const srcsetOf = (set, fn) => set.map((c) => esc(fn(c.src)) + (c.w ? ` ${c.w}w` : "")).join(", ");
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

function picture(s, i, opts) {
  const full = s.banner, sm = s.bannerSm, mset = mobileSet(s, opts);
  const pre = i >= 2 ? "data-" : ""; // cards 3+ wake up after window load (see home.js)
  let h = "<picture>";
  if (mset.length) {
    const sz = mset.length > 1 ? ` sizes="${M_SIZES}"` : "";
    if (mset.every((c) => webp(c.src))) h += `<source media="(max-width: 760px)" type="image/webp" ${pre}srcset="${srcsetOf(mset, webp)}"${sz}>`;
    h += `<source media="(max-width: 760px)" ${pre}srcset="${srcsetOf(mset, (u) => u)}"${sz}>`;
  }
  const set = sm ? `${esc(sm)} 1200w, ${esc(full)} 1920w` : esc(full);
  const setW = sm ? (webp(sm) && webp(full) ? `${webp(sm)} 1200w, ${webp(full)} 1920w` : null) : webp(full);
  if (setW) h += `<source type="image/webp" ${pre}srcset="${setW}"${sm ? ` sizes="${SIZES}"` : ""}>`;
  const prio = i === 0 ? ' fetchpriority="high"' : i === 1 ? ' fetchpriority="low"' : "";
  h += `<img ${pre}src="${esc(full)}"${sm ? ` ${pre}srcset="${set}" sizes="${SIZES}"` : ""} width="1920" height="570" alt="${esc(s.alt || s.title || "")}"${prio} decoding="async"></picture>`;
  return h;
}

function card(s, i, n, opts) {
  const title = s.title || s.alt || "مؤسسة مرسال", button = s.button || "تبرع الآن";
  const copy =
    '<span class="sl-copy">' +
    (s.kicker ? `<span class="sl-kicker">${esc(s.kicker)}</span>` : "") +
    `<h2 class="sl-title">${esc(title)}</h2>` +
    (s.text ? `<span class="sl-pill">${esc(s.text)}</span>` : "") +
    `<span class="sl-btn">${esc(button)} ${ARROW}</span>` +
    "</span>";
  const style = s.banner ? ` style="--focus:${esc(s.focus || "50% 50%")}"` : ` style="--bg:url('${esc(s.image || "/img/hero.jpg")}')"`;
  // ARIA carousel pattern: the slide is a group (role + roledescription live here, so the link keeps
  // its link role); the link's name is "button: title" instead of every word of the card plus the alt.
  return `<div class="sl-card${i === 0 ? " on" : ""}${s.banner ? "" : " txt"}"${style} role="group" aria-roledescription="slide" aria-label="${i + 1} من ${n}">` +
    `<a class="sl-link" href="${esc(s.link || "/donate.html")}" aria-label="${esc(button)}: ${esc(title)}">` +
    (s.banner ? picture(s, i, opts) : "") + copy + "</a></div>";
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
  const mset = mobileSet(s, opts), mobile = mset.length > 0;
  const out = [];
  if (mobile) {
    // same candidates and sizes as the <source> above, so the browser reuses the preloaded file
    const allW = mset.every((c) => webp(c.src)), fn = allW ? webp : (u) => u, type = allW ? ' type="image/webp"' : "";
    if (mset.length > 1) out.push(`<link rel="preload" as="image" media="(max-width: 760px)"${type} imagesrcset="${srcsetOf(mset, fn)}" imagesizes="${M_SIZES}" fetchpriority="high">`);
    else out.push(`<link rel="preload" as="image" media="(max-width: 760px)"${type} href="${esc(fn(mset[0].src))}" fetchpriority="high">`);
  }
  const sm = s.bannerSm, full = s.banner;
  const setW = sm && webp(sm) && webp(full) ? `${webp(sm)} 1200w, ${webp(full)} 1920w` : webp(full) || null;
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
