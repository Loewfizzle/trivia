// CITY FIXES — THE LOST TAPS (the owner, Nov 8: "randomly a button does nothing on the first tap, works on the second" — HOST / JOIN, the
// intercom's SEND, a card in SETTINGS / CUSTOMIZE, ADD FRIEND, everywhere). Real TOUCH taps (touchscreen.tap — the touch → pointer → click
// path a phone takes) on the owner's list, each AT A RANDOM MOMENT (a message showing, a burst of re-renders from the store, the main thread
// busy, the city re-baking at a tier change, a sheet still sliding in, the dock FADING to rest): EVERY FIRST TAP LANDS (its effect shows,
// no second tap) — with THE RESCUE OFF (the raw page: 0 lost) — then THE RESCUE proven (a control replaced under the finger: one click,
// never two) and THE TAP WATCH's report round trip (/api/log → phonelog, kind 'lost', on the emulators).
//   node tests/integration/e2e-taps.mjs "<chromium>"            (emulators + node scripts/serve.mjs --emu)
//   ENGINE=webkit node tests/integration/e2e-taps.mjs           (Playwright's WebKit — ~/wk/node_modules/playwright, or WK_PLAYWRIGHT)
//   env N=20 (taps per control), SHOTS=1
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';
import { val } from '../../api/_lib/fb.js';

const ENGINE = process.env.ENGINE || 'chromium';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 20);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [], summary = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

let browser, newPhone;
// a named player on each test phone (HOST without a name opens setup)
const INIT = s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } };
if (ENGINE === 'webkit') {
  const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
  browser = await webkit.launch();
  newPhone = async slot => {
    const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(INIT, slot);
    const p = await ctx.newPage();
    return { p, ctx, wait: (js, ms = 15000) => p.waitForFunction(js, null, { timeout: ms }).then(() => true, () => false), tap: (x, y) => p.touchscreen.tap(x, y), close: () => ctx.close() };
  };
} else {
  const { default: puppeteer } = await import('./kit/puppeteer.mjs');
  browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  newPhone = async slot => {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.evaluateOnNewDocument(INIT, slot);
    await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    return { p, ctx, wait: (js, ms = 15000) => p.waitForFunction(js, { timeout: ms }).then(() => true, () => false), tap: (x, y) => p.touchscreen.tap(x, y), close: () => ctx.close() };
  };
}

