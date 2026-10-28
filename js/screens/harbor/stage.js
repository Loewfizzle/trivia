// CITY 2.0 — THE HARBOR: the promenade nearest us — the near STAGE where life happens. PART 8a (core/harbor-promenade.js: the
// plan): THE CURB BAND (tall double-head Deco lamps, sugar maples in iron grates), THE PLAZA (open cobbles in front of the
// speakeasy's door, the centrepiece MEDALLION in its middle), the middle band (the bench, the vendor cart, the stone flower
// planters), THE FRONT WALK (short warm globe lamps, big planters, the front maple), THE IMPLIED ROAD's granite curb along the bottom
// edge (cars only as light: harbor/roadlight.js). No flagpole (the owner: flags only on holidays — a later part dresses the posts).
// This file: THE GROUND (granite setts whose tops catch the light, the curb band's pavers, the front curb, the asphalt) with the
// lamps' POOLS baked into the stones at night (T.lamps — the lamps' ramp in sixths: no haze, no per-frame cost), the cast shadows
// by day, THE LAMPS (crafted Deco ironwork + opal glass; their glass lit live: drawLampLight); the trees (trees.js) and the props
// (props.js) are drawn from here; the people are 8P's (people.js + folk.js, drawn live by the scene).
import { project, groundY } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, shade, mix } from './shapes.js';
import { drawTree, treeShadow } from './trees.js';
import { drawBench, drawCart, drawMedallion, propShadow } from './props.js';
import { drawPlanter, drawMailbox } from './props-garden.js';
import { pieceCtx, LIGHT, REACH, lightSources, lightField, sunShadow, IMPLIED_LIGHT } from '../../core/harbor-light.js';

/** PROM — an implied lamp's light as a ground ellipse (the baked low glow in the joints + the dusk's dimming): its centre well up the
 *  promenade from the lamp (below the screen), rx across, rz along (world units) */
export const impliedEll = s => ({ x: s.x, z: s.z + IMPLIED_LIGHT.ell.dz, rx: IMPLIED_LIGHT.ell.rx, rz: IMPLIED_LIGHT.ell.rz });
import { paintSett, streetSteps, streetOver } from './street.js';

const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const cl = v => (v < 0 ? 0 : v > 255 ? 255 : v);
const addc = (c, l, k = 1) => [cl(c[0] + l[0] * k), cl(c[1] + l[1] * k), cl(c[2] + l[2] * k)];
const mulc = (c, m) => [c[0] * m, c[1] * m, c[2] * m];

// (FP3a: pieceCtx, the pools' LIGHT / REACH, lightSources, lightField + sunShadow live in core/harbor-light.js — one light model)

