// SLIPSTREAM — the rider (PURE, deterministic, fixed steps; the frame rate never changes how a ride plays).
//
// ON THE GROUND the rider slides along the floor with speed s (never below the base speed for the match time):
//   gravity along the slope (× DIVE_DOWN when holding on a descent, × DIVE_UP on a climb), a little drag.
//   Not holding, the rider leaves the ground wherever the floor curves away faster than gravity could follow
//   (s²·κ > g·cosθ) — so a release on the convex top of a hill launches you along its tangent.
//   Holding presses the rider into the terrain (never launches).
// IN THE AIR: ballistic, gravity × AIR_DIVE while held for more than a tap. A TAP queues one full flip (2π,
//   ~0.48 s, eased at the end); several taps queue several. With no flip in progress the rider's angle eases
//   toward the slope it's about to land on (so a plain jump always lands clean).
// LANDING: the rider's angle within TOL of the slope = CLEAN (speed kept along the slope; each completed flip
//   adds a boost, consecutive flipped landings build a combo). Further off = CRASH.
// HAZARDS: falling into a gap or off crumbled ground, a laser gate's beam, a low ceiling's zap line.
// GRAVITY FLIP zones: the simulation runs in a mirrored frame (local y = −world y) against the ceiling track.
// CRASH with lives left: a 0.9 s rewind, then a respawn a little behind the last safe ground with 2 s of
//   invulnerability (hazards ignored, gaps and crumbled tiles hold you up). Out of lives = out.
import {
  DX, G, baseSpeed, maxSpeed, floorAt, floorSlope, floorCurv, ceilAt, isSolid, firstAfter,
} from './course.js';

export const STEP = 1 / 120;
export const TOL = 40 * Math.PI / 180;     // landing tolerance
export const DIVE_DOWN = 2.1;
export const DIVE_UP = 1.35;
export const AIR_DIVE = 2.3;
export const AIR_HOLD_AFTER = 0.18;         // a press in the air counts as a dive only after this long (a tap = flip)
export const FLIP_TIME = 0.48;
export const REWIND_S = 0.9;
export const INVULN_S = 2;
export const RADIUS = 0.45;                 // hitbox (the same for both rides)
const TAU = Math.PI * 2;

const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

export function createRider({ lives = 2, x = 6, t = 0, course } = {}) {
  const s = {
    x, y: course ? floorAt(course, x) : 0, vx: 0, vy: 0, sp: baseSpeed(t), gnd: true, phi: 0, spin: 0, airRot: 0, airT: 0,
    g: 1, st: 'ride', lives, inv: 0, t, safeX: x, rewindT: 0, crashX: 0, crashY: 0, respawnX: 0,
    combo: 0, bestCombo: 0, flips: 0, landings: 0, clean: 0, crashes: 0, rings: 0, maxAir: 0, best: 0,
    touched: [], ringNext: 0, laserNext: 0, events: [], pressT: 0, near: 0,
  };
  return s;
}

/** Surface height in the rider's local frame (mirrored inside gravity-flip zones). */
function surf(c, x, g) { return g > 0 ? floorAt(c, x) : -ceilAt(c, x); }
function slope(c, x, g) {
  if (g > 0) return floorSlope(c, x);
  const i = Math.max(0, Math.min(c.n - 1, Math.round(x / DX)));
  return -c.dc[i];
}
function curvature(c, x, g) {
  if (g > 0) return floorCurv(c, x);
  const i = Math.max(0, Math.min(c.n - 1, Math.round(x / DX)));
  return -c.ddc[i];
}

function inFlip(c, x) {
  const f = c.hz.flips;
  const i = firstAfter(f, x, 'x0') - 1;
  return i >= 0 && x >= f[i].x0 && x <= f[i].x1 ? f[i] : null;
}

function tileAt(c, x) {
  const t = c.hz.crumbleTiles;
  const i = firstAfter(t, x, 'x0') - 1;
  return i >= 0 && x >= t[i].x0 && x < t[i].x1 ? t[i] : null;
}

