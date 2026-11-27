// FREEFALL — THE CARTRIDGE (F4A — docs/freefall.md "THE CARTRIDGE"; the contract: js/games/contract.js, docs/cartridge.md; HIGH RISE's
// S4A cartridge is the pattern). BEING BUILT — HIDDEN: config.js GAMES `playable: false` + `preview` = THE OWNER'S LIVE TEST only (his
// phone's PLAY shelf / his room's list: FREEFALL · TEST); nobody else is offered it, a start from another phone is refused. NOTHING COUNTS:
// THE SWITCH (api/_lib/freefall.js#FREEFALL_COUNTS) is OFF — the server judges the run and answers what it WOULD award.
// F4A = THE SOLO RUN: the stage (stage.js — the SAME module /freefall-play mounts) in the console's frame, the proof written as you play
// (view.js → rooms/{CODE}/ff/{matchId}/{uid}), the end screen's body (final.js), PLAY AGAIN = the console's INSTANT AGAIN.
// THE MATCH (2 … 8 players: ghosts, Call the Winner, the podium, the finish) = F4B — a room of two or more can not start it yet.
import { createGame, nextStep, nextRun } from './director.js';
import { gameStandings } from './logic.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
export * from './meta.js';
import { lazyView } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';

/** THE MUSIC FOLLOWS THE LOOK (JAYWALK's rule — the existing mood stations): the day deck by day, the evening deck by night */
export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];

// (the stage's own sheet — css/freefall-play.css, the test page's: ONE look for both; three.js through the import map — Safari < 16.4 gets a clear card)
export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), ['kit', 'freefall-play'], { needs: globalThis.__nsViewNeeds ? globalThis.__nsViewNeeds.importMaps('FREEFALL') : null });

// THE PROOF NODE (rooms/{CODE}/ff/{matchId}/{uid} — proof.js): written by the player AT GO + their input log in chunks as they play
export const livePaths = g => ({ runs: `ff/${g.matchId}` });

/** (a stand-in only: a run's seed is picked AFTER its GO — logic.js#seedOf — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

/** F4A: ONE player = THE SOLO RUN. A room of two or more → null (the console's COULD NOT START): THE MATCH is F4B. (WHO may start it is
 *  the console's gate — the owner's phone only while the game is being built.) */
export async function start({ matchId, settings, participants, now }) {
  if (Object.keys(participants || {}).length !== 1) return null;
  return createGame({ matchId, settings, participants, now, seed: newSeed() });
}

export function prepare() { /* nothing to top up: the phone runs its own tower */ }

export const step = (game, { now, live, code }) => nextStep(game, { now, live, code });
/** every phone, at the game start (the walk inside): the sounds' bytes into the cache — fetch, never build */
export function preload() {
  lazyImport(import('./sfx.js'), './sfx.js').then(S => S.fetchSounds()).catch(() => {});
}
/** PLAY AGAIN after a solo run — the console's INSTANT AGAIN (games/kit/again.js): the next run as a match of its own, no walk inside */
export const soloAgain = (game, { matchId, now }) => nextRun(game, { matchId, now });
export { finalScene } from './final.js';
/** SHARE (F4B): THE SHARE CARD (share.js — the run's real end frame, the floors, the cause, the area + the blazes) on the site's share kit; the
 *  console's universal footer shows SHARE for a cartridge with it (ui/final.js) — solo + match */
export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));

export const finalRanks = game => gameStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
