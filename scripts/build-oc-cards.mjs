// OVERCLOCK CARDS (Nov 5 night) — REDLINE + PHOTO FINISH's art: Grok's masters + FX plates (art/oc-cards/src/ — copies of the owner's
// Downloads\grok\overclock-cards; never the originals) → assets/vault/oc/*.webp. The masters are only converted (1280 × 720). The FX plates
// are light on PURE BLACK: each is turned into light WITH ALPHA (alpha = its brightest channel, the colour divided out) so the card's
// effect can lay it over the art without a black box ever showing; they're cropped to their light + halved (soft light — keeps the deploy
// small). Baked here, not per frame:
//   · redline-heat — Grok's heat plate is an S-curve: its RIGHT CRESCENT (measured: a circle at 863,295 r 154) is scaled onto the dial
//     (the cap at 897,339) so the bright arc runs on the tick ring (r ≈ 225), then MASKED to the red zone (2 → 4:30 o'clock) — a soft ring
//     sector; the S's left half never shows
//   · redline-cap — the chrome centre cap cut out of the master (a feathered disc) so the game's needle pivots UNDER it
// What MOVES is the effect's (js/fx/oc-cards.js).
//   node scripts/build-oc-cards.mjs "<browser>"      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/oc/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const files = await p.evaluate(async () => {
  const SRC = '/art/oc-cards/src/';
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = SRC + n; });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const webp = (c, q = 0.86) => c.toDataURL('image/webp', q);
  /** light on black → light with alpha (premultiplied-looking: drawn 'lighter' it adds back exactly the plate's light) */
  function lightAlpha(c, gain = 1) {
    const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const m = Math.max(px[i], px[i + 1], px[i + 2]);
      if (m < 3) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      const a = Math.min(255, m * gain), k = 255 / m;
      px[i] = Math.min(255, px[i] * k); px[i + 1] = Math.min(255, px[i + 1] * k); px[i + 2] = Math.min(255, px[i + 2] * k); px[i + 3] = a;
    }
    x.putImageData(d, 0, 0); return c;
  }
  /** a crop of an image, scaled */
  function crop(img, sx, sy, sw, sh, k) { const c = canvas(Math.round(sw * k), Math.round(sh * k)), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height); return c; }
  const out = {};
  // ---- the masters (converted only)
  for (const [n, f] of [['redline', 'redline-master.png'], ['photofinish', 'photofinish-master-v2.png']]) { const i = await load(f); const c = canvas(i.width, i.height); c.getContext('2d').drawImage(i, 0, 0); out[n] = webp(c, 0.84); }
  // ---- REDLINE's cap (a feathered disc, r 63 → 0 by 68)
  {
    const m = await load('redline-master.png'), CX = 897, CY = 339, R = 70, c = canvas(R * 2, R * 2), x = c.getContext('2d');
    x.drawImage(m, CX - R, CY - R, R * 2, R * 2, 0, 0, R * 2, R * 2);
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(R, R, 62, R, R, 67); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, R * 2, R * 2);
    out['redline-cap'] = webp(c, 0.9);
  }
  // ---- REDLINE's heat: the crescent onto the dial, masked to the red zone's ring sector
  let heatBox;
  {
    const h = await load('redline-fx-heat.png'), W = 1280, H = 720, CX = 897, CY = 339;
    const HC = [863.5, 295.3, 154.3], RING = 228, k = RING / HC[2];
    const c = canvas(W, H), x = c.getContext('2d');
    x.translate(CX, CY); x.scale(k, k); x.translate(-HC[0], -HC[1]); x.drawImage(h, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
    // the mask: a ring r 168 → 300 (feathered 28 px in + out) × the angles −40° → 58° (feathered 14° each end); 2 o'clock = −30°, 4:30 = 45°
    const d = x.getImageData(0, 0, W, H), px = d.data, sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4, dx = xx - CX, dy = yy - CY, r = Math.hypot(dx, dy), an = Math.atan2(dy, dx) * 180 / Math.PI;
      const mk = sm(168, 196, r) * (1 - sm(272, 300, r)) * sm(-40, -26, an) * (1 - sm(44, 58, an));
      px[i] *= mk; px[i + 1] *= mk; px[i + 2] *= mk;
      if (mk > 0 && Math.max(px[i], px[i + 1], px[i + 2]) > 3) { x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy); }
    }
    x.putImageData(d, 0, 0);
    heatBox = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
    out['redline-heat'] = webp(lightAlpha(crop(c, ...heatBox, 1)), 0.86);
  }
  // ---- REDLINE's sparks: the shower's half (x 560 → 1280), halved; its origin (600, 545) → (20, 272.5)
  out['redline-sparks'] = webp(lightAlpha(crop(await load('redline-fx-sparks.png'), 560, 0, 720, 720, 0.5)), 0.86);
  // ---- PHOTO FINISH's flash: the burst (x 400 → 880, y 120 → 600), halved; its centre (640, 360) → (120, 120)
  out['pf-flash'] = webp(lightAlpha(crop(await load('photofinish-fx-flash.png'), 400, 120, 480, 480, 0.5)), 0.86);
  // ---- PHOTO FINISH's sparks: x 90 → 1190, y 100 → 600, halved; the white-hot point (645, 360) → (277.5, 130)
  out['pf-sparks'] = webp(lightAlpha(crop(await load('photofinish-fx-sparks.png'), 90, 100, 1100, 500, 0.5)), 0.86);
  return { out, heatBox };
});
for (const [n, url] of Object.entries(files.out)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log('redline-heat box (art px):', JSON.stringify(files.heatBox));
await b.close();
