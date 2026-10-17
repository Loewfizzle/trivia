// SLIPSTREAM — the course (PURE, deterministic from the match seed: every phone builds the identical course).
//
// Units: metres, x along the course, y up. The floor is sampled every DX (0.25 m) from a chain of control points
// joined by cosine curves (zero slope at every point: smooth crests and valleys, Tiny Wings style). Difficulty
// follows the NOMINAL TIME T(x) — how long an average rider takes to get there — so hazards, biomes and
// steepness arrive at the intended moments however fast the hills are taken.
//
//   0–45 s     DUSK DUNES, rolling hills, no hazards (boost rings from 20 s)
//   45 s on    gaps; 75 s low ceilings; 100 s laser gates (blinking from 200 s); 130 s crumbling ground;
//              160 s the first GRAVITY FLIP (then every ~60 s); hazards ever closer together, hills steeper
//   315 s on   OPEN SPACE; 360 s on SUDDEN DEATH (time-based speed surge + hazards every ~1.5 s)
// Biomes: DUSK DUNES first, then CRYSTAL CANYON / FLOATING CITY / LIGHTNING STORM twice in seeded orders (every
// ~45 s), then OPEN SPACE for the longest survivors. Each biome entry has one of 3 seeded variants.
// Every hazard is placed against the physics (physics.js#ballistic etc.) so it is clearable, and
// tests/slip.test.mjs drives a bot (bot.js) through many seeds to prove it.
import { rngFrom, shuffle } from '../../core/rng.js';

export const DX = 0.25;
export const LENGTH = 22000;         // metres generated (a long ride at sudden-death speeds is ~16 km)
export const G = 20;                 // game gravity (m/s²) on the ground
export const AIR_FLOAT = 0.62;       // in the air, not holding: lighter gravity (floaty flights; holding pulls you down hard)
export const BIOME_S = 45;
export const SPACE_T = 315;
export const SUDDEN_T = 360;
export const MIDDLE = ['crystal', 'city', 'storm'];
export const BIOMES = ['dunes', 'crystal', 'city', 'storm', 'space'];

/** Base (minimum) speed at match time t seconds: calm, building to 26 m/s at 6 minutes, then surging. */
export function baseSpeed(t) {
  const tt = Math.max(0, t);
  if (tt <= SUDDEN_T) return 12 + 14 * Math.pow(tt / SUDDEN_T, 1.15);
  return 26 + 2.4 * (tt - SUDDEN_T) / 10;
}
/** The pace generation plans for (riders dive faster than the minimum). */
export const nominalSpeed = t => baseSpeed(t) * 1.5;   // measured: good riders average ~1.6× the base speed
export const maxSpeed = t => baseSpeed(t) * 2.2 + 6;
/** 0 at the start, 1 at sudden death (difficulty dial). */
export const difficulty = T => Math.max(0, Math.min(1, (T - 40) / (SUDDEN_T - 40)));

const smooth01 = u => (1 - Math.cos(Math.PI * u)) / 2;

