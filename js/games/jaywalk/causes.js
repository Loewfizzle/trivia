// JAYWALK — HOW YOU WENT OUT (H3 — docs/jaywalk.md "THE END SCREEN"): the end screen names it in big neon words — one line per cause +
// The long notes: docs/games/jaywalk-notes.md
import { FP, KID_HALF } from './tuning.js';
import { moverLeft } from './course.js';

/** the view's own small hash (never the rules' rng — nothing here changes a run) */
export const hsh = (a, b) => { let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return (x >>> 0) / 4294967296; };
export const strSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h | 0; };

export const CAR_KINDS = Object.freeze(['sedan', 'hatchback', 'taxi']);
/** every vehicle a road lane can carry — each has its model (night.js) and its line (CAUSE_LINES) */
export const VEHICLES = Object.freeze(['sedan', 'hatchback', 'taxi', 'van', 'truck']);
const SEEDS = new WeakMap();
const seedNum = course => { let v = SEEDS.get(course); if (v === undefined) { v = strSeed(String(course.seed)); SEEDS.set(course, v); } return v; };
/**
 * THE ONE SOURCE OF TRUTH: which vehicle the j-th mover of ROAD lane `lane` of this course IS — a 1-cell car = a sedan / a hatchback /
 * a taxi (from the course's seed + the lane + its place in the lane), 2 cells = the van, 3 = THE BOX TRUCK. '' = not a car.
 * The night look draws by it; the end screen's line names it.
 */
export function vehicleAt(course, lane, j) {
  const L = course.lane(lane), it = L && L.type === 'road' && L.items ? L.items[j] : null;
  if (!it) return '';
  const cells = it.len / FP;
  return cells > 2.5 ? 'truck' : cells >= 1.5 ? 'van' : CAR_KINDS[Math.floor(hsh(seedNum(course) ^ (lane * 7919), j * 13 + 1) * 3)];
}

/** the vehicle that hit a kid who went out by a car: { y: the lane, x: their centre (FP), end: the tick } on this course → its kind.
 *  The one on them at that tick — the engine's own box; were none found (never, for a real car hit) the NEAREST on the lane: a car hit
 *  always names a vehicle that is on the screen ('' only when the lane is no road at all) */
export function hitVehicle(course, { y, x, end }) {
  const L = course.lane(y);
  if (!L || L.type !== 'road' || !L.items.length) return '';
  let near = 0, gap = Infinity;
  for (let j = 0; j < L.items.length; j++) {
    const l = moverLeft(L, L.items[j], end), r = l + L.items[j].len;
    if (l < x + KID_HALF && r > x - KID_HALF) return vehicleAt(course, y, j);
    const d = x < l ? l - x : x > r ? x - r : 0;
    if (d < gap) { gap = d; near = j; }
  }
  return vehicleAt(course, y, near);
}

/** THE WORDS — one line per cause + vehicle (≤ 2 short lines at phone size; no emoji, no dev text). NO generic car line: a car hit is
 *  always one of the five vehicles */
export const CAUSE_LINES = Object.freeze({
  'car:sedan': 'FLATTENED BY A SEDAN',
  'car:hatchback': 'CLIPPED BY A HATCHBACK',
  'car:taxi': 'FLATTENED BY A TAXI',
  'car:van': 'RUN DOWN BY A VAN',
  'car:truck': 'FLATTENED BY A BOX TRUCK',
  water: 'SWEPT AWAY',
  edge: 'CARRIED OFF BY A LOG',
  train: 'HIT BY THE 6:15',
  wall: 'THE LIGHTS WENT OUT',
  blackbird: 'BUZZED BY THE BLACKBIRD',
  ufo: 'ABDUCTED',
});
export const SHIP_LINE = 'MADE IT TO THE MOTHERSHIP';
/** → the end screen's line: { cause, vehicle?, lanes?, taken? } */
/** H5B — THE DAY LOOK's own words: by day the wall is A FOG BANK, never "the lights" (the same cause, the same rules) */
export const DAY_LINES = Object.freeze({ wall: 'LOST IN THE FOG' });
export function causeLine({ cause = '', vehicle = '', lanes = 0, taken = false, look = 'night' } = {}) {
  if (taken || cause === 'taken') return SHIP_LINE;   // (H6A — a finish line, not a death: never "TAKEN" in anything a player reads)
  if (look === 'day' && DAY_LINES[cause]) return DAY_LINES[cause];
  return CAUSE_LINES[`${cause}:${vehicle}`] || CAUSE_LINES[cause] || 'OUT';
}
/** the line of a finished run on its course (the game's views + the lab + the podium all come through here): { cause, y, x, end, lanes, taken }
 *  + `look` (H5B — the look on this screen: 'day' | 'night') */
export function runLine(course, { cause = '', y = 0, x = 0, end = -1, lanes = 0, taken = false } = {}, look = 'night') {
  return causeLine({ cause, vehicle: cause === 'car' ? hitVehicle(course, { y, x, end }) : '', lanes, taken, look });
}
