// OVERCLOCK — deterministic challenge generators. Every client builds the exact
// same challenge from (seed, challenge index, level), so nothing but the seed and
// the challenge order needs to be stored in the room.
import { rngFrom, randInt, pick, shuffle } from '../../core/rng.js';
import { ODD_SIZES, oddFamilies, oddPool, oddGrid, oddCatalogSize } from './odd.js';
import { LUCK, HORSES, dlField, payout } from './luck.js';
import { showUS, yearText } from './units.js';

export const TYPES = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia', 'stroop', 'reflex', 'count', 'truefalse', 'timeline', 'closest', 'rewire',
  'missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower', 'dumbluck'];
// OC5 — DUMB LUCK (luck.js): a game of chance — at most once a match, never the last challenge, never in SOLO or the daily (logic.js#buildOrder)
export const SKILL_TYPES = Object.freeze(TYPES.filter(t => t !== LUCK));

// What kind of brain each challenge works — the match order spreads these out (logic.js#buildOrder).
export const CATEGORY = {
  unscramble: 'words', missinglink: 'words', spellcheck: 'words',
  math: 'numbers', pattern: 'numbers', rewire: 'numbers',
  memory: 'memory', compass: 'memory',
  oddone: 'visual', count: 'visual',
  trivia: 'knowledge', truefalse: 'knowledge', timeline: 'knowledge', closest: 'knowledge', higherlower: 'knowledge',
  stroop: 'reflex', reflex: 'reflex', sortit: 'reflex',
  dumbluck: 'luck',
};

export const INFO = {
  unscramble: { name: 'UNSCRAMBLE', glyph: '⇄', rules: ['Rebuild the scrambled word.', 'Tap letters in order. Wrong guesses only cost time.'] },
  memory: { name: 'MEMORY SEQUENCE', glyph: '◉', rules: ['Watch the nodes light up.', 'Repeat the sequence. One mistake ends your run.'] },
  oddone: { name: 'ODD ONE OUT', glyph: '◇', rules: ['Three grids of near-identical symbols.', 'Tap the one that is different.'] },
  math: { name: 'QUICK MATH', glyph: '±', rules: ['Four rapid calculations.', 'Normal order of operations. Type the answer.'] },
  pattern: { name: 'PATTERN LOCK', glyph: '∴', rules: ['Two number sequences.', 'Enter the next number in each.'] },
  trivia: { name: 'TRIVIA LIGHTNING', glyph: 'ϟ', rules: ['Three rapid-fire questions.', 'One shot each. Speed matters.'] },
  stroop: { name: 'COLOR CLASH', glyph: '◐', rules: ['A color word, shown in a different color.', 'Tap the COLOR OF THE TEXT — not what the word says.'] },
  reflex: { name: 'SIGNAL LOCK', glyph: '◎', rules: ['Wait for the screen to flash.', 'Then tap as fast as you can. Too early counts as a miss.'] },
  count: { name: 'QUICK COUNT', glyph: '#', rules: ['Shapes flash for a moment, then vanish.', 'Count the one we ask for. Off by one earns half.'] },
  truefalse: { name: 'TRUE OR FALSE', glyph: '✓', rules: ['Rapid-fire statements: math and facts.', 'True or false? Wrong answers cost points.'] },
  timeline: { name: 'TIMELINE', glyph: '↧', rules: ['Four items. Tap them in order, 1 to 4 — tap again to undo.', 'Points for every item in the right place. Submit when you’re sure.'] },
  closest: { name: 'CLOSEST CALL', glyph: '≈', rules: ['One question, one number. Type your best estimate.', 'The closer you are, the more you score. Closest in the room gets the bonus.'] },
  rewire: { name: 'REWIRE', glyph: '↯', rules: ['Tap tiles to rotate them and route power to the core.', 'Two circuits: a 3×3 warm-up, then a 4×4.'] },
  missinglink: { name: 'MISSING LINK', glyph: '⊸', rules: ['Three words share one hidden word, before or after each.', 'COTTAGE · SWISS · CAKE → CHEESE. Two puzzles — guess as often as you like.'] },
  spellcheck: { name: 'SPELLCHECK', glyph: '✎', rules: ['Four spellings. Exactly one is right.', 'Five words, one tap each — no second chances.'] },
  compass: { name: 'COMPASS', glyph: '✣', rules: ['Note where you face, then follow the turns in your head.', 'When they vanish, tap the way you face now. Five rounds, each longer.'] },
  sortit: { name: 'SORT IT', glyph: '⇆', rules: ['Swipe each card left or right — or tap that side of the screen.', 'Wrong sorts cost a little. The cards come faster and faster.'] },
  higherlower: { name: 'HIGHER OR LOWER', glyph: '⇅', rules: ['Two things, one stat — one number shown. Is the hidden one HIGHER or LOWER?', 'Build a streak of 10. One wrong answer ends your run.'] },
  dumbluck: { name: 'DUMB LUCK', glyph: '♞', rules: ['Six horses, six odds. Pick one before the gate closes.', 'Back the winner and get paid — the longer the odds, the bigger the payout.'] },
};

export const memoryLength = level => 4 + Math.round(level * 4);

