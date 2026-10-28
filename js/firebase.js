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

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0';
let sdk = null;
const call = name => (...args) => sdk[name](...args);

export const ref = call('ref');
export const get = call('get');
export const set = call('set');
export const update = call('update');
export const remove = call('remove');
export const onValue = call('onValue');
export const off = call('off');
export const onDisconnect = call('onDisconnect');
export const serverTimestamp = call('serverTimestamp');
export const runTransaction = call('runTransaction');
export const query = call('query');
export const orderByChild = call('orderByChild');
export const endAt = call('endAt');
export const limitToFirst = call('limitToFirst');
export const limitToLast = call('limitToLast');
export const push = call('push');
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

// Each identity slot is a separately named Firebase app, so its anonymous user
// is persisted under its own key — that's what lets several tabs be different players.
export async function initFirebase(onConnectedChange) {
  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-database.js`),
  ]);
  sdk = { ...appMod, ...authMod, ...dbMod };
  app = sdk.initializeApp(config, slot === '1' ? '[DEFAULT]' : `slot-${slot}`);
  auth = sdk.initializeAuth(app, { persistence: [sdk.indexedDBLocalPersistence, sdk.browserLocalPersistence] });
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
export const idToken = () => (auth && auth.currentUser ? auth.currentUser.getIdToken() : Promise.reject(new Error('signed out')));
export const dbRef = path => { if (!wants.size) touch(); return ref(db, path); };
// Server-synchronized clock. Use this for every timer.
export const serverNow = () => Date.now() + offset;

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
export const lineInfo = () => ({ net, wants: [...wants], parked, started, offset, touches, touchFrom, log: log.slice(-20) });
