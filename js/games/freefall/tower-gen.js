// FREEFALL — THE TOWER (F1 — docs/freefall.md "THE TOWER" · "FAIR BY CONSTRUCTION"): a floor = a ring of 12 slices round the pillar —
// SAFE · GAP · RED — and its TWIST (its rotation offset). buildFloor(seed, i) is a PURE FUNCTION of (seed, floor index): any floor, in any
// order, on the phone or the server, is the same floor. Difficulty lives HERE and nowhere else (the bounce + the fall never change).
// FAIR BY CONSTRUCTION — every rule below is checked while a floor is BUILT (a red slice that would break one is simply not laid), and
// proved again from the outside by tests/freefall-tower.test.mjs over 2,000+ seeds:
//   · ≥ 1 gap · ≥ 3 safe slices · red ≤ 8 of 12 · floors 0–9 have NO red · red sits beside a gap only from floor 40
//   · in the early areas (floors < 80) every slice straight below a gap (twists counted) is never red
//   · THE FALL WINDOW: from any point of any gap, a human-paced spin (the reaction, then ≤ 1 turn a second) reaches a SAFE or GAP point of
//     the floor below before the landing
//   · NO ISLAND: from every safe slice a gap can be reached by human-paced hops (no stretch of safe slices walled in by red runs too long
//     to cross inside one bounce) — nobody is ever left bouncing for the darkness
//   · floor 0: the slice under the ball at the start (A = 0) is SAFE — a run never starts by falling
// PURE: no DOM, never Math.random / Date; integers + Math.floor / Math.imul only (the one import outside the folder: the integer hash).
import { hashString } from '../../core/rng.js';
import { TURN, SLICES, BALL, SAFE, GAP, RED, RULE_SETS, RULES_DEFAULT, rampOf } from './tuning.js';

const CLASSIC = RULE_SETS[RULES_DEFAULT];
const FULL = (1 << SLICES) - 1;

/** uint32 → uint32, scrambled (Math.imul + shifts: exact on every engine) */
const mix = a => { a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35); return (a ^ (a >>> 16)) >>> 0; };
export const seedHash = seed => hashString(`freefall:${seed}`);
const pick = (h, i, salt) => mix((h ^ Math.imul(i, 0x9e3779b1) ^ salt) >>> 0);

// ---- THE ANGLE MATH (integers, one turn = TURN units)
/** x mod m, never negative */
export const wrap = (x, m = TURN) => ((x % m) + m) % m;
/** the SHORTEST signed way from angle `from` to angle `to`: −TURN / 2 … TURN / 2 − 1 */
export const angDiff = (to, from) => wrap(to - from + TURN / 2) - TURN / 2;
/** the first angle unit of slice `s` (0 … SLICES; SLICES → TURN): the slices are 341 or 342 units wide, every unit in exactly one */
export const sliceStart = s => Math.floor((s * TURN + SLICES - 1) / SLICES);
/** the slice a floor-local angle (0 … TURN − 1) lies in */
export const sliceOf = u => Math.floor(u * SLICES / TURN);
/** THE SLICE UNDER THE BALL on a floor with `twist`, the tower at angle `a`: floor(((BALL − A − twist) mod 4096) × 12 / 4096) */
export const sliceUnder = (a, twist) => sliceOf(wrap(BALL - a - twist));
/** a slice's kind on a floor { gap, red } (two 12-bit masks) */
export const kindAt = (fl, s) => ((fl.gap >> s) & 1 ? GAP : (fl.red >> s) & 1 ? RED : SAFE);
const bits = m => { let n = 0; for (let s = 0; s < SLICES; s++) n += (m >> s) & 1; return n; };
const rot = (m, r) => ((m << r) | (m >> (SLICES - r))) & FULL;

/** how deep `i` counts for the curves (held at the lap's start) + THE TRENCH's lap past it (0 = none yet) */
const lapOf = (i, G) => (i > G.lap.from ? Math.floor((i - G.lap.from - 1) / G.lap.every) + 1 : 0);
/** a curve's value (256ths) at floor `i` with a seeded roll: the whole part + one more by the fraction's chance */
const count256 = (v, roll) => Math.floor(v / 256) + ((roll & 255) < (v & 255) ? 1 : 0);

/** a floor's TWIST: its rotation offset, 0 … TURN − 1 — the seed's pick */
export const twistOf = (h, i) => pick(h, i, 0x7715a1) % TURN;

