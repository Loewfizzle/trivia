// SMOOTH — THE TESTS SEE STUTTER: every perf run's frames read the same way (`js/games/jaywalk/lab-hud-stats.js`, the phone meter's own numbers):
// p50 · p95 · p99 · worst · dropped (> 20 ms) · big (> 33 ms), and a budget on the dropped frames. The median alone can't see a stutter.
import { frameStats } from '../../../js/games/jaywalk/lab-hud-stats.js';

/** the budget, from the measured baseline on the Beelink (docs/games/passes/jaywalk-smooth.md): a share of the run's frames, so a run's length
 *  doesn't move it. `minFrames`: a shorter sample only reports. */
export const FRAME_BUDGET = Object.freeze({ dropPct: 3, bigPct: 1.5, minFrames: 120 });

export function stutterOf(list) {
  const s = frameStats(list), k = s.n ? 100 / s.n : 0;
  return { ...s, dropPct: s.drops * k, bigPct: s.big * k };
}
export const stutterLine = s => `${s.n} frames · p50 ${s.p50.toFixed(1)} · p95 ${s.p95.toFixed(1)} · p99 ${s.p99.toFixed(1)} · worst ${s.worst.toFixed(1)} ms · ${s.drops} dropped (${s.dropPct.toFixed(1)} %) · ${s.big} big (${s.bigPct.toFixed(1)} %)`;

/** prints the line; `budget` null = report only (a throttle past what a phone is) */
export function frameCheck(ok, label, list, budget = FRAME_BUDGET) {
  const s = stutterOf(list);
  console.log(`     FRAMES ${label}: ${stutterLine(s)}`);
  if (budget && s.n >= budget.minFrames) ok(s.dropPct <= budget.dropPct && s.bigPct <= budget.bigPct, `${label}: dropped frames within the budget (${s.dropPct.toFixed(1)} % of ≤ ${budget.dropPct} · big ${s.bigPct.toFixed(1)} % of ≤ ${budget.bigPct})`);
  return s;
}
