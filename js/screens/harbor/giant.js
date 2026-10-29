// CITY 2.0 — THE HARBOR, 11a-2 Group 0: THE GIANT BITCOIN PUMPKIN on the promenade's centre circle (the owner, Oct 26: "the hero of
// Halloween on the promenade … make it very impressive, it's the centre of the promenade … make the big featured pumpkin HUGE … instead
// of a jack-o'-lantern carve the BITCOIN LOGO … lit from the inside by FIRE … twice the size"). WHEN: core/harbor-holiday.js#halloweenPieces
// (`giant`: on its straw bed from Oct 20, carved overnight into Oct 28, its fire lit every night from then, brightest on the 31st, gone
// at 4 am Nov 1 — and BIG PIECES CHANGE OFF-CAMERA: core/harbor-holiday.js#latchBig). WHERE: core/harbor-holidayprops.js#GIANT /
// giantPiece (the inlay's centre). Drawn by holidayprops.js as ONE z-sorted extra with the walkers + the dancers (people.js): the hourly
// dance circles it in depth — the ones behind it hidden by it, the ones in front over it.
//
// THE ART — premium + 3D, never clip-art: the body is RAY-MARCHED per pixel (an implicit Atlantic-giant pumpkin: sixteen ribs running into
// the stem's dimple, sagging wide at its foot) — every pixel its own normal, lit by the props' one light model (props-light.js#lit: the sun,
// the golden hour, the lamps at night), the creases occluded, the skin striated + blotched. THE CARVING is cut INTO that surface: a COIN
// whose skin is SHAVED thin (the carver's trick — by day a pale gold disc, at night the fire glowing through it Bitcoin orange) with a
// deeper groove round its rim, and the ₿ CUT CLEAN THROUGH, knife-rough at its edges: through each cut the rind's THICKNESS shows as a pale
// band on the lower edge (we look down into it), and the cavity behind. THE FIRE inside (a small blaze on the cavity's floor) — three
// baked states of its light (the flames leaning + flaring differently: the inner walls lit from different places, the flames seen through
// the cuts) cross-faded live on a fire's own rhythm, so the light DANCES; the warm pool it throws on the cobbles + the people round it.
// Cost: the geometry once per size (in ≤ 4-ms slices: never a hitch), the shading once per light key (sliced too), a frame = the bed,
// the body, three glow sprites + the pool.
import { project } from '../../core/harbor-layout.js';
import { GIANT } from '../../core/harbor-holidayprops.js';
import { lightFor, lit, norm } from './props-light.js';
import { pieceCtx } from '../../core/harbor-light.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { rngFrom } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${+a.toFixed(3)})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ------------------------------------------------------------------ THE SHAPE (object units = world units: y up from the straw bed,
// z away from us, x right; the carving toward us — θ = 0)
const S = GIANT.body;   // { R, Hh, yc, ribs, rib, rind }
const DS = S.R / 1.25;  // (the shape's details were drawn for a 1.25-radius pumpkin: they scale with it)
const lobeOf = th => Math.pow(Math.abs(Math.sin(S.ribs * th / 2)), 0.45);           // 1 on a rib's crown, 0 in a crease
/** the field: < 0 inside. k = 1 the skin, < 1 the cavity's wall (the rind's thickness in) */
function field(x, y, z, k = 1) {
  const rho = Math.hypot(x, z), th = Math.atan2(x, -z), lobe = lobeOf(th);
  const rib = 1 - S.rib * (1 - lobe);
  let yy = (y - S.yc) / (S.Hh * k);
  const sag = 1 + 0.07 * clamp01(-yy) - 0.03 * clamp01(yy);
  if (yy > 0) yy /= 1 - 0.17 * Math.exp(-((rho / (0.42 * DS)) ** 2)); else yy /= 1 - 0.08 * Math.exp(-((rho / (0.5 * DS)) ** 2));
  const r = rho / (S.R * k * rib * sag);
  let f = r * r + yy * yy - 1;
  const floor = k < 1 ? S.rind * 1.2 : 0.015;
  if (y < floor) f = Math.max(f, (floor - y) * 4 / DS);
  return f;
}
const grad = (x, y, z, k) => { const h = 0.004 * DS; return norm([field(x + h, y, z, k) - field(x - h, y, z, k), field(x, y + h, z, k) - field(x, y - h, z, k), field(x, y, z + h, k) - field(x, y, z - h, k)]); };

// THE CARVING: the BITCOIN LOGO — a shaved COIN + the ₿ cut through, laid out as the eye sees it from the front (the view's x, the height)
// so the coin reads round on the curve; the letter tilted 14° like the logo; the knife's line not quite clean (a carver's hand)
const TILT = 14 * Math.PI / 180, CT = Math.cos(TILT), ST = Math.sin(TILT);
const COIN = Object.freeze({ cy: 0.16 * DS, r: 0.62 * S.R, rim: 0.045 * DS, glyph: 0.86 * S.R, rough: 0.02 * DS });   // (the coin ~60 % of the girth: the orange shows round it)
const box = (x, y, x0, y0, x1, y1) => { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1); if (dx > 0 || dy > 0) return Math.hypot(dx, dy); return -Math.min(x - x0, x1 - x, y - y0, y1 - y); };
const circ = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;
/** the ₿ as a signed distance in its own units (height 1; < 0 inside the cut): the stem, two bowls (their counters left standing), the
 *  two short bars through the top + the bottom */
