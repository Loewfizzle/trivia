// PD-3 — THE BLOOM CHOICE's measurement (docs/harbor/passes/pd-3.md): what copying PRISM's 3× board canvas into a GPU texture every frame would
// cost (the "bloom the whole board" design), against the light layer's own frame (the chosen design: the lights never leave the GPU).
//   node tests/integration/prism-upload-cost.mjs "<browser>" [cpu throttle, default 4]      (needs scripts/serve.mjs on :5173)
import puppeteer from './kit/puppeteer.mjs';

const [, , browserPath, cpuArg = '4'] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const cdp = await page.target().createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(cpuArg) });
await page.goto(`${BASE}/tests/integration/prism-preview.html?n=7&stack=6&bot=1&tier=3&st=47&sb=34`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 20000 });
await new Promise(r => setTimeout(r, 1500));
const r = await page.evaluate(() => new Promise(done => {
  const src = document.querySelector('.pd-board-c');
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const gl = cv.getContext('webgl2');
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const up = [], upSync = [];
  let n = 0;
  const px = new Uint8Array(4);
  const fb = gl.createFramebuffer();
  function step() {
    const t0 = performance.now();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    up.push(performance.now() - t0);
    // the same + a read-back (forces the copy to finish — the real cost a frame pays when it's on the critical path)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const t1 = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); upSync.push(performance.now() - t1 + up[up.length - 1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (++n < 180) requestAnimationFrame(step); else done({ w: src.width, h: src.height, up, upSync });
  }
  requestAnimationFrame(step);
}));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length * p)].toFixed(2); };
console.log(`board canvas ${r.w}×${r.h} (${(r.w * r.h * 4 / 1e6).toFixed(1)} MB a frame) · ${cpuArg}× CPU`);
console.log(`texImage2D: p50 ${q(r.up, 0.5)} ms · p95 ${q(r.up, 0.95)} ms   ·   + finishing the copy: p50 ${q(r.upSync, 0.5)} ms · p95 ${q(r.upSync, 0.95)} ms`);
// the chosen design: the light layer's own frame (quads + the bloom chain) — the view's CPU time with + without the layer drawing
const lay = await page.evaluate(() => window.__prism.look());
console.log(`light layer ${lay.size ? lay.size.join('×') : '-'} (CSS px × the tier's scale) — its CPU cost is inside the view's frame time (prism-shots.mjs PERF)`);
await browser.close();
