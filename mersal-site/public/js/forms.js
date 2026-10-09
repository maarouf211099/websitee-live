// Public forms: /volunteer.html (تطوع معنا) and /help.html (طلب مساعدة). One script for both pages;
// <form data-form="volunteer|help"> says which. Validates inline, then POSTs JSON to /api/forms/{type}.
// Bot protection: a hidden "website" field (honeypot) and the seconds spent on the page ("t"), checked here and again on the server.
(function () {
  var form = document.querySelector("form[data-form]");
  if (!form) return;
  var TYPE = form.getAttribute("data-form"), started = Date.now(), MIN_SECONDS = 3;
  var SITE = window.MERSAL_SITE || {};
  var HOTLINE = SITE.hotline || "19340";
  var WA = String(SITE.whatsapp || SITE.phone || "01200002870").replace(/\D/g, "").replace(/^0/, "20");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }

  // ---------- helpers shared with api/src/lib/forms.js ----------
  var AR = "٠١٢٣٤٥٦٧٨٩", FA = "۰۱۲۳۴۵۶۷۸۹";
  function latin(v) { return String(v == null ? "" : v).replace(/[٠-٩۰-۹]/g, function (c) { var i = AR.indexOf(c); return String(i >= 0 ? i : FA.indexOf(c)); }); }
  function normPhone(v) {
    var s = latin(v).replace(/[^\d+]/g, "");
    if (s.indexOf("+20") === 0) s = "0" + s.slice(3);
    else if (s.indexOf("0020") === 0) s = "0" + s.slice(4);
    else if (/^20\d{10}$/.test(s)) s = "0" + s.slice(2);
    else if (/^1\d{9}$/.test(s)) s = "0" + s;
    return s.replace(/\D/g, "");
  }
  var isPhone = function (s) { return /^01[0125]\d{8}$/.test(s); };
  var isEmail = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); };
  var GOVS = ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];
  $$("select[data-govs]", form).forEach(function (s) { GOVS.forEach(function (g) { var o = document.createElement("option"); o.value = g; o.textContent = g; s.appendChild(o); }); });

  // ---------- rules: field name -> function(value) returning "" or the error text ----------
  function req(min, msg) { return function (v) { return String(v).length < min ? msg : ""; }; }
  function phoneRule(optional) { return function (v) { if (!v) return optional ? "" : "اكتب رقم الموبايل"; return isPhone(normPhone(v)) ? "" : "اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)"; }; }
  var none = function () { return ""; };
  var RULES = {
    volunteer: {
      name: req(2, "اكتب اسمك"),
      phone: phoneRule(false),
      age: function (v) { var n = parseInt(latin(v), 10); return n >= 16 && n <= 80 ? "" : "السن من 16 إلى 80 سنة"; },
      email: function (v) { return v && !isEmail(v) ? "البريد الإلكتروني مش صحيح" : ""; },
      city: req(2, "اكتب المدينة أو المنطقة"),
      how: function (v) { return v.length ? "" : "اختار طريقة واحدة على الأقل"; },
      howOther: function (v) { return valueOf("how").indexOf("other") > -1 && !v ? "اكتب إزاي تحب تساعد" : ""; },
      availability: req(1, "اختار الوقت المناسب ليك"),
      message: none
    },
    help: {
      patient: req(2, "اكتب اسم المريض"),
      caseType: req(1, "اختار نوع الحالة"),
      hospital: none,
      description: req(10, "اكتب وصف مختصر للحالة (10 حروف على الأقل)"),
      requester: req(2, "اكتب اسم مقدم الطلب"),
      relation: req(1, "اختار صلة القرابة"),
      phone: phoneRule(false),
      altPhone: phoneRule(true),
      gov: req(1, "اختار المحافظة"),
      city: none,
      income: function (v) { if (!v) return ""; var n = parseInt(latin(v).replace(/[\s,]/g, ""), 10); return n >= 0 && n <= 1000000 ? "" : "الدخل الشهري رقم من 0 إلى 1,000,000"; },
      consent: function (v) { return v ? "" : "لازم توافق على استخدام بياناتك عشان نقدر نتواصل معاك"; }
    }
  }[TYPE] || {};
  var NAMES = Object.keys(RULES);

  function valueOf(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el.type === "checkbox") return el.checked;                                   // single checkbox (consent)
    if (el.length && !el.tagName) return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); // checkbox group
    return String(el.value || "").trim();
  }
  function boxOf(name) { return $('[data-field="' + name + '"]', form); }
  function controlOf(name) { var el = form.elements[name]; return el && el.length && !el.tagName ? el[0] : el; }
  function setError(name, msg) {
    var box = boxOf(name); if (!box) return;
    var err = $(".f-err", box), ctl = controlOf(name), v = valueOf(name);
    var has = Array.isArray(v) ? v.length > 0 : v === true || (typeof v === "string" && v.length > 0);
    box.classList.toggle("invalid", !!msg);
    box.classList.toggle("valid", !msg && has);
    if (err) { err.id = err.id || "err-" + name; err.textContent = msg || ""; }
    if (ctl && ctl.setAttribute) {
      if (msg) { ctl.setAttribute("aria-invalid", "true"); if (err) ctl.setAttribute("aria-describedby", err.id); }
      else { ctl.removeAttribute("aria-invalid"); ctl.removeAttribute("aria-describedby"); }
    }
  }
  function check(name) { var msg = RULES[name] ? RULES[name](valueOf(name)) : ""; setError(name, msg); return !msg; }
  // a short shake (css .shake) on the fields that stop a submit; restarted each time
  function shake(name) { var box = boxOf(name); if (!box) return; box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); }
  function clearAll() { NAMES.forEach(function (n) { var b = boxOf(n); if (b) { b.classList.remove("invalid", "valid"); delete b.dataset.touched; } setError(n, ""); }); }

  NAMES.forEach(function (name) {
    var box = boxOf(name); if (!box) return;
    box.addEventListener("focusout", function (e) {
      var v = valueOf(name), has = Array.isArray(v) ? v.length : v;
      if (e.target.type === "tel" && has) { var n = normPhone(e.target.value); if (isPhone(n)) e.target.value = n; }
      if (has || box.dataset.touched) { box.dataset.touched = "1"; check(name); }
    });
    box.addEventListener("change", function () { box.dataset.touched = "1"; check(name); });
    box.addEventListener("input", function () { if (box.classList.contains("invalid")) check(name); });
  });

  // "other" reveals its text field; textareas show a counter
  var otherBox = boxOf("howOther");
  if (otherBox) {
    var syncOther = function () { var on = valueOf("how").indexOf("other") > -1; otherBox.hidden = !on; if (!on) { form.elements.howOther.value = ""; setError("howOther", ""); } else setTimeout(function () { form.elements.howOther.focus({ preventScroll: true }); }, 50); };
    $$('input[name="how"]', form).forEach(function (i) { i.addEventListener("change", syncOther); });
  }
  $$("[data-count]", form).forEach(function (c) {
    var ta = document.getElementById(c.getAttribute("data-count")); if (!ta) return;
    var max = Number(ta.getAttribute("maxlength")) || 0;
    var upd = function () { c.textContent = ta.value.length + " / " + max; c.classList.toggle("over", ta.value.length >= max); };
    ta.addEventListener("input", upd); upd();
  });

  // ---------- submit ----------
  var btn = $('[type="submit"]', form), alertBox = $("#form-alert"), success = $("#form-success");
  function busy(on) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.textContent; btn.textContent = on ? "جاري الإرسال…" : btn.dataset.t; }
  function showAlert(html) { alertBox.innerHTML = '<div class="alert err" role="alert">' + html + "</div>"; alertBox.hidden = false; alertBox.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function focusField(name) {
    var box = boxOf(name), ctl = box && $("input:not([type=hidden]), select, textarea", box);
    if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
    if (ctl) setTimeout(function () { ctl.focus({ preventScroll: true }); }, 250);
  }
  function payload() {
    var d = {};
    NAMES.forEach(function (n) { d[n] = valueOf(n); });
    if (d.phone) d.phone = normPhone(d.phone);
    if (d.altPhone) d.altPhone = normPhone(d.altPhone);
    d.website = (form.elements.website && form.elements.website.value) || "";
    d.t = Math.round((Date.now() - started) / 1000);
    return d;
  }
  function fakeRef() {
    var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return (TYPE === "volunteer" ? "MV" : "MH") + "-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + s;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alertBox.hidden = true;
    var bad = NAMES.filter(function (n) { return !check(n); });
    if (bad.length) { bad.forEach(shake); focusField(bad[0]); if (window.mersalTap) window.mersalTap(20); return; }
    var d = payload();
    // honeypot filled or submitted faster than any person could: show "success" and send nothing
    if (d.website || d.t < MIN_SECONDS) { showSuccess(fakeRef()); return; }
    busy(true);
    var ac = window.AbortController ? new AbortController() : null, timer = ac && setTimeout(function () { ac.abort(); }, 20000);
    fetch("/api/forms/" + TYPE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), signal: ac ? ac.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { j.status = r.status; throw j; } return j; }); })
      .then(function (j) { showSuccess(j.ref); })
      .catch(function (err) {
        if (err && err.errors && Object.keys(err.errors).length) {
          Object.keys(err.errors).forEach(function (k) { setError(k, err.errors[k]); shake(k); });
          focusField(Object.keys(err.errors)[0]);
        } else {
          var msg = err && err.status ? err.message : "مفيش اتصال بالإنترنت أو الخدمة مش متاحة دلوقتي.";
          showAlert("<b>" + esc(msg || "تعذّر إرسال الطلب") + "</b><br>جرّب تاني بعد شوية، أو كلمنا على الخط الساخن <a href=\"tel:" + HOTLINE + "\">" + HOTLINE + "</a>.");
        }
      })
      .then(function () { clearTimeout(timer); busy(false); });
  });

  function showSuccess(ref) {
    form.hidden = true; success.hidden = false;
    $("#ref").textContent = ref;
    var text = (TYPE === "volunteer" ? "السلام عليكم، قدمت طلب تطوع على موقع مرسال. رقم الطلب: " : "السلام عليكم، قدمت طلب مساعدة على موقع مرسال. رقم الطلب: ") + ref;
    $("#wa").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
    try { localStorage.setItem("mersalRequest:" + TYPE, JSON.stringify({ ref: ref, at: Date.now() })); } catch (x) {}
    success.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.mersalTap) window.mersalTap(12);
  }
  $("#copy-ref").addEventListener("click", function () {
    var b = this, ref = $("#ref").textContent, label = b.querySelector("span") || b;
    var done = function () {
      b.classList.add("done"); label.textContent = "تم النسخ"; if (window.mersalTap) window.mersalTap(8);
      clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove("done"); label.textContent = "نسخ"; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ref).then(done, function () {});
    else { var r = document.createRange(); r.selectNodeContents($("#ref")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand("copy"); done(); } catch (x) {} }
  });
  $("#again").addEventListener("click", function (e) {
    e.preventDefault();
    form.reset(); clearAll(); if (otherBox) otherBox.hidden = true;
    $$("[data-count]", form).forEach(function (c) { c.textContent = "0 / " + (document.getElementById(c.getAttribute("data-count")) || {}).getAttribute("maxlength"); });
    started = Date.now(); success.hidden = true; form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