function glyphSd(x, y) {
  const upO = Math.min(box(x, y, -0.32, 0, 0.06, 0.4), circ(x, y, 0.06, 0.2, 0.2)), upI = Math.min(box(x, y, -0.1, 0.1, 0.06, 0.3), circ(x, y, 0.06, 0.2, 0.095));
  const loO = Math.min(box(x, y, -0.32, -0.4, 0.09, 0.02), circ(x, y, 0.09, -0.19, 0.215)), loI = Math.min(box(x, y, -0.1, -0.3, 0.09, -0.09), circ(x, y, 0.09, -0.195, 0.105));
  const bowls = Math.min(Math.max(upO, -upI), Math.max(loO, -loI));
  const bars = Math.min(box(x, y, -0.25, 0.36, -0.14, 0.6), box(x, y, -0.06, 0.36, 0.05, 0.6), box(x, y, -0.25, -0.6, -0.14, -0.36), box(x, y, -0.06, -0.6, 0.05, -0.36));
  return Math.min(bowls, bars);
}
/** the knife's wander along a cut (world units, ±~COIN.rough): a few incommensurate ripples — never a ruler-straight edge */
const knife = (u, v) => COIN.rough * (0.55 * Math.sin(u * 9.3 / DS + v * 2.1 / DS) + 0.3 * Math.sin(u * 3.7 / DS - v * 11.3 / DS + 1.3) + 0.15 * Math.sin(v * 23 / DS + u * 1.7 / DS));
/** the carving at a point of the skin (su, sv: world units from the coin's centre) → { sd (the ₿, < 0 cut through), disc (to the coin's
 *  edge), rim (the groove 0..1) } */
function carveAt(su, sv) {
  const g = COIN.glyph, x = (su * CT - sv * ST) / g, y = (su * ST + sv * CT) / g;
  const disc = Math.hypot(su, sv) - COIN.r + knife(sv, su) * 0.5;
  return { sd: glyphSd(x, y) * g + knife(su, sv), disc, rim: clamp01(1 - Math.abs(disc + COIN.rim * 1.2) / COIN.rim) };
}
const suvOf = (x, y) => [x, y - S.yc - COIN.cy];
/** the lid's cut round the stem (a zigzag ring on the top) — the distance to it (units) */
const lidD = (x, z) => { const rho = Math.hypot(x, z), th = Math.atan2(x, -z), zz = Math.abs(((th * 7 / Math.PI) % 2 + 2) % 2 - 1); return Math.abs(rho - (0.36 + 0.06 * zz) * DS); };
// THE FIRE on the cavity's floor (its base + three states: where its light comes from, how its flames lean + reach)
const FLOOR = S.rind * 1.2;
const FIRE = Object.freeze({ x: 0, y: FLOOR, z: 0.18 * DS, r: 0.34 * DS,
  states: Object.freeze([{ lx: -0.32, ly: 0.62, k: 1.0, lean: -0.22, h: 0.95 }, { lx: 0.05, ly: 0.82, k: 1.18, lean: 0.06, h: 1.2 }, { lx: 0.34, ly: 0.58, k: 0.92, lean: 0.25, h: 0.85 }]) });
/** a flame tongue's density at a point: the column leaning, tapering to its tip, rippling */
function flameAt(x, y, z, st) {
  const fy = (y - FIRE.y) / DS, h = st.h; if (fy < 0 || fy > h) return 0;
  const u = fy / h, cx = FIRE.x + st.lean * DS * u * u, w = FIRE.r * (1 - u * 0.85) * (0.9 + 0.2 * Math.sin(u * 9 + st.lean * 7));
  const d = Math.hypot(x - cx, (z - FIRE.z) * 0.8);
  return clamp01(1 - d / Math.max(0.02, w)) * (1 - u * 0.4);
}

/**
 * THE GEOMETRY (once per size; built in slices by geometryStep): Sx = device px per unit, k = how far a unit of depth rises on screen
 * (× a unit of height), carved → per pixel: m (covered 0..1: the silhouette anti-aliased), the skin's normal + rib + height, the cuts
 * (the hole's weight, the rind's cut band), the shaved coin + its rim, the cavity behind a cut: each fire state's light on its wall + the
 * flames the ray passes through.
 */
