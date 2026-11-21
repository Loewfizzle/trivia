// JAYWALK — THE COURSE (H1 — docs/jaywalk.md): every lane is a PURE function of (seed, lane index) — built alone, in any order, on the phone
// or the server — and every hazard's position a PURE function of (lane, tick): cars, logs, trains, THE BLACKBIRD, THE UFO. No per-tick
// simulation is needed to know where anything is. PURE: no DOM, no clock, no Math.random; integers + Math.floor only (tuning.js says why).
// J2 — COURSE RULES v2 (versions.js): a course is a pure function of (seed, COURSE VERSION) — `cv` 1 (the default everywhere: the rules
// exactly as they shipped up to J1 — tests/jaywalk-v1-frozen.test.mjs holds them to the frozen copy byte for byte) or 2 (EVEN STARTS +
// THE BLACKBIRD's RUNWAYS). Every v2 change sits behind `cv >= 2`; the v1 path is never touched.
import { hashString, rngFrom } from '../../core/rng.js';
import {
  FP, COLS, WIDTH, MID_COL, CALM_LANES, STRETCH, LANDMARKS, landmarkAt, heatAt, byHeat, MIX, FIRST, WATER_RUN_MAX, RAIL_RUN_MAX, ROAD, WATER, RAIL, FLIGHT, UFO, GRASS,
  KID_HALF, LOG_GRACE, AREAS, NO_LEAN, areaIndex,
} from './tuning.js';

const ri = (rand, a, b) => (b <= a ? a : a + Math.floor(rand() * (b - a + 1)));   // inclusive
export const mod = (a, p) => ((a % p) + p) % p;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);
/** ALL randomness: core/rng.js seeded PER LANE — hashString(seed + lane index) */
const laneRand = (seed, i) => rngFrom(hashString(`${seed}:${i}`));

/** THE AREA a lane is in (H5A — tuning.js#AREAS): { name, index (−1 = the opening, lanes 0–49 · 0 … 7), loop (0 = the first time
 *  round, 1 = the loop's second lap …) } — lanes 50–99 THE DOCKS … 400–449 THE AIRFIELD, 450–499 THE DOCKS again */
export function area(lane) {
  const s = Math.floor(lane / STRETCH), n = LANDMARKS.length;
  return s < 1 ? { name: '', index: -1, loop: 0 } : { name: LANDMARKS[(s - 1) % n], index: (s - 1) % n, loop: Math.floor((s - 1) / n) };
}
/** an area's name as its GATEWAY shows it: the loop's laps are named — THE DOCKS · LAP 2 */
export const gateName = lane => { const a = area(lane); return a.index < 0 ? '' : a.loop ? `${a.name} · LAP ${a.loop + 1}` : a.name; };
const leanOf = i => { const k = areaIndex(i); return k < 0 ? NO_LEAN : AREAS[k]; };

/** a lane's RAW kind — the first draw of its own rng (the mix by heat × THE AREA's lean; nothing else is looked at) */
export function rawType(seed, i, cv = 1) {
  if (i < CALM_LANES) return 'grass';
  const heat = heatAt(i), m = leanOf(i).mix, pc = (w, k) => Math.floor(w * m[k] / 100);
  const wg = Math.max(4, pc(byHeat(MIX.grass[0], MIX.grass[1], heat), 0)), wr = pc(byHeat(MIX.road[0], MIX.road[1], heat), 1);
  const ww = i >= FIRST.water ? pc(byHeat(MIX.water[0], MIX.water[1], heat), 2) : 0, wt = i >= FIRST.rail ? pc(byHeat(MIX.rail[0], MIX.rail[1], heat), 3) : 0;
  const r = Math.floor(laneRand(seed, i)() * (wg + wr + ww + wt));
  return r < wg ? 'grass' : r < wg + wr ? 'road' : r < wg + wr + ww ? 'water' : 'rail';
}

/** A STRETCH's SPECIALS (the 50 lanes after a landmark): THE UFO (from lane 100) or THE BLACKBIRD's flight path (from lane 150) — rare, from
 *  the seed, NEVER both in one stretch. → { s, ufo: zone | null, bb: band | null } */
