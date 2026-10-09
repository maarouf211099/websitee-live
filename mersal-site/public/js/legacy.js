// Behaviour for imported old-site pages (public/p/*.html): content clean-up, picture strips, FAQ accordions,
// breadcrumbs, share buttons and the "related pages" cards. Needs js/layout.js (mersalPic, mersalReveal).
(function () {
  var legacyWrap = document.querySelector(".legacy");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var pid = (/^\/p\/(\d+)\.html$/.exec(location.pathname) || [])[1];
  var donateHref = "/donate.html" + (pid ? "?for=p" + pid : "") + "#online";

  // ---------- 1. clean-up of what the old CMS left behind ----------
  if (legacyWrap) {
    // headings / paragraphs that only hold &nbsp; or <br>
    $$("h1, h2, h3, h4, h5, p", legacyWrap).forEach(function (el) {
      if (!el.querySelector("img, iframe, a, button") && !el.textContent.replace(/[\s ]+/g, "")) el.remove();
    });
    // the old "Submit Donation Online" button -> a real donate link
    $$("button.proceed, button[id*='Donation']", legacyWrap).forEach(function (b) {
      var a = document.createElement("a"); a.className = "do-btn"; a.href = donateHref; a.textContent = "تبرع الآن";
      b.parentNode.replaceChild(a, b);
    });
    // pictures that linked to files of the old site: link to the picture itself instead of a dead page
    $$('a[href*="/ClientFilesLayout/"], a[href*="DynamicPageImages"]', legacyWrap).forEach(function (a) {
      var img = a.querySelector("img");
      if (img) { a.href = img.currentSrc || img.src; a.target = "_blank"; a.rel = "noopener"; }
      else a.replaceWith.apply(a, Array.prototype.slice.call(a.childNodes));
    });
    // tables scroll sideways on phones
    $$("table", legacyWrap).forEach(function (t) {
      if (t.parentNode.classList.contains("table-scroll")) return;
      var w = document.createElement("div"); w.className = "table-scroll"; w.setAttribute("tabindex", "0"); w.setAttribute("role", "region"); w.setAttribute("aria-label", "جدول - اسحب لليمين واليسار");
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    // donate links inside a project page pre-select that project on the donate page
    if (pid) $$('a[href^="/donate.html"]', legacyWrap).forEach(function (a) { a.href = donateHref; });
  }

  // ---------- 2. picture strips: old Bootstrap carousels + rows of pictures -> one swipeable strip ----------
  function strip(items, opts) {
    var g = document.createElement("div");
    g.className = "gallery" + (opts.free ? " free" : "") + (items.length > 1 ? " multi" : "");
    g.setAttribute("role", "region"); g.setAttribute("aria-label", opts.label || "صور");
    var track = document.createElement("div"); track.className = "gal-track";
    items.forEach(function (it) { track.appendChild(it); });
    g.appendChild(track);
    if (items.length > 1) {
      g.insertAdjacentHTML("beforeend",
        '<button type="button" class="gal-arrow gal-prev" aria-label="الصورة السابقة">&#8250;</button>' +
        '<button type="button" class="gal-arrow gal-next" aria-label="الصورة التالية">&#8249;</button>' +
        '<span class="gal-count" aria-hidden="true">1 / ' + items.length + '</span>' +
        '<div class="gal-dots" role="tablist" aria-label="الصور">' + items.map(function (_, i) {
          return '<button type="button" role="tab" aria-label="صورة ' + (i + 1) + '"' + (i ? "" : ' class="on" aria-selected="true"') + "></button>";
        }).join("") + "</div>");
      var dots = $$(".gal-dots button", g), count = g.querySelector(".gal-count"), cur = 0;
      function goTo(i) {
        i = Math.max(0, Math.min(items.length - 1, i));
        var el = track.children[i];
        // RTL: scrollLeft is 0 at the start (right edge) and goes negative
        track.scrollTo({ left: el.offsetLeft - track.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      }
      function sync() {
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
        for (var i = 0; i < track.children.length; i++) {
          var c = track.children[i], d = Math.abs(c.offsetLeft - track.offsetLeft + c.clientWidth / 2 - mid);
          if (d < bd) { bd = d; best = i; }
        }
        if (best === cur) return;
        cur = best;
        dots.forEach(function (d, i) { d.classList.toggle("on", i === cur); d.setAttribute("aria-selected", i === cur ? "true" : "false"); });
        count.textContent = (cur + 1) + " / " + items.length;
      }
      var raf = null;
      track.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = null; sync(); }); }, { passive: true });
      dots.forEach(function (d, i) { d.addEventListener("click", function () { goTo(i); }); });
      g.querySelector(".gal-prev").addEventListener("click", function () { goTo(cur - 1); });
      g.querySelector(".gal-next").addEventListener("click", function () { goTo(cur + 1); });
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur + 1); }   // RTL: left = next
        if (e.key === "ArrowRight") { e.preventDefault(); goTo(cur - 1); }
      });
      track.setAttribute("tabindex", "0");
      // mouse users drag the strip; it keeps rolling after the release, then settles on the nearest picture
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) (function () {
        var x0 = null, sl0 = 0, vx = 0, lastX = 0, lastT = 0, raf = null, moved = false, snapT = null;
        track.addEventListener("pointerdown", function (e) {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          cancelAnimationFrame(raf); clearTimeout(snapT);
          x0 = lastX = e.clientX; sl0 = track.scrollLeft; lastT = performance.now(); vx = 0; moved = false;
          track.classList.add("grab"); try { track.setPointerCapture(e.pointerId); } catch (x) {}
        });
        track.addEventListener("pointermove", function (e) {
          if (x0 === null) return;
          var dx = e.clientX - x0;
          if (!moved && Math.abs(dx) < 4) return;
          moved = true; track.classList.add("dragging");
          track.scrollLeft = sl0 - dx;
          var t = performance.now(); vx = (e.clientX - lastX) / Math.max(1, t - lastT); lastX = e.clientX; lastT = t;
        });
        function settle() { sync(); goTo(cur); snapT = setTimeout(function () { track.classList.remove("dragging"); }, 450); }
        function up() {
          if (x0 === null) return;
          x0 = null; track.classList.remove("grab");
          if (!moved) { track.classList.remove("dragging"); return; }
          var v = vx * 16; // px per frame, decays 8% a frame
          (function roll() {
            if (Math.abs(v) < .6 || reduce) { settle(); return; }
            track.scrollLeft -= v; v *= .92; raf = requestAnimationFrame(roll);
          })();
        }
        track.addEventListener("pointerup", up); track.addEventListener("pointercancel", up);
        track.addEventListener("dragstart", function (e) { e.preventDefault(); }); // a picture would otherwise start a native drag-and-drop
        track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
      })();
    }
    return g;
  }
  if (legacyWrap) {
    // a) old carousels (.carousel > .carousel-inner > .item > [a >] img)
    $$(".carousel", legacyWrap).forEach(function (car) {
      var imgs = $$(".carousel-inner .item img", car).filter(function (i) { return i.getAttribute("src"); });
      if (!imgs.length) return;
      var items = imgs.map(function (img) {
        img.loading = "lazy"; img.decoding = "async"; img.removeAttribute("style");
        if (!img.alt || /\.(jpe?g|png|gif|webp)\s*$/i.test(img.alt)) img.alt = "";
        var a = img.closest("a");
        if (a && a.getAttribute("href") && a.getAttribute("href") !== "/" && a.getAttribute("href") !== "#") { a.appendChild(img); return a; }
        return img;
      });
      car.parentNode.replaceChild(strip(items, { label: "صور " + (document.querySelector(".page-head h1") || {}).textContent }), car);
    });
    // b) rows whose children are only pictures (3 or more) -> free strip on every screen
    $$(".row, .new-row", legacyWrap).forEach(function (row) {
      var kids = Array.prototype.slice.call(row.children);
      if (kids.length < 3) return;
      var only = kids.every(function (k) {
        var img = k.querySelector("img:not(.img-icon)");
        return img && !k.textContent.replace(/[\s ]+/g, "") && k.querySelectorAll("img").length === 1;
      });
      if (!only) return;
      var items = kids.map(function (k) { var img = k.querySelector("img"); img.loading = "lazy"; var a = img.closest("a"); if (a) { a.appendChild(img); return a; } return img; });
      row.parentNode.replaceChild(strip(items, { free: true }), row);
    });
  }

  // ---------- 3. FAQ accordions (Bootstrap 5 markup) ----------
  $$('.legacy [data-bs-toggle="collapse"]').forEach(function (btn) {
    var sel = btn.getAttribute("data-bs-target") || btn.getAttribute("href");
    var panel = sel && document.querySelector(sel);
    if (!panel) return;
    btn.setAttribute("aria-expanded", panel.classList.contains("show") ? "true" : "false");
    btn.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "region");
    if (btn.id) panel.setAttribute("aria-labelledby", btn.id);
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = panel.classList.contains("show");
      var group = panel.getAttribute("data-bs-parent");
      if (!open && group) {
        $$(group + " .accordion-collapse.show").forEach(function (o) {
          if (o === panel) return;
          o.classList.remove("show");
          var b = document.querySelector('[data-bs-target="#' + o.id + '"]'); if (b) b.setAttribute("aria-expanded", "false");
        });
      }
      panel.classList.toggle("show", !open);
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (window.mersalTap) window.mersalTap(6);
      // keep the opened question on screen when the one above it just closed
      if (!open) setTimeout(function () {
        var top = btn.getBoundingClientRect().top;
        if (top < 70) scrollBy({ top: top - 84, behavior: reduce ? "auto" : "smooth" });
      }, 320);
    });
  });
  // open a question linked with #collapseN
  if (location.hash && /^#[\w-]+$/.test(location.hash)) {
    var target = document.querySelector(location.hash + ".accordion-collapse");
    if (target && !target.classList.contains("show")) { var tb = document.querySelector('[data-bs-target="#' + target.id + '"]'); if (tb) tb.click(); }
  }

  // ---------- 4. share bar (icon buttons; the native share sheet on phones) ----------
  var main = document.querySelector("main");
  var title = ((document.querySelector(".page-head h1") || {}).textContent || document.title).trim();
  var ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 0 16.4 8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4h-.5z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.5l4.2 5.8L16.8 3H20l-6.8 7.8L21 21h-4.5l-4.6-6.3L6.3 21H3l7.4-8.5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v12H9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V3h10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  if (legacyWrap && !document.querySelector(".share-bar")) {
    var share = document.createElement("div");
    share.className = "share-bar";
    share.setAttribute("aria-label", "مشاركة الصفحة");
    var url = encodeURIComponent(location.href), txt = encodeURIComponent(title + " - مؤسسة مرسال");
    share.innerHTML = "<span>شارك الصفحة</span>" +
      '<a class="sh-wa" href="https://wa.me/?text=' + txt + "%20" + url + '" target="_blank" rel="noopener" aria-label="مشاركة على واتساب" title="واتساب">' + ICON.wa + "<span>واتساب</span></a>" +
      '<a class="sh-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener" aria-label="مشاركة على فيسبوك" title="فيسبوك">' + ICON.fb + "<span>فيسبوك</span></a>" +
      '<a class="sh-x" href="https://twitter.com/intent/tweet?text=' + txt + "&url=" + url + '" target="_blank" rel="noopener" aria-label="مشاركة على إكس" title="إكس">' + ICON.x + "<span>إكس</span></a>" +
      '<button type="button" class="sh-copy" aria-label="نسخ رابط الصفحة">' + ICON.copy + "<span>نسخ الرابط</span></button>" +
      (navigator.share ? '<button type="button" class="sh-native">' + ICON.share + "<span>مشاركة…</span></button>" : "");
    legacyWrap.parentNode.insertBefore(share, legacyWrap.nextSibling);
    var copyBtn = share.querySelector(".sh-copy"), copyLabel = copyBtn.querySelector("span");
    copyBtn.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(location.href).then(function () {
        copyBtn.classList.add("done"); copyLabel.textContent = "تم النسخ ✓"; if (window.mersalTap) window.mersalTap(8);
        setTimeout(function () { copyBtn.classList.remove("done"); copyLabel.textContent = "نسخ الرابط"; }, 1800);
      });
    });
    var nat = share.querySelector(".sh-native");
    if (nat) nat.addEventListener("click", function () { navigator.share({ title: title + " - مؤسسة مرسال", url: location.href }).catch(function () {}); });
    if (window.mersalReveal) window.mersalReveal([share]); // its buttons follow one another (css .share-bar.reveal > *)
  }

  // ---------- 5. breadcrumbs (if the page did not ship them) + related pages from the menu ----------
  var here = location.pathname;
  Promise.all([fetch("/data/menu.json").then(function (r) { return r.json(); }), fetch("/data/pages.json").then(function (r) { return r.json(); })])
    .then(function (res) {
      var tree = res[0], pages = res[1], parent = null;
      (function walk(items, up) {
        items.forEach(function (it) {
          if (it.href === here) parent = up;
          if (it.children) walk(it.children, it);
        });
      })(tree, null);

      var head = document.querySelector(".page-head .wrap");
      if (head && !head.querySelector(".crumbs")) {
        var crumbs = '<a href="/">الرئيسية</a>';
        if (parent) crumbs += "<span>›</span>" + (parent.href ? '<a href="' + esc(parent.href) + '">' + esc(parent.title) + "</a>" : "<em>" + esc(parent.title) + "</em>");
        crumbs += "<span>›</span><strong>" + esc(title) + "</strong>";
        head.insertAdjacentHTML("afterbegin", '<nav class="crumbs" aria-label="مسار الصفحة">' + crumbs + "</nav>");
      }

      var sibs = (parent ? parent.children : []).filter(function (k) { return k.href !== here && /^\/p\/\d+\.html$/.test(k.href || ""); });
      if (!sibs.length) {
        sibs = Object.keys(pages).filter(function (id) { return "/p/" + id + ".html" !== here && pages[id].photo; })
          .slice(0, 12).map(function (id) { return { href: "/p/" + id + ".html", title: pages[id].title }; });
      }
      sibs = sibs.slice(0, 6);
      if (!sibs.length || !main) return;
      var sec = document.createElement("section");
      sec.className = "related";
      sec.setAttribute("aria-label", "صفحات ذات صلة");
      sec.innerHTML = '<div class="wrap"><div class="section-title"><h2>' + (parent ? esc(parent.title) : "صفحات أخرى") + '</h2></div><div class="grid grid-3">' +
        sibs.map(function (k) {
          var id = (k.href.match(/(\d+)/) || [])[1], pg = pages[id] || {};
          var d = (pg.desc || "").slice(0, 90);
          return '<a class="card" href="' + esc(k.href) + '"><div style="overflow:hidden">' + window.mersalPic(pg.photoSm || pg.photo || "/img/hero.jpg", { alt: "", cls: "media", w: 600, h: 375 }) + "</div>" +
            '<div class="body"><h3>' + esc(k.title) + "</h3><p>" + esc(d) + (d.length >= 90 ? "…" : "") + '</p><span class="more">اقرأ المزيد</span></div></a>';
        }).join("") + "</div></div>";
      var cta = main.querySelector(".cta-band");
      main.insertBefore(sec, cta || null);
      if (window.mersalReveal) window.mersalReveal(sec.querySelectorAll(".card, .section-title"));
    }).catch(function () {});
})();
