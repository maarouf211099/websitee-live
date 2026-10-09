// Home page: slider, counters and campaigns from /content.json, plus the quick-donate box.
(function () {
  // Old return URL from the bank (https://www.mersal-ngo.org/?hcoReturn=1) -> donate page
  if (/[?&]hcoReturn=1/.test(location.search)) { location.replace("/donate.html" + location.search); return; }

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = window.matchMedia && matchMedia("(max-width: 760px)").matches;
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
  // Odometer: "16,601" -> each digit rolls to its value (transform only, so it stays smooth on phones).
  // --i counts from the units digit, so the roll starts on the right and carries leftwards like a real
  // odometer (CSS adds the delay, spring overshoot and the short blur). Returns the ms until it settles.
  var ODO_MS = 1100, ODO_STEP = 80;
  function odometer(el, value, prefix) {
    var str = fmtN.format(Math.round(value)), total = str.replace(/\D/g, "").length, k = 0;
    // role="img" + aria-label: the rolling digits are presentational and the number is read once, as a whole
    el.setAttribute("role", "img"); el.setAttribute("aria-label", (prefix || "") + str); el.classList.add("odo");
    if (reduceMotion) { el.textContent = (prefix || "") + str; return 0; }
    el.innerHTML = (prefix ? '<span class="od-sep">' + esc(prefix) + "</span>" : "") + str.split("").map(function (ch) {
      if (!/\d/.test(ch)) return '<span class="od-sep">' + ch + "</span>";
      return '<span class="od' + (ch === "0" ? " od-z" : "") + '" style="--d:' + ch + ';--i:' + (total - 1 - k++) + '"><span class="od-roll"><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></span></span>';
    }).join("");
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("od-go"); }); });
    return ODO_MS + Math.max(0, total - 1) * ODO_STEP;
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
    var nav = document.getElementById("sl-nav") || dots, pauseBtn = document.getElementById("sl-pause");
    if (!root || !track) return;
    var cards = Array.prototype.slice.call(track.children), n = cards.length, dotEls = dots.querySelectorAll("button");
    if (!n) { root.hidden = true; return; }
    if (slides && track.dataset.rev && track.dataset.rev !== heroRev(slides)) console.warn("hero markup is older than content.json - run: node tools/render-home.js");
    // cards 3+ carry data-src so they do not compete with the first paint; woken on the first navigation,
    // after 2s, or shortly after load - whichever comes first (autoplay reaches card 3 at 13s)
    var woke = false;
    function wake() {
      if (woke) return; woke = true;
      track.querySelectorAll("source[data-srcset]").forEach(function (so) { so.srcset = so.dataset.srcset; so.removeAttribute("data-srcset"); });
      track.querySelectorAll("img[data-src]").forEach(function (im) { if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute("data-src"); im.removeAttribute("data-srcset"); });
    }
    setTimeout(wake, 2000);
    if (document.readyState === "complete") setTimeout(wake, 300); else addEventListener("load", function () { setTimeout(wake, 300); });
    if (n < 2) { root.querySelectorAll(".sl-arrow").forEach(function (a) { a.hidden = true; }); nav.hidden = true; return; }
    var cur = 0, timer = null, hold = false, seen = true, userPaused = false, rtl = getComputedStyle(track).direction === "rtl", DUR = 6500;
    var jumping = -1, jumpEnd = null, resume = null;
    function setActive(i) {
      if (i === cur) return;
      cards[cur].classList.remove("on"); dotEls[cur].setAttribute("aria-selected", "false");
      cur = i; cards[i].classList.add("on"); dotEls[i].setAttribute("aria-selected", "true");
    }
    // restart the active dot's fill so it runs in step with the autoplay timer
    function refill() { var d = dotEls[cur]; d.classList.add("reset"); void d.offsetWidth; d.classList.remove("reset"); }
    function startEdge(t) { var pad = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0; return rtl ? t.right - pad : t.left + pad; }
    function nearest() {
      var edge = startEdge(track.getBoundingClientRect()), best = 0, bd = Infinity;
      cards.forEach(function (c, i) { var r = c.getBoundingClientRect(), d = Math.abs((rtl ? r.right : r.left) - edge); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function landed() { clearTimeout(jumpEnd); jumping = -1; setActive(nearest()); }
    function goTo(i, smooth) {
      wake();
      i = (i + n) % n;
      var edge = startEdge(track.getBoundingClientRect()), r = cards[i].getBoundingClientRect();
      var dx = (rtl ? r.right : r.left) - edge;
      setActive(i); // dots and copy respond at once; cards passed on the way are ignored until the jump lands
      if (Math.abs(dx) < 1) return;
      jumping = i; clearTimeout(jumpEnd); jumpEnd = setTimeout(landed, 1200);
      // scrollTo with an absolute target: scroll-snap-stop:always truncates scrollBy() to the next card,
      // which broke every multi-card jump (dots, prev from the first card, the autoplay wrap 4 -> 1)
      track.scrollTo({ left: track.scrollLeft + dx, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    }
    track.addEventListener("scrollend", function () { if (jumping >= 0) landed(); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.intersectionRatio >= .6) { var k = cards.indexOf(e.target); if (jumping < 0 || k === jumping) setActive(k); } });
      }, { root: track, threshold: .6 });
      cards.forEach(function (c) { io.observe(c); });
      new IntersectionObserver(function (e) { seen = e[0].isIntersecting; seen ? play() : stop(); }, { threshold: .3 }).observe(root);
    }
    function play() {
      stop();
      if (userPaused || reduceMotion || !seen || document.hidden || document.body.classList.contains("menu-open")) return;
      root.classList.remove("paused"); refill();
      timer = setInterval(function () { if (!hold) goTo(cur + 1, true); }, DUR);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; root.classList.add("paused"); }
    function touched() { wake(); hold = true; jumping = -1; clearTimeout(jumpEnd); stop(); clearTimeout(resume); resume = setTimeout(function () { hold = false; play(); }, 8000); }
    track.addEventListener("pointerdown", touched, { passive: true });
    track.addEventListener("wheel", touched, { passive: true });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : play(); });
    new MutationObserver(function () { document.body.classList.contains("menu-open") ? stop() : play(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    dotEls.forEach(function (d, i) { d.addEventListener("click", function () { touched(); goTo(i, true); }); });
    root.querySelector(".sl-next").addEventListener("click", function () { touched(); goTo(cur + 1, true); });
    root.querySelector(".sl-prev").addEventListener("click", function () { touched(); goTo(cur - 1, true); });
    root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop); root.addEventListener("focusout", play);
    // keyboard: tabbing to a card's link scrolls that card into its snap position
    track.addEventListener("focusin", function (e) { var c = e.target.closest(".sl-card"); if (c) goTo(cards.indexOf(c), false); });
    root.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") goTo(cur + 1, true); if (e.key === "ArrowRight") goTo(cur - 1, true); });
    // visible pause/play (WCAG 2.2.2); under reduced motion nothing moves, so there is nothing to pause
    if (pauseBtn) {
      if (reduceMotion) pauseBtn.hidden = true;
      pauseBtn.addEventListener("click", function () {
        userPaused = !userPaused; root.classList.toggle("user-paused", userPaused);
        pauseBtn.setAttribute("aria-label", userPaused ? "تشغيل التحريك التلقائي" : "إيقاف التحريك التلقائي");
        userPaused ? stop() : play();
      });
    }
    if (phone && !reduceMotion) {
      // copy drifts a little slower than the photo while swiping (one rAF per scroll frame; a CSS
      // view(inline) timeline is mirrored in RTL scrollers in Chromium 141, so it is done here)
      var copies = cards.map(function (c) { return c.querySelector(".sl-copy"); }), queued = false;
      var parallax = function () {
        queued = false;
        var t = track.getBoundingClientRect(), mid = t.left + t.width / 2;
        cards.forEach(function (c, i) {
          var r = c.getBoundingClientRect(); if (!copies[i] || r.right < t.left || r.left > t.right) return;
          copies[i].style.transform = "translateX(" + ((r.left + r.width / 2 - mid) / r.width * -22).toFixed(1) + "px)";
        });
      };
      track.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(parallax); } }, { passive: true });
      // "swipe" hint on the first card, once per session, gone after 3s or on the first touch
      try {
        if (!sessionStorage.getItem("mersal-swipe-hint")) {
          sessionStorage.setItem("mersal-swipe-hint", "1");
          var hint = document.createElement("span");
          hint.className = "sl-hint"; hint.setAttribute("aria-hidden", "true");
          hint.innerHTML = 'اسحب <svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
          cards[0].appendChild(hint);
          var gone = false;
          var hideHint = function () { if (gone) return; gone = true; hint.classList.add("off"); setTimeout(function () { hint.remove(); }, 450); };
          setTimeout(hideHint, 3000);
          track.addEventListener("pointerdown", hideHint, { once: true, passive: true });
        }
      } catch (e) {}
    }
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
      return '<article class="card"><div class="media-box">' + window.mersalPic(c.imageSm || c.image, { alt: c.title, cls: "media", w: 600, h: 375 }) + "</div>" +
        '<div class="body"><h3>' + esc(c.title) + "</h3><p>" + esc(c.text) + "</p>" + bar +
        '<a class="btn btn-gold" href="' + esc(c.link || "/donate.html") + '">' + (c.button || (/^\/p\//.test(c.link || "") ? "اعرف أكثر" : "تبرع للحملة")) + "</a></div></article>";
    }).join("");
    carouselArrows(track);
    fitMedia(track);
    if (window.mersalReveal) window.mersalReveal(track.children);
  }

  // Donation campaigns with goals (imported from the old home page)
  // Card pictures: photos fill the 16:10 box; logos, square and portrait pictures (or SVGs) are shown whole on a soft background
  function fitMedia(root) {
    root.querySelectorAll("img.media").forEach(function (im) {
      function judge() {
        if (!im.naturalWidth) return;
        var r = im.naturalWidth / im.naturalHeight, svg = /\.svg(\?|$)/i.test(im.currentSrc || im.src);
        if (svg || r < 1.25 || r > 2.2) im.classList.add("fit");
      }
      if (im.complete) judge(); else im.addEventListener("load", judge, { once: true });
    });
  }
  // dots under a horizontal card track (phones); the snapped card also gets .is-snapped (CSS focus effect)
  function trackDots(track, box) {
    if (!box || !("IntersectionObserver" in window)) return;
    var cards = Array.prototype.slice.call(track.children);
    box.innerHTML = cards.map(function (_, i) { return "<i" + (i ? "" : ' class="on"') + "></i>"; }).join("");
    var dots = box.children;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.intersectionRatio >= .6) {
          var i = cards.indexOf(e.target);
          Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle("on", k === i); });
          cards.forEach(function (c, k) { c.classList.toggle("is-snapped", k === i); });
        }
      });
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
    // progress as lit segments: each one fills in turn as --p counts up, colour follows the percentage (--hue)
    var SEGS = 20, segs = "";
    for (var k = 0; k < SEGS; k++) segs += '<i style="--k:' + k + '"></i>';
    return '<article class="card camp' + (st ? " is-" + st : "") + '" data-pct="' + pct.toFixed(1) + '" data-raised="' + raised + '" data-unit="' + price + '" data-max="' + (c.maxUnits || 50) + '" style="--p:0">' +
      // the image link is a duplicate of the title link (hidden from AT); the price badge and the state chip sit beside it so they are read
      '<div class="camp-media"><a class="camp-img" href="' + esc(link) + '" tabindex="-1" aria-hidden="true">' + window.mersalPic(c.imageSm || c.image, { alt: "", w: 900, h: 900, srcset: c.imageSm ? [[c.imageSm, "600w"], [c.image, "900w"]] : null, sizes: c.imageSm ? "(max-width: 760px) 82vw, 380px" : "" }) + "</a>" +
        (price ? '<span class="camp-badge">' + esc(badge) + "</span>" : "") + (hot ? '<span class="camp-hot">' + hot + "</span>" : "") + "</div>" +
      '<div class="body"><h3><a href="' + esc(link) + '">' + esc(c.title) + "</a></h3>" +
        (c.impact ? '<p class="camp-impact">' + esc(c.impact) + "</p>" : "") +
        (st === "fresh" ? '<p class="camp-first">كن أول من يساهم في الحملة</p>' : '<div class="camp-stat"><b class="camp-num">0</b><span>' + esc(unit) + ' اتوفرت</span><span class="camp-pct">0%</span></div>') +
        (goal ? '<div class="bar seg" style="--n:' + SEGS + '" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + Math.round(pct) + '% من الهدف">' + segs + '<em></em></div>' +
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
    // one clock drives the number, the percentage, the bar and its thumb: the bar and the % pill take
    // exactly as long as the odometer (units digit first, leftmost digit last), so all three settle together
    function animate(card, delay) {
      var pct = +card.dataset.pct, raised = +card.dataset.raised, num = card.querySelector(".camp-num"), pc = card.querySelector(".camp-pct"), t0 = null;
      function paint(e) { card.style.setProperty("--p", (pct * e).toFixed(2)); if (pc) pc.textContent = Math.round(pct * e) + "%"; }
      if (reduceMotion || !pct) { if (num) odometer(num, raised); paint(1); card.classList.add("filled"); return; }
      setTimeout(function () {
        var D = (num ? odometer(num, raised) : 0) || 1500;
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
    // (no mersalReveal here: the counters are the cards' entrance, and a reveal animation would hold
    // the opacity that the snapped-card focus effect needs)
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
      var ms = odometer(el, Number(el.dataset.count), el.dataset.prefix || "");
      setTimeout(function () { el.classList.add("done"); }, ms ? ms + 100 : 0);
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
