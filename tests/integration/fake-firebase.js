// A stand-in for js/firebase.js used by the no-Firebase look previews (mapped in with an import map). Every write is a
// no-op that resolves; every read resolves to nothing; the clock is the local clock.
const resolved = () => Promise.resolve({ val: () => null, exists: () => false });
export const ref = (_db, path) => ({ path });
export const get = () => resolved();
export const set = () => Promise.resolve();
export const update = () => Promise.resolve();
export const remove = () => Promise.resolve();
export const onValue = () => () => {};
export const off = () => {};
export const onDisconnect = () => ({ set: () => Promise.resolve(), cancel: () => Promise.resolve() });
export const serverTimestamp = () => Date.now();
export const runTransaction = () => Promise.resolve({ committed: false });
export const query = x => x;
export const orderByChild = () => null;
export const endAt = () => null;
export const limitToFirst = () => null;
export const limitToLast = () => null;
export const push = () => ({ key: `k${Math.random().toString(36).slice(2)}` });
export const goOffline = () => {};
export const goOnline = () => {};
export const isConfigured = () => false;
export const firebaseReady = Promise.resolve();
export async function initFirebase() { return null; }
export const getDb = () => null;
export const dbRef = path => ({ path });
export const serverNow = () => Date.now();
