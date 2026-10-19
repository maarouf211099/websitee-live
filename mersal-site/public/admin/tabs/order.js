// Admin tab "ترتيب الرئيسية": the order of the home page sections on phones and on desktops, and which ones are
// hidden (data/layout.json -> PUT /api/console/data/layout; the API bakes the order into index.html as CSS, see
// api/src/lib/layout.js). ▲▼ move a section, the checkbox shows / hides it on both.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, data = null;
  var NAMES = {
    slider: "السلايدر (البنرات)", quick: "صندوق «ساهم مع مرسال»", trust: "مربعات «ليه تطمن لمرسال» واللوجوهات", campaigns: "حملات التبرع",
    niyya: "«على نيتك: تحب تبرعك يكون إيه؟»", about: "من نحن", numbers: "مرسال بالأرقام", hospital: "مستشفى مرسال للأطفال", impact: "حاسبة «تبرعك بيعمل إيه»",
    services: "خدمات مرسال", projects: "مشاريع مرسال", ways: "طرق التبرع (الكروت)", partners: "شركاء مرسال", slogan: "آخر الصفحة: الآية و«ابعت فرحة»"
  };
  var IDS = Object.keys(NAMES);
  function full(list) { var out = []; (list || []).forEach(function (id) { if (NAMES[id] && out.indexOf(id) < 0) out.push(id); }); IDS.forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); return out; }
  function col(key, title, icon) {
    var hidden = data.home.hidden || [];
    return '<div class="ord-col" data-col="' + key + '"><h2>' + icon + " " + title + "</h2>" +
      '<ol class="ord-list">' + full(data.home[key]).map(function (id, i) {
        var off = hidden.indexOf(id) > -1;
        return '<li class="ord-item' + (off ? " off" : "") + '" data-id="' + id + '"><span class="ord-n">' + (i + 1) + '</span><span class="ord-name">' + esc(NAMES[id]) + "</span>" +
          '<span class="mini-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button></span></li>';
      }).join("") + "</ol></div>";
  }
  function render() {
    var hidden = data.home.hidden || [];
    root.innerHTML =
      '<p class="hint">حرّك الأقسام بالأسهم ▲▼، لكل جهاز ترتيبه. الأقسام اللي بتشيل علامتها من «الظاهر على الموقع» بتتخفي على الموبايل والكمبيوتر مع بعض. الحفظ بيكتب الترتيب جوه الصفحة نفسها فبيظهر خلال دقيقة من غير ما حاجة تنط.</p>' +
      '<div class="ord-grid">' + col("phone", "على الموبايل", "📱") + col("desktop", "على الكمبيوتر", "🖥️") + "</div>" +
      '<h2>الظاهر على الموقع</h2><div class="ord-show">' + IDS.map(function (id) {
        return '<label class="check"><input type="checkbox" data-show="' + id + '"' + (hidden.indexOf(id) > -1 ? "" : " checked") + "> " + esc(NAMES[id]) + "</label>";
      }).join("") + "</div>";
  }
  A.register("order", function () {
    root = $("#order-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/layout").then(function (d) {
      data = d && typeof d === "object" ? d : {};
      data.home = data.home && typeof data.home === "object" ? data.home : {};
      data.home.phone = full(data.home.phone); data.home.desktop = full(data.home.desktop); data.home.hidden = (data.home.hidden || []).filter(function (id) { return NAMES[id]; });
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b || !data) return;
      var key = b.closest(".ord-col").dataset.col, id = b.closest(".ord-item").dataset.id, list = data.home[key], i = list.indexOf(id);
      if (b.dataset.act === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
      else if (b.dataset.act === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      else return;
      render();
    });
    root.addEventListener("change", function (e) {
      var c = e.target.closest("[data-show]"); if (!c || !data) return;
      var id = c.dataset.show, h = data.home.hidden, i = h.indexOf(id);
      if (c.checked && i > -1) h.splice(i, 1); else if (!c.checked && i < 0) h.push(id);
      if (h.indexOf("slider") > -1 && h.indexOf("quick") > -1) { c.checked = true; h.splice(h.indexOf(id), 1); return A.toast("السلايدر وصندوق التبرع مينفعش يتخفوا مع بعض", true); }
      render();
    });
    $("#save-order").onclick = function () {
      if (!data) return;
      var b = this, clean = { _note: data._note || "", home: { phone: full(data.home.phone), desktop: full(data.home.desktop), hidden: data.home.hidden.slice() } };
      A.busy(b, true);
      A.api("data/layout", { method: "PUT", body: { data: clean, message: "admin: home order" } })
        .then(function () { data = clean; render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
