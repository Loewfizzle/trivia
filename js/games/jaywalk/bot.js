// JAYWALK — THE BOTS (H1): they play through the REAL engine (a look-ahead on a copy of the run), for the whole-run simulations
// (tests/jaywalk-sim.test.mjs) and the lab page's frame-rate measure. PURE (their own seeded rng — never Math.random).
import { rngFrom, hashString } from '../../core/rng.js';
import { step, isOver } from './engine.js';
import { FP, WALL, MID_COL } from './tuning.js';

const copy = run => ({ ...run, near: { ...run.near }, took: { ...run.took } });
/** does the kid live through `d` now + `look` idle ticks after it? (and really move, when a hop was asked) */
function survives(run, course, d, look) {
  const c = copy(run), hits = c.hits;
  step(c, course, d);
  if (d && c.st !== 'hop') return false;   // (a bump)
  for (let i = 0; i < look && c.hits === hits && !isOver(c); i++) step(c, course, '');
  return c.hits === hits;
}

/** THE GREEDY BOT: forward whenever it lives; an obstacle ahead → a DETOUR to the centre column (always free on grass — sideways, or back a
 *  lane out of a pocket); else wait, else sideways / back; a long wait on one lane → a sidestep (another column, another gap).
 *  `lazy` = it only moves on when the wall is close (it stays in the easy lanes). */
export function greedyBot({ look = 22, lazy = false, seed = 'bot' } = {}) {
  const rand = rngFrom(hashString(`jwbot:${seed}`));
  let at = -1, since = 0, detour = false;
  return (run, course) => {
    if (run.st !== 'idle') return '';
    if (run.y !== at) { at = run.y; since = run.t; }
    const gap = run.y - Math.floor(run.wall / FP);
    const hurry = !lazy || gap <= WALL.behind - 2;
    if (hurry) {
      const here = course.lane(run.y), next = course.lane(run.y + 1), col = Math.floor(run.x / FP);
      if (here.type !== 'water' && next.type === 'grass' && next.obs[col]) detour = true;
      if (col === MID_COL || here.type === 'water') detour = false;
      if (detour) {
        const d = col < MID_COL ? 'r' : 'l', c2 = col + (d === 'r' ? 1 : -1);
        if (here.type === 'grass' && here.obs[c2]) { if (survives(run, course, 'd', look)) return 'd'; }   // (a pocket: back out of it)
        else if (survives(run, course, d, look)) return d;
      } else {
        if (survives(run, course, 'u', look)) return 'u';
        if (run.t - since > 100 && (run.t - since) % 20 === 0) { const d = rand() < 0.5 ? 'l' : 'r'; if (survives(run, course, d, look)) return d; }
      }
    }
    if (survives(run, course, '', look)) return '';
    const side = rand() < 0.5 ? ['l', 'r'] : ['r', 'l'];
    for (const d of [...side, 'u', 'd']) if (survives(run, course, d, look)) return d;
    return hurry ? 'u' : '';
  };
}
/** THE RANDOM BOT: a hop every few ticks, mostly forward */
export function randomBot({ seed = 'r', every = 10 } = {}) {
  const rand = rngFrom(hashString(`jwrand:${seed}`));
  return run => {
    if (run.st !== 'idle' || run.t % every) return '';
    const r = rand();
    return r < 0.62 ? 'u' : r < 0.78 ? 'l' : r < 0.94 ? 'r' : 'd';
  };
}

/** play a run with a bot for at most `ticks` → the hop log it made (the run is stepped in place) */
export function playBot(run, course, bot, ticks) {
  const log = [];
  let last = -9;
  for (let i = 0; i < ticks && !isOver(run); i++) {
    let d = bot(run, course);
    if (d && run.t - last < 2) d = '';
    if (d) { log.push({ t: run.t, d }); last = run.t; }
    step(run, course, d);
  }
  return log;
}
