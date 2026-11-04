// THE VAULT 2C — REAL FIRE (the owner's lab FIX on INFERNO: "this needs to look a lot more like real flame — it needs to be better"; CENTURY
// shares the effect). The 1A flames were baked teardrops stamped in rows — they read as drops, not fire. Real fire is a FIELD: tongues
// splitting + merging, licking up, tearing off at the tips, white-hot at the root, orange → red → gone. So the look is BAKED ONCE as a
// FLIPBOOK — a few dozen ms of domain-warped noise at the page's first frame of fire (16 frames of a fire band that tiles across + loops in
// time, mapped through a blackbody ramp) — and every frame after only STAMPS slices of it (one atlas sprite on the GPU path: ~60–120
// quads a strip, no per-pixel work). The band is drawn in vertical SLICES so its height breathes along the strip (a slow envelope — the
// tiling never shows) and two layers cross (a tall slow one behind, a quicker one in front, each its own drift).
//   fireSheet() → the baked sheet ({ cv, FW, FH, NF, col(i), row(i) })
//   drawFire(c, x0, x1, base, bandH, t, o) — the band from x0 to x1, its root on `base`, bandH tall; o = { loop, a, seed, drift, env(x) }
import { sprite, fract, wob } from './kit.js';

const FW = 192, FH = 144, NF = 12, GUT = 2, COLS = 4;
const CW = FW + GUT * 2, CH = FH + GUT * 2;

// a periodic value noise (period P lattice cells across; the strip tiles the band side by side), smooth-stepped
function hash(i, j) { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, P) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P;
  const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y, P, oct) { let s = 0, amp = 0.5, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += amp * vnoise(x * f, y * f, P * f); n += amp; amp *= 0.5; f *= 2; } return s / n; }

/** the blackbody ramp: intensity 0..1 → [r, g, b, a] (dark red smoke-edge → red → orange → yellow → white-hot) */
function ramp(I) {
  const stops = [[0, 40, 0, 0, 0], [0.2, 120, 10, 0, 0.3], [0.4, 200, 42, 2, 0.64], [0.6, 245, 96, 8, 0.84], [0.8, 255, 146, 24, 0.94], [0.95, 255, 190, 70, 1], [1, 255, 214, 120, 1]];
  for (let i = 1; i < stops.length; i++) if (I <= stops[i][0]) {
    const [a0, ...A] = stops[i - 1], [a1, ...B] = stops[i], k = (I - a0) / (a1 - a0);
    return A.map((v, j) => v + (B[j] - v) * k);
  }
  return stops[stops.length - 1].slice(1);
}

/** the sheet: NF frames (COLS across), each FW × FH with a wrapped GUT each side (no seams where a slice meets the frame's edge) */
export const fireSheet = () => sprite('fire-book:5', CW * COLS, CH * Math.ceil(NF / COLS), (c, W, H) => {
  const img = c.createImageData(W, H), D = img.data, P = 5;       // (5 lattice cells across a tile)
  for (let f = 0; f < NF; f++) {
    const ph = f / NF, ox = (f % COLS) * CW, oy = Math.floor(f / COLS) * CH;
    for (let py = -GUT; py < FH + GUT; py++) {
      const hgt = 1 - Math.min(1, Math.max(0, py / (FH - 1)));       // 0 at the root, 1 at the top
      for (let px = -GUT; px < FW + GUT; px++) {
        const x = (px / FW) * P, y = hgt * 2.6;
        // the flow: the field rises through the band (two samples a loop apart, cross-faded — the flipbook loops without a jump)
        const S = 2.2;
        const field = (yy) => {
          const wx = fbm(x + 3.1, yy * 0.8, P, 2) - 0.5;                // the warp: tongues lick sideways as they rise
          return fbm(x * 1.6 + wx * 2.4, yy * 1.15, P * 1.6, 4);
        };
        const n = field(y - ph * S) * (1 - ph) + field(y - (ph - 1) * S) * ph;
        // the flame's body: hot + solid at the root, the noise carving tongues higher up, nothing past the top
        let I = n * 2.05 - Math.pow(hgt, 0.85) * 1.55 + Math.pow(1 - hgt, 6) * 0.16 - 0.02;
        I = Math.max(0, Math.min(1, I / 0.72));
        const [r, g, b, a] = ramp(I), k = I * a;
        const i4 = ((oy + GUT + py) * W + (ox + GUT + px)) * 4;
        D[i4] = r; D[i4 + 1] = g; D[i4 + 2] = b; D[i4 + 3] = Math.round(255 * Math.min(1, k * 1.15));
      }
    }
  }
  c.putImageData(img, 0, 0);
});

/** the band of fire, x0..x1, its root on `base`, bandH tall — whole tiles of the flipbook side by side (the field tiles across), cross-faded
 *  frame to frame. (Never sliced: a tile stretched to different heights side by side tears the field at every seam — the 2C first try.) */
export function drawFire(c, x0, x1, base, bandH, t, o = {}) {
  const sh = fireSheet(); if (!sh || !sh.width) return;
  const loop = o.loop || 1.2, a = o.a == null ? 1 : o.a, tw = bandH * (FW / FH) * (o.stretch || 1);
  const fpos = fract(t / loop + (o.seed || 0) * 0.37) * NF, f0 = Math.floor(fpos) % NF, f1 = (f0 + 1) % NF, k = fpos - Math.floor(fpos);
  const off = fract((o.seed || 0) * 0.61 + t * (o.drift || 0) / tw) * tw;
  for (let x = x0 - off; x < x1; x += tw) {
    for (const [f, w] of [[f0, 1 - k], [f1, k]]) {
      if (w <= 0.01) continue;
      c.globalAlpha = Math.min(1, a * w);
      c.drawImage(sh, (f % COLS) * CW + GUT, Math.floor(f / COLS) * CH + GUT, FW, FH, x, base - bandH, tw, bandH);
    }
  }
  c.globalAlpha = 1;
}
/** a slow envelope along the band: tall + short stretches drifting (the tiling never repeats on screen) */
export const fireEnv = (w, t, seed = 0, lo = 0.62, hi = 1.05) => x => { const u = x / w; return lo + (hi - lo) * (0.5 + 0.5 * (0.7 * Math.sin(u * 7.3 + t * 0.53 + seed) + 0.3 * wob(t * 0.8 + u * 3.1, seed))); };
