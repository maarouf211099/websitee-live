// Icons for the donation causes (data/causes.json): the donate page's cause cards and the console's picker share this set.
// Each icon is the inside of a 24x24 stroked SVG (stroke = currentColor, no fill), like the home page's intention tiles.
(function () {
  var I = {
    heart: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
    pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    family: '<circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M15 20v-1.5a3.5 3.5 0 0 1 3.5-3.5H19a3 3 0 0 1 3 3v2"/>',
    road: '<path d="M4 21l5-18h6l5 18"/><path d="M12 7v2M12 12v2.5M12 17.5V20"/>',
    card: '<rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19M6 15h4"/>',
    child: '<circle cx="12" cy="6.5" r="3"/><path d="M12 9.5v6M7 12.5l5 2 5-2M12 15.5l-3 5.5M12 15.5l3 5.5"/>',
    kidney: '<path d="M9 4c-3 0-5 2.6-5 6.5S6 20 9 20c1.6 0 2.5-1 2.5-2.5v-3c0-1-1-1.5-1-2.5S12 10 12 9c0-2.5-1-5-3-5z"/><path d="M15 4c3 0 5 2.6 5 6.5S18 20 15 20c-1.6 0-2.5-1-2.5-2.5v-3c0-1 1-1.5 1-2.5S12 10 12 9c0-2.5 1-5 3-5z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    "case": '<circle cx="10" cy="8" r="3.5"/><path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h3a5.5 5.5 0 0 1 5.5 5.5V20"/><path d="M18 5v6M15 8h6"/>',
    hospital: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-5h6v5M12 9v5M9.5 11.5h5"/>',
    device: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 10h2l1.5-3 2 6 1.5-3h3M8 20h8M12 16v4"/>',
    baby: '<circle cx="12" cy="12" r="8"/><path d="M12 4c0-1.5 1-2 2-2"/><circle cx="9.5" cy="11" r=".6"/><circle cx="14.5" cy="11" r=".6"/><path d="M9.5 14.5c1.5 1.2 3.5 1.2 5 0"/>',
    meal: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M12 11V5M3 20h18"/>',
    bag: '<path d="M6 8h12l1 13H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2 0-4-1.5-4-3.5S10 3 12 6c2-3 4-2 4-.5S14 9 12 9z"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 3 1.1-6.2L3 9.7l6.2-.9z"/>',
    zakat: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5h4a1.75 1.75 0 0 1 0 3.5h-3a1.75 1.75 0 0 0 0 3.5h4"/>',
    sadaqa: '<path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/><path d="M8 12h2.5l1.5-2.5 2 5 1.5-2.5H16"/>',
    general: '<path d="M4 15a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1H4z"/><path d="M12 8V5M8 21h8M12 16v5"/>'
  };
  var NAMES = {
    heart: "قلب", pulse: "نبض", family: "أسرة", road: "طريق", card: "كارت", child: "طفل", kidney: "كلى", drop: "قطرة", "case": "حالة",
    hospital: "مستشفى", device: "جهاز", baby: "حضانة", meal: "وجبة", bag: "شنطة", home: "بيت", book: "كتاب", gift: "هدية", star: "نجمة",
    zakat: "زكاة", sadaqa: "صدقة", general: "تبرع عام"
  };
  function svg(name, cls) {
    var body = Object.prototype.hasOwnProperty.call(I, name) ? I[name] : I.heart;
    return '<svg class="' + (cls || "c-ico") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }
  window.MersalCauseIcons = { names: Object.keys(I), label: function (n) { return NAMES[n] || n; }, svg: svg, has: function (n) { return Object.prototype.hasOwnProperty.call(I, n); } };
})();
