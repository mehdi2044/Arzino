'use strict';
/* Sarrafino plans: feature gates, limits, upgrade + bank-transfer payment with receipt, signup countries */

const FEATS = [
  ['board', 'تابلوی نرخ و ارسال در واتس‌اپ'], ['receipts_wa', 'رسید واتس‌اپ برای مشتری'], ['expenses', 'ثبت هزینه‌ها'],
  ['trusts', 'امانت'], ['reports', 'گزارش سود و زیان'], ['excel', 'خروجی اکسل'], ['partners', 'شریک‌ها و سهم سود'],
  ['public_board', 'تابلوی زنده و تلویزیون مغازه'], ['directory', 'معرفی صرافی در ارزینو'], ['branding', 'رسید و تابلو بدون نام صرافینو'],
];
const LIMS = [['staff', 'کاربر'], ['customers', 'مشتری'], ['langs', 'زبان'], ['exchanges', 'صرافی / شعبه']];
const ALL_LANGS = ['fa', 'tr', 'en', 'ar'];

const feat = k => !!S.plan?.features?.[k];
const lim = k => Number(S.plan?.limits?.[k] ?? 1e9);
const planTitle = p => (p?.name && (p.name[I18N.lang] || p.name.en || p.name.fa)) || '';
const daysLeft = () => S.plan?.period_end ? Math.ceil((new Date(S.plan.period_end) - Date.now()) / 864e5) : null;
const customerCount = () => S.customers.filter(c => !c.is_walkin).length;

async function loadPlan() {
  const {data, error} = await sb.rpc('ex_plan', {p_ex: S.ex.id});
  if (error) { console.warn(error); S.plan = {features: {}, limits: {}, status: 'free'}; return; }
  S.plan = data;
  // paying exchanges see Arzino without ads (same site, same browser)
  try {
    if (S.plan.status === 'active' && S.plan.period_end) localStorage.setItem('arzino.adfree_until', String(new Date(S.plan.period_end).getTime()));
  } catch {}
}

// languages this exchange may use; the owner picks which ones when the plan allows fewer than four
function allowedLangs() {
  const n = Math.max(1, Math.min(4, lim('langs')));
  const chosen = (S.ex?.settings?.langs || []).filter(l => ALL_LANGS.includes(l));
  const list = [...chosen, ...(chosen.length ? [] : [I18N.lang]), ...ALL_LANGS].filter((l, i, a) => a.indexOf(l) === i);
  return list.slice(0, n);
}
function applyLangLimit(root = document) {
  if (!S.ex || !S.plan) return false;
  const ok = allowedLangs();
  root.querySelectorAll('.top select.lang-sel option').forEach(o => { if (!ok.includes(o.value)) o.remove(); });
  if (!ok.includes(I18N.lang)) { I18N.set(ok[0]); return true; }
  return false;
}

/* ---------- upgrade prompts ---------- */
function upsell(what) {
  const f = FEATS.find(x => x[0] === what), l = LIMS.find(x => x[0] === what);
  const msg = f ? _('«{f}» در پلن فعلی شما نیست.', {f: _(f[1])})
    : l ? _('به سقف {l} در پلن فعلی رسیده‌اید ({n}).', {l: _(l[1]), n: fmt(lim(what), 0)}) : _('این امکان در پلن فعلی شما نیست.');
  openSheet(`<div class="center"><div style="font-size:46px">🚀</div><h2>${msg}</h2>
    <p class="muted">${_('با ارتقای پلن، این امکان بلافاصله بعد از تأیید پرداخت فعال می‌شود.')}</p>
    <div class="btns" style="justify-content:center">${isMgr() ? `<button class="btn p" id="upGo">⭐ ${_('دیدن پلن‌ها')}</button>` : ''}<button class="btn g" id="upX">${_('بستن')}</button></div>
    ${isMgr() ? '' : `<p class="hint">${_('برای ارتقا به مالک صرافی بگویید.')}</p>`}</div>`, () => {
    $('upX').onclick = closeSheet; if ($('upGo')) $('upGo').onclick = () => { closeSheet(); planSheet(); };
  });
}
function lockedCard(what, title) {
  return `<div class="card center locked"><div style="font-size:42px">🔒</div><h3 style="justify-content:center">${title}</h3>
    <p class="muted">${_('«{f}» در پلن فعلی شما نیست.', {f: _(FEATS.find(x => x[0] === what)?.[1] || '')})}</p>
    ${isMgr() ? `<button class="btn p" data-plans>⭐ ${_('دیدن پلن‌ها')}</button>` : ''}</div>`;
}
function bindPlanLinks(root = document) { root.querySelectorAll('[data-plans]').forEach(b => b.onclick = () => planSheet()); }

