// LOAD FIX 4 — THE SERVICE WORKER's CACHE (Grok's boot audit #11) in Safari's engine: Playwright's WebKit (~/wk/node_modules/playwright, or
// WK_PLAYWRIGHT), 402×874 @3, through THE LINE (kit/line-proxy.mjs — Vercel's ETag + must-revalidate), sw.js registered by the test
// (localhost skips the registration). Three loads, then one OFFLINE (every request through the line dropped):
//   - a warm load writes (almost) nothing into Cache Storage: an unchanged file's copy is never rewritten (sw.js's own counts — 'ns:sw-stats')
//   - no copy of a throwaway query (?again=) and ONE copy of the page whatever its query (a page's ?emu / ?room=… links)
//   - offline: the city still loads from the last good copies
//   node tests/integration/sw-cache.mjs [--upstream http://localhost:5173]   (on the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const UP = opt('upstream', 'http://localhost:5173');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const line = await startLine({ port: 5184, to: UP, rtt: 20, mbps: 80 });
const browser = await webkit.launch();
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const URL0 = 'http://localhost:5184/?emu&slot=sw&when=2026-11-06T13:02&wx=overcast&tz=America/Detroit&at=42.96,-85.67&city=2';
const REVEALED = "(() => { const b = document.getElementById('boot'); return !!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()";
const STATS = `new Promise(res => { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return res(null);
  const on = e => { if (e.data && e.data.t === 'ns:sw-stats') { navigator.serviceWorker.removeEventListener('message', on); res(e.data); } };
  navigator.serviceWorker.addEventListener('message', on); c.postMessage('ns:sw-stats'); setTimeout(() => res(null), 1500); })`;
const KEYS = "caches.open('na-static-v1').then(c => c.keys()).then(ks => ks.map(r => r.url.replace(location.origin, '')))";
async function waitFor(p, js, ms) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; }

const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  if (navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
});
const p = await ctx.newPage();
await p.goto(URL0);
await waitFor(p, REVEALED, 30000);
await waitFor(p, '!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 15000);
await sleep(2500);
const loads = [];
for (let i = 0; i < 3; i++) {   // (the first reload = the first load wholly in the worker's control: it FILLS the cache; then two warm loads)
  const before = await p.evaluate(STATS), r0 = line.stats().req;
  const t0 = Date.now();
  await p.reload();
  const up = await waitFor(p, REVEALED, 30000);
  await sleep(3000);   // (the late files — the songs' slices, the vault's art — in too)
  const after = await p.evaluate(STATS);
  loads.push({ up, ms: Date.now() - t0, before, after, req: line.stats().req - r0 });
}
const L = loads[loads.length - 1], d = (k) => (L.after && L.before && L.after[k] >= L.before[k] ? L.after[k] - L.before[k] : L.after ? L.after[k] : null);
const W = loads.slice(1).reduce((a, l) => ({ puts: a.puts + (l.after && l.before ? l.after.puts - l.before.puts : 99), same: a.same + (l.after && l.before ? l.after.same - l.before.same : 0) }), { puts: 0, same: 0 });
console.log(`the fill: ${loads[0].after && loads[0].before ? loads[0].after.puts - loads[0].before.puts : '?'} copies written · the two warm loads after it: ${W.puts} copies written, ${W.same} unchanged copies left alone (the old worker rewrote every one)`);
ok(L.up && L.after && W.puts <= 3 && W.same >= 20 && d('puts') <= 3, `a WARM load (the worker in control, nothing changed): ${d('puts')} copies written, ${d('same')} unchanged copies left alone, ${d('notKept')} not kept (a query); ${L.req} requests reached the server (revalidations)${L.after ? '' : ' — NO STATS (an old sw.js?)'} [the worker's totals ${JSON.stringify(L.after)}]`);
const keys = await p.evaluate(KEYS);
const pages = keys.filter(k => !/\.[a-z0-9]+(\?|$)/i.test(k.split('?')[0]) || /^\/(\?|$)/.test(k));
const junk = keys.filter(k => /[?&](again|emu|slot|when|room)=?/.test(k));
ok(junk.length === 0 && pages.length <= 2, `the cache: ${keys.length} copies — ${junk.length} with a throwaway / page query (${junk.slice(0, 3).join(' ') || 'none'}), the page kept as ${pages.join(' · ') || '—'}`);
// OFFLINE: every request through the line dropped → the worker's last good copies
line.set({ fail: '.', failN: 1e9 });
const t1 = Date.now();
await p.reload().catch(() => {});
const offUp = await waitFor(p, REVEALED, 40000);
ok(offUp, `OFFLINE (every request dropped): ${offUp ? `the city loaded from the cache in ${((Date.now() - t1) / 1000).toFixed(1)} s` : 'NO CITY'}`);
await ctx.close(); await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`sw-cache: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
