// THE DAILY MODULE's card art (DM2) — PERFECT WEEK: Grok's master (art/dm-cards/src/card-perfect-week.png — a copy of the owner's pick,
// Downloads\grok\dailies-cards-v2\card-perfect-week-backup.png; never the original) → assets/vault/dm/perfect-week.webp (1280 × 720, converted only —
// what moves is the effect's, js/fx/dm-cards.js). PENTHOUSE has no art file: it is DRAWN IN CODE (js/fx/ph-dial.js).
//   node scripts/build-dm-cards.mjs "<browser>"      (needs scripts/serve.mjs on :5173, or E2E_BASE)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/dm/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const files = await p.evaluate(async () => {
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = '/art/dm-cards/src/' + n; });
  const out = {};
  for (const [n, f] of [['perfect-week', 'card-perfect-week.png']]) {
    const i = await load(f); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0);
    out[n] = { data: c.toDataURL('image/webp', 0.84), w: i.width, h: i.height };
  }
  return out;
});
for (const [n, { data, w, h }] of Object.entries(files)) {
  const buf = Buffer.from(data.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`${n}.webp  ${w} × ${h}  ${(buf.length / 1024).toFixed(0)} KB`);
}
await b.close();
