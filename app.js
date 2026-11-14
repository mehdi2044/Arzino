'use strict';
/* ارزینو — Arzino  ·  live rates, charts, converter, calculator */

const DATA = 'https://raw.githubusercontent.com/mehdi2044/arzino/data/';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------------------------------------------------------- assets */
const ASSETS = [
  {id:'USD', fa:'دلار آمریکا', en:'US Dollar', sym:'$', ic:'icons/flags/us.svg', g:'fiat'},
  {id:'EUR', fa:'یورو', en:'Euro', sym:'€', ic:'icons/flags/eu.svg', g:'fiat'},
  {id:'TRY', fa:'لیر ترکیه', en:'Turkish Lira', sym:'₺', ic:'icons/flags/tr.svg', g:'fiat'},
  {id:'CAD', fa:'دلار کانادا', en:'Canadian Dollar', sym:'C$', ic:'icons/flags/ca.svg', g:'fiat'},
  {id:'CNY', fa:'یوان چین', en:'Chinese Yuan', sym:'¥', ic:'icons/flags/cn.svg', g:'fiat'},
  {id:'CHF', fa:'فرانک سوئیس', en:'Swiss Franc', sym:'CHF', ic:'icons/flags/ch.svg', g:'fiat'},
  {id:'GBP', fa:'پوند انگلیس', en:'British Pound', sym:'£', ic:'icons/flags/gb.svg', g:'fiat'},
  {id:'AED', fa:'درهم امارات', en:'UAE Dirham', sym:'AED', ic:'icons/flags/ae.svg', g:'fiat'},
  {id:'JPY', fa:'ین ژاپن', en:'Japanese Yen', sym:'JP¥', ic:'icons/flags/jp.svg', g:'fiat'},
  {id:'AUD', fa:'دلار استرالیا', en:'Australian Dollar', sym:'A$', ic:'icons/flags/au.svg', g:'fiat'},
  {id:'RUB', fa:'روبل روسیه', en:'Russian Ruble', sym:'₽', ic:'icons/flags/ru.svg', g:'fiat'},
  {id:'IRT', fa:'تومان ایران', en:'Iranian Toman', sym:'تومان', ic:'icons/flags/ir.svg', g:'fiat'},
  {id:'XAU', fa:'انس جهانی طلا', en:'Gold ounce', sym:'oz', ic:'icons/gold.svg', g:'metal'},
  {id:'XAG', fa:'انس جهانی نقره', en:'Silver ounce', sym:'oz', ic:'icons/silver.svg', g:'metal'},
  {id:'G18', fa:'طلای ۱۸ عیار (گرم)', en:'18K gold gram', sym:'g', ic:'icons/g18.svg', g:'metal', ir:true, k:0.75/31.1034768},
  {id:'G24', fa:'طلای ۲۴ عیار (گرم)', en:'24K gold gram', sym:'g', ic:'icons/gold.svg', g:'metal', ir:true, k:1/31.1034768},
  {id:'MESGHAL', fa:'مثقال طلا', en:'Gold mesghal', sym:'', ic:'icons/g18.svg', g:'metal', ir:true, k:4.6083*0.705/31.1034768},
  {id:'SEKE', fa:'سکه امامی', en:'Emami coin', sym:'', ic:'icons/coin.svg', g:'metal', ir:true, k:8.133*0.9/31.1034768},
  {id:'SEKE_B', fa:'سکه بهار آزادی', en:'Bahar Azadi coin', sym:'', ic:'icons/coin.svg', g:'metal', ir:true, k:8.133*0.9/31.1034768},
  {id:'NIM', fa:'نیم سکه', en:'Half coin', sym:'', ic:'icons/coin.svg', g:'metal', ir:true, k:4.0665*0.9/31.1034768},
  {id:'ROB', fa:'ربع سکه', en:'Quarter coin', sym:'', ic:'icons/coin.svg', g:'metal', ir:true, k:2.0332*0.9/31.1034768},
  {id:'BTC', fa:'بیت‌کوین', en:'Bitcoin', sym:'BTC', ic:'icons/crypto/btc.svg', g:'crypto', bn:'BTCUSDT'},
  {id:'ETH', fa:'اتریوم', en:'Ethereum', sym:'ETH', ic:'icons/crypto/eth.svg', g:'crypto', bn:'ETHUSDT'},
  {id:'USDT', fa:'تتر', en:'Tether USDT', sym:'USDT', ic:'icons/crypto/usdt.svg', g:'crypto'},
  {id:'XRP', fa:'ریپل', en:'XRP', sym:'XRP', ic:'icons/crypto/xrp.svg', g:'crypto', bn:'XRPUSDT'},
  {id:'TRX', fa:'ترون', en:'TRON', sym:'TRX', ic:'icons/crypto/trx.svg', g:'crypto', bn:'TRXUSDT'},
];
const AM = Object.fromEntries(ASSETS.map(a => [a.id, a]));
const nm = id => t('c.' + id);                 // asset name in the current language
const GROUPS = () => ['all','fav','fiat','metal','crypto'].map(g => [g, t('g.' + g)]);
const QUOTES = () => ['IRT','USD','TRY','EUR'].map(q => [q, t('s.' + q)]);
const PCT = () => I18N.lang === 'fa' ? '٪' : '%';
const RANGES = {
  '15m': {fa:'۱۵ دقیقه', src:'m1', span:900, agg:60},
  '1H':  {fa:'۱ ساعت',  src:'m1', span:3600, agg:60},
  '1D':  {fa:'۱ روز',   src:'m1', span:86400, agg:300},
  '1W':  {fa:'۱ هفته',  src:'h1', span:7*86400, agg:3600},
  '1M':  {fa:'۱ ماه',   src:'h1', span:31*86400, agg:4*3600},
  '1Y':  {fa:'۱ سال',   src:'d1', span:366*86400, agg:86400},
};

/* ---------------------------------------------------------------- state */
const DEF = {quote:'IRT', group:'all', digits:'fa', theme:'auto', iranMarket:true, manual:{},
  favs:['USD','EUR','TRY','CAD','XAU','G18','SEKE','BTC','USDT'],
  src:'bonbast', conv:{from:'USD', to:'IRT', amt:'1'}, chart:{a:'USD', q:'IRT', r:'1D', type:'area'}, calcHist:[], view:'market'};
let S = load('arzino.s', DEF);
S = Object.assign(structuredClone(DEF), S);
let D = load('arzino.d', {t:0, usd:{USD:1}, iran:{}, chg:{}, spark:{}});
const live = {};      // live crypto prices from Binance
const chartCache = {};

function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? structuredClone(d); } catch { return structuredClone(d); } }
function save() { try { localStorage.setItem('arzino.s', JSON.stringify(S)); } catch {} }

