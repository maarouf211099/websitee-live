// Admin tab "القائمة": nested editor for /data/menu.json (top-level items + one level of links).
// Saves through PUT /api/console/data/menu; js/layout.js builds the header menu from that file on every page.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, tree = null;
  var FIXED = [["/", "الرئيسية"], ["/p/3.html", "عن مرسال"], ["/donate.html", "طرق التبرع"], ["/zakat.html", "حاسبة الزكاة"], ["/contact.html", "تواصل معنا"],
    ["/afia.html", "كارت عافية"], ["/albums.html", "ألبومات الصور"], ["/volunteer.html", "تطوع معنا"], ["/help.html", "طلب مساعدة"]];

  function options() {
    var pg = A.pages() || {}, o = function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + "</option>"; };
    var imported = Object.keys(pg).map(function (id) { return ["/p/" + id + ".html", pg[id].title]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "ar"); });
    return '<option value="">اختار صفحة…</option><optgroup label="صفحات الموقع">' + FIXED.map(o).join("") + "</optgroup>" +
      (imported.length ? '<optgroup label="صفحات المحتوى">' + imported.map(o).join("") + "</optgroup>" : "");
  }
  function hrefField(href, opts, label) {
    return '<div class="field"><label>' + label + '</label><div class="href-pick"><select data-pick aria-label="اختيار صفحة">' + opts + "</select>" +
      '<input data-k="href" dir="ltr" value="' + esc(href || "") + '" placeholder="/p/30.html أو https://…"></div></div>';
  }
  function actions(extra) {
    return '<div class="mini-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button>' +
      '<button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button>' + (extra || "") + "</div>";
  }
  function render() {
    var opts = options();
    root.innerHTML =
      '<p class="hint">قائمة الهيدر في كل صفحات الموقع. العنصر الرئيسي ممكن يكون رابط مباشر، أو مجموعة (من غير رابط) تحتها روابط فرعية. الترتيب بالأسهم ▲▼.</p>' +
      '<div class="list" id="menu-list">' + (tree || []).map(function (it, i) {
        return '<div class="menu-item" data-i="' + i + '">' +
          '<div class="menu-head"><div class="field"><label>العنصر الرئيسي</label><input data-k="title" value="' + esc(it.title || "") + '" placeholder="مثال: مشاريع مرسال"></div>' +
            hrefField(it.href, opts, "رابطه (اختياري لو مجموعة)") + actions() + "</div>" +
          '<div class="menu-subs">' + (it.children || []).map(function (k, j) {
            return '<div class="menu-sub" data-j="' + j + '"><div class="field"><label>رابط فرعي</label><input data-k="title" value="' + esc(k.title || "") + '"></div>' +
              hrefField(k.href, opts, "الرابط") + actions() + "</div>";
          }).join("") + '<div><button type="button" class="btn btn-ghost btn-sm" data-act="addsub">+ رابط فرعي</button></div></div>' +
        "</div>";
      }).join("") + "</div>" +
      '<div class="row"><button type="button" class="btn btn-ghost" id="add-top">+ إضافة عنصر رئيسي</button></div>';
  }
  // read the inputs back into the tree (before any change or save)
  function collect() {
    $$(".menu-item", root).forEach(function (el) {
      var it = tree[+el.dataset.i]; if (!it) return;
      it.title = $('.menu-head [data-k="title"]', el).value.trim();
      it.href = $('.menu-head [data-k="href"]', el).value.trim() || null;
      it.children = $$(".menu-sub", el).map(function (s) { return { title: $('[data-k="title"]', s).value.trim(), href: $('[data-k="href"]', s).value.trim() }; });
    });
  }
  function okHref(h) { return !h || /^(\/|#|https?:\/\/|tel:|mailto:)/.test(h); }

  A.register("menu", function () {
    root = $("#menu-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/menu").then(function (t) { tree = Array.isArray(t) ? t : []; render(); }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-top"); if (!b || !tree) return;
      collect();
      if (b.id === "add-top") { tree.push({ title: "", href: null, children: [] }); render(); return; }
      var item = b.closest(".menu-item"), i = +item.dataset.i, sub = b.closest(".menu-sub"), act = b.dataset.act;
      var arr = sub ? tree[i].children : tree, idx = sub ? +sub.dataset.j : i;
      if (act === "addsub") (tree[i].children = tree[i].children || []).push({ title: "", href: "" });
      else if (act === "del") { if (!sub && (tree[i].children || []).length && !confirm("حذف العنصر وكل الروابط اللي تحته؟")) return; arr.splice(idx, 1); }
      else if (act === "up" && idx > 0) arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]);
      else if (act === "down" && idx < arr.length - 1) arr.splice(idx + 1, 0, arr.splice(idx, 1)[0]);
      else return;
      render();
    });
    // page picker fills the href box (and the title, when it is still empty)
    root.addEventListener("change", function (e) {
      var s = e.target.closest("select[data-pick]"); if (!s || !s.value) return;
      s.parentNode.querySelector('[data-k="href"]').value = s.value;
      var title = s.closest(".menu-sub, .menu-head").querySelector('[data-k="title"]');
      if (!title.value.trim()) title.value = s.options[s.selectedIndex].textContent;
      s.value = "";
    });
    $("#save-menu").onclick = function () {
      if (!tree) return;
      var b = this; collect();
      for (var i = 0; i < tree.length; i++) {
        var it = tree[i];
        if (!it.title) return A.toast("العنصر رقم " + (i + 1) + " من غير اسم", true);
        if (!it.href && !(it.children || []).some(function (k) { return k.title && k.href; })) return A.toast('"' + it.title + '" لازم يكون له رابط أو روابط فرعية', true);
        if (!okHref(it.href)) return A.toast('رابط "' + it.title + '" مش صحيح', true);
        for (var j = 0; j < (it.children || []).length; j++) { var k = it.children[j]; if ((k.title || k.href) && (!k.title || !k.href || !okHref(k.href))) return A.toast('رابط فرعي تحت "' + it.title + '" ناقص الاسم أو الرابط', true); }
      }
      var clean = tree.map(function (it) {
        var kids = (it.children || []).filter(function (k) { return k.title && k.href; }), o = { title: it.title, href: it.href || null };
        if (kids.length) o.children = kids; return o;
      });
      A.busy(b, true);
      A.api("data/menu", { method: "PUT", body: { data: clean, message: "admin: menu" } })
        .then(function () { tree = clean; render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
