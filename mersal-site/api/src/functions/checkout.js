// POST /api/checkout  { amount, purpose, name, email, phone }
// Creates a Hosted Checkout session with the same INITIATE_CHECKOUT body that is live today (hco-v100c).
const { app } = require("@azure/functions");
const { cfg, mpgs, newOrderId } = require("../lib/mpgs");

const PURPOSES = {
  general: "تبرع عام", zakat: "زكاة", sadaqa: "صدقة",
  hospital: "مستشفى مرسال الخيري", oncology: "مركز مرسال للأورام", cases: "حالات تحتاج مساندة",
};
const MIN = Number(process.env.MIN_AMOUNT || 10);
const MAX = Number(process.env.MAX_AMOUNT || 1000000);

const bad = (message) => ({ status: 400, jsonBody: { message } });
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

app.http("checkout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "checkout",
  handler: async (req, ctx) => {
    let b;
    try { b = await req.json(); } catch { return bad("بيانات غير صحيحة"); }

    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return bad(`المبلغ يجب أن يكون بين ${MIN} و ${MAX} جنيه`);
    const name = clean(b.name, 80);
    const email = clean(b.email, 120);
    const phone = clean(b.phone, 20).replace(/[^\d+]/g, "");
    // general/zakat/... or a project page from the old site ("p30" = /p/30.html)
    const purpose = PURPOSES[b.purpose] || /^p\d{1,4}$/.test(b.purpose || "") ? b.purpose : "general";
    if (name.length < 2) return bad("من فضلك اكتب الاسم");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("البريد الإلكتروني غير صحيح");
    if (phone.length < 8) return bad("رقم الموبايل غير صحيح");

    const c = cfg();
    const orderId = newOrderId();
    const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
    const [firstName, ...rest] = name.split(/\s+/);

    const payload = {
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        operation: "PURCHASE",
        merchant: { name: c.merchantName },
        returnUrl: `${origin}/donate.html?hcoReturn=1`,
      },
      order: {
        id: orderId,
        reference: orderId, // required by the bank: without it 3DS passes but the PAYMENT never runs
        amount: amount.toFixed(2),
        currency: "EGP",
        description: `Donation - ${purpose}`,
      },
      transaction: { reference: orderId },
      // Donor details are stored on the bank's order, so /api/verify reads them back
      // from the bank instead of trusting the browser.
      customer: { firstName: firstName.slice(0, 50), lastName: (rest.join(" ") || "-").slice(0, 50), email, mobilePhone: phone },
    };

    let r = await mpgs("POST", "/session", payload).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
    if (r.status >= 400 && r.status < 500 && r.status !== 401) {
      // If the merchant profile rejects optional fields, retry with the exact body that is proven live.
      ctx.warn("INITIATE_CHECKOUT rejected, retrying with minimal body", JSON.stringify(r.data).slice(0, 500));
      delete payload.customer;
      r = await mpgs("POST", "/session", payload).catch((e) => ({ status: e.status || 502, data: { error: e.message } }));
    }
    if (r.status >= 300 || !r.data?.session?.id) {
      ctx.error("INITIATE_CHECKOUT failed", r.status, JSON.stringify(r.data).slice(0, 1000));
      return { status: 502, jsonBody: { message: "تعذّر الاتصال ببوابة الدفع. حاول مرة أخرى بعد قليل." } };
    }

    ctx.log("checkout created", orderId, amount, purpose);
    return {
      status: 200,
      headers: { "Cache-Control": "no-store" },
      jsonBody: { orderId, sessionId: r.data.session.id, successIndicator: r.data.successIndicator },
    };
  },
});
