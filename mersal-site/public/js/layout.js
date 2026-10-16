// Shared header and footer for every page. Contact details, social links and the footer text live in SITE below.
(function () {
  // SITE is edited from the admin console ("بيانات الموقع" -> PUT /api/console/site) and mirrored to /data/site.json:
  // the API rewrites everything between the mersal:site markers, so keep that block a plain object literal
  // (one key per line, no comments). payMode is the card payment switch, set from the console settings:
  //   "off"  = hidden everywhere
  //   "demo" = full donation flow that stops before the payment gateway (nothing is charged)
  //   "live" = real payments through the gateway in payProvider (needs that gateway's settings in Azure)
  // payProvider (also from the console settings, "بوابة الدفع"; saved whenever payMode is set to "live"; absent = Banque
  // Misr): "app" (Paymob through the Mersal app's backend, no settings needed) | "paymob" (Paymob Unified Checkout with
  // this site's own keys) | "mpgs" (Banque Misr Hosted Checkout).
  var SITE = /* mersal:site */ {
    payMode: "live",
    payProvider: "paymob",
    hotline: "19340",
    phone: "01200002870",
    whatsapp: "",
    email: "info@mersal-ngo.org",
    address: "8 شارع 263 - المعادي الجديدة، القاهرة",
    social: {
      facebook: "https://www.facebook.com/Mersalfoundation",
      instagram: "https://www.instagram.com/mersal_foundation",
      x: "https://twitter.com/Mersalcharity",
      linkedin: "https://www.linkedin.com/company/18765843/",
      youtube: "https://www.youtube.com/channel/UC30Ek5Wl1us6LD6BLkegsHQ",
      tiktok: ""
    },
    footer: {
      name: "مؤسسة مرسال للأعمال الخيرية والتنموية",
      text: "مساندة الفقراء وذوي الدخول المحدودة في توفير احتياجاتهم الأساسية وإحداث فارق إيجابي في مستوى حياتهم.",
      stripTitle: "محتاج مساعدة في التبرع؟",
      stripText: "مندوبنا يوصلك لحد باب البيت",
      links: [
        {
          title: "عن مرسال",
          href: "/p/3.html"
        },
        {
          title: "اتصل بنا",
          href: "/contact.html"
        },
        {
          title: "تبرع الآن",
          href: "/donate.html"
        },
        {
          title: "طلب مساعدة",
          href: "/help.html"
        },
        {
          title: "مستشفى مرسال",
          href: "/p/30.html"
        },
        {
          title: "المشاريع",
          href: "/#projects"
        },
        {
          title: "فروع مرسال",
          href: "/p/46.html"
        },
        {
          title: "كارت عافية",
          href: "/afia.html"
        },
        {
          title: "حساب الزكاة",
          href: "/zakat.html"
        },
        {
          title: "اهدي تبرع أو صدقة على روح",
          href: "/gift.html"
        },
        {
          title: "الأسئلة الشائعة",
          href: "/p/51.html"
        },
        {
          title: "أخبار مرسال",
          href: "/news.html"
        },
        {
          title: "ألبومات الصور",
          href: "/albums.html"
        },
        {
          title: "فيديوهات",
          href: "{youtube}"
        },
        {
          title: "سياسة الخصوصية",
          href: "/privacy.html"
        },
        {
          title: "شروط الاستخدام",
          href: "/terms.html"
        }
      ]
    },
    legal: {
      regNo: "",
      regYear: "",
      regBody: "",
      permitNo: "",
      permitUntil: ""
    }
  } /* /mersal:site */;
  SITE.social = SITE.social || {}; SITE.footer = SITE.footer || {};
  // Legal identity (إشهار / fundraising permit): SITE.legal, from the console ("بيانات الموقع"). Nothing renders while regNo is empty.
  var LEGAL = SITE.legal && typeof SITE.legal === "object" ? SITE.legal : { regNo: "", regYear: "", regBody: "", permitNo: "", permitUntil: "" };
  window.MERSAL_LEGAL = LEGAL;
  SITE.onlinePayment = SITE.payMode !== "off";
  // WhatsApp number -> wa.me link (an Egyptian 01xxxxxxxxx number gets the +20 country code)
  function waLink(n) { var d = String(n || "").replace(/\D/g, ""); if (/^0\d{10}$/.test(d)) d = "20" + d.slice(1); return "https://wa.me/" + d; }
  window.mersalWaLink = waLink;

  // Responsive <picture> with a WebP source. tools/optimize_images.py guarantees a .webp sibling for every
  // jpg/png under /img/ (not /img/uploads/, where the admin console stores originals only).
  function webpOf(u) { return /^\/img\/(?!uploads\/)[^?#]+\.(jpe?g|png)$/i.test(u || "") ? u.replace(/\.(jpe?g|png)$/i, ".webp") : null; }
  function escA(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  // opt: { alt, cls, w, h, lazy (default true), priority ("high"), srcset: [[url, "1200w"], ...], sizes, attrs (raw string), defer (use data- attributes) }
  window.mersalPic = function (src, opt) {
    opt = opt || {};
    var pre = opt.defer ? "data-" : "", wp = webpOf(src);
    var set = (opt.srcset || []).map(function (e) { return escA(e[0]) + " " + escA(e[1]); }).join(", ");
    var setW = (opt.srcset || []).map(function (e) { return webpOf(e[0]); });
    var hasW = wp && setW.every(Boolean);
    var sizes = opt.sizes ? ' sizes="' + escA(opt.sizes) + '"' : "";
    var html = "<picture>";
    if (hasW) html += '<source type="image/webp" ' + pre + 'srcset="' + (set ? setW.map(function (u, i) { return escA(u) + " " + escA(opt.srcset[i][1]); }).join(", ") : escA(wp)) + '"' + sizes + ">";
    html += "<img " + pre + 'src="' + escA(src) + '"' + (set ? " " + pre + 'srcset="' + set + '"' + sizes : "") +
      ' alt="' + escA(opt.alt) + '"' + (opt.cls ? ' class="' + escA(opt.cls) + '"' : "") +
      (opt.w ? ' width="' + opt.w + '" height="' + opt.h + '"' : "") +
      (opt.priority ? ' fetchpriority="' + opt.priority + '"' : opt.lazy === false ? "" : ' loading="lazy" decoding="async"') +
      (opt.attrs ? " " + opt.attrs : "") + "></picture>";
    return html;
  };
  window.mersalWebp = webpOf;
  // tiny haptic tick on phones that support it (Android Chrome); silent elsewhere
  window.mersalTap = function (ms) { try { if (navigator.vibrate && matchMedia("(hover: none)").matches) navigator.vibrate(ms || 8); } catch (e) {} };
  window.MERSAL_SITE = SITE;
  if (!SITE.onlinePayment) document.documentElement.classList.add("no-online-pay");

  // Structured data for search engines (home page only), built from SITE so the console edits stay in sync.
  // Only facts that are on the site: name, contact details, address, social profiles and the donate page.
  if (/^\/(index\.html)?$/.test(location.pathname) && !document.querySelector("script[data-org]")) (function () {
    var BASE = "https://www.mersal-ngo.org", parts = String(SITE.address || "").split(/\s*[،,]\s*/).filter(Boolean);
    var locality = parts.length > 1 ? parts.pop() : "";
    var ld = {
      "@context": "https://schema.org", "@type": "NGO", "@id": BASE + "/#org",
      name: SITE.footer.name || "مؤسسة مرسال للأعمال الخيرية والتنموية", alternateName: "Mersal Foundation",
      url: BASE + "/", logo: BASE + "/img/brand-logo.png",
      sameAs: Object.keys(SITE.social).map(function (k) { return String(SITE.social[k] || "").trim(); }).filter(function (u) { return /^https:\/\//.test(u); }),
      potentialAction: { "@type": "DonateAction", target: BASE + "/donate.html", recipient: { "@id": BASE + "/#org" } }
    };
    if (SITE.email) ld.email = SITE.email;
    if (SITE.hotline) ld.telephone = SITE.hotline;
    if (parts.length) ld.address = { "@type": "PostalAddress", streetAddress: parts.join("، "), addressCountry: "EG" };
    if (ld.address && locality) ld.address.addressLocality = locality;
    var sc = document.createElement("script"); sc.type = "application/ld+json";
    sc.textContent = JSON.stringify(ld).replace(/</g, "\\u003c");
    document.head.appendChild(sc);
  })();

  var ICONS = {
    facebook: '<path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"/>',
    instagram: '<path fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
    x: '<path d="M3 3h4.5l4.2 5.8L16.8 3H20l-6.8 7.8L21 21h-4.5l-4.6-6.3L6.3 21H3l7.4-8.5z"/>',
    linkedin: '<path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2 9h4v12H2zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.4 2.6 4.4 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/>',
    youtube: '<path fill-rule="evenodd" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1z"/>',
    tiktok: '<path d="M16.6 2h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.4a6.2 6.2 0 1 0 5.3 6.2V8.7a7.6 7.6 0 0 0 4.4 1.4V6.8a4.4 4.4 0 0 1-4.4-4.8z"/>'
  };
  var LABELS = { facebook: "فيسبوك", instagram: "إنستجرام", x: "إكس (تويتر)", linkedin: "لينكدإن", youtube: "يوتيوب", tiktok: "تيك توك" };

  function social() {
    var keys = Object.keys(ICONS).filter(function (k) { return SITE.social[k]; });
    if (!keys.length) return "";
    return '<ul class="social">' + keys.map(function (k) {
      return '<li><a href="' + escA(SITE.social[k]) + '" target="_blank" rel="noopener" aria-label="' + LABELS[k] + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg></a></li>';
    }).join("") + "</ul>";
  }

  var NAV = [
    ["/", "الرئيسية"],
    ["/p/3.html", "عن مرسال"],
    ["/afia.html", "كارت عافية"],
    ["/donate.html", "طرق التبرع"],
    ["/zakat.html", "حاسبة الزكاة"],
    ["/contact.html", "تواصل معنا"]
  ];
  // footer links: SITE.footer.links from the console (empty = this built-in list); "{youtube}" (any social key) follows that link
  var FOOT_DEFAULT = [
    ["/p/3.html", "عن مرسال"], ["/contact.html", "اتصل بنا"], ["/donate.html", "تبرع الآن"], ["/help.html", "طلب مساعدة"],
    ["/p/30.html", "مستشفى مرسال"], ["/#projects", "المشاريع"], ["/p/46.html", "فروع مرسال"],
    ["/afia.html", "كارت عافية"], ["/zakat.html", "حساب الزكاة"], ["/gift.html", "اهدي تبرع أو صدقة على روح"], ["/p/51.html", "الأسئلة الشائعة"],
    ["/news.html", "أخبار مرسال"], ["/albums.html", "ألبومات الصور"], [SITE.social.youtube, "فيديوهات"],
    ["/privacy.html", "سياسة الخصوصية"], ["/terms.html", "شروط الاستخدام"]
  ];
  var FOOT = (SITE.footer.links && SITE.footer.links.length ? SITE.footer.links.map(function (l) { return [l && l.href, l && l.title]; }) : FOOT_DEFAULT)
    .map(function (n) { var m = /^\{(\w+)\}$/.exec(n[0] || ""); return m ? [SITE.social[m[1]], n[1]] : n; })
    .filter(function (n) { return n[0] && n[1]; });
  var here = location.pathname.replace(/index\.html$/, "");
  var PHONE_PATH = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z";

  var header =
    '<div class="topbar"><div class="wrap">' +
      '<div class="phones">' +
        '<a class="zakat-link" href="/zakat.html">حساب الزكاة</a>' +
        '<a href="tel:' + escA(SITE.hotline) + '">الخط الساخن: <b>' + escA(SITE.hotline) + '</b></a>' +
        '<a href="tel:' + escA(SITE.phone) + '">الهاتف: <b dir="ltr">' + escA(SITE.phone) + '</b></a>' +
        '<a href="mailto:' + escA(SITE.email) + '">' + escA(SITE.email) + '</a>' +
      '</div>' + social() +
    '</div></div>' +
    '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="/" aria-label="مؤسسة مرسال - الرئيسية"><picture><source type="image/webp" srcset="/img/brand-logo-w.webp"><img src="/img/brand-logo-w.png" alt="مؤسسة مرسال الخيرية" width="78" height="46"></picture></a>' +
      '<ul class="nav" id="nav">' + NAV.map(function (n) {
        return "<li" + (n[0] === "/" ? ' class="nav-home"' : "") + '><a href="' + n[0] + '"' + (here === n[0] ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
      }).join("") + "</ul>" +
      // tablets and desktop only (css/site.css hides both on phones, where the top bar and the bottom bar carry them):
      // the zakat calculator from 1280px, the hotline as an icon (from 1366px, with its number from 1600px; tablets: icon)
      '<a class="hdr-zakat" href="/zakat.html"' + (/^\/zakat\.html$/.test(location.pathname) ? ' aria-current="page"' : "") + ">حساب الزكاة</a>" +
      (SITE.hotline ? '<a class="hdr-tel" href="tel:' + escA(SITE.hotline) + '" aria-label="الخط الساخن ' + escA(SITE.hotline) + '" title="الخط الساخن">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + PHONE_PATH + '"/></svg><b>' + escA(SITE.hotline) + "</b></a>" : "") +
      '<button type="button" class="search-btn" aria-label="بحث في الموقع"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button>' +
      '<a class="btn btn-gold" href="/donate.html">تبرع الآن</a>' +
      // last in the row, so on tablets the DOM order is the visual order (logo, hotline, search, "تبرع الآن", menu)
      '<button class="menu-toggle" aria-label="القائمة" aria-expanded="false"><span></span><span></span><span></span></button>' +
    "</div></header>";

  var year = new Date().getFullYear();
  // Pre-footer strip (tablets and desktop; hidden on phones): hotline + donate + zakat, on every page except the home page,
  // the pages that end with their own "ساهم مع مرسال" band (main .cta-band: every /p/ page), donate and zakat.
  // No h3 in it: the first footer h3 stays the foundation's name.
  var fStrip = document.body.classList.contains("home") || document.querySelector("main .cta-band") || /\/(donate|zakat)\.html$/.test(location.pathname) ? "" :
    '<div class="f-strip"><div class="wrap">' +
      '<p class="fs-text"><b>' + escA(SITE.footer.stripTitle || "محتاج مساعدة في التبرع؟") + "</b><span>" + escA(SITE.footer.stripText || "مندوبنا يوصلك لحد باب البيت") + "</span></p>" +
      (SITE.hotline ? '<a class="fs-tel" href="tel:' + escA(SITE.hotline) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + PHONE_PATH + '"/></svg>' +
        "<span><small>كلمنا على الخط الساخن</small><b>" + escA(SITE.hotline) + "</b></span></a>" : "") +
      '<div class="fs-btns"><a class="btn btn-gold" href="/donate.html">تبرع الآن</a><a class="btn btn-ghost" href="/zakat.html">احسب زكاتك</a></div>' +
    "</div></div>";
  var legalLine = LEGAL.regNo ? "مؤسسة أهلية غير هادفة للربح · مشهرة برقم " + LEGAL.regNo + (LEGAL.regYear ? " لسنة " + LEGAL.regYear : "") + (LEGAL.regBody ? " – " + LEGAL.regBody : "") : "";
  var footer =
    '<footer class="site-footer">' + fStrip + '<div class="wrap cols">' +
      "<div>" +
        '<div class="logo-box"><picture><source type="image/webp" srcset="/img/brand-logo-w.webp"><img src="/img/brand-logo-w.png" alt="مؤسسة مرسال الخيرية - Mersal Charity Foundation" width="118" height="70" loading="lazy" decoding="async"></picture></div>' +
        "<h3>" + escA(SITE.footer.name || "مؤسسة مرسال للأعمال الخيرية والتنموية") + "</h3>" +
        (SITE.footer.text ? "<p>" + escA(SITE.footer.text) + "</p>" : "") +
        social() +
      "</div>" +
      "<div><h3>روابط</h3><ul class=\"two-col\">" + FOOT.map(function (n) { return '<li><a href="' + escA(n[0]) + '"' + (/^https?:/.test(n[0]) ? ' target="_blank" rel="noopener"' : "") + ">" + escA(n[1]) + "</a></li>"; }).join("") + "</ul></div>" +
      "<div><h3>تواصل معنا</h3><ul>" +
        (SITE.address ? '<li class="f-addr"><a href="/p/46.html">' + escA(SITE.address) + "</a></li>" : "") +
        (SITE.hotline ? '<li class="f-hot"><span class="f-lbl">الخط الساخن: </span><a href="tel:' + escA(SITE.hotline) + '">' + escA(SITE.hotline) + "</a></li>" : "") +
        (SITE.phone ? '<li class="f-tel"><span class="f-lbl">الهاتف: </span><a href="tel:' + escA(SITE.phone) + '" dir="ltr">' + escA(SITE.phone) + "</a></li>" : "") +
        (SITE.whatsapp ? '<li class="f-wa"><span class="f-lbl">واتساب: </span><a href="' + waLink(SITE.whatsapp) + '" target="_blank" rel="noopener" dir="ltr">' + escA(SITE.whatsapp) + "</a></li>" : "") +
        (SITE.email ? '<li class="f-mail"><a href="mailto:' + escA(SITE.email) + '">' + escA(SITE.email) + "</a></li>" : "") +
      "</ul></div>" +
    "</div>" +
    '<div class="copyright">© ' + year + " " + escA(SITE.footer.name || "مؤسسة مرسال للأعمال الخيرية والتنموية") + ' - جميع الحقوق محفوظة' + (legalLine ? '<span class="f-legal">' + escA(legalLine) + "</span>" : "") + "</div></footer>";

  document.getElementById("site-header").outerHTML = header;
  document.getElementById("site-footer").outerHTML = footer;
  // privacy.html (and any page) can hold <p data-legal hidden>: filled and shown only once LEGAL.regNo is set
  if (legalLine) document.querySelectorAll("[data-legal]").forEach(function (el) {
    el.textContent = legalLine + (LEGAL.permitNo ? " · تصريح جمع التبرعات رقم " + LEGAL.permitNo + (LEGAL.permitUntil ? " ساري حتى " + LEGAL.permitUntil : "") : "");
    el.hidden = false;
  });
  // Pages can show a site detail with data-site="hotline|phone|whatsapp|email|address" (text + href filled from SITE);
  // a wrapper with data-site-box is hidden when that value is empty - e.g. the WhatsApp card on contact.html
  document.querySelectorAll("[data-site]").forEach(function (el) {
    var k = el.getAttribute("data-site"), v = String(SITE[k] || "").trim(), box = el.closest("[data-site-box]");
    if (box) box.hidden = !v;
    if (!v) return;
    var old = el.textContent.trim(), named = el.closest("a[aria-label]");
    el.textContent = v;
    if (el.tagName === "A") el.href = siteHref(k, v, el);
    // a card link named by aria-label (the hotline cards) says the same number it shows
    if (named && old && old !== v) named.setAttribute("aria-label", named.getAttribute("aria-label").split(old).join(v));
  });
  // data-site-href="hotline|phone|whatsapp|email": only the link target comes from SITE (for links that hold more markup)
  document.querySelectorAll("a[data-site-href]").forEach(function (el) {
    var k = el.getAttribute("data-site-href"), v = String(SITE[k] || "").trim();
    if (v) el.href = siteHref(k, v, el);
  });
  function siteHref(k, v, el) { return k === "email" ? "mailto:" + v : k === "whatsapp" ? waLink(v) : k === "address" ? el.getAttribute("href") || "#" : "tel:" + v; }
  var donated = false;
  try {
    donated = localStorage.getItem("mersalDonated") === "1" &&
      (JSON.parse(localStorage.getItem("mersalDonations") || "[]") || []).some(function (d) { return d && !d.demo && Number(d.amount) > 0; });
  } catch (e) {}
  if (!/donate\.html$/.test(location.pathname)) {
    var pm = /^\/p\/(\d+)\.html$/.exec(location.pathname), pid = pm ? (pm[1] === "4" || pm[1] === "5" ? "31" : pm[1]) : ""; // p4/p5 = oncology centre (p31)
    var NOT_CAUSE = /^p(3|6|7|26|29|46|47|48|51)$/; // pages that are not causes never earmark a donation
    window.mersalNotCause = NOT_CAUSE;
    var dHref = "/donate.html" + (pid && !NOT_CAUSE.test("p" + pid) ? "?for=p" + pid : "") + "#online";
    // Project pages: the side card's own project code (for=p<id> on its gold button) also goes on the ways to give
    // without a card, so a transfer, a wallet payment or a home pickup can still be earmarked for this project
    // (forms.js prefill() selects ?for= in the transfer / pickup form). The generated pages stay untouched.
    // Every generated page's side card carries for=p<id>, so pages that are not causes are left out here, or a transfer
    // would be recorded against the FAQ or the branches page (donate.js does not list them either): about, doctors,
    // clinic hours, volunteers (p26, p47), the Afya discount card (p29, a paid service), branches, ways to give, FAQ.
    // p4/p5 (the oncology centre) stay in: forms.js and donate.js map them to p31.
    var sideBtn = document.querySelector(".page-side .side-card.donate a.btn-gold"), sideFor = "";
    try { sideFor = sideBtn ? new URL(sideBtn.href, location.href).searchParams.get("for") || "" : ""; } catch (e) {}
    if (/^p\d+$/.test(sideFor) && !NOT_CAUSE.test(sideFor) && !sideBtn.parentNode.querySelector(".side-ways")) {
      var wHref = "/donate.html?for=" + sideFor;
      sideBtn.insertAdjacentHTML("afterend", '<p class="side-trust">دفع آمن ومشفّر · رقم متابعة لكل تبرع</p>');
      sideBtn.parentNode.insertAdjacentHTML("beforeend",
        '<div class="side-ways"><p>مش معاك كارت؟ تبرع لنفس المشروع بـ</p>' +
          '<a href="' + wHref + '#wallets">إنستاباي أو فوري</a>' +
          '<a href="' + wHref + '#bank">تحويل بنكي</a>' +
          '<a href="' + wHref + '#home">مندوب لحد البيت</a>' +
          "<small>بعد ما تحوّل سجّل تبرعك في الصفحة عشان يتخصص للمشروع ده.</small></div>");
    }
    // "مبلغ تاني" under the side card's amount chips: same project code as the chips, any whole amount
    var sideAm = document.querySelector(".page-side .side-card.donate .side-amounts");
    if (sideAm && !sideAm.querySelector(".amt-other")) {
      var amBase = ""; try { var a0 = sideAm.querySelector("a"); var u0 = a0 && new URL(a0.href, location.href); if (u0) { u0.searchParams.delete("amount"); u0.hash = ""; amBase = u0.pathname + u0.search; } } catch (e) {}
      if (amBase) {
        sideAm.insertAdjacentHTML("beforeend", '<form class="amt-other side-other"><span>مبلغ تاني</span><input type="text" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="اكتب المبلغ" aria-label="اكتب مبلغ تاني بالجنيه"><button type="submit">تبرع</button></form>');
        var sf = sideAm.querySelector(".side-other"), si = sf.querySelector("input");
        si.addEventListener("input", function () { var r = si.value.replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x0660; }).replace(/\D/g, ""); if (si.value !== r) si.value = r; });
        sf.addEventListener("submit", function (e) { e.preventDefault(); var n = parseInt(si.value, 10); if (!n) { si.focus(); return; } location.href = amBase + (amBase.indexOf("?") < 0 ? "?" : "&") + "amount=" + Math.max(10, n) + "#online"; });
      }
    }
    // the floating donate button (phones; desktop has the sticky header button) stays off the request/contact forms
    if (!/(help|volunteer|contact)\.html$/.test(location.pathname)) document.body.insertAdjacentHTML("beforeend", '<a class="btn btn-gold fab-donate" href="' + dHref + '">تبرع الآن</a>');
    document.body.insertAdjacentHTML("beforeend",
      '<nav class="m-bar" aria-label="تنقل سريع">' +
        '<a class="m-home' + (/^\/(index\.html)?$/.test(location.pathname) ? " on" : "") + '" href="/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg><span>الرئيسية</span></a>' +
        '<a class="m-call" href="tel:' + escA(SITE.hotline) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><span>اتصل</span></a>' +
        '<a class="m-donate" href="' + dHref + '"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/></svg></i><span>تبرع</span></a>' +
        '<a class="m-zakat' + (/zakat\.html$/.test(location.pathname) ? " on" : "") + '" href="/zakat.html"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h6"/></svg><span>الزكاة</span></a>' +
        '<button type="button" class="m-menu" aria-label="القائمة"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>القائمة</span></button>' +
      "</nav>");
    var bar = document.querySelector(".m-bar");
    bar.querySelectorAll(".on").forEach(function (el) { el.setAttribute("aria-current", "page"); });
    // donors: the menu (whose sheet starts with the community row) carries a red dot until the community page is visited
    if (donated) {
      var giftSeen = /community\.html$/.test(location.pathname);
      try { if (giftSeen) localStorage.setItem("mersalGiftSeen", "1"); else giftSeen = localStorage.getItem("mersalGiftSeen") === "1"; } catch (e) {}
      if (!giftSeen) { var mmg = bar.querySelector(".m-menu"); mmg.classList.add("has-gift"); mmg.setAttribute("aria-label", "القائمة (فيها هداياك كمتبرع)"); }
    }
    document.body.classList.add("has-mbar");
    var mdn = bar.querySelector(".m-donate"), h1n = document.querySelector(".page-head h1");
    if (mdn && h1n && pid && !NOT_CAUSE.test("p" + pid)) mdn.setAttribute("aria-label", "تبرع لـ " + h1n.textContent.trim());
    // Active-item pill: --i is the index of the lit item and the pill slides there (transform only). A tap moves it
    // at once, and the cross-document view transition (css: m-ind) carries it into the next page.
    bar.insertAdjacentHTML("afterbegin", '<i class="m-ind" aria-hidden="true"></i>');
    var barItems = Array.prototype.slice.call(bar.querySelectorAll("a, button")), onIdx = -1;
    barItems.forEach(function (el, i) { if (el.classList.contains("on")) onIdx = i; });
    function setInd(i) {
      if (i === "menu") i = barItems.indexOf(bar.querySelector(".m-menu"));
      if (i == null) i = onIdx;
      bar.classList.toggle("has-on", i >= 0);
      if (i >= 0) bar.style.setProperty("--i", i);
    }
    setInd(onIdx);
    window.mersalBarInd = setInd;
    barItems.forEach(function (el, i) {
      // (Polish 3: not the heart, whose capsule would show under it on the way to donate)
      if (el.tagName !== "A" || /^tel:/.test(el.getAttribute("href") || "") || el.classList.contains("m-donate")) return;
      el.addEventListener("click", function () { setInd(i); });
    });
    // Polish 3: a tap on the gold heart bursts (css/mobile.css .burst: the heart pops, the rings fly out, seven small
    // hearts scatter) with a short haptic tick; the page then goes to the same donate target 240ms later so the burst
    // is seen. Modifier/middle clicks, reduced motion and a heart that links to the page you are on keep their plain
    // behaviour (the same-page tap scrolls to the top via the document handler below).
    var p3Reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mdn && !p3Reduce) mdn.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var old = mdn.querySelector(".p3-hearts"); if (old) old.remove();
      var hearts = document.createElement("b"); hearts.className = "p3-hearts"; hearts.setAttribute("aria-hidden", "true");
      for (var k = 0; k < 7; k++) {
        var h = document.createElement("i"), ang = (-165 + k * 25) * Math.PI / 180, dist = 36 + (k % 2) * 14;
        h.style.setProperty("--x", (Math.cos(ang) * dist).toFixed(1) + "px"); h.style.setProperty("--y", (Math.sin(ang) * dist).toFixed(1) + "px"); h.style.setProperty("--t", (k % 3) * 40 + "ms");
        hearts.appendChild(h);
      }
      mdn.appendChild(hearts);
      mdn.classList.remove("burst"); void mdn.offsetWidth; mdn.classList.add("burst");
      setTimeout(function () { mdn.classList.remove("burst"); hearts.remove(); }, 900);
      if (window.mersalTap) window.mersalTap(12);
      var u; try { u = new URL(mdn.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || u.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "")) return;
      e.preventDefault();
      setTimeout(function () { location.assign(mdn.href); }, 240);
    });
    // the continuous beat pauses while the tab is in the background (css: html.p3-paused)
    document.addEventListener("visibilitychange", function () { document.documentElement.classList.toggle("p3-paused", document.hidden); });
  }

  // Header: shadow once the page scrolls; on phones it slides away while scrolling down and comes back on scroll up
  // (lastY starts unset and takes the first scroll position: reading scrollY here, while the deferred scripts run,
  // forced the first full-page layout inside the script task)
  var hdr = document.querySelector(".site-header"), lastY = -1, phone = matchMedia("(max-width: 760px)");
  addEventListener("scroll", function () {
    var y = scrollY;
    if (lastY < 0) lastY = y;
    hdr.classList.toggle("scrolled", y > 10);
    if (phone.matches && !document.body.classList.contains("menu-open")) {
      if (y > 140 && y - lastY > 8) hdr.classList.add("hide");
      else if (lastY - y > 8 || y < 80) hdr.classList.remove("hide");
    } else hdr.classList.remove("hide");
    document.body.classList.toggle("hdr-hide", hdr.classList.contains("hide")); // css: the donate summary strip follows the header
    lastY = y;
  }, { passive: true });

  // Fade-up on scroll for sections, cards and banners (skipped for reduced motion; without JS nothing is ever hidden).
  // Items are watched from 48px below the viewport, so they are already moving when they come into view, and the
  // ones that arrive in the same frame follow each other 70 ms apart (--d). Each item is revealed once.
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = (!reduce && "IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    var k = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty("--d", Math.min(k++, 6) * 0.07 + "s");
      e.target.classList.add("in"); io.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px 48px 0px" }) : null;
  window.mersalReveal = function (els) {
    if (!io) return;
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal"); io.observe(el);
    });
  };
  document.querySelectorAll("main .about-pic, main .hf-pic, main .grid > img, main .grid > picture > img").forEach(function (el) { el.classList.add("zoom"); });
  window.mersalReveal(document.querySelectorAll("main .section-title, main .num, main .way2, main .about-pic, main .hf-pic, main .contact-cards a, main .card, main .bank, main .banner-strip > *, main .zakat-group, main .side-ads > *, main .grid > img, main .grid > picture > img, main .grid > div > img, main .legacy .row > *, main .legacy li, main .legacy > img, main .page-side, main .share-bar, .site-footer .cols > div"));
  // desktop only (761px+, the phone keeps its approved motion): the zakat uses and the gift steps fade up once too
  if (window.matchMedia && matchMedia("(min-width: 761px)").matches) window.mersalReveal(document.querySelectorAll("main .zk-cards li, main .gf-steps li"));

  // The whole menu (groups and their links) comes from /data/menu.json - edited from the console tab "القائمة"
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function navItem(it) {
    var kids = (it.children || []).filter(function (k) { return k && k.title && k.href; });
    var cur = it.href && here === it.href ? ' aria-current="page"' : "";
    if (!kids.length) return it.href ? '<li><a href="' + esc(it.href) + '"' + cur + ">" + esc(it.title) + "</a></li>" : "";
    var open = kids.some(function (k) { return k.href === here; });
    return '<li class="has-sub' + (open ? " active" : "") + '"><button type="button" class="sub-toggle" aria-expanded="false">' + esc(it.title) + '<span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></button>' +
      '<ul class="sub">' + (it.href ? '<li><a href="' + esc(it.href) + '">' + esc(it.title) + "</a></li>" : "") +
      kids.map(function (k) { return '<li><a href="' + esc(k.href) + '"' + (k.href === here ? ' aria-current="page"' : "") + ">" + esc(k.title) + "</a></li>"; }).join("") + "</ul></li>";
  }
  function bindSubs() {
    document.querySelectorAll("#nav .sub-toggle").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var li = b.parentNode, was = li.classList.contains("open");
        document.querySelectorAll("#nav .has-sub.open").forEach(function (x) { x.classList.remove("open"); x.firstChild.setAttribute("aria-expanded", "false"); });
        if (!was) { li.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
      });
    });
  }
  var tabletUp = matchMedia("(min-width: 761px)");
  document.addEventListener("click", function (e) {
    document.querySelectorAll("#nav .has-sub.open").forEach(function (x) { x.classList.remove("open"); x.firstChild.setAttribute("aria-expanded", "false"); });
    // tablets and desktop: a click outside the open drawer (on its scrim) closes it, and the focus goes back to the burger
    if (tabletUp.matches && document.getElementById("m-sheet") && menuOpen() && !(e.target.closest && e.target.closest("#m-sheet, .menu-toggle"))) { setMenu(false); toggle.focus(); }
  });
  fetch("/data/menu.json").then(function (r) { return r.json(); }).then(function (tree) {
    if (!tree || !tree.length) return;
    document.getElementById("nav").innerHTML = '<li class="nav-home"><a href="/"' + (here === "/" ? ' aria-current="page"' : "") + ">الرئيسية</a></li>" + tree.map(navItem).join("");
    bindSubs();
    buildSheet(tree);
    fitHeader();
  }).catch(function () {});

  // Phone menu: a full-height sheet (quick actions, groups as accordions, contact, social) built from the same tree
  function buildSheet(tree) {
    if (document.getElementById("m-sheet")) return;
    var ic = {
      donate: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/></svg>',
      zakat: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h6"/></svg>',
      volunteer: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-4-4.9"/></svg>',
      help: '<svg viewBox="0 0 24 24"><path d="M12 3l9 6v12H3V9z"/><path d="M12 10v6M9 13h6"/></svg>',
      phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
      wa: '<svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/></svg>',
      mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
      gift: '<svg viewBox="0 0 24 24"><path d="M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7c-2-4-7-4-6 0M12 7c2-4 7-4 6 0"/></svg>',
      chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
    };
    function row(k) { return '<a class="m-row" href="' + esc(k.href) + '"' + (k.href === here ? ' aria-current="page"' : "") + ">" + esc(k.title) + ic.chev + "</a>"; }
    var groups = tree.map(function (it) {
      var kids = (it.children || []).filter(function (k) { return k && k.title && k.href; });
      if (!kids.length) return it.href ? row(it) : "";
      var open = kids.some(function (k) { return k.href === here; }) || it.href === here;
      return '<details class="m-group' + (open ? " is-open" : "") + '"' + (open ? " open" : "") + "><summary>" + esc(it.title) + ic.chev + "</summary><div class=\"m-sub-wrap\"><div class=\"m-sub\">" +
        (it.href ? row({ href: it.href, title: "كل " + it.title }) : "") + kids.map(row).join("") + "</div></div></details>";
    }).join("");
    var wa = SITE.whatsapp ? String(SITE.whatsapp).replace(/\D/g, "") : "";
    // .m-sheet-head is the tablet drawer's logo + close button (hidden on phones). It sits before .m-sheet-in, so the
    // phone sheet's rows keep their places (and their staggered entrance).
    var html = '<div class="m-sheet" id="m-sheet" hidden>' +
      '<div class="m-sheet-head"><a class="m-brand" href="/" aria-label="مؤسسة مرسال - الرئيسية"><picture><source type="image/webp" srcset="/img/brand-logo.webp"><img src="/img/brand-logo.png" alt="" width="78" height="46" loading="lazy" decoding="async"></picture></a>' +
        '<button type="button" class="m-close" aria-label="إغلاق القائمة"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="m-sheet-in">' +
      '<button type="button" class="m-search-row" id="m-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span>ابحث في الموقع…</span></button>' +
      '<div class="m-quick">' +
        '<a href="/donate.html#online" class="q-donate">' + ic.donate + "<span>تبرع الآن</span></a>" +
        '<a href="/zakat.html">' + ic.zakat + "<span>حاسبة الزكاة</span></a>" +
        '<a href="/volunteer.html">' + ic.volunteer + "<span>تطوع معنا</span></a>" +
        '<a href="/help.html">' + ic.help + "<span>طلب مساعدة</span></a>" +
      "</div>" +
      (donated ? '<a class="m-gift-row" href="/community.html">' + ic.gift + "<span><b>مرسال كوميونيتي</b><small>هداياك كمتبرع</small></span>" + ic.chev + "</a>" : "") +
      '<nav class="m-groups" aria-label="أقسام الموقع">' + row({ href: "/", title: "الرئيسية" }) + groups + "</nav>" +
      '<div class="m-contact">' +
        '<a href="tel:' + escA(SITE.hotline) + '">' + ic.phone + "<span><b>" + escA(SITE.hotline) + "</b><small>الخط الساخن</small></span></a>" +
        (wa ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + ic.wa + "<span><b>واتساب</b><small>اكتبلنا</small></span></a>" : '<a href="tel:' + escA(SITE.phone) + '">' + ic.phone + '<span><b dir="ltr">' + escA(SITE.phone) + "</b><small>الهاتف</small></span></a>") +
        '<a href="mailto:' + escA(SITE.email) + '">' + ic.mail + "<span><b>الإيميل</b><small>" + escA(SITE.email) + "</small></span></a>" +
      "</div>" +
      '<div class="m-social">' + social() + "</div>" +
    "</div></div>";
    document.body.insertAdjacentHTML("beforeend", html);
    var sheet = document.getElementById("m-sheet");
    // a non-modal dialog (no aria-modal: the header burger and the bar's menu button stay usable to close it)
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "القائمة");
    document.querySelectorAll(".menu-toggle, .m-bar .m-menu").forEach(function (b) { b.setAttribute("aria-controls", "m-sheet"); });
    // a tapped link closes the sheet at once, so the page transition starts from a clean page
    sheet.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a && !followFromOverlay(e, a, function () { setMenu(false, true, true); })) setMenu(false, true); });
    // the sheet's history entry is handed over to the search panel (no Back in between)
    document.getElementById("m-search").addEventListener("click", function () { setMenu(false, true, true); openSearch(); });
    sheet.querySelector(".m-close").addEventListener("click", function () { setMenu(false); menuBack(); });
    // groups: <details> opens at once (so the rows exist), then .is-open grows the height (css grid-rows); closing runs the other way
    sheet.querySelectorAll(".m-group > summary").forEach(function (sm) {
      sm.addEventListener("click", function (e) {
        e.preventDefault();
        var d = sm.parentNode;
        if (d.classList.contains("is-open")) {
          d.classList.remove("is-open");
          setTimeout(function () { if (!d.classList.contains("is-open")) d.open = false; }, 360);
        } else {
          d.open = true;
          requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add("is-open"); }); });
        }
        if (window.mersalTap) window.mersalTap(6);
      });
    });
  }

  // Faster page-to-page moves: browsers that support speculation rules prefetch a same-site page as soon as a finger
  // or the pointer lands on its link (moderate), so the next page is usually ready when the tap ends. Never the
  // admin, the API or links with a query (donate links carry amounts/purposes and must load fresh).
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
      var sr = document.createElement("script"); sr.type = "speculationrules";
      sr.textContent = JSON.stringify({ prefetch: [{ source: "document", where: { and: [{ href_matches: "/*" }, { not: { href_matches: "/admin/*" } }, { not: { href_matches: "/api/*" } }, { not: { href_matches: "/*\\?*" } }] }, eagerness: "moderate" }] });
      document.head.appendChild(sr);
    }
  } catch (e) { /* no speculation rules: links behave as before */ }

  // A tap on a link to the page you are on (الرئيسية on the home page, the logo, a lit bar item) scrolls to the top
  // instead of reloading it; the header comes back. Modifier and middle clicks keep their browser meaning.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".m-bar a, .site-header .brand, .nav a, #m-sheet a");
    if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (a.target && a.target !== "_self")) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || u.pathname.replace(/index\.html$/, "") !== here || u.search !== location.search || u.hash !== location.hash) return;
    e.preventDefault();
    if (menuOpen()) setMenu(false, true);
    hdr.classList.remove("hide"); document.body.classList.remove("hdr-hide");
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  // Skip link + back-to-top
  document.body.insertAdjacentHTML("afterbegin", '<a class="skip-link" href="#main">تخطي إلى المحتوى</a>');
  var mainEl = document.querySelector("main"); if (mainEl && !mainEl.id) mainEl.id = "main";
  document.body.insertAdjacentHTML("beforeend", '<button type="button" class="to-top" aria-label="الرجوع لأعلى الصفحة">↑</button>');
  var toTop = document.querySelector(".to-top");
  var fab = document.querySelector(".fab-donate");
  addEventListener("scroll", function () {
    toTop.classList.toggle("show", scrollY > 600);
    if (fab) fab.classList.toggle("show", scrollY > 500);
  }, { passive: true });
  toTop.addEventListener("click", function () { scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  // Back button (F19): the open phone menu sheet or search panel owns one history entry, so Android/browser Back
  // closes it instead of leaving the page. A link tapped inside it replaces that entry, so no dead entry stays behind.
  try { if (history.state && history.state.overlay) history.replaceState(null, ""); } catch (e) {} // after a reload
  function overlayOpen(kind) {
    try { if (history.state && history.state.overlay) history.replaceState({ overlay: kind }, ""); else history.pushState({ overlay: kind }, ""); } catch (e) {}
  }
  function overlayClosed(kind) { try { if (history.state && history.state.overlay === kind) history.back(); } catch (e) {} }
  function followFromOverlay(e, a, close) {
    var href = a.getAttribute("href") || "";
    if (!(history.state && history.state.overlay) || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return false;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download") || !/^(https?:|\/|#|\?)/.test(href) && /^[a-z][\w+.-]*:/i.test(href)) return false;
    e.preventDefault(); close(); location.replace(a.href);
    return true;
  }
  addEventListener("popstate", function () {
    if (menuOpen()) { var hadFocus = document.getElementById("m-sheet") && document.getElementById("m-sheet").contains(document.activeElement); setMenu(false, true, true); if (document.getElementById("m-sheet") && (tabletUp.matches || hadFocus)) menuBack(); }
    if (!panel.hidden) closeSearch(true);
  });

  // Dialog focus containment without aria-modal: everything outside the open overlay becomes inert (no Tab, no taps,
  // hidden from screen readers). keep = the elements that stay live; ancestors of a kept element are walked into,
  // so only their other children go inert. Calling it again with on=false clears every inert it set.
  var inertSet = [];
  function setInert(on, keep) {
    inertSet.forEach(function (el) { el.inert = false; el.removeAttribute("inert"); });
    inertSet = [];
    if (!on) return;
    keep = keep.filter(Boolean);
    (function walk(parent) {
      Array.prototype.forEach.call(parent.children, function (el) {
        if (keep.indexOf(el) > -1 || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
        if (keep.some(function (k) { return el.contains(k); })) { walk(el); return; }
        if (!el.inert) { el.inert = true; el.setAttribute("inert", ""); inertSet.push(el); }
      });
    })(document.body);
  }

  // Site search over the imported pages + main pages
  var STATIC = [
    { t: "طرق التبرع", u: "/donate.html", d: "الحسابات البنكية، المحافظ، إنستاباي، فوري، مندوب لحد البيت" },
    { t: "حاسبة الزكاة", u: "/zakat.html", d: "احسب زكاة مالك وذهبك وتجارتك" },
    { t: "اهدي تبرعك", u: "/gift.html", d: "صدقة جارية على روح حد غالي، هدية، شفاء أو عيد ميلاد: كارت إهداء باسمه + تذكير شهري بالتبرع" },
    { t: "كارت عافية", u: "/afia.html", d: "كارت خصومات عائلي على الخدمات الطبية حتى 70%" },
    { t: "تواصل معنا", u: "/contact.html", d: "الخط الساخن 19340، العنوان، البريد" },
    { t: "أخبار وقصص مرسال", u: "/news.html", d: "آخر أخبار مرسال، قصص نجاح المرضى، فعاليات المستشفى ومركز الأورام والقوافل" },
    { t: "ألبومات الصور", u: "/albums.html", d: "صور فعاليات وحملات مرسال: التبرع بالدم، فوانيس الفرحة، بازار عيد الأم" },
    { t: "تطوع معنا", u: "/volunteer.html", d: "سجل كمتطوع مع مرسال" },
    { t: "طلب مساعدة", u: "/help.html", d: "قدّم طلب مساعدة طبية أو اجتماعية لمرسال" },
    { t: "سياسة الخصوصية", u: "/privacy.html", d: "إيه البيانات اللي بنجمعها، فين بتتحفظ، الكوكيز، وإزاي تطلب حذف بياناتك" },
    { t: "شروط الاستخدام", u: "/terms.html", d: "التبرع تطوعي، توجيه التبرع والزكاة، استرداد التبرع، ملكية المحتوى" }
  ];
  var index = null;
  function norm(t) { return String(t || "").replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase(); }
  document.body.insertAdjacentHTML("beforeend",
    '<div class="search-panel" hidden role="dialog" aria-modal="true" aria-label="بحث في الموقع"><div class="search-box">' +
    '<input type="search" placeholder="ابحث في موقع مرسال… (مثلاً: الأورام، العيادات، التطوع)" aria-label="كلمة البحث">' +
    '<p class="sr-only" role="status" id="s-count"></p>' +
    '<button type="button" class="search-close" aria-label="إغلاق">×</button><ul class="search-results"></ul></div></div>');
  var panel = document.querySelector(".search-panel"), sInput = panel.querySelector("input"), sList = panel.querySelector(".search-results");
  var searchFrom = null, sCount = panel.querySelector("#s-count"), sCountT = 0;
  function openSearch() {
    searchFrom = document.activeElement;
    if (panel.hidden) overlayOpen("search");
    panel.hidden = false; setInert(true, [panel]); sCount.textContent = ""; sInput.value = ""; sList.innerHTML = ""; setTimeout(function () { sInput.focus(); }, 30);
    if (!index) fetch("/data/pages.json").then(function (r) { return r.json(); }).then(function (pg) {
      index = STATIC.concat(Object.keys(pg).map(function (id) { return { t: pg[id].title, u: "/p/" + id + ".html", d: pg[id].desc }; }));
      runSearch();
    }).catch(function () { index = STATIC; });
  }
  function closeSearch(fromHistory) {
    if (panel.hidden) return;
    panel.hidden = true; setInert(false);
    if (!fromHistory) overlayClosed("search");
    // focus goes back to what opened the search (or the header search button), not to <body>
    var back = searchFrom && searchFrom !== document.body && searchFrom.getClientRects().length ? searchFrom : document.querySelector(".search-btn");
    if (back && back.getClientRects().length) back.focus({ preventScroll: true });
  }
  function runSearch() {
    var q = norm(sInput.value.trim());
    clearTimeout(sCountT);
    if (!index || !q) { sList.innerHTML = ""; sCount.textContent = ""; return; }
    var hits = index.filter(function (x) { return norm(x.t + " " + x.d).indexOf(q) > -1; })
      .sort(function (a, b) { return (norm(b.t).indexOf(q) > -1) - (norm(a.t).indexOf(q) > -1); }).slice(0, 8);
    sList.innerHTML = hits.length ? hits.map(function (x) { return '<li><a href="' + esc(x.u) + '"><b>' + esc(x.t) + "</b><span>" + esc((x.d || "").slice(0, 90)) + "</span></a></li>"; }).join("")
      : '<li class="none">مفيش نتايج. جرّب كلمة تانية أو كلمنا على 19340.</li>';
    // screen readers hear the count once typing pauses
    sCountT = setTimeout(function () { sCount.textContent = hits.length ? (hits.length === 1 ? "نتيجة واحدة" : hits.length + " نتايج") : "مفيش نتايج"; }, 400);
  }
  sInput.addEventListener("input", runSearch);
  sList.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a && !followFromOverlay(e, a, function () { closeSearch(true); })) closeSearch(); });
  document.querySelector(".search-btn").addEventListener("click", openSearch);
  panel.querySelector(".search-close").addEventListener("click", closeSearch);
  panel.addEventListener("click", function (e) { if (e.target === panel) closeSearch(); });
  addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) closeSearch();
    if (e.key === "/" && panel.hidden && !/input|textarea|select/i.test((document.activeElement || {}).tagName)) { e.preventDefault(); openSearch(); }
  });

  var toggle = document.querySelector(".menu-toggle"), nav = document.getElementById("nav");
  // On phones the menu is the #m-sheet (built once menu.json arrives); before that, and on tablets, it is the nav list
  function menuOpen() { var sheet = document.getElementById("m-sheet"); return sheet ? !sheet.hidden : nav.classList.contains("open"); }
  var sheetTimer = null, menuFrom = null;
  // noHistory: the caller handles the history entry (Back already popped it, or a link / the search takes it over)
  function setMenu(open, instant, noHistory) {
    var sheet = document.getElementById("m-sheet"), was = menuOpen();
    if (!noHistory) { if (open && !was) overlayOpen("menu"); else if (!open && was) overlayClosed("menu"); }
    if (sheet) {
      clearTimeout(sheetTimer); sheet.classList.remove("closing");
      if (open) {
        if (!was) menuFrom = document.activeElement;
        sheet.hidden = false; sheet.scrollTop = 0;
        // everything but the sheet, the burger and the bar's menu button goes inert while the sheet is open
        setInert(true, [sheet, toggle, document.querySelector(".m-bar .m-menu")]);
        var mf = tabletUp.matches ? sheet.querySelector(".m-close") : document.getElementById("m-search");
        if (mf) mf.focus({ preventScroll: true });
      }
      else if (setInert(false), instant || sheet.hidden || reduce) sheet.hidden = true;
      else { sheet.classList.add("closing"); sheetTimer = setTimeout(function () { sheet.hidden = true; sheet.classList.remove("closing"); }, 200); }
      nav.classList.remove("open");
    }
    else nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "القائمة");
    document.body.classList.toggle("menu-open", open);
    var mm = document.querySelector(".m-bar .m-menu"); if (mm) mm.setAttribute("aria-expanded", open ? "true" : "false");
    if (window.mersalBarInd) window.mersalBarInd(open ? "menu" : null);
  }
  // after the sheet closes the focus goes back to what opened it (the burger or the bar's menu button), else the burger
  function menuBack() {
    var t = menuFrom && menuFrom !== document.body && document.contains(menuFrom) && menuFrom.getClientRects().length && !(document.getElementById("m-sheet") || nav).contains(menuFrom) ? menuFrom : toggle;
    if (!t.getClientRects().length) t = document.querySelector(".m-bar .m-menu") || toggle;
    t.focus({ preventScroll: true });
  }
  toggle.addEventListener("click", function (e) { e.stopPropagation(); setMenu(!menuOpen()); });
  var mMenu = document.querySelector(".m-bar .m-menu");
  if (mMenu) mMenu.addEventListener("click", function (e) { e.stopPropagation(); hdr.classList.remove("hide"); document.body.classList.remove("hdr-hide"); var open = !menuOpen(); setMenu(open); if (open && !document.getElementById("m-sheet")) scrollTo({ top: 0, behavior: "smooth" }); });
  nav.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a && !followFromOverlay(e, a, function () { setMenu(false, true, true); })) setMenu(false); });
  addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (menuOpen()) { setMenu(false); menuBack(); return; }
    // an open desktop dropdown closes too, and the focus goes back to its button
    var sub = document.querySelector("#nav .has-sub.open");
    if (sub) { sub.classList.remove("open"); var t = sub.querySelector(".sub-toggle"); if (t) { t.setAttribute("aria-expanded", "false"); t.focus(); } }
  });
  // Header guard (1180px and wider, where the whole menu sits in one row): the menu comes from the console, so a longer
  // menu must never push the header past the screen. When the row overflows, .hdr-tight hides the zakat link and the
  // hotline and tightens the menu; when it still overflows, body.nav-compact switches to the tablet header and its
  // drawer at that width (css/desktop.css). Runs after the menu renders, on resize and once the fonts are in.
  var wideHdr = matchMedia("(min-width: 1180px)"), fitRaf = 0;
  // the row overflows when an item leaves the content box (flex items at their min-content spill into the padding first,
  // which scrollWidth does not count)
  function hdrOverflows(w) {
    var cs = getComputedStyle(w), box = w.getBoundingClientRect();
    var l = box.left + parseFloat(cs.paddingLeft) - 1, r = box.right - parseFloat(cs.paddingRight) + 1;
    return w.scrollWidth > w.clientWidth + 1 || Array.prototype.some.call(w.children, function (c) {
      if (!c.offsetWidth) return false;
      var b = c.getBoundingClientRect(); return b.left < l || b.right > r;
    });
  }
  function fitHeader() {
    var w = hdr.querySelector(".wrap"), body = document.body;
    hdr.classList.remove("hdr-tight"); body.classList.remove("nav-compact");
    if (wideHdr.matches && hdrOverflows(w)) {
      hdr.classList.add("hdr-tight");
      if (hdrOverflows(w)) body.classList.add("nav-compact");
    }
    // the drawer only exists below 1180px (or in compact mode): one left open while the window grew is closed
    if (wideHdr.matches && !body.classList.contains("nav-compact") && document.getElementById("m-sheet") && menuOpen()) setMenu(false, true);
  }
  addEventListener("resize", function () { if (!fitRaf) fitRaf = requestAnimationFrame(function () { fitRaf = 0; fitHeader(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeader);
  fitHeader();

  // Mobile menu footer: donate + hotline (added once the menu is built)
  function menuCta() {
    if (nav.querySelector(".m-menu-cta")) return;
    nav.insertAdjacentHTML("beforeend", '<li class="m-menu-cta"><a class="btn btn-gold" href="/donate.html">تبرع الآن</a><a class="btn btn-ghost-light" href="tel:' + escA(SITE.hotline) + '">اتصل ' + escA(SITE.hotline) + '</a></li>');
  }
  menuCta();
  new MutationObserver(menuCta).observe(nav, { childList: true });

  // Extras: js/extras.js + css/extras.css (announcement bar under the header, WhatsApp button, "اتبرع من بنكك أو محفظتك" strip).
  // A page that showed the bar last time gets its room back before the first paint (extras.js keeps its height), so nothing jumps:
  // the inline script right after <div id="site-header"> in every page already put the #ann-bar placeholder there (it ends up
  // right after .site-header once the bar above replaces the placeholder); this is the fallback for a page without it.
  (function () {
    var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/css/extras.css"; document.head.appendChild(css);
    try {
      var a = JSON.parse(localStorage.getItem("mersalAnn") || "null"), h = a && Math.round(+a.h);
      if (h > 0 && h < 160 && !(a.exp && Date.now() > a.exp) && !document.getElementById("ann-bar"))
        document.querySelector(".site-header").insertAdjacentHTML("afterend", '<div id="ann-bar" class="ann-bar t-' + (/^(gold|teal|red)$/.test(a.tone) ? a.tone : "gold") + '" style="min-height:' + h + 'px" aria-hidden="true"></div>');
    } catch (e) {}
    var js = document.createElement("script"); js.src = "/js/extras.js";
    js.onerror = function () { var s = document.getElementById("ann-bar"); if (s && !s.firstChild) s.parentNode.removeChild(s); }; // no script: no empty room
    document.body.appendChild(js);
  })();
})();
