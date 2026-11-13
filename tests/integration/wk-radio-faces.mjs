// FR7 FIXES C2 — THE RADIO's FACES PAINT, in Safari's engine (the owner's iPhone, Nov 13 7 am: radio → LEDGER sat on "Tuning in…" forever).
// The cause, reproduced here: a phone whose page held an OLDER music.js (the deploy before FR7 FIXES C — no `musicFileOf`; a cached copy from the
// edge header's stale-while-revalidate) lazily imported the NEW radio-ledger.js → now-playing.js → `import { musicFileOf } from './music.js'`:
// "SyntaxError: Importing binding name 'musicFileOf' is not found" — the LEDGER never linked, radio.js only console.warn'd it.
// This opens DESK → PROGRAM → LEDGER as the owner (Playwright's WebKit, 390×844 @3 as an iPhone) and asserts each face paints its REAL content
// within 3 s (the LEDGER: its nixies + NOW PLAYING + TODAY): (a) the plain build, (b) the same with a STALE music.js (this tree's file with its
// `musicFileOf` export taken away — exactly the copy the owner's phone held). The shipped build (be8c156c) fails (b); the fixed one passes both.
//   node tests/integration/wk-radio-faces.mjs [--base http://localhost:5173] [--root <the tree it serves>] [--out DIR] [--only plain,stale]
// (on the emulators + `scripts/serve.mjs --emu`; WebKit from ~/wk/node_modules/playwright, or WK_PLAYWRIGHT)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', 'http://localhost:5173'), OUT = opt('out', ''), ONLY = (opt('only', '') || '').split(',').filter(Boolean);
const ROOT = opt('root', fileURLToPath(new URL('../..', import.meta.url)));   // (--root: the tree the server at --base serves — the BEFORE run)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const DB = 'http://127.0.0.1:9000';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
if (OUT) mkdirSync(OUT, { recursive: true });

// the stale player: this tree's music.js, its newest export (`musicFileOf`, FR7 FIXES C) no longer exported
const staleMusic = src => src.replace(/export const musicFileOf\b/, 'const musicFileOf');
const STALE = staleMusic(readFileSync(join(ROOT, 'js/audio/music.js'), 'utf8'));

const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const browser = await webkit.launch();

const FACES = {
  DESK: '!!document.querySelector(".rd-modal.is-in .rd-jack")',
  PROGRAM: '!!document.querySelector(".rd-paperwrap[data-face=program] .rd-paper")',
  LEDGER: '(() => { const w = document.querySelector(".rd-paperwrap[data-face=ledger]"); return !!(w && w.querySelector(".rd-big3 .rd-nixie") && /^NOW PLAYING · /.test((w.querySelector(".rd-np") || {}).textContent || "") && [...w.querySelectorAll(".rd-paper h4")].some(e => /^TODAY/.test(e.textContent))); })()',
};

async function run(name, stale) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const slot = `wf${name[0]}${Date.now() % 10000}`;   // (≤ 8 letters — identity.js cuts a longer slot)
  await ctx.addInitScript(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } }, slot);
  const p = await ctx.newPage();
  const cons = [];
  p.on('console', m => cons.push(`${m.type()}: ${m.text()}`));
  p.on('pageerror', e => cons.push(`pageerror: ${e.message}`));
  if (stale) await p.route(/\/js\/audio\/music\.js(\?.*)?$/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STALE }));
  const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(100); } return false; };
  const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)';
  try {
    await p.goto(`${BASE}/?emu&slot=${slot}&when=2026-11-03T21:00&city=2`);
    if (!await waitFor(UP, 40000)) { ok(false, `${name}: the city up`); return; }
    let pid = null;
    for (let i = 0; i < 60 && !pid; i++) { pid = await p.evaluate(async () => { const m = await import('/js/profile/api.js'); try { return (await m.api('admin', { action: 'whoami' })).pid; } catch { return null; } }); if (!pid) await sleep(500); }
    if (!pid) { ok(false, `${name}: the owner's profile`); return; }
    await dbPut(`testAdmins/${pid}`, true);
    await p.evaluate('sessionStorage.clear()');
    await p.reload();
    if (!await waitFor(UP, 40000) || !await waitFor('!!document.querySelector(".rd-btn")', 20000)) { ok(false, `${name}: the radio button`); return; }
    await p.evaluate(`document.querySelector('.rd-btn').click()`);
    const times = {};
    for (const face of ['DESK', 'PROGRAM', 'LEDGER']) {
      if (face !== 'DESK') await p.evaluate(`[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === '${face}').click()`);
      const t0 = Date.now(), painted = await waitFor(FACES[face], 3000);
      times[face] = painted ? Date.now() - t0 : null;
      const txt = painted ? '' : ((await p.evaluate(`(document.querySelector('.rd-paperwrap') || document.querySelector('.rd-sheet') || {}).textContent || ''`)) || '').slice(0, 80);
      ok(painted, `${name}: ${face} paints its real content within 3 s (${painted ? `${times[face]} ms` : `still "${txt}"`})`);
      if (OUT) await p.screenshot({ path: join(OUT, `wk-${name}-${face.toLowerCase()}.png`) });
    }
    const warns = cons.filter(c => /\[radio\]|pageerror|Importing binding/.test(c));
    if (stale) ok(true, `${name}: (the stale copy's console: ${warns.length ? warns[0].slice(0, 140) : 'nothing — the ledger imports no player'})`);
    else ok(!warns.length, `${name}: no radio warning / page error (${warns.slice(0, 2).join(' | ') || 'none'})`);
  } finally { await ctx.close(); }
}

if (!ONLY.length || ONLY.includes('plain')) await run('plain', false);
if (!ONLY.length || ONLY.includes('stale')) await run('stale', true);
await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`\n${results.length - bad.length} / ${results.length} OK${bad.length ? ` — FAIL: ${bad.map(b => b.what).join(' · ')}` : ''}`);
process.exit(bad.length ? 1 : 0);
