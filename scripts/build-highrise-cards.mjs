// HIGH RISE CARDS — THE ART, PREPARED (S3 — docs/highrise.md "THE CARDS' ART"): ABOVE THE CLOUDS + TOP OF THE WORLD through JAYWALK's
// card pipeline (scripts/build-jaywalk-cards.mjs): Grok's masters (art/highrise-cards/src/ — COPIES of the owner's
// Downloads\grok\highrise\cards: above-the-clouds.png + top-of-the-world-v2.png as top-of-the-world.png; never the originals) →
// assets/vault/hi/<art>.webp, 1280 × 720, q 0.84 — converted only (no paint-out was needed: no lettering, the left third dark).
// + THE PREVIEWS (with an out folder): each card's SLIM strip (358 × 64) and FULL card (358 × 226) drawn with the crops in
// js/fx/hi-specs.js — the picture set right, a 12-letter name's plate on the left — for the pass's look check; and the numbers the
// crops are judged by (where the hero sits across the strip, how dark the name's ground is).
// **The cards themselves are S4's** (catalog entries, the achievements, the CSS): this only puts the art in the repo, ready.
//   node scripts/build-highrise-cards.mjs "<browser>" [previewDir]      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HI_SPECS, HI_AW, HI_AH } from '../js/fx/hi-specs.js';

const BROWSER = process.argv[2], PREVIEW = process.argv[3] || null, BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/hi/', import.meta.url);
mkdirSync(OUT, { recursive: true });
if (PREVIEW) mkdirSync(PREVIEW, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const res = await p.evaluate(async (SPECS, AW, AH) => {
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = `/art/highrise-cards/src/${n}.png`; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const out = {}, prev = {}, report = {};
  for (const [id, S] of Object.entries(SPECS)) {
    const img = await load(S.art);
    if (img.width !== AW || img.height !== AH) throw new Error(`${S.art}: ${img.width} × ${img.height}`);
    const c = canvas(AW, AH); c.getContext('2d').drawImage(img, 0, 0);
    out[S.art] = c.toDataURL('image/webp', 0.84);
    // the previews: the CSS mapping `px% py% / Z% auto` (strip: × the cover scale; full: by the width)
    const draw = (w, h, crop, k3, plate) => {
      const cv = canvas(w * k3, h * k3), x = cv.getContext('2d'); x.scale(k3, k3);
      const k = crop[3] === 'w' ? (w / AW) * crop[2] : Math.max(w / AW, h / AH) * (crop[2] || 1), ox = (w - AW * k) * (crop[0] / 100), oy = (h - AH * k) * (crop[1] / 100);
      x.fillStyle = S.ground; x.fillRect(0, 0, w, h);
      x.imageSmoothingQuality = 'high'; x.drawImage(img, ox, oy, AW * k, AH * k);
      // (the picture's own left edge fades into the ground — the strip's CSS does the same with a gradient)
      const g = x.createLinearGradient(ox, 0, ox + AW * k * 0.22, 0); g.addColorStop(0, S.ground); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(ox - 1, 0, AW * k * 0.22 + 1, h);
      if (plate) { x.fillStyle = 'rgba(5,4,10,0.84)'; x.fillRect(plate[0], plate[1], plate[2], plate[3]); x.fillStyle = '#fff8ee'; x.font = '700 15px sans-serif'; x.fillText('WWWWWWWWWWWW', plate[0] + 30, plate[1] + 19); x.font = '600 10px sans-serif'; x.fillText('LV 23', plate[0] + 30, plate[1] + 33); }
      return { url: cv.toDataURL('image/png'), k, ox, oy };
    };
    const strip = draw(358, 64, S.strip, 3, [8, 12, 176, 40]), full = draw(358, 226, S.full, 3, [12, 150, 190, 44]);
    prev[`${S.art}-strip`] = strip.url; prev[`${S.art}-full`] = full.url;
    // the numbers: the hero's centre across the strip; the art's left third's light (the name's ground)
    const hx = (strip.ox + (S.hero[0] + S.hero[2] / 2) * strip.k) / 358, hy0 = (strip.oy + S.hero[1] * strip.k), hy1 = (strip.oy + (S.hero[1] + S.hero[3]) * strip.k);
    const d = c.getContext('2d').getImageData(0, 0, AW, AH).data; let L = 0, n = 0;
    for (let y = 0; y < AH; y += 2) for (let xx = 0; xx < 427; xx += 2) { const i = (y * AW + xx) * 4; L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
    report[id] = { art: S.art, heroAcrossStrip: +hx.toFixed(3), heroInStripY: [Math.round(hy0), Math.round(hy1)], pictureFromX: +(strip.ox / 358).toFixed(3), leftThirdL: +(L / n).toFixed(2) };
  }
  return { out, prev, report };
}, HI_SPECS, HI_AW, HI_AH);
for (const [n, url] of Object.entries(res.out)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`assets/vault/hi/${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
if (PREVIEW) for (const [n, url] of Object.entries(res.prev)) writeFileSync(join(PREVIEW, `${n}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log(JSON.stringify(res.report, null, 1));
await b.close();
