'use strict';
/* Sarrafino sales page: features, live prices from the plans table, FAQ, contact */
const C = window.SARRAF_CONFIG;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = v => new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(v);
const api = path => fetch(`${C.url}/rest/v1/${path}`, {headers: {apikey: C.key, Authorization: 'Bearer ' + C.key}}).then(r => r.ok ? r.json() : Promise.reject(r.status));

const FEATS = [['💱', 'trade'], ['👥', 'cust'], ['💰', 'box'], ['🤝', 'trust'], ['🧾', 'rc'], ['📣', 'board'], ['📺', 'tv'], ['📊', 'pl'], ['👔', 'team'], ['🌐', 'lang'], ['🔒', 'sec'], ['📱', 'app']];
const PF = [['board', 'p.f.board'], ['receipts_wa', 'p.f.rc'], ['expenses', 'p.f.exp'], ['trusts', 'p.f.trust'], ['reports', 'p.f.pl'], ['excel', 'p.f.excel'],
  ['partners', 'p.f.partners'], ['public_board', 'p.f.tv'], ['directory', 'p.f.dir'], ['branding', 'p.f.brand']];
let plans = null, months = 1;

function drawFeats() {
  $('feats').innerHTML = FEATS.map(([i, k]) => `<div class="feat"><div class="ic">${i}</div><b>${t('s.f.' + k)}</b><span>${t('s.f.' + k + '.d')}</span></div>`).join('');
}
function drawFaq() {
  $('faqList').innerHTML = [1, 2, 3, 4, 5, 6].map(n => `<details><summary>${t('s.q' + n)}</summary><p>${t('s.a' + n)}</p></details>`).join('');
}
function drawPlans() {
  if (!plans) return;
  const L = I18N.lang, cur = c => ({USD: '$', EUR: '€', TRY: '₺'})[c] || (c + ' ');
  const lim = (v) => Number(v) >= 1e6 ? '∞' : fmt(Number(v || 0));
  $('plans').innerHTML = plans.map(p => {
    const pr = months === 12 ? Number(p.price_year) : Number(p.price_month);
    return `<div class="plan ${p.highlight ? 'hl' : ''}">${p.highlight ? `<div class="rib">${t('s.p.best')}</div>` : ''}
      <h3>${esc(p.name?.[L] || p.name?.en || p.name?.fa)}</h3><div class="d">${esc(p.description?.[L] || p.description?.en || '')}</div>
      <div class="pr">${pr ? `${cur(p.currency)}${fmt(pr)}<small>/${t(months === 12 ? 's.p.yr' : 's.p.mo')}</small>` : t('s.p.free')}</div>
      <ul><li>👤 ${t('s.p.staff', {n: lim(p.limits?.staff)})}</li><li>📇 ${t('s.p.cust', {n: lim(p.limits?.customers)})}</li><li>🌐 ${t('s.p.langs', {n: lim(p.limits?.langs)})}</li>
        ${Number(p.limits?.exchanges) > 1 ? `<li>🏪 ${t('s.p.branches', {n: lim(p.limits?.exchanges)})}</li>` : ''}
        ${PF.map(([k, l]) => `<li class="${p.features?.[k] ? '' : 'no'}">${p.features?.[k] ? '✅' : '—'} ${t(l)}</li>`).join('')}</ul>
      <a class="btn" href="../sarraf/">${t(pr ? 's.p.choose' : 's.cta')}</a></div>`;
  }).join('');
}
async function load() {
  try { plans = await api('plans?select=*&is_public=eq.true&order=sort'); drawPlans(); } catch { $('plans').innerHTML = ''; }
  try {
    const [c] = await api('platform_settings?select=value&key=eq.contact');
    const wa = (c?.value?.whatsapp || '').replace(/[^\d]/g, '');
    if (wa) { $('waBtn').href = `https://wa.me/${wa}?text=${encodeURIComponent(t('s.wa.msg'))}`; $('waBtn').hidden = false; }
  } catch {}
}
function all() { I18N.apply(); drawFeats(); drawFaq(); drawPlans(); $('langSlot').innerHTML = I18N.picker('lang-sel'); I18N.bindPickers(); }
$('per').querySelectorAll('button').forEach(b => b.onclick = () => { months = +b.dataset.m; $('per').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawPlans(); });
$('yr').textContent = new Date().getFullYear();
addEventListener('langchange', all);
all(); load();
