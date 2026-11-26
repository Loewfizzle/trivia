// FREEFALL — THE BOT SIMS (F1 — docs/freefall.md "THE SIMS"): the four bots (SLOPPY · GOOD · GREAT · the HUMAN-PACED one) over N seeds
// each, SOLO (endless, stopped at SOLO_STOP floors) + MATCH (floor 200 / 3:00) — a table per bot: the FLOORS + the run's TIME (median /
// p10 / p90), % reaching floors 120 + 200, the time to floor 200 for those who do, what ended the runs (red · dark · made · cap), and how
// many earned TERMINAL VELOCITY, how many runs ended on the landing RIGHT AFTER A SHATTER, and the longest any run STAYED on one floor (the darkness takes a standing ball after lead × pace = 15 s). The numbers (tuning.js — BOUNCE, FALL, the layout's curves, the darkness) are tuned until the table
// hits the owner's targets: SLOPPY ≈ 20–50 floors · GOOD 120+ · GREAT on floor 200 in ≈ 2:30, most runs · nobody meets the darkness;
// a staller (no input) is caught within ~15–25 s.
//   node scripts/freefall-sim.mjs [seeds = 2000] [--json]
import { createRun, stepTo, isOver } from '../js/games/freefall/engine.js';
import { BOTS, BOT_IDS, makeBot, playBot } from '../js/games/freefall/bot.js';
import { TICK_HZ, BOUNCE, FALL, FIRST, BLAZE, DARK, MAX_SPIN, GEN, MODES, HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN, darkPaceAt } from '../js/games/freefall/tuning.js';

