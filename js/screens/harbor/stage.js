// CITY 2.0 — THE HARBOR: the promenade nearest us — the near STAGE where life happens. PART 8a (core/harbor-promenade.js: the
// plan): THE CURB BAND (tall double-head Deco lamps, sugar maples in iron grates), THE PLAZA (open cobbles in front of the
// speakeasy's door, the centrepiece MEDALLION in its middle), the middle band (the bench, the vendor cart, the stone flower
// planters), THE FRONT WALK (short warm globe lamps, big planters, the front maple), THE IMPLIED ROAD's granite curb along the bottom
// edge (cars only as light: harbor/roadlight.js). No flagpole (the owner: flags only on holidays — a later part dresses the posts).
// This file: THE GROUND (granite setts whose tops catch the light, the curb band's pavers, the front curb, the asphalt) with the
// lamps' POOLS baked into the stones at night (T.lamps — the lamps' ramp in sixths: no haze, no per-frame cost), the cast shadows
// by day, THE LAMPS (crafted Deco ironwork + opal glass; their glass lit live: drawLampLight); the trees (trees.js) and the props
// (props.js) are drawn from here; the people are placeholders (8b walks them).
import { project, groundY } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { person, rgb, shade, mix } from './shapes.js';
import { drawTree, treeShadow } from './trees.js';
import { drawBench, drawCart, drawPlanter, drawMedallion, propShadow } from './props.js';

const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const cl = v => (v < 0 ? 0 : v > 255 ? 255 : v);
const addc = (c, l, k = 1) => [cl(c[0] + l[0] * k), cl(c[1] + l[1] * k), cl(c[2] + l[2] * k)];
const mulc = (c, m) => [c[0] * m, c[1] * m, c[2] * m];

/** what every piece's art gets (trees.js, props.js): the season + how far into it, the lamps (their light at night: lampK = the
 *  lamps' ramp baked), Part 9's hooks (snow on the ground + branches, a wet sheen) */
export const pieceCtx = L => ({ season: L.season || 'autumn', phase: L.seasonPhase ?? 0.5, lights: L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind })), lampK: L.lampK || 0, snow: L.snow || 0, wet: L.wet || 0 });

// ------------------------------------------------------------------ THE GROUND (baked into 'stage')
// the granite setts (warm grey by day, rosy at golden hour, a deep violet-grey at night), the joints (sand + grime), the asphalt
const SETT = { d: [154, 148, 140], g: [176, 130, 112], n: [64, 59, 86] };
const JOINT = { d: [112, 105, 97], g: [120, 86, 78], n: [30, 28, 46] };
const ASPH = { d: [72, 72, 80], g: [68, 52, 62], n: [12, 12, 22] };
// the lamps' light per unit of T.lamps: the tall street lamps a clean cool white, the globes warm, the speakeasy's spill amber
const LIGHT = { tall: [150, 162, 182], globe: [236, 168, 92], spill: [196, 120, 54] };
const REACH = { tall: 6.2, globe: 5.6, spill: 3.6 };

/** the speakeasy's warm spill on the cobbles: its side door's sconce, the shop's one dim lamp through the big window */
function speakSpill(L) {
  const s = L.speakeasy, z = s.z0 - 1.3;
  return [{ x: s.x0 + (s.door.u0 + s.door.u1) / 2, z, kind: 'spill', k: 0.95 }, { x: s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2, z, kind: 'spill', k: 0.5 }];
}
const lightSources = L => [...L.lamps.map(l => ({ x: l.x, z: l.z - 0.3, kind: l.kind, k: 1 })), ...speakSpill(L)];
/** the light on the ground at (x, z) at night — every lamp's pool (overlapping: every path lit, the shadows between dim) + the
 *  speakeasy's spill; null by day (T.lamps 0) */
function lightField(L, T) {
  const k = T.lamps || 0;
  if (k < 0.01) return null;
  const src = lightSources(L);
  return (x, z) => {
    let r = 0, g = 0, b = 0;
    for (const s of src) {
      const R = REACH[s.kind], dx = x - s.x, dz = (z - s.z) * 1.15, d2 = (dx * dx + dz * dz) / (R * R);
      if (d2 >= 1) continue;
      const f = (1 - d2) * (1 - d2) * s.k, c = LIGHT[s.kind];
      r += c[0] * f; g += c[1] * f; b += c[2] * f;
    }
    return r + g + b > 0.5 ? [r * k, g * k, b * k] : null;
  };
}

