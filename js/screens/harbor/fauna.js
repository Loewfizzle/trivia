// CITY 2.0 — THE HARBOR, PART 8b1 (Group 2): THE FAUNA — every animal's painter (the plan: core/harbor-wildlife.js; the manager:
// wildlife.js). The owner's bar (docs/harbor/plan.md "8b — THE WILDLIFE, ALL NEW FOR CITY 2.0"): premium, 3-D-looking in the Harbor's
// camera — correct perspective + scale by depth, FACING BY DIRECTION (front / back / 3/4 / side, never a flat sprite moving in depth),
// shaded by the scene's light (a lit side, a shade side, a contact shadow; a rim of lamplight at night), smooth wing beats + gaits.
// HOW: each animal is a handful of 3-D points in its own frame (a: forward along its heading, b: lateral, y: up) projected through
// the real camera — the bodies are ELLIPSOIDS drawn as their exact projected outline (ellipsoid()), the wings + legs + tails polygons
// and strokes between projected points. So a pigeon walking toward us is a round front-on body with its head over it, crossing the
// screen a side-on profile, flying away its wings' undersides seen from behind — all from the same few numbers.
// Colours go through ONE light (litCol): the day's sun (the gold hour warmer) + its side across the body; at night a dark form lifted
// by the lamps' light where it stands + a crisp rim on the lamp's side (like the people — folk.js).
import { project } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';
import { SIZE } from '../../core/harbor-wildlife.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2, PI = Math.PI;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a).toFixed(3)})`);
const NIGHT = [16, 15, 26];

// ------------------------------------------------------------------ THE LIGHT (one model for every animal)
/** the scene's light on a colour at (x, z): by day itself (gold warmer, overcast flatter); at night mostly a silhouette lifted by the
 *  lamps' light there (env.lightAt) — k: how much this surface takes the lamp (a white gull more than a grey pigeon) */
export function litCol(col, env, x, z, k = 1) {
  const T = env.T || { day: 1 }, lampK = clamp01(env.dark || 0), dark = Math.max(lampK, clamp01(T.night || 0));
  let c = col;
  if (T.gold) c = mix(c, [c[0] * 1.1 + 12, c[1] * 0.95, c[2] * 0.8], T.gold * 0.5);
  if ((T.ovc || 0) > 0.3) c = mix(c, [c[0] * 0.86 + 14, c[1] * 0.88 + 14, c[2] * 0.9 + 18], (T.ovc - 0.3) * 0.6);
  if (dark > 0.01) {
    c = mix(c, NIGHT, 0.84 * dark);
    const lt = env.lightAt ? env.lightAt(x, z) : null;
    if (lt) { const q = Math.min(1, 170 / Math.max(1, lt[0], lt[1], lt[2])); c = [c[0] + lt[0] * q * 0.12 * k * lampK, c[1] + lt[1] * q * 0.12 * k * lampK, c[2] + lt[2] * q * 0.12 * k * lampK]; }
  }
  return [Math.min(255, c[0]), Math.min(255, c[1]), Math.min(255, c[2])];
}
/** the sun's side on screen (±1) + its strength by day (0 at night / under a deck) */
export function sunOf(env) {
  const T = env.T || {}, day = clamp01((T.day || 0) + (T.gold || 0)) * (1 - clamp01(env.dark || 0));
  const sd = T.sunDir || 0, k = day * (1 - 0.7 * (T.ovc || 0));
  return { s: Math.abs(sd) > 0.05 ? (sd > 0 ? -1 : 1) : 1, k, warm: (T.gold || 0) > 0.3 };
}
/** the rim colour at (x, z) at night (or null): the lamp's light, brightened — drawn as an offset copy under the body */
function rimOf(env, x, z) {
  const lampK = clamp01(env.dark || 0); if (lampK < 0.3 || env.tier === 0) return null;
  const lt = env.lightAt ? env.lightAt(x, z) : null; if (!lt) return null;
  const lk = (lt[0] + lt[1] + lt[2]) / 380; if (lk < 0.1) return null;
  const n = Math.max(lt[0], lt[1], lt[2]) || 1;
  return { col: mix(lt.map(v => Math.min(255, 60 + v / n * 195)), [255, 220, 170], 0.4), a: clamp01(0.3 + lk * 0.8) * lampK, side: env.rimSide ? env.rimSide(x, z) : 1 };
}

// ------------------------------------------------------------------ THE GEOMETRY
/** a frame at o (world) facing hd (0 → +x, π/2 → away): (a forward, b lateral, y up) → world */
export const frameOf = (o, hd, pitch = 0) => { const c = Math.cos(hd), s = Math.sin(hd), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return (a, b, y) => { const a2 = a * cp - y * sp, y2 = a * sp + y * cp; return { x: o.x + a2 * c - b * s, y: (o.y || 0) + y2, z: o.z + a2 * s + b * c }; }; };
const P = (cam, p) => project(cam, p.x, p.y, p.z);
/** the projected outline of an ellipsoid (centre + three half-axes, world): the 2-D ellipse whose matrix is Σ v vᵀ of the axes' screen
 *  vectors (exact for a parallel projection — at these sizes perspective inside one body is nil) → { x, y, rx, ry, rot } */
export function ellipsoid(cam, c, axes) {
  const [cx, cy] = P(cam, c); let p = 0, q = 0, r = 0;
  for (const a of axes) { const [ax, ay] = P(cam, { x: c.x + a.x, y: c.y + a.y, z: c.z + a.z }), vx = ax - cx, vy = ay - cy; p += vx * vx; q += vx * vy; r += vy * vy; }
  const m = (p + r) / 2, d = Math.sqrt(((p - r) / 2) ** 2 + q * q), l1 = m + d, l2 = Math.max(1e-6, m - d);
  return { x: cx, y: cy, rx: Math.sqrt(l1), ry: Math.sqrt(l2), rot: 0.5 * Math.atan2(2 * q, p - r) };
}
const fillE = (c, e, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(e.x, e.y, Math.max(0.2, e.rx), Math.max(0.2, e.ry), e.rot, 0, TAU); c.fill(); };
/** an ellipsoid body lit by the sun from its side (a linear gradient across it) — col: the lit colour → the shade */
function bodyE(c, e, col, env, x, z, k = 1) {
  const base = litCol(col, env, x, z, k), sun = sunOf(env);
  if (env.tier === 0) { fillE(c, e, rgb(base)); return; }   // (tier 0 — the slow phone: one flat fill, no gradient a body)
  if (sun.k > 0.12) {
    const r = Math.max(e.rx, e.ry), g = c.createLinearGradient(e.x - sun.s * r, e.y - r * 0.6, e.x + sun.s * r, e.y + r * 0.5);
    const hi = mix(base, sun.warm ? [255, 214, 160] : [255, 248, 236], 0.28 * sun.k), lo = mix(base, [26, 24, 44], 0.38 * sun.k);
    g.addColorStop(0, rgb(hi)); g.addColorStop(0.5, rgb(base)); g.addColorStop(1, rgb(lo));
    fillE(c, e, g);
  } else {
    // (night / a deck: a soft top-light — the upper side a touch lighter)
    const r = Math.max(e.rx, e.ry), g = c.createLinearGradient(e.x, e.y - r, e.x, e.y + r);
    g.addColorStop(0, rgb(mix(base, [255, 255, 255], 0.08))); g.addColorStop(1, rgb(mix(base, [0, 0, 0], 0.25)));
    fillE(c, e, g);
  }
}
const vec = (a, b, y) => ({ x: a, y, z: b });
/** a frame's axis vectors (world) for an ellipsoid: forward / lateral / up scaled */
const axesOf = (hd, pitch, A, B, Y) => { const f = frameOf({ x: 0, y: 0, z: 0 }, hd, pitch); return [f(A, 0, 0), f(0, B, 0), f(0, 0, Y)]; };
/** a soft contact shadow under (x, y, z), w × h (world units across / deep) */
function contact(c, cam, x, y, z, w, a) {
  const [sx, sy] = project(cam, x, y, z), s = cam.F / z;
  c.fillStyle = `rgba(8,6,16,${a.toFixed(3)})`; c.beginPath(); c.ellipse(sx, sy, Math.max(0.6, w * s), Math.max(0.3, w * s * 0.28), 0, 0, TAU); c.fill();
}
/** the sun's cast shadow on the ground (by day, env.shadow) — a short stretched ellipse along it */
function cast(c, cam, x, y, z, h, w, env) {
  const sh = env.shadow ? env.shadow(h) : null; if (!sh) return;
  // (like the people's: a band from the foot as wide as the body, narrowing to a soft rounded tip along the sun)
  const [ax, ay] = project(cam, x, y, z), [bx, by] = project(cam, x + sh.dx, y, z + sh.dz), s = cam.F / z, hw = Math.max(0.6, w * s);
  c.fillStyle = `rgba(28,22,44,${(sh.a * 0.8).toFixed(3)})`;
  c.beginPath(); c.moveTo(ax - hw, ay); c.lineTo(ax + hw, ay); c.lineTo(bx + hw * 0.6, by); c.lineTo(bx - hw * 0.6, by); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(bx, by, hw * 0.6, hw * 0.3, 0, 0, TAU); c.fill();
}
const line = (c, a, b, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
const poly = (c, pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); };

