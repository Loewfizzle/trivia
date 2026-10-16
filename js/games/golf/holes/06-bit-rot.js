// HOLE 6 — BIT ROT (Cyberspace, par 3). The middle of the course is corrupted: floor tiles blink in and
// out of existence. Cross when they're solid — or lay up and wait for your moment.
import { rect } from './shape.js';

// Each column blinks as a wave rolling away from the tee; the two columns run half a cycle apart, so one
// lane is (nearly) always solid end to end — read it, then go.
const PERIOD = 6;
const tile = (x0, y0, phase) => ({ type: 'tile', poly: rect(x0, y0, x0 + 4, y0 + 5), period: PERIOD, on: 0.72, phase, h: 0, surface: 'grid' });
const wave = (x0, offset) => [12, 17, 22, 27].map((y0, row) => tile(x0, y0, offset - row * 0.5));

export default {
  id: 'bit-rot', name: 'BIT ROT', zone: 'cyber', par: 3,
  tip: 'The tiles blink. Cross while they’re solid.',
  tee: [0, 2], cup: [3, 44],
  floors: [
    { poly: rect(-4, 0, 4, 12), h: 0, surface: 'grid' },
    { poly: rect(-6, 32, 6, 48), h: 0, surface: 'grid' },
  ],
  walls: [
    { pts: [[-4, 12], [-4, 0], [4, 0], [4, 12]] },
    { pts: [[-4, 12], [-4, 32]], kind: 'lip' }, { pts: [[4, 12], [4, 32]], kind: 'lip' },
    { pts: [[-4, 32], [-6, 32], [-6, 48], [6, 48], [6, 32], [4, 32]] },
    { pts: [[-1, 38.5], [6, 38.5]] },                          // a ledge in front of the cup
  ],
  movers: [
    ...wave(-4, 0), ...wave(0, PERIOD / 2),
  ],
  powerups: [{ at: [2.6, 7], kind: 'sticky' }],
};
