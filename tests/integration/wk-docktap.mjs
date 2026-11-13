// THE FIRST TAP (the owner's /admin errors, Nov 13 — "the lost tap" on the city's dock right after a load, on iOS): every dock button acts on its
// OWN pointer-up (ui/tapwatch.js#pressTap — never waiting for the click iOS may not send while the first frames are busy), its press shown at
// once (.is-press), its work one frame later. The proof in Safari's engine (Playwright's WebKit, 402 × 874 @3, touch), THE RESCUE OFF (the raw
// page — a tap only the rescue saved would be a fail):
//   title  each TITLE dock button in its OWN cold load — JOIN · BOARD · PLAY · YOU · HOST (+ DAILY when a daily is live): the city's reveal,
//          then at once ONE touch tap → its thing opens (the JOIN panel · THE BOARD · the PLAY shelf · your card / setup · a room · the dailies);
//          the watch counts no lost tap; the press class at the pointerdown (before any work)
//   room   after HOST: ONE touch tap on each ROOM dock button — INVITE · PLAY · YOU · GUESTS · GAMES · CHAT → each opens its thing
//   node tests/integration/wk-docktap.mjs [--base http://localhost:5173] [--only title,room]   (the emulators + serve.mjs --emu; Playwright from ~/wk)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', process.env.E2E_BASE || 'http://localhost:5173');
const ONLY = new Set(String(opt('only', 'title,room')).split(',').filter(Boolean));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const browser = await webkit.launch();
// a named player (HOST with no name opens setup) + navigator.share recorded (INVITE's share sheet — nothing leaves the page)
const INIT = s => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ }
  try { Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { window.__shared = (window.__shared || 0) + 1; } }); } catch { /* fine */ }
};
const UP = '!!(window.__district && window.__district.harbor && window.__district.harbor() && window.__district.harbor().shown && window.__tapwatch && window.__arcade)';

async function cold(slot) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.addInitScript(INIT, slot);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const waitFor = async (js, ms) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(60); } return false; };
  const t0 = Date.now();
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&idle=1`, 'wk-docktap.mjs'));
  const up = await waitFor(UP, 60000);
  await p.evaluate('window.__tapwatch.rescue(false)').catch(() => {});   // (THE RESCUE OFF: only the page's own path may land the tap)
  return { p, ctx, errs, waitFor, up, loadMs: Date.now() - t0 };
}
const centre = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, sel);
/** ONE touch tap on `sel` (as soon as it is on screen) → `land` within ms; the watch's lost count before / after */
async function oneTap(P, name, sel, land, ms = 6000) {
  const { p, waitFor } = P;
  await waitFor(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el || el.hidden) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()`, 15000);
  const c = await centre(p, sel);
  if (!c) { ok(false, `${name}: ${sel} on screen`); return false; }
  const wired = await p.evaluate(s => document.querySelector(s).dataset.pressTap === '1', sel);
  const lost0 = (await p.evaluate('window.__tapwatch.stats()')).lost;
  const t = Date.now();
  await p.touchscreen.tap(c.x, c.y);
  const hit = await waitFor(land, ms);
  const dt = Date.now() - t;
  const st = await p.evaluate('window.__tapwatch.stats()');
  const pressed = await p.evaluate('window.__tapwatch.lastDown()');
  ok(hit && wired && st.lost === lost0, `${name}: ONE tap → it opens (${hit ? `${dt} ms` : `NOT within ${ms} ms — the finger pressed ${pressed}`}) · on its own pointer-up (${wired}) · lost taps ${st.lost - lost0} (the rescue off)`);
  return hit;
}