/* ---------------------------------------------------------------- numbers */
const loc = () => I18N.numLocale(S.digits);
function dpFor(v) { const a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 2 : a >= 1 ? 3 : 4; }
function fmt(v, d) {
  if (v == null || !isFinite(v)) return '—';
  if (v !== 0 && Math.abs(v) < 0.01) return new Intl.NumberFormat(loc(), {maximumSignificantDigits:4}).format(v);
  return new Intl.NumberFormat(loc(), {maximumFractionDigits: d ?? dpFor(v)}).format(v);
}
function pct(v) { if (v == null || !isFinite(v)) return ''; return (v > 0 ? '+' : '') + fmt(v, 2) + PCT(); }
function parseNum(s) {
  s = String(s ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  const v = parseFloat(s); return isFinite(v) ? v : NaN;
}
function words(v) { return I18N.words(v, fmt); }   // 25.7 million
function qLabel(q) {                // short unit label for any asset used as a quote
  if (q === 'IRT') return t('u.toman');
  if (q === 'USD') return '$';
  const x = AM[q]; if (!x) return q;
  return x.sym && !['oz', 'g', ''].includes(x.sym) ? x.sym : nm(q);
}
function qName(q) { return q === 'IRT' ? t('u.toman') : AM[q] ? (I18N.has('s.' + q) ? t('s.' + q) : nm(q)) : q; }
function baseOptions(cur, exclude = []) {
  const grp = {fiat:t('g.fiat'), metal:t('g.metal'), crypto:t('g.crypto')};
  return Object.entries(grp).map(([g, l]) => `<optgroup label="${l}">` +
    ASSETS.filter(a => a.g === g && !exclude.includes(a.id)).map(a => `<option value="${a.id}" ${a.id === cur ? 'selected' : ''}>${esc(nm(a.id))} (${a.id})</option>`).join('') + '</optgroup>').join('');
}
function money(v, q, short) {
  if (v == null || !isFinite(v)) return '—';
  if (q === 'IRT') return `${fmt(v, Math.abs(v) >= 100 ? 0 : 2)} <small>${t('u.toman')}</small>`;
  if (q === 'USD') return `${fmt(v)} <small>$</small>`;
  return `${fmt(v)} <small><bdi>${esc(qLabel(q))}</bdi></small>`;
}
function moneyTxt(v, q) { return money(v, q).replace(/<[^>]+>/g, ''); }

/* ---------------------------------------------------------------- pricing */
function usdRaw(a) {               // USD per unit, online only
  if (a === 'USD') return 1;
  if (live[a]) return live[a];
  return D.usd?.[a] ?? null;
}
const SRCS = [['bonbast','bonbast'],['tgju','tgju']];
const SRC_NAME = new Proxy({}, {get: (o, k) => ({bonbast:'bonbast.com', tgju:'tgju.org'})[k] || (I18N.has('src.' + k) ? t('src.' + k) : k)});
let _ir = null, _irKey = '';
function IR() {                      // Iranian market prices from the chosen source (gaps filled from others)
  const key = D.t + S.src;
  if (_ir && _irKey === key) return _ir;
  const sel = D.iran_by?.[S.src];
  _ir = Object.assign({}, D.iran || {}, sel || {}); _irKey = key;
  return _ir;
}
function srcPicker(asset) {           // chips: same item priced by each Iranian source
  const btns = SRCS.map(([k]) => {
    const v = D.iran_by?.[k]?.[asset === 'IRT' ? 'USD' : asset];
    return v ? `<button data-src="${k}" class="${S.src === k ? 'on' : ''}">${S.src === k ? '✓ ' : ''}${esc(SRC_NAME[k])} <b>${fmt(v, 0)}</b></button>` : '';
  }).join('');
  return btns ? `<div class="src-chips"><span class="muted small">${t('src.label')}</span>${btns}</div>` : '';
}
function srcOf(a) { return D.iran_by?.[S.src]?.[a] ? S.src : (D.iran_src?.[a] || ''); }
function tpuMarket() { return IR().USD || IR().USDT || D.toman_per_usd || null; }
function goldProxyUsd(a) {          // estimate for Iranian gold items when no market price
  const x = usdRaw('XAU'); return x && AM[a]?.k ? x * AM[a].k : null;
}
function marketToman(a) {           // Toman per unit, without manual
  if (a === 'IRT') return 1;
  if (a === 'USD') return tpuMarket();
  if (S.iranMarket || AM[a]?.ir) { const v = IR()[a]; if (v) return v; }
  const t = toman('USD');
  const u = usdRaw(a) ?? (AM[a]?.ir ? goldProxyUsd(a) : null);
  return u && t ? u * t : null;
}
function toman(a, depth = 0) {      // Toman per unit, manual-aware
  if (a === 'IRT') return 1;
  const m = S.manual[a];
  if (m && depth < 4 && m.unit !== a) {
    const u = m.unit === 'IRT' ? 1 : toman(m.unit, depth + 1);
    if (u) return m.v * u;
  }
  return marketToman(a);
}
function usdP(a, depth = 0) {       // USD per unit, manual-aware
  if (a === 'USD' && !S.manual.USD) return 1;
  const m = S.manual[a];
  if (m && depth < 4 && m.unit !== a) {
    const u = m.unit === 'USD' ? 1 : m.unit === 'IRT' ? (toman('USD') ? 1 / toman('USD') : null) : usdP(m.unit, depth + 1);
    if (u) return m.v * u;
  }
  if (a === 'IRT') { const t = toman('USD'); return t ? 1 / t : null; }
  const r = usdRaw(a); if (r != null) return r;
  const t = toman(a), tu = toman('USD'); return t && tu ? t / tu : null;
}
function rate(a, b) {               // how many b for 1 a
  if (a === b) return 1;
  const tomanSide = x => x === 'IRT' || AM[x]?.ir || (S.manual[x] && S.manual[x].unit === 'IRT');
  if (tomanSide(a) || tomanSide(b)) { const ta = toman(a), tb = toman(b); if (ta && tb) return ta / tb; }
  const ua = usdP(a), ub = usdP(b); if (ua && ub) return ua / ub;
  const ta = toman(a), tb = toman(b); return ta && tb ? ta / tb : null;
}
const isManual = a => !!S.manual[a];
function marketRate(a, b) { const m = S.manual; S.manual = {}; try { return rate(a, b); } finally { S.manual = m; } }
const isEstimate = a => AM[a]?.ir && !IR()[a];

/* ---------------------------------------------------------------- data */
let lastOk = 0, loading = false;
async function fetchJSON(path) {
  const r = await fetch(DATA + path + (path.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 30000), {cache:'no-store'});
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function refresh(force) {
  if (loading) return; loading = true;
  setStatus('busy');
  try {
    const d = await fetchJSON('latest.json');
    if (d && d.usd && (!D.t || d.t >= D.t || force)) {
      D = d; try { localStorage.setItem('arzino.d', JSON.stringify(D)); } catch {}
    }
    lastOk = Date.now();
    setStatus('ok');
    renderAll();
    if (curView() === 'chart') drawChart(false);
  } catch (e) {
    setStatus('err');
    renderAll();
  } finally { loading = false; }
}
async function fetchLive() {        // live crypto (optional, if reachable)
  const syms = ASSETS.filter(a => a.bn).map(a => a.bn);
  try {
    const r = await fetch('https://data-api.binance.vision/api/v3/ticker/price?symbols=' + encodeURIComponent(JSON.stringify(syms)), {cache:'no-store'});
    const j = await r.json();
    const usdt = D.usd?.USDT || 1;
    for (const it of j) { const a = ASSETS.find(x => x.bn === it.symbol); if (a) live[a.id] = parseFloat(it.price) * usdt; }
    live._t = Date.now();
    if (curView() === 'market') renderMarket();
    if (curView() === 'convert') renderConv();
  } catch {}
}
function ago(ts) {
  if (!ts) return '';
  const s = Math.max(0, Math.round(Date.now() / 1000 - ts));
  if (s < 60) return t('ago.now');
  if (s < 3600) return t('ago.min', {n: fmt(Math.round(s / 60), 0)});
  if (s < 86400) return t('ago.h', {n: fmt(Math.round(s / 3600), 0)});
  return t('ago.d', {n: fmt(Math.round(s / 86400), 0)});
}
function setStatus(st) {
  const dot = $('liveDot');
  dot.className = 'dot' + (st === 'ok' ? ' on' : st === 'err' ? ' err' : '');
  if (st === 'busy' && !D.t) $('updText').textContent = t('hdr.loading');
  else if (st === 'err') $('updText').textContent = D.t ? t('stat.offline', {t: ago(D.t)}) : t('stat.noconn');
  else if (D.t) $('updText').textContent = t('stat.upd', {t: ago(D.t)}) + (live._t ? t('stat.live') : '');
}

/* ---------------------------------------------------------------- ui helpers */
function icon(a) { const x = AM[a]; return `<span class="ic"><img src="${x.ic}" alt="" loading="lazy"></span>`; }
function sparkSVG(arr, w = 70, h = 30, color) {
  if (!arr || arr.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
  const mn = Math.min(...arr), mx = Math.max(...arr), r = mx - mn || 1;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 3 - (v - mn) / r * (h - 6)).toFixed(1)}`).join(' ');
  const c = color || (arr[arr.length - 1] >= arr[0] ? 'var(--up)' : 'var(--down)');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
function sparkIn(a, q) {             // index-aligned sparkline of a priced in q
  const usdSp = x => {
    if (x === 'USD') return null;
    if (x === 'IRT') return (D.spark?.IRT || []).map(v => 1 / v);
    if (AM[x]?.ir) { const s = D.spark?.[x]; const i = D.spark?.IRT; if (!s || !i) return s && s.length ? s : null;
      return s.map((v, k) => v / i[Math.round(k * (i.length - 1) / Math.max(1, s.length - 1))]); }
    return D.spark?.[x] || null;
  };
  const A = usdSp(a), Q = usdSp(q);
  if (a === 'USD' && Q) return Q.map(v => 1 / v);
  if (!A || !A.length) return null;
  if (q === 'USD' || !Q || !Q.length) return q === 'USD' ? A : null;
  return A.map((v, k) => v / Q[Math.round(k * (Q.length - 1) / Math.max(1, A.length - 1))]);
}
function chgBadge(v) {
  if (v == null || !isFinite(v)) return '';
  const c = v > 0.005 ? 'b-up' : v < -0.005 ? 'b-down' : 'b-flat';
  return `<span class="badge ${c}">${v > 0 ? '▲' : v < 0 ? '▼' : '•'} ${fmt(Math.abs(v), 2)}${PCT()}</span>`;
}
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 1900); }
function seg(el, opts, cur, on) {
  el.innerHTML = opts.map(([v, l]) => `<button data-v="${v}" class="${v === cur ? 'active' : ''}">${l}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('button'); if (b) on(b.dataset.v); };
}
function usdChg(a) {                 // 24h % change of the USD value of a
  const cI = D.chg?.IRT;               // change of Toman-per-USD
  if (a === 'USD') return 0;
  if (a === 'IRT') return cI == null ? null : (1 / (1 + cI / 100) - 1) * 100;
  const c = D.chg?.[a]; if (c == null) return null;
  if (AM[a]?.ir) return cI == null ? null : ((1 + c / 100) / (1 + cI / 100) - 1) * 100;
  return c;
}
function changeIn(a, q) {            // 24h % change of a priced in q
  const ca = usdChg(a), cq = usdChg(q);
  if (ca == null || cq == null) return null;
  return ((1 + ca / 100) / (1 + cq / 100) - 1) * 100;
}

