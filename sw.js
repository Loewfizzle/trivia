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
// PLAY NOW — Group 0a: ONE BUILD PER PAGE (Nov 13 — C2 found the owner's iPhone running an OLD music.js beside the NEW radio-ledger.js).
// Every page is PINNED to the build it booted on (clientId → { v, cache }, kept in META too, so a worker the phone stopped + restarted still
// knows); EVERY /js + /css request of that page — the boot graph and every lazy chunk, any time later — comes from THAT build:
//   - a copy held → served (no request leaves the phone)
//   - a miss → the network ONLY while the network is still that build (/api/time's `v`, an answer ≤ LIVE_FRESH_MS old); each burst of misses
//     is checked again once it settles (VERIFY_MS) — a deploy that landed mid-burst = those copies dropped + the pages on it told
//   - the network has moved on (THE BUILD IS GONE) → the page is asked (ns:build-gone): no match on screen → it reloads ONCE (THE SKEW
//     WRAPPER's guard) and the file is refused; a match on screen → it answers `mix`: the network's files for that page until the podium, then
//     the reload (a match never dies for it)
//   - a build's cache is kept while a live page is pinned to it (never dropped under an open page)
// A page this worker never saw boot (the first visit, a worker update) is adopted by the live build at its first file. The edge header on
// /js + /css is `max-age=300` with NO stale-while-revalidate (it was a day): a load the worker doesn't control never boots on a day-old copy.
const LIVE_FRESH_MS = 3e3, VERIFY_MS = 2500, ASK_MS = 700, PIN_KEEP_MS = 10e3;
// CITY A — item 14, THE PHONE KEEPS ITS FILES (no build step kept): a new build started on an EMPTY cache — every file downloaded again. Each
// build's list of its files' hashes (/file-hashes.json — scripts/build-file-hashes.mjs, committed + checked current by a unit test) is kept in
// META; when a new build arrives, every file whose hash did NOT change is CARRIED from the old build's cache into the new one (the same bytes —
// ONE DEPLOY AT A TIME still holds: a page only ever runs one build's code), and only the changed files come over the network. The old cache is
// dropped once the carry is done. /audio: a song is kept BY ITS URL (its name + music.js#REV) in its own cache — fetched whole once (music.js's
// prefetch), the media element's range requests answered from that copy — never downloaded again per deploy; a new REV replaces it.
const HASH_URL = '/file-hashes.json', AUDIO = 'na-audio-v1', CARRY_WAIT_MS = 2500;
const carries = new Map();   // new build cache → the running carry (a miss waits for it, bounded)   // (a miss trusts a build answer ≤ 3 s old — a boot's first wave; later misses ask again)
const CODE_RE = /^\/((js|css)\/|boot-bundle\.json$)/;   // (THE FIX PASS — P6: the boot bundle is pinned to its build like a module — its own build's copy, kept, carried)
const modes = new Map();      // clientId → Promise<{ mode: 'build' | 'net', cache, v }>
const pins = new Map();       // clientId → { v, cache, at }  (persisted: META /__pins)
const mixOk = new Set();      // clientIds that answered `mix` (a match on screen): the network's files until their reload
let lastMode = null;          // (a request with no client id — or a browser without resultingClientId: the latest page load's)
// LOAD FIX 4 (Grok's boot audit #11): every load revalidated ~300 files (right) and then REWROTE each one into Cache Storage (~6 MB of flash
// writes a visit, nothing changed), and a URL with a throwaway query (a sheet's ?again= retry) or a page's own query (every invite link
// /?room=…) piled up as one more copy forever. Now: a copy is written only when it CHANGED (its ETag / Last-Modified — the server's own
// validators, which the browser's revalidation keeps); a page is kept ONCE under its path (any query); a static file with a query other
// than ?v= (a real version) is never kept; the cache is capped (the oldest copies trimmed). Still network-first, same-origin static only,
// never /api or /audio; offline = the last good copy (tests/integration/sw-cache.mjs).
const MAX_ENTRIES = 700;
const stats = { puts: 0, same: 0, notKept: 0, trimmed: 0, hits: 0, misses: 0, net: 0, build: null, mode: null, fresh: 0, gone: 0, refused: 0, dropped: 0, carried: 0, carryMs: 0, audioHits: 0, audioKept: 0 };
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
/** the live build, shared + cached ≤ LIVE_FRESH_MS (force = ask now); null = unknown */
let liveAns = { v: null, at: 0 }, liveP = null;
function liveBuild(force = false) {
  if (!force && liveAns.at && Date.now() - liveAns.at < LIVE_FRESH_MS) return Promise.resolve(liveAns.v);
  if (!liveP) liveP = buildNow().then(v => { liveAns = { v, at: Date.now() }; liveP = null; return v; }, () => { liveP = null; return null; });
  return liveP;
}
let pinsRead = null;
function readPins() {
  if (!pinsRead) {
    pinsRead = within(caches.open(META).then(c => c.match('/__pins')).then(r => (r ? r.json() : {})), STORE_WAIT_MS, {})
      .then(o => { for (const [id, x] of Object.entries(o || {})) if (!pins.has(id) && x && typeof x.v === 'string') pins.set(id, x); })
      .catch(() => {});
  }
  return pinsRead;
}
let saveT = null;
/** the pins of live pages (+ any set in the last minute — a page mid-navigation isn't a client yet) → META, debounced */
function savePins() {
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try {
      const live = new Set((await self.clients.matchAll({ type: 'window' })).map(c => c.id)), t = Date.now();
      for (const [id, x] of pins) if (!live.has(id) && t - (x.at || 0) > PIN_KEEP_MS) { pins.delete(id); mixOk.delete(id); }
      await within(caches.open(META).then(c => c.put('/__pins', new Response(JSON.stringify(Object.fromEntries(pins))))), STORE_WAIT_MS, null);
    } catch { /* polish: the in-memory pins still hold */ }
  }, 800);
}
function pin(id, M) { if (id && M && M.mode === 'build' && M.v) { pins.set(id, { v: M.v, cache: M.cache, at: Date.now() }); savePins(); } }
/** the build caches a live page is pinned to (never dropped under an open page) */
async function pinnedCaches() {
  await readPins();
  let live = null;
  try { live = new Set((await self.clients.matchAll({ type: 'window' })).map(c => c.id)); } catch { /* keep every pinned one */ }
  return new Set([...pins].filter(([id, x]) => !live || live.has(id) || Date.now() - (x.at || 0) < PIN_KEEP_MS).map(([, x]) => x.cache));
}
async function dropUnpinned(name) {
  const keepC = await pinnedCaches();   // (ONE BUILD PER PAGE: an older build's cache stays while a page is still on it)
  for (const k of await caches.keys()) if (k.startsWith(BUILD_PREFIX) && k !== name && !keepC.has(k)) await caches.delete(k);
}
const SILENT = { silent: true };   // (within's answer when the store didn't — never a real value)
async function heldBuild() { try { const r = await within(caches.open(META).then(c => c.match('/__build')), STORE_WAIT_MS, SILENT); if (r === SILENT) return undefined; return r ? (await within(r.text(), STORE_WAIT_MS, '')) || null : null; } catch { return undefined; } }
// ---- CITY A — item 14: the hash lists + THE CARRY
const hashKey = v => `/__hashes/${v}`;
/** build v's list of hashes: META's copy, else the network's (it IS build v's while v is live), kept */
async function hashesFor(v) {
  const m = await caches.open(META), hit = await m.match(hashKey(v));
  if (hit) return (await hit.json()).files || null;
  const r = await fetch(`${HASH_URL}?b=${encodeURIComponent(v)}`, { cache: 'no-store' });
  if (!r.ok) return null;
  const j = await r.json();
  if (!j || !j.files) return null;
  if ((await liveBuild()) !== v) return null;   // (the network moved on while it answered: not this build's list — never kept as it)
  await m.put(hashKey(v), new Response(JSON.stringify(j)));
  for (const k of await m.keys()) { const p = new URL(k.url).pathname; if (p.startsWith('/__hashes/') && p !== hashKey(v)) { const b = p.slice(10); if (!(await caches.has(BUILD_PREFIX + b))) await m.delete(k); } }
  return j.files;
}
/** every file of the OLD build whose hash is the same in the NEW build: its copy carried into the new cache → how many */
async function carryUnchanged(from, to, v) {
  const t0 = Date.now(), m = await caches.open(META), oldR = await m.match(hashKey(from));
  if (!oldR || !(await caches.has(BUILD_PREFIX + from))) return 0;
  const oldH = (await oldR.json()).files || {}, newH = await hashesFor(v);
  if (!newH) return 0;
  const src = await caches.open(BUILD_PREFIX + from), dst = await caches.open(to);
  let n = 0;
  for (const req of await src.keys()) {
    const p = new URL(req.url).pathname;
    if (!oldH[p] || oldH[p] !== newH[p] || await dst.match(req)) continue;
    const res = await src.match(req);
    if (res) { await dst.put(req, res); n++; }
  }
  stats.carried += n; stats.carryMs = Date.now() - t0;
  return n;
}
/** a page load's mode: the same build as the copies held → 'build' (its copies); a new one → 'build' on a FRESH cache; none → 'net' */
async function modeFor() {
  const v = await liveBuild(true);
  stats.build = v;
  if (!v) return { mode: 'net', cache: CACHE, v: null };
  const name = BUILD_PREFIX + v;
  const held = await heldBuild();
  if (held === undefined) return { mode: 'net', cache: CACHE, v: null };   // (the store isn't answering: the network, as before)
  if (held !== v) {
    stats.fresh++;
    try {
      await within((async () => {
        await (await caches.open(META)).put('/__build', new Response(v));
      })(), STORE_WAIT_MS * 2, null);
    } catch { /* polish: the network path still works */ }
    // (CITY A — item 14: THE CARRY first — the unchanged files from the old build's cache — then the old cache goes (unless a page is still on
    //  it). The page's files don't wait for the whole carry: a miss waits for it ≤ CARRY_WAIT_MS, then the network)
    const c = (held ? carryUnchanged(held, name, v) : hashesFor(v).then(() => 0)).catch(() => 0).then(n => { carries.delete(name); return n; });
    carries.set(name, c);
    c.then(() => within(dropUnpinned(name), STORE_WAIT_MS * 2, null)).catch(() => {});
  } else {
    within(dropUnpinned(name), STORE_WAIT_MS * 2, null).catch(() => {});   // (an older build whose pages have all gone)
    hashesFor(v).catch(() => {});   // (CITY A: this build's list kept — the NEXT deploy carries from it)
  }
  return { mode: 'build', cache: name, v };
}

