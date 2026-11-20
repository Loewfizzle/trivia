// HIGH RISE — THE SERVER HALF (S1 — docs/highrise.md "THE JUDGE"). NOT a function (the 8 stay 8) and PURE: it never imports fb.js (THE
// UNIT JOB INSTALLS NOTHING — tests/highrise-server.test.mjs runs it in Node). It imports the SAME engine modules the phone runs
// (js/games/highrise/…): the judge's replay IS the phone's run. S4A: WIRED into /api/report (the solo run's proof node; the match's half
// ready for S4B) — behind THE SWITCH (HIGHRISE_COUNTS, below: OFF until go-live — judged, never awarded).
import { judgeRun as judge, unpackTaps } from '../../js/games/highrise/replay.js';
import { featsOf, matchStart } from '../../js/games/highrise/logic.js';
import { judgeNode, judgeSolo, matchRules } from '../../js/games/highrise/proof.js';
import { onTime, goOf } from '../../js/core/proof.js';

/**
 * judgeRun({ seed, mode, taps }) → { ok: true, floor, tick, end, cause, made, perfects, maxStreak, taps, feats: { reachedClouds, reachedTop } }
 *                                | { ok: false, why }
 *   floor = the slabs landed · tick = when the last one landed (THE RANKING: height, then the earlier tick) · end = the tick the run ended ·
 *   cause = 'miss' (MISSED THE STACK) | 'thin' (SLIPPED OFF) | 'slow' (TOO SLOW — the fuse) | 'made' (floor 200: MADE IT) | 'cap'.
 * The result is the server's OWN replay — a phone's claimed floor is never read (there is no field for one).
 * REFUSED (`why`): 'mode' (REQUIRED — a missing one is never judged as solo) · 'seed' (not 1 … 64 printable ASCII characters) · 'taps' (not a list) · 'too many taps' (more taps than the mode has floors /
 * than any run holds) · 'entry' (a tick that is not a whole number ≥ 0) · 'ticks not rising' · 'in the landing beat' (a tap with no slab
 * to drop — also a tap before the first slab) · 'past the cap' · 'after the fuse' (a gap no honest run has: the fuse had dropped that
 * slab) · 'past the end' (a tap after the run was over — an out, the finish, the fuse's own drop).
 */
export const judgeRun = input => judge(input && typeof input === 'object' ? input : {});

/** the same judge from a PACKED log (replay.js#packTaps — S2's run node keeps it that way) */
export function judgePacked(input) {
  const { seed, mode, log } = input && typeof input === 'object' ? input : {};
  const taps = unpackTaps(log);
  return taps ? judge({ seed, mode, taps }) : { ok: false, why: 'log' };
}

/** the result row a report will read (S2+): { f: floor, t: tick, w: cause, e: end, p: perfects, s: maxStreak, ft?: feats } — a refused run = no tower */
export const serverRow = v => (v && v.ok
  ? { f: v.floor, t: v.tick, w: v.cause, e: v.end, p: v.perfects, s: v.maxStreak, ...(featsOf(v) ? { ft: featsOf(v) } : {}) }
  : { f: 0, t: 0, w: '', e: -1, p: 0, s: 0, bad: String((v && v.why) || 'refused').slice(0, 24) });

// ---- S4A — WIRED: /api/report judges a HIGH RISE run ONLY from its PROOF NODE (rooms/{CODE}/hr/{matchId}/{uid} — js/games/highrise/proof.js:
// GO's server time → the seed; the server-stamped chunks → the tap log + its clock) — JAYWALK's way (api/_lib/jaywalk.js). And THE SWITCH.

/**
 * THE SWITCH (the owner, Nov 19 — COUNTING STAYS OFF UNTIL GO-LIVE): ONE server-side flag. OFF → /api/report still JUDGES every cartridge
 * run (the proof node replayed, the speed check, the judge) and answers what it WOULD award (floor, perfects, XP, the streak, a best, the
 * cards' flags) — and WRITES NOTHING: no pstats, no profile, no board row, no card, no streak day, no results/ record. THE GO-LIVE PASS
 * sets this to true (ONE line) — then a run is counted by JAYWALK's normal path. (On the LOCAL EMULATORS a test may flip it through the
 * database switch `testHighriseCounts` — api/report.js#highriseCounts; never honoured in production.)
 * THE GO-LIVE (Nov 20): ON — every proven solo run + match counts (XP, the ONE streak, YOUR BEST, YOUR TABLE, the two cards, the share
 * LINK, THE DAILY CEILING). The OFF path stays as the one-line KILL SWITCH (false again = judged, never awarded — nothing else to undo).
 */
