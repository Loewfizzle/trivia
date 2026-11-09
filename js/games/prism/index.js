// PRISM DROP module entry (see games/registry.js for the contract).
import { createGame, nextStep, nightBonus as bonus } from './director.js';
import { LEAD_MS, SONGS_PER_MATCH, playlistAt, standings, cleanSettings, dealSongs, dayPos, setForLook, setOfSong, matchTiming } from './logic.js';
// (SHELL 2.0 B1 — THE THIN META: DEFAULT_SETTINGS, MIN_PLAYERS, OPTIONS, estimateMinutes, MUSIC, the banner, the chat's lock — meta.js)
export * from './meta.js';
import { loadManifest, loadSong } from './songs.js';
import { state } from '../../store.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { markUsed } from '../kit/night.js';
import { pickPaper } from './crayon.js';
import { currentLook, resolveLook, sunUpNow } from '../kit/look.js';

/** (PD-5A — THE HOST's SET) the look THIS phone resolves now: its THE GAME LOOK choice, AUTO = the real sun → 'day' | 'night' */
async function lookNow(ms) {
  const choice = currentLook();
  return resolveLook(choice, choice === 'auto' ? await sunUpNow(ms) : true);
}

export const createView = lazyView(() => import('./view.js'), gameSheets('prism'));
// the match plays its own songs (synced to the server clock, through a filter for the danger/duel effects)

export const livePaths = g => ({ boards: `prism/${g.matchId}`, calls: `prismcall/${g.matchId}` });

function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now, used }) {
  const s = cleanSettings(settings, Object.keys(participants || {}).length);   // (PD-2: one player never plays BATTLE)
  const songs = await loadManifest().catch(() => []);
  // the room's playlist: one seeded shuffle per room session and per SET, continuing match after match (PD-5A: the HOST's look picks the
  // set — stored in the game; every phone plays it, whatever it draws)
  const pm = (state.meta && state.meta.prism) || {};
  const roomSeed = pm.seed || newSeed();
  const set0 = setForLook(await lookNow(now).catch(() => 'night'));
  const usedP = (used && used.prism) || {};
  const pos = set => (set === 'day' ? dayPos(usedP) : pm.n || 0);
  const count = s.mode === 'rush' ? 1 : SONGS_PER_MATCH;
  const deal = dealSongs({ manifest: songs, set: set0, roomSeed, pos: pos(set0), count });
  const { set, songs: list, sd, cu, ff } = deal;
  const pl0 = pos(set);
  const songStartAt = now + LEAD_MS;
  // GO + SCORE RUSH's end on the first song's grid (its cue-in included — logic.js#matchTiming)
  const doc0 = list.length ? await loadSong(list[0]).catch(() => null) : null;
  const { playStartAt, endAt } = matchTiming({ songStartAt, doc0, cue0: cu ? cu[0] / 1000 : 0, sd0: sd[0] || 0, hasSongs: list.length > 0 });
  const seed = newSeed();
  // (PD-4 — THE PAPER: the host deals one page per match — the same for everyone, a different one every match; the night's memory remembers it)
  const paper = pickPaper(seed, (used && used.prism) || {});
  const game = { ...createGame({
    matchId, settings: s, participants, now, seed, songs: list, sd, pl0,
    songStartAt, playStartAt, endAt, set, cu, ff,
  }), pp: paper.i };
  const $room = { ...markUsed('prism', [paper.key]), ...(pm.seed ? {} : { 'meta/prism': { seed: roomSeed, n: pm.n || 0 } }) };
  return { ...game, $room };
}

export function prepare() { /* nothing to top up: every phone runs its own board */ }

/** THE PRELOAD (PD-1 — docs/cartridge.md THE PRELOAD BUDGET, ≤ 1.5 MB): on every phone during the walk inside — the songs' manifest + the FIRST
 *  song's analysis (beat grid, key, world: ~5 KB), predicted from the room's playlist (meta/prism); a room's first match (no playlist yet —
 *  the host deals it at the start) takes all five (~25 KB). The worlds are shaders in code (worlds.js — in the view's module graph, already
 *  preloaded by js/games/preload.js); the song FILE itself (1.8–3.2 MB) is NOT preloaded — it streams in at the start (docs/prism.md). */
export function preload() {
  // (PD-5A: the set is the HOST's look — predicted here from this phone's: a room plays the same set as most of its phones' clocks)
  return Promise.all([loadManifest(), lookNow(Date.now()).catch(() => 'night')]).then(([songs, look]) => {
    const set = setForLook(look);
    const ids = songs.filter(x => setOfSong(x) === set).map(x => x.id);
    const pm = (state.meta && state.meta.prism) || {};
    const used = (state.meta && state.meta.used && state.meta.used.prism) || {};
    const pos = set === 'day' ? dayPos(used) : pm.n || 0;
    const first = pm.seed && ids.length ? playlistAt(set === 'day' ? `${pm.seed}:day` : pm.seed, pos, ids) : null;
    return Promise.all((first ? [first] : ids).map(id => loadSong(id).catch(() => null)));
  }).catch(() => null);
}

export const step = (game, { now, live, online }) => nextStep(game, { now, online, presence: state.presence, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

// (PD-1 — THE CONSOLE'S PODIUM: PRISM draws only the BODY inside the console's frame — docs/cartridge.md D8)
export { finalScene } from './victory.js';

// (THE CARTRIDGE PLUG's chat lock + BANNER_NAME + OPTIONS: meta.js)
