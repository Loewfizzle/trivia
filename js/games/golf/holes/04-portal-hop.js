// HOLE 4 — PORTAL HOP (Cyberspace, par 3). Find a way around the firewall into the portal; it spits you
// out on the far platform, where a boost strip and the cup wait.
import { rect } from './shape.js';

export default {
  id: 'portal-hop', name: 'PORTAL HOP', zone: 'cyber', par: 3,
  tip: 'Get around the firewall and into the portal.',
  tee: [-2, 2], cup: [21.5, 30.5],
  floors: [
    { poly: rect(-4, 0, 4, 16), h: 0, surface: 'grid' },
    { poly: rect(12, 8, 24, 36), h: 0.6, surface: 'grid' },
  ],
  walls: [
    { pts: [[-4, 0], [4, 0], [4, 16], [-4, 16]], closed: true },
    { pts: [[-1.6, 8], [1.6, 8]], kind: 'laser' },             // the firewall
    { pts: [[12, 8], [24, 8], [24, 36], [12, 36]], closed: true },
    { pts: [[13.5, 31], [17.5, 34.5]], kind: 'rubber' },       // deflector in the far corner
  ],
  portals: [{ in: [0, 13.6], out: [18, 10.2], r: 1.1, exitAngle: Math.PI / 2 }],
  boosts: [{ poly: rect(16.2, 18, 19.8, 21), dir: [0, 1], power: 12 }],
  powerups: [{ at: [-2.6, 11], kind: 'ghost' }, { at: [14.2, 26], kind: 'magnet' }],
};
