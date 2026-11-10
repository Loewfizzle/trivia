// HOLD'EM — THE HAND RANKER (HE1, pure). The best five of up to seven cards, as ONE comparable number,
// plus the plain labels the table shows ("TWO PAIR · KINGS AND NINES").
//
// THE SCORE: category * 2^20 + up to five rank nibbles (rank + 1, 1..13; 0 = no card), most important first.
// A bigger score always wins; an EQUAL score is an exact tie (a split pot). The categories:
//   0 HIGH CARD · 1 PAIR · 2 TWO PAIR · 3 THREE OF A KIND · 4 STRAIGHT · 5 FLUSH · 6 FULL HOUSE · 7 FOUR OF A KIND
//   8 STRAIGHT FLUSH (a royal flush = the ace-high straight flush). The wheel A-2-3-4-5 is a straight FIVE high.
import { cardInt, intCard } from './cards.js';

export const CATEGORIES = ['HIGH CARD', 'PAIR', 'TWO PAIR', 'THREE OF A KIND', 'STRAIGHT', 'FLUSH', 'FULL HOUSE', 'FOUR OF A KIND', 'STRAIGHT FLUSH'];
export const CAT = { high: 0, pair: 1, twopair: 2, trips: 3, straight: 4, flush: 5, fullhouse: 6, quads: 7, straightflush: 8 };

const ONE = ['TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'JACK', 'QUEEN', 'KING', 'ACE'];
const MANY = ['TWOS', 'THREES', 'FOURS', 'FIVES', 'SIXES', 'SEVENS', 'EIGHTS', 'NINES', 'TENS', 'JACKS', 'QUEENS', 'KINGS', 'ACES'];

// 13-bit rank masks → the straight's top rank (3 = the wheel's five … 12 = ace high), or -1. And the bit counts.
const STRAIGHT = new Int8Array(8192).fill(-1);
const POP = new Uint8Array(8192);
for (let m = 0; m < 8192; m++) {
  let c = 0;
  for (let b = 0; b < 13; b++) if (m & (1 << b)) c++;
  POP[m] = c;
  for (let top = 12; top >= 4; top--) if (((m >> (top - 4)) & 31) === 31) { STRAIGHT[m] = top; break; }
  if (STRAIGHT[m] < 0 && (m & 0x100f) === 0x100f) STRAIGHT[m] = 3; // A-2-3-4-5
}

const pack = (cat, a = -1, b = -1, c = -1, d = -1, e = -1) =>
  cat * 1048576 + (a + 1) * 65536 + (b + 1) * 4096 + (c + 1) * 256 + (d + 1) * 16 + (e + 1);

// Scratch (the ranker is synchronous — reused so the 2.6 M-hand proof allocates nothing per hand).
const counts = new Uint8Array(13);
const suitMask = new Uint16Array(4);

/** The fast path: an array of card INTS (rank * 4 + suit), its first n (1..7) → the score. */
export function scoreInts(cards, n = cards.length) {
  counts.fill(0); suitMask[0] = suitMask[1] = suitMask[2] = suitMask[3] = 0;
  let mask = 0;
  for (let i = 0; i < n; i++) {
    const c = cards[i], r = c >> 2;
    counts[r]++; suitMask[c & 3] |= 1 << r; mask |= 1 << r;
  }
  let flush = -1;
  for (let s = 0; s < 4; s++) if (POP[suitMask[s]] >= 5) flush = s;
  if (flush >= 0) {
    const sf = STRAIGHT[suitMask[flush]];
    if (sf >= 0) return pack(8, sf);
  }
  let quad = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) {
    const k = counts[r];
    if (k === 4) quad = r;
    else if (k === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; }
    else if (k === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; }
  }
  if (quad >= 0) return pack(7, quad, topRanks(mask & ~(1 << quad), 1)[0]);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return pack(6, t1, Math.max(t2, p1));
  if (flush >= 0) { const f = topRanks(suitMask[flush], 5); return pack(5, f[0], f[1], f[2], f[3], f[4]); }
  const st = STRAIGHT[mask];
  if (st >= 0) return pack(4, st);
  if (t1 >= 0) { const k = topRanks(mask & ~(1 << t1), 2); return pack(3, t1, k[0], k[1]); }
  if (p2 >= 0) return pack(2, p1, p2, topRanks(mask & ~(1 << p1) & ~(1 << p2), 1)[0]);
  if (p1 >= 0) { const k = topRanks(mask & ~(1 << p1), 3); return pack(1, p1, k[0], k[1], k[2]); }
  const h = topRanks(mask, 5);
  return pack(0, h[0], h[1], h[2], h[3], h[4]);
}

