// PULSE module entry (see games/registry.js for the contract).
import { createGame, nextStep, DEFAULT_SETTINGS } from './director.js';
import { pickSongs, standings } from './logic.js';
import { loadManifest, prefetchSong } from './songs.js';
import { lazyView, gameSheets } from '../lazy-view.js';

// The view (renderer, HUD, calibration UI — most of PULSE's code) loads only when a PULSE match is
// on screen, so the app's first paint never pays for it.
export const createView = lazyView(() => import('./view.js'), gameSheets('pulse'));
export { DEFAULT_SETTINGS };

// No menu music during a match: the song is the music (and the victory track plays on the podium).
export const MUSIC = null;

export const livePaths = g => ({ boards: `pulse/${g.matchId}` });

export async function start({ matchId, settings, participants, now }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const manifest = await loadManifest();
  if (!manifest || !manifest.length) return null;
  const seed = `${matchId}:${Math.random().toString(36).slice(2, 10)}`;
  const ids = pickSongs(seed, manifest, s.song, Number(s.count) || 1);
  const songs = ids.map(id => {
    const m = manifest.find(x => x.id === id);
    return { id, title: m.title, artist: m.artist || '', bpm: m.bpm, duration: m.duration };
  });
  return createGame({ matchId, settings: s, participants, now, seed, songs });
}

export function prepare(game) {
  // host: warm the cache for the current song (players fetch their own copy in the load phase)
  const cur = game.songs && game.songs[game.si];
  if (cur) prefetchSong(cur.id).catch(() => {});
}

export const step = (game, { now, live, online }) => nextStep(game, { now, online, boards: live.boards || {} });

const fmtLen = d => `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, '0')}`;
const songOption = { key: 'song', label: 'SONG', type: 'list', choices: [{ value: 'random', label: 'RANDOM', sub: 'Surprise everyone' }] };
// The song list is only needed when the host opens PULSE's options: fetch it once the page has settled.
const whenIdle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 2500));
whenIdle(() => loadManifest().then(m => {
  songOption.choices = [{ value: 'random', label: 'RANDOM', sub: 'Surprise everyone' },
    ...m.map(s => ({ value: s.id, label: s.title, sub: `${Math.round(s.bpm)} BPM · ${fmtLen(s.duration)}` }))];
}).catch(() => {}));

export const OPTIONS = [
  songOption,
  { key: 'diff', label: 'DIFFICULTY · SAME FOR EVERYONE', choices: [{ value: 'easy', label: 'EASY' }, { value: 'normal', label: 'NORMAL' }, { value: 'hard', label: 'HARD' }] },
  { key: 'count', label: 'SONGS', choices: [{ value: 1, label: '1' }, { value: 2, label: '2' }] },
  { key: 'echo', label: 'ECHO BONUS ROUNDS', choices: [{ value: 'on', label: 'ON' }, { value: 'off', label: 'OFF' }] },
];

export function estimateMinutes(s) {
  const n = Number(s.count) || 1;
  return Math.max(3, Math.round(n * (2.9 + (s.echo === 'off' ? 0 : 1.2) + 0.4)));
}

export const finalRanks = game => standings(game).map(r => ({ uid: r.uid, rank: r.rank }));
