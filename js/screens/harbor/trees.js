// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE'S TREES — sugar maples (in iron grates at the curb + one big one on the front walk)
// and a flowering crabapple accent, in FOUR SEASONS by the real date (core/harbor-promenade.js#seasonOf): spring (crabapple
// blossom pink-white + fresh light green), summer (full green), autumn (blazing red-orange-gold, each maple its own mix, leaves
// falling), winter (bare branches — Part 9 lays snow on them: ctx.snow). Baked into the stage (stage.js#furnitureSteps); their
// cast shadows on the cobbles by day follow the real sun (treeShadow, drawn with the ground); the falling leaves are live
// (createLeaves).
//
// WHAT A TREE IS (its skeleton, its clusters, its colours) is PURE: core/harbor-trees.js#treePlan. This file lights it:
//   the crown = many overlapping leaf CLUSTERS (never a ball): the back ones in shade (the dark core), then the trunk + limbs, then
//   the front ones — each a three-tone body (shade, lit cap) under a ring of leaf dabs that breaks its edge, every dab lit by its
//   own normal: the sun's side warm + bright, the far side + the underside cool (the sky's fill); golden hour warm and low; an
//   overcast deck soft and flat; at night deep silhouette tones with the side facing the nearest lamp (ctx.lights) catching its
//   light (warm under a globe, cool-white under a tall street lamp) and a faint sky rim on top — never a black blob.
// Cost: the dabs are batched per cluster by their (quantised) colour — a few hundred fills a tree, in a bake.
import { project } from '../../core/harbor-layout.js';
import { PIECE } from '../../core/harbor-promenade.js';
import { treePlan, envelopeOf, treeMix, BARK, FRUIT, LEAF } from '../../core/harbor-trees.js';
import { rgb, mix } from './shapes.js';
import { treeLamps } from '../../core/harbor-light.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

// a plan per tree + season (the plan is pure and cheap, but a look's re-bake needn't redo it)
const plans = new Map();
function planOf(t, ctx) {
  // (FP2: t.v — a tree's own colour mix when the layout names one: the framing maple keeps its blaze whatever its index)
  const season = ctx.season || 'autumn', phase = ctx.phase ?? 0.5, i = t.v ?? (ctx.i || 0);
  const k = `${t.x.toFixed(2)}|${t.z}|${t.kind}|${t.w}|${t.h}|${season}|${Math.round(phase * 40)}|${i}`;
  let p = plans.get(k);
  if (!p) { if (plans.size > 48) plans.clear(); p = treePlan(t, { season, phase, i }); plans.set(k, p); }
  return p;
}

// ------------------------------------------------------------------ THE LIGHT
/** the look's light rig for one tree: the sun (side, height, colour, strength), the sky's fill, the lamps near it (local coords:
 *  u right, v up, w toward the viewer) */
function rigOf(T, ctx, t) {
  const n = T.night || 0, g = T.gold || 0, d = T.day ?? Math.max(0, 1 - n - g);
  const flat = clamp01((T.ovc || 0) * 1.6);
  const el = Math.max(4, T.sunEl ?? 40) * Math.PI / 180, side = T.sunDir || 0;
  let L = [side * 0.95, Math.sin(el) * 0.85 + 0.3, 0.55];
  const ln = Math.hypot(L[0], L[1], L[2]); L = L.map(v => v / ln);
  const dg = d + g || 1;
  const sunCol = [(0.86 * d + 1.12 * g) / dg, (0.8 * d + 0.7 * g) / dg, (0.68 * d + 0.4 * g) / dg];
  const sunK = (d + g) * (1 - 0.82 * flat);
  const fl = flat * (d + g);
  const amb = [0.46 * d + 0.36 * g + 0.27 * n + 0.3 * fl, 0.52 * d + 0.3 * g + 0.22 * n + 0.3 * fl, 0.66 * d + 0.5 * g + 0.46 * n + 0.32 * fl];
  const lampK = ctx.lampK ?? clamp01(n * 1.1);
  // (the lamps near the tree as local lights: core/harbor-light.js#treeLamps — FP3a, the one light model)
  const lamps = lampK > 0.01 ? treeLamps(ctx, t) : [];
  // PF — THE UPLIGHT (the owner: the trees read at night): a small warm brass fixture in the grate, just in front of the trunk, aimed
  // up — a light with a SHORT reach (UPLIGHT.fall): the trunk + the crown's underside glow softly, the crown's top fades to dark
  // (POL4: stronger — the crabapple behind the blade clearly, the big maple only a touch: UPLIGHT.kind)
  const upK = UPLIGHT.kind[t.kind] || 1;
  if (lampK > 0.01 && t.grate) lamps.push({ x: UPLIGHT.u, y: 0.12, w: -UPLIGHT.dz, col: UPLIGHT.col, k: UPLIGHT.k * upK, fall: UPLIGHT.fall * (0.85 + 0.2 * upK), up: true });
  // which side of the bark catches the light (by day the sun's; at night the strongest lamp's)
  let barkSide = Math.abs(L[0]) > 0.12 ? Math.sign(L[0]) : 1;
  if (lampK > 0.4 && lamps.length) { let best = 0; for (const lp of lamps) { if (lp.up) continue; const f = lp.k / (1 + (Math.hypot(lp.x, lp.y - t.trunk, lp.w) / 3) ** 2); if (f > best) { best = f; barkSide = Math.sign(lp.x) || 1; } } }
  const rig = { L, sunCol, sunK, amb, lamps, lampK, n, rim: n * (1 - flat * 0.5), barkSide, up: t.grate ? lampK * upK : 0 };
  // the leaves' shade: an autumn crown's shadows go deep warm (burnt orange, crimson, plum — never olive), a summer's cool green
  const tint = ctx.season === 'autumn' ? [1.17, 0.84, 0.72] : ctx.season === 'summer' ? [0.9, 1, 0.98] : [1, 1, 1];
  // (FP2: + the BOUNCE under the crown — the sunlit cobbles by day, the lamps' pools at night — a warm fill on the leaves facing
  // down, so the crown's underside reads as leaves in shade, never a brown-black mass)
  const bounce = (0.24 * (d + g) * (1 - flat * 0.5) + 0.14 * n * lampK);
  rig.leaf = { ...rig, amb: amb.map((v, k) => v * tint[k]), bounce, bcol: n > 0.5 ? [1.2, 0.86, 0.6] : [1.05, 0.95, 0.82] };
  // (a blossom's petals are thin and bright: light through them — the shade side stays pink, never a lilac grey)
  rig.bloom = { ...rig, amb: amb.map((v, k) => v * [1.32, 1.08, 1.02][k]) };
  return rig;
}

