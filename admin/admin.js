'use strict';
/* Sarrafino platform admin: exchanges, payments, plans & prices, users, ads, settings */

const sb = supabase.createClient(window.SARRAF_CONFIG.url, window.SARRAF_CONFIG.key, {global: {fetch: (u, o = {}) => fetch(u, {...o, cache: 'no-store'})}});
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (v, d = 0) => v == null || !isFinite(v) ? '—' : new Intl.NumberFormat('en-US', {maximumFractionDigits: d}).format(v);
const jd = (t, o) => t ? new Intl.DateTimeFormat(I18N.dateLocale(), o || {year: 'numeric', month: 'short', day: 'numeric'}).format(new Date(t)) : '—';
const L4 = ['fa', 'tr', 'en', 'ar'];
const FEATS = [['board', 'تابلوی نرخ و ارسال در واتس‌اپ'], ['receipts_wa', 'رسید واتس‌اپ برای مشتری'], ['expenses', 'ثبت هزینه‌ها'], ['trusts', 'امانت'],
  ['reports', 'گزارش سود و زیان'], ['excel', 'خروجی اکسل'], ['partners', 'شریک‌ها و سهم سود'], ['public_board', 'تابلوی زنده و تلویزیون مغازه'],
  ['directory', 'معرفی صرافی در ارزینو'], ['branding', 'رسید و تابلو بدون نام صرافینو']];
const LIMS = [['staff', 'کاربر'], ['customers', 'مشتری'], ['langs', 'زبان'], ['exchanges', 'صرافی / شعبه']];
const PLACES = [['banner', 'بنر بالای بازار'], ['feed', 'لابه‌لای فهرست نرخ‌ها'], ['converter', 'زیر مبدل'], ['interstitial', 'تمام‌صفحه با شمارش معکوس']];
const A = {tab: 'home', data: {}};

function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 2600); }
function err(e) { console.error(e); toast(_('خطا:') + ' ' + (e?.message || e)); }
function openSheet(html, after) { $('sheetBody').innerHTML = html; $('sheetBg').classList.add('show'); $('sheet').classList.add('show'); $('sheet').scrollTop = 0; NAV.opened('sheet', closeSheet); after && after(); }
function closeSheet() { $('sheetBg').classList.remove('show'); $('sheet').classList.remove('show'); NAV.closed('sheet'); }
$('sheetBg').onclick = closeSheet;
const tl = o => (o && (o[I18N.lang] || o.fa || o.en)) || '';
const pill = (st) => `<span class="pill ${({active: 'ok', approved: 'ok', trial: 'tr', pending: 'tr', expired: 'bad', suspended: 'bad', rejected: 'bad'})[st] || ''}">${esc(_(({active: 'فعال', trial: 'آزمایشی', expired: 'منقضی', suspended: 'متوقف', free: 'رایگان', pending: 'در انتظار تأیید', approved: 'تأیید شد', rejected: 'رد شد'})[st] || st))}</span>`;
const money = (v, c) => `${({USD: '$', EUR: '€', TRY: '₺'})[c] || (c || '') + ' '}${fmt(Number(v), 2)}`;

/* ---------------------------------------------------------------- auth */
async function boot() {
  const {data: {session}} = await sb.auth.getSession();
  if (!session) return login();
  if (!(await MFA.gate(sb, $('app'), () => boot().catch(err)))) return;
  const {data: ok} = await sb.rpc('is_platform_admin');
  if (!ok) {
    $('app').innerHTML = `<div class="auth"><div class="card center"><h2>⛔ ${_('دسترسی ندارید')}</h2><p class="muted">${_('این بخش فقط برای مدیر سامانه است.')}</p>
      <button class="btn g w" id="out">${_('خروج از حساب')}</button></div></div>`;
    $('out').onclick = async () => { await sb.auth.signOut(); location.reload(); }; return;
  }
  A.user = session.user; NAV.replace({tab: A.tab}); render();
}
NAV.fallback = '../sarraf/';
HELP.ctx = () => A.user ? 'admin.' + A.tab : 'admin.login';
NAV.onBack(st => { if (!A.user) return; A.tab = st.tab || 'home'; render(); scrollTo(0, 0); });
// buttons to every part of the system
const BASE = location.origin + location.pathname.replace(/admin\/[^/]*$/, '');
const LINKS = [['📈', 'ارزینو', BASE], ['🏪', 'پنل صرافی (صرافینو)', BASE + 'sarraf/'], ['🛒', 'صفحه‌ی فروش', BASE + 'sarrafino/'], ['📺', 'تابلوهای زنده', '#boards'],
  ['🗄', 'Supabase', 'https://supabase.com/dashboard/project/byecgsxfoiglaozubfyx'], ['🐙', 'GitHub', 'https://github.com/mehdi2044/Arzino'], ['📦', 'ساخت اپ اندروید', 'https://github.com/mehdi2044/Arzino/actions']];
