// JAYWALK CARDS (Nov 12 night — docs/harbor/passes/jaywalk-cards.md) — SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY's art: Grok's masters + FX plates
// (art/jaywalk-cards/src/ — copies of the owner's Downloads\grok\jaywalk\cards; never the originals, never the -b backups) → assets/vault/jw/*.webp.
// Built like REDLINE + PHOTO FINISH (scripts/build-oc-cards.mjs): the masters converted (1280 × 720) with the owner's two marks BAKED here:
//   · RIGHT OF WAY — the tiny lettering on the snapback's strap painted out (each row of the strap = its own plain pink, the median of the row)
//   · CLOSE ENCOUNTER — the cars' pink / cyan trails faded down where they enter the left third (the lower-left corner only: the plate's calm)
// The FX plates are light on PURE BLACK (Grok black-pointed + edge-feathered them — measured: every border pixel 0): each turned into light WITH
// ALPHA (alpha = its brightest channel, the colour divided out — drawn 'lighter' it adds back exactly the plate's light, never a black box), cropped
// to its light (js/fx/jw-specs.js#PLATES — the boxes) + halved. fx-hop's FIRST THIRD faded to clear (it starts at 11.6 % across: under the plate).
// What MOVES is the effect's (js/fx/jw-cards.js).
//   node scripts/build-jaywalk-cards.mjs "<browser>"      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PLATES } from '../js/fx/jw-specs.js';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/jw/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const files = await p.evaluate(async PLATES => {
  const SRC = '/art/jaywalk-cards/src/';
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = SRC + n; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const webp = (c, q = 0.86) => c.toDataURL('image/webp', q);
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const of = img => { const c = canvas(img.width, img.height); c.getContext('2d').drawImage(img, 0, 0); return c; };
  /** light on black → light with alpha; `mask(x, y)` (original px) scales the alpha (the hop's faded first third) */
  function lightAlpha(c, ox = 0, oy = 0, k = 1, mask = null) {
    const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const m = Math.max(px[i], px[i + 1], px[i + 2]);
      if (m < 3) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      const q = i / 4, mk = mask ? mask(ox + (q % c.width) / k, oy + Math.floor(q / c.width) / k) : 1;
      const a = Math.min(255, m * mk), s = 255 / m;
      px[i] = Math.min(255, px[i] * s); px[i + 1] = Math.min(255, px[i + 1] * s); px[i + 2] = Math.min(255, px[i + 2] * s); px[i + 3] = a;
    }
    x.putImageData(d, 0, 0); return c;
  }
  function crop(img, sx, sy, sw, sh, k) { const c = canvas(Math.round(sw * k), Math.round(sh * k)), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height); return c; }
  const out = {}, report = {};
  // ---- SONIC BOOM (converted only)
  out['sonic-boom'] = webp(of(await load('sonic-boom.png')), 0.84);
  // ---- CLOSE ENCOUNTER: the trails in the left third's lower corner faded down (x 300 → 520 ramps back to full, from y 520 down)
  {
    const c = of(await load('close-encounter.png')), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), px = d.data;
    let before = 0, after = 0;
    for (let yy = 500; yy < c.height; yy++) for (let xx = 0; xx < 560; xx++) {
      const i = (yy * c.width + xx) * 4, k = 1 - 0.8 * (1 - sm(300, 520, xx)) * sm(520, 610, yy);
      if (xx < 427) before += px[i] + px[i + 1] + px[i + 2];
      px[i] *= k; px[i + 1] *= k; px[i + 2] *= k;
      if (xx < 427) after += px[i] + px[i + 1] + px[i + 2];
    }
    x.putImageData(d, 0, 0);
    report.closeLeftThirdLower = { before: Math.round(before / 1e3), after: Math.round(after / 1e3) };
    out['close-encounter'] = webp(c, 0.84);
  }
  // ---- RIGHT OF WAY: the strap's lettering (x 930 → 966, y 192 → 199 — the dots read "WIKI & WE" in a tight zoom) → each row its plain pink
  {
    const c = of(await load('right-of-way.png')), x = c.getContext('2d'), X0 = 929, X1 = 967, Y0 = 191, Y1 = 200;
    const d = x.getImageData(X0, Y0, X1 - X0, Y1 - Y0), px = d.data, W = X1 - X0;
    const med = a => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
    let changed = 0;
    for (let r = 0; r < Y1 - Y0; r++) {
      const row = [0, 1, 2].map(ch => med(Array.from({ length: W }, (_, q) => px[(r * W + q) * 4 + ch])));
      for (let q = 0; q < W; q++) {
        const i = (r * W + q) * 4, dl = Math.abs(px[i] - row[0]) + Math.abs(px[i + 1] - row[1]) + Math.abs(px[i + 2] - row[2]);
        // (only what differs from the row — the marks; the strap's ends blend: the first + last 3 px keep half their own)
        const e = Math.min(q, W - 1 - q), w = e >= 3 ? 1 : 0.5 + e / 6;
        if (dl > 18) changed++;
        for (let ch = 0; ch < 3; ch++) px[i + ch] = px[i + ch] * (1 - w) + row[ch] * w;
      }
    }
    x.putImageData(d, X0, Y0);
    report.strapPixelsRepainted = changed;
    out['right-of-way'] = webp(c, 0.84);
  }
  // ---- the FX plates
  for (const [n, [bx, by, bw, bh]] of Object.entries(PLATES)) {
    const img = await load(`fx-${n}.png`), c = crop(img, bx, by, bw, bh, 0.5);
    // (measure: the plate's border must be black — Grok's feather — and nothing of its light outside the box)
    const full = of(img).getContext('2d').getImageData(0, 0, img.width, img.height).data;
    let edge = 0, outside = 0;
    for (let yy = 0; yy < img.height; yy++) for (let xx = 0; xx < img.width; xx++) {
      const i = (yy * img.width + xx) * 4, m = Math.max(full[i], full[i + 1], full[i + 2]);
      if ((xx < 16 || yy < 16 || xx >= img.width - 16 || yy >= img.height - 16) && m > edge) edge = m;
      if (m > 8 && (xx < bx || yy < by || xx >= bx + bw || yy >= by + bh)) outside++;
    }
    report[n] = { edgeMax: edge, lightOutsideBox: outside };
    const mask = n === 'hop' ? (ox, oy) => sm(150, 360, ox) : null;   // (the arc's first third → clear)
    out[`jw-${n}`] = webp(lightAlpha(c, bx, by, 0.5, mask), 0.86);
  }
  return { out, report };
}, PLATES);
for (const [n, url] of Object.entries(files.out)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log(JSON.stringify(files.report, null, 1));
await b.close();
