// NEON SPEAKEASY service worker — deliberately minimal.
// Network-first for our own static files (so players always get the newest version);
// the cache is only a fallback when the network is down. Firebase, fonts, CDNs and the
// music files are never touched: cross-origin requests, /audio and the /api functions pass straight through.
const CACHE = 'na-static-v1';
// FR7 FIXES B — THE EDGE CACHE (FR7-A D2; the owner's decision: a repeat visit no longer re-asks Vercel for every file — each ask was one of
// the free plan's million edge requests a month, 328 a warm visit). ONE COPY PER DEPLOY: on every page load (a navigation) the worker asks
// /api/time for the deploy's build id (`v` — the commit, the same number THE SKEW WRAPPER reads). The SAME build as the copies it holds →
// every static file comes from its own copy (BUILD MODE: no request leaves the phone); a NEW build → a fresh cache named for it, every file
// from the network (+ a copy kept), the old build's cache dropped; NO build id (an old deploy, localhost, /api/time slow or down) → exactly
// as before (network-first, revalidated). A copy is only ever kept from the network in the build it is named for, so one page never mixes
// two deploys' files; the network fetches stay `no-cache` (the edge header's 5-minute + stale-while-revalidate window is for a page the
// worker doesn't control yet — never a copy the worker keeps). The HTML is always the network's (one request), /api + /audio never pass.
const BUILD_PREFIX = 'na-b-';
const META = 'na-meta';
const BUILD_WAIT_MS = 1200;   // (the most a static request waits for its page's build check — then the network, as before)
const modes = new Map();      // clientId → Promise<{ mode: 'build' | 'net', cache }>
let lastMode = null;          // (a request with no client id — or a browser without resultingClientId: the latest page load's)
// LOAD FIX 4 (Grok's boot audit #11): every load revalidated ~300 files (right) and then REWROTE each one into Cache Storage (~6 MB of flash
// writes a visit, nothing changed), and a URL with a throwaway query (a sheet's ?again= retry) or a page's own query (every invite link
// /?room=…) piled up as one more copy forever. Now: a copy is written only when it CHANGED (its ETag / Last-Modified — the server's own
// validators, which the browser's revalidation keeps); a page is kept ONCE under its path (any query); a static file with a query other
// than ?v= (a real version) is never kept; the cache is capped (the oldest copies trimmed). Still network-first, same-origin static only,
// never /api or /audio; offline = the last good copy (tests/integration/sw-cache.mjs).
const MAX_ENTRIES = 700;
const stats = { puts: 0, same: 0, notKept: 0, trimmed: 0, hits: 0, misses: 0, net: 0, build: null, mode: null, fresh: 0 };
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
async function keep(key, res, name = CACHE) {
  const c = await caches.open(name);
  const old = await c.match(key);
  if (old && sameCopy(old, res)) { stats.same++; return; }
  await c.put(key, res); stats.puts++;
  if (stats.puts - trimAt >= 50) { trimAt = stats.puts; await trim(c); }
}

const wait = ms => new Promise(r => setTimeout(r, ms));
// (FR7 FIXES B — THE TWO-TAB HANG: Safari's storage process can stop answering after Safari sat in the background with two tabs of the site
//  open — an open / match on Cache Storage then NEVER settles until every tab is closed. Every wait on it here is bounded: past STORE_WAIT_MS
//  the file comes from the network, as before; a page never waits on a stuck store)
const STORE_WAIT_MS = 800, ACTIVATE_STORE_MS = 2000;
const within = (p, ms, dflt) => Promise.race([Promise.resolve(p).catch(() => dflt), wait(ms).then(() => dflt)]);
/** a file handed to a page this worker controls: `no-cache` — the page's own memory cache (WebKit's) then always asks the worker again
 *  (free: no network) instead of keeping it fresh 5 min by the edge header, which reused an OLDER deploy's module after a deploy on a
 *  reload (wk-edge.mjs caught it: the new HTML, the old config.js); the edge header stays for a page the worker doesn't control yet */
