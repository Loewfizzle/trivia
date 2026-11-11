// LOAD FIX 4 — THE DEPLOY SKEW in Safari's engine (Grok's boot audit #7 + #8): a page loaded on deploy A must never link deploy B's modules
// into A's graph and fail SILENTLY. Playwright's WebKit (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone, through
// THE LINE (kit/line-proxy.mjs) in front of TWO local servers on the same tree — A (:5176) and B (:5177), each answering its own deploy id
// on /api/time (VERCEL_GIT_COMMIT_SHA). DEPLOY B = A's files + ONE NEW EXPORT in js/ui/dom.js (SKEW_PROBE) + the lazy file under test
// importing it; the line switches A → B on the FIRST request for that file ("the deploy landed right before this import").
//   (a) THE CITY's GRAPH mid-load: a city module's first answer imports an export nobody has → title.js#tryHarbor: skew at once (no 3 tries)
//       → the watchdog's skew path (the boot's files asked for afresh) → ONE reload → revealed
//   (b) a tab open on A: the radio's gate (2.5 s after the boot) · HOST → the room's screen · the game's cartridge (registry.js#loadGame) —
//       each → ONE reload onto B, and the thing works after it (the room back by the rejoin)
//   (c) the same deploy (the line "switches" A → A): the same link error → NO reload (the caller's own warning, as before)
//   node tests/integration/wk-skew.mjs [--out DIR] [--only a,b-radio,b-host,b-game,c]   (on the emulators; starts + stops its own servers)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const OUT = opt('out', ''), ONLY = (opt('only', '') || '').split(',').filter(Boolean);
const ROOT = process.env.SKEW_ROOT || fileURLToPath(new URL('../..', import.meta.url));   // (SKEW_ROOT: serve another tree — the BEFORE run)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const PA = 5176, PB = 5177, PL = 5182;
const A = `http://localhost:${PA}`, B = `http://localhost:${PB}`;

const serve = (port, v) => new Promise((ok, bad) => {
  const ch = spawn(process.execPath, [join(ROOT, 'scripts/serve.mjs'), String(port), '--emu'], { env: { ...process.env, VERCEL_GIT_COMMIT_SHA: v }, stdio: ['ignore', 'pipe', 'pipe'] });
  ch.stdout.on('data', d => { if (/serving/.test(String(d))) ok(ch); });
  ch.on('exit', c => bad(new Error(`serve ${port} exited ${c}`)));
});
const servers = [await serve(PA, 'deployA00000'), await serve(PB, 'deployB00000')];
const line = await startLine({ port: PL, to: A, rtt: 20, mbps: 80 });
const browser = await webkit.launch();
if (OUT) mkdirSync(OUT, { recursive: true });

const DOM_B = { re: '^/js/ui/dom\\.js$', from: 'export function h(sel, props, ...children) {', to: "export const SKEW_PROBE = 'B';\nexport function h(sel, props, ...children) {" };
const NEEDS = name => ({ prepend: `import { ${name} } from '/js/ui/dom.js'; void ${name};\n` });
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const URL0 = `http://localhost:${PL}/?emu&slot=sk&when=2026-11-06T13:02&wx=overcast&tz=America/Detroit&at=42.96,-85.67&city=2`;
const REVEALED = "(() => { const b = document.getElementById('boot'); return !!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()";

async function page() {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:sk:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); sessionStorage.setItem('t:navs', String(Number(sessionStorage.getItem('t:navs') || 0) + 1)); } catch { /* fine */ }
    window.__wireDelay = 600000;   // (the lobby's cartridge wiring held: (b)'s game case asks for the cartridge itself)
  });
  const p = await ctx.newPage();
  const cons = [];
  p.on('console', m => cons.push(`${m.type()}: ${m.text()}`));
  p.on('pageerror', e => cons.push(`pageerror: ${e.message}`));
  return { ctx, p, cons };
}
const navs = p => p.evaluate("Number(sessionStorage.getItem('t:navs') || 0)").catch(() => -1);
async function waitFor(p, js, ms) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(150); } return false; }
const run = name => !ONLY.length || ONLY.includes(name);

// (a) THE CITY's GRAPH mid-load
if (run('a')) {
  line.set({ switchOn: null, mangle: null, rules: [{ re: '^/js/screens/harbor/meteors\\.js$', ...NEEDS('NOPE_PROBE'), n: 1 }] });   // (its FIRST answer only)
  const { ctx, p, cons } = await page();
  const t0 = Date.now();
  p.goto(URL0).catch(() => {});
  const up = await waitFor(p, REVEALED, 40000);
  const n = await navs(p);
  const down = await p.evaluate("!!document.querySelector('.nd-citydown, .nd-down')").catch(() => false);
  const skewNote = cons.find(c => /failed to link|NOPE_PROBE/.test(c));
  ok(up && n === 2 && !down, `(a) THE CITY's GRAPH mid-load (a city module from another deploy — a missing export): ${up ? `revealed at ${((Date.now() - t0) / 1000).toFixed(1)} s` : 'NEVER REVEALED'} after ${n - 1} reload${n - 1 === 1 ? '' : 's'} (the link error ${skewNote ? 'seen' : 'NOT seen'}${down ? ', THE CITY COULDN’T LOAD' : ''})`);
  if (OUT) await p.screenshot({ path: join(OUT, 'skew-a.png') }).catch(() => {});
  await ctx.close();
}

