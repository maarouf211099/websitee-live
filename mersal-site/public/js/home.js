// Home page: slider, counters and campaigns from /content.json, plus the quick-donate box.
(function () {
  // Old return URL from the bank (https://www.mersal-ngo.org/?hcoReturn=1) -> donate page
  if (/[?&]hcoReturn=1/.test(location.search)) { location.replace("/donate.html" + location.search); return; }

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");

  document.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(function () {
        b.textContent = "تم النسخ ✓"; setTimeout(function () { b.textContent = "نسخ"; }, 1500);
      });
    });
  });

  // ---------- quick donate (only when card payment is on) ----------
  var form = document.getElementById("quick-donate"), input = document.getElementById("qa");
  form.querySelectorAll(".amounts button").forEach(function (b) {
    b.addEventListener("click", function () {
      form.querySelectorAll(".amounts button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); input.value = b.dataset.v; if (window.mersalTap) window.mersalTap(8);
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    location.href = "/donate.html?amount=" + encodeURIComponent(input.value) + "#online";
  });

  // ---------- numbers + ticker (from content.json "numbers") ----------
  var fmtN = new Intl.NumberFormat("en-US");
  // Odometer: "16,601" -> each digit rolls to its value (transform only, so it stays smooth on phones)
  function odometer(el, value, prefix) {
    var str = fmtN.format(Math.round(value)), digits = 0;
    el.setAttribute("aria-label", (prefix || "") + str); el.classList.add("odo");
    if (reduceMotion) { el.textContent = (prefix || "") + str; return; }
    el.innerHTML = (prefix ? '<span class="od-sep">' + esc(prefix) + "</span>" : "") + str.split("").map(function (ch) {
      if (!/\d/.test(ch)) return '<span class="od-sep">' + ch + "</span>";
      return '<span class="od" aria-hidden="true"><span class="od-roll" style="--d:' + ch + ';--i:' + (digits++) + '"><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></span></span>';
    }).join("");
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("od-go"); }); });
  }
  function numbers(list) {
    var tk = document.getElementById("ticker"), grid = document.querySelector(".numbers-grid");
    if (list && list.length) {
      if (grid) grid.innerHTML = list.map(function (n) {
        var tag = n.link ? "a" : "div";
        return "<" + tag + ' class="num"' + (n.link ? ' href="' + esc(n.link) + '"' : "") + '><b data-count="' + Number(n.value || 0) + '" data-prefix="' + esc(n.prefix || "") + '">0</b><span>' + esc(n.label) + "</span></" + tag + ">";
      }).join("");
      if (tk) tk.innerHTML = list.map(function (n) { return "<span><b>" + esc(n.prefix || "") + fmtN.format(Number(n.value || 0)) + "</b> " + esc(n.label) + "</span>"; }).join("") +
        '<span><b>19340</b> الخط الساخن - مندوب لحد البيت</span><span class="hash"><b>#</b>ابعت_فرحة</span>';
    }
    if (tk && !reduceMotion) {
      tk.innerHTML += '<span class="dup" aria-hidden="true">' + tk.innerHTML + "</span>";
      var tkBox = tk.closest(".ticker");
      if (tkBox && "IntersectionObserver" in window) new IntersectionObserver(function (e) { tkBox.classList.toggle("off", !e[0].isIntersecting); }).observe(tkBox);
    }
  }

  // ---------- slider: the cards are pre-rendered in index.html (api/src/lib/hero.js); this only adds behaviour ----------
  function heroRev(slides) { var str = JSON.stringify(slides || []), h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function slider(slides) {
    var root = document.getElementById("slider"), track = document.getElementById("slides"), dots = document.getElementById("sl-dots");
    if (!root || !track) return;
    var cards = Array.prototype.slice.call(track.children), n = cards.length, dotEls = dots.querySelectorAll("button");
    if (!n) { root.hidden = true; return; }
    if (slides && track.dataset.rev && track.dataset.rev !== heroRev(slides)) console.warn("hero markup is older than content.json - run: node tools/render-home.js");
    // cards 3+ carry data-src so they do not compete with the first paint
    function wake() {
      track.querySelectorAll("source[data-srcset]").forEach(function (so) { so.srcset = so.dataset.srcset; so.removeAttribute("data-srcset"); });
      track.querySelectorAll("img[data-src]").forEach(function (im) { if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute("data-src"); im.removeAttribute("data-srcset"); });
    }
    if (document.readyState === "complete") setTimeout(wake, 300); else addEventListener("load", function () { setTimeout(wake, 300); });
    if (n < 2) { root.querySelectorAll(".sl-arrow").forEach(function (a) { a.hidden = true; }); dots.hidden = true; return; }
    var cur = 0, timer = null, hold = false, seen = true, rtl = getComputedStyle(track).direction === "rtl", DUR = 6500;
    function setActive(i) {
      if (i === cur) return;
      cards[cur].classList.remove("on"); dotEls[cur].setAttribute("aria-selected", "false");
      cur = i; cards[i].classList.add("on"); dotEls[i].setAttribute("aria-selected", "true");
      dotEls[i].style.animation = "none"; void dotEls[i].offsetWidth; dotEls[i].style.animation = "";
    }
    function goTo(i, smooth) {
      i = (i + n) % n;
      var t = track.getBoundingClientRect(), r = cards[i].getBoundingClientRect(), pad = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
      var dx = rtl ? r.right - (t.right - pad) : r.left - (t.left + pad);
      track.scrollBy({ left: dx, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.intersectionRatio >= .6) setActive(cards.indexOf(e.target)); }); }, { root: track, threshold: .6 });
      cards.forEach(function (c) { io.observe(c); });
      new IntersectionObserver(function (e) { seen = e[0].isIntersecting; seen ? play() : stop(); }, { threshold: .3 }).observe(root);
    }
    function play() { stop(); if (reduceMotion || !seen || document.hidden || document.body.classList.contains("menu-open")) return; root.classList.remove("paused"); timer = setInterval(function () { if (!hold) goTo(cur + 1, true); }, DUR); }
    function stop() { if (timer) clearInterval(timer); timer = null; root.classList.add("paused"); }
    var resume;
    function touched() { hold = true; stop(); clearTimeout(resume); resume = setTimeout(function () { hold = false; play(); }, 8000); }
    track.addEventListener("pointerdown", touched, { passive: true });
    track.addEventListener("wheel", touched, { passive: true });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : play(); });
    new MutationObserver(function () { document.body.classList.contains("menu-open") ? stop() : play(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    dotEls.forEach(function (d, i) { d.addEventListener("click", function () { goTo(i, true); touched(); }); });
    root.querySelector(".sl-next").addEventListener("click", function () { goTo(cur + 1, true); touched(); });
    root.querySelector(".sl-prev").addEventListener("click", function () { goTo(cur - 1, true); touched(); });
    root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop); root.addEventListener("focusout", play);
    root.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") goTo(cur + 1, true); if (e.key === "ArrowRight") goTo(cur - 1, true); });
    play();
  }

  // ---------- campaigns carousel ----------
  function campaigns(list) {
    var track = document.getElementById("campaigns");
    track.innerHTML = (list || []).map(function (c) {
      var bar = "";
      if (c.goal > 0) {
        var pct = Math.min(100, Math.round((c.raised || 0) / c.goal * 100));
        bar = '<div class="progress" aria-label="' + pct + '%"><i style="width:' + pct + '%"></i></div>' +
          '<div class="meta-row"><span>تم جمع ' + fmt.format(c.raised || 0) + ' جنيه</span><span>الهدف ' + fmt.format(c.goal) + "</span></div>";
      }
      return '<article class="card"><div style="overflow:hidden">' + window.mersalPic(c.imageSm || c.image, { alt: c.title, cls: "media", w: 600, h: 375 }) + "</div>" +
        '<div class="body"><h3>' + esc(c.title) + "</h3><p>" + esc(c.text) + "</p>" + bar +
        '<a class="btn btn-gold" href="' + esc(c.link || "/donate.html") + '">' + (c.button || (/^\/p\//.test(c.link || "") ? "اعرف أكثر" : "تبرع للحملة")) + "</a></div></article>";
    }).join("");
    carouselArrows(track);
    if (window.mersalReveal) window.mersalReveal(track.children);
  }

  // Donation campaigns with goals (imported from the old home page)
  // dots under a horizontal card track (phones)
  function trackDots(track, box) {
    if (!box || !("IntersectionObserver" in window)) return;
    var cards = Array.prototype.slice.call(track.children);
    box.innerHTML = cards.map(function (_, i) { return "<i" + (i ? "" : ' class="on"') + "></i>"; }).join("");
    var dots = box.children;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.intersectionRatio >= .6) { var i = cards.indexOf(e.target); Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle("on", k === i); }); } });
    }, { root: track, threshold: .6 });
    cards.forEach(function (c) { io.observe(c); });
  }
  function carouselArrows(track) {
    var car = track.parentNode;
    function check() { car.classList.toggle("overflow", track.scrollWidth > track.clientWidth + 4); }
    check(); addEventListener("resize", check);
    function step(dir) { var card = track.firstElementChild; if (!card) return; var gap = parseFloat(getComputedStyle(track).columnGap) || 20; track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduceMotion ? "auto" : "smooth" }); }
    // RTL: "next" moves further to the left
    car.querySelector(".car-next").addEventListener("click", function () { step(-1); });
    car.querySelector(".car-prev").addEventListener("click", function () { step(1); });
  }

  // ---------- donation campaigns: "cause cards" ----------
  var UNIT_DEF = { "جرعة": "الجرعة", "سهم": "السهم", "كارت": "الكارت", "كفالة": "الكفالة" };
  function campCard(c) {
    var goal = +c.goal || 0, raised = +c.raised || 0, pct = goal ? Math.min(100, raised / goal * 100) : 0, left = Math.max(0, goal - raised), price = +c.unitPrice || 0;
    var unit = c.unit || "سهم", days = c.deadline ? Math.ceil((new Date(c.deadline) - Date.now()) / 864e5) : null;
    var st = c.status === "done" || pct >= 100 ? "done" : c.urgent || (days !== null && days <= 14 && days >= 0) ? "urgent" : pct >= 75 ? "near" : !raised ? "fresh" : "";
    var hot = { urgent: days !== null && days >= 0 ? "عاجل · باقي " + days + " يوم" : "عاجل", near: "قربنا نكمل", done: "اكتمل الهدف", fresh: "حملة جديدة" }[st];
    var base = "/donate.html?for=" + encodeURIComponent(c.purpose || "general") + "&amount=";
    var badge = c.badge || ((UNIT_DEF[unit] || "ال" + unit) + " " + fmt.format(price) + " جنيه");
    var link = c.link || "/donate.html";
    return '<article class="card camp' + (st ? " is-" + st : "") + '" data-pct="' + pct.toFixed(1) + '" data-raised="' + raised + '" data-unit="' + price + '" data-max="' + (c.maxUnits || 50) + '" style="--p:0">' +
      '<a class="camp-img" href="' + esc(link) + '" tabindex="-1" aria-hidden="true">' + window.mersalPic(c.imageSm || c.image, { alt: "", w: 900, h: 900, srcset: c.imageSm ? [[c.imageSm, "600w"], [c.image, "900w"]] : null, sizes: c.imageSm ? "(max-width: 760px) 82vw, 380px" : "" }) +
        (price ? '<span class="camp-badge">' + esc(badge) + "</span>" : "") + (hot ? '<span class="camp-hot">' + hot + "</span>" : "") + "</a>" +
      '<div class="body"><h3><a href="' + esc(link) + '">' + esc(c.title) + "</a></h3>" +
        (c.impact ? '<p class="camp-impact">' + esc(c.impact) + "</p>" : "") +
        (st === "fresh" ? '<p class="camp-first">كن أول من يساهم في الحملة</p>' : '<div class="camp-stat"><b class="camp-num">0</b><span>' + esc(unit) + ' اتوفرت</span><span class="camp-pct">0%</span></div>') +
        (goal ? '<div class="bar" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + Math.round(pct) + '% من الهدف"><i></i><em></em></div>' +
          '<div class="camp-foot"><span>الهدف <b>' + fmt.format(goal) + "</b> " + esc(unit) + "</span>" + (st === "done" ? '<span class="ok">الحمد لله، اكتمل</span>' : '<span class="left">باقي <b>' + fmt.format(left) + "</b> " + esc(unit) + "</span>") + "</div>" : "") +
        (c.donors ? '<p class="camp-proof">شارك فيها <b>' + fmt.format(c.donors) + "</b> متبرع</p>" : "") +
        '<div class="camp-cta' + (price && st !== "done" ? "" : " single") + '">' +
          (price && st !== "done" ? '<div class="camp-qty" role="group" aria-label="عدد ' + esc(unit) + '"><button type="button" data-d="1" aria-label="زيادة">+</button><output aria-live="polite">1</output><button type="button" data-d="-1" aria-label="تقليل">−</button></div>' : "") +
          '<a class="btn btn-gold camp-give" href="' + (st === "done" ? "/donate.html#online" : base + (price || "") + "#online") + '" data-base="' + base + '">' +
            (st === "done" ? "ادعم حالة تانية" : price ? (c.cta ? esc(c.cta) : 'تبرع بـ <b class="amt">' + fmt.format(price) + "</b> ج") : "تبرع الآن") + "</a></div>" +
        '<div class="camp-links"><a class="camp-more" href="' + esc(link) + '">تفاصيل الحملة ←</a>' +
          '<button type="button" class="camp-share" data-title="' + esc(c.title) + '" data-url="' + esc(link) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>شارك</button></div>' +
      "</div></article>";
  }
  function donationCampaigns(list) {
    var track = document.getElementById("donation-campaigns");
    if (!track) return;
    list = (list || []).filter(function (c) { return c && c.title && (c.image || c.imageSm); });
    if (!list.length || !list.some(function (c) { return c.goal; })) { document.getElementById("campaigns-sec").hidden = true; return; }
    track.innerHTML = list.map(campCard).join("");
    var count = document.getElementById("camp-count"), open = list.filter(function (c) { return !(c.status === "done" || (c.goal && (c.raised || 0) >= c.goal)); }).length;
    if (count) count.textContent = open + (open === 1 ? " حملة" : open === 2 ? " حملتين" : open <= 10 ? " حملات" : " حملة");
    if (!track.dataset.wired) { carouselArrows(track); track.dataset.wired = "1"; }
    trackDots(track, document.getElementById("camp-dots"));
    // one clock drives the number, the percentage, the bar and its thumb
    function animate(card, delay) {
      var pct = +card.dataset.pct, raised = +card.dataset.raised, num = card.querySelector(".camp-num"), pc = card.querySelector(".camp-pct"), D = 1600, t0 = null;
      function paint(e) { card.style.setProperty("--p", (pct * e).toFixed(2)); if (pc) pc.textContent = Math.round(pct * e) + "%"; }
      if (num) odometer(num, raised);
      if (reduceMotion || !pct) { paint(1); card.classList.add("filled"); return; }
      setTimeout(function () {
        requestAnimationFrame(function step(t) {
          t0 = t0 || t; var k = Math.min(1, (t - t0) / D); paint(1 - Math.pow(1 - k, 4));
          if (k < 1) requestAnimationFrame(step); else card.classList.add("filled");
        });
      }, delay);
    }
    var cards = track.querySelectorAll(".camp");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { var i = 0; en.forEach(function (e) { if (e.isIntersecting) { animate(e.target, i++ * 120); io.unobserve(e.target); } }); }, { threshold: .35 });
      cards.forEach(function (c) { io.observe(c); });
    } else cards.forEach(function (c) { animate(c, 0); });
    if (window.mersalReveal) window.mersalReveal(cards);
  }
  // quantity stepper -> live CTA amount (delegated once; survives re-renders)
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#donation-campaigns .camp-qty button"); if (!b) return;
    var card = b.closest(".camp"), out = card.querySelector(".camp-qty output"), give = card.querySelector(".camp-give"), amt = give.querySelector(".amt");
    var n = Math.min(+card.dataset.max || 50, Math.max(1, (+out.textContent || 1) + +b.dataset.d)), total = n * +card.dataset.unit;
    out.textContent = n; give.href = give.dataset.base + total + "#online"; if (amt) amt.textContent = fmt.format(total);
    give.classList.remove("bump"); void give.offsetWidth; give.classList.add("bump");
    if (window.mersalTap) window.mersalTap(8);
  });
  // share a campaign: native share sheet on phones, WhatsApp elsewhere
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".camp-share"); if (!b) return;
    var url = location.origin + b.dataset.url, text = b.dataset.title + " - مؤسسة مرسال";
    if (navigator.share) { navigator.share({ title: b.dataset.title, text: text, url: url }).catch(function () {}); }
    else window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
  });

  // Count-up numbers (hospital facts, numbers band)
  function countUp() {
    var nums = document.querySelectorAll("[data-count]:not([data-done])");
    nums.forEach(function (n) { n.setAttribute("data-done", "1"); });
    function run(el) {
      odometer(el, Number(el.dataset.count), el.dataset.prefix || "");
      setTimeout(function () { el.classList.add("done"); }, reduceMotion ? 0 : 1700);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: .6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  // Boot: slides/campaigns/numbers are inlined in index.html (#home-data) so nothing waits for a fetch;
  // content.json is read afterwards for the projects carousel and as a stale guard.
  var inline = document.getElementById("home-data"), data = null;
  try { data = inline && JSON.parse(inline.textContent); } catch (e) { data = null; }
  function boot(d) { numbers(d.numbers); countUp(); slider(d.slides); donationCampaigns(d.campaigns); }
  if (data) boot(data);
  function later() {
    fetch("/content.json").then(function (r) { return r.json(); }).then(function (fresh) {
      if (!data) { boot(fresh); campaigns(fresh.projects); return; }
      campaigns(fresh.projects);
      if (JSON.stringify(fresh.campaigns) !== JSON.stringify(data.campaigns)) donationCampaigns(fresh.campaigns);
      if (JSON.stringify(fresh.numbers) !== JSON.stringify(data.numbers)) { numbers(fresh.numbers); countUp(); }
      if (heroRev(fresh.slides) !== heroRev(data.slides)) console.warn("hero is older than content.json - run: node tools/render-home.js");
    }).catch(function () {});
  }
  if (data) { if (document.readyState === "complete") setTimeout(later, 800); else addEventListener("load", function () { setTimeout(later, 800); }); } else later();
})();
