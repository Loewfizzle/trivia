// THE SHARE CARDS — the same pixels, run from the shell (SKINS 2B): opens tests/integration/share-same.html (each daily's OWN card against its
// expected copy in _old/, each daily alone inside SHARE TODAY, the foot's no-frame check, the name check), prints every row and exits 1 on a DIFF.
//   node tests/integration/share-same.mjs "<browser>"            (E2E_BASE=http://localhost:5173 — any local server; no Firebase)
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width: 1080, height: 1350 });
  await page.goto(`${BASE}/tests/integration/share-same.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1' && Array.isArray(window.__same), { timeout: 90000 });
  const rows = await page.evaluate(() => window.__same);
  for (const r of rows) { if (r.diff !== 0) bad++; console.log(`${r.diff === 0 ? 'SAME' : `DIFF ${r.diff}`}  ${r.card}`); }
  if (errors.length) { bad += errors.length; console.log(`PAGE ERRORS:\n${errors.join('\n')}`); }
  console.log(`${rows.length - rows.filter(r => r.diff !== 0).length} / ${rows.length} SAME`);
} finally { await browser.close(); }
process.exit(bad ? 1 : 0);
