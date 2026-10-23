// CITY 2.0 — THE HARBOR: THE CLOUDS (DT2 — a full rework; docs/harbor.md#dt2). One cloud system for every hour, replacing City
// 1.0's cloud art on the Harbor (district/weather-fx.js still runs the lightning; City 1.0 keeps its own clouds untouched).
// WHAT + WHERE + THE LIGHT are PURE (core/harbor-clouds.js: the real weather's kinds, the perspective layout, the light); this file
// BAKES each cloud into a shaded sprite and moves it by offset only.
//   - THE SHAPES are real volumes, shaded per pixel (no outlines, no flat discs): a CUMULUS is a union of 3D lobes (a broad flat-ish
//     base, one to three domes, cauliflower lobes on lobes, irregular soft edges from noise, an uneven base); the layer clouds
//     (STRATOCUMULUS, ALTOCUMULUS, CIRRUS, the OVERCAST deck) are noise fields laid out in perspective (big cells overhead, finer
//     toward the horizon); the deck wraps seamlessly (sampled on a cylinder) and drifts.
//   - THE LIGHT: the key light (the sun, or the moon at night) from its real side — the sunlit side bright with crisper edges, the
//     far side + the bellies a soft blue-grey, a bright rim where the sun is right behind a thin edge, lit from below at sunset;
//     the ambient from the sky above and the ground / the city's glow below.
//   - COST: each cloud's SHAPE (the lobes, the noise: the heavy part) is computed ONCE per plan into small typed arrays (normals,
//     thickness, depth, texture: 6 bytes a pixel); a LIGHT change only re-shades those (a few multiplies a pixel). Both run as
//     time-sliced jobs (≤ ~1.2 ms a frame once the sky shows) and a re-lit cloud crossfades in. A frame: one drawImage a cloud.
//     Never a per-frame bake, never a pixel readback.
//   - DEPTH: drawn after the sun + the moon + the stars, before the skyline (behind every building), under the page (the NEON sign
//     + the tagline draw over the canvas; DT1's dark halo keeps SPEAKEASY readable), never over the dock.
// PART 9 PLUGS IN: KINDS (the shape builders — add 'nimbus', 'fog' …) and set({ grey, dark, base }) (greys / darkens / lowers the
// whole sky for rain, storms, snow; re-lit at once). Part 6b: the sky messages drift through the same sky (skywriting is drawn after).
import { rngFrom } from '../../core/rng.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { cloudMix, cloudPlan, driftX, skyLight, cloudLit } from '../../core/harbor-clouds.js';
import { harborSky } from './tones.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ NOISE (value noise, seeded; 2D + 3D)
function noiseOf(seed) {
  const R = rngFrom(`nz|${seed}`), p = new Uint8Array(512), v = new Float32Array(256);
  for (let i = 0; i < 256; i++) { p[i] = i; v[i] = R(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const f = t => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = f(x - xi), w = f(y - yi), X = xi & 255, Y = yi & 255;
    const a = v[p[p[X] + Y]], b = v[p[p[X + 1] + Y]], c = v[p[p[X] + Y + 1]], d = v[p[p[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const n3 = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = f(x - xi), w = f(y - yi), s = f(z - zi);
    const X = xi & 255, Y = yi & 255, Z = zi & 255, A = p[X] + Y, B = p[X + 1] + Y;
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(v[p[p[A] + Z]], v[p[p[B] + Z]], u), l(v[p[p[A + 1] + Z]], v[p[p[B + 1] + Z]], u), w),
      l(l(v[p[p[A] + Z + 1]], v[p[p[B] + Z + 1]], u), l(v[p[p[A + 1] + Z + 1]], v[p[p[B + 1] + Z + 1]], u), w), s);
  };
  const fbm2 = (x, y, o = 4) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { s += a * n2(x + i * 17.3, y - i * 9.1); n += a; a *= 0.5; x *= 2.03; y *= 2.03; } return s / n; };
  const fbm3 = (x, y, z, o = 4) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { s += a * n3(x + i * 17.3, y - i * 9.1, z + i * 5.7); n += a; a *= 0.5; x *= 2.03; y *= 2.03; z *= 2.03; } return s / n; };
  return { n2, n3, fbm2, fbm3 };
}

// ------------------------------------------------------------------ THE FIELDS (one cloud's shape, cached)
/** the shape's arrays at `res` px per pt: normals (Int8 ×3), thickness (t), depth below its top (oc), texture (det) */
function fieldOf(w, h, res) {
  const pw = Math.max(2, Math.ceil(w * res)), ph = Math.max(2, Math.ceil(h * res)), n = pw * ph;
  return { pw, ph, res, nx: new Int8Array(n), ny: new Int8Array(n), nz: new Int8Array(n), t: new Uint8Array(n), oc: new Uint8Array(n), det: new Uint8Array(n) };
}
const ROWS = 14;                                   // rows per time slice (a job yields between them; wide sprites fewer)
const rowsOf = pw => Math.max(2, Math.min(ROWS, Math.floor(5000 / pw)));

/** a heap (cumulus / scud): the lobes, in the sprite's pt — [cx, cy, r, squash (ry / r), zc]. A few BIG domes carry the form;
 *  many small billows on their upper silhouette + face make the cauliflower (blended smoothly: heapField) */
