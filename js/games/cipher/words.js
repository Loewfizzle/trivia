// Word lists for CIPHER BREACH. Files are JSON strings of fixed-width words
// concatenated together (see scripts/build-words.mjs).
const cache = new Map(); // length -> { answers: string[], valid: Set<string> }
const pending = new Map();

function split(str, n) {
  const out = new Array(str.length / n);
  for (let i = 0; i < out.length; i++) out[i] = str.slice(i * n, i * n + n);
  return out;
}

export function setLists(length, answersStr, validStr) {
  const answers = split(answersStr, length);
  const valid = new Set(split(validStr, length));
  for (const a of answers) valid.add(a);
  cache.set(length, { answers, valid });
}

export function loadLength(length) {
  if (cache.has(length)) return Promise.resolve(cache.get(length));
  if (pending.has(length)) return pending.get(length);
  const base = new URL('../../../data/words/', import.meta.url);
  const p = Promise.all([
    fetch(new URL(`answers-${length}.json`, base)).then(r => r.json()),
    fetch(new URL(`valid-${length}.json`, base)).then(r => r.json()),
  ]).then(([a, v]) => { setLists(length, a, v); pending.delete(length); return cache.get(length); })
    .catch(err => { pending.delete(length); throw err; });
  pending.set(length, p);
  return p;
}

export function loadLengths(lengths) {
  return Promise.all([...new Set(lengths)].map(loadLength));
}

export const isLoaded = length => cache.has(length);

export function isValidGuess(word) {
  const l = cache.get(word.length);
  return !!l && l.valid.has(word);
}

// Synchronous pick (director needs it inside a tick). Returns null if not loaded.
export function pickWord(length, used, rand = Math.random) {
  const l = cache.get(length);
  if (!l) return null;
  const n = l.answers.length;
  let idx = Math.floor(rand() * n);
  for (let i = 0; i < n; i++) {
    const key = `${length}_${idx}`;
    if (!used.has(key)) return { key, word: l.answers[idx] };
    idx = (idx + 1) % n;
  }
  return { key: `${length}_${idx}`, word: l.answers[idx] };
}

// Answer pool for a length (null until loaded) — also used by OVERCLOCK's unscramble.
export const answersFor = length => (cache.has(length) ? cache.get(length).answers : null);
