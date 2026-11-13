// THE TRI-VISION (Nov 12 night — docs/harbor/passes/jaywalk-cards.md) — JAYWALK's ROOF POSTER: Grok's approved billboard.png (a copy in
// art/jaywalk-billboard/src/ — never the original; 1280 × 640) → assets/city/jaywalk/billboard.webp, with the owner's mark BAKED: the dark square
// patch on the back of the kid's cap (the snapback's opening — x 926 → 972, y 162 → 191) painted out to plain cap pink (each column between the
// pink above + the strap below).
// FR7 FIXES C (the owner's iPhone, Nov 13 — "can't even see what this billboard says"): RE-CROPPED TIGHT on the kid + the car's headlights at the
// POSTER's own 848 : 448 (HOLD'EM's box — js/screens/harbor/jaywalk-art.js): the source window CROP (x 144 → 1280, 600 tall from y −73 — the night
// sky above the image's top continued from its own top rows) puts the kid right of centre (~0.65 across), his cap just under JAYWALK, the headlights
// at the right; then LIFTED (a gamma lift, contrast round the mid-tones, the saturation up — the neon street + the hoodie brighter, the blacks kept
// black) so under the billboard's lamps it glows like the HOLD'EM face.
// + THE LETTERING as path data (like scripts/build-holdem-art.mjs — no font load on the site): JAYWALK (was BUNGEE — C2: BOWLBY ONE, below) (a display face — the
// voxel look) + COMING SOON / NOW OPEN in POPPINS BOLD (HOLD'EM's bar) — Google Fonts, SIL OFL 1.1 → js/screens/harbor/jaywalk-glyphs.js (GENERATED).
//   node scripts/build-jaywalk-billboard.mjs "<chromium>"      (needs scripts/serve.mjs on :5173 for the art; the fonts from GitHub, dev only)
import fs from 'node:fs';
import puppeteer from '../tests/integration/kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
// FR7 FIXES C2 (the owner's iPhone, Nov 13 7 am — "JAYWALK needs a different font or something"): BOWLBY ONE — a HEAVY, wide display grotesque
// (no thin strokes; the tallest caps for their width of eight heavy faces tried — docs/harbor/passes/fr7-fixes-c2/jw-fonts.png) — for the word AND the band
const FONTS = {
  heavy: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bowlbyone/BowlbyOne-Regular.ttf',
};
const WORDS = {
  jaywalk: { font: 'heavy', text: 'JAYWALK', track: 0.03 },
  soon: { font: 'heavy', text: 'COMING SOON', track: 0.05 },
  open: { font: 'heavy', text: 'NOW OPEN', track: 0.05 },
};
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const page = await browser.newPage();
await page.goto(`${BASE}/404.html`);
// ---- the art: the cap patch painted out, halved, WebP
const art = await page.evaluate(async () => {
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('billboard.png')); i.src = '/art/jaywalk-billboard/src/billboard.png'; });
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const X0 = 924, X1 = 974, Y0 = 160, Y1 = 193, d = x.getImageData(X0, Y0, X1 - X0, Y1 - Y0), p = d.data, W = X1 - X0, H = Y1 - Y0;
  const at = (q, r) => (r * W + q) * 4, pink = (q, r) => { const i = at(q, r); return p[i] > 150 && p[i] > p[i + 1] * 1.6; };
  let changed = 0;
  for (let q = 0; q < W; q++) {
    // the column's pink above + below the patch (the cap's face + the strap) — the patch between = the dark (not-pink) run
    let top = -1, bot = -1;
    for (let r = 0; r < H; r++) if (pink(q, r)) { top = r; } else if (top >= 0) break;
    for (let r = H - 1; r >= 0; r--) if (pink(q, r)) { bot = r; } else if (bot >= 0) break;
    if (top < 0 || bot < 0 || bot - top < 2) continue;
    const a = at(q, top), b = at(q, bot);
    for (let r = top + 1; r < bot; r++) {
      if (pink(q, r)) continue;
      const u = (r - top) / (bot - top), i = at(q, r);
      for (let ch = 0; ch < 3; ch++) p[i + ch] = p[a + ch] * (1 - u) + p[b + ch] * u;
      changed++;
    }
  }
  x.putImageData(d, X0, Y0);
  // ---- FR7 FIXES C: the crop (the poster's 848 : 448 — CROP in source px; above y 0 = the image's own top rows, stretched: dark night sky)
  const CROP = { x: 144, y: -73, w: 1136, h: 600 }, OW = 848, OH = 448;
  const o = document.createElement('canvas'); o.width = OW; o.height = OH; const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
  const k = OW / CROP.w, topH = Math.max(0, -CROP.y) * k;
  if (topH > 0) ox.drawImage(c, CROP.x, 0, CROP.w, 3, 0, 0, OW, topH + 1);
  ox.drawImage(c, CROP.x, Math.max(0, CROP.y), CROP.w, CROP.h - Math.max(0, -CROP.y), 0, topH, OW, OH - topH);
  // ---- the LIFT: a gamma lift (the shadows opened), contrast round the mid-tones, saturation × 1.28 — blacks stay black (the floor kept)
  const od = ox.getImageData(0, 0, OW, OH), q = od.data;
  for (let i = 0; i < q.length; i += 4) {
    let r = q[i] / 255, g = q[i + 1] / 255, b = q[i + 2] / 255;
    r = Math.pow(r, 0.72); g = Math.pow(g, 0.72); b = Math.pow(b, 0.72);
    const con = v => Math.max(0, Math.min(1, (v - 0.5) * 1.12 + 0.5 + 0.02));
    r = con(r); g = con(g); b = con(b);
    const L = 0.299 * r + 0.587 * g + 0.114 * b, sat = 1.28;
    r = L + (r - L) * sat; g = L + (g - L) * sat; b = L + (b - L) * sat;
    const floor = v => Math.max(0, Math.min(1, v));
    q[i] = floor(r) * 255; q[i + 1] = floor(g) * 255; q[i + 2] = floor(b) * 255;
  }
  ox.putImageData(od, 0, 0);
  return { url: o.toDataURL('image/webp', 0.86), changed, w: OW, h: OH };
});
fs.mkdirSync(new URL('../assets/city/jaywalk/', import.meta.url), { recursive: true });
const buf = Buffer.from(art.url.split(',')[1], 'base64');
fs.writeFileSync(new URL('../assets/city/jaywalk/billboard.webp', import.meta.url), buf);
console.log(`billboard.webp ${art.w} × ${art.h}  ${(buf.length / 1024).toFixed(1)} KB · the cap patch: ${art.changed} px repainted`);
// ---- the lettering (--art-only: the art alone — the glyphs unchanged, no font download)
if (process.argv.includes('--art-only')) { await browser.close(); process.exit(0); }
await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js' });
const out = await page.evaluate(async (FONTS, WORDS) => {
  const fonts = {};
  for (const [k, url] of Object.entries(FONTS)) fonts[k] = opentype.parse(await (await fetch(url)).arrayBuffer());
  const res = {};
  for (const [id, w] of Object.entries(WORDS)) {
    const f = fonts[w.font], size = 1000, glyphs = f.stringToGlyphs(w.text);
    let x = 0; const parts = [];
    glyphs.forEach((g, i) => {
      parts.push(g.getPath(x, 0, size).toPathData(1));
      x += g.advanceWidth * size / f.unitsPerEm + (i < glyphs.length - 1 ? w.track * size : 0);
      if (i < glyphs.length - 1) x += f.getKerningValue(g, glyphs[i + 1]) * size / f.unitsPerEm;
    });
    const tmp = new opentype.Path(); tmp.extend(f.getPath(w.text, 0, 0, size)); const b0 = tmp.getBoundingBox();
    res[id] = { d: parts.join(''), w: Math.round(x), cap: Math.round(-b0.y1) };
  }
  return res;
}, FONTS, WORDS);
await browser.close();
const lines = Object.entries(out).map(([k, v]) => `  ${k}: { w: ${v.w}, cap: ${v.cap}, d: '${v.d}' },`);
fs.writeFileSync(new URL('../js/screens/harbor/jaywalk-glyphs.js', import.meta.url), `// GENERATED by scripts/build-jaywalk-billboard.mjs — never edit by hand. THE JAYWALK POSTER's lettering as SVG path data (1000 units = 1 em,
// the baseline at y 0, cap height \`cap\`, advance \`w\`): JAYWALK + the bar in Bowlby One (Google Fonts, SIL Open Font License 1.1).
export const JW_GLYPHS = Object.freeze({
${lines.join('\n')}
});
`);
console.log('wrote js/screens/harbor/jaywalk-glyphs.js', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { w: v.w, cap: v.cap, bytes: v.d.length }])));