export function createCourse(seed) {
  const rnd = rngFrom(`${seed}:course`);
  const n = Math.ceil(LENGTH / DX) + 1;
  const h = new Float32Array(n);
  const solid = new Uint8Array(n).fill(1);
  const ceil = new Float32Array(n).fill(NaN);
  const tAt = new Float32Array(Math.ceil(LENGTH / 8) + 1);   // nominal time every 8 m
  const hz = { gaps: [], lasers: [], zaps: [], crumbles: [], rings: [], flips: [] };
  const pts = [];                                            // control points [x, y]

  // ---- nominal time along the course (difficulty + biomes depend on it)
  let T = 0;
  const timeTable = [];
  for (let x = 0, k = 0; x <= LENGTH; x += 8, k++) { tAt[k] = T; timeTable.push(T); T += 8 / nominalSpeed(T); }
  const timeAt = x => tAt[Math.min(tAt.length - 1, Math.max(0, Math.floor(x / 8)))];
  const xAtTime = t => { let k = 0; while (k < tAt.length - 1 && tAt[k] < t) k++; return k * 8; };

  // ---- biomes
  const r2 = rngFrom(`${seed}:biomes`);
  const first = shuffle(r2, MIDDLE);
  let second = shuffle(r2, MIDDLE);
  if (second[0] === first[2]) second = [second[1], second[0], second[2]];
  const order = ['dunes', ...first, ...second];
  const biomes = order.map((id, i) => ({ id, variant: Math.floor(r2() * 3), x0: xAtTime(i * BIOME_S), x1: xAtTime((i + 1) * BIOME_S) }));
  biomes.push({ id: 'space', variant: Math.floor(r2() * 3), x0: xAtTime(SPACE_T), x1: LENGTH + 1000 });

  // ---- pass 1: terrain control points, crest by crest, + hazard requests
  // A hill's crest curvature κ decides the speed it launches you at (v² κ > g): κ = g / vLaunch², with vLaunch a
  // little above the base speed, so diving down the hill before is what gets you airborne.
  let x = 0, y = 0;
  pts.push([0, 0]);
  const add = (px, py) => { pts.push([px, py]); x = px; y = py; };
  add(30, 0);                                   // a flat start line
  // vL: the launch speed. Hazard crests (before a gap or a laser gate) launch a little below the base speed for that
  // stretch, so any rider who carries momentum up the climb gets airborne there.
  const hill = (T0, calm, scale = 1, launchF = null) => {
    const k = difficulty(T0);
    const vb = baseSpeed(T0);
    const D = nominalSpeed(T0) * (0.85 + rnd() * 0.3) * scale;          // valley -> crest distance
    const vL = vb * (launchF ?? (calm ? 1.1 + rnd() * 0.25 : 1.0 + rnd() * 0.18 - 0.06 * k));
    const kap = G / (vL * vL);
    const A = Math.min(14, kap * 2 * D * D / (Math.PI * Math.PI));        // cosine crest curvature = A·π²/(2·D²)
    return { D, A, vL };
  };
  const reqs = [];
  const crestCount = () => true;
  let nextHazardT = 45;
  let nextRingT = 20;
  let nextFlipT = 160;
  let lastKind = '';
  const bag = [];
  let drift = 0;                                // keeps the mean height near 0
  while (x < LENGTH - 400) {
    const T0 = timeAt(x);
    const k = difficulty(T0);
    const sd = Math.max(0, Math.min(1, (T0 - SUDDEN_T) / 60));
    const calm = T0 < 45;
    // will this crest carry a gap / a laser gate? (decided first: its launch speed depends on it)
    const hazardNext = crestCount() && T0 >= nextHazardT && T0 < nextFlipT && x >= 120;
    const { D, A, vL } = hill(T0, calm, 1, hazardNext ? 0.88 : null);
    // descent to the valley, then the climb to the crest (same curvature both sides, so the crest launches at vL)
    drift = y * 0.15;
    add(x + D, y - A - drift);
    add(x + D, y + A);
    const crest = x, crestY = y;
    if (crest < 120) continue;
    if (T0 >= nextRingT && rnd() < 0.5) { reqs.push({ kind: 'ring', crest, crestY, T0, k, vL }); nextRingT = T0 + 6 + rnd() * 8; }
    if (T0 < nextHazardT) continue;
    const unlocked = ['gap'];
    if (T0 >= 75) unlocked.push('zap');
    if (T0 >= 100) unlocked.push('laser');
    if (T0 >= 130) unlocked.push('crumble');
    let kind;
    if (T0 >= nextFlipT && lastKind !== 'flip') kind = 'flip';
    else {
      if (!bag.length) bag.push(...shuffle(rnd, unlocked));
      kind = bag.shift();
      if (kind === lastKind && bag.length) { bag.push(kind); kind = bag.shift(); }
    }
    lastKind = kind;
    const req = { kind, crest, crestY, T0, k, vL };
    if (kind === 'gap' || kind === 'laser') {
      // a deep descent after this crest for the hazard to sit on: it falls away faster than any launch arc
      // (curvature > the crest's), so a jump off this crest really flies
      add(x + D * (1.1 + 0.15 * rnd()), y - (A * 1.8 + 2.5));
    } else if (kind === 'zap') {
      req.x0 = crest - 4;
      for (let i = 0; i < 2; i++) { const h2 = hill(T0, false); add(x + h2.D, y - h2.A); add(x + h2.D, y + h2.A); }
      req.x1 = x + 2;
    } else if (kind === 'crumble') {
      const h2 = hill(T0, false);
      add(x + h2.D, y - h2.A); add(x + h2.D, y + h2.A);
      req.x0 = crest + 2; req.x1 = x - 1;
    } else if (kind === 'flip') {
      // GRAVITY FLIP: past an arch just after the crest the floor ends and gravity points up to a ceiling track;
      // at the end gravity returns and the rider drops onto a long, gentle downhill
      const v = nominalSpeed(T0);
      const len = v * (3.2 + 0.6 * rnd());
      req.x0 = crest + 3; req.x1 = req.x0 + len;
      req.cy = crestY + 10.5;
      add(req.x1 - 6, crestY - 1);
      add(req.x1 + 34, crestY - 8);
      nextFlipT = T0 + 52 + rnd() * 18;
    }
    reqs.push(req);
    const gapS = sd > 0 ? 1.5 - 0.4 * sd : 7.5 - 4.9 * k;
    nextHazardT = timeAt(x) + gapS * (0.8 + rnd() * 0.4);
  }
  add(LENGTH + 50, y);

  // ---- pass 2: fill the floor + ceilings
  for (let p = 0; p + 1 < pts.length; p++) {
    const [x0, y0] = pts[p], [x1, y1] = pts[p + 1];
    const i0 = Math.max(0, Math.floor(x0 / DX)), i1 = Math.min(n - 1, Math.ceil(x1 / DX));
    for (let i = i0; i <= i1; i++) {
      const xx = i * DX;
      if (xx < x0 || xx > x1) continue;
      h[i] = y0 + (y1 - y0) * smooth01((xx - x0) / (x1 - x0 || 1));
    }
  }
  for (const r of reqs) if (r.kind === 'flip') {
    const f = { x0: r.x0, x1: r.x1, cy: r.cy, camp: 1.2, waves: Math.max(1, Math.round((r.x1 - r.x0) / 45)) };
    hz.flips.push(f);
    // the ceiling runs a few metres past both ends (a rider stepping over the edge never reads a missing height)
    for (let i = Math.ceil((f.x0 - 4) / DX); i <= Math.floor((f.x1 + 4) / DX); i++) {
      if (i * DX >= f.x0 && i * DX <= f.x1) solid[i] = 0;
      const u = Math.max(0, Math.min(1, (i * DX - f.x0) / (f.x1 - f.x0)));
      ceil[i] = f.cy + Math.sin(u * Math.PI * 2 * f.waves) * f.camp;
    }
  }
  const dh = new Float32Array(n), ddh = new Float32Array(n), dc = new Float32Array(n), ddc = new Float32Array(n);
  for (let i = 1; i < n - 1; i++) {
    dh[i] = (h[i + 1] - h[i - 1]) / (2 * DX);
    ddh[i] = (h[i + 1] - 2 * h[i] + h[i - 1]) / (DX * DX);
    if (!Number.isNaN(ceil[i])) {
      const a = Number.isNaN(ceil[i - 1]) ? ceil[i] : ceil[i - 1], b = Number.isNaN(ceil[i + 1]) ? ceil[i] : ceil[i + 1];
      dc[i] = (b - a) / (2 * DX);
      ddc[i] = (b - 2 * ceil[i] + a) / (DX * DX);
    }
  }
  const course = { seed, n, h, dh, ddh, solid, ceil, dc, ddc, hz, biomes, tAt, timeAt, L: LENGTH, pts };

  // ---- pass 3: size the hazards against probe rides over the finished floor
  for (const r of reqs) {
    if (r.kind === 'ring') {
      const p = probe(course, r.crest - 30, r.vL * 1.45);
      if (p && p.apex) hz.rings.push({ id: hz.rings.length, x: +p.apex.x.toFixed(2), y: +(p.apex.y + 0.6 + rnd() * 1.6).toFixed(2), r: 1.8 });
    } else if (r.kind === 'gap') {
      // the floor is missing past the crest; a release at the needed speed (a dive above the launch speed) clears it
      const need = r.vL * (1.02 + 0.1 * r.k);
      const p = probe(course, r.crest - 30, need);
      if (!p || !p.land) continue;
      const g0 = Math.max(r.crest + 1.2, p.launch + 1.5), g1 = p.land - 4 - 2 * (1 - r.k);
      if (g1 - g0 < 4 || g0 < r.crest) continue;
      hz.gaps.push({ x0: +g0.toFixed(2), x1: +g1.toFixed(2), need: +need.toFixed(2) });
      for (let i = Math.ceil(g0 / DX); i <= Math.floor(g1 / DX); i++) solid[i] = 0;
    } else if (r.kind === 'laser') {
      // the opening: from just above the ground to above the highest jump off this crest — any real jump passes,
      // skimming the ground (no jump) hits the low beam
      // the gate sits where even a modest jump (1.2× the launch speed) is clearly airborne
      let gx = null;
      for (let d = 9; d <= 40; d += 1.5) {
        const p = probe(course, r.crest - 30, r.vL * 1.2, r.crest + d);
        if (p && p.atGate != null && p.atGate - floorAt(course, r.crest + d) >= 1.7) { gx = r.crest + d + rnd() * 1.5; break; }
      }
      if (gx == null) continue;
      const ys = [];
      for (const f of [1.2, 1.5, 1.8, 2.2, 2.6]) {
        const p = probe(course, r.crest - 30, r.vL * f, gx);
        if (p && p.atGate != null) ys.push(p.atGate);
        if (p && p.apex && p.apex.x < gx) ys.push(p.apex.y);
      }
      if (ys.length < 2) continue;
      const ground = floorAt(course, gx);
      const lo = ground + 1.15;
      let hi = Math.max(...ys) + 3;
      if (hi - lo < 4.5) hi = lo + 4.5;
      const blink = r.T0 >= 200 && rnd() < 0.5;
      hz.lasers.push({ x: +gx.toFixed(2), lo: +lo.toFixed(2), hi: +hi.toFixed(2), ground: +ground.toFixed(2), blink, period: 2.2, on: 0.55, phase: +rnd().toFixed(3) });
    } else if (r.kind === 'zap') {
      hz.zaps.push({ x0: r.x0, x1: r.x1, above: +(4.6 + 1.2 * (1 - r.k)).toFixed(2) });
    } else if (r.kind === 'crumble') {
      hz.crumbles.push({ x0: r.x0, x1: r.x1, tile: 4.2, delay: +(0.55 - 0.2 * r.k).toFixed(2) });
    }
  }
  for (const key of ['gaps', 'lasers', 'zaps', 'crumbles', 'rings', 'flips']) hz[key].sort((a, b) => (a.x ?? a.x0) - (b.x ?? b.x0));
  hz.rings.forEach((r, i) => { r.id = i; });
  hz.crumbleTiles = [];
  for (const c of hz.crumbles) for (let tx = c.x0; tx < c.x1 - 0.5; tx += c.tile) hz.crumbleTiles.push({ id: hz.crumbleTiles.length, x0: tx, x1: Math.min(c.x1, tx + c.tile), delay: c.delay });
  course.sig = signature(course);
  return course;
}

