'use strict';
/* Dedicated Arzino: turn the answers of an exchange's own price APIs into prices.
   A source = {id, scope: fiat|crypto|metal|irt|asset, asset, path, kind: one|map, mode: price|per, unit, key, val, strip}
   - path : where the number (or the list of numbers) is in the answer, e.g. "data.price" or "rates"
   - unit : currency the numbers are in (USD, USDT, TRY, IRT …). IRT feeds Iran (toman) prices.
   - mode : price = "1 code costs N unit"; per = "1 unit buys N code" (e.g. 1 USD = 0.92 EUR)
   - key/val/strip: for lists like [{"symbol":"BTCUSDT","price":"…"}] → key=symbol, val=price, strip=USDT */
const WLX = (() => {
  const CRYPTO = new Set(['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'TRX', 'SOL', 'DOGE', 'TON', 'ADA', 'LTC', 'DOT', 'AVAX', 'SHIB', 'MATIC', 'POL', 'LINK', 'BCH', 'XLM', 'DAI', 'NOT', 'PEPE', 'ATOM', 'ETC', 'XMR', 'UNI', 'NEAR', 'APT', 'ARB', 'OP', 'SUI']);
  const METAL = new Set(['XAU', 'XAG', 'XPT', 'XPD']);
  const IR_METAL = new Set(['G18', 'G24', 'MESGHAL', 'SEKE', 'SEKE_B', 'NIM', 'ROB']);
  const scopeOf = c => METAL.has(c) || IR_METAL.has(c) ? 'metal' : CRYPTO.has(c) || c.length !== 3 ? 'crypto' : 'fiat';
  function at(o, path) {
    if (!path) return o;
    for (const k of String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)) { if (o == null) return undefined; o = o[k]; }
    return o;
  }
  const num = x => { const n = typeof x === 'string' ? parseFloat(x.replace(/,/g, '')) : Number(x); return isFinite(n) ? n : NaN; };
  const pick = (x, src) => x && typeof x === 'object' ? num(x[src.val || 'price'] ?? x.price ?? x.rate ?? x.value ?? x.last) : num(x);
  function toMap(v, src) {
    const m = {}, strip = (src.strip || '').toUpperCase();
    const add = (k, n) => { if (k == null || !(n > 0)) return; k = String(k).toUpperCase(); if (strip && k.endsWith(strip) && k !== strip) k = k.slice(0, -strip.length); m[k] = n; };
    if (Array.isArray(v)) for (const it of v) { if (it && typeof it === 'object') add(it[src.key || 'symbol'] ?? it.code ?? it.symbol ?? it.currency, pick(it, src)); }
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) add(k, pick(x, src));
    return m;
  }
  // → {usd: {code: USD value of 1 unit}, irt: {code: toman per unit}, found: [[code, value, unit]]}
  function extract(src, body, usdOf) {
    const out = {usd: {}, irt: {}, found: []}; const unit = String(src.unit || 'USD').toUpperCase();
    const put = (code, p) => {
      if (!(p > 0) || !isFinite(p)) return;
      out.found.push([code, p, unit]);
      if (unit === 'IRT' || src.scope === 'irt') { out.irt[code] = p; return; }
      if (code === 'USD' && unit !== 'USD') { out.usd[unit] = 1 / p; return; }   // "1 USD = 50.4 TRY" sets the lira
      const u = unit === 'USD' ? 1 : usdOf(unit); if (u) out.usd[code] = p * u;
    };
    const v = at(body, src.path);
    if (src.scope === 'asset' && (src.kind || 'one') === 'one') {
      const n = pick(v, src); put(String(src.asset || '').toUpperCase(), src.mode === 'per' ? 1 / n : n); return out;
    }
    const m = toMap(v, src);
    for (const [c, n] of Object.entries(m)) {
      if (src.scope === 'asset' && c !== String(src.asset || '').toUpperCase()) continue;
      if (['fiat', 'crypto', 'metal'].includes(src.scope) && scopeOf(c) !== src.scope) continue;
      if (c === unit) continue;
      put(c, src.mode === 'per' ? 1 / n : n);
    }
    return out;
  }
  // apply every source of a public_wl answer; single-currency sources win over whole sections
  function overrides(wl, usdOf) {
    const r = {usd: {}, irt: {}, t: 0};
    const srcs = (wl && wl.sources || []).slice().sort((a, b) => (a.scope === 'asset') - (b.scope === 'asset'));
    for (const s of srcs) {
      const d = wl.data && wl.data[s.id]; if (!d || !d.body || (d.status && d.status >= 400)) continue;
      const x = extract(s, d.body, c => r.usd[c] ?? usdOf(c));
      Object.assign(r.usd, x.usd); Object.assign(r.irt, x.irt);
      r.t = Math.max(r.t, +new Date(d.t) || 0);
    }
    return r;
  }
  // a market object (latest.json shape) with the exchange's own prices on top
  function merge(m, ov) {
    if (!m || !ov) return m;
    const iran = Object.assign({}, m.iran || {}, ov.irt);
    return Object.assign({}, m, {usd: Object.assign({}, m.usd || {}, ov.usd), iran, toman_per_usd: iran.USD || m.toman_per_usd});
  }
  return {at, extract, overrides, merge, scopeOf};
})();
