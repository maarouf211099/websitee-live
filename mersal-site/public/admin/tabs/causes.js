// Admin tab "جهات التبرع": the زكاة مال / صدقة جارية causes of the donate page's first step (data/causes.json).
// Saves through PUT /api/console/data/causes; js/donate.js builds the segment, the cause cards and the purpose lists
// (card, transfer and pickup) from that file on every visit. A cause's id is fixed: it is what gets recorded with each
// donation (the donations tab and the requests show the title it maps to), so renaming a cause keeps its history.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc, icons = window.MersalCauseIcons;
  var root, data = null;
  var GROUPS = [["zakat", "زكاة مال"], ["sadaqa", "صدقة جارية"]];

  function newId() { return "c" + Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 1296).toString(36); }
  function okHref(h) { return !h || /^(\/|#|https?:\/\/)/.test(h); }
  function pageOptions() {
    var pg = A.pages() || {};
    var imported = Object.keys(pg).map(function (id) { return ["/p/" + id + ".html", pg[id].title]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "ar"); });
    return '<option value="">من غير صفحة</option>' + imported.map(function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + "</option>"; }).join("");
  }
  function iconOptions(cur) {
    return icons.names.map(function (n) { return '<option value="' + n + '"' + (n === cur ? " selected" : "") + ">" + esc(icons.label(n)) + "</option>"; }).join("");
  }
  function group(id) { return data.groups.filter(function (g) { return g.id === id; })[0]; }

  function render() {
    var opts = pageOptions();
    root.innerHTML =
      '<p class="hint">أول خطوة في صفحة طرق التبرع: المتبرع بيختار نيته (تبرع عام / زكاة مال / صدقة جارية) وبعدها جهة التبرع من الكروت دي. الترتيب بالأسهم ▲▼، و«مخفي» بيشيل الجهة من الموقع من غير ما يمسحها. اللي بيتسجل مع التبرع هو اسم الجهة.</p>' +
      '<div class="site-grid"><div class="field full"><label>السطر تحت «تبرع عام»</label><input data-note value="' + esc(data.note || "") + '" placeholder="تبرعك بيروح للمكان اللي محتاجه أكتر."></div></div>' +
      GROUPS.map(function (G) {
        var g = group(G[0]), list = data.causes.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return x.c.group === G[0]; });
        return '<h2>' + esc(G[1]) + '</h2>' +
          '<div class="site-grid" data-g="' + G[0] + '">' +
            '<div class="field"><label>اسم المجموعة على الزرار</label><input data-gk="title" maxlength="30" value="' + esc(g.title || G[1]) + '"></div>' +
            '<div class="field"><label>English</label><input data-gk="en" dir="ltr" lang="en" maxlength="40" value="' + esc(g.en || "") + '"></div>' +
            '<div class="field"><label>تلميح فوق الكروت (مثال: اختار مصرف الزكاة)</label><input data-gk="hint" maxlength="80" value="' + esc(g.hint || "") + '"></div>' +
            '<div class="field full"><label>السطر اللي بيظهر لما المتبرع يختار المجموعة</label><input data-gk="note" maxlength="220" value="' + esc(g.note || "") + '"></div>' +
          "</div>" +
          '<div class="list" style="margin-top:10px">' + list.map(function (x) {
            var c = x.c;
            return '<div class="menu-item cause-row' + (c.on === false ? " off" : "") + '" data-i="' + x.i + '">' +
              '<div class="cause-head"><span class="c-prev" aria-hidden="true">' + icons.svg(c.icon) + "</span>" +
                '<div class="field"><label>الاسم</label><input data-k="title" maxlength="60" value="' + esc(c.title || "") + '"></div>' +
                '<div class="field"><label>English</label><input data-k="en" dir="ltr" lang="en" maxlength="60" value="' + esc(c.en || "") + '"></div>' +
                '<div class="field"><label>الأيقونة</label><select data-k="icon">' + iconOptions(c.icon) + "</select></div>" +
              "</div>" +
              '<div class="cause-body">' +
                '<div class="field"><label>سطر صغير تحت الاسم (اختياري)</label><input data-k="desc" maxlength="90" value="' + esc(c.desc || "") + '"></div>' +
                '<div class="field"><label>صفحة المشروع (اختياري: التبرع بيتحسب على حملتها)</label><div class="href-pick"><select data-pick aria-label="اختيار صفحة">' + opts + '</select><input data-k="link" dir="ltr" value="' + esc(c.link || "") + '" placeholder="/p/30.html"></div></div>' +
              "</div>" +
              '<div class="mini-actions"><label class="check"><input type="checkbox" data-k="on"' + (c.on === false ? "" : " checked") + "> ظاهر على الموقع</label>" +
                '<button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button>' +
                '<button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button><code class="c-id" dir="ltr" title="الكود اللي بيتسجل مع التبرع">' + esc(c.id) + "</code></div>" +
            "</div>";
          }).join("") + "</div>" +
          '<div class="row"><button type="button" class="btn btn-ghost" data-add="' + G[0] + '">+ إضافة جهة في ' + esc(G[1]) + "</button></div>";
      }).join("");
    // the page picker sets the link box; the icon picker updates its preview
    $$("select[data-pick]", root).forEach(function (s) { var inp = s.parentNode.querySelector('[data-k="link"]'); s.value = inp.value; if (s.value !== inp.value) s.value = ""; });
  }
  function collect() {
    data.note = ($("[data-note]", root).value || "").trim();
    $$(".site-grid[data-g]", root).forEach(function (el) {
      var g = group(el.dataset.g); if (!g) return;
      ["title", "en", "hint", "note"].forEach(function (k) { g[k] = $('[data-gk="' + k + '"]', el).value.trim(); });
    });
    $$(".cause-row", root).forEach(function (el) {
      var c = data.causes[+el.dataset.i]; if (!c) return;
      ["title", "en", "desc", "link"].forEach(function (k) { c[k] = $('[data-k="' + k + '"]', el).value.trim(); });
      c.icon = $('[data-k="icon"]', el).value;
      c.on = $('[data-k="on"]', el).checked;
    });
  }

  A.register("causes", function () {
    root = $("#causes-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/causes").then(function (d) {
      data = d && typeof d === "object" ? d : {};
      data.causes = Array.isArray(data.causes) ? data.causes : [];
      data.groups = Array.isArray(data.groups) ? data.groups : [];
      GROUPS.forEach(function (G) { if (!group(G[0])) data.groups.push({ id: G[0], title: G[1], en: "", icon: G[0], note: "", hint: "" }); });
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], [data-add]"); if (!b || !data) return;
      collect();
      if (b.dataset.add) { data.causes.push({ id: newId(), group: b.dataset.add, title: "", en: "", desc: "", icon: b.dataset.add === "zakat" ? "heart" : "hospital", link: "", on: true }); render(); var last = $$(".cause-row", root).pop(); if (last) $('[data-k="title"]', last).focus(); return; }
      var row = b.closest(".cause-row"), i = +row.dataset.i, c = data.causes[i], act = b.dataset.act;
      // up / down move within the same group only
      var sib = data.causes.map(function (x, k) { return x.group === c.group ? k : -1; }).filter(function (k) { return k >= 0; }), pos = sib.indexOf(i);
      if (act === "del") { if (c.title && !confirm("حذف «" + c.title + "»؟ (لو عايز تشيلها من الموقع بس، شيل علامة «ظاهر على الموقع»)")) return; data.causes.splice(i, 1); }
      else if (act === "up" && pos > 0) { data.causes.splice(i, 1); data.causes.splice(sib[pos - 1], 0, c); }
      else if (act === "down" && pos < sib.length - 1) { data.causes.splice(i, 1); data.causes.splice(sib[pos + 1], 0, c); }
      else return;
      render();
    });
    root.addEventListener("change", function (e) {
      var s = e.target.closest("select[data-pick]");
      if (s) { s.parentNode.querySelector('[data-k="link"]').value = s.value; return; }
      var ic = e.target.closest('select[data-k="icon"]');
      if (ic) ic.closest(".cause-row").querySelector(".c-prev").innerHTML = icons.svg(ic.value);
      var on = e.target.closest('[data-k="on"]');
      if (on) on.closest(".cause-row").classList.toggle("off", !on.checked);
    });
    $("#save-causes").onclick = function () {
      if (!data) return;
      var b = this; collect();
      for (var i = 0; i < data.causes.length; i++) {
        var c = data.causes[i];
        if (!c.title) return A.toast("في جهة من غير اسم", true);
        if (!okHref(c.link)) return A.toast('رابط «' + c.title + '» مش صحيح (يبدأ بـ / أو https://)', true);
        if (!icons.has(c.icon)) c.icon = "heart";
      }
      var clean = {
        note: data.note || "",
        groups: data.groups.map(function (g) { return { id: g.id, title: g.title || "", en: g.en || "", icon: g.icon || g.id, note: g.note || "", hint: g.hint || "" }; }),
        causes: data.causes.map(function (c) { return { id: c.id, group: c.group, title: c.title, en: c.en || "", desc: c.desc || "", icon: c.icon, link: c.link || "", on: c.on !== false }; })
      };
      A.busy(b, true);
      A.api("data/causes", { method: "PUT", body: { data: clean, message: "admin: causes" } })
        .then(function () { data = clean; render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
