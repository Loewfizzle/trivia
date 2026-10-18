// Applying a verified match: career counters, records, XP and rank, then the boards. Exactly once per player:
// each player's update is ONE transaction on pstats/{pid} that also records the match key (m/{key}), so a retry,
// a second reporter or a crash halfway can never count a match twice.
//
//   pstats/{pid}: { xp, g{game:{p,w,…}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records: all-time best,
//                   this week's best), day{k, g{game:1}}, last (server ms of the last counted match), m{key: at},
//                   st{n, d} (the nightly streak), gd (the week whose goal was paid) }
import { ref, val } from './fb.js';
import { boardPaths, rankOf, clearBoardCache } from './lb.js';
import { boardDef, better, toSort } from '../../js/core/boards.js';
import { matchXp, rankIndex, streakAfter, streakPart, weeklyGoal, goalProgress, GOAL_XP } from '../../js/core/ranks.js';
import { BOARD_GAMES } from '../../js/core/boards.js';
import { weekKey, dayKey } from '../../js/core/week.js';

const KEEP_KEYS = 60;
// one match per player per this long — a real match takes minutes; this stops a forged room from farming wins
export const MIN_MATCH_GAP_MS = Number(process.env.MATCH_GAP_MS ?? 45_000);

function step(stats, key, gid, row, n, now) {
  const s = stats || {};
  if (s.m && s.m[key]) return { skip: 'counted' };
  if (s.last && now - s.last < MIN_MATCH_GAP_MS && now >= s.last) return { skip: 'too_soon' };
  const wk = weekKey(now), dk = dayKey(now);
  const next = { ...s, g: { ...(s.g || {}) }, b: { ...(s.b || {}) }, m: { ...(s.m || {}) } };
  if (next.wk !== wk) { next.wk = wk; next.gw = {}; } else next.gw = { ...(s.gw || {}) };
  next.day = s.day && s.day.k === dk ? { k: dk, g: { ...(s.day.g || {}) } } : { k: dk, g: {} };
  const firstToday = !next.day.g[gid];
  next.day.g[gid] = 1;
  const gamesToday = Object.keys(next.day.g).length;
  const add = (o, c) => { const x = { ...(o || {}) }; for (const [k, v] of Object.entries(c)) x[k] = (x[k] || 0) + v; return x; };
  next.g[gid] = add(next.g[gid], row.c);
  next.gw[gid] = add(next.gw[gid], row.c);
  const pbs = [];
  for (const [board, v] of Object.entries(row.rec || {})) {
    const def = boardDef(board);
    if (!def) continue;
    const old = s.b && s.b[board];
    const b = { ...(old || {}) };
    const prevAll = old ? old.a : null;
    const prevWeek = old && old.wk === wk ? old.w : null;
    if (better(def, v, prevAll)) { b.a = v; pbs.push({ b: board, v, prev: prevAll, first: prevAll == null }); }
    if (better(def, v, prevWeek)) { b.w = v; b.wk = wk; }
    next.b[board] = b;
  }
  const xp = matchXp({ rank: row.rank, win: row.win, n, pbs: pbs.filter(p => !p.first).length, firstToday, gamesToday });
  // the nightly streak: +10 % a night from the second, up to +40 %
  next.st = streakAfter(s.st, dk, dayKey(now - 86_400_000));
  const sp = streakPart(xp.total, next.st.n);
  if (sp) { xp.parts.push(sp); xp.total += sp.v; }
  // the weekly goal: paid once, the match that completes it
  const goal = weeklyGoal(wk, BOARD_GAMES);
  if (next.gd !== wk && goalProgress(goal, next.gw).done) { xp.parts.push({ k: 'goal', label: 'WEEKLY GOAL', v: GOAL_XP }); xp.total += GOAL_XP; next.gd = wk; }
  const from = s.xp || 0;
  next.xp = from + xp.total;
  next.last = now;
  next.m[key] = now;
  const keys = Object.keys(next.m);
  if (keys.length > KEEP_KEYS) keys.sort((a, b) => next.m[a] - next.m[b]).slice(0, keys.length - KEEP_KEYS).forEach(k => delete next.m[k]);
  return { next, pbs, xp, from, prevStats: s, wk };
}

/**
 * ex: core/match-report.js#extractMatch output; pids: { uid: pid }.
 * → { pid: outcome } where outcome = { gid, rank, win, xp{gain, parts, from, to}, rk{from, to}, pbs[], ranks[], skip? }
 */
export async function applyMatch(key, ex, pids, now = Date.now()) {
  const outcomes = {};
  await Promise.all(Object.entries(ex.rows).map(async ([uid, row]) => {
    const pid = pids[uid];
    if (!pid) return;
    let res = null;
    const tx = await ref(`pstats/${pid}`).transaction(cur => {
      res = step(cur, key, ex.gid, row, ex.n, now);
      return res.skip ? undefined : res.next;
    });
    if (!tx.committed || !res || res.skip) {
      outcomes[pid] = { gid: ex.gid, rank: row.rank, win: row.win, skip: (res && res.skip) || 'busy' };
      return;
    }
    const stats = tx.snapshot.val();
    const prof = (await val(`profiles/${pid}`)) || {};
    // ranks before the boards change (for "ENTERED THE TOP 10")
    const watch = [...res.pbs.map(p => p.b), `${ex.gid}-wins`].filter((b, i, a) => a.indexOf(b) === i);
    const before = {};
    if (!prof.h) {
      await Promise.all(watch.map(async b => {
        const def = boardDef(b);
        const old = boardPaths(pid, res.prevStats, { now, only: ex.gid });
        const oa = old[`lb/${b}/all/${pid}`], ow = old[`lb/${b}/${res.wk}/${pid}`];
        before[b] = { all: oa != null ? await rankOf(b, 'all', oa, now) : null, week: ow != null ? await rankOf(b, res.wk, ow, now) : null, def };
      }));
    }
    const r0 = rankIndex(res.from), r1 = rankIndex(stats.xp);
    const patch = { [`profiles/${pid}/x`]: stats.xp, [`profiles/${pid}/r`]: r1, [`profiles/${pid}/s`]: (stats.st && stats.st.n) || 1, ...boardPaths(pid, stats, { hidden: !!prof.h, now, only: ex.gid }) };
    await ref('/').update(patch);
    const ranks = [];
    if (!prof.h) {
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
      rk: { from: r0, to: r1 }, pbs: res.pbs, ranks, hidden: !!prof.h, streak: (stats.st && stats.st.n) || 1,
    };
  }));
  clearBoardCache();
  return outcomes;
}

export { toSort };
