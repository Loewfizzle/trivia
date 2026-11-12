// THE /board LINK PREVIEW (FR7 FIXES B — Group 1): the REAL velvet board (THE BOARD 2.0 B) shot at 1200×630 → assets/og-board.jpg
// (≤ 300 KB JPEG). Seed made-up rows first (the emulators only): node scripts/seed-og-board.mjs; serve: node scripts/serve.mjs 5173 --emu
//   node tests/integration/og-board-shot.mjs "<chromium>" [out.jpg] [--png]      (E2E_BASE = http://localhost:5173 by default)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import fs from 'node:fs';

const exe = process.argv[2];
const out = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'assets/og-board.jpg';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const url = guardUrl(`${BASE}/board?emu&slot=9`, 'og-board-shot');
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });
try {
  const page = await browser.newPage();
  // (the page laid out at 1200 / Z × 630 / Z, shot at Z — more rows in the frame, the image still 1200 × 630)
  const Z = Number(process.env.Z || 0.7);
  await page.setViewport({ width: Math.round(1200 / Z), height: Math.round(630 / Z), deviceScaleFactor: Z });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelectorAll('.sb-strip, .vl-strip, [data-strip]').length >= 4, { timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise(r => setTimeout(r, Number(process.env.SETTLE || 6000)));   // (a timed thing: the strips' effect frames + the velvet's fade-in settle)
  const buf = await page.screenshot({ type: 'jpeg', quality: Number(process.env.Q || 86) });
  fs.writeFileSync(out, buf);
  if (process.argv.includes('--png')) fs.writeFileSync(out.replace(/\.jpe?g$/, '.png'), await page.screenshot({ type: 'png' }));
  console.log(out, Math.round(buf.length / 1024), 'KB');
} finally { await browser.close(); }