export function specials(seed, s, cv = 1) {
  const rand = rngFrom(hashString(`${seed}:s${s}`)), base = s * STRETCH, heat = heatAt(base);
  const pick = Math.floor(rand() * 1000);
  const a = ri(rand, 8, 30), b = ri(rand, 10, 38);
  const vx = ri(rand, UFO.vx[0], UFO.vx[1]) * (rand() < 0.5 ? 1 : -1), vy = ri(rand, UFO.vy[0], UFO.vy[1]) * (rand() < 0.5 ? 1 : -1);
  const px = ri(rand, 0, 2 * WIDTH - 1), py = ri(rand, 0, 2 * UFO.lanes * FP - 1);
  const dir = rand() < 0.5 ? 1 : -1;
  const period = Math.max(240, ri(rand, byHeat(FLIGHT.period[0][0], FLIGHT.period[1][0], heat), byHeat(FLIGHT.period[0][1], FLIGHT.period[1][1], heat)));
  const phase = ri(rand, 0, period - 1);
  const cu = base >= FIRST.ufo ? Math.min(450, byHeat(UFO.chance[0], UFO.chance[1], heat)) : 0;
  const cb = base >= FIRST.flight ? Math.min(450, byHeat(FLIGHT.chance[0], FLIGHT.chance[1], heat)) : 0;
  const out = { s, ufo: null, bb: null, bb2: null };
  const band = (y0, per, ph, d) => ({ id: s, y0, n: FLIGHT.lanes, pulse: { period: per, phase: ph, tell: FLIGHT.tell, len: FLIGHT.len, v: FLIGHT.v, pass: ceilDiv(WIDTH + FLIGHT.len, FLIGHT.v), dir: d, band: y0, n: FLIGHT.lanes } });
  if (leanOf(base).flight && base >= FIRST.flight) {
    // THE AIRFIELD (H5A): its flight paths FOR SURE — two bands, 16–18 lanes apart, each with its own pulse; never a UFO in the stretch
    const b2 = 8 + mod(b - 8 + 18, 34);
    const period2 = Math.max(240, ri(rand, byHeat(FLIGHT.period[0][0], FLIGHT.period[1][0], heat), byHeat(FLIGHT.period[0][1], FLIGHT.period[1][1], heat)));
    const phase2 = ri(rand, 0, period2 - 1), dir2 = rand() < 0.5 ? 1 : -1;
    out.bb = band(base + b, period, phase, dir); out.bb2 = band(base + b2, period2, phase2, dir2);
  } else if (pick < cu) out.ufo = { id: s, y0: base + a, h: UFO.lanes, r: UFO.r, vx, vy, px, py };
  else if (pick < cu + cb) out.bb = band(base + b, period, phase, dir);
  return out;
}
/** the flight band (of a stretch's one or two) this lane is on — or null */
const bandAt = (sp, i) => (sp.bb && i >= sp.bb.y0 && i < sp.bb.y0 + sp.bb.n ? sp.bb : sp.bb2 && i >= sp.bb2.y0 && i < sp.bb2.y0 + sp.bb2.n ? sp.bb2 : null);
/** can THE UFO's beam reach this lane? (its zone + one lane each side — the circle's reach) */
const ufoReach = (u, i) => !!u && i >= u.y0 - 1 && i <= u.y0 + u.h;

/** a lane's FINAL kind: 'grass' | 'road' | 'water' | 'rail' | 'flight' — the raw kind after the course's rules (the calm opening, the
 *  landmark lanes, the flight path's bands, no water / rail under a UFO, never more than 3 water — or 3 rail — lanes in a row). Reads raw kinds only: no recursion. */
export function typeAt(seed, i, sp = null, cv = 1) {
  if (!sp) sp = specials(seed, Math.floor(i / STRETCH), cv);
  if (i < CALM_LANES || i % STRETCH === 0) return 'grass';
  if (bandAt(sp, i)) return 'flight';
  let t = rawType(seed, i);
  if ((t === 'water' || t === 'rail') && ufoReach(sp.ufo, i)) return 'grass';
  if (t === 'water' || t === 'rail') {
    // (never more than 3 water — or 3 rail — lanes in a row: in a long raw run every 4th lane is ground. H5A: a run goes ON after its
    //  break — THE CANAL / THE RAIL YARD read as water / rails with footings, not one block and then a field)
    const max = t === 'water' ? WATER_RUN_MAX : RAIL_RUN_MAX;
    let n = 0;
    while (n < i && rawType(seed, i - 1 - n) === t) n++;   // (the raw run behind this lane — it ends at the calm opening at the latest)
    if (n % (max + 1) === max) t = 'grass';
  }
  return t;
}

/** movers (cars / logs): items laid out round ONE LAP of the lane (`period`, FP) — an item's left edge at a tick = mod(off + dir·v·tick, period) − pad */
function layMovers(rand, { v, n, lenOf, gapOf, pad }) {
  const items = [], min = WIDTH + pad + 500;
  let off = 0;
  while (items.length < n || off < min) { const len = lenOf(); items.push({ off, len }); off += len + gapOf(); }
  return { items, period: off };
}

/**
 * ONE LANE — pure by (seed, lane index): { i, type, heat, mark (its landmark's name | null — the GATEWAY into that area), ufo (THE UFO whose beam can reach it | null),
 *   grass:  obs [9 × 0 | 1]
 *   road / water:  dir, v, period, pad, items [{ off, len }]   (cars · logs)
 *   rail / flight: pulse { period, phase, tell, pass, len, v, dir (+ band, n: the flight path's lanes share ONE pulse) } }
 */
