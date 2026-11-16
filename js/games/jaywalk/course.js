// JAYWALK — THE COURSE (H1 — docs/jaywalk.md): every lane is a PURE function of (seed, lane index) — built alone, in any order, on the phone
// or the server — and every hazard's position a PURE function of (lane, tick): cars, logs, trains, THE BLACKBIRD, THE UFO. No per-tick
// simulation is needed to know where anything is. PURE: no DOM, no clock, no Math.random; integers + Math.floor only (tuning.js says why).
import { hashString, rngFrom } from '../../core/rng.js';
import {
  FP, COLS, WIDTH, MID_COL, CALM_LANES, STRETCH, landmarkAt, heatAt, byHeat, MIX, FIRST, WATER_RUN_MAX, ROAD, WATER, RAIL, FLIGHT, UFO, GRASS,
  KID_HALF, LOG_GRACE, ONE_UP_FROM, ONE_UP_CHANCE,
} from './tuning.js';

const ri = (rand, a, b) => (b <= a ? a : a + Math.floor(rand() * (b - a + 1)));   // inclusive
export const mod = (a, p) => ((a % p) + p) % p;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);
/** ALL randomness: core/rng.js seeded PER LANE — hashString(seed + lane index) */
const laneRand = (seed, i) => rngFrom(hashString(`${seed}:${i}`));

/** a lane's RAW kind — the first draw of its own rng (the mix by heat; nothing else is looked at) */
export function rawType(seed, i) {
  if (i < CALM_LANES) return 'grass';
  const heat = heatAt(i);
  const wg = Math.max(4, byHeat(MIX.grass[0], MIX.grass[1], heat)), wr = byHeat(MIX.road[0], MIX.road[1], heat);
  const ww = i >= FIRST.water ? byHeat(MIX.water[0], MIX.water[1], heat) : 0, wt = i >= FIRST.rail ? byHeat(MIX.rail[0], MIX.rail[1], heat) : 0;
  const r = Math.floor(laneRand(seed, i)() * (wg + wr + ww + wt));
  return r < wg ? 'grass' : r < wg + wr ? 'road' : r < wg + wr + ww ? 'water' : 'rail';
}

/** A STRETCH's SPECIALS (the 50 lanes after a landmark): THE UFO (from lane 100) or THE BLACKBIRD's flight path (from lane 150) — rare, from
 *  the seed, NEVER both in one stretch. → { s, ufo: zone | null, bb: band | null } */
export function specials(seed, s) {
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
  const out = { s, ufo: null, bb: null };
  if (pick < cu) out.ufo = { id: s, y0: base + a, h: UFO.lanes, r: UFO.r, vx, vy, px, py };
  else if (pick < cu + cb) out.bb = { id: s, y0: base + b, n: FLIGHT.lanes, pulse: { period, phase, tell: FLIGHT.tell, len: FLIGHT.len, v: FLIGHT.v, pass: ceilDiv(WIDTH + FLIGHT.len, FLIGHT.v), dir, band: base + b, n: FLIGHT.lanes } };
  return out;
}
/** can THE UFO's beam reach this lane? (its zone + one lane each side — the circle's reach) */
const ufoReach = (u, i) => !!u && i >= u.y0 - 1 && i <= u.y0 + u.h;

/** a lane's FINAL kind: 'grass' | 'road' | 'water' | 'rail' | 'flight' — the raw kind after the course's rules (the calm opening, the
 *  landmark lanes, the flight path's band, no water / rail under a UFO, never more than 3 water lanes in a row). Reads raw kinds only: no recursion. */
export function typeAt(seed, i, sp = specials(seed, Math.floor(i / STRETCH))) {
  if (i < CALM_LANES || i % STRETCH === 0) return 'grass';
  if (sp.bb && i >= sp.bb.y0 && i < sp.bb.y0 + sp.bb.n) return 'flight';
  let t = rawType(seed, i);
  if ((t === 'water' || t === 'rail') && ufoReach(sp.ufo, i)) return 'grass';
  if (t === 'water') {
    let run = true;
    for (let k = 1; k <= WATER_RUN_MAX && run; k++) if (rawType(seed, i - k) !== 'water') run = false;
    if (run) t = 'grass';
  }
  return t;
}

