// GARDEN PARTY (THE GARDEN PARTY PASS, Nov 21 — docs/vault.md "GARDEN PARTY") — the LV 34 epic card's art: Grok's master + two FX plates
// (art/garden-party/src/ — COPIES of the owner's Downloads\grok\girl-cards\garden-*.png; never the originals; PINK RIOT + THE VANITY stay
// unbuilt, untouched) → assets/vault/gp/*.webp. Built like the JAYWALK cards (scripts/build-jaywalk-cards.mjs):
//   · the master converted (1280 × 720 — Grok's mid-tone grade already in it, notes-girl-cards.txt)
//   · garden-fx-petals.png is a REAL-ALPHA plate (8 cut-out petals, chroma-keyed by Grok): each petal found as its own island of alpha, cut
//     out + packed side by side into ONE sheet (gp-petals.webp) so the effect can DRIFT each one on its own; their boxes + centres printed
//     → js/fx/gp-specs.js#PETALS
//   · garden-fx-sparkle.png is light on PURE BLACK (Grok black-pointed + feathered it): turned into light WITH ALPHA (alpha = the brightest
//     channel, the colour divided out — drawn 'lighter' it adds back exactly the plate's light), cropped to its light + halved (gp-sparkle.webp);
//     its brightest STARBURSTS found (local peaks) → gp-specs.js#GLINTS — the effect twinkles those
//   · previews: the slim strip (360 × 64 · 330 × 64 · 430 × 64) + the full card (380 × 240) at the gp-specs.js crops → %TEMP%/gp-preview-*.png
//   node scripts/build-garden-party.mjs "<browser>"      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GP_SPECS, SPARKLE_BOX } from '../js/fx/gp-specs.js';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/gp/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const res = await p.evaluate(async ({ SPEC, SPARKLE_BOX }) => {
  const SRC = '/art/garden-party/src/';
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = SRC + n; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const webp = (c, q = 0.86) => c.toDataURL('image/webp', q);
  const of = img => { const c = canvas(img.width, img.height); c.getContext('2d').drawImage(img, 0, 0); return c; };
  const out = {}, report = {};
  // ---- the master (converted only)
  const master = await load('garden-master.png');
  out.garden = webp(of(master), 0.86);
  // ---- THE PETALS: islands of alpha (> 10) — 4-connected flood fill on the plate's own alpha
  const pc = of(await load('garden-fx-petals.png')), W = pc.width, H = pc.height, pd = pc.getContext('2d').getImageData(0, 0, W, H).data;
  const seen = new Uint8Array(W * H), isl = [];
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || pd[i * 4 + 3] <= 10) continue;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0, sx = 0, sy = 0;
    const st = [i]; seen[i] = 1;
    while (st.length) {
      const q = st.pop(), x = q % W, y = (q - x) / W, a = pd[q * 4 + 3];
      n++; sx += x * a; sy += y * a; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const nq of [q - 1, q + 1, q - W, q + W]) { if (nq < 0 || nq >= W * H || seen[nq]) continue; if (Math.abs((nq % W) - x) > 1) continue; if (pd[nq * 4 + 3] > 10) { seen[nq] = 1; st.push(nq); } }
    }
    if (n < 60) continue;   // (a stray speck — none expected)
    let aw = 0; for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) aw += pd[(yy * W + xx) * 4 + 3];
    isl.push({ x0: x0 - 2, y0: y0 - 2, w: x1 - x0 + 5, h: y1 - y0 + 5, cx: Math.round(sx / aw * 10) / 10 || (x0 + x1) / 2, cy: Math.round(sy / aw * 10) / 10 || (y0 + y1) / 2, n });
  }
  isl.sort((a, c) => a.cy - c.cy);
  // (packed in one row, 4 px apart — the effect reads each box)
  const sheetW = isl.reduce((s, r) => s + r.w + 4, 4), sheetH = Math.max(...isl.map(r => r.h)) + 8, sh = canvas(sheetW, sheetH), sx = sh.getContext('2d');
  let at = 4;
  const PETALS = isl.map(r => { sx.drawImage(pc, r.x0, r.y0, r.w, r.h, at, 4, r.w, r.h); const row = [at, 4, r.w, r.h, Math.round((r.x0 + r.w / 2) * 10) / 10, Math.round((r.y0 + r.h / 2) * 10) / 10]; at += r.w + 4; return row; });
  out['gp-petals'] = webp(sh, 0.9);
  report.petals = { islands: isl.length, sheet: [sheetW, sheetH], each: isl.map(r => ({ box: [r.x0, r.y0, r.w, r.h], px: r.n })) };
  // ---- THE SPARKLE: light on black → light with alpha, cropped to SPARKLE_BOX (the plate's light, measured below) + halved
  const sp = await load('garden-fx-sparkle.png'), sfull = of(sp).getContext('2d').getImageData(0, 0, sp.width, sp.height).data;
  let lx0 = sp.width, ly0 = sp.height, lx1 = 0, ly1 = 0, edge = 0;
  for (let yy = 0; yy < sp.height; yy++) for (let xx = 0; xx < sp.width; xx++) {
    const i = (yy * sp.width + xx) * 4, m = Math.max(sfull[i], sfull[i + 1], sfull[i + 2]);
    if ((xx < 16 || yy < 16 || xx >= sp.width - 16 || yy >= sp.height - 16) && m > edge) edge = m;
    if (m > 8) { if (xx < lx0) lx0 = xx; if (xx > lx1) lx1 = xx; if (yy < ly0) ly0 = yy; if (yy > ly1) ly1 = yy; }
  }
  report.sparkle = { edgeMax: edge, light: [lx0, ly0, lx1 - lx0 + 1, ly1 - ly0 + 1] };
  const [bx, by, bw, bh] = SPARKLE_BOX, k = 0.5, sc = canvas(Math.round(bw * k), Math.round(bh * k)), scx = sc.getContext('2d');
  scx.imageSmoothingQuality = 'high'; scx.drawImage(sp, bx, by, bw, bh, 0, 0, sc.width, sc.height);
  const sd = scx.getImageData(0, 0, sc.width, sc.height), spx = sd.data;
  for (let i = 0; i < spx.length; i += 4) {
    const m = Math.max(spx[i], spx[i + 1], spx[i + 2]);
    if (m < 3) { spx[i] = spx[i + 1] = spx[i + 2] = spx[i + 3] = 0; continue; }
    const s = 255 / m; spx[i] = Math.min(255, spx[i] * s); spx[i + 1] = Math.min(255, spx[i + 1] * s); spx[i + 2] = Math.min(255, spx[i + 2] * s); spx[i + 3] = m;
  }
  scx.putImageData(sd, 0, 0);
  out['gp-sparkle'] = webp(sc, 0.88);
  // ---- THE GLINTS: the starbursts' hearts = the brightest local peaks (a 4-point star is a bright core + long thin rays: a peak of the
  //      9 × 9 mean that is also the max of its 41 × 41 neighbourhood), the brightest 14, kept apart
  const lum = new Float32Array(sp.width * sp.height);
  for (let q = 0; q < lum.length; q++) { const i = q * 4; lum[q] = (sfull[i] + sfull[i + 1] + sfull[i + 2]) / 3; }
  const box = (x, y, r) => { let s = 0, n = 0; for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) { if (xx < 0 || yy < 0 || xx >= sp.width || yy >= sp.height) continue; s += lum[yy * sp.width + xx]; n++; } return s / n; };
  const cand = [];
  for (let yy = 24; yy < sp.height - 24; yy += 2) for (let xx = 24; xx < sp.width - 24; xx += 2) { const v = lum[yy * sp.width + xx]; if (v > 200) cand.push([xx, yy, box(xx, yy, 4)]); }
  cand.sort((a, c) => c[2] - a[2]);
  const GLINTS = [];
  for (const c of cand) { if (GLINTS.length >= 14) break; if (GLINTS.some(g => Math.hypot(g[0] - c[0], g[1] - c[1]) < 46)) continue; GLINTS.push([c[0], c[1], Math.round(c[2])]); }
  report.glints = GLINTS;
  // ---- previews (the CSS crop = gp-specs.js#gpMap) — the strip at three widths + the full card
  const gm = (w, h, crop) => { const kk = crop[3] === 'w' ? (w / 1280) * crop[2] : Math.max(w / 1280, h / 720) * (crop[2] || 1); return { k: kk, ox: (w - 1280 * kk) * (crop[0] / 100), oy: (h - 720 * kk) * (crop[1] / 100) }; };
  const prev = {};
  for (const [w, h, crop, n] of [[360, 64, SPEC.strip, 's360'], [330, 64, SPEC.strip, 's330'], [430, 64, SPEC.strip, 's430'], [380, 240, SPEC.full, 'f380']]) {
    const c = canvas(w * 3, h * 3), x = c.getContext('2d'); x.scale(3, 3); x.fillStyle = SPEC.ground; x.fillRect(0, 0, w, h);
    const M = gm(w, h, crop); x.drawImage(master, M.ox, M.oy, 1280 * M.k, 720 * M.k);
    // the plate's box (12 letters) + the hero box, outlined
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1;
    const hb = n[0] === 's' ? SPEC.hero : SPEC.heroFull; x.strokeRect(M.ox + hb[0] * M.k, M.oy + hb[1] * M.k, hb[2] * M.k, hb[3] * M.k);
    if (n[0] === 's') { x.fillStyle = 'rgba(5,4,10,0.84)'; x.fillRect(6, 8, 0.58 * w - 6, h - 16); x.fillStyle = '#fff8ee'; x.font = '700 18px sans-serif'; x.fillText('LOEWFIZZLE12', 14, 36); }
    prev[n] = c.toDataURL('image/png');
  }
  return { out, report, PETALS, GLINTS, prev };
}, { SPEC: GP_SPECS['card-garden'], SPARKLE_BOX });
for (const [n, url] of Object.entries(res.out)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`assets/vault/gp/${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
for (const [n, url] of Object.entries(res.prev)) writeFileSync(join(tmpdir(), `gp-preview-${n}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log('previews →', join(tmpdir(), 'gp-preview-*.png'));
console.log('report', JSON.stringify(res.report, null, 0));
console.log('PETALS =', JSON.stringify(res.PETALS));
console.log('GLINTS =', JSON.stringify(res.GLINTS));
await b.close();
