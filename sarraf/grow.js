'use strict';
/* Sarrafino growth: demo without sign-up, getting-started checklist (with two-step login), referral link, terms at sign-up.
   Loaded before app.js; the functions run later, when app.js has defined S, sb and the screens. */

const PARAMS = new URLSearchParams(location.search);
(function keepRef() {                               // ?ref=CODE from an invitation link, kept until the exchange is created
  const r = (PARAMS.get('ref') || '').trim().toUpperCase();
  if (/^[A-Z0-9]{4,10}$/.test(r)) try { localStorage.setItem('sarraf.ref', r); } catch (e) {}
})();
const refCode = () => { try { return localStorage.getItem('sarraf.ref') || ''; } catch (e) { return ''; } };
const isDemo = () => !!(S.ex && S.ex.is_demo) || !!(S.user && S.user.is_anonymous);

/* ---------------------------------------------------------------- demo */
async function startDemo() {
  if (startDemo.busy) return; startDemo.busy = true;
  $('app').innerHTML = '<div class="boot">' + _('در حال آماده کردن صرافی نمونه…') + '</div>';
  try {
    if (!S.user || !S.user.is_anonymous) {
      if (S.user) await sb.auth.signOut();
      const {error} = await sb.auth.signInAnonymously();
      if (error) throw error;
    }
    const {error: e2} = await sb.rpc('create_demo_exchange', {p_name: _('صرافی نمونه')});
    if (e2) throw e2;
    try { localStorage.setItem('sarraf.demo_seed', '1'); localStorage.removeItem('sarraf.ex'); } catch (e) {}
    history.replaceState(null, '', location.pathname);
    await boot();
  } catch (e) { startDemo.busy = false; renderAuth(); err(e); }
}
// sample customers, opening balances and a few trades, so the demo looks like a working exchange
async function seedDemo() {
  try { if (localStorage.getItem('sarraf.demo_seed') !== '1') return; localStorage.removeItem('sarraf.demo_seed'); } catch (e) { return; }
  if (S.recentTrades.length) return;
  const ex = S.ex.id, bx = c => S.boxes.find(b => b.currency === c)?.id, u = c => usdOf(c);
  const rpc = p => sb.rpc('post_txn', {p: {exchange_id: ex, ...p}});
  await saveSettings({rate_mode: 'auto', spread_buy: 0.4, spread_sell: 0.6, round_irt: 100, phone: '+90 555 000 00 00', city: _('استانبول')});
  const names = [[_('علی رضایی'), '+90 532 111 22 33'], ['Mehmet Yılmaz', '+90 541 444 55 66'], [_('شرکت آریا تجارت'), '+98 912 000 11 22']];
  const {data: cs, error} = await sb.from('customers').insert(names.map(([name, phone]) => ({exchange_id: ex, name, phone}))).select();
  if (error || !cs) return;
  const open = [['TRY', 250000], ['USD', 8000], ['EUR', 3000], ['IRT', 600000000], ['USDT', 5000]].filter(([c]) => bx(c));
  await rpc({type: 'opening', note: _('موجودی اول دوره'), lines: open.flatMap(([c, v]) => [
    {party: 'box', box_id: bx(c), currency: c, amount: v, usd_rate: u(c)}, {party: 'equity', member_id: S.user.id, currency: c, amount: -v, usd_rate: u(c)}])});
  // customer gives A of gc and receives B of rc at the exchange's rate (cash both ways unless told otherwise)
  const trade = async (C, gc, A, rc, rate, {giveCash = true, getCash = true} = {}) => {
    const B = +(A * rate).toFixed(rc === 'IRT' ? 0 : 2), ug = u(gc), ur = u(rc);
    const lines = [{party: 'customer', customer_id: C, currency: gc, amount: A, usd_rate: ug}, {party: 'customer', customer_id: C, currency: rc, amount: -B, usd_rate: ur}];
    if (giveCash) lines.push({party: 'box', box_id: bx(gc), currency: gc, amount: A, usd_rate: ug}, {party: 'customer', customer_id: C, currency: gc, amount: -A, usd_rate: ug});
    if (getCash) lines.push({party: 'box', box_id: bx(rc), currency: rc, amount: -B, usd_rate: ur}, {party: 'customer', customer_id: C, currency: rc, amount: B, usd_rate: ur});
    const profit = (inBase(A, gc) ?? 0) - (inBase(B, rc) ?? 0);
    await rpc({type: 'trade', customer_id: C, lines, meta: {give: {ccy: gc, amt: A}, get: {ccy: rc, amt: B}, rate, pair: `${gc}/${rc}`,
      market: {[gc]: ug, [rc]: ur}, profit_base: ug && ur ? +profit.toFixed(4) : null, base: base()}});
  };
  const m = (a, b) => (u(a) && u(b) ? u(a) / u(b) : null);
  if (m('USD', 'TRY')) await trade(cs[0].id, 'USD', 1000, 'TRY', +(m('USD', 'TRY') * 0.996).toFixed(3));
  if (m('TRY', 'USDT')) await trade(cs[1].id, 'TRY', 100000, 'USDT', +(m('TRY', 'USDT') * 0.994).toFixed(6), {getCash: false});
  if (m('USD', 'IRT')) await trade(cs[2].id, 'USD', 2000, 'IRT', Math.round(m('USD', 'IRT') * 0.995 / 100) * 100, {getCash: false});
  await rpc({type: 'deposit', customer_id: cs[0].id, lines: [{party: 'box', box_id: bx('EUR'), currency: 'EUR', amount: 1500, usd_rate: u('EUR')},
    {party: 'customer', customer_id: cs[0].id, currency: 'EUR', amount: -1500, usd_rate: u('EUR')}]});
  await loadExchangeData();
}
function demoBanner() {
  if (!isDemo()) return '';
  return `<div class="card demo-banner"><div><b>🎮 ${_('حالت نمایشی')}</b><span>${_('این یک صرافی نمونه با داده‌های ساختگی است و ۲۴ ساعت بعد پاک می‌شود. هر کاری می‌خواهید امتحان کنید.')}</span></div>
    <button class="btn p" data-realsignup>${_('ثبت‌نام واقعی — رایگان')}</button></div>`;
}
function bindDemoBanner(root) {
  root.querySelectorAll('[data-realsignup]').forEach(b => b.onclick = async () => {
    await sb.auth.signOut(); S.user = null; S.ex = null;
    try { localStorage.removeItem('sarraf.ex'); } catch (e) {}
    renderAuth('signup');
  });
}