/* ---------------------------------------------------------------- views */
function curView() { return S.view; }
function show(v) {
  S.view = v; save();
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === 'view-' + v));
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.v === v));
  window.scrollTo({top:0, behavior:'smooth'});
  if (v === 'chart') setTimeout(() => drawChart(true), 30);
  if (v === 'convert') renderConv();
  if (v === 'calc') renderCalc();
  if (v === 'market') renderMarket();
}

/* ---------------- market */
function renderHero() {
  const T = I18N.t;
  const t = toman('USD'), tt = toman('USDT'), e = toman('EUR'), tr = toman('TRY');
  const c = D.chg?.IRT;
  const sp = D.spark?.IRT;
  $('hero').innerHTML = `
    <div class="h-top"><span>${T('hero.title')} ${isManual('USD') ? `<span class="pill">${T('b.manual')}</span>` : ''}</span>
      ${c != null ? `<span class="pill">${c >= 0 ? '▲' : '▼'} ${fmt(Math.abs(c), 2)}${PCT()} ${T('hero.24')}</span>` : ''}</div>
    <div class="h-price">${t ? fmt(t, 0) : '—'} <small>${T('u.toman')}</small></div>
    <div class="h-sub"><span>${t ? words(t) + ' ' + T('u.toman') : T('hero.noRate')}</span>${!isManual('USD') && srcOf('USD') ? `<span>${T('hero.src', {s: esc(SRC_NAME[srcOf('USD')] || srcOf('USD'))})}</span>` : ''}</div>
    <div class="h-src">${SRCS.map(([k]) => { const v = D.iran_by?.[k]?.USD; return v ? `<button data-src="${k}" class="${S.src === k ? 'on' : ''}">${S.src === k ? '✓ ' : ''}${esc(SRC_NAME[k])}<b>${fmt(v, 0)}</b></button>` : ''; }).join('')}</div>
    ${sp && sp.length > 1 ? sparkSVG(sp, 300, 54, 'rgba(255,255,255,.95)').replace('class="spark"', '') : ''}
    <div class="hero-grid">
      <div>💶 ${T('s.EUR')}<b>${e ? fmt(e, 0) : '—'}</b></div>
      <div>🇹🇷 ${T('s.TRY')}<b>${tr ? fmt(tr, 0) : '—'}</b></div>
      <div>₮ ${T('s.USDT')}<b>${tt ? fmt(tt, 0) : '—'}</b></div>
    </div>`;
}
function renderMarket() {
  renderHero();
  const qs = QUOTES().some(([v]) => v === S.quote) ? QUOTES() : [...QUOTES(), [S.quote, qName(S.quote)]];
  seg($('quoteSeg'), qs, S.quote, v => { S.quote = v; save(); renderMarket(); });
  $('quoteSel').innerHTML = baseOptions(S.quote);
  $('quoteSel').onchange = () => { S.quote = $('quoteSel').value; save(); renderMarket(); };
  $('groupChips').innerHTML = GROUPS().map(([v, l]) => `<button class="chip ${v === S.group ? 'active' : ''}" data-v="${v}">${l}</button>`).join('');
  $('groupChips').onclick = e => { const b = e.target.closest('button'); if (b) { S.group = b.dataset.v; save(); renderMarket(); } };
  const q = S.quote;
  let list = ASSETS.filter(a => a.id !== q);
  if (S.group === 'fav') list = list.filter(a => S.favs.includes(a.id));
  else if (S.group !== 'all') list = list.filter(a => a.g === S.group);
  list = list.filter(a => !a.ir || IR()[a.id] || isManual(a.id) || usdRaw('XAU'));
  $('marketList').innerHTML = list.map(a => {
    const per = a.id === 'IRT' ? 1e6 : 1;           // Toman row: per 1 million Toman
    const p = rate(a.id, q) == null ? null : rate(a.id, q) * per;
    let secTxt = '';
    if (q === 'IRT') { const u = usdP(a.id); if (u && a.id !== 'USD') secTxt = '$' + fmt(u * per); }
    else if (a.id === 'IRT') { const u = usdP('IRT'); if (u && q !== 'USD') secTxt = '$' + fmt(u * per); }
    else { const tm = toman(a.id); if (tm) secTxt = fmt(tm, 0) + ' ' + t('u.toman'); }
    const ch = changeIn(a.id, q);
    const sp = sparkIn(a.id, q);
    const tags = [
      isManual(a.id) ? `<span class="badge b-man">${t('b.manual')}</span>` : '',
      live[a.id] ? `<span class="badge b-live">${t('b.live')}</span>` : '',
      isEstimate(a.id) && !isManual(a.id) ? `<span class="badge b-flat">${t('b.est')}</span>` : '',
    ].join(' ');
    return `<div class="item grp-${a.ir ? 'iran' : a.g}" data-id="${a.id}">
      ${icon(a.id)}
      <div class="nm"><b>${a.id === 'IRT' ? t('mk.million') : esc(nm(a.id))}</b><span>${a.ir ? (srcOf(a.id) || t('mk.iran')) : a.id + (q === 'IRT' && S.iranMarket && IR()[a.id] && !isManual(a.id) ? ' · ' + srcOf(a.id) : '')} ${tags}</span></div>
      ${sparkSVG(sp, 70, 30, ch == null ? null : ch >= 0 ? 'var(--up)' : 'var(--down)')}
      <div class="pr"><b class="${p != null && Math.abs(p) >= 1e8 ? 'long' : ''}">${money(p, q)}</b><span>${chgBadge(ch)} ${secTxt}</span></div>
      <button class="star ${S.favs.includes(a.id) ? 'on' : ''}" data-star="${a.id}" title="${t('mk.fav')}">⭐</button>
    </div>`;
  }).join('') || `<p class="muted">${t('mk.empty')}</p>`;
  $('marketList').onclick = e => {
    const st = e.target.closest('[data-star]');
    if (st) { const id = st.dataset.star; S.favs = S.favs.includes(id) ? S.favs.filter(x => x !== id) : [...S.favs, id]; save(); renderMarket(); return; }
    const it = e.target.closest('.item'); if (!it) return;
    let ca = it.dataset.id, cq = q; if (ca === 'IRT') [ca, cq] = [q, 'IRT'];
    S.chart.a = ca; S.chart.q = cq === ca ? 'USD' : cq; save(); show('chart');
  };
  $('marketFoot').textContent = t('mk.foot');
  setStatus(lastOk || !D.t ? 'ok' : 'err');
}
$('hero').onclick = e => {
  const b = e.target.closest('[data-src]');
  if (b) { S.src = b.dataset.src; save(); renderAll(); toast(t('toast.src', {s: SRC_NAME[S.src]})); return; }
  S.chart = {...S.chart, a:'USD', q:'IRT'}; save(); show('chart');
};

