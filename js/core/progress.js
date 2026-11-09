// THE PROGRESSION STEP (PROGRESSION A), PURE — one counted match applied to a player's server-side stats (pstats/{pid}). The server runs
// it inside ONE transaction per player (api/_lib/stats.js#applyMatch), so it must be deterministic + idempotent: the match key (m/{key})
// makes a replayed report a no-op. The year sim (tests/levels.test.mjs) runs this exact function.
//
//   pstats/{pid}: { xp, g{game:{p,w,…}}, wk, gw{game:{…}} (this week), b{board:{a, w, wk}} (records), day{k, g{game:1}}, last, m{key: at},
//                   gd (the week whose goal was paid), it{item: at} (THE VAULT — owned items, server-granted only), st (THE STREAK —
//                   core/streak.js), fv (FAVOR tokens held — PROGRESSION B spends them), xw (BOARD 2.0 A — the XP earned THIS WEEK: { wk, x }) … }
import { boardDef, better, BOARD_GAMES, GOAL_GAMES } from './boards.js';
import { matchXp, soloXp, weeklyGoal, goalProgress, GOAL_XP } from './ranks.js';
import { levelOf, rewardsBetween, rewardsUpTo } from './levels.js';
import { SIGN_EMBLEMS } from './items.js';
import { weekKey, dayKey } from './week.js';
import { streakDay, streakPlay, dayNum, dayOf } from './streak.js';
import { noteMatch, noteEvent, awardAll } from './achievements.js';
import { todaysDailies, sweptDay, dailyXp, SWEEP_XP } from './daily.js';
const prevDayKey = d => dayOf(dayNum(d) - 1);

export const KEEP_KEYS = 60;

/**
 * BOARD 2.0 A — THE ONE XP PAYMENT (PURE): every step that pays XP goes through here (tests/board-xp.test.mjs greps for a stray `.xp =`).
 * next.xp = from + gain, and THE OVERALL BOARD's week counter xw = { wk (the Eastern week of the payment — Monday 00:00 ET), x (the XP earned
 * that week) } — a new week starts at 0. Inside the step's own transaction, so a replayed report (skipped by its key) pays nothing.
 */
