// Arzino service worker: app shell offline + last data cached
const CACHE = 'arzino-v15';
const SHELL = ['./', './index.html', './app.css?v=14', './app.js?v=14', './vendor/lightweight-charts.js', './manifest.webmanifest',
  './icons/app.svg', './icons/app-192.png', './icons/gold.svg', './icons/silver.svg', './icons/coin.svg', './icons/g18.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))), self.clients.claim()])));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/sarraf/')) return;                      // accounting app: never cache
  const ok = url.origin === location.origin || url.hostname === 'raw.githubusercontent.com' || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!ok) return;                                                     // any other API: straight to network
  if (url.hostname === 'raw.githubusercontent.com') {                  // data: network first, cache fallback
    const key = url.origin + url.pathname;
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(key, c)); return r; })
      .catch(() => caches.match(key)));
    return;
  }
  // shell & fonts: cache first, refresh in background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
