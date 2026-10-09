// Admin tab "بيانات الموقع": contact details, social links and footer text (PUT /api/console/site -> js/layout.js + data/site.json)
// plus the donate page's bank accounts, wallets and the account abroad (PUT /api/console/data/donate -> data/donate.json).
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var root, site = null, donate = null, siteLoaded = "", donateLoaded = "";
  var SOCIAL = [["facebook", "فيسبوك"], ["instagram", "إنستجرام"], ["x", "إكس (تويتر)"], ["linkedin", "لينكدإن"], ["youtube", "يوتيوب"], ["tiktok", "تيك توك"]];

  function inp(label, attr, key, val, o) {
    o = o || {};
    var common = " " + attr + '="' + key + '"' + (o.ltr ? ' dir="ltr"' : "") + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "");
    return '<div class="field' + (o.full ? " full" : "") + '"><label>' + label + "</label>" +
      (o.rows ? "<textarea" + common + ' rows="' + o.rows + '">' + esc(val) + "</textarea>" : "<input" + common + ' value="' + esc(val) + '"' + (o.type ? ' type="' + o.type + '"' : "") + ">") + "</div>";
  }
  var S = function (l, k, v, o) { return inp(l, "data-s", k, v, o); }, D = function (l, k, v, o) { return inp(l, "data-d", k, v, o); };
  function get(obj, path) { return path.split(".").reduce(function (o, k) { return o && o[k] != null ? o[k] : ""; }, obj); }
  function set(obj, path, v) { var ks = path.split("."), o = obj; while (ks.length > 1) { var k = ks.shift(); o[k] = o[k] || {}; o = o[k]; } o[ks[0]] = v; }

  function render() {
    var f = donate.foreign || {};
    root.innerHTML =
      '<h2>التواصل</h2><p class="hint">بتظهر في الهيدر والفوتر وصفحة تواصل معنا وكل زرار "اتصل" في الموقع.</p><div class="site-grid">' +
        S("الخط الساخن", "hotline", site.hotline, { ltr: true, ph: "19340" }) +
        S("الهاتف", "phone", site.phone, { ltr: true, ph: "01xxxxxxxxx" }) +
        S("واتساب (اختياري - بيظهر كرابط wa.me)", "whatsapp", site.whatsapp, { ltr: true, ph: "01xxxxxxxxx" }) +
        S("البريد الإلكتروني", "email", site.email, { ltr: true, type: "email" }) +
        S("العنوان", "address", site.address, { full: true }) +
      "</div>" +
      '<h2>السوشيال ميديا</h2><p class="hint">سيب الخانة فاضية لإخفاء الأيقونة من الهيدر والفوتر.</p><div class="site-grid">' +
        SOCIAL.map(function (k) { return S(k[1], "social." + k[0], get(site, "social." + k[0]), { ltr: true, ph: "https://…" }); }).join("") +
      "</div>" +
      '<h2>الفوتر</h2><div class="site-grid">' +
        S("اسم المؤسسة", "footer.name", get(site, "footer.name"), { full: true }) +
        S("نبذة قصيرة تحت الشعار", "footer.text", get(site, "footer.text"), { full: true, rows: 3 }) +
      "</div>" +
      '<h2>طرق التبرع: الحسابات البنكية</h2><p class="hint">بتظهر في صفحة طرق التبرع ← الحسابات البنكية مع زرار نسخ لكل رقم. IBAN و SWIFT اختياريين (بيظهروا كسطر إضافي).</p>' +
      '<div class="list" id="banks"></div><button type="button" class="btn btn-ghost" id="add-bank">+ إضافة حساب</button>' +
      '<h2>المحافظ وإنستاباي</h2><p class="hint">أرقام المحافظ (فودافون كاش، إنستاباي…) في تبويب المحافظ. فاضي = مفيش أرقام معروضة.</p>' +
      '<div class="list" id="wallets"></div><button type="button" class="btn btn-ghost" id="add-wallet">+ إضافة محفظة</button>' +
      '<h2>التبرع من خارج مصر</h2><p class="hint">تبويب "من خارج مصر": صورة بيانات الحساب في ألمانيا ورابط طرق التبرع الأخرى.</p>' +
      '<div class="item"><img class="thumb" src="' + esc(f.image || "") + '" alt=""><div class="fields">' +
        D("نص إضافي فوق الصورة (اختياري)", "foreign.text", f.text || "", { full: true }) +
        D("وصف الصورة", "foreign.alt", f.alt || "", { full: true }) +
        D("رابط طرق أخرى للتبرع من الخارج", "foreign.link", f.link || "", { ltr: true, ph: "https://…" }) +
        D("نص الزرار", "foreign.linkText", f.linkText || "", { ph: "طرق أخرى للتبرع من الخارج" }) +
      '</div><div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" id="foreign-img">رفع صورة الحساب</button></div></div>';
    renderBanks(); renderWallets();
  }
  function acts() { return '<div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down">▼</button><button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div>'; }
  function renderBanks() {
    $("#banks", root).innerHTML = donate.banks.map(function (b, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>اسم البنك</label><input data-k="name" value="' + esc(b.name || "") + '"></div>' +
        '<div class="field"><label>العملة (مثال: بالجنيه)</label><input data-k="currency" value="' + esc(b.currency || "") + '"></div>' +
        '<div class="field"><label>رقم الحساب</label><input data-k="number" dir="ltr" value="' + esc(b.number || "") + '"></div>' +
        '<div class="field"><label>IBAN (اختياري)</label><input data-k="iban" dir="ltr" value="' + esc(b.iban || "") + '"></div>' +
        '<div class="field"><label>SWIFT (اختياري)</label><input data-k="swift" dir="ltr" value="' + esc(b.swift || "") + '"></div>' +
        "</div>" + acts() + "</div>";
    }).join("");
  }
  function renderWallets() {
    $("#wallets", root).innerHTML = donate.wallets.map(function (w, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>الاسم (مثال: فودافون كاش)</label><input data-k="name" value="' + esc(w.name || "") + '"></div>' +
        '<div class="field"><label>الرقم / العنوان</label><input data-k="value" dir="ltr" value="' + esc(w.value || "") + '"></div>' +
        "</div>" + acts() + "</div>";
    }).join("");
  }
  function collect() {
    $$("[data-s]", root).forEach(function (el) { set(site, el.dataset.s, el.value.trim()); });
    $$("[data-d]", root).forEach(function (el) { set(donate, el.dataset.d, el.value.trim()); });
    ["banks", "wallets"].forEach(function (key) {
      $$("#" + key + " .item", root).forEach(function (it) { var o = donate[key][+it.dataset.i]; if (o) $$("[data-k]", it).forEach(function (i) { o[i.dataset.k] = i.value.trim(); }); });
    });
  }
  function cleanDonate() {
    return { banks: donate.banks.filter(function (b) { return b.name && b.number; }), wallets: donate.wallets.filter(function (w) { return w.name && w.value; }), foreign: donate.foreign || {} };
  }

  A.register("site", function () {
    root = $("#site-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    Promise.all([A.api("site"), A.api("data/donate").catch(function () { return {}; })]).then(function (r) {
      site = r[0] || {}; site.social = site.social || {}; site.footer = site.footer || {};
      donate = r[1] || {}; donate.banks = donate.banks || []; donate.wallets = donate.wallets || []; donate.foreign = donate.foreign || {};
      siteLoaded = JSON.stringify(site); donateLoaded = JSON.stringify(cleanDonate());
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-bank, #add-wallet, #foreign-img"); if (!b || !donate) return;
      collect();
      if (b.id === "add-bank") { donate.banks.push({ name: "", currency: "", number: "", iban: "", swift: "" }); renderBanks(); return; }
      if (b.id === "add-wallet") { donate.wallets.push({ name: "", value: "" }); renderWallets(); return; }
      if (b.id === "foreign-img") {
        A.pick(false).then(function (files) {
          if (!files.length) return; A.busy(b, true);
          return A.upload(files, 1000).then(function (r) { donate.foreign.image = r[0].url; render(); A.toast("اترفعت الصورة، اضغط حفظ ونشر"); });
        }).catch(function (err) { A.toast(err.message, true); A.busy(b, false); });
        return;
      }
      var it = b.closest(".item"), list = b.closest("#banks") ? "banks" : "wallets", arr = donate[list], i = +it.dataset.i, act = b.dataset.act;
      if (act === "del") { if (!confirm("حذف العنصر ده؟")) return; arr.splice(i, 1); }
      else if (act === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (act === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
      else return;
      if (list === "banks") renderBanks(); else renderWallets();
    });

    $("#save-site").onclick = function () {
      if (!site || !donate) return;
      var b = this; collect();
      var d = cleanDonate(), sj = JSON.stringify(site), dj = JSON.stringify(d);
      if (sj === siteLoaded && dj === donateLoaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      var p = sj === siteLoaded ? Promise.resolve() : A.api("site", { method: "PUT", body: { site: site } }).then(function (r) { if (r.site) site = r.site; siteLoaded = JSON.stringify(site); });
      p.then(function () { if (dj !== donateLoaded) return A.api("data/donate", { method: "PUT", body: { data: d, message: "admin: donate accounts" } }).then(function () { donate = d; donateLoaded = dj; }); })
        .then(function () { render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
