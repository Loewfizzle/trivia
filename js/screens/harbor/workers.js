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
const WOOD = [150, 118, 78], STEEL = [70, 72, 80], ZINC = [156, 160, 166];

/** the props as depth ITEMS for a pass: crew = folkAt(t).crew, pass 'near' | 'far' → [{ z, draw(c, env) }] (z: the depth people.js sorts
 *  by; ground marks get a huge z so they draw first, under everyone) */
export function propItems(L, crew, pass, t) {
  if (!crew || pass !== 'near') return [];
  const out = [], cam = L.cam, s = L.speakeasy, tr = crew.traces || {};
  for (const p of crew.props || []) {
    if (p.kind === 'ladder') out.push({ z: p.foot.z, draw: (c, env) => tallLadder(c, cam, p, env, t) });
    else if (p.kind === 'steps') out.push({ z: p.foot.z + 0.05, draw: (c, env) => stepLadder(c, cam, p, env, t) });
    else if (p.kind === 'stand') out.push({ z: p.z, draw: (c, env) => newsstand(c, cam, p, env, t) });
    else if (p.kind === 'cloth') out.push({ z: 1e3, draw: (c, env) => cloth(c, cam, p, env, t) });
    else if (p.kind === 'wet') out.push({ z: 1e3 + 1, draw: (c, env) => wetStreak(c, cam, p, env, t) });
    else if (p.kind === 'hatch') { out.push({ z: 1e3 + 2, draw: (c, env) => hatchHole(c, cam, p, env, t) }, { z: p.z + 0.4, draw: (c, env) => hatchLeaves(c, cam, p, env, t) }); }
    else if (p.kind === 'platform') { out.push({ z: p.z + 0.25, draw: (c, env) => platform(c, cam, s, p, env, t, 'back') }, { z: p.z - 0.4, draw: (c, env) => platform(c, cam, s, p, env, t, 'front') }); }
  }
  // THE TRACES (core/harbor-crew.js#tracesAt): the milk on the step, the bundles at the vendor spot
  if (tr.milk && crew.spots) { const st = crew.spots.step; out.push({ z: st.z, draw: (c, env) => bottles(c, cam, st, env) }); }
  if (tr.bundles && crew.spots) { const v = crew.spots.vendor; out.push({ z: v.z + 0.9, draw: (c, env) => bundles(c, cam, { x: v.x - 0.9, z: v.z + 0.9 }, env) }); }
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
  const k = clamp01((t - p.t0) / (p.unfold || 4)) * clamp01((p.t1 - t) / 3);
  if (k <= 0.02) return;
  const sp = cam.F / p.z, [x, y] = project(cam, p.x, 0, p.z), h = 1.25 * sp * k, w = 1.3 * sp, wood = litAt(env, WOOD, p.x, p.z), paper = litAt(env, [232, 226, 206], p.x, p.z, 1.3), ink = litAt(env, [70, 66, 66], p.x, p.z);
  c.save();
  c.fillStyle = 'rgba(8,6,16,0.32)'; c.beginPath(); c.ellipse(x, y, w * 0.6, Math.max(0.6, 0.09 * sp), 0, 0, TAU); c.fill();
  c.strokeStyle = rgb(mix(wood, [0, 0, 0], 0.25)); c.lineWidth = Math.max(0.6, 0.07 * sp);
  c.beginPath(); c.moveTo(x - w * 0.42, y); c.lineTo(x - w * 0.3, y - h); c.moveTo(x + w * 0.42, y); c.lineTo(x + w * 0.3, y - h); c.stroke();
  // the slanted board + its papers in three rows (each a cream sheet, a black masthead line, a grey column)
  c.fillStyle = rgb(wood); c.beginPath(); c.moveTo(x - w * 0.5, y - h * 0.42); c.lineTo(x + w * 0.5, y - h * 0.42); c.lineTo(x + w * 0.42, y - h); c.lineTo(x - w * 0.42, y - h); c.closePath(); c.fill();
  if (k > 0.6) for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const px = x - w * 0.36 + i * w * 0.25, py = y - h * (0.95 - row * 0.28), pw = w * 0.22, ph = h * 0.25;
    c.fillStyle = rgb(paper); c.fillRect(px, py, pw, ph); c.fillStyle = rgb(ink); c.fillRect(px + pw * 0.08, py + ph * 0.1, pw * 0.84, Math.max(0.5, ph * 0.16));
    c.fillStyle = rgb(mix(paper, ink, 0.35)); c.fillRect(px + pw * 0.08, py + ph * 0.42, pw * 0.38, ph * 0.44); c.fillRect(px + pw * 0.54, py + ph * 0.42, pw * 0.38, ph * 0.44);
  }
  // the bundles stacked at its foot + the cash tin
  c.fillStyle = rgb(mix(paper, wood, 0.15)); c.fillRect(x + w * 0.5, y - 0.35 * sp, 0.55 * sp, 0.35 * sp); c.fillStyle = rgb([120, 84, 50].map((v, i) => wood[i] * 0.4 + v * 0.6)); c.fillRect(x + w * 0.5, y - 0.2 * sp, 0.55 * sp, Math.max(0.4, 0.04 * sp));
  c.restore();
}
// ---- THE BUNDLES waiting (two twine-tied stacks), THE MILK on the step (a wire carrier of four white bottles)
function bundles(c, cam, p, env) {
  const sp = cam.F / p.z, [x, y] = project(cam, p.x, 0, p.z), paper = litAt(env, [226, 220, 200], p.x, p.z, 1.2), twine = litAt(env, [120, 84, 50], p.x, p.z);
  c.save(); c.fillStyle = 'rgba(8,6,16,0.3)'; c.beginPath(); c.ellipse(x + 0.3 * sp, y, 0.75 * sp, Math.max(0.5, 0.08 * sp), 0, 0, TAU); c.fill();
  for (const [dx, h] of [[-0.05, 0.42], [0.62, 0.3]]) { c.fillStyle = rgb(paper); c.fillRect(x + dx * sp - 0.28 * sp, y - h * sp, 0.56 * sp, h * sp); c.fillStyle = rgb(mix(paper, [0, 0, 0], 0.2)); for (let v = 0.1; v < h; v += 0.08) c.fillRect(x + dx * sp - 0.28 * sp, y - v * sp, 0.56 * sp, Math.max(0.3, 0.012 * sp)); c.strokeStyle = rgb(twine); c.lineWidth = Math.max(0.4, 0.03 * sp); c.beginPath(); c.moveTo(x + dx * sp, y); c.lineTo(x + dx * sp, y - h * sp); c.moveTo(x + dx * sp - 0.28 * sp, y - h * 0.5 * sp); c.lineTo(x + dx * sp + 0.28 * sp, y - h * 0.5 * sp); c.stroke(); }
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
  const k = clamp01((t - p.t0) / 3) * clamp01((p.t1 - t) / 3); if (k <= 0) return;
  const pts = [[-1.2, -0.7], [1.3, -0.8], [1.5, 0.6], [-1.0, 0.75]].map(([dx, dz]) => project(cam, p.x + dx, 0.01, p.z + dz));
  c.save(); c.globalAlpha *= k; c.fillStyle = rgb(litAt(env, [218, 210, 192], p.x, p.z)); c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.fill();
  c.fillStyle = rgb(litAt(env, [150, 120, 100], p.x, p.z), 0.5); for (let i = 0; i < 6; i++) { const q = project(cam, p.x - 0.8 + i * 0.4, 0.01, p.z - 0.2 + (i % 3) * 0.25); c.fillRect(q[0], q[1], 1.2, 0.8); }
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
  const u = t - p.start, st = platformAt(u, p.len, s.rows || [[4.6, 6.8], [7.6, 9.6]]), y = st.y;
  if (t < p.t0 || t > p.t1) return;
  const x0 = p.x0 + p.u0, x1 = p.x0 + p.u1, z = p.z, sp = cam.F / z, wood = litAt(env, [138, 112, 78], x0, z), steel = litAt(env, STEEL, x0, z), rope = litAt(env, [196, 182, 148], x0, z);
  const P = (x, yy, zz = z) => project(cam, x, yy, zz);
  c.save(); c.lineCap = 'round';
  if (part === 'back') {
    // the davits: an iron arm out over the parapet's top at each end, the ropes hanging down to the stirrups
    for (const xx of [x0 + 0.35, x1 - 0.35]) {
      const base = P(xx, 11.25, s.z0 + 0.15), out = P(xx, 11.85, z - 0.05), tipD = P(xx, 11.55, z - 0.05);
      c.strokeStyle = rgb(steel); c.lineWidth = Math.max(0.7, 0.09 * sp); c.beginPath(); c.moveTo(...base); c.lineTo(...out); c.lineTo(...tipD); c.stroke();
      const top = P(xx, 11.5, z - 0.05), bot = P(xx, y + 1.15, z - 0.05);
      c.strokeStyle = rgb(rope); c.lineWidth = Math.max(0.45, 0.035 * sp); c.beginPath(); c.moveTo(...top); c.lineTo(...bot); c.stroke();
      // the stirrup: a steel frame from the deck up to the rope's block
      const s0 = P(xx, y, z), s1 = P(xx, y + 1.15, z);
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