/**
 * A probe ride at a constant speed v from x0 (no holding): where it launches, its apex, where it lands, and its
 * height when it passes gateX. Mirrors physics.js's launch rule (v²·κ > g·cosθ) and ballistic flight.
 */
export function probe(c, x0, v, gateX = null) {
  let x = x0, y = floorAt(c, x0), vx = 0, vy = 0, air = false;
  let flight = null;          // the current flight
  let best = null;            // the longest real flight (> 0.3 s) so far
  let atGate = null;
  const dt = 1 / 120;
  for (let t = 0; t < 9; t += dt) {
    if (!air) {
      if (best && x > best.land + 2) break;
      const k = floorSlope(c, x), th = Math.atan(k);
      const kap = -floorCurv(c, x) / Math.pow(1 + k * k, 1.5);
      if (v * v * kap > G * Math.cos(th) || !isSolid(c, x)) {
        air = true; vx = v * Math.cos(th); vy = v * Math.sin(th);
        flight = { launch: x, apex: { x, y }, t0: t };
        continue;
      }
      const nx = x + v * Math.cos(th) * dt;
      if (gateX != null && x < gateX && nx >= gateX) return { ...(best || {}), atGate: null, onGround: true };
      x = nx; y = floorAt(c, x);
    } else {
      vy -= G * AIR_FLOAT * dt;
      const nx = x + vx * dt, ny = y + vy * dt;
      if (gateX != null && x < gateX && nx >= gateX) atGate = y + (ny - y) * (gateX - x) / (nx - x);
      x = nx; y = ny;
      if (y > flight.apex.y) flight.apex = { x, y };
      if (!isSolid(c, x) && y < floorAt(c, x) - 1.2) return { ...(best || {}), launch: flight.launch, apex: flight.apex, land: null, atGate }; // fell into the gap
      if (y <= floorAt(c, x) && isSolid(c, x)) {
        air = false; y = floorAt(c, x);
        // micro-hops (the launch threshold flickering just before a crest) aren't flights: ride on
        if (t - flight.t0 > 0.3 && (!best || x - flight.launch > best.land - best.launch)) best = { launch: flight.launch, apex: flight.apex, land: x };
        if (gateX != null && atGate != null) return { ...(best || {}), atGate };
      } else if (y < floorAt(c, x) - 20) return { ...(best || {}), launch: flight.launch, apex: flight.apex, land: null, atGate };
    }
  }
  return { ...(best || {}), atGate };
}

