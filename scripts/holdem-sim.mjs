// HOLD'EM (HE1) — THE MATCH-LENGTH STUDY: realistic tournaments on the real engine with THE TEST ROBOTS, timed
// like people at a table (tests/fixtures/holdem-driver.mjs#PACE: 3–8 s a decision, a deal pause, a pause per
// street + at the end of a hand). Reports the median + 90th-percentile length for 2 / 4 / 6 / 8 players at
// TURBO / STANDARD / DEEP. Not part of npm test (minutes, not seconds).
//   node scripts/holdem-sim.mjs                  the table (default 40 / 24 / 12 matches per cell)
//   node scripts/holdem-sim.mjs --runs=10        fewer runs (a quick look)
//   node scripts/holdem-sim.mjs --turbo=150      "what if" TURBO's level were 150 s (TURBO only)
//   node scripts/holdem-sim.mjs --only=turbo     one speed
import { runMatch, PACE } from '../tests/fixtures/holdem-driver.mjs';
import { SPEEDS } from '../js/games/holdem/structure.js';
import { rngFrom } from '../js/core/rng.js';

const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1];
const runs = arg('runs') ? +arg('runs') : null;
const turbo = arg('turbo') ? +arg('turbo') * 1000 : null;
const only = arg('only');
const RUNS = { turbo: 40, standard: 24, deep: 40 };   // (HE2: DEEP 12 → 40 runs — 12 left the 6 / 8-player medians out of order)
// a party table: mostly tight / loose / calling players, a few wild ones
const MIX = [['tight', 30], ['loose', 35], ['station', 20], ['maniac', 10], ['shover', 5]];
function stylesFor(seed, n) {
  const r = rngFrom(`styles:${seed}`), sum = MIX.reduce((a, [, w]) => a + w, 0);
  return Array.from({ length: n }, () => { let x = r() * sum; for (const [s, w] of MIX) { if ((x -= w) < 0) return s; } return 'tight'; });
}
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const min = ms => (ms / 60000).toFixed(1);

console.log(`HOLD'EM length study — pace: ${PACE.thinkMin / 1000}–${PACE.thinkMax / 1000} s a decision, deal ${PACE.deal / 1000} s, street ${PACE.street / 1000} s, end ${PACE.end / 1000}–${PACE.showdown / 1000} s`);
if (turbo) console.log(`TURBO level time overridden: ${turbo / 1000} s (was ${SPEEDS.turbo.levelMs / 1000} s)`);
console.log('speed     players  runs  median min  p90 min  median hands');
const t0 = Date.now();
for (const speed of ['turbo', 'standard', 'deep']) {
  if (only && only !== speed) continue;
  for (const n of [2, 4, 6, 8]) {
    const k = runs || RUNS[speed], lens = [], hands = [];
    for (let i = 0; i < k; i++) {
      const seed = `len-${speed}-${n}-${i}`;
      const r = runMatch({ mode: 'tournament', speed, n, seed, styles: stylesFor(seed, n), paced: true, check: false, sleepy: 0.01,
        levelMs: speed === 'turbo' ? turbo : null });
      if (!r.match.ended) throw new Error(`${seed} did not end`);
      lens.push(r.ms); hands.push(r.stats.hands);
    }
    console.log(`${speed.padEnd(9)} ${String(n).padStart(7)} ${String(k).padStart(5)} ${min(q(lens, 0.5)).padStart(11)} ${min(q(lens, 0.9)).padStart(8)} ${String(q(hands, 0.5)).padStart(13)}`);
  }
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s of computing)`);
