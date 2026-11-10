// PFIX-B (FABLE REVIEW optional 17) — THE FIRST LOOK SWITCH: the real view (prism-preview.html), a bot playing at night, then THE GAME LOOK
// flipped to day (+ back, + again) — every frame of the switch recorded. The first night → day switch used to hitch (100 / 83 / 100 / 100 ms
// at 4× CPU — the day art warming); the crayon tooth + the doodle + the scribble's tile are now warmed in idle slices after GO. A REPORT (exit 0):
// each switch's worst frame + the frames over LIMIT ms. PFIX-B's numbers: docs/harbor/passes/pfix-b.md (what is left = the day paper arriving +
// the compositor; the paper loads only by day — PD-4).
//   node tests/integration/prism-lookswitch.mjs "<browser path>" [cpu, default 4]      env: GPU=1 (the Radeon — gpu-check.mjs first)  RUNS=3
// Needs scripts/serve.mjs on :5173.
import puppeteer from './kit/puppeteer.mjs';

const [, , browserPath, cpuArg = '4'] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const CPU = Number(cpuArg), RUNS = Number(process.env.RUNS || 3), LIMIT = Number(process.env.LIMIT || 34);
const GPU = process.env.GPU === '1';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: GPU ? ['--enable-gpu', '--ignore-gpu-blocklist'] : [] });
let fail = 0;
for (let run = 0; run < RUNS; run++) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const cdp = await page.target().createCDPSession();
  await page.goto(`${BASE}/tests/integration/prism-preview.html?n=7&stack=6&bot=1&look=night&st=47&sb=34`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 20000 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await sleep(Number(process.env.SETTLE || 6000));   // (the play after GO — the idle warm runs here)
  const flips = [];
  for (const lk of ['day', 'night', 'day']) {
    await page.evaluate(() => { window.__prism.lockTier(true); window.__prism.record(true); });
    await page.evaluate(l => { document.body.dataset.look = l; }, lk);
    await sleep(1500);
    const r = await page.evaluate(() => window.__prism.record(false));
    const worst = Math.max(...r.f), over = r.f.filter(x => x > LIMIT).length;
    flips.push(`${lk}: worst ${worst.toFixed(0)} ms, ${over} over ${LIMIT}`);
    if (over) fail++;
  }
  console.log(`run ${run + 1} (${CPU}× CPU${GPU ? ', GPU' : ''}): ${flips.join(' · ')}`);
  await page.close();
}
await browser.close();
console.log(`REPORT — ${fail} of ${RUNS * 3} switch(es) had a frame over ${LIMIT} ms`);
