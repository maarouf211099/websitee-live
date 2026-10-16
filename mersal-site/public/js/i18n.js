// English version of the site (client side). The pages are written in Arabic; this file runs only when English is on:
// the inline snippet at the end of every page's <head> loads it (with css/en.css) when localStorage "mersalLang" is
// "en" or the URL has ?lang=en, and sets <html lang="en" dir="ltr"> before anything paints. Arabic pages never load it.
//
// Dictionary: /data/i18n-en.json (edited from the console tab "English"):
//   keys      stable ids -> English, for t("id", "عربي") calls and data-i18n="id" attributes
//   text      Arabic text as shown on the page -> English (whitespace collapsed; matched per text node / attribute)
//   patterns  [["^regex on the Arabic$", "English with $1 (kept as is) or {1} (translated again)"], ...] for texts
//             that carry numbers or names
//   pages     imported pages p/<id>.html -> { title, desc } (the page body itself stays Arabic, with a note)
// Admin data can also carry English next to the Arabic: any field "x_en" beside "x" in content.json or /data/*.json
// (slides, campaigns, numbers, menu items...) wins over the dictionary for that text.
// Nothing here changes a value that is sent anywhere: <option>s without a value keep their Arabic text as value,
// inputs typed by the visitor are never touched, and the payment flow only ever sees the same values as in Arabic.
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  var AR = /[؀-ۿ]/;
  var TEXT = Object.create(null), KEYS = Object.create(null), PATS = [], PAGES = {};
  var ready = false, domReady = false, shown = false, queue = [];
  var ATTRS = ["placeholder", "aria-label", "title", "alt", "data-unit", "data-label", "data-title", "aria-roledescription", "aria-valuetext"];
  var SKIP = "script,style,noscript,template,[data-i18n-skip],[lang|=ar]";

  function norm(s) { return String(s).replace(/[\s ‌‏‎]+/g, " ").trim(); }
  function add(ar, en) { if (ar && en && typeof ar === "string" && typeof en === "string" && AR.test(ar)) TEXT[norm(ar)] = en; }

  var PUNCT = { "؟": "?", "،": ",", "؛": ";", ":": ":", ".": ".", "!": "!", "…": "…", "?": "?", ",": ",", "*": "*" };
  function lookup(core, depth) {
    if (!core) return core;
    if (!AR.test(core)) return core;
    if (core in TEXT) return TEXT[core];
    depth = depth || 0;
    if (depth > 4) return null;
    for (var i = 0; i < PATS.length; i++) {
      var m = PATS[i][0].exec(core);
      if (!m) continue;
      // {1} = group 1 translated again; {1:u} = group 1 looked up as "u:<group>" (unit forms); $1 = group 1 as is
      var fail = false, out = PATS[i][1].replace(/\{(\d)(?::(\w+))?\}|\$(\d)/g, function (x, a, pre, b) {
        if (b) return m[+b] || "";
        var g = m[+a] || "", e = pre && pre !== "lc" ? (TEXT[pre + ":" + norm(g)] != null ? TEXT[pre + ":" + norm(g)] : null) : lookup(norm(g), depth + 1);
        // {1:lc}: a title used mid-sentence starts in lower case ("cancer patient treatment"), names stay ("Mersal …")
        if (e && pre === "lc" && !/^(Mersal|PKU|Afia|Hekayet)\b/.test(e) && /^[A-Z][a-z]/.test(e)) e = e.charAt(0).toLowerCase() + e.slice(1);
        if (e == null) { fail = true; return g; }
        return e;
      });
      if (!fail) return out;
    }
    // a text cut short (summaries of pages and projects, with or without "…"): the English of the full text, cut to a similar length
    if ((/…$/.test(core) && core.length > 24) || core.length > 60) {
      var head = core.replace(/\s*…$/, ""), full = null;
      for (var key in TEXT) if (key.length > head.length && key.indexOf(head) === 0) { full = TEXT[key]; break; }
      if (full) { var cut = Math.max(60, Math.round(full.length * head.length / (head.length + 40))); return full.length <= cut + 10 ? full : full.slice(0, cut).replace(/\s+\S*$/, "").replace(/[\s,.;:]+$/, "") + "…"; }
    }
    // trailing / leading punctuation and decorations: "الخط الساخن:" -> "Hotline:"
    var p = /^(.*?)\s*([؟،؛:.!…?,*]+)$/.exec(core);
    if (p && p[1]) { var e1 = lookup(p[1], depth + 1); if (e1 != null) return e1 + p[2].split("").map(function (c) { return PUNCT[c] || c; }).join(""); }
    var q = /^([·•←→›‹\-–—+#*(]+)\s*(.+)$/.exec(core);
    if (q) { var e2 = lookup(q[2], depth + 1); if (e2 != null) return q[1] + " " + e2; }
    var r = /^(.+?)\s*([·•←→›‹\-–—)]+)$/.exec(core);
    if (r) { var e3 = lookup(r[1], depth + 1); if (e3 != null) return e3 + " " + (r[2] === "←" ? "→" : r[2]); }
    return null;
  }
  // translate a string; untranslatable text comes back unchanged
  function tr(s) {
    if (s == null) return s;
    s = String(s);
    if (!AR.test(s)) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), e = lookup(norm(m[2]));
    return e == null ? s : m[1] + e + m[3];
  }
  function t(key, fb) { if (key && KEYS[key] != null) return KEYS[key]; return fb == null ? "" : tr(fb); }

  // ---------- the DOM pass ----------
  function skipped(el) { return !el || (el.closest && el.closest(SKIP)); }
  var FLIP = { "←": "→", "→": "←" };
  function doText(n) {
    var v = n.nodeValue;
    if (v && v.length < 4 && FLIP[v.trim()] && !n.__flip && !skipped(n.parentNode)) { n.__flip = 1; n.nodeValue = v.replace(/[←→]/, FLIP[v.trim()]); return; } // an arrow on its own points the reading way
    if (!v || !AR.test(v) || skipped(n.parentNode) || n.parentNode.tagName === "TEXTAREA") return; // a textarea's text is its value
    var e = tr(v);
    if (e === v) return;
    var p = n.parentNode;
    // an <option> without a value submits its text: keep the Arabic as its value
    if (p && p.tagName === "OPTION" && !p.hasAttribute("value")) p.setAttribute("value", p.textContent);
    if (p && p.tagName === "OPTION" && !p.hasAttribute("data-ar")) p.setAttribute("data-ar", norm(p.textContent));
    n.nodeValue = e;
  }
  function doAttrs(el) {
    if (el.nodeType !== 1 || skipped(el)) return;
    if (el.hasAttribute("data-i18n")) { var k = el.getAttribute("data-i18n"); if (KEYS[k] != null && el.textContent !== KEYS[k]) el.textContent = KEYS[k]; }
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v && AR.test(v)) { var e = tr(v); if (e !== v) el.setAttribute(a, e); }
    }
    if (el.tagName === "INPUT" && /^(submit|button|reset)$/.test(el.type) && AR.test(el.value)) el.value = tr(el.value);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skipped(root)) return; doAttrs(root); }
    var tw = D.createTreeWalker(root, 5 /* elements + text */, null), n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function doHead() {
    if (AR.test(D.title)) D.title = tr(D.title);
    D.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:site_name"]').forEach(function (m) {
      if (AR.test(m.content)) m.content = tr(m.content);
    });
  }
  var mo = new MutationObserver(function (recs) {
    if (!ready) return;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === "characterData") doText(r.target);
      else if (r.type === "attributes") doAttrs(r.target);
      else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
  });
  mo.observe(H, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(["value"]) });

  // ---------- admin data with x_en fields ----------
  function harvest(o, depth) {
    if (!o || typeof o !== "object" || (depth || 0) > 6) return;
    if (Array.isArray(o)) { o.forEach(function (x) { harvest(x, (depth || 0) + 1); }); return; }
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (/_en$/.test(k) && typeof v === "string" && v.trim()) add(o[k.slice(0, -3)], v.trim());
      else if (v && typeof v === "object") harvest(v, (depth || 0) + 1);
    });
  }
  function harvestPages(pg) {
    if (!pg || typeof pg !== "object") return;
    Object.keys(pg).forEach(function (id) { var en = PAGES[id], ar = pg[id]; if (en && ar) { add(ar.title, en.title); add(ar.desc, en.desc); } });
  }
  var of = W.fetch;
  if (of) W.fetch = function (u) {
    var p = of.apply(this, arguments), url = String((u && u.url) || u || "");
    if (!/\/(data\/[\w-]+|content)\.json(\?|$)/.test(url) || /i18n-en\.json/.test(url)) return p;
    return p.then(function (r) {
      if (!r || !r.ok) return r;
      // the page reads the JSON only after its English pairs are known, so it renders straight into English
      return r.clone().json().then(function (d) {
        return dictP.then(function () { harvest(d); if (/pages\.json/.test(url)) harvestPages(d); return r; });
      }, function () { return r; });
    });
  };

  // dates: the pages ask for "ar-EG-u-nu-latn" month names; English shows English ones (digits stay Western anyway)
  ["toLocaleDateString", "toLocaleTimeString", "toLocaleString"].forEach(function (fn) {
    var orig = Date.prototype[fn];
    Date.prototype[fn] = function (loc, opt) { return orig.call(this, typeof loc === "string" && /^ar/i.test(loc) ? "en-GB" : loc, opt); };
  });

  // canvas cards (gift.js, community.js) draw their texts in English too, left to right
  try {
    var C2 = W.CanvasRenderingContext2D && W.CanvasRenderingContext2D.prototype;
    if (C2) ["fillText", "strokeText", "measureText"].forEach(function (fn) {
      var orig = C2[fn];
      C2[fn] = function (txt) {
        var a = Array.prototype.slice.call(arguments), e = tr(txt);
        if (e === txt) return orig.apply(this, a);
        a[0] = e;
        var d = this.direction; this.direction = "ltr";
        try { return orig.apply(this, a); } finally { this.direction = d; }
      };
    });
  } catch (e) {}

  // ---------- imported pages (p/<id>.html): English title and summary, Arabic body with a note ----------
  function pagePrep() {
    var m = /^\/p\/(\d+)\.html$/.exec(location.pathname), art = D.querySelector("main article.legacy");
    var legal = /^\/(privacy|terms)\.html$/.test(location.pathname) ? D.querySelector("main article.lg-doc") : null;
    var body = art || legal;
    if (!body) return;
    body.setAttribute("lang", "ar"); body.setAttribute("dir", "rtl");
    var pg = m && PAGES[m[1]];
    if (m && pg) {
      var h1 = D.querySelector(".page-head h1");
      if (h1) add(h1.textContent, pg.title);
      var md = D.querySelector('meta[name="description"]');
      if (md) add(md.content, pg.desc);
      var crumb = D.querySelector(".crumbs strong");
      if (crumb) add(crumb.textContent, pg.title);
    }
    var note = D.createElement("div");
    note.className = "i18n-note";
    note.innerHTML = "<p><b></b></p>" + (pg && pg.desc ? "<p class=\"i18n-sum\"></p>" : "");
    note.querySelector("b").textContent = t("page.arabicOnly", "This page is available in Arabic.");
    if (pg && pg.desc) note.querySelector(".i18n-sum").textContent = pg.desc;
    body.parentNode.insertBefore(note, body);
  }

  // ---------- boot ----------
  function show() {
    if (shown) return; shown = true;
    H.classList.remove("i18n-wait");
  }
  setTimeout(show, 3000); // never keep the page hidden if the dictionary is slow
  function full() {
    if (!ready || !domReady) return;
    pagePrep();
    doHead();
    walk(D.body);
    requestAnimationFrame(show);
  }
  var dictP = of ? of.call(W, "/data/i18n-en.json").then(function (r) { return r.json(); }).catch(function () { return {}; }) : Promise.resolve({});
  dictP = dictP.then(function (d) {
    d = d || {};
    var k;
    for (k in d.keys || {}) KEYS[k] = d.keys[k];
    for (k in d.text || {}) add(k, d.text[k]);
    (d.patterns || []).forEach(function (p) { try { if (p && p[0] && p[1] != null) PATS.push([new RegExp(p[0]), String(p[1])]); } catch (e) {} });
    PAGES = d.pages || {};
    return d;
  });
  // the home page's inline data (slides, campaigns, numbers) can carry x_en fields
  function homeData() { var el = D.getElementById("home-data"); if (el) try { harvest(JSON.parse(el.textContent)); } catch (e) {} }
  dictP.then(function () {
    ready = true;
    if (D.readyState !== "loading") { homeData(); full(); }
  });
  D.addEventListener("DOMContentLoaded", function () { domReady = true; homeData(); full(); });
  if (D.readyState !== "loading") domReady = true;

  W.mersalI18n = { lang: "en", t: t, tr: tr, add: add, ready: dictP };
  W.mersalT = t;
})();