// How many scorable parts a challenge has (host needs this without building it).
export function partsFor(type, level) {
  return { unscramble: 1, memory: memoryLength(level), oddone: 3, math: 4, pattern: 2, trivia: 3, stroop: 8, reflex: 5, count: 4, truefalse: 8,
    timeline: 4, closest: 1, rewire: 2,
    missinglink: 2, spellcheck: 5, compass: 5, sortit: SORT_CARDS, higherlower: HL_PAIRS, dumbluck: 1 }[type] || 1;
}

export const challengeRng = (seed, ci, type) => rngFrom(`${seed}:${ci}:${type}`);

// ---------- unscramble ----------
export function unscrambleLength(level) {
  return level < 0.34 ? 5 : level < 0.67 ? 6 : 7;
}
export function genUnscramble(rand, level, answersFor, deal) {
  const len = unscrambleLength(level);
  const words = answersFor(len);
  if (!words || !words.length) return null;
  const drawn = pick(rand, words);
  const word = dealt(deal, 0, words.length) ? words[deal[0]] : drawn;
  let letters = shuffle(rand, [...word]);
  for (let i = 0; i < 8 && letters.join('') === word; i++) letters = shuffle(rand, [...word]);
  return { type: 'unscramble', parts: 1, word, letters };
}

// ---------- memory ----------
export function genMemory(rand, level) {
  const n = memoryLength(level);
  const seq = [];
  while (seq.length < n) {
    const v = randInt(rand, 0, 8);
    if (v !== seq[seq.length - 1]) seq.push(v);
  }
  return { type: 'memory', parts: n, seq, stepMs: Math.round(620 - level * 180) };
}

// ---------- odd one out ----------
// OC4 — FOUR FAMILIES (odd.js): letters / numbers · rotation · mirror · neon shapes; each of the three grids (4×4 · 5×5 · 6×6) from a DIFFERENT
// one. deal = THE ROOM's NIGHT MEMORY (deal.js): [fam, item, fam, item, fam, item] — absent (or stale) = the challenge's own seeded draw. The
// seeded stream is spent the same way with or without a deal (the cells + angles never depend on whether the night dealt it).
const oddDealt = (deal, g) => Array.isArray(deal) && deal.length === 6 && Number.isInteger(deal[g * 2]) && deal[g * 2] >= 0 && deal[g * 2] < 4
  && Number.isInteger(deal[g * 2 + 1]) && deal[g * 2 + 1] >= 0 && deal[g * 2 + 1] < oddCatalogSize(deal[g * 2]);
export function genOddOne(rand, level, deal = null) {
  const fams = oddFamilies(rand);
  const ok = [0, 1, 2].every(g => oddDealt(deal, g)) && new Set([deal[0], deal[2], deal[4]]).size === 3;
  const grids = ODD_SIZES.map((size, g) => {
    const drawn = pick(rand, oddPool(fams[g], level, g));
    return ok ? oddGrid(rand, deal[g * 2], deal[g * 2 + 1], size, level, g) : oddGrid(rand, fams[g], drawn, size, level, g);
  });
  return { type: 'oddone', parts: 3, grids };
}

// ---------- quick math ----------
const MATH_FORMS = {
  mulSub: (r, d) => { const a = randInt(r, 12, 19 + Math.round(20 * d)); const b = randInt(r, 3, 9); const c = randInt(r, 10, Math.min(60, a * b - 5)); return { text: `${a} × ${b} − ${c}`, ans: a * b - c }; },
  addMul: (r, d) => { const a = randInt(r, 6, 25 + Math.round(10 * d)); const b = randInt(r, 6, 25); const c = randInt(r, 3, 7); return { text: `(${a} + ${b}) × ${c}`, ans: (a + b) * c }; },
  divAdd: (r, d) => { const b = randInt(r, 3, 9); const k = randInt(r, 6, 14 + Math.round(6 * d)); const c = randInt(r, 11, 49); return { text: `${b * k} ÷ ${b} + ${c}`, ans: k + c }; },
  sqSub: (r, d) => { const a = randInt(r, 7, 13 + Math.round(4 * d)); const b = randInt(r, 5, 40); return { text: `${a}² − ${b}`, ans: a * a - b }; },
  pct: r => { const p = pick(r, [10, 15, 20, 25, 30, 40, 75]); const n = 20 * randInt(r, 3, 30); return { text: `${p}% of ${n}`, ans: (p * n) / 100 }; },
};
export function genMath(rand, level) {
  const forms = shuffle(rand, Object.keys(MATH_FORMS)).slice(0, 4);
  return { type: 'math', parts: 4, problems: forms.map(f => MATH_FORMS[f](rand, level)) };
}

