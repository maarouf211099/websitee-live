// "عن مرسال" (p/3.html): the hub under the article. Everything comes from the console's data, so the page keeps up
// without editing it: the numbers (content.json, tab الرئيسية), then one card grid per menu group (data/menu.json:
// مشاريع مرسال / خدمات مرسال / مشاريع الاستدامة) with each page's photo and summary (data/pages.json).
(function () {
  var root = document.getElementById("about-hub");
  if (!root) return;
  var EN = document.documentElement.lang === "en";
  var fmt = new Intl.NumberFormat("en-US");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  // the imported summaries start with the page's own title: "مستشفى مرسال للأطفال حرصاً من..." -> "حرصاً من..."
  function summary(p, title) {
    var d = String((EN && p.desc_en) || p.desc || "").replace(/\s+/g, " ").trim();
    if (title && d.indexOf(title) === 0) d = d.slice(title.length).replace(/^[\s:،,.-]+/, "");
    d = d.replace(/\s+\S*$/, ""); // the import cut mid-word
    return d.length > 120 ? d.slice(0, 120).replace(/\s+\S*$/, "") + "…" : d;
  }
  var GROUPS = [
    { title: "مشاريع مرسال", en: "Mersal projects", eyebrow: "اللي بنبنيه", sub: "مستشفيات ومراكز وبرامج بتخدم آلاف المرضى" },
    { title: "خدمات مرسال", en: "Mersal services", eyebrow: "اللي بنقدمه كل يوم", sub: "خدمات طبية لغير القادرين، من الكشف لحد العملية" },
    { title: "مشاريع الاستدامة", en: "Sustainability projects", eyebrow: "عشان نستمر", sub: "مشاريع أرباحها بترجع لعلاج المرضى" }
  ];
  Promise.all([
    fetch("/data/menu.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/pages.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("/content.json").then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (res) {
    var menu = Array.isArray(res[0]) ? res[0] : [], pages = res[1] || {}, nums = (res[2] || {}).numbers || [];
    var html = "";
    if (nums.length) {
      html += '<section class="ah-nums" aria-label="مرسال بالأرقام"><div class="wrap"><ul role="list">' + nums.slice(0, 4).map(function (n) {
        var inner = '<b>' + esc(n.prefix || "") + fmt.format(+n.value || 0) + "</b><span>" + esc((EN && n.label_en) || n.label) + "</span>";
        return "<li>" + (n.link ? '<a href="' + esc(n.link) + '">' + inner + "</a>" : inner) + "</li>";
      }).join("") + "</ul></div></section>";
    }
    GROUPS.forEach(function (g) {
      var top = menu.filter(function (t) { return t && String(t.title || "").trim() === g.title; })[0];
      var kids = (top && top.children || []).filter(function (k) { return /^\/p\/\d+\.html$/.test(k.href || ""); });
      if (!kids.length) return;
      html += '<section class="ah-group"><div class="wrap"><div class="section-title"><span class="eyebrow">' + esc(g.eyebrow) + "</span><h2>" + esc(EN && top.title_en ? top.title_en : (EN ? g.en : top.title)) + "</h2><p>" + esc(g.sub) + "</p></div>" +
        '<div class="ah-grid">' + kids.map(function (k) {
          var id = /\/p\/(\d+)\.html/.exec(k.href)[1], p = pages[id] || {}, title = (EN && k.title_en) || k.title || p.title || "";
          var img = p.photoSm || p.photo;
          return '<a class="ah-card" href="' + esc(k.href) + '">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="600" height="400">' : '<span class="ah-noimg" aria-hidden="true"></span>') +
            "<span class=\"ah-body\"><b>" + esc(title) + "</b>" + (summary(p, p.title) ? "<small>" + esc(summary(p, p.title)) + "</small>" : "") + '<i>التفاصيل ←</i></span></a>';
        }).join("") + "</div></div></section>";
    });
    root.innerHTML = html;
    if (window.mersalReveal) window.mersalReveal(root.querySelectorAll(".ah-nums, .ah-card"));
  });
})();
