// HIGH RISE — THE BOTS (S1 — docs/highrise.md "THE SIMS"): the sim players. Each AIMS AT THE PERFECT MOMENT of every slab (half a
// sweep after it enters — dead on the tower) and taps with a GAUSSIAN TIMING ERROR σ (ms), from its own seeded rng — never Math.random.
// They play through the REAL engine (tap + stepTo): what they log is what the judge replays. Not rules: a float is fine here.
import { rngFrom, hashString } from '../../core/rng.js';
import { TICK_HZ, FUSE_SWEEPS } from './tuning.js';
import { stepTo, tap, isOver } from './engine.js';

/** THE FOUR BOTS: their timing error σ in ms */
export const BOTS = Object.freeze({ sloppy: 60, casual: 40, good: 25, nearPerfect: 10 });
export const BOT_IDS = Object.freeze(Object.keys(BOTS));

/** a bot: (run, with a slab sliding) → the tick it taps at (always while that slab slides) */
export function gaussBot({ sigmaMs = 25, seed = 'bot' } = {}) {
  const rand = rngFrom(hashString(`hibot:${seed}:${sigmaMs}`));
  const gauss = () => { let u = rand(); if (u < 1e-12) u = 1e-12; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };   // (Box–Muller)
  return run => {
    const t = Math.round(run.s0 + run.S / 2 + gauss() * sigmaMs * TICK_HZ / 1000);
    const lo = run.s0, hi = run.s0 + FUSE_SWEEPS * run.S - 1;
    return t < lo ? lo : t > hi ? hi : t;
  };
}

/** play `run` on with `bot` until it ends (or it stands on `maxFloor`) → the taps it made (the run is stepped in place; call again to go on) */
export function playBot(run, bot, { maxFloor = Infinity } = {}) {
  const taps = [];
  while (!isOver(run) && run.floor < maxFloor) {
    stepTo(run, run.s0);                       // (the next slab enters — or THE CAP ends the run first)
    if (run.st !== 'slide') break;
    const t = bot(run);
    if (!tap(run, t)) break;                   // (THE CAP came before its tap)
    taps.push(t);
  }
  return taps;
}