/** the sun's shadow on the ground for something h units tall: { dx, dz, a } (world units; a = its darkness) or null (night,
 *  overcast). The camera looks north across the harbor: a morning sun on the left throws shadows right, and away from us. */
export function sunShadow(T, h) {
  const day = (T.day || 0) + (T.gold || 0);
  if (day < 0.15 || (T.ovc || 0) >= 0.5) return null;
  const el = Math.max(6, T.sunEl || 30), len = Math.min(3.2, 1 / Math.tan(el * Math.PI / 180)) * h, sd = T.sunDir || 0;
  return { dx: -sd * len * 0.9, dz: len * (0.35 + 0.4 * (1 - Math.abs(sd))), a: 0.3 * Math.min(1, day) * (1 - 0.6 * (T.ovc || 0)) };
}

/**
 * THE PAVING (baked, in small steps): the implied road's asphalt + its granite curb, the front walk + the plaza's SETTS (rounded
 * granite, exaggerated ~3× so they read on a phone like the bricks: stone by stone its own shade, the far half — the top facing the
 * sky — lighter, a bright lip by day; at night each stone takes the light where it lies: lit tops, dark joints = the POOLS), the
 * curb band's big pavers, then the shadows by day (the lamps, the trees, the props) and the medallion inlaid in the plaza.
 * L.impliedOn === false (&force=no-implied-road): the setts run down to the screen's foot, no curb, no road.
 */