// ---------- pattern lock ----------
// Each rule draws its numbers (in the SAME order as ever — the sequences never change) and returns the next-term function + its numbers
// for the RULE line (patternSay — "+3 each time", "×2 each time"; OC3: THE ANSWER + the rules card's demo show it).
const SEQ_RULES = {
  arith: (r, d) => { const a = randInt(r, 3, 40); const k = randInt(r, 3, 12 + Math.round(10 * d)); return [i => a + k * i, { k }]; },
  geo: r => { const a = randInt(r, 2, 6); const k = pick(r, [2, 3]); return [i => a * k ** i, { k }]; },
  incDiff: r => { const a = randInt(r, 1, 20); const k = randInt(r, 1, 4); return [i => a + k * i + (i * (i - 1)) / 2, { k }]; },
  squares: r => { const o = randInt(r, -3, 10); const s = randInt(r, 1, 6); return [i => (s + i) ** 2 + o, { s, o }]; },
  fib: r => { const a = randInt(r, 1, 5); const b = randInt(r, a + 1, a + 6); const memo = [a, b]; return [i => { while (memo.length <= i) memo.push(memo[memo.length - 1] + memo[memo.length - 2]); return memo[i]; }, {}]; },
  alt: r => { const a = randInt(r, 10, 40); const p = randInt(r, 5, 12); const m = randInt(r, 2, 6); return [i => a + Math.ceil(i / 2) * p - Math.floor(i / 2) * m, { p, m }]; },
  doublePlus: r => { const a = randInt(r, 1, 6); const c = randInt(r, 1, 4); return [i => { let t = a; for (let j = 0; j < i; j++) t = 2 * t + c; return t; }, { c }]; },
};
const EASY_RULES = ['arith', 'geo', 'alt', 'incDiff'];
const MINUS = '−';
/** a sequence's rule in one short line (PURE) */
export function patternSay(rule, v = {}) {
  switch (rule) {
    case 'easy': return `${v.k > 0 ? '+' : MINUS}${Math.abs(v.k)} each time`;
    case 'arith': return `+${v.k} each time`;
    case 'geo': return `×${v.k} each time`;
    case 'incDiff': return `+${v.k}, +${v.k + 1}, +${v.k + 2}… one more each time`;
    case 'squares': return v.o ? `square numbers ${v.o > 0 ? '+' : MINUS} ${Math.abs(v.o)}` : `square numbers: ${v.s}², ${v.s + 1}², ${v.s + 2}²…`;
    case 'fib': return 'add the two before';
    case 'alt': return `+${v.p}, ${MINUS}${v.m}, +${v.p}, ${MINUS}${v.m}…`;
    case 'doublePlus': return `×2, then +${v.c}`;
    default: return '';
  }
}
/** PATTERN LOCK's EASY OPENER (OC3 — the owner): the match's FIRST sequence is a plain +n / −n step with small numbers (1–65), drawn from its
 *  OWN seeded stream so the second sequence (and every later Pattern Lock) stays exactly what it always was */
export function easySeq(rand) {
  const k = randInt(rand, 2, 9);
  const down = rand() < 0.3 && k <= 6;
  const a = down ? 5 * k + randInt(rand, 1, 15) : randInt(rand, 1, 20);
  const step = down ? -k : k;
  const f = i => a + step * i;
  return { rule: 'easy', shown: [0, 1, 2, 3, 4].map(f), ans: f(5), say: patternSay('easy', { k: step }) };
}
/** first = this is the match's first Pattern Lock (generate: occ 0) → its first sequence is the easy opener (seed + ci = its own stream) */
export function genPattern(rand, level, { first = false, seed = '', ci = 0 } = {}) {
  const pool = level < 0.3 ? EASY_RULES : Object.keys(SEQ_RULES);
  const rules = shuffle(rand, pool).slice(0, 2);
  const seqs = rules.map(name => { const [f, v] = SEQ_RULES[name](rand, level); return { rule: name, shown: [0, 1, 2, 3, 4].map(f), ans: f(5), say: patternSay(name, v) }; });
  if (first) seqs[0] = easySeq(rngFrom(`${seed}:${ci}:pattern:easy`));
  return { type: 'pattern', parts: 2, seqs };
}

// ---------- color clash (Stroop) ----------
export const STROOP_COLORS = {
  red: { name: 'RED', hex: '#ff3355' },
  blue: { name: 'BLUE', hex: '#3d8bff' },
  green: { name: 'GREEN', hex: '#3dff8b' },
  yellow: { name: 'YELLOW', hex: '#fff23a' },
  purple: { name: 'PURPLE', hex: '#b46bff' },
  orange: { name: 'ORANGE', hex: '#ff8a2a' },
};
// OC4 — the four colors ONLY (red · blue · green · yellow at full saturation — as far apart in hue as four can be): Color Clash is the one
// challenge ABOUT color, so it never swaps in purple / orange any more (too close to blue / red for many eyes). Later challenges still
// reshuffle the tiles' order every word.
export const CLASH_COLORS = Object.freeze(['red', 'blue', 'green', 'yellow']);
export function genStroop(rand, level) {
  const palette = CLASH_COLORS.slice();
  const items = [];
  for (let i = 0; i < 8; i++) {
    const ink = pick(rand, palette);
    // mostly mismatched (that's the trick), with the odd honest one to keep you guessing
    const word = rand() < 0.15 ? ink : pick(rand, palette.filter(c => c !== ink));
    // button order is fixed early on; later it reshuffles every time
    const order = level < 0.5 ? palette : shuffle(rand, palette);
    items.push({ word, ink, order });
  }
  return { type: 'stroop', parts: 8, items };
}

// ---------- signal lock (reaction time) ----------
export const REFLEX_TIMEOUT_MS = 1200;
// Per-round credit 0..1 from a reaction time: ≤ 230 ms is perfect, slower fades to 0.1.
export function reflexCredit(ms) {
  if (!(ms >= 0)) return 0;
  return Math.round(Math.max(0.1, Math.min(1, 1 - (ms - 230) / 600)) * 100) / 100;
}
export function genReflex(rand) {
  // identical waits on every phone (seeded), so nobody gets an easier rhythm
  return { type: 'reflex', parts: 5, delays: Array.from({ length: 5 }, () => randInt(rand, 1100, 2600)) };
}

