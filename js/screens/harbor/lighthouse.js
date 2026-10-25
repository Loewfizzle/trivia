// CITY 2.0 — THE HARBOR, Part 5: THE LIGHTHOUSE on its breakwater in open water, the keeper's cottage beside it (baked with the
// look), and THE BEAM (every frame, createBeam):
//
//   the breakwater   a rubble jetty of granite boulders (sunlit tops, wet dark feet), the tower's granite plinth in courses
//   the tower        tapering, white with two red bands, shaded as a cylinder (the sun's side lit, a soft core shadow), its
//                    slit windows climbing a spiral, a door under a little hood
//   the gallery      an iron balcony on corbels with its railing; the LANTERN ROOM glazed between diagonal astragals (the sky in
//                    the glass by day, the lamp's warm light at night); the dome, its ventilator ball and lightning rod
//   the cottage      white clapboard, a red roof + chimney, warm windows at night, a picket fence
//   THE BEAM         two beams opposite each other, turning on the real clock (16 s a turn): each a fan from the lantern, slightly
//                    dipped, foreshortened as it swings toward / away from us (pointing our way it FLARES: the lens straight at
//                    us — a star in the lantern + a flash down the water); it lights the haze around the lantern and is
//                    reflected in the harbor (water.reflect). Brighter + wider in REAL fog. Night only (+ a foggy day).
//   HOOKS            set({ colour }) — the Halloween green beam (11a) · spin() / tap() — tapped 3× in 1.5 s the beam spins
//                    (Part 12's egg) · busy() — spinning keeps 60 fps
// Reduced motion: a steady beam to the side (no sweep); tier 1: one soft layer a fan; tier 0 (the calm city): no haze, no flare star.
import { box, poly, rgb, shade, mix, clamp01 } from './shapes.js';
import { drawFogBeam, fogPatches, fogGlow } from './fogbeam.js';
import { project } from '../../core/harbor-layout.js';
import { LEVEL } from './water.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { pxGrid } from './blocks.js';

const TURN_S = 16;
const fract = v => v - Math.floor(v);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