/* ---------------------------------------------------------------- getting-started checklist */
async function mfaOn() {
  if (S.mfaOn !== undefined) return S.mfaOn;
  try { const {data} = await sb.auth.mfa.listFactors(); S.mfaOn = !!(data?.totp || []).some(f => f.status === 'verified'); } catch (e) { S.mfaOn = false; }
  return S.mfaOn;
}
function checkItems() {
  const boxMoney = S.bal.some(r => r.party === 'box' && Math.abs(Number(r.amount)) > 1e-9);
  return [
    ['opening', '📌', _('موجودی اول دوره صندوق‌ها را وارد کنید'), boxMoney],
    ['board', '📣', _('نرخ‌های تابلو را تنظیم کنید'), S.board.length > 0 || rateCfg().mode === 'auto'],
    ['customer', '👤', _('اولین مشتری را اضافه کنید'), S.customers.some(c => !c.is_walkin)],
    ['trade', '💱', _('اولین معامله را ثبت کنید'), S.recentTrades.length > 0],
    ['team', '👔', _('شریک یا کارمند را دعوت کنید (اختیاری)'), S.members.length > 1],
    ['mfa', '🔐', _('ورود دو مرحله‌ای را روشن کنید (امنیت بیشتر)'), S.mfaOn === true],
  ];
}
function checklistCard() {
  if (!isMgr() || isDemo()) return '';
  try { if (localStorage.getItem('sarraf.ck.' + S.ex.id) === 'hide') return ''; } catch (e) {}
  const it = checkItems(), done = it.filter(x => x[3]).length;
  if (done === it.length) return '';
  return `<div class="card checklist"><h3>🚀 ${_('شروع کار با صرافینو')} <small class="muted">${_('{d} از {n}', {d: fmt(done, 0), n: fmt(it.length, 0)})}</small>
      <button class="ibtn small" id="ckHide" title="${_('بستن')}">✕</button></h3>
    <div class="ckbar"><i style="width:${Math.round(done / it.length * 100)}%"></i></div>
    <div class="list">${it.map(([k, i, l, ok]) => `<div class="row ck ${ok ? 'ok' : ''}" data-ck="${k}"><div class="ic">${ok ? '✅' : i}</div><div class="m"><b>${l}</b></div>${ok ? '' : '<div class="e">›</div>'}</div>`).join('')}</div></div>`;
}
function bindChecklist(root) {
  const h = root.querySelector('#ckHide');
  if (h) h.onclick = () => { try { localStorage.setItem('sarraf.ck.' + S.ex.id, 'hide'); } catch (e) {} render(); };
  root.querySelectorAll('[data-ck]').forEach(r => r.onclick = () => {
    if (r.classList.contains('ok')) return;
    ({opening: () => formOpening(), board: () => go('board'), customer: () => formCustomer(null, () => refresh()), trade: () => formTrade(),
      team: () => formInvite(), mfa: () => { go('more'); setTimeout(() => document.getElementById('mfaCard')?.scrollIntoView({behavior: 'smooth', block: 'center'}), 200); }})[r.dataset.ck]();
  });
  if (S.mfaOn === undefined && isMgr() && !isDemo()) mfaOn().then(v => { if (v && S.view === 'home') render(); });
}

