// HOLE 1 — FIRST LIGHT (Rooftops, par 2). A straight green with a block hiding the cup: bank it off a side
// rail, read the crown (the green falls away to both sides past the block), and mind the two little
// bumpers guarding the cup. Behind the cup the green drops away — don't overhit.
import { rect, slope } from './shape.js';

export default {
  id: 'first-light', name: 'FIRST LIGHT', zone: 'rooftops', par: 2,
  tip: 'Bank it off a rail around the block. Mind the crown.',
  tee: [0, 3], cup: [0.3, 31],
  floors: [{ poly: rect(-4, 0, 4, 35), h: 0, surface: 'wet' }],
  walls: [
    { pts: [[-4, 0], [4, 0], [4, 35], [-4, 35]], closed: true },
    { pts: [[-1.7, 15], [1.7, 15], [1.7, 17.6], [-1.7, 17.6]], closed: true }, // the block
  ],
  slopes: [
    slope(-4, 21, 0, 28, [-1, 0], 2.2, 0, 0.3),               // the crown: left half falls left…
    slope(0, 21, 4, 28, [1, 0], 2.2, 0.3, 0),                 // …right half falls right
    slope(-4, 31.6, 4, 35, [0, 1], 1.5, 0.3, 0),              // behind the cup the green falls away
  ],
  bumpers: [{ c: [-2.4, 29], r: 0.7, kick: 3 }, { c: [3, 29], r: 0.7, kick: 3 }],
};
