// PIXEL DIFF — "no look change" proved: the same title preview from two servers (A = the commit before, a `git worktree` on :5174;
// B = the working tree on :5173), rendered still and compared pixel by pixel (C1.5; docs/testing.md).
//   node pixdiff.mjs "<browser>" [--a http://localhost:5174] [--b http://localhost:5173] [--city 2] [--size 402x874]
//                    [--scenes night,party,noon,golden] [--out ./shots-diff] [--thr 24] [--burst 8 --gap 250] [--aq '&flag=…']
// Still mode (default): reduced motion (prefers-reduced-motion: the city holds still) + a seeded Math.random on both sides, each
// shot taken once the city is settled (no bake, no crossfade, the neon steady). Each scene is shot TWICE on A first — the A-vs-A
// diff is the noise floor (anything that still moves) — then A vs B. A pixel "differs" when a channel moves by more than --thr.
// Prints per scene: the share of pixels that differ (A-A and A-B), the bounding box of the A-B change beyond the noise, and writes
// <scene>-a.png, -b.png, -diff.png (the changed pixels in magenta over a dimmed A) to --out.
// Burst mode (--burst N): motion ON, N frames --gap ms apart from each side for a side-by-side look (no diff: the beat and the
// clock differ between two pages) — <scene>-a-01.png … and a contact sheet <scene>-burst.png (A left, B right).
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('a', 'http://localhost:5174'), B = arg('b', process.env.E2E_BASE || 'http://localhost:5173');
const CITY = arg('city', '2');
const [VW, VH] = arg('size', '402x874').split('x').map(Number);
const OUT = (arg('out', './shots-diff')).replace(/\/?$/, '/');
const THR = Number(arg('thr', 24));
const BURST = Number(arg('burst', 0)), GAP = Number(arg('gap', 250));
const AQ = arg('aq', '');   // extra query for A only (e.g. --aq "&wheelbg=d": the old commit's flag for what B now does by default)
const AT = '&tz=America/Detroit&at=42.96,-85.67';
// the owner's preview moments (a Thursday night, a Saturday party, noon, golden hour) — no planes / birds (they fly on Math.random)
const SCENES = {
  night: 'when=2026-10-22T22:00&wx=clear&force=no-planes,no-birds',
  party: 'when=2026-10-24T23:00&wx=clear&force=no-planes,no-birds',
  noon: 'when=2026-10-22T12:30&wx=clear&force=no-planes,no-birds',
  golden: 'when=2026-10-22T18:20&wx=clear&force=no-planes,no-birds',
  halloween: 'when=2026-10-31T22:00&wx=clear&force=no-planes,no-birds',
  stpatrick: 'when=2027-03-17T22:00&wx=clear&force=no-planes,no-birds',
  // DT2: the blue hour, and each look without its clouds (a clouds pass proves the rest of the frame is untouched)
  dusk: 'when=2026-10-22T19:05&wx=clear&force=no-planes,no-birds',
  'night-nc': 'when=2026-10-22T22:00&wx=clear&force=no-planes,no-birds,no-clouds',
  'party-nc': 'when=2026-10-24T23:00&wx=clear&force=no-planes,no-birds,no-clouds',
  'dusk-nc': 'when=2026-10-22T19:05&wx=clear&force=no-planes,no-birds,no-clouds',
  'golden-nc': 'when=2026-10-22T18:20&wx=clear&force=no-planes,no-birds,no-clouds',
};
const names = arg('scenes', 'night,party,noon,golden').split(',');
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SEED = `(() => { let s = 0x2f6b1d; Math.random = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio', '--force-color-profile=srgb', '--disable-lcd-text'] });
async function shoot(base, q, still) {
  if (base === A && AQ) q += AQ;
  const page = await browser.newPage();
  if (still) await page.evaluateOnNewDocument(SEED);
  const mobile = VW < 800;
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
  if (still) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${base}/tests/integration/title-preview.html?${q}${AT}${CITY !== '1' ? `&city=${CITY}` : ''}`);
  const ready = `(() => { const d = window.__district; if (!d || !d.phase().done) return false; const h = d.harbor && d.harbor();
    const sign = document.querySelector('.nd-sign'); if (!sign || !(sign.classList.contains('is-steady') || sign.classList.contains('is-day'))) return false;
    return !h || (h.shown && !h.pending && !h.fading && (!h.rate || h.rate.fast !== 'bake')); })()`;
  const end = Date.now() + 30000;
  while (Date.now() < end && !(await page.evaluate(ready).catch(() => false))) await sleep(200);
  await page.evaluate("window.__district.setTier && window.__district.setTier(2)");
  const end2 = Date.now() + 15000;
  while (Date.now() < end2 && !(await page.evaluate(ready).catch(() => false))) await sleep(200);
  // (C4d: both sides AT REST before the shot — the title hides its dock + tagline ~7 s after the load (nd-idle); a side shot a moment
  // before it vs one after showed the whole dock as a 7 % "look change" at night)
  const end3 = Date.now() + 20000;
  while (still && Date.now() < end3 && !(await page.evaluate("document.body.classList.contains('nd-idle') || !document.body.classList.contains('nd-on')").catch(() => false))) await sleep(200);
  await sleep(1500);
  return page;
}
const png = async p => (await p.screenshot({ type: 'png' })).toString('base64');
// the diff, in a blank page's canvas (no PNG library in node)
const lab = await browser.newPage();
async function diff(a, b, noise) {
  return lab.evaluate(async (a, b, noise, thr) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${s}`; });
    const [ia, ib, inz] = await Promise.all([load(a), load(b), noise ? load(noise) : null]);
    const w = ia.width, h = ia.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const px = img => { x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = px(ia), db = px(ib), dn = inz ? px(inz) : null;
    const out = x.createImageData(w, h), o = out.data;
    let n = 0, nn = 0, beyond = 0, max = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0, p = 0; i < da.length; i += 4, p++) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      const dz = dn ? Math.max(Math.abs(da[i] - dn[i]), Math.abs(da[i + 1] - dn[i + 1]), Math.abs(da[i + 2] - dn[i + 2])) : 0;
      if (d > max) max = d;
      if (dz > thr) nn++;
      const hit = d > thr, real = hit && dz <= thr;
      if (hit) n++;
      if (real) { beyond++; const X = p % w, Y = (p / w) | 0; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
      if (real) { o[i] = 255; o[i + 1] = 0; o[i + 2] = 255; o[i + 3] = 255; }
      else if (hit) { o[i] = 255; o[i + 1] = 200; o[i + 2] = 0; o[i + 3] = 255; }
      else { o[i] = da[i] * 0.35; o[i + 1] = da[i + 1] * 0.35; o[i + 2] = da[i + 2] * 0.35; o[i + 3] = 255; }
    }
    x.putImageData(out, 0, 0);
    const N = w * h, dpr = window.devicePixelRatio || 1;
    return { pct: +(100 * n / N).toFixed(3), noise: +(100 * nn / N).toFixed(3), beyond, beyondPct: +(100 * beyond / N).toFixed(4), max, box: x1 < 0 ? null : [x0, y0, x1, y1], w, h, img: cv.toDataURL('image/png').split(',')[1] };
  }, a, b, noise, THR);
}
// the contact sheet: A frames on the left, B on the right, at half size
async function sheet(as, bs) {
  return lab.evaluate(async (as, bs) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${s}`; });
    const A = await Promise.all(as.map(load)), B = await Promise.all(bs.map(load));
    const w = A[0].width / 2, h = A[0].height / 2, cols = A.length;
    const cv = document.createElement('canvas'); cv.width = w * cols; cv.height = h * 2 + 8;
    const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, cv.width, cv.height);
    A.forEach((im, i) => x.drawImage(im, i * w, 0, w, h)); B.forEach((im, i) => x.drawImage(im, i * w, h + 8, w, h));
    return cv.toDataURL('image/png').split(',')[1];
  }, as, bs);
}

