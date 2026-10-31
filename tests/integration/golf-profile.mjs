// NEON PAR render profile: every hole in golf-preview.html with 7 rolling ghosts, on the GPU, at a phone's
// pixel density and 4× CPU throttling. Prints draw calls / objects / three.js render() cost / frame pacing.
//   node golf-profile.mjs "<browser path>" [tier]
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)

const BROWSER = process.argv[2];
const TIER = process.argv[3] ?? '2';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const RATE = Number(process.env.RATE || 4);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
const cdp = await page.createCDPSession();
const rows = [];
for (let n = 1; n <= 9; n++) {
  await page.goto(`${BASE}/tests/integration/golf-preview.html?hole=${n}&tier=${TIER}&ghosts=7&at=tee`);
  await page.waitForFunction('!!window.__stats', { timeout: 30000 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await sleep(1500);
  const samples = [];
  for (let k = 0; k < 20; k++) { samples.push(await page.evaluate(() => window.__stats())); await sleep(150); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const s = samples[samples.length - 1];
  const r = samples.map(x => x.renderMs).sort((a, b) => a - b);
  rows.push({ hole: n, calls: s.calls, objects: s.objects, tris: s.triangles, renderMsP50: r[r.length >> 1], frameP50: s.p50, tier: s.tier });
}
console.table(rows);
await browser.close();
