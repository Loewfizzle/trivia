// CITY C group 3 — THE STRIP MATCH: a slim card in a list shows its MATERIAL (css/vault.css .vl-s-*), then its live effect fades in over it;
// when the two frame the picture differently, the strip visibly swaps to a ZOOMED one (BUZZED LIGHTYEAR's was the clearest). This shoots every
// strip that has an effect TWICE at a phone size — its material alone + its live effect painted (.fx-on) — and compares them on a coarse grid
// (16 × 4 px cells, luminance): a framing mismatch moves whole cells; the effect's own motion moves few. Exit 1 when a card is over --max.
//   node strip-match.mjs "<browser>" [--size 402] [--max 9] [--only id,id] [--out dir] [--still]   (--still: the effects' still frame — the motion out, the framing left)   (scripts/serve.mjs on :5173)
import puppeteer from './kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const STILL = argv.includes('--still'), W = Number(opt('size', 402)), MAX = Number(opt('max', 9)), ONLY = opt('only', 'all'), OUT = opt('out', '');
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: argv[0], headless: true });
const p = await b.newPage();
await p.setViewport({ width: W, height: 900, deviceScaleFactor: 2 });
await p.goto(`${BASE}/tests/integration/fullcard-preview.html?strips=${ONLY}${STILL ? '&still=1' : ''}`, { waitUntil: 'networkidle0', timeout: 90000 });
await p.waitForFunction('document.body.dataset.ready', { timeout: 60000 });
const ids = await p.evaluate('window.__stripIds');
const rows = [];
if (OUT) mkdirSync(OUT, { recursive: true });
for (const id of ids) {
  const m = await p.$(`[id="m-${id}"]`), l = await p.$(`[id="l-${id}"]`);
  await l.evaluate(e => e.scrollIntoView({ block: 'center' }));
  const painted = await p.waitForFunction(i => { const e = document.getElementById(`l-${i}`); return e && e.classList.contains('fx-on'); }, { timeout: 8000 }, id).then(() => true, () => false);
  await new Promise(r => setTimeout(r, 450));   // (the material's image in + two frames of the effect)
  const [a, c] = [await m.screenshot({ encoding: 'base64' }), await l.screenshot({ encoding: 'base64' })];
  const d = await p.evaluate(async (A, C) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${s}`; });
    const [ia, ic] = await Promise.all([load(A), load(C)]);
    const gw = Math.round(ia.width / 32), gh = Math.round(ia.height / 8), cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const lum = img => { x.clearRect(0, 0, gw, gh); x.drawImage(img, 0, 0, gw, gh); const D = x.getImageData(0, 0, gw, gh).data, o = []; for (let i = 0; i < D.length; i += 4) o.push(0.3 * D[i] + 0.59 * D[i + 1] + 0.11 * D[i + 2]); return o; };
    const la = lum(ia), lc = lum(ic); let s = 0; for (let i = 0; i < la.length; i++) s += Math.abs(la[i] - lc[i]);
    return s / la.length;
  }, a, c);
  rows.push({ id, d: +d.toFixed(1), painted });
  if (OUT && d > MAX) { writeFileSync(`${OUT}/${id}-material.png`, Buffer.from(a, 'base64')); writeFileSync(`${OUT}/${id}-live.png`, Buffer.from(c, 'base64')); }
}
await b.close();
rows.sort((x, y) => y.d - x.d);
for (const r of rows) console.log(`${r.d > MAX ? 'OVER' : 'ok  '} ${String(r.d).padStart(5)}  ${r.id}${r.painted ? '' : '  (the effect never painted)'}`);
const over = rows.filter(r => r.d > MAX && r.painted);
console.log(`${rows.length} strips at ${W} pt · ${over.length} over ${MAX}`);
process.exit(over.length ? 1 : 0);
