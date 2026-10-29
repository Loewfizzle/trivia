// CITY 2.0 — THE HARBOR, 11a-2 Group 2: THE PARADE SYSTEM (PURE — tests/harbor-parade.test.mjs; docs/harbor/passes/part-11a-2.md). A REUSABLE parade:
// a procession of UNITS (a marching band, a giant balloon with its handlers on ropes, a float…) in a fixed seeded ORDER, each its own
// length along the road + a gap, at the parade's slow marching pace, down a ROUTE (the waterside road's near lane, out from behind the
// speakeasy, off the right edge — the procession's route; 'front' = the street under the dock, only while the dock rests — THE STREET
// UNDER THE DOCK IS A STAGE), on the clock: the same on every phone, a page opened mid-way joining it mid-way. While it is in the street
// NO car, bus or cab comes (its hold — the procession's + the legendaries' rule). The crowd lines the promenade's kerb, cheering each
// balloon as it passes. Used first by THANKSGIVING's morning BALLOON PARADE; next by the BIRTHDAY EVENT + later holidays.
//
// ADD A PARADE: a row in PARADES (its day + hour + length, its cycle of units, its balloons) + a window in paradeWindow (the date) +
// any new unit kind's people (core/harbor-people.js#paradeVisits) + art (screens/harbor/parade.js).
import { rngFrom, hashString } from './rng.js';
import { thanksgivingDay } from './harbor-holiday.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** the parade's road: its pace (units / s — a slow march), its two files (z: the near lane's), the lead the hold starts before its head,
 *  the gap between units (units of road), the spectators' kerb (z) + how many */
export const PARADE = Object.freeze({ v: 0.78, files: Object.freeze([55.5, 56.9]), z: 56.2, lead: 50, gap: 3.4, kerb: Object.freeze([51.75, 52.3]), crowd: 10 });   // (crowd 14 → 10: the speed round — ~0.3 ms a figure on the laptop at 2× CPU)
/** the units' kinds: their length along the road (units) */
export const UNIT = Object.freeze({ band: 7.2, balloon: 11.5, float: 7.5 });
/** THE GIANT BALLOONS (original, unbranded): w × h (units — a person is 2.1), how high their foot flies (lift), their handlers, their
 *  palette (the art: screens/harbor/parade.js) */
export const BALLOONS = Object.freeze({
  turkey: Object.freeze({ w: 8.6, h: 8.1, lift: 5.2, handlers: 6 }),
  pumpkin: Object.freeze({ w: 7.3, h: 6.5, lift: 5.4, handlers: 6 }),
  acorn: Object.freeze({ w: 6.0, h: 7.5, lift: 5.4, handlers: 5 }),
  cider: Object.freeze({ w: 6.5, h: 7.3, lift: 5.4, handlers: 5 }),
});
/** the parades: id → { from (local hour), len (s), cycle (the units' order, repeated), balloons (the balloons' order, cycled) } */
export const PARADES = Object.freeze({
  thanksgiving: Object.freeze({ from: 9.0, len: 2.4 * 3600, cycle: Object.freeze(['band', 'balloon', 'balloon', 'band', 'balloon', 'float', 'balloon']), balloons: Object.freeze(['turkey', 'pumpkin', 'acorn', 'cider']) }),
});

const localAt = (t, off = 0) => { const lt = t + off * 60, d = new Date(lt * 1000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: ((lt / 3600) % 24 + 24) % 24, day0: t - (((lt % 86400) + 86400) % 86400) }; };

/** the parade's window near t (abs s) → { id, T0, T1, forced } | null — THANKSGIVING: the fourth Thursday at 9 am, 2 h 24 min; forced
 *  (&force=parade): from forceAt + 1.5 s (its head in at once) */
export function paradeWindow(t, ctx = {}) {
  const P = PARADES.thanksgiving;
  if (ctx.forceAt != null) { const T0 = ctx.forceAt + 1.5; return t > T0 - 600 && t < T0 + P.len + 600 ? { id: 'thanksgiving', T0, T1: T0 + P.len, forced: true } : null; }
  for (const dt of [0, -86400]) {
    const lc = localAt(t + dt, ctx.off);
    if (lc.m !== 11 || lc.d !== thanksgivingDay(lc.y)) continue;
    const T0 = lc.day0 + P.from * 3600, T1 = T0 + P.len;
    if (t > T0 - 3600 && t < T1 + 3600) return { id: 'thanksgiving', T0, T1 };
  }
  return null;
}
/** its traffic hold: from PARADE.lead s before its head until its last unit is off the screen (cross: the road's width in s) */
export const paradeHold = (w, cross = 80) => (w ? [w.T0 - PARADE.lead, w.T1 + cross] : null);

/**
 * the parade's units (PURE, the whole window — a few hundred): [{ i, kind ('band' | 'balloon' | 'float'), balloon (its kind), t (when
 * its HEAD enters the route's start), len (units), seed }] — the cycle repeated, the balloons cycled in their own order; a unit enters
 * once the one before has its length + the gap clear of the start
 */
export function paradeUnits(w) {
  const P = PARADES[w.id] || PARADES.thanksgiving, out = [], r = rngFrom(hashString(`parade|${w.id}|${Math.round(w.T0 / 86400)}`));
  let t = w.T0, i = 0, b = 0;
  while (t < w.T1) {
    const kind = P.cycle[i % P.cycle.length], len = UNIT[kind], u = { i, kind, t, len, seed: Math.floor(r() * 1e9) };
    if (kind === 'balloon') u.balloon = P.balloons[b++ % P.balloons.length];
    out.push(u); i++;
    t += (len + PARADE.gap) / PARADE.v;
  }
  return out;
}
/** the units in view at t (their head past x0, their tail not yet past x1): [{ ...u, head, mid }] */
export function unitsAt(units, t, x0, x1) {
  const out = [];
  for (const u of units) { if (u.t > t) break; const head = x0 + (t - u.t) * PARADE.v; if (head - u.len > x1) continue; out.push({ ...u, head, mid: head - u.len / 2 }); }
  return out;
}

/**
 * a unit's PEOPLE (PURE) — offsets from the unit's head (dx ≤ 0 behind it), their file (z), their role: a BAND (a drum major ahead, then
 * rows of brass, a tuba, drums — two files), a BALLOON's handlers (spread under it in both files, each holding a rope), a FLOAT's crew
 * (a driver + two walkers beside it) → [{ dx, z, role, seed }]
 */
export function unitPeople(u) {
  const r = rngFrom(u.seed), F = PARADE.files, out = [];
  if (u.kind === 'band') {
    out.push({ dx: -0.4, z: PARADE.z, role: 'drummajor', seed: u.seed + 1 });
    const rows = [['brass', 'brass'], ['brass', 'tuba'], ['drum', 'drum']];
    rows.forEach((row, k) => row.forEach((role, j) => out.push({ dx: -2.2 - k * 1.6, z: F[j], role, seed: u.seed + 10 + k * 2 + j })));
  } else if (u.kind === 'balloon') {
    const n = (BALLOONS[u.balloon] || BALLOONS.turkey).handlers;
    for (let k = 0; k < n; k++) out.push({ dx: -1.0 - (k / Math.max(1, n - 1)) * (u.len - 2.0) + (r() - 0.5) * 0.3, z: F[k % 2] + (r() - 0.5) * 0.2, role: 'handler', seed: u.seed + 30 + k, rope: k });
  } else if (u.kind === 'float') {
    out.push({ dx: -0.6, z: F[0], role: 'farmer', seed: u.seed + 50 }, { dx: -u.len + 0.8, z: F[0], role: 'farmer', seed: u.seed + 51 });
  }
  return out;
}

/**
 * THE CROWD along the promenade's kerb (PURE): spectators who walk in before the parade, stand at the kerb facing the road, CHEER (a wave,
 * arms up) as each balloon passes in front of them + watch between, then drift off after → [{ x, z, seed, t0 (in place), t1 (off),
 * cheers: [[a, b]…] (s abs, when a balloon is in front of them) }]. x0 / x1: the route's start + end; xs: the kerb's free stretch [lo, hi]
 */
export function paradeCrowd(w, units, x0, xs) {
  const r = rngFrom(hashString(`crowd|${w.id}|${Math.round(w.T0)}`)), out = [], n = PARADE.crowd;
  for (let k = 0; k < n; k++) {
    const x = xs[0] + (xs[1] - xs[0]) * ((k + 0.25 + r() * 0.5) / n), z = PARADE.kerb[0] + r() * (PARADE.kerb[1] - PARADE.kerb[0]);
    const t0 = w.T0 - 300 - r() * 900, t1 = w.T1 + 60 + r() * 600, cheers = [];
    for (const u of units) { if (u.kind !== 'balloon') continue; const a = u.t + (x - x0) / PARADE.v, b = a + u.len / PARADE.v; if (b < t0 || a > t1) continue; cheers.push([a - 0.5, b + 0.8]); }
    out.push({ k, x, z, seed: Math.floor(r() * 1e9), t0, t1, cheers });
  }
  return out;
}
/** a balloon's motion in the REAL wind at t (s): { sway (rad), drift (units downwind), bob (units up/down) } — wind m/s signed across */
export function balloonMotion(u, t, wind = 2, gust = 0) {
  const ph = (u.seed % 1000) / 160, w = Math.max(-14, Math.min(14, wind)), g = clamp01(Math.abs(gust) / 12);
  const sway = 0.035 * Math.sin(t * 0.55 + ph) + 0.02 * Math.sin(t * 1.3 + ph * 2) + w * 0.006 * (1 + 0.6 * g * Math.sin(t * 2.1 + ph));
  return { sway, drift: w * 0.09 * (1 + 0.4 * Math.sin(t * 0.4 + ph)), bob: 0.22 * Math.sin(t * 0.8 + ph) + 0.08 * Math.sin(t * 2.3 + ph) };
}
