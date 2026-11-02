// THE PROGRESSION STEP (PROGRESSION A), PURE — one counted match applied to a player's server-side stats (pstats/{pid}). The server runs
// it inside ONE transaction per player (api/_lib/stats.js#applyMatch), so it must be deterministic + idempotent: the match key (m/{key})
// makes a replayed report a no-op. The year sim (tests/levels.test.mjs) runs this exact function.
//
//   pstats/{pid}: { xp, g{game:{p,w,…}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records), day{k, g{game:1}}, last, m{key: at},
//                   gd (the week whose goal was paid), it{item: at} (THE VAULT — owned items, server-granted only), st (THE STREAK —
//                   core/streak.js), fv (FAVOR tokens held — PROGRESSION B spends them) … }
import { boardDef, better, BOARD_GAMES } from './boards.js';
import { matchXp, weeklyGoal, goalProgress, GOAL_XP } from './ranks.js';
import { levelOf, rewardsBetween, rewardsUpTo } from './levels.js';
import { weekKey, dayKey } from './week.js';
import { streakDay, streakPlay } from './streak.js';

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
 * One counted match. s = the stats as they are (or null); { key, gid, row: { rank, win, c, rec }, n, now, gap, outage (streak days the
 * owner marked) } → { skip } | { next, pbs, xp, from, prevStats, wk, lv: { from, to }, streak: { n, ev }, items: [ids new to this player] }
 */
export function matchStep(s0, { key, gid, row, n, now, gap = DEFAULT_GAP_MS, outage = null }) {
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
  const streak = playDay(next, now, outage);
  items.push(...streak.items);
  return { next, pbs, xp, from, prevStats: s, wk, lv, items, streak: { n: next.st.n, ev: streak.ev } };
}

/** THE STREAK's day for a play (a match / a daily): the run, its milestones' items (+ a FAVOR token) — into next. */
export function playDay(next, now, outage) {
  const { st, ev } = streakPlay(next.st, streakDay(now), outage);
  next.st = st;
  const items = grant(next, ev.milestones.flatMap(m => m.items), now);
  const fav = ev.milestones.reduce((a, m) => a + (m.favor || 0), 0);
  if (fav) next.fv = (next.fv || 0) + fav;
  return { ev, items };
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

/**
 * One finished DAILY (the daily contract — core/daily.js): it keeps THE STREAK like a match + the dailies' counters (the achievements read
 * them). Idempotent by its key (m/daily_<game>_<day>). { game, day (the streak day), now, top (% from the top), n (finishers), hourET } →
 * { skip } | { next, items, streak: { n, ev }, dl }
 *   dl = { n (different days with a daily), last (day), day: { k, g: { game: 1 } }, early (dailies before 8 am), ph (PENTHOUSE finishes) }
 */
export function dailyStep(s0, { game, day, now, top = 100, n = 0, hourET = 12, outage = null }) {
  const s = s0 || {};
  const key = `daily_${game}_${day}`;
  if (s.m && s.m[key]) return { skip: 'counted' };
  const next = { ...s, m: { ...(s.m || {}), [key]: now } };
  const dl = { n: 0, early: 0, ph: 0, ...(s.dl || {}) };
  if (dl.last !== day) { dl.n += 1; dl.last = day; }
  dl.day = dl.day && dl.day.k === day ? { k: day, g: { ...(dl.day.g || {}) } } : { k: day, g: {} };
  dl.day.g[game] = 1;
  if (hourET >= 4 && hourET < 8) dl.early += 1;
  if (n >= 50 && top <= 1) dl.ph += 1;
  next.dl = dl;
  const streak = playDay(next, now, outage);
  return { next, items: streak.items, streak: { n: next.st.n, ev: streak.ev }, dl };
}
