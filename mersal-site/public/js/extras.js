// Site extras on every page. js/layout.js loads this file together with css/extras.css:
//   (a) announcement bar under the header  <- /data/announce.json  (console tab "شريط الإعلان والشركاء")
//   (b) floating WhatsApp button           <- MERSAL_SITE.whatsapp (console tab "بيانات الموقع"); nothing shows while it is empty
//   (c) "اتبرع من بنكك أو محفظتك" strip     <- /data/partners.json, rendered into <section id="partners"></section> where a page has one
// Every string from the JSON files is escaped, and links must start with / # https:// http:// tel: mailto: (the API's own rule).
(function () {
  "use strict";
  if (window.mersalExtras) return;
  window.mersalExtras = true;
  var d = document, SITE = window.MERSAL_SITE || {};
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var ANN = "mersalAnn", ANN_X = "mersalAnnX"; // localStorage: last shown bar (height, for js/layout.js) / the bar the visitor closed

  var I = {
    mega: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M17.5 9a4 4 0 0 1 0 6M7 15l1 4"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    pause: '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
    play: '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 6v12L7 12z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 0 16.4 8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4h-.5z"/></svg>'
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  // Latin runs inside Arabic text (QNB, CIB, e&, WE Pay) are isolated, so their punctuation stays where it was typed
  function bidi(s) {
    return String(s == null ? "" : s).split(/([A-Za-z][\w&.'+-]*(?: [A-Za-z0-9&][\w&.'+-]*)*)/).map(function (part, i) {
      return i % 2 ? '<bdi dir="ltr">' + esc(part) + "</bdi>" : esc(part);
    }).join("");
  }
  function okHref(h) { return /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)/i.test(h || ""); }
  function okImg(h) { return /^(\/(?!\/)|https:\/\/)[^\s"'<>]+$/i.test(h || ""); }
  function str(v, max) { return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max || 200) : ""; }
  function isExternal(h) { return /^https?:/i.test(h) && h.indexOf(location.origin + "/") !== 0; }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function getJSON(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }

  // css/extras.css (js/layout.js adds it; added here too when a page loads this file on its own). Nothing is drawn before
  // it applies, so the bar never shows unstyled and its reserved room never changes size twice.
  function cssReady() {
    function on() { return !!getComputedStyle(d.documentElement).getPropertyValue("--extras-css"); }
    if (on()) return Promise.resolve();
    var l = d.querySelector('link[href$="/css/extras.css"]');
    if (!l) { l = d.createElement("link"); l.rel = "stylesheet"; l.href = "/css/extras.css"; d.head.appendChild(l); }
    return new Promise(function (res) {
      var done = false, t;
      function fin() { if (!done) { done = true; clearInterval(t); res(); } }
      l.addEventListener("load", fin); l.addEventListener("error", fin);
      t = setInterval(function () { if (on()) fin(); }, 50);
      setTimeout(fin, 2500);
    });
  }

  // ---------- (a) announcement bar ----------
  function hash(s) { for (var h = 5381, i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  // "2026-10-31" = until the end of that day in Cairo; a full ISO date-time is taken as it is
  function endOf(u) {
    u = str(u, 40); if (!u) return 0;
    var t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(u) ? u + "T23:59:59+02:00" : u);
    return isNaN(t) ? 0 : t;
  }
  function announce(cfg) {
    var bar = d.getElementById("ann-bar");
    var text = cfg ? str(cfg.text, 220) : "", link = cfg && okHref(str(cfg.link, 500)) ? str(cfg.link, 500) : "";
    var until = cfg ? endOf(cfg.until) : 0, id = hash(text + "|" + link), closable = !cfg || cfg.dismissible !== false;
    if (!cfg || cfg.enabled !== true || !text || (until && Date.now() > until) || (closable && read(ANN_X) === id)) {
      if (bar) bar.parentNode.removeChild(bar);
      write(ANN, null);
      return;
    }
    var tone = /^(gold|teal|red)$/.test(cfg.tone) ? cfg.tone : "gold";
    var reserved = !!bar;
    if (!bar) {
      bar = d.createElement("div"); bar.id = "ann-bar";
      var hdr = d.querySelector(".site-header");
      if (hdr) hdr.parentNode.insertBefore(bar, hdr.nextSibling); else d.body.insertBefore(bar, d.body.firstChild);
    }
    bar.className = "ann-bar t-" + tone + (closable ? " can-close" : "") + (reserved ? "" : " ann-new");
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "إعلان");
    bar.removeAttribute("aria-hidden");
    bar.innerHTML = '<div class="wrap ann-in">' +
      '<span class="ann-ico">' + I.mega + "</span>" +
      '<p class="ann-text">' + bidi(text) + "</p>" +
      (link ? '<a class="ann-link" href="' + esc(link) + '"' + (isExternal(link) ? ' target="_blank" rel="noopener"' : "") + "><span>" +
        bidi(str(cfg.linkText, 40) || "اعرف أكتر") + ' <i aria-hidden="true">←</i></span></a>' : "") +
      (closable ? '<button type="button" class="ann-x" aria-label="إخفاء الإعلان">' + I.x + "</button>" : "") +
      "</div>";
    bar.style.minHeight = "";
    // its height is kept for the next page: js/layout.js reserves exactly that room before anything paints
    function remember() { if (bar.isConnected) write(ANN, JSON.stringify({ h: Math.round(bar.getBoundingClientRect().height), w: innerWidth, tone: tone, exp: until })); }
    remember();
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(remember, 200); });
    var x = bar.querySelector(".ann-x");
    if (x) x.addEventListener("click", function () {
      write(ANN_X, id); write(ANN, null);
      var hadFocus = d.activeElement === x;
      function gone() {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
        if (hadFocus) { var m = d.querySelector("main"); if (m) { if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }); } }
      }
      if (reduce) return gone();
      bar.style.height = bar.getBoundingClientRect().height + "px";
      void bar.offsetHeight;
      bar.classList.add("ann-out");
      setTimeout(gone, 320);
    });
  }

  // ---------- (b) floating WhatsApp button ----------
  function whatsapp() {
    var num = str(SITE.whatsapp, 40);
    if (!num || d.querySelector(".wa-float")) return;
    var href = window.mersalWaLink ? window.mersalWaLink(num) : "https://wa.me/" + num.replace(/\D/g, "");
    if (!/^https:\/\/wa\.me\/\d{8,15}$/.test(href)) return;
    // the greeting names the page the visitor writes from (inner pages), so the team knows what it is about
    var h1 = d.querySelector(".page-head h1"), topic = h1 ? str(h1.textContent, 80) : "";
    var msg = "السلام عليكم، عندي استفسار بخصوص " + (topic ? "«" + topic + "» في موقع مؤسسة مرسال" : "مؤسسة مرسال");
    d.body.insertAdjacentHTML("beforeend", '<a class="wa-float" href="' + esc(href + "?text=" + encodeURIComponent(msg)) + '" target="_blank" rel="noopener" aria-label="كلمنا على واتساب (بيفتح واتساب)">' +
      I.wa + '<span class="wa-tip" aria-hidden="true">كلمنا واتساب</span></a>');
    var wa = d.body.lastElementChild;
    // it comes in once the page is scrolled a little (the first screen keeps its own donate buttons clear), and on a page
    // too short to scroll it is there from the start
    function show() { wa.classList.toggle("wa-on", scrollY > 240 || d.documentElement.scrollHeight - innerHeight < 320); }
    show();
    setTimeout(show, 1500); // the page grows as its sections load
    addEventListener("scroll", show, { passive: true });
    addEventListener("resize", show);
    // zakat page (phones): the slim result bar (#z-bar) rises above the bottom bar, so the button steps up over it
    var zb = d.getElementById("z-bar");
    if (zb) {
      var sync = function () {
        wa.style.setProperty("--wa-lift", (zb.offsetHeight ? zb.offsetHeight + 20 : 0) + "px");
        wa.classList.toggle("wa-up", zb.classList.contains("show"));
      };
      sync();
      if ("MutationObserver" in window) new MutationObserver(sync).observe(zb, { attributes: true, attributeFilter: ["class"] });
      addEventListener("resize", sync);
    }
  }

  // ---------- (c) "اتبرع من بنكك أو محفظتك": donation channels strip ----------
  function card(p) {
    var name = str(p.name, 60), logo = okImg(str(p.logo, 500)) ? str(p.logo, 500) : "", link = okHref(str(p.link, 500)) ? str(p.link, 500) : "";
    var inner = logo
      ? (window.mersalPic ? window.mersalPic(logo, { alt: name, cls: "pt-logo" }) : '<img class="pt-logo" src="' + esc(logo) + '" alt="' + esc(name) + '" loading="lazy" decoding="async">')
      : '<span class="pt-name">' + bidi(name) + "</span>";
    var cls = ' class="pt-card ' + (logo ? "has-logo" : "is-text") + '"' + (logo ? ' title="' + esc(name) + '"' : "");
    return "<li>" + (link ? '<a href="' + esc(link) + '"' + cls + (isExternal(link) ? ' target="_blank" rel="noopener"' : "") + ">" + inner + "</a>" : "<span" + cls + ">" + inner + "</span>") + "</li>";
  }
  function partners() {
    var box = d.getElementById("partners");
    if (!box) return;
    getJSON("/data/partners.json").then(function (arr) {
      var list = (Array.isArray(arr) ? arr : []).filter(function (p) { return p && str(p.name); }).slice(0, 40);
      if (!list.length) { box.hidden = true; return; }
      box.classList.add("pt-sec");
      box.setAttribute("aria-labelledby", "pt-title");
      box.innerHTML = '<div class="wrap"><div class="section-title"><span class="eyebrow">حسابات مرسال الرسمية</span><h2 id="pt-title">اتبرع من بنكك أو محفظتك</h2>' +
        "<p>البنوك اللي فيها حسابات مرسال، والمحافظ والتطبيقات اللي تقدر تتبرع من خلالها.</p></div></div>" +
        '<div class="pt-viewport"><div class="pt-rail"><ul class="pt-list">' + list.map(card).join("") + "</ul></div></div>" +
        '<div class="wrap pt-foot"><button type="button" class="pt-pause" aria-pressed="false" aria-label="إيقاف حركة الشريط" hidden>' + I.pause + I.play + "</button>" +
        '<a class="pt-all" href="/donate.html">كل طرق التبرع <span aria-hidden="true">←</span></a></div>';
      if (window.mersalReveal) window.mersalReveal([box.querySelector(".section-title")]);
      var vp = box.querySelector(".pt-viewport"), rail = box.querySelector(".pt-rail"), first = rail.firstChild, stop = box.querySelector(".pt-pause");
      // reduced motion: nothing moves, the row scrolls by hand
      if (reduce) { vp.classList.add("pt-static"); return; }
      // the row loops by itself (a second, hidden copy follows the first) only when it is wider than the screen
      function fit() {
        var w = first.getBoundingClientRect().width, run = w > vp.clientWidth + 2, copy = rail.children[1];
        if (run && !copy) {
          copy = first.cloneNode(true);
          copy.setAttribute("aria-hidden", "true"); copy.setAttribute("inert", "");
          Array.prototype.forEach.call(copy.querySelectorAll("a"), function (a) { a.tabIndex = -1; });
          rail.appendChild(copy);
        }
        if (!run && copy) rail.removeChild(copy);
        vp.classList.toggle("pt-run", run);
        vp.classList.toggle("pt-fit", !run);
        stop.hidden = !run;
        if (run) rail.style.setProperty("--pt-dur", Math.max(20, Math.round(w / (innerWidth < 761 ? 30 : 40))) + "s");
      }
      fit();
      var ft; addEventListener("resize", function () { clearTimeout(ft); ft = setTimeout(fit, 150); });
      // a finger on the row stops it (and it waits a moment after), so a channel can be read and tapped
      var resume;
      function hold() { clearTimeout(resume); vp.classList.add("pt-hold"); }
      function release() { clearTimeout(resume); resume = setTimeout(function () { vp.classList.remove("pt-hold"); }, 2500); }
      vp.addEventListener("touchstart", hold, { passive: true });
      vp.addEventListener("touchend", release, { passive: true });
      vp.addEventListener("touchcancel", release, { passive: true });
      // keyboard: the moving row stops and becomes a normal scrolling row, so the focused channel is always in view
      vp.addEventListener("focusin", function () { vp.classList.add("pt-kbd"); });
      vp.addEventListener("focusout", function (e) { if (!vp.contains(e.relatedTarget)) { vp.classList.remove("pt-kbd"); vp.scrollLeft = 0; } });
      // a button stops (and restarts) the motion for good, not only while the pointer is on it
      stop.addEventListener("click", function () {
        var on = stop.getAttribute("aria-pressed") !== "true";
        stop.setAttribute("aria-pressed", on ? "true" : "false");
        stop.setAttribute("aria-label", on ? "تشغيل حركة الشريط" : "إيقاف حركة الشريط");
        vp.classList.toggle("pt-stopped", on);
      });
      // off screen it does not run at all
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vp.classList.toggle("pt-off", !es[0].isIntersecting); }).observe(vp);
    });
  }

  var annData = getJSON("/data/announce.json");
  cssReady().then(function () {
    annData.then(announce);
    whatsapp();
    partners();
  });
})();
