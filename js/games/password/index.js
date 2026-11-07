// THE PASSWORD — THE CARTRIDGE (PW1 — docs/password.md; the contract: docs/cartridge.md). A DAILY-ONLY solo Wordle-type: `playable: false`
// in GAMES (no room ever starts it — THE DAILY MODULE opens it once a day, later); it still plugs into the console like every game so the
// console needs nothing new for it. The server judges every guess (api/_lib/pw.js); the phone holds marks, never a word it wasn't told.
export * from './meta.js';
import { createRun, resultOf, scoreOf } from './logic.js';
import { lazyView, gameSheets } from '../lazy-view.js';
export { daily } from './daily.js';

export const createView = lazyView(() => import('./view.js'), gameSheets('password'));

/** a room match of THE PASSWORD never starts (playable: false); the shell a daily run lives in: one player, one run (its words on the server) */
export async function start({ matchId, participants, now }) {
  const uid = Object.keys(participants || {})[0] || null;
  return { ...createRun({ uid, startedAt: now }), matchId, participants: { ...(participants || {}) }, phase: 'play', phaseStartAt: now };
}
/** nothing to prepare: the host holds no words, no deal — the server does */
export function prepare() {}
/** the director: a daily run is driven by the server's answers (the view folds them in); a finished run → final */
export function step(game) {
  if (!game) return null;
  if (game.done && game.phase !== 'final') return { phase: 'final' };
  return null;
}
/** no player-written room data: a daily is /api only (THE PARKED DATABASE) */
export const livePaths = () => ({});
/** the solo lane: ONE row (D3) */
export const finalRanks = game => Object.keys((game && game.participants) || {}).slice(0, 1).map(uid => ({ uid, rank: 1 }));
/** FEATS the server may read (docs/cartridge.md D3): the run's score + doors (bounded on the server) */
export const feats = game => { const s = scoreOf(game); return { pwScore: s.score, pwDoors: s.doors, pwGuesses: s.guesses }; };
/** the result of a finished run (the daily module's one number) */
export const resultFor = game => resultOf(game);
