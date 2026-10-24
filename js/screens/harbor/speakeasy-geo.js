// CITY 2.0 — THE HARBOR: THE SPEAKEASY — its geometry, materials + the wall painting helpers (FP3b: split out of speakeasy.js, FREV A1's split by responsibility; speakeasy.js
// re-exports everything, so its importers are unchanged).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, SASH_RAIL, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';


export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
export const FONT = (px, w = 700) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif`;
export const V = SPEAK_V;
export const W_FRONT = 11.2;
export const GLASS_IN = 0.16;                   // a window's recess (exaggerated a little: the jamb reads as depth at phone size)
/** FP2 — CRISP LIGHTS, NEVER SMOKE (the owner: the shopfront "looks smoky"): a light is its SOURCE, a small TIGHT halo, and its light
 *  LANDING on the surfaces near it — never a translucent wash. The halos' radii (wall units: × G.K pt) — the shop lamp's globe, the
 *  sconce's glass — and landR: the sconce's light landing on the brick + the door's frame (baked: paintGround), gone by then. */
/** SP2 — the awning's night lamp (wall units): over the shop window's middle; reach: its light's fall along the awning; the canvas's
 *  glow by stripe (the cream ones let more through), the scallops' rim */
/** 8P — THREE LAMPS under the awning (the owner: one lamp lit the middle only): each end + the middle (us), each a little dimmer (k)
 *  than SP2's single one, so together they wash the shopfront EVENLY; crisp SOURCES — a small brass shade hung under the valance's
 *  scallops with a lit bulb + a tight halo (live) — and their light landing on the canvas, the shopfront, the pavement (baked). The
 *  barber pole stays the brightest light on the front (tested). */
export const AWNING_LAMP = Object.freeze({ us: [2.5, 5.6, 7.85], k: 0.72, reach: 1.45, cream: 0.3, red: 0.14, rim: 0.55, drop: 0.03, bulb: 0.07, halo: 0.34 });
/** the awning lamps' bulbs (wall units u across + world y / z): just under the valance's foot */
/** 8P — the valance's depth (world units; was 0.42: it hid the window's head — the gold arch + the sign need the room) */
export const VAL = 0.34;
export const awningBulbs = aw => AWNING_LAMP.us.map(u => ({ u, y: aw.y1 - VAL - AWNING_LAMP.drop, z: aw.z + 0.05 }));
export const SHOP_GLOW = Object.freeze({ lamp: 0.2, sconce: 0.24, landR: 0.95 });   // (SP2: tighter — a few pt)

// ------------------------------------------------------------------ geometry
/** the building on screen: the front's affine map, the side wall's perspective, the inverse for the strips */
export function speakGeo(L) {
  const cam = L.cam, s = L.speakeasy;
  const K = cam.F / s.z0;
  const front = (u, v) => project(cam, s.x0 + u, v, s.z0);
  const len = Math.hypot(s.side.x - s.x1, s.side.z - s.z0), dx = (s.side.x - s.x1) / len, dz = (s.side.z - s.z0) / len;
  const side = (w, v, out = 0) => project(cam, s.x1 + w * dx + out * dz, v, s.z0 + w * dz - out * dx);
  const wAt = sx => { const X = sx - cam.VPX; return (X * s.z0 - cam.F * s.x1) / (cam.F * dx - X * dz); };
  return { cam, s, K, front, side, len, dx, dz, wAt, zAt: w => s.z0 + w * dz, turned: !!s.turned };
}

// ------------------------------------------------------------------ the materials for a look
export function mats(T) {
  const br = faces(T, 'brick', 44), tc = faces(T, 'cream', 44), gr = faces(T, 'granite', 44);
  const sd = T.sunDir || 0, ov = T.ovc || 0;
  // the side wall (facing west, to the right): lit by an afternoon sun, in shade in the morning, a calm step darker at noon
  const sideOf = f => (sd > 0.05 ? mix(f.front, f.lit, Math.min(1, sd) * (1 - ov * 0.7)) : mix(f.front, f.dark, Math.max(0.42, -sd) * (1 - ov * 0.5)));
  const warm = tri(T, [255, 232, 196], [255, 178, 110], [70, 60, 96]);
  return {
    T, sd, day: T.day || 0, gold: T.gold || 0, night: T.night || 0, ov,
    brick: br.front, brickS: sideOf(br), trim: mix(tc.front, br.front, 0.4 * (T.night || 0)), trimS: mix(sideOf(tc), sideOf(br), 0.4 * (T.night || 0)), stone: gr.front, stoneS: sideOf(gr),
    trimHi: mix(tc.front, tri(T, [255, 250, 236], [255, 214, 160], [70, 64, 96]), 0.55), trimLo: shade(tc.front, -0.28),
    frame: tri(T, [30, 54, 46], [40, 40, 40], [11, 12, 22]), frameHi: tri(T, [86, 120, 100], [120, 96, 70], [26, 26, 42]),
    gilt: tri(T, [214, 168, 78], [236, 176, 90], [86, 70, 58]), giltHi: tri(T, [255, 232, 160], [255, 214, 140], [120, 100, 80]),
    giltLo: tri(T, [128, 86, 34], [140, 80, 40], [40, 30, 34]),
    glassTop: T.skyHi ? mix(T.skyHi, [236, 242, 250], 0.25 * (T.day || 0)) : tri(T, [150, 180, 214], [214, 150, 120], [24, 22, 44]),
    glassLo: T.skyLo ? shade(T.skyLo, -0.35) : tri(T, [70, 90, 120], [120, 80, 80], [10, 10, 24]),
    inside: tri(T, [34, 30, 36], [40, 28, 32], [8, 7, 16]),
    blind: tri(T, [232, 220, 192], [240, 196, 150], [36, 30, 44]), wood: tri(T, [74, 46, 32], [84, 46, 34], [18, 13, 20]),
    awnR: tri(T, [172, 42, 46], [190, 56, 50], [52, 18, 30]), awnC: tri(T, [232, 220, 194], [244, 196, 150], [52, 44, 58]),
    iron: tri(T, [32, 32, 38], [30, 26, 30], [10, 10, 18]), warm, soot: tri(T, [36, 24, 22], [40, 22, 22], [6, 4, 10]),
  };
}

// ------------------------------------------------------------------ painting helpers (in wall units, v up)
export function wallMap(x, ox, oy, k) { x.transform(k, 0, 0, -k, ox, oy); }
export const R = (x, u0, v0, u1, v1, col, a = 1) => { if (col != null) x.fillStyle = typeof col === 'string' ? col : rgb(col, a); x.fillRect(u0, v0, u1 - u0, v1 - v0); };
export function devRect(x, u0, v0, u1, v1) {
  const m = x.getTransform(), p = (u, v) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f];
  const [ax, ay] = p(u0, v0), [bx, by] = p(u1, v1);
  return [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)];
}
export function fillPat(x, pat, u0, v0, u1, v1) { const r = devRect(x, u0, v0, u1, v1); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = pat; x.fillRect(Math.round(r[0]), Math.round(r[1]), Math.round(r[2]), Math.round(r[3])); x.restore(); }
/** text in wall units (v up): centred at (u, v) baseline, size in units */
export function text(x, s, u, v, size, { fill, stroke = null, lw = 0, align = 'center', sq = 1, font = FONT, rot = 0, glow = null } = {}) {
  x.save(); x.translate(u, v); x.scale(1, -1); if (rot) x.rotate(rot); x.scale(sq / 100, 1 / 100);
  if (glow && glow[0] > 0) { x.shadowBlur = glow[0]; x.shadowColor = glow[1]; }          // (a baked glow: the blade's lit letters — device px)
  x.font = font(size * 100); x.textAlign = align; x.textBaseline = 'alphabetic';
  if (stroke) { x.lineJoin = 'round'; x.strokeStyle = stroke; x.lineWidth = lw * 100; x.strokeText(s, 0, 0); }
  if (fill) { x.fillStyle = fill; x.fillText(s, 0, 0); }
  x.restore();
}
/** the brick: a tile of courses (device px) with every brick its own kiln colour; the mortar a muted tint of the brick */
export function brickTile(base, ch, bl, seed, night) {
  const cols = 16, rows = 16, cv = document.createElement('canvas'); cv.width = cols * bl; cv.height = rows * ch;
  const x = safeCtx(cv), r = rngFrom(seed);
  x.fillStyle = rgb(mix(base, night ? [30, 28, 40] : [150, 138, 124], night ? 0.25 : 0.42)); x.fillRect(0, 0, cv.width, cv.height);
  for (let j = 0; j < rows; j++) {
    const row = Array.from({ length: cols }, () => { const q = r(); let c = shade(base, (r() - 0.5) * 0.2); if (q < 0.05) c = shade(c, -0.24); else if (q < 0.1) c = mix(c, [214, 150, 108], 0.22); else if (q < 0.17) c = mix(c, [112, 52, 44], 0.25); else if (q < 0.22) c = mix(c, [150, 96, 70], 0.2); return c; });
    const off = (j % 2) * (bl >> 1);
    for (let i = -1; i <= cols; i++) {
      const c = row[(i + cols) % cols];
      x.fillStyle = rgb(c); x.fillRect(i * bl + off, j * ch, bl - 1, ch - 1);
      // (a lighter top edge on each brick by day: the course reads as relief, not lines)
      if (!night && ch >= 3) { x.fillStyle = rgb(shade(c, 0.1)); x.fillRect(i * bl + off, j * ch, bl - 1, 1); }
    }
  }
  return cv;
}
/** a soft vertical streak (soot / rain) from (u, v) down `len` */
export function streak(x, u, v, w, len, col, a) {
  const g = x.createLinearGradient(0, v, 0, v - len);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
  x.fillStyle = g; x.fillRect(u - w / 2, v - len, w, len);
}
/** a carved Deco fan (a sunburst relief) in a panel */
export function fan(x, cx, cy, r, n, hi, lo, a0 = 0, a1 = Math.PI) {
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 0.55) / n;
    x.fillStyle = rgb(i % 2 ? lo : hi);
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(t0) * r, cy + Math.sin(t0) * r); x.lineTo(cx + Math.cos(t1) * r, cy + Math.sin(t1) * r); x.closePath(); x.fill();
  }
}
/** a carved chevron frieze along a band */
export function chevrons(x, u0, u1, v0, v1, hi, lo, pitch) {
  const h = v1 - v0;
  x.lineWidth = h * 0.16; x.lineJoin = 'miter';
  for (const [col, dv] of [[lo, -h * 0.07], [hi, 0]]) {
    x.strokeStyle = rgb(col); x.beginPath();
    for (let u = u0, i = 0; u <= u1 + 1e-6; u += pitch / 2, i++) { const v = (i % 2 ? v0 + h * 0.25 : v1 - h * 0.25) + dv; if (i) x.lineTo(u, v); else x.moveTo(u, v); }
    x.stroke();
  }
}
