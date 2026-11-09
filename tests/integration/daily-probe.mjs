// DFIX3 — THE DAILY SCREEN's PROBE (a dev tool, not a suite): saves SHARE TODAY's canvas itself as a PNG (what a phone would share — never the page
// around it) and measures the TODAY screen's real frame pacing (rAF) at 1× and 4× CPU on the preview page, both looks.
//   E2E_BASE=http://localhost:<port> node tests/integration/daily-probe.mjs "<browser>" [./shots-dfix3]
//   (PD-4's Group 0) SHARE_ONLY=1 = the share canvases only (no frame pacing); TAG=before|after = the files' prefix; each card also saved as the
//   360-px-wide downscale a text thread shows (…-360.png)
import puppeteer from './kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173', OUT = (process.argv[3] || './shots-dfix3').replace(/\/?$/, '/');
const TAG = process.env.TAG ? `${process.env.TAG}-` : '';
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const frames = (page, ms) => page.evaluate(ms => new Promise(res => { const t = []; let last = performance.now(); const t0 = last; const f = now => { t.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else { const s = t.slice(1).sort((a, b) => a - b); res({ fps: Math.round(10 * (t.length - 1) / ((now - t0) / 1000)) / 10, p95: Math.round(10 * s[Math.floor(s.length * 0.95)]) / 10, long: s.filter(x => x > 25).length }); } }; requestAnimationFrame(f); }), ms);
try {
  for (const look of ['night', 'day']) for (const state of ['swept', 'one']) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1080, height: 1350 });
    await p.goto(`${BASE}/tests/integration/daily-preview.html?view=share&state=${state}&look=${look}${process.env.Q || ''}`);   // (Q="&pw=locked&cc=caught" — another run)
    await p.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__share, { timeout: 30000 });
    const url = await p.evaluate(() => window.__share.toDataURL('image/png'));
    writeFileSync(`${OUT}${TAG}share-canvas-${state}-${look}.png`, Buffer.from(url.split(',')[1], 'base64'));
    const small = await p.evaluate(() => { const s = document.createElement('canvas'); s.width = 360; s.height = 450; const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(window.__share, 0, 0, 360, 450); return s.toDataURL('image/png'); });
    writeFileSync(`${OUT}${TAG}share-canvas-${state}-${look}-360.png`, Buffer.from(small.split(',')[1], 'base64'));
    console.log(`share canvas ${state} ${look} → ${OUT}${TAG}share-canvas-${state}-${look}.png (+ -360)`);
    await p.close();
  }
  if (!process.env.SHARE_ONLY) for (const look of ['night', 'day']) for (const cpu of [1, 4]) {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (cpu > 1) { const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
    await p.goto(`${BASE}/tests/integration/daily-preview.html?state=swept&look=${look}&stamp=1`);
    await p.waitForFunction(() => document.body.dataset.ready === '1' && document.querySelectorAll('.dy-ticket').length === 2, { timeout: 30000 });
    const f = await frames(p, 2500);
    console.log(`TODAY ${look} at ${cpu}× CPU (dpr 2, the stamp-down + the foil): ${f.fps} fps · p95 ${f.p95} ms · ${f.long} long frames`);
    await p.close();
  }
} finally { await browser.close(); }