/* ---------------- picker */
let pickCb = null;
function openPicker(title, cb, exclude = []) {
  pickCb = cb; $('pickerTitle').textContent = title; $('pickerSearch').value = '';
  renderPicker(exclude); openSheet('pickerSheet');
  $('pickerSearch').oninput = () => renderPicker(exclude);
}
function renderPicker(exclude) {
  const s = $('pickerSearch').value.trim().toLowerCase();
  const list = ASSETS.filter(a => !exclude.includes(a.id) && (!s || (nm(a.id) + a.fa + a.en + a.id).toLowerCase().includes(s)));
  $('pickerList').innerHTML = list.map(a => `<div class="item grp-${a.ir ? 'iran' : a.g}" data-id="${a.id}">${icon(a.id)}<div class="nm"><b>${esc(nm(a.id))}</b><span>${a.id}${I18N.lang === 'en' ? '' : ' · ' + esc(a.en)}</span></div></div>`).join('');
  $('pickerList').onclick = e => { const it = e.target.closest('.item'); if (it) { closeSheets(); pickCb && pickCb(it.dataset.id); } };
}
function pickerBtn(el, a) { el.innerHTML = `<img src="${AM[a].ic}" alt=""><span>${esc(nm(a))}</span>`; }

/* ---------------- sheets */
function openSheet(id) { $('sheetBg').classList.add('show'); $(id).classList.add('show'); }
function closeSheets() { $('sheetBg').classList.remove('show'); document.querySelectorAll('.sheet').forEach(s => s.classList.remove('show')); }
$('sheetBg').onclick = closeSheets;

