// Admin tab "شريط الإعلان والشركاء": the announcement bar under the header of every page (data/announce.json) and the
// "بتتبرع من خلال" strip on the home page (data/partners.json) -> PUT /api/console/data/announce and /api/console/data/partners.
// The site side is js/extras.js. The WhatsApp button needs no setting here: it shows once "بيانات الموقع" has a WhatsApp number.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, ann = null, list = null, loadedAnn = "", loadedList = "";
  var TONES = [["gold", "ذهبي (العادي)"], ["teal", "فاتح (معلومة)"], ["red", "أحمر (حاجة عاجلة)"]];
  var TONE_CSS = { gold: ["#fec830", "#003c3c", "#003c3c", "#fff"], teal: ["#e4f3f3", "#003c3c", "#007879", "#fff"], red: ["#b42318", "#fff", "#fff", "#b42318"] };
  var CHECK = 'class="field full" style="flex-direction:row;align-items:center;gap:8px;cursor:pointer"';
  var BOX = 'style="width:18px;height:18px;flex:none"';
  var THUMB = "width:150px;max-width:100%;aspect-ratio:5/2;"; // logo-shaped preview (the shared .thumb is a 4:3 photo, full width on phones)
  // same rules as the site (js/extras.js) and the API: links start with / # https:// http:// tel: mailto:, logos with / or https://
  function okHref(h) { return !h || /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)/i.test(h); }
  function okImg(h) { return !h || /^(\/(?!\/)|https:\/\/)[^\s"'<>]+$/i.test(h); }
  function field(label, html, full) { return '<div class="field' + (full ? " full" : "") + '"><label>' + label + "</label>" + html + "</div>"; }
  function sel(key, opts, val) { return '<select data-a="' + key + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }
  function endOf(u) { if (!u) return 0; var t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(u) ? u + "T23:59:59+02:00" : u); return isNaN(t) ? 0 : t; }

  function render() {
    root.innerHTML =
      '<h2 style="margin-top:6px">شريط الإعلان</h2>' +
      '<p class="hint">سطر قصير تحت الهيدر في كل صفحات الموقع: حملة، موعد، تنبيه مهم. بيظهر بس وهو مفعّل ولسه تاريخه معدّاش. لو الزائر قفله مش هيرجعله تاني إلا لما النص أو الرابط يتغير.</p>' +
      '<div class="site-grid">' +
        "<label " + CHECK + '><input type="checkbox" data-a="enabled" ' + BOX + (ann.enabled ? " checked" : "") + "> <span><b>إظهار الشريط على الموقع</b></span></label>" +
        field('نص الإعلان <span data-count></span>', '<textarea data-a="text" rows="2" maxlength="220" placeholder="جملة واحدة قصيرة">' + esc(ann.text || "") + "</textarea>", true) +
        field("رابط الزرار (اختياري)", '<input data-a="link" dir="ltr" placeholder="/donate.html أو https://…" value="' + esc(ann.link || "") + '">') +
        field("كلام الزرار", '<input data-a="linkText" maxlength="40" placeholder="اعرف أكتر" value="' + esc(ann.linkText || "") + '">') +
        field("اللون", sel("tone", TONES, ann.tone || "gold")) +
        field("يختفي لوحده بعد يوم (اختياري)", '<input type="date" data-a="until" value="' + esc(/^\d{4}-\d{2}-\d{2}$/.test(ann.until || "") ? ann.until : "") + '">') +
        "<label " + CHECK + '><input type="checkbox" data-a="dismissible" ' + BOX + (ann.dismissible !== false ? " checked" : "") + "> <span>الزائر يقدر يقفله بعلامة ×</span></label>" +
      "</div>" +
      '<p class="hint" style="margin:12px 0 6px">معاينة (زي ما هيظهر على الموقع):</p><div id="ann-preview"></div>' +
      '<h2>بتتبرع من خلال</h2>' +
      '<p class="hint">شريط بيتحرك لوحده في الصفحة الرئيسية (بعد الأخبار) فيه البنوك والمحافظ والتطبيقات اللي الناس تتبرع لمرسال من خلالها. دي طرق تبرع مش رعاة، فمتضيفش جهة هنا غير لو التبرع من خلالها شغال فعلاً. اللوجو اختياري: من غيره الاسم بيظهر مكتوب. الترتيب هنا هو ترتيب الشريط.</p>' +
      '<div class="list" id="partners-list"></div><button type="button" class="btn btn-ghost" id="add-partner">+ إضافة جهة</button>';
    renderList();
    preview();
  }
  function renderList() {
    $("#partners-list", root).innerHTML = list.length ? list.map(function (p, i) {
      var logo = p.logo && okImg(p.logo) ? p.logo : "";
      return '<div class="item" data-i="' + i + '"><div class="thumbs">' +
        (logo ? '<img class="thumb" src="' + esc(logo) + '" alt="" style="' + THUMB + 'object-fit:contain;background:#fff;border:1px solid #dde7e7;padding:8px">' : '<span class="thumb empty" style="' + THUMB + '">من غير لوجو: الاسم بيظهر مكتوب</span>') +
        '</div><div class="fields">' +
        field("الاسم", '<input data-k="name" maxlength="60" value="' + esc(p.name || "") + '" placeholder="مثال: بنك مصر">') +
        field("اللوجو (اختياري)", '<input data-k="logo" dir="ltr" placeholder="/img/banks/… أو ارفع صورة" value="' + esc(p.logo || "") + '">') +
        field("الرابط لما حد يضغط (اختياري)", '<input data-k="link" dir="ltr" placeholder="/donate.html#bank" value="' + esc(p.link || "") + '">', true) +
        '</div><div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="logo">رفع لوجو</button>' +
        (p.logo ? '<button type="button" class="btn btn-ghost btn-sm" data-act="nologo">من غير لوجو</button>' : "") +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("") : '<p class="hint">مفيش جهات، والشريط مش هيظهر في الرئيسية.</p>';
  }
  function preview() {
    var box = $("#ann-preview", root); if (!box) return;
    var c = TONE_CSS[ann.tone] || TONE_CSS.gold, text = (ann.text || "").trim(), until = endOf(ann.until);
    var state = !ann.enabled ? "الشريط مقفول ومش ظاهر على الموقع." : !text ? "اكتب نص الإعلان." : until && Date.now() > until ? "التاريخ عدّى، فالشريط مش ظاهر على الموقع." :
      "ظاهر على الموقع" + (until ? " لحد آخر يوم " + esc(ann.until) : "") + ".";
    var len = $("[data-count]", root); if (len) len.textContent = "(" + text.length + " حرف" + (text.length > 90 ? "، طويل شوية على الموبايل" : "") + ")";
    box.innerHTML = '<div style="background:' + c[0] + ";color:" + c[1] + ';border-radius:12px;padding:6px 14px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;font-weight:700;min-height:44px;' + (ann.enabled && text ? "" : "opacity:.55;") + '">' +
      "<span>" + esc(text || "نص الإعلان") + "</span>" +
      (ann.link ? '<span style="background:' + c[2] + ";color:" + c[3] + ';border-radius:999px;padding:3px 14px;font-size:13px;font-weight:800;white-space:nowrap">' + esc(ann.linkText || "اعرف أكتر") + " ←</span>" : "") +
      (ann.dismissible !== false ? '<span aria-hidden="true" style="opacity:.7">✕</span>' : "") +
      '</div><p class="hint" style="margin-top:6px">' + state + "</p>";
  }
  function collect() {
    $$("[data-a]", root).forEach(function (el) {
      var k = el.dataset.a;
      ann[k] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    $$("#partners-list .item", root).forEach(function (it) {
      var p = list[+it.dataset.i]; if (p) $$("[data-k]", it).forEach(function (i) { p[i.dataset.k] = i.value.trim(); });
    });
  }
  function cleanAnn() {
    return {
      enabled: !!ann.enabled, text: (ann.text || "").replace(/\s+/g, " ").trim(), link: (ann.link || "").trim(), linkText: (ann.linkText || "").trim(),
      tone: /^(gold|teal|red)$/.test(ann.tone) ? ann.tone : "gold", until: /^\d{4}-\d{2}-\d{2}$/.test(ann.until || "") ? ann.until : "", dismissible: ann.dismissible !== false
    };
  }
  function cleanList() {
    return list.filter(function (p) { return p && (p.name || "").trim(); }).map(function (p) { return { name: p.name.trim(), logo: (p.logo || "").trim(), link: (p.link || "").trim() }; });
  }
  // the first problem that would stop the save, or ""
  function problem(a, l) {
    if (a.enabled && !a.text) return "الشريط مفعّل ومن غير نص: اكتب نص الإعلان أو اقفله";
    if (!okHref(a.link)) return "رابط الإعلان لازم يبدأ بـ / أو https://\u200e";
    for (var i = 0; i < l.length; i++) {
      if (!okHref(l[i].link)) return "رابط \"" + l[i].name + "\" لازم يبدأ بـ / أو https://\u200e";
      if (!okImg(l[i].logo)) return "لوجو \"" + l[i].name + "\" لازم يكون مسار يبدأ بـ / أو رابط https://\u200e";
    }
    return "";
  }

  // logo upload: kept as PNG with its transparency (the shared photo upload turns pictures into JPEG), at most 480×160
  function logoPng(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth || 480, h = img.naturalHeight || 160, k = Math.min(480 / w, 160 / h);
        if (!/svg/i.test(file.type)) k = Math.min(1, k);
        var c = document.createElement("canvas"), ctx = c.getContext("2d");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("الصورة دي مش بتفتح، جرّب PNG أو SVG")); };
      img.src = url;
    });
  }

  A.register("extras", function () {
    root = $("#extras-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    Promise.all([A.api("data/announce"), A.api("data/partners")]).then(function (r) {
      ann = r[0] && typeof r[0] === "object" && !Array.isArray(r[0]) ? r[0] : {};
      list = Array.isArray(r[1]) ? r[1].filter(function (p) { return p && typeof p === "object"; }) : [];
      loadedAnn = JSON.stringify(cleanAnn()); loadedList = JSON.stringify(cleanList());
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("input", function (e) { if (ann && e.target.closest("[data-a]")) { collect(); preview(); } });
    root.addEventListener("change", function (e) {
      if (!ann) return;
      if (e.target.closest("[data-a]")) { collect(); preview(); }
      if (e.target.matches('[data-k="logo"]')) {
        // only the picture of that row changes, so the field the focus moved to stays put
        collect();
        var it = e.target.closest(".item"), v = e.target.value.trim(), th = $(".thumbs", it);
        th.innerHTML = v && okImg(v) ? '<img class="thumb" src="' + esc(v) + '" alt="" style="' + THUMB + 'object-fit:contain;background:#fff;border:1px solid #dde7e7;padding:8px">' : '<span class="thumb empty" style="' + THUMB + '">' + (v ? "المسار مش صحيح" : "من غير لوجو: الاسم بيظهر مكتوب") + "</span>";
      }
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-partner"); if (!b || !list) return;
      collect();
      if (b.id === "add-partner") { list.push({ name: "", logo: "", link: "/donate.html" }); renderList(); var last = $("#partners-list .item:last-child [data-k=name]", root); if (last) last.focus(); return; }
      var i = +b.closest(".item").dataset.i, act = b.dataset.act, p = list[i];
      if (act === "del") { if (!confirm("حذف \"" + (p.name || "الجهة دي") + "\" من الشريط؟")) return; list.splice(i, 1); }
      else if (act === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
      else if (act === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      else if (act === "nologo") p.logo = "";
      else if (act === "logo") {
        A.pick(false).then(function (files) {
          if (!files.length) return;
          A.busy(b, true); b.textContent = "جاري الرفع…";
          var stem = "logo-" + (files[0].name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "partner");
          return logoPng(files[0]).then(function (data) {
            return A.api("upload", { method: "POST", body: { files: [{ name: stem + ".png", data: data }], message: "admin: partner logo" } });
          }).then(function (d) {
            collect(); p.logo = d.urls[0]; renderList(); A.toast("اترفع اللوجو، اضغط حفظ ونشر");
          });
        }).catch(function (err) { A.toast(err.message, true); renderList(); });
        return;
      }
      else return;
      renderList();
    });

    $("#save-extras").onclick = function () {
      if (!ann || !list) return;
      var b = this; collect();
      var a = cleanAnn(), l = cleanList(), ja = JSON.stringify(a), jl = JSON.stringify(l);
      var bad = problem(a, l); if (bad) return A.toast(bad, true);
      if (ja === loadedAnn && jl === loadedList) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      var chain = Promise.resolve();
      if (ja !== loadedAnn) chain = chain.then(function () { return A.api("data/announce", { method: "PUT", body: { data: a, message: "admin: announcement bar" } }).then(function () { ann = a; loadedAnn = ja; }); });
      if (jl !== loadedList) chain = chain.then(function () { return A.api("data/partners", { method: "PUT", body: { data: l, message: "admin: donation channels strip" } }).then(function () { list = l; loadedList = jl; }); });
      chain.then(function () { render(); A.published(); })
        .catch(function (e) { A.toast(e.message, true); })
        .then(function () { A.busy(b, false); });
    };
  });
})();