// ---------- quick count ----------
export const COUNT_SHAPES = ['tri', 'dot', 'sq', 'dia'];
export function genCount(rand, level) {
  const items = [];
  for (let i = 0; i < 4; i++) {
    const size = level < 0.5 ? 4 : 5;
    const cells = size * size;
    const target = pick(rand, COUNT_SHAPES);
    const ans = randInt(rand, 3, 6 + Math.round(level * 3));
    const others = randInt(rand, 4, Math.min(cells - ans, 7 + Math.round(level * 6)));
    const fill = [...Array(ans).fill(target), ...Array.from({ length: others }, () => pick(rand, COUNT_SHAPES.filter(s => s !== target)))];
    const grid = shuffle(rand, [...fill, ...Array(cells - fill.length).fill(null)]);
    const offsets = shuffle(rand, [-2, -1, 1, 2]).filter(o => ans + o > 0).slice(0, 3);
    items.push({ size, cells: grid, target, ans, options: [ans, ...offsets.map(o => ans + o)].sort((a, b) => a - b), flashMs: Math.round(1800 - level * 600) });
  }
  return { type: 'count', parts: 4, items };
}

// ---------- true or false ----------
// OC6 — THE FACT POOL: the facts live in data/oc/truefalse.json ({ id, t: the true text, f: its false twin, src, cat } — banks.js, built by
// scripts/oc-pools/build.mjs); statements 2, 4, 6, 8 are facts (the others math — generated, never repeat-checked). The pair-based truth flip
// as ever: each fact slot shows its true text or its false twin (rand). deal = THE ROOM's NIGHT MEMORY: the four fact IDS (deal.js) — an id the
// pool no longer has falls back to the seeded draw.
const TF_MATH = [
  // each builds a statement that is true when `want` is true
  (r, want) => { const a = randInt(r, 6, 19); const b = randInt(r, 3, 9); const p = a * b; const c = p + pick(r, [-3, -2, -1, 1, 2, 3]); const op = (p > c) === want ? '>' : '<'; return `${a} × ${b} ${op} ${c}`; },
  (r, want) => { const x = randInt(r, 18, 79); const y = randInt(r, 14, 68); const s = want ? x + y : x + y + pick(r, [-10, -2, -1, 1, 2, 10]); return `${x} + ${y} = ${s}`; },
  (r, want) => { const b = randInt(r, 3, 9); const k = randInt(r, 4, 13); return `${b * k} ÷ ${b} = ${want ? k : k + pick(r, [-1, 1])}`; },
  (r, want) => { const a = randInt(r, 7, 15); return `${a}² = ${want ? a * a : a * a + pick(r, [-a, a, -1, 1])}`; },
  (r, want) => { const p = pick(r, [10, 20, 25, 50, 75]); const n = 20 * randInt(r, 2, 20); const v = (p * n) / 100; return `${p}% of ${n} = ${want ? v : v + pick(r, [-5, 5, -10, 10])}`; },
];
export const TF_FACT_SLOTS = 4;
/** a pool's id → index map (built once per loaded pool) */
const idMaps = new WeakMap();
export function idIndex(list, idOf = x => x.id) {
  let m = idMaps.get(list);
  if (!m) { m = new Map(); list.forEach((x, i) => m.set(idOf(x), i)); idMaps.set(list, m); }
  return m;
}
export function genTrueFalse(rand, bank, deal) {
  if (!Array.isArray(bank) || bank.length < 8) return null;
  const shuffled = shuffle(rand, bank.map((_, i) => i));
  const ids = idIndex(bank);
  const fact = i => { const id = Array.isArray(deal) ? deal[(i - 1) / 2] : null; const k = typeof id === 'string' ? ids.get(id) : undefined; return bank[k ?? shuffled[i]]; };
  const items = [];
  for (let i = 0; i < 8; i++) {
    const truth = rand() < 0.5;
    if (i % 2 === 0) items.push({ text: pick(rand, TF_MATH)(rand, truth), truth });
    else { const row = fact(i); items.push({ text: truth ? row.t : row.f, truth, id: row.id }); }
  }
  return { type: 'truefalse', parts: 8, items };
}

// ---------- banks: a per-match shuffled deck per type, so a type that comes twice never repeats an entry ----------
/** THE ROOM's NIGHT MEMORY (deal.js): a dealt index k of this challenge's deal, when it's there + in range */
export const dealt = (deal, k, size) => Array.isArray(deal) && Number.isInteger(deal[k]) && deal[k] >= 0 && deal[k] < size;
const bankAt = (deal, k, seed, type, occ, size) => (dealt(deal, k, size) ? deal[k] : bankIndex(seed, type, occ, size));
export function bankIndex(seed, type, occ, size) {
  const deck = shuffle(rngFrom(`${seed}:${type}:deck`), Array.from({ length: size }, (_, i) => i));
  return deck[occ % size];
}

