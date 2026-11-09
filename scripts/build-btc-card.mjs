// THE BTC CARD (Nov 8 late night) — FIX THE MONEY, FIX THE WORLD's art: Grok's master + FX plates (art/btc-card/src/ — copies of the owner's
// Downloads\grok\btc-card; never the originals) → assets/vault/btc/*.webp. The master = card-btc-backup.png (Grok's untouched composition — the
// bigger balloon, real clouds; NOT card-btc.png, shrunk onto an extended sky with a box seam). What it bakes (all measured on the real pixels;
// the numbers it prints go into js/fx/btc-specs.js):
//   btc          the master, converted only (1280 × 720) — the card's MATERIAL (css/vault.css .vl-s-sg-btc)
//   btc-balloon  THE BALLOON cut out (the envelope — its outline filled row by row, the ₿ inside it — + the rigging, burner + basket) with a
//                soft 1-px edge: the layer that sways + rises
//   btc-clean    the SKY behind it: the master with the balloon + the five coins filled in (a push-pull fill + a little grain, pasted in
//                feathered) — the effect's opaque BASE, so the moving balloon / coins never show a second copy
//   btc-lit      THE FLARE's inside light: the envelope's own shape, hottest at the mouth, fading up the panels (the gores' light kept)
//   btc-mark     the ₿ BLAZING (its letter + a soft gold glow) · btc-sheen = the ₿ alone (the gold sheen slides across it in slices)
//   btc-bloom    the soft bloom around the envelope (its outline blurred — never a box)
//   btc-coins    the five ₿ coins cut out (one row of 56-px cells) — they rise + spin in the effect
//   btc-flame    Grok's glow plate (its hot core + lens streak) — the effect moves it onto the REAL burner (notes.txt: it wasn't aligned)
//   btc-glints   Grok's coins plate (coin-edge glints + star sparks — NOT coins)
//   btc-water    the harbor's reflections (the bright part of the water) — they shimmer
// Every FX layer = LIGHT WITH ALPHA (alpha = the brightest channel, the colour divided out): drawn 'lighter' on the transparent effect canvas it
// adds back exactly the light, never a black box. What MOVES is the effect's (js/fx/btc-card.js).
//   node scripts/build-btc-card.mjs "<browser>"      (needs scripts/serve.mjs on :5173, or E2E_BASE)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/btc/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const res = await p.evaluate(async () => {
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = '/art/btc-card/src/' + n; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const webp = (c, q = 0.86) => c.toDataURL('image/webp', q);
  const pixels = img => { const c = canvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  /** a box blur of a float field (r px, n passes) */
  function blur(f, w, h, r, n = 3) {
    let a = Float32Array.from(f), t = new Float32Array(w * h);
    for (let k = 0; k < n; k++) {
      for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
      for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; } }
    }
    return a;
  }
  /** a field of light (rgb 0..255 + alpha 0..1 per pixel) → a canvas of light WITH alpha, cropped to [x, y, w, h], scaled k */
  function lightCanvas(W, box, fn, k = 1) {
    const [bx, by, bw, bh] = box, c = canvas(bw, bh), x = c.getContext('2d'), d = x.createImageData(bw, bh);
    for (let y = 0; y < bh; y++) for (let u = 0; u < bw; u++) { const o = fn(bx + u, by + y); if (!o) continue; const i = (y * bw + u) * 4; d.data[i] = o[0]; d.data[i + 1] = o[1]; d.data[i + 2] = o[2]; d.data[i + 3] = Math.round(Math.min(1, o[3]) * 255); }
    x.putImageData(d, 0, 0);
    if (k === 1) return c;
    const s = canvas(Math.round(bw * k), Math.round(bh * k)), sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(c, 0, 0, s.width, s.height); return s;
  }
  /** a light-on-black plate → light with alpha (crop [x, y, w, h], scaled k; `floor` = the dark that stays dark) */
  function plateLight(img, box, k = 0.5, floor = 0, gain = 1, skyTo = 1e9) {
    const P = pixels(img), W = P.width, d = P.data;
    return lightCanvas(W, box, (x, y) => { const i = (y * W + x) * 4, m = (Math.max(d[i], d[i + 1], d[i + 2]) - floor) * (1 - sm(skyTo - 50, skyTo, y)); if (m < 3) return null; const q = 255 / Math.max(1, m + floor); return [Math.min(255, d[i] * q), Math.min(255, d[i + 1] * q), Math.min(255, d[i + 2] * q), Math.min(1, (m * gain) / 255)]; }, k);
  }
  const out = {};
  const M = await load('card-btc-backup.png'), W = M.width, H = M.height, MP = pixels(M), md = MP.data;
  const rgb = (x, y) => { const i = (y * W + x) * 4; return [md[i], md[i + 1], md[i + 2]]; };
  // ---- the master (converted only)
  { const c = canvas(W, H); c.getContext('2d').drawImage(M, 0, 0); out.btc = webp(c, 0.85); }
  // ---- THE ENVELOPE: its colour (loose — the shaded left side is a deep red-orange), the blob from a seed, then filled row by row between
  //      its outline (the ₿ inside it + any shade the colour missed), the outline smoothed over 7 rows (one row's miss can't bite a notch)
  const X0 = 720, X1 = 1110, Y0 = 60, Y1 = 482;
  const col = new Uint8Array(W * H);
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const [R, G, B] = rgb(x, y); if (R > 90 && R > B * 1.5 && R > G * 1.12) col[y * W + x] = 1; }
  const blob = new Uint8Array(W * H), st = [[915, 200]];
  while (st.length) { const [x, y] = st.pop(); if (x < X0 || y < Y0 || x >= X1 || y >= Y1) continue; const k = y * W + x; if (!col[k] || blob[k]) continue; blob[k] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  const L = new Float32Array(H).fill(-1), R = new Float32Array(H).fill(-1);
  for (let y = Y0; y < Y1; y++) { for (let x = X0; x < X1; x++) if (blob[y * W + x]) { if (L[y] < 0) L[y] = x; R[y] = x; } }
  let eTop = H, eBot = 0; for (let y = Y0; y < Y1; y++) if (L[y] >= 0) { eTop = Math.min(eTop, y); eBot = Math.max(eBot, y); }
  const med = (A, y) => { const v = []; for (let k = -3; k <= 3; k++) { const q = A[y + k]; if (q >= 0) v.push(q); } v.sort((a, b) => a - b); return v.length ? v[v.length >> 1] : -1; };
  const Ls = new Float32Array(H).fill(-1), Rs = new Float32Array(H).fill(-1);
  for (let y = eTop; y <= eBot; y++) { Ls[y] = Math.min(L[y] < 0 ? 1e9 : L[y], med(L, y)); Rs[y] = Math.max(R[y], med(R, y)); }
  // (the envelope's alpha: a 1-px anti-aliased edge on each row's outline; its top + bottom rows fade over 2 px)
  const env = new Float32Array(W * H);
  for (let y = eTop; y <= eBot; y++) { if (Ls[y] < 0) continue; const vy = Math.min(1, (y - eTop + 1) / 2, (eBot - y + 1) / 2); for (let x = Math.floor(Ls[y]) - 1; x <= Math.ceil(Rs[y]) + 1; x++) env[y * W + x] = vy * Math.min(1, Math.max(0, x - Ls[y] + 1), Math.max(0, Rs[y] - x + 1)); }
  // ---- THE RIGGING (the ropes, the burner, the basket): a box under the mouth, its sides feathered (the ropes over the sky)
  const RIG = [878, eBot - 18, 954, 542];
  const rig = (x, y) => (x < RIG[0] || x > RIG[2] || y < RIG[1] || y > RIG[3]) ? 0 : Math.min(1, (x - RIG[0]) / 4, (RIG[2] - x) / 4, (RIG[3] - y) / 3);
  // the basket's real box (brown-gold, below the mouth)
  let kx0 = W, ky0 = H, kx1 = 0, ky1 = 0;
  for (let y = eBot + 8; y < 560; y++) for (let x = 870; x < 960; x++) { const [r, g, bb] = rgb(x, y); if (r > 60 && r > bb * 1.4 && g > 35 && r - bb > 30 && y < 545) { kx0 = Math.min(kx0, x); kx1 = Math.max(kx1, x); ky0 = Math.min(ky0, y); ky1 = Math.max(ky1, y); } }
  const BAL = [Math.floor(Math.min(...Array.from(Ls).filter(v => v >= 0))) - 3, eTop - 3, 0, 0];
  BAL[2] = Math.ceil(Math.max(...Array.from(Rs))) + 4 - BAL[0]; BAL[3] = RIG[3] + 3 - BAL[1];
  let rigSky = null;   // (filled in below, once the patch's sky estimate exists)
  const rigA = (x, y) => { const r0 = rig(x, y); if (!r0 || !rigSky) return r0; const [r, g, bb] = rgb(x, y), q = rigSky(x, y); const dd = Math.max(Math.abs(r - q[0]), Math.abs(g - q[1]), Math.abs(bb - q[2])); return r0 * sm(10, 34, dd); };
  const balA = (x, y) => Math.max(env[y * W + x] || 0, rigA(x, y));
  const balloonOut = () => webp(lightCanvas(W, BAL, (x, y) => { const a = balA(x, y); if (a <= 0) return null; const [r, g, bb] = rgb(x, y); return [r, g, bb, a]; }), 0.9);
  // ---- THE COINS: gold discs outside the envelope (measured: the blobs → their centres + radii)
  const gold = new Uint8Array(W * H), nearEnv = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (env[(y + dy) * W + x + dx] > 0) return true; return false; };
  for (let y = 240; y < 460; y++) for (let x = 640; x < 1200; x++) { const [r, g, bb] = rgb(x, y); if (r > 110 && g > 70 && r > bb * 1.5 && !nearEnv(x, y)) gold[y * W + x] = 1; }
  const seen = new Uint8Array(W * H), coins = [];
  for (let y = 240; y < 460; y++) for (let x = 640; x < 1200; x++) { const k0 = y * W + x; if (!gold[k0] || seen[k0]) continue; let n = 0, a0 = W, a1 = 0, b0 = H, b1 = 0; const s2 = [[x, y]]; while (s2.length) { const [u, v] = s2.pop(); const q = v * W + u; if (u < 0 || v < 0 || u >= W || v >= H || !gold[q] || seen[q]) continue; seen[q] = 1; n++; a0 = Math.min(a0, u); a1 = Math.max(a1, u); b0 = Math.min(b0, v); b1 = Math.max(b1, v); s2.push([u + 1, v], [u - 1, v], [u, v + 1], [u, v - 1]); } if (n > 600 && Math.abs((a1 - a0) - (b1 - b0)) < 8) coins.push([(a0 + a1) / 2, (b0 + b1) / 2, Math.max(a1 - a0, b1 - b0) / 2 + 1]); }
  coins.sort((a, b) => a[0] - b[0]);
  const CELL = 56;
  { const c = canvas(CELL * coins.length, CELL), x = c.getContext('2d');
    coins.forEach(([cx, cy, r], i) => {
      const t = canvas(CELL, CELL), tx = t.getContext('2d'); tx.drawImage(M, cx - CELL / 2, cy - CELL / 2, CELL, CELL, 0, 0, CELL, CELL);
      const d = tx.getImageData(0, 0, CELL, CELL);
      for (let y = 0; y < CELL; y++) for (let u = 0; u < CELL; u++) { const dd = Math.hypot(u + 0.5 - CELL / 2, y + 0.5 - CELL / 2); d.data[(y * CELL + u) * 4 + 3] = Math.round(255 * (1 - sm(r - 1.4, r + 0.4, dd))); }
      tx.putImageData(d, 0, 0); x.drawImage(t, i * CELL, 0);
    });
    out['btc-coins'] = webp(c, 0.92); }
  // ---- THE PATCH: the balloon (dilated 5) + the coins (r + 4) filled in from the sky around them (push-pull), a little grain; kept only
  //      within ~12 px of them (feathered) so everywhere else stays the material's own pixels
  const PB = [640, 40, 560, 540], [px0, py0, pw, ph] = PB;
  const dil = (f, r) => { const g = blur(f, pw, ph, r, 1); return g.map(v => (v > 0.001 ? 1 : 0)); };
  const holeOf = rigF => { const m = new Float32Array(pw * ph); for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { const X = px0 + x, Y = py0 + y; let v = Math.max(env[Y * W + X] || 0, rigF(X, Y)) > 0.02 ? 1 : 0; for (const [cx, cy, r] of coins) if (Math.hypot(X - cx, Y - cy) < r + 4) v = 1; m[y * pw + x] = v; } return dil(m, 5); };
  // push-pull: level 0 = the known pixels (weight 1), each coarser level the weighted 2 × 2 sums, then back up filling the unknown
  const pushPull = holeM => {
  const lv = [{ w: pw, h: ph, c: new Float32Array(pw * ph * 3), a: new Float32Array(pw * ph) }];
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { const k = y * pw + x, a = 1 - holeM[k]; const [r, g, bb] = rgb(px0 + x, py0 + y); lv[0].a[k] = a; lv[0].c[k * 3] = r * a; lv[0].c[k * 3 + 1] = g * a; lv[0].c[k * 3 + 2] = bb * a; }
  while (lv[lv.length - 1].w > 1 || lv[lv.length - 1].h > 1) {
    const f = lv[lv.length - 1], w2 = Math.max(1, Math.ceil(f.w / 2)), h2 = Math.max(1, Math.ceil(f.h / 2)), c2 = new Float32Array(w2 * h2 * 3), a2 = new Float32Array(w2 * h2);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const k = y * f.w + x, q = (y >> 1) * w2 + (x >> 1); a2[q] += f.a[k]; c2[q * 3] += f.c[k * 3]; c2[q * 3 + 1] += f.c[k * 3 + 1]; c2[q * 3 + 2] += f.c[k * 3 + 2]; }
    for (let q = 0; q < w2 * h2; q++) { const a = a2[q]; if (a > 1) { c2[q * 3] /= a; c2[q * 3 + 1] /= a; c2[q * 3 + 2] /= a; a2[q] = 1; } }
    lv.push({ w: w2, h: h2, c: c2, a: a2 });
  }
  for (let l = lv.length - 2; l >= 0; l--) {
    const f = lv[l], g = lv[l + 1];
    const samp = (x, y, ch) => { const gx = Math.min(g.w - 1, Math.max(0, x / 2 - 0.25)), gy = Math.min(g.h - 1, Math.max(0, y / 2 - 0.25)), x0 = Math.floor(gx), y0 = Math.floor(gy), x1 = Math.min(g.w - 1, x0 + 1), y1 = Math.min(g.h - 1, y0 + 1), fx = gx - x0, fy = gy - y0;
      const v = (xx, yy) => { const q = yy * g.w + xx; return g.a[q] > 0 ? g.c[q * 3 + ch] / g.a[q] : 0; };
      return (v(x0, y0) * (1 - fx) + v(x1, y0) * fx) * (1 - fy) + (v(x0, y1) * (1 - fx) + v(x1, y1) * fx) * fy; };
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const k = y * f.w + x, a = f.a[k]; if (a >= 1) continue; for (let ch = 0; ch < 3; ch++) f.c[k * 3 + ch] += (1 - a) * samp(x, y, ch); f.a[k] = 1; }
  }
  return lv[0].c; };
  // pass 1: the rigging's whole box filled → the sky estimate there → the rigging = only what differs from it (the ropes, the burner, the basket)
  const fillA = pushPull(holeOf(rig));
  rigSky = (X, Y) => { const k = (Y - py0) * pw + (X - px0); return [fillA[k * 3], fillA[k * 3 + 1], fillA[k * 3 + 2]]; };
  // pass 2: the hole = the envelope + the rigging's own pixels + the coins (the real clouds between the ropes stay — no flat wedge beside the basket)
  const hole5 = holeOf(rigA), fill = pushPull(hole5), lv = [{ c: fill }];
  // (the rigging's dilated box went into the fill; the cut-out keeps only the ropes, the burner + the basket — what differs from the sky)
  out['btc-balloon'] = balloonOut();
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const keep = blur(dil(hole5, 10), pw, ph, 4, 2);
  const patchCv = lightCanvas(W, PB, (X, Y) => { const k = (Y - py0) * pw + (X - px0), a = Math.min(1, keep[k] * 1.6); if (a <= 0.004) return null;
    if (!hole5[k]) { const [r, g, bb] = rgb(X, Y); return [r, g, bb, a]; }
    const n = (rnd() - 0.5) * 5; return [lv[0].c[k * 3] + n, lv[0].c[k * 3 + 1] + n, lv[0].c[k * 3 + 2] + n, a]; });
  // THE CLEAN MASTER: the master with the patch pasted in (one opaque 1280 × 720 picture — the effect's base; an external texture, so the
  // shared atlas keeps its room: a 560 × 540 patch on top of the base overflowed it in a lobby of the 8 sighting cards)
  // BOARD 2.0 A — THE HALO OUT: the master's burner halo left a soft warm COLUMN in the sky behind the balloon (x ≈ 830–990, y ≈ 230–560 —
  // seen only while the balloon rises in). Its SMOOTH excess goes: a wide blur of the clean sky against a baseline drawn straight across the
  // column from its two sides (each row), and only blur − baseline (where positive) subtracted, feathered — the clouds' own detail stays.
  { const c = canvas(W, H), x = c.getContext('2d'); x.drawImage(M, 0, 0); x.drawImage(patchCv, PB[0], PB[1]);
    const HB = [790, 200, 240, 400], [hx, hy, hw, hh] = HB, D = x.getImageData(hx, hy, hw, hh), dd = D.data;
    const xl = 22, xr = hw - 23;   // (the baseline's two sides: x 812 + 1022)
    for (const rad of [14, 6]) for (let ch = 0; ch < 3; ch++) {   // (two passes: the wide bump, then what a finer blur still sees)
      const f = new Float32Array(hw * hh); for (let k = 0; k < hw * hh; k++) f[k] = dd[k * 4 + ch];
      const bl = blur(f, hw, hh, rad, 3);
      for (let y = 0; y < hh; y++) {
        const L = bl[y * hw + xl], R = bl[y * hw + xr], fy = sm(0, 50, y) * (1 - sm(hh - 60, hh, y));
        for (let u = 0; u < hw; u++) {
          const fx = sm(xl, xl + 30, u) * (1 - sm(xr - 30, xr, u)), wgt = fx * fy; if (wgt <= 0) continue;
          const base = L + (R - L) * ((u - xl) / (xr - xl)), ex = bl[y * hw + u] - base;
          if (ex > 0) { const i = (y * hw + u) * 4 + ch; dd[i] = Math.max(0, Math.round(dd[i] - ex * wgt)); }
        }
      }
    }
    x.putImageData(D, hx, hy);
    out['btc-clean'] = webp(c, 0.86); }
  // ---- THE ₿ (white on the envelope): its own pixels → the sheen's mask + the blaze
  let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
  const whiteOf = (x, y) => { const [r, g, bb] = rgb(x, y); return env[y * W + x] > 0.5 && y < eBot - 80 ? sm(150, 215, Math.min(r, g, bb + 25)) : 0; };
  for (let y = eTop; y < eBot - 80; y++) for (let x = 820; x < 1020; x++) if (whiteOf(x, y) > 0.5) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const MB = [bx0 - 34, by0 - 34, bx1 - bx0 + 69, by1 - by0 + 69], mw = MB[2], mh = MB[3];
  const wm = new Float32Array(mw * mh); for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) wm[y * mw + x] = whiteOf(MB[0] + x, MB[1] + y);
  const wg = blur(wm, mw, mh, 7, 3);
  out['btc-mark'] = webp(lightCanvas(W, MB, (X, Y) => { const k = (Y - MB[1]) * mw + (X - MB[0]), m = wm[k], g = wg[k]; const a = Math.min(1, m * 0.95 + g * 1.5); if (a < 0.01) return null; const hot = Math.min(1, m + g * 0.4); return [255, 214 + 36 * hot, 120 + 110 * hot, a]; }), 0.9);
  const SB = [bx0 - 2, by0 - 2, bx1 - bx0 + 5, by1 - by0 + 5];
  out['btc-sheen'] = webp(lightCanvas(W, SB, (X, Y) => { const m = whiteOf(X, Y); return m > 0.02 ? [255, 246, 214, m] : null; }), 0.92);
  // ---- THE FLARE's inside light: the envelope's shape, hottest at the mouth (the burner's heat), fading up the panels; the gores' own light
  //      kept (a seam stays a little darker)
  const mouth = [(Ls[eBot - 6] + Rs[eBot - 6]) / 2, eBot];
  let Lmax = 0; for (let y = eTop; y <= eBot; y++) for (let x = Math.max(0, Ls[y] | 0); x <= Rs[y]; x++) { const [r, g, bb] = rgb(x, y); Lmax = Math.max(Lmax, r * 0.5 + g * 0.4 + bb * 0.1); }
  const EB = [BAL[0], BAL[1], BAL[2], eBot + 4 - BAL[1]];
  const envSoft = blur(env, W, H, 1, 2);   // (the inside light's edge a touch soft — the row fill steps at the mouth)
  out['btc-lit'] = webp(lightCanvas(W, EB, (X, Y) => { const a = Math.min(env[Y * W + X], envSoft[Y * W + X] * 1.15); if (!(a > 0.004)) return null; const [r, g, bb] = rgb(X, Y);
    const dm = Math.hypot((X - mouth[0]) / 190, (Y - mouth[1]) / 370), heat = Math.max(0, 1 - dm * 0.9), tex = 0.62 + 0.38 * Math.min(1, (r * 0.5 + g * 0.4 + bb * 0.1) / Lmax);
    return [255, 150 + 100 * heat, 50 + 150 * heat, a * (0.13 + 0.87 * Math.pow(heat, 1.25)) * tex]; }), 0.88);
  // ---- THE BLOOM: the envelope's outline blurred wide (a quarter size — it's soft light), warm orange
  { const q = 4, BB = [BAL[0] - 150, BAL[1] - 150, BAL[2] + 300, EB[3] + 300], w4 = Math.ceil(BB[2] / q), h4 = Math.ceil(BB[3] / q), f = new Float32Array(w4 * h4);
    for (let y = 0; y < h4; y++) for (let x = 0; x < w4; x++) { let s = 0; for (let j = 0; j < q; j++) for (let i = 0; i < q; i++) { const X = BB[0] + x * q + i, Y = BB[1] + y * q + j; if (X >= 0 && Y >= 0 && X < W && Y < H) s += env[Y * W + X]; } f[y * w4 + x] = s / (q * q); }
    const g = blur(f, w4, h4, 12, 3); let gm = 0; for (const v of g) gm = Math.max(gm, v);
    const c = canvas(w4, h4), x = c.getContext('2d'), d = x.createImageData(w4, h4);
    for (let k = 0; k < w4 * h4; k++) { const v = g[k] / gm; d.data[k * 4] = 255; d.data[k * 4 + 1] = 168 + 40 * v; d.data[k * 4 + 2] = 70 + 30 * v; d.data[k * 4 + 3] = Math.round(255 * Math.min(1, Math.pow(v, 1.3))); }
    x.putImageData(d, 0, 0); out['btc-bloom'] = webp(c, 0.9); out.bloomBox = BB; }
  // ---- Grok's plates: the glow (its light 621..1219 × 98..698, halved) + the coins plate's glints (576..1210 × 43..688, halved)
  out['btc-flame'] = webp(plateLight(await load('card-btc-fx-glow.png'), [621, 98, 600, 600], 0.5), 0.86);
  out['btc-glints'] = webp(plateLight(await load('card-btc-fx-coins.png'), [576, 43, 636, 646], 0.5, 0, 1, 520), 0.88);
  // ---- THE WATER's reflections: the harbor below the shore (the bright part only — the dark water stays the material's)
  const WY = 618;
  out['btc-water'] = webp(lightCanvas(W, [0, WY, W, H - WY], (X, Y) => { const [r, g, bb] = rgb(X, Y), m = Math.max(r, g, bb) - 58; if (m < 4) return null; const q = 255 / Math.max(r, g, bb); return [r * q, g * q, bb * q, Math.min(1, m / 140)]; }, 0.5), 0.86);
  // the hottest point of the glow plate (its core), in the plate's own px
  const G = pixels(await load('card-btc-fx-glow.png')); let gb = 0, gx = 0, gy = 0, sx = 0, sy = 0, sc = 0;
  for (let y = 0; y < G.height; y++) for (let x = 0; x < G.width; x++) { const i = (y * G.width + x) * 4, v = G.data[i] + G.data[i + 1] + G.data[i + 2]; if (v > gb) { gb = v; gx = x; gy = y; } if (v > 740) { sx += x; sy += y; sc++; } }
  // the burner's flame in the master (the brightest point under the envelope's mouth)
  let fb = 0, fx = 0, fy = 0; for (let y = eBot - 60; y < eBot + 30; y++) for (let x = 880; x < 950; x++) { const [r, g, bb] = rgb(x, y); if (r + g + bb > fb) { fb = r + g + bb; fx = x; fy = y; } }
  // the outline every 6 rows (the specs keep it for the tests + the log)
  const outline = []; for (let y = eTop; y <= eBot; y += 6) outline.push([y, Math.round(Ls[y]), Math.round(Rs[y])]);
  return { out, num: { env: [Math.round(Math.min(...outline.map(o => o[1]))), eTop, Math.round(Math.max(...outline.map(o => o[2]))), eBot], mouth: mouth.map(v => Math.round(v)), btc: [bx0, by0, bx1, by1], markBox: MB, sheenBox: SB, balloonBox: BAL, litBox: EB, rig: RIG, basket: [kx0, ky0, kx1, ky1], coins, patchBox: PB, flameCore: sc ? [+(sx / sc).toFixed(1), +(sy / sc).toFixed(1)] : [gx, gy], flameInMaster: [fx, fy], waterY: WY, outline } };
});
for (const [n, url] of Object.entries(res.out)) {
  if (typeof url !== 'string') continue;
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log('bloomBox', JSON.stringify(res.out.bloomBox));
console.log(JSON.stringify(res.num));
await b.close();
