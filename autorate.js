'use strict';
/* Auto board rates: buy = market × (1 − buy%), sell = market × (1 + sell%), rounded like the exchange chose.
   One formula for the exchange panel, the board image, the live TV board and Arzino's partner list,
   so every place shows the same numbers. Market data: the shared latest.json (refreshed every few minutes). */
const AUTORATE = (() => {
  const URL_ = 'https://raw.githubusercontent.com/mehdi2044/arzino/data/latest.json';
  let cache = null, at = 0;
  async function market() {
    if (cache && Date.now() - at < 60e3) return cache;
    try { cache = await (await fetch(URL_ + '?t=' + Math.floor(Date.now() / 60000), {cache: 'no-store'})).json(); at = Date.now(); } catch (e) {}
    return cache;
  }
  function usdOf(m, c) {
    if (!m) return null;
    if (c === 'USD') return 1;
    if (c === 'IRT') { const t = (m.iran && m.iran.USD) || m.toman_per_usd; return t ? 1 / t : null; }
    if (c === 'IQD') return (m.usd && m.usd.IQD) || 0.00076;
    return (m.usd && m.usd[c]) ?? null;
  }
  const mid = (m, a, b) => { const x = usdOf(m, a), y = usdOf(m, b); return x && y ? x / y : null; };
  function round(v, q, r) {
    if (!isFinite(v)) return null;
    if (q === 'IRT') { r = Number(r || 10); return Math.round(v / r) * r; }
    const d = v >= 1000 ? 0 : v >= 100 ? 1 : v >= 1 ? 3 : 5;
    return +v.toFixed(d);
  }
  const key = (c, q) => c + '/' + q;
  const isAuto = cfg => !!cfg && cfg.mode === 'auto';
  // one row: saved = {buy, sell, updated_at} or undefined; cfg = {mode, sb, ss, round, fixed:[…], pair:{'USD/TRY':{sb,ss}}}
  function rate(m, cfg, c, q, saved) {
    if (!isAuto(cfg) || (cfg.fixed || []).includes(key(c, q))) return saved ? Object.assign({auto: false}, saved) : saved;
    const x = mid(m, c, q);
    if (!x) return saved ? Object.assign({auto: false}, saved) : saved;
    const sp = (cfg.pair || {})[key(c, q)] || {};          // this currency's own percentages, if the exchange set them
    const pick = (own, def) => (own !== null && own !== undefined && own !== '' && isFinite(own) ? Number(own) : Number(def ?? 0.3) || 0);
    const sb = pick(sp.sb, cfg.sb), ss = pick(sp.ss, cfg.ss);
    return {ccy: c, quote: q, buy: round(x * (1 - sb / 100), q, cfg.round), sell: round(x * (1 + ss / 100), q, cfg.round),
      updated_at: m && m.t ? new Date(m.t * 1000).toISOString() : new Date().toISOString(), auto: true};
  }
  return {market, usdOf, mid, round, key, isAuto, rate};
})();
