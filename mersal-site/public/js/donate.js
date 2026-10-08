// Donate page: tabs, copy buttons and the Banque Misr Hosted Checkout (v100) flow.
(function () {
  // Fill these in to show wallet / InstaPay numbers on the page. Empty = hidden.
  var WALLETS = [
    // { name: "إنستاباي", value: "mersal@instapay" },
    // { name: "فودافون كاش", value: "010xxxxxxxx" }
  ];

  var KEY = "mersalPayment";
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
      history.replaceState(null, "", "#" + t.getAttribute("aria-controls"));
    });
  });
  var hash = location.hash.replace("#", "");
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
      return '<div class="bank"><div><b>' + w.name + "</b><code>" + w.value + '</code></div><button class="copy" data-copy="' + w.value + '">نسخ</button></div>';
    }).join("");
  }

  // ---------- online payment ----------
  var form = document.getElementById("pay-form"), btn = document.getElementById("pay-btn");
  var result = document.getElementById("pay-result");
  var q = new URLSearchParams(location.search);
  var amount = document.getElementById("amount");
  amount.value = q.get("amount") || "";
  if (q.get("for")) document.getElementById("purpose").value = q.get("for");

  form.querySelectorAll(".amounts button").forEach(function (b) {
    b.addEventListener("click", function () {
      form.querySelectorAll(".amounts button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); amount.value = b.dataset.v;
    });
  });

  function show(kind, html) { result.innerHTML = '<div class="alert ' + kind + '">' + html + "</div>"; result.scrollIntoView({ behavior: "smooth", block: "center" }); }
  window.mersalPayError = function () { show("err", "حدث خطأ أثناء عملية الدفع. حاول مرة أخرى أو اتصل بالدعم الفني 01099316592."); btn.disabled = false; };
  window.mersalPayCancel = function () { show("info", "تم إلغاء عملية الدفع."); btn.disabled = false; };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    btn.disabled = true;
    var body = {
      amount: amount.value,
      purpose: document.getElementById("purpose").value,
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim()
    };
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
      .then(function (d) {
        try { localStorage.setItem(KEY, JSON.stringify({ orderId: d.orderId, successIndicator: d.successIndicator })); } catch (x) {}
        // v67+ Hosted Checkout: only the session id goes to configure(); the order is built server-side.
        Checkout.configure({ session: { id: d.sessionId } });
        Checkout.showPaymentPage();
      })
      .catch(function (err) {
        show("err", (err && err.message) ? err.message : "تعذّر بدء عملية الدفع. حاول مرة أخرى.");
        btn.disabled = false;
      });
  });

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
          show("ok", "شكراً لك! تم استلام تبرعك بمبلغ <b>" + new Intl.NumberFormat("ar-EG").format(o.amount) + " جنيه</b> بنجاح.<br>" +
            'رقم العملية: <code dir="ltr">' + o.orderId + "</code><br>احتفظ برقم العملية للرجوع إليه.");
        } else {
          show("err", "لم تكتمل عملية الدفع (حالة الطلب: " + (o.status || "غير معروفة") + "). لم يتم خصم أي مبلغ، ويمكنك المحاولة مرة أخرى.");
        }
      })
      .catch(function () { show("err", "تعذّر التأكد من عملية الدفع. لو تم خصم المبلغ تواصل معنا على 19340 برقم العملية: " + saved.orderId); });
  }
})();
