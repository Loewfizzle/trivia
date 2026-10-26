// CITY 2.0 — THE HARBOR, PART 11a-1: HALLOWEEN's SKY + WATER heroes, WHEN + WHERE (PURE — tests/ghostship.test.mjs; drawn by
// screens/harbor/ghostship.js, witch.js + birds.js). Everything is a function of the local clock (the same moment for every phone,
// a refresh lands mid-way) — never the dice:
//   ghostCrossing(s, n)        THE GHOST SHIP's crossing s seconds in (core/harbor-holiday.js#ghostShipAt gives s + n): where it is
//                              across the harbor (fx: 0..1 of the screen width at its waterline), how solid (alpha: it MATERIALISES out
//                              of the mist with a flicker + dissolves), its heading
//   witchAt(lc, weight)        THE WITCH's pass now (Halloween nights, HP.witch): { s, len, dir, lane } or null
//   batColonyAt(lc, weight, dusk)  THE BATS pouring out of a tower crown at dusk (HP.bats): seconds into the colony's flight or null;
//                              batJinkAt(lc, weight) — the few jinking round the roofs through the night
import { GHOST_LEN } from './harbor-holiday.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const h01 = (n, salt = 0) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt | 0, 0x27d4eb2d); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const hourOf = lc => lc.h + (lc.mi || 0) / 60 + (lc.s || 0) / 3600;

/** the ghost ship in the world: its depth — IN FRONT of the breakwater + the lighthouse (z 150: behind them its hull hid under the
 *  breakwater's top) and of Rosie's berth (142), BEHIND the wheel (132) — its art's length (units) and the art's scale to the world
 *  (0.86: a 26-unit galleon ≈ 22 m) */
export const GHOST = Object.freeze({ z: 140, len: 30, scale: 0.86, mast: 27, fade: 11, gone: 14 });

/**
 * THE GHOST SHIP's crossing. s: seconds in (0..GHOST_LEN), n: which crossing (0 the early one: right → left; 1 the late: left → right).
 * → { fx (0..1 of the screen width: the hull's middle at its waterline), dir (−1 heading left, 1 right), alpha (0..1 how solid),
 *     mist (0..1 the mist on the water: it comes first + stays after), flick (0..1 the materialising flicker's strength) }
 */
export function ghostCrossing(s, n = 0) {
  const len = GHOST_LEN, u = clamp01(s / len);
  const dir = n % 2 ? 1 : -1;
  // between the lighthouse (~0.85 W) and the pier head (~0.53 W) on a phone: in from just right of the lighthouse, drifting with
  // a slow ease (it never quite stops, never hurries), out as it nears the wheel's right side
  const a = 0.9, b = 0.765, e = u * 0.82 + 0.18 * smooth(0, 1, u);
  const fx = dir < 0 ? a + (b - a) * e : b + (a - b) * e;
  const fin = smooth(1.5, GHOST.fade, s), fout = 1 - smooth(len - GHOST.gone, len - 1, s);
  const mist = smooth(0, 6, s) * (1 - smooth(len - 6, len, s));
  return { fx, dir, alpha: fin * fout, mist, flick: (1 - smooth(GHOST.fade - 3, GHOST.fade + 1, s)) + (smooth(len - GHOST.gone, len - GHOST.gone + 2, s) * (1 - smooth(len - 4, len, s))) };
}
/** a forced preview (&force=ghost-ship): a crossing on a loop from 1.5 s after the flag (nowS / since: seconds on the city clock) */
export const GHOST_LOOP = GHOST_LEN + 6;
export function ghostForced(nowS, since) {
  if (since == null) return null;
  const e = nowS - since - 1.5;
  if (e < 0) return null;
  const n = Math.floor(e / GHOST_LOOP), s = e - n * GHOST_LOOP;
  return s < GHOST_LEN ? { s, len: GHOST_LEN, n } : null;
}

/** THE WITCH: one pass every PERIOD minutes of a Halloween night (weight 1: ~every 7 min; the last week's nights, weight ~0.3: ~every
 *  25 min), seeded inside its slot by the date; a pass takes WITCH_LEN s. dir alternates by the slot; lane 0..1 (how high) seeded. */
