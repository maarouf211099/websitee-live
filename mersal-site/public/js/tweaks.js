// Text overrides from the console ("تعديل أي نص", data/overrides.json): { text: { "النص الأصلي": "النص الجديد" } }.
// Any Arabic text on any page (text nodes and the title / placeholder / alt / aria-label attributes), including text
// that scripts add later, is swapped for its replacement, the way js/i18n.js swaps Arabic for English. Loaded by
// js/layout.js on every page except in the English version (there the Arabic is already gone) and the console.
(function () {
  if (document.documentElement.lang === "en" || /^\/admin\//.test(location.pathname)) return;
  var D = document, MAP = null, ATTRS = ["placeholder", "aria-label", "title", "alt"];
  var SKIP = "script,style,noscript,template,textarea,[data-i18n-skip],.site-header nav"; // the menu comes from data/menu.json
  var AR = /[؀-ۿ]/;
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function tr(s) {
    if (!s || !AR.test(s)) return s;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), k = norm(m[2]);
    return Object.prototype.hasOwnProperty.call(MAP, k) ? m[1] + MAP[k] + m[3] : s;
  }
  function skipped(el) { return !el || (el.closest && el.closest(SKIP)); }
  function doText(n) {
    var v = n.nodeValue; if (!v || !AR.test(v) || skipped(n.parentNode)) return;
    var e = tr(v); if (e !== v) n.nodeValue = e;
  }
  function doAttrs(el) {
    if (el.nodeType !== 1 || skipped(el)) return;
    for (var i = 0; i < ATTRS.length; i++) { var v = el.getAttribute(ATTRS[i]); if (v && AR.test(v)) { var e = tr(v); if (e !== v) el.setAttribute(ATTRS[i], e); } }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skipped(root)) return; doAttrs(root); }
    var tw = D.createTreeWalker(root, 5, null), n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function start(map) {
    MAP = map;
    if (AR.test(D.title)) D.title = tr(D.title);
    walk(D.body);
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === "characterData") doText(r.target);
        else if (r.type === "attributes") doAttrs(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
      }
    }).observe(D.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  fetch("/data/overrides.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    var map = d && d.text && typeof d.text === "object" ? d.text : null;
    if (!map) return;
    var clean = {}, any = false;
    Object.keys(map).forEach(function (k) { if (typeof map[k] === "string" && map[k].trim() && norm(k)) { clean[norm(k)] = map[k]; any = true; } });
    if (!any) return;
    if (D.body) start(clean); else D.addEventListener("DOMContentLoaded", function () { start(clean); });
  }).catch(function () {});
})();