/* ---------------------------------------------------------------- referral */
function referralCard() {
  if (!isMgr() || isDemo()) return '';
  return `<div class="card" id="refCard"><h3>🎁 ${_('صرافی‌های دیگر را معرفی کنید')}</h3><p class="muted small" style="margin:0">${_('در حال بارگذاری…')}</p></div>`;
}
async function loadReferral() {
  const el = $('refCard'); if (!el) return;
  const {data, error} = await sb.rpc('my_referrals', {p_ex: S.ex.id});
  if (error || !data) { el.remove(); return; }
  const st = data.settings || {}; if (st.on === false) { el.remove(); return; }
  const days = fmt(st.days || 30, 0);
  const link = new URL('../sarrafino/?ref=' + encodeURIComponent(data.code), location.href).href;
  const msg = _('سلام! من حساب صرافی‌ام را با صرافینو نگه می‌دارم: معامله، طلب و بدهی مشتری، صندوق‌ها و رسید واتس‌اپ. با این لینک ثبت‌نام کنید، بعد از اولین اشتراک هر دو {d} روز رایگان می‌گیریم:', {d: days}) + '\n' + link;
  el.innerHTML = `<h3>🎁 ${_('صرافی‌های دیگر را معرفی کنید')}</h3>
    <p class="hint" style="margin-top:0">${_('هر صرافی که با لینک شما ثبت‌نام کند و اولین اشتراکش را بخرد، هم شما و هم او {d} روز اشتراک رایگان می‌گیرید.', {d: days})}</p>
    <div class="grid g2"><div class="stat"><div class="l">${_('ثبت‌نام با لینک شما')}</div><div class="v">${fmt(data.joined || 0, 0)}</div></div>
      <div class="stat"><div class="l">${_('جایزه گرفته')}</div><div class="v">${fmt(data.rewarded || 0, 0)}</div></div></div>
    <div class="fld"><label>${_('لینک معرفی شما')}</label><input class="in" id="refLink" dir="ltr" readonly value="${esc(link)}"></div>
    <div class="btns"><a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">💬 ${_('ارسال در واتس‌اپ')}</a><button class="btn g" id="refCopy">📋 ${_('کپی لینک')}</button></div>`;
  $('refCopy').onclick = async () => { try { await navigator.clipboard.writeText(link); } catch (e) { $('refLink').select(); document.execCommand('copy'); } toast(_('کپی شد')); };
}

/* ---------------------------------------------------------------- terms at sign-up */
const termsUrl = () => new URL('../sarrafino/terms.html', location.href).href;
const termsBox = () => `<label class="terms"><input type="checkbox" id="aTerms"> <span>${_('<a href="{u}" target="_blank" rel="noopener">شرایط استفاده و حریم خصوصی</a> را خواندم و می‌پذیرم', {u: termsUrl()})}</span></label>`;

