// HOLD'EM — THE BET STEPS (HE11, PURE: no DOM, no clock): the stops of the custom bet slider (bet-slider.js).
//
// THE RULE: the slider's UNIT is the smallest ROUND number (5 · 10 · 20 · 25 · 50 · 100 · 200 · 250 · 500 · 1,000 …) that is at least
// the small blind (never under 5) and leaves the track at most MAX_STOPS stops. The stops = the minimum raise EXACTLY, every multiple
// of the unit strictly between it and ALL IN, then ALL IN EXACTLY (the very last stop — never "within a step"). Two round numbers in a
// row are never more than ×2 apart, so a track that can hold MIN_STOPS stops gets 30–60; a short stack gets fewer (every unit-step —
// the slider can't be finer than the small blind). The thumb's track is shared EQUALLY by the stops (one stop = one equal slice):
// smooth under a thumb, and ALL IN is the last slice only.
//
// PLAY CHIPS ONLY — every amount here is chips.

export const MAX_STOPS = 60;
export const MIN_STOPS = 30;
const MANTISSAS = [1, 2, 2.5, 5];

/** The round units in order, from 5 up (integers only: 2.5 × 10^k from 25). */
function* roundUnits() {
  for (let k = 0; ; k++) for (const m of MANTISSAS) {
    const u = m * 10 ** k;
    if (u >= 5 && Number.isInteger(u)) yield u;
  }
}

/** The smallest unit the slider may use: the small blind, never under 5. */
export const floorUnit = sb => Math.max(5, Math.floor(Number(sb) || 0));

/** The finest unit a table allows: the smallest round unit at least the small blind (a 15 small blind → 20). */
export function baseUnit(sb) {
  const floor = floorUnit(sb);
  for (const u of roundUnits()) if (u >= floor) return u;
}

/** How many stops a unit gives between minTo and maxTo (both ends included). */
export function stopCount(minTo, maxTo, unit) {
  if (!(maxTo > minTo)) return 1;
  const first = Math.floor(minTo / unit) + 1, last = Math.ceil(maxTo / unit) - 1;   // the multiples strictly inside (minTo, maxTo)
  return 2 + Math.max(0, last - first + 1);
}

/** THE UNIT: the smallest round unit ≥ the floor that keeps the track at ≤ MAX_STOPS stops. */
export function betUnit(minTo, maxTo, sb) {
  const base = baseUnit(sb);
  for (const u of roundUnits()) if (u >= base && stopCount(minTo, maxTo, u) <= MAX_STOPS) return u;
}

/** { unit, stops } — stops[0] = minTo, the last = maxTo (ALL IN), every one between a multiple of the unit. */
export function betStops({ minTo, maxTo, sb }) {
  const lo = Math.floor(minTo), hi = Math.floor(Math.max(minTo, maxTo));
  const unit = betUnit(lo, hi, sb);
  const stops = [lo];
  for (let v = (Math.floor(lo / unit) + 1) * unit; v < hi; v += unit) stops.push(v);
  if (hi > lo) stops.push(hi);
  return { unit, stops };
}

const clamp01 = p => (p < 0 ? 0 : p > 1 ? 1 : p);

/** The stop a track position (0 … 1) lands on — each stop owns an equal slice; ALL IN only the last half-slice. */
export function valueAt(stops, p) {
  const n = stops.length;
  if (n <= 1) return stops[0];
  return stops[Math.round(clamp01(p) * (n - 1))];
}

/** Where a value sits on the track (0 … 1): a stop at its slice; a value between two stops (a preset) in proportion. */
export function posOf(stops, value) {
  const n = stops.length;
  if (n <= 1) return 1;
  if (value <= stops[0]) return 0;
  if (value >= stops[n - 1]) return 1;
  let i = 0;
  while (i < n - 2 && stops[i + 1] <= value) i++;
  const a = stops[i], b = stops[i + 1];
  return (i + (value - a) / (b - a)) / (n - 1);
}

/** − / +: the next stop below / above the value (a value between stops — a preset — goes to its neighbour); held at the ends. */
export function stepFrom(stops, value, dir) {
  if (dir > 0) { for (const v of stops) if (v > value) return v; return stops[stops.length - 1]; }
  for (let i = stops.length - 1; i >= 0; i--) if (stops[i] < value) return stops[i];
  return stops[0];
}
