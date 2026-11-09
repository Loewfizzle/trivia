// BOARD 2.0 A — THE BACK-FILL (/admin → THE BOARDS → BACK-FILL: a PREVIEW, then BACK-FILL NOW on a second tap — admins only, audited). ONE
// idempotent step for the new boards, run ONCE by the OWNER on the live site after the deploy (never by a pass — the emulators prove it):
//   · THE OVERALL BOARD — THIS WEEK rebuilt from the stored records (core/board-fill.js#rebuildWeekXp: every match's results/{key} + the week's
//     daily runs re-paid through THE DAILY XP's rule); ALL TIME = each profile's total XP (pstats.xp — already exact);
//   · (Group 2) DAILY POINTS — every counted daily result since the dailies went live, re-scored through the SAME pure table.
// Each player: ONE transaction on pstats/{pid} (the week counter = the larger of the live one and the rebuilt one; the points set from the
// records), then their board rows from the stats (lb.js#boardPaths — the listing rules unchanged). A second run writes the same numbers.
import { ref, val } from './fb.js';
import { boardPaths, matchCount, minMatches, clearBoardCache } from './lb.js';
import { rebuildWeekXp, filledWeek } from '../../js/core/board-fill.js';
import { weekKey } from '../../js/core/week.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { todaysDailies } from '../../js/core/daily.js';
import { openDailies } from './dailies.js';

/** the first daily-day the back-fill reads (the dailies' share epoch — nothing was played before it) */
export const DAILY_FROM = 'd20261101';

/** every day key from `from` to `to` (inclusive) */
export function daysBetween(from, to) {
  const out = [];
  for (let n = dayNum(from); n <= dayNum(to); n++) out.push(dayOf(n));
  return out;
}

/** the stored daily runs: { [game]: { [day]: { r, s, x } } } — every game on the list, every day since DAILY_FROM */
export async function readDaily(games, now) {
  const days = daysBetween(DAILY_FROM, streakDay(now)), out = {};
  await Promise.all(games.map(async g => {
    out[g] = {};
    await Promise.all(days.map(async d => {
      const [r, s, x] = await Promise.all([val(`dly/${g}/${d}/r`), val(`dly/${g}/${d}/s`), val(`dly/${g}/${d}/x`)]);
      if (r) out[g][d] = { r, s: s || {}, x: x || {} };
    }));
  }));
  return out;
}

export async function boardsBackfill({ confirm = false, now = Date.now() } = {}) {
  await openDailies(now).catch(() => {});
  const live = todaysDailies(), wk = weekKey(now);
  const [results, stats, daily] = await Promise.all([val('results'), val('pstats'), readDaily(live, now)]);
  const week = rebuildWeekXp({ results: results || {}, daily, live, wk });
  const pids = Object.keys(stats || {});
  const preview = { wk, players: pids.length, weekPlayers: Object.keys(week).length, weekXp: Object.values(week).reduce((a, b) => a + b, 0), days: Object.values(daily).reduce((n, g) => n + Object.keys(g).length, 0) };
  if (!confirm) return { done: false, preview };
  let rows = 0;
  for (const pid of pids) {
    let next = null;
    const tx = await ref(`pstats/${pid}`).transaction(cur => {
      if (cur == null) return cur;   // (a transaction's first run may see null — never abort on it: the server retries with the real value)
      next = { ...cur, xw: filledWeek(cur.xw, week[pid] || 0, wk) };
      return next;
    });
    if (!tx.committed) continue;
    const s = tx.snapshot.val() || {}, prof = (await val(`profiles/${pid}`)) || {};
    const paths = boardPaths(pid, s, { hidden: !!prof.h || matchCount(s) < minMatches(), now });
    const overall = Object.fromEntries(Object.entries(paths).filter(([p]) => /^lb\/xp\//.test(p)));
    if (Object.keys(overall).length) { await ref('/').update(overall); rows += Object.values(overall).filter(v => v != null).length; }
  }
  clearBoardCache();
  return { done: true, preview, rows };
}