// ------------------------------------------------------------------ BIRDS: one rig (pigeon, gull) — the wings, the body, the head
/** the birds' looks (true colours; the light does the rest) */
const PIGEON_MORPHS = [
  { body: [132, 140, 158], wing: [150, 156, 170], head: [104, 110, 128], bar: [40, 40, 48], tail: [96, 100, 116], neck: [[96, 150, 120], [148, 96, 150]] },   // blue bar (the common one)
  { body: [120, 124, 140], wing: [112, 116, 128], head: [86, 90, 104], bar: [44, 44, 52], tail: [80, 84, 96], neck: [[88, 140, 112], [140, 90, 140]], check: true },
  { body: [150, 112, 96], wing: [166, 128, 108], head: [130, 98, 86], bar: [104, 64, 52], tail: [130, 100, 90], neck: [[150, 120, 96], [160, 104, 120]] },   // a red one
  { body: [216, 212, 208], wing: [226, 222, 218], head: [206, 202, 200], bar: [176, 172, 172], tail: [210, 206, 204], neck: [[196, 206, 200], [210, 196, 206]] },   // a white one
  { body: [72, 72, 84], wing: [80, 80, 92], head: [60, 60, 72], bar: [28, 28, 34], tail: [56, 56, 66], neck: [[70, 130, 100], [120, 80, 130]] },          // a dark one
];
export const pigeonMorph = seed => { const r = rngFrom(seed * 13 + 5)(); return PIGEON_MORPHS[r < 0.5 ? 0 : r < 0.72 ? 1 : r < 0.84 ? 2 : r < 0.92 ? 4 : 3]; };
const GULL_LOOK = { body: [244, 244, 240], wing: [168, 178, 192], tip: [24, 24, 30], bill: [236, 196, 60], leg: [226, 170, 150], eye: [230, 210, 120] };

/**
 * A BIRD (pigeon | gull): b = { kind, x, y, z, hd, pose ('stand' | 'walk' | 'peck' | 'look' | 'fly' | 'land' | 'takeoff' | 'sleep' |
 * 'huddle' | 'preen'), step (0..1 the stride), peck (0..1 the head down), flap (radians: the wings' beat), spread (0..1 the wings
 * open), pitch (the body's tilt, + nose up), legs (0..1 dangling, landing), turn (the head's yaw from the body), seed, a (alpha) }
 */
