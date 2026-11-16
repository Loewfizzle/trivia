// JAYWALK — THE CARTRIDGE (H1 — docs/jaywalk.md; the contract: js/games/contract.js, docs/cartridge.md). BEING BUILT: config.js GAMES
// `playable: false` + `preview: true` — the console never offers it; a local emulator page (`?emu&preview=1`) or the owner's phone may start it.
// H1 = the rules + the frame: start → THE GAME FRAME (id, matchId, participants, phase), a pure step (THE 3 S RULE: every patch moves the
// phase), the live path (everyone's proof node — the hop logs ARE the ghosts), the ranks from THE REPLAY. Its screen: a stub until H2 / H4
// (the graybox lives on /jaywalk-lab).
import { createGame, nextStep } from './director.js';
import { standings } from './logic.js';
// (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
export * from './meta.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';

export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('jaywalk'));

// THE PROOF NODE (rooms/{CODE}/jw/{matchId}/{uid}): written by the player AT GO (present = proven) + their hop log in chunks as they hop —
// mirrored for everyone: the same seed + a player's log = their run, tick for tick (the see-through ghosts — H4)
export const livePaths = g => ({ runs: `jw/${g.matchId}` });

/** a new seed every match (and every solo run): the same course for everyone in it */
function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  return createGame({ matchId, settings, participants, now, seed: newSeed() });
}

export function prepare() { /* nothing to top up: every phone runs its own kid on the shared seed */ }

export const step = (game, { now, live }) => nextStep(game, { now, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
