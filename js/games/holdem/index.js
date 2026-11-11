// HOLD'EM — THE CARTRIDGE (HE3 — docs/cartridge.md, docs/holdem.md "THE TABLE SCREEN"). THE SERVER IS THE DEALER (HE2): the host's
// phone holds no cards and decides nothing about the play — `start` asks the dealer (POST /api/report { holdem: 'start' }) to seat the
// console's players; from then on rooms/{CODE}/holdem (the public table — THE LEAN WIRE) + each phone's hole/{CODE}/{uid} ARE the match.
// The console's `game` node only carries the match's frame: its id, settings, participants, and — once the dealer says it's over AND its
// result is in — `phase: 'final'` with the places (finalRanks → GAME NIGHT, THE WINNER's BANNER).
export * from './meta.js';
import { cleanSettings } from './meta.js';
import { fromWire } from './wire.js';
import { directorStep, FINAL_HOLD_MS } from './logic.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { fetchSounds } from './sfx.js';
import { skinOf, skinAssets } from './skins.js';
import { courtUrl } from './card-art.js';
import { settings } from '../../audio/settings.js';

export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('holdem'));

/** the dealer's public table (the whole node — phones listen to it; the director reads `table`) */
export const livePaths = () => ({ table: 'holdem' });

/** THE DEALER's ops ride /api/report (still 8 functions) — the phone side (`api` = profile/api.js: the ID token, ApiFail on a refusal) */
export async function dealer(body) {
  const { api } = await lazyImport(import('../../profile/api.js'), '../../profile/api.js');
  return api('report', body, { timeout: 8000 });
}

/**
 * THE START (the host's phone): the dealer seats the console's connected players (≤ 8), in its own random order, and deals hand 1 at
 * `now` — the moment the match begins, after the walk inside (docs/cartridge.md). The console's matchId is the dealer's: the podium's
 * report then finds results/{CODE}_{matchId}, which the dealer credits itself at the end.
 */
export async function start({ code, matchId, settings, participants, now }) {
  const s = cleanSettings(settings);
  const uids = Object.keys(participants || {});
  await dealer({ holdem: 'start', room: code, mode: s.mode, ...(s.mode === 'tournament' ? { speed: s.speed } : {}), matchId, uids, at: now });
  return { id: 'holdem', matchId, settings: s, participants, phase: 'play', phaseStartAt: now, startAt: now };
}

/** nothing to top up: the server deals (the pokes are every phone's — the view, on THE POKE's rule) */
export function prepare() {}

/** THE DIRECTOR (pure — logic.js#directorStep): the console's frame only — the podium once the dealer's match is over, its result sent, and
 *  (HE10 — A3) FINAL_HOLD_MS after its end */
export const step = (game, ctx) => directorStep(game, { ...ctx, pub: fromWire(ctx && ctx.live && ctx.live.table) });
export { FINAL_HOLD_MS };

export const finalRanks = game => (game && Array.isArray(game.ranks) ? game.ranks.map(r => ({ uid: r.uid, rank: r.rank })) : []);

export { finalScene } from './final.js';

/** THE PRELOAD (≤ 1.5 MB — docs/cartridge.md): the felt + the card back (+ the faces' fonts) + HE5's 17 sounds (~365 KB — decoded once at
 *  the unlock). Fetch, don't build. */
export function preload() {
  const chips = ['red', 'green', 'black', 'purple', 'yellow', 'orange'].flatMap(c => [`chips/chip-${c}-top.webp`, `chips/chip-${c}-side.webp`]);   // (HE5: 36 KB)
  // (HE5: ONLY the chosen skin's art — this phone's settings.heSkin; NEON CASINO ≈ 100 KB)
  // (HE6: + THE REAL CARDS' court figures — ONLY this phone's deck's sprite, ~195 KB — + the card stock's grain, 1.4 KB)
  const imgs = [...skinAssets(skinOf(settings.heSkin), typeof innerWidth === 'number' && innerWidth > innerHeight), ...chips.map(f => new URL(`../../../assets/holdem/${f}`, import.meta.url).href),
    courtUrl(settings.heDeck), new URL('../../../assets/holdem/cards/stock.webp', import.meta.url).href];
  return Promise.all([
    ...imgs.map(src => fetch(src).then(r => r.blob()).catch(() => null)),
    fetchSounds().catch(() => null),
    document.fonts ? document.fonts.load('700 20px "Chakra Petch"').catch(() => null) : null,
  ]).catch(() => null);
}
