// Admin tab "أثر التبرع": the impact calculator (js/impact.js) -> PUT /api/console/data/impact -> data/impact.json
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc, fmt = A.fmt;
  var root, cfg = null, loaded = "";
  var ICONS = [["drop", "قطرة (كيماوي)"], ["stethoscope", "سماعة (كشف)"], ["home", "بيت (كفالة)"], ["cart", "عربة (احتياجات)"], ["bed", "سرير (إقامة)"], ["pill", "كبسولة (دواء)"], ["heart", "قلب"], ["baby", "طفل (حضانة)"], ["syringe", "حقنة"], ["hospital", "مستشفى"], ["star", "نجمة"]];
  // same count forms as js/impact.js, so the preview reads exactly like the site
  var FORMS = { "جلسة": ["جلستين", "جلسات"], "كشف": ["كشفين", "كشوفات"], "شهر": ["شهرين", "شهور"], "كارت": ["كارتين", "كروت"], "يوم": ["يومين", "أيام"], "سهم": ["سهمين", "أسهم"], "جرعة": ["جرعتين", "جرعات"], "كفالة": ["كفالتين", "كفالات"], "وجبة": ["وجبتين", "وجبات"], "شنطة": ["شنطتين", "شنط"], "جهاز": ["جهازين", "أجهزة"], "عملية": ["عمليتين", "عمليات"], "أسرة": ["أسرتين", "أسر"], "مريض": ["مريضين", "مرضى"], "طفل": ["طفلين", "أطفال"], "ليلة": ["ليلتين", "ليالي"], "علبة": ["علبتين", "علب"], "حضانة": ["حضانتين", "حضانات"], "متر": ["مترين", "أمتار"], "ساعة": ["ساعتين", "ساعات"] };
  function unitForm(unit, n) {
    var parts = String(unit || "").split("|").map(function (s) { return s.trim(); }), one = parts[0] || "", f = parts.length > 1 ? parts.slice(1) : FORMS[one];
    if (n === 1 || !f) return one; if (n === 2) return f[0] || one; if (n >= 3 && n <= 10) return f[1] || f[0] || one; return one;
  }
  function phrase(tpl, n, unit) { return String(tpl || "{n} {unit}").replace(/\{n\}\s*/g, n >= 3 ? fmt.format(n) + " " : "").replace(/\{unit\}/g, unitForm(unit, n)).replace(/\s+/g, " ").trim(); }
  function preview(it) {
    var a = Number(cfg.default) || 500, price = Number(it.price) || 0;
    if (!price) return "اكتب سعر الوحدة";
    var n = Math.floor(a / price);
    return "بـ " + fmt.format(a) + " ج: " + (n ? phrase(it.text, n, it.unit) : Math.round(a / price * 100) + "% من " + (it.label || "البند"));
  }
  function field(label, html, full) { return '<div class="field' + (full ? " full" : "") + '"><label>' + label + "</label>" + html + "</div>"; }
  function sel(key, list, val) { return '<select data-k="' + key + '">' + list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }

  function render() {
    root.innerHTML =
      '<p class="hint">حاسبة "تبرعك بيعمل إيه": الزائر بيختار مبلغ وبيشوف بيغطي إيه. البنود تحت ثابتة من هنا، وحملات الرئيسية (الوحدة وسعرها من تبويب الرئيسية) بتتضاف تلقائياً لو الخيار مفعّل.</p>' +
      '<div class="site-grid">' +
        field("العنوان", '<input data-c="title" value="' + esc(cfg.title || "") + '">') +
        field("سطر تحت العنوان", '<input data-c="intro" value="' + esc(cfg.intro || "") + '">') +
        field("المبلغ الافتراضي (جنيه)", '<input data-c="default" type="number" min="10" value="' + esc(cfg.default || 500) + '">') +
        field("المبالغ المقترحة (مفصولة بفاصلة)", '<input data-c="presets" dir="ltr" value="' + esc((cfg.presets || []).join(", ")) + '">') +
        field("أقل قيمة في الشريط", '<input data-c="min" type="number" min="10" value="' + esc(cfg.min || 50) + '">') +
        field("أعلى قيمة في الشريط", '<input data-c="max" type="number" min="100" value="' + esc(cfg.max || 10000) + '">') +
        '<label class="field full" style="flex-direction:row;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-c="campaigns"' + (cfg.campaigns !== false ? " checked" : "") + ' style="width:18px;height:18px"> <span>ضيف حملات الرئيسية تلقائياً (كل حملة ليها سعر وحدة ولسه مكتملتش)</span></label>' +
      "</div>" +
      '<h2>البنود</h2><p class="hint">في النص: <code>{n}</code> العدد و<code>{unit}</code> الوحدة بصيغتها الصحيحة (جلسة / جلستين / جلسات…). لو الوحدة مش معروفة اكتبها كده: <code>مفرد|مثنى|جمع</code>. المعاينة تحت كل بند بتتحسب على المبلغ الافتراضي.</p>' +
      '<div class="list" id="impact-items"></div><button type="button" class="btn btn-ghost" id="add-impact">+ إضافة بند</button>';
    renderItems();
  }
  function renderItems() {
    $("#impact-items", root).innerHTML = cfg.items.map(function (it, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        field("اسم البند", '<input data-k="label" value="' + esc(it.label || "") + '" placeholder="مثال: جلسة كيماوي">') +
        field("سعر الوحدة (جنيه)", '<input data-k="price" type="number" min="1" value="' + esc(it.price || "") + '">') +
        field("الوحدة (مفرد)", '<input data-k="unit" value="' + esc(it.unit || "") + '" placeholder="جلسة">') +
        field("الأيقونة", sel("icon", ICONS, it.icon || "heart")) +
        field("النص", '<input data-k="text" value="' + esc(it.text || "{n} {unit}") + '">', true) +
        field("رابط التبرع للبند (اختياري)", '<input data-k="link" dir="ltr" placeholder="/donate.html?for=p31" value="' + esc(it.link || "") + '">', true) +
        '<div class="ic-preview" data-preview>' + esc(preview(it)) + "</div>" +
        '</div><div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button><button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function collect() {
    $$("[data-c]", root).forEach(function (el) {
      var k = el.dataset.c;
      if (k === "campaigns") cfg.campaigns = el.checked;
      else if (k === "presets") cfg.presets = el.value.split(/[,\s،]+/).map(function (v) { return parseInt(v, 10); }).filter(function (v) { return v > 0; });
      else if (k === "default" || k === "min" || k === "max") cfg[k] = Math.max(0, parseInt(el.value, 10) || 0);
      else cfg[k] = el.value.trim();
    });
    $$("#impact-items .item", root).forEach(function (el) {
      var it = cfg.items[+el.dataset.i]; if (!it) return;
      $$("[data-k]", el).forEach(function (i) { it[i.dataset.k] = i.dataset.k === "price" ? Math.max(0, Number(i.value) || 0) : i.value.trim(); });
    });
  }
  function clean() {
    var o = { _note: cfg._note || "", title: cfg.title || "تبرعك بيعمل إيه؟", intro: cfg.intro || "", default: cfg.default || 500, presets: (cfg.presets && cfg.presets.length ? cfg.presets : [100, 250, 500, 1000, 5000]).slice(0, 8), min: cfg.min || 50, max: cfg.max || 10000, campaigns: cfg.campaigns !== false,
      items: cfg.items.filter(function (it) { return it.label && it.price > 0; }).map(function (it) { return { label: it.label, price: it.price, unit: it.unit || "", icon: it.icon || "heart", text: it.text || "{n} {unit}", link: it.link || "" }; }) };
    if (!o._note) delete o._note;
    return o;
  }

  A.register("impact", function () {
    root = $("#impact-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/impact").then(function (c) {
      cfg = c || {}; cfg.items = Array.isArray(cfg.items) ? cfg.items : [];
      loaded = JSON.stringify(clean()); render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    // live preview under each row
    root.addEventListener("input", function (e) {
      var el = e.target.closest("[data-k], [data-c]"); if (!el || !cfg) return;
      collect();
      $$("#impact-items .item", root).forEach(function (row) { var it = cfg.items[+row.dataset.i], p = $("[data-preview]", row); if (it && p) p.textContent = preview(it); });
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-impact"); if (!b || !cfg) return;
      collect();
      if (b.id === "add-impact") { cfg.items.push({ label: "", price: 0, unit: "", icon: "heart", text: "{n} {unit}", link: "" }); renderItems(); var f = $('#impact-items .item:last-child [data-k="label"]', root); if (f) f.focus(); return; }
      var i = +b.closest(".item").dataset.i, act = b.dataset.act, arr = cfg.items;
      if (act === "del") { if (!confirm("حذف البند ده؟")) return; arr.splice(i, 1); }
      else if (act === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (act === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
      else return;
      renderItems();
    });

    $("#save-impact").onclick = function () {
      if (!cfg) return;
      var b = this; collect();
      for (var i = 0; i < cfg.items.length; i++) {
        var it = cfg.items[i];
        if (!it.label && !it.price) continue;
        if (!it.label) return A.toast("البند رقم " + (i + 1) + " من غير اسم", true);
        if (!(it.price > 0)) return A.toast('"' + it.label + '" محتاج سعر وحدة', true);
        if (it.link && !/^(\/|https?:\/\/)/.test(it.link)) return A.toast('رابط "' + it.label + '" مش صحيح', true);
      }
      if (cfg.min && cfg.max && cfg.max <= cfg.min) return A.toast("أعلى قيمة لازم تكون أكبر من أقل قيمة", true);
      var d = clean(), j = JSON.stringify(d);
      if (j === loaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      A.api("data/impact", { method: "PUT", body: { data: d, message: "admin: impact calculator" } })
        .then(function () { cfg = d; cfg.items = d.items; loaded = j; render(); A.published(); })
        .catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