export function promenadeSteps(L, T) {
  const cam = L.cam, e = L.edge, ir = L.impliedRoad, on = L.impliedOn !== false;
  const lightAt = lightField(L, T), day = (T.day || 0) + 0.7 * (T.gold || 0);
  const sett = tri(T, SETT.d, SETT.g, SETT.n), joint = tri(T, JOINT.d, JOINT.g, JOINT.n);
  const zFront = on ? e.z + e.curbW : ir.z0, zBack = 51.2;
  const hw = z => cam.hw(z) * 1.04 + 1;
  const P = (x, z) => project(cam, x, 0, z);
  const steps = [];
  // 1. the base: the joints' colour under everything, the implied road's asphalt (its grain + two worn wheel tracks), the lamps'
  //    light low in the joints
  steps.push(x => {
    const y0 = groundY(cam, L.prom.z1);
    x.fillStyle = rgb(joint); x.fillRect(0, y0, cam.W, cam.H - y0);
    if (on) {
      const ya = groundY(cam, e.z), asph = tri(T, ASPH.d, ASPH.g, ASPH.n), r = rngFrom(811);
      x.fillStyle = rgb(asph); x.fillRect(0, ya, cam.W, cam.H - ya);
      for (let i = 0; i < 260; i++) { x.fillStyle = rgb(shade(asph, r() < 0.5 ? 0.08 : -0.1), 0.6); x.fillRect(r() * cam.W, ya + r() * (cam.H - ya), 1 + r() * 2, 0.6); }
      for (const z of [31.5, 28.2]) { const yy = groundY(cam, z); x.fillStyle = rgb(shade(asph, 0.07), 0.5); x.fillRect(0, yy - 1.2, cam.W, 2.4); }
    }
    if (lightAt) {
      x.globalCompositeOperation = 'lighter';
      for (const s of lightSources(L)) {
        const R = REACH[s.kind], [cx] = P(s.x, s.z), ya = groundY(cam, s.z + R), yb = groundY(cam, s.z - R), rw = cam.F * R / s.z;
        const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, rgb(mulc(LIGHT[s.kind], (T.lamps || 0) * 0.45 * s.k))); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.save(); x.translate(cx, (ya + yb) / 2); x.scale(rw, (yb - ya) / 2); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
      }
      x.globalCompositeOperation = 'source-over';
    }
  });
  // 2. THE SETTS
  const DZ = 0.72, DX = 0.95, GAP = 0.085;
  const rows = [];
  for (let z = zFront, i = 0; z < zBack - 0.05; z += DZ, i++) rows.push([z, Math.min(zBack, z + DZ), i]);
  const lip = tri(T, [255, 248, 232], [255, 206, 160], [70, 66, 96]);
  const paint = (x, z0, z1, ri) => {
    const r = rngFrom(4049 + ri * 131), off = (ri % 2) * DX * 0.5, H = hw(z0);
    for (let wx = -H - off; wx < H; wx += DX) {
      const w = DX * (0.84 + r() * 0.28), x0 = wx + GAP / 2, x1 = wx + w - GAP / 2, za = z0 + GAP / 2, zb = z1 - GAP / 2;
      const [ax, ay] = P(x0, zb), [bx, by] = P(x1, za);              // ay: the stone's far edge (higher on screen), by: its near edge
      const ww = bx - ax, hh = by - ay, v = 0.84 + r() * 0.28, tint = r();
      if (ww < 0.6 || hh < 0.4 || bx < -2 || ax > cam.W + 2) continue;
      let c = mulc(sett, v);
      if (tint < 0.2) c = addc(c, [10, 4, -4], 0.6 + 0.4 * day); else if (tint < 0.32) c = addc(c, [-6, -2, 7], 0.6 + 0.4 * day);
      const lt = lightAt ? lightAt((x0 + x1) / 2, (za + zb) / 2) : null;
      if (lt) c = addc(c, lt, 0.58);
      const rad = Math.min(hh * 0.34, ww * 0.2);
      x.fillStyle = rgb(c); x.beginPath(); x.roundRect(ax, ay, ww, hh, rad); x.fill();
      let top = shade(c, 0.1 + 0.06 * day);
      if (lt) top = addc(top, lt, 0.5);
      x.fillStyle = rgb(top); x.beginPath(); x.roundRect(ax + ww * 0.08, ay, ww * 0.84, hh * 0.48, rad * 0.8); x.fill();
      const la = day * 0.5 + (lt ? Math.min(0.85, (lt[0] + lt[1] + lt[2]) / 240) : 0);
      if (la > 0.03 && hh > 1.1) { x.fillStyle = rgb(lt && day < 0.3 ? addc(lip, lt, 0.8) : lip, Math.min(0.8, la) * (0.55 + r() * 0.45)); x.fillRect(ax + ww * 0.24, ay + hh * 0.12, ww * 0.5, Math.max(0.35, hh * 0.13)); }
      if (r() < 0.08) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.roundRect(ax, ay, ww, hh, rad); x.fill(); }
      x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(ax + rad * 0.5, by - Math.max(0.3, hh * 0.12), ww - rad, Math.max(0.3, hh * 0.12));
    }
  };
  for (let i = 0; i < rows.length; i += 4) { const part = rows.slice(i, i + 4); steps.push(x => { for (const [z0, z1, ri] of part) paint(x, z0, z1, ri); }); }
  // 3. THE CURB BAND (z 51.2 → the road's kerb): big granite pavers in a running bond, each its own shade, a lit far edge
  steps.push(x => {
    const r = rngFrom(977), pv = shade(sett, 0.04);
    for (let z = zBack, ri = 0; z < 54; z += 1.0, ri++) {
      const z1 = Math.min(54, z + 1.0), off = (ri % 2) * 0.9;
      for (let wx = -hw(z) - off; wx < hw(z); wx += 1.8) {
        const [ax, ay] = P(wx + 0.05, z1 - 0.04), [bx, by] = P(wx + 1.75, z + 0.04);
        let c = mulc(pv, 0.9 + r() * 0.18);
        const lt = lightAt ? lightAt(wx + 0.9, z + 0.5) : null;
        if (lt) c = addc(c, lt, 0.5);
        x.fillStyle = rgb(c); x.fillRect(ax, ay, bx - ax, by - ay);
        x.fillStyle = rgb(shade(c, 0.1 + 0.08 * day)); x.fillRect(ax, ay, bx - ax, Math.max(0.3, (by - ay) * 0.22));
      }
    }
  });
  // 4. THE FRONT CURB (the implied road's granite kerb): long dressed blocks, a rounded lit top, the joints, its face in shade
  if (on) steps.push(x => {
    const r = rngFrom(533), kb = shade(sett, 0.1), za = e.z, zb = e.z + e.curbW, ya = groundY(cam, zb), yb = groundY(cam, za), face = Math.max(1.2, cam.F * 0.32 / za);
    for (let wx = -hw(za) - 0.6; wx < hw(za); wx += 2.4) {
      const [ax] = P(wx + 0.03, za), [bx] = P(wx + 2.37, za);
      let c = mulc(kb, 0.92 + r() * 0.14);
      const lt = lightAt ? lightAt(wx + 1.2, zb) : null;
      if (lt) c = addc(c, lt, 0.6);
      x.fillStyle = rgb(c); x.fillRect(ax, ya, bx - ax, yb - ya);
      x.fillStyle = rgb(shade(c, 0.16 + 0.1 * day)); x.fillRect(ax, ya, bx - ax, Math.max(0.5, (yb - ya) * 0.35));
      x.fillStyle = rgb(shade(c, -0.32)); x.fillRect(ax, yb, bx - ax, face);
    }
  });
  // 5. the shadows by day (along the real sun), then the medallion inlaid in the paving
  steps.push(x => {
    const cx = pieceCtx(L);
    lampShadows(x, L, T);
    L.trees.forEach((t, i) => treeShadow(x, cam, t, T, { ...cx, i }));
    for (const b of [L.bench, ...(L.bench.more || [])]) propShadow(x, cam, b, 'bench', T, cx);
    propShadow(x, cam, L.cart, 'cart', T, cx);
    for (const p of L.planters) propShadow(x, cam, p, 'planter', T, cx);
    drawMedallion(x, cam, L.medallion, T, cx);
  });
  return steps;
}
function lampShadows(x, L, T) {
  const cam = L.cam;
  for (const l of L.lamps) {
    const sh = sunShadow(T, l.h);
    if (!sh) return;
    const w = l.kind === 'tall' ? 0.17 : 0.12, [a0, ya0] = project(cam, l.x - w, 0, l.z), [b0] = project(cam, l.x + w, 0, l.z), [a1, ya1] = project(cam, l.x + sh.dx, 0, l.z + sh.dz);
    const tw = (b0 - a0) * 0.45;
    x.fillStyle = `rgba(28,22,44,${sh.a})`; x.beginPath(); x.moveTo(a0, ya0); x.lineTo(b0, ya0); x.lineTo(a1 + tw, ya1); x.lineTo(a1 - tw, ya1); x.closePath(); x.fill();
    const r = cam.F * (l.kind === 'tall' ? 0.42 : 0.36) / (l.z + sh.dz);   // the heads' blot at the shadow's end
    x.beginPath(); x.ellipse(a1, ya1, r * (l.kind === 'tall' ? 2.6 : 1.1), r * 0.36, 0, 0, Math.PI * 2); x.fill();
  }
}

