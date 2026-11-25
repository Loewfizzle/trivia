// FREEFALL — THE BOTS (F1 — docs/freefall.md "THE SIMS"): the sim players. A bot plays FLIGHT BY FLIGHT, as a person does:
//   · ON A BOUNCE it picks the gap it can get to (the shortest turn that crosses no wall of red), waits a moment, then spins the tower
//     towards it at its own top speed — with an AIMING ERROR (Gaussian, wider for a longer turn). When it can not get there before the
//     landing, a CAREFUL bot stops on the best solid ground on the way; a careless one is caught wherever it is.
//   · IN A FALL (a new floor coming up) it mostly lets the ball land: it only DARES an air-steer to a gap that is close (its `dare`) and
//     that it saw coming (its `ahead`); if the spot straight below is red it must get off it — after its REACTION, unless it looked ahead.
//   · WITH THE BLAZE LIT it thinks of the landing AFTER the shatter.
// Every roll comes from the bot's own seeded rng, never Math.random. They play through the REAL engine (turn + stepTo): what they log is
// what the judge replays. Not rules: a float is fine here.
import { rngFrom, hashString } from '../../core/rng.js';
import { TURN, SLICES, BALL, GAP, RED } from './tuning.js';
import { stepTo, turn, isOver, floorNow } from './engine.js';
import { wrap, sliceStart, sliceOf, kindAt, floorAt } from './tower-gen.js';

/**
 * THE FOUR BOTS — `react` ticks before it answers something it did not see coming · `spin` angle units a tick at most (68 = 1 turn a
 * second) · `aim` the aiming error σ in angle units (341 = one slice) + `far` × the turn's length · `care` the chance it checks where it
 * will be at the landing when it can not arrive in time (and thinks of the landing after a shatter) · `ahead` the chance it LOOKED AHEAD
 * at a new floor while still above it (its spin starts 2 ticks into the fall instead of a whole reaction) · `dare` how far away (angle
 * units) a gap may be for it to try an air-steer in a fall · `near` a gap with red beside it further away than this is taken in TWO hops
 * (first to solid ground near it, then the short sure one).
 */
export const BOTS = Object.freeze({
  sloppy: Object.freeze({ react: 22, spin: 40, aim: 150, far: 0.10, care: 0.5, ahead: 0.2, dare: 0, near: 9999 }),
  good: Object.freeze({ react: 14, spin: 60, aim: 70, far: 0.05, care: 0.95, ahead: 0.7, dare: 350, near: 700 }),
  great: Object.freeze({ react: 9, spin: 80, aim: 35, far: 0.03, care: 1, ahead: 0.95, dare: 450, near: 500 }),
  human: Object.freeze({ react: 12, spin: 68, aim: 55, far: 0.05, care: 0.98, ahead: 0, dare: 0, near: 600 }),   // THE HUMAN-PACED one: a 200 ms reaction (never ahead of it), 1 turn a second
});
export const BOT_IDS = Object.freeze(Object.keys(BOTS));

/** a bot = its numbers + its own seeded dice */
export function makeBot(id, seed = 'bot') {
  const P = typeof id === 'string' ? BOTS[id] : id;
  if (!P) throw new Error(`freefall: unknown bot ${id}`);
  const rand = rngFrom(hashString(`ffbot:${seed}:${P.react}:${P.spin}:${P.aim}`));
  const gauss = () => { let u = rand(); if (u < 1e-12) u = 1e-12; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };   // (Box–Muller)
  return { P, rand, gauss, seen: -1, going: false };
}