// ---------- timeline ----------
// OC6 — THEME POOLS (data/oc/timeline.json: [{ id, theme, ask, dir, unit?, items: [[label, value, shown|null, id], …] }]): a challenge deals
// FOUR items of one theme, every pair at least TL_GAP_YEARS apart (a unit theme: TL_GAP_RATIO×) — seeded, so a few hundred items give
// thousands of different rounds. The screen + the scoring exactly as OC3B built them (the spec's shape unchanged).
export const TL_GAP_YEARS = 10;
export const TL_GAP_RATIO = 1.3;
export const tlFair = (unit, a, b) => (unit && unit !== 'year' ? Math.min(a, b) > 0 && Math.max(a, b) / Math.min(a, b) >= TL_GAP_RATIO : Math.abs(a - b) >= TL_GAP_YEARS);
/** four item indexes of a theme, pairwise fair — the fresh ones first (avoid(i) = seen tonight), then any; null when none fits */
export function tlDeal(rand, theme, avoid = null) {
  const items = theme.items;
  const unit = theme.unit || 'year';
  for (let attempt = 0; attempt < 8; attempt++) {
    const deck = shuffle(rand, items.map((_, i) => i));
    const out = [];
    const fits = i => out.every(j => tlFair(unit, items[i][1], items[j][1]));
    for (const pass of [0, 1]) for (const i of deck) {
      if (out.length >= 4) break;
      if (out.includes(i) || (pass === 0 && avoid && avoid(i))) continue;
      if (fits(i)) out.push(i);
    }
    if (out.length === 4) return out;
  }
  return null;
}
/** an item's value as the reveal prints it: its own text, a US-unit value, or the year */
export const tlShown = (theme, it) => (it[2] ? it[2] : theme.unit && theme.unit !== 'year' ? showUS(theme.unit, it[1]) : yearText(it[1]));
export function genTimeline(rand, level, bank, occ, seed, deal) {
  if (!Array.isArray(bank) || !bank.length) return null;
  let order = shuffle(rand, [0, 1, 2, 3]);
  for (let k = 0; k < 8 && order.every((v, i) => v === i); k++) order = shuffle(rand, [0, 1, 2, 3]); // never pre-solved
  // deal = [theme id, item id × 4] (deal.js) — a stale one (the pool changed) = the seeded draw
  let theme = null, idx = null;
  if (Array.isArray(deal) && deal.length === 5) {
    const t = bank[idIndex(bank).get(deal[0])];
    if (t) {
      const ids = idIndex(t.items, x => x[3]);
      const got = deal.slice(1).map(id => ids.get(id));
      const unit = t.unit || 'year';
      if (got.every(i => i != null) && new Set(got).size === 4 && got.every((i, a) => got.every((j, b) => a === b || tlFair(unit, t.items[i][1], t.items[j][1])))) { theme = t; idx = got; }
    }
  }
  if (!theme) {
    for (let k = 0; k < bank.length && !idx; k++) { theme = bank[bankIndex(seed, 'timeline', occ + k, bank.length)]; idx = tlDeal(rand, theme); }
    if (!idx) return null;
  }
  const items = idx.map(i => theme.items[i]).sort((a, b) => a[1] - b[1]);
  // shown[i] = the correct position of the i-th item on screen
  return { type: 'timeline', parts: 4, title: theme.theme, ask: theme.ask, dir: theme.dir, items: items.map(it => ({ label: it[0], value: tlShown(theme, it) })), shown: order };
}
/** How many positions are right: picks = on-screen indexes in the order the player tapped them. */
export const timelineCorrect = (spec, picks) => picks.reduce((n, shownIdx, pos) => n + (spec.shown[shownIdx] === pos ? 1 : 0), 0);

// ---------- closest call ----------
/** bank: data/oc/closest.json questions ([category, question, answer, unit]) */
export function genClosest(rand, level, bank, occ, seed, deal) {
  if (!bank || !bank.length) return null;
  const [cat, q, answer, unit] = bank[bankAt(deal, 0, seed, 'closest', occ, bank.length)];
  return { type: 'closest', parts: 1, cat, q, answer, unit };
}
/** 0..1 from the relative error: within 5% = full marks, sliding smoothly (cosine) to 0 at 60% off. */
export function closestCredit(guess, answer) {
  if (!(guess >= 0) || !(answer > 0)) return 0;
  const rel = Math.abs(guess - answer) / answer;
  if (rel <= 0.05) return 1;
  if (rel >= 0.6) return 0;
  const t = (rel - 0.05) / 0.55;
  return Math.round(50 * (1 + Math.cos(Math.PI * t))) / 100;
}

// ---------- rewire ----------
// Tile openings as a bitmask: N 1, E 2, S 4, W 8. Shapes in their base orientation:
export const REWIRE_SHAPES = { I: 1 | 4, L: 1 | 2, T: 1 | 2 | 4 };
const DIRS = [[1, -1, 0], [2, 0, 1], [4, 1, 0], [8, 0, -1]]; // [bit, dRow, dCol]
const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
export const rotMask = (mask, turns) => { let m = mask; for (let k = 0; k < ((turns % 4) + 4) % 4; k++) m = ((m << 1) | (m >> 3)) & 15; return m; };
/**
 * Which cells carry power at the given turns. Power enters (src, 0) from the west; the core sits east of
 * (core, n-1). Returns { lit: Set, depth: Map index -> steps from the source, solved, reach 0..1 }.
 */
