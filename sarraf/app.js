'use strict';
/* صرافینو — multi-exchange accounting for small currency exchanges */

const sb = supabase.createClient(window.SARRAF_CONFIG.url, window.SARRAF_CONFIG.key);
const MARKET_URL = 'https://raw.githubusercontent.com/mehdi2044/arzino/data/latest.json';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const CCY = {
  USD:{fa:'دلار', s:'$'}, TRY:{fa:'لیر', s:'₺'}, IRT:{fa:'تومان', s:'ت'}, EUR:{fa:'یورو', s:'€'},
  USDT:{fa:'تتر', s:'₮'}, GBP:{fa:'پوند', s:'£'}, AED:{fa:'درهم', s:'AED'}, CAD:{fa:'دلار کانادا', s:'C$'},
  CHF:{fa:'فرانک', s:'CHF'}, CNY:{fa:'یوان', s:'¥'}, IQD:{fa:'دینار عراق', s:'IQD'},
};
const CCYS = Object.keys(CCY);
const ROLE = {owner:'مالک', partner:'شریک', staff:'کارمند'};
const TYPE = {
  trade:['💱','معامله'], deposit:['⬇️','واریز مشتری'], withdraw:['⬆️','پرداخت به مشتری'],
  trust_out:['🤝','امانت دادیم'], trust_return_in:['↩️','امانت برگشت'], trust_in:['📥','امانت گرفتیم'], trust_return_out:['↪️','امانت پس دادیم'],
  expense:['🧾','هزینه'], capital_in:['🏦','آورده شریک'], capital_out:['💼','برداشت شریک'],
  transfer:['🔁','انتقال بین صندوق‌ها'], opening:['📌','موجودی اول دوره'], adjust:['⚖️','اصلاحیه'],
};
const EXP_CATS = ['هزینه ارسال','هزینه دریافت','بسته‌بندی','کارمزد بانک','اجاره','حقوق','پذیرایی','متفرقه'];
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
function money(v, c, d) { return `${fmt(v, d ?? (c === 'IRT' ? 0 : undefined))} ${CCY[c]?.s || c}`; }
function num(s) {
  s = String(s ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  const v = parseFloat(s); return isFinite(v) ? v : NaN;
}
function words(v) {
  if (!isFinite(v) || Math.abs(v) < 1000) return '';
  for (const [n, w] of [[1e9,'میلیارد'],[1e6,'میلیون'],[1e3,'هزار']]) if (Math.abs(v) >= n) return fmt(v / n, 2) + ' ' + w;
  return '';
}
const jd = (t, o) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', o || {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date(t));
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 2600); }
const isMgr = () => S.role === 'owner' || S.role === 'partner';
const ccyOpts = (sel, list = CCYS) => list.map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${CCY[c].fa} (${c})</option>`).join('');
function err(e) { console.error(e); toast('خطا: ' + (e?.message || e)); }

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
  if (!e.length) return '<span class="chip">تسویه</span>';
  return e.map(([c, v]) => `<span class="chip ${(invert ? -v : v) > 0 ? 'pos' : 'neg'}">${money(Math.abs(v), c)} ${(invert ? -v : v) > 0 ? 'بدهکار' : 'طلبکار'}</span>`).join('');
}

/* ---------------------------------------------------------------- auth */
async function boot() {
  const {data: {session}} = await sb.auth.getSession();
  S.user = session?.user || null;
  if (!S.user) return renderAuth();
  await sb.rpc('accept_invites', {p_display_name: S.user.user_metadata?.name || null});
  const {data, error} = await sb.from('members').select('role, display_name, exchange_id, exchanges(id,name,base_ccy)').eq('user_id', S.user.id);
  if (error) return err(error);
  S.mems = data;
  if (!data.length) return renderCreateExchange();
  const last = localStorage.getItem('sarraf.ex');
  const m = data.find(x => x.exchange_id === last) || data[0];
  await openExchange(m);
}
async function openExchange(m) {
  S.ex = m.exchanges; S.role = m.role; localStorage.setItem('sarraf.ex', S.ex.id);
  $('app').innerHTML = '<div class="boot">در حال بارگذاری حساب‌ها…</div>';
  try { await Promise.all([loadExchangeData(), loadMarket()]); } catch (e) { return err(e); }
  render();
}
function renderAuth(mode = 'login') {
  $('app').innerHTML = `<div class="auth">
    <div class="brand" style="justify-content:center;flex-direction:column"><div class="lg">ص</div><h1>صرافینو</h1><small>حسابداری ساده برای صرافی‌ها</small></div>
    <div class="card" style="margin-top:18px">
      <div class="seg" style="margin-bottom:12px"><button class="${mode === 'login' ? 'on' : ''}" data-m="login">ورود</button><button class="${mode === 'signup' ? 'on' : ''}" data-m="signup">ثبت‌نام</button></div>
      ${mode === 'signup' ? '<div class="fld"><label>نام شما</label><input class="in" id="aName" autocomplete="name"></div>' : ''}
      <div class="fld"><label>ایمیل</label><input class="in" id="aEmail" type="email" autocomplete="email" dir="ltr"></div>
      <div class="fld"><label>رمز عبور ${mode === 'signup' ? '(حداقل ۶ کاراکتر)' : ''}</label><input class="in" id="aPass" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" dir="ltr"></div>
      <button class="btn p w" id="aGo">${mode === 'login' ? 'ورود' : 'ساخت حساب'}</button>
      <p class="hint">${mode === 'signup' ? 'اگر صاحب صرافی شما را دعوت کرده، با همان ایمیلی که داده ثبت‌نام کنید تا خودکار به صرافی وصل شوید.' : ''}</p>
    </div></div>`;
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => renderAuth(b.dataset.m));
  $('aGo').onclick = async () => {
    const email = $('aEmail').value.trim(), password = $('aPass').value;
    if (!email || password.length < 6) return toast('ایمیل و رمز (حداقل ۶ کاراکتر) را وارد کنید');
    $('aGo').disabled = true;
    const r = mode === 'login' ? await sb.auth.signInWithPassword({email, password})
      : await sb.auth.signUp({email, password, options:{data:{name: $('aName').value.trim()}, emailRedirectTo: location.origin + location.pathname}});
    $('aGo').disabled = false;
    if (r.error) return toast(r.error.message.includes('Invalid login') ? 'ایمیل یا رمز اشتباه است' : r.error.message);
    if (mode === 'signup' && !r.data.session) {
      $('app').innerHTML = `<div class="auth"><div class="card center"><h2>📧 ایمیل خود را چک کنید</h2><p>یک لینک تأیید به <b dir="ltr">${esc(email)}</b> فرستاده شد. روی لینک بزنید تا وارد صرافینو شوید.</p><p class="hint">اگر نیامد، پوشه‌ی Spam را هم ببینید.</p><button class="btn g w" onclick="location.reload()">بازگشت به ورود</button></div></div>`;
      return;
    }
    boot();
  };
}
function renderCreateExchange() {
  $('app').innerHTML = `<div class="auth"><div class="card">
    <h2 style="margin-top:0">🏪 ساخت صرافی جدید</h2>
    <p class="muted small">اگر قرار است عضو صرافی دیگری شوید، از مالک بخواهید ایمیل شما را دعوت کند و سپس دوباره وارد شوید.</p>
    <div class="fld"><label>نام صرافی</label><input class="in" id="exName" placeholder="مثلاً صرافی آریا"></div>
    <div class="fld"><label>نام شما</label><input class="in" id="exMe" value="${esc(S.user.user_metadata?.name || '')}"></div>
    <div class="fld"><label>ارز گزارش سود و زیان</label><select class="in" id="exBase">${ccyOpts('USD', ['USD','TRY','IRT','EUR'])}</select></div>
    <button class="btn p w" id="exGo">ساخت صرافی</button>
    <div class="btns"><button class="btn g" id="exOut">خروج از حساب</button><button class="btn g" id="exRe">بررسی دعوت‌ها</button></div>
  </div></div>`;
  $('exGo').onclick = async () => {
    const n = $('exName').value.trim(); if (!n) return toast('نام صرافی را وارد کنید');
    const {error} = await sb.rpc('create_exchange', {p_name:n, p_display_name:$('exMe').value.trim() || S.user.email, p_base:$('exBase').value});
    if (error) return err(error);
    toast('صرافی ساخته شد 🎉'); boot();
  };
  $('exOut').onclick = async () => { await sb.auth.signOut(); boot(); };
  $('exRe').onclick = boot;
}

/* ---------------------------------------------------------------- shell */
const VIEWS = [['home','🏠','داشبورد'],['txns','📒','دفتر'],['customers','👥','مشتری‌ها'],['reports','📊','گزارش‌ها'],['more','⚙️','بیشتر']];
function render() {
  const V = {home:vHome, txns:vTxns, customers:vCustomers, customer:vCustomer, reports:vReports, more:vMore}[S.view] || vHome;
  $('app').innerHTML = `<div class="wrap">
    <div class="top"><div class="brand"><div class="lg">ص</div><div><h1>${esc(S.ex.name)}</h1><small>${esc(memberName(S.user.id))} · ${ROLE[S.role]}</small></div></div>
      <div style="display:flex;gap:6px"><button class="ibtn" id="reload" title="بروزرسانی">↻</button>${S.mems.length > 1 ? '<button class="ibtn" id="swEx">🏪</button>' : ''}</div></div>
    <div id="view"></div></div>
    <nav class="tabs">${VIEWS.map(([k, i, l]) => `<button class="tab ${S.view === k || (S.view === 'customer' && k === 'customers') ? 'on' : ''}" data-v="${k}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => { S.view = t.dataset.v; render(); scrollTo(0, 0); });
  $('reload').onclick = async () => { toast('در حال بروزرسانی…'); await Promise.all([loadExchangeData(), loadMarket()]); render(); };
  if ($('swEx')) $('swEx').onclick = () => openSheet(`<h2>انتخاب صرافی</h2><div class="list">${S.mems.map(m => `<div class="row" data-ex="${m.exchange_id}"><div class="ic">🏪</div><div class="m"><b>${esc(m.exchanges.name)}</b><span>${ROLE[m.role]}</span></div></div>`).join('')}</div>`,
    () => document.querySelectorAll('[data-ex]').forEach(r => r.onclick = () => { closeSheet(); openExchange(S.mems.find(m => m.exchange_id === r.dataset.ex)); }));
  V($('view'));
}
async function refresh() { await loadExchangeData(); render(); }

/* ---------------------------------------------------------------- views */
function quickActions() {
  return `<div class="qa">
    <button class="c1" data-act="trade"><span>💱</span>معامله</button>
    <button class="c2" data-act="money"><span>⬇️⬆️</span>واریز / پرداخت</button>
    <button class="c3" data-act="trust"><span>🤝</span>امانت</button>
    <button class="c4" data-act="expense"><span>🧾</span>هزینه</button>
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
  el.innerHTML = quickActions() + `
    <div class="card"><h3>💰 موجودی صندوق‌ها <button class="ibtn small" data-act="transfer">🔁 انتقال</button></h3>
      <div class="grid g3">${bt.map(({b, v}) => `<div class="stat"><div class="l">${esc(b.name)}</div><div class="v ${v < 0 ? 'down' : ''}">${money(v, b.currency)}</div></div>`).join('') || '<p class="muted">صندوقی تعریف نشده</p>'}</div></div>
    <div class="grid g2">
      <div class="card"><h3>📅 امروز</h3><div class="grid g2">
        <div class="stat"><div class="l">تعداد معامله</div><div class="v">${fmt(todayCount, 0)}</div></div>
        ${isMgr() ? `<div class="stat"><div class="l">سود معاملات</div><div class="v ${todayProfit >= 0 ? 'up' : 'down'}">${money(todayProfit, base(), 2)}</div></div>` : ''}
      </div></div>
      <div class="card"><h3>👥 طلب و بدهی مشتری‌ها</h3>
        <table class="tbl"><tr><th>ارز</th><th>طلب ما از مشتری</th><th>بدهی ما به مشتری</th></tr>
        ${Object.entries(custBal).filter(([, v]) => v.rec > 1e-9 || v.pay > 1e-9).map(([c, v]) => `<tr><td>${CCY[c]?.fa || c}</td><td class="n down">${money(v.rec, c)}</td><td class="n up">${money(v.pay, c)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">همه تسویه</td></tr>'}</table></div>
    </div>
    ${boardCard()}`;
  bindQA(el);
  el.querySelectorAll('[data-board]').forEach(b => b.onclick = () => { S.view = 'more'; render(); setTimeout(() => $('boardCard')?.scrollIntoView({behavior:'smooth'}), 50); });
}
function boardCard() {
  const rows = BOARD_DEFAULT.map(([c, q]) => ({c, q, r: S.board.find(x => x.ccy === c && x.quote === q), m: mktRate(c, q)}));
  return `<div class="card"><h3>📋 نرخ‌های امروز صرافی <button class="ibtn small" data-board>ویرایش</button></h3>
    <div class="tbl-wrap"><table class="tbl"><tr><th>ارز</th><th>خرید</th><th>فروش</th><th>بازار</th></tr>
    ${rows.map(({c, q, r, m}) => `<tr><td>${CCY[c].fa} به ${CCY[q].fa}</td><td class="n">${r?.buy ? fmt(r.buy) : '—'}</td><td class="n">${r?.sell ? fmt(r.sell) : '—'}</td><td class="n muted">${fmt(m)}</td></tr>`).join('')}
    </table></div></div>`;
}

let txCache = [];
async function vTxns(el) {
  el.innerHTML = `<div class="card"><div class="pair"><input class="in" id="txQ" placeholder="جستجو در توضیحات یا نام مشتری" value="${esc(S.txFilter)}">
    <select class="in" id="txT"><option value="">همه</option>${Object.entries(TYPE).map(([k, [i, l]]) => `<option value="${k}">${i} ${l}</option>`).join('')}</select></div></div>
    ${quickActions()}<div class="list" id="txList"><div class="empty">در حال بارگذاری…</div></div>`;
  bindQA(el);
  const {data, error} = await sb.from('txns').select('*, lines(*)').eq('exchange_id', S.ex.id).order('occurred_at', {ascending:false}).limit(300);
  if (error) return err(error);
  txCache = data;
  const draw = () => {
    const q = $('txQ').value.trim(), t = $('txT').value; S.txFilter = q;
    const rows = txCache.filter(x => (!t || x.type === t) && (!q || (x.note || '').includes(q) || (cust(x.customer_id)?.name || '').includes(q)));
    $('txList').innerHTML = rows.map(txRow).join('') || '<div class="empty">موردی نیست</div>';
    $('txList').querySelectorAll('[data-tx]').forEach(r => r.onclick = () => txDetail(txCache.find(x => x.id === r.dataset.tx)));
  };
  $('txQ').oninput = draw; $('txT').onchange = draw; draw();
}
function txSummary(x) {
  const m = x.meta || {};
  if (x.type === 'trade') return `داد ${money(m.give?.amt, m.give?.ccy)} ← گرفت ${money(m.get?.amt, m.get?.ccy)} · نرخ ${fmt(m.rate)}`;
  const l = (x.lines || []).find(l => l.party === 'box') || (x.lines || [])[0];
  if (x.type === 'transfer') { const o = (x.lines || []).find(l => l.amount < 0), i = (x.lines || []).find(l => l.amount > 0); return `${money(-o?.amount, o?.currency)} از ${esc(box(o?.box_id)?.name)} ← ${money(i?.amount, i?.currency)} به ${esc(box(i?.box_id)?.name)}`; }
  return l ? money(Math.abs(l.amount), l.currency) + (l.box_id ? ' · ' + esc(box(l.box_id)?.name || '') : '') : '';
}
function txRow(x) {
  const [i, l] = TYPE[x.type] || ['•', x.type];
  const who = x.customer_id ? esc(cust(x.customer_id)?.name || '') : x.member_id ? esc(memberName(x.member_id)) : (x.category ? esc(x.category) : '');
  return `<div class="row ${x.voided ? 'void' : ''}" data-tx="${x.id}"><div class="ic">${i}</div>
    <div class="m"><b>${l}${who ? ' · ' + who : ''}</b><span>${txSummary(x)}</span><br><span>${jd(x.occurred_at)}${x.note ? ' · ' + esc(x.note) : ''}</span></div>
    ${isMgr() && x.meta?.profit_base != null && !x.voided ? `<div class="e ${x.meta.profit_base >= 0 ? 'up' : 'down'} small">${fmt(x.meta.profit_base, 2)} ${CCY[base()].s}</div>` : ''}</div>`;
}
function txDetail(x) {
  const [i, l] = TYPE[x.type] || ['•', x.type];
  const party = ln => ln.party === 'box' ? 'صندوق: ' + esc(box(ln.box_id)?.name || '') : ln.party === 'customer' ? 'حساب ' + esc(cust(ln.customer_id)?.name || '') :
    ln.party === 'trust' ? 'امانت ' + esc(cust(ln.customer_id)?.name || '') : ln.party === 'expense' ? 'هزینه' : 'سرمایه ' + esc(memberName(ln.member_id));
  openSheet(`<h2>${i} ${l} <span class="pill">#${x.no}</span></h2>
    ${x.voided ? `<p class="badge b-red">باطل شده${x.void_reason ? ': ' + esc(x.void_reason) : ''}</p>` : ''}
    <p class="muted small">${jd(x.occurred_at)} · ثبت توسط ${esc(memberName(x.created_by))}</p>
    <div class="preview">${txSummary(x)}${x.note ? '<br>📝 ' + esc(x.note) : ''}${isMgr() && x.meta?.profit_base != null ? `<br>سود نسبت به نرخ بازار: <b class="${x.meta.profit_base >= 0 ? 'up' : 'down'}">${money(x.meta.profit_base, base(), 2)}</b>` : ''}</div>
    <h4>ردیف‌های حسابداری</h4>
    <table class="tbl">${(x.lines || []).map(ln => `<tr><td>${party(ln)}</td><td class="n ${ln.amount >= 0 ? 'up' : 'down'}">${ln.amount >= 0 ? '+' : ''}${money(ln.amount, ln.currency)}</td></tr>`).join('')}</table>
    ${isMgr() && !x.voided ? '<div class="fld" style="margin-top:10px"><label>برای باطل کردن، دلیل را بنویسید</label><input class="in" id="shReason" placeholder="مثلاً اشتباه در مبلغ"></div>' : ''}
    <div class="btns"><button class="btn g" id="shReceipt">🧾 کپی رسید</button>${isMgr() && !x.voided ? '<button class="btn r" id="shVoid">باطل کردن</button>' : ''}<button class="btn g" id="shClose">بستن</button></div>`, () => {
    $('shClose').onclick = closeSheet;
    $('shReceipt').onclick = () => receipt(x);
    if ($('shVoid')) $('shVoid').onclick = async () => {
      const reason = $('shReason').value.trim(); if (!reason) return toast('دلیل ابطال را بنویسید');
      const {error} = await sb.rpc('void_txn', {p_id:x.id, p_reason:reason}); if (error) return err(error);
      closeSheet(); toast('تراکنش باطل شد'); await refresh();
    };
  });
}
function receipt(x) {
  const c = cust(x.customer_id);
  const t = [`🏪 ${S.ex.name}`, `${TYPE[x.type]?.[1] || ''} #${x.no}`, jd(x.occurred_at), c && !c.is_walkin ? `مشتری: ${c.name}` : '', txSummary(x).replace(/<[^>]+>/g, ''), x.note ? `توضیح: ${x.note}` : ''].filter(Boolean).join('\n');
  navigator.clipboard?.writeText(t).then(() => toast('متن رسید کپی شد — در واتس‌اپ یا تلگرام بچسبانید'), () => toast(t));
}

function vCustomers(el) {
  const all = {};
  for (const r of S.bal) if (r.party === 'customer' || r.party === 'trust') { const o = (all[r.customer_id] ||= {c:{}, t:{}}); const k = r.party === 'customer' ? 'c' : 't'; o[k][r.currency] = (o[k][r.currency] || 0) + Number(r.amount); }
  el.innerHTML = `<div class="card"><div class="pair"><input class="in" id="cQ" placeholder="جستجوی نام یا تلفن"><button class="btn p" id="cAdd">+ مشتری</button></div>
    <div class="seg" style="margin-top:8px" id="cF"><button class="on" data-f="">همه</button><button data-f="debt">بدهکارها</button><button data-f="cred">طلبکارها</button><button data-f="trust">امانت‌ها</button></div></div>
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
      <div class="chips">${chipsFor(o.c)}${tr.map(([cc, v]) => `<span class="chip" style="background:#ede9fe;color:#5b21b6">🤝 ${money(Math.abs(v), cc)} ${v > 0 ? 'امانت نزد او' : 'امانت او نزد ما'}</span>`).join('')}</div></div></div>`; }).join('') || '<div class="empty">مشتری‌ای نیست</div>';
    $('cList').querySelectorAll('[data-c]').forEach(r => r.onclick = () => { S.view = 'customer'; S.custId = r.dataset.c; render(); scrollTo(0, 0); });
  };
  $('cQ').oninput = draw; $('cF').onclick = e => { const b = e.target.closest('button'); if (!b) return; f = b.dataset.f; $('cF').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  $('cAdd').onclick = () => formCustomer(null, () => draw());
  draw();
}
async function vCustomer(el) {
  const c = cust(S.custId); if (!c) { S.view = 'customers'; return render(); }
  el.innerHTML = `<div class="card"><h3>${c.is_walkin ? '🚶' : '👤'} ${esc(c.name)} <span><button class="ibtn small" id="cEdit">✏️</button> <button class="ibtn small" id="cBack">بازگشت</button></span></h3>
    <p class="muted small">${esc(c.phone || 'بدون تلفن')}${c.notes ? ' · ' + esc(c.notes) : ''}</p>
    <h4 style="margin:6px 0">حساب جاری</h4><div class="chips">${chipsFor(balOf('customer', 'customer_id', c.id))}</div>
    <h4 style="margin:10px 0 6px">امانت</h4><div class="chips">${Object.entries(balOf('trust', 'customer_id', c.id)).filter(([, v]) => Math.abs(v) > 1e-9).map(([cc, v]) => `<span class="chip">${money(Math.abs(v), cc)} ${v > 0 ? 'امانت ما نزد او' : 'امانت او نزد ما'}</span>`).join('') || '<span class="chip">ندارد</span>'}</div>
    <div class="btns">${c.phone ? `<a class="btn g" href="https://wa.me/${esc(c.phone.replace(/[^\d]/g, ''))}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">💬 واتس‌اپ</a>` : ''}<button class="btn g" id="cXls">📥 صورت‌حساب اکسل</button></div></div>
    ${quickActions()}<div class="card"><h3>📜 صورت‌حساب</h3><div class="tbl-wrap" id="stmt">در حال بارگذاری…</div></div>`;
  bindQA(el, {customer_id:c.id});
  $('cBack').onclick = () => { S.view = 'customers'; render(); };
  $('cEdit').onclick = () => formCustomer(c, () => render());
  const {data, error} = await sb.from('lines').select('*, txns!inner(id,no,type,occurred_at,note,voided,meta)').eq('exchange_id', S.ex.id).eq('customer_id', c.id).eq('txns.voided', false);
  if (error) return err(error);
  data.sort((a, b) => new Date(a.txns.occurred_at) - new Date(b.txns.occurred_at));
  const run = {};
  const rows = data.map(l => { run[l.party + l.currency] = (run[l.party + l.currency] || 0) + Number(l.amount); return {l, bal: run[l.party + l.currency]}; });
  $('stmt').innerHTML = rows.length ? `<table class="tbl"><tr><th>تاریخ</th><th>شرح</th><th>مبلغ</th><th>مانده</th></tr>${rows.reverse().map(({l, bal}) =>
    `<tr><td class="small">${jd(l.txns.occurred_at, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})}</td><td class="small">${TYPE[l.txns.type]?.[1] || ''}${l.party === 'trust' ? ' (امانت)' : ''}${l.txns.note ? ' · ' + esc(l.txns.note) : ''}</td>
    <td class="n ${l.amount > 0 ? 'down' : 'up'}">${money(l.amount, l.currency)}</td><td class="n">${money(bal, l.currency)}</td></tr>`).join('')}</table>
    <p class="hint">مبلغ مثبت یعنی مشتری بدهکار شده، منفی یعنی طلبکار شده.</p>` : '<div class="empty">هنوز تراکنشی ندارد</div>';
  $('cXls').onclick = () => xlsx(`statement-${c.name}`, [['تاریخ', 'نوع', 'توضیح', 'ارز', 'مبلغ', 'مانده', 'حساب']].concat(rows.map(({l, bal}) =>
    [jd(l.txns.occurred_at), TYPE[l.txns.type]?.[1], l.txns.note || '', l.currency, Number(l.amount), bal, l.party === 'trust' ? 'امانت' : 'جاری'])));
}

