// HIGH RISE — THE BOT SIMS (S1 — docs/highrise.md "THE SIMS"): the four bots (σ 60 / 40 / 25 / 10 ms) over N seeds each, SOLO (endless)
// + MATCH (floor 200 / 6:00) — a table per bot: the survival TIME + FLOOR (median / p10 / p90), % reaching floors 60 + 200, the time to
// floor 200 for those who do. THE SPEED CURVE (tuning.js#SWEEP) is tuned until the table hits the owner's targets:
//   sloppy median 30–60 s · good median 2–3 min · near-perfect floor 200 in ≈ 3:00–4:00, most of its runs · casual between.
//   node scripts/highrise-sim.mjs [seeds = 2000] [--json]
// (an endless SOLO run is stopped at floor SOLO_STOP — S1: a bot that never slipped never ended; S2's SOLO PAST 200 tightening ends
//  every run long before it — the table still says if any was stopped)
import { createRun, isOver } from '../js/games/highrise/engine.js';
import { BOTS, BOT_IDS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { TICK_HZ, SWEEP, TIGHT, WOBBLE, PERFECT, GROW, GROW_STREAK, BEAT, MODES, CLOUDS_FLOOR, TOP_FLOOR } from '../js/games/highrise/tuning.js';

export const SOLO_STOP = 1200;
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** one bot, one mode, `n` seeds → its numbers (times in seconds) */
export function simBot(id, mode, n, tag = 's') {
  const time = [], floor = [], to200 = [];
  let r60 = 0, r200 = 0, stopped = 0;
  for (let i = 0; i < n; i++) {
    const seed = `${tag}${i}`, run = createRun({ seed, mode }), bot = gaussBot({ sigmaMs: BOTS[id], seed });
    playBot(run, bot, { maxFloor: TOP_FLOOR });
    if (run.floor >= TOP_FLOOR) to200.push(run.at / TICK_HZ);
    if (!isOver(run)) playBot(run, bot, { maxFloor: SOLO_STOP });
    if (!isOver(run)) stopped++;
    time.push((isOver(run) ? run.end : run.at) / TICK_HZ); floor.push(run.floor);
    if (run.floor >= CLOUDS_FLOOR) r60++;
    if (run.floor >= TOP_FLOOR) r200++;
  }
  time.sort((a, b) => a - b); floor.sort((a, b) => a - b); to200.sort((a, b) => a - b);
  return {
    bot: id, sigma: BOTS[id], mode, n, stopped,
    time: { med: pct(time, 0.5), p10: pct(time, 0.1), p90: pct(time, 0.9) },
    floor: { med: pct(floor, 0.5), p10: pct(floor, 0.1), p90: pct(floor, 0.9) },
    r60: r60 / n, r200: r200 / n,
    to200: to200.length ? { med: pct(to200, 0.5), p10: pct(to200, 0.1), p90: pct(to200, 0.9) } : null,
  };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const n = Number(process.argv.slice(2).find(a => /^\d+$/.test(a))) || 2000, json = process.argv.includes('--json'), rows = [];
  for (const mode of ['solo', 'match']) for (const id of BOT_IDS) rows.push(simBot(id, mode, n));
  if (json) console.log(JSON.stringify(rows));
  else {
    console.log(`HIGH RISE — the bot sims · ${n} seeds a bot · SWEEP ${JSON.stringify(SWEEP)} ±${WOBBLE} · past floor ${TIGHT.from}: −${TIGHT.by} every ${TIGHT.every} floors, ≥ ${TIGHT.min} · PERFECT ${PERFECT} · GROW ${GROW} after ${GROW_STREAK} · BEAT ${BEAT} · match cap ${mmss(MODES.match.capTicks / TICK_HZ)}`);
    console.log('| mode | bot | σ ms | time med (p10–p90) | floor med (p10–p90) | ≥ 60 | ≥ 200 | to floor 200 med (p10–p90) |');
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      console.log(`| ${r.mode} | ${r.bot} | ${r.sigma} | ${mmss(r.time.med)} (${mmss(r.time.p10)}–${mmss(r.time.p90)}) | ${r.floor.med} (${r.floor.p10}–${r.floor.p90}) | ${(r.r60 * 100).toFixed(1)} % | ${(r.r200 * 100).toFixed(1)} % | ${r.to200 ? `${mmss(r.to200.med)} (${mmss(r.to200.p10)}–${mmss(r.to200.p90)})` : '—'} |${r.stopped ? ` (${r.stopped} stopped at floor ${SOLO_STOP})` : ''}`);
    }
  }
}
