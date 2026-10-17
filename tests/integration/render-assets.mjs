// Renders the NEON SPEAKEASY app icons and the 1200×630 link-preview image with a local Chrome/Edge, from the real
// title scene and logo (tests/integration/brand.html). Needs scripts/serve.mjs running on :5173.
//   cd tests/integration && node render-assets.mjs "<browser path>"
// Writes to /assets. Re-run after changing the logo, the city or the game list.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const BROWSER = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = fileURLToPath(new URL('../../assets/', import.meta.url));

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true });
const page = await browser.newPage();
async function render(qs, w, h, file, { transparent = false, dpr = 1 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  await page.goto(`${BASE}/tests/integration/brand.html?${qs}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => window.__ready, { timeout: 30000 });
  await page.screenshot({ path: OUT + file, omitBackground: transparent, type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
  console.log('wrote', file);
}
await render('kind=icon&size=512&pad=0.14', 512, 512, 'icon-512.png');
await render('kind=icon&size=192&pad=0.14', 192, 192, 'icon-192.png');
await render('kind=icon&size=512&pad=0.24', 512, 512, 'icon-maskable-512.png');
await render('kind=icon&size=180&pad=0.14', 180, 180, 'apple-touch-icon.png');
await render('kind=icon&size=64&pad=0.04&round=1', 64, 64, 'favicon-64.png', { transparent: true });
await render('kind=og', 1200, 630, 'og.png');
await browser.close();
