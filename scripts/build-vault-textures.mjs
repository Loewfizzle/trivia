// THE VAULT — the card textures (THE VAULT 1A): COPIES of Grok's CC0 picks (Downloads\Grok\vault-textures — the originals are only READ,
// never written) → crop → tint → tone down → downscale (1050 × 660) → WebP in assets/vault/. Headless Chromium does the pixels (no npm
// image library in the repo): each source is drawn to a canvas, every pixel mapped through its tint ramp, exported as WebP.
//   node scripts/build-vault-textures.mjs "<chromium>" [<vault-textures folder>]
// Credits: js/ui/credits.js (CC0 — named anyway). Add a texture: one row in JOBS (its source, its crop, its ramp + contrast).
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BROWSER = process.argv[2];
const SRC = process.argv[3] || 'C:/Users/benja/Downloads/Grok/vault-textures';
const OUT = join(ROOT, 'assets', 'vault');
const W = 1050, H = 660;
// ramp: [at 0..1, '#rrggbb'] — the luminance (after its contrast) mapped through it; gain darkens it for under-a-name calm
const JOBS = [
  { out: 'brushed-gold.webp', src: 'brushed-metal/Metal009_2K-JPG_Color.jpg', contrast: 2.4, gain: 1, hp: true,
    ramp: [[0, '#5a3d0e'], [0.3, '#9a7128'], [0.5, '#c79d4c'], [0.72, '#e6c983'], [0.9, '#f8e6b0'], [1, '#fff8e2']] },
  { out: 'frost.webp', src: 'ice/Ice004_2K-JPG_Color.jpg', contrast: 1.8, gain: 0.82,
    ramp: [[0, '#030b12'], [0.35, '#0d2c40'], [0.62, '#2f6f8f'], [0.85, '#8cc9e2'], [1, '#e6f8ff']] },
  { out: 'glitter-pink.webp', src: 'glitter/Silver_Glitter_6.png', contrast: 1.5, gain: 0.9,
    ramp: [[0, '#2a0420'], [0.35, '#8e0f62'], [0.6, '#e2309c'], [0.82, '#ff8fd0'], [1, '#fff4fb']] },
  // THE VAULT 1C — the held-back cards' materials (pure CC0 / public domain only: no ShareTextures file, no unlisted source)
  { out: 'zebra.webp', src: 'animal-print/Zebra_skin.jpg', contrast: 1.7, gain: 1,
    ramp: [[0, '#050505'], [0.42, '#141414'], [0.56, '#cfcdc6'], [1, '#f4f2ea']] },
  { out: 'camo.webp', src: 'camo/Green-dominant_lowland_ERDL_camouflage_pattern_swatch_(cropped).png', keep: true, contrast: 1.05, gain: 0.78 },
  { out: 'camo-dark.webp', src: 'camo/Green-dominant_lowland_ERDL_camouflage_pattern_swatch_(cropped).png', contrast: 1.3, gain: 1,
    ramp: [[0, '#030508'], [0.35, '#081014'], [0.6, '#0e1a22'], [0.85, '#16242e'], [1, '#1e2e38']] },
  { out: 'velvet-oxblood.webp', src: 'velvet/velour_velvet_diff_2k.jpg', contrast: 1.5, gain: 0.92,
    ramp: [[0, '#140105'], [0.4, '#45081a'], [0.7, '#7a1428'], [0.9, '#a8303e'], [1, '#d0606a']] },
  { out: 'velvet-black.webp', src: 'velvet/velour_velvet_diff_2k.jpg', contrast: 1.5, gain: 1,
    ramp: [[0, '#020102'], [0.45, '#0a0507'], [0.75, '#1a0b10'], [0.92, '#2c1219'], [1, '#43202a']] },
  { out: 'carbon.webp', src: 'carbon-fiber/Fabric004_2K-JPG_Color.jpg', contrast: 1.8, gain: 1,
    ramp: [[0, '#040506'], [0.4, '#111317'], [0.65, '#24282e'], [0.88, '#454b55'], [1, '#6e7682']] },
  { out: 'marble-gold.webp', src: 'marble/Marble001_2K-JPG_Color.jpg', contrast: 2.2, gain: 1,
    ramp: [[0, '#7a5414'], [0.2, '#b8892e'], [0.36, '#d8c7a4'], [0.55, '#ece6da'], [0.8, '#f6f3ec'], [1, '#ffffff']] },
  { out: 'onyx.webp', src: 'marble/Marble016_2K-JPG_Color.jpg', contrast: 1.4, gain: 1,
    ramp: [[0, '#030203'], [0.5, '#0c090b'], [0.8, '#241c21'], [0.94, '#5a4a52'], [1, '#9a8890']] },
  { out: 'sapphire.webp', src: 'marble/Marble016_2K-JPG_Color.jpg', contrast: 1.5, gain: 1,
    ramp: [[0, '#01040f'], [0.45, '#061237'], [0.75, '#0f2a6e'], [0.92, '#2f5cb8'], [1, '#8fb2f2']] },
  { out: 'foil-gold.webp', src: 'ice/Ice002_2K-JPG_Color.jpg', contrast: 2.6, gain: 1, hp: true,
    ramp: [[0, '#5a3a08'], [0.3, '#a07420'], [0.5, '#d4a640'], [0.7, '#f0d27a'], [0.9, '#fff0b8'], [1, '#fffbe8']] },
  // THE VAULT 2A — PLATINUM (THE METAL CARD): the brushed metal (Metal009) as cold platinum — a quiet grain, nearly white at the top
  { out: 'platinum.webp', src: 'brushed-metal/Metal009_2K-JPG_Color.jpg', contrast: 1.7, gain: 1, hp: true,
    ramp: [[0, '#4a4f58'], [0.3, '#7a808a'], [0.5, '#a3a9b2'], [0.72, '#c8ccd3'], [0.9, '#e4e7eb'], [1, '#f7f9fb']] },
];

