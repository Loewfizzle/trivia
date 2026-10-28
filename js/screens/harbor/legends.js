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
import { GIANT } from '../../core/harbor-holidayprops.js';
import { ufoAt, tr3bAt, legendAt, legendNight, tr3bDir, eveningOf, drainAt, blackAt, blackAll, CHASE, chaseX, chasePeakS, FORMATIONS, UFO_LEN, TR3B_LEN } from '../../core/harbor-legend.js';
import { lookOf, drawFolk } from './folk.js';
import { createJets, jetLook } from './jets.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { loadUfoModel, rowsAt, frameAt, drawBody, drawLights, portsAt } from './ufo-model.js';

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

// ================================================================== THE SAUCER (baked once per size: the hull; the light + the ring live)
// 11a-2 — THE REDESIGN (the owner, Oct 26: "it reads cartoonish today, the underside especially"): a heavy GUNMETAL saucer, RENDERED per
// pixel — a lens of anodised, lathe-brushed metal seen a little from above, every pixel its own normal reflecting the night it faces
// (the sky dark overhead, the CITY's neon smeared along the horizon band, the MOON a crisp spot), through a metal's Fresnel (gunmetal
// F0 ~0.5, cool), the brushing a fine concentric grain, a soft specular band from the city's glow; panel SEAMS cut into it (a dark
// line + a hair of light); no flat colours, no outlines. A SMOKED glass dome (dark, a faint inner glow, one crisp highlight). THE BELLY
// IS NEVER SEEN: the scene pours a strong soft glow out from under the rim into the beam (live). The rim's band carries the RACING
// RING (live: ice-white slots lit in sequence).
const SAUCER_OY = 0.5;                                          // (the rim's centre down the sprite, of its height)
const SAUCER_E = 14 * Math.PI / 180;                             // (we see it a little from above: the upper hull + the city in it)
const NEON_REF = [[255, 70, 180], [60, 210, 255], [255, 176, 70], [190, 120, 255], [120, 255, 170]];
/** the night the hull reflects: a direction r (y up, z away) → [r, g, b] (0..255+) */
function nightEnv(r) {
  const el = Math.asin(Math.max(-1, Math.min(1, r[1]))), az = Math.atan2(r[0], r[2]);
  let c;
  if (el > 0) c = mix([72, 66, 112], [22, 26, 50], smooth(0.05, 0.95, el));                      // (the sky: the city's glow low, dark overhead)
  else c = mix([34, 28, 44], [8, 8, 14], smooth(0, 0.35, -el));                                  // (the street below: dark)
  // THE CITY round it (the towers behind us + across the water rise well up into the hull's view): a warm magenta glow band, then the
  // towers' NEON signs as coloured smears at their own heights + directions — the upper hull carries them as soft streaks
  // (the upper hull's slope reflects the sky AHEAD of it, ~20–40° up: the skyline across the water + its signs live there)
  const hb = Math.exp(-(((el - 0.3) / 0.28) ** 2)) * (0.55 + 0.45 * Math.cos(az));
  c = c.map((v, i) => v + hb * [120, 80, 130][i]);
  for (let k = 0; k < 9; k++) {
    const col = NEON_REF[k % NEON_REF.length], a0 = -1.25 + k * 0.31 + 0.12 * hash01(k, 3), e0 = 0.22 + 0.4 * hash01(k, 5);
    const da = Math.atan2(Math.sin(az - a0), Math.cos(az - a0)), w = Math.exp(-((da / 0.07) ** 2) - (((el - e0) / 0.035) ** 2));
    for (let i = 0; i < 3; i++) c[i] += col[i] * w * 1.3;
  }
  // the city's scattered lights below the horizon (warm specks)
  if (el < -0.02 && el > -0.5) { const sp = hash01(Math.floor((az + 4) * 60), Math.floor(-el * 90)); if (sp > 0.93) c = c.map((v, i) => v + [255, 200, 140][i] * 0.5 * (1 + el * 2)); }
  // THE MOON (high, behind us on the left): a crisp bright spot + its halo
  const M = [-0.42, 0.62, 0.66], ml = Math.hypot(...M), md = (r[0] * M[0] + r[1] * M[1] + r[2] * M[2]) / ml;
  if (md > 0.95) c = c.map((v, i) => v + [255, 250, 232][i] * (Math.exp(-((1 - md) / 0.0025)) * 2.6 + Math.exp(-((1 - md) / 0.02)) * 0.35));
  return c;
}
function saucerSprite(sw, dpr) {
  const R = sw / 2, W = sw * 1.12, H = sw * 0.62, d = Math.min(2.5, Math.max(1.5, dpr));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  const w = Math.ceil(W * d), h = Math.ceil(H * d), img = x.createImageData(w, h), D = img.data;
  const ce = Math.cos(SAUCER_E), se = Math.sin(SAUCER_E), dir = [0, -se, ce], ox = w / 2, oy = h * SAUCER_OY;
  // the shape (object units: R = 1; y up, z away): the upper hull + a raised collar where the dome sits, the rim's band, the lower hull
  const hu = 0.2, hl = 0.15, band = 0.026, rd = 0.27, dc = [0, hu * 0.86, 0];
  const top = u => (u >= 1 ? -1 : hu * Math.pow(1 - u * u, 0.78) + 0.018 * Math.exp(-(((u - 0.33) / 0.03) ** 2)) + band * smooth(0.985, 0.955, u) * 0);
  const bot = u => (u >= 1 ? 1 : -hl * Math.pow(1 - u * u, 0.62));
  const inside = (p) => { const u = Math.hypot(p[0], p[2]); if (u > 1) return false; const yt = Math.max(top(u), u > 0.955 ? band : -1), yb = Math.min(bot(u), u > 0.955 ? -band : 1); return p[1] <= yt && p[1] >= yb; };
  const inDome = p => Math.hypot(p[0] - dc[0], p[1] - dc[1], p[2] - dc[2]) < rd && p[1] > dc[1] - rd * 0.2;
  const nTop = (px, pz) => { const e = 0.002, u = Math.hypot(px, pz), f = (a, b) => top(Math.hypot(a, b)); const dx = (f(px + e, pz) - f(px - e, pz)) / (2 * e), dz = (f(px, pz + e) - f(px, pz - e)) / (2 * e); void u; const l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };
  const KEY = (() => { const k = [-0.5, 0.75, -0.45], l = Math.hypot(...k); return k.map(v => v / l); })();
  const F0 = [0.62, 0.65, 0.7], KEY2 = (() => { const k = [-0.22, 0.9, -0.38], l = Math.hypot(...k); return k.map(v => v / l); })();
  for (let j = 0; j < h; j++) {
    const U = (oy - j - 0.5) / (d * R);
    for (let i = 0; i < w; i++) {
      const X = (i + 0.5 - ox) / (d * R);
      if (Math.abs(X) > 1.02) continue;
      // the ray: p = X·x̂ + U·(0, ce, se) + t·dir — march from in front of the craft back through it
      const p0 = [X, U * ce, U * se];
      let hit = null, kind = '';
      // (only where the ray can meet it: inside the hull's cylinder (ρ ≤ 1) + between its lowest + highest points)
      const zr = Math.sqrt(Math.max(0, 1 - X * X)), ta = (-zr - p0[2]) / dir[2], tb = (zr - p0[2]) / dir[2];
      const tc = (p0[1] - (dc[1] + rd)) / se, td = (p0[1] + hl + 0.01) / se;
      const tA = Math.max(Math.min(ta, tb), Math.min(tc, td)), tB = Math.min(Math.max(ta, tb), Math.max(tc, td));
      for (let t = tA; t < tB; t += 0.006) {
        const p = [p0[0], p0[1] + dir[1] * t, p0[2] + dir[2] * t];
        if (inDome(p)) { hit = p; kind = 'dome'; break; }
        if (inside(p)) { hit = p; kind = 'hull'; break; }
      }
      if (!hit) continue;
      const u = Math.hypot(hit[0], hit[2]), az = Math.atan2(hit[0], -hit[2]);
      let n, col;
      if (kind === 'dome') {
        n = [(hit[0] - dc[0]) / rd, (hit[1] - dc[1]) / rd, (hit[2] - dc[2]) / rd];
      } else if (u > 0.955 && Math.abs(hit[1]) <= band + 0.002) {
        n = [hit[0] / u, 0, hit[2] / u];                                                 // (the rim's band: vertical)
      } else if (hit[1] >= 0) n = nTop(hit[0], hit[2]);
      else { const e = 0.002, f = (a, b) => bot(Math.hypot(a, b)), dx = (f(hit[0] + e, hit[2]) - f(hit[0] - e, hit[2])) / (2 * e), dz = (f(hit[0], hit[2] + e) - f(hit[0], hit[2] - e)) / (2 * e), l = Math.hypot(dx, 1, dz); n = [dx / l, -1 / l, dz / l]; }
      const vd = [-dir[0], -dir[1], -dir[2]], ndv = Math.max(0, n[0] * vd[0] + n[1] * vd[1] + n[2] * vd[2]);
      const rr = [dir[0] - 2 * (dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2]) * n[0], dir[1] - 2 * (dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2]) * n[1], dir[2] - 2 * (dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2]) * n[2]];
      if (kind === 'dome') {
        // SMOKED GLASS: dark, the night reflected weakly (a glass Fresnel), a faint cool glow inside low in the dome, ONE crisp highlight
        const fr = 0.06 + 0.94 * Math.pow(1 - ndv, 5), env = nightEnv(rr);
        const inner = Math.exp(-(((hit[1] - dc[1] - rd * 0.05) / (rd * 0.45)) ** 2 + (hit[0] / (rd * 0.7)) ** 2));
        col = [14, 17, 24].map((v, k) => v + env[k] * fr * 1.1 + [70, 130, 140][k] * inner * 0.45);
        const hl2 = Math.pow(Math.max(0, rr[0] * KEY2[0] + rr[1] * KEY2[1] + rr[2] * KEY2[2]), 700);
        col = col.map(v => v + 255 * hl2 * 1.4);
      } else {
        // GUNMETAL: the night it faces through a metal's Fresnel, cool; the brushing's grain (concentric), a soft specular band (the
        // key light from the city's glow, broad), the creases between the hull + the band darker
        const env = nightEnv(rr), fr = F0.map(f => f + (1 - f) * Math.pow(1 - ndv, 5));
        const grain = 1 + 0.1 * (hash01(Math.floor(u * 260), 7) - 0.5) + 0.05 * Math.sin(u * 900);
        const kd = Math.max(0, rr[0] * KEY[0] + rr[1] * KEY[1] + rr[2] * KEY[2]), spec = Math.pow(kd, 10) * 0.85 + Math.pow(kd, 60) * 0.6;
        // (gunmetal: the reflected night a little desaturated + cooled — the neon keeps its colour, the sky's violet doesn't tint the metal)
        const lum = (env[0] + env[1] + env[2]) / 3, envG = env.map((v, k) => (v * 0.6 + lum * 0.4) * [0.9, 0.95, 1.04][k]);
        col = envG.map((v, k) => (v * fr[k] * grain + 16 + spec * [210, 214, 230][k]));
        // PANEL SEAMS: two rings + radial seams between them (a dark cut + a hair of light on its far side)
        const pxu = 1 / (d * R);
        const seam = s => clamp01(1 - Math.abs(s) / (pxu * 0.9));
        let cut = 0, lip = 0;
        if (hit[1] > 0) {
          for (const ru of [0.5, 0.78]) { cut = Math.max(cut, seam(u - ru)); lip = Math.max(lip, seam(u - ru - pxu * 1.4)); }
          if (u > 0.5 && u < 0.955) for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU, da = Math.atan2(Math.sin(az - a), Math.cos(az - a)) * u; cut = Math.max(cut, seam(da)); }
          if (u > 0.36 && u < 0.5) for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + 0.17, da = Math.atan2(Math.sin(az - a), Math.cos(az - a)) * u; cut = Math.max(cut, seam(da)); }
        }
        if (u > 0.95 && u < 0.962 && hit[1] > 0) cut = Math.max(cut, 0.8);           // (where the hull meets the band)
        col = col.map((v, k) => v * (1 - 0.72 * cut) + 60 * lip * [1, 1.02, 1.08][k]);
      }
      const p4 = (j * w + i) * 4;
      D[p4] = Math.min(255, col[0]); D[p4 + 1] = Math.min(255, col[1]); D[p4 + 2] = Math.min(255, col[2]); D[p4 + 3] = 255;
    }
  }
  // (anti-aliasing: one soft pass over the silhouette — a pixel next to an empty one takes a share of its emptiness)
  const A = new Uint8ClampedArray(w * h); for (let p = 0; p < w * h; p++) A[p] = D[p * 4 + 3];
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const p = j * w + i; if (!A[p]) continue; const nb = (A[p - 1] ? 1 : 0) + (A[p + 1] ? 1 : 0) + (A[p - w] ? 1 : 0) + (A[p + w] ? 1 : 0); if (nb < 4) D[p * 4 + 3] = 255 * (0.45 + 0.13 * nb); }
  x.putImageData(img, 0, 0);
  // (the rim's centre on screen: the ring's slots + the belly's glow are placed from it; `by` the belly's glow centre below it)
  return { cv, w: W, h: H, oy: H * SAUCER_OY, R, by: R * (se * 0.98 + 0.07), band, se };
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
      // (POLISH 4, the owner: "more concentrated in the centre" — a bright CORE down the axis over the soft body, fading to the edges)
      const edge = 1 - smooth(0.3, 1.3, a), core = Math.exp(-(s * s) / 0.075);
      const r = ray[Math.min(255, Math.max(0, Math.round((s * 0.5 + 0.5) * 255)))];
      const k = Math.min(1.1, (0.84 * edge * r + 0.5 * core * (0.85 + 0.15 * r)) * vert);
      if (k <= 0.003) continue;
      // the colour: pale cyan-white in the core, faint violet toward the left edge, faint teal-pink right, warmer low down
      const side = Math.max(-1, Math.min(1, s));
      // (11a-2 — the owner: the classic tractor beam's PALE GREEN: the core near white, the body a soft green, cooler at the edges)
      let R = 164, G = 255, B = 192;
      R -= Math.abs(side) * 22; B += Math.abs(side) * 6;
      R += core * 34; B += core * 22;                                     // (the core paler — still green)
      R -= u * 8;
      const i4 = (yy * w + xx) * 4;
      D[i4] = R; D[i4 + 1] = G; D[i4 + 2] = B; D[i4 + 3] = Math.min(255, k * 235);
    }
  }
  x.putImageData(img, 0, 0);
  return { cv, w: w / d, h: len };
}