const STEP = 16;
/** the kind under a floor-local angle */
const kindAtU = (fl, u) => kindAt(fl, sliceOf(wrap(u)));
/** how far a floor-local angle is from the nearest red point (0 = on red; capped at `max`) */
function clearOf(fl, u, max) {
  for (let k = 0; k <= max; k += STEP) if (kindAtU(fl, u + k) === RED || kindAtU(fl, u - k) === RED) return k;
  return max;
}
/** is this spot good ground to aim for — a gap or solid, with `margin` clear of red on both sides (the bot's own aiming error fits)? */
const goodAt = (fl, u, margin) => clearOf(fl, u, margin + STEP) >= margin;
/** the nearest good ground within `reach` of floor-local angle `p` (either way) → the signed turn, or null */
function nearestGood(fl, p, reach, margin) {
  for (let c = 0; c <= reach; c += STEP) {
    if (goodAt(fl, p + c, margin)) return c;
    if (c && goodAt(fl, p - c, margin)) return -c;
  }
  return null;
}

/**
 * the gap to go for from floor-local angle `p`: every run of gap slices, both ways round — the SHORTEST turn that does not cross a wall
 * of red wider than one flight can clear (`cross` units) → { d: the signed local turn to the gap's middle, dist, half: half its width } | null
 */
function pickGap(fl, p, cross) {
  let best = null;
  for (let s = 0; s < SLICES; s++) {
    if (!((fl.gap >> s) & 1) || ((fl.gap >> ((s + SLICES - 1) % SLICES)) & 1)) continue;   // (s = a gap's first slice)
    let k = 1;
    while ((fl.gap >> ((s + k) % SLICES)) & 1) k++;
    const lo = sliceStart(s), width = (s + k <= SLICES ? sliceStart(s + k) : sliceStart(s + k - SLICES) + TURN) - lo, mid = wrap(lo + Math.floor(width / 2));
    for (const dir of [1, -1]) {
      const dist = dir > 0 ? wrap(mid - p) : wrap(p - mid);
      if (best && dist >= best.dist) continue;
      // the widest red run on the way
      let red = 0, widest = 0;
      for (let x = 0; x <= dist; x += STEP) { if (kindAtU(fl, p + dir * x) === RED) { red += STEP; if (red > widest) widest = red; } else red = 0; }
      if (widest > cross) continue;
      best = { d: dir * dist, dist, half: Math.floor(width / 2) };
    }
  }
  return best;
}

/** THE BLAZE is lit: whatever is under the ball at this landing, it goes through — a careful bot spins to the nearest spot whose landing ONE FLOOR FURTHER DOWN is good ground */
function blazePlan(run, bot, fl, p, left) {
  const { P } = bot;
  if (bot.rand() >= P.care) return { d: 0, wait: 0 };
  const wait = Math.floor(P.react / 2), reach = (left - wait > 0 ? left - wait : 0) * P.spin;
  const below = floorAt(run.h, run.floor + 1, run.R), d = nearestGood(below, p + fl.twist - below.twist, reach, Math.round(1.5 * P.aim));
  return { d: d == null ? 0 : d, wait };
}

/** A FALL onto a new floor: let it land — unless the spot below is red (get off it), or a close gap was seen coming (dare the air-steer) */
function fallPlan(run, bot, fl, p, left) {
  const { P } = bot, ahead = bot.rand() < P.ahead, wait = ahead ? (P.react < 2 ? P.react : 2) : P.react, reach = (left - wait > 0 ? left - wait : 0) * P.spin;
  const margin = Math.round(1.5 * P.aim);
  if (ahead && P.dare > 0) {
    const g = pickGap(fl, p, 0);   // (nothing red on the way: an air-steer never flies over red)
    if (g && g.dist <= P.dare) {
      const want = Math.round(g.d + bot.gauss() * (P.aim + P.far * g.dist));
      if (Math.abs(want) <= reach) return { d: want, wait };
    }
  }
  if (goodAt(fl, p, margin)) return { d: 0, wait: 0 };
  // the spot straight below is red, or too near it: the nearest good ground — else the nearest ground that is not red at all
  let d = nearestGood(fl, p, reach, margin);
  if (d == null) d = nearestGood(fl, p, reach, 0);
  if (d == null) return { d: 0, wait: 0 };
  return { d: d + Math.round(bot.gauss() * P.aim * 0.3), wait };
}

