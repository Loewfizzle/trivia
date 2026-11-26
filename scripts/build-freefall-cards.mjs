// FREEFALL CARDS — THE ART (F4A — docs/freefall.md "THE CARDS"): SPLASHDOWN · TERMINAL VELOCITY · ROCK BOTTOM through JAYWALK's +
// HIGH RISE's card pipeline (scripts/build-highrise-cards.mjs). RAW ART OFF GIT (docs/harbor.md): Grok's masters (1920 × 1080 PNG) are
// READ from <NS_ART_SRC>\freefall\cards\ — or, while that folder is not there, from the owner's delivery Downloads\grok\freefall\cards\ —
// and NEVER copied into the repo; only the baked outputs are: assets/vault/ff/<art>.webp, 1280 × 720, q 0.84 (scaled down, nothing
// painted: no lettering, the left third dark). The picks (the owner, Nov 26): splashdown.png · terminal-velocity-v1.png (the ORANGE
// fire — NOT terminal-velocity.png) · rock-bottom.png; the -b files are unused.
// + THE PREVIEWS (with an out folder): each card's SLIM strip (358 × 64) and FULL card (358 × 226) drawn with the crops in
// js/fx/ff-specs.js — the picture set right, a 12-letter name's plate on the left — for the pass's look check; and the numbers the
// crops are judged by (where the hero sits across the strip, how dark the name's ground is).
//   node scripts/build-freefall-cards.mjs "<browser>" [previewDir]      (needs scripts/serve.mjs on :5173 — any page: it only lends its canvas)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ART_SRC } from './art-src.mjs';
import { FF_SPECS, FF_AW, FF_AH } from '../js/fx/ff-specs.js';

const BROWSER = process.argv[2], PREVIEW = process.argv[3] || null, BASE = process.env.E2E_BASE || 'http://localhost:5173';
/** the art's name → the master's file (the owner's picks) */
const MASTERS = { splashdown: 'splashdown.png', 'terminal-velocity': 'terminal-velocity-v1.png', 'rock-bottom': 'rock-bottom.png' };
const DELIVERED = 'C:\\Users\\benja\\Downloads\\grok\\freefall\\cards';
/** a master's path: NS_ART_SRC first, then the delivery folder; missing in both = the build STOPS, saying where it looked */
function master(file) {
  const a = join(ART_SRC, 'freefall', 'cards', file), b = join(DELIVERED, file);
  if (existsSync(a)) return a;
  if (existsSync(b)) return b;
  throw new Error(`RAW ART OFF GIT — the card master "${file}" is missing: looked in ${a} (NS_ART_SRC = ${ART_SRC}) and in ${b}. Only the baked outputs go into git.`);
}
const OUT = new URL('../assets/vault/ff/', import.meta.url);
mkdirSync(OUT, { recursive: true });
if (PREVIEW) mkdirSync(PREVIEW, { recursive: true });
const sources = {};
for (const S of Object.values(FF_SPECS)) sources[S.art] = `data:image/png;base64,${readFileSync(master(MASTERS[S.art])).toString('base64')}`;
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const res = await p.evaluate(async (SPECS, AW, AH, SRC) => {
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = SRC[n]; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const out = {}, prev = {}, report = {};
  for (const [id, S] of Object.entries(SPECS)) {
    const src = await load(S.art);
    if (Math.abs(src.width / src.height - AW / AH) > 0.002) throw new Error(`${S.art}: ${src.width} × ${src.height} is not 16 : 9`);
    // (the master is 1920 × 1080 — itself an upscale of a 1280 × 720 original: scaled back down, high quality)
    const c = canvas(AW, AH), cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(src, 0, 0, AW, AH);
    out[S.art] = c.toDataURL('image/webp', 0.84);
    const img = c;
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
    // the numbers: the hero's centre across the strip + its rows in the strip; the art's left third's light (the name's ground)
    const hx = (strip.ox + (S.hero[0] + S.hero[2] / 2) * strip.k) / 358, hy0 = (strip.oy + S.hero[1] * strip.k), hy1 = (strip.oy + (S.hero[1] + S.hero[3]) * strip.k);
    const d = c.getContext('2d').getImageData(0, 0, AW, AH).data; let L = 0, n = 0;
    for (let y = 0; y < AH; y += 2) for (let xx = 0; xx < 427; xx += 2) { const i = (y * AW + xx) * 4; L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
    report[id] = { art: S.art, heroAcrossStrip: +hx.toFixed(3), heroInStripY: [Math.round(hy0), Math.round(hy1)], pictureFromX: +(strip.ox / 358).toFixed(3), leftThirdL: +(L / n).toFixed(2) };
  }
  return { out, prev, report };
}, FF_SPECS, FF_AW, FF_AH, sources);
for (const [n, url] of Object.entries(res.out)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`assets/vault/ff/${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
if (PREVIEW) for (const [n, url] of Object.entries(res.prev)) writeFileSync(join(PREVIEW, `${n}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log(JSON.stringify(res.report, null, 1));
await b.close();
