// Home section order (data/layout.json, console tab "ترتيب الرئيسية"): one order for phones, one for desktops, and
// hidden sections. Written into index.html as a <style> between the mersal:order markers at save time, so the page
// needs no script and nothing jumps: <main> is a flex column and every section carries data-sec="…".
const SECTIONS = {
  slider: "السلايدر (البنرات)", quick: "صندوق «ساهم مع مرسال»", trust: "مربعات «ليه تطمن لمرسال» واللوجوهات", campaigns: "حملات التبرع",
  niyya: "«على نيتك: تحب تبرعك يكون إيه؟»", about: "من نحن", numbers: "مرسال بالأرقام", hospital: "مستشفى مرسال للأطفال", impact: "حاسبة «تبرعك بيعمل إيه»",
  services: "خدمات مرسال", projects: "مشاريع مرسال", ways: "طرق التبرع (الكروت)", partners: "شركاء مرسال", slogan: "آخر الصفحة: الآية و«ابعت فرحة»",
};
const IDS = Object.keys(SECTIONS);
const OPEN = "<!-- mersal:order -->", CLOSE = "<!-- /mersal:order -->";

// a full order: the ids given (known ones, each once) followed by the missing ones in the page's own order
function order(list) {
  const out = [];
  for (const id of Array.isArray(list) ? list : []) if (IDS.includes(id) && !out.includes(id)) out.push(id);
  for (const id of IDS) if (!out.includes(id)) out.push(id);
  return out;
}
// { data, error }: known ids only, each at most once
function clean(data) {
  const h = data && data.home;
  if (!h || typeof h !== "object") return { error: "البيانات ناقصة أو مش بالشكل الصحيح" };
  for (const k of ["phone", "desktop", "hidden"]) {
    if (h[k] != null && !Array.isArray(h[k])) return { error: "البيانات مش بالشكل الصحيح" };
    for (const id of h[k] || []) if (!IDS.includes(id)) return { error: "قسم غير معروف: " + String(id).slice(0, 40) };
  }
  const hidden = (h.hidden || []).filter((id, i, a) => a.indexOf(id) === i);
  if (hidden.includes("slider") && hidden.includes("quick")) return { error: "السلايدر وصندوق التبرع مينفعش يتخفوا مع بعض" };
  return { data: { _note: typeof data._note === "string" ? data._note : "", home: { phone: order(h.phone), desktop: order(h.desktop), hidden } } };
}
function css(data) {
  const h = (data && data.home) || {};
  const rule = (list) => order(list).map((id, i) => `.home main>[data-sec="${id}"]{order:${i + 1}}`).join("");
  return "<style>.home main{display:flex;flex-direction:column}" +
    "@media(max-width:760px){" + rule(h.phone) + "}@media(min-width:761px){" + rule(h.desktop) + "}" +
    (h.hidden || []).filter((id) => IDS.includes(id)).map((id) => `.home main>[data-sec="${id}"]{display:none}`).join("") + "</style>";
}
function apply(indexHtml, data) {
  const block = OPEN + css(data) + CLOSE;
  const a = indexHtml.indexOf(OPEN), b = indexHtml.indexOf(CLOSE);
  if (a >= 0 && b > a) return indexHtml.slice(0, a) + block + indexHtml.slice(b + CLOSE.length);
  return indexHtml.replace("</head>", block + "\n</head>");
}
module.exports = { SECTIONS, IDS, clean, css, apply, order };
