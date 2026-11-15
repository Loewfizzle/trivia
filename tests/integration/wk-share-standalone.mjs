// FIXES R1 — SHARING FROM THE HOME-SCREEN APP (the owner: SHARE TODAY → sending it to himself → the HOME-SCREEN app (iPhone, standalone)
// "crashed + reloaded"). Playwright's WebKit as that app: 402 × 874 @3, touch, `navigator.standalone` + `(display-mode: standalone)` emulated.
//   A. THE CARD UPLOADS ONCE (THE REVIEW A4) — the REAL daily screen (daily-preview.html, the fake /api counts shareCard calls across reloads):
//      the screen opens → ONE upload; reload ×2 → still ONE (the phone remembers the day's link for the same picture).
//   B. THE SHARE = THE LINK ONLY (the owner) — SHARE TODAY tapped: ONE navigator.share({ url }) — no text, no file; the app LEAVES while the
//      sheet is up (visibility hidden → visible, the way handing the link to Messages does) and comes back: the page is the SAME page (a marker).
//   C. THE SHARE HOLD — the REAL app (/?emu): a catch-up reload is QUEUED (the worker's ns:build-gone — a new deploy went live, as CITY E's did
//      while the owner's app was open); a share, then the app leaves + returns → NO reload (the same page); a return 61 s after the share → the
//      ONE reload runs as before (the rule still works). Before FIXES R1 the first return reloaded the page — the "crash" the owner saw, if his
//      /admin phone report for that moment says kind `reload` (A CATCH-UP RELOAD); kind `killed` would be iOS ending the page instead.
//   node tests/integration/wk-share-standalone.mjs [--base http://localhost:5173] [--only a,b,c]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', process.env.E2E_BASE || 'http://localhost:5173');
const ONLY = String(opt('only', 'a,b,c')).split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };

function standalone() {
  try { Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true }); } catch { /* fine */ }
  const mm = window.matchMedia.bind(window);
  window.matchMedia = q => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } : mm(q));
  // the visibility the test flips (WebKit headless never hides a page on its own)
  let vis = 'visible';
  Object.defineProperty(document, 'visibilityState', { get: () => vis, configurable: true });
  Object.defineProperty(document, 'hidden', { get: () => vis === 'hidden', configurable: true });
  window.__setVis = v => { vis = v; document.dispatchEvent(new Event('visibilitychange')); if (v === 'hidden') window.dispatchEvent(new Event('blur')); else { window.dispatchEvent(new Event('focus')); } };
}
const browser = await webkit.launch();
const errs = [];
async function phone() {
  // (serviceWorkers blocked: every file fresh from this tree — a worker's pinned copy would hide a change; the worker's MESSAGE is dispatched by hand)
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(standalone);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  return { ctx, p };
}
const waitFor = async (p, js, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; };

