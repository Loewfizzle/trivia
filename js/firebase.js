// Firebase bootstrap + thin helpers. Everything Firebase-specific is imported from here.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInAnonymously, connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getDatabase, ref, get, set, update, remove, onValue, off, onDisconnect, serverTimestamp,
  runTransaction, query, orderByChild, endAt, limitToFirst, connectDatabaseEmulator,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';
import { slot, useEmulator } from './identity.js';

export { ref, get, set, update, remove, onValue, off, onDisconnect, serverTimestamp, runTransaction, query, orderByChild, endAt, limitToFirst };

// Local development against the Firebase emulators (localhost only): add ?emu to the URL.
const EMU_CONFIG = { apiKey: 'demo-key', authDomain: 'demo-arcade.firebaseapp.com', projectId: 'demo-arcade', databaseURL: 'http://127.0.0.1:9000?ns=demo-arcade-default-rtdb', appId: 'demo' };
const config = useEmulator ? EMU_CONFIG : firebaseConfig;

export const isConfigured = useEmulator || !String(firebaseConfig.apiKey || '').includes('PASTE');

let app, auth, db;
let offset = 0;

// Each identity slot is a separately named Firebase app, so its anonymous user
// is persisted under its own key — that's what lets several tabs be different players.
export async function initFirebase(onConnectedChange) {
  app = initializeApp(config, slot === '1' ? '[DEFAULT]' : `slot-${slot}`);
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  db = getDatabase(app);
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectDatabaseEmulator(db, '127.0.0.1', 9000);
  }
  onValue(ref(db, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });
  onValue(ref(db, '.info/connected'), s => onConnectedChange && onConnectedChange(!!s.val()));
  // Wait for the persisted user to load first — signing in again would mint a new uid
  // and orphan the player's seat in their room.
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  return user.uid;
}

export const getDb = () => db;
export const dbRef = path => ref(db, path);
// Server-synchronized clock. Use this for every timer.
export const serverNow = () => Date.now() + offset;
