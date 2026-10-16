// HOLE 9 — OVERDRIVE (Neon Arcade, par 4). The finale: climb the ramp to the bumper deck, launch off the
// far ramp over the void, and beat the laser guarding the cup on the final stage.
import { rect, slope } from './shape.js';

export default {
  id: 'overdrive', name: 'OVERDRIVE', zone: 'arcade', par: 4,
  tip: 'Climb, launch over the void, beat the laser.',
  tee: [0, 2], cup: [0, 53],
  floors: [
    { poly: rect(-5, 0, 5, 14), h: 0, surface: 'chrome' },     // A: start deck
    { poly: rect(-3, 14, 3, 22), h: 0, surface: 'chrome' },    // ramp up
    { poly: rect(-8, 22, 8, 34), h: 3, surface: 'chrome' },    // B: bumper deck
    { poly: rect(-6, 40, 6, 57), h: 1.2, surface: 'chrome' },  // C: final stage
  ],
  walls: [
    { pts: [[-3, 14], [-5, 14], [-5, 0], [5, 0], [5, 14], [3, 14]] },
    { pts: [[-3, 14], [-3, 22]] }, { pts: [[3, 14], [3, 22]] },
    { pts: [[-3, 22], [-8, 22], [-8, 34], [-3, 34]] }, { pts: [[3, 22], [8, 22], [8, 34], [3, 34]] },
    { pts: [[-6, 40], [6, 40]], kind: 'lip' },
    { pts: [[-6, 40], [-6, 57], [6, 57], [6, 40]] },
    { pts: [[-2.6, 50.4], [-2.6, 55.6], [2.6, 55.6], [2.6, 50.4]] }, // cup cradle
  ],
  slopes: [
    slope(-3, 14, 3, 22, [0, -1], 6, 3, 0),                    // climb to deck B (h 0 at the bottom, 3 at the top)
    slope(-3, 31, 3, 34, [0, -1], 2.5, 3.6, 3),                // launch ramp at B's far end
  ],
  gaps: [{ poly: rect(-8, 34, 8, 40), minSpeed: 8 }],
  bumpers: [{ c: [-4, 27], r: 1, kick: 6, id: 0 }, { c: [4, 27], r: 1, kick: 6, id: 1 }, { c: [0, 25], r: 0.8, kick: 6, id: 2 }],
  movers: [{ type: 'laser', pivot: [0, 46], length: 4, arms: 1, speed: 1.6 }],
  powerups: [{ at: [6, 30], kind: 'sticky' }],
};