/** an endless SOLO run is stopped here (a bot that never slips would fall to the 30:00 cap) — the table says how many were */
export const SOLO_STOP = 600;
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** one bot, one mode, `n` seeds → its numbers (times in seconds) */
export function simBot(id, mode, n, tag = 's', rules = undefined, bots = BOTS) {
  const time = [], floor = [], to200 = [], causes = { red: 0, dark: 0, made: 0, cap: 0 };
  let r120 = 0, r200 = 0, stopped = 0, terminal = 0, bounces = 0, floors = 0, blazes = 0, afterShatter = 0, stayMax = 0, saves = 0, saved = 0, trench = 0;
  // (F3B — THE DARKNESS EASES WITH DEPTH: the longest stay on a floor from 100 down + from 160 down, how many runs got that deep, and the most of
  //  its own stall budget — lead × the pace AT THAT FLOOR — any stay ever used: 1 = caught)
  let stay100 = 0, stay160 = 0, deep100 = 0, deep160 = 0, used = 0, dark100 = 0;
  for (let i = 0; i < n; i++) {
    const seed = `${tag}${i}`, run = createRun({ seed, mode, rules }), bot = makeBot(bots[id], seed);
    // (floor by floor — to see how long a bot ever STAYS on one floor: THE DARKNESS needs lead × pace ticks to reach a ball that stands still)
    let done = false;
    while (!isOver(run) && run.floor < SOLO_STOP) {
      const at = run.at, on = run.floor;
      playBot(run, bot, { maxFloor: run.floor + 1 });
      const stay = (isOver(run) ? run.end : run.at) - at;
      if (stay > stayMax) stayMax = stay;
      if (on >= 100 && stay > stay100) stay100 = stay;
      if (on >= 160 && stay > stay160) stay160 = stay;
      const u = stay / (run.R.dark.lead * darkPaceAt(run.R, on));
      if (u > used) used = u;
      if (run.floor === BOTTOM_FLOOR && !done) { to200.push(run.at / TICK_HZ); done = true; }
    }
    if (!isOver(run)) stopped++; else causes[run.st === 'out' ? run.cause : run.st]++;
    if (run.cause === 'red' && run.sf === run.floor && run.R.shatterSafe !== true) afterShatter++;   // (a what-if row without rule b: out on the floor a shatter dropped the ball to)
    time.push((isOver(run) ? run.end : run.at) / TICK_HZ); floor.push(run.floor);
    if (run.floor >= HARBOR_FLOOR) r120++;
    if (run.floor >= 100) deep100++;
    if (run.floor >= 160) deep160++;
    if (run.cause === 'dark' && run.floor >= 100) dark100++;
    if (run.floor >= BOTTOM_FLOOR) r200++;
    if (run.maxNb >= TERMINAL_RUN) terminal++;
    bounces += run.bounces; floors += run.floor; blazes += run.blazes;
    saves += run.saves; if (run.saves) saved++;   // (F2 — the landing right after a shatter is never an out: how often that rule turned a red landing into a bounce)
    if (run.floor > BOTTOM_FLOOR) trench += run.floor - BOTTOM_FLOOR;
  }
  time.sort((a, b) => a - b); floor.sort((a, b) => a - b); to200.sort((a, b) => a - b);
  return {
    bot: id, mode, n, stopped, causes,
    time: { med: pct(time, 0.5), p10: pct(time, 0.1), p90: pct(time, 0.9) },
    floor: { med: pct(floor, 0.5), p10: pct(floor, 0.1), p90: pct(floor, 0.9) },
    r120: r120 / n, r200: r200 / n, terminal: terminal / n,
    perFloor: floors ? bounces / floors : 0, blazes: blazes / n, afterShatter: afterShatter / n, stayMax: stayMax / TICK_HZ,
    saves: saves / n, saved: saved / n, trench: r200 ? trench / r200 : 0,
    stay100: stay100 / TICK_HZ, stay160: stay160 / TICK_HZ, deep100, deep160, dark100, used,
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
    console.log(`FREEFALL — the bot sims · ${n} seeds a bot · FIRST ${FIRST} · BOUNCE ${BOUNCE} · FALL ${FALL} · BLAZE ${BLAZE} · MAX SPIN ${MAX_SPIN} · DARK grace ${DARK.grace} pace ${DARK.pace} lead ${DARK.lead} (easing over floors ${DARK.easeFrom}–${DARK.easeTo} to ${DARK.paceDeep}) · match cap ${mmss(MODES.match.capTicks / TICK_HZ)}`);
    console.log(`gaps ${JSON.stringify(GEN.gaps)} · wide ${JSON.stringify(GEN.wide)} · red ${JSON.stringify(GEN.red)} · hug ${JSON.stringify(GEN.hug)}`);
    console.log(`bots ${BOT_IDS.map(id => `${id} ${JSON.stringify(BOTS[id])}`).join(' · ')}`);
    console.log('| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | saved by the shatter rule (runs · a run) | the longest stay on a floor | TERMINAL | bounces a floor |');
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      const c = r.causes, p = v => `${(v * 100 / r.n).toFixed(1)} %`;
      console.log(`| ${r.mode} | ${r.bot} | ${r.floor.med} (${r.floor.p10}–${r.floor.p90}) | ${mmss(r.time.med)} (${mmss(r.time.p10)}–${mmss(r.time.p90)}) | ${(r.r120 * 100).toFixed(1)} % | ${(r.r200 * 100).toFixed(1)} % | ${r.to200 ? `${mmss(r.to200.med)} (${mmss(r.to200.p10)}–${mmss(r.to200.p90)})` : '—'} | ${p(c.red)} · ${p(c.dark)} · ${p(c.made)} · ${p(c.cap)} | ${(r.saved * 100).toFixed(1)} % · ${r.saves.toFixed(2)} | ${r.stayMax.toFixed(1)} s | ${(r.terminal * 100).toFixed(1)} % | ${r.perFloor.toFixed(2)} |${r.stopped ? ` (${r.stopped} stopped at floor ${SOLO_STOP})` : ''}`);
    }
    console.log(`THE STALLER (no input, ${stall.n} seeds): the darkness takes ${stall.dark} of ${stall.n} runs, between ${stall.lo.toFixed(1)} s and ${stall.hi.toFixed(1)} s`);
    // F3B — THE DARKNESS EASES WITH DEPTH: the deep numbers (a stopped ball: lead × the pace at its floor — 6 s down to floor 100, 8 s from 160)
    console.log('THE DARKNESS BY DEPTH | mode | bot | runs past floor 100 · 160 | the longest stay on a floor from 100 down · from 160 down | out in the dark from floor 100 down | the most of its stall budget any stay used |');
    for (const r of rows) console.log(`| ${r.mode} | ${r.bot} | ${r.deep100} · ${r.deep160} | ${r.stay100.toFixed(1)} s · ${r.stay160.toFixed(1)} s | ${r.dark100} | ${(r.used * 100).toFixed(0)} % |`);
    const budget = f => (DARK.lead * darkPaceAt({ dark: DARK }, f) / TICK_HZ).toFixed(2);
    console.log(`A STOPPED BALL HAS: floor 0 ${budget(0)} s · 100 ${budget(100)} s · 115 ${budget(115)} s · 130 ${budget(130)} s · 145 ${budget(145)} s · 160 ${budget(160)} s · 240 ${budget(240)} s`);
  }
}
