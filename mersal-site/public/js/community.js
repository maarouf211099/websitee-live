// Mersal community: donor gifts. Unlocked on the device that donated (see recordDonation in donate.js).
(function () {
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  // Odometer like the home page numbers: each digit rolls to its value (transform only), the units digit first
  function odometer(el, value) {
    var str = fmt.format(Math.round(value)), total = str.replace(/\D/g, "").length, k = 0;
    el.setAttribute("role", "img"); el.setAttribute("aria-label", str); el.classList.add("odo");
    if (reduce) { el.textContent = str; return; }
    el.innerHTML = str.split("").map(function (ch) {
      if (!/\d/.test(ch)) return '<span class="od-sep">' + esc(ch) + "</span>";
      return '<span class="od" style="--d:' + ch + ';--i:' + (total - 1 - k++) + '"><span class="od-roll"><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></span></span>';
    }).join("");
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("od-go"); }); });
  }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (e) { return fallback; } }
  var donor = read("mersalDonor", {}), history = read("mersalDonations", []);
  var gate = document.getElementById("cm-gate"), main = document.getElementById("cm-main");
  if (!history.length) { gate.hidden = false; return; }
  main.hidden = false;

  var total = history.reduce(function (s, d) { return s + (Number(d.amount) || 0); }, 0);
  var first = history[0], last = history[history.length - 1];
  var name = (donor.name || "").trim();
  document.getElementById("cm-initial").textContent = name ? name.trim()[0] : "م";
  document.getElementById("cm-hello").textContent = name ? "شكراً يا " + name.split(" ")[0] : "شكراً لمساهمتك";
  document.getElementById("cm-sub").textContent = "عضو في مرسال كوميونيتي من " + new Date(first.date).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

  var badges = ["أول تبرع ✓"];
  if (history.length >= 3) badges.push("متبرع دائم");
  if (history.some(function (d) { return d.monthly; })) badges.push("متبرع شهري");
  if (total >= 5000) badges.push("داعم ذهبي");
  document.getElementById("cm-badges").innerHTML = badges.map(function (b) { return '<span class="cm-badge"><i></i>' + esc(b) + "</span>"; }).join("");
  document.getElementById("cm-stats").innerHTML =
    '<div class="cm-stat"><b>0</b><span>تبرع</span></div>' +
    '<div class="cm-stat"><b>0</b><span>جنيه ساهمت بيهم</span></div>' +
    '<div class="cm-stat"><b>0</b><span>سهم علاج تقريباً</span></div>';
  var statVals = [history.length, total, Math.max(1, Math.round(total / 100))];
  document.querySelectorAll("#cm-stats b").forEach(function (b, i) { odometer(b, statVals[i]); });
  document.getElementById("cm-history").innerHTML = history.slice().reverse().map(function (d) {
    return "<li><span>" + esc(new Date(d.date).toLocaleDateString("ar-EG")) + (d.purposeTitle ? " · " + esc(d.purposeTitle) : "") + (d.demo ? ' <span class="demo">تجريبي</span>' : "") + "</span><b>" + fmt.format(d.amount) + " ج</b></li>";
  }).join("");

  var ICONS = {
    certificate: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6M14 18l2 3 2-3"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    impact: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    group: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-4-4.9"/></svg>',
    volunteer: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6C19 16.6 12 21 12 21z"/></svg>',
    monthly: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
  };

  fetch("/data/community.json").then(function (r) { return r.json(); }).then(function (cfg) {
    document.getElementById("cm-intro").textContent = cfg.intro || "";
    var box = document.getElementById("cm-gifts");
    box.innerHTML = (cfg.gifts || []).map(function (g, i) {
      var soon = (g.action === "whatsapp" && !cfg.whatsappGroup) || (g.action === "events" && !cfg.eventsLink);
      var href = g.action === "link" ? g.link : g.action === "whatsapp" ? cfg.whatsappGroup : g.action === "events" ? cfg.eventsLink : g.action === "impact" ? (last.purposeLink || "/#campaigns-sec") : null;
      var tag = href ? "a" : "button";
      return "<" + tag + ' class="cm-gift' + (soon ? " soon" : "") + '" data-i="' + i + '"' + (href ? ' href="' + esc(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "") : ' type="button"') + (soon ? " disabled" : "") + ">" +
        '<span class="ic">' + (ICONS[g.icon] || ICONS.certificate) + "</span><span><b>" + esc(g.title) + "</b><span>" + esc(soon ? "قريباً" : g.text) + "</span></span><span class=\"go\" aria-hidden=\"true\">←</span></" + tag + ">";
    }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button.cm-gift"); if (!b) return;
      var g = cfg.gifts[+b.dataset.i];
      if (g.action === "certificate") openCertificate(false);
      else if (g.action === "share") openCertificate(true);
    });
  }).catch(function () {});

  // ---- thank-you certificate / share card drawn on a canvas ----
  var modal = document.getElementById("cm-modal"), canvas = document.getElementById("cm-canvas"), ctx = canvas.getContext("2d");
  function rounded(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function draw(shareCard) {
    var W = canvas.width, H = canvas.height;
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#008b8c"); g.addColorStop(1, "#004646");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // soft rings
    ctx.globalAlpha = .08; ctx.fillStyle = "#fff";
    for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(W * .85, H * .12, 160 + i * 110, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // card
    ctx.fillStyle = "rgba(255,255,255,.96)"; rounded(70, 230, W - 140, H - 370, 48); ctx.fill();
    ctx.textAlign = "center"; ctx.direction = "rtl";
    ctx.fillStyle = "#005959"; ctx.font = "800 44px Cairo, sans-serif"; ctx.fillText("مؤسسة مرسال للأعمال الخيرية والتنموية", W / 2, 330);
    ctx.fillStyle = "#e9ad0c"; ctx.font = "800 70px Cairo, sans-serif"; ctx.fillText(shareCard ? "#ابعت_فرحة" : "شهادة شكر وتقدير", W / 2, 460);
    ctx.fillStyle = "#1f2a2a"; ctx.font = "600 40px Cairo, sans-serif";
    ctx.fillText(shareCard ? "أنا ساهمت في علاج مريض مع مرسال" : "تتقدم مؤسسة مرسال بخالص الشكر إلى", W / 2, 570);
    ctx.fillStyle = "#005959"; ctx.font = "800 72px Cairo, sans-serif"; ctx.fillText(name || "متبرع كريم", W / 2, 690);
    ctx.fillStyle = "#1f2a2a"; ctx.font = "600 38px Cairo, sans-serif";
    ctx.fillText(shareCard ? "وانت كمان تقدر تبعت فرحة لمريض محتاج" : "لمساهمته بمبلغ " + fmt.format(total) + " جنيه في علاج مرضى مرسال", W / 2, 790);
    ctx.fillText(shareCard ? "تبرع من موقع مرسال أو اتصل 19340" : "كل جنيه وصل لمستحقيه، وكل تبرع رسم ابتسامة", W / 2, 860);
    // amount pill
    ctx.fillStyle = "#fec830"; rounded(W / 2 - 230, 940, 460, 110, 55); ctx.fill();
    ctx.fillStyle = "#005959"; ctx.font = "800 54px 'Titillium Web', Cairo, sans-serif"; ctx.direction = "ltr";
    ctx.fillText(shareCard ? "19340" : fmt.format(total) + " EGP", W / 2, 1015);
    ctx.direction = "rtl"; ctx.fillStyle = "#5f6b6b"; ctx.font = "600 30px Cairo, sans-serif";
    ctx.fillText(new Date(last.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) + (last.orderId && !last.demo ? "  ·  " + last.orderId : ""), W / 2, 1130);
    ctx.fillStyle = "#fff"; ctx.font = "700 34px Cairo, sans-serif"; ctx.fillText("mersal-ngo.org  ·  الخط الساخن 19340", W / 2, H - 70);
    var logo = new Image(); logo.onload = function () { ctx.fillStyle = "#fff"; rounded(W / 2 - 120, 60, 240, 150, 28); ctx.fill(); ctx.drawImage(logo, W / 2 - 100, 70, 200, 118); }; logo.src = "/img/brand-logo.png";
  }
  function openCertificate(shareCard) {
    document.getElementById("cm-modal-title").textContent = shareCard ? "كارت ابعت فرحة" : "شهادة شكر";
    modal.classList.remove("closing"); modal.hidden = false; document.body.style.overflow = "hidden";
    (document.fonts && document.fonts.load ? document.fonts.load("800 40px Cairo") : Promise.resolve()).then(function () { draw(shareCard); setTimeout(function () { draw(shareCard); }, 400); });
    var dl = document.getElementById("cm-download");
    setTimeout(function () { try { dl.href = canvas.toDataURL("image/png"); } catch (e) {} }, 600);
  }
  function closeModal() {
    if (modal.hidden || modal.classList.contains("closing")) return;
    document.body.style.overflow = "";
    if (reduce) { modal.hidden = true; return; }
    modal.classList.add("closing"); // css: shrinks away, then hidden
    setTimeout(function () { modal.hidden = true; modal.classList.remove("closing"); }, 190);
  }
  document.getElementById("cm-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  document.getElementById("cm-share").addEventListener("click", function () {
    canvas.toBlob(function (blob) {
      var file = new File([blob], "mersal-thank-you.png", { type: "image/png" });
      var data = { files: [file], title: "مؤسسة مرسال", text: "ساهمت مع مرسال في علاج مريض. ابعت فرحة انت كمان: https://www.mersal-ngo.org" };
      if (navigator.canShare && navigator.canShare(data)) navigator.share(data).catch(function () {});
      else if (navigator.share) navigator.share({ title: data.title, text: data.text, url: "https://www.mersal-ngo.org" }).catch(function () {});
      else document.getElementById("cm-download").click();
    }, "image/png");
  });
})();