/** ONE FLIGHT's plan: the local turn the bot will make before the next landing + the ticks it waits first → { d, wait } */
export function planFlight(run, bot) {
  const { P } = bot, R = run.R, fl = floorNow(run), p = wrap(BALL - run.a - fl.twist), left = run.nl - run.t;
  const fresh = bot.seen !== run.floor;
  bot.seen = run.floor;
  if (run.blaze) return blazePlan(run, bot, fl, p, left);
  if (kindAtU(fl, p) === GAP) return { d: 0, wait: 0 };   // (a gap already under the ball: let it fall)
  if (fresh && run.fl !== 'bounce') { bot.going = false; return fallPlan(run, bot, fl, p, left); }
  // A BOUNCE: go for the gap
  const wait = bot.going ? 0 : Math.floor(P.react / 2), reach = (left - wait > 0 ? left - wait : 0) * P.spin;
  const g = pickGap(fl, p, R.bounce * P.spin - 2 * P.aim);
  bot.going = false;
  if (!g) return { d: 0, wait };
  const margin = Math.round(1.5 * P.aim), gdir = g.d < 0 ? -1 : 1;
  // A FAR GAP WITH RED BESIDE IT: a careful bot goes in TWO HOPS — first to good solid ground near the gap, then the short, sure one
  if (g.dist > P.near && bot.rand() < P.care && (kindAtU(fl, p + g.d + g.half + STEP * 2) === RED || kindAtU(fl, p + g.d - g.half - STEP * 2) === RED)) {
    for (let c = g.dist - g.half - STEP; c > g.dist * 0.4; c -= STEP) {
      const u = p + gdir * c;
      if (kindAtU(fl, u) !== GAP && goodAt(fl, u, margin)) {
        const stage = Math.round(gdir * c + bot.gauss() * P.aim * 0.5);
        if (Math.abs(stage) <= reach) { bot.going = true; return { d: stage, wait }; }
        break;
      }
    }
  }
  const sigma = P.aim + P.far * g.dist, want = Math.round(g.d + bot.gauss() * sigma), dir = want < 0 ? -1 : 1;
  if (Math.abs(want) <= reach) return { d: want, wait };
  // it can not arrive before the landing
  if (bot.rand() >= P.care) return { d: dir * reach, wait };   // (careless: caught wherever it is)
  bot.going = true;
  let x = -1, bestX = 0, bestC = -1;
  for (let c = Math.floor(reach / STEP) * STEP; c >= 0; c -= STEP) {
    if (goodAt(fl, p + dir * c, margin)) { x = c; break; }
    const cl = clearOf(fl, p + dir * c, margin + STEP);
    if (cl > bestC) { bestC = cl; bestX = c; }
  }
  if (x < 0) {
    // nowhere good on the way: the nearest good ground the other way, else the best there is
    for (let c = STEP; c <= reach; c += STEP) { if (goodAt(fl, p - dir * c, margin)) return { d: -dir * c + Math.round(bot.gauss() * P.aim * 0.3), wait }; }
    x = bestX;
  }
  return { d: dir * x + (x ? Math.round(bot.gauss() * P.aim * 0.3) : 0), wait };
}

/**
 * play `run` on with `bot` until it ends (or it has passed `maxFloor` floors) — through the REAL engine: every move is a turn() at its
 * own tick, every landing a stepTo(). The run keeps its own log (engine.js#logOf).
 */
export function playBot(run, bot, { maxFloor = Infinity } = {}) {
  while (!isOver(run) && run.floor < maxFloor) {
    const N = run.nl, pl = planFlight(run, bot), spin = bot.P.spin;
    let rest = pl.d;   // (a LOCAL turn: the floor's angle under the ball grows as the tower's angle shrinks)
    for (let t = run.t + 1 + pl.wait; t <= N && rest !== 0 && !isOver(run); t++) {
      const step = rest > spin ? spin : rest < -spin ? -spin : rest;
      turn(run, t, -step);
      rest -= step;
    }
    stepTo(run, N);
  }
  return run;
}
