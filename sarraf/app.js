'use strict';
/* صرافینو — multi-exchange accounting for small currency exchanges */

const sb = supabase.createClient(window.SARRAF_CONFIG.url, window.SARRAF_CONFIG.key, {global:{fetch:(u, o = {}) => fetch(u, {...o, cache:'no-store'})}});
const MARKET_URL = 'https://raw.githubusercontent.com/mehdi2044/arzino/data/latest.json';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const CCY = {
  USD:{fa:'دلار', s:'$'}, TRY:{fa:'لیر', s:'₺'}, IRT:{fa:'تومان', s:'ت'}, EUR:{fa:'یورو', s:'€'}, // i18n-skip
  USDT:{fa:'تتر', s:'₮'}, GBP:{fa:'پوند', s:'£'}, AED:{fa:'درهم', s:'AED'}, CAD:{fa:'دلار کانادا', s:'C$'}, // i18n-skip
  CHF:{fa:'فرانک', s:'CHF'}, CNY:{fa:'یوان', s:'¥'}, IQD:{fa:'دینار عراق', s:'IQD'}, // i18n-skip
};
const CCYS = Object.keys(CCY);
const PC = () => I18N.lang === 'fa' ? '٪' : '%';
const cn = c => I18N.has('s.' + c) ? t('s.' + c) : c;                       // currency name in current language
const sym = c => c === 'IRT' && I18N.lang !== 'fa' ? 'IRT' : (CCY[c]?.s || c);
const ROLE_FA = {owner:'مالک', partner:'شریک', staff:'کارمند'}; // i18n-skip
const ROLE = new Proxy(ROLE_FA, {get: (o, k) => _(o[k])});
const TYPE_FA = {
  trade:['💱','معامله'], deposit:['⬇️','واریز مشتری'], withdraw:['⬆️','پرداخت به مشتری'], // i18n-skip
  trust_out:['🤝','امانت دادیم'], trust_return_in:['↩️','امانت برگشت'], trust_in:['📥','امانت گرفتیم'], trust_return_out:['↪️','امانت پس دادیم'], // i18n-skip
  expense:['🧾','هزینه'], capital_in:['🏦','آورده شریک'], capital_out:['💼','برداشت شریک'], // i18n-skip
  transfer:['🔁','انتقال بین صندوق‌ها'], opening:['📌','موجودی اول دوره'], adjust:['⚖️','اصلاحیه'], // i18n-skip
};
const TYPE = new Proxy(TYPE_FA, {get: (o, k) => o[k] && [o[k][0], _(o[k][1])]});
const EXP_CATS = ['هزینه ارسال','هزینه دریافت','بسته‌بندی','کارمزد بانک','اجاره','حقوق','پذیرایی','متفرقه']; // i18n-skip (stored in Persian, shown translated)
const BOARD_DEFAULT = [['USD','TRY'],['EUR','TRY'],['USDT','TRY'],['GBP','TRY'],['USD','IRT'],['EUR','IRT'],['TRY','IRT'],['USDT','IRT']];

const S = {user:null, mems:[], ex:null, role:null, boxes:[], customers:[], members:[], board:[], bal:[], market:null,
  view:'home', custId:null, txFilter:'', recentTrades:[]};