export function rewirePower(pz, turns) {
  const { n, src, core } = pz;
  const mask = i => rotMask(REWIRE_SHAPES[pz.tiles[i]], turns[i]);
  const lit = new Set();
  const depth = new Map();
  const start = src * n;
  if (mask(start) & 8) {
    const q = [start];
    lit.add(start); depth.set(start, 0);
    while (q.length) {
      const i = q.shift();
      const r = Math.floor(i / n), c = i % n;
      for (const [bit, dr, dc] of DIRS) {
        if (!(mask(i) & bit)) continue;
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const j = rr * n + cc;
        if (lit.has(j) || !(mask(j) & OPP[bit])) continue;
        lit.add(j); depth.set(j, depth.get(i) + 1); q.push(j);
      }
    }
  }
  const end = core * n + n - 1;
  const solved = lit.has(end) && !!(mask(end) & 2);
  const dist = i => Math.abs(Math.floor(i / n) - core) + Math.abs((i % n) - (n - 1));
  const span = dist(start) + 1;
  let reach = 0;
  for (const i of lit) reach = Math.max(reach, 1 - dist(i) / span);
  return { lit, depth, solved, reach: solved ? 1 : Math.min(0.95, reach) };
}
function rewirePuzzle(rand, n) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const src = randInt(rand, 0, n - 1), core = randInt(rand, 0, n - 1);
    // a random self-avoiding walk from the source cell to the core cell
    const path = [[src, 0]];
    const seen = new Set([`${src},0`]);
    let ok = false;
    for (let steps = 0; steps < n * n * 3; steps++) {
      const [r, c] = path[path.length - 1];
      if (r === core && c === n - 1) { ok = true; break; }
      const opts = DIRS.map(([, dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < n && cc < n && !seen.has(`${rr},${cc}`));
      if (!opts.length) break;
      const [rr, cc] = opts[Math.floor(rand() * opts.length)];
      path.push([rr, cc]); seen.add(`${rr},${cc}`);
    }
    if (!ok || path.length < n + 1) continue;
    const tiles = Array(n * n).fill(null);
    const solution = Array(n * n).fill(0);
    const bitTo = (a, b) => DIRS.find(([, dr, dc]) => a[0] + dr === b[0] && a[1] + dc === b[1])[0];
    path.forEach((cell, k) => {
      const prev = k === 0 ? [cell[0], cell[1] - 1] : path[k - 1];
      const next = k === path.length - 1 ? [cell[0], cell[1] + 1] : path[k + 1];
      const need = bitTo(cell, prev) | bitTo(cell, next);
      let shape = need === 5 || need === 10 ? 'I' : 'L';
      if (rand() < 0.22) shape = 'T'; // some junctions on the path too
      const i = cell[0] * n + cell[1];
      tiles[i] = shape;
      solution[i] = [0, 1, 2, 3].find(t => (rotMask(REWIRE_SHAPES[shape], t) & need) === need);
    });
    for (let i = 0; i < n * n; i++) if (!tiles[i]) { tiles[i] = pick(rand, ['I', 'L', 'L', 'T']); solution[i] = randInt(rand, 0, 3); }
    // scramble: every tile turned at random; never starts solved
    const turns = tiles.map(() => randInt(rand, 0, 3));
    const pz = { n, src, core, tiles, start: turns, solution, path: path.map(([r, c]) => r * n + c) };
    for (let k = 0; k < 20 && rewirePower(pz, turns).solved; k++) { const i = pz.path[k % pz.path.length]; turns[i] = (turns[i] + 1) % 4; }
    if (rewirePower(pz, turns).solved) continue;
    if (!rewirePower(pz, solution).solved) continue; // the stored answer must work
    return pz;
  }
  return null;
}
export function genRewire(rand) {
  return { type: 'rewire', parts: 2, puzzles: [rewirePuzzle(rand, 3), rewirePuzzle(rand, 4)] };
}
/** ok for a Rewire run: solved puzzles + partial credit (≤ 0.6) for how far the power reaches in the current one. */
export const rewireOk = (solvedCount, reach) => Math.round((solvedCount + (solvedCount >= 2 ? 0 : 0.6 * reach)) * 100) / 100;

// ---------- missing link ----------
/** bank: data/oc/missinglink.json puzzles ([word, word, word, ANSWER, "OTHER|SPELLINGS" or ""]) */
export function genMissingLink(rand, bank, occ, seed, deal) {
  if (!bank || !bank.length) return null;
  const puzzles = [0, 1].map(k => {
    const [a, b, c, answer, alt] = bank[bankAt(deal, k, seed, 'missinglink', occ * 2 + k, bank.length)];
    return { words: shuffle(rand, [a, b, c]), answer, alt: alt ? alt.split('|') : [] };
  });
  return { type: 'missinglink', parts: 2, puzzles };
}
export const normWord = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
/** The answer, a listed variant, or a plain plural of either (case and spaces ignored). */
export function linkAccepts(guess, pz) {
  const g = normWord(guess);
  if (!g) return false;
  const forms = new Set([pz.answer, ...(pz.alt || [])].map(normWord));
  for (const f of [...forms]) {
    forms.add(`${f}S`);
    forms.add(`${f}ES`);
    if (/[^AEIOU]Y$/.test(f)) forms.add(`${f.slice(0, -1)}IES`);
  }
  return forms.has(g);
}

// ---------- spellcheck ----------
/** bank: data/oc/spellcheck.json words ([correct, most common misspelling, wrong, wrong]) */
export function genSpellcheck(rand, bank, occ, seed, deal) {
  if (!bank || !bank.length) return null;
  const items = Array.from({ length: 5 }, (_, k) => {
    const row = bank[bankAt(deal, k, seed, 'spellcheck', occ * 5 + k, bank.length)];
    const order = shuffle(rand, [0, 1, 2, 3]);
    return { options: order.map(i => row[i]), ans: order.indexOf(0), word: row[0], common: row[1] };
  });
  return { type: 'spellcheck', parts: 5, items };
}

