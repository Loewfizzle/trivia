// A stand-in for js/firebase.js used by the no-Firebase look previews (mapped in with an import map). Every write is a
// no-op that resolves; every read resolves to nothing; the clock is the local clock.
const resolved = () => Promise.resolve({ val: () => null, exists: () => false });
export const ref = (_db, path) => ({ path });
export const get = () => resolved();
export const set = () => Promise.resolve();
export const update = () => Promise.resolve();
export const remove = () => Promise.resolve();
// (HE3: a preview may hand a listener its value — window.__fakeDb[path]; every other preview: a listener that never fires, as before)
// (HE4: a preview that PLAYS — holdem-preview.html &play=1 — pushes new values: window.__fakePush(path, value) calls that path's listeners)
const fakeListeners = new Map();
export const onValue = (r, cb) => {
  const v = typeof window !== 'undefined' && window.__fakeDb && r ? window.__fakeDb[r.path] : undefined;
  if (v !== undefined && typeof cb === 'function') setTimeout(() => cb({ val: () => v, exists: () => v != null }), 0);
  if (!r || typeof cb !== 'function') return () => {};
  if (!fakeListeners.has(r.path)) fakeListeners.set(r.path, new Set());
  fakeListeners.get(r.path).add(cb);
  return () => { const s = fakeListeners.get(r.path); if (s) s.delete(cb); };
};
if (typeof window !== 'undefined') {
  window.__fakePush = (path, v) => {
    if (window.__fakeDb) window.__fakeDb[path] = v;
    for (const cb of fakeListeners.get(path) || []) cb({ val: () => v, exists: () => v != null });
  };
}
export const off = () => {};
export const onDisconnect = () => ({ set: () => Promise.resolve(), cancel: () => Promise.resolve() });
export const serverTimestamp = () => Date.now();
export const runTransaction = () => Promise.resolve({ committed: false });
export const query = x => x;
export const orderByChild = () => null;
export const endAt = () => null;
export const limitToFirst = () => null;
export const limitToLast = () => null;
// (PFIX-B — optional 22: the real push returns a thenable reference — callers .catch() it)
export const push = () => { const key = `k${Math.random().toString(36).slice(2)}`; const p = Promise.resolve(); return Object.assign(p, { key }); };
export const goOffline = () => {};
export const goOnline = () => {};
export const isConfigured = () => false;
export const firebaseReady = Promise.resolve();
export async function initFirebase() { return null; }
export const getDb = () => null;
export const dbRef = path => ({ path });
// (OC5: a preview may FREEZE the server clock — window.__clock() — to hold a moving moment still for a screenshot)
export const serverNow = () => (typeof window !== 'undefined' && typeof window.__clock === 'function' ? window.__clock() : Date.now());
export const idToken = () => Promise.reject(new Error('preview: no sign-in'));
// (9f: CONN's parked-database API — the previews never open a socket: wanting / releasing the line does nothing; the title-preview
// page threw "does not provide an export named 'release'" from CONN on, so every look preview + title-perf.mjs were down)
export const GRACE_MS = 30000, HIDDEN_MS = 120000;
export function want() {}
export function release() {}
export const lineInfo = () => ({ net: 'parked', wants: [], parked: true, started: false, offset: 0, touches: 0, touchFrom: [], log: [] });
