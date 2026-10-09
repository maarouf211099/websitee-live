// Mersal admin console. Talks to /api/console/* (username + password, cookie session).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  var fmt = new Intl.NumberFormat("ar-EG-u-nu-latn");

  var toastT;
  function toast(msg, err) { var t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, err ? 6000 : 3500); }
  // Every GET of a file returns its revision (X-Mersal-Sha); a PUT to the same path sends it back (X-Mersal-Base) so the
  // server refuses (409) to overwrite a file someone else saved in between, and the PUT's answer carries the new revision.
  var revs = {};
  function api(path, opt) {
    opt = opt || {};
    var method = opt.method || "GET", headers = opt.body ? { "Content-Type": "application/json" } : {};
    if (method === "PUT" && revs[path]) headers["X-Mersal-Base"] = revs[path];
    return fetch("/api/console/" + path, { method: method, headers: headers, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) {
        var rev = r.headers.get("X-Mersal-Sha"); if (rev && r.ok) revs[path] = rev;
        return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) { var err = new Error(d.message || ("HTTP " + r.status)); err.status = r.status; err.data = d; throw err; } return d; });
      });
  }
  // CSV cell: quoted, and a text starting with = + - @ (or a tab / CR) gets a leading ' so Excel / Sheets show it as text
  // instead of running it as a formula (names, notes and cities come from the public forms). Plain numbers stay numbers.
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    if (!/^-?\d+(\.\d+)?$/.test(s) && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function downloadCsv(rows, name) {
    var text = rows.map(function (l) { return l.map(csvCell).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([String.fromCharCode(65279) + text], { type: "text/csv;charset=utf-8" })); a.download = name; a.click();
  }
  // "2026-10-09T22:30:00Z" -> "2026-10-10 01:30" (Egypt time, like the date filters)
  var cairoFmt = (function () { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }); } catch (e) { return null; } })();
  function cairoTime(iso) {
    var d = new Date(iso || ""); if (!iso || isNaN(d)) return String(iso || "").replace("T", " ").slice(0, 16);
    if (!cairoFmt) return String(iso).replace("T", " ").slice(0, 16);
    var p = {}; cairoFmt.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return p.year + "-" + p.month + "-" + p.day + " " + p.hour + ":" + p.minute;
  }
  function cairoToday() { return cairoTime(new Date().toISOString()).slice(0, 10); }
  function busy(btn, on) { btn.disabled = on; btn.dataset.t = btn.dataset.t || btn.textContent; btn.textContent = on ? "جاري الحفظ…" : btn.dataset.t; }
  function published() { toast("تم الحفظ ✓ هيظهر على الموقع خلال دقيقة تقريباً"); }

  // ---------- auth: cookie session from /api/console/login ----------
  var booted = false;
  function showLogin(on) {
    $("#login").hidden = !on; $("#shell").hidden = on;
    if (!on) return;
    api("status").then(function (st) {
      $("#l-user").value = $("#l-user").value || st.user || "admin";
      $("#l-code-box").hidden = !st.setup;
      $("#l-pass-label").textContent = st.setup ? "اختار كلمة سر (8 حروف على الأقل)" : "كلمة السر";
      $("#l-pass").autocomplete = st.setup ? "new-password" : "current-password";
      $("#login-hint").textContent = st.setup ? (st.setupHint === "env-code" ? "أول دخول: اكتب كود التفعيل (قيمة ADMIN_SETUP_CODE في Azure) واختار كلمة السر." : st.setupHint === "token-tail" ? "أول دخول: كود التفعيل هو آخر 8 حروف من GITHUB_TOKEN اللي حطيته في Azure. اختار كلمة السر اللي هتدخل بيها بعد كده." : "أول دخول: ضيف GITHUB_TOKEN في إعدادات Azure الأول، وبعدها كود التفعيل هو آخر 8 حروف منه.") : (st.github ? "ادخل باسم المستخدم وكلمة السر" : "تنبيه: GITHUB_TOKEN مش متظبط في Azure، اللوحة مش هتقدر تحفظ.");
      // Azure settings the API can see (names only): shows a typo or a setting saved in the wrong place
      var box = $("#l-settings");
      if (box && st.settings && !st.github) {
        var rows = ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH"].map(function (k) {
          var v = st.settings[k] || "missing", ok = v === "ok" || v === "default";
          return "<li" + (ok ? ' class="ok"' : "") + "><code>" + k + "</code> " + (v === "ok" ? "موجود ✓" : v === "default" ? "مش لازم (القيمة الافتراضية شغالة) ✓" : v === "empty" ? "موجود بس فاضي" : v === "missing" ? "مش موجود" : "اتكتب غلط: " + esc(v.replace(/^found as /, ""))) + "</li>";
        });
        box.innerHTML = "<p>اللي الـAPI شايفه من إعدادات Azure دلوقتي:</p><ul>" + rows.join("") + "</ul><p>المكان: Static Web App ← Settings ← Environment variables ← Production ← Add ← Save، واستنى دقيقة وحدّث الصفحة.</p>";
        box.hidden = false;
      } else if (box) box.hidden = true;
    }).catch(function () {});
    setTimeout(function () { ($("#l-pass").value ? $("#l-pass") : $("#l-user")).focus(); }, 50);
  }
  function start() {
    api("me").then(function (me) {
      showLogin(false);
      $("#user").textContent = me.user || "";
      var s = $("#status");
      if (!me.github) { s.hidden = false; s.className = "status bad"; s.textContent = "الحفظ مش هيشتغل: GITHUB_TOKEN و GITHUB_REPO مش متظبطين في إعدادات Azure (شوف README)."; }
      $("#checks").innerHTML =
        '<li><span>الربط بـ GitHub (الحفظ والنشر)</span><b class="' + (me.github ? "ok" : "no") + '">' + (me.github ? "متصل" : "غير متصل") + "</b></li>" +
        '<li><span>تخزين التبرعات والطلبات (DONATIONS_STORAGE)</span><b class="' + (me.donations ? "ok" : "no") + '">' + (me.donations ? "مفعّل" : "غير مفعّل - الطلبات مش بتتحفظ") + "</b></li>" +
        '<li><span>بوابة بنك مصر (MPGS)</span><b class="' + (me.mpgs ? "ok" : "no") + '">' + (me.mpgs ? "متظبطة - " + esc(me.merchant) : "غير متظبطة") + "</b></li>" +
        // Paymob: configured, or the names of the Azure settings still missing (never values)
        '<li><span>بوابة Paymob</span><b class="' + (me.paymob ? "ok" : "no") + '">' + (me.paymob ? "متظبطة" + (me.paymobMode ? " - " + (me.paymobMode === "live" ? "حساب حقيقي" : "حساب تجريبي") : "") : "غير متظبطة" + (me.paymobMissing && me.paymobMissing.length ? " - ناقص: " + me.paymobMissing.map(esc).join("، ") : "")) + "</b></li>" +
        '<li id="chk-provider"><span>بوابة الدفع الشغالة</span><b class="ok">—</b></li>' +
        '<li><span>كلمة سر اللوحة</span><b class="ok">' + ({ env: "من إعدادات Azure", saved: "متظبطة من اللوحة", aad: "حساب مايكروسوفت" }[me.password] || "—") + "</b></li>";
      if (lastPay) showProvider(lastPay); // the list was just rebuilt
      $("#pw-user").textContent = me.user || "admin";
      if (me.password === "env" || me.password === "aad") { $("#pw-form").hidden = true; $("#pw-hint").textContent = me.password === "env" ? "كلمة السر متظبطة من إعدادات Azure (ADMIN_PASSWORD)؛ غيّرها من هناك." : "داخل بحساب مايكروسوفت."; }
      if (!booted) { booted = true; loadHome(); loadPages(); loadAlbums(); loadSettings(); keepAlive(); }
    }).catch(function (e) {
      if (e.status === 401) showLogin(true); else toast("تعذّر الاتصال: " + e.message, true);
    });
  }
  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("#login-btn"), err = $("#login-err"); err.hidden = true; busy(b, true); b.textContent = "جاري الدخول…";
    api("login", { method: "POST", body: { user: $("#l-user").value.trim(), password: $("#l-pass").value, code: $("#l-code").value.trim() } })
      .then(function () { $("#l-pass").value = ""; $("#l-code").value = ""; start(); })
      .catch(function (x) { err.textContent = x.message; err.hidden = false; })
      .then(function () { busy(b, false); });
  });
  // The session cookie lives 4 hours and GET /me renews it: while the console is open (and visible) it stays signed in,
  // up to the server's 12-hour cap. A 401 here means the session ended (password changed, signed out everywhere).
  function keepAlive() {
    setInterval(function () {
      if (document.visibilityState !== "visible" || $("#shell").hidden) return;
      api("me").catch(function (e) { if (e.status === 401) { toast("الجلسة انتهت، ادخل تاني", true); showLogin(true); } });
    }, 10 * 60e3);
  }
  $("#logout").addEventListener("click", function (e) { e.preventDefault(); api("logout", { method: "POST" }).then(function () { location.reload(); }); });
  var logoutAll = $("#logout-all");
  if (logoutAll) logoutAll.addEventListener("click", function () {
    if (!confirm("هيخرج كل الأجهزة اللي داخلة على اللوحة (وإنت كمان). متأكد؟")) return;
    busy(logoutAll, true);
    api("logout", { method: "POST", body: { everywhere: true } }).then(function () { location.reload(); }).catch(function (x) { toast(x.message, true); busy(logoutAll, false); });
  });
  $("#pw-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#pw-new").value !== $("#pw-new2").value) { toast("كلمة السر الجديدة مش متطابقة", true); return; }
    var b = e.target.querySelector("button"); busy(b, true);
    api("password", { method: "POST", body: { current: $("#pw-cur").value, next: $("#pw-new").value } })
      .then(function () { toast("اتغيّرت كلمة السر ✓"); e.target.reset(); start(); })
      .catch(function (x) { toast(x.message, true); }).then(function () { busy(b, false); });
  });
  start();

  // ---------- tabs ----------
  // Extra tabs live in /admin/tabs/*.js and register an init function: MersalAdmin.register("menu", fn)
  var tabInits = {};
  $$(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".tabs button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      $$(".panel").forEach(function (p) { p.hidden = p.id !== "tab-" + b.dataset.tab; });
      if (b.dataset.tab === "donations" && !$("#d-table tbody").children.length) loadDonations();
      var init = tabInits[b.dataset.tab];
      if (init && !init.done) { init.done = true; try { init(); } catch (e) { toast(e.message, true); } }
      location.hash = b.dataset.tab;
    });
  });

  // ---------- image upload (resized in the browser) ----------
  // cropLeft (0-1): keep only that fraction of the width, from the left - the photo half of a banner for the phone hero.
  // That crop is the one picture allowed to grow (a 1920 banner's photo half is 883px; the phone card shows it at
  // ~2.6-3x device pixels, so it is written at 1800px: the canvas's "high" smoothing beats the browser's live upscale).
  function resize(file, max, quality, cropLeft) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        if (cropLeft && img.width / img.height < 2.2) cropLeft = 0;   // not a wide banner: keep the whole picture for the phone card
        var sw = cropLeft ? Math.round(img.width * cropLeft) : img.width, sh = img.height;
        var k = max / Math.max(sw, sh); if (!cropLeft) k = Math.min(1, k);
        var w = Math.round(sw * k), h = Math.round(sh * k);
        var c = document.createElement("canvas"), ctx = c.getContext("2d"); c.width = w; c.height = h;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, w, h);
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
  function upload(files, maxBig, maxSm, mobileCrop, qualityBig) {
    return Promise.all(files.map(function (f) {
      return Promise.all([resize(f, maxBig || 1600, qualityBig), maxSm ? resize(f, maxSm, .78) : null, mobileCrop ? resize(f, 1800, .85, mobileCrop) : null]).then(function (r) {
        var stem = f.name.replace(/\.[^.]+$/, "");
        var out = [{ name: stem + ".jpg", data: r[0] }];
        if (r[1]) out.push({ name: stem + "-sm.jpg", data: r[1] });
        if (r[2]) out.push({ name: stem + "-m.jpg", data: r[2] });
        return out;
      });
    })).then(function (groups) {
      var flat = [].concat.apply([], groups);
      return api("upload", { method: "POST", body: { files: flat } }).then(function (d) {
        var urls = d.urls, out = [], i = 0;
        groups.forEach(function (g) { out.push({ url: urls[i], urlSm: g.length > 1 ? urls[i + 1] : urls[i], urlM: g.length > 2 ? urls[i + 2] : null }); i += g.length; });
        return out;
      });
    });
  }

  // ---------- home ----------
  var content = null;
  function loadHome() {
    homeReady();
    api("data/content").then(function (c) { content = c; renderSlides(); renderCampaigns(); renderProjects(); renderNumbers(); homeReady(); })
      .catch(function (e) { toast("تعذّر تحميل الرئيسية: " + e.message, true); });
  }
  function renderSlides() {
    $("#slides").innerHTML = (content.slides || []).map(function (s, i) {
      return '<div class="item" data-i="' + i + '"><div class="thumbs"><img class="thumb wide" src="' + esc(s.bannerSm || s.banner || "") + '" alt="">' +
        (s.mobile ? '<img class="thumb" src="' + esc(s.mobile) + '" alt="" title="صورة الموبايل">' : '<span class="thumb empty">الموبايل: جزء الصورة</span>') + '</div>' +
        '<div class="fields"><div class="field"><label>سطر صغير فوق العنوان (اختياري)</label><input data-k="kicker" value="' + esc(s.kicker || "") + '"></div>' +
        '<div class="field"><label>العنوان (بيظهر على الموبايل)</label><input data-k="title" value="' + esc(s.title || "") + '"></div>' +
        '<div class="field"><label>سطر تحت العنوان</label><input data-k="text" value="' + esc(s.text || "") + '"></div>' +
        '<div class="field"><label>نص الزرار</label><input data-k="button" value="' + esc(s.button || "تبرع الآن") + '"></div>' +
        '<div class="field"><label>الرابط عند الضغط</label><input data-k="link" dir="ltr" value="' + esc(s.link || "/donate.html") + '"></div>' +
        '<div class="field"><label>مكان الصورة على الموبايل</label><input data-k="focus" dir="ltr" placeholder="مثال: 40% 50%" value="' + esc(s.focus || "50% 50%") + '"></div>' +
        '<div class="field"><label>وصف الصورة</label><input data-k="alt" value="' + esc(s.alt || "") + '"></div></div>' +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="img">رفع صورة</button><button class="btn btn-ghost btn-sm" data-act="mimg" title="صورة أعلى جودة للموبايل (عرض 1800px أو أكتر، أفضل 4:5 طولي)">صورة الموبايل</button>' + (s.mobile ? '<button class="btn btn-ghost btn-sm" data-act="mdel">إلغاء صورة الموبايل</button>' : "") + '<button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function renderCampaigns() {
    $("#campaigns").innerHTML = (content.campaigns || []).map(function (c, i) {
      // like the projects: a link that is not in the pages list (pages.json not loaded yet, or failed) stays selected as is
      var link = c.link || "/donate.html", known = link === "/donate.html";
      var opts = Object.keys(pagesIndex).map(function (id) { var h = "/p/" + id + ".html"; if (h === link) known = true; return '<option value="' + h + '"' + (link === h ? " selected" : "") + ">" + esc(pagesIndex[id].title) + "</option>"; }).join("") +
        (known ? "" : '<option value="' + esc(link) + '" selected>' + esc(link) + "</option>");
      return '<div class="item" data-i="' + i + '"><img class="thumb" src="' + esc(c.imageSm || c.image || "") + '" alt="">' +
        '<div class="fields">' +
        '<div class="field full"><label>اسم الحملة</label><input data-k="title" value="' + esc(c.title) + '"></div>' +
        '<div class="field full"><label>وصف قصير</label><input data-k="text" value="' + esc(c.text || "") + '"></div>' +
        '<div class="field full"><label>أثر التبرع في سطر (بيظهر في الكارت)</label><input data-k="impact" value="' + esc(c.impact || "") + '"></div>' +
        '<div class="field"><label>عدد المتبرعين (اختياري)</label><input data-k="donors" type="number" value="' + esc(c.donors || "") + '"></div>' +
        '<div class="field"><label>آخر موعد (اختياري)</label><input data-k="deadline" type="date" value="' + esc(c.deadline || "") + '"></div>' +
        '<div class="field"><label>الوحدة (سهم/جرعة)</label><input data-k="unit" value="' + esc(c.unit || "سهم") + '"></div>' +
        '<div class="field"><label>سعر الوحدة (جنيه)</label><input data-k="unitPrice" type="number" value="' + esc(c.unitPrice || 0) + '"></div>' +
        '<div class="field"><label>الهدف</label><input data-k="goal" type="number" value="' + esc(c.goal || 0) + '"></div>' +
        '<div class="field"><label>تم توفير</label><input data-k="raised" type="number" value="' + esc(c.raised || 0) + '"></div>' +
        '<div class="field full"><label>صفحة المشروع</label><select data-k="link"><option value="/donate.html">— بدون صفحة —</option>' + opts + "</select></div>" +
        "</div>" +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="img">رفع صورة</button><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  // projects carousel on the home page (content.json "projects"): same card shape as the campaigns, without the figures
  function renderProjects() {
    $("#projects").innerHTML = (content.projects || []).map(function (c, i) {
      var link = c.link || "/donate.html", known = link === "/donate.html";
      var opts = Object.keys(pagesIndex).map(function (id) { var h = "/p/" + id + ".html"; if (h === link) known = true; return '<option value="' + h + '"' + (link === h ? " selected" : "") + ">" + esc(pagesIndex[id].title) + "</option>"; }).join("");
      return '<div class="item" data-i="' + i + '"><img class="thumb" src="' + esc(c.imageSm || c.image || "") + '" alt="">' +
        '<div class="fields">' +
        '<div class="field full"><label>اسم المشروع</label><input data-k="title" value="' + esc(c.title || "") + '"></div>' +
        '<div class="field full"><label>وصف قصير (سطرين)</label><input data-k="text" value="' + esc(c.text || "") + '"></div>' +
        '<div class="field"><label>صفحة المشروع</label><select data-k="link"><option value="/donate.html">— صفحة التبرع —</option>' + opts + (known ? "" : '<option value="' + esc(link) + '" selected>' + esc(link) + "</option>") + "</select></div>" +
        '<div class="field"><label>نص الزرار (اختياري)</label><input data-k="button" value="' + esc(c.button || "") + '" placeholder="اعرف أكثر"></div>' +
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
        '<div class="field full"><label>رابط (اختياري)</label><input data-k="link" dir="ltr" value="' + esc(n.link || "") + '"></div></div>' +
        '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-act="up">▲</button><button class="btn btn-ghost btn-sm" data-act="down">▼</button><button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  function collect(listSel, key, numeric) {
    var arr = content[key] || [];
    $$(listSel + " .item").forEach(function (it) {
      var o = arr[+it.dataset.i]; if (!o) return;
      var oldLink = o.link || "/donate.html";
      $$("[data-k]", it).forEach(function (inp) { var v = inp.value; o[inp.dataset.k] = (numeric || []).indexOf(inp.dataset.k) > -1 ? Number(v) || 0 : v; });
      // the donation purpose follows the page only when the editor changed the page (an unchanged link keeps its purpose)
      if (key === "campaigns" && ((o.link || "/donate.html") !== oldLink || !o.purpose)) { var m = /^\/p\/(\d+)\.html$/.exec(o.link || ""); o.purpose = m ? "p" + m[1] : "general"; }
    });
  }
  function listActions(listSel, key, render, imgOpts) {
    $(listSel).addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var it = b.closest(".item"), i = +it.dataset.i, arr = content[key];
      collect(listSel, key, ["unitPrice", "goal", "raised", "donors", "value"]);
      if (b.dataset.act === "del") { if (confirm("حذف العنصر ده؟")) { arr.splice(i, 1); render(); } }
      else if (b.dataset.act === "up" && i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); render(); }
      else if (b.dataset.act === "down" && i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); render(); }
      else if (b.dataset.act === "mdel") { arr[i].mobile = ""; render(); }
      else if (b.dataset.act === "mimg") {
        // a dedicated phone photo (the hero card on phones is a tall 4:5 story card): 1800px wide so it is
        // 2x on a 3x phone (the card is ~1100 device px wide); never upscaled, so upload a big original
        pick(false).then(function (files) {
          if (!files.length) return; busy(b, true);
          return upload(files, 1800, 0, 0, .85).then(function (r) { arr[i].mobile = r[0].url; render(); toast("اترفعت صورة الموبايل، اضغط حفظ ونشر"); });
        }).catch(function (err) { toast(err.message, true); busy(b, false); });
      }
      else if (b.dataset.act === "img") {
        pick(false).then(function (files) {
          if (!files.length) return; busy(b, true);
          return upload(files, imgOpts.big, imgOpts.sm, imgOpts.mobile).then(function (r) {
            if (key === "slides") { arr[i].banner = r[0].url; arr[i].bannerSm = r[0].urlSm; arr[i].mobile = r[0].urlM || ""; } else { arr[i].image = r[0].url; arr[i].imageSm = r[0].urlSm; }
            render(); toast("اترفعت الصورة، اضغط حفظ ونشر");
          });
        }).catch(function (err) { toast(err.message, true); busy(b, false); });
      }
    });
  }
  listActions("#slides", "slides", renderSlides, { big: 1920, sm: 1200, mobile: .46 });
  listActions("#campaigns", "campaigns", renderCampaigns, { big: 900, sm: 600 });
  listActions("#projects", "projects", renderProjects, { big: 900, sm: 600 });
  listActions("#numbers", "numbers", renderNumbers, {});
  $("#add-slide").onclick = function () { collect("#slides", "slides"); (content.slides = content.slides || []).push({ banner: "", bannerSm: "", kicker: "", title: "", text: "", button: "تبرع الآن", link: "/donate.html", focus: "50% 50%", alt: "" }); renderSlides(); };
  $("#add-campaign").onclick = function () { collect("#campaigns", "campaigns", ["unitPrice", "goal", "raised", "donors"]); (content.campaigns = content.campaigns || []).push({ title: "حملة جديدة", text: "", image: "", imageSm: "", unit: "سهم", unitPrice: 0, goal: 0, raised: 0, link: "/donate.html", purpose: "general" }); renderCampaigns(); };
  $("#add-project").onclick = function () { collect("#projects", "projects"); (content.projects = content.projects || []).push({ title: "مشروع جديد", text: "", image: "", imageSm: "", link: "/donate.html", button: "" }); renderProjects(); };
  $("#add-number").onclick = function () { collect("#numbers", "numbers", ["value"]); (content.numbers = content.numbers || []).push({ value: 0, prefix: "", label: "", link: "" }); renderNumbers(); };
  // "حفظ ونشر" waits for the pages list (campaign / project links are picked from it); if it failed, a visible retry
  // shows and saving is allowed again (links that are not in the list are kept as they are).
  function homeReady() {
    var b = $("#save-home"), box = $("#home-pages-status");
    b.disabled = !content || pagesState === "loading";
    b.title = pagesState === "loading" ? "استنى لحد ما قائمة الصفحات تحمّل" : "";
    if (box) box.hidden = pagesState !== "error";
  }
  $("#save-home").onclick = function () {
    if (!content || pagesState === "loading") return;
    var b = this; collect("#slides", "slides"); collect("#campaigns", "campaigns", ["unitPrice", "goal", "raised", "donors"]); collect("#projects", "projects"); collect("#numbers", "numbers", ["value"]);
    content.slides = (content.slides || []).filter(function (s) { return s.banner; });
    content.projects = (content.projects || []).filter(function (p) { return p.title; });
    busy(b, true);
    api("data/content", { method: "PUT", body: { data: content, message: "admin: home content" } }).then(published).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); homeReady(); });
  };

  // ---------- pages ----------
  // The fixed pages (public/<id>.html) are edited through the same endpoint as the imported /p/<id>.html ones
  // ("عن مرسال" is the imported page /p/3.html, listed with the content pages)
  var STATIC_PAGES = { contact: "تواصل معنا", afia: "كارت عافية", zakat: "حاسبة الزكاة" };
  var pagesIndex = {}, curPage = null, htmlMode = false, pagesState = "loading";
  function loadPages() {
    pagesState = "loading"; homeReady();
    api("data/pages").then(function (pg) {
      // keep what the editor already typed in the campaign / project rows before they are drawn again
      if (content) { collect("#campaigns", "campaigns", ["unitPrice", "goal", "raised", "donors"]); collect("#projects", "projects"); }
      pagesIndex = pg || {}; pagesState = "ok"; renderPageList(); if (content) { renderCampaigns(); renderProjects(); }
    }).catch(function () { pagesState = "error"; renderPageList(); })
      .then(homeReady);
  }
  if ($("#home-pages-retry")) $("#home-pages-retry").addEventListener("click", loadPages);
  function renderPageList() {
    var q = ($("#page-filter").value || "").trim();
    var li = function (id, title) { return '<li data-id="' + id + '"' + (curPage === id ? ' class="on"' : "") + ">" + esc(title) + "</li>"; };
    var fixed = Object.keys(STATIC_PAGES).filter(function (id) { return !q || STATIC_PAGES[id].indexOf(q) > -1; }).map(function (id) { return li(id, STATIC_PAGES[id]); });
    var imported = Object.keys(pagesIndex).filter(function (id) { return !q || pagesIndex[id].title.indexOf(q) > -1; }).map(function (id) { return li(id, pagesIndex[id].title); });
    $("#pages").innerHTML = (fixed.length ? '<li class="group">صفحات ثابتة</li>' + fixed.join("") : "") + (imported.length ? '<li class="group">صفحات المحتوى</li>' + imported.join("") : "");
  }
  $("#page-filter").addEventListener("input", renderPageList);
  $("#pages").addEventListener("click", function (e) {
    var li = e.target.closest("li[data-id]"); if (!li) return;
    curPage = li.dataset.id; renderPageList();
    api("page/" + curPage).then(function (p) {
      $("#editor").hidden = false; $("#pg-title").value = p.title; $("#pg-desc").value = p.desc; $("#pg-body").innerHTML = p.body; $("#pg-src").value = p.body;
      $("#pg-view").href = p.url || (STATIC_PAGES[curPage] ? "/" + curPage + ".html" : "/p/" + curPage + ".html"); if (htmlMode) toggleHtml();
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
      .then(function () { var t = $("#pg-title").value.trim(); if (pagesIndex[curPage]) pagesIndex[curPage].title = t; else if (STATIC_PAGES[curPage]) STATIC_PAGES[curPage] = t; renderPageList(); published(); })
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
        return '<tr><td dir="ltr">' + esc(cairoTime(r.paidAt)) + '</td><td class="num">' + fmt.format(r.amount) + " " + esc(r.currency) + "</td><td>" + esc(purposeName(r.purpose)) + "</td><td>" + esc(r.donorName) + '</td><td dir="ltr">' + esc(r.phone) + '</td><td dir="ltr">' + esc(r.email) + '</td><td dir="ltr">' + esc(r.orderId) + "</td></tr>";
      }).join("");
    }).catch(function (e) { toast(e.message, true); });
  }
  function purposeName(p) { var m = /^p(\d+)$/.exec(p || ""); if (m && pagesIndex[m[1]]) return pagesIndex[m[1]].title; return { general: "تبرع عام", zakat: "زكاة", sadaqa: "صدقة" }[p] || p || ""; }
  $("#d-load").onclick = loadDonations;
  $("#csv").onclick = function () {
    var head = ["التاريخ (القاهرة)", "المبلغ", "العملة", "الجهة", "المتبرع", "الموبايل", "البريد", "رقم العملية", "رقم عملية البنك"];
    downloadCsv([head].concat(rows.map(function (r) { return [cairoTime(r.paidAt), r.amount, r.currency, purposeName(r.purpose), r.donorName, r.phone, r.email, r.orderId, r.txnId]; })), "mersal-donations.csv");
  };
  // card payments the donor's browser never confirmed (closed tab, lost network): ask the gateway (Banque Misr or Paymob)
  // each one was started at and record the paid ones
  if ($("#d-reconcile")) $("#d-reconcile").onclick = function () {
    var b = this; busy(b, true); b.textContent = "جاري المراجعة…";
    api("donations/reconcile", { method: "POST", body: {} }).then(function (d) {
      var parts = [d.checked ? "اتراجعت " + d.checked + " عملية معلقة" : "مفيش عمليات معلقة أقدم من 15 دقيقة"];
      if (d.captured) parts.push("اتسجّل " + d.captured + " تبرع جديد");
      if (d.test) parts.push(d.test + " عملية تجريبية (مفاتيح Paymob التجريبية، مش تبرعات)");
      if (d.pending) parts.push(d.pending + " لسه معلقة");
      if (d.expired) parts.push(d.expired + " انتهت من غير دفع");
      if (d.errors) parts.push(d.errors + " البنك أو البوابة مردّوش عليها");
      // every order waiting for a person (not only this run's): the gateway says paid but it does not match, or it kept failing
      if (d.review) parts.push(d.review + " محتاجة مراجعة يدوية في لوحة البوابة: " + (d.reviews || []).join("، ") + (d.review > (d.reviews || []).length ? "…" : ""));
      if (d.remaining) parts.push("فاضل " + d.remaining + " - دوس تاني");
      toast(parts.join(" · "), !!(d.errors || d.review));
      if (d.captured) loadDonations();
    }).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };

  // ---------- settings ----------
  var PROVIDER_NAMES = { paymob: "Paymob", mpgs: "بنك مصر (MPGS)" }, lastPay = null;
  // the gateway /api/checkout uses: the saved choice, else Banque Misr (never picked from which settings exist)
  function showProvider(s) {
    lastPay = s;
    var b = $("#chk-provider b"), name = PROVIDER_NAMES[s.payProvider];
    if (b && name) {
      var ready = !s.providers || s.providers[s.payProvider];
      b.className = ready ? "ok" : "no";
      b.textContent = name + (s.payProviderSaved ? "" : " (تلقائي)") + (ready ? "" : " - إعداداتها ناقصة");
    }
    var h = $("#pp-hint");
    if (h) h.textContent = s.payProvider && !s.payProviderSaved ? "لسه محدش اختار بوابة، فالموقع شغال على " + name + " تلقائياً لحد ما تختار بوابة وتحفظ (البوابة بتتسجل كمان أول ما الدفع يبقى حقيقي)." : "";
  }
  function loadSettings() {
    api("settings").then(function (s) {
      var r = $('#paymode input[value="' + s.payMode + '"]'); if (r) r.checked = true;
      var p = s.payProvider && $('#payprovider input[value="' + s.payProvider + '"]'); if (p) p.checked = true;
      showProvider(s);
    });
  }
  $("#save-settings").onclick = function () {
    var b = this, v = ($('#paymode input:checked') || {}).value, pv = ($('#payprovider input:checked') || {}).value; if (!v) return; busy(b, true);
    var body = { payMode: v }; if (pv) body.payProvider = pv;
    api("settings", { method: "PUT", body: body }).then(function (r) {
      published();
      if (r && r.payProvider) showProvider({ payProvider: r.payProvider, payProviderSaved: pv || null, providers: r.providers });
    }).catch(function (e) { toast(e.message, true); }).then(function () { busy(b, false); });
  };
  // ---------- shared helpers for the tab modules ----------
  window.MersalAdmin = {
    $: $, $$: $$, esc: esc, fmt: fmt, api: api, toast: toast, busy: busy, published: published, upload: upload, pick: pick,
    csvCell: csvCell, downloadCsv: downloadCsv, cairoTime: cairoTime, cairoToday: cairoToday,
    content: function () { return content; }, pages: function () { return pagesIndex; }, staticPages: function () { return STATIC_PAGES; },
    register: function (tab, fn) { tabInits[tab] = fn; },
    openTab: function (tab) { var b = $('.tabs button[data-tab="' + tab + '"]'); if (b) b.click(); }
  };
  if (location.hash && $('.tabs button[data-tab="' + location.hash.slice(1) + '"]')) window.MersalAdmin.openTab(location.hash.slice(1));
})();
