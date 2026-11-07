// THE PASSWORD — THE SAFECRACKER SIMULATION (PW2 — docs/password.md "SAFECRACKER"): a solver bot playing LIKE A HUMAN over the real answer list,
// thousands of runs → the share of runs that crack both doors in ≤ 6 guesses combined (the card's threshold; the owner wants ≈ the best ~10 %).
//   node scripts/sim-password.mjs [runs=4000] [seed=7]
// THE BOT (not an optimal solver — a decent regular): a sensible opener (one of the usual starters), then a guess CONSISTENT with every mark so
// far, drawn from COMMON words (the answer list itself = what a person thinks of first; a slip of the tongue now and then reaches for any
// valid 5-letter word); its slips: ~8 % of guesses ignore one constraint (a letter it forgot), ~10 % pick a less common word. Door 2 starts
// fresh (a new opener). PURE: the real judge (logic.js), the real lists (api/_data/pw/ — read here only; nothing served).
import { readFileSync } from 'node:fs';
import { judge, HIT, NEAR, MISS } from '../js/games/password/logic.js';

const DATA = new URL('../api/_data/pw/', import.meta.url);
const answers = JSON.parse(readFileSync(new URL('answers.json', DATA), 'utf8')).words.map(w => w.toUpperCase());
const validAll = [...new Set(String(JSON.parse(readFileSync(new URL('valid-5.json', DATA), 'utf8'))).toUpperCase().match(/.{5}/g) || [])];
const RUNS = Number(process.argv[2]) || 4000, SEED = Number(process.argv[3]) || 7;
const OPENERS = ['CRANE', 'SLATE', 'TRACE', 'ADIEU', 'AUDIO', 'STARE', 'RAISE', 'ARISE', 'LATER', 'IRATE', 'HOUSE', 'TEARS', 'ROAST', 'STEAM', 'PLANT'];

// a seeded RNG (mulberry32)
let s = SEED >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

/** is `w` consistent with guess g's marks m (a hard-mode human: keeps every hit, every near elsewhere, no missed letter beyond its count)? */
function consistent(w, g, m, forgot = -1) {
  const need = {}, cap = {};
  for (let i = 0; i < 5; i++) {
    if (i === forgot) continue;
    if (m[i] === HIT) { if (w[i] !== g[i]) return false; need[g[i]] = (need[g[i]] || 0) + 1; }
    else if (m[i] === NEAR) { if (w[i] === g[i]) return false; need[g[i]] = (need[g[i]] || 0) + 1; }
  }
  for (let i = 0; i < 5; i++) if (i !== forgot && m[i] === MISS) cap[g[i]] = need[g[i]] || 0;
  const have = {};
  for (const ch of w) have[ch] = (have[ch] || 0) + 1;
  for (const [ch, n] of Object.entries(need)) if ((have[ch] || 0) < n) return false;
  for (const [ch, n] of Object.entries(cap)) if ((have[ch] || 0) > n) return false;
  return true;
}
/** one door: → the guesses it took (1…6), or 0 = held */
function playDoor(answer) {
  const hist = [];
  for (let n = 1; n <= 6; n++) {
    let g;
    if (n === 1) g = pick(OPENERS);
    else {
      const slip = rnd() < 0.08 ? Math.floor(rnd() * 5) : -1;                        // a forgotten constraint on one letter of the LAST guess
      const pool = rnd() < 0.1 ? validAll : answers;
      let cands = pool.filter(w => hist.every(([hg, hm], i) => consistent(w, hg, hm, i === hist.length - 1 ? slip : -1)));
      if (!cands.length) cands = answers.filter(w => hist.every(([hg, hm]) => consistent(w, hg, hm)));
      if (!cands.length) cands = validAll.filter(w => hist.every(([hg, hm]) => consistent(w, hg, hm)));
      g = cands.length ? pick(cands) : pick(answers);
    }
    const m = judge(answer, g);
    if (m.every(x => x === HIT)) return n;
    hist.push([g, m]);
  }
  return 0;
}

const hist = new Array(13).fill(0);
let cracks = 0, safe = 0, door1 = 0;
for (let r = 0; r < RUNS; r++) {
  const a = pick(answers); let b = pick(answers); while (b === a) b = pick(answers);
  const n1 = playDoor(a);
  if (!n1) continue;
  door1++;
  const n2 = playDoor(b);
  if (!n2) continue;
  cracks++;
  hist[n1 + n2]++;
  if (n1 + n2 <= 6) safe++;
}
const pct = x => `${(100 * x / RUNS).toFixed(1)} %`;
console.log(`THE PASSWORD — ${RUNS} bot runs over ${answers.length} answers (seed ${SEED})`);
console.log(`  door 1 opened ${pct(door1)} · both doors ${pct(cracks)} · BOTH IN ≤ 6 (SAFECRACKER) ${pct(safe)}`);
console.log('  total guesses of a crack:', hist.map((n, i) => (n ? `${i}: ${(100 * n / RUNS).toFixed(1)}%` : null)).filter(Boolean).join(' · '));
console.log('  the share of ALL runs at ≤ 6:', pct(safe), safe / RUNS < 0.05 ? '(UNDER 5 % — far off ~10 %)' : safe / RUNS > 0.2 ? '(OVER 20 % — far off ~10 %)' : '(near ~10 %)');
