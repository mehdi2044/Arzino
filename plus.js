'use strict';
/* Arzino plus: ads (house ads + AdSense), partner exchanges from Sarrafino, and user-added assets (any currency, crypto or stock).
   Loaded before app.js; everything here runs lazily, after app.js has defined ASSETS, AM, S, D. */
const PLUS = (() => {
  const SB = {url: 'https://byecgsxfoiglaozubfyx.supabase.co', key: 'sb_publishable_TAVJpLKC1x0iVFL4F0R_Gw_uKyzJS6T'};
  const rest = (path, opt = {}) => fetch(`${SB.url}/rest/v1/${path}`, {...opt, headers: {apikey: SB.key, Authorization: 'Bearer ' + SB.key, 'Content-Type': 'application/json', ...(opt.headers || {})}})
    .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)));
  const ls = {get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }};
  const L = () => I18N.lang;
  const tl = o => (o && (o[L()] || '')) || '';

  /* ================================================================ user-added assets */
  const FX = {map: ls.get('arzino.fx', {}), t: ls.get('arzino.fx_t', 0)};       // USD per unit, all ISO currencies (daily)
  const STK = {px: {}, t: 0};                                                       // USD per share for user stocks
  const curName = c => { try { return new Intl.DisplayNames([L()], {type: 'currency'}).of(c); } catch { return c; } };
  const letterIcon = (txt, a, b) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><circle cx="32" cy="32" r="31" fill="url(#g)"/><text x="32" y="${txt.length > 3 ? 38 : 41}" font-family="Arial,sans-serif" font-size="${txt.length > 3 ? 15 : 20}" font-weight="700" fill="#fff" text-anchor="middle">${txt}</text></svg>`);
  function toAsset(c) {
    if (c.kind === 'fiat') return {id: c.id, en: c.code, sym: c.code, g: 'fiat', ic: letterIcon(c.code, '#163a66', '#0fa47a'), custom: c};
    if (c.kind === 'crypto') return {id: c.id, en: c.sym, sym: c.sym, g: 'crypto', bn: c.sym + 'USDT', ic: letterIcon(c.sym.slice(0, 4), '#7a4dff', '#d9a521'), custom: c};
    return {id: c.id, en: c.sym, sym: c.cur || '$', g: 'stock', ic: letterIcon(c.sym.replace(/\..*$/, '').slice(0, 4), '#0b1f3a', '#d9a521'), custom: c};
  }
  function injectCustom() {
    S.custom = Array.isArray(S.custom) ? S.custom : [];
    for (const c of S.custom) if (!AM[c.id]) { const a = toAsset(c); ASSETS.push(a); AM[a.id] = a; }
  }
  const customName = id => { const c = AM[id]?.custom; if (!c) return null; return c.kind === 'fiat' ? curName(c.code) : (c.name || c.sym); };
  function customUsd(id) {
    const c = AM[id]?.custom; if (!c) return null;
    if (c.kind === 'fiat') return FX.map[c.code] ?? null;
    if (c.kind === 'stock') return STK.px[c.sym]?.usd ?? c.last ?? null;
    return null;   // crypto comes through the live Binance feed
  }
  async function loadFx(force) {
    if (!force && Date.now() - FX.t < 6 * 3600e3 && Object.keys(FX.map).length) return;
    try {
      const j = await fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json());
      if (j?.rates) { FX.map = Object.fromEntries(Object.entries(j.rates).map(([k, v]) => [k, 1 / v])); FX.t = Date.now(); ls.set('arzino.fx', FX.map); ls.set('arzino.fx_t', FX.t); }
    } catch {}
  }
  // stocks need a small proxy (/api/q) that only exists on the Cloudflare site
  async function quote(syms) {
    const r = await fetch('api/q?s=' + encodeURIComponent(syms.join(',')), {cache: 'no-store'});
    if (!r.ok) throw new Error('proxy'); return r.json();
  }
  async function loadStocks() {
    const list = S.custom.filter(c => c.kind === 'stock'); if (!list.length) return;
    try {
      const j = await quote(list.map(c => c.sym));
      for (const [s, q] of Object.entries(j)) {
        const fx = q.cur === 'USD' ? 1 : (FX.map[q.cur] ?? (q.cur === 'GBp' ? (FX.map.GBP || 0) / 100 : null));
        if (fx) STK.px[s] = {usd: q.price * fx, chg: q.chg};
        const c = S.custom.find(x => x.sym === s); if (c && fx) c.last = q.price * fx;
      }
      STK.t = Date.now(); save();
    } catch {}
  }
  async function customBars(a, src, range) {
    const c = AM[a]?.custom; if (!c) return null;
    if (c.kind === 'crypto') {
      const iv = {m1: '1m', h1: '1h', d1: '1d'}[src], lim = {m1: 1000, h1: 800, d1: 400}[src];
      try { const j = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${c.sym}USDT&interval=${iv}&limit=${lim}`).then(r => r.json()); const u = D.usd?.USDT || 1;
        return j.map(k => [Math.floor(k[0] / 1000), k[1] * u, k[2] * u, k[3] * u, k[4] * u]); } catch { return []; }
    }
    if (c.kind === 'stock') {
      try { const j = await fetch(`api/q?s=${encodeURIComponent(c.sym)}&chart=${src}`).then(r => r.json()); const fx = customUsd(a) && j.last ? customUsd(a) / j.last : 1;
        return (j.bars || []).map(([t, o, h, l, cl]) => [t, o * fx, h * fx, l * fx, cl * fx]); } catch { return []; }
    }
    return [];      // other currencies: daily reference rate only, no intraday chart
  }

  function addSheet() {
    let tab = 'fiat';
    const sheet = document.createElement('div'); sheet.className = 'sheet tall show'; sheet.id = 'addSheet';
    document.body.appendChild(sheet); $('sheetBg').classList.add('show');
    let done = false;
    const close = fromNav => { if (done) return; done = true; sheet.remove(); $('sheetBg').classList.remove('show'); if (fromNav !== true) NAV.closed('sheet'); renderAll(); };
    $('sheetBg').addEventListener('click', close, {once: true});
    NAV.opened('sheet', () => close(true));
    const draw = () => {
      const mine = S.custom.map(c => `<div class="item mini-it"><span class="ic"><img src="${AM[c.id]?.ic}" alt=""></span><div class="nm"><b>${esc(customName(c.id))}</b><span>${esc(c.code || c.sym)} · ${t('ad.k.' + c.kind)}</span></div><button class="btn ghost sm" data-rm="${c.id}">✕</button></div>`).join('');
      sheet.innerHTML = `<div class="sheet-grip"></div><h2>➕ ${t('ad.add')}${HELP.btn('arzino.add')}</h2>
        <div class="seg" id="adTab">${['fiat', 'crypto', 'stock'].map(k => `<button class="${tab === k ? 'active' : ''}" data-k="${k}">${t('ad.k.' + k)}</button>`).join('')}</div>
        <input class="input" id="adQ" placeholder="${t('ad.ph.' + tab)}" autocomplete="off" ${tab === 'fiat' ? '' : 'style="text-transform:uppercase"'}>
        <div class="muted small" style="margin:6px 2px">${t('ad.hint.' + tab)}</div>
        <div class="list compact" id="adRes"></div>
        ${mine ? `<h3 class="sec-title">${t('ad.mine')}</h3><div class="list compact">${mine}</div>` : ''}
        <div class="btn-row"><button class="btn ghost" id="adX">${t('st.close')}</button></div>`;
      sheet.querySelector('#adX').onclick = close;
      sheet.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { tab = b.dataset.k; draw(); });
      sheet.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removeCustom(b.dataset.rm); draw(); });
      const q = sheet.querySelector('#adQ'), res = sheet.querySelector('#adRes');
      const fiatList = s => {
        const have = new Set(ASSETS.map(a => a.custom?.code || a.id));
        const codes = Object.keys(FX.map).filter(c => !have.has(c) && c !== 'USD');
        const hits = codes.map(c => [c, curName(c)]).filter(([c, n]) => !s || (c + ' ' + n).toLowerCase().includes(s.toLowerCase())).slice(0, 40);
        res.innerHTML = hits.map(([c, n]) => `<div class="item mini-it" data-add="${c}"><span class="ic"><img src="${letterIcon(c, '#163a66', '#0fa47a')}" alt=""></span><div class="nm"><b>${esc(n)}</b><span>${c}</span></div><b>＋</b></div>`).join('') || `<p class="muted">${Object.keys(FX.map).length ? t('ad.none') : t('ad.loading')}</p>`;
        res.querySelectorAll('[data-add]').forEach(r => r.onclick = () => { addCustom({kind: 'fiat', code: r.dataset.add}); draw(); });
      };
      let timer;
      const lookup = async s => {
        s = s.trim().toUpperCase(); if (!s) { res.innerHTML = ''; return; }
        res.innerHTML = `<p class="muted">${t('ad.checking')}</p>`;
        try {
          if (tab === 'crypto') {
            const sym = s.replace(/USDT$/, '');
            const j = await fetch(`https://data-api.binance.vision/api/v3/ticker/price?symbol=${sym}USDT`).then(r => r.json());
            if (!j.price) throw 0;
            res.innerHTML = `<div class="item mini-it" data-ok><span class="ic"><img src="${letterIcon(sym.slice(0, 4), '#7a4dff', '#d9a521')}" alt=""></span><div class="nm"><b>${sym}</b><span>$${fmt(+j.price)}</span></div><b>＋</b></div>`;
            res.querySelector('[data-ok]').onclick = () => { addCustom({kind: 'crypto', sym, name: sym}); draw(); };
          } else {
            const j = await quote([s]); const x = j[s]; if (!x) throw 0;
            res.innerHTML = `<div class="item mini-it" data-ok><span class="ic"><img src="${letterIcon(s.replace(/\..*$/, '').slice(0, 4), '#0b1f3a', '#d9a521')}" alt=""></span><div class="nm"><b>${esc(x.name || s)}</b><span>${s} · ${fmt(x.price)} ${esc(x.cur)}</span></div><b>＋</b></div>`;
            res.querySelector('[data-ok]').onclick = () => { addCustom({kind: 'stock', sym: s, name: x.name || s, cur: x.cur}); draw(); };
          }
        } catch (e) { res.innerHTML = `<p class="muted">${tab === 'stock' && String(e?.message) === 'proxy' ? t('ad.stockSoon') : t('ad.notFound')}</p>`; }
      };
      if (tab === 'fiat') { fiatList(''); q.oninput = () => fiatList(q.value.trim()); loadFx().then(() => fiatList(q.value.trim())); }
      else q.oninput = () => { clearTimeout(timer); timer = setTimeout(() => lookup(q.value), 450); };
      q.focus();
    };
    draw();
  }
  function addCustom(c) {
    c.id = 'X_' + (c.code || c.sym).replace(/[^A-Z0-9]/gi, '_');
    if (S.custom.some(x => x.id === c.id) || AM[c.id]) return toast(t('ad.exists'));
    S.custom.push(c); const a = toAsset(c); ASSETS.push(a); AM[a.id] = a;
    if (!S.favs.includes(c.id)) S.favs.push(c.id);
    save(); toast(t('ad.added', {n: customName(c.id)}));
    if (c.kind === 'crypto') fetchLive(); if (c.kind === 'stock') loadStocks();
  }
  function removeCustom(id) {
    S.custom = S.custom.filter(c => c.id !== id); S.favs = S.favs.filter(x => x !== id);
    const i = ASSETS.findIndex(a => a.id === id); if (i >= 0) ASSETS.splice(i, 1); delete AM[id];
    if (S.conv.from === id) S.conv.from = 'USD'; if (S.conv.to === id) S.conv.to = 'IRT'; if (S.chart.a === id) S.chart.a = 'USD';
    save();
  }

  /* ================================================================ dedicated Arzino of one exchange office (?x=short-name) */
  const WLK = (() => { try { const q = new URLSearchParams(location.search).get('x');
    if (q === 'off') { localStorage.removeItem('arzino.wl'); localStorage.removeItem('arzino.wl_d'); return ''; }
    if (q) localStorage.setItem('arzino.wl', q); return q || localStorage.getItem('arzino.wl') || ''; } catch { return ''; } })();
  let WLD = ls.get('arzino.wl_d', null); if (!WLK || (WLD && WLD.key !== WLK)) WLD = null;
  if (WLK) document.documentElement.classList.add('wl-mode');
  window.WL_OV = {usd: {}, irt: {}, t: 0};
  const baseUsd = c => c === 'USD' ? 1 : c === 'IRT' ? (D.iran?.USD ? 1 / D.iran.USD : null) : (D.usd?.[c] ?? null);
  function wlApply() {
    if (!WLD) return;
    window.WL_OV = WLX.overrides(WLD, baseUsd);
    const letter = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7d77a"/><stop offset="1" stop-color="#b7811a"/></linearGradient></defs><rect width="96" height="96" rx="24" fill="#0b1f3a"/><circle cx="48" cy="48" r="34" fill="url(#g)"/><text x="48" y="61" font-family="Vazirmatn,Arial" font-size="38" font-weight="900" text-anchor="middle" fill="#0b1f3a">${esc((WLD.name || '?').trim()[0])}</text></svg>`);
    BRAND.override('arzino', {name: WLD.name, logo: WLD.logo || letter}); if (typeof applyBrand === 'function') applyBrand();
    const abs = u => new URL(u, location.href).href;
    const man = {name: WLD.name, short_name: WLD.name, start_url: location.origin + location.pathname + '?x=' + encodeURIComponent(WLK), scope: location.origin + location.pathname,
      display: 'standalone', background_color: '#0b1f3a', theme_color: '#0b1f3a',
      icons: WLD.logo ? [{src: WLD.logo, sizes: '256x256', type: 'image/png', purpose: 'any'}] : [{src: abs('icons/app-192.png'), sizes: '192x192', type: 'image/png'}, {src: abs('icons/app-512.png'), sizes: '512x512', type: 'image/png'}]};
    const ml = document.querySelector('link[rel=manifest]'); if (ml) ml.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(man));
    const ai = document.querySelector('link[rel=apple-touch-icon]'); if (ai && WLD.logo) ai.href = WLD.logo;
  }
  async function loadWL() {
    if (!WLK) return;
    try {
      const d = await rest('rpc/public_wl', {method: 'POST', body: JSON.stringify({p_key: WLK})});
      if (!d) {                                   // link no longer valid (package ended): back to the normal Arzino
        localStorage.removeItem('arzino.wl'); ls.set('arzino.wl_d', null); WLD = null; window.WL_OV = {usd: {}, irt: {}, t: 0};
        document.documentElement.classList.remove('wl-mode'); BRAND.override('arzino', null); if (typeof applyBrand === 'function') applyBrand(); renderAll(); return;
      }
      WLD = {...d, key: WLK}; ls.set('arzino.wl_d', WLD); wlApply(); renderAll();
    } catch {}
  }
  const cname = c => I18N.has('s.' + c) ? t('s.' + c) : c;
  function wlBoard() {
    if (!WLD || WLD.show_board === false) return '';
    const m = WLX.merge(D, window.WL_OV);
    const rows = (WLD.rows && WLD.rows.length ? WLD.rows : [['USD', 'TRY'], ['EUR', 'TRY'], ['USDT', 'TRY'], ['USD', 'IRT']])
      .map(([c, q]) => ({c, q, r: AUTORATE.rate(m, WLD.auto, c, q, (WLD.rates || []).find(x => x.ccy === c && x.quote === q))})).filter(x => x.r && (x.r.buy || x.r.sell));
    if (!rows.length) return '';
    const wa = (WLD.phone || '').replace(/[^\d]/g, '').replace(/^0(5\d{9})$/, '90$1');
    return `<div class="wlb"><div class="wlh"><span class="xl">${WLD.logo ? `<img src="${esc(WLD.logo)}" alt="">` : esc((WLD.name || '?').trim()[0])}</span><div><b>${esc(WLD.name)}</b><span>${t('wl.today')}</span></div>
        ${wa ? `<a class="btn sm wa" href="https://wa.me/${wa}" target="_blank" rel="noopener">💬 ${t('ad.wa')}</a>` : ''}</div>
      <div class="xr hd"><span></span><b>${t('wl.buy')}</b><b>${t('wl.sell')}</b></div>
      ${rows.map(({c, q, r}) => `<div class="xr"><span>${esc(cname(c))} → ${esc(cname(q))}</span><b class="up">${fmt(+r.buy)}</b><b class="down">${fmt(+r.sell)}</b></div>`).join('')}
      ${WLD.note || WLD.address ? `<p class="muted small" style="margin:8px 2px 0">${esc(WLD.note || '')}${WLD.note && WLD.address ? ' · ' : ''}${WLD.address ? '📍 ' + esc(WLD.address) : ''}</p>` : ''}</div>`;
  }

  /* ================================================================ partner exchanges (Sarrafino directory) */
  let DIR = ls.get('arzino.dir', {t: 0, list: []});
  let MKT = null;                                   // market data for exchanges whose board is automatic
  async function loadDir() {
    if (Date.now() - DIR.t < 10 * 60e3) return;
    try { const list = await rest('rpc/public_directory', {method: 'POST', body: '{}'}); DIR = {t: Date.now(), list: Array.isArray(list) ? list : []}; ls.set('arzino.dir', DIR);
      if (DIR.list.some(x => AUTORATE.isAuto(x.auto))) MKT = await AUTORATE.market();
      if (curView() === 'market') renderMarket(); } catch {}
  }
  function dirHTML() {
    const list = DIR.list || [];
    if (!MKT && !dirHTML.busy && list.some(x => AUTORATE.isAuto(x.auto))) { dirHTML.busy = 1; AUTORATE.market().then(m => { MKT = m; if (m && curView() === 'market') renderMarket(); }); }
    const wa = p => (p || '').replace(/[^\d]/g, '').replace(/^0(5\d{9})$/, '90$1');
    const cards = list.slice(0, 12).map(x => {
      const saved = (c, q) => (x.rates || []).find(r => r.ccy === c && r.quote === q);
      const pairs = x.rows && x.rows.length ? x.rows : (x.rates || []).map(r => [r.ccy, r.quote]);
      const rows = pairs.map(([c, q]) => AUTORATE.rate(MKT, x.auto, c, q, saved(c, q))).filter(r => r && (r.buy || r.sell)).map(r => ({...r, ccy: r.ccy || '', quote: r.quote || ''})).slice(0, 3);
      return `<div class="xcard"><div class="xh">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : `<span class="xl">${esc((x.name || '?').trim()[0])}</span>`}<div><b>${esc(x.name)}</b><span>${esc(x.city || '')}</span></div><em class="spons">${t('ad.partner')}</em></div>
        ${rows.map(r => `<div class="xr"><span>${esc(r.ccy)} → ${esc(r.quote)}</span><b class="up">${fmt(+r.buy)}</b><b class="down">${fmt(+r.sell)}</b></div>`).join('')}
        <div class="xa">${x.phone ? `<a class="btn sm wa" href="https://wa.me/${wa(x.phone)}" target="_blank" rel="noopener">💬 ${t('ad.wa')}</a>` : ''}<a class="btn sm ghost" href="sarraf/board.html?ex=${x.id}&lang=${L()}" target="_blank" rel="noopener">📺 ${t('ad.board')}</a></div></div>`;
    }).join('');
    return `<div class="xsec"><h3 class="sec-title">🏪 ${t('ad.partners')}${HELP.btn('arzino.partners')}</h3><div class="xrow">${cards}
      <a class="xcard join" href="sarrafino/"><div style="font-size:30px">➕</div><b>${t('ad.joinT')}</b><span class="muted small">${t('ad.joinD')}</span></a></div></div>`;
  }

  /* ================================================================ ads */
  const DEF_CFG = {enabled: true, adfree_for_subscribers: true, adsense: {client: '', langs: ['tr', 'en', 'ar']}, banner: {on: true}, feed: {on: true, every: 8}, converter: {on: true},
    interstitial: {on: true, after_actions: 6, first_after_opens: 2, min_minutes: 5, countdown: 5, max_per_day: 6}, reward: {on: true, hours: 24, countdown: 15}};
  const DEF_ADS = [{id: 'local-sarrafino', advertiser: 'Sarrafino', link: 'sarrafino/', placements: ['banner', 'feed', 'converter', 'interstitial'], weight: 1,
    title: {fa: 'صرافی دارید؟ حسابش را با صرافینو نگه دارید', tr: 'Döviz büronuz mu var? Hesabını Sarrafino ile tutun', en: 'Run an exchange office? Keep its books with Sarrafino', ar: 'لديك مكتب صرافة؟ نظّم حساباته مع صرافينو'},
    body: {fa: 'معامله، طلب و بدهی مشتری، صندوق‌ها، رسید واتس‌اپ و تابلوی نرخ — رایگان شروع کنید.', tr: 'İşlemler, müşteri bakiyeleri, kasalar, WhatsApp makbuzu ve kur panosu — ücretsiz başlayın.', en: 'Trades, customer balances, cash boxes, WhatsApp receipts and a rate board — start free.', ar: 'المعاملات وذمم العملاء والصناديق وإيصالات واتساب ولوحة الأسعار — ابدأ مجاناً.'},
    cta: {fa: 'شروع رایگان', tr: 'Ücretsiz başla', en: 'Start free', ar: 'ابدأ مجاناً'}}];
  let CFG = ls.get('arzino.adcfg', null) || DEF_CFG, ADS = ls.get('arzino.ads', null) || DEF_ADS, adT = ls.get('arzino.ad_t', 0);
  const st = ls.get('arzino.adstate', {opens: 0, actions: 0, last: 0, day: '', n: 0});
  st.opens++; saveSt();
  function saveSt() { ls.set('arzino.adstate', st); }
  async function loadAds() {
    if (Date.now() - adT < 30 * 60e3) return;
    try {
      const [cfg, ads] = await Promise.all([rest('platform_settings?select=value&key=eq.ads'), rest('house_ads?select=id,advertiser,title,body,cta,image,link,langs,placements,weight&active=eq.true')]);
      if (cfg[0]?.value) CFG = {...DEF_CFG, ...cfg[0].value};
      ADS = ads.length ? ads : DEF_ADS; adT = Date.now();
      ls.set('arzino.adcfg', CFG); ls.set('arzino.ads', ADS); ls.set('arzino.ad_t', adT);
      if (curView() === 'market') renderMarket();
    } catch {}
  }
  const adFree = () => !!WLK || !CFG.enabled || Number(localStorage.getItem('arzino.adfree_until') || 0) > Date.now();
  const useAdsense = () => CFG.adsense?.client && (CFG.adsense.langs || []).includes(L());
  function pick(place) {
    const list = ADS.filter(a => (a.placements || []).includes(place) && tl(a.title));
    if (!list.length) return null;
    let r = Math.random() * list.reduce((s, a) => s + Math.max(1, a.weight || 1), 0);
    for (const a of list) { r -= Math.max(1, a.weight || 1); if (r <= 0) return a; }
    return list[0];
  }
  const seen = new Set();
  function hit(ad, click) {
    if (!ad || String(ad.id).startsWith('local')) return;
    if (!click) { const k = ad.id + location.hash; if (seen.has(k)) return; seen.add(k); }
    rest('rpc/ad_hit', {method: 'POST', body: JSON.stringify({p_id: ad.id, p_click: !!click})}).catch(() => {});
  }
  function houseHTML(ad, cls) {
    return `<a class="adcard ${cls}" href="${esc(ad.link || '#')}" ${/^https?:/.test(ad.link || '') ? 'target="_blank" rel="noopener sponsored"' : ''} data-ad="${esc(ad.id)}">
      <em class="adtag">${t('ad.tag')}</em>${ad.image ? `<img src="${esc(ad.image)}" alt="" loading="lazy">` : '<span class="adic">🏦</span>'}
      <div class="adtx"><b>${esc(tl(ad.title))}</b>${tl(ad.body) ? `<span>${esc(tl(ad.body))}</span>` : ''}</div>${tl(ad.cta) ? `<span class="adcta">${esc(tl(ad.cta))}</span>` : ''}</a>`;
  }
  let gsLoaded = false;
  function adsenseHTML(slot) {
    if (!gsLoaded) { gsLoaded = true; const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CFG.adsense.client); document.head.appendChild(s); }
    return `<div class="adcard gs"><em class="adtag">${t('ad.tag')}</em><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.adsense.client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
  }
  function slot(place) {           // html for one inline ad slot
    if (adFree() || !CFG[place]?.on) return '';
    const gslot = place === 'feed' ? CFG.adsense?.slot_feed : CFG.adsense?.slot_banner;
    if (useAdsense() && gslot && place !== 'converter') return adsenseHTML(gslot);
    const ad = pick(place); return ad ? houseHTML(ad, place) : '';
  }
  function afterRender(root) {      // count impressions, clicks and start Google slots
    root.querySelectorAll('.adcard[data-ad]').forEach(el => { const ad = ADS.find(a => String(a.id) === el.dataset.ad); hit(ad); el.onclick = () => hit(ad, true); });
    root.querySelectorAll('ins.adsbygoogle:not([data-done])').forEach(el => { el.dataset.done = 1; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} });
  }
  // full-screen ad with a countdown — house/sponsor ads only (Google does not allow its ads in pop-ups)
  function overlay(ad, secs, done, reward) {
    const o = document.createElement('div'); o.className = 'adov';
    o.innerHTML = `<div class="adbox"><div class="adtop"><em class="adtag">${t(reward ? 'ad.reward' : 'ad.tag')}</em><button class="adx" disabled><span id="adCnt">${secs}</span></button></div>${houseHTML(ad, 'big')}</div>`;
    document.body.appendChild(o); hit(ad); o.querySelector('.adcard').onclick = () => hit(ad, true);
    const x = o.querySelector('.adx'); let n = secs;
    const tick = setInterval(() => { n--; if (n > 0) { o.querySelector('#adCnt').textContent = n; return; }
      clearInterval(tick); x.disabled = false; x.innerHTML = '✕ ' + t('ad.close'); }, 1000);
    x.onclick = () => { if (x.disabled) return; o.remove(); done && done(); };
  }
  function action() {               // a user action; may trigger a full-screen ad
    const c = CFG.interstitial || {}; if (adFree() || !c.on) return;
    const today = new Date().toDateString(); if (st.day !== today) { st.day = today; st.n = 0; }
    st.actions++; saveSt();
    if (st.opens < (c.first_after_opens || 0) || st.actions < (c.after_actions || 6) || st.n >= (c.max_per_day || 6) || Date.now() - st.last < (c.min_minutes || 5) * 60e3) return;
    const ad = pick('interstitial'); if (!ad) return;
    st.actions = 0; st.last = Date.now(); st.n++; saveSt();
    setTimeout(() => overlay(ad, Math.max(1, c.countdown || 5)), 400);
  }
  function rewardHTML() {
    const until = Number(localStorage.getItem('arzino.adfree_until') || 0);
    if (!CFG.enabled || WLK) return '';
    return `<div class="set"><div><b>📣 ${t('ad.set')}</b><div class="muted small">${until > Date.now() ? t('ad.freeUntil', {d: new Date(until).toLocaleString(I18N.dateLocale(S.digits), {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}) : t('ad.setD', {h: CFG.reward?.hours || 24})}</div></div>
      ${CFG.reward?.on && until <= Date.now() ? `<button class="btn alt sm" id="rwGo">🎁 ${t('ad.watch')}</button>` : ''}</div>`;
  }
  function bindReward() {
    const b = document.getElementById('rwGo'); if (!b) return;
    b.onclick = () => { const ad = pick('interstitial') || DEF_ADS[0]; closeSheets(); overlay(ad, Math.max(5, CFG.reward?.countdown || 15), () => {
      localStorage.setItem('arzino.adfree_until', String(Date.now() + (CFG.reward?.hours || 24) * 3600e3)); toast(t('ad.thanks', {h: CFG.reward?.hours || 24})); renderAll(); }, true); };
  }

  function start() {
    loadFx().then(() => { if (S.custom.some(c => c.kind === 'fiat')) renderAll(); loadStocks().then(() => renderAll()); });
    if (WLK) { wlApply(); loadWL(); setInterval(loadWL, 60e3); } else { loadAds(); loadDir(); }
    setInterval(() => { loadStocks().then(() => { if (curView() === 'market') renderMarket(); }); if (!WLK) { loadDir(); loadAds(); } loadFx(); }, 90e3);
  }
  return {injectCustom, customName, customUsd, customBars, addSheet, dirHTML, slot, afterRender, action, rewardHTML, bindReward, start, feedEvery: () => CFG.feed?.every || 8, hasDir: () => !WLK,
    wlBoard, wlApply, isWL: () => !!WLK};
})();

I18N.add({
fa: {'wl.today': 'نرخ خرید و فروش امروز ما', 'wl.buy': 'خرید', 'wl.sell': 'فروش'},
tr: {'wl.today': 'Bugünkü alış ve satış kurlarımız', 'wl.buy': 'Alış', 'wl.sell': 'Satış'},
en: {'wl.today': 'Our buy and sell rates today', 'wl.buy': 'Buy', 'wl.sell': 'Sell'},
ar: {'wl.today': 'أسعار الشراء والبيع لدينا اليوم', 'wl.buy': 'شراء', 'wl.sell': 'بيع'},
});
I18N.add({
fa: {'g.stock': '📈 سهام', 'ad.add': 'افزودن ارز، رمزارز یا سهام', 'ad.k.fiat': 'ارز', 'ad.k.crypto': 'رمزارز', 'ad.k.stock': 'سهام', 'ad.ph.fiat': 'جستجو: روپیه، PKR، ون…', 'ad.ph.crypto': 'نماد، مثلاً SOL یا DOGE', 'ad.ph.stock': 'نماد، مثلاً AAPL یا THYAO.IS یا 2222.SR',
  'ad.hint.fiat': 'همه‌ی ارزهای دنیا با نرخ مرجع روزانه.', 'ad.hint.crypto': 'هر رمزارزی که در بایننس با تتر معامله می‌شود؛ قیمت زنده.', 'ad.hint.stock': 'سهام بورس‌های دنیا؛ برای بورس استانبول ‎.IS و عربستان ‎.SR را بگذارید.',
  'ad.mine': 'افزوده‌های شما', 'ad.none': 'موردی پیدا نشد', 'ad.loading': 'در حال دریافت فهرست ارزها…', 'ad.checking': 'در حال بررسی…', 'ad.notFound': 'این نماد پیدا نشد.', 'ad.stockSoon': 'سهام بعد از انتقال برنامه به آدرس جدید فعال می‌شود.',
  'ad.exists': 'این مورد قبلاً اضافه شده', 'ad.added': '«{n}» اضافه شد و در منتخب‌ها هست ⭐', 'ad.partners': 'صرافی‌های همکار', 'ad.partner': 'همکار', 'ad.wa': 'واتس‌اپ', 'ad.board': 'تابلو', 'ad.joinT': 'صرافی دارید؟', 'ad.joinD': 'اینجا با نرخ‌هایتان دیده شوید',
  'ad.tag': 'تبلیغ', 'ad.reward': 'تبلیغ · هدیه', 'ad.close': 'بستن', 'ad.set': 'تبلیغات', 'ad.setD': 'با دیدن یک تبلیغ، {h} ساعت بدون تبلیغ', 'ad.freeUntil': 'بدون تبلیغ تا {d}', 'ad.watch': 'دیدن تبلیغ', 'ad.thanks': 'ممنون! {h} ساعت بدون تبلیغ 🎉', 'ad.addBtn': '＋ افزودن'},
tr: {'g.stock': '📈 Hisseler', 'ad.add': 'Döviz, kripto veya hisse ekle', 'ad.k.fiat': 'Döviz', 'ad.k.crypto': 'Kripto', 'ad.k.stock': 'Hisse', 'ad.ph.fiat': 'Ara: rupi, PKR, won…', 'ad.ph.crypto': 'Sembol, ör. SOL veya DOGE', 'ad.ph.stock': 'Sembol, ör. AAPL, THYAO.IS veya 2222.SR',
  'ad.hint.fiat': 'Dünyanın tüm para birimleri, günlük referans kuruyla.', 'ad.hint.crypto': 'Binance’te USDT ile işlem gören her kripto; canlı fiyat.', 'ad.hint.stock': 'Dünya borsalarındaki hisseler; Borsa İstanbul için .IS, Suudi için .SR ekleyin.',
  'ad.mine': 'Eklediğiniz', 'ad.none': 'Sonuç yok', 'ad.loading': 'Para birimleri alınıyor…', 'ad.checking': 'Kontrol ediliyor…', 'ad.notFound': 'Bu sembol bulunamadı.', 'ad.stockSoon': 'Hisseler, uygulama yeni adrese taşındıktan sonra açılacak.',
  'ad.exists': 'Zaten eklenmiş', 'ad.added': '«{n}» eklendi ve favorilerde ⭐', 'ad.partners': 'Anlaşmalı bürolar', 'ad.partner': 'Partner', 'ad.wa': 'WhatsApp', 'ad.board': 'Pano', 'ad.joinT': 'Döviz büronuz mu var?', 'ad.joinD': 'Kurlarınızla burada görünün',
  'ad.tag': 'Reklam', 'ad.reward': 'Reklam · hediye', 'ad.close': 'Kapat', 'ad.set': 'Reklamlar', 'ad.setD': 'Bir reklam izleyin, {h} saat reklamsız', 'ad.freeUntil': '{d} tarihine kadar reklamsız', 'ad.watch': 'Reklam izle', 'ad.thanks': 'Teşekkürler! {h} saat reklamsız 🎉', 'ad.addBtn': '＋ Ekle'},
en: {'g.stock': '📈 Stocks', 'ad.add': 'Add a currency, crypto or stock', 'ad.k.fiat': 'Currency', 'ad.k.crypto': 'Crypto', 'ad.k.stock': 'Stock', 'ad.ph.fiat': 'Search: rupee, PKR, won…', 'ad.ph.crypto': 'Symbol, e.g. SOL or DOGE', 'ad.ph.stock': 'Symbol, e.g. AAPL, THYAO.IS or 2222.SR',
  'ad.hint.fiat': 'Every currency in the world, at the daily reference rate.', 'ad.hint.crypto': 'Any crypto traded against USDT on Binance; live price.', 'ad.hint.stock': 'Stocks on world exchanges; add .IS for Borsa Istanbul and .SR for Saudi.',
  'ad.mine': 'Your additions', 'ad.none': 'Nothing found', 'ad.loading': 'Loading currencies…', 'ad.checking': 'Checking…', 'ad.notFound': 'Symbol not found.', 'ad.stockSoon': 'Stocks will work once the app moves to its new address.',
  'ad.exists': 'Already added', 'ad.added': '“{n}” added to your favorites ⭐', 'ad.partners': 'Partner exchanges', 'ad.partner': 'Partner', 'ad.wa': 'WhatsApp', 'ad.board': 'Board', 'ad.joinT': 'Own an exchange office?', 'ad.joinD': 'Get listed here with your rates',
  'ad.tag': 'Ad', 'ad.reward': 'Ad · reward', 'ad.close': 'Close', 'ad.set': 'Ads', 'ad.setD': 'Watch one ad for {h} hours without ads', 'ad.freeUntil': 'Ad-free until {d}', 'ad.watch': 'Watch ad', 'ad.thanks': 'Thanks! {h} hours without ads 🎉', 'ad.addBtn': '＋ Add'},
ar: {'g.stock': '📈 الأسهم', 'ad.add': 'إضافة عملة أو عملة رقمية أو سهم', 'ad.k.fiat': 'عملة', 'ad.k.crypto': 'عملة رقمية', 'ad.k.stock': 'سهم', 'ad.ph.fiat': 'بحث: روبية، PKR، وون…', 'ad.ph.crypto': 'الرمز، مثلاً SOL أو DOGE', 'ad.ph.stock': 'الرمز، مثلاً AAPL أو THYAO.IS أو 2222.SR',
  'ad.hint.fiat': 'كل عملات العالم بسعر مرجعي يومي.', 'ad.hint.crypto': 'أي عملة رقمية تُتداول مقابل USDT في بينانس؛ سعر مباشر.', 'ad.hint.stock': 'أسهم البورصات العالمية؛ أضف ‎.IS لبورصة إسطنبول و‎.SR للسعودية.',
  'ad.mine': 'ما أضفته', 'ad.none': 'لا توجد نتائج', 'ad.loading': 'جارٍ جلب قائمة العملات…', 'ad.checking': 'جارٍ التحقق…', 'ad.notFound': 'لم يُعثر على هذا الرمز.', 'ad.stockSoon': 'ستعمل الأسهم بعد نقل التطبيق إلى العنوان الجديد.',
  'ad.exists': 'مضاف مسبقاً', 'ad.added': 'أُضيف «{n}» إلى المفضلة ⭐', 'ad.partners': 'مكاتب صرافة شريكة', 'ad.partner': 'شريك', 'ad.wa': 'واتساب', 'ad.board': 'اللوحة', 'ad.joinT': 'لديك مكتب صرافة؟', 'ad.joinD': 'اظهر هنا بأسعارك',
  'ad.tag': 'إعلان', 'ad.reward': 'إعلان · مكافأة', 'ad.close': 'إغلاق', 'ad.set': 'الإعلانات', 'ad.setD': 'شاهد إعلاناً واحداً لتتصفح {h} ساعة دون إعلانات', 'ad.freeUntil': 'دون إعلانات حتى {d}', 'ad.watch': 'شاهد إعلاناً', 'ad.thanks': 'شكراً! {h} ساعة دون إعلانات 🎉', 'ad.addBtn': '＋ إضافة'},
});
