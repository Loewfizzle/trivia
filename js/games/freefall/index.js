// FREEFALL — THE CARTRIDGE (F4A — docs/freefall.md "THE … index.js#1
import { createGame, nextStep, nextRun } from './director.js';
import { gameStandings } from './logic.js';
import { nightBonus as bonus, MATCH_MAX } from './match.js';
import { BOARD } from './lines.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, … index.js#2
export * from './meta.js';
import { lazyView } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { currentLook, resolveLook, sunUpNow } from '../kit/look.js';

// THE MUSIC FOLLOWS THE LOOK (JAYWALK's rule — the existing … index.js#3
export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];

// (the stage's own sheet — css/freefall-play.css, the test … index.js#4
export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), ['kit', 'freefall-play'], { needs: globalThis.__nsViewNeeds ? globalThis.__nsViewNeeds.importMaps('FREEFALL') : null });

// THE PROOF NODE (rooms/{CODE}/ff/{matchId}/{uid} — … index.js#5
export const livePaths = g => ({ runs: `ff/${g.matchId}` });

/** (a stand-in only: a run's seed is picked AFTER its GO — logic.js#seedOf — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

/** ONE player = THE SOLO RUN · 2 … 8 = THE MATCH (F4B). (WHO may start it is the console's gate — the owner's phone only while the game
 *  is being built; a late joiner is not among the participants: they WATCH until the REMATCH deals them in.) */
export async function start({ matchId, settings, participants, now }) {
  const n = Object.keys(participants || {}).length;
  if (n < 1 || n > MATCH_MAX) return null;
  return createGame({ matchId, settings, participants, now, seed: newSeed(), look: n > 1 ? await hostLook() : '' });
}
// THE LOOK LOCK (FIX A): a match plays in the HOST's look on … index.js#6
const hostLook = () => sunUpNow(Date.now()).then(up => resolveLook(currentLook(), up), () => resolveLook(currentLook(), true));

export function prepare() { /* nothing to top up: the phone runs its own tower */ }

export const step = (game, { now, live, code, online }) => nextStep(game, { now, live, code, online });
/** Call the Winner's game-night points (F4B) */
export const nightBonus = bonus;
/** every phone, at the game start (the walk inside): the sounds' bytes into the cache — fetch, never build */
export function preload() {
  lazyImport(import('./sfx.js'), './sfx.js').then(S => S.fetchSounds()).catch(() => {});
}
// PLAY AGAIN after a solo run — the console's INSTANT AGAIN … index.js#7
export const soloAgain = (game, { matchId, now }) => nextRun(game, { matchId, now });
export { finalScene } from './final.js';
/** SHARE (F4B): THE SHARE CARD (share.js — the run's real end frame, the floors, the cause, the area + the blazes) on the site's share kit; the
 *  console's universal footer shows SHARE for a cartridge with it (ui/final.js) — solo + match */
export { shareNow as shareRun } from './final.js'; // index#8
// F5B — THE END-SCREEN BOARD (ui/end-board.js — the podium's … index.js#9
export const END_BOARD = Object.freeze({ b: BOARD, word: 'FLOORS', avg: true });

export const finalRanks = game => gameStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