/* ---------------------------------------------------------------- utils */
function fmt(v, d) {
  if (v == null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  if (d == null) d = a >= 1000 ? 0 : a >= 1 ? 2 : 6;
  return new Intl.NumberFormat('en-US', {maximumFractionDigits: d}).format(v);
}
function money(v, c, d) { return `${fmt(v, d ?? (c === 'IRT' ? 0 : undefined))} ${sym(c)}`; }
function num(s) {
  s = String(s ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  const v = parseFloat(s); return isFinite(v) ? v : NaN;
}
function words(v) { return I18N.words(v, fmt); }
const jd = (t, o) => new Intl.DateTimeFormat(I18N.dateLocale(), o || {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date(t));
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 2600); }
const isMgr = () => S.role === 'owner' || S.role === 'partner';
const ccyOpts = (sel, list = CCYS) => list.map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${cn(c)} (${c})</option>`).join('');
function err(e) { console.error(e); toast((_('خطا:') + ' ') + (e?.message || e)); }

/* ---------------------------------------------------------------- theme */
function applyTheme() {
  let t = 'auto'; try { t = localStorage.getItem('sarraf.theme') || 'auto'; } catch {}
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]').content = dark ? '#060c18' : '#0b1f3a';
  return t;
}
function cycleTheme() {
  const order = ['auto', 'light', 'dark']; let t = 'auto'; try { t = localStorage.getItem('sarraf.theme') || 'auto'; } catch {}
  const n = order[(order.indexOf(t) + 1) % 3]; try { localStorage.setItem('sarraf.theme', n); } catch {}
  applyTheme(); toast(n === 'auto' ? _('پوسته: خودکار') : n === 'dark' ? (_('پوسته: شب') + ' 🌙') : (_('پوسته: روز') + ' ☀️'));
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ---------------------------------------------------------------- market */
async function loadMarket() {
  try {
    const d = await (await fetch(MARKET_URL + '?t=' + Math.floor(Date.now() / 60000), {cache:'no-store'})).json();
    S.market = d;
  } catch { S.market = S.market || null; }
}
function usdOf(c) {                      // market USD value of 1 unit
  const m = S.market; if (!m) return null;
  if (c === 'USD') return 1;
  if (c === 'IRT') { const t = m.iran?.USD || m.toman_per_usd; return t ? 1 / t : null; }
  if (c === 'IQD') return m.usd?.IQD || 0.00076;
  return m.usd?.[c] ?? null;
}
function strongWeak(a, b) { const ua = usdOf(a) ?? 1, ub = usdOf(b) ?? 1; return ua >= ub ? [a, b] : [b, a]; }
function mktRate(strong, weak) { const s = usdOf(strong), w = usdOf(weak); return s && w ? s / w : null; }
const base = () => S.ex?.base_ccy || 'USD';
function inBase(amount, c, usdRate) { const u = usdRate ?? usdOf(c), b = usdOf(base()); return u && b ? amount * u / b : null; }

/* ---------------------------------------------------------------- data */
async function fetchAll(q) {               // paginate past the 1000-row API limit
  let out = [], from = 0;
  for (;;) {
    const {data, error} = await q().range(from, from + 999);
    if (error) throw error;
    out = out.concat(data); if (data.length < 1000) return out; from += 1000;
  }
}
async function loadExchangeData() {
  const ex = S.ex.id;
  const [boxes, customers, members, board, bal, trades] = await Promise.all([
    sb.from('boxes').select('*').eq('exchange_id', ex).order('sort'),
    fetchAll(() => sb.from('customers').select('*').eq('exchange_id', ex).order('name')),
    sb.from('members').select('*').eq('exchange_id', ex),
    sb.from('rates').select('*').eq('exchange_id', ex),
    fetchAll(() => sb.from('v_balances').select('*').eq('exchange_id', ex)),
    sb.from('txns').select('meta,occurred_at').eq('exchange_id', ex).eq('type', 'trade').eq('voided', false).order('occurred_at', {ascending:false}).limit(400),
  ]);
  for (const r of [boxes, members, board, trades]) if (r.error) throw r.error;
  S.boxes = boxes.data; S.customers = customers; S.members = members.data; S.board = board.data; S.bal = bal;
  S.recentTrades = trades.data;
}
const box = id => S.boxes.find(b => b.id === id);
const cust = id => S.customers.find(c => c.id === id);
const memberName = id => S.members.find(m => m.user_id === id)?.display_name || '—';
function balOf(party, key, id) {          // {ccy: amount}
  const o = {};
  for (const r of S.bal) if (r.party === party && r[key] === id) o[r.currency] = (o[r.currency] || 0) + Number(r.amount);
  return o;
}
function chipsFor(o, invert) {           // customer: + = owes us (red), - = we owe (green)
  const e = Object.entries(o).filter(([, v]) => Math.abs(v) > 1e-9);
  if (!e.length) return ('<span class="chip">' + _('تسویه') + '</span>');
  return e.map(([c, v]) => `<span class="chip ${(invert ? -v : v) > 0 ? 'pos' : 'neg'}">${money(Math.abs(v), c)} ${(invert ? -v : v) > 0 ? _('بدهکار') : _('طلبکار')}</span>`).join('');
}

/* ---------------------------------------------------------------- auth */
async function boot() {
  const {data: {session}} = await sb.auth.getSession();
  S.user = session?.user || null;
  if (!S.user) return renderAuth();
  await sb.rpc('accept_invites', {p_display_name: S.user.user_metadata?.name || null});
  const {data, error} = await sb.from('members').select('role, display_name, exchange_id, exchanges(id,name,base_ccy,settings)').eq('user_id', S.user.id);
  if (error) return err(error);
  S.mems = data;
  if (!data.length) return renderCreateExchange();
  const last = localStorage.getItem('sarraf.ex');
  const m = data.find(x => x.exchange_id === last) || data[0];
  await openExchange(m);
}
async function openExchange(m) {
  S.ex = m.exchanges; S.role = m.role; localStorage.setItem('sarraf.ex', S.ex.id);
  $('app').innerHTML = ('<div class="boot">' + _('در حال بارگذاری حساب‌ها…') + '</div>');
  try { await Promise.all([loadExchangeData(), loadMarket()]); } catch (e) { return err(e); }
  render();
}
function renderAuth(mode = 'login') {
  $('app').innerHTML = `<div class="auth">
    <div class="auth-lang">${I18N.picker('lang-sel', true)}</div>
    <div class="hero3d"><div class="coin">${_('ص')}</div><h1>${_('صرافینو')}</h1><div class="muted">${_('حسابداری ساده و امن برای صرافی‌ها')}</div></div>
    <div class="card" style="margin-top:18px">
      <div class="seg" style="margin-bottom:12px"><button class="${mode === 'login' ? 'on' : ''}" data-m="login">${_('ورود')}</button><button class="${mode === 'signup' ? 'on' : ''}" data-m="signup">${_('ثبت‌نام')}</button></div>
      ${mode === 'signup' ? ('<div class="fld">' + '<label>' + _('نام شما') + '</label>' + '<input class="in" id="aName" autocomplete="name">' + '</div>') : ''}
      <div class="fld"><label>${_('ایمیل')}</label><input class="in" id="aEmail" type="email" autocomplete="email" dir="ltr"></div>
      <div class="fld"><label>${_('رمز عبور')} ${mode === 'signup' ? _('(حداقل ۶ کاراکتر)') : ''}</label><input class="in" id="aPass" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" dir="ltr"></div>
      <button class="btn p w" id="aGo">${mode === 'login' ? _('ورود') : _('ساخت حساب')}</button>
      <p class="hint">${mode === 'signup' ? _('اگر صاحب صرافی شما را دعوت کرده، با همان ایمیلی که داده ثبت‌نام کنید تا خودکار به صرافی وصل شوید.') : ''}</p>
    </div></div>`;
  S.screen = () => renderAuth(mode); I18N.bindPickers();
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => renderAuth(b.dataset.m));
  $('aGo').onclick = async () => {
    const email = $('aEmail').value.trim(), password = $('aPass').value;
    if (!email || password.length < 6) return toast(_('ایمیل و رمز (حداقل ۶ کاراکتر) را وارد کنید'));
    $('aGo').disabled = true;
    const r = mode === 'login' ? await sb.auth.signInWithPassword({email, password})
      : await sb.auth.signUp({email, password, options:{data:{name: $('aName').value.trim()}, emailRedirectTo: location.origin + location.pathname}});
    $('aGo').disabled = false;
    if (r.error) return toast(r.error.message.includes('Invalid login') ? _('ایمیل یا رمز اشتباه است') : r.error.message);
    if (mode === 'signup' && !r.data.session) {
      $('app').innerHTML = `<div class="auth"><div class="card center"><h2>📧 ${_('ایمیل خود را چک کنید')}</h2><p>${_('یک لینک تأیید به {e} فرستاده شد. روی لینک بزنید تا وارد صرافینو شوید.', {e: `<b dir="ltr">${esc(email)}</b>`})}</p><p class="hint">${_('اگر نیامد، پوشه‌ی Spam را هم ببینید.')}</p><button class="btn g w" onclick="location.reload()">${_('بازگشت به ورود')}</button></div></div>`;
      return;
    }
    boot();
  };
}
function renderCreateExchange() {
  S.screen = renderCreateExchange;
  $('app').innerHTML = `<div class="auth"><div class="card">
    <h2 style="margin-top:0">🏪 ${_('ساخت صرافی جدید')}</h2>
    <p class="muted small">${_('اگر قرار است عضو صرافی دیگری شوید، از مالک بخواهید ایمیل شما را دعوت کند و سپس دوباره وارد شوید.')}</p>
    <div class="fld"><label>${_('نام صرافی')}</label><input class="in" id="exName" placeholder="${_('مثلاً صرافی آریا')}"></div>
    <div class="fld"><label>${_('نام شما')}</label><input class="in" id="exMe" value="${esc(S.user.user_metadata?.name || '')}"></div>
    <div class="fld"><label>${_('ارز گزارش سود و زیان')}</label><select class="in" id="exBase">${ccyOpts('USD', ['USD','TRY','IRT','EUR'])}</select></div>
    <button class="btn p w" id="exGo">${_('ساخت صرافی')}</button>
    <div class="btns"><button class="btn g" id="exOut">${_('خروج از حساب')}</button><button class="btn g" id="exRe">${_('بررسی دعوت‌ها')}</button></div>
  </div></div>`;
  $('exGo').onclick = async () => {
    const n = $('exName').value.trim(); if (!n) return toast(_('نام صرافی را وارد کنید'));
    if ($('exGo').disabled) return; $('exGo').disabled = true; $('exGo').textContent = _('در حال ساخت…');
    const {error} = await sb.rpc('create_exchange', {p_name:n, p_display_name:$('exMe').value.trim() || S.user.email, p_base:$('exBase').value});
    if (error) { $('exGo').disabled = false; $('exGo').textContent = _('ساخت صرافی'); return err(error); }
    toast((_('صرافی ساخته شد') + ' 🎉')); boot();
  };
  $('exOut').onclick = async () => { await sb.auth.signOut(); boot(); };
  $('exRe').onclick = boot;
}

/* ---------------------------------------------------------------- shell */
const VIEWS = [['home','🏠','داشبورد'], ['txns','📒','دفتر'],['customers','👥','مشتری‌ها'],['board','📣','تابلو'],['reports','📊','گزارش‌ها'],['more','⚙️','بیشتر']]; // i18n-skip
// default names created in Persian by the database are shown in the chosen language
function localizeNames() {
  for (const b of S.boxes) { b.raw ??= b.name; b.name = _(b.raw); }
  for (const c of S.customers) if (c.is_walkin) { c.raw ??= c.name; c.rawN ??= c.notes; c.name = _(c.raw); c.notes = c.rawN && _(c.rawN); }
}
function render() {
  S.screen = render; localizeNames();
  const V = {home:vHome, txns:vTxns, customers:vCustomers, customer:vCustomer, board:vBoard, reports:vReports, more:vMore}[S.view] || vHome;
  $('app').innerHTML = `<div class="wrap">
    <div class="top"><div class="brand"><div class="coin">${S.ex.settings?.logo ? `<img src="${S.ex.settings.logo}" alt="">` : esc((S.ex.name || _('ص')).trim()[0])}</div><div><h1>${esc(S.ex.name)}</h1><small>${esc(memberName(S.user.id))} · ${ROLE[S.role]}</small></div></div>
      <div class="acts">${I18N.picker('lang-sel')}<a class="ibtn" href="../" title="${_('نرخ لحظه‌ای ارزینو')}">📈<span class="lbl"> ${_('ارزینو')}</span></a><button class="ibtn" id="thm" title="${_('روز / شب')}">🌓</button><button class="ibtn" id="reload" title="${_('بروزرسانی')}">↻</button>${S.mems.length > 1 ? '<button class="ibtn" id="swEx">🏪</button>' : ''}</div></div>
    <div id="view"></div></div>
    <nav class="tabs">${VIEWS.map(([k, i, l]) => `<button class="tab ${S.view === k || (S.view === 'customer' && k === 'customers') ? 'on' : ''}" data-v="${k}"><span>${i}</span>${_(l)}</button>`).join('')}</nav>`;
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => { S.view = t.dataset.v; render(); scrollTo(0, 0); });
  $('thm').onclick = cycleTheme; I18N.bindPickers();
  $('reload').onclick = async () => { toast(_('در حال بروزرسانی…')); await Promise.all([loadExchangeData(), loadMarket()]); render(); };
  if ($('swEx')) $('swEx').onclick = () => openSheet(`<h2>${_('انتخاب صرافی')}</h2><div class="list">${S.mems.map(m => `<div class="row" data-ex="${m.exchange_id}"><div class="ic">🏪</div><div class="m"><b>${esc(m.exchanges.name)}</b><span>${ROLE[m.role]}</span></div></div>`).join('')}</div>`,
    () => document.querySelectorAll('[data-ex]').forEach(r => r.onclick = () => { closeSheet(); openExchange(S.mems.find(m => m.exchange_id === r.dataset.ex)); }));
  V($('view'));
}
async function refresh() { await loadExchangeData(); render(); }

/* ---------------------------------------------------------------- views */
function quickActions() {
  return `<div class="qa">
    <button class="c1" data-act="trade"><span>💱</span>${_('معامله')}</button>
    <button class="c2" data-act="money"><span>⬇️⬆️</span>${_('واریز / پرداخت')}</button>
    <button class="c3" data-act="trust"><span>🤝</span>${_('امانت')}</button>
    <button class="c4" data-act="expense"><span>🧾</span>${_('هزینه')}</button>
  </div>`;
}
function bindQA(root, pre = {}) {
  root.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ({trade:formTrade, money:formMoney, trust:formTrust, expense:formExpense,
    transfer:formTransfer, capital:formCapital, opening:formOpening})[b.dataset.act](pre));
}
function boxTotals() {
  return S.boxes.filter(b => !b.archived).map(b => ({b, v: balOf('box', 'box_id', b.id)[b.currency] || 0}));
}
function vHome(el) {
  const bt = boxTotals();
  const custBal = {};                     // per currency: receivable / payable
  for (const r of S.bal) if (r.party === 'customer') {
    const k = r.currency; custBal[k] = custBal[k] || {rec:0, pay:0};
  }
  const perCust = {};
  for (const r of S.bal) if (r.party === 'customer') { (perCust[r.customer_id] ||= {})[r.currency] = ((perCust[r.customer_id] || {})[r.currency] || 0) + Number(r.amount); }
  for (const o of Object.values(perCust)) for (const [c, v] of Object.entries(o)) { custBal[c] ||= {rec:0, pay:0}; if (v > 0) custBal[c].rec += v; else custBal[c].pay -= v; }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayProfit = S.recentTrades.filter(t => new Date(t.occurred_at) >= today).reduce((s, t) => s + (t.meta?.profit_base || 0), 0);
  const todayCount = S.recentTrades.filter(t => new Date(t.occurred_at) >= today).length;
  const due = dueBoardSlot();
  el.innerHTML = (due ? `<div class="card remind"><h3>📣 ${_('وقت ارسال تابلوی نرخ ساعت {t} است', {t: due.time})} <span><button class="btn wa" id="remGo">${_('ارسال تابلو')}</button> <button class="btn g" id="remDone">${_('ارسال شد')} ✓</button></span></h3></div>` : '') + quickActions() + `
    <div class="card"><h3>💰 ${_('موجودی صندوق‌ها')} <button class="ibtn small" data-act="transfer">🔁 ${_('انتقال')}</button></h3>
      <div class="grid g3">${bt.map(({b, v}) => `<div class="stat"><div class="l">${esc(b.name)}</div><div class="v ${v < 0 ? 'down' : ''}">${money(v, b.currency)}</div></div>`).join('') || ('<p class="muted">' + _('صندوقی تعریف نشده') + '</p>')}</div></div>
    <div class="grid g2">
      <div class="card"><h3>📅 ${_('امروز')}</h3><div class="grid g2">
        <div class="stat"><div class="l">${_('تعداد معامله')}</div><div class="v">${fmt(todayCount, 0)}</div></div>
        ${isMgr() ? `<div class="stat"><div class="l">${_('سود معاملات')}</div><div class="v ${todayProfit >= 0 ? 'up' : 'down'}">${money(todayProfit, base(), 2)}</div></div>` : ''}
      </div></div>
      <div class="card"><h3>👥 ${_('طلب و بدهی مشتری‌ها')}</h3>
        <table class="tbl"><tr><th>${_('ارز')}</th><th>${_('طلب ما از مشتری')}</th><th>${_('بدهی ما به مشتری')}</th></tr>
        ${Object.entries(custBal).filter(([, v]) => v.rec > 1e-9 || v.pay > 1e-9).map(([c, v]) => `<tr><td>${cn(c) || c}</td><td class="n down">${money(v.rec, c)}</td><td class="n up">${money(v.pay, c)}</td></tr>`).join('') || ('<tr>' + '<td colspan="3" class="muted">' + _('همه تسویه') + '</td>' + '</tr>')}</table></div>
    </div>
    ${boardCard()}`;
  bindQA(el);
  el.querySelectorAll('[data-board]').forEach(b => b.onclick = () => { S.view = 'board'; render(); });
  if (due) {
    $('remGo').onclick = () => { try { localStorage.setItem(due.key, '1'); } catch {} S.view = 'board'; render(); };
    $('remDone').onclick = () => { try { localStorage.setItem(due.key, '1'); } catch {} render(); };
  }
}
function boardCard() {
  const rows = boardRows().map(([c, q]) => ({c, q, r: S.board.find(x => x.ccy === c && x.quote === q), m: mktRate(c, q)}));
  return `<div class="card"><h3>📋 ${_('نرخ‌های امروز صرافی')} <button class="ibtn small" data-board>📣 ${_('تابلو و ویرایش')}</button></h3>
    <div class="tbl-wrap"><table class="tbl"><tr><th>${_('ارز')}</th><th>${_('خرید')}</th><th>${_('فروش')}</th><th>${_('بازار')}</th></tr>
    ${rows.map(({c, q, r, m}) => `<tr><td>${_('{a} به {b}', {a: cn(c), b: cn(q)})}</td><td class="n">${r?.buy ? fmt(r.buy) : '—'}</td><td class="n">${r?.sell ? fmt(r.sell) : '—'}</td><td class="n muted">${fmt(m)}</td></tr>`).join('')}
    </table></div></div>`;
}

let txCache = [];
async function vTxns(el) {
  el.innerHTML = `<div class="card"><div class="pair"><input class="in" id="txQ" placeholder="${_('جستجو در توضیحات یا نام مشتری')}" value="${esc(S.txFilter)}">
    <select class="in" id="txT"><option value="">${_('همه')}</option>${Object.entries(TYPE).map(([k, [i, l]]) => `<option value="${k}">${i} ${l}</option>`).join('')}</select></div></div>
    ${quickActions()}<div class="list" id="txList"><div class="empty">${_('در حال بارگذاری…')}</div></div>`;
  bindQA(el);
  const {data, error} = await sb.from('txns').select('*, lines(*)').eq('exchange_id', S.ex.id).order('occurred_at', {ascending:false}).limit(300);
  if (error) return err(error);
  txCache = data;
  const draw = () => {
    const q = $('txQ').value.trim(), t = $('txT').value; S.txFilter = q;
    const rows = txCache.filter(x => (!t || x.type === t) && (!q || (x.note || '').includes(q) || (cust(x.customer_id)?.name || '').includes(q)));
    $('txList').innerHTML = rows.map(txRow).join('') || ('<div class="empty">' + _('موردی نیست') + '</div>');
    $('txList').querySelectorAll('[data-tx]').forEach(r => r.onclick = () => txDetail(txCache.find(x => x.id === r.dataset.tx)));
  };
  $('txQ').oninput = draw; $('txT').onchange = draw; draw();
}
function txSummary(x) {
  const m = x.meta || {};
  if (x.type === 'trade') return _('داد {a} ← گرفت {b} · نرخ {r}', {a: money(m.give?.amt, m.give?.ccy), b: money(m.get?.amt, m.get?.ccy), r: fmt(m.rate)});
  const l = (x.lines || []).find(l => l.party === 'box') || (x.lines || [])[0];
  if (x.type === 'transfer') { const o = (x.lines || []).find(l => l.amount < 0), i = (x.lines || []).find(l => l.amount > 0); return _('{a} از {f} ← {b} به {t}', {a: money(-o?.amount, o?.currency), f: esc(box(o?.box_id)?.name), b: money(i?.amount, i?.currency), t: esc(box(i?.box_id)?.name)}); }
  return l ? money(Math.abs(l.amount), l.currency) + (l.box_id ? ' · ' + esc(box(l.box_id)?.name || '') : '') : '';
}
function txRow(x) {
  const [i, l] = TYPE[x.type] || ['•', x.type];
  const who = x.customer_id ? esc(cust(x.customer_id)?.name || '') : x.member_id ? esc(memberName(x.member_id)) : (x.category ? esc(_(x.category)) : '');
  return `<div class="row ${x.voided ? 'void' : ''}" data-tx="${x.id}"><div class="ic">${i}</div>
    <div class="m"><b>${l}${who ? ' · ' + who : ''}</b><span>${txSummary(x)}</span><br><span>${jd(x.occurred_at)}${x.note ? ' · ' + esc(x.note) : ''}</span></div>
    ${isMgr() && x.meta?.profit_base != null && !x.voided ? `<div class="e ${x.meta.profit_base >= 0 ? 'up' : 'down'} small">${fmt(x.meta.profit_base, 2)} ${sym(base())}</div>` : ''}</div>`;
}
function txDetail(x) {
  const [i, l] = TYPE[x.type] || ['•', x.type];
  const party = ln => ln.party === 'box' ? (_('صندوق:') + ' ') + esc(box(ln.box_id)?.name || '') : ln.party === 'customer' ? (_('حساب') + ' ') + esc(cust(ln.customer_id)?.name || '') :
    ln.party === 'trust' ? (_('امانت') + ' ') + esc(cust(ln.customer_id)?.name || '') : ln.party === 'expense' ? _('هزینه') : (_('سرمایه') + ' ') + esc(memberName(ln.member_id));
  openSheet(`<h2>${i} ${l} <span class="pill">#${x.no}</span></h2>
    ${x.voided ? `<p class="badge b-red">${_('باطل شده')}${x.void_reason ? ': ' + esc(x.void_reason) : ''}</p>` : ''}
    <p class="muted small">${jd(x.occurred_at)} · ${_('ثبت توسط')} ${esc(memberName(x.created_by))}</p>
    <div class="preview">${txSummary(x)}${x.note ? '<br>📝 ' + esc(x.note) : ''}${isMgr() && x.meta?.profit_base != null ? `<br>${_('سود نسبت به نرخ بازار:')} <b class="${x.meta.profit_base >= 0 ? 'up' : 'down'}">${money(x.meta.profit_base, base(), 2)}</b>` : ''}</div>
    <h4>${_('ردیف‌های حسابداری')}</h4>
    <table class="tbl">${(x.lines || []).map(ln => `<tr><td>${party(ln)}</td><td class="n ${ln.amount >= 0 ? 'up' : 'down'}">${ln.amount >= 0 ? '+' : ''}${money(ln.amount, ln.currency)}</td></tr>`).join('')}</table>
    ${isMgr() && !x.voided ? ('<div class="fld" style="margin-top:10px">' + '<label>' + _('برای باطل کردن، دلیل را بنویسید') + '</label>' + '<input class="in" id="shReason" placeholder="' + _('مثلاً اشتباه در مبلغ') + '">' + '</div>') : ''}
    <div class="btns"><button class="btn wa" id="shReceipt">🧾 ${_('رسید / واتس‌اپ')}</button>${isMgr() && !x.voided ? ('<button class="btn r" id="shVoid">' + _('باطل کردن') + '</button>') : ''}<button class="btn g" id="shClose">${_('بستن')}</button></div>`, () => {
    $('shClose').onclick = closeSheet;
    $('shReceipt').onclick = () => receiptSheet(x);
    if ($('shVoid')) $('shVoid').onclick = async () => {
      const reason = $('shReason').value.trim(); if (!reason) return toast(_('دلیل ابطال را بنویسید'));
      const {error} = await sb.rpc('void_txn', {p_id:x.id, p_reason:reason}); if (error) return err(error);
      closeSheet(); toast(_('تراکنش باطل شد')); await refresh();
    };
  });
}
function vCustomers(el) {
  const all = {};
  for (const r of S.bal) if (r.party === 'customer' || r.party === 'trust') { const o = (all[r.customer_id] ||= {c:{}, t:{}}); const k = r.party === 'customer' ? 'c' : 't'; o[k][r.currency] = (o[k][r.currency] || 0) + Number(r.amount); }
  el.innerHTML = `<div class="card"><div class="pair"><input class="in" id="cQ" placeholder="${_('جستجوی نام یا تلفن')}"><button class="btn p" id="cAdd">+ ${_('مشتری')}</button></div>
    <div class="seg" style="margin-top:8px" id="cF"><button class="on" data-f="">${_('همه')}</button><button data-f="debt">${_('بدهکارها')}</button><button data-f="cred">${_('طلبکارها')}</button><button data-f="trust">${_('امانت‌ها')}</button></div></div>
    <div class="list" id="cList"></div>`;
  let f = '';
  const draw = () => {
    const q = $('cQ').value.trim();
    const rows = S.customers.filter(c => !c.archived && (!q || c.name.includes(q) || (c.phone || '').includes(q))).filter(c => {
      const o = all[c.id] || {c:{}, t:{}};
      if (f === 'debt') return Object.values(o.c).some(v => v > 1e-9);
      if (f === 'cred') return Object.values(o.c).some(v => v < -1e-9);
      if (f === 'trust') return Object.values(o.t).some(v => Math.abs(v) > 1e-9);
      return true;
    });
    $('cList').innerHTML = rows.map(c => { const o = all[c.id] || {c:{}, t:{}}; const tr = Object.entries(o.t).filter(([, v]) => Math.abs(v) > 1e-9);
      return `<div class="row" data-c="${c.id}"><div class="ic">${c.is_walkin ? '🚶' : '👤'}</div><div class="m"><b>${esc(c.name)}</b><span>${esc(c.phone || '')}${c.notes ? ' · ' + esc(c.notes) : ''}</span>
      <div class="chips">${chipsFor(o.c)}${tr.map(([cc, v]) => `<span class="chip" style="background:#ede9fe;color:#5b21b6">🤝 ${money(Math.abs(v), cc)} ${v > 0 ? _('امانت نزد او') : _('امانت او نزد ما')}</span>`).join('')}</div></div></div>`; }).join('') || ('<div class="empty">' + _('مشتری‌ای نیست') + '</div>');
    $('cList').querySelectorAll('[data-c]').forEach(r => r.onclick = () => { S.view = 'customer'; S.custId = r.dataset.c; render(); scrollTo(0, 0); });
  };
  $('cQ').oninput = draw; $('cF').onclick = e => { const b = e.target.closest('button'); if (!b) return; f = b.dataset.f; $('cF').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  $('cAdd').onclick = () => formCustomer(null, () => draw());
  draw();
}
async function vCustomer(el) {
  const c = cust(S.custId); if (!c) { S.view = 'customers'; return render(); }
  el.innerHTML = `<div class="card"><h3>${c.is_walkin ? '🚶' : '👤'} ${esc(c.name)} <span><button class="ibtn small" id="cEdit">✏️</button> <button class="ibtn small" id="cBack">${_('بازگشت')}</button></span></h3>
    <p class="muted small">${esc(c.phone || _('بدون تلفن'))}${c.notes ? ' · ' + esc(c.notes) : ''}</p>
    <h4 style="margin:6px 0">${_('حساب جاری')}</h4><div class="chips">${chipsFor(balOf('customer', 'customer_id', c.id))}</div>
    <h4 style="margin:10px 0 6px">${_('امانت')}</h4><div class="chips">${Object.entries(balOf('trust', 'customer_id', c.id)).filter(([, v]) => Math.abs(v) > 1e-9).map(([cc, v]) => `<span class="chip">${money(Math.abs(v), cc)} ${v > 0 ? _('امانت ما نزد او') : _('امانت او نزد ما')}</span>`).join('') || ('<span class="chip">' + _('ندارد') + '</span>')}</div>
    <div class="btns">${normPhone(c.phone) ? `<a class="btn wa" href="https://wa.me/${normPhone(c.phone)}" target="_blank" rel="noopener">💬 ${_('واتس‌اپ')}</a>` : ''}<button class="btn g" id="cXls">📥 ${_('صورت‌حساب اکسل')}</button></div></div>
    ${quickActions()}<div class="card"><h3>📜 ${_('صورت‌حساب')}</h3><div class="tbl-wrap" id="stmt">${_('در حال بارگذاری…')}</div></div>`;
  bindQA(el, {customer_id:c.id});
  $('cBack').onclick = () => { S.view = 'customers'; render(); };
  $('cEdit').onclick = () => formCustomer(c, () => render());
  const {data, error} = await sb.from('lines').select('*, txns!inner(id,no,type,occurred_at,note,voided,meta)').eq('exchange_id', S.ex.id).eq('customer_id', c.id).eq('txns.voided', false);
  if (error) return err(error);
  data.sort((a, b) => new Date(a.txns.occurred_at) - new Date(b.txns.occurred_at));
  const run = {};
  const rows = data.map(l => { run[l.party + l.currency] = (run[l.party + l.currency] || 0) + Number(l.amount); return {l, bal: run[l.party + l.currency]}; });
  $('stmt').innerHTML = rows.length ? `<table class="tbl"><tr><th>${_('تاریخ')}</th><th>${_('شرح')}</th><th>${_('مبلغ')}</th><th>${_('مانده')}</th></tr>${rows.reverse().map(({l, bal}) =>
    `<tr><td class="small">${jd(l.txns.occurred_at, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})}</td><td class="small">${TYPE[l.txns.type]?.[1] || ''}${l.party === 'trust' ? (' ' + _('(امانت)')) : ''}${l.txns.note ? ' · ' + esc(l.txns.note) : ''}</td>
    <td class="n ${l.amount > 0 ? 'down' : 'up'}">${money(l.amount, l.currency)}</td><td class="n">${money(bal, l.currency)}</td></tr>`).join('')}</table>
    <p class="hint">${_('مبلغ مثبت یعنی مشتری بدهکار شده، منفی یعنی طلبکار شده.')}</p>` : ('<div class="empty">' + _('هنوز تراکنشی ندارد') + '</div>');
  $('cXls').onclick = () => xlsx(`statement-${c.name}`, [[_('تاریخ'), _('نوع'), _('توضیح'), _('ارز'), _('مبلغ'), _('مانده'), _('حساب')]].concat(rows.map(({l, bal}) =>
    [jd(l.txns.occurred_at), TYPE[l.txns.type]?.[1], l.txns.note || '', l.currency, Number(l.amount), bal, l.party === 'trust' ? _('امانت') : _('جاری')])));
}

/* ---------------------------------------------------------------- reports */
async function vReports(el) {
  if (!isMgr()) {
    el.innerHTML = `<div class="card"><h3>💰 ${_('موجودی صندوق‌ها')}</h3><div class="grid g3">${boxTotals().map(({b, v}) => `<div class="stat"><div class="l">${esc(b.name)}</div><div class="v">${money(v, b.currency)}</div></div>`).join('')}</div></div><p class="muted center">${_('گزارش سود و زیان فقط برای مالک و شرکا نمایش داده می‌شود.')}</p>`;
    return;
  }
  const B = base();
  // net position per currency
  const pos = {};
  for (const r of S.bal) {
    if (!['box','customer','trust'].includes(r.party)) continue;
    const p = (pos[r.currency] ||= {box:0, rec:0, pay:0, trust:0});
    const v = Number(r.amount);
    if (r.party === 'box') p.box += v; else if (r.party === 'trust') p.trust += v; else if (v > 0) p.rec += v; else p.pay += v;
  }
  let nav = 0, navOk = true;
  const posRows = Object.entries(pos).map(([c, p]) => { const tot = p.box + p.rec + p.pay + p.trust; const vb = inBase(tot, c); if (vb == null) navOk = false; else nav += vb; return {c, p, tot, vb}; })
    .filter(r => Math.abs(r.tot) > 1e-9 || Math.abs(r.p.box) > 1e-9);
  let capital = 0;
  for (const r of S.bal) if (r.party === 'equity') capital -= 0; // valued below from lines
  el.innerHTML = `<div class="card"><h3>📈 ${_('سود و زیان')} <span class="seg" id="rP"><button data-p="1" class="on">${_('امروز')}</button><button data-p="7">${_('۷ روز')}</button><button data-p="30">${_('۳۰ روز')}</button><button data-p="365">${_('۱ سال')}</button></span></h3><div id="pnl">${_('در حال محاسبه…')}</div></div>
    <div class="card"><h3>🧮 ${_('موجودی ارزی خالص (نسبت به نرخ امروز بازار)')}</h3>
      <div class="tbl-wrap"><table class="tbl"><tr><th>${_('ارز')}</th><th>${_('صندوق')}</th><th>${_('طلب از مشتری')}</th><th>${_('بدهی به مشتری')}</th><th>${_('امانت')}</th><th>${_('خالص')}</th><th>${_('ارزش')} (${cn(B)})</th></tr>
      ${posRows.map(({c, p, tot, vb}) => `<tr><td>${cn(c) || c}</td><td class="n">${fmt(p.box)}</td><td class="n down">${fmt(p.rec)}</td><td class="n up">${fmt(p.pay)}</td><td class="n">${fmt(p.trust)}</td><td class="n"><b>${fmt(tot)}</b></td><td class="n">${fmt(vb, 2)}</td></tr>`).join('')}
      <tr><td colspan="6"><b>${_('ارزش خالص کل صرافی')}</b></td><td class="n"><b>${navOk ? money(nav, B, 2) : '—'}</b></td></tr></table></div>
      <p class="hint">${_('خالص = صندوق + طلب از مشتری − بدهی به مشتری ± امانت. ارزش‌گذاری با نرخ امروز بازار.')}</p></div>
    <div class="card"><h3>📥 ${_('خروجی اکسل')}</h3><div class="btns"><button class="btn g" id="xTx">${_('دفتر معاملات')}</button><button class="btn g" id="xCu">${_('مانده مشتری‌ها')}</button><button class="btn g" id="xBx">${_('موجودی صندوق‌ها')}</button></div></div>`;
  let days = 1;
  const loadPnl = async () => {
    const from = new Date(); if (days === 1) from.setHours(0, 0, 0, 0); else from.setDate(from.getDate() - days);
    const rows = await fetchAll(() => sb.from('txns').select('type,meta,occurred_at,category,lines(party,amount,currency,usd_rate,member_id)').eq('exchange_id', S.ex.id).eq('voided', false).gte('occurred_at', from.toISOString()).in('type', ['trade','transfer','expense','capital_in','capital_out']));
    let trade = 0, nTrade = 0, conv = 0; const exp = {};
    for (const t of rows) {
      if (t.type === 'trade') { trade += t.meta?.profit_base || 0; nTrade++; }
      if (t.type === 'transfer') conv += t.meta?.profit_base || 0;
      if (t.type === 'expense') for (const l of t.lines) if (l.party === 'expense') exp[t.category || 'متفرقه'] = (exp[t.category || 'متفرقه'] || 0) + (inBase(Number(l.amount), l.currency, l.usd_rate) || 0); // i18n-skip
    }
    const expT = Object.values(exp).reduce((a, b) => a + b, 0), net = trade + conv - expT;
    const partners = S.members.filter(m => m.role !== 'staff' && Number(m.share_pct) > 0);
    $('pnl').innerHTML = `<div class="grid g4">
      <div class="stat"><div class="l">${_('سود معاملات ({n} معامله)', {n: fmt(nTrade, 0)})}</div><div class="v ${trade >= 0 ? 'up' : 'down'}">${money(trade, B, 2)}</div></div>
      <div class="stat"><div class="l">${_('سود تبدیل‌های داخلی')}</div><div class="v">${money(conv, B, 2)}</div></div>
      <div class="stat"><div class="l">${_('هزینه‌ها')}</div><div class="v down">${money(expT, B, 2)}</div></div>
      <div class="stat"><div class="l"><b>${_('سود خالص')}</b></div><div class="v ${net >= 0 ? 'up' : 'down'}"><b>${money(net, B, 2)}</b></div></div></div>
      ${Object.keys(exp).length ? `<h4>${_('ریز هزینه‌ها')}</h4><table class="tbl">${Object.entries(exp).map(([k, v]) => `<tr><td>${esc(_(k))}</td><td class="n">${money(v, B, 2)}</td></tr>`).join('')}</table>` : ''}
      ${partners.length ? `<h4>${_('سهم شرکا از سود خالص')}</h4><table class="tbl">${partners.map(m => `<tr><td>${esc(m.display_name)} (${fmt(m.share_pct, 2)}${PC()})</td><td class="n">${money(net * m.share_pct / 100, B, 2)}</td></tr>`).join('')}</table>` : ''}
      <p class="hint">${_('سود معامله = اختلاف نرخ شما با نرخ بازار در لحظه‌ی ثبت. ارزش‌ها به {c}.', {c: cn(B)})}</p>`;
  };
  $('rP').onclick = e => { const b = e.target.closest('button'); if (!b) return; days = +b.dataset.p; $('rP').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); loadPnl(); };
  loadPnl().catch(err);
  $('xBx').onclick = () => xlsx('boxes', [[_('صندوق'), _('ارز'), _('موجودی')]].concat(boxTotals().map(({b, v}) => [b.name, b.currency, v])));
  $('xCu').onclick = () => { const rows = [[_('مشتری'), _('تلفن'), _('حساب'), _('ارز'), _('مانده (+بدهکار / -طلبکار)')]];
    for (const r of S.bal) if ((r.party === 'customer' || r.party === 'trust') && Math.abs(r.amount) > 1e-9) { const c = cust(r.customer_id); rows.push([c?.name, c?.phone || '', r.party === 'trust' ? _('امانت') : _('جاری'), r.currency, Number(r.amount)]); }
    xlsx('customers', rows); };
  $('xTx').onclick = async () => {
    const rows = await fetchAll(() => sb.from('txns').select('*, lines(*)').eq('exchange_id', S.ex.id).order('occurred_at', {ascending:false}));
    xlsx('ledger', [[_('شماره'), _('تاریخ'), _('نوع'), _('مشتری/طرف'), _('شرح'), _('توضیح'), (_('سود') + ' (') + B + ')', _('ثبت‌کننده'), _('وضعیت')]].concat(rows.map(x =>
      [x.no, jd(x.occurred_at), TYPE[x.type]?.[1], cust(x.customer_id)?.name || (x.member_id ? memberName(x.member_id) : x.category || ''), txSummary(x).replace(/<[^>]+>/g, ''), x.note || '', x.meta?.profit_base ?? '', memberName(x.created_by), x.voided ? _('باطل') : ''])));
  };
}
function xlsx(name, rows) {
  if (!window.XLSX) return toast(_('کتابخانه اکسل هنوز بارگذاری نشده، دوباره امتحان کنید'));
  const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = rows[0].map(() => ({wch:18}));
  const wb = XLSX.utils.book_new(); wb.Workbook = {Views:[{RTL: I18N.rtl}]}; XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ---------------------------------------------------------------- more / settings */
function vMore(el) {
  const mgr = isMgr();
  el.innerHTML = `${mgr ? `<div class="qa"><button class="c5" data-act="capital"><span>🏦</span>${_('آورده / برداشت شریک')}</button><button class="c6" data-act="opening"><span>📌</span>${_('موجودی اول دوره')}</button><button class="c2" data-act="transfer"><span>🔁</span>${_('انتقال بین صندوق‌ها')}</button><button class="c1" id="mBoxAdd"><span>➕</span>${_('صندوق جدید')}</button></div>` : ''}
    <div class="card"><h3>💰 ${_('صندوق‌ها')}</h3><div class="list">${S.boxes.map(b => `<div class="row" data-box="${b.id}"><div class="ic">${b.kind === 'bank' ? '🏦' : b.kind === 'wallet' ? '👛' : '💵'}</div><div class="m"><b>${esc(b.name)}${b.archived ? (' ' + _('(بایگانی)')) : ''}</b><span>${cn(b.currency) || b.currency}</span></div><div class="e">${money(balOf('box', 'box_id', b.id)[b.currency] || 0, b.currency)}</div></div>`).join('')}</div></div>
    <div class="card"><h3>👔 ${_('اعضای صرافی')}</h3><div class="list">${S.members.map(m => `<div class="row" data-mem="${m.user_id}"><div class="ic">${m.role === 'owner' ? '👑' : m.role === 'partner' ? '🤝' : '🧑‍💼'}</div><div class="m"><b>${esc(m.display_name || m.email)}</b><span>${ROLE[m.role]}${m.role !== 'staff' ? (' · ' + _('سهم سود') + ' ') + fmt(m.share_pct, 2) + PC() : ''} · ${esc(m.email || '')}</span></div></div>`).join('')}</div>
      ${mgr ? ('<div class="btns">' + '<button class="btn p" id="mInv">' + '+ ' + _('دعوت شریک یا کارمند') + '</button>' + '</div>' + '<div id="invList">' + '</div>') : ''}</div>
    <div class="card"><h3>🏪 ${_('صرافی')}</h3>
      ${S.role === 'owner' ? `<div class="fld"><label>${_('نام صرافی')}</label><input class="in" id="exN" value="${esc(S.ex.name)}"></div>
      <div class="fld"><label>${_('ارز گزارش سود')}</label><select class="in" id="exB">${ccyOpts(base(), ['USD','TRY','IRT','EUR'])}</select></div><button class="btn p w" id="exSave">${_('ذخیره')}</button>` : `<p>${esc(S.ex.name)}</p>`}
      <div class="btns"><button class="btn g" id="newEx">+ ${_('ساخت صرافی دیگر')}</button><button class="btn r" id="logout">${_('خروج از حساب')}</button></div>
      <p class="hint">${_('نسخه‌ی آزمایشی. داده‌ها در پایگاه داده‌ی ابری ذخیره می‌شود و هر صرافی فقط به اطلاعات خودش دسترسی دارد.')}</p></div>`;
  bindQA(el);
  if ($('mBoxAdd')) $('mBoxAdd').onclick = () => formBox(null);
  el.querySelectorAll('[data-box]').forEach(r => r.onclick = () => mgr && formBox(box(r.dataset.box)));
  el.querySelectorAll('[data-mem]').forEach(r => r.onclick = () => S.role === 'owner' && formMember(S.members.find(m => m.user_id === r.dataset.mem)));
  if ($('mInv')) { $('mInv').onclick = formInvite; loadInvites(); }
  if ($('exSave')) $('exSave').onclick = async () => { const {error} = await sb.from('exchanges').update({name:$('exN').value.trim(), base_ccy:$('exB').value}).eq('id', S.ex.id); if (error) return err(error); S.ex.name = $('exN').value.trim(); S.ex.base_ccy = $('exB').value; toast(_('ذخیره شد')); render(); };
  $('newEx').onclick = renderCreateExchange;
  $('logout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
}
async function loadInvites() {
  const {data} = await sb.from('invites').select('*').eq('exchange_id', S.ex.id);
  if (data?.length) $('invList').innerHTML = `<h4>${_('دعوت‌های در انتظار ثبت‌نام')}</h4><div class="list">${data.map(i => `<div class="row"><div class="ic">✉️</div><div class="m"><b>${esc(i.display_name || i.email)}</b><span>${esc(i.email)} · ${ROLE[i.role]}</span></div><button class="ibtn" data-delinv="${i.id}">${_('لغو')}</button></div>`).join('')}</div>`;
  document.querySelectorAll('[data-delinv]').forEach(b => b.onclick = async e => { e.stopPropagation(); await sb.from('invites').delete().eq('id', b.dataset.delinv); loadInvites(); });
}

/* ---------------------------------------------------------------- sheet helpers */
function openSheet(html, after) { $('sheetBody').innerHTML = html; $('sheetBg').classList.add('show'); $('sheet').classList.add('show'); after && after(); }
function closeSheet() { $('sheetBg').classList.remove('show'); $('sheet').classList.remove('show'); }
$('sheetBg').onclick = closeSheet;
function custSelect(id, sel, opts = {}) {
  const list = S.customers.filter(c => !c.archived && (opts.walkin !== false || !c.is_walkin));
  return `<div class="pair"><select class="in" id="${id}">${opts.empty ? ('<option value="">' + '— ' + _('انتخاب کنید') + ' —' + '</option>') : ''}${list.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}${c.phone ? ' · ' + esc(c.phone) : ''}</option>`).join('')}</select>
    <button class="btn g" type="button" data-newcust="${id}" style="min-width:auto">+ ${_('جدید')}</button></div>`;
}
function bindNewCust() {
  document.querySelectorAll('[data-newcust]').forEach(b => b.onclick = () => {
    const selId = b.dataset.newcust, holder = b.parentElement;
    if (holder.nextElementSibling?.classList.contains('nc')) return;
    holder.insertAdjacentHTML('afterend', `<div class="nc box2" style="margin-top:8px"><div class="pair"><input class="in" placeholder="${_('نام مشتری جدید')}" data-ncn><input class="in" placeholder="${_('تلفن')}" dir="ltr" data-ncp style="width:140px;flex:none"></div>
      <div class="btns" style="margin-top:6px"><button class="btn p" type="button" data-ncs>${_('افزودن')}</button></div></div>`);
    const box = holder.nextElementSibling;
    box.querySelector('[data-ncn]').focus();
    box.querySelector('[data-ncs]').onclick = async () => {
      const n = box.querySelector('[data-ncn]').value.trim(), ph = box.querySelector('[data-ncp]').value.trim() || null;
      if (!n) return toast(_('نام را وارد کنید'));
      const {data, error} = await sb.from('customers').insert({exchange_id:S.ex.id, name:n, phone:ph}).select().single();
      if (error) return err(error);
      S.customers.push(data); const s = $(selId); s.insertAdjacentHTML('beforeend', `<option value="${data.id}">${esc(data.name)}</option>`); s.value = data.id; s.dispatchEvent(new Event('change'));
      box.remove(); toast(_('مشتری اضافه شد'));
    };
  });
}
function boxSelect(id, ccy, sel, allowNone) {
  const list = S.boxes.filter(b => !b.archived && (!ccy || b.currency === ccy));
  return `<select class="in" id="${id}">${list.map(b => `<option value="${b.id}" ${b.id === sel ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}${allowNone ? `<option value="" ${!list.length ? 'selected' : ''}>${allowNone}</option>` : ''}</select>`;
}
const dateFld = () => `<div class="fld"><label>${_('تاریخ و ساعت')}</label><input class="in" id="fDate" type="datetime-local" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}"></div>`;
const noteFld = () => `<div class="fld"><label>${_('توضیحات')}</label><input class="in" id="fNote" placeholder="${_('اختیاری')}"></div>`;
const dateVal = () => { const v = $('fDate')?.value; return v ? new Date(v).toISOString() : new Date().toISOString(); };
let posting = false;
async function post(p, msg) {
  if (posting) return; posting = true;
  document.querySelectorAll('#sheetBody .btn.p').forEach(b => b.disabled = true);
  const {data: tid, error} = await sb.rpc('post_txn', {p:{exchange_id:S.ex.id, occurred_at:dateVal(), note:$('fNote')?.value.trim() || null, ...p}});
  posting = false;
  if (error) { document.querySelectorAll('#sheetBody .btn.p').forEach(b => b.disabled = false); return err(error); }
  closeSheet(); toast(msg || (_('ثبت شد') + ' ✅')); await refresh();
  const c = p.customer_id && cust(p.customer_id);
  if (c && ['trade','deposit','withdraw','trust_out','trust_in','trust_return_in','trust_return_out'].includes(p.type) && (!c.is_walkin || p.type === 'trade')) {
    const {data: x} = await sb.from('txns').select('*, lines(*)').eq('id', tid).single();
    if (x) receiptSheet(x);
  }
}
function amtHint(inp, hint, c) { const f = () => { const v = num($(inp).value); $(hint).textContent = isFinite(v) ? `${fmt(v)} ${cn($(c)?.value || c) || ''} ${words(v) ? '· ' + words(v) : ''}` : ''; }; $(inp).addEventListener('input', f); f(); }

