// Admin tab "الكوميونيتي": donor gifts page (/community.html) -> PUT /api/console/data/community -> data/community.json
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, cfg = null, loaded = "";
  var ICONS = [["certificate", "شهادة"], ["share", "مشاركة"], ["impact", "أثر"], ["group", "جروب"], ["volunteer", "قلب"], ["monthly", "تقويم"]];
  var ACTIONS = [
    ["certificate", "شهادة شكر (بتتعمل تلقائياً)"], ["share", "كارت ابعت فرحة (بيتعمل تلقائياً)"], ["impact", "الحملة اللي دعمها المتبرع"],
    ["whatsapp", "جروب الواتساب (الرابط تحت)"], ["events", "رابط الفعاليات (الرابط تحت)"], ["link", "رابط حر"]
  ];
  function sel(key, list, val) { return "<select data-k=\"" + key + "\">" + list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }
  function field(label, html, full) { return '<div class="field' + (full ? " full" : "") + '"><label>' + label + "</label>" + html + "</div>"; }

  function render() {
    root.innerHTML =
      '<p class="hint">الصفحة بتظهر في شريط الموبايل باسم "هداياك" بس للزوار اللي اتبرعوا من الموقع على نفس الجهاز، وفيها شهادة شكر وكارت مشاركة وهدايا المتبرعين.</p>' +
      '<div class="site-grid">' +
        field("نص المقدمة", '<textarea data-c="intro" rows="2">' + esc(cfg.intro || "") + "</textarea>", true) +
        field("رابط جروب الواتساب للمتبرعين (فاضي = الهدية بتظهر \"قريباً\")", '<input data-c="whatsappGroup" dir="ltr" placeholder="https://chat.whatsapp.com/…" value="' + esc(cfg.whatsappGroup || "") + '">', true) +
        field("رابط الفعاليات (اختياري)", '<input data-c="eventsLink" dir="ltr" placeholder="https://…" value="' + esc(cfg.eventsLink || "") + '">', true) +
      "</div>" +
      '<h2>الهدايا</h2><p class="hint">الترتيب هنا هو ترتيب الكروت في الصفحة.</p>' +
      '<div class="list" id="gifts"></div><button type="button" class="btn btn-ghost" id="add-gift">+ إضافة هدية</button>';
    renderGifts();
  }
  function renderGifts() {
    $("#gifts", root).innerHTML = cfg.gifts.map(function (g, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        field("العنوان", '<input data-k="title" value="' + esc(g.title || "") + '">') +
        field("الأيقونة", sel("icon", ICONS, g.icon || "certificate")) +
        field("الوصف", '<input data-k="text" value="' + esc(g.text || "") + '">', true) +
        field("لما المتبرع يضغط", sel("action", ACTIONS, g.action || "link")) +
        field("الرابط (لو \"رابط حر\")", '<input data-k="link" dir="ltr" placeholder="/volunteer.html أو https://…" value="' + esc(g.link || "") + '">') +
        '</div><div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down">▼</button><button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function collect() {
    $$("[data-c]", root).forEach(function (el) { cfg[el.dataset.c] = el.value.trim(); });
    $$("#gifts .item", root).forEach(function (it) { var g = cfg.gifts[+it.dataset.i]; if (g) $$("[data-k]", it).forEach(function (i) { g[i.dataset.k] = i.value.trim(); }); });
  }
  function clean() {
    return {
      title: cfg.title || "مرسال كوميونيتي", intro: cfg.intro || "", whatsappGroup: cfg.whatsappGroup || "", eventsLink: cfg.eventsLink || "",
      gifts: cfg.gifts.filter(function (g) { return g.title; }).map(function (g) {
        var o = { icon: g.icon || "certificate", title: g.title, text: g.text || "", action: g.action || "link" };
        if (o.action === "link") o.link = g.link || "/";
        return o;
      })
    };
  }

  A.register("community", function () {
    root = $("#community-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/community").then(function (c) {
      cfg = c || {}; cfg.gifts = cfg.gifts || [];
      loaded = JSON.stringify(clean()); render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-gift"); if (!b || !cfg) return;
      collect();
      if (b.id === "add-gift") { cfg.gifts.push({ icon: "certificate", title: "", text: "", action: "link", link: "" }); renderGifts(); return; }
      var i = +b.closest(".item").dataset.i, act = b.dataset.act, arr = cfg.gifts;
      if (act === "del") { if (!confirm("حذف الهدية دي؟")) return; arr.splice(i, 1); }
      else if (act === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (act === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
      else return;
      renderGifts();
    });

    $("#save-community").onclick = function () {
      if (!cfg) return;
      var b = this; collect();
      var d = clean(), j = JSON.stringify(d);
      if (j === loaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      A.api("data/community", { method: "PUT", body: { data: d, message: "admin: community gifts" } })
        .then(function () { cfg = d; loaded = j; render(); A.published(); })
        .catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
