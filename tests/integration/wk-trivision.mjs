// PLAY NOW — 0c: THE ROOF BOARD TURNS on a PLAIN load (the owner's iPhone, Nov 13 7:43 am: after a refresh it stayed on HOLD'EM; it had
// turned at 6:54). In Safari's engine (Playwright's WebKit, 390×844 @3), NO force flags — the real clock (JAYWALK is up from Nov 12):
//   plain    both faces on the board within 2 min of the reveal
//   reload   the same after a reload
//   hidden   10 min hidden (visibilityState + the event, as Safari's tab switch) → back: both faces again within 2 min (HIDE_MIN=… to shorten)
//   artfail  the poster's art fails twice (a 503) → retried (3 s, 15 s), both faces within 2 min, and /admin told ('trivision art')
//   node tests/integration/wk-trivision.mjs [--base http://localhost:5173] [--only plain,reload,hidden,artfail]   (serve.mjs --emu + the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', 'http://localhost:5173'), ONLY = (opt('only', '') || '').split(',').filter(Boolean);
const HIDE_MS = Number(process.env.HIDE_MIN || 10) * 60e3;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const browser = await webkit.launch();
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)';
const TRI = '(() => { const D = window.__district; const t = D && D.tri ? D.tri() : null; return t ? { shown: t.shown, ready: t.ready, fails: t.fails, n: t.n } : null; })()';

async function page(name, { artFails = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } });
  const p = await ctx.newPage();
  const logs = [];
  let failsLeft = artFails;
  await p.route(/\/assets\/city\/jaywalk\/billboard\.webp/, r => { if (failsLeft > 0) { failsLeft--; return r.fulfill({ status: 503, body: 'no' }); } return r.continue(); });
  p.on('request', r => { if (r.url().includes('/api/log') && /TRI-VISION/.test(r.postData() || '')) logs.push(r.postData()); });
  const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(200); } return false; };
  await p.goto(guardUrl(`${BASE}/?emu&slot=tv${name.slice(0, 3)}${Date.now() % 1000}`, 'wk-trivision.mjs'));
  if (!await waitFor(UP, 45000)) { ok(false, `${name}: the city up`); return { ctx, p, logs, waitFor }; }
  return { ctx, p, logs, waitFor };
}
/** watch the board ≤ ms: the faces seen (0 HOLD'EM, 1 JAYWALK), the most fails */
async function watch(p, ms) {
  const seen = new Set(); let fails = 0, ready = false; const end = Date.now() + ms;
  while (Date.now() < end) { const t = await p.evaluate(TRI).catch(() => null); if (t) { if (t.ready) { seen.add(t.shown); ready = true; } fails = Math.max(fails, t.fails || 0); } if (seen.size === 2) break; await sleep(500); }
  return { seen: [...seen], fails, ready };
}

if (!ONLY.length || ONLY.includes('plain') || ONLY.includes('reload')) {
  const { ctx, p } = await page('plain');
  const w = await watch(p, 125e3);
  ok(w.seen.length === 2, `plain: both faces within 2 min of the reveal (seen ${w.seen.join(' + ') || 'none'}, art ready ${w.ready})`);
  if (!ONLY.length || ONLY.includes('reload')) {
    await p.reload();
    await p.waitForFunction(UP, null, { timeout: 45000 }).catch(() => {});
    const w2 = await watch(p, 125e3);
    ok(w2.seen.length === 2, `reload: both faces within 2 min (seen ${w2.seen.join(' + ') || 'none'})`);
  }
  await ctx.close();
}
if (!ONLY.length || ONLY.includes('artfail')) {
  const { ctx, p, logs } = await page('artfail', { artFails: 2 });
  const w = await watch(p, 125e3);
  ok(w.fails >= 2 && w.seen.length === 2, `artfail: the art failed ${w.fails}× → retried, both faces within 2 min (seen ${w.seen.join(' + ') || 'none'})`);
  // (a robot browser sends nothing — errlog.js's BOTS OUT OF /admin — so the page's own record of what it reports is read)
  const told = await p.evaluate("(window.__errlog ? window.__errlog.seen() : []).filter(k => /trivision art: THE TRI-VISION/.test(k))").catch(() => []);
  ok(told.length >= 1 || logs.length >= 1, `artfail: /admin told (${told[0] ? told[0].slice(0, 110) : 'nothing'})`);
  await ctx.close();
}
if (!ONLY.length || ONLY.includes('hidden')) {
  const { ctx, p } = await page('hidden');
  const w0 = await watch(p, 125e3);
  const hide = v => p.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event(h ? 'blur' : 'focus')); }, v);
  await hide(true);
  console.log(`     (hidden for ${HIDE_MS / 60e3} min …)`);
  await sleep(HIDE_MS);
  await hide(false);
  const w = await watch(p, 125e3);
  ok(w0.seen.length === 2 && w.seen.length === 2, `hidden: before ${w0.seen.join(' + ')}; after ${HIDE_MS / 60e3} min hidden, both faces within 2 min (seen ${w.seen.join(' + ') || 'none'})`);
  await ctx.close();
}
await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-trivision: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