const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true });
const page = await browser.newPage();
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
for (const j of JOBS.filter(x => !ONLY.length || ONLY.includes(x.out))) {
  const buf = readFileSync(join(SRC, j.src));
  const mime = j.src.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const data = await page.evaluate(async (b64, mime, W, H, ramp, contrast, gain, hp, keep) => {
    const img = new Image(); img.src = `data:${mime};base64,${b64}`; await img.decode();
    // crop the centre to the card's aspect, then down to W × H
    const a = W / H, iw = img.width, ih = img.height;
    let sw = iw, sh = iw / a; if (sh > ih) { sh = ih; sw = ih * a; }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), p = d.data;
    // (hp: a HIGH-PASS — the source's slow blotches out, its fine grain kept: brushed metal, not wood)
    if (hp) {
      const s = document.createElement('canvas'); s.width = 48; s.height = 30; const sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(c, 0, 0, 48, 30);
      const b = document.createElement('canvas'); b.width = W; b.height = H; const bx = b.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(s, 0, 0, W, H);
      const q = bx.getImageData(0, 0, W, H).data;
      for (let i = 0; i < p.length; i += 4) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.max(0, Math.min(255, p[i + ch] - q[i + ch] + 128));
    }
    if (keep) {
      for (let i = 0; i < p.length; i += 4) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.max(0, Math.min(255, ((p[i + ch] / 255 - 0.5) * contrast + 0.5) * 255 * gain));
      x.putImageData(d, 0, 0);
      return c.toDataURL('image/webp', 0.84).split(',')[1];
    }
    let sum = 0; for (let i = 0; i < p.length; i += 4) sum += 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
    const mean = sum / (p.length / 4) / 255;
    const lut = new Uint8ClampedArray(256 * 3);
    for (let v = 0; v < 256; v++) {
      const l = Math.max(0, Math.min(1, (v / 255 - mean) * contrast + 0.5));
      let k = 0; while (k < ramp.length - 2 && l > ramp[k + 1][0]) k++;
      const [t0, c0] = ramp[k], [t1, c1] = ramp[k + 1], u = Math.max(0, Math.min(1, (l - t0) / (t1 - t0 || 1)));
      for (let ch = 0; ch < 3; ch++) lut[v * 3 + ch] = (c0[ch] + (c1[ch] - c0[ch]) * u) * gain;
    }
    for (let i = 0; i < p.length; i += 4) { const v = Math.round(0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]); p[i] = lut[v * 3]; p[i + 1] = lut[v * 3 + 1]; p[i + 2] = lut[v * 3 + 2]; p[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    return c.toDataURL('image/webp', 0.84).split(',')[1];
  }, buf.toString('base64'), mime, W, H, (j.ramp || [[0, '#000000'], [1, '#ffffff']]).map(([t, c]) => [t, hex(c)]), j.contrast, j.gain, !!j.hp, !!j.keep);
  const out = Buffer.from(data, 'base64');
  writeFileSync(join(OUT, j.out), out);
  console.log(`${j.out}  ${W}×${H}  ${(out.length / 1024).toFixed(0)} KB  ← ${j.src}`);
}
await browser.close();