export function payXp(next, from, gain, now) {
  const g = Math.max(0, Math.round(gain || 0)), wk = weekKey(now);
  next.xp = (from || 0) + g;
  const xw = next.xw && next.xw.wk === wk ? next.xw : null;
  next.xw = { ...(xw || {}), wk, x: ((xw && xw.x) || 0) + g };
  return next;
}
/** the XP a stats object earned in the week of `now` (0 when its counter is from another week) */
export const weekXp = (s, now) => (s && s.xw && s.xw.wk === weekKey(now) ? s.xw.x || 0 : 0);
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
  // (THE CARD PASS — B1: AN EMPTY SOLO RUN NEVER COUNTS — nothing answered, nothing scored: no solo XP, no streak, no solo-lane count;
  //  core/match-report.js#soloEmpty marks the row)
  if (n === 1 && row && row.empty) return { skip: 'empty' };
  // (LOBBY FIXES — ONE ACCOUNT, ONE ROOM: a match that OVERLAPS one already counted from ANOTHER room — the same profile seated in two rooms
  //  at once from two devices — is never credited; `ctx.win` = { c: the room, s: its start, e: its end }, the last OV_KEEP windows kept)
  if (overlaps(s.ov, ctx.win)) return { skip: 'overlap' };
  const wk = weekKey(now), dk = dayKey(now);
  const next = { ...s, g: { ...(s.g || {}) }, b: { ...(s.b || {}) }, m: { ...(s.m || {}) } };
  if (next.wk !== wk) { next.wk = wk; next.gw = {}; next.gs = {}; } else { next.gw = { ...(s.gw || {}) }; next.gs = { ...(s.gs || {}) }; }
  next.day = s.day && s.day.k === dk ? { k: dk, g: { ...(s.day.g || {}) }, ...(s.day.so ? { so: s.day.so } : {}) } : { k: dk, g: {} };
  const solo = n === 1;   // (SHELL 2.0 B1 — THE SOLO LANE: a room of one)
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
  const xp = solo ? soloXp(next.day.so || 0) : matchXp({ rank: row.rank, win: row.win, n, pbs: pbs.filter(p => !p.first).length, firstToday, gamesToday });
  if (solo) { next.day.so = (next.day.so || 0) + 1; next.gs[gid] = (next.gs[gid] || 0) + 1; }   // (CITY FIXES: the week's solo plays — never the goal)
  // (PROGRESSION A: NO streak XP — the owner kept Grok's "streaks pay in milestones"; the old +10 % a night is gone)
  // the weekly goal: paid once, the match that completes it
  const goal = weeklyGoal(wk, GOAL_GAMES);
  if (!solo && next.gd !== wk && goalProgress(goal, next.gw, next.gs).done) { xp.parts.push({ k: 'goal', label: 'WEEKLY GOAL', v: GOAL_XP }); xp.total += GOAL_XP; next.gd = wk; }
  const from = s.xp || 0;
  payXp(next, from, xp.total, now);   // (BOARD 2.0 A: + this week's XP — THE OVERALL BOARD)
  next.last = now;
  next.m[key] = now;
  if (ctx.win) next.ov = [...(Array.isArray(s.ov) ? s.ov : []), cleanWin(ctx.win)].slice(-OV_KEEP);
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
  next.pa = noteMatch(s.pa, { gid, rank: solo ? 0 : row.rank, win: !solo && row.win, n, night: next.st.d, flags: row.f, hosted: !!ctx.hosted, roomKey: ctx.roomKey || null,
    party: !!ctx.party, hourET: ctx.hourET ?? 20, holiday: ctx.holiday || null, friends: ctx.friends || [] });
  // THE SEASONAL EMBLEMS (2B): a counted match during the holiday's own days → its emblem (once; kept forever)
  if (ctx.holiday && SEASONAL[ctx.holiday]) items.push(...grant(next, [SEASONAL[ctx.holiday]], now));
  const aw = awardAll(next, now, { founderOpen: !!ctx.founderOpen });
  items.push(...aw.items);
  return { next, pbs, xp, from, prevStats: s, wk, lv, items, ach: aw.ach, streak: { n: next.st.n, ev: streak.ev } };
}

/** LOBBY FIXES — ONE ACCOUNT, ONE ROOM: how many counted matches' windows a profile keeps (pstats.ov) */
export const OV_KEEP = 8;
const cleanWin = w => ({ c: String(w.c || ''), s: Number(w.s) || 0, e: Number(w.e) || 0 });
/** true when `win` (a match in room win.c, from win.s to win.e) overlaps a counted match from ANOTHER room (PURE — the tests) */
export function overlaps(list, win) {
  if (!win || !Array.isArray(list)) return false;
  const w = cleanWin(win);
  if (!w.e) return false;
  if (w.s > w.e) w.s = w.e;
  // (a match known only by its end — a snapshot report, s = e — overlaps when that moment is inside the other one's window)
  return list.some(o => o && o.c && o.c !== w.c && Number(o.s) < w.e && w.s < Number(o.e));
}

/** ONE PROFILE, ONE SEAT: a profile holding two seats in one match keeps only its WORSE row (PURE — api/report.js + the tests) */
export function dedupePids(rows, pids) {
  const by = {};
  for (const [u, pid] of Object.entries(pids)) (by[pid] ||= []).push(u);
  for (const us of Object.values(by)) {
    if (us.length < 2) continue;
    us.sort((a, b) => ((rows[b] && rows[b].rank) || 0) - ((rows[a] && rows[a].rank) || 0) || (a < b ? -1 : 1));
    for (const u of us.slice(1)) delete pids[u];
  }
  return pids;
}