// ------------------------------------------------------------------ THE LAMPS (crafted, baked; their glass lit live)
// painted cast iron (a deep green-black, its sun side catching the light), brass collars, opal glass. Screen-space drawing round the
// post's projected axis (s = pt a unit at its depth): a stepped Deco plinth, a fluted tapering post with collars, a stepped capital;
// the TALL lamp's crossarm on scrolled brackets with an opal globe at each end + a centre finial; the GLOBE lamp's bell base and one
// big opal globe in a Deco cup. l.heads: the globes on screen (the live glow draws them lit).
function lampLook(T, sd) {
  const iron = tri(T, [40, 52, 48], [50, 38, 46], [16, 16, 26]), ironLit = tri(T, [124, 138, 126], [214, 150, 106], [34, 34, 52]);
  const brass = tri(T, [192, 156, 90], [236, 172, 100], [62, 52, 50]), brassLit = tri(T, [246, 222, 160], [255, 214, 150], [96, 82, 72]);
  const glass = tri(T, [226, 232, 238], [250, 214, 186], [52, 50, 70]), glassSh = tri(T, [168, 180, 198], [196, 150, 140], [34, 32, 50]);
  return { iron, ironLit, brass, brassLit, glass, glassSh, sd: sd || 0.6 };
}
function drawLamp(x, cam, l, T) {
  const s = cam.F / l.z, [cx, gy] = project(cam, l.x, 0, l.z), Y = v => gy - v * s, M = lampLook(T, T.sunDir), lk = Math.min(1, (T.lamps || 0) * 1.2);
  const litSide = M.sd >= 0 ? 1 : -1;
  // a vertical piece: a trapezoid from v0 (w0 wide) to v1 (w1 wide) — the body, its lit side, a dark edge
  const seg = (v0, v1, w0, w1, col, lit, k = 0.3) => {
    const a = w0 * s / 2, b = w1 * s / 2;
    x.fillStyle = rgb(col); x.beginPath(); x.moveTo(cx - a, Y(v0)); x.lineTo(cx + a, Y(v0)); x.lineTo(cx + b, Y(v1)); x.lineTo(cx - b, Y(v1)); x.closePath(); x.fill();
    x.fillStyle = rgb(lit); x.beginPath(); x.moveTo(cx + litSide * a, Y(v0)); x.lineTo(cx + litSide * a * (1 - k * 2), Y(v0)); x.lineTo(cx + litSide * b * (1 - k * 2), Y(v1)); x.lineTo(cx + litSide * b, Y(v1)); x.closePath(); x.fill();
  };
  const band = (v, w, hgt, col, lit) => { x.fillStyle = rgb(col); x.fillRect(cx - w * s / 2, Y(v + hgt), w * s, hgt * s); x.fillStyle = rgb(lit); x.fillRect(cx - w * s / 2, Y(v + hgt), w * s, Math.max(0.4, hgt * s * 0.35)); };
  // the light the globes throw on the ironwork right under them at night (a warm / cool rim on the tops of the capital + the arm)
  const glow = l.kind === 'tall' ? [200, 214, 236] : [255, 206, 140];
  const lit2 = c => (lk > 0 ? mix(c, glow, 0.45 * lk) : c);
  if (l.kind === 'tall') {
    // the stepped plinth, the fluted post (a brass collar low + a band at the top third), the stepped capital
    seg(0, 0.28, 0.86, 0.86, M.iron, M.ironLit); band(0.28, 0.72, 0.16, M.iron, M.ironLit); band(0.44, 0.56, 0.12, M.iron, M.ironLit);
    seg(0.56, 1.25, 0.34, 0.26, M.iron, M.ironLit, 0.22);
    band(1.25, 0.36, 0.1, M.brass, M.brassLit);
    seg(1.35, l.h - 1.05, 0.24, 0.16, M.iron, M.ironLit, 0.2);
    x.fillStyle = rgb(shade(M.iron, -0.3), 0.8);                                  // the flutes
    for (const f of [-0.25, 0.25]) { x.fillRect(cx + f * 0.2 * s - 0.25, Y(l.h - 1.1), 0.5, (l.h - 2.5) * s); }
    band(l.h * 0.62, 0.22, 0.08, M.brass, M.brassLit);
    band(l.h - 1.05, 0.22, 0.08, M.iron, lit2(M.ironLit)); band(l.h - 0.97, 0.3, 0.08, M.iron, lit2(M.ironLit)); band(l.h - 0.89, 0.38, 0.09, M.brass, lit2(M.brassLit));
    // the crossarm on two scrolled brackets, the finial
    const armY = l.h - 0.8, A = l.arm * s;
    x.fillStyle = rgb(M.iron); x.fillRect(cx - A, Y(armY + 0.05), A * 2, Math.max(1, 0.1 * s));
    x.fillStyle = rgb(lit2(M.ironLit)); x.fillRect(cx - A, Y(armY + 0.05), A * 2, Math.max(0.4, 0.035 * s));
    x.strokeStyle = rgb(M.iron); x.lineWidth = Math.max(0.6, 0.06 * s); x.lineCap = 'round';
    for (const d of [-1, 1]) { x.beginPath(); x.moveTo(cx + d * 0.08 * s, Y(armY - 0.75)); x.quadraticCurveTo(cx + d * A * 0.2, Y(armY - 0.1), cx + d * A * 0.72, Y(armY - 0.02)); x.stroke(); x.beginPath(); x.arc(cx + d * A * 0.3, Y(armY - 0.38), 0.07 * s, 0, Math.PI * 2); x.stroke(); }
    seg(armY + 0.05, armY + 0.32, 0.16, 0.08, M.iron, lit2(M.ironLit)); x.fillStyle = rgb(M.brass); x.beginPath(); x.arc(cx, Y(armY + 0.38), 0.07 * s, 0, Math.PI * 2); x.fill();
    l.heads = [-1, 1].map(d => globe(x, cx + d * A, Y(armY + 0.06), s, 0.5, 0.6, M, lit2, d));
  } else {
    // the bell base (flaring), the slim fluted post, the brass collar, the Deco cup, ONE big opal globe
    seg(0, 0.14, 0.62, 0.62, M.iron, M.ironLit); seg(0.14, 0.62, 0.5, 0.2, M.iron, M.ironLit, 0.24);
    band(0.62, 0.24, 0.08, M.brass, M.brassLit);
    seg(0.7, l.h - 0.3, 0.16, 0.12, M.iron, M.ironLit, 0.2);
    band(l.h * 0.6, 0.18, 0.07, M.brass, M.brassLit);
    band(l.h - 0.3, 0.2, 0.08, M.iron, lit2(M.ironLit)); band(l.h - 0.22, 0.3, 0.08, M.iron, lit2(M.ironLit)); band(l.h - 0.14, 0.38, 0.1, M.brass, lit2(M.brassLit));
    l.heads = [globe(x, cx, Y(l.h - 0.04), s, 0.66, 0.7, M, lit2, 0)];
  }
  l.head = l.heads[0];
}
/** an opal glass globe sitting on (sx, footY): its body (the sky / sun on one side, shade on the other by day; unlit at night — the
 *  live glow lights it), the brass ring at its foot, a small cap + finial; → the head for the live glow */
