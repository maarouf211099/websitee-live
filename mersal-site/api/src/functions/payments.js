// Card payments the donor's browser did not confirm (lib/orders.js does the work):
//   POST /api/console/donations/reconcile   (admin) "مراجعة العمليات المعلقة": asks the bank about checkout sessions
//        still pending after 15 minutes and records the CAPTURED ones -> { checked, captured, expired, pending, errors, remaining }
//   POST /api/mpgs/notify                   (Banque Misr) webhook notification, only when MPGS_NOTIFICATION_SECRET is set:
//        the X-Notification-Secret header must match it; the order is then read back from the bank, never from the body.
const crypto = require("crypto");
const { app } = require("@azure/functions");
const { requireAdmin, json, fail } = require("../lib/admin");
const orders = require("../lib/orders");
const donations = require("../lib/donations");

app.http("adminReconcile", {
  methods: ["POST"], authLevel: "anonymous", route: "console/donations/reconcile",
  handler: async (req, ctx) => {
    try {
      await requireAdmin(req);
      if (!donations.enabled()) return json(409, { message: "مراجعة العمليات محتاجة DONATIONS_STORAGE (Azure Table) في إعدادات Azure" });
      if (!(process.env.MPGS_MERCHANT && process.env.MPGS_API_PASSWORD)) return json(409, { message: "إعدادات بنك مصر (MPGS_MERCHANT / MPGS_API_PASSWORD) مش متظبطة في Azure" });
      const res = await orders.reconcile({ log: (...a) => ctx.warn(...a) });
      if (!res) return json(409, { message: "مراجعة العمليات محتاجة DONATIONS_STORAGE (Azure Table) في إعدادات Azure" });
      ctx.log("reconcile", JSON.stringify({ ...res, captures: res.captures.length }));
      return json(200, { ok: true, ...res });
    } catch (e) { return fail(e, ctx); }
  },
});

const digest = (t) => crypto.createHash("sha256").update(String(t)).digest();
app.http("mpgsNotify", {
  methods: ["POST"], authLevel: "anonymous", route: "mpgs/notify",
  handler: async (req, ctx) => {
    const secret = String(process.env.MPGS_NOTIFICATION_SECRET || "").trim();
    if (!secret) return { status: 404 };
    const given = String(req.headers.get("x-notification-secret") || "");
    if (!given || !crypto.timingSafeEqual(digest(given), digest(secret))) { ctx.warn("mpgs notify: bad secret"); return { status: 401 }; }
    let b;
    try { b = await req.json(); } catch { return { status: 400 }; }
    const orderId = String((b && b.order && b.order.id) || "");
    if (!orders.validOrderId(orderId)) { ctx.log("mpgs notify: ignored order", orderId.slice(0, 60)); return { status: 200 }; } // not one of this site's orders
    const s = await orders.settle(orderId, (...a) => ctx.warn(...a));
    if (s.error) return { status: 502 }; // the bank retries the notification later
    ctx.log("mpgs notify", orderId, s.status, s.paid ? "recorded" : "");
    return { status: 200 };
  },
});
