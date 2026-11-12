// FR7 FIXES B — FR7-A C5's two WHOLE-TREE reads (/admin's STATS + the radio's openRooms did `val('rooms')`: every room ever left open, each
// whole — one fat room, or a pile of dead ones, slowed or broke both). Now ONE indexed, bounded query: the rooms active in the last hour
// (`meta/activeAt` — the rules' own .indexOn; every room has it since FR7 FIXES A's C3), at most LIVE_ROOMS_MAX, the newest kept.
import { fb } from './fb.js';

export const LIVE_ROOMS_MAX = 120;
export const LIVE_WINDOW_MS = 3600e3;
/** → { [code]: room } — the live rooms only (activeAt within the window), ≤ max */
export async function liveRoomsRead(now = Date.now(), { within = LIVE_WINDOW_MS, max = LIVE_ROOMS_MAX } = {}) {
  const snap = await fb().db.ref('rooms').orderByChild('meta/activeAt').startAt(now - within).limitToLast(max).once('value');
  return snap.val() || {};
}
