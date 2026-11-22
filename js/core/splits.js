// J1 — SPLIT TIMES (JAYWALK — docs/jaywalk.md "SPLIT TIMES"): the tick each multiple of SPLIT_EVERY (50) lanes was FIRST reached, from the
// The long notes: docs/games/jaywalk-notes.md
import { SPLIT_EVERY, TICK_HZ } from '../games/jaywalk/tuning.js';

export { SPLIT_EVERY };
/** the most splits ever kept (2,000 lanes — far past any run a person makes; a bigger list is cut, never refused) */
export const SPLIT_MAX = 40;

/** a split list from anywhere (an array, or the object RTDB hands back for one) → positive integer ticks, strictly rising, ≤ SPLIT_MAX;
 *  a bad entry ends the list there (a split is only ever reached after the one before it) */
export function cleanSplits(v) {
  const a = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v).map(Number).filter(Number.isInteger).sort((x, y) => x - y).map(k => v[k]) : [];
  const out = [];
  for (let i = 0; i < a.length && out.length < SPLIT_MAX; i++) {
    const t = a[i];
    if (!Number.isInteger(t) || t <= 0 || (out.length && t <= out[out.length - 1])) break;
    out.push(t);
  }
  return out;
}

/** the lane a split is at: i → (i + 1) × 50 */
export const splitLane = i => (i + 1) * SPLIT_EVERY;

/**
 * THE BEST SPLITS (PURE — the server's, inside the player's stats transaction): `old` = the bests kept (pstats.jsp), `run` = this counted
 * run's splits from the server's own replay → { next (the bests after it), news: [{ i, at, tick, prev }] — the splits this run made FASTER,
 * changed }. A split reached for the FIRST time becomes the best, never a NEW BEST (there was nothing to be faster than); an equal tick is
 * no new best.
 */
export function splitBests(old, run) {
  const prev = cleanSplits(old), r = cleanSplits(run), next = prev.slice(), news = [];
  let changed = false;
  for (let i = 0; i < r.length; i++) {
    if (i >= next.length) { next.push(r[i]); changed = true; continue; }
    if (r[i] < next[i]) { news.push({ i, at: splitLane(i), tick: r[i], prev: next[i] }); next[i] = r[i]; changed = true; }
  }
  return { next, news, changed };
}

/** a tick as the end card shows it: m:ss (60 ticks = 1 s; the seconds floored — a split is "reached by" its time) */
export function splitClock(tick) {
  const s = Math.max(0, Math.floor((Number(tick) || 0) / TICK_HZ));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
/** the gain of a new best: "−0:04" (the seconds it was faster by, at least 0:01 shown once it IS faster) */
export function splitGain(tick, prev) {
  const d = Math.max(0, (Number(prev) || 0) - (Number(tick) || 0));
  const s = Math.max(d > 0 ? 1 : 0, Math.round(d / TICK_HZ));
  return `−${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
