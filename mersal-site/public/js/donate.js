// Donate page: tabs, copy buttons and the card donation stepper.
// Card payment mode comes from js/layout.js (MERSAL_SITE.payMode):
//   "off"  - card tab hidden
//   "demo" - full flow, but it stops at the bank gateway (nothing is charged)
//   "live" - Banque Misr Hosted Checkout v100 through /api/checkout
(function () {
  // Fill these in to show wallet / InstaPay numbers on the page. Empty = hidden.
  var WALLETS = [
    // { name: "إنستاباي", value: "mersal@instapay" },
    // { name: "فودافون كاش", value: "010xxxxxxxx" }
  ];

  var KEY = "mersalPayment";
  var MODE = (window.MERSAL_SITE && window.MERSAL_SITE.payMode) || "off";
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }

  // ---------- tabs ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function openTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      openTab(t.getAttribute("aria-controls"));
      history.replaceState(null, "", location.search + "#" + t.getAttribute("aria-controls"));
    });
  });
  var hash = location.hash.replace("#", "");
  if (MODE === "off" && (hash === "online" || !hash)) hash = "bank";
  if (!hash) hash = "online";
  if (document.getElementById(hash) && document.getElementById(hash).getAttribute("role") === "tabpanel") openTab(hash);

  document.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(function () {
        b.textContent = "تم النسخ ✓"; setTimeout(function () { b.textContent = "نسخ"; }, 1500);
      });
    });
  });
  if (WALLETS.length) {
    document.getElementById("wallet-numbers").innerHTML = WALLETS.map(function (w) {
      return '<div class="bank"><div><b>' + esc(w.name) + "</b><code>" + esc(w.value) + '</code></div><button class="copy" data-copy="' + esc(w.value) + '">نسخ</button></div>';
    }).join("");
  }
  if (MODE === "off") return;

  // ---------- stepper ----------
  var form = document.getElementById("pay-form");
  var result = document.getElementById("pay-result");
  var amount = document.getElementById("amount"), purpose = document.getElementById("purpose");
  var q = new URLSearchParams(location.search);
  var LEGACY = { hospital: "p30", oncology: "p31", cases: "general" };

  if (q.get("amount")) amount.value = Math.max(10, parseInt(q.get("amount"), 10) || 500);
  syncChips();

  // Purpose list: general/zakat/sadaqa + every project and service imported from the old site
  Promise.all([
    fetch("/content.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("/data/menu.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (res) {
    var groups = {}, seen = {};
    (res[1] || []).forEach(function (top) {
      (top.children || []).forEach(function (k) {
        var m = /^\/p\/(\d+)\.html$/.exec(k.href || "");
        if (!m || seen[m[1]] || /طرق التبرع|تطوع|فروع/.test(k.title)) return;
        seen[m[1]] = 1;
        (groups[top.title] = groups[top.title] || []).push({ v: "p" + m[1], t: k.title });
      });
    });
    ((res[0] || {}).projects || []).forEach(function (p) {
      var m = /^\/p\/(\d+)\.html$/.exec(p.link || "");
      if (!m || seen[m[1]]) return;
      seen[m[1]] = 1;
      (groups["مشاريع أخرى"] = groups["مشاريع أخرى"] || []).push({ v: "p" + m[1], t: p.title });
    });
    purpose.insertAdjacentHTML("beforeend", Object.keys(groups).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (o) { return '<option value="' + o.v + '">' + esc(o.t) + "</option>"; }).join("") + "</optgroup>";
    }).join(""));
    var want = q.get("for"); want = LEGACY[want] || want;
    if (want && purpose.querySelector('option[value="' + want + '"]')) purpose.value = want;
    updateImpact();
  });

  function syncChips() {
    form.querySelectorAll(".amounts button").forEach(function (x) { x.classList.toggle("on", x.dataset.v === String(amount.value)); });
  }
  form.querySelectorAll(".amounts button").forEach(function (b) {
    b.addEventListener("click", function () { amount.value = b.dataset.v; syncChips(); updateImpact(); });
  });
  amount.addEventListener("input", function () { syncChips(); updateImpact(); });
  purpose.addEventListener("change", updateImpact);

  // What a donation can do (figures from the old site's pages)
  function updateImpact() {
    var a = Number(amount.value) || 0, msg = "";
    if (purpose.value === "p30" && a >= 25000) msg = "تبرعك يساوي متر وقف خيري في مستشفى مرسال للأطفال 🏥";
    else if (purpose.value === "p30" && a >= 1000) msg = "تبرعك يساوي " + fmt.format(Math.floor(a / 1000)) + " سهم عام في مستشفى مرسال 🏥";
    else if (purpose.value === "p30" && a >= 500) msg = "تبرعك يساوي سهم أجهزة طبية في مستشفى مرسال 🏥";
    else if (purpose.value === "p37" && a >= 100) msg = "سهم التبرع للعلاج الشهري 100 جنيه، تبرعك = " + fmt.format(Math.floor(a / 100)) + " سهم 💊";
    else if (a >= 5000) msg = "تبرعك ممكن يغطي العلاج الشهري لمريض كامل 💚";
    else if (a >= 500) msg = "تبرعك بيساهم في كشف وتحاليل لمريض غير قادر 🩺";
    else if (a >= 10) msg = "كل جنيه بيفرق مع مريض محتاج 💚";
    document.getElementById("impact").textContent = msg;
  }

  var stepEls = form.querySelectorAll(".step"), dots = form.querySelectorAll(".steps li"), cur = 1;
  function go(n) {
    cur = n;
    stepEls.forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    dots.forEach(function (d) { var k = Number(d.dataset.step); d.classList.toggle("on", k === n); d.classList.toggle("done", k < n); });
    if (n === 3) fillSummary();
    var first = form.querySelector('.step[data-step="' + n + '"] input, .step[data-step="' + n + '"] select');
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    if (first && n === 2) setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
  }
  function valid(n) {
    var ok = true;
    form.querySelectorAll('.step[data-step="' + n + '"] input[required]').forEach(function (i) { if (ok && !i.reportValidity()) ok = false; });
    if (ok && n === 1 && (Number(amount.value) < 10 || Number(amount.value) > 1000000)) { amount.setCustomValidity("المبلغ من 10 إلى 1,000,000 جنيه"); amount.reportValidity(); amount.setCustomValidity(""); ok = false; }
    if (ok && n === 2) {
      var ph = document.getElementById("phone");
      if (ph.value.replace(/[^\d]/g, "").length < 10) { ph.setCustomValidity("اكتب رقم موبايل صحيح"); ph.reportValidity(); ph.setCustomValidity(""); ok = false; }
    }
    return ok;
  }
  form.querySelectorAll("[data-next]").forEach(function (b) { b.addEventListener("click", function () { if (valid(cur)) go(cur + 1); }); });
  form.querySelectorAll("[data-prev]").forEach(function (b) { b.addEventListener("click", function () { go(cur - 1); }); });
  dots.forEach(function (d) { d.addEventListener("click", function () { var k = Number(d.dataset.step); if (k < cur) go(k); }); });

  function purposeText() { var o = purpose.options[purpose.selectedIndex]; return o ? o.textContent : ""; }
  function freq() { return (form.querySelector('input[name="freq"]:checked') || {}).value || "once"; }
  function fillSummary() {
    var a = Number(amount.value), anon = document.getElementById("anon").checked;
    document.getElementById("summary").innerHTML =
      "<dt>المبلغ</dt><dd><b>" + fmt.format(a) + " جنيه</b>" + (freq() === "monthly" ? " شهرياً" : "") + "</dd>" +
      "<dt>تبرع لـ</dt><dd>" + esc(purposeText()) + "</dd>" +
      "<dt>المتبرع</dt><dd>" + (anon ? "فاعل خير" : esc(document.getElementById("name").value)) + "</dd>" +
      "<dt>الموبايل</dt><dd dir=\"ltr\">" + esc(document.getElementById("phone").value) + "</dd>";
    document.getElementById("pay-amount").textContent = fmt.format(a) + " جنيه";
  }

  function show(kind, html) { result.innerHTML = '<div class="alert ' + kind + '">' + html + "</div>"; result.scrollIntoView({ behavior: "smooth", block: "center" }); }
  var gw = document.getElementById("gateway"), btn = document.getElementById("pay-btn");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cur !== 3) { if (valid(cur)) go(cur + 1); return; }
    btn.disabled = true;
    stepEls.forEach(function (s) { s.hidden = true; });
    gw.hidden = false; gw.classList.remove("stopped");
    document.getElementById("gw-title").textContent = "جاري التحويل لبوابة بنك مصر…";
    document.getElementById("gw-body").innerHTML = "";
    if (MODE === "demo") return setTimeout(stopAtGateway, 1600);
    startLivePayment();
  });

  // Demo: the flow ends here, before any card data or charge
  function stopAtGateway() {
    gw.classList.add("stopped");
    document.getElementById("gw-title").textContent = "بوابة الدفع الإلكتروني قيد التفعيل";
    document.getElementById("gw-body").innerHTML =
      "<p>وصلت لآخر خطوة قبل صفحة بنك مصر. الدفع بالبطاقة هيتفعّل قريب جداً، <b>ولم يتم خصم أي مبلغ</b>.</p>" +
      '<p>تقدر تكمل تبرعك بـ <b>' + fmt.format(Number(amount.value)) + " جنيه</b> دلوقتي بطريقة من دول:</p>" +
      '<div class="gw-alt">' +
        '<a class="btn btn-teal" href="tel:19340">📞 مندوب لحد البيت 19340</a>' +
        '<a class="btn btn-ghost-teal" href="#bank" data-tab="bank">🏦 تحويل بنكي CIB</a>' +
        '<a class="btn btn-ghost-teal" href="#wallets" data-tab="wallets">📱 فوري 9200 / إنستاباي</a>' +
      "</div>" +
      '<button type="button" class="link-btn" id="gw-back">← رجوع لتعديل التبرع</button>';
    gw.querySelectorAll("[data-tab]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); openTab(a.dataset.tab); document.querySelector(".tabs").scrollIntoView({ behavior: "smooth" }); });
    });
    document.getElementById("gw-back").addEventListener("click", function () { gw.hidden = true; btn.disabled = false; go(3); });
  }

  // Live: Banque Misr Hosted Checkout (v100)
  function startLivePayment() {
    var s = document.createElement("script");
    s.src = "https://banquemisr.gateway.mastercard.com/static/checkout/checkout.min.js";
    s.setAttribute("data-error", "mersalPayError");
    s.setAttribute("data-cancel", "mersalPayCancel");
    s.onload = function () {
      var anon = document.getElementById("anon").checked;
      fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.value, purpose: purpose.value,
          name: anon ? "فاعل خير" : document.getElementById("name").value.trim(),
          email: document.getElementById("email").value.trim(), phone: document.getElementById("phone").value.trim()
        })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
        .then(function (d) {
          try { localStorage.setItem(KEY, JSON.stringify({ orderId: d.orderId, successIndicator: d.successIndicator })); } catch (x) {}
          Checkout.configure({ session: { id: d.sessionId } });
          Checkout.showPaymentPage();
        })
        .catch(function (err) { window.mersalPayError(err); });
    };
    document.head.appendChild(s);
  }
  window.mersalPayError = function (err) {
    gw.hidden = true; btn.disabled = false; go(3);
    show("err", (err && err.message) ? esc(err.message) : "حدث خطأ أثناء عملية الدفع. حاول مرة أخرى أو اتصل بالدعم الفني 01099316592.");
  };
  window.mersalPayCancel = function () { gw.hidden = true; btn.disabled = false; go(3); show("info", "تم إلغاء عملية الدفع."); };

  // Back from the bank: ?hcoReturn=1&resultIndicator=...
  if (q.get("hcoReturn") === "1") {
    openTab("online");
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (x) {}
    history.replaceState(null, "", location.pathname + "#online");
    if (!saved.orderId) { show("err", "لم نجد عملية دفع محفوظة على هذا المتصفح. لو تم خصم المبلغ تواصل معنا على 19340."); return; }
    show("info", "جارٍ التأكد من عملية الدفع مع البنك…");
    fetch("/api/verify?orderId=" + encodeURIComponent(saved.orderId))
      .then(function (r) { return r.json(); })
      .then(function (o) {
        if (o.paid) {
          try { localStorage.removeItem(KEY); } catch (x) {}
          form.hidden = true;
          show("ok", "شكراً لك! تم استلام تبرعك بمبلغ <b>" + fmt.format(o.amount) + " جنيه</b> بنجاح.<br>" +
            'رقم العملية: <code dir="ltr">' + esc(o.orderId) + "</code><br>احتفظ برقم العملية للرجوع إليه.");
        } else {
          show("err", "لم تكتمل عملية الدفع (حالة الطلب: " + esc(o.status || "غير معروفة") + "). لم يتم خصم أي مبلغ، ويمكنك المحاولة مرة أخرى.");
        }
      })
      .catch(function () { show("err", "تعذّر التأكد من عملية الدفع. لو تم خصم المبلغ تواصل معنا على 19340 برقم العملية: " + esc(saved.orderId)); });
  }
})();
