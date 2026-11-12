// Firebase bootstrap + thin helpers. Everything Firebase-specific is imported from here.
//
// The SDK (~450 KB) is loaded with a dynamic import inside initFirebase(), so the title
// screen can paint before it arrives. The exported helpers are thin wrappers that call
// into the loaded SDK — every caller runs after initFirebase() has resolved.
//
// CONN — THE PARKED DATABASE (Oct 28; CLAUDE.md → Multiplayer mechanics): the free plan allows 100 SIMULTANEOUS database
// connections, so the Realtime Database socket opens only while someone needs it. Anonymous sign-in (HTTPS, not a socket) still runs
// at boot; the database stays PARKED — nothing opens it until want(reason) (HOST / JOIN / a resumed room / being in a room / the
// admin's preview panel). release(reason) — once nobody wants it, it goes offline after a grace (30 s: a quick re-host never
// reconnects twice). A tab hidden for 2 min with no room parks too (never while in a room: presence + host election need the socket).
// Every database path is built by dbRef(): a dbRef() while parked with no reason wakes the line for a grace on its own ('touch'),
// so an unlisted caller can never hang on a parked socket.
import { firebaseConfig } from './firebase-config.js';
import { slot, useEmulator } from './identity.js';
import { serverOffsetFrom } from './core/sync-math.js';
import { noteDeploy } from './ui/lazy-import.js';
import { isRefusal, pathShape } from './core/rules-lag.js';
import { lazyImport } from './ui/lazy-import.js';

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0';
let sdk = null;
const call = name => (...args) => sdk[name](...args);
// FR6 FIXES A (G6) — ONE WRITE PATH THAT REPORTS A REFUSAL. 23 client writes swallowed a PERMISSION_DENIED (`.catch(() => {})`) — a
// player's answer, the host's beat, the rematch ring's clear; LOBBY 2.0 B's whole show failed SILENTLY on rules the live database didn't
// have yet. Every write (set / update / remove / push / runTransaction) now passes through write(): the caller gets the SDK's own promise
// back UNCHANGED (its catch, its `.key`, its timing — nothing else changes), and a refusal is reported once per path SHAPE a page (ids
// masked: no room code, uid or match id leaves the phone) to /admin's errors with the label 'rules' (errlog.js → /api/log). The standard
// (docs/testing.md "THE RULES-LAG"): a feature never fails silently when the live rules are older than the code.
const REFUSED = new Set();
function refPath(r) {
  try { const u = new URL(String(r)); return decodeURIComponent(u.pathname); } catch { return ''; }
}
function refused(op, r, patch, e) {
  if (!isRefusal(e)) return;
  const keys = patch && typeof patch === 'object' && !Array.isArray(patch) && op === 'update' ? Object.keys(patch).slice(0, 4).map(pathShape) : [];
  const shape = `${op} ${pathShape(refPath(r))}${keys.length ? ` {${keys.join(', ')}}` : ''}`;
  if (REFUSED.has(shape) || REFUSED.size >= 6) return;
  REFUSED.add(shape);
  console.warn('[rules] refused:', shape);
  lazyImport(import('./errlog.js'), './errlog.js').then(m => m.reportError(new Error(`RULES REFUSED ${shape} — the live database rules may be older than the code: re-publish database.rules.json`), 'rules')).catch(() => {});
}
/** the refusals this page has reported (tests + &debug) */
export const refusals = () => [...REFUSED];
const write = name => (...args) => {
  const p = sdk[name](...args);
  if (p && typeof p.then === 'function') p.then(null, e => refused(name, args[0], args[1], e));   // (observed beside — the caller's own promise is returned as is)
  return p;
};

export const ref = call('ref');
export const get = call('get');
export const set = write('set');
export const update = write('update');
export const remove = write('remove');
export const onValue = call('onValue');
export const off = call('off');
export const onDisconnect = call('onDisconnect');
export const serverTimestamp = call('serverTimestamp');
export const runTransaction = write('runTransaction');
export const query = call('query');
export const orderByChild = call('orderByChild');
export const endAt = call('endAt');
export const limitToFirst = call('limitToFirst');
export const limitToLast = call('limitToLast');
export const push = write('push');
// whole-connection switches (chat's offline-send test hook — raw: they bypass want / release)
export const goOffline = () => sdk.goOffline(db);
export const goOnline = () => sdk.goOnline(db);

