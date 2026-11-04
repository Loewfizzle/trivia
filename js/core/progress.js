// THE PROGRESSION STEP (PROGRESSION A), PURE — one counted match applied to a player's server-side stats (pstats/{pid}). The server runs
// it inside ONE transaction per player (api/_lib/stats.js#applyMatch), so it must be deterministic + idempotent: the match key (m/{key})
// makes a replayed report a no-op. The year sim (tests/levels.test.mjs) runs this exact function.
//
//   pstats/{pid}: { xp, g{game:{p,w,…}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records), day{k, g{game:1}}, last, m{key: at},
//                   gd (the week whose goal was paid), it{item: at} (THE VAULT — owned items, server-granted only), st (THE STREAK —
//                   core/streak.js), fv (FAVOR tokens held — PROGRESSION B spends them) … }
import { boardDef, better, BOARD_GAMES, GOAL_GAMES } from './boards.js';
import { matchXp, weeklyGoal, goalProgress, GOAL_XP } from './ranks.js';
import { levelOf, rewardsBetween, rewardsUpTo } from './levels.js';
import { SIGN_EMBLEMS } from './items.js';
import { weekKey, dayKey } from './week.js';
import { streakDay, streakPlay } from './streak.js';
import { noteMatch, noteEvent, awardAll } from './achievements.js';

export const KEEP_KEYS = 60;
export const DEFAULT_GAP_MS = 45_000;
const add = (o, c) => { const x = { ...(o || {}) }; for (const [k, v] of Object.entries(c || {})) x[k] = (x[k] || 0) + v; return x; };

/** THE SEASONAL EMBLEMS (THE VAULT 2B): holiday id → its emblem — the SERVER's (api/_lib/catalog.js registers it; names only to owners) */
export const SEASONAL = {};
export function registerSeasonalItems(map) { Object.assign(SEASONAL, map || {}); }

/** Items into `it` (only the new ones; never a second time): → the ids actually added. */
export function grant(next, ids, now) {
  next.it = { ...(next.it || {}) };
  const got = [];
  for (const id of ids) if (id && !next.it[id]) { next.it[id] = now; got.push(id); }
  return got;
}

/**
 * One counted match. s = the stats as they are (or null); { key, gid, row: { rank, win, c, rec }, n, now, gap, outage (streak days the
 * owner marked), ctx (the achievements' facts the server knows: { hosted, roomKey, party, hourET, holiday, friends, founderOpen }) } →
 * { skip } | { next, pbs, xp, from, prevStats, wk, lv: { from, to }, streak: { n, ev }, items: [ids new to this player], ach: [ids] }
 */
export function matchStep(s0, { key, gid, row, n, now, gap = DEFAULT_GAP_MS, outage = null, ctx = {} }) {
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
  const goal = weeklyGoal(wk, GOAL_GAMES);
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
  // (THE VAULT 2C: the 12 sign-up shapes back-filled into `it` don't make a first match look like a returning one — the level rewards up to here)
  const had = s.it && Object.keys(s.it).some(id => !SIGN_EMBLEMS.includes(id));
  const items = grant(next, had ? rewardsBetween(lv.from, lv.to) : rewardsUpTo(lv.to), now);
  const streak = playDay(next, now, outage);
  items.push(...streak.items);
  // THE ACHIEVEMENTS: the match into the counters, then the award engine (+ FOUNDER while the window is open)
  next.pa = noteMatch(s.pa, { gid, rank: row.rank, win: row.win, n, night: next.st.d, flags: row.f, hosted: !!ctx.hosted, roomKey: ctx.roomKey || null,
    party: !!ctx.party, hourET: ctx.hourET ?? 20, holiday: ctx.holiday || null, friends: ctx.friends || [] });
  // THE SEASONAL EMBLEMS (2B): a counted match during the holiday's own days → its emblem (once; kept forever)
  if (ctx.holiday && SEASONAL[ctx.holiday]) items.push(...grant(next, [SEASONAL[ctx.holiday]], now));
  const aw = awardAll(next, now, { founderOpen: !!ctx.founderOpen });
  items.push(...aw.items);
  return { next, pbs, xp, from, prevStats: s, wk, lv, items, ach: aw.ach, streak: { n: next.st.n, ev: streak.ev } };
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

/**
 * THE CARRY-OVER outside a match (the `me` call): the level rewards an XP total has earned, the achievements its stats already prove
 * (wins, the streak …), FOUNDER while the window is open — whatever `it` / `ac` lack → { next, items, ach } | null (nothing new).
 */
export function carryOver(s0, now, { founderOpen = false } = {}) {
  const s = s0 || {};
  const next = { ...s };
  const items = grant(next, rewardsUpTo(levelOf(s.xp || 0)), now);
  const aw = awardAll(next, now, { founderOpen });
  items.push(...aw.items);
  return items.length || aw.ach.length ? { next, items, ach: aw.ach } : null;
}

/**
 * An event outside a match (THE KNOCK, THE WATCHER's hour, the real weather, a SIGHTING, a birthday): the counters + the award engine.
 * → { next, items, ach } | null (nothing new — a second knock is a no-op).
 */
export function eventStep(s0, ev, now, { founderOpen = false } = {}) {
  const s = s0 || {};
  const pa = noteEvent(s.pa, ev);
  if (!pa) return null;
  const next = { ...s, pa };
  const aw = awardAll(next, now, { founderOpen });
  return { next, items: aw.items, ach: aw.ach };
}

/**
 * One finished DAILY (the daily contract — core/daily.js): it keeps THE STREAK like a match + the dailies' counters (the achievements read
 * them). Idempotent by its key (m/daily_<game>_<day>). { game, day (the streak day), now, top (% from the top), n (finishers), hourET } →
 * { skip } | { next, items, streak: { n, ev }, dl }
 *   dl = { n (different days with a daily), last (day), day: { k, g: { game: 1 } }, early (dailies before 8 am), ph (PENTHOUSE finishes) }
 */
export function dailyStep(s0, { game, day, now, top = 100, n = 0, hourET = 12, outage = null, founderOpen = false }) {
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
  const aw = awardAll(next, now, { founderOpen });
  return { next, items: [...streak.items, ...aw.items], ach: aw.ach, streak: { n: next.st.n, ev: streak.ev }, dl };
}
