// CITY 2.0 — THE HARBOR: the promenade nearest us — the near STAGE where life happens. PART 8a (core/harbor-promenade.js: the
// plan): THE CURB BAND (tall double-head Deco lamps, sugar maples in iron grates), THE PLAZA (open cobbles in front of the
// speakeasy's door, the centrepiece MEDALLION in its middle), the middle band (the bench, the vendor cart, the stone flower
// planters), THE FRONT WALK (short warm globe lamps, big planters, the front maple), THE IMPLIED ROAD's granite curb along the bottom
// edge (cars only as light: harbor/roadlight.js). No flagpole (the owner: flags only on holidays — a later part dresses the posts).
// This file: THE GROUND (granite setts whose tops catch the light, the curb band's pavers, the front curb, the asphalt) with the
// lamps' POOLS baked into the stones at night (T.lamps — the lamps' ramp in sixths: no haze, no per-frame cost), the cast shadows
// by day (PROM — no lampposts: C4d took their painters out; the lamps are the IMPLIED row below the screen); the trees (trees.js) and the props
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
const impliedEll = s => ({ x: s.x, z: s.z + IMPLIED_LIGHT.ell.dz, rx: IMPLIED_LIGHT.ell.rx, rz: IMPLIED_LIGHT.ell.rz });
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
    L.trees.forEach((t, i) => treeShadow(x, cam, t, T, { ...cx, i }));
    for (const b of benchesOf(L)) propShadow(x, cam, b, 'bench', T, cx);
    if (L.cart.shown !== false && !L.cart.live) propShadow(x, cam, L.cart, 'cart', T, cx);
    for (const p of L.planters) propShadow(x, cam, p, 'planter', T, cx);
    if (L.mailbox) propShadow(x, cam, L.mailbox, 'mailbox', T, cx);
  };
}
/** PROM — every bench of a layout: the water bench, the cab stand, a panorama's extras */
const benchesOf = L => [L.bench, ...(L.cabStand ? [L.cabStand] : []), ...((L.bench && L.bench.more) || [])].filter(Boolean);

/** the stage's still pieces, far first (PART 7a: keep(item) picks a share by depth — the scene bakes the ones behind / beside the
 *  speakeasy into 'stage' and the front row into 'front', over the speakeasy's live layer) */
export function furnitureSteps(L, T, keep = null, crownOf = null) {
  const cam = L.cam, cx = pieceCtx(L);
  const items = [
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

/** 8P — a lamp that is OFF (not caught yet at dusk, or out for a moment) while its pool is baked lit: its pool taken back down (a
 *  multiply over the pool's ellipse on the paving). off: each lamp's 0..1 darkness; baked: the bake's T.lamps */
export function dimPools(c, L, off, baked, all = 0) {
  // (C4b: `all` 0..1 — the blackout: EVERY baked source's pool (the implied lamps, the hidden + the cab stand's lamps, the speakeasy's
  // spill) taken down by that much, harder than an outage (up to 0.85 of its light))
  if ((!off && !(all > 0.02)) || baked < 0.02) return;
  const cam = L.cam, src = lightSources(L), cap = all > 0 ? 0.85 : 0.62;
  c.save(); c.globalCompositeOperation = 'multiply';
  (all > 0 ? src : L.lamps).forEach((l, i) => {
    const d = all > 0 ? all : off[i] || 0; if (d < 0.02) return;
    // (PROM: an implied lamp's pool is its wide ellipse up the promenade — the dusk's switch-on + the rare outage darken that)
    const sr = src[i], E = sr.implied ? impliedEll(sr) : null, R = E ? E.rz : REACH[sr.kind], zc = E ? E.z : sr.z, [cx] = project(cam, sr.x, 0, zc), ya = groundY(cam, zc + R / 1.15), yb = groundY(cam, Math.max(cam.F * 0.03, zc - R / 1.15)), rw = cam.F * (E ? E.rx : R) / zc;
    const m = Math.round(255 * (1 - Math.min(cap, d * baked * (sr.k ?? 1) * (all > 0 ? 1 : 0.6)))), g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgb(${m},${m},${m})`); g.addColorStop(0.5, `rgb(${Math.round((m + 255) / 2)},${Math.round((m + 255) / 2)},${Math.round((m + 255) / 2)})`); g.addColorStop(1, 'rgb(255,255,255)');
    c.save(); c.translate(cx, (ya + yb) / 2); c.scale(rw, (yb - ya) / 2); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
  });
  c.restore();
}