function toPage(res) {
  if (!res || res.type === 'opaque' || res.status !== 200) return res;
  try { const h = new Headers(res.headers); h.set('cache-control', 'no-cache'); return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h }); } catch { return res; }
}
/** the deploy's build id (null: none / slow / down) */
async function buildNow() {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), BUILD_WAIT_MS);
    const r = await fetch('/api/time', { cache: 'no-store', signal: ctl.signal });
    clearTimeout(t);
    const j = r.ok ? await r.json() : null;
    return j && typeof j.v === 'string' && /^[0-9a-z]{4,40}$/i.test(j.v) ? j.v : null;
  } catch { return null; }
}
const SILENT = { silent: true };   // (within's answer when the store didn't — never a real value)
async function heldBuild() { try { const r = await within(caches.open(META).then(c => c.match('/__build')), STORE_WAIT_MS, SILENT); if (r === SILENT) return undefined; return r ? (await within(r.text(), STORE_WAIT_MS, '')) || null : null; } catch { return undefined; } }
/** a page load's mode: the same build as the copies held → 'build' (its copies); a new one → 'build' on a FRESH cache; none → 'net' */
async function modeFor() {
  const v = await buildNow();
  stats.build = v;
  if (!v) return { mode: 'net', cache: CACHE };
  const name = BUILD_PREFIX + v;
  const held = await heldBuild();
  if (held === undefined) return { mode: 'net', cache: CACHE };   // (the store isn't answering: the network, as before)
  if (held !== v) {
    stats.fresh++;
    try {
      await within((async () => {
        for (const k of await caches.keys()) if (k.startsWith(BUILD_PREFIX) && k !== name) await caches.delete(k);
        await (await caches.open(META)).put('/__build', new Response(v));
      })(), STORE_WAIT_MS * 2, null);
    } catch { /* polish: the network path still works */ }
  }
  return { mode: 'build', cache: name };
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  // (FR7 FIXES B — THE TWO-TAB HANG: every fetch of every page this worker controls WAITS until its activation ends — a clean-up stuck on a
  //  store that stopped answering held them all: the boot's modules never came, STEPPING INSIDE forever. The clean-up gets ACTIVATE_STORE_MS,
  //  then the worker takes over anyway; whatever it didn't clean waits for the next activation)
  event.waitUntil((async () => {
    await within((async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== META && !key.startsWith(BUILD_PREFIX)) await caches.delete(key);
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
  // (FR7 FIXES B — a page load decides its mode ONCE, in parallel with its HTML; its files wait for it ≤ BUILD_WAIT_MS)
  let modeP = null;
  if (req.mode === 'navigate') {
    modeP = modeFor().catch(() => ({ mode: 'net', cache: CACHE }));
    lastMode = modeP;
    if (event.resultingClientId) modes.set(event.resultingClientId, modeP);
    if (modes.size > 40) modes.delete(modes.keys().next().value);
  }
  event.respondWith((async () => {
    const key = keyOf(req, url);
    let M = { mode: 'net', cache: CACHE };
    if (req.mode !== 'navigate' && key) {
      const p = (event.clientId && modes.get(event.clientId)) || lastMode;
      if (p) M = await Promise.race([p, wait(BUILD_WAIT_MS + 300).then(() => M)]).catch(() => M);
      // BUILD MODE: this deploy's own copy — no request leaves the phone
      if (M.mode === 'build') {
        try { const hit = await within(caches.open(M.cache).then(c => c.match(key)), STORE_WAIT_MS, null); if (hit) { stats.hits++; stats.mode = 'build'; return toPage(hit); } } catch { /* the network */ }
        stats.misses++;
      }
    }
    try {
      // (LOAD FIX 3 — THE FREEZE: one failed request among the boot's ~310 module files held the boot screen forever — a Wi-Fi blip gets
      //  ONE more try on the network before the cache's copy, which may be an older deploy's)
      const net = () => fetch(req, { cache: 'no-cache' });
      const res = await net().catch(() => new Promise(r => setTimeout(r, 250)).then(net));
      stats.net++; if (req.mode !== 'navigate') stats.mode = M.mode;
      if (res.ok && res.type === 'basic') {
        if (key) { const copy = res.clone(); keep(key, copy, req.mode === 'navigate' ? CACHE : M.cache).catch(() => {}); } else stats.notKept++;
      }
      return req.mode === 'navigate' ? res : toPage(res);
    } catch {
      const cached = (M.mode === 'build' && key ? await within(caches.match(key), STORE_WAIT_MS, null) : null) || await within(caches.match(req, { ignoreSearch: req.mode === 'navigate' || !keepable(url) }), STORE_WAIT_MS, null);
      return cached ? (req.mode === 'navigate' ? cached : toPage(cached)) : (req.mode === 'navigate' ? within(caches.match('/'), STORE_WAIT_MS, null).then(r => r || Response.error()) : Response.error());
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