/* ---------------- converter */
function renderConv() {
  const {from, to} = S.conv;
  pickerBtn($('fromBtn'), from); pickerBtn($('toBtn'), to);
  if (document.activeElement !== $('amount')) $('amount').value = S.conv.amt;
  const amt = parseNum(S.conv.amt);
  const r = rate(from, to);
  const res = isFinite(amt) && r != null ? amt * r : null;
  $('result').textContent = res == null ? '—' : fmt(res, to === 'IRT' ? 0 : (Math.abs(res) >= 1000 ? 2 : undefined));
  $('fromWords').textContent = isFinite(amt) ? (words(amt) ? words(amt) + ' ' + qName(from) : '') : '';
  $('toWords').textContent = res != null && words(res) ? words(res) + ' ' + qName(to) : (to === 'IRT' && res != null ? fmt(res * 10, 0) + ' ' + t('u.rial') : '');
  const inv = r ? 1 / r : null;
  const man = [from, to].filter(isManual);
  const one = fmt(1, 0);
  $('rateLine').innerHTML = r == null ? t('cv.noRate') :
    `${one} ${esc(nm(from))} = <b>${moneyTxt(r, to)}</b><br>${one} ${esc(nm(to))} = <b>${moneyTxt(inv, from)}</b>` +
    (man.length ? `<br><span class="badge b-man">${t('cv.manualOn', {l: man.map(nm).join(I18N.lang === 'fa' ? '، ' : ', ')})}</span>` : '') +
    ([from, to].some(isEstimate) ? `<br><span class="badge b-flat">${t('cv.est')}</span>` : '') +
    ((from === 'IRT' || to === 'IRT' || AM[from]?.ir || AM[to]?.ir) && !man.length ? srcPicker(from === 'IRT' ? to : from) : '');
  const qa = from === 'IRT' ? [100000, 1e6, 10e6, 100e6, 1e9] : ['BTC','ETH','XAU','SEKE'].includes(from) ? [0.01, 0.1, 0.5, 1, 2] : [1, 10, 100, 500, 1000, 5000];
  $('quickAmts').innerHTML = qa.map(v => `<button data-v="${v}">${fmt(v)}</button>`).join('');
  $('quickAmts').onclick = e => { const b = e.target.closest('button'); if (b) { S.conv.amt = b.dataset.v; save(); $('amount').value = fmt(+b.dataset.v); renderConv(); } };
  // all-in-one list
  const others = ASSETS.filter(a => a.id !== from && (!a.ir || IR()[a.id] || isManual(a.id)));
  others.sort((x, y) => (S.favs.includes(y.id) - S.favs.includes(x.id)));
  $('allList').innerHTML = others.map(a => {
    const v = isFinite(amt) ? amt * (rate(from, a.id) ?? NaN) : NaN;
    return `<div class="item grp-${a.ir ? 'iran' : a.g}" data-id="${a.id}">${icon(a.id)}<div class="nm"><b>${esc(nm(a.id))}</b><span>${a.id}${isManual(a.id) ? ' · ' + t('b.manual') : ''}</span></div><div class="pr"><b>${money(v, a.id)}</b><span>${a.id === 'IRT' ? words(v) : ''}</span></div></div>`;
  }).join('');
  $('allList').onclick = e => { const it = e.target.closest('.item'); if (it) { S.conv.to = it.dataset.id; save(); renderConv(); window.scrollTo({top:0, behavior:'smooth'}); } };
}
$('amount').addEventListener('input', () => { S.conv.amt = String(parseNum($('amount').value) || ''); save(); renderConv(); });
$('amount').addEventListener('blur', () => { const v = parseNum($('amount').value); if (isFinite(v)) $('amount').value = fmt(v, 8); });
$('amount').addEventListener('focus', () => { const v = parseNum($('amount').value); $('amount').value = isFinite(v) ? String(v) : ''; setTimeout(() => $('amount').select(), 10); });
$('fromBtn').onclick = () => openPicker(t('cv.from'), a => { if (a === S.conv.to) S.conv.to = S.conv.from; S.conv.from = a; save(); renderConv(); });
$('toBtn').onclick = () => openPicker(t('cv.to'), a => { if (a === S.conv.from) S.conv.from = S.conv.to; S.conv.to = a; save(); renderConv(); });
$('swapBtn').onclick = () => { [S.conv.from, S.conv.to] = [S.conv.to, S.conv.from]; save(); renderConv(); };
$('rateLine').onclick = e => { const b = e.target.closest('[data-src]'); if (b) { S.src = b.dataset.src; save(); renderAll(); toast(t('toast.src', {s: SRC_NAME[S.src]})); } };
$('copyBtn').onclick = async () => {
  const tx = `${fmt(parseNum(S.conv.amt), 8)} ${nm(S.conv.from)} = ${$('result').textContent} ${nm(S.conv.to)}`;
  try { await navigator.clipboard.writeText(tx); toast(t('toast.copied')); } catch { toast(tx); }
};
$('convManualBtn').onclick = () => openManual(S.conv.from === 'IRT' ? S.conv.to : S.conv.from, S.conv.from === 'IRT' || S.conv.to === 'IRT' ? 'IRT' : S.conv.to);
$('convChartBtn').onclick = () => {
  let a = S.conv.from, q = S.conv.to; if (a === 'IRT') [a, q] = [q, a];
  S.chart.a = a; S.chart.q = q; save(); show('chart');
};

/* ---------------- manual rates */
let manualFor = null;
const unitName = u => u === 'IRT' ? t('u.toman') : AM[u] ? nm(u) : u;
function openManual(a, unit) {
  if (a === 'IRT') a = 'USD';
  manualFor = a;
  const m = S.manual[a];
  const u = m?.unit || (unit && unit !== a ? unit : (S.setBase && S.setBase !== a ? S.setBase : (a === 'IRT' ? 'USD' : 'IRT')));
  $('manualTitle').textContent = t('mn.titleFor', {a: nm(a)});
  $('manualUnit').innerHTML = baseOptions(u, [a]);
  const mkInfo = () => {
    const uu = $('manualUnit').value; const saved = S.manual[a]; delete S.manual[a];
    const online = rate(a, uu); if (saved) S.manual[a] = saved;
    $('manualInfo').innerHTML = `${esc(t('mn.q', {a: nm(a), u: unitName(uu)}))}<br>${t('mn.online')} <b>${online ? moneyTxt(online, uu) : t('mn.unknown')}</b>`;
  };
  $('manualUnit').onchange = mkInfo; mkInfo();
  $('manualVal').value = m ? String(m.v) : '';
  $('manualVal').oninput = () => { const v = parseNum($('manualVal').value); $('manualWords').textContent = isFinite(v) && words(v) ? words(v) : ''; };
  $('manualVal').oninput();
  openSheet('manualSheet');
  setTimeout(() => $('manualVal').focus(), 250);
}
$('manualSave').onclick = () => {
  const v = parseNum($('manualVal').value);
  if (!isFinite(v) || v <= 0) { toast(t('toast.badNum')); return; }
  S.manual[manualFor] = {v, unit:$('manualUnit').value, t:Date.now()}; save(); closeSheets(); renderAll(); toast(t('toast.manualOn'));
};
$('manualClear').onclick = () => { delete S.manual[manualFor]; save(); closeSheets(); renderAll(); toast(t('toast.manualOff')); };
$('clearAllManual').onclick = () => { S.manual = {}; save(); renderSettings(); renderAll(); toast(t('toast.manualAll')); };

