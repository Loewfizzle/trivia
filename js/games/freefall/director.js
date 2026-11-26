// FREEFALL — THE DIRECTOR (F4A — docs/freefall.md "THE CARTRIDGE"; HIGH RISE's S4A director is the pattern): the PURE host step. THE GAME
// FRAME: id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (the proof nodes).
// F4A — THE SOLO RUN ONLY (THE MATCH is F4B: index.js#start refuses a room of two or more): no count — `play` from the start; the run's
// own clock starts at the PLAYER's GO (their proof node's server timestamp — the seed is picked from it: logic.js#seedOf, never game.seed).
// THE END: the player's node says `e` (written once, right behind the last chunk — a SIGNAL: the result is THE JUDGE's replay of the
// node, proof.js#judgeSolo — never a number the phone claims).
import { cleanSettings } from './meta.js';
import { modeOf } from './logic.js';
import { judgeSolo } from './proof.js';

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  return { id: 'freefall', matchId, settings: cleanSettings(settings), participants, mode: modeOf(participants), seed: String(seed), phase: 'play', phaseStartAt: now, playAt: now };
}

const NONE = Object.freeze({ f: 0, t: 0, w: '', e: -1 });
/**
 * ONE proof node → its result row — THE JUDGE's (the host's podium and the server's count both come through proof.js#judgeNode):
 * { f: floors, t: the tick that floor was reached, w: the cause, e: the end's tick, b / bl / br (bounces · blazes · the best no-bounce run —
 * the end card's line), go (the run's own GO), h? (the holds used), ft? (the feats), cut? (a slowed log / a hold with no way back: counted
 * to its last on-time event), bad? (why — a refused log: no run) }. No GO = no run. `mirror` = the host's own live mirror (proof.js).
 */
export function scoreNode(code, matchId, node, mirror = true) {
  if (!node || !(Number(node.go) > 0)) return { ...NONE };
  const v = judgeSolo({ code, matchId, node, mirror });
  if (!v.ok) return { ...NONE, go: Number(node.go), bad: String(v.why || 'refused').slice(0, 24) };
  const ft = Object.keys(v.feats || {}).filter(k => v.feats[k]).join(' ');
  return { f: v.floor, t: v.tick, w: v.cause, e: v.end, b: v.bounces, bl: v.blazes, br: v.bestRun, go: Number(node.go), ...(v.holds ? { h: v.holds } : {}), ...(ft ? { ft } : {}), ...(v.cut ? { cut: 1 } : {}) };
}
export function finalPatch(game, runs, now, code) {
  const results = {};
  for (const uid of Object.keys(game.participants || {})) results[uid] = scoreNode(code, game.matchId, runs[uid]);
  return { phase: 'final', phaseStartAt: now, endAt: now, results };
}

/** → a patch, or null */
export function nextStep(game, { now, live, code = '' } = {}) {
  if (!game || game.phase !== 'play') return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  // (THE FRESH-EYES REVIEW — AN UNPROVEN RUN's MATCH ENDS TOO: a SOLO run with no GO never writes `e` — its match stayed `play` for ever and
  //  PLAY AGAIN on its card could only start over in the spent match, uncounted. The host — the same phone, a room of one — marks it
  //  ended (`game.x/{uid}`, view.js#again): the match closes with the judge's row of a node that is not there — floor 0, never counted)
  const gone = u => game.mode === 'solo' && !!game.x && !!game.x[u];
  return ids.length > 0 && ids.every(u => (runs[u] && runs[u].e) || gone(u)) ? finalPatch(game, runs, now, code) : null;
}
/** the run as it stands → the podium (the host's END GAME) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && game.phase === 'play' ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT run — a match of its own (its own id,
 *  its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