const GEO = new Map();
export function geometry(Sx, k, carved) {
  const key = `${Sx.toFixed(2)}|${k.toFixed(3)}|${carved ? 1 : 0}`;
  if (GEO.has(key)) return GEO.get(key);
  const X0 = GIANT.box.x, U1 = GIANT.box.top, U0 = GIANT.box.bottom;
  const w = Math.ceil(2 * X0 * Sx), h = Math.ceil((U1 - U0) * Sx), n = w * h, F = () => new Float32Array(n);
  const G = { w, h, ox: X0 * Sx, oy: U1 * Sx, Sx, k, carved, m: F(), nx: F(), ny: F(), nz: F(), lobe: F(), yy: F(), th: F(), py: F(), hole: F(), cut: F(), cy: F(),
    lc: [F(), F(), F()], fl: [F(), F(), F()], sd: new Float32Array(n).fill(9), lid: F(), shave: F(), rim: F(), j: 0, done: false };
  if (GEO.size > 4) GEO.delete(GEO.keys().next().value);
  GEO.set(key, G);
  return G;
}
/** the geometry's next rows within `budget` ms → true once done */
function geometryStep(G, budget = 4) {
  if (G.done) return true;
  const { w, h, Sx, k, carved } = G, X0 = GIANT.box.x, U1 = GIANT.box.top;
  const dl = Math.hypot(1, k), dy = -k / dl, dz = 1 / dl;
  const ER = S.R * 1.14, EH = S.Hh * 1.06, px = 1 / Sx, aa = 2.2 * px / S.R, step = 0.024 * S.R, cstep = 0.028 * S.R, kin = 1 - S.rind / S.R;
  const T0 = performance.now();
  for (; G.j < h; G.j++) {
    if (performance.now() - T0 > budget) return false;
    const j = G.j, U = U1 - (j + 0.5) / Sx;
    for (let i = 0; i < w; i++) {
      const X = (i + 0.5) / Sx - X0, p = j * w + i;
      // the ray: (X, U + dy t, dz t); its entry into the bounding ellipsoid
      const oy = U - S.yc, A = (dy * dy) / (EH * EH) + (dz * dz) / (ER * ER), B = 2 * oy * dy / (EH * EH), C = X * X / (ER * ER) + oy * oy / (EH * EH) - 1, D = B * B - 4 * A * C;
      if (D <= 0) continue;
      const t0 = (-B - Math.sqrt(D)) / (2 * A), t1 = (-B + Math.sqrt(D)) / (2 * A);
      let t = t0, hit = null, minF = 1e9, minT = t0;
      for (; t < t1; t += step) { const f = field(X, U + dy * t, dz * t); if (f < minF) { minF = f; minT = t; } if (f < 0) { hit = t; break; } }
      if (hit == null) { if (minF < aa) { G.m[p] = clamp01(1 - minF / aa) * 0.9; t = minT; } else continue; }
      else { let a = hit - step, b = hit; for (let q = 0; q < 8; q++) { const c = (a + b) / 2; if (field(X, U + dy * c, dz * c) < 0) b = c; else a = c; } t = b; G.m[p] = 1; }
      const x = X, y = U + dy * t, z = dz * t, nrm = grad(x, y, z, 1);
      G.nx[p] = nrm[0]; G.ny[p] = nrm[1]; G.nz[p] = nrm[2]; G.py[p] = y;
      const th = Math.atan2(x, -z); G.th[p] = th; G.lobe[p] = lobeOf(th); G.yy[p] = (y - S.yc) / S.Hh;
      if (!carved) continue;
      G.lid[p] = clamp01(1 - lidD(x, z) / (1.3 * px)) * (y > S.yc + S.Hh * 0.55 ? 1 : 0);
      const [u, v] = suvOf(x, y), cv = carveAt(u, v), sd = cv.sd, front = nrm[2] < -0.05 ? 1 : 0;
      G.sd[p] = sd; G.shave[p] = clamp01(0.5 - cv.disc / px) * front; G.rim[p] = cv.rim;
      const hw = clamp01(0.5 - sd / px) * front;
      if (hw <= 0) continue;
      G.hole[p] = hw;
      // through the cut: the rind's thickness along the ray — still inside the cut at the cavity's wall? (else: the cut face)
      const dn = -(dz * nrm[2] + dy * nrm[1]), tin = S.rind / Math.max(0.28, dn), yi = y + dy * tin;
      const [ui, vi] = suvOf(x, yi), sdi = carveAt(ui, vi).sd;
      G.cut[p] = clamp01(0.5 + sdi / px);
      // the cavity behind: march on to its far wall, passing through the fire's flames on the way
      let q = tin, Q = null; const fl = [0, 0, 0];
      for (; q < tin + S.R * 2.6; q += cstep) {
        const qy = y + dy * q, qz = z + dz * q;
        if (qy < FLOOR + FIRE.r * 4 && Math.abs(qz - FIRE.z) < FIRE.r * 2.5 && Math.abs(x - FIRE.x) < FIRE.r * 2.5) for (let s = 0; s < 3; s++) fl[s] += flameAt(x, qy, qz, FIRE.states[s]) * cstep / (FIRE.r * 0.9);
        if (field(x, qy, qz, kin) > 0) { Q = [x, qy, qz]; break; }
      }
      for (let s = 0; s < 3; s++) G.fl[s][p] = clamp01(fl[s]);
      if (Q) {
        const nin = grad(Q[0], Q[1], Q[2], kin);
        for (let s = 0; s < 3; s++) {
          const st = FIRE.states[s], L = [FIRE.x + st.lx * DS - Q[0], FIRE.y + st.ly * DS - Q[1], FIRE.z - Q[2]], d = Math.hypot(...L) / DS || 1e-3;
          const face = Math.max(0, -(nin[0] * L[0] + nin[1] * L[1] + nin[2] * L[2]) / (d * DS));
          G.lc[s][p] = st.k * (0.4 + 0.6 * face) / (1 + 0.85 * d * d);
        }
        G.cy[p] = Q[1];
      }
    }
  }
  G.done = true;
  return true;
}

