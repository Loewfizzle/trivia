// LOAD FIX 2 (Nov 9) — THE BOOT CLOCK: how long a phone waits for the city, and what it spent the wait on. The owner (iPhone, Safari,
// home Wi-Fi, 4:34 pm): "slow to load — EVERY time". One run = one load of the title in Chromium (CDP: a CPU slow-down + a network line),
// cold (a fresh profile) or warm (a second load in the same profile — the service worker + the HTTP cache in place: the owner's case).
// It prints, per load:
//   boot   the boot screen's first paint (FCP — #boot is the page's first picture)
//   reveal the city's reveal (scene.js shownAt — the boot screen's ONE fade starts there)
//   tap    a tap on BOARD at the reveal → THE BOARD on screen (the first tap that works)
//   the requests BEFORE the reveal, by kind (script, sheet, font, image, audio, json/fetch, /api) + their bytes on the wire, and the
//   service worker's own network requests on a warm load (each a revalidation)
//   the main thread's long tasks before the reveal (≥ 50 ms), each with its biggest pieces (a module's evaluation, a compile, a style /
//   layout, a timer, a frame) — from a performance trace
// Runs on the emulators + scripts/serve.mjs --emu (E2E_BASE for another port, e.g. a worktree on :5174). LIVE=1 + --base
// https://neonspeakeasy.com = a READ-ONLY timing of the live site (the guard adds &test=1: no profile, no member Nº — never a room).
//
//   node tests/integration/boot-time.mjs "<browser>" [--runs 3] [--cpu 4] [--net wifi|4g|none] [--warm [--prime N]] [--trace] [--live]
//                                       [--scene day|night|grey] [--json out.json] [--tap 0] [--size 402x874] [--log]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const BROWSER = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = String(opt('base', process.env.E2E_BASE || 'http://localhost:5173'));
const [W, H] = String(opt('size', '402x874')).split('x').map(Number);
const RUNS = Number(opt('runs', 3)) || 1, CPU = Number(opt('cpu', 0)) || 0, WARM = !!opt('warm', false), TRACE = !!opt('trace', false);
const PRIME = Math.max(1, Number(opt('prime', 1)) || 1);
const LIVE = !!opt('live', false), TAP = String(opt('tap', '1')) !== '0', LOG = !!opt('log', false);
// (the lines: a home Wi-Fi ≈ 30 ms to the edge + ~50 Mbps; 4G ≈ 70 ms + 9 Mbps — per request, as Chromium applies it)
const NETS = { wifi: { latency: 30, down: 50e6, up: 10e6 }, '4g': { latency: 70, down: 9e6, up: 3e6 }, '3g': { latency: 150, down: 1.6e6, up: 0.75e6 },
  // (THE BEFORE-LAUNCH PASS: Lighthouse's own "Slow 4G" — 150 ms, 1.6 Mbps down, 750 kbps up — the first-visit bundle's measuring line)
  slow4g: { latency: 150, down: 1.6384e6, up: 0.75e6 } };
// (--android: Chrome's Android profile — a mid phone's user agent + 412 × 915 @2.625, touch; --h2: the browser trusts serve.mjs --h2's local certificate)
const ANDROID = !!opt('android', false);
// (THE CITY POLISH PASS: --iphone = an iPhone's Safari user agent (index.html then takes the MODULES path, as every iPhone does — the box's engine
//  stays Chromium: never an iPhone's speed) · --chromeos = the school Chromebooks (CrOS x86_64 Chrome 156, 1366×599 viewport, dpr 1, 4 cores) ·
//  --dpr N. The new columns: title (the title screen first routed) · gone (the boot screen removed) · worst (the longest task to gone + 2.5 s) ·
//  all (every request + its KB to then))
const IPHONE = !!opt('iphone', false), CROS = !!opt('chromeos', false);
const DPR = Number(opt('dpr', CROS ? 1 : 3)) || 3;
const NET = NETS[String(opt('net', 'none'))] || null;
const SCENES = { day: 'when=2026-11-06T13:00&wx=clear', grey: 'when=2026-11-06T13:02&wx=overcast', night: 'when=2026-11-06T21:30&wx=clear' };
const SCENE = String(opt('scene', 'grey'));
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const QS = String(opt('qs', ''));   // (--qs &nobundle: THE FIRST-VISIT BUNDLE off — the modules one request each, as before)
const url = guardUrl(LIVE ? `${BASE}/` : `${BASE}/?emu&slot=bt&${SCENES[SCENE] || SCENES.grey}${GR}&city=2${QS}`, 'boot-time.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// (in the page before anything runs: the reveal's moment + the long tasks as the page itself saw them)
const INIT = `(() => {
  try { localStorage.setItem('nd:entered', '1'); } catch {}
  window.__bt = { reveal: -1, gone: -1, title: -1, lt: [], gaps: [], lastF: 0 };
  const tick = () => {
    try { const d = window.__district, p = d && d.loadProbe && d.loadProbe();
      if (__bt.title < 0 && window.__arcade && window.__arcade.route && window.__arcade.route() === 'title') __bt.title = performance.now();
      if (p && p.shown && __bt.reveal < 0) { __bt.reveal = performance.now(); performance.mark('bt-reveal'); }
      if (__bt.reveal >= 0 && __bt.gone < 0 && !document.getElementById('boot')) __bt.gone = performance.now();
      if (__bt.reveal >= 0) { const n = performance.now(); if (__bt.lastF) { const g = n - __bt.lastF; if (n - __bt.reveal < 4000) { __bt.gaps.push(Math.round(g)); } } __bt.lastF = n; if (n - __bt.reveal < 4000) { requestAnimationFrame(tick); return; } }
      if (__bt.gone >= 0) return;
    } catch {}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) __bt.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch {}
})();`;

