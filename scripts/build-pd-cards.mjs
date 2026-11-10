// PD-5B — PRISM DROP's three cards are DRAWN IN CODE (js/fx/pd-cards.js — no art file). This bakes each card's STILL FRAME (the reduced-motion
// frame of its FULL card, the effect's own 2D path) into assets/vault/pd/<card>.webp = THE CARD'S MATERIAL (css/vault.css .vl-s-pd-*): what a
// place that draws no effect shows — the after-match tile (progress/moment.js#itemSwatch: a mini of the real art), a plain strip before the
// surface paints. Wherever the effect runs it paints its whole scene over it. Re-run after an edit to pd-cards.js / pd-specs.js:
//   node scripts/build-pd-cards.mjs "<browser>"      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/pd/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const files = await p.evaluate(async () => {
  const link = document.createElement('link'); link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Orbitron:wght@700;900&display=swap';
  document.head.append(link);
  await new Promise(r => { link.onload = r; link.onerror = r; setTimeout(r, 4000); });
  await document.fonts.load('900 40px Orbitron').catch(() => {});
  const { pdFirstKo, pdPerfect, pdComeback } = await import('/js/fx/pd-cards.js');
  const W = 400, H = 252, out = {};
  for (const [name, fx] of [['first-ko', pdFirstKo], ['perfect-clear', pdPerfect], ['comeback', pdComeback]]) {
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const x = c.getContext('2d'); x.scale(2, 2);
    fx.draw(x, { w: W, h: H, opts: { full: true, radius: 0 } }, fx.stillT || 0, { still: true, dpr: 2, q: 1 });
    // (the tile is ~78 pt wide: a 400 × 252 picture at 2× is plenty — kept small)
    const s = document.createElement('canvas'); s.width = W; s.height = H;
    s.getContext('2d').drawImage(c, 0, 0, W, H);
    out[name] = s.toDataURL('image/webp', 0.86);
  }
  return out;
});
for (const [n, d] of Object.entries(files)) {
  const buf = Buffer.from(d.split(',')[1], 'base64');
  writeFileSync(new URL(`${n}.webp`, OUT), buf);
  console.log(`assets/vault/pd/${n}.webp ${(buf.length / 1024).toFixed(1)} KB`);
}
await b.close();