// ---------- compass ----------
export const COMPASS_DIRS = ['N', 'E', 'S', 'W'];
export const COMPASS_TURN = { R: 1, L: 3, A: 2 };
export const COMPASS_LENGTHS = [3, 4, 5, 6, 7];
// Instruction pace per round (each is on screen this long, with a short blink between): 25 turns have to fit in 30 s.
export const COMPASS_STEP_MS = [760, 700, 640, 590, 550];
export const COMPASS_GAP_MS = 80;
export const COMPASS_START_MS = [1000, 500, 500, 500, 500];
export const COMPASS_FLASH_MS = 450;
// Time the script itself takes (start cards, instructions, feedback between rounds): the speed bonus only counts the rest.
export const COMPASS_SCRIPT_MS = COMPASS_START_MS.reduce((a, b) => a + b, 0)
  + COMPASS_LENGTHS.reduce((a, n, k) => a + n * (COMPASS_STEP_MS[k] + COMPASS_GAP_MS), 0)
  + (COMPASS_LENGTHS.length - 1) * COMPASS_FLASH_MS;
export const compassFace = (start, turns) => [...turns].reduce((d, t) => (d + COMPASS_TURN[t]) % 4, start);
export function genCompass(rand) {
  const rounds = COMPASS_LENGTHS.map(n => {
    const start = randInt(rand, 0, 3);
    let turns = '';
    while (turns.length < n) {
      const t = rand() < 0.18 && !turns.endsWith('A') ? 'A' : rand() < 0.5 ? 'L' : 'R';
      turns += t;
    }
    return { start, turns, ans: compassFace(start, turns) };
  });
  return { type: 'compass', parts: 5, rounds };
}

// ---------- sort it ----------
export const SORT_CARDS = 12;
export const SORT_FULL = 10; // net correct sorts (right − ½ × wrong) that already score the full 100
/** How long card i stays up before it counts as a miss: 2.6 s at first, down to 1.2 s. */
export const sortWindowMs = i => Math.round(2600 - (1400 * Math.min(i, SORT_CARDS - 1)) / (SORT_CARDS - 1));
export const sortOk = (right, wrong) => Math.max(0, Math.round((right - 0.5 * wrong) * 100) / 100);
/** bank: data/oc/sortit.json sets ([{ id, left, right, L: [left items], R: [right items], src }]) — deal = [set id] (deal.js) */
export function genSortIt(rand, bank, occ, seed, deal) {
  if (!Array.isArray(bank) || !bank.length) return null;
  const k = Array.isArray(deal) && typeof deal[0] === 'string' ? idIndex(bank).get(deal[0]) : undefined;
  const { left, right, L, R } = bank[k ?? bankIndex(seed, 'sortit', occ, bank.length)];
  const nl = randInt(rand, 5, 7);
  const pickCards = () => shuffle(rand, [
    ...shuffle(rand, L).slice(0, nl).map(t => ({ t, s: 0 })),
    ...shuffle(rand, R).slice(0, SORT_CARDS - nl).map(t => ({ t, s: 1 })),
  ]);
  let cards = pickCards();
  // no long runs on one side (it would feel rigged)
  const runs = cs => cs.some((c, i) => i >= 3 && cs.slice(i - 3, i + 1).every(x => x.s === c.s));
  for (let n = 0; n < 12 && runs(cards); n++) cards = shuffle(rand, cards);
  return { type: 'sortit', parts: SORT_CARDS, left, right, cards };
}

// ---------- higher or lower ----------
export const HL_PAIRS = 10;
/** Fair pairs only: years at least 10 apart, anything else at least 1.2× apart (a stat may ask for more: its `gap`). */
export const hlFair = (unit, a, b, gap = 1.2) => (unit === 'year' ? Math.abs(a - b) >= 10 : Math.min(a, b) > 0 && Math.max(a, b) / Math.min(a, b) >= gap);
const hlClear = (unit, a, b) => (unit === 'year' ? Math.abs(a - b) >= 40 : Math.max(a, b) / Math.min(a, b) >= 2);
/**
 * bank: data/oc/higherlower.json stats ([{ id, stat, ask, unit, win: 'max'|'min', gap?, items: [[label, value, shown|null, id], …] }] — values
 * METRIC, shown in US units: units.js). Ten pairs, each from one stat; the first few are clear-cut, later ones closer. → [si, i, j] × 10
 * (indexes — deal.js turns them into ids).
 */
