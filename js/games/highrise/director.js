// HIGH RISE — THE DIRECTOR (S4A · S4B — docs/highrise.md "THE CARTRIDGE" · "THE MATCH"; JAYWALK's director.js is the pattern): the PURE
// host step. THE GAME FRAME: id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step
// never needs to land twice. The host holds no private state: any phone that becomes host continues from the database (the proof nodes).
// S4B — THE MATCH (2 … 8 players, ONE tower each, the SAME seed): count (3 · 2 · 1) → play → final.
//   · GO: every phone writes its proof node's `go` in the count's last 2 s; THE FIRST GO (logic.js#firstGo — final the moment it lands)
//     picks the seed (seedOf) + sets tick 0 (that time + GO_LEAD_MS) for everyone. The step count → play writes them into the game.
//     No GO anywhere (no signal, the rules not published) → the match plays UNPROVEN: a seed of its own, never counted.
//   · THE END: every player's run has ended — their node says `e`; a player gone silent (a dead phone) is waited for: online →
//     IDLE_OUT_MS (the fuse has ended that tower by then), offline → + DROP_WAIT_MS (THE DROPPED SIGNAL: their taps may still be
//     queued) — or the 6:00 cap + a grace. The results are THE JUDGE's replay of each player's log (proof.js#judgeNode), never their claim.
// S4A — THE SOLO RUN: no count — `play` from the start; the run's own clock starts at the PLAYER's GO (their proof node's server
// timestamp — the seed is picked from it: logic.js#seedOf, never game.seed). THE END: the player's node says `e` (written once, right
// behind the last chunk — a SIGNAL: the result is THE JUDGE's replay of the node, proof.js#judgeSolo — never a number the phone claims).
import { cleanSettings } from './meta.js';
import { modeOf, matchStart, seedOf } from './logic.js';
import { judgeSolo, judgeNode, matchRules } from './proof.js';
import { onTime } from '../../core/proof.js';
import { COUNT_MS, NO_GO_MS, END_GRACE_MS, UNPROVEN_MS, startOf, capAt, endedFor, scoreCalls, goBeforeGiveUp } from './match.js';

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  const mode = modeOf(participants), solo = mode === 'solo';
  return {
    id: 'highrise', matchId, settings: cleanSettings(settings), participants, mode,
    seed: solo ? String(seed) : '',   // (a MATCH's seed is picked AFTER GO — the step count → play; a SOLO run's from its own GO — never this)
    phase: solo ? 'play' : 'count', phaseStartAt: now, playAt: solo ? now : now + COUNT_MS,
  };
}

const NONE = Object.freeze({ f: 0, p: 0, t: 0, w: '', e: -1, s: 0 });
const rowOf = (v, node, solo) => {
  if (!v.ok) return { ...NONE, ...(solo ? { go: Number(node.go) } : {}), bad: String(v.why || 'refused').slice(0, 24) };
  const ft = Object.keys(v.feats || {}).filter(k => v.feats[k]).join(' ');
  return { f: v.floor, p: v.perfects, t: v.tick, w: v.cause, e: v.end, s: v.maxStreak, ...(solo ? { go: Number(node.go) } : {}), ...(ft ? { ft } : {}), ...(v.cut ? { cut: 1 } : {}) };
};
/**
 * ONE proof node → its result row — THE JUDGE's (the host's podium and the server's count both come through proof.js#judgeNode):
 * { f: floor, p: perfects, t: the tick the last floor landed, w: the cause, e: the end's tick, s: the best streak, go (a solo run's own
 * GO — the end screen names its seed), ft? (the feats), cut? (a slowed log: counted to its last on-time tap), bad? (why — a refused log:
 * no tower) }. No GO = no run.
 */
export function scoreNode(code, matchId, node) {
  if (!node || !(Number(node.go) > 0)) return { ...NONE };
  return rowOf(judgeSolo({ code, matchId, node, mirror: true }), node, true);   // (the host's own live mirror — proof.js `mirror`; the server's count is strict)
}
/** S4B — a MATCH's node: judged on THE FIRST GO's seed + clock (tick 0 = game.playAt — exactly as the server's highriseMatch does) */
export function scoreMatchNode(game, node, rules = null) {
  if (!node || !(Number(node.go) > 0) || !game.seed) return { ...NONE };
  // (THE PROOF PASS — the server's guard, on the host's podium too: a GO later than the window after THE FIRST GO is no tower)
  if (game.g0 > 0 && !onTime(node, game.g0)) return { ...NONE, bad: 'late go' };
  return rowOf(judgeNode({ seed: game.seed, mode: 'match', node: { ...node, go: game.playAt }, mirror: true, rules }), node, false);
}
export function finalPatch(game0, runs, now, code) {
  if (game0.mode === 'solo') {
    const results = {};
    for (const uid of Object.keys(game0.participants || {})) results[uid] = scoreNode(code, game0.matchId, runs[uid]);
    return { phase: 'final', phaseStartAt: now, endAt: now, results };
  }
  // (THE NODES ARE THE TRUTH: a match is scored on THE FIRST GO's seed + clock, as the server's own count is; if the game ever said
  //  otherwise the patch puts it right)
  const S = startOf(game0, runs, code), moved = !!S && (S.seed !== game0.seed || S.playAt !== game0.playAt);
  const game = moved ? { ...game0, seed: S.seed, playAt: S.playAt, g0: S.g0 } : game0;
  const results = {}, rules = matchRules(runs);   // (everyone in a match climbs by ONE rule set: THE FIRST GO's)
  for (const uid of Object.keys(game.participants || {})) results[uid] = game.unproven ? { ...NONE } : scoreMatchNode(game, runs[uid], rules);
  const patch = { phase: 'final', phaseStartAt: now, endAt: now, results, ...(moved ? { seed: S.seed, playAt: S.playAt, g0: S.g0 } : {}) };
  const calls = game.unproven ? {} : scoreCalls(game, runs, results);
  if (Object.keys(calls).length) patch.calls = calls;
  return patch;
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
  if (now >= capAt(game) + END_GRACE_MS) return finalPatch(game, runs, now, code);
  if (game.unproven) {
    // (REVIEW FIX A — SHOULD 1: a FIRST GO the server stamped before this host gave up = a hiccup of the host's, not a match without
    //  proof: the unproven mark is taken back and the match climbs on the GO's seed + tick 0 — the phones' own startOf already does)
    const S = matchStart(code, game.matchId, runs);
    if (goBeforeGiveUp(game, S)) return { unproven: null, playAt: S.playAt, seed: S.seed, g0: S.g0 };
    return now >= game.playAt + UNPROVEN_MS ? finalPatch(game, runs, now, code) : null;
  }
  const done = ids.length > 0 && ids.every(u => endedFor(game, runs[u], now, !online || !!online[u]));
  return done ? finalPatch(game, runs, now, code) : null;
}
/** the runs as they stand → the podium (the host's END GAME) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && (game.phase === 'count' || game.phase === 'play') ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT run — a match of its own (its own id,
 *  its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
