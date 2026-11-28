// FREEFALL — THE SERVER HALF (F1 — docs/freefall.md "THE JUDGE"). NOT a function (the 8 stay 8) and PURE: it never imports fb.js (THE
// UNIT JOB INSTALLS NOTHING — tests/freefall-server.test.mjs runs it in Node). It imports the SAME engine modules the phone runs
// (js/games/freefall/…): the judge's replay IS the phone's run. F4A: WIRED into /api/report (the solo run's proof node) · F4B: THE MATCH
// (freefallMatch — every player's own node on THE FIRST GO's seed + clock); the daily stays off — behind THE SWITCH (FREEFALL_COUNTS,
// below: OFF until go-live — judged, never awarded).
import { judgeRun as judge, unpackLog, maxEntries, rulesOf } from '../../js/games/freefall/replay.js';
import { featsOf } from '../../js/games/freefall/logic.js';
import { judgeSolo, judgeMatch, chunkTimes } from '../../js/games/freefall/proof.js';
import { matchStart } from '../../js/games/freefall/match.js';
import { onTime, goOf } from '../../js/core/proof.js';
import { ENTRY_CHARS_MAX } from '../../js/games/freefall/tuning.js';

/**
 * judgeRun({ seed, mode, log, rules?, until? }) → { ok: true, rules, floor, tick, end, cause, made, bounces, shatters, blazes, bestRun, moves,
 *                                           feats: { reachedHarbor, terminal, reachedBottom } } | { ok: false, why }
 *   floor = the floors passed · tick = when that floor was reached (THE RANKING: floors, then the earlier tick) · end = the tick the run
 *   ended · cause = 'red' (HIT THE RED) | 'dark' (THE LIGHTS WENT OUT) | 'made' (floor 200: YOU HIT THE BOTTOM) | 'cap' (TIME'S UP).
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
 * streak day, no results/ record. THE GO-LIVE (Nov 28) set it true — a run is counted by JAYWALK's normal path; the emulators' flip is two-way. (On the
 * LOCAL EMULATORS a test may flip it through the database switch `testFreefallCounts` — api/report.js#freefallCounts; never honoured in production.)
 */
export const FREEFALL_COUNTS = true;   // (THE GO-LIVE, Nov 28: ON — the would-count path stays: false here is the one-line kill switch)

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

/** F4B — a player PLAYED a match when the server's replay saw them pass a floor (an EMPTY log — the darkness's own end at floor 0 — is no play: MUST 3, as HIGH RISE's) */
export const FF_PLAYED_FLOOR = 1;
/**
 * F4B — THE MATCH (PURE; HIGH RISE's highriseMatch is the pattern): every named player's run replayed from their OWN proof node on THE
 * FIRST GO's seed + clock (match.js#matchStart — tick 0 = that GO + its lead, for everyone): nothing the host wrote is read, so the
 * placings need no second opinion. THE SERVER's TWO GUARDS: a node counts only with a GO · a GO later than GO_WINDOW_MS after THE FIRST
 * GO is no run ('late go' — the host who GOes alone early and adds the rivals later wins nothing). NO HOLDS in a match (the judge refuses
 * one by name). → { game, played: [the uids the replay saw PASS A FLOOR] } | { game: null, why }
 */
export function freefallMatch({ code, matchId, uids, nodes }) {
  const S = matchStart(String(code), String(matchId), nodes), ids = (uids || []).filter(u => typeof u === 'string');
  if (!S || ids.length < 2) return { game: null, why: S ? 'players' : 'no go' };
  if (!ids.some(u => onTime(nodes[u], S.g0) && nodes[u].c != null)) return { game: null, why: 'no moves' };
  const results = {}, participants = {}, lands = {};
  for (const u of ids) {
    participants[u] = true;
    const node = nodes && nodes[u], ev = [];
    results[u] = onTime(node, S.g0) ? judgedRow(judgeMatch({ seed: S.seed, node, playAt: S.playAt, ev, rules: S.rs })) : { f: 0, t: 0, w: '', e: -1, bad: goOf(node) ? 'late go' : 'no go' };
    if (!results[u].bad) lands[u] = landingsOf(ev);
  }
  // FIX C — S2 THE COPYCAT: two players whose LANDINGS are the same → the later-arriving node is refused ('copy' — it still PLAYED)
  for (const [a, b] of copyPairs(lands)) { const late = laterOf(nodes[a], nodes[b], lands[a], lands[b]) === 'a' ? a : b; results[late] = { f: 0, t: 0, w: '', e: -1, bad: 'copy' }; }
  // (`played` — the uids the server's replay saw PASS A FLOOR; the report counts + credits only these. THE FRESH-EYES REVIEW — THE SORE
  //  LOSER, the twins' rule the first port dropped: a loser who appends ONE bad chunk to his own node — a hold, a turn over MAX SPIN, a
  //  move after his end — gets a refused row, and would have shrunk the match the WINNER is paid for. A refused on-time node still PLAYED
  //  when its longest judge-accepted chunk prefix passed a floor: its own row stays the refused one.)
  return { game: { id: 'freefall', matchId, phase: 'final', mode: 'match', sv: 1, seed: S.seed, playAt: S.playAt, g0: S.g0, participants, settings: {}, results }, played: Object.keys(results).filter(u => results[u].f >= FF_PLAYED_FLOOR || (results[u].bad && onTime(nodes[u], S.g0) && prefixFloor(S, nodes[u]) >= FF_PLAYED_FLOOR)) };
}
/**
 * FIX C — S2 THE COPYCAT (the review: in a match every phone mirrors the whole tree — a modified client could write the leader's chunks
 * into its own node a moment later; each node judged alone, the copy tied or beat the leader). A LANDING = [floor, tick, the tower's angle]
 * from the server's own replay. Two players are a COPY when (a) `run` landings IN A ROW are the same floor at the same tick with the angle
 * within `tol` units (a ±1-unit jitter changes nothing), or (b) of the shorter run's landings (at least `min`), `share` are the same floor at
 * the same tick (a copier who jitters more still has to fall where the leader fell). THE SIMS (tests/freefall-copycat.test.mjs — 8 bots a
 * room, the same tower, 60 rooms, 1,680 pairs, the "great" bots nearly clones of each other): (a) at most 17 in a row · (b) at most 73 %.
 */
