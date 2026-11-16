// JAYWALK — THE DIRECTOR (H1 — docs/jaywalk.md "THE MATCH"): the PURE host step. count (3 · 2 · 1) → play → final. THE GAME FRAME: id,
// matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (the seed + everyone's hop logs).
// H1's END: every participant's node says `e` (their run ended) — or THE MOTHERSHIP's moment + a grace. The results are the REPLAY of each
// player's log (logic.js#scoreRuns), never their claim. (H4: an offline player's end, the spectators, the live ghosts.)
import { cleanSettings, modeOf, capAt, tickAt, scoreRuns, COUNT_MS, END_GRACE_MS } from './logic.js';

/** the match (start() adds nothing else): `now` = the moment the MATCH begins (after the walk inside) */
export function createGame({ matchId, settings, participants, now, seed }) {
  const n = Object.keys(participants || {}).length;
  return {
    id: 'jaywalk', matchId, settings: cleanSettings(settings, n), participants, mode: modeOf(participants),
    seed: String(seed), phase: 'count', phaseStartAt: now, playAt: now + COUNT_MS,
  };
}

const finalPatch = (game, runs, now) => ({ phase: 'final', phaseStartAt: now, endAt: now, results: scoreRuns(game, runs, Math.max(0, tickAt(game, now))) });

/** → a patch, or null */
export function nextStep(game, { now, live } = {}) {
  if (!game || !game.phase) return null;
  if (game.phase === 'count') return now >= game.playAt ? { phase: 'play', phaseStartAt: game.playAt } : null;
  if (game.phase !== 'play') return null;
  const runs = (live && live.runs) || {}, ids = Object.keys(game.participants || {});
  const cap = capAt(game);
  const done = ids.length > 0 && ids.every(u => runs[u] && runs[u].e);
  if (done || (cap != null && now >= cap + END_GRACE_MS)) return finalPatch(game, runs, now);
  return null;
}

/** the runs as they stand → the podium (H4: the host's END GAME through the cartridge's `endGame` — today the console's own END GAME goes back to the room) */
export const endNow = (game, { now, live } = {}) => (game && (game.phase === 'count' || game.phase === 'play') ? finalPatch(game, (live && live.runs) || {}, now) : null);
