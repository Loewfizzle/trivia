// OVERCLOCK — THE ROOM's NIGHT MEMORY (OC1 — docs/overclock.md "No repeats", docs/cartridge.md "THE ROOM-NIGHT PATH"). PURE.
// A group never sees the same item twice in one game night: every bank row / fact / word / puzzle OVERCLOCK deals in a room is remembered at
// rooms/{CODE}/meta/used/overclock/{key} (kit/night.js — written by the host in a step's $room as each challenge goes live) and never dealt
// again that night — across rematches, new games and the challenges of one match. The shared trivia pool keeps its own memory under 'trivia'
// (trivia/feed.js). No per-player memory, nothing on profiles; the room's close wipes it.
//
// HOW: the HOST deals the WHOLE match at start() — the room's used keys are read ONCE there (start({ used }) — the contract), so every phone
// rebuilds exactly the same challenge from game.deal[ci] (indices into the banks) and the step that opens challenge ci marks game.dk[ci]
// (its keys, space-joined) + the type's own key. A replayed step (host migration) writes the same patch. A pool a night has used up
// RESHUFFLES (the used rows again, in the match's seeded order) rather than stall.
// Keys come from the item's TEXT (a short hash), not its index, so a bank that grows (OC6 / OC7) keeps the night's memory.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TF_FACTS, TF_FACT_SLOTS, unscrambleLength, hlPick } from './challenges.js';

/** FNV-1a (32-bit) → base 36: a short, stable, database-safe key for an item's text */
export function hash36(text) {
  let x = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(36);
}
export const TYPE_KEY = 't-';
export const typeKey = type => `${TYPE_KEY}${type}`;
/** the types this room has played tonight (from usedOf(meta, 'overclock')) */
export const playedTypes = used => Object.keys(used || {}).filter(k => k.startsWith(TYPE_KEY)).map(k => k.slice(TYPE_KEY.length));

// per dealt type: how many rows one challenge takes + the key of a row
const ROWS = {
  timeline: { n: 1, key: r => `tl-${hash36(r[3].map(x => x[0]).join('|'))}` },
  closest: { n: 1, key: r => `cc-${hash36(r[1])}` },
  missinglink: { n: 2, key: r => `ml-${hash36(r.slice(0, 4).join('|'))}` },
  spellcheck: { n: 5, key: r => `sp-${hash36(r[0])}` },
  sortit: { n: 1, key: r => `so-${hash36(`${r[0]}|${r[1]}`)}` },
};
export const tfKey = pair => `tf-${hash36(pair[0])}`;
export const m24Key = row => `m24-${row[0]}`;
export const hlKey = (stat, item) => `hl-${hash36(`${stat[0]}|${item[0]}`)}`;
export const unKey = word => `un-${word}`;
/** the types whose items the night remembers (the rest are generated fresh every time — math, memory, rewire …) */
export const DEALT = Object.freeze([...Object.keys(ROWS), 'make24', 'higherlower', 'truefalse', 'unscramble']);

/**
 * n distinct indices of 0..size-1 in the seeded order — the fresh ones first (not in `taken`), then (a used-up pool) the rest.
 * taken(i) → bool. Never fewer than min(n, size).
 */
export function pickFresh(rand, size, n, taken) {
  const deck = shuffle(rand, Array.from({ length: size }, (_, i) => i));
  const fresh = deck.filter(i => !taken(i));
  const out = fresh.slice(0, n);
  for (const i of deck) { if (out.length >= Math.min(n, size)) break; if (!out.includes(i)) out.push(i); }
  return out;
}

/**
 * The whole match's deal. banks: { timeline, closest, missinglink, spellcheck, sortit, make24: { easy, hard }, higherlower } (any may be
 * missing — that challenge then falls back to the seeded per-match deck, as before); words(len) → the Unscramble answers of that length
 * (or null); used: the room's { key: true } for 'overclock' tonight.
 * → { deal: { [ci]: [int] }, dk: { [ci]: 'key key …' } } — only for the challenges it could deal.
 */
export function dealMatch({ seed, order, total, banks = {}, words = () => null, used = {} }) {
  const rand = rngFrom(`${seed}:deal`);
  const seen = new Set(Object.keys(used || {}).filter(k => used[k]));
  const deal = {}, dk = {};
  const level = ci => (total <= 1 ? 0 : ci / (total - 1));
  const put = (ci, idx, keys) => { deal[ci] = idx; dk[ci] = keys.join(' '); keys.forEach(k => seen.add(k)); };
  order.forEach((type, ci) => {
    const R = ROWS[type];
    if (R) {
      const bank = banks[type];
      if (!Array.isArray(bank) || !bank.length) return;
      const idx = pickFresh(rand, bank.length, R.n, i => seen.has(R.key(bank[i])));
      if (idx.length < R.n) return;
      put(ci, idx, idx.map(i => R.key(bank[i])));
    } else if (type === 'make24') {
      const b = banks.make24;
      if (!b || !Array.isArray(b.easy) || !Array.isArray(b.hard) || !b.easy.length || !b.hard.length) return;
      const e = pickFresh(rand, b.easy.length, 1, i => seen.has(m24Key(b.easy[i])))[0];
      const keysE = m24Key(b.easy[e]);
      const hd = pickFresh(rand, b.hard.length, 1, i => seen.has(m24Key(b.hard[i])) || m24Key(b.hard[i]) === keysE)[0];
      put(ci, [e, hd], [keysE, m24Key(b.hard[hd])]);
    } else if (type === 'higherlower') {
      const b = banks.higherlower;
      if (!Array.isArray(b) || !b.length) return;
      const triples = hlPick(rand, b, (si, i) => seen.has(hlKey(b[si], b[si][4][i])));
      if (triples.some(t => !t)) return;
      const keys = [];
      for (const [si, i, j] of triples) keys.push(hlKey(b[si], b[si][4][i]), hlKey(b[si], b[si][4][j]));
      put(ci, triples.flat(), keys);
    } else if (type === 'truefalse') {
      const idx = pickFresh(rand, TF_FACTS.length, TF_FACT_SLOTS, i => seen.has(tfKey(TF_FACTS[i])));
      put(ci, idx, idx.map(i => tfKey(TF_FACTS[i])));
    } else if (type === 'unscramble') {
      const list = words(unscrambleLength(level(ci)));
      if (!Array.isArray(list) || !list.length) return;
      const idx = pickFresh(rand, list.length, 1, i => seen.has(unKey(list[i])));
      put(ci, idx, [unKey(list[idx[0]])]);
    }
  });
  return { deal, dk };
}

/** the keys the step that OPENS challenge ci marks used (kit/night.js#markUsed('overclock', …)): its type + its dealt items */
export function keysAt(game, ci) {
  const type = game.order && game.order[ci];
  if (!type) return [];
  const dk = game.dk && game.dk[ci];
  return [typeKey(type), ...(typeof dk === 'string' && dk ? dk.split(' ') : [])];
}
