// Public request forms, one script for all of them. Every <form data-form="..."> on the page is wired up:
//   volunteer  /volunteer.html (تطوع معنا)        help    /help.html (طلب مساعدة)
//   transfer   /donate.html "سجّل تبرعك"         pickup  /donate.html "مندوب لحد البيت"
//   contact    /contact.html "ابعتلنا رسالة" (falls back to an e-mail link when the API cannot take it)
// A form finds its alert and success boxes by id from data-alert / data-success (default #form-alert / #form-success);
// inside the success box: [data-ref] or #ref, [data-wa] or #wa, [data-copy-ref] or #copy-ref, [data-again] or #again, [data-recap].
// A box with data-show-if="name=value|value2" only shows, validates and sends its fields while that control has one of those values.
// Validates inline, then POSTs JSON to /api/forms/{type} (rules mirror api/src/lib/forms.js).
// Bot protection: a hidden "website" field (honeypot) and the seconds spent on the page ("t"), checked here and again on the server.
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll("form[data-form]"));
  if (!forms.length) return;
  var SITE = window.MERSAL_SITE || {};
  var HOTLINE = SITE.hotline || "19340";
  var WA = String(SITE.whatsapp || SITE.phone || "01200002870").replace(/\D/g, "").replace(/^0/, "20");
  var PREFIX = { volunteer: "MV", help: "MH", transfer: "MT", pickup: "MP", contact: "MC" };
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SMOOTH = REDUCED ? "auto" : "smooth";
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
  // "5,000" / "٥٠٠٠٫٥" -> 5000.5; NaN unless a plain amount with at most 2 decimals
  function num(v) { var s = latin(v).replace(/[\s,٬]/g, "").replace("٫", "."); return /^\d{1,9}(\.\d{1,2})?$/.test(s) ? parseFloat(s) : NaN; }
  // whole numbers only (age, income), like toInt on the server: "25.5" or "١٬٥٠٠٫٥" is NaN, "١٬٥٠٠" is 1500
  function int(v) { var s = latin(v).replace(/[\s,٬]/g, ""); return /^\d{1,9}$/.test(s) ? parseInt(s, 10) : NaN; }
  var fmt = function (n) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }); };
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function day(offset) { var d = new Date(); d.setDate(d.getDate() + (offset || 0)); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function longDay(v) { try { return new Date(v + "T00:00:00").toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }); } catch (x) { return v; } }
  var GOVS = ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];
  var DONOR = {}; try { DONOR = JSON.parse(localStorage.getItem("mersalDonor") || "{}") || {}; } catch (x) {} // saved by js/donate.js
  var LEGACY_FOR = { hospital: "p30", oncology: "p31", p4: "p31", p5: "p31" }; // p4/p5: pages of the oncology centre (p31)
  var pagesJson = null; // /data/pages.json, fetched once for the titles of ?for=p<id> purposes

  forms.forEach(setup);
  transferCards();

  function setup(form) {
    var TYPE = form.getAttribute("data-form"), started = Date.now(), MIN_SECONDS = 3;
    $$("select[data-govs]", form).forEach(function (s) { GOVS.forEach(function (g) { var o = document.createElement("option"); o.value = g; o.textContent = g; s.appendChild(o); }); });
    // date limits: data-day="past" (a transfer that already happened, up to 2 years back) / "future" (today .. 60 days)
    $$('input[data-day="past"]', form).forEach(function (i) { i.max = day(0); i.min = day(-730); });
    $$('input[data-day="future"]', form).forEach(function (i) { i.min = day(0); i.max = day(60); });
    // bank names come from /data/donate.json (the console's "الحسابات البنكية"); the options in the html are the fallback
    $$("select[data-banks]", form).forEach(fillBanks);

    // ---------- rules: field name -> function(value) returning "" or the error text ----------
    function req(min, msg) { return function (v) { return String(v).length < min ? msg : ""; }; }
    function phoneRule(optional) { return function (v) { if (!v) return optional ? "" : "اكتب رقم الموبايل"; return isPhone(normPhone(v)) ? "" : "اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)"; }; }
    function amountRule(v) { if (!v) return "اكتب المبلغ"; var n = num(v); return n > 0 && n <= 10000000 ? "" : "اكتب مبلغ صحيح أكبر من صفر"; }
    var emailRule = function (v) { return v && !isEmail(v) ? "البريد الإلكتروني مش صحيح" : ""; };
    var none = function () { return ""; };
    var RULES = {
      volunteer: {
        name: req(2, "اكتب اسمك"),
        phone: phoneRule(false),
        age: function (v) { var n = int(v); if (isNaN(n)) return v ? "اكتب رقم صحيح من غير كسور" : "السن من 16 إلى 80 سنة"; return n >= 16 && n <= 80 ? "" : "السن من 16 إلى 80 سنة"; },
        email: emailRule,
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
        income: function (v) { if (!v) return ""; var n = int(v); if (isNaN(n)) return "اكتب رقم صحيح من غير كسور"; return n <= 1000000 ? "" : "الدخل الشهري رقم من 0 إلى 1,000,000"; },
        consent: function (v) { return v ? "" : "لازم توافق على استخدام بياناتك عشان نقدر نتواصل معاك"; }
      },
      transfer: {
        method: req(1, "اختار طريقة التبرع"),
        bank: req(2, "اختار البنك اللي حوّلت عليه"),
        amount: amountRule,
        currency: req(1, "اختار العملة"),
        date: function (v) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "اختار تاريخ التحويل";
          if (v > day(0)) return "تاريخ التحويل مينفعش يكون في المستقبل";
          return v < day(-730) ? "التاريخ ده قديم أوي - كلمنا على " + HOTLINE : "";
        },
        txRef: none,
        purpose: none,
        caseCode: function (v) { return !v || /^[A-Za-z0-9-]{1,20}$/.test(latin(v).replace(/\s+/g, "")) ? "" : "كود الحالة حروف إنجليزي وأرقام بس (لحد 20)"; },
        name: req(2, "اكتب اسمك"),
        phone: phoneRule(false),
        email: emailRule,
        notes: none
      },
      pickup: {
        kind: req(1, "اختار نوع التبرع"),
        amount: amountRule,
        purpose: none,
        goods: req(3, "اكتب إيه اللي حابب تتبرع بيه"),
        gov: req(1, "اختار المحافظة"),
        area: req(2, "اكتب المنطقة أو الحي"),
        address: req(8, "اكتب العنوان بالتفصيل (الشارع ورقم العمارة والدور)"),
        date: function (v) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "اختار اليوم المناسب للتحصيل";
          if (v < day(0)) return "اختار يوم من النهارده أو بعده";
          return v > day(60) ? "اختار يوم خلال الشهرين الجايين" : "";
        },
        slot: req(1, "اختار الوقت المناسب"),
        name: req(2, "اكتب اسمك"),
        phone: phoneRule(false),
        altPhone: phoneRule(true),
        notes: none
      },
      contact: {
        name: req(2, "اكتب اسمك"),
        phone: function (v) { if (!v && !valueOf("email")) return "اكتب رقم موبايل أو إيميل عشان نرد عليك"; return phoneRule(true)(v); },
        email: function (v) { var pb = boxOf("phone"); if (pb && pb.classList.contains("invalid")) setTimeout(function () { check("phone"); }, 0); return emailRule(v); },
        message: req(10, "اكتب رسالتك (10 حروف على الأقل)")
      }
    }[TYPE] || {};
    var NAMES = Object.keys(RULES);

    function valueOf(name) {
      var el = form.elements[name];
      if (!el) return "";
      if (el.type === "checkbox") return el.checked;                                   // single checkbox (consent)
      if (el.length && !el.tagName) {
        if (el[0] && el[0].type === "radio") return String(el.value || "");            // radio group
        return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); // checkbox group
      }
      return String(el.value || "").trim();
    }
    function boxOf(name) { return $('[data-field="' + name + '"]', form); }
    function controlOf(name) { var el = form.elements[name]; return el && el.length && !el.tagName ? el[0] : el; }
    // a field inside a data-show-if box that is switched off right now
    function off(name) { var box = boxOf(name); return !!(box && box.closest("[data-show-if][hidden]")); }
    function setError(name, msg) {
      var box = boxOf(name); if (!box) return;
      var err = $(".f-err", box), ctl = controlOf(name), v = valueOf(name);
      var has = Array.isArray(v) ? v.length > 0 : v === true || (typeof v === "string" && v.length > 0);
      box.classList.toggle("invalid", !!msg);
      box.classList.toggle("valid", !msg && has);
      if (err) { err.id = err.id || (form.id || TYPE) + "-err-" + name; err.textContent = msg || ""; }
      if (ctl && ctl.setAttribute) {
        if (msg) { ctl.setAttribute("aria-invalid", "true"); if (err) ctl.setAttribute("aria-describedby", err.id); }
        else { ctl.removeAttribute("aria-invalid"); ctl.removeAttribute("aria-describedby"); }
      }
    }
    function check(name) {
      if (off(name)) { setError(name, ""); return true; }
      var msg = RULES[name] ? RULES[name](valueOf(name)) : ""; setError(name, msg); return !msg;
    }
    // a short shake (css .shake) on the fields that stop a submit; restarted each time
    function shake(name) { var box = boxOf(name); if (!box) return; box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); }
    function clearAll() { NAMES.forEach(function (n) { setError(n, ""); var b = boxOf(n); if (b) { b.classList.remove("invalid", "valid"); delete b.dataset.touched; } }); }

    NAMES.forEach(function (name) {
      var box = boxOf(name); if (!box) return;
      box.addEventListener("focusout", function (e) {
        var v = valueOf(name), has = Array.isArray(v) ? v.length : v;
        if (e.target.type === "tel" && has) { var n = normPhone(e.target.value); if (isPhone(n)) e.target.value = n; }
        if (e.target.hasAttribute && e.target.hasAttribute("data-amount") && has) { var a = num(e.target.value); if (a > 0) e.target.value = fmt(a); }
        if (has || box.dataset.touched) { box.dataset.touched = "1"; check(name); }
      });
      box.addEventListener("change", function () { box.dataset.touched = "1"; check(name); });
      box.addEventListener("input", function () { if (box.classList.contains("invalid")) check(name); });
    });

    // data-show-if boxes follow their control (bank only for bank transfers, amount vs. description for a pickup)
    var conds = $$("[data-show-if]", form).map(function (el) {
      var p = el.getAttribute("data-show-if").split("=");
      return { el: el, name: p[0], vals: (p[1] || "").split("|") };
    });
    function syncShow() {
      conds.forEach(function (c) {
        var on = c.vals.indexOf(String(valueOf(c.name))) > -1;
        if (c.el.hidden !== on) return;
        c.el.hidden = !on;
        if (on) { c.el.classList.remove("sif-in"); void c.el.offsetWidth; c.el.classList.add("sif-in"); } // not "reveal": site.css uses that for scroll reveal (opacity 0 until .in)
        else [c.el].concat($$("[data-field]", c.el)).filter(function (b) { return b.hasAttribute("data-field"); }).forEach(function (b) { setError(b.getAttribute("data-field"), ""); b.classList.remove("invalid", "valid"); delete b.dataset.touched; });
      });
    }
    form.addEventListener("change", function (e) { if (e.target.name && conds.some(function (c) { return c.name === e.target.name; })) syncShow(); });
    syncShow();
    form.mersalSync = syncShow;
    form.mersalClear = clearAll;

    // "other" reveals its text field; textareas show a counter
    var otherBox = boxOf("howOther");
    if (otherBox && TYPE === "volunteer") {
      var syncOther = function () { var on = valueOf("how").indexOf("other") > -1; otherBox.hidden = !on; if (!on) { form.elements.howOther.value = ""; setError("howOther", ""); } else setTimeout(function () { form.elements.howOther.focus({ preventScroll: true }); }, 50); };
      $$('input[name="how"]', form).forEach(function (i) { i.addEventListener("change", syncOther); });
    }
    var counters = $$("[data-count]", form).map(function (c) {
      var ta = document.getElementById(c.getAttribute("data-count")); if (!ta) return null;
      var max = Number(ta.getAttribute("maxlength")) || 0;
      var upd = function () { c.textContent = ta.value.length + " / " + max; c.classList.toggle("over", ta.value.length >= max); };
      ta.addEventListener("input", upd); upd();
      return upd;
    }).filter(Boolean);

    // donate page: the name / phone / email the card form remembered on this device, and ?for=<purpose>
    function prefill() {
      if (TYPE !== "transfer" && TYPE !== "pickup") return;
      ["name", "phone", "email"].forEach(function (k) { var el = form.elements[k]; if (el && !el.value && DONOR[k]) el.value = String(DONOR[k]).slice(0, Number(el.getAttribute("maxlength")) || 120); });
      var want = new URLSearchParams(location.search).get("for") || "", sel = form.elements.purpose;
      if (Object.prototype.hasOwnProperty.call(LEGACY_FOR, want)) want = LEGACY_FOR[want];
      want = want.replace(/[^\w-]/g, "");
      if (!want || !sel || !sel.querySelector) return;
      if (sel.querySelector('option[value="' + want + '"]')) { sel.value = want; return; }
      // a project page (p<id>) that is not in the short list: add it, named like the page, and select it
      if (!/^p\d{1,4}$/.test(want)) return;
      pagesJson = pagesJson || fetch("/data/pages.json").then(function (r) { return r.json(); }).catch(function () { return {}; });
      pagesJson.then(function (pages) {
        var pg = pages && pages[want.slice(1)], card = document.querySelector('#purpose option[value="' + want + '"]');
        var title = String((card && card.textContent) || (pg && pg.title) || "").trim();
        if (!title || sel.querySelector('option[value="' + want + '"]')) return;
        var o = document.createElement("option"); o.value = want; o.textContent = title; sel.appendChild(o);
        var box = boxOf("purpose");
        if (!(box && box.dataset.touched) && (sel.value === "general" || !sel.value)) sel.value = want;
      });
    }
    prefill();

    // ---------- submit ----------
    var alertBox = document.getElementById(form.getAttribute("data-alert") || "form-alert");
    var success = document.getElementById(form.getAttribute("data-success") || "form-success");
    var btn = $('[type="submit"]', form);
    var refEl = $("[data-ref], #ref", success), waEl = $("[data-wa], #wa", success), copyBtn = $("[data-copy-ref], #copy-ref", success), againEl = $("[data-again], #again", success), recapEl = $("[data-recap]", success);
    function busy(on) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.textContent; btn.textContent = on ? "جاري الإرسال…" : btn.dataset.t; }
    function showAlert(html) { if (!alertBox) return; alertBox.innerHTML = '<div class="alert err" role="alert">' + html + "</div>"; alertBox.hidden = false; alertBox.scrollIntoView({ behavior: SMOOTH, block: "center" }); }
    function focusField(name) {
      var box = boxOf(name), ctl = box && $("input:not([type=hidden]), select, textarea", box);
      if (box) box.scrollIntoView({ behavior: SMOOTH, block: "center" });
      if (ctl) setTimeout(function () { ctl.focus({ preventScroll: true }); }, 250);
    }
    function payload() {
      var d = {};
      NAMES.forEach(function (n) { d[n] = off(n) ? "" : valueOf(n); });
      if (d.phone) d.phone = normPhone(d.phone);
      if (d.altPhone) d.altPhone = normPhone(d.altPhone);
      if (d.amount) d.amount = latin(d.amount).replace(/[\s,٬]/g, "").replace("٫", ".");
      if (d.caseCode) d.caseCode = latin(d.caseCode).replace(/\s+/g, "").toUpperCase();
      d.website = (form.elements.website && form.elements.website.value) || "";
      d.t = Math.round((Date.now() - started) / 1000);
      return d;
    }
    // contact form: the same message as an e-mail to the address in the site details (fallback when the API fails)
    function mailto(d) {
      return "mailto:" + SITE.email + "?subject=" + encodeURIComponent("رسالة من الموقع - " + (d.name || "")) +
        "&body=" + encodeURIComponent((d.message || "") + "\n\n" + (d.name || "") + (d.phone ? "\n" + d.phone : "") + (d.email ? "\n" + d.email : ""));
    }
    function optText(name) { var s = form.elements[name]; return s && s.options && s.selectedIndex > -1 ? s.options[s.selectedIndex].textContent.trim() : ""; }
    // the parts of one line on the success screen that repeats what was registered
    function recap(d) {
      if (TYPE === "transfer") return [fmt(num(d.amount)) + " " + optText("currency"), optText("method") + (d.bank ? " - " + d.bank : ""), d.date && longDay(d.date)].filter(Boolean);
      if (TYPE === "pickup") return [d.kind === "money" ? "فلوس: " + fmt(num(d.amount)) + " جنيه" : "تبرع عيني", d.date && longDay(d.date), optText("slot"), d.area].filter(Boolean);
      return [];
    }
    function fakeRef() {
      var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
      for (var i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
      return (PREFIX[TYPE] || "MV") + "-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + s;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (alertBox) alertBox.hidden = true;
      var bad = NAMES.filter(function (n) { return !check(n); });
      if (bad.length) { bad.forEach(shake); focusField(bad[0]); if (window.mersalTap) window.mersalTap(20); return; }
      var d = payload();
      // honeypot filled or submitted faster than any person could: show "success" and send nothing
      if (d.website || d.t < MIN_SECONDS) { showSuccess(fakeRef(), d); return; }
      busy(true);
      var ac = window.AbortController ? new AbortController() : null, timer = ac && setTimeout(function () { ac.abort(); }, 20000);
      fetch("/api/forms/" + TYPE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), signal: ac ? ac.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { j.status = r.status; throw j; } return j; }); })
        .then(function (j) { showSuccess(j.ref, d); })
        .catch(function (err) {
          var keys = err && err.errors ? Object.keys(err.errors).filter(function (k) { return boxOf(k); }) : [];
          if (keys.length) {
            keys.forEach(function (k) { setError(k, err.errors[k]); shake(k); });
            focusField(keys[0]);
          } else {
            var msg = err && err.status ? err.message : "مفيش اتصال بالإنترنت أو الخدمة مش متاحة دلوقتي.";
            showAlert("<b>" + esc(msg || "تعذّر إرسال الطلب") + "</b><br>جرّب تاني بعد شوية، أو كلمنا على الخط الساخن <a href=\"tel:" + esc(HOTLINE) + "\">" + esc(HOTLINE) + "</a>." +
              (TYPE === "contact" && SITE.email ? '<br>أو <a href="' + esc(mailto(d)) + '">ابعت رسالتك على الإيميل ' + esc(SITE.email) + "</a>." : ""));
          }
        })
        .then(function () { clearTimeout(timer); busy(false); });
    });

    var WA_TEXT = {
      volunteer: "السلام عليكم، قدمت طلب تطوع على موقع مرسال. رقم الطلب: ",
      help: "السلام عليكم، قدمت طلب مساعدة على موقع مرسال. رقم الطلب: ",
      transfer: "السلام عليكم، سجلت تبرعي على موقع مرسال ومرفق صورة إيصال التحويل. رقم الطلب: ",
      pickup: "السلام عليكم، طلبت مندوب لحد البيت من موقع مرسال. رقم الطلب: ",
      contact: "السلام عليكم، بعتلكم رسالة من موقع مرسال. رقم الرسالة: "
    };
    function showSuccess(ref, d) {
      form.hidden = true; success.hidden = false;
      refEl.textContent = ref;
      var parts = recap(d || {});
      if (recapEl) {
        recapEl.textContent = "";
        parts.forEach(function (t) { var sp = document.createElement("span"); sp.textContent = t; recapEl.appendChild(sp); });
        recapEl.hidden = !parts.length;
      }
      var text = (WA_TEXT[TYPE] || WA_TEXT.volunteer) + ref + (TYPE === "transfer" && parts.length ? "\n" + parts.join(" - ") : "");
      if (waEl) waEl.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
      try { localStorage.setItem("mersalRequest:" + TYPE, JSON.stringify({ ref: ref, at: Date.now() })); } catch (x) {}
      success.scrollIntoView({ behavior: SMOOTH, block: "start" });
      var h = $("h2, h3", success); if (h && h.hasAttribute("tabindex")) h.focus({ preventScroll: true });
      if (window.mersalTap) window.mersalTap(12);
    }
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var b = this, ref = refEl.textContent, label = b.querySelector("span") || b;
      var done = function () {
        b.classList.add("done"); label.textContent = "تم النسخ"; if (window.mersalTap) window.mersalTap(8);
        clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove("done"); label.textContent = "نسخ"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ref).then(done, function () {});
      else { var r = document.createRange(); r.selectNodeContents(refEl); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand("copy"); done(); } catch (x) {} }
    });
    if (againEl) againEl.addEventListener("click", function (e) {
      e.preventDefault();
      form.reset(); clearAll(); if (otherBox && TYPE === "volunteer") otherBox.hidden = true;
      counters.forEach(function (u) { u(); });
      prefill(); syncShow();
      started = Date.now(); success.hidden = true; form.hidden = false;
      form.scrollIntoView({ behavior: SMOOTH, block: "start" });
    });
  }

  function fillBanks(sel) {
    fetch("/data/donate.json").then(function (r) { return r.json(); }).then(function (d) {
      var seen = {}, names = (d.banks || []).map(function (b) { return b && String(b.name || "").trim(); })
        .filter(function (n) { if (!n || seen[n]) return false; seen[n] = 1; return true; });
      if (!names.length) return;
      var keep = sel.value, other = sel.querySelector('option[value="بنك آخر"]');
      $$("option", sel).forEach(function (o) { if (o.value && o !== other) o.remove(); });
      names.forEach(function (n) { var o = document.createElement("option"); o.value = n; o.textContent = n; sel.insertBefore(o, other || null); });
      sel.value = keep && (seen[keep] || keep === "بنك آخر") ? keep : "";
    }).catch(function () {});
  }

  // donate.html: the "حوّلت؟ سجّل تبرعك" cards in the bank and wallets tabs share one transfer form (#transfer-box).
  // A card's button moves the form under that card, preselects its method (data-method) and opens / closes it.
  function transferCards() {
    var box = document.getElementById("transfer-box"); if (!box) return;
    var form = $("form[data-form]", box), btns = $$("[data-open-transfer]"), current = null;
    function sync() {
      btns.forEach(function (b) {
        var on = !box.hidden && b.closest("[data-slot]").contains(box);
        b.setAttribute("aria-expanded", on ? "true" : "false");
        b.closest("[data-slot]").classList.toggle("open", on);
        var t = b.querySelector("[data-label]"); if (t) t.textContent = on ? "إخفاء الفورم" : t.getAttribute("data-label");
      });
    }
    function preset(method) {
      var sel = form.elements.method;
      if (sel && method && sel.querySelector('option[value="' + method + '"]')) { sel.value = method; if (form.mersalSync) form.mersalSync(); }
    }
    btns.forEach(function (b) {
      var t = b.querySelector("[data-label]"); if (t) t.setAttribute("data-label", t.textContent);
      b.addEventListener("click", function () {
        var slot = b.closest("[data-slot]");
        if (!box.hidden && slot.contains(box)) { box.hidden = true; sync(); return; }
        if (!slot.contains(box) && form.mersalClear) form.mersalClear(); // a fresh start under another card (values stay)
        slot.appendChild(box); box.hidden = false; current = b;
        if (!form.hidden) preset(b.getAttribute("data-method"));
        sync();
        setTimeout(function () { slot.scrollIntoView({ behavior: SMOOTH, block: "start" }); }, 30); // the card stays on top of its form
        if (window.mersalTap) window.mersalTap(8);
      });
    });
    // "تسجيل تبرع تاني" resets the form: put back the method of the card it is open under
    form.addEventListener("reset", function () { setTimeout(function () { if (current) preset(current.getAttribute("data-method")); }, 0); });
    sync();
  }
})();
