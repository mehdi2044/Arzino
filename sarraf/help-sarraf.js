'use strict';
/* Sarrafino — in-app help for every screen and form, in Persian · Turkish · English · Arabic */
HELP.add({
'sarraf.start': {
fa: ['ورود و ثبت‌نام', `## ثبت‌نام
- نام، نام خانوادگی، موبایل (با کد کشور، مثلاً +90)، کشور، ایمیل و رمز (حداقل ۶ حرف) را بنویسید.
- یک لینک تأیید به ایمیلتان می‌آید؛ روی آن بزنید تا وارد شوید. اگر ایمیل نیامد، پوشه‌ی Spam را ببینید.
- اگر صاحب یک صرافی شما را دعوت کرده، **با همان ایمیلی که داده** ثبت‌نام کنید تا خودکار به آن صرافی وصل شوید.
## ورود
- ایمیل و رمز را بنویسید. با دکمه‌ی 👁 می‌توانید رمز را ببینید.
- اگر ورود دو مرحله‌ای را روشن کرده باشید، بعد از رمز یک کد ۶ رقمی از برنامه‌ی Authenticator گوشی خواسته می‌شود.
## رمز را فراموش کرده‌اید؟
«رمز را فراموش کرده‌اید؟» را بزنید، ایمیل را بنویسید؛ لینک ساخت رمز تازه برایتان فرستاده می‌شود.
! بعد از اولین ورود، صرافی خود را با نام و ارز گزارش سود می‌سازید و ۱۴ روز همه‌ی امکانات رایگان است.`],
en: ['Sign in and sign up', `## Sign up
- Enter first and last name, mobile (with country code, e.g. +90), country, email and a password (at least 6 characters).
- A confirmation link is emailed to you; tap it to sign in. If it does not arrive, check the Spam folder.
- If an exchange owner invited you, sign up **with the same email they used** and you are joined to that office automatically.
## Sign in
- Enter your email and password. The 👁 button shows the password.
- If two-step login is on, a 6-digit code from the Authenticator app on your phone is asked after the password.
## Forgot your password?
Tap “Forgot your password?”, enter your email and you get a link to set a new one.
! After the first sign-in you create your office with a name and a profit-report currency; all features are free for 14 days.`],
tr: ['Giriş ve kayıt', `## Kayıt
- Ad, soyad, cep telefonu (ülke koduyla, ör. +90), ülke, e-posta ve şifre (en az 6 karakter) girin.
- E-postanıza bir onay bağlantısı gelir; girmek için ona dokunun. Gelmezse Spam klasörüne bakın.
- Bir büro sahibi sizi davet ettiyse **verdiği e-postayla** kaydolun; o büroya otomatik bağlanırsınız.
## Giriş
- E-posta ve şifrenizi girin. 👁 düğmesi şifreyi gösterir.
- İki adımlı giriş açıksa şifreden sonra telefondaki Authenticator uygulamasından 6 haneli kod istenir.
## Şifrenizi mi unuttunuz?
“Şifrenizi mi unuttunuz?”a dokunun, e-postanızı yazın; yeni şifre bağlantısı gönderilir.
! İlk girişten sonra büronuzu bir ad ve kâr raporu dövizi ile kurarsınız; 14 gün tüm özellikler ücretsizdir.`],
ar: ['الدخول والتسجيل', `## التسجيل
- أدخل الاسم واسم العائلة والجوال (مع رمز الدولة، مثل +90) والدولة والبريد الإلكتروني وكلمة مرور (6 أحرف على الأقل).
- يصلك رابط تأكيد على بريدك؛ اضغطه للدخول. إن لم يصل فافحص مجلد الرسائل غير المرغوبة.
- إذا دعاك صاحب مكتب صرافة فسجّل **بالبريد نفسه الذي استخدمه** لتنضم إلى مكتبه تلقائياً.
## الدخول
- أدخل البريد وكلمة المرور. زر 👁 يُظهر كلمة المرور.
- إذا كان الدخول بخطوتين مفعّلاً يُطلب بعد كلمة المرور رمز من 6 أرقام من تطبيق Authenticator على هاتفك.
## نسيت كلمة المرور؟
اضغط «نسيت كلمة المرور؟» واكتب بريدك؛ يصلك رابط لتعيين كلمة جديدة.
! بعد أول دخول تنشئ مكتبك باسم وعملة لتقرير الأرباح؛ كل الميزات مجانية لمدة 14 يوماً.`],
},
'sarraf.home': {
fa: ['داشبورد', `خلاصه‌ی وضعیت صرافی در یک نگاه.
- **نوار پلن:** نام پلن و روزهای باقی‌مانده؛ برای تمدید یا ارتقا روی آن بزنید.
- **یادآوری تابلو:** در ساعت‌هایی که در بخش تابلو تعیین کرده‌اید، پیام «وقت ارسال تابلو» می‌آید.
- **دکمه‌های سریع:** معامله، واریز / پرداخت، امانت، هزینه.
- **موجودی صندوق‌ها:** پول نقد، حساب‌های بانکی و کیف پول‌ها. «🔁 انتقال» برای جابه‌جایی یا تبدیل بین صندوق‌هاست.
- **امروز:** تعداد معامله‌ها و (برای مالک و شریک) سود معاملات امروز.
- **طلب و بدهی مشتری‌ها:** جمع طلب ما از مشتری‌ها و بدهی ما به آن‌ها، جدا برای هر ارز.
- **نرخ‌های امروز:** نرخ خرید و فروش تابلو در کنار نرخ بازار.
! دکمه‌ی ↻ بالای صفحه همه‌ی اعداد را از سرور تازه می‌کند.`],
en: ['Dashboard', `Your office at a glance.
- **Plan bar:** your plan and days left; tap it to renew or upgrade.
- **Board reminder:** at the times you set in the Board section, a “time to send the board” note appears.
- **Quick buttons:** trade, deposit / payment, trust, expense.
- **Cash boxes:** cash, bank accounts and wallets. “🔁 Transfer” moves or converts money between boxes.
- **Today:** number of trades and (for owner and partners) today's trading profit.
- **Customer balances:** what customers owe us and what we owe them, per currency.
- **Today's rates:** your board's buy and sell rates next to the market rate.
! The ↻ button at the top reloads all numbers from the server.`],
tr: ['Gösterge paneli', `Büronuz tek bakışta.
- **Plan çubuğu:** planınız ve kalan gün; yenilemek veya yükseltmek için dokunun.
- **Pano hatırlatması:** Pano bölümünde belirlediğiniz saatlerde “panoyu gönderme zamanı” uyarısı çıkar.
- **Hızlı düğmeler:** işlem, yatırma / ödeme, emanet, gider.
- **Kasalar:** nakit, banka hesapları ve cüzdanlar. “🔁 Transfer” kasalar arasında para taşır veya çevirir.
- **Bugün:** işlem sayısı ve (sahip ve ortaklar için) bugünkü işlem kârı.
- **Müşteri bakiyeleri:** müşterilerin bize ve bizim müşterilere borcu, döviz bazında.
- **Bugünkü kurlar:** panonuzun alış ve satış kurları, piyasa kuru yanında.
! Üstteki ↻ düğmesi tüm rakamları sunucudan yeniler.`],
ar: ['لوحة التحكم', `مكتبك بنظرة واحدة.
- **شريط الخطة:** خطتك والأيام المتبقية؛ اضغطه للتجديد أو الترقية.
- **تذكير اللوحة:** في الأوقات التي حددتها في قسم اللوحة يظهر تنبيه «وقت إرسال اللوحة».
- **الأزرار السريعة:** معاملة، إيداع / دفع، أمانة، مصروف.
- **الصناديق:** النقد والحسابات البنكية والمحافظ. «🔁 تحويل» ينقل المال أو يحوّله بين الصناديق.
- **اليوم:** عدد المعاملات و(للمالك والشركاء) ربح معاملات اليوم.
- **ذمم العملاء:** ما يدين به العملاء لنا وما ندين به لهم، لكل عملة.
- **أسعار اليوم:** أسعار الشراء والبيع في لوحتك بجانب سعر السوق.
! زر ↻ في الأعلى يعيد تحميل كل الأرقام من الخادم.`],
},
'sarraf.txns': {
fa: ['دفتر — همه‌ی تراکنش‌ها', `فهرست همه‌ی معامله‌ها، واریز و پرداخت‌ها، امانت‌ها، هزینه‌ها و انتقال‌ها (۳۰۰ مورد آخر).
- **جستجو:** در توضیحات یا نام مشتری.
- **فیلتر نوع:** فقط معامله‌ها، فقط هزینه‌ها و …
- روی هر ردیف بزنید تا جزئیات، ردیف‌های حسابداری و دکمه‌ی **رسید واتس‌اپ** را ببینید.
- مالک و شریک سود هر معامله (نسبت به نرخ بازار) را کنار ردیف می‌بینند.
- **باطل کردن:** مالک یا شریک با نوشتن دلیل، تراکنش اشتباه را باطل می‌کند. تراکنش پاک نمی‌شود؛ خط‌خورده می‌ماند و از همه‌ی مانده‌ها حذف می‌شود.
! برای اصلاح یک اشتباه، تراکنش را باطل کنید و نسخه‌ی درست را دوباره ثبت کنید.`],
en: ['Ledger — all transactions', `Every trade, deposit and payment, trust, expense and transfer (latest 300).
- **Search:** in notes or customer names.
- **Type filter:** only trades, only expenses and so on.
- Tap a row to see details, the accounting lines and the **WhatsApp receipt** button.
- Owner and partners see each trade's profit (against the market rate) next to it.
- **Void:** the owner or a partner voids a wrong entry with a reason. It is not deleted; it stays crossed out and leaves all balances.
! To fix a mistake, void the entry and record the correct one again.`],
tr: ['Defter — tüm işlemler', `Tüm alım-satımlar, yatırma ve ödemeler, emanetler, giderler ve transferler (son 300).
- **Arama:** açıklamalarda veya müşteri adlarında.
- **Tür filtresi:** yalnızca işlemler, yalnızca giderler vb.
- Ayrıntılar, muhasebe satırları ve **WhatsApp makbuzu** düğmesi için bir satıra dokunun.
- Sahip ve ortaklar her işlemin (piyasa kuruna göre) kârını yanında görür.
- **İptal:** sahip veya ortak, hatalı kaydı bir gerekçeyle iptal eder. Silinmez; üstü çizili kalır ve tüm bakiyelerden çıkar.
! Bir hatayı düzeltmek için kaydı iptal edip doğrusunu yeniden girin.`],
ar: ['الدفتر — كل المعاملات', `كل معاملات الصرف والإيداعات والمدفوعات والأمانات والمصروفات والتحويلات (آخر 300).
- **بحث:** في الملاحظات أو أسماء العملاء.
- **تصفية حسب النوع:** معاملات فقط أو مصروفات فقط وهكذا.
- اضغط صفاً لرؤية التفاصيل وقيود المحاسبة وزر **إيصال واتساب**.
- يرى المالك والشركاء ربح كل معاملة (مقارنةً بسعر السوق) بجانبها.
- **الإلغاء:** يلغي المالك أو الشريك القيد الخاطئ مع ذكر السبب. لا يُحذف؛ يبقى مشطوباً ويخرج من كل الأرصدة.
! لتصحيح خطأ ألغِ القيد وسجّل الصحيح من جديد.`],
},
'sarraf.customers': {
fa: ['مشتری‌ها', `فهرست همه‌ی مشتری‌ها با مانده‌ی هر ارز.
- **جستجو** با نام یا تلفن.
- **فیلترها:** بدهکارها (به ما بدهکارند)، طلبکارها (ما به آن‌ها بدهکاریم)، امانت‌ها.
- **+ مشتری:** مشتری تازه با نام، تلفن و توضیح. تعداد مشتری‌ها به پلن شما بستگی دارد.
- برچسب‌ها مانده را نشان می‌دهند: «بدهکار» یعنی مشتری به ما بدهکار است، «طلبکار» یعنی ما به او بدهکاریم. امانت جدا نشان داده می‌شود.
- روی هر مشتری بزنید تا صورت‌حساب کاملش باز شود.
! «مشتری گذری» برای معامله‌های نقدی بدون نام است و نسیه نمی‌پذیرد.`],
en: ['Customers', `All customers with their balance in each currency.
- **Search** by name or phone.
- **Filters:** debtors (they owe us), creditors (we owe them), trusts.
- **+ Customer:** a new customer with name, phone and notes. The number of customers depends on your plan.
- Labels show the balance: “owes” means the customer owes us, “credit” means we owe them. Trusts are shown separately.
- Tap a customer to open the full statement.
! “Walk-in customer” is for cash deals without a name and cannot carry credit.`],
tr: ['Müşteriler', `Tüm müşteriler ve her dövizdeki bakiyeleri.
- **Arama:** ad veya telefonla.
- **Filtreler:** borçlular (bize borçlu), alacaklılar (biz borçluyuz), emanetler.
- **+ Müşteri:** ad, telefon ve notla yeni müşteri. Müşteri sayısı planınıza bağlıdır.
- Etiketler bakiyeyi gösterir: “borçlu” müşterinin bize borcu, “alacaklı” bizim ona borcumuzdur. Emanetler ayrı gösterilir.
- Tam hesap dökümü için bir müşteriye dokunun.
! “Geçici müşteri” isimsiz nakit işlemler içindir; veresiye olamaz.`],
ar: ['العملاء', `كل العملاء مع رصيد كل عملة.
- **البحث** بالاسم أو الهاتف.
- **التصفية:** المدينون (يدينون لنا)، الدائنون (ندين لهم)، الأمانات.
- **+ عميل:** عميل جديد بالاسم والهاتف وملاحظة. عدد العملاء يعتمد على خطتك.
- تُظهر الوسوم الرصيد: «مدين» أي العميل يدين لنا، «دائن» أي نحن ندين له. الأمانات تظهر منفصلة.
- اضغط عميلاً لفتح كشف حسابه الكامل.
! «العميل العابر» للمعاملات النقدية بلا اسم ولا يقبل الآجل.`],
},
'sarraf.customer': {
fa: ['صورت‌حساب مشتری', `همه‌چیز درباره‌ی یک مشتری.
- **حساب جاری:** مانده‌ی هر ارز (بدهکار یا طلبکار).
- **امانت:** پولی که امانت پیش او یا پیش ما است؛ جدا از حساب جاری.
- **✏️** ویرایش نام، تلفن، توضیح یا بایگانی مشتری.
- **💬 واتس‌اپ:** گفتگو با مشتری (اگر شماره ثبت شده باشد).
- **📥 صورت‌حساب اکسل:** فایل کامل برای فرستادن به مشتری (در پلن‌های دارای اکسل).
- دکمه‌های سریع اینجا مشتری را از پیش انتخاب می‌کنند.
- **صورت‌حساب:** هر ردیف با تاریخ، شرح، مبلغ و مانده‌ی پس از آن. مبلغ مثبت یعنی مشتری بدهکار شد، منفی یعنی طلبکار شد.`],
en: ['Customer statement', `Everything about one customer.
- **Current account:** balance per currency (owes or credit).
- **Trust:** money held in trust with them or with us, kept apart from the current account.
- **✏️** edit name, phone, notes or archive the customer.
- **💬 WhatsApp:** chat with the customer (if a number is saved).
- **📥 Excel statement:** a full file to send to the customer (on plans with Excel).
- The quick buttons here pre-select this customer.
- **Statement:** each line with date, description, amount and the balance after it. A positive amount means the customer now owes more; negative means credit.`],
tr: ['Müşteri hesap dökümü', `Bir müşteriyle ilgili her şey.
- **Cari hesap:** döviz bazında bakiye (borçlu veya alacaklı).
- **Emanet:** onda ya da bizde emanet duran para; cari hesaptan ayrı.
- **✏️** ad, telefon, not düzenleme veya müşteriyi arşivleme.
- **💬 WhatsApp:** müşteriyle yazışma (numara kayıtlıysa).
- **📥 Excel döküm:** müşteriye gönderilecek tam dosya (Excel içeren planlarda).
- Buradaki hızlı düğmeler bu müşteriyi önceden seçer.
- **Döküm:** her satır tarih, açıklama, tutar ve sonraki bakiyeyle. Pozitif tutar müşterinin borcunun arttığını, negatif alacak olduğunu gösterir.`],
ar: ['كشف حساب العميل', `كل ما يخص عميلاً واحداً.
- **الحساب الجاري:** الرصيد لكل عملة (مدين أو دائن).
- **الأمانة:** مال مودع لديه أو لدينا، منفصل عن الحساب الجاري.
- **✏️** تعديل الاسم أو الهاتف أو الملاحظة أو أرشفة العميل.
- **💬 واتساب:** محادثة العميل (إن كان الرقم محفوظاً).
- **📥 كشف إكسل:** ملف كامل لإرساله للعميل (في الخطط التي تتضمن إكسل).
- الأزرار السريعة هنا تختار هذا العميل مسبقاً.
- **الكشف:** كل سطر بالتاريخ والبيان والمبلغ والرصيد بعده. المبلغ الموجب يعني زيادة دين العميل، والسالب يعني رصيداً له.`],
},
'sarraf.board': {
fa: ['تابلوی نرخ', `## نرخ‌های امروز صرافی
- **خرید** = نرخی که از مشتری می‌خرید · **فروش** = نرخی که به مشتری می‌فروشید. این نرخ‌ها پیش‌فرض فرم معامله هم هستند.
- **✋ دستی:** نرخ‌ها فقط وقتی عوض می‌شوند که خودتان بنویسید و «ذخیره» بزنید. «⚡ پر کردن از بازار» همه را یک‌جا از نرخ بازار و درصدها پر می‌کند.
- **⚡ خودکار از بازار:** نرخ‌ها هر چند دقیقه خودکار حساب می‌شوند: خرید = بازار منهای درصد خرید، فروش = بازار به‌اضافه‌ی درصد فروش. این نرخ در تابلو، تصویر، تابلوی زنده، فرم معامله و ارزینو یکی است.
- **📌 ثابت:** در حالت خودکار، یک ردیف را با 📌 روی نرخ فعلی ثابت کنید تا دیگر با بازار عوض نشود.
- **٪ درصد جداگانه هر ارز:** درصدهای بالا پیش‌فرض همه ارزهاست. با دکمه‌ی ٪ کنار هر ردیف، برای همان ارز درصد خرید و فروش جدا بنویسید (خالی = پیش‌فرض) و «ذخیره» بزنید.
- **گرد کردن تومان:** مثلاً به ۱۰ یا ۱۰۰ تومان.
- با «+ ردیف» جفت‌ارز تازه اضافه کنید و با ✕ حذف کنید.
## تابلوی دیجیتال برای واتس‌اپ
- تصویر زیبای نرخ‌ها در سه اندازه: پست، استوری، مربع.
- **📤 ارسال تصویر** واتس‌اپ را باز می‌کند؛ یک **لیست پخش** (Broadcast) از مشتری‌ها بسازید تا پیام برای هر نفر خصوصی برود.
- **چه چیزی ارسال شود؟** فقط تصویر، فقط متن، یا هر دو با هم.
- **متن پیام:** فقط نرخ‌ها، فقط متن دلخواه شما، یا هر دو. متن دلخواه یک بار نوشته می‌شود و می‌ماند؛ پیش‌نمایش را همان‌جا می‌بینید.
- **📋 کپی متن** و **⬇️ دانلود تصویر** هم هست.
- **ساعت‌های یادآوری:** تا سه ساعت در روز؛ در آن ساعت‌ها داشبورد یادآوری می‌کند.
## ظاهر و اطلاعات تابلو (مالک و شریک)
- لوگو، تلفن، آدرس، متن پایین، رنگ و نوع ارقام.
- **تابلوی زنده:** یک لینک عمومی که همیشه نرخ روز را نشان می‌دهد؛ برای تلویزیون مغازه یا وضعیت واتس‌اپ (پلن حرفه‌ای).
- **صرافی‌های همکار ارزینو:** صرافی شما با نرخ‌ها در ارزینو دیده می‌شود (پلن حرفه‌ای).
! واتس‌اپ اجازه‌ی ارسال کاملاً خودکار نمی‌دهد. با حالت خودکار، تصویر همیشه آماده و به‌روز است و فقط یک لمس برای ارسال لازم است. لینک تابلوی زنده را هم یک بار بفرستید؛ مشتری هر وقت باز کند نرخ لحظه‌ای را می‌بیند.`],
en: ['Rate board', `## Today's office rates
- **Buy** = the rate you buy from customers · **Sell** = the rate you sell to customers. They are also the defaults in the trade form.
- **✋ Manual:** rates change only when you type them and tap Save. “⚡ Fill from market” fills them all from the market rate and your percentages.
- **⚡ Automatic from market:** rates are recalculated every few minutes: buy = market minus the buy %, sell = market plus the sell %. The same rate is used on the board, the image, the live board, the trade form and in Arzino.
- **📌 Fixed:** in automatic mode, pin a row with 📌 to keep its current rate and stop it following the market.
- **٪ Own percentages per currency:** the percentages above are the default for all currencies. Tap ٪ on a row to give that currency its own buy and sell percentage (empty = default), then Save.
- **Toman rounding:** e.g. to 10 or 100 toman.
- Add a currency pair with “+ Row”, remove it with ✕.
## Digital board for WhatsApp
- A clean image of your rates in three sizes: post, story, square.
- **📤 Send image** opens WhatsApp; make a **broadcast list** of customers so each person gets it privately.
- **What to send:** image only, text only, or both together.
- **Message text:** rates only, your own text only, or both. Your text is written once and kept; a preview is shown.
- **📋 Copy text** and **⬇️ Download image** are also there.
- **Reminder times:** up to three a day; the dashboard reminds you at those times.
## Board look and details (owner and partners)
- Logo, phone, address, footer note, colour and digit style.
- **Live board:** a public link that always shows today's rates, for the shop TV or WhatsApp status (Pro plan).
- **Arzino partner exchanges:** your office appears in Arzino with its rates (Pro plan).
! WhatsApp does not allow fully automatic sending. In automatic mode the image is always ready and current, so sending is one tap. Share the live board link once; customers see the current rate whenever they open it.`],
tr: ['Kur panosu', `## Büronun bugünkü kurları
- **Alış** = müşteriden aldığınız kur · **Satış** = müşteriye sattığınız kur. İşlem formunda da varsayılandır.
- **✋ Elle:** kurlar yalnızca siz yazıp Kaydet'e bastığınızda değişir. “⚡ Piyasadan doldur” hepsini piyasa kuru ve yüzdelerle doldurur.
- **⚡ Piyasadan otomatik:** kurlar birkaç dakikada bir yeniden hesaplanır: alış = piyasa eksi alış yüzdesi, satış = piyasa artı satış yüzdesi. Aynı kur panoda, görselde, canlı panoda, işlem formunda ve Arzino'da kullanılır.
- **📌 Sabit:** otomatik modda bir satırı 📌 ile mevcut kurda sabitleyin; artık piyasayı izlemez.
- **٪ Dövize özel yüzde:** yukarıdaki yüzdeler tüm dövizler için varsayılandır. Bir satırdaki ٪ ile o dövize ayrı alış/satış yüzdesi girin (boş = varsayılan) ve Kaydet'e basın.
- **Toman yuvarlama:** ör. 10 veya 100 tomana.
- “+ Satır” ile döviz çifti ekleyin, ✕ ile silin.
## WhatsApp için dijital pano
- Kurlarınızın şık bir görseli, üç boyutta: gönderi, hikâye, kare.
- **📤 Görseli gönder** WhatsApp'ı açar; müşterilerden bir **toplu mesaj listesi** oluşturun, herkese ayrı ve özel gider.
- **Ne gönderilsin:** yalnız görsel, yalnız metin veya ikisi birlikte.
- **Mesaj metni:** yalnız kurlar, yalnız kendi metniniz veya ikisi. Metniniz bir kez yazılır ve saklanır; önizlemesi görünür.
- **📋 Metni kopyala** ve **⬇️ Görseli indir** de var.
- **Hatırlatma saatleri:** günde üçe kadar; gösterge paneli o saatlerde hatırlatır.
## Pano görünümü ve bilgileri (sahip ve ortaklar)
- Logo, telefon, adres, alt yazı, renk ve rakam türü.
- **Canlı pano:** her zaman günün kurunu gösteren herkese açık bağlantı; dükkân televizyonu veya WhatsApp durumu için (Pro plan).
- **Arzino ortak bürolar:** büronuz kurlarıyla Arzino'da görünür (Pro plan).
! WhatsApp tamamen otomatik gönderime izin vermez. Otomatik modda görsel hep hazır ve günceldir; göndermek tek dokunuştur. Canlı pano bağlantısını bir kez paylaşın; müşteri her açtığında güncel kuru görür.`],
ar: ['لوحة الأسعار', `## أسعار المكتب اليوم
- **الشراء** = السعر الذي تشتري به من العميل · **البيع** = السعر الذي تبيع به للعميل. وهي أيضاً الافتراضية في نموذج المعاملة.
- **✋ يدوي:** تتغير الأسعار فقط عندما تكتبها وتضغط حفظ. «⚡ تعبئة من السوق» يملؤها كلها من سعر السوق والنسب.
- **⚡ تلقائي من السوق:** تُعاد حساب الأسعار كل بضع دقائق: الشراء = السوق ناقص نسبة الشراء، البيع = السوق زائد نسبة البيع. السعر نفسه يُستخدم في اللوحة والصورة واللوحة المباشرة ونموذج المعاملة وفي أرزينو.
- **📌 ثابت:** في الوضع التلقائي ثبّت صفاً بـ 📌 على سعره الحالي فلا يتبع السوق بعدها.
- **٪ نسبة خاصة لكل عملة:** النسب أعلاه افتراضية لكل العملات. اضغط ٪ بجانب الصف لتحدد لتلك العملة نسبة شراء وبيع خاصة (فارغ = الافتراضي) ثم احفظ.
- **تقريب التومان:** مثلاً إلى 10 أو 100 تومان.
- أضف زوج عملات بـ «+ صف» واحذفه بـ ✕.
## لوحة رقمية لواتساب
- صورة أنيقة لأسعارك بثلاثة مقاسات: منشور، قصة، مربع.
- **📤 إرسال الصورة** يفتح واتساب؛ أنشئ **قائمة بث** للعملاء ليصل لكل شخص بشكل خاص.
- **ماذا يُرسل:** الصورة فقط، أو النص فقط، أو الاثنان معاً.
- **نص الرسالة:** الأسعار فقط، أو نصك فقط، أو الاثنان. يُكتب نصك مرة ويُحفظ مع معاينة.
- يوجد أيضاً **📋 نسخ النص** و**⬇️ تنزيل الصورة**.
- **أوقات التذكير:** حتى ثلاثة في اليوم؛ تذكّرك لوحة التحكم في تلك الأوقات.
## مظهر اللوحة ومعلوماتها (المالك والشركاء)
- الشعار والهاتف والعنوان والنص السفلي واللون ونوع الأرقام.
- **اللوحة المباشرة:** رابط عام يعرض دائماً سعر اليوم، لتلفاز المحل أو حالة واتساب (الخطة الاحترافية).
- **مكاتب أرزينو الشريكة:** يظهر مكتبك بأسعاره في أرزينو (الخطة الاحترافية).
! واتساب لا يسمح بالإرسال التلقائي الكامل. في الوضع التلقائي تكون الصورة جاهزة ومحدّثة دائماً والإرسال بلمسة واحدة. شارك رابط اللوحة المباشرة مرة واحدة؛ يرى العميل السعر الحالي كلما فتحه.`],
},
'sarraf.reports': {
fa: ['گزارش‌ها', `(فقط برای مالک و شریک؛ کارمند فقط موجودی صندوق‌ها را می‌بیند.)
- **سود و زیان:** امروز، ۷ روز، ۳۰ روز یا یک سال. سود معاملات نسبت به نرخ بازار، منهای هزینه‌ها، به ارز گزارش صرافی.
- **موجودی ارزی خالص:** برای هر ارز: صندوق + طلب از مشتری − بدهی به مشتری ± امانت، و ارزش آن با نرخ امروز بازار.
- **ارزش خالص کل صرافی:** جمع همه‌ی ارزها به ارز گزارش.
- **خروجی اکسل:** دفتر معاملات، مانده‌ی مشتری‌ها و موجودی صندوق‌ها (در پلن‌های دارای اکسل).
! ارز گزارش را در «بیشتر ← صرافی» عوض کنید.`],
en: ['Reports', `(Owner and partners only; staff see only the cash boxes.)
- **Profit and loss:** today, 7 days, 30 days or a year. Trading profit against the market rate, minus expenses, in the office's report currency.
- **Net currency position:** for each currency: boxes + owed by customers − owed to customers ± trusts, valued at today's market rate.
- **Total net worth:** all currencies together in the report currency.
- **Excel export:** ledger, customer balances and cash boxes (on plans with Excel).
! Change the report currency in More → Office.`],
tr: ['Raporlar', `(Yalnızca sahip ve ortaklar; çalışanlar yalnızca kasaları görür.)
- **Kâr ve zarar:** bugün, 7 gün, 30 gün veya bir yıl. Piyasa kuruna göre işlem kârı, giderler düşülmüş, büronun rapor dövizinde.
- **Net döviz pozisyonu:** her döviz için: kasalar + müşteri borçları − müşterilere borç ± emanet; bugünkü piyasa kuruyla değeri.
- **Toplam net değer:** tüm dövizler rapor dövizinde.
- **Excel çıktısı:** defter, müşteri bakiyeleri ve kasalar (Excel içeren planlarda).
! Rapor dövizini Diğer → Büro bölümünden değiştirin.`],
ar: ['التقارير', `(للمالك والشركاء فقط؛ يرى الموظف الصناديق فقط.)
- **الأرباح والخسائر:** اليوم أو 7 أيام أو 30 يوماً أو سنة. ربح المعاملات مقارنةً بسعر السوق ناقص المصروفات، بعملة تقرير المكتب.
- **صافي مركز العملات:** لكل عملة: الصناديق + ما على العملاء − ما لهم ± الأمانات، وقيمتها بسعر السوق اليوم.
- **صافي قيمة المكتب:** كل العملات معاً بعملة التقرير.
- **تصدير إكسل:** الدفتر وأرصدة العملاء والصناديق (في الخطط التي تتضمن إكسل).
! غيّر عملة التقرير من المزيد ← المكتب.`],
},
'sarraf.more': {
fa: ['بیشتر — تنظیمات صرافی', `- **پلن و مصرف:** پلن فعلی، تاریخ اعتبار و میزان استفاده از کاربر، مشتری و زبان. «پلن‌ها و اشتراک» برای خرید یا تمدید.
- **زبان‌ها:** زبان‌هایی که کارمندان صرافی می‌توانند انتخاب کنند (تعداد به پلن بستگی دارد).
- **🔐 امنیت حساب:** روشن کردن ورود دو مرحله‌ای.
- **دکمه‌های مدیریتی:** آورده / برداشت شریک، موجودی اول دوره، انتقال بین صندوق‌ها، صندوق جدید.
- **صندوق‌ها:** روی هر صندوق بزنید تا ویرایش یا بایگانی شود.
- **اعضای صرافی:** شریک‌ها و کارمندها؛ «دعوت» برای افزودن عضو تازه.
- **پشتیبان کامل:** فایل اکسل یا فایل بازیابی از همه‌ی داده‌ها. هفته‌ای یک بار بگیرید.
- **صرافی:** نام صرافی، ارز گزارش سود، ساخت صرافی دیگر، خروج از حساب.`],
en: ['More — office settings', `- **Plan and usage:** current plan, valid-until date and usage of users, customers and languages. “Plans and subscription” to buy or renew.
- **Languages:** which languages the office staff may use (the number depends on the plan).
- **🔐 Account security:** turn on two-step login.
- **Manager buttons:** partner capital in / out, opening balances, transfer between boxes, new box.
- **Cash boxes:** tap a box to edit or archive it.
- **Members:** partners and staff; “Invite” adds a new member.
- **Full backup:** an Excel file or a restore file with all data. Take one every week.
- **Office:** office name, profit report currency, create another office, sign out.`],
tr: ['Diğer — büro ayarları', `- **Plan ve kullanım:** mevcut plan, geçerlilik tarihi ve kullanıcı, müşteri, dil kullanımı. Satın almak veya yenilemek için “Planlar ve abonelik”.
- **Diller:** büro çalışanlarının kullanabileceği diller (sayı plana bağlıdır).
- **🔐 Hesap güvenliği:** iki adımlı girişi açın.
- **Yönetici düğmeleri:** ortak sermaye girişi / çıkışı, açılış bakiyeleri, kasalar arası transfer, yeni kasa.
- **Kasalar:** düzenlemek veya arşivlemek için bir kasaya dokunun.
- **Üyeler:** ortaklar ve çalışanlar; yeni üye için “Davet”.
- **Tam yedek:** tüm verilerle Excel dosyası veya geri yükleme dosyası. Haftada bir alın.
- **Büro:** büro adı, kâr raporu dövizi, başka büro kurma, çıkış.`],
ar: ['المزيد — إعدادات المكتب', `- **الخطة والاستخدام:** الخطة الحالية وتاريخ الصلاحية واستخدام المستخدمين والعملاء واللغات. «الخطط والاشتراك» للشراء أو التجديد.
- **اللغات:** اللغات التي يمكن لموظفي المكتب استخدامها (العدد حسب الخطة).
- **🔐 أمان الحساب:** تفعيل الدخول بخطوتين.
- **أزرار الإدارة:** إيداع / سحب الشريك، أرصدة أول المدة، التحويل بين الصناديق، صندوق جديد.
- **الصناديق:** اضغط صندوقاً لتعديله أو أرشفته.
- **الأعضاء:** الشركاء والموظفون؛ «دعوة» لإضافة عضو جديد.
- **نسخة احتياطية كاملة:** ملف إكسل أو ملف استعادة بكل البيانات. خذ واحدة كل أسبوع.
- **المكتب:** اسم المكتب وعملة تقرير الأرباح وإنشاء مكتب آخر وتسجيل الخروج.`],
},
'sarraf.plans': {
fa: ['پلن‌ها و اشتراک', `## انتخاب پلن
- ماهانه یا سالانه (سالانه ارزان‌تر است). هر کارت تعداد کاربر، مشتری، زبان و امکانات پلن را نشان می‌دهد.
## پرداخت با فیش بانکی
1) روی «انتخاب» یا «تمدید» بزنید.
2) اطلاعات حساب برای واریز نمایش داده می‌شود؛ مبلغ را واریز کنید.
3) عکس فیش را انتخاب کنید و «ارسال» بزنید.
4) پرداخت «در انتظار تأیید» می‌ماند؛ بعد از بررسی، اشتراک خودکار فعال یا تمدید می‌شود.
- پایین صفحه سابقه‌ی پرداخت‌ها و وضعیت هر کدام را می‌بینید.
! اگر اشتراک تمام شود هیچ داده‌ای پاک نمی‌شود؛ صرافی روی پلن رایگان می‌ماند و فقط امکانات پولی بسته می‌شود.`],
en: ['Plans and subscription', `## Choose a plan
- Monthly or yearly (yearly is cheaper). Each card shows the plan's users, customers, languages and features.
## Pay by bank transfer
1) Tap “Choose” or “Renew”.
2) The account details for payment appear; transfer the amount.
3) Pick a photo of the receipt and tap “Send”.
4) The payment stays “pending” until checked; then the subscription is activated or extended automatically.
- Your payment history and the status of each one are at the bottom.
! When a subscription ends no data is deleted; the office stays on the free plan and only paid features close.`],
tr: ['Planlar ve abonelik', `## Plan seçin
- Aylık veya yıllık (yıllık daha ucuz). Her kart planın kullanıcı, müşteri, dil ve özelliklerini gösterir.
## Banka havalesiyle ödeme
1) “Seç” veya “Yenile”ye dokunun.
2) Ödeme için hesap bilgileri görünür; tutarı yatırın.
3) Dekontun fotoğrafını seçip “Gönder”e dokunun.
4) Ödeme kontrol edilene kadar “onay bekliyor” kalır; sonra abonelik otomatik açılır veya uzar.
- Ödeme geçmişi ve her birinin durumu en alttadır.
! Abonelik bitince hiçbir veri silinmez; büro ücretsiz planda kalır, yalnızca ücretli özellikler kapanır.`],
ar: ['الخطط والاشتراك', `## اختر خطة
- شهري أو سنوي (السنوي أرخص). تُظهر كل بطاقة عدد المستخدمين والعملاء واللغات وميزات الخطة.
## الدفع بتحويل بنكي
1) اضغط «اختيار» أو «تجديد».
2) تظهر بيانات الحساب للدفع؛ حوّل المبلغ.
3) اختر صورة الإيصال واضغط «إرسال».
4) يبقى الدفع «بانتظار الموافقة» حتى يُراجع؛ ثم يُفعَّل الاشتراك أو يُمدَّد تلقائياً.
- سجل المدفوعات وحالة كل منها في الأسفل.
! عند انتهاء الاشتراك لا تُحذف أي بيانات؛ يبقى المكتب على الخطة المجانية وتُغلق الميزات المدفوعة فقط.`],
},
'sarraf.security': {
fa: ['ورود دو مرحله‌ای', `با روشن کردن آن، برای ورود علاوه بر رمز، یک کد ۶ رقمی از گوشی شما لازم است. اگر کسی رمز شما را بداند، بدون گوشی‌تان نمی‌تواند وارد شود. رایگان است و پیامک لازم ندارد.
## روشن کردن
1) برنامه‌ی **Google Authenticator** یا **Microsoft Authenticator** را از فروشگاه گوشی نصب کنید.
2) «فعال کردن ورود دو مرحله‌ای» را بزنید؛ یک QR نمایش داده می‌شود.
3) در برنامه «+» را بزنید و QR را اسکن کنید (یا کد دستی را بنویسید).
4) کد ۶ رقمی که برنامه نشان می‌دهد را وارد کنید.
## هنگام ورود
بعد از رمز، برنامه را باز کنید و کد ۶ رقمی فعلی را بنویسید. کد هر ۳۰ ثانیه عوض می‌شود.
! اگر گوشی را گم کردید، مدیر سامانه می‌تواند ورود دو مرحله‌ای حساب شما را بازنشانی کند.`],
en: ['Two-step login', `When it is on, signing in needs a 6-digit code from your phone in addition to the password. Someone who knows your password cannot get in without your phone. It is free and needs no SMS.
## Turn it on
1) Install **Google Authenticator** or **Microsoft Authenticator** from your phone's app store.
2) Tap “Turn on two-step login”; a QR code appears.
3) In the app tap “+” and scan the QR code (or type the manual code).
4) Enter the 6-digit code the app shows.
## At sign-in
After the password, open the app and type the current 6-digit code. It changes every 30 seconds.
! If you lose your phone, the platform admin can reset your two-step login.`],
tr: ['İki adımlı giriş', `Açıkken girişte şifreye ek olarak telefonunuzdan 6 haneli bir kod gerekir. Şifrenizi bilen biri telefonunuz olmadan giremez. Ücretsizdir, SMS gerekmez.
## Açmak için
1) Telefonunuzun mağazasından **Google Authenticator** veya **Microsoft Authenticator** kurun.
2) “İki adımlı girişi aç”a dokunun; bir QR kod çıkar.
3) Uygulamada “+”ya dokunup QR kodu tarayın (veya elle kodu yazın).
4) Uygulamanın gösterdiği 6 haneli kodu girin.
## Girişte
Şifreden sonra uygulamayı açıp güncel 6 haneli kodu yazın. Kod her 30 saniyede değişir.
! Telefonunuzu kaybederseniz sistem yöneticisi iki adımlı girişinizi sıfırlayabilir.`],
ar: ['الدخول بخطوتين', `عند تفعيله يحتاج الدخول إلى رمز من 6 أرقام من هاتفك إضافةً إلى كلمة المرور. من يعرف كلمة مرورك لا يستطيع الدخول دون هاتفك. مجاني ولا يحتاج رسائل نصية.
## التفعيل
1) ثبّت **Google Authenticator** أو **Microsoft Authenticator** من متجر هاتفك.
2) اضغط «تفعيل الدخول بخطوتين»؛ يظهر رمز QR.
3) في التطبيق اضغط «+» وامسح رمز QR (أو اكتب الرمز اليدوي).
4) أدخل الرمز المكوّن من 6 أرقام الذي يظهره التطبيق.
## عند الدخول
بعد كلمة المرور افتح التطبيق واكتب الرمز الحالي. يتغير الرمز كل 30 ثانية.
! إذا فقدت هاتفك يستطيع مدير المنصة إعادة ضبط الدخول بخطوتين لحسابك.`],
},
'sarraf.f.trade': {
fa: ['فرم معامله', `خرید و فروش هر ارز با هر ارز.
- **مشتری:** پیش‌فرض «مشتری گذری» برای معامله‌ی نقدی. برای نسیه، مشتری با نام انتخاب کنید یا «+ جدید» بزنید.
- **مشتری می‌دهد:** مبلغ و ارزی که از مشتری می‌گیریم و صندوقی که پول در آن آمد. اگر هنوز پولی نداده، «دریافت نشد» را انتخاب کنید تا بدهکار شود.
- **نرخ:** خودکار از تابلوی نرخ می‌آید (اگر نبود، از آخرین معامله یا بازار). زیرش نرخ بازار و میانگین خرید شما دیده می‌شود.
- **مشتری می‌گیرد:** با نوشتن مبلغ و نرخ خودکار حساب می‌شود. اگر این مبلغ را بنویسید، نرخ حساب می‌شود.
- **صندوق پرداخت:** از کجا پرداخت شد؛ اگر هنوز نپرداخته‌اید «پرداخت نشد» تا مشتری طلبکار شود.
- پیش‌نمایش پایین فرم خلاصه‌ی معامله و (برای مدیر) سود آن را نشان می‌دهد.
! بعد از ثبت، دکمه‌ی رسید واتس‌اپ برای فرستادن به مشتری نمایش داده می‌شود.`],
en: ['Trade form', `Buy and sell any currency against any other.
- **Customer:** “Walk-in customer” by default for cash deals. For credit, pick a named customer or tap “+ New”.
- **Customer gives:** the amount and currency we receive and the box it went into. If they have not paid yet, choose “not received” so they owe it.
- **Rate:** comes from your rate board (otherwise from the last trade or the market). The market rate and your average buy rate are shown below.
- **Customer gets:** calculated from the amount and rate. If you type this amount instead, the rate is calculated.
- **Paid from:** the box you paid from; if not paid yet choose “not paid” so the customer is credited.
- The preview at the bottom summarises the trade and (for managers) its profit.
! After saving, a WhatsApp receipt button appears to send to the customer.`],
tr: ['İşlem formu', `Her dövizi her dövizle alıp satın.
- **Müşteri:** nakit işlemler için varsayılan “Geçici müşteri”. Veresiye için isimli müşteri seçin veya “+ Yeni”ye dokunun.
- **Müşteri veriyor:** aldığımız tutar ve döviz ile paranın girdiği kasa. Henüz ödemediyse “alınmadı” seçin, borçlu olur.
- **Kur:** kur panonuzdan gelir (yoksa son işlemden veya piyasadan). Altında piyasa kuru ve ortalama alış kurunuz görünür.
- **Müşteri alıyor:** tutar ve kurdan hesaplanır. Bu tutarı yazarsanız kur hesaplanır.
- **Ödendiği kasa:** ödemenin yapıldığı kasa; henüz ödenmediyse “ödenmedi” seçin, müşteri alacaklı olur.
- Alttaki önizleme işlemi ve (yönetici için) kârını özetler.
! Kaydettikten sonra müşteriye göndermek için WhatsApp makbuzu düğmesi çıkar.`],
ar: ['نموذج المعاملة', `بيع وشراء أي عملة مقابل أي عملة.
- **العميل:** افتراضياً «العميل العابر» للمعاملات النقدية. للآجل اختر عميلاً باسمه أو اضغط «+ جديد».
- **العميل يعطي:** المبلغ والعملة التي نستلمها والصندوق الذي دخل فيه المال. إن لم يدفع بعد اختر «لم يُستلم» ليصبح مديناً.
- **السعر:** يأتي من لوحة أسعارك (وإلا من آخر معاملة أو من السوق). يظهر أسفله سعر السوق ومتوسط سعر شرائك.
- **العميل يأخذ:** يُحسب من المبلغ والسعر. إذا كتبت هذا المبلغ يُحسب السعر.
- **دُفع من:** الصندوق الذي دفعت منه؛ إن لم تدفع بعد اختر «لم يُدفع» ليصبح العميل دائناً.
- المعاينة في الأسفل تلخص المعاملة و(للمدير) ربحها.
! بعد الحفظ يظهر زر إيصال واتساب لإرساله للعميل.`],
},
'sarraf.f.money': {
fa: ['واریز / پرداخت مشتری', `برای پولی که مشتری به حساب ما می‌ریزد یا ما به او می‌پردازیم، بدون تبدیل ارز.
- **⬇️ مشتری واریز کرد:** پول وارد صندوق می‌شود و از بدهی مشتری کم می‌شود (یا طلبکار می‌شود).
- **⬆️ به مشتری پرداخت شد:** پول از صندوق خارج می‌شود و به حساب مشتری بدهکار می‌شود.
- مشتری، مبلغ، ارز و صندوق را انتخاب کنید؛ توضیح و تاریخ اختیاری است.
! مثال: «علی ۱۰۰ میلیون تومان به حساب ایران واریز کرد» → واریز، تومان، صندوق حساب ایران.`],
en: ['Customer deposit / payment', `For money a customer pays into our account or we pay out to them, without currency exchange.
- **⬇️ Customer deposited:** money enters the box and the customer's debt goes down (or they get credit).
- **⬆️ Paid to customer:** money leaves the box and the customer's account is debited.
- Choose the customer, amount, currency and box; note and date are optional.
! Example: “Ali paid 100 million toman into the Iran account” → deposit, toman, Iran account box.`],
tr: ['Müşteri yatırma / ödeme', `Müşterinin hesabımıza yatırdığı veya bizim ona ödediğimiz para için, döviz çevirmeden.
- **⬇️ Müşteri yatırdı:** para kasaya girer, müşterinin borcu azalır (veya alacaklı olur).
- **⬆️ Müşteriye ödendi:** para kasadan çıkar, müşterinin hesabı borçlandırılır.
- Müşteri, tutar, döviz ve kasayı seçin; not ve tarih isteğe bağlıdır.
! Örnek: “Ali İran hesabına 100 milyon toman yatırdı” → yatırma, toman, İran hesabı kasası.`],
ar: ['إيداع / دفع للعميل', `للمال الذي يودعه العميل في حسابنا أو ندفعه له، دون صرف عملة.
- **⬇️ أودع العميل:** يدخل المال إلى الصندوق وينقص دين العميل (أو يصبح دائناً).
- **⬆️ دُفع للعميل:** يخرج المال من الصندوق ويُقيَّد على حساب العميل.
- اختر العميل والمبلغ والعملة والصندوق؛ الملاحظة والتاريخ اختياريان.
! مثال: «أودع علي 100 مليون تومان في حساب إيران» ← إيداع، تومان، صندوق حساب إيران.`],
},
'sarraf.f.trust': {
fa: ['امانت', `پولی که فقط امانت است و جزو حساب جاری مشتری حساب نمی‌شود.
- **🤝 امانت دادیم:** از صندوق ما به کسی امانت داده شد.
- **↩️ امانت‌مان برگشت:** همان امانت به صندوق ما برگشت.
- **📥 امانت گرفتیم:** کسی پولش را نزد ما امانت گذاشت.
- **↪️ امانت را پس دادیم:** امانت او را برگرداندیم.
- شخص، مبلغ و صندوق را انتخاب کنید. زیر فرم مانده‌ی امانت فعلی آن شخص دیده می‌شود.`],
en: ['Trust (safekeeping)', `Money held only in trust, kept outside the customer's current account.
- **🤝 We gave in trust:** money left our box to be held by someone.
- **↩️ Our trust returned:** that money came back to our box.
- **📥 We took in trust:** someone left their money with us.
- **↪️ We returned their trust:** we gave their money back.
- Choose the person, amount and box. Their current trust balance shows under the form.`],
tr: ['Emanet', `Yalnızca emanet olan, müşterinin cari hesabına sayılmayan para.
- **🤝 Emanet verdik:** kasamızdan birine emanet verildi.
- **↩️ Emanetimiz döndü:** o para kasamıza geri geldi.
- **📥 Emanet aldık:** biri parasını bize emanet bıraktı.
- **↪️ Emaneti iade ettik:** onun parasını geri verdik.
- Kişiyi, tutarı ve kasayı seçin. Kişinin güncel emanet bakiyesi formun altında görünür.`],
ar: ['الأمانة', `مال محفوظ كأمانة فقط ولا يُحسب في الحساب الجاري للعميل.
- **🤝 أعطينا أمانة:** خرج المال من صندوقنا ليحفظه شخص ما.
- **↩️ عادت أمانتنا:** عاد ذلك المال إلى صندوقنا.
- **📥 استلمنا أمانة:** ترك شخص ماله لدينا.
- **↪️ أعدنا أمانته:** أرجعنا ماله إليه.
- اختر الشخص والمبلغ والصندوق. يظهر رصيد أمانته الحالي أسفل النموذج.`],
},
'sarraf.f.expense': {
fa: ['ثبت هزینه', `هزینه‌های صرافی مثل اجاره، حقوق، کارمزد بانک، هزینه‌ی ارسال یا پذیرایی.
- نوع هزینه، مبلغ، ارز و صندوقی که پول از آن خارج شد را انتخاب کنید.
- هزینه‌ها در گزارش سود و زیان از سود کم می‌شوند.`],
en: ['Record an expense', `Office costs such as rent, salaries, bank fees, sending costs or hospitality.
- Choose the expense type, amount, currency and the box the money left.
- Expenses are subtracted from profit in the profit and loss report.`],
tr: ['Gider kaydı', `Kira, maaş, banka komisyonu, gönderim masrafı veya ikram gibi büro giderleri.
- Gider türünü, tutarı, dövizi ve paranın çıktığı kasayı seçin.
- Giderler kâr ve zarar raporunda kârdan düşülür.`],
ar: ['تسجيل مصروف', `مصروفات المكتب مثل الإيجار والرواتب وعمولات البنك وتكاليف الإرسال والضيافة.
- اختر نوع المصروف والمبلغ والعملة والصندوق الذي خرج منه المال.
- تُخصم المصروفات من الربح في تقرير الأرباح والخسائر.`],
},
'sarraf.f.transfer': {
fa: ['انتقال / تبدیل بین صندوق‌ها', `جابه‌جایی پول بین دو صندوق خود صرافی.
- **از صندوق** و **به صندوق** را انتخاب کنید.
- اگر دو صندوق یک ارزند، مبلغ یکی است.
- اگر ارزها فرق دارند (مثلاً فروش تتر در بازار و گرفتن لیر)، مبلغ خارج‌شده و مبلغ واقعی واردشده را جدا بنویسید؛ اختلاف در گزارش سود دیده می‌شود.`],
en: ['Transfer / convert between boxes', `Move money between two of the office's own boxes.
- Choose **from box** and **to box**.
- If both boxes use the same currency, the amount is the same.
- If the currencies differ (e.g. selling USDT on the market for lira), enter the amount that left and the amount that actually arrived; the difference shows in the profit report.`],
tr: ['Kasalar arası transfer / çevirme', `Büronun kendi iki kasası arasında para taşıyın.
- **Kaynak kasa** ve **hedef kasa** seçin.
- İki kasa aynı dövizdeyse tutar aynıdır.
- Dövizler farklıysa (ör. piyasada USDT satıp lira almak), çıkan tutarı ve gerçekten giren tutarı ayrı yazın; fark kâr raporunda görünür.`],
ar: ['تحويل / صرف بين الصناديق', `نقل المال بين صندوقين من صناديق المكتب.
- اختر **من صندوق** و**إلى صندوق**.
- إذا كان الصندوقان بالعملة نفسها فالمبلغ واحد.
- إذا اختلفت العملتان (مثل بيع USDT في السوق مقابل الليرة) فاكتب المبلغ الخارج والمبلغ الذي وصل فعلاً؛ يظهر الفرق في تقرير الأرباح.`],
},
'sarraf.f.capital': {
fa: ['آورده / برداشت شریک', `پولی که مالک یا شریک به صرافی می‌آورد یا از آن برمی‌دارد.
- **آورده:** شریک پول گذاشت؛ صندوق بیشتر می‌شود و سرمایه‌ی او ثبت می‌شود.
- **برداشت:** شریک پول برد؛ از صندوق کم و از سرمایه‌ی او کسر می‌شود.
- این‌ها معامله یا هزینه نیستند و روی سود اثر نمی‌گذارند.`],
en: ['Partner capital in / out', `Money the owner or a partner brings into or takes out of the office.
- **Capital in:** the partner put money in; the box grows and their capital is recorded.
- **Withdrawal:** the partner took money; it leaves the box and their capital.
- These are not trades or expenses and do not affect profit.`],
tr: ['Ortak sermaye girişi / çıkışı', `Sahibin veya ortağın büroya getirdiği ya da çektiği para.
- **Sermaye girişi:** ortak para koydu; kasa artar, sermayesi kaydedilir.
- **Çekiş:** ortak para aldı; kasadan ve sermayesinden düşülür.
- Bunlar işlem veya gider değildir, kârı etkilemez.`],
ar: ['إيداع / سحب الشريك', `مال يجلبه المالك أو الشريك إلى المكتب أو يسحبه منه.
- **إيداع رأس مال:** وضع الشريك مالاً؛ يزيد الصندوق ويُسجَّل رأس ماله.
- **سحب:** أخذ الشريك مالاً؛ يُخصم من الصندوق ومن رأس ماله.
- هذه ليست معاملات ولا مصروفات ولا تؤثر في الربح.`],
},
'sarraf.f.opening': {
fa: ['موجودی اول دوره', `فقط یک بار، وقتی شروع به کار با صرافینو می‌کنید.
- موجودی فعلی هر صندوق (نقد، بانک، کیف پول) را بنویسید.
- صندوق‌هایی که موجودی ندارند را خالی بگذارید.
! طلب و بدهی قبلی مشتری‌ها را با فرم «واریز / پرداخت» برای هر مشتری ثبت کنید.`],
en: ['Opening balances', `Only once, when you start using Sarrafino.
- Enter the current balance of each box (cash, bank, wallet).
- Leave empty the boxes that have no balance.
! Record customers' earlier debts and credits with the “deposit / payment” form for each customer.`],
tr: ['Açılış bakiyeleri', `Yalnızca bir kez, Sarrafino'yu kullanmaya başlarken.
- Her kasanın (nakit, banka, cüzdan) güncel bakiyesini girin.
- Bakiyesi olmayan kasaları boş bırakın.
! Müşterilerin önceki borç ve alacaklarını her müşteri için “yatırma / ödeme” formuyla girin.`],
ar: ['أرصدة أول المدة', `مرة واحدة فقط عند بدء استخدام صرافينو.
- أدخل الرصيد الحالي لكل صندوق (نقد، بنك، محفظة).
- اترك فارغة الصناديق التي لا رصيد فيها.
! سجّل ديون العملاء وأرصدتهم السابقة بنموذج «إيداع / دفع» لكل عميل.`],
},
'sarraf.f.customer': {
fa: ['مشتری جدید / ویرایش', `- **نام:** نامی که مشتری را با آن می‌شناسید.
- **شماره تماس:** با کد کشور (مثلاً +90 یا +98) تا دکمه‌ی واتس‌اپ و رسید درست کار کند.
- **توضیحات:** مثلاً «آشنای آقای …».
- **بایگانی:** مشتری از فهرست پنهان می‌شود اما تاریخچه‌اش می‌ماند.`],
en: ['New / edit customer', `- **Name:** how you know the customer.
- **Phone:** with country code (e.g. +90 or +98) so the WhatsApp button and receipts work.
- **Notes:** e.g. “friend of Mr …”.
- **Archive:** hides the customer from the list but keeps the history.`],
tr: ['Yeni / müşteri düzenle', `- **Ad:** müşteriyi tanıdığınız ad.
- **Telefon:** ülke koduyla (ör. +90 veya +98), böylece WhatsApp düğmesi ve makbuzlar çalışır.
- **Not:** ör. “… Bey'in tanıdığı”.
- **Arşivle:** müşteriyi listeden gizler, geçmişi kalır.`],
ar: ['عميل جديد / تعديل', `- **الاسم:** الاسم الذي تعرف به العميل.
- **الهاتف:** مع رمز الدولة (مثل +90 أو +98) ليعمل زر واتساب والإيصالات.
- **ملاحظات:** مثل «من معارف السيد …».
- **أرشفة:** يُخفي العميل من القائمة مع بقاء سجله.`],
},
'sarraf.f.box': {
fa: ['صندوق', `هر جایی که پول صرافی نگه داشته می‌شود یک صندوق است.
- **نام:** مثلاً «صندوق دلار» یا «حساب زراعت بانک».
- **ارز:** هر صندوق یک ارز دارد.
- **نوع:** نقد، حساب بانکی یا کیف پول (برای تتر و رمزارز).
- **بایگانی:** صندوق بسته‌شده از فرم‌ها پنهان می‌شود.`],
en: ['Cash box', `Every place the office keeps money is a box.
- **Name:** e.g. “Dollar cash” or “Ziraat Bank account”.
- **Currency:** each box has one currency.
- **Type:** cash, bank account or wallet (for USDT and crypto).
- **Archive:** a closed box is hidden from the forms.`],
tr: ['Kasa', `Büronun para tuttuğu her yer bir kasadır.
- **Ad:** ör. “Dolar kasası” veya “Ziraat Bankası hesabı”.
- **Döviz:** her kasanın bir dövizi vardır.
- **Tür:** nakit, banka hesabı veya cüzdan (USDT ve kripto için).
- **Arşivle:** kapanan kasa formlarda gizlenir.`],
ar: ['الصندوق', `كل مكان يحفظ فيه المكتب المال هو صندوق.
- **الاسم:** مثل «صندوق الدولار» أو «حساب بنك زراعات».
- **العملة:** لكل صندوق عملة واحدة.
- **النوع:** نقد أو حساب بنكي أو محفظة (لـ USDT والعملات الرقمية).
- **أرشفة:** الصندوق المغلق يُخفى من النماذج.`],
},
'sarraf.f.invite': {
fa: ['دعوت شریک یا کارمند', `- ایمیل و نام فرد را بنویسید و نقش را انتخاب کنید:
- **شریک:** دسترسی کامل، دیدن سود و گزارش‌ها، با درصد سهم سود.
- **کارمند:** فقط ثبت معامله و تراکنش، بدون دیدن سود.
- بعد از ثبت، لینک برنامه را برای او بفرستید تا **با همین ایمیل** ثبت‌نام کند؛ خودکار به صرافی شما وصل می‌شود.
! تعداد کاربرها به پلن شما بستگی دارد.`],
en: ['Invite a partner or staff member', `- Enter their email and name and choose a role:
- **Partner:** full access, sees profit and reports, with a profit share %.
- **Staff:** records trades and transactions only, without seeing profit.
- After saving, send them the app link so they sign up **with this same email**; they join your office automatically.
! The number of users depends on your plan.`],
tr: ['Ortak veya çalışan davet et', `- E-postasını ve adını yazın, rolü seçin:
- **Ortak:** tam erişim, kâr ve raporları görür, kâr payı yüzdesiyle.
- **Çalışan:** yalnızca işlem kaydeder, kârı görmez.
- Kaydettikten sonra uygulama bağlantısını gönderin, **aynı e-postayla** kaydolsun; büronuza otomatik bağlanır.
! Kullanıcı sayısı planınıza bağlıdır.`],
ar: ['دعوة شريك أو موظف', `- أدخل بريده واسمه واختر الدور:
- **شريك:** صلاحية كاملة، يرى الأرباح والتقارير، مع نسبة من الربح.
- **موظف:** يسجّل المعاملات فقط دون رؤية الأرباح.
- بعد الحفظ أرسل له رابط التطبيق ليسجّل **بالبريد نفسه**؛ ينضم إلى مكتبك تلقائياً.
! عدد المستخدمين يعتمد على خطتك.`],
},
'sarraf.f.txn': {
fa: ['جزئیات تراکنش', `- خلاصه، تاریخ، کسی که ثبت کرده و (برای مدیر) سود نسبت به بازار.
- **ردیف‌های حسابداری:** دقیقاً چه مبلغی به کدام صندوق یا حساب اضافه یا کم شد.
- **🧾 رسید / واتس‌اپ:** رسید را برای مشتری بفرستید.
- **باطل کردن (مدیر):** دلیل را بنویسید و باطل کنید؛ تراکنش خط‌خورده می‌ماند و از مانده‌ها حذف می‌شود.`],
en: ['Transaction details', `- Summary, date, who recorded it and (for managers) the profit against the market.
- **Accounting lines:** exactly what amount was added to or taken from which box or account.
- **🧾 Receipt / WhatsApp:** send the receipt to the customer.
- **Void (managers):** write the reason and void; the entry stays crossed out and leaves the balances.`],
tr: ['İşlem ayrıntıları', `- Özet, tarih, kaydeden kişi ve (yönetici için) piyasaya göre kâr.
- **Muhasebe satırları:** hangi kasaya veya hesaba tam olarak ne kadar eklendi ya da çıkarıldı.
- **🧾 Makbuz / WhatsApp:** makbuzu müşteriye gönderin.
- **İptal (yönetici):** gerekçeyi yazıp iptal edin; kayıt üstü çizili kalır ve bakiyelerden çıkar.`],
ar: ['تفاصيل المعاملة', `- الملخص والتاريخ ومن سجّلها و(للمدير) الربح مقارنةً بالسوق.
- **قيود المحاسبة:** المبلغ الذي أُضيف إلى أي صندوق أو حساب أو خُصم منه بالضبط.
- **🧾 إيصال / واتساب:** أرسل الإيصال للعميل.
- **الإلغاء (المدير):** اكتب السبب وألغِ؛ يبقى القيد مشطوباً ويخرج من الأرصدة.`],
},
'sarraf.f.receipt': {
fa: ['رسید واتس‌اپ', `- متن رسید با شماره، تاریخ، مبلغ‌ها، نرخ و مانده‌ی مشتری ساخته می‌شود.
- **ارسال در واتس‌اپ:** اگر شماره‌ی مشتری ثبت شده باشد، گفتگوی همان مشتری باز می‌شود؛ وگرنه خودتان مخاطب را انتخاب کنید.
- **رسید تصویری:** همان رسید به شکل عکس، برای فرستادن یا چاپ.
- **کپی:** برای فرستادن در هر برنامه‌ی دیگر.
- رسید به زبانی ساخته می‌شود که الان انتخاب کرده‌اید.`],
en: ['WhatsApp receipt', `- The receipt text includes number, date, amounts, rate and the customer's balance.
- **Send on WhatsApp:** if the customer's number is saved, their chat opens; otherwise choose the contact yourself.
- **Image receipt:** the same receipt as a picture, to send or print.
- **Copy:** to send it in any other app.
- The receipt is written in the language you have selected now.`],
tr: ['WhatsApp makbuzu', `- Makbuz metni numara, tarih, tutarlar, kur ve müşteri bakiyesini içerir.
- **WhatsApp'ta gönder:** müşterinin numarası kayıtlıysa onun sohbeti açılır; değilse kişiyi kendiniz seçin.
- **Görsel makbuz:** aynı makbuz resim olarak, göndermek veya yazdırmak için.
- **Kopyala:** başka bir uygulamada göndermek için.
- Makbuz şu an seçili dilde hazırlanır.`],
ar: ['إيصال واتساب', `- يتضمن نص الإيصال الرقم والتاريخ والمبالغ والسعر ورصيد العميل.
- **إرسال في واتساب:** إذا كان رقم العميل محفوظاً تُفتح محادثته؛ وإلا فاختر جهة الاتصال بنفسك.
- **إيصال مصوّر:** الإيصال نفسه كصورة للإرسال أو الطباعة.
- **نسخ:** لإرساله في أي تطبيق آخر.
- يُكتب الإيصال باللغة المختارة حالياً.`],
},
});
HELP.add({
'sarraf.wl': {
fa: ['ارزینوی اختصاصی', `یک ارزینوی کامل به نام صرافی شما برای مشتری‌هایتان: نام و لوگوی شما، نرخ خرید و فروش شما بالای صفحه، دکمه‌ی واتس‌اپ شما، بدون تبلیغ و بدون معرفی صرافی‌های دیگر. همه‌ی امکانات ارزینو (بازار، نمودار، مبدل، ماشین‌حساب) سر جایش است.
## لینک و نصب
- لینک را برای مشتری‌ها بفرستید یا در وضعیت واتس‌اپ و اینستاگرام بگذارید. مشتری می‌تواند آن را مثل یک برنامه روی گوشی نصب کند؛ با نام و لوگوی شما.
- **نام کوتاه:** به‌جای کد طولانی، مثلاً ario-ex تا لینک کوتاه و خوانا شود.
- **نام برنامه:** اگر خالی بماند، نام صرافی نمایش داده می‌شود. لوگو همان لوگوی تابلوی شماست.
## منبع قیمت دلخواه (API)
اگر نمی‌خواهید، هیچ کاری لازم نیست؛ همه‌ی قیمت‌ها مثل ارزینوی اصلی از منابع پیش‌فرض می‌آید. اگر قیمت‌های خودتان را دارید:
- **برای کدام بخش:** همه‌ی ارزها، همه‌ی رمزارزها، فلزات، قیمت‌های تومانی، یا فقط یک ارز. منبع «یک ارز» بر منبع کل بخش مقدم است.
- **آدرس API:** آدرسی که پاسخ JSON می‌دهد. اگر کلید لازم دارد، در «هدر کلید» بنویسید؛ کلید فقط روی سرور می‌ماند و به مشتری‌ها نشان داده نمی‌شود.
- **آزمایش API:** پاسخ را نشان می‌دهد و می‌گوید چند قیمت پیدا شد.
- **مسیر:** جای عدد در پاسخ، مثلاً data.price یا rates.
- **قیمت‌ها به چه ارزی است:** مثلاً USD، USDT، TRY یا IRT (تومان).
- **معنی عدد:** «قیمت ۱ واحد» (مثلاً ۱ BTC = ۶۵۰۰۰ USD) یا «چند واحد = ۱ ارز پایه» (مثلاً ۱ USD = ۰٫۹۲ EUR).
## سه مثال آماده
- **همه‌ی ارزها:** https://open.er-api.com/v6/latest/USD · مسیر rates · ارز USD · معنی «چند واحد = ۱ ارز پایه».
- **همه‌ی رمزارزها:** https://data-api.binance.vision/api/v3/ticker/price · مسیر خالی · ارز USDT · قیمت ۱ واحد · در بخش پیشرفته: فیلد کد symbol، فیلد قیمت price، حذف از انتها USDT.
- **فقط دلار به لیر از API خودتان:** فقط یک ارز · کد USD · مسیر مثلاً data.price · ارز TRY.
! اگر تابلوی شما روی «خودکار از بازار» باشد، نرخ‌های خرید و فروش هم از همین قیمت‌های شما حساب می‌شوند؛ در پنل، تصویر، تابلوی زنده و ارزینوی اختصاصی.`],
en: ['Dedicated Arzino', `A complete Arzino in your office's name for your customers: your name and logo, your buy and sell rates at the top, your WhatsApp button, no ads and no other offices. Every Arzino feature (market, chart, converter, calculator) stays.
## Link and install
- Send the link to customers or put it in your WhatsApp or Instagram status. Customers can install it on their phone like an app, with your name and logo.
- **Short name:** instead of a long code, e.g. ario-ex, so the link is short and readable.
- **App name:** left empty, your office name is shown. The logo is your board logo.
## Your own price source (API)
If you don't want it, do nothing; all prices come from the default sources like the main Arzino. If you have your own prices:
- **Which section:** all currencies, all crypto, metals, toman prices, or one currency. A single-currency source wins over its whole section.
- **API address:** an address that answers in JSON. If it needs a key, put it in “Key header”; the key stays on the server and is never shown to customers.
- **Test API:** shows the answer and how many prices were found.
- **Path:** where the number is in the answer, e.g. data.price or rates.
- **Prices are in:** e.g. USD, USDT, TRY or IRT (toman).
- **What the number means:** “price of 1 unit” (e.g. 1 BTC = 65,000 USD) or “how many = 1 base unit” (e.g. 1 USD = 0.92 EUR).
## Three ready examples
- **All currencies:** https://open.er-api.com/v6/latest/USD · path rates · in USD · meaning “how many = 1 base unit”.
- **All crypto:** https://data-api.binance.vision/api/v3/ticker/price · empty path · in USDT · price of 1 unit · advanced: code field symbol, price field price, remove from end USDT.
- **Only USD to lira from your own API:** a single currency · code USD · path e.g. data.price · in TRY.
! If your board is on “Automatic from market”, your buy and sell rates are calculated from these prices too — in the panel, the image, the live board and the dedicated Arzino.`],
tr: ['Özel Arzino', `Müşterileriniz için büronuzun adıyla eksiksiz bir Arzino: adınız ve logonuz, üstte alış ve satış kurlarınız, WhatsApp düğmeniz, reklam yok ve başka büro yok. Arzino'nun tüm özellikleri (piyasa, grafik, çevirici, hesap makinesi) yerinde.
## Bağlantı ve kurulum
- Bağlantıyı müşterilere gönderin ya da WhatsApp veya Instagram durumunuza koyun. Müşteri onu telefona uygulama gibi, sizin adınız ve logonuzla kurabilir.
- **Kısa ad:** uzun kod yerine, ör. ario-ex; bağlantı kısa ve okunur olur.
- **Uygulama adı:** boş kalırsa büro adınız görünür. Logo, pano logonuzdur.
## Kendi fiyat kaynağınız (API)
İstemiyorsanız hiçbir şey yapmanız gerekmez; tüm fiyatlar ana Arzino gibi varsayılan kaynaklardan gelir. Kendi fiyatlarınız varsa:
- **Hangi bölüm:** tüm dövizler, tüm kriptolar, metaller, toman fiyatları veya tek bir döviz. Tek döviz kaynağı bölümün tamamına göre önceliklidir.
- **API adresi:** JSON yanıt veren bir adres. Anahtar gerekiyorsa “Anahtar başlığı”na yazın; anahtar sunucuda kalır, müşterilere gösterilmez.
- **API'yi test et:** yanıtı ve kaç fiyat bulunduğunu gösterir.
- **Yol:** sayının yanıttaki yeri, ör. data.price veya rates.
- **Fiyatlar hangi dövizde:** ör. USD, USDT, TRY veya IRT (toman).
- **Sayının anlamı:** “1 birimin fiyatı” (ör. 1 BTC = 65.000 USD) veya “kaç birim = 1 baz birim” (ör. 1 USD = 0,92 EUR).
## Üç hazır örnek
- **Tüm dövizler:** https://open.er-api.com/v6/latest/USD · yol rates · USD · anlam “kaç birim = 1 baz birim”.
- **Tüm kriptolar:** https://data-api.binance.vision/api/v3/ticker/price · yol boş · USDT · 1 birimin fiyatı · gelişmiş: kod alanı symbol, fiyat alanı price, sondan sil USDT.
- **Kendi API'nizden yalnızca dolar/lira:** tek döviz · kod USD · yol ör. data.price · TRY.
! Panonuz “Piyasadan otomatik” ise alış ve satış kurlarınız da bu fiyatlardan hesaplanır; panelde, görselde, canlı panoda ve özel Arzino'da.`],
ar: ['أرزينو الخاص', `أرزينو كامل باسم مكتبك لعملائك: اسمك وشعارك، وأسعار الشراء والبيع لديك في الأعلى، وزر واتساب الخاص بك، دون إعلانات ودون مكاتب أخرى. كل ميزات أرزينو (السوق والرسم والمحوّل والآلة الحاسبة) باقية.
## الرابط والتثبيت
- أرسل الرابط للعملاء أو ضعه في حالة واتساب أو إنستغرام. يستطيع العميل تثبيته على هاتفه كتطبيق، باسمك وشعارك.
- **الاسم المختصر:** بدل الرمز الطويل، مثل ario-ex، ليكون الرابط قصيراً ومقروءاً.
- **اسم التطبيق:** إن بقي فارغاً يظهر اسم المكتب. الشعار هو شعار لوحتك.
## مصدر أسعارك الخاص (API)
إن لم ترغب فلا شيء مطلوب؛ تأتي كل الأسعار من المصادر الافتراضية كأرزينو الأساسي. إذا كانت لديك أسعارك:
- **لأي قسم:** كل العملات، كل العملات الرقمية، المعادن، أسعار التومان، أو عملة واحدة. مصدر العملة الواحدة مقدَّم على مصدر القسم كله.
- **عنوان API:** عنوان يرد بصيغة JSON. إن احتاج مفتاحاً فاكتبه في «ترويسة المفتاح»؛ يبقى المفتاح على الخادم ولا يُعرض للعملاء.
- **اختبار API:** يعرض الرد وعدد الأسعار التي عُثر عليها.
- **المسار:** مكان الرقم في الرد، مثل data.price أو rates.
- **الأسعار بأي عملة:** مثل USD أو USDT أو TRY أو IRT (تومان).
- **معنى الرقم:** «سعر وحدة واحدة» (مثل 1 BTC = 65,000 USD) أو «كم وحدة = وحدة أساس واحدة» (مثل 1 USD = 0.92 EUR).
## ثلاثة أمثلة جاهزة
- **كل العملات:** https://open.er-api.com/v6/latest/USD · المسار rates · بالدولار USD · المعنى «كم وحدة = وحدة أساس».
- **كل العملات الرقمية:** https://data-api.binance.vision/api/v3/ticker/price · مسار فارغ · USDT · سعر وحدة · متقدم: حقل الرمز symbol، حقل السعر price، حذف من النهاية USDT.
- **الدولار مقابل الليرة فقط من API الخاص بك:** عملة واحدة · الرمز USD · المسار مثل data.price · بالليرة TRY.
! إذا كانت لوحتك على «تلقائي من السوق» فتُحسب أسعار الشراء والبيع أيضاً من أسعارك هذه — في اللوحة والصورة واللوحة المباشرة وأرزينو الخاص.`],
},
});
