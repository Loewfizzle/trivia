// FR7 FIXES B — FR7-B's test line "a no-WebGL PRISM mount" (PD5 — an iPhone in Lockdown Mode, a blocklisted GPU: no WebGL at all): the REAL
// view (prism-preview.html) in Chromium with WebGL switched OFF (--disable-3d-apis), the night look + a bot playing, at 390 / 402 / 430 —
// 0 page errors over 4 s of play, the frame loop alive (frames counted) and HOLD + NEXT on screen. Before PD5's fix the night look threw on
// every frame (243 × "Cannot read …" in 3 s).
//   node tests/integration/prism-nowebgl.mjs "<chromium>"      (scripts/serve.mjs on :5173 — no emulators needed)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const exe = process.argv[2];
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--disable-3d-apis', '--disable-webgl', '--disable-webgl2'] });
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
try {
  for (const [w, h] of [[390, 844], [402, 874], [430, 932]]) {
    const p = await browser.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e && e.message || e)));
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await p.goto(guardUrl(`${BASE}/tests/integration/prism-preview.html?look=night&bot=1&state=play`, 'prism-nowebgl'), { waitUntil: 'load' });
    await p.waitForFunction(() => document.body.dataset.ready, { timeout: 30000 }).catch(() => {});
    const gl = await p.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
    await new Promise(r => setTimeout(r, 4000));   // (a timed window: 4 s of play)
    const fps = await p.evaluate(() => (window.__prism && window.__prism.fps ? window.__prism.fps().length : -1)).catch(() => -1);
    const side = await p.evaluate(() => /HOLD/.test(document.body.innerText) || !!document.querySelector('[class*="hold"]'));
    ok(!gl && errs.length === 0 && fps > 30 && side, `${w}×${h}: no WebGL (${gl ? 'WebGL ON — the flag failed' : 'off'}) · ${errs.length} page errors${errs.length ? ` (${errs[0].slice(0, 80)})` : ''} · ${fps} frames drawn · HOLD on screen ${side}`);
    await p.close();
  }
} finally { await browser.close(); }
const bad = results.filter(r => !r.ok);
console.log(`prism-nowebgl: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
