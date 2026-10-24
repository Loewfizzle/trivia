// CITY 2.0 — THE HARBOR, PART 6b: THE LEGENDARY SKY, drawn (docs/harbor.md#part-6b; when + how: core/harbor-legend.js). Lazily
// loaded by the scene (only on a legendary night, a preview or the API). The two best-looking moments in the whole city:
//
// THE UFO ABDUCTION (~30 s, the owner's reference: docs/harbor/refs/abduction.jpeg) — a short film over the promenade's compass:
//   THE CRAFT   a dark glossy saucer seen slightly from below: deep violet / near-black, the city's neon (pink, cyan, amber) sliding on
//               its hull, the dome cap over the far rim, a ring of evenly spaced RIM LIGHTS chasing round, the glowing CONCENTRIC RING on
//               its belly (the emitter), its underglow lighting the haze; it glides in from high up-left, hovers silent (a slow bob),
//               pauses after, then leaves FAST up and away (a streak)
//   THE BEAM    a WIDE, SOFT cone (never a laser): pale light with faint colour shifts (violet at one edge, teal at the other, warmer
//               low), rays converging on the emitter, soft edges bleeding into the air, brightest near the craft; it opens DOWNWARD
//               with a bright front, shimmers, and is full of slowly RISING motes (a few falling); it lights the promenade (a pool on
//               the paving + a wide soft wash over the trees round it), the water under the craft, and throws the tall lamps' SHADOWS
//               long and outward
//   THE FIGURE  a lone late walker strolls in from the right, stops on the compass, looks up, points — then the LIFT: limp, ARCHED
//               BACKWARD (the chest highest, the head dropped back, the arms hanging loose with the fingers open, the knees bent, the
//               feet trailing), turning slowly as he rises (slow, then faster), his coat tails lifting in the updraft, his HAT floating
//               off first; rim-lit from above, a dark silhouette against the light, dissolving into it at the belly
//   THE CITY    the lamps under it stutter on the approach, the lights near it dip (the scene: power()); the music dips + muffles
// THE TR-3B (~50 s) — a huge, slow, matte-black triangle crossing the WHOLE screen through the band just above the skyline (against
//   the city's glow on the haze — a sharp black silhouette with a thin rim of city light, blotting out the stars + the moon), three
//   pale orbs at its points + a pulsing red-orange centre; THE POWER DRAIN rolling across the city under it (the scene: drainCols /
//   power — the edge of its range sputters, the middle dies, the lights come back late + unevenly behind it), the music POWERING DOWN
//   (sounds.js), then THE CHASE: three F-16s screaming across after it in an echelon, afterburners with MACH DIAMONDS (jets.js)
import { project } from '../../core/harbor-layout.js';
import { ufoAt, tr3bAt, legendAt, tr3bDir, eveningOf, drainAt, FORMATIONS, UFO_LEN, TR3B_LEN } from '../../core/harbor-legend.js';
import { lookOf, drawFolk } from './folk.js';
import { createJets, jetLook } from './jets.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
// a 0..1 value noise per (i, step) — the sputter, the motes
const hash01 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

let glowC = null;
function glowSprite() {
  if (glowC) return glowC;
  const cv = mk(64, 64), x = safeCtx(cv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.55)'); g.addColorStop(0.55, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (glowC = cv);
}
const tintC = new Map();
function tint(col) {
  const k = col.join(',');
  let cv = tintC.get(k);
  if (!cv) { cv = mk(64, 64); const x = safeCtx(cv); x.drawImage(glowSprite(), 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgb(col); x.fillRect(0, 0, 64, 64); tintC.set(k, cv); }
  return cv;
}
const glow = (c, col, x, y, rx, ry = rx, a = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(tint(col), x - rx, y - ry, rx * 2, ry * 2); };

// ================================================================== THE SAUCER (baked once per size: the hull; the lights live)
const NEON_REF = [[255, 70, 180], [60, 210, 255], [255, 176, 70]];
function saucerSprite(sw, dpr) {
  const W = sw * 1.16, H = sw * 0.6, d = Math.min(3, Math.max(1.5, dpr));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H * 0.42) * d);
  const R = sw / 2;
  // the DOME cap peeking over the far rim (dark glass, a soft violet sheen + one long highlight)
  x.save(); x.beginPath(); x.ellipse(0, -R * 0.13, R * 0.42, R * 0.24, 0, Math.PI, 0); x.closePath();
  const dg = x.createLinearGradient(0, -R * 0.4, 0, -R * 0.1); dg.addColorStop(0, 'rgb(70,52,110)'); dg.addColorStop(1, 'rgb(22,14,40)');
  x.fillStyle = dg; x.fill();
  x.strokeStyle = 'rgba(200,180,255,0.55)'; x.lineWidth = R * 0.018; x.beginPath(); x.ellipse(0, -R * 0.13, R * 0.38, R * 0.2, 0, Math.PI * 1.12, Math.PI * 1.55); x.stroke();
  x.restore();
  // the UPPER HULL's far band (a sliver of the top surface over the far rim)
  x.beginPath(); x.ellipse(0, -R * 0.05, R * 0.98, R * 0.2, 0, Math.PI, 0); x.closePath();
  const ug = x.createLinearGradient(0, -R * 0.25, 0, 0); ug.addColorStop(0, 'rgb(46,32,76)'); ug.addColorStop(1, 'rgb(18,12,32)');
  x.fillStyle = ug; x.fill();
  // THE RIM: a glossy band all round (lit underneath by the city: a warm-violet lower lip)
  x.beginPath(); x.ellipse(0, 0, R, R * 0.235, 0, 0, TAU);
  const rg = x.createLinearGradient(0, -R * 0.24, 0, R * 0.24);
  rg.addColorStop(0, 'rgb(60,44,96)'); rg.addColorStop(0.45, 'rgb(28,18,48)'); rg.addColorStop(0.8, 'rgb(70,44,96)'); rg.addColorStop(1, 'rgb(150,110,190)');
  x.fillStyle = rg; x.fill();
  // THE BELLY (seen from below): a wide shallow dome, deep violet at the middle, near-black at its edge
  x.save(); x.beginPath(); x.ellipse(0, R * 0.05, R * 0.93, R * 0.25, 0, 0, TAU); x.clip();
  const bg = x.createRadialGradient(0, R * 0.08, 0, 0, R * 0.08, R * 0.95);
  bg.addColorStop(0, 'rgb(64,40,104)'); bg.addColorStop(0.55, 'rgb(34,20,60)'); bg.addColorStop(1, 'rgb(12,8,22)');
  x.fillStyle = bg; x.fillRect(-R, -R, R * 2, R * 2);
  // the city's neon sliding on the glossy hull (soft smudges along the near edge) + the specular arcs
  x.globalCompositeOperation = 'lighter';
  NEON_REF.forEach((col, i) => { x.globalAlpha = 0.32; x.drawImage(tint(col), (-0.6 + i * 0.55) * R - R * 0.3, R * 0.1, R * 0.6, R * 0.2); });
  x.globalAlpha = 0.5; x.strokeStyle = 'rgba(220,200,255,0.6)'; x.lineWidth = R * 0.012;
  x.beginPath(); x.ellipse(0, R * 0.05, R * 0.86, R * 0.21, 0, Math.PI * 0.12, Math.PI * 0.45); x.stroke();
  x.beginPath(); x.ellipse(0, R * 0.05, R * 0.86, R * 0.21, 0, Math.PI * 0.6, Math.PI * 0.78); x.stroke();
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  // radial panel seams (subtle), the CONCENTRIC RINGS round the emitter (their glow is live)
  x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = R * 0.008;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.beginPath(); x.moveTo(Math.cos(a) * R * 0.38, R * 0.08 + Math.sin(a) * R * 0.1); x.lineTo(Math.cos(a) * R * 0.9, R * 0.05 + Math.sin(a) * R * 0.23); x.stroke(); }
  for (const [rr, a] of [[0.62, 0.35], [0.46, 0.5]]) { x.strokeStyle = `rgba(190,170,255,${a})`; x.lineWidth = R * 0.016; x.beginPath(); x.ellipse(0, R * 0.08, R * rr, R * rr * 0.26, 0, 0, TAU); x.stroke(); }
  x.fillStyle = 'rgb(24,14,44)'; x.beginPath(); x.ellipse(0, R * 0.08, R * 0.34, R * 0.09, 0, 0, TAU); x.fill();
  x.restore();
  // the rim's outer edge: a fine bright line (the city's light along the metal)
  x.strokeStyle = 'rgba(210,190,255,0.5)'; x.lineWidth = R * 0.012; x.beginPath(); x.ellipse(0, 0, R, R * 0.235, 0, Math.PI * 0.05, Math.PI * 0.95); x.stroke();
  return { cv, w: W, h: H, oy: H * 0.42, R };
}

