// BOARD 2.0 A — THE OVERALL BOARDS' VALUES (PURE — the server's api/_lib/lb.js#overallPaths writes them; the tests read them without
// firebase-admin): a player's stats (pstats/{pid}) → each overall board's sort value for ALL TIME and its WEEKS (null = not on it).
//   xp            — THE OVERALL BOARD: ALL TIME = the total XP (the level order) · a week = the XP earned that week (pstats.xw)
//   daily · daily-<game> — DAILY POINTS (core/daily-points.js): a week = its points summed · ALL TIME = the average a day × 100, from MIN_DAYS
import { weekXp } from './progress.js';
import { weekKey } from './week.js';
import { POINT_DAILIES, pointsValues } from './daily-points.js';

/** → { [board]: { all, week (this week's), weeks: { [wk]: v }, avg?, days? } } (sort values; null = off that board) */
export function overallValues(stats, now) {
  const s = stats || {}, pos = v => (v > 0 ? v : null), wk = weekKey(now);
  const xw = s.xw && s.xw.x > 0 ? { [s.xw.wk]: s.xw.x } : {};
  const out = { xp: { all: pos(s.xp || 0), week: pos(weekXp(s, now)), weeks: xw } };
  for (const g of [null, ...POINT_DAILIES]) {
    const v = pointsValues(s.dp, g);
    out[g ? `daily-${g}` : 'daily'] = { all: v.all, week: v.weeks[wk] || null, weeks: v.weeks, avg: v.avg, days: v.days };
  }
  return out;
}
