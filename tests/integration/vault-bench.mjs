// THE VAULT BENCH (THE VAULT 1B — SPEED FIRST): A FULL LOBBY of strips in THE CARD LAB's preview, measured with each cost switched off in
// turn (THE DIAGNOSTICS ROW's switches through &diag=). Why a bench of its own: on the owner's iPhone a 2D canvas is RASTERISED BY
// CoreGraphics on the CPU (in Safari's GPU process) — the page's timer reads "0 ms" while every call + every blended pixel still costs
// the frame. Chromium with a SOFTWARE canvas (--disable-accelerated-2d-canvas, the default here: SW=0 for the GPU canvas) rasterises
// on the CPU too, inside the page's own tasks, so the main thread's busy time per frame is the stand-in for the iPhone's raster cost.
//   node tests/integration/vault-bench.mjs "<chrome>"            (env: CPU=4 MIX=legend|samples|<card id> SW=0 SCROLL=1 RUNS=base,nofx…)
// Prints per configuration: fps, the mean + p95 frame, slow frames (> 20 ms), the main thread's busy ms per frame.
import puppeteer from './kit/puppeteer.mjs';

const BIN = process.argv[2] || process.env.CHROME;
const BASE = process.env.BASE || 'http://localhost:5173';
const CPU = Number(process.env.CPU || 4), MIX = process.env.MIX || 'legend', SW = process.env.SW !== '0', SCROLL = process.env.SCROLL === '1';
const RUNS = (process.env.RUNS || 'base,nofx,nolaser,nosprites,noglow,noemb').split(',');
const TIER = process.env.TIER ?? '2';
const VIEW = (process.env.VIEW || '402x874').split('x').map(Number), DPR = Number(process.env.DPR || 3);

const browser = await puppeteer.launch({ executablePath: BIN, headless: 'new', realCompositor: true,
  args: ['--no-sandbox', '--enable-gpu', ...(SW ? ['--disable-accelerated-2d-canvas'] : [])] });
const rows = [];
for (const run of RUNS) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: VIEW[0], height: VIEW[1], deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
  const cd = await p.target().createCDPSession();
  await cd.send('Performance.enable');
  const diag = run === 'base' ? '' : `&diag=${run.replace(/\+/g, ',')}`;
  await p.goto(`${BASE}/tests/integration/vault-preview.html?view=lobby&mix=${MIX}&tier=${TIER}${diag}`);
  await p.waitForFunction('!!(document.body.dataset.ready && window.__lab)', { timeout: 30000 });
  if (CPU > 1) await cd.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await new Promise(r => setTimeout(r, 1500));
  const m0 = await cd.send('Performance.getMetrics');
  const scroller = SCROLL ? cd.send('Input.synthesizeScrollGesture', { x: 200, y: 600, yDistance: -500, speed: 600, repeatCount: 3, repeatDelayMs: 0, gestureSourceType: 'touch' }).catch(() => {}) : null;
  const dts = await p.evaluate(n => new Promise(res => { const t = []; let last = 0; const f = x => { if (last) t.push(x - last); last = x; if (t.length < n) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); }), 180);
  if (scroller) await scroller;
  const m1 = await cd.send('Performance.getMetrics');
  const get = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
  const busy = (get(m1, 'TaskDuration') - get(m0, 'TaskDuration')) * 1000 / dts.length / Math.max(1, CPU);
  const st = await p.evaluate(() => ({ ...window.__lab.stats }));
  const sorted = [...dts].sort((a, b) => a - b), mean = dts.reduce((a, b) => a + b, 0) / dts.length;
  rows.push({ run, fps: +(1000 / mean).toFixed(1), mean: +mean.toFixed(1), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), slow: dts.filter(d => d > 20).length,
    busyMs: +busy.toFixed(2), tier: st.tier, mp: st.mp, jsMs: st.ms });
  await ctx.close();
}
await browser.close();
console.log(`THE VAULT BENCH — ${MIX} · ${SW ? 'SOFTWARE canvas (the iPhone stand-in)' : 'GPU canvas'} · CPU ${CPU}× · ${VIEW.join('×')} @${DPR} · tier ${TIER}${SCROLL ? ' · SCROLLING' : ''}`);
console.table(rows);
console.log('(busyMs = the main thread\'s busy time per frame, in UNTHROTTLED ms — the raster cost the iPhone pays in its GPU process)');
