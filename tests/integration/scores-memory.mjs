// CITY D — 0b + 1: THE MEMORY KILLS (the owner's iPhone: DAILIES → SCORES → TODAY + ALL TIME froze, then the page reloaded itself; the same
// on CUSTOMIZE YOUR CARD — nothing reached /admin = an iOS memory kill). A phone at 390 × 844 @3× with the CPU 4× throttled:
//   scores     — the REAL daily screen (tests/integration/daily-preview.html &many=1: 48 players a daily, every one in a FANCY card): SCORES →
//                ALL TIME → TODAY'S SCORES + SHOW ALL (48 rows) → scroll to the foot and back, ×ROUNDS
//   customize  — CUSTOMIZE YOUR CARD's grid with EVERY card owned (tests/integration/profile-preview.html &all=1&dev=1): open → scroll the whole grid ×3
// After each round: the LIVE GPU contexts (every webgl / webgl2 context made, not lost, its canvas alive — an init script counts them), the
// canvases holding pixels (ui/canvas-safe.js#canvasMb + every <canvas> on the page by its own size), the effect slots drawn in the last frame
// (fx/renderer.js#fxStats.slots), the JS heap, the browser's whole memory (Windows: every chrome process's working set) and a page marker (a
// reload would lose it). FAILS when the live effects pass the cap, when the GL contexts / canvas pixels grow past the first round's (+ slack),
// or when the page reloaded.
//   node tests/integration/scores-memory.mjs "<browser>" [--case scores|customize|all] [--rounds 5] [--json out.json]   (any local server: :5173)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BROWSER = argv[0] && !argv[0].startsWith('--') ? argv[0] : process.env.CHROME;
const CASE = opt('case', 'all'), ROUNDS = Number(opt('rounds', 5)), JSON_OUT = opt('json', ''), CPU = Number(opt('cpu', 4));
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const LIVE_CAP = 3;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const checks = [], fails = [];
const ok = (c, what) => { checks.push(!!c); console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

function glCounter() {
  const made = []; window.__glMade = made;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const c = orig.call(this, type, ...rest);
    if (c && /webgl/.test(String(type)) && !made.some(r => r.deref() === c)) made.push(new WeakRef(c));
    return c;
  };
  window.__glLive = () => made.filter(r => { const c = r.deref(); return c && !c.isContextLost() && c.canvas && c.canvas.width > 0; }).length;
  window.__glEver = () => made.length;
}
/** the whole browser's memory (MB) — every chrome.exe under the launched one (Windows); null elsewhere */
function browserMb(pid) {
  if (process.platform !== 'win32' || !pid) return null;
  try {
    const out = execSync(`powershell -NoProfile -Command "$all = Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Select-Object ProcessId,ParentProcessId,WorkingSetSize; $ids = @(${pid}); do { $n = $ids.Count; $ids = @($ids + ($all | Where-Object { $ids -contains $_.ParentProcessId } | ForEach-Object { $_.ProcessId })) | Select-Object -Unique } while ($ids.Count -gt $n); ($all | Where-Object { $ids -contains $_.ProcessId } | Measure-Object WorkingSetSize -Sum).Sum"`, { encoding: 'utf8' });
    return Math.round(Number(out.trim()) / 1048576);
  } catch { return null; }
}

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-sandbox', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const pid = browser.process() && browser.process().pid;

async function phone(url) {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(glCounter);
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  const cdp = await p.createCDPSession();
  await cdp.send('Performance.enable');
  await p.goto(guardUrl(url, 'scores-memory.mjs'), { waitUntil: 'load' });
  await p.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
  await p.evaluate(() => { window.__marker = Math.random(); });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  return { p, cdp, marker: await p.evaluate(() => window.__marker) };
}
async function sample(P, label) {
  try { await P.p.evaluate(() => window.gc && window.gc()); } catch { /* fine */ }
  await sleep(1200);   // (the renderer frees a gone surface's canvas within ~1 s; the lane frees at once)
  const s = await P.p.evaluate(async () => {
    const cs = await import('/js/ui/canvas-safe.js'), fx = await import('/js/fx/renderer.js');
    const c = cs.canvasMb();
    let px = 0; for (const cv of document.querySelectorAll('canvas')) px += cv.width * cv.height;
    return { marker: window.__marker, gl: window.__glLive(), glEver: window.__glEver(), canvases: document.querySelectorAll('canvas').length, mp: +(px / 1e6).toFixed(2),
      mb: +(c.mb || 0).toFixed(1), live: fx.fxStats.slots, strips: document.querySelectorAll('.vl-strip').length, fxOn: document.querySelectorAll('.vl-strip.fx-on').length };
  });
  const m = await P.cdp.send('Performance.getMetrics');
  const heap = Math.round((m.metrics.find(x => x.name === 'JSHeapUsedSize') || {}).value / 1048576);
  const row = { label, ...s, heap, browser: browserMb(pid), reloaded: s.marker !== P.marker };
  console.log(`  · ${label.padEnd(18)} strips ${String(row.strips).padStart(3)} · live fx ${row.live} (painted ${row.fxOn}) · GL ${row.gl} (made ${row.glEver}) · canvases ${row.canvases} = ${row.mp} MP (${row.mb} MB) · heap ${heap} MB · browser ${row.browser ?? '—'} MB${row.reloaded ? ' · RELOADED' : ''}`);
  return row;
}
const click = async (p, sel, re) => {
  const ok2 = await p.evaluate((s, r) => { const b = [...document.querySelectorAll(s)].find(x => !r || new RegExp(r).test(x.textContent)); if (!b) return false; b.scrollIntoView({ block: 'center' }); const R = b.getBoundingClientRect(); window.__tapAt = [R.x + R.width / 2, R.y + R.height / 2]; return true; }, sel, re || '');
  if (!ok2) return false;
  const [x, y] = await p.evaluate(() => window.__tapAt);
  await p.mouse.click(x, y);
  return true;
};
async function scrollAll(p, sel, step = 500) {
  const H = await p.evaluate(s => { const e = document.querySelector(s); return e ? e.scrollHeight : 0; }, sel);
  for (let y = 0; y <= H; y += step) { await p.evaluate((s, v) => { const e = document.querySelector(s); if (e) e.scrollTop = v; }, sel, y); await sleep(140); }
  await sleep(400);
  for (let y = H; y >= 0; y -= step * 2) { await p.evaluate((s, v) => { const e = document.querySelector(s); if (e) e.scrollTop = v; }, sel, y); await sleep(100); }
  await sleep(500);
}
const stripsIn = (p, sel) => p.waitForFunction(s => { const l = [...document.querySelectorAll(s)]; return l.length && l.every(x => x.dataset.strips); }, { timeout: 30000 }, sel).catch(() => null);