/** a floor's GAPS (a 12-bit mask) — a function of (seed, floor) alone: how many, each 2 slices wide or 1, never touching each other */
export function gapsOf(h, i, R = CLASSIC) {
  const G = R.gen;
  let n = count256(rampOf(G.gaps, i), pick(h, i, 0x1a9e01));
  if (n < 1) n = 1;
  const wide = rampOf(G.wide, i);
  let mask = 0;
  for (let k = 0; k < n; k++) {
    const w = (pick(h, i, 0x2b7f00 + k) & 255) < wide ? 2 : 1;
    if (bits(mask) + w > G.gapSlicesMax) break;
    const c0 = pick(h, i, 0x3c5d00 + k) % SLICES;
    for (let j = 0; j < SLICES; j++) {
      const c = (c0 + j) % SLICES;
      let free = true;
      for (let q = -1; q <= w; q++) if ((mask >> ((c + q + SLICES) % SLICES)) & 1) { free = false; break; }   // (a solid slice between two gaps, always)
      if (free) { for (let q = 0; q < w; q++) mask |= 1 << ((c + q) % SLICES); break; }
    }
  }
  if (!mask) mask = 1 << (pick(h, i, 0x3c5d00) % SLICES);
  // FLOOR 0: the slice under the ball at the start (A = 0) is solid — the gaps are turned round the ring until it is
  if (i === 0) {
    const s0 = sliceUnder(0, twistOf(h, 0));
    for (let r = 0; r < SLICES && ((mask >> s0) & 1); r++) mask = rot(mask, 1);
  }
  return mask;
}

/** do two arcs of the ring [a, a + la) and [b, b + lb) (angle units, la / lb > 0) share a point? */
function arcsMeet(a, la, b, lb) {
  const d = wrap(b - a);
  return d < la || TURN - d < lb;
}

/**
 * THE FALL WINDOW (+ "straight below a gap is never red" when `reach` is 0): on a floor with these `red` slices and `twist`, under a
 * floor with `gapUp` / `twistUp` — is there a point of a gap above from which EVERY point within `reach` units is red? → false = unfair.
 * (A run of red [r0, r1): its points further than `reach` from both ends are the trap — it must not lie under a gap.)
 */
export function windowOk(red, twist, gapUp, twistUp, reach) {
  if (!red || !gapUp) return true;
  if (red === FULL) return false;
  for (let s = 0; s < SLICES; s++) {
    if (!((red >> s) & 1) || ((red >> ((s + SLICES - 1) % SLICES)) & 1)) continue;   // (s = the first slice of a red run)
    let k = 1;
    while ((red >> ((s + k) % SLICES)) & 1) k++;
    const lo = sliceStart(s), width = (s + k <= SLICES ? sliceStart(s + k) : sliceStart(s + k - SLICES) + TURN) - lo, trap = width - 2 * reach;
    if (trap <= 0) continue;
    for (let g = 0; g < SLICES; g++) {
      if (!((gapUp >> g) & 1)) continue;
      // (the gap's arc, in THIS floor's own angles: local = local above + twist above − twist)
      if (arcsMeet(wrap(lo + reach), trap, wrap(sliceStart(g) + twistUp - twist), sliceStart(g + 1) - sliceStart(g))) return false;
    }
  }
  return true;
}

/**
 * NO ISLAND: every stretch of solid, not-red slices either holds a gap or is joined — across a red run of at most `hop` slices — to one
 * that does (hop after hop). → false = somebody could be walled in.
 */
export function reachOk(gap, red, hop) {
  if (!red) return true;
  if (red === FULL) return false;
  // walk the ring from the first slice after a red one: the stretches of not-red slices, and the red run that follows each
  let s0 = 0;
  while (!((red >> s0) & 1)) s0++;
  while ((red >> s0) & 1) s0 = (s0 + 1) % SLICES;
  const ok = [], after = [];   // per stretch: holds a gap · the red run behind it (slices)
  for (let n = 0, s = s0; n < SLICES;) {
    let has = false;
    while (n < SLICES && !((red >> s) & 1)) { if ((gap >> s) & 1) has = true; s = (s + 1) % SLICES; n++; }
    let k = 0;
    while (n < SLICES && ((red >> s) & 1)) { k++; s = (s + 1) % SLICES; n++; }
    ok.push(has); after.push(k);
  }
  const m = ok.length;
  for (let pass = 0; pass < m; pass++) {
    let moved = false;
    for (let j = 0; j < m; j++) {
      if (ok[j]) continue;
      const next = (j + 1) % m, prev = (j + m - 1) % m;
      if ((ok[next] && after[j] <= hop) || (ok[prev] && after[prev] <= hop)) { ok[j] = true; moved = true; }
    }
    if (!moved) break;
  }
  for (let j = 0; j < m; j++) if (!ok[j]) return false;
  return true;
}

