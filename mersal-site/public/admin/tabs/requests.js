// Admin tab "requests": volunteer + help requests from /volunteer.html and /help.html, and the donate page's
// "سجّل تبرعك" (transfer, MT-) and "مندوب لحد البيت" (pickup, MP-) forms (api/src/functions/forms.js).
// transfer / pickup rows carry .meta (amount, currency, method, bank, date, slot...) so the list and the CSV work without .data.
//   GET   /api/console/requests?type=&status=&from=&to=  -> { enabled: {table, github, webhook}, store, rows }
//   GET   /api/console/requests/{id}                      -> full record (rows from the GitHub index carry no .data)
//   PATCH /api/console/requests/{id} { status } | { note } -> { ok, row }
// Status and note changes are saved the moment they change (no save button).
(function () {
  var A = window.MersalAdmin, $ = A.$, $$ = A.$$, esc = A.esc;
  var TYPES = { volunteer: "تطوع", help: "طلب مساعدة", transfer: "تبرع مسجّل", pickup: "مندوب" };
  var STATUS = { new: "جديد", contacted: "تم التواصل", done: "تم", rejected: "مرفوض" };
  var HOW = { hospital: "مستشفى", convoys: "قوافل", design: "تصميم / سوشيال ميديا", fundraising: "جمع تبرعات", other: "أخرى" };
  var AVAIL = { weekdays: "أيام الأسبوع", weekends: "نهاية الأسبوع", flexible: "مرن / حسب الحاجة", online: "أونلاين فقط" };
  var REL = { self: "المريض نفسه", parent: "الأب / الأم", child: "الابن / الابنة", spouse: "الزوج / الزوجة", sibling: "الأخ / الأخت", relative: "قريب", other: "أخرى" };
  var CASE = { monthly: "علاج شهري", surgery: "عملية", oncology: "أورام", children: "أطفال", other: "أخرى" };
  var METHOD = { bank: "تحويل بنكي", instapay: "إنستاباي", vodafone: "فودافون كاش", etisalat: "اتصالات كاش", orange: "أورانج كاش", fawry: "فوري / MyFawry", masary: "مصاري", aman: "أمان", megakheir: "ميجا خير", bankwallet: "محافظ البنوك (من خلال فوري)" };
  var CUR = { EGP: "جنيه", USD: "دولار", EUR: "يورو", SAR: "ريال سعودي", AED: "درهم إماراتي" };
  var PURPOSE = { general: "تبرع عام", zakat: "زكاة المال", sadaqa: "صدقة", p30: "مستشفى مرسال للأطفال", p31: "مركز مرسال لعلاج الأورام", cases: "حالات المرضى" };
  var KIND = { money: "فلوس", goods: "تبرع عيني" };
  var SLOT = { morning: "صباحاً", afternoon: "بعد الظهر", evening: "مساءً" };
  var num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  function money(v, cur) { return v == null || v === "" || isNaN(v) ? "" : num.format(Number(v)) + " " + (CUR[cur] || cur || ""); }
  // "2026-10-12" -> "الاثنين، 12 أكتوبر" (short: "12 أكتوبر"; + the year when it is not this year)
  function dayLabel(v, short) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "")) return v || "";
    var d = new Date(v + "T00:00:00"), o = { day: "numeric", month: "long" };
    if (short !== true) o.weekday = "long";
    if (d.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    try { return d.toLocaleDateString("ar-EG-u-nu-latn", o); } catch (x) { return v; }
  }
  // a transfer / pickup field from .meta (always there) or .data (table rows and opened details)
  function key(r, k) { var m = r.meta || {}, d = r.data || {}; return m[k] != null && m[k] !== "" ? m[k] : d[k]; }
  // [key, label, valueMap or function(value, data)?] in display order
  var FIELDS = {
    volunteer: [["name", "الاسم"], ["phone", "الموبايل"], ["email", "البريد"], ["city", "المدينة / المنطقة"], ["age", "السن"], ["how", "طرق المساعدة", HOW], ["howOther", "أخرى - تفاصيل"], ["availability", "الوقت المناسب", AVAIL], ["message", "رسالة"]],
    help: [["patient", "المريض"], ["caseType", "نوع الحالة", CASE], ["hospital", "المستشفى / التشخيص"], ["description", "وصف الحالة"], ["requester", "مقدم الطلب"], ["relation", "صلة القرابة", REL], ["phone", "الموبايل"], ["altPhone", "رقم بديل"], ["gov", "المحافظة"], ["city", "المدينة"], ["income", "الدخل الشهري"], ["consent", "موافقة على استخدام البيانات"]],
    transfer: [["amount", "المبلغ", function (v, d) { return money(v, d.currency); }], ["method", "طريقة التبرع", METHOD], ["bank", "البنك"], ["date", "تاريخ التحويل", dayLabel], ["txRef", "رقم العملية"], ["purpose", "الغرض", PURPOSE], ["caseCode", "كود الحالة"], ["name", "الاسم"], ["phone", "الموبايل"], ["email", "البريد"], ["notes", "ملاحظات"]],
    pickup: [["kind", "نوع التبرع", KIND], ["amount", "المبلغ", function (v) { return money(v, "EGP"); }], ["purpose", "الغرض", PURPOSE], ["goods", "التبرع العيني"], ["date", "يوم التحصيل", dayLabel], ["slot", "الوقت", SLOT], ["gov", "المحافظة"], ["area", "المنطقة / الحي"], ["address", "العنوان"], ["name", "الاسم"], ["phone", "الموبايل"], ["altPhone", "رقم تاني"], ["notes", "ملاحظات"]]
  };
  var rows = [], store = null, enabled = {}, root = null, inited = false;

  var CSS = "<style>" +
    ".rq-filters select, .rq-filters input { font: inherit; padding: 7px 10px; border: 1.5px solid var(--line); border-radius: 10px; background: #fff; }" +
    ".rq-badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 4px; }" +
    ".rq-badge { font: inherit; font-size: 13px; font-weight: 700; padding: 5px 12px; border-radius: 999px; border: 1.5px solid var(--line); background: #fff; cursor: pointer; color: var(--teal-dark); display: inline-flex; gap: 6px; align-items: center; }" +
    ".rq-badge b { font-family: 'Titillium Web', sans-serif; background: #f0f6f6; border-radius: 999px; padding: 0 8px; }" +
    ".rq-badge.on { background: var(--teal-dark); border-color: var(--teal-dark); color: #fff; } .rq-badge.on b { background: rgba(255,255,255,.18); }" +
    ".rq-badge.s-new:not(.on) b { background: #fff3d6; color: #8a5a00; }" +
    ".tabs button .rq-n { background: var(--gold); color: var(--teal-dark); border-radius: 999px; padding: 0 8px; font-size: 12px; margin-inline-start: 6px; font-family: 'Titillium Web', sans-serif; }" +
    "#rq-table { font-size: 13.5px; } #rq-table th, #rq-table td { padding: 8px 7px; }" +
    "#rq-table td.sum { white-space: normal; min-width: 150px; max-width: 220px; font-size: 12.5px; color: var(--muted); line-height: 1.5; }" +
    "#rq-table td.who { white-space: normal; min-width: 90px; max-width: 140px; }" +
    "#rq-table td.place { white-space: normal; min-width: 70px; max-width: 110px; }" +
    "#rq-table select.st { font: inherit; font-size: 13px; font-weight: 700; padding: 5px 8px; border-radius: 8px; border: 1.5px solid var(--line); background: #fff; }" +
    "#rq-table select.st.new { background: #fff3d6; } #rq-table select.st.contacted { background: #e4f3f3; } #rq-table select.st.done { background: #e6f6ee; } #rq-table select.st.rejected { background: #fdecea; }" +
    "#rq-table input.note { font: inherit; font-size: 13px; padding: 5px 8px; border: 1.5px solid var(--line); border-radius: 8px; width: 132px; background: #fff; }" +
    "#rq-table tr.details td { white-space: normal; background: #f8fbfb; }" +
    ".rq-dl-wrap { position: sticky; inset-inline-start: 0; width: min(760px, calc(100vw - 64px)); }" +
    ".rq-dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 0; font-size: 13.5px; max-width: 760px; } .rq-dl dt { color: var(--muted); } .rq-dl dd { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }" +
    ".rq-type { font-size: 12px; font-weight: 800; padding: 2px 9px; border-radius: 999px; white-space: nowrap; } .rq-type.volunteer { background: #e4f3f3; color: var(--teal-dark); } .rq-type.help { background: #fff3d6; color: #8a5a00; }" +
    ".rq-type.transfer { background: #e6f6ee; color: #11683f; } .rq-type.pickup { background: #efeafc; color: #553c9a; }" +
    "#rq-table td.sum .rq-key { display: block; color: var(--teal-dark); font-size: 13.5px; font-weight: 800; } #rq-table td.sum .rq-key bdi { font-family: 'Titillium Web', 'Cairo', sans-serif; }" +
    "#rq-table td.sum .rq-sub { display: block; color: var(--ink); } #rq-table td.sum .rq-more { display: block; margin-top: 2px; } #rq-table td.sum .rq-code { white-space: nowrap; font-family: 'Titillium Web', sans-serif; }" +
    ".rq-empty { background: #fff; border: 1px dashed var(--line); border-radius: 14px; padding: 28px; text-align: center; color: var(--muted); margin-top: 12px; }" +
    "@media (max-width: 860px) { .rq-filters label { flex: 1 1 140px; } .rq-filters select, .rq-filters input { flex: 1; min-width: 0; } .rq-filters .btn { flex: 1 1 auto; justify-content: center; } }" +
    "</style>";

  function template() {
    return CSS +
      '<p class="hint">الطلبات اللي بتوصل من صفحات <a href="/volunteer.html" target="_blank" rel="noopener">تطوع معنا</a> و<a href="/help.html" target="_blank" rel="noopener">طلب مساعدة</a>، ومن <a href="/donate.html#bank" target="_blank" rel="noopener">طرق التبرع</a>: <b>تبرع مسجّل</b> (حد حوّل بنكي أو محفظة وسجّل تبرعه عشان نأكده) و<b>مندوب</b> (طلب مندوب لحد البيت). غيّر الحالة أو اكتب ملاحظة وبتتحفظ فوراً.</p>' +
      '<div class="row filters rq-filters">' +
        '<label>النوع <select id="rq-type"><option value="">الكل</option>' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + esc(TYPES[k]) + "</option>"; }).join("") + "</select></label>" +
        '<label>الحالة <select id="rq-status"><option value="">الكل</option>' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '">' + STATUS[k] + "</option>"; }).join("") + "</select></label>" +
        '<label>من <input type="date" id="rq-from"></label><label>إلى <input type="date" id="rq-to"></label>' +
        '<button class="btn btn-teal" id="rq-load">عرض</button><button class="btn btn-ghost" id="rq-csv">تصدير CSV</button>' +
      "</div>" +
      '<div class="rq-badges" id="rq-badges"></div>' +
      '<div class="status" id="rq-store" hidden></div>' +
      '<div class="table-wrap" id="rq-wrap" hidden><table id="rq-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>الاسم</th><th>الموبايل</th><th>المكان</th><th>ملخص</th><th>الحالة</th><th>ملاحظة</th><th></th></tr></thead><tbody></tbody></table></div>' +
      '<div class="rq-empty" id="rq-empty" hidden></div>';
  }

  function find(id) { for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i]; return null; }
  function visible() { var st = $("#rq-status").value; return rows.filter(function (r) { return !st || r.status === st; }); }
  function when(iso) { return String(iso || "").replace("T", " ").slice(0, 16); }

  function load() {
    var b = $("#rq-load"); b.disabled = true;
    var qs = "type=" + encodeURIComponent($("#rq-type").value) + "&from=" + ($("#rq-from").value || "") + "&to=" + ($("#rq-to").value || "");
    return A.api("requests?" + qs)
      .then(function (d) { rows = d.rows || []; store = d.store || null; enabled = d.enabled || {}; })
      .catch(function (e) { A.toast(e.message, true); rows = []; })
      .then(function () { render(); b.disabled = false; });
  }

  function renderBadges() {
    var st = $("#rq-status").value, counts = {};
    rows.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
    $("#rq-badges").innerHTML = '<button type="button" class="rq-badge' + (!st ? " on" : "") + '" data-st="">الكل<b>' + rows.length + "</b></button>" +
      Object.keys(STATUS).map(function (k) { return '<button type="button" class="rq-badge s-' + k + (st === k ? " on" : "") + '" data-st="' + k + '">' + STATUS[k] + "<b>" + (counts[k] || 0) + "</b></button>"; }).join("");
    // unread count on the sidebar tab (only when the list is not filtered by type/date)
    var tab = $('.tabs button[data-tab="requests"]'), n = tab && tab.querySelector(".rq-n");
    var unfiltered = !$("#rq-type").value && !$("#rq-from").value && !$("#rq-to").value;
    if (tab) { if (unfiltered && counts.new) { if (!n) { n = document.createElement("b"); n.className = "rq-n"; tab.appendChild(n); } n.textContent = counts.new; } else if (n) n.remove(); }
  }
  function render() {
    renderBadges();
    var note = $("#rq-store");
    if (!store) {
      note.hidden = false; note.className = "status bad";
      note.textContent = enabled.webhook
        ? "الطلبات بتتبعت للـ webhook (FORMS_WEBHOOK_URL) بس ومش بتتحفظ هنا. عشان تشوفها في اللوحة ضيف DONATIONS_STORAGE (Azure Table) أو GITHUB_TOKEN + GITHUB_REPO في إعدادات Azure."
        : "مفيش مكان تخزين للطلبات متظبط: ضيف DONATIONS_STORAGE (اتصال Storage Account - الأفضل) أو GITHUB_TOKEN + GITHUB_REPO في إعدادات Azure، وبعدها الطلبات الجديدة هتظهر هنا تلقائياً (شوف README).";
    } else if (store === "github" && !enabled.table) {
      note.hidden = false; note.className = "status warn";
      note.textContent = "الطلبات بتتحفظ كملفات في GitHub (api/data/requests). ده شغال، بس لو العدد كبر ضيف DONATIONS_STORAGE عشان التخزين يبقى أسرع ومن غير commits.";
    } else note.hidden = true;
    var list = visible();
    $("#rq-table tbody").innerHTML = list.map(row).join("");
    $("#rq-wrap").hidden = !list.length;
    var empty = $("#rq-empty");
    empty.hidden = !!list.length || !store;
    empty.textContent = rows.length ? "مفيش طلبات بالحالة دي." : "مفيش طلبات في الفترة دي. لما حد يبعت من صفحة تطوع معنا أو طلب مساعدة أو يسجّل تبرع / يطلب مندوب من طرق التبرع هيظهر هنا.";
  }
  function row(r) {
    var place = [r.gov, r.city].filter(Boolean).join(" - ");
    var name = esc(r.name) + (r.type === "help" && r.data && r.data.requester ? '<br><small class="hint">' + esc(r.data.requester) + (REL[r.data.relation] ? " (" + esc(REL[r.data.relation]) + ")" : "") + "</small>" : "");
    return '<tr data-id="' + esc(r.id) + '">' +
      '<td><span dir="ltr">' + esc(when(r.createdAt)) + '</span><br><small class="hint" dir="ltr">' + esc(r.id) + "</small></td>" +
      '<td><span class="rq-type ' + esc(r.type) + '">' + esc(TYPES[r.type] || r.type) + "</span></td>" +
      '<td class="who">' + name + "</td>" +
      '<td dir="ltr"><a href="tel:' + esc(r.phone) + '">' + esc(r.phone) + "</a>" + (r.altPhone ? '<br><a href="tel:' + esc(r.altPhone) + '">' + esc(r.altPhone) + "</a>" : "") + "</td>" +
      '<td class="place">' + esc(place) + "</td>" +
      '<td class="sum">' + sumHtml(r) + "</td>" +
      '<td><select class="st ' + esc(r.status) + '" data-status aria-label="الحالة">' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + STATUS[k] + "</option>"; }).join("") + "</select></td>" +
      '<td><input class="note" data-note value="' + esc(r.note || "") + '" placeholder="ملاحظة…" maxlength="500" aria-label="ملاحظة"></td>' +
      '<td><button type="button" class="btn btn-ghost btn-sm" data-details>تفاصيل</button></td></tr>';
  }
  // summary cell: the amount / what and the when for donate-page requests, the server's summary text otherwise
  function sumHtml(r) {
    if (r.type === "transfer") {
      var via = METHOD[key(r, "method")] || key(r, "method") || "", bank = key(r, "bank"), code = key(r, "caseCode");
      var more = [dayLabel(key(r, "date"), true), PURPOSE[key(r, "purpose")]].filter(Boolean).map(esc);
      if (code) more.push('كود&nbsp;<bdi class="rq-code" dir="ltr">' + esc(code) + "</bdi>");
      return '<span class="rq-key"><bdi>' + esc(money(key(r, "amount"), key(r, "currency"))) + "</bdi></span>" +
        '<span class="rq-sub">' + esc(via + (bank ? " - " + bank : "")) + "</span>" +
        '<span class="rq-more">' + more.join(" · ") + "</span>";
    }
    if (r.type === "pickup") {
      var kind = key(r, "kind"), what = kind === "money" ? "فلوس · " + money(key(r, "amount"), "EGP") : KIND[kind] || "";
      var rest = kind === "goods" ? String(r.summary || "").split(" · ")[0].replace(/^تبرع عيني: /, "") : PURPOSE[key(r, "purpose")] || "";
      return '<span class="rq-key"><bdi>' + esc(what) + "</bdi></span>" +
        '<span class="rq-sub">' + esc([dayLabel(key(r, "date")), SLOT[key(r, "slot")]].filter(Boolean).join(" · ")) + "</span>" +
        (rest ? '<span class="rq-more">' + esc(rest) + "</span>" : "");
    }
    return esc(r.summary);
  }
  function show(f, v, d) {
    if (typeof f[2] === "function") return f[2](v, d);
    if (f[2]) return Array.isArray(v) ? v.map(function (k) { return f[2][k] || k; }).join("، ") : (f[2][v] || v);
    return v === true ? "نعم" : v;
  }
  function detailsHtml(r) {
    var d = r.data || {};
    var parts = (FIELDS[r.type] || []).map(function (f) {
      var v = d[f[0]];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "";
      v = show(f, v, d);
      return "<dt>" + esc(f[1]) + "</dt><dd" + (/phone|email|txRef|caseCode/i.test(f[0]) ? ' dir="ltr"' : "") + ">" + esc(v) + "</dd>";
    });
    if (r.updatedAt) parts.push('<dt>آخر تحديث</dt><dd dir="ltr">' + esc(when(r.updatedAt)) + "</dd>");
    return '<div class="rq-dl-wrap"><dl class="rq-dl">' + parts.join("") + "</dl></div>";
  }
  function detailsText(r) {
    var d = r.data; if (!d) return "";
    return (FIELDS[r.type] || []).map(function (f) {
      var v = d[f[0]]; if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "";
      return f[1] + ": " + show(f, v, d);
    }).filter(Boolean).join(" | ");
  }

  function patch(r, body, ctl) {
    var prev = { status: r.status, note: r.note || "" };
    ctl.disabled = true;
    A.api("requests/" + encodeURIComponent(r.id), { method: "PATCH", body: body })
      .then(function (d) {
        var next = d && d.row ? d.row : body;
        r.status = next.status || r.status; r.note = next.note != null ? next.note : r.note; if (next.updatedAt) r.updatedAt = next.updatedAt;
        if (body.status !== undefined) { ctl.className = "st " + r.status; A.toast("اتحدثت الحالة: " + (STATUS[r.status] || r.status) + " ✓"); } else A.toast("اتحفظت الملاحظة ✓");
        renderBadges();
      })
      .catch(function (e) { A.toast(e.message, true); if (body.status !== undefined) ctl.value = prev.status; else ctl.value = prev.note; })
      .then(function () { ctl.disabled = false; });
  }

  function bind() {
    $("#rq-load").addEventListener("click", load);
    $("#rq-status").addEventListener("change", render);
    $("#rq-csv").addEventListener("click", function () {
      var list = visible(); if (!list.length) { A.toast("مفيش طلبات للتصدير", true); return; }
      // transfer / pickup columns (empty for volunteer / help): amount as a plain number so a spreadsheet can sum it
      var head = ["رقم الطلب", "التاريخ", "النوع", "الحالة", "الاسم", "الموبايل", "رقم بديل", "البريد", "المحافظة", "المدينة / المنطقة", "المبلغ", "العملة", "طريقة التبرع", "البنك", "نوع التبرع", "الغرض", "كود الحالة", "تاريخ التحويل / التحصيل", "وقت التحصيل", "ملخص", "ملاحظة", "التفاصيل"];
      var lines = [head].concat(list.map(function (r) {
        var dn = r.type === "transfer" || r.type === "pickup", k = function (n) { return dn ? key(r, n) : ""; };
        var amt = k("amount"), cur = k("currency") || (r.type === "pickup" && amt != null && amt !== "" ? "EGP" : "");
        return [r.id, when(r.createdAt), TYPES[r.type] || r.type, STATUS[r.status] || r.status, r.name, r.phone, r.altPhone, r.email, r.gov, r.city,
          amt == null ? "" : amt, cur, METHOD[k("method")] || k("method"), k("bank"), KIND[k("kind")] || k("kind"), PURPOSE[k("purpose")] || k("purpose"), k("caseCode"), k("date"), SLOT[k("slot")] || k("slot"),
          r.summary, r.note, detailsText(r)];
      }))
        .map(function (l) { return l.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([String.fromCharCode(65279) + lines], { type: "text/csv;charset=utf-8" })); a.download = "mersal-requests.csv"; a.click();
    });
    root.addEventListener("change", function (e) {
      var tr = e.target.closest("tr[data-id]"); if (!tr) return;
      var r = find(tr.getAttribute("data-id")); if (!r) return;
      if (e.target.hasAttribute("data-status")) patch(r, { status: e.target.value }, e.target);
      else if (e.target.hasAttribute("data-note")) { var v = e.target.value.trim(); if (v !== (r.note || "")) patch(r, { note: v }, e.target); }
    });
    root.addEventListener("click", function (e) {
      var badge = e.target.closest(".rq-badge");
      if (badge) { $("#rq-status").value = badge.getAttribute("data-st"); render(); return; }
      var b = e.target.closest("[data-details]"); if (!b) return;
      var tr = b.closest("tr"), r = find(tr.getAttribute("data-id")), next = tr.nextElementSibling;
      if (next && next.classList.contains("details")) { next.remove(); b.textContent = "تفاصيل"; return; }
      b.textContent = "…"; b.disabled = true;
      (r.data ? Promise.resolve(r) : A.api("requests/" + encodeURIComponent(r.id)).then(function (full) { Object.keys(full || {}).forEach(function (k) { r[k] = full[k]; }); return r; }))
        .then(function (rec) { tr.insertAdjacentHTML("afterend", '<tr class="details"><td colspan="9">' + detailsHtml(rec) + "</td></tr>"); b.textContent = "إخفاء"; })
        .catch(function (err) { A.toast(err.message, true); b.textContent = "تفاصيل"; })
        .then(function () { b.disabled = false; });
    });
  }

  function init() {
    if (inited) return; inited = true;
    root = document.getElementById("requests-root");
    root.innerHTML = template();
    bind();
    // the tab can be opened from the URL hash before the login finished: wait for the shell
    var shell = document.getElementById("shell");
    if (!shell || !shell.hidden) load();
    else { var mo = new MutationObserver(function () { if (!shell.hidden) { mo.disconnect(); load(); } }); mo.observe(shell, { attributes: true, attributeFilter: ["hidden"] }); }
  }
  A.register("requests", init);
  var tab = $('.tabs button[data-tab="requests"]');
  if (tab && tab.getAttribute("aria-selected") === "true") init();
})();
