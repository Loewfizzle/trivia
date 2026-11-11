// LOAD FIX 4 — THE HIDDEN BOOT in Safari's engine (Grok's boot audit #6): the phone locked / switched to Messages WHILE the boot screen shows
// must never reveal a half-built city. Playwright's WebKit (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone, through
// THE LINE (kit/line-proxy.mjs, 40 ms / 40 Mbps). The page is HIDDEN the moment the city's scene has started (its loop + bakes running) —
// document.visibilityState faked to 'hidden' + a visibilitychange (Playwright can't background a tab; the scene, the watchdog and
// ui/onscreen.js all read visibilityState) — for --hide ms (5 s, 30 s), then shown again. Each run: the reveal must come only AFTER the
// return, on the READY gates (the LOAD LOG's reveal 'ready', not 'late'), with no change after it (the LOAD LOG's visible rows — no re-bake,
// no crossfade: no pop-in), and the boot screen must not lift while hidden. Plus plain loads (no hide) for the reveal time.
//   node tests/integration/wk-hidden.mjs [--upstream http://localhost:5173] [--hides 5000,30000] [--runs 2] [--plain 3]   (on the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const UP = opt('upstream', 'http://localhost:5173'), HIDES = String(opt('hides', '5000,30000')).split(',').map(Number), RUNS = +opt('runs', 2), PLAIN = +opt('plain', 3);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const line = await startLine({ port: 5183, to: UP, rtt: 40, mbps: 40 });
const browser = await webkit.launch();
const URL0 = 'http://localhost:5183/?emu&slot=hd&when=2026-11-06T21:30&wx=clear&tz=America/Detroit&at=42.96,-85.67&city=2';
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };

const INIT = () => {
  try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  let fake = null;
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => fake || 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => fake === 'hidden' });
  const H = window.__hd = { liftedHidden: false, revealHidden: false, hideAt: null, showAt: null };
  window.__hide = on => { fake = on ? 'hidden' : null; if (on) H.hideAt = performance.now(); else H.showAt = performance.now(); document.dispatchEvent(new Event('visibilitychange')); };
  // (watch the boot screen + the scene's canvas: neither may come up while hidden)
  const watch = () => {
    const b = document.getElementById('boot'), w = document.querySelector('.nd-scene');
    if (fake === 'hidden') { if (b && b.classList.contains('out')) H.liftedHidden = true; if (w && !w.classList.contains('is-hold')) H.revealHidden = true; }
    setTimeout(watch, 50);
  };
  setTimeout(watch, 50);
};
const PROBE = "(() => { const d = window.__district; if (!d || !d.loadProbe) return null; const p = d.loadProbe(); let hb = null; try { hb = d.harbor && d.harbor(); } catch { /* fine */ } return { shown: !!p.shown, bakes: hb ? hb.bakes : null, reveal: hb && hb.reveal, log: hb && hb.loadLog ? { visible: hb.loadLog.visible, rows: hb.loadLog.rows.filter(r => r.kind === 'reveal' || r.kind === 'bake' || r.kind === 'clouds' || r.kind === 'sky').map(r => `${r.kind}@${r.t} ${r.msg}`).slice(-6) } : null }; })()";
const BOOTGONE = "(() => { const b = document.getElementById('boot'); return !b || b.classList.contains('out'); })()";

async function load(hide) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  const t0 = Date.now();
  p.goto(URL0).catch(() => {});
  let hidAt = null, shownAgain = null;
  if (hide) {
    // (hide the moment the city's scene has started — its first bake under way, nothing shown yet)
    const end = Date.now() + 20000;
    while (Date.now() < end) { const s = await p.evaluate("!!(window.__district && window.__district.loadProbe && !window.__district.loadProbe().shown && window.__district.harbor && window.__district.harbor())").catch(() => false); if (s) break; await sleep(20); }
    await p.evaluate('window.__hide(true)'); hidAt = Date.now();
    await sleep(hide);
    await p.evaluate('window.__hide(false)'); shownAgain = Date.now();
  }
  const end = Date.now() + 30000;
  let up = false;
  while (Date.now() < end) { const pr = await p.evaluate(PROBE).catch(() => null); if (pr && pr.shown && (await p.evaluate(BOOTGONE).catch(() => false))) { up = true; break; } await sleep(30); }
  const tUp = Date.now();
  await sleep(4000);
  const pr = await p.evaluate(PROBE).catch(() => null), H = await p.evaluate('window.__hd').catch(() => ({}));
  await ctx.close();
  return { up, ms: tUp - t0, afterShow: shownAgain ? tUp - shownAgain : null, hidMs: hidAt ? hidAt - t0 : null, pr, H };
}

const plain = [];
for (let i = 0; i < PLAIN; i++) { const r = await load(0); plain.push(r.ms); ok(r.up && r.pr && r.pr.log && r.pr.log.visible.length === 0, `a plain load: revealed at ${(r.ms / 1000).toFixed(2)} s, why ${r.pr && r.pr.reveal && r.pr.reveal.why}, ${r.pr && r.pr.log ? r.pr.log.visible.length : '?'} changes after`); }
for (const hide of HIDES) for (let i = 0; i < RUNS; i++) {
  const r = await load(hide);
  const why = r.pr && r.pr.reveal && r.pr.reveal.why, vis = r.pr && r.pr.log ? r.pr.log.visible : null;
  ok(r.up && !r.H.liftedHidden && !r.H.revealHidden && why === 'ready' && vis && vis.length === 0,
    `hidden ${hide / 1000} s mid-bake (from ${(r.hidMs / 1000).toFixed(2)} s): ${r.up ? `revealed ${(r.afterShow / 1000).toFixed(2)} s after the return` : 'NEVER REVEALED'}, why '${why}'${r.H.liftedHidden ? ', THE BOOT SCREEN LIFTED WHILE HIDDEN' : ''}${r.H.revealHidden ? ', THE CITY SHOWN WHILE HIDDEN' : ''}; after the reveal: ${vis ? (vis.length ? vis.map(x => `${x.kind} ${x.msg}`).join(' | ') : 'no change (no pop-in)') : '?'}`);
}
plain.sort((a, b) => a - b);
console.log(`\nthe plain reveal (median of ${plain.length}): ${(plain[plain.length >> 1] / 1000).toFixed(2)} s`);
await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-hidden: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