/** Is there something to stand on at x (local frame)? Crumbled tiles count as gone; invulnerable riders float. */
function standable(c, r, x) {
  if (r.g < 0) return !!inFlip(c, x) && !Number.isNaN(ceilAt(c, x));
  if (r.inv > 0) return true;
  if (!isSolid(c, x)) return false;
  const tile = tileAt(c, x);
  if (tile) {
    const tt = r.touched.find(e => e[0] === tile.id);
    if (tt && r.t - tt[1] > tile.delay) return false;
  }
  return true;
}

export function laserOn(l, t) {
  if (!l.blink) return true;
  const ph = ((t / l.period + l.phase) % 1 + 1) % 1;
  return ph < l.on;
}

/**
 * One fixed step. input: { hold (bool), pressT (seconds the current press has lasted), taps (count, consumed) }.
 * r.t must be the match clock (seconds); the caller advances it.
 */
export function step(r, c, input, dt = STEP) {
  if (r.st === 'out') return;
  if (r.st === 'rewind') {
    r.rewindT -= dt;
    if (r.rewindT <= 0) respawn(r, c);
    return;
  }
  const vb = baseSpeed(r.t), vmax = maxSpeed(r.t);
  if (r.inv > 0) r.inv = Math.max(0, r.inv - dt);
  const taps = input.taps || 0;
  input.taps = 0;
  const px = r.x, py = r.y;

  if (r.gnd) {
    if (!standable(c, r, r.x)) { leave(r, c); }
    else {
      const k = slope(c, r.x, r.g);
      const th = Math.atan(k);
      const hold = !!input.hold;
      const gEff = G * (hold ? (k < 0 ? DIVE_DOWN : DIVE_UP) : 1);
      r.sp += (-gEff * Math.sin(th) - 0.0007 * r.sp * r.sp) * dt;
      r.sp = Math.min(vmax, Math.max(vb, r.sp));
      // launch: the floor curves away faster than gravity can follow (only when not holding)
      const kap = -curvature(c, r.x, r.g) / Math.pow(1 + k * k, 1.5);
      if (!hold && r.sp * r.sp * kap > G * Math.cos(th)) {
        r.vx = r.sp * Math.cos(th); r.vy = r.sp * Math.sin(th);
        r.gnd = false; r.airT = 0; r.airRot = 0; r.launched = false;
      } else {
        r.x += r.sp * Math.cos(th) * dt;
        r.y = surf(c, r.x, r.g);
        r.phi = Math.atan(slope(c, r.x, r.g));
        // touching crumbling ground starts its timer
        if (r.g > 0) {
          const tile = tileAt(c, r.x);
          if (tile && !r.touched.some(e => e[0] === tile.id)) { r.touched.push([tile.id, r.t]); r.events.push({ e: 'crumble', id: tile.id }); }
          else if (!tile && isSolid(c, r.x) && r.x > r.safeX + 2) r.safeX = r.x;
        }
        if (taps) { /* a tap on the ground does nothing */ }
      }
    }
  }
  if (!r.gnd) {
    const hold = !!input.hold && input.pressT > AIR_HOLD_AFTER;
    r.vy -= G * (hold ? AIR_DIVE : 1) * dt;
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    r.airT += dt;
    // a real flight (not the tiny hops at a crest's launch threshold): announce it once
    if (!r.launched && r.airT > 0.12) { r.launched = true; r.events.push({ e: 'launch', v: Math.hypot(r.vx, r.vy) }); }
    if (taps) { r.spin += TAU * taps; r.events.push({ e: 'flip', n: taps }); }
    if (r.spin > 0) {
      const w = (TAU / FLIP_TIME) * (r.spin < 0.9 ? Math.max(0.45, r.spin / 0.9) : 1);
      const d = Math.min(r.spin, w * dt);
      r.phi += d; r.spin -= d; r.airRot += d;
      if (r.spin < 1e-4) { r.spin = 0; r.phi = wrap(r.phi); }
    } else {
      // assist: settle toward the slope we're about to meet
      const ahead = r.x + r.vx * 0.22;
      const want = Math.atan(slope(c, ahead, r.g));
      const d = wrap(want - r.phi);
      r.phi = wrap(r.phi + Math.sign(d) * Math.min(Math.abs(d), 4.2 * dt));
    }
    if (r.y - (surf(c, r.x, r.g)) > r.maxAir) r.maxAir = r.y - surf(c, r.x, r.g);
  }

  // gravity flip zones: mirror the frame on the way in and out
  const zone = inFlip(c, r.x);
  const g = zone ? -1 : 1;
  if (g !== r.g) {
    r.g = g;
    if (r.gnd) { r.vx = r.sp * Math.cos(r.phi); r.vy = r.sp * Math.sin(r.phi); r.gnd = false; r.airT = 0; r.airRot = 0; }
    r.y = -r.y; r.vy = -r.vy; r.phi = wrap(-r.phi);
    r.events.push({ e: 'gflip', g });
  }

  if (r.st === 'ride') hazards(r, c, px, py);
  if (r.st !== 'ride') return;

  if (!r.gnd) {
    const fy = surf(c, r.x, r.g);
    const over = standable(c, r, r.x);
    // sinking below the floor line over a gap / a fallen tile = fell in (never "land" on the far edge from below)
    if (!over && r.y < fy - 1.2) crash(r, c, 'fall');
    else if (r.y <= fy && over) { if (r.y > fy - 1.5 || r.airT < 0.05) land(r, c, fy, vb); else crash(r, c, 'fall'); }
    else if (r.y < fy - 9 || (r.g < 0 && Number.isNaN(fy))) crash(r, c, 'fall');
  }
  if (!Number.isFinite(r.y) || !Number.isFinite(r.x)) crash(r, c, 'fall'); // never fly on with a broken state
  if (r.x > r.best) r.best = r.x;
}