export function lighthouseSteps(L, T) {
  const cam = L.cam, b = L.breakwater, l = L.lighthouse, k = L.cottage;
  const day = Math.min(1, T.day + 0.8 * T.gold), night = T.night, gold = T.gold;
  const sd = T.sunDir || 0;                                   // the sun's side: −1 left (morning), 1 right (afternoon), 0 behind
  const P = (x, y, z) => project(cam, x, y, z);
  const white = mix(mix([238, 236, 228], [246, 206, 176], gold / Math.max(0.01, T.day + gold)), [64, 60, 86], night);
  const red = mix(mix([190, 40, 44], [178, 52, 58], gold), [78, 26, 44], night);
  const granite = mix(mix([150, 146, 140], [150, 112, 104], gold), [32, 30, 46], night);
  const iron = mix([34, 34, 40], [14, 12, 22], night);
  return [x => {
    // ---- the breakwater: boulders along the jetty (far row then near row), wet dark feet in the water
    const rocks = [];
    for (let xx = b.x0; xx < b.x1; xx += 1.05) for (const zz of [b.z + 2.2, b.z + 0.6]) {
      const i = Math.round(xx * 7 + zz * 13), w = 1.2 + hash(i) * 1.1, hh = b.h * (0.7 + hash(i + 3) * 0.6);
      rocks.push({ x: xx + (hash(i + 5) - 0.5) * 0.6, z: zz, w, h: hh, i });
    }
    for (const r of rocks) {
      const [cx, base] = P(r.x, LEVEL, r.z), s = cam.F / r.z, rw = r.w * s / 2, rh = (r.h - LEVEL) * s;
      const c0 = shade(granite, (hash(r.i + 9) - 0.5) * 0.3);
      x.fillStyle = rgb(shade(c0, -0.25));
      x.beginPath(); x.moveTo(cx - rw, base); x.quadraticCurveTo(cx - rw * 1.05, base - rh * 0.8, cx - rw * 0.2, base - rh); x.quadraticCurveTo(cx + rw * 0.8, base - rh * 1.02, cx + rw, base - rh * 0.3); x.lineTo(cx + rw, base); x.closePath(); x.fill();
      // the sunlit top (day) / the moonlit edge (night)
      x.fillStyle = rgb(shade(c0, day > 0.2 ? 0.22 : 0.08), 0.85);
      x.beginPath(); x.moveTo(cx - rw * 0.7, base - rh * 0.78); x.quadraticCurveTo(cx - rw * 0.1, base - rh * 1.04, cx + rw * 0.75, base - rh * 0.4); x.quadraticCurveTo(cx, base - rh * 0.72, cx - rw * 0.7, base - rh * 0.78); x.fill();
      x.fillStyle = 'rgba(6,8,14,0.45)'; x.fillRect(cx - rw, base - Math.max(0.6, rh * 0.18), rw * 2, Math.max(0.6, rh * 0.18));
    }
    // ---- the plinth: granite courses, a cap
    const pz = l.z - 0.5;
    box(x, cam, { x0: l.x - l.r0 - 1, x1: l.x + l.r0 + 1, z0: pz, z1: l.z + 3, h: 2.2 - b.h }, granite, { y0: b.h, light: sd >= 0 ? 1 : -1 });
    x.strokeStyle = rgb(shade(granite, -0.3), 0.7); x.lineWidth = 0.4;
    for (let yy = b.h + 0.3; yy < 2.2; yy += 0.3) { const [a, ya] = P(l.x - l.r0 - 1, yy, pz), [c] = P(l.x + l.r0 + 1, yy, pz); x.beginPath(); x.moveTo(a, ya); x.lineTo(c, ya); x.stroke(); }
    if (T.day > 0.02) dayPlinth(x, cam, l, b, pz, granite, T);
    box(x, cam, { x0: l.x - l.r0 - 1.2, x1: l.x + l.r0 + 1.2, z0: pz - 0.1, z1: l.z + 3, h: 0.22 }, shade(granite, 0.12), { y0: 2.2, light: 1 });
    // ---- the tower: a tapered cylinder, white with two red bands, shaded across (lit on the sun's side)
    const yb = 2.42, R = y => l.r0 + (l.r1 - l.r0) * (y / l.h);
    const band = (y0, y1, col) => {
      const [a0, ya0] = P(l.x - R(y0), y0, l.z), [b0] = P(l.x + R(y0), y0, l.z), [a1, ya1] = P(l.x - R(y1), y1, l.z), [b1] = P(l.x + R(y1), y1, l.z);
      const g = x.createLinearGradient(Math.min(a0, a1), 0, Math.max(b0, b1), 0);
      const lit = shade(col, day > 0.2 ? 0.16 : 0.04), mid = col, dark = shade(col, -0.32 - 0.1 * day);
      if (sd < 0) { g.addColorStop(0, rgb(lit)); g.addColorStop(0.35, rgb(mid)); g.addColorStop(1, rgb(dark)); }
      else if (sd > 0) { g.addColorStop(0, rgb(dark)); g.addColorStop(0.65, rgb(mid)); g.addColorStop(1, rgb(lit)); }
      else { g.addColorStop(0, rgb(shade(col, -0.2))); g.addColorStop(0.45, rgb(lit)); g.addColorStop(1, rgb(dark)); }
      x.fillStyle = g; x.beginPath(); x.moveTo(a0, ya0); x.lineTo(a1, ya1); x.lineTo(b1, ya1); x.lineTo(b0, ya0); x.closePath(); x.fill();
    };
    band(yb, l.h, white);
    band(l.h * 0.25, l.h * 0.38, red);
    band(l.h * 0.6, l.h * 0.73, red);
    if (T.day > 0.02) dayTower(x, cam, l, yb, T, R);
    // the rim light at night (the city's glow behind it) + a hairline on the sun's edge by day
    { const [a0, ya0] = P(l.x + R(yb) * (sd < 0 ? -1 : 1), yb, l.z), [a1, ya1] = P(l.x + R(l.h) * (sd < 0 ? -1 : 1), l.h, l.z);
      x.strokeStyle = night > 0.4 ? 'rgba(160,140,230,0.35)' : `rgba(255,250,240,${0.5 * day})`; x.lineWidth = 0.5; x.beginPath(); x.moveTo(a0, ya0); x.lineTo(a1, ya1); x.stroke(); }
    // the slit windows up a spiral, the door under its hood
    for (let i = 0; i < 4; i++) {
      const yy = l.h * (0.16 + i * 0.2), off = [0.25, -0.2, 0.3, -0.1][i] * R(yy), s = cam.F / l.z;
      const [wx, wy] = P(l.x + off, yy + 0.9, l.z);
      x.fillStyle = night > 0.4 ? (i === 3 ? 'rgb(255,196,120)' : 'rgb(28,24,40)') : rgb(mix([40, 50, 64], [110, 130, 150], day * 0.4));
      x.beginPath(); x.roundRect(wx - s * 0.17, wy, s * 0.34, s * 0.82, [s * 0.17, s * 0.17, 0, 0]); x.fill();
    }
    { const s = cam.F / l.z, [dx, dy] = P(l.x - 0.15, yb + 1.6, l.z); x.fillStyle = rgb(mix([60, 46, 40], [24, 18, 26], night)); x.beginPath(); x.roundRect(dx - s * 0.32, dy, s * 0.64, s * 1.5, [s * 0.32, s * 0.32, 0, 0]); x.fill(); x.fillStyle = rgb(iron); x.fillRect(dx - s * 0.5, dy - s * 0.12, s, s * 0.14); }
    // ---- the gallery: corbels, the deck ring, the railing
    const g = l.gallery || l.r1 + 1, s = cam.F / l.z;
    for (let i = -2; i <= 2; i++) { const [cx0, cy0] = P(l.x + i * l.r1 * 0.42, l.h - 0.7, l.z); x.fillStyle = rgb(shade(white, -0.25)); x.beginPath(); x.moveTo(cx0 - s * 0.12, cy0); x.lineTo(cx0 + s * 0.12, cy0); x.lineTo(cx0 + s * 0.22, cy0 - s * 0.7); x.lineTo(cx0 - s * 0.22, cy0 - s * 0.7); x.fill(); }
    box(x, cam, { x0: l.x - g, x1: l.x + g, z0: l.z, z1: l.z + 0.5, h: 0.32 }, iron, { y0: l.h, top: false });
    { const [a, ya] = P(l.x - g, l.h + 0.32, l.z), [c] = P(l.x + g, l.h + 0.32, l.z); x.fillStyle = rgb(shade(iron, 0.3), 0.8); x.beginPath(); x.ellipse((a + c) / 2, ya, (c - a) / 2, s * 0.22, 0, Math.PI, 0); x.fill(); }
    x.strokeStyle = rgb(iron); x.lineWidth = Math.max(0.35, s * 0.08);
    { const [a, ya] = P(l.x - g + 0.05, l.h + 1.25, l.z), [c] = P(l.x + g - 0.05, l.h + 1.25, l.z); x.beginPath(); x.moveTo(a, ya); x.lineTo(c, ya); x.stroke(); x.lineWidth = Math.max(0.3, s * 0.05); for (let i = 0; i <= 10; i++) { const px = a + (c - a) * i / 10, [, y0] = P(0, l.h + 0.32, l.z); x.beginPath(); x.moveTo(px, y0); x.lineTo(px, ya); x.stroke(); } }
    // ---- the lantern room: glazing between diagonal astragals; the sky in the glass by day, warm light at night
    const lw = l.r1 * 0.7, [la, ly0] = P(l.x - lw, l.h + 3.4, l.z), [lc, ly1] = P(l.x + lw, l.h + 0.45, l.z);
    if (night > 0.35) { const gg = x.createRadialGradient((la + lc) / 2, (ly0 + ly1) / 2, 0, (la + lc) / 2, (ly0 + ly1) / 2, (lc - la)); gg.addColorStop(0, 'rgb(255,250,226)'); gg.addColorStop(0.5, 'rgb(255,214,140)'); gg.addColorStop(1, 'rgb(200,140,70)'); x.fillStyle = gg; }
    else { const gg = x.createLinearGradient(la, ly0, lc, ly1); gg.addColorStop(0, rgb(mix([150, 180, 210], [250, 190, 150], gold))); gg.addColorStop(0.5, rgb(mix([70, 96, 128], [150, 90, 90], gold))); gg.addColorStop(1, rgb(mix([190, 210, 230], [255, 210, 170], gold))); x.fillStyle = gg; }
    x.fillRect(la, ly0, lc - la, ly1 - ly0);
    x.strokeStyle = rgb(iron, 0.9); x.lineWidth = Math.max(0.3, s * 0.06);
    x.beginPath(); for (let i = -3; i <= 4; i++) { const xa = la + (lc - la) * (i / 4); x.moveTo(xa, ly1); x.lineTo(xa + (lc - la) * 0.5, ly0); x.moveTo(xa + (lc - la) * 0.5, ly1); x.lineTo(xa, ly0); } x.stroke();
    x.fillStyle = rgb(iron); x.fillRect(la - s * 0.1, ly1 - s * 0.12, lc - la + s * 0.2, s * 0.2); x.fillRect(la - s * 0.1, ly0, lc - la + s * 0.2, s * 0.16);
    // the dome (dark copper), its ventilator ball, the lightning rod
    { const [da, dy0] = P(l.x - l.r1, l.h + 3.4, l.z), [dc] = P(l.x + l.r1, l.h + 3.4, l.z), [, dt] = P(0, l.h + 5.1, l.z);
      const copper = mix(mix([46, 88, 78], [92, 64, 60], gold), [16, 18, 28], night);
      x.fillStyle = rgb(copper); x.beginPath(); x.moveTo(da, dy0); x.quadraticCurveTo((da + dc) / 2, dt - (dy0 - dt) * 0.5, dc, dy0); x.closePath(); x.fill();
      if (day > 0.2) { x.fillStyle = `rgba(255,255,240,${0.25 * day})`; x.beginPath(); x.ellipse((da + dc) / 2 + (sd || 0.3) * (dc - da) * 0.2, dy0 - (dy0 - dt) * 0.45, (dc - da) * 0.12, (dy0 - dt) * 0.22, 0, 0, Math.PI * 2); x.fill(); }
      const cx0 = (da + dc) / 2; x.fillStyle = rgb(iron); x.beginPath(); x.arc(cx0, dt - s * 0.05, Math.max(0.6, s * 0.28), 0, Math.PI * 2); x.fill();
      x.strokeStyle = rgb(iron); x.lineWidth = Math.max(0.3, s * 0.05); x.beginPath(); x.moveTo(cx0, dt - s * 0.3); x.lineTo(cx0, dt - s * 1.5); x.stroke(); }
    // ---- the keeper's cottage (behind the tower's right side): clapboard, the roof + chimney, its windows, a picket fence
    { const cz = k.z + 1, cw = mix(mix([232, 228, 214], [240, 200, 170], gold), [44, 40, 62], night);
      box(x, cam, { x0: k.x, x1: k.x + k.w, z0: cz, z1: k.z + 4, h: k.h - b.h }, cw, { y0: b.h, light: sd >= 0 ? 1 : -1 });
      x.strokeStyle = rgb(shade(cw, -0.18), 0.6); x.lineWidth = 0.35;
      for (let yy = b.h + 0.4; yy < k.h; yy += 0.42) { const [a, ya] = P(k.x, yy, cz), [c] = P(k.x + k.w, yy, cz); x.beginPath(); x.moveTo(a, ya); x.lineTo(c, ya); x.stroke(); }
      const roof = mix(mix([150, 46, 44], [140, 56, 60], gold), [40, 22, 34], night);
      poly(x, cam, [[k.x - 0.4, k.h, cz], [k.x + k.w / 2, k.roof, cz], [k.x + k.w + 0.4, k.h, cz]], rgb(roof));
      poly(x, cam, [[k.x + k.w * 0.68, k.h + 0.8, cz + 0.4], [k.x + k.w * 0.68, k.roof + 0.7, cz + 0.4], [k.x + k.w * 0.82, k.roof + 0.7, cz + 0.4], [k.x + k.w * 0.82, k.h + 0.5, cz + 0.4]], rgb(shade(granite, -0.1)));
      const win = night > 0.4 ? [255, 200, 120] : mix([60, 80, 100], [160, 180, 200], day * 0.4);
      for (const u0 of [0.16, 0.62]) { const [a, ya] = P(k.x + k.w * u0, b.h + 2.6, cz), [c, yc] = P(k.x + k.w * (u0 + 0.2), b.h + 1.3, cz); x.fillStyle = rgb(win); x.fillRect(a, ya, c - a, yc - ya); x.fillStyle = rgb(shade(cw, -0.4)); x.fillRect((a + c) / 2 - 0.2, ya, 0.4, yc - ya); x.fillRect(a, (ya + yc) / 2 - 0.2, c - a, 0.4); }
      // the fence along the jetty in front of it
      x.strokeStyle = rgb(mix([240, 236, 226], [60, 56, 76], night), 0.9); x.lineWidth = 0.4;
      const [fa, fy] = P(k.x - 1, b.h + 0.9, k.z), [fc] = P(k.x + k.w + 3, b.h + 0.9, k.z), [, fb] = P(0, b.h, k.z);
      x.beginPath(); x.moveTo(fa, fy + 0.6); x.lineTo(fc, fy + 0.6); for (let px = fa; px <= fc; px += 1.6) { x.moveTo(px, fb); x.lineTo(px, fy); } x.stroke(); }
  }];
}

