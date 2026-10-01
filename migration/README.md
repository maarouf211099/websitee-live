# خطة نقل موقع مرسال من GCP إلى Azure

> الطريقة المختارة: **Azure VM ويندوز + IIS** للتطبيقات، و**SQL Server 2022 على VM** للداتابيز.
> ده نقل "زي ما هو" (lift-and-shift) لأن الموقع متجمّع ومفيش سورس، فأقل تعديلات = أقل مخاطرة.
> الملف ده آمن للمشاركة — مفيش أسرار.

## الصورة الحالية والمستهدفة

```
الحالي (GCP)                                   المستهدف (Azure, uaenorth)
─────────────                                  ──────────────────────────
INSTANCE-9  (IIS, Windows)                     vm-mersal-web  (IIS, Win 2022, IP ثابت)
  Default Web Site → C:\Data\userui  (UserUI)    نفس المواقع ونفس المسارات C:\Data\...
  /MersalAPI /UserManagementAPI /SysCodeAPI      ↑ يتنقلوا كلهم مع بعض
  /NotificationAPI /SysCodeUI /UserManagmentUI
  SignalR (:8083 / :443)
SQL Server 10.128.0.14                         vm-mersal-db (SQL 2022 Web, بدون IP عام)
  mersal_DB_prod_fixed + باقي القواعد             يوصل له الـweb VM بس (1433)
OneDrive/clientfileslayout (405 GB متداخل)      Storage Account (Blob) — مرحلة لاحقة
                                               Recovery Services Vault — باك أب يومي للاتنين
```

الريبو ده فيه **UserUI بس**. باقي التطبيقات (الـAPIs) موجودة على السيرفر فقط، فبننقلها من السيرفر مباشرة
بالسكربتات، مش من GitHub.

## المراحل