// ================================================================== THE BEAM (baked per size: a soft cone, rays converging up)
function beamSprite(top, bot, len, dpr) {
  const d = Math.min(1.5, dpr), w = Math.ceil(bot * 1.25 * d), h = Math.ceil(len * d), cv = mk(w, h), x = safeCtx(cv);
  const img = x.createImageData(w, h), D = img.data, cx = w / 2;
  // rays: a fixed pattern along the cone's angle (they converge on the emitter as a real shaft's streaks would)
  const ray = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const u = i / 255; ray[i] = 0.68 + 0.18 * Math.sin(u * 37.1 + 1.3) + 0.1 * Math.sin(u * 91.7) + 0.08 * Math.sin(u * 13.3 + 2); }
  for (let yy = 0; yy < h; yy++) {
    const u = yy / (h - 1), hw = (top / 2 + (bot / 2 - top / 2) * Math.pow(u, 0.85)) * d;
    const vert = (0.92 - 0.5 * u) * (0.6 + 0.4 * smooth(0, 0.06, u)) * (1 - 0.5 * smooth(0.82, 1, u));
    for (let xx = 0; xx < w; xx++) {
      const s = (xx - cx) / hw, a = Math.abs(s);
      if (a > 1.45) continue;
      const edge = 1 - smooth(0.42, 1.3, a);
      const r = ray[Math.min(255, Math.max(0, Math.round((s * 0.5 + 0.5) * 255)))];
      const k = edge * vert * r;
      if (k <= 0.003) continue;
      // the colour: pale cyan-white in the core, faint violet toward the left edge, faint teal-pink right, warmer low down
      const side = Math.max(-1, Math.min(1, s));
      let R = 222, G = 234, B = 255;
      if (side < 0) { R += -side * -18; G += side * 40; B += 0; } else { R += side * 10; G += side * -4; B += side * -28; }
      R += u * 18; G += u * 4; B -= u * 22;
      const i4 = (yy * w + xx) * 4;
      D[i4] = R; D[i4 + 1] = G; D[i4 + 2] = B; D[i4 + 3] = Math.min(255, k * 235);
    }
  }
  x.putImageData(img, 0, 0);
  return { cv, w: w / d, h: len };
}

