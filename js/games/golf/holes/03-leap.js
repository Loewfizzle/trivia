// HOLE 3 — THE LEAP (Rooftops, par 3). Up a short ramp and off the edge: hit it hard enough to clear the
// alley and land on the lower roof. Too soft and it drops (+1, back to your last spot).
import { rect, slope } from './shape.js';

export default {
  id: 'leap', name: 'THE LEAP', zone: 'rooftops', par: 3,
  tip: 'Hit the ramp hard enough to clear the alley.',
  tee: [0, 2], cup: [3.6, 41],
  floors: [
    { poly: rect(-4, 0, 4, 20), h: 2.2, surface: 'wet' },     // upper roof (the ramp is its last stretch)
    { poly: rect(-7, 26, 7, 46), h: 0, surface: 'wet' },      // lower roof
  ],
  walls: [
    { pts: [[-4, 20], [-4, 0], [4, 0], [4, 20]] },            // upper roof: open at the ramp lip
    { pts: [[-7, 26], [7, 26]], kind: 'lip' },                // curb at the lower roof's edge (a jumping ball clears it)
    { pts: [[-7, 26], [-7, 46], [7, 46], [7, 26]] },
  ],
  slopes: [
    slope(-4, 16, 4, 20, [0, -1], 3, 2.9, 2.2),              // the ramp: uphill, visually rising
    slope(-7, 30, 7, 46, [-1, 0], 1.4, 0, 0.25),
  ],
  gaps: [{ poly: rect(-7, 20, 7, 26), minSpeed: 7.5 }],
  // (the lower roof drains gently to the left, away from the cup)
  bumpers: [{ c: [0, 33.5], r: 1, kick: 5 }, { c: [-4, 38], r: 0.9, kick: 5 }, { c: [5.2, 36.5], r: 0.8, kick: 5 }],
};
