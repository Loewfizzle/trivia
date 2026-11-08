// COAST CLEAR — THE CARTRIDGE (CC1 — docs/coastclear.md; the contract: docs/cartridge.md). A DAILY-ONLY solo Minesweeper-type: a DAILIES
// row in config.js (never GAMES — no room ever starts it; THE DAILY MODULE opens it once a day, later); it still plugs into the console like
// every game so the console needs nothing new for it. The server keeps the board + answers every dig (api/_lib/cc.js); the phone holds the
// cells it opened, never one it wasn't told.
export * from './meta.js';
import { emptyView } from './logic.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { result } from './daily.js';
export { daily } from './daily.js';
export { createApiJudge } from './judge.js';
export { createLesson } from './lesson.js';   // (DM2 — THE PRACTICE HARBOR: the first time only — config.js#DAILIES lesson: true)   // (DM2 — THE DAILY SCREEN's run host wraps it: it hears the start + the finish)

export const createView = lazyView(() => import('./view.js'), gameSheets('coastclear'));

/** a room match of COAST CLEAR never starts (a DAILIES row); the shell a daily run lives in: one player, one run (its board on the server) */
export async function start({ matchId, participants, now }) {
  const uid = Object.keys(participants || {})[0] || null;
  return { id: 'coastclear', uid, matchId, participants: { ...(participants || {}) }, phase: 'play', phaseStartAt: now, startedAt: now, run: emptyView({ startedAt: now }) };
}
/** nothing to prepare: the host holds no board — the server does */
export function prepare() {}
/** the director: a daily run is driven by the server's answers (the view folds them in); a finished run → final */
export function step(game) {
  if (!game) return null;
  if (game.run && game.run.done && game.phase !== 'final') return { phase: 'final' };
  return null;
}
/** no player-written room data: a daily is /api only (THE PARKED DATABASE) */
export const livePaths = () => ({});
/** the solo lane: ONE row (D3) */
export const finalRanks = game => Object.keys((game && game.participants) || {}).slice(0, 1).map(uid => ({ uid, rank: 1 }));
/** FEATS the server may read (docs/cartridge.md D3): the run's score + spots (bounded on the server; CC2's rewards read the server's record) */
export const feats = game => { const r = result(game); const v = game && game.run; return { ccScore: r ? r.score : null, ccSpots: v ? v.spots : 0, ccClear: !!(v && v.out === 'clear') }; };
export const resultFor = game => result(game);
/** CC2 — THE MUSIC FOLLOWS THE LOOK (like THE PASSWORD): DAY = the day deck, NIGHT = the evening deck; the console re-reads it when the look
 *  changes (app.js#applyLook → render) and crossfades (music.js); the menu song until the decks load */
export { lookMusic as musicFor } from '../../daily/end.js';   // (DM1 — THE DAILY KIT)
