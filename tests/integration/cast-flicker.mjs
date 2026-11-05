// CAST FLICKER (SHELL 2.0 B2 — the desktop group's cirrus re-check): a FLICKER measured, not judged by eye. Takes a shots.mjs --cast burst
// (every frame the page painted) → each frame's sky (the top 42 %) as a 12 × 4 grid of mean luminance → the frame-to-frame jumps + the
// FLICKERS (a cell that jumps > 1.5 levels and comes straight back within a frame — a cloud drifting never does that).
//   node shots.mjs "<browser>" --preview --city 2 --scenes sp-cirrus --sizes 1440x900 --idle --cast 6000 --out <dir>
//   node cast-flicker.mjs "<browser>" <dir>   → { frames, maxJump, p95, median, flickers }   (B2: 360 frames, max 0.54, 0 flickers)
import puppeteer from './kit/puppeteer.mjs';
import { readdirSync, readFileSync } from 'node:fs';
const dir = process.argv[3], files = readdirSync(dir).filter(f => /cast-.*\.jpg$/.test(f)).sort();
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: 'new' });
const p = await b.newPage();
const grids = [];
for (const f of files) {
  const url = `data:image/jpeg;base64,${readFileSync(`${dir}/${f}`).toString('base64')}`;
  grids.push(await p.evaluate(async u => {
    const i = new Image(); i.src = u; await i.decode();
    const c = document.createElement('canvas'); c.width = 360; c.height = Math.round(360 * i.height / i.width); const x = c.getContext('2d'); x.drawImage(i, 0, 0, c.width, c.height);
    const H = Math.round(c.height * 0.42), d = x.getImageData(0, 0, c.width, H).data, out = [];
    for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 12; gx++) {
      let s = 0, n = 0; for (let y = Math.floor(gy * H / 4); y < Math.floor((gy + 1) * H / 4); y++) for (let xx = gx * 30; xx < gx * 30 + 30; xx++) { const k = (y * c.width + xx) * 4; s += 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; n++; }
      out.push(s / n);
    }
    return out;
  }, url));
}
const jumps = [];
for (let i = 1; i < grids.length; i++) jumps.push(Math.max(...grids[i].map((v, k) => Math.abs(v - grids[i - 1][k]))));
const s = [...jumps].sort((a, z) => a - z);
// a FLICKER = a jump that comes straight back (up then down within 3 frames, both > 1.5 levels)
let flick = 0; for (let i = 2; i < grids.length; i++) for (let k = 0; k < 48; k++) { const a = grids[i - 2][k], m = grids[i - 1][k], c = grids[i][k]; if (Math.abs(m - a) > 1.5 && Math.abs(m - c) > 1.5 && Math.sign(m - a) === Math.sign(m - c)) flick++; }
console.log(JSON.stringify({ frames: grids.length, maxJump: +s[s.length - 1].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), median: +s[s.length >> 1].toFixed(2), flickers: flick }));
await b.close();