/* ---------- banners and the subscription card ---------- */
function planBanner() {
  if (!S.plan || !isMgr()) return '';
  const d = daysLeft(), st = S.plan.status;
  if (st === 'trial' && d != null) return `<div class="card plan-banner"><span>🎁 ${_('دوره‌ی آزمایشی پلن {p}: {d} روز باقی مانده', {p: planTitle(S.plan), d: fmt(Math.max(d, 0), 0)})}</span><button class="btn p" data-plans>${_('خرید اشتراک')}</button></div>`;
  if (st === 'active' && d != null && d <= 7) return `<div class="card plan-banner warn"><span>⏳ ${_('اشتراک شما {d} روز دیگر تمام می‌شود', {d: fmt(Math.max(d, 0), 0)})}</span><button class="btn p" data-plans>${_('تمدید')}</button></div>`;
  if (st === 'expired' || st === 'suspended') return `<div class="card plan-banner warn"><span>⚠️ ${st === 'suspended' ? _('اشتراک این صرافی متوقف شده است.') : _('اشتراک تمام شده و صرافی روی پلن رایگان است. اطلاعات شما محفوظ است.')}</span><button class="btn p" data-plans>${_('تمدید')}</button></div>`;
  return '';
}
function planCard() {
  if (!S.plan) return '';
  const st = S.plan.status, d = daysLeft();
  const stTxt = {trial: _('آزمایشی'), active: _('فعال'), expired: _('منقضی'), suspended: _('متوقف'), free: _('رایگان')}[st] || st;
  const use = [['staff', S.members.length], ['customers', customerCount()]];
  return `<div class="card"><h3>⭐ ${_('اشتراک')} <span class="chip ${st === 'active' ? 'pos' : st === 'trial' ? '' : 'neg'}">${stTxt}</span></h3>
    <div class="grid g2"><div class="stat"><div class="l">${_('پلن')}</div><div class="v">${esc(planTitle(S.plan))}</div></div>
      <div class="stat"><div class="l">${_('اعتبار تا')}</div><div class="v small">${S.plan.period_end && st !== 'free' && st !== 'expired' ? jd(S.plan.period_end, {year:'numeric', month:'short', day:'numeric'}) + (d != null ? ` <small class="muted">(${_('{d} روز', {d: fmt(Math.max(d, 0), 0)})})</small>` : '') : '—'}</div></div></div>
    <div class="usage">${use.map(([k, n]) => { const m = lim(k), p = Math.min(100, m ? n / m * 100 : 0);
      return `<div class="u"><div class="ul"><span>${_(LIMS.find(x => x[0] === k)[1])}</span><b dir="ltr">${fmt(n, 0)} / ${m >= 1e6 ? '∞' : fmt(m, 0)}</b></div><div class="bar"><i style="width:${p}%" class="${p >= 90 ? 'hot' : ''}"></i></div></div>`; }).join('')}</div>
    ${isMgr() ? `<div class="btns"><button class="btn p" data-plans>⭐ ${st === 'active' ? _('تمدید یا تغییر پلن') : _('خرید اشتراک')}</button></div>` : ''}</div>`;
}
// language choice for plans with fewer than four languages (owner only)
function langCard() {
  if (S.role !== 'owner' || lim('langs') >= 4) return '';
  const n = lim('langs'), cur = allowedLangs();
  return `<div class="card"><h3>🌐 ${_('زبان‌های صرافی')}</h3><p class="hint" style="margin-top:0">${_('پلن شما {n} زبان دارد. انتخاب کنید کدام‌ها استفاده شوند.', {n: fmt(n, 0)})}</p>
    <div class="langs">${ALL_LANGS.map(l => `<label class="chk"><input type="checkbox" data-lg="${l}" ${cur.includes(l) ? 'checked' : ''}> ${I18N.LANGS[l].name}</label>`).join('')}</div>
    <div class="btns"><button class="btn p" id="lgSave">${_('ذخیره')}</button></div></div>`;
}
function bindLangCard() {
  if (!$('lgSave')) return;
  $('lgSave').onclick = async () => {
    const sel = [...document.querySelectorAll('[data-lg]')].filter(c => c.checked).map(c => c.dataset.lg);
    if (!sel.length) return toast(_('دست‌کم یک زبان انتخاب کنید'));
    if (sel.length > lim('langs')) return toast(_('پلن شما فقط {n} زبان دارد', {n: fmt(lim('langs'), 0)}));
    if (await saveSettings({langs: sel})) { toast(_('ذخیره شد')); if (!applyLangLimit()) render(); }
  };
}

