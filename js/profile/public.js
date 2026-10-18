// Public profiles of the people in the room (name tag, rank emblem), live: a rename or a rank-up shows at once.
// room.js calls watchRoomProfiles(players) whenever the player list changes; components read pubOf(player).
import { dbRef, onValue } from '../firebase.js';
import { setState } from '../store.js';

const subs = new Map();    // pid → unsubscribe
const pubs = {};           // pid → { n, t, a, c, x, r, h }
let queued = false;

function changed() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; setState({ pub: { ...pubs } }); });
}

export function watchRoomProfiles(players) {
  const want = new Set(Object.values(players || {}).map(p => p && p.pid).filter(p => typeof p === 'string' && /^p[a-z2-9]{11}$/.test(p)));
  for (const [pid, off] of subs) if (!want.has(pid)) { off(); subs.delete(pid); delete pubs[pid]; changed(); }
  for (const pid of want) {
    if (subs.has(pid)) continue;
    try {
      subs.set(pid, onValue(dbRef(`profiles/${pid}`), s => { const v = s.val(); if (v) pubs[pid] = v; else delete pubs[pid]; changed(); }, () => {}));
    } catch { /* offline / not ready: the next player update retries */ }
  }
}

/** The public profile behind a room player node ({ name, pid, … }), or null. */
export const pubOf = player => (player && player.pid && pubs[player.pid]) || null;

export function stopRoomProfiles() {
  for (const off of subs.values()) off();
  subs.clear();
  for (const k of Object.keys(pubs)) delete pubs[k];
  changed();
}
