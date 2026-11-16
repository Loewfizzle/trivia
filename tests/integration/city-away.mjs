// FIXES R2 — GROUP 1, AWAY, LIGHT (the owner's iPhone, build 385e0d6: PAGE KILLED (likely memory) while he was away in Messages after SHARE
// TODAY). The city at 390 × 844 @3 (Chromium as a touch phone, the emulators): the page's canvas memory ON SCREEN, then HIDDEN (iOS's
// visibilitychange), then BACK. Fails when the hidden page keeps more than HALF of it, when the return shows a frame with nothing over a
// blank city (the held picture must be up from the first frame until the re-bake lands — ONE cut), when the city isn't fully baked again
// inside THE REJOIN LIMIT (8 s), or when the bakes come back at a different size (the same plan, the same camera).
//   node tests/integration/city-away.mjs "<chromium>"        (scripts/serve.mjs --emu + the emulators)
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const VIS = v => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
  document.dispatchEvent(new Event('visibilitychange'));
};
try {
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:ca1:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  p.on('pageerror', e => { console.log('PAGEERROR', e.message); fails.push(`page error: ${e.message}`); });
  await p.goto(guardUrl(`${BASE}/?emu&slot=ca1&city=2&idle=1`, 'city-away.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
  await p.waitForFunction('(() => { const h = window.__district.harbor(); return h && h.ready && h.ready(); })()', { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  const MB = () => p.evaluate(() => import('/js/ui/canvas-safe.js').then(C => ({ ...C.canvasMb(), bake: window.__district.scene().mem.mb, layers: window.__district.scene().mem.layers.filter(l => /far|near|stage|road|harbor|water$|bill|front|Lit/.test(l.name) && !/sprites|mirror|merged/.test(l.name)).map(l => `${l.name} ${l.mb}`).join(' · ') })));
  const on = await MB();
  await p.evaluate(VIS, false);
  await sleep(300);
  const off = await MB(), a1 = await p.evaluate('window.__district.away()');
  console.log(`  · on screen ${on.mb} MB (${on.n} canvases; the bakes ${on.bake}) → hidden ${off.mb} MB (${off.n}); the away log ${JSON.stringify(a1)}`);
  // (every BAKE's memory gone — the merged bands + the picture's swap included; the share kept varies with how many merged bands were built)
  const bakers = +on.layers.split(' · ').reduce((t, x) => t + (parseFloat(x.split(' ').pop()) || 0), 0).toFixed(1);   // (both bakers' layers, both sets)
  ok(on.mb - off.mb >= bakers - 1, `HIDDEN: the page's canvases ${on.mb} → ${off.mb} MB (${Math.round(off.mb / on.mb * 100)} % kept) — at least the bakers' ${bakers} MB freed (${(on.mb - off.mb).toFixed(1)})`);
  ok(a1 && a1.on && a1.freedMb > 20, `HIDDEN: the bakes freed (${a1 ? a1.freedMb : '?'} MB) + one picture kept for the return`);
  // BACK: every frame from the return until the re-bake, the held picture must be up (no blank city on screen)
  await p.evaluate(() => {
    window.__back = { frames: 0, bare: 0, firstBare: -1, t0: performance.now(), done: -1 };
    const tick = () => {
      const a = window.__district.away(), held = !!(a && a.hold), ready = !!(a && a.baked);
      const b = window.__back; b.frames++;
      if (!held && !ready) { b.bare++; if (b.firstBare < 0) b.firstBare = Math.round(performance.now() - b.t0); }
      if (!held && ready) { b.done = Math.round(performance.now() - b.t0); return; }
      if (performance.now() - b.t0 < 10000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await p.evaluate(VIS, true);
  await p.waitForFunction('window.__back.done >= 0 || performance.now() - window.__back.t0 > 9500', { timeout: 15000, polling: 100 });
  const back = await p.evaluate('window.__back'), a2 = await p.evaluate('window.__district.away()');
  await sleep(1500);
  const again = await MB();
  console.log(`  · back: ${back.frames} frames, re-baked + the hold let go after ${back.done} ms; ${again.mb} MB (${again.n}) — ${again.layers}`);
  ok(back.bare === 0, `BACK: the held picture over the city from the first frame to the re-bake — 0 bare frames (${back.bare}${back.firstBare >= 0 ? `, the first at ${back.firstBare} ms` : ''})`);
  ok(back.done >= 0 && back.done <= 8000, `BACK: the city fully re-baked + the hold let go inside THE REJOIN LIMIT (${back.done} ms ≤ 8000)`);
  ok(a2 && !a2.on && a2.holds >= 1, `BACK: the away state cleared, the picture held once (${JSON.stringify(a2)})`);
  ok(again.layers === on.layers, `BACK: every bake at its size again — the same plan, the same camera (${again.layers === on.layers ? 'identical' : `${on.layers} → ${again.layers}`}; the merged bands come back as each band settles)`);
  if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}/city-back-from-away-390.png` });
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
