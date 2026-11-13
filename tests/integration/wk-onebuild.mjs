// PLAY NOW — Group 0a: ONE BUILD PER PAGE — a phone never runs two deploys' code at once (C2: the owner's iPhone ran an OLD cached
// js/audio/music.js beside the NEW radio-ledger.js → "Importing binding name 'musicFileOf' is not found", the LEDGER dead).
// Through THE LINE with production's headers + a build id on /api/time (kit/line-proxy.mjs), the worker registered by the test (localhost
// skips it), as the owner (the radio's faces):
//   1. a page boots on build A (the worker's copy) and opens the radio DESK
//   2. build B is PUBLISHED under it: music.js gains a new export, and the LEDGER + PRISM DROP's cartridge import it (exactly C2's shape)
//   3. on the A page: PRISM DROP's cartridge (never loaded on A) → ONE clean reload to B (the worker asks, the page reloads) — never a mix
//   4. on B: DESK → PROGRAM → LEDGER paint their real content, the LEDGER + the cartridge are B's (the new export linked), the profile + THE
//      BOARD's modules load — no link error anywhere
//   5. A MATCH ON SCREEN (holdSkewReload): build C published — the next new chunk still loads (the network's, `mix`), no reload until the hold
//      ends, then ONE reload to C
//   6. a refresh → all C (the worker's pin = C)
//   node tests/integration/wk-onebuild.mjs [--browser webkit|chromium] [--upstream http://localhost:5173]   (serve.mjs --emu + the emulators)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { startLine } from './kit/line-proxy.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const UP = guardUrl(opt('upstream', 'http://localhost:5173'), 'wk-onebuild');
const BROWSER = opt('browser', 'webkit');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pw = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const PORT = BROWSER === 'webkit' ? 5187 : 5188;
const A = 'aaaa1111', B = 'bbbb2222', C = 'cccc3333';
const line = await startLine({ port: PORT, to: UP, rtt: 15, mbps: 100, prod: true, build: A });
const browser = await pw[BROWSER].launch(BROWSER === 'chromium' ? { executablePath: process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe' } : {});
const DB = 'http://127.0.0.1:9000';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const slot = `ob${BROWSER[0]}${Date.now() % 10000}`;
const URL0 = `http://localhost:${PORT}/?emu&slot=${slot}&when=2026-11-03T21:00&city=2`;
const UPJS = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)';
const FACES = {
  DESK: '!!document.querySelector(".rd-modal.is-in .rd-jack")',
  PROGRAM: '!!document.querySelector(".rd-paperwrap[data-face=program] .rd-paper")',
  LEDGER: '(() => { const w = document.querySelector(".rd-paperwrap[data-face=ledger]"); return !!(w && w.querySelector(".rd-big3 .rd-nixie") && /^NOW PLAYING · /.test((w.querySelector(".rd-np") || {}).textContent || "")); })()',
};
// (build B's files: C2's exact shape — a module gains an export, lazy chunks import it)
const rulesFor = tag => [
  { re: '^/js/audio/music\\.js$', prepend: `export const __only${tag} = 1;\n` },
  { re: '^/js/screens/harbor/radio-ledger\\.js$', prepend: `import { __only${tag} } from '../../audio/music.js'; globalThis.__ledger${tag} = __only${tag};\n` },
  { re: '^/js/games/prism/index\\.js$', prepend: `import { __only${tag} } from '../../audio/music.js'; globalThis.__prism${tag} = __only${tag};\n` },
  // (OVERCLOCK's cartridge changes too, but agrees with the older page — a match's chunk)
  { re: '^/js/games/overclock/index\\.js$', prepend: `globalThis.__oc${tag} = 1;\n` },
];
const MIXED = /Importing binding name|does not provide an export|SyntaxError|Importing a module script failed|error loading dynamically imported module/i;

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: BROWSER === 'webkit', hasTouch: true });
await ctx.addInitScript(s => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  if (navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}, slot);
const p = await ctx.newPage();
const cons = [], navs = [];
p.on('console', m => cons.push(`${m.type()}: ${m.text()}`));
p.on('pageerror', e => cons.push(`pageerror: ${e.message}`));
p.on('framenavigated', f => { if (f === p.mainFrame()) navs.push(Date.now()); });
const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(120); } return false; };
const mixedSince = i => cons.slice(i).filter(c => MIXED.test(c));
const skew = () => p.evaluate("import('/js/ui/lazy-import.js').then(m => m.skewDebug())").catch(() => null);
const openRadio = async (label) => {
  await p.evaluate(`(document.querySelector('.rd-modal.is-in .rd-x') || { click() {} }).click()`).catch(() => {});
  await sleep(300);
  if (!await waitFor('!!document.querySelector(".rd-btn")', 20000)) { ok(false, `${label}: the radio button`); return {}; }
  await p.evaluate(`document.querySelector('.rd-btn').click()`);
  const painted = {};
  for (const face of ['DESK', 'PROGRAM', 'LEDGER']) {
    await sleep(face === 'DESK' ? 600 : 0); await p.evaluate(`(([...document.querySelectorAll('.rd-bb')].find(b => b.textContent === '${face}')) || { click() {} }).click()`).catch(() => {});
    painted[face] = await waitFor(FACES[face], face === 'DESK' ? 8000 : 4000);
  }
  return painted;
};

