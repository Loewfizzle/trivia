// HOLD'EM (HE7) — a quick look INSIDE the preview at a size: an element's box + its computed styles (debugging a layout, no shot).
//   node tests/integration/holdem-probe.mjs "<browser>" "<preview query>" 844x390 ".he-clock" [".he-leave" …]
// (E2E_BASE = the server — a plain `node scripts/serve.mjs 5190`.)
import puppeteer from './kit/puppeteer.mjs';
const [browserPath, qs, size, ...sels] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const base = process.env.E2E_BASE || 'http://localhost:5190';
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: [`--window-size=${w},${h}`] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.goto(`${base}/tests/integration/holdem-preview.html?${qs}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__holdem && window.__holdem.layout && window.__holdem.layout(), { timeout: 15000 });
await new Promise(r => setTimeout(r, 600));
for (const sel of sels) {
  const out = await page.evaluate(s => [...document.querySelectorAll(s)].slice(0, 4).map(el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return { box: [r.x, r.y, r.width, r.height].map(Math.round), hidden: el.hidden, display: cs.display, left: cs.left, top: cs.top, transform: cs.transform, width: cs.width };
  }), sel);
  console.log(sel, JSON.stringify(out));
}
await browser.close();
