// PRISM DROP module entry (see games/registry.js for the contract).
import { createGame, nextStep, nightBonus as bonus } from './director.js';
import { DEFAULT_SETTINGS, MIN_PLAYERS, LEAD_MS, COUNT_MIN_MS, SONGS_PER_MATCH, playlistAt, standings, estimateMinutes as estimate, cleanSettings } from './logic.js';
import { loadManifest, loadSong, goBeat } from './songs.js';
import { state } from '../../store.js';
import { lazyView, gameSheets } from '../lazy-view.js';

export const createView = lazyView(() => import('./view.js'), gameSheets('prism'));
// the match plays its own songs (synced to the server clock, through a filter for the danger/duel effects)
export const MUSIC = null;
export { DEFAULT_SETTINGS, MIN_PLAYERS };

export const livePaths = g => ({ boards: `prism/${g.matchId}`, calls: `prismcall/${g.matchId}` });

function newSeed() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(36)).join('');
}

export async function start({ matchId, settings, participants, now }) {
  const s = cleanSettings(settings);
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

export const step = (game, { now, live, online }) => nextStep(game, { now, online, presence: state.presence, live });

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
export const nightBonus = bonus;

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'battle', label: 'BATTLE', sub: 'Clear lines to send junk — last one standing wins' },
    { value: 'rush', label: 'SCORE RUSH', sub: 'No attacks — one song, highest score wins' },
  ] },
];

export const estimateMinutes = s => estimate(s);
