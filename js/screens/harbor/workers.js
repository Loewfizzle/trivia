// CITY 2.0 — THE HARBOR, PART 8b1: THE WORKERS' PROPS, drawn (their states on the clock: core/harbor-crew.js — the people themselves
// are folk.js figures in people.js's passes). Each prop is an ITEM at its own depth in people.js's sorted pass, so a man on the ladder
// stands in front of it, the platform's front rail in front of the washers' legs, the bottles on the step behind a passer-by:
//   the TALL LADDER against the blade's edge + the STEPLADDER at a lamp · the window washers' HANGING PLATFORM (its ropes to the
//   davits on the parapet, the deck, the front rail) · the NEWSSTAND (unfolding, papers fanned) · the BUNDLES waiting · the MILK
//   BOTTLES on the barbershop's step · the bootleggers' CELLAR HATCH (two steel leaves up, the glow from below) · the painters' DROP
//   CLOTH · the sweeper's WET STREAK drying on the cobbles
// + the two OVERLAYS: THE BILLPOSTER's sheets (the new poster pasted sheet by sheet over the old one) and THE BLADE's REPAINT (the old
//   name painted out bottom → top, the new one chalked, lettered, gilded) — drawn by the scene right after the board / the blade.
// Lit like the people: by day the sun's colour, at night a dark shape taking the lamps' light where it stands.
import { project } from '../../core/harbor-layout.js';
import { FOLK } from '../../core/harbor-people.js';
import { platformAt, WET, SHEETS } from '../../core/harbor-workers.js';
import { rgb, mix } from './shapes.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { bladeGeo, paintBlade, BLADE, bladeLetters } from './speakeasy-blade.js';
import { speakGeo, mats, wallMap } from './speakeasy-geo.js';
import { LADDER, KIT } from '../../core/harbor-crew.js';
import { kitBucket, kitRoll } from './gear.js';
import { rngFrom } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const NIGHT = [18, 16, 28];
/** a colour in the scene's light at (x, z): by day itself (warmer at golden hour), at night a silhouette lifted by the lamps there */
function litAt(env, col, x, z, k = 1) {
  const T = env.T || { day: 1 }, dark = Math.max(clamp01(env.dark || 0), clamp01(T.night || 0));
  let c = col;
  if (T.gold) c = mix(c, [c[0] * 1.08 + 10, c[1] * 0.95, c[2] * 0.82], T.gold * 0.5);
  if (dark > 0.01) { c = mix(c, NIGHT, 0.84 * dark); const lt = env.lightAt ? env.lightAt(x, z) : null; if (lt) { const q = Math.min(1, 160 / Math.max(1, ...lt)); c = c.map((v, i) => v + lt[i] * q * 0.14 * k * clamp01(env.dark || 0)); } }
  return c.map(v => Math.min(255, v));
}
const WOOD = [150, 118, 78], WOOD_D = [104, 80, 52], STEEL = [70, 72, 80], ZINC = [156, 160, 166];
const sm = u => { const x = clamp01(u); return x * x * (3 - 2 * x); };

/** the props as depth ITEMS for a pass: crew = folkAt(t).crew, pass 'near' | 'far' → [{ z, draw(c, env) }] (z: the depth people.js sorts
 *  by; ground marks get a huge z so they draw first, under everyone) */
export function propItems(L, crew, pass, t) {
  if (!crew || pass !== 'near') return [];
  const out = [], cam = L.cam, s = L.speakeasy, tr = crew.traces || {};
  for (const p of crew.props || []) {
    if (p.mark) continue;                                   // (8b2: 'ladder' / 'steps' — only the moment it stands: the clank, the E2E)
    // 8b2 — THE LADDERS, ONE OBJECT FROM EDGE TO EDGE (core/harbor-crew.js#tallLadder / PLAN.lamp: their state on the clock)
    if (p.kind === 'xladder') { const st = p.at(t); if (st) out.push({ z: st.z, draw: (c, env) => extLadder(c, cam, p, st, env, t) }); }
    else if (p.kind === 'xsteps') { const st = p.at(t); if (st) out.push({ z: st.z + 0.02, draw: (c, env) => steps(c, cam, p, st, env) }); }
    else if (p.kind === 'kit') out.push({ z: p.z, draw: (c, env) => kitDown(c, cam, p, env) });
    else if (p.kind === 'ladder') out.push({ z: p.foot.z, draw: (c, env) => tallLadder(c, cam, p, env, t) });
    else if (p.kind === 'steps') out.push({ z: p.foot.z + 0.05, draw: (c, env) => stepLadder(c, cam, p, env, t) });
    else if (p.kind === 'stand') { out.push({ z: p.z, draw: (c, env) => newsstand(c, cam, p, env, t) }); const b = p.bundles; if (b && t >= b.untie && t < p.fold) { const k = 1 - clamp01((t - b.untie) / Math.max(1, p.fold - 6 - b.untie)); if (k > 0.02) out.push({ z: b.z, draw: (c, env) => bundles(c, cam, b, env, k) }); } }
    else if (p.kind === 'cloth') { out.push({ z: 1e3, draw: (c, env) => cloth(c, cam, p, env, t) }); if (p.un) out.push({ z: p.z - 0.15, draw: (c, env) => clothBucket(c, cam, p, env) }); }
    else if (p.kind === 'wet') out.push({ z: 1e3 + 1, draw: (c, env) => wetStreak(c, cam, p, env, t) });
    else if (p.kind === 'leafpile') { const k = leafK(p, t); if (k > 0.01) out.push({ z: p.z, draw: (c, env) => leafPile(c, cam, p, k, env) }); }
    else if (p.kind === 'hatch') { out.push({ z: 1e3 + 2, draw: (c, env) => hatchHole(c, cam, p, env, t) }, { z: p.z + 0.4, draw: (c, env) => hatchLeaves(c, cam, p, env, t) }); }
    else if (p.kind === 'platform') { out.push({ z: p.z + 0.25, draw: (c, env) => platform(c, cam, s, p, env, t, 'back') }, { z: p.z - 0.4, draw: (c, env) => platform(c, cam, s, p, env, t, 'front') }); }
  }
  // THE TRACES (core/harbor-crew.js#tracesAt): the milk on the step, the bundles at the vendor spot
  if (tr.milk && crew.spots) { const st = crew.spots.step; out.push({ z: st.z, draw: (c, env) => bottles(c, cam, st, env) }); }
  if (tr.bundles && crew.spots) { const v = crew.spots.bundles || { x: crew.spots.vendor.x - 0.9, z: crew.spots.vendor.z + 0.9 }; out.push({ z: v.z, draw: (c, env) => bundles(c, cam, v, env) }); }
  return out;
}

