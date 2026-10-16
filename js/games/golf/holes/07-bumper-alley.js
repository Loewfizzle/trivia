// HOLE 7 — BUMPER ALLEY (Neon Arcade, par 3). A tilted pinball table: the bumpers kick, the table rolls the
// ball back toward you, and the cup sits at the bottom of the far funnel.
import { rect, slope } from './shape.js';

export default {
  id: 'bumper-alley', name: 'BUMPER ALLEY', zone: 'arcade', par: 3,
  tip: 'The bumpers kick and the table tilts back at you.',
  tee: [0, 2], cup: [3.4, 33.6],
  floors: [{ poly: rect(-7, 0, 7, 38), h: 0, surface: 'chrome' }],
  walls: [
    { pts: [[-7, 0], [7, 0], [7, 38], [-7, 38]], closed: true },
    { pts: [[-7, 30], [-3.5, 33.5]], kind: 'rubber' },          // slingshots in the far corners
    { pts: [[7, 29], [5.6, 30.4]], kind: 'rubber' },
  ],
  slopes: [slope(-7, 4, 7, 30, [0, -1], 1.2, 0.5, 0)],        // the table tilts back toward the tee
  bumpers: [
    { c: [0, 14], r: 1.2, kick: 7, id: 0 }, { c: [-3.6, 18.5], r: 1.1, kick: 7, id: 1 },
    { c: [3.6, 18.5], r: 1.1, kick: 7, id: 2 }, { c: [0, 23], r: 1, kick: 7, id: 3 },
  ],
  powerups: [{ at: [5.4, 8], kind: 'ghost' }],
};