function heapLobes(R, w, h, tall, ragged) {
  const S = [], base = h * 0.9;
  // the towers: one main dome + one to three lesser ones beside it, at different heights (a skyline of domes, never even)
  const nT = 1 + (R() < 0.75 ? 1 : 0) + (R() < 0.45 ? 1 : 0) + (tall > 0.5 && R() < 0.4 ? 1 : 0);
  const towers = [{ u: 0.34 + R() * 0.32, ht: 1 }];
  for (let t = 1; t < nT; t++) { let u = 0.5; for (let g = 0; g < 6; g++) { u = 0.12 + R() * 0.76; if (towers.every(T => Math.abs(T.u - u) > 0.16)) break; } towers.push({ u, ht: 0.38 + R() * 0.42 }); }
  // the body: broad flattened masses along the base (one mass, never a string of beads)
  const nb = 3 + Math.floor(R() * 3);
  for (let i = 0; i < nb; i++) {
    const u = 0.14 + 0.72 * (i + 0.2 + R() * 0.6) / nb, r = w * (0.13 + R() * 0.06) * (1 - 0.5 * Math.abs(u - 0.5));
    S.push([w * u, base - r * 0.32, r, 0.5 + R() * 0.12, R() * r * 0.25]);
  }
  const mains = [];
  for (const T of towers) {
    const H = h * 0.86 * T.ht;
    let r = Math.min(w * 0.21, H * 0.56) * (0.88 + R() * 0.24), y = base - r * 0.45, x = w * T.u;
    for (let guard = 0; guard < 4 && y - r > base - H - r * 0.15; guard++) {
      const L = [x, y, r, 0.96 + R() * 0.08, R() * r * 0.3]; S.push(L); mains.push(L);
      y -= r * (0.55 + R() * 0.2); r *= 0.72 + R() * 0.12; x += (R() - 0.5) * r * 0.5;
    }
    // (the shoulders: a big lobe either side of the dome, lower)
    for (const sg of [-1, 1]) if (R() < 0.8) { const rr = Math.min(w * 0.16, H * 0.4) * (0.7 + R() * 0.3); const L = [w * T.u + sg * rr * (0.9 + R() * 0.5), base - rr * (0.55 + R() * 0.3), rr, 0.92, R() * rr * 0.3]; S.push(L); mains.push(L); }
  }
  // THE BILLOWS: every dome's whole upper surface is billows (the cauliflower) — along its silhouette (the outline: arcs of many
  // sizes) and over its face (sunk so only their fronts bulge) — and the bigger silhouette billows carry billows of their own
  const rMax = mains.reduce((m, L) => Math.max(m, L[2]), 1), dens = ragged ? 0.55 : 1;
  for (const P of mains) {
    const [px, py, pr, , pz] = P, nSil = Math.round((5 + 8 * pr / rMax) * dens), nFace = Math.round((1 + 3 * pr / rMax) * dens);
    for (let k = 0; k < nSil; k++) {
      const a = -Math.PI * (0.04 + 0.92 * (k + 0.2 + R() * 0.6) / nSil), rc = pr * (0.16 + R() * 0.26);
      const cx = px + Math.cos(a) * (pr - rc * 0.45), cy = py + Math.sin(a) * (pr - rc * 0.45);
      if (cy > base - rc * 0.25) continue;
      S.push([cx, cy, rc, 1, pz + R() * rc * 0.35]);
      for (let g = 0, gn = rc > pr * 0.24 ? 1 + (R() < 0.55 ? 1 : 0) : (R() < 0.4 ? 1 : 0); g < gn; g++) {
        const b2 = a + (R() - 0.5) * 1.4, rg = rc * (0.32 + R() * 0.2);
        const gx = cx + Math.cos(b2) * (rc - rg * 0.35), gy = cy + Math.sin(b2) * (rc - rg * 0.35);
        if (gy < base - rg * 0.25) S.push([gx, gy, rg, 1, pz + rc * 0.15 + R() * rg * 0.3]);
      }
    }
    for (let k = 0; k < nFace; k++) {
      const a = Math.PI * (1.05 + 0.9 * R()), rd = pr * (0.25 + 0.55 * Math.sqrt(R())), cx = px + Math.cos(a) * rd, cy = py + Math.sin(a) * rd * 0.85;
      // (large + shallow: a gentle swell in the face, never a bubble)
      const rc = pr * (0.32 + R() * 0.16), sz = Math.sqrt(Math.max(0, 1 - (rd / pr) ** 2)) * pr;
      if (cy < base - rc * 0.3) S.push([cx, cy, rc, 1, pz + sz - rc * 0.86]);
    }
  }
  if (ragged) for (const L of S) { L[3] *= 0.8; L[0] += (R() - 0.5) * w * 0.07; }
  // fit inside the sprite: scale about the base's centre so every lobe's top + sides stay inside the margin
  const pad = Math.max(2, w * 0.04);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const [cx, cy, r, sq] of S) { x0 = Math.min(x0, cx - r); x1 = Math.max(x1, cx + r); y0 = Math.min(y0, cy - r * sq); }
  const k = Math.min((w - 2 * pad) / Math.max(1, x1 - x0), (base - pad) / Math.max(1, base - y0), 1.25), mx = (x0 + x1) / 2;
  const lobes = S.map(([cx, cy, r, sq, zc]) => [w / 2 + (cx - mx) * k, base - (base - cy) * k, r * k, sq, zc * k]);
  const rs = lobes.map(L => L[2]).sort((a, b) => a - b);
  return { lobes, base, rMed: rs[Math.floor(rs.length * 0.5)] || 10 };
}

/** CUMULUS / SCUD: rasterise the lobes — a SMOOTH union (each pixel's normal the soft-max-weighted blend of the lobes it's on, so
 *  the billows merge with soft creases instead of hard seams), the thickness through them, noise for soft irregular edges */
/** STRATOCUMULUS: a patch of flat heaps merged into one lumpy mass — rounded masses of varied size on an uneven base, a few gaps,
 *  small billows on the bigger ones (the same engine as the cumulus: a smooth union, the self-shadow) */