/* ---------------- settings */
function renderSettings() {
  seg($('setLang'), Object.entries(I18N.LANGS).map(([k, v]) => [k, v.name]), I18N.lang, v => I18N.set(v));
  $('digitsRow').style.display = I18N.lang === 'fa' ? '' : 'none';
  seg($('setIran'), [['1', t('st.free')],['0', t('st.calc')]], S.iranMarket ? '1' : '0', v => { S.iranMarket = v === '1'; save(); renderSettings(); renderAll(); });
  seg($('setSrc'), SRCS.map(([k]) => [k, SRC_NAME[k] + (D.iran_by?.[k]?.USD ? ' · ' + fmt(D.iran_by[k].USD, 0) : '')]), S.src, v => { S.src = v; save(); renderSettings(); renderAll(); });
  seg($('setDigits'), [['fa','۱۲۳'],['en','123']], S.digits, v => { S.digits = v; save(); renderSettings(); renderAll(); });
  seg($('setTheme'), [['auto', t('st.auto')],['light','☀️'],['dark','🌙']], S.theme, v => { S.theme = v; save(); applyTheme(); renderSettings(); if (chart) { chart.remove(); chart = null; drawChart(true); } });
  const B = S.setBase || 'IRT';
  $('setBaseSel').innerHTML = baseOptions(B);
  $('setBaseSel').onchange = () => { S.setBase = $('setBaseSel').value; save(); renderSettings(); };
  $('manualList').innerHTML = ASSETS.filter(a => a.id !== B && a.id !== 'IRT').map(a => {
    const m = S.manual[a.id];
    const now = rate(a.id, B), mk = marketRate(a.id, B);
    const line = m ? `✍️ ${fmt(m.v)} ${esc(unitName(m.unit))} · ${t('st.online', {v: moneyTxt(mk, B)})}` : t('st.online', {v: moneyTxt(now, B)});
    return `<div class="item grp-${a.ir ? 'iran' : a.g}" data-id="${a.id}">${icon(a.id)}<div class="nm"><b>${esc(nm(a.id))}</b><span>${line}</span></div>${m ? `<span class="badge b-man">${t('st.manualBadge')}</span>` : ''}</div>`;
  }).join('');
  $('manualList').onclick = e => { const it = e.target.closest('.item'); if (it) openManual(it.dataset.id, B); };
  $('about').innerHTML = `${t('about.upd')} <b>${D.t ? new Date(D.t * 1000).toLocaleString(I18N.dateLocale(S.digits)) : '—'}</b><br>
    ${t('about.toman')} <b>${esc(SRC_NAME[S.src])}</b> ${t('about.tomanD')}<br>
    ${t('about.global')}${live._t ? t('about.liveCrypto') : ''}<br>
    ${t('about.note')}<br>
    ${t('about.charts')} <a href="https://www.tradingview.com/" target="_blank" rel="noopener">TradingView Lightweight Charts™</a><br>
    ${t('about.ver')}`;
}
$('settingsBtn').onclick = () => { renderSettings(); openSheet('settingsSheet'); };
$('closeSettings').onclick = closeSheets;
$('refreshBtn').onclick = () => { refresh(true); fetchLive(); Object.keys(chartCache).forEach(k => delete chartCache[k]); if (curView() === 'chart') drawChart(true); toast(t('toast.refreshing')); };

