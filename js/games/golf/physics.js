// NEON PAR — pure 2D ball physics on the course plane (no DOM, no clocks; unit-tested in node).
//
// The course is a plane (x right, y "down the screen"/away from the tee). The ball is a circle of
// radius R. A fixed 120 Hz step integrates forces (rolling friction, slopes, boost strips), sweeps the
// ball against every wall segment (continuous collision: the ball can never skip through a wall,
// whatever the speed) and resolves bumpers, portals, gaps/jumps, moving obstacles and the cup.
// Moving things are pure functions of *server time* `t` (seconds), so every phone agrees on them.
//
// Hole format: see js/games/golf/holes/README in CLAUDE.md ("NEON PAR — adding holes").

export const R = 0.5;            // ball radius
export const DT = 1 / 120;       // fixed step (s)
export const MAX_SPEED = 30;     // speed of a full-power putt (units/s)
export const MAX_STROKES = 6;
export const CUP_R = 1.05;       // cup radius
const CAPTURE_SPEED = 5.5;       // faster than this over the cup = it skips across / lips out
const STOP_SPEED = 0.06;
const SURFACES = {
  //            rolling friction (u/s²), wall bounce
  turf:    { mu: 4.6, e: 0.72 },
  wet:     { mu: 3.4, e: 0.72 },   // rooftop puddles: a little quicker
  grid:    { mu: 4.0, e: 0.78 },   // cyberspace
  glass:   { mu: 3.0, e: 0.8 },
  chrome:  { mu: 3.8, e: 0.82 },   // arcade
};
const WALL_E = { rail: null, rubber: 0.9, laser: 0.85, gate: 0.75, lip: 0.6 }; // lip: a low curb a jumping ball flies over

// ---------------------------------------------------------------- geometry
export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = a => Math.hypot(a[0], a[1]);

/** Earliest time s in [0,1] when a circle (radius r) moving p -> p+d touches segment ab. */
function sweepSegment(p, d, a, b, r) {
  let best = Infinity, normal = null;
  const ab = sub(b, a);
  const L = len(ab);
  if (L > 1e-9) {
    const n = [-ab[1] / L, ab[0] / L];
    // the two faces of the inflated segment
    for (const sgn of [1, -1]) {
      const nn = [n[0] * sgn, n[1] * sgn];
      const dist0 = dot(sub(p, a), nn) - r;
      const vel = dot(d, nn);
      if (dist0 >= -1e-6 && vel < 0) {
        const s = dist0 / -vel;
        if (s <= 1 && s < best) {
          const hit = [p[0] + d[0] * s, p[1] + d[1] * s];
          const u = dot(sub(hit, a), ab) / (L * L);
          if (u >= 0 && u <= 1) { best = Math.max(0, s); normal = nn; }
        }
      }
    }
  }
  // end caps
  for (const c of [a, b]) {
    const s = sweepCircle(p, d, c, r);
    if (s != null && s < best) {
      best = s;
      const hit = [p[0] + d[0] * s - c[0], p[1] + d[1] * s - c[1]];
      const l = len(hit) || 1;
      normal = [hit[0] / l, hit[1] / l];
    }
  }
  return normal ? { s: best, n: normal } : null;
}

/** Earliest s in [0,1] when a point moving p -> p+d comes within rr of c (null = never). */
function sweepCircle(p, d, c, rr) {
  const m = sub(p, c);
  const A = dot(d, d);
  const B = dot(m, d);
  const C = dot(m, m) - rr * rr;
  if (C < 0) return B < 0 ? 0 : null; // already touching and moving inward
  if (B >= 0 || A < 1e-12) return null;
  const disc = B * B - A * C;
  if (disc < 0) return null;
  const s = (-B - Math.sqrt(disc)) / A;
  return s >= 0 && s <= 1 ? s : null;
}

function closestOnSegment(p, a, b) {
  const ab = sub(b, a);
  const L2 = dot(ab, ab) || 1;
  const u = Math.max(0, Math.min(1, dot(sub(p, a), ab) / L2));
  return [a[0] + ab[0] * u, a[1] + ab[1] * u];
}