export function drawBird(c, cam, b, env) {
  const gull = b.kind === 'gull', B = gull ? SIZE.gull.len : SIZE.pigeon.len, m = gull ? null : pigeonMorph(b.seed || 0);
  const o = { x: b.x, y: b.y || 0, z: b.z }, s = cam.F / b.z, sizePt = B * s;
  if (sizePt < 1.2) return;
  const [ox, oy] = project(cam, o.x, o.y, o.z);
  if (ox < -40 || ox > cam.W + 40 || oy < -40 || oy > cam.H + 40) return;
  const air = b.pose === 'fly' || b.pose === 'land' || b.pose === 'takeoff', puff = b.pose === 'sleep' || b.pose === 'huddle' ? 1.18 : 1;
  const pitch = b.pitch != null ? b.pitch : air ? 0.08 : gull ? 0.12 : 0.22;
  const F = frameOf(o, b.hd || 0), Fp = frameOf(o, b.hd || 0, pitch);
  const bodyY = air ? 0 : (gull ? 0.36 : 0.32) * B;
  const C = Fp(0, 0, bodyY);
  c.save(); c.globalAlpha *= b.a == null ? 1 : b.a;
  // the shadows (on its perch / the ground, not while flying high)
  if (!air || (b.legs || 0) > 0.5) { contact(c, cam, o.x, (b.ground ?? o.y), o.z, B * (gull ? 0.32 : 0.36), 0.32); if (!air) cast(c, cam, o.x, o.y, o.z, B * 0.5, B * 0.3, env); }
  const rim = rimOf(env, o.x, o.z);
  const col = k => litCol(k, env, o.x, o.z, gull ? 1.3 : 1);
  // ---- the wings in the air: two panels from the shoulders, beating about the body's axis (the far one first)
  const spread = air ? (b.spread == null ? 1 : b.spread) : 0;
  const wingPts = side => {
    const ph = b.flap || 0, up = Math.sin(ph) * 0.95 * spread + (1 - spread) * 0.9, sp = (gull ? 1.08 : 0.92) * B * (0.35 + 0.65 * spread);
    const ca = Math.cos(up), sa = Math.sin(up);
    const sh = [0.06 * B, side * 0.08 * B, bodyY + 0.03 * B], wr = [0.04 * B, side * (0.08 * B + sp * 0.45 * ca), bodyY + sp * 0.45 * sa];
    const tip = [-0.16 * B, side * (0.08 * B + sp * ca), bodyY + sp * sa * (gull ? 0.92 : 1)], tr = [-0.24 * B, side * (0.08 * B + sp * 0.55 * ca), bodyY + sp * 0.55 * sa], root = [-0.16 * B, side * 0.06 * B, bodyY];
    return [sh, wr, tip, tr, root].map(([a, bb, y]) => P(cam, Fp(a, bb, y)));
  };
  const drawWing = side => {
    if (!spread) return;
    const w = wingPts(side), base = gull ? GULL_LOOK.wing : m.wing;
    // the underside shows when the wing is above the eye line of the body (seen from below it's lighter)
    poly(c, w, rgb(col(gull ? mix(base, [236, 238, 240], 0.25) : base)));
    // the dark hand: the gull's black tip, the pigeon's darker primaries
    const hand = [w[1], w[2], w[3]].map((p, i) => i === 1 ? p : [p[0] + (w[2][0] - p[0]) * 0.45, p[1] + (w[2][1] - p[1]) * 0.45]);
    poly(c, hand, rgb(col(gull ? GULL_LOOK.tip : mix(m.wing, m.bar, 0.55))));
    if (gull && sizePt > 9) { const q = [w[2][0] + (w[1][0] - w[2][0]) * 0.12, w[2][1] + (w[1][1] - w[2][1]) * 0.12]; c.fillStyle = rgb(col([240, 240, 236])); c.beginPath(); c.arc(q[0], q[1], Math.max(0.3, sizePt * 0.025), 0, TAU); c.fill(); }
  };
  // which wing is far: the one whose lateral side points away from us (+b is deeper at hd 0)
  const farSide = Math.cos(b.hd || 0) >= 0 ? 1 : -1;
  if (air) drawWing(farSide);
  // ---- the tail (a fan behind the body; fanned out while landing)
  // (a short broad fan — the pigeon's ~a third of its length with a dark band at the tip; the gull's square white tail)
  const fan = (air ? 0.1 + 0.1 * (b.legs || 0) : 0.085) * B, tEnd = (gull ? 0.6 : 0.58) * B;
  const tl = [Fp(-0.24 * B, -fan * 0.75, bodyY + 0.03 * B), Fp(-0.24 * B, fan * 0.75, bodyY + 0.03 * B), Fp(-tEnd, fan * 1.25, bodyY - (air ? 0 : 0.06) * B), Fp(-tEnd, -fan * 1.25, bodyY - (air ? 0 : 0.06) * B)].map(p => P(cam, p));
  if (rim) { c.save(); c.translate(rim.side * Math.max(0.5, s * 0.02), -0.4); c.globalAlpha *= rim.a; poly(c, tl, rgb(rim.col)); c.restore(); }
  poly(c, tl, rgb(col(gull ? GULL_LOOK.body : m.tail)));
  if (!gull && sizePt > 5) { const tip = [tl[2], tl[3], [tl[3][0] + (tl[0][0] - tl[3][0]) * 0.22, tl[3][1] + (tl[0][1] - tl[3][1]) * 0.22], [tl[2][0] + (tl[1][0] - tl[2][0]) * 0.22, tl[2][1] + (tl[1][1] - tl[2][1]) * 0.22]]; poly(c, tip, rgb(col(m.bar))); }
  if (gull && !air && sizePt > 6) { const tip = [tl[2], tl[3], [tl[3][0] + (tl[0][0] - tl[3][0]) * 0.3, tl[3][1] + (tl[0][1] - tl[3][1]) * 0.3], [tl[2][0] + (tl[1][0] - tl[2][0]) * 0.3, tl[2][1] + (tl[1][1] - tl[2][1]) * 0.3]]; poly(c, tip, rgb(col(GULL_LOOK.tip))); }
  // ---- the legs (standing / walking; dangling when landing)
  if (!air || (b.legs || 0) > 0.2) {
    const legCol = rgb(col(gull ? GULL_LOOK.leg : [196, 104, 104]), 1), lw = Math.max(0.5, B * s * 0.045);
    for (const side of [-1, 1]) {
      const st = (b.pose === 'walk' ? Math.sin((b.step || 0) * TAU + (side > 0 ? 0 : PI)) : 0) * 0.12 * B;
      const hip = P(cam, Fp(0.02 * B, side * 0.05 * B, bodyY - 0.1 * B)), foot = air ? P(cam, Fp(-0.08 * B, side * 0.05 * B, bodyY - 0.34 * B)) : P(cam, F(st, side * 0.05 * B, 0));
      line(c, hip, foot, legCol, lw);
    }
  }
  // ---- the body (an ellipsoid along the heading, a touch pitched)
  const bl = (gull ? 0.36 : 0.33) * B, bw = (gull ? 0.15 : 0.16) * B * puff, bh = (gull ? 0.16 : 0.16) * B * puff;
  const E = ellipsoid(cam, C, axesOf(b.hd || 0, pitch, bl, bw, bh));
  if (rim) { c.save(); c.translate(rim.side * Math.max(0.5, s * 0.02), -Math.max(0.35, s * 0.012)); c.globalAlpha *= rim.a; fillE(c, E, rgb(rim.col)); c.restore(); }
  bodyE(c, E, gull ? GULL_LOOK.body : m.body, env, o.x, o.z, gull ? 1.3 : 1);
  // ---- the folded wing on the near side (+ the pigeon's two black bars), the gull's grey mantle + black tips at rest
  if (!air) {
    const fw = ellipsoid(cam, Fp(-0.07 * B, farSide * -0.06 * B, bodyY + 0.05 * B), axesOf(b.hd || 0, pitch - 0.08, bl * 0.86, bw * 0.75, bh * 0.62));
    fillE(c, fw, rgb(col(gull ? GULL_LOOK.wing : m.wing)));
    if (sizePt > 5.5) {
      if (gull) { const w0 = P(cam, Fp(-0.3 * B, farSide * -0.04 * B, bodyY + 0.06 * B)), w1 = P(cam, Fp(-0.6 * B, farSide * -0.02 * B, bodyY + 0.02 * B)); line(c, w0, w1, rgb(col(GULL_LOOK.tip)), Math.max(0.7, sizePt * 0.07)); }
      else for (const a of [-0.02, -0.12]) { const p0 = P(cam, Fp(a * B, farSide * -0.13 * B, bodyY + 0.03 * B)), p1 = P(cam, Fp((a - 0.07) * B, farSide * -0.14 * B, bodyY + 0.07 * B)); line(c, p0, p1, rgb(col(m.bar)), Math.max(0.45, sizePt * 0.045)); }
    }
  }
  // ---- the head + neck (pecking: the head down to the ground; sleeping: tucked; the gull's longer neck)
  const peck = b.pose === 'peck' ? b.peck || 0 : 0, tuck = b.pose === 'sleep' || b.pose === 'huddle';
  const turn = b.turn || 0, Fh = frameOf(o, (b.hd || 0) + turn);
  const headA = tuck ? 0.16 * B : (gull ? 0.36 : 0.33) * B + 0.06 * B * peck, headY = tuck ? bodyY + 0.1 * B : air ? bodyY + 0.03 * B : ((gull ? 0.66 : 0.6) - 0.52 * peck) * B;
  const H = (air ? Fp : Fh)(air ? 0.42 * B : headA, 0, air ? bodyY + 0.03 * B : headY), hr = (gull ? 0.1 : 0.095) * B;
  if (!tuck) {
    const n0 = P(cam, Fp(0.2 * B, 0, bodyY + 0.08 * B)), n1 = P(cam, H);
    line(c, n0, n1, rgb(col(gull ? GULL_LOOK.body : m.head)), Math.max(0.8, hr * 2.0 * s));
    // the pigeon's iridescent neck: green / purple by the angle to us
    if (!gull && sizePt > 5) { const q = 0.5 + 0.5 * Math.sin((b.hd || 0) * 2 + (b.peck || 0) * 3), nc = mix(m.neck[0], m.neck[1], q); line(c, n0, [(n0[0] + n1[0]) / 2, (n0[1] + n1[1]) / 2], rgb(col(nc)), Math.max(0.8, hr * 2.1 * s)); }
  }
  const [hx, hy] = P(cam, H), hR = Math.max(0.6, hr * s);
  if (rim) { c.fillStyle = rgb(rim.col, rim.a); c.beginPath(); c.arc(hx + rim.side * Math.max(0.4, s * 0.015), hy - 0.3, hR, 0, TAU); c.fill(); }
  c.fillStyle = rgb(col(gull ? GULL_LOOK.body : m.head)); c.beginPath(); c.arc(hx, hy, hR, 0, TAU); c.fill();
  // the bill along the head's heading (+ the gull's red spot), the eye when big enough to read
  if (!tuck) {
    const ba = (air ? Fp : Fh)((air ? 0.42 : headA / B) * (air ? B : B) + (gull ? 0.17 : 0.11) * B, 0, (air ? bodyY + 0.02 * B : headY - (gull ? 0.02 : 0.015) * B - 0.05 * B * peck));
    const bt = P(cam, ba), bw2 = Math.max(0.45, hr * s * (gull ? 0.55 : 0.4));
    line(c, [hx, hy + hR * 0.15], bt, rgb(col(gull ? GULL_LOOK.bill : [70, 64, 70])), bw2);
    if (gull && sizePt > 12) { c.fillStyle = rgb(col([214, 60, 40])); c.beginPath(); c.arc(bt[0] * 0.7 + hx * 0.3, bt[1] * 0.7 + hy * 0.3 + bw2 * 0.35, Math.max(0.25, bw2 * 0.4), 0, TAU); c.fill(); }
    if (sizePt > 9 && Math.abs(Math.cos((b.hd || 0) + turn)) > 0.3) { c.fillStyle = gull ? rgb(col(GULL_LOOK.eye)) : 'rgba(214,110,40,0.95)'; c.beginPath(); c.arc(hx + (bt[0] - hx) * 0.18, hy - hR * 0.25, Math.max(0.3, hR * 0.22), 0, TAU); c.fill(); }
  }
  // the near wing in the air, last (over the body)
  if (air) drawWing(-farSide);
  c.restore();
}

// ------------------------------------------------------------------ THE SNOWY OWL
/** o = { x, y, z, hd (the body: toward us), turn (the head's yaw), blink (0..1 eyes shut), eyes (0..1 the yellow at dusk), fly (0..1 —
 *  a glide: the wings out), flap, a } — big, white, a few dark flecks; round head, no ear tufts */
