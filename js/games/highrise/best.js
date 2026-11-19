// HIGH RISE — YOUR BEST (S2 — docs/highrise.md "THE LINES"): PURE (no DOM, no storage — the page hands the numbers in). YOUR BEST = a
// GOLD TAPE on the tower at your best floor. While that floor is ABOVE you there is no tower there yet: it is a right-edge TAG
// "BEST 57 ▲12" — never over THE DROP ZONE; the landing that CROSSES it (floor best + 1) puts the gold band round the slab of your best
// floor, with a flash + NEW BEST. A first-ever run has no best: no tag, no tape. (S2: the best is THIS PHONE's — nothing counts yet.)

/** the phone's own memory of the test page (never a profile key): the best floor */
export const BEST_KEY = 'hi:play:best';
/** a stored value → a whole best floor ≥ 0 (anything else = no best yet) */
export const cleanBest = v => { const n = Number(v); return Number.isSafeInteger(n) && n > 0 && n < 1e6 ? n : 0; };

/**
 * what YOUR BEST shows while a run stands on `floor`, `best` = the best BEFORE this run:
 *   null — no best yet (a first-ever run)
 *   { tag: 'BEST 57 ▲12', gap: 12 } — the best is above you (the tag at the right edge, tracking its height)
 *   { tag: 'BEST 57 · ONE MORE', gap: 0 } — you stand ON it: the next slab beats it
 *   { tape: 57, passed: n } — crossed: the gold band lies on the tower at floor 57, n floors under the top
 */
export function bestView(best, floor) {
  if (!(best > 0)) return null;
  if (floor > best) return { tape: best, passed: floor - best };
  const gap = best - floor;
  return { tag: gap ? `BEST ${best} ▲${gap}` : `BEST ${best} · ONE MORE`, gap };
}
/** the tag's words alone ('' = no tag: no best yet, or it is under you) — the stage writes them once a landing and makes nothing else */
export const bestTag = (best, floor) => (!(best > 0) || floor > best ? '' : best - floor ? `BEST ${best} ▲${best - floor}` : `BEST ${best} · ONE MORE`);
/** the landing on `floor` just crossed YOUR BEST (once a run: the first floor over it) */
export const crossedBest = (best, floor) => best > 0 && floor === best + 1;
/** the best after a run that reached `floor` */
export const nextBest = (best, floor) => (floor > best ? floor : best);

/**
 * THE TAG NEVER ENTERS THE DROP ZONE: its height on the screen (px from the top) = its floor's own height, held inside the clear column
 * between the HUD's foot (`top`) and the drop zone's upper edge (`zone`), a tag's half height + a margin clear of both.
 */
export function tagY(y, top, zone, half = 14, margin = 8) {
  const lo = top + half + margin, hi = zone - half - margin;
  if (hi <= lo) return lo;
  return y < lo ? lo : y > hi ? hi : y;
}
