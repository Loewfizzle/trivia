// FREEFALL — YOUR BEST (F2 — docs/freefall.md "YOUR BEST"; HIGH RISE's best.js pattern): PURE (no DOM, no storage — the page hands the
// numbers in). YOUR BEST = a GOLD TAPE round the tower at your best floor (night.js#setBest — in sight when you are within nine floors
// of it) + the line at the top of the screen. The landing that takes the ball PAST it (the floors passed = best + 1) is the crossing:
// NEW BEST, once a run. A first-ever run has no best: no tape, no line. (F2: the best is THIS PHONE's — nothing counts yet.)

/** the phone's own memory of the test page (never a profile key): the best floor */
export const BEST_KEY = 'ff:play:best';
/** a stored value → a whole best floor ≥ 0 (anything else = no best yet) */
export const cleanBest = v => { const n = Number(v); return Number.isSafeInteger(n) && n > 0 && n < 1e6 ? n : 0; };
/** the line at the top: "YOUR BEST 88" ('' = no best yet) */
export const bestLine = best => (best > 0 ? `YOUR BEST ${best}` : '');
/** the fall that made `floor` the floors passed just crossed YOUR BEST (once a run: the first floor past it) */
export const crossedBest = (best, floor) => best > 0 && floor === best + 1;
/** the best after a run that passed `floor` floors */
export const nextBest = (best, floor) => (floor > best ? floor : best);