export function hlPick(rand, bank, avoid = null) {
  const used = new Set();
  const out = [];
  let last = -1;
  for (let k = 0; k < HL_PAIRS; k++) {
    let pair = null;
    for (let tries = 0; tries < 400 && !pair; tries++) {
      const si = randInt(rand, 0, bank.length - 1);
      if (si === last && tries < 300) continue;
      const { unit, items, gap } = bank[si];
      const i = randInt(rand, 0, items.length - 1), j = randInt(rand, 0, items.length - 1);
      if (i === j || used.has(`${si}:${i}`) || used.has(`${si}:${j}`)) continue;
      // THE ROOM's NIGHT MEMORY: an item this room saw tonight only once nothing fresh fits (a long night reshuffles, never stalls)
      if (avoid && tries < 360 && (avoid(si, i) || avoid(si, j))) continue;
      const a = items[i][1], b = items[j][1];
      if (!hlFair(unit, a, b, gap)) continue;
      const clear = hlClear(unit, a, b);
      if (tries < 300 && (k < 3 ? !clear : k >= 6 && clear)) continue;
      used.add(`${si}:${i}`); used.add(`${si}:${j}`);
      last = si;
      pair = [si, i, j];
    }
    out.push(pair);
  }
  return out;
}
/** a pair's id in a deal: "statId|itemId|itemId" */
export const hlPairId = (bank, [si, i, j]) => `${bank[si].id}|${bank[si].items[i][3]}|${bank[si].items[j][3]}`;
/** "statId|itemId|itemId" → [si, i, j] (null when the pool no longer has it) */
export function hlFromId(bank, pid) {
  if (typeof pid !== 'string') return null;
  const [sid, a, b] = pid.split('|');
  const si = idIndex(bank).get(sid);
  if (si == null) return null;
  const ids = idIndex(bank[si].items, x => x[3]);
  const i = ids.get(a), j = ids.get(b);
  return i == null || j == null || i === j ? null : [si, i, j];
}
/** [si, i, j] → the pair the screen shows (ans = index of the winner) */
export function hlPair(bank, t) {
  if (!t || !bank[t[0]]) return null;
  const { stat, ask, unit, win, items } = bank[t[0]];
  const A = items[t[1]], B = items[t[2]];
  if (!A || !B) return null;
  const side = x => ({ name: x[0], v: x[1], shown: x[2] || null });
  return { stat, ask, unit, a: side(A), b: side(B), ans: (win === 'max') === (A[1] > B[1]) ? 0 : 1 };
}
export function genHigherLower(rand, bank, deal) {
  if (!Array.isArray(bank) || !bank.length) return null;
  // deal = the night's 10 pairs as ids ["statId|itemId|itemId" × 10] (deal.js); without one the challenge's own seeded draw
  const dealtPairs = Array.isArray(deal) && deal.length === HL_PAIRS ? deal.map(pid => hlFromId(bank, pid)) : null;
  if (dealtPairs && dealtPairs.some(t => !t)) return genHigherLower(rand, bank);   // a stale deal (the pool changed): the seeded draw
  const triples = dealtPairs || hlPick(rand, bank);
  const pairs = triples.map(t => (t ? hlPair(bank, t) : null));
  return { type: 'higherlower', parts: HL_PAIRS, pairs };
}

// ---------- build ----------
// deps: { answersFor(len) -> string[] | null, triviaItems: [3 decoded questions] | null }
// Returns null if a dependency (word list / questions) isn't ready yet.
// occ = how many times this type already came earlier in the match (bank challenges never repeat an entry).
// deal = this challenge's dealt items (game.deal[ci] — THE ROOM's NIGHT MEMORY, deal.js); absent = the seeded per-match deck (as before)
export function generate(type, { seed, ci, level, occ = 0, deal = null }, deps = {}) {
  const rand = challengeRng(seed, ci, type);
  switch (type) {
    case 'timeline': return genTimeline(rand, level, deps.timeline, occ, seed, deal);
    case 'closest': return genClosest(rand, level, deps.closest, occ, seed, deal);
    case 'rewire': return genRewire(rand);
    case 'missinglink': return genMissingLink(rand, deps.missinglink, occ, seed, deal);
    case 'spellcheck': return genSpellcheck(rand, deps.spellcheck, occ, seed, deal);
    case 'compass': return genCompass(rand);
    case 'sortit': return genSortIt(rand, deps.sortit, occ, seed, deal);
    case 'higherlower': return genHigherLower(rand, deps.higherlower, deal);
    case 'unscramble': return genUnscramble(rand, level, deps.answersFor || (() => null), deal);
    case 'memory': return genMemory(rand, level);
    case 'oddone': return genOddOne(rand, level, deal);
    case 'math': return genMath(rand, level);
    case 'pattern': return genPattern(rand, level, { first: occ === 0, seed, ci });
    case 'stroop': return genStroop(rand, level);
    case 'reflex': return genReflex(rand);
    case 'count': return genCount(rand, level);
    case 'truefalse': return genTrueFalse(rand, deps.truefalse, deal);
    case 'dumbluck': return genDumbLuck(seed, ci);
    case 'trivia': return deps.triviaItems && deps.triviaItems.length === 3 && deps.triviaItems.every(Boolean)
      ? { type: 'trivia', parts: 3, questions: deps.triviaItems } : null;
    default: return null;
  }
}

// ---------- dumb luck (OC5 — luck.js) ----------
/** the race's field for the screen: each lane's color + odds + payout (the draw happens later, on the host, after the picks lock) */
export function genDumbLuck(seed, ci) {
  const odds = dlField(seed, ci);
  return { type: LUCK, parts: 1, field: HORSES.map((h, i) => ({ ...h, lane: i, n: odds[i], pay: payout(odds[i]) })) };
}

// Unscramble accepts the target word or any other dictionary word using exactly the same letters.
export function unscrambleAccepts(guess, word, isValid) {
  if (guess === word) return true;
  if ([...guess].sort().join('') !== [...word].sort().join('')) return false;
  return !!(isValid && isValid(guess));
}
