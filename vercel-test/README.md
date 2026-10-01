# Mersal — HCO v100 payment test (Vercel)

The real site is ASP.NET MVC on .NET Framework (compiled DLLs on IIS), and **Vercel cannot run it**.
This folder is a small standalone app that runs the **same v100c payment flow** so it can be tested on Vercel:

1. `POST /api/initiate-checkout` sends the same `INITIATE_CHECKOUT` body as the patched `UserUI.dll`
   (`order.reference`, `merchant.name`, `returnUrl ...?hcoReturn=1`).
2. The page calls `Checkout.configure({ session: { id } })` + `Checkout.showPaymentPage()` (v67+ rules).
3. On return (`?hcoReturn=1&resultIndicator=...`) it checks `resultIndicator === successIndicator`, then
   `GET /api/order` does a **server-side RETRIEVE ORDER** and shows paid only when the bank reports `CAPTURED`
   with a successful `PAYMENT` (the check the live site is still missing).

## Deploy on Vercel
1. Vercel → **Add New → Project** → import `maarouf211099/websitee-live`, branch of your choice.
2. **Root Directory: `vercel-test`** · Framework Preset: **Other** · no build command.
3. **Environment Variables**:

| Name | Value |
|---|---|
| `MPGS_MERCHANT` | `TESTMERSAL` (default) |
| `MPGS_API_PASSWORD` | the **TESTMERSAL** API password (MPGS portal → Admin → Integration Settings) |
| `MPGS_GATEWAY` | optional, default `https://banquemisr.gateway.mastercard.com` |
| `MERCHANT_DISPLAY_NAME` | optional, default `MERSAL CHARITY` |

A non-`TEST` merchant is refused unless `ALLOW_LIVE_MERCHANT=1` is set — keep this deployment on the test merchant.

4. Deploy, open `/api/health` (should show `passwordConfigured: true`), then pay with an MPGS test card.

Order IDs are prefixed `VTEST-`. Nothing is written to the Mersal database.
