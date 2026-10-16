// Image-size guide for the graphic designer: one list of every image slot the console can set (and the share image),
// used for (1) the hint line under each upload button (MersalImgSizes.hint), (2) the non-blocking "ratio is far from the
// recommended one" warning after a file is picked (MersalImgSizes.check, called from MersalAdmin.pick) and (3) the tab
// "مقاسات الصور للمصمم" with a copy-as-text button. Sizes come from how the public site draws each picture
// (css/home.css, desktop.css, mobile.css, site.css, news.css) and from the resize limits in admin.js / the tab modules.
(function () {
  var A = window.MersalAdmin, $ = A.$, esc = A.esc;
  var JPG = "JPG أو WebP", PNG = "PNG أو SVG بخلفية شفافة";

  // w x h = recommended export (2x for retina, never above what the console keeps); lo/hi = ratio range with no warning;
  // minW = below ~60% of this width the picture is soft on screen; safe = dashed box in the visual (percent, left/top origin)
  var SLOTS = [
    { id: "hero", lead: "البانر", name: "بانر السلايدر (الرئيسية)", where: "الرئيسية > السلايدر > «رفع صورة»", w: 1920, h: 570, ratio: "≈ 3.4:1 (عريض)", fmt: JPG, kb: 300, lo: 2.6, hi: 4.4, minW: 1400,
      safe: { x: 0, y: 8, w: 46, h: 84 },
      tip: "الموضوع والوشوش في أول 883 بكسل من الشمال بس",
      note: "الموقع بيقص أول 46% من العرض من الشمال (حوالي 883×570 بكسل) ويعرضه جنب العنوان على الكمبيوتر والموبايل؛ الباقي على اليمين مش بيظهر في السلايدر العادي. حط الوشوش والموضوع الأساسي جوه الـ883 بكسل دي، وعلى الموبايل بيظهر منها حوالي النص (من بكسل 220 لـ 660 تقريباً). ممنوع نص مكتوب جوه الصورة: العنوان والسطر والزرار بيتكتبوا من اللوحة وبيظهروا فوق أسفل الصورة (أسفل 40% سيبه من غير تفاصيل مهمة)." },
    { id: "hero-m", lead: "صورة الموبايل", name: "صورة الموبايل للسلايدر (اختياري)", where: "الرئيسية > السلايدر > «صورة الموبايل»", w: 1440, h: 1800, ratio: "4:5 (طولي)", fmt: JPG, kb: 300, lo: 0.6, hi: 1.0, minW: 900,
      safe: { x: 12, y: 6, w: 76, h: 54 },
      tip: "الوشوش في النص وفوق، وأسفل الصورة فاضي للعنوان",
      note: "بتتعرض في كارت طولي على الموبايل (تقريباً 4:5.4) وبتتقص من الأطراف حسب «مكان الصورة». أسفل 40% بيغطيه العنوان والزرار، فخلّي الموضوع في الـ60% اللي فوق ونص العرض اللي في النص. اللوحة مبتكبّرش الصورة: أقصى طول 1800 بكسل." },
    { id: "campaign", name: "صورة حملة التبرع", where: "الرئيسية > حملات التبرع > «رفع صورة»", w: 900, h: 900, ratio: "1:1 (مربع)", fmt: JPG, kb: 150, lo: 0.7, hi: 1.3, minW: 600,
      safe: { x: 10, y: 10, w: 80, h: 80 },
      tip: "بتظهر كاملة جوه مربع على الموبايل",
      note: "الكارت مربع على الموبايل وبتظهر الصورة كاملة جواه (من غير قص)، وعلى الكمبيوتر بتتقص لنفس المربع. سيب هامش 10% من كل ناحية لأن بعض العروض (5:4) بتقص شوية من فوق وتحت. الحد الأقصى 900 بكسل (900×900 كفاية للريتينا). لو الصورة 4:5 (720×900) تمام برضه." },
    { id: "project", name: "صورة مشروع (شريط المشاريع)", where: "الرئيسية > مشاريع مرسال > «رفع صورة»", w: 1200, h: 750, ratio: "16:10", fmt: JPG, kb: 150, lo: 1.25, hi: 2.2, minW: 600,
      safe: { x: 8, y: 8, w: 84, h: 84 },
      tip: "اللوحة بتصغّرها لعرض 900 تلقائياً",
      note: "الكارت بيعرض الصورة 16:10 وبتتقص من الأطراف. الصور المربعة أو الطولية (أقل من 1.25:1) أو الطويلة جداً بتظهر كاملة على خلفية سادة بدل ما تتقص، وده مناسب للوجوهات والرسومات. اللوحة بتصغّر أي صورة لأقصى 900 بكسل." },
    { id: "album", name: "صور الألبومات", where: "الألبومات > «+ إضافة صور» (لحد 20 صورة مرة واحدة)", w: 1600, h: 1067, ratio: "3:2 (أي اتجاه)", fmt: JPG, kb: 250, lo: 0.6, hi: 2.4, minW: 1000,
      safe: { x: 19, y: 0, w: 62, h: 100 },
      tip: "الصورة الصغيرة بتتقص من النص",
      note: "الصورة الكبيرة بتتفتح كاملة في العارض (أي نسبة)، لكن الصورة المصغّرة في الشبكة بتتقص من النص لـ16:10 على الكمبيوتر ولمربع على الموبايل. خلّي الموضوع في النص (حوالي 62% من العرض) عشان ميتقصش. اللوحة بتصغّر لأقصى 1600 بكسل." },
    { id: "news", name: "صورة خبر / قصة", where: "الأخبار > «رفع صورة»", w: 1200, h: 750, ratio: "16:10", fmt: JPG, kb: 200, lo: 1.25, hi: 2.0, minW: 800,
      safe: { x: 22, y: 0, w: 56, h: 100 },
      tip: "في بعض الكروت بتتقص 3:4 من النص",
      note: "الكارت الرئيسي 16:10، وكروت «الأحدث» الصغيرة بتقصها 3:4 (طولي) من النص. فخلّي الموضوع في النص (حوالي 56% من العرض). من غير وشوش مرضى أو أسماء." },
    { id: "about", name: "صورة «من نحن»", where: "نصوص الموقع > «من نحن» > الصورة > «رفع»", w: 1600, h: 1200, ratio: "4:3", fmt: JPG, kb: 250, lo: 1.1, hi: 1.9, minW: 1000,
      safe: { x: 0, y: 20, w: 100, h: 60 },
      tip: "على التابلت والموبايل بتتقص 16:10 من فوق وتحت",
      note: "4:3 على الكمبيوتر الكبير، وعلى الشاشات الأصغر بتبقى 16:10 أو 16:9 (بتتقص من فوق وتحت). خلّي الموضوع في الـ60% اللي في النص رأسياً. عليها تعليق (عنوان وسطر) بيظهر فوق أسفل الصورة، فسيب أسفلها من غير تفاصيل." },
    { id: "hospital", name: "صورة المستشفى", where: "نصوص الموقع > «مستشفى مرسال للأطفال» > الصورة > «رفع»", w: 1200, h: 900, ratio: "4:3", fmt: JPG, kb: 200, lo: 1.1, hi: 1.9, minW: 800,
      safe: { x: 0, y: 20, w: 100, h: 60 },
      tip: "على التابلت والموبايل بتتقص 16:9 من فوق وتحت",
      note: "4:3 على الكمبيوتر، و16:9 على الشاشات الأصغر (بتتقص من فوق وتحت)، وعليها شارة الحالة. الموضوع في الـ60% اللي في النص رأسياً. أقصى عرض بتحتفظ بيه اللوحة 1200 بكسل." },
    { id: "page", name: "صورة جوه صفحة / مقال", where: "الصفحات > محرر الصفحة > زرار الصورة", w: 1400, h: 933, ratio: "3:2", fmt: JPG, kb: 250, lo: 0.6, hi: 2.4, minW: 800,
      tip: "بتتحط في سياق النص بعرض العمود",
      note: "بتتحط جوه النص بعرض العمود وبتتصغّر على الموبايل من غير قص (أي نسبة تمام). اللوحة بتصغّر لأقصى 1400 بكسل. الأفضل أفقية 3:2." },
    { id: "abroad", name: "صورة بيانات حساب «من خارج مصر»", where: "بيانات الموقع > التبرع من خارج مصر > «رفع صورة الحساب»", w: 1000, h: 1000, ratio: "1:1 (مربع)", fmt: JPG, kb: 200, lo: 0.6, hi: 1.6, minW: 600,
      tip: "الكلام جواها لازم يبقى مقروء",
      note: "بتتعرض كمصغّرة 48 بكسل وبتتفتح بالحجم الكامل لما الزائر يضغط عليها، فالمهم إن الكلام (البنك، IBAN، SWIFT) يبقى كبير ومقروء. من غير قص؛ أقصى 1000 بكسل." },
    { id: "logo-ways", name: "لوجو طرق التبرع (كارت / شريط)", where: "نصوص الموقع > «طرق التبرع» و«ليه تطمن لمرسال» > اللوجو > «رفع»", w: 300, h: 120, ratio: "≈ 2.5:1", fmt: PNG, kb: 30, lo: 1.2, hi: 6, logo: true,
      safe: { x: 4, y: 8, w: 92, h: 84 },
      tip: "بيظهر بارتفاع 20 لـ 30 بكسل بس",
      note: "بيظهر صغير جداً (ارتفاع 20 بكسل على الموبايل و30 على الكمبيوتر). اقصّه على حدود اللوجو من غير هوامش كبيرة، وخلّيه واضح بخطوط سميكة. اللوحة بتحفظه PNG وبتصغّره لأقصى 300×120 بكسل." },
    { id: "partner", name: "لوجو بنك / محفظة (شريط الشركاء)", where: "شريط الإعلان والشركاء > «رفع لوجو»", w: 480, h: 160, ratio: "3:1", fmt: PNG, kb: 40, lo: 1.2, hi: 6, logo: true,
      safe: { x: 4, y: 8, w: 92, h: 84 },
      tip: "بيظهر بارتفاع أقصاه 44 بكسل",
      note: "بيظهر بارتفاع أقصاه 44 بكسل وعرض متغيّر. بخلفية شفافة وهوامش صغيرة. لو SVG اللوحة بتحوّله PNG (أقصى 480×160 بكسل)." },
    { id: "bank", name: "شعار بنك (حسابات التبرع)", where: "بيانات الموقع > الحسابات البنكية > خانة «شعار البنك» (مسار، مفيش زرار رفع)", w: 248, h: 108, ratio: "≈ 2.3:1", fmt: PNG, kb: 20, lo: 1.2, hi: 6, logo: true, noUpload: true,
      safe: { x: 5, y: 10, w: 90, h: 80 },
      tip: "الشعار بيتحط كمسار ملف، ابعته للمطوّر",
      note: "بيتعرض في إطار أبيض 124×54 بكسل على الكمبيوتر (112×50 على الموبايل) ويتحط جواه من غير قص. الخانة بتاخد مسار زي /img/banks/cib.png أو رابط https، ومفيش رفع من اللوحة: ابعت الملف للمطوّر يضيفه." },
    { id: "og", name: "صورة المشاركة (واتساب / فيسبوك)", where: "مش بتترفع من اللوحة (في كود الصفحات: /img/hero.jpg)", w: 1200, h: 630, ratio: "≈ 1.91:1", fmt: JPG, kb: 300, lo: 1.5, hi: 2.3, noUpload: true,
      safe: { x: 8, y: 10, w: 84, h: 80 },
      tip: "",
      note: "الصورة اللي بتظهر لما حد يشارك لينك الموقع. الموجودة حالياً 1600×429 (عريضة زيادة وبتتقص). خلّيها 1200×630 والكلام والشعار جوه الـ84% اللي في النص. تغييرها بيتم من المطوّر." }
  ];
  var BY = {}; SLOTS.forEach(function (s) { BY[s.id] = s; });

  function num(n) { return '<bdi dir="ltr">' + n + "</bdi>"; }
  function short(r) { return r.replace(/ \(.*/, ""); }
  function sizeLine(s) { return "المقاس المقترح: " + num(s.w + "×" + s.h) + " بكسل (" + num(short(s.ratio)) + ") · " + s.fmt + " · أقل من " + num(s.kb) + " ك.ب"; }
  // hint line under a button / field: <small class="imghint">…</small>
  function hint(id) {
    var s = BY[id]; if (!s) return "";
    return '<small class="imghint" data-slot="' + id + '"><span class="ih-ico" aria-hidden="true">▣</span> ' + (s.lead ? "<b>" + esc(s.lead) + ":</b> " : "") + sizeLine(s) + (s.tip ? " — " + esc(s.tip) : "") + "</small>";
  }

  // ---- non-blocking warning after a file is picked ----
  var warnT, warnEl;
  function warn(msg) {
    if (!warnEl) { warnEl = document.createElement("div"); warnEl.className = "toast warn"; warnEl.setAttribute("role", "status"); document.body.appendChild(warnEl); }
    warnEl.textContent = msg; warnEl.hidden = false; clearTimeout(warnT); warnT = setTimeout(function () { warnEl.hidden = true; }, 8000);
  }
  function dims(file) {
    return new Promise(function (res) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(u); res({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { URL.revokeObjectURL(u); res(null); };
      img.src = u;
    });
  }
  // never blocks: the upload goes on whatever is said here
  function check(files, id) {
    var s = BY[id]; if (!s || !files || !files.length) return;
    Promise.all(files.slice(0, 20).map(dims)).then(function (ds) {
      var off = 0, small = 0, first = null;
      ds.forEach(function (d) {
        if (!d || !d.w || !d.h) return;
        var r = d.w / d.h;
        if (s.lo && (r < s.lo || r > s.hi)) { off++; first = first || d; }
        else if (s.minW && !s.logo && d.w < s.minW * 0.6) { small++; first = first || d; }
      });
      if (off) warn((files.length > 1 ? off + " من الصور نسبتها" : "الصورة دي نسبتها") + " مختلفة عن المقترحة (" + short(s.ratio) + " · " + s.w + "×" + s.h + ")، ممكن تتقص. اتأكد إن الموضوع في المنطقة الآمنة.");
      else if (small) warn((files.length > 1 ? small + " من الصور" : "الصورة") + " صغيرة (" + first.w + "×" + first.h + ") والمقترح " + s.w + "×" + s.h + "، وممكن تبان مش واضحة.");
    });
  }

  // ---- the tab ----
  function box(s) {
    var W = 132, H = 78, r = s.w / s.h, bw = Math.min(W, H * r), bh = bw / r;
    var safe = s.safe ? '<i class="sz-safe" style="left:' + s.safe.x + "%;top:" + s.safe.y + "%;width:" + s.safe.w + "%;height:" + s.safe.h + '%"></i>' : "";
    return '<div class="sz-box" style="width:' + bw.toFixed(1) + "px;height:" + bh.toFixed(1) + 'px" role="img" aria-label="شكل النسبة ' + esc(short(s.ratio)) + '">' + safe + "</div>";
  }
  var GENERAL = [
    "صدّر كل صورة بالمقاس المقترح بالظبط (ده مقاس الريتينا 2x، مفيش داعي لأكبر منه). اللوحة بتصغّر أي صورة أكبر من الحد الأقصى وبتحفظها JPG، ومبتكبّرش الصور الصغيرة.",
    "الصور العادية JPG جودة 80 لـ85% أو WebP بنظام ألوان sRGB. ما تبعتش PNG فيه شفافية للصور العادية: الخلفية الشفافة بتبقى سودا لما تتحوّل JPG.",
    "ما تكتبش أي نص جوه الصور (عنوان، سعر، زرار): النصوص بتتكتب من اللوحة عشان تتقري على كل الشاشات. الاستثناء صورة بيانات الحساب.",
    "المربع المنقّط في الرسمة هو المنطقة الآمنة: حط جواه الوشوش والموضوع المهم عشان ميتقصش على الموبايل أو التابلت.",
    "اللوجوهات PNG أو SVG بخلفية شفافة، مقصوصة على حدود اللوجو، وواضحة لما تتصغّر لارتفاع 20 لـ44 بكسل."
  ];
  function render() {
    var root = $("#sizes-root"); if (!root) return;
    root.innerHTML =
      '<p class="hint">كل مكان في الموقع بيتحط فيه صورة من اللوحة، بالمقاس اللي المصمم يشتغل عليه. المقاسات مبنية على طريقة عرض الموقع الحقيقية، وتحت كل زرار رفع في اللوحة هتلاقي سطر بنفس المقاس.</p>' +
      '<div class="sz-actions"><button type="button" class="btn btn-gold" id="sz-copy">نسخ الجدول</button><span class="hint" style="margin:0">بينسخ نسخة نصية جاهزة للصق في واتساب وإرسالها للمصمم.</span></div>' +
      '<div class="sz-tips"><h2>قواعد عامة للمصمم</h2><ul>' + GENERAL.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul></div>" +
      '<table class="sz-table"><thead><tr><th scope="col">الصورة</th><th scope="col">النسبة</th><th scope="col">المقاس</th><th scope="col">الصيغة والحجم</th><th scope="col">المنطقة الآمنة والملاحظات</th></tr></thead><tbody>' +
      SLOTS.map(function (s, i) {
        return '<tr id="sz-' + s.id + '"><th scope="row" data-label="الصورة"><span class="sz-n">' + (i + 1) + "</span> " + esc(s.name) + "<small>" + esc(s.where) + "</small></th>" +
          '<td data-label="النسبة">' + box(s) + "<small>" + esc(s.ratio) + "</small></td>" +
          '<td data-label="المقاس"><b class="sz-px">' + num(s.w + "×" + s.h) + "</b> بكسل</td>" +
          '<td data-label="الصيغة والحجم">' + esc(s.fmt) + "<br>أقل من " + num(s.kb) + " ك.ب</td>" +
          '<td data-label="المنطقة الآمنة">' + esc(s.note) + "</td></tr>";
      }).join("") + "</tbody></table>";
    $("#sz-copy").onclick = copyText;
  }
  function plain() {
    var out = ["*مقاسات الصور - موقع مرسال*", "", "قواعد عامة:"];
    GENERAL.forEach(function (g) { out.push("- " + g); });
    SLOTS.forEach(function (s, i) {
      out.push("", "*" + (i + 1) + ") " + s.name + "*",
        "المقاس: " + s.w + "×" + s.h + " بكسل (" + short(s.ratio) + ")",
        "الصيغة: " + s.fmt + " - أقل من " + s.kb + " ك.ب",
        "المنطقة الآمنة والملاحظات: " + s.note);
    });
    return out.join("\n");
  }
  function copyText() {
    var t = plain(), ok = function () { A.toast("اتنسخ الجدول ✓ ألصقه في واتساب"); };
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;top:0;opacity:0"; document.body.appendChild(ta); ta.select();
      var done = false; try { done = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); if (done) ok(); else A.toast("مقدرتش أنسخ تلقائياً، حدّد الجدول وانسخه يدوي", true);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fallback); else fallback();
  }

  window.MersalImgSizes = { slots: SLOTS, hint: hint, check: check, plain: plain };
  // the hint under the page editor's picture button is static markup (index.html)
  var pg = $("#hint-page-img"); if (pg) pg.innerHTML = hint("page");
  A.register("sizes", render);
})();