try {
  // 1. cold → the worker takes over → the owner → a page on build A
  await p.goto(URL0);
  if (!await waitFor(UPJS, 45000)) throw new Error('the city never came up (cold)');
  await waitFor('!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 15000);
  let pid = null;
  for (let i = 0; i < 60 && !pid; i++) { pid = await p.evaluate(async () => { const m = await import('/js/profile/api.js'); try { return (await m.api('admin', { action: 'whoami' })).pid; } catch { return null; } }).catch(() => null); if (!pid) await sleep(500); }
  if (!pid) throw new Error('no owner profile');
  await dbPut(`testAdmins/${pid}`, true);
  await p.evaluate('sessionStorage.clear()');
  await p.goto(URL0);
  if (!await waitFor(UPJS, 45000)) throw new Error('the city never came up (A)');
  await sleep(1500);
  const sA = await skew();
  ok(sA && sA.worker === A && sA.page === A, `1. the page is on build A — the worker's pin ${sA && sA.worker}, the page's ${sA && sA.page}`);
  const deskA = await openRadio('A');
  ok(deskA.DESK, '1. on A: the radio DESK paints');

  // 2. build B published under the open A page
  await sleep(3500);   // (past the worker's 3-s trust in its last build answer — on a phone the deploy comes minutes later)
  line.set({ build: B, rules: rulesFor('B') });
  const c0 = cons.length, n0 = navs.length;
  // 3. a chunk the A page never loaded → ONE clean reload to B (never a mix)
  await p.evaluate("import('/js/games/prism/index.js').then(() => 'loaded', e => 'failed: ' + e.message)").catch(e => `navigated (${e.message.slice(0, 40)})`);
  const t3 = Date.now(); while (navs.length === n0 && Date.now() - t3 < 8000) await sleep(150);
  await sleep(1000);
  if (!await waitFor(UPJS, 45000)) ok(false, '3. the city back after the reload');
  await sleep(1500);
  const sB = await skew();
  ok(navs.length - n0 === 1, `3. B under an A page: the new chunk → ONE reload (${navs.length - n0} navigation${navs.length - n0 === 1 ? '' : 's'})`);
  ok(sB && sB.worker === B, `3. the reloaded page is on build B (the worker's pin ${sB && sB.worker})`);
  ok(mixedSince(c0).length === 0, `3. never a mix — no link error (${mixedSince(c0).slice(0, 2).join(' | ') || 'none'})`);

  // 4. on B: every lazy face paints, the new export linked everywhere
  const c1 = cons.length;
  const facesB = await openRadio('B');
  ok(facesB.DESK && facesB.PROGRAM && facesB.LEDGER, `4. on B: DESK ${facesB.DESK} · PROGRAM ${facesB.PROGRAM} · LEDGER ${facesB.LEDGER} paint their real content`);
  ok(await p.evaluate('globalThis.__ledgerB === 1'), '4. the LEDGER is B\'s (its new import linked)');
  const lazy = await p.evaluate(`Promise.all(['/js/games/prism/index.js', '/js/profile/me.js', '/js/board/screen.js'].map(u => import(u).then(() => 'ok', e => u + ': ' + e.message)))`);
  ok(lazy.every(x => x === 'ok') && await p.evaluate('globalThis.__prismB === 1'), `4. the cartridge (B's), the profile, THE BOARD load (${lazy.join(', ')})`);
  ok(mixedSince(c1).length === 0, `4. no link error on B (${mixedSince(c1).slice(0, 2).join(' | ') || 'none'})`);

  // 5. a match on screen: build C published — the next chunk still loads (mix: the network's file — it links when it agrees with the page's,
  //    as a match's own chunks do; one that needs a new export can't, and fails into its face's TAP TO RETRY), no reload until the hold ends,
  //    then ONE reload to C
  await p.evaluate("import('/js/ui/lazy-import.js').then(m => { globalThis.__holdOn = true; m.holdSkewReload(() => globalThis.__holdOn); })");
  await sleep(3500);
  line.set({ build: C, rules: rulesFor('C') });
  const n2 = navs.length;
  const oc = await p.evaluate("import('/js/games/overclock/index.js').then(() => 'loaded', e => 'failed: ' + e.message)").catch(e => `navigated: ${e.message.slice(0, 40)}`);
  await sleep(2500);
  ok(/loaded|failed/.test(oc) && navs.length === n2, `5. a match on screen: the new chunk answered (${oc}) and no reload mid-match (${navs.length - n2} navigations)`);
  ok(oc === 'loaded', '5. … and it LOADED (the network\'s file — never a dead face mid-match)');
  await p.evaluate('globalThis.__holdOn = false');
  const back = await waitFor('false', 1);
  void back;
  const t5 = Date.now(); while (navs.length === n2 && Date.now() - t5 < 8000) await sleep(150);
  await waitFor(UPJS, 45000); await sleep(1500);
  const sC = await skew();
  ok(navs.length - n2 === 1 && sC && sC.worker === C, `5. the hold over → ONE reload to C (${navs.length - n2} navigations, pin ${sC && sC.worker})`);

  // 6. a refresh → all C
  await sleep(4000);   // (the C page's own late imports — the radio gate at 2.5 s — land before the refresh: a reload mid-import aborts it)
  const c3 = cons.length;
  await p.reload(); await waitFor(UPJS, 45000); await sleep(1500);
  const sR = await skew();
  const lazyC = await p.evaluate(`Promise.all(['/js/screens/harbor/radio-ledger.js', '/js/games/prism/index.js', '/js/games/overclock/index.js'].map(u => import(u).then(() => 'ok', e => u + ': ' + e.message)))`);
  ok(sR && sR.worker === C && lazyC.every(x => x === 'ok') && await p.evaluate('globalThis.__ledgerC === 1 && globalThis.__prismC === 1 && globalThis.__ocC === 1'), `6. a refresh → all C (pin ${sR && sR.worker}; ${lazyC.join(', ')})`);
  ok(mixedSince(c3).length === 0, `6. no link error (${mixedSince(c3).slice(0, 2).join(' | ') || 'none'})`);
  const keys = await p.evaluate('caches.keys()');
  ok(keys.filter(k => k.startsWith('na-b-')).length <= 2, `the old builds' caches go once no page is on them (${keys.join(', ')})`);
} catch (e) { ok(false, `the run: ${e.message}`); }
await ctx.close(); await browser.close(); await line.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-onebuild (${BROWSER}): ${results.length - bad.length}/${results.length} passed`);
if (bad.length) console.log(cons.filter(c => /skew|error|warn/i.test(c)).slice(-12).join('\n'));
process.exit(bad.length ? 1 : 0);
