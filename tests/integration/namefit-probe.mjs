// BOARD 2.0 A — THE FULL CARD's NAME ON ONE LINE (THE BTC CARD's known issue): every full card with the widest 12 (W × NAME_MAX) + MAXIMILIANOS
// at 390 / 402 / 430 → which cards print the player's name on TWO lines, at what size. A probe (no pass / fail): the cardfit harbor group holds
// the rule. node tests/integration/namefit-probe.mjs "<browser>" [cards=a,b] (serve.mjs on :5173)
import puppeteer from './kit/puppeteer.mjs';
const exe = process.argv[2], only = process.argv[3] || '';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: exe, headless: 'new' });
const out = {};
for (const w of [390, 402, 430]) for (const name of ['WWWWWWWWWWWW', 'MAXIMILIANOS']) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await p.goto(`${BASE}/tests/integration/plate-preview.html?only=full&lv=100&name=${name}${only ? `&cards=${only}` : ''}`);
  await p.waitForFunction('window.__ready', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 900));
  const r = await p.evaluate(() => [...document.querySelectorAll('.vl-fc')].map(c => { const n = c.querySelector('.vl-fc-name'); return { card: c.dataset.card, two: n.classList.contains('fit-2'), px: Math.round(parseFloat(getComputedStyle(n).fontSize) * 10) / 10 }; }));
  for (const x of r) if (x.two) (out[`${w} ${name}`] ||= []).push(`${x.card} ${x.px}px`);
  out[`${w} ${name} — cards`] = r.length;
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