function stratoLobes(R, w, h) {
  const S = [], base = h * 0.86, n = 9 + Math.floor(R() * 7);
  let x = w * (0.05 + R() * 0.06);
  for (let i = 0; i < n && x < w * 0.95; i++) {
    const r = h * (0.26 + R() * 0.3) * (1 - 0.45 * Math.abs(x / w - 0.5) * 2), sq = 0.55 + R() * 0.2;
    S.push([x, base - r * sq * (0.45 + R() * 0.3), r, sq, R() * r * 0.3]);
    if (r > h * 0.36 && R() < 0.7) { const rc = r * (0.35 + R() * 0.15), a = -Math.PI / 2 + (R() - 0.5) * 1.6; S.push([x + Math.cos(a) * r * 0.6, base - r * sq * 0.6 + Math.sin(a) * r * sq * 0.6, rc, 0.9, r * 0.3]); }
    x += r * (0.7 + R() * 0.5) + (R() < 0.18 ? r * (0.6 + R() * 0.8) : 0);
  }
  const rs = S.map(L => L[2]).sort((a, b) => a - b);
  return { lobes: S, base, rMed: rs[Math.floor(rs.length * 0.5)] || 10 };
}
function* heapField(d, F, N) {
  const { pw, ph, res } = F, R = rngFrom(`heap|${d.seed}`), { lobes, base, rMed } = d.kind === 'strato' ? stratoLobes(R, d.w, d.h) : heapLobes(R, d.w, d.h, d.tall || 0, d.kind === 'scud');
  const n = pw * ph, TK = new Float32Array(n), WS = new Float32Array(n), NX = new Float32Array(n), NY = new Float32Array(n), NZ = new Float32Array(n), NB = new Float32Array(n);
  const fq = 7 / Math.max(20, d.w), amp = d.kind === 'scud' ? 0.6 : 0.34;
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) NB[py * pw + px] = N.fbm2(px / res * fq, py / res * fq, 4);
    if (py % (rowsOf(pw) * 3) === 0) yield;
  }
  let zTop = -1e9;
  for (const L of lobes) zTop = Math.max(zTop, L[4] + L[2]);
  const kS = 1 / Math.max(0.6, 0.11 * rMed);
  for (let li = 0; li < lobes.length; li++) {
    const [cx, cy, r, sq, zc] = lobes[li], ry = r * sq;
    const xa = Math.max(0, Math.floor((cx - r * 1.2) * res)), xb = Math.min(pw - 1, Math.ceil((cx + r * 1.2) * res));
    const ya = Math.max(0, Math.floor((cy - ry * 1.2) * res)), yb = Math.min(ph - 1, Math.ceil((cy + ry * 1.2) * res));
    for (let py = ya; py <= yb; py++) {
      const dy = ((py + 0.5) / res - cy) / ry, dy2 = dy * dy;
      for (let px = xa; px <= xb; px++) {
        const dx = ((px + 0.5) / res - cx) / r, d2 = dx * dx + dy2;
        if (d2 > 1.5) continue;
        const i = py * pw + px, e = d2 * (1 + amp * (NB[i] - 0.5) * 2.2);
        if (e >= 1) continue;
        const qz = Math.sqrt(1 - e), z = zc + r * qz;
        TK[i] += 2 * r * qz;
        const wgt = Math.exp(kS * (z - zTop)), nz0 = Math.sqrt(Math.max(0, 1 - d2)), ny0 = dy / sq, nl = Math.hypot(dx, ny0, nz0) || 1;
        WS[i] += wgt; NX[i] += wgt * dx / nl; NY[i] += wgt * ny0 / nl; NZ[i] += wgt * nz0 / nl;
      }
    }
    if (li % 6 === 5) yield;
  }
  // the finish: the blended normals (+ a soft bump from the noise), the flat uneven base, the depth below the column's top
  const tRef = Math.max(4, d.h * 0.5), bump = 1.5 * res, colTop = new Float32Array(pw).fill(ph);
  for (let px = 0; px < pw; px++) for (let py = 0; py < ph; py++) if (TK[py * pw + px] > tRef * 0.05) { colTop[px] = py; break; }
  // (the column tops smoothed across the cloud — a step between two domes must not draw a seam down the body)
  { const rad = Math.max(2, Math.round(pw * 0.1)), src = Float32Array.from(colTop), gTop = Math.min(...src);
    for (let px = 0; px < pw; px++) { let sum = 0, n = 0; for (let k = px - rad; k <= px + rad; k++) { const v = src[Math.max(0, Math.min(pw - 1, k))]; sum += v < ph ? v : gTop; n++; } colTop[px] = sum / n * 0.6 + gTop * 0.4; } }
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const i = py * pw + px;
      if (!(TK[i] > 0)) continue;
      let nx, ny, nz;
      if (WS[i] > 1e-30) { nx = NX[i] / WS[i]; ny = NY[i] / WS[i]; nz = NZ[i] / WS[i]; } else { nx = 0; ny = 0; nz = 1; }
      const gx = (NB[i + (px < pw - 1 ? 1 : 0)] - NB[i - (px > 0 ? 1 : 0)]) * bump, gy = (NB[i + (py < ph - 1 ? pw : 0)] - NB[i - (py > 0 ? pw : 0)]) * bump;
      nx += gx; ny += gy;
      const nl = Math.hypot(nx, ny, nz) || 1;
      F.nx[i] = Math.round(nx / nl * 127); F.ny[i] = Math.round(ny / nl * 127); F.nz[i] = Math.round(nz / nl * 127);
      // the base: flat-ish but uneven (a slow wobble along it), cut softly
      // (a long base wobbles more: a wide patch is never ruled flat — its heaps' bellies show)
      const st = d.kind === 'strato', by = (base + (N.fbm2(px / res / Math.max(30, d.w) * (st ? 6 : 3.2), 3.7, 2) - 0.5) * (d.h * (st ? 0.22 : 0.09) + d.w * 0.012)) * res, soft = Math.max(1.5, d.h * (st ? 0.09 : 0.045) * res);
      const cut = 1 - smooth(by - soft, by + soft * 0.6, py);
      F.t[i] = Math.min(255, Math.round(TK[i] / tRef * 255 * cut));
      F.oc[i] = Math.round(255 * clamp01((py - colTop[px]) / Math.max(2, by - colTop[px])));
      F.det[i] = Math.round(clamp01(NB[i] * 1.4 - 0.2) * 255);
    }
    if (py % rowsOf(pw) === 0) yield;
  }
}