// ================================================================== THE TR-3B (baked once per size, ahead of its night — never on the
// frame it comes on screen; POLISH 4: ~15 % smaller, a MATTE radar-absorbent skin with a subtle sheen, ENGRAVED panel seams (a dark
// cut + a hair of light under it), SAWTOOTH edge panels, the recessed corner pods, the central HUB (its bevel, vents, the emitter's
// lens); the lights + the rim of the city's glow are live)
let noiseC = null;
function noiseTile() {
  if (noiseC) return noiseC;
  const n = 96, cv = mk(n, n), x = safeCtx(cv), img = x.createImageData(n, n), D = img.data;
  for (let i = 0; i < n * n; i++) { const v = 128 + (hash01(i, 5) - 0.5) * 90 + (hash01(i >> 3, 9) - 0.5) * 40; D[i * 4] = D[i * 4 + 1] = D[i * 4 + 2] = v; D[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  return (noiseC = cv);
}
function tr3bSprite(len, dpr) {
  const W = len * 1.2, H = len * 0.62, d = Math.min(2.5, Math.max(1.5, dpr));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, (W * 0.45) * d, (H * 0.47) * d);      // (the origin = the triangle's CENTRE: the hub + the red orb sit there)
  // seen from below as it crosses: the nose toward +x (the flight), the far rear corner up, the near one down (flattened by the view)
  const P = tr3bCorners(len), at = (p, k) => [p[0] * k, p[1] * k];
  const path = (k = 1, r = len * 0.035) => {
    const n = P.length, Q = P.map(p => at(p, k));
    x.beginPath();
    for (let i = 0; i < n; i++) {
      const a = Q[(i + n - 1) % n], b = Q[i], cN = Q[(i + 1) % n];
      const la = Math.hypot(a[0] - b[0], a[1] - b[1]), lc = Math.hypot(cN[0] - b[0], cN[1] - b[1]);
      const ux = (a[0] - b[0]) / la, uy = (a[1] - b[1]) / la, vx = (cN[0] - b[0]) / lc, vy = (cN[1] - b[1]) / lc;
      if (i === 0) x.moveTo(b[0] + ux * r, b[1] + uy * r); else x.lineTo(b[0] + ux * r, b[1] + uy * r);
      x.quadraticCurveTo(b[0], b[1], b[0] + vx * r, b[1] + vy * r);
    }
    x.closePath();
  };
  // an ENGRAVED line: the cut (dark) + a hair of light just under it (the lip catching what light there is)
  const lw = Math.max(0.35, len * 0.0032);
  const cut = (draw, a = 1) => {
    x.strokeStyle = `rgba(0,0,0,${0.62 * a})`; x.lineWidth = lw * 1.3; x.beginPath(); draw(); x.stroke();
    x.save(); x.translate(0, lw * 1.1); x.strokeStyle = `rgba(150,140,180,${0.16 * a})`; x.lineWidth = lw * 0.8; x.beginPath(); draw(); x.stroke(); x.restore();
  };
  // ITS THICKNESS: the hull's side wall along the near edges (gunmetal, darker down its face) + the bevel's lit lip
  x.save(); x.translate(0, len * 0.034); path();
  let g = x.createLinearGradient(0, -len * 0.1, 0, len * 0.26); g.addColorStop(0, 'rgb(30,28,38)'); g.addColorStop(1, 'rgb(14,13,19)');
  x.fillStyle = g; x.fill(); x.restore();
  x.save(); x.translate(0, len * 0.017); path(); x.fillStyle = 'rgb(20,18,26)'; x.fill(); x.restore();
  x.save(); x.translate(0, len * 0.034); x.strokeStyle = 'rgba(120,112,140,0.28)'; x.lineWidth = lw; x.beginPath(); x.moveTo(P[0][0] - len * 0.03, P[0][1] + len * 0.006); x.lineTo(P[2][0] + len * 0.02, P[2][1] - len * 0.004); x.stroke(); x.restore();
  // THE BELLY: matte near-black (radar-absorbent), a little lighter toward the near edge
  path();
  g = x.createLinearGradient(0, -len * 0.22, 0, len * 0.24);
  g.addColorStop(0, 'rgb(9,9,13)'); g.addColorStop(0.55, 'rgb(14,13,19)'); g.addColorStop(1, 'rgb(22,19,28)');
  x.fillStyle = g; x.fill();
  x.save(); path(); x.clip();
  // the skin's grain (a fine noise, barely there) + the SHEEN: one broad soft band across it (matte, never glossy)
  x.globalAlpha = 0.055; x.globalCompositeOperation = 'overlay';
  const pat = x.createPattern(noiseTile(), 'repeat'); x.fillStyle = pat; x.save(); x.scale(1 / d, 1 / d); x.fillRect(-W * d, -H * d, W * d * 2, H * d * 2); x.restore();
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  g = x.createLinearGradient(-len * 0.4, -len * 0.2, len * 0.35, len * 0.2);
  g.addColorStop(0, 'rgba(160,150,200,0)'); g.addColorStop(0.42, 'rgba(160,150,200,0)'); g.addColorStop(0.55, 'rgba(160,150,200,0.075)'); g.addColorStop(0.68, 'rgba(160,150,200,0)'); g.addColorStop(1, 'rgba(160,150,200,0)');
  x.fillStyle = g; x.fillRect(-W, -H, W * 2, H * 2);
  // THE PANELS: the outer band's edge (an inset outline), a second band, the spars from the hub to the corners, cross seams
  cut(() => { const Q = P.map(p => at(p, 0.86)); x.moveTo(Q[0][0], Q[0][1]); x.lineTo(Q[1][0], Q[1][1]); x.lineTo(Q[2][0], Q[2][1]); x.closePath(); });
  cut(() => { const Q = P.map(p => at(p, 0.6)); x.moveTo(Q[0][0], Q[0][1]); x.lineTo(Q[1][0], Q[1][1]); x.lineTo(Q[2][0], Q[2][1]); x.closePath(); }, 0.8);
  for (const p of P) cut(() => { x.moveTo(p[0] * 0.2, p[1] * 0.2); x.lineTo(p[0] * 0.6, p[1] * 0.6); }, 0.85);
  // cross seams: each band split into panels (lines from the inner outline to the outer one, square to the edge)
  for (let e = 0; e < 3; e++) {
    const A = P[e], B = P[(e + 1) % 3];
    for (const f of [0.22, 0.4, 0.6, 0.78]) cut(() => { const ax = lerp(A[0], B[0], f), ay = lerp(A[1], B[1], f); x.moveTo(ax * 0.6, ay * 0.6); x.lineTo(ax * 0.86, ay * 0.86); }, 0.6);
    // the SAWTOOTH panels round the rim (the stealth edge: teeth between the band's outline and the edge)
    cut(() => {
      const n = 9;
      for (let t = 0; t <= n * 2; t++) {
        const f = 0.05 + 0.9 * t / (n * 2), k = t % 2 ? 0.95 : 0.88, px = lerp(A[0], B[0], f) * k, py = lerp(A[1], B[1], f) * k;
        if (t) x.lineTo(px, py); else x.moveTo(px, py);
      }
    }, 0.7);
  }
  // small access hatches near each corner pod
  for (const p of P) {
    const cx = p[0] * 0.66, cy = p[1] * 0.66;
    cut(() => { x.rect(cx - len * 0.022, cy - len * 0.008, len * 0.044, len * 0.016); }, 0.55);
  }
  // THE CORNER PODS: recessed, a bevel ring lit on its lower lip, a dark glass lens (the orb lights it live)
  for (const p of P) {
    const cx = p[0] * 0.8, cy = p[1] * 0.8, rx = len * 0.05, ry = len * 0.021;
    x.fillStyle = 'rgb(6,6,9)'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(140,130,165,0.32)'; x.lineWidth = lw; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0.1, Math.PI - 0.1); x.stroke();
    g = x.createRadialGradient(cx, cy - ry * 0.3, 0, cx, cy, rx * 0.7); g.addColorStop(0, 'rgb(70,64,62)'); g.addColorStop(1, 'rgb(16,15,18)');
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, TAU); x.fill();
  }
  // THE HUB: a wide bevelled ring, a ring of vents, the recess, the emitter's lens (deep red-black — the glow is live)
  { const rx = len * HUB_R, ry = rx * 0.4;
    g = x.createLinearGradient(0, -ry, 0, ry); g.addColorStop(0, 'rgb(12,11,15)'); g.addColorStop(1, 'rgb(34,31,40)');
    x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(150,140,175,0.34)'; x.lineWidth = lw; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0.15, Math.PI - 0.15); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = lw * 1.4; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, Math.PI + 0.1, TAU - 0.1); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.75)'; x.lineWidth = lw * 1.2;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU, c0 = Math.cos(a), s0 = Math.sin(a); x.beginPath(); x.moveTo(c0 * rx * 0.74, s0 * ry * 0.74); x.lineTo(c0 * rx * 0.93, s0 * ry * 0.93); x.stroke(); }
    x.fillStyle = 'rgb(7,6,9)'; x.beginPath(); x.ellipse(0, 0, rx * 0.68, ry * 0.68, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(140,120,140,0.3)'; x.lineWidth = lw * 0.8; x.beginPath(); x.ellipse(0, 0, rx * 0.68, ry * 0.68, 0, 0.2, Math.PI - 0.2); x.stroke();
    g = x.createRadialGradient(0, 0, 0, 0, 0, rx * 0.46); g.addColorStop(0, 'rgb(84,22,14)'); g.addColorStop(0.7, 'rgb(36,10,8)'); g.addColorStop(1, 'rgb(14,6,6)');
    x.fillStyle = g; x.save(); x.scale(1, 0.4); x.beginPath(); x.arc(0, 0, rx * 0.46, 0, TAU); x.fill(); x.restore(); }
  x.restore();
  // THE CIRCUITRY (POLISH 4, the owner: "glowing circuitry traces etched across the black hull" — alien tech): each trace an etched
  // groove with a faint teal glow in it + its pads; the pulses racing along them are live (drawTr3b)
  x.save(); path(); x.clip();
  for (const tr of circuit(len)) {
    const go = () => { tr.pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); };
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = lw * 2.1; x.beginPath(); go(); x.stroke();
    x.strokeStyle = 'rgba(90,220,255,0.26)'; x.lineWidth = lw * 0.9; x.beginPath(); go(); x.stroke();
    x.fillStyle = 'rgba(110,232,255,0.32)';
    for (const [a, b] of tr.vias) { x.beginPath(); x.arc(a, b, lw * 1.1, 0, TAU); x.fill(); }
    const [ea, eb] = tr.pts[tr.pts.length - 1]; x.fillStyle = 'rgba(0,0,0,0.8)'; x.fillRect(ea - lw * 1.8, eb - lw * 1.2, lw * 3.6, lw * 2.4);
    x.fillStyle = 'rgba(110,232,255,0.35)'; x.fillRect(ea - lw * 1.1, eb - lw * 0.7, lw * 2.2, lw * 1.4);
  }
  x.restore();
  return { cv, w: W, h: H, ox: W * 0.45, oy: H * 0.47 };
}
/** the TR-3B's corners (pt, its centre at 0; the nose toward +x): the nose, the far rear (up), the near rear (down) */
// (POLISH 4, the owner: "the red orb in the DEAD CENTRE of the triangle" — the corners about its CENTROID (the balance point: it reads
// as the centre to the eye — the incenter, equidistant from the edges, sat too far back toward the wide end: the owner's pick), so the
// hub, the orb, the inset outlines + the pods sit there)
const tr3bCorners = len => [[len * 0.5933, 0], [-len * 0.3267, -len * 0.205], [-len * 0.2667, len * 0.205]];
/** the hub's radius (of the length): inside the 0.163 to every edge with room for its bevel */
const HUB_R = 0.135;
/** THE CIRCUITRY's traces (len pt): routed on the hull's own plane — in the seen triangle UN-flattened (y ÷ 0.4, the hub's own
 *  ellipse a circle) along the 8 compass directions with seeded 45° turns, out from round the hub (+ a family starting mid-hull and
 *  running round it), never into the hub, inside the rim band; then flattened back → [{ pts: [[x, y]…], vias, len, cum, ph, sp }] */