export function drawOwl(c, cam, ow, env) {
  const H = SIZE.owl.h, s = cam.F / ow.z, o = { x: ow.x, y: ow.y || 0, z: ow.z }, glide = ow.fly || 0;
  const F = frameOf(o, ow.hd == null ? -PI / 2 : ow.hd);
  c.save(); c.globalAlpha *= ow.a == null ? 1 : ow.a;
  const col = k => litCol(k, env, o.x, o.z, 1.4), W = [246, 246, 242];
  if (!glide) contact(c, cam, o.x, o.y, o.z, H * 0.24, 0.3);
  if (glide > 0.05) {
    // the broad rounded wings of a glide (white, a few dark bars) — the body level
    for (const side of [1, -1]) {
      // (broad rounded wings: a deep chord, the tip a rounded hand of fingered primaries)
      const up = 0.12 + Math.sin(ow.flap || 0) * 0.25, sp = H * 1.05 * glide, Y = k => 0.45 * H + sp * k * Math.sin(up);
      const sh = F(0.12 * H, side * 0.12 * H, 0.47 * H), le = F(0.2 * H, side * sp * 0.55, Y(0.55)), tipA = F(0.06 * H, side * sp * Math.cos(up), Y(1)), tipB = F(-0.16 * H, side * sp * 0.95 * Math.cos(up), Y(0.95)), te = F(-0.34 * H, side * sp * 0.5, Y(0.5)), rt = F(-0.24 * H, side * 0.1 * H, 0.43 * H);
      poly(c, [sh, le, tipA, tipB, te, rt].map(p => P(cam, p)), rgb(col(W)));
      if (s * H > 10) { c.strokeStyle = rgb(col([150, 150, 156]), 0.6); c.lineWidth = 0.5; c.beginPath(); const a = P(cam, le), b = P(cam, te); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    }
  }
  // the body: an upright egg (a level torpedo in a glide)
  const E = glide > 0.5 ? ellipsoid(cam, F(0, 0, 0.45 * H), axesOf(ow.hd == null ? -PI / 2 : ow.hd, 0, 0.32 * H, 0.16 * H, 0.14 * H)) : ellipsoid(cam, F(0, 0, 0.36 * H), axesOf(ow.hd == null ? -PI / 2 : ow.hd, 0, 0.17 * H, 0.2 * H, 0.33 * H));
  const rim = rimOf(env, o.x, o.z);
  if (rim) { c.save(); c.translate(rim.side * 0.7, -0.4); c.globalAlpha *= rim.a; fillE(c, E, rgb(rim.col)); c.restore(); }
  bodyE(c, E, W, env, o.x, o.z, 1.4);
  // the flecks (a young bird's dark bars on the breast + wings)
  if (s * H > 9 && glide < 0.5) { c.fillStyle = rgb(col([96, 96, 108]), 0.55); const r = rngFrom(7); for (let q = 0; q < 9; q++) { const a = (r() - 0.5) * 1.4, y = 0.15 + r() * 0.42; const p = P(cam, F(0.16 * H, a * 0.14 * H, y * H)); c.fillRect(p[0] - 0.5, p[1] - 0.25, 1, 0.5); } }
  // the feet (feathered, a dark talon line) on the perch
  if (glide < 0.5) { const p = P(cam, F(0.06 * H, 0, 0.02 * H)); c.fillStyle = rgb(col([226, 226, 220])); c.beginPath(); c.ellipse(p[0], p[1], Math.max(0.6, 0.1 * H * s), Math.max(0.3, 0.035 * H * s), 0, 0, TAU); c.fill(); }
  // the head: round, turned by `turn` (the slow head turns), the eyes + the beak on its face side when it faces us
  const hd = (ow.hd == null ? -PI / 2 : ow.hd) + (ow.turn || 0), Fh = frameOf(o, hd), Hc = glide > 0.5 ? F(0.32 * H, 0, 0.5 * H) : Fh(0.02 * H, 0, 0.72 * H), [hx, hy] = P(cam, Hc), hR = Math.max(0.8, 0.15 * H * s);
  if (rim) { c.fillStyle = rgb(rim.col, rim.a); c.beginPath(); c.arc(hx + rim.side * 0.6, hy - 0.4, hR, 0, TAU); c.fill(); }
  const hg = c.createRadialGradient(hx - hR * 0.3, hy - hR * 0.35, hR * 0.1, hx, hy, hR); hg.addColorStop(0, rgb(mix(col(W), [255, 255, 255], 0.2))); hg.addColorStop(1, rgb(mix(col(W), [120, 120, 140], 0.22)));
  c.fillStyle = hg; c.beginPath(); c.arc(hx, hy, hR, 0, TAU); c.fill();
  const face = -Math.sin(hd);                            // (1 = its face toward us)
  if (face > 0.15 && s * H > 7) {
    const fx = Math.cos(hd) * hR * 0.55, open = 1 - (ow.blink || 0), dusk = clamp01(ow.eyes || 0);
    for (const e of [-1, 1]) {
      const ex = hx + fx + e * hR * 0.42 * face, ey = hy - hR * 0.08;
      if (open > 0.1) { c.fillStyle = dusk > 0.05 ? `rgba(255,${(214 + 30 * dusk) | 0},${(60 + 40 * dusk) | 0},${(0.85 + 0.15 * dusk).toFixed(2)})` : 'rgba(236,196,40,0.95)'; c.beginPath(); c.ellipse(ex, ey, Math.max(0.35, hR * 0.2), Math.max(0.15, hR * 0.2 * open), 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(10,8,12,0.9)'; c.beginPath(); c.arc(ex, ey, Math.max(0.2, hR * 0.08 * open), 0, TAU); c.fill(); }
      else { c.strokeStyle = rgb(col([150, 150, 160])); c.lineWidth = 0.5; c.beginPath(); c.moveTo(ex - hR * 0.18, ey); c.lineTo(ex + hR * 0.18, ey); c.stroke(); }
      if (dusk > 0.1 && open > 0.4) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,220,80,${(0.35 * dusk).toFixed(3)})`; c.beginPath(); c.arc(ex, ey, hR * 0.45, 0, TAU); c.fill(); c.restore(); }
    }
    c.fillStyle = rgb(col([60, 56, 60])); c.beginPath(); c.moveTo(hx + fx - hR * 0.08, hy + hR * 0.12); c.lineTo(hx + fx + hR * 0.08, hy + hR * 0.12); c.lineTo(hx + fx, hy + hR * 0.36); c.closePath(); c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ THE GREAT BLUE HERON (on its piling at dawn)
/** h = { x, y, z, hd, pose ('stand' | 'strike' | 'fly'), strike (0..1 the neck shooting down), flap, spread, a } — a tall S-necked
 *  grey-blue shape with a dagger bill + the black crown stripe, long legs; flying: the neck folded, the legs trailing, slow broad beats */
export function drawHeron(c, cam, h, env) {
  const Hh = SIZE.heron.h, s = cam.F / h.z, o = { x: h.x, y: h.y || 0, z: h.z }, fly = h.pose === 'fly';
  const F = frameOf(o, h.hd || 0);
  c.save(); c.globalAlpha *= h.a == null ? 1 : h.a;
  const col = k => litCol(k, env, o.x, o.z, 1), body = [118, 132, 152], dark = [40, 44, 56];
  if (fly) {
    const sp = Hh * 0.95 * (h.spread == null ? 1 : h.spread), up = Math.sin(h.flap || 0) * 0.55;
    const wing = side => { const sh = F(0.02 * Hh, side * 0.08 * Hh, 0), wr = F(0.05 * Hh, side * sp * 0.48 * Math.cos(up), sp * 0.48 * Math.sin(up)), tip = F(-0.12 * Hh, side * sp * Math.cos(up * 1.2), sp * Math.sin(up * 1.2)), tr = F(-0.2 * Hh, side * sp * 0.5 * Math.cos(up), sp * 0.5 * Math.sin(up) - 0.03 * Hh), rt = F(-0.14 * Hh, side * 0.06 * Hh, 0);
      const pts = [sh, wr, tip, tr, rt].map(p => P(cam, p)); poly(c, pts, rgb(col(body))); poly(c, [pts[1], pts[2], [pts[3][0] * 0.6 + pts[2][0] * 0.4, pts[3][1] * 0.6 + pts[2][1] * 0.4]], rgb(col(dark))); };
    const far = Math.cos(h.hd || 0) >= 0 ? 1 : -1;
    wing(far);
    const E = ellipsoid(cam, F(0, 0, 0), axesOf(h.hd || 0, 0, 0.22 * Hh, 0.07 * Hh, 0.07 * Hh)); bodyE(c, E, body, env, o.x, o.z);
    const n0 = P(cam, F(0.16 * Hh, 0, 0.02 * Hh)), n1 = P(cam, F(0.14 * Hh, 0, 0.1 * Hh)), hd0 = P(cam, F(0.24 * Hh, 0, 0.08 * Hh)), bl = P(cam, F(0.4 * Hh, 0, 0.06 * Hh));
    c.strokeStyle = rgb(col(body)); c.lineWidth = Math.max(0.8, 0.05 * Hh * s); c.lineCap = 'round'; c.beginPath(); c.moveTo(n0[0], n0[1]); c.quadraticCurveTo(n1[0], n1[1], hd0[0], hd0[1]); c.stroke();
    line(c, hd0, bl, rgb(col([226, 190, 80])), Math.max(0.5, 0.02 * Hh * s));
    const lg0 = P(cam, F(-0.18 * Hh, 0, -0.02 * Hh)), lg1 = P(cam, F(-0.5 * Hh, 0, -0.04 * Hh)); line(c, lg0, lg1, rgb(col(dark)), Math.max(0.5, 0.018 * Hh * s));
    wing(-far);
    c.restore(); return;
  }
  // standing: the legs, the body tilted, the S-neck (or the strike), the head, the dagger bill, the black crown stripe + plume
  const lw = Math.max(0.6, 0.022 * Hh * s);
  for (const side of [-1, 1]) line(c, P(cam, F(0, side * 0.035 * Hh, 0.36 * Hh)), P(cam, F(0.02 * Hh, side * 0.04 * Hh, 0)), rgb(col([70, 60, 50])), lw);
  const rim = rimOf(env, o.x, o.z);
  const E = ellipsoid(cam, F(-0.03 * Hh, 0, 0.5 * Hh), axesOf(h.hd || 0, 0.5, 0.25 * Hh, 0.105 * Hh, 0.13 * Hh));
  if (rim) { c.save(); c.translate(rim.side * 0.7, -0.4); c.globalAlpha *= rim.a; fillE(c, E, rgb(rim.col)); c.restore(); }
  bodyE(c, E, body, env, o.x, o.z);
  // the back plumes (a darker fringe down the back), the rusty thigh
  const pl0 = P(cam, F(-0.06 * Hh, 0, 0.62 * Hh)), pl1 = P(cam, F(-0.28 * Hh, 0, 0.36 * Hh)); line(c, pl0, pl1, rgb(col([86, 98, 118])), Math.max(0.6, 0.04 * Hh * s));
  const th = P(cam, F(0.0, 0, 0.38 * Hh)); c.fillStyle = rgb(col([150, 96, 70])); c.beginPath(); c.arc(th[0], th[1], Math.max(0.5, 0.03 * Hh * s), 0, TAU); c.fill();
  const k = clamp01(h.strike || 0), base = F(0.13 * Hh, 0, 0.62 * Hh);
  const head = k > 0 ? F((0.2 + 0.32 * k) * Hh, 0, (0.98 - 0.86 * k) * Hh) : F(0.17 * Hh + Math.sin(h.t || 0) * 0.01 * Hh, 0, 0.96 * Hh), mid = k > 0 ? F((0.2 + 0.2 * k) * Hh, 0, (0.8 - 0.4 * k) * Hh) : F(0.03 * Hh, 0, 0.8 * Hh);
  const b0 = P(cam, base), m0 = P(cam, mid), h0 = P(cam, head);
  c.strokeStyle = rgb(col([196, 200, 208])); c.lineWidth = Math.max(1.1, 0.068 * Hh * s); c.lineCap = 'round';
  c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(m0[0] * 2 - (b0[0] + h0[0]) / 2, m0[1] * 2 - (b0[1] + h0[1]) / 2, h0[0], h0[1]); c.stroke();
  const hR = Math.max(0.8, 0.052 * Hh * s);
  c.fillStyle = rgb(col([226, 228, 232])); c.beginPath(); c.arc(h0[0], h0[1], hR, 0, TAU); c.fill();
  const bt = P(cam, k > 0 ? F((0.32 + 0.38 * k) * Hh, 0, (0.96 - 0.94 * k) * Hh) : F(0.34 * Hh, 0, 0.965 * Hh));
  line(c, h0, bt, rgb(col([226, 188, 74])), Math.max(0.5, hR * 0.55));
  // the black stripe over the eye back into a plume
  const pb = P(cam, F(0.02 * Hh + (k > 0 ? 0.3 * k * Hh : 0), 0, (1.0 - 0.86 * k) * Hh));
  line(c, [h0[0], h0[1] - hR * 0.5], pb, rgb(col(dark)), Math.max(0.5, hR * 0.45));
  c.restore();
}

// ------------------------------------------------------------------ THE QUADRUPEDS (coyote, cat, squirrel): one rig
const QUAD = {
  coyote: { L: SIZE.coyote.len, H: SIZE.coyote.h * 1.22, coat: [150, 128, 100], belly: [214, 196, 168], dark: [74, 62, 54], ear: 'big', tail: 'brush', legW: 0.042, head: 0.13, snout: 0.15, bodyH: 0.13, tailW: 0.075 },
  cat: { L: SIZE.cat.len, H: SIZE.cat.h * 1.6, coat: [26, 24, 30], belly: [36, 34, 40], dark: [12, 12, 16], ear: 'cat', tail: 'cat', legW: 0.05, head: 0.13, snout: 0.05, bodyH: 0.18 },
  // (Michigan's BLACK squirrel — the eastern grey's dark form, common in Grand Rapids: a charcoal coat that stands out on the grey cobbles + the
  // autumn leaves, a frosted fringe on its plume)
  squirrel: { L: SIZE.squirrel.len, H: SIZE.squirrel.len * 0.7, coat: [52, 46, 44], belly: [92, 82, 76], dark: [30, 26, 26], ear: 'small', tail: 'plume', legW: 0.07, head: 0.18, snout: 0.06, fringe: [176, 168, 160] },
};
/**
 * q = { kind, x, y, z, hd, gait (the stride's phase, by distance), moving (0..1), pose ('stand' | 'trot' | 'sit' |
 * 'crouch' | 'pounce' | 'sitUp' | 'climb' | 'lick'), turn (the head's yaw), headUp (0..1 — the howl), eyes (0..1 eyeshine), tailFlick,
 * up (a climbing squirrel: its body along the trunk, vertical), a }
 */
export function drawQuad(c, cam, q, env) {
  const S = QUAD[q.kind]; if (!S) return;
  const L = S.L, Ht = S.H, s = cam.F / q.z, o = { x: q.x, y: q.y || 0, z: q.z }, pose = q.pose || 'stand';
  if (L * s < 1.5) return;
  const climb = pose === 'climb';
  // (climbing: the body pitched up the trunk — nose to the sky — the frame's forward is up)
  const pitch = climb ? (q.dir < 0 ? -(PI / 2 - 0.15) : PI / 2 - 0.15) : pose === 'sit' || pose === 'sitUp' || pose === 'lick' ? 0.75 : pose === 'crouch' ? -0.04 : 0;
  const F = frameOf(o, q.hd || 0), Fp = frameOf(o, q.hd || 0, pitch);
  c.save(); c.globalAlpha *= q.a == null ? 1 : q.a;
  if (!climb) { contact(c, cam, o.x, o.y, o.z, L * 0.36, 0.34); cast(c, cam, o.x, o.y, o.z, Ht * 0.6, L * 0.3, env); }
  const col = k => litCol(k, env, o.x, o.z, 1), rim = rimOf(env, o.x, o.z), mv = q.moving || 0;
  const low = pose === 'crouch' ? 0.62 : pose === 'pounce' ? 0.8 : 1;
  const shY = Ht * 0.62 * low, hipY = Ht * 0.6 * low;
  // ---- the legs: a trot (diagonal pairs), a walk; sitting: the hind legs folded, the front ones straight
  const legs = [], gp = (q.gait || 0) * TAU, st = 0.16 * L * mv;
  const leg = (a, side, ph, top) => { const sw = Math.sin(gp + ph) * st, lift = Math.max(0, Math.cos(gp + ph)) * 0.08 * Ht * mv; return { top: Fp(a, side * 0.09 * L, top), foot: F(a * Math.cos(pitch) + sw, side * 0.09 * L, lift), side }; };
  if (!climb) {
    if (pose === 'sit' || pose === 'sitUp' || pose === 'lick') { for (const side of [-1, 1]) { legs.push({ top: Fp(0.3 * L, side * 0.07 * L, shY * 0.4), foot: F(0.2 * L, side * 0.07 * L, 0), side }); } }
    else for (const [a, ph, side] of [[0.3 * L, 0, 1], [-0.3 * L, PI, 1], [0.3 * L, PI, -1], [-0.3 * L, 0, -1]]) legs.push(leg(a, side, ph, a > 0 ? shY * 0.9 : hipY * 0.9));
    const lw = Math.max(0.55, S.legW * L * s), farSide = Math.cos(q.hd || 0) >= 0 ? 1 : -1;
    for (const lg of legs.sort((a, b) => (b.side === farSide) - (a.side === farSide))) line(c, P(cam, lg.top), P(cam, lg.foot), rgb(col(lg.side === farSide ? S.dark : mix(S.coat, S.dark, 0.35))), lw);
  }
  // ---- the tail (behind the body when it faces us; brush: hanging down + back; plume: the squirrel's S up over the back)
  const tailPts = (() => {
    const flick = q.tailFlick || 0;
    if (S.tail === 'plume') { const up = climb ? 0.3 : 1; return [Fp(-0.3 * L, 0, 0.3 * Ht), Fp(-0.55 * L, flick * 0.1 * L, (0.55 + 0.4 * up) * Ht), Fp(-0.3 * L, flick * 0.15 * L, (1.05 + 0.5 * up) * Ht), Fp(-0.1 * L + 0.1 * flick * L, 0, (1.15 + 0.4 * up) * Ht)]; }
    if (S.tail === 'cat') return [Fp(-0.42 * L, 0, hipY * 0.95), Fp(-0.62 * L, flick * 0.1 * L, hipY * 0.7), Fp(-0.78 * L, 0, hipY * 1.1 + 0.2 * Ht), Fp(-0.74 * L + flick * 0.06, 0, hipY * 1.35 + 0.28 * Ht)];
    // (the coyote's brush: hanging low behind, a gentle droop — never a straight log)
    return [Fp(-0.42 * L, 0, hipY * 0.92), Fp(-0.55 * L, 0, hipY * 0.7), Fp(-0.63 * L, 0, hipY * 0.44), Fp(-0.66 * L, flick * 0.05, hipY * 0.24)];
  })();
  const drawTail = () => {
    const pts = tailPts.map(p => P(cam, p)), w = (S.tailW || (S.tail === 'plume' ? 0.24 : 0.05)) * L * s;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (rim) { c.strokeStyle = rgb(rim.col, rim.a); c.lineWidth = w + 1; c.beginPath(); c.moveTo(pts[0][0] + rim.side * 0.5, pts[0][1] - 0.4); c.bezierCurveTo(pts[1][0] + rim.side * 0.5, pts[1][1] - 0.4, pts[2][0] + rim.side * 0.5, pts[2][1] - 0.4, pts[3][0] + rim.side * 0.5, pts[3][1] - 0.4); c.stroke(); }
    c.strokeStyle = rgb(col(S.tail === 'plume' ? mix(S.coat, [200, 170, 140], 0.25) : S.coat)); c.lineWidth = Math.max(0.6, w);
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); c.stroke();
    if (S.tail === 'brush' && w > 1.2) { c.strokeStyle = rgb(col(S.dark)); c.lineWidth = w * 0.8; c.beginPath(); c.moveTo(pts[3][0] * 0.7 + pts[2][0] * 0.3, pts[3][1] * 0.7 + pts[2][1] * 0.3); c.lineTo(pts[3][0], pts[3][1]); c.stroke(); }
    if (S.tail === 'plume' && w > 2) { c.strokeStyle = rgb(col(S.fringe || [236, 220, 200]), 0.55); c.lineWidth = Math.max(0.4, w * 0.18); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(pts[1][0] - w * 0.4, pts[1][1], pts[2][0] - w * 0.3, pts[2][1] - w * 0.3, pts[3][0], pts[3][1] - w * 0.4); c.stroke(); }
  };
  const facingUs = Math.sin(q.hd || 0) < -0.3;
  if (facingUs || climb) drawTail();
  // ---- the body: the hindquarters + the chest as two ellipsoids along the spine (+ the belly's lighter underside)
  const bH = S.bodyH || 0.2, hipE = ellipsoid(cam, Fp(-0.2 * L, 0, hipY + 0.04 * Ht), axesOf(q.hd || 0, pitch, 0.25 * L, 0.12 * L, bH * Ht));
  const chE = ellipsoid(cam, Fp(0.17 * L, 0, shY + 0.06 * Ht), axesOf(q.hd || 0, pitch, 0.25 * L, 0.12 * L, bH * 1.15 * Ht));
  if (rim) { c.save(); c.translate(rim.side * Math.max(0.5, s * 0.02), -0.45); c.globalAlpha *= rim.a; fillE(c, hipE, rgb(rim.col)); fillE(c, chE, rgb(rim.col)); c.restore(); }
  bodyE(c, hipE, S.coat, env, o.x, o.z); bodyE(c, chE, S.coat, env, o.x, o.z);
  if (q.kind !== 'cat' && L * s > 10) { const be = ellipsoid(cam, Fp(0.02 * L, 0, shY * 0.68), axesOf(q.hd || 0, pitch, 0.3 * L, 0.09 * L, 0.06 * Ht)); fillE(c, be, rgb(col(S.belly), 0.55)); }
  // ---- the head: on the neck, turned by `turn`, raised for the howl; the snout along its heading; the ears; the eyes / eyeshine
  const hy = q.headUp || 0, hdH = (q.hd || 0) + (q.turn || 0), Fh = frameOf(o, hdH, climb ? pitch : hy * 0.9 - (pose === 'crouch' ? 0.15 : 0));
  const neck = Fp(0.38 * L, 0, shY + 0.14 * Ht);
  const hc = { x: neck.x, y: neck.y + 0.05 * Ht + hy * 0.08 * Ht, z: neck.z };
  const Fhc = frameOf(hc, hdH, climb ? pitch : hy * 0.9);
  const head = ellipsoid(cam, hc, axesOf(hdH, climb ? pitch : hy * 0.9, S.head * L * 1.05, S.head * L * 0.85, S.head * L * 0.85));
  if (rim) { c.save(); c.translate(rim.side * 0.6, -0.4); c.globalAlpha *= rim.a; fillE(c, head, rgb(rim.col)); c.restore(); }
  line(c, P(cam, Fp(0.22 * L, 0, shY + 0.1 * Ht)), [head.x, head.y], rgb(col(S.coat)), Math.max(0.8, S.head * L * s * 1.3));
  // the ears (behind the head's outline)
  const earPts = side => { const big = S.ear === 'big' ? 1.4 : S.ear === 'cat' ? 1.1 : 0.7; return [Fhc(-0.02 * L, side * S.head * L * 0.4, S.head * L * 0.55), Fhc(-0.06 * L, side * S.head * L * 0.55, S.head * L * (0.55 + 0.75 * big)), Fhc(-0.1 * L, side * S.head * L * 0.15, S.head * L * 0.6)].map(p => P(cam, p)); };
  for (const side of [-1, 1]) poly(c, earPts(side), rgb(col(S.dark)));
  bodyE(c, head, S.coat, env, o.x, o.z);
  // the snout (the coyote's long one, the cat's short)
  const sn = Fhc(S.head * L * 0.8 + S.snout * L * 0.6, 0, -S.head * L * 0.2), snP = P(cam, sn);
  if (S.snout > 0.06) { line(c, [head.x, head.y], snP, rgb(col(S.belly)), Math.max(0.6, S.head * L * s * 0.75)); }
  c.fillStyle = rgb(col([20, 18, 20])); c.beginPath(); c.arc(snP[0], snP[1], Math.max(0.3, L * s * 0.022), 0, TAU); c.fill();
  const face = -Math.sin(hdH);
  // the eyes: by day two dark dots when it faces us; the EYESHINE at night (the coyote's green-gold flash in the lamplight, the cat's)
  if (face > -0.2 && L * s > 7) {
    const ey = Fhc(S.head * L * 0.62, 0, S.head * L * 0.15), shine = clamp01(q.eyes || 0);
    for (const e of [-1, 1]) {
      const p = P(cam, frameOf(ey, hdH)(0, e * S.head * L * 0.4, 0)), r = Math.max(0.3, L * s * 0.022);
      if (shine > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 5); const ec = q.kind === 'cat' ? '190,255,120' : '200,255,150'; g.addColorStop(0, `rgba(255,255,220,${shine})`); g.addColorStop(0.25, `rgba(${ec},${0.8 * shine})`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(p[0] - r * 5, p[1] - r * 5, r * 10, r * 10); c.restore(); }
      else if (face > 0.2) { c.fillStyle = q.kind === 'cat' ? 'rgba(200,220,90,0.9)' : 'rgba(18,14,14,0.9)'; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); }
    }
  }
  if (!facingUs && !climb) drawTail();
  c.restore();
}

// ------------------------------------------------------------------ THE TRASH CAN (the trash collector's)
/** a small period GALVANIZED steel can with a domed lid + a handle (+ the corrugated ribs): can = { x, z, h, r, lid: 'on' | 'askew' |
 *  'off', lift (0..1 — carried by the collector: off the ground), tilt (radians — tipped as it's emptied), lidT (0..1 the lid's slide) } */
export function drawTrashCan(c, cam, can, env) {
  // C2 — THE CLASSIC 1920s CITY CAN (the owner: "it looks like a fire hydrant"): a ribbed galvanized cylinder — vertical corrugations,
  // two raised hoops, a BRIGHT rolled rim, small drop handles flush under it (the old ear loops read as a hydrant's nozzles), a shallow
  // lid + its bail handle, scraps of paper poking out under the lid; standing against the lamppost, held to it by an iron strap
  const s = cam.F / can.z, lift = (can.lift || 0) * 0.5, [gx, gy] = project(cam, can.x, lift, can.z), H = can.h * s, Rr = can.r * s;
  c.save();
  const col = k => litCol(k, env, can.x, can.z, 1.6), sun = sunOf(env);
  if (!can.lift) { contact(c, cam, can.x, 0, can.z, can.r * 1.25, 0.4); cast(c, cam, can.x, 0, can.z, can.h, can.r, env); }
  // the strap to the post (behind the can's body: from its back, round the post) — only while it stands there
  if (!can.lift && !can.tilt && can.post != null) {
    const [px] = project(cam, can.post, 0, can.z), y = gy - H * 0.62, iron = col([44, 44, 50]);
    c.strokeStyle = rgb(iron); c.lineWidth = Math.max(0.8, s * 0.06); c.beginPath(); c.moveTo(gx - Rr * 0.6, y); c.lineTo(px - s * 0.05, y - s * 0.02); c.stroke();
    c.fillStyle = rgb(mix(iron, [200, 200, 210], 0.35)); c.fillRect(px - s * 0.12, y - s * 0.1, s * 0.24, s * 0.16);   // (the clamp round the post)
  }
  c.translate(gx, gy); if (can.tilt) c.rotate(can.tilt);
  const steel = [178, 182, 184], hi = col(mix(steel, [255, 252, 240], 0.45 * sun.k + 0.12)), lo = col(mix(steel, [40, 40, 54], 0.5)), mid = col(steel);
  const L0 = sun.s > 0 ? lo : hi, L1 = sun.s > 0 ? hi : lo;
  const g = c.createLinearGradient(-Rr, 0, Rr, 0);
  g.addColorStop(0, rgb(L0)); g.addColorStop(0.3, rgb(mix(L0, mid, 0.75))); g.addColorStop(0.58, rgb(mix(mid, L1, 0.45))); g.addColorStop(0.8, rgb(L1)); g.addColorStop(1, rgb(mix(L1, lo, 0.5)));
  const ry = Rr * 0.3, top = -H * 0.94, taper = 0.93;
  c.fillStyle = g; c.beginPath(); c.moveTo(-Rr * taper, 0); c.lineTo(-Rr, top); c.lineTo(Rr, top); c.lineTo(Rr * taper, 0); c.ellipse(0, 0, Rr * taper, ry * taper, 0, 0, PI); c.closePath(); c.fill();
  // the corrugations: vertical ribs round the cylinder (bunched toward its edges — a lit edge + a dark groove each)
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.36, x = Math.sin(a), w = Math.cos(a);
    c.strokeStyle = rgb(mix(lo, [0, 0, 0], 0.15), 0.55 * w); c.lineWidth = Math.max(0.35, s * 0.02);
    c.beginPath(); c.moveTo(x * Rr * taper + s * 0.01, -H * 0.06); c.lineTo(x * Rr + s * 0.01, top + H * 0.08); c.stroke();
    c.strokeStyle = rgb(hi, 0.4 * w); c.lineWidth = Math.max(0.3, s * 0.014);
    c.beginPath(); c.moveTo(x * Rr * taper - s * 0.02, -H * 0.06); c.lineTo(x * Rr - s * 0.02, top + H * 0.08); c.stroke();
  }
  // two raised hoops + the foot's hoop (a shadowed underside, a lit top edge)
  for (const v of [0.3, 0.66, 0.04]) {
    const rr = Rr * (taper + (1 - taper) * v);
    c.strokeStyle = rgb(mix(lo, [0, 0, 0], 0.25), 0.85); c.lineWidth = Math.max(0.6, s * 0.05); c.beginPath(); c.ellipse(0, -H * v, rr, ry, 0, 0.04, PI - 0.04); c.stroke();
    c.strokeStyle = rgb(hi, 0.75); c.lineWidth = Math.max(0.35, s * 0.02); c.beginPath(); c.ellipse(0, -H * v - s * 0.04, rr, ry, 0, 0.25, PI - 0.25); c.stroke();
  }
  // the drop handles: flat iron bars flush under the rim on either side
  c.fillStyle = rgb(mix(lo, [0, 0, 0], 0.35));
  for (const d of [-1, 1]) c.fillRect(d > 0 ? Rr * 0.62 : -Rr * 0.98, top + H * 0.1, Rr * 0.36, Math.max(0.6, s * 0.045));
  // the opening (a dark mouth when the lid is off) + THE BRIGHT ROLLED RIM
  if (can.lid !== 'on') { c.fillStyle = rgb(mix(lo, [0, 0, 0], 0.65)); c.beginPath(); c.ellipse(0, top, Rr, ry, 0, 0, TAU); c.fill(); }
  c.strokeStyle = rgb(mix(hi, [255, 255, 255], 0.35)); c.lineWidth = Math.max(0.7, s * 0.05); c.beginPath(); c.ellipse(0, top, Rr * 1.02, ry, 0, 0, PI); c.stroke();
  // scraps of paper under the lid (a full can — gone once it's been emptied: can.empty)
  const scraps = () => {
    if (can.empty) return;
    const paper = col([236, 230, 212]), shadeP = col([196, 188, 168]);
    // (crumpled sheets + a folded newspaper, out from under the lid's edges — their feet under it)
    poly(c, [[-Rr * 1.12, top - ry * 0.1], [-Rr * 1.02, top - ry * 3.2], [-Rr * 0.62, top - ry * 2.4], [-Rr * 0.66, top + ry * 0.1]], rgb(paper));
    poly(c, [[-Rr * 1.0, top - ry * 2.9], [-Rr * 0.8, top - ry * 3.5], [-Rr * 0.7, top - ry * 2.5]], rgb(shadeP));
    poly(c, [[Rr * 0.62, top + ry * 0.1], [Rr * 0.86, top - ry * 3.6], [Rr * 1.22, top - ry * 2.2], [Rr * 1.12, top + ry * 0.1]], rgb(shadeP));
    poly(c, [[Rr * 0.76, top - ry * 1.4], [Rr * 1.05, top - ry * 2.0], [Rr * 1.0, top - ry * 1.2]], rgb(mix(paper, [60, 60, 70], 0.35)));   // (a line of newsprint)
  };
  // the lid: on (a shallow dome, a bright edge, its bail handle) | askew / off (leaning against the can on the ground)
  const lid = (x, y, rot, k = 1) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    const lg = c.createLinearGradient(-Rr, 0, Rr, 0); lg.addColorStop(0, rgb(L0)); lg.addColorStop(0.7, rgb(L1)); lg.addColorStop(1, rgb(mix(L1, lo, 0.4)));
    c.fillStyle = lg; c.beginPath(); c.ellipse(0, 0, Rr * 1.1 * k, ry * 1.08 * k, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0, -ry * 0.15, Rr * 0.92 * k, Rr * 0.26 * k, 0, PI, 0); c.fill();
    c.strokeStyle = rgb(mix(hi, [255, 255, 255], 0.3), 0.9); c.lineWidth = Math.max(0.5, s * 0.03); c.beginPath(); c.ellipse(0, 0, Rr * 1.1 * k, ry * 1.08 * k, 0, PI * 0.02, PI * 0.98); c.stroke();
    c.strokeStyle = rgb(mix(lo, [0, 0, 0], 0.35)); c.lineWidth = Math.max(0.6, s * 0.04); c.beginPath(); c.moveTo(-Rr * 0.3 * k, -Rr * 0.26 * k - ry * 0.15); c.lineTo(-Rr * 0.22 * k, -Rr * 0.42 * k - ry * 0.15); c.lineTo(Rr * 0.22 * k, -Rr * 0.42 * k - ry * 0.15); c.lineTo(Rr * 0.3 * k, -Rr * 0.26 * k - ry * 0.15); c.stroke();
    c.restore();
  };
  if (can.lid === 'on') { scraps(); lid(0, top - ry * 0.35, -0.06); }
  else lid(Rr * 1.55, -Rr * 0.95, 1.3);          // ('off' / 'askew': the lid leaning on the ground against the can — the same, no jump)
  c.restore();
}

// ------------------------------------------------------------------ THE MOORING PILING (the heron's) + a FISH's jump + ripple rings
/** three weathered timbers bound with an iron band, a rope round them; their reflection in the water (p = pilingSpot + the light) */
export function drawPiling(c, cam, p, env) {
  const s = cam.F / p.z, [cx, wy] = project(cam, p.x, p.water, p.z), [, ty] = project(cam, p.x, p.y, p.z), r = p.r * s;
  const wood = [92, 78, 64], col = k => litCol(k, env, p.x, p.z, 0.6), sun = sunOf(env);
  c.save();
  // the reflection: three dark streaks wavering in the water under them
  c.globalAlpha *= 0.35; c.fillStyle = rgb(col([30, 28, 34]));
  for (const [dx, dh] of [[-0.62, 0], [0, 0.18], [0.62, 0.08]]) c.fillRect(cx + dx * r - r * 0.32, wy, r * 0.64, (wy - ty) * 0.55 - dh * s);
  c.restore(); c.save();
  for (const [dx, dh] of [[-0.62, 0], [0.62, 0.08], [0, 0.18]]) {
    const x0 = cx + dx * r - r * 0.36, top = ty - dh * s, g = c.createLinearGradient(x0, 0, x0 + r * 0.72, 0);
    g.addColorStop(sun.s > 0 ? 1 : 0, rgb(col(mix(wood, [255, 236, 200], 0.25 * sun.k)))); g.addColorStop(sun.s > 0 ? 0 : 1, rgb(col(mix(wood, [20, 18, 26], 0.45))));
    c.fillStyle = g; c.fillRect(x0, top, r * 0.72, wy - top);
    c.fillStyle = rgb(col([128, 118, 104])); c.beginPath(); c.ellipse(x0 + r * 0.36, top, r * 0.36, r * 0.12, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(40,52,36,0.5)'; c.fillRect(x0, wy - (wy - top) * 0.22, r * 0.72, (wy - top) * 0.22);   // (the green-black waterline)
  }
  c.fillStyle = rgb(col([60, 56, 58])); c.fillRect(cx - r * 1.05, ty + (wy - ty) * 0.18, r * 2.1, Math.max(0.6, 0.06 * s));
  c.strokeStyle = rgb(col([170, 150, 112])); c.lineWidth = Math.max(0.5, 0.05 * s); c.beginPath(); c.moveTo(cx - r * 1.05, ty + (wy - ty) * 0.4); c.quadraticCurveTo(cx, ty + (wy - ty) * 0.52, cx + r * 1.05, ty + (wy - ty) * 0.42); c.stroke();
  c.restore();
}
/** a fish's jump (j = { x, z, t: s since it left the water, dir, big, water (y) }): a silver arc out + back in (0.7 s; by day a glint),
 *  the splash, then 3 rings spreading on the water over ~3 s */
export function drawJump(c, cam, j, env) {
  const s = cam.F / j.z, [cx, wy] = project(cam, j.x, j.water, j.z), T = j.t, len = j.big ? 0.9 : 0.7, day = sunOf(env).k, night = clamp01(env.dark || 0);
  c.save();
  // the rings (on the water: flattened ellipses, a light crest + a dark trough)
  for (let q = 0; q < 3; q++) {
    const u = (T - len * 0.5 - q * 0.45) / 3; if (u <= 0 || u >= 1) continue;
    const R = (0.25 + u * (j.big ? 2.4 : 1.7)) * s, a = (1 - u) ** 1.6 * (0.55 - q * 0.12);
    c.strokeStyle = night > 0.5 ? `rgba(190,200,230,${(a * 0.6).toFixed(3)})` : `rgba(240,246,255,${a.toFixed(3)})`; c.lineWidth = Math.max(0.4, 0.05 * s);
    c.beginPath(); c.ellipse(cx + j.dir * 0.3 * s, wy, R, R * 0.22, 0, 0, TAU); c.stroke();
    c.strokeStyle = `rgba(10,16,30,${(a * 0.4).toFixed(3)})`; c.beginPath(); c.ellipse(cx + j.dir * 0.3 * s, wy + 0.5, R * 0.94, R * 0.2, 0, 0.1, PI - 0.1); c.stroke();
  }
  // the fish in the air
  if (T < len) {
    const u = T / len, fx = cx + j.dir * (u - 0.5) * 0.9 * s, fy = wy - Math.sin(u * PI) * (j.big ? 0.75 : 0.5) * s, ang = Math.atan2(-Math.cos(u * PI) * 0.6, j.dir * 0.9);
    c.save(); c.translate(fx, fy); c.rotate(j.dir > 0 ? -ang : ang); c.scale(j.dir, 1);
    const fl = (j.big ? 0.42 : 0.3) * s;
    c.fillStyle = night > 0.5 ? 'rgba(80,88,110,0.9)' : 'rgba(176,186,196,0.95)'; c.beginPath(); c.ellipse(0, 0, fl, fl * 0.26, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-fl * 0.9, 0); c.lineTo(-fl * 1.35, -fl * 0.24); c.lineTo(-fl * 1.35, fl * 0.24); c.closePath(); c.fill();
    if (day > 0.3) { c.fillStyle = `rgba(255,255,255,${(0.7 * day).toFixed(3)})`; c.beginPath(); c.ellipse(fl * 0.1, -fl * 0.08, fl * 0.4, fl * 0.07, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  // the splash: a few droplets as it goes in + comes out
  for (const [t0, k] of [[0, 1], [len, 1.3]]) {
    const u = (T - t0) / 0.45; if (u <= 0 || u >= 1) continue;
    c.fillStyle = `rgba(236,244,255,${((1 - u) * 0.8).toFixed(3)})`;
    for (let q = 0; q < 5; q++) { const a = PI * (0.15 + q * 0.175), d = u * 0.45 * s * k; c.beginPath(); c.arc(cx + j.dir * (t0 ? 0.45 : -0.45) * s + Math.cos(a) * d, wy - Math.sin(a) * d * 1.3 + u * u * 0.4 * s, Math.max(0.3, 0.05 * s), 0, TAU); c.fill(); }
  }
  c.restore();
}
/** a firefly's glow (x, y on screen, k 0..1): a tiny hot core + a soft yellow-green halo (additive) */
export function drawFirefly(c, x, y, k, s, sprite) {
  if (k < 0.02) return;
  const r = Math.max(3, 0.46 * s);
  c.globalAlpha = Math.min(1, k); c.drawImage(sprite, x - r, y - r, r * 2, r * 2);
}
export function fireflySprite() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = safeCtx(cv); if (!x) return cv;
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,220,1)'); g.addColorStop(0.12, 'rgba(232,255,140,0.95)'); g.addColorStop(0.35, 'rgba(190,255,90,0.32)'); g.addColorStop(1, 'rgba(160,255,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return cv;
}
