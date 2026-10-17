// NEON SPEAKEASY service worker — deliberately minimal.
// Network-first for our own static files (so players always get the newest version);
// the cache is only a fallback when the network is down. Firebase, fonts, CDNs and the
// music files are never touched: cross-origin requests and /audio pass straight through.
const CACHE = 'na-static-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/audio/') || req.headers.has('range')) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch {
      const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      return cached || (req.mode === 'navigate' ? caches.match('/') : Response.error());
    }
  })());
});