export function buildLane(seed, i, cv = 1) {
  const s = Math.floor(i / STRETCH), sp = specials(seed, s, cv), type = typeAt(seed, i, sp, cv), heat = heatAt(i);
  const rand = laneRand(seed, i); rand();   // (the first draw was the raw kind)
  const lane = { i, type, heat, mark: landmarkAt(i), ufo: ufoReach(sp.ufo, i) ? sp.ufo : null };
  if (type === 'grass') {
    const obs = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const calm = i < CALM_LANES || !!lane.mark;
    const wet = !calm && (typeAt(seed, i - 1, null, cv) === 'water' || typeAt(seed, i + 1, null, cv) === 'water');   // (a log's rider may step off anywhere)
    if (!calm && !wet) {
      let n = ri(rand, clamp(byHeat(GRASS.obstacles[0][0], GRASS.obstacles[1][0], heat), 0, 3), clamp(byHeat(GRASS.obstacles[0][1], GRASS.obstacles[1][1], heat), 0, 6));
      while (n-- > 0) { const c = ri(rand, 0, COLS - 2); obs[c >= MID_COL ? c + 1 : c] = 1; }   // (never the centre column)
    }
    lane.obs = obs;
  } else if (type === 'road') {
    const dir = rand() < 0.5 ? 1 : -1;
    const v = clamp(ri(rand, byHeat(ROAD.vMin[0], ROAD.vMin[1], heat), byHeat(ROAD.vMax[0], ROAD.vMax[1], heat)), 16, 130);
    // (H5A — an area's HEAVIER TRAFFIC, DOWNTOWN: more cars a lap + less spare room — the crossable gap itself, gapMin + gapVTicks, is never touched)
    const A = leanOf(i), extra = Math.max(600, Math.floor(byHeat(ROAD.gapExtra[0], ROAD.gapExtra[1], heat) * (A.gap || 100) / 100));
    const m = layMovers(rand, { v, n: ri(rand, ROAD.cars[0], ROAD.cars[1]) + (A.cars || 0), pad: 3000, lenOf: () => ROAD.lens[Math.floor(rand() * ROAD.lens.length)], gapOf: () => ROAD.gapMin + v * ROAD.gapVTicks + ri(rand, 0, extra) });
    Object.assign(lane, { dir, v, pad: 3000, period: m.period, items: m.items });
  } else if (type === 'water') {
    const dir = i % 2 ? 1 : -1;   // (two water lanes side by side always run OPPOSITE ways: a rider always meets the next lane's logs)
    const v = clamp(ri(rand, byHeat(WATER.vMin[0], WATER.vMin[1], heat), byHeat(WATER.vMax[0], WATER.vMax[1], heat)), 12, 80);
    // H3 — every log its OWN length (1–4 cells: long ones early, short ones later — the weights by heat) + UNEVEN gaps (short · long). A
    // 1-cell log is the hard one: only on a slow lane (WATER.oneV) with no water lane beside it (a hop log-to-log always has ≥ 2 cells to land on)
    const W = [0, 1, 2, 3].map(k => Math.max(1, byHeat(WATER.lenW[0][k], WATER.lenW[1][k], heat))), sum = W[0] + W[1] + W[2] + W[3];
    const one = v <= WATER.oneV && typeAt(seed, i - 1, null, cv) !== 'water' && typeAt(seed, i + 1, null, cv) !== 'water';
    const lenOf = () => { let r = Math.floor(rand() * sum), n = 0; while (n < 3 && r >= W[n]) r -= W[n++]; return (n === 0 && !one ? 2 : n + 1) * FP; };
    const extra = clamp(byHeat(WATER.gapExtra[0], WATER.gapExtra[1], heat), 800, 3200);
    const gapOf = () => (Math.floor(rand() * 1000) < WATER.shortOf ? ri(rand, WATER.gapShort[0], WATER.gapShort[1]) : WATER.gapMin + ri(rand, 0, extra));
    const m = layMovers(rand, { v, n: ri(rand, WATER.logs[0], WATER.logs[1]), pad: 4000, lenOf, gapOf });
    Object.assign(lane, { dir, v, pad: 4000, period: m.period, items: m.items });
  } else if (type === 'rail') {
    const dir = rand() < 0.5 ? 1 : -1;
    const period = Math.max(150, ri(rand, byHeat(RAIL.period[0][0], RAIL.period[1][0], heat), byHeat(RAIL.period[0][1], RAIL.period[1][1], heat)));
    lane.pulse = { period, phase: ri(rand, 0, period - 1), tell: RAIL.tell, len: RAIL.len, v: RAIL.v, pass: ceilDiv(WIDTH + RAIL.len, RAIL.v), dir };
  } else lane.pulse = bandAt(sp, i).pulse;   // (THE FLIGHT PATH: every lane of the band shares the band's one pulse)
  return lane;
}