const kindOf = (u, type) => {
  const p = (() => { try { return new URL(u).pathname; } catch { return u; } })();
  if (p.startsWith('/api/')) return 'api';
  if (/fonts\.(googleapis|gstatic)/.test(u) || /\.(woff2?|ttf|otf)$/.test(p)) return 'font';
  if (type === 'Script' || /\.m?js$/.test(p)) return /gstatic\.com\/firebasejs/.test(u) ? 'firebase' : 'script';
  if (type === 'Stylesheet' || /\.css$/.test(p)) return 'sheet';
  if (type === 'Image' || /\.(png|jpe?g|webp|svg|gif|avif)$/.test(p)) return 'image';
  if (type === 'Media' || /\.(mp3|wav|ogg|m4a)$/.test(p)) return 'audio';
  if (/\.json$/.test(p)) return 'json';
  if (type === 'Document') return 'doc';
  if (/googleapis\.com|firebase/.test(u)) return 'firebase';
  return (type || 'other').toLowerCase();
};

const SWGL = !!opt('swgl', false);   // (--swgl: no GPU — the canvases rasterised + uploaded by the CPU: a weak laptop's graphics, roughly)
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, ...(SWGL ? { gpu: false } : {}), args: ['--no-sandbox', ...(SWGL ? ['--disable-gpu', '--disable-gpu-compositing'] : []), ...(BASE.startsWith('https://localhost') ? ['--ignore-certificate-errors'] : [])] });
const results = [];

async function throttle(cdp) {
  await cdp.send('Network.enable').catch(() => {});
  if (NET) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down / 8, uploadThroughput: NET.up / 8 }).catch(() => {});
}

