// FR7 FIXES C — THANKSGIVING's MAPLE LEAVES (the owner, Nov 13 — Grok's real leaves, approved): the 12 leaves of the sheet (art/thanksgiving-sign/src/
// leaves-sheet.png — 4 × 3 cells of 512, each leaf ≤ 400 px on flat #00FF00; COPIES — never the originals in Downloads\grok) → ONE atlas with alpha
// (assets/city/thanksgiving/leaves.webp) + its rects (leaves.json). Loaded ONLY in the Thanksgiving season, after the reveal (screens/harbor/
// leafbank.js) — never THE BOOT BUDGET.
//   THE KEY      alpha from GREENNESS (g − max(r, b)): the flat #00FF00 → 0, a warm leaf (g ≤ r — Grok despilled them) → 1, an edge pixel in between
//   THE DESPILL  the edge's colour UN-MIXED from the green it was blended with (c = a·leaf + (1 − a)·green → leaf), then g held ≤ r (a maple leaf is
//                warm — red, orange, gold: never green) — the thin green fringe on every edge GONE (the QA: every leaf at 4× on dark AND light)
//   THE ATLAS    each leaf trimmed to its alpha, down to ≤ LEAF px on its long side (two halvings — a clean downscale), packed 4 × 3
//   node scripts/build-thanksgiving-leaves.mjs "<browser>"   (needs scripts/serve.mjs on :5173) [--qa <dir>]  (the QA sheets: dark + light at 4×)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const qi = process.argv.indexOf('--qa'), QA = qi > 0 ? process.argv[qi + 1] : null;
const OUT = new URL('../assets/city/thanksgiving/', import.meta.url);
mkdirSync(OUT, { recursive: true });
export const LEAF = 168;            // the atlas leaf's long side (px) — a 42 pt leaf at 3× is 126 px: room to spare, never upscaled
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const res = await p.evaluate(async (LEAF, wantQa) => {
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('sheet')); i.src = '/art/thanksgiving-sign/src/leaves-sheet.png'; });
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const CELL = 512, leaves = [], stats = [];
  for (let n = 0; n < 12; n++) {
    const cx = (n % 4) * CELL, cy = Math.floor(n / 4) * CELL, c = cv(CELL, CELL), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, cx, cy, CELL, CELL, 0, 0, CELL, CELL);
    const d = x.getImageData(0, 0, CELL, CELL), px = d.data;
    let x0 = CELL, y0 = CELL, x1 = -1, y1 = -1, edge = 0, greenLeft = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], bl = px[i + 2];
      const ex = g - Math.max(r, bl);                       // greenness: 255 on the flat key, ≤ 0 on a warm leaf
      let a = 1 - Math.max(0, Math.min(1, (ex - 6) / 228));
      if (a <= 0.02) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      let R = r, G = g, B = bl;
      if (a < 0.999) {                                       // un-mix the key: leaf = (c − (1 − a)·green) / a
        edge++;
        R = r / a; G = (g - (1 - a) * 255) / a; B = bl / a;
      }
      G = Math.min(G, R);                                    // THE DESPILL: a maple leaf's green never exceeds its red
      px[i] = Math.max(0, Math.min(255, R)); px[i + 1] = Math.max(0, Math.min(255, G)); px[i + 2] = Math.max(0, Math.min(255, B)); px[i + 3] = Math.round(a * 255);
      const q = i / 4, xx = q % CELL, yy = (q / CELL) | 0;
      if (a > 0.04) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    }
    // THE RIM (the source's matte is HARD — its outermost pixels carry the key's dark olive): the distance of every leaf pixel to the
    // transparency (rings 1…4); rings 1–3 RE-COLOURED from the leaf's own colour a few pixels in (the mean of the core pixels round them) —
    // ring 1 at a low alpha, ring 2 nearly whole: a clean anti-aliased edge, no olive, no green, the thin stems kept
    const W = CELL, ring = new Uint8Array(W * W);
    for (let q = 0; q < W * W; q++) ring[q] = px[q * 4 + 3] ? 9 : 0;
    for (let k = 1; k <= 4; k++) for (let q = 0; q < W * W; q++) {
      if (ring[q] !== 9) continue;
      const xx = q % W, yy = (q / W) | 0, low = v => v < k;
      if ((xx > 0 && low(ring[q - 1])) || (xx < W - 1 && low(ring[q + 1])) || (yy > 0 && low(ring[q - W])) || (yy < W - 1 && low(ring[q + W]))) ring[q] = k;
    }
    const inner = (q, R) => {
      const xx = q % W, yy = (q / W) | 0; let r = 0, g = 0, bb = 0, n = 0;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const X = xx + dx, Y = yy + dy; if (X < 0 || Y < 0 || X >= W || Y >= W) continue;
        const o = Y * W + X; if (ring[o] !== 9) continue; const i = o * 4; r += px[i]; g += px[i + 1]; bb += px[i + 2]; n++;
      }
      return n ? [r / n, g / n, bb / n] : null;
    };
    for (let q = 0; q < W * W; q++) {
      const k = ring[q]; if (!k || k > 3) continue;
      const i = q * 4;
      const c = inner(q, 5) || inner(q, 9); if (!c) continue;   // (a thin stem has no ring-9 core near: it keeps its own colour)
      const m = k === 3 ? 0.6 : 1;
      px[i] = px[i] * (1 - m) + c[0] * m; px[i + 1] = Math.min(px[i + 1] * (1 - m) + c[1] * m, px[i]); px[i + 2] = px[i + 2] * (1 - m) + c[2] * m;
      if (k === 1) px[i + 3] = Math.round(px[i + 3] * 0.45); else if (k === 2) px[i + 3] = Math.round(px[i + 3] * 0.88);
    }
    for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 20 && px[i + 1] > px[i] + 8) greenLeft++;
    x.putImageData(d, 0, 0);
    // trim + two halvings down to the leaf size
    const pad = 2, tw = x1 - x0 + 1 + pad * 2, th = y1 - y0 + 1 + pad * 2;
    const t = cv(tw, th); t.getContext('2d').drawImage(c, x0 - pad, y0 - pad, tw, th, 0, 0, tw, th);
    const k = LEAF / Math.max(tw, th);
    let s = t;
    while (s.width * 0.5 > tw * k * 1.05) { const h2 = cv(Math.round(s.width / 2), Math.round(s.height / 2)), hx = h2.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(s, 0, 0, h2.width, h2.height); s = h2; }
    const fin = cv(Math.round(tw * k), Math.round(th * k)), fx = fin.getContext('2d'); fx.imageSmoothingQuality = 'high'; fx.drawImage(s, 0, 0, fin.width, fin.height);
    leaves.push(fin); stats.push({ n: n + 1, src: [tw, th], w: fin.width, h: fin.height, edge, greenLeft });
  }
  // THE ATLAS: 4 × 3 cells of LEAF + 2
  const C = LEAF + 2, atlas = cv(C * 4, C * 3), ax = atlas.getContext('2d'), rects = [];
  leaves.forEach((l, n) => { const ox = (n % 4) * C + Math.floor((C - l.width) / 2), oy = Math.floor(n / 4) * C + Math.floor((C - l.height) / 2); ax.drawImage(l, ox, oy); rects.push([ox, oy, l.width, l.height]); });
  const out = { webp: atlas.toDataURL('image/webp', 0.9), rects, stats, size: [atlas.width, atlas.height] };
  // THE QA SHEETS: every leaf at 4× (its atlas pixels, nearest — the fringe shows as it is) on a dark AND a light ground
  if (wantQa) {
    out.qa = {};
    for (const [name, bg] of [['dark', '#0b0d1a'], ['light', '#f4efe4']]) {
      const S = 4, q = cv(C * 4 * S, C * 3 * S), qx = q.getContext('2d'); qx.fillStyle = bg; qx.fillRect(0, 0, q.width, q.height); qx.imageSmoothingEnabled = false;
      qx.drawImage(atlas, 0, 0, q.width, q.height); out.qa[name] = q.toDataURL('image/png');
    }
  }
  return out;
}, LEAF, !!QA);
await b.close();
writeFileSync(new URL('leaves.webp', OUT), Buffer.from(res.webp.split(',')[1], 'base64'));
writeFileSync(new URL('leaves.json', OUT), JSON.stringify({ v: 1, size: res.size, leaf: LEAF, rects: res.rects }) + '\n');
if (QA) { mkdirSync(QA, { recursive: true }); for (const [k, v] of Object.entries(res.qa)) writeFileSync(`${QA}/leaves-qa-${k}-4x.png`, Buffer.from(v.split(',')[1], 'base64')); }
for (const s of res.stats) console.log(`leaf ${String(s.n).padStart(2, '0')}: ${s.src.join('×')} → ${s.w}×${s.h} · edge px ${s.edge} · green left ${s.greenLeft}`);
console.log(`atlas ${res.size.join('×')} → assets/city/thanksgiving/leaves.webp (${Math.round(Buffer.from(res.webp.split(',')[1], 'base64').length / 1024)} KB)`);
