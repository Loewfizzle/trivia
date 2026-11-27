// FREEFALL — YOUR BEST (F2 — docs/freefall.md "YOUR BEST"; HIGH RISE's best.js pattern): PURE (no DOM, no storage — the page hands the (→ §1, docs/freefall.md MODULE NOTES)

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
