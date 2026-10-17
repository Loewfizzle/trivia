// OVERCLOCK — deterministic challenge generators. Every client builds the exact
// same challenge from (seed, challenge index, level), so nothing but the seed and
// the challenge order needs to be stored in the room.
import { rngFrom, randInt, pick, shuffle } from '../../core/rng.js';

export const TYPES = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia', 'stroop', 'reflex', 'count', 'truefalse', 'lexicon', 'timeline', 'closest', 'rewire',
  'missinglink', 'spellcheck', 'make24', 'compass', 'sortit', 'higherlower'];

// What kind of brain each challenge works — the match order spreads these out (logic.js#buildOrder).
export const CATEGORY = {
  unscramble: 'words', lexicon: 'words', missinglink: 'words', spellcheck: 'words',
  math: 'numbers', pattern: 'numbers', rewire: 'numbers', make24: 'numbers',
  memory: 'memory', compass: 'memory',
  oddone: 'visual', count: 'visual',
  trivia: 'knowledge', truefalse: 'knowledge', timeline: 'knowledge', closest: 'knowledge', higherlower: 'knowledge',
  stroop: 'reflex', reflex: 'reflex', sortit: 'reflex',
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
  lexicon: { name: 'LEXICON', glyph: '⌗', rules: ['Nine letters. Tap them in order to build words, then submit.', 'Only your LONGEST word counts — the longest possible earns the speed bonus.'] },
  timeline: { name: 'TIMELINE', glyph: '↧', rules: ['Four items. Tap them in order, 1 to 4 — tap again to undo.', 'Points for every item in the right place. Submit when you’re sure.'] },
  closest: { name: 'CLOSEST CALL', glyph: '≈', rules: ['One question, one number. Type your best estimate.', 'The closer you are, the more you score. Closest in the room gets the bonus.'] },
  rewire: { name: 'REWIRE', glyph: '↯', rules: ['Tap tiles to rotate them and route power to the core.', 'Two circuits: a 3×3 warm-up, then a 4×4.'] },
  missinglink: { name: 'MISSING LINK', glyph: '⊸', rules: ['Three words share one hidden word, before or after each.', 'COTTAGE · SWISS · CAKE → CHEESE. Two puzzles — guess as often as you like.'] },
  spellcheck: { name: 'SPELLCHECK', glyph: '✎', rules: ['Four spellings. Exactly one is right.', 'Five words, one tap each — no second chances.'] },
  make24: { name: 'MAKE 24', glyph: '⁂', rules: ['Tap a number, an operator, then another number to merge them.', 'Use all four tiles to make exactly 24. Two puzzles: easy, then hard.'] },
  compass: { name: 'COMPASS', glyph: '✣', rules: ['Note where you face, then follow the turns in your head.', 'When they vanish, tap the way you face now. Five rounds, each longer.'] },
  sortit: { name: 'SORT IT', glyph: '⇆', rules: ['Swipe each card left or right — or tap that side of the screen.', 'Wrong sorts cost a little. The cards come faster and faster.'] },
  higherlower: { name: 'HIGHER OR LOWER', glyph: '⇅', rules: ['Two things, one stat. Tap the winner — read the question!', 'Build a streak of 10. One wrong answer ends your run.'] },
};

export const memoryLength = level => 4 + Math.round(level * 4);

// How many scorable parts a challenge has (host needs this without building it).
export function partsFor(type, level) {
  return { unscramble: 1, memory: memoryLength(level), oddone: 3, math: 4, pattern: 2, trivia: 3, stroop: 8, reflex: 5, count: 4, truefalse: 8,
    lexicon: LEXICON_PARTS, timeline: 4, closest: 1, rewire: 2,
    missinglink: 2, spellcheck: 5, make24: 2, compass: 5, sortit: SORT_CARDS, higherlower: HL_PAIRS }[type] || 1;
}

export const challengeRng = (seed, ci, type) => rngFrom(`${seed}:${ci}:${type}`);