function globe(x, sx, footY, s, w, h, M, lit2, d) {
  const rw = w * s / 2, rh = h * s / 2, gcy = footY - rh;
  const g = x.createLinearGradient(sx - rw, 0, sx + rw, 0), lf = M.sd >= 0;
  g.addColorStop(0, rgb(lf ? M.glassSh : M.glass)); g.addColorStop(0.55, rgb(mix(M.glass, M.glassSh, 0.3))); g.addColorStop(1, rgb(lf ? M.glass : M.glassSh));
  x.fillStyle = g; x.beginPath(); x.ellipse(sx, gcy, rw, rh, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(shade(M.glass, 0.25), 0.7); x.beginPath(); x.ellipse(sx + (lf ? 0.32 : -0.32) * rw, gcy - rh * 0.4, rw * 0.22, rh * 0.18, 0, 0, Math.PI * 2); x.fill();   // the glint
  x.fillStyle = rgb(M.brass); x.fillRect(sx - rw * 0.55, footY - Math.max(0.6, 0.06 * s), rw * 1.1, Math.max(0.8, 0.08 * s));
  x.fillStyle = rgb(lit2(M.brassLit)); x.fillRect(sx - rw * 0.55, footY - Math.max(0.6, 0.06 * s), rw * 1.1, Math.max(0.35, 0.03 * s));
  x.fillStyle = rgb(M.iron); x.beginPath(); x.ellipse(sx, gcy - rh * 0.97, rw * 0.36, Math.max(0.6, rh * 0.12), 0, Math.PI, 0); x.fill();
  x.fillStyle = rgb(M.brass); x.beginPath(); x.arc(sx, gcy - rh * 1.12, Math.max(0.5, 0.045 * s), 0, Math.PI * 2); x.fill();
  return { x: sx, y: gcy, rw, rh, s, d };
}

/** the stage's still pieces, far first (PART 7a: keep(item) picks a share by depth — the scene bakes the ones behind / beside the
 *  speakeasy into 'stage' and the front row into 'front', over the speakeasy's live layer) */
export function furnitureSteps(L, T, keep = null) {
  const cam = L.cam, cx = pieceCtx(L);
  const items = [
    ...L.lamps.map(l => ({ z: l.z, f: x => drawLamp(x, cam, l, T) })),
    ...L.trees.map((t, i) => ({ z: t.z, heavy: true, f: x => drawTree(x, cam, t, T, { ...cx, i }) })),
    ...[L.bench, ...(L.bench.more || [])].map(b => ({ z: b.z, f: x => drawBench(x, cam, b, T, cx) })),
    ...L.planters.map(p => ({ z: p.z, f: x => drawPlanter(x, cam, p, T, cx) })),
    { z: L.cart.z, f: x => drawCart(x, cam, L.cart, T, cx) },
  ].filter(it => !keep || keep(it)).sort((a, b) => b.z - a.z);
  const steps = [];
  // (a tree is the heavy piece — ~1.1–1.5 ms at 1× CPU, ~5–6 at 4×: each in a step of its own; the rest three to a step)
  let part = [];
  const flush = () => { if (part.length) { const p = part; steps.push(x => { for (const it of p) it.f(x); }); part = []; } };
  for (const it of items) { if (it.heavy) { flush(); steps.push(x => it.f(x)); } else { part.push(it); if (part.length === 3) flush(); } }
  flush();
  return steps;
}

const COATS = [[200, 50, 62], [60, 74, 106], [60, 122, 90], [224, 168, 58], [138, 79, 168], [42, 42, 54], [200, 66, 58], [30, 30, 40]];
/** the people, far first (drawn every frame: Part 8 walks them; nobody under the dock) */
export function drawPeople(c, L, T) {
  const cam = L.cam, night = T.night > 0.5;
  [...L.people].sort((a, b) => b.z - a.z).forEach((p, i) => {
    const col = night ? shade(COATS[i % COATS.length], -0.55) : COATS[i % COATS.length];
    person(c, cam, p, col, { hat: shade(col, -0.4), rim: night ? Object.assign([255, 210, 150], { side: p.x < 0 ? 1 : -1 }) : null });
  });
}

/**
 * THE LAMPS' GLASS, LIT (live, every frame; the pools are baked into the stones): each opal globe glowing from inside — a white-hot
 * heart, the warm (globe) / cool-white (street lamp) glass — and a small soft halo round it (never a screen-wide wash). k: the
 * lamps' ramp now. The sprites are cached per kind + size.
 */
const litCache = new Map();
function litGlass(kind, rw, rh, dpr) {
  const key = `${kind}|${Math.round(rw * 4)}|${Math.round(rh * 4)}|${dpr}`;
  if (litCache.has(key)) return litCache.get(key);
  const c = document.createElement('canvas'), W = Math.ceil(rw * 2 * dpr) + 2, H = Math.ceil(rh * 2 * dpr) + 2;
  c.width = W; c.height = H;
  const x = safeCtx(c);
  if (x) {
    const g = x.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H / 2, Math.max(W, H) / 2);
    const edge = kind === 'tall' ? '196,214,246' : '255,190,110';
    g.addColorStop(0, 'rgba(255,255,250,1)'); g.addColorStop(0.45, kind === 'tall' ? 'rgba(236,244,255,1)' : 'rgba(255,236,196,1)'); g.addColorStop(1, `rgba(${edge},0.92)`);
    x.fillStyle = g; x.beginPath(); x.ellipse(W / 2, H / 2, W / 2 - 1, H / 2 - 1, 0, 0, Math.PI * 2); x.fill();
  }
  if (litCache.size > 16) { for (const v of litCache.values()) v.width = v.height = 0; litCache.clear(); }
  litCache.set(key, c);
  return c;
}
export function drawLampLight(c, L, k, glow, cool = glow, dpr = 2) {
  if (k < 0.02) return;
  for (const l of L.lamps) {
    if (!l.heads) continue;
    const tall = l.kind === 'tall';
    for (const h of l.heads) {
      if (h.rw == null) continue;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, k * 1.1);
      c.drawImage(litGlass(l.kind, h.rw, h.rh, dpr), h.x - h.rw - 0.5, h.y - h.rh - 0.5, h.rw * 2 + 1, h.rh * 2 + 1);
      c.globalCompositeOperation = 'lighter';
      const r = Math.max(h.rw, h.rh) * (tall ? 3.2 : 3.6);
      c.globalAlpha = (tall ? 0.42 : 0.5) * k; c.drawImage(tall ? cool : glow, h.x - r, h.y - r, r * 2, r * 2);
      const r2 = Math.max(h.rw, h.rh) * 1.7; c.globalAlpha = 0.55 * k; c.drawImage(tall ? cool : glow, h.x - r2, h.y - r2, r2 * 2, r2 * 2);
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
export function freeLampLight() { for (const v of litCache.values()) v.width = v.height = 0; litCache.clear(); }
