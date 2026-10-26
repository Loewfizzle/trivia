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
import { cloudMix, cloudPlan, driftX, driftSpeed, skyLight, cloudLit, sunOnClouds, haloOf } from '../../core/harbor-clouds.js';
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
/** the shape's arrays at `res` px per pt: normals (Int8 ×3), thickness (t: the silhouette's alpha), depth below its top (oc),
 *  texture (det); a heap also has m — its thickness for the SELF-SHADOW, smooth through the lobes' edges inside the mass (SP: the
 *  silhouette's own profile drew a crease down the body wherever one lobe ended inside another) */
function fieldOf(w, h, res, heap) {
  const pw = Math.max(2, Math.ceil(w * res)), ph = Math.max(2, Math.ceil(h * res)), n = pw * ph;
  const F = { pw, ph, res, nx: new Int8Array(n), ny: new Int8Array(n), nz: new Int8Array(n), t: new Uint8Array(n), oc: new Uint8Array(n), det: new Uint8Array(n) };
  F.m = heap ? new Uint8Array(n) : F.t;
  return F;
}
const ROWS = 14;                                   // rows per time slice (a job yields between them; wide sprites fewer)
const rowsOf = pw => Math.max(2, Math.min(ROWS, Math.floor(5000 / pw)));

/** a heap (cumulus / scud): the lobes, in the sprite's pt — [cx, cy, r, squash (ry / r), zc]. A few BIG domes carry the form;
 *  many small billows on their upper silhouette + face make the cauliflower (blended smoothly: heapField) */
function heapLobes(R, w, h, tall, ragged) {
  const S = [], base = h * 0.9;
  // the towers: one main dome + one to three lesser ones beside it, at different heights (a skyline of domes, never even)
  const nT = 1 + (R() < 0.75 ? 1 : 0) + (R() < 0.45 ? 1 : 0) + (tall > 0.5 && R() < 0.4 ? 1 : 0);
  const towers = [{ u: 0.3 + R() * 0.4, ht: 1 }];
  for (let t = 1; t < nT; t++) { let u = 0.5; for (let g = 0; g < 6; g++) { u = 0.12 + R() * 0.76; if (towers.every(T => Math.abs(T.u - u) > 0.16)) break; } towers.push({ u, ht: 0.38 + R() * 0.42 }); }
  // the body: broad flattened masses along the base (one mass, never a string of beads)
  const nb = 3 + Math.floor(R() * 3);
  for (let i = 0; i < nb; i++) {
    // (SP: the outer masses rounder — a flat thin one at the end drew a pointed saucer rim on the base)
    const u = 0.16 + 0.68 * (i + 0.2 + R() * 0.6) / nb, r = w * (0.13 + R() * 0.06) * (1 - 0.5 * Math.abs(u - 0.5)), sq = 0.5 + R() * 0.12 + 0.36 * Math.abs(u - 0.5);
    S.push([w * u, base - r * sq * 0.62, r, sq, R() * r * 0.25]);
  }
  const mains = [];
  for (const T of towers) {
    const H = h * 0.86 * T.ht;
    // (SP: each dome its own size — never a row of equal domes)
    let r = Math.min(w * 0.21, H * 0.56) * (0.8 + R() * 0.32), y = base - r * 0.45, x = w * T.u;
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
      for (let g = 0, gn = ragged ? 0 : rc > pr * 0.24 ? 1 + (R() < 0.55 ? 1 : 0) : (R() < 0.4 ? 1 : 0); g < gn; g++) {
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
  if (ragged) for (const L of S) { L[3] *= 0.8; L[0] += (R() - 0.5) * L[2] * 0.5; }
  // fit inside the sprite: scale about the base's centre so every lobe's top + sides stay inside the margin
  const pad = Math.max(2, w * 0.04);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const [cx, cy, r, sq] of S) { x0 = Math.min(x0, cx - r); x1 = Math.max(x1, cx + r); y0 = Math.min(y0, cy - r * sq); }
  const k = Math.min((w - 2 * pad) / Math.max(1, x1 - x0), (base - pad) / Math.max(1, base - y0), 1.25), mx = (x0 + x1) / 2;
  const lobes = S.map(([cx, cy, r, sq, zc]) => [w / 2 + (cx - mx) * k, base - (base - cy) * k, r * k, sq, zc * k]);
  const rs = lobes.map(L => L[2]).sort((a, b) => a - b);
  return { lobes, base, rMed: rs[Math.floor(rs.length * 0.5)] || 10 };
}

/** M3 — A SMALL CLOUD (the owner: the little puffs "look cheap and fake"): never a little heap. A FRAGMENT (frag; the scud too) —
 *  a broken, uneven piece: lobes of every size strung along a wandering spine, thicker off-centre, a torn bit or two coming
 *  away; a WISP — the same, thinner + flatter, stretched. No towers, no row of three bumps, no flat base (heapField feathers it). */
function fragLobes(R, w, h, wisp) {
  const S = [], base = h * 0.92, n = (wisp ? 5 : 4) + Math.floor(R() * 4), pk = 0.6 + R() * 1.1;
  let x = w * (0.06 + R() * 0.1);
  const step = w * 0.86 / n;
  for (let i = 0; i < n && x < w * 0.95; i++) {
    const u = Math.max(0, Math.min(1, x / w)), env = Math.pow(Math.sin(Math.PI * Math.pow(u, pk)), 0.7);
    const r = h * (wisp ? 0.3 + R() * 0.26 : 0.34 + R() * 0.38) * (0.5 + 0.5 * env), sq = wisp ? 0.32 + R() * 0.16 : 0.42 + R() * 0.22;
    // (every lobe at its own height — the underside a ragged line, never one level cut)
    const cy = base - r * sq * (0.9 + R() * 1.6) - h * 0.12 * R();
    S.push([x, cy, r, sq, R() * r * 0.3]);
    if (R() < 0.38) S.push([x + (R() - 0.5) * r * 2.4, cy - r * sq * (0.3 + R() * 0.9), r * (0.28 + R() * 0.24), sq * 0.9, R() * r * 0.2]);
    x += step * (0.55 + R() * 0.9);
  }
  const pad = Math.max(2, w * 0.05);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const [cx, cy, r, sq] of S) { x0 = Math.min(x0, cx - r); x1 = Math.max(x1, cx + r); y0 = Math.min(y0, cy - r * sq); }
  const k = Math.min((w - 2 * pad) / Math.max(1, x1 - x0), (base - pad) / Math.max(1, base - y0), 1.3), mx = (x0 + x1) / 2;
  const lobes = S.map(([cx, cy, r, sq, zc]) => [w / 2 + (cx - mx) * k, base - (base - cy) * k, r * k, sq, zc * k]);
  const rs = lobes.map(L => L[2]).sort((a, b) => a - b);
  return { lobes, base, rMed: rs[Math.floor(rs.length * 0.5)] || 6 };
}
const isFrag = d => d.form === 'frag' || d.form === 'wisp' || d.kind === 'scud';

/** CUMULUS / SCUD: rasterise the lobes — a SMOOTH union (each pixel's normal the soft-max-weighted blend of the lobes it's on, so
 *  the billows merge with soft creases instead of hard seams), the thickness through them, noise for soft irregular edges */
/** STRATOCUMULUS: a patch of flat heaps merged into one lumpy mass — rounded masses of varied size on an uneven base, a few gaps,
 *  small billows on the bigger ones (the same engine as the cumulus: a smooth union, the self-shadow) */
