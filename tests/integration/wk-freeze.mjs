// LOAD FIX 3 — THE FREEZE LOOP: the owner's "the site sometimes freezes completely while loading" (iPhone, Safari, home Wi-Fi, intermittent)
// hunted in Safari's engine (Playwright's WebKit — ~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone.
// Each run = a FRESH context: a COLD load, then a WARM load (the same context: the HTTP cache + — with --sw — the service worker in place,
// as on the phone). Every load is timed to THE REVEAL (scene.js shownAt) and to THE FIRST WORKING TAP (BOARD → THE BOARD on screen).
// A FREEZE = no reveal in --limit ms (10 s), or a tap the page never answers; each one is saved to --out (a screenshot, the console, the
// requests still pending, the boot's stage, the LOAD LOG).
//   THE LINE (kit/line-proxy.mjs, started here): Vercel's caching (ETag + must-revalidate) + a home Wi-Fi-like line (--rtt ms, --mbps,
//   --drop 0…1 a request's socket destroyed) in front of --upstream (scripts/serve.mjs). --cpu n = a main-thread hog that leaves 1/n of
//   the thread to the page (WebKit has no CPU throttle). --sw = the page registers sw.js like the live site (localhost skips it).
//   --skew = THE DEPLOY MID-VISIT: load on --upstream (version A), switch THE LINE to --skew-to (version B) at --skew-at ms into a load /
//   between loads, and check every load still reveals.
//   node tests/integration/wk-freeze.mjs [--runs 30] [--cpu 1] [--rtt 40] [--mbps 40] [--drop 0] [--sw] [--limit 10000] [--out DIR]
//        [--upstream http://localhost:5173] [--warm 1] [--tap 1] [--scene night|day|grey] [--skew --skew-to http://localhost:5174 --skew-at 800]
//        [--live] (LIVE=1: the live site, read-only, &test=1 — no line, the real HTTP/2 + service worker) [--json out.json] [--quiet]
// Exit 1 on any freeze. On the emulators + scripts/serve.mjs --emu.
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const RUNS = +opt('runs', 30), CPU = +opt('cpu', 1), RTT = +opt('rtt', 40), MBPS = +opt('mbps', 40), DROP = +opt('drop', 0);
const SW = !!opt('sw', false), LIMIT = +opt('limit', 10000), OUT = opt('out', '') || '', WARM = String(opt('warm', '1')) !== '0', TAP = String(opt('tap', '1')) !== '0';
const UP = opt('upstream', 'http://localhost:5173'), LIVE = !!opt('live', false), QUIET = !!opt('quiet', false);
const SKEW = !!opt('skew', false), SKEW_TO = opt('skew-to', 'http://localhost:5174'), SKEW_AT = +opt('skew-at', 800);
const PORT = +opt('port', 5181);
const JUNK = opt('junk', '') || null;   // (--junk VALUE: every stored key the app reads, + the profile + the session, set to VALUE before the boot — an older version's leftovers)
const XHANG = opt('x-stall', '') || null, XFAIL = opt('x-fail', '') || null;   // (--x-stall / --x-fail RE: any URL — another host too (Google's fonts, the Firebase SDK) — never answered / refused, by the browser's router)
const FAIL = opt('fail', '') || null, FAIL_N = +opt('fail-n', 1), STALL = opt('stall', '') || null, STALL_N = opt('stall-n', '') === '' ? null : +opt('stall-n');   // (--fail RE: the first --fail-n requests matching dropped EACH LOAD; --stall RE: never answered)
const SCENES = { day: 'when=2026-11-06T13:00&wx=clear', grey: 'when=2026-11-06T13:02&wx=overcast', night: 'when=2026-11-06T21:30&wx=clear' };
const SCENE = String(opt('scene', 'night'));
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);

const line = LIVE ? null : await startLine({ port: PORT, to: UP, rtt: RTT, mbps: MBPS, drop: DROP });
const BASE = LIVE ? 'https://neonspeakeasy.com' : `http://localhost:${PORT}`;
const url = guardUrl(LIVE ? `${BASE}/?city=2` : `${BASE}/?emu&slot=wf&${SCENES[SCENE] || SCENES.night}${GR}&city=2`, 'wk-freeze.mjs');
const browser = await webkit.launch();

