// HOLD'EM (HE8) — LONG NIGHTS, on the preview's MOTION DEMO (no emulators — the real view, the real dealer core + THE LEAN WIRE):
//   1. THE ENDURANCE RUN: ≥ 400 hands at 8 players, the demo's clock sped up (&speed — the dealer's AND the phone's clock; the motion keeps
//      its real durations, so it overlaps + cancels like a fast table: every deal, chip, sweep, showdown, side pot, bust, re-spread, a new
//      match each time one ends), the JS heap (after a forced GC), the DOM nodes, the JS listeners, the canvases (+ their pixel memory),
//      the motion's ghosts + the running animations measured at the START (after the warm-up), the MIDDLE and the END — they must stay FLAT.
//   2. THE IDLE PROOF: a table where nothing changes (a hand's end, a showdown on screen, the waiting table, CASH, the podium, sideways)
//      draws ZERO animation frames (the view's loop asleep; every requestAnimationFrame on the page counted), the living touches aside — and
//      those hold still on a hidden page.
//   node tests/integration/holdem-endurance.mjs "<browser>" [--hands 400] [--speed 12] [--size 390x844] [--skin casino]
//   (E2E_BASE = a plain `node scripts/serve.mjs 5190`.) Exit code 1 on a failure; the numbers in ./shots-holdem/he8-endurance.json.
import puppeteer from './kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const browserPath = process.argv[2];
const base = process.env.E2E_BASE || 'http://localhost:5190';
const HANDS = Number(arg('hands', 400)), SPEED = Number(arg('speed', 12)), SKIN = arg('skin', 'casino');
const [W, Hh] = arg('size', '390x844').split('x').map(Number);
const fails = [];
const ok = (cond, what) => { console.log(`${cond ? '  ✓' : '  ✗'} ${what}`); if (!cond) fails.push(what); return !!cond; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const errors = [];
async function openPage(qs, view = { width: W, height: Hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true }) {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  // (every requestAnimationFrame on the page counted — the view's own + anyone else's)
  await page.evaluateOnNewDocument(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__rafAll = 0;
    window.requestAnimationFrame = fn => { window.__rafAll++; return raf(fn); };
  });
  await page.setViewport(view);
  await page.goto(`${base}/tests/integration/holdem-preview.html?${qs}&skin=${SKIN}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__holdem && window.__holdem.layout && window.__holdem.layout(), { timeout: 20000 });
  return page;
}

// ---------------------------------------------------------------------------------------------------------------- 1. THE ENDURANCE RUN
const page = await openPage(`play=1&n=8&mute=1&lv=60&seed=endure&speed=${SPEED}`);
const cdp = await page.target().createCDPSession();
await cdp.send('Memory.enable').catch(() => {});
async function sample(label) {
  await cdp.send('HeapProfiler.collectGarbage');
  await sleep(150);
  await cdp.send('HeapProfiler.collectGarbage');
  const heap = await cdp.send('Runtime.getHeapUsage');
  const dom = await cdp.send('Memory.getDOMCounters');
  const pg = await page.evaluate(async () => {
    const { canvasMb } = await import('/js/ui/canvas-safe.js');
    const cm = canvasMb();
    return { hands: window.__preview.hands || 0, canvases: document.querySelectorAll('canvas').length, canvasMb: +(cm.mb || 0).toFixed(2), canvasLive: cm.count != null ? cm.count : cm.n,
      ghosts: document.querySelectorAll('.he-fx > *').length, anims: document.getAnimations().length, heNodes: document.querySelector('.he').getElementsByTagName('*').length,
      planned: window.__holdem.planned().length, frames: window.__holdem.frames(), matches: window.__preview.rec && window.__preview.rec.id };
  });
  const row = { label, at: Math.round((Date.now() - t0) / 1000), heapMb: +(heap.usedSize / 1048576).toFixed(2), nodes: dom.nodes, listeners: dom.jsEventListeners, documents: dom.documents, ...pg };
  console.log(`  · ${label.padEnd(6)} hand ${String(row.hands).padStart(4)} · heap ${row.heapMb} MB · nodes ${row.nodes} (the table ${row.heNodes}) · listeners ${row.listeners} · canvases ${row.canvases} (${row.canvasMb} MB) · ghosts ${row.ghosts} · animations ${row.anims} · ${row.at} s`);
  return row;
}
const t0 = Date.now();
const handsNow = () => page.evaluate(() => window.__preview.hands || 0);
const until = async n => { const end = Date.now() + 40 * 60_000; while ((await handsNow()) < n) { if (Date.now() > end) throw new Error(`the demo stalled before hand ${n}`); await sleep(1000); } };
console.log(`THE ENDURANCE RUN: ${HANDS} hands at 8 players, ×${SPEED}, ${W}×${Hh}, ${SKIN}`);
await until(20);   // (the warm-up: every kind of hand seen once — the caches, the chip art, the fonts)
const rows = [await sample('start')];
const marks = [Math.round(HANDS / 4), Math.round(HANDS / 2), Math.round(HANDS * 3 / 4), HANDS];
for (const m of marks) { await until(m); rows.push(await sample(m === HANDS ? 'end' : m === Math.round(HANDS / 2) ? 'middle' : `${m}`)); }
const [s0, ...rest] = rows, end = rows[rows.length - 1], mid = rows.find(r => r.label === 'middle');
const maxOf = k => Math.max(...rest.map(r => r[k]));
// FLAT = after the warm-up the numbers wander (the motion in flight at the moment of a sample) but never climb with the hands played
ok(end.hands >= HANDS, `${end.hands} hands played (${Math.round((Date.now() - t0) / 60000)} min at ×${SPEED})`);
ok(end.heapMb <= s0.heapMb * 1.15 + 1.5 && mid.heapMb <= s0.heapMb * 1.15 + 1.5, `THE HEAP stays flat: ${s0.heapMb} → ${mid.heapMb} → ${end.heapMb} MB (after a GC)`);
ok(maxOf('nodes') <= s0.nodes + 400, `THE DOM stays flat: ${s0.nodes} → ${mid.nodes} → ${end.nodes} nodes (the table ${s0.heNodes} → ${end.heNodes}; max ${maxOf('nodes')})`);
ok(maxOf('listeners') <= s0.listeners + 60, `THE LISTENERS stay flat: ${s0.listeners} → ${mid.listeners} → ${end.listeners}`);
ok(maxOf('canvases') <= s0.canvases + 16 && maxOf('canvasMb') <= s0.canvasMb + 2, `THE CANVASES stay flat: ${s0.canvases} → ${mid.canvases} → ${end.canvases} (${s0.canvasMb} → ${end.canvasMb} MB)`);
ok(maxOf('ghosts') <= 60 && maxOf('anims') <= 120, `THE MOTION cleans up after itself: ghosts ≤ ${maxOf('ghosts')}, running animations ≤ ${maxOf('anims')} at any sample`);

// ---------------------------------------------------------------------------------------------------------------- 2. THE IDLE PROOF
console.log('THE IDLE PROOF: a table where nothing changes draws no frames');
const idle = [];
for (const [name, qs] of [['a hand\'s end (a fold-win)', 'state=foldwin&n=6'], ['the showdown', 'state=showdown&n=4'], ['waiting for the deal', 'state=waiting&n=6'], ['CASH between hands', 'state=foldwin&n=5&mode=cash'], ["the podium (its slim cards are the console's: a moving card draws its own frames — the table asleep under it)", 'state=final&n=8'], ['sideways, a hand\'s end', 'state=foldwin&n=6']]) {
  const view = /sideways/.test(name) ? { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : undefined;
  const p = await openPage(qs, view);
  await sleep(2500);   // (the first look settles: a mount draws its frames, then sleeps)
  const a = await p.evaluate(() => ({ view: window.__holdem.frames(), all: window.__rafAll, looping: window.__holdem.looping() }));
  await sleep(3000);
  const b = await p.evaluate(() => ({ view: window.__holdem.frames(), all: window.__rafAll, looping: window.__holdem.looping(),
    living: document.getAnimations().filter(x => x.playState === 'running' && x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('.he-live')).length,
    other: document.getAnimations().filter(x => x.playState === 'running' && !(x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('.he-live'))).map(x => (x.effect && x.effect.target && x.effect.target.className) || '?').slice(0, 4) }));
  // a hidden page: the living touches paused (+ nothing wakes)
  await p.evaluate(() => { for (const [k, v] of [['visibilityState', 'hidden'], ['hidden', true]]) Object.defineProperty(document, k, { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  const hid = await p.evaluate(() => document.getAnimations().filter(x => x.playState === 'running' && x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('.he-live')).length);
  idle.push({ name, viewFrames: b.view - a.view, allFrames: b.all - a.all, looping: b.looping, living: b.living, hidden: hid, other: b.other });
  const own = /podium/.test(name);   // (the podium: only the table's own loop must sleep — the console's card effects move by design)
  ok(b.view === a.view && (own || b.all === a.all) && !b.looping && hid === 0,
    `IDLE — ${name}: 0 animation frames in 3 s (the view's ${b.view - a.view}, the page's ${b.all - a.all}); the living touches ${b.living} running (CSS), ${hid} on a hidden page${b.other.length ? ` — other animations: ${b.other.join(', ')}` : ''}`);
  await p.close();
}
// a TURN is not idle: the clock bar drains (the loop runs), then sleeps again once the turn is gone
{
  const p = await openPage('state=myturn&n=6');
  const a = await p.evaluate(() => window.__holdem.frames()); await sleep(1000); const b = await p.evaluate(() => ({ f: window.__holdem.frames(), looping: window.__holdem.looping() }));
  ok(b.f - a > 20 && b.looping, `A TURN draws its clock (${b.f - a} frames in 1 s)`);
  await p.close();
}

mkdirSync('./shots-holdem', { recursive: true });
writeFileSync('./shots-holdem/he8-endurance.json', JSON.stringify({ hands: HANDS, speed: SPEED, size: `${W}x${Hh}`, skin: SKIN, rows, idle }, null, 1));
ok(!errors.length, `no page error (${errors.slice(0, 3).join(' | ') || 'none'})`);
await browser.close();
console.log(fails.length ? `FAILED ${fails.length}` : 'ALL GOOD');
process.exit(fails.length ? 1 : 0);
