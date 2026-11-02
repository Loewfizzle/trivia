// THE PROGRESSION STEP (PROGRESSION A), PURE — one counted match applied to a player's server-side stats (pstats/{pid}). The server runs
// it inside ONE transaction per player (api/_lib/stats.js#applyMatch), so it must be deterministic + idempotent: the match key (m/{key})
// makes a replayed report a no-op. The year sim (tests/levels.test.mjs) runs this exact function.
//
//   pstats/{pid}: { xp, g{game:{p,w,…}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records), day{k, g{game:1}}, last, m{key: at},
//                   gd (the week whose goal was paid), it{item: at} (THE VAULT — owned items, server-granted only) … }
import { boardDef, better, BOARD_GAMES } from './boards.js';
import { matchXp, weeklyGoal, goalProgress, GOAL_XP } from './ranks.js';
import { levelOf, rewardsBetween, rewardsUpTo } from './levels.js';
import { weekKey, dayKey } from './week.js';

export const KEEP_KEYS = 60;
export const DEFAULT_GAP_MS = 45_000;
const add = (o, c) => { const x = { ...(o || {}) }; for (const [k, v] of Object.entries(c || {})) x[k] = (x[k] || 0) + v; return x; };

/** Items into `it` (only the new ones; never a second time): → the ids actually added. */
export function grant(next, ids, now) {
  next.it = { ...(next.it || {}) };
  const got = [];
  for (const id of ids) if (id && !next.it[id]) { next.it[id] = now; got.push(id); }
  return got;
}

/**
 * One counted match. s = the stats as they are (or null); { key, gid, row: { rank, win, c, rec }, n, now, gap } →
 * { skip } | { next, pbs, xp, from, prevStats, wk, lv: { from, to }, items: [ids new to this player] }
 */
export function matchStep(s0, { key, gid, row, n, now, gap = DEFAULT_GAP_MS }) {
  const s = s0 || {};
  if (s.m && s.m[key]) return { skip: 'counted' };
  if (s.last && now - s.last < gap && now >= s.last) return { skip: 'too_soon' };
  const wk = weekKey(now), dk = dayKey(now);
  const next = { ...s, g: { ...(s.g || {}) }, b: { ...(s.b || {}) }, m: { ...(s.m || {}) } };
  if (next.wk !== wk) { next.wk = wk; next.gw = {}; } else next.gw = { ...(s.gw || {}) };
  next.day = s.day && s.day.k === dk ? { k: dk, g: { ...(s.day.g || {}) } } : { k: dk, g: {} };
  const firstToday = !next.day.g[gid];
  next.day.g[gid] = 1;
  const gamesToday = Object.keys(next.day.g).length;
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
  // (PROGRESSION A: NO streak XP — the owner kept Grok's "streaks pay in milestones"; the old +10 % a night is gone)
  // the weekly goal: paid once, the match that completes it
  const goal = weeklyGoal(wk, BOARD_GAMES);
  if (next.gd !== wk && goalProgress(goal, next.gw).done) { xp.parts.push({ k: 'goal', label: 'WEEKLY GOAL', v: GOAL_XP }); xp.total += GOAL_XP; next.gd = wk; }
  const from = s.xp || 0;
  next.xp = from + xp.total;
  next.last = now;
  next.m[key] = now;
  const keys = Object.keys(next.m);
  if (keys.length > KEEP_KEYS) keys.sort((a, b) => next.m[a] - next.m[b]).slice(0, keys.length - KEEP_KEYS).forEach(k => delete next.m[k]);
  // LEVELS: the rewards of every level crossed — and the CARRY-OVER: a profile from before levels (no `it` yet) gets every reward its
  // XP had already earned, at once, the first time it is touched
  const lv = { from: levelOf(from), to: levelOf(next.xp) };
  const items = grant(next, s.it ? rewardsBetween(lv.from, lv.to) : rewardsUpTo(lv.to), now);
  return { next, pbs, xp, from, prevStats: s, wk, lv, items };
}

/** The carry-over outside a match (the `me` call): the rewards an XP total has earned and `it` lacks → { next, items } | null. */
export function carryOver(s0, now) {
  const s = s0 || {};
  const want = rewardsUpTo(levelOf(s.xp || 0));
  if (s.it && want.every(id => s.it[id])) return null;
  const next = { ...s };
  const items = grant(next, want, now);
  return items.length ? { next, items } : null;
}
