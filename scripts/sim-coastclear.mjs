// COAST CLEAR — THE GHOST RUN SIMULATION (CC2 — docs/coastclear.md "THE REWARDS"; the owner: GHOST RUN = a clear with ZERO spots under a time set so
// ≈ the best ~10 % of clean runs earn it). A HUMAN-PACED solver bot — never a perfect instant player — over many REAL boards (the real no-guess
// maker, api/_lib/cc-solve.js, each from its own seed): it plays the solver's own deductions round by round (the trace says which rule found each
// round) and spends a person's time on them:
//   · the first look at the opening (2.5–4.5 s)
//   · each round: spotting the deduction — a lone number (≈ 1.4 s), a pair of numbers (≈ 4.2 s), counting the lights left (≈ 7.5 s) — log-normal,
//     so some are quick and a few are slow
//   · each tap (a dig — a calm area opens in ONE tap — or a chord on a number whose lights are buoyed): ≈ 0.6 s a tap (finger travel, a tap's
//     accuracy on a 38-pt cell); chords save taps when two or more cells of a round sit around one number
//   · the lights it works out: ≈ 60 % get a buoy (a long-press, ≈ 0.75 s), the chords need theirs
//   · HESITATION: ~12 % of rounds a double-check (+2–8 s); now and then a longer stare at the board (+6–15 s, ~3 %)
//   · the answers' round trips are pipelined (the press never waits) — only the last one counts (≈ 0.2 s)
// It never digs a light (every move is proven), so every run is a ZERO-SPOT clear — exactly GHOST RUN's population.
//   node scripts/sim-coastclear.mjs [runs=3000] [seed=ghost]  → the time distribution + the threshold at the best ~10 %
import { makeBoard, solve } from '../api/_lib/cc-solve.js';
import { countsOf, flood, nbOf } from '../js/games/coastclear/logic.js';
import { rngFrom } from '../js/core/rng.js';
import { GHOST_S } from '../api/_lib/cc.js';

const RUNS = Number(process.argv[2] || 3000), SEED = process.argv[3] || 'ghost';
const rnd = rngFrom(`sim:${SEED}`);
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const logn = (median, sigma) => median * Math.exp(sigma * gauss());
const between = (a, b) => a + (b - a) * rnd();
const THINK = { single: [1.4, 0.55], pair: [4.2, 0.6], count: [7.5, 0.6] };

/** one human-paced run on a board → seconds (a zero-spot clear) */
function run(board) {
  const counts = countsOf(board), nb = nbOf(board.w, board.h);
  const opening = flood(board, counts, board.start);
  const sol = solve(board, counts, opening, { trace: true });
  if (!sol.solved) throw new Error('a maker board the solver cannot finish');
  // players differ (and a player's mornings differ): one pace factor for the whole run, log-normal ± 25 %
  const pace = logn(1, 0.25);
  let t = between(2.5, 4.5);
  const open = new Set(opening.map(c => c[0])), buoyed = new Set();
  for (const step of sol.log) {
    t += logn(...THINK[step.kind || 'single']) * pace;
    if (rnd() < 0.12) t += between(2, 8);
    if (rnd() < 0.03) t += between(6, 15);
    for (const c of step.lit) if (rnd() < 0.6) { buoyed.add(c); t += logn(0.75, 0.25) * pace; }
    // the taps: group the round's safe cells by an open number they all touch → a CHORD when ≥ 2 (its lights must be buoyed first)
    const todo = step.safe.filter(c => !open.has(c));
    const done = new Set();
    for (const c of todo) {
      if (done.has(c) || open.has(c)) continue;
      const hub = nb[c].find(j => open.has(j) && counts[j] > 0 && todo.filter(x => !done.has(x) && !open.has(x) && nb[j].includes(x)).length >= 2);
      if (hub != null) {
        for (const l of nb[hub]) if (counts[l] < 0 && !buoyed.has(l)) { buoyed.add(l); t += logn(0.75, 0.25) * pace; }
        t += logn(0.65, 0.3) * pace;
        for (const x of nb[hub]) if (counts[x] >= 0 && !open.has(x)) { for (const [y] of flood(board, counts, x, open)) open.add(y); done.add(x); }
      } else {
        t += logn(0.6, 0.3) * pace;
        for (const [y] of flood(board, counts, c, open)) open.add(y);
        done.add(c);
      }
    }
  }
  return t + 0.2;
}

const times = [];
let made = 0;
for (let k = 0; times.length < RUNS; k++) {
  const { board } = makeBoard(a => rngFrom(`sim-board:${SEED}:${k}:${a}`));
  made++;
  times.push(run(board));
}
times.sort((a, b) => a - b);
const pct = p => times[Math.min(times.length - 1, Math.floor(p * times.length))];
const fmt = x => { const s = Math.round(x); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const p10 = pct(0.10);
const share = s => (100 * times.filter(x => Math.round(x) <= s).length / times.length).toFixed(1);
// the threshold on a 5-second step: the step whose share of clean runs is closest to 10 %
const pick = [Math.floor(p10 / 5) * 5, Math.ceil(p10 / 5) * 5].sort((a, b) => Math.abs(share(a) - 10) - Math.abs(share(b) - 10))[0];
console.log(`COAST CLEAR — THE GHOST RUN SIMULATION: ${RUNS} human-paced zero-spot clears on ${made} real no-guess boards (seed ${SEED})`);
console.log(`  times: best ${fmt(times[0])} · p10 ${fmt(p10)} · p25 ${fmt(pct(0.25))} · median ${fmt(pct(0.5))} · p75 ${fmt(pct(0.75))} · p90 ${fmt(pct(0.9))} · slowest ${fmt(times[times.length - 1])}`);
console.log(`  the best ~10 %: under ${fmt(p10)} → on a 5-second step: ${pick} s (${fmt(pick)}) — ${share(pick)} % of clean runs earn it`);
console.log(`  the shipped GHOST_S (api/_lib/cc.js): ${GHOST_S} s (${fmt(GHOST_S)}) — ${share(GHOST_S)} % of clean runs at or under it`);
