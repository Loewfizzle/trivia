// FR7 FIXES B — THE TWO-TAB HANG (the owner, Nov 12: STEPPING INSIDE stuck after going back to Safari + refreshing with TWO TABS of the
// site open; closing both fixed it). In Safari's engine (Playwright's WebKit, 402×874 @3), TWO PAGES ON ONE CONTEXT (one phone's Safari),
// the worker registered, through THE LINE with production's headers + a build id:
//   1. tab A at the city (left alone behind), tab B refreshed 5 times — every load reaches the city
//   2. A WORKER UPDATE lands while both are open (a new sw.js + a new build) — B refreshed twice, still the city
//   3. THE STUCK STORE — Safari's storage process stopped answering (simulated in B: indexedDB.open + caches.open never settle — the
//      known iOS state that only closing every tab cleared): B still reaches the city AND signs in (it used to wait on IndexedDB forever)
//   4. A HUNG BOOT in B (a boot module that never answers): THE BOOT WATCHDOG reaches TAP TO TRY AGAIN, and its BOOT HANG report says
//      "other tabs open: 1"
//   node tests/integration/wk-twotabs.mjs [--upstream http://localhost:5173]   (serve.mjs --emu + the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { startLine } from './kit/line-proxy.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const UP = guardUrl(opt('upstream', 'http://localhost:5173'), 'wk-twotabs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const line = await startLine({ port: 5187, to: UP, rtt: 20, mbps: 80, prod: true, build: 'aaaa0001' });
const browser = await webkit.launch();
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const URL0 = 'http://localhost:5187/?emu&slot=tt&when=2026-11-06T21:02&wx=clear&tz=America/Detroit&at=42.96,-85.67';
const REVEALED = "(() => { const b = document.getElementById('boot'); return !!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()";
const SIGNED_IN = '!!(window.__arcade && window.__arcade.state && window.__arcade.state.uid)';
async function waitFor(p, js, ms) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; }

const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  if (navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  // (THE STUCK STORE, only when this tab's session asks for it — sessionStorage survives the tab's reloads, never another tab)
  try {
    if (sessionStorage.getItem('tt:stuck') === '1') {
      const never = () => new Promise(() => {});
      // (on the PROTOTYPE — an own property on window.indexedDB isn't what the SDK's calls reach)
      IDBFactory.prototype.open = () => ({ set onsuccess(f) {}, set onerror(f) {}, set onblocked(f) {}, set onupgradeneeded(f) {}, addEventListener() {}, removeEventListener() {} });
      if (window.CacheStorage) { CacheStorage.prototype.open = never; CacheStorage.prototype.match = never; CacheStorage.prototype.keys = never; }
    }
  } catch { /* fine */ }
});
const A = await ctx.newPage();
await A.goto(URL0);
ok(await waitFor(A, REVEALED, 40000), 'tab A: the city');
await waitFor(A, '!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 15000);

const B = await ctx.newPage();
const logs = [];
B.on('request', r => { if (r.url().includes('/api/log') && r.method() === 'POST') logs.push(r.postData() || ''); });
await B.bringToFront();
const times = [];
async function load(label, go) {
  const t0 = Date.now();
  await go();
  const up = await waitFor(B, REVEALED, 45000);
  times.push({ label, up, ms: Date.now() - t0 });
  return { up, ms: Date.now() - t0 };
}
// 1. five refreshes of B with A open behind it
await load('B first', () => B.goto(URL0));
for (let i = 0; i < 5; i++) await load(`B refresh ${i + 1}`, () => B.reload());
const r1 = times.slice(1);
ok(r1.every(t => t.up), `1. tab B refreshed 5× with tab A open: the city every time (${r1.map(t => (t.ms / 1000).toFixed(1) + ' s').join(' · ')})`);
// 2. a worker update + a new build land while both are open
line.set({ build: 'aaaa0002', rules: [{ re: '^/sw\\.js$', prepend: '// a new worker\n' }] });
const u1 = await load('B after the worker update', () => B.reload());
const u2 = await load('B again', () => B.reload());
const aAlive = await A.evaluate('!!window.__district').catch(() => false);
ok(u1.up && u2.up && aAlive, `2. A WORKER UPDATE with both tabs open: B reached the city twice (${(u1.ms / 1000).toFixed(1)} s · ${(u2.ms / 1000).toFixed(1)} s), tab A alive`);
line.set({ rules: [] });
// 3. THE STUCK STORE in B
await B.evaluate("sessionStorage.setItem('tt:stuck', '1')");
const s1 = await load('B with a stuck store', () => B.reload());
const signed = await waitFor(B, SIGNED_IN, 20000);
const warned = await B.evaluate("1").then(() => true);
ok(s1.up && signed && warned, `3. THE STUCK STORE (IndexedDB + Cache Storage never answer): B reached the city in ${(s1.ms / 1000).toFixed(1)} s and SIGNED IN (${signed}) — the sign-in used to wait on IndexedDB forever`);
await B.evaluate("sessionStorage.removeItem('tt:stuck')");
// 4. A HUNG BOOT in a fresh tab C (B closed — WebKit's RELOAD reuses its memory cache, so a stalled module never stalls a reload; a new
//    tab asks again) → THE BOOT WATCHDOG → TAP TO TRY AGAIN + the report names the other tab (A)
await B.close();
line.set({ build: 'aaaa0003', stall: '^/js/screens/harbor/scene\.js$', stallN: Infinity });
const C = await ctx.newPage();
C.on('request', r => { if (r.url().includes('/api/log') && r.method() === 'POST') logs.push(r.postData() || ''); });
await C.bringToFront();
logs.length = 0;
const t4 = Date.now();
await C.goto(URL0).catch(() => {});
const tap = await waitFor(C, "(() => { const s = document.querySelector('#boot .boot-status'); return !!s && /TAP TO TRY AGAIN/.test(s.textContent); })()", 70000);
const rep = logs.find(l => /THE BOOT HUNG/.test(l)) || '';
const tabsLine = (/other tabs open: (\S+?)(?:\n|"|$)/.exec(rep) || [])[1];
ok(tap, `4. A HUNG BOOT: THE BOOT WATCHDOG reached TAP TO TRY AGAIN in ${((Date.now() - t4) / 1000).toFixed(1)} s`);
ok(tabsLine === '1', `4. the BOOT HANG report says "other tabs open: ${tabsLine}" (tab A answered the ping)`);
line.set({ stall: null });
await ctx.close(); await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-twotabs: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
