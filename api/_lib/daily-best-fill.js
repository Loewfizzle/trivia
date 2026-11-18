// DAILY A — THE DAILY BEST BACKFILL (/admin → THE DAILIES → DAILY BEST · BACKFILL; owner only — the admin gate; audited by api/admin.js):
// every player's DAILY BEST (pstats/{pid}/db — js/core/daily-best.js) built from the KEPT days' scores — dly/{game}/{day}/r (the day's score
// per pid: kept for good — THE DROP's prune keeps r/, nothing deletes it) — from the first daily day (FIRST_DAY) or THE PROGRESS RESET's day
// (THE ONE DAY LINE — a run before the reset is never paid, nor kept as a best), to today. A PREVIEW first (nothing written), the run on a second
// tap. IDEMPOTENT + SAFE TWICE: each player's stored best is MERGED by each daily's own rule (a better stored best stays) in ONE transaction.
// The report names what couldn't be recovered: the days with no kept scores (nobody played, or `dailyFresh` wiped them) per daily, and the
// days before the reset.
import { ref, val } from './fb.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { BEST_DAILIES, bestFromRecords } from '../../js/core/daily-best.js';

/** the first day any daily was played (THE PASSWORD + COAST CLEAR's epoch — meta.js PW_EPOCH / CC_EPOCH) */
export const FIRST_DAY = 'd20261101';
const isPid = p => /^p[a-z2-9]{11}$/.test(p);

/** → { preview: { from, to, days, players, games: { game: { days, scores, missing: [day…] } }, before? }, done?, written? } */
export async function bestBackfill({ confirm = false, now = Date.now() } = {}) {
  const today = streakDay(now), resetAt = Number(await val('progress/resetAt')) || 0;
  const resetDay = resetAt > 0 ? streakDay(resetAt) : null;
  const from = resetDay && resetDay > FIRST_DAY ? resetDay : FIRST_DAY;
  const days = [];
  for (let n = dayNum(from); n <= dayNum(today); n++) days.push(dayOf(n));
  const byPid = new Map(), games = {};
  await Promise.all(BEST_DAILIES.map(async g => {
    const G = games[g] = { days: 0, scores: 0, missing: [] };
    const rs = await Promise.all(days.map(d => val(`dly/${g}/${d}/r`).catch(() => null)));
    rs.forEach((r, k) => {
      const d = days[k];
      if (!r || typeof r !== 'object' || !Object.keys(r).length) { G.missing.push(d); return; }
      G.days++;
      for (const [pid, s] of Object.entries(r)) {
        if (!isPid(pid) || s == null) continue;
        G.scores++;
        if (!byPid.has(pid)) byPid.set(pid, {});
        const P = byPid.get(pid);
        (P[g] ||= {})[d] = s;
      }
    });
  }));
  const preview = { from, to: today, days: days.length, players: byPid.size, games, ...(resetDay && resetDay > FIRST_DAY ? { before: `the days before ${resetDay} (THE PROGRESS RESET) are left out` } : {}) };
  if (!confirm) return { preview, dryRun: true };
  let written = 0, gone = 0;
  for (const [pid, recs] of byPid) {
    if (!(await val(`profiles/${pid}/n`))) { gone++; continue; }   // (a removed profile gets nothing)
    let changed = false;
    await ref(`pstats/${pid}/db`).transaction(cur => { const r = bestFromRecords(cur, recs); changed = r.changed.length > 0; return changed ? r.db : undefined; });
    if (changed) written++;
  }
  return { preview, done: true, written, gone };
}