// ---------------------------------------------------------------- moving obstacles (functions of time)
const TAU = Math.PI * 2;
/** Segments of a mover at time t: [{ a, b, kind, vel: [vx,vy] at the contact (approx) }]. */
export function moverSegments(m, t) {
  if (m.type === 'laser' || m.type === 'spinner') {
    const arms = m.arms || 1;
    const ang = (m.phase || 0) + t * (m.speed || 1);
    const out = [];
    for (let k = 0; k < arms; k++) {
      const a = ang + (k * TAU) / arms;
      const dir = [Math.cos(a), Math.sin(a)];
      const inner = m.inner || 0;
      out.push({
        a: [m.pivot[0] + dir[0] * inner, m.pivot[1] + dir[1] * inner],
        b: [m.pivot[0] + dir[0] * m.length, m.pivot[1] + dir[1] * m.length],
        kind: m.type === 'laser' ? 'laser' : 'rubber',
        spin: m.speed || 1, pivot: m.pivot,
      });
    }
    return out;
  }
  if (m.type === 'gate') {
    const k = gateOffset(m, t);
    return [{ a: [m.a[0] + m.move[0] * k, m.a[1] + m.move[1] * k], b: [m.b[0] + m.move[0] * k, m.b[1] + m.move[1] * k], kind: 'gate' }];
  }
  return [];
}
/** 0..1 eased back-and-forth position of a gate / platform. */
export function gateOffset(m, t) {
  const ph = (((t + (m.phase || 0)) / m.period) % 1 + 1) % 1;
  return 0.5 - 0.5 * Math.cos(ph * TAU);
}
/** Is a blinking floor tile solid at time t? */
export const tileOn = (m, t) => ((((t + (m.phase || 0)) / m.period) % 1 + 1) % 1) < (m.on ?? 0.6);
/** A moving platform's polygon + velocity at time t. */
export function platformAt(m, t) {
  const k = gateOffset(m, t);
  const k2 = gateOffset(m, t + 0.01);
  const off = [m.move[0] * k, m.move[1] * k];
  const vel = [m.move[0] * (k2 - k) / 0.01, m.move[1] * (k2 - k) / 0.01];
  return { poly: m.poly.map(([x, y]) => [x + off[0], y + off[1]]), vel, off };
}

// ---------------------------------------------------------------- the hole
/** Precompute static segments for a hole (walls as polylines). */
export function prepareHole(hole) {
  if (hole._prep) return hole._prep;
  const segs = [];
  for (const w of hole.walls || []) {
    const pts = w.pts;
    for (let i = 0; i < pts.length - 1; i++) segs.push({ a: pts[i], b: pts[i + 1], kind: w.kind || 'rail', h: w.h ?? null });
    if (w.closed) segs.push({ a: pts[pts.length - 1], b: pts[0], kind: w.kind || 'rail', h: w.h ?? null });
  }
  hole._prep = { segs };
  return hole._prep;
}

export function floorAt(hole, x, y, t) {
  for (const f of hole.floors) if (pointInPoly(x, y, f.poly)) return f;
  for (const m of hole.movers || []) {
    if (m.type === 'tile' && tileOn(m, t) && pointInPoly(x, y, m.poly)) return { surface: m.surface || 'grid', h: m.h || 0, tile: m };
    if (m.type === 'platform') { const p = platformAt(m, t); if (pointInPoly(x, y, p.poly)) return { surface: m.surface || 'chrome', h: m.h || 0, platform: m, vel: p.vel }; }
  }
  return null;
}

/** Visual height of the surface at (x, y): floors' h, slopes interpolated along their direction. */
export function heightAt(hole, x, y, t = 0) {
  for (const s of hole.slopes || []) {
    if (pointInPoly(x, y, s.poly) && s.h0 != null) {
      const k = Math.max(0, Math.min(1, (dot([x - s.from[0], y - s.from[1]], s.dir)) / s.len));
      return s.h0 + (s.h1 - s.h0) * k;
    }
  }
  const f = floorAt(hole, x, y, t);
  return f ? f.h || 0 : -2;
}

// ---------------------------------------------------------------- simulation
/**
 * A ball in flight. state: { x, y, vx, vy, t (server s), air: 0|1, done, holed, oob, rest, power: null|'ghost'|'sticky'|'magnet',
 *   stuck, events: [] }. step() advances one DT and pushes events: wall, bumper, portal, boost, cup, lip, oob, pickup, rest.
 */
export function startShot(hole, from, angle, power, t, powerUp = null) {
  const v = Math.max(0, Math.min(1, power)) * MAX_SPEED;
  return { x: from[0], y: from[1], vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, t, air: 0, done: false, holed: false, oob: false,
    power: powerUp, stuck: false, portalCooldown: 0, lastBoost: -1, events: [], picked: null, airStart: null, airH: 0 };
}