/** THE ONE-UP's lane in a stretch (−1 = none) — only when the switch is on; the first grass lane at / after its seeded spot */
export function oneUpLane(seed, s) {
  const rand = rngFrom(hashString(`${seed}:u${s}`)), base = s * STRETCH;
  const pick = Math.floor(rand() * 1000), at = base + ri(rand, 5, 40), col = ri(rand, 0, COLS - 1);
  if (pick >= ONE_UP_CHANCE || at < ONE_UP_FROM) return { lane: -1, col: -1 };
  for (let i = at; i < at + 6; i++) if (i % STRETCH !== 0 && typeAt(seed, i) === 'grass') return { lane: i, col };
  return { lane: -1, col: -1 };
}

/** movers (cars / logs): items laid out round ONE LAP of the lane (`period`, FP) — an item's left edge at a tick = mod(off + dir·v·tick, period) − pad */
function layMovers(rand, { v, n, lenOf, gapOf, pad }) {
  const items = [], min = WIDTH + pad + 500;
  let off = 0;
  while (items.length < n || off < min) { const len = lenOf(); items.push({ off, len }); off += len + gapOf(); }
  return { items, period: off };
}

/**
 * ONE LANE — pure by (seed, lane index): { i, type, heat, mark (its landmark's name | null), ufo (THE UFO whose beam can reach it | null),
 *   grass:  obs [9 × 0 | 1], oneUp (its column | −1)
 *   road / water:  dir, v, period, pad, items [{ off, len }]   (cars · logs)
 *   rail / flight: pulse { period, phase, tell, pass, len, v, dir (+ band, n: the flight path's lanes share ONE pulse) } }
 */
export function buildLane(seed, i, o = {}) {
  const s = Math.floor(i / STRETCH), sp = specials(seed, s), type = typeAt(seed, i, sp), heat = heatAt(i);
  const rand = laneRand(seed, i); rand();   // (the first draw was the raw kind)
  const lane = { i, type, heat, mark: landmarkAt(i), ufo: ufoReach(sp.ufo, i) ? sp.ufo : null };
  if (type === 'grass') {
    const obs = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const calm = i < CALM_LANES || !!lane.mark;
    const wet = !calm && (typeAt(seed, i - 1) === 'water' || typeAt(seed, i + 1) === 'water');   // (a log's rider may step off anywhere)
    if (!calm && !wet) {
      let n = ri(rand, clamp(byHeat(GRASS.obstacles[0][0], GRASS.obstacles[1][0], heat), 0, 3), clamp(byHeat(GRASS.obstacles[0][1], GRASS.obstacles[1][1], heat), 0, 6));
      while (n-- > 0) { const c = ri(rand, 0, COLS - 2); obs[c >= MID_COL ? c + 1 : c] = 1; }   // (never the centre column)
    }
    lane.obs = obs; lane.oneUp = -1;
    if (o.oneUp) { const u = oneUpLane(seed, s); if (u.lane === i) { lane.oneUp = u.col; obs[u.col] = 0; } }
  } else if (type === 'road') {
    const dir = rand() < 0.5 ? 1 : -1;
    const v = clamp(ri(rand, byHeat(ROAD.vMin[0], ROAD.vMin[1], heat), byHeat(ROAD.vMax[0], ROAD.vMax[1], heat)), 16, 130);
    const extra = Math.max(600, byHeat(ROAD.gapExtra[0], ROAD.gapExtra[1], heat));
    const m = layMovers(rand, { v, n: ri(rand, ROAD.cars[0], ROAD.cars[1]), pad: 3000, lenOf: () => ROAD.lens[Math.floor(rand() * ROAD.lens.length)], gapOf: () => ROAD.gapMin + v * ROAD.gapVTicks + ri(rand, 0, extra) });
    Object.assign(lane, { dir, v, pad: 3000, period: m.period, items: m.items });
  } else if (type === 'water') {
    const dir = i % 2 ? 1 : -1;   // (two water lanes side by side always run OPPOSITE ways: a rider always meets the next lane's logs)
    const v = clamp(ri(rand, byHeat(WATER.vMin[0], WATER.vMin[1], heat), byHeat(WATER.vMax[0], WATER.vMax[1], heat)), 12, 80);
    const lo = clamp(Math.floor(byHeat(WATER.lenMin[0], WATER.lenMin[1], heat) / FP), 2, 4), hi = clamp(Math.floor(byHeat(WATER.lenMax[0], WATER.lenMax[1], heat) / FP), lo, 4);
    const extra = clamp(byHeat(WATER.gapExtra[0], WATER.gapExtra[1], heat), 800, 3200);
    const m = layMovers(rand, { v, n: ri(rand, WATER.logs[0], WATER.logs[1]), pad: 4000, lenOf: () => ri(rand, lo, hi) * FP, gapOf: () => WATER.gapMin + ri(rand, 0, extra) });
    Object.assign(lane, { dir, v, pad: 4000, period: m.period, items: m.items });
  } else if (type === 'rail') {
    const dir = rand() < 0.5 ? 1 : -1;
    const period = Math.max(150, ri(rand, byHeat(RAIL.period[0][0], RAIL.period[1][0], heat), byHeat(RAIL.period[0][1], RAIL.period[1][1], heat)));
    lane.pulse = { period, phase: ri(rand, 0, period - 1), tell: RAIL.tell, len: RAIL.len, v: RAIL.v, pass: ceilDiv(WIDTH + RAIL.len, RAIL.v), dir };
  } else lane.pulse = sp.bb.pulse;   // (THE FLIGHT PATH: every lane of the band shares the band's one pulse)
  return lane;
}