/** a page's mode for a file: its own load's (this worker saw it) · its pin (a worker restarted) · adopted by the live build (never seen boot) */
function pageMode(clientId) {
  if (!clientId) return lastMode;
  const m = modes.get(clientId);
  if (m) return m;
  const p = (async () => {
    await readPins();
    const x = pins.get(clientId);
    if (x) return { mode: 'build', cache: x.cache, v: x.v };
    const v = await liveBuild();
    if (!v) return { mode: 'net', cache: CACHE, v: null };
    const M = { mode: 'build', cache: BUILD_PREFIX + v, v, adopted: true };
    pin(clientId, M);
    return M;
  })().catch(() => ({ mode: 'net', cache: CACHE, v: null }));
  modes.set(clientId, p);
  if (modes.size > 40) modes.delete(modes.keys().next().value);
  return p;
}

/** ask the page whether its build may be left (ns:build-gone): true = `mix` (a match on screen — the network's files until its reload) */
const asks = new Map();   // clientId → { r, p }
async function askPage(clientId, v, live) {
  if (mixOk.has(clientId)) return true;
  const open = asks.get(clientId);
  if (open) return open.p;
  let r = null;
  const p = new Promise(res => { r = res; });
  asks.set(clientId, { r, p });
  const t = setTimeout(() => r(false), ASK_MS);
  try {
    const c = await self.clients.get(clientId);
    if (c) c.postMessage({ t: 'ns:build-gone', v, live }); else r(false);
  } catch { r(false); }
  const mix = await p;
  clearTimeout(t); asks.delete(clientId); stats.gone++;
  if (mix) mixOk.add(clientId);
  return mix;
}
/** tell every page pinned to build v that it's gone (a deploy landed mid-burst — no answer needed: it reloads unless a match is on) */
async function tellGone(v, live) {
  try { for (const c of await self.clients.matchAll({ type: 'window' })) { const x = pins.get(c.id); if (x && x.v === v && !mixOk.has(c.id)) c.postMessage({ t: 'ns:build-gone', v, live, tell: true }); } } catch { /* polish */ }
}
/** the misses kept into a build's cache, checked once they settle: the network moved mid-burst → those copies dropped + the pages told */
const bursts = new Map();
function noteKept(M, key) {
  let b = bursts.get(M.cache);
  if (!b) { let end = null; b = { v: M.v, keys: [], done: new Promise(r => { end = r; }) }; b.end = end; bursts.set(M.cache, b); }
  b.keys.push(key);
  clearTimeout(b.t);
  b.t = setTimeout(async () => {
    bursts.delete(M.cache);
    try {
      const live = await liveBuild(true);
      if (live && live !== b.v) {
        stats.dropped += b.keys.length;
        const c = await caches.open(M.cache);
        for (const k of b.keys) await c.delete(k);
        await tellGone(b.v, live);
      }
    } catch { /* polish */ }
    b.end();
  }, VERIFY_MS);
  return b.done;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  // (FR7 FIXES B — THE TWO-TAB HANG: every fetch of every page this worker controls WAITS until its activation ends — a clean-up stuck on a
  //  store that stopped answering held them all: the boot's modules never came, STEPPING INSIDE forever. The clean-up gets ACTIVATE_STORE_MS,
  //  then the worker takes over anyway; whatever it didn't clean waits for the next activation)
  event.waitUntil((async () => {
    await within((async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== META && key !== AUDIO && !key.startsWith(BUILD_PREFIX)) await caches.delete(key);
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
  // (VERCEL WEB ANALYTICS, Nov 12 night: /_vercel/* — the analytics' script + beacon — passes straight through like /api, never kept)
  if (url.pathname.startsWith('/audio/')) { event.respondWith(audioFetch(req, url, event)); return; }   // (CITY A — item 14: kept by version)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/') || req.headers.has('range')) return;
  // (FR7 FIXES B — a page load decides its mode ONCE, in parallel with its HTML; its files wait for it ≤ BUILD_WAIT_MS)
  let modeP = null;
  if (req.mode === 'navigate') {
    modeP = modeFor().catch(() => ({ mode: 'net', cache: CACHE, v: null }));
    lastMode = modeP;
    if (event.resultingClientId) { const id = event.resultingClientId; modes.set(id, modeP); modeP.then(M => pin(id, M)); }
    if (modes.size > 40) modes.delete(modes.keys().next().value);
  }
  event.respondWith((async () => {
    const key = keyOf(req, url);
    let M = { mode: 'net', cache: CACHE, v: null };
    const code = CODE_RE.test(url.pathname), cid = event.clientId;
    if (req.mode !== 'navigate' && key) {
      const p = pageMode(cid);
      if (p) M = await Promise.race([p, wait(BUILD_WAIT_MS + 300).then(() => M)]).catch(() => M);
      // BUILD MODE: this page's own build's copy — no request leaves the phone
      if (M.mode === 'build') {
        try { const hit = await within(caches.open(M.cache).then(c => c.match(key)), STORE_WAIT_MS, null); if (hit) { stats.hits++; stats.mode = 'build'; return toPage(hit); } } catch { /* the network */ }
        // (CITY A — item 14: a new build's CARRY still running — the file may be on its way from the old build's cache: wait for it, bounded)
        const cr = carries.get(M.cache);
        if (cr) { try { await within(cr, CARRY_WAIT_MS, 0); const hit = await within(caches.open(M.cache).then(c => c.match(key)), STORE_WAIT_MS, null); if (hit) { stats.hits++; stats.mode = 'build'; return toPage(hit); } } catch { /* the network */ } }
        stats.misses++;
      }
    }
    // ONE BUILD PER PAGE: a miss reaches the network only while the network is still this page's build
    let keepIt = M.mode === 'build';
    if (keepIt && mixOk.has(cid)) keepIt = false;
    else if (keepIt && code) {
      const live = await liveBuild();
      if (live && live !== M.v) {
        keepIt = false;
        if (!await askPage(cid, M.v, live)) { stats.refused++; return Response.error(); }
      } else if (!live) keepIt = false;   // (the build can't be checked: the network's file, never kept as this build's)
    }
    try {
      // (LOAD FIX 3 — THE FREEZE: one failed request among the boot's ~310 module files held the boot screen forever — a Wi-Fi blip gets
      //  ONE more try on the network before the cache's copy, which may be an older deploy's)
      const net = () => fetch(req, { cache: 'no-cache' });
      const res = await net().catch(() => new Promise(r => setTimeout(r, 250)).then(net));
      stats.net++; if (req.mode !== 'navigate') stats.mode = M.mode;
      if (res.ok && res.type === 'basic') {
        if (key && (req.mode === 'navigate' || M.mode !== 'build' || keepIt)) {
          const copy = res.clone(), kept = keep(key, copy, req.mode === 'navigate' ? CACHE : M.cache).catch(() => {});
          if (req.mode !== 'navigate' && M.mode === 'build' && code) event.waitUntil(kept.then(() => noteKept(M, key)));
        } else stats.notKept++;
      }
      return req.mode === 'navigate' ? res : toPage(res);
    } catch {
      const cached = (M.mode === 'build' && key ? await within(caches.open(M.cache).then(c => c.match(key)), STORE_WAIT_MS, null) : null) || (M.mode === 'build' && code ? null : await within(caches.match(req, { ignoreSearch: req.mode === 'navigate' || !keepable(url) }), STORE_WAIT_MS, null));
      return cached ? (req.mode === 'navigate' ? cached : toPage(cached)) : (req.mode === 'navigate' ? within(caches.match('/'), STORE_WAIT_MS, null).then(r => r || Response.error()) : Response.error());
    }
  })());
});

// CITY A — item 14: /audio BY VERSION — a whole song fetched once (music.js#prefetch, the lobby's synced song) is kept under its URL (the file's
// name + its ?v= REV); a range request (the media element) is answered from that copy (a 206 slice); a miss is the network's, as before. Any
// failure here = the network's answer: audio is polish, never a dependency.
const RANGE_RE = /^bytes=(\d*)-(\d*)$/, audioWhole = new Set();
/** has this song + REV been asked for by an EARLIER page load? (META /__aseen/… holds the page that first asked — another page = a return) */
async function audioSeenBefore(url, cid) {
  try {
    const m = await within(caches.open(META), STORE_WAIT_MS, null); if (!m) return false;
    const k = `/__aseen${url.pathname}${url.search}`, was = await within(m.match(k), STORE_WAIT_MS, null);
    if (!was) { await m.put(k, new Response(String(cid || ''))); return false; }
    return (await was.text()) !== String(cid || '');
  } catch { return false; }
}
async function audioFetch(req, url, event) {
  try {
    const c = await within(caches.open(AUDIO), STORE_WAIT_MS, null);
    const hit = c ? await within(c.match(url.href), STORE_WAIT_MS, null) : null;
    const range = req.headers.get('range');
    if (hit) {
      stats.audioHits++;
      if (!range) return hit;
      const m = RANGE_RE.exec(range.trim()), blob = await hit.blob(), size = blob.size;
      if (!m || (!m[1] && !m[2])) return fetch(req);
      let a = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2])), b = m[1] && m[2] ? Math.min(size - 1, Number(m[2])) : size - 1;
      if (!(a <= b && a < size)) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
      return new Response(blob.slice(a, b + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('content-type') || 'audio/mpeg', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
    }
    const res = await fetch(req);
    // (a range miss — the media element playing a song this phone hasn't kept: on the song's SECOND visit (a returning phone — a one-time
    //  visitor never pays twice for it) the WHOLE file is fetched once in the background + kept, so every later visit / deploy answers its
    //  ranges here; one copy a song + REV, never twice at once)
    if (range && c && !audioWhole.has(url.href) && res.ok && await audioSeenBefore(url, event.clientId)) { audioWhole.add(url.href); event.waitUntil(fetch(url.href).then(full => (full.status === 200 && full.type === 'basic' ? c.put(url.href, full).then(() => { stats.audioKept++; }) : null)).catch(() => {}).finally(() => audioWhole.delete(url.href))); }
    if (!range && res.status === 200 && res.type === 'basic' && c) {
      const copy = res.clone();
      event.waitUntil((async () => {
        await c.put(url.href, copy); stats.audioKept++;
        for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.href !== url.href) await c.delete(k); }   // (a new REV replaces the old copy)
      })().catch(() => {}));
    }
    return res;
  } catch { return fetch(req); }
}

// (LOAD FIX 4: the cache's counts for the test — tests/integration/sw-cache.mjs)
self.addEventListener('message', e => {
  const d = e.data, src = e.source;
  if (d === 'ns:sw-stats' && src) { src.postMessage({ t: 'ns:sw-stats', ...stats, pins: pins.size, mix: mixOk.size }); return; }
  if (!d || typeof d !== 'object' || !src) return;
  // (ONE BUILD PER PAGE: the page asks which build it is on — the truest answer: the build its files come from)
  if (d.t === 'ns:build?') e.waitUntil(Promise.resolve(pageMode(src.id)).then(M => src.postMessage({ t: 'ns:build', v: (M && M.v) || null })).catch(() => {}));
  // (its answer to ns:build-gone: mix = a match on screen — the network's files until its reload; else it reloads now)
  if (d.t === 'ns:build-gone-ans') { const a = asks.get(src.id); if (a) a.r(!!d.mix); else if (d.mix) mixOk.add(src.id); }
});

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
