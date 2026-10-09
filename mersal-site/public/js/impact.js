// "تبرعك بيعمل إيه" - impact calculator. Renders itself into <div id="impact-calc"></div> (nothing happens when the
// placeholder is missing; #impact is taken by the donate stepper's one-line message). Figures come from
// /data/impact.json (editable from the console tab "أثر التبرع") plus the home campaigns in /content.json (unit +
// unitPrice). The CTA goes to /donate.html?amount=N#online; on the donate page itself it fills the stepper in place.
(function () {
  var root = document.getElementById("impact-calc");
  if (!root || root.dataset.ready) return;
  root.dataset.ready = "1";

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function num(v, d) { v = Number(v); return isFinite(v) && v > 0 ? v : d; }

  // the stylesheet is normally linked by the page; load it here when it is not, and wait for it before painting
  function ensureCss() {
    if (document.querySelector('link[href$="/css/impact.css"]')) return Promise.resolve();
    return new Promise(function (res) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/css/impact.css";
      l.onload = l.onerror = res; document.head.appendChild(l); setTimeout(res, 1500);
    });
  }

  var ICONS = {
    drop: '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/>',
    stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>',
    cart: '<circle cx="10" cy="17" r="4"/><path d="M8 4h2v7h6l2 6"/>',
    bed: '<path d="M3 18V8M3 14h18v4M21 14v-3a2 2 0 0 0-2-2h-7v5"/><circle cx="7" cy="10" r="2"/>',
    pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>',
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
    baby: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M9 8h.01M15 8h.01"/>',
    syringe: '<path d="M4 20l4-4M6 18l7-7M9 9l6 6M12 6l6 6M17 3l4 4M15 5l4 4"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    hospital: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-5h6v5M12 9v5M9.5 11.5h5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[k] || ICONS.heart) + "</svg>"; }

  // Arabic count forms: singular -> [dual, plural (3-10)]. A unit written as "مفرد|مثنى|جمع" overrides the table.
  var FORMS = {
    "جلسة": ["جلستين", "جلسات"], "كشف": ["كشفين", "كشوفات"], "شهر": ["شهرين", "شهور"], "كارت": ["كارتين", "كروت"], "يوم": ["يومين", "أيام"],
    "سهم": ["سهمين", "أسهم"], "جرعة": ["جرعتين", "جرعات"], "كفالة": ["كفالتين", "كفالات"], "وجبة": ["وجبتين", "وجبات"], "شنطة": ["شنطتين", "شنط"],
    "جهاز": ["جهازين", "أجهزة"], "عملية": ["عمليتين", "عمليات"], "أسرة": ["أسرتين", "أسر"], "مريض": ["مريضين", "مرضى"], "طفل": ["طفلين", "أطفال"],
    "ليلة": ["ليلتين", "ليالي"], "علبة": ["علبتين", "علب"], "حضانة": ["حضانتين", "حضانات"], "متر": ["مترين", "أمتار"], "ساعة": ["ساعتين", "ساعات"]
  };
  function unitForm(unit, n) {
    var parts = String(unit || "").split("|").map(function (s) { return s.trim(); }), one = parts[0] || "", f = parts.length > 1 ? parts.slice(1) : FORMS[one];
    if (n === 1 || !f) return one;
    if (n === 2) return f[0] || one;
    if (n >= 3 && n <= 10) return f[1] || f[0] || one;
    return one;
  }
  // Tile caption next to the big number: the number is already shown, so {n} is dropped and the unit takes the
  // form used after a numeral (2 جلسة، 3 جلسات، 11 جلسة) instead of the dual that would repeat the count.
  // Only a leading {n} is dropped: a count in the middle of the sentence ("لمدة {n} {unit}") stays, or the caption
  // would change meaning.
  function tileText(tpl, n, unit) {
    var out = String(tpl || "{n} {unit}");
    if (!/^\s*\{n\}/.test(out)) return phrase(out, n, unit);
    var u = unitForm(unit, n === 2 ? 1 : n);
    return out.replace(/^\s*\{n\}\s*/, "").replace(/\{unit\}/g, u).replace(/\s+/g, " ").trim();
  }
  // "{n} {unit} ..." -> for 1 and 2 the unit form already carries the count, so {n} disappears there
  function phrase(tpl, n, unit) {
    var u = unitForm(unit, n), out = String(tpl || "{n} {unit}");
    out = out.replace(/\{n\}\s*/g, n >= 3 ? fmt.format(n) + " " : "").replace(/\{unit\}/g, u);
    return out.replace(/\s+/g, " ").trim();
  }

  var DEFAULTS = { title: "تبرعك بيعمل إيه؟", intro: "اختار مبلغ وشوف بيغطي إيه بالظبط في مرسال.", default: 500, presets: [100, 250, 500, 1000, 5000], min: 50, max: 10000, campaigns: true, items: [] };
  var cfg, rows = [], amount = 0, els = {}, raf = null, liveT = null;

  function buildRows(content) {
    var out = [];
    (cfg.items || []).forEach(function (it) {
      var price = num(it.price, 0); if (!price || !it.label) return;
      out.push({ label: it.label, price: price, unit: it.unit || "", icon: it.icon || "heart", text: it.text || ("{n} {unit} " + it.label), link: /^(\/|https?:\/\/)/.test(it.link || "") ? it.link : "" });
    });
    if (cfg.campaigns !== false && content && content.campaigns) {
      content.campaigns.forEach(function (c) {
        var price = num(c.unitPrice, 0), done = c.status === "done" || (c.goal && (c.raised || 0) >= c.goal);
        if (!price || !c.title || done) return;
        out.push({ label: c.title, price: price, unit: c.unit || "سهم", icon: c.purpose === "p31" ? "drop" : c.purpose === "p52" ? "baby" : c.purpose === "p30" ? "hospital" : c.purpose === "p42" ? "home" : c.purpose === "p37" ? "pill" : "heart",
          text: "{n} {unit} في " + c.title, link: c.purpose ? "/donate.html?for=" + encodeURIComponent(c.purpose) : "", campaign: true });
      });
    }
    return out;
  }
  function linkFor(r, a) {
    if (!r.link) return "";
    if (/^https?:/.test(r.link)) return r.link;
    var join = r.link.indexOf("?") > -1 ? "&" : "?";
    return r.link.replace(/#.*$/, "") + join + "amount=" + a + "#online";
  }

  function render() {
    var min = num(cfg.min, 50), max = Math.max(num(cfg.max, 10000), min * 2), step = max >= 5000 ? 50 : 10;
    root.innerHTML =
      '<section class="ic" aria-labelledby="ic-title">' +
        '<div class="ic-head">' +
          '<span class="ic-eyebrow">حاسبة الأثر</span>' +
          '<h2 class="ic-title" id="ic-title">' + esc(cfg.title) + "</h2>" +
          (cfg.intro ? '<p class="ic-intro">' + esc(cfg.intro) + "</p>" : "") +
          '<label class="ic-label" for="ic-in">المبلغ بالجنيه</label>' +
          '<div class="ic-input"><input id="ic-in" type="number" inputmode="numeric" min="10" max="1000000" step="1" autocomplete="off"><span>جنيه</span></div>' +
          '<div class="ic-chips" role="group" aria-label="مبالغ مقترحة">' + (cfg.presets || []).map(function (p) { return '<button type="button" data-v="' + num(p, 0) + '" aria-pressed="false">' + fmt.format(num(p, 0)) + "</button>"; }).join("") + "</div>" +
          '<input class="ic-range" type="range" min="' + min + '" max="' + max + '" step="' + step + '" aria-label="المبلغ بالجنيه (سحب)">' +
          '<div class="ic-range-ends" aria-hidden="true"><span>' + fmt.format(min) + "</span><span>" + fmt.format(max) + "+</span></div>" +
          '<div class="ic-help"><b>مش عارف تختار؟</b>كلمنا على <a href="tel:19340">19340</a> ومندوب مرسال يوصلك لحد البيت، أو تبرع بالبطاقة أو فوري أو إنستاباي.</div>' +
        "</div>" +
        '<div class="ic-body">' +
          '<p class="ic-sum">بـ <b class="ic-amt">0</b> جنيه تبرعك يغطي:</p>' +
          '<p class="sr-only" aria-live="polite"></p>' +
          '<ul class="ic-tiles"></ul>' +
          '<div class="ic-foot"><a class="btn btn-gold ic-cta" href="/donate.html#online">تبرع بالمبلغ ده</a><span class="ic-note">الأرقام تقريبية حسب أسعار الخدمات الحالية</span></div>' +
        "</div>" +
      "</section>";
    els = { input: root.querySelector("#ic-in"), range: root.querySelector(".ic-range"), chips: root.querySelectorAll(".ic-chips button"), tiles: root.querySelector(".ic-tiles"), amt: root.querySelector(".ic-amt"), cta: root.querySelector(".ic-cta"), live: root.querySelector("[aria-live]") };
    els.tiles.innerHTML = rows.map(function (r, i) {
      return tile(r, i);
    }).join("");
    els.tile = Array.prototype.slice.call(els.tiles.children); // row i -> its <li>, whatever the current DOM order
    function tile(r, i) {
      var tag = r.link ? "a" : "div";
      return '<li class="ic-tile" data-i="' + i + '" style="--d:' + (i * 50) + 'ms"><' + tag + ' class="ic-tile-in"' + (r.link ? ' href="' + esc(r.link) + '"' : "") + ">" +
        '<span class="ic-ico">' + icon(r.icon) + "</span>" +
        '<span class="ic-main"><b class="ic-n" data-v="0">0</b><span class="ic-pct">0%</span><span class="ic-t"></span></span>' +
        '<span class="ic-bar" aria-hidden="true"><i></i></span>' +
        '<small class="ic-price">' + esc(unitForm(r.unit, 1) || r.label) + " " + fmt.format(r.price) + " ج" + (r.link ? ' <span class="ic-arrow" aria-hidden="true">←</span>' : "") + "</small>" +
        "</" + tag + "></li>";
    }
    els.input.addEventListener("input", function () { setAmount(els.input.value, "input"); });
    els.input.addEventListener("change", function () { setAmount(els.input.value, "change"); });
    els.range.addEventListener("input", function () { setAmount(els.range.value, "range"); });
    Array.prototype.forEach.call(els.chips, function (b) { b.addEventListener("click", function () { setAmount(b.dataset.v, "chip"); if (window.mersalTap) window.mersalTap(8); }); });
    inPageDonate();
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { root.classList.add("ic-in"); io.disconnect(); } }); }, { threshold: .15 });
      io.observe(root);
    } else root.classList.add("ic-in");
  }

  function setAmount(v, from) {
    var a = Math.round(Number(String(v).replace(/[^\d.]/g, "")) || 0);
    if (from === "change" && a < 10) a = 10;
    amount = a;
    if (from !== "input") els.input.value = a; // on "change" too: a typed 3 becomes the 10 the CTA uses
    if (from !== "range") els.range.value = Math.min(Number(els.range.max), Math.max(Number(els.range.min), a));
    Array.prototype.forEach.call(els.chips, function (b) { var on = Number(b.dataset.v) === a; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    els.amt.textContent = fmt.format(a);
    els.cta.href = "/donate.html?amount=" + (a >= 10 ? a : 10) + "#online";
    els.cta.textContent = a >= 10 ? "تبرع بـ " + fmt.format(a) + " جنيه" : "تبرع بالمبلغ ده";
    update(a);
  }

  // tiles: count-up on the number (text only), the bar scales (transform), partial ones move to the end
  function update(a) {
    var full = [], part = [], covered = 0;
    rows.forEach(function (r, i) {
      var li = els.tile[i], n = Math.floor(a / r.price), pct = Math.min(100, Math.round(a / r.price * 100));
      var ln = li.querySelector(".ic-tile-in"), t = li.querySelector(".ic-t"), nEl = li.querySelector(".ic-n"), pEl = li.querySelector(".ic-pct");
      li.classList.toggle("is-part", n < 1);
      li.style.setProperty("--p", (Math.min(100, a / r.price * 100) / 100).toFixed(3));
      if (n >= 1) { covered++; t.textContent = tileText(r.text, n, r.unit); pEl.textContent = ""; full.push(li); }
      else { t.textContent = "من " + r.label; pEl.textContent = pct + "%"; part.push(li); }
      countTo(nEl, n);
      if (ln.tagName === "A") ln.href = linkFor(r, a >= 10 ? a : 10);
    });
    // reorder without rebuilding: appending existing nodes keeps their state and the bar transitions
    full.concat(part).forEach(function (li, k) { if (els.tiles.children[k] !== li) els.tiles.appendChild(li); });
    clearTimeout(liveT);
    liveT = setTimeout(function () { els.live.textContent = "المبلغ " + fmt.format(a) + " جنيه، " + (covered ? "بيغطي " + covered + " من " + rows.length + " بند بالكامل" : "أقل من أصغر بند"); }, 500);
  }
  var counters = [];
  function countTo(el, target) {
    var from = Number(el.dataset.v) || 0;
    el.dataset.v = target;
    if (reduce || from === target) { el.textContent = fmt.format(target); return; }
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
    counters = counters.filter(function (c) { return c.el !== el; });
    counters.push({ el: el, from: from, to: target, t0: 0 });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick(t) {
    counters = counters.filter(function (c) {
      c.t0 = c.t0 || t; var k = Math.min(1, (t - c.t0) / 520), e = 1 - Math.pow(1 - k, 3);
      c.el.textContent = fmt.format(Math.round(c.from + (c.to - c.from) * e));
      return k < 1;
    });
    raf = counters.length ? requestAnimationFrame(tick) : null;
  }

  // On donate.html the links fill the stepper instead of reloading the page
  function inPageDonate() {
    var form = document.getElementById("pay-form"), amt = document.getElementById("amount"), purpose = document.getElementById("purpose");
    if (!form || !amt || !/donate\.html$/.test(location.pathname)) return;
    root.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a || !/^\/donate\.html/.test(a.getAttribute("href") || "")) return;
      e.preventDefault();
      // card payments switched off (payMode "off"): the stepper is hidden, so open the bank accounts instead
      if (document.documentElement.classList.contains("no-online-pay")) {
        var b = document.getElementById("t-bank"); if (b) b.click();
        var tabs = document.querySelector(".tabs"); if (tabs) tabs.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        return;
      }
      var q = new URLSearchParams(a.getAttribute("href").replace(/^[^?]*\??/, "").replace(/#.*$/, ""));
      var v = Math.max(10, parseInt(q.get("amount"), 10) || amount || 10);
      var f = (q.get("for") || "").replace(/[^\w-]/g, "");
      if (f && purpose && purpose.querySelector('option[value="' + f + '"]') && purpose.value !== f) { purpose.value = f; purpose.dispatchEvent(new Event("change", { bubbles: true })); }
      amt.value = v; amt.dispatchEvent(new Event("input", { bubbles: true }));
      var tab = document.getElementById("t-online"); if (tab && !tab.closest(".no-online-pay")) tab.click();
      history.replaceState(null, "", "?amount=" + v + (f ? "&for=" + encodeURIComponent(f) : "") + "#online");
      (document.querySelector(".stepper") || form).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setTimeout(function () { amt.focus({ preventScroll: true }); }, 400);
      if (window.mersalTap) window.mersalTap(8);
    });
  }

  function load(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  Promise.all([load("/data/impact.json"), load("/content.json"), ensureCss()]).then(function (res) {
    cfg = Object.assign({}, DEFAULTS, res[0] || {});
    if (!Array.isArray(cfg.presets) || !cfg.presets.length) cfg.presets = DEFAULTS.presets;
    rows = buildRows(res[1]);
    if (!rows.length) return;
    render();
    var q = new URLSearchParams(location.search), start = parseInt(q.get("amount"), 10);
    setAmount(start > 0 ? start : num(cfg.default, 500), "init");
  });
})();
