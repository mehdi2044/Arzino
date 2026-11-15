// Cloudflare Pages Function: /api/q?s=AAPL,THYAO.IS[&chart=m1|h1|d1]
// Small proxy for stock quotes and charts (Yahoo Finance), cached for 60 seconds.
const UA = {'User-Agent': 'Mozilla/5.0 (Arzino quote proxy)'};
const RANGE = {m1: ['1d', '1m'], h1: ['1mo', '60m'], d1: ['1y', '1d']};

async function chart(sym, range, interval) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`;
  const r = await fetch(u, {headers: UA, cf: {cacheTtl: 60}});
  if (!r.ok) return null;
  const j = await r.json();
  return j?.chart?.result?.[0] || null;
}

export async function onRequestGet({request}) {
  const url = new URL(request.url);
  const syms = (url.searchParams.get('s') || '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=\-]{1,20}$/.test(s)).slice(0, 20);
  const want = url.searchParams.get('chart');
  if (!syms.length) return new Response('{}', {status: 400, headers: {'content-type': 'application/json'}});
  const cache = caches.default, key = new Request(url.toString());
  const hit = await cache.match(key); if (hit) return hit;

  let body;
  if (want && RANGE[want]) {
    const res = await chart(syms[0], ...RANGE[want]);
    const ts = res?.timestamp || [], q = res?.indicators?.quote?.[0] || {};
    const bars = ts.map((t, i) => [t, q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i]]).filter(b => b.slice(1).every(v => v != null));
    body = {bars, last: res?.meta?.regularMarketPrice ?? null, cur: res?.meta?.currency ?? null};
  } else {
    body = {};
    await Promise.all(syms.map(async s => {
      const res = await chart(s, '5d', '1d'); const m = res?.meta; if (!m?.regularMarketPrice) return;
      const prev = m.chartPreviousClose || m.previousClose;
      body[s] = {price: m.regularMarketPrice, cur: m.currency, name: m.shortName || m.longName || s, chg: prev ? (m.regularMarketPrice / prev - 1) * 100 : null, exch: m.exchangeName};
    }));
  }
  const resp = new Response(JSON.stringify(body), {headers: {'content-type': 'application/json', 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*'}});
  await cache.put(key, resp.clone());
  return resp;
}
