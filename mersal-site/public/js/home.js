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
      b.classList.add("on"); input.value = b.dataset.v;
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    location.href = "/donate.html?amount=" + encodeURIComponent(input.value) + "#online";
  });

  // ---------- slider ----------
  function slider(slides) {
    var box = document.getElementById("slides"), dots = document.getElementById("sl-dots"), root = document.getElementById("slider");
    if (!slides || !slides.length) return;
    var banners = slides.every(function (s) { return s.banner; });
    if (banners) box.classList.add("banners");
    box.innerHTML = slides.map(function (s, i) {
      if (s.banner) {
        return '<div class="slide banner' + (i === 0 ? " on" : "") + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " / " + slides.length + '">' +
          (i === 0 ? '<h1 class="sr-only">مؤسسة مرسال للأعمال الخيرية والتنموية</h1>' : "") +
          '<a href="' + esc(s.link || "/donate.html") + '"><img src="' + esc(s.banner) + '" alt="' + esc(s.alt || "") + '" width="1920" height="570"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + "></a></div>";
      }
      var heading = i === 0 ? "h1" : "h2";
      var tel = /^tel:/.test(s.link || "");
      return '<div class="slide' + (i === 0 ? " on" : "") + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " / " + slides.length + '"' +
        '><div class="sl-bg" style="background-image:url(\'' + esc(s.image || "/img/hero.jpg") + '\')"></div>' +
        '<div class="wrap slide-inner"><div class="sl-text">' +
          (s.tag ? '<img class="tag" src="' + esc(s.tag) + '" alt="" width="187" height="56">' : "") +
          "<" + heading + ">" + esc(s.title) + "</" + heading + ">" +
          (s.text ? "<p>" + esc(s.text) + "</p>" : "") +
          (s.button ? '<div class="actions"><a class="btn btn-gold" href="' + esc(s.link || "/donate.html") + '"' + (tel ? "" : "") + ">" + esc(s.button) + "</a></div>" : "") +
        "</div>" +
        (s.side ? '<img class="sl-side" src="' + esc(s.side) + '" alt="" loading="' + (i ? "lazy" : "eager") + '">' : "<div></div>") +
        "</div></div>";
    }).join("");
    var els = box.querySelectorAll(".slide"), cur = 0, timer = null;
    dots.innerHTML = slides.map(function (_, i) {
      return '<button type="button" role="tab" aria-label="الشريحة ' + (i + 1) + '" aria-selected="' + (i === 0) + '"></button>';
    }).join("");
    var dotEls = dots.querySelectorAll("button");
    function go(n) {
      n = (n + els.length) % els.length;
      if (n === cur) return;
      els[cur].classList.remove("on", "kb");
      dotEls[cur].setAttribute("aria-selected", "false");
      cur = n;
      els[cur].classList.add("on");
      if (!reduceMotion) els[cur].classList.add("kb");
      dotEls[cur].setAttribute("aria-selected", "true");
    }
    function play() { stop(); if (!reduceMotion && els.length > 1) timer = setInterval(function () { go(cur + 1); }, 6500); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    dotEls.forEach(function (d, i) { d.addEventListener("click", function () { go(i); play(); }); });
    root.querySelector(".sl-next").addEventListener("click", function () { go(cur + 1); play(); });
    root.querySelector(".sl-prev").addEventListener("click", function () { go(cur - 1); play(); });
    root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop); root.addEventListener("focusout", play);
    // swipe on phones (RTL: swipe left = previous)
    var x0 = null;
    root.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(cur + (dx > 0 ? 1 : -1)); play(); }
    });
    if (els.length < 2) { root.querySelectorAll(".sl-arrow").forEach(function (a) { a.hidden = true; }); dots.hidden = true; }
    if (!reduceMotion) els[0].classList.add("kb");
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
      return '<article class="card"><div style="overflow:hidden"><div class="media" style="background-image:url(\'' + esc(c.image) + '\')" role="img" aria-label="' + esc(c.title) + '"></div></div>' +
        '<div class="body"><h3>' + esc(c.title) + "</h3><p>" + esc(c.text) + "</p>" + bar +
        '<a class="btn btn-gold" href="' + esc(c.link || "/donate.html") + '">' + (c.button || (/^\/p\//.test(c.link || "") ? "اعرف أكثر" : "تبرع للحملة")) + "</a></div></article>";
    }).join("");
    var car = track.parentNode;
    function check() { car.classList.toggle("overflow", track.scrollWidth > track.clientWidth + 4); }
    check(); addEventListener("resize", check);
    function step(dir) { var card = track.firstElementChild; if (card) track.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: reduceMotion ? "auto" : "smooth" }); }
    // RTL: "next" moves further to the left
    car.querySelector(".car-next").addEventListener("click", function () { step(-1); });
    car.querySelector(".car-prev").addEventListener("click", function () { step(1); });
    if (window.mersalReveal) window.mersalReveal(track.children);
  }

  // Donation campaigns with goals (imported from the old home page)
  function donationCampaigns(list) {
    var track = document.getElementById("donation-campaigns");
    if (!track) return;
    if (!list || !list.length || !list.some(function (c) { return c.goal; })) { document.getElementById("campaigns-sec").hidden = true; return; }
    track.innerHTML = list.map(function (c) {
      var pct = c.goal ? Math.min(100, Math.round((c.raised || 0) / c.goal * 100)) : 0;
      var give = "/donate.html?for=" + encodeURIComponent(c.purpose || "general") + (c.unitPrice ? "&amount=" + c.unitPrice : "") + "#online";
      return '<article class="card camp">' +
        '<a class="camp-img" href="' + esc(c.link) + '"><img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy" width="900" height="900"></a>' +
        '<div class="body">' +
          '<h3><a href="' + esc(c.link) + '">' + esc(c.title) + "</a></h3>" +
          (c.unitPrice ? '<span class="unit-price">سعر الـ' + esc(c.unit) + ": <b>" + fmt.format(c.unitPrice) + " جنيه</b></span>" : "") +
          '<div class="goal-box">' +
            '<div class="goal-top"><span>تم توفير <b data-to="' + (c.raised || 0) + '">0</b> ' + esc(c.unit) + '</span><span class="pct">' + pct + "%</span></div>" +
            '<div class="progress"><i data-pct="' + pct + '"></i></div>' +
            '<div class="goal-bottom">الهدف ' + fmt.format(c.goal) + " " + esc(c.unit) + "</div>" +
          "</div>" +
          '<div class="camp-actions"><a class="btn btn-gold" href="' + give + '">تبرع الآن</a><a class="btn btn-ghost-teal" href="' + esc(c.link) + '">التفاصيل</a></div>' +
        "</div></article>";
    }).join("");
    var car = track.parentNode;
    function check() { car.classList.toggle("overflow", track.scrollWidth > track.clientWidth + 4); }
    check(); addEventListener("resize", check);
    function step(dir) { var card = track.firstElementChild; if (card) track.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: reduceMotion ? "auto" : "smooth" }); }
    car.querySelector(".car-next").addEventListener("click", function () { step(-1); });
    car.querySelector(".car-prev").addEventListener("click", function () { step(1); });
    // fill the bars and count up when visible
    function animate(card) {
      var bar = card.querySelector(".progress i"), num = card.querySelector("b[data-to]");
      bar.style.width = bar.dataset.pct + "%";
      var to = Number(num.dataset.to), t0 = null;
      if (reduceMotion || !to) { num.textContent = fmt.format(to); return; }
      requestAnimationFrame(function stepN(t) {
        t0 = t0 || t; var k = Math.min(1, (t - t0) / 1400);
        num.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(stepN);
      });
    }
    var cards = track.querySelectorAll(".camp");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }); }, { threshold: .35 });
      cards.forEach(function (c) { io.observe(c); });
    } else cards.forEach(animate);
  }

  function channels(list) {
    if (!list || !list.length) return;
    document.getElementById("channels").innerHTML = list.map(function (c) {
      return '<div class="card channel">' + (c.image ? '<img src="' + esc(c.image) + '" alt="" loading="lazy">' : "") +
        "<div><h3>" + esc(c.title) + "</h3><p>" + esc(c.text) + "</p></div></div>";
    }).join("");
    document.getElementById("channels-sec").hidden = false;
    if (window.mersalReveal) window.mersalReveal(document.getElementById("channels").children);
  }

  // Count-up numbers in the hospital section
  (function () {
    var nums = document.querySelectorAll("[data-count]");
    function run(el) {
      var to = Number(el.dataset.count), t0 = null;
      if (reduceMotion) { el.textContent = fmt.format(to); return; }
      requestAnimationFrame(function step(t) {
        t0 = t0 || t; var p = Math.min(1, (t - t0) / 1500);
        el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      });
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: .6 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  fetch("/content.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (data) {
    slider(data.slides); donationCampaigns(data.campaigns); campaigns(data.projects); channels(data.channels);
  }).catch(function () {});
})();
