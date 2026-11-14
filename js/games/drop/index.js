// THE DROP — THE CARTRIDGE (THE DROP A — docs/prism.md "THE DROP"; the contract: docs/cartridge.md). PRISM DROP's DAILY: a DAILIES row
// (never GAMES — no room starts it); its run plays on PRISM DROP's REAL view in SURVIVAL (js/games/prism/view.js — its DROP mode, driven by
// ./view.js: the day's seed + THE DROP's schedule, the input log, checkpoints, pauses). The server replays the log (api/_lib/drop.js).
export * from './meta.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { result } from './daily.js';
import { lazyImport } from '../../ui/lazy-import.js';
export { daily } from './daily.js';
export { createApiJudge } from './judge.js';

export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('prism'));

/** a room match never starts (a DAILIES row); the shell a daily run lives in: one player, one run */
export async function start({ matchId, participants, now }) {
  const uid = Object.keys(participants || {})[0] || null;
  return { id: 'drop', uid, matchId, participants: { ...(participants || {}) }, phase: 'play', phaseStartAt: now, startedAt: now, run: null };
}
export function prepare() {}
export function step(game) {
  if (!game) return null;
  if (game.run && game.run.score != null && game.phase !== 'final') return { phase: 'final' };
  return null;
}
/** no player-written room data: a daily is /api only (THE PARKED DATABASE) */
export const livePaths = () => ({});
export const finalRanks = game => Object.keys((game && game.participants) || {}).slice(0, 1).map(uid => ({ uid, rank: 1 }));
export const resultFor = game => result(game);
/** THE DROP B: the run plays PRISM DROP's own songs (its view) — the console plays nothing over them */
export const musicFor = () => [null];
/** THE DROP B — THE ONE-TIME HINT (the row's `lesson: true`): one line under the board on a player's FIRST DROP only (seen once — pstats/{pid}/ls) */
export const HINT = 'Survive as long as you can — the rows keep rising. One run a day.';