// ---- WHERE THINGS ARE — pure functions of (lane, tick)
/** a car's / a log's LEFT edge (FP; the screen = 0 … WIDTH) */
export const moverLeft = (lane, item, tick) => mod(item.off + lane.dir * lane.v * tick, lane.period) - lane.pad;
/** a train's / THE BLACKBIRD's lap at a tick → { st: 'idle' | 'tell' | 'pass', k (which pass — a tell names the one coming), s (ticks into the pass) | left (ticks until it) } */
export function pulseAt(p, tick) {
  const u = mod(tick - p.phase, p.period), k = Math.floor((tick - p.phase) / p.period);
  if (u < p.pass) return { st: 'pass', k, s: u, left: 0 };
  if (p.trail && u < p.pass + p.trail) return { st: 'trail', k, s: u - p.pass, left: p.period - u };   // (J2 — v2's RUNWAYS: THE AFTERBURNER TRAIL burns on — still deadly)
  if (u >= p.period - p.tell) return { st: 'tell', k: k + 1, s: 0, left: p.period - u };
  return { st: 'idle', k, s: 0, left: p.period - u };
}
/** the body's LEFT edge, s ticks into its pass (it enters at one side, leaves at the other in `pass` ticks) */
export const pulseLeft = (p, s) => (p.dir > 0 ? p.v * s - p.len : WIDTH - p.v * s);
const tri = (a, span) => { const m = mod(a, 2 * span); return m < span ? m : 2 * span - m; };
/** THE UFO's beam centre at a tick (FP: x across the columns, y up the lanes) — a slow diagonal drift, bouncing inside its zone */
export const ufoX = (u, tick) => tri(u.px + u.vx * tick, WIDTH);
export const ufoY = (u, tick) => u.y0 * FP + tri(u.py + u.vy * tick, u.h * FP);

/** what a kid whose centre is at x (FP) on this lane is hit by at this tick: 'car' | 'train' | 'blackbird' | '' (water + THE UFO are the engine's) */
export function laneHit(lane, tick, x) {
  const t = lane.type;
  if (t === 'road') {
    const a = x - KID_HALF, b = x + KID_HALF, items = lane.items;
    for (let j = 0; j < items.length; j++) { const l = moverLeft(lane, items[j], tick); if (l < b && l + items[j].len > a) return 'car'; }
    return '';
  }
  if (t === 'rail' || t === 'flight') {
    const p = lane.pulse, u = mod(tick - p.phase, p.period);
    // (J2 — a v2 RUNWAY lane's jet lays THE AFTERBURNER TRAIL: everything behind it burns through the pass, then the WHOLE lane for
    //  `trail` ticks after it — the cause stays 'blackbird'. A v1 pulse has no `trail`: the body alone, as it always was)
    if (u >= p.pass) return p.trail && u < p.pass + p.trail ? 'blackbird' : '';
    const l = pulseLeft(p, u);
    if (p.trail) return (p.dir > 0 ? x - KID_HALF < l + p.len : x + KID_HALF > l) ? 'blackbird' : '';
    return l < x + KID_HALF && l + p.len > x - KID_HALF ? (t === 'rail' ? 'train' : 'blackbird') : '';
  }
  return '';
}
/** the log under a kid whose centre is at x on this WATER lane at this tick (its index, −1 = the water) */
export function logUnder(lane, tick, x) {
  const items = lane.items;
  for (let j = 0; j < items.length; j++) { const l = moverLeft(lane, items[j], tick); if (x >= l - LOG_GRACE && x <= l + items[j].len + LOG_GRACE) return j; }
  return -1;
}
/** the nearest car to x on a ROAD lane: its index when an edge is within `reach` of x (−1 = none) — the near miss */
export function carNear(lane, tick, x, reach) {
  const items = lane.items;
  for (let j = 0; j < items.length; j++) { const l = moverLeft(lane, items[j], tick); if (l - reach < x && l + items[j].len + reach > x) return j; }
  return -1;
}

/** THE COURSE of one seed: lane(i) built on demand + kept (a few hundred at most) — the same lanes whatever the order asked */
export function createCourse(seed, o = {}) {
  const key = String(seed), lanes = new Map(), keep = o.keep || 700, cv = o.cv === 2 ? 2 : 1;   // (J2: the COURSE VERSION — 1 unless asked)
  return {
    seed: key, cv,
    lane(i) {
      let L = lanes.get(i);
      if (!L) {
        L = buildLane(key, i, cv);
        lanes.set(i, L);
        if (lanes.size > keep) lanes.delete(lanes.keys().next().value);
      }
      return L;
    },
  };
}