/** PF — THE TREES' UPLIGHTS: where the fixture sits in the grate (u across, dz toward us — world units from the trunk), its warm
 *  colour (× the base: ~2700 K), its strength, its reach (a lamp's falloff distance: 3; this one 2.2 — the crown's top fades out) */
export const UPLIGHT = Object.freeze({ u: -0.26, dz: -0.5, col: [1.3, 0.9, 0.52], k: 0.62, fall: 2.2, kind: { crab: 1.4, maple: 1.15 } });

/** the lamps' light at a local point: [[dirX, dirY, dirW, strength, col], …] (a cluster computes it once for all its leaves) */
function lampsAt(rig, px, py, pw) {
  const out = [];
  for (const lp of rig.lamps) {
    const dx = lp.x - px, dy = lp.y - py, dw = lp.w - pw, d = Math.hypot(dx, dy, dw) || 1;
    out.push([dx / d, dy / d, dw / d, lp.k * rig.lampK * 1.6 / (1 + (d / (lp.fall || 3)) ** 2), lp.col]);
  }
  return out;
}
// (a soft shoulder instead of a hard clip: a bright lit leaf stays its colour, never a flat yellow)
const knee = v => (v <= 200 ? v : 255 - 3025 / (v - 145));
/** base × (the sky's fill + the sun + the lamps) for normal (nx, ny, nz); lp from lampsAt */
function shadeN(rig, lp, base, nx, ny, nz, ao) {
  const up = 0.68 + 0.32 * ny;
  let r = rig.amb[0] * up * ao, g = rig.amb[1] * up * ao, b = rig.amb[2] * up * ao;
  if (rig.bounce) { const k = rig.bounce * (0.35 + 0.65 * Math.max(0, -ny)); r += rig.bcol[0] * k; g += rig.bcol[1] * k; b += rig.bcol[2] * k; }
  const dt = nx * rig.L[0] + ny * rig.L[1] + nz * rig.L[2];
  const dif = (dt > -0.12 ? (dt + 0.12) / 1.12 : 0) * rig.sunK * (0.45 + 0.55 * ao);
  r += rig.sunCol[0] * dif; g += rig.sunCol[1] * dif; b += rig.sunCol[2] * dif;
  if (rig.rim > 0.02 && ny > 0.35) { const k = rig.rim * (ny - 0.35) / 0.65; r += 0.1 * k; g += 0.12 * k; b += 0.26 * k; }
  for (let i = 0; i < lp.length; i++) {
    const l = lp[i], dd = nx * l[0] + ny * l[1] + nz * l[2];
    if (dd <= -0.3) continue;
    const f = (dd + 0.3) / 1.3 * l[3];
    r += l[4][0] * f; g += l[4][1] * f; b += l[4][2] * f;
  }
  return [knee(base[0] * r), knee(base[1] * g), knee(base[2] * b)];
}
/** a surface's colour at local point (px, py, pw) with normal (nx, ny, nz) */
const lit = (rig, base, nx, ny, nz, px, py, pw, ao = 1) => shadeN(rig, lampsAt(rig, px, py, pw), base, nx, ny, nz, ao);

// batched fills: shapes grouped by their quantised colour, one path + one fill a colour
function groups() {
  const m = new Map();
  return {
    add(col, px, py, rx, ry, rot) { const k = ((col[0] >> 3) << 10) | ((col[1] >> 3) << 5) | (col[2] >> 3); let a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(px, py, rx, ry, rot); },
    fill(x) {
      for (const [k, a] of m) {
        x.fillStyle = `rgb(${((k >> 10) & 31) * 8 + 4},${((k >> 5) & 31) * 8 + 4},${(k & 31) * 8 + 4})`;
        x.beginPath();
        for (let i = 0; i < a.length; i += 5) {
          // a leaf: a pointed lozenge (cheaper than an ellipse to build and to fill, and it reads as a leaf)
          const px = a[i], py = a[i + 1], rx = a[i + 2], ry = a[i + 3], c = Math.cos(a[i + 4]), sn = Math.sin(a[i + 4]);
          x.moveTo(px + rx * c, py + rx * sn); x.lineTo(px - ry * sn + rx * 0.1 * c, py + ry * c + rx * 0.1 * sn); x.lineTo(px - rx * 0.85 * c, py - rx * 0.85 * sn); x.lineTo(px + ry * sn + rx * 0.1 * c, py - ry * c + rx * 0.1 * sn); x.closePath();
        }
        x.fill();
      }
      m.clear();
    },
  };
}

