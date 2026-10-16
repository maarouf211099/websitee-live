// Admin tab "بيانات الموقع": contact details, social links, footer text and links, the strip above the footer and the legal
// identity line (PUT /api/console/site -> js/layout.js + data/site.json)
// plus the donate page's bank accounts, wallets and the account abroad (PUT /api/console/data/donate -> data/donate.json).
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  function ih(id) { return window.MersalImgSizes ? window.MersalImgSizes.hint(id) : ""; } // recommended-size hint line (tabs/sizes.js)
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
        S("شريط فوق الفوتر في الصفحات الداخلية: العنوان", "footer.stripTitle", get(site, "footer.stripTitle"), { ph: "محتاج مساعدة في التبرع؟" }) +
        S("شريط فوق الفوتر: السطر الصغير", "footer.stripText", get(site, "footer.stripText"), { ph: "مندوبنا يوصلك لحد باب البيت" }) +
      "</div>" +
      '<h2>روابط الفوتر</h2><p class="hint">عمود «روابط» في الفوتر بالترتيب ده. الرابط يبدأ بـ / (صفحة في الموقع) أو https://، ولو كتبت <code dir="ltr">{youtube}</code> (أو facebook / instagram …) الرابط بيمشي ورا لينك السوشيال. لو مسحت كل الروابط الفوتر بيرجع للروابط الأصلية.</p>' +
      '<div class="list" id="flinks"></div><button type="button" class="btn btn-ghost" id="add-flink">+ إضافة رابط</button>' +
      '<h2>بيانات الإشهار (سطر الهوية القانونية)</h2><p class="hint">بيظهر تحت الحقوق في الفوتر وفي صفحة سياسة الخصوصية: «مؤسسة أهلية غير هادفة للربح · مشهرة برقم …». مش هيظهر حاجة طول ما رقم الإشهار فاضي، فاكتبه بس بعد ما تتأكد منه من الورق الرسمي.</p><div class="site-grid">' +
        S("رقم الإشهار", "legal.regNo", get(site, "legal.regNo"), { ltr: true }) +
        S("سنة الإشهار", "legal.regYear", get(site, "legal.regYear"), { ltr: true, ph: "مثال: 2015" }) +
        S("جهة الإشهار", "legal.regBody", get(site, "legal.regBody"), { ph: "مثال: وزارة التضامن الاجتماعي" }) +
        S("رقم تصريح جمع التبرعات (اختياري)", "legal.permitNo", get(site, "legal.permitNo"), { ltr: true }) +
        S("التصريح ساري حتى (اختياري)", "legal.permitUntil", get(site, "legal.permitUntil")) +
      "</div>" +
      '<h2>طرق التبرع: الحسابات البنكية</h2><p class="hint">بتظهر في صفحة طرق التبرع ← الحسابات البنكية مع زرار نسخ لكل رقم. IBAN و SWIFT اختياريين (بيظهروا كسطر إضافي).</p>' +
      '<div class="list" id="banks"></div><button type="button" class="btn btn-ghost" id="add-bank">+ إضافة حساب</button>' +
      '<h2>المحافظ وإنستاباي</h2><p class="hint">أرقام المحافظ (فودافون كاش، إنستاباي…) في تبويب المحافظ. فاضي = مفيش أرقام معروضة.</p>' +
      '<div class="list" id="wallets"></div><button type="button" class="btn btn-ghost" id="add-wallet">+ إضافة محفظة</button>' +
      '<h2>التبرع من خارج مصر</h2><p class="hint">تبويب "من خارج مصر": بيانات الحساب (البنك، صاحب الحساب، IBAN، BIC)، صورة بيانات الحساب، ورابط طرق التبرع الأخرى.</p>' +
      '<div class="item"><img class="thumb" src="' + esc(f.image || "") + '" alt=""><div class="fields">' +
        D("البنك", "foreign.bank", f.bank || "") +
        D("اسم صاحب الحساب", "foreign.holder", f.holder || "") +
        D("IBAN", "foreign.iban", f.iban || "", { ltr: true, ph: "DE00 0000 0000 0000 0000 00" }) +
        D("BIC / SWIFT", "foreign.bic", f.bic || "", { ltr: true }) +
        D("نص إضافي فوق الصورة (اختياري)", "foreign.text", f.text || "", { full: true }) +
        D("وصف الصورة", "foreign.alt", f.alt || "", { full: true }) +
        D("رابط طرق أخرى للتبرع من الخارج", "foreign.link", f.link || "", { ltr: true, ph: "https://…" }) +
        D("نص الزرار", "foreign.linkText", f.linkText || "", { ph: "طرق أخرى للتبرع من الخارج" }) +
      '</div><div class="item-actions">' + ih("abroad") + '<button type="button" class="btn btn-ghost btn-sm" id="foreign-img">رفع صورة الحساب</button></div></div>';
    renderBanks(); renderWallets(); renderLinks();
  }
  function renderLinks() {
    var links = site.footer.links;
    $("#flinks", root).innerHTML = links.length ? links.map(function (l, i) {
      // one compact row per link: name, link, ▲ ▼ حذف
      return '<div class="item flink" data-i="' + i + '">' +
        '<div class="field"><label>الاسم</label><input data-k="title" maxlength="60" value="' + esc(l.title || "") + '"></div>' +
        '<div class="field"><label>الرابط</label><input data-k="href" dir="ltr" placeholder="/p/3.html" value="' + esc(l.href || "") + '"></div>' +
        acts() + "</div>";
    }).join("") : '<p class="hint">مفيش روابط: الفوتر هيعرض الروابط الأصلية.</p>';
  }
  function acts() { return '<div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down">▼</button><button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div>'; }
  function renderBanks() {
    $("#banks", root).innerHTML = donate.banks.map(function (b, i) {
      var first = !i || String(donate.banks[i - 1].name || "").trim() !== String(b.name || "").trim(); // first account of a bank card
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>اسم البنك</label><input data-k="name" value="' + esc(b.name || "") + '"></div>' +
        '<div class="field"><label>العملة (مثال: بالجنيه)</label><input data-k="currency" value="' + esc(b.currency || "") + '"></div>' +
        '<div class="field"><label>رقم الحساب</label><input data-k="number" dir="ltr" value="' + esc(b.number || "") + '"></div>' +
        '<div class="field"><label>IBAN (اختياري)</label><input data-k="iban" dir="ltr" value="' + esc(b.iban || "") + '"></div>' +
        '<div class="field"><label>SWIFT (اختياري)</label><input data-k="swift" dir="ltr" value="' + esc(b.swift || "") + '"></div>' +
        '<div class="field full"><label>شعار البنك (رابط صورة)</label><div style="display:flex;gap:10px;align-items:center">' +
          '<span data-logo-prev style="flex:none;display:flex;align-items:center;justify-content:center;width:104px;height:46px;padding:4px 6px;border:1px solid var(--line);border-radius:10px;background:#fff;overflow:hidden"></span>' +
          '<input data-k="logo" dir="ltr" placeholder="/img/banks/….png أو https://…" value="' + esc(b.logo || "") + '"></div>' +
          ih("bank") + (first ? '<small style="color:var(--muted);font-size:12px">اختياري. الحسابات اللي ورا بعض بنفس اسم البنك بتظهر في كارت واحد بالشعار ده؛ من غير شعار بيظهر أول حرف من اسم البنك.</small>' : "") + "</div>" +
        "</div>" + acts() + "</div>";
    }).join("");
    // logo preview: follows the field as it is typed (only site paths and http(s) links are loaded)
    $$("#banks [data-k=\"logo\"]", root).forEach(function (inp) {
      var box = inp.parentNode.querySelector("[data-logo-prev]");
      function show() {
        var v = inp.value.trim();
        box.textContent = "";
        if (/^(\/(?!\/)|https?:\/\/)\S+$/i.test(v)) {
          var img = document.createElement("img");
          img.alt = ""; img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain";
          img.addEventListener("error", function () { box.textContent = "الرابط مش شغال"; box.style.color = "#b42318"; box.style.fontSize = "11px"; });
          img.src = v; box.style.color = ""; box.appendChild(img);
        } else { box.textContent = "بدون شعار"; box.style.color = "var(--muted)"; box.style.fontSize = "11px"; }
      }
      inp.addEventListener("input", show); show();
    });
  }
  function renderWallets() {
    $("#wallets", root).innerHTML = donate.wallets.map(function (w, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>الاسم (مثال: فودافون كاش)</label><input data-k="name" value="' + esc(w.name || "") + '"></div>' +
        '<div class="field"><label>الرقم / العنوان</label><input data-k="value" dir="ltr" value="' + esc(w.value || "") + '"></div>' +
        "</div>" + acts() + "</div>";
    }).join("");
  }
  function has(obj, path) { var ks = path.split("."), o = obj; for (var i = 0; i < ks.length; i++) { if (!o || typeof o !== "object" || !Object.prototype.hasOwnProperty.call(o, ks[i])) return false; o = o[ks[i]]; } return true; }
  function collect() {
    $$("[data-s]", root).forEach(function (el) { set(site, el.dataset.s, el.value.trim()); });
    $$("[data-d]", root).forEach(function (el) {
      var v = el.value.trim();
      if (el.dataset.d === "foreign.iban") v = v.replace(/\s+/g, ""); // shown grouped on the site, stored without spaces
      if (v || has(donate, el.dataset.d)) set(donate, el.dataset.d, v); // an empty new field adds no empty key
    });
    $$("#flinks .item", root).forEach(function (it) { var o = site.footer.links[+it.dataset.i]; if (o) $$("[data-k]", it).forEach(function (i) { o[i.dataset.k] = i.value.trim(); }); });
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
      site = r[0] || {}; site.social = site.social || {}; site.footer = site.footer || {}; site.footer.links = site.footer.links || []; site.legal = site.legal || {};
      donate = r[1] || {}; donate.banks = donate.banks || []; donate.wallets = donate.wallets || []; donate.foreign = donate.foreign || {};
      siteLoaded = JSON.stringify(site); donateLoaded = JSON.stringify(cleanDonate());
      render();
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], #add-bank, #add-wallet, #add-flink, #foreign-img"); if (!b || !donate) return;
      collect();
      if (b.id === "add-flink") { site.footer.links.push({ title: "", href: "/" }); renderLinks(); var nl = $("#flinks .item:last-child [data-k=title]", root); if (nl) nl.focus(); return; }
      if (b.id === "add-bank") { donate.banks.push({ name: "", currency: "", number: "", iban: "", swift: "" }); renderBanks(); return; }
      if (b.id === "add-wallet") { donate.wallets.push({ name: "", value: "" }); renderWallets(); return; }
      if (b.id === "foreign-img") {
        A.pick(false, "abroad").then(function (files) {
          if (!files.length) return; A.busy(b, true);
          return A.upload(files, 1000).then(function (r) { donate.foreign.image = r[0].url; render(); A.toast("اترفعت الصورة، اضغط حفظ ونشر"); });
        }).catch(function (err) { A.toast(err.message, true); A.busy(b, false); });
        return;
      }
      var it = b.closest(".item"), list = b.closest("#banks") ? "banks" : b.closest("#flinks") ? "flinks" : "wallets", arr = list === "flinks" ? site.footer.links : donate[list], i = +it.dataset.i, act = b.dataset.act;
      if (act === "del") { if (!confirm("حذف العنصر ده؟")) return; arr.splice(i, 1); }
      else if (act === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (act === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
      else return;
      if (list === "banks") renderBanks(); else if (list === "flinks") renderLinks(); else renderWallets();
    });

    $("#save-site").onclick = function () {
      if (!site || !donate) return;
      var b = this; collect();
      site.footer.links = site.footer.links.filter(function (l) { return l.title && l.href; });
      var badLink = site.footer.links.filter(function (l) { return !/^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)\S*$/i.test(l.href) && !/^\{(facebook|instagram|x|linkedin|youtube|tiktok)\}$/.test(l.href); })[0];
      if (badLink) return A.toast("رابط «" + badLink.title + "» في الفوتر لازم يبدأ بـ / أو https://", true);
      var d = cleanDonate(), sj = JSON.stringify(site), dj = JSON.stringify(d);
      if (sj === siteLoaded && dj === donateLoaded) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      var p = sj === siteLoaded ? Promise.resolve() : A.api("site", { method: "PUT", body: { site: site } }).then(function (r) { if (r.site) site = r.site; siteLoaded = JSON.stringify(site); });
      p.then(function () { if (dj !== donateLoaded) return A.api("data/donate", { method: "PUT", body: { data: d, message: "admin: donate accounts" } }).then(function () { donate = d; donateLoaded = dj; }); })
        .then(function () { render(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
