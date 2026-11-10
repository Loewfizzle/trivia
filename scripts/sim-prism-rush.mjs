// PFIX-B (FABLE REVIEW finding 9) — THE SCORE RUSH BOUND, from a sim: full-skill bot runs (bot.js, skill 1) on the REAL engine in SCORE RUSH,
// one run per seed per song length (every song in data/prism/manifest.json — the day songs too), at a fast human pace (PPS pieces a second —
// a piece placed + hard-dropped every 1000 / PPS ms). Prints the best score + lines per song, the fitted rates, and checks the bound in
// core/match-report.js (maxRushScore / maxRushLines) sits at ≈ 3 × the best run — never under it.
//   node scripts/sim-prism-rush.mjs [runs=12] [pps=3]
import { readFileSync } from 'node:fs';
import * as E from '../js/games/prism/engine.js';
import { chooseMove } from '../js/games/prism/bot.js';
import { rngFrom } from '../js/core/rng.js';
import { maxRushScore, maxRushLines, RUSH_PACE } from '../js/core/match-report.js';

const RUNS = Number(process.argv[2]) || 12;
const PPS = Number(process.argv[3]) || RUSH_PACE.pps;

/** one SCORE RUSH run of `sec` seconds: { sc, ln, pieces } */
export function rushRun(seed, sec, pps = PPS) {
  const g = E.createEngine({ seed, mode: 'rush', level: 1 });
  E.start(g);
  const rnd = rngFrom(`${seed}:bot`);
  const every = 1000 / pps;
  let t = 0;
  while (t < sec * 1000) {
    if (g.over) {   // REBOOT (view.js#onTopOut): the board resets, the score stays
      g.cells.fill(0); g.over = false; g.pending = []; g.combo = -1; g.b2b = false; g.n++; E.spawn(g);
      t += 1400;
      continue;
    }
    if (g.cur) {
      const mv = chooseMove(g, { skill: 1, rnd });
      if (mv) {
        while (g.cur && g.cur.r !== mv.r) if (!E.rotate(g, 1)) break;
        while (g.cur && g.cur.x !== mv.x) if (!E.move(g, Math.sign(mv.x - g.cur.x))) break;
      }
      if (g.cur) E.hardDrop(g);
    }
    E.update(g, every);
    E.takeEvents(g);
    t += every;
  }
  return { sc: g.score, ln: g.lines, pieces: g.stats.pieces };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^\/?/, '/')}` || process.argv[1].endsWith('sim-prism-rush.mjs')) {
  const songs = JSON.parse(readFileSync(new URL('../data/prism/manifest.json', import.meta.url), 'utf8')).songs;
  console.log(`SCORE RUSH — ${RUNS} full-skill bot runs per song, ${PPS} pieces / s`);
  let worst = Infinity, worstLn = Infinity;
  for (const s of songs) {
    const sec = s.duration;
    let best = { sc: 0, ln: 0 }, bestLn = 0;
    for (let k = 0; k < RUNS; k++) {
      const r = rushRun(`sim-${s.id}-${k}`, sec);
      if (r.sc > best.sc) best = r;
      bestLn = Math.max(bestLn, r.ln);
      if (maxRushScore(r.ln, sec) < r.sc) { console.error(`${s.id}: the line ceiling is under an honest run`); process.exit(1); }
    }
    const bound = maxRushScore(Infinity, sec), lb = maxRushLines(sec);   // (the time curve alone — the line ceiling is no limit here)
    worst = Math.min(worst, bound / best.sc);
    worstLn = Math.min(worstLn, lb / bestLn);
    console.log(`${s.id.padEnd(8)} ${sec.toFixed(1).padStart(6)} s · best ${String(best.sc).padStart(9)} pts ${String(bestLn).padStart(4)} lines · bound ${String(bound).padStart(9)} (${(bound / best.sc).toFixed(2)}×) · lines ≤ ${lb} (${(lb / bestLn).toFixed(2)}×)`);
  }
  console.log(`the smallest margins over the best runs: score ${worst.toFixed(2)}× · lines ${worstLn.toFixed(2)}×`);
  if (worstLn < 1.5) { console.error('the lines bound is too close to honest play'); process.exit(1); }
  if (worst < 2.5) { console.error('the bound is too close to honest play'); process.exit(1); }
}
