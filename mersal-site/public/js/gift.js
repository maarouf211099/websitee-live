// Dedicate a donation ("إهداء التبرع") and the monthly reminder ("ذكّرني كل شهر").
// gift.html: the form draws a 1080x1350 dedication card live on a canvas (download, share, donate), the "how to
// donate" tabs and the reminder pickers. Any other page that loads this file gets window.MersalGift:
//   MersalGift.cardFor(opts)   -> opens the card in a dialog (Promise of the canvas once drawn)
//   MersalGift.draw(canvas, opts) / MersalGift.blob(opts) -> draw on your own canvas / a PNG Blob
//   MersalGift.remind()        -> the reminder dialog (any [data-gift-reminder] button opens it too)
//   MersalGift.ics(opts) / MersalGift.googleUrl(opts) -> the monthly .ics text / an "add to Google Calendar" link
//   MersalGift.afterDonation(box, info), MersalGift.summaryRow() -> hooks for the donate card stepper (donate.js)
// opts: { occasion: "gift"|"soul"|"recovery"|"birthday"|"none", gender: "m"|"f", to, from, msg, amount, show,
//         purpose, purposeTitle }. Nothing here takes a payment or sends anything to a server: the card is drawn on
// this device and the last inputs stay in localStorage ("mersalGift").
(function () {
  "use strict";
  var KEY = "mersalGift", W = 1080, H = 1350;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SMOOTH = reduce ? "auto" : "smooth";
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn"), LOC = "ar-EG-u-nu-latn"; // Latin digits, like the rest of the site
  function noop() {}
  function site() { return window.MERSAL_SITE || {}; }
  function hotline() { return String(site().hotline || "19340").trim() || "19340"; }
  function orgName() { return String((site().footer && site().footer.name) || "مؤسسة مرسال للأعمال الخيرية والتنموية"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function store(patch) { try { var o = load(); Object.keys(patch).forEach(function (k) { o[k] = patch[k]; }); localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  // links point at the site that serves the page (https in production; the local http test server keeps its origin)
  function base() { var l = location; return l.protocol === "http:" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(l.hostname) ? l.origin : "https://" + l.host; }
  function str(v, n) { return Array.from(String(v == null ? "" : v).replace(/\s+/g, " ").trim()).slice(0, n).join(""); }

  // ---------- occasions: label/sub for the pickers, the card wording ([masculine, feminine] where Arabic needs it) ----------
  var ICON = {
    gift: ["M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7c-2-4-7-4-6 0M12 7c2-4 7-4 6 0"],
    soul: ["M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10z", "M17.5 4.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"],
    recovery: ["M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z", "M6.5 12.5h3l1.5-2.5 2 4 1.5-1.5h3"],
    birthday: ["M4 21h16M5 21v-6.5A2.5 2.5 0 0 1 7.5 12h9a2.5 2.5 0 0 1 2.5 2.5V21M5 16.5c2.3 1.4 4.7 1.4 7 0s4.7-1.4 7 0M12 12V8.5M12 3.5c1.1 1.3 1.1 2.6 0 3.3-1.1-.7-1.1-2 0-3.3z"],
    none: ["M12 3l2.2 5.3L20 10.5l-5.8 2.2L12 18l-2.2-5.3L4 10.5l5.8-2.2z", "M19 17l.7 1.6 1.6.7-1.6.7L19 21.6l-.7-1.6-1.6-.7 1.6-.7z"],
    calendar: ["M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 3v4M16 3v4M12 13.5v4M10 15.5h4"],
    download: ["M12 4v11M7 10.5l5 5 5-5M5 20h14"],
    share: ["M15 5a3 3 0 1 0 6 0 3 3 0 0 0-6 0M3 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0M15 19a3 3 0 1 0 6 0 3 3 0 0 0-6 0M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"],
    close: ["M6 6l12 12M18 6L6 18"],
    wa: ["M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"]
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[name].join(" ") + '"/></svg>'; }
  var OCC = {
    gift: { label: "هدية", sub: "لحد بتحبه", pill: "هدية من القلب", lead: "تبرع باسم", bless: "بدل الهدية، اتعمل باسمك تبرع يفرّح مريض محتاج", toLabel: "اسم اللي هتهديله التبرع" },
    soul: { label: "صدقة جارية على روح", sub: "على روح حد غالي", pill: "صدقة جارية", lead: ["على روح المرحوم", "على روح المرحومة"],
      bless: ["اللهم اغفر له وارحمه، واجعلها في ميزان حسناته", "اللهم اغفر لها وارحمها، واجعلها في ميزان حسناتها"], toLabel: ["اسم المرحوم", "اسم المرحومة"] },
    recovery: { label: "بمناسبة شفاء", sub: "حمد الله على السلامة", pill: "حمد الله على السلامة", lead: "تبرع بمناسبة شفاء",
      bless: ["ربنا يديم عليك الصحة والعافية، ويشفي كل مريض", "ربنا يديم عليكي الصحة والعافية، ويشفي كل مريض"], toLabel: "اسم اللي ربنا شفاه" },
    birthday: { label: "عيد ميلاد", sub: "سنة جديدة بخير", pill: "عيد ميلاد سعيد", lead: "تبرع بمناسبة عيد ميلاد",
      bless: ["كل سنة وانت طيب، وسنة جديدة مليانة خير ليك ولغيرك", "كل سنة وانتي طيبة، وسنة جديدة مليانة خير ليكي ولغيرك"], toLabel: "اسم صاحب عيد الميلاد" },
    none: { label: "من غير مناسبة", sub: "إهداء وخلاص", pill: "إهداء", lead: "تبرع لعلاج المرضى باسم", bless: "علشان الخير اللي جواك يوصل لكل محتاج", toLabel: "اسم اللي هتهديله التبرع" }
  };
  function pick(v, f) { return Array.isArray(v) ? v[f ? 1 : 0] : v; }
  function toLabel(occ, gender) { var l = pick(OCC[occ].toLabel, gender === "f"); return occ === "recovery" && gender === "f" ? "اسم اللي ربنا شفاها" : occ === "birthday" && gender === "f" ? "اسم صاحبة عيد الميلاد" : l; }

  function clean(o) {
    o = o || {};
    var amount = Math.round(Number(String(o.amount == null ? "" : o.amount).replace(/[^\d.]/g, "")) || 0);
    if (amount < 1 || amount > 100000000) amount = 0;
    return {
      occasion: OCC[o.occasion] ? o.occasion : "gift", gender: o.gender === "f" ? "f" : "m",
      to: str(o.to, 60), from: str(o.from, 60), msg: str(o.msg != null ? o.msg : o.message, 120),
      amount: amount, show: !!o.show && amount > 0,
      purpose: str(o.purpose, 24).replace(/[^\w-]/g, ""), purposeTitle: str(o.purposeTitle, 120)
    };
  }
  function purposeLine(o) {
    if (o.purpose === "zakat") return "من زكاة المال";
    if (!o.purpose || o.purpose === "general" || o.purpose === "sadaqa" || !o.purposeTitle || /تبرع عام/.test(o.purposeTitle)) return "";
    return "لدعم " + o.purposeTitle;
  }
  function texts(o) {
    var c = OCC[o.occasion], f = o.gender === "f";
    return { pill: c.pill, lead: pick(c.lead, f), name: o.to, bless: pick(c.bless, f), msg: o.msg, purpose: purposeLine(o),
      amount: o.show ? fmt.format(o.amount) + " جنيه" : "", from: "من: " + (o.from || "فاعل خير") };
  }
  function shareText(o) {
    var t = texts(o);
    return t.pill + " 💚\n" + t.lead + " " + o.to + "\n" + t.bless + (o.msg ? "\n«" + o.msg + "»" : "") + "\n" + t.from +
      "\n\nمع " + orgName() + "\nاهدي تبرع انت كمان: " + base() + "/gift.html";
  }
  function donateHref(o) {
    var q = [];
    if (o.purpose && o.purpose !== "general") q.push("for=" + encodeURIComponent(o.purpose));
    if (o.amount >= 10) q.push("amount=" + o.amount);
    return "/donate.html" + (q.length ? "?" + q.join("&") : "") + "#online";
  }

  // ---------- assets: the Cairo Arabic + Latin subsets and the two images are ready before the first draw ----------
  var assets = null;
  function img(src) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function ready() {
    if (assets) return assets;
    var fonts = document.fonts && document.fonts.load ? Promise.all([
      document.fonts.load('800 80px Cairo', "مرسال تبرع"), document.fonts.load('700 40px Cairo', "Mersal 19340")
    ]).catch(noop) : Promise.resolve();
    // a font that never arrives (offline, blocked) must not block the card: draw with the fallback after 4 s
    assets = Promise.all([Promise.race([fonts, new Promise(function (r) { setTimeout(r, 4000); })]), img("/img/brand-logo.png"), img("/img/pattern-white.png")])
      .then(function (r) { return { logo: r[1], pattern: r[2] }; });
    return assets;
  }

  // ---------- canvas drawing ----------
  var ZWJ = "\u200d", AR = /[\u0620-\u064a\u066e-\u06d3\u06fa-\u06fc]/, NOJOIN = /[\u0622-\u0625\u0627\u0629\u062f-\u0632\u0648\u0649]/;
  function font(ctx, wt, px) { ctx.font = wt + " " + Math.round(px) + "px Cairo, Tahoma, Arial, sans-serif"; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // a word wider than the line is cut; a zero-width joiner on both sides keeps Arabic letters in their joined forms
  function splitWord(ctx, w, maxW) {
    var ch = Array.from(w), k = ch.length - 1;
    while (k > 1 && ctx.measureText(ch.slice(0, k).join("") + ZWJ).width > maxW) k--;
    var a = ch.slice(0, k).join(""), b = ch.slice(k).join("");
    if (AR.test(ch[k - 1]) && AR.test(ch[k]) && !NOJOIN.test(ch[k - 1])) { a += ZWJ; b = ZWJ + b; }
    return [a, b];
  }
  function ellipsis(ctx, s, maxW) {
    var ch = Array.from(s);
    while (ch.length && ctx.measureText(ch.join("").trim() + "…").width > maxW) ch.pop();
    return ch.join("").trim() + "…";
  }
  function wrap(ctx, text, maxW, maxLines) {
    var words = String(text || "").split(/\s+/).filter(Boolean), lines = [], line = "", broke = false;
    for (var i = 0; i < words.length; i++) {
      var w = words[i], t = line ? line + " " + w : w;
      if (ctx.measureText(t).width <= maxW) { line = t; continue; }
      if (line) lines.push(line);
      while (ctx.measureText(w).width > maxW) { var p = splitWord(ctx, w, maxW); lines.push(p[0]); w = p[1]; broke = true; }
      line = w;
    }
    if (line) lines.push(line);
    var over = lines.length > maxLines;
    if (over) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = ellipsis(ctx, lines[maxLines - 1], maxW); }
    return { lines: lines, over: over, broke: broke };
  }
  // same line count, narrowest width: "ربنا يديم عليك الصحة والعافية، ويشفي كل / مريض" becomes two even lines
  function wrapEven(ctx, text, maxW, maxLines) {
    var r = wrap(ctx, text, maxW, maxLines);
    if (r.lines.length < 2 || r.over || r.broke) return r;
    var lo = maxW * 0.45, hi = maxW, best = r;
    for (var i = 0; i < 9; i++) {
      var mid = (lo + hi) / 2, t = wrap(ctx, text, mid, maxLines);
      if (!t.over && !t.broke && t.lines.length === r.lines.length) { best = t; hi = mid; } else lo = mid;
    }
    return best;
  }
  // the name takes the biggest size (104 -> 60 px) at which it fits on two lines without cutting a word, then three
  // lines (60 -> 48 px); only a name that still does not fit is cut
  function fitName(ctx, name, maxW, s) {
    var px, r;
    for (px = 104; px >= 60; px -= 4) {
      font(ctx, 800, px * s); r = wrap(ctx, name, maxW, 2);
      if (!r.over && !r.broke) return { px: px * s, lines: wrapEven(ctx, name, maxW, 2).lines };
    }
    for (px = 60; px >= 48; px -= 4) {
      font(ctx, 800, px * s); r = wrap(ctx, name, maxW, 3);
      if (!r.over && !r.broke) return { px: px * s, lines: wrapEven(ctx, name, maxW, 3).lines };
    }
    font(ctx, 800, 60 * s);
    return { px: 60 * s, lines: wrap(ctx, name, maxW, 2).lines };
  }
  var MAXW = 796, PLACEHOLDER = "اسم اللي بتحبه";
  function blocks(ctx, t, s) {
    var out = [];
    function text(wt, px, color, value, maxLines, lh, gap) {
      font(ctx, wt, px * s);
      var r = wrapEven(ctx, value, MAXW, maxLines);
      out.push({ k: "text", wt: wt, px: px * s, color: color, lines: r.lines, lh: lh, h: r.lines.length * px * s * lh, gap: gap * s });
    }
    font(ctx, 700, 32 * s);
    out.push({ k: "pill", text: t.pill, w: Math.min(MAXW, ctx.measureText(t.pill).width + 72 * s), px: 32 * s, h: 66 * s, gap: 30 * s });
    text(600, 42, "#5f6b6b", t.lead, 1, 1.4, 2);
    var nm = fitName(ctx, t.name || PLACEHOLDER, MAXW, s);
    out.push({ k: "text", wt: 800, px: nm.px, color: t.name ? "#005959" : "#a9c4c4", lines: nm.lines, lh: 1.32, h: nm.lines.length * nm.px * 1.32, gap: 24 * s });
    out.push({ k: "divider", h: 6 * s, gap: 30 * s });
    text(600, 40, "#1f2a2a", t.bless, 3, 1.55, 28);
    if (t.msg) {
      font(ctx, 600, 34 * s);
      var q = wrapEven(ctx, "«" + t.msg + "»", MAXW - 88 * s, 3);
      out.push({ k: "quote", px: 34 * s, lines: q.lines, lh: 1.5, pad: 22 * s, h: q.lines.length * 34 * s * 1.5 + 44 * s, gap: 28 * s });
    }
    if (t.purpose) text(700, 32, "#007879", t.purpose, 2, 1.45, 24);
    if (t.amount) { font(ctx, 800, 50 * s); out.push({ k: "amount", text: t.amount, w: ctx.measureText(t.amount).width + 96 * s, px: 50 * s, h: 96 * s, gap: 28 * s }); }
    text(700, 42, "#005959", t.from, 2, 1.4, 0);
    return out;
  }
  function icon(ctx, name, cx, cy, scale, color) {
    if (typeof Path2D !== "function") return;
    ctx.save(); ctx.translate(cx - 12 * scale, cy - 12 * scale); ctx.scale(scale, scale);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ICON[name].forEach(function (d) { try { ctx.stroke(new Path2D(d)); } catch (e) {} });
    ctx.restore();
  }
  function lines(ctx, b, y, color) {
    ctx.fillStyle = color;
    b.lines.forEach(function (ln, i) { ctx.fillText(ln, W / 2, y + (i + 0.5) * b.px * b.lh); });
  }
  function paint(canvas, o, a) {
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    if (!canvas.getAttribute("dir")) canvas.setAttribute("dir", "rtl"); // the default ctx.direction ("inherit") reads it
    var ctx = canvas.getContext("2d"), t = texts(o), i;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    // background: brand teal, the site's pattern, soft rings and a warm gold glow
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#008b8c"); g.addColorStop(0.55, "#006e6f"); g.addColorStop(1, "#004646");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (a.pattern) { ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = ctx.createPattern(a.pattern, "repeat"); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    ctx.save(); ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.05;
    for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(W * 0.92, H * 0.07, 150 + i * 120, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    var glow = ctx.createRadialGradient(W * 0.08, H * 0.97, 10, W * 0.08, H * 0.97, 520);
    glow.addColorStop(0, "rgba(254,200,48,.28)"); glow.addColorStop(1, "rgba(254,200,48,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // the Mersal logo on a white tile
    ctx.fillStyle = "#fff"; rr(ctx, W / 2 - 140, 44, 280, 158, 32); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    try { ctx.direction = "rtl"; } catch (e) {}
    // brand-logo.png (400x237) ends in a "FOUNDATION" line that the file cuts off at the bottom: only the mark above it is drawn
    if (a.logo) { var lh = Math.round(a.logo.naturalHeight * 216 / 237); ctx.drawImage(a.logo, 0, 0, a.logo.naturalWidth, lh, W / 2 - 115, 61, 230, Math.round(230 * lh / a.logo.naturalWidth)); }
    else { font(ctx, 800, 64); ctx.fillStyle = "#e9ad0c"; ctx.fillText("مرسال", W / 2, 123); }
    // the white card with a thin gold frame and the occasion medallion on its top edge
    var cx = 72, cy = 290, cw = W - 144, ch = 906;
    ctx.save(); ctx.shadowColor = "rgba(0,28,28,.38)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#fff"; rr(ctx, cx, cy, cw, ch, 44); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "rgba(233,173,12,.5)"; ctx.lineWidth = 3; rr(ctx, cx + 22, cy + 22, cw - 44, ch - 44, 30); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, cy, 66, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(W / 2, cy, 55, 0, Math.PI * 2); ctx.fillStyle = "#fec830"; ctx.fill();
    icon(ctx, o.occasion, W / 2, cy, 3.2, "#005959");
    // the text, centred in the card; everything shrinks a little when a long message makes it too tall
    var top = cy + 92, avail = ch - 92 - 52, s = 1, list, total;
    for (;;) {
      list = blocks(ctx, t, s);
      total = list.reduce(function (n, b) { return n + b.h + b.gap; }, 0);
      if (total <= avail || s <= 0.7) break;
      s -= 0.05;
    }
    var y = top + Math.max(0, (avail - total) / 2);
    list.forEach(function (b) {
      if (b.k === "pill" || b.k === "amount") {
        ctx.fillStyle = b.k === "pill" ? "#e4f3f3" : "#fec830"; rr(ctx, W / 2 - b.w / 2, y, b.w, b.h, b.h / 2); ctx.fill();
        font(ctx, b.k === "pill" ? 700 : 800, b.px); ctx.fillStyle = b.k === "pill" ? "#005959" : "#003c3c";
        ctx.fillText(b.text, W / 2, y + b.h / 2 + b.px * 0.04);
      } else if (b.k === "divider") {
        ctx.fillStyle = "#fec830"; rr(ctx, W / 2 - 60, y, 120, b.h, b.h / 2); ctx.fill();
      } else if (b.k === "quote") {
        ctx.fillStyle = "#eef7f7"; rr(ctx, W / 2 - MAXW / 2, y, MAXW, b.h, 26); ctx.fill();
        font(ctx, 600, b.px); lines(ctx, b, y + b.pad, "#007879");
      } else { font(ctx, b.wt, b.px); lines(ctx, b, y, b.color); }
      y += b.h + b.gap;
    });
    // footer: the foundation's name, site and hotline
    font(ctx, 700, 34); ctx.fillStyle = "#fff"; ctx.fillText(orgName(), W / 2, 1256);
    font(ctx, 600, 29); ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.fillText("mersal-ngo.org  ·  الخط الساخن " + hotline(), W / 2, 1305);
  }
  function fileName(o) { return "mersal-" + o.occasion + "-card.png"; }
  function toBlob(canvas) { return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, "image/png"); }); }
  function saveBlob(blob, name) {
    if (!blob) return;
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; a.rel = "noopener"; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  // Share: the PNG itself where the browser can share files (phones); elsewhere the button is a WhatsApp text link
  var canShareFiles = (function () {
    try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.png", { type: "image/png" })] })); } catch (e) { return false; }
  })();
  function waHref(o) { return "https://wa.me/?text=" + encodeURIComponent(shareText(o)); }
  function setupShare(a, getState) {
    var label = a.querySelector("span") || a;
    label.textContent = canShareFiles ? "مشاركة" : "واتساب";
    a.classList.toggle("gf-wa", !canShareFiles);
    if (canShareFiles) a.setAttribute("aria-label", "شارك الكارت");
    else {
      a.setAttribute("aria-label", "ابعت الكارت على واتساب");
      var ic = a.querySelector("svg");
      if (ic) ic.outerHTML = '<svg class="gf-wa-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON.wa[0] + '"/></svg>';
    }
    a.addEventListener("click", function (e) {
      var st = getState();
      if (!st || !st.ok) { e.preventDefault(); return; }
      if (!canShareFiles) return; // the link opens WhatsApp with the text
      e.preventDefault();
      // the blob is made right after each draw, so navigator.share runs inside the tap
      var go = function (blob) {
        var data = { files: [new File([blob], fileName(st.o), { type: "image/png" })], title: "كارت إهداء من مرسال", text: shareText(st.o) };
        navigator.share(data).catch(function (err) { if (!err || err.name !== "AbortError") saveBlob(blob, fileName(st.o)); });
      };
      if (st.blob) go(st.blob); else toBlob(st.canvas).then(function (b) { if (b) go(b); });
    });
  }

  // ---------- monthly reminder: an .ics with RRULE:FREQ=MONTHLY, or a Google Calendar link ----------
  var TIMES = [["10:00", "10 الصبح"], ["14:00", "2 الظهر"], ["20:00", "8 بالليل"]];
  function remindOpts(o) {
    o = o || {};
    var day = Math.min(28, Math.max(1, parseInt(o.day, 10) || 1)), tm = /^(\d{1,2}):(\d{2})$/.exec(o.time || "") || [0, "10", "00"];
    return { day: day, hour: Math.min(23, +tm[1]), minute: Math.min(59, +tm[2]) };
  }
  function nextDate(r, now) {
    now = now || new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), r.day, r.hour, r.minute);
    if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, r.day, r.hour, r.minute);
    return d;
  }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  // floating local time (no TZID): the reminder rings at the chosen hour wherever the donor's phone is
  function localStamp(d) { return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "T" + p2(d.getHours()) + p2(d.getMinutes()) + "00"; }
  function utcStamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function icsEsc(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  // RFC 5545 lines are folded at 75 octets (UTF-8), never inside a character
  function fold(line) {
    var out = "", n = 0;
    Array.from(line).forEach(function (ch) {
      var c = ch.codePointAt(0), b = c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      if (n + b > 75) { out += "\r\n "; n = 1; }
      out += ch; n += b;
    });
    return out;
  }
  var R_TITLE = "تبرعك الشهري لمرسال";
  function remindText(url) { return "ميعاد تبرعك الشهري لمؤسسة مرسال.\nاتبرع من هنا: " + url + "\nأو اتصل بالخط الساخن " + hotline() + "\nربنا يجعله في ميزان حسناتك."; }
  function ics(o) {
    var r = remindOpts(o), start = nextDate(r, o && o.now), end = new Date(start.getTime() + 30 * 60000);
    var url = base() + "/donate.html#online", now = new Date();
    var uid = "mersal-monthly-" + now.getTime().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "@" + (location.hostname || "mersal-ngo.org");
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mersal Foundation//Monthly donation reminder//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + utcStamp(now),
      "DTSTART:" + localStamp(start), "DTEND:" + localStamp(end),
      "RRULE:FREQ=MONTHLY;BYMONTHDAY=" + r.day,
      "SUMMARY:" + icsEsc(R_TITLE), "DESCRIPTION:" + icsEsc(remindText(url)), "URL:" + url,
      "TRANSP:TRANSPARENT", "STATUS:CONFIRMED",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(R_TITLE), "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].map(fold).join("\r\n") + "\r\n";
  }
  function googleUrl(o) {
    var r = remindOpts(o), start = nextDate(r, o && o.now), end = new Date(start.getTime() + 30 * 60000);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(R_TITLE) +
      "&dates=" + localStamp(start) + "/" + localStamp(end) +
      "&details=" + encodeURIComponent(remindText(base() + "/donate.html#online")) +
      "&recur=" + encodeURIComponent("RRULE:FREQ=MONTHLY;BYMONTHDAY=" + r.day);
  }
  function downloadIcs(o) { saveBlob(new Blob([ics(o)], { type: "text/calendar;charset=utf-8" }), "mersal-monthly-reminder.ics"); }
  // the day/time pickers + buttons, shared by gift.html and the reminder dialog
  function reminderForm(box, idp) {
    var r = load().remind || {}, day = remindOpts(r).day, time = TIMES.some(function (t) { return t[0] === r.time; }) ? r.time : "10:00";
    var days = ""; for (var d = 1; d <= 28; d++) days += '<option value="' + d + '"' + (d === day ? " selected" : "") + ">يوم " + d + "</option>";
    box.innerHTML =
      '<div class="gf-rm-fields">' +
        '<div class="field"><label for="' + idp + '-day">يوم كام في الشهر؟</label><select id="' + idp + '-day">' + days + "</select></div>" +
        '<div class="field"><label for="' + idp + '-time">الساعة كام؟</label><select id="' + idp + '-time">' +
          TIMES.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === time ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") + "</select></div>" +
      "</div>" +
      '<p class="gf-rm-next" aria-live="polite"></p>' +
      '<div class="gf-rm-btns"><button type="button" class="btn btn-gold" data-ics>' + svg("calendar") + "ذكّرني كل شهر</button>" +
        '<a class="btn btn-ghost-teal" data-gcal href="https://calendar.google.com/" target="_blank" rel="noopener">أضف لـ <bdi dir="ltr">Google Calendar</bdi></a></div>' +
      '<p class="hint gf-rm-hint">زرار "ذكّرني كل شهر" بينزّل ملف تذكير بيفتح في تقويم الموبايل (آيفون، سامسونج، أوتلوك). بتستخدم <bdi dir="ltr">Google Calendar</bdi>؟ دوس على الزرار التاني.</p>';
    var dSel = box.querySelector("#" + idp + "-day"), tSel = box.querySelector("#" + idp + "-time"), next = box.querySelector(".gf-rm-next"), gcal = box.querySelector("[data-gcal]");
    function opts() { return { day: dSel.value, time: tSel.value }; }
    function sync(saveIt) {
      var o = opts(), d = nextDate(remindOpts(o)), tl = tSel.options[tSel.selectedIndex].textContent;
      next.textContent = "أول تذكير " + d.toLocaleDateString(LOC, { weekday: "long", day: "numeric", month: "long" }) + " الساعة " + tl + "، وبعدها يوم " + remindOpts(o).day + " من كل شهر.";
      gcal.href = googleUrl(o);
      if (saveIt) store({ remind: o });
    }
    dSel.addEventListener("change", function () { sync(true); });
    tSel.addEventListener("change", function () { sync(true); });
    box.querySelector("[data-ics]").addEventListener("click", function () {
      sync(true); downloadIcs(opts());
      next.textContent = "نزل ملف التذكير. افتحه وهيتضاف لتقويم موبايلك 💚";
      if (window.mersalTap) window.mersalTap(8);
    });
    gcal.addEventListener("click", function () { sync(true); });
    sync(false);
  }

  // ---------- dialogs (native <dialog>: top layer, focus trap, Esc / Back, light dismiss) ----------
  function makeDialog(id, title) {
    var d = document.getElementById(id);
    if (d) return d;
    d = document.createElement("dialog");
    d.id = id; d.className = "gf-dlg"; d.setAttribute("closedby", "any"); d.setAttribute("aria-labelledby", id + "-t");
    d.innerHTML = '<div class="gf-dlg-in"><div class="gf-dlg-head"><h2 id="' + id + '-t">' + esc(title) + '</h2><button type="button" class="gf-x" data-close aria-label="إغلاق">' + svg("close") + '</button></div><div class="gf-dlg-body"></div></div>';
    document.body.appendChild(d);
    d.querySelector("[data-close]").addEventListener("click", function () { closeDialog(d); });
    // light dismiss where closedby is not supported yet (Safari): a click on the backdrop targets the dialog itself
    if (!("closedBy" in d)) d.addEventListener("click", function (e) {
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right) return;
      closeDialog(d);
    });
    d.addEventListener("close", function () {
      document.documentElement.classList.remove("gf-lock");
      var back = d._from;
      if (back && back.isConnected && back !== document.body && document.activeElement !== back) try { back.focus({ preventScroll: true }); } catch (e) {}
    });
    return d;
  }
  function openDialog(d) {
    d._from = document.activeElement;
    d.classList.remove("closing");
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else d.setAttribute("open", "");
    document.documentElement.classList.add("gf-lock");
  }
  function closeDialog(d) {
    if (!d.open || d.classList.contains("closing")) return;
    var done = function () { d.classList.remove("closing"); if (typeof d.close === "function") d.close(); else { d.removeAttribute("open"); d.dispatchEvent(new Event("close")); } };
    if (reduce) return done();
    d.classList.add("closing"); // css: fades and shrinks away, then closes
    setTimeout(done, 180);
  }

  function remind() {
    var d = makeDialog("gf-rm-dlg", "ذكّرني كل شهر"), body = d.querySelector(".gf-dlg-body");
    if (!body.firstChild) {
      body.innerHTML = '<p class="gf-dlg-p">اختار اليوم اللي يناسبك (مثلاً بعد القبض)، وهيتضاف تذكير شهري في تقويم موبايلك فيه لينك التبرع. التذكير عندك انت بس.</p><div class="gf-rm-form"></div>';
      reminderForm(body.querySelector(".gf-rm-form"), "gf-dlg-rm");
    }
    openDialog(d);
    return d;
  }

  // The card in a dialog (donate success / after the gateway, or any page): download, share, show the amount, edit
  function cardFor(opts) {
    var o = clean(opts);
    store({ occasion: o.occasion, gender: o.gender, to: o.to, from: o.from, msg: o.msg, amount: o.amount || "", purpose: o.purpose, show: o.show });
    var d = makeDialog("gf-card-dlg", "كارت الإهداء"), body = d.querySelector(".gf-dlg-body");
    if (!body.firstChild) {
      body.innerHTML =
        '<div class="gf-canvas-box"><canvas width="1080" height="1350" role="img" aria-label="كارت الإهداء"></canvas></div>' +
        '<label class="check gf-check gf-dlg-amt" hidden><input type="checkbox" data-show> اظهر المبلغ في الكارت</label>' +
        '<div class="gf-actions gf-actions-2">' +
          '<button type="button" class="btn btn-teal" data-dl>' + svg("download") + "تحميل الصورة</button>" +
          '<a class="btn btn-ghost-teal" data-share href="https://wa.me/" target="_blank" rel="noopener">' + svg("share") + "<span>مشاركة</span></a>" +
        "</div>" +
        '<p class="gf-dlg-edit"><a href="/gift.html">عدّل الكارت أو اكتب رسالة</a></p>';
      var st = d._st = { ok: true, o: o, canvas: body.querySelector("canvas"), blob: null };
      body.querySelector("[data-dl]").addEventListener("click", function () { if (st.ok) toBlob(st.canvas).then(function (b) { saveBlob(b, fileName(st.o)); }); });
      setupShare(body.querySelector("[data-share]"), function () { return d._st; });
      body.querySelector("[data-show]").addEventListener("change", function (e) { st.o.show = e.target.checked && st.o.amount > 0; store({ show: st.o.show }); render(); });
    }
    var s = d._st, amt = body.querySelector(".gf-dlg-amt");
    s.o = o; s.blob = null; s.ok = !!o.to; // without a name the card shows the placeholder: nothing to save or share
    amt.hidden = !(o.amount > 0); amt.querySelector("input").checked = o.show;
    function render() {
      return ready().then(function (a) {
        paint(s.canvas, s.o, a);
        s.canvas.setAttribute("aria-label", "كارت الإهداء: " + texts(s.o).lead + " " + s.o.to);
        body.querySelector("[data-share]").href = waHref(s.o);
        s.blob = null; toBlob(s.canvas).then(function (b) { s.blob = b; });
        return s.canvas;
      });
    }
    openDialog(d);
    return render();
  }

  // ---------- donate card stepper hooks (the fields are in donate.html, the calls in donate.js) ----------
  function radio(scope, name) { var r = scope.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
  function stepperGift(paid) {
    var on = document.getElementById("gift-on");
    if (on && on.checked) {
      var to = str((document.getElementById("gift-to") || {}).value, 60);
      return to ? { occasion: (document.getElementById("gift-occasion") || {}).value, to: to, gender: radio(document, "gift-gender") } : null;
    }
    // back from the bank the page reloads empty: the choice made before the redirect is kept in localStorage
    var s = load();
    return paid && s.pending && s.to ? { occasion: s.occasion, to: s.to, gender: s.gender, from: typeof s.pendingFrom === "string" ? s.pendingFrom : null } : null;
  }
  // the sender shown on the card: nothing ("فاعل خير") when the donor ticked "تبرع بدون ذكر اسمي"
  function stepperFrom() {
    var nameEl = document.getElementById("name"), anon = document.getElementById("anon");
    return anon && anon.checked ? "" : nameEl ? str(nameEl.value, 60) : "";
  }
  function initStepper() {
    var on = document.getElementById("gift-on"), box = document.getElementById("gift-fields");
    if (!on || !box) return;
    var to = document.getElementById("gift-to"), occ = document.getElementById("gift-occasion"), lbl = document.getElementById("gift-to-l"), s = load();
    if (occ && OCC[s.occasion]) occ.value = s.occasion;
    if (to && s.to && !to.value) to.value = s.to;
    if (s.gender === "f") { var f = box.querySelector('input[name="gift-gender"][value="f"]'); if (f) f.checked = true; }
    function label() { if (lbl && occ) lbl.textContent = toLabel(OCC[occ.value] ? occ.value : "gift", radio(box, "gift-gender")); }
    // stored only when the donor touches the fields: a reload back from the bank must not wipe the pending choice
    function sync() { box.hidden = !on.checked; label(); store({ pending: on.checked, occasion: occ ? occ.value : "gift", to: to ? str(to.value, 60) : "", gender: radio(box, "gift-gender") || "m" }); }
    box.hidden = !on.checked; label();
    on.addEventListener("change", function () { sync(); if (on.checked && to && !to.value) setTimeout(function () { to.focus(); }, 30); });
    box.addEventListener("input", sync); box.addEventListener("change", sync);
    // at "ادفع" the sender is fixed too (name, or nothing when anonymous): the bank's return page cannot read the form
    if (on.form) on.form.addEventListener("submit", function () { if (on.checked) { sync(); store({ pendingFrom: stepperFrom() }); } });
  }
  function summaryRow() {
    var g = stepperGift(false);
    return g ? "<dt>إهداء</dt><dd>" + esc((OCC[g.occasion] || OCC.gift).label + ": " + g.to) + "</dd>" : "";
  }
  // info: { paid, amount, purpose, purposeTitle, from, before }. Paid: a "ذكّرني كل شهر" button always, the card when
  // the donor chose to dedicate the donation. The block goes at the end of box, or before info.before (an element in box).
  function afterDonation(box, info) {
    if (!box) return;
    info = info || {};
    var g = stepperGift(!!info.paid), old = box.querySelector(".gf-after");
    if (old) old.remove();
    if (!g && !info.paid) return;
    var from = info.from != null ? info.from : g && g.from != null ? g.from : stepperFrom();
    var html = "";
    if (g) html += '<div class="gf-offer">' + '<span class="gf-offer-ico" aria-hidden="true">' + svg(OCC[g.occasion] ? g.occasion : "gift") + "</span>" +
      "<span><b>" + (info.paid ? "كارت الإهداء جاهز" : "كارت الإهداء جاهز تبعته بعد ما تكمل تبرعك") + "</b><small>" + esc(texts(clean(g)).lead + " " + g.to) + "</small></span>" +
      '<button type="button" class="btn btn-gold" data-gf-open>افتح الكارت</button></div>';
    if (info.paid) html += '<button type="button" class="btn btn-ghost-teal gf-after-rm" data-gift-reminder>' + svg("calendar") + "ذكّرني كل شهر</button>";
    var wrap = document.createElement("div");
    wrap.className = "gf-after"; wrap.innerHTML = html;
    if (info.before && info.before.parentNode === box) box.insertBefore(wrap, info.before); else box.appendChild(wrap);
    var b = wrap.querySelector("[data-gf-open]");
    if (b) b.addEventListener("click", function () {
      cardFor({ occasion: g.occasion, gender: g.gender, to: g.to, from: from, amount: info.amount, purpose: info.purpose, purposeTitle: info.purposeTitle, show: false });
    });
    if (info.paid) store({ pending: false, pendingFrom: null });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-gift-reminder]");
    if (b) { e.preventDefault(); remind(); }
  });

  // ---------- gift.html ----------
  var LEGACY = { hospital: "p30", oncology: "p31", cases: "general", p4: "p31", p5: "p31" };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function getJSON(u, fb) { return fetch(u).then(function (r) { return r.json(); }).catch(function () { return fb; }); }
  // same list as the donate stepper (js/donate.js): general/zakat/sadaqa + every project and service, one per cause
  function loadPurposes(sel, want) {
    return Promise.all([getJSON("/content.json", {}), getJSON("/data/menu.json", [])]).then(function (res) {
      var groups = {}, seen = {}, titles = {}, alias = {};
      sel.querySelectorAll("option").forEach(function (o) { titles[o.textContent.trim()] = o.value; });
      function add(group, id, title) {
        var t = String(title || "").trim(), v = "p" + id;
        if (seen[id] || has(LEGACY, v) || !t) return;
        seen[id] = 1;
        if (titles[t]) { alias[v] = titles[t]; return; }
        titles[t] = v;
        (groups[group] = groups[group] || []).push({ v: v, t: t });
      }
      (Array.isArray(res[1]) ? res[1] : []).forEach(function (top) {
        (top.children || []).forEach(function (k) {
          var m = /^\/p\/(\d+)\.html$/.exec(k.href || "");
          if (m && !/طرق التبرع|تطوع|فروع/.test(k.title)) add(top.title, m[1], k.title);
        });
      });
      ((res[0] || {}).projects || []).forEach(function (p) {
        var m = /^\/p\/(\d+)\.html$/.exec(p.link || "");
        if (m) add("مشاريع أخرى", m[1], p.title);
      });
      sel.insertAdjacentHTML("beforeend", Object.keys(groups).map(function (g) {
        return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (o) { return '<option value="' + esc(o.v) + '">' + esc(o.t) + "</option>"; }).join("") + "</optgroup>";
      }).join(""));
      want = String(want || "");
      if (has(LEGACY, want)) want = LEGACY[want];
      if (has(alias, want)) want = alias[want];
      want = want.replace(/[^\w-]/g, "");
      if (want && sel.querySelector('option[value="' + want + '"]')) sel.value = want;
    });
  }

  function initPage() {
    var form = document.getElementById("gf-form");
    if (!form) return;
    var els = form.elements, canvas = document.getElementById("gf-canvas"), preview = document.getElementById("gf-preview");
    var toErr = document.getElementById("gf-to-err"), toLbl = document.getElementById("gf-to-l"), count = document.getElementById("gf-msg-count");
    var dl = document.getElementById("gf-download"), share = document.getElementById("gf-share"), donate = document.getElementById("gf-donate");
    function setRadio(name, v) { var r = form.querySelector('input[name="' + name + '"][value="' + String(v).replace(/[^\w-]/g, "") + '"]'); if (r) r.checked = true; }
    var saved = load(), donor = {}, q = new URLSearchParams(location.search);
    try { donor = JSON.parse(localStorage.getItem("mersalDonor") || "{}") || {}; } catch (e) {}
    setRadio("occasion", OCC[q.get("occasion")] ? q.get("occasion") : saved.occasion || "gift");
    setRadio("gender", saved.gender === "f" ? "f" : "m");
    els.to.value = str(saved.to, 60);
    els.from.value = str(typeof saved.from === "string" ? saved.from : donor.name, 60);
    els.msg.value = str(saved.msg, 120);
    if (saved.amount) els.amount.value = parseInt(saved.amount, 10) || "";
    if (q.get("amount")) els.amount.value = parseInt(q.get("amount"), 10) || "";
    els.show.checked = !!saved.show;
    var purposesReady = loadPurposes(els.purpose, q.get("for") || saved.purpose).catch(noop);

    function values() {
      var opt = els.purpose.options[els.purpose.selectedIndex];
      return clean({ occasion: radio(form, "occasion"), gender: radio(form, "gender"), to: els.to.value, from: els.from.value, msg: els.msg.value,
        amount: els.amount.value, show: els.show.checked, purpose: els.purpose.value, purposeTitle: opt ? opt.textContent : "" });
    }
    var st = { ok: false, o: values(), canvas: canvas, blob: null }, raf = 0, blobT = 0, saveT = 0;
    // the fields, links and label follow every keystroke; the canvas is repainted once per frame at most
    function update() {
      var o = values();
      st.o = o; st.ok = !!o.to; st.blob = null;
      toLbl.textContent = toLabel(o.occasion, o.gender);
      els.show.disabled = !(o.amount > 0);
      count.textContent = Array.from(els.msg.value).length + " / 120";
      donate.href = donateHref(o);
      document.querySelectorAll("[data-gf-donate]").forEach(function (a) { a.href = donateHref(o); });
      share.href = waHref(o);
      if (o.to) clearErr();
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        var cur = st.o;
        ready().then(function (a) {
          if (st.o !== cur) return; // a newer edit is already on its way
          paint(canvas, cur, a);
          canvas.setAttribute("aria-label", "كارت الإهداء: " + texts(cur).lead + " " + (cur.to || PLACEHOLDER));
          clearTimeout(blobT);
          blobT = setTimeout(function () { if (st.o === cur) toBlob(canvas).then(function (b) { if (st.o === cur) st.blob = b; }); }, 250);
        });
      });
      clearTimeout(saveT);
      saveT = setTimeout(function () {
        store({ occasion: o.occasion, gender: o.gender, to: els.to.value.trim(), from: els.from.value.trim(), msg: els.msg.value.trim(), amount: els.amount.value, purpose: els.purpose.value, show: els.show.checked });
      }, 300);
    }
    var schedule = update;
    function clearErr() { toErr.textContent = ""; els.to.removeAttribute("aria-invalid"); els.to.closest(".field").classList.remove("invalid"); }
    function needName() {
      if (st.o.to) return true;
      toErr.textContent = "اكتب " + toLabel(st.o.occasion, st.o.gender) + " الأول عشان يتكتب في الكارت.";
      els.to.setAttribute("aria-invalid", "true"); els.to.closest(".field").classList.add("invalid");
      els.to.scrollIntoView({ behavior: SMOOTH, block: "center" });
      setTimeout(function () { els.to.focus({ preventScroll: true }); }, reduce ? 0 : 250);
      return false;
    }
    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needName()) return;
      preview.scrollIntoView({ behavior: SMOOTH, block: "start" });
      preview.focus({ preventScroll: true });
      if (window.mersalTap) window.mersalTap(8);
    });
    dl.addEventListener("click", function () {
      if (!needName()) return;
      var o = st.o;
      ready().then(function (a) { paint(canvas, o, a); return toBlob(canvas); }).then(function (b) { saveBlob(b, fileName(o)); });
    });
    setupShare(share, function () { return needName() ? st : null; });
    purposesReady.then(schedule);
    update();
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", schedule);

    // how to donate: tabs (arrow keys move between them), EGP bank accounts, wallets, copy buttons
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".gf-tabs [role=tab]"));
    function visible(t) { return t.offsetParent !== null || getComputedStyle(t).display !== "none"; }
    function openTab(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { openTab(t); });
      t.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0; // RTL: left moves forward
        if (e.key === "Home" || e.key === "End") { e.preventDefault(); var v = tabs.filter(visible); openTab(e.key === "Home" ? v[0] : v[v.length - 1], true); return; }
        if (!dir) return;
        e.preventDefault();
        for (var k = 1; k <= tabs.length; k++) { var n = tabs[(i + dir * k + tabs.length) % tabs.length]; if (visible(n)) { openTab(n, true); return; } }
      });
    });
    openTab(tabs.filter(visible)[0] || tabs[1]);

    function copyBtn(value, what) { return '<button type="button" class="gf-copy" data-copy="' + esc(value) + '" aria-label="' + esc("نسخ " + what) + '">نسخ</button>'; }
    getJSON("/data/donate.json", {}).then(function (d) {
      var groups = [], byName = {};
      (d.banks || []).forEach(function (b) {
        if (!b || !b.name || !b.number) return;
        var n = String(b.name).trim();
        if (!byName[n]) groups.push(byName[n] = { name: n, logo: "", accs: [] });
        if (!byName[n].logo && b.logo) byName[n].logo = String(b.logo).trim();
        byName[n].accs.push(b);
      });
      var box = document.getElementById("gf-banks");
      if (groups.length) box.innerHTML = groups.map(function (g) {
        var acc = g.accs.filter(function (b) { return /جنيه|EGP/i.test(b.currency || ""); })[0] || g.accs[0];
        var num = String(acc.number).trim(), cur = String(acc.currency || "").trim();
        var logo = g.logo && window.mersalPic ? window.mersalPic(g.logo, { alt: "" }) : "";
        return '<li><span class="gf-bk-logo' + (logo ? "" : " gf-bk-none") + '" aria-hidden="true">' + logo + "</span>" +
          '<span class="gf-bk-txt"><b>' + esc(g.name) + "</b><small>" + esc(cur) + "</small></span>" +
          copyBtn(num, "رقم حساب " + g.name + (cur ? " " + cur : "")) + '<code dir="ltr">' + esc(num) + "</code></li>";
      }).join("");
      else box.innerHTML = '<li class="gf-bk-empty"><a href="/donate.html#bank">شوف حسابات مرسال في البنوك</a></li>';
      var wallets = (d.wallets || []).filter(function (w) { return w && w.name && w.value; });
      document.getElementById("gf-wallet-numbers").innerHTML = wallets.length ? '<ul class="gf-banks" role="list">' + wallets.map(function (w) {
        return '<li><span class="gf-bk-txt"><b>' + esc(w.name) + "</b></span>" + copyBtn(String(w.value), w.name) + '<code dir="ltr">' + esc(w.value) + "</code></li>";
      }).join("") + "</ul>" : "";
    });
    document.querySelector(".gf-how").addEventListener("click", function (e) {
      var b = e.target.closest(".gf-copy");
      if (!b || !navigator.clipboard) return;
      navigator.clipboard.writeText(b.dataset.copy).then(function () {
        b.classList.add("done"); b.textContent = "تم النسخ"; if (window.mersalTap) window.mersalTap(8);
        clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove("done"); b.textContent = "نسخ"; }, 1600);
      }).catch(noop);
    });

    var rm = document.getElementById("gf-remind-form");
    if (rm) reminderForm(rm, "gf-rm");
  }

  window.MersalGift = {
    occasions: Object.keys(OCC).map(function (k) { return { value: k, label: OCC[k].label, sub: OCC[k].sub }; }),
    cardFor: cardFor,
    draw: function (canvas, opts) { return ready().then(function (a) { paint(canvas, clean(opts), a); return canvas; }); },
    blob: function (opts) { var c = document.createElement("canvas"); return this.draw(c, opts).then(toBlob); },
    remind: remind, ics: ics, googleUrl: googleUrl,
    afterDonation: afterDonation, summaryRow: summaryRow
  };
  initStepper();
  initPage();
})();
