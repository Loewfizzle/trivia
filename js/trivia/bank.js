// Bundled fallback bank (data/trivia/fallback.json) — used when both APIs fail.
import { normalize } from './sources.js';
import { hashString } from '../core/rng.js';

let rows = null;
let loading = null;

export function setFallbackRows(list) { rows = list; }

export function loadFallback() {
  if (rows) return Promise.resolve(rows);
  if (!loading) {
    loading = fetch(new URL('../../data/trivia/fallback.json', import.meta.url))
      .then(r => r.json())
      .then(j => { rows = j.questions; return rows; })
      .catch(e => { loading = null; throw e; });
  }
  return loading;
}

export const fallbackReady = () => !!rows;

// Picks n unused questions (preferring the selected categories). Returns
// normalized items, or null if the bank hasn't loaded on this client yet.
export function pickFallback(n, { cats = null, seen = {}, rand = Math.random } = {}) {
  if (!rows) return null;
  const want = cats && cats.length ? new Set(cats) : null;
  const fresh = rows.filter(r => !seen[qHash(r[2])]);
  let pool = want ? fresh.filter(r => want.has(r[0])) : fresh;
  if (pool.length < n) pool = fresh.length >= n ? fresh : rows; // widen rather than stall
  const out = [];
  const used = new Set();
  while (out.length < n && used.size < pool.length) {
    const i = Math.floor(rand() * pool.length);
    if (used.has(i)) continue;
    used.add(i);
    const [cat, d, q, correct, ...wrong] = pool[i];
    out.push(normalize({ q, correct, wrong, cat, d, src: 'fb' }, rand));
  }
  return out;
}

// Stable short hash of a question's text, for de-duplication across sources.
export const qHash = text => hashString(String(text).toLowerCase().replace(/[^a-z0-9]/g, '')).toString(36);
