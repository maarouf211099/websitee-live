// Donate page: tabs, copy buttons and the card donation stepper.
// Card payment mode comes from js/layout.js (MERSAL_SITE.payMode):
//   "off"  - card tab hidden
//   "demo" - full flow, but it stops before the gateway (nothing is charged, nothing is recorded)
//   "live" - /api/checkout starts the payment at the gateway chosen in the console (MERSAL_SITE.payProvider):
//            "app"    -> { checkoutUrl }: Paymob through the Mersal app's backend, opened inside this page (the app's own
//                        return page is not this site); /api/verify?gw=app is asked every 4 s until paid or failed
//            "paymob" -> { redirect }: the donor goes to Paymob's Unified Checkout and comes back to ?gw=paymob&…
//            "mpgs"   -> { sessionId }: Banque Misr Hosted Checkout v100, back to ?hcoReturn=1
//            not saved yet -> whatever the server answers (Banque Misr until a gateway is saved)
//            { unavailable } (the gateway's settings are not in Azure yet) -> the demo's "other ways" panel
(function () {
  var KEY = "mersalPayment", DONOR_KEY = "mersalDonor";
  // PSA-22: explicit smooth scrolls follow the visitor's reduced-motion setting (like forms.js and impact.js)
  var SMOOTH = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  // A paid donation (verified by /api/verify) on this device: unlocks /community.html and the "هداياك" tab.
  // The demo gateway charges nothing, so it never records anything here (community.js also ignores old demo rows).
  function recordDonation(d) {
    if (!d || d.demo) return;
    try {
      var list = JSON.parse(localStorage.getItem("mersalDonations") || "[]");
      if (d.orderId && list.some(function (x) { return x.orderId === d.orderId; })) return;
      var opt = purpose && purpose.selectedOptions && purpose.selectedOptions[0];
      d.purposeTitle = d.purposeTitle || (opt ? opt.textContent.trim() : "");
      d.purposeLink = d.purposeLink || (/^p\d+$/.test(d.purpose || "") ? "/p/" + d.purpose.slice(1) + ".html" : "/#campaigns-sec");
      d.date = d.date || new Date().toISOString();
      list.push(d); localStorage.setItem("mersalDonations", JSON.stringify(list.slice(-50)));
      localStorage.setItem("mersalDonated", "1");
    } catch (x) {}
  }
  // Remember the donor's name/phone/email on this device so the next donation is two taps
  (function rememberDonor() {
    var ids = ["name", "phone", "email"], els = ids.map(function (i) { return document.getElementById(i); });
    if (els.some(function (e) { return !e; })) return;
    var saved = {}; try { saved = JSON.parse(localStorage.getItem(DONOR_KEY) || "{}"); } catch (x) {}
    els.forEach(function (e, i) { if (!e.value && saved[ids[i]]) e.value = saved[ids[i]]; });
    els.forEach(function (e) { e.addEventListener("change", function () {
      var o = {}; els.forEach(function (x, i) { if (x.value.trim()) o[ids[i]] = x.value.trim(); });
      try { localStorage.setItem(DONOR_KEY, JSON.stringify(o)); } catch (x) {}
    }); });
  })();
  var MODE = (window.MERSAL_SITE && window.MERSAL_SITE.payMode) || "off";
  var PROVIDER = (window.MERSAL_SITE && window.MERSAL_SITE.payProvider) || "";
  // what the donor is told about the gateway (Banque Misr wording unchanged; neutral while the server picks the gateway)
  // (the lock is an icon next to this text in donate.html: .pay-lock)
  var GW = PROVIDER === "mpgs" ? { secure: "دفع آمن عبر بنك مصر", page: "صفحة بنك مصر", go: "جاري التحويل لبوابة بنك مصر…" }
    : PROVIDER === "paymob" ? { secure: "دفع آمن عبر Paymob", page: "صفحة Paymob", go: "جاري التحويل لصفحة الدفع الآمنة (Paymob)…" }
    : PROVIDER === "app" ? { secure: "دفع آمن عبر Paymob", page: "صفحة Paymob", go: "جاري فتح صفحة الدفع الآمنة (Paymob)…" }
    : { secure: "دفع آمن ومشفّر", page: "صفحة الدفع", go: "جاري التحويل لصفحة الدفع الآمنة…" };
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  // ٠١٢… / ۰۱۲… -> 012…
  function asciiDigits(s) {
    return String(s == null ? "" : s).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x6f0); });
  }
  // 01xxxxxxxxx from an Egyptian mobile typed any usual way (+20 / 0020 / Arabic digits), else null (the API's rule)
  function egyptMobile(p) {
    var d = asciiDigits(p).replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
    if (/^200?1[0125]\d{8}$/.test(d)) d = "0" + d.replace(/^200?/, ""); else if (/^1[0125]\d{8}$/.test(d)) d = "0" + d;
    return /^01[0125]\d{8}$/.test(d) ? d : null;
  }

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
  // same-page links to a tab (the menu sheet's "تبرع الآن" -> #online, "#wallets" ...) change only the hash
  addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (MODE === "off" && h === "online") h = "bank";
    var el = document.getElementById(h);
    if (!el || el.getAttribute("role") !== "tabpanel") return;
    openTab(h);
    var t = document.querySelector(".tabs"); if (t) t.scrollIntoView({ behavior: SMOOTH, block: "start" });
  });

  // Copy buttons (bank rows are rendered later from donate.json, so listen on the document): the copy icon morphs
  // into a check (css .done) for 1.6 s
  var CI = '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><g class="ci-a"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></g><path class="ci-b" d="M5 12.5l4.5 4.5L19 7"/></svg>';
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".copy"); if (!b) return;
    navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(function () {
      var t = b.querySelector("span") || b;
      b.classList.add("done"); t.textContent = "تم النسخ"; if (window.mersalTap) window.mersalTap(8);
      clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove("done"); t.textContent = "نسخ"; }, 1600);
    });
  });
  // The donation receipt ("تأكيد التبرع", paidScreen): "احفظ التأكيد" prints only the receipt (css: html.rcpt-print in
  // forms.css), "ابعت الفرحة لصحابك" shares the page (never the amount): the phone's share sheet, else WhatsApp.
  var JOY = "اتبرعت لمرضى مرسال النهارده، وانت كمان تقدر تبعت فرحة #ابعت_فرحة";
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-print-rcpt]")) {
      document.documentElement.classList.add("rcpt-print");
      window.print();
      return;
    }
    if (e.target.closest("[data-share-joy]")) {
      var url = location.origin + "/donate.html";
      var wa = function () { window.open("https://wa.me/?text=" + encodeURIComponent(JOY + " " + url), "_blank", "noopener"); };
      if (navigator.share) navigator.share({ title: "مؤسسة مرسال", text: JOY, url: url }).catch(function (x) { if (!x || x.name !== "AbortError") wa(); });
      else wa();
    }
  });
  addEventListener("afterprint", function () { document.documentElement.classList.remove("rcpt-print"); });
  // "ابعت رسالة على 9599": on a touch phone the side picture opens the SMS app with the word ready; elsewhere it stays
  // a link to the wallets tab (the hashchange handler above opens it)
  if (window.matchMedia && matchMedia("(pointer: coarse)").matches) {
    document.querySelectorAll("[data-sms]").forEach(function (a) { a.href = "sms:9599?&body=" + encodeURIComponent("مرسال"); });
  }
  // Bank accounts, wallets and the account abroad come from /data/donate.json (edited from the console, "بيانات الموقع");
  // the markup already in donate.html is the fallback while it loads or if it fails.
  function row(label, value) { return '<div class="bank"><div><b>' + esc(label) + "</b><code>" + esc(value) + '</code></div><button class="copy" data-copy="' + esc(value) + '">' + CI + "<span>نسخ</span></button></div>"; }
  // Bank accounts: consecutive entries with the same bank name become one card (logo, or a teal initials badge, + the
  // name, then one row per account: currency pill, the number and a copy button). css: "bank account cards" in site.css.
  // donate.html carries the same markup as the no-JS fallback.
  function curKey(c) { return /جنيه|EGP/i.test(c) ? "egp" : /دولار|USD/i.test(c) ? "usd" : /يورو|EUR/i.test(c) ? "eur" : "other"; }
  function bankBadge(name) {
    var latin = /\b[A-Z]{2,5}\b/.exec(name);
    if (latin) return latin[0];
    var w = String(name).split(/\s+/).filter(function (x) { return x && !/^(ال)?(بنك|مصرف)$/.test(x); })[0] || String(name);
    return w.replace(/^ال(?=..)/, "").charAt(0);
  }
  function bankLogo(g) {
    if (!g.logo) return '<span class="bk-logo bk-initials" aria-hidden="true">' + esc(bankBadge(g.name)) + "</span>";
    var wp = window.mersalWebp ? window.mersalWebp(g.logo) : null;
    return '<span class="bk-logo"><picture>' + (wp ? '<source type="image/webp" srcset="' + esc(wp) + '">' : "") +
      '<img src="' + esc(g.logo) + '" alt="" loading="lazy" decoding="async"></picture></span>';
  }
  function accRow(pill, key, value, what, shown) {
    return '<li class="bk-acc"><span class="bk-cur" data-cur="' + key + '">' + esc(pill) + '</span><code class="bk-num" dir="ltr">' + esc(shown || value) +
      '</code><button type="button" class="copy" data-copy="' + esc(value) + '" aria-label="' + esc("نسخ " + what) + '">' + CI + "<span>نسخ</span></button></li>";
  }
  function bankCards(banks) {
    var groups = [];
    banks.forEach(function (b) {
      var name = String(b.name).trim(), g = groups[groups.length - 1];
      if (!g || g.name !== name) groups.push(g = { name: name, logo: "", accs: [] });
      if (!g.logo && b.logo) g.logo = String(b.logo).trim();
      g.accs.push(b);
    });
    return '<div class="bk-grid">' + groups.map(function (g) {
      var swift = {}, rows = g.accs.map(function (b) {
        var cur = String(b.currency || "").trim(), of = g.name + (cur ? " " + cur : ""), sw = String(b.swift || "").trim();
        var r = accRow(cur || "رقم الحساب", curKey(cur), String(b.number).trim(), "رقم حساب " + of);
        if (b.iban) r += accRow("IBAN", "code", String(b.iban).trim(), "IBAN حساب " + of);
        if (sw && !swift[sw]) { swift[sw] = 1; r += accRow("SWIFT", "code", sw, "SWIFT " + g.name); }
        return r;
      }).join("");
      return '<article class="bk-card"><header class="bk-head">' + bankLogo(g) + '<h3 class="bk-name">' + esc(g.name) + "</h3></header>" +
        '<ul class="bk-list" role="list">' + rows + "</ul></article>";
    }).join("") + "</div>";
  }
  // The account abroad (donate.json "foreign"): IBAN and BIC as copyable rows like the Egyptian accounts, the account
  // holder as text, and the picture of the details (if any) as a small link to the full image
  function abroadHtml(f) {
    var str = function (v) { return String(v || "").trim(); };
    var bank = str(f.bank), iban = str(f.iban).replace(/\s+/g, ""), bic = str(f.bic).replace(/\s+/g, ""), holder = str(f.holder);
    var card = "";
    if (iban || bic) {
      card = '<article class="bk-card ab-card"><header class="bk-head"><span class="bk-logo bk-initials" aria-hidden="true">' + esc(bankBadge(bank || "IBAN")) + '</span><h3 class="bk-name">' + esc(bank || "الحساب في الخارج") + "</h3></header>" +
        '<ul class="bk-list" role="list">' +
          (iban ? accRow("IBAN", "code", iban, "IBAN " + (bank || "الحساب في الخارج"), iban.replace(/(.{4})(?=.)/g, "$1 ")) : "") +
          (bic ? accRow("SWIFT / BIC", "code", bic, "SWIFT " + (bank || "الحساب في الخارج")) : "") +
        "</ul>" + (holder ? '<p class="ab-holder">اسم صاحب الحساب: <b dir="ltr">' + esc(holder) + "</b></p>" : "") + "</article>";
    }
    var wp = f.image && window.mersalWebp ? window.mersalWebp(f.image) : null;
    var pic = f.image ? "<picture>" + (wp ? '<source type="image/webp" srcset="' + esc(wp) + '">' : "") + '<img src="' + esc(f.image) + '" alt="' + esc(f.alt || "") + '" width="960" height="960" loading="lazy"></picture>' : "";
    return (f.text ? "<p>" + esc(f.text) + "</p>" : "") + card +
      (pic ? (card ? '<a class="ab-thumb" href="' + esc(f.image) + '" target="_blank" rel="noopener">' + pic + "<span>صورة بيانات الحساب</span></a>" : '<div class="ab-pic">' + pic + "</div>") : "") +
      (f.link ? '<p class="ab-more"><a class="btn btn-teal" href="' + esc(f.link) + '" target="_blank" rel="noopener">' + esc(f.linkText || "طرق أخرى للتبرع من الخارج") + "</a></p>" : "");
  }
  // a logo that fails to load (e.g. a deleted upload) turns into the initials badge
  function bankLogoFallback(box) {
    box.querySelectorAll(".bk-logo img").forEach(function (img) {
      function fail() {
        var s = img.closest(".bk-logo"), card = img.closest(".bk-card");
        if (!s || !card) return;
        s.className = "bk-logo bk-initials"; s.setAttribute("aria-hidden", "true");
        s.textContent = bankBadge(card.querySelector(".bk-name").textContent);
      }
      if (img.complete && img.currentSrc && !img.naturalWidth) fail(); else img.addEventListener("error", fail);
    });
  }
  fetch("/data/donate.json").then(function (r) { return r.json(); }).then(function (d) {
    var banks = (d.banks || []).filter(function (b) { return b && b.name && b.number; });
    if (banks.length) {
      var bankBox = document.getElementById("bank-accounts");
      bankBox.innerHTML = bankCards(banks);
      bankLogoFallback(bankBox);
      // "في 7 بنوك": the distinct banks, with the Arabic counted noun (3-10 بنوك, 11+ بنك, 2 بنكين, 1 بنك واحد)
      var names = {}, k = 0;
      banks.forEach(function (b) { var n = String(b.name).trim(); if (n && !names[n]) { names[n] = 1; k++; } });
      document.querySelectorAll("[data-bank-count]").forEach(function (el) { el.textContent = k > 2 ? k : ""; });
      document.querySelectorAll("[data-bank-word]").forEach(function (el) { el.textContent = k > 10 ? "بنك" : k > 2 ? "بنوك" : k === 2 ? "بنكين" : "بنك واحد"; });
    }
    var wallets = (d.wallets || []).filter(function (w) { return w && w.name && w.value; });
    document.getElementById("wallet-numbers").innerHTML = wallets.map(function (w) { return row(w.name, w.value); }).join("");
    var f = d.foreign, box = document.getElementById("abroad-body");
    if (f && box && (f.image || f.link || f.text || f.iban)) box.innerHTML = abroadHtml(f);
  }).catch(function () {});
  // (Paymob appends its result to redirection_url "…?gw=paymob" with "&"; a second "?" is tolerated all the same)
  var SEARCH = location.search.replace(/^(\?gw=paymob)\?/, "$1&");
  var q = new URLSearchParams(SEARCH);
  // Back from the gateway (Banque Misr ?hcoReturn=1, Paymob ?gw=paymob&…) is still verified when card payments were
  // switched off in the meantime
  var PAYMOB_RETURN = q.get("gw") === "paymob";
  var RETURNING = q.get("hcoReturn") === "1" || PAYMOB_RETURN;
  if (MODE === "off" && !RETURNING) return;

  // ---------- stepper ----------
  var form = document.getElementById("pay-form");
  var result = document.getElementById("pay-result");
  var amount = document.getElementById("amount"), purpose = document.getElementById("purpose");
  if (MODE === "off") form.hidden = true; // only the payment result shows
  (function gatewayWording() {
    var sec = form.querySelector(".pay-methods .secure"); if (sec) sec.textContent = GW.secure;
    var hint = form.querySelector('.step[data-step="3"] .hint');
    if (hint && hint.firstChild && hint.firstChild.nodeType === 3) hint.firstChild.nodeValue = PROVIDER === "app"
      ? 'بالضغط على "ادفع" هتفتح صفحة Paymob الآمنة جوه الصفحة دي لإدخال بيانات الدفع. مرسال لا تحتفظ ببيانات بطاقتك. '
      : 'بالضغط على "ادفع" هيتم تحويلك ل' + GW.page + " الآمنة لإدخال بيانات " + (PROVIDER === "mpgs" ? "البطاقة" : "الدفع") + ". مرسال لا تحتفظ ببيانات بطاقتك. ";
    var t = document.getElementById("gw-title"); if (t) t.textContent = GW.go;
  })();
  // old codes and pages that are the same cause: p4 / p5 are pages of the oncology centre, whose code is p31
  var LEGACY = { hospital: "p30", oncology: "p31", cases: "general", p4: "p31", p5: "p31" };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  if (q.get("amount")) amount.value = Math.max(10, parseInt(q.get("amount"), 10) || 500);
  syncChips();

  // Purpose list: general/zakat/sadaqa + every project and service imported from the old site
  Promise.all([
    fetch("/content.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("/data/menu.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (res) {
    // one option per cause: pages that are aliases of another code (LEGACY, e.g. p4/p5 -> p31) are skipped, and a
    // second page with a title that is already listed becomes an alias of the first one (so ?for= still finds it)
    var groups = {}, seen = {}, titles = {}, alias = {};
    purpose.querySelectorAll("option").forEach(function (o) { titles[o.textContent.trim()] = o.value; });
    function add(group, id, title) {
      var t = String(title || "").trim(), v = "p" + id;
      if (seen[id] || has(LEGACY, v) || !t) return;
      seen[id] = 1;
      if (titles[t]) { alias[v] = titles[t]; return; }
      titles[t] = v;
      (groups[group] = groups[group] || []).push({ v: v, t: t });
    }
    (res[1] || []).forEach(function (top) {
      (top.children || []).forEach(function (k) {
        var m = /^\/p\/(\d+)\.html$/.exec(k.href || "");
        if (m && !/طرق التبرع|تطوع|فروع/.test(k.title)) add(top.title, m[1], k.title);
      });
    });
    ((res[0] || {}).projects || []).forEach(function (p) {
      var m = /^\/p\/(\d+)\.html$/.exec(p.link || "");
      if (m) add("مشاريع أخرى", m[1], p.title);
    });
    purpose.insertAdjacentHTML("beforeend", Object.keys(groups).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (o) { return '<option value="' + o.v + '">' + esc(o.t) + "</option>"; }).join("") + "</optgroup>";
    }).join(""));
    var want = q.get("for") || "";
    if (has(LEGACY, want)) want = LEGACY[want];
    if (has(alias, want)) want = alias[want];
    want = want.replace(/[^\w-]/g, "");
    if (want && purpose.querySelector('option[value="' + want + '"]')) purpose.value = want;
    updateImpact();
  }).catch(function () { updateImpact(); });

  function syncChips() {
    form.querySelectorAll(".amounts button").forEach(function (x) { x.classList.toggle("on", x.dataset.v === String(amount.value)); });
  }
  form.querySelectorAll(".amounts button").forEach(function (b) {
    b.addEventListener("click", function () { amount.value = b.dataset.v; syncChips(); updateImpact(); if (window.mersalTap) window.mersalTap(8); });
  });
  // The amount or the purpose changed from outside step 1 (the impact calculator under the stepper fills them in
  // place): go back to step 1, so the review, the pay button and the sticky strip never show an older amount than
  // the one that is sent to the bank.
  function changedLater() {
    if (sheet) return; // the app's Paymob sheet is open (the page behind is inert): its order stands
    if (gw && !gw.hidden) { payRun++; gw.hidden = true; btn.disabled = false; } // a pending redirect to the bank is dropped
    if (cur > 1) go(1);
  }
  amount.addEventListener("input", function () { syncChips(); updateImpact(); changedLater(); });
  purpose.addEventListener("change", function () { updateImpact(); changedLater(); });

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
  // Strip above steps 2-3 (sticky on phones): the amount and the purpose stay in view, "تعديل" jumps back to step 1
  var sumBar = (function () {
    var el = document.createElement("div"); el.className = "s-sum"; el.hidden = true;
    el.innerHTML = '<b></b><span class="s-for"></span><button type="button" class="link-btn">تعديل</button>';
    form.querySelector(".steps").insertAdjacentElement("afterend", el);
    el.querySelector("button").addEventListener("click", function () { go(1); });
    return function (n) {
      el.hidden = n < 2;
      if (n < 2) return;
      el.querySelector("b").textContent = fmt.format(Number(amount.value) || 0) + " جنيه";
      el.querySelector(".s-for").textContent = purposeText();
    };
  })();
  function go(n) {
    // css: the new step slides in from the side it comes from (data-dir)
    form.dataset.dir = n > cur ? "fwd" : n < cur ? "back" : (form.dataset.dir || "fwd");
    cur = n;
    stepEls.forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    sumBar(n);
    dots.forEach(function (d) { var k = Number(d.dataset.step); d.classList.toggle("on", k === n); d.classList.toggle("done", k < n); });
    if (n === 3) fillSummary();
    var first = form.querySelector('.step[data-step="' + n + '"] input, .step[data-step="' + n + '"] select');
    form.scrollIntoView({ behavior: SMOOTH, block: "start" });
    if (first && n === 2) setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
  }
  function valid(n) {
    var ok = true;
    form.querySelectorAll('.step[data-step="' + n + '"] input[required]').forEach(function (i) { if (ok && !i.reportValidity()) ok = false; });
    if (ok && n === 1 && (Number(amount.value) < 10 || Number(amount.value) > 1000000)) { amount.setCustomValidity("المبلغ من 10 إلى 1,000,000 جنيه"); amount.reportValidity(); amount.setCustomValidity(""); ok = false; }
    if (ok && n === 2) {
      var ph = document.getElementById("phone");
      if (asciiDigits(ph.value).replace(/[^\d]/g, "").length < 10) { ph.setCustomValidity("اكتب رقم موبايل صحيح"); ph.reportValidity(); ph.setCustomValidity(""); ok = false; }
      // Paymob through the app takes Egyptian mobile numbers only (its function's rule)
      else if (PROVIDER === "app" && !egyptMobile(ph.value)) { ph.setCustomValidity("اكتب رقم موبايل مصري (11 رقم يبدأ بـ 01)"); ph.reportValidity(); ph.setCustomValidity(""); ok = false; }
    }
    return ok;
  }
  form.querySelectorAll("[data-next]").forEach(function (b) { b.addEventListener("click", function () { if (valid(cur)) go(cur + 1); }); });
  form.querySelectorAll("[data-prev]").forEach(function (b) { b.addEventListener("click", function () { go(cur - 1); }); });
  dots.forEach(function (d) { d.addEventListener("click", function () { var k = Number(d.dataset.step); if (k < cur) go(k); }); });

  function purposeText() { var o = purpose.options[purpose.selectedIndex]; return o ? o.textContent : ""; }
  function fillSummary() {
    var a = Number(amount.value), anon = document.getElementById("anon").checked;
    document.getElementById("summary").innerHTML =
      "<dt>المبلغ</dt><dd><b>" + fmt.format(a) + " جنيه</b></dd>" +
      "<dt>تبرع لـ</dt><dd>" + esc(purposeText()) + "</dd>" +
      "<dt>المتبرع</dt><dd>" + (anon ? "فاعل خير" : esc(document.getElementById("name").value)) + "</dd>" +
      "<dt>الموبايل</dt><dd dir=\"ltr\">" + esc(document.getElementById("phone").value) + "</dd>" +
      (window.MersalGift ? window.MersalGift.summaryRow() : "");
    document.getElementById("pay-amount").textContent = fmt.format(a) + " جنيه";
  }

  function show(kind, html) { result.innerHTML = '<div class="alert ' + kind + '">' + html + "</div>"; result.scrollIntoView({ behavior: SMOOTH, block: "center" }); }
  var gw = document.getElementById("gateway"), btn = document.getElementById("pay-btn"), payRun = 0;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cur !== 3) { if (valid(cur)) go(cur + 1); return; }
    btn.disabled = true;
    stepEls.forEach(function (s) { s.hidden = true; }); sumBar(1);
    gw.hidden = false; gw.classList.remove("stopped");
    document.getElementById("gw-title").textContent = GW.go;
    document.getElementById("gw-body").innerHTML = "";
    var run = ++payRun;
    if (MODE === "demo") return setTimeout(function () { if (run === payRun && !gw.hidden) stopAtGateway(); }, 1600);
    startLivePayment(run);
  });

  // Demo (or live while the gateway is not set up yet): the flow ends here, before any card data or charge
  function stopAtGateway() {
    gw.classList.add("stopped");
    document.getElementById("gw-title").textContent = "بوابة الدفع الإلكتروني قيد التفعيل";
    document.getElementById("gw-body").innerHTML =
      "<p>وصلت لآخر خطوة قبل " + GW.page + ". الدفع بالبطاقة هيتفعّل قريب جداً، <b>ولم يتم خصم أي مبلغ</b>.</p>" +
      '<p>تقدر تكمل تبرعك بـ <b>' + fmt.format(Number(amount.value)) + " جنيه</b> دلوقتي بطريقة من دول:</p>" +
      '<div class="gw-alt">' +
        '<a class="btn btn-teal" href="tel:19340">📞 مندوب لحد البيت 19340</a>' +
        '<a class="btn btn-ghost-teal" href="#bank" data-tab="bank">🏦 تحويل بنكي</a>' +
        '<a class="btn btn-ghost-teal" href="#wallets" data-tab="wallets">📱 فوري 9200 / إنستاباي</a>' +
      "</div>" +
      '<button type="button" class="link-btn" id="gw-back">← رجوع لتعديل التبرع</button>';
    if (window.MersalGift) window.MersalGift.afterDonation(document.getElementById("gw-body"), { paid: false, amount: Number(amount.value) || 0, purpose: purpose.value, purposeTitle: purposeText().trim(), before: document.getElementById("gw-back") });
    gw.querySelectorAll("[data-tab]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); openTab(a.dataset.tab); document.querySelector(".tabs").scrollIntoView({ behavior: SMOOTH }); });
    });
    document.getElementById("gw-back").addEventListener("click", function () { gw.hidden = true; btn.disabled = false; go(3); });
  }

  // Live: POST /api/checkout, then the gateway it answers for. Banque Misr's script is loaded first when the console
  // chose Banque Misr (as before), or after the answer when the server picked it.
  function requestCheckout() {
    var anon = document.getElementById("anon").checked;
    return fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount.value, purpose: purpose.value,
        name: anon ? "فاعل خير" : document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(), phone: document.getElementById("phone").value.trim()
      })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw d; return d; }); });
  }
  // what the donor chose travels with the order: the page reloads empty when the gateway sends them back
  function remember(d, gwName) {
    try { localStorage.setItem(KEY, JSON.stringify({ orderId: d.orderId, gw: gwName, successIndicator: d.successIndicator, amount: Number(amount.value) || 0, purpose: purpose.value, purposeTitle: purposeText().trim(), at: Date.now() })); } catch (x) {}
  }
  function loadMpgs(done) {
    var s = document.createElement("script");
    s.src = "https://banquemisr.gateway.mastercard.com/static/checkout/checkout.min.js";
    s.setAttribute("data-error", "mersalPayError");
    s.setAttribute("data-cancel", "mersalPayCancel");
    s.onload = done;
    document.head.appendChild(s);
  }
  function openMpgs(d) {
    remember(d, "mpgs");
    Checkout.configure({ session: { id: d.sessionId } });
    Checkout.showPaymentPage();
  }
  function startLivePayment(run) {
    var stale = function () { return run !== payRun || gw.hidden; }; // the amount or purpose changed meanwhile
    // { unavailable: true }: card payment cannot start at all yet (gateway settings not in Azure): the same "other ways"
    // panel as demo, nothing was charged
    var failed = function (err) { if (run !== payRun) return; if (err && err.unavailable && !gw.hidden) stopAtGateway(); else window.mersalPayError(err); };
    if (PROVIDER === "mpgs") {
      return loadMpgs(function () { requestCheckout().then(function (d) { if (!stale()) openMpgs(d); }).catch(failed); });
    }
    requestCheckout().then(function (d) {
      if (stale()) return;
      if (d.provider === "app" && d.checkoutUrl && /^https:\/\//.test(d.checkoutUrl)) { openEmbedded(d, run); return; }
      if (d.redirect && /^https:\/\//.test(d.redirect)) { remember(d, "paymob"); location.assign(d.redirect); return; }
      if (d.sessionId) { loadMpgs(function () { if (!stale()) openMpgs(d); }); return; }
      throw d;
    }).catch(failed);
  }
  window.mersalPayError = function (err) {
    gw.hidden = true; btn.disabled = false; go(3);
    var m = err && typeof err.message === "string" && err.message ? err.message : "";
    show("err", m ? esc(m) + (/19340/.test(m) ? "" : " لو المشكلة استمرت كلمنا على 19340.") : "حدث خطأ أثناء عملية الدفع. حاول مرة أخرى أو كلمنا على 19340.");
  };
  window.mersalPayCancel = function () { gw.hidden = true; btn.disabled = false; go(3); show("info", "تم إلغاء عملية الدفع."); };

  // ---------- Paymob through the Mersal app (payProvider "app") ----------
  // Its checkout opens in a sheet inside this page (Paymob then returns to the app's own page, not to this site), and the
  // app's record is asked every 4 s (/api/verify?gw=app) until it says paid or failed (every 30 s after half an hour, up
  // to 3 hours). Closing the sheet (✕, Escape, or the phone's Back) asks once more with cancelled=1, so a payment that
  // went through at the last second still shows as paid. While it is open the page behind is inert (focus stays in the
  // dialog); focus comes back to the pay button or the result.
  var APP_DONE = /^(FAILED|REFUNDED|CANCELLED|CANCELED|EXPIRED|DECLINED|VOIDED)$/, APP_POLL = 4000, APP_SLOW = 30000, APP_SLOW_AFTER = 30 * 60e3, APP_MAX = 3 * 3600e3;
  var sheet = null, pollT = null, inerted = [], backPending = false, afterBack = [];
  if (!result.hasAttribute("aria-live")) { result.setAttribute("role", "status"); result.setAttribute("aria-live", "polite"); }
  function askApp(orderId, cancelled) {
    return fetch("/api/verify?gw=app&orderId=" + encodeURIComponent(orderId) + (cancelled ? "&cancelled=1" : ""), { cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (o) { if (!r.ok) throw o; return o; }); });
  }
  // the saved order is dropped only when it is still this one (another tab or a newer payment may own it now)
  function forget(orderId) {
    try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && c.orderId === orderId) localStorage.removeItem(KEY); } catch (x) {}
  }
  function stopPoll() { if (pollT) { clearTimeout(pollT); pollT = null; } }
  function closeSheet() {
    stopPoll();
    if (sheet) { sheet.remove(); sheet = null; }
    inerted.forEach(function (el) { el.inert = false; el.removeAttribute("aria-hidden"); }); inerted = [];
    document.documentElement.classList.remove("pm-open");
    try { if (history.state && history.state.overlay === "paymob") { backPending = true; history.back(); } } catch (x) {} // its Back entry
  }
  // the phone's Back closes the sheet like ✕ (one history entry, as the menu and search do in layout.js)
  addEventListener("popstate", function () {
    if (backPending) { backPending = false; var q = afterBack; afterBack = []; setTimeout(function () { q.forEach(function (f) { f(); }); }, 0); return; }
    if (sheet && !(history.state && history.state.overlay === "paymob")) sheet.dispatchEvent(new Event("pm-back"));
  });
  // focus after the sheet's own history step is done (the browser drops focus while it goes back)
  function focusLater(el) {
    if (!el) return;
    var done = false, run = function () { if (done) return; done = true; try { el.focus({ preventScroll: true }); } catch (x) {} };
    if (backPending) { afterBack.push(run); setTimeout(run, 700); } else run();
  }
  function openEmbedded(d, run) {
    var rec = { orderId: d.orderId, amount: Number(amount.value) || 0, purpose: purpose.value, purposeTitle: purposeText().trim() };
    remember(d, "app");
    if (sheet) closeSheet();
    sheet = document.createElement("div");
    sheet.className = "pm-sheet";
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "الدفع الآمن عبر Paymob");
    sheet.innerHTML = '<div class="pm-box"><div class="pm-head"><span class="pm-title">🔒 Paymob · <b dir="ltr">' + fmt.format(rec.amount) + "</b> جنيه</span>" +
      '<button type="button" class="pm-close" aria-label="إقفل صفحة الدفع">✕</button></div>' +
      '<p class="pm-note" role="status">بعد ما تدفع هنأكد تبرعك هنا تلقائياً، متقفلش الصفحة.</p>' +
      '<iframe class="pm-frame" title="صفحة الدفع Paymob" allow="payment *"></iframe></div>';
    sheet.querySelector("iframe").src = d.checkoutUrl;
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (!el.inert && el.tagName !== "SCRIPT") { el.inert = true; el.setAttribute("aria-hidden", "true"); inerted.push(el); }
    });
    document.body.appendChild(sheet);
    document.documentElement.classList.add("pm-open");
    try { if (history.state && history.state.overlay) history.replaceState({ overlay: "paymob" }, ""); else history.pushState({ overlay: "paymob" }, ""); } catch (x) {}
    var x = sheet.querySelector(".pm-close"), close = function () { userClosed(rec, run); };
    x.addEventListener("click", close);
    sheet.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    sheet.addEventListener("pm-back", close);
    x.focus();
    document.getElementById("gw-title").textContent = "مستنيين تأكيد الدفع…";
    var started = Date.now(), note = sheet.querySelector(".pm-note");
    (function poll() {
      var age = Date.now() - started;
      if (age > APP_MAX) { note.textContent = "لو دفعت ومفيش تأكيد لسه، دوس ✕ وهنتأكد من تبرعك."; return; }
      if (age > APP_SLOW_AFTER) note.textContent = "لسه مستنيين تأكيد الدفع. لو خلصت الدفع وطوّل التأكيد، دوس ✕ وهنتأكد.";
      pollT = setTimeout(function () {
        if (run !== payRun || !sheet) return;
        askApp(rec.orderId).then(function (o) { if (run === payRun && sheet) appSettled(o, false, rec); })
          .catch(function () { /* keep asking */ }).then(function () { if (run === payRun && sheet) poll(); });
      }, age > APP_SLOW_AFTER ? APP_SLOW : APP_POLL);
    })();
  }
  // paid -> thanks screen; failed -> back to step 3 with nothing charged; still open -> keep waiting (or, after a close,
  // say so: the app records a late payment by itself)
  function appSettled(o, closed, rec) {
    if (o.paid) { closeSheet(); gw.hidden = true; paidScreen(o, rec); return; }
    if (APP_DONE.test(o.status || "")) {
      closeSheet(); forget(rec.orderId);
      gw.hidden = true; btn.disabled = false; go(3);
      show("err", "لم تكتمل عملية الدفع ومفيش أي مبلغ اتخصم. تقدر تحاول تاني أو تكلمنا على 19340.");
      focusLater(btn);
      return;
    }
    if (closed) {
      gw.hidden = true; btn.disabled = false; go(3);
      show("info", "اتقفلت صفحة الدفع ومفيش تبرع اتأكد لسه. لو كنت دفعت فعلاً هيتسجل تبرعك تلقائياً، ولو عندك سؤال كلمنا على 19340" +
        ' برقم العملية: <code dir="ltr">' + esc(rec.orderId) + "</code>.");
      focusLater(btn);
    }
  }
  function userClosed(rec, run) {
    if (!sheet) return;
    closeSheet();
    document.getElementById("gw-title").textContent = "جاري التأكد من عملية الدفع…";
    askApp(rec.orderId, true).then(function (o) { if (run === payRun) appSettled(o, true, rec); })
      .catch(function () { if (run === payRun) appSettled({ orderId: rec.orderId, status: "UNKNOWN" }, true, rec); });
  }

  // The thanks screen for a payment the gateway confirmed (Banque Misr / Paymob return, or the app's record)
  function paidScreen(o, saved) {
    var amt = Number(o.amount) || Number(saved.amount) || 0;
    forget(o.orderId);
    form.hidden = true;
    recordDonation({ orderId: o.orderId, amount: amt, purpose: saved.purpose || o.purpose || "general", purposeTitle: saved.purposeTitle || "", demo: false });
    // the receipt ("تأكيد التبرع", not an official receipt): amount, purpose, date and the order number to quote
    show("ok", '<div class="rcpt"><div class="rcpt-head"><span class="rcpt-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>' +
      '<h2 tabindex="-1">شكراً لك! تبرعك وصل</h2><p class="dua">' + ((saved.purpose || o.purpose) === "zakat" ? "ربنا يتقبّل زكاتك ويبارك لك في مالك" : "ربنا يتقبّل منك ويجعله في ميزان حسناتك") + "</p></div>" +
      '<dl class="rcpt-rows"><dt>المبلغ</dt><dd><b>' + fmt.format(amt) + " جنيه</b></dd>" +
      "<dt>الغرض</dt><dd>" + esc(saved.purposeTitle || purposeText().trim() || "تبرع عام") + "</dd>" +
      "<dt>التاريخ</dt><dd>" + new Date().toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" }) + "</dd>" +
      '<dt class="rcpt-ref">رقم العملية</dt><dd class="rcpt-ref"><code dir="ltr">' + esc(o.orderId) + '</code> <button type="button" class="copy" data-copy="' + esc(o.orderId) + '" aria-label="نسخ رقم العملية">' + CI + "<span>نسخ</span></button></dd></dl>" +
      '<p class="rcpt-next">احتفظ برقم العملية. لو عندك أي سؤال عن تبرعك كلّمنا على <a href="tel:19340">19340</a> وقول الرقم ده.</p>' +
      '<div class="rcpt-actions"><button type="button" class="btn btn-ghost-teal" data-print-rcpt>احفظ التأكيد</button>' +
      '<button type="button" class="btn btn-ghost-teal" data-share-joy>ابعت الفرحة لصحابك</button>' +
      '<a class="btn btn-gold" href="/community.html">شوف هداياك في مرسال كوميونيتي</a></div></div>');
    if (window.MersalGift) window.MersalGift.afterDonation(result.querySelector(".alert"), { paid: true, amount: amt, purpose: saved.purpose || o.purpose || "general", purposeTitle: saved.purposeTitle || "" });
    var al = result.querySelector(".alert"); if (al) { al.setAttribute("tabindex", "-1"); focusLater(al); }
  }

  // Back on the page (a reload, or the tab was closed) while an app checkout was open: its record is asked once.
  // Older than a day = left alone and forgotten. A payment started meanwhile wins (nothing is shown over it).
  if (!RETURNING) (function resumeApp() {
    var pend = null; try { pend = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (x) {}
    if (!pend || pend.gw !== "app" || !pend.orderId) return;
    if (!(Date.now() - Number(pend.at) < 864e5)) { forget(pend.orderId); return; }
    askApp(pend.orderId).then(function (o) {
      if (payRun) return;
      if (o.paid) { openTab("online"); paidScreen(o, pend); }
      else if (APP_DONE.test(o.status || "")) forget(pend.orderId);
    }).catch(function () {});
  })();

  // Back from the gateway: Banque Misr ?hcoReturn=1&resultIndicator=... / Paymob ?gw=paymob&id=…&order=…&success=…&hmac=…
  // The query is only passed on: /api/verify checks Paymob's hmac and asks the gateway itself before anything counts.
  if (RETURNING) {
    openTab("online");
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (x) {}
    var search = SEARCH, rq = new URLSearchParams(search), verifyUrl = "";
    // Paymob by our own saved reference: needs no signature, and Paymob's own record decides just the same
    var byOrder = PAYMOB_RETURN && saved.gw === "paymob" && saved.orderId ? "/api/verify?gw=paymob&orderId=" + encodeURIComponent(saved.orderId) : "";
    history.replaceState(null, "", location.pathname + "#online"); // the gateway's parameters leave the address bar
    if (PAYMOB_RETURN && rq.get("hmac") && rq.get("id")) verifyUrl = "/api/verify?" + search.replace(/^\?/, "");
    else if (byOrder) verifyUrl = byOrder;
    else if (!PAYMOB_RETURN && saved.orderId) verifyUrl = "/api/verify?orderId=" + encodeURIComponent(saved.orderId);
    if (!verifyUrl) { show("err", "لم نجد عملية دفع محفوظة على هذا المتصفح. لو تم خصم المبلغ تواصل معنا على 19340."); return; }
    var ref = function (o) { var id = (o && o.orderId) || saved.orderId || ""; return id ? ' برقم العملية: <code dir="ltr">' + esc(id) + "</code>" : ""; };
    show("info", PAYMOB_RETURN ? "جارٍ التأكد من عملية الدفع…" : "جارٍ التأكد من عملية الدفع مع البنك…");
    var ask = function (url) {
      return fetch(url).then(function (r) { return r.json().catch(function () { return {}; }).then(function (o) { if (!r.ok) throw { status: r.status, body: o }; return o; }); });
    };
    ask(verifyUrl)
      // the return's signature did not check out (400): ask about the saved order instead of giving up
      .catch(function (e) { if (e && e.status === 400 && byOrder && verifyUrl !== byOrder) return ask(byOrder); throw e; })
      .then(function (o) {
        if (o.paid && o.test) {
          // Paymob's test keys: the whole flow ran, but no money moved and nothing is recorded as a donation
          try { localStorage.removeItem(KEY); } catch (x) {}
          show("info", "دي كانت <b>عملية دفع تجريبية</b> (مفاتيح Paymob التجريبية): مفيش أي مبلغ حقيقي اتخصم، ومش هتتسجل كتبرع" + ref(o) + ".");
        } else if (o.paid) {
          paidScreen(o, saved);
        } else if (o.status === "PENDING") {
          // Paymob: an OTP or wallet confirmation still open; the gateway's callback records it once it completes
          show("info", "عملية الدفع لسه بتتأكد من بوابة الدفع. لو اتخصم المبلغ هيتسجل تبرعك تلقائياً، ولو عندك أي سؤال كلمنا على 19340" + ref(o) + ".");
        } else if (o.status === "MISMATCH") {
          show("err", "مقدرناش نأكد عملية الدفع دي تلقائياً. لو تم خصم المبلغ تواصل معنا على 19340" + ref(o) + " وهنراجعها.");
        } else {
          show("err", "لم تكتمل عملية الدفع (حالة الطلب: " + esc(o.status || "غير معروفة") + "). لم يتم خصم أي مبلغ، " +
            (MODE === "off" ? 'وتقدر تتبرع بتحويل بنكي أو من المحافظ أو تكلمنا على 19340.' : "ويمكنك المحاولة مرة أخرى."));
        }
      })
      .catch(function () { show("err", "تعذّر التأكد من عملية الدفع. لو تم خصم المبلغ تواصل معنا على 19340" + ref() + "."); });
  }
})();
