// THE BEFORE-LAUNCH PASS — THE FIRST-VISIT BUNDLE end to end (docs/harbor.md "THE FIRST-VISIT BUNDLE"): Chromium + Playwright's WebKit, cold.
//   ?bundle=1  → the boot from /boot-bundle.json: the city reveals, 0 errors, ONE store instance for the bundle + a module imported by its real
//                URL (a lazy chunk's view), a dynamic relative import inside the bundle works, an error names the REAL file (errlog's unblob)
//   ?bundle=1 + the bundle refused → the modules (THE FALLBACK), the city reveals · no flag → the bundle in Chromium, the modules in WebKit
//   (THE FIX PASS — D3: every visit but Safari's) · ?nobundle → the modules
//   BUNDLE_MISSING=1 E2E_BASE=<a serve.mjs --raw of the checkout> → no bundle on the server at all: every visit boots from the modules
//   node e2e-bundle.mjs "<chromium>"     (the emulators + scripts/serve.mjs --emu; E2E_BASE for another port; WebKit: ~/wk/node_modules/playwright)
import puppeteer from './kit/puppeteer.mjs';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
// (THE HOUSEKEEPING PASS — BUNDLE_MISSING=1: the server has NO /boot-bundle.json at all (serve.mjs --raw on a checkout: the committed page asks
//  for a file only a deploy builds) — every visit must still reveal, from the modules; the deploy's own output: deploy-sim.mjs + E2E_BASE)
const MISSING = process.env.BUNDLE_MISSING === '1';
const Q = '?emu&slot=bb&when=2026-11-06T21:30&wx=clear&tz=America/Detroit&at=42.96,-85.67';
const fails = [];
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); if (!c) fails.push(m); };
const REVEAL = '!!(window.__district && window.__district.harbor && window.__district.harbor() && window.__district.harbor().shown)';
const CHECKS = async () => ({
  boot: window.__nsBoot,
  one: (await import('/js/store.js')).state === window.__arcade.state,
  help: typeof (await import('/js/ui/help-open.js')).openHelp,
  err: await import('/js/errlog.js').then(m => { try { (0, m.normalizeError)({ error: (() => { try { null.x; } catch (e) { return e; } })() }, location.origin); } catch { /* */ } const e = new Error('probe'); e.stack = `Error: probe\n    at f (${Object.keys(window.__nsBlobs || {})[0] || 'none'}:12:3)`; return m.normalizeError({ error: e }, location.origin); }).catch(x => ({ s: 'ERR ' + x.message })),
});

async function engine(name, open) {
  // (THE FIX PASS — D3: no flag = the bundle in Chromium, the modules in WebKit — Safari keeps the old path; ?nobundle = the modules anywhere)
  for (const [label, qs, block, want] of [['bundle', '&bundle=1', false, 'bundle'], ['fallback (the bundle refused)', '&bundle=1', true, 'modules'], ['no flag (THE FIX PASS: every visit but Safari’s)', '', false, name === 'webkit' ? 'modules' : 'bundle'], ['?nobundle', '&nobundle', false, 'modules']].map(c => (MISSING ? [c[0] + ' — NO BUNDLE ON THE SERVER', c[1], false, 'modules'] : c))) {
    const P = await open(block), errs = [];
    P.onErr(t => errs.push(t));
    await P.goto(guardUrl(`${BASE}/${Q}${qs}`, 'e2e-bundle.mjs'));
    const up = await P.wait(REVEAL, 90000);
    const r = up ? await P.eval(CHECKS) : null;
    ok(up && r && r.boot.mode === want, `${name} ${label}: the city reveals in ${r && r.boot.mode} mode${r && r.boot.why ? ` (${r.boot.why})` : ''}${r && r.boot.n ? ` — ${r.boot.n} modules in ${r.boot.ms} ms` : ''}`);
    if (r) ok(r.one && r.help === 'function', `${name} ${label}: ONE store instance (the bundle's = a real-URL import's), a lazy import resolves`);
    if (r && want === 'bundle') ok(/^js\//.test(r.err.s || ''), `${name} ${label}: an error's frame names the real file (${r.err.s}:${r.err.l})`);
    ok(!errs.length, `${name} ${label}: no page errors${errs.length ? ` — ${errs.slice(0, 3).join(' | ')}` : ''}`);
    await P.close();
  }
}

// Chromium
{
  const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  await engine('chromium', async block => {
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (block) { await p.setRequestInterception(true); p.on('request', r => (/boot-bundle\.json/.test(r.url()) ? r.respond({ status: 503, body: 'no' }) : r.continue())); }
    return { onErr: f => { p.on('pageerror', e => f(e.message)); }, goto: u => p.goto(u, { waitUntil: 'domcontentloaded' }), wait: (js, ms) => p.waitForFunction(js, { timeout: ms }).then(() => true, () => false), eval: fn => p.evaluate(fn), close: () => ctx.close() };
  });
  await b.close();
}
// WebKit (Playwright's — iOS Safari's engine)
try {
  const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
  const b = await webkit.launch();
  await engine('webkit', async block => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }), p = await ctx.newPage();
    if (block) await p.route(/boot-bundle\.json/, r => r.fulfill({ status: 503, body: 'no' }));
    return { onErr: f => { p.on('pageerror', e => f(e.message)); }, goto: u => p.goto(u, { waitUntil: 'domcontentloaded' }), wait: (js, ms) => p.waitForFunction(js, null, { timeout: ms }).then(() => true, () => false), eval: fn => p.evaluate(fn), close: () => ctx.close() };
  });
  await b.close();
} catch (e) { ok(false, `webkit: ${e.message}`); }
console.log(fails.length ? `${fails.length} FAILED` : 'e2e-bundle: all green');
process.exit(fails.length ? 1 : 0);