function leave(r, c) {
  const th = Math.atan(slope(c, r.x, r.g));
  r.vx = r.sp * Math.cos(th); r.vy = r.sp * Math.sin(th);
  r.gnd = false; r.airT = 0; r.airRot = 0;
  r.events.push({ e: 'drop' });
}

function land(r, c, fy, vb) {
  const k = slope(c, r.x, r.g);
  const th = Math.atan(k);
  const diff = Math.abs(wrap(r.phi - th));
  if (diff > TOL && r.inv <= 0) { crash(r, c, 'landing', diff); return; }
  const flips = Math.floor(r.airRot / TAU + 0.12);
  let sp = r.vx * Math.cos(th) + r.vy * Math.sin(th);
  sp = Math.max(vb, sp);
  let boost = 0;
  if (flips > 0) {
    r.combo += flips;
    r.flips += flips;
    boost = 2.2 + 1.6 * flips + 0.55 * Math.min(r.combo, 10);
    r.bestCombo = Math.max(r.bestCombo, r.combo);
  } else if (r.airT > 0.55) r.combo = 0;
  r.sp = Math.min(maxSpeed(r.t), sp + boost);
  r.gnd = true; r.y = fy; r.phi = th; r.spin = 0; r.airRot = 0;
  if (r.airT > 0.25) {
    r.landings++;
    r.clean++;
    r.events.push({ e: 'land', flips, combo: r.combo, near: diff > TOL * 0.72, air: r.airT, boost });
  }
  r.airT = 0;
}