function stratoLobes(R, w, h) {
  const S = [], base = h * 0.86, n = 10 + Math.floor(R() * 8);
  // (SP — a string of flattened beads read as sausages: the heaps overlap into one lumpy mass, of every size, a few gaps)
  let x = w * (0.04 + R() * 0.06);
  for (let i = 0; i < n && x < w * 0.96; i++) {
    const r = h * (0.28 + R() * 0.4) * (1 - 0.4 * Math.abs(x / w - 0.5) * 2), sq = 0.55 + R() * 0.3;
    const cy = base - r * sq * (0.4 + R() * 0.35);
    S.push([x, cy, r, sq, R() * r * 0.3]);
    // (SP: each heap lumpy — a few billows along its top, never a smooth bubble)
    for (let k = 0, nk = 2 + Math.floor(R() * 3); k < nk; k++) {
      const a = -Math.PI * (0.12 + 0.76 * (k + 0.2 + R() * 0.6) / nk), rc = r * (0.24 + R() * 0.16);
      const bx = x + Math.cos(a) * (r - rc * 0.55), by2 = cy + Math.sin(a) * (r * sq - rc * 0.55);
      if (by2 < base - rc * 0.3) S.push([bx, by2, rc, 0.92, r * 0.25 + R() * rc * 0.3]);
    }
    x += r * (0.42 + R() * 0.38) + (R() < 0.14 ? r * (0.5 + R() * 0.7) : 0);
  }
  const rs = S.map(L => L[2]).sort((a, b) => a - b);
  return { lobes: S, base, rMed: rs[Math.floor(rs.length * 0.5)] || 10 };
}
function* heapField(d, F, N) {
  const frag = isFrag(d), wisp = d.form === 'wisp', ragged = frag || d.form === 'fractus';
  const { pw, ph, res } = F, R = rngFrom(`heap|${d.seed}`), { lobes, base, rMed } = d.kind === 'strato' ? stratoLobes(R, d.w, d.h) : frag ? fragLobes(R, d.w, d.h, wisp || d.kind === 'scud') : heapLobes(R, d.w, d.h, d.tall || 0, ragged);
  const n = pw * ph, TK = new Float32Array(n), TM = new Float32Array(n), WS = new Float32Array(n), NX = new Float32Array(n), NY = new Float32Array(n), NZ = new Float32Array(n), NB = new Float32Array(n);
  // (M3: a fragment / wisp much more broken at its edges — torn, see-through in places)
  const fq = (frag ? 9 : 7) / Math.max(20, d.w), amp = frag ? (wisp ? 0.88 : 0.78) : ragged ? 0.62 : d.kind === 'strato' ? 0.46 : 0.36;
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) NB[py * pw + px] = N.fbm2(px / res * fq, py / res * fq, 4);
    if (py % (rowsOf(pw) * 3) === 0) yield;
  }
  let zTop = -1e9;
  for (const L of lobes) zTop = Math.max(zTop, L[4] + L[2]);
  // (SP: the domes melt into each other over a wider soft crease — a sharp one read as bubbles stuck together)
  const kS = 1 / Math.max(0.6, (d.kind === 'strato' ? 0.32 : 0.135) * rMed);
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
        TK[i] += 2 * r * qz; TM[i] += 2 * r * (1 - e) * (1 - e);
        const wgt = Math.exp(kS * (z - zTop)), nz0 = Math.sqrt(Math.max(0, 1 - d2)), ny0 = dy / sq, nl = Math.hypot(dx, ny0, nz0) || 1;
        WS[i] += wgt; NX[i] += wgt * dx / nl; NY[i] += wgt * ny0 / nl; NZ[i] += wgt * nz0 / nl;
      }
    }
    if (li % 6 === 5) yield;
  }
  // the finish: the blended normals (+ a soft bump from the noise), the flat uneven base, the depth below the column's top
  const tRef = Math.max(4, d.h * 0.5), bump = 1.5 * res, colTop = new Float32Array(pw).fill(ph);
  for (let px = 0; px < pw; px++) for (let py = 0; py < ph; py++) if (TK[py * pw + px] > tRef * 0.05) { colTop[px] = py; break; }
  const rawTop = Float32Array.from(colTop);
  // (SP: where the cloud's foot runs, end to end — its base curls up softly at both ends instead of a ruled cut)
  let xL = pw, xR = 0;
  for (let py = Math.floor(ph * 0.55); py < ph; py++) for (let px = 0; px < pw; px++) if (TK[py * pw + px] > tRef * 0.05) { if (px < xL) xL = px; if (px > xR) xR = px; }
  if (xR <= xL) { xL = 0; xR = pw - 1; }
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
      // (SP — the owner: "no flat grey slab bases": slightly flat but SOFT, UNEVEN (a slow wobble + a finer ragged one) and
      // curling up at its ends, so the base is lighter + thinner at the edges, never a hard horizontal cut)
      const st = d.kind === 'strato', u = (px - xL) / Math.max(1, xR - xL), endK = Math.pow(Math.min(1, Math.abs(2 * u - 1)), 2);
      // (the ends ROUNDED: within its own thickness of either tip the base curls up on a quarter circle of that thickness —
      // never the pointed rim a sloping top met a flat base in)
      const hc = Math.max(1, base * res - Math.min(rawTop[px], base * res)), toEnd = Math.min(px - xL, xR - px), qe = Math.max(0, 1 - toEnd / hc);
      const round = hc * 0.5 * (1 - Math.sqrt(Math.max(0, 1 - qe * qe))) / res;
      const by = (base - round - endK * d.h * (st ? 0.06 : frag ? 0.3 : 0.12) + (N.fbm2(px / res / Math.max(30, d.w) * (st ? 6 : frag ? 5 : 3.2), 3.7, 2) - 0.5) * (d.h * (st ? 0.22 : frag ? 0.4 : 0.1) + d.w * 0.012)
        + (N.fbm2(px / res * 0.07, 11.3, 2) - 0.5) * d.h * 0.035) * res;
      // (M3: a fragment / wisp / the scud has NO flat base — its underside feathers away over a third of its height)
      const soft = Math.max(1.6, d.h * (st ? 0.1 : frag ? 0.3 : 0.08) * res);
      const cut = frag ? 1 - 0.55 * smooth(base * res - d.h * 0.45 * res, base * res + d.h * 0.05 * res, py) - 0.3 * smooth(by - soft, by + soft, py) : 1 - smooth(by - soft, by + soft * 0.45, py);
      F.t[i] = Math.min(255, Math.round(TK[i] / tRef * 255 * cut));
      F.m[i] = Math.min(255, Math.round(TM[i] / tRef * 1.6 * 255 * cut));
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
  cumulus: { s: 4.6, h: 10, a: 1, occ: 0.5, lc: 0.25 }, scud: { s: 2.2, h: 3.6, a: 0.74, occ: 0.3, lc: 0.34 },
  // (M3: the small ones — thinner reads see-through; the same light as the big ones)
  frag: { s: 2.2, h: 4, a: 0.92, occ: 0.4, lc: 0.3 }, wisp: { s: 1.8, h: 2.8, a: 0.86, occ: 0.26, lc: 0.45 },
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
  const { pw, ph, res } = F, D = img.data, lk = LOOK[d.form === 'frag' || d.form === 'wisp' ? d.form : d.kind] || LOOK.cumulus, aS = lutOf(lk.s), aH = lutOf(lk.h), T8 = F.t, M8 = F.m || F.t;
  const { lx, ly, lz, l2, rim, haze, farA, glow, glowK } = Lt;
  // (6b: a HEAP cloud's body is OPAQUE at any hour — nothing behind it shows through, only its thin edges; the layer clouds thin at night)
  const sc = G.sunC, sk = G.sunK, at = G.ambTop, ab = G.ambBot, hz = G.hazeC, occK = lk.occ, alpha = lk.a * (KINDS[d.kind] === heapField ? 1 : G.body) * farA * (d.k == null ? 1 : clamp01(d.k * 1.15));
  const cir = d.kind === 'cirrus', deck = d.kind === 'deck';
  // (SP: the scud under a deck is darker than the deck — low, wet, ragged fragments in its shade)
  // (M3: a little lighter than before — it melts into the deck instead of floating in front of it as a dark cut-out)
  const scudK = d.kind === 'scud' ? 0.92 - 0.08 * G.grey : 1;
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
        for (let k = 0; k < nS; k++) { qx += sx; qy += sy; if (qx < 0 || qy < 0 || qx >= pw || qy >= ph) break; s += M8[(qy | 0) * pw + (qx | 0)]; }
        trans = 1 - w2d * (1 - Math.exp(-s * tau));
      } else if (!cir) trans = 1 - oc * occK;
      const dk = sk * trans * (0.32 + 0.68 * wd) * (cir ? 0.85 : 1);
      // (SP: the shade low in the cloud only where it is thick — a thin end or edge of the base stays light)
      const up = 0.5 - 0.5 * ny, ak = 1 - 0.34 * oc * (cir ? 0 : 0.4 + 0.6 * Math.min(1, t / 170)), gk = glowK * (1 - up) * (0.45 + 0.55 * oc);
      const thin = 1 - as, rv = rim * thin * Math.sqrt(thin) * (Lt.back + 0.5 * Math.max(0, nx * l2[0] + ny * l2[1]));
      const tex = (1 + (F.det[i] - 128) / 128 * (deck ? 0.16 : 0.05)) * scudK;
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

