// PURE: the lobby's song handoff (audio/lobby-music.js, docs/audio.md → MOOD MUSIC in a lobby).
// A new room's queue starts with the song the host is already hearing (seedQueue); a phone already on the room's current song
// at the right place keeps playing it (rideDecision) and the synced player takes over from the next song.
import { songStarts } from './playlist.js';

export const RIDE_TOLERANCE_S = 2.5;   // this phone's song is "the room's song" within this many seconds
export const JOIN_FADE_S = 1.8;        // crossfade into the room's song when this phone was on another one

/** Is this phone already on the room's current song, at the right place? np: { id, at (s) } or null (music.js#nowPlaying);
 *  lm: the room's queue { t0, songs, sd }; now: server ms. Returns { cur (song index now), expected (s into it), riding }. */
export function rideDecision(np, lm, now) {
  if (!lm || !lm.songs || !lm.songs.length || !lm.t0) return { cur: -1, expected: 0, riding: false };
  const starts = songStarts({ songStartAt: lm.t0, songs: lm.songs, sd: lm.sd });
  let cur = 0;
  while (cur + 1 < starts.length && now >= starts[cur + 1]) cur++;
  const expected = (now - starts[cur]) / 1000;
  const riding = !!(np && np.id === lm.songs[cur] && Math.abs(np.at - expected) <= RIDE_TOLERANCE_S && now < starts[cur] + (lm.sd[cur] || 0));
  return { cur, expected, riding };
}

/** A new room's queue starting with the song this phone plays, at its place (null: nothing to carry over, or too close to its
 *  end — the room then picks a song as before). np: { id, at, dur } (s); dur(id) → seconds (the song list) as a fallback. */
export function seedQueue(np, now, mood, dur = () => 0) {
  if (!np || !np.id) return null;
  const sd = Math.round((np.dur > 0 ? np.dur : dur(np.id)) * 1000);
  if (!(sd > 0) || np.at * 1000 >= sd - 5000) return null;
  return { m: `lm${Math.round(now)}`, t0: Math.round(now - np.at * 1000), songs: [np.id], sd: [sd], bag: { mood, left: [] } };
}
