// DAILY A — DAILY BEST (PURE — the owner, Nov 18: docs/games/plan.md "DAILY A / B"; docs/progression.md "DAILY BEST"): a player's best result
// EVER per daily, kept on the SERVER (pstats/{pid}/db/{game} — written only inside THE DAILY's own stats transaction, api/daily.js#finishRun;
// read by its owner with the rest of pstats; backfilled once from the kept days by /admin → DAILY BEST BACKFILL). Compared by each daily's
// OWN rule — ONE table, a row per daily (PLUG-AND-PLAY: a new daily = its row here):
//   THE PASSWORD  fewest guesses — a LOCKOUT never counts       (score = (2 − doors) × 100 + guesses: both doors = 2 … 12)
//   COAST CLEAR   the fastest CLEAR — CAUGHT never counts        (score = whole seconds; caught ≥ 10000)
//   THE DROP      the longest time (the lines break a tie)       (score = tenths × 1000 + lines)
//   JAYWALK       the most lanes (the earlier tick breaks a tie) (score = lanes × JW_SPAN + (JW_SPAN − 1 − tick) — jaywalk-daily's own)
//   HIGH RISE     the most floors (perfects, then the earlier tick break a tie) (score = floors × 1e8 + perfects × 1e5 + (99999 − tick) — held.js#hrScore)
// A record: { s: the best score, day: its streak day, at: when it was set, p?: the best from an EARLIER day it beat (none = the first ever) }.
// THE ONE DAY LINE: the backfill reads only days from the progress reset's day on (a run before the reset is never paid — nor kept as a best).

import { weekOfDay } from './daily-points.js';

/** JAYWALK's daily score: lanes first, then the EARLIER tick (better: 'high') — lanes × JW_SPAN + (JW_SPAN − 1 − tick) */
export const JW_SPAN = 100000;
export const jwScore = (lanes, tick) => Math.max(0, Math.floor(lanes)) * JW_SPAN + (JW_SPAN - 1 - Math.max(0, Math.min(JW_SPAN - 1, Math.floor(tick))));
export const jwLanes = score => Math.floor(Math.max(0, Number(score) || 0) / JW_SPAN);
export const jwTick = score => JW_SPAN - 1 - (Math.max(0, Math.floor(Number(score) || 0)) % JW_SPAN);

/** THE TABLE — a row per daily: better ('low' | 'high') + counts(score) (a result that may ever be a best) */
export const BEST_RULES = Object.freeze({
  password: Object.freeze({ better: 'low', counts: s => s >= 1 && s < 100, label: 'fewest guesses — a lockout never counts' }),
  coastclear: Object.freeze({ better: 'low', counts: s => s >= 0 && s < 10000, label: 'the fastest clear — caught never counts' }),
  drop: Object.freeze({ better: 'high', counts: s => s >= 0, label: 'the longest time' }),
  jaywalk: Object.freeze({ better: 'high', counts: s => s >= 0, label: 'the most lanes (the earlier tick on a tie)' }),
  highrise: Object.freeze({ better: 'high', counts: s => s >= 0, label: 'the most floors (perfects, then the earlier tick on a tie)' }),
});
export const BEST_DAILIES = Object.freeze(Object.keys(BEST_RULES));

const num = v => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
/** may this score ever be a DAILY BEST of `game`? */
export function bestCounts(game, score) {
  const R = BEST_RULES[game], s = num(score);
  return !!R && s != null && R.counts(s);
}
/** is score `a` strictly better than `b` for `game` (b null = nothing yet → any counting a is better) */
export function isBetter(game, a, b) {
  if (!bestCounts(game, a)) return false;
  if (num(b) == null || !bestCounts(game, b)) return true;
  return BEST_RULES[game].better === 'low' ? Number(a) < Number(b) : Number(a) > Number(b);
}

