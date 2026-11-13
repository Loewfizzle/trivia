// PLAY NOW — 0d: THE SUPPORTED FLOOR is iOS / Safari 15.4. In Safari's engine (Playwright's WebKit, 390×844 @3) as an iOS 15.4–15.8 page:
//   lacks15  the APIs 15.4–15.8 don't have, taken away before any script (the canvas roundRect on the 2D context + Path2D, OffscreenCanvas,
//            AbortSignal.timeout, navigator.userActivation) → the city reaches its reveal and plays on for 8 s with NO page error
//   ua154    &oldua=<an iOS 15.4 UA> → the boot is NOT "too old" (the city comes up)
//   ua153    &oldua=<an iOS 15.3 UA> → the plain "too old" line, no city
//   node tests/integration/wk-floor.mjs [--base http://localhost:5173]   (serve.mjs --emu + the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', 'http://localhost:5173');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const browser = await webkit.launch();
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)';
const UA = v => `Mozilla/5.0 (iPhone; CPU iPhone OS ${v} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v.replace('_', '.')} Mobile/15E148 Safari/604.1`;

async function run(name, { strip = false, oldua = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(s => {
    try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
    if (s) {
      for (const C of [window.CanvasRenderingContext2D, window.Path2D]) { try { delete C.prototype.roundRect; } catch { /* fine */ } }
      try { delete window.OffscreenCanvas; } catch { /* fine */ }
      try { delete AbortSignal.timeout; } catch { /* fine */ }
      try { Object.defineProperty(navigator, 'userActivation', { value: undefined, configurable: true }); } catch { /* fine */ }
      window.__stripped = typeof CanvasRenderingContext2D.prototype.roundRect;
    }
  }, strip);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; };
  await p.goto(guardUrl(`${BASE}/?emu&slot=fl${name.slice(-3)}${Date.now() % 1000}${oldua ? `&oldua=${encodeURIComponent(oldua)}` : ''}`, 'wk-floor.mjs'));
  const out = { p, ctx, errs, waitFor };
  return out;
}

{ // lacks15
  const { p, ctx, errs, waitFor } = await run('lacks15', { strip: true });
  const stripped = await p.evaluate('window.__stripped').catch(() => '?');
  const up = await waitFor(UP, 45000);
  await sleep(8000);
  const filled = await p.evaluate("typeof CanvasRenderingContext2D.prototype.roundRect === 'function' && typeof Path2D.prototype.roundRect === 'function'").catch(() => false);
  ok(stripped === 'undefined' && up && filled && errs.length === 0, `lacks15: roundRect taken away (${stripped}) → filled in (${filled}); the city up (${up}), 8 s on with no page error (${errs.slice(0, 2).join(' | ') || 'none'})`);
  await ctx.close();
}
{ // ua154
  const { ctx, waitFor } = await run('ua154', { oldua: UA('15_4') });
  const up = await waitFor(UP, 45000);
  const old = await waitFor("!!document.querySelector('#boot[data-old]')", 500);
  ok(up && !old, `ua154: an iOS 15.4 phone is not "too old" (the city up ${up})`);
  await ctx.close();
}
{ // ua153
  const { p, ctx, waitFor } = await run('ua153', { oldua: UA('15_3') });
  const old = await waitFor("!!document.querySelector('#boot[data-old]')", 15000);
  const txt = old ? await p.evaluate("document.querySelector('#boot .boot-status').textContent") : '';
  ok(old && /too old/.test(txt), `ua153: an iOS 15.3 phone gets the plain "too old" line (${txt.slice(0, 60)})`);
  await ctx.close();
}
await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-floor: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