/* ---------- plans, payment by bank transfer and receipt upload ---------- */
async function planSheet() {
  openSheet(`<div class="boot">${_('در حال بارگذاری…')}</div>`);
  const [plans, pay, mine] = await Promise.all([
    sb.from('plans').select('*').order('sort'),
    sb.from('platform_settings').select('value').eq('key', 'payment').maybeSingle(),
    sb.from('payments').select('*').eq('exchange_id', S.ex.id).order('created_at', {ascending: false}).limit(10),
  ]);
  if (plans.error) return err(plans.error);
  const P = pay.data?.value || {};
  let months = 1;
  const price = p => months === 12 ? Number(p.price_year) : Number(p.price_month);
  const cur = c => ({USD: '$', EUR: '€', TRY: '₺'})[c] || (c + ' ');
  const cardOf = p => `<div class="pcard ${p.highlight ? 'hl' : ''} ${S.plan?.paid_plan === p.id && S.plan?.status === 'active' ? 'cur' : ''}">
      ${p.highlight ? `<div class="rib">${_('پیشنهادی')}</div>` : ''}
      <h3>${esc(planTitle(p))}</h3><div class="muted small">${esc(p.description?.[I18N.lang] || p.description?.en || '')}</div>
      <div class="price">${price(p) ? `${cur(p.currency)}${fmt(price(p), 0)}<small>/${months === 12 ? _('سال') : _('ماه')}</small>` : _('رایگان')}</div>
      <ul>${LIMS.map(([k, l]) => `<li>👤 ${_(l)}: <b>${Number(p.limits?.[k]) >= 1e6 ? '∞' : fmt(Number(p.limits?.[k] ?? 0), 0)}</b></li>`).join('')}
        ${FEATS.map(([k, l]) => `<li class="${p.features?.[k] ? '' : 'no'}">${p.features?.[k] ? '✅' : '—'} ${_(l)}</li>`).join('')}</ul>
      ${price(p) ? `<button class="btn p w" data-buy="${p.id}">${S.plan?.paid_plan === p.id && S.plan?.status === 'active' ? _('تمدید') : _('انتخاب')}</button>` : ''}</div>`;
  const statusTxt = s => ({pending: '⏳ ' + _('در انتظار تأیید'), approved: '✅ ' + _('تأیید شد'), rejected: '❌ ' + _('رد شد')})[s] || s;
  const draw = () => {
    $('sheetBody').innerHTML = `<h2>⭐ ${_('پلن‌ها و اشتراک')}</h2>
      <div class="seg" id="pPer" style="margin-bottom:12px"><button class="${months === 1 ? 'on' : ''}" data-m="1">${_('ماهانه')}</button><button class="${months === 12 ? 'on' : ''}" data-m="12">${_('سالانه')} <small>(${_('۲ ماه رایگان')})</small></button></div>
      <div class="pgrid">${plans.data.map(cardOf).join('')}</div>
      ${mine.data?.length ? `<h3>🧾 ${_('پرداخت‌های شما')}</h3><div class="list">${mine.data.map(x => `<div class="row"><div class="ic">💳</div><div class="m"><b>${esc(planTitle(plans.data.find(p => p.id === x.plan_id)) || x.plan_id)} · ${x.months === 12 ? _('سالانه') : _('ماهانه')}</b><span>${jd(x.created_at)}${x.admin_note ? ' · ' + esc(x.admin_note) : ''}</span></div><div class="e">${cur(x.currency)}${fmt(Number(x.amount), 0)}<br><small>${statusTxt(x.status)}</small></div></div>`).join('')}</div>` : ''}
      <div class="btns"><button class="btn g" id="pX">${_('بستن')}</button></div>`;
    $('pX').onclick = closeSheet;
    $('pPer').querySelectorAll('button').forEach(b => b.onclick = () => { months = +b.dataset.m; draw(); });
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => payStep(plans.data.find(p => p.id === b.dataset.buy)));
  };
  const payStep = p => {
    const amt = price(p), bank = P.bank?.[I18N.lang] || P.bank?.fa || P.bank?.en || '', note = P.note?.[I18N.lang] || P.note?.en || '';
    $('sheetBody').innerHTML = `<h2>💳 ${_('پرداخت پلن {p}', {p: esc(planTitle(p))})}</h2>
      <div class="stat"><div class="l">${_('مبلغ قابل پرداخت')}</div><div class="v">${cur(p.currency)}${fmt(amt, 0)} <small class="muted">/ ${months === 12 ? _('یک سال') : _('یک ماه')}</small></div></div>
      <div class="card bankbox"><h3>🏦 ${_('اطلاعات حساب برای واریز')}</h3>${bank ? `<pre class="bank">${esc(bank)}</pre><button class="btn g" id="bkCopy">📋 ${_('کپی')}</button>` : `<p class="muted">${_('اطلاعات حساب هنوز ثبت نشده است. لطفاً با پشتیبانی تماس بگیرید.')}</p>`}</div>
      <p class="hint">${esc(note)}</p>
      <div class="fld"><label>${_('تصویر فیش واریز')}</label><input class="in" id="rcFile" type="file" accept="image/*,application/pdf"></div>
      <div class="fld"><label>${_('توضیح (اختیاری)')}</label><input class="in" id="rcNote" placeholder="${_('مثلاً نام واریزکننده یا شماره پیگیری')}"></div>
      <div class="btns"><button class="btn p" id="rcGo">📤 ${_('ارسال فیش')}</button><button class="btn g" id="rcBack">${_('بازگشت')}</button></div>`;
    $('rcBack').onclick = draw;
    if ($('bkCopy')) $('bkCopy').onclick = () => navigator.clipboard?.writeText(bank).then(() => toast(_('کپی شد')));
    $('rcGo').onclick = async () => {
      const f = $('rcFile').files[0]; if (!f) return toast(_('تصویر فیش را انتخاب کنید'));
      $('rcGo').disabled = true; toast(_('در حال ارسال…'));
      try {
        const blob = f.type.startsWith('image/') ? await shrinkReceipt(f) : f;
        const ext = blob.type === 'application/pdf' ? 'pdf' : 'jpg';
        const path = `${S.ex.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await sb.storage.from('receipts').upload(path, blob, {contentType: blob.type || 'image/jpeg'});
        if (up.error) throw up.error;
        const r = await sb.rpc('request_payment', {p_ex: S.ex.id, p_plan: p.id, p_months: months, p_receipt: path, p_note: $('rcNote').value.trim() || null});
        if (r.error) throw r.error;
        $('sheetBody').innerHTML = `<div class="center"><div style="font-size:52px">✅</div><h2>${_('فیش شما ارسال شد')}</h2><p>${_('بعد از بررسی و تأیید، اشتراک خودکار فعال می‌شود.')}</p><button class="btn p" id="rcOk">${_('بستن')}</button></div>`;
        $('rcOk').onclick = closeSheet;
      } catch (e) { $('rcGo').disabled = false; err(e); }
    };
  };
  draw();
}
// receipt photos are shrunk to keep storage small (free tier)
function shrinkReceipt(file) {
  return new Promise((ok, bad) => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => b ? ok(b) : bad(new Error('image')), 'image/jpeg', .82);
      URL.revokeObjectURL(img.src);
    }; img.onerror = () => bad(new Error('image')); img.src = URL.createObjectURL(file);
  });
}

/* ---------- countries for the signup form (names come from the browser, in every language) ---------- */
const COUNTRIES = ('TR IR IQ AE SA QA KW BH OM JO SY LB EG LY TN DZ MA SD YE PS AF AZ AM GE DE NL GB FR SE NO DK FI BE AT CH IT ES PT IE PL CZ HU RO BG GR CY RU UA ' +
  'US CA AU NZ MY TH ID IN PK CN JP KR SG HK KZ UZ TJ TM KG MR SO DJ KM BR MX AR').split(' ');
function countryOptions(sel) {
  let dn; try { dn = new Intl.DisplayNames([I18N.lang], {type: 'region'}); } catch { dn = {of: c => c}; }
  return COUNTRIES.map(c => [c, dn.of(c) || c]).sort((a, b) => a[1].localeCompare(b[1], I18N.lang))
    .map(([c, n]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(n)}</option>`).join('');
}