// ------------------------------------------------------------------ THE PIECES
/** THE TREE GRATE: a square cast-iron grate set in the cobbles — a Deco sunburst of bars round the trunk's opening, its frame +
 *  the bars' tops catching the light (the sun by day, the lamps at night); the mulch in the opening */
function drawGrate(x, cam, t, rig, ctx) {
  const G = t.kind === 'crab' ? 0.74 : 0.86, P = (u, dz) => project(cam, t.x + u, 0, t.z + dz);
  const quad = k => { const a = P(-G * k, G * k), b = P(G * k, G * k), c = P(G * k, -G * k), d = P(-G * k, -G * k); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.closePath(); };
  const s = cam.F / t.z, lw = Math.max(0.45, s * 0.045);
  const iron = lit(rig, [70, 68, 74], 0, 1, 0, 0, 0, 0, 0.9), top = lit(rig, [118, 112, 106], 0, 1, 0.3, 0, 0, 0, 1);
  const soil = lit(rig, [58, 44, 36], 0, 1, 0, 0, 0, 0, 0.7);
  // a soft contact shadow round the frame (the grate sits a hair below the setts)
  x.fillStyle = 'rgba(10,8,16,0.28)'; x.beginPath(); quad(1.12); x.fill();
  x.fillStyle = rgb(iron); x.beginPath(); quad(1); x.fill();
  x.fillStyle = rgb(soil); x.beginPath(); quad(0.84); x.fill();
  // the sunburst: bars from the opening's ring out to the frame, and two rings
  x.strokeStyle = rgb(mix(iron, top, 0.35)); x.lineWidth = lw * 1.3; x.beginPath();
  for (let k = 0; k < 16; k++) {
    const th = (k + 0.5) / 16 * TAU, c = Math.cos(th), sn = Math.sin(th), m = 0.84 * G / Math.max(Math.abs(c), Math.abs(sn));
    const [a0, b0] = P(c * 0.34, sn * 0.34), [a1, b1] = P(c * m, sn * m); x.moveTo(a0, b0); x.lineTo(a1, b1);
  }
  quad(0.6); x.stroke();
  // the bars' tops catching the light; the frame's near lip
  x.strokeStyle = rgb(top, 0.75); x.lineWidth = lw * 0.7; x.beginPath(); quad(0.6); x.stroke();
  const [na, ny] = P(-G, -G), [nb] = P(G, -G), [fa, fy] = P(-G, G), [fb] = P(G, G);
  x.strokeStyle = rgb(top); x.lineWidth = lw; x.beginPath(); x.moveTo(na, ny - lw * 0.4); x.lineTo(nb, ny - lw * 0.4); x.moveTo(fa, fy + lw * 0.5); x.lineTo(fb, fy + lw * 0.5); x.stroke();
  x.fillStyle = rgb(mix(iron, [0, 0, 0], 0.45)); x.fillRect(na, ny, nb - na, Math.max(0.6, lw * 1.2));
  // the opening: mulch round the trunk
  const [ox, oy] = P(0, 0), rx = 0.36 * s, ry = Math.max(1, (P(0, -0.36)[1] - P(0, 0.36)[1]) / 2);
  x.fillStyle = rgb(mix(soil, [0, 0, 0], 0.25)); x.beginPath(); x.ellipse(ox, oy, rx, ry, 0, 0, TAU); x.fill();
  if (ctx.snow > 0.02) { const sc = ctx.snowCol || [244, 246, 255]; x.fillStyle = `rgba(${sc[0] | 0},${sc[1] | 0},${sc[2] | 0},${(0.85 * ctx.snow).toFixed(3)})`; x.beginPath(); quad(1); x.fill(); }
}

/** leaves / petals / fruit lying on the grate + the paving round it */
function drawFallen(x, cam, t, plan, rig, ctx) {
  if (!plan.fallen.length) return;
  const gr = groups(), petals = ctx.season === 'spring';
  for (const f of plan.fallen) {
    const z = t.z + f.dz, [px, py] = project(cam, t.x + f.u, 0, z), s = cam.F / z, rx = (petals ? 0.07 : 0.1) * s * f.k;
    gr.add(lit(rig.leaf || rig, f.c, 0, 1, 0.2, f.u, 0, -f.dz, 0.95), px, py, rx, rx * (petals ? 0.5 : 0.42), f.rot * 0.25);
  }
  gr.fill(x);
}