// ---------- unscramble ----------
export function unscrambleLength(level) {
  return level < 0.34 ? 5 : level < 0.67 ? 6 : 7;
}
export function genUnscramble(rand, level, answersFor) {
  const len = unscrambleLength(level);
  const words = answersFor(len);
  if (!words || !words.length) return null;
  const word = pick(rand, words);
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
// Glyph pairs from easy to hard (rendered in JetBrains Mono).
const ODD_TIERS = [
  [['O', 'Q'], ['E', 'F'], ['P', 'R'], ['C', 'G'], ['V', 'Y'], ['M', 'N'], ['T', 'Y']],
  [['b', 'd'], ['p', 'q'], ['6', '9'], ['u', 'v'], ['m', 'n'], ['h', 'n'], ['K', 'X'], ['3', '8']],
  [['O', '0'], ['l', '1'], ['I', 'l'], ['5', 'S'], ['8', 'B'], ['Z', '2'], ['e', 'c'], ['G', '6']],
];
export function genOddOne(rand, level) {
  const grids = [4, 5, 6].map((size, g) => {
    const tier = Math.min(2, Math.floor(level * 1.6 + g * 0.6));
    const pair = pick(rand, ODD_TIERS[tier]);
    const flip = rand() < 0.5;
    return { size, base: flip ? pair[1] : pair[0], odd: flip ? pair[0] : pair[1], idx: randInt(rand, 0, size * size - 1) };
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
const SEQ_RULES = {
  arith: (r, d) => { const a = randInt(r, 3, 40); const k = randInt(r, 3, 12 + Math.round(10 * d)); return i => a + k * i; },
  geo: r => { const a = randInt(r, 2, 6); const k = pick(r, [2, 3]); return i => a * k ** i; },
  incDiff: r => { const a = randInt(r, 1, 20); const k = randInt(r, 1, 4); return i => a + k * i + (i * (i - 1)) / 2; },
  squares: r => { const o = randInt(r, -3, 10); const s = randInt(r, 1, 6); return i => (s + i) ** 2 + o; },
  fib: r => { const a = randInt(r, 1, 5); const b = randInt(r, a + 1, a + 6); const memo = [a, b]; return i => { while (memo.length <= i) memo.push(memo[memo.length - 1] + memo[memo.length - 2]); return memo[i]; }; },
  alt: r => { const a = randInt(r, 10, 40); const p = randInt(r, 5, 12); const m = randInt(r, 2, 6); return i => a + Math.ceil(i / 2) * p - Math.floor(i / 2) * m; },
  doublePlus: r => { const a = randInt(r, 1, 6); const c = randInt(r, 1, 4); return i => { let t = a; for (let j = 0; j < i; j++) t = 2 * t + c; return t; }; },
};
const EASY_RULES = ['arith', 'geo', 'alt', 'incDiff'];
export function genPattern(rand, level) {
  const pool = level < 0.3 ? EASY_RULES : Object.keys(SEQ_RULES);
  const rules = shuffle(rand, pool).slice(0, 2);
  return {
    type: 'pattern', parts: 2,
    seqs: rules.map(name => { const f = SEQ_RULES[name](rand, level); return { rule: name, shown: [0, 1, 2, 3, 4].map(f), ans: f(5) }; }),
  };
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
export function genStroop(rand, level) {
  const ids = Object.keys(STROOP_COLORS);
  // the classic four first; later challenges swap in purple/orange
  const palette = level < 0.4 ? ids.slice(0, 4) : shuffle(rand, ids).slice(0, 4);
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
// [true statement, false twin]. Keep these unambiguous and checkable.
export const TF_FACTS = [
  ['A week has 168 hours', 'A week has 148 hours'],
  ['A spider has 8 legs', 'A spider has 6 legs'],
  ['Water boils at 100 °C at sea level', 'Water boils at 90 °C at sea level'],
  ['A hexagon has 6 sides', 'A hexagon has 7 sides'],
  ['The Pacific is the largest ocean', 'The Atlantic is the largest ocean'],
  ['A standard deck of cards has 4 suits', 'A standard deck of cards has 5 suits'],
  ['A leap year has 366 days', 'A leap year has 365 days'],
  ['Light travels faster than sound', 'Sound travels faster than light'],
  ['The chemical symbol for gold is Au', 'The chemical symbol for gold is Ag'],
  ['An octopus has three hearts', 'An octopus has two hearts'],
  ['Bats are mammals', 'Bats are birds'],
  ['A decade is 10 years', 'A decade is 100 years'],
  ['The Moon orbits the Earth', 'The Earth orbits the Moon'],
  ['Venus is the hottest planet', 'Mercury is the hottest planet'],
  ['The English alphabet has 26 letters', 'The English alphabet has 24 letters'],
  ['An adult human has 206 bones', 'An adult human has 306 bones'],
  ['Tokyo is the capital of Japan', 'Kyoto is the capital of Japan'],
  ['Canberra is the capital of Australia', 'Sydney is the capital of Australia'],
  ['Ottawa is the capital of Canada', 'Toronto is the capital of Canada'],
  ['A triangle’s angles add up to 180°', 'A triangle’s angles add up to 360°'],
  ['Diamonds are made of carbon', 'Diamonds are made of silicon'],
  ['The human heart has four chambers', 'The human heart has three chambers'],
  ['Shakespeare wrote Romeo and Juliet', 'Dickens wrote Romeo and Juliet'],
  ['Jupiter is the largest planet', 'Saturn is the largest planet'],
  ['A baker’s dozen is 13', 'A baker’s dozen is 12'],
  ['Sharks are fish', 'Dolphins are fish'],
  ['Pi is about 3.14', 'Pi is about 3.41'],
  ['A kilometre is 1,000 metres', 'A kilometre is 10,000 metres'],
  ['Brazil’s official language is Portuguese', 'Brazil’s official language is Spanish'],
  ['Mars is called the Red Planet', 'Venus is called the Red Planet'],
  ['The Nile is in Africa', 'The Amazon is in Africa'],
  ['A century is 100 years', 'A century is 1,000 years'],
  ['Penguins can’t fly', 'Ostriches can fly'],
  ['Mount Everest is the tallest mountain above sea level', 'K2 is the tallest mountain above sea level'],
  ['The Mona Lisa was painted by Leonardo da Vinci', 'The Mona Lisa was painted by Michelangelo'],
  ['Spiders are not insects', 'Spiders are insects'],
];
const TF_MATH = [
  // each builds a statement that is true when `want` is true
  (r, want) => { const a = randInt(r, 6, 19); const b = randInt(r, 3, 9); const p = a * b; const c = p + pick(r, [-3, -2, -1, 1, 2, 3]); const op = (p > c) === want ? '>' : '<'; return `${a} × ${b} ${op} ${c}`; },
  (r, want) => { const x = randInt(r, 18, 79); const y = randInt(r, 14, 68); const s = want ? x + y : x + y + pick(r, [-10, -2, -1, 1, 2, 10]); return `${x} + ${y} = ${s}`; },
  (r, want) => { const b = randInt(r, 3, 9); const k = randInt(r, 4, 13); return `${b * k} ÷ ${b} = ${want ? k : k + pick(r, [-1, 1])}`; },
  (r, want) => { const a = randInt(r, 7, 15); return `${a}² = ${want ? a * a : a * a + pick(r, [-a, a, -1, 1])}`; },
  (r, want) => { const p = pick(r, [10, 20, 25, 50, 75]); const n = 20 * randInt(r, 2, 20); const v = (p * n) / 100; return `${p}% of ${n} = ${want ? v : v + pick(r, [-5, 5, -10, 10])}`; },
];
export function genTrueFalse(rand) {
  const facts = shuffle(rand, TF_FACTS.map((_, i) => i));
  const items = [];
  for (let i = 0; i < 8; i++) {
    const truth = rand() < 0.5;
    if (i % 2 === 0) items.push({ text: pick(rand, TF_MATH)(rand, truth), truth });
    else { const pair = TF_FACTS[facts[i]]; items.push({ text: truth ? pair[0] : pair[1], truth }); }
  }
  return { type: 'truefalse', parts: 8, items };
}

// ---------- banks: a per-match shuffled deck per type, so a type that comes twice never repeats an entry ----------
export function bankIndex(seed, type, occ, size) {
  const deck = shuffle(rngFrom(`${seed}:${type}:deck`), Array.from({ length: size }, (_, i) => i));
  return deck[occ % size];
}

// ---------- lexicon ----------
// Score: 6 parts. The longest possible word = 6/6; each letter shorter costs one part.
export const LEXICON_PARTS = 6;
export const lexiconOk = (best, max) => Math.max(0, Math.min(LEXICON_PARTS, LEXICON_PARTS - (max - best)));
/** bank: data/oc/lexicon.json sets ([letters, max, "longest", "all words"]) */
export function genLexicon(rand, level, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const [letters, max, best, all] = bank[bankIndex(seed, 'lexicon', occ, bank.length)];
  return { type: 'lexicon', parts: LEXICON_PARTS, letters: shuffle(rand, [...letters]), max, best: best.split(' '), words: all.split(' ') };
}

// ---------- timeline ----------
/** bank: data/oc/timeline.json sets ([title, ask, direction, [[item, shown] × 4 in order]]) */
export function genTimeline(rand, level, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const [title, ask, dir, items] = bank[bankIndex(seed, 'timeline', occ, bank.length)];
  let order = shuffle(rand, [0, 1, 2, 3]);
  for (let k = 0; k < 8 && order.every((v, i) => v === i); k++) order = shuffle(rand, [0, 1, 2, 3]); // never pre-solved
  // shown[i] = the correct position of the i-th item on screen
  return { type: 'timeline', parts: 4, title, ask, dir, items: items.map(([label, value]) => ({ label, value })), shown: order };
}
/** How many positions are right: picks = on-screen indexes in the order the player tapped them. */
export const timelineCorrect = (spec, picks) => picks.reduce((n, shownIdx, pos) => n + (spec.shown[shownIdx] === pos ? 1 : 0), 0);

// ---------- closest call ----------
/** bank: data/oc/closest.json questions ([category, question, answer, unit]) */
export function genClosest(rand, level, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const [cat, q, answer, unit] = bank[bankIndex(seed, 'closest', occ, bank.length)];
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
export function genMissingLink(rand, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const puzzles = [0, 1].map(k => {
    const [a, b, c, answer, alt] = bank[bankIndex(seed, 'missinglink', occ * 2 + k, bank.length)];
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
export function genSpellcheck(rand, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const items = Array.from({ length: 5 }, (_, k) => {
    const row = bank[bankIndex(seed, 'spellcheck', occ * 5 + k, bank.length)];
    const order = shuffle(rand, [0, 1, 2, 3]);
    return { options: order.map(i => row[i]), ans: order.indexOf(0), word: row[0], common: row[1] };
  });
  return { type: 'spellcheck', parts: 5, items };
}

// ---------- make 24 ----------
// Exact fractions [numerator, denominator] (denominator > 0, lowest terms), so 8 ÷ 3 stays exact.
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const frac = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
export function applyOp(a, op, b) {
  if (op === '+') return frac(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  if (op === '-') return frac(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  if (op === '*') return frac(a[0] * b[0], a[1] * b[1]);
  if (op === '/') return b[0] === 0 ? null : frac(a[0] * b[1], a[1] * b[0]);
  return null;
}
export const OP_SIGN = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
/**
 * Every way to combine the numbers pairwise with + − × ÷ (exact fractions).
 * Returns { count: solutions found, intCount: solutions that never leave the whole numbers ≥ 0, expr: one solution }.
 * `expr` prefers an all-whole-number solution and uses as few brackets as it can.
 */
export function solve24(nums, target = 24) {
  let count = 0, intCount = 0, expr = null, intExpr = null;
  const wrap = (x, need) => (need ? `(${x.e})` : x.e);
  const rec = items => {
    if (items.length === 1) {
      const [x] = items;
      if (x.v[1] === 1 && x.v[0] === target) {
        count++;
        if (!expr) expr = x.e;
        if (x.int) { intCount++; if (!intExpr) intExpr = x.e; }
      }
      return;
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const rest = items.filter((_, k) => k !== i && k !== j);
        const a = items[i], b = items[j];
        for (const op of ['+', '-', '*', '/']) {
          if ((op === '+' || op === '*') && i > j) continue; // commutative: once is enough
          const v = applyOp(a.v, op, b.v);
          if (!v) continue;
          const p = PREC[op];
          const e = `${wrap(a, a.p < p)} ${OP_SIGN[op]} ${wrap(b, b.p < p || (b.p === p && (op === '-' || op === '/')))}`;
          rec([...rest, { v, e, p, int: a.int && b.int && v[1] === 1 && v[0] >= 0 }]);
        }
      }
    }
  };
  rec(nums.map(n => ({ v: [n, 1], e: String(n), p: 3, int: true })));
  return { count, intCount, expr: intExpr || expr };
}
/** bank: data/oc/make24.json { easy: [["1238", "solution"], …], hard: [...] } — every set verified by scripts/build-make24.mjs */
export function genMake24(rand, bank) {
  if (!bank || !bank.easy || !bank.hard) return null;
  const one = list => { const [d, sol] = pick(rand, list); return { nums: shuffle(rand, [...d].map(Number)), sol }; };
  return { type: 'make24', parts: 2, puzzles: [one(bank.easy), one(bank.hard)] };
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
/** bank: data/oc/sortit.json sets ([left label, right label, [left items], [right items]]) */
export function genSortIt(rand, bank, occ, seed) {
  if (!bank || !bank.length) return null;
  const [left, right, L, R] = bank[bankIndex(seed, 'sortit', occ, bank.length)];
  const nl = randInt(rand, 5, 7);
  const pickCards = () => shuffle(rand, [
    ...shuffle(rand, L).slice(0, nl).map(t => ({ t, s: 0 })),
    ...shuffle(rand, R).slice(0, SORT_CARDS - nl).map(t => ({ t, s: 1 })),
  ]);
  let cards = pickCards();
  // no long runs on one side (it would feel rigged)
  const runs = cs => cs.some((c, i) => i >= 3 && cs.slice(i - 3, i + 1).every(x => x.s === c.s));
  for (let k = 0; k < 12 && runs(cards); k++) cards = shuffle(rand, cards);
  return { type: 'sortit', parts: SORT_CARDS, left, right, cards };
}

// ---------- higher or lower ----------
export const HL_PAIRS = 10;
/** Fair pairs only: years at least 10 apart, anything else at least 1.2× apart. */
export const hlFair = (unit, a, b) => (unit === 'year' ? Math.abs(a - b) >= 10 : Math.min(a, b) > 0 && Math.max(a, b) / Math.min(a, b) >= 1.2);
const hlClear = (unit, a, b) => (unit === 'year' ? Math.abs(a - b) >= 40 : Math.max(a, b) / Math.min(a, b) >= 2);
/**
 * bank: data/oc/higherlower.json stats ([stat, question, unit, 'max'|'min', [[item, value, "shown"?], …]]).
 * Ten pairs, each from one stat; the first few are clear-cut, later ones closer. ans = index of the winner.
 */
export function genHigherLower(rand, bank) {
  if (!bank || !bank.length) return null;
  const used = new Set();
  const pairs = [];
  let last = -1;
  for (let k = 0; k < HL_PAIRS; k++) {
    let pair = null;
    for (let tries = 0; tries < 400 && !pair; tries++) {
      const si = randInt(rand, 0, bank.length - 1);
      if (si === last && tries < 300) continue;
      const [stat, ask, unit, win, items] = bank[si];
      const i = randInt(rand, 0, items.length - 1), j = randInt(rand, 0, items.length - 1);
      if (i === j || used.has(`${si}:${i}`) || used.has(`${si}:${j}`)) continue;
      const a = items[i][1], b = items[j][1];
      if (!hlFair(unit, a, b)) continue;
      const clear = hlClear(unit, a, b);
      if (tries < 300 && (k < 3 ? !clear : k >= 6 && clear)) continue;
      used.add(`${si}:${i}`); used.add(`${si}:${j}`);
      last = si;
      const side = x => ({ name: x[0], v: x[1], shown: x[2] || null });
      const ans = (win === 'max') === (a > b) ? 0 : 1;
      pair = { stat, ask, unit, a: side(items[i]), b: side(items[j]), ans };
    }
    pairs.push(pair);
  }
  return { type: 'higherlower', parts: HL_PAIRS, pairs };
}

// ---------- build ----------
// deps: { answersFor(len) -> string[] | null, triviaItems: [3 decoded questions] | null }
// Returns null if a dependency (word list / questions) isn't ready yet.
// occ = how many times this type already came earlier in the match (bank challenges never repeat an entry).
export function generate(type, { seed, ci, level, occ = 0 }, deps = {}) {
  const rand = challengeRng(seed, ci, type);
  switch (type) {
    case 'lexicon': return genLexicon(rand, level, deps.lexicon, occ, seed);
    case 'timeline': return genTimeline(rand, level, deps.timeline, occ, seed);
    case 'closest': return genClosest(rand, level, deps.closest, occ, seed);
    case 'rewire': return genRewire(rand);
    case 'missinglink': return genMissingLink(rand, deps.missinglink, occ, seed);
    case 'spellcheck': return genSpellcheck(rand, deps.spellcheck, occ, seed);
    case 'make24': return genMake24(rand, deps.make24);
    case 'compass': return genCompass(rand);
    case 'sortit': return genSortIt(rand, deps.sortit, occ, seed);
    case 'higherlower': return genHigherLower(rand, deps.higherlower);
    case 'unscramble': return genUnscramble(rand, level, deps.answersFor || (() => null));
    case 'memory': return genMemory(rand, level);
    case 'oddone': return genOddOne(rand, level);
    case 'math': return genMath(rand, level);
    case 'pattern': return genPattern(rand, level);
    case 'stroop': return genStroop(rand, level);
    case 'reflex': return genReflex(rand);
    case 'count': return genCount(rand, level);
    case 'truefalse': return genTrueFalse(rand);
    case 'trivia': return deps.triviaItems && deps.triviaItems.length === 3 && deps.triviaItems.every(Boolean)
      ? { type: 'trivia', parts: 3, questions: deps.triviaItems } : null;
    default: return null;
  }
}

// Unscramble accepts the target word or any other dictionary word using exactly the same letters.
export function unscrambleAccepts(guess, word, isValid) {
  if (guess === word) return true;
  if ([...guess].sort().join('') !== [...word].sort().join('')) return false;
  return !!(isValid && isValid(guess));
}
