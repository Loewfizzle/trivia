// PRISM DROP preview screenshots + frame timing (no Firebase) — PD-1: prism-preview.html mounts the REAL view.
//   node tests/integration/prism-shots.mjs "<browser path>" ./shots-prism [cpu throttle, default 1]
//   env: SETS=look,states,worlds (default look,states)  SIZES=390x844,402x874,430x932,1440x900  PERF=0 (skip the timing)  GPU=1  DSF=3
//        WAIT=ms before a shot   Q="&extra=1" added to every preview URL   ONLY=name,name (shoot only those)
// Needs scripts/serve.mjs running on :5173. Each phone size gets its real safe areas (iPhone 13/14 · 15/16 Pro · Pro Max).
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync } from 'node:fs';

const [, , browserPath, outDir = './shots-prism', cpuArg = '1'] = process.argv;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const CPU = Number(cpuArg);
const GPU = process.env.GPU === '1';
const DSF = Number(process.env.DSF || 3);
mkdirSync(outDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAFE = { 390: [47, 34], 393: [59, 34], 402: [62, 34], 412: [24, 16], 430: [59, 34] };
const sizes = (process.env.SIZES || '390x844,402x874,430x932').split(',').map(s => s.split('x').map(Number));
const sets = (process.env.SETS || 'look,states').split(',');
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const EXTRA = process.env.Q || '';

// name → preview query (every size)
const SHOTS = {
  look: {
    play5: 'n=5&stack=10',
    play7: 'n=7&stack=10',
    under: 'n=5&stack=4&under=1&hold=0',
    left: 'n=5&stack=10&slam=left',
    buttons: 'n=5&stack=10&scheme=buttons',
    rush: 'n=5&stack=10&rush=1',
    duel: 'n=3&stack=10&state=duel',
    slamdown: 'n=5&stack=10&down=1',
    hit: 'n=5&stack=10&hit=1',
  },
  states: {
    count: 'n=5&state=count',
    ko: 'n=5&state=ko',
    final: 'n=5&state=final',
    final2: 'n=1&state=final',
  },
  // PD-2: the rising ghost rows, the callouts, the tip, KO → Call the Winner → spectate, SURVIVAL + a solo SURVIVAL end
  pd2: {
    'inc1': 'n=5&stack=6&inc=1&rise=hot',
    'inc3': 'n=5&stack=6&inc=3&rise=mid',
    'inc6': 'n=5&stack=6&inc=6&rise=hot',
    'inc-fresh': 'n=5&stack=6&inc=3&rise=fresh',
    'inc-hot': 'n=5&stack=10&inc=3&rise=hot',
    'shatter': { q: 'n=5&stack=6&inc=6&rise=hot', js: 'window.__prism.counter(4)', w: 140 },
    'co-send': 'n=5&stack=8&callout=send&after=300',
    'co-blocked': 'n=5&stack=8&callout=blocked&after=300',
    'co-twist': 'n=5&stack=8&callout=twist&after=300',
    'co-b2b': 'n=5&stack=8&callout=b2b&after=300',
    'co-ko': 'n=5&stack=8&callout=ko&after=300',
    'tip': 'n=5&stack=0&fresh=1&tip=1&after=900',
    'kocard': 'n=5&stack=10&state=kocard&after=500',
    'call': 'n=5&state=ko&after=600',
    'spec3': 'n=2&state=spec',
    'spec8': 'n=7&state=spec',
    'surv': 'n=5&mode=survival&t=75000&stack=4',
    'surv-solo': 'solo=1&mode=survival&t=40000&stack=4',
    'surv-solo-end': 'solo=1&mode=survival&state=final&w=5600',
    'surv-final': 'n=5&mode=survival&state=final&w=5600',
  },
  worlds: Object.fromEntries(['aurora', 'city', 'nebula', 'crystal', 'sunset'].map(w => [`w-${w}`, `n=5&stack=10&world=${w}`])),
};

const browser = await puppeteer.launch({
  executablePath: browserPath, headless: 'new',
  args: GPU ? ['--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];
let n = 0;
for (const set of sets) {
  for (const [name, spec] of Object.entries(SHOTS[set] || {})) {
    // (PD-2: an entry may be { q, js, w } — js runs in the page just before the shot (a burst fired at the right moment), w = the wait after it)
    const qs = typeof spec === 'string' ? spec : spec.q;
    if (ONLY && !ONLY.has(name)) continue;
    for (const [width, height] of sizes) {
      const page = await browser.newPage();
      page.on('console', m => { if (m.type() === 'error') errors.push(`${name}@${width}: ${m.text()}`); });
      page.on('pageerror', e => errors.push(`${name}@${width}: ${e.message}`));
      const desk = width >= 900;
      await page.setViewport({ width, height, deviceScaleFactor: desk ? 1 : DSF, isMobile: !desk, hasTouch: !desk });
      const [st, sb] = desk ? [0, 0] : (SAFE[width] || [47, 34]);
      await page.goto(`${BASE}/tests/integration/prism-preview.html?${qs}&st=${st}&sb=${sb}${EXTRA}`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 15000 }).catch(() => errors.push(`${name}@${width}: never ready`));
      const own = /(?:^|&)w=(\d+)/.exec(qs);   // (PD-2: a shot's own wait)
      if (typeof spec === 'object' && spec.js) { await sleep(Number(process.env.WAIT || 800)); await page.evaluate(spec.js); await sleep(spec.w || 0); }
      else await sleep(own ? Number(own[1]) : Number(process.env.WAIT || (name.startsWith('final') ? 4200 : 1200)));   // (the podium frame's entrance runs ~3.5 s)
      await page.screenshot({ path: `${outDir}/${name}-${width}.png` });
      n++;
      await page.close();
    }
  }
}
console.log(`${n} shot(s) in ${outDir}`);

// frame timing: the real view, a bot playing, 3× at 390 (CPU throttled = a mid-range phone stand-in) — the board's DPR per tier
if (process.env.PERF !== '0') {
  const report = [];
  for (const tier of [2, 1, 0]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const cdp = await page.target().createCDPSession();
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await page.goto(`${BASE}/tests/integration/prism-preview.html?n=7&stack=6&bot=1&tier=${tier}&st=47&sb=34${EXTRA}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    await page.evaluate(() => { window.__prism.fps().length = 0; });
    await sleep(Number(process.env.PERF_MS || 5000));
    const r = await page.evaluate(() => ({ w: window.__prism.work ? window.__prism.work() : [], f: window.__prism.fps(), tier: window.__prism.tier(), dpr: window.__prism.layout().dpr, px: window.__prism.layout().px }));
    const s = [...r.f].sort((a, b) => a - b);
    const pct = p => (s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1) : 0);
    report.push({ tier, after: r.tier, boardDpr: r.dpr, cellPx: r.px, frames: s.length, p50: pct(0.5), p75: pct(0.75), p95: pct(0.95), cpuP75: r.w.length ? +[...r.w].sort((a, b) => a - b)[Math.floor(r.w.length * 0.75)].toFixed(2) : null, fps: s.length ? +(1000 / (s.reduce((a, b) => a + b, 0) / s.length)).toFixed(1) : 0 });
    await page.close();
  }
  console.table(report);
}
console.log(errors.length ? `ERRORS:\n${[...new Set(errors)].join('\n')}` : 'no errors');
await browser.close();
