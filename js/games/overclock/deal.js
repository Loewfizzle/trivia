// OVERCLOCK — THE ROOM's NIGHT MEMORY (OC1 — docs/overclock.md "No repeats", docs/cartridge.md "THE ROOM-NIGHT PATH"). PURE.
// A group never sees the same item twice in one game night: every bank row / fact / word / puzzle OVERCLOCK deals in a room is remembered at
// rooms/{CODE}/meta/used/overclock/{key} (kit/night.js — written by the host in a step's $room as each challenge goes live) and never dealt
// again that night — across rematches, new games and the challenges of one match. The shared trivia pool keeps its own memory under 'trivia'
// (trivia/feed.js — OVERCLOCK no longer uses it: OC7). No per-player memory, nothing on profiles; the room's close wipes it.
//
// HOW: the HOST deals the WHOLE match at start() — the room's used keys are read ONCE there (start({ used }) — the contract), so every phone
// rebuilds exactly the same challenge from game.deal[ci] (indices into the banks) and the step that opens challenge ci marks game.dk[ci]
// (its keys, space-joined) + the type's own key. A replayed step (host migration) writes the same patch. A pool a night has used up
// RESHUFFLES (the used rows again, in the match's seeded order) rather than stall.
// OC6 — STABLE IDS: the four pools this pass built (TRUE OR FALSE, HIGHER OR LOWER, TIMELINE, SORT IT) deal + remember by each item's STABLE
// id (a Wikidata Q-id, or the id the build script gave a written item — scripts/oc-pools/build.mjs), never an array index: a rebuild that adds,
// drops or reorders rows keeps every deal + the night's memory (an old night's keys simply stop matching). OC7: the last four banks too —
// TRIVIA LIGHTNING (OVERCLOCK's own bank: `tv-<id>`, no live Trivia API any more), CLOSEST CALL `cc-<id>`, MISSING LINK `ml-<id>`, SPELLCHECK
// `sp-<id>` — every dealt item in OVERCLOCK is now an id.
import { rngFrom, shuffle } from '../../core/rng.js';
import { TF_FACT_SLOTS, unscrambleLength, hlPick, hlPairId, tlDeal } from './challenges.js';
import { oddPool, oddKey } from './odd.js';

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