// ================================================================== THE TR-3B (baked once per size)
function tr3bSprite(len, dpr) {
  const W = len * 1.08, H = len * 0.6, d = Math.min(2, Math.max(1.25, dpr));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H / 2) * d);
  // seen from below as it crosses: the nose toward +x (the flight), the far rear corner up, the near one down (flattened by the view)
  const P = tr3bCorners(len);
  const path = () => {
    const r = len * 0.035, n = P.length;
    x.beginPath();
    for (let i = 0; i < n; i++) {
      const a = P[(i + n - 1) % n], b = P[i], cN = P[(i + 1) % n];
      const ux = (a[0] - b[0]) / Math.hypot(a[0] - b[0], a[1] - b[1]), uy = (a[1] - b[1]) / Math.hypot(a[0] - b[0], a[1] - b[1]);
      const vx = (cN[0] - b[0]) / Math.hypot(cN[0] - b[0], cN[1] - b[1]), vy = (cN[1] - b[1]) / Math.hypot(cN[0] - b[0], cN[1] - b[1]);
      if (i === 0) x.moveTo(b[0] + ux * r, b[1] + uy * r); else x.lineTo(b[0] + ux * r, b[1] + uy * r);
      x.quadraticCurveTo(b[0], b[1], b[0] + vx * r, b[1] + vy * r);
    }
    x.closePath();
  };
  // ITS THICKNESS: the hull's side wall along the near edges (a dark grey band under the belly's outline — a solid craft, not a sheet)
  x.save(); x.translate(0, len * 0.026); path(); x.fillStyle = 'rgb(34,28,44)'; x.fill(); x.restore();
  x.save(); x.translate(0, len * 0.013); path(); x.fillStyle = 'rgb(22,18,30)'; x.fill(); x.restore();
  // the matte black belly: near-black, a faint violet-pink cast toward its near (lower) edge — the city's glow from below
  path();
  const g = x.createLinearGradient(0, -len * 0.22, 0, len * 0.24);
  g.addColorStop(0, 'rgb(6,5,10)'); g.addColorStop(0.6, 'rgb(12,9,18)'); g.addColorStop(1, 'rgb(34,20,40)');
  x.fillStyle = g; x.fill();
  // panel lines (only just there) + the three spars from the centre to the corners
  x.save(); path(); x.clip();
  x.strokeStyle = 'rgba(120,100,150,0.12)'; x.lineWidth = len * 0.003;
  for (const p of P) { x.beginPath(); x.moveTo(0, 0); x.lineTo(p[0] * 0.86, p[1] * 0.86); x.stroke(); }
  for (const k of [0.32, 0.6]) { x.beginPath(); P.forEach((p, i) => (i ? x.lineTo(p[0] * k, p[1] * k) : x.moveTo(p[0] * k, p[1] * k))); x.closePath(); x.stroke(); }
  // the recessed housings of the corner lights + the centre's ring
  x.fillStyle = 'rgb(20,16,26)';
  for (const p of P) { x.beginPath(); x.ellipse(p[0] * 0.8, p[1] * 0.8, len * 0.04, len * 0.016, 0, 0, TAU); x.fill(); }
  x.strokeStyle = 'rgba(90,40,40,0.5)'; x.lineWidth = len * 0.006; x.beginPath(); x.ellipse(0, 0, len * 0.085, len * 0.032, 0, 0, TAU); x.stroke();
  x.restore();
  // a THIN RIM of the city's light along its lower edges (the edge toward us catches the glow below)
  x.strokeStyle = 'rgba(200,120,190,0.55)'; x.lineWidth = Math.max(0.8, len * 0.004);
  x.beginPath(); x.moveTo(P[0][0], P[0][1]); x.lineTo(P[2][0], P[2][1]); x.stroke();
  x.strokeStyle = 'rgba(160,110,200,0.32)'; x.beginPath(); x.moveTo(P[2][0], P[2][1]); x.lineTo(P[1][0], P[1][1]); x.stroke();
  return { cv, w: W, h: H };
}
/** the TR-3B's corners (pt, its centre at 0; the nose toward +x): the nose, the far rear (up), the near rear (down) */
const tr3bCorners = len => [[len * 0.5, len * 0.015], [-len * 0.42, -len * 0.19], [-len * 0.36, len * 0.22]];

// ================================================================== THE ABDUCTEE — the classic arched pose (a 2.5-D rig of its own)
// joints in body heights, origin = the CHEST (the lift point), x = the body's front (standing) / its length (arched), y up, z lateral
const STAND = { head: [0.0, 0.2, 0], neck: [0, 0.1, 0], shL: [0, 0.035, -0.11], shR: [0, 0.035, 0.11], hipL: [0, -0.26, -0.05], hipR: [0, -0.26, 0.05], pelvis: [0, -0.24, 0],
  kneeL: [0.015, -0.5, -0.05], kneeR: [0.015, -0.5, 0.05], footL: [0, -0.72, -0.055], footR: [0, -0.72, 0.055], elL: [0.02, -0.13, -0.135], elR: [0.02, -0.13, 0.135], haL: [0.035, -0.29, -0.125], haR: [0.035, -0.29, 0.125] };
const ARCH = { head: [-0.21, -0.12, 0], neck: [-0.11, -0.025, 0], shL: [-0.07, -0.005, -0.11], shR: [-0.07, -0.005, 0.11], hipL: [0.17, -0.12, -0.05], hipR: [0.17, -0.12, 0.05], pelvis: [0.16, -0.11, 0],
  kneeL: [0.28, -0.34, -0.06], kneeR: [0.25, -0.33, 0.06], footL: [0.14, -0.53, -0.07], footR: [0.12, -0.55, 0.05], elL: [-0.12, -0.17, -0.15], elR: [-0.09, -0.17, 0.14], haL: [-0.1, -0.33, -0.15], haR: [-0.06, -0.33, 0.15] };
function pose(a, t, mo) {
  const J = {};
  const sw = mo ? Math.sin(t * 1.3) : 0, sw2 = mo ? Math.sin(t * 1.7 + 1) : 0;
  for (const k of Object.keys(STAND)) {
    const A = STAND[k], B = ARCH[k];
    J[k] = [lerp(A[0], B[0], a), lerp(A[1], B[1], a), lerp(A[2], B[2], a)];
  }
  // limp: the hanging hands + feet sway a little in the updraft
  J.haL[0] += 0.02 * sw * a; J.haR[0] += 0.02 * sw2 * a; J.footL[0] += 0.015 * sw2 * a; J.footR[0] += 0.015 * sw * a;
  return J;
}
/**
 * The figure at (X, Y = the chest on the screen), H pt tall: a (0 standing … 1 the full arch), turn (rad, round the vertical),
 * look (folk.js's lookOf), o = { t, mo, rim (0..1 the beam's light from above), fade (0..1 into the light), hatK (0..1: off the head) }
 */