async function oneLoad(ctx, page, tag) {
  const cdp = await page.target().createCDPSession();
  await throttle(cdp);
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  // (the service worker's own fetches — on a warm load every same-origin file goes through it: network-first, a revalidation each)
  const swReqs = [];
  for (const t of ctx.targets().filter(t => t.type() === 'service_worker')) {
    try { const s = await t.createCDPSession(); await throttle(s); s.on('Network.responseReceived', e => swReqs.push({ url: e.response.url, status: e.response.status, t: e.timestamp })); } catch { /* fine */ }
  }
  const reqs = new Map();
  let wall0 = null;
  cdp.on('Network.requestWillBeSent', e => { if (wall0 == null) wall0 = e.wallTime * 1000; if (!reqs.has(e.requestId)) reqs.set(e.requestId, { url: e.request.url, type: e.type, at: e.wallTime * 1000, bytes: 0, sw: false, cache: false, status: 0 }); });
  cdp.on('Network.responseReceived', e => { const r = reqs.get(e.requestId); if (r) { r.sw = !!e.response.fromServiceWorker; r.cache = !!e.response.fromDiskCache || !!e.response.fromMemoryCache; r.status = e.response.status; r.type = r.type || e.type; } });
  cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.done = e.timestamp; } });
  if (TRACE) await page.tracing.start({ categories: [...(opt('profile', false) ? ['disabled-by-default-v8.cpu_profiler'] : []), 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'toplevel', 'loading'] });
  const nav = page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
  await page.waitForFunction('window.__bt && window.__bt.reveal >= 0', { timeout: 60000, polling: 50 }).catch(() => {});
  await nav;
  const origin = await page.evaluate('performance.timeOrigin').catch(() => 0);
  await page.waitForFunction('window.__bt && window.__bt.gone >= 0', { timeout: 30000, polling: 50 }).catch(() => {});
  await sleep(0);
  const bt = await page.evaluate('({ gaps: __bt.gaps, reveal: __bt.reveal, gone: __bt.gone, title: __bt.title, mode: (window.__nsBoot || {}).mode || "", fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime || -1, lt: __bt.lt })').catch(() => ({ reveal: -1, gone: -1, title: -1, fcp: -1, lt: [] }));
  // THE FIRST TAP: BOARD at once, the board on screen
  let tap = null;
  if (TAP && bt.reveal >= 0) {
    const t0 = await page.evaluate('performance.now()');
    const ok = await page.evaluate(`(() => { const b = document.querySelector('.nd-tab-board'); if (!b) return false; const r = b.getBoundingClientRect(); window.__bt.tapXY = [r.x + r.width / 2, r.y + r.height / 2]; return true; })()`);
    if (ok) {
      const [x, y] = await page.evaluate('window.__bt.tapXY');
      await page.touchscreen.tap(x, y).catch(() => {});
      const seen = await page.waitForFunction('document.body.classList.contains("bd-on") || !!document.querySelector(".bd-screen, .bd-board, [data-route=board]")', { timeout: 20000, polling: 30 }).then(() => true).catch(() => false);
      tap = seen ? Math.round((await page.evaluate('performance.now()')) - t0) : -1;
    }
  }
  await sleep(2500);
  const after = await page.evaluate('__bt.lt.filter(([s]) => s > __bt.reveal && s < __bt.reveal + 2500)').catch(() => []);
  let longs = null;
  if (TRACE) {
    const buf = await page.tracing.stop();
    const tj = JSON.parse(Buffer.from(buf).toString('utf8'));
    longs = traceLongs(tj, bt.reveal);
    if (opt('profile', false)) for (const l of longs) l.top.push('SELF: ' + profileTop(tj, l.ts, l.ts + l.ms * 1000).join(' | '));
  }
  const L = LOG ? await page.evaluate('(() => { const h = window.__district && window.__district.harbor && window.__district.harbor(); return h ? h.loadLog.lines : null; })()').catch(() => null) : null;
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
  const before = [...reqs.values()].filter(r => r.at - origin <= bt.reveal);
  const by = {};
  for (const r of before) { const k = kindOf(r.url, r.type); const o = by[k] || (by[k] = { n: 0, bytes: 0 }); o.n++; o.bytes += r.bytes; }
  const all = [...reqs.values()];
  // (THE FIX PASS — D3: the EDGE REQUESTS — what Vercel counts: http(s) to the site itself, off the network (never a blob: module, a data: URL,
  //  the HTTP cache or the worker's own copy); `edgeAll` = the whole load, to 2.5 s after the reveal)
  const site = new URL(BASE).origin, edge = r => r.url.startsWith(site + '/') && !r.cache && !r.sw;
  const endAt = (bt.gone >= 0 ? bt.gone : bt.reveal) + 2500, upTo = all.filter(r => r.at - origin <= endAt);
  const ltAll = (await page.evaluate('__bt.lt').catch(() => bt.lt)).filter(([s]) => s <= endAt);
  const gaps = (await page.evaluate('__bt.gaps').catch(() => bt.gaps)) || [];
  const row = { tag, gapMax: gaps.reduce((m, x) => Math.max(m, x), 0), gaps5: gaps.slice(0, 5), mode: bt.mode, title: Math.round(bt.title), gone: Math.round(bt.gone), worst: ltAll.reduce((m, x) => Math.max(m, x[1]), 0), upN: upTo.length, upKB: Math.round(upTo.reduce((s, r) => s + r.bytes, 0) / 1024), edge: before.filter(edge).length, edgeAll: all.filter(edge).length, fcp: Math.round(bt.fcp), reveal: Math.round(bt.reveal), tap, n: before.length, bytes: before.reduce((s, r) => s + r.bytes, 0), by,
    sw: before.filter(r => r.sw).length, cached: before.filter(r => r.cache).length, swNet: swReqs.length, sw304: swReqs.filter(r => r.status === 304).length,
    lt: bt.lt.filter(([s]) => s <= bt.reveal), after, longs, allN: all.length, log: L,
    urls: before.map(r => ({ u: r.url.replace(BASE, ''), k: kindOf(r.url, r.type), b: r.bytes, at: Math.round(r.at - origin) })) };
  await cdp.detach().catch(() => {});
  return row;
}

