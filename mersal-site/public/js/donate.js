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
  // the amount as a number, typed with Latin or Arabic digits and any thousands separator ("٢٬٥٠٠" -> 2500);
  // NaN for anything else (the range check in valid() catches it)
  function amt() { var v = asciiDigits(amount.value).replace(/[,٬\s]/g, ""); return /^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN; }
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
  // In-app browsers (Facebook, Instagram, Messenger, TikTok, any Android WebView) ignore window.print(): there the
  // button asks for a screenshot instead of doing nothing
  var NO_PRINT = typeof window.print !== "function" || /; wv\)|FBAN|FBAV|FB_IAB|Instagram|musical_ly|BytedanceWebview|Snapchat/.test(navigator.userAgent);
  document.addEventListener("click", function (e) {
    var pr = e.target.closest("[data-print-rcpt]");
    if (pr) {
      if (NO_PRINT) {
        var box = pr.closest(".rcpt"), hint = box && box.querySelector(".rcpt-hint");
        if (box && !hint) {
          hint = document.createElement("p"); hint.className = "rcpt-hint"; hint.setAttribute("role", "status");
          box.appendChild(hint);
          setTimeout(function () { hint.textContent = "خد سكرين شوت للتأكيد ده واحتفظ برقم العملية"; }, 50);
        }
        return;
      }
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
  // desktop (1180px and wider): the impact calculator under the tabs starts open (phones keep the collapsed <details>)
  if (window.matchMedia && matchMedia("(min-width: 1180px)").matches) { var icMore = document.querySelector(".ic-more"); if (icMore) icMore.open = true; }
  if (MODE === "off" && !RETURNING) return;

  // ---------- stepper ----------
  var form = document.getElementById("pay-form");
  var result = document.getElementById("pay-result");
  var amount = document.getElementById("amount"), purpose = document.getElementById("purpose");
  if (MODE === "off") form.hidden = true; // only the payment result shows
  (function gatewayWording() {
    var sec = form.querySelector(".pay-methods .secure"); if (sec) sec.textContent = GW.secure;
    var hint = form.querySelector('.step[data-step="3"] .hint');
    // what happens after "ادفع" (Paymob: the bank's OTP, then back here to the confirmation and its order number)
    var OTP = "وغالباً البنك هيبعتلك كود (OTP) في رسالة تكتبه، وبعدها ";
    if (hint && hint.firstChild && hint.firstChild.nodeType === 3) hint.firstChild.nodeValue = PROVIDER === "app"
      ? 'بالضغط على "ادفع" هتفتح صفحة Paymob الآمنة جوه الصفحة دي تدخل فيها بيانات الكارت، ' + OTP + "هتلاقي تأكيد تبرعك ورقم العملية هنا. مرسال لا تحتفظ ببيانات بطاقتك. "
      : PROVIDER === "paymob"
      ? 'بالضغط على "ادفع" هتدخل بيانات الكارت في صفحة Paymob الآمنة، ' + OTP + "هترجع هنا تلاقي تأكيد تبرعك ورقم العملية. مرسال لا تحتفظ ببيانات بطاقتك. "
      : 'بالضغط على "ادفع" هيتم تحويلك ل' + GW.page + " الآمنة لإدخال بيانات " + (PROVIDER === "mpgs" ? "البطاقة" : "الدفع") + ". مرسال لا تحتفظ ببيانات بطاقتك. ";
    var t = document.getElementById("gw-title"); if (t) t.textContent = GW.go;
  })();
  // old codes and pages that are the same cause: p4 / p5 are pages of the oncology centre, whose code is p31
  var LEGACY = { hospital: "p30", oncology: "p31", cases: "general", p4: "p31", p5: "p31" };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  if (q.get("amount")) amount.value = Math.max(10, parseInt(asciiDigits(q.get("amount")), 10) || 500);
  if (q.get("custom")) setTimeout(function () { try { amount.focus({ preventScroll: false }); amount.select(); } catch (e) {} }, 400);
  syncChips();

  // Purpose list: general/zakat/sadaqa + every project and service imported from the old site
  var touched = false; // the donor tapped or typed in the stepper before the purpose list loaded
  ["pointerdown", "keydown"].forEach(function (ev) { form.addEventListener(ev, function () { touched = true; }, { once: true }); });
  var CAMPAIGNS = []; // the home campaigns (content.json), for the #impact line
  var CAUSES = { groups: [], causes: [] }; // the زكاة مال / صدقة جارية causes (data/causes.json, edited in the console)
  var EN = document.documentElement.lang === "en";
  var optionsReady = Promise.all([
    fetch("/content.json").then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch("/data/menu.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/causes.json").then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (res) {
    CAMPAIGNS = ((res[0] || {}).campaigns) || [];
    if (!Array.isArray(CAMPAIGNS)) CAMPAIGNS = [];
    // the causes: one option per cause under its group (before the projects), hidden causes are skipped
    var cz = res[2] && typeof res[2] === "object" ? res[2] : {};
    CAUSES.groups = (Array.isArray(cz.groups) ? cz.groups : []).filter(function (g) { return g && /^(zakat|sadaqa)$/.test(g.id); });
    CAUSES.causes = (Array.isArray(cz.causes) ? cz.causes : []).filter(function (c) { return c && c.on !== false && /^c[a-z0-9]{1,12}$/.test(c.id || "") && String(c.title || "").trim(); });
    if (cz.note) CAUSES.note = String(cz.note);
    var tr = function (c) { return EN && c.en ? c.en : String(c.title || "").trim(); };
    var first = purpose.querySelector("optgroup");
    CAUSES.groups.forEach(function (g) {
      var list = CAUSES.causes.filter(function (c) { return c.group === g.id; });
      if (!list.length) return;
      var og = document.createElement("optgroup"); og.label = tr(g);
      list.forEach(function (c) { var o = document.createElement("option"); o.value = c.id; o.textContent = tr(c); o.setAttribute("data-ar", String(c.title || "").trim()); og.appendChild(o); });
      if (first && first.nextSibling) purpose.insertBefore(og, first.nextSibling); else purpose.appendChild(og);
      first = og;
    });
    // the transfer and pickup forms offer the same causes
    ["tr-purpose", "pk-purpose"].forEach(function (id) {
      var sel = document.getElementById(id); if (!sel) return;
      CAUSES.groups.forEach(function (g) {
        var list = CAUSES.causes.filter(function (c) { return c.group === g.id; });
        if (!list.length) return;
        var og = document.createElement("optgroup"); og.label = tr(g);
        list.forEach(function (c) { var o = document.createElement("option"); o.value = c.id; o.textContent = tr(c); og.appendChild(o); });
        sel.appendChild(og);
      });
    });
    // one option per cause: pages that are aliases of another code (LEGACY, e.g. p4/p5 -> p31) are skipped, and a
    // second page with a title that is already listed becomes an alias of the first one (so ?for= still finds it)
    var groups = {}, seen = {}, titles = {}, alias = {};
    purpose.querySelectorAll("option").forEach(function (o) { titles[(o.getAttribute("data-ar") || o.textContent).trim()] = o.value; }); // data-ar: the Arabic title (js/i18n.js, English)
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
    // A donor who already chose a cause AND an amount (a project or campaign card: ?for=…&amount=…#online) starts on
    // step 2, once, without focus moving on load. Never on ?amount= alone (the home quick-donate keeps the
    // زكاة / صدقة choice on step 1), never when the donor already touched the form, never on a gateway return.
    var urlAmt = parseInt(asciiDigits(q.get("amount") || ""), 10);
    if (want && purpose.value === want && urlAmt >= 10 && urlAmt <= 1000000 && location.hash === "#online" &&
      MODE !== "off" && !RETURNING && !touched && cur === 1 && amt() >= 10 && amt() <= 1000000) go(2, true);
  }).catch(function () { updateImpact(); });

  function syncChips() {
    form.querySelectorAll(".amounts button").forEach(function (x) { var on = x.dataset.v === String(amt()); x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
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

  // ---------- intention segment «نيتك» + the cause cards ----------
  // The segment (تبرع عام / زكاة مال / صدقة جارية) and the cards under it pick the same #purpose option a donor could
  // pick by hand in the "مشروع معيّن" list and fire the same "change", so updateImpact() and changedLater() run exactly
  // as for a manual pick; nothing else is sent. They follow the select: ?for= lights the matching one once the
  // options are in, a project picked in the list goes back to "تبرع عام" with the list open.
  (function niyya() {
    var box = document.getElementById("niyya-chips"), note = document.getElementById("niyya-note"), grid = document.getElementById("causes"), more = document.getElementById("purpose-more");
    if (!box) return;
    var chips = Array.prototype.slice.call(box.querySelectorAll("[data-p]"));
    var NOTE = { general: "تبرعك بيروح للمكان اللي محتاجه أكتر.", zakat: "هيتسجّل تبرعك «زكاة مال»، ويتصرف في مصارفها الشرعية في مرسال.", sadaqa: "صدقة جارية أجرها مستمر، ربنا يجعلها في ميزان حسناتك." };
    var shownKey = "general", builtFor = "", icons = window.MersalCauseIcons;
    function groupData(id) { return CAUSES.groups.filter(function (g) { return g.id === id; })[0] || null; }
    function causeOf(v) {
      var m = /^p(\d{1,4})$/.exec(v || "");
      return CAUSES.causes.filter(function (c) { return c.id === v || (m && c.link === "/p/" + m[1] + ".html"); })[0] || null;
    }
    function groupOf(v) { var c = causeOf(v); return c ? c.group : /^(zakat|sadaqa)$/.test(v) ? v : "general"; }
    function hasCauses(g) { return CAUSES.causes.some(function (c) { return c.group === g; }); }
    function title(c) { return EN && c.en ? c.en : String(c.title || "").trim(); }
    // the cards of one group: icon tile, title, one line; the picked one carries the gold ring and the check
    function build(g) {
      builtFor = g;
      var list = CAUSES.causes.filter(function (c) { return c.group === g; });
      grid.hidden = !list.length;
      grid.innerHTML = list.map(function (c, i) {
        return '<button type="button" role="radio" class="cause" data-c="' + esc(c.id) + '" aria-checked="false" tabindex="-1" style="--i:' + i + '">' +
          '<span class="c-tile">' + (icons ? icons.svg(c.icon) : "") + "</span>" +
          '<span class="c-txt"><b>' + esc(title(c)) + "</b>" + (c.desc ? "<small>" + esc(c.desc) + "</small>" : "") + "</span>" +
          '<span class="c-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></button>';
      }).join("");
      if (!list.length) return;
      grid.classList.remove("in"); void grid.offsetWidth; grid.classList.add("in"); // replay the stagger
    }
    function sync() {
      var v = purpose.value, g = groupOf(v), c = causeOf(v), on = null;
      chips.forEach(function (ch) {
        var hit = ch.dataset.p === g;
        ch.setAttribute("aria-checked", hit ? "true" : "false"); ch.tabIndex = hit ? 0 : -1;
        if (hit) on = ch;
      });
      box.style.setProperty("--on", String(Math.max(0, chips.indexOf(on))));
      box.classList.toggle("is-zakat", g === "zakat");
      if (g !== builtFor) build(g);
      var cards = grid.querySelectorAll(".cause"), any = false;
      cards.forEach(function (k) { var hit = !!c && k.dataset.c === c.id; k.setAttribute("aria-checked", hit ? "true" : "false"); k.tabIndex = hit ? 0 : -1; any = any || hit; });
      if (!any && cards.length) cards[0].tabIndex = 0;
      grid.classList.toggle("picked", any);
      // "مشروع معيّن" stays open when the donor picked a project from the list, so the choice stays visible
      if (more && /^p\d{1,4}$/.test(v) && !c) more.open = true;
      var gd = groupData(g), key = g + ":" + (c ? c.id : "");
      if (!note || key === shownKey) return; // the live region speaks only when the line really changes
      shownKey = key;
      var line = c ? (c.desc ? title(c) + ": " + c.desc : title(c)) : g === "general" ? (CAUSES.note || NOTE.general) : (gd && gd.note) || NOTE[g] || "";
      if (!c && gd && gd.hint && hasCauses(g)) line = gd.hint + " · " + line;
      note.textContent = line;
      if (g === "zakat" && !c) {
        var a = document.createElement("a"); a.href = "/zakat.html#zakat-uses"; a.textContent = "التفاصيل ←";
        note.appendChild(document.createTextNode(" ")); note.appendChild(a);
      }
    }
    function pick(v) {
      if (!purpose.querySelector('option[value="' + v + '"]')) return;
      purpose.value = v;
      purpose.dispatchEvent(new Event("change", { bubbles: true }));
      if (window.mersalTap) window.mersalTap(8);
    }
    box.addEventListener("click", function (e) { var c = e.target.closest("[data-p]"); if (c) pick(c.dataset.p); });
    grid.addEventListener("click", function (e) { var k = e.target.closest("[data-c]"); if (k) pick(k.dataset.c); });
    // radiogroup keys: the arrows move to the next / previous item and pick it (Left is "next" in RTL), Home / End jump
    function keys(root, sel, attr) {
      root.addEventListener("keydown", function (e) {
        var vis = Array.prototype.slice.call(root.querySelectorAll(sel)), i = vis.indexOf(document.activeElement);
        if (i < 0) return;
        var rtl = getComputedStyle(root).direction === "rtl", n = vis.length, j = -1;
        if (e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) j = (i + 1) % n;
        else if (e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")) j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = n - 1;
        if (j < 0) return;
        e.preventDefault();
        vis[j].focus();
        pick(vis[j].getAttribute(attr));
      });
    }
    keys(box, "[data-p]", "data-p"); keys(grid, "[data-c]", "data-c");
    purpose.addEventListener("change", sync);
    optionsReady.then(function () { builtFor = ""; sync(); });
    sync();
  })();

  // What a donation can do (figures from the old site's pages). Between the hospital / monthly-treatment lines and the
  // generic ones: the same "{n} {unit} في {campaign}" line as the home dock (window.mersalUnit from js/impact.js), over
  // every open home campaign for a general gift, or over the chosen project's own campaign. Zakat and sadaqa keep the
  // generic lines, so no campaign is presented as zakat-eligible.
  function unitLine(a, list) { return window.mersalUnit && list.length ? window.mersalUnit.line(a, list) : ""; }
  function updateImpact() {
    var a = amt() || 0, msg = "", l = "", camp = null;
    if (purpose.value === "p30" && a >= 25000) msg = "تبرعك يساوي متر وقف خيري في مستشفى مرسال للأطفال 🏥";
    else if (purpose.value === "p30" && a >= 1000) msg = "تبرعك يساوي " + fmt.format(Math.floor(a / 1000)) + " سهم عام في مستشفى مرسال 🏥";
    else if (purpose.value === "p30" && a >= 500) msg = "تبرعك يساوي سهم أجهزة طبية في مستشفى مرسال 🏥";
    else if (purpose.value === "p37" && a >= 100) msg = "سهم التبرع للعلاج الشهري 100 جنيه، تبرعك = " + fmt.format(Math.floor(a / 100)) + " سهم 💊";
    else if (purpose.value === "general" && (l = unitLine(a, CAMPAIGNS))) msg = "تبرعك يساوي " + l + " 💚";
    else if (purpose.value !== "zakat" && purpose.value !== "sadaqa" &&
      (camp = CAMPAIGNS.filter(function (c) { return c && c.purpose === purpose.value; })[0]) && (l = unitLine(a, [camp]))) msg = "تبرعك يساوي " + l;
    else if (a >= 5000) msg = "تبرعك ممكن يغطي العلاج الشهري لمريض كامل 💚";
    else if (a >= 500) msg = "تبرعك بيساهم في كشف وتحاليل لمريض غير قادر 🩺";
    else if (a >= 10) msg = "كل جنيه بيفرق مع مريض محتاج 💚";
    document.getElementById("impact").textContent = msg;
    // the desktop "ملخص تبرعك" rail (css/desktop.css shows it from 1180px): a display-only mirror of step 1
    if (document.getElementById("don-sum")) {
      document.getElementById("ds-amt").textContent = fmt.format(amt() || 0);
      var dsOpt = purpose.options[purpose.selectedIndex]; document.getElementById("ds-for").textContent = dsOpt ? dsOpt.text : "";
      document.getElementById("ds-impact").textContent = msg;
    }
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
      el.querySelector("b").textContent = fmt.format(amt() || 0) + " جنيه";
      el.querySelector(".s-for").textContent = purposeText();
    };
  })();
  function go(n, quiet) { // quiet: the automatic step 2 on load (no scroll jump, no focus, no keyboard)
    // css: the new step slides in from the side it comes from (data-dir)
    form.dataset.dir = n > cur ? "fwd" : n < cur ? "back" : (form.dataset.dir || "fwd");
    cur = n;
    clearPayAlert();
    stepEls.forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    sumBar(n);
    dots.forEach(function (d) {
      var k = Number(d.dataset.step); d.classList.toggle("on", k === n); d.classList.toggle("done", k < n);
      if (k === n) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
    });
    if (n === 3) fillSummary();
    var first = form.querySelector('.step[data-step="' + n + '"] input:not([disabled]), .step[data-step="' + n + '"] select');
    if (quiet) return;
    form.scrollIntoView({ behavior: SMOOTH, block: "start" });
    if (first && n === 2) setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
  }
  // Inline errors in Egyptian Arabic (no browser bubbles): a <p class="f-err" id="err-<field>"> inside the field's .field
  // (forms.css shows it under .invalid), aria-invalid + aria-describedby on the input, focus on the first wrong field.
  // The rules are the old ones (10..1,000,000; a name; 10+ digits, Egyptian 01… for the app's Paymob; an e-mail).
  var MSG = { amount: "المبلغ من 10 لـ 1,000,000 جنيه", name: "اكتب اسمك", email: "اكتب إيميل صحيح",
    phone: PROVIDER === "app" ? "اكتب رقم موبايل مصري (11 رقم يبدأ بـ 01)" : "اكتب رقم موبايل صحيح" };
  function describe(input, id, on) {
    var ids = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) { return x && x !== id; });
    if (on) ids.push(id);
    if (ids.length) input.setAttribute("aria-describedby", ids.join(" ")); else input.removeAttribute("aria-describedby");
  }
  function setErr(input, html) {
    var field = input.closest(".field"), id = "err-" + input.id, p = document.getElementById(id);
    if (!field) return;
    if (!html) {
      field.classList.remove("invalid"); input.removeAttribute("aria-invalid"); describe(input, id, false);
      if (p) p.remove();
      return;
    }
    if (!p) { p = document.createElement("p"); p.className = "f-err"; p.id = id; (input.closest(".input-suffix") || input).insertAdjacentElement("afterend", p); } // right under the box, above any hint
    p.innerHTML = html;
    field.classList.add("invalid"); input.setAttribute("aria-invalid", "true"); describe(input, id, true);
    p.querySelectorAll("[data-tab]").forEach(wireTab);
  }
  function phoneOk(v) { return asciiDigits(v).replace(/[^\d]/g, "").length >= 10 && (PROVIDER !== "app" || !!egyptMobile(v)); }
  function emailOk(el) { return !!el.value.trim() && el.checkValidity(); }
  function nameOk(el) { return el.disabled || !!el.value.trim(); }
  function valid(n) {
    var bad = [];
    function check(el, ok, msg) { if (ok) setErr(el, ""); else bad.push([el, msg]); }
    if (n === 1) { var a = amt(); check(amount, a >= 10 && a <= 1000000 && Math.floor(a) === a, MSG.amount); }
    if (n === 2) {
      var nm = document.getElementById("name"), ph = document.getElementById("phone"), em = document.getElementById("email");
      check(nm, nameOk(nm), MSG.name);
      // Paymob through the app takes Egyptian mobile numbers only (its function's rule): donors abroad get the account abroad
      check(ph, phoneOk(ph.value), MSG.phone + (PROVIDER === "app" && asciiDigits(ph.value).replace(/[^\d]/g, "").length >= 10
        ? ' <a href="#abroad" data-tab="abroad">أو حوّل على حساب مرسال في ألمانيا</a>' : ""));
      check(em, emailOk(em), MSG.email);
    }
    bad.forEach(function (b) { setErr(b[0], b[1]); });
    if (bad.length) {
      var el = bad[0][0];
      try { el.focus({ preventScroll: true }); } catch (x) {}
      el.scrollIntoView({ behavior: SMOOTH, block: "center" });
    }
    return !bad.length;
  }
  // an error goes away as soon as the donor fixes the field
  ["amount", "name", "phone", "email"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", function () { if (el.getAttribute("aria-invalid")) setErr(el, ""); });
  });
  // «تبرع بدون ذكر اسمي»: the name is not needed (disabled fields are skipped, nothing moves on the page); a polite line
  // says what will be shown instead. The saved name stays in the field for the next time.
  (function anonName() {
    var anon = document.getElementById("anon"), nm = document.getElementById("name"), note = document.getElementById("anon-note");
    if (!anon || !nm) return;
    function sync() {
      nm.disabled = anon.checked;
      if (anon.checked) setErr(nm, "");
      if (note) note.textContent = anon.checked ? "هيظهر اسمك: فاعل خير" : "";
    }
    anon.addEventListener("change", sync);
    if (anon.checked) sync(); // restored by the browser
  })();
  // the hint for donors abroad only where a foreign number is accepted (the app's Paymob takes Egyptian mobiles only)
  if (PROVIDER === "app") { var phHint = document.getElementById("phone-hint"); if (phHint) { describe(document.getElementById("phone"), "phone-hint", false); phHint.remove(); } }
  form.querySelectorAll("[data-next]").forEach(function (b) { b.addEventListener("click", function () { if (valid(cur)) go(cur + 1); }); });
  form.querySelectorAll("[data-prev]").forEach(function (b) { b.addEventListener("click", function () { go(cur - 1); }); });
  dots.forEach(function (d) { d.addEventListener("click", function () { var k = Number(d.dataset.step); if (k < cur) go(k); }); });

  function purposeText() { var o = purpose.options[purpose.selectedIndex]; return o ? o.textContent : ""; }
  function fillSummary() {
    var a = amt(), anon = document.getElementById("anon").checked;
    document.getElementById("summary").innerHTML =
      "<dt>المبلغ</dt><dd><b>" + fmt.format(a) + " جنيه</b></dd>" +
      "<dt>تبرع لـ</dt><dd>" + esc(purposeText()) + "</dd>" +
      "<dt>المتبرع</dt><dd>" + (anon ? "فاعل خير" : esc(document.getElementById("name").value)) + "</dd>" +
      "<dt>الموبايل</dt><dd dir=\"ltr\">" + esc(document.getElementById("phone").value) + "</dd>" +
      (window.MersalGift ? window.MersalGift.summaryRow() : "");
    document.getElementById("pay-amount").textContent = fmt.format(a) + " جنيه";
  }

  // the other ways to give (the same three buttons everywhere a card payment did not go through)
  function altWays() {
    return '<div class="gw-alt">' +
      '<a class="btn btn-teal" href="tel:19340">📞 مندوب لحد البيت 19340</a>' +
      '<a class="btn btn-ghost-teal" href="#bank" data-tab="bank">🏦 تحويل بنكي</a>' +
      '<a class="btn btn-ghost-teal" href="#wallets" data-tab="wallets">📱 فوري 9200 / إنستاباي</a>' +
      "</div>";
  }
  function wireTab(a) {
    if (a._wired) return; a._wired = true;
    a.addEventListener("click", function (ev) { ev.preventDefault(); openTab(a.dataset.tab); document.querySelector(".tabs").scrollIntoView({ behavior: SMOOTH }); });
  }
  function clearPayAlert() { var a = form.querySelector(".pay-alert"); if (a) a.remove(); }
  function show(kind, html) { result.innerHTML = '<div class="alert ' + kind + '">' + html + "</div>"; result.scrollIntoView({ behavior: SMOOTH, block: "center" }); }
  var gw = document.getElementById("gateway"), btn = document.getElementById("pay-btn"), payRun = 0;
  // Back from the gateway's page with the browser's Back (the page comes back from the back-forward cache as it was
  // left, spinner and all): the redirect is dropped and the donor is on step 3 again, with the pay button working
  addEventListener("pageshow", function (e) {
    if (!e.persisted || RETURNING || sheet || gw.hidden) return;
    payRun++; gw.hidden = true; gw.classList.remove("stopped"); btn.disabled = false;
    document.getElementById("gw-title").textContent = GW.go;
    go(3);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cur !== 3) { if (valid(cur)) go(cur + 1); return; }
    clearPayAlert();
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
      '<p>تقدر تكمل تبرعك بـ <b>' + fmt.format(amt()) + " جنيه</b> دلوقتي بطريقة من دول:</p>" +
      altWays() +
      '<button type="button" class="link-btn" id="gw-back">← رجوع لتعديل التبرع</button>';
    if (window.MersalGift) window.MersalGift.afterDonation(document.getElementById("gw-body"), { paid: false, amount: amt() || 0, purpose: purpose.value, purposeTitle: purposeText().trim(), before: document.getElementById("gw-back") });
    gw.querySelectorAll("[data-tab]").forEach(wireTab);
    document.getElementById("gw-back").addEventListener("click", function () { gw.hidden = true; btn.disabled = false; go(3); });
  }

  // Live: POST /api/checkout, then the gateway it answers for. Banque Misr's script is loaded first when the console
  // chose Banque Misr (as before), or after the answer when the server picked it.
  function requestCheckout() {
    var anon = document.getElementById("anon").checked;
    return fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(amt()), purpose: purpose.value,
        name: anon ? "فاعل خير" : document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(), phone: document.getElementById("phone").value.trim()
      })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw d; return d; }); });
  }
  // what the donor chose travels with the order: the page reloads empty when the gateway sends them back
  function remember(d, gwName) {
    try { localStorage.setItem(KEY, JSON.stringify({ orderId: d.orderId, gw: gwName, successIndicator: d.successIndicator, amount: amt() || 0, purpose: purpose.value, purposeTitle: purposeText().trim(), at: Date.now() })); } catch (x) {}
  }
  function loadMpgs(done) {
    var s = document.createElement("script");
    s.src = "https://banquemisr.gateway.mastercard.com/static/checkout/checkout.min.js";
    s.setAttribute("data-error", "mersalPayError");
    s.setAttribute("data-cancel", "mersalPayCancel");
    s.onload = done;
    // the bank's page script could not load (network, blocker): say so instead of spinning forever
    s.onerror = function () { s.remove(); window.mersalPayError({ message: "تعذّر فتح صفحة الدفع الآمنة لبنك مصر. اتأكد من الإنترنت وحاول تاني، أو اتبرع بطريقة تانية من التبويبات اللي فوق." }); };
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
  // the payment could not start: the message sits right above the pay button (the retry), with 19340 tappable and the
  // other ways to give; it goes away on the next try or step change
  window.mersalPayError = function (err) {
    gw.hidden = true; btn.disabled = false; go(3);
    var m = err && typeof err.message === "string" && err.message ? err.message : "";
    var txt = m ? esc(m) + (/19340/.test(m) ? "" : " لو المشكلة استمرت كلمنا على 19340.") : "حدث خطأ أثناء عملية الدفع. حاول مرة أخرى أو كلمنا على 19340.";
    var box = document.createElement("div");
    box.className = "alert err pay-alert"; box.setAttribute("role", "alert");
    box.innerHTML = "<p>" + txt.replace(/19340/g, '<a href="tel:19340">19340</a>') + "</p>" + altWays();
    var nav = form.querySelector('.step[data-step="3"] .step-nav');
    nav.parentNode.insertBefore(box, nav);
    box.querySelectorAll("[data-tab]").forEach(wireTab);
    box.scrollIntoView({ behavior: SMOOTH, block: "center" });
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
    var rec = { orderId: d.orderId, amount: amt() || 0, purpose: purpose.value, purposeTitle: purposeText().trim() };
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
      (window.MersalGift && window.MersalGift.giftLine ? window.MersalGift.giftLine(true) : "") +
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
          // not paid (declined, cancelled, abandoned): plain words (never the gateway's status code), the amount and the
          // purpose of a payment started in the last day come back, one tap to try again, or another way to give
          var why = o.status === "DECLINED" ? "البنك رفض العملية ومفيش أي مبلغ اتخصم." : "العملية مكملتش ومفيش أي مبلغ اتخصم.";
          if (MODE === "off") { show("err", why + " تقدر تتبرع بتحويل بنكي أو من المحافظ أو تكلمنا على 19340."); return; }
          var back = Number(saved.amount) >= 10 && Date.now() - Number(saved.at) < 864e5;
          if (back) {
            amount.value = Math.round(Number(saved.amount)); syncChips(); updateImpact();
            optionsReady.then(function () {
              var pv = String(saved.purpose || "").replace(/[^\w-]/g, "");
              if (pv && purpose.querySelector('option[value="' + pv + '"]') && purpose.value !== pv) { purpose.value = pv; purpose.dispatchEvent(new Event("change", { bubbles: true })); }
            });
          }
          show("err", "<p>" + why + (back ? " تقدر تحاول تاني بنفس المبلغ، أو تتبرع بطريقة تانية:" : " تقدر تحاول تاني من الفورم تحت، أو تتبرع بطريقة تانية:") + "</p>" +
            (back ? '<button type="button" class="btn btn-gold btn-block" id="pay-retry">حاول تاني بـ ' + fmt.format(amt()) + " جنيه</button>" : "") + altWays());
          result.querySelectorAll("[data-tab]").forEach(wireTab);
          var rb = document.getElementById("pay-retry");
          if (rb) rb.addEventListener("click", function () {
            var nm = document.getElementById("name"), ph = document.getElementById("phone"), em = document.getElementById("email");
            result.innerHTML = "";
            go(nameOk(nm) && phoneOk(ph.value) && emailOk(em) ? 3 : 2);
          });
        }
      })
      .catch(function () { show("err", "تعذّر التأكد من عملية الدفع. لو تم خصم المبلغ تواصل معنا على 19340" + ref() + "."); });
  }
})();