const TITLE = [
  ['JOIN', '.nd-flank .nd-tab-join', "document.querySelector('.nd-actions').classList.contains('is-join')"],
  ['BOARD', '.nd-flank .nd-tab-board', "window.__arcade.state.view === 'board'"],
  ['PLAY', '.nd-flank .nd-tab-play', "!!document.querySelector('.sh.nd-shelf-sheet.is-in')"],
  ['YOU', '.nd-flank .nd-tab-you', "['profile', 'setup'].includes(window.__arcade.state.view)"],
  ['HOST', '.nd-flank .nd-host', '!!window.__arcade.state.code'],
];
if (ONLY.has('title')) {
  for (const [name, sel, land] of TITLE) {
    const P = await cold(`dt${name.toLowerCase().slice(0, 3)}${Date.now() % 1000}`);
    ok(P.up, `${name}: a cold load of the city — revealed in ${P.loadMs} ms`);
    if (P.up) await oneTap(P, `the title's ${name} (the first tap after the load)`, sel, land);
    if (name === 'JOIN' && P.up) {
      // ONCE: JOIN toggles its panel — a second run (the pointer-up AND the click) would close it again
      await sleep(1000);
      ok(await P.p.evaluate(land), 'JOIN ran ONCE: its panel still open a second later (the click after the pointer-up was not a second run)');
      // the press shows AT ONCE — the class at the pointerdown, before any work (then a cancel: nothing runs)
      const now = await P.p.evaluate(() => { const b = document.querySelector('.nd-flank .nd-tab-board'); b.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, isPrimary: true, pointerType: 'touch', bubbles: true })); const on = b.classList.contains('is-press'); b.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 9, isPrimary: true, pointerType: 'touch', bubbles: true })); return { on, off: !b.classList.contains('is-press'), view: window.__arcade.state.view }; });
      ok(now.on && now.off && now.view === 'title', `the press shows at the pointerdown (${now.on}), a cancelled press does nothing (${now.off}, still ${now.view})`);
    }
    // DAILY: only while a daily is live (THE GO-LIVE SWITCH) — tapped when it shows, said when it doesn't
    if (name === 'BOARD' && P.up) {
      const P2 = await cold(`dtdy${Date.now() % 1000}`);
      const shown = P2.up && await P2.waitFor("(() => { const d = document.querySelector('.nd-flank .nd-tab-daily'); return !!d && !d.hidden; })()", 6000);
      if (shown) await oneTap(P2, 'the title\'s DAILY (the first tap after the load)', '.nd-flank .nd-tab-daily', "!!(window.__arcade.state.daily && window.__arcade.state.daily.v === 'screen')");
      else console.log('note DAILY: no daily live on these emulators — its button stays hidden (wired like the rest: title-dock.js#tab)');
      ok(P2.errs.length === 0, `DAILY's page: no page error (${P2.errs.slice(0, 2).join(' | ') || 'none'})`);
      await P2.ctx.close();
    }
    ok(P.errs.length === 0, `${name}: no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.ctx.close();
  }
}

if (ONLY.has('room')) {
  const P = await cold(`dtrm${Date.now() % 1000}`);
  ok(P.up, `ROOM: a cold load of the city — revealed in ${P.loadMs} ms`);
  if (P.up && await oneTap(P, 'HOST (into a room)', '.nd-flank .nd-host', '!!window.__arcade.state.code', 25000)) {
    const { p, waitFor } = P;
    const dockUp = await waitFor("!!document.querySelector('.rdk-dock .rdk-play') && !document.querySelector('.rc-hostcard')", 20000);
    ok(dockUp, 'the room dock is up (the HOW TO SHARE card gone by itself)');
    const closeAll = async () => { await p.evaluate(() => Promise.all([import('/js/ui/sheet.js').then(m => m.closeAllSheets()), import('/js/screens/profile.js').then(m => m.closeCard && m.closeCard()).catch(() => {})])); await waitFor("!document.querySelector('.sh.is-in') && !document.querySelector('.pf-overlay')", 4000); await sleep(400); };
    const ROOM = [
      ['INVITE', '.rdk-dock .rdk-invite', "!!window.__shared || !!document.querySelector('.sh.fr-invite-sheet.is-in')"],
      ['PLAY (the host)', '.rdk-dock .rdk-play', "!!document.querySelector('.sh.is-in')"],
      ['YOU', '.rdk-dock .rdk-you', "!!document.querySelector('.pf-overlay')"],
      ['GUESTS', '.rdk-dock .rdk-guests', "!!document.querySelector('.sh.is-in')"],
      ['GAMES', '.rdk-dock .rdk-games', "!!document.querySelector('.sh.is-in')"],
      ['CHAT', '.rdk-dock .rdk-chat', "!!document.querySelector('.sh.is-in')"],
    ];
    for (const [name, sel, land] of ROOM) {
      await oneTap(P, `the room's ${name}`, sel, land);
      await closeAll();
    }
    // out of the room again (the emulators keep nothing open)
    await p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom())).catch(() => {});
    await waitFor('!window.__arcade.state.code', 8000);
  }
  ok(P.errs.length === 0, `ROOM: no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
  await P.ctx.close();
}

await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-docktap: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
