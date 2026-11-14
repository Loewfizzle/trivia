// SKINS 1 — THE PIXEL-IDENTICAL PROOF (docs/prism.md "THE SKINS"): a refactor of PRISM DROP's drawing code changes NO pixel.
//   node tests/integration/prism-skin-snap.mjs "<browser>" save <file.json> [./out-pngs]     the frames' hashes of the code as it is (the BEFORE)
//   node tests/integration/prism-skin-snap.mjs "<browser>" check <file.json> [./out-pngs]    the same frames now — every one must match (exit 1)
//   env: E2E_BASE (default http://localhost:5173)  SKINS=crayon,neon  PAGE=1 (+ the whole screen: the preview's DOM with its canvases hidden —
//        the panels, the rail, the top line, the podium: what the skin's CSS tokens paint)
// Part 1 (prism-skin-snap.html): the board, HOLD / NEXT, the minis, the day page — a fixed clock + a seeded random → exact PNGs.
// Part 2 (PAGE=1): prism-preview.html at 390 × 844 @3×, every canvas hidden + every animation / transition off → the DOM's own pixels.
// The baseline file is THIS MACHINE's (a browser's text + canvas rasters differ between machines) — a local tool, not a cloud check.
import puppeteer from './kit/puppeteer.mjs';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [, , browserPath, mode = 'check', file = './prism-skin-snap.json', outDir = ''] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SKINS = process.env.SKINS || 'crayon,neon';
const sha = buf => createHash('sha256').update(buf).digest('hex').slice(0, 20);
if (outDir) mkdirSync(outDir, { recursive: true });
const save = (name, buf) => { if (outDir) writeFileSync(`${outDir}/${name.replace(/[\\/]/g, '_')}.png`, buf); };

const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: ['--no-sandbox'] });
const frames = {};
try {
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.setViewport({ width: 800, height: 900, deviceScaleFactor: 3 });
  await page.goto(`${BASE}/tests/integration/prism-skin-snap.html?skins=${SKINS}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__snap', { timeout: 120000 });
  const n = await page.evaluate('window.__snap.length');
  for (let i = 0; i < n; i++) {
    const f = await page.evaluate(`(() => { const s = window.__snap[${i}]; return { name: s.name, w: s.w, h: s.h, url: s.url }; })()`);
    const buf = Buffer.from(f.url.split(',')[1], 'base64');
    frames[f.name] = `${f.w}x${f.h}:${sha(buf)}`;
    save(f.name, buf);
  }
  await page.close();
  if (process.env.PAGE === '1') {
    // the whole screen without its canvases: the preview's states, look by look
    const STATES = { play: 'n=5&stack=10&hold=1&under=1', final: 'n=5&state=final', final1: 'solo=1&mode=survival&state=final', count: 'n=5&state=count', spec: 'n=7&state=spec', ko: 'n=5&state=ko&after=600', buttons: 'n=5&stack=10&scheme=buttons&under=1', left: 'n=3&stack=6&slam=left&under=1' };
    for (const look of ['day', 'night']) for (const [name, qs] of Object.entries(STATES)) {
      const p = await browser.newPage();
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await p.goto(`${BASE}/tests/integration/prism-preview.html?look=${look}&${qs}&mute=1&reduced=1&st=47&sb=34&paper=notepad&seed=snap`, { waitUntil: 'load' });
      await p.waitForFunction('document.querySelector(".pd")', { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2500));
      // (a still: no canvas, no animation; the countdown's number + the clocks are time — hidden; HOLD / NEXT fade when the falling piece is under
      //  them — where it is at the shot is time too: their opacity pinned)
      await p.addStyleTag({ content: 'canvas { visibility: hidden !important; } *, *::before, *::after { animation: none !important; transition: none !important; } .pd-count-n, .pd-call-ring, .pd-sub, .pd-inc-tag, .pd-callout { visibility: hidden !important; } .pd-corner { opacity: 0.9 !important; }' });
      await new Promise(r => setTimeout(r, 400));
      const buf = await p.screenshot({ type: 'png' });
      frames[`screen/${look}-${name}`] = sha(buf);
      save(`screen_${look}-${name}`, buf);
      await p.close();
    }
  }
} finally { await browser.close(); }

if (mode === 'save') {
  writeFileSync(file, JSON.stringify(frames, null, 1));
  console.log(`saved ${Object.keys(frames).length} frames → ${file}`);
} else {
  const base = JSON.parse(readFileSync(file, 'utf8'));
  let bad = 0, same = 0;
  for (const [k, v] of Object.entries(base)) {
    if (frames[k] === v) same++;
    else { bad++; console.log(`DIFFERENT  ${k}   before ${v}   now ${frames[k] || '(missing)'}`); }
  }
  const extra = Object.keys(frames).filter(k => !(k in base));
  console.log(`${same} / ${Object.keys(base).length} frames IDENTICAL${bad ? ` · ${bad} DIFFERENT` : ''}${extra.length ? ` · ${extra.length} new (not in the baseline)` : ''}`);
  if (bad) process.exit(1);
}
