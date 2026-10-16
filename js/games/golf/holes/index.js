// The NEON PAR course, in playing order. Three zones × three holes; Quick 6 / Quick 3 pick from these.
import h1 from './01-first-light.js';
import h2 from './02-dogleg.js';
import h3 from './03-leap.js';
import h4 from './04-portal-hop.js';
import h5 from './05-laser-gate.js';
import h6 from './06-bit-rot.js';
import h7 from './07-bumper-alley.js';
import h8 from './08-ferry.js';
import h9 from './09-overdrive.js';

export const HOLES = [h1, h2, h3, h4, h5, h6, h7, h8, h9];
export { ZONES, MODES } from '../course.js'; // (names/zones/pars for startup live in course.js — keep it in sync)
export const holeByNumber = n => HOLES[n - 1];