/** a floor's RED slices (a 12-bit mask): laid one at a time, in the seed's order — and only where every fairness rule still holds */
function redOf(h, i, R, gap, twist, gapUp, twistUp) {
  const G = R.gen;
  if (i < G.redFrom) return 0;
  const lap = lapOf(i, G), gaps = bits(gap);
  let want = count256(rampOf(G.red, i) + lap * G.lap.red, pick(h, i, 0x4d3b01));
  const room = SLICES - gaps - G.safeMin;
  if (want > G.redMax) want = G.redMax;
  if (want > room) want = room;
  if (want <= 0) return 0;
  const beside = (rot(gap, 1) | rot(gap, SLICES - 1)) & ~gap & FULL;
  // (above `belowUntil` the reach is 0: a slice straight below a gap is never red; from there on THE FALL WINDOW's human reach)
  const reach = i < G.belowUntil ? 0 : R.reach;
  let red = 0, n = 0;
  const lay = s => {
    const next = red | (1 << s);
    if (i > 0 && !windowOk(next, twist, gapUp, twistUp, reach)) return;
    if (!reachOk(gap, next, R.hop)) return;
    red = next; n++;
  };
  // 1 — RED HUGGING THE GAPS (from floor `hugFrom` only): each slice beside a gap, by the curve's chance
  if (i >= G.hugFrom) {
    let chance = rampOf(G.hug, i) + lap * G.lap.hug;
    if (chance > 256) chance = 256;
    const c0 = pick(h, i, 0x5e2901) % SLICES;
    for (let j = 0; j < SLICES && n < want; j++) {
      const s = (c0 + j) % SLICES;
      if (((beside >> s) & 1) && (pick(h, i, 0x6f1700 + s) & 255) < chance) lay(s);
    }
  }
  // 2 — THE REST, away from the gaps: the seed's own walk round the ring (a start + a stride that visits every slice)
  const c0 = pick(h, i, 0x7a0501) % SLICES, stride = [1, 5, 7, 11][pick(h, i, 0x8b9301) & 3];
  for (let j = 0; j < SLICES && n < want; j++) {
    const s = (c0 + j * stride) % SLICES;
    if (((gap | beside | red) >> s) & 1) continue;
    lay(s);
  }
  return red;
}

/** floor `i` of the tower with seed hash `h`, written INTO `out` { i, twist, gap, red } (the engine keeps ONE record a run) → out */
export function floorInto(h, i, R, out) {
  const twist = twistOf(h, i), gap = gapsOf(h, i, R);
  out.i = i; out.twist = twist; out.gap = gap;
  out.red = i > 0 ? redOf(h, i, R, gap, twist, gapsOf(h, i - 1, R), twistOf(h, i - 1)) : redOf(h, i, R, gap, twist, 0, 0);
  return out;
}
/** … from the seed's hash → a new record */
export const floorAt = (h, i, R = CLASSIC) => floorInto(h, i, R, { i: 0, twist: 0, gap: 0, red: 0 });

/**
 * buildFloor(seed, i) → { i, twist, gap, red, slices } — a PURE FUNCTION of (seed, floor index): `twist` 0 … 4095 · `gap` / `red` = 12-bit
 * masks (bit s = slice s) · `slices` = the 12 kinds in order (SAFE 0 · GAP 1 · RED 2). Slice s covers the floor's own angles
 * sliceStart(s) … sliceStart(s + 1) − 1; in the world it sits at (its own angle + twist + the tower's angle A).
 */
export function buildFloor(seed, i, R = CLASSIC) {
  const fl = floorAt(seedHash(String(seed)), i, R), slices = [];
  for (let s = 0; s < SLICES; s++) slices.push(kindAt(fl, s));
  fl.slices = slices;
  return fl;
}
