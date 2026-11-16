// FIXES R3 — THE AWAY RACE (the owner's iPhone, build 62212dd — FIXES R2, Nov 15 11:17 pm, the home-screen app, screen: title):
// "harbor frame: InvalidStateError: The object is in an invalid state." @ scene.js:2019 — c.drawImage(skyCv, …) of the SKY that R2's
// AWAY, LIGHT zeroes while the page is hidden. A frame drew before the return re-built it: iOS made the page visible and ran a timer / a
// focus (the 1 s watchdog → wakeLoop → a frame) BEFORE it dispatched visibilitychange — the only signal that called awayBack.
// WebKit at 390 × 844 @3 (the emulators + scripts/serve.mjs --emu). Each case fails on R2's code:
//   1. THE SILENT RETURN: hidden (the bakes freed) → visible WITHOUT the event → the watchdog's frame must not throw; the city re-builds
//   2. MID-REBUILD: back → hidden again inside the re-bake → back → no throw, the city fully baked, one away state at a time
//   3. A FOCUS FIRST: hidden → visible, focus dispatched before visibilitychange → no throw
//   node tests/integration/city-away-race.mjs [--base http://localhost:5173]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const BASE = (i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--base'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:cr1:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ }
    // the page's visibility under the test's hand: SET flips the state only (iOS's silent return), EV dispatches the event
    window.__vis = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__vis !== 'visible' });
  });
  const p = await ctx.newPage();
  const failed = [];
  p.on('console', m => { if (/a frame failed/.test(m.text())) failed.push(m.text()); });
  p.on('pageerror', e => failed.push(`page error: ${e.message}`));
  const waitFor = async (js, ms = 10000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(80); } return false; };
  const SET = v => p.evaluate(x => { window.__vis = x; }, v);
  const EV = () => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const fails0 = () => p.evaluate(() => (window.__district.loop() || {}).failed || 0);   // (every failed frame — the console names only the first)
  await p.goto(guardUrl(`${BASE}/?emu&slot=cr1&city=2&idle=1`, 'city-away-race.mjs'));
  await waitFor('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', 60000);
  await waitFor('(() => { const h = window.__district.harbor(); return h && h.ready && h.ready(); })()', 30000);
  await sleep(1200);
  // (the page's canvas memory sampled every frame from here: a return must never hold two copies of the city — the bakes + a second set)
  const on = await p.evaluate(() => import('/js/ui/canvas-safe.js').then(C => { window.__mbPeak = 0; window.__mbOn = C.canvasMb().mb; const tick = () => { const m = C.canvasMb().mb; if (m > window.__mbPeak) window.__mbPeak = m; requestAnimationFrame(tick); }; requestAnimationFrame(tick); return window.__mbOn; }));
  const baked = () => waitFor('(() => { const a = window.__district.away(); return !!(a && !a.on && !a.hold && a.baked); })()', 9000);

  // 1. THE SILENT RETURN
  await SET('hidden'); await EV(); await sleep(300);
  const a1 = await p.evaluate('window.__district.away()');
  ok(a1 && a1.on, `1. hidden: the bakes freed (${a1 ? a1.freedMb : '?'} MB)`);
  await SET('visible');                      // (no event: the watchdog — 1 s — restarts the loop on its own)
  await sleep(2200);
  ok(!failed.length, `1. THE SILENT RETURN: visible with no visibilitychange — the watchdog's frames drew nothing freed (${failed.length ? failed[0].slice(0, 140) : 'no failed frame'})`);
  ok(await baked(), `1. THE SILENT RETURN: the city re-built + re-baked by the frame itself (${JSON.stringify(await p.evaluate('window.__district.away()'))})`);
  const n1 = failed.length, c1 = await fails0();
  await EV();                                // (the late event: nothing to do — away already cleared)
  await sleep(600);
  ok(failed.length === n1 && (await fails0()) === c1, `1. the late visibilitychange after it: no new failed frame (${(await fails0()) - c1})`);
  ok(c1 === 0, `1. every frame of THE SILENT RETURN drew (${c1} failed — the report names only the first)`);

  // 2. MID-REBUILD: back, then hidden again before the re-bake lands, then back
  failed.length = 0;
  await SET('hidden'); await EV(); await sleep(250);
  await SET('visible'); await EV();
  await sleep(120);                          // (the re-build started; the bakes still pending)
  await SET('hidden'); await EV(); await sleep(250);
  await SET('visible'); await EV();
  ok(await baked(), '2. MID-REBUILD: hidden again inside the re-bake → back → the city fully baked, the hold let go');
  const f2 = await fails0();
  ok(!failed.length && !f2, `2. MID-REBUILD: no failed frame (${f2} counted${failed.length ? `; ${failed[0].slice(0, 140)}` : ''})`);

  // 3. A FOCUS FIRST: iOS's order on a return to a home-screen app — focus (→ wakeLoop) before visibilitychange
  failed.length = 0;
  await SET('hidden'); await EV(); await sleep(300);
  await SET('visible');
  await p.evaluate(() => window.dispatchEvent(new Event('focus')));
  await sleep(400);
  await EV();
  ok(await baked(), '3. A FOCUS FIRST: the city re-baked');
  ok(!failed.length, `3. A FOCUS FIRST: no failed frame (${failed.length ? failed[0].slice(0, 140) : 'none'})`);
  const peak = await p.evaluate('window.__mbPeak');
  ok(peak <= on * 1.25 + 4, `THE RETURNS' MEMORY: the canvases' peak over every return ${peak} MB vs ${on} MB on screen (≤ +25 % — the held half-size picture over the re-bake, never two cities)`);
  ok((await fails0()) === 0, `the whole run: 0 failed frames (${await fails0()})`);
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
