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

## الدفع بالبطاقة
الإعداد في أول `public/js/layout.js` ← `payMode`:
- `"demo"` (الحالي): كل خطوات التبرع شغالة (المبلغ والمشروع ← البيانات ← المراجعة) وبتقف عند بوابة بنك مصر برسالة إن الدفع قيد التفعيل وإن **مفيش أي مبلغ اتخصم**، وبتعرض طرق تانية للتبرع.
- `"live"`: دفع حقيقي، ومحتاج إعدادات بنك مصر تحت (`MPGS_MERCHANT` و`MPGS_API_PASSWORD` و`PUBLIC_BASE_URL`).
- `"off"`: يخفي الدفع بالبطاقة خالص.

أي زرار "تبرع الآن" جوا صفحة مشروع بيفتح التبرع ومحدد فيه المشروع ده (`/donate.html?for=p30`).

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

## لوحة التحكم (`/admin/`)
لوحة منفصلة على `https://<الموقع>/admin/`، الدخول بحساب مايكروسوفت (Microsoft Entra ID) بتاع `mersal-ngo.org`.
كل حفظ من اللوحة = commit على فرع `main` في GitHub، والموقع بيتنشر تلقائياً خلال دقيقة تقريباً.

**اللي تقدر تعدّله من اللوحة:** السلايدر، حملات التبرع وأرقامها (الهدف / تم توفير)، "مرسال بالأرقام"، كل صفحات المحتوى (`/p/*.html`)، الألبومات والصور، وضع الدفع بالبطاقة (مقفول / تجريبي / حقيقي)، وتقرير التبرعات بالبطاقة.

### التفعيل (مرة واحدة)
1. **مين يدخل:** Azure Portal → Static Web App → **Role management** → **Invite**: Provider `Microsoft Entra ID`، الإيميل، Domain = دومين الموقع، Role = `admin`. افتح رابط الدعوة بنفس الحساب. كل أدمن محتاج دعوة.
2. **صلاحية الحفظ:** GitHub → Settings → Developer settings → Fine-grained tokens → token على ريبو `websitee-live` بصلاحية **Contents: Read and write** بس.
   ثم في Static Web App → Settings → **Environment variables**:

   | الاسم | القيمة |
   |---|---|
   | `GITHUB_TOKEN` | التوكن |
   | `GITHUB_REPO` | `maarouf211099/websitee-live` |
   | `GITHUB_BRANCH` | `main` |
3. **تقرير التبرعات (اختياري):** اعمل Storage Account (أرخص خيار، Standard LRS) وخد **Connection string** من Access keys وحطه في `DONATIONS_STORAGE`. التبرعات المؤكدة من البنك بتتسجل تلقائياً في جدول `donations`.

لو الحفظ طالع "غير متصل" في تبويب الإعدادات → راجع الخطوة 2. لو الدخول طالع "الحساب ده مش أدمن" → راجع الخطوة 1.

## الصفحة الرئيسية (السلايدر)
- السلايدر مش بيتبني في المتصفح: `api/src/lib/hero.js` بيكتبه جاهز جوه `public/index.html` بين علامات `<!-- mersal:hero -->` عشان أول صورة تظهر فوراً من غير فلاش.
- لوحة التحكم بتعمل ده لوحدها لما تحفظ "الرئيسية". لو عدّلت `content.json` يدوياً شغّل: `node tools/render-home.js`.
- كل شريحة: `banner` (1600×475، الصورة شمال والنص يمين)، وعلى الموبايل بيظهر جزء الصورة بس (`mobile` = قصّة الشمال 46%، بتتعمل تلقائياً) مع `kicker` / `title` / `text` / `button` / `link` / `focus`.

## السرعة والصور
- `tools/optimize_images.py` بيضغط كل الصور في `public/img` (JPEG بجودة 76 وبحد أقصى 1600px) وبيعمل نسخة `.webp` جنب كل صورة.
  شغّله بعد ما تضيف صور يدوياً في `public/img` (الصور اللي بتترفع من لوحة التحكم مش محتاجاه).
- الصور في الكروت والسلايدر بتتعرض عبر `mersalPic()` في `js/layout.js` (WebP + تحميل مؤجل).
- الكاش: الصور 30 يوم (أسماء ثابتة)، أما CSS/JS والصفحات 30 ثانية بس عشان أي نشر يظهر فوراً (في `staticwebapp.config.json`).

## المحتوى المنقول من الموقع القديم
`tools/import_old_site.py` بيقرا الموقع القديم (القايمة، كل صفحات الـCMS، السلايدر، طرق التبرع، الأرقام، المشاريع)
ويكتب `public/p/<id>.html` و`public/img/old/` و`public/data/menu.json` و`public/content.json`.
الروابط القديمة `/DynamicPage/RenderPage?id=N` بتتحول تلقائياً لـ `/p/N.html`.
بعد ما الموقع القديم يتقفل، عدّل الصفحات دي مباشرة.

## تعديل المحتوى (يدوي من الكود)
الأسهل من لوحة التحكم فوق. لو عايز تعدّل من الكود:
- الحملات: `public/content.json` (عنوان، نص، صورة، رابط، واختياري `goal`/`raised` لشريط التقدم).
- أرقام المحافظ/إنستاباي: `WALLETS` أول `public/js/donate.js`.
- التليفونات والعنوان والسوشيال: `SITE` أول `public/js/layout.js`.
