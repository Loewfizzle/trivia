// HIGH RISE REVIEW FIX B — THE SIX HERO SHOTS for THE SHARE CARD (B · THE POSTER — the owner's pick, Downloads\NEON\highrise-share-B.png;
// docs/highrise.md "THE SHARE CARD"). scripts/build-highrise-billboard.mjs is the pattern: the test page's `?poster=hero&shot=<id>`
// (poster.js#runHero — the REAL night scene staged the same every time, seen by THE HERO CAMERA) in a tall viewport (the stage 900 × 1500
// css × dpr 2 = an 1800 × 3000 frame: the 4 : 5 crop is never upscaled) → each shot 1080 × 1350:
//   assets/highrise/share/<id>.webp (what ships — the card draws the band's one, share.js) + <id>.png into Downloads\NEON\highrise-fix-b\hero\
//   node scripts/build-highrise-heroes.mjs "<chromium>" [outDir] [--only=<id>,…]     (needs scripts/serve.mjs on :5173)
import fs from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import puppeteer from '../tests/integration/kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
/** the shots (poster.js HEROES — the same ids, in the same order) */
const IDS = ['rooftops', 'skyline', 'clouds', 'stars', 'space', 'mothership'];
/** the WebP's quality (the browser's own encoder — no tool on the build machine): small, no banding on the dark sky */
const Q = Number(process.env.HERO_Q || 0.8);
const OUT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : join(homedir(), 'Downloads', 'NEON', 'highrise-fix-b', 'hero');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
fs.mkdirSync(OUT, { recursive: true });
const ASSETS = new URL('../assets/highrise/share/', import.meta.url);
fs.mkdirSync(ASSETS, { recursive: true });
const png = u => Buffer.from(u.split(',')[1], 'base64');
const rows = [];
for (const id of IDS.filter(i => !only.length || only.includes(i))) {
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 900, height: 1500, deviceScaleFactor: 2 });
  await p.goto(`${BASE}/highrise-play?poster=hero&shot=${id}&tier=2`, { waitUntil: 'load' });
  const end = Date.now() + 90000;
  let res = null;
  while (Date.now() < end && !res) {
    res = await p.evaluate(() => window.__hiHero || (window.__hiHeroErr ? { err: window.__hiHeroErr } : null)).catch(() => null);
    if (!res) await new Promise(r => setTimeout(r, 250));
  }
  if (!res || res.err) { console.error(`${id}: the shot never came`, res && res.err, errs); await browser.close(); process.exit(1); }
  const webp = await p.evaluate(async (u, q) => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q); }, res.png, Q);
  const wb = png(webp);
  fs.writeFileSync(new URL(`${id}.webp`, ASSETS), wb);
  fs.writeFileSync(join(OUT, `${id}.png`), png(res.png));
  rows.push(`${id}: the frame ${res.frame.w} × ${res.frame.h} · the top at ${res.top.toFixed(3)} of the card · ${(wb.length / 1024).toFixed(1)} KB${errs.length ? ` — page errors: ${errs.join(' | ')}` : ''}`);
  await p.close();
}
await browser.close();
console.log(`→ assets/highrise/share/*.webp + ${OUT}\n${rows.join('\n')}`);
