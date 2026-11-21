// CITY PART 1 — NO PINK FLASH, FOR EVERY GAME (the owner, Nov 19 6:55 pm item 1: "a pink flash when the round ends" — JAYWALK + HIGH RISE). The
// cause was the console's CROWN WASH (css/components.css — the game's accent at 55 % over the WHOLE screen, 2.5 s after the end frame stood):
// removed for every game at the shared console. THIS GUARD every game runs — every PLAYABLE game by its GAMES row (a NEW game joins by its row,
// no edit here): the REAL console end frame (ui/final.js#createFinal with the game's real cartridge — its ACCENT, its own finalScene), SOLO + MATCH,
// BOTH LOOKS (body[data-look]) — every frame the compositor presents from the frame standing through the crown moment to the settled screen
// (kit/flash-watch.mjs) must hold no large accent / pink full-screen frame. And THE GUARD GUARDS: the old wash injected → it IS caught.
// The real paths ride the game suites: e2e-rematch (the end screen's crown + REMATCH → the next start, PRISM DROP · OVERCLOCK · HOLD'EM ·
// JAYWALK), e2e-highrise (a solo run's end + PLAY AGAIN → the next start).
//   node tests/integration/end-flash.mjs "<chromium>"      (scripts/serve.mjs --emu on :5173 + the emulators)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { flashWatch } from './kit/flash-watch.mjs';
import { GAMES } from '../../js/config.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--no-sandbox'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await b.newPage(), errs = [];
page.on('pageerror', e => errs.push(String(e.message || e)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:settings', JSON.stringify({ muted: true })); } catch { /* fine */ } });
await page.goto(guardUrl(`${BASE}/?emu&slot=efl&test=1`, 'end-flash'), { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('boot'), { timeout: 60000 });
const cdp = await page.target().createCDPSession();

/** mount the console's end frame for a game in a look (solo or a 2-player match), watch every frame for 4 s, take it down */
async function one(id, look, solo, inject = false) {
  const acc = await page.evaluate(async ({ id, look, solo, inject }) => {
    document.body.dataset.look = look; document.body.dataset.theme = id;   // (a game's theme on, as in its match — body[data-theme] re-maps --accent)
    if (inject) { const st = document.createElement('style'); st.id = 'efl-old'; st.textContent = ".final::before { content: ''; position: fixed; inset: 0; background: var(--accent, #ff4fd8); opacity: 0; pointer-events: none; } .final.crowned::before { animation: efl-old 0.6s ease-out; } @keyframes efl-old { 0% { opacity: 0.55; } 100% { opacity: 0; } }"; document.head.append(st); }
    const R = await import('/js/games/registry.js'), mod = await R.loadGame(id), { createFinal } = await import('/js/ui/final.js');
    const U = solo ? ['ua'] : ['ua', 'ub'];
    const game = { id, matchId: `efl-${id}-${look}-${solo ? 's' : 'm'}`, phase: 'final', participants: Object.fromEntries(U.map(u => [u, true])), settings: (mod && mod.DEFAULT_SETTINGS) || {}, results: {} };
    const rows = U.map((uid, i) => ({ uid, rank: i + 1, score: 100 - i * 40 }));
    const players = Object.fromEntries(U.map((u, i) => [u, { name: i ? 'BOB' : 'ALICE', color: i ? 'cyan' : 'magenta', avatar: 'bolt' }]));
    const host = document.createElement('div'); host.id = 'efl-host'; host.style.cssText = 'position:fixed;inset:0;z-index:600;overflow:auto;background:#07060d';
    document.body.append(host);
    window.__efl = createFinal({ game, rows, players, me: 'ua', presence: { ua: { online: true }, ub: { online: true } }, kicker: `${(mod && mod.BANNER_NAME) || id} · ${solo ? 'SOLO' : 'MATCH'}`, winnerLine: nm => `${nm} WINS` });
    host.append(window.__efl.el);
    // (the probe: the frame's ::before opacity, every animation frame — the injected self-test reads it to prove the wash really played)
    window.__eflOp = 0; const el = window.__efl.el, t0 = performance.now(), tick = () => { const o = Number(getComputedStyle(el, '::before').opacity) || 0; if (getComputedStyle(el, '::before').content !== 'none' && o > window.__eflOp) window.__eflOp = o; if (performance.now() - t0 < 4200 && el.isConnected) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    // (the colour a full-screen wash on the frame paints: --accent AS THE FRAME RESOLVES IT — read through a probe's computed rgb, any CSS form)
    const pr = document.createElement('i'); pr.style.cssText = 'position:absolute;width:1px;height:1px;background:var(--accent)'; window.__efl.el.append(pr);
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(pr).backgroundColor); pr.remove();
    return m ? '#' + [m[1], m[2], m[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('') : '';
  }, { id, look, solo, inject });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await sleep(400);   // (the frame painted first — the page under the mount is not "before"; the crown comes at 2.5 s)
  const fw = await flashWatch(b, cdp, { diff: true });   // (COLOUR-FREE: the share of the screen unlike the settled frame — a wash of ANY colour)
  await sleep(3600);   // (the crown moment is 2.5 s after the frame stands; its wash was 0.6 s)
  const fl = await fw.stop({ settle: 400 });
  fl.op = await page.evaluate(() => window.__eflOp); fl.acc = acc;
  await page.evaluate(() => { try { window.__efl.destroy(); } catch { /* fine */ } const h = document.getElementById('efl-host'); if (h) h.remove(); const s = document.getElementById('efl-old'); if (s) s.remove(); delete document.body.dataset.theme; });
  await sleep(250);
  return fl;
}
const line = fl => `${fl.frames} frames (accent ${fl.acc}; the wash ${(fl.op * 100).toFixed(0)} % at its peak); the most unlike the settled frame ${fl.worst ? `${(fl.worst.pink * 100).toFixed(0)} % at ${fl.worst.t} ms` : '—'} (before ${(fl.before * 100).toFixed(0)} %, settled ${(fl.after * 100).toFixed(0)} %)`;

// THE GUARD GUARDS: the old crown wash, put back for one mount → caught
for (const gid of ['highrise', 'overclock']) { const fl = await one(gid, 'night', true, true); ok(fl.flash.length > 0, `the guard catches the OLD crown wash (injected, ${gid}'s accent): ${line(fl)}`); }
const ids = GAMES.filter(g => g.playable).map(g => g.id);
ok(ids.length >= 5, `every playable game by its GAMES row: ${ids.join(' · ')}`);
for (const id of ids) for (const look of ['night', 'day']) for (const solo of [true, false]) {
  const fl = await one(id, look, solo);
  ok(fl.frames >= 10 && fl.flash.length === 0, `${id} · ${look} · ${solo ? 'SOLO' : 'MATCH'}: NO PINK FLASH — ${line(fl)}${fl.flash.length ? ` — FLASH ${fl.flash.slice(0, 3).map(f => `${(f.pink * 100).toFixed(0)} % at ${f.t} ms`).join(' · ')}` : ''}`);
}
ok(!errs.length, `no page error (${errs.slice(0, 3).join(' | ')})`);
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