// THE COLOURS: the skin (a deep pumpkin orange, the creases browner, a yellow-green blush round the stem), the cut flesh, the cavity, the
// shaved coin's flesh; the fire's light (white-hot → deep orange) + the Bitcoin orange it makes of the shaved coin
const SKIN = [232, 116, 22], CREASE = [124, 52, 14], CROWN = [204, 150, 50], FLESH = [248, 218, 146], CAVE = [36, 14, 5], INNER = [176, 92, 30], COINF = [246, 190, 96];
const HOT = [255, 248, 222], MID = [255, 182, 72], DEEP = [255, 104, 16], BTC = [247, 120, 14];
const hash = (a, b) => { let x = Math.imul((a * 73856093) ^ (b * 19349663), 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

// 9d — THE FLOODS AS LIGHT (the owner: "at its brightest the floodlit giant reads a little flat"): the show floods (floods.js) are real
// lights on the body's own normals — a KEY from the front-left fixture, a weaker FILL from the front-right, both low (brightest at the
// foot, fading up the body), the creases occluded like the rest — so each rib's face toward the key lights up, its crease stays dark and
// the far side turns into shadow; a waxy highlight runs down the ribs facing the key. Baked once per light as its own pass (`flood`);
// floods.js lays it on by the floods' level instead of a wash over the silhouette.
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const GFLOOD = Object.freeze({ key: norm([-0.78, 0.2, -0.6]), fill: norm([0.8, 0.16, -0.58]), kKey: 1.38, kFill: 0.5, amb: 0.06, spec: 0.3, foot: 0.45, col: [255, 212, 156] });
const GF_H = norm([GFLOOD.key[0], GFLOOD.key[1] + 0.3, GFLOOD.key[2] - 1]);
/** the shading job for this light: the body + the fire's three glow states (sliced: shadeStep) + the floods' pass at night */
function shadeJob(G, Lt, seed) {
  const body = mk(G.w, G.h), bx = safeCtx(body);
  if (!bx) return { done: true, out: { body: null, glows: [] } };
  const J = { G, Lt, seed, body, bx, img: bx.createImageData(G.w, G.h), p: 0, done: false, out: null, glows: [], gimgs: [] };
  if ((Lt.night || 0) > 0.05) { const cv = mk(G.w, G.h), x = safeCtx(cv); if (x) { J.flood = cv; J.fx = x; J.fimg = x.createImageData(G.w, G.h); } }
  if (G.carved) for (let s = 0; s < 3; s++) { const cv = mk(G.w, G.h), x = safeCtx(cv); if (!x) break; J.glows.push({ cv, x }); J.gimgs.push(x.createImageData(G.w, G.h)); }
  return J;
}
function shadeStep(J, budget = 4) {
  if (J.done) return true;
  const { G, Lt, seed, body, bx } = J, D = J.img.data, GDs = J.gimgs.map(g => g.data), nG = GDs.length;
  const dayK = (Lt.day || 0) + (Lt.gold || 0) * 0.8, T0 = performance.now();
  for (let n = G.w * G.h; J.p < n; J.p++) {
    if ((J.p & 1023) === 0 && performance.now() - T0 > budget) return false;
    const p = J.p, m = G.m[p]; if (m <= 0) continue;
    const nrm = [G.nx[p], G.ny[p], G.nz[p]], lobe = G.lobe[p], yy = G.yy[p], th = G.th[p];
    // the skin: the rib's crown → its crease, the fine striations down each rib, a few blotches + scars, the crown's blush, the foot in shadow
    let alb = mix(SKIN, CREASE, Math.pow(1 - lobe, 1.6) * 0.9);
    const stri = 0.93 + 0.07 * Math.sin(th * S.ribs * 5.3 + 2.4 * Math.sin(yy * 6.1 + th * 3));
    const bl = hash(Math.floor((th + 4) * 14), Math.floor((yy + 2) * 11) + seed);
    alb = alb.map(v => v * stri * (bl > 0.9 ? 0.86 : bl < 0.05 ? 1.08 : 1));
    if (yy > 0.62) alb = mix(alb, CROWN, clamp01((yy - 0.62) / 0.3) * 0.45);
    const ao = (0.7 + 0.3 * Math.sqrt(lobe)) * (G.py[p] < 0.35 * DS ? 0.72 + 0.8 * G.py[p] / DS : 1);
    let c = lit(Lt, alb, nrm, 0.14).map(v => v * ao);
    if (G.lid[p] > 0) c = mix(c, [24, 10, 4], G.lid[p] * 0.75);
    // THE COIN: the skin shaved off a disc — the pale gold flesh (a shade darker down the rim's groove; its shaved surface a little rough)
    const shv = G.shave[p];
    if (shv > 0) { const fl = lit(Lt, COINF.map(v => v * (0.95 + 0.05 * Math.sin(th * 41 + yy * 37))), nrm, 0.06), gr = fl.map(v => v * 0.58); c = mix(c, mix(fl, gr, G.rim[p]), shv); }
    const hw = G.hole[p];
    // 9d: THE FLOODS' PASS — the skin (or the shaved coin) × the key + the fill on this pixel's normal, the foot brightest, occluded
    if (J.fimg) {
      const FD = J.fimg.data, fa = shv > 0 ? mix(alb, COINF, shv) : alb, F = GFLOOD;
      const v = (F.kKey * Math.max(0, dot3(nrm, F.key)) + F.kFill * Math.max(0, dot3(nrm, F.fill)) + F.amb) * ao * (1 - F.foot * clamp01(yy)) * (1 - hw);
      const sp = F.spec * Math.pow(Math.max(0, dot3(nrm, GF_H)), 18) * Math.sqrt(lobe) * (1 - hw);
      for (let i = 0; i < 3; i++) FD[p * 4 + i] = Math.min(255, fa[i] * v * F.col[i] / 255 + sp * F.col[i]);
      FD[p * 4 + 3] = Math.round(255 * m);
    }
    if (hw > 0) {
      // through the ₿: the CUT FACE of the rind (pale, facing up at us) or the CAVITY's far wall (dark by day)
      const cutN = norm([nrm[0] * 0.5, 1, nrm[2] * 0.5]), cut = lit(Lt, FLESH, cutN, 0).map(v => v * 0.92);
      const cave = mix(CAVE, INNER, clamp01(G.cy[p] / (1.5 * DS)) * 0.5 * dayK);
      c = mix(c, mix(cave, cut, G.cut[p]), hw);
    }
    // THE FIRE's three states (the glow sprites): the cavity's wall by the fire's light, the flames the ray passes, the cut faces lit from
    // inside, the shaved coin glowing Bitcoin orange through its thin flesh (its groove brighter), the skin glowing at the cut's edge
    for (let s = 0; s < nG; s++) {
      let o = [0, 0, 0];
      if (hw > 0) {
        const I = clamp01(G.lc[s][p] * 2.6), wall = I < 0.5 ? mix(DEEP, MID, I * 2) : mix(MID, HOT, (I - 0.5) * 2);
        o = mix(wall.map(v => v * (0.55 + 0.45 * I)), mix(MID, HOT, 0.4).map(v => v * (0.6 + 0.4 * clamp01(G.lc[s][p] * 2))), G.cut[p]);
        const f = G.fl[s][p]; if (f > 0) o = mix(o, f > 0.55 ? mix(MID, HOT, (f - 0.55) / 0.45) : mix(o, MID, f / 0.55), clamp01(f * 1.6));
        o = o.map(v => v * hw);
      }
      // (the shaved coin a DEEP orange glow, dimmer than the cut: the ₿ is the white-hot thing; the skin round a cut glows only at its edge)
      const sd = G.sd[p], tr = sd < 9 && sd > 0 ? Math.exp(-sd / (0.035 * DS)) * 0.4 : 0, sv = shv * (1 - hw), fk = FIRE.states[s].k;
      for (let i = 0; i < 3; i++) o[i] += fk * (DEEP[i] * tr * (1 - hw) + MID[i] * 0.4 * G.lid[p] + BTC[i] * sv * (0.26 + 0.14 * G.rim[p]) * (1 - 0.35 * tr) + MID[i] * 0.5 * sv * G.rim[p]);
      const GD = GDs[s]; GD[p * 4] = Math.min(255, o[0]); GD[p * 4 + 1] = Math.min(255, o[1]); GD[p * 4 + 2] = Math.min(255, o[2]); GD[p * 4 + 3] = Math.round(255 * m);
    }
    D[p * 4] = c[0]; D[p * 4 + 1] = c[1]; D[p * 4 + 2] = c[2]; D[p * 4 + 3] = Math.round(255 * m);
  }
  bx.putImageData(J.img, 0, 0);
  J.glows.forEach((g, s) => g.x.putImageData(J.gimgs[s], 0, 0));
  if (J.fimg) { J.fx.putImageData(J.fimg, 0, 0); J.fimg = null; }
  // THE STEM (drawn over the body, in the sprite's px): a thick fluted woody stalk out of the dimple, curving + leaning, its cut top pale;
  // a dry curling tendril; one leaf dried on the crown
  { const r = rngFrom(seed + 5), Sx = G.Sx, up = y => G.oy - y * Sx, cx = G.ox, base = S.yc + S.Hh * 0.82, top = base + 0.5 * DS, lean = 0.14 * DS;
    const P = u => { const yv = base + (top - base) * u; return [cx + (lean * u * u + 0.02 * DS * Math.sin(u * 5)) * Sx, up(yv)]; };
    const wAt = u => (0.17 - 0.06 * u + 0.05 * Math.exp(-u * 9)) * DS * Sx;
    const L0 = lit(Lt, [96, 100, 50], [-0.6, 0.2, -0.7], 0.05), L1 = lit(Lt, [96, 100, 50], [0.7, 0.2, -0.6], 0.05), DK = lit(Lt, [52, 50, 26], [0, 0, -1], 0);
    for (let s = 0; s < 2; s++) {   // (the whole stalk in its right-hand light, then its left side in the other)
      bx.beginPath();
      for (let q = 0; q <= 12; q++) { const u = q / 12, [px2, py2] = P(u); bx.lineTo(px2 - wAt(u), py2); }
      for (let q = 12; q >= 0; q--) { const u = q / 12, [px2, py2] = P(u); bx.lineTo(px2 + (s ? -0.1 : 1) * wAt(u), py2); }
      bx.closePath(); bx.fillStyle = rgb(s ? L0 : L1); bx.fill();
    }
    bx.strokeStyle = rgb(DK, 0.75); bx.lineWidth = Math.max(0.6, Sx * 0.012 * DS);
    for (const f of [-0.55, -0.15, 0.25, 0.6]) { bx.beginPath(); for (let q = 0; q <= 10; q++) { const u = q / 10, [px2, py2] = P(u); bx.lineTo(px2 + f * wAt(u), py2); } bx.stroke(); }
    const [tx, ty] = P(1); bx.fillStyle = rgb(lit(Lt, [214, 200, 150], [0, 1, -0.2], 0)); bx.beginPath(); bx.ellipse(tx, ty, wAt(1) * 0.95, wAt(1) * 0.4, 0, 0, TAU); bx.fill();
    bx.strokeStyle = rgb(lit(Lt, [118, 108, 58], [0, 0.4, -1], 0), 0.95); bx.lineWidth = Math.max(0.6, Sx * 0.014 * DS); bx.beginPath();
    const [fx, fy] = P(0.12); for (let q = 0; q <= 40; q++) { const a = q / 40 * TAU * 1.6, rr = Sx * DS * (0.05 + 0.13 * (1 - q / 40)); bx.lineTo(fx - Sx * DS * (0.18 + q / 40 * 0.25) + Math.cos(a) * rr * 0.6, fy - Sx * DS * 0.04 + Math.sin(a) * rr * 0.4); } bx.stroke();
    const lx = cx + Sx * DS * 0.4, ly = up(base - 0.05 * DS), lc = lit(Lt, [104, 96, 44], [0.1, 1, -0.3], 0);
    bx.save(); bx.translate(lx, ly); bx.rotate(-0.18 + (r() - 0.5) * 0.2); bx.fillStyle = rgb(lc); bx.beginPath();
    for (let q = 0; q <= 16; q++) { const a = q / 16 * TAU, lob = 1 + 0.18 * Math.cos(a * 5); bx.lineTo(Math.cos(a) * Sx * DS * 0.21 * lob, Math.sin(a) * Sx * DS * 0.07 * lob); }
    bx.closePath(); bx.fill(); bx.strokeStyle = rgb(mix(lc, [30, 26, 10], 0.5), 0.8); bx.lineWidth = Math.max(0.5, Sx * DS * 0.008); bx.beginPath(); bx.moveTo(-Sx * DS * 0.2, 0); bx.lineTo(Sx * DS * 0.2, 0); bx.stroke(); bx.restore();
  }
  J.out = { body, glows: J.glows.map(g => g.cv), flood: J.flood || null }; J.done = true;
  return true;
}

// ------------------------------------------------------------------ THE STRAW BED (straw spread round its foot, in the camera's perspective)
const STRAW = [214, 172, 72], STRAW_HI = [242, 212, 120], STRAW_LO = [140, 100, 36];
function paintBed(cam, g, Lt, dpr, seed) {
  const P = GIANT.plinth, rx = P.w / 2, rz = P.d / 2, r = rngFrom(seed + 11), N = 64;
  // the bed's edge: a ragged ellipse (straw thrown down, never a clean line), its points on the paving
  const edge = []; for (let i = 0; i < N; i++) { const a = i / N * TAU, k = 0.92 + 0.12 * r(); edge.push([g.x + Math.cos(a) * rx * k, g.z + Math.sin(a) * rz * k]); }
  const pts = edge.map(([x, z]) => project(cam, x, P.h * 0.5, z));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), bx0 = Math.floor(Math.min(...xs)) - 4, by0 = Math.floor(Math.min(...ys)) - 4, bx1 = Math.ceil(Math.max(...xs)) + 4, by1 = Math.ceil(Math.max(...ys)) + 4;
  const cv = mk((bx1 - bx0) * dpr, (by1 - by0) * dpr), x = safeCtx(cv);
  if (!x) return null;
  x.setTransform(dpr, 0, 0, dpr, -bx0 * dpr, -by0 * dpr);
  const path = () => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); };
  path(); x.fillStyle = rgb(lit(Lt, mix(STRAW, STRAW_LO, 0.25), [0, 1, -0.2], 0)); x.fill();
  // the straws: short strokes every way (lighter on top, darker in the litter)
  x.save(); path(); x.clip(); x.lineCap = 'round';
  const cxp = (bx0 + bx1) / 2, cyp = (by0 + by1) / 2, W = bx1 - bx0, H = by1 - by0;
  for (let i = 0; i < 900; i++) { const fx = cxp + (r() - 0.5) * W, fy = cyp + (r() - 0.5) * H, len = 1 + r() * 3.2, a = r() * Math.PI;
    x.strokeStyle = rgb(lit(Lt, r() < 0.55 ? STRAW_HI : STRAW_LO, [0, 1, -0.2], 0), 0.6); x.lineWidth = 0.35 + r() * 0.35; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * len, fy + Math.sin(a) * len * 0.45); x.stroke(); }
  x.restore();
  // stray straws past the edge
  x.lineWidth = 0.4;
  for (let i = 0; i < 70; i++) { const p = pts[Math.floor(r() * N)], a = r() * TAU, len = 1 + r() * 2.5; x.strokeStyle = rgb(lit(Lt, STRAW_HI, [0, 1, -0.2], 0), 0.55); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len * 0.45); x.stroke(); }
  return { cv, x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
}

