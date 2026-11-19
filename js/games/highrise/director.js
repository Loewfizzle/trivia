// HIGH RISE — THE DIRECTOR (S4A — docs/highrise.md "THE CARTRIDGE"; JAYWALK's director.js is the pattern): the PURE host step. THE GAME
// FRAME: id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (the proof nodes).
// S4A — THE SOLO RUN ONLY (THE MATCH is S4B: index.js#start refuses a room of two or more): no count — `play` from the start; the run's
// own clock starts at the PLAYER's GO (their proof node's server timestamp — the seed is picked from it: logic.js#seedOf, never game.seed).
// THE END: the player's node says `e` (written once, right behind the last chunk — a SIGNAL: the result is THE JUDGE's replay of the
// node, proof.js#judgeSolo — never a number the phone claims).
import { cleanSettings } from './meta.js';
import { modeOf } from './logic.js';
import { judgeSolo } from './proof.js';

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  return { id: 'highrise', matchId, settings: cleanSettings(settings), participants, mode: modeOf(participants), seed: String(seed), phase: 'play', phaseStartAt: now, playAt: now };
}

const NONE = Object.freeze({ f: 0, p: 0, t: 0, w: '', e: -1, s: 0 });
/**
 * ONE proof node → its result row — THE JUDGE's (the host's podium and the server's count both come through proof.js#judgeNode):
 * { f: floor, p: perfects, t: the tick the last floor landed, w: the cause, e: the end's tick, s: the best streak, go (a solo run's own
 * GO — the end screen names its seed), ft? (the feats), cut? (a slowed log: counted to its last on-time tap), bad? (why — a refused log:
 * no tower) }. No GO = no run.
 */
export function scoreNode(code, matchId, node) {
  if (!node || !(Number(node.go) > 0)) return { ...NONE };
  const v = judgeSolo({ code, matchId, node });
  if (!v.ok) return { ...NONE, go: Number(node.go), bad: String(v.why || 'refused').slice(0, 24) };
  const ft = Object.keys(v.feats || {}).filter(k => v.feats[k]).join(' ');
  return { f: v.floor, p: v.perfects, t: v.tick, w: v.cause, e: v.end, s: v.maxStreak, go: Number(node.go), ...(ft ? { ft } : {}), ...(v.cut ? { cut: 1 } : {}) };
}
function finalPatch(game, runs, now, code) {
  const results = {};
  for (const uid of Object.keys(game.participants || {})) results[uid] = scoreNode(code, game.matchId, runs[uid]);
  return { phase: 'final', phaseStartAt: now, endAt: now, results };
}

/** → a patch, or null */
export function nextStep(game, { now, live, code = '' } = {}) {
  if (!game || game.phase !== 'play') return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  return ids.length > 0 && ids.every(u => runs[u] && runs[u].e) ? finalPatch(game, runs, now, code) : null;
}
/** the run as it stands → the podium (the host's END GAME) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && game.phase === 'play' ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT run — a match of its own (its own id,
 *  its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