function linkBar() {
  return `<div class="alinks">${LINKS.map(([i, l, u]) => u === '#boards' ? `<button class="alink" id="lnBoards">${i} ${_(l)}</button>`
    : `<a class="alink" href="${u}" ${u.startsWith(BASE) ? '' : 'target="_blank" rel="noopener"'}>${i} ${_(l)}${u.startsWith(BASE) ? '' : ' ↗'}</a>`).join('')}</div>`;
}
async function boardsSheet() {
  openSheet(`<h2>📺 ${_('تابلوهای زنده')}${HELP.btn('admin.links')}</h2><div class="boot" style="height:20vh">${_('در حال بارگذاری…')}</div>`);
  const {data: list, error} = await sb.rpc('admin_exchanges'); if (error) return err(error);
  $('sheetBody').innerHTML = `<h2>📺 ${_('تابلوهای زنده')}${HELP.btn('admin.links')}</h2><p class="hint" style="margin-top:0">${_('تابلوی زنده فقط برای صرافی‌هایی باز می‌شود که آن را روشن کرده‌اند و پلنشان اجازه می‌دهد.')}</p>
    <div class="list">${list.map(x => `<div class="row"><div class="ic">🏪</div><div class="m"><b>${esc(x.name)}</b><span>${esc(tl(x.plan?.name) || '')}</span></div>
      <a class="btn g" href="${BASE}sarraf/board.html?ex=${x.id}" target="_blank" rel="noopener" style="min-width:auto">📺</a><a class="btn g" href="${BASE}sarraf/board.html?ex=${x.id}&tv=1" target="_blank" rel="noopener" style="min-width:auto">TV</a></div>`).join('')}</div>
    <div class="btns"><button class="btn g" id="bsX">${_('بستن')}</button></div>`;
  $('bsX').onclick = closeSheet;
}
function login() {
  $('app').innerHTML = `<div class="auth"><div class="auth-lang">${NAV.btn()}<span style="flex:1"></span>${THEME.btn()}${HELP.ctxBtn()}${I18N.picker('lang-sel', true)}</div>
    <div class="hero3d"><div class="coin">⚙</div><h1>${_('پنل مدیریت')}</h1><div class="muted">Sarrafino · Arzino</div></div>
    <div class="card" style="margin-top:18px"><div class="fld"><label>${_('ایمیل')}</label><input class="in" id="lE" type="email" dir="ltr" autocomplete="email"></div>
    <div class="fld"><label>${_('رمز عبور')}</label><input class="in" id="lP" type="password" dir="ltr" autocomplete="current-password"></div>
    <button class="btn p w" id="lGo">${_('ورود')}</button></div></div>`;
  I18N.bindPickers();
  $('lGo').onclick = async () => {
    const {error} = await sb.auth.signInWithPassword({email: $('lE').value.trim(), password: $('lP').value});
    if (error) return toast(_('ایمیل یا رمز اشتباه است')); boot();
  };
}

/* ---------------------------------------------------------------- layout */
const TABS = [['home', '📊', 'خلاصه'], ['payments', '💳', 'پرداخت‌ها'], ['exchanges', '🏪', 'صرافی‌ها'], ['plans', '⭐', 'پلن‌ها و قیمت'],
  ['users', '👥', 'کاربران'], ['ads', '📣', 'تبلیغات'], ['settings', '⚙️', 'تنظیمات']];
function render() {
  $('app').innerHTML = `<div class="wrap">
    <div class="top"><div class="brand"><div class="coin">⚙</div><div><h1>${_('پنل مدیریت')}</h1><small>${esc(A.user.email)}</small></div></div>
      <div class="acts">${I18N.picker('lang-sel')}<button class="ibtn" id="aRe" title="${_('بروزرسانی')}">↻</button><button class="ibtn" id="aOut" title="${_('خروج از حساب')}">⎋</button></div></div>
    ${linkBar()}
    ${NAV.bar((TABS.find(x => x[0] === A.tab) || TABS[0])[1] + ' ' + _((TABS.find(x => x[0] === A.tab) || TABS[0])[2]))}
    <div class="atabs">${TABS.map(([k, i, l]) => `<button data-t="${k}" class="${A.tab === k ? 'on' : ''}">${i} ${_(l)}${k === 'payments' && A.pending ? `<span class="badge">${A.pending}</span>` : ''}</button>`).join('')}</div>
    <div id="view"><div class="boot" style="height:40vh">${_('در حال بارگذاری…')}</div></div></div>`;
  I18N.bindPickers();
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (b.dataset.t === A.tab) return; A.tab = b.dataset.t; NAV.push({tab: A.tab}); render(); scrollTo(0, 0); });
  $('lnBoards').onclick = boardsSheet;
  $('aRe').onclick = render;
  $('aOut').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  ({home: vHome, payments: vPayments, exchanges: vExchanges, plans: vPlans, users: vUsers, ads: vAds, settings: vSettings})[A.tab]($('view')).catch(err);
}
addEventListener('langchange', () => { closeSheet(); A.user ? render() : boot(); });

async function getPlans() { const {data, error} = await sb.from('plans').select('*').order('sort'); if (error) throw error; return data; }
async function getSetting(k) { const {data} = await sb.from('platform_settings').select('value').eq('key', k).maybeSingle(); return data?.value || {}; }
async function putSetting(k, v, vis) {
  const {error} = await sb.from('platform_settings').upsert({key: k, value: v, ...(vis ? {visibility: vis} : {}), updated_at: new Date().toISOString()});
  if (error) { err(error); return false; } toast(_('ذخیره شد')); return true;
}