I18N.addPhrases({
tr: {'در حال آماده کردن صرافی نمونه…': 'Örnek büro hazırlanıyor…', 'صرافی نمونه': 'Örnek Döviz Bürosu', 'استانبول': 'İstanbul', 'علی رضایی': 'Ali Rezai', 'شرکت آریا تجارت': 'Arya Ticaret Ltd.',
  'حالت نمایشی': 'Deneme modu', 'این یک صرافی نمونه با داده‌های ساختگی است و ۲۴ ساعت بعد پاک می‌شود. هر کاری می‌خواهید امتحان کنید.': 'Bu, uydurma verilerle örnek bir bürodur ve 24 saat sonra silinir. İstediğiniz her şeyi deneyin.',
  'ثبت‌نام واقعی — رایگان': 'Gerçek kayıt — ücretsiz', 'امتحان بدون ثبت‌نام': 'Kayıt olmadan deneyin', 'یک صرافی نمونه با داده‌های ساختگی باز می‌شود؛ بدون ایمیل و رمز.': 'Uydurma verilerle örnek bir büro açılır; e-posta ve şifre gerekmez.',
  'موجودی اول دوره صندوق‌ها را وارد کنید': 'Kasaların açılış bakiyesini girin', 'نرخ‌های تابلو را تنظیم کنید': 'Pano kurlarını ayarlayın', 'اولین مشتری را اضافه کنید': 'İlk müşteriyi ekleyin',
  'اولین معامله را ثبت کنید': 'İlk işlemi kaydedin', 'شریک یا کارمند را دعوت کنید (اختیاری)': 'Ortak veya çalışan davet edin (isteğe bağlı)', 'ورود دو مرحله‌ای را روشن کنید (امنیت بیشتر)': 'İki adımlı girişi açın (daha fazla güvenlik)',
  'شروع کار با صرافینو': 'Sarrafino ile başlangıç', '{d} از {n}': '{d}/{n}', 'بستن': 'Kapat',
  'صرافی‌های دیگر را معرفی کنید': 'Diğer bürolara önerin', 'در حال بارگذاری…': 'Yükleniyor…',
  'سلام! من حساب صرافی‌ام را با صرافینو نگه می‌دارم: معامله، طلب و بدهی مشتری، صندوق‌ها و رسید واتس‌اپ. با این لینک ثبت‌نام کنید، بعد از اولین اشتراک هر دو {d} روز رایگان می‌گیریم:': 'Merhaba! Büromun hesabını Sarrafino ile tutuyorum: işlemler, müşteri bakiyeleri, kasalar ve WhatsApp makbuzu. Bu bağlantıyla kaydolun; ilk aboneliğinizden sonra ikimiz de {d} gün ücretsiz kullanırız:',
  'هر صرافی که با لینک شما ثبت‌نام کند و اولین اشتراکش را بخرد، هم شما و هم او {d} روز اشتراک رایگان می‌گیرید.': 'Bağlantınızla kaydolup ilk aboneliğini alan her büro için hem siz hem o {d} gün ücretsiz abonelik kazanırsınız.',
  'ثبت‌نام با لینک شما': 'Bağlantınızla kayıt', 'جایزه گرفته': 'Ödül alındı', 'لینک معرفی شما': 'Öneri bağlantınız', 'ارسال در واتس‌اپ': 'WhatsApp’ta gönder', 'کپی لینک': 'Bağlantıyı kopyala', 'کپی شد': 'Kopyalandı',
  '<a href="{u}" target="_blank" rel="noopener">شرایط استفاده و حریم خصوصی</a> را خواندم و می‌پذیرم': '<a href="{u}" target="_blank" rel="noopener">Kullanım koşulları ve gizlilik</a> metnini okudum ve kabul ediyorum',
  'برای ثبت‌نام، شرایط استفاده را بپذیرید': 'Kayıt için kullanım koşullarını kabul edin', 'کد معرفی': 'Öneri kodu', 'با کد معرفی {c} ثبت‌نام می‌کنید': '{c} öneri koduyla kaydoluyorsunuz',
  'در حالت نمایشی نمی‌شود صرافی واقعی ساخت. اول «ثبت‌نام واقعی» را بزنید.': 'Deneme modunda gerçek büro oluşturulamaz. Önce «Gerçek kayıt»a dokunun.'},
en: {'در حال آماده کردن صرافی نمونه…': 'Preparing a sample exchange…', 'صرافی نمونه': 'Sample Exchange', 'استانبول': 'Istanbul', 'علی رضایی': 'Ali Rezaei', 'شرکت آریا تجارت': 'Arya Trading Co.',
  'حالت نمایشی': 'Demo mode', 'این یک صرافی نمونه با داده‌های ساختگی است و ۲۴ ساعت بعد پاک می‌شود. هر کاری می‌خواهید امتحان کنید.': 'This is a sample exchange with made-up data, deleted after 24 hours. Try anything you like.',
  'ثبت‌نام واقعی — رایگان': 'Real sign-up — free', 'امتحان بدون ثبت‌نام': 'Try it without signing up', 'یک صرافی نمونه با داده‌های ساختگی باز می‌شود؛ بدون ایمیل و رمز.': 'Opens a sample exchange with made-up data — no email or password.',
  'موجودی اول دوره صندوق‌ها را وارد کنید': 'Enter the opening balance of your cash boxes', 'نرخ‌های تابلو را تنظیم کنید': 'Set up your rate board', 'اولین مشتری را اضافه کنید': 'Add your first customer',
  'اولین معامله را ثبت کنید': 'Record your first trade', 'شریک یا کارمند را دعوت کنید (اختیاری)': 'Invite a partner or staff member (optional)', 'ورود دو مرحله‌ای را روشن کنید (امنیت بیشتر)': 'Turn on two-step login (more security)',
  'شروع کار با صرافینو': 'Getting started with Sarrafino', '{d} از {n}': '{d} of {n}', 'بستن': 'Close',
  'صرافی‌های دیگر را معرفی کنید': 'Refer other exchange offices', 'در حال بارگذاری…': 'Loading…',
  'سلام! من حساب صرافی‌ام را با صرافینو نگه می‌دارم: معامله، طلب و بدهی مشتری، صندوق‌ها و رسید واتس‌اپ. با این لینک ثبت‌نام کنید، بعد از اولین اشتراک هر دو {d} روز رایگان می‌گیریم:': 'Hi! I keep my exchange office’s books with Sarrafino: trades, customer balances, cash boxes and WhatsApp receipts. Sign up with this link — after your first subscription we both get {d} days free:',
  'هر صرافی که با لینک شما ثبت‌نام کند و اولین اشتراکش را بخرد، هم شما و هم او {d} روز اشتراک رایگان می‌گیرید.': 'For every exchange office that signs up with your link and buys its first subscription, you both get {d} free days.',
  'ثبت‌نام با لینک شما': 'Signed up with your link', 'جایزه گرفته': 'Rewarded', 'لینک معرفی شما': 'Your referral link', 'ارسال در واتس‌اپ': 'Send on WhatsApp', 'کپی لینک': 'Copy link', 'کپی شد': 'Copied',
  '<a href="{u}" target="_blank" rel="noopener">شرایط استفاده و حریم خصوصی</a> را خواندم و می‌پذیرم': 'I have read and accept the <a href="{u}" target="_blank" rel="noopener">terms of use and privacy policy</a>',
  'برای ثبت‌نام، شرایط استفاده را بپذیرید': 'Please accept the terms of use to sign up', 'کد معرفی': 'Referral code', 'با کد معرفی {c} ثبت‌نام می‌کنید': 'Signing up with referral code {c}',
  'در حالت نمایشی نمی‌شود صرافی واقعی ساخت. اول «ثبت‌نام واقعی» را بزنید.': 'A real exchange cannot be created in demo mode. Tap “Real sign-up” first.'},
ar: {'در حال آماده کردن صرافی نمونه…': 'جارٍ تجهيز مكتب صرافة تجريبي…', 'صرافی نمونه': 'صرافة تجريبية', 'استانبول': 'إسطنبول', 'علی رضایی': 'علي رضائي', 'شرکت آریا تجارت': 'شركة آريا للتجارة',
  'حالت نمایشی': 'الوضع التجريبي', 'این یک صرافی نمونه با داده‌های ساختگی است و ۲۴ ساعت بعد پاک می‌شود. هر کاری می‌خواهید امتحان کنید.': 'هذا مكتب صرافة تجريبي ببيانات وهمية ويُحذف بعد ٢٤ ساعة. جرّب ما تشاء.',
  'ثبت‌نام واقعی — رایگان': 'تسجيل حقيقي — مجاناً', 'امتحان بدون ثبت‌نام': 'جرّب دون تسجيل', 'یک صرافی نمونه با داده‌های ساختگی باز می‌شود؛ بدون ایمیل و رمز.': 'يُفتح مكتب صرافة تجريبي ببيانات وهمية؛ دون بريد إلكتروني أو كلمة مرور.',
  'موجودی اول دوره صندوق‌ها را وارد کنید': 'أدخل الرصيد الافتتاحي للصناديق', 'نرخ‌های تابلو را تنظیم کنید': 'اضبط أسعار اللوحة', 'اولین مشتری را اضافه کنید': 'أضف أول عميل',
  'اولین معامله را ثبت کنید': 'سجّل أول معاملة', 'شریک یا کارمند را دعوت کنید (اختیاری)': 'ادعُ شريكاً أو موظفاً (اختياري)', 'ورود دو مرحله‌ای را روشن کنید (امنیت بیشتر)': 'فعّل الدخول بخطوتين (أمان أكبر)',
  'شروع کار با صرافینو': 'البدء مع صرافينو', '{d} از {n}': '{d} من {n}', 'بستن': 'إغلاق',
  'صرافی‌های دیگر را معرفی کنید': 'عرّف مكاتب صرافة أخرى', 'در حال بارگذاری…': 'جارٍ التحميل…',
  'سلام! من حساب صرافی‌ام را با صرافینو نگه می‌دارم: معامله، طلب و بدهی مشتری، صندوق‌ها و رسید واتس‌اپ. با این لینک ثبت‌نام کنید، بعد از اولین اشتراک هر دو {d} روز رایگان می‌گیریم:': 'مرحباً! أدير حسابات مكتب الصرافة الخاص بي عبر صرافينو: المعاملات وذمم العملاء والصناديق وإيصالات واتساب. سجّل عبر هذا الرابط، وبعد أول اشتراك لك نحصل كلانا على {d} يوماً مجاناً:',
  'هر صرافی که با لینک شما ثبت‌نام کند و اولین اشتراکش را بخرد، هم شما و هم او {d} روز اشتراک رایگان می‌گیرید.': 'عن كل مكتب صرافة يسجّل عبر رابطك ويشتري أول اشتراك، تحصلان كلاكما على {d} يوماً مجاناً.',
  'ثبت‌نام با لینک شما': 'سجّلوا عبر رابطك', 'جایزه گرفته': 'حصلوا على المكافأة', 'لینک معرفی شما': 'رابط الدعوة الخاص بك', 'ارسال در واتس‌اپ': 'إرسال عبر واتساب', 'کپی لینک': 'نسخ الرابط', 'کپی شد': 'تم النسخ',
  '<a href="{u}" target="_blank" rel="noopener">شرایط استفاده و حریم خصوصی</a> را خواندم و می‌پذیرم': 'قرأت <a href="{u}" target="_blank" rel="noopener">شروط الاستخدام وسياسة الخصوصية</a> وأوافق عليها',
  'برای ثبت‌نام، شرایط استفاده را بپذیرید': 'يرجى قبول شروط الاستخدام للتسجيل', 'کد معرفی': 'رمز الدعوة', 'با کد معرفی {c} ثبت‌نام می‌کنید': 'أنت تسجّل برمز الدعوة {c}',
  'در حالت نمایشی نمی‌شود صرافی واقعی ساخت. اول «ثبت‌نام واقعی» را بزنید.': 'لا يمكن إنشاء مكتب حقيقي في الوضع التجريبي. اضغط «تسجيل حقيقي» أولاً.'},
});