// the long tasks before the reveal from a trace: each RunTask ≥ 50 ms on the page's main thread + its biggest pieces
/** --profile: the sampled CPU profile's top self-time frames (with their callers' line) between two trace timestamps (µs) */
function profileTop(trace, a, b) {
  const ev = trace.traceEvents || trace, nodes = new Map(), samples = [];
  const chunks = ev.filter(e => e.name === 'ProfileChunk' || e.name === 'Profile');
  const start = {};
  for (const e of chunks) {
    const id = e.id, d = (e.args && e.args.data) || {};
    if (e.name === 'Profile') { start[id] = d.startTime; continue; }
    const cp = d.cpuProfile || {};
    for (const n of cp.nodes || []) nodes.set(`${id}:${n.id}`, { ...n, key: `${id}:${n.id}`, parent: n.parent != null ? `${id}:${n.parent}` : null });
    let t = start[id] || 0; const td = d.timeDeltas || [];
    (cp.samples || []).forEach((sid, i) => { t += td[i] || 0; samples.push([t, `${id}:${sid}`]); });
    start[id] = t;
  }
  const self = new Map();
  for (const [t, k] of samples) { if (t < a || t > b) continue; const n = nodes.get(k); if (!n) continue; const cf = n.callFrame || {};
    let up = n, chain = []; for (let i = 0; i < 4 && up; i++) { const c = up.callFrame || {}; if (c.url && /\/js\//.test(c.url)) chain.push(`${c.functionName || '(anon)'}@${c.url.replace(/^.*\/js\//, '')}:${c.lineNumber + 1}`); up = up.parent ? nodes.get(up.parent) : null; }
    const label = `${cf.functionName || cf.url || '(program)'}${chain.length ? ' ← ' + chain.slice(0, 3).join(' ← ') : ''}`; self.set(label, (self.get(label) || 0) + 1); }
  return [...self].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, n]) => `${n}× ${k}`);
}
function traceLongs(trace, revealMs) {
  const ev = trace.traceEvents || trace;
  const names = new Map();
  for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args.name);
  const nav = ev.find(e => e.name === 'navigationStart' && /blink/.test(e.cat || ''));
  const mark = ev.find(e => e.name === 'bt-reveal');
  const mains = [...names].filter(([, n]) => n === 'CrRendererMain').map(([k]) => k);
  const tasks = ev.filter(e => e.name === 'RunTask' && e.ph === 'X' && mains.includes(`${e.pid}:${e.tid}`));
  const busiest = mains.map(k => [k, tasks.filter(t => `${t.pid}:${t.tid}` === k).reduce((s, t) => s + t.dur, 0)]).sort((a, b) => b[1] - a[1])[0];
  if (!busiest) return [];
  const key = busiest[0];
  const t0 = nav && `${nav.pid}:${nav.tid}` === key ? nav.ts : Math.min(...ev.filter(e => `${e.pid}:${e.tid}` === key && e.ts > 0).map(e => e.ts));
  const AFTER = !!opt('after', false);   // (--after: the long tasks ≥ 300 ms in the 3 s AFTER the reveal instead)
  const tR = mark ? mark.ts : t0 + revealMs * 1000, tEnd = tR + (AFTER ? 3e6 : 0);
  const mine = ev.filter(e => `${e.pid}:${e.tid}` === key && e.ph === 'X' && e.ts >= t0 && e.ts <= tEnd);
  const out = [];
  for (const t of mine.filter(e => e.name === 'RunTask' && (AFTER ? e.dur >= 300000 && e.ts >= tR : e.dur >= 50000))) {
    const kids = mine.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.name !== 'RunTask');
    const label = e => {
      const d = (e.args && (e.args.data || e.args)) || {};
      const u = String(d.url || d.fileName || d.scriptName || (d.stackTrace && d.stackTrace[0] && d.stackTrace[0].url) || '').replace(/^.*\/\/[^/]+/, '');
      const f = d.functionName ? ` ${d.functionName}` : '';
      return `${e.name}${u ? ` ${u}${d.lineNumber != null ? ':' + d.lineNumber : ''}` : ''}${f}`;
    };
    const agg = new Map();
    for (const k of kids) {
      if (!/FunctionCall|EvaluateScript|v8\.compile|v8\.evaluateModule|v8\.produceModuleCache|ParseHTML|UpdateLayoutTree|Layout|Paint|PrePaint|Layerize|ParseAuthorStyleSheet|TimerFire|FireAnimationFrame|EventDispatch|Decode|ScheduleStyleRecalculation|HitTest|MajorGC|MinorGC|V8.GC|v8.run|ResourceReceivedData|FunctionCall|XHRLoad|v8.newInstance/.test(k.name)) continue;
      const l = label(k);
      agg.set(l, (agg.get(l) || 0) + k.dur);
    }
    const top = [...agg].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l, d]) => `${l} ${(d / 1000).toFixed(0)}`);
    out.push({ ts: t.ts, at: Math.round((t.ts - t0) / 1000), ms: Math.round(t.dur / 1000), top });
  }
  return out;
}