// Local development against the Firebase emulators (localhost only): add ?emu to the URL.
const EMU_CONFIG = { apiKey: 'demo-key', authDomain: 'demo-arcade.firebaseapp.com', projectId: 'demo-arcade', databaseURL: 'http://127.0.0.1:9000?ns=demo-arcade-default-rtdb', appId: 'demo' };
const config = useEmulator ? EMU_CONFIG : firebaseConfig;

export const isConfigured = useEmulator || !String(firebaseConfig.apiKey || '').includes('PASTE');

let app, auth, db;
// the server clock's offset: live from .info/serverTimeOffset while online, the last one known (kept per device) while parked
const OFFSET_KEY = 'na:srvoff';
let offset = (() => { try { const v = Number(localStorage.getItem(OFFSET_KEY)); return Number.isFinite(v) && Math.abs(v) < 864e5 ? v : 0; } catch { return 0; } })();
let readyResolve;
/** Resolves once Firebase is initialized and signed in. */
export const firebaseReady = new Promise(r => { readyResolve = r; });

/** FR7 FIXES B — a page whose IndexedDB doesn't answer: the SDK sees none (its checks are `typeof indexedDB`) — this page only */
function hideIdb() { try { Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true, writable: true }); } catch { /* polish */ } }
/** FR7 FIXES B — does IndexedDB answer? (Grok's second opinion: probe what the SDK opens NEXT — Auth's firebaseLocalStorageDb + the app's
 *  firebase-heartbeat-database — each with NO version (never an upgrade: a database that doesn't exist yet is never created here — its
 *  creation is aborted, which is an answer too), all in parallel within `ms`. ANY one silent / blocked / erroring → false. */
export const IDB_PROBE_MS = 1500;
export const IDB_PROBE_DBS = Object.freeze(['firebaseLocalStorageDb', 'firebase-heartbeat-database']);
function idbOne(idb, name) {
  return new Promise(res => {
    let fresh = false;
    try {
      const rq = idb.open(name);
      rq.onupgradeneeded = () => { fresh = true; try { rq.transaction.abort(); } catch { /* the error below still answers */ } };
      rq.onsuccess = () => { try { rq.result.close(); } catch { /* fine */ } res(true); };
      rq.onerror = e => { if (fresh) { try { e.preventDefault(); } catch { /* fine */ } res(true); } else res(false); };
      rq.onblocked = () => res(false);
    } catch { res(false); }
  });
}
export function idbAnswers(ms = IDB_PROBE_MS, idb = typeof indexedDB !== 'undefined' ? indexedDB : null, names = IDB_PROBE_DBS) {
  if (!idb) return Promise.resolve(false);
  let t;
  const limit = new Promise(r => { t = setTimeout(() => r(false), ms); });
  return Promise.race([Promise.all(names.map(n => idbOne(idb, n))).then(all => all.every(Boolean)), limit]).then(ok => { clearTimeout(t); return ok; });
}