export const COPY = Object.freeze({ run: 30, tol: 24, min: 60, share: 0.9 });
const landingsOf = ev => ev.filter(e => e.e === 'land').map(e => [e.floor, e.t, e.a]);
const angGap = (x, y) => { const d = (((x - y) % 4096) + 4096) % 4096; return d > 2048 ? 4096 - d : d; };
/** two landing lists → { row: the longest run alike, shared: the share of the shorter's landings at the same floor + tick } */
export function copyScore(A, B) {
  const at = new Map(B.map((x, i) => [`${x[0]}:${x[1]}`, i]));
  let row = 0, n = 0;
  for (let i = 0; i < A.length; i++) {
    const j = at.get(`${A[i][0]}:${A[i][1]}`);
    if (j === undefined) continue;
    n++;
    let k = 0;
    while (i + k < A.length && j + k < B.length && A[i + k][0] === B[j + k][0] && A[i + k][1] === B[j + k][1] && angGap(A[i + k][2], B[j + k][2]) <= COPY.tol) k++;
    if (k > row) row = k;
  }
  const m = Math.min(A.length, B.length);
  return { row, shared: m ? n / m : 0, m };
}
export const isCopy = s => s.row >= COPY.run || (s.m >= COPY.min && s.shared >= COPY.share);
function copyPairs(lands) {
  const ids = Object.keys(lands), out = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (isCopy(copyScore(lands[ids[i]], lands[ids[j]]))) out.push([ids[i], ids[j]]);
  return out;
}
/** WHO CAME LATER (the fresh-eyes review: an average over CHUNKS can be gamed — the copier cuts its own chunks): for every landing both
 *  share, the server's arrival time of the first chunk of each node that reaches that tick (the moves that decided it) — a copy can never
 *  send a move before its source's chunk with that move arrived. The node later on the MEDIAN shared landing is the copy → 'a' | 'b' */
export function laterOf(nodeA, nodeB, LA, LB) {
  const TA = chunkTimes(nodeA && nodeA.c) || [], TB = chunkTimes(nodeB && nodeB.c) || [];
  const reach = (T, t) => { for (const k of T) if (k.t1 >= t) return k.at; return null; };
  const inB = new Set(LB.map(x => `${x[0]}:${x[1]}`)), d = [];
  for (const x of LA) { if (!inB.has(`${x[0]}:${x[1]}`)) continue; const a = reach(TA, x[1]), b = reach(TB, x[1]); if (a != null && b != null) d.push(a - b); }
  if (!d.length) return 'a';
  d.sort((p, q) => p - q);
  return d[Math.floor(d.length / 2)] >= 0 ? 'a' : 'b';
}
/** the floors of the LONGEST PREFIX of a node's chunks the judge accepts (sabotage is append-only: a prefix of an accepted log is an accepted
 *  log — a binary search, ≤ 14 replays of a 10,000-chunk node); 0 = none */
export function prefixFloor(S, node) {
  const c = node && node.c;
  if (!c || typeof c !== 'object') return 0;
  let n = 0;
  while (n < 10000 && c[n] != null) n++;
  const at = k => { const part = {}; for (let i = 0; i < k; i++) part[i] = c[i]; const v = judgeMatch({ seed: S.seed, node: { go: node.go, c: part, rs: node.rs }, playAt: S.playAt, rules: S.rs }); return v.ok ? v.floor : -1; };
  let lo = 0, hi = n, best = 0;   // (lo chunks are accepted — an empty log is; hi is the node as it stands: refused)
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2), f = at(mid);
    if (f >= 0) { lo = mid; best = f; } else hi = mid - 1;
  }
  return best;
}