// THE HOG + THE HEARTBEAT (installed before the page's own scripts): the hog keeps (1 − 1/n) of the main thread busy; the heartbeat records
// every gap > 250 ms in the page's timers (a long task / a stalled thread), each with its time
const INIT = ([cpu, sw, junk]) => {
  if (junk != null) { try { for (const k of ['na:settings', 'na:1:me', 'na:wf:me', 'na:wf:session', 'na:wf:profile', 'na:beatcal', 'na:beatlead', 'na:srvoff', 'na:dbgtools', 'na:bench2', 'nd:wx', 'nd:night', 'nd:tapwatch', 'nd:hr-me', 'nd:hr-folds', 'nd:rd-role', 'nd:rd-seen', 'nd:rd-order', 'nd:ic-played', 'nd:sg-q', 'ns:look', 'ns:cb:set', 'ns:fr:v1', 'ns:show', 'vl:seen', 'vl:diag', 'daily:held', 'daily:run-day:coastclear', 'daily:run-day:password', 'nd:bday-sky', 'nd:bd', 'bd:dev', 'na:hushmiss', 'rd:prog', 'nd:adm', 'na:prism:tip']) localStorage.setItem(k, junk); } catch { /* fine */ } }
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:wf:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  const g = window.__wf = { gaps: [], t0: performance.now(), errs: [] };
  addEventListener('error', e => g.errs.push(String(e.message || e)));
  addEventListener('unhandledrejection', e => g.errs.push('rejection: ' + String(e.reason && (e.reason.message || e.reason))));
  let last = performance.now();
  const beat = () => { const n = performance.now(); if (n - last > 250) g.gaps.push([Math.round(last), Math.round(n - last)]); last = n; setTimeout(beat, 50); };
  setTimeout(beat, 50);
  if (cpu > 1) { const busy = 12 * (1 - 1 / cpu) / (1 / cpu); const spin = () => { const e = performance.now() + Math.min(busy, 40); while (performance.now() < e) { /* the slow phone */ } setTimeout(spin, 12); }; setTimeout(spin, 0); }
  if (sw && navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(e => g.errs.push('sw: ' + e.message)); });
};

const STAGE = `(() => {
  const b = document.getElementById('boot'), d = window.__district;
  let p = null; try { p = d && d.loadProbe ? d.loadProbe() : null; } catch (e) { p = { err: String(e) }; }
  let log = null; try { const h = d && d.harbor && d.harbor(); log = h && h.loadLog ? h.loadLog.rows.slice(-40).map(r => (r.text || r.msg || JSON.stringify(r)).slice(0, 200)) : null; } catch { /* fine */ }
  return { boot: b ? (b.classList.contains('out') ? 'fading' : 'ON') : 'gone', cssReady: document.documentElement.classList.contains('css-ready'),
    district: !!d, shown: !!(p && p.shown), preload: !!(window.__bootPre && window.__bootPre.done), stage: document.querySelector('#stage') ? document.querySelector('#stage').className + ' | ' + (document.querySelector('#stage').firstElementChild || {}).className : null,
    sw: navigator.serviceWorker && navigator.serviceWorker.controller ? 'controlled' : 'no sw', nav: (performance.getEntriesByType('navigation')[0] || {}).type, bootErrs: window.__boot ? window.__boot.errors() : null, gaps: window.__wf ? window.__wf.gaps : null, errs: window.__wf ? window.__wf.errs : null, log };
})()`;

