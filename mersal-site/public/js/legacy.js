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
})();