// ------------------------------------------------------------------ CIRRUS (SP — the owner: "awesome idea, not there yet")
// High ice cloud, DRAWN (fine fibres read crisp at phone size; a noise field was blurry): each patch is a small GROUP of wisps —
//   FIBRATUS  a long bundle of fine fibres combed along a gently curved backbone, clumped into sub-bundles that wander, frayed +
//             fanning at both ends
//   UNCINUS   a mares' tail: a dense hooked head (the highest point, downwind) and the fall streak trailing back + down from it,
//             spreading and thinning to nothing
//   TUFT      a short dense brush of fibres (spissatus / floccus)
// over a soft body (the same backbones, wide + faint, drawn small and scaled up: silky, never a hard band); on a hazy high day a
// CIRROSTRATUS veil — thin, milky, a few faint fibres. Never ruler-straight, never evenly spaced, never a parallel stack.
// Semi-transparent (the blue shows through). THE LIGHT: the highest cloud — white by day, the FIRST to catch a sunset's gold +
// pink and the last to lose it; at night barely there, a faint silver when the moon is up.
const gauss = R => (R() + R() + R() - 1.5) / 0.75;
function cirrusWisps(R, w, h, flip) {
  const out = [], n = Math.max(2, Math.min(5, Math.round(1.6 + w / 150 + R() * 1.4))), tilt = (R() - 0.5) * 0.16;
  for (let i = 0, tries = 0; i < n && tries < 30; tries++) {
    const r = R(), type = i === 0 ? (R() < 0.5 ? 'unc' : 'fib') : r < 0.32 ? 'unc' : r < 0.8 ? 'fib' : 'tuft';
    const L = w * (type === 'tuft' ? 0.13 + R() * 0.12 : type === 'unc' ? 0.38 + R() * 0.34 : 0.55 + R() * 0.4);   // (6b: longer strands)
    const th = tilt + gauss(R) * 0.12 + (type === 'unc' ? 0.04 : 0);
    const x0 = R() * Math.max(1, w - L * 0.95) + L * 0.02, y0 = h * (0.3 + R() * 0.5);
    // (never a parallel stack: a wisp at about the same angle right over another moves on)
    if (out.some(o => Math.abs(o.th - th) < 0.07 && Math.abs(o.y0 - y0) < h * 0.2 && Math.min(o.x0 + o.L, x0 + L) - Math.max(o.x0, x0) > 0.4 * Math.min(o.L, L))) continue;
    const dx = Math.cos(th), dy = Math.sin(th), px = -dy, py = dx;
    let P;
    if (type === 'unc') {
      // the tail (upwind, lower) → nearly level → curling UP into the hook at the downwind end
      const up = L * (0.1 + R() * 0.12), sag = L * (0.02 + R() * 0.04);
      P = [[x0, y0 + up * 0.35], [x0 + dx * L * 0.45, y0 + up * 0.35 + sag + dy * L * 0.45], [x0 + dx * L * 0.88, y0 + dy * L * 0.88 + up * 0.15], [x0 + dx * L, y0 + dy * L - up * 0.65]];
    } else {
      const c1 = (R() - 0.5) * L * 0.22, c2 = (R() - 0.5) * L * 0.22;
      P = [[x0, y0], [x0 + dx * L / 3 + px * c1, y0 + dy * L / 3 + py * c1], [x0 + dx * L * 2 / 3 + px * c2, y0 + dy * L * 2 / 3 + py * c2], [x0 + dx * L, y0 + dy * L]];
    }
    if (flip) P = P.map(([x, y]) => [w - x, y]);
    out.push({ type, L, th, x0, y0, P });
    i++;
  }
  return out;
}
/** the backbone as a polyline: points + unit normals, by its parameter */
function backbone(P, M = 48) {
  const pts = [];
  for (let i = 0; i <= M; i++) {
    const t = i / M, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    pts.push([a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]);
  }
  const nrm = pts.map((p, i) => { const q = pts[Math.min(M, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  return { at(s) { const f = Math.max(0, Math.min(1, s)) * M, i = Math.min(M - 1, Math.floor(f)), k = f - i, A = pts[i], B = pts[i + 1], NA = nrm[i], NB = nrm[i + 1]; return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, NA[0] + (NB[0] - NA[0]) * k, NA[1] + (NB[1] - NA[1]) * k]; } };
}
/** the cirrus's colour + strength for the hour: they sit ~9 km up — lit a few degrees longer than the street and REDDER after sunset */
function cirrusLight(G, Lt) {
  const el = G.el == null ? 30 : G.el, moon = G.src && G.src.moon;
  // (the sun on them: the clouds' own curve, a little further on; its strength holds until the sun is ~6° down)
  let key = sunOnClouds(el + 0.9), k = smooth(-7.5, -3.5, el) * (0.85 + 0.15 * smooth(-2, 8, el)) * (1 - 0.85 * G.grey);
  if (moon) { key = [200, 210, 240]; k = Math.max(k, G.sunK * 0.9); }
  const amb = G.ambTop.map((v, i) => v * 0.6 + G.ambBot[i] * 0.4);
  let col = amb.map((v, i) => v * (1 - k) * 0.7 + key[i] * k + (moon ? 0 : 255 * 0.08 * k));
  if (Lt.glowK > 0.02) col = col.map((v, i) => v + Lt.glow[i] * Lt.glowK * 0.35);
  col = col.map((v, i) => Math.min(255, v + (G.hazeC[i] - v) * Lt.haze * 0.5));
  // (how much they show: a full light by day + at sunset; at night only what the moon gives them, faint)
  const night = G.shares ? G.shares.night + G.shares.blue * 0.5 : 0;
  // (a low sun — golden hour, sunset, the first minutes after — they GLOW: the brightest thing in the sky over a darkening city)
  const glowLow = moon ? 0 : k * smooth(9, 1, el) * (1 - G.grey);
  const A = Lt.farA * (moon ? 0.25 + 0.5 * G.sunK : 0.12 + 0.88 * Math.max(k, 1 - night)) * (0.6 + 0.4 * G.body) * (1 + 0.7 * glowLow);
  if (glowLow > 0) col = col.map((v, i) => Math.min(255, v + (key[i] - v) * 0.35 * glowLow + 18 * glowLow));
  return { col, A };
}
function* cirrusGen(d, G, Lt, res, out, flip) {
  const pw = Math.max(2, Math.ceil(d.w * res)), ph = Math.max(2, Math.ceil(d.h * res));
  const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
  const x = ctx2d(cv);
  if (!x) { out.cv = cv; return; }
  const R = rngFrom(`ci2|${d.seed}`), w = d.w, h = d.h, { col, A } = cirrusLight(G, Lt), cs = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`;
  // the soft body: drawn small and scaled up — silky, no edge
  const LR = 0.16, lw = Math.max(2, Math.ceil(pw * LR)), lh = Math.max(2, Math.ceil(ph * LR));
  const lo = document.createElement('canvas'); lo.width = lw; lo.height = lh;
  const y = ctx2d(lo);
  if (y) { y.setTransform(res * LR, 0, 0, res * LR, 0, 0); y.lineCap = 'round'; y.lineJoin = 'round'; }
  x.setTransform(res, 0, 0, res, 0, 0); x.lineCap = 'round'; x.lineJoin = 'round';
  if (d.veil && y) {
    // CIRROSTRATUS: a thin milky veil — broad soft sheets drifting with the wind, thinner + thicker in long bands
    for (let i = 0; i < 9; i++) {
      const cx = R() * w, cy = h * (0.15 + R() * 0.7), rx = w * (0.25 + R() * 0.3), ry = h * (0.12 + R() * 0.2);
      const g = y.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, `rgba(${cs},${(0.22 * d.veil).toFixed(3)})`); g.addColorStop(0.55, `rgba(${cs},${(0.1 * d.veil).toFixed(3)})`); g.addColorStop(1, `rgba(${cs},0)`);
      y.save(); y.translate(cx, cy); y.rotate((R() - 0.5) * 0.12); y.scale(1, ry / rx); y.translate(-cx, -cy); y.fillStyle = g; y.fillRect(cx - rx, cy - rx, rx * 2, rx * 2); y.restore();
    }
  }
  const wisps = d.veil ? cirrusWisps(R, w, h, flip).slice(0, 2) : cirrusWisps(R, w, h, flip);
  for (const wp of wisps) {
    const B = backbone(wp.P), L = wp.L, unc = wp.type === 'unc', tuft = wp.type === 'tuft';
    const dens = d.veil ? 0.45 : 1;
    // the body: the backbone wide + faint (a mares' tail's head a little denser)
    if (y) {
      const bw = (tuft ? h * 0.09 : unc ? h * 0.08 : h * 0.1);
      for (const [mul, a] of [[3.2, 0.075], [1.6, 0.11]]) {          // (6b: softer — a wider, stronger silky body under the fibres)
        y.lineWidth = bw * mul;
        const a0 = B.at(0), a1 = B.at(1), g = y.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
        g.addColorStop(0, `rgba(${cs},0)`); g.addColorStop(unc ? 0.45 : 0.3, `rgba(${cs},${(a * dens).toFixed(3)})`); g.addColorStop(unc ? 0.92 : 0.72, `rgba(${cs},${(a * dens * (unc ? 1.5 : 1)).toFixed(3)})`); g.addColorStop(1, `rgba(${cs},0)`);
        y.strokeStyle = g; y.beginPath();
        for (let i = 0; i <= 24; i++) { const p = B.at(i / 24); if (i) y.lineTo(p[0], p[1]); else y.moveTo(p[0], p[1]); }
        y.stroke();
      }
    }
    // THE FIBRES: clumped into a few sub-bundles that wander across the wisp (gaps between them), each fibre its own length,
    // wobble and brightness; fraying at the ends (a mares' tail: all from the head, spreading + thinning down the streak)
    const nb = 2 + Math.floor(R() * 4), bund = Array.from({ length: nb }, () => ({ o: gauss(R) * (tuft ? 0.32 : 0.45), wd: 0.08 + R() * 0.18, ph: R() * 6.3, f: 0.4 + R() * 0.9, am: (R() - 0.5) * 0.4 }));
    const width = (tuft ? h * 0.24 : unc ? h * 0.16 : h * 0.2) * (0.75 + R() * 0.5);
    const nS = Math.round(Math.min(80, (tuft ? 26 : 22) + L / 5) * (d.veil ? 0.5 : 1));
    for (let k = 0; k < nS; k++) {
      const b = bund[Math.floor(R() * nb)], off = b.o + gauss(R) * b.wd;
      let sa, sb;
      if (unc) { sb = 0.9 + R() * 0.1; sa = Math.pow(R(), 0.7) * 0.75; }
      else { sa = Math.pow(R(), 1.6) * 0.38; sb = 1 - Math.pow(R(), 1.6) * 0.38; }
      if (sb - sa < 0.12) continue;
      const wob = (R() - 0.5) * width * 0.14, wf = 0.5 + R() * 1.1, wp0 = R() * 6.3;
      const a = A * dens * (0.05 + 0.15 * Math.pow(R(), 1.4)) * (R() < 0.06 ? 1.6 : 1);   // (6b: lower contrast, more diffusion)
      const lwPx = 0.7 + Math.pow(R(), 2.2) * 1.4;
      const K = Math.max(6, Math.min(40, Math.round((sb - sa) * L / 5)));
      x.beginPath();
      let fx0 = 0, fy0 = 0, fx1 = 0, fy1 = 0;
      for (let j = 0; j <= K; j++) {
        const s = sa + (sb - sa) * j / K, [bx, by, nx, ny] = B.at(s);
        // (the spread: a fibratus frays wider at both ends; a mares' tail widens + droops away from its head)
        const spread = unc ? 0.35 + 1.15 * Math.pow(1 - s, 1.2) : tuft ? 0.8 + 0.5 * Math.abs(2 * s - 1) : 0.62 + 0.75 * Math.pow(Math.abs(2 * s - 1), 1.5);
        const wander = b.am * Math.sin(s * b.f * 6.3 + b.ph) * width * 0.3;
        const o = (off * spread * width) + wander + wob * Math.sin(s * wf * 6.3 + wp0);
        const droop = unc ? Math.pow(1 - s, 2) * width * 0.5 : 0;
        const px = bx + nx * o, py = by + ny * o + droop;
        if (j) x.lineTo(px, py); else { x.moveTo(px, py); fx0 = px; fy0 = py; }
        fx1 = px; fy1 = py;
      }
      const g = x.createLinearGradient(fx0, fy0, fx1, fy1), pk = unc ? 0.75 + R() * 0.2 : 0.2 + R() * 0.45;
      g.addColorStop(0, `rgba(${cs},0)`); g.addColorStop(pk * 0.7, `rgba(${cs},${(a * 0.85).toFixed(3)})`); g.addColorStop(pk, `rgba(${cs},${a.toFixed(3)})`); g.addColorStop(Math.min(0.97, pk + 0.18), `rgba(${cs},${(a * 0.7).toFixed(3)})`); g.addColorStop(1, `rgba(${cs},0)`);
      x.strokeStyle = g; x.lineWidth = lwPx / res; x.stroke();
    }
    yield;
  }
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (y) { x.globalCompositeOperation = 'destination-over'; x.imageSmoothingEnabled = true; x.globalAlpha = Math.min(1, A * 1.1); x.drawImage(lo, 0, 0, pw, ph); x.globalAlpha = 1; }
  lo.width = 0;
  // (the sprite's own edges feathered away: a wisp running off its box fades, never a cut line or a faint rectangle)
  x.globalCompositeOperation = 'destination-out';
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, pw * 0.07, 0, 0, 0, pw * 0.07, ph], [pw, 0, pw * 0.93, 0, pw * 0.93, 0, pw * 0.07 + 1, ph], [0, 0, 0, ph * 0.12, 0, 0, pw, ph * 0.12], [0, ph, 0, ph * 0.88, 0, ph * 0.88, pw, ph * 0.12 + 1]]) {
    const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(rx, ry, rw, rh);
  }
  x.globalCompositeOperation = 'source-over';
  out.cv = cv;
}

/** one cloud baked at once (tests/integration/clouds-preview.html — every kind in every light; the scene bakes time-sliced) */
export function bakeCloud(d, G, box, res = 2, seed = 'pv', flip = false) {
  if (d.kind === 'cirrus') { const o = {}; for (const _ of cirrusGen(d, G, cloudLit(G, d, d.x0, box), res, o, flip)) { /* run it through */ } return o.cv; }
  const N = noiseOf(seed), F = fieldOf(d.w, d.h, res, KINDS[d.kind] === heapField);
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
  let res = 1.8, N = null, epoch = 0, rr = 0, lastA = 0, lastT = 0, mix = null, t0Clock = 0, e0 = 0, windSgn = 1;
  // (POLISH 5 — THE LOAD: the plans made (the load log names each), the new set's fade (1.6 s; SLOW_MS once the city has shown —
  // the weather landing, a new block: a slow blend, never a pop) and whether the scene has settled the first set (settle()))
  let plans = 0, appearMs = 1600, shown = false;
  let thinB = null, thinK = 0;                            // (POLISH 5: a sky message's box — the clouds over it thin to a quarter while it is up)
  const SLOW_MS = 6000;
  // (the readout: what the clouds cost a frame — the draw + the background jobs — and how often a cloud is re-lit)
  const perf = { ms: 0, jobMs: 0, n: 0, relit: 0, beamMs: 0, hitMs: 0, renders: 0, patches: 0 };
  const windX = LK => Math.sin(((LK.windDir == null ? 250 : LK.windDir)) * Math.PI / 180);
  const free = arr => { for (const d of arr || []) { if (d.cv) d.cv.width = 0; if (d.prev) d.prev.width = 0; d.cv = d.prev = null; d.F = null; } };
  function plan(LK, seed, motion) {
    if (old) free(old);
    old = list.length && born ? list : null; oldK = old ? 1 : 0;
    plans++; appearMs = old && shown ? SLOW_MS : 1600;
    if (!old) free(list);
    jobs = [];
    mix = cloudMix(LK, seed);
    list = cloudPlan(box, mix, seed);
    N = noiseOf(seed);
    // (the sprite's px per pt: the phone's own up to 2 — a deck or a far patch less: they are soft)
    for (const d of list) {
      // (SP: the cirrus at the phone's own resolution — their fibres are a pixel wide; the veil half: it is soft)
      const r = d.kind === 'deck' ? Math.min(res * 0.55, Math.sqrt(260000 / (d.w * d.h))) : d.kind === 'cirrus' ? res * (d.veil ? 0.6 : 0.78) : d.kind === 'strato' || d.kind === 'alto' ? res * 0.8 : res * (d.s < 0.3 ? 1 : 0.92);
      // (SP — the cloudy party's cost: each cloud's first bake is lit where it IS now — it has drifted since the 6-hour block began;
      // baking it at its starting place re-lit every cloud a second time the moment the sky appeared)
      d.res = Math.max(0.4, r); d.lit = ''; d.cv = null; d.prev = null; d.fade = 1;
      d.xNow = d.kind === 'deck' ? 0 : driftX(d, motion ? e0 : 0, LK.wind || 3, windX(LK), W);
      jobs.push({ d, gen: build(d) });
    }
    born = 0;
  }
  function* build(d, relight) {
    if (d.kind === 'cirrus') {
      const Lt = cloudLit(G, d, d.xNow > -1e8 ? d.xNow : d.x0, box), o = {};
      yield* cirrusGen(d, G, Lt, d.res, o, windSgn < 0);
      if (relight && d.cv) { if (d.prev) d.prev.width = 0; d.prev = d.cv; d.fade = 0; } else if (d.cv) d.cv.width = 0;
      d.cv = o.cv; d.lit = Lt.key; d.queued = false; return;
    }
    if (!d.F) { const F = fieldOf(d.w, d.h, d.res, KINDS[d.kind] === heapField); yield* KINDS[d.kind](d, F, N, box); d.F = F; }
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
      const x = d.kind === 'deck' ? (() => { const v = driftSpeed(wind) * wx * d.v * (motion ? tSec : 0); return ((v % d.w) + d.w) % d.w - d.w; })() : driftX(d, motion ? tSec : 0, wind, wx, W);
      d.xNow = x;
      if (!d.cv || (part === 'back' ? d.s >= 0.5 : part === 'front' ? d.s < 0.5 : false)) continue;
      const by = d.y + (extra.base || 0), ty = by - d.h;
      // (POLISH 5 — CLOUDS NEVER COVER A MESSAGE: a cloud over the message's letters thins out, white dots never sit on a white cloud)
      const tb = thinB && thinK > 0 && part !== 'front' ? thinB : null, over = tb && x < tb.x + tb.w && x + d.w > tb.x && by - d.h < tb.y + tb.h && by > tb.y;
      const thin = over ? 1 - 0.75 * thinK : 1;
      const draw = (cv, a) => {
        a *= thin;
        if (a <= 0.004) return;
        c.globalAlpha = a;
        if (d.kind === 'deck') { for (const ox of [x, x + d.w]) if (ox < W && ox + d.w > 0) c.drawImage(cv, ox, -2 + (extra.base || 0) * 0.3, d.w, d.h); }
        else if (x < W && x + d.w > 0) {
          // (6b — CLOUDS EVOLVE: each heap / patch slowly SWELLS + changes its shape (wider, taller, on its own slow clocks, anchored at
          // its base) and THINS + RE-FORMS over minutes — a pure function of the sky's clock, every phone the same; never the deck/veil)
          const ev = evolve(d, tSec, motion);
          if (ev.a < 1) c.globalAlpha = a * ev.a;
          if (ev.sx !== 1 || ev.sy !== 1) { const w2 = d.w * ev.sx, h2 = d.h * ev.sy; c.drawImage(cv, x - (w2 - d.w) / 2, ty - (h2 - d.h), w2, h2); }
          else c.drawImage(cv, x, ty, d.w, d.h);
        }
      };
      if (d.prev && d.fade < 1) { draw(d.cv, k); draw(d.prev, k * (1 - d.fade)); }
      else draw(d.cv, k);
    }
  }
  function evolve(d, t, motion) {
    if (!motion || d.kind === 'deck' || d.veil) return { sx: 1, sy: 1, a: 1 };
    const h = (((d.z || 0) * 2654435761) >>> 0) / 4294967296, small = d.form === 'frag' || d.form === 'wisp' || d.kind === 'scud';
    const sx = 1 + 0.05 * Math.sin(t / (260 + h * 320) + h * 6.3), sy = 1 + (d.kind === 'cumulus' ? 0.09 : 0.04) * Math.sin(t / (210 + h * 280) + h * 4.1);
    // (a life: most of the time whole, now and then thinning away + forming again — the small ones go further)
    const life = 0.5 + 0.5 * Math.sin(t / (480 + h * 600) + h * 9.7), floor = small ? 0.15 : 0.6;
    return { sx, sy, a: floor + (1 - floor) * smooth(0.05, 0.6, life) };
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
      const lk = LOOK[d.kind] || LOOK.cumulus, a = lutOf(lk.s)[F.t[iy * F.pw + ix]] * lk.a * (G && KINDS[d.kind] !== heapField ? G.body : 1) * (d.k == null ? 1 : clamp01(d.k * 1.15));
      clear *= 1 - a;
    }
    return (1 - clear) * lastA;
  }
  // the beams' glow sprites: one per colour (cached)
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
  // SP — BEAMS IN THE CLOUDS (the owner: "the light beams kind of go through them — it doesn't look right"): light meeting a cloud
  // doesn't pass as if it weren't there. rayHit finds where a beam (a party sky beam, a sweeping searchlight) first goes INTO a
  // cloud and how much of it gets through (the cloud's own thickness along the beam); the beam's owner draws it bright up to the
  // cloud and dimmed beyond (thin cloud: it shows through, faint), and beamPatch lights the cloud's underside there — a bright
  // soft patch in the beam's colour where it goes in, the glow scattering up through the body, the light spreading along the belly.
  // Cheap: a short march (≤ 40 samples) through the baked shapes of the few clouds the beam crosses; a few additive sprites.
  /** a beam from (x, y) along the unit (ux, uy) for len pt → the nearest cloud it goes into: { d (pt along the beam), x, y (where
   *  it goes in), dOut (where it comes out), trans (0 thick … 1 none of it stops the beam), th (0..1 how thick), cl (the cloud),
   *  next (the next cloud beyond it, the same shape, when any of the beam gets through) } | null */
  function rayHit(x, y, ux, uy, len) {
    const b0 = performance.now();
    const h = rayHit0(x, y, ux, uy, len);
    perf.beamMs += performance.now() - b0; perf.hitMs += performance.now() - b0;
    return h;
  }
  function rayHit0(x, y, ux, uy, len) {
    const hits = [];
    const x2 = x + ux * len, y2 = y + uy * len;
    for (const d of list) {
      // (a cloud low on the screen — just over the crowns — is far BEYOND the city: a beam rising from a crown passes in front of
      // it; only the clouds up over the city, the upper half of the sky, are where the beams really go)
      if (!d.F || !d.cv || d.kind === 'cirrus' || d.kind === 'deck' || d.s < 0.42) continue;
      const cx = d.xNow, ty = d.y + (extra.base || 0) - d.h;
      if (Math.max(x, x2) < cx || Math.min(x, x2) > cx + d.w || Math.max(y, y2) < ty || Math.min(y, y2) > d.y) continue;
      // the beam's span inside this cloud's box (a segment against a box)
      let t0 = 0, t1 = len;
      for (const [p, u, lo, hi] of [[x, ux, cx, cx + d.w], [y, uy, ty, d.y]]) {
        if (Math.abs(u) < 1e-6) { if (p < lo || p > hi) { t0 = 1; t1 = 0; } continue; }
        let a0 = (lo - p) / u, a1 = (hi - p) / u; if (a0 > a1) [a0, a1] = [a1, a0];
        t0 = Math.max(t0, a0); t1 = Math.min(t1, a1);
      }
      if (t1 <= t0) continue;
      const F = d.F, n = Math.min(40, Math.max(6, Math.ceil((t1 - t0) / 2))), dt = (t1 - t0) / n;
      let dIn = -1, dOut = -1, sum = 0;
      for (let k = 0; k <= n; k++) {
        const tt = t0 + k * dt, px = Math.floor((x + ux * tt - cx) * F.res), py = Math.floor((y + uy * tt - ty) * F.res);
        if (px < 0 || py < 0 || px >= F.pw || py >= F.ph) continue;
        const v = F.t[py * F.pw + px];
        if (v > 40) { if (dIn < 0) dIn = tt; dOut = tt; sum += v / 255 * dt; }
      }
      if (dIn < 0) continue;
      const trans = Math.exp(-sum / 9), th = 1 - trans;
      hits.push({ d: dIn, x: x + ux * dIn, y: y + uy * dIn, dOut, trans: Math.max(0.06, trans), th, w: d.w, cl: d, next: null });
    }
    if (!hits.length) return null;
    hits.sort((a, b) => a.d - b.d);
    // (the beam goes on past a thin cloud: the next one it meets catches what is left of it)
    const first = hits[0], second = first.trans > 0.25 ? hits.find(h => h.d > first.dOut + 2) : null;
    if (second) first.next = second;
    return first;
  }
  /** the cloud lit where a beam goes in (hit: rayHit's): additive, in the beam's colour, ONLY ON THE CLOUD (the glows are masked by
   *  the cloud's own sprite in a small scratch canvas — the light never spills onto the clear sky round it); a: the beam's
   *  strength, gw: its width, (ux, uy): its direction */
  // (each patch is rendered once and kept while it lands on the same point of the same cloud — a drifting cloud moves it a point
  // every few frames; the beat's brightness is only the alpha it is drawn with)
  const patches = new Map(), pool = [];          // (evicted patches' canvases, reused: no canvas churn on a phone)
  function beamPatch(c, h, col, a, gw, ux = 0, uy = -1) {
    const d = h && h.cl;
    if (!d || !d.cv || a < 0.02) return;
    const b0 = performance.now();
    const k = a * (G ? 0.6 + 0.4 * G.body : 1), th = h.th, span = Math.max(4, h.dOut - h.d);
    const rw = Math.max(gw * 0.7, 14), cx = d.xNow, ty = d.y + (extra.base || 0) - d.h;
    const q2 = v => Math.round(v / 2) * 2;
    const key = `${d.seed}|${q2(h.x - cx)}|${q2(h.y - ty)}|${Math.round(span / 3)}|${col.map(v => v >> 5).join('.')}|${Math.round(rw / 2)}|${Math.round(th * 8)}|${Math.round(ux * 20)}`;
    let P = patches.get(key);
    if (!P) {
      P = renderPatch(d, h, col, th, span, rw, ux, uy, cx, ty); perf.renders++;
      if (patches.size > 28) { const k0 = patches.keys().next().value, o = patches.get(k0); if (o && o.cv) { if (pool.length < 10) pool.push(o.cv); else o.cv.width = 0; } patches.delete(k0); }
      patches.set(key, P);
    } else { patches.delete(key); patches.set(key, P); }
    if (P.cv) {
      perf.patches++;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, k * 1.35);
      c.drawImage(P.cv, 0, 0, P.w, P.h, cx + P.ox, ty + P.oy, P.w, P.h);
      c.restore();
    }
    perf.beamMs += performance.now() - b0;
  }
  function renderPatch(d, h, col, th, span, rw, ux, uy, cx, ty) {
    const g = glowOf(col), ex = h.x + ux * span * 0.55, ey = h.y + uy * span * 0.55;
    // the patch's box, inside the cloud's
    const x0 = Math.max(cx, Math.min(h.x, ex) - rw * 2.8), x1 = Math.min(cx + d.w, Math.max(h.x, ex) + rw * 2.8);
    const y0 = Math.max(ty, Math.min(h.y, ey) - Math.max(rw, span * 0.7)), y1 = Math.min(d.y, h.y + rw * 0.6);
    const bw = Math.ceil(x1 - x0), bh = Math.ceil(y1 - y0);
    if (bw < 2 || bh < 2) return { cv: null };
    const cv = pool.pop() || document.createElement('canvas');
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const s = ctx2d(cv);
    if (!s) return { cv: null };
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1; s.clearRect(0, 0, bw, bh);
    s.translate(-x0, -y0);
    // where it goes in: the underside lit bright — wider than the beam (the light spreads inside the cloud); the light running
    // along the belly; the glow scattering up through the body (a thin cloud: the beam itself shows through instead)
    s.globalAlpha = Math.min(1, 1.1 * (0.35 + 0.65 * th)); s.drawImage(g, h.x - rw * 1.5, h.y - rw * 0.8, rw * 3, rw * 1.5);
    s.globalAlpha = Math.min(1, 0.55 * th); s.drawImage(g, h.x - rw * 2.8, h.y - rw * 0.35, rw * 5.6, rw * 0.7);
    s.globalAlpha = Math.min(1, 0.4 * th); s.drawImage(g, ex - rw * 1.8, ey - Math.max(rw, span * 0.7), rw * 3.6, Math.max(rw, span * 0.7) * 2);
    // (only where the cloud is: its sprite's alpha)
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'destination-in'; s.globalAlpha = 1;
    const kx = d.cv.width / d.w, ky = d.cv.height / d.h;
    s.drawImage(d.cv, (x0 - cx) * kx, (y0 - ty) * ky, bw * kx, bh * ky, 0, 0, bw, bh);
    // (and a little of it in the air just under the belly, where the beam goes in — outside the mask)
    s.globalCompositeOperation = 'source-over'; s.globalAlpha = Math.min(1, 0.16 * th); s.drawImage(g, h.x - x0 - rw * 0.8, h.y - y0 - rw * 0.3, rw * 1.6, rw * 0.6);
    return { cv, ox: x0 - cx, oy: y0 - ty, w: bw, h: bh };
  }
  return {
    KINDS, rayHit, beamPatch,
    /** W, the sky band: top (the safe top) .. roof (the skyline's median roof), HZ (the far quay's waterline); dpr: the phone's */
    resize(w, t, r, hz, dpr) {
      const nr = Math.min(2, Math.max(1, dpr || 1)) * 0.92;
      if (w !== W || Math.abs(r - roof) > 2 || t !== top || nr !== res) { W = w; top = t; roof = r; HZ = hz; res = nr; box = { W, top, roof, hz: HZ - 2, avoid: box ? box.avoid : null }; planKey = ''; }
    },
    /** SP: the tagline's band ({ y0, y1 } | null) — the cirrus keep above it (a move of more than a few pt re-plans the sky) */
    avoid(b) {
      const cur = box && box.avoid;
      if (!box || (!b && !cur) || (b && cur && Math.abs(b.y0 - cur.y0) < 3 && Math.abs(b.y1 - cur.y1) < 3)) return;
      box = { ...box, avoid: b ? { y0: b.y0, y1: b.y1 } : null }; planKey = '';
    },
    /** POLISH 5: thin the clouds over a box (a sky message) by k 0..1 (null: none) */
    thin(b, k) { thinB = b; thinK = k; },
    /** Part 9: grey 0..1 (rain / snow skies), dark 0..1 (a storm), base (pt: a lower cloud base) — re-lit at once */
    set(o) { extra = { ...extra, ...o }; gKey = ''; },
    /** part: undefined = every cloud (the update + all of them); PART 6b's hook — 'back' (the update + the far half) then the sky
     *  messages, then 'front' (the near half only): skywriting drifting between the cloud layers */
    draw(c, fs, sunInfo, part) {
      const pt0 = performance.now();
      drawAll(c, fs, sunInfo, part);
      const ms = performance.now() - pt0;
      perf.ms = perf.ms * 0.97 + ms * 0.03; perf.n++;
    },
    coverAt,
    /** POLISH 5: the load gate's view — plans made, how many clouds + their kinds, READY (planned + every cloud baked, or a clear sky),
     *  slow (the current set's blend in ms when it is a slow one) */
    stats: () => ({ plans, n: list.length, kinds: [...new Set(list.map(d => d.kind))].join(' ') || 'clear', ready: !!planKey && (!!born || (!list.length && !jobs.length)), slow: appearMs > 1600 ? appearMs : 0 }),
    /** POLISH 5: the city is revealed — the set baked in the dark shows at once (no fade of its own), the old one gone; later sets blend slowly */
    settle() { shown = true; if (born) born = performance.now() - appearMs - 1; if (old) { free(old); old = null; } },
    /** SP: tonight's cirrostratus veil 0..1 (the moon's 22° halo lives under it) */
    veil: () => (mix && list.length ? mix.veil || 0 : 0),
    debug: () => ({
      clouds: list.length, kinds: list.map(d => d.kind), deck: list.some(d => d.kind === 'deck'), mix: mix ? Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(2) : v])) : null,
      lit: gKey, pending: jobs.length, born: !!born, ms: +perf.ms.toFixed(3), jobMs: +perf.jobMs.toFixed(3), relit: perf.relit, frames: perf.n, beamMs: +perf.beamMs.toFixed(2), hitMs: +perf.hitMs.toFixed(2), renders: perf.renders, patchN: perf.patches,
      mb: +list.reduce((s, d) => s + (d.cv ? d.cv.width * d.cv.height * 4 : 0) + (d.prev ? d.prev.width * d.prev.height * 4 : 0) + (d.F ? d.F.pw * d.F.ph * (d.F.m !== d.F.t ? 7 : 6) : 0), 0).toFixed(0) / 1e6,
      at: list.map(d => ({ k: d.kind, x: Math.round(d.xNow), y: Math.round(d.y), w: Math.round(d.w), h: Math.round(d.h), s: +d.s.toFixed(2) })),
    }),
    destroy() { free(list); free(old); list = []; old = null; jobs = []; for (const g of glows.values()) g.width = 0; glows.clear(); for (const o of patches.values()) if (o.cv) o.cv.width = 0; patches.clear(); for (const cv of pool) cv.width = 0; pool.length = 0; },
  };
  function veilLook(c, fs, sun, k, lc) {
    const LK = fs.L, day = clamp01(LK.w.day + LK.w.golden * 0.7 + LK.w.dawn * 0.6) * (1 - clamp01(LK.w.night + LK.w.late));
    if (k < 0.02 || day < 0.05) return;
    const H0 = HZ, g = c.createLinearGradient(0, top, 0, H0);
    g.addColorStop(0, `rgba(236,240,248,${(0.07 * k * day).toFixed(3)})`); g.addColorStop(0.7, `rgba(240,242,248,${(0.16 * k * day).toFixed(3)})`); g.addColorStop(1, `rgba(244,244,246,${(0.24 * k * day).toFixed(3)})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H0);
    if (sun && sun.x != null && sun.vis > 0.05) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const r = Math.min(W, H0) * 0.32, gg = c.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, r);
      gg.addColorStop(0, `rgba(255,252,240,${(0.22 * k * sun.vis).toFixed(3)})`); gg.addColorStop(1, 'rgba(255,252,240,0)');
      c.fillStyle = gg; c.fillRect(sun.x - r, sun.y - r, r * 2, r * 2);
      c.restore();
      // THE 22° HALO (POLISH 4, the owner: "a very obvious circle of clouds" — wrong): a FAINT, THIN ring of LIGHT in the veil — barely
      // there, a slightly REDDISH INNER EDGE, the sky a touch DARKER inside it; ~1 veil day in 4 (seeded). SUN DOGS (a rarer bonus, ~1
      // halo day in 2): two small bright rainbow-tinted spots level with the sun, one each side just outside the ring, red toward the sun.
      // (R: the real ring at this camera's field, pulled in a little so the sun dogs stay on a phone's screen; drawn under the roofs' line)
      const hk = haloOf(lc, { halo: fs.force.has('halo'), dogs: fs.force.has('sundogs') });
      if (hk.halo && k > 0.25) {
        const R = Math.min(W * 0.42, H0 * 0.5), band = Math.max(2.5, R * 0.03), v = k * sun.vis;
        c.save(); c.beginPath(); c.rect(0, 0, W, roof + 20); c.clip();
        // the sky inside the ring a touch darker (never at the sun itself: its own glow is there)
        const dg = c.createRadialGradient(sun.x, sun.y, R * 0.35, sun.x, sun.y, R - band * 0.5);
        dg.addColorStop(0, 'rgba(40,60,110,0)'); dg.addColorStop(0.75, `rgba(40,60,110,${(0.045 * v).toFixed(3)})`); dg.addColorStop(1, `rgba(40,60,110,${(0.065 * v).toFixed(3)})`);
        c.fillStyle = dg; c.beginPath(); c.arc(sun.x, sun.y, R - band * 0.5, 0, Math.PI * 2); c.fill();
        // the ring itself: light added — the red inner edge, a pale band, fading out wider than in (as the real one does)
        c.globalCompositeOperation = 'lighter';
        const r0 = R - band, r1 = R + band * 3;
        const rg = c.createRadialGradient(sun.x, sun.y, r0, sun.x, sun.y, r1);
        rg.addColorStop(0, 'rgba(255,120,90,0)'); rg.addColorStop(0.12, `rgba(255,120,90,${(0.075 * v).toFixed(3)})`); rg.addColorStop(0.26, `rgba(255,214,170,${(0.09 * v).toFixed(3)})`);
        rg.addColorStop(0.42, `rgba(240,244,255,${(0.07 * v).toFixed(3)})`); rg.addColorStop(0.7, `rgba(210,226,255,${(0.025 * v).toFixed(3)})`); rg.addColorStop(1, 'rgba(210,226,255,0)');
        c.fillStyle = rg; c.beginPath(); c.arc(sun.x, sun.y, r1, 0, Math.PI * 2); c.arc(sun.x, sun.y, r0, 0, Math.PI * 2, true); c.fill('evenodd');
        // THE SUN DOGS (parhelia): level with the sun, just outside the ring; red on the sun's side → amber → white → a faint blue, a
        // short white tail pointing away; a gentle shimmer as the veil's crystals drift
        if (hk.dogs) for (const side of [-1, 1]) {
          const dx = sun.x + side * R * 1.03, dy = sun.y, sh = 0.85 + 0.15 * Math.sin(fs.t * 0.7 + side), a = v * sh;
          if (dx < -band * 6 || dx > W + band * 6) continue;
          const spot = (ox, rx, ry, col, al) => { const gx = c.createRadialGradient(0, 0, 0, 0, 0, 1); gx.addColorStop(0, `rgba(${col},${al.toFixed(3)})`); gx.addColorStop(1, `rgba(${col},0)`);
            c.save(); c.translate(dx + side * ox, dy); c.scale(rx, ry); c.fillStyle = gx; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore(); };
          spot(-band * 1.1, band * 1.7, band * 3.8, '255,70,50', 0.42 * a);
          spot(-band * 0.1, band * 1.8, band * 4, '255,180,60', 0.4 * a);
          spot(band * 0.9, band * 1.7, band * 3.4, '255,250,225', 0.4 * a);
          spot(band * 2.1, band * 1.9, band * 3.4, '150,190,255', 0.22 * a);
          spot(band * 6, band * 6.5, band * 1.3, '245,248,255', 0.1 * a);                         // (the tail away from the sun)
        }
        c.restore();
      }
    }
  }
  function drawAll(c, fs, sunInfo, part) {
      const LK = fs.L;
      if (!box) return;
      if (part === 'front') { if (G && list.length) { drawSet(c, list, lastA, lastT, LK, fs.motion, 'front'); c.globalAlpha = 1; } return; }
      const lc = LK.local, blk = lc ? Math.floor(lc.h / 6) : 0;
      const cover = clamp01(LK.cloud || 0), lay = LK.cloudLayers;
      const seed = `${lc ? `${lc.y}-${lc.m}-${lc.d}-${blk}` : 'x'}|${Math.round(cover * 8)}|${lay ? `${Math.round(lay.lo * 4)}${Math.round(lay.mid * 4)}${Math.round(lay.hi * 4)}` : '-'}|${LK.rain > 0.05 || LK.storm ? 'w' : ''}`;
      if (lc) epoch = (((lc.h % 6) * 60 + lc.mi) * 60 + (lc.s || 0));
      windSgn = windX(LK) < 0 ? -1 : 1;
      if (seed !== planKey) { planKey = seed; t0Clock = fs.now; e0 = epoch; G = null; plan(LK, seed, fs.motion); }
      if (!list.length && !old) return;
      // THE LIGHT for the hour (re-shades only when it moves a step)
      const stops = harborSky(fs.P, LK), hzC = stops ? stops[2].slice(0, 3).map((v, i) => (v + stops[3][i]) / 2) : null;
      const party = fs.party && fs.party.on > 0.3 ? fs.party.on : 0;
      const g2 = skyLight(LK, { sun: sunInfo && sunInfo.x != null ? sunInfo : null, side: sunInfo ? sunInfo.side : 0, moon: fs.moonAt || null, party, palette: fs.party && fs.party.palette, horizon: hzC, deck: mix ? mix.deck : 0, extra });
      if (!G || g2.key !== gKey) { G = g2; gKey = g2.key; }
      // a few clouds a frame: is its own light still its bake's? (it drifts past the sun) — re-light in the background
      if (born && !(G.src && G.src.moon)) for (let k = 0; k < 3 && list.length; k++) {
        const d = list[rr++ % list.length];
        if (!d.cv || d.queued) continue;
        const key = cloudLit(G, d, d.xNow > -1e8 ? d.xNow : d.x0, box).key;
        if (key !== d.lit) { d.queued = true; perf.relit++; jobs.push({ d, gen: build(d, true) }); }
      }
      { const j0 = performance.now(); run(born ? 1.2 : 10); perf.jobMs = perf.jobMs * 0.97 + (performance.now() - j0) * 0.03; }
      if (!born && !jobs.length) born = performance.now();
      const now = performance.now(), dt = Math.min(100, fs.dt || 16);
      for (const d of list) if (d.prev && d.fade < 1) { d.fade = Math.min(1, d.fade + dt / 900); if (d.fade >= 1) { d.prev.width = 0; d.prev = null; } }
      const appear = born ? smooth(0, appearMs, now - born) : 0;
      // (the time on the cloud field: seconds into this 6-hour block on the city's clock — every phone the same sky)
      const tSec = e0 + ((fs.now - t0Clock) / 1000);
      // 6b — THE HIGH VEIL (cirrostratus: core/weather.js#veilOf → mix.veil): a MILKY SHEEN over the blue (whiter toward the horizon), the
      // sun SOFTENED in it (a wide watery glow), and on a rare veil day (~1 in 4, seeded by the date) a faint 22° HALO round the sun
      if (mix && mix.veil > 0.05 && part !== 'front') veilLook(c, fs, sunInfo, mix.veil * appear, lc);
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
  }
}
