// HOLD'EM's GAME TILE (HE10 add-on — Ben): bakes tests/integration/holdem-tile.html (HOLD'EM's own felt, rail, card faces + lit chips) into
// assets/holdem/tile.webp — 216 × 216 (the tile's biggest real size, 72 pt, at 3×), ≤ 20 KB. js/ui/game-art.js#holdem shows it inside the
// tile's SVG (PICK A GAME, HOW TO PLAY's tabs, the title's game taps).
//   node scripts/build-holdem-tile.mjs "<chromium>" [--base http://localhost:5190] [--q 80]
// (needs a plain `node scripts/serve.mjs 5190` — the page loads the real modules)
import { writeFileSync, statSync } from 'node:fs';
import puppeteer from '../tests/integration/kit/puppeteer.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const p = await browser.newPage();
await p.setViewport({ width: 72, height: 72, deviceScaleFactor: 3 });
await p.goto(`${arg('base', 'http://localhost:5190')}/tests/integration/holdem-tile.html`, { waitUntil: 'networkidle0' });
await p.waitForFunction(() => document.body.dataset.ready, { timeout: 20000 });
await new Promise(r => setTimeout(r, 400));
const el = await p.$('#tile');
const buf = await el.screenshot({ type: 'webp', quality: Number(arg('q', 80)) });
const out = new URL('../assets/holdem/tile.webp', import.meta.url);
writeFileSync(out, buf);
console.log(`assets/holdem/tile.webp: ${statSync(out).size} bytes`);
await browser.close();