// OC7 — the four content banks deal + remember by STABLE ID too: how many rows one challenge takes + the key of a row
const ROWS = {
  closest: { n: 1, key: r => `cc-${r.id}` },
  missinglink: { n: 2, key: r => `ml-${r.id}` },
  spellcheck: { n: 5, key: r => `sp-${r.id}` },
};
export const tvKey = row => `tv-${row.id}`;
// TRIVIA LIGHTNING's three: an EASY one, a MEDIUM one, then medium or (60%) HARD — the bank's ~40/40/20 mix — three different categories
// where the night allows, each fresh tonight (a used-up difficulty takes the next one, then any; a used-up bank reshuffles)
const TV_STEPS = { easy: ['easy', 'medium', 'hard'], medium: ['medium', 'easy', 'hard'], hard: ['hard', 'medium', 'easy'] };
export function tvPick(rand, bank, taken) {
  const want = ['easy', 'medium', rand() < 0.6 ? 'hard' : 'medium'];
  const deck = shuffle(rand, bank.map((_, i) => i));
  const out = [], cats = new Set();
  for (const d of want) {
    let got = null;
    for (const pass of [0, 1, 2]) {
      for (const dd of TV_STEPS[d]) {
        got = deck.find(i => !out.includes(i) && bank[i].d === dd && (pass > 1 || !taken(i)) && (pass > 0 || !cats.has(bank[i].cat)));
        if (got != null) break;
      }
      if (got != null) break;
    }
    if (got == null) got = deck.find(i => !out.includes(i));
    if (got == null) return null;
    out.push(got);
    cats.add(bank[got].cat);
  }
  return out;
}
// (OC6 — by id: database-safe by construction, ids are [A-Za-z0-9_-] — tests/overclock-content.test.mjs)
export const tfKey = row => `tf-${row.id}`;
export const hlKey = (stat, item) => `hl-${stat.id}-${item[3]}`;
export const tlKey = (theme, item) => `tl-${theme.id}-${item[3]}`;
export const soKey = set => `so-${set.id}`;
export const unKey = word => `un-${word}`;
/** the types whose items the night remembers (the rest are generated fresh every time — math, memory, rewire …) */
export const DEALT = Object.freeze([...Object.keys(ROWS), 'trivia', 'timeline', 'sortit', 'higherlower', 'truefalse', 'unscramble', 'oddone']);

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
 * The whole match's deal. banks: { truefalse, timeline, closest, missinglink, spellcheck, sortit, higherlower } (any may be
 * missing — that challenge then falls back to the seeded per-match deck, as before); words(len) → the Unscramble answers of that length
 * (or null); used: the room's { key: true } for 'overclock' tonight.
 * → { deal: { [ci]: [int | id] }, dk: { [ci]: 'key key …' } } — only for the challenges it could deal (ids for every pool:
 *   truefalse [4 fact ids] · higherlower ["statId|itemId|itemId" × 10] · timeline [theme id, item id × 4] · sortit [set id] ·
 *   trivia [3 question ids] · closest [1 id] · missinglink [2 ids] · spellcheck [5 ids]; ints only for Unscramble + Odd One Out).
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
      put(ci, idx.map(i => bank[i].id), idx.map(i => R.key(bank[i])));
    } else if (type === 'trivia') {
      const b = banks.trivia;
      if (!Array.isArray(b) || b.length < 3) return;
      const idx = tvPick(rand, b, i => seen.has(tvKey(b[i])));
      if (!idx) return;
      put(ci, idx.map(i => b[i].id), idx.map(i => tvKey(b[i])));
    } else if (type === 'higherlower') {
      const b = banks.higherlower;
      if (!Array.isArray(b) || !b.length) return;
      const triples = hlPick(rand, b, (si, i) => seen.has(hlKey(b[si], b[si].items[i])));
      if (triples.some(t => !t)) return;
      const keys = [];
      for (const [si, i, j] of triples) keys.push(hlKey(b[si], b[si].items[i]), hlKey(b[si], b[si].items[j]));
      put(ci, triples.map(t => hlPairId(b, t)), keys);
    } else if (type === 'truefalse') {
      const b = banks.truefalse;
      if (!Array.isArray(b) || b.length < 8) return;
      const idx = pickFresh(rand, b.length, TF_FACT_SLOTS, i => seen.has(tfKey(b[i])));
      put(ci, idx.map(i => b[i].id), idx.map(i => tfKey(b[i])));
    } else if (type === 'timeline') {
      // a theme with four fresh, pairwise-fair items tonight (the themes in the match's seeded order); a used-up night = any fair four
      const b = banks.timeline;
      if (!Array.isArray(b) || !b.length) return;
      const themes = shuffle(rand, b.map((_, i) => i));
      let got = null;
      for (const pass of [0, 1]) for (const ti of themes) {
        if (got) break;
        const t = b[ti];
        const idx = tlDeal(rand, t, i => seen.has(tlKey(t, t.items[i])));
        if (idx && (pass === 1 || idx.every(i => !seen.has(tlKey(t, t.items[i]))))) got = [t, idx];
      }
      if (!got) return;
      const [t, idx] = got;
      put(ci, [t.id, ...idx.map(i => t.items[i][3])], idx.map(i => tlKey(t, t.items[i])));
    } else if (type === 'sortit') {
      const b = banks.sortit;
      if (!Array.isArray(b) || !b.length) return;
      const [i] = pickFresh(rand, b.length, 1, k => seen.has(soKey(b[k])));
      put(ci, [b[i].id], [soKey(b[i])]);
    } else if (type === 'oddone') {
      // OC4 — ODD ONE OUT's FAMILIES: three of the four (a different one per grid), each grid's item fresh tonight (a used-up family reshuffles)
      const fams = shuffle(rand, [0, 1, 2, 3]).slice(0, 3);
      const flat = [], keys = [];
      fams.forEach((fam, g) => {
        const pool = oddPool(fam, level(ci), g);
        const [k] = pickFresh(rand, pool.length, 1, j => seen.has(oddKey(fam, pool[j])));
        flat.push(fam, pool[k]);
        keys.push(oddKey(fam, pool[k]));
      });
      put(ci, flat, keys);
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