export const HIGHRISE_COUNTS = true;

/** ONE player's PROOF NODE → the judge's answer for a SOLO run (the seed = seedOf(code, matchId, go): picked after GO; tick 0 = that GO). No GO = no run. */
export const verifyNode = ({ code, matchId, node } = {}) => judgeSolo({ code, matchId, node });

/**
 * THE SERVER'S OWN RESULT (PURE): a SOLO run as a match the report can read — built ONLY from the server's replay of the player's proof
 * node; never from the room's game.results (the host — the player — wrote those), never from a phone's claim. `sv` marks it: only such a
 * match earns a record / a card flag (core/match-report.js#highriseExtra). The room's game may be GONE (PLAY AGAIN starts the next run at
 * once): the proof node + the night record are enough. → { game, v }
 */
export function highriseSolo({ code, matchId, uid, node }) {
  const v = verifyNode({ code, matchId, node });
  return { game: { id: 'highrise', matchId, phase: 'final', mode: 'solo', sv: 1, participants: { [uid]: true }, settings: {}, results: { [uid]: serverRow(v) } }, v };
}

/**
 * S4B's HALF, READY (the cartridge can not start a match yet — index.js#start): every named player's run REPLAYED from their own proof
 * node on THE FIRST GO's seed (logic.js#matchStart — nothing the host wrote is read). A named player with no node has no tower (A SEAT IS
 * NOT A PLAY). → { game (`sv` 1) | null (no GO at all · fewer than two players · nobody ever dropped a slab), why? }
 */
/**
 * REVIEW FIX A — MUST 3 (A GO IS NOT A PLAY): one person with spare tabs could seat 7 phones that only write GO and never tap — the
 * server counted 8 players and paid an "8-player match" won on 3 floors. In a HIGH RISE match a player COUNTS only with at least one
 * LANDED slab in the SERVER's own replay (floor ≥ 1) — the proof tree's uids narrowed to those. HIGH RISE only (JAYWALK's rule, "a silent
 * player included", is untouched until THE PROOF PASS). PURE: (the uids the tree proves, the server's rows) → the uids that played.
 */
export const HR_PLAYED_FLOOR = 1;
export const hrPlayed = (proven, results) => new Set([...(proven || [])].filter(u => !!(results && results[u] && results[u].f >= HR_PLAYED_FLOOR)));
export function highriseMatch({ code, matchId, uids, nodes }) {
  const S = matchStart(String(code), String(matchId), nodes), ids = (uids || []).filter(u => typeof u === 'string');
  if (!S || ids.length < 2) return { game: null, why: S ? 'players' : 'no go' };
  // (THE PROOF PASS — THE SERVER's TWO GUARDS, JAYWALK's too: a node counts only with a GO; a GO later than GO_WINDOW_MS after THE FIRST
  //  GO is no tower ('late go') — the host who GOes alone early and adds the rivals later wins nothing)
  if (!ids.some(u => onTime(nodes[u], S.g0) && nodes[u].c != null)) return { game: null, why: 'no drops' };
  const results = {}, participants = {}, rules = matchRules(nodes);   // (S4B: ONE rule set a match — THE FIRST GO's; a node that names another is refused)
  for (const u of ids) {
    participants[u] = true;
    const node = nodes && nodes[u];
    // (a match's tick 0 = THE FIRST GO + its lead: the node is judged on that clock — S4B's view writes its chunks against it)
    results[u] = onTime(node, S.g0) ? serverRow(judgeNode({ seed: S.seed, mode: 'match', node: { ...node, go: S.playAt }, rules })) : { f: 0, t: 0, w: '', e: -1, p: 0, s: 0, bad: goOf(node) ? 'late go' : 'no go' };
  }
  // (`played` — MUST 3: the uids with a LANDED slab in this replay; the report counts + credits only these)
  return { game: { id: 'highrise', matchId, phase: 'final', mode: 'match', sv: 1, seed: S.seed, playAt: S.playAt, g0: S.g0, participants, settings: {}, results }, played: Object.keys(results).filter(u => results[u].f >= HR_PLAYED_FLOOR) };
}
