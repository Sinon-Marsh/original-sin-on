// Original Sin-on — service worker: works offline after the first visit.
const VERSION = 'sin-on-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest',   "assets/fonts/cormorant-garamond-latin-400-italic.woff2",  "assets/fonts/cormorant-garamond-latin-400-normal.woff2",  "assets/fonts/cormorant-garamond-latin-500-italic.woff2",  "assets/fonts/cormorant-garamond-latin-500-normal.woff2",  "assets/fonts/cormorant-garamond-latin-600-normal.woff2",  "assets/fonts/inter-latin-400-normal.woff2",  "assets/fonts/inter-latin-500-normal.woff2",  "assets/fonts/inter-latin-600-normal.woff2",  "assets/icon-180.png",  "assets/icon-192.png",  "assets/icon-32.png",  "assets/icon-512.png",  "assets/icon-maskable-512.png",  "assets/logo.png",  "data/obl.json",  "data/pbl.json"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // GitHub API goes to the network
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$|manifest\.webmanifest$/.test(new URL(req.url).pathname);
  if (isPage) {
    // Stale-while-revalidate: open instantly from cache, refresh in the background.
    e.respondWith(caches.open(VERSION).then(async c => {
      const cached = await c.match(req, {ignoreSearch: true}) || await c.match('index.html');
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    }));
  } else {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req).then(res => {
      if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
      return res;
    })));
  }
});