/** the layer clouds (strato, alto, cirrus, the deck): a noise field laid out in perspective (big cells near, fine toward the horizon) */
function* layerField(d, F, N, box) {
  const { pw, ph, res } = F, kind = d.kind, deck = kind === 'deck', y0 = deck ? 0 : d.y - d.h;
  const n = pw * ph, D = new Float32Array(n);
  const R = rngFrom(`lay|${d.seed}`), ox = R() * 100, oz = R() * 100;
  const cell = kind === 'alto' ? 0.05 : kind === 'cirrus' ? 0.03 : kind === 'deck' ? 0.011 : 0.022;   // cells per pt overhead
  const nearOf = sy => Math.min(1.25, Math.max(0, (box.hz - sy) / Math.max(1, box.hz - box.top))) * 0.97 + 0.03;
  // (perspective: a cell overhead is about as tall as wide; toward the horizon it flattens — the vertical scale is the horizontal
  // one times the camera's focal length, in pt)
  const FP = (box.hz - box.top) * 1.25;
  for (let py = 0; py < ph; py++) {
    const sy = y0 + (py + 0.5) / res, near = nearOf(sy), wz = oz + 1 / near * FP * cell;
    for (let px = 0; px < pw; px++) {
      const i = py * pw + px, sxp = (px + 0.5) / res;
      let v;
      if (deck) {
        // (a seamless tile: x on a cylinder, its circumference the tile's width at this distance)
        const th = sxp / d.w * Math.PI * 2, rr = d.w / (Math.PI * 2) * cell / near;
        const b = N.fbm3(Math.cos(th) * rr + ox, Math.sin(th) * rr, wz, 4);
        const rolls = N.fbm3(Math.cos(th) * rr * 0.4 + ox, Math.sin(th) * rr * 0.4 + 40, wz * 0.4, 3);
        // (thick almost everywhere: soft undulations of thicker + thinner cloud, broad darker rolls)
        v = 0.8 + (b - 0.5) * 0.95 + (rolls - 0.5) * 0.7;
      } else {
        const wx = ox + sxp / near * cell, zz = wz;
        const u = sxp / d.w, vv = (py + 0.5) / ph;
        // the patch's soft ragged outline
        const env = (1 - Math.hypot((u - 0.5) * 2.05, (vv - 0.58) * 2.3) + (N.fbm2(u * 3 + ox, vv * 2 + oz, 3) - 0.5) * 0.9)
          * smooth(0, 0.12, u) * smooth(1, 0.88, u) * smooth(0, 0.14, vv) * smooth(1, 0.86, vv);
        if (kind === 'cirrus') {
          // high fibres along the wind, combed, curling at their ends (mares' tails)
          const curl = (N.fbm2(u * 2.2 + ox, vv * 1.6, 2) - 0.5) * 2.2;
          const fib = 1 - Math.abs(2 * N.fbm2(wx * 0.22 + curl, (vv + curl * 0.1) * 16 + oz, 3) - 1);
          const veil = smooth(0, 0.6, env);
          v = (Math.pow(fib, 5) * 0.95 + 0.12) * veil * (0.45 + 0.75 * N.fbm2(u * 5 + 3, vv * 2.5 + 7, 2));
        } else {
          const b = N.fbm2(wx, zz, kind === 'alto' ? 3 : 4);
          // (rounded cells: the noise lifted into billows, darker gaps between)
          const cells = Math.pow(clamp01((b - 0.36) * 2.4), 0.8);
          v = cells * smooth(-0.05, 0.4, env) * (kind === 'alto' ? 0.72 : 1);
        }
      }
      D[i] = v;
    }
    if (py % rowsOf(pw) === 0) yield;
  }
  const bumpK = (kind === 'cirrus' ? 0 : kind === 'deck' ? 9 : 14) * res;
  for (let py = 0; py < ph; py++) {
    const sy = y0 + (py + 0.5) / res, near = nearOf(sy);
    for (let px = 0; px < pw; px++) {
      const i = py * pw + px, v = D[i];
      if (v <= 0.01) continue;
      const pxl = deck ? (px > 0 ? i - 1 : i + pw - 1) : (px > 0 ? i - 1 : i), pxr = deck ? (px < pw - 1 ? i + 1 : i - pw + 1) : (px < pw - 1 ? i + 1 : i);
      const gx = (D[pxr] - D[pxl]) * bumpK * near, gy = (D[i + (py < ph - 1 ? pw : 0)] - D[i - (py > 0 ? pw : 0)]) * bumpK * near;
      let nx = -gx, ny = -gy, nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      F.nx[i] = Math.round(nx / nl * 127); F.ny[i] = Math.round(ny / nl * 127); F.nz[i] = Math.round(nz / nl * 127);
      F.t[i] = Math.min(255, Math.round(clamp01(v) * 255));
      // (the self-shade: a thick layer is dark underneath; the deck darkest overhead, lighter toward the horizon)
      F.oc[i] = Math.round(255 * clamp01(deck ? 0.12 + 0.5 * Math.min(1, near) + (v - 0.8) * 1.6 : clamp01(v) * 0.75));
      F.det[i] = deck ? Math.round(clamp01(v * 0.9) * 255) : 128;
    }
    if (py % rowsOf(pw) === 0) yield;
  }
}

