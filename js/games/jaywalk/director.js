// JAYWALK — THE DIRECTOR (H1 + H4 — docs/jaywalk.md "THE MATCH"): the PURE host step. count (3 · 2 · 1) → play → final. THE GAME FRAME:
// id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (everyone's proof nodes).
// H4 — THE MATCH (ONE LIFE):
//   · GO: every phone writes its proof node's `go` in the count's last 2 s; THE FIRST GO (logic.js#firstGo — final the moment it lands)
//     picks the course (seedOf) + sets tick 0 (that time + GO_LEAD_MS) for everyone. The step count → play writes them into the game.
//     No GO anywhere (no signal, the rules not published) → the match plays UNPROVEN: a course of its own, never counted.
//   · THE END: every player's run has ended — their node says `e`; a player gone silent (a dead phone) is waited for: online → IDLE_OUT_MS
//     (an idle kid is out by then), offline → + DROP_WAIT_MS (THE DROPPED SIGNAL: their hops may still be queued) — or THE MOTHERSHIP's
//     moment + a grace. The results are THE JUDGE's replay of each player's log (logic.js#scoreRuns), never their claim.
// H3 — THE SOLO RUN: no count (PLAY NOW's walk inside is the wait) — `play` from the start; the run's own clock starts at the PLAYER's GO
// (their proof node's server timestamp — the course is picked from it: logic.js#seedOf), never at game.playAt.
import { cleanSettings, modeOf, capAt, scoreRuns, scoreCalls, matchStart, startOf, seedOf, goBeforeGiveUp, COUNT_MS, END_GRACE_MS, NO_GO_MS, DROP_WAIT_MS } from './logic.js';
import { liveGoers } from '../../core/proof.js';

/** a kid nobody moves is out within this (the blackout: 8 lanes behind at the start + its 3 s wait — ≈ 16 s; ≤ 9 s later on) */
export const IDLE_OUT_MS = 18000;
/** an UNPROVEN match (no proof can be written — nobody's end can be signalled) simply ends after this */
export const UNPROVEN_MS = 90000;

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  const n = Object.keys(participants || {}).length, mode = modeOf(participants), solo = mode === 'solo';
  return {
    id: 'jaywalk', matchId, settings: cleanSettings(settings, n), participants, mode,
    seed: solo ? String(seed) : '',   // (a MATCH's course is picked AFTER GO — the step count → play; a SOLO run's from its own GO — never this)
    phase: solo ? 'play' : 'count', phaseStartAt: now, playAt: solo ? now : now + COUNT_MS,
  };
}

export function finalPatch(game0, runs, now, code) {
  // (H4B — THE NODES ARE THE TRUTH: a match is scored on THE FIRST GO's course + clock, as the server's own count is; if the game ever
  // said otherwise the patch puts it right — never seen in the tests: the GO patch is derived from the same nodes)
  const S = game0.mode !== 'solo' ? startOf(game0, runs, code) : null, moved = !!S && (S.seed !== game0.seed || S.playAt !== game0.playAt);
  const game = moved ? { ...game0, seed: S.seed, playAt: S.playAt, g0: S.g0 } : game0;
  const results = scoreRuns(game, runs, now, code), patch = { phase: 'final', phaseStartAt: now, endAt: now, results, ...(moved ? { seed: S.seed, playAt: S.playAt, g0: S.g0 } : {}) };
  if (game.mode !== 'solo') { const calls = scoreCalls(game, runs, results); if (Object.keys(calls).length) patch.calls = calls; }
  return patch;
}

/** when a player's proof last moved (ms, a server time): their newest chunk's arrival, else their GO, else the match's tick 0 */
export function lastSeen(game, node) {
  let at = game.playAt;
  if (node && node.go > at) at = node.go;
  const c = node && node.c;
  if (c) { let hi = -1; for (const k of Object.keys(c)) { const i = Number(k); if (i > hi) hi = i; } const v = hi >= 0 ? c[hi] : null; if (v && v.at > at) at = v.at; }
  return at;
}
/** H4: has this player's run ended, as far as the room can tell? their own `e` — or a silence long enough that the kid is out AND (offline)
 *  a dropped signal has had its time to come back */
export const endedFor = (game, node, now, online) => !!(node && node.e) || now >= lastSeen(game, node) + IDLE_OUT_MS + (online ? 0 : DROP_WAIT_MS);

/**
 * THE CONSOLE FIX — THE LIVE RUNS of a match (core/proof.js#liveGoers on this game's clock: THE FIRST GO's tick 0, THE MOTHERSHIP's cap
 * + END_GRACE_MS, IDLE_OUT_MS, DROP_WAIT_MS): the on-time runs not ended yet, read from the proof nodes ALONE (never the host's game) —
 * THE SERVER holds a report while any is (api/report.js), the podium waits for them (view.js). → { uids, until }
 */
export function liveOf({ code, matchId, tree, now, online = null }) {
  const S = tree ? matchStart(code, matchId, tree) : null;
  if (!S) return { uids: [], until: 0 };
  return liveGoers(tree, { now, online, playAt: S.playAt, capAt: capAt({ mode: 'match', playAt: S.playAt }), idleMs: IDLE_OUT_MS, dropMs: DROP_WAIT_MS, graceMs: END_GRACE_MS });
}

/** → a patch, or null */
export function nextStep(game, { now, live, code = '', online = null } = {}) {
  if (!game || !game.phase) return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  if (game.phase === 'count') {
    if (game.mode === 'solo') return now >= game.playAt ? { phase: 'play', phaseStartAt: game.playAt } : null;
    const S = matchStart(code, game.matchId, runs);
    if (S) return now >= S.playAt ? { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0 } : null;
    return now >= game.playAt + NO_GO_MS ? { phase: 'play', phaseStartAt: now, playAt: now + 800, seed: seedOf(code, game.matchId, `u${now}`), unproven: 1 } : null;
  }
  if (game.phase !== 'play') return null;
  if (game.mode === 'solo') return ids.length > 0 && ids.every(u => runs[u] && runs[u].e) ? finalPatch(game, runs, now, code) : null;
  const cap = capAt(game);
  if (cap != null && now >= cap + END_GRACE_MS) return finalPatch(game, runs, now, code);
  if (game.unproven) {
    // (THE PROOF PASS — A HOST HICCUP AT GO (HIGH RISE's REVIEW FIX A, SHOULD 1, ported): a FIRST GO the server stamped before this host
    //  gave up = a hiccup of the host's, not a match without proof: the unproven mark is taken back and the match runs on the GO's
    //  course + tick 0 — the phones' own startOf already does. A GO stamped after the give-up never moves a match on its stand-in.)
    const S = matchStart(code, game.matchId, runs);
    if (goBeforeGiveUp(game, S)) return { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0, unproven: null };
    return now >= game.playAt + UNPROVEN_MS ? finalPatch(game, runs, now, code) : null;
  }
  const done = ids.length > 0 && ids.every(u => endedFor(game, runs[u], now, !online || !!online[u]));
  return done ? finalPatch(game, runs, now, code) : null;
}

/** the runs as they stand → the podium (the host's END GAME through the cartridge's `endGame` — today the console's own END GAME goes back to the room) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && (game.phase === 'count' || game.phase === 'play') ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** Call the Winner's game-night points (the console adds them to the night's total — never a win): { uid: bonus } */
export function nightBonus(game) {
  const out = {};
  for (const [uid, c] of Object.entries((game && game.calls) || {})) if (c && c.bonus > 0) out[uid] = c.bonus;
  return out;
}

/** H3 — PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT solo run of a finished one — a new
 *  match of its own (its own id, its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
