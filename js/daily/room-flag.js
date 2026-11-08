// THE MID-DAILY FLAG (DFIX2 — FABLE REVIEW #2 finding 6 → Ben's decision 4): a phone with a daily run OPEN or HELD while it sits in a room
// writes rooms/{CODE}/players/{uid}/dy = true — its OWN node (the rules: a boolean, the player's own, nothing else); the host's "N PLAYERS
// ARE MID-DAILY" line reads it from the mirrored room state (room-city.js#paintDock) — ZERO /api calls (was: the host polling `room` every
// 20 s, 180 invocations an hour per open lobby). Cleared (null) when the run finishes, closes unheld, the hold is dropped (resumed · the
// day turned · the chip's rule) or the room is left (the node goes with the player). The server's `room` action stays for the tests.
//   wantFlag()            → is this phone mid-daily right now (a run overlay open, or a held run)?
//   syncMidFlag(on, st)   → the flag as it should be (writes only on a change; a refusal — the rules not yet re-published — is reported by
//                           firebase.js#write and the line simply stays off)
import { state } from '../store.js';
import { dbRef, set } from '../firebase.js';
import { heldRun } from './today.js';

let last = '';
export const wantFlag = () => (typeof document !== 'undefined' && document.body.dataset.daily === 'run') || !!heldRun();

export function syncMidFlag(on = wantFlag(), st = state) {
  const code = st.code, uid = st.uid, me = st.players && st.players[uid];
  if (!code || !uid || !me) { last = ''; return false; }
  const want = !!on, key = `${code}|${uid}|${want ? 1 : 0}`;
  if (key === last) return false;
  last = key;
  if (!!me.dy === want) return false;                            // (the room already says so — nothing to write)
  set(dbRef(`rooms/${code}/players/${uid}/dy`), want ? true : null).catch(() => {});
  return true;
}
