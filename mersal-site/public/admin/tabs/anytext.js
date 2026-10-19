// Admin tab "تعديل أي نص": any word on any page. The editor fetches the chosen page, lists every Arabic text it shows
// (text and the title / placeholder / alt / aria-label attributes) and saves "original -> replacement" pairs in
// data/overrides.json (PUT /api/console/data/overrides); js/tweaks.js swaps them on every page, including texts that
// scripts add later. The original is the key: a text that appears on several pages changes everywhere at once.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, data = null, page = "", strings = [], q = "", limit = 80, onlyChanged = false;
  var FIXED = [["/", "الرئيسية"], ["/donate.html", "طرق التبرع"], ["/zakat.html", "حاسبة الزكاة"], ["/contact.html", "تواصل معنا"], ["/afia.html", "كارت عافية"], ["/gift.html", "إهداء التبرع"],
    ["/volunteer.html", "تطوع معنا"], ["/help.html", "طلب مساعدة"], ["/albums.html", "ألبومات الصور"], ["/community.html", "الكوميونيتي"], ["/news.html", "الأخبار"], ["/legacy.html", "الوصية"],
    ["/about.html", "عن مرسال (القديمة)"], ["/privacy.html", "سياسة الخصوصية"], ["/terms.html", "الشروط"], ["/404.html", "صفحة غير موجودة"], ["/offline.html", "من غير إنترنت"]];
  var AR = /[؀-ۿ]/, ATTRS = ["placeholder", "aria-label", "title", "alt"];
  var SKIP = "script,style,noscript,template,textarea,[data-i18n-skip],.site-header nav";
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }

  function pageOptions() {
    var pg = A.pages() || {};
    var imported = Object.keys(pg).map(function (id) { return ["/p/" + id + ".html", pg[id].title]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "ar"); });
    var o = function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === page ? " selected" : "") + ">" + esc(x[1]) + "</option>"; };
    return '<option value="">اختار صفحة…</option><option value="*"' + (page === "*" ? " selected" : "") + '>كل التعديلات المحفوظة</option><optgroup label="صفحات الموقع">' + FIXED.map(o).join("") + "</optgroup>" +
      (imported.length ? '<optgroup label="صفحات المحتوى">' + imported.map(o).join("") + "</optgroup>" : "");
  }
  // every Arabic text the page shows, in page order, each once; a text inside <nav> of the header is the menu (its own tab)
  function extract(html) {
    var doc = new DOMParser().parseFromString(html, "text/html"), out = [], seen = {};
    function add(t, where) { var k = norm(t); if (!k || k.length < 2 || !AR.test(k) || seen[k]) return; seen[k] = 1; out.push({ k: k, where: where }); }
    var t = doc.querySelector("title"); if (t) add(t.textContent, "عنوان التبويب");
    var tw = doc.createTreeWalker(doc.body, 5, null), n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 1) { if (n.closest(SKIP)) continue; ATTRS.forEach(function (a) { var v = n.getAttribute(a); if (v) add(v, a === "placeholder" ? "نص داخل خانة" : a === "alt" ? "وصف صورة" : a === "title" ? "تلميح" : "وصف للقارئ الصوتي"); }); }
      else if (n.nodeType === 3 && !(n.parentNode && n.parentNode.closest && n.parentNode.closest(SKIP))) add(n.nodeValue, "");
    }
    return out;
  }
  function rows() {
    var list = page === "*" ? Object.keys(data.text).map(function (k) { return { k: k, where: "" }; }) : strings;
    var nq = norm(q);
    if (nq) list = list.filter(function (s) { return s.k.indexOf(nq) > -1 || String(data.text[s.k] || "").indexOf(nq) > -1; });
    if (onlyChanged) list = list.filter(function (s) { return data.text[s.k]; });
    return list;
  }
  function render() {
    var list = rows(), shown = list.slice(0, limit), count = Object.keys(data.text).length;
    root.innerHTML =
      '<p class="hint">اختار الصفحة، هتلاقي كل النصوص اللي فيها بالترتيب. اكتب النص الجديد قدام الأصلي وسيبه فاضي عشان يرجع زي ما كان. النص لو موجود في أكتر من صفحة بيتغير فيهم كلهم. القائمة بتتعدل من «القائمة»، والنصوص اللي ليها خانات مخصوصة (الرئيسية، نصوص الموقع، جهات التبرع…) أحسن تتعدل من هناك.' +
        (count ? " <b>" + count + " تعديل محفوظ.</b>" : "") + "</p>" +
      '<div class="at-bar"><div class="field"><label>الصفحة</label><select id="at-page">' + pageOptions() + "</select></div>" +
        '<div class="field"><label>ابحث في النصوص</label><input id="at-q" value="' + esc(q) + '" placeholder="اكتب كلمة من النص"></div>' +
        '<label class="check"><input type="checkbox" id="at-changed"' + (onlyChanged ? " checked" : "") + "> المعدّل بس</label></div>" +
      (page ? '<div class="at-list">' + (shown.length ? shown.map(function (s) {
        var v = data.text[s.k] || "";
        return '<div class="at-row' + (v ? " changed" : "") + '" data-k="' + esc(s.k) + '"><div class="at-orig">' + esc(s.k) + (s.where ? "<small>" + esc(s.where) + "</small>" : "") + "</div>" +
          '<input value="' + esc(v) + '" placeholder="النص الجديد (فاضي = زي ما هو)" maxlength="600">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-clear' + (v ? "" : " hidden") + ">رجّع الأصلي</button></div>";
      }).join("") : '<p class="hint">مفيش نصوص مطابقة.</p>') + "</div>" +
        (list.length > limit ? '<div class="at-more"><button type="button" class="btn btn-ghost" id="at-more">عرض ' + Math.min(80, list.length - limit) + " كمان (من " + list.length + ")</button></div>" : "") : "") +
      '<h2 style="margin-top:18px">نص مش ظاهر في القائمة؟</h2><p class="hint">نصوص بتظهر بعد ضغطة أو من الكود (رسائل، أزرار بتتغير). اكتب الأصلي بالظبط زي ما هو على الموقع.</p>' +
      '<div class="at-row" id="at-free"><input id="at-free-k" placeholder="النص الأصلي" maxlength="600"><input id="at-free-v" placeholder="النص الجديد" maxlength="600"><button type="button" class="btn btn-ghost btn-sm" id="at-free-add">إضافة</button></div>';
  }
  function collect() {
    $$(".at-row[data-k]", root).forEach(function (r) {
      var k = r.dataset.k, v = $("input", r).value;
      if (v.trim()) data.text[k] = v; else delete data.text[k];
    });
  }
  function load(p) {
    page = p; strings = []; limit = 80;
    if (!p || p === "*") { render(); return; }
    root.querySelector(".at-list") && (root.querySelector(".at-list").innerHTML = '<p class="hint">جاري قراءة الصفحة…</p>');
    fetch(p, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("الصفحة مش موجودة"); return r.text(); })
      .then(function (html) { strings = extract(html); render(); })
      .catch(function (e) { A.toast(e.message, true); render(); });
  }

  A.register("anytext", function () {
    root = $("#anytext-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/overrides").then(function (d) {
      data = d && typeof d === "object" ? d : {};
      data.text = data.text && typeof data.text === "object" ? data.text : {};
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("change", function (e) {
      if (e.target.id === "at-page") { collect(); load(e.target.value); }
      if (e.target.id === "at-changed") { collect(); onlyChanged = e.target.checked; render(); }
    });
    root.addEventListener("input", function (e) {
      if (e.target.id === "at-q") { collect(); q = e.target.value; limit = 80; render(); var i = $("#at-q", root); i.focus(); i.setSelectionRange(q.length, q.length); return; }
      var r = e.target.closest(".at-row[data-k]"); if (!r) return;
      var v = e.target.value.trim(); r.classList.toggle("changed", !!v); $("[data-clear]", r).hidden = !v;
    });
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-clear]");
      if (c) { var r = c.closest(".at-row"); $("input", r).value = ""; r.classList.remove("changed"); c.hidden = true; delete data.text[r.dataset.k]; return; }
      if (e.target.id === "at-more") { collect(); limit += 80; render(); return; }
      if (e.target.id === "at-free-add") {
        var k = norm($("#at-free-k", root).value), v = $("#at-free-v", root).value.trim();
        if (!k || !v) return A.toast("اكتب النص الأصلي والجديد", true);
        collect(); data.text[k] = v; if (page !== "*" && !strings.some(function (s) { return s.k === k; })) strings.unshift({ k: k, where: "مضاف يدوياً" });
        render(); A.toast("اتضاف، افتكر تحفظ");
      }
    });
    $("#save-anytext").onclick = function () {
      if (!data) return;
      var b = this; collect();
      var clean = { _note: data._note || "", text: {} };
      Object.keys(data.text).forEach(function (k) { var v = String(data.text[k]).trim(); if (v && norm(k)) clean.text[norm(k)] = v; });
      A.busy(b, true);
      A.api("data/overrides", { method: "PUT", body: { data: clean, message: "admin: text overrides" } })
        .then(function () { data = clean; render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
