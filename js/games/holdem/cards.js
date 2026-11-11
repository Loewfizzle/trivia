// HOLD'EM — the cards (HE1, pure: no DOM, no database, no clock, no Math.random).
// A card is a short string: rank + suit — "As" (ace of spades), "Td" (ten of diamonds), "2c".
// Internally (the ranker's fast path) a card is an int: rank * 4 + suit, rank 0..12 = 2..A, suit 0..3 = s h d c.

export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';

/** The 52 codes in a fixed order (2s 2h 2d 2c 3s … Ac). */
export function newDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
}

/**
 * A shuffled deck: Fisher–Yates on the INJECTED rng (a function → [0, 1)). The engine never makes its own
 * randomness — the server (HE2) passes its seeded RNG, the tests pass core/rng.js#rngFrom(seed).
 */
export function shuffleDeck(rng) {
  if (typeof rng !== 'function') throw new Error('shuffleDeck needs an rng function');
  const d = newDeck();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = d[i]; d[i] = d[j]; d[j] = t;
  }
  return d;
}

export const isCard = c => typeof c === 'string' && c.length === 2 && RANKS.includes(c[0]) && SUITS.includes(c[1]);

/** "As" → 50 (rank 12 * 4 + suit 0). Throws on a bad code. */
export function cardInt(code) {
  const r = RANKS.indexOf(code?.[0]), s = SUITS.indexOf(code?.[1]);
  if (r < 0 || s < 0 || code.length !== 2) throw new Error(`not a card: ${code}`);
  return r * 4 + s;
}

export const intCard = n => RANKS[n >> 2] + SUITS[n & 3];
export const rankOf = code => RANKS.indexOf(code[0]);
