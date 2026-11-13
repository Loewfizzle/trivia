// FR7 FIXES B — THE EDGE CACHE (FR7-A D2) — LIVE AGAIN since THE CDN HOTFIX (Nov 12: docs/launch.md step 8 run early — Vercel's edge requests
// at the free 1M): this is ITS PROOF, its checks count (PROD=0 = no edge headers).
// how many requests reach Vercel per visit, in Safari's engine (Playwright's WebKit, 402×874 @3),
// through THE LINE with PRODUCTION's headers (vercel.json — kit/line-proxy.mjs `prod`) and a deploy's BUILD ID on /api/time (`build`):
//   1. COLD — a fresh phone (sw.js registered by the test: localhost skips it), the city to its reveal + the late files
//   2. the worker's first load (it takes the page over: a fresh build cache, filled)
//   3. WARM — the same build again: the count this pass is about (it was ~330: every file re-asked)
//   4. A DEPLOY — the build id changes + one file's content (a marker): the new code is on screen at once, no page error, no mixed graph
//   5. WARM after the deploy — the new build's copies
//   node tests/integration/wk-edge.mjs [--upstream http://localhost:5173] [--json out.json]   (serve.mjs --emu + the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs';
import { startLine } from './kit/line-proxy.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const UP = guardUrl(opt('upstream', 'http://localhost:5173'), 'wk-edge');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const line = await startLine({ port: 5186, to: UP, rtt: 20, mbps: 80, prod: process.env.PROD !== '0', build: 'a1b2c3d4e5f6' });
const browser = await webkit.launch();
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const URL0 = 'http://localhost:5186/?emu&slot=edge&when=2026-11-06T21:02&wx=clear&tz=America/Detroit&at=42.96,-85.67';
const REVEALED = "(() => { const b = document.getElementById('boot'); return !!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()";
const STATS = `new Promise(res => { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return res(null);
  const on = e => { if (e.data && e.data.t === 'ns:sw-stats') { navigator.serviceWorker.removeEventListener('message', on); res(e.data); } };
  navigator.serviceWorker.addEventListener('message', on); c.postMessage('ns:sw-stats'); setTimeout(() => res(null), 1500); })`;
async function waitFor(p, js, ms) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; }

const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  if (navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
});
// (each visit = a NEW TAB in the same phone — what "open the site again" is; WebKit's RELOAD reuses its in-page memory cache for nearly every
//  module without asking anyone — the old worker too: 47 of ~380 files reached the line on a reload, and a deploy's file was missed on a
//  reload with either worker — LOAD FIX 3's known WebKit trait, THE SKEW WRAPPER's __boot.refresh covers it)
let p = null;
const errors = [], mixed = [];
const visits = [];
async function visit(label, url = URL0) {
  if (p) await p.close();
  p = await ctx.newPage();
  p.on('pageerror', e => errors.push(String(e && e.message || e)));
  p.on('console', m => { if (/\[skew\]|SyntaxError|does not provide|Importing a module script failed/.test(m.text())) mixed.push(m.text()); });
  const s0 = line.stats(), e0 = errors.length, t0 = Date.now();
  await p.goto(url);
  const up = await waitFor(p, REVEALED, 40000);
  const ms = Date.now() - t0;
  await sleep(4000);   // (the late files — the songs' slices, the vault's art, the radio gate at 2.5 s)
  const s1 = line.stats(), sw = await p.evaluate(STATS).catch(() => null);
  const v = { label, up, revealMs: ms, edge: s1.edge - s0.edge, api: s1.api - s0.api, static: (s1.edge - s0.edge) - (s1.api - s0.api), n304: s1.n304 - s0.n304, kb: s1.kb - s0.kb, errors: errors.slice(e0), sw };
  visits.push(v);
  console.log(`${label.padEnd(26)} reveal ${(ms / 1000).toFixed(2)} s · ${v.edge} requests reached the edge (${v.static} static · ${v.api} /api · ${v.n304} answered 304) · ${v.kb} KB${sw ? ` · the worker: mode ${sw.mode}, ${sw.hits} from its copy, ${sw.net} from the network` : ' · no worker yet'}`);
  return v;
}

const cold = await visit('1 COLD (a fresh phone)');
await waitFor(p, '!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 15000);
await sleep(1500);
const fill = await visit('2 the worker\'s first load');
const warm = await visit('3 WARM (the same build)');
const warm2 = await visit('3b WARM again');
// 4. A DEPLOY: a new build id + one file changed (a marker the page shows) — the new code must be on screen at once
line.set({ build: 'f6e5d4c3b2a1', rules: [{ re: '^/js/config\.js$', prepend: 'globalThis.__deployB = 1;\n' }] });
const dep = await visit('4 A DEPLOY (new build id)');
const newCode = await p.evaluate('globalThis.__deployB === 1');
const after = await visit('5 WARM after the deploy');
const stillNew = await p.evaluate('globalThis.__deployB === 1');

ok(cold.up && fill.up && warm.up && dep.up && after.up, 'the city reached its reveal on every visit');
ok(warm.static <= 10 && warm2.static <= 10, `a WARM visit asks the edge for ≤ 10 static files (${warm.static} + ${warm2.static}; the worker served ${warm.sw && warm.sw.hits} from its copy) — every file was re-asked before`);
ok(newCode && stillNew, `A DEPLOY: the new code on screen at once (${newCode}) and on the warm visit after it (${stillNew})`);
ok(dep.sw && dep.sw.build === 'f6e5d4c3b2a1' && dep.sw.fresh >= 1, `the deploy's visit started a fresh build cache (${dep.sw && dep.sw.build}, fresh ${dep.sw && dep.sw.fresh})`);
const allErr = visits.flatMap(v => v.errors);
ok(mixed.length === 0 && allErr.length === 0, `no mixed graph, no page error on any visit (${[...mixed, ...allErr].slice(0, 3).join(' · ') || 'none'})`);
const keys = await p.evaluate("caches.keys()");
ok(keys.filter(k => k.startsWith('na-b-')).length === 1, `ONE build cache kept (${keys.join(', ')})`);
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(visits, null, 1));
await ctx.close(); await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-edge: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