// 7a — THE LIGHTHOUSE BY DAY (the owner: "texture + roundness by day"; a hero piece). Laid over the old tower by the day's share
// only (T.day: golden hour, dusk + the night never see it — the night look is unchanged): a real CYLINDER from the real sun's side
// (the lit flank with a soft sheen → the terminator → a soft CORE SHADOW → a thin BOUNCE light on the far edge), the red / white
// stripes re-laid on the device-pixel grid (crisp + bold), faint painted-masonry courses with their joints foreshortened round the
// curve, RUST streaks under the gallery + the windows, a salt-worn darker base; the plinth a rough STONE FOUNDATION. Baked.
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const LH_WHITE = { lit: [253, 251, 245], core: [158, 165, 192], bounce: [214, 208, 204] };
const LH_RED = { lit: [224, 54, 56], core: [100, 24, 44], bounce: [160, 52, 58] };
/** the cylinder's light across its width (u: −1 left edge … 1 right edge) → a colour, for a paint ({ lit, core, bounce }) */
export function cylinderTone(u, paint, sd, ovc = 0) {
  const side = sd === 0 ? 0 : Math.sign(sd), phi = side ? (55 + 25 * Math.min(1, Math.abs(sd))) * Math.PI / 180 : 0.35;
  const d = u * side * Math.sin(phi) + Math.sqrt(Math.max(0, 1 - u * u)) * Math.cos(phi);
  // (overcast: the sky lights it all round — a soft roll-off to both edges instead of a lit flank and a core shadow)
  const t = smooth(-0.38, 0.62, d) * (1 - ovc) + ovc * (0.5 + 0.42 * Math.sqrt(Math.max(0, 1 - u * u)));
  let c = mix(paint.core, paint.lit, t);
  if (side) c = mix(c, paint.bounce, smooth(0.7, 0.96, -u * side) * (1 - t) * 0.95 * (1 - ovc));        // the thin bounce on the far edge
  const uh = side * Math.sin(phi) * 0.82;
  c = mix(c, [255, 255, 252], 0.22 * Math.exp(-(((u - uh) / 0.16) ** 2)) * (1 - ovc));                 // the paint's soft sheen
  return shade(c, -0.08 * smooth(0.9, 1, Math.abs(u)));                                                   // the limbs turning away
}
function dayTower(x, cam, l, yb, T, R) {
  const k = clamp01(T.day * 2), G = pxGrid(x), px = G.px, s = cam.F / l.z, sd = T.sunDir || 0, ovc = T.ovc || 0;
  const P = (xx, y) => project(cam, xx, y, l.z), sy = y => G.sy(P(l.x, y)[1]);
  const [cx] = P(l.x, 0);
  x.save(); x.globalAlpha = k;
  // the tower's outline (its taper), the clip for everything below
  { const [a0, y0] = P(l.x - R(yb), yb), [b0] = P(l.x + R(yb), yb), [a1, y1] = P(l.x - R(l.h), l.h), [b1] = P(l.x + R(l.h), l.h);
    x.beginPath(); x.moveTo(a0, y0); x.lineTo(a1, y1); x.lineTo(b1, y1); x.lineTo(b0, y0); x.closePath(); x.clip(); }
  const yOfS = Y => { const [, py] = P(l.x, 0); return (py - Y) / s; };       // a screen y → the world height
  const N = 9, us = Array.from({ length: N }, (_, i) => -1 + 2 * i / (N - 1));
  const strips = (top, bot, paint) => {
    for (let yy = top; yy < bot; yy += 2 * px) {
      const hh = Math.min(2 * px, bot - yy), wy = yOfS(yy + hh / 2), hw = R(wy) * s, g = x.createLinearGradient(cx - hw, 0, cx + hw, 0);
      us.forEach((u, i) => g.addColorStop(i / (N - 1), rgb(cylinderTone(u, paint, sd, ovc))));
      x.fillStyle = g; x.fillRect(cx - hw - 1, yy, hw * 2 + 2, hh);
    }
  };
  const top = sy(l.h) - px, bot = sy(yb) + px;
  // (the morning's + the late afternoon's warmth on the paint, as the old tower had it: the golden share of the light)
  const gw = clamp01(T.gold / Math.max(0.01, T.day + T.gold)), warm0 = (P2, c, b) => ({ ...P2, lit: mix(P2.lit, c, gw * 0.85), bounce: mix(P2.bounce, b, gw * 0.5) });
  // (SP — OVERCAST: the paint muted under the deck like the city's faces — a cooler, greyer, dimmer white + red)
  const grey = c => { const l = (c[0] + c[1] + c[2]) / 3; return shade(mix(c, [l, l + 2, l + 8], 0.45), -0.13); };
  const warm = (P2, c, b) => { const w = warm0(P2, c, b); return ovc ? { ...w, lit: mix(w.lit, grey(w.lit), ovc * 0.8), core: mix(w.core, grey(w.core), ovc * 0.5) } : w; };
  strips(top, bot, warm(LH_WHITE, [250, 214, 182], [236, 196, 170]));
  const bands = [[l.h * 0.25, l.h * 0.38], [l.h * 0.6, l.h * 0.73]].map(([a, b]) => [sy(b), sy(a)]);
  for (const [t0, b0] of bands) strips(t0, b0, warm(LH_RED, [226, 70, 58], [176, 64, 60]));
  // faint PAINTED MASONRY: a course every ~⅗ unit under the paint, the joints (fainter still) staggered course to course and
  // foreshortened round the curve — texture felt more than seen
  const cy = 0.62, beds = [], joints = [];
  for (let y = yb + cy, row = 0; y < l.h - 0.2; y += cy, row++) {
    const yy = sy(y), hw = R(y) * s;
    beds.push(cx - hw, yy, hw * 2);
    for (let th = -1.3 + (row % 2) * 0.3; th < 1.3; th += 0.6) joints.push(G.sx(cx + hw * Math.sin(th)), yy + px, Math.max(px, cy * s - px));
  }
  x.fillStyle = 'rgba(70,64,84,0.06)'; x.beginPath(); for (let i = 0; i < beds.length; i += 3) x.rect(beds[i], beds[i + 1], beds[i + 2], px); x.fill();
  x.fillStyle = 'rgba(70,64,84,0.025)'; x.beginPath(); for (let i = 0; i < joints.length; i += 3) x.rect(joints[i], joints[i + 1], px, joints[i + 2]); x.fill();
  // RUST: streaks bleeding down from the gallery's corbels + from under each window (fading as they run)
  const RUST = [150, 84, 46], runs = [];
  for (let i = 0; i < 9; i++) { const th = -1.25 + 2.5 * hash(i * 3.7 + 11), len = 1.4 + 3.6 * hash(i * 5.1 + 3); runs.push([th, l.h - 0.75, len, hash(i * 2.3 + 7) < 0.4 ? 2 : 1, 0.34]); }
  for (let i = 0; i < 4; i++) { const yy = l.h * (0.16 + i * 0.2), off = [0.25, -0.2, 0.3, -0.1][i]; for (const dx of [-0.08, 0.1]) runs.push([Math.asin(Math.max(-1, Math.min(1, off + dx * (1 + hash(i + dx))))), yy + 0.06, 0.9 + 1.6 * hash(i * 9 + dx * 10 + 2), 1, 0.3]); }
  for (const [th, y0, len, w, a] of runs) {
    for (let j = 0; j < 4; j++) {
      const ya = y0 - len * j / 4, yb2 = y0 - len * (j + 1) / 4, hw = R(ya) * s, xx = G.sx(cx + hw * Math.sin(th));
      x.fillStyle = rgb(RUST, a * (1 - j / 4) * (0.7 + 0.3 * Math.cos(th))); x.fillRect(xx, sy(ya), w * px, sy(yb2) - sy(ya));
    }
  }
  // the SALT-WORN BASE: a darker, greyer skirt up the foot, mottled where the spray dries
  { const y0 = sy(yb), y1 = sy(yb + 4.2), g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(84,92,96,0.44)'); g.addColorStop(0.55, 'rgba(110,116,116,0.14)'); g.addColorStop(1, 'rgba(110,116,116,0)');
    x.fillStyle = g; x.fillRect(cx - R(yb) * s - 1, y1, R(yb) * s * 2 + 2, y0 - y1);
    x.fillStyle = 'rgba(96,100,98,0.12)'; x.beginPath();
    for (let i = 0; i < 26; i++) { const wy = yb + 3.6 * hash(i * 4.3 + 1) ** 1.6, th = -1.4 + 2.8 * hash(i * 6.1 + 2), hw = R(wy) * s; x.rect(G.sx(cx + hw * Math.sin(th)), sy(wy), (1 + Math.floor(hash(i + 9) * 3)) * px, (1 + Math.floor(hash(i + 5) * 2)) * px); }
    x.fill(); }
  x.restore();
}
/** the plinth as a ROUGH STONE FOUNDATION (by day): coursed rubble — irregular granite blocks, each its own tone, lit tops, dark joints */
function dayPlinth(x, cam, l, b, pz, granite, T) {
  const G = pxGrid(x), px = G.px, X0 = l.x - l.r0 - 1, X1 = l.x + l.r0 + 1, base = mix(granite, [150, 146, 140], 1);
  const P = (xx, y) => project(cam, xx, y, pz);
  x.save(); x.globalAlpha = clamp01(T.day * 2);
  const lit = [], dark = [];
  for (let y = b.h, row = 0; y < 2.2 - 0.04; row++) {
    const hh = Math.min(2.2 - y, 0.26 + 0.16 * hash(row * 7.3 + 1));
    for (let xx = X0 - hash(row * 3.1 + 2) * 0.7, i = 0; xx < X1; i++) {
      const ww = 0.5 + hash(row * 13 + i * 5.7) * 0.95, u0 = Math.max(X0, xx), u1 = Math.min(X1, xx + ww);
      const [a, ya] = P(u0, y + hh), [c, yc] = P(u1, y), ax = G.sx(a), cx2 = G.sx(c), ay = G.sy(ya), cy = G.sy(yc);
      if (cx2 > ax && cy > ay) {
        x.fillStyle = rgb(shade(base, (hash(row * 31 + i * 7) - 0.5) * 0.34 - 0.04)); x.fillRect(ax, ay, cx2 - ax, cy - ay);
        lit.push(ax, ay, cx2 - ax); dark.push(ax, ay, cx2 - ax, cy - ay);
      }
      xx += ww;
    }
    y += hh;
  }
  x.fillStyle = 'rgba(255,250,236,0.4)'; x.beginPath(); for (let i = 0; i < lit.length; i += 3) x.rect(lit[i], lit[i + 1], lit[i + 2] - px, px); x.fill();
  x.fillStyle = 'rgba(30,30,44,0.55)'; x.beginPath(); for (let i = 0; i < dark.length; i += 4) { x.rect(dark[i] + dark[i + 2] - px, dark[i + 1], px, dark[i + 3]); x.rect(dark[i], dark[i + 1] + dark[i + 3] - px, dark[i + 2], px); } x.fill();
  x.restore();
}