export const WITCH_LEN = 13;
export function witchAt(lc, weight) {
  if (!lc || !(weight > 0)) return null;
  const hr = hourOf(lc), ev = hr < 12 ? hr + 24 : hr;                        // (the evening's clock: 1 am = 25)
  if (ev < 18 || ev > 28.5) return null;
  const per = (weight >= 0.9 ? 7 : 25) * 60, sec = (ev - 18) * 3600, slot = Math.floor(sec / per), into = sec - slot * per;
  const seed = lc.y * 1000 + lc.m * 40 + (hr < 12 ? lc.d - 1 : lc.d);
  const t0 = 20 + h01(slot, seed) * (per - WITCH_LEN - 40);
  if (into < t0 || into >= t0 + WITCH_LEN) return null;
  return { s: into - t0, len: WITCH_LEN, dir: h01(slot, seed + 7) < 0.5 ? -1 : 1, lane: h01(slot, seed + 13), slot };
}
/** the witch's place along her pass (u 0..1): x across (−0.18 … 1.18 of W), a gentle swoop (y offset in her own heights), her tilt */
export function witchPath(u, dir) {
  const x = dir > 0 ? -0.18 + 1.36 * u : 1.18 - 1.36 * u;
  const swoop = Math.sin(u * Math.PI) * 0.9 + Math.sin(u * Math.PI * 3.2) * 0.18;   // (a dip through the middle + a little bob)
  const tilt = Math.cos(u * Math.PI) * 0.12 + Math.cos(u * Math.PI * 3.2) * 0.05;
  return { x, swoop, tilt };
}

/** THE BAT COLONY at dusk on Halloween night: they pour out of a tower crown from ~20 min after sunset for COLONY_LEN s (the stream ~45
 *  s, then spreading + thinning); weight < 1 (the last week): a smaller flight. → seconds into the colony or null */
export const COLONY_LEN = 75;
export function batColonyAt(lc, weight, dusk = 17.6) {
  if (!lc || !(weight > 0)) return null;
  const hr = hourOf(lc), s = (hr - (dusk + 0.33)) * 3600;
  return s >= 0 && s < COLONY_LEN ? s : null;
}
/** the colony on a loop (&force=bats): every 90 s from 1.5 s after the flag */
export function batColonyForced(nowS, since) {
  if (since == null) return null;
  const e = nowS - since - 1.5;
  if (e < 0) return null;
  const s = e % 90;
  return s < COLONY_LEN ? s : null;
}
/** the night's few jinkers round the roofs (after the colony, until 2 am): a flight of ~40 s every ~3 min (weight 1) / ~10 min */
export function batJinkAt(lc, weight, dusk = 17.6) {
  if (!lc || !(weight > 0)) return null;
  const hr = hourOf(lc), ev = hr < 12 ? hr + 24 : hr;
  if (ev < dusk + 0.4 || ev > 26) return null;
  const per = weight >= 0.9 ? 180 : 600, sec = ev * 3600, slot = Math.floor(sec / per), into = sec - slot * per;
  const t0 = h01(slot, 31) * (per - 45);
  return into >= t0 && into < t0 + 40 ? { s: into - t0, slot } : null;
}
/** one bat of the colony (i of n): when it leaves the crown (s), and its flight out — a rising spiral that opens into the sky,
 *  then a drift + jink (PURE: → { x, y (pt from the crown, y up negative), flap (rad), roll, a (alpha) } or null before it leaves) */
export function colonyBat(i, n, s, K = 1) {
  const r = h01(i, 71), r2 = h01(i, 73), r3 = h01(i, 79);
  // the stream: ~2 a second leaving the crown for ~32 s (a real emergence: a dense ribbon, not a scatter)
  const leave = (i / n) * 32 + r * 1.2;
  const e = s - leave;
  if (e < 0) return null;
  const side = r2 < 0.5 ? -1 : 1;
  // THE COLUMN: each bat spirals up out of the crown for ~5 s (the radius opening 3 → ~20 pt, ~45 pt of climb) — the ones that just
  // left make a swirling column over the crown; then each peels away on its own heading, climbing slowly, jinking
  const SP = 5.2, spin = Math.min(e, SP), turn = side * (spin * 1.9 + r3 * 6.28), rad = (3 + spin * 3.2) * K;
  const away = Math.max(0, e - SP + 0.6), hd = side * (0.25 + r3 * 1.15) + (r - 0.5) * 0.9;
  const vx = Math.cos(hd) * (24 + 18 * r) * K, vy = -(6 + 12 * r2) * K;
  const x = Math.cos(turn) * rad + vx * away + Math.sin(e * (2.3 + r * 2) + r * 9) * 5 * K * Math.min(1, away / 2);
  const y = -spin * 8.5 * K + Math.sin(turn) * rad * 0.35 + vy * away + Math.sin(e * (3.1 + r2 * 2.4)) * 4 * K;
  const a = smooth(0, 0.4, e) * (1 - smooth(16 + r * 12, 24 + r * 14, e));
  if (a <= 0.003 && e > 5) return null;
  const flap = e * (17 + r * 7) + r * 9;
  const roll = Math.cos(turn) * 0.4 * (1 - Math.min(1, away / 2)) + Math.cos(e * (2.3 + r * 2) + r * 9) * 0.3 + side * 0.1;
  return { x, y, flap, roll, a, s: (6.8 + 3 * r2) * K };
}