/** the trunk: root flare into the grate, the taper, the bark's furrows, the lit side */
function drawTrunk(x, s, bx, by, seg, rig, bark, t) {
  const w0 = seg.w0 * s, w1 = seg.w1 * s, tx = bx + seg.x1 * s, ty = by - seg.y1 * s, fh = Math.min(0.5, t.trunk * 0.2) * s;
  const side = rig.barkSide, xl = v => bx + (tx - bx) * v, yl = v => by + (ty - by) * v;
  const shape = (k0, k1) => {
    // k0 / k1: the share of the width from the left / right edge (−0.5 … 0.5 across the trunk)
    const fl = 1.95, f0 = fh / (by - ty);
    x.beginPath();
    x.moveTo(bx + k0 * w0 * fl, by + 0.5);
    x.quadraticCurveTo(bx + k0 * w0 * 1.05, by - fh * 0.25, xl(f0) + k0 * w0, yl(f0));
    x.lineTo(tx + k0 * w1, ty); x.lineTo(tx + k1 * w1, ty); x.lineTo(xl(f0) + k1 * w0, yl(f0));
    x.quadraticCurveTo(bx + k1 * w0 * 1.05, by - fh * 0.25, bx + k1 * w0 * fl, by + 0.5);
    x.closePath();
  };
  const v0 = t.trunk * 0.5;
  x.fillStyle = rgb(lit(rig, bark, -side * 0.8, 0, 0.6, 0, v0, 0.2, 0.7)); shape(-0.5, 0.5); x.fill();
  x.fillStyle = rgb(lit(rig, bark, side * 0.55, 0.1, 0.83, 0, v0, 0.2, 0.92)); shape(side > 0 ? -0.12 : -0.5, side > 0 ? 0.5 : 0.12); x.fill();
  x.fillStyle = rgb(lit(rig, bark, side * 0.85, 0.15, 0.5, side * 0.2, v0, 0.1, 1)); shape(side > 0 ? 0.24 : -0.44, side > 0 ? 0.44 : -0.24); x.fill();
  // the bark: a maple's long shaggy plates (vertical furrows), a crabapple's smoother scaly bark (shorter ones)
  if (w0 > 2.2) {
    x.strokeStyle = rgb(lit(rig, bark, 0, 0, 1, 0, v0, 0.2, 0.42), 0.75); x.lineWidth = Math.max(0.4, w0 * 0.07); x.beginPath();
    const nf = t.kind === 'crab' ? 3 : 4;
    for (let k = 0; k < nf; k++) {
      const off = -0.36 + 0.72 * (k + 0.5) / nf, seg0 = t.kind === 'crab' ? 0.2 : 0.06, seg1 = t.kind === 'crab' ? 0.78 : 0.94;
      for (let v = seg0; v < seg1; v += t.kind === 'crab' ? 0.26 : 0.44) {
        const v1 = Math.min(seg1, v + (t.kind === 'crab' ? 0.14 : 0.36)), wv = w0 + (w1 - w0) * v, wv1 = w0 + (w1 - w0) * v1;
        x.moveTo(xl(v) + off * wv + (k % 2 ? 0.3 : -0.3), yl(v)); x.quadraticCurveTo(xl((v + v1) / 2) + off * wv * 0.92, yl((v + v1) / 2), xl(v1) + off * wv1, yl(v1));
      }
    }
    x.stroke();
  }
}

/** PF — THE UPLIGHT, seen: the warm light washing UP the trunk's front (bright at the root flare, gone by the first fork — additive,
 *  clipped to the trunk), the light landing on the mulch + the grate round the fixture, and the fixture itself: a low brass cylinder
 *  with a hood, its lens a warm spark + a TIGHT halo (crisp: source, small halo, light on the surfaces — never haze) */
