'use strict';
/* Sarrafino admin panel — in-app help, Persian · Turkish · English · Arabic */
HELP.add({
'admin.login': {
fa: ['ورود به پنل مدیریت', `- با همان ایمیل و رمز حساب صرافینو وارد شوید. فقط حساب‌هایی که «مدیر سامانه» هستند اجازه‌ی ورود دارند.
- اگر ورود دو مرحله‌ای روشن باشد، بعد از رمز کد ۶ رقمی برنامه‌ی Authenticator خواسته می‌شود.
- با 👁 رمز را ببینید یا پنهان کنید.`],
en: ['Admin sign-in', `- Sign in with your Sarrafino email and password. Only “platform admin” accounts may enter.
- If two-step login is on, the 6-digit Authenticator code is asked after the password.
- Use 👁 to show or hide the password.`],
tr: ['Yönetim paneline giriş', `- Sarrafino e-posta ve şifrenizle girin. Yalnızca “sistem yöneticisi” hesapları girebilir.
- İki adımlı giriş açıksa şifreden sonra Authenticator'daki 6 haneli kod istenir.
- Şifreyi göstermek veya gizlemek için 👁 kullanın.`],
ar: ['الدخول إلى لوحة الإدارة', `- ادخل ببريد وكلمة مرور حساب صرافينو. فقط حسابات «مدير المنصة» يمكنها الدخول.
- إذا كان الدخول بخطوتين مفعّلاً يُطلب رمز Authenticator المكوّن من 6 أرقام بعد كلمة المرور.
- استخدم 👁 لإظهار كلمة المرور أو إخفائها.`],
},
'admin.links': {
fa: ['دکمه‌های همه‌ی بخش‌ها', `نوار طلایی بالای پنل شما را به هر بخش سامانه می‌برد:
- **📈 ارزینو:** برنامه‌ی عمومی نرخ ارز.
- **🏪 پنل صرافی:** نرم‌افزار حسابداری صرافینو.
- **🛒 صفحه‌ی فروش:** سایت معرفی و قیمت‌ها برای صرافی‌ها.
- **📺 تابلوهای زنده:** فهرست صرافی‌ها با لینک تابلوی زنده و حالت تلویزیون هر کدام.
- **🗄 Supabase:** پایگاه داده و کاربران (پنل فنی).
- **🐙 GitHub:** کد برنامه.
- **📦 ساخت اپ اندروید:** آخرین فایل نصبی اندروید در بخش Actions.
! با دکمه‌ی «بازگشت» به صفحه‌ی قبل برمی‌گردید.`],
en: ['Buttons to every part', `The gold bar at the top takes you to every part of the system:
- **📈 Arzino:** the public exchange-rate app.
- **🏪 Exchange panel:** the Sarrafino accounting app.
- **🛒 Sales page:** the website with features and prices for exchange offices.
- **📺 Live boards:** every office with its live board link and TV mode.
- **🗄 Supabase:** the database and users (technical panel).
- **🐙 GitHub:** the app's code.
- **📦 Android build:** the latest Android install file under Actions.
! The “Back” button returns to the previous page.`],
tr: ['Tüm bölümlere düğmeler', `Üstteki altın renkli çubuk sizi sistemin her bölümüne götürür:
- **📈 Arzino:** herkese açık döviz kuru uygulaması.
- **🏪 Büro paneli:** Sarrafino muhasebe uygulaması.
- **🛒 Satış sayfası:** döviz bürolarına özellikler ve fiyatlar sitesi.
- **📺 Canlı panolar:** her büro, canlı pano bağlantısı ve TV moduyla.
- **🗄 Supabase:** veritabanı ve kullanıcılar (teknik panel).
- **🐙 GitHub:** uygulamanın kodu.
- **📦 Android derlemesi:** Actions altında en son Android kurulum dosyası.
! “Geri” düğmesi önceki sayfaya döner.`],
ar: ['أزرار لكل الأقسام', `الشريط الذهبي في الأعلى ينقلك إلى كل أجزاء المنظومة:
- **📈 أرزينو:** تطبيق أسعار الصرف العام.
- **🏪 لوحة الصرافة:** تطبيق المحاسبة صرافينو.
- **🛒 صفحة البيع:** موقع الميزات والأسعار لمكاتب الصرافة.
- **📺 اللوحات المباشرة:** كل مكتب مع رابط لوحته المباشرة ووضع التلفاز.
- **🗄 Supabase:** قاعدة البيانات والمستخدمون (لوحة تقنية).
- **🐙 GitHub:** شيفرة التطبيق.
- **📦 بناء أندرويد:** أحدث ملف تثبيت أندرويد في قسم Actions.
! زر «رجوع» يعيدك إلى الصفحة السابقة.`],
},
'admin.home': {
fa: ['خلاصه', `- **عددها:** تعداد صرافی‌ها، کاربران (و تازه‌واردهای ۷ روز اخیر)، اشتراک‌های فعال و آزمایشی، پرداخت‌های در انتظار و درآمد ۳۰ روز اخیر.
- اگر پرداختی منتظر تأیید باشد، روی تب «پرداخت‌ها» عدد قرمز دیده می‌شود.
- **راهنمای سریع:** ترتیب کارهای روزانه‌ی مدیر.`],
en: ['Overview', `- **Figures:** number of offices, users (and sign-ups in the last 7 days), active and trial subscriptions, pending payments and income of the last 30 days.
- When a payment waits for approval, a red number appears on the “Payments” tab.
- **Quick guide:** the order of an admin's daily tasks.`],
tr: ['Özet', `- **Rakamlar:** büro sayısı, kullanıcılar (ve son 7 günde katılanlar), aktif ve deneme abonelikleri, bekleyen ödemeler ve son 30 günün geliri.
- Onay bekleyen ödeme varsa “Ödemeler” sekmesinde kırmızı bir sayı görünür.
- **Hızlı rehber:** yöneticinin günlük işlerinin sırası.`],
ar: ['نظرة عامة', `- **الأرقام:** عدد المكاتب والمستخدمين (والمسجلين في آخر 7 أيام) والاشتراكات الفعّالة والتجريبية والمدفوعات المعلّقة ودخل آخر 30 يوماً.
- عند وجود دفعة بانتظار الموافقة يظهر رقم أحمر على تبويب «المدفوعات».
- **دليل سريع:** ترتيب المهام اليومية للمدير.`],
},
'admin.payments': {
fa: ['پرداخت‌ها و تأیید فیش', `صرافی‌ها بعد از واریز، عکس فیش را می‌فرستند و اینجا می‌آید.
- **🖼 فیش:** عکس فیش را باز کنید و مبلغ و تاریخ را با حساب بانکی خود مقایسه کنید.
- **✅ تأیید:** اشتراک خودکار فعال یا تمدید می‌شود (اگر همان پلن باشد، از تاریخ پایان فعلی تمدید می‌شود).
- **❌ رد:** با نوشتن دلیل؛ صرافی وضعیت «رد شد» را می‌بیند.
- پرداخت‌های قبلی با وضعیتشان پایین فهرست می‌مانند.
! پیش از تأیید حتماً رسیدن پول را در حساب بانکی بررسی کنید.`],
en: ['Payments and receipts', `Offices send a photo of the bank receipt after paying; it arrives here.
- **🖼 Receipt:** open the photo and compare amount and date with your bank account.
- **✅ Approve:** the subscription is activated or extended automatically (same plan = extended from the current end date).
- **❌ Reject:** with a reason; the office sees “rejected”.
- Earlier payments stay below with their status.
! Always confirm the money arrived in your bank account before approving.`],
tr: ['Ödemeler ve dekontlar', `Bürolar ödemeden sonra dekont fotoğrafı gönderir; buraya gelir.
- **🖼 Dekont:** fotoğrafı açıp tutar ve tarihi banka hesabınızla karşılaştırın.
- **✅ Onayla:** abonelik otomatik açılır veya uzar (aynı plan = mevcut bitiş tarihinden uzar).
- **❌ Reddet:** gerekçeyle; büro “reddedildi” görür.
- Önceki ödemeler durumlarıyla altta kalır.
! Onaylamadan önce paranın hesabınıza geldiğini mutlaka kontrol edin.`],
ar: ['المدفوعات والإيصالات', `ترسل المكاتب صورة إيصال التحويل بعد الدفع؛ وتصل إلى هنا.
- **🖼 الإيصال:** افتح الصورة وقارن المبلغ والتاريخ بحسابك البنكي.
- **✅ موافقة:** يُفعَّل الاشتراك أو يُمدَّد تلقائياً (الخطة نفسها = تمديد من تاريخ الانتهاء الحالي).
- **❌ رفض:** مع ذكر السبب؛ يرى المكتب «مرفوض».
- تبقى المدفوعات السابقة في الأسفل مع حالتها.
! تأكد دائماً من وصول المال إلى حسابك البنكي قبل الموافقة.`],
},
'admin.exchanges': {
fa: ['صرافی‌ها', `همه‌ی صرافی‌ها با مالک، پلن، وضعیت، تاریخ اعتبار و میزان مصرف (کاربر، مشتری، تراکنش).
- **جستجو** با نام صرافی یا مالک.
- روی هر صرافی بزنید تا پنجره‌ی مدیریت آن باز شود:
- **پلن، وضعیت و تاریخ اعتبار** را مستقیم عوض کنید؛ «+۱ ماه» و «+۱ سال» تمدید سریع است.
- **بسته‌ی اختصاصی:** برای همین صرافی تعداد کاربر، مشتری، زبان یا شعبه را جدا از پلن بگذارید و هر امکان را روشن یا خاموش کنید (خالی = طبق پلن).
- **یادداشت:** برای خودتان، مثلاً شرایط قرارداد.
! وضعیت «متوقف» دسترسی پولی را می‌بندد ولی داده‌ها پاک نمی‌شوند.`],
en: ['Exchange offices', `Every office with its owner, plan, status, valid-until date and usage (users, customers, transactions).
- **Search** by office or owner name.
- Tap an office to open its management window:
- Change **plan, status and expiry** directly; “+1 month” and “+1 year” are quick renewals.
- **Custom package:** set users, customers, languages or branches for this office apart from its plan, and switch each feature on or off (empty = as the plan).
- **Note:** for yourself, e.g. contract terms.
! “Suspended” closes paid access but deletes no data.`],
tr: ['Döviz büroları', `Her büro; sahibi, planı, durumu, geçerlilik tarihi ve kullanımıyla (kullanıcı, müşteri, işlem).
- Büro veya sahip adıyla **arama**.
- Yönetim penceresi için bir büroya dokunun:
- **Plan, durum ve bitiş tarihini** doğrudan değiştirin; “+1 ay” ve “+1 yıl” hızlı uzatmadır.
- **Özel paket:** bu büro için plandan ayrı kullanıcı, müşteri, dil veya şube sayısı belirleyin, her özelliği açıp kapatın (boş = plana göre).
- **Not:** kendiniz için, ör. sözleşme koşulları.
! “Askıda” ücretli erişimi kapatır ama veri silinmez.`],
ar: ['مكاتب الصرافة', `كل مكتب مع مالكه وخطته وحالته وتاريخ صلاحيته واستخدامه (المستخدمون والعملاء والمعاملات).
- **البحث** باسم المكتب أو المالك.
- اضغط مكتباً لفتح نافذة إدارته:
- غيّر **الخطة والحالة وتاريخ الانتهاء** مباشرة؛ «+1 شهر» و«+1 سنة» تمديد سريع.
- **باقة خاصة:** حدّد لهذا المكتب عدد المستخدمين أو العملاء أو اللغات أو الفروع بشكل منفصل عن الخطة وفعّل أو أوقف كل ميزة (فارغ = حسب الخطة).
- **ملاحظة:** لنفسك، مثل شروط العقد.
! «موقوف» يغلق الوصول المدفوع دون حذف البيانات.`],
},
'admin.plans': {
fa: ['پلن‌ها و قیمت', `بسته‌هایی که به صرافی‌ها می‌فروشید.
- برای هر پلن: **نام و توضیح در ۴ زبان**، **قیمت ماهانه و سالانه**، ارز قیمت.
- **محدودیت‌ها:** تعداد کاربر (کارمند و شریک)، مشتری، زبان و صرافی / شعبه.
- **امکانات:** تابلو، رسید واتس‌اپ، هزینه، امانت، گزارش سود، اکسل، شریک‌ها، تابلوی زنده، معرفی در ارزینو، حذف نام صرافینو.
- **نمایش عمومی:** پلن در صفحه‌ی فروش و داخل برنامه دیده شود یا نه.
- **پیشنهادی:** با نوار «پیشنهادی» برجسته می‌شود. **ترتیب** جای پلن را تعیین می‌کند.
! قیمت تازه فقط روی پرداخت‌های بعدی اثر دارد؛ اشتراک‌های فعلی تا پایان مدتشان می‌مانند.`],
en: ['Plans and prices', `The packages you sell to exchange offices.
- For each plan: **name and description in 4 languages**, **monthly and yearly price**, price currency.
- **Limits:** number of users (staff and partners), customers, languages and offices / branches.
- **Features:** board, WhatsApp receipt, expenses, trusts, profit report, Excel, partners, live board, Arzino listing, no Sarrafino branding.
- **Public:** whether the plan shows on the sales page and inside the app.
- **Recommended:** highlighted with a “recommended” ribbon. **Order** sets its position.
! A new price applies only to future payments; current subscriptions run until they end.`],
tr: ['Planlar ve fiyatlar', `Döviz bürolarına sattığınız paketler.
- Her plan için: **4 dilde ad ve açıklama**, **aylık ve yıllık fiyat**, fiyat dövizi.
- **Sınırlar:** kullanıcı (çalışan ve ortak), müşteri, dil ve büro / şube sayısı.
- **Özellikler:** pano, WhatsApp makbuzu, gider, emanet, kâr raporu, Excel, ortaklar, canlı pano, Arzino'da tanıtım, Sarrafino adı olmadan.
- **Herkese açık:** plan satış sayfasında ve uygulamada görünsün mü.
- **Önerilen:** “önerilen” şeridiyle öne çıkar. **Sıra** konumunu belirler.
! Yeni fiyat yalnızca sonraki ödemelere uygulanır; mevcut abonelikler sürelerinin sonuna kadar devam eder.`],
ar: ['الخطط والأسعار', `الباقات التي تبيعها لمكاتب الصرافة.
- لكل خطة: **الاسم والوصف بأربع لغات**، **السعر الشهري والسنوي**، عملة السعر.
- **الحدود:** عدد المستخدمين (الموظفين والشركاء) والعملاء واللغات والمكاتب / الفروع.
- **الميزات:** اللوحة، إيصال واتساب، المصروفات، الأمانات، تقرير الأرباح، إكسل، الشركاء، اللوحة المباشرة، الظهور في أرزينو، دون اسم صرافينو.
- **عامة:** هل تظهر الخطة في صفحة البيع وداخل التطبيق.
- **موصى بها:** تُبرز بشريط «موصى بها». **الترتيب** يحدد موقعها.
! السعر الجديد يسري على المدفوعات القادمة فقط؛ تستمر الاشتراكات الحالية حتى نهايتها.`],
},
'admin.users': {
fa: ['کاربران', `همه‌ی کسانی که ثبت‌نام کرده‌اند با نام، ایمیل، تلفن، کشور، تاریخ ثبت‌نام، آخرین ورود و صرافی‌هایشان.
- ⏳ کنار ایمیل یعنی ایمیل هنوز تأیید نشده.
- **جستجو** در همه‌ی ستون‌ها و **📊 Excel** برای دانلود فهرست.
- **🔐 2FA** یعنی ورود دو مرحله‌ای کاربر روشن است. «بازنشانی 2FA» برای وقتی است که کاربر گوشی‌اش را گم کرده؛ بعد از آن با رمز وارد می‌شود و می‌تواند دوباره آن را روشن کند.
! بازنشانی را فقط وقتی انجام دهید که از هویت کاربر مطمئن هستید (مثلاً تماس تلفنی).`],
en: ['Users', `Everyone who signed up, with name, email, phone, country, sign-up date, last sign-in and their offices.
- ⏳ next to an email means it is not confirmed yet.
- **Search** across all columns and **📊 Excel** to download the list.
- **🔐 2FA** means the user's two-step login is on. “Reset 2FA” is for a user who lost their phone; they then sign in with the password and can turn it on again.
! Reset only when you are sure of the user's identity (e.g. by phone call).`],
tr: ['Kullanıcılar', `Kaydolan herkes; ad, e-posta, telefon, ülke, kayıt tarihi, son giriş ve bürolarıyla.
- E-postanın yanındaki ⏳ henüz onaylanmadığını gösterir.
- Tüm sütunlarda **arama** ve listeyi indirmek için **📊 Excel**.
- **🔐 2FA** kullanıcının iki adımlı girişinin açık olduğunu gösterir. “2FA sıfırla” telefonunu kaybeden kullanıcı içindir; sonra şifreyle girer ve yeniden açabilir.
! Yalnızca kullanıcının kimliğinden eminseniz sıfırlayın (ör. telefonla arayarak).`],
ar: ['المستخدمون', `كل من سجّل، مع الاسم والبريد والهاتف والدولة وتاريخ التسجيل وآخر دخول ومكاتبه.
- ⏳ بجانب البريد يعني أنه لم يُؤكَّد بعد.
- **بحث** في كل الأعمدة و**📊 Excel** لتنزيل القائمة.
- **🔐 2FA** يعني أن الدخول بخطوتين مفعّل لدى المستخدم. «إعادة ضبط 2FA» لمن فقد هاتفه؛ بعدها يدخل بكلمة المرور ويمكنه تفعيله من جديد.
! لا تُعِد الضبط إلا إذا تأكدت من هوية المستخدم (مثلاً باتصال هاتفي).`],
},
'admin.ads': {
fa: ['تبلیغات ارزینو', `## تنظیمات پخش
- **روشن / خاموش** کل تبلیغات؛ «مشترک‌های پولی صرافینو تبلیغ نبینند».
- **AdSense:** کد ناشر (ca-pub-…) و زبان‌هایی که تبلیغ گوگل در آن‌ها پخش شود (فارسی را گوگل پشتیبانی نمی‌کند).
- **بنر بالای بازار**، **لابه‌لای فهرست** (هر چند ردیف یک تبلیغ، حداکثر ۳) و **زیر مبدل**.
- **تمام‌صفحه:** بعد از چند کار کاربر، از چندمین باز کردن برنامه، حداقل فاصله بین دو نمایش (دقیقه)، ثانیه‌های شمارش اجباری و حداکثر تعداد در روز.
- **تبلیغ با جایزه:** کاربر یک تبلیغ را کامل می‌بیند و چند ساعت بی‌تبلیغ می‌شود.
## تبلیغ‌های اختصاصی (اسپانسر)
- عنوان، متن و دکمه در ۴ زبان، تصویر، لینک، زبان‌ها، جاهای نمایش، وزن (احتمال نمایش)، تاریخ شروع و پایان.
- آمار **نمایش** و **کلیک** هر تبلیغ را می‌بینید؛ برای گزارش به اسپانسر مناسب است.
! تبلیغ گوگل در پنجره‌ی تمام‌صفحه مجاز نیست؛ آنجا فقط تبلیغ اختصاصی پخش می‌شود. برای گوگل‌پلی شمارش اجباری را کوتاه (حداکثر ۵ ثانیه) نگه دارید.`],
en: ['Arzino ads', `## Delivery settings
- Switch all ads **on / off**; “paid Sarrafino subscribers see no ads”.
- **AdSense:** publisher ID (ca-pub-…) and the languages Google ads run in (Google does not support Persian).
- **Banner above the market**, **inside the list** (one ad every N rows, at most 3) and **below the converter**.
- **Full screen:** after how many user actions, from which app opening, the minimum gap between two (minutes), forced countdown seconds and the daily maximum.
- **Reward ad:** the user watches one ad fully and gets some hours without ads.
## Sponsor ads
- Title, text and button in 4 languages, image, link, languages, placements, weight (chance of showing), start and end dates.
- You see **impressions** and **clicks** for each ad, handy for sponsor reports.
! Google ads are not allowed in full-screen pop-ups; only sponsor ads run there. For Google Play keep the forced countdown short (at most 5 seconds).`],
tr: ['Arzino reklamları', `## Yayın ayarları
- Tüm reklamları **aç / kapat**; “ücretli Sarrafino aboneleri reklam görmesin”.
- **AdSense:** yayıncı kimliği (ca-pub-…) ve Google reklamlarının çıkacağı diller (Google Farsçayı desteklemez).
- **Piyasa üstü afiş**, **liste arası** (her N satırda bir, en fazla 3) ve **çevirici altı**.
- **Tam ekran:** kaç kullanıcı işleminden sonra, kaçıncı açılıştan itibaren, iki gösterim arası en az süre (dakika), zorunlu geri sayım saniyesi ve günlük üst sınır.
- **Ödüllü reklam:** kullanıcı bir reklamı tamamen izler, birkaç saat reklamsız olur.
## Sponsor reklamları
- 4 dilde başlık, metin ve düğme, görsel, bağlantı, diller, yerleşimler, ağırlık (gösterilme şansı), başlangıç ve bitiş tarihi.
- Her reklamın **gösterim** ve **tıklama** sayısını görürsünüz; sponsor raporu için idealdir.
! Google reklamları tam ekran pencerede yasaktır; orada yalnızca sponsor reklamı çıkar. Google Play için zorunlu geri sayımı kısa tutun (en fazla 5 saniye).`],
ar: ['إعلانات أرزينو', `## إعدادات العرض
- **تشغيل / إيقاف** كل الإعلانات؛ «لا يرى مشتركو صرافينو المدفوعون إعلانات».
- **AdSense:** معرّف الناشر (ca-pub-…) واللغات التي تُعرض فيها إعلانات Google (لا تدعم Google الفارسية).
- **لافتة أعلى السوق** و**داخل القائمة** (إعلان كل N صفوف، 3 كحد أقصى) و**أسفل المحوّل**.
- **ملء الشاشة:** بعد كم إجراء للمستخدم، ومن أي مرة فتح للتطبيق، وأقل فاصل بين عرضين (دقائق)، وثواني العد الإجباري، والحد اليومي.
- **إعلان بمكافأة:** يشاهد المستخدم إعلاناً كاملاً فيحصل على ساعات بلا إعلانات.
## إعلانات الرعاة
- العنوان والنص والزر بأربع لغات، والصورة والرابط واللغات وأماكن الظهور والوزن (فرصة الظهور) وتاريخا البدء والانتهاء.
- ترى عدد **مرات الظهور** و**النقرات** لكل إعلان، مفيد لتقارير الرعاة.
! إعلانات Google ممنوعة في النوافذ المنبثقة بملء الشاشة؛ يُعرض هناك إعلان الراعي فقط. لـ Google Play اجعل العد الإجباري قصيراً (5 ثوانٍ كحد أقصى).`],
},
'admin.settings': {
fa: ['تنظیمات سامانه', `- **🔐 امنیت حساب:** ورود دو مرحله‌ای برای حساب مدیر. بسیار توصیه می‌شود.
- **اطلاعات واریز:** شماره حساب، IBAN، نام صاحب حساب یا آدرس کیف پول؛ برای هر زبان جدا. هنگام خرید پلن به صرافی نشان داده می‌شود.
- **راهنمای زیر اطلاعات واریز:** مثلاً «شماره سفارش را در توضیح واریز بنویسید».
- **دوره‌ی آزمایشی:** پلن و تعداد روز برای صرافی‌های تازه. **پلن رایگان:** پلنی که بعد از تمام شدن اشتراک استفاده می‌شود.
- **تماس:** شماره واتس‌اپ پشتیبانی (برای دکمه‌ی صفحه‌ی فروش)، ایمیل و نام برند.`],
en: ['Platform settings', `- **🔐 Account security:** two-step login for the admin account. Strongly recommended.
- **Payment details:** account number, IBAN, account holder or wallet address, separately per language. Shown to offices when they buy a plan.
- **Note under payment details:** e.g. “write your order number in the transfer description”.
- **Trial:** plan and number of days for new offices. **Free plan:** the plan used after a subscription ends.
- **Contact:** support WhatsApp number (for the sales page button), email and brand name.`],
tr: ['Sistem ayarları', `- **🔐 Hesap güvenliği:** yönetici hesabı için iki adımlı giriş. Şiddetle önerilir.
- **Ödeme bilgileri:** hesap numarası, IBAN, hesap sahibi veya cüzdan adresi; her dil için ayrı. Plan satın alırken bürolara gösterilir.
- **Ödeme bilgisi altındaki not:** ör. “havale açıklamasına sipariş numarasını yazın”.
- **Deneme süresi:** yeni bürolar için plan ve gün sayısı. **Ücretsiz plan:** abonelik bitince kullanılan plan.
- **İletişim:** destek WhatsApp numarası (satış sayfası düğmesi için), e-posta ve marka adı.`],
ar: ['إعدادات المنصة', `- **🔐 أمان الحساب:** الدخول بخطوتين لحساب المدير. يُنصح به بشدة.
- **بيانات الدفع:** رقم الحساب وIBAN واسم صاحب الحساب أو عنوان المحفظة، لكل لغة على حدة. تُعرض للمكاتب عند شراء خطة.
- **ملاحظة أسفل بيانات الدفع:** مثل «اكتب رقم الطلب في وصف التحويل».
- **الفترة التجريبية:** الخطة وعدد الأيام للمكاتب الجديدة. **الخطة المجانية:** الخطة المستخدمة بعد انتهاء الاشتراك.
- **التواصل:** رقم واتساب الدعم (لزر صفحة البيع) والبريد واسم العلامة.`],
},
'admin.brand': {
fa: ['نام و لوگوی هر بخش', `سامانه چهار بخش دارد و نام و لوگوی هر کدام اینجا عوض می‌شود:
- **ارزینو:** برنامه‌ی عمومی نرخ ارز برای همه‌ی مردم؛ درآمدش از تبلیغات است.
- **صرافینو:** پنل حسابداری که به صرافی‌ها اشتراک می‌فروشید.
- **صفحه‌ی فروش:** سایت معرفی و قیمت‌ها برای جذب صرافی‌ها.
- **پنل مدیریت:** همین پنل، فقط برای شما.
## چطور
- برای هر بخش، نام را در هر زبان بنویسید. اگر خالی بماند، نام پیش‌فرض (که کم‌رنگ نوشته شده) استفاده می‌شود.
- با «🖼 لوگو» تصویر را انتخاب کنید؛ خودکار مربع و کوچک می‌شود. «حذف لوگو» به نشان پیش‌فرض برمی‌گردد.
- «ذخیره» را بزنید؛ همه‌ی صفحه‌ها در بازدید بعدی نام و لوگوی تازه را نشان می‌دهند.
! این‌ها برند خود شماست. نام و لوگوی هر صرافی (روی تابلو، رسید و سربرگ پنلش) را خود صرافی در «تابلو ← ظاهر و اطلاعات تابلو» و «بیشتر ← صرافی» عوض می‌کند. نام برنامه‌ی نصب‌شده‌ی اندروید و نام فایل نصب گوشی ثابت است و با به‌روزرسانی بعدی اپ عوض می‌شود.`],
en: ['Name and logo of each part', `The system has four parts; each one's name and logo are changed here:
- **Arzino:** the public exchange-rate app for everyone; it earns from ads.
- **Sarrafino:** the accounting panel you sell to exchange offices by subscription.
- **Sales page:** the website with features and prices to win offices.
- **Admin panel:** this panel, for you only.
## How
- For each part, write the name in every language. Left empty, the default name (shown faintly) is used.
- Pick an image with “🖼 Logo”; it is squared and shrunk automatically. “Remove logo” goes back to the default mark.
- Tap “Save”; every page shows the new name and logo on the next visit.
! These are your own brand. Each exchange office changes its own name and logo (on its board, receipts and panel header) in Board → Board look and More → Office. The installed Android app's name is fixed and changes with the next app build.`],
tr: ['Her bölümün adı ve logosu', `Sistem dört bölümden oluşur; her birinin adı ve logosu burada değişir:
- **Arzino:** herkese açık döviz kuru uygulaması; geliri reklamdır.
- **Sarrafino:** döviz bürolarına abonelikle sattığınız muhasebe paneli.
- **Satış sayfası:** büroları kazanmak için özellikler ve fiyatlar sitesi.
- **Yönetim paneli:** bu panel, yalnızca sizin için.
## Nasıl
- Her bölüm için adı her dilde yazın. Boş kalırsa varsayılan ad (soluk yazılı) kullanılır.
- “🖼 Logo” ile resim seçin; otomatik kare ve küçük yapılır. “Logoyu kaldır” varsayılan işarete döner.
- “Kaydet”e dokunun; tüm sayfalar bir sonraki ziyarette yeni ad ve logoyu gösterir.
! Bunlar sizin markanızdır. Her büro kendi adını ve logosunu (panosunda, makbuzlarında ve panel başlığında) Pano → Pano görünümü ve Diğer → Büro bölümünden değiştirir. Kurulu Android uygulamasının adı sabittir, bir sonraki uygulama derlemesinde değişir.`],
ar: ['اسم وشعار كل قسم', `للمنظومة أربعة أقسام، ويُغيَّر هنا اسم كل منها وشعاره:
- **أرزينو:** تطبيق أسعار الصرف العام للجميع؛ دخله من الإعلانات.
- **صرافينو:** لوحة المحاسبة التي تبيعها لمكاتب الصرافة بالاشتراك.
- **صفحة البيع:** موقع الميزات والأسعار لجذب المكاتب.
- **لوحة الإدارة:** هذه اللوحة، لك وحدك.
## الطريقة
- اكتب اسم كل قسم بكل لغة. إن بقي فارغاً يُستخدم الاسم الافتراضي (المكتوب بلون باهت).
- اختر صورة بـ «🖼 الشعار»؛ تُربَّع وتُصغَّر تلقائياً. «حذف الشعار» يعيد العلامة الافتراضية.
- اضغط «حفظ»؛ تعرض كل الصفحات الاسم والشعار الجديدين في الزيارة التالية.
! هذه علامتك التجارية. كل مكتب صرافة يغيّر اسمه وشعاره (على لوحته وإيصالاته ورأس لوحته) من اللوحة ← مظهر اللوحة ومن المزيد ← المكتب. اسم تطبيق أندرويد المثبّت ثابت ويتغير مع البناء التالي للتطبيق.`],
},
'admin.security': {
fa: ['ورود دو مرحله‌ای مدیر', `حساب مدیر به همه‌ی صرافی‌ها و پرداخت‌ها دسترسی دارد؛ حتماً ورود دو مرحله‌ای را روشن کنید.
1) Google Authenticator یا Microsoft Authenticator را روی گوشی نصب کنید.
2) «فعال کردن» را بزنید و QR را با برنامه اسکن کنید.
3) کد ۶ رقمی را وارد کنید.
بعد از روشن شدن، پایگاه داده هم بدون کد به داده‌های مدیر جواب نمی‌دهد.
! اگر گوشی مدیر گم شود، در Supabase ← SQL این دستور را اجرا کنید: delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'ایمیل شما');`],
en: ['Admin two-step login', `The admin account reaches every office and payment; turn two-step login on.
1) Install Google Authenticator or Microsoft Authenticator on your phone.
2) Tap “Turn on” and scan the QR code with the app.
3) Enter the 6-digit code.
Once on, the database itself refuses admin data without the code.
! If the admin phone is lost, run in Supabase → SQL: delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'your email');`],
tr: ['Yönetici için iki adımlı giriş', `Yönetici hesabı tüm bürolara ve ödemelere erişir; iki adımlı girişi mutlaka açın.
1) Telefona Google Authenticator veya Microsoft Authenticator kurun.
2) “Aç”a dokunun ve QR kodu uygulamayla tarayın.
3) 6 haneli kodu girin.
Açıldıktan sonra veritabanı da kod olmadan yönetici verisi vermez.
! Yönetici telefonu kaybolursa Supabase → SQL'de çalıştırın: delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'e-postanız');`],
ar: ['الدخول بخطوتين للمدير', `حساب المدير يصل إلى كل المكاتب والمدفوعات؛ فعّل الدخول بخطوتين حتماً.
1) ثبّت Google Authenticator أو Microsoft Authenticator على هاتفك.
2) اضغط «تفعيل» وامسح رمز QR بالتطبيق.
3) أدخل الرمز المكوّن من 6 أرقام.
بعد التفعيل ترفض قاعدة البيانات نفسها بيانات المدير دون الرمز.
! إذا فُقد هاتف المدير فنفّذ في Supabase ← SQL: delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'بريدك');`],
},
});
