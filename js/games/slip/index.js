// SLIPSTREAM module entry (see games/registry.js for the contract).
import { createGame, nextStep, nightBonus as bonus } from './director.js';
import { DEFAULT_SETTINGS, MIN_PLAYERS, LEAD_MS, SONGS_PER_MATCH, LIVES, playlistAt, standings, estimateMinutes as estimate, cleanSettings } from './logic.js';
import { state } from '../../store.js';
import { lazyView, gameSheets } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'), gameSheets('slip'));
// the ride plays its own songs (synced to the server clock, through the adaptive biome chain)
export const MUSIC = null;
export { DEFAULT_SETTINGS, MIN_PLAYERS };

export const livePaths = g => ({ riders: `slip/${g.matchId}`, calls: `slipcall/${g.matchId}` });

const base = new URL('../../../', import.meta.url);
let manifest = null;
export function loadSlipManifest() {
  if (!manifest) manifest = fetch(new URL('data/slip/manifest.json', base)).then(r => r.json()).then(m => m.songs).catch(e => { manifest = null; throw e; });
  return manifest;
}

function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  const s = cleanSettings(settings);
  const songs = await loadSlipManifest().catch(() => []);
  const ids = songs.map(x => x.id);
  // the room's playlist: one seeded shuffle per room session, continuing match after match (never a repeat until
  // all have played)
  const pm = (state.meta && state.meta.slip) || {};
  const roomSeed = pm.seed || newSeed();
  const pl0 = pm.n || 0;
  const list = ids.length ? Array.from({ length: SONGS_PER_MATCH }, (_, i) => playlistAt(roomSeed, pl0 + i, ids)) : [];
  const byId = Object.fromEntries(songs.map(x => [x.id, x]));
  const sd = list.map(id => Math.round(((byId[id] && byId[id].duration) || 180) * 1000));
  const songStartAt = now + 1200;            // the song starts under the title card; GO lands a few seconds in
  const playStartAt = now + LEAD_MS;
  const game = createGame({ matchId, settings: s, participants, now, seed: newSeed(), songs: list, sd, pl0, songStartAt, playStartAt });
  return pm.seed ? game : { ...game, $room: { 'meta/slip': { seed: roomSeed, n: pl0 } } };
}

export function prepare() { /* nothing to top up: every phone rides its own rider */ }

export const step = (game, { now, live, online }) => nextStep(game, { now, online, presence: state.presence, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

export const OPTIONS = [
  { key: 'lives', label: 'LIVES', choices: LIVES.map(n => ({ value: n, label: String(n) })) },
];

export const estimateMinutes = s => estimate(s);
