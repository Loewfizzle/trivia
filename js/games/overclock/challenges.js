// OVERCLOCK — deterministic challenge generators. Every client builds the exact
// same challenge from (seed, challenge index, level), so nothing but the seed and
// the challenge order needs to be stored in the room.
import { rngFrom, randInt, pick, shuffle } from '../../core/rng.js';

export const TYPES = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia'];

export const INFO = {
  unscramble: { name: 'UNSCRAMBLE', glyph: '⇄', rules: ['Rebuild the scrambled word.', 'Tap letters in order. Wrong guesses only cost time.'] },
  memory: { name: 'MEMORY SEQUENCE', glyph: '◉', rules: ['Watch the nodes light up.', 'Repeat the sequence. One mistake ends your run.'] },
  oddone: { name: 'ODD ONE OUT', glyph: '◇', rules: ['Three grids of near-identical symbols.', 'Tap the one that is different.'] },
  math: { name: 'QUICK MATH', glyph: '±', rules: ['Four rapid calculations.', 'Normal order of operations. Type the answer.'] },
  pattern: { name: 'PATTERN LOCK', glyph: '∴', rules: ['Two number sequences.', 'Enter the next number in each.'] },
  trivia: { name: 'TRIVIA LIGHTNING', glyph: 'ϟ', rules: ['Three rapid-fire questions.', 'One shot each. Speed matters.'] },
};

export const memoryLength = level => 4 + Math.round(level * 4);

// How many scorable parts a challenge has (host needs this without building it).
export function partsFor(type, level) {
  return { unscramble: 1, memory: memoryLength(level), oddone: 3, math: 4, pattern: 2, trivia: 3 }[type] || 1;
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
