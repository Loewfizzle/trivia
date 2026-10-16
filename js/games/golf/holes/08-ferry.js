// HOLE 8 — THE FERRY (Neon Arcade, par 3). A chrome bridge slides back and forth across the void: roll onto
// it when it lines up, ride it over, then thread the spinning wheel to the cup.
import { rect } from './shape.js';

export default {
  id: 'ferry', name: 'THE FERRY', zone: 'arcade', par: 3,
  tip: 'Roll onto the sliding bridge when it lines up.',
  tee: [0, 2], cup: [0, 38.5],
  floors: [
    { poly: rect(-5, 0, 5, 12), h: 0, surface: 'chrome' },
    { poly: rect(-7, 24, 7, 42), h: 0, surface: 'chrome' },
  ],
  walls: [
    { pts: [[-5, 12], [-5, 0], [5, 0], [5, 12]] },
    { pts: [[-7, 24], [-7, 42], [7, 42], [7, 24]] },
  ],
  movers: [
    // the bridge: x from [-8.5,-3.5] to [3.5,8.5]; lines up with the decks mid-swing
    { type: 'platform', poly: rect(-8.5, 12, -3.5, 24), move: [12, 0], period: 8, phase: 0, h: 0, surface: 'chrome' },
    { type: 'spinner', pivot: [0, 31.5], length: 4.6, inner: 0.6, arms: 3, speed: 0.9 },
  ],
  powerups: [{ at: [-3.6, 7], kind: 'magnet' }],
};