function applyTheme() {
  const dark = S.theme === 'dark' || (S.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]').content = dark ? '#060c18' : '#0b1f3a';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.theme === 'auto') applyTheme(); });

/* ---------------------------------------------------------------- charts */
let chart = null, series = null;
async function getChart(id) {
  const c = chartCache[id];
  if (c && Date.now() - c.at < 60000) return c.d;
  const d = await fetchJSON('charts/' + id + '.json');
  chartCache[id] = {at:Date.now(), d};
  return d;
}
async function liveKlines(a, range) {   // Binance 1m for crypto short ranges
  const bn = AM[a]?.bn; if (!bn || !['15m','1H'].includes(range)) return null;
  try {
    const r = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${bn}&interval=1m&limit=${range === '15m' ? 16 : 61}`, {cache:'no-store'});
    const j = await r.json(); const u = D.usd?.USDT || 1;
    return j.map(k => [Math.floor(k[0] / 1000), k[1] * u, k[2] * u, k[3] * u, k[4] * u]);
  } catch { return null; }
}
function atClose(bars, t) {           // close of last bar with time <= t
  let lo = 0, hi = bars.length - 1, ans = 0;
  if (!bars.length) return null;
  if (t < bars[0][0]) return bars[0][4];
  while (lo <= hi) { const m = (lo + hi) >> 1; if (bars[m][0] <= t) { ans = m; lo = m + 1; } else hi = m - 1; }
  return bars[ans][4];
}
function aggregate(bars, sec) {
  if (sec <= 60) return bars;
  const out = [];
  for (const b of bars) {
    const k = Math.floor(b[0] / sec) * sec, last = out[out.length - 1];
    if (last && last[0] === k) { last[2] = Math.max(last[2], b[2]); last[3] = Math.min(last[3], b[3]); last[4] = b[4]; }
    else out.push([k, b[1], b[2], b[3], b[4]]);
  }
  return out;
}
// USD-denominated bars of an asset for a resolution key (m1/h1/d1); 'ONE' for USD
async function usdBars(a, src, range) {
  if (a === 'USD') return 'ONE';
  if (a === 'IRT') {
    const d = await getChart('IRT');
    return (d[src] || []).map(([t, o, h, l, c]) => [t, 1 / o, 1 / l, 1 / h, 1 / c]);
  }
  if (AM[a]?.ir) {                    // synthetic: gold ounce × ratio, scaled to today's Iranian price
    const g = await usdBars('XAU', src, range);
    const nowUsd = usdP(a), gNow = usdRaw('XAU');
    if (!nowUsd || !gNow || !Array.isArray(g)) return [];
    const k = nowUsd / gNow;
    return g.map(([t, o, h, l, c]) => [t, o * k, h * k, l * k, c * k]);
  }
  const lk = await liveKlines(a, range);
  if (lk && lk.length) return lk;
  const d = await getChart(a);
  return d[src] || [];
}
async function buildSeries(a, q, rk) {
  const R = RANGES[rk];
  const [A, Q] = await Promise.all([usdBars(a, R.src, rk), usdBars(q, R.src, rk)]);
  let bars;
  if (A === 'ONE' && Q === 'ONE') return [];
  if (Q === 'ONE') bars = A;
  else if (A === 'ONE') bars = Q.map(([t, o, h, l, c]) => [t, 1 / o, 1 / l, 1 / h, 1 / c]);
  else {
    const base = A.length ? A : [];
    bars = base.map(([t, o, h, l, c]) => { const qv = atClose(Q, t); return qv ? [t, o / qv, h / qv, l / qv, c / qv] : null; }).filter(Boolean);
  }
  if (!bars.length) return [];
  bars = bars.slice().sort((x, y) => x[0] - y[0]);
  const end = bars[bars.length - 1][0];
  bars = bars.filter(b => b[0] >= end - R.span);
  bars = aggregate(bars, R.agg);
  const out = []; let lt = -1;
  for (const b of bars) if (b[0] > lt && b.slice(1).every(isFinite)) { out.push(b); lt = b[0]; }
  // Toman charts come from Tether trades / daily cash-dollar history; calibrate so the line ends at today's market price
  if ((q === 'IRT' || a === 'IRT' || AM[a]?.ir) && out.length) {
    const target = marketRate(a, q), lastC = out[out.length - 1][4];
    const f = target && lastC ? target / lastC : 1;
    if (f > 0.85 && f < 1.15 && Math.abs(f - 1) > 1e-6) return out.map(([t, o, h, l, c]) => [t, o * f, h * f, l * f, c * f]);
  }
  return out;
}
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function jdate(t, opts) { return new Intl.DateTimeFormat(I18N.dateLocale(S.digits), opts).format(new Date(t * 1000)); }
function ensureChart() {
  if (chart) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  chart = LightweightCharts.createChart($('chart'), {
    autoSize: true,
    layout: {background:{type:'solid', color:'transparent'}, textColor: dark ? '#a19dc4' : '#7a7896', fontFamily:'Vazirmatn, Tahoma, sans-serif', fontSize:11},
    grid: {vertLines:{color: dark ? 'rgba(255,255,255,.04)' : 'rgba(108,92,231,.06)'}, horzLines:{color: dark ? 'rgba(255,255,255,.05)' : 'rgba(108,92,231,.08)'}},
    rightPriceScale: {borderVisible:false, scaleMargins:{top:.12, bottom:.08}},
    timeScale: {borderVisible:false, timeVisible:true, secondsVisible:false, fixLeftEdge:true, fixRightEdge:true,
      tickMarkFormatter: (t, type) => type === 0 ? jdate(t, {year:'numeric'}) : type === 1 ? jdate(t, {month:'short'}) : type === 2 ? jdate(t, {day:'numeric', month:'short'}) : jdate(t, {hour:'2-digit', minute:'2-digit', hour12:false})},
    localization: {priceFormatter: v => fmt(v), timeFormatter: t => jdate(t, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})},
    crosshair: {mode: 0},
    handleScale: {axisPressedMouseMove:true}, handleScroll: {vertTouchDrag:false},
  });
}
let drawToken = 0;
async function drawChart(reset) {
  const {a, q, r, type} = S.chart;
  pickerBtn($('chartAssetBtn'), a);
  const cq = QUOTES().filter(([v]) => v !== a);
  if (!cq.some(([v]) => v === q)) cq.push([q, qName(q)]);
  cq.push(['__more', t('ch.more')]);
  seg($('chartQuoteSeg'), cq, q, v => {
    if (v === '__more') return openPicker(t('ch.cmpQ'), x => { S.chart.q = x; save(); drawChart(true); }, [a]);
    S.chart.q = v; save(); drawChart(true);
  });
  seg($('rangeSeg'), Object.keys(RANGES).map(k => [k, t('r.' + k)]), r, v => { S.chart.r = v; save(); drawChart(true); });
  seg($('typeSeg'), [['area', t('ch.line')],['candle', t('ch.candle')]], type, v => { S.chart.type = v; save(); drawChart(true); });
  if (q === a) { S.chart.q = a === 'USD' ? 'IRT' : 'USD'; return drawChart(reset); }
  const tok = ++drawToken;
  const msg = $('chartMsg');
  if (reset) { msg.textContent = t('ch.loading'); msg.classList.add('show'); }
  ensureChart();
  let bars = [];
  try { bars = await buildSeries(a, q, r); } catch (e) { bars = []; }
  if (tok !== drawToken) return;
  if (series) { chart.removeSeries(series); series = null; }
  if (!bars.length) {
    msg.textContent = t('ch.nodata'); msg.classList.add('show');
    $('chartStats').innerHTML = ''; $('chartLast').textContent = '—'; $('chartChg').textContent = ''; return;
  }
  msg.classList.remove('show');
  const first = bars[0][1], last = bars[bars.length - 1][4];
  const upish = last >= first;
  const up = cssVar('--up') || '#12b886', down = cssVar('--down') || '#f03e5e';
  const pf = {type:'custom', formatter: v => fmt(v), minMove: 1e-8};
  if (type === 'candle') {
    series = chart.addCandlestickSeries({upColor:up, downColor:down, borderUpColor:up, borderDownColor:down, wickUpColor:up, wickDownColor:down, priceFormat:pf});
    series.setData(bars.map(([t, o, h, l, c]) => ({time:t, open:o, high:h, low:l, close:c})));
  } else {
    const col = upish ? up : down;
    series = chart.addAreaSeries({lineColor:col, topColor:col + '55', bottomColor:col + '05', lineWidth:2, priceFormat:pf, crosshairMarkerRadius:5});
    series.setData(bars.map(([t, , , , c]) => ({time:t, value:c})));
  }
  chart.timeScale().fitContent();
  // live last price (current rate, may include manual)
  const cur = rate(a, q) ?? last;
  const chg = (last / first - 1) * 100;
  $('chartLast').innerHTML = money(cur, q);
  $('chartChg').innerHTML = `<span class="${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '▲' : '▼'} ${fmt(Math.abs(chg), 2)}${PCT()}</span> <span class="muted small">${t('ch.inLast', {r: t('r.' + r)})}</span>`;
  const hi = Math.max(...bars.map(b => b[2])), lo = Math.min(...bars.map(b => b[3]));
  const sf = v => Math.abs(v) >= 1e7 ? words(v) : fmt(v);
  $('chartStats').innerHTML = `<div>${t('ch.last')}<b>${sf(last)}</b></div><div>${t('ch.first')}<b>${sf(first)}</b></div><div>${t('ch.hi')}<b class="up">${sf(hi)}</b></div><div>${t('ch.lo')}<b class="down">${sf(lo)}</b></div>`;
  const notes = [];
  if (q === 'IRT' || a === 'IRT') notes.push(r === '1Y' ? t('ch.n1Y') : t('ch.nTether'));
  if (AM[a]?.ir) notes.push(t('ch.nGold'));
  if (isManual(a) || isManual(q)) notes.push(t('ch.nManual'));
  if (live[a] && ['15m','1H'].includes(r)) notes.push(t('b.live'));
  $('chartNote').textContent = notes.join(' · ');
}
$('chartAssetBtn').onclick = () => openPicker(t('ch.pickA'), a => { S.chart.a = a; if (S.chart.q === a) S.chart.q = a === 'USD' ? 'IRT' : 'USD'; save(); drawChart(true); }, ['IRT']);

/* ---------------------------------------------------------------- calculator */
let cExpr = '', cLast = null;
const KEYS = [['C','fn'],['⌫','fn'],['%','fn'],['÷','op'],['7'],['8'],['9'],['×','op'],['4'],['5'],['6'],['−','op'],['1'],['2'],['3'],['+','op'],['±','fn'],['0'],['.'],['=','eq']];
function evalExpr(s) {
  const m = s.match(/^(.*[\d%])([+−])(\d*\.?\d+)%$/);      // 200+5%  ->  210
  if (m) { const L = evalCore(m[1]); const p = parseFloat(m[3]) / 100; return m[2] === '+' ? L * (1 + p) : L * (1 - p); }
  return evalCore(s);
}
function evalCore(s) {               // safe shunting-yard evaluator
  const toks = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d*\.?\d+(?:e[+-]?\d+)?%?|[-+*/()]/g);
  if (!toks) return NaN;
  const out = [], ops = [], prec = {'+':1, '-':1, '*':2, '/':2, 'u':3};
  let prev = null;
  for (let t of toks) {
    if (/\d/.test(t)) { let v = parseFloat(t); if (t.endsWith('%')) v /= 100; out.push(v); prev = 'n'; continue; }
    if (t === '-' && (prev === null || prev === 'o')) t = 'u';
    while (ops.length && prec[ops[ops.length - 1]] >= prec[t] && t !== 'u') out.push(ops.pop());
    ops.push(t); prev = 'o';
  }
  while (ops.length) out.push(ops.pop());
  const st = [];
  for (const t of out) {
    if (typeof t === 'number') { st.push(t); continue; }
    if (t === 'u') { st.push(-st.pop()); continue; }
    const b = st.pop(), a = st.pop();
    if (a === undefined || b === undefined) return NaN;
    st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : a / b);
  }
  return st.length === 1 ? st[0] : NaN;
}
function calcPress(k) {
  if (k === 'C') { cExpr = ''; cLast = null; }
  else if (k === '⌫') cExpr = cExpr.slice(0, -1);
  else if (k === '=') {
    const v = evalExpr(cExpr);
    if (isFinite(v)) { S.calcHist = [{e:cExpr, v}, ...S.calcHist].slice(0, 30); save(); cLast = v; cExpr = String(+v.toPrecision(12)); }
  }
  else if (k === '±') { const m = cExpr.match(/(\d*\.?\d+%?)$/); if (m) { const i = cExpr.length - m[1].length; cExpr = cExpr[i - 1] === '−' && (i - 1 === 0 || /[+×÷−]/.test(cExpr[i - 2])) ? cExpr.slice(0, i - 1) + m[1] : cExpr.slice(0, i) + '−' + m[1]; } }
  else if ('+−×÷'.includes(k)) { if (/[+−×÷]$/.test(cExpr)) cExpr = cExpr.slice(0, -1); if (cExpr || k === '−') cExpr += k; }
  else if (k === '.') { const m = cExpr.match(/[\d.]*$/)[0]; if (!m.includes('.')) cExpr += (m ? '' : '0') + '.'; }
  else if (k === '%') { if (/\d$/.test(cExpr)) cExpr += '%'; }
  else cExpr += k;
  renderCalc();
}
function prettyExpr(s) { return s.replace(/\d*\.?\d+/g, m => m.endsWith('.') ? m : (m.includes('.') ? fmt(+m, 10) : fmt(+m, 0))); }
function renderCalc() {
  if (!$('keys').children.length) {
    $('keys').innerHTML = KEYS.map(([k, c]) => `<button class="${c || ''}" data-k="${k}">${/\d/.test(k) ? fmt(+k, 0) : k}</button>`).join('');
    $('keys').onclick = e => { const b = e.target.closest('button'); if (b) { calcPress(b.dataset.k); navigator.vibrate?.(8); } };
  }
  const v = evalExpr(cExpr);
  $('calcExpr').textContent = prettyExpr(cExpr);
  $('calcOut').textContent = cExpr === '' ? fmt(0, 0) : isFinite(v) ? fmt(v, 8) : '…';
  $('calcHist').innerHTML = S.calcHist.map((h, i) => `<div class="item" data-i="${i}"><div class="nm"><span>${esc(prettyExpr(h.e))}</span><b>= ${fmt(h.v, 8)}</b></div><span class="muted small">${t('calc.tapUse')}</span></div>`).join('') || `<p class="muted small">${t('calc.none')}</p>`;
  $('calcHist').onclick = e => { const it = e.target.closest('.item'); if (it) { cExpr = String(S.calcHist[+it.dataset.i].v); renderCalc(); window.scrollTo({top:0, behavior:'smooth'}); } };
}
document.addEventListener('keydown', e => {
  if (curView() !== 'calc' || e.target.tagName === 'INPUT') return;
  const map = {'*':'×', '/':'÷', '-':'−', 'Enter':'=', 'Backspace':'⌫', 'Escape':'C'};
  const k = map[e.key] || e.key;
  if (/^[\d.+%]$/.test(k) || '×÷−=⌫C'.includes(k)) { e.preventDefault(); calcPress(k); }
});
$('calcToConv').onclick = () => { const v = evalExpr(cExpr); if (!isFinite(v)) { toast(t('toast.calcFirst')); return; } S.conv.amt = String(v); save(); show('convert'); toast(t('toast.sentConv')); };
$('calcCopy').onclick = async () => { const v = evalExpr(cExpr); try { await navigator.clipboard.writeText(String(v)); toast(t('toast.copied')); } catch { toast(String(v)); } };

