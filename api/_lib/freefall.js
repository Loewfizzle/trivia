// FREEFALL — THE SERVER HALF (F1 — docs/freefall.md "THE JUDGE"). NOT a function (the 8 stay 8) and PURE: it never imports fb.js (THE
// UNIT JOB INSTALLS NOTHING — tests/freefall-server.test.mjs runs it in Node). It imports the SAME engine modules the phone runs
// (js/games/freefall/…): the judge's replay IS the phone's run. F4A: WIRED into /api/report (the solo run's proof node; the match's half a
// stub until F4B; the daily stays off) — behind THE SWITCH (FREEFALL_COUNTS, below: OFF until go-live — judged, never awarded).
import { judgeRun as judge, unpackLog, maxEntries, rulesOf } from '../../js/games/freefall/replay.js';
import { featsOf } from '../../js/games/freefall/logic.js';
import { judgeSolo } from '../../js/games/freefall/proof.js';
import { ENTRY_CHARS_MAX } from '../../js/games/freefall/tuning.js';

/**
 * judgeRun({ seed, mode, log, rules?, until? }) → { ok: true, rules, floor, tick, end, cause, made, bounces, shatters, blazes, bestRun, moves,
 *                                           feats: { reachedHarbor, terminal, reachedBottom } } | { ok: false, why }
 *   floor = the floors passed · tick = when that floor was reached (THE RANKING: floors, then the earlier tick) · end = the tick the run
 *   ended · cause = 'red' (HIT THE RED) | 'dark' (THE LIGHTS WENT OUT) | 'made' (floor 200: MADE IT TO THE BOTTOM) | 'cap' (TIME'S UP).
 *   log = [{ t, a }]: the tower's angle (0 … 4095) at the ticks it changed, the ticks rising.
 * The result is the server's OWN replay — a phone's claimed floor is never read (there is no field for one). NOTHING THROWS.
 * REFUSED (`why`): 'rules' (a rule set THE TABLE does not hold) · 'mode' (REQUIRED — a missing one is never judged as solo) · 'seed' (not
 * 1 … 64 printable ASCII characters) · 'log' (not a list) · 'too many entries' (more than the mode has ticks) · 'entry' (not { t: a
 * whole tick ≥ 0, a: a whole angle 0 … 4095 }) · 'ticks not rising' · 'past the cap' · 'no change' (an entry that turns nothing) ·
 * 'spin' (more than MAX SPIN in one tick) · 'past the end' (a move after the run was over) · 'until' (a bad `until` — a run scored as it
 * stands at a tick, a match still going: the answer then carries `over`) · F2 — THE HOLD: 'too many holds' (more than the mode has: solo 3,
 * a match / the daily none) · 'hold' (a hold the engine did not take as written). An accepted held run's answer carries `holds`.
 */
export const judgeRun = input => judge(input !== null && typeof input === 'object' ? input : {});

/** the same judge from a PACKED log (replay.js#packLog — F4's run node keeps it that way): a string that is not a canonical log, or longer than the mode's log can pack to, is refused unread — `why: 'log'` */
export function judgePacked(input) {
  const { seed, mode, log, rules, until } = input !== null && typeof input === 'object' ? input : {};
  const head = judge({ seed, mode, rules, until, log: [] });   // (the rule set, the mode, the seed — named before a character of the log is read)
  if (!head.ok) return head;
  const list = unpackLog(log, ENTRY_CHARS_MAX * maxEntries(mode, rulesOf(rules)));
  return list ? judge({ seed, mode, rules, log: list, until }) : { ok: false, why: 'log' };
}

/** the result row a report will read (F4+): { f: floors, t: tick, w: cause, e: end, ft?: feats } — a refused run = no floors */
export const serverRow = v => (v && v.ok
  ? { f: v.floor, t: v.tick, w: v.cause, e: v.end, ...(featsOf(v) ? { ft: featsOf(v) } : {}) }
  : { f: 0, t: 0, w: '', e: -1, bad: String((v && v.why) || 'refused').slice(0, 24) });

// ---- F4A — WIRED: /api/report judges a FREEFALL run ONLY from its PROOF NODE (rooms/{CODE}/ff/{matchId}/{uid} — js/games/freefall/proof.js:
// GO's server time → the seed + tick 0; the server-stamped chunks → the input log + its clock; the holds' stamps) — JAYWALK's + HIGH RISE's
// way (api/_lib/jaywalk.js · api/_lib/highrise.js). And THE SWITCH.

/**
 * THE SWITCH (the owner, Nov 26 — COUNTING STAYS OFF UNTIL GO-LIVE; HIGH RISE's S4A switch is the pattern): ONE server-side flag. OFF →
 * /api/report still JUDGES every cartridge run (the proof node replayed, the speed check, the holds' clock, the judge) and answers what it
 * WOULD award (floor, XP, the streak, a best, the cards' flags) — and WRITES NOTHING: no pstats, no profile, no board row, no card, no
 * streak day, no results/ record. THE GO-LIVE PASS sets this to true (ONE line) — then a run is counted by JAYWALK's normal path. (On the
 * LOCAL EMULATORS a test may flip it through the database switch `testFreefallCounts` — api/report.js#freefallCounts; never honoured in production.)
 */
export const FREEFALL_COUNTS = false;

/** ONE player's PROOF NODE → the judge's answer for a SOLO run (the seed = seedOf(code, matchId, go): picked after GO; tick 0 = that GO + its lead). No GO = no run. The SERVER is strict: never the host's mirror reading. */
export const verifyRun = ({ code, matchId, node } = {}) => judgeSolo({ code, matchId, node });

/** the judged row a report reads: serverRow + what the end card + the would-line say (b / bl / br: bounces · blazes · the best no-bounce run; h: the holds; cut) */
const judgedRow = v => ({ ...serverRow(v), ...(v && v.ok ? { b: v.bounces, bl: v.blazes, br: v.bestRun, ...(v.holds ? { h: v.holds } : {}), ...(v.cut ? { cut: 1 } : {}) } : {}) });

/**
 * THE SERVER'S OWN RESULT (PURE): a SOLO run as a match the report can read — built ONLY from the server's replay of the player's proof
 * node; never from the room's game.results (the host — the player — wrote those), never from a phone's claim. `sv` marks it: only such a
 * match earns a record / a card flag (core/match-report.js#freefallExtra). The room's game may be GONE (PLAY AGAIN starts the next run at
 * once): the proof node + the night record are enough. → { game, v }
 */
export function freefallSolo({ code, matchId, uid, node }) {
  const v = verifyRun({ code, matchId, node });
  return { game: { id: 'freefall', matchId, phase: 'final', mode: 'solo', sv: 1, participants: { [uid]: true }, settings: {}, results: { [uid]: judgedRow(v) } }, v };
}

/** F4B's HALF — A STUB: the cartridge can not start a match yet (index.js#start refuses a room of two or more) — a report of one has no proof to read. → { game: null, why } */
export const freefallMatch = () => ({ game: null, why: 'the match is not built yet' });