const out = {};
function judge(name, rows) {
  const first = rows[0], last = rows[rows.length - 1];
  const maxOf = k => Math.max(...rows.map(r => r[k] || 0));
  ok(!rows.some(r => r.reloaded), `${name}: the page never reloaded`);
  ok(maxOf('live') <= LIVE_CAP && maxOf('fxOn') <= LIVE_CAP, `${name}: at most ${LIVE_CAP} live effects on screen (drawn ${maxOf('live')}, painted ${maxOf('fxOn')})`);
  ok(maxOf('gl') <= first.gl + 1, `${name}: the GPU contexts stay flat (${rows.map(r => r.gl).join(' → ')})`);
  ok(maxOf('mp') <= Math.max(first.mp * 1.3, first.mp + 1.5), `${name}: the canvas pixels stay flat (${rows.map(r => r.mp).join(' → ')} MP)`);
  if (first.browser != null) ok(last.browser <= first.browser * 1.35 + 60, `${name}: the browser's memory stays flat (${rows.map(r => r.browser).join(' → ')} MB)`);
  out[name] = rows;
}

if (CASE === 'scores' || CASE === 'all') {
  console.log(`SCORES — 390 × 844 @3, ${CPU}× CPU, 48 fancy cards a daily, ${ROUNDS} rounds`);
  const P = await phone(`${BASE}/tests/integration/daily-preview.html?state=swept&tab=scores&many=1`);
  const rows = [await sample(P, 'SCORES (today)')];
  for (let i = 1; i <= ROUNDS; i++) {
    await click(P.p, '.dy-scope-b', 'ALL TIME'); await stripsIn(P.p, '.dy-every-list');
    await scrollAll(P.p, '.dy-scroll');
    rows.push(await sample(P, `${i}: ALL TIME`));
    await click(P.p, '.dy-scope-b', 'TODAY'); await stripsIn(P.p, '.dy-every-today');
    while (await click(P.p, '.dy-more', 'SHOW ALL')) { await sleep(300); await stripsIn(P.p, '.dy-every-today'); }
    await scrollAll(P.p, '.dy-scroll');
    rows.push(await sample(P, `${i}: TODAY + SHOW ALL`));
  }
  judge('SCORES', rows);
  await P.p.close();
}
if (CASE === 'customize' || CASE === 'all') {
  console.log(`CUSTOMIZE YOUR CARD — 390 × 844 @3, ${CPU}× CPU, every card owned, the grid scrolled ×3`);
  const P = await phone(`${BASE}/tests/integration/profile-preview.html?all=1&dev=1&labmarks=all`);
  await P.p.waitForSelector('.vl-dp-go', { timeout: 30000 });
  await click(P.p, '.vl-dp-go');
  await P.p.waitForSelector('.vl-dress.is-in .vl-dt', { timeout: 30000 });
  await sleep(1500);
  console.log(`  (the grid: ${await P.p.evaluate(() => document.querySelectorAll('.vl-dt').length)} cards)`);
  const rows = [await sample(P, 'CUSTOMIZE')];
  for (let i = 1; i <= 3; i++) {
    await scrollAll(P.p, '.vl-dr-scroll', 300);
    rows.push(await sample(P, `${i}: the grid scrolled`));
  }
  judge('CUSTOMIZE', rows);
  await P.p.close();
}
await browser.close();
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
console.log(`checks ${checks.filter(Boolean).length}/${checks.length} passed`);
process.exit(fails.length ? 1 : 0);
