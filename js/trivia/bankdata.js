// Pure helpers for the obfuscated question bank stored at game/bank/{i}.
// (No Firebase imports, so Node tests and the directors can use them.)
import { encodeJSON, decodeJSON } from '../core/obfuscate.js';
import { selectedCategories } from './categories.js';
import { pickFallback, qHash } from './bank.js';

export const bankKey = (code, matchId, i) => `${code}:${matchId}:q${i}`;
export const decodeQuestion = (game, code, i) =>
  game && game.bank && game.bank[i] ? decodeJSON(game.bank[i], bankKey(code, game.matchId, i)) : null;

// Appends items (skipping repeats) and returns the patch for the game node.
// roomSeen: question hashes already used by earlier matches in this room (meta/used/trivia),
// so a rematch never deals the same questions again.
export function appendPatch(game, code, items, roomSeen = {}) {
  const t = game.trivia || {};
  let n = t.n || 0;
  const seen = { ...(t.seen || {}) };
  const patch = {};
  for (const it of items) {
    const h = qHash(it.q);
    if (seen[h] || roomSeen[h]) continue;
    seen[h] = true;
    patch[`bank/${n}`] = encodeJSON(it, bankKey(code, game.matchId, n));
    patch[`trivia/seen/${h}`] = true;
    n++;
  }
  patch['trivia/n'] = n;
  return { patch, n };
}

// Room-level record of the questions a game patch just added (written to meta/used/trivia/{hash}).
export const roomUsedPatch = patch => Object.fromEntries(Object.keys(patch)
  .filter(k => k.startsWith('trivia/seen/'))
  .map(k => [`meta/used/trivia/${k.slice(12)}`, true]));

// Synchronous emergency supply for the director. null if the bank isn't loaded.
// Prefers questions this room hasn't seen; if a long night has used them all up, repeats
// beat stalling the game. The step carries `$room` so the room remembers them.
export function fallbackPatch(game, code, count, roomSeen = {}) {
  const t = game.trivia || {};
  const cats = selectedCategories(t.cats).map(c => c.id);
  const items = pickFallback(count, { cats, seen: { ...roomSeen, ...(t.seen || {}) } });
  if (!items) return null;
  let { patch, n } = appendPatch(game, code, items, roomSeen);
  const added = () => n - (t.n || 0);
  if (added() < count) {
    const seenNow = { ...(t.seen || {}) };
    for (const k of Object.keys(patch)) if (k.startsWith('trivia/seen/')) seenNow[k.slice(12)] = true;
    const more = pickFallback(count - added(), { cats, seen: seenNow }) || [];
    const extra = appendPatch({ ...game, trivia: { ...t, n, seen: seenNow } }, code, more);
    patch = { ...patch, ...extra.patch };
    n = extra.n;
  }
  return { ...patch, $room: roomUsedPatch(patch) };
}

