// HOLD'EM (HE7) — "THE PORTRAIT DID NOT CHANGE", proved: the same preview states UPRIGHT from two servers (A = the commit before — a
// `git worktree` on :5174; B = the working tree, E2E_BASE / :5190), held still (prefers-reduced-motion: the living touches + the motion stop;
// the preview's fixed clock holds the timer bars), compared pixel by pixel. Each state is shot TWICE on A first — the A-vs-A diff is the
// noise floor — then A vs B. Prints each state's share of differing pixels (a channel off by > --thr) + the box of the change; writes
// <state>-<size>-a.png / -b.png / -diff.png (the changed pixels in magenta over a dimmed A) to --out. Exit 1 if any A-B goes past the floor.
//   node tests/integration/holdem-pixdiff.mjs "<browser>" [--a http://localhost:5174] [--b http://localhost:5190] [--sizes 390x844,430x932]
//        [--states myturn-8,flop-5] [--skin casino] [--out ./shots-holdem-diff] [--thr 8]
import puppeteer from './kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

const BROWSER = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('a', 'http://localhost:5174'), B = arg('b', process.env.E2E_BASE || 'http://localhost:5190');
const OUT = arg('out', './shots-holdem-diff').replace(/\/?$/, '/');
const THR = Number(arg('thr', 8));
const SIZES = arg('sizes', '390x844,430x932').split(',').map(s => s.split('x').map(Number));
const SKIN = arg('skin', '');
const ALL = { 'myturn-8': 'state=myturn&n=8', 'flop-5': 'state=flop&n=5', 'headsup': 'state=headsup', 'showdown-4': 'state=showdown&n=4',
  'allin-6': 'state=allin&n=6', 'cash-6': 'state=preflop&n=6&mode=cash', 'slider-8': 'state=slider&n=8', 'final-8': 'state=final&n=8',
  'spectate-6': 'state=spectate&n=6', 'se-myturn-8': 'state=myturn&n=8&st=20&sb=0' };
const STATES = (arg('states', '') ? arg('states').split(',') : Object.keys(ALL)).map(k => [k, ALL[k]]);
mkdirSync(OUT, { recursive: true });

// ---- a tiny PNG reader / writer (RGBA, 8-bit, no interlace — what Chromium writes)
function readPng(buf) {
  let p = 8, w = 0, h = 0, ct = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * 4), stride = w * bpp;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      line[i] = (line[i] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) out[(y * w + x) * 4 + k] = k < bpp ? line[x * bpp + k] : 255;
    prev = line;
  }
  return { w, h, d: out };
}
function writePng(path, { w, h, d }) {
  const crc = b => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) d.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
function diff(a, b) {
  let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  const out = { w: a.w, h: a.h, d: Buffer.alloc(a.d.length) };
  for (let i = 0; i < a.d.length; i += 4) {
    const off = Math.max(Math.abs(a.d[i] - b.d[i]), Math.abs(a.d[i + 1] - b.d[i + 1]), Math.abs(a.d[i + 2] - b.d[i + 2])) > THR;
    if (off) { n++; const p = i / 4, x = p % a.w, y = (p / a.w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    out.d[i] = off ? 255 : a.d[i] >> 2; out.d[i + 1] = off ? 0 : a.d[i + 1] >> 2; out.d[i + 2] = off ? 255 : a.d[i + 2] >> 2; out.d[i + 3] = 255;
  }
  return { share: n / (a.w * a.h), box: x1 < 0 ? null : [x0, y0, x1, y1], img: out };
}

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
async function shot(base, qs, w, h) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${base}/tests/integration/holdem-preview.html?${qs}${SKIN ? `&skin=${SKIN}` : ''}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__holdem && window.__holdem.layout && window.__holdem.layout(), { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1200));
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return readPng(Buffer.from(png));
}
let bad = 0;
for (const [w, h] of SIZES) for (const [name, qs] of STATES) {
  const a1 = await shot(A, qs, w, h), a2 = await shot(A, qs, w, h), b = await shot(B, qs, w, h);
  const floor = diff(a1, a2), ab = diff(a1, b), tag = `${name}-${w}x${h}`;
  writePng(`${OUT}${tag}-a.png`, a1); writePng(`${OUT}${tag}-b.png`, b); writePng(`${OUT}${tag}-diff.png`, ab.img);
  const same = ab.share <= floor.share + 1e-5;
  if (!same) bad++;
  console.log(`${same ? '  ✓' : '  ✗'} ${tag}: A-A ${(floor.share * 100).toFixed(3)} % · A-B ${(ab.share * 100).toFixed(3)} %${ab.box && !same ? ` (the change: ${ab.box.join(',')})` : ''}`);
}
await browser.close();
console.log(bad ? `\n${bad} portrait state(s) CHANGED` : '\nTHE PORTRAIT IS UNCHANGED');
process.exit(bad ? 1 : 0);
