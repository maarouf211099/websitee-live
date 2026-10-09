// Installable app + offline support, front end. Loaded on every public page after layout.js.
//  1. registers /sw.js (https or localhost only; never inside /admin/ or in a frame)
//  2. offers a one-time "ثبّت تطبيق مرسال" card: Chrome/Android through beforeinstallprompt, iOS Safari as a short
//     "مشاركة ثم إضافة إلى الشاشة الرئيسية" hint. Never on the first page view of a visit, never on the donate /
//     zakat / request pages, never on top of the bottom bar or a donate button (it steps aside while one is under it).
//     Closing it, or installing, is remembered in localStorage ("mersalPwa").
//  3. a footer link "ثبّت تطبيق مرسال" whenever installing is possible (also after the card was closed)
//  4. a short notice when the connection drops or comes back
// Automated browsers (navigator.webdriver, i.e. the site's Playwright suites) get none of this, so their page.route()
// mocks keep working; css/pwa.css is added by this script, pages only need the <script> tag.
(function () {
  "use strict";
  var d = document, nav = navigator, html = d.documentElement;
  if (/^\/admin(\/|$)/i.test(location.pathname) || nav.webdriver === true) return;
  try { if (window.top !== window.self) return; } catch (x) { return; }

  function mq(q) { try { return matchMedia(q).matches; } catch (x) { return false; } }
  var standalone = mq("(display-mode: standalone)") || mq("(display-mode: fullscreen)") || mq("(display-mode: minimal-ui)") || nav.standalone === true;
  var reduce = mq("(prefers-reduced-motion: reduce)");
  if (standalone) html.classList.add("pwa-standalone");

  // ---------- 1. service worker ----------
  // SW_ON = false is the off switch: every page then removes the worker and its caches (see the top of /sw.js)
  var SW_ON = true;
  var secure = location.protocol === "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if ("serviceWorker" in nav && secure) {
    var register = SW_ON ? function () {
      nav.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(function () {});
    } : function () {
      nav.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }).catch(function () {});
      if (window.caches) caches.keys().then(function (k) { k.forEach(function (n) { if (n.indexOf("mersal-") === 0) caches.delete(n); }); }).catch(function () {});
    };
    if (d.readyState === "complete") register(); else addEventListener("load", register, { once: true });
  }

  // ---------- shared bits ----------
  var KEY = "mersalPwa";
  function getState() { try { return (JSON.parse(localStorage.getItem(KEY) || "null") || {}).s || ""; } catch (x) { return "blocked"; } }
  function setState(s) { try { localStorage.setItem(KEY, JSON.stringify({ s: s, t: Date.now() })); } catch (x) {} }
  // page views in this visit (sessionStorage lives as long as the tab); unreadable storage = never prompt
  var views = 0;
  try { views = (parseInt(sessionStorage.getItem("mersalPwaViews"), 10) || 0) + 1; sessionStorage.setItem("mersalPwaViews", String(views)); } catch (x) { views = 0; }

  var cssReady = new Promise(function (resolve) {
    var link = d.querySelector('link[href^="/css/pwa.css"]');
    if (link && link.sheet) { resolve(true); return; }
    if (!link) { link = d.createElement("link"); link.rel = "stylesheet"; link.href = "/css/pwa.css"; d.head.appendChild(link); }
    link.addEventListener("load", function () { resolve(true); });
    link.addEventListener("error", function () { resolve(false); });
  });

  var I = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    share: '<svg class="pwa-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>',
    add: '<svg class="pwa-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    get: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7v7M9 11l3 3 3-3M10.5 18.5h3"/></svg>',
    off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.2A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 3.7-2.2M13.8 10a10 10 0 0 1 5.2 2.5M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18"/></svg>',
    on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  // ---------- 2. install card ----------
  var ua = nav.userAgent || "";
  var ios = /iPhone|iPad|iPod/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  var iosSafari = ios && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury|FBAN|FBAV|FB_IAB|Instagram|Line\/|GSA\/|Snapchat|Twitter|TikTok|musical_ly|Bytedance|Pinterest/i.test(ua);
  var BUSY_PAGE = /\/(donate|zakat|help|volunteer|contact|offline|404)\.html$/i; // a donor or a request in progress is never interrupted
  // what the card must never cover: the bottom bar, the floating donate buttons and every donate / submit button
  var GUARD = ".m-bar, .m-donate i, .fab-donate, .z-bar, .btn-gold, .do-btn, .sl-btn, .camp-give, .way2, a.btn[href*='donate'], button[type='submit']";
  var deferred = null, card = null, cardAuto = false, seen = false, timer = 0, raf = 0, toastUp = false;

  function canInstall() { return !standalone && (!!deferred || iosSafari); }
  function eligible() {
    return canInstall() && views >= 2 && !getState() && nav.onLine !== false && !BUSY_PAGE.test(location.pathname) && !d.querySelector(".nf");
  }
  function overlayOpen() {
    var s = d.querySelector(".search-panel");
    return d.body.classList.contains("menu-open") || (s && !s.hidden) || !!d.querySelector(".lightbox:not([hidden]), .cm-modal:not([hidden])");
  }
  function schedule(ms) {
    if (timer || card || !eligible()) return;
    timer = setTimeout(function () {
      timer = 0;
      if (!eligible() || card) return;
      if (d.hidden || overlayOpen()) { schedule(4000); return; }
      showCard(iosSafari && !deferred ? "ios" : "prompt", true);
    }, ms || 3500);
  }

  function cardHtml(kind) {
    var isIos = kind === "ios";
    return '<div class="pwa-card' + (isIos ? " pwa-ios" : "") + '" id="pwa-card" role="region" aria-labelledby="pwa-t">' +
      '<picture class="pwa-app"><source type="image/webp" srcset="/img/icon-192.webp"><img src="/img/icon-192.png" alt="" width="48" height="48"></picture>' +
      '<div class="pwa-body"><b id="pwa-t">ثبّت تطبيق مرسال</b>' +
      (isIos
        ? '<p>اضغط <em>مشاركة</em> ' + I.share + ' وبعدين <em>إضافة إلى الشاشة الرئيسية</em> ' + I.add + '</p>' +
          '<div class="pwa-btns"><button type="button" class="btn btn-teal pwa-close">تمام</button></div>'
        : '<p>افتح مرسال من شاشتك الرئيسية بضغطة: التبرع والزكاة والخط الساخن، والصفحات اللي فتحتها قبل كده بتفتح حتى من غير نت.</p>' +
          '<div class="pwa-btns"><button type="button" class="btn btn-teal pwa-install">ثبّت التطبيق</button><button type="button" class="pwa-later pwa-close">مش دلوقتي</button></div>') +
      '</div><button type="button" class="pwa-x pwa-close" aria-label="إغلاق">' + I.x + "</button></div>";
  }

  function showCard(kind, auto) {
    if (card) return;
    cssReady.then(function (ok) {
      if (!ok || card || (auto && !eligible())) return;
      d.body.insertAdjacentHTML("beforeend", cardHtml(kind));
      card = d.getElementById("pwa-card"); cardAuto = auto; seen = false;
      card.addEventListener("click", function (e) {
        if (e.target.closest(".pwa-install")) install();
        else if (e.target.closest(".pwa-close")) { setState("dismissed"); hideCard(); }
      });
      card.addEventListener("keydown", function (e) { if (e.key === "Escape") { setState("dismissed"); hideCard(); } });
      watch(true);
      check();
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (card) card.classList.add("in"); }); });
    });
  }

  function hideCard() {
    if (!card) return;
    var c = card; card = null; watch(false);
    if (c.contains(d.activeElement)) d.activeElement.blur();
    c.classList.remove("in"); c.classList.add("out");
    setTimeout(function () { c.remove(); }, reduce ? 0 : 320);
  }

  // the card steps aside (fades out, stays put) while a donate button, the bottom bar or a notice is under it
  function check() {
    raf = 0;
    if (!card) return;
    var r = card.getBoundingClientRect(), hit = toastUp;
    if (!hit) {
      var els = d.querySelectorAll(GUARD);
      for (var i = 0; i < els.length && !hit; i++) {
        if (card.contains(els[i])) continue;
        var b = els[i].getBoundingClientRect();
        hit = b.width > 0 && b.height > 0 && b.bottom > r.top && b.top < r.bottom && b.right > r.left && b.left < r.right;
      }
    }
    if (card.contains(d.activeElement) && !toastUp) hit = false; // never pull the card away from a keyboard user inside it
    card.classList.toggle("pwa-tucked", hit);
    // the automatic card counts as "offered" once it has really been on screen (one time per device)
    if (!hit && !seen) { seen = true; if (cardAuto) setState("shown"); }
  }
  function onMove() { if (!raf) raf = requestAnimationFrame(check); }
  var poll = 0;
  function watch(on) {
    var m = on ? "addEventListener" : "removeEventListener";
    window[m]("scroll", onMove, { passive: true });
    window[m]("resize", onMove);
    clearInterval(poll);
    if (on) poll = setInterval(onMove, 700); // carousels and late content move without a scroll
  }

  function install() {
    var e = deferred;
    if (!e) { hideCard(); return; }
    deferred = null; footerLink();
    hideCard();
    try {
      e.prompt();
      Promise.resolve(e.userChoice).then(function (c) { setState(c && c.outcome === "accepted" ? "installed" : "dismissed"); }, function () {});
    } catch (x) {}
  }

  addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); // our card (or the footer link) replaces the browser's own mini bar
    deferred = e;
    footerLink();
    schedule();
  });
  addEventListener("appinstalled", function () {
    deferred = null; setState("installed"); hideCard(); footerLink();
    toast("اتثبّت تطبيق مرسال على جهازك. تقدر تفتحه من الشاشة الرئيسية.", "on", 4500);
  });

  // ---------- 3. footer link (also brings the card back after it was closed) ----------
  function footerLink() {
    var li = d.getElementById("pwa-foot");
    if (!canInstall()) { if (li) li.remove(); return; }
    var list = d.querySelector(".site-footer .two-col");
    if (li || !list) return;
    cssReady.then(function (ok) {
      if (!ok || d.getElementById("pwa-foot") || !canInstall()) return;
      list.insertAdjacentHTML("beforeend", '<li id="pwa-foot"><button type="button" class="pwa-foot-btn">' + I.get + "<span>ثبّت تطبيق مرسال</span></button></li>");
      d.querySelector("#pwa-foot button").addEventListener("click", function () { window.mersalInstall(); });
    });
  }
  // usable from anywhere (e.g. a menu row): true when an install prompt or the iOS hint was shown
  window.mersalInstall = function () {
    if (deferred) { install(); return true; }
    if (iosSafari && !standalone) { hideCard(); showCard("ios", false); return true; }
    return false;
  };

  // ---------- 4. connection notice ----------
  var toastEl = null, toastTimer = 0;
  function toast(text, kind, ms) {
    cssReady.then(function (ok) {
      if (!ok) return;
      if (!toastEl) {
        // the live region exists (empty) before its text changes, so screen readers announce the change
        d.body.insertAdjacentHTML("beforeend", '<div class="pwa-toast" id="pwa-toast" role="status" aria-live="polite"></div>');
        toastEl = d.getElementById("pwa-toast");
      }
      clearTimeout(toastTimer);
      requestAnimationFrame(function () {
        toastEl.className = "pwa-toast pwa-" + kind;
        toastEl.innerHTML = (I[kind] || "") + "<span></span>";
        toastEl.lastChild.textContent = text;
        requestAnimationFrame(function () { toastEl.classList.add("show"); });
        toastUp = true; if (card) check();
        toastTimer = setTimeout(function () {
          toastEl.classList.remove("show"); toastUp = false; if (card) check();
        }, ms || 4000);
      });
    });
  }
  addEventListener("offline", function () { toast("انت مش متصل بالإنترنت دلوقتي. الصفحات اللي فتحتها قبل كده هتفضل تفتح.", "off", 6000); });
  addEventListener("online", function () { toast("رجع النت تاني", "on", 2600); schedule(); });

  // ---------- start ----------
  footerLink();
  if (nav.onLine === false) toast("انت مش متصل بالإنترنت دلوقتي. بتشوف نسخة محفوظة من الصفحة.", "off", 5000);
  if (iosSafari) schedule();
})();