/* ---------------------------------------------------------------- overview */
async function vHome(el) {
  const {data: o, error} = await sb.rpc('admin_overview'); if (error) throw error;
  A.pending = o.pending; document.querySelector('[data-t=payments]').innerHTML = `💳 ${_('پرداخت‌ها')}${o.pending ? `<span class="badge">${o.pending}</span>` : ''}`;
  const inc = Object.entries(o.income_30d || {}).map(([c, v]) => money(v, c)).join(' + ') || '0';
  el.innerHTML = `<div class="kpis">${[[_('صرافی‌ها'), fmt(o.exchanges)], [_('کاربران'), fmt(o.users) + ` <small class="muted"><bdi>+${fmt(o.users_7d)}</bdi> ${_('در ۷ روز')}</small>`],
    [_('اشتراک پولی فعال'), fmt(o.paid)], [_('در دوره‌ی آزمایشی'), fmt(o.trial)], [_('فیش در انتظار'), fmt(o.pending)], [_('درآمد ۳۰ روز'), inc], [_('تراکنش‌های ۷ روز'), fmt(o.txns_7d)]]
    .map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v">${v}</div></div>`).join('')}</div>
    <div class="card"><h3>🧭 ${_('راهنمای سریع')}</h3><ol class="muted" style="line-height:2;margin:0;padding-inline-start:20px">
      <li>${_('در «تنظیمات» اطلاعات حساب بانکی خود را برای واریز مشتری‌ها بنویسید.')}</li>
      <li>${_('در «پلن‌ها و قیمت» قیمت، سقف کاربر و مشتری و امکانات هر پلن را تعیین کنید.')}</li>
      <li>${_('وقتی فیشی رسید، در «پرداخت‌ها» آن را ببینید و تأیید کنید؛ اشتراک خودکار فعال می‌شود.')}</li>
      <li>${_('در «تبلیغات» جای نمایش، تعداد و زمان تبلیغ‌ها را تنظیم کنید و تبلیغ اسپانسرها را اضافه کنید.')}</li></ol></div>`;
}

/* ---------------------------------------------------------------- payments */
async function vPayments(el) {
  const [{data: pays, error}, plans] = await Promise.all([sb.from('payments').select('*, exchanges(name)').order('created_at', {ascending: false}).limit(200), getPlans()]);
  if (error) throw error;
  const pn = id => tl(plans.find(p => p.id === id)?.name) || id;
  const pend = pays.filter(p => p.status === 'pending');
  el.innerHTML = `<div class="card"><h3>⏳ ${_('فیش‌های در انتظار تأیید')} (${fmt(pend.length)})</h3>${pend.length ? '' : `<p class="muted">${_('موردی نیست')}</p>`}
    <div class="list">${pend.map(p => `<div class="row" data-pay="${p.id}"><div class="ic">🧾</div><div class="m"><b>${esc(p.exchanges?.name || '—')} · ${esc(pn(p.plan_id))} · ${p.months === 12 ? _('سالانه') : _('ماهانه')}</b><span>${jd(p.created_at, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}${p.payer_note ? ' · ' + esc(p.payer_note) : ''}</span></div><div class="e">${money(p.amount, p.currency)}</div></div>`).join('')}</div></div>
    <div class="card"><h3>📜 ${_('همه‌ی پرداخت‌ها')}</h3><div class="tbl-wrap"><table class="at"><thead><tr><th>${_('تاریخ')}</th><th>${_('صرافی')}</th><th>${_('پلن')}</th><th>${_('مدت')}</th><th>${_('مبلغ')}</th><th>${_('وضعیت')}</th><th>${_('توضیح')}</th></tr></thead>
    <tbody>${pays.map(p => `<tr class="click" data-pay="${p.id}"><td>${jd(p.created_at)}</td><td>${esc(p.exchanges?.name || '—')}</td><td>${esc(pn(p.plan_id))}</td><td>${p.months === 12 ? _('سالانه') : _('ماهانه')}</td><td class="n">${money(p.amount, p.currency)}</td><td>${pill(p.status)}</td><td>${esc(p.admin_note || p.payer_note || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  el.querySelectorAll('[data-pay]').forEach(r => r.onclick = () => payDetail(pays.find(p => p.id === r.dataset.pay), pn));
}
async function payDetail(p, pn) {
  let url = '';
  if (p.receipt_path) { const {data} = await sb.storage.from('receipts').createSignedUrl(p.receipt_path, 900); url = data?.signedUrl || ''; }
  const isPdf = /\.pdf$/i.test(p.receipt_path || '');
  openSheet(`<h2>🧾 ${esc(p.exchanges?.name || '')} · ${money(p.amount, p.currency)}</h2>
    <p>${esc(pn(p.plan_id))} · ${p.months === 12 ? _('سالانه') : _('ماهانه')} · ${jd(p.created_at, {dateStyle: 'medium', timeStyle: 'short'})} · ${pill(p.status)}</p>
    ${p.payer_note ? `<p class="muted">${_('توضیح مشتری:')} ${esc(p.payer_note)}</p>` : ''}
    ${url ? (isPdf ? `<a class="btn g" href="${url}" target="_blank" rel="noopener">📄 ${_('باز کردن فیش (PDF)')}</a>` : `<a href="${url}" target="_blank" rel="noopener"><img class="rcpt" src="${url}" alt=""></a>`) : `<p class="muted">${_('فیشی پیوست نشده')}</p>`}
    ${p.status === 'pending' ? `<div class="fld"><label>${_('یادداشت برای مشتری (اختیاری)')}</label><input class="in" id="pyN"></div>
      <div class="btns"><button class="btn p" id="pyOk">✅ ${_('تأیید و فعال‌سازی')}</button><button class="btn r" id="pyNo">❌ ${_('رد')}</button><button class="btn g" id="pyX">${_('بستن')}</button></div>
      <p class="hint">${_('با تأیید، اشتراک این صرافی به اندازه‌ی مدت پرداخت‌شده تمدید یا فعال می‌شود.')}</p>`
      : `<div class="btns"><button class="btn g" id="pyX">${_('بستن')}</button></div>`}`, () => {
    $('pyX').onclick = closeSheet;
    const act = async ok => { const {error} = await sb.rpc('admin_review_payment', {p_id: p.id, p_approve: ok, p_note: $('pyN').value.trim() || null}); if (error) return err(error); closeSheet(); toast(ok ? _('تأیید شد') : _('رد شد')); render(); };
    if ($('pyOk')) { $('pyOk').onclick = () => act(true); $('pyNo').onclick = () => act(false); }
  });
}

/* ---------------------------------------------------------------- exchanges */
async function vExchanges(el) {
  const [{data: list, error}, plans] = await Promise.all([sb.rpc('admin_exchanges'), getPlans()]); if (error) throw error;
  el.innerHTML = `<div class="card"><h3>🏪 ${_('صرافی‌ها')} (${fmt(list.length)}) <input class="in" id="exQ" placeholder="${_('جستجو')}" style="max-width:220px"></h3>
    <div class="tbl-wrap"><table class="at"><thead><tr><th>${_('صرافی')}</th><th>${_('مالک')}</th><th>${_('پلن')}</th><th>${_('وضعیت')}</th><th>${_('اعتبار تا')}</th><th>${_('کاربر')}</th><th>${_('مشتری')}</th><th>${_('تراکنش')}</th><th>${_('آخرین فعالیت')}</th></tr></thead>
    <tbody id="exB"></tbody></table></div></div>`;
  const draw = q => { $('exB').innerHTML = list.filter(x => !q || JSON.stringify([x.name, x.owner]).toLowerCase().includes(q)).map(x => `<tr class="click" data-ex="${x.id}">
    <td><b>${esc(x.name)}</b><div class="mini">${jd(x.created_at)}</div></td><td>${esc(x.owner?.name || '')}<div class="mini" dir="ltr">${esc(x.owner?.email || '')}<br>${esc(x.owner?.phone || '')}</div></td>
    <td>${esc(tl(x.plan?.name) || x.plan?.plan)}</td><td>${pill(x.plan?.status)}</td><td>${jd(x.sub?.period_end)}</td>
    <td class="n"><span dir="ltr">${fmt(x.staff)} / ${fmt(x.plan?.limits?.staff)}</span></td><td class="n"><span dir="ltr">${fmt(x.customers)} / ${fmt(x.plan?.limits?.customers)}</span></td><td class="n">${fmt(x.txns)}</td><td>${jd(x.last_txn)}</td></tr>`).join('');
    $('exB').querySelectorAll('[data-ex]').forEach(r => r.onclick = () => exDetail(list.find(x => x.id === r.dataset.ex), plans)); };
  $('exQ').oninput = e => draw(e.target.value.trim().toLowerCase()); draw('');
}
function exDetail(x, plans) {
  const s = x.sub || {}, ov = s.overrides || {}, ovf = ov.features || {}, ovl = ov.limits || {};
  const end = s.period_end ? new Date(s.period_end).toISOString().slice(0, 10) : '';
  openSheet(`<h2>🏪 ${esc(x.name)}</h2>
    <p class="muted">${esc(x.owner?.name || '')} · <span dir="ltr">${esc(x.owner?.email || '')} ${esc(x.owner?.phone || '')}</span> · ${esc(x.owner?.country || '')}</p>
    <div class="g4"><div class="fld"><label>${_('پلن')}</label><select class="in" id="xP">${plans.map(p => `<option value="${p.id}" ${p.id === (s.plan_id || x.plan?.plan) ? 'selected' : ''}>${esc(tl(p.name))}</option>`).join('')}</select></div>
      <div class="fld"><label>${_('وضعیت')}</label><select class="in" id="xS">${['trial', 'active', 'suspended'].map(k => `<option value="${k}" ${k === (s.status || 'trial') ? 'selected' : ''}>${_(({trial: 'آزمایشی', active: 'فعال', suspended: 'متوقف'})[k])}</option>`).join('')}</select></div>
      <div class="fld"><label>${_('اعتبار تا')}</label><input class="in" id="xE" type="date" value="${end}" dir="ltr"></div></div>
    <div class="btns"><button class="btn g" data-add="1">+1 ${_('ماه')}</button><button class="btn g" data-add="12">+1 ${_('سال')}</button></div>
    <div class="sec">🎛 ${_('بسته‌ی اختصاصی این صرافی (خالی = طبق پلن)')}</div>
    <div class="g4">${LIMS.map(([k, l]) => `<div class="fld"><label>${_(l)} <span class="mini">(${_('پلن:')} ${fmt(plans.find(p => p.id === (s.plan_id || x.plan?.plan))?.limits?.[k])})</span></label><input class="in num" data-ol="${k}" inputmode="numeric" value="${ovl[k] ?? ''}"></div>`).join('')}</div>
    <div class="ftable">${FEATS.map(([k, l]) => `<span>${_(l)}</span><select class="in" data-of="${k}"><option value="">${_('طبق پلن')}</option><option value="1" ${ovf[k] === true ? 'selected' : ''}>${_('روشن')}</option><option value="0" ${ovf[k] === false ? 'selected' : ''}>${_('خاموش')}</option></select>`).join('')}</div>
    <div class="fld" style="margin-top:10px"><label>${_('یادداشت')}</label><input class="in" id="xN" value="${esc(s.note || '')}"></div>
    <div class="btns"><button class="btn p" id="xGo">${_('ذخیره')}</button><button class="btn g" id="xX">${_('بستن')}</button></div>`, () => {
    $('xX').onclick = closeSheet;
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const base = $('xE').value && new Date($('xE').value) > new Date() ? new Date($('xE').value) : new Date();
      base.setMonth(base.getMonth() + Number(b.dataset.add)); $('xE').value = base.toISOString().slice(0, 10); $('xS').value = 'active';
    });
    $('xGo').onclick = async () => {
      const limits = {}, features = {};
      document.querySelectorAll('[data-ol]').forEach(i => { if (i.value.trim() !== '') limits[i.dataset.ol] = Number(i.value); });
      document.querySelectorAll('[data-of]').forEach(i => { if (i.value !== '') features[i.dataset.of] = i.value === '1'; });
      const {error} = await sb.rpc('admin_set_subscription', {p_ex: x.id, p_plan: $('xP').value, p_status: $('xS').value,
        p_end: $('xE').value ? new Date($('xE').value + 'T23:59:59').toISOString() : null, p_overrides: {limits, features}, p_note: $('xN').value.trim() || null});
      if (error) return err(error); closeSheet(); toast(_('ذخیره شد')); render();
    };
  });
}

/* ---------------------------------------------------------------- plans & prices */
async function vPlans(el) {
  const plans = await getPlans();
  el.innerHTML = `<div class="card"><h3>⭐ ${_('پلن‌ها و قیمت')} <button class="btn p" id="plNew" style="min-width:auto">+ ${_('پلن جدید')}</button></h3>
    <p class="hint" style="margin-top:0">${_('هر پلن: قیمت ماهانه و سالانه، سقف کاربر، مشتری، زبان و شعبه، و امکاناتی که دارد. صفحه‌ی فروش و برنامه همین‌ها را نشان می‌دهند.')}</p>
    <div class="tbl-wrap"><table class="at"><thead><tr><th>${_('پلن')}</th><th>${_('ماهانه')}</th><th>${_('سالانه')}</th>${LIMS.map(([, l]) => `<th>${_(l)}</th>`).join('')}<th>${_('امکانات')}</th><th>${_('نمایش')}</th></tr></thead>
    <tbody>${plans.map(p => `<tr class="click" data-pl="${p.id}"><td><b>${esc(tl(p.name))}</b> ${p.highlight ? '⭐' : ''}<div class="mini" dir="ltr">${esc(p.id)}</div></td><td class="n">${money(p.price_month, p.currency)}</td><td class="n">${money(p.price_year, p.currency)}</td>
      ${LIMS.map(([k]) => `<td class="n">${fmt(p.limits?.[k])}</td>`).join('')}<td>${fmt(FEATS.filter(([k]) => p.features?.[k]).length)} / ${FEATS.length}</td><td>${p.is_public ? '✅' : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  $('plNew').onclick = () => planForm(null, plans);
  el.querySelectorAll('[data-pl]').forEach(r => r.onclick = () => planForm(plans.find(p => p.id === r.dataset.pl), plans));
}
function planForm(p, plans) {
  p = p || {id: '', name: {}, description: {}, price_month: 0, price_year: 0, currency: 'USD', limits: {staff: 1, customers: 50, langs: 1, exchanges: 1}, features: {}, is_public: true, highlight: false, sort: plans.length + 1};
  openSheet(`<h2>⭐ ${p.id ? esc(tl(p.name)) : _('پلن جدید')}</h2>
    <div class="g4"><div class="fld"><label>${_('شناسه (انگلیسی، بدون فاصله)')}</label><input class="in" id="pId" dir="ltr" value="${esc(p.id)}" ${p.id ? 'disabled' : ''}></div>
      <div class="fld"><label>${_('قیمت ماهانه')}</label><input class="in num" id="pM" inputmode="decimal" value="${p.price_month}"></div>
      <div class="fld"><label>${_('قیمت سالانه')}</label><input class="in num" id="pY" inputmode="decimal" value="${p.price_year}"></div>
      <div class="fld"><label>${_('ارز')}</label><select class="in" id="pC">${['USD', 'EUR', 'TRY', 'USDT'].map(c => `<option ${c === p.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
    <div class="sec">🏷 ${_('نام و توضیح در هر زبان')}</div>
    <div class="g4">${L4.map(l => `<div class="fld"><label>${I18N.LANGS[l].name}</label><input class="in" data-pn="${l}" value="${esc(p.name?.[l] || '')}" dir="${I18N.LANGS[l].dir}"><input class="in" data-pd="${l}" value="${esc(p.description?.[l] || '')}" dir="${I18N.LANGS[l].dir}" placeholder="${_('توضیح کوتاه')}" style="margin-top:6px"></div>`).join('')}</div>
    <div class="sec">📏 ${_('سقف‌ها')}</div>
    <div class="g4">${LIMS.map(([k, l]) => `<div class="fld"><label>${_(l)}</label><input class="in num" data-plim="${k}" inputmode="numeric" value="${p.limits?.[k] ?? ''}"></div>`).join('')}</div>
    <div class="sec">✅ ${_('امکانات')}</div>
    <div class="langs">${FEATS.map(([k, l]) => `<label class="chk"><input type="checkbox" data-pf="${k}" ${p.features?.[k] ? 'checked' : ''}> ${_(l)}</label>`).join('')}</div>
    <div class="langs"><label class="chk"><input type="checkbox" id="pPub" ${p.is_public ? 'checked' : ''}> ${_('در صفحه‌ی فروش و برنامه نمایش داده شود')}</label>
      <label class="chk"><input type="checkbox" id="pHl" ${p.highlight ? 'checked' : ''}> ${_('پیشنهادی (برجسته)')}</label>
      <label class="chk">${_('ترتیب')} <input class="in num" id="pS" value="${p.sort}" style="width:70px"></label></div>
    <div class="btns"><button class="btn p" id="pGo">${_('ذخیره')}</button><button class="btn g" id="pX">${_('بستن')}</button></div>`, () => {
    $('pX').onclick = closeSheet;
    $('pGo').onclick = async () => {
      const id = $('pId').value.trim().toLowerCase(); if (!/^[a-z0-9_-]{2,}$/.test(id)) return toast(_('شناسه‌ی معتبر وارد کنید'));
      const row = {id, currency: $('pC').value, price_month: Number($('pM').value) || 0, price_year: Number($('pY').value) || 0, is_public: $('pPub').checked, highlight: $('pHl').checked, sort: Number($('pS').value) || 0,
        name: {}, description: {}, limits: {}, features: {}, updated_at: new Date().toISOString()};
      document.querySelectorAll('[data-pn]').forEach(i => { if (i.value.trim()) row.name[i.dataset.pn] = i.value.trim(); });
      document.querySelectorAll('[data-pd]').forEach(i => { if (i.value.trim()) row.description[i.dataset.pd] = i.value.trim(); });
      document.querySelectorAll('[data-plim]').forEach(i => { if (i.value.trim() !== '') row.limits[i.dataset.plim] = Number(i.value); });
      document.querySelectorAll('[data-pf]').forEach(i => row.features[i.dataset.pf] = i.checked);
      if (!row.name.fa && !row.name.en) return toast(_('نام پلن را وارد کنید'));
      const {error} = await sb.from('plans').upsert(row); if (error) return err(error); closeSheet(); toast(_('ذخیره شد')); render();
    };
  });
}

/* ---------------------------------------------------------------- users */
async function vUsers(el) {
  const {data: list, error} = await sb.rpc('admin_users'); if (error) throw error;
  el.innerHTML = `<div class="card"><h3>👥 ${_('کاربران')} (${fmt(list.length)}) <span><input class="in" id="uQ" placeholder="${_('جستجو')}" style="max-width:200px"> <button class="btn g" id="uX" style="min-width:auto">📊 Excel</button></span></h3>
    <div class="tbl-wrap"><table class="at"><thead><tr><th>${_('نام')}</th><th>${_('ایمیل')}</th><th>${_('تلفن')}</th><th>${_('کشور')}</th><th>${_('ثبت‌نام')}</th><th>${_('آخرین ورود')}</th><th>${_('صرافی‌ها')}</th><th></th></tr></thead><tbody id="uB"></tbody></table></div></div>`;
  let dn; try { dn = new Intl.DisplayNames([I18N.lang], {type: 'region'}); } catch { dn = {of: c => c}; }
  const cn = c => { try { return c ? dn.of(c) : ''; } catch { return c; } };
  const draw = q => { $('uB').innerHTML = list.filter(u => !q || JSON.stringify(u).toLowerCase().includes(q)).map(u => `<tr><td>${esc([u.first_name, u.last_name].filter(Boolean).join(' '))}</td><td dir="ltr">${esc(u.email)} ${u.confirmed ? '' : '⏳'}</td><td dir="ltr">${esc(u.phone || '')}</td><td>${esc(cn(u.country))}</td>
    <td>${jd(u.created_at)}</td><td>${jd(u.last_sign_in_at)}</td><td>${(u.exchanges || []).map(e => esc(e.name) + ' <span class="mini">(' + esc(e.role) + ')</span>').join('<br>')}</td>
    <td>${u.is_admin ? '<span class="pill ok">admin</span>' : ''} ${u.mfa ? `<span class="pill ok" title="${_('ورود دو مرحله‌ای')}">🔐 2FA</span> <button class="btn g" data-mfa="${u.id}" style="min-width:auto;padding:4px 8px;font-size:12px">${_('بازنشانی 2FA')}</button>` : ''}</td></tr>`).join('');
    $('uB').querySelectorAll('[data-mfa]').forEach(b => b.onclick = async () => {
      if (!confirm(_('ورود دو مرحله‌ای این کاربر خاموش شود؟ (برای وقتی که گوشی‌اش را گم کرده)'))) return;
      const {error} = await sb.rpc('admin_reset_mfa', {p_user: b.dataset.mfa}); if (error) return err(error); toast(_('بازنشانی شد')); render(); }); };
  $('uQ').oninput = e => draw(e.target.value.trim().toLowerCase()); draw('');
  $('uX').onclick = () => {
    if (!window.XLSX) return toast('…');
    const rows = [['first_name', 'last_name', 'email', 'phone', 'country', 'created_at', 'last_sign_in_at', 'exchanges']].concat(list.map(u => [u.first_name, u.last_name, u.email, u.phone, u.country, u.created_at, u.last_sign_in_at, (u.exchanges || []).map(e => e.name).join(', ')]));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'users'); XLSX.writeFile(wb, `users-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
}

/* ---------------------------------------------------------------- ads */
async function vAds(el) {
  const [cfg, {data: ads, error}] = await Promise.all([getSetting('ads'), sb.from('house_ads').select('*').order('created_at', {ascending: false})]);
  if (error) throw error;
  const c = {adsense: {}, banner: {}, feed: {}, converter: {}, interstitial: {}, reward: {}, ...cfg};
  const n = (id, v, w = 80) => `<input class="in num" id="${id}" value="${v ?? ''}" inputmode="numeric" style="width:${w}px">`;
  const ck = (id, v) => `<input type="checkbox" id="${id}" ${v ? 'checked' : ''}>`;
  el.innerHTML = `<div class="card"><h3>📣 ${_('تنظیمات نمایش تبلیغ در ارزینو')}</h3>
    <div class="langs"><label class="chk">${ck('aOn', c.enabled)} ${_('تبلیغات روشن باشد')}</label><label class="chk">${ck('aFree', c.adfree_for_subscribers)} ${_('مشترکان پولی صرافینو تبلیغ نبینند')}</label></div>
    <div class="sec">📍 ${_('جای نمایش')}</div>
    <div class="ftable">
      <span>${_('بنر بالای بازار')}</span><span>${ck('aBan', c.banner.on)}</span>
      <span>${_('لابه‌لای فهرست نرخ‌ها، هر چند ردیف یک تبلیغ')}</span><span>${ck('aFeed', c.feed.on)} ${n('aFeedN', c.feed.every, 60)}</span>
      <span>${_('زیر نتیجه‌ی مبدل')}</span><span>${ck('aConv', c.converter.on)}</span></div>
    <div class="sec">⏱ ${_('تبلیغ تمام‌صفحه (فقط تبلیغ خودتان و اسپانسرها)')}</div>
    <div class="ftable">
      <span>${_('روشن')}</span><span>${ck('aInt', c.interstitial.on)}</span>
      <span>${_('بعد از چند کار کاربر (عوض کردن تب، باز کردن نمودار، تبدیل ارز)')}</span><span>${n('aIA', c.interstitial.after_actions)}</span>
      <span>${_('از چندمین بار باز کردن برنامه شروع شود')}</span><span>${n('aIO', c.interstitial.first_after_opens)}</span>
      <span>${_('حداقل فاصله بین دو تبلیغ (دقیقه)')}</span><span>${n('aIM', c.interstitial.min_minutes)}</span>
      <span>${_('چند ثانیه اجباری قبل از دکمه‌ی رد شدن')}</span><span>${n('aIC', c.interstitial.countdown)}</span>
      <span>${_('حداکثر در روز برای هر کاربر')}</span><span>${n('aID', c.interstitial.max_per_day)}</span></div>
    <div class="sec">🎁 ${_('دیدن تبلیغ در ازای حذف تبلیغات')}</div>
    <div class="ftable"><span>${_('روشن')}</span><span>${ck('aRw', c.reward.on)}</span>
      <span>${_('چند ساعت بدون تبلیغ')}</span><span>${n('aRH', c.reward.hours)}</span><span>${_('چند ثانیه دیدن')}</span><span>${n('aRC', c.reward.countdown)}</span></div>
    <div class="sec">🅖 Google AdSense</div>
    <p class="hint" style="margin-top:0">${_('AdSense فقط وقتی زبان برنامه ترکی، انگلیسی یا عربی است نمایش داده می‌شود؛ فارسی جزو زبان‌های مجاز گوگل نیست و آنجا تبلیغ خودتان پخش می‌شود. برای فعال شدن، دامنه‌ی خودتان و تأیید حساب AdSense لازم است.')}</p>
    <div class="g4"><div class="fld"><label>Publisher ID (ca-pub-…)</label><input class="in" id="gC" dir="ltr" value="${esc(c.adsense.client || '')}"></div>
      <div class="fld"><label>Slot ${_('بنر')}</label><input class="in" id="gB" dir="ltr" value="${esc(c.adsense.slot_banner || '')}"></div>
      <div class="fld"><label>Slot ${_('لابه‌لای فهرست')}</label><input class="in" id="gF" dir="ltr" value="${esc(c.adsense.slot_feed || '')}"></div></div>
    <div class="btns"><button class="btn p" id="aSave">${_('ذخیره')}</button></div></div>
    <div class="card"><h3>🖼 ${_('تبلیغ‌های خودتان و اسپانسرها')} <button class="btn p" id="adNew" style="min-width:auto">+ ${_('تبلیغ جدید')}</button></h3>
      <div class="tbl-wrap"><table class="at"><thead><tr><th>${_('تبلیغ')}</th><th>${_('تبلیغ‌دهنده')}</th><th>${_('جای نمایش')}</th><th>${_('نمایش')}</th><th>${_('کلیک')}</th><th>CTR</th><th>${_('وضعیت')}</th></tr></thead>
      <tbody>${ads.map(a => `<tr class="click" data-ad="${a.id}"><td><b>${esc(tl(a.title))}</b><div class="mini">${a.ends_at ? _('تا') + ' ' + jd(a.ends_at) : ''}</div></td><td>${esc(a.advertiser || '')}</td><td>${(a.placements || []).map(p => _(PLACES.find(x => x[0] === p)?.[1] || p)).join('، ')}</td>
        <td class="n">${fmt(a.impressions)}</td><td class="n">${fmt(a.clicks)}</td><td class="n">${a.impressions ? fmt(a.clicks / a.impressions * 100, 2) + '%' : '—'}</td><td>${a.active ? pill('active') : pill('suspended')}</td></tr>`).join('')}</tbody></table></div></div>`;
  $('aSave').onclick = () => {
    const v = id => Number($(id).value) || 0;
    putSetting('ads', {...cfg, enabled: $('aOn').checked, adfree_for_subscribers: $('aFree').checked,
      adsense: {...c.adsense, client: $('gC').value.trim(), slot_banner: $('gB').value.trim(), slot_feed: $('gF').value.trim(), langs: c.adsense.langs || ['tr', 'en', 'ar']},
      banner: {on: $('aBan').checked}, feed: {on: $('aFeed').checked, every: Math.max(3, v('aFeedN'))}, converter: {on: $('aConv').checked},
      interstitial: {on: $('aInt').checked, after_actions: Math.max(1, v('aIA')), first_after_opens: v('aIO'), min_minutes: v('aIM'), countdown: Math.min(30, v('aIC')), max_per_day: v('aID')},
      reward: {on: $('aRw').checked, hours: Math.max(1, v('aRH')), countdown: Math.min(60, v('aRC'))}}, 'public');
  };
  $('adNew').onclick = () => adForm(null);
  el.querySelectorAll('[data-ad]').forEach(r => r.onclick = () => adForm(ads.find(a => a.id === r.dataset.ad)));
}
function adForm(a) {
  a = a || {title: {}, body: {}, cta: {}, placements: ['banner', 'feed', 'interstitial'], weight: 1, active: true, langs: null};
  const d = t => t ? new Date(t).toISOString().slice(0, 10) : '';
  openSheet(`<h2>🖼 ${a.id ? esc(tl(a.title)) : _('تبلیغ جدید')}</h2>
    <div class="g4"><div class="fld"><label>${_('تبلیغ‌دهنده')}</label><input class="in" id="adA" value="${esc(a.advertiser || '')}"></div>
      <div class="fld"><label>${_('لینک')}</label><input class="in" id="adL" dir="ltr" value="${esc(a.link || '')}" placeholder="https://… / wa.me/…"></div>
      <div class="fld"><label>${_('از تاریخ')}</label><input class="in" id="adS" type="date" value="${d(a.starts_at)}"></div>
      <div class="fld"><label>${_('تا تاریخ')}</label><input class="in" id="adE" type="date" value="${d(a.ends_at)}"></div></div>
    <div class="sec">✍️ ${_('متن در هر زبان (خالی = در آن زبان نمایش داده نشود)')}</div>
    <div class="g4">${L4.map(l => `<div class="fld"><label>${I18N.LANGS[l].name}</label><input class="in" data-at="${l}" dir="${I18N.LANGS[l].dir}" value="${esc(a.title?.[l] || '')}" placeholder="${_('عنوان')}">
      <textarea class="in" data-ab="${l}" dir="${I18N.LANGS[l].dir}" placeholder="${_('متن')}" style="margin-top:6px;min-height:60px">${esc(a.body?.[l] || '')}</textarea>
      <input class="in" data-ac="${l}" dir="${I18N.LANGS[l].dir}" value="${esc(a.cta?.[l] || '')}" placeholder="${_('متن دکمه')}" style="margin-top:6px"></div>`).join('')}</div>
    <div class="sec">🖼 ${_('تصویر (اختیاری)')}</div>
    <div class="pair"><input class="in" id="adI" dir="ltr" value="${esc(a.image && !a.image.startsWith('data:') ? a.image : '')}" placeholder="https://…"><input type="file" id="adF" accept="image/*" class="in" style="max-width:220px"></div>
    <div id="adPrev" class="adprev" style="margin-top:8px">${a.image ? `<img src="${esc(a.image)}" style="max-width:100%;max-height:160px;border-radius:10px">` : ''}</div>
    <div class="sec">📍 ${_('جای نمایش')}</div>
    <div class="langs">${PLACES.map(([k, l]) => `<label class="chk"><input type="checkbox" data-ap="${k}" ${(a.placements || []).includes(k) ? 'checked' : ''}> ${_(l)}</label>`).join('')}</div>
    <div class="langs"><label class="chk">${_('وزن (سهم نمایش)')} <input class="in num" id="adW" value="${a.weight}" style="width:70px"></label><label class="chk"><input type="checkbox" id="adOn" ${a.active ? 'checked' : ''}> ${_('فعال')}</label></div>
    <div class="btns"><button class="btn p" id="adGo">${_('ذخیره')}</button>${a.id ? `<button class="btn r" id="adDel">${_('حذف')}</button>` : ''}<button class="btn g" id="adX">${_('بستن')}</button></div>`, () => {
    let img = a.image || '';
    $('adX').onclick = closeSheet;
    $('adI').oninput = () => { img = $('adI').value.trim(); $('adPrev').innerHTML = img ? `<img src="${esc(img)}" style="max-width:100%;max-height:160px;border-radius:10px">` : ''; };
    $('adF').onchange = async () => { const f = $('adF').files[0]; if (!f) return; img = await shrinkToDataUrl(f, 900); $('adI').value = ''; $('adPrev').innerHTML = `<img src="${img}" style="max-width:100%;max-height:160px;border-radius:10px">`; };
    $('adGo').onclick = async () => {
      const row = {advertiser: $('adA').value.trim() || null, link: $('adL').value.trim() || null, image: img || null, weight: Math.max(1, Number($('adW').value) || 1), active: $('adOn').checked,
        starts_at: $('adS').value ? new Date($('adS').value).toISOString() : null, ends_at: $('adE').value ? new Date($('adE').value + 'T23:59:59').toISOString() : null,
        title: {}, body: {}, cta: {}, placements: [...document.querySelectorAll('[data-ap]')].filter(i => i.checked).map(i => i.dataset.ap)};
      document.querySelectorAll('[data-at]').forEach(i => { if (i.value.trim()) row.title[i.dataset.at] = i.value.trim(); });
      document.querySelectorAll('[data-ab]').forEach(i => { if (i.value.trim()) row.body[i.dataset.ab] = i.value.trim(); });
      document.querySelectorAll('[data-ac]').forEach(i => { if (i.value.trim()) row.cta[i.dataset.ac] = i.value.trim(); });
      if (!Object.keys(row.title).length) return toast(_('عنوان را دست‌کم در یک زبان بنویسید'));
      row.langs = Object.keys(row.title);
      const r = a.id ? await sb.from('house_ads').update(row).eq('id', a.id) : await sb.from('house_ads').insert(row);
      if (r.error) return err(r.error); closeSheet(); toast(_('ذخیره شد')); render();
    };
    if ($('adDel')) $('adDel').onclick = async () => { if (!confirm(_('این تبلیغ حذف شود؟'))) return; const {error} = await sb.from('house_ads').delete().eq('id', a.id); if (error) return err(error); closeSheet(); render(); };
  });
}
function shrinkToDataUrl(file, max) {
  return new Promise(ok => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .8)); }; img.src = URL.createObjectURL(file); });
}

/* ---------------------------------------------------------------- settings */
async function vSettings(el) {
  const [pay, trial, free, contact, plans] = await Promise.all([getSetting('payment'), getSetting('trial'), getSetting('free_plan'), getSetting('contact'), getPlans()]);
  const popt = sel => plans.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(tl(p.name))}</option>`).join('');
  el.innerHTML = MFA.card('admin.security') + `<div class="card"><h3>🏦 ${_('اطلاعات واریز (برای مشتری‌ها نمایش داده می‌شود)')}</h3>
    <p class="hint" style="margin-top:0">${_('شماره حساب، IBAN، نام صاحب حساب، آدرس کیف پول تتر یا هر روش دیگری که می‌خواهید. هر زبان جدا؛ اگر خالی باشد متن فارسی نمایش داده می‌شود.')}</p>
    <div class="g4">${L4.map(l => `<div class="fld"><label>${I18N.LANGS[l].name}</label><textarea class="in" data-bk="${l}" dir="ltr">${esc(pay.bank?.[l] || '')}</textarea></div>`).join('')}</div>
    <div class="sec">📝 ${_('راهنمای زیر اطلاعات واریز')}</div>
    <div class="g4">${L4.map(l => `<div class="fld"><label>${I18N.LANGS[l].name}</label><textarea class="in" data-bn="${l}" dir="${I18N.LANGS[l].dir}">${esc(pay.note?.[l] || '')}</textarea></div>`).join('')}</div>
    <div class="btns"><button class="btn p" id="sPay">${_('ذخیره')}</button></div></div>
    <div class="card"><h3>🎁 ${_('دوره‌ی آزمایشی و پلن رایگان')}</h3>
      <div class="g4"><div class="fld"><label>${_('پلن آزمایشی صرافی‌های جدید')}</label><select class="in" id="sTP">${popt(trial.plan || 'pro')}</select></div>
        <div class="fld"><label>${_('چند روز آزمایشی (۰ = بدون آزمایش)')}</label><input class="in num" id="sTD" value="${trial.days ?? 14}"></div>
        <div class="fld"><label>${_('پلن بعد از پایان اشتراک')}</label><select class="in" id="sFP">${popt(free.plan || 'free')}</select></div></div>
      <div class="btns"><button class="btn p" id="sTr">${_('ذخیره')}</button></div></div>
    <div class="card"><h3>📞 ${_('تماس و پشتیبانی (در صفحه‌ی فروش)')}</h3>
      <div class="g4"><div class="fld"><label>${_('واتس‌اپ پشتیبانی')}</label><input class="in" id="sW" dir="ltr" value="${esc(contact.whatsapp || '')}" placeholder="+90…"></div>
        <div class="fld"><label>${_('ایمیل پشتیبانی')}</label><input class="in" id="sE" dir="ltr" value="${esc(contact.email || '')}"></div>
        <div class="fld"><label>${_('نام برند')}</label><input class="in" id="sBr" value="${esc(contact.brand || 'Sarrafino')}"></div></div>
      <div class="btns"><button class="btn p" id="sCt">${_('ذخیره')}</button></div></div>`;
  $('sPay').onclick = () => { const bank = {}, note = {}; document.querySelectorAll('[data-bk]').forEach(i => bank[i.dataset.bk] = i.value.trim()); document.querySelectorAll('[data-bn]').forEach(i => note[i.dataset.bn] = i.value.trim()); putSetting('payment', {...pay, bank, note}, 'users'); };
  $('sTr').onclick = async () => { if (await putSetting('trial', {plan: $('sTP').value, days: Number($('sTD').value) || 0}, 'public')) putSetting('free_plan', {plan: $('sFP').value}, 'public'); };
  MFA.bindCard(sb);
  $('sCt').onclick = () => putSetting('contact', {whatsapp: $('sW').value.trim(), email: $('sE').value.trim(), brand: $('sBr').value.trim() || 'Sarrafino'}, 'public');
}

boot().catch(err);