/** THE BEAM (every frame, night): see the top of this file */
export function createBeam() {
  let L = null, cam = null, lx = 0, ly = 0, lu = 1, spinAt = -1e9, taps = [], colour = [255, 236, 190], halo = null, flareC = null;
  let lastAng = 0;
  function sprites() {
    if (halo) return;
    halo = document.createElement('canvas'); halo.width = halo.height = 64;
    const x = safeCtx(halo), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    // the flare: a four-point star (thin, long rays) + its core
    flareC = document.createElement('canvas'); flareC.width = flareC.height = 128;
    const f = safeCtx(flareC);
    f.translate(64, 64); f.globalCompositeOperation = 'lighter';
    for (const [a, len, w] of [[0, 62, 2.2], [Math.PI / 2, 46, 1.8], [Math.PI / 4, 22, 1.1], [-Math.PI / 4, 22, 1.1]]) {
      f.save(); f.rotate(a);
      const gg = f.createLinearGradient(-len, 0, len, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      f.fillStyle = gg; f.beginPath(); f.ellipse(0, 0, len, w, 0, 0, Math.PI * 2); f.fill(); f.restore();
    }
  }
  function layout(l) {
    L = l; cam = l.cam;
    const h = l.lighthouse;
    [lx, ly] = project(cam, h.x, h.h + 1.9, h.z); lu = cam.F / h.z;
  }
  /** the angle at the clock's ms: a turn in TURN_S, + the spin (tapped 3×: 5 s of a fast whirl, easing in and out) */
  function angle(ms, now, motion) {
    if (!motion) return 0.25;
    let a = ((ms / 1000) % TURN_S) / TURN_S * Math.PI * 2;
    const e = (now - spinAt) / 1000;
    if (e >= 0 && e < 5) { const k = e < 1 ? e * e / 2 : e < 4 ? 0.5 + (e - 1) : 3.5 + (1 - Math.pow(1 - (e - 4), 2)) / 2; a += k * Math.PI * 2 * 1.1; }
    return a;
  }
  /** one beam's fan: the lantern → its far end (world: dipped, foreshortened as it turns to / from us) */
  function fan(a, D, spread) {
    const h = L.lighthouse, y0 = h.h + 1.9, toUs = Math.max(0, -Math.sin(a));
    const d = D * (0.3 + 0.7 * (1 - toUs));
    // a CONE: its end a disc across the beam — sideways in the turn (x, z) and up / down (y), so a side-on beam is a real fan
    const ex = h.x + d * Math.cos(a), ez = h.z + d * Math.sin(a), ey = y0 - 3.4 * (d / D), r = d * spread;
    const px = -Math.sin(a), pz = Math.cos(a);
    const p0 = project(cam, ex - px * r, ey - r * 0.8, ez - pz * r), p1 = project(cam, ex + px * r, ey + r * 0.8, ez + pz * r);
    const q0 = project(cam, ex, ey - r * 0.8, ez), q1 = project(cam, ex, ey + r * 0.8, ez);
    // (whichever pair spreads wider on screen is the fan's edge)
    const wide = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
    return { e0: wide ? p0 : q0, e1: wide ? p1 : q1, em: project(cam, ex, ey, ez), side: Math.abs(Math.cos(a)), toUs };
  }
  function drawFans(c, f, a, k) {
    c.globalAlpha = 1;
    // (NEON PASS 6: a party night — brighter + a little wider; now and then the party's colour, mixed in)
    const pa = clamp01(f.party || 0), pc = f.pcol && f.pm > 0 ? colour.map((v, i) => Math.round(v + (f.pcol[i] - v) * clamp01(f.pm) * 0.85)) : colour;
    // (6b — THE BEAM IN HEAVY FOG, the owner: "almost lasers, too sharp". In fog a beam is BROADER + SOFTER, never sharper: the denser
    // the fog, the WIDER, SHORTER and more diffuse the cone — soft edges from layered fans — with a big glow at the lamp (draw()). A light
    // fog keeps a faint crisp shaft; the thin hard-edged look belongs to clear air)
    const col = pc.join(','), fog = clamp01(f.fog || 0), heavy = smooth(0.35, 0.95, fog), wide = (1 + 2.2 * heavy) * (1 + 0.32 * pa), D = 58 * (1 - 0.42 * heavy) + 8 * fog * (1 - heavy);
    k *= 1 + 0.6 * pa;
    // (POLISH 4 — VOLUMETRIC IN FOG (fogbeam.js: why the wedges read flat): as the fog thickens the crisp wedges hand over to ONE
    // volumetric body — gaussian across, dimming exponentially along, widening, its density streaks — + the fog's patches lighting up as
    // it sweeps through them; clear air keeps the crisp shaft)
    const vol = smooth(0.12, 0.45, fog);
    for (const off of [0, Math.PI]) {
      const aa = a + off, F2 = fan(aa, D, 0.085 * wide), al = Math.min(1, k * (0.28 + 0.52 * F2.side) * (1 + 0.5 * fog - 0.25 * heavy));
      if (al < 0.01) continue;
      if (vol > 0.01) {
        const FV = fan(aa, D * 1.3, 0.085 * wide * 1.2), ax = FV.em[0] - lx, ay = FV.em[1] - ly, bx = (FV.e1[0] - FV.e0[0]) / 2, by = (FV.e1[1] - FV.e0[1]) / 2;
        drawFogBeam(c, lx, ly, ax, ay, bx, by, pc, al * vol * (1.25 + 0.35 * heavy), 0.3 * (1 - 0.6 * heavy));
        if (f.tier > 0) fogPatches(c, lx, ly, ax, ay, Math.hypot(bx, by), pc, al * vol * 0.9, f.motion ? (f.now || 0) / 1000 : 0, f.tier === 2 ? 5 : 3);
        c.globalAlpha = 1;
      }
      if (vol > 0.99) continue;
      const fans = heavy > 0.3 ? (f.tier < 2 ? [[1.9, 0.45], [1, 0.6]] : [[2.6, 0.28], [1.7, 0.4], [1, 0.5]]) : f.tier < 2 ? [[1.4, 1]] : [[2.3, 0.35], [1, 1]];
      for (const [sp0, aMul0] of fans) {
        const sp = sp0, aMul = aMul0 * (1 - vol);
        const F3 = sp === 1 ? F2 : fan(aa, D, 0.085 * wide * sp);
        const g = c.createLinearGradient(lx, ly, F3.em[0], F3.em[1]);
        g.addColorStop(0, `rgba(${col},${Math.min(1, al * aMul)})`); g.addColorStop(0.35 - 0.15 * heavy, `rgba(${col},${al * aMul * 0.45})`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.beginPath(); c.moveTo(lx, ly - lu * 0.25); c.lineTo(F3.e0[0], F3.e0[1]); c.lineTo(F3.e1[0], F3.e1[1]); c.lineTo(lx, ly + lu * 0.25); c.closePath(); c.fill();
      }
    }
  }
  return {
    layout,
    /** f: { ms, now (performance.now), k (0..1: night × power), fog, motion, tier, dim (a word spelling: the beam softens),
     *  water } — the lantern's glow, the two beams, the flare when one faces us (+ its flash down the water) */
    draw(c, f) {
      if (!L || f.k <= 0.01) return;
      sprites();
      const a = angle(f.ms, f.now, f.motion); lastAng = a;
      const k = f.k * (f.dim ? 0.5 : 1) * (1 + 0.3 * clamp01(f.party || 0));     // (NEON PASS 6: a brighter lantern on a party night)
      c.save(); c.globalCompositeOperation = 'lighter';
      // the haze lit around the lantern (brighter in fog)
      // (6b: heavy fog — a BIG glow at the lamp: the light scattered all round it; at tier 0 too, it's the beam's whole look then)
      const fog = clamp01(f.fog || 0), heavy = smooth(0.35, 0.95, fog), hr = lu * (4 + 6 * fog + 9 * heavy);
      if (f.tier > 0 || heavy > 0.3) { c.globalAlpha = Math.min(1, k * (0.22 + 0.4 * fog + 0.3 * heavy)); c.drawImage(halo, lx - hr, ly - hr, hr * 2, hr * 2); }
      // (POLISH 4: + the WIDE scattered glow in thick fog — the whole murk round the lantern lit, in the lamp's colour)
      if (fog > 0.12) fogGlow(c, lx, ly, lu * (9 + 26 * heavy), colour, k * smooth(0.12, 0.45, fog) * (0.22 + 0.28 * heavy));
      c.globalAlpha = 1;
      drawFans(c, f, a, k);
      // the lantern's core + THE FLARE: a beam swinging round to face us
      // (one of the two beams faces us whenever |sin a| → 1)
      const fl = Math.pow(Math.abs(Math.sin(a)), 22);
      c.globalAlpha = k * 0.9; const cr = lu * 1.1; c.drawImage(halo, lx - cr, ly - cr, cr * 2, cr * 2);
      if (fl > 0.02 && f.motion && f.tier > 0) {          // (tier 0, the calm city: no flare star)
        c.globalAlpha = Math.min(1, k * fl); const fr = lu * (7 + 4 * fog); c.drawImage(flareC, lx - fr, ly - fr, fr * 2, fr * 2);
        c.globalAlpha = Math.min(1, k * fl * 0.6); const hr2 = lu * 5; c.drawImage(halo, lx - hr2, ly - hr2, hr2 * 2, hr2 * 2);
        if (f.water) f.water.light(lx, ly, colour, Math.min(1, k * fl * 1.2), lu * 2.4);
      }
      c.restore();
    },
    /** DT1: the beam brightening the floodlit wall behind the lighthouse as it sweeps past (f: { k, wallZ, ms, now, motion }) — a
     *  soft warm patch where the beam pointing AWAY from us meets the wall, sliding across it; drawn under the lighthouse */
    wall(c, f) {
      if (!L || f.k <= 0.01 || !f.motion) return;
      sprites();
      const h = L.lighthouse, a = angle(f.ms, f.now, f.motion), dz = f.wallZ - h.z;
      for (const off of [0, Math.PI]) {
        const aa = a + off, sn = Math.sin(aa);
        if (sn < 0.2) continue;
        const xw = h.x + dz * Math.cos(aa) / sn, [sx, sy] = project(cam, xw, h.h * 0.55, f.wallZ), u = cam.F / f.wallZ;
        const k = f.k * Math.pow(sn, 1.5) * Math.max(0, 1 - Math.abs(xw - h.x) / 22);
        if (k < 0.01) continue;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, k * 0.32);
        const rw = u * 9, rh = u * 13; c.drawImage(halo, sx - rw, sy - rh, rw * 2, rh * 2);
        c.restore();
      }
    },
    /** the beam in the water (water.reflect: flipped about the lighthouse's waterline) — the fans only, softer */
    reflect(c, f) { if (!L || f.k <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; drawFans(c, { ...f, tier: 0 }, lastAng, f.k * 0.55); c.restore(); },
    /** HOOK: the beam's colour ([r,g,b]; null = the lamp's warm white) — 11a: the Halloween green */
    set(o) { if (o && 'colour' in o) colour = o.colour || [255, 236, 190]; },
    /** a tap on the lighthouse: 3 within 1.5 s → it spins (true when this tap spun it) */
    tap(now = performance.now()) { taps = taps.filter(t => now - t < 1500); taps.push(now); if (taps.length >= 3) { taps = []; spinAt = now; return true; } return false; },
    spin(now = performance.now()) { spinAt = now; },
    busy: (now = performance.now()) => now - spinAt < 5200,
    hit(x, y) { if (!L) return false; const h = L.lighthouse, [a, top] = project(cam, h.x - h.r0 - 1, h.h + 5.6, h.z), [b, bot] = project(cam, h.x + h.r0 + 1, 0, h.z); return x >= a - 6 && x <= b + 6 && y >= top - 6 && y <= bot; },
    debug: () => ({ x: lx, y: ly, colour, spinning: performance.now() - spinAt < 5000, angle: +(((lastAng % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).toFixed(3) }),
    destroy() { for (const cv of [halo, flareC]) if (cv) { cv.width = 0; cv.height = 0; } L = null; },
  };
}

/**
 * POLISH 4 — THE TR-3B's BLACKOUT on the harbor's BAKED lights (the lantern room's warm glass, the tower's lit slit window, the
 * keeper's cottage windows — part of the harbor layer's night bake): dark glass laid over each, `k` = how dead (0 untouched … 1 dark).
 * Drawn right after the harbor layer, only while a legendary pulls the power.
 */
export function harborBlackout(c, L, k) {
  if (!(k > 0.01) || !L || !L.lighthouse) return;
  const cam = L.cam, l = L.lighthouse, b = L.breakwater, ck = L.cottage, P = (x, y, z) => project(cam, x, y, z);
  c.save(); c.globalAlpha = Math.min(1, k);
  // the lantern room's glass: the night's dim glazing
  { const lw = l.r1 * 0.7, [la, ly0] = P(l.x - lw, l.h + 3.4, l.z), [lc, ly1] = P(l.x + lw, l.h + 0.45, l.z);
    const g = c.createLinearGradient(la, ly0, lc, ly1); g.addColorStop(0, 'rgb(38,40,58)'); g.addColorStop(0.5, 'rgb(18,18,30)'); g.addColorStop(1, 'rgb(34,34,52)');
    c.fillStyle = g; c.fillRect(la, ly0, lc - la, ly1 - ly0);
    c.strokeStyle = 'rgba(14,12,22,0.9)'; c.lineWidth = Math.max(0.3, cam.F / l.z * 0.06);
    c.beginPath(); for (let i = -3; i <= 4; i++) { const xa = la + (lc - la) * (i / 4); c.moveTo(xa, ly1); c.lineTo(xa + (lc - la) * 0.5, ly0); c.moveTo(xa + (lc - la) * 0.5, ly1); c.lineTo(xa, ly0); } c.stroke(); }
  // the tower's one lit slit (the fourth up the spiral)
  { const R = y => l.r0 + (l.r1 - l.r0) * (y / l.h), yy = l.h * 0.76, s = cam.F / l.z, [wx, wy] = P(l.x - 0.1 * R(yy), yy + 0.9, l.z);
    c.fillStyle = 'rgb(28,24,40)'; c.beginPath(); c.roundRect(wx - s * 0.17, wy, s * 0.34, s * 0.82, [s * 0.17, s * 0.17, 0, 0]); c.fill(); }
  // the pier's ticket booth window (pier.js: the head's near right corner)
  if (L.pier && L.pier.head) { const p = L.pier, h = p.head, bx0 = h.x1 - 2.6, bx1 = h.x1 - 0.8, bz = h.z0 + 0.9, dy = p.y;
    const [wa, wy] = P(bx0 + 0.35, dy + 1.75, bz), [wb, wy2] = P(bx1 - 0.35, dy + 0.95, bz); c.fillStyle = 'rgb(24,22,34)'; c.fillRect(wa - 0.3, wy - 0.3, wb - wa + 0.6, wy2 - wy + 0.6); }
  // the keeper's cottage windows
  if (ck && b) { const cz = ck.z + 1;
    for (const u0 of [0.16, 0.62]) { const [a, ya] = P(ck.x + ck.w * u0, b.h + 2.6, cz), [cc, yc] = P(ck.x + ck.w * (u0 + 0.2), b.h + 1.3, cz); c.fillStyle = 'rgb(22,20,32)'; c.fillRect(a - 0.6, ya - 0.6, cc - a + 1.2, yc - ya + 1.2); } }   // (8b1: + a hair all round — a warm rim of the lit pane showed)
  c.restore();
}
