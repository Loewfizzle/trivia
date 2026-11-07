// OVERCLOCK POOLS — SORT IT's COMPUTED SETS: the rule that decides each card (OC6). The build makes the sets from these, and the content test
// (tests/overclock-content.test.mjs) + tests/overclock-2.test.mjs RE-COMPUTE every card with the same rule — a computed set can't be wrong.
// left label → (card text) → true = the LEFT side.
export const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
export const fromRoman = s => { const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; } return t; };
const num = x => Number(String(x).replace(/,/g, ''));
const calc = x => { const m = /^(\d+) ([+×−]) (\d+)$/.exec(x); if (!m) return NaN; const a = +m[1], b = +m[3]; return m[2] === '+' ? a + b : m[2] === '×' ? a * b : a - b; };
const frac = x => { const [a, b] = x.split('/').map(Number); return a / b; };
const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const sq = n => Number.isInteger(Math.sqrt(n));
const cube = n => Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n;
const lower = x => String(x).toLowerCase();

export const SORT_CHECKS = {
  // (OC1–OC5's six)
  PRIME: x => isPrime(Number(x)),
  'MULTIPLE OF 7': x => Number(x) % 7 === 0,
  'MORE THAN 50': x => fromRoman(x) > 50,
  'MORE THAN ½': x => frac(x) > 0.5,
  PALINDROME: x => [...x].reverse().join('') === x,
  'LETTERS IN A–Z ORDER': x => [...x].every((c, i) => i === 0 || x[i - 1] <= c),
  // (OC6)
  'SQUARE NUMBER': x => sq(num(x)),
  'CUBE NUMBER': x => cube(num(x)),
  'MULTIPLE OF 3': x => num(x) % 3 === 0,
  'MULTIPLE OF 4': x => num(x) % 4 === 0,
  'MULTIPLE OF 6': x => num(x) % 6 === 0,
  'MULTIPLE OF 8': x => num(x) % 8 === 0,
  'MULTIPLE OF 9': x => num(x) % 9 === 0,
  'MULTIPLE OF 11': x => num(x) % 11 === 0,
  'MULTIPLE OF 12': x => num(x) % 12 === 0,
  'MULTIPLE OF 25': x => num(x) % 25 === 0,
  'MULTIPLE OF 5': x => num(x) % 5 === 0,
  'MULTIPLE OF 15': x => num(x) % 15 === 0,
  'FACTOR OF 36': x => 36 % num(x) === 0,
  'FACTOR OF 48': x => 48 % num(x) === 0,
  'FACTOR OF 60': x => 60 % num(x) === 0,
  'FACTOR OF 100': x => 100 % num(x) === 0,
  'FACTOR OF 72': x => 72 % num(x) === 0,
  'EVEN ANSWER': x => calc(x) % 2 === 0,
  'ADDS UP TO 10': x => calc(x) === 10,
  'MORE THAN 100': x => calc(x) > 100,
  'BELOW ZERO': x => calc(x) < 0,
  'MORE THAN 1': x => frac(x) > 1,
  'MORE THAN 0.5': x => Number(x) > 0.5,
  'LEAP YEAR': x => leap(num(x)),
  'OVER 100': x => fromRoman(x) > 100,
  'DOUBLE LETTER': x => /(.)\1/.test(lower(x)),
  'STARTS WITH A VOWEL': x => /^[aeiou]/.test(lower(x)),
  'NO REPEATED LETTER': x => new Set(lower(x)).size === lower(x).length,
  'FIVE LETTERS': x => lower(x).length === 5,
  'HAS AN X, Z OR Q': x => /[xzq]/.test(lower(x)),
};
