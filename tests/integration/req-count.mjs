// CITY A — item 14, THE PHONE KEEPS ITS FILES — the request numbers (the pass log's table), in Safari's engine through THE LINE (Vercel's own
// headers per path from vercel.json + a build id on /api/time — kit/line-proxy.mjs prod mode), sw.js registered by the test:
//   COLD          a first visit (no worker yet): every request + KB
//   WARM          the same build again: what still reaches the network (target ≲ 15)
//   AFTER DEPLOY  build B with ONE changed file (+ its new hash in /file-hashes.json): the worker carries every unchanged file from build A's
//                 cache — only the list + the changed file (+ the page, /api) come over the network
//   + the worker's own counts (carried, hits, misses) + what a bundler would save (numbers only — no bundler)
//   node tests/integration/req-count.mjs [--upstream http://localhost:5173]      (the emulators + serve.mjs --emu)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { startLine } from './kit/line-proxy.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const UP = guardUrl((i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--upstream')), 'req-count');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const A = 'aaaa1111', B = 'bbbb2222';
const line = await startLine({ port: 5189, to: UP, rtt: 20, mbps: 80, prod: true, build: A });
const browser = await webkit.launch();
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const URL0 = 'http://localhost:5189/?emu&slot=rqc&when=2026-11-06T13:02&city=2&idle=1';
const UPJS = "!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)";
const STATS = `new Promise(res => { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return res(null);
  const on = e => { if (e.data && e.data.t === 'ns:sw-stats') { navigator.serviceWorker.removeEventListener('message', on); res(e.data); } };
  navigator.serviceWorker.addEventListener('message', on); c.postMessage('ns:sw-stats'); setTimeout(() => res(null), 2000); })`;
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:rqc:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ }
  if (navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
});
let p = await ctx.newPage();   // (each later visit = a NEW page in the same profile — the app opened again: WebKit's in-memory copies on a reload() never reach the worker)
const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; };
const seen = []; let liveGets = 0;   // (the city feed's GET ?live=1 — every 1.5 s on the emulators (remote.js#EMU_POLL, a test hook), every 5 min live)
p.on('request', r => { const u = new URL(r.url()); if (u.port === '5189') { seen.push(u.pathname); if (/live=1/.test(u.search)) liveGets++; } if (process.env.RQ_API && /\/api\/(admin|profile)/.test(u.pathname)) { let b = ''; try { b = JSON.parse(r.postData() || '{}').action || ''; } catch { /* fine */ } console.log(`      ${u.pathname}${u.search} ${b}`); } });
const netPaths = () => fetch('http://localhost:5189/__line/paths').then(r => r.json()).catch(() => ({}));   // (THE LINE's own counts since the last ask — what really crossed the network)
async function visit(label, reload) {
  await netPaths(); liveGets = 0;
  const s0 = line.stats(), n0 = seen.length;
  if (reload) { await p.close(); p = await ctx.newPage(); p.on('request', r => { const u = new URL(r.url()); if (u.port === '5189') { seen.push(u.pathname); if (/live=1/.test(u.search)) liveGets++; } if (process.env.RQ_API && /\/api\/(admin|profile)/.test(u.pathname)) { let b = ''; try { b = JSON.parse(r.postData() || '{}').action || ''; } catch { /* fine */ } console.log(`      ${u.pathname}${u.search} ${b}`); } }); }
  await p.goto(URL0);
  await waitFor(UPJS, 60000); await sleep(9000);   // (the boot, the city's late files, the idle polls of the first seconds)
  const s1 = line.stats(), net = await netPaths(), paths = Object.keys(net).filter(x => x !== '/__line/paths'); void n0;
  const sw = await p.evaluate(STATS).catch(() => null);
  const kinds = { js: 0, css: 0, assets: 0, data: 0, api: 0, page: 0, audio: 0, other: 0 };
  for (const x of paths) for (let r = 0; r < (net[x] || 1); r++) { const k = x.startsWith('/js/') ? 'js' : x.startsWith('/css/') ? 'css' : x.startsWith('/assets/') ? 'assets' : x.startsWith('/data/') ? 'data' : x.startsWith('/api/') ? 'api' : x.startsWith('/audio/') ? 'audio' : x === '/' ? 'page' : 'other'; kinds[k]++; }
  const row = { label, req: s1.req - s0.req, kb: s1.kb - s0.kb, kinds, sw: sw ? { hits: sw.hits, misses: sw.misses, carried: sw.carried, carryMs: sw.carryMs, net: sw.net } : null };
  console.log(`  ${label}: ${row.req} requests on the network (${row.kb} KB) — ${Object.entries(kinds).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(' · ')}${row.sw ? ` · the worker: ${row.sw.hits} hits, ${row.sw.misses} misses, ${row.sw.carried} carried (${row.sw.carryMs} ms)` : ''}`);
  row.live = row.req - Math.max(0, liveGets - 1);   // (at the LIVE pace: one feed read a visit)
  console.log(`    (at the live site's pace — the feed read once, not every 1.5 s: ${row.live} requests)`);
  return { ...row, paths, net };
}
try {
  const cold = await visit('COLD (a first visit — no worker yet)', false);
  await waitFor('!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 15000);
  await visit('the first controlled load (the worker keeps build A)', true);
  const warm = await visit('WARM (the same build)', true);
  // a deploy: build B — ONE file changed (+ its hash in the list)
  const H = JSON.parse(readFileSync(new URL('../../file-hashes.json', import.meta.url), 'utf8')).files, F = '/js/store.js';
  await sleep(3500);
  line.set({ build: B, rules: [{ re: '^/js/store\\.js$', prepend: '// build B\n' }, { re: '^/file-hashes\\.json$', from: `"${F}":"${H[F]}"`, to: `"${F}":"bbbbbbbbbbbb"` }] });
  const after = await visit('AFTER A DEPLOY (one changed file)', true);
  console.log('    B cache:', JSON.stringify(await p.evaluate(async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); const r = await c.match('/js/store.js'); out[k] = r ? (await r.text()).slice(0, 12) : null; } return out; })));
  console.log('    B check:', JSON.stringify(await p.evaluate(async F => ({ toast: (await (await fetch(F)).text()).slice(0, 14), list: ((await (await fetch('/file-hashes.json?chk=1', { cache: 'no-store' })).text()).match(/"\/js\/ui\/toast\.js":"[0-9a-z]+"/) || [''])[0], sw: await new Promise(res => { const c = navigator.serviceWorker.controller; if (!c) return res(null); const on = e => { if (e.data && e.data.t === 'ns:sw-stats') res(e.data); }; navigator.serviceWorker.addEventListener('message', on); c.postMessage('ns:sw-stats'); setTimeout(() => res(null), 2000); }) }), F)));
  const warmB = await visit('WARM on build B', true);
  const code = after.paths.filter(x => /^\/(js|css|assets|data)\//.test(x));
  ok(warm.live <= 15, `WARM: ${warm.live} requests reach the network at the live pace (${warm.req} on the emulators' 1.5-s feed; target ≲ 15) — ${Object.entries(warm.net).filter(([k]) => k !== '/__line/paths').map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  ok(code.length <= 3 && code.includes(F), `AFTER A DEPLOY: only the changed file comes over the network (${code.join(", ") || "none"}) + the list — ${after.req} requests, ${after.kb} KB in all — all: ${after.paths.join(", ")}`);
  ok(after.sw && after.sw.carried > 100, `the worker CARRIED the unchanged files from build A (${after.sw ? after.sw.carried : '?'})`);
  void warmB;
  // what a BUNDLER would save (numbers only): the cold visit's module files → a few bundles; the bytes a minifier would strip (comments + indentation)
  const mods = cold.paths.filter(x => /^\/js\/.*\.js$/.test(x)), root = new URL('../../', import.meta.url);
  let raw = 0, min = 0;
  for (const m of new Set(mods)) { try { const s = readFileSync(new URL(`.${m}`, root), 'utf8'); raw += statSync(new URL(`.${m}`, root)).size; min += s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*$/gm, '$1').replace(/^\s+/gm, '').length; } catch { /* fine */ } }
  console.log(`  A BUNDLER (numbers only): the cold visit fetched ${new Set(mods).size} module files (${Math.round(raw / 1024)} KB raw) — a bundler would make them ~3–5 requests; stripping comments + indentation alone: ~${Math.round(min / 1024)} KB (−${Math.round((1 - min / raw) * 100)} %), before gzip on both`);
} catch (e) { ok(false, `the run: ${e.stack || e.message}`); }
await ctx.close(); await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`req-count: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