function drawAbductee(c, X, Y, H, a, turn, look, o) {
  const J = pose(a, o.t || 0, o.mo !== false), ct = Math.cos(turn), st = Math.sin(turn);
  const P = k => { const j = J[k]; return [X + (j[0] * ct - j[2] * st) * H, Y - j[1] * H, j[0] * st + j[2] * ct]; };
  const fade = o.fade || 0, rim = o.rim || 0;
  // the cloth in the beam: a dark silhouette (the coat's own hue kept a little), dissolving to the beam's white at the end
  const body = mix(mix(look.cols.coat, [16, 12, 26], 0.72), [236, 240, 255], fade * 0.85), legs = mix(mix(look.cols.legs, [12, 10, 20], 0.78), [236, 240, 255], fade * 0.85);
  const skin = mix(mix(look.cols.skin, [30, 24, 34], 0.6), [240, 242, 255], fade * 0.8), hatC = mix(mix(look.cols.hat, [14, 12, 20], 0.7), [236, 240, 255], fade * 0.85);
  const shape = (col, colL, colS, dx, dy) => {
    const p = {}; for (const k of Object.keys(J)) { const q = P(k); p[k] = [q[0] + dx, q[1] + dy, q[2]]; }
    const limb = (ks, w, cc) => { c.strokeStyle = rgb(cc); c.lineWidth = w * H; c.beginPath(); ks.forEach((k, i) => (i ? c.lineTo(p[k][0], p[k][1]) : c.moveTo(p[k][0], p[k][1]))); c.stroke(); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    // far side first (by depth)
    const farLeft = p.shL[2] > p.shR[2];
    const sides = farLeft ? ['L', 'R'] : ['R', 'L'];
    for (const sd of sides) {
      const far = sd === sides[0], dim = far ? 0.8 : 1;
      if (far) { limb([`hip${sd}`, `knee${sd}`, `foot${sd}`], 0.074, colL.map(v => v * dim)); limb([`sh${sd}`, `el${sd}`, `ha${sd}`], 0.058, col.map(v => v * dim)); }
    }
    // the torso + the coat: a thick curve hips → chest → neck (the coat's body), its tails lifting in the updraft
    const ch = [X + dx, Y + dy];
    c.strokeStyle = rgb(col); c.lineWidth = 0.16 * H;
    c.beginPath(); c.moveTo(p.pelvis[0], p.pelvis[1]); c.quadraticCurveTo(ch[0], ch[1] - 0.03 * H * a, p.neck[0], p.neck[1]); c.stroke();
    const tl = o.mo !== false ? Math.sin((o.t || 0) * 5.3) : 0, tl2 = o.mo !== false ? Math.sin((o.t || 0) * 4.1 + 2) : 0;
    c.fillStyle = rgb(col);
    for (const [sgn, w] of [[-1, tl], [1, tl2]]) {
      const hx = p.pelvis[0], hy = p.pelvis[1], ex = hx + (0.15 + 0.05 * w) * H * ct * (a > 0.5 ? 1 : 0.3) + sgn * 0.05 * H * st, ey = hy - (0.05 + 0.12 * a + 0.04 * w) * H;
      c.beginPath(); c.moveTo(hx - 0.06 * H, hy + 0.02 * H); c.quadraticCurveTo(lerp(hx, ex, 0.5) + 0.04 * H * w, lerp(hy, ey, 0.5) + 0.06 * H, ex, ey); c.lineTo(hx + 0.05 * H, hy - 0.03 * H); c.closePath(); c.fill();
    }
    // the head (dropped back) + the hair
    c.fillStyle = rgb(colS); c.beginPath(); c.arc(p.head[0], p.head[1], 0.068 * H, 0, TAU); c.fill();
    for (const sd of sides) {
      if (sd === sides[0]) continue;
      limb([`hip${sd}`, `knee${sd}`, `foot${sd}`], 0.078, colL); limb([`sh${sd}`, `el${sd}`, `ha${sd}`], 0.06, col);
    }
    // the open hands: three splayed fingers each
    c.lineWidth = Math.max(0.35, 0.014 * H); c.strokeStyle = rgb(colS);
    for (const sd of ['L', 'R']) {
      const e = p[`el${sd}`], h = p[`ha${sd}`], ang = Math.atan2(h[1] - e[1], h[0] - e[0]);
      for (const f of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(h[0] + Math.cos(ang + f) * 0.045 * H, h[1] + Math.sin(ang + f) * 0.045 * H); c.stroke(); }
    }
    return p;
  };
  // THE RIM from above (the beam lights the top edges): the shape in the beam's colour, a hair higher, then the body over it
  if (rim > 0.02) { c.globalAlpha = (o.alpha == null ? 1 : o.alpha) * Math.min(1, rim); const rc = [214, 230, 255]; shape(rc, rc, rc, 0.25 * Math.sign(st || 1), -Math.max(0.8, H * 0.03)); }
  c.globalAlpha = o.alpha == null ? 1 : o.alpha;
  const p = shape(body, legs, skin, 0, 0);
  // THE HAT: a fedora floating off his head — rising a little faster, tumbling slowly, into the light first
  const hk = o.hatK || 0;
  if (look.hat && hk < 0.98) {
    const hx = p.head[0] + hk * 0.3 * H * ct, hy = p.head[1] - 0.06 * H - hk * 1.1 * H, rot = hk * 2.4 + (o.t || 0) * 0.2 * hk;
    c.save(); c.globalAlpha *= 1 - smooth(0.7, 0.98, hk); c.translate(hx, hy); c.rotate(rot);
    c.fillStyle = rgb(hatC); c.beginPath(); c.ellipse(0, 0, 0.095 * H, 0.022 * H, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-0.055 * H, 0); c.quadraticCurveTo(-0.05 * H, -0.075 * H, 0, -0.07 * H); c.quadraticCurveTo(0.05 * H, -0.075 * H, 0.055 * H, 0); c.fill();
    if (rim > 0.02) { c.strokeStyle = 'rgba(214,230,255,0.8)'; c.lineWidth = Math.max(0.4, H * 0.015); c.beginPath(); c.moveTo(-0.05 * H, -0.05 * H); c.quadraticCurveTo(0, -0.08 * H, 0.05 * H, -0.05 * H); c.stroke(); }
    c.restore();
  }
  c.globalAlpha = 1;
}

// ================================================================== THE MANAGER
export function createLegends({ clock, qp } = {}) {
  // (&lgs=<s>: a preview HELD at that second of the event — the look review's frame-exact shots; motion keeps running)
  const hold = qp && qp.get('lgs') != null && qp.get('lgs') !== '' ? Number(qp.get('lgs')) : null;
  let W = 1, H = 1, cam = null, L = null, lanes = null, dpr = 2, tier = 2, med = null, crown = 0, bandY0 = 0;
  let saucer = null, beam = null, tri = null, sizeKey = '';
  const jets = createJets();
  // the run: { kind, at (clock ms it began), dir, seed, forced }
  let run = null, st = null, sNow = 0, lastForce = 0, firstAt = new Map();
  let motes = [];
  const lookFig = lookOf('night', 1924 * 7, { season: 'autumn' });

  function sizes() {
    const sw = Math.min(W * 0.37, 168), key = `${Math.round(sw)}|${dpr}|${Math.round(W)}`;
    if (key === sizeKey) return;
    sizeKey = key;
    for (const s of [saucer, beam, tri]) if (s) s.cv.width = 0;
    saucer = saucerSprite(sw, dpr);
    const top = sw * 0.5, len = Math.max(60, med.y - hoverY() - sw * 0.06), bot = sw * 1.12;
    beam = beamSprite(top, bot, len, dpr);
    tri = tr3bSprite(triLen(), dpr);
    motes = [];
    const n = tier === 2 ? 70 : tier === 1 ? 44 : 22;
    for (let i = 0; i < n; i++) motes.push({ a: (hash01(i, 3) - 0.5) * 1.7, ph: hash01(i, 5), sp: 0.035 + 0.05 * hash01(i, 7), r: 0.5 + 1.1 * hash01(i, 9), down: hash01(i, 11) < 0.18, col: hash01(i, 13) < 0.3 ? [200, 180, 255] : hash01(i, 13) < 0.5 ? [180, 255, 240] : [240, 246, 255] });
  }
  const hoverY = () => Math.max((lanes && lanes['sky-low'] ? lanes['sky-low'].y + 30 : H * 0.42), med.y - Math.min(H * 0.27, 250));
  const triLen = () => Math.max(200, Math.min(W * 0.66, 540));

  /** the scheduled legendary now (null) or the forced one; starts / ends the run */
  function tick(fs) {
    const now = fs.now, force = fs.force;
    const forced = force.has('ufo') ? 'ufo' : force.has('tr3b') ? 'tr3b' : null;
    if (run && run.forced && run.kind !== forced) run = null;
    if (!run && forced && performance.now() - lastForce > 2500) {
      const a = firstAt.get(forced); firstAt.delete(forced);
      run = { kind: forced, at: a != null ? a : now, dir: forced === 'tr3b' ? ((Math.floor(now / 1000) & 1) ? 1 : -1) : 1, forced: true };
    }
    if (!run && !forced && fs.L.local && !fs.L.alwaysNight) {
      const lg = legendAt(fs.L.local);
      const dk = clamp01(fs.L.w.night + fs.L.w.late);
      // (the weather: the abduction needs a dry night; the TR-3B any night but a storm — a hazy, low-cloud night is its best)
      if (lg && dk > 0.55 && !fs.L.storm && !(lg.kind === 'ufo' && (fs.L.rain || 0) > 0.2)) {
        const ev = eveningOf(fs.L.local);
        run = { kind: lg.kind, at: now - lg.s * 1000, dir: tr3bDir(ev.y, ev.m, ev.d), forced: false };
      }
    }
    if (run) {
      sNow = run.forced && hold != null && isFinite(hold) ? hold : (now - run.at) / 1000;
      const len = run.kind === 'ufo' ? UFO_LEN : TR3B_LEN;
      if (sNow >= len || sNow < -1) { if (run.forced) lastForce = performance.now(); run = null; st = null; }
      else st = run.kind === 'ufo' ? ufoAt(Math.max(0, sNow)) : tr3bAt(Math.max(0, sNow), run.dir);
    } else st = null;
  }

  // ---------------------------------------------------------------- THE POWER (the scene asks for each light)
  /** what's left of the power at a screen x (fraction of W) in a band ('city' | 'harbor' | 'near'), i = a light's own id (its lag +
   *  sputter) → 0..1 */
  function power(xf, band = 'city', i = 0) {
    if (!st) return 1;
    const t = performance.now() / 1000;
    if (run.kind === 'tr3b') return drainAt(xf, st.x, st.drain, band, run.dir, hash01(i, 77), hash01(i, Math.floor(t * 11)));
    // the abduction: the lights near the craft dip + stutter as it comes in and while it beams
    const k = st.lamps;
    if (k <= 0.01) return 1;
    const cx = med.x / W, d = Math.abs(xf - cx), near = 1 - smooth(0.06, band === 'near' ? 0.42 : 0.3, d);
    const depth = band === 'near' ? 0.7 : band === 'harbor' ? 0.45 : 0.18;
    const stut = hash01(i, Math.floor(t * 9)) < 0.35 ? 0.35 : 1;
    return clamp01(1 - k * near * depth * (st.phase === 'approach' ? (stut < 1 ? 1 : 0.4) : stut < 1 ? 0.9 : 0.55));
  }
  /** THE DRAIN's columns over the baked city: [{ x0, x1 (pt), k (how much of the unlit facade to lay back over) }] — the TR-3B only */
  function drainCols() {
    if (!st || run.kind !== 'tr3b' || st.drain <= 0.003) return null;
    const n = Math.max(16, Math.round(W / 12)), cw = W / n, out = [];
    for (let i = 0; i < n; i++) { const p = power((i + 0.5) / n, 'city', i); if (p < 0.985) out.push({ x0: i * cw, x1: (i + 1) * cw, k: 1 - p }); }
    return out;
  }

  // ---------------------------------------------------------------- THE TR-3B + THE CHASE (the sky pass: before the city's layers)
  function triPos() {
    const y0 = bandY0, y1 = crown, yc = lerp(y0, y1, 0.6) + (y1 - y0) * 0.14 * st.dip;   // (low: against the city's glow, the tallest crowns in front of its belly)
    return { x: st.x * W, y: yc };
  }
  function drawTr3b(c, fs) {
    if (!st || run.kind !== 'tr3b') return;
    sizes();
    const p = triPos(), len = triLen(), dir = run.dir, t = sNow;
    if (p.x + len < -20 || p.x - len > W + 20) { drawChase(c, fs); return; }
    c.save(); c.translate(p.x, p.y); c.scale(dir, 1); c.rotate(-0.02);
    // its own faint downwash in the haze (the dark shape reads against the glow it sits in)
    c.drawImage(tri.cv, -tri.w / 2, -tri.h / 2, tri.w, tri.h);
    const P = tr3bCorners(len), pulse = st.pulse;
    c.globalCompositeOperation = 'lighter';
    // the corner orbs (pale, a faint amber; pulsing slowly in turn) + the red-orange centre (a slow heavy pulse)
    P.forEach((q, i) => {
      const k = 0.65 + 0.35 * Math.sin(t * 1.6 + i * 2.1);
      glow(c, [255, 236, 210], q[0] * 0.8, q[1] * 0.8, len * 0.07, len * 0.04, 0.55 * k);
      glow(c, [255, 252, 244], q[0] * 0.8, q[1] * 0.8, len * 0.02, len * 0.014, 0.95 * k);
    });
    glow(c, [255, 60, 30], 0, 0, len * (0.16 + 0.04 * pulse), len * (0.07 + 0.02 * pulse), 0.35 + 0.35 * pulse);
    glow(c, [255, 140, 70], 0, 0, len * 0.05, len * 0.024, 0.75 + 0.25 * pulse);
    glow(c, [255, 236, 210], 0, 0, len * 0.018, len * 0.01, 0.9);
    c.restore();
    drawChase(c, fs);
  }
  function drawChase(c, fs) {
    if (!st || run.kind !== 'tr3b' || !st.chase.on) return;
    const look = jetLook(fs.L), len = Math.max(48, Math.min(W * 0.16, 96)), dir = run.dir, u = st.chase.u;
    const y0 = lerp(bandY0, crown, 0.5);
    FORMATIONS.chase.forEach(([fx, fy], i) => {
      const xu = lerp(-0.25, 1.25, u) + fx * len / W * 1.0;
      const x = dir > 0 ? xu * W : (1 - xu) * W, y = y0 + fy * len - u * len * 0.35;
      jets.draw(c, { x, y, dir, ang: 0.06, len, look, burn: 1, t: performance.now() / 1000 + i * 0.37, i });
    });
  }

  // ---------------------------------------------------------------- THE ABDUCTION (before the front row)
  function saucerAt() {
    const k = st.craft.k, out = st.craft.out;
    const hx = med.x, hy = hoverY() + st.craft.bob * 2.2;
    // (in from the LEFT under the tagline — small + far, gliding down and nearer: never behind the NEON sign, which draws over the canvas)
    const sx = lerp(-W * 0.05, hx, smooth(0, 1, k)), sy = lerp(bandY0 + 18, hy, smooth(0, 1, k)) - Math.sin(Math.PI * k) * 10;
    const o2 = out * out;
    return { x: sx + o2 * W * 0.95, y: sy - o2 * H * 0.42, s: lerp(0.28, 1, smooth(0, 1, k)) * (1 - 0.75 * o2), tilt: st.craft.tilt };
  }
  function drawUfo(c, fs, env) {
    if (!st || run.kind !== 'ufo') return;
    sizes();
    const t = sNow, sa = saucerAt(), R = saucer.R * sa.s, bellyY = sa.y + R * 0.16;
    const night = clamp01(fs.L.w.night + fs.L.w.late), mo = fs.motion;
    const beamK = st.beam.k, open = st.beam.open;
    // ---- THE LIGHT ON THE GROUND + THE SURROUNDINGS (the pool, the wash, the water under it, the lamps' long shadows)
    const gy = med.y, poolR = beam.w * 0.5;
    if (beamK > 0.01 && open > 0.6) {
      const k = beamK * smooth(0.6, 1, open);
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, [170, 190, 255], med.x, gy - 30, poolR * 2.2, poolR * 1.05, 0.22 * k);          // (the wide wash: the trees + the lamps round it)
      glow(c, [214, 228, 255], med.x, gy, poolR * 1.15, poolR * 0.34, 0.55 * k);            // (the pool on the paving)
      glow(c, [255, 255, 255], med.x, gy, poolR * 0.55, poolR * 0.16, 0.45 * k);
      c.restore();
      // the tall lamps' shadows, thrown long + outward from the beam (the light is high over the compass)
      if (L && L.lamps) {
        c.save(); c.fillStyle = `rgba(8,8,18,${(0.42 * k).toFixed(3)})`;
        const hs = 16, m0 = L.medallion;
        for (const l of L.lamps) {
          const dx = l.x - m0.x, dz = l.z - m0.z, dist = Math.hypot(dx, dz);
          if (dist > 13 || dist < 0.5) continue;
          const sl = Math.min(9, l.h * dist / Math.max(2, hs - l.h)), ux = dx / dist, uz = dz / dist, w0 = 0.18, w1 = 0.5;
          const q = (a, b) => project(cam, a, 0, b);
          const [ax, ay] = q(l.x - uz * w0, l.z + ux * w0), [bx, by] = q(l.x + uz * w0, l.z - ux * w0), [cx, cy] = q(l.x + ux * sl + uz * w1, l.z + uz * sl - ux * w1), [dx2, dy2] = q(l.x + ux * sl - uz * w1, l.z + uz * sl + ux * w1);
          const g = c.createLinearGradient(ax, ay, (cx + dx2) / 2, (cy + dy2) / 2); g.addColorStop(0, `rgba(8,8,18,${(0.5 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(8,8,18,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.lineTo(dx2, dy2); c.closePath(); c.fill();
        }
        c.restore();
      }
    }
    // ---- THE WALKER (before the lift): in from the right along the compass's row, stops, looks up, points
    const m0 = L.medallion;
    if (!st.lift.on && sNow < 9.2 && env) {
      const u = st.walker.u, x0 = m0.x + 8.5, xw = lerp(x0, m0.x + 0.25, u);
      const pz = st.walker.pose === 'walk' ? 'walk' : st.walker.pose === 'point' ? 'point' : 'wait';
      const hd = st.walker.pose === 'walk' ? Math.PI : lerp(Math.PI, -Math.PI / 2 - 0.25, smooth(6.2, 7, sNow));
      drawFolk(c, cam, { s: { x: xw, z: m0.z, pose: pz, hd, dist: (x0 - xw), v: st.walker.pose === 'walk' ? 1.4 : 0, a: 1 }, L: lookFig }, env);
    }
    // ---- THE BEAM (a wide soft cone from the emitter down to the paving; opening downward, shimmering, full of motes)
    if (beamK > 0.01 && open > 0.01) {
      const top = bellyY + R * 0.02, len = gy - top, bw = beam.w * (len / beam.h * 0.25 + 0.75);
      const reach = open * len;
      // (the opening's front is SOFT: the cone drawn in slices, each fading out round its reach — never a cut edge)
      const soft = Math.min(46, len * 0.22), slices = 12;
      const pass = (a, wk) => {
        const sw = bw * wk, x0 = med.x - sw / 2, sh0 = beam.cv.height / slices;
        for (let i = 0; i < slices; i++) {
          const yc = (i + 0.5) / slices * len, f = open >= 0.999 ? 1 : 1 - smooth(reach - soft, reach + soft * 0.3, yc);
          if (f <= 0.01) continue;
          c.globalAlpha = a * f; c.drawImage(beam.cv, 0, i * sh0, beam.cv.width, sh0, x0, top + i * len / slices, sw, len / slices + 0.5);
        }
      };
      c.save();
      const sh = mo ? 0.88 + 0.08 * Math.sin(t * 2.3) + 0.04 * Math.sin(t * 5.1) : 0.95;
      // the light IN THE AIR: a pale veil first (the cone glows as a body of light — the city behind it seen through a bright haze, never
      // a tint over it), then the light itself added, a hot core down the axis, a soft haze round the cone
      pass(beamK * 0.42, 1);
      c.globalCompositeOperation = 'lighter';
      glow(c, [150, 160, 255], med.x, top + Math.min(reach, len) * 0.5, bw * 0.85, Math.max(20, reach * 0.62), 0.2 * beamK);
      pass(beamK * sh, 1);
      glow(c, [236, 244, 255], med.x, top + Math.min(reach, len * 0.64) * 0.5, bw * 0.16, Math.max(12, Math.min(reach, len * 0.64) * 0.65), 0.32 * beamK);
      // the shimmer: a second pass a touch wider, its strength wandering — the light breathing
      pass(beamK * (mo ? 0.18 + 0.12 * Math.sin(t * 1.3 + 1) : 0.2), 1.08);
      // the motes: slowly rising (a few falling), drifting toward the axis as they climb; twinkling
      if (tier > 0 || true) for (const m of motes) {
        let v = ((m.ph + (mo ? t * m.sp * (m.down ? 1 : -1) : 0)) % 1 + 1) % 1;
        const y = top + v * len; if (y > top + reach - soft * 0.4) continue;
        const hw = lerp(beam.w * 0.25, bw * 0.48, v), x = med.x + m.a * hw * 0.55;
        const tw = mo ? 0.5 + 0.5 * Math.sin(t * (2 + m.sp * 40) + m.ph * 20) : 0.7;
        glow(c, m.col, x, y, m.r * 2.6, m.r * 2.6, beamK * (0.35 + 0.5 * tw));
      }
      // the opening's bright front
      if (open < 0.98) glow(c, [240, 246, 255], med.x, top + reach - soft * 0.45, bw * 0.4, soft * 0.6, 0.35 * beamK);
      c.restore();
    }
    // ---- THE FIGURE LIFTED (the arch, the turn, the hat, the coat; his shadow under him on the lit paving, shrinking)
    if (st.lift.on && env) {
      // (the glance test: the hero of the moment drawn 1.2× — he grows into it from his walking size as the lift begins)
      const Hh = 2.1 * lookFig.h * cam.F / m0.z * (1 + 0.2 * smooth(9, 11, sNow));
      const chest0 = gy - 0.72 * Hh, chest1 = bellyY + 0.3 * Hh, y = lerp(chest0, chest1, st.lift.h);
      // the shadow: a dark soft blob under him, shrinking + fading as he rises
      const sk = 1 - st.lift.h;
      if (sk > 0.05) { c.fillStyle = `rgba(6,6,16,${(0.45 * sk * beamK).toFixed(3)})`; c.beginPath(); c.ellipse(med.x, gy, Hh * 0.22 * (0.5 + sk * 0.5), Hh * 0.05, 0, 0, TAU); c.fill(); }
      drawAbductee(c, med.x + (mo ? Math.sin(t * 0.8) * 2 * st.lift.h : 0), y, Hh, st.lift.arch, st.lift.turn, lookFig, { t, mo, rim: beamK, fade: st.lift.fade, hatK: st.lift.hat, alpha: 1 - smooth(0.75, 1, st.lift.fade) });
      // vanishing into the light: a soft burst at the emitter
      if (st.lift.fade > 0.6) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [240, 246, 255], med.x, bellyY + Hh * 0.2, Hh * 1.1, Hh * 0.7, smooth(0.6, 1, st.lift.fade) * 0.7); c.restore(); }
    }
    // ---- THE SAUCER (its underglow in the haze, the hull, the emitter rings, the rim lights)
    c.save(); c.translate(sa.x, sa.y); c.rotate(sa.tilt); c.scale(sa.s, sa.s);
    const R0 = saucer.R;
    c.globalCompositeOperation = 'lighter';
    glow(c, [170, 150, 255], 0, R0 * 0.3, R0 * 1.6, R0 * 0.8, 0.22 * night + 0.1);
    c.globalCompositeOperation = 'source-over';
    // (leaving: a short streak — the hull drawn a few times back along its path, fading)
    if (st.craft.out > 0.05) for (let i = 3; i >= 1; i--) { c.globalAlpha = 0.18 * st.craft.out / i; c.drawImage(saucer.cv, -saucer.w / 2 - i * 14 / sa.s, -saucer.oy + i * 6 / sa.s, saucer.w, saucer.h); }
    c.globalAlpha = 1; c.drawImage(saucer.cv, -saucer.w / 2, -saucer.oy, saucer.w, saucer.h);
    c.globalCompositeOperation = 'lighter';
    // the emitter rings: on softly while it hovers, white-hot with the beam
    const e = 0.25 + 0.75 * beamK;
    for (const [rr, a] of [[0.62, 0.45], [0.46, 0.65], [0.3, 0.9]]) { c.globalAlpha = a * e; c.strokeStyle = 'rgb(214,200,255)'; c.lineWidth = R0 * 0.03; c.beginPath(); c.ellipse(0, R0 * 0.08, R0 * rr, R0 * rr * 0.26, 0, 0, TAU); c.stroke(); }
    glow(c, [236, 240, 255], 0, R0 * 0.09, R0 * 0.42, R0 * 0.12, 0.85 * e);
    glow(c, [255, 255, 255], 0, R0 * 0.09, R0 * 0.2, R0 * 0.06, e);
    // THE RIM LIGHTS: 16 evenly spaced round the rim, chasing
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (mo ? t * 0.9 : 0), ex = Math.cos(a) * R0 * 0.985, ey = Math.sin(a) * R0 * 0.235 + R0 * 0.012;
      const ch = mo ? Math.pow(0.5 + 0.5 * Math.cos(a * 2 - t * 4.2), 3) : 0.5, col = i % 2 ? [255, 236, 200] : [210, 196, 255];
      const front = Math.sin(a) > -0.15 ? 1 : 0.55;
      glow(c, col, ex, ey, R0 * 0.07, R0 * 0.045, (0.35 + 0.65 * ch) * front * 0.8);
      c.globalAlpha = (0.55 + 0.45 * ch) * front; c.fillStyle = rgb(mix(col, [255, 255, 255], 0.5)); c.beginPath(); c.ellipse(ex, ey, R0 * 0.018, R0 * 0.012, 0, 0, TAU); c.fill();
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // its glow on the water under it (the water draws its own reflection column)
    if (env && env.waterLight && sa.s > 0.6) env.waterLight(sa.x, sa.y, [190, 180, 255], 0.5 * (0.4 + 0.6 * beamK), R0 * 0.5);
  }

  return {
    /** the layout: the camera, the lanes, the compass on the screen, the band above the crowns */
    layout(l, o) {
      L = l; cam = l.cam; W = cam.W; H = cam.H; lanes = l.lanes; dpr = o.dpr || dpr;
      const m = l.medallion; const [mx, my] = project(cam, m.x, 0, m.z); med = { x: mx, y: my };
      bandY0 = lanes && lanes['sky-low'] ? (lanes['sky-low'].y0NoTag != null ? lanes['sky-low'].y0NoTag : lanes['sky-low'].y) + 6 : H * 0.3;
      crown = o.crown || (lanes && lanes['sky-low'] ? lanes['sky-low'].y + lanes['sky-low'].h : H * 0.45);
      sizeKey = ''; jets.setDpr(dpr);
    },
    setTier(t) { if (t !== tier) { tier = t; sizeKey = ''; } },
    /** THE PREVIEW PANEL: the forced one's first run starts at the panel's moment (every phone the same) */
    remote(at, gone = [], came = []) { for (const id of came) if (id === 'ufo' || id === 'tr3b') { firstAt.set(id, at); lastForce = 0; } for (const id of gone) if (run && run.kind === id) run = null; },
    tick,
    /** what runs: { kind, s, st, dir } or null */
    state: () => (run && st ? { kind: run.kind, s: sNow, st, dir: run.dir } : null),
    power, drainCols,
    /** the sky pass (after the clouds, before the city's layers): the TR-3B + the chase */
    sky: (c, fs) => drawTr3b(c, fs),
    /** the near pass (after the people on the promenade, before the front row): the abduction */
    near: (c, fs, env) => drawUfo(c, fs, env),
    /** the API: start one now (or at `at`) */
    start(kind, at, o = {}) { if (kind !== 'ufo' && kind !== 'tr3b') return false; run = { kind, at, dir: o.dir || 1, forced: false }; return true; },
    stop() { run = null; st = null; },
    /** the sounds (sounds.js reads it ~4× a second) */
    listen: () => (run && st ? { kind: run.kind, s: sNow, st, dir: run.dir, x: run.kind === 'ufo' ? (saucer ? saucerAt().x / W : 0.6) : st.x } : null),
    /** the sign's glitch while the TR-3B passes under it: a level 0..1 (or null) */
    signGlitch() {
      if (!st || run.kind !== 'tr3b' || st.drain < 0.2) return null;
      if (Math.abs(st.x - 0.5) > 0.5) return null;
      const t = performance.now() / 1000, n = hash01(7, Math.floor(t * 9));
      return n < 0.4 ? 0.15 + 0.3 * n : 0.6 + 0.3 * n;
    },
    busy: () => !!run,
    debug: () => ({ run: run ? { ...run } : null, s: +sNow.toFixed(2), phase: st ? st.phase : null }),
    destroy() { for (const s of [saucer, beam, tri]) if (s) s.cv.width = 0; jets.destroy(); },
  };
}
