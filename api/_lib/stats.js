// Applying a verified match: career counters, records, XP, the level + its rewards, then the boards. Exactly once per player: each
// player's update is ONE transaction on pstats/{pid} running the PURE step (js/core/progress.js#matchStep — the same code the year sim
// runs) that also records the match key (m/{key}), so a retry, a second reporter or a crash halfway can never count a match twice.
import { ref, val } from './fb.js';
import { boardPaths, rankOf, clearBoardCache, matchCount, minMatches, syncBoards } from './lb.js';
import { boardDef, toSort } from '../../js/core/boards.js';
import { matchStep } from '../../js/core/progress.js';
import { levelOf, emblemRank } from '../../js/core/levels.js';
import { bumpOwners } from './owners.js';

// one match per player per this long — a real match takes minutes; this stops a forged room from farming wins
export const MIN_MATCH_GAP_MS = Number(process.env.MATCH_GAP_MS ?? 45_000);
const step = (stats, key, gid, row, n, now, outage) => matchStep(stats, { key, gid, row, n, now, gap: MIN_MATCH_GAP_MS, outage });

/** THE OUTAGE days the owner marked in /admin (streak/outage/{day}) — small; read once per report. */
export const outageDays = async () => (await val('streak/outage')) || {};

/**
 * ex: core/match-report.js#extractMatch output; pids: { uid: pid }.
 * → { pid: outcome } where outcome = { gid, rank, win, xp{gain, parts, from, to}, rk{from, to}, pbs[], ranks[], skip? }
 */
export async function applyMatch(key, ex, pids, now = Date.now()) {
  const outcomes = {};
  const outage = await outageDays().catch(() => ({}));
  await Promise.all(Object.entries(ex.rows).map(async ([uid, row]) => {
    const pid = pids[uid];
    if (!pid) return;
    let res = null;
    const tx = await ref(`pstats/${pid}`).transaction(cur => {
      res = step(cur, key, ex.gid, row, ex.n, now, outage);
      return res.skip ? undefined : res.next;
    });
    if (!tx.committed || !res || res.skip) {
      outcomes[pid] = { gid: ex.gid, rank: row.rank, win: row.win, skip: (res && res.skip) || 'busy' };
      return;
    }
    const stats = tx.snapshot.val();
    const prof = (await val(`profiles/${pid}`)) || {};
    // BNAME: listed on the public boards only from the BOARD_MIN_MATCHES-th counted match (all games together)
    const played = matchCount(stats);
    const listed = !prof.h && played >= minMatches();
    // ranks before the boards change (for "ENTERED THE TOP 10")
    const watch = [...res.pbs.map(p => p.b), `${ex.gid}-wins`].filter((b, i, a) => a.indexOf(b) === i);
    const before = {};
    if (listed) {
      await Promise.all(watch.map(async b => {
        const def = boardDef(b);
        const old = boardPaths(pid, res.prevStats, { now, only: ex.gid });
        const oa = old[`lb/${b}/all/${pid}`], ow = old[`lb/${b}/${res.wk}/${pid}`];
        before[b] = { all: oa != null ? await rankOf(b, 'all', oa, now) : null, week: ow != null ? await rankOf(b, res.wk, ow, now) : null, def };
      }));
    }
    const r0 = emblemRank(res.from), r1 = emblemRank(stats.xp);
    const patch = { [`profiles/${pid}/x`]: stats.xp, [`profiles/${pid}/l`]: levelOf(stats.xp), [`profiles/${pid}/r`]: r1, [`profiles/${pid}/s`]: (stats.st && stats.st.n) || 1, [`profiles/${pid}/sd`]: (stats.st && stats.st.d) || null, [`profiles/${pid}/m`]: played, ...boardPaths(pid, stats, { hidden: !listed, now, only: ex.gid }) };
    await ref('/').update(patch);
    // "X% OF PLAYERS HAVE THIS": the owners' counts (best effort — a count is display only)
    await bumpOwners(res.items, !matchCount(res.prevStats)).catch(e => console.warn('owners', e && e.message));
    // the match that crosses the floor puts every game's boards up at once (the earlier matches were held back)
    if (listed && played === minMatches()) await syncBoards(pid, { now });
    const ranks = [];
    if (listed) {
      const paths = boardPaths(pid, stats, { now, only: ex.gid });
      await Promise.all(watch.map(async b => {
        const va = paths[`lb/${b}/all/${pid}`], vw = paths[`lb/${b}/${res.wk}/${pid}`];
        if (va == null && vw == null) return;
        ranks.push({ b, all: { rank: await rankOf(b, 'all', va, now), prev: before[b] ? before[b].all : null },
          week: { rank: await rankOf(b, res.wk, vw, now), prev: before[b] ? before[b].week : null } });
      }));
    }
    outcomes[pid] = {
      gid: ex.gid, rank: row.rank, win: row.win, n: ex.n,
      xp: { gain: res.xp.total, parts: res.xp.parts, from: res.from, to: stats.xp },
      rk: { from: r0, to: r1 }, lv: res.lv, items: res.items, pbs: res.pbs, ranks, hidden: !!prof.h, played, streak: (stats.st && stats.st.n) || 1, st: stats.st || null, sev: res.streak.ev,
    };
  }));
  clearBoardCache();
  return outcomes;
}

export { toSort };