/** the shape builders: Part 9 adds its own (a 'nimbus' heap with a dark flat base, 'fog' banks …) */
export const KINDS = { cumulus: heapField, scud: heapField, strato: heapField, alto: layerField, cirrus: layerField, deck: layerField };
// per kind: the edge softness (σ soft / σ on the sunlit side: crisper), how solid it reads, how much it self-shades
const LOOK = {
  // (lc: the self-shadow's length — the share of the cloud's height that, solid, dims the light to 1 / e)
  cumulus: { s: 4.6, h: 10, a: 1, occ: 0.5, lc: 0.25 }, scud: { s: 3, h: 5, a: 0.92, occ: 0.35, lc: 0.3 },
  strato: { s: 3.4, h: 6, a: 0.95, occ: 0.42, lc: 0.3 }, alto: { s: 2.6, h: 4.5, a: 0.85, occ: 0.25, lc: 0.5 },
  cirrus: { s: 1.8, h: 2.2, a: 0.82, occ: 0, lc: 1 }, deck: { s: 3.2, h: 4, a: 1, occ: 0.5, lc: 1 },
};
const LUT = new Map();
function lutOf(sg) {
  let t = LUT.get(sg);
  if (!t) { t = new Float32Array(256); const m = 1 - Math.exp(-sg); for (let i = 0; i < 256; i++) t[i] = (1 - Math.exp(-sg * i / 255)) / m; LUT.set(sg, t); }
  return t;
}

/** THE LIGHT on one cloud: its cached shape → RGBA (time-sliced). Lt: core/harbor-clouds.js#cloudLit; G: #skyLight */
function* shadeField(d, F, G, Lt, img) {
  const { pw, ph, res } = F, D = img.data, lk = LOOK[d.kind] || LOOK.cumulus, aS = lutOf(lk.s), aH = lutOf(lk.h), T8 = F.t;
  const { lx, ly, lz, l2, rim, haze, farA, glow, glowK } = Lt;
  const sc = G.sunC, sk = G.sunK, at = G.ambTop, ab = G.ambBot, hz = G.hazeC, occK = lk.occ, alpha = lk.a * G.body * farA * (d.k == null ? 1 : clamp01(d.k * 1.15));
  const cir = d.kind === 'cirrus', deck = d.kind === 'deck';
  // THE SELF-SHADOW: from each pixel, a short march TOWARD the light through the cloud's own thickness (the optical depth) — the
  // far side + the bellies fall into shade, billows shade the ones behind them, and after sunset (the light from below) the bellies
  // glow while the tops go dark. Weighted by how much of the light lies in the screen's plane (a sun behind us lights the face).
  const w2d = Math.min(1, Math.hypot(lx, ly)), march = !cir && !deck && sk > 0.01 && w2d > 0.05;
  const nS = 12, stepPx = Math.max(1.2, Math.min(pw, ph) * 0.06), sx = l2[0] * stepPx, sy = l2[1] * stepPx;
  const tau = (stepPx / res) / Math.max(2, d.h * lk.lc) / 255;
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const i = py * pw + px, o = i * 4, t = T8[i];
      if (!t) { D[o + 3] = 0; continue; }
      const nx = F.nx[i] / 127, ny = F.ny[i] / 127, nz = F.nz[i] / 127, oc = F.oc[i] / 255;
      const ndl = nx * lx + ny * ly + nz * lz, wd = ndl > -0.32 ? (ndl + 0.32) / 1.32 : 0;
      const as = aS[t], a = as + (aH[t] - as) * wd * wd;
      let trans = 1;
      if (march) {
        let s = 0, qx = px + 0.5, qy = py + 0.5;
        for (let k = 0; k < nS; k++) { qx += sx; qy += sy; if (qx < 0 || qy < 0 || qx >= pw || qy >= ph) break; s += T8[(qy | 0) * pw + (qx | 0)]; }
        trans = 1 - w2d * (1 - Math.exp(-s * tau));
      } else if (!cir) trans = 1 - oc * occK;
      const dk = sk * trans * (0.32 + 0.68 * wd) * (cir ? 0.85 : 1);
      const up = 0.5 - 0.5 * ny, ak = 1 - 0.34 * oc * (cir ? 0 : 1), gk = glowK * (1 - up) * (0.45 + 0.55 * oc);
      const thin = 1 - as, rv = rim * thin * Math.sqrt(thin) * (Lt.back + 0.5 * Math.max(0, nx * l2[0] + ny * l2[1]));
      const tex = 1 + (F.det[i] - 128) / 128 * (deck ? 0.16 : 0.05);
      let r = ((at[0] * up + ab[0] * (1 - up)) * ak + sc[0] * (dk + rv) + glow[0] * gk) * tex;
      let g = ((at[1] * up + ab[1] * (1 - up)) * ak + sc[1] * (dk + rv) + glow[1] * gk) * tex;
      let b = ((at[2] * up + ab[2] * (1 - up)) * ak + sc[2] * (dk + rv) + glow[2] * gk) * tex;
      r += (hz[0] - r) * haze; g += (hz[1] - g) * haze; b += (hz[2] - b) * haze;
      // (a soft knee that keeps the hue: the brightest channel eases toward white, the others scale with it — a sunset's orange
      // stays orange, midday's white stays white, never a flat burnt patch)
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      if (mx > 214) { const k = (214 + 41 * (1 - Math.exp(-(mx - 214) / 41))) / mx; r *= k; g *= k; b *= k; }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = a * alpha * 255;
    }
    if (py % rowsOf(pw) === 0) yield;
  }
}

/** CIRRUS, drawn (not a noise field — fine filaments read crisp at phone size): two to four bundles of combed strands along the
 *  wind, each strand tapering at both ends, some hooking down at the downwind end (mares' tails); lit by the key light (they sit
 *  high: the first + last to catch the sun's colour), faint at night. One pass of strokes, re-drawn when the light moves. */