let worst = 0;
for (const name of names) {
  const q = SCENES[name] || name;
  if (BURST) {
    const shots = {};
    for (const [k, base] of [['a', A], ['b', B]]) {
      const p = await shoot(base, q, false);
      shots[k] = [];
      for (let i = 0; i < BURST; i++) { shots[k].push(await png(p)); await sleep(GAP); }
      await p.close();
      shots[k].forEach((s, i) => writeFileSync(`${OUT}${name}-${k}-${String(i + 1).padStart(2, '0')}.png`, Buffer.from(s, 'base64')));
    }
    writeFileSync(`${OUT}${name}-burst.png`, Buffer.from(await sheet(shots.a, shots.b), 'base64'));
    console.log(`${name.padEnd(10)} burst: ${BURST} frames ${GAP} ms apart from each side → ${OUT}${name}-burst.png (A top, B bottom)`);
    continue;
  }
  const pa = await shoot(A, q, true); const a1 = await png(pa); await pa.close();
  const pa2 = await shoot(A, q, true); const a2 = await png(pa2); await pa2.close();
  const pb = await shoot(B, q, true); const b1 = await png(pb); await pb.close();
  const r = await diff(a1, b1, a2);
  writeFileSync(`${OUT}${name}-a.png`, Buffer.from(a1, 'base64')); writeFileSync(`${OUT}${name}-b.png`, Buffer.from(b1, 'base64'));
  writeFileSync(`${OUT}${name}-diff.png`, Buffer.from(r.img, 'base64'));
  const dpr = r.w / VW, box = r.box ? r.box.map(v => Math.round(v / dpr)) : null;
  worst = Math.max(worst, r.beyondPct);
  console.log(`${name.padEnd(10)} A-A noise ${r.noise}% · A-B ${r.pct}% · beyond the noise ${r.beyondPct}% (${r.beyond} px, max Δ ${r.max})${box ? ` in pt [${box.join(', ')}]` : ''}`);
}
console.log(`(a pixel differs past Δ ${THR} on a channel; "beyond the noise" = differs A-B but not A-A — magenta in <scene>-diff.png, the noise in amber)`);
await browser.close();
