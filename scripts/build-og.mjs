// THE LINK PREVIEW (CITY C 0b) — composite a crisp, LARGE "NEON SPEAKEASY" title onto a city still → a 1200 × 630 JPEG (≤ 300 KB).
// The app's display font (Orbitron 900, Google Fonts), clean type over a dark backing glow — not the city's neon tubes. Readable at
// iMessage's preview size (check the 300-px copy it writes beside the output).
//   node scripts/build-og.mjs <in.jpg> <out.jpg> [--browser <chrome.exe>]
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [IN, OUT] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const bi = process.argv.indexOf('--browser');
const BROWSER = bi > 0 ? process.argv[bi + 1] : 'C:\\Users\\benja\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
if (!IN || !OUT) { console.error('usage: node scripts/build-og.mjs <in.jpg> <out.jpg>'); process.exit(1); }
const img = `data:image/jpeg;base64,${fs.readFileSync(IN).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=block">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0b0618; }
  .bg { position: absolute; inset: 0; background: url(${img}) center / cover; }
  /* the dark backing glow — hides the old neon sign + gives the type its ground */
  .scrim { position: absolute; left: 50%; top: 150px; width: 1240px; height: 380px; transform: translate(-50%, -50%);
    background: radial-gradient(closest-side, rgba(8, 3, 22, .94) 0%, rgba(8, 3, 22, .86) 52%, rgba(8, 3, 22, .5) 78%, rgba(8, 3, 22, 0) 100%); }
  /* the old sign's small SPEAKEASY line (between the new two) — a tighter dark band over it */
  .scrim2 { position: absolute; left: 50%; top: 200px; width: 760px; height: 70px; transform: translate(-50%, -50%);
    background: radial-gradient(closest-side, rgba(8, 3, 22, .97) 0%, rgba(8, 3, 22, .9) 60%, rgba(8, 3, 22, 0) 100%); }
  .t { position: absolute; left: 0; right: 0; text-align: center; font-family: 'Orbitron', sans-serif; font-weight: 900; color: #fff; }
  .neon { top: 34px; font-size: 172px; line-height: 1; letter-spacing: .04em;
    text-shadow: 0 0 2px #fff, 0 0 18px rgba(255, 60, 172, .95), 0 0 46px rgba(255, 46, 160, .7), 0 6px 0 rgba(0, 0, 0, .55); }
  .speak { top: 214px; font-size: 64px; line-height: 1; letter-spacing: .22em; padding-left: .22em; color: #ffe3f3;
    text-shadow: 0 0 14px rgba(255, 60, 172, .75), 0 0 30px rgba(120, 60, 255, .55), 0 4px 0 rgba(0, 0, 0, .6); }
</style></head><body><div class="bg"></div><div class="scrim"></div><div class="scrim2"></div>
<div class="t neon">NEON</div><div class="t speak">SPEAKEASY</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('900 40px Orbitron'));
  if (!ok) throw new Error('Orbitron did not load');
  let q = 88, buf;
  for (; q >= 60; q -= 4) { buf = await page.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 300 * 1024) break; }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  // the iMessage-size check copy (300 px wide)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 0.25 });
  fs.writeFileSync(OUT.replace(/\.jpe?g$/i, '-300.png'), await page.screenshot({ type: 'png' }));
  console.log(`${OUT}: ${(buf.length / 1024).toFixed(1)} KB at q${q}`);
} finally { await browser.close(); }
