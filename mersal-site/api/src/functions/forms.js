// Public forms + their admin side.
//   POST  /api/forms/{type}            type = volunteer | help  (anonymous)  -> { ok, ref }
//   GET   /api/admin/requests?type=&status=&from=&to=           (admin)      -> { enabled, store, rows }
//   GET   /api/admin/requests/{id}                               (admin)      -> record with its full data
//   PATCH /api/admin/requests/{id}  { status, note }             (admin)      -> { ok, row }
// Storage and validation live in ../lib/forms.js.
const { app } = require("@azure/functions");
const { requireAdmin, json, fail } = require("../lib/admin");
const forms = require("../lib/forms");

const who = (p) => ({ name: p.userDetails || "Mersal admin", email: /@/.test(p.userDetails || "") ? p.userDetails : "admin@mersal-ngo.org" });
const HOTLINE = "19340";

app.http("formsSubmit", {
  methods: ["POST"], authLevel: "anonymous", route: "forms/{type}",
  handler: async (req, ctx) => {
    try {
      const type = String(req.params.type || "").toLowerCase();
      if (!forms.TYPES[type]) return json(404, { message: "نوع الطلب غير معروف" });
      const ip = forms.clientIp(req);
      if (!forms.rateAllowed(ip)) return json(429, { message: `وصلت للحد الأقصى من الطلبات دلوقتي. حاول بعد ساعة أو كلمنا على ${HOTLINE}` });
      let body;
      try { body = await req.json(); } catch { return json(400, { message: "بيانات غير صالحة" }); }
      const bot = forms.botCheck(body);
      if (bot) { ctx.log("requests: dropped", type, bot, ip); return json(200, { ok: true, ref: forms.makeRef(type) }); }
      const v = forms.validate(type, body);
      if (!v.ok) return json(400, { message: "راجع البيانات اللي عليها علامة", errors: v.errors });
      const rec = forms.makeRecord(type, v.data);
      const log = (...a) => ctx.warn(...a);
      const store = await forms.save(rec, log).catch((e) => { log("requests: save failed", e.message); return null; });
      const fwd = await forms.forward(rec, log);
      if (!store && !fwd.forwarded) {
        ctx.error("requests: nothing stored - set DONATIONS_STORAGE or GITHUB_TOKEN/GITHUB_REPO (or FORMS_WEBHOOK_URL)", rec.id);
        return json(503, { message: `الخدمة مش متاحة دلوقتي. كلمنا على ${HOTLINE} أو حاول تاني بعد شوية` });
      }
      forms.rateHit(ip);
      ctx.log("requests: saved", rec.id, store || "webhook");
      return json(200, { ok: true, ref: rec.id, stored: store || "webhook" });
    } catch (e) { return fail(e, ctx); }
  },
});

app.http("adminRequests", {
  methods: ["GET"], authLevel: "anonymous", route: "admin/requests",
  handler: async (req, ctx) => {
    try {
      requireAdmin(req);
      const q = (k) => req.query.get(k) || "";
      const r = await forms.list({ type: q("type"), status: q("status"), from: q("from"), to: q("to") });
      return json(200, { enabled: forms.enabled(), store: r.store, statuses: forms.STATUSES, rows: r.rows });
    } catch (e) { return fail(e, ctx); }
  },
});

app.http("adminRequest", {
  methods: ["GET", "PATCH"], authLevel: "anonymous", route: "admin/requests/{id}",
  handler: async (req, ctx) => {
    try {
      const p = requireAdmin(req);
      const id = String(req.params.id || "").toUpperCase();
      if (!forms.typeOf(id)) return json(400, { message: "رقم طلب غير صحيح" });
      if (req.method === "GET") {
        const row = await forms.get(id);
        return row ? json(200, row) : json(404, { message: "الطلب مش موجود" });
      }
      const b = await req.json().catch(() => ({}));
      const row = await forms.update(id, { status: b.status, note: b.note }, who(p));
      return row ? json(200, { ok: true, row }) : json(404, { message: "الطلب مش موجود" });
    } catch (e) { return fail(e, ctx); }
  },
});