/* ---------------------------------------------------------------- reports */
async function vReports(el) {
  if (!isMgr()) {
    el.innerHTML = `<div class="card"><h3>💰 موجودی صندوق‌ها</h3><div class="grid g3">${boxTotals().map(({b, v}) => `<div class="stat"><div class="l">${esc(b.name)}</div><div class="v">${money(v, b.currency)}</div></div>`).join('')}</div></div><p class="muted center">گزارش سود و زیان فقط برای مالک و شرکا نمایش داده می‌شود.</p>`;
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
  el.innerHTML = `<div class="card"><h3>📈 سود و زیان <span class="seg" id="rP"><button data-p="1" class="on">امروز</button><button data-p="7">۷ روز</button><button data-p="30">۳۰ روز</button><button data-p="365">۱ سال</button></span></h3><div id="pnl">در حال محاسبه…</div></div>
    <div class="card"><h3>🧮 موجودی ارزی خالص (نسبت به نرخ امروز بازار)</h3>
      <div class="tbl-wrap"><table class="tbl"><tr><th>ارز</th><th>صندوق</th><th>طلب از مشتری</th><th>بدهی به مشتری</th><th>امانت</th><th>خالص</th><th>ارزش (${CCY[B].fa})</th></tr>
      ${posRows.map(({c, p, tot, vb}) => `<tr><td>${CCY[c]?.fa || c}</td><td class="n">${fmt(p.box)}</td><td class="n down">${fmt(p.rec)}</td><td class="n up">${fmt(p.pay)}</td><td class="n">${fmt(p.trust)}</td><td class="n"><b>${fmt(tot)}</b></td><td class="n">${fmt(vb, 2)}</td></tr>`).join('')}
      <tr><td colspan="6"><b>ارزش خالص کل صرافی</b></td><td class="n"><b>${navOk ? money(nav, B, 2) : '—'}</b></td></tr></table></div>
      <p class="hint">خالص = صندوق + طلب از مشتری − بدهی به مشتری ± امانت. ارزش‌گذاری با نرخ امروز بازار.</p></div>
    <div class="card"><h3>📥 خروجی اکسل</h3><div class="btns"><button class="btn g" id="xTx">دفتر معاملات</button><button class="btn g" id="xCu">مانده مشتری‌ها</button><button class="btn g" id="xBx">موجودی صندوق‌ها</button></div></div>`;
  let days = 1;
  const loadPnl = async () => {
    const from = new Date(); if (days === 1) from.setHours(0, 0, 0, 0); else from.setDate(from.getDate() - days);
    const rows = await fetchAll(() => sb.from('txns').select('type,meta,occurred_at,category,lines(party,amount,currency,usd_rate,member_id)').eq('exchange_id', S.ex.id).eq('voided', false).gte('occurred_at', from.toISOString()).in('type', ['trade','transfer','expense','capital_in','capital_out']));
    let trade = 0, nTrade = 0, conv = 0; const exp = {};
    for (const t of rows) {
      if (t.type === 'trade') { trade += t.meta?.profit_base || 0; nTrade++; }
      if (t.type === 'transfer') conv += t.meta?.profit_base || 0;
      if (t.type === 'expense') for (const l of t.lines) if (l.party === 'expense') exp[t.category || 'متفرقه'] = (exp[t.category || 'متفرقه'] || 0) + (inBase(Number(l.amount), l.currency, l.usd_rate) || 0);
    }
    const expT = Object.values(exp).reduce((a, b) => a + b, 0), net = trade + conv - expT;
    const partners = S.members.filter(m => m.role !== 'staff' && Number(m.share_pct) > 0);
    $('pnl').innerHTML = `<div class="grid g4">
      <div class="stat"><div class="l">سود معاملات (${fmt(nTrade, 0)} معامله)</div><div class="v ${trade >= 0 ? 'up' : 'down'}">${money(trade, B, 2)}</div></div>
      <div class="stat"><div class="l">سود تبدیل‌های داخلی</div><div class="v">${money(conv, B, 2)}</div></div>
      <div class="stat"><div class="l">هزینه‌ها</div><div class="v down">${money(expT, B, 2)}</div></div>
      <div class="stat"><div class="l"><b>سود خالص</b></div><div class="v ${net >= 0 ? 'up' : 'down'}"><b>${money(net, B, 2)}</b></div></div></div>
      ${Object.keys(exp).length ? `<h4>ریز هزینه‌ها</h4><table class="tbl">${Object.entries(exp).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${money(v, B, 2)}</td></tr>`).join('')}</table>` : ''}
      ${partners.length ? `<h4>سهم شرکا از سود خالص</h4><table class="tbl">${partners.map(m => `<tr><td>${esc(m.display_name)} (${fmt(m.share_pct, 2)}٪)</td><td class="n">${money(net * m.share_pct / 100, B, 2)}</td></tr>`).join('')}</table>` : ''}
      <p class="hint">سود معامله = اختلاف نرخ شما با نرخ بازار در لحظه‌ی ثبت. ارزش‌ها به ${CCY[B].fa}.</p>`;
  };
  $('rP').onclick = e => { const b = e.target.closest('button'); if (!b) return; days = +b.dataset.p; $('rP').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); loadPnl(); };
  loadPnl().catch(err);
  $('xBx').onclick = () => xlsx('boxes', [['صندوق', 'ارز', 'موجودی']].concat(boxTotals().map(({b, v}) => [b.name, b.currency, v])));
  $('xCu').onclick = () => { const rows = [['مشتری', 'تلفن', 'حساب', 'ارز', 'مانده (+بدهکار / -طلبکار)']];
    for (const r of S.bal) if ((r.party === 'customer' || r.party === 'trust') && Math.abs(r.amount) > 1e-9) { const c = cust(r.customer_id); rows.push([c?.name, c?.phone || '', r.party === 'trust' ? 'امانت' : 'جاری', r.currency, Number(r.amount)]); }
    xlsx('customers', rows); };
  $('xTx').onclick = async () => {
    const rows = await fetchAll(() => sb.from('txns').select('*, lines(*)').eq('exchange_id', S.ex.id).order('occurred_at', {ascending:false}));
    xlsx('ledger', [['شماره', 'تاریخ', 'نوع', 'مشتری/طرف', 'شرح', 'توضیح', 'سود (' + B + ')', 'ثبت‌کننده', 'وضعیت']].concat(rows.map(x =>
      [x.no, jd(x.occurred_at), TYPE[x.type]?.[1], cust(x.customer_id)?.name || (x.member_id ? memberName(x.member_id) : x.category || ''), txSummary(x).replace(/<[^>]+>/g, ''), x.note || '', x.meta?.profit_base ?? '', memberName(x.created_by), x.voided ? 'باطل' : ''])));
  };
}
function xlsx(name, rows) {
  if (!window.XLSX) return toast('کتابخانه اکسل هنوز بارگذاری نشده، دوباره امتحان کنید');
  const ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = rows[0].map(() => ({wch:18}));
  const wb = XLSX.utils.book_new(); wb.Workbook = {Views:[{RTL:true}]}; XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ---------------------------------------------------------------- more / settings */
function vMore(el) {
  const mgr = isMgr();
  el.innerHTML = `${mgr ? `<div class="qa"><button class="c5" data-act="capital"><span>🏦</span>آورده / برداشت شریک</button><button class="c6" data-act="opening"><span>📌</span>موجودی اول دوره</button><button class="c2" data-act="transfer"><span>🔁</span>انتقال بین صندوق‌ها</button><button class="c1" id="mBoxAdd"><span>➕</span>صندوق جدید</button></div>` : ''}
    <div class="card" id="boardCard"><h3>📋 تابلوی نرخ صرافی</h3><p class="hint" style="margin-top:-6px">این نرخ‌ها پیش‌فرض فرم معامله‌اند. «خرید» = نرخی که از مشتری می‌خرید، «فروش» = نرخی که به مشتری می‌فروشید.</p>
      <div class="tbl-wrap"><table class="tbl"><tr><th>ارز</th><th>بازار</th><th>خرید</th><th>فروش</th></tr>
      ${BOARD_DEFAULT.map(([c, q], i) => { const r = S.board.find(x => x.ccy === c && x.quote === q); return `<tr><td>${CCY[c].fa} → ${CCY[q].fa}</td><td class="n muted">${fmt(mktRate(c, q))}</td>
        <td><input class="in num" style="min-height:38px;padding:6px" data-bb="${i}" value="${r?.buy ?? ''}" inputmode="decimal"></td><td><input class="in num" style="min-height:38px;padding:6px" data-bs="${i}" value="${r?.sell ?? ''}" inputmode="decimal"></td></tr>`; }).join('')}
      </table></div>
      <div class="btns"><button class="btn g" id="bFill">پر کردن از بازار (±۰.۳٪)</button><button class="btn p" id="bSave">ذخیره نرخ‌ها</button></div></div>
    <div class="card"><h3>💰 صندوق‌ها</h3><div class="list">${S.boxes.map(b => `<div class="row" data-box="${b.id}"><div class="ic">${b.kind === 'bank' ? '🏦' : b.kind === 'wallet' ? '👛' : '💵'}</div><div class="m"><b>${esc(b.name)}${b.archived ? ' (بایگانی)' : ''}</b><span>${CCY[b.currency]?.fa || b.currency}</span></div><div class="e">${money(balOf('box', 'box_id', b.id)[b.currency] || 0, b.currency)}</div></div>`).join('')}</div></div>
    <div class="card"><h3>👔 اعضای صرافی</h3><div class="list">${S.members.map(m => `<div class="row" data-mem="${m.user_id}"><div class="ic">${m.role === 'owner' ? '👑' : m.role === 'partner' ? '🤝' : '🧑‍💼'}</div><div class="m"><b>${esc(m.display_name || m.email)}</b><span>${ROLE[m.role]}${m.role !== 'staff' ? ' · سهم سود ' + fmt(m.share_pct, 2) + '٪' : ''} · ${esc(m.email || '')}</span></div></div>`).join('')}</div>
      ${mgr ? '<div class="btns"><button class="btn p" id="mInv">+ دعوت شریک یا کارمند</button></div><div id="invList"></div>' : ''}</div>
    <div class="card"><h3>🏪 صرافی</h3>
      ${S.role === 'owner' ? `<div class="fld"><label>نام صرافی</label><input class="in" id="exN" value="${esc(S.ex.name)}"></div>
      <div class="fld"><label>ارز گزارش سود</label><select class="in" id="exB">${ccyOpts(base(), ['USD','TRY','IRT','EUR'])}</select></div><button class="btn p w" id="exSave">ذخیره</button>` : `<p>${esc(S.ex.name)}</p>`}
      <div class="btns"><button class="btn g" id="newEx">+ ساخت صرافی دیگر</button><button class="btn r" id="logout">خروج از حساب</button></div>
      <p class="hint">نسخه‌ی آزمایشی. داده‌ها در پایگاه داده‌ی ابری ذخیره می‌شود و هر صرافی فقط به اطلاعات خودش دسترسی دارد.</p></div>`;
  bindQA(el);
  const fillMarket = () => BOARD_DEFAULT.forEach(([c, q], i) => { const m = mktRate(c, q); if (!m) return; const d = m >= 100 ? 0 : m >= 1 ? 3 : 6;
    el.querySelector(`[data-bb="${i}"]`).value = +(m * 0.997).toFixed(d); el.querySelector(`[data-bs="${i}"]`).value = +(m * 1.003).toFixed(d); });
  $('bFill').onclick = fillMarket;
  $('bSave').onclick = async () => {
    const rows = BOARD_DEFAULT.map(([c, q], i) => ({exchange_id:S.ex.id, ccy:c, quote:q, buy:num(el.querySelector(`[data-bb="${i}"]`).value) || null, sell:num(el.querySelector(`[data-bs="${i}"]`).value) || null, updated_at:new Date().toISOString(), updated_by:S.user.id}));
    const {error} = await sb.from('rates').upsert(rows); if (error) return err(error);
    toast('نرخ‌ها ذخیره شد ✅'); await refresh();
  };
  if ($('mBoxAdd')) $('mBoxAdd').onclick = () => formBox(null);
  el.querySelectorAll('[data-box]').forEach(r => r.onclick = () => mgr && formBox(box(r.dataset.box)));
  el.querySelectorAll('[data-mem]').forEach(r => r.onclick = () => S.role === 'owner' && formMember(S.members.find(m => m.user_id === r.dataset.mem)));
  if ($('mInv')) { $('mInv').onclick = formInvite; loadInvites(); }
  if ($('exSave')) $('exSave').onclick = async () => { const {error} = await sb.from('exchanges').update({name:$('exN').value.trim(), base_ccy:$('exB').value}).eq('id', S.ex.id); if (error) return err(error); S.ex.name = $('exN').value.trim(); S.ex.base_ccy = $('exB').value; toast('ذخیره شد'); render(); };
  $('newEx').onclick = renderCreateExchange;
  $('logout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
}
async function loadInvites() {
  const {data} = await sb.from('invites').select('*').eq('exchange_id', S.ex.id);
  if (data?.length) $('invList').innerHTML = `<h4>دعوت‌های در انتظار ثبت‌نام</h4><div class="list">${data.map(i => `<div class="row"><div class="ic">✉️</div><div class="m"><b>${esc(i.display_name || i.email)}</b><span>${esc(i.email)} · ${ROLE[i.role]}</span></div><button class="ibtn" data-delinv="${i.id}">لغو</button></div>`).join('')}</div>`;
  document.querySelectorAll('[data-delinv]').forEach(b => b.onclick = async e => { e.stopPropagation(); await sb.from('invites').delete().eq('id', b.dataset.delinv); loadInvites(); });
}

/* ---------------------------------------------------------------- sheet helpers */
function openSheet(html, after) { $('sheetBody').innerHTML = html; $('sheetBg').classList.add('show'); $('sheet').classList.add('show'); after && after(); }
function closeSheet() { $('sheetBg').classList.remove('show'); $('sheet').classList.remove('show'); }
$('sheetBg').onclick = closeSheet;
function custSelect(id, sel, opts = {}) {
  const list = S.customers.filter(c => !c.archived && (opts.walkin !== false || !c.is_walkin));
  return `<div class="pair"><select class="in" id="${id}">${opts.empty ? '<option value="">— انتخاب کنید —</option>' : ''}${list.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}${c.phone ? ' · ' + esc(c.phone) : ''}</option>`).join('')}</select>
    <button class="btn g" type="button" data-newcust="${id}" style="min-width:auto">+ جدید</button></div>`;
}
function bindNewCust() {
  document.querySelectorAll('[data-newcust]').forEach(b => b.onclick = () => {
    const selId = b.dataset.newcust, holder = b.parentElement;
    if (holder.nextElementSibling?.classList.contains('nc')) return;
    holder.insertAdjacentHTML('afterend', `<div class="nc box2" style="margin-top:8px"><div class="pair"><input class="in" placeholder="نام مشتری جدید" data-ncn><input class="in" placeholder="تلفن" dir="ltr" data-ncp style="width:140px;flex:none"></div>
      <div class="btns" style="margin-top:6px"><button class="btn p" type="button" data-ncs>افزودن</button></div></div>`);
    const box = holder.nextElementSibling;
    box.querySelector('[data-ncn]').focus();
    box.querySelector('[data-ncs]').onclick = async () => {
      const n = box.querySelector('[data-ncn]').value.trim(), ph = box.querySelector('[data-ncp]').value.trim() || null;
      if (!n) return toast('نام را وارد کنید');
      const {data, error} = await sb.from('customers').insert({exchange_id:S.ex.id, name:n, phone:ph}).select().single();
      if (error) return err(error);
      S.customers.push(data); const s = $(selId); s.insertAdjacentHTML('beforeend', `<option value="${data.id}">${esc(data.name)}</option>`); s.value = data.id; s.dispatchEvent(new Event('change'));
      box.remove(); toast('مشتری اضافه شد');
    };
  });
}
function boxSelect(id, ccy, sel, allowNone) {
  const list = S.boxes.filter(b => !b.archived && (!ccy || b.currency === ccy));
  return `<select class="in" id="${id}">${allowNone ? `<option value="">${allowNone}</option>` : ''}${list.map(b => `<option value="${b.id}" ${b.id === sel ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`;
}
const dateFld = () => `<div class="fld"><label>تاریخ و ساعت</label><input class="in" id="fDate" type="datetime-local" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}"></div>`;
const noteFld = () => `<div class="fld"><label>توضیحات</label><input class="in" id="fNote" placeholder="اختیاری"></div>`;
const dateVal = () => { const v = $('fDate')?.value; return v ? new Date(v).toISOString() : new Date().toISOString(); };
async function post(p, msg) {
  const {error} = await sb.rpc('post_txn', {p:{exchange_id:S.ex.id, occurred_at:dateVal(), note:$('fNote')?.value.trim() || null, ...p}});
  if (error) return err(error);
  closeSheet(); toast(msg || 'ثبت شد ✅'); await refresh();
}
function amtHint(inp, hint, c) { const f = () => { const v = num($(inp).value); $(hint).textContent = isFinite(v) ? `${fmt(v)} ${CCY[$(c)?.value || c]?.fa || ''} ${words(v) ? '· ' + words(v) : ''}` : ''; }; $(inp).addEventListener('input', f); f(); }

/* ---------------------------------------------------------------- forms */
function defaultRate(give, get) {          // customer gives `give`, gets `get`
  const [st, wk] = strongWeak(give, get);
  const weBuyStrong = give === st;
  const r = S.board.find(x => x.ccy === st && x.quote === wk);
  const b = r && (weBuyStrong ? r.buy : r.sell);
  if (b) return {rate:Number(b), src:'تابلوی نرخ'};
  const last = S.recentTrades.find(t => t.meta?.give?.ccy === give && t.meta?.get?.ccy === get);
  if (last?.meta?.rate) return {rate:last.meta.rate, src:'آخرین معامله'};
  const m = mktRate(st, wk); return {rate: m ? +m.toPrecision(6) : null, src:'بازار'};
}
function avgCost(strong, weak) {             // weighted avg rate at which we BOUGHT strong with weak
  let s = 0, w = 0;
  for (const t of S.recentTrades) { const m = t.meta; if (m?.give?.ccy === strong && m?.get?.ccy === weak) { s += m.give.amt; w += m.get.amt; } }
  return s ? w / s : null;
}
function formTrade(pre = {}) {
  const g0 = pre.give || 'USD', r0 = pre.get || 'TRY';
  openSheet(`<h2>💱 معامله‌ی جدید</h2>
    <div class="fld"><label>مشتری</label>${custSelect('tC', pre.customer_id || S.customers.find(c => c.is_walkin)?.id)}</div>
    <div class="box2 give"><h4>⬅️ مشتری می‌دهد (ما می‌گیریم)</h4>
      <div class="pair"><input class="in num" id="tA" inputmode="decimal" placeholder="مبلغ"><select class="in" id="tAC">${ccyOpts(g0)}</select></div><div class="hint" id="tAH"></div>
      <div class="fld" style="margin-top:8px"><label>کجا دریافت شد؟</label><div id="tABox"></div></div></div>
    <div class="fld"><label id="tRL">نرخ</label><input class="in num" id="tR" inputmode="decimal"><div class="hint" id="tRH"></div></div>
    <div class="box2 get"><h4>➡️ مشتری می‌گیرد (ما می‌دهیم)</h4>
      <div class="pair"><input class="in num" id="tB" inputmode="decimal" placeholder="مبلغ"><select class="in" id="tBC">${ccyOpts(r0)}</select></div><div class="hint" id="tBH"></div>
      <div class="fld" style="margin-top:8px"><label>از کجا پرداخت شد؟</label><div id="tBBox"></div></div></div>
    <div class="preview" id="tPrev"></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="tGo">ثبت معامله</button><button class="btn g" id="tX">انصراف</button></div>`, () => {
    let lock = 'B';                          // which side is derived
    const setBoxes = () => {
      $('tABox').innerHTML = boxSelect('tABx', $('tAC').value, null, '— نسیه / به حساب مشتری —');
      $('tBBox').innerHTML = boxSelect('tBBx', $('tBC').value, null, '— نسیه / بستانکار شود —');
      if (!S.boxes.some(b => b.currency === $('tAC').value)) $('tABx').value = '';
      if (!S.boxes.some(b => b.currency === $('tBC').value)) $('tBBx').value = '';
    };
    const orient = () => { const [st, wk] = strongWeak($('tAC').value, $('tBC').value); return {st, wk}; };
    const setRate = () => {
      const {st, wk} = orient(); const d = defaultRate($('tAC').value, $('tBC').value);
      $('tRL').textContent = `نرخ: هر ۱ ${CCY[st].fa} = چند ${CCY[wk].fa}`;
      $('tR').value = d.rate ?? '';
      const ac = avgCost(st, wk), m = mktRate(st, wk);
      $('tRH').innerHTML = `پیش‌فرض از ${d.src} · بازار: ${fmt(m)}${ac ? ' · میانگین خرید شما: ' + fmt(ac) : ''}`;
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
      $('tAH').textContent = isFinite(A) && words(A) ? words(A) + ' ' + CCY[gc].fa : '';
      $('tBH').textContent = isFinite(B) && words(B) ? words(B) + ' ' + CCY[rc].fa : '';
      if (!(A > 0 && B > 0)) { $('tPrev').innerHTML = 'مبلغ و نرخ را وارد کنید.'; return; }
      const p = (inBase(A, gc) ?? 0) - (inBase(B, rc) ?? 0);
      $('tPrev').innerHTML = `مشتری <b>${money(A, gc)}</b> می‌دهد و <b>${money(B, rc)}</b> می‌گیرد.` +
        (!$('tABx').value ? `<br>⚠️ ${money(A, gc)} هنوز دریافت نشده: مشتری بدهکار می‌شود.` : '') +
        (!$('tBBx').value ? `<br>⚠️ ${money(B, rc)} هنوز پرداخت نشده: مشتری طلبکار می‌شود.` : '') +
        (isMgr() ? `<br>سود نسبت به نرخ بازار: <b class="${p >= 0 ? 'up' : 'down'}">${money(p, base(), 2)}</b>` : '');
    };
    setBoxes(); setRate(); bindNewCust();
    $('tA').oninput = () => { lock = 'B'; calc(); };
    $('tR').oninput = () => { lock = 'B'; calc(); };
    $('tB').oninput = () => { lock = 'R'; calc(); };
    $('tAC').onchange = $('tBC').onchange = () => { if ($('tAC').value === $('tBC').value) return toast('دو ارز باید متفاوت باشند'); setBoxes(); setRate(); lock = 'B'; calc(); };
    $('tABox').onchange = $('tBBox').onchange = preview;
    $('tX').onclick = closeSheet;
    $('tGo').onclick = () => {
      const C = $('tC').value, A = num($('tA').value), B = num($('tB').value), gc = $('tAC').value, rc = $('tBC').value, ab = $('tABx').value, bb = $('tBBx').value;
      if (!C || !(A > 0) || !(B > 0) || gc === rc) return toast('مشتری، مبلغ‌ها و دو ارز متفاوت را کامل کنید');
      if (cust(C)?.is_walkin && (!ab || !bb)) return toast('برای مشتری گذری، دریافت و پرداخت باید نقدی باشد. برای نسیه، مشتری را با نام ثبت کنید.');
      const ug = usdOf(gc), ur = usdOf(rc);
      const lines = [
        {party:'customer', customer_id:C, currency:gc, amount:-A, usd_rate:ug},
        {party:'customer', customer_id:C, currency:rc, amount:B, usd_rate:ur},
      ];
      if (ab) lines.push({party:'box', box_id:ab, currency:gc, amount:A, usd_rate:ug}, {party:'customer', customer_id:C, currency:gc, amount:A, usd_rate:ug});
      if (bb) lines.push({party:'box', box_id:bb, currency:rc, amount:-B, usd_rate:ur}, {party:'customer', customer_id:C, currency:rc, amount:-B, usd_rate:ur});
      const {st, wk} = orient();
      const profit = (inBase(A, gc) ?? 0) - (inBase(B, rc) ?? 0);
      post({type:'trade', customer_id:C, lines, meta:{give:{ccy:gc, amt:A}, get:{ccy:rc, amt:B}, rate:num($('tR').value), pair:`${st}/${wk}`,
        market:{[gc]:ug, [rc]:ur}, profit_base: ug && ur ? +profit.toFixed(4) : null, base:base()}}, 'معامله ثبت شد ✅');
    };
  });
}
function formMoney(pre = {}) {
  openSheet(`<h2>⬇️⬆️ واریز / پرداخت مشتری</h2>
    <div class="seg" id="mK" style="margin-bottom:10px"><button class="on" data-k="deposit">⬇️ مشتری واریز کرد</button><button data-k="withdraw">⬆️ به مشتری پرداخت شد</button></div>
    <div class="fld"><label>مشتری</label>${custSelect('mC', pre.customer_id, {walkin:false, empty:true})}</div>
    <div class="fld"><label>مبلغ</label><div class="pair"><input class="in num" id="mA" inputmode="decimal"><select class="in" id="mCC">${ccyOpts('IRT')}</select></div><div class="hint" id="mAH"></div></div>
    <div class="fld"><label>صندوق / حساب</label><div id="mBox"></div></div>
    ${noteFld()}${dateFld()}<p class="hint" id="mExp"></p>
    <div class="btns"><button class="btn p" id="mGo">ثبت</button><button class="btn g" id="mX">انصراف</button></div>`, () => {
    let k = 'deposit';
    const sync = () => { $('mBox').innerHTML = boxSelect('mBx', $('mCC').value); $('mExp').textContent = k === 'deposit' ? 'مثال: «مهدی رئیسی ۱۰۰ میلیون تومان به حساب ایران واریز کرد» → مشتری به همین مبلغ طلبکار می‌شود.' : 'پرداخت به مشتری: اگر طلبکار بوده، طلبش کم می‌شود؛ وگرنه بدهکار می‌شود.'; };
    $('mK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = b.dataset.k; $('mK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); sync(); };
    $('mCC').onchange = sync; sync(); amtHint('mA', 'mAH', 'mCC'); bindNewCust();
    $('mX').onclick = closeSheet;
    $('mGo').onclick = () => {
      const C = $('mC').value, A = num($('mA').value), c = $('mCC').value, bx = $('mBx').value;
      if (!C || !(A > 0) || !bx) return toast('مشتری، مبلغ و صندوق را کامل کنید');
      const s = k === 'deposit' ? 1 : -1, u = usdOf(c);
      post({type:k, customer_id:C, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'customer', customer_id:C, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formTrust(pre = {}) {
  const K = [['trust_out','🤝 امانت دادیم', -1], ['trust_return_in','↩️ امانت‌مان برگشت', 1], ['trust_in','📥 امانت گرفتیم', 1], ['trust_return_out','↪️ امانت را پس دادیم', -1]];
  openSheet(`<h2>🤝 امانت</h2>
    <div class="seg" id="uK" style="margin-bottom:10px">${K.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="fld"><label>شخص (امانت‌گیرنده / امانت‌دهنده)</label>${custSelect('uC', pre.customer_id, {walkin:false, empty:true})}</div>
    <div class="fld"><label>مبلغ</label><div class="pair"><input class="in num" id="uA" inputmode="decimal"><select class="in" id="uCC">${ccyOpts('USD')}</select></div><div class="hint" id="uAH"></div></div>
    <div class="fld"><label>صندوق</label><div id="uBox"></div></div>
    <div class="preview" id="uBal"></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="uGo">ثبت</button><button class="btn g" id="uX">انصراف</button></div>`, () => {
    let k = K[0];
    const sync = () => {
      $('uBox').innerHTML = boxSelect('uBx', $('uCC').value);
      const C = $('uC').value; const t = C ? balOf('trust', 'customer_id', C) : {};
      const e = Object.entries(t).filter(([, v]) => Math.abs(v) > 1e-9);
      $('uBal').innerHTML = C ? (e.length ? 'امانت فعلی: ' + e.map(([c, v]) => `${money(Math.abs(v), c)} ${v > 0 ? '(ما نزد او)' : '(او نزد ما)'}`).join('، ') : 'این شخص امانت باز ندارد.') : 'شخص را انتخاب کنید.';
    };
    $('uK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = K.find(x => x[0] === b.dataset.k); $('uK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
    $('uCC').onchange = sync; $('uC').onchange = sync; sync(); amtHint('uA', 'uAH', 'uCC'); bindNewCust();
    $('uX').onclick = closeSheet;
    $('uGo').onclick = () => {
      const C = $('uC').value, A = num($('uA').value), c = $('uCC').value, bx = $('uBx').value;
      if (!C || !(A > 0) || !bx) return toast('شخص، مبلغ و صندوق را کامل کنید');
      const s = k[2], u = usdOf(c);
      post({type:k[0], customer_id:C, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'trust', customer_id:C, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formExpense() {
  openSheet(`<h2>🧾 ثبت هزینه</h2>
    <div class="fld"><label>نوع هزینه</label><select class="in" id="eCat">${EXP_CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="fld"><label>مبلغ</label><div class="pair"><input class="in num" id="eA" inputmode="decimal"><select class="in" id="eCC">${ccyOpts('TRY')}</select></div><div class="hint" id="eAH"></div></div>
    <div class="fld"><label>از صندوق</label><div id="eBox"></div></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="eGo">ثبت هزینه</button><button class="btn g" id="eX">انصراف</button></div>`, () => {
    const sync = () => $('eBox').innerHTML = boxSelect('eBx', $('eCC').value);
    $('eCC').onchange = sync; sync(); amtHint('eA', 'eAH', 'eCC'); $('eX').onclick = closeSheet;
    $('eGo').onclick = () => {
      const A = num($('eA').value), c = $('eCC').value, bx = $('eBx').value; if (!(A > 0) || !bx) return toast('مبلغ و صندوق را کامل کنید');
      const u = usdOf(c);
      post({type:'expense', category:$('eCat').value, lines:[{party:'box', box_id:bx, currency:c, amount:-A, usd_rate:u}, {party:'expense', currency:c, amount:A, usd_rate:u}]}, 'هزینه ثبت شد');
    };
  });
}
function formTransfer() {
  openSheet(`<h2>🔁 انتقال / تبدیل بین صندوق‌ها</h2>
    <div class="box2 give"><h4>از صندوق</h4>${boxSelect('xF')}<input class="in num" id="xFA" inputmode="decimal" placeholder="مبلغ خارج‌شده" style="margin-top:8px"></div>
    <div class="box2 get"><h4>به صندوق</h4>${boxSelect('xT')}<input class="in num" id="xTA" inputmode="decimal" placeholder="مبلغ واردشده" style="margin-top:8px"><p class="hint">اگر دو صندوق یک ارزند، همان مبلغ. اگر ارز متفاوت است (مثلاً فروش تتر و دریافت لیر)، مبلغ واقعی دریافتی را بنویسید.</p></div>
    ${noteFld()}${dateFld()}<div class="btns"><button class="btn p" id="xGo">ثبت</button><button class="btn g" id="xX">انصراف</button></div>`, () => {
    $('xFA').oninput = () => { if (box($('xF').value)?.currency === box($('xT').value)?.currency) $('xTA').value = $('xFA').value; };
    $('xX').onclick = closeSheet;
    $('xGo').onclick = () => {
      const f = box($('xF').value), t = box($('xT').value), a = num($('xFA').value), b = num($('xTA').value);
      if (!f || !t || f.id === t.id || !(a > 0) || !(b > 0)) return toast('دو صندوق متفاوت و مبلغ‌ها را کامل کنید');
      const uf = usdOf(f.currency), ut = usdOf(t.currency);
      const profit = f.currency === t.currency ? 0 : (inBase(b, t.currency) ?? 0) - (inBase(a, f.currency) ?? 0);
      post({type:'transfer', lines:[{party:'box', box_id:f.id, currency:f.currency, amount:-a, usd_rate:uf}, {party:'box', box_id:t.id, currency:t.currency, amount:b, usd_rate:ut}],
        meta:{profit_base: f.currency === t.currency ? null : +profit.toFixed(4)}});
    };
  });
}
function formCapital() {
  const ps = S.members.filter(m => m.role !== 'staff');
  openSheet(`<h2>🏦 آورده / برداشت شریک</h2>
    <div class="seg" id="kK" style="margin-bottom:10px"><button class="on" data-k="capital_in">آورده (پول گذاشت)</button><button data-k="capital_out">برداشت (پول برد)</button></div>
    <div class="fld"><label>شریک</label><select class="in" id="kM">${ps.map(m => `<option value="${m.user_id}">${esc(m.display_name || m.email)}</option>`).join('')}</select></div>
    <div class="fld"><label>مبلغ</label><div class="pair"><input class="in num" id="kA" inputmode="decimal"><select class="in" id="kCC">${ccyOpts('USD')}</select></div><div class="hint" id="kAH"></div></div>
    <div class="fld"><label>صندوق</label><div id="kBox"></div></div>${noteFld()}${dateFld()}
    <div class="btns"><button class="btn p" id="kGo">ثبت</button><button class="btn g" id="kX">انصراف</button></div>`, () => {
    let k = 'capital_in';
    $('kK').onclick = e => { const b = e.target.closest('button'); if (!b) return; k = b.dataset.k; $('kK').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
    const sync = () => $('kBox').innerHTML = boxSelect('kBx', $('kCC').value); $('kCC').onchange = sync; sync(); amtHint('kA', 'kAH', 'kCC'); $('kX').onclick = closeSheet;
    $('kGo').onclick = () => {
      const A = num($('kA').value), c = $('kCC').value, bx = $('kBx').value, M = $('kM').value; if (!(A > 0) || !bx || !M) return toast('همه‌ی موارد را کامل کنید');
      const s = k === 'capital_in' ? 1 : -1, u = usdOf(c);
      post({type:k, member_id:M, lines:[{party:'box', box_id:bx, currency:c, amount:s * A, usd_rate:u}, {party:'equity', member_id:M, currency:c, amount:-s * A, usd_rate:u}]});
    };
  });
}
function formOpening() {
  const act = S.boxes.filter(b => !b.archived);
  openSheet(`<h2>📌 موجودی اول دوره</h2><p class="muted small">موجودی فعلی هر صندوق را یک بار وارد کنید (فقط صندوق‌هایی که موجودی دارند).</p>
    ${act.map(b => `<div class="fld"><label>${esc(b.name)} (${CCY[b.currency]?.fa})</label><input class="in num" data-ob="${b.id}" inputmode="decimal" placeholder="0"></div>`).join('')}
    ${dateFld()}<div class="btns"><button class="btn p" id="oGo">ثبت موجودی‌ها</button><button class="btn g" id="oX">انصراف</button></div>`, () => {
    $('oX').onclick = closeSheet;
    $('oGo').onclick = () => {
      const lines = [];
      document.querySelectorAll('[data-ob]').forEach(i => { const v = num(i.value); if (v) { const b = box(i.dataset.ob), u = usdOf(b.currency);
        lines.push({party:'box', box_id:b.id, currency:b.currency, amount:v, usd_rate:u}, {party:'equity', member_id:S.user.id, currency:b.currency, amount:-v, usd_rate:u}); } });
      if (!lines.length) return toast('حداقل یک مبلغ وارد کنید');
      post({type:'opening', lines, note:'موجودی اول دوره'}, 'موجودی اول دوره ثبت شد');
    };
  });
}
function formCustomer(c, done) {
  openSheet(`<h2>${c ? '✏️ ویرایش مشتری' : '👤 مشتری جدید'}</h2>
    <div class="fld"><label>نام</label><input class="in" id="cuN" value="${esc(c?.name || '')}"></div>
    <div class="fld"><label>شماره تماس</label><input class="in" id="cuP" dir="ltr" inputmode="tel" value="${esc(c?.phone || '')}" placeholder="+90…"></div>
    <div class="fld"><label>توضیحات</label><input class="in" id="cuD" value="${esc(c?.notes || '')}" placeholder="مثلاً آشنای آقای …"></div>
    <div class="btns"><button class="btn p" id="cuGo">ذخیره</button>${c && !c.is_walkin ? '<button class="btn r" id="cuArc">بایگانی</button>' : ''}<button class="btn g" id="cuX">انصراف</button></div>`, () => {
    $('cuX').onclick = closeSheet;
    $('cuGo').onclick = async () => {
      const row = {name:$('cuN').value.trim(), phone:$('cuP').value.trim() || null, notes:$('cuD').value.trim() || null};
      if (!row.name) return toast('نام را وارد کنید');
      const r = c ? await sb.from('customers').update(row).eq('id', c.id).select().single() : await sb.from('customers').insert({...row, exchange_id:S.ex.id}).select().single();
      if (r.error) return err(r.error);
      if (c) Object.assign(c, r.data); else S.customers.push(r.data);
      closeSheet(); toast('ذخیره شد'); done && done();
    };
    if ($('cuArc')) $('cuArc').onclick = async () => { await sb.from('customers').update({archived:true}).eq('id', c.id); c.archived = true; closeSheet(); S.view = 'customers'; render(); };
  });
}
function formBox(b) {
  openSheet(`<h2>${b ? '✏️ ویرایش صندوق' : '➕ صندوق جدید'}</h2>
    <div class="fld"><label>نام</label><input class="in" id="bN" value="${esc(b?.name || '')}" placeholder="مثلاً حساب زراعت بانک"></div>
    <div class="fld"><label>ارز</label><select class="in" id="bC" ${b ? 'disabled' : ''}>${ccyOpts(b?.currency || 'TRY')}</select></div>
    <div class="fld"><label>نوع</label><select class="in" id="bK">${[['cash','نقد'],['bank','حساب بانکی'],['wallet','کیف پول']].map(([k, l]) => `<option value="${k}" ${b?.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="btns"><button class="btn p" id="bGo">ذخیره</button>${b ? `<button class="btn r" id="bArc">${b.archived ? 'فعال‌سازی' : 'بایگانی'}</button>` : ''}<button class="btn g" id="bX">انصراف</button></div>`, () => {
    $('bX').onclick = closeSheet;
    $('bGo').onclick = async () => {
      const row = {name:$('bN').value.trim(), kind:$('bK').value}; if (!row.name) return toast('نام را وارد کنید');
      const r = b ? await sb.from('boxes').update(row).eq('id', b.id) : await sb.from('boxes').insert({...row, currency:$('bC').value, exchange_id:S.ex.id, sort:S.boxes.length + 1});
      if (r.error) return err(r.error); closeSheet(); toast('ذخیره شد'); refresh();
    };
    if ($('bArc')) $('bArc').onclick = async () => { await sb.from('boxes').update({archived:!b.archived}).eq('id', b.id); closeSheet(); refresh(); };
  });
}
function formInvite() {
  openSheet(`<h2>✉️ دعوت شریک یا کارمند</h2>
    <div class="fld"><label>نام</label><input class="in" id="iN"></div>
    <div class="fld"><label>ایمیل</label><input class="in" id="iE" type="email" dir="ltr"></div>
    <div class="fld"><label>نقش</label><select class="in" id="iR"><option value="staff">کارمند (فقط ثبت، بدون دیدن سود)</option><option value="partner">شریک (دسترسی کامل)</option></select></div>
    <div class="fld"><label>سهم سود شریک (٪)</label><input class="in num" id="iS" inputmode="decimal" value="0"></div>
    <div class="btns"><button class="btn p" id="iGo">ثبت دعوت</button><button class="btn g" id="iX">انصراف</button></div>
    <p class="hint">بعد از ثبت، لینک برنامه را برای او بفرستید تا با همین ایمیل ثبت‌نام کند؛ خودکار به صرافی شما وصل می‌شود.</p>`, () => {
    $('iX').onclick = closeSheet;
    $('iGo').onclick = async () => {
      const email = $('iE').value.trim().toLowerCase(); if (!email.includes('@')) return toast('ایمیل معتبر وارد کنید');
      const {error} = await sb.from('invites').insert({exchange_id:S.ex.id, email, role:$('iR').value, display_name:$('iN').value.trim() || null, share_pct:num($('iS').value) || 0});
      if (error) return err(error);
      closeSheet(); toast('دعوت ثبت شد. لینک: ' + location.href.split('#')[0]);
      navigator.clipboard?.writeText(location.href.split('#')[0]).catch(() => {}); render();
    };
  });
}
function formMember(m) {
  if (!m || m.role === 'owner') return;
  openSheet(`<h2>👔 ${esc(m.display_name || m.email)}</h2>
    <div class="fld"><label>نقش</label><select class="in" id="fmR"><option value="staff" ${m.role === 'staff' ? 'selected' : ''}>کارمند</option><option value="partner" ${m.role === 'partner' ? 'selected' : ''}>شریک</option></select></div>
    <div class="fld"><label>سهم سود (٪)</label><input class="in num" id="fmS" value="${m.share_pct || 0}" inputmode="decimal"></div>
    <div class="btns"><button class="btn p" id="fmGo">ذخیره</button><button class="btn r" id="fmDel">حذف از صرافی</button><button class="btn g" id="fmX">انصراف</button></div>`, () => {
    $('fmX').onclick = closeSheet;
    $('fmGo').onclick = async () => { const {error} = await sb.from('members').update({role:$('fmR').value, share_pct:num($('fmS').value) || 0}).eq('exchange_id', S.ex.id).eq('user_id', m.user_id); if (error) return err(error); closeSheet(); refresh(); };
    $('fmDel').onclick = async () => { const {error} = await sb.from('members').delete().eq('exchange_id', S.ex.id).eq('user_id', m.user_id); if (error) return err(error); closeSheet(); refresh(); };
  });
}

sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { S.user = null; renderAuth(); } });
boot().catch(err);
