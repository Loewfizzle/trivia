// PRISM DROP preview screenshots + frame timing per world/tier (no Firebase).
//   node prism-shots.mjs "<browser path>" ./shots-prism [cpu throttle, default 1]
// Needs scripts/serve.mjs running on :5173.
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync } from 'node:fs';

const [, , browserPath, outDir = './shots-prism', cpuArg = '1'] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const CPU = Number(cpuArg);
const GPU = process.env.GPU === '1';
mkdirSync(outDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: browserPath, headless: 'new',
  args: GPU ? ['--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const worlds = (process.env.WORLDS || 'aurora,city,nebula,crystal,sunset').split(',');
const sizes = [[390, 844], [412, 915]];
const errors = [];
const report = [];
for (const w of worlds) {
  for (let v = 0; v < 3; v++) {
    for (const [width, height] of (v === 0 ? sizes : [sizes[0]])) {
      const page = await browser.newPage();
      page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${w}${v}: ${m.text()}`); });
      page.on('pageerror', e => errors.push(`${w}${v}: ${e.message}`));
      await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const extra = process.env.Q || '';
      await page.goto(`${BASE}/tests/integration/prism-preview.html?world=${w}&v=${v}&tier=2&bot=1&fx=${process.env.FX || '0'}&t=${3 + v}${extra}`, { waitUntil: 'networkidle0' });
      await sleep(Number(process.env.WAIT || 1500));
      await page.screenshot({ path: `${outDir}/p-${w}-${v}-${width}.png` });
      await page.close();
    }
  }
}
// frame timing at each tier (throttled CPU = a mid-range phone stand-in)
if (process.env.PERF !== '0') {
  for (const w of worlds) {
    for (const tier of [2, 1, 0]) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const cdp = await page.target().createCDPSession();
      if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      await page.goto(`${BASE}/tests/integration/prism-preview.html?world=${w}&v=0&tier=${tier}&bot=1&fx=1`, { waitUntil: 'networkidle0' });
      await sleep(4500);
      const f = await page.evaluate(() => window.__preview.frames.slice(-200));
      const s = [...f].sort((a, b) => a - b);
      const pct = p => +s[Math.floor(s.length * p)].toFixed(1);
      report.push({ world: w, tier, p50: pct(0.5), p75: pct(0.75), p95: pct(0.95), fps: +(1000 / (f.reduce((a, b) => a + b, 0) / f.length)).toFixed(1) });
      await page.close();
    }
  }
  console.table(report);
}
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no errors');
await browser.close();
