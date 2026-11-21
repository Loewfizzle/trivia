// J3 — THE TIME BOARDS (JAYWALK's daily — docs/jaywalk.md "J3"; the owner's decisions: docs/games/plan.md "JAYWALK J3"). PURE (the server,
// the phone + the unit tests — no DOM, no clock, no database).
//   THE DAY's SPLIT BOARD (server-written, dly/jaywalk/{day}/sp/{pid} = [best tick to 50, to 100, …]) = each player's FASTEST time to every 50
//   from ANY of the day's closed tries — from the SERVER's replay splits only (jaywalk-tries.js#scoreTry `sp`; a refused try has none), raised
//   by ONE transaction at every close (raiseDay). The tabs: MOST LANES (the lanes board — unchanged) · FASTEST TO 50 · TO 100 · … — a tab for
//   every 50 anyone in the shown scope reached (a split is only reached after the one before it: the tabs are 50 … the farthest). Equal times
//   share a place (both 1ST, the next 3RD). The time boards are a VIEW: they never touch the lanes result, the points, ALL TIME or DAILY BEST.
import { cleanSplits, splitBests, splitLane } from './splits.js';
export { timeClock, tabLabel, bestTimeLine } from './jw-time-text.js';

/** the rows a time tab shows before SHOW ALL / the most it lists (the lanes board's own cut — core/every.js TOP_SHOW / TOP_KEEP) */
export const TIME_SHOW = 10, TIME_KEEP = 50;

/** the transaction's body: the player's day bests raised by one closed try's server splits → the next list | undefined (nothing faster) */
export function raiseDay(cur, sp) {
  const run = cleanSplits(sp);
  if (!run.length) return undefined;
  const { next, changed } = splitBests(cur, run);
  return changed ? next : undefined;
}
/** THE BUILD (a day whose tries closed before the board existed): one player's bests from their record's closed, proven tries */
export function dayFromTries(tries) {
  let best = [];
  for (const x of tries || []) {
    if (!x || !Number.isFinite(x.e) || x.bad || !x.sp) continue;
    best = splitBests(best, x.sp).next;
  }
  return best;
}
/** a stored board → { pid: [ticks] } (broken entries dropped — never a throw) */
export function cleanMap(node) {
  const out = {};
  for (const [k, v] of Object.entries(node && typeof node === 'object' ? node : {})) { const sp = cleanSplits(v); if (k && sp.length) out[k] = sp; }
  return out;
}
/** the tabs of a scope: the split indices (0 = 50, 1 = 100 …) anyone in `map` reached, in order */
export function timeTabs(map) {
  let n = 0;
  for (const sp of Object.values(map || {})) n = Math.max(n, cleanSplits(sp).length);
  return Array.from({ length: n }, (_, i) => i);
}
/** one tab's ranking: everyone in `map` who reached split i, fastest first; EQUAL TIMES SHARE A PLACE (1, 1, 3); a stable order by pid */
export function timeRows(map, i) {
  const rows = [];
  for (const [k, v] of Object.entries(map || {})) { const sp = cleanSplits(v); if (sp.length > i) rows.push({ k, t: sp[i] }); }
  rows.sort((a, b) => a.t - b.t || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  let rank = 0, prev = null;
  rows.forEach((r, j) => { if (r.t !== prev) { rank = j + 1; prev = r.t; } r.rank = rank; });
  return rows;
}

/**
 * THE VIEW one player gets for one scope (EVERYONE: the day's counted players · YOUR TABLE: you + your friends): per tab the first `limit`
 * rows (+ your own row below them, with its place), friends marked; the hidden profiles (the boards' opt-out) left out of the list without
 * re-ranking around them (core/every.js#everyView's rule); `unranked` = YOUR own row that doesn't count yet (THE THROWAWAY GATE: shown, no place).
 *   → { tabs: [50, 100, …], b: { [lane]: { list: [{ k, t, rank, me?, f? }], mine: { k, t, rank?, gated? } | null, more } } }
 */
export function timeView(map, { pid = null, friends = new Set(), hidden = new Set(), unranked = false, limit = TIME_SHOW } = {}) {
  const ranked = { ...(map || {}) }, own = pid && ranked[pid] ? ranked[pid] : null;
  if (unranked && pid) delete ranked[pid];
  const tabs = timeTabs(map), b = {};
  for (const i of tabs) {
    const lane = splitLane(i);
    const all = timeRows(ranked, i).filter(r => !hidden.has(r.k) || r.k === pid);
    const face = r => ({ k: r.k, t: r.t, rank: r.rank, ...(r.k === pid ? { me: 1 } : {}), ...(friends.has(r.k) && r.k !== pid ? { f: 1 } : {}) });
    const list = all.slice(0, limit).map(face);
    const at = all.findIndex(r => r.k === pid);
    let mine = at >= limit ? face(all[at]) : null;
    if (unranked && own && cleanSplits(own).length > i) mine = { k: pid, t: cleanSplits(own)[i], me: 1, gated: 1 };
    b[lane] = { list, mine, more: all.length };
  }
  return { tabs: tabs.map(splitLane), b };
}

/** THE SHARE CARD's line (spoiler-free): the HIGHEST split reached today + its best time → { at: lane, t: tick } | null (no split reached) */
export function shareBest(tries) {
  const sp = dayFromTries(tries);
  return sp.length ? { at: splitLane(sp.length - 1), t: sp[sp.length - 1] } : null;
}
