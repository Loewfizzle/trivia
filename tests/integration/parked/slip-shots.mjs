// SLIPSTREAM look review without Firebase: slip-preview.html for every biome (and a gravity flip) at every size.
//   node slip-shots.mjs "<browser path>" ./shots-slip [seed] [only=dunes,storm] [sizes=0,2]
// Also prints per-tier frame timings at 4× CPU (GPU=1 uses the real GPU).
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync } from 'node:fs';

const [,, BROWSER, OUTA = './shots-slip', SEED = 'look'] = process.argv;
const OUT = OUTA.replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const only = (process.argv.find(a => a.startsWith('only=')) || '').slice(5).split(',').filter(Boolean);
const sizesArg = (process.argv.find(a => a.startsWith('sizes=')) || '').slice(6).split(',').filter(Boolean).map(Number);
const SIZES = [[390, 844], [412, 915], [844, 390], [915, 412], [1440, 900]];
const sizes = sizesArg.length ? sizesArg.map(i => SIZES[i]) : SIZES;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text()); });
const scenes = [['dunes', 'biome=dunes'], ['crystal', 'biome=crystal'], ['city', 'biome=city'], ['storm', 'biome=storm'], ['space', 'biome=space'], ['flip', 'flip=1'], ['start', 'x=0']];
for (const [name, qs] of scenes) {
  if (only.length && !only.includes(name)) continue;
  for (const [w, h] of sizes) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w >= 1200 ? 1 : 2, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:5173/tests/integration/slip-preview.html?seed=${SEED}&${qs}&ghosts=5`);
    await sleep(name === 'flip' ? 5200 : 2600);
    await page.screenshot({ path: `${OUT}look-${name}-${w}x${h}.png` });
    const st = await page.evaluate(() => window.__state);
    console.log(name, w, h, JSON.stringify(st));
  }
}
if (process.env.PERF) {
  const cdp = await page.target().createCDPSession();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const t of [2, 1, 0]) {
    await page.goto(`http://localhost:5173/tests/integration/slip-preview.html?seed=${SEED}&biome=storm&ghosts=7&tier=${t}`);
    await sleep(5000);
    const f = await page.evaluate(() => window.__perf.slice(60));
    const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)].toFixed(1); };
    console.log(`tier ${t}: frame p50 ${q(f.map(x => x[1]), 0.5)} p95 ${q(f.map(x => x[1]), 0.95)} · work p50 ${q(f.map(x => x[0]), 0.5)} p95 ${q(f.map(x => x[0]), 0.95)} ms`);
  }
}
await browser.close();
