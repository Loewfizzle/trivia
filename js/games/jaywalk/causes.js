// JAYWALK — HOW YOU WENT OUT (H3 — docs/jaywalk.md "THE END SCREEN"): the end screen names it in big neon words — one line per cause +
// vehicle (FLATTENED BY A TAXI · SWEPT AWAY · HIT BY THE 6:15 · THE LIGHTS WENT OUT). PURE (no DOM, no three.js): which vehicle a car IS
// comes from the same pick the night look draws it by (vehicleOf — night.js imports it), so the words always match the picture; what hit
// the kid is read back from the run's own end (the lane, the tick, the place — the engine's result), never stored anywhere.
import { FP, KID_HALF } from './tuning.js';
import { moverLeft } from './course.js';

/** the view's own small hash (never the rules' rng — nothing here changes a run) */
export const hsh = (a, b) => { let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return (x >>> 0) / 4294967296; };
export const strSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h | 0; };

export const CAR_KINDS = Object.freeze(['sedan', 'hatchback', 'taxi']);
/** which vehicle the j-th mover of a ROAD lane is: a 1-cell car = a sedan / a hatchback / a taxi (from the course's seed), 2 cells = the van, 3 = THE BOX TRUCK */
export const vehicleOf = (vseed, lane, j, cells) => (cells > 2.5 ? 'truck' : cells >= 1.5 ? 'van' : CAR_KINDS[Math.floor(hsh(vseed ^ (lane * 7919), j * 13 + 1) * 3)]);

/** the vehicle that hit a kid who went out by a car: { y: the lane, x: their centre (FP), end: the tick } on this course → its kind ('' = none found) */
export function hitVehicle(course, { y, x, end }) {
  const L = course.lane(y);
  if (!L || L.type !== 'road') return '';
  for (let j = 0; j < L.items.length; j++) {
    const l = moverLeft(L, L.items[j], end);
    if (l < x + KID_HALF && l + L.items[j].len > x - KID_HALF) return vehicleOf(strSeed(course.seed), y, j, L.items[j].len / FP);
  }
  return '';
}

/** THE WORDS — one line per cause + vehicle (≤ 2 short lines at phone size; no emoji, no dev text) */
export const CAUSE_LINES = Object.freeze({
  'car:sedan': 'FLATTENED BY A SEDAN',
  'car:hatchback': 'CLIPPED BY A HATCHBACK',
  'car:taxi': 'FLATTENED BY A TAXI',
  'car:van': 'RUN DOWN BY A VAN',
  'car:truck': 'FLATTENED BY A BOX TRUCK',
  car: 'HIT BY A CAR',
  water: 'SWEPT AWAY',
  edge: 'CARRIED OFF BY A LOG',
  train: 'HIT BY THE 6:15',
  wall: 'THE LIGHTS WENT OUT',
  blackbird: 'BUZZED BY THE BLACKBIRD',
  ufo: 'BEAMED UP',
});
/** → the end screen's line: { cause, vehicle?, lanes?, taken? } */
export function causeLine({ cause = '', vehicle = '', lanes = 0, taken = false } = {}) {
  if (taken || cause === 'taken') return `TAKEN AT LANE ${lanes}`;
  return CAUSE_LINES[`${cause}:${vehicle}`] || CAUSE_LINES[cause] || 'OUT';
}