// (b) + (c): a page loaded on A; the line switches on the first request for `file`; `act` makes the page ask for it
async function lazyCase(tag, { file, to = B, act, after, expectReload = true }) {
  line.switchTo(A);
  line.set({ rules: [], mangle: null, switchOn: null });
  const { ctx, p, cons } = await page();
  await p.goto(URL0);
  await waitFor(p, REVEALED, 30000);
  const pre = act && act.pre ? await act.pre(p) : null;
  line.set({ switchOn: { re: file, to, rules: [DOM_B, { re: file, ...NEEDS('SKEW_PROBE') }] } });
  const t1 = Date.now();
  if (act && act.go) await act.go(p, pre).catch(() => {});
  let n = 1;
  const reloaded = await waitFor(p, "Number(sessionStorage.getItem('t:navs') || 0) >= 2", expectReload ? 20000 : 9000);
  if (reloaded) { await waitFor(p, REVEALED, 30000); n = await navs(p); }
  const works = reloaded || !expectReload ? await after(p, pre).catch(e => `threw: ${e.message}`) : 'no reload';
  await sleep(1500);
  const n2 = await navs(p);
  const st = line.stats();
  const rk = await p.evaluate("sessionStorage.getItem('ns:skew-re')").catch(() => null);
  const skewLine = cons.find(c => /\[skew\]/.test(c));
  if (expectReload) ok(reloaded && n2 === 2 && works === true, `(b) ${tag}: deploy A → B on its first request (${st.switchedAt}) → ${reloaded ? `ONE reload ${((Date.now() - t1) / 1000).toFixed(1)} s later (for ${rk})` : 'NO RELOAD'}, ${n2 - 1} in all; after it: ${works === true ? 'it works' : works}`);
  else ok(!reloaded && n2 === 1 && works === true, `(c) ${tag}: the same deploy (A → A) → ${reloaded ? 'A RELOAD (wrong)' : 'no reload'} (${skewLine ? skewLine.slice(0, 90) : 'the caller’s own warning'}); ${works === true ? 'the page goes on' : works}`);
  if (OUT) await p.screenshot({ path: join(OUT, `skew-${tag.replace(/\W+/g, '-')}.png`) }).catch(() => {});
  await ctx.close();
}
const host = {
  pre: async p => { await p.evaluate("document.querySelector('.nd-hostbtn').click()"); },
  go: async () => {},
};
const inRoom = p => waitFor(p, "!!(window.__arcade && window.__arcade.state.code && window.__arcade.state.meta && document.querySelector('.rdk-play'))", 25000);

if (run('b-radio')) await lazyCase('the radio’s gate (2.5 s after the boot)', {
  file: '^/js/screens/harbor/radio-gate\\.js$',
  act: { pre: async () => null, go: async () => {} },
  after: async p => { const g = await waitFor(p, "performance.getEntriesByType('resource').some(e => /radio-gate\\.js/.test(e.name))", 12000); await sleep(1500); return g ? true : 'radio-gate.js never asked for after the reload'; },
});
if (run('b-host')) await lazyCase('HOST → the room’s screen (room-city.js)', {
  file: '^/js/screens/room-city\\.js$',
  act: { pre: async () => null, go: async p => { await p.evaluate("document.querySelector('.nd-hostbtn').click()"); } },
  after: async p => ((await inRoom(p)) ? true : 'NOT back in the room with its screen'),   // (no reload = the room with no room screen)
});
if (run('b-game')) await lazyCase('the game’s cartridge in the lobby (PRISM DROP — registry.js#loadGame)', {
  file: '^/js/games/prism/index\\.js$',
  act: { pre: async p => { await p.evaluate("document.querySelector('.nd-hostbtn').click()"); await inRoom(p); return p.evaluate('window.__arcade.state.code'); },
    go: async p => { await p.evaluate("import('/js/games/registry.js').then(R => R.loadGame('prism')).catch(() => {})"); } },
  after: async (p, code) => {
    if (!(await inRoom(p))) return 'NOT back in the room';
    const c = await p.evaluate('window.__arcade.state.code');
    const m = await p.evaluate("import('/js/games/registry.js').then(R => R.loadGame('prism')).then(m => !!(m && m.createView)).catch(e => 'threw ' + e.message)");
    return c === code && m === true ? true : `room ${c} (was ${code}), the cartridge: ${m}`;
  },
});
if (run('c')) await lazyCase('the radio’s gate', {
  file: '^/js/screens/harbor/radio-gate\\.js$', to: A, expectReload: false,
  act: { pre: async () => null, go: async () => {} },
  after: async p => { await sleep(4000); return (await p.evaluate(REVEALED)) ? true : 'the page is gone'; },
});

await browser.close();
await line.close();
for (const s of servers) s.kill();
const bad = results.filter(r => !r.ok);
console.log(`\nwk-skew: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
