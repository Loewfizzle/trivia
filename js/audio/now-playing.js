// FR7 FIXES C — THE LEDGER's NOW PLAYING (the owner, Nov 13: "the song this phone is playing — the file names are fine, no titles yet"): what THIS
// phone is sounding right now, read from the audio engine's OWN state (no poll, no /api call) — the city's station / the party deck (the synced
// player on the server clock: audio/party-music.js), a room's lobby song (meta/lm — audio/lobby-music.js), else the plain player (a game's music,
// the menu playlist, a mood song: audio/music.js). → { off: true } (MUSIC OFF) | { source, file, left (s | null) } | { idle: true }
import { settings } from './settings.js';
import { musicDebug, musicFileOf, nowPlaying } from './music.js';
import { partyMusicDebug } from './party-music.js';
import { lobbyMusicDebug, lobbyNow } from './lobby-music.js';
import { musicUrl } from './music-url.js';

const base = u => String(u || '').split('?')[0].split('/').pop() || null;
const MOOD = { late: 'LATE NIGHT', morning: 'MORNING', day: 'DAY', evening: 'EVENING', party: 'PARTY' };

export function nowPlayingNow() {
  if (settings.musicOff || settings.muted || !(settings.music > 0)) return { off: true };
  // a room's lobby song (the host's clock) wins while it sounds
  try {
    const l = lobbyNow();
    if (l && l.id) { const d = lobbyMusicDebug() || {}, dur = Number(d.dur) || 0; return { source: 'THE ROOM’S SONG', file: base(musicUrl(l.id)), left: dur ? Math.max(0, dur - l.at) : null }; }
  } catch { /* fine */ }
  // the city's station / the party deck — every phone the same song on the server clock
  try {
    const p = partyMusicDebug();
    if (p && p.song && (p.synced || p.riding)) {
      const src = p.kind === 'station' ? `STATION · ${MOOD[p.station] || String(p.station || '').toUpperCase()}` : p.kind === 'dance' ? 'THE DANCE BREAK' : 'THE PARTY DECK';
      return { source: src, file: base(musicUrl(p.song)), left: p.left != null ? Math.max(0, p.left) : null };
    }
  } catch { /* fine */ }
  // the plain player (a mood song, the menu playlist, a game's music)
  try {
    const m = musicDebug(), np = nowPlaying();
    if (m && m.playing && m.health && m.health.sounding) {
      const id = String(m.playing), dur = Number(m.dur) || 0, at = np ? np.at : Number(m.at) || 0;
      return { source: id.startsWith('m:') ? 'MOOD MUSIC' : m.list ? String(m.list).toUpperCase() : 'MUSIC', file: base(musicFileOf(id)), left: dur ? Math.max(0, dur - at) : null };
    }
  } catch { /* fine */ }
  return { idle: true };
}

/** m:ss */
export const mss = s => { const t = Math.max(0, Math.round(s || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
/** the one line THE LEDGER shows: NOW PLAYING · <source> · <file> · m:ss left  |  MUSIC OFF  |  NOTHING SOUNDING */
export function nowPlayingText(n = nowPlayingNow()) {
  if (n.off) return 'NOW PLAYING · MUSIC OFF';
  if (n.idle) return 'NOW PLAYING · nothing sounding yet (tap the city to start the music)';
  return `NOW PLAYING · ${n.source} · ${n.file || '?'}${n.left != null ? ` · ${mss(n.left)} left` : ''}`;
}
