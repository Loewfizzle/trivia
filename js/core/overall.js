// BOARD 2.0 A — THE OVERALL BOARDS' VALUES (PURE — the server's api/_lib/lb.js#overallPaths writes them; the tests read them without
// firebase-admin): a player's stats (pstats/{pid}) → each overall board's sort value for ALL TIME and THIS WEEK (null = not on it).
//   xp — THE OVERALL BOARD: ALL TIME = the total XP (the level order) · THIS WEEK = the XP earned since Monday 00:00 ET (pstats.xw)
import { weekXp } from './progress.js';

/** → { [board]: { all, week } } (sort values; null = off that board) */
export function overallValues(stats, now) {
  const s = stats || {}, pos = v => (v > 0 ? v : null);
  return {
    xp: { all: pos(s.xp || 0), week: pos(weekXp(s, now)) },
  };
}