// ------------------------------------------------------------------ lookups (fast, interpolated)
export function floorAt(c, x) {
  const f = x / DX, i = Math.max(0, Math.min(c.n - 2, Math.floor(f))), u = f - i;
  return c.h[i] + (c.h[i + 1] - c.h[i]) * u;
}
export function floorSlope(c, x) { const i = Math.max(0, Math.min(c.n - 1, Math.round(x / DX))); return c.dh[i]; }
export function floorCurv(c, x) { const i = Math.max(0, Math.min(c.n - 1, Math.round(x / DX))); return c.ddh[i]; }
export function ceilAt(c, x) {
  const f = x / DX, i = Math.max(0, Math.min(c.n - 2, Math.floor(f))), u = f - i;
  const a = c.ceil[i], b = c.ceil[i + 1];
  if (Number.isNaN(a)) return b;
  if (Number.isNaN(b)) return a;
  return a + (b - a) * u;
}
export function isSolid(c, x) { const i = Math.round(x / DX); return i >= 0 && i < c.n && c.solid[i] === 1; }
export const timeAtX = (c, x) => c.timeAt(x);

/** The biome at x, blending into the next over `blend` metres: { a, b, mix } (b null when not blending). */
export function biomeAt(c, x, blend = 90) {
  const bs = c.biomes;
  let i = 0;
  while (i + 1 < bs.length && x >= bs[i + 1].x0) i++;
  const cur = bs[i], next = bs[i + 1];
  if (next && x > next.x0 - blend) return { a: cur, b: next, mix: (x - (next.x0 - blend)) / blend, index: i };
  return { a: cur, b: null, mix: 0, index: i };
}

/** Index of the first item with item.x (or x0) >= x (items sorted). */
export function firstAfter(list, x, key = 'x') {
  let lo = 0, hi = list.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if ((list[m][key] ?? list[m].x0) < x) lo = m + 1; else hi = m; }
  return lo;
}

/** A short fingerprint of a course (tests + the E2E compare it across phones). */
export function signature(c) {
  let a = 0;
  for (let i = 0; i < c.n; i += 97) a = (a * 31 + Math.round(c.h[i] * 100) + c.solid[i]) | 0;
  const s = JSON.stringify([c.hz.gaps.length, c.hz.lasers.length, c.hz.zaps.length, c.hz.crumbles.length, c.hz.rings.length, c.hz.flips.length, c.biomes.map(b => `${b.id}${b.variant}`).join('')]);
  return `${(a >>> 0).toString(36)}:${s.length}:${c.biomes.map(b => b.id[0] + b.variant).join('')}`;
}