// ------------------------------------------------------------------ THE PIECE
export function createGiant() {
  const cache = new Map();
  const free = o => { for (const c of [o.body, o.flood, ...(o.glows || []), o.bed && o.bed.cv]) if (c) c.width = c.height = 0; };
  const put = (k, v) => { cache.set(k, v); if (cache.size > 8) { const k0 = cache.keys().next().value; const o = cache.get(k0); if (o !== lastReady) free(o); cache.delete(k0); } return v; };
  const stat = { drawn: 0, carved: false, lit: 0, rect: null, pool: 0, bakes: 0 };
  const jobs = new Map(), BUDGET = 4;
  let lastReady = null, pl = null;
  /** the sprites for this layout + light (built over a few frames; the last ready ones keep showing — a light change never blinks it) */
  function sprites(L, g, T, dark, dpr, carved, lightKey) {
    const key = `${L.cam.W}x${L.cam.H}|${dpr}|${carved ? 1 : 0}|${lightKey}`;
    if (cache.has(key)) return (lastReady = cache.get(key));
    const cam = L.cam, s = cam.F / g.z, Sx = s * dpr, k = (cam.CAMH - (GIANT.plinth.h + S.yc)) * GIANT.e / g.z;
    let job = jobs.get(key);
    if (!job) { const G = geometry(Sx, k, carved), Lt = lightFor(T || { day: 1 }, { ...pieceCtx(L), lampK: dark }, g.x, g.z); job = { G, Lt, sh: null }; jobs.set(key, job); if (jobs.size > 3) jobs.delete(jobs.keys().next().value); }
    let left = BUDGET;
    if (!job.G.done) { const t0 = performance.now(); if (!geometryStep(job.G, left)) return lastReady; left -= performance.now() - t0; }
    if (!job.sh) job.sh = shadeJob(job.G, job.Lt, g.seed || 7);
    if (left <= 0.5 || !shadeStep(job.sh, left)) return lastReady;
    jobs.delete(key); stat.bakes++;
    return (lastReady = put(key, { ...job.sh.out, G: job.G, s, bed: paintBed(cam, g, job.Lt, dpr, g.seed || 7) }));
  }
  /** is a bake still running (nothing ready yet) */
  const pending = () => !lastReady;
  /**
   * draw the piece on the inlay. o = { L, g (giantPiece), T, dark (the lamps 0..1), dpr, carved, lit (0..1 the fire: after dark), bright
   * (1; 1.3 on Halloween night), t, mo (motion), fade, tier, power (a blackout), lightKey }
   */
  function draw(c, o) {
    const { L, g } = o, cam = L.cam, dpr = Math.min(BAKE_CAP, o.dpr || 2), fade = o.fade == null ? 1 : o.fade;
    const sp = sprites(L, g, o.T, o.dark || 0, dpr, !!o.carved, o.lightKey || '');
    if (!sp || !sp.body) return;
    const [bx, by] = project(cam, g.x, GIANT.plinth.h, g.z), s = sp.s;
    const lk = clamp01(o.lit || 0) * (o.power == null ? 1 : o.power) * (o.carved ? 1 : 0);
    // THE FIRE's rhythm: three states cross-faded on a fire's own beat (smooth, irregular — a breath, a lick, a gust), its brightness
    // breathing with them (never a strobe); reduced motion: the middle state, steady
    const t = o.t || 0, mo = o.mo !== false;
    const wv = mo ? [0.5 + 0.5 * Math.sin(t * 1.9 + 0.3) * Math.sin(t * 0.73), 0.6 + 0.4 * Math.sin(t * 2.7 + 2.1), 0.5 + 0.5 * Math.sin(t * 2.3 + 4.2) * Math.sin(t * 0.61 + 1)] : [0, 1, 0];
    const ws = wv[0] + wv[1] + wv[2] || 1, wn = wv.map(v => v / ws);
    const fl = mo ? clamp01(0.86 + 0.07 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 8.3 + 1.3) + 0.03 * Math.sin(t * 17.9)) : 0.92;
    const K = lk * fl * (o.bright || 1);
    c.save(); c.globalAlpha = fade;
    if (sp.bed) c.drawImage(sp.bed.cv, sp.bed.x, sp.bed.y, sp.bed.w, sp.bed.h);
    // the contact shadow where it sits on the straw (its sagging foot)
    { const [fx, fy] = project(cam, g.x, GIANT.plinth.h, g.z - S.R * 0.15); c.fillStyle = `rgba(20,10,8,${(0.5 * fade).toFixed(3)})`; c.beginPath(); c.ellipse(fx, fy, S.R * 0.95 * s, S.R * 0.32 * s, 0, 0, TAU); c.fill(); }
    // THE FIRE'S LIGHT on the straw + the cobbles in front (out of the ₿ + through the coin), breathing with the fire
    if (K > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const [px, py] = project(cam, g.x, 0, g.z - S.R - 1.6 * DS), R = 3.4 * DS * s;
      const gr = c.createRadialGradient(px, py, 0, px, py, R); gr.addColorStop(0, `rgba(255,150,46,${(0.34 * K).toFixed(3)})`); gr.addColorStop(0.45, `rgba(255,110,24,${(0.13 * K).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,90,10,0)');
      c.save(); c.translate(px, py); c.scale(1.25, 0.34); c.translate(-px, -py); c.fillStyle = gr; c.fillRect(px - R, py - R, R * 2, R * 2); c.restore();
      c.globalCompositeOperation = 'source-over'; stat.pool = +(0.34 * K).toFixed(2);
    } else stat.pool = 0;
    // THE CANDLE JARS round its foot on the straw (the display's footlights): little glass jars, a flame + a warm halo each after dark
    { const jy = GIANT.plinth.h;
      for (const [k2, du] of [-2.9, -1.3, 1.3, 2.9].entries()) {
        const jx = g.x + du, jz = g.z - GIANT.plinth.d / 2 + 0.45 + 0.12 * Math.abs(du);   // (on the straw's front edge, in front of its foot)
        const [x1, y1] = project(cam, jx, jy, jz), js = cam.F / jz, jw = 0.24 * js, jh = 0.34 * js;   // (jars at a person's scale)
        c.fillStyle = `rgba(120,70,30,${(0.6 * fade).toFixed(3)})`; c.fillRect(x1 - jw / 2, y1 - jh, jw, jh);   // (amber glass)
        c.fillStyle = `rgba(255,220,170,${(0.4 * fade).toFixed(3)})`; c.fillRect(x1 - jw / 2, y1 - jh, jw * 0.22, jh);
        if (K > 0.02) { const f2 = mo ? 0.85 + 0.15 * Math.sin(t * (7 + k2) + k2 * 1.7) : 1, R2 = 0.9 * js;
          c.globalCompositeOperation = 'lighter';
          const gr = c.createRadialGradient(x1, y1 - jh * 0.55, 0, x1, y1 - jh * 0.55, R2); gr.addColorStop(0, `rgba(255,214,140,${(0.75 * K * f2).toFixed(3)})`); gr.addColorStop(0.3, `rgba(255,150,50,${(0.22 * K * f2).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,30,0)');
          c.fillStyle = gr; c.fillRect(x1 - R2, y1 - jh * 0.55 - R2, R2 * 2, R2 * 2);
          c.fillStyle = `rgba(255,250,225,${(0.95 * K).toFixed(3)})`; c.beginPath(); c.ellipse(x1, y1 - jh * 0.6, Math.max(0.5, jw * 0.16), Math.max(0.8, jh * 0.24), 0, 0, TAU); c.fill();
          c.globalCompositeOperation = 'source-over'; }
      } }
    // the body
    const x0 = bx - sp.G.ox / dpr, y0 = by - sp.G.oy / dpr, w = sp.G.w / dpr, h = sp.G.h / dpr;
    c.drawImage(sp.body, x0, y0, w, h);
    lastSp = { cv: sp.body, flood: sp.flood || null, x: x0, y: y0, w, h };   // (9c: the floods light this piece — floods.js; 9d: by its own flood pass)
    if (sp.glows && sp.glows.length && K > 0.02) {
      // the fire's three states, each at its share of the moment (+ a second pass for the heat; a third on Halloween night)
      c.globalCompositeOperation = 'lighter';
      sp.glows.forEach((gcv, i) => {
        const a = K * wn[i] * 1.15;
        c.globalAlpha = fade * Math.min(1, a); c.drawImage(gcv, x0, y0, w, h);
        if (o.tier !== 0) { c.globalAlpha = fade * Math.min(1, a * 0.85); c.drawImage(gcv, x0, y0, w, h); }
        if (K > 1) { c.globalAlpha = fade * Math.min(1, (K - 1) * wn[i] * 2.4); c.drawImage(gcv, x0, y0, w, h); }
      });
      // the warm air round the carving (tight — never a haze over the city)
      const [hx, hy] = project(cam, g.x, GIANT.plinth.h + S.yc + COIN.cy, g.z - S.R * 0.85), R = 1.9 * DS * s;
      const gr = c.createRadialGradient(hx, hy, 0, hx, hy, R); gr.addColorStop(0, `rgba(255,140,40,${(0.14 * K).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,100,20,0)');
      c.globalAlpha = fade; c.fillStyle = gr; c.fillRect(hx - R, hy - R, R * 2, R * 2);
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    stat.drawn++; stat.carved = !!o.carved; stat.lit = +K.toFixed(2); stat.fire = wn.map(v => +v.toFixed(2));
    stat.rect = { x: +x0.toFixed(1), y: +y0.toFixed(1), w: +w.toFixed(1), h: +h.toFixed(1) };
    stat.body = { w: +(S.R * 2 * s).toFixed(1), top: +(by - (S.yc + S.Hh * 0.82 + 0.5 * DS) * s).toFixed(1), coin: { x: +bx.toFixed(1), y: +(by - (S.yc + COIN.cy) * s).toFixed(1), r: +(COIN.r * s).toFixed(1) } };
    pl = K > 0.02 ? { x: g.x, z: g.z - S.R, y: GIANT.plinth.h + S.yc, col: [255, 150, 60], k: 0.95 * K, r: 3.6 * DS } : null;
  }
  let lastSp = null;
  return {
    draw, pending,
    /** 9c: the body as it was last drawn ({ cv, x, y, w, h }) — the floods' wash uses its silhouette */
    lastSprite: () => lastSp,
    /** the light it throws now (people.js lights the dancers + walkers near it): { x, z, y, col, k, r } | null */
    pointLight: () => pl,
    clearLight() { pl = null; },
    debug: () => ({ ...stat, sprites: cache.size, pending: pending() }),
    destroy() { for (const o of cache.values()) free(o); cache.clear(); jobs.clear(); lastReady = null; },
  };
}
