// HIGH RISE — THE SERVER HALF (S1 — docs/highrise.md "THE JUDGE"). NOT a function (the 8 stay 8) and PURE: it never imports fb.js (THE
// UNIT JOB INSTALLS NOTHING — tests/highrise-server.test.mjs runs it in Node). It imports the SAME engine modules the phone runs
// (js/games/highrise/…): the judge's replay IS the phone's run. NOT WIRED into /api/report yet (S2: the solo run node · S4: the match ·
// S5: the daily) — nothing calls it but its tests.
import { judgeRun as judge, unpackTaps } from '../../js/games/highrise/replay.js';
import { featsOf } from '../../js/games/highrise/logic.js';

/**
 * judgeRun({ seed, mode, taps }) → { ok: true, floor, tick, end, cause, made, perfects, maxStreak, taps, feats: { reachedClouds, reachedTop } }
 *                                | { ok: false, why }
 *   floor = the slabs landed · tick = when the last one landed (THE RANKING: height, then the earlier tick) · end = the tick the run ended ·
 *   cause = 'miss' (MISSED THE STACK) | 'thin' (SLIPPED OFF) | 'slow' (TOO SLOW — the fuse) | 'made' (floor 200: MADE IT) | 'cap'.
 * The result is the server's OWN replay — a phone's claimed floor is never read (there is no field for one).
 * REFUSED (`why`): 'seed' (not a string of 1 … 64) · 'mode' · 'taps' (not a list) · 'too many taps' (more taps than the mode has floors /
 * than any run holds) · 'entry' (a tick that is not a whole number ≥ 0) · 'ticks not rising' · 'in the landing beat' (a tap with no slab
 * to drop — also a tap before the first slab) · 'past the cap' · 'after the fuse' (a gap no honest run has: the fuse had dropped that
 * slab) · 'past the end' (a tap after the run was over — an out, the finish, the fuse's own drop).
 */
export const judgeRun = input => judge(input || {});

/** the same judge from a PACKED log (replay.js#packTaps — S2's run node keeps it that way) */
export function judgePacked({ seed, mode = 'solo', log } = {}) {
  const taps = unpackTaps(log);
  return taps ? judge({ seed, mode, taps }) : { ok: false, why: 'log' };
}

/** the result row a report will read (S2+): { f: floor, t: tick, w: cause, e: end, p: perfects, s: maxStreak, ft?: feats } — a refused run = no tower */
export const serverRow = v => (v && v.ok
  ? { f: v.floor, t: v.tick, w: v.cause, e: v.end, p: v.perfects, s: v.maxStreak, ...(featsOf(v) ? { ft: featsOf(v) } : {}) }
  : { f: 0, t: 0, w: '', e: -1, p: 0, s: 0, bad: String((v && v.why) || 'refused').slice(0, 24) });
