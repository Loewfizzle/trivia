// Pure helpers for the obfuscated question bank stored at game/bank/{i}.
// (No Firebase imports, so Node tests and the directors can use them.)
import { encodeJSON, decodeJSON } from '../core/obfuscate.js';
import { selectedCategories } from './categories.js';
import { pickFallback, qHash } from './bank.js';

export const bankKey = (code, matchId, i) => `${code}:${matchId}:q${i}`;
export const decodeQuestion = (game, code, i) =>
  game && game.bank && game.bank[i] ? decodeJSON(game.bank[i], bankKey(code, game.matchId, i)) : null;

// Appends items (skipping repeats) and returns the patch for the game node.
export function appendPatch(game, code, items) {
  const t = game.trivia || {};
  let n = t.n || 0;
  const seen = { ...(t.seen || {}) };
  const patch = {};
  for (const it of items) {
    const h = qHash(it.q);
    if (seen[h]) continue;
    seen[h] = true;
    patch[`bank/${n}`] = encodeJSON(it, bankKey(code, game.matchId, n));
    patch[`trivia/seen/${h}`] = true;
    n++;
  }
  patch['trivia/n'] = n;
  return { patch, n };
}

// Synchronous emergency supply for the director. null if the bank isn't loaded.
export function fallbackPatch(game, code, count) {
  const t = game.trivia || {};
  const items = pickFallback(count, { cats: selectedCategories(t.cats).map(c => c.id), seen: t.seen || {} });
  if (!items) return null;
  return appendPatch(game, code, items).patch;
}

