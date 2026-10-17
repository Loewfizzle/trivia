// PURE: a room's shuffled music playlist + a match's song schedule, and Call the Winner's bonus.
// Shared by PRISM DROP and SLIPSTREAM (each keeps its own playlist position in the room's meta).
import { rngFrom, shuffle } from './rng.js';

export const XF_MS = 4000;      // crossfade between songs when a match outlasts one
export const CALL_MS = 10_000;  // Call the Winner window after you're knocked out

/**
 * Song for playlist position k (0, 1, 2 … across the whole room session). Each cycle through the songs is
 * its own seeded shuffle, and a cycle never starts with the song the previous one ended on — so no song
 * repeats until every song has played, and never twice in a row.
 */
export function playlistAt(seed, k, ids) {
  if (!ids.length) return null;
  const n = ids.length;
  const order = cycle => {
    const o = shuffle(rngFrom(`${seed}:cycle:${cycle}`), ids.slice().sort());
    if (cycle > 0 && n > 1) {
      const prev = order(cycle - 1);
      if (o[0] === prev[n - 1]) [o[0], o[1]] = [o[1], o[0]];
    }
    return o;
  };
  return order(Math.floor(k / n))[k % n];
}

/** Song start times (server ms) for a match: each next song starts XF_MS before the previous one ends. */
export function songStarts(game) {
  const out = [];
  let t = game.songStartAt;
  for (let i = 0; i < (game.songs || []).length; i++) {
    out.push(t);
    t += (game.sd[i] || 180_000) - XF_MS;
  }
  return out;
}

/** Which song is playing at server time t: { i, start, end } (end = that song's last sample). */
export function songAt(game, t) {
  const starts = songStarts(game);
  let i = 0;
  while (i + 1 < starts.length && t >= starts[i + 1]) i++;
  return { i, start: starts[i], end: starts[i] + (game.sd[i] || 180_000) };
}

/** How many songs a match has used by server time t (advances the room playlist). */
export const songsUsed = (game, t) => songAt(game, t).i + 1;

/** Game-night bonus for a right Call the Winner made with `remaining` players still in (6 left ≈ a 2nd place). */
export const callBonus = remaining => Math.max(0, Math.round((remaining - 1) * 0.4 * 10) / 10);