function cirrusCanvas(d, G, Lt, res) {
  const cv = document.createElement('canvas'), pw = Math.max(2, Math.ceil(d.w * res)), ph = Math.max(2, Math.ceil(d.h * res));
  cv.width = pw; cv.height = ph;
  const x = ctx2d(cv);
  if (!x) return cv;
  x.setTransform(res, 0, 0, res, 0, 0); x.lineCap = 'round';
  const R = rngFrom(`ci|${d.seed}`), w = d.w, h = d.h;
  const lit = clamp01(G.sunK * 0.8), base = [0, 1, 2].map(i => G.ambTop[i] * 0.55 + 255 * 0.45 * (G.body));
  let col = base.map((v, i) => v + (G.sunC[i] - v) * lit);
  if (Lt.glowK > 0.02) col = col.map((v, i) => v + Lt.glow[i] * Lt.glowK * 0.5);
  col = col.map((v, i) => Math.min(255, v + (G.hazeC[i] - v) * Lt.haze * 0.6));
  const cs = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`, A = G.body * Lt.farA * (0.75 + 0.25 * lit);
  const nb = 2 + Math.floor(R() * 3);
  for (let bi = 0; bi < nb; bi++) {
    const bx = w * (0.05 + R() * 0.35), by = h * (0.25 + R() * 0.5), ang = (R() - 0.5) * 0.22, L = w * (0.4 + R() * 0.45), bend = (R() - 0.5) * h * 0.5;
    const n = 6 + Math.floor(R() * 9), hook = R() < 0.6;
    for (let k = 0; k < n; k++) {
      const off = (R() - 0.5) * h * 0.32, l = L * (0.55 + R() * 0.45), s0 = R() * L * 0.25;
      const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca;
      const x0 = bx + ca * s0 + px * off, y0 = by + sa * s0 + py * off, x1 = x0 + ca * l, y1 = y0 + sa * l + bend * 0.4;
      const mx = (x0 + x1) / 2 + px * bend * 0.3, my = (y0 + y1) / 2 + py * bend * 0.3;
      const g = x.createLinearGradient(x0, y0, x1, y1), a = A * (0.16 + R() * 0.34);
      g.addColorStop(0, `rgba(${cs},0)`); g.addColorStop(0.25 + R() * 0.2, `rgba(${cs},${a.toFixed(3)})`); g.addColorStop(0.8, `rgba(${cs},${(a * 0.7).toFixed(3)})`); g.addColorStop(1, `rgba(${cs},0)`);
      x.strokeStyle = g;
      const lw = 0.35 + R() * 0.9;
      for (const [m, al] of [[3.2, 0.22], [1, 1]]) {
        x.globalAlpha = al; x.lineWidth = lw * m;
        x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, x1, y1);
        // (the hook: the downwind end curls down — a fall streak)
        if (hook && R() < 0.55) x.quadraticCurveTo(x1 + ca * h * 0.18, y1 + h * 0.08, x1 + ca * h * 0.1, y1 + h * (0.22 + R() * 0.12));
        x.stroke();
      }
    }
  }
  x.globalAlpha = 1;
  return cv;
}

/** one cloud baked at once (tests/integration/clouds-preview.html — every kind in every light; the scene bakes time-sliced) */
export function bakeCloud(d, G, box, res = 2, seed = 'pv') {
  if (d.kind === 'cirrus') return cirrusCanvas(d, G, cloudLit(G, d, d.x0, box), res);
  const N = noiseOf(seed), F = fieldOf(d.w, d.h, res);
  for (const _ of KINDS[d.kind](d, F, N, box)) { /* run it through */ }
  const Lt = cloudLit(G, d, d.x0, box), img = new ImageData(F.pw, F.ph);
  for (const _ of shadeField(d, F, G, Lt, img)) { /* run it through */ }
  const cv = document.createElement('canvas'); cv.width = F.pw; cv.height = F.ph;
  const x = ctx2d(cv); if (x) x.putImageData(img, 0, 0);
  return cv;
}

// ------------------------------------------------------------------ THE SKY'S CLOUDS
export function createClouds() {
  let W = 1, top = 0, roof = 200, HZ = 300, box = null, list = [], old = null, oldK = 0, planKey = '', jobs = [], born = 0, G = null, gKey = '';
  let extra = { grey: 0, dark: 0, base: 0 };              // (Part 9: set())
  let res = 1.8, N = null, epoch = 0, rr = 0, lastA = 0, lastT = 0, mix = null, t0Clock = 0, e0 = 0;
  const windX = LK => Math.sin(((LK.windDir == null ? 250 : LK.windDir)) * Math.PI / 180);
  const free = arr => { for (const d of arr || []) { if (d.cv) d.cv.width = 0; if (d.prev) d.prev.width = 0; d.cv = d.prev = null; d.F = null; } };
  function plan(LK, seed) {
    if (old) free(old);
    old = list.length && born ? list : null; oldK = old ? 1 : 0;
    if (!old) free(list);
    jobs = [];
    mix = cloudMix(LK, seed);
    list = cloudPlan(box, mix, seed);
    N = noiseOf(seed);
    // (the sprite's px per pt: the phone's own up to 2 — a deck or a far patch less: they are soft)
    for (const d of list) {
      const r = d.kind === 'deck' ? Math.min(res * 0.55, Math.sqrt(260000 / (d.w * d.h))) : d.kind === 'cirrus' || d.kind === 'strato' || d.kind === 'alto' ? res * 0.8 : res * (d.s < 0.3 ? 1 : 0.92);
      d.res = Math.max(0.4, r); d.lit = ''; d.cv = null; d.prev = null; d.fade = 1; d.xNow = -1e9;
      jobs.push({ d, gen: build(d) });
    }
    born = 0;
  }
  function* build(d, relight) {
    if (d.kind === 'cirrus') {
      const Lt = cloudLit(G, d, d.xNow > -1e8 ? d.xNow : d.x0, box), cv = cirrusCanvas(d, G, Lt, d.res);
      if (relight && d.cv) { if (d.prev) d.prev.width = 0; d.prev = d.cv; d.fade = 0; } else if (d.cv) d.cv.width = 0;
      d.cv = cv; d.lit = Lt.key; d.queued = false; return;
    }
    if (!d.F) { const F = fieldOf(d.w, d.h, d.res); yield* KINDS[d.kind](d, F, N, box); d.F = F; }
    const Lt = cloudLit(G, d, d.xNow > -1e8 ? d.xNow : d.x0, box), key = Lt.key;
    const img = new ImageData(d.F.pw, d.F.ph);
    yield* shadeField(d, d.F, G, Lt, img);
    const cv = document.createElement('canvas'); cv.width = d.F.pw; cv.height = d.F.ph;
    const x = ctx2d(cv);
    if (!x) { d.queued = false; return; }
    x.putImageData(img, 0, 0);
    if (relight && d.cv) { if (d.prev) d.prev.width = 0; d.prev = d.cv; d.fade = 0; }
    else if (d.cv) d.cv.width = 0;
    d.cv = cv; d.lit = key; d.queued = false;
  }
  function run(budget) {
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < budget) { const j = jobs[0]; if (j.gen.next().done) jobs.shift(); }
  }
  function drawSet(c, arr, k, tSec, LK, motion, part) {
    const wx = windX(LK), wind = LK.wind || 3;
    for (const d of arr) {
      // (the deck: a seamless tile, wrapping by its own width)
      const x = d.kind === 'deck' ? (() => { const v = (1.2 + Math.max(0, wind) * 0.9) * wx * d.v * (motion ? tSec : 0); return ((v % d.w) + d.w) % d.w - d.w; })() : driftX(d, motion ? tSec : 0, wind, wx, W);
      d.xNow = x;
      if (!d.cv || (part === 'back' ? d.s >= 0.5 : part === 'front' ? d.s < 0.5 : false)) continue;
      const by = d.y + (extra.base || 0), ty = by - d.h;
      const draw = (cv, a) => {
        if (a <= 0.004) return;
        c.globalAlpha = a;
        if (d.kind === 'deck') { for (const ox of [x, x + d.w]) if (ox < W && ox + d.w > 0) c.drawImage(cv, ox, -2 + (extra.base || 0) * 0.3, d.w, d.h); }
        else if (x < W && x + d.w > 0) c.drawImage(cv, x, ty, d.w, d.h);
      };
      if (d.prev && d.fade < 1) { draw(d.cv, k); draw(d.prev, k * (1 - d.fade)); }
      else draw(d.cv, k);
    }
  }
  /** how much cloud covers a point (0..1, from the baked shapes) — the sun glows through a thin edge (district/sun.js#through) */
  function coverAt(px, py) {
    let clear = 1;
    for (const d of list) {
      if (!d.F || !d.cv) continue;
      let x = d.xNow;
      const ty = d.kind === 'deck' ? -2 : d.y + (extra.base || 0) - d.h;
      if (d.kind === 'deck') x = x > px ? x - d.w : x + d.w <= px ? x + d.w : x;
      if (px < x || px >= x + d.w || py < ty || py >= ty + d.h) continue;
      const F = d.F, ix = Math.min(F.pw - 1, Math.floor((px - x) * F.res)), iy = Math.min(F.ph - 1, Math.floor((py - ty) * F.res));
      const lk = LOOK[d.kind] || LOOK.cumulus, a = lutOf(lk.s)[F.t[iy * F.pw + ix]] * lk.a * (G ? G.body : 1) * (d.k == null ? 1 : clamp01(d.k * 1.15));
      clear *= 1 - a;
    }
    return (1 - clear) * lastA;
  }
  // DT2 — THE SKY BEAMS CATCH THE CLOUDS (party nights): where a beam passes up through a cloud, the cloud lights in its colour — a
  // bright patch where it goes in at the belly, a softer glow up through its body (additive; a cached glow sprite per colour)
  const glows = new Map();
  function glowOf(col) {
    const key = col.map(v => v >> 3).join('.');
    let g = glows.get(key);
    if (!g) {
      if (glows.size > 16) { const k0 = glows.keys().next().value; glows.get(k0).width = 0; glows.delete(k0); }
      g = document.createElement('canvas'); g.width = g.height = 64;
      const x = ctx2d(g);
      if (x) { const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${col.map(v => Math.min(255, v + 40) | 0)},1)`); r.addColorStop(0.35, `rgba(${col.map(v => v | 0)},0.55)`); r.addColorStop(1, `rgba(${col.map(v => v | 0)},0)`); x.fillStyle = r; x.fillRect(0, 0, 64, 64); }
      glows.set(key, g);
    }
    return g;
  }
  function catchBeam(c, bx, yTop, yBot, col, a, gw) {
    if (a < 0.02) return;
    for (const d of list) {
      if (!d.F || !d.cv || d.kind === 'cirrus' || d.kind === 'deck') continue;
      const x = d.xNow, ty = d.y + (extra.base || 0) - d.h;
      if (bx < x || bx >= x + d.w || d.y < yTop || ty > yBot) continue;
      // the cloud's column at the beam: where it starts + ends, how thick
      const F = d.F, ix = Math.min(F.pw - 1, Math.floor((bx - x) * F.res));
      let r0 = -1, r1 = -1, sum = 0;
      for (let iy = 0; iy < F.ph; iy++) { const t = F.t[iy * F.pw + ix]; if (t > 50) { if (r0 < 0) r0 = iy; r1 = iy; sum += t; } }
      if (r0 < 0) continue;
      const y0 = ty + r0 / F.res, y1 = ty + r1 / F.res, hh = Math.max(3, y1 - y0), th = Math.min(1, sum / 255 / Math.max(1, r1 - r0 + 1));
      const g = glowOf(col), k = a * th * (G ? 0.5 + 0.5 * G.body : 1), rw = Math.max(gw * 0.42, 10);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, 0.55 * k); c.drawImage(g, bx - rw, y1 - hh * 0.55, rw * 2, hh * 0.9);
      c.globalAlpha = Math.min(1, 0.3 * k); c.drawImage(g, bx - rw * 1.6, y0 - hh * 0.15, rw * 3.2, hh * 1.3);
      c.restore();
    }
  }
  return {
    KINDS, catchBeam,
    /** W, the sky band: top (the safe top) .. roof (the skyline's median roof), HZ (the far quay's waterline); dpr: the phone's */
    resize(w, t, r, hz, dpr) {
      const nr = Math.min(2, Math.max(1, dpr || 1)) * 0.92;
      if (w !== W || Math.abs(r - roof) > 2 || t !== top || nr !== res) { W = w; top = t; roof = r; HZ = hz; res = nr; box = { W, top, roof, hz: HZ - 2 }; planKey = ''; }
    },
    /** Part 9: grey 0..1 (rain / snow skies), dark 0..1 (a storm), base (pt: a lower cloud base) — re-lit at once */
    set(o) { extra = { ...extra, ...o }; gKey = ''; },
    /** part: undefined = every cloud (the update + all of them); PART 6b's hook — 'back' (the update + the far half) then the sky
     *  messages, then 'front' (the near half only): skywriting drifting between the cloud layers */
    draw(c, fs, sunInfo, part) {
      const LK = fs.L;
      if (!box) return;
      if (part === 'front') { if (G && list.length) { drawSet(c, list, lastA, lastT, LK, fs.motion, 'front'); c.globalAlpha = 1; } return; }
      const lc = LK.local, blk = lc ? Math.floor(lc.h / 6) : 0;
      const cover = clamp01(LK.cloud || 0), lay = LK.cloudLayers;
      const seed = `${lc ? `${lc.y}-${lc.m}-${lc.d}-${blk}` : 'x'}|${Math.round(cover * 8)}|${lay ? `${Math.round(lay.lo * 4)}${Math.round(lay.mid * 4)}${Math.round(lay.hi * 4)}` : '-'}|${LK.rain > 0.05 || LK.storm ? 'w' : ''}`;
      if (lc) epoch = (((lc.h % 6) * 60 + lc.mi) * 60 + (lc.s || 0));
      if (seed !== planKey) { planKey = seed; t0Clock = fs.now; e0 = epoch; G = null; plan(LK, seed); }
      if (!list.length && !old) return;
      // THE LIGHT for the hour (re-shades only when it moves a step)
      const stops = harborSky(fs.P, LK), hzC = stops ? stops[2].slice(0, 3).map((v, i) => (v + stops[3][i]) / 2) : null;
      const party = fs.party && fs.party.on > 0.3 ? fs.party.on : 0;
      const g2 = skyLight(LK, { sun: sunInfo && sunInfo.x != null ? sunInfo : null, side: sunInfo ? sunInfo.side : 0, moon: fs.moonAt || null, party, palette: fs.party && fs.party.palette, horizon: hzC, deck: mix ? mix.deck : 0, extra });
      if (!G || g2.key !== gKey) { G = g2; gKey = g2.key; }
      // a few clouds a frame: is its own light still its bake's? (it drifts past the sun) — re-light in the background
      if (born) for (let k = 0; k < 3 && list.length; k++) {
        const d = list[rr++ % list.length];
        if (!d.cv || d.queued) continue;
        const key = cloudLit(G, d, d.xNow > -1e8 ? d.xNow : d.x0, box).key;
        if (key !== d.lit) { d.queued = true; jobs.push({ d, gen: build(d, true) }); }
      }
      run(born ? 1.2 : 10);
      if (!born && !jobs.length) born = performance.now();
      const now = performance.now(), dt = Math.min(100, fs.dt || 16);
      for (const d of list) if (d.prev && d.fade < 1) { d.fade = Math.min(1, d.fade + dt / 900); if (d.fade >= 1) { d.prev.width = 0; d.prev = null; } }
      const appear = born ? smooth(0, 1600, now - born) : 0;
      // (the time on the cloud field: seconds into this 6-hour block on the city's clock — every phone the same sky)
      const tSec = e0 + ((fs.now - t0Clock) / 1000);
      if (old) { oldK = Math.max(0, 1 - appear); drawSet(c, old, oldK, tSec, LK, fs.motion); if (oldK <= 0) { free(old); old = null; } }
      drawSet(c, list, appear, tSec, LK, fs.motion, part);
      lastT = tSec;
      c.globalAlpha = 1;
      lastA = appear;
      // the moon glowing through a cloud in front of it
      const m = fs.moonAt;
      if (m && (LK.w.night + LK.w.late) > 0.3) {
        const over = coverAt(m.x, m.y);
        if (over > 0.05) { const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5); g.addColorStop(0, `rgba(200,205,235,${(0.3 * over * (LK.moon.illum || 0.5)).toFixed(3)})`); g.addColorStop(1, 'rgba(200,205,235,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(m.x - m.r * 5, m.y - m.r * 5, m.r * 10, m.r * 10); c.globalCompositeOperation = 'source-over'; }
      }
    },
    coverAt,
    debug: () => ({
      clouds: list.length, kinds: list.map(d => d.kind), deck: list.some(d => d.kind === 'deck'), mix: mix ? Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(2) : v])) : null,
      lit: gKey, pending: jobs.length, born: !!born,
      mb: +list.reduce((s, d) => s + (d.cv ? d.cv.width * d.cv.height * 4 : 0) + (d.prev ? d.prev.width * d.prev.height * 4 : 0) + (d.F ? d.F.pw * d.F.ph * 6 : 0), 0).toFixed(0) / 1e6,
      at: list.map(d => ({ k: d.kind, x: Math.round(d.xNow), y: Math.round(d.y), w: Math.round(d.w), h: Math.round(d.h), s: +d.s.toFixed(2) })),
    }),
    destroy() { free(list); free(old); list = []; old = null; jobs = []; for (const g of glows.values()) g.width = 0; glows.clear(); },
  };
}