export function step(hole, s) {
  if (s.done) return s;
  const prep = prepareHole(hole);
  const t = s.t;
  const speed0 = Math.hypot(s.vx, s.vy);
  // -------- forces
  const here = floorAt(hole, s.x, s.y, t);
  if (!s.air) {
    const surf = SURFACES[(here && here.surface) || 'turf'] || SURFACES.turf;
    let ax = 0, ay = 0;
    for (const sl of hole.slopes || []) if (pointInPoly(s.x, s.y, sl.poly)) { ax += sl.dir[0] * sl.g; ay += sl.dir[1] * sl.g; }
    for (const b of hole.boosts || []) {
      if (pointInPoly(s.x, s.y, b.poly)) {
        ax += b.dir[0] * b.power; ay += b.dir[1] * b.power;
        if (s.lastBoost !== b) { s.lastBoost = b; s.events.push({ type: 'boost', t }); }
      }
    }
    if (here && here.platform) { // ride the platform
      s.x += here.vel[0] * DT; s.y += here.vel[1] * DT;
    }
    if (s.power === 'magnet' && !s.holed) {
      const dx = hole.cup[0] - s.x, dy = hole.cup[1] - s.y, d = Math.hypot(dx, dy);
      if (d < 5 && d > 0.01) { const k = 14 * (1 - d / 5); ax += dx / d * k; ay += dy / d * k; }
    }
    s.vx += ax * DT; s.vy += ay * DT;
    const sp = Math.hypot(s.vx, s.vy);
    const slopeA = Math.hypot(ax, ay);
    if (sp > 0) {
      const dec = surf.mu * DT;
      if (sp <= dec && slopeA < surf.mu * 0.9) { s.vx = 0; s.vy = 0; }
      else { const k = Math.max(0, sp - dec) / sp; s.vx *= k; s.vy *= k; }
    }
  }
  // -------- move with continuous collision against walls, movers and bumpers
  let remaining = 1;
  let iter = 0;
  const segsNow = s.power === 'ghost' ? [] : prep.segs;
  const moving = [];
  for (const m of hole.movers || []) for (const seg of moverSegments(m, t)) moving.push(seg);
  while (remaining > 1e-6 && iter++ < 6) {
    const d = [s.vx * DT * remaining, s.vy * DT * remaining];
    if (Math.abs(d[0]) + Math.abs(d[1]) < 1e-9) break;
    let hit = null;
    const p = [s.x, s.y];
    const test = (seg, kind) => { const hh = sweepSegment(p, d, seg.a, seg.b, R); if (hh && (!hit || hh.s < hit.s)) hit = { ...hh, kind, seg }; };
    for (const seg of segsNow) if (!(s.air && seg.kind === 'lip')) test(seg, seg.kind);
    if (!s.air) for (const seg of moving) test(seg, seg.kind);
    if (!s.air) for (const b of hole.bumpers || []) {
      const ss = sweepCircle(p, d, b.c, b.r + R);
      if (ss != null && (!hit || ss < hit.s)) {
        const hp = [p[0] + d[0] * ss - b.c[0], p[1] + d[1] * ss - b.c[1]];
        const l = len(hp) || 1;
        hit = { s: ss, n: [hp[0] / l, hp[1] / l], kind: 'bumper', bumper: b };
      }
    }
    if (!hit) { s.x += d[0]; s.y += d[1]; break; }
    s.x += d[0] * hit.s; s.y += d[1] * hit.s;
    s.x += hit.n[0] * 1e-4; s.y += hit.n[1] * 1e-4;
    remaining *= 1 - hit.s;
    const vn = s.vx * hit.n[0] + s.vy * hit.n[1];
    if (vn < 0) {
      const surf = SURFACES[(here && here.surface) || 'turf'] || SURFACES.turf;
      if (s.power === 'sticky' && hit.kind !== 'bumper') { s.vx = 0; s.vy = 0; s.power = null; s.events.push({ type: 'stick', t }); remaining = 0; break; }
      let e = WALL_E[hit.kind] ?? surf.e;
      if (hit.kind === 'bumper') {
        e = 1;
        s.vx -= (1 + e) * vn * hit.n[0]; s.vy -= (1 + e) * vn * hit.n[1];
        const kick = hit.bumper.kick ?? 8;
        s.vx += hit.n[0] * kick; s.vy += hit.n[1] * kick;
        s.events.push({ type: 'bumper', t, id: hit.bumper.id ?? null, speed: Math.abs(vn) });
      } else {
        // tangential friction on walls keeps glancing hits lively but not perfectly elastic
        const tx = s.vx - vn * hit.n[0], ty = s.vy - vn * hit.n[1];
        s.vx = tx * 0.96 - e * vn * hit.n[0]; s.vy = ty * 0.96 - e * vn * hit.n[1];
        if (hit.seg && hit.seg.spin) { // a spinning arm swats the ball along its motion
          const r = [s.x - hit.seg.pivot[0], s.y - hit.seg.pivot[1]];
          s.vx += -r[1] * hit.seg.spin * 0.6; s.vy += r[0] * hit.seg.spin * 0.6;
        }
        s.events.push({ type: 'wall', t, kind: hit.kind, speed: Math.abs(vn) });
      }
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > MAX_SPEED * 1.4) { s.vx *= MAX_SPEED * 1.4 / sp; s.vy *= MAX_SPEED * 1.4 / sp; }
    }
  }
  // -------- moving obstacles that sweep INTO the ball: push it out (never through), using their
  // positions at the end of this step so a fast arm can't leave the ball overlapping it
  const movingEnd = [];
  for (const m of hole.movers || []) for (const seg of moverSegments(m, t + DT)) movingEnd.push(seg);
  if (!s.air && s.power !== 'ghost') for (const seg of movingEnd) {
    const c = closestOnSegment([s.x, s.y], seg.a, seg.b);
    const dx = s.x - c[0], dy = s.y - c[1], dd = Math.hypot(dx, dy);
    if (dd < R && dd > 1e-6) {
      const nx = dx / dd, ny = dy / dd;
      s.x = c[0] + nx * (R + 1e-3); s.y = c[1] + ny * (R + 1e-3);
      let px = 0, py = 0;
      if (seg.spin) { const r = [c[0] - seg.pivot[0], c[1] - seg.pivot[1]]; px = -r[1] * seg.spin; py = r[0] * seg.spin; }
      const rel = (s.vx - px) * nx + (s.vy - py) * ny;
      if (rel < 0) { s.vx -= 1.6 * rel * nx; s.vy -= 1.6 * rel * ny; }
      s.events.push({ type: 'wall', t, kind: seg.kind, speed: Math.abs(rel) });
    }
  }
  // -------- static walls the ball might rest against: resolve tiny overlaps (numerical safety)
  for (const seg of segsNow) {
    if (s.air && seg.kind === 'lip') continue;
    const c = closestOnSegment([s.x, s.y], seg.a, seg.b);
    const dx = s.x - c[0], dy = s.y - c[1], dd = Math.hypot(dx, dy);
    if (dd < R - 1e-3 && dd > 1e-9) { s.x = c[0] + dx / dd * R; s.y = c[1] + dy / dd * R; }
  }
  s.t = t + DT;
  // -------- portals
  if (s.portalCooldown > 0) s.portalCooldown -= DT;
  else for (const pt of hole.portals || []) {
    if (Math.hypot(s.x - pt.in[0], s.y - pt.in[1]) < (pt.r || 1)) {
      const sp = Math.hypot(s.vx, s.vy);
      const ang = pt.exitAngle != null ? pt.exitAngle : Math.atan2(s.vy, s.vx);
      s.x = pt.out[0] + Math.cos(ang) * 1.2; s.y = pt.out[1] + Math.sin(ang) * 1.2;
      s.vx = Math.cos(ang) * Math.max(sp, 6); s.vy = Math.sin(ang) * Math.max(sp, 6);
      s.portalCooldown = 0.4;
      s.events.push({ type: 'portal', t: s.t, from: pt.in, to: pt.out });
      break;
    }
  }
  // -------- pickups
  if (!s.picked) for (const [i, pu] of (hole.powerups || []).entries()) {
    if (Math.hypot(s.x - pu.at[0], s.y - pu.at[1]) < 1.2) { s.picked = { i, kind: pu.kind }; s.events.push({ type: 'pickup', t: s.t, kind: pu.kind, i }); }
  }
  // -------- gaps: jump if fast enough, otherwise fall
  const sp = Math.hypot(s.vx, s.vy);
  let inGap = null;
  for (const g of hole.gaps || []) if (pointInPoly(s.x, s.y, g.poly)) { inGap = g; break; }
  if (inGap) {
    if (!s.air) {
      if (sp >= inGap.minSpeed) {
        s.air = 1; s.airStart = s.t; s.events.push({ type: 'jump', t: s.t });
        // visual flight plan: where (and when) it comes down, so the arc lands exactly on the far side
        const ux = s.vx / sp, uy = s.vy / sp;
        let d = 0;
        while (d < 40 && (hole.gaps || []).some(g => pointInPoly(s.x + ux * d, s.y + uy * d, g.poly))) d += 0.1;
        const back = heightAt(hole, s.x - ux * 0.6, s.y - uy * 0.6, s.t);
        s.airPlan = { t0: s.t, te: Math.max(0.05, d / sp), h0: back > -1 ? back : 0, h1: Math.max(0, heightAt(hole, s.x + ux * (d + 0.3), s.y + uy * (d + 0.3), s.t)) };
      }
    }
  } else if (s.air) { s.air = 0; s.events.push({ type: 'land', t: s.t }); }
  // -------- support: no floor under the ball = it fell off
  if (!s.air) {
    const f = floorAt(hole, s.x, s.y, s.t);
    if (!f) { s.oob = true; s.done = true; s.events.push({ type: 'oob', t: s.t }); return s; }
  }
  // -------- cup
  const dc = Math.hypot(s.x - hole.cup[0], s.y - hole.cup[1]);
  if (!s.air && dc < CUP_R) {
    // it drops if it's over the cup properly (not just clipping the rim) and slow enough
    const deep = dc < CUP_R - R * 0.45;
    if ((deep && sp < CAPTURE_SPEED) || (s.power === 'magnet' && sp < CAPTURE_SPEED * 1.8)) {
      s.holed = true; s.done = true; s.x = hole.cup[0]; s.y = hole.cup[1]; s.vx = 0; s.vy = 0;
      s.events.push({ type: 'cup', t: s.t, speed0 });
      return s;
    }
    const nx = (s.x - hole.cup[0]) / (dc || 1), ny = (s.y - hole.cup[1]) / (dc || 1);
    if (sp >= CAPTURE_SPEED) {
      // too fast: it skips across, with one small kick off the rim
      if (!s.lipped) { s.lipped = true; s.events.push({ type: 'lip', t: s.t }); s.vx += nx * 1.2; s.vy += ny * 1.2; }
    } else {
      // a slow ball on the rim tips toward the cup, like a real one
      s.vx -= nx * 6 * DT; s.vy -= ny * 6 * DT;
    }
  } else if (dc > CUP_R + 0.5) s.lipped = false;
  // -------- rest
  if (Math.hypot(s.vx, s.vy) < STOP_SPEED && !s.air) {
    const under = floorAt(hole, s.x, s.y, s.t);
    s.vx = 0; s.vy = 0; s.done = true; s.rest = true;
    // resting on a moving platform: the ball keeps riding it (see ridePosition)
    if (under && under.platform) s.riding = { i: (hole.movers || []).indexOf(under.platform), t: s.t };
    s.events.push({ type: 'rest', t: s.t });
  }
  return s;
}