const FLAT = 0.4;
const circCache = new Map();
function circuit(len) {
  const key = Math.round(len); if (circCache.has(key)) return circCache.get(key);
  const S = tr3bCorners(1);
  // inside the triangle scaled by k about the centre (the edges' half-planes, the centre on their inner side)
  const edges = S.map((A, i) => { const B = S[(i + 1) % 3], nx = B[1] - A[1], ny = A[0] - B[0], c = nx * A[0] + ny * A[1]; return { nx, ny, c }; });
  const inside = (q, k) => { const x0 = q[0], y0 = q[1] * FLAT; return edges.every(e => Math.sign(e.c) * (e.nx * x0 + e.ny * y0) <= Math.abs(e.c) * k); };
  const map = ([x0, y0]) => [x0 * len, y0 * FLAT * len];
  const out = [], N = 24;
  for (let i = 0; i < N; i++) {
    const ring = i >= 16, a = ((ring ? i - 16 : i) / (ring ? 8 : 16)) * TAU + (hash01(i, 61) - 0.5) * 0.35 + (ring ? 0.2 : 0);
    let dir = (Math.round(a / (Math.PI / 4)) + (ring ? 2 : 0)) & 7;
    const r0 = ring ? 0.3 : HUB_R + 0.025;
    let p = [Math.cos(a) * r0, Math.sin(a) * r0];
    if (!inside(p, 0.84)) continue;
    const pts = [p], vias = [], viaK = [], maxL = 0.28 + 0.4 * hash01(i, 63);
    let L = 0;
    for (let k = 0; k < 12 && L < maxL; k++) {
      const seg = 0.03 + 0.06 * hash01(i, 70 + k), da = dir * Math.PI / 4, q = [p[0] + Math.cos(da) * seg, p[1] + Math.sin(da) * seg];
      if (!inside(q, 0.84) || Math.hypot(q[0], q[1]) < HUB_R + 0.015) break;          // (never into the hub)
      p = q; pts.push(p); L += seg;
      const r = hash01(i, 90 + k);
      if (r < 0.52) { dir = (dir + (r < 0.26 ? 1 : 7)) & 7; vias.push(p); viaK.push(pts.length - 1); }
    }
    if (pts.length < 2) continue;
    const sp = pts.map(map);
    let tl = 0; const cum = [0]; for (let k = 1; k < sp.length; k++) { tl += Math.hypot(sp[k][0] - sp[k - 1][0], sp[k][1] - sp[k - 1][1]); cum.push(tl); }
    out.push({ pts: sp, vias: vias.map(map), viaD: viaK.map(k => cum[k]), len: tl, cum, ph: hash01(i, 99), sp: 0.7 + 0.6 * hash01(i, 101) });
  }
  circCache.set(key, out);
  return out;
}
/** a point + the one a little behind it along a trace (dist from its start, pt) */
function along(tr, d) {
  const c = tr.cum; let k = 1; while (k < c.length - 1 && c[k] < d) k++;
  const u = Math.max(0, Math.min(1, (d - c[k - 1]) / Math.max(1e-6, c[k] - c[k - 1])));
  return [tr.pts[k - 1][0] + (tr.pts[k][0] - tr.pts[k - 1][0]) * u, tr.pts[k - 1][1] + (tr.pts[k][1] - tr.pts[k - 1][1]) * u, k];
}
/** the edge lights: small lamps along each edge (the edge, the place along it 0..1) — a slow pulse running toward the nose */
const EDGE_LAMPS = (() => { const o = []; for (let e = 0; e < 3; e++) for (let k = 0; k < 7; k++) o.push({ e, f: 0.12 + 0.76 * k / 6 }); return o; })();

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
  // SP6 — THE SPOT (the owner: the person rose from INSIDE the giant ₿ pumpkin): when a holiday CENTREPIECE stands on the compass the whole
  // abduction — the walker, the beam, the craft — happens BESIDE it, just past its walk-around ring (GIANT.clear) on the walker's side;
  // the walk is TRANSLATED, never changed (the pose, the lift + the timing untouched). The side with room for the craft: right of it (the
  // walker's own side) when the saucer fits on screen there, else left (the walk-in mirrored: in from the left, never through the piece)
  const SPOT_OFF = GIANT.clear + 1.3;
  let medC = null, medS = null, spotX = 0, spotSide = 1;
  let saucer = null, beam = null, tri = null, sizeKey = '', sR = 0;   // (sR: the hull's radius in pt — the hand-drawn saucer's or the model's)
  let ringPh = 0, ringT = null, ringW = 0, ringTaken = 0;   // (11a-2: the racing ring's phase, integrated so its speed can change smoothly)
  // THE CRAFT FROM A REAL MODEL (sebslom's "UFO", baked: ufo-model.js) — fetched when an abduction is due; &ufo=classic = the hand-drawn
  // saucer (also the stand-in while the sprites load, from 4 s in, or if they fail)
  let model = null, modelState = qp && qp.get('ufo') === 'classic' ? 'classic' : 'off', spinPh = 0, spinT = null, lastElev = 0, lastFrame = -1, lastCraft = null, modelT0 = 0;
  function wantModel() {
    if (modelState !== 'off') return;
    modelState = 'loading'; modelT0 = performance.now();
    loadUfoModel().then(m => { model = m; modelState = 'ready'; }, () => { modelState = 'failed'; });
  }
  const jets = createJets();
  // the run: { kind, at (clock ms it began), dir, seed, forced }
  let run = null, st = null, sNow = 0, lastForce = 0, firstAt = new Map();
  let motes = [];
  const lookFig = lookOf('night', 1924 * 7, { season: 'autumn' });

  function sizes() {
    const sw = Math.min(W * 0.37, 168), key = `${Math.round(sw)}|${dpr}|${Math.round(W)}|${Math.round(hoverY())}|${Math.round(med.y)}`;
    if (key === sizeKey) return;
    sizeKey = key;
    for (const s of [saucer, beam]) if (s) { s.cv.width = 0; if (s.mask) s.mask.width = 0; }
    sR = sw / 2;
    saucer = modelState === 'classic' || modelState === 'failed' ? saucerSprite(sw, dpr) : null;
    const top = sw * 0.5, len = Math.max(60, med.y - hoverY() - sw * 0.06), bot = sw * 1.12;
    beam = beamSprite(top, bot, len, dpr);
    motes = [];
    const n = tier === 2 ? 70 : tier === 1 ? 44 : 22;
    for (let i = 0; i < n; i++) motes.push({ a: (hash01(i, 3) - 0.5) * 1.7, ph: hash01(i, 5), sp: 0.035 + 0.05 * hash01(i, 7), r: 0.5 + 1.1 * hash01(i, 9), down: hash01(i, 11) < 0.18, col: hash01(i, 13) < 0.3 ? [200, 180, 255] : hash01(i, 13) < 0.5 ? [180, 255, 240] : [240, 246, 255] });
  }
  // 9c — HIGHER ON SCREEN, NOT FURTHER AWAY (the owner: it got confused with the Ferris wheel / blocked it): the same nearness + size, but
  // the WHOLE craft in clear sky ABOVE the wheel's top (its belly ~0.4 hull radii under its rim + a gap), never up behind the tagline;
  // the beam simply grows longer to reach the person (sizes(): the beam's length from hoverY)
  const hoverY = () => {
    const base = Math.max((lanes && lanes['sky-low'] ? lanes['sky-low'].y + 30 : H * 0.42), med.y - Math.min(H * 0.27, 250));
    if (wheelTop == null) return base;
    const Rr = sR || Math.min(W * 0.37, 168) / 2;
    return Math.max(bandY0 + Rr * 0.85, Math.min(base, wheelTop - 10 - Rr * 0.42));
  };
  let wheelTop = null;
  // (POLISH 4: the size kept — the owner tried it again from the panel: smooth, and he likes it as it is)
  const triLen = () => Math.max(200, Math.min(W * 0.66, 420));
  let triKey = '';
  function triSizes() {
    const key = `${Math.round(triLen())}|${dpr}`;
    if (key === triKey && tri) return;
    triKey = key; if (tri) tri.cv.width = 0;
    tri = tr3bSprite(triLen(), dpr);
  }
  // PRE-BAKE (POLISH 4 — the owner's iPhone: "jaggy / laggy when it comes on screen"): the craft's sprite + the jets' are baked in
  // their own tasks as soon as a run is due (a minute ahead on a legendary night, at once for a preview), never on the frame the
  // craft first shows
  let warmT = 0, warmFor = '', jetsWarm = '';
  function warm(kind) {
    if (!L || warmFor === kind) return;
    warmFor = kind; clearTimeout(warmT);
    if (kind === 'ufo') wantModel();
    warmT = setTimeout(() => { if (!L) return; if (kind === 'tr3b') triSizes(); else sizes(); }, 30);
  }
  const chaseLen = () => Math.max(54, Math.min(W * 0.2, 119));   // (C2 — the owner: "way too big" → 15 % smaller than Oct 25's 0.235 W / 64–140 pt)

  /** the scheduled legendary now (null) or the forced one; starts / ends the run */
  function tick(fs, allow = null) {
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
      // (THE DIRECTOR: a legendary waits its turn behind a holiday / the party's peak when the phone's spectacle budget is full)
      // (11a-2: the abduction lands on the centre circle — never while a holiday centrepiece stands there: fs.centre)
      if (lg && dk > 0.55 && !fs.L.storm && !(lg.kind === 'ufo' && ((fs.L.rain || 0) > 0.2 || fs.centre)) && (!allow || allow('legend', 'legendary'))) {
        const ev = eveningOf(fs.L.local);
        run = { kind: lg.kind, at: now - lg.s * 1000, dir: tr3bDir(ev.y, ev.m, ev.d), forced: false };
      }
    }
    if (run) {
      sNow = run.forced && hold != null && isFinite(hold) ? hold : (now - run.at) / 1000;
      const len = run.kind === 'ufo' ? UFO_LEN : TR3B_LEN;
      if (sNow >= len || sNow < -1) { if (run.forced) lastForce = performance.now(); run = null; st = null; if (!forced) warmFor = ''; }
      else {
        st = run.kind === 'ufo' ? ufoAt(Math.max(0, sNow)) : tr3bAt(Math.max(0, sNow), run.dir);
        warm(run.kind);
        // (the chase's jets: their sprite baked long before they scream across)
        if (run.kind === 'tr3b' && sNow > 6 && sNow < CHASE.t0 - 2) { const lk = jetLook(fs.L), key = `${Math.round(chaseLen())}|${Math.round(lk.dark * 8)}`; if (key !== jetsWarm) { jetsWarm = key; setTimeout(() => jets.warm(chaseLen(), lk), 0); } }
      }
    } else {
      st = null;
      // (a legendary due within the minute: its craft baked now, in a task of its own)
      if (fs.L.local && !fs.L.alwaysNight && now - upAt > 2000) {
        upAt = now; const ev = eveningOf(fs.L.local), lg = legendNight(ev.y, ev.m, ev.d);
        if (lg) { const s = (ev.hr - lg.h) * 3600; if (s > -60 && s < 0) warm(lg.kind); }
      }
    }
  }
  let upAt = -1e9;

  // ---------------------------------------------------------------- THE POWER (the scene asks for each light)
  /** what's left of the power at a screen x (fraction of W) in a band ('city' | 'harbor' | 'near'), i = a light's own id (its lag +
   *  sputter) → 0..1 */
  function power(xf, band = 'city', i = 0) {
    if (!st) return 1;
    const t = performance.now() / 1000;
    // THE TR-3B: its drain's sputter round the craft as it comes in (6b — the owner liked it), then THE BLACKOUT (POLISH 4: every
    // light in the city dark through the crossing + the jets, back from the far skyline to the promenade — core/harbor-legend.js#blackAt)
    if (run.kind === 'tr3b') {
      const d = band === 'far' || band === 'sign' ? 'city' : band;
      return Math.min(drainAt(xf, st.x, st.drain, d, run.dir, hash01(i, 77), hash01(i, Math.floor(t * 11))), blackAt(Math.max(0, sNow), xf, band, run.dir, i));
    }
    // the abduction: the lights near the craft dip + stutter as it comes in and while it beams
    const k = st.lamps;
    if (k <= 0.01) return 1;
    const cx = med.x / W, d = Math.abs(xf - cx), near = 1 - smooth(0.06, band === 'near' ? 0.42 : 0.3, d);
    const depth = band === 'near' ? 0.7 : band === 'harbor' ? 0.45 : 0.18;
    const stut = hash01(i, Math.floor(t * 9)) < 0.35 ? 0.35 : 1;
    return clamp01(1 - k * near * depth * (st.phase === 'approach' ? (stut < 1 ? 1 : 0.4) : stut < 1 ? 0.9 : 0.55));
  }
  /** THE DRAIN's columns over the baked city (depth: 'far' — the skyline's far rows — or 'city', its near rows): [{ x0, x1 (pt), k
   *  (how much of the unlit facade to lay back over) }] — the TR-3B only; null when nothing is drained or the whole depth is DEAD
   *  (the scene then draws none of its lights at all: cheaper than a normal night) */
  function drainCols(depth = 'city') {
    if (!st || run.kind !== 'tr3b') return null;
    const s = Math.max(0, sNow), B = blackAll(s, depth);
    if (B.dead || (st.drain <= 0.003 && B.k <= 0.001)) return null;
    const n = Math.max(16, Math.round(W / 12)), cw = W / n, out = [], id0 = depth === 'far' ? 400 : 0;
    // (neighbours at the same level — in eighths — merge into one strip: the dead middle is one draw, not a dozen)
    for (let i = 0; i < n; i++) {
      const p = power((i + 0.5) / n, depth, id0 + i); if (p >= 0.985) continue;
      const k = Math.round((1 - p) * 8) / 8, last = out[out.length - 1];
      if (k <= 0) continue;
      if (last && last.x1 === i * cw && last.k === k) last.x1 = (i + 1) * cw; else out.push({ x0: i * cw, x1: (i + 1) * cw, k });
    }
    return out;
  }

  // ---------------------------------------------------------------- THE TR-3B + THE CHASE (the sky pass: before the city's layers)
  function triPos() {
    const y0 = bandY0, y1 = crown, yc = lerp(y0, y1, 0.6) + (y1 - y0) * 0.14 * st.dip;   // (low: against the city's glow, the tallest crowns in front of its belly)
    return { x: st.x * W, y: yc };
  }
  function drawTr3b(c, fs) {
    if (!st || run.kind !== 'tr3b') return;
    const p = triPos(), len = triLen(), dir = run.dir, t = sNow;
    if (p.x + len < -20 || p.x - len > W + 20) { drawChase(c, fs); return; }
    triSizes();                                    // (baked ahead by warm(); a no-op here unless the size changed)
    const mo = fs.motion !== false && fs.motion !== 0;
    const lit = 1 - blackAll(Math.max(0, sNow), 'city').k;      // (the city's glow under it — gone in the blackout)
    c.save(); c.translate(p.x, p.y); c.scale(dir, 1); c.rotate(-0.02);
    c.drawImage(tri.cv, -tri.ox, -tri.oy, tri.w, tri.h);
    const P = tr3bCorners(len), pulse = st.pulse;
    // THE RIM: a thin line of the city's light along its near (lower) edges while the city still glows under it; the moon's cool
    // hair along the far edge always
    c.lineCap = 'round';
    if (lit > 0.02) {
      c.strokeStyle = `rgba(214,130,200,${(0.55 * lit).toFixed(3)})`; c.lineWidth = Math.max(0.7, len * 0.0042);
      c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[2][0], P[2][1]); c.stroke();
      c.strokeStyle = `rgba(170,120,210,${(0.32 * lit).toFixed(3)})`; c.beginPath(); c.moveTo(P[2][0], P[2][1]); c.lineTo(P[1][0], P[1][1]); c.stroke();
    }
    c.strokeStyle = 'rgba(170,185,220,0.16)'; c.lineWidth = Math.max(0.5, len * 0.003);
    c.beginPath(); c.moveTo(P[1][0] * 0.98, P[1][1] * 0.98); c.lineTo(P[0][0] * 0.98, P[0][1] * 0.98); c.stroke();
    c.globalCompositeOperation = 'lighter';
    // its own red glow on the belly round the hub (the matte skin catching it — a wide, faint sheen)
    glow(c, [255, 50, 24], 0, 0, len * 0.42, len * 0.17, 0.12 + 0.1 * pulse);
    // THE CIRCUITRY's PULSES (POLISH 4, the owner's iPhone: "level up the visuals, or slow down considerably" — both): now and then a
    // pulse of energy flows SLOWLY out along a trace from the hub (each trace its own long rest + speed: a few at a time, never a
    // race), LIGHTING the trace behind it — a long trail fading back along the etched groove, a hot elongated head with a teal bloom;
    // each via it passes FLASHES, and at the trace's end its pad FLARES + fades (tier 0: the trail without the bloom)
    { const T = circuit(len), sp = len * 0.075, tail = len * 0.16, lwP = Math.max(0.6, len * 0.0036), TEAL = [120, 236, 255];
      c.lineCap = 'round';
      for (const tr of T) {
        const travel = tr.len / (sp * tr.sp), per = travel + 3.5 + 6 * tr.ph, ts = mo ? t : 0.45 * per;
        const e = (((ts + tr.ph * 17) % per) + per) % per, d = e * sp * tr.sp;            // (distance the pulse has come; past the end it rests)
        // the pad's flare as it arrives (0.6 s), the trail draining out after it
        const over = d - tr.len, flare = over > 0 ? Math.max(0, 1 - over / (sp * tr.sp * 0.6)) : 0;
        if (over > tail + sp * tr.sp * 0.6) continue;
        const hd = Math.min(d, tr.len), d0 = Math.max(0, d - tail);
        if (hd > d0) {
          // the trail: 10 segments back from the head, brightening toward it (the groove lit as the energy passes)
          const n = 10;
          c.lineCap = 'butt'; c.lineJoin = 'round';                       // (flat ends: no beads where the segments meet)
          let A = along(tr, d0);
          for (let k = 1; k <= n; k++) {
            const dd = d0 + (hd - d0) * k / n, B = along(tr, dd), w = k / n;
            c.globalAlpha = (0.08 + 0.72 * w * w) * (over > 0 ? Math.max(0, 1 - over / tail) : 1);
            c.strokeStyle = w > 0.8 ? 'rgb(214,252,255)' : 'rgb(110,232,255)'; c.lineWidth = lwP * (0.7 + 0.6 * w);
            c.beginPath(); c.moveTo(A[0], A[1]); for (let q = A[2]; q < B[2]; q++) c.lineTo(tr.pts[q][0], tr.pts[q][1]); c.lineTo(B[0], B[1]); c.stroke();
            A = B;
          }
          c.globalAlpha = 1;
        }
        if (d <= tr.len) {
          // the head: a hot core elongated along its run + a soft teal bloom
          const H = along(tr, hd), Bk = along(tr, Math.max(0, hd - len * 0.01)), ang = Math.atan2(H[1] - Bk[1], H[0] - Bk[0]);
          if (tier > 0) glow(c, TEAL, H[0], H[1], len * 0.03, len * 0.018, 0.85);
          c.save(); c.translate(H[0], H[1]); c.rotate(ang); glow(c, [236, 255, 255], 0, 0, len * 0.014, len * 0.006, 1); c.restore();
          // the vias it passes flash (a quick bright bloom fading over ~0.5 s)
          for (const vd of tr.viaD) { const since = (d - vd) / (sp * tr.sp); if (since > 0 && since < 0.5) { const V = along(tr, vd); glow(c, TEAL, V[0], V[1], len * 0.02, len * 0.014, 0.9 * (1 - since / 0.5)); } }
        }
        if (flare > 0.01) { const E = tr.pts[tr.pts.length - 1]; glow(c, TEAL, E[0], E[1], len * 0.04 * (1.3 - 0.3 * flare), len * 0.026, 0.9 * flare); glow(c, [240, 255, 255], E[0], E[1], len * 0.012, len * 0.009, flare); }
      }
      c.globalAlpha = 1; }
    // THE EDGE LIGHTS: small lamps along every edge, a slow pulse running from the rear to the nose
    for (const e of EDGE_LAMPS) {
      const A = P[e.e], B = P[(e.e + 1) % 3], f = e.f, x = lerp(A[0], B[0], f) * 0.93, y = lerp(A[1], B[1], f) * 0.93;
      const toNose = e.e === 2 ? 1 - f : e.e === 0 ? f : 0.5, w = mo ? Math.pow(0.5 + 0.5 * Math.cos(t * 2.4 - toNose * 5), 6) : 0.3;
      const col = e.e === 1 ? [255, 214, 170] : [236, 240, 255];
      glow(c, col, x, y, len * 0.016, len * 0.009, 0.35 + 0.65 * w);
      c.globalAlpha = 0.5 + 0.5 * w; c.fillStyle = 'rgb(255,250,240)'; c.fillRect(x - 0.5, y - 0.4, 1, 0.8);
    }
    // the corner orbs (pale, a faint amber; pulsing slowly in turn) + the hub: a ring of lamps round it chasing, the red-orange
    // centre's slow heavy pulse
    P.forEach((q, i) => {
      const k = 0.65 + 0.35 * Math.sin(t * 1.6 + i * 2.1);
      glow(c, [255, 236, 210], q[0] * 0.8, q[1] * 0.8, len * 0.085, len * 0.045, 0.5 * k);
      glow(c, [255, 252, 244], q[0] * 0.8, q[1] * 0.8, len * 0.026, len * 0.016, 0.95 * k);
    });
    { const rx = len * HUB_R * 0.83, ry = rx * 0.4, n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, w = mo ? Math.pow(0.5 + 0.5 * Math.cos(a - t * 2.2), 4) : 0.4;
        glow(c, [255, 96, 40], Math.cos(a) * rx, Math.sin(a) * ry, len * 0.014, len * 0.008, (0.3 + 0.7 * w) * (0.6 + 0.4 * pulse));
      } }
    glow(c, [255, 60, 30], 0, 0, len * (0.15 + 0.035 * pulse), len * (0.065 + 0.018 * pulse), 0.35 + 0.35 * pulse);
    glow(c, [255, 140, 70], 0, 0, len * 0.055, len * 0.024, 0.75 + 0.25 * pulse);
    glow(c, [255, 236, 210], 0, 0, len * 0.02, len * 0.01, 0.9);
    c.restore();
    drawChase(c, fs);
  }
  /** the chase's jets on the screen u into their pass: [{ x, y, i }] (the lead first) */
  function chaseJets(u) {
    const len = chaseLen(), dir = run.dir, y0 = lerp(bandY0, crown, 0.48);
    return FORMATIONS.chase.map(([fx, fy], i) => {
      const xu = chaseX(u, fx, len / W);
      return { x: dir > 0 ? xu * W : (1 - xu) * W, y: y0 + fy * len * 0.62 - u * len * 0.3, i };
    });
  }
  function drawChase(c, fs) {
    if (!st || run.kind !== 'tr3b' || !st.chase.on) return;
    const look = jetLook(fs.L), len = chaseLen(), dir = run.dir;
    for (const J of chaseJets(st.chase.u)) jets.draw(c, { x: J.x, y: J.y, dir, ang: 0.05, len, look, burn: 1, t: performance.now() / 1000 + J.i * 0.37, i: J.i });
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
    spotX = fs.centre ? SPOT_OFF * spotSide : 0; med = spotX ? medS : medC;
    sizes();
    const t = sNow, sa = saucerAt(), R = sR * sa.s, bellyY = sa.y + R * 0.16;
    const useM = modelState === 'ready' && !!model;
    lastCraft = { x: +sa.x.toFixed(1), y: +sa.y.toFixed(1), R: +R.toFixed(1) };
    // (the hand-drawn saucer stands in: &ufo=classic, the sprites failed, or still loading after 4 s — a slow network on a preview)
    if (!useM && !saucer && (modelState !== 'loading' || performance.now() - modelT0 > 4000)) saucer = saucerSprite(sR * 2, dpr);
    const night = clamp01(fs.L.w.night + fs.L.w.late), mo = fs.motion;
    const beamK = st.beam.k, open = st.beam.open;
    // ---- THE LIGHT ON THE GROUND + THE SURROUNDINGS (the pool, the wash, the water under it, the lamps' long shadows)
    const gy = med.y, poolR = beam.w * 0.5;
    if (beamK > 0.01 && open > 0.6) {
      const k = beamK * smooth(0.6, 1, open);
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, [170, 255, 200], med.x, gy - 30, poolR * 2.2, poolR * 1.05, 0.2 * k);          // (the wide wash: the trees + the lamps round it — the beam's pale green)
      glow(c, [210, 255, 224], med.x, gy, poolR * 1.15, poolR * 0.34, 0.55 * k);            // (the pool on the paving)
      glow(c, [245, 255, 248], med.x, gy, poolR * 0.55, poolR * 0.16, 0.45 * k);
      c.restore();
      // the tall lamps' shadows, thrown long + outward from the beam (the light is high over the compass)
      if (L && L.lamps) {
        c.save(); c.fillStyle = `rgba(8,8,18,${(0.42 * k).toFixed(3)})`;
        const hs = 16, m0 = L.medallion;
        for (const l of L.lamps) {
          const dx = l.x - (m0.x + spotX), dz = l.z - m0.z, dist = Math.hypot(dx, dz);
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
      const sd = spotX < 0 ? -1 : 1, u = st.walker.u, x0 = m0.x + spotX + 8.5 * sd, xw = lerp(x0, m0.x + spotX + 0.25 * sd, u);   // (sd −1: the mirrored walk-in)
      const pz = st.walker.pose === 'walk' ? 'walk' : st.walker.pose === 'point' ? 'point' : 'wait';
      const hw0 = sd > 0 ? Math.PI : 0, hd = st.walker.pose === 'walk' ? hw0 : lerp(hw0, -Math.PI / 2 - 0.25 * sd, smooth(6.2, 7, sNow));
      drawFolk(c, cam, { s: { x: xw, z: m0.z, pose: pz, hd, dist: Math.abs(x0 - xw), v: st.walker.pose === 'walk' ? 1.4 : 0, a: 1 }, L: lookFig }, env);
    }
    // ---- THE BEAM (a wide soft cone from the emitter down to the paving; opening downward, shimmering, full of motes)
    if (beamK > 0.01 && open > 0.01) {
      const top = bellyY + R * 0.02, len = gy - top, bw = beam.w * (len / beam.h * 0.25 + 0.75);
      const reach = open * len;
      // (the opening's front is SOFT — never a cut edge. SP6, the owner's phone: thin, evenly spaced HORIZONTAL LINES ran across the beam +
      // the haze round it — the cone was drawn in 12 slices overlapping by half a pixel, three passes deep, so every seam drew twice. Now
      // ONE image per pass: fully open, the bake itself; while it opens, the bake masked once a frame by a soft gradient at its reach)
      const soft = Math.min(46, len * 0.22);
      let img = beam.cv;
      if (open < 0.999) {
        const bc = beam.cv, m = beam.mask || (beam.mask = mk(bc.width, bc.height)), mx = safeCtx(m), sy = bc.height / len;
        mx.globalCompositeOperation = 'copy'; mx.globalAlpha = 1; mx.drawImage(bc, 0, 0);
        mx.globalCompositeOperation = 'destination-in';
        const y0 = Math.max(0, (reach - soft) * sy), y1 = Math.max(y0 + 1, (reach + soft * 0.3) * sy), g = mx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        mx.fillStyle = g; mx.fillRect(0, 0, m.width, m.height);
        mx.globalCompositeOperation = 'source-over';
        img = m;
      }
      const pass = (a, wk) => { const sw = bw * wk; c.globalAlpha = a; c.drawImage(img, med.x - sw / 2, top, sw, len); };
      c.save();
      const sh = mo ? 0.88 + 0.08 * Math.sin(t * 2.3) + 0.04 * Math.sin(t * 5.1) : 0.95;
      // the light IN THE AIR: a pale veil first (the cone glows as a body of light — the city behind it seen through a bright haze, never
      // a tint over it), then the light itself added, a hot core down the axis, a soft haze round the cone
      pass(beamK * 0.42, 1);
      c.globalCompositeOperation = 'lighter';
      glow(c, [150, 255, 190], med.x, top + Math.min(reach, len) * 0.5, bw * 0.85, Math.max(20, reach * 0.62), 0.18 * beamK);
      pass(beamK * sh, 1);
      glow(c, [214, 255, 226], med.x, top + Math.min(reach, len * 0.7) * 0.5, bw * 0.14, Math.max(12, Math.min(reach, len * 0.7) * 0.66), 0.46 * beamK);
      // the shimmer: a second pass a touch wider, its strength wandering — the light breathing
      pass(beamK * (mo ? 0.18 + 0.12 * Math.sin(t * 1.3 + 1) : 0.2), 1.08);
      // the motes: slowly rising (a few falling), drifting toward the axis as they climb; twinkling
      for (const m of motes) {
        let v = ((m.ph + (mo ? -t * m.sp : 0)) % 1 + 1) % 1;   // (11a-2: every mote drifting UP the beam)
        const y = top + v * len; if (y > top + reach - soft * 0.4) continue;
        const hw = lerp(beam.w * 0.25, bw * 0.48, v), x = med.x + m.a * hw * 0.55;
        const tw = mo ? 0.5 + 0.5 * Math.sin(t * (2 + m.sp * 40) + m.ph * 20) : 0.7;
        glow(c, m.col, x, y, m.r * 2.6, m.r * 2.6, beamK * (0.35 + 0.5 * tw));
      }
      // the opening's bright front
      if (open < 0.98) glow(c, [236, 255, 240], med.x, top + reach - soft * 0.45, bw * 0.4, soft * 0.6, 0.35 * beamK);
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
    // ---- THE SAUCER (11a-2 — the owner's redesign): its light in the haze + on the rooftops below, the gunmetal hull, THE BELLY LOST in a
    // strong soft glow pouring down into the beam, THE RACING RING (ice-white slots lit in sequence round the rim: calm while it hovers,
    // ACCELERATING as it lifts him, a flash of them all as he's taken, slowing as it leaves), the smoked dome's faint inner light
    c.save(); c.translate(sa.x, sa.y); c.rotate(sa.tilt); c.scale(sa.s, sa.s);
    const R0 = sR, GL = [196, 255, 214], GW = [236, 255, 242];
    const hum = mo ? 0.92 + 0.05 * Math.sin(t * 2.1) + 0.03 * Math.sin(t * 5.3) : 0.95, bk = 0.45 + 0.55 * beamK;   // (the belly's glow: on from the approach, full with the beam)
    c.globalCompositeOperation = 'lighter';
    glow(c, GL, 0, R0 * 0.55, R0 * 2.4, R0 * 1.15, (0.1 + 0.12 * night) * bk * hum);                 // (its light in the haze + on the roofs below)
    glow(c, GL, 0, R0 * 0.22, R0 * 1.25, R0 * 0.42, 0.32 * bk * hum);                                // (pouring out from under it)
    c.globalCompositeOperation = 'source-over';
    // THE RING's pace (the classic's slots + the model's ports share it): calm while it hovers, ACCELERATING as it lifts him, a flash of
    // them all as he's taken, slowing as it leaves
    const lift = st.lift, taken = lift.on ? smooth(0.6, 0.68, lift.fade) * (1 - smooth(0.72, 0.86, lift.fade)) : 0;
    { const w = !mo ? 0 : st.craft.out > 0.02 ? lerp(7, 1.4, st.craft.out) : lift.on ? 7 + 30 * lift.h : 7;   // (rad/s: calm, racing, slowing)
      if (ringT == null || t < ringT - 1) ringT = t;
      ringPh += w * Math.max(0, Math.min(0.1, t - ringT)); ringT = t; ringW = w; ringTaken = taken; }
    if (useM) {
      // THE MODEL (sebslom's "UFO", baked — ufo-model.js): its turntable spinning slowly (faster as it lifts him, a dash as it leaves), the
      // hover row cross-fading into the steep one as it climbs (the real view angle: the craft's height over the horizon), its OWN green
      // ports — their baked layer at a low level, each port's soft glow (it reads at phone size) lit by the racing ring
      const elev = Math.atan2(cam.VPY - sa.y, cam.F) * 180 / Math.PI;
      const spinW = !mo ? 0 : st.craft.out > 0.02 ? lerp(16, 70, st.craft.out) : lift.on ? 16 + 44 * lift.h : 16;   // (°/s)
      if (spinT == null || t < spinT - 1) spinT = t;
      spinPh += spinW * Math.max(0, Math.min(0.1, t - spinT)); spinT = t;
      const rows = rowsAt(model, elev), fi = frameAt(rows[0][0], spinPh);
      lastElev = elev; lastFrame = fi;
      // (leaving: a short streak — the hull drawn a few times back along its path, fading)
      if (st.craft.out > 0.05) for (let i = 3; i >= 1; i--) { c.save(); c.translate(-i * 14 / sa.s, i * 6 / sa.s); for (const [row, a, sy] of rows) drawBody(c, row, fi, R0, 0.18 * st.craft.out / i * a, sy); c.restore(); }
      for (const [row, a, sy] of rows) drawBody(c, row, fi, R0, a, sy);
      c.globalCompositeOperation = 'lighter';
      // THE BELLY in its light: the glass sphere's underside lit from within as the emitter (on from the approach, full with the beam)
      const wLo = rows.length > 1 ? rows[1][1] : rows[0][0] === model.rows.lo ? 1 : 0;
      const by = lerp(model.rows.hi.belly[1] * rows[0][2], model.rows.lo.belly[1] * rows[rows.length - 1][2], wLo) * R0;
      glow(c, GL, 0, by, R0 * 0.95, R0 * 0.22, 0.55 * bk * hum);
      glow(c, GW, 0, by - R0 * 0.03, R0 * 0.5, R0 * 0.11, 0.7 * bk * hum);
      glow(c, [255, 255, 255], 0, by - R0 * 0.02, R0 * 0.26, R0 * 0.05, 0.7 * bk * hum);
      // THE PORTS: the model's own green (its layer: dim between the passes of the chase), each port its own glow + a hot core as the
      // ring's head passes (the trail fading behind it); all of them flash as he's taken
      const PG = [96, 255, 120], PC = [214, 255, 206];
      for (const [row, a, sy] of rows) {
        drawLights(c, row, fi, R0, a * (0.55 + 0.45 * taken), sy);
        for (const p of portsAt(row, fi)) {
          const d0 = ((ringPh - p.az) % TAU + TAU) % TAU, trail = Math.exp(-d0 / 0.55) + 0.75 * Math.exp(-((TAU - d0) / 0.08));
          const lv = Math.min(1, 0.22 + 0.95 * trail + taken * 1.2) * a, r = Math.max(R0 * 0.05, p.size * R0 * 1.6);
          glow(c, PG, p.x * R0, p.y * R0 * sy, r * 2.2, r * 1.4, 0.7 * lv);
          glow(c, PC, p.x * R0, p.y * R0 * sy, r * 0.75, r * 0.5, 0.95 * lv);
        }
      }
      if (taken > 0.01) glow(c, PG, 0, 0, R0 * 1.4, R0 * 0.4, 0.55 * taken);
    } else if (saucer) {
      const se0 = saucer.se;
      // (leaving: a short streak — the hull drawn a few times back along its path, fading)
      if (st.craft.out > 0.05) for (let i = 3; i >= 1; i--) { c.globalAlpha = 0.18 * st.craft.out / i; c.drawImage(saucer.cv, -saucer.w / 2 - i * 14 / sa.s, -saucer.oy + i * 6 / sa.s, saucer.w, saucer.h); }
      c.globalAlpha = 1; c.drawImage(saucer.cv, -saucer.w / 2, -saucer.oy, saucer.w, saucer.h);
      c.globalCompositeOperation = 'lighter';
      // THE BELLY in its light: a soft bright body under the rim (wider than the hull's underside: never a shape — only light), its core
      // white-green, its edge into the haze
      glow(c, GL, 0, saucer.by, R0 * 1.08, R0 * 0.24, 0.7 * bk * hum);
      glow(c, GW, 0, saucer.by, R0 * 0.8, R0 * 0.13, 0.85 * bk * hum);
      glow(c, [255, 255, 255], 0, saucer.by + R0 * 0.01, R0 * 0.46, R0 * 0.06, 0.85 * bk * hum);
      // THE RING: the rim's slots (the front half we see), a head racing round with a fading trail
      { const n = 30, rowY = R0 * 0.005;
        for (let i = 0; i < n; i++) {
          const a = Math.PI + (i + 0.5) / n * Math.PI;                         // (the front half: z toward us)
          const ex = Math.cos(a) * R0 * 0.995, ey = rowY - Math.sin(a) * R0 * se0 * 0.98;
          const d0 = ((ringPh - a) % TAU + TAU) % TAU, trail = Math.exp(-d0 / 0.55) + 0.75 * Math.exp(-((TAU - d0) / 0.08));
          const lv = Math.min(1, 0.3 + 0.95 * trail + taken * 1.2) * (0.5 + 0.5 * Math.abs(Math.sin(a)));   // (the edge-on slots at the sides fainter)
          glow(c, [170, 236, 255], ex, ey, R0 * 0.1, R0 * 0.05, 0.9 * lv);
          const sw2 = R0 * 0.042 * (0.35 + 0.65 * Math.abs(Math.sin(a)));   // (foreshortened toward the sides)
          c.globalAlpha = Math.min(1, lv * 1.1); c.fillStyle = rgb(mix([200, 244, 255], [255, 255, 255], Math.min(1, trail + taken))); c.fillRect(ex - sw2 / 2, ey - R0 * 0.012, sw2, R0 * 0.024);
        }
        if (taken > 0.01) glow(c, [220, 250, 255], 0, rowY + R0 * 0.08, R0 * 1.4, R0 * 0.4, 0.6 * taken);
      }
      // THE DOME's faint light inside (a slow cool breath behind the smoked glass)
      glow(c, [150, 230, 220], 0, -R0 * 0.2, R0 * 0.2, R0 * 0.13, 0.1 + (mo ? 0.04 * Math.sin(t * 1.3) : 0));
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // its light on the water under it (the water draws its own reflection column): the pale green of its glow
    if (env && env.waterLight && sa.s > 0.6) env.waterLight(sa.x, sa.y, [190, 255, 214], 0.5 * (0.45 + 0.55 * beamK), R0 * 0.6);
  }

  return {
    /** the layout: the camera, the lanes, the compass on the screen, the band above the crowns */
    layout(l, o) {
      L = l; cam = l.cam; W = cam.W; H = cam.H; lanes = l.lanes; dpr = o.dpr || dpr;
      wheelTop = l.wheel ? project(cam, l.wheel.x, l.wheel.y + l.wheel.r + (l.wheel.frame || 0) * 0.15, l.wheel.z)[1] : null;   // (9c: the craft hovers above it)
      const m = l.medallion; const [mx, my] = project(cam, m.x, 0, m.z); medC = med = { x: mx, y: my };
      { const half = Math.min(W * 0.37, 168) * 0.5 + 6, [rx, ry] = project(cam, m.x + SPOT_OFF, 0, m.z);
        spotSide = rx + half <= W ? 1 : -1;
        const [bx, by] = spotSide > 0 ? [rx, ry] : project(cam, m.x - SPOT_OFF, 0, m.z); medS = { x: bx, y: by }; }
      bandY0 = lanes && lanes['sky-low'] ? (lanes['sky-low'].y0NoTag != null ? lanes['sky-low'].y0NoTag : lanes['sky-low'].y) + 6 : H * 0.3;
      crown = o.crown || (lanes && lanes['sky-low'] ? lanes['sky-low'].y + lanes['sky-low'].h : H * 0.45);
      sizeKey = ''; jets.setDpr(dpr);
    },
    setTier(t) { if (t !== tier) { tier = t; sizeKey = ''; } },
    /** THE PREVIEW PANEL: the forced one's first run starts at the panel's moment (every phone the same) */
    remote(at, gone = [], came = []) { for (const id of came) if (id === 'ufo' || id === 'tr3b') { firstAt.set(id, at); lastForce = 0; } for (const id of gone) if (run && run.kind === id) run = null; },
    tick,
    /** what runs: { kind, s, st, dir } or null */
    state: () => (run && st ? { kind: run.kind, s: sNow, st, dir: run.dir, beside: spotX > 0, spot: med ? { x: +med.x.toFixed(1), y: +med.y.toFixed(1) } : null } : null),
    power, drainCols,
    /** the sky pass (after the clouds, before the city's layers): the TR-3B + the chase */
    sky: (c, fs) => drawTr3b(c, fs),
    /** the near pass (after the people on the promenade, before the front row): the abduction */
    near: (c, fs, env) => drawUfo(c, fs, env),
    /** the API: start one now (or at `at`) */
    start(kind, at, o = {}) { if (kind !== 'ufo' && kind !== 'tr3b') return false; run = { kind, at, dir: o.dir || 1, forced: false }; return true; },
    stop() { run = null; st = null; },
    /** the sounds (sounds.js reads it ~4× a second) */
    // (POLISH 4: the chase's roar placed on the clock — `jets`: { peakIn (s until the formation's middle crosses the screen's centre),
    // x (its middle now, a fraction of W) } from a few seconds before they come; the sounds start the take so its peak lands there)
    listen: () => {
      if (!run || !st) return null;
      // (9d: `held` — an &lgs= preview frozen at one second: the sounds skip the tape stop + the repeating one-shots, which would
      // otherwise warble the song at half speed and crackle forever — the owner's iPhone: "very glitching")
      const o = { id: run.at, kind: run.kind, s: sNow, st, dir: run.dir, x: run.kind === 'ufo' ? (sR ? saucerAt().x / W : 0.6) : st.x, held: !!(run.forced && hold != null && isFinite(hold)) };
      if (run.kind === 'tr3b' && sNow > CHASE.t0 - 6 && sNow < CHASE.t0 + CHASE.dur * CHASE.uOff) {
        const pk = chasePeakS(chaseLen() / W), js = chaseJets((sNow - CHASE.t0) / CHASE.dur), mx = js.reduce((a, j) => a + j.x, 0) / js.length;
        o.jets = { peakIn: pk - sNow, x: mx / W };
      }
      return o;
    },
    /** THE BLACKOUT for the scene's layers: { k (0..1: how dark the city is overall — the sky's glow, the beams), dead: { far, city,
     *  harbor, near } (that whole depth off: its lights are not drawn at all) } or null */
    blackout() {
      if (!st || run.kind !== 'tr3b') return null;
      const s = Math.max(0, sNow), o = { k: blackAll(s, 'city').k, dead: {} };
      for (const d of ['far', 'city', 'harbor', 'near']) o.dead[d] = blackAll(s, d).dead;
      return o;
    },
    /** the NEON sign + the tagline in the blackout: their level (0.07 — a dead tube's ghost — … 1) or null (untouched); quantized, so
     *  a steady sign never restyles the page */
    signGlitch() {
      if (!st || run.kind !== 'tr3b') return null;
      const s = Math.max(0, sNow);
      // (the sign's own stutter as it dies + as it catches — at tier 0 a slower one: each change restyles the page's sign)
      const sq = tier === 0 ? Math.floor(s * 5) / 5 : s;
      const p = Math.min(power(0.5, 'sign', 900), blackAt(sq, 0.5, 'sign', run.dir, 900));
      if (p >= 0.995) return null;
      return Math.max(0.07, Math.round(p * 10) / 10);
    },
    // (8b2 — THE TR-3B ON THE IPHONE: it kept the whole city at 60 fps for its 50 s — every frame drawn — while everything in it is
    // SLOW: the craft glides ~0.9 pt a frame at 30, the circuitry crawls, the dark city is still. So it asks for 60 only while the F-16s
    // scream across (their pass is fast); the rest runs at the calm night's 30 like any quiet night. The abduction keeps 60 (the beam,
    // the lift, the saucer's dash).)
    busy: () => !!run && (run.kind !== 'tr3b' || !st || !!(st.chase && st.chase.on)),
    /** a legendary is running (its blackout, its power, its people, its director slot) — busy() is only the 60 fps request */
    active: () => !!run,
    /** POLISH 4: the scene's dark city bake is wanted (a TR-3B due within the minute, or running) */
    darkWanted: () => (run ? run.kind === 'tr3b' : warmFor === 'tr3b'),
    debug: () => ({ wheelTop: wheelTop == null ? null : +wheelTop.toFixed(1), craft: lastCraft, run: run ? { ...run } : null, s: +sNow.toFixed(2), phase: st ? st.phase : null, tri: !!tri, saucer: !!saucer, model: modelState, elev: +lastElev.toFixed(1), frame: lastFrame, craft: run && run.kind === 'ufo' ? lastCraft : null, warm: warmFor, ring: { w: +ringW.toFixed(2), taken: +ringTaken.toFixed(2) } }),
    destroy() { for (const s of [saucer, beam, tri]) if (s) s.cv.width = 0; jets.destroy(); },
  };
}
