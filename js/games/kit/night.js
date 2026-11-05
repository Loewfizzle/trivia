// THE ROOM-NIGHT PATH (SHELL 2.0 B1 — THE CONTRACT; the Overclock chat's ask a, Nov 5): a game's memory of THE NIGHT — what this room has
// already seen tonight (questions, words, puzzles…) so a rematch or the next game never deals it again. THE contract path is
// rooms/{CODE}/meta/used/{gameId}/{key}: true — written by the HOST only, through a director step's `$room` side writes (host.js strips
// them into the same atomic room update); it SURVIVES rematches + new games and is GONE when the room closes (the room is deleted).
// A GAME-SCOPED key: each game writes only under its own id (the shared trivia pool is 'trivia' — OVERCLOCK + the trivia games).
// The rules (database.rules.json rooms/$code/meta/used/$game/$id): a boolean, the host's meta write — no new rule.
//   usedOf(meta, gameId) → { key: true }          markUsed(gameId, keys) → { 'meta/used/<gameId>/<key>': true }  (a step's $room)
//   cleanKey(s) → a database-safe key (no . # $ [ ] /, ≤ 120 chars)
export const cleanKey = s => String(s).replace(/[.#$[\]/]/g, '_').slice(0, 120) || '_';
export const usedOf = (meta, gameId) => (meta && meta.used && meta.used[gameId]) || {};
export function markUsed(gameId, keys) {
  const out = {};
  for (const k of keys || []) out[`meta/used/${cleanKey(gameId)}/${cleanKey(k)}`] = true;
  return out;
}
