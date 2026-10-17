// NEON DISTRICT title: screenshots of the opening sequence (first visit) at a given size, for the visual review.
//   node title-shots.mjs "<browser path>" ./shots-title [390x844,412x915,1440x900]   (env GPU=1, RETURN=1)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const [, , browserPath, outDir = './shots-title', sizesArg = '390x844'] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
mkdirSync(outDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: browserPath, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])],
});
const errors = [];
// the boot screen alone (the app's JS blocked, so it stays up)
for (const [w, h] of (sizesArg.split(',').map(z => z.split('x').map(Number)))) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: w < 800 ? 2 : 1 });
  await p.setRequestInterception(true);
  p.on('request', r => (r.url().includes('/js/') ? r.abort() : r.continue()));
  await p.goto(`${BASE}/?emu`);
  await sleep(1200);
  await p.screenshot({ path: `${outDir}/t-boot-${w}.png` });
  await p.close();
}
for (const size of sizesArg.split(',')) {
  const [w, h] = size.split('x').map(Number);
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${size} ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) errors.push(`${size} ${m.text()}`); });
  const mobile = w < 800;
  await page.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${BASE}/?emu&intro=1`);
  await page.waitForSelector('.nd-gate.is-in', { timeout: 20000 });
  await sleep(500);
  await page.screenshot({ path: `${outDir}/t-0-boot-${w}.png` });
  await sleep(900);
  await page.screenshot({ path: `${outDir}/t-1-gate-${w}.png` });
  await page.click('.nd-gate');
  const tap = Date.now();
  for (const [ms, name] of [[500, 't-2-wave'], [1100, 't-3-lights'], [1650, 't-4-sign'], [2200, 't-5-steady'], [3800, 't-6-menu']]) {
    await sleep(Math.max(0, ms - (Date.now() - tap)));
    await page.screenshot({ path: `${outDir}/${name}-${w}.png` });
  }
  await sleep(1500);
  await page.screenshot({ path: `${outDir}/t-7-final-${w}.png` });
  console.log(size, JSON.stringify(await page.evaluate(() => window.__district && window.__district.scene())));
  await ctx.close();
}
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
