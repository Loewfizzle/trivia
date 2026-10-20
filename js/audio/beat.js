// THE BEAT (PARTY NIGHTS, docs/title.md): which song is sounding on this phone right now, its tempo and position — the city
// breathes to it. In a lobby that's the room's synced song (every phone the same); on the title this phone's mood song.
// null when nothing can be followed (before the first tap, music off or muted, CLASSIC menu music, a song still loading):
// the city then breathes slowly on its own (core/party.js#advanceBeat).
import { nowPlaying } from './music.js';
import { lobbyNow } from './lobby-music.js';
import { moodData } from './mood.js';
import { settings } from './settings.js';

export function beatSource() {
  if (settings.musicOff || settings.muted) return null;
  const np = lobbyNow() || nowPlaying();
  if (!np || !np.id) return null;
  const d = moodData();
  const song = d && d.songs && d.songs[np.id];
  if (!song || !(song.bpm > 0)) return null;
  return { id: np.id, bpm: song.bpm, pos: np.at };
}