// ---- THE TALL LADDER (leaning against the blade's outer edge — its feet on the promenade, its top at the crest)
function rails(c, a, b, w) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w; return [[a[0] - nx, a[1] - ny], [b[0] - nx * 0.75, b[1] - ny * 0.75], [a[0] + nx, a[1] + ny], [b[0] + nx * 0.75, b[1] + ny * 0.75]]; }
function tallLadder(c, cam, p, env, t) {
  const k = clamp01((t - p.t0) / 2.2) * clamp01((p.t1 - t) / 2.2);    // (raised over ~2 s from the man's lift, lowered the same)
  if (k <= 0) return;
  const f = project(cam, p.foot.x, 0, p.foot.z), topW = project(cam, p.top.x, p.top.y, p.top.z);
  // (raising: the top swings up from lying along the ground toward the wall)
  const lie = project(cam, p.foot.x - (p.top.y) * 0.9, 0.15, p.foot.z), tp = [lie[0] + (topW[0] - lie[0]) * k, lie[1] + (topW[1] - lie[1]) * k];
  const sp = cam.F / p.foot.z, w = 0.24 * sp, [a0, a1, b0, b1] = rails(c, f, tp, w);
  const col = rgb(litAt(env, WOOD, p.foot.x, p.foot.z)), hi = rgb(litAt(env, [206, 176, 128], p.foot.x, p.foot.z));
  c.save(); c.lineCap = 'round';
  // its shadow on the wall + the cobbles by day (a soft dark line beside it)
  const T = env.T || {};
  if ((T.day || 0) + (T.gold || 0) > 0.2) { c.strokeStyle = 'rgba(20,14,30,0.22)'; c.lineWidth = Math.max(1, 0.14 * sp); c.beginPath(); c.moveTo(f[0] + 0.25 * sp, f[1]); c.lineTo(tp[0] + 0.5 * sp, tp[1] + 0.4 * sp); c.stroke(); }
  c.strokeStyle = col; c.lineWidth = Math.max(0.6, 0.075 * sp);
  c.beginPath(); c.moveTo(...a0); c.lineTo(...a1); c.moveTo(...b0); c.lineTo(...b1); c.stroke();
  c.lineWidth = Math.max(0.45, 0.05 * sp); c.beginPath();
  const n = Math.max(4, Math.round(p.top.y / 0.32));
  for (let i = 1; i < n; i++) { const u = i / n; c.moveTo(a0[0] + (a1[0] - a0[0]) * u, a0[1] + (a1[1] - a0[1]) * u); c.lineTo(b0[0] + (b1[0] - b0[0]) * u, b0[1] + (b1[1] - b0[1]) * u); }
  c.stroke();
  c.strokeStyle = hi; c.lineWidth = Math.max(0.3, 0.025 * sp); c.beginPath(); c.moveTo(...b0); c.lineTo(...b1); c.stroke();
  c.fillStyle = 'rgba(8,6,16,0.35)'; c.beginPath(); c.ellipse(f[0], f[1], w * 1.6, Math.max(0.6, 0.07 * sp), 0, 0, TAU); c.fill();
  c.restore();
}
// ---- 8b2 — THE EXTENSION LADDER (the painters', the repairmen's): ONE object from the edge of the screen to the edge — carried on edge on
// two shoulders, set down, its top walked up to upright, the FLY run up its rope, tipped onto the blade; back down, carried off. st: its
// state (core/harbor-crew.js#ladderAt: x, y — the lower rail's foot (the pivot), th, e — the fly run up, z). Bold rails that read at 402
// pt (a dark edge + a lit edge), rungs at the pitch the climber steps, the fly a little narrower + in front, its rope; the painters'
// kit hung on it while it travels.
function railPair(c, A0, A1, B0, B1, lw, col, lo, hi) {
  c.lineCap = 'butt';
  c.strokeStyle = lo; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(A0[0], A0[1] + lw * 0.35); c.lineTo(A1[0], A1[1] + lw * 0.35); c.moveTo(B0[0], B0[1] + lw * 0.35); c.lineTo(B1[0], B1[1] + lw * 0.35); c.stroke();
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(...A0); c.lineTo(...A1); c.moveTo(...B0); c.lineTo(...B1); c.stroke();
  c.strokeStyle = hi; c.lineWidth = Math.max(0.3, lw * 0.35); c.beginPath(); c.moveTo(A0[0], A0[1] - lw * 0.3); c.lineTo(A1[0], A1[1] - lw * 0.3); c.moveTo(B0[0], B0[1] - lw * 0.3); c.lineTo(B1[0], B1[1] - lw * 0.3); c.stroke();
}
function extLadder(c, cam, p, st, env, t) {
  const W = p.w, ct = Math.cos(st.th), sn = Math.sin(st.th), nx = -sn, ny = ct, z = st.z, len = p.len;
  const cx = st.x + nx * W / 2, cy = st.y + ny * W / 2;                       // (the centreline's foot)
  const P3 = (d, o, dz = 0) => project(cam, cx + ct * d + nx * o, cy + sn * d + ny * o, z + dz), sp = cam.F / z;
  const lit = (col, k) => rgb(litAt(env, col, cx, z, k)), col = lit(WOOD), lo = lit(WOOD.map(v => v * 0.5)), hi = lit([222, 196, 150], 1.2);
  const lw = Math.max(0.75, 0.07 * sp), rw = Math.max(0.5, 0.045 * sp), T = env.T || {};
  c.save();
  // the shadows: lying, a soft band along the cobbles under it; standing, its contact + (by day) the cast line beside it
  const day = (T.day || 0) + (T.gold || 0) > 0.2, lowY = Math.min(st.y, cy + sn * len);
  if (st.th < 0.5 && st.y < 0.6) { const a = project(cam, cx, 0, z), b = project(cam, cx + ct * len, 0, z); c.strokeStyle = `rgba(8,6,16,${(0.28 * (1 - st.y / 0.6)).toFixed(3)})`; c.lineWidth = Math.max(1, 0.16 * sp); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  else if (lowY < 0.3) { const f0 = project(cam, cx, 0, z); c.fillStyle = 'rgba(8,6,16,0.35)'; c.beginPath(); c.ellipse(f0[0], f0[1], W * 0.9 * sp, Math.max(0.6, 0.07 * sp), 0, 0, TAU); c.fill(); if (day && st.th > 1.2) { const tp = P3(len + st.e, 0); c.strokeStyle = 'rgba(20,14,30,0.2)'; c.lineWidth = Math.max(1, 0.12 * sp); c.beginPath(); c.moveTo(f0[0] + 0.25 * sp, f0[1]); c.lineTo(tp[0] + 0.5 * sp, tp[1] + 0.4 * sp); c.stroke(); } }
  // the BASE section: its rails + rungs
  c.strokeStyle = col; c.lineWidth = rw; c.beginPath();
  for (let d = 0.28; d < len - 0.08; d += LADDER.pitch) { const a = P3(d, -W / 2), b = P3(d, W / 2); c.moveTo(...a); c.lineTo(...b); }
  c.stroke();
  railPair(c, P3(0, -W / 2), P3(len, -W / 2), P3(0, W / 2), P3(len, W / 2), lw, col, lo, hi);
  // the FLY (nested in front of it; run up its rope): its rails + rungs, the pulley at the base's top, the rope
  const wf = p.wf, e = st.e, dz = -0.05;
  c.strokeStyle = col; c.lineWidth = rw; c.beginPath();
  for (let d = 0.12; d < len - 0.1; d += LADDER.pitch) { const a = P3(e + d, -wf / 2, dz), b = P3(e + d, wf / 2, dz); c.moveTo(...a); c.lineTo(...b); }
  c.stroke();
  railPair(c, P3(e, -wf / 2, dz), P3(e + len, -wf / 2, dz), P3(e, wf / 2, dz), P3(e + len, wf / 2, dz), lw * 0.9, col, lo, hi);
  const rope = rgb(litAt(env, [206, 192, 156], cx, z, 1.1)), pul = P3(len - 0.12, 0, dz * 2), rb = P3(e + 0.15, 0.02, dz * 2), rf = P3(Math.min(len - 0.3, 1.1), -0.05, dz * 2);
  c.strokeStyle = rope; c.lineWidth = Math.max(0.4, 0.022 * sp); c.beginPath(); c.moveTo(...rb); c.lineTo(...pul); c.lineTo(...rf); c.stroke();
  c.fillStyle = rgb(litAt(env, STEEL, cx, z)); c.beginPath(); c.arc(pul[0], pul[1], Math.max(0.5, 0.06 * sp), 0, TAU); c.fill();
  // the painters' KIT hung on it as it travels (the bucket from the lower rail — down on the cobbles once the ladder is; the roll tied in)
  if (p.kit && p.kit.some(([a, b]) => t >= a && t < b)) {
    const H = 2.1 * sp, f = (cc, k) => rgb(litAt(env, cc, cx, z, k)), dK = p.kd;
    const rail = [cx + ct * dK + nx * -W / 2, cy + sn * dK + ny * -W / 2], by = Math.max(rail[1], 0.105 * 2.1 + 0.005), [bx, byS] = project(cam, rail[0], by, z - 0.08);
    if (by > rail[1] + 0.01) { const [hx, hy] = project(cam, rail[0], rail[1], z - 0.08); c.strokeStyle = f(ZINC.map(v => v * 0.6)); c.lineWidth = Math.max(0.35, 0.015 * sp); c.beginPath(); c.moveTo(hx, hy); c.lineTo(bx, byS); c.stroke(); }
    kitBucket(c, f, bx, byS, H);
    const [rx, ry] = P3(dK + 0.85, 0, -0.03); kitRoll(c, f, rx, ry, H, 1);
  }
  c.restore();
}
// ---- 8b2 — THE STEPLADDER as ONE object (the lampman's: core/harbor-crew.js#PLAN.lamp): st = { fb (the front legs' foot), bb (the back
// legs'), tp (the top), n (the front legs' width across), z } — carried on edge on the shoulder, swung down, stood up, spread, folded
function steps(c, cam, p, st, env) {
  const z = st.z, sp = cam.F / z, ws = p.ws, n = st.n, P = (q, o = 0, dz = 0) => project(cam, q.x + n[0] * o, q.y + n[1] * o, q.z + n[2] * o + dz);
  const lit = (col, k) => rgb(litAt(env, col, st.tp.x, z, k)), col = lit(WOOD), lo = lit(WOOD.map(v => v * 0.5)), hi = lit([222, 196, 150], 1.2), dark = lit(WOOD_D);
  const lw = Math.max(0.7, 0.065 * sp), L = Math.hypot(st.tp.x - st.fb.x, st.tp.y - st.fb.y, st.tp.z - st.fb.z) || 1;
  c.save(); c.lineCap = 'round';
  const spread = Math.hypot(st.bb.x - st.fb.x, st.bb.z - st.fb.z);
  // its contact shadow (standing on the cobbles)
  if (st.fb.y < 0.05) { const a = project(cam, (st.fb.x + st.bb.x) / 2, 0, z); c.fillStyle = 'rgba(8,6,16,0.32)'; c.beginPath(); c.ellipse(a[0], a[1], (spread / 2 + 0.25) * sp, Math.max(0.6, 0.06 * sp), 0, 0, TAU); c.fill(); }
  // the back legs (a plain frame, behind) + the spreader bars
  const bb0 = P(st.bb, 0, 0.06), tp0 = P(st.tp, 0, 0.06);
  c.strokeStyle = dark; c.lineWidth = lw; c.beginPath(); c.moveTo(...bb0); c.lineTo(...tp0); c.stroke();
  if (spread > 0.05) { const u = 0.42, a = project(cam, st.fb.x + (st.tp.x - st.fb.x) * u, st.fb.y + (st.tp.y - st.fb.y) * u, z), b = project(cam, st.bb.x + (st.tp.x - st.bb.x) * u, st.bb.y + (st.tp.y - st.bb.y) * u, z); c.strokeStyle = lit(STEEL); c.lineWidth = Math.max(0.4, 0.025 * sp); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  // the front legs: two rails + the flat treads between them
  c.strokeStyle = col; c.lineWidth = Math.max(0.5, 0.05 * sp); c.beginPath();
  for (let u = 0.2; u < 0.92; u += 0.23) { const q = { x: st.fb.x + (st.tp.x - st.fb.x) * u, y: st.fb.y + (st.tp.y - st.fb.y) * u, z: st.fb.z + (st.tp.z - st.fb.z) * u }; const a = P(q, -ws / 2), b = P(q, ws / 2); c.moveTo(...a); c.lineTo(...b); }
  c.stroke();
  railPair(c, P(st.fb, -ws / 2), P(st.tp, -ws / 2), P(st.fb, ws / 2), P(st.tp, ws / 2), lw, col, lo, hi);
  // the top cap (across its top: level when it stands)
  const ax = (st.tp.x - st.fb.x) / L, ay = (st.tp.y - st.fb.y) / L, az = (st.tp.z - st.fb.z) / L, cp = q => project(cam, st.tp.x + ax * q[0] + n[0] * q[1], st.tp.y + ay * q[0] + n[1] * q[1], st.tp.z + az * q[0] + n[2] * q[1]);
  const q4 = [[0.0, -0.2], [0.0, 0.2], [0.07, 0.2], [0.07, -0.2]].map(cp);
  c.fillStyle = col; c.beginPath(); q4.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.fill();
  c.restore();
}
// ---- the painters' drop cloth's BUCKET (on the cloth while it's spread) + THE KIT set down on the cobbles by the ladder (the takedown)
function clothBucket(c, cam, p, env) {
  const x = p.x + KIT.cloth[1] - 0.45, z = p.z - 0.15, sp = cam.F / z, H = 2.1 * sp, [bx, by] = project(cam, x, 0.105 * 2.1, z);
  c.save(); c.fillStyle = 'rgba(8,6,16,0.3)'; const g = project(cam, x, 0, z); c.beginPath(); c.ellipse(g[0], g[1], 0.2 * sp, Math.max(0.5, 0.05 * sp), 0, 0, TAU); c.fill();
  kitBucket(c, (cc, k) => rgb(litAt(env, cc, x, z, k)), bx, by, H); c.restore();
}
function kitDown(c, cam, p, env) {
  const sp = cam.F / p.z, H = 2.1 * sp, f = (cc, k) => rgb(litAt(env, cc, p.x, p.z, k)), [bx, by] = project(cam, p.x - 0.15, 0.105 * 2.1, p.z), [rx, ry] = project(cam, p.x + 0.32, 0.032 * 2.1, p.z + 0.05), g = project(cam, p.x, 0, p.z);
  c.save(); c.fillStyle = 'rgba(8,6,16,0.3)'; c.beginPath(); c.ellipse(g[0], g[1], 0.45 * sp, Math.max(0.5, 0.05 * sp), 0, 0, TAU); c.fill();
  kitRoll(c, f, rx, ry, H, 1); kitBucket(c, f, bx, by, H); c.restore();
}
// ---- THE STEPLADDER (an A-frame beside the lamp)
function stepLadder(c, cam, p, env, t) {
  const k = clamp01((t - p.t0) / 1.4) * clamp01((p.t1 - t) / 1.4);
  if (k <= 0) return;
  const sp = cam.F / p.foot.z, h = p.top.y * k, col = rgb(litAt(env, WOOD, p.foot.x, p.foot.z));
  const fl = project(cam, p.foot.x - 0.42, 0, p.foot.z), fr = project(cam, p.foot.x + 0.42, 0, p.foot.z), tp = project(cam, p.foot.x, h + 0.15, p.foot.z);
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = Math.max(0.6, 0.07 * sp);
  c.beginPath(); c.moveTo(...fl); c.lineTo(...tp); c.moveTo(...fr); c.lineTo(...tp); c.stroke();
  c.lineWidth = Math.max(0.45, 0.05 * sp); c.beginPath();
  for (let u = 0.25; u < 0.95; u += 0.24) { c.moveTo(fl[0] + (tp[0] - fl[0]) * u, fl[1] + (tp[1] - fl[1]) * u); c.lineTo(fr[0] + (tp[0] - fr[0]) * u, fr[1] + (tp[1] - fr[1]) * u); }
  c.stroke(); c.fillStyle = col; c.fillRect(tp[0] - 0.3 * sp, tp[1] - 0.04 * sp, 0.6 * sp, Math.max(0.8, 0.09 * sp));
  c.restore();
}
// ---- THE NEWSSTAND (the newsboy's folding rack: two legs, a slanted board of papers fanned out, a cash tin) — it unfolds as he sets it up
function newsstand(c, cam, p, env, t) {
  // (8b2: set down FOLDED from under the newsboy's arm, opened out from `open` (the legs splaying, the board widening), folded from
  // `fold`, picked up — the old fallback grew it out of the cobbles)
  const ko = p.open != null ? sm((t - p.open) / (p.unfold || 4)) * (1 - sm((t - p.fold) / 3)) : clamp01((t - p.t0) / (p.unfold || 4)) * clamp01((p.t1 - t) / 3);
  if (p.open == null && ko <= 0.02) return;
  const k = p.open != null ? 1 : ko, sp = cam.F / p.z, [x, y] = project(cam, p.x, 0, p.z), h = 1.25 * sp * k, w = 1.3 * sp * (p.open != null ? 0.16 + 0.84 * ko : 1), wood = litAt(env, WOOD, p.x, p.z), paper = litAt(env, [232, 226, 206], p.x, p.z, 1.3), ink = litAt(env, [70, 66, 66], p.x, p.z);
  c.save();
  c.fillStyle = 'rgba(8,6,16,0.32)'; c.beginPath(); c.ellipse(x, y, w * 0.6, Math.max(0.6, 0.09 * sp), 0, 0, TAU); c.fill();
  c.strokeStyle = rgb(mix(wood, [0, 0, 0], 0.25)); c.lineWidth = Math.max(0.6, 0.07 * sp);
  c.beginPath(); c.moveTo(x - w * 0.42, y); c.lineTo(x - w * 0.3, y - h); c.moveTo(x + w * 0.42, y); c.lineTo(x + w * 0.3, y - h); c.stroke();
  // the slanted board + its papers in three rows (each a cream sheet, a black masthead line, a grey column)
  c.fillStyle = rgb(wood); c.beginPath(); c.moveTo(x - w * 0.5, y - h * 0.42); c.lineTo(x + w * 0.5, y - h * 0.42); c.lineTo(x + w * 0.42, y - h); c.lineTo(x - w * 0.42, y - h); c.closePath(); c.fill();
  if (ko > 0.6) for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const px = x - w * 0.36 + i * w * 0.25, py = y - h * (0.95 - row * 0.28), pw = w * 0.22, ph = h * 0.25;
    c.fillStyle = rgb(paper); c.fillRect(px, py, pw, ph); c.fillStyle = rgb(ink); c.fillRect(px + pw * 0.08, py + ph * 0.1, pw * 0.84, Math.max(0.5, ph * 0.16));
    c.fillStyle = rgb(mix(paper, ink, 0.35)); c.fillRect(px + pw * 0.08, py + ph * 0.42, pw * 0.38, ph * 0.44); c.fillRect(px + pw * 0.54, py + ph * 0.42, pw * 0.38, ph * 0.44);
  }
  // the bundles stacked at its foot + the cash tin (the old fallback only — 8b2: a stand set down + opened has none; the morning's
  // twine-tied bundles stand at its foot apart: p.bundles)
  if (p.open == null) { c.fillStyle = rgb(mix(paper, wood, 0.15)); c.fillRect(x + w * 0.5, y - 0.35 * sp, 0.55 * sp, 0.35 * sp); c.fillStyle = rgb([120, 84, 50].map((v, i) => wood[i] * 0.4 + v * 0.6)); c.fillRect(x + w * 0.5, y - 0.2 * sp, 0.55 * sp, Math.max(0.4, 0.04 * sp)); }
  c.restore();
}
// ---- THE BUNDLES waiting (two twine-tied stacks), THE MILK on the step (a wire carrier of four white bottles)
function bundles(c, cam, p, env, left = 1) {
  // (left: what's still there — the newsboy's morning sells them down: 8b2)
  const sp = cam.F / p.z, [x, y] = project(cam, p.x, 0, p.z), paper = litAt(env, [226, 220, 200], p.x, p.z, 1.2), twine = litAt(env, [120, 84, 50], p.x, p.z);
  c.save(); c.fillStyle = 'rgba(8,6,16,0.3)'; c.beginPath(); c.ellipse(x + 0.3 * sp, y, 0.75 * sp, Math.max(0.5, 0.08 * sp), 0, 0, TAU); c.fill();
  for (const [dx, h0] of [[-0.05, 0.42], [0.62, 0.3]]) { const h = h0 * left; if (h < 0.03) continue; c.fillStyle = rgb(paper); c.fillRect(x + dx * sp - 0.28 * sp, y - h * sp, 0.56 * sp, h * sp); c.fillStyle = rgb(mix(paper, [0, 0, 0], 0.2)); for (let v = 0.1; v < h; v += 0.08) c.fillRect(x + dx * sp - 0.28 * sp, y - v * sp, 0.56 * sp, Math.max(0.3, 0.012 * sp)); c.strokeStyle = rgb(twine); c.lineWidth = Math.max(0.4, 0.03 * sp); c.beginPath(); c.moveTo(x + dx * sp, y); c.lineTo(x + dx * sp, y - h * sp); c.moveTo(x + dx * sp - 0.28 * sp, y - h * 0.5 * sp); c.lineTo(x + dx * sp + 0.28 * sp, y - h * 0.5 * sp); c.stroke(); }
  c.restore();
}
function bottles(c, cam, p, env) {
  const sp = cam.F / p.z, [x, y] = project(cam, p.x, 0.0, p.z), glass = litAt(env, [238, 242, 240], p.x, p.z, 1.4), wire = litAt(env, [70, 70, 78], p.x, p.z);
  c.save(); c.fillStyle = 'rgba(8,6,16,0.3)'; c.beginPath(); c.ellipse(x, y, 0.32 * sp, Math.max(0.4, 0.05 * sp), 0, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) { const bx = x - 0.21 * sp + i * 0.14 * sp; c.fillStyle = rgb(glass); c.beginPath(); c.roundRect(bx - 0.05 * sp, y - 0.36 * sp, 0.1 * sp, 0.36 * sp, 0.03 * sp); c.fill(); c.fillStyle = rgb(mix(glass, [190, 190, 196], 0.5)); c.fillRect(bx - 0.04 * sp, y - 0.4 * sp, 0.08 * sp, 0.05 * sp); }
  c.strokeStyle = rgb(wire); c.lineWidth = Math.max(0.35, 0.025 * sp); c.strokeRect(x - 0.3 * sp, y - 0.22 * sp, 0.6 * sp, 0.22 * sp); c.beginPath(); c.moveTo(x - 0.3 * sp, y - 0.22 * sp); c.quadraticCurveTo(x, y - 0.62 * sp, x + 0.3 * sp, y - 0.22 * sp); c.stroke();
  c.restore();
}
// ---- THE DROP CLOTH under the blade, THE WET STREAK drying
function cloth(c, cam, p, env, t) {
  // 8b2: never faded in — UNROLLED from the painter's feet (8b2's kit: core/harbor-crew.js#KIT), its roll travelling away along the
  // cobbles; ROLLED UP toward him at the end (p.un s each way). (A cloth without p.un: the old fade.)
  const k = p.un ? Math.min(sm((t - p.t0) / p.un), sm((p.t1 - t) / p.un)) : clamp01((t - p.t0) / 3) * clamp01((p.t1 - t) / 3); if (k <= 0) return;
  const R = [[1.3, -0.8], [1.5, 0.6]], Lf = [[-1.2, -0.7], [-1.0, 0.75]], at = i => [R[i][0] + (Lf[i][0] - R[i][0]) * k, R[i][1] + (Lf[i][1] - R[i][1]) * k];
  const quad = p.un ? [at(0), R[0], R[1], at(1)] : [Lf[0], R[0], R[1], Lf[1]];
  const pts = quad.map(([dx, dz]) => project(cam, p.x + dx, 0.01, p.z + dz));
  c.save(); if (!p.un) c.globalAlpha *= k;
  c.fillStyle = rgb(litAt(env, [218, 210, 192], p.x, p.z)); c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.fill();
  c.fillStyle = rgb(litAt(env, [150, 120, 100], p.x, p.z), 0.5); for (let i = 0; i < 6; i++) { const x = p.x - 0.8 + i * 0.4; if (p.un && x < p.x + at(0)[0]) continue; const q = project(cam, x, 0.01, p.z - 0.2 + (i % 3) * 0.25); c.fillRect(q[0], q[1], 1.2, 0.8); }
  if (p.un && k < 0.995) {
    // the roll at its leading edge (fatter the more is still rolled)
    const a = at(0), b = at(1), r = 0.05 + 0.07 * (1 - k), sp = cam.F / p.z, A = project(cam, p.x + a[0], r, p.z + a[1]), B = project(cam, p.x + b[0], r, p.z + b[1]);
    c.lineCap = 'round'; c.strokeStyle = rgb(litAt(env, [176, 166, 146], p.x, p.z)); c.lineWidth = Math.max(1, 2 * r * sp); c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke();
    c.strokeStyle = rgb(litAt(env, [226, 218, 198], p.x, p.z, 1.1)); c.lineWidth = Math.max(0.5, r * sp); c.beginPath(); c.moveTo(A[0], A[1] - r * sp * 0.4); c.lineTo(B[0], B[1] - r * sp * 0.4); c.stroke();
  }
  c.restore();
}

// 11a-2 — THE RAKER's LEAF PILES (core/harbor-crew.js#PLAN.raker): a mound of fallen leaves growing as he rakes, shrinking into his sack
const leafK = (p, t) => clamp01((t - p.grow[0]) / Math.max(1, p.grow[1] - p.grow[0])) * (p.gone ? 1 - clamp01((t - p.gone[0]) / Math.max(1, p.gone[1] - p.gone[0])) : 1);
const LEAF_COLS = [[214, 96, 30], [232, 150, 40], [176, 60, 34], [196, 122, 46], [150, 84, 40], [236, 176, 70]];
function leafPile(c, cam, p, k, env) {
  const [x, y] = project(cam, p.x, 0, p.z), s = cam.F / p.z, w = 1.05 * s * Math.sqrt(k), h = 0.42 * s * k, r = rngFrom(p.seed);
  const dk = clamp01(env.dark || 0), T = env.T || {}, night = Math.max(dk, T.night || 0), lit = col => col.map(v => v * (1 - 0.68 * night) + 14 * night);
  c.save();
  c.fillStyle = `rgba(20,14,10,${(0.32 * Math.min(1, k * 2)).toFixed(3)})`; c.beginPath(); c.ellipse(x, y, w * 1.05, w * 0.22, 0, 0, Math.PI * 2); c.fill();
  // the mound: leaves laid from the outside in + the bottom up (its top lighter: the sky on it), each a small tilted ellipse
  const n = Math.round(26 + 70 * k);
  for (let i = 0; i < n; i++) {
    const u = r(), a = r() * Math.PI * 2, rr = Math.sqrt(r()), lx = x + Math.cos(a) * w * rr, top = h * (1 - rr * rr), ly = y - top * (0.4 + 0.6 * u) + Math.sin(a) * w * 0.18 * rr;
    const col = LEAF_COLS[Math.floor(r() * LEAF_COLS.length)].map(v => v * (0.8 + 0.3 * (1 - rr)));
    c.fillStyle = `rgb(${lit(col).map(v => Math.round(Math.min(255, v))).join(',')})`;
    c.beginPath(); c.ellipse(lx, ly, Math.max(0.6, 0.075 * s), Math.max(0.4, 0.045 * s), r() * Math.PI, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
function wetStreak(c, cam, p, env, t) {
  // the sweeper's cart sprinkles as he goes: a dark damp band along his passes, laid down behind him, drying out from its edges (WET.dry)
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.pts[i - 1], b = p.pts[i]; if (Math.abs(a.z - b.z) > 0.01) continue;
    const t0 = Math.min(a.t, b.t); if (t < t0) continue;
    const u = clamp01((t - Math.max(a.t, b.t)) / WET.dry), alpha = 0.26 * (1 - u) * (1 - u); if (alpha < 0.01) continue;
    // (only as far as he has swept along this stretch)
    const f = clamp01((t - a.t) / Math.max(0.01, b.t - a.t)), ex = a.x + (b.x - a.x) * f;
    const A = project(cam, a.x, 0.005, a.z), B = project(cam, ex, 0.005, a.z), sp = cam.F / a.z;
    c.strokeStyle = `rgba(26,28,40,${alpha.toFixed(3)})`; c.lineWidth = Math.max(1, 0.9 * sp * (1 - 0.35 * u)); c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke();
    if ((env.T && (env.T.day || 0) > 0.3)) { c.strokeStyle = `rgba(220,230,246,${(alpha * 0.35).toFixed(3)})`; c.lineWidth = Math.max(0.5, 0.2 * sp); c.beginPath(); c.moveTo(A[0], A[1] - 0.2 * sp); c.lineTo(B[0], B[1] - 0.2 * sp); c.stroke(); }
  }
  c.restore();
}
// ---- THE CELLAR HATCH (the bootleggers): two steel leaves swung up from the pavement, a dim amber glow from the cellar below
function hatchK(p, t) { return clamp01((t - p.t0) / (p.open || 1.2)) * clamp01((p.t1 - t) / (p.open || 1.2)); }
function hatchHole(c, cam, p, env, t) {
  const k = hatchK(p, t); if (k <= 0) return;
  const q = [[-0.62, -0.42], [0.62, -0.42], [0.62, 0.42], [-0.62, 0.42]].map(([dx, dz]) => project(cam, p.x + dx * k, 0.01, p.z + dz));
  c.save(); c.fillStyle = 'rgb(8,6,10)'; c.beginPath(); q.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v))); c.closePath(); c.fill();
  const [cx, cy] = project(cam, p.x, 0.01, p.z), sp = cam.F / p.z, g = c.createRadialGradient(cx, cy, 0, cx, cy, 0.8 * sp);
  g.addColorStop(0, `rgba(230,140,60,${(0.55 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(230,140,60,0)');
  c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(cx - 0.8 * sp, cy - 0.5 * sp, 1.6 * sp, 0.8 * sp);
  c.restore();
}
function hatchLeaves(c, cam, p, env, t) {
  const k = hatchK(p, t); if (k <= 0) return;
  const col = rgb(litAt(env, [78, 80, 86], p.x, p.z)), edge = rgb(litAt(env, [150, 152, 160], p.x, p.z, 1.3));
  c.save();
  for (const sg of [-1, 1]) {
    // each leaf hinged at its outer edge, swung up by k (0 flat → 1 standing)
    const hx = p.x + sg * 0.62, a = k * Math.PI / 2, w = 0.62, tip = { x: hx - sg * w * Math.cos(a), y: w * Math.sin(a) };
    const pts = [project(cam, hx, 0.02, p.z - 0.42), project(cam, tip.x, tip.y, p.z - 0.42), project(cam, tip.x, tip.y, p.z + 0.42), project(cam, hx, 0.02, p.z + 0.42)];
    c.fillStyle = col; c.beginPath(); pts.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v))); c.closePath(); c.fill();
    c.strokeStyle = edge; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...pts[1]); c.lineTo(...pts[2]); c.stroke();
  }
  c.restore();
}
// ---- THE WINDOW WASHERS' HANGING PLATFORM: two davits over the parapet, the ropes down to the stirrups, the plank deck, the rails
function platform(c, cam, s, p, env, t, part) {
  const u = t - p.start, st = platformAt(u, p.len, s.rows || [[4.6, 6.8], [7.6, 9.6]]);
  if (t < p.t0 || t > p.t1) return;
  // (8b2 — THE SWING: kw 0 → 1 over p.swing s after p.t0 (the deck up off the roof over the parapet's edge, out, down to its park — the
  // davits turning out with it), 1 → 0 before p.t1; a breath of fade only while it clears the parapet's top)
  const kw = p.swing ? Math.min(sm((t - p.t0) / p.swing), sm((p.t1 - t) / p.swing)) : 1, top = 11.55, lift = kw < 1 ? Math.sin(Math.PI * kw) * 0.5 : 0;
  const y = kw < 1 ? top + 0.25 + (st.y - top - 0.25) * kw + lift : st.y, z = kw < 1 ? s.z0 + 0.12 + (p.z - s.z0 - 0.12) * sm(kw / 0.6) : p.z;
  const x0 = p.x0 + p.u0, x1 = p.x0 + p.u1, sp = cam.F / z, wood = litAt(env, [138, 112, 78], x0, z), steel = litAt(env, STEEL, x0, z), rope = litAt(env, [196, 182, 148], x0, z);
  const P = (x, yy, zz = z) => project(cam, x, yy, zz);
  c.save(); c.lineCap = 'round'; if (kw < 0.12) c.globalAlpha *= kw / 0.12;
  if (part === 'back') {
    // the davits: an iron arm out over the parapet's top at each end, the ropes hanging down to the stirrups
    for (const xx of [x0 + 0.35, x1 - 0.35]) {
      const hang = Math.max(0, y + 1.3 - 11.5), base = P(xx, 11.25, s.z0 + 0.15), out = P(xx, 11.85 + hang, z - 0.05), tipD = P(xx, 11.55 + hang, z - 0.05);   // (8b2: the arms ride up over the deck while it swings over the parapet)
      c.strokeStyle = rgb(steel); c.lineWidth = Math.max(0.7, 0.09 * sp); c.beginPath(); c.moveTo(...base); c.lineTo(...out); c.lineTo(...tipD); c.stroke();
      const top = P(xx, 11.5 + hang, z - 0.05), bot = P(xx, Math.min(11.5 + hang, y + 1.15), z - 0.05);
      c.strokeStyle = rgb(rope); c.lineWidth = Math.max(0.45, 0.035 * sp); c.beginPath(); c.moveTo(...top); c.lineTo(...bot); c.stroke();
      // the stirrup: a steel frame from the deck up to the rope's block
      const s0 = P(xx, y, z), s1 = P(xx, Math.min(11.5 + hang, y + 1.15), z);
      c.strokeStyle = rgb(steel); c.lineWidth = Math.max(0.6, 0.06 * sp); c.beginPath(); c.moveTo(...s0); c.lineTo(...s1); c.stroke();
    }
    // the plank deck (its top edge lit by day) + the buckets on it
    const d0 = P(x0, y, z + 0.25), d1 = P(x1, y, z + 0.25), d2 = P(x1, y, z - 0.25), d3 = P(x0, y, z - 0.25);
    c.fillStyle = rgb(wood); c.beginPath(); for (const q of [d0, d1, d2, d3]) c.lineTo(...q); c.closePath(); c.fill();
    const f0 = P(x0, y, z - 0.25), f1 = P(x1, y - 0.18, z - 0.25);
    c.fillStyle = rgb(mix(wood, [0, 0, 0], 0.3)); c.fillRect(f0[0], f0[1], f1[0] - f0[0], f1[1] - f0[1]);
    for (const xb of [x0 + 1.4, x1 - 2.1]) { const b = P(xb, y, z - 0.05); c.fillStyle = rgb(litAt(env, ZINC, xb, z, 1.1)); c.fillRect(b[0] - 0.14 * sp, b[1] - 0.3 * sp, 0.28 * sp, 0.3 * sp); }
  } else {
    // the front: a toe board + the top rail on its posts (in front of the washers' legs)
    const r0 = P(x0, y + 1.0, z - 0.3), r1 = P(x1, y + 1.0, z - 0.3), m0 = P(x0, y + 0.5, z - 0.3), m1 = P(x1, y + 0.5, z - 0.3);
    c.strokeStyle = rgb(steel); c.lineWidth = Math.max(0.6, 0.06 * sp); c.beginPath(); c.moveTo(...r0); c.lineTo(...r1); c.moveTo(...m0); c.lineTo(...m1);
    for (let xx = x0; xx <= x1 + 0.01; xx += (x1 - x0) / 4) { const a = P(xx, y, z - 0.3), b = P(xx, y + 1.0, z - 0.3); c.moveTo(...a); c.lineTo(...b); }
    c.stroke();
    const t0 = P(x0, y + 0.22, z - 0.3), t1 = P(x1, y, z - 0.3); c.fillStyle = rgb(mix(wood, [0, 0, 0], 0.12)); c.fillRect(t0[0], t0[1], t1[0] - t0[0], t1[1] - t0[1]);
  }
  c.restore();
}

// ------------------------------------------------------------------ THE OVERLAYS
/**
 * THE BILLPOSTER's SHEETS: the new poster pasted over the old one SHEET BY SHEET (SHEETS.cols × rows, the top row first, left → right),
 * each sheet unrolled DOWNWARD as he brushes it on (a damp sheen on the fresh paper fading), the seams between the sheets showing a
 * hair. art: { rect (screen), canvas (the new poster at the board's size, lit like the board now) }; st: tracesAt().board.pasting
 */
export function drawSheets(c, art, st) {
  if (!art || !st) return;
  const R = art.rect, { cols, rows } = SHEETS, sw = R.w / cols, sh = R.h / rows, done = st.sheets.done, k = st.sheets.k, sx = art.canvas.width / R.w, sy = art.canvas.height / R.h;
  c.save();
  for (let i = 0; i <= Math.min(done, cols * rows - 1); i++) {
    const row = Math.floor(i / cols), col = i % cols, f = i < done ? 1 : k;
    if (f <= 0) continue;
    const x = R.x + col * sw, y = R.y + row * sh, h = sh * f;
    c.drawImage(art.canvas, col * sw * sx, row * sh * sy, sw * sx, h * sy, x, y, sw, h);
    // the fresh paste's damp sheen (the sheet in progress, fading over the next one), the seam's hairline
    const wet = i < done ? clamp01(1 - (done - i - (1 - k)) / 1.6) : 1;
    if (wet > 0.02) { c.fillStyle = `rgba(255,255,255,${(0.1 * wet).toFixed(3)})`; c.fillRect(x, y, sw, h); }
    c.fillStyle = 'rgba(20,14,20,0.25)'; c.fillRect(x, y, Math.max(0.4, R.w * 0.003), h); c.fillRect(x, y + h - 0.4, sw, 0.4);
    // the sheet's unrolling edge (the roll's bottom, a cream line) while he brushes it
    if (i === done && f < 1) { c.fillStyle = 'rgba(236,228,206,0.95)'; c.fillRect(x, y + h - Math.max(0.8, sh * 0.05), sw, Math.max(0.8, sh * 0.05)); }
  }
  c.restore();
}
/** the new poster's art at the board's size (re-made when the look changes): the board's own painter + its light (by day the sun's wash;
 *  at night the lamps' light map) — signs.js#buildBillboard's `poster` + `light` */
export function sheetArt(b, T, dpr = 2) {
  if (!b || !b.poster) return null;
  const R = b.rect, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(R.w * dpr)); cv.height = Math.max(1, Math.ceil(R.h * dpr));
  const x = safeCtx(cv); if (!x) return null;
  x.setTransform(dpr, 0, 0, dpr, -R.x * dpr, -R.y * dpr);
  b.poster(x, T.sunDir || 0);
  if (b.light) b.light(x, T);
  return { rect: R, canvas: cv };
}

/**
 * THE BLADE's REPAINT (Monday): over the baked blade (still the old week's name) — 'out': the dark enamel rising bottom → top over the
 * old letters (a ragged wet edge); 'chalk': the new name sketched faintly, top → bottom; 'letters': each letter filled in turn top →
 * bottom (the chalk ghost below the brush); 'gilt': the whole new board with a glint sweeping down it. art: { blank, fresh, rect } (blade
 * art at the screen's size); st: tracesAt().blade
 */
export function bladeArt(L, T, game, dpr = 2) {
  if (!game) return null;
  const G = speakGeo(L), bg = bladeGeo(G), M = mats(T), R = bg.rect, pad = 2, X0 = R.x - pad, Y0 = R.y - pad, W = R.w + pad * 2, H = R.h + pad * 2;
  const mk = gm => { const cv = document.createElement('canvas'); cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr); const x = safeCtx(cv); if (!x) return cv; x.setTransform(dpr, 0, 0, dpr, -X0 * dpr, -Y0 * dpr); x.save(); wallMap(x, bg.ox, bg.oy, bg.k); paintBlade(x, M, gm); x.restore(); return cv; };
  const letters = bladeLetters(game.name || game.id), rows = [];
  for (const col of letters.cols) [...col.word].forEach((ch, i) => { const v1 = col.top - col.lh * i, v0 = v1 - col.lh; rows.push({ y0: bg.oy - bg.k * v1, y1: bg.oy - bg.k * v0 }); });
  rows.sort((a, b) => a.y0 - b.y0);
  return { blank: mk({ ...game, name: ' ' }), fresh: mk(game), rect: { x: X0, y: Y0, w: W, h: H }, face: { y0: bg.oy - bg.k * BLADE.v1, y1: bg.oy - bg.k * BLADE.v0 }, rows, key: `${game.id}|${L.cam.W}x${L.cam.H}` };
}
export function drawBlade(c, art, st, t) {
  if (!art || !st || st.stage === 'before' || st.stage === 'setup') return;
  const R = art.rect, F = art.face, img = (cv, y0, y1) => { const sy = cv.height / R.h, a = Math.max(R.y, y0), b = Math.min(R.y + R.h, y1); if (b > a) c.drawImage(cv, 0, (a - R.y) * sy, cv.width, (b - a) * sy, R.x, a, R.w, b - a); };
  const fh = F.y1 - F.y0;
  c.save();
  if (st.stage === 'out') {
    const top = F.y1 - fh * st.k;
    img(art.blank, top, R.y + R.h);
    // the wet edge: a ragged lighter line where the brush is
    c.fillStyle = 'rgba(70,80,110,0.55)'; for (let x = R.x + 1; x < R.x + R.w - 1; x += 1.6) c.fillRect(x, top - 0.6 - Math.abs(Math.sin(x * 1.7 + t)) * 0.8, 1.4, 1.2);
  } else {
    img(art.blank, R.y, R.y + R.h);
    const rows = art.rows, n = rows.length;
    if (st.stage === 'chalk') { c.globalAlpha = 0.32; for (let i = 0; i < Math.ceil(n * st.k); i++) img(art.fresh, rows[i].y0, rows[i].y1); }
    else if (st.stage === 'letters') {
      const m = n * st.k, full = Math.floor(m);
      c.globalAlpha = 0.32; img(art.fresh, rows[0].y0, rows[n - 1].y1); c.globalAlpha = 1;
      for (let i = 0; i < Math.min(n, full); i++) img(art.fresh, rows[i].y0, rows[i].y1);
      if (full < n) { const r = rows[full], f = m - full; img(art.fresh, r.y0, r.y0 + (r.y1 - r.y0) * f); }
    } else {
      img(art.fresh, R.y, R.y + R.h);
      if (st.stage === 'gilt') { const gy = F.y0 + fh * st.k, g = c.createLinearGradient(0, gy - 6, 0, gy + 6); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(0.5, 'rgba(255,236,170,0.5)'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(R.x, gy - 6, R.w, 12); }
    }
  }
  c.restore();
}
