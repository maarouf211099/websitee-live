// Mersal admin console. Talks to /api/admin/* (role "admin" via Static Web Apps auth).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");

  var toastT;
  function toast(msg, err) { var t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, err ? 6000 : 3500); }
  function api(path, opt) {
    opt = opt || {};
    return fetch("/api/admin/" + path, { method: opt.method || "GET", headers: opt.body ? { "Content-Type": "application/json" } : {}, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.message || ("HTTP " + r.status)); return d; }); });
  }
  function busy(btn, on) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.textContent; btn.textContent = on ? "جاري الحفظ…" : btn.dataset.t; }
  function published() { toast("تم الحفظ ✓ هيظهر على الموقع خلال دقيقة تقريباً"); }

  // ---------- auth ----------
  fetch("/.auth/me").then(function (r) { return r.json(); }).then(function (d) {
    var p = d && d.clientPrincipal;
    if (!p) { location.href = "/.auth/login/aad?post_login_redirect_uri=/admin/"; return; }
    $("#user").textContent = p.userDetails || "";
    if ((p.userRoles || []).indexOf("admin") < 0) { location.href = "/admin/denied.html"; return; }
    return api("me").then(function (me) {
      var s = $("#status");
      if (!me.github) { s.hidden = false; s.className = "status bad"; s.textContent = "الحفظ مش هيشتغل: GITHUB_TOKEN و GITHUB_REPO مش متظبطين في إعدادات Azure (شوف README)."; }
      $("#checks").innerHTML =
        '<li><span>الربط بـ GitHub (الحفظ والنشر)</span><b class="' + (me.github ? "ok" : "no") + '">' + (me.github ? "متصل" : "غير متصل") + "</b></li>" +
        '<li><span>تخزين التبرعات (DONATIONS_STORAGE)</span><b class="' + (me.donations ? "ok" : "no") + '">' + (me.donations ? "مفعّل" : "غير مفعّل") + "</b></li>" +
        '<li><span>بوابة بنك مصر (MPGS)</span><b class="' + (me.mpgs ? "ok" : "no") + '">' + (me.mpgs ? "متظبطة - " + esc(me.merchant) : "غير متظبطة") + "</b></li>";
      loadHome(); loadPages(); loadAlbums(); loadSettings();
    });
  }).catch(function (e) { toast("تعذّر الدخول: " + e.message, true); });

  // ---------- tabs ----------
  $$(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".tabs button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      $$(".panel").forEach(function (p) { p.hidden = p.id !== "tab-" + b.dataset.tab; });
      if (b.dataset.tab === "donations" && !$("#d-table tbody").children.length) loadDonations();
    });
  });

  // ---------- image upload (resized in the browser) ----------
  function resize(file, max, quality) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", quality || .82).split(",")[1]);
      };
      img.onerror = rej; img.src = url;
    });
  }
  function pick(multiple) {
    return new Promise(function (res) {
      var i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = !!multiple;
      i.onchange = function () { res(Array.prototype.slice.call(i.files)); }; i.click();
    });
  }
  // returns [{url, urlSm}] after committing the images
  function upload(files, maxBig, maxSm) {
    return Promise.all(files.map(function (f) {
      return Promise.all([resize(f, maxBig || 1600), maxSm ? resize(f, maxSm, .78) : null]).then(function (r) {
        var stem = f.name.replace(/\.[^.]+$/, "");
        var out = [{ name: stem + ".jpg", data: r[0] }];
        if (r[1]) out.push({ name: stem + "-sm.jpg", data: r[1] });
        return out;
      });
    })).then(function (groups) {
      var flat = [].concat.apply([], groups);
      return api("upload", { method: "POST", body: { files: flat } }).then(function (d) {
        var urls = d.urls, out = [], i = 0;
        groups.forEach(function (g) { out.push({ url: urls[i], urlSm: g.length > 1 ? urls[i + 1] : urls[i] }); i += g.length; });
        return out;
      });
    });
  }

  // ---------- home ----------
  var content = null;
  function loadHome() {
    api("data/content").then(function (c) { content = c; renderSlides(); renderCampaigns(); renderNumbers(); });
  }
  function renderSlides() {
    $("#slides").innerHTML = (content.slides || []).map(function (s, i) {
      return '<div class="item" data-i="' + i + '"><img class="thumb wide" src="' + esc(s.bannerSm || s.banner || "") + '" alt="">' +
        '<div class="fields"><div class="field"><label>الرابط عند الضغط</label><input data-k="link" value="' + esc(s.link || "/donate.html") + '"></div>' +
        '<div class="field"><label>وصف الصورة</label><input data-k="alt" value="' + esc(s.alt || "") + '"></div></div>' +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="img">رفع صورة</button><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function renderCampaigns() {
    $("#campaigns").innerHTML = (content.campaigns || []).map(function (c, i) {
      var opts = Object.keys(pagesIndex).map(function (id) { return '<option value="/p/' + id + '.html"' + (c.link === "/p/" + id + ".html" ? " selected" : "") + ">" + esc(pagesIndex[id].title) + "</option>"; }).join("");
      return '<div class="item" data-i="' + i + '"><img class="thumb" src="' + esc(c.imageSm || c.image || "") + '" alt="">' +
        '<div class="fields">' +
        '<div class="field full"><label>اسم الحملة</label><input data-k="title" value="' + esc(c.title) + '"></div>' +
        '<div class="field full"><label>وصف قصير</label><input data-k="text" value="' + esc(c.text || "") + '"></div>' +
        '<div class="field"><label>الوحدة (سهم/جرعة)</label><input data-k="unit" value="' + esc(c.unit || "سهم") + '"></div>' +
        '<div class="field"><label>سعر الوحدة (جنيه)</label><input data-k="unitPrice" type="number" value="' + esc(c.unitPrice || 0) + '"></div>' +
        '<div class="field"><label>الهدف</label><input data-k="goal" type="number" value="' + esc(c.goal || 0) + '"></div>' +
        '<div class="field"><label>تم توفير</label><input data-k="raised" type="number" value="' + esc(c.raised || 0) + '"></div>' +
        '<div class="field full"><label>صفحة المشروع</label><select data-k="link"><option value="/donate.html">— بدون صفحة —</option>' + opts + "</select></div>" +
        "</div>" +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="img">رفع صورة</button><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function renderNumbers() {
    $("#numbers").innerHTML = (content.numbers || []).map(function (n, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>الرقم</label><input data-k="value" type="number" value="' + esc(n.value) + '"></div>' +
        '<div class="field"><label>علامة قبل الرقم (+ مثلاً)</label><input data-k="prefix" value="' + esc(n.prefix || "") + '"></div>' +
        '<div class="field full"><label>الوصف</label><input data-k="label" value="' + esc(n.label) + '"></div>' +
        '<div class="field full"><label>رابط (اختياري)</label><input data-k="link" value="' + esc(n.link || "") + '"></div></div>' +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function collect(listSel, key, numeric) {
    var arr = content[key] || [];
    $$(listSel + " .item").forEach(function (it) {
      var o = arr[+it.dataset.i]; if (!o) return;
      $$("[data-k]", it).forEach(function (inp) { var v = inp.value; o[inp.dataset.k] = (numeric || []).indexOf(inp.dataset.k) > -1 ? Number(v) || 0 : v; });
      if (key === "campaigns") o.purpose = /^\/p\/(\d+)\.html$/.test(o.link || "") ? "p" + RegExp.$1 : "general";
    });
  }
  function listActions(listSel, key, render, imgOpts) {
    $(listSel).addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var it = b.closest(".item"), i = +it.dataset.i, arr = content[key];
      collect(listSel, key, ["unitPrice", "goal", "raised", "value"]);
      if (b.dataset.act === "del") { if (confirm("حذف العنصر ده؟")) { arr.splice(i, 1); render(); } }
      else if (b.dataset.act === "up" && i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); render(); }
      else if (b.dataset.act === "down" && i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); render(); }
      else if (b.dataset.act === "img") {
        pick(false).then(function (files) {
          if (!files.length) return; busy(b, true);
          return upload(files, imgOpts.big, imgOpts.sm).then(function (r) {
            if (key === "slides") { arr[i].banner = r[0].url; arr[i].bannerSm = r[0].urlSm; } else { arr[i].image = r[0].url; arr[i].imageSm = r[0].urlSm; }
            render(); toast("اترفعت الصورة، اضغط حفظ ونشر");
          });
        }).catch(function (err) { toast(err.message, true); busy(b, false); });
      }
    });
  }
  listActions("#slides", "slides", renderSlides, { big: 1920, sm: 1200 });
  listActions("#campaigns", "campaigns", renderCampaigns, { big: 900, sm: 600 });
  listActions("#numbers", "numbers", renderNumbers, {});
  $("#add-slide").onclick = function () { collect("#slides", "slides"); (content.slides = content.slides || []).push({ banner: "", bannerSm: "", link: "/donate.html", alt: "" }); renderSlides(); };
  $("#add-campaign").onclick = function () { collect("#campaigns", "campaigns", ["unitPrice", "goal", "raised"]); (content.campaigns = content.campaigns || []).push({ title: "حملة جديدة", text: "", image: "", imageSm: "", unit: "سهم", unitPrice: 0, goal: 0, raised: 0, link: "/donate.html", purpose: "general" }); renderCampaigns(); };
  $("#add-number").onclick = function () { collect("#numbers", "numbers", ["value"]); (content.numbers = content.numbers || []).push({ value: 0, prefix: "", label: "", link: "" }); renderNumbers(); };
  $("#save-home").onclick = function () {
    var b = this; collect("#slides", "slides"); collect("#campaigns", "campaigns", ["unitPrice", "goal", "raised"]); collect("#numbers", "numbers", ["value"]);
    content.slides = (content.slides || []).filter(function (s) { return s.banner; });
    busy(b, true);
    api("data/content", { method: "PUT", body: { data: content, message: "admin: home content" } }).then(published).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };

  // ---------- pages ----------
  var pagesIndex = {}, curPage = null, htmlMode = false;
  function loadPages() {
    api("data/pages").then(function (pg) {
      pagesIndex = pg; renderPageList(); if (content) renderCampaigns();
    });
  }
  function renderPageList() {
    var q = ($("#page-filter").value || "").trim();
    $("#pages").innerHTML = Object.keys(pagesIndex).filter(function (id) { return !q || pagesIndex[id].title.indexOf(q) > -1; })
      .map(function (id) { return '<li data-id="' + id + '"' + (curPage === id ? ' class="on"' : "") + ">" + esc(pagesIndex[id].title) + "</li>"; }).join("");
  }
  $("#page-filter").addEventListener("input", renderPageList);
  $("#pages").addEventListener("click", function (e) {
    var li = e.target.closest("li"); if (!li) return;
    curPage = li.dataset.id; renderPageList();
    api("page/" + curPage).then(function (p) {
      $("#editor").hidden = false; $("#pg-title").value = p.title; $("#pg-desc").value = p.desc; $("#pg-body").innerHTML = p.body; $("#pg-src").value = p.body;
      $("#pg-view").href = "/p/" + curPage + ".html"; if (htmlMode) toggleHtml();
      $("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function (e) { toast(e.message, true); });
  });
  $$(".toolbar [data-cmd]").forEach(function (b) { b.addEventListener("click", function () { $("#pg-body").focus(); document.execCommand(b.dataset.cmd, false, b.dataset.val || null); }); });
  $("#pg-link").onclick = function () { var u = prompt("الرابط:", "https://"); if (u) { $("#pg-body").focus(); document.execCommand("createLink", false, u); } };
  $("#pg-img").onclick = function () {
    var b = this; pick(false).then(function (files) { if (!files.length) return; busy(b, true); return upload(files, 1400).then(function (r) { $("#pg-body").focus(); document.execCommand("insertHTML", false, '<p><img src="' + r[0].url + '" alt="" loading="lazy"></p>'); }); })
      .catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };
  function toggleHtml() {
    htmlMode = !htmlMode;
    if (htmlMode) { $("#pg-src").value = $("#pg-body").innerHTML; } else { $("#pg-body").innerHTML = $("#pg-src").value; }
    $("#pg-body").hidden = htmlMode; $("#pg-src").hidden = !htmlMode; $("#pg-html").textContent = htmlMode ? "عرض عادي" : "HTML";
  }
  $("#pg-html").onclick = toggleHtml;
  $("#save-page").onclick = function () {
    var b = this; if (!curPage) return;
    var body = htmlMode ? $("#pg-src").value : $("#pg-body").innerHTML;
    busy(b, true);
    api("page/" + curPage, { method: "PUT", body: { title: $("#pg-title").value.trim(), desc: $("#pg-desc").value.trim(), body: body } })
      .then(function () { pagesIndex[curPage].title = $("#pg-title").value.trim(); renderPageList(); published(); })
      .catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };

  // ---------- albums ----------
  var albums = [];
  function loadAlbums() { api("data/albums").then(function (a) { albums = a; renderAlbums(); }).catch(function () { albums = []; renderAlbums(); }); }
  function renderAlbums() {
    $("#albums").innerHTML = albums.map(function (a, i) {
      return '<div class="item" data-i="' + i + '" style="grid-template-columns:1fr"><div class="fields">' +
        '<div class="field"><label>اسم الألبوم</label><input data-k="title" value="' + esc(a.title) + '"></div>' +
        '<div class="field"><label>التاريخ</label><input data-k="date" type="date" value="' + esc((a.date || "").slice(0, 10)) + '"></div></div>' +
        '<div class="photos">' + (a.photos || []).map(function (p, j) { return '<figure><img src="' + esc((a.thumbs || a.photos)[j] || p) + '" alt=""><button type="button" data-del="' + j + '" aria-label="حذف">×</button></figure>'; }).join("") + "</div>" +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="photos">+ إضافة صور</button><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف الألبوم</button></div></div>';
    }).join("");
  }
  function collectAlbums() { $$("#albums .item").forEach(function (it) { var a = albums[+it.dataset.i]; $$("[data-k]", it).forEach(function (inp) { a[inp.dataset.k] = inp.value; }); }); }
  $("#albums").addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]"), b = e.target.closest("[data-act]"); if (!del && !b) return;
    collectAlbums();
    var it = (del || b).closest(".item"), i = +it.dataset.i, a = albums[i];
    if (del) { a.photos.splice(+del.dataset.del, 1); if (a.thumbs) a.thumbs.splice(+del.dataset.del, 1); renderAlbums(); return; }
    if (b.dataset.act === "del") { if (confirm("حذف الألبوم كله؟")) { albums.splice(i, 1); renderAlbums(); } }
    else if (b.dataset.act === "up" && i > 0) { albums.splice(i - 1, 0, albums.splice(i, 1)[0]); renderAlbums(); }
    else if (b.dataset.act === "down" && i < albums.length - 1) { albums.splice(i + 1, 0, albums.splice(i, 1)[0]); renderAlbums(); }
    else if (b.dataset.act === "photos") {
      pick(true).then(function (files) {
        if (!files.length) return; busy(b, true); toast("جاري رفع " + files.length + " صورة…");
        return upload(files.slice(0, 20), 1600, 600).then(function (r) {
          a.photos = a.photos || []; a.thumbs = a.thumbs || a.photos.slice();
          r.forEach(function (x) { a.photos.push(x.url); a.thumbs.push(x.urlSm); });
          renderAlbums(); toast("اترفعت الصور، اضغط حفظ ونشر");
        });
      }).catch(function (err) { toast(err.message, true); busy(b, false); });
    }
  });
  $("#add-album").onclick = function () { collectAlbums(); albums.unshift({ title: "ألبوم جديد", date: new Date().toISOString().slice(0, 10), photos: [], thumbs: [] }); renderAlbums(); };
  $("#save-albums").onclick = function () {
    var b = this; collectAlbums(); busy(b, true);
    api("data/albums", { method: "PUT", body: { data: albums.filter(function (a) { return a.photos && a.photos.length; }), message: "admin: albums" } }).then(published).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };

  // ---------- donations ----------
  var rows = [];
  function loadDonations() {
    api("donations?from=" + ($("#d-from").value || "") + "&to=" + ($("#d-to").value || "")).then(function (d) {
      rows = d.rows || [];
      $("#d-note").textContent = d.enabled ? "" : "تخزين التبرعات غير مفعّل: ضيف DONATIONS_STORAGE (اتصال Storage Account) في إعدادات Azure. التبرعات اللي تمت بالبطاقة هتتسجل هنا تلقائياً بعد التفعيل.";
      var total = rows.reduce(function (s, r) { return s + (Number(r.amount) || 0); }, 0);
      $("#d-total").textContent = rows.length ? rows.length + " تبرع · " + fmt.format(total) + " جنيه" : (d.enabled ? "مفيش تبرعات في الفترة دي" : "");
      $("#d-table tbody").innerHTML = rows.map(function (r) {
        return "<tr><td>" + esc((r.paidAt || "").replace("T", " ").slice(0, 16)) + '</td><td class="num">' + fmt.format(r.amount) + " " + esc(r.currency) + "</td><td>" + esc(purposeName(r.purpose)) + "</td><td>" + esc(r.donorName) + '</td><td dir="ltr">' + esc(r.phone) + '</td><td dir="ltr">' + esc(r.email) + '</td><td dir="ltr">' + esc(r.orderId) + "</td></tr>";
      }).join("");
    }).catch(function (e) { toast(e.message, true); });
  }
  function purposeName(p) { var m = /^p(\d+)$/.exec(p || ""); if (m && pagesIndex[m[1]]) return pagesIndex[m[1]].title; return { general: "تبرع عام", zakat: "زكاة", sadaqa: "صدقة" }[p] || p || ""; }
  $("#d-load").onclick = loadDonations;
  $("#csv").onclick = function () {
    var head = ["التاريخ", "المبلغ", "العملة", "الجهة", "المتبرع", "الموبايل", "البريد", "رقم العملية", "رقم عملية البنك"];
    var lines = [head].concat(rows.map(function (r) { return [r.paidAt, r.amount, r.currency, purposeName(r.purpose), r.donorName, r.phone, r.email, r.orderId, r.txnId]; }))
      .map(function (l) { return l.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines], { type: "text/csv;charset=utf-8" })); a.download = "mersal-donations.csv"; a.click();
  };

  // ---------- settings ----------
  function loadSettings() { api("settings").then(function (s) { var r = $('#paymode input[value="' + s.payMode + '"]'); if (r) r.checked = true; }); }
  $("#save-settings").onclick = function () {
    var b = this, v = ($('#paymode input:checked') || {}).value; if (!v) return; busy(b, true);
    api("settings", { method: "PUT", body: { payMode: v } }).then(published).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };
})();
