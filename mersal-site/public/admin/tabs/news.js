// Admin tab "الأخبار": /news.html + the home strip -> PUT /api/console/data/news -> data/news.json
// Array order = display order (the first 6 are the home strip); "ترتيب حسب التاريخ" sorts newest first.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, items = null, loaded = "";
  var TAGS = ["خبر", "قصة نجاح", "فعالية"];
  function today() { return new Date().toISOString().slice(0, 10); }
  function uid() { return today() + "-" + Math.random().toString(36).slice(2, 7); }
  function field(label, html, full) { return '<div class="field' + (full ? " full" : "") + '"><label>' + label + "</label>" + html + "</div>"; }
  function tagSel(v) {
    var list = TAGS.slice(); if (v && list.indexOf(v) < 0) list.push(v);
    return '<select data-k="tag">' + list.map(function (t) { return '<option value="' + esc(t) + '"' + (t === v ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>";
  }
  function okHref(h) { return !h || /^(\/|https?:\/\/|#|tel:|mailto:)/.test(h); }

  function render() {
    root.innerHTML =
      '<p class="hint">الأخبار وقصص النجاح والفعاليات بتظهر في صفحة <a href="/news.html" target="_blank" rel="noopener">أخبار وقصص مرسال</a>، وأول 6 منها في شريط الرئيسية. الصورة 1200×750 تقريباً (بتتصغّر على جهازك قبل الرفع). خلّي القصص عامة من غير أسماء المرضى.</p>' +
      '<div class="row"><button type="button" class="btn btn-ghost" id="add-news">+ خبر جديد</button><button type="button" class="btn btn-ghost" id="sort-news">ترتيب حسب التاريخ (الأحدث الأول)</button><span class="hint" style="margin:0">الترتيب هنا هو ترتيب الظهور.</span></div>' +
      '<div class="list" id="news-list"></div>';
    renderList();
  }
  function renderList() {
    $("#news-list", root).innerHTML = items.map(function (n, i) {
      return '<div class="item news-item" data-i="' + i + '">' +
        ((n.imageSm || n.image) ? '<img class="thumb" src="' + esc(n.imageSm || n.image) + '" alt="">' : '<span class="thumb empty">مفيش صورة</span>') +
        '<div class="fields">' +
          field("العنوان", '<input data-k="title" value="' + esc(n.title || "") + '" placeholder="مثال: قافلة طبية جديدة في الصعيد">', true) +
          field("التاريخ", '<input data-k="date" type="date" value="' + esc((n.date || "").slice(0, 10)) + '">') +
          field("النوع", tagSel(n.tag || "خبر")) +
          field("رابط \"اعرف أكثر\" (اختياري)", '<input data-k="link" dir="ltr" placeholder="/p/30.html أو https://…" value="' + esc(n.link || "") + '">') +
          field("ملخص قصير (بيظهر في الكارت)", '<textarea data-k="text" rows="2" maxlength="300">' + esc(n.text || "") + "</textarea>", true) +
          field("النص الكامل (اختياري - سطر فاضي = فقرة جديدة)", '<textarea data-k="body" rows="5">' + esc(n.body || "") + "</textarea>", true) +
        "</div>" +
        '<div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="img">رفع صورة</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button>' +
          (n.id && loaded.indexOf('"' + n.id + '"') > -1 ? '<a class="btn btn-ghost btn-sm" href="/news.html#n-' + encodeURIComponent(n.id) + '" target="_blank" rel="noopener">معاينة ↗</a>' : "") +
        "</div></div>";
    }).join("");
  }
  function collect() {
    $$("#news-list .item", root).forEach(function (it) { var n = items[+it.dataset.i]; if (n) $$("[data-k]", it).forEach(function (i) { n[i.dataset.k] = i.value.trim(); }); });
  }
  function clean() {
    return items.filter(function (n) { return n.title; }).map(function (n) {
      return { id: n.id || uid(), title: n.title, date: n.date || today(), tag: n.tag || "خبر", text: n.text || "", body: n.body || "", image: n.image || "", imageSm: n.imageSm || n.image || "", link: n.link || "" };
    });
  }

  A.register("news", function () {
    root = $("#news-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    A.api("data/news").then(function (d) {
      items = Array.isArray(d) ? d : [];
      loaded = JSON.stringify(clean()); render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-news, #sort-news"); if (!b || !items) return;
      collect();
      if (b.id === "add-news") { items.unshift({ id: uid(), title: "", date: today(), tag: "خبر", text: "", body: "", image: "", imageSm: "", link: "" }); renderList(); var f = $('#news-list .item [data-k="title"]', root); if (f) f.focus(); return; }
      if (b.id === "sort-news") { items.sort(function (a, c) { return String(c.date || "").localeCompare(String(a.date || "")); }); renderList(); return; }
      var i = +b.closest(".item").dataset.i, act = b.dataset.act, n = items[i];
      if (act === "del") { if (!confirm("حذف الخبر ده؟")) return; items.splice(i, 1); }
      else if (act === "up" && i > 0) items.splice(i - 1, 0, items.splice(i, 1)[0]);
      else if (act === "down" && i < items.length - 1) items.splice(i + 1, 0, items.splice(i, 1)[0]);
      else if (act === "img") {
        A.pick(false).then(function (files) {
          if (!files.length) return; A.busy(b, true);
          return A.upload(files, 1200, 600).then(function (r) { n.image = r[0].url; n.imageSm = r[0].urlSm; renderList(); A.toast("اترفعت الصورة، اضغط حفظ ونشر"); });
        }).catch(function (err) { A.toast(err.message, true); A.busy(b, false); });
        return;
      }
      else return;
      renderList();
    });

    $("#save-news").onclick = function () {
      if (!items) return;
      var b = this; collect();
      for (var i = 0; i < items.length; i++) {
        var n = items[i];
        if (!n.title && !n.text && !n.body) continue;
        if (!n.title) return A.toast("الخبر رقم " + (i + 1) + " من غير عنوان", true);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date || "")) return A.toast('"' + n.title + '" محتاج تاريخ', true);
        if (!okHref(n.link)) return A.toast('رابط "' + n.title + '" مش صحيح', true);
      }
      var d = clean(), j = JSON.stringify(d);
      if (j === loaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      A.api("data/news", { method: "PUT", body: { data: d, message: "admin: news" } })
        .then(function () { items = d; loaded = j; renderList(); A.published(); })
        .catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
