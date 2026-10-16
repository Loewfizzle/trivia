// HOLE 2 — DOGLEG (Rooftops, par 3). An L-shaped green turning right; the 45° bank at the corner sends a
// well-judged putt down the long leg, where a bumper guards the line to the cup.
import { rect, slope } from './shape.js';

export default {
  id: 'dogleg', name: 'DOGLEG', zone: 'rooftops', par: 3,
  tip: 'Use the 45° bank at the corner to turn it down the long leg.',
  tee: [0, 2.5], cup: [25, 19.6],
  floors: [
    { poly: rect(-4, 0, 4, 26), h: 0, surface: 'turf' },
    { poly: rect(4, 18, 28, 26), h: 0, surface: 'turf' },
  ],
  walls: [
    { pts: [[-4, 0], [4, 0], [4, 18], [28, 18], [28, 26], [1, 26], [-4, 21]], closed: true },
  ],
  slopes: [slope(10, 18, 22, 26, [0, 1], 2, 0.3, 0)],
  bumpers: [{ c: [19, 22], r: 0.9, kick: 4 }],
};
