// JAYWALK — THE DIRECTOR (H1 — docs/jaywalk.md "THE MATCH"): the PURE host step. count (3 · 2 · 1) → play → final. THE GAME FRAME: id,
// matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (the seed + everyone's hop logs).
// THE END: every participant's node says `e` (their run ended) — or THE MOTHERSHIP's moment + a grace. The results are the REPLAY of each
// player's log (logic.js#scoreRuns), never their claim. (H4: an offline player's end, the spectators, the live ghosts.)
// H3 — THE SOLO RUN: no count (PLAY NOW's walk inside is the wait) — `play` from the start; the run's own clock starts at the PLAYER's GO
// (their proof node's server timestamp — the course is picked from it: logic.js#seedOf), never at game.playAt.
import { cleanSettings, modeOf, capAt, scoreRuns, COUNT_MS, END_GRACE_MS } from './logic.js';

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  const n = Object.keys(participants || {}).length, mode = modeOf(participants), solo = mode === 'solo';
  return {
    id: 'jaywalk', matchId, settings: cleanSettings(settings, n), participants, mode,
    seed: String(seed), phase: solo ? 'play' : 'count', phaseStartAt: now, playAt: solo ? now : now + COUNT_MS,
  };
}

const finalPatch = (game, runs, now, code) => ({ phase: 'final', phaseStartAt: now, endAt: now, results: scoreRuns(game, runs, now, code) });

/** → a patch, or null */
export function nextStep(game, { now, live, code = '' } = {}) {
  if (!game || !game.phase) return null;
  if (game.phase === 'count') return now >= game.playAt ? { phase: 'play', phaseStartAt: game.playAt } : null;
  if (game.phase !== 'play') return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  const cap = capAt(game);
  const done = ids.length > 0 && ids.every(u => runs[u] && runs[u].e);
  if (done || (cap != null && now >= cap + END_GRACE_MS)) return finalPatch(game, runs, now, code);
  return null;
}

/** the runs as they stand → the podium (H4: the host's END GAME through the cartridge's `endGame` — today the console's own END GAME goes back to the room) */
export const endNow = (game, { now, live, code = '' } = {}) => (game && (game.phase === 'count' || game.phase === 'play') ? finalPatch(game, (live && live.runs) || {}, now, code) : null);

/** H3 — HOP AGAIN (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT solo run of a finished one — a new match of its own
 *  (its own id, its own proof node, its own report), the same settings + player, `play` at once. null = not a finished solo run. */
export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === 'solo' && matchId
  ? createGame({ matchId, settings: game.settings, participants: game.participants, now, seed: `again:${game.matchId}` }) : null);