try {
  if (ONLY.includes('a') || ONLY.includes('b')) {
    const { ctx, p } = await phone();
    const url = guardUrl(`${BASE}/tests/integration/daily-preview.html?state=swept`, 'wk-share-standalone');
    await p.goto(url, { waitUntil: 'commit' });
    await waitFor(p, "document.readyState !== 'loading'");
    await p.evaluate(() => { try { localStorage.removeItem('test:shrup'); localStorage.removeItem('ns:shr'); } catch { /* fine */ } });
    await p.goto(url, { waitUntil: 'commit' });
    await waitFor(p, "!!document.querySelector('.dy-share')");
    const up0 = await waitFor(p, "Number(localStorage.getItem('test:shrup') || 0) >= 1", 20000);
    const sa = await p.evaluate("matchMedia('(display-mode: standalone)').matches && navigator.standalone === true");
    ok(sa, 'the page runs as the home-screen app (display-mode: standalone + navigator.standalone)');
    if (ONLY.includes('a')) {
      for (let i = 1; i <= 2; i++) { await p.reload({ waitUntil: 'commit' }); await waitFor(p, "!!document.querySelector('.dy-share')"); await sleep(4000); }
      const n = await p.evaluate("Number(localStorage.getItem('test:shrup') || 0)");
      ok(up0 && n === 1, `A. THE CARD UPLOADS ONCE: the screen opened → 1 upload; two reloads later → ${n} upload${n === 1 ? '' : 's'} in all (0 on a reopen)`);
    }
    if (ONLY.includes('b')) {
      await p.evaluate(() => {
        window.__marker = Math.random(); window.__shareArgs = [];
        navigator.canShare = () => true;
        // the share sheet: the app leaves (handing the link to Messages) and comes back 1.5 s later, then the sheet resolves
        navigator.share = a => { window.__shareArgs.push(a); return new Promise(res => { setTimeout(() => window.__setVis('hidden'), 300); setTimeout(() => window.__setVis('visible'), 1800); setTimeout(res, 2200); }); };
      });
      const m0 = await p.evaluate('window.__marker');
      const b = await p.locator('.dy-share').boundingBox();
      await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await waitFor(p, 'window.__shareArgs && window.__shareArgs.length >= 1', 5000);
      await sleep(3500);
      const r = await p.evaluate(() => ({ args: window.__shareArgs, marker: window.__marker }));
      const a = (r.args || [])[0] || {};
      ok(r.args.length === 1 && /\/api\/daily\?s=PREVIEWcode1$/.test(a.url || '') && !('text' in a) && !a.files, `B. SHARE TODAY → ONE share({ url }) — the LINK ONLY (${JSON.stringify(a)})`);
      ok(r.marker === m0, 'B. the app left for the share + came back: the SAME page (no reload)');
    }
    await ctx.close();
  }
  if (ONLY.includes('c')) {
    const { ctx, p } = await phone();
    await p.goto(guardUrl(`${BASE}/?emu`, 'wk-share-standalone'), { waitUntil: 'domcontentloaded' });
    await waitFor(p, '!!window.__arcade', 40000);
    await sleep(1500);
    const queue = () => p.evaluate(async () => {
      const L = await import('/js/ui/lazy-import.js');
      const sw = navigator.serviceWorker;
      if (!sw) return 'no serviceWorker object';
      sw.dispatchEvent(new MessageEvent('message', { data: { t: 'ns:build-gone', v: 'oldbuild1', live: 'newbuild2' } }));
      for (let i = 0; i < 40 && !L.skewDebug().pending; i++) await new Promise(r => setTimeout(r, 100));
      return L.skewDebug().pending ? 'queued' : 'not queued';
    });
    const q = await queue();
    ok(q === 'queued', `C. a catch-up reload is QUEUED (a new deploy went live while the app was open): ${q}`);
    // (nothing else may hold the reload — no sheet open, no finger down: the share is the ONLY reason it waits)
    const gateOpen = () => p.evaluate(async () => { const lay = await import('/js/ui/layers.js'); for (let i = 0; i < 5 && lay.layersOpen() > 0; i++) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise(r => setTimeout(r, 300)); } return { layers: lay.layersOpen(), sheets: [...document.querySelectorAll('.sh-panel')].map(e => e.className).join(' ') }; });
    const g1 = await gateOpen();
    ok(g1.layers === 0, `C. nothing else holds the reload before the share (layers open: ${g1.layers} ${g1.sheets})`);
    await p.evaluate(() => { window.__marker = 'before-share'; globalThis.__nsShareAt = Date.now(); });   // (js/daily/share.js#shareHold at the share)
    // (the reload goes after window.__boot.refresh() — a few seconds: wait for a navigation up to 12 s and expect NONE)
    const nav0 = p.waitForEvent('framenavigated', { timeout: 12000 }).then(() => true).catch(() => false);
    await p.evaluate(() => window.__setVis('hidden')); await sleep(1500);
    const g1b = await gateOpen();   // (a fresh home-screen app shows BRING YOUR CARD a few seconds in — closed: the share must be the only hold)
    await p.evaluate(() => window.__setVis('visible')).catch(() => {});
    const navd = await nav0;
    const kept = navd ? null : await p.evaluate('window.__marker').catch(() => null);
    ok(kept === 'before-share' && g1b.layers === 0, `C. THE SHARE HOLD: the app left for the share + came back (no sheet open: ${g1b.layers === 0}) → no reload (the same page: ${kept === 'before-share'})`);
    // a return a minute later (the share long done) → the ONE reload runs, as ONE DEPLOY AT A TIME says
    const g2 = await gateOpen();
    ok(g2.layers === 0, `C. nothing else holds it at the later return either (layers open: ${g2.layers} ${g2.sheets})`);
    await p.evaluate(() => { globalThis.__nsShareAt = Date.now() - 61_000; });
    const nav = p.waitForEvent('framenavigated', { timeout: 15000 }).then(() => true).catch(() => false);
    await p.evaluate(() => window.__setVis('hidden')); await sleep(500); await gateOpen(); await p.evaluate(() => window.__setVis('visible')).catch(() => {});
    const reloaded = await nav;
    ok(reloaded, 'C. a return 61 s after the share → the queued catch-up reload runs (the rule still works)');
    await ctx.close();
  }
} finally { await browser.close(); }
// (a fetch the catch-up reload cuts short reads 'due to access control checks' in WebKit — a network abort, not a code error)
const real = errs.filter(e => !/Failed to load resource|ERR_|Load failed|NetworkError|access control checks/i.test(e));
ok(!real.length, `no page errors (${real.slice(0, 3).join(' · ') || 'none'})`);
console.log(`\n${results.filter(r => r.ok).length}/${results.length} passed`);
process.exitCode = results.every(r => r.ok) ? 0 : 1;
