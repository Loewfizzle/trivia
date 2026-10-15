// Deterministic randomness. Every client that feeds in the same seed string gets
// exactly the same sequence — used for shared challenges and tie-breaks.

// 32-bit FNV-1a hash of a string.
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: small, fast, good enough for games.
export function rngFrom(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rand, min, max) => min + Math.floor(rand() * (max - min + 1)); // inclusive
export const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

export function shuffle(rand, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
