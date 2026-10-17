// SLIPSTREAM — match rules (PURE): settings, the time limits, placement, results, and the shared playlist.
export { playlistAt, songStarts, songAt, songsUsed, XF_MS, CALL_MS, callBonus } from '../../core/playlist.js';

export const DEFAULT_SETTINGS = { lives: 2 };
export const LIVES = [1, 2, 3];
export const MIN_PLAYERS = 2;
export const LEAD_MS = 5200;          // match created -> GO (title card, the course builds, everyone lines up)
export const OFFLINE_OUT_MS = 30_000; // gone this long mid-ride = out
export const END_MS = 4500;           // the last crash -> results
export const TIME_LIMIT_S = 540;      // a hard stop at 9:00: the farthest rider still riding wins
export const SAME_MOMENT_MS = 600;    // riders who go out this close together are ranked by distance
export const SONGS_PER_MATCH = 4;

export function cleanSettings(s = {}) {
  return { lives: LIVES.includes(Number(s.lives)) ? Number(s.lives) : DEFAULT_SETTINGS.lives };
}

export const aliveOf = game => Object.keys(game.participants || {}).filter(u => !(game.out && game.out[u]));

/**
 * Orders a batch of riders going out (sorted by time). Riders who go out within SAME_MOMENT_MS of each other
 * count as the same moment: the one who got farther places better (goes out "last").
 * Returns the batch in the order they should be counted out (worst first).
 */
export function outOrder(batch) {
  const b = batch.slice().sort((a, c) => a.at - c.at || (a.uid < c.uid ? -1 : 1));
  const groups = [];
  for (const f of b) {
    const g = groups.at(-1);
    if (g && f.at - g[0].at <= SAME_MOMENT_MS) g.push(f); else groups.push([f]);
  }
  return groups.flatMap(g => g.sort((a, c) => a.d - c.d || (a.uid < c.uid ? -1 : 1)));
}

/** Standings: place (1 = winner), then distance. [{ uid, rank, score (metres), place }] */
export function standings(game) {
  const out = game.out || {};
  const res = game.results || {};
  return Object.keys(game.participants || {}).map(uid => ({
    uid, place: out[uid] ? out[uid].place : 1, score: Math.round((res[uid] && res[uid].d) || (out[uid] && out[uid].d) || 0),
  })).sort((a, b) => a.place - b.place || b.score - a.score || (a.uid < b.uid ? -1 : 1))
    .map(r => ({ ...r, rank: r.place }));
}

export const estimateMinutes = s => 2 + cleanSettings(s).lives;

export const fmtDist = m => (m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 1 : 2)} km` : `${Math.round(m)} m`);
