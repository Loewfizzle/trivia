// HIGH RISE — THE CARTRIDGE (S4A — docs/highrise.md "THE CARTRIDGE"; the contract: js/games/contract.js, docs/cartridge.md). PLAYABLE for
// everyone since THE GO-LIVE (Nov 20 — config.js GAMES `playable: true`): any phone's PLAY shelf + any room's list; every proven run COUNTS
// (THE SWITCH: api/_lib/highrise.js#HIGHRISE_COUNTS — ON; false = the kill switch: judged, WOULD COUNT, nothing awarded).
// S4A = THE SOLO RUN: the stage (stage.js — the SAME module /highrise-play mounts) in the console's frame, the proof written as you
// drop (view.js → rooms/{CODE}/hr/{matchId}/{uid}), the end screen (final.js), PLAY AGAIN = the console's INSTANT AGAIN.
// S4B = THE MATCH (2 … 8 players — a room THE OWNER hosts; docs/highrise.md "THE MATCH"; JAYWALK's is the pattern): the SAME seed for
// everyone (THE FIRST GO), each player's own proof node, the rivals' HEIGHT TAPES + THE ALTIMETER, out = WATCH + Call the Winner, the
// finish at floor 200, the 6:00 cap, the podium, REMATCH; the server replays every player's run.
import { createGame, nextStep, nextRun } from './director.js';
import { gameStandings } from './logic.js';
import { nightBonus as bonus, MATCH_MAX } from './match.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
export * from './meta.js';
import { lazyView } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';

/** THE MUSIC FOLLOWS THE LOOK (JAYWALK's rule — the existing mood stations): the day deck by day, the evening deck by night */
export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];

// (the stage's own sheet — css/highrise-play.css, the test page's: ONE look for both)
export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), ['kit', 'highrise-play'], { needs: globalThis.__nsViewNeeds ? globalThis.__nsViewNeeds.importMaps('HIGH RISE') : null });   // (THE FIX PASS — P1: three.js through the import map — Safari < 16.4 gets a clear card, never a blank match)

// THE PROOF NODE (rooms/{CODE}/hr/{matchId}/{uid} — proof.js): written by the player AT GO + their tap log in chunks as they drop
export const livePaths = g => ({ runs: `hr/${g.matchId}` });

/** (a stand-in only: a run's seed is picked AFTER its GO — logic.js#seedOf — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

/** ONE player = THE SOLO RUN · 2 … 8 = THE MATCH (S4B). (WHO may start it is the console's gate — any phone since THE GO-LIVE;
 *  a late joiner is not among the participants: they WATCH until the REMATCH deals them in.) */
export async function start({ matchId, settings, participants, now }) {
  const n = Object.keys(participants || {}).length;
  if (n < 1 || n > MATCH_MAX) return null;
  return createGame({ matchId, settings, participants, now, seed: newSeed() });
}

export function prepare() { /* nothing to top up: the phone runs its own tower */ }

export const step = (game, { now, live, code, online }) => nextStep(game, { now, live, code, online });
/** Call the Winner's game-night points (S4B) */
export const nightBonus = bonus;
/** every phone, at the game start (the walk inside): the sounds' bytes into the cache — fetch, never build (117 KB) */
export function preload() {
  lazyImport(import('./sfx.js'), './sfx.js').then(S => S.fetchSounds()).catch(() => {});
}
/** PLAY AGAIN after a solo run — the console's INSTANT AGAIN (games/kit/again.js): the next run as a match of its own, no walk inside */
export const soloAgain = (game, { matchId, now }) => nextRun(game, { matchId, now });
export { finalScene } from './final.js';
/** THE END-SCREEN BOARD (THE END-BOARD SWITCH-ON, Nov 27 — ui/end-board.js, the podium's ONE shared block): solo = the board's TOP 3 (☐ FRIENDS
 *  ONLY), a match = its own TOP 3 · FLOORS (the board's tower number prints its floor) · the STORED AVERAGE (core/board-avg.js — counts from Nov 27) */
export const END_BOARD = Object.freeze({ b: 'highrise-solo', word: 'FLOORS', avg: true });
/** SHARE (S5; REVIEW FIX B: THE POSTER — share.js: the band's pre-rendered hero shot, the floor, the cause) on the site's share kit; the console's
 *  universal footer shows SHARE for a cartridge with it (ui/final.js) — solo + match */
export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));

export const finalRanks = game => gameStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
