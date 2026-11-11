// LOAD FIX 5 (Nov 11) — NO TWO CAMERAS, in Safari's engine: the owner's DOUBLED CITY (his iPhone, Safari, the first open of the day, fog —
// docs/harbor/passes/load-fix-5/owner-iphone.png: the billboard, EST. 1924 and the PRISM DROP blade each twice). Playwright's WebKit
// (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×659 @3 — the owner's page between Safari's bars — his morning (Nov 11 8:30, fog).
// EVERY path that can change the city's camera, its box or its bake (kit/two-cameras.mjs — the list + what each one is: a restored tab, a
// bfcache return, a frozen tab resumed, hours hidden, the late weather, Safari's bars, a tier step, the box before the reveal …), each
// watched on EVERY frame + by PIXELS (one copy of the billboard, EST. 1924 and the blade). The same runner drives Chromium in the harbor
// `load` group (harbor-e2e/city.mjs#noTwoCameras).
//   node tests/integration/wk-double.mjs [--paths all|a,b] [--shots DIR] [--json out.json] [--vh 659] [--grow 712] [--log]
// Exit 1 when any path showed two cameras (frames or pixels). On the emulators + scripts/serve.mjs --emu.
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { ALL_PATHS, PIXELS, runPath } from './kit/two-cameras.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const VH = Number(opt('vh', 659)), GROW = Number(opt('grow', 712)), SHOTS = opt('shots', '') || '';
const pathsArg = String(opt('paths', 'all'));
const PATHS = pathsArg === 'all' ? ALL_PATHS : pathsArg.split(',');
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const helper = await (await browser.newContext()).newPage();
await helper.goto('about:blank');

// (the driver: Playwright's WebKit as an iPhone)
const D = {
  async open({ vh, inits, routes }) {
    const ctx = await browser.newContext({ viewport: { width: 402, height: vh }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    for (const [fn, arg] of inits) await ctx.addInitScript(fn, arg);
    for (const [re, answer] of routes) await ctx.route(re, async r => { const a = await answer(); r.fulfill({ status: a.status, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: a.body }).catch(() => {}); });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    return {
      errors,
      ev: js => page.evaluate(js).catch(() => null),
      goto: url => page.goto(url, { waitUntil: 'commit', timeout: 60000 }),
      vp: h => page.setViewportSize({ width: 402, height: h }).catch(() => {}),
      shot: async () => { try { return { png: await page.screenshot({ scale: 'css', timeout: 8000 }), k: 1 }; } catch { return null; } },
      back: () => page.goBack({ waitUntil: 'commit' }),
      close: () => ctx.close(),
    };
  },
  pixels: (a, b, boxes, k) => helper.evaluate(PIXELS, [a.toString('base64'), b.toString('base64'), boxes, k]),
};

const results = [];
for (const name of PATHS) {
  const r = await runPath(D, name, { base: BASE, vh: VH, grow: GROW, slot: 'w5', guard: u => guardUrl(u, 'wk-double.mjs') });
  console.log(`${r.bad ? 'FAIL' : 'OK  '} ${r.line}`);
  if (opt('log', false) && r.info) for (const l of r.info.log) console.log('      ' + l);
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); const tag = name.replace(/[@]/g, '-'); r.pics.forEach((p, i) => { if (r.bad || i === r.pics.length - 1 || /after|landed|away|return|BACK/.test(p.label)) writeFileSync(join(SHOTS, `${tag}-${i}-${p.label.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`), p.png); }); }
  delete r.pics; results.push(r);
}
await browser.close();
if (opt('json', '')) writeFileSync(opt('json'), JSON.stringify(results, null, 1));
const bad = results.filter(r => r.bad);
console.log(`\nwk-double: ${results.length} paths · ${bad.length} with two cameras${bad.length ? ` (${bad.map(r => r.name).join(', ')})` : ''}`);
process.exit(bad.length ? 1 : 0);