/* ---------------------------------------------------------------- boot */
function renderAll() {
  const v = curView();
  if (v === 'market') renderMarket();
  if (v === 'convert') renderConv();
  if (v === 'calc') renderCalc();
  if (v === 'chart') drawChart(false);
  if ($('settingsSheet').classList.contains('show')) renderSettings();
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => show(t.dataset.v));

let dip = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); dip = e; $('installBtn').style.display = 'inline-flex'; });
$('installBtn').onclick = async () => { if (dip) { dip.prompt(); await dip.userChoice; dip = null; $('installBtn').style.display = 'none'; } };
addEventListener('appinstalled', () => { $('installBtn').style.display = 'none'; toast(t('toast.installed')); });

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

function applyLang() {
  I18N.apply();
  $('langSlot').innerHTML = I18N.picker('lang-sel'); I18N.bindPickers();
  $('keys').innerHTML = '';                       // rebuild keypad digits
  if (chart) { chart.remove(); chart = null; series = null; }
}
addEventListener('langchange', () => { applyLang(); renderAll(); if (curView() === 'calc') renderCalc(); if (curView() === 'chart') drawChart(true); setStatus(lastOk ? 'ok' : (D.t ? 'err' : 'busy')); });
applyLang();
applyTheme();
const hv = location.hash.replace('#', '');
show(['market','chart','convert','calc'].includes(hv) ? hv : (S.view || 'market'));
refresh();
fetchLive();
setInterval(() => { if (!document.hidden) refresh(); }, 60000);
setInterval(() => { if (!document.hidden) fetchLive(); }, 12000);
setInterval(() => setStatus(lastOk ? 'ok' : (D.t ? 'err' : 'busy')), 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { refresh(); fetchLive(); } });