/** THE STREAK's day for a play (a match / a daily): the run, its milestones' items (+ a FAVOR token) — into next. */
export function playDay(next, now, outage, day = streakDay(now)) {
  const { st, ev } = streakPlay(next.st, day, outage);
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
 * them). Idempotent by its key (m/daily_<game>_<day>). { game, day (the streak day), now, top (% from the top), n (finishers), hourET,
 * flags (PW2 — the game's flags from the SERVER's record, keyed `<game>-<flag>` in pa.gf like a match's: THE PASSWORD's crack / safe) } →
 * { skip } | { next, items, streak: { n, ev }, dl, xp, lv: { from, to }, swept, counts }
 *   dl = { n (different days with a counted daily), last (day), day: { k, g: { game: 1 } (COUNTED finishes), x (XP credits that day), sw? (swept) },
 *          early (dailies before 8 am), ph (PENTHOUSE finishes), sw (days swept — THE SWEEP), sr: { d (the last swept day), n (swept days IN A ROW —
 *          PERFECT WEEK at 7) }, sb (the best run) }
 * DM2: rank = the place among the day's COUNTING finishers (PENTHOUSE — isPenthouse); a sweep adds SWEEP_XP (+10, once a day, counted only).
 * DM1: today = the LIVE dailies (core/daily.js#todaysDailies — the list, never a fixed count): THE SWEEP = all of them finished on one day; the
 * DAILY XP (core/daily.js#dailyXp, capped at one credit per daily on the list) + the level rewards it crosses. counts = THE THROWAWAY GATE
 * (api/daily.js — the profile existed before that day's 4 am Eastern start): false → the STREAK + the XP as usual, but NO counters, NO flags,
 * NO award (no achievement, no FOUNDER, no sweep) — the rewards are for counted results only.
 */
export function dailyStep(s0, { game, day, now, top = 100, rank = null, n = 0, hourET = 12, outage = null, founderOpen = false, flags = null, today = todaysDailies(), counts = true }) {
  const s = s0 || {};
  const key = `daily_${game}_${day}`;
  if (s.m && s.m[key]) return { skip: 'counted' };
  const next = { ...s, m: { ...(s.m || {}), [key]: now } };
  const dl = { n: 0, early: 0, ph: 0, ...(s.dl || {}) };
  // DFIX2 (FABLE REVIEW #2, finding 1) — EACH DAY KEEPS ITS OWN COUNTERS: dl.days = { [dayKey]: { g, x, sw? } }, the two newest days kept
  // (a run that crossed 4 am finishes on YESTERDAY's day — DFIX1 — after today's finishes have landed: it must never wipe today's, nor today's
  // wipe its). dl.day stays as a MIRROR of the newest day for anything that reads it.
  const days = dayCounters(dl, day);
  const D = days[day];
  // THE DAILY XP (counted or not — "the streak / XP as usual")
  const xp = dailyXp(D.x, today);
  D.x = (D.x || 0) + 1;
  const from = s.xp || 0;
  let swept = false, ach = [];
  if (counts) {
    if (dl.last !== day) { dl.n += 1; dl.last = day; }
    D.g[game] = 1;
    if (hourET >= 4 && hourET < 8) dl.early += 1;
    // (DM2's PENTHOUSE used to be decided HERE, at finish time, against the finishers so far — DFIX2 (finding 2 → Ben's decision 2): it is
    //  decided at THE DAY'S CLOSE against the day's FINAL counting finishers: penthouseStep below, run by api/_lib/daily-close.js)
    void top; void rank; void n;
    // THE SWEEP: the day's last daily on the list — once a day (D.sw) — + DM2's SWEEP BONUS (+10 XP) + PERFECT WEEK's run (dl.sr = the
    // swept days IN A ROW: { d: the last swept day, n }; any 7 consecutive daily-days — never a weekday rule)
    if (!D.sw && sweptDay(D.g, today)) {
      swept = true; D.sw = 1; dl.sw = (dl.sw || 0) + 1;
      sweepRun(dl, day);
      dl.sb = Math.max(dl.sb || 0, dl.sr.n);
      delete dl.pw;                                              // (DM1's week counter — replaced by the run)
      xp.total += SWEEP_XP;
      xp.parts = [...xp.parts, { k: 'sweep', label: 'THE SWEEP', v: SWEEP_XP }];
    }
    const gf = Object.entries(flags || {}).filter(([, v]) => v).map(([k]) => `${game}-${k}`);   // (a DASH — never a dot in a database key)
    if (gf.length) next.pa = { ...(s.pa || {}), gf: { ...((s.pa && s.pa.gf) || {}), ...Object.fromEntries(gf.map(k => [k, 1])) } };
  }
  dl.days = days;
  const newest = Object.keys(days).sort().pop();
  dl.day = { k: newest, ...days[newest] };
  payXp(next, from, xp.total, now);   // (BOARD 2.0 A: + this week's XP — THE OVERALL BOARD)
  const lv = { from: levelOf(from), to: levelOf(next.xp) };
  const items = lv.to > lv.from ? grant(next, rewardsBetween(lv.from, lv.to), now) : [];
  next.dl = dl;
  const streak = playDay(next, now, outage, day);   // (DFIX1: the RUN's day — a run that crossed 4 am keeps its streak day)
  items.push(...streak.items);
  if (counts) { const aw = awardAll(next, now, { founderOpen }); items.push(...aw.items); ach = aw.ach; }
  return { next, items, ach, streak: { n: next.st.n, ev: streak.ev }, dl, xp, lv, swept, counts: !!counts };
}

/** the per-day counters with `day`'s entry (a copy — safe to write), the two newest days kept; DM1's single `dl.day` migrates in */
function dayCounters(dl, day) {
  const days = {};
  for (const [k, v] of Object.entries(dl.days || {})) days[k] = { ...v, g: { ...((v && v.g) || {}) } };
  if (dl.day && dl.day.k && !days[dl.day.k]) days[dl.day.k] = { g: { ...(dl.day.g || {}) }, x: dl.day.x || 0, ...(dl.day.sw ? { sw: 1 } : {}) };
  if (!days[day]) days[day] = { g: {}, x: 0 };
  for (const k of Object.keys(days).sort().slice(0, -2)) delete days[k];
  return days;
}
const nextDayKey = d => dayOf(dayNum(d) + 1);
/**
 * PERFECT WEEK's run after a sweep on `day` (DFIX2): the chain continues (yesterday's run + 1); a sweep landing OUT OF ORDER (yesterday's
 * after today's — the run that crossed 4 am) is bridged into today's run (+ the run that ended the day before it, kept as dl.sp while the gap
 * could still close); otherwise a fresh run of 1 — the old run held in dl.sp only when the gap is exactly the one day that may still sweep.
 */
function sweepRun(dl, day) {
  const sr = dl.sr && dl.sr.d ? dl.sr : null, sp = dl.sp && dl.sp.d ? dl.sp : null;
  if (sr && sr.d === day) return;
  if (sr && sr.d === prevDayKey(day)) { dl.sr = { d: day, n: (sr.n || 0) + 1 }; delete dl.sp; return; }
  if (sr && sr.d === nextDayKey(day)) { dl.sr = { d: sr.d, n: (sr.n || 0) + 1 + (sp && sp.d === prevDayKey(day) ? sp.n || 0 : 0) }; delete dl.sp; return; }
  if (sr && sr.d === prevDayKey(prevDayKey(day))) dl.sp = sr; else delete dl.sp;
  dl.sr = { d: day, n: 1 };
}

/**
 * DFIX2 — PENTHOUSE at THE DAY'S CLOSE (FABLE REVIEW #2, finding 2 → Ben's decision 2): one winner's grant, PURE + idempotent by its key
 * (m/ph_<game>_<day>) — the server runs it inside ONE pstats transaction per winner (api/_lib/daily-close.js) once the day is over and its
 * COUNTING finishers are final. → { skip } | { next, items, ach }
 */
export function penthouseStep(s0, { game, day, now, founderOpen = false }) {
  const s = s0 || {};
  const key = `ph_${game}_${day}`;
  if (s.m && s.m[key]) return { skip: 'counted' };
  const next = { ...s, m: { ...(s.m || {}), [key]: now }, dl: { n: 0, early: 0, ...(s.dl || {}), ph: ((s.dl && s.dl.ph) || 0) + 1 } };
  const keys = Object.keys(next.m);
  if (keys.length > KEEP_KEYS) keys.sort((a, b) => next.m[a] - next.m[b]).slice(0, keys.length - KEEP_KEYS).forEach(k => delete next.m[k]);
  const aw = awardAll(next, now, { founderOpen });
  return { next, items: aw.items, ach: aw.ach };
}
