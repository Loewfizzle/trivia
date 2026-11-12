// NEON SPEAKEASY service worker — deliberately minimal.
// Network-first for our own static files (so players always get the newest version);
// the cache is only a fallback when the network is down. Firebase, fonts, CDNs and the
// music files are never touched: cross-origin requests, /audio and the /api functions pass straight through.
const CACHE = 'na-static-v1';
// LOAD FIX 4 (Grok's boot audit #11): every load revalidated ~300 files (right) and then REWROTE each one into Cache Storage (~6 MB of flash
// writes a visit, nothing changed), and a URL with a throwaway query (a sheet's ?again= retry) or a page's own query (every invite link
// /?room=…) piled up as one more copy forever. Now: a copy is written only when it CHANGED (its ETag / Last-Modified — the server's own
// validators, which the browser's revalidation keeps); a page is kept ONCE under its path (any query); a static file with a query other
// than ?v= (a real version) is never kept; the cache is capped (the oldest copies trimmed). Still network-first, same-origin static only,
// never /api or /audio; offline = the last good copy (tests/integration/sw-cache.mjs).
const MAX_ENTRIES = 700;
const stats = { puts: 0, same: 0, notKept: 0, trimmed: 0 };
const keepable = url => [...url.searchParams.keys()].every(k => k === 'v');
const keyOf = (req, url) => (req.mode === 'navigate' ? `${url.origin}${url.pathname}` : keepable(url) ? req : null);
const sameCopy = (a, b) => {
  const e1 = a.headers.get('etag'), e2 = b.headers.get('etag');
  if (e1 && e2) return e1 === e2;
  const m1 = a.headers.get('last-modified'), m2 = b.headers.get('last-modified');
  return !!(m1 && m2 && m1 === m2 && a.headers.get('content-length') === b.headers.get('content-length'));
};
async function trim(c) { const keys = await c.keys(); for (let i = 0; i < keys.length - MAX_ENTRIES; i++) { await c.delete(keys[i]); stats.trimmed++; } }
let trimAt = 0;
async function keep(key, res) {
  const c = await caches.open(CACHE);
  const old = await c.match(key);
  if (old && sameCopy(old, res)) { stats.same++; return; }
  await c.put(key, res); stats.puts++;
  if (stats.puts - trimAt >= 50) { trimAt = stats.puts; await trim(c); }
}

// (FR7 FIXES B — THE TWO-TAB HANG: Safari's storage process can stop answering after Safari sat in the background with two tabs of the site
//  open — an open / match on Cache Storage then NEVER settles until every tab is closed. Every wait on it that a page waits for is bounded:
//  the activation's clean-up (every fetch of a controlled page waits for the activation) + the offline fallback's reads)
const wait = ms => new Promise(r => setTimeout(r, ms));
const STORE_WAIT_MS = 800, ACTIVATE_STORE_MS = 2000;
const within = (p, ms, dflt) => Promise.race([Promise.resolve(p).catch(() => dflt), wait(ms).then(() => dflt)]);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await within((async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      // (LOAD FIX 4: the pile an older worker left — throwaway queries + a copy per page query — goes, then the cap)
      try { const c = await caches.open(CACHE); for (const r of await c.keys()) { const u = new URL(r.url); if (u.search && !keepable(u)) { await c.delete(r); stats.trimmed++; } } await trim(c); } catch { /* polish */ }
    })(), ACTIVATE_STORE_MS, null);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/api/') || req.headers.has('range')) return;
  event.respondWith((async () => {
    try {
      // (LOAD FIX 3 — THE FREEZE: one failed request among the boot's ~310 module files held the boot screen forever — a Wi-Fi blip gets
      //  ONE more try on the network before the cache's copy, which may be an older deploy's)
      const net = () => fetch(req, { cache: 'no-cache' });
      const res = await net().catch(() => new Promise(r => setTimeout(r, 250)).then(net));
      if (res.ok && res.type === 'basic') {
        const key = keyOf(req, url);
        if (key) { const copy = res.clone(); keep(key, copy).catch(() => {}); } else stats.notKept++;
      }
      return res;
    } catch {
      const cached = await within(caches.match(req, { ignoreSearch: req.mode === 'navigate' || !keepable(url) }), STORE_WAIT_MS, null);
      return cached || (req.mode === 'navigate' ? within(caches.match('/'), STORE_WAIT_MS, null).then(r => r || Response.error()) : Response.error());
    }
  })());
});

// (LOAD FIX 4: the cache's counts for the test — tests/integration/sw-cache.mjs)
self.addEventListener('message', e => { if (e.data === 'ns:sw-stats' && e.source) e.source.postMessage({ t: 'ns:sw-stats', ...stats }); });

// CITY CONTROLS B — "A ROOM JUST OPENED" (the owner's phone only: api/_lib/push.js sends it — Web Push, a site added to the Home Screen on
// iOS 16.4+). The payload is { title, body, url, tag }; a tap opens (or focuses) the site.
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'NEON SPEAKEASY', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'NEON SPEAKEASY', { body: d.body || '', tag: d.tag || 'ns', renotify: true, icon: '/assets/icon-192.png', badge: '/assets/icon-192.png', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) if (c.url.startsWith(self.location.origin) && 'focus' in c) { try { await c.navigate(url); } catch { /* fine */ } return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
