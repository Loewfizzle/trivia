// HOLE 5 — LASER GATE (Cyberspace, par 3). A spinning laser bar sweeps the corridor: time your putt for the
// gap, ride the boost strip, and drop it into the cup's cradle.
import { rect } from './shape.js';

export default {
  id: 'laser-gate', name: 'LASER GATE', zone: 'cyber', par: 3,
  tip: 'Time your putt through the spinning laser.',
  tee: [0, 2], cup: [1.4, 38.2],
  floors: [{ poly: rect(-4, 0, 4, 42), h: 0, surface: 'grid' }],
  walls: [
    { pts: [[-4, 0], [4, 0], [4, 42], [-4, 42]], closed: true },
    { pts: [[-2.6, 34.5], [-2.6, 40.6], [2.6, 40.6], [2.6, 34.5]] }, // the cradle
  ],
  movers: [{ type: 'laser', pivot: [0, 18], length: 4.3, arms: 2, speed: 1.25 }],
  boosts: [{ poly: rect(-2, 26, 2, 29), dir: [0, 1], power: 10 }],
  bumpers: [{ c: [0, 31.5], r: 0.7, kick: 3 }],             // a post after the boost: no dead-straight aces
  powerups: [{ at: [-2.8, 10], kind: 'magnet' }],
};