/**
 * ONE result into a player's DAILY BEST (PURE, idempotent — the same result again changes nothing): db = pstats.db (or null) →
 * the next db | null (unchanged). `p` = the best it beat (absent = the first ever).
 */
export function bestStep(db0, { game, score, day, now = 0 }) {
  if (!BEST_RULES[game] || !day) return null;
  const cur = db0 && db0[game];
  if (!isBetter(game, score, cur && cur.s)) return null;
  // (`p` = the best from an EARLIER day it beat — a later try the same day keeps the day's `p`: beating your own first try today is no NEW best)
  const prev = !cur || num(cur.s) == null || !bestCounts(game, cur.s) ? null : cur.day === String(day) ? (num(cur.p) != null ? Number(cur.p) : null) : Number(cur.s);
  const next = { s: Number(score), day: String(day), at: Number(now) || 0, ...(prev != null ? { p: prev } : {}) };
  return { ...(db0 || {}), [game]: next };
}

/** what `today` + a finish hand the phone for one daily: { best: { s, day } | null, newBest (today's result BEAT an earlier best), first (today's
 *  result is the first best ever) } */
export function bestView(entry, day) {
  if (!entry || num(entry.s) == null) return { best: null, newBest: false, first: false };
  const set = entry.day === day;
  return { best: { s: Number(entry.s), day: entry.day }, newBest: set && entry.p != null, first: set && entry.p == null };
}

/**
 * THE BACKFILL (PURE): a player's DAILY BEST rebuilt from the kept days (days = { [game]: { [day]: score } } — a day before `fromDay` left out)
 * merged with what is already stored (a stored best that is better stays — safe to run twice) → { db, changed: [game…] }
 */
export function bestFromRecords(stored, days, { fromDay = null } = {}) {
  let db = stored && typeof stored === 'object' ? { ...stored } : {};
  const changed = [];
  for (const game of Object.keys(days || {})) {
    if (!BEST_RULES[game]) continue;
    const list = Object.entries(days[game] || {}).filter(([d, s]) => /^d\d{8}$/.test(d) && (!fromDay || d >= fromDay) && num(s) != null).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    for (const [d, s] of list) {
      const nx = bestStep(db, { game, score: s, day: d, now: 0 });
      if (nx) { db = nx; if (!changed.includes(game)) changed.push(game); }
    }
  }
  // (a backfilled best never claims NEW DAILY BEST: `p` only marks a best a LIVE finish beat)
  for (const g of changed) if (db[g]) { const { p, ...rest } = db[g]; void p; db[g] = { ...rest, bf: 1 }; }
  return { db, changed };
}

/**
 * DAILY A — A BETTER TRY's POINTS (JAYWALK's 3 tries — the best counts): the day + game ALREADY scored by its first try (pointsStep) → only the
 * DIFFERENCE added (the day, its week, ALL TIME — never a second day played). PURE → the next dp | null (no higher, or the day no longer kept)
 */
export function pointsRaise(dp0, { game, day, pts }) {
  const D0 = dp0 && dp0.d && dp0.d[day];
  const had = D0 && D0.g ? Number(D0.g[game]) : NaN;
  if (pts == null || !Number.isFinite(had) || !(pts > had)) return null;
  const add = pts - had, dp = dp0;
  const d = { ...dp.d, [day]: { ...D0, g: { ...D0.g, [game]: pts }, t: (D0.t || 0) + add } };
  const wk = weekOfDay(day), w = { ...(dp.w || {}) };
  if (w[wk]) w[wk] = { ...w[wk], t: (w[wk].t || 0) + add, g: { ...(w[wk].g || {}), [game]: ((w[wk].g || {})[game] || 0) + add } };
  const a = { ...(dp.a || {}), t: ((dp.a && dp.a.t) || 0) + add, g: { ...((dp.a && dp.a.g) || {}) } };
  if (a.g[game]) a.g[game] = { ...a.g[game], t: (a.g[game].t || 0) + add };
  return { ...dp, d, w, a };
}
