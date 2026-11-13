// BOARD 2.0 A — THE BACK-FILL (/admin → THE BOARDS → BACK-FILL: a PREVIEW, then BACK-FILL NOW on a second tap — admins only, audited). ONE
// idempotent step for the new boards, run ONCE by the OWNER on the live site after the deploy (never by a pass — the emulators prove it):
//   · THE OVERALL BOARD — THIS WEEK rebuilt from the stored records (core/board-fill.js#rebuildWeekXp: every match's results/{key} + the week's
//     daily runs re-paid through THE DAILY XP's rule); ALL TIME = each profile's total XP (pstats.xp — already exact);
//   · (Group 2) DAILY POINTS — every counted daily result since the dailies went live, re-scored through the SAME pure table.
//   · (HOLD'EM IN THE CITY) THE HOLD'EM BOARD — every counted HOLD'EM tournament on the dealer's record: the wins (+ the knockouts the
//     records keep — from this pass on) into pstats g/gw.holdem (core/board-fill.js#holdemFromRecords + filledHoldem) → the holdem-tw rows.
// Each player: ONE transaction on pstats/{pid} (the week counter = the larger of the live one and the rebuilt one; the points set from the
// records), then their board rows from the stats (lb.js#boardPaths). A second run writes the same numbers.
// PD-3 Group 0 — WHO GETS LISTED: the same run sets each profile's COUNTED PLAYS (pstats.cp) exactly from the records (core/board-fill.js#
// countedPlaysFromRecords — room matches + counted daily finishes, never a solo run) and RE-CHECKS who's listed: every board row (not only the
// overall ones) + profiles/{pid}/m are rewritten, so a player the new rule lists appears on every board, one it doesn't comes off.
import { ref, val } from './fb.js';
import { boardPaths, hiddenOf, clearBoardCache } from './lb.js';
import { OVERALL_IDS } from '../../js/core/boards.js';
import { pointsFromRecords, pointsStep } from '../../js/core/daily-points.js';
import { rebuildWeekXp, filledWeek, countedPlaysFromRecords, holdemFromRecords, filledHoldem, sinceReset } from '../../js/core/board-fill.js';
import { boardHidden } from '../../js/core/progress.js';
import { minMatches } from './lb.js';
import { weekKey } from '../../js/core/week.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { todaysDailies } from '../../js/core/daily.js';
import { openDailies } from './dailies.js';

/** the first daily-day the back-fill reads (the dailies' share epoch — nothing was played before it) */
export const DAILY_FROM = 'd20261101';
/** FR7 FIXES A — E1: THE RESET EPOCH's node (server-only by the root deny) — stamped by THE LAUNCH RESET, restored by a RESTORE */
export const RESET_AT = 'progress/resetAt';

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
  const [allResults, stats, allDaily, resetAt] = await Promise.all([val('results'), val('pstats'), readDaily(live, now), val(RESET_AT)]);
  // FR7 FIXES A — E1, THE RESET EPOCH: the boards rebuild only from what came after THE LAUNCH RESET (core/board-fill.js#sinceReset); FR7 FIXES
  // B — E4 (the owner): COUNTED PLAYS too — the reset clears `cp`, so who is listed counts only the plays after it
  const { results, daily } = sinceReset({ results: allResults || {}, daily: allDaily }, resetAt);
  const week = rebuildWeekXp({ results: results || {}, daily, live, wk });
  const pids = Object.keys(stats || {});
  const pointsPlayers = pids.filter(pid => pointsFromRecords(daily, pid)).length;
  const plays = countedPlaysFromRecords({ results: results || {}, daily });
  const profs = (await val('profiles')) || {};
  const listedNow = pids.filter(pid => !boardHidden(profs[pid], stats[pid], minMatches())).length;
  // (FR7 FIXES C — S4: COUNTED PLAYS = the larger of the live count + the rebuilt one — a back-fill never takes a counted play away)
  const cpOf = (cur, pid) => Math.max(Number(cur && cur.cp) || 0, plays[pid] || 0);
  const listedAfter = pids.filter(pid => !boardHidden(profs[pid], { ...stats[pid], cp: cpOf(stats[pid], pid) }, minMatches())).length;
  const hold = holdemFromRecords({ results: results || {}, wk });
  const preview = { wk, players: pids.length, weekPlayers: Object.keys(week).length, weekXp: Object.values(week).reduce((a, b) => a + b, 0), days: Object.values(daily).reduce((n, g) => n + Object.keys(g).length, 0), pointsPlayers, listedNow, listedAfter,
    holdemPlayers: Object.keys(hold).length, holdemWins: Object.values(hold).reduce((a, e) => a + e.all.tw, 0), resetAt: Number(resetAt) || 0 };
  if (!confirm) return { done: false, preview };
  let rows = 0;
  for (const pid of pids) {
    let next = null;
    const tx = await ref(`pstats/${pid}`).transaction(cur => {
      if (cur == null) return cur;   // (a transaction's first run may see null — never abort on it: the server retries with the real value)
      next = { ...cur, xw: filledWeek(cur.xw, week[pid] || 0, wk), cp: cpOf(cur, pid) };
      if (hold[pid]) Object.assign(next, filledHoldem(cur, hold[pid], wk));   // (HOLD'EM IN THE CITY: THE HOLD'EM BOARD from the records)
      // DAILY POINTS: rebuilt from every counted result on record, then any day + game the live counter already has that the read missed (a
      // finish during the run) — the same pure step, so a second run lands on the same numbers
      let dp = pointsFromRecords(daily, pid);
      for (const [day, D] of Object.entries((cur.dp && cur.dp.d) || {})) for (const [game, pts] of Object.entries((D && D.g) || {})) { const nx = pointsStep(dp, { game, day, pts }); if (nx) dp = nx; }
      if (dp) next.dp = dp; else delete next.dp;
      return next;
    });
    if (!tx.committed) continue;
    const s = tx.snapshot.val() || {}, prof = (await val(`profiles/${pid}`)) || {};
    // (PD-3 Group 0: EVERY board row — the listing re-checked with the exact count — + the profile's count; a missing profile gets no rows)
    const paths = boardPaths(pid, s, { hidden: prof && prof.n ? hiddenOf(prof, s) : 'opt', now });
    if (prof && prof.n) paths[`profiles/${pid}/m`] = s.cp || 0;
    if (Object.keys(paths).length) { await ref('/').update(paths); rows += Object.entries(paths).filter(([p, v]) => v != null && OVERALL_IDS.includes(p.split('/')[1])).length; }
  }
  clearBoardCache();
  return { done: true, preview, rows };
}
