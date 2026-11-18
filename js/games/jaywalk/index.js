// JAYWALK — THE CARTRIDGE (H1 — docs/jaywalk.md; the contract: js/games/contract.js, docs/cartridge.md). PLAYABLE since THE GO-LIVE
// PASS (Nov 17): config.js GAMES `playable: true` — offered everywhere; its thin meta at boot (registry.js#META), HOW TO PLAY in ui/help.js.
// H4 = THE MATCH (ONE LIFE): the course from THE FIRST GO, the ghosts (everyone's hop logs through the same engine), the live order, out =
// SPECTATE + Call the Winner, the podium (the winner, the order, each player's cause line); the server replays every player's log.
// H3 = THE SOLO GAME: the real view (view.js — the night look, the proof written as you hop), the end screen (victory.js), PLAY AGAIN.
// H1 = the rules + the frame: start → THE GAME FRAME (id, matchId, participants, phase), a pure step (THE 3 S RULE: every patch moves the
// phase), the live path (everyone's proof node — the hop logs ARE the ghosts), the ranks from THE REPLAY. Its screen: a stub until H2 / H4
// (the graybox lives on /jaywalk-lab).
import { createGame, nextStep, nextRun, nightBonus as bonus } from './director.js';
import { standings } from './logic.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
export * from './meta.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';

/** H5B — THE MUSIC FOLLOWS THE LOOK (the existing mood stations): the day deck by day, the evening deck by night — `meta.MUSIC` stays
 *  the podium's + the fallback */
export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];

export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('jaywalk'));

// THE PROOF NODE (rooms/{CODE}/jw/{matchId}/{uid}): written by the player AT GO (present = proven) + their hop log in chunks as they hop —
// mirrored for everyone: the same seed + a player's log = their run, tick for tick (the see-through ghosts — H4)
export const livePaths = g => ({ runs: `jw/${g.matchId}` });

/** (a stand-in only: a SOLO run's course is picked AFTER its GO, a MATCH's after THE FIRST GO — logic.js#seedOf / matchStart — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  return createGame({ matchId, settings, participants, now, seed: newSeed() });
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
}
/** PLAY AGAIN after a solo run — the console's INSTANT AGAIN (games/kit/again.js): the next solo run as a match of its own, no walk inside */
export const soloAgain = (game, { matchId, now }) => nextRun(game, { matchId, now });
/** SHARE: THE SHARE IMAGE (H4 — share.js: the frame the run ended on + the lanes + the cause line + THE SIGNAL) on the site's share kit */
export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));
export { finalScene } from './victory.js';

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
