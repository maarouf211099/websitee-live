// أخبار وقصص مرسال. Data: /data/news.json (edited from the console tab "الأخبار"; array order = display order).
//   /news.html      -> #nw-list: tag filter chips, cards that expand in place, share buttons, "عرض المزيد", #n-<id> deep links
//   any page        -> <div id="news-home"></div>: a horizontal snap strip of the latest 6 with a "كل الأخبار" link
(function () {
  var list = document.getElementById("nw-list"), home = document.getElementById("news-home");
  if (!list && !home) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAGE = 6, STRIP = 6;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function slug(tag) { return tag === "قصة نجاح" ? "story" : tag === "فعالية" ? "event" : tag === "خبر" ? "news" : "other"; }
  function dateText(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); if (!m) return esc(d || "");
    try { return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return m[3] + "/" + m[2] + "/" + m[1]; }
  }
  function okHref(h) { return /^(\/|https?:\/\/|#|tel:|mailto:)/.test(h || ""); }
  function pic(it, w, h, sizes) {
    var src = it.imageSm || it.image; if (!src) return '<span class="nw-noimg" aria-hidden="true"></span>';
    if (window.mersalPic) return window.mersalPic(src, { alt: "", w: w, h: h, srcset: it.imageSm && it.image && it.image !== it.imageSm ? [[it.imageSm, "600w"], [it.image, "1200w"]] : null, sizes: sizes });
    return '<img src="' + esc(src) + '" alt="" width="' + w + '" height="' + h + '" loading="lazy" decoding="async">';
  }
  function ensureCss() {
    if (document.querySelector('link[href$="/css/news.css"]')) return Promise.resolve();
    return new Promise(function (res) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/css/news.css"; l.onload = l.onerror = res; document.head.appendChild(l); setTimeout(res, 1500); });
  }
  var ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 0 16.4 8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4h-.5z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>'
  };
  function itemUrl(it) { return location.origin + "/news.html#n-" + encodeURIComponent(it.id); }

  var items = [];
  function load() { return fetch("/data/news.json").then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }
  function clean(arr) {
    return (Array.isArray(arr) ? arr : []).filter(function (it) { return it && it.title; }).map(function (it, i) {
      return { id: String(it.id || "n" + i).replace(/[^\w؀-ۿ-]/g, ""), title: it.title, date: it.date || "", tag: it.tag || "خبر", text: it.text || "", body: it.body || "", image: it.image || "", imageSm: it.imageSm || "", link: okHref(it.link) ? it.link : "" };
    });
  }

  // ---------- /news.html ----------
  function page() {
    var filters = document.getElementById("nw-filters"), more = document.getElementById("nw-more"), count = document.getElementById("nw-count"), empty = document.getElementById("nw-empty");
    var q = new URLSearchParams(location.search), tag = q.get("tag") || "", shown = 0, cur = [];
    var tags = []; items.forEach(function (it) { if (tags.indexOf(it.tag) < 0) tags.push(it.tag); });
    if (tag && tags.indexOf(tag) < 0) tag = "";
    // nothing published yet: no filter bar, a "coming soon" line instead of an empty grid
    if (!items.length) {
      var bar = filters.closest(".nw-bar"); if (bar) bar.hidden = true;
      empty.textContent = "قريباً أخبار مرسال هنا.";
    }
    filters.innerHTML = [["", "الكل"]].concat(tags.map(function (t) { return [t, t]; })).map(function (t) {
      var n = t[0] ? items.filter(function (it) { return it.tag === t[0]; }).length : items.length;
      return '<button type="button" data-tag="' + esc(t[0]) + '" aria-pressed="' + (t[0] === tag) + '">' + esc(t[1]) + " <b>" + n + "</b></button>";
    }).join("");
    function card(it) {
      var paras = it.body ? it.body.split(/\n{2,}|\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
      var ext = /^https?:/.test(it.link), bid = "nb-" + it.id;
      var full = paras.length ? '<div class="nw-full" id="' + esc(bid) + '" hidden>' + paras.map(function (s) { return "<p>" + esc(s) + "</p>"; }).join("") +
        (it.link ? '<a class="nw-link" href="' + esc(it.link) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">اعرف أكثر <span aria-hidden=\"true\">←</span></a>" : "") + "</div>" : "";
      var read = paras.length ? '<button type="button" class="nw-read" aria-expanded="false" aria-controls="' + esc(bid) + '">اقرأ المزيد</button>'
        : it.link ? '<a class="nw-read" href="' + esc(it.link) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">اقرأ المزيد</a>" : "<span></span>";
      var url = encodeURIComponent(itemUrl(it)), txt = encodeURIComponent(it.title + " - مؤسسة مرسال");
      return '<article class="card nw-card" id="n-' + esc(it.id) + '" data-tag="' + esc(it.tag) + '">' +
        '<div class="nw-media">' + pic(it, 600, 375, "(max-width: 760px) 92vw, 380px") + '<span class="nw-tag t-' + slug(it.tag) + '">' + esc(it.tag) + "</span></div>" +
        '<div class="body nw-body">' + (it.date ? '<time class="nw-date" datetime="' + esc(it.date) + '">' + dateText(it.date) + "</time>" : "") +
          '<h2 class="nw-title">' + esc(it.title) + "</h2>" + (it.text ? '<p class="nw-text">' + esc(it.text) + "</p>" : "") + full +
          '<div class="nw-actions">' + read +
            '<div class="nw-share" role="group" aria-label="مشاركة الخبر">' +
              '<a class="sh-wa" href="https://wa.me/?text=' + txt + "%20" + url + '" target="_blank" rel="noopener" aria-label="مشاركة على واتساب" title="واتساب">' + ICON.wa + "</a>" +
              '<a class="sh-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener" aria-label="مشاركة على فيسبوك" title="فيسبوك">' + ICON.fb + "</a>" +
              '<button type="button" class="sh-copy" data-url="' + esc(itemUrl(it)) + '" aria-label="نسخ رابط الخبر" title="نسخ الرابط">' + ICON.copy + '<span class="sh-tip" aria-hidden="true">تم النسخ</span></button>' +
              (navigator.share ? '<button type="button" class="sh-native" data-url="' + esc(itemUrl(it)) + '" data-title="' + esc(it.title) + '" aria-label="مشاركة…" title="مشاركة">' + ICON.share + "</button>" : "") +
            "</div></div></div></article>";
    }
    function apply(resetTo) {
      cur = tag ? items.filter(function (it) { return it.tag === tag; }) : items.slice();
      shown = 0; list.innerHTML = "";
      showMore(resetTo || PAGE, false);
      empty.hidden = !!cur.length;
    }
    function showMore(n, animate) {
      var next = cur.slice(shown, shown + n);
      list.insertAdjacentHTML("beforeend", next.map(card).join(""));
      var added = Array.prototype.slice.call(list.children, shown);
      shown += next.length;
      if (animate && !reduce) added.forEach(function (c, i) { c.classList.add("nw-new"); c.style.setProperty("--d", i * 70 + "ms"); });
      else if (window.mersalReveal && !animate) window.mersalReveal(added);
      more.hidden = shown >= cur.length;
      if (!more.hidden) more.textContent = "عرض المزيد (" + (cur.length - shown) + ")";
      count.textContent = cur.length ? shown + " من " + cur.length : "";
    }
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-tag]"); if (!b) return;
      tag = b.dataset.tag;
      filters.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      history.replaceState(null, "", location.pathname + (tag ? "?tag=" + encodeURIComponent(tag) : ""));
      apply(); if (window.mersalTap) window.mersalTap(6);
    });
    more.addEventListener("click", function () { var before = shown; showMore(PAGE, true); var first = list.children[before]; if (first) setTimeout(function () { first.querySelector(".nw-read, a, button").focus({ preventScroll: true }); }, 80); });
    list.addEventListener("click", function (e) {
      var r = e.target.closest("button.nw-read"), c = e.target.closest(".sh-copy"), s = e.target.closest(".sh-native");
      if (r) {
        var box = document.getElementById(r.getAttribute("aria-controls")), open = box.hidden;
        box.hidden = !open; r.setAttribute("aria-expanded", open ? "true" : "false"); r.textContent = open ? "إخفاء" : "اقرأ المزيد"; r.closest(".nw-card").classList.toggle("open", open);
        if (open) history.replaceState(null, "", location.pathname + location.search + "#" + r.closest(".nw-card").id);
        if (window.mersalTap) window.mersalTap(6);
      } else if (c) {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(c.dataset.url).then(function () { c.classList.add("done"); c.setAttribute("aria-label", "تم نسخ الرابط"); clearTimeout(c._t); c._t = setTimeout(function () { c.classList.remove("done"); c.setAttribute("aria-label", "نسخ رابط الخبر"); }, 1800); if (window.mersalTap) window.mersalTap(8); });
      } else if (s) { navigator.share({ title: s.dataset.title + " - مؤسسة مرسال", url: s.dataset.url }).catch(function () {}); }
    });
    // #n-<id> (on load and on hash changes): show enough cards to include it, open it and scroll there
    function openHash(first) {
      var want = /^#n-(.+)$/.exec(location.hash), idx = -1, id = want ? decodeURIComponent(want[1]) : "";
      if (want) items.forEach(function (it, i) { if (it.id === id) idx = i; });
      if (idx < 0) { if (first) apply(); return; }
      if (tag || first || !document.getElementById("n-" + id)) {
        if (new URLSearchParams(location.search).has("tag")) history.replaceState(null, "", location.pathname + location.hash);
        tag = ""; filters.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.tag === "" ? "true" : "false"); });
        apply(Math.max(PAGE, Math.ceil((idx + 1) / PAGE) * PAGE));
      }
      var el = document.getElementById("n-" + id), btn = el && el.querySelector("button.nw-read");
      if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 150);
    }
    openHash(true);
    addEventListener("hashchange", function () { openHash(false); });
  }

  // ---------- home strip ----------
  function strip() {
    var latest = items.slice(0, STRIP);
    if (!latest.length) { home.hidden = true; return; }
    home.classList.add("nw-home-wrap");
    home.innerHTML = '<section class="nw-home" aria-labelledby="nw-home-title"><div class="wrap">' +
      '<div class="section-title split"><div><span class="eyebrow">آخر الأخبار</span><h2 id="nw-home-title">أخبار وقصص مرسال</h2></div><a class="nw-all" href="/news.html">كل الأخبار <span aria-hidden="true">←</span></a></div>' +
      '<div class="nw-strip-wrap"><button type="button" class="nw-arrow nw-prev" aria-label="السابق">&#8249;</button>' +
      '<div class="nw-strip" id="nw-strip">' + latest.map(function (it) {
        return '<a class="nw-mini" href="/news.html#n-' + encodeURIComponent(it.id) + '">' + pic(it, 600, 800, "(max-width: 760px) 66vw, 280px") +
          '<span class="nw-tag t-' + slug(it.tag) + '">' + esc(it.tag) + "</span>" +
          '<span class="nw-mini-body">' + (it.date ? '<time datetime="' + esc(it.date) + '">' + dateText(it.date) + "</time>" : "") + "<b>" + esc(it.title) + '</b><span>اقرأ المزيد <i aria-hidden="true">←</i></span></span></a>';
      }).join("") + "</div>" +
      '<button type="button" class="nw-arrow nw-next" aria-label="التالي">&#8250;</button></div>' +
      '<div class="nw-dots" aria-hidden="true">' + latest.map(function (_, i) { return "<i" + (i ? "" : ' class="on"') + "></i>"; }).join("") + "</div>" +
      "</div></section>";
    var track = home.querySelector(".nw-strip"), wrap = home.querySelector(".nw-strip-wrap"), dots = home.querySelectorAll(".nw-dots i"), cards = Array.prototype.slice.call(track.children);
    function check() { wrap.classList.toggle("overflow", track.scrollWidth > track.clientWidth + 4); }
    check(); addEventListener("resize", check);
    function step(dir) { var gap = parseFloat(getComputedStyle(track).columnGap) || 20; track.scrollBy({ left: dir * (cards[0].offsetWidth + gap), behavior: reduce ? "auto" : "smooth" }); }
    home.querySelector(".nw-next").addEventListener("click", function () { step(-1); });
    home.querySelector(".nw-prev").addEventListener("click", function () { step(1); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.intersectionRatio >= .6) { var i = cards.indexOf(e.target); Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle("on", k === i); }); } });
      }, { root: track, threshold: .6 });
      cards.forEach(function (c) { io.observe(c); });
    }
    if (window.mersalReveal) { window.mersalReveal([home.querySelector(".section-title")]); window.mersalReveal(cards); }
  }

  Promise.all([load(), ensureCss()]).then(function (res) {
    items = clean(res[0]);
    if (list) page();
    if (home) strip();
  });
})();
