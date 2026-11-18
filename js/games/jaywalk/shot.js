// JAYWALK — THE RUN's FRAME (docs/jaywalk.md "THE SHARE IMAGE" + "THE TOUCH-UP PASS"): the picture of the moment a player went out, kept
// on this phone until the next run — the view takes it (night.js#snap), the share card draws it (share.js). Pure state, no DOM.
import { KID_HALF, TICK_MS } from './tuning.js';
import { moverLeft } from './course.js';
let held = null;
/** keep this run's frame (a 2D canvas) + what the card says about it; the one before it is let go */
export function keepShot(s) { if (held && held.canvas && held.canvas !== (s && s.canvas)) { held.canvas.width = 0; held.canvas.height = 0; } held = s || null; }
/** the frame of this match's run on this phone (null = none: a refresh, another phone) */
export const shotFor = matchId => (held && held.matchId === matchId ? held : null);
/** THE SHARE PICTURE SHOWS THE KID: ms after the hit, per cause, while night.js still draws him clearly (`jaywalk-lab.mjs --touchup=probe`) */
export const SHOT_AT = Object.freeze({ car: 460, train: 130, water: 140, edge: 400, wall: 40, blackbird: 460, ufo: 720, taken: 1500 });
/** a vehicle still over him at 460 ms (a van, a truck, a slow lane) → THE IMPACT: the pancake at its nose */
export const CAR_SHOT_HIT = 70;
/** ms until the vehicle on him has passed him (its rear 650 FP beyond his centre — the pancake's half) — the rules' movers; Infinity = none */
export function carClearMs(course, run) {
  const L = course.lane(run.y);
  if (!L || L.type !== 'road' || !L.items || !L.v) return Infinity;
  const x = run.x, tick = run.end >= 0 ? run.end : run.t;
  for (const it of L.items) {
    const l = moverLeft(L, it, tick), r = l + it.len;
    if (l < x + KID_HALF && r > x - KID_HALF) return Math.max(0, (L.dir > 0 ? x + 650 - l : r - x + 650) / L.v) * TICK_MS;
  }
  return Infinity;
}
/** the run that just ended (+ its course) → ms after the hit to take its frame */
export function shotMs(run, course) {
  if (run && run.st === 'taken') return SHOT_AT.taken;
  const c = run && run.cause;
  if (c === 'car') return !course ? SHOT_AT.car : carClearMs(course, run) <= SHOT_AT.car ? SHOT_AT.car : CAR_SHOT_HIT;
  return SHOT_AT[c] || SHOT_AT.car;
}
