// Shared header and footer for every page. Edit contact details here only.
(function () {
  var SITE = {
    // Card payment (Banque Misr). false = hidden everywhere until the API settings are added in Azure.
    onlinePayment: false,
    phone: "01200002870",
    hotline: "19340",
    email: "info@mersal-ngo.org",
    address: "8 شارع 263 - المعادي الجديدة، القاهرة",
    social: {
      facebook: "https://www.facebook.com/Mersalfoundation",
      instagram: "https://www.instagram.com/mersal_foundation",
      x: "https://twitter.com/Mersalcharity",
      linkedin: "https://www.linkedin.com/company/18765843/",
      youtube: "https://www.youtube.com/channel/UC30Ek5Wl1us6LD6BLkegsHQ"
    }
  };
  window.MERSAL_SITE = SITE;
  if (!SITE.onlinePayment) document.documentElement.classList.add("no-online-pay");

  var ICONS = {
    facebook: '<path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"/>',
    instagram: '<path fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
    x: '<path d="M3 3h4.5l4.2 5.8L16.8 3H20l-6.8 7.8L21 21h-4.5l-4.6-6.3L6.3 21H3l7.4-8.5z"/>',
    linkedin: '<path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2 9h4v12H2zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.4 2.6 4.4 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/>',
    youtube: '<path fill-rule="evenodd" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1z"/>'
  };
  var LABELS = { facebook: "فيسبوك", instagram: "إنستجرام", x: "إكس (تويتر)", linkedin: "لينكدإن", youtube: "يوتيوب" };

  function social() {
    return '<ul class="social">' + Object.keys(SITE.social).map(function (k) {
      return '<li><a href="' + SITE.social[k] + '" target="_blank" rel="noopener" aria-label="' + LABELS[k] + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg></a></li>';
    }).join("") + "</ul>";
  }

  var NAV = [
    ["/", "الرئيسية"],
    ["/about.html", "عن مرسال"],
    ["/donate.html", "طرق التبرع"],
    ["/zakat.html", "حاسبة الزكاة"],
    ["/contact.html", "تواصل معنا"]
  ];
  var here = location.pathname.replace(/index\.html$/, "");

  var header =
    '<div class="topbar"><div class="wrap">' +
      '<div class="phones">' +
        '<a href="tel:' + SITE.hotline + '">الخط الساخن: <b>' + SITE.hotline + '</b></a>' +
        '<a href="tel:' + SITE.phone + '">الهاتف: <b dir="ltr">' + SITE.phone + '</b></a>' +
        '<a href="mailto:' + SITE.email + '">' + SITE.email + '</a>' +
      '</div>' + social() +
    '</div></div>' +
    '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="/" aria-label="مؤسسة مرسال - الرئيسية"><img src="/img/logo.png" alt="مؤسسة مرسال" width="61" height="56"></a>' +
      '<button class="menu-toggle" aria-label="القائمة" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<ul class="nav" id="nav">' + NAV.map(function (n) {
        return '<li><a href="' + n[0] + '"' + (here === n[0] ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
      }).join("") + "</ul>" +
      '<a class="btn btn-gold" href="/donate.html">تبرع الآن</a>' +
    "</div></header>";

  var year = new Date().getFullYear();
  var footer =
    '<footer class="site-footer"><div class="wrap cols">' +
      "<div>" +
        '<div class="logo-box"><img src="/img/logo.png" alt="مؤسسة مرسال" width="70" height="64"></div>' +
        "<h3>مؤسسة مرسال للأعمال الخيرية والتنموية</h3>" +
        "<p>مساندة الفقراء وذوي الدخول المحدودة في توفير احتياجاتهم الأساسية وإحداث فارق إيجابي في مستوى حياتهم.</p>" +
        social() +
      "</div>" +
      "<div><h3>روابط</h3><ul>" + NAV.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
      "<div><h3>تواصل معنا</h3><ul>" +
        "<li>" + SITE.address + "</li>" +
        '<li>الخط الساخن: <a href="tel:' + SITE.hotline + '">' + SITE.hotline + "</a></li>" +
        '<li>الهاتف: <a href="tel:' + SITE.phone + '" dir="ltr">' + SITE.phone + "</a></li>" +
        '<li><a href="mailto:' + SITE.email + '">' + SITE.email + "</a></li>" +
      "</ul></div>" +
    "</div>" +
    '<div class="copyright">© ' + year + " مؤسسة مرسال للأعمال الخيرية والتنموية - جميع الحقوق محفوظة</div></footer>";

  document.getElementById("site-header").outerHTML = header;
  document.getElementById("site-footer").outerHTML = footer;
  if (!/donate\.html$/.test(location.pathname)) {
    document.body.insertAdjacentHTML("beforeend", '<a class="btn btn-gold fab-donate" href="/donate.html">تبرع الآن</a>');
  }

  var toggle = document.querySelector(".menu-toggle"), nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