for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  if (IPHONE) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1');
  if (CROS) { await page.setUserAgent('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'); await page.evaluateOnNewDocument(() => { try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); } catch {} }); }
  if (ANDROID) await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36');
  await page.setViewport(ANDROID ? { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true } : CROS ? { width: 1366, height: 599, deviceScaleFactor: DPR, isMobile: false, hasTouch: false } : { width: W, height: H, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(INIT);
  // (FR7 FIXES B: --prime N — the loads before the measured warm one; THE EDGE CACHE's worker fills its build's copy on its FIRST controlled load,
  //  so a true warm visit is the third: --prime 2)
  if (WARM) for (let k = 0; k < PRIME; k++) { await oneLoad(ctx, page, 'prime'); await sleep(1500); }
  const r = await oneLoad(ctx, page, WARM ? 'warm' : 'cold');
  results.push(r);
  await ctx.close();
}
await browser.close();

const kb = b => `${(b / 1024).toFixed(0)} KB`;
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : -1; };
console.log(`THE BOOT CLOCK — ${BASE}${LIVE ? ' (LIVE, read-only)' : ''} ${ANDROID ? 'ANDROID 412×915@2.625' : CROS ? `CHROMEOS 1366×599@${DPR}` : `${IPHONE ? 'iPHONE UA ' : ''}${W}×${H}@${DPR}`} ${CPU ? `cpu ${CPU}×` : 'cpu 1×'} net ${opt('net', 'none')} ${WARM ? 'WARM' : 'COLD'} · ${RUNS} run(s)`);
for (const r of results) {
  console.log(`  ${r.tag} [${r.mode || '?'}]: FCP ${r.fcp} · title ${r.title} · reveal ${r.reveal} · boot gone ${r.gone} · worst long task ${r.worst} ms · all ${r.upN} req / ${r.upKB} KB (to gone + 2.5 s) · after the reveal: the longest frame gap ${r.gapMax} ms (4 s), the first frames ${r.gaps5.join(' / ')} ms`);
  console.log(`  ${r.tag}: boot ${r.fcp} ms · reveal ${r.reveal} ms · tap → board ${r.tap == null ? '—' : r.tap + ' ms'} · EDGE ${r.edge} before the reveal, ${r.edgeAll} in all · before the reveal ${r.n} requests ${kb(r.bytes)}${WARM ? ` (sw ${r.sw}, its network ${r.swNet} — 304s ${r.sw304})` : ''} · long tasks ${r.lt.length} = ${r.lt.reduce((s, x) => s + x[1], 0)} ms · after it (2.5 s) ${r.after.length ? r.after.map(x => `${x[1]} ms @+${x[0] - r.reveal}`).join(', ') : 'none'}`);
  console.log('    ' + Object.entries(r.by).sort((a, b) => b[1].bytes - a[1].bytes).map(([k, o]) => `${k} ${o.n} / ${kb(o.bytes)}`).join(' · '));
  if (r.longs) for (const l of r.longs) console.log(`    long @${l.at} ${l.ms} ms: ${l.top.join(' | ')}`);
  if (r.log) for (const l of r.log) console.log('    ' + l);
}
console.log(`  MEDIAN (the review's columns): FCP ${med(results.map(r => r.fcp))} · title ${med(results.map(r => r.title))} · boot gone ${med(results.map(r => r.gone))} · worst long task ${med(results.map(r => r.worst))} · ${med(results.map(r => r.upN))} req / ${med(results.map(r => r.upKB))} KB`);
console.log(`  MEDIAN: boot ${med(results.map(r => r.fcp))} · reveal ${med(results.map(r => r.reveal))} · tap ${med(results.map(r => r.tap ?? -1))} · EDGE ${med(results.map(r => r.edge))} / ${med(results.map(r => r.edgeAll))} in all · requests ${med(results.map(r => r.n))} · ${kb(med(results.map(r => r.bytes)))}`);
const J = opt('json', '');
if (J) writeFileSync(String(J), JSON.stringify({ base: BASE, cpu: CPU, net: opt('net', 'none'), warm: WARM, results }, null, 1));
