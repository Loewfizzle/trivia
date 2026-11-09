// PRISM DROP module entry (see games/registry.js for the contract).
import { createGame, nextStep, nightBonus as bonus } from './director.js';
import { LEAD_MS, COUNT_MIN_MS, SONGS_PER_MATCH, playlistAt, standings, cleanSettings } from './logic.js';
// (SHELL 2.0 B1 — THE THIN META: DEFAULT_SETTINGS, MIN_PLAYERS, OPTIONS, estimateMinutes, MUSIC, the banner, the chat's lock — meta.js)
export * from './meta.js';
import { loadManifest, loadSong, goBeat } from './songs.js';
import { state } from '../../store.js';
import { lazyView, gameSheets } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'), gameSheets('prism'));
// the match plays its own songs (synced to the server clock, through a filter for the danger/duel effects)

export const livePaths = g => ({ boards: `prism/${g.matchId}`, calls: `prismcall/${g.matchId}` });

function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  const s = cleanSettings(settings, Object.keys(participants || {}).length);   // (PD-2: one player never plays BATTLE)
  const songs = await loadManifest().catch(() => []);
  const ids = songs.map(x => x.id);
  // the room's playlist: one seeded shuffle per room session, continuing match after match
  const pm = (state.meta && state.meta.prism) || {};
  const roomSeed = pm.seed || newSeed();
  const pl0 = pm.n || 0;
  const count = s.mode === 'rush' ? 1 : SONGS_PER_MATCH;
  const list = ids.length ? Array.from({ length: count }, (_, i) => playlistAt(roomSeed, pl0 + i, ids)) : [];
  const byId = Object.fromEntries(songs.map(x => [x.id, x]));
  const sd = list.map(id => Math.round(((byId[id] && byId[id].duration) || 180) * 1000));
  const songStartAt = now + LEAD_MS;
  let playStartAt = songStartAt + COUNT_MIN_MS + 800;
  let endAt = null;
  if (list.length) {
    const doc = await loadSong(list[0]).catch(() => null);
    if (doc) {
      const go = goBeat(doc, COUNT_MIN_MS / 1000);
      playStartAt = songStartAt + Math.round(go.time * 1000);
      endAt = songStartAt + Math.round((doc.lastBeat || doc.duration - 2) * 1000);
    } else {
      endAt = songStartAt + sd[0] - 2000;
    }
  } else {
    endAt = playStartAt + 150_000;
  }
  const game = createGame({
    matchId, settings: s, participants, now, seed: newSeed(), songs: list, sd, pl0,
    songStartAt, playStartAt, endAt,
  });
  return pm.seed ? game : { ...game, $room: { 'meta/prism': { seed: roomSeed, n: pl0 } } };
}

export function prepare() { /* nothing to top up: every phone runs its own board */ }

/** THE PRELOAD (PD-1 — docs/cartridge.md THE PRELOAD BUDGET, ≤ 1.5 MB): on every phone during the walk inside — the songs' manifest + the FIRST
 *  song's analysis (beat grid, key, world: ~5 KB), predicted from the room's playlist (meta/prism); a room's first match (no playlist yet —
 *  the host deals it at the start) takes all five (~25 KB). The worlds are shaders in code (worlds.js — in the view's module graph, already
 *  preloaded by js/games/preload.js); the song FILE itself (1.8–3.2 MB) is NOT preloaded — it streams in at the start (docs/prism.md). */
export function preload() {
  return loadManifest().then(songs => {
    const ids = songs.map(x => x.id);
    const pm = (state.meta && state.meta.prism) || {};
    const first = pm.seed && ids.length ? playlistAt(pm.seed, pm.n || 0, ids) : null;
    return Promise.all((first ? [first] : ids).map(id => loadSong(id).catch(() => null)));
  }).catch(() => null);
}

export const step = (game, { now, live, online }) => nextStep(game, { now, online, presence: state.presence, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

// (PD-1 — THE CONSOLE'S PODIUM: PRISM draws only the BODY inside the console's frame — docs/cartridge.md D8)
export { finalScene } from './victory.js';

// (THE CARTRIDGE PLUG's chat lock + BANNER_NAME + OPTIONS: meta.js)
