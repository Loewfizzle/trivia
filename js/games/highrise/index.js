// HIGH RISE — THE CARTRIDGE (S4A — docs/highrise.md "THE CARTRIDGE"; the contract: js/games/contract.js, docs/cartridge.md). HIDDEN:
// config.js GAMES `playable: false` + `preview` — THE OWNER'S LIVE TEST only (JAYWALK H1 / H3's rule): his phone's PLAY shelf + his room's
// list offer HIGH RISE · TEST, nobody else's; the server counts nothing of it for anyone else (api/report.js#reportableGame) — and, until
// go-live, awards NOTHING at all (THE SWITCH: api/_lib/highrise.js#HIGHRISE_COUNTS — the server judges every run and answers WOULD COUNT).
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

// (the stage's own sheet — css/highrise-play.css, the test page's: ONE look for both; css/highrise.css is THE LAB's graybox)
export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), ['kit', 'highrise-play']);

// THE PROOF NODE (rooms/{CODE}/hr/{matchId}/{uid} — proof.js): written by the player AT GO + their tap log in chunks as they drop
export const livePaths = g => ({ runs: `hr/${g.matchId}` });

/** (a stand-in only: a run's seed is picked AFTER its GO — logic.js#seedOf — never this) */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

/** ONE player = THE SOLO RUN · 2 … 8 = THE MATCH (S4B). (WHO may start it is the console's gate: a hidden game — THE OWNER's phone alone;
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

export const finalRanks = game => gameStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