/** Visual height of the ball's contact point (surface, or its arc over a gap). */
export function ballHeight(hole, s) {
  const pl = s.air && s.airPlan;
  if (pl) {
    const k = Math.max(0, Math.min(1, (s.t - pl.t0) / pl.te));
    return pl.h0 + (pl.h1 - pl.h0) * k + (0.5 + 0.9 * pl.te) * 4 * k * (1 - k);
  }
  return heightAt(hole, s.x, s.y, s.t);
}

/** Where a ball resting on a moving platform has been carried to by time t. */
export function ridePosition(hole, pos, riding, t) {
  if (!riding) return pos;
  const m = hole.movers[riding.i];
  const a = platformAt(m, riding.t).off, b = platformAt(m, t).off;
  return [pos[0] + b[0] - a[0], pos[1] + b[1] - a[1]];
}

/** Simulate a whole shot (bot / tests). Returns the final state; maxTime caps runaway shots. */
export function simulate(hole, from, angle, power, t0 = 0, powerUp = null, maxTime = 25) {
  const s = startShot(hole, from, angle, power, t0, powerUp);
  const end = t0 + maxTime;
  while (!s.done && s.t < end) step(hole, s);
  if (!s.done) { s.done = true; s.rest = true; } // a ball circling forever (moving platform) just stops
  return s;
}
