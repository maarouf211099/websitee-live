// Admin tab "English": the site's English version (js/i18n.js) -> PUT /api/console/data/i18n -> data/i18n-en.json
//   text      Arabic text as it shows on the site -> English (the Arabic must match the page text, spaces aside)
//   pages     English title + summary of each imported page p/<id>.html (the page body itself stays Arabic)
//   patterns  texts with numbers or names (regex) and keys (ids used by the code): edited as JSON under "متقدم"
// The slides, campaigns, projects and numbers also have their own English fields in the "الرئيسية" tab, and the menu
// items in "القائمة"; those win over this dictionary.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, dict = null, loaded = "", q = "", limit = 60;

  function rows() {
    // the unit forms (u:, u1:, un:) are edited in the JSON only
    var keys = Object.keys(dict.text).filter(function (k) { return !/^u[1n]?:/.test(k); });
    var nq = q.trim().toLowerCase();
    if (nq) keys = keys.filter(function (k) { return k.toLowerCase().indexOf(nq) > -1 || String(dict.text[k]).toLowerCase().indexOf(nq) > -1; });
    return keys;
  }
  function renderList() {
    var keys = rows(), shown = keys.slice(0, limit);
    $("#en-list", root).innerHTML = shown.map(function (k) {
      return '<div class="en-row"><div class="en-ar" dir="rtl" lang="ar">' + esc(k) + '</div><textarea rows="1" dir="ltr" lang="en" data-ar="' + esc(k) + '">' + esc(dict.text[k]) + "</textarea>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-del="' + esc(k) + '" title="حذف">✕</button></div>';
    }).join("") || '<p class="hint">مفيش نتايج.</p>';
    $("#en-count", root).textContent = keys.length + " نص" + (keys.length > limit ? " (ظاهر أول " + limit + "، اكتب في البحث عشان توصل للباقي)" : "");
  }
  function renderPages() {
    var pg = dict.pages || {};
    $("#en-pages", root).innerHTML = Object.keys(pg).sort(function (a, b) { return a - b; }).map(function (id) {
      return '<div class="item" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>/p/' + esc(id) + '.html: Title</label><input data-pid="' + esc(id) + '" data-pk="title" dir="ltr" value="' + esc(pg[id].title || "") + '"></div>' +
        '<div class="field full"><label>Summary</label><textarea rows="2" data-pid="' + esc(id) + '" data-pk="desc" dir="ltr">' + esc(pg[id].desc || "") + "</textarea></div></div></div>";
    }).join("");
  }
  function render() {
    root.innerHTML =
      '<p class="hint">النسخة الإنجليزية من الموقع (زرار EN في الهيدر وفي قائمة الموبايل). كل سطر هنا = نص عربي زي ما هو مكتوب في الموقع وترجمته الإنجليزي. ' +
      'لو غيّرت نص عربي في الموقع، ضيف سطر جديد بالنص الجديد وترجمته، وإلا هيفضل يظهر بالعربي في النسخة الإنجليزي. ' +
      'عناوين الحملات والسلايدر والمشاريع والأرقام ليها خانات "English" في تبويب الرئيسية، والقائمة في تبويب القائمة.</p>' +
      '<div class="row"><input type="search" id="en-q" placeholder="ابحث بالعربي أو بالإنجليزي…" value="' + esc(q) + '" style="flex:1"> <span class="hint" id="en-count"></span></div>' +
      '<div class="en-add"><textarea rows="1" id="en-new-ar" dir="rtl" placeholder="النص العربي زي ما هو في الموقع"></textarea><textarea rows="1" id="en-new-en" dir="ltr" placeholder="English"></textarea><button type="button" class="btn btn-ghost btn-sm" id="en-add">+ إضافة</button></div>' +
      '<div id="en-list" class="en-list"></div>' +
      '<h2>الصفحات (عنوان وملخص بالإنجليزي)</h2><p class="hint">محتوى الصفحات نفسه بيفضل عربي، وفوقه ملاحظة إن الصفحة متاحة بالعربي.</p><div class="list" id="en-pages"></div>' +
      '<details class="en-adv"><summary>متقدم: النصوص اللي فيها أرقام (patterns) والمفاتيح (keys)</summary>' +
      '<p class="hint">JSON. كل pattern = [تعبير على النص العربي، الإنجليزي] و$1 = الجزء زي ما هو، {1} = الجزء مترجم.</p>' +
      '<label>patterns</label><textarea id="en-pat" rows="10" dir="ltr" spellcheck="false"></textarea>' +
      '<label>keys</label><textarea id="en-keys" rows="4" dir="ltr" spellcheck="false"></textarea></details>';
    $("#en-pat", root).value = JSON.stringify(dict.patterns || [], null, 1);
    $("#en-keys", root).value = JSON.stringify(dict.keys || {}, null, 1);
    renderList(); renderPages();
  }
  function collect() {
    $$("#en-list textarea[data-ar]", root).forEach(function (t) { dict.text[t.getAttribute("data-ar")] = t.value.trim(); });
    $$("[data-pid]", root).forEach(function (el) { var p = dict.pages[el.dataset.pid]; if (p) p[el.dataset.pk] = el.value.trim(); });
    var pat = $("#en-pat", root), keys = $("#en-keys", root);
    if (pat) { try { var pv = JSON.parse(pat.value || "[]"); if (!Array.isArray(pv)) throw 0; dict.patterns = pv; } catch (e) { throw new Error("patterns: JSON مش صحيح"); } }
    if (keys) { try { var kv = JSON.parse(keys.value || "{}"); if (!kv || typeof kv !== "object" || Array.isArray(kv)) throw 0; dict.keys = kv; } catch (e) { throw new Error("keys: JSON مش صحيح"); } }
  }

  A.register("english", function () {
    root = $("#english-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/i18n").then(function (d) {
      dict = d || {}; dict.text = dict.text || {}; dict.pages = dict.pages || {}; dict.patterns = dict.patterns || []; dict.keys = dict.keys || {};
      loaded = JSON.stringify(dict); render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("input", function (e) {
      if (e.target.id !== "en-q") return;
      try { collect(); } catch (x) {}
      q = e.target.value; limit = 60; renderList();
    });
    root.addEventListener("click", function (e) {
      if (!dict) return;
      var del = e.target.closest("[data-del]");
      if (del) { try { collect(); } catch (x) {} delete dict.text[del.getAttribute("data-del")]; renderList(); return; }
      if (e.target.id === "en-add") {
        var ar = $("#en-new-ar", root).value.replace(/\s+/g, " ").trim(), en = $("#en-new-en", root).value.trim();
        if (!ar || !en) return A.toast("اكتب النص العربي والإنجليزي", true);
        try { collect(); } catch (x) {}
        dict.text[ar] = en; q = ar; render(); A.toast("اتضاف، دوس حفظ ونشر");
      }
    });
    $("#save-english").onclick = function () {
      if (!dict) return;
      var b = this;
      try { collect(); } catch (x) { return A.toast(x.message, true); }
      Object.keys(dict.text).forEach(function (k) { if (!dict.text[k]) delete dict.text[k]; });
      var j = JSON.stringify(dict);
      if (j === loaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      A.api("data/i18n", { method: "PUT", body: { data: dict, message: "admin: English texts" } })
        .then(function () { loaded = j; A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