async function phone(slot, qs = '') {
  const P = await newPhone(slot);
  const { p } = P;
  p.on('pageerror', e => { console.log(`[${slot}] PAGEERROR`, e.message); fails.push(`${slot}: ${e.message}`); });
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&idle=1${qs}`, 'e2e-taps.mjs'));
  await P.wait('!!(window.__district && window.__district.phase && window.__district.phase().done && window.__district.harbor() && window.__district.harbor().shown && window.__tapwatch)', 45000);
  await p.evaluate(() => { try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } });
  return P;
}

// ---- the disturbances (one at a random moment around each tap; scheduled IN the page, so its timing is the page's own)
const DISTURB = {
  toast: ms => `setTimeout(() => import('/js/ui/toast.js').then(m => m.toast('A message over the dock', 'info')), ${ms})`,
  churn: ms => `setTimeout(() => import('/js/store.js').then(m => { for (let i = 0; i < 6; i++) setTimeout(() => m.setState({ __tw: Math.random() }), i * 25); }), ${ms})`,
  busy: ms => `setTimeout(() => { const t = performance.now(); while (performance.now() - t < 160) { /* the main thread busy */ } }, ${ms})`,
  rebake: ms => `setTimeout(() => { const d = window.__district; if (!d || !d.setTier) return; const t = d.tiering && d.tiering(); const now = t && t.tier != null ? t.tier : 2; d.setTier(now >= 2 ? 1 : 2); }, ${ms})`,
  none: () => '0',
};
const kinds = Object.keys(DISTURB);
const pick = i => kinds[i % kinds.length];

async function centre(P, sel) {
  return P.p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
}

/** tap `sel` n times; each: the reset (by code, never the measured tap) → a disturbance at a random moment → ONE touch tap → its effect */
async function tapTest(P, name, sel, { land, reset, before = null, n = N, settle = 250, landMs = 2500 }) {
  let landed = 0, aims = 0;
  const aimNotes = [];
  const lostBefore = (await P.p.evaluate('window.__tapwatch.stats()')).lost;
  const misses = [];
  for (let i = 0; i < n; i++) {
    if (before) await before(i);
    const c = await centre(P, sel);
    if (!c) { misses.push(`#${i} not on screen`); if (reset) await reset(i); continue; }
    const k = pick(i + Math.floor(Math.random() * kinds.length));
    const ms = Math.floor(Math.random() * 180) - 60;   // −60…+120 ms around the tap
    await P.p.evaluate(DISTURB[k](Math.max(0, ms)));
    if (ms < 0) await sleep(-ms);
    const want = await P.p.evaluate(s => { const el = document.querySelector(s); return el ? el.className : ''; }, sel);
    await P.tap(c.x, c.y);
    const hit = await P.wait(land, landMs);
    const pressed = await P.p.evaluate('window.__tapwatch.lastDown()');
    // (the finger landed on ANOTHER spot than the control — it was still moving (a sheet sliding in) when the test aimed: an AIM miss, not a lost tap)
    const aimOff = !hit && want && !pressed.includes(want.split(' ')[0]);
    if (hit) landed++; else if (aimOff) { aims++; aimNotes.push(`#${i} hit ${pressed}`); } else misses.push(`#${i} (${k} @${ms} ms)`);
    if (reset) await reset(i);
    await sleep(settle);
  }
  const st = await P.p.evaluate('window.__tapwatch.stats()');
  ok(landed + aims === n && aims <= Math.ceil(n / 5), `${ENGINE} — ${name}: ${landed}/${n} first taps landed${aims ? ` (+ ${aims} where the finger landed off the still-moving control: ${aimNotes.join(', ')})` : ''}${misses.length ? ` · LOST ${misses.join(', ')}` : ''} · the watch: ${st.lost - lostBefore} dropped by the browser (rescued)`);
  summary.push(`${name}: ${landed}/${n}${aims ? ` + ${aims} aim` : ''} · lost ${misses.length} · ${st.lost - lostBefore} rescued`);
  return landed;
}

