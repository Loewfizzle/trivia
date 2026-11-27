// JAYWALK — THE CARTRIDGE (H1 — docs/jaywalk.md; the contract: js/games/contract.js, docs/cartridge.md). PLAYABLE since THE GO-LIVE
// The long notes: docs/games/jaywalk-notes.md
import { createGame, nextStep, nextRun, nightBonus as bonus } from './director.js';
import { standings } from './logic.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
export * from './meta.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';

/** H5B — THE MUSIC FOLLOWS THE LOOK (the existing mood stations): the day deck by day, the evening deck by night — `meta.MUSIC` stays … */
export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];

export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('jaywalk'), { needs: globalThis.__nsViewNeeds ? globalThis.__nsViewNeeds.importMaps('JAYWALK') : null });

// THE PROOF NODE (rooms/{CODE}/jw/{matchId}/{uid}): written by the player AT GO (present = proven) + their hop log in chunks as they hop — …
export const livePaths = g => ({ runs: `jw/${g.matchId}` });
/** LAST MILE — THE LIGHTER MATCH SYNC: the tree grows by a chunk from every phone ~8 times a second — mirrored in place, never rebuilt whole */
export const liveTrees = ['runs'];

/** (a stand-in only: a SOLO run's course is picked AFTER its GO, a MATCH's after THE FIRST GO — logic.js#seedOf / matchStart — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  const g = createGame({ matchId, settings, participants, now, seed: newSeed() });
  // VARIETY A — THE HOST's CLOCK (the owner): AUTO in a match = the time of day by the HOST's sun at the start (daylook.js — the city's model),
  // sent with the start so every phone shows the same look (a VIEW: no rule, replay or count reads it; a phone on DAY / NIGHT keeps its own)
  try { const D = await lazyImport(import('./daylook.js'), './daylook.js'), k = D.stampOf(await D.sunAt(now)); if (k) g.lk = k; } catch { /* polish: each phone's own clock */ }
  return g;
}

export function prepare() { /* nothing to top up: every phone runs its own kid on the shared seed */ }

export const step = (game, { now, live, code, online }) => nextStep(game, { now, live, code, online });
/** Call the Winner's game-night points (H4) */
export const nightBonus = bonus;

// H3 — THE SOLO GAME
/** every phone, at the game start (the walk inside): the sounds' bytes + the models' files into the cache — fetch, never build (≤ 1.5 MB) */
export function preload() {
  lazyImport(import('./sfx.js'), './sfx.js').then(S => S.fetchSounds()).catch(() => {});
  lazyImport(import('./models.js'), './models.js').then(M => M.warmModels && M.warmModels()).catch(() => {});
  lazyImport(import('./variety.js'), './variety.js').then(M => M.warmVariety && M.warmVariety()).catch(() => {});
  lazyImport(import('./props.js'), './props.js').then(M => M.warmProps && M.warmProps()).catch(() => {});
}
/** PLAY AGAIN after a solo run — the console's INSTANT AGAIN (games/kit/again.js): the next solo run as a match of its own, no walk inside */
export const soloAgain = (game, { matchId, now }) => nextRun(game, { matchId, now });
/** SHARE: THE SHARE IMAGE (H4 — share.js: the frame the run ended on + the lanes + the cause line + THE SIGNAL) on the site's share kit */
export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));
export { finalScene } from './victory.js';
/** THE END-SCREEN BOARD (THE END-BOARD SWITCH-ON, Nov 27 — ui/end-board.js, the podium's ONE shared block): solo = the board's TOP 3 (☐ FRIENDS
 *  ONLY), a match = its own TOP 3 · LANES · the STORED AVERAGE (JT2) beside each best */
export const END_BOARD = Object.freeze({ b: 'jaywalk-solo', word: 'LANES', avg: true });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