const results = [];
async function load(page, tag, pend, cons) {
  const t0 = Date.now();
  pend.clear(); cons.length = 0;
  if (line && FAIL) line.set({ fail: FAIL, failN: FAIL_N });
  if (line && STALL) line.set({ stall: STALL, stallN: STALL_N });
  let skewed = false;
  const nav = page.goto(url, { waitUntil: 'commit', timeout: 60000 }).catch(e => cons.push('goto: ' + e.message));
  if (SKEW && tag.endsWith('mid')) setTimeout(() => { line.switchTo(SKEW_TO); skewed = true; }, SKEW_AT);
  await nav;
  let reveal = -1, alive = true;
  while (Date.now() - t0 < LIMIT + 5000) {
    const s = await Promise.race([page.evaluate('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown)').catch(() => false), sleep(3000).then(() => 'hung')]);
    if (s === 'hung') { alive = false; continue; }
    alive = true;
    if (s) { reveal = Date.now() - t0; break; }
    await sleep(40);
  }
  let tap = null;
  if (reveal >= 0 && TAP) {
    await sleep(300);
    const xy = await page.evaluate(`(() => { const b = document.querySelector('.nd-tab-board'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`).catch(() => null);
    if (xy) {
      const t1 = Date.now();
      await page.touchscreen.tap(xy[0], xy[1]).catch(() => {});
      const seen = await page.waitForFunction('document.body.classList.contains("bd-on") || !!document.querySelector(".bd-screen, .bd-board")', null, { timeout: 8000, polling: 40 }).then(() => true).catch(() => false);
      tap = seen ? Date.now() - t1 : -1;
    } else tap = -2;   // (no BOARD tab — the dock never came)
  }
  const st = await Promise.race([page.evaluate(STAGE).catch(e => ({ err: e.message })), sleep(4000).then(() => ({ err: 'the page never answered (the main thread stuck)' }))]);
  const freeze = reveal < 0 || reveal > LIMIT || (TAP && tap != null && tap < 0);
  const kind = reveal < 0 ? (st.err ? 'DEAD PAGE' : st.boot === 'ON' ? 'HELD BOOT SCREEN' : 'NO REVEAL') : reveal > LIMIT ? 'SLOW REVEAL' : tap === -1 ? 'DEAD TO TAPS' : tap === -2 ? 'NO DOCK' : '';
  const row = { tag, reveal, tap, freeze, kind, nav: st.nav, bootErrs: st.bootErrs, gaps: (st.gaps || []).filter(g => g[1] > 400), errs: [...new Set([...(st.errs || []), ...cons.filter(c => /error|fail|goto/i.test(c))])].slice(0, 8), skewed };
  if (freeze && OUT) {
    const dir = join(OUT, `${tag}-${Date.now()}`); mkdirSync(dir, { recursive: true });
    try { writeFileSync(join(dir, 'shot.png'), await page.screenshot({ timeout: 5000 })); } catch { /* the page is stuck */ }
    writeFileSync(join(dir, 'freeze.json'), JSON.stringify({ ...row, stage: st, console: cons.slice(-200), pending: [...pend.values()] }, null, 1));
    row.dump = dir;
  }
  results.push(row);
  if (!QUIET || freeze) console.log(`${tag.padEnd(14)} reveal ${reveal < 0 ? 'NEVER' : reveal + ' ms'}${st.nav === 'reload' ? ' (after THE WATCHDOG’S reload)' : ''} · tap ${tap == null ? '—' : tap < 0 ? 'DEAD' : tap + ' ms'}${row.gaps.length ? ` · gaps ${row.gaps.map(g => g[1]).join('/')}` : ''}${row.errs.length ? ` · ERR ${row.errs[0].slice(0, 120)}` : ''}${freeze ? `  ✗ FREEZE (${kind})${st.boot ? ` boot ${st.boot}, css ${st.cssReady}, district ${st.district}, preload ${st.preload}, ${st.sw}` : ''}` : ''}`);
  return row;
}

for (let i = 1; i <= RUNS; i++) {
  if (SKEW) line.switchTo(UP);
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
  await ctx.addInitScript(INIT, [CPU, SW && !LIVE, JUNK]);
  if (XHANG) await ctx.route(new RegExp(XHANG), () => { /* never answered */ });
  if (XFAIL) await ctx.route(new RegExp(XFAIL), r => r.abort('failed').catch(() => {}));
  const page = await ctx.newPage();
  const pend = new Map(), cons = [];
  page.on('request', r => pend.set(r, { url: r.url().replace(BASE, ''), at: Date.now() }));
  page.on('requestfinished', r => pend.delete(r));
  page.on('requestfailed', r => { cons.push(`requestfailed ${r.url().replace(BASE, '')} ${r.failure() && r.failure().errorText}`); pend.delete(r); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') cons.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', e => cons.push('pageerror: ' + e.message));
  await load(page, `${i}-cold${SKEW ? '-mid' : ''}`, pend, cons);
  if (WARM) {
    if (SKEW) line.switchTo(SKEW_TO);   // (between loads: the deploy landed while the tab sat)
    await load(page, `${i}-warm${SKEW ? '-after' : ''}`, pend, cons);
  }
  await ctx.close();
}
await browser.close();
if (line) await line.close();

const ok = results.filter(r => !r.freeze), med = a => { const s = a.filter(x => x >= 0).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : -1; };
const sum = k => { const rs = results.filter(r => r.tag.includes(k)); const f = rs.filter(r => r.freeze); return `${k}: ${rs.length} loads, ${f.length} freezes${f.length ? ` (${f.map(r => r.kind).join(', ')})` : ''} · reveal median ${med(rs.map(r => r.reveal))} ms, worst ${Math.max(...rs.map(r => r.reveal))} ms · tap median ${med(rs.map(r => r.tap ?? -1))} ms`; };
console.log(`\n${sum('cold')}\n${WARM ? sum('warm') : ''}\nthe line: ${LIVE ? 'live' : `rtt ${RTT} ms, ${MBPS} Mbps, drop ${DROP}`} · cpu ${CPU}× · sw ${SW ? 'on' : 'off'}${line ? ` · ${JSON.stringify(line.stats())}` : ''}`);
if (opt('json', '')) writeFileSync(opt('json'), JSON.stringify(results, null, 1));
process.exit(results.length - ok.length ? 1 : 0);
