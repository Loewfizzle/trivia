// OVERCLOCK — deterministic challenge generators. Every client builds the exact
// same challenge from (seed, challenge index, level), so nothing but the seed and
// the challenge order needs to be stored in the room.
import { rngFrom, randInt, pick, shuffle } from '../../core/rng.js';

export const TYPES = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia', 'stroop', 'reflex', 'count', 'truefalse'];

export const INFO = {
  unscramble: { name: 'UNSCRAMBLE', glyph: '⇄', rules: ['Rebuild the scrambled word.', 'Tap letters in order. Wrong guesses only cost time.'] },
  memory: { name: 'MEMORY SEQUENCE', glyph: '◉', rules: ['Watch the nodes light up.', 'Repeat the sequence. One mistake ends your run.'] },
  oddone: { name: 'ODD ONE OUT', glyph: '◇', rules: ['Three grids of near-identical symbols.', 'Tap the one that is different.'] },
  math: { name: 'QUICK MATH', glyph: '±', rules: ['Four rapid calculations.', 'Normal order of operations. Type the answer.'] },
  pattern: { name: 'PATTERN LOCK', glyph: '∴', rules: ['Two number sequences.', 'Enter the next number in each.'] },
  trivia: { name: 'TRIVIA LIGHTNING', glyph: 'ϟ', rules: ['Three rapid-fire questions.', 'One shot each. Speed matters.'] },
  stroop: { name: 'COLOR CLASH', glyph: '◐', rules: ['A color word, printed in a different ink.', 'Tap the color of the INK — not the word.'] },
  reflex: { name: 'SIGNAL LOCK', glyph: '◎', rules: ['Wait for the screen to flash.', 'Then tap as fast as you can. Too early counts as a miss.'] },
  count: { name: 'QUICK COUNT', glyph: '#', rules: ['Shapes flash for a moment, then vanish.', 'Count the one we ask for. Off by one earns half.'] },
  truefalse: { name: 'TRUE OR FALSE', glyph: '✓', rules: ['Rapid-fire statements: math and facts.', 'True or false? Wrong answers cost points.'] },
};

export const memoryLength = level => 4 + Math.round(level * 4);

// How many scorable parts a challenge has (host needs this without building it).
export function partsFor(type, level) {
  return { unscramble: 1, memory: memoryLength(level), oddone: 3, math: 4, pattern: 2, trivia: 3, stroop: 8, reflex: 5, count: 4, truefalse: 8 }[type] || 1;
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

// ---------- build ----------
// deps: { answersFor(len) -> string[] | null, triviaItems: [3 decoded questions] | null }
// Returns null if a dependency (word list / questions) isn't ready yet.
export function generate(type, { seed, ci, level }, deps = {}) {
  const rand = challengeRng(seed, ci, type);
  switch (type) {
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
