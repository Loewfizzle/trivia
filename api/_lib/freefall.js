// FREEFALL — THE SERVER HALF (F1 — docs/freefall.md "THE JUDGE"). NOT a function (the 8 stay 8), NOT WIRED (nothing imports it but its
// test — the run node + /api/report's path come in F4), and PURE: it never imports fb.js (THE UNIT JOB INSTALLS NOTHING —
// tests/freefall-server.test.mjs runs it in Node). It imports the SAME engine modules the phone runs (js/games/freefall/…): the judge's
// replay IS the phone's run.
import { judgeRun as judge, unpackLog, maxEntries } from '../../js/games/freefall/replay.js';
import { featsOf } from '../../js/games/freefall/logic.js';
import { ENTRY_CHARS_MAX } from '../../js/games/freefall/tuning.js';

/**
 * judgeRun({ seed, mode, log, rules? }) → { ok: true, rules, floor, tick, end, cause, made, bounces, shatters, blazes, maxClean, moves,
 *                                           feats: { reachedHarbor, terminal, reachedBottom } } | { ok: false, why }
 *   floor = the floors passed · tick = when that floor was reached (THE RANKING: floors, then the earlier tick) · end = the tick the run
 *   ended · cause = 'red' (HIT THE RED) | 'dark' (THE LIGHTS WENT OUT) | 'made' (floor 200: MADE IT TO THE BOTTOM) | 'cap' (TIME'S UP).
 *   log = [{ t, a }]: the tower's angle (0 … 4095) at the ticks it changed, the ticks rising.
 * The result is the server's OWN replay — a phone's claimed floor is never read (there is no field for one). NOTHING THROWS.
 * REFUSED (`why`): 'rules' (a rule set THE TABLE does not hold) · 'mode' (REQUIRED — a missing one is never judged as solo) · 'seed' (not
 * 1 … 64 printable ASCII characters) · 'log' (not a list) · 'too many entries' (more than the mode has ticks) · 'entry' (not { t: a
 * whole tick ≥ 0, a: a whole angle 0 … 4095 }) · 'ticks not rising' · 'past the cap' · 'no change' (an entry that turns nothing) ·
 * 'spin' (more than MAX SPIN in one tick) · 'past the end' (a move after the run was over).
 */
export const judgeRun = input => judge(input !== null && typeof input === 'object' ? input : {});

/** the same judge from a PACKED log (replay.js#packLog — F4's run node keeps it that way): a string that is not a canonical log, or longer than the mode's log can pack to, is refused unread — `why: 'log'` */
export function judgePacked(input) {
  const { seed, mode, log, rules } = input !== null && typeof input === 'object' ? input : {};
  const head = judge({ seed, mode, rules, log: [] });   // (the rule set, the mode, the seed — named before a character of the log is read)
  if (!head.ok) return head;
  const list = unpackLog(log, ENTRY_CHARS_MAX * maxEntries(mode));
  return list ? judge({ seed, mode, rules, log: list }) : { ok: false, why: 'log' };
}

/** the result row a report will read (F4+): { f: floors, t: tick, w: cause, e: end, ft?: feats } — a refused run = no floors */
export const serverRow = v => (v && v.ok
  ? { f: v.floor, t: v.tick, w: v.cause, e: v.end, ...(featsOf(v) ? { ft: featsOf(v) } : {}) }
  : { f: 0, t: 0, w: '', e: -1, bad: String((v && v.why) || 'refused').slice(0, 24) });