// ------------------------------------------------------------------ THE GROUND (baked into 'stage')
// the granite setts (warm grey by day, rosy at golden hour, a deep violet-grey at night), the joints (sand + grime); the street
// under the dock: street.js (FP2)
const SETT = { d: [154, 148, 140], g: [176, 130, 112], n: [64, 59, 86] };
// (FP2 — THE COBBLES AT NIGHT, the owner's "piano keys": the joints a mid-tone GROUT of packed sand at night — was a near-black
// [30, 28, 46] — lit by the lamps a little less than the stones' tops: paint below)
const JOINT = { d: [112, 105, 97], g: [120, 86, 78], n: [54, 50, 66] };
/**
 * THE PAVING (baked, in small steps): THE STREET under the dock (FP2: street.js) + the promenade's granite front curb, the front walk +
 * the plaza's SETTS (rounded granite, exaggerated ~3× so they read on a phone like the bricks: stone by stone its own shade, the far
 * half — the top facing the sky — lighter, a bright lip by day; at night each stone takes the light where it lies — the POOLS — and
 * so does the GROUT round it, a little less: FP2, soft rounded stones on a mid-tone sand, never black "piano key" gaps), the
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
  // 1. the base: the joints' colour under everything, the lamps' light low in the joints (FP2: the implied road's asphalt became THE
  //    STREET — street.js, its steps right after this one)
  steps.push(x => {
    const y0 = groundY(cam, L.prom.z1);
    x.fillStyle = rgb(joint); x.fillRect(0, y0, cam.W, cam.H - y0);
    if (lightAt) {
      x.globalCompositeOperation = 'lighter';
      for (const s of lightSources(L)) {
        // (PROM: an implied lamp's glow — its ellipse up the promenade, softer: its light is spread wide)
        const E = s.implied ? impliedEll(s) : null, R = E ? E.rz : REACH[s.kind], zc = E ? E.z : s.z, [cx] = P(s.x, zc), ya = groundY(cam, zc + R), yb = groundY(cam, Math.max(cam.F * 0.03, zc - R)), rw = cam.F * (E ? E.rx : R) / zc;
        const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, rgb(mulc(LIGHT[s.kind], (T.lamps || 0) * (E ? 0.3 : 0.45) * s.k))); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.save(); x.translate(cx, (ya + yb) / 2); x.scale(rw, (yb - ya) / 2); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
      }
      x.globalCompositeOperation = 'source-over';
    }
  });
  // THE STREET under the dock (FP2): the gutter, the setts, the track, the manhole, the drain, the wet hook — under the front curb
  if (on) steps.push(...streetSteps(L, T, lightAt));
  // 2. THE SETTS (FP2: each course's GROUT first — the joints' sand, lit where it lies at ~0.7 of a stone's light — then the stones,
  //    rounded + soft at night: street.js#paintSett, the painter the street shares)
  const DZ = 0.72, DX = 0.95, GAP = 0.085, night = T.night || 0;
  const rows = [];
  for (let z = zFront, i = 0; z < zBack - 0.05; z += DZ, i++) rows.push([z, Math.min(zBack, z + DZ), i]);
  const lip = tri(T, [255, 248, 232], [255, 206, 160], [70, 66, 96]);
  const paint = (x, z0, z1, ri) => {
    const r = rngFrom(4049 + ri * 131), off = (ri % 2) * DX * 0.5, H = hw(z0), zc = (z0 + z1) / 2, stones = [];
    for (let wx = -H - off; wx < H; wx += DX) {
      const w = DX * (0.84 + r() * 0.28);
      stones.push({ wx, x0: wx + GAP / 2, x1: wx + w - GAP / 2, v: 0.84 + r() * 0.28, tint: r(), a: r(), b: r() });
    }
    // the grout: this course's band, cell by cell, lit where it lies (the joints catch the lamps too — a little less than the tops)
    for (const st of stones) {
      const [gx, gy] = P(st.wx, z1), [hx, hy] = P(st.wx + DX, z0);
      if (hx < -2 || gx > cam.W + 2) continue;
      const lt = lightAt ? lightAt(st.wx + DX / 2, zc) : null;
      x.fillStyle = rgb(lt ? addc(joint, lt, 0.42) : joint); x.fillRect(gx, gy, hx - gx + 0.6, hy - gy + 0.4);
    }
    const za = z0 + GAP / 2, zb = z1 - GAP / 2;
    for (const st of stones) {
      const [ax, ay] = P(st.x0, zb), [bx, by] = P(st.x1, za);              // ay: the stone's far edge (higher on screen), by: its near edge
      const ww = bx - ax, hh = by - ay;
      if (ww < 0.6 || hh < 0.4 || bx < -2 || ax > cam.W + 2) continue;
      let c = mulc(sett, st.v);
      if (st.tint < 0.2) c = addc(c, [10, 4, -4], 0.6 + 0.4 * day); else if (st.tint < 0.32) c = addc(c, [-6, -2, 7], 0.6 + 0.4 * day);
      const lt = lightAt ? lightAt((st.x0 + st.x1) / 2, zc) : null;
      if (lt) c = addc(c, lt, 0.58);
      // (8P — FLATTER, the owner: no pillow highlight on each stone; grouted joints — street.js#paintFlat)
      paintSett(x, ax, ay, ww, hh, c, { lt, day, night, lip, grout: joint, a: st.a, b: st.b, flat: true });
    }
  };
  // (FP2: the soft night stones cost ~2× a day stone — two rows a step at night, so no bake step grows past a tree's)
  const per = night > 0.05 ? 2 : 4;
  for (let i = 0; i < rows.length; i += per) { const part = rows.slice(i, i + per); steps.push(x => { for (const [z0, z1, ri] of part) paint(x, z0, z1, ri); }); }
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
  if (on) { const ov = streetOver(L, T); if (ov) steps.push(ov); }          // (FP2: the storm drain's inlet in the curb's face)
  // 5. THE INLAY laid in the paving (PF: the brick compass rose — lit by the same baked pools as the setts), then the shadows by day
  //    along the real sun (over it: a tree's shadow falls across the bricks too)
  steps.push(x => {
    const cx = pieceCtx(L);
    drawMedallion(x, cam, L.medallion, T, { ...cx, lightAt });
    lampShadows(x, L, T);
    L.trees.forEach((t, i) => treeShadow(x, cam, t, T, { ...cx, i }));
    for (const b of benchesOf(L)) propShadow(x, cam, b, 'bench', T, cx);
    if (L.cart.shown !== false && !L.cart.live) propShadow(x, cam, L.cart, 'cart', T, cx);   // (FP3b: the live cart draws its own)
    for (const p of L.planters) propShadow(x, cam, p, 'planter', T, cx);
    if (L.mailbox) propShadow(x, cam, L.mailbox, 'mailbox', T, cx);   // (PF)
  });
  return steps;
}
/** 9b: the shadows by day again, over the snow (groundSteps covers the first ones): the lamps', the trees', the props' */
export function shadowsStep(L, T) {
  return x => {
    const cam = L.cam, cx = pieceCtx(L);
    x.globalAlpha = 0.55;                    // (softer on the snow: a pale blue shadow, never the stones' dark one)
    lampShadows(x, L, T);
    L.trees.forEach((t, i) => treeShadow(x, cam, t, T, { ...cx, i }));
    for (const b of benchesOf(L)) propShadow(x, cam, b, 'bench', T, cx);
    if (L.cart.shown !== false && !L.cart.live) propShadow(x, cam, L.cart, 'cart', T, cx);
    for (const p of L.planters) propShadow(x, cam, p, 'planter', T, cx);
    if (L.mailbox) propShadow(x, cam, L.mailbox, 'mailbox', T, cx);
  };
}
/** PROM — every bench of a layout: the water bench, the cab stand, a panorama's extras */
export const benchesOf = L => [L.bench, ...(L.cabStand ? [L.cabStand] : []), ...((L.bench && L.bench.more) || [])].filter(Boolean);
function lampShadows(x, L, T) {
  const cam = L.cam;
  for (const l of L.lamps) {
    if (l.implied) continue;                       // (PROM: behind the viewer — nothing stands on the promenade)
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
export function furnitureSteps(L, T, keep = null, crownOf = null) {
  const cam = L.cam, cx = pieceCtx(L);
  const items = [
    ...L.lamps.filter(l => !l.implied).map(l => ({ z: l.z, f: x => drawLamp(x, cam, l, T) })),
    // (PROM — a tree out on the FLOOR (the framing maple, z 42): crownOf(item) → a screen y: only the part ABOVE it is drawn (the crown —
    // the front layer lays it over the walkers behind it, while anyone in front walks over its trunk in the stage layer))
    ...L.trees.map((t, i) => ({ z: t.z, heavy: true, tree: t, f: x => { const cy = crownOf ? crownOf({ tree: t, z: t.z }) : null; if (cy != null) { x.save(); x.beginPath(); x.rect(-50, -50, cam.W + 100, cy + 50); x.clip(); } drawTree(x, cam, t, T, { ...cx, i }); if (cy != null) x.restore(); } })),
    // (PROM: the water bench + the cab stand are LIVE — still.js, sorted with the walkers at the phone's full dpr; a panorama's extras stay baked)
    ...((L.bench && L.bench.more) || []).map(b => ({ z: b.z, f: x => drawBench(x, cam, b, T, cx) })),
    ...L.planters.map(p => ({ z: p.z, f: x => drawPlanter(x, cam, p, T, cx) })),
    ...(L.cart.shown !== false && !L.cart.live ? [{ z: L.cart.z, f: x => drawCart(x, cam, L.cart, T, cx) }] : []),   // (FP3b: the cart is LIVE — people.js draws it on its schedule)
    ...(L.mailbox ? [{ z: L.mailbox.z, f: x => drawMailbox(x, cam, L.mailbox, T, cx) }] : []),     // (PF: the 1920s pillar box)
  ].filter(it => !keep || keep(it)).sort((a, b) => b.z - a.z);
  const steps = [];
  // (a tree is the heavy piece — ~1.1–1.5 ms at 1× CPU, ~5–6 at 4×: each in a step of its own; the rest three to a step)
  let part = [];
  const flush = () => { if (part.length) { const p = part; steps.push(x => { for (const it of p) it.f(x); }); part = []; } };
  for (const it of items) { if (it.heavy) { flush(); steps.push(x => it.f(x)); } else { part.push(it); if (part.length === 3) flush(); } }
  flush();
  return steps;
}

/**
 * THE LAMPS' GLASS, LIT (live, every frame; the pools are baked into the stones): each opal globe glowing from inside — a white-hot
 * heart, the warm (globe) / cool-white (street lamp) glass — and a small soft halo round it (never a screen-wide wash). k: the
 * lamps' ramp now. The sprites are cached per kind + size.
 */
/** FP2: the lamps' halos in globe radii (tight: the outer glow, the inner bloom). 8P — CRISP GLOBES (the owner: "no soft blob"): tighter
 *  still, and the glass drawn as a vector ellipse every frame (a sprite stretched over it softened its edge) */
export const LAMP_HALO = Object.freeze({ globe: 1.75, tall: 1.6, inner: 1.18 });
const GLASS_STOPS = { tall: ['236,244,255', '196,214,246'], globe: ['255,236,196', '255,190,110'] };
/**
 * levels: each lamp's own level (8P — THE LAMPS' LIFE: core/harbor-lamps.js — the switch-on one by one, the rare stutter / outage),
 * 1 when absent. The glass: a white-hot heart, the warm (globe) / cool-white (street lamp) opal, a crisp rim; a TIGHT halo.
 */
export function drawLampLight(c, L, k, glow, cool = glow, dpr = 2, levels = null) {
  if (k < 0.02) return;
  L.lamps.forEach((l, li) => {
    const lv = levels ? levels[li] : 1;
    if (!l.heads || lv <= 0.01) return;
    const tall = l.kind === 'tall', st = GLASS_STOPS[tall ? 'tall' : 'globe'], a = Math.min(1, k * 1.1 * lv);
    for (const h of l.heads) {
      if (h.rw == null) continue;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
      const g = c.createRadialGradient(h.x, h.y + h.rh * 0.1, 0, h.x, h.y, Math.max(h.rw, h.rh));
      g.addColorStop(0, 'rgb(255,255,250)'); g.addColorStop(0.45, `rgb(${st[0]})`); g.addColorStop(0.92, `rgb(${st[1]})`); g.addColorStop(1, `rgba(${st[1]},0.85)`);
      c.fillStyle = g; c.beginPath(); c.ellipse(h.x, h.y, h.rw, h.rh, 0, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = 'lighter';
      const r = Math.max(h.rw, h.rh) * (tall ? LAMP_HALO.tall : LAMP_HALO.globe);
      c.globalAlpha = (tall ? 0.4 : 0.46) * k * lv; c.drawImage(tall ? cool : glow, h.x - r, h.y - r, r * 2, r * 2);
      const r2 = Math.max(h.rw, h.rh) * LAMP_HALO.inner; c.globalAlpha = 0.55 * k * lv; c.drawImage(tall ? cool : glow, h.x - r2, h.y - r2, r2 * 2, r2 * 2);
    }
  });
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
/** 8P — a lamp that is OFF (not caught yet at dusk, or out for a moment) while its pool is baked lit: its pool taken back down (a
 *  multiply over the pool's ellipse on the paving). off: each lamp's 0..1 darkness; baked: the bake's T.lamps */
export function dimPools(c, L, off, baked) {
  if (!off || baked < 0.02) return;
  const cam = L.cam, src = lightSources(L);
  c.save(); c.globalCompositeOperation = 'multiply';
  L.lamps.forEach((l, i) => {
    const d = off[i] || 0; if (d < 0.02) return;
    // (PROM: an implied lamp's pool is its wide ellipse up the promenade — the dusk's switch-on + the rare outage darken that)
    const sr = src[i], E = sr.implied ? impliedEll(sr) : null, R = E ? E.rz : REACH[sr.kind], zc = E ? E.z : sr.z, [cx] = project(cam, sr.x, 0, zc), ya = groundY(cam, zc + R / 1.15), yb = groundY(cam, Math.max(cam.F * 0.03, zc - R / 1.15)), rw = cam.F * (E ? E.rx : R) / zc;
    const m = Math.round(255 * (1 - Math.min(0.62, d * baked * sr.k * 0.6))), g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgb(${m},${m},${m})`); g.addColorStop(0.5, `rgb(${Math.round((m + 255) / 2)},${Math.round((m + 255) / 2)},${Math.round((m + 255) / 2)})`); g.addColorStop(1, 'rgb(255,255,255)');
    c.save(); c.translate(cx, (ya + yb) / 2); c.scale(rw, (yb - ya) / 2); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
  });
  c.restore();
}
