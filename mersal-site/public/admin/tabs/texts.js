// Admin tab "نصوص الموقع": every text, list, picture and amount of the home page sections and the donate page's amount
// chips (PUT /api/console/data/texts -> data/texts.json, baked into index.html / donate.html by api/src/lib/texts.js in
// the same commit), plus the title and description of the fixed pages for search engines and sharing
// (PUT /api/console/seo). Sections missing from texts.json are not shown and stay as they are on the site.
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  function ih(id) { return window.MersalImgSizes ? window.MersalImgSizes.hint(id) : ""; } // recommended-size hint line (tabs/sizes.js)
  var root, data = null, loaded = "", banks = [], seo = null, seoLoaded = "";

  var ICONS = {
    trust: [["pin", "دبوس مكان"], ["bank", "بنك"], ["receipt", "إيصال"], ["phone", "تليفون"], ["heart", "قلب"], ["lock", "قفل"]],
    niyya: [["zakat", "حاسبة (زكاة)"], ["heart", "قلب"], ["hospital", "مستشفى"], ["moon", "هلال"], ["gift", "هدية"]],
    services: [["pill", "دواء"], ["stethoscope", "سماعة طبيب"], ["hospital", "مستشفى"], ["debt", "إيدين (ديون)"], ["wheelchair", "كرسي متحرك"], ["home", "بيت"], ["heart", "قلب"]],
    ways: [["card", "كارت"], ["bank", "بنك"], ["phone", "تليفون"], ["globe", "الكرة الأرضية"], ["heart", "قلب"]]
  };
  var SHOW = [["all", "دايماً"], ["online", "بس لما الدفع بالبطاقة شغال"], ["offline", "بس لما الدفع بالبطاقة مقفول"]];
  var TOKENS = 'تقدر تكتب <code dir="ltr">{hotline}</code> مكان الخط الساخن (بيتحدث لوحده لو الرقم اتغير في «بيانات الموقع»)';

  // [key, label, type, extra]; types: text (default), area, num, amounts, link, img, icon:<set>, show, bool, bank, camp
  var SECTIONS = [
    { path: "home.quick", title: "صندوق «ساهم مع مرسال» (تحت السلايدر)", hint: "المبالغ اللي الزائر يختار منها بضغطة، والمبلغ اللي بيبقى متعلّم أول ما الصفحة تفتح. الحساب البنكي بيظهر مكان الصندوق لما الدفع بالبطاقة يكون مقفول.",
      fields: [["title", "العنوان"], ["trust", "سطر الأمان جنب العنوان"], ["amounts", "المبالغ (جنيه، مفصولة بفاصلة)", "amounts"], ["default", "المبلغ المختار أول ما الصفحة تفتح", "num"],
        ["offlineNumber", "الحساب اللي بيظهر لما الدفع بالبطاقة مقفول", "bank"], ["offlineLabel", "اسم الحساب ده"]] },
    { path: "home.trust", title: "مربعات «ليه تطمن لمرسال»", hint: "المربعات اللي تحت صندوق التبرع. " + TOKENS + '، و<code dir="ltr">{banks}</code> مكان عدد البنوك («7 بنوك»، بيتعد من الحسابات البنكية). الرابط <code dir="ltr">tel:{hotline}</code> بيتصل بالخط الساخن.',
      lists: [{ key: "items", title: "المربعات", blank: { icon: "heart", title: "", sub: "", link: "/donate.html", show: "all" },
        fields: [["icon", "الأيقونة", "icon:trust"], ["show", "يظهر", "show"], ["title", "العنوان"], ["sub", "السطر الصغير"], ["link", "الرابط", "link"]] },
        { key: "ways", title: "لوجوهات «طرق تانية للتبرع» تحت المربعات", logo: true, blank: { label: "", code: "", image: "", w: 0, h: 0, link: "/donate.html#wallets" },
          fields: [["label", "الاسم"], ["code", "كود بيظهر بخط عريض (اختياري)"], ["image", "اللوجو", "img"], ["link", "الرابط", "link"]] }] },
    { path: "home.campaigns", title: "عنوان قسم حملات التبرع", hint: "الحملات نفسها بتتعدل من تبويب «الرئيسية».", fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["sub", "الجملة اللي جنبه"]] },
    { path: "home.niyya", title: "«على نيتك: تحب تبرعك يكون إيه؟»", hint: "اختيارات النية. «مميّز» = بإطار ذهبي وعرض السطر كله على الموبايل (زي «زكاة مالي»).",
      fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["sub", "الجملة اللي جنبه"]],
      lists: [{ key: "items", title: "الاختيارات", blank: { icon: "heart", title: "", sub: "", link: "/donate.html#online", highlight: false },
        fields: [["icon", "الأيقونة", "icon:niyya"], ["highlight", "مميّز", "bool"], ["title", "العنوان"], ["sub", "السطر الصغير"], ["link", "الرابط", "link"]] }] },
    { path: "home.about", title: "«من نحن»", hint: "النص (كل سطر = فقرة)، القيم الأربعة، الزرار، والصورة وتعليقها.", image: { big: 1600, sm: 600 },
      fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["mark", "الجزء الملوّن من العنوان"], ["text", "النص", "area"], ["button", "نص الزرار"], ["link", "رابط الزرار", "link"],
        ["image", "الصورة", "img"], ["alt", "وصف الصورة"], ["capEyebrow", "تعليق الصورة: السطر الصغير"], ["capTitle", "تعليق الصورة: العنوان"], ["capText", "تعليق الصورة: السطر الأخير"]],
      lists: [{ key: "values", title: "القيم", blank: { title: "", text: "" }, fields: [["title", "القيمة"], ["text", "شرحها"]] }] },
    { path: "home.numbers", title: "عنوان «مرسال بالأرقام»", hint: "الأرقام نفسها وتاريخ تحديثها في تبويب «الرئيسية».", fields: [["title", "العنوان"]] },
    { path: "home.hospital", title: "مستشفى مرسال للأطفال", hint: "كل زراير التبرع في القسم ده (الأسهم و«ساهم في بناء المستشفى» و«على روح حد غالي») بتروح لكود الحملة المختارة، وشريط «اتجمع … من …» على الموبايل بياخد أرقامه من نفس الحملة في تبويب «الرئيسية».", image: { big: 1200, sm: 600 },
      fields: [["campaign", "الحملة", "camp"], ["status", "الشارة على الصورة"], ["image", "الصورة", "img"], ["alt", "وصف الصورة"], ["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["mark", "الجزء الملوّن من العنوان"],
        ["text", "النص", "area"], ["dua", "الدعاء تحت الأرقام"], ["donate", "نص زرار التبرع"], ["gift", "نص زرار «على روح حد غالي» (فاضي = مش ظاهر)"], ["more", "نص رابط التفاصيل (فاضي = مش ظاهر)"], ["moreLink", "رابط التفاصيل", "link"]],
      lists: [{ key: "facts", title: "الأرقام", blank: { value: 0, label: "" }, fields: [["value", "الرقم", "num"], ["label", "الوصف"]] },
        { key: "shares", title: "الأسهم", blank: { amount: 500, label: "", tag: "" }, fields: [["amount", "المبلغ (جنيه)", "num"], ["label", "الوصف"], ["tag", "شارة ذهبية (اختياري، زي «صدقة جارية»)"]] }] },
    { path: "home.services", title: "خدمات مرسال", hint: TOKENS + ".", fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["sub", "السطر تحت العنوان"]],
      lists: [{ key: "items", title: "الخدمات", blank: { icon: "heart", title: "", text: "", link: "/donate.html" }, fields: [["icon", "الأيقونة", "icon:services"], ["link", "الرابط", "link"], ["title", "اسم الخدمة"], ["text", "وصف قصير"]] }] },
    { path: "home.projects", title: "عنوان «مشاريع مرسال»", hint: "المشاريع نفسها في تبويب «الرئيسية».", fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"]] },
    { path: "home.ways", title: "طرق التبرع (الكروت)", hint: "صورة (لوجو) أو أيقونة لكل كارت. رابط رسالة SMS بيبدأ بـ sms:. " + TOKENS + ".",
      fields: [["eyebrow", "السطر الصغير فوق العنوان"], ["title", "العنوان"], ["sub", "السطر تحت العنوان"]],
      lists: [{ key: "items", title: "الطرق", logo: true, blank: { icon: "card", image: "", title: "", sub: "", link: "/donate.html", show: "all" },
        fields: [["icon", "الأيقونة (لو مفيش لوجو)", "icon:ways"], ["show", "يظهر", "show"], ["image", "اللوجو (اختياري)", "img"], ["title", "العنوان"], ["sub", "السطر الصغير"], ["link", "الرابط", "link"]] }] },
    { path: "home.slogan", title: "آخر الصفحة: الآية و«ابعت فرحة» والخط الساخن", hint: "الآية فاضية = مش ظاهرة. رقم الخط الساخن والتليفون من «بيانات الموقع».",
      fields: [["ayah", "الآية"], ["cite", "اسم السورة ورقم الآية"], ["text", "الجملة تحت «ابعت فرحة»", "area"], ["button", "نص الزرار"], ["link", "رابط الزرار", "link"], ["hotTitle", "كارت الخط الساخن: الجملة"], ["hotSub", "كارت الخط الساخن: تحت الرقم"],
        ["branchesLabel", "كارت الفروع: السطر الصغير"], ["branchesText", "كارت الفروع: العنوان (فاضي = مش ظاهر)"], ["branchesLink", "كارت الفروع: الرابط", "link"]] },
    { path: "donate", title: "صفحة التبرع: أزرار المبالغ", hint: "المبالغ اللي بتظهر في أول خطوة في التبرع بالبطاقة، والمبلغ المكتوب أول ما الصفحة تفتح.",
      fields: [["amounts", "المبالغ (جنيه، مفصولة بفاصلة)", "amounts"], ["default", "المبلغ المكتوب أول ما الصفحة تفتح", "num"]] }
  ];

  function get(o, path) { return String(path).split(".").reduce(function (x, k) { return x && typeof x === "object" ? x[k] : undefined; }, o); }
  function setp(o, path, v) { var ks = String(path).split("."), x = o; while (ks.length > 1) { var k = ks.shift(); if (x[k] == null) x[k] = /^\d+$/.test(ks[0]) ? [] : {}; x = x[k]; } x[ks[0]] = v; }
  function okLink(h) { return !h || /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:|sms:)[^\s"'<>]*$/i.test(h); }
  function okImg(h) { return !h || /^(\/(?!\/)|https:\/\/)[^\s"'<>]+$/i.test(h); }
  function opts(list, val) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); }

  function control(f, path, val, sec) {
    var type = f[2] || "text", attr = ' data-p="' + esc(path) + '" data-t="' + type + '"';
    if (type === "area") return "<textarea" + attr + ' rows="3">' + esc(val || "") + "</textarea>";
    if (type === "num") return "<input" + attr + ' type="number" min="0" dir="ltr" value="' + esc(val == null ? "" : val) + '">';
    if (type === "amounts") return "<input" + attr + ' dir="ltr" placeholder="100, 250, 500" value="' + esc((val || []).join(", ")) + '">';
    if (type === "link") return "<input" + attr + ' dir="ltr" placeholder="/donate.html" value="' + esc(val || "") + '">';
    if (type === "bool") return '<label style="display:flex;gap:8px;align-items:center;cursor:pointer;padding:8px 0"><input type="checkbox"' + attr + (val ? " checked" : "") + ' style="width:18px;height:18px"> <span>أيوه</span></label>';
    if (type === "show") return "<select" + attr + ">" + opts(SHOW, val || "all") + "</select>";
    if (type.indexOf("icon:") === 0) return "<select" + attr + ">" + opts(ICONS[type.slice(5)], val) + "</select>";
    if (type === "bank") {
      var list = banks.map(function (b) { return [b.number, b.name + " - " + (b.currency || "") + " - " + b.number]; });
      if (val && !list.some(function (o) { return String(o[0]).replace(/\D/g, "") === String(val).replace(/\D/g, ""); })) list.unshift([val, val + " (مش موجود في الحسابات البنكية!)"]);
      return "<select" + attr + ">" + opts(list, val) + "</select>";
    }
    if (type === "camp") {
      var camps = ((A.content() || {}).campaigns || []).filter(function (c) { return c && c.purpose; }).map(function (c) { return [c.purpose, c.title + " (" + c.purpose + ")"]; });
      if (!camps.some(function (o) { return o[0] === val; })) camps.unshift([val || "p30", (val || "p30") + (camps.length ? " (مش في حملات الرئيسية)" : "")]);
      return "<select" + attr + ">" + opts(camps, val) + "</select>";
    }
    if (type === "img") {
      var ok = val && okImg(val);
      return '<div style="display:flex;gap:8px;align-items:center">' + (ok ? '<img src="' + esc(val) + '" alt="" style="width:64px;height:44px;object-fit:contain;background:#f1f5f5;border-radius:8px;flex:none">' : "") +
        "<input" + attr + ' dir="ltr" placeholder="/img/… أو ارفع صورة" value="' + esc(val || "") + '"><button type="button" class="btn btn-ghost btn-sm" data-up="' + esc(path) + '"' + (sec && sec.logo ? ' data-logo="1"' : "") + ">رفع</button></div>" + ih(sec && sec.logo ? "logo-ways" : /^home\.hospital/.test(path) ? "hospital" : "about");
    }
    return "<input" + attr + ' value="' + esc(val == null ? "" : val) + '">';
  }
  function fieldHtml(f, path, val, sec) {
    var full = f[2] === "area" || f[2] === "img" || (f[0] === "text" && !f[2]);
    return '<div class="field' + (full ? " full" : "") + '"><label>' + esc(f[1]) + "</label>" + control(f, path, val, sec) + "</div>";
  }
  function listHtml(sec, l) {
    var base = sec.path + "." + l.key, arr = get(data, base) || [];
    return '<h3 style="margin:14px 0 6px;font-size:15px">' + esc(l.title) + '</h3><div class="list" data-list="' + esc(base) + '">' +
      (arr.length ? arr.map(function (it, i) {
        return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
          l.fields.map(function (f) { return fieldHtml(f, base + "." + i + "." + f[0], it[f[0]], l); }).join("") + "</div>" +
          '<div class="item-actions"><button type="button" class="btn btn-ghost btn-sm" data-act="up" aria-label="لفوق">▲</button><button type="button" class="btn btn-ghost btn-sm" data-act="down" aria-label="لتحت">▼</button><button type="button" class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
      }).join("") : '<p class="hint">القائمة فاضية: القسم ده هيظهر من غيرها.</p>') +
      '</div><button type="button" class="btn btn-ghost btn-sm" data-add="' + esc(base) + '">+ إضافة</button>';
  }
  function sectionHtml(sec, i) {
    var o = get(data, sec.path);
    if (!o || typeof o !== "object") return "";
    return '<details class="tx-sec"' + (i === 0 ? " open" : "") + ' data-sec="' + esc(sec.path) + '"><summary><h2 style="display:inline;margin:0;font-size:17px">' + esc(sec.title) + "</h2></summary>" +
      '<p class="hint">' + sec.hint + "</p>" +
      (sec.fields ? '<div class="site-grid">' + sec.fields.map(function (f) { return fieldHtml(f, sec.path + "." + f[0], o[f[0]], sec); }).join("") + "</div>" : "") +
      (sec.lists || []).map(function (l) { return listHtml(sec, l); }).join("") + "</details>";
  }
  function seoHtml() {
    if (!seo) return '<p class="hint">جاري تحميل عناوين الصفحات…</p>';
    return seo.map(function (pg, i) {
      return '<div class="item" data-seo="' + esc(pg.id) + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field full"><label>' + esc(pg.name) + ' <a href="' + esc(pg.url) + '" target="_blank" rel="noopener" dir="ltr">' + esc(pg.url) + ' ↗</a> · العنوان في تاب المتصفح وجوجل <span data-n></span></label><input data-s="title" maxlength="120" value="' + esc(pg.title) + '"></div>' +
        '<div class="field full"><label>الوصف في نتايج البحث <span data-n></span></label><textarea data-s="desc" rows="2" maxlength="300">' + esc(pg.desc) + "</textarea></div>" +
        '<div class="field"><label>العنوان لما الرابط يتشارك (فاضي = زي العنوان)</label><input data-s="ogTitle" maxlength="120" value="' + esc(pg.ogTitle) + '"></div>' +
        '<div class="field"><label>الوصف لما الرابط يتشارك (فاضي = زي الوصف)</label><input data-s="ogDesc" maxlength="300" value="' + esc(pg.ogDesc) + '"></div>' +
        '<div class="field full tx-serp" aria-hidden="true"></div></div></div>';
    }).join("");
  }
  function render() {
    root.innerHTML = '<p class="hint">كل نصوص الصفحة الرئيسية وأزرار المبالغ في صفحة التبرع. الحفظ بيكتبها جوه الصفحات نفسها (من غير ما الصفحة تتأخر)، وبتظهر على الموقع خلال دقيقة. <a href="/" target="_blank" rel="noopener">افتح الرئيسية ↗</a></p>' +
      '<nav class="tx-index" aria-label="أقسام الصفحة"><b>اختار القسم:</b> ' + SECTIONS.map(function (s) { return '<a href="#" data-jump="' + esc(s.path) + '">' + esc(s.title) + "</a>"; }).join("") + '<a href="#" data-jump="seo">عناوين الصفحات لجوجل</a></nav>' +
      '<p class="hint">مش لاقي النص اللي عايز تعدّله هنا؟ تبويب <a href="#" data-open="anytext">«تعديل أي نص»</a> بيعدّل أي كلمة في أي صفحة.</p>' +
      SECTIONS.map(sectionHtml).join("") +
      '<details class="tx-sec" data-sec="seo"><summary><h2 style="display:inline;margin:0;font-size:17px">عناوين الصفحات لجوجل والمشاركة</h2></summary><p class="hint">العنوان (أحسن أقل من 60 حرف) والوصف (أحسن 70 لـ 160 حرف) اللي بيظهروا في جوجل وفي واتساب وفيسبوك لما حد يشارك الرابط. صفحات المحتوى وتواصل معنا وكارت عافية والزكاة عناوينها من تبويب «الصفحات».</p><div class="list" id="seo-list">' + seoHtml() + "</div></details>";
    seoPreview();
  }
  function seoPreview() {
    $$("[data-seo]", root).forEach(function (it) {
      var t = $('[data-s="title"]', it).value.trim(), d = $('[data-s="desc"]', it).value.trim(), n = $$("[data-n]", it);
      n[0].textContent = "(" + t.length + " حرف" + (t.length > 60 ? "، طويل وهيتقص في جوجل" : "") + ")";
      n[1].textContent = "(" + d.length + " حرف" + (d.length > 160 ? "، طويل وهيتقص" : d.length && d.length < 70 ? "، قصير شوية" : "") + ")";
      var url = "www.mersal-ngo.org" + ($("a", it).getAttribute("href") === "/" ? "" : $("a", it).getAttribute("href"));
      $(".tx-serp", it).innerHTML = '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-family:arial,sans-serif;direction:rtl">' +
        '<div style="font-size:12px;color:#4d5156" dir="ltr">' + esc(url) + '</div><div style="font-size:18px;color:#1a0dab;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.length > 62 ? t.slice(0, 60) + "…" : t || "العنوان") + "</div>" +
        '<div style="font-size:13px;color:#4d5156;line-height:1.5">' + esc(d.length > 162 ? d.slice(0, 160) + "…" : d || "الوصف") + "</div></div>";
    });
  }

  // fields -> data (numbers, amounts and checkboxes typed)
  function collect() {
    $$("[data-p]", root).forEach(function (el) {
      var t = el.dataset.t, v;
      if (t === "bool") v = el.checked;
      else if (t === "num") v = Math.max(0, Math.round(Number(el.value) || 0));
      else if (t === "amounts") v = el.value.replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x0660; }).split(/[^\d]+/).filter(Boolean).map(Number).filter(function (n) { return n > 0; });
      else v = t === "area" ? el.value.trim() : el.value.trim();
      setp(data, el.dataset.p, v);
    });
    if (seo) $$("[data-seo]", root).forEach(function (it) {
      var pg = seo.filter(function (x) { return x.id === it.dataset.seo; })[0];
      $$("[data-s]", it).forEach(function (el) { pg[el.dataset.s] = el.value.trim(); });
    });
  }
  function openSections() { return $$("details.tx-sec[open]", root).map(function (d) { return d.dataset.sec; }); }
  function rerender() {
    var open = openSections(), y = window.scrollY;
    render();
    $$("details.tx-sec", root).forEach(function (d) { d.open = open.indexOf(d.dataset.sec) >= 0; });
    window.scrollTo(0, y);
  }
  function problem() {
    var bad = "";
    (function walk(v, path) {
      if (bad) return;
      if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "." + i); });
      else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { walk(v[k], path ? path + "." + k : k); });
      else if (typeof v === "string") {
        var k = path.split(".").pop();
        if (/^(link|moreLink|branchesLink)$/.test(k) && !okLink(v)) bad = "رابط مش مسموح: " + v + " (لازم يبدأ بـ / أو https:// أو tel: أو sms:)";
        if (/^(image|imageSm)$/.test(k) && !okImg(v)) bad = "مسار صورة مش صحيح: " + v;
      }
    })(data, "");
    if (bad) return bad;
    var checks = [["home.quick", "التبرع السريع"], ["donate", "صفحة التبرع"]];
    for (var i = 0; i < checks.length; i++) {
      var o = get(data, checks[i][0]); if (!o) continue;
      if ((o.amounts || []).length < 2) return "اكتب مبلغين على الأقل في " + checks[i][1];
      if ((o.amounts || []).indexOf(o.default) < 0) return "المبلغ الافتراضي في " + checks[i][1] + " لازم يكون واحد من المبالغ";
    }
    return "";
  }

  // pictures: photos through the shared upload (big + small JPEG); logos stay PNG with their transparency, 20px tall on the site
  function dims(file) {
    return new Promise(function (res) { var img = new Image(), u = URL.createObjectURL(file); img.onload = function () { URL.revokeObjectURL(u); res({ w: img.naturalWidth, h: img.naturalHeight }); }; img.onerror = function () { URL.revokeObjectURL(u); res({ w: 0, h: 0 }); }; img.src = u; });
  }
  function logoPng(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth || 300, h = img.naturalHeight || 100, k = Math.min(1, 300 / w, 120 / h);
        var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res({ data: c.toDataURL("image/png").split(",")[1], w: c.width, h: c.height });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("الصورة دي مش بتفتح، جرّب PNG أو JPG")); };
      img.src = url;
    });
  }
  function uploadTo(btn) {
    var path = btn.dataset.up, owner = path.replace(/\.image$/, ""), sec = SECTIONS.filter(function (s) { return path.indexOf(s.path + ".") === 0; })[0];
    A.pick(false, btn.dataset.logo ? "logo-ways" : /^home\.hospital/.test(path) ? "hospital" : "about").then(function (files) {
      if (!files.length) return;
      A.busy(btn, true); btn.textContent = "جاري الرفع…";
      if (btn.dataset.logo) {
        var stem = "logo-" + (files[0].name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "way");
        return logoPng(files[0]).then(function (p) {
          return A.api("upload", { method: "POST", body: { files: [{ name: stem + ".png", data: p.data }], message: "admin: site texts logo" } }).then(function (d) {
            collect(); var o = get(data, owner); o.image = d.urls[0];
            if ("w" in o || "h" in o) { o.h = 20; o.w = Math.max(1, Math.round(20 * p.w / p.h)); }
            rerender(); A.toast("اترفع اللوجو، اضغط حفظ ونشر");
          });
        });
      }
      var size = (sec && sec.image) || { big: 1600, sm: 600 };
      return Promise.all([dims(files[0]), A.upload(files, size.big, size.sm)]).then(function (r) {
        collect(); var o = get(data, owner), d = r[0], k = d.w && d.h ? Math.min(1, size.big / Math.max(d.w, d.h)) : 1;
        o.image = r[1][0].url; o.imageSm = r[1][0].urlSm;
        if (d.w && d.h) { o.w = Math.round(d.w * k); o.h = Math.round(d.h * k); }
        rerender(); A.toast("اترفعت الصورة، اضغط حفظ ونشر");
      });
    }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(btn, false); });
  }

  A.register("texts", function () {
    root = $("#texts-root");
    root.innerHTML = '<p class="hint">جاري التحميل…</p>';
    Promise.all([A.api("data/texts"), A.api("data/donate").catch(function () { return {}; })]).then(function (r) {
      data = r[0] && typeof r[0] === "object" && !Array.isArray(r[0]) ? r[0] : {};
      banks = ((r[1] && r[1].banks) || []).filter(function (b) { return b && b.number; });
      loaded = JSON.stringify(data);
      render();
      A.api("seo").then(function (s) { collect(); seo = s.pages || []; seoLoaded = JSON.stringify(seo); rerender(); })
        .catch(function (e) { var box = $("#seo-list", root); if (box) box.innerHTML = '<p class="status bad">' + esc(e.message) + "</p>"; });
    }).catch(function (e) { root.innerHTML = '<p class="status bad">' + esc(e.status === 404 || /404/.test(e.message) ? "ملف data/texts.json مش موجود في الموقع." : e.message) + "</p>"; });

    root.addEventListener("input", function (e) { if (e.target.closest("[data-seo]")) seoPreview(); });
    root.addEventListener("change", function (e) {
      // the account picker fills an empty label with the bank's name and currency
      if (e.target.dataset && e.target.dataset.t === "bank") {
        var lbl = $('[data-p="home.quick.offlineLabel"]', root), b = banks.filter(function (x) { return x.number === e.target.value; })[0];
        if (lbl && b && !lbl.value.trim()) lbl.value = b.name + " - " + (b.currency || "");
      }
    });
    root.addEventListener("click", function (e) {
      var jump = e.target.closest("[data-jump]");
      if (jump) { e.preventDefault(); var d = root.querySelector('.tx-sec[data-sec="' + jump.dataset.jump + '"]'); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
      var op = e.target.closest("[data-open]"); if (op) { e.preventDefault(); A.openTab(op.dataset.open); return; }
      var up = e.target.closest("[data-up]"); if (up && data) { uploadTo(up); return; }
      var add = e.target.closest("[data-add]"), act = e.target.closest("[data-act]");
      if (!data || (!add && !act)) return;
      collect();
      if (add) {
        var base = add.dataset.add, sec = SECTIONS.filter(function (s) { return base.indexOf(s.path + ".") === 0; })[0];
        var l = sec && (sec.lists || []).filter(function (x) { return sec.path + "." + x.key === base; })[0];
        var arr = get(data, base); if (!Array.isArray(arr)) { arr = []; setp(data, base, arr); }
        arr.push(JSON.parse(JSON.stringify(l ? l.blank : {})));
        rerender(); return;
      }
      var listEl = act.closest("[data-list]"), list = get(data, listEl.dataset.list), i = +act.closest(".item").dataset.i;
      if (act.dataset.act === "del") { if (!confirm("حذف العنصر ده؟")) return; list.splice(i, 1); }
      else if (act.dataset.act === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
      else if (act.dataset.act === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      else return;
      rerender();
    });

    $("#save-texts").onclick = function () {
      if (!data) return;
      var b = this; collect();
      var bad = problem(); if (bad) return A.toast(bad, true);
      var tj = JSON.stringify(data), changedSeo = {};
      if (seo) {
        var before = JSON.parse(seoLoaded || "[]");
        seo.forEach(function (pg) {
          var old = before.filter(function (x) { return x.id === pg.id; })[0];
          if (!old || old.title !== pg.title || old.desc !== pg.desc || old.ogTitle !== pg.ogTitle || old.ogDesc !== pg.ogDesc) changedSeo[pg.id] = { title: pg.title, desc: pg.desc, ogTitle: pg.ogTitle, ogDesc: pg.ogDesc };
        });
        for (var id in changedSeo) if (!changedSeo[id].title || !changedSeo[id].desc) return A.toast("العنوان والوصف مطلوبين في كل صفحة", true);
      }
      if (tj === loaded && !Object.keys(changedSeo).length) return A.toast("مفيش تغييرات");
      A.busy(b, true);
      var chain = Promise.resolve();
      if (tj !== loaded) chain = chain.then(function () { return A.api("data/texts", { method: "PUT", body: { data: data, message: "admin: site texts" } }).then(function () { loaded = tj; }); });
      if (Object.keys(changedSeo).length) chain = chain.then(function () { return A.api("seo", { method: "PUT", body: { pages: changedSeo } }).then(function (r) { seo = r.pages || seo; seoLoaded = JSON.stringify(seo); }); });
      chain.then(function () { rerender(); A.published(); }).catch(function (e) { A.toast(e.message, true); }).then(function () { A.busy(b, false); });
    };
  });
})();