/* ---------------------------------------------------------------- forms */
function defaultRate(give, get) {          // customer gives `give`, gets `get`
  const [st, wk] = strongWeak(give, get);
  const weBuyStrong = give === st;
  const r = S.board.find(x => x.ccy === st && x.quote === wk);
  const b = r && (weBuyStrong ? r.buy : r.sell);
  if (b) return {rate:Number(b), src:_('تابلوی نرخ')};
  const last = S.recentTrades.find(t => t.meta?.give?.ccy === give && t.meta?.get?.ccy === get);
  if (last?.meta?.rate) return {rate:last.meta.rate, src:_('آخرین معامله')};
  const m = mktRate(st, wk); return {rate: m ? +m.toPrecision(6) : null, src:_('بازار')};
}
function avgCost(strong, weak) {             // weighted avg rate at which we BOUGHT strong with weak
  let s = 0, w = 0;
  for (const t of S.recentTrades) { const m = t.meta; if (m?.give?.ccy === strong && m?.get?.ccy === weak) { s += m.give.amt; w += m.get.amt; } }
  return s ? w / s : null;
}
function formTrade(pre = {}) {
  const g0 = pre.give || 'USD', r0 = pre.get || 'TRY';
  openSheet(`<h2>💱 ${_('معامله‌ی جدید')}</h2>
    <div class="fld"><label>${_('مشتری')}</label>${custSelect('tC', pre.customer_id || S.customers.find(c => c.is_walkin)?.id)}</div>
    <div class="box2 give"><h4>⬅️ ${_('مشتری می‌دهد (ما می‌گیریم)')}</h4>
      <div class="pair"><input class="in num" id="tA" inputmode="decimal" placeholder="${_('مبلغ')}"><select class="in" id="tAC">${ccyOpts(g0)}</select></div><div class="hint" id="tAH"></div>
      <div class="fld" style="margin-top:8px"><label>${_('کجا دریافت شد؟')}</label><div id="tABox"></div></div></div>
    <div class="fld"><label id="tRL">${_('نرخ')}</label><input class="in num" id="tR" inputmode="decimal"><div class="hint" id="tRH"></div></div>
    <div class="box2 get"><h4>➡️ ${_('مشتری می‌گیرد (ما می‌دهیم)')}</h4>
      <div class="pair"><input class="in num" id="tB" inputmode="decimal" placeholder="${_('مبلغ')}"><select class="in" id="tBC">${ccyOpts(r0)}</select></div><div class="hint" id="tBH"></div>
      <div class="fld" style="margin-top:8px"><label>${_('از کجا پرداخت شد؟')}</label><div id="tBBox"></div></div></div>
    <div class="preview" id="tPrev"></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="tGo">${_('ثبت معامله')}</button><button class="btn g" id="tX">${_('انصراف')}</button></div>`, () => {
    let lock = 'B';                          // which side is derived
    const setBoxes = () => {
      $('tABox').innerHTML = boxSelect('tABx', $('tAC').value, null, ('— ' + _('دریافت نشد: از موجودی مشتری کم شود / بدهکار شود') + ' —'));
      $('tBBox').innerHTML = boxSelect('tBBx', $('tBC').value, null, ('— ' + _('پرداخت نشد: به حساب مشتری بستانکار شود') + ' —'));
      if (!S.boxes.some(b => b.currency === $('tAC').value)) $('tABx').value = '';
      if (!S.boxes.some(b => b.currency === $('tBC').value)) $('tBBx').value = '';
    };
    const orient = () => { const [st, wk] = strongWeak($('tAC').value, $('tBC').value); return {st, wk}; };
    const setRate = () => {
      const {st, wk} = orient(); const d = defaultRate($('tAC').value, $('tBC').value);
      $('tRL').textContent = _('نرخ: هر ۱ {a} = چند {b}', {a: cn(st), b: cn(wk)});
      $('tR').value = d.rate ?? '';
      const ac = avgCost(st, wk), m = mktRate(st, wk);
      $('tRH').innerHTML = `${_('پیش‌فرض از {s}', {s: d.src})} · ${_('بازار:')} ${fmt(m)}${ac ? ' · ' + _('میانگین خرید شما:') + ' ' + fmt(ac) : ''}`;
    };
    const calc = () => {
      const {st} = orient(); const A = num($('tA').value), B = num($('tB').value), R = num($('tR').value);
      const giveStrong = $('tAC').value === st;
      if (lock === 'B' && isFinite(A) && isFinite(R) && R > 0) $('tB').value = +((giveStrong ? A * R : A / R).toFixed($('tBC').value === 'IRT' ? 0 : 4));
      if (lock === 'R' && isFinite(A) && isFinite(B) && A > 0 && B > 0) $('tR').value = +(giveStrong ? B / A : A / B).toPrecision(8);
      preview();
    };
    const preview = () => {
      const A = num($('tA').value), B = num($('tB').value), gc = $('tAC').value, rc = $('tBC').value;
      $('tAH').textContent = isFinite(A) && words(A) ? words(A) + ' ' + cn(gc) : '';
      $('tBH').textContent = isFinite(B) && words(B) ? words(B) + ' ' + cn(rc) : '';
      if (!(A > 0 && B > 0)) { $('tPrev').innerHTML = _('مبلغ و نرخ را وارد کنید.'); return; }
      const p = (inBase(A, gc) ?? 0) - (inBase(B, rc) ?? 0);
      $('tPrev').innerHTML = _('مشتری {a} می‌دهد و {b} می‌گیرد.', {a: `<b>${money(A, gc)}</b>`, b: `<b>${money(B, rc)}</b>`}) +
        (!$('tABx').value ? '<br>⚠️ ' + _('{a} هنوز دریافت نشده: مشتری بدهکار می‌شود.', {a: money(A, gc)}) : '') +
        (!$('tBBx').value ? '<br>⚠️ ' + _('{a} هنوز پرداخت نشده: مشتری طلبکار می‌شود.', {a: money(B, rc)}) : '') +
        (isMgr() ? `<br>${_('سود نسبت به نرخ بازار:')} <b class="${p >= 0 ? 'up' : 'down'}">${money(p, base(), 2)}</b>` : '');
    };
    setBoxes(); setRate(); bindNewCust();
    $('tA').oninput = () => { lock = 'B'; calc(); };
    $('tR').oninput = () => { lock = 'B'; calc(); };
    $('tB').oninput = () => { lock = 'R'; calc(); };
    $('tAC').onchange = $('tBC').onchange = () => { if ($('tAC').value === $('tBC').value) return toast(_('دو ارز باید متفاوت باشند')); setBoxes(); setRate(); lock = 'B'; calc(); };
    $('tABox').onchange = $('tBBox').onchange = preview;
    $('tX').onclick = closeSheet;
    $('tGo').onclick = () => {
      const C = $('tC').value, A = num($('tA').value), B = num($('tB').value), gc = $('tAC').value, rc = $('tBC').value, ab = $('tABx').value, bb = $('tBBx').value;
      if (!C || !(A > 0) || !(B > 0) || gc === rc) return toast(_('مشتری، مبلغ‌ها و دو ارز متفاوت را کامل کنید'));
      if (cust(C)?.is_walkin && (!ab || !bb)) return toast(_('برای مشتری گذری، دریافت و پرداخت باید نقدی باشد. برای نسیه، مشتری را با نام ثبت کنید.'));
      const ug = usdOf(gc), ur = usdOf(rc);
      // customer account: + = customer owes us, - = we owe the customer
      const lines = [
        {party:'customer', customer_id:C, currency:gc, amount:A, usd_rate:ug},    // he must deliver A
        {party:'customer', customer_id:C, currency:rc, amount:-B, usd_rate:ur},   // we must deliver B
      ];
      if (ab) lines.push({party:'box', box_id:ab, currency:gc, amount:A, usd_rate:ug}, {party:'customer', customer_id:C, currency:gc, amount:-A, usd_rate:ug});
      if (bb) lines.push({party:'box', box_id:bb, currency:rc, amount:-B, usd_rate:ur}, {party:'customer', customer_id:C, currency:rc, amount:B, usd_rate:ur});
      const {st, wk} = orient();
      const profit = (inBase(A, gc) ?? 0) - (inBase(B, rc) ?? 0);
      post({type:'trade', customer_id:C, lines, meta:{give:{ccy:gc, amt:A}, get:{ccy:rc, amt:B}, rate:num($('tR').value), pair:`${st}/${wk}`,
        market:{[gc]:ug, [rc]:ur}, profit_base: ug && ur ? +profit.toFixed(4) : null, base:base()}}, (_('معامله ثبت شد') + ' ✅'));
    };
  });
}
function formMoney(pre = {}) {
  openSheet(`<h2>⬇️⬆️ ${_('واریز / پرداخت مشتری')}</h2>
    <div class="seg" id="mK" style="margin-bottom:10px"><button class="on" data-k="deposit">⬇️ ${_('مشتری واریز کرد')}</button><button data-k="withdraw">⬆️ ${_('به مشتری پرداخت شد')}</button></div>
    <div class="fld"><label>${_('مشتری')}</label>${custSelect('mC', pre.customer_id, {walkin:false, empty:true})}</div>
    <div class="fld"><label>${_('مبلغ')}</label><div class="pair"><input class="in num" id="mA" inputmode="decimal"><select class="in" id="mCC">${ccyOpts('IRT')}</select></div><div class="hint" id="mAH"></div></div>
    <div class="fld"><label>${_('صندوق / حساب')}</label><div id="mBox"></div></div>
    ${noteFld()}${dateFld()}<p class="hint" id="mExp"></p>
    <div class="btns"><button class="btn p" id="mGo">${_('ثبت')}</button><button class="btn g" id="mX">${_('انصراف')}</button></div>`, () => {
    let k = 'deposit';
    const sync = () => { $('mBox').innerHTML = boxSelect('mBx', $('mCC').value); $('mExp').textContent = k === 'deposit' ? _('مثال: «مهدی رئیسی ۱۰۰ میلیون تومان به حساب ایران واریز کرد» → مشتری به همین مبلغ طلبکار می‌شود.') : _('پرداخت به مشتری: اگر طلبکار بوده، طلبش کم می‌شود؛ وگرنه بدهکار می‌شود.'); };
    $('mK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = b.dataset.k; $('mK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); sync(); };
    $('mCC').onchange = sync; sync(); amtHint('mA', 'mAH', 'mCC'); bindNewCust();
    $('mX').onclick = closeSheet;
    $('mGo').onclick = () => {
      const C = $('mC').value, A = num($('mA').value), c = $('mCC').value, bx = $('mBx').value;
      if (!C || !(A > 0) || !bx) return toast(_('مشتری، مبلغ و صندوق را کامل کنید'));
      const s = k === 'deposit' ? 1 : -1, u = usdOf(c);
      post({type:k, customer_id:C, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'customer', customer_id:C, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formTrust(pre = {}) {
  const K = [['trust_out',('🤝 ' + _('امانت دادیم')), -1], ['trust_return_in',('↩️ ' + _('امانت‌مان برگشت')), 1], ['trust_in',('📥 ' + _('امانت گرفتیم')), 1], ['trust_return_out',('↪️ ' + _('امانت را پس دادیم')), -1]];
  openSheet(`<h2>🤝 ${_('امانت')}</h2>
    <div class="seg" id="uK" style="margin-bottom:10px">${K.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="fld"><label>${_('شخص (امانت‌گیرنده / امانت‌دهنده)')}</label>${custSelect('uC', pre.customer_id, {walkin:false, empty:true})}</div>
    <div class="fld"><label>${_('مبلغ')}</label><div class="pair"><input class="in num" id="uA" inputmode="decimal"><select class="in" id="uCC">${ccyOpts('USD')}</select></div><div class="hint" id="uAH"></div></div>
    <div class="fld"><label>${_('صندوق')}</label><div id="uBox"></div></div>
    <div class="preview" id="uBal"></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="uGo">${_('ثبت')}</button><button class="btn g" id="uX">${_('انصراف')}</button></div>`, () => {
    let k = K[0];
    const sync = () => {
      $('uBox').innerHTML = boxSelect('uBx', $('uCC').value);
      const C = $('uC').value; const t = C ? balOf('trust', 'customer_id', C) : {};
      const e = Object.entries(t).filter(([, v]) => Math.abs(v) > 1e-9);
      $('uBal').innerHTML = C ? (e.length ? (_('امانت فعلی:') + ' ') + e.map(([c, v]) => `${money(Math.abs(v), c)} ${v > 0 ? _('(ما نزد او)') : _('(او نزد ما)')}`).join(I18N.rtl ? '، ' : ', ') : _('این شخص امانت باز ندارد.')) : _('شخص را انتخاب کنید.');
    };
    $('uK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = K.find(x => x[0] === b.dataset.k); $('uK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
    $('uCC').onchange = sync; $('uC').onchange = sync; sync(); amtHint('uA', 'uAH', 'uCC'); bindNewCust();
    $('uX').onclick = closeSheet;
    $('uGo').onclick = () => {
      const C = $('uC').value, A = num($('uA').value), c = $('uCC').value, bx = $('uBx').value;
      if (!C || !(A > 0) || !bx) return toast(_('شخص، مبلغ و صندوق را کامل کنید'));
      const s = k[2], u = usdOf(c);
      post({type:k[0], customer_id:C, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'trust', customer_id:C, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formExpense() {
  openSheet(`<h2>🧾 ${_('ثبت هزینه')}</h2>
    <div class="fld"><label>${_('نوع هزینه')}</label><select class="in" id="eCat">${EXP_CATS.map(c => `<option value="${c}">${_(c)}</option>`).join('')}</select></div>
    <div class="fld"><label>${_('مبلغ')}</label><div class="pair"><input class="in num" id="eA" inputmode="decimal"><select class="in" id="eCC">${ccyOpts('TRY')}</select></div><div class="hint" id="eAH"></div></div>
    <div class="fld"><label>${_('از صندوق')}</label><div id="eBox"></div></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="eGo">${_('ثبت هزینه')}</button><button class="btn g" id="eX">${_('انصراف')}</button></div>`, () => {
    const sync = () => $('eBox').innerHTML = boxSelect('eBx', $('eCC').value);
    $('eCC').onchange = sync; sync(); amtHint('eA', 'eAH', 'eCC'); $('eX').onclick = closeSheet;
    $('eGo').onclick = () => {
      const A = num($('eA').value), c = $('eCC').value, bx = $('eBx').value; if (!(A > 0) || !bx) return toast(_('مبلغ و صندوق را کامل کنید'));
      const u = usdOf(c);
      post({type:'expense', category:$('eCat').value, lines:[{party:'box', box_id:bx, currency:c, amount:-A, usd_rate:u}, {party:'expense', currency:c, amount:A, usd_rate:u}]}, _('هزینه ثبت شد'));
    };
  });
}
function formTransfer() {
  openSheet(`<h2>🔁 ${_('انتقال / تبدیل بین صندوق‌ها')}</h2>
    <div class="box2 give"><h4>${_('از صندوق')}</h4>${boxSelect('xF')}<input class="in num" id="xFA" inputmode="decimal" placeholder="${_('مبلغ خارج‌شده')}" style="margin-top:8px"></div>
    <div class="box2 get"><h4>${_('به صندوق')}</h4>${boxSelect('xT')}<input class="in num" id="xTA" inputmode="decimal" placeholder="${_('مبلغ واردشده')}" style="margin-top:8px"><p class="hint">${_('اگر دو صندوق یک ارزند، همان مبلغ. اگر ارز متفاوت است (مثلاً فروش تتر و دریافت لیر)، مبلغ واقعی دریافتی را بنویسید.')}</p></div>
    ${noteFld()}${dateFld()}<div class="btns"><button class="btn p" id="xGo">${_('ثبت')}</button><button class="btn g" id="xX">${_('انصراف')}</button></div>`, () => {
    $('xFA').oninput = () => { if (box($('xF').value)?.currency === box($('xT').value)?.currency) $('xTA').value = $('xFA').value; };
    $('xX').onclick = closeSheet;
    $('xGo').onclick = () => {
      const f = box($('xF').value), t = box($('xT').value), a = num($('xFA').value), b = num($('xTA').value);
      if (!f || !t || f.id === t.id || !(a > 0) || !(b > 0)) return toast(_('دو صندوق متفاوت و مبلغ‌ها را کامل کنید'));
      const uf = usdOf(f.currency), ut = usdOf(t.currency);
      const profit = f.currency === t.currency ? 0 : (inBase(b, t.currency) ?? 0) - (inBase(a, f.currency) ?? 0);
      post({type:'transfer', lines:[{party:'box', box_id:f.id, currency:f.currency, amount:-a, usd_rate:uf}, {party:'box', box_id:t.id, currency:t.currency, amount:b, usd_rate:ut}],
        meta:{profit_base: f.currency === t.currency ? null : +profit.toFixed(4)}});
    };
  });
}
function formCapital() {
  const ps = S.members.filter(m => m.role !== 'staff');
  openSheet(`<h2>🏦 ${_('آورده / برداشت شریک')}</h2>
    <div class="seg" id="kK" style="margin-bottom:10px"><button class="on" data-k="capital_in">${_('آورده (پول گذاشت)')}</button><button data-k="capital_out">${_('برداشت (پول برد)')}</button></div>
    <div class="fld"><label>${_('شریک')}</label><select class="in" id="kM">${ps.map(m => `<option value="${m.user_id}">${esc(m.display_name || m.email)}</option>`).join('')}</select></div>
    <div class="fld"><label>${_('مبلغ')}</label><div class="pair"><input class="in num" id="kA" inputmode="decimal"><select class="in" id="kCC">${ccyOpts('USD')}</select></div><div class="hint" id="kAH"></div></div>
    <div class="fld"><label>${_('صندوق')}</label><div id="kBox"></div></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="kGo">${_('ثبت')}</button><button class="btn g" id="kX">${_('انصراف')}</button></div>`, () => {
    let k = 'capital_in';
    $('kK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = b.dataset.k; $('kK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
    const sync = () => $('kBox').innerHTML = boxSelect('kBx', $('kCC').value); $('kCC').onchange = sync; sync(); amtHint('kA', 'kAH', 'kCC'); $('kX').onclick = closeSheet;
    $('kGo').onclick = () => {
      const A = num($('kA').value), c = $('kCC').value, bx = $('kBx').value, M = $('kM').value; if (!(A > 0) || !bx || !M) return toast(_('همه‌ی موارد را کامل کنید'));
      const s = k === 'capital_in' ? 1 : -1, u = usdOf(c);
      post({type:k, member_id:M, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'equity', member_id:M, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formOpening() {
  const act = S.boxes.filter(b => !b.archived);
  openSheet(`<h2>📌 ${_('موجودی اول دوره')}</h2><p class="muted small">${_('موجودی فعلی هر صندوق را یک بار وارد کنید (فقط صندوق‌هایی که موجودی دارند).')}</p>
    ${act.map(b => `<div class="fld"><label>${esc(b.name)} (${cn(b.currency)})</label><input class="in num" data-ob="${b.id}" inputmode="decimal" placeholder="0"></div>`).join('')}
    ${dateFld()}<div class="btns"><button class="btn p" id="oGo">${_('ثبت موجودی‌ها')}</button><button class="btn g" id="oX">${_('انصراف')}</button></div>`, () => {
    $('oX').onclick = closeSheet;
    $('oGo').onclick = () => {
      const lines = [];
      document.querySelectorAll('[data-ob]').forEach(i => { const v = num(i.value); if (v) { const b = box(i.dataset.ob), u = usdOf(b.currency);
        lines.push({party:'box', box_id:b.id, currency:b.currency, amount:v, usd_rate:u}, {party:'equity', member_id:S.user.id, currency:b.currency, amount:-v, usd_rate:u}); } });
      if (!lines.length) return toast(_('حداقل یک مبلغ وارد کنید'));
      post({type:'opening', lines, note:_('موجودی اول دوره')}, _('موجودی اول دوره ثبت شد'));
    };
  });
}
function formCustomer(c, done) {
  openSheet(`<h2>${c ? ('✏️ ' + _('ویرایش مشتری')) : ('👤 ' + _('مشتری جدید'))}</h2>
    <div class="fld"><label>${_('نام')}</label><input class="in" id="cuN" value="${esc(c?.name || '')}"></div>
    <div class="fld"><label>${_('شماره تماس')}</label><input class="in" id="cuP" dir="ltr" inputmode="tel" value="${esc(c?.phone || '')}" placeholder="+90…"></div>
    <div class="fld"><label>${_('توضیحات')}</label><input class="in" id="cuD" value="${esc(c?.notes || '')}" placeholder="${_('مثلاً آشنای آقای …')}"></div>
    <div class="btns"><button class="btn p" id="cuGo">${_('ذخیره')}</button>${c && !c.is_walkin ? ('<button class="btn r" id="cuArc">' + _('بایگانی') + '</button>') : ''}<button class="btn g" id="cuX">${_('انصراف')}</button></div>`, () => {
    $('cuX').onclick = closeSheet;
    $('cuGo').onclick = async () => {
      const row = {name:$('cuN').value.trim(), phone:$('cuP').value.trim() || null, notes:$('cuD').value.trim() || null};
      if (!row.name) return toast(_('نام را وارد کنید'));
      const r = c ? await sb.from('customers').update(row).eq('id', c.id).select().single() : await sb.from('customers').insert({...row, exchange_id:S.ex.id}).select().single();
      if (r.error) return err(r.error);
      if (c) Object.assign(c, r.data); else S.customers.push(r.data);
      closeSheet(); toast(_('ذخیره شد')); done && done();
    };
    if ($('cuArc')) $('cuArc').onclick = async () => { await sb.from('customers').update({archived:true}).eq('id', c.id); c.archived = true; closeSheet(); S.view = 'customers'; render(); };
  });
}
function formBox(b) {
  openSheet(`<h2>${b ? ('✏️ ' + _('ویرایش صندوق')) : ('➕ ' + _('صندوق جدید'))}</h2>
    <div class="fld"><label>${_('نام')}</label><input class="in" id="bN" value="${esc(b?.name || '')}" placeholder="${_('مثلاً حساب زراعت بانک')}"></div>
    <div class="fld"><label>${_('ارز')}</label><select class="in" id="bC" ${b ? 'disabled' : ''}>${ccyOpts(b?.currency || 'TRY')}</select></div>
    <div class="fld"><label>${_('نوع')}</label><select class="in" id="bK">${[['cash',_('نقد')],['bank',_('حساب بانکی')],['wallet',_('کیف پول')]].map(([k, l]) => `<option value="${k}" ${b?.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="btns"><button class="btn p" id="bGo">${_('ذخیره')}</button>${b ? `<button class="btn r" id="bArc">${b.archived ? _('فعال‌سازی') : _('بایگانی')}</button>` : ''}<button class="btn g" id="bX">${_('انصراف')}</button></div>`, () => {
    $('bX').onclick = closeSheet;
    $('bGo').onclick = async () => {
      const row = {name:$('bN').value.trim(), kind:$('bK').value}; if (!row.name) return toast(_('نام را وارد کنید'));
      const r = b ? await sb.from('boxes').update(row).eq('id', b.id) : await sb.from('boxes').insert({...row, currency:$('bC').value, exchange_id:S.ex.id, sort:S.boxes.length + 1});
      if (r.error) return err(r.error); closeSheet(); toast(_('ذخیره شد')); refresh();
    };
    if ($('bArc')) $('bArc').onclick = async () => { await sb.from('boxes').update({archived:!b.archived}).eq('id', b.id); closeSheet(); refresh(); };
  });
}
function formInvite() {
  openSheet(`<h2>✉️ ${_('دعوت شریک یا کارمند')}</h2>
    <div class="fld"><label>${_('نام')}</label><input class="in" id="iN"></div>
    <div class="fld"><label>${_('ایمیل')}</label><input class="in" id="iE" type="email" dir="ltr"></div>
    <div class="fld"><label>${_('نقش')}</label><select class="in" id="iR"><option value="staff">${_('کارمند (فقط ثبت، بدون دیدن سود)')}</option><option value="partner">${_('شریک (دسترسی کامل)')}</option></select></div>
    <div class="fld"><label>${_('سهم سود شریک (٪)')}</label><input class="in num" id="iS" inputmode="decimal" value="0"></div>
    <div class="btns"><button class="btn p" id="iGo">${_('ثبت دعوت')}</button><button class="btn g" id="iX">${_('انصراف')}</button></div>
    <p class="hint">${_('بعد از ثبت، لینک برنامه را برای او بفرستید تا با همین ایمیل ثبت‌نام کند؛ خودکار به صرافی شما وصل می‌شود.')}</p>`, () => {
    $('iX').onclick = closeSheet;
    $('iGo').onclick = async () => {
      const email = $('iE').value.trim().toLowerCase(); if (!email.includes('@')) return toast(_('ایمیل معتبر وارد کنید'));
      const {error} = await sb.from('invites').insert({exchange_id:S.ex.id, email, role:$('iR').value, display_name:$('iN').value.trim() || null, share_pct:num($('iS').value) || 0});
      if (error) return err(error);
      closeSheet(); toast((_('دعوت ثبت شد. لینک:') + ' ') + location.href.split('#')[0]);
      navigator.clipboard?.writeText(location.href.split('#')[0]).catch(() => {}); render();
    };
  });
}
function formMember(m) {
  if (!m || m.role === 'owner') return;
  openSheet(`<h2>👔 ${esc(m.display_name || m.email)}</h2>
    <div class="fld"><label>${_('نقش')}</label><select class="in" id="fmR"><option value="staff" ${m.role === 'staff' ? 'selected' : ''}>${_('کارمند')}</option><option value="partner" ${m.role === 'partner' ? 'selected' : ''}>${_('شریک')}</option></select></div>
    <div class="fld"><label>${_('سهم سود (٪)')}</label><input class="in num" id="fmS" value="${m.share_pct || 0}" inputmode="decimal"></div>
    <div class="btns"><button class="btn p" id="fmGo">${_('ذخیره')}</button><button class="btn r" id="fmDel">${_('حذف از صرافی')}</button><button class="btn g" id="fmX">${_('انصراف')}</button></div>`, () => {
    $('fmX').onclick = closeSheet;
    $('fmGo').onclick = async () => { const {error} = await sb.from('members').update({role:$('fmR').value, share_pct:num($('fmS').value) || 0}).eq('exchange_id', S.ex.id).eq('user_id', m.user_id); if (error) return err(error); closeSheet(); refresh(); };
    $('fmDel').onclick = async () => { const {error} = await sb.from('members').delete().eq('exchange_id', S.ex.id).eq('user_id', m.user_id); if (error) return err(error); closeSheet(); refresh(); };
  });
}

// language switch: redraw whatever screen is open, in the new language
addEventListener('langchange', () => { closeSheet(); if (S.screen) S.screen(); });
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { S.user = null; renderAuth(); } });
boot().catch(err);
