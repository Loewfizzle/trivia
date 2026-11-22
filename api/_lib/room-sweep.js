// THE FIX PASS — S2: THE STALE-ROOM SWEEP ON THE SERVER. The phones swept stale rooms themselves (room.js#cleanupStaleRooms, on every HOST),
// which needed the rules to LIST rooms to any signed-in client — a stranger paged through every live room, its players' names + profile ids.
// Now the rules list nothing (rooms/.read false); the admin SDK sweeps AT MOST ONCE AN HOUR (due.js — a marker transaction), run from
// THE DAY'S CLOSE's `today` call and the log prune (api/log.js): the rooms idle past ROOM_IDLE_MS + 60 s (or with no meta) are deleted with
// their side nodes, their hush word resting as a phone's close does. The plan is pure: core/room-logic.js#roomSweepPatch.
import { ref, fb } from './fb.js';
import { claimDue } from './due.js';
import { roomSweepPatch } from '../../js/core/room-logic.js';
import { ROOM_IDLE_MS } from '../../js/config.js';

export const SWEEP_EVERY_MS = 3600_000;
export const SWEEP_BATCH = 25;
/** sweep now → { n: rooms deleted, codes } (≤ rounds × SWEEP_BATCH a call) */
export async function sweepStaleRooms({ now = Date.now(), rounds = 4 } = {}) {
  const codes = [];
  for (let i = 0; i < rounds; i++) {
    const snap = await fb().db.ref('rooms').orderByChild('meta/activeAt').endAt(now - ROOM_IDLE_MS - 60_000).limitToFirst(SWEEP_BATCH).once('value');
    const plan = roomSweepPatch(snap.val() || {}, now);
    if (!plan.codes.length) break;
    await ref().update(plan.patch);
    codes.push(...plan.codes);
    if (plan.codes.length < SWEEP_BATCH) break;
  }
  return { n: codes.length, codes };
}
/** the hourly sweep (never waited on by a caller that answers a phone) → the result, or null when not due */
export async function sweepRoomsIfDue(now = Date.now()) {
  if (!(await claimDue('rooms', SWEEP_EVERY_MS, now))) return null;
  return sweepStaleRooms({ now });
}