function hazards(r, c, px, py) {
  if (r.inv > 0) return;
  // laser gates: crossing x this step
  const L = c.hz.lasers;
  let i = firstAfter(L, px);
  while (i < L.length && L[i].x <= r.x) {
    const l = L[i];
    const u = (l.x - px) / (r.x - px || 1);
    const yw = (py + (r.y - py) * u) * r.g;     // world height at the gate
    const lowOn = laserOn(l, r.t);
    const inGap = yw >= l.lo + RADIUS * 0.6 && yw <= l.hi - RADIUS * 0.6;
    const underLow = yw < l.lo;
    if (!(inGap || (underLow && !lowOn))) { crash(r, c, 'laser'); return; }
    r.events.push({ e: 'gate' });
    i++;
  }
  // low ceilings: flying above the zap line
  if (r.g > 0 && !r.gnd) {
    const Z = c.hz.zaps;
    const j = firstAfter(Z, r.x, 'x0') - 1;
    if (j >= 0 && r.x <= Z[j].x1) {
      const line = zapLine(c, Z[j], r.x);
      if (r.y + RADIUS > line) { crash(r, c, 'zap'); return; }
      if (r.y + RADIUS > line - 0.9) r.near = Math.max(r.near, 0.5);
    }
  }
  // boost rings
  const R = c.hz.rings;
  let k = firstAfter(R, px);
  while (k < R.length && R[k].x <= r.x) {
    const ring = R[k];
    const u = (ring.x - px) / (r.x - px || 1);
    const yw = (py + (r.y - py) * u) * r.g;
    if (Math.abs(yw - ring.y) < ring.r && !r.gnd) {
      r.rings++;
      r.vx += 3.5; r.sp += 3.5;
      r.events.push({ e: 'ring', id: ring.id });
    }
    k++;
  }
}

/** The zap line of a low ceiling at x (follows the hills, smoothed): world y. */
export function zapLine(c, z, x) {
  let m = -Infinity;
  for (let d = -6; d <= 6; d += 1.5) m = Math.max(m, floorAt(c, x + d));
  return m + z.above;
}

function crash(r, c, why, diff = 0) {
  r.crashes++;
  r.lives--;
  r.combo = 0;
  r.crashX = r.x; r.crashY = r.y * r.g;
  r.events.push({ e: 'crash', why, diff, lives: r.lives });
  if (r.lives <= 0) { r.st = 'out'; r.gnd = false; return; }
  r.st = 'rewind';
  r.rewindT = REWIND_S;
  r.respawnX = safeSpot(c, Math.max(6, r.safeX - 6));
}

/** A respawn point at or behind x on plain, solid ground (never in a zone, a gap or crumbling ground). */
export function safeSpot(c, x) {
  let p = x;
  for (let k = 0; k < 400 && p > 4; k++, p -= 1) {
    if (isSolid(c, p) && isSolid(c, p + 3) && !inFlip(c, p) && !inFlip(c, p + 3) && !tileAt(c, p)) return p;
  }
  return 6;
}

/** A spot to come back at (rejoin): plain ground near x — behind it if that is close, else just ahead. */
export function safeNear(c, x) {
  const back = safeSpot(c, x);
  if (x - back <= 30) return back;
  for (let p = x; p < x + 40; p += 1) if (isSolid(c, p) && isSolid(c, p + 3) && !inFlip(c, p) && !inFlip(c, p + 3) && !tileAt(c, p)) return p;
  return back;
}

function respawn(r, c) {
  r.st = 'ride';
  r.x = r.respawnX; r.g = 1; r.gnd = true; r.y = floorAt(c, r.x);
  r.phi = Math.atan(floorSlope(c, r.x)); r.sp = baseSpeed(r.t); r.spin = 0; r.airRot = 0; r.airT = 0;
  r.inv = INVULN_S; r.touched = [];
  r.events.push({ e: 'respawn', x: r.x });
}

/** World-frame pose for drawing / publishing: { x, y, a (angle), g }. */
export function pose(r) { return { x: r.x, y: r.y * r.g, a: r.phi * r.g, g: r.g }; }

/** Trim bookkeeping that only matters near the rider (keeps state small for cloning). */
export function tidy(r, c) {
  if (r.touched.length > 12) r.touched = r.touched.filter(e => { const t = c.hz.crumbleTiles[e[0]]; return t && t.x1 > r.x - 30; });
}

/** A copy for look-ahead simulation (bots). */
export function clone(r) {
  return { ...r, touched: r.touched.slice(), events: [] };
}

/** Run a match clock forward with fixed steps: advance(r, c, input, ms). */
export function advance(r, c, input, seconds) {
  let acc = seconds;
  while (acc >= STEP - 1e-9) { r.t += STEP; step(r, c, input); acc -= STEP; }
  return acc;
}