| # | المرحلة | فين | السكربت | توقف للموقع؟ |
|---|---|---|---|---|
| 1 | جرد السيرفر الحالي (مواقع، APIs، أحجام، داتابيز، مهام مجدولة) | INSTANCE-9 | `01-inventory.ps1` (قراءة فقط) | لا |
| 2 | حل مشكلة الـ405 جيجا وتحديد الداتا الحقيقية | INSTANCE-9 | نتايج المرحلة 1 (`reparse-points.txt`, `folder-sizes.tsv`) | لا |
| 3 | إنشاء موارد Azure | Cloud Shell | `02-provision-azure.sh` | لا |
| 4 | تجهيز الـweb VM (IIS, ASP.NET 4.8, URL Rewrite, WebDeploy) | Azure web VM | `03-setup-web-vm.ps1` | لا |
| 5 | تصدير الكود وإعدادات IIS ورفعهم لـBlob | INSTANCE-9 | `04-export-from-old-server.ps1` + azcopy | لا |
| 6 | استيراد على Azure وتعديل عناوين الداتابيز والـIP | Azure web VM | `05-import-on-web-vm.ps1` | لا |
| 7 | نسخة تجريبية من الداتابيز (COPY_ONLY) واستعادتها | SQL القديم ← Azure DB VM | `06-database.md` | لا |
| 8 | أسرار جديدة: باسورد `sa` جديد، باسورد بنك مصر، SMTP — حطها في الـconfigs الجديدة بس | Azure | يدوي | لا |
| 9 | شهادة SSL لـ`mersal-ngo.org` (نقل الحالية أو win-acme / Let's Encrypt) | Azure web VM | يدوي | لا |
| 10 | **اختبار كامل** عن طريق ملف hosts (تحت) | جهازك | — | لا |
| 11 | **النقل الفعلي** (cutover) | الكل | تحت | **أيوه، ~1–2 ساعة** |
| 12 | بعد النقل: مراقبة أسبوعين، وبعدها نقل الصور لـBlob وإطفاء GCP | Azure | — | لا |

### المرحلة 10 — إزاي نختبر من غير ما نلمس الموقع الحقيقي
على جهاز الاختبار بس، ضيف في `C:\Windows\System32\drivers\etc\hosts`:
```
<Azure web public IP>   mersal-ngo.org
<Azure web public IP>   www.mersal-ngo.org
```
كده المتصفح بتاعك بس هيفتح نسخة Azure على نفس الدومين. وده بيحل مشكلة الـ`returnUrl` المكتوب جوا
`UserUI.dll` — البنك هيرجّعك لـ`www.mersal-ngo.org` وجهازك هيوديه لـAzure.
والـVM نفسه متظبط (`03-setup-web-vm.ps1`) إن `mersal-ngo.org` يشاور على نفسه، علشان الـUserUI ميكلّمش الـAPIs
القديمة والداتابيز الحقيقية بالغلط.

**قائمة الاختبار:**
- [ ] الصفحة الرئيسية، الحالات، الحملات، الصور
- [ ] تسجيل الدخول / إنشاء حساب (UserManagement)
- [ ] لوحة الأدمن (SysCodeUI / UserManagmentUI)
- [ ] الإشعارات والإيميل (SMTP — Gmail ممكن يطلب تأكيد بسبب IP جديد)
- [ ] SignalR (الإشعارات اللحظية)
- [ ] تبرّع حقيقي صغير → `CAPTURED` + إيصال + التبرع ظاهر في الداتابيز **الجديدة**
- [ ] التقارير (Reports1)

> الداتا في المرحلة دي نسخة قديمة — أي تبرعات تجريبية مش هتظهر في الموقع الحقيقي. اعمل refund لأي دفع حقيقي من بوابة MPGS.

### المرحلة 11 — يوم النقل
**قبلها بـ48 ساعة:** قلّل TTL لسجلات DNS (`@` و`www`) لـ300 ثانية. واسأل بنك مصر لو عندهم whitelist لعناوين IP للتاجر `MERSAL` وابعتلهم الـIP الجديد.

1. صفحة صيانة على INSTANCE-9 (`app_offline.htm` في `C:\Data\userui` وكل API) — علشان محدش يتبرع أثناء النقل.
2. باك أب نهائي للداتابيز ← azcopy ← restore على Azure (`06-database.md`، قسم cutover).
3. robocopy أخير لأي ملفات اتغيّرت (`04-export-from-old-server.ps1` تاني، ونسخ `ClientFiles`/`ActivityImages`).
4. اختبار سريع بملف hosts.
5. غيّر DNS: `@` و`www` ← IP الـAzure.
6. تبرّع حقيقي واحد على الدومين بعد ما الـDNS يتحدّث.
7. **الرجوع (rollback):** لو حاجة كبيرة فشلت — رجّع الـDNS للـIP القديم وشيل `app_offline.htm`. السيرفر القديم يفضل
   شغال (بس مقفول) **أسبوعين** قبل ما يتطفي.

## مخاطر لازم تتعرف قبل البدء
1. **الـ405 جيجا:** داتا مرسال الحقيقية (صور الحالات) جوا فولدر OneDrive بتاع الشركة المورّدة. لازم نحدد
   الداتا الحقيقية ونفصلها قبل النقل؛ سكربت التصدير بيستثني الفولدرات دي وبيتخطى الـjunctions (`/XJ`).
2. **مفيش سورس:** أي تعديل في السلوك (زي الـ`returnUrl`) محتاج تعديل DLL. اطلب السورس من `smarttechsys`.
3. **الأسرار المكشوفة:** متنقلش الباسوردات القديمة. أسرار جديدة من أول يوم على Azure (المرحلة 8).
4. **مكونات مش معروفة لسه:** مهام مجدولة، Windows services، Crystal Reports، SignalR كخدمة منفصلة — الجرد
   (المرحلة 1) هيبيّنهم، والخطة ممكن تتعدل بعده.
5. **SQL Web edition** مسموحة للمواقع العامة بس؛ لو فيه استخدام داخلي تاني للداتابيز ممكن نحتاج Standard.

## المطلوب علشان نبدأ
- [ ] تشغيل `01-inventory.ps1` على INSTANCE-9 وإرسال فولدر `C:\Temp\mersal-inventory`
- [ ] صلاحية على الـAzure subscription (Contributor على resource group)، أو تشغيل `02-provision-azure.sh` بنفسك من Cloud Shell
- [ ] الـIP العام بتاع المكتب (علشان RDP يبقى مسموح منه بس)
- [ ] موافقة على المنطقة (`uaenorth` مقترحة — الأقرب لمصر)
