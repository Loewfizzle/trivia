// HIGH RISE — THE FLYERS' PLAN (S3 — docs/highrise.md "THE FLYERS"): PURE, VIEW-ONLY (the rules never read it): WHEN each flyer comes
// and WHICH — the same on every phone that plays the same seed. The flying itself is flyers.js (a lazy module).
import { hashString } from '../../core/rng.js';
import { flyerFor } from './engine.js';

/** the floors: THE SKYLINE FLYBY somewhere in jetFrom … jetTo (the seed picks) · THE UFO · THE MOTHERSHIP seen from shipFrom, colossal
 *  at ship (the modes' finish) · each model + its sounds asked for at its `load` floor — well before its moment */
export const FLY_FLOORS = Object.freeze({ jetFrom: 35, jetTo: 45, ufo: 85, shipFrom: 180, ship: 200, loadJet: 20, loadUfo: 70, loadShip: 160 });
/** a landing this many floors past a moment's floor still starts it (two drops in one frame); further on, it was missed */
export const FLY_LATE = 2;

/** a seed's plan: { jet: 'blackbird' | 'f22' (engine.js#flyerFor), jetAt: its floor (35 … 45), jetDir · ufoDir: ±1 = the side it comes from, ufoAt } */
export function flyPlan(seed) {
  const s = String(seed), span = FLY_FLOORS.jetTo - FLY_FLOORS.jetFrom + 1;
  return { jet: flyerFor(s), jetAt: FLY_FLOORS.jetFrom + hashString(`hi:flyby:${s}`) % span, jetDir: hashString(`hi:flydir:${s}`) & 1 ? 1 : -1, ufoAt: FLY_FLOORS.ufo, ufoDir: hashString(`hi:ufodir:${s}`) & 1 ? 1 : -1 };
}
/** what a landing on `floor` starts ('' = nothing): 'jet' | 'ufo' | 'ship' — `done` = what this run has started already */
export function flyDue(plan, floor, done) {
  if (!done.jet && floor >= plan.jetAt) return floor <= plan.jetAt + FLY_LATE ? 'jet' : 'jet-missed';
  if (!done.ufo && floor >= plan.ufoAt) return floor <= plan.ufoAt + FLY_LATE ? 'ufo' : 'ufo-missed';
  if (!done.ship && floor >= FLY_FLOORS.ship) return floor <= FLY_FLOORS.ship + FLY_LATE ? 'ship' : 'ship-missed';
  return '';
}
/** what must be on its way at `floor`: the models to ask for (each once — the caller keeps what it asked) */
export function flyNeeds(plan, floor, out = []) {
  out.length = 0;   // (the stage hands its own list in: asked once a floor, nothing made)
  if (floor >= FLY_FLOORS.loadJet && floor <= plan.jetAt + FLY_LATE) out.push(plan.jet);
  if (floor >= FLY_FLOORS.loadUfo && floor <= plan.ufoAt + FLY_LATE) out.push('ufo');
  if (floor >= FLY_FLOORS.loadShip && floor <= FLY_FLOORS.ship + FLY_LATE) out.push('mothership');
  return out;
}