const closeSheets = P => P.p.evaluate(() => import('/js/ui/sheet.js').then(m => m.closeAllSheets())).then(() => sleep(320));
const backHome = async P => { await P.p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' }))); await P.wait("window.__arcade.state.view === 'title' && !!(window.__district && window.__district.harbor && window.__district.harbor() && window.__district.harbor().shown && window.__district.phase().done)", 40000); await sleep(800); };

try {
  const A = await phone('tpa');
  // (THE RESCUE stays ON here — the page as it ships; the watch's "lost" count = the drops the rescue saved: the pass log's data per control)

  // ---- THE TITLE
  await tapTest(A, 'JOIN (the hush word panel)', '.nd-tab-join', { land: "document.querySelector('.nd-actions').classList.contains('is-join')", reset: async () => { await A.p.evaluate("document.querySelector('.nd-tab-join').click()"); await A.wait("!document.querySelector('.nd-actions').classList.contains('is-join')", 3000); } });
  await tapTest(A, 'GAMES (the sheet)', '.nd-tab-games', { land: "!!document.querySelector('.sh.is-in')", reset: () => closeSheets(A) });
  await tapTest(A, '☰ (the menu)', '.menu-btn', { land: "!!document.querySelector('.sh.gm.is-in')", reset: () => closeSheets(A) });
  // a sheet's row WHILE THE SHEET IS STILL SLIDING IN (≤ 320 ms after it opened)
  await tapTest(A, '☰ → SETTINGS (tapped while the menu slides in)', '.sh.gm .gm-settings', {
    before: async () => { await A.p.evaluate("document.querySelector('.menu-btn').click()"); await A.wait("!!document.querySelector('.sh.gm .gm-settings')", 3000); await sleep(200); },
    land: "!!document.querySelector('.sh.is-nested.is-in')", reset: () => closeSheets(A) });
  // a row inside SETTINGS (a switch) — its value flips on the first tap
  await A.p.evaluate("document.querySelector('.menu-btn').click()"); await A.wait("!!document.querySelector('.sh.gm .gm-settings')", 3000); await sleep(400);
  await A.p.evaluate("document.querySelector('.sh.gm .gm-settings').click()"); await A.wait("!!document.querySelector('.sh.is-nested.is-in .sh-row[role=\"switch\"], .sh.is-nested.is-in .sh-row .sh-sw')", 4000); await sleep(400);
  const swSel = await A.p.evaluate(() => { const r = [...document.querySelectorAll('.sh.is-nested .sh-row')].find(x => x.querySelector('.sh-sw') || x.getAttribute('role') === 'switch'); if (!r) return null; r.dataset.twSw = '1'; return '.sh-row[data-tw-sw="1"]'; });
  if (swSel) {
    let prev = await A.p.evaluate(s => document.querySelector(s).getAttribute('aria-checked') || document.querySelector(s).className, swSel);
    await tapTest(A, 'SETTINGS → a switch row', swSel, { settle: 300,
      land: `(() => { const el = document.querySelector('${swSel}'); const v = el && (el.getAttribute('aria-checked') || el.className); return v != null && v !== window.__twPrev; })()`,
      before: async () => { prev = await A.p.evaluate(s => { const el = document.querySelector(s); const v = el.getAttribute('aria-checked') || el.className; window.__twPrev = v; return v; }, swSel); } });
  } else ok(false, 'SETTINGS has a switch row to tap');
  await closeSheets(A);
  // YOU + BOARD (full screens: the city is rebuilt on the way back — fewer rounds)
  await tapTest(A, 'YOU (the membership card)', '.nd-tab-you', { n: Math.min(N, 6), land: "['profile', 'setup'].includes(window.__arcade.state.view)", reset: () => backHome(A) });
  await tapTest(A, 'BOARD', '.nd-tab-board', { n: Math.min(N, 6), land: "window.__arcade.state.view === 'board'", reset: () => backHome(A) });
  // THE SCREEN AT REST: the dock FADING (is-idle, not yet at rest) — a tap on HOST is a real tap (it used to only wake the dock)
  await tapTest(A, 'JOIN while the dock FADES to rest', '.nd-tab-join', { n: Math.min(N, 6), landMs: 3000,
    before: async () => { await A.p.evaluate(() => window.__district.idle()); await A.wait("document.body.classList.contains('nd-idle') && !document.body.classList.contains('nd-rest')", 3000); await sleep(250); },
    land: "document.querySelector('.nd-actions').classList.contains('is-join')", reset: async () => { await A.p.evaluate("document.querySelector('.nd-tab-join').click()"); await sleep(300); } });
  // …and once it has FADED OUT (at rest) the waking tap only wakes — by design
  { await A.p.evaluate(() => window.__district.idle()); await A.wait("document.body.classList.contains('nd-rest')", 4000);
    const c = await centre(A, '.nd-tab-join'); await A.tap(c.x, c.y); await sleep(500);
    ok(await A.p.evaluate("!document.body.classList.contains('nd-idle') && !document.querySelector('.nd-actions').classList.contains('is-join')"), `${ENGINE} — at REST (faded out) the waking tap only wakes the dock`); }
  // a pop-up open → the screen never goes to rest under it (the radio, CUSTOMIZE, a full card… — THE LAYER STACK)
  { await A.p.evaluate("document.querySelector('.nd-tab-games').click()"); await A.wait("!!document.querySelector('.sh.is-in')", 3000);
    await A.p.evaluate(() => window.__district.idle()); await sleep(300);
    ok(await A.p.evaluate("!document.body.classList.contains('nd-idle')"), `${ENGINE} — never at rest while a pop-up is open`); await closeSheets(A); }

  // ---- HOST + THE ROOM
  await tapTest(A, 'HOST', '.nd-hostbtn', { n: Math.min(N, 8), landMs: 12000, land: "!!(window.__arcade.state.code && window.__district.room())",
    reset: async i => { if (i < Math.min(N, 8) - 1) { await A.p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom())); await A.wait("!window.__arcade.state.code && !document.querySelector('.title-screen.is-room')", 15000); await sleep(1500); } } });
  await A.wait("!!(window.__arcade.state.code && document.querySelector('.rdk-guests'))", 15000);
  const code = await A.p.evaluate('window.__arcade.state.code');
  const B = await phone('tpb', `&room=${code}`);
  await B.p.evaluate(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); });
  await A.wait('Object.keys(window.__arcade.state.players || {}).length === 2', 30000);
  await A.wait('Object.values(window.__arcade.state.players).every(p => p.pid)', 30000);
  await sleep(1500);
  await tapTest(A, 'the room dock: GUESTS', '.rdk-guests', { land: "!!document.querySelector('.sh.is-in .rg-row')", reset: () => closeSheets(A) });
  await tapTest(A, 'the room dock: GAMES', '.rdk-games', { land: "!!document.querySelector('.sh.is-in')", reset: () => closeSheets(A) });
  await tapTest(A, 'the room dock: CHAT', '.rdk-chat', { land: "!!document.querySelector('.sh.is-in')", reset: () => closeSheets(A) });
  // LOCK THE DOOR in the guest list — with the room's own updates (presence + the guest's writes) arriving
  await A.p.evaluate("document.querySelector('.rdk-guests').click()"); await A.wait("!!document.querySelector('.rg-lockbtn')", 5000); await sleep(400);
  await tapTest(A, 'GUESTS → LOCK THE DOOR (the room updating)', '.rg-lockbtn', { n: Math.min(N, 10), settle: 500,
    before: async () => { await A.p.evaluate(() => { window.__twLock = !!(window.__arcade.state.meta && window.__arcade.state.meta.locked); }); await B.p.evaluate(() => import('/js/store.js').then(m => m.setState({ __tw: Math.random() }))); },
    land: "!!(window.__arcade.state.meta && window.__arcade.state.meta.locked) !== window.__twLock", landMs: 5000 });
  await A.p.evaluate(() => import('/js/room.js').then(m => m.setDoorLocked && m.setDoorLocked(false))).catch(() => {});
  // the guest's card → ADD FRIEND (the friends list landing right after the card opens used to rebuild the button)
  const bu = await B.p.evaluate('window.__arcade.state.uid');
  await A.p.evaluate(u => document.querySelector(`.rg-row[data-uid="${u}"]`).click(), bu);
  const fr = await A.wait("!!document.querySelector('.fr-btn-slot:not([hidden]) .fr-btn')", 15000);
  ok(fr, `${ENGINE} — the guest's card offers ADD FRIEND`);
  await sleep(600);   // (the card's sheet settled — a tap aims at where the button IS)
  if (fr) {
    const got = await tapTest(A, 'ADD FRIEND → REQUESTED', '.fr-btn', { n: 1, landMs: 8000, land: "/REQUESTED/.test((document.querySelector('.fr-btn') || {}).textContent || '')" });
    if (!got) console.log('  ADD FRIEND diag:', JSON.stringify(await A.p.evaluate(() => ({ btn: (document.querySelector('.fr-btn') || {}).textContent, cls: (document.querySelector('.fr-btn') || {}).className, msg: [...document.querySelectorAll('.sh-msg')].map(m => m.textContent), full: !!document.querySelector('.vl-full'), top: (() => { const b = document.querySelector('.fr-btn'); const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t ? `${t.tagName}.${t.className} z=${getComputedStyle(t).zIndex} in=${b.contains(t)}` : null; })(), rect: (() => { const r = document.querySelector('.fr-btn').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })(), chain: (() => { let n = document.querySelector('.fr-btn'), o = []; while (n && n !== document.body) { o.push(n.className.split(' ')[0]); n = n.parentElement; } return o.join(' < '); })(), watch: window.__tapwatch.last().split('\n').slice(1, 7) }))));
  }
  await closeSheets(A);
  await A.p.evaluate(() => document.querySelectorAll('.vl-full-x').forEach(b => b.click()));
  await sleep(400);

  // ---- THE RESCUE: a control a re-render REPLACES under the finger (the intercom's SEND at its headline's re-render, a list repaint).
  //      iOS drops that click (WebKit re-hit-tests the tap at the lift — a new node); a desktop engine doesn't, so the drop is made exact here:
  //      a touch pointerdown → the re-render → the pointerup on the replacement, NO click from the browser. Rescue OFF = a LOST TAP (reported);
  //      rescue ON = ONE click on the replacement (never two)
  const plant = `(() => {
    window.__twHits = 0;
    document.querySelectorAll('#tw-host').forEach(x => x.remove());
    const host = document.createElement('div'); host.id = 'tw-host';
    host.style.cssText = 'position:fixed;left:40px;top:300px;z-index:99999';
    const make = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tw-send'; b.textContent = 'SEND'; b.style.cssText = 'width:200px;height:64px;font-size:18px'; b.addEventListener('click', () => { window.__twHits++; }); return b; };
    host.append(make());
    document.body.append(host);
    return true; })()`;
  const dropTap = `(async () => {
    const host = document.getElementById('tw-host'), b = host.querySelector('.tw-send'), r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ev = (t, el) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, composed: true, pointerId: 77, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
    ev('pointerdown', b);
    await new Promise(r => setTimeout(r, 40));
    host.replaceChildren(host.firstChild.cloneNode(true)); host.firstChild.addEventListener('click', () => { window.__twHits++; });   // the re-render
    await new Promise(r => setTimeout(r, 80));
    ev('pointerup', host.firstChild);
    return true; })()`;
  for (const on of [false, true]) {
    await A.p.evaluate(`window.__tapwatch.rescue(${on}); window.__tapwatch.resetLimit()`);
    await A.p.evaluate(plant);
    const before = await A.p.evaluate('window.__tapwatch.stats()');
    await A.p.evaluate(dropTap);
    await sleep(1200);
    const hits = await A.p.evaluate('window.__twHits'), st = await A.p.evaluate('window.__tapwatch.stats()');
    console.log(`  replaced under the finger + no click from the browser, rescue ${on ? 'ON' : 'OFF'}: hits ${hits}, lost +${st.lost - before.lost}, rescued +${st.rescues - before.rescues}`);
    if (on) ok(hits === 1 && st.rescues - before.rescues === 1, `${ENGINE} — THE RESCUE: a control replaced under the finger gets ONE click, on its replacement (hits ${hits})`);
    else ok(hits === 0 && st.lost - before.lost === 1, `${ENGINE} — THE WATCH counts the dropped tap as LOST (rescue off: hits ${hits}, lost +${st.lost - before.lost})`);
    if (!on) {
      const rep = await A.p.evaluate('window.__tapwatch.last()');
      ok(/REPLACED/.test(rep) && /tw-send/.test(rep) && /re-rendered while the finger was down: div/.test(rep), `${ENGINE} — the report names the element, REPLACED + what re-rendered: ${rep.split('\n').filter(l => /element|node at|re-rendered/.test(l)).join(' | ')}`);
    }
    await A.p.evaluate("document.getElementById('tw-host').remove()");
  }

  // ---- THE REPORT ROUND TRIP: the lost tap above → /api/log → phonelog (kind 'lost'; never a name or a room code)
  if (ENGINE === 'chromium') {
    await sleep(1500);
    const log = (await val('phonelog')) || {};
    const lost = Object.values(log).filter(r => r.kind === 'lost' && /tw-send/.test(r.text)).sort((a, b) => b.at - a.at)[0];
    ok(!!lost && /LOST TAP/.test(lost.text) && /REPLACED/.test(lost.text), `THE TAP WATCH's report reached /admin's log (phonelog, kind 'lost'): ${lost ? lost.text.split('\n').slice(1, 5).join(' | ') : 'none'}`);
    ok(!!lost && !lost.text.includes(code) && !/TPA|TPB/.test(lost.text), 'the report carries no room code + no player name');
  }
  await B.close();
} catch (e) {
  console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message));
} finally {
  await browser.close();
}
console.log(`\nTHE TAP TABLE (${ENGINE}):\n  ${summary.join('\n  ')}`);
console.log(`\n${ENGINE}: ${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