// ---- WHERE THINGS ARE — pure functions of (lane, tick)
/** a car's / a log's LEFT edge (FP; the screen = 0 … WIDTH) */
export const moverLeft = (lane, item, tick) => mod(item.off + lane.dir * lane.v * tick, lane.period) - lane.pad;
/** a train's / THE BLACKBIRD's lap at a tick → { st: 'idle' | 'tell' | 'pass', k (which pass — a tell names the one coming), s (ticks into the pass) | left (ticks until it) } */
export function pulseAt(p, tick) {
  const u = mod(tick - p.phase, p.period), k = Math.floor((tick - p.phase) / p.period);
  if (u < p.pass) return { st: 'pass', k, s: u, left: 0 };
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
    if (u >= p.pass) return '';
    const l = pulseLeft(p, u);
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

/** a SAFE lane for a respawn: plain ground no beam can reach */
export const isSafeLane = lane => lane.type === 'grass' && !lane.ufo;
/** the free column nearest to `col` on a grass lane (the centre column is always free) */
export function freeCol(lane, col) {
  const c = clamp(col, 0, COLS - 1);
  if (lane.type !== 'grass' || !lane.obs[c]) return c;
  for (let d = 1; d < COLS; d++) {
    const a = c < MID_COL ? c + d : c - d, b = c < MID_COL ? c - d : c + d;   // (toward the centre first)
    if (a >= 0 && a < COLS && !lane.obs[a]) return a;
    if (b >= 0 && b < COLS && !lane.obs[b]) return b;
  }
  return MID_COL;
}

/** THE COURSE of one seed: lane(i) built on demand + kept (a few hundred at most) — the same lanes whatever the order asked */
export function createCourse(seed, o = {}) {
  const key = String(seed), oneUp = !!o.oneUp, lanes = new Map(), keep = o.keep || 700;
  return {
    seed: key, oneUp,
    lane(i) {
      let L = lanes.get(i);
      if (!L) {
        L = buildLane(key, i, { oneUp });
        lanes.set(i, L);
        if (lanes.size > keep) lanes.delete(lanes.keys().next().value);
      }
      return L;
    },
    /** the nearest SAFE lane to `from`, never under `lo` (a tie → the one behind: a respawn gives no free lane) */
    safeLane(from, lo) {
      const f = from < lo ? lo : from;
      for (let d = 0; d < 400; d++) {
        if (f - d >= lo && isSafeLane(this.lane(f - d))) return f - d;
        if (d && isSafeLane(this.lane(f + d))) return f + d;
      }
      return f;
    },
  };
}