function drawUplight(x, cam, t, s, bx, by, seg, rig) {
  const k = rig.up, w0 = seg.w0 * s, tx = bx + seg.x1 * s, ty = by - seg.y1 * s;
  const [fx, fy] = project(cam, t.x + UPLIGHT.u, 0, t.z + UPLIGHT.dz), fs = cam.F / (t.z + UPLIGHT.dz);
  x.save();
  x.globalCompositeOperation = 'lighter';
  // the trunk's front, lit from below (a narrow wedge up the bark: the fixture is a spot)
  const g = x.createLinearGradient(0, by, 0, ty);
  g.addColorStop(0, `rgba(255,178,96,${Math.min(0.85, 0.5 * k).toFixed(3)})`); g.addColorStop(0.45, `rgba(255,160,84,${Math.min(0.4, 0.2 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,150,80,0)');
  x.fillStyle = g; x.beginPath();
  x.moveTo(bx - w0 * 0.42, by); x.lineTo(bx + w0 * 0.3, by); x.lineTo(tx + w0 * 0.16, ty); x.lineTo(tx - w0 * 0.28, ty); x.closePath(); x.fill();
  // the light landing on the mulch + the grate's bars round the fixture (a small warm ellipse on the ground)
  const rx = 0.95 * fs, ry = Math.max(1, rx * 0.3), gg = x.createRadialGradient(0, 0, 0, 0, 0, 1);
  gg.addColorStop(0, `rgba(255,170,90,${(0.42 * k).toFixed(3)})`); gg.addColorStop(1, 'rgba(255,150,80,0)');
  x.translate(fx + rx * 0.15, fy - ry * 0.4); x.scale(rx, ry); x.fillStyle = gg; x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.fill();
  x.restore();
  // the fixture: a squat brass can, its hood, the lens's spark
  const cw = Math.max(1.1, 0.2 * fs), ch = Math.max(0.8, 0.13 * fs);
  x.fillStyle = rgb(lit(rig, [120, 96, 60], 0, 0.2, 1, UPLIGHT.u, 0.06, -UPLIGHT.dz, 0.8)); x.fillRect(fx - cw / 2, fy - ch, cw, ch);
  x.fillStyle = rgb(lit(rig, [176, 140, 84], 0, 1, 0.3, UPLIGHT.u, 0.13, -UPLIGHT.dz, 1)); x.fillRect(fx - cw * 0.6, fy - ch - Math.max(0.4, ch * 0.3), cw * 1.2, Math.max(0.4, ch * 0.3));
  if (k > 0.02) {
    const lr = Math.max(0.5, cw * 0.32), hr = lr * 3.2;
    x.save(); x.globalCompositeOperation = 'lighter';
    const h = x.createRadialGradient(fx, fy - ch, 0, fx, fy - ch, hr);
    h.addColorStop(0, `rgba(255,214,150,${Math.min(1, 0.7 * k).toFixed(3)})`); h.addColorStop(0.35, `rgba(255,170,90,${(0.22 * k).toFixed(3)})`); h.addColorStop(1, 'rgba(255,150,80,0)');
    x.fillStyle = h; x.beginPath(); x.arc(fx, fy - ch, hr, 0, TAU); x.fill();
    x.restore();
    x.fillStyle = `rgba(255,246,222,${Math.min(1, 1.1 * k).toFixed(3)})`; x.beginPath(); x.ellipse(fx, fy - ch, lr, lr * 0.45, 0, 0, TAU); x.fill();
  }
}

/** the limbs + branches + twigs (depth 1 … maxD), thin first so the thick ones lie over their joints; a lit side on the thick */
function drawLimbs(x, s, bx, by, segs, maxD, rig, bark, ctx) {
  const dark = lit(rig, bark, -rig.barkSide * 0.6, 0.1, 0.6, 0, 5, 0, 0.68), light = lit(rig, bark, rig.barkSide * 0.6, 0.3, 0.75, 0, 5, 0, 1);
  const twig = mix(dark, light, 0.3);
  for (let d = maxD; d >= 1; d--) {
    const thin = d >= 5;
    x.fillStyle = rgb(thin ? twig : dark, thin ? 0.85 : 1);
    x.beginPath();
    let any = false;
    for (const sg of segs) {
      if (sg.d !== d) continue;
      any = true;
      quadOf(x, bx + sg.x0 * s, by - sg.y0 * s, bx + sg.x1 * s, by - sg.y1 * s, Math.max(0.4, sg.w0 * s), Math.max(0.35, sg.w1 * s), d <= 2);
    }
    if (any) x.fill();
    if (d > 3) continue;
    x.fillStyle = rgb(light); x.beginPath();
    for (const sg of segs) {
      if (sg.d !== d || sg.w0 * s < 1.1) continue;
      const ax = bx + sg.x0 * s, ay = by - sg.y0 * s, ex = bx + sg.x1 * s, ey = by - sg.y1 * s, L = Math.hypot(ex - ax, ey - ay) || 1;
      // the lit side: the edge facing the light (its normal's x has the light's sign)
      let nx = -(ey - ay) / L, ny = (ex - ax) / L; if (nx * rig.barkSide < 0) { nx = -nx; ny = -ny; }
      const o0 = sg.w0 * s * 0.22, o1 = sg.w1 * s * 0.22;
      quadOf(x, ax + nx * o0, ay + ny * o0, ex + nx * o1, ey + ny * o1, sg.w0 * s * 0.48, sg.w1 * s * 0.48, false);
    }
    x.fill();
  }
  // Part 9's hook: snow on the tops of the limbs (the more level a limb, the more it holds)
  // (9b: the branches hold snow only while it's FRESH — ctx.snowBranch; its tone in this light — ctx.snowCol)
  const sb = ctx.snowBranch ?? ctx.snow ?? 0;
  if (sb > 0.02) {
    const sc = ctx.snowCol || [246, 248, 255];
    x.strokeStyle = `rgba(${sc[0] | 0},${sc[1] | 0},${sc[2] | 0},${(0.92 * sb).toFixed(3)})`; x.lineCap = 'round';
    for (let d = 1; d <= Math.min(maxD, 5); d++) {
      x.lineWidth = Math.max(0.5, 0.06 * s / d); x.beginPath();
      for (const sg of segs) {
        if (sg.d !== d) continue;
        const dx = sg.x1 - sg.x0, dy = sg.y1 - sg.y0, L = Math.hypot(dx, dy) || 1;
        if (Math.abs(dx) / L < 0.3) continue;
        x.moveTo(bx + sg.x0 * s, by - sg.y0 * s - sg.w0 * s * 0.5); x.lineTo(bx + sg.x1 * s, by - sg.y1 * s - sg.w1 * s * 0.5);
      }
      x.stroke();
    }
    x.lineCap = 'butt';
  }
}
function quadOf(x, ax, ay, ex, ey, w0, w1, cap) {
  const L = Math.hypot(ex - ax, ey - ay) || 1, nx = -(ey - ay) / L, ny = (ex - ax) / L;
  x.moveTo(ax + nx * w0 / 2, ay + ny * w0 / 2); x.lineTo(ex + nx * w1 / 2, ey + ny * w1 / 2); x.lineTo(ex - nx * w1 / 2, ey - ny * w1 / 2); x.lineTo(ax - nx * w0 / 2, ay - ny * w0 / 2); x.closePath();
  if (cap) { x.moveTo(ex + w1 / 2, ey); x.arc(ex, ey, w1 / 2, 0, TAU); }
}

/** one leaf cluster: the body in shade, the lit cap toward the light, a ring of leaf dabs breaking its edge + dabs over the cap */
function drawCluster(x, s, bx, by, cl, env, rig, leafPt, gr, flush = true) {
  const cx = bx + cl.u * s, cy = by - cl.v * s, r = cl.r * s;
  const gx = cl.u / env.a, gy = (cl.v - env.cv) / env.b, nr = Math.min(1, Math.hypot(gx, gy)), gz = cl.nz;
  rig = (cl.blooms ? rig.bloom : rig.leaf) || rig;
  const pw = cl.nz * env.a, lp = lampsAt(rig, cl.u, cl.v, pw);
  // (FP2: the crown's inside lifted — 0.5 → 0.62 at the core: a deep rich colour in shade, never a brown-black mass; the front
  // clusters stay brighter, so the depth still reads)
  const ao = cl.back ? 0.62 + 0.16 * nr : 0.76 + 0.24 * nr;
  const sh = (a, b, c, k) => { const l = Math.hypot(a, b, c) || 1; return shadeN(rig, lp, cl.col, a / l, b / l, c / l, k); };
  // the body (the shade side's tone) and the cap (toward the light, smaller)
  x.fillStyle = rgb(sh(gx - rig.L[0] * 0.15 * rig.sunK, gy - 0.3, Math.max(0.05, gz) + 0.25, ao * 0.8));
  x.beginPath(); for (const b of cl.blobs) { const px = cx + b.dx * r, py = cy + b.dy * r; x.moveTo(px + b.r * r, py); x.arc(px, py, b.r * r, 0, TAU); } x.fill();
  const lx = rig.L[0] * 0.9, ly = -rig.L[1] * 0.7, lm = Math.hypot(lx, ly) || 1, ox = lx / lm * r * 0.17, oy = ly / lm * r * 0.17;
  x.fillStyle = rgb(sh(gx + rig.L[0] * 0.25 * rig.sunK, gy + 0.3, Math.max(0.1, gz) + 0.3, ao * 0.93));
  x.beginPath(); for (const b of cl.blobs) { const px = cx + b.dx * r * 0.85 + ox, py = cy + b.dy * r * 0.85 + oy, rr = b.r * r * 0.72; x.moveTo(px + rr, py); x.arc(px, py, rr, 0, TAU); } x.fill();
  // the dabs: each lit by its own normal (the cluster's bulge blended with the crown's)
  // (FP2: a blossom's dabs rounder + a fifth bigger — soft, fluffy clouds of petals — and more of them catch the light white)
  const round = cl.blooms ? 1 : 0.7, hiK = (cl.blooms ? 0.34 : 0.2) * rig.sunK, hi = cl.blooms ? [255, 252, 252] : [255, 236, 190], back = gz >= 0 ? 1 : 0.4;
  const big = cl.blooms ? 1.2 : 1;
  const thin = cl.back ? 2 : 1;
  for (let di = 0; di < cl.dabs.length; di += thin) {
    const d = cl.dabs[di];
    if (thin > 1 && (d.dark || d.dx * d.dx + d.dy * d.dy < 0.45)) continue;
    let nx = d.dx * 0.36 + gx * 0.75, ny = -d.dy * 0.36 + gy * 0.75;
    const q = nx * nx + ny * ny;
    let nz = Math.sqrt(q < 0.96 ? 1 - q : 0.04) * back;
    const l = Math.sqrt(q + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
    let col = shadeN(rig, lp, d.alt && cl.col2 ? cl.col2 : cl.col, nx, ny, nz, d.dark ? ao * 0.7 : ao * (0.86 + 0.14 * (d.dx * d.dx + d.dy * d.dy)));
    // a few leaves catch a highlight (a blossom's petals glow white)
    if (hiK > 0.02 && d.k > (cl.blooms ? 1.0 : 1.15) && !d.dark && nx * rig.L[0] + ny * rig.L[1] + nz * rig.L[2] > (cl.blooms ? 0.4 : 0.55)) col = mix(col, hi, hiK);
    const rx = leafPt * d.k * 1.12 * big;
    gr.add(col, cx + d.dx * r, cy + d.dy * r, rx, rx * round, d.rot);
  }
  if (flush) gr.fill(x);
}

/**
 * A tree, baked: its iron grate on the paving, the trunk, the crown. t: { x, z, kind: 'maple' | 'crab', trunk, w, h, grate } (world
 * units; the crown w wide, h tall, its foot at y = trunk). T: the look's tones (day / gold / night weights, sunDir −1..1, sunEl °,
 * ovc). ctx: { season, phase (0..1 through it), i (the tree's index — its own variety), lights: [{ x, z, kind }] (the lamps: the
 * side facing one catches its light at night), lampK (0..1, the lamps' brightness in this look), snow (0..1, Part 9), wet (0..1, Part 9) }
 */
export function drawTree(x, cam, t, T, ctx = {}) {
  const plan = planOf(t, ctx), rig = rigOf(T, ctx, t), env = plan.env;
  const s = cam.F / t.z, [bx, by] = project(cam, t.x, 0, t.z);
  const bark = mix(BARK[t.kind] || BARK.maple, [0, 0, 0], 0.35 * (ctx.wet || 0));
  if (t.grate) drawGrate(x, cam, t, rig, ctx);
  drawFallen(x, cam, t, plan, rig, ctx);
  const leafPt = (LEAF[t.kind] || LEAF.maple) * s, gr = groups();
  const back = plan.clusters.filter(c => c.back), front = plan.clusters.filter(c => !c.back);
  // (the leaves of a few neighbouring clusters (by depth) go out together: fewer fills, and the clusters' edges interleave)
  const B = 3;
  back.forEach((cl, k) => drawCluster(x, s, bx, by, cl, env, rig, leafPt, gr, k % B === B - 1 || k === back.length - 1));
  drawLimbs(x, s, bx, by, plan.segs, plan.depth, rig, bark, ctx);
  drawTrunk(x, s, bx, by, plan.segs[0], rig, bark, t);
  if (rig.up > 0.01) drawUplight(x, cam, t, s, bx, by, plan.segs[0], rig);
  front.forEach((cl, k) => drawCluster(x, s, bx, by, cl, env, rig, leafPt, gr, k % B === B - 1 || k === front.length - 1));
  // a crabapple's fruit: little red apples with a glint
  if (plan.fruit.length) {
    const fr = Math.max(0.75, 0.072 * s), col = lit(rig, FRUIT, 0.2, 0.4, 0.9, 0, t.trunk + t.h / 2, 0.5, 1);
    // (POLISH 5: a dark underside first — each bunch reads as round fruit on the leaves, not loose specks)
    x.fillStyle = rgb(mix(col, [30, 6, 12], 0.55)); x.beginPath(); for (const f of plan.fruit) { const px = bx + f.u * s + fr * 0.2, py = by - f.v * s + fr * 0.25; x.moveTo(px + fr, py); x.arc(px, py, fr, 0, TAU); } x.fill();
    x.fillStyle = rgb(col); x.beginPath();
    for (const f of plan.fruit) { const px = bx + f.u * s, py = by - f.v * s; x.moveTo(px + fr, py); x.arc(px, py, fr, 0, TAU); }
    x.fill();
    if (fr > 0.9) { x.fillStyle = rgb(mix(col, [255, 240, 230], 0.5)); x.beginPath(); for (const f of plan.fruit) { const px = bx + f.u * s - fr * 0.3, py = by - f.v * s - fr * 0.35; x.moveTo(px + fr * 0.3, py); x.arc(px, py, fr * 0.3, 0, TAU); } x.fill(); }
  }
}

/** SP3 — THE CROWN IN THE WIND: a tree's crown on screen as its leaf clusters' discs (screen pt) + its base + its crown's foot / top —
 *  the scene clips a live, gently SHEARED copy of the baked crown to them (scene.js#swayTrees). No clusters (winter) → null. */
export function crownDiscs(cam, t, ctx = {}) {
  const plan = planOf(t, ctx), s = cam.F / t.z, [bx, by] = project(cam, t.x, 0, t.z);
  if (!plan.clusters.length) return null;
  const discs = plan.clusters.map(cl => [bx + cl.u * s, by - cl.v * s, cl.r * s * 1.18]);
  const x0 = Math.min(...discs.map(d => d[0] - d[2])), x1 = Math.max(...discs.map(d => d[0] + d[2])), y0 = Math.min(...discs.map(d => d[1] - d[2])), y1 = Math.max(...discs.map(d => d[1] + d[2]));
  return { discs, foot: by - t.trunk * s * 0.6, top: y0, box: { x: x0 - 3, y: y0 - 3, w: x1 - x0 + 6, h: y1 - y0 + 6 } };
}

/** a tree's cast shadow on the cobbles (baked with the ground, by day: along the real sun — T.sunDir, T.sunEl; none under an
 *  overcast deck, T.ovc ≥ 0.5, or at night). The same sun as every other shadow on the stage (stage.js#sunShadow: the camera looks
 *  north across the harbor — a morning sun on the left throws shadows right, and away from us), long at a low sun, short at a high
 *  one; dappled (the crown's clusters, each a disc on the paving), the bare branches' lines in winter. */
export function treeShadow(x, cam, t, T, ctx = {}) {
  const n = T.night || 0, g = T.gold || 0, d = T.day ?? Math.max(0, 1 - n - g), day = d + g;
  if (day < 0.15 || (T.ovc || 0) >= 0.5) return;
  const a = 0.3 * Math.min(1, day) * (1 - 0.6 * (T.ovc || 0));
  const plan = planOf(t, ctx), el = Math.max(6, T.sunEl || 30) * Math.PI / 180, side = T.sunDir || 0;
  const long = Math.min(3.2, 1 / Math.tan(el)), hx = -side * 0.9, hz = 0.35 + 0.4 * (1 - Math.abs(side));
  const stretch = Math.min(2.4, 1 / Math.sin(el));
  const G = (u, v) => [t.x + u + hx * v * long, t.z + hz * v * long];
  const col = mix([28, 22, 44], [48, 24, 56], g / (day || 1));
  x.fillStyle = rgb(col, a);
  // the trunk (+ its root flare)
  const s0 = plan.segs[0], [b0x, b0z] = G(0, 0), [f0x, f0z] = G(s0.x1, s0.y1);
  const P = (wx, wz) => project(cam, wx, 0, Math.max(cam.F * 0.02, wz));
  x.beginPath();
  const q = [P(b0x - s0.w0 * 0.9, b0z), P(f0x - s0.w1 / 2, f0z), P(f0x + s0.w1 / 2, f0z), P(b0x + s0.w0 * 0.9, b0z)];
  x.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill();
  // the crown: one union of discs (overlaps don't darken twice; the gaps between them are the dapples)
  if (plan.clusters.length) {
    x.beginPath();
    for (const cl of plan.clusters) {
      const [gx, gz] = G(cl.u, cl.v), [px, py] = P(gx, gz), z = Math.max(1, gz), rx = cl.r * 0.8 * cam.F / z * (1 + (stretch - 1) * Math.abs(hx) * 0.4);
      const ry = cl.r * 0.8 * cam.F * cam.CAMH / (z * z) * (1 + (stretch - 1) * hz * 0.8);
      x.moveTo(px + rx, py); x.ellipse(px, py, rx, ry, 0, 0, TAU);
    }
    x.fill();
  }
  // the limbs' lines (fine in summer under the leaves, the whole bare tree in winter)
  x.strokeStyle = rgb(col, a * 0.9); x.lineCap = 'round';
  for (let dd = 1; dd <= Math.min(plan.depth, 5); dd++) {
    x.lineWidth = Math.max(0.4, 0.12 * cam.F / t.z / dd); x.beginPath();
    for (const sg of plan.segs) {
      if (sg.d !== dd) continue;
      const [ax, az] = G(sg.x0, sg.y0), [ex, ez] = G(sg.x1, sg.y1), A = P(ax, az), E = P(ex, ez);
      x.moveTo(A[0], A[1]); x.lineTo(E[0], E[1]);
    }
    x.stroke();
  }
  x.lineCap = 'butt';
}

// ------------------------------------------------------------------ THE FALLING LEAVES (live)
/**
 * THE FALLING LEAVES (autumn; a few at late summer's end, the crabapple's petals in its blossom, none in winter): live, a handful
 * of leaves detaching from the crowns and tumbling down in the real wind, landing by the tree and fading. layout(L) once per
 * layout (L.cam, L.trees); draw(c, { t (s), dt (ms), motion, wind (m/s, signed), season, phase, fade, night (0..1), tier }) every
 * frame. Cheap: plain fills, no filters, no per-frame gradients; ≤ 12 leaves at tier 2, ≤ 5 at tier 1, none at tier 0 / reduced
 * motion. debug() → { n, trees }.
 */
export function createLeaves() {
  let cam = null, trees = [], leaves = [], acc = 0, rnd = 1;
  const R = () => { rnd = (rnd * 16807) % 2147483647; return (rnd - 1) / 2147483646; };
  const pickW = list => { let r = R() * list.reduce((s, [, w]) => s + w, 0); for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; } return list[0][0]; };
  function spawn(tr, season, night) {
    const petal = season === 'spring', env = tr.env, s = tr.s;
    const th = R() * TAU, rr = Math.sqrt(R()) * 0.85;
    const u = Math.cos(th) * rr * env.a, v = env.cv + Math.sin(th) * rr * env.b * 0.8;
    let col = pickW(treeMix(tr.t.kind, season, tr.i));
    col = mix(col, [22, 16, 32], 0.72 * night);
    const k = s / 12;
    leaves.push({
      x: tr.bx + u * s, y: tr.by - v * s, land: tr.by - (R() - 0.3) * 5 * k, k,
      vy: (petal ? 7 : 11) + R() * 7, sway: 6 + R() * 8, ph: R() * TAU, om: 1.6 + R() * 1.8, spin: (R() - 0.5) * 9, rot: R() * TAU,
      sz: (petal ? 0.9 : 1.25 + R() * 0.5) * k, col: rgb(col), age: 0, rest: 0, petal,
    });
  }
  return {
    layout(L) {
      cam = L && L.cam; leaves = []; acc = 0;
      trees = !cam ? [] : L.trees.map((t, i) => ({ t, i: t.v ?? i, s: cam.F / t.z, bx: project(cam, t.x, 0, t.z)[0], by: project(cam, t.x, 0, t.z)[1], env: envelopeOf(t) }));
    },
    draw(c, o = {}) {
      if (!cam || !trees.length || !o.motion || !(o.tier > 0)) { leaves.length = 0; return; }
      const season = o.season || 'autumn', phase = o.phase ?? 0.5, wind = +o.wind || 0, dt = Math.min(0.1, (o.dt || 16) / 1000);
      const max = o.tier >= 2 ? 12 : 5;
      // who sheds: the maples in autumn (more as it goes on, more in a wind), the crabapple's petals in its blossom, a stray leaf
      // at the end of summer
      const src = season === 'autumn' ? trees : season === 'spring' ? trees.filter(tr => tr.t.kind === 'crab') : season === 'summer' && phase > 0.85 ? trees.filter(tr => tr.t.kind === 'maple') : [];
      let rate = season === 'autumn' ? 0.5 + 1.1 * phase : season === 'spring' ? (phase > 0.25 && phase < 0.95 ? 0.7 : 0) : season === 'summer' ? 0.06 : 0;
      rate *= 1 + Math.min(2, Math.abs(wind) / 5);
      if (src.length && rate > 0) {
        acc += dt * rate;
        while (acc >= 1) { acc -= 1; if (leaves.length < max) { const tr = src[Math.floor(R() * src.length)]; if (tr.t.kind === 'maple' || season !== 'autumn' || R() < 0.4) spawn(tr, season, o.night || 0); } }
      }
      const fade = o.fade ?? 1, t = o.t || 0;
      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i];
        l.age += dt;
        if (l.y < l.land) {
          // falling: a terminal drift down, the wind carrying it, a flutter side to side, tumbling
          const fl = Math.sin(t * l.om + l.ph);
          l.x += (wind * 2.6 * l.k + fl * l.sway * l.k) * dt;
          l.y += l.vy * l.k * (0.75 + 0.35 * Math.abs(fl)) * dt;
          l.rot += l.spin * dt;
        } else { l.y = l.land; l.rest += dt; }
        const al = l.rest > 0 ? 1 - l.rest / 2.5 : Math.min(1, l.age * 3);
        if (al <= 0 || l.x < -12 || l.x > cam.W + 12) { leaves.splice(i, 1); continue; }
        c.globalAlpha = al * fade;
        c.fillStyle = l.col;
        const w = l.rest > 0 ? l.sz : l.sz * (0.25 + 0.75 * Math.abs(Math.cos(l.rot))), h = l.rest > 0 ? l.sz * 0.42 : l.sz * (l.petal ? 0.8 : 0.62);
        c.beginPath(); c.ellipse(l.x, l.y, w, h, l.rest > 0 ? 0 : l.rot * 0.35, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    },
    debug: () => ({ n: leaves.length, trees: trees.length }),
    destroy() { leaves = []; trees = []; cam = null; },
  };
}