// Each identity slot is a separately named Firebase app, so its anonymous user
// is persisted under its own key — that's what lets several tabs be different players.
export async function initFirebase(onConnectedChange) {
  const idbP = idbAnswers(IDB_PROBE_MS);   // (FR7 FIXES B: beside the SDK's import — a healthy IndexedDB answers in a few ms)
  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-database.js`),
  ]);
  sdk = { ...appMod, ...authMod, ...dbMod };
  const idbOk = await idbP;
  if (!idbOk) {
    hideIdb();
    // (hidden or not, a page whose IndexedDB didn't answer signs in on localStorage alone — never with indexedDBLocalPersistence)
    if (typeof indexedDB !== 'undefined' && indexedDB) console.warn('[firebase] IndexedDB could not be hidden from the SDK — the sign-in on localStorage alone anyway');
  }
  app = sdk.initializeApp(config, slot === '1' ? '[DEFAULT]' : `slot-${slot}`);
  // C4d (FR4 B2): localStorage FIRST. With IndexedDB first, Firebase Auth polled it every 800 ms for the life of every tab — 75 storage
  // transactions a minute, a parked title too (a storage-process wake every 0.8 s on a phone). The IndexedDB persistence stays in the
  // list so a player saved there before is MIGRATED (Firebase reads it once, moves the user to localStorage, removes it there): the
  // same uid, the same seat + profile — proven in Chromium + WebKit on the emulators (C4d), each slot's named app keeping its own user.
  // FR7 FIXES B — THE TWO-TAB HANG (the owner's iPhone: STEPPING INSIDE stuck after Safari came back with two tabs of the site open; closing
  // both fixed it): Safari's IndexedDB can stop answering until every tab of the site is closed (its storage process went while Safari was in
  // the background) — and Firebase opens IndexedDB at sign-in (Auth's migration store + the app's heartbeat, read before every sign-in
  // request), so the sign-in waited FOREVER (HOST / JOIN with it; wk-twotabs.mjs reproduced it with the store stubbed silent). Now the probe
  // decides first: IndexedDB answers within IDB_PROBE_MS → as before; it doesn't → this page hides IndexedDB from the SDK (hideIdb) and
  // signs in on localStorage alone (where every player has been since C4d) — the same uid, never a stuck sign-in.
  auth = sdk.initializeAuth(app, { persistence: idbOk ? [sdk.browserLocalPersistence, sdk.indexedDBLocalPersistence] : [sdk.browserLocalPersistence] });
  if (!idbOk) console.warn(`[firebase] IndexedDB didn’t answer in ${IDB_PROBE_MS} ms — the sign-in on localStorage alone`);
  db = sdk.getDatabase(app);
  if (useEmulator) {
    sdk.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    sdk.connectDatabaseEmulator(db, '127.0.0.1', 9000);
  }
  lineCb = onConnectedChange || null;
  // (no .info listener, no read: getDatabase() alone opens nothing — the first ref operation does, in want())
  // Wait for the persisted user to load first — signing in again would mint a new uid
  // and orphan the player's seat in their room.
  await auth.authStateReady();
  const user = auth.currentUser || (await sdk.signInAnonymously(auth)).user;
  readyResolve(user.uid);
  return user.uid;
}

export const getDb = () => db;
/** The signed-in user's Firebase ID token (for /api calls; refreshed by the SDK when it expires). */
// (FR7 FIXES A — THE FROZEN BUTTONS' proof: on the EMULATORS only, `window.__stallIdToken = true` makes the token refresh never answer — e2e-holdem)
export const idToken = () => (useEmulator && typeof window !== 'undefined' && window.__stallIdToken ? new Promise(() => {})
  : auth && auth.currentUser ? auth.currentUser.getIdToken() : Promise.reject(new Error('signed out')));
export const dbRef = path => { if (!wants.size) touch(); return ref(db, path); };
// Server-synchronized clock. Use this for every timer.
export const serverNow = () => Date.now() + offset;

// APP FIXES (Grok 3.1) — THE TITLE's CLOCK WITH NO SOCKET: the title parks the database, so a phone that never opened a room sat at
// offset 0 (its own clock) — two phones on the same RADIO STATION could be seconds apart. GET /api/time twice (no-store; the shortest
// round trip wins — core/sync-math.js#serverOffsetFrom, |offset| < 1 day) once a visible session + on return from the background (≥ 60 s
// apart). Never opens a socket (CONN), never over the socket's own offset (.info/serverTimeOffset, once the line has been up).
// DESKTOP Group 2 — THE PARTY-SYNC FLAKE (3 cloud runs: three phones' timelines 65–104 ms apart on ONE machine). The cause: each sample
// was timed with Date.now() around `await fetch` — on a busy page (the city's bakes, a slow phone, the cloud's 2-core runner) the reply is
// PROCESSED late, so the round trip looks long + lopsided and the offset is biased by about −(the delay)/2, always the same way (PS_CPU=6
// reproduced it: −149 ± 150 ms). NOW each sample is timed by the browser's NETWORK clock (Resource Timing: requestStart → responseStart,
// stamped off the main thread; mapped onto Date.now()'s clock), with Date.now() only as the fallback; up to TIME_SAMPLES samples on idle
// turns, stopping early on a clean one; a later round only replaces the clock with a SHORTER round trip (or after 10 min); a REFINE round
// ~6 s after the boot when the first one's best was slow. Proof: e2e-harbor partysync (+ PS_CPU=6).
// SPEED PASS B — E3 (review-6.md: /api/time was the biggest per-phone invocation source — 5 at boot, 5 more at 7.5 s nearly always, 5 per
// return from the background ≈ 40/h for an app-switching title phone): 3 samples; the refine round only when the boot's best was ≥ 80 ms;
// "back on screen" re-syncs only when the last sync is > 10 min old (the faster clock is kept 10 min anyway). Proof: e2e-conn THE CLOCK.
const TIME_SAMPLES = 3, TIME_GOOD_RTT = 30, TIME_REFINE_RTT = 80, TIME_BACK_MS = 600_000;
const idleTurn = () => new Promise(r => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 400 }) : setTimeout(r, 30)));
let timeN = 0;
/** watch for a url's Resource Timing entry (a PerformanceObserver: it sees entries even once the page's timing BUFFER is full — the city
 *  loads hundreds of files) → { got: Promise<{ t0, t1 } | null> (the network's send + first-byte times on Date.now()'s clock), stop } */
function netWatch(url) {
  let done, ob = null;
  const got = new Promise(r => { done = r; });
  try {
    if (typeof PerformanceObserver === 'undefined' || typeof performance === 'undefined' || !performance.timeOrigin) { done(null); return { got, stop() {} }; }
    const href = new URL(url, location.href).href;
    ob = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.name !== href) continue;
        if (!(e.requestStart > 0) || !(e.responseStart >= e.requestStart)) { done(null); continue; }
        const skew = Date.now() - (performance.timeOrigin + performance.now());   // (the monotonic clock vs the wall clock, now)
        done({ t0: performance.timeOrigin + e.requestStart + skew, t1: performance.timeOrigin + e.responseStart + skew });
      }
    });
    ob.observe({ type: 'resource', buffered: false });
  } catch { done(null); }
  return { got, stop() { try { if (ob) ob.disconnect(); } catch { /* fine */ } done(null); } };
}
let socketOffset = false, timeSyncAt = 0, timeSyncs = 0, timeSyncLast = null;
export async function syncTimeNoSocket(why = 'boot', o = {}) {
  if (socketOffset || typeof fetch !== 'function') return null;
  const t = Date.now();
  if (!o.refine && timeSyncAt && t - timeSyncAt < 60_000) return null;
  timeSyncAt = t;
  const samples = [];
  for (let k = 0; k < TIME_SAMPLES; k++) {
    try {
      await idleTurn();
      const url = `/api/time?n=${++timeN}`, w = netWatch(url), t0 = Date.now();
      const r = await fetch(url, { cache: 'no-store' });
      const t1 = Date.now();
      if (!r.ok) { w.stop(); break; }
      const j = await r.json();
      noteDeploy(j && j.v);   // (LOAD FIX 4: the first answer = the deploy this page loaded — ui/lazy-import.js)
      const net = await Promise.race([w.got, new Promise(res => setTimeout(() => res(null), 400))]); w.stop();
      const s = net || { t0, t1 };
      samples.push({ t0: s.t0, t1: s.t1, server: Number(j && j.t), net: !!net });
      if (s.t1 - s.t0 <= TIME_GOOD_RTT) break;
    } catch { break; }
  }
  const best = serverOffsetFrom(samples);
  if (!best || socketOffset) return null;
  // (keep the truer clock: a round with a slower best sample never replaces a faster one from the last 10 min)
  if (timeSyncLast && timeSyncLast.rtt <= best.rtt && t - timeSyncLast.at < 600_000) { note(`time (${why}): kept offset ${timeSyncLast.offset} ms (round trip ${timeSyncLast.rtt} ≤ ${best.rtt} ms)`); return timeSyncLast; }
  offset = best.offset; timeSyncs++; timeSyncLast = { why, offset: best.offset, rtt: best.rtt, n: samples.length, at: t, net: samples.some(x => x.net) };
  note(`time (${why}): offset ${best.offset} ms, round trip ${best.rtt} ms (${samples.length} samples${timeSyncLast.net ? ', network timing' : ''})`);
  try { localStorage.setItem(OFFSET_KEY, String(best.offset)); } catch { /* private mode: this page only */ }
  return best;
}
if (typeof document !== 'undefined') {
  // (after the first paint: a tiny request, never in the way of the boot; then once more when the bakes are done if that one was slow)
  setTimeout(() => { if (document.visibilityState === 'visible') syncTimeNoSocket('boot'); }, 1500);
  setTimeout(() => { if (document.visibilityState === 'visible' && (!timeSyncLast || timeSyncLast.rtt > TIME_REFINE_RTT)) syncTimeNoSocket('refine', { refine: true }); }, 7500);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!timeSyncAt || Date.now() - timeSyncAt > TIME_BACK_MS)) syncTimeNoSocket('back on screen'); });
}

// ---------------------------------------------------------------- CONN — want / release (the parked database)
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
// (?emu only: the E2E shortens the waits — tests/integration/e2e-conn.mjs)
// (kept for the tab like ?emu: a room's URL rewrite + a refresh drop the query)
const testMs = (k, d) => {
  if (!useEmulator) return d;
  let v = Number(q.get(k));
  try { if (v > 0) sessionStorage.setItem(`na:${k}`, String(v)); else v = Number(sessionStorage.getItem(`na:${k}`)); } catch { /* fine */ }
  return Number.isFinite(v) && v > 0 ? v : d;
};
export const GRACE_MS = testMs('conngrace', 30_000);       // nobody wants it → offline after this
export const HIDDEN_MS = testMs('connhid', 120_000);       // a hidden tab with no room → offline after this
const wants = new Set();
let lineCb = null;
let started = false;        // the .info listeners attached (the SDK's connection exists)
let parked = true;          // goOffline()'d — or never opened
let connected = false;
let releaseT = 0, hiddenT = 0, hiddenParked = false;
const log = [];             // the last changes, for the tests + the &debug=1 report
const note = what => { log.push({ at: Date.now(), what, wants: [...wants].join(',') }); if (log.length > 40) log.shift(); };
/** 'parked' (no socket, on purpose) · 'waking' (opening) · 'online' · 'lost' (wanted, open before, the network dropped it) */
let net = 'parked', everUp = false;
function emit() {
  const n = parked ? 'parked' : connected ? 'online' : everUp ? 'lost' : 'waking';
  if (n === net) return;
  net = n;
  note(`net ${n}`);
  if (lineCb) lineCb(connected, n);
}
function unpark(why) {
  if (!db) return;
  clearTimeout(releaseT); releaseT = 0;
  hiddenParked = false;
  if (!started) {
    started = true;
    parked = false; everUp = false;
    note(`open (${why})`);
    sdk.onValue(ref(db, '.info/serverTimeOffset'), s => {
      socketOffset = true;
      const v = s.val() || 0;
      if (v === offset) return;
      offset = v;
      try { localStorage.setItem(OFFSET_KEY, String(Math.round(v))); } catch { /* private mode: the live one only */ }
    });
    sdk.onValue(ref(db, '.info/connected'), s => {
      connected = !!s.val();
      if (connected) everUp = true;
      emit();
    });
    emit();
    return;
  }
  if (!parked) return;
  parked = false; everUp = false;
  note(`goOnline (${why})`);
  sdk.goOnline(db);
  emit();
}
function park(why) {
  if (!started || parked) return;
  parked = true; connected = false;
  note(`goOffline (${why})`);
  emit();                   // (first: the '.info/connected' false that follows is not a lost line)
  sdk.goOffline(db);
}
/** The database is wanted for `reason` (a string: 'room', 'join', 'admin', …): it opens now (or stays open). */
export function want(reason) {
  wants.add(reason);
  unpark(reason);
}
/** `reason` no longer needs the database: once nothing does, it parks after the grace (ms; default GRACE_MS). */
export function release(reason, grace = GRACE_MS) {
  if (!wants.delete(reason)) return;
  if (wants.size) return;
  clearTimeout(releaseT);
  releaseT = setTimeout(() => { releaseT = 0; if (!wants.size) park(`released: ${reason}`); }, grace);
}
// a database call with nobody wanting the line (an unlisted caller): open it for a grace, then park again
let touches = 0, touchFrom = '';
function touch() {
  if (!db) return;
  touches++;
  if (useEmulator) touchFrom = String(new Error().stack || '').split(/\n/).slice(2, 6).join(' | ');
  wants.add('touch');
  unpark('touch');
  setTimeout(() => release('touch'), 0);
}
// a hidden tab: parked after HIDDEN_MS unless it's in a room; back → the wanted line again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    clearTimeout(hiddenT);
    if (document.visibilityState === 'hidden') {
      hiddenT = setTimeout(() => { if (!wants.has('room') && !parked) { hiddenParked = true; park('hidden'); } }, HIDDEN_MS);
    } else if (hiddenParked) {
      hiddenParked = false;
      if (wants.size) unpark('visible');
    }
  });
}
/** What the line is doing (the tests, the &debug=1 report): { net, wants, parked, log } */
export const lineInfo = () => ({ net, wants: [...wants], parked, started, offset, socketOffset, timeSyncs, timeSyncLast, touches, touchFrom, log: log.slice(-20) });
