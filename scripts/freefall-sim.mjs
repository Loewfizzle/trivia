// FREEFALL — THE BOT SIMS (F1 — docs/freefall.md "THE SIMS"): the four bots (SLOPPY · GOOD · GREAT · the HUMAN-PACED one) over N seeds
// each, SOLO (endless, stopped at SOLO_STOP floors) + MATCH (floor 200 / 3:00) — a table per bot: the FLOORS + the run's TIME (median /
// p10 / p90), % reaching floors 120 + 200, the time to floor 200 for those who do, what ended the runs (red · dark · made · cap), and how
// many earned TERMINAL VELOCITY, how many runs ended on the landing RIGHT AFTER A SHATTER, and the longest any run STAYED on one floor (the darkness takes a standing ball after lead × pace = 15 s). The numbers (tuning.js — BOUNCE, FALL, the layout's curves, the darkness) are tuned until the table
// hits the owner's targets: SLOPPY ≈ 20–50 floors · GOOD 120+ · GREAT on floor 200 in ≈ 2:30, most runs · nobody meets the darkness;
// a staller (no input) is caught within ~15–25 s.
//   node scripts/freefall-sim.mjs [seeds = 2000] [--json]
import { createRun, stepTo, isOver } from '../js/games/freefall/engine.js';
import { BOTS, BOT_IDS, makeBot, playBot } from '../js/games/freefall/bot.js';
import { TICK_HZ, BOUNCE, FALL, FIRST, BLAZE, DARK, MAX_SPIN, GEN, MODES, HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN } from '../js/games/freefall/tuning.js';

/** an endless SOLO run is stopped here (a bot that never slips would fall to the 30:00 cap) — the table says how many were */
export const SOLO_STOP = 600;
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** one bot, one mode, `n` seeds → its numbers (times in seconds) */
export function simBot(id, mode, n, tag = 's', rules = undefined, bots = BOTS) {
  const time = [], floor = [], to200 = [], causes = { red: 0, dark: 0, made: 0, cap: 0 };
  let r120 = 0, r200 = 0, stopped = 0, terminal = 0, bounces = 0, floors = 0, blazes = 0, afterShatter = 0, stayMax = 0;
  for (let i = 0; i < n; i++) {
    const seed = `${tag}${i}`, run = createRun({ seed, mode, rules }), bot = makeBot(bots[id], seed);
    // (floor by floor — to see how long a bot ever STAYS on one floor: THE DARKNESS needs lead × pace ticks to reach a ball that stands still)
    let done = false;
    while (!isOver(run) && run.floor < SOLO_STOP) {
      const at = run.at;
      playBot(run, bot, { maxFloor: run.floor + 1 });
      const stay = (isOver(run) ? run.end : run.at) - at;
      if (stay > stayMax) stayMax = stay;
      if (run.floor === BOTTOM_FLOOR && !done) { to200.push(run.at / TICK_HZ); done = true; }
    }
    if (!isOver(run)) stopped++; else causes[run.st === 'out' ? run.cause : run.st]++;
    if (run.cause === 'red' && run.sf === run.floor) afterShatter++;   // (out on the landing right after a shatter)
    time.push((isOver(run) ? run.end : run.at) / TICK_HZ); floor.push(run.floor);
    if (run.floor >= HARBOR_FLOOR) r120++;
    if (run.floor >= BOTTOM_FLOOR) r200++;
    if (run.maxNb >= TERMINAL_RUN) terminal++;
    bounces += run.bounces; floors += run.floor; blazes += run.blazes;
  }
  time.sort((a, b) => a - b); floor.sort((a, b) => a - b); to200.sort((a, b) => a - b);
  return {
    bot: id, mode, n, stopped, causes,
    time: { med: pct(time, 0.5), p10: pct(time, 0.1), p90: pct(time, 0.9) },
    floor: { med: pct(floor, 0.5), p10: pct(floor, 0.1), p90: pct(floor, 0.9) },
    r120: r120 / n, r200: r200 / n, terminal: terminal / n,
    perFloor: floors ? bounces / floors : 0, blazes: blazes / n, afterShatter: afterShatter / n, stayMax: stayMax / TICK_HZ,
    to200: to200.length ? { med: pct(to200, 0.5), p10: pct(to200, 0.1), p90: pct(to200, 0.9) } : null,
  };
}

/** THE STALLER: nobody touches the screen → the tick the darkness takes the run (over `n` seeds: the earliest + the latest, in seconds) */
export function simStaller(n, mode = 'solo', tag = 's', rules = undefined) {
  let lo = Infinity, hi = 0, dark = 0;
  for (let i = 0; i < n; i++) {
    const run = createRun({ seed: `${tag}${i}`, mode, rules });
    stepTo(run, run.R.modes[mode].capTicks);
    if (run.cause === 'dark') dark++;
    const s = run.end / TICK_HZ;
    if (s < lo) lo = s; if (s > hi) hi = s;
  }
  return { n, dark, lo, hi };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const n = Number(process.argv.slice(2).find(a => /^\d+$/.test(a))) || 2000, json = process.argv.includes('--json'), rows = [];
  for (const mode of ['solo', 'match']) for (const id of BOT_IDS) rows.push(simBot(id, mode, n));
  const stall = simStaller(n);
  if (json) console.log(JSON.stringify({ rows, stall }));
  else {
    console.log(`FREEFALL — the bot sims · ${n} seeds a bot · FIRST ${FIRST} · BOUNCE ${BOUNCE} · FALL ${FALL} · BLAZE ${BLAZE} · MAX SPIN ${MAX_SPIN} · DARK grace ${DARK.grace} pace ${DARK.pace} lead ${DARK.lead} · match cap ${mmss(MODES.match.capTicks / TICK_HZ)}`);
    console.log(`gaps ${JSON.stringify(GEN.gaps)} · wide ${JSON.stringify(GEN.wide)} · red ${JSON.stringify(GEN.red)} · hug ${JSON.stringify(GEN.hug)}`);
    console.log(`bots ${BOT_IDS.map(id => `${id} ${JSON.stringify(BOTS[id])}`).join(' · ')}`);
    console.log('| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | out right after a shatter | the longest stay on a floor | TERMINAL | bounces a floor |');
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      const c = r.causes, p = v => `${(v * 100 / r.n).toFixed(1)} %`;
      console.log(`| ${r.mode} | ${r.bot} | ${r.floor.med} (${r.floor.p10}–${r.floor.p90}) | ${mmss(r.time.med)} (${mmss(r.time.p10)}–${mmss(r.time.p90)}) | ${(r.r120 * 100).toFixed(1)} % | ${(r.r200 * 100).toFixed(1)} % | ${r.to200 ? `${mmss(r.to200.med)} (${mmss(r.to200.p10)}–${mmss(r.to200.p90)})` : '—'} | ${p(c.red)} · ${p(c.dark)} · ${p(c.made)} · ${p(c.cap)} | ${(r.afterShatter * 100).toFixed(1)} % | ${r.stayMax.toFixed(1)} s | ${(r.terminal * 100).toFixed(1)} % | ${r.perFloor.toFixed(2)} |${r.stopped ? ` (${r.stopped} stopped at floor ${SOLO_STOP})` : ''}`);
    }
    console.log(`THE STALLER (no input, ${stall.n} seeds): the darkness takes ${stall.dark} of ${stall.n} runs, between ${stall.lo.toFixed(1)} s and ${stall.hi.toFixed(1)} s`);
  }
}
