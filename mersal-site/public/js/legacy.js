// Behaviour for imported old-site pages: Bootstrap-style accordions (FAQ).
(function () {
  document.querySelectorAll('.legacy [data-bs-toggle="collapse"]').forEach(function (btn) {
    var sel = btn.getAttribute("data-bs-target") || btn.getAttribute("href");
    var panel = sel && document.querySelector(sel);
    if (!panel) return;
    btn.setAttribute("aria-expanded", panel.classList.contains("show") ? "true" : "false");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = panel.classList.contains("show");
      var group = panel.getAttribute("data-bs-parent");
      if (!open && group) {
        document.querySelectorAll(group + " .accordion-collapse.show").forEach(function (o) {
          if (o === panel) return;
          o.classList.remove("show");
          var b = document.querySelector('[data-bs-target="#' + o.id + '"]'); if (b) b.setAttribute("aria-expanded", "false");
        });
      }
      panel.classList.toggle("show", !open);
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  // Old image carousels: rotate the slides every 5 seconds
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".legacy .carousel-inner").forEach(function (inner) {
    var items = inner.querySelectorAll(".item");
    if (items.length < 2 || reduce) return;
    var i = Array.prototype.findIndex.call(items, function (x) { return x.classList.contains("active"); });
    if (i < 0) { i = 0; items[0].classList.add("active"); }
    setInterval(function () { items[i].classList.remove("active"); i = (i + 1) % items.length; items[i].classList.add("active"); }, 5000);
  });

  // Donate links inside a project page pre-select that project on the donate page
  var pid = (/^\/p\/(\d+)\.html$/.exec(location.pathname) || [])[1];
  if (pid) document.querySelectorAll('main a[href^="/donate.html"]').forEach(function (a) { a.href = "/donate.html?for=p" + pid + "#online"; });

  // Breadcrumbs, share buttons and related pages (from the imported menu)
  var here = location.pathname;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  var main = document.querySelector("main");
  var title = (document.querySelector(".page-head h1") || {}).textContent || document.title;

  var share = document.createElement("div");
  share.className = "share-bar wrap";
  var url = encodeURIComponent(location.href), txt = encodeURIComponent(title + " - مؤسسة مرسال");
  share.innerHTML = '<span>شارك الصفحة:</span>' +
    '<a class="sh-wa" href="https://wa.me/?text=' + txt + "%20" + url + '" target="_blank" rel="noopener" aria-label="مشاركة على واتساب">واتساب</a>' +
    '<a class="sh-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener" aria-label="مشاركة على فيسبوك">فيسبوك</a>' +
    '<button type="button" class="sh-copy">نسخ الرابط</button>';
  var legacyWrap = document.querySelector(".legacy");
  if (legacyWrap) legacyWrap.parentNode.insertBefore(share, legacyWrap.nextSibling);
  share.querySelector(".sh-copy").addEventListener("click", function (e) {
    var b = e.currentTarget;
    navigator.clipboard && navigator.clipboard.writeText(location.href).then(function () { b.textContent = "تم النسخ ✓"; setTimeout(function () { b.textContent = "نسخ الرابط"; }, 1500); });
  });

  Promise.all([fetch("/data/menu.json").then(function (r) { return r.json(); }), fetch("/data/pages.json").then(function (r) { return r.json(); })])
    .then(function (res) {
      var tree = res[0], pages = res[1], parent = null, self = null;
      (function walk(items, up) {
        items.forEach(function (it) {
          if (it.href === here) { self = it; parent = up; }
          if (it.children) walk(it.children, it);
        });
      })(tree, null);

      var crumbs = '<a href="/">الرئيسية</a>';
      if (parent) crumbs += "<span>›</span>" + (parent.href ? '<a href="' + esc(parent.href) + '">' + esc(parent.title) + "</a>" : "<em>" + esc(parent.title) + "</em>");
      crumbs += "<span>›</span><strong>" + esc(title) + "</strong>";
      var head = document.querySelector(".page-head .wrap");
      if (head) head.insertAdjacentHTML("afterbegin", '<nav class="crumbs" aria-label="مسار الصفحة">' + crumbs + "</nav>");

      var sibs = (parent ? parent.children : []).filter(function (k) { return k.href !== here && /^\/p\/\d+\.html$/.test(k.href || ""); });
      if (!sibs.length) {
        sibs = Object.keys(pages).filter(function (id) { return "/p/" + id + ".html" !== here && pages[id].photo; })
          .slice(0, 12).map(function (id) { return { href: "/p/" + id + ".html", title: pages[id].title }; });
      }
      sibs = sibs.slice(0, 6);
      if (!sibs.length || !main) return;
      var sec = document.createElement("section");
      sec.className = "related";
      sec.innerHTML = '<div class="wrap"><div class="section-title"><h2>' + (parent ? esc(parent.title) : "صفحات أخرى") + '</h2></div><div class="grid grid-3">' +
        sibs.map(function (k) {
          var id = (k.href.match(/(\d+)/) || [])[1], pg = pages[id] || {};
          return '<a class="card" href="' + esc(k.href) + '"><div style="overflow:hidden"><div class="media" style="background-image:url(\'' + esc(pg.photo || "/img/hero.jpg") + '\')"></div></div>' +
            '<div class="body"><h3>' + esc(k.title) + "</h3><p>" + esc((pg.desc || "").slice(0, 90)) + "…</p></div></a>";
        }).join("") + "</div></div>";
      var cta = main.querySelector(".cta-band");
      main.insertBefore(sec, cta || null);
      if (window.mersalReveal) window.mersalReveal(sec.querySelectorAll(".card, .section-title"));
    }).catch(function () {});
})();
