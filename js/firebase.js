// Firebase bootstrap + thin helpers. Everything Firebase-specific is imported from here.
//
// The SDK (~450 KB) is loaded with a dynamic import inside initFirebase(), so the title
// screen can paint before it arrives. The exported helpers are thin wrappers that call
// into the loaded SDK — every caller runs after initFirebase() has resolved.
import { firebaseConfig } from './firebase-config.js';
import { slot, useEmulator } from './identity.js';

const SDK = 'https://www.gstatic.com/firebasejs/13.0.0';
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
// whole-connection switches (chat's offline-send test hook)
export const goOffline = () => sdk.goOffline(db);
export const goOnline = () => sdk.goOnline(db);

// Local development against the Firebase emulators (localhost only): add ?emu to the URL.
const EMU_CONFIG = { apiKey: 'demo-key', authDomain: 'demo-arcade.firebaseapp.com', projectId: 'demo-arcade', databaseURL: 'http://127.0.0.1:9000?ns=demo-arcade-default-rtdb', appId: 'demo' };
const config = useEmulator ? EMU_CONFIG : firebaseConfig;

export const isConfigured = useEmulator || !String(firebaseConfig.apiKey || '').includes('PASTE');

let app, auth, db;
let offset = 0;
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
  onValue(ref(db, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });
  onValue(ref(db, '.info/connected'), s => onConnectedChange && onConnectedChange(!!s.val()));
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
export const dbRef = path => ref(db, path);
// Server-synchronized clock. Use this for every timer.
export const serverNow = () => Date.now() + offset;
