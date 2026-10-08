# موقع مؤسسة مرسال الجديد

موقع ثابت (HTML/CSS/JS) + دالتين صغيرتين للدفع، يتنشر على **Azure Static Web Apps**.
مفيش سيرفر ولا داتابيز ولا DLLs — الكود كله هنا.

```
mersal-site/
  public/                الموقع (الصفحات، الصور، التصميم)
    index.html           الرئيسية
    donate.html          طرق التبرع + الدفع بالبطاقة (بنك مصر v100)
    zakat.html           حاسبة الزكاة
    about.html           عن مرسال
    contact.html         تواصل معنا
    content.json         الحملات اللي في الرئيسية — عدّلها من هنا
    js/layout.js         الهيدر والفوتر وأرقام التليفون والسوشيال — مكان واحد
    staticwebapp.config.json  تحويل الروابط القديمة (/Donation ...) للصفحات الجديدة
  api/                   Azure Functions (Node 20)
    checkout             ينشئ جلسة دفع (نفس INITIATE_CHECKOUT الشغال حالياً)
    verify               يسأل البنك مباشرة؛ التبرع يتحسب بس لو CAPTURED، وبعدها يتبعت للسيستم الجديد
```

## النشر على Azure (مرة واحدة)
1. Azure Portal → **Create a resource → Static Web App**.
2. Plan: **Free** (فيه دومين مخصص وSSL مجاناً). Region: West Europe.
3. Source: **GitHub** → `maarouf211099/websitee-live` → الفرع.
4. Build presets: **Custom**
   - App location: `mersal-site/public`
   - Api location: `mersal-site/api`
   - Output location: *(فاضي)*
5. Create. Azure هيضيف GitHub Action للريبو وينشر تلقائياً مع كل push.

## الإعدادات (Static Web App → Settings → Environment variables)
| الاسم | القيمة |
|---|---|
| `MPGS_MERCHANT` | `TESTMERSAL` للتجربة، وبعدين `MERSAL` |
| `MPGS_API_PASSWORD` | باسورد الـAPI (الجديد بعد تغييره) |
| `DONATION_WEBHOOK_URL` | رابط السيستم الجديد اللي يستقبل التبرعات (اختياري لحد ما يجهز) |
| `DONATION_WEBHOOK_SECRET` | سر مشترك لتوقيع الطلب (اختياري) |
| `PUBLIC_BASE_URL` | `https://www.mersal-ngo.org` بعد ربط الدومين |

اختياري: `MPGS_GATEWAY`، `MERCHANT_DISPLAY_NAME` (افتراضي MERSAL CHARITY)، `MIN_AMOUNT` (10)، `MAX_AMOUNT`، `ORDER_PREFIX` (MERSAL-WEB).

## الدومين
Static Web App → **Custom domains** → `www.mersal-ngo.org` (CNAME) و`mersal-ngo.org`.
غيّر الـDNS بس بعد ما تجرب تبرع حقيقي على رابط `*.azurestaticapps.net`.

## إرسال التبرعات للسيستم الجديد
بعد ما البنك يأكد الدفع، الموقع يبعت `POST` لـ `DONATION_WEBHOOK_URL`:
```json
{
  "source": "mersal-website",
  "orderId": "MERSAL-WEB-20261008120619-B5F51E",
  "amount": 250, "currency": "EGP", "purpose": "zakat",
  "donor": { "name": "...", "email": "...", "phone": "..." },
  "paidAt": "2026-10-08T10:00:00Z",
  "gatewayTransactionId": "1", "receipt": "R1"
}
```
- Header `X-Mersal-Signature: sha256=<HMAC-SHA256(body, DONATION_WEBHOOK_SECRET)>` للتأكد إن الطلب جاي من الموقع.
- **`orderId` مفتاح فريد**: ممكن نفس التبرع يتبعت أكتر من مرة (لو المتبرع عمل refresh)، فالسيستم لازم يتجاهل المكرر.
- `purpose`: `general | zakat | sadaqa | hospital | oncology | cases`.
- لو بنك مصر رفض بيانات المتبرع (`customer`)، الدفع بيكمل عادي بس `donor` هيوصل فاضي.

## تعديل المحتوى
- الحملات: `public/content.json` (عنوان، نص، صورة، رابط، واختياري `goal`/`raised` لشريط التقدم).
- أرقام المحافظ/إنستاباي: `WALLETS` أول `public/js/donate.js`.
- التليفونات والعنوان والسوشيال: `SITE` أول `public/js/layout.js`.