const tops = [-1, -1, -1, -1, -1];
function topRanks(mask, n) {
  let k = 0;
  for (let r = 12; r >= 0 && k < n; r--) if (mask & (1 << r)) tops[k++] = r;
  for (let i = k; i < 5; i++) tops[i] = -1;
  return tops;
}

/** The score's parts: { cat, ranks: [rank indexes 0..12, most important first] }. */
export function decode(score) {
  const cat = Math.floor(score / 1048576);
  const ranks = [];
  for (let sh = 16; sh >= 0; sh -= 4) { const v = (score >> sh) & 15; if (v) ranks.push(v - 1); }
  return { cat, ranks };
}

/** Codes ("As", "Kd" …, 1–7 cards) → { score, cat, name, ranks, label, short }. */
export function evaluate(codes) {
  const score = scoreInts(codes.map(cardInt));
  const { cat, ranks } = decode(score);
  return { score, cat, name: CATEGORIES[cat], ranks, label: labelOf(cat, ranks), short: labelOf(cat, ranks, true) };
}

/** Compare two hands of codes: > 0 when a wins, < 0 when b wins, 0 = an exact tie. */
export const compareHands = (a, b) => scoreInts(a.map(cardInt)) - scoreInts(b.map(cardInt));

/**
 * The best five cards (for the screen to light): the first 5-card subset whose score equals the whole hand's.
 * 5–7 codes in, 5 codes out (in the order given).
 */
export function bestFive(codes) {
  const ints = codes.map(cardInt), n = ints.length;
  if (n <= 5) return codes.slice();
  const want = scoreInts(ints), pick = [0, 0, 0, 0, 0];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++)
    for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
      pick[0] = ints[a]; pick[1] = ints[b]; pick[2] = ints[c]; pick[3] = ints[d]; pick[4] = ints[e];
      if (scoreInts(pick, 5) === want) return pick.map(intCard);
    }
  return codes.slice(0, 5);
}

/**
 * THE PLAIN LABELS. Full: "HIGH CARD · ACE", "PAIR OF KINGS", "TWO PAIR · KINGS AND NINES", "THREE NINES",
 * "STRAIGHT · TEN HIGH", "FLUSH · ACE HIGH", "FULL HOUSE · KINGS OVER NINES", "FOUR ACES", "STRAIGHT FLUSH",
 * "ROYAL FLUSH". Short (the small label under your cards) drops the second half where there is one:
 * "TWO PAIR · KINGS", "FULL HOUSE · KINGS"; the rest read the same.
 */
export function labelOf(cat, ranks, short = false) {
  const [a, b] = ranks;
  switch (cat) {
    case 0: return `HIGH CARD · ${ONE[a]}`;
    case 1: return `PAIR OF ${MANY[a]}`;
    case 2: return short ? `TWO PAIR · ${MANY[a]}` : `TWO PAIR · ${MANY[a]} AND ${MANY[b]}`;
    case 3: return `THREE ${MANY[a]}`;
    case 4: return `STRAIGHT · ${ONE[a]} HIGH`;
    case 5: return `FLUSH · ${ONE[a]} HIGH`;
    case 6: return short ? `FULL HOUSE · ${MANY[a]}` : `FULL HOUSE · ${MANY[a]} OVER ${MANY[b]}`;
    case 7: return `FOUR ${MANY[a]}`;
    case 8: return a === 12 ? 'ROYAL FLUSH' : 'STRAIGHT FLUSH';
    default: return '';
  }
}

/** Two hole cards before the flop: "PAIR OF QUEENS" or "ACE KING" (the higher first). */
export function holeLabel(cards) {
  const [x, y] = cards.map(c => cardInt(c) >> 2).sort((p, q) => q - p);
  return x === y ? `PAIR OF ${MANY[x]}` : `${ONE[x]} ${ONE[y]}`;
}

/** The label for what you hold now: 2 cards → holeLabel, 3+ (with the board) → evaluate's label. */
export function handLabel(cards, short = false) {
  if (!cards?.length) return '';
  if (cards.length === 2) return holeLabel(cards);
  const e = evaluate(cards);
  return short ? e.short : e.label;
}
