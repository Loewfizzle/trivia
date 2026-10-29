// CONN — THE DATABASE CONNECTIONS: how many Realtime Database sockets each phone holds, state by state (docs/testing.md — CONN; CLAUDE.md → Multiplayer mechanics).
//   node e2e-conn.mjs "<browser path>" ./shots-conn            (emulators + `node scripts/serve.mjs --emu`; ≈ 2 min)
//   MEASURE=1  only print the table (no pass / fail) — the BEFORE run against an older commit
// Every page's WebSockets are watched through the DevTools protocol (Network.webSocketCreated / Closed): an open socket to the
// database (the emulator's :9000, *.firebaseio.com) = one of the Spark plan's 100 simultaneous connections.
// The checks: a first visit opens NO socket on the title (either city); HOST opens one; JOIN by the hush word + an invite link work from
// a parked start; a refresh mid-game resumes; a host whose phone locks (the page FROZEN) mid-game still hands over; QUIT closes the
// socket after the grace; a hidden title tab closes it; /board + /admin open none; no connection warning on a parked title.
// (&conngrace= / &connhid= shorten the grace + the hidden wait under ?emu — the real ones are 30 s + 2 min.)
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-conn').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const MEASURE = process.env.MEASURE === '1';
const GRACE = 3000, HID = 3000;
const QS = `conngrace=${GRACE}&connhid=${HID}`;
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [], table = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(MEASURE ? 'INFO' : cond ? 'OK  ' : 'FAIL', what); if (!cond && !MEASURE) errors.push(`check failed: ${what}`); };
const DB_WS = /:9000\/|\.firebaseio\.com|firebasedatabase\.app/;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const PROFILE = name => ({ name, color: '#22e4ff', avatar: 'bolt' });

/** a fresh phone (its own context = its own player); profile: a saved name so HOST / JOIN skip the setup form */
async function phone(name, path = '/', { profile = true } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  const open = new Map();
  let opened = 0;
  cdp.on('Network.webSocketCreated', e => { if (DB_WS.test(e.url)) { open.set(e.requestId, e.url); opened++; } });
  cdp.on('Network.webSocketClosed', e => open.delete(e.requestId));
  // (a reload / navigation drops the old document's sockets — the protocol doesn't always say so)
  await cdp.send('Page.enable');
  cdp.on('Page.frameNavigated', e => { if (!e.frame.parentId && e.type !== 'BackForwardCacheRestore') open.clear(); });
  page.on('pageerror', e => { errors.push(`${name} pageerror: ${e.message}`); log(name, 'PAGEERROR', e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|blocked by CORS|Back-Forward Cache/i.test(t)) { errors.push(`${name}: ${t}`); log(name, 'console.error', t); } });
  if (profile) await page.evaluateOnNewDocument(p => { try { localStorage.setItem('na:1:profile', JSON.stringify(p)); } catch { /* fine */ } }, PROFILE(name));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const P = { name, ctx, page, cdp, get n() { return open.size; }, get opened() { return opened; } };
  if (path) await go(P, path);
  return P;
}
async function go(P, path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}emu&${QS}`;
  await P.page.goto(url);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return; } catch { /* busy */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
const titleUp = P => P.page.waitForFunction(() => !document.getElementById('boot') && window.__arcade && window.__arcade.state.ready, { timeout: 30000 });
const line = P => P.page.evaluate(() => (window.__arcade && window.__arcade.line ? window.__arcade.line() : null)).catch(() => null);
const row = async (state, P, note = '') => {
  table.push({ state, sockets: P.n, opened: P.opened, note });
  log('SOCKETS', state, '→', P.n, `(opened ${P.opened})`, note);
  if (process.env.LINE === '1') { const l = await line(P); if (l) log('  line', l.net, `wants [${l.wants}] touches ${l.touches} ${l.touchFrom}`, l.log.map(x => `${x.what}{${x.wants}}`).join(' · ')); }
};
const warned = P => P.page.evaluate(() => { const n = document.getElementById('net'); return !!(n && n.classList.contains('is-on')); });
/** the page's tab hidden (as a phone's app switch) — visibilityState overridden + the event; restore = visible again */
const setHidden = (P, on) => P.page.evaluate(h => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
  document.dispatchEvent(new Event('visibilitychange'));
}, on);

try {
  // ---- 1. a first visit: the title, idle (the default city + City 2.0)
  const A = await phone('HOSTY');
  await titleUp(A);
  await sleep(6000);
  await row('title, idle (first visit)', A);
  ok(A.opened === 0, `a first visit opens NO database socket on the title (opened ${A.opened})`);
  ok(!(await warned(A)), 'the parked title shows no connection warning');
  { const C2 = await phone('CITY2', '/?city=2');
    await titleUp(C2); await sleep(8000);
    await row('City 2.0 title, idle', C2);
    ok(C2.opened === 0, `City 2.0's title opens no socket either (the preview's EVERYONE comes by the /api poll; opened ${C2.opened})`);
    await C2.ctx.close(); }

  // ---- 2. HOST
  await A.page.evaluate(() => document.querySelector('.nd-host') && document.querySelector('.nd-host').click());
  await A.page.waitForSelector('.lobby-screen .room-code', { timeout: 30000 });
  const code = await evalIn(A.page, s => s.code);
  log('room', code);
  await sleep(1500);
  await row('lobby (host)', A);
  ok(A.n === 1, `HOST opens one socket (${A.n})`);

  // ---- 3. JOIN by the hush word from a parked start (the title's JOIN path: room.js#joinRoom)
  const B = await phone('GUEST');
  await titleUp(B); await sleep(1500);
  const bBefore = B.opened;
  await B.page.evaluate(c => import('/js/firebase.js').then(f => f.firebaseReady).then(() => import('/js/room.js')).then(m => m.joinRoom(c, JSON.parse(localStorage.getItem('na:1:profile')))), code);
  await B.page.waitForSelector('.lobby-screen', { timeout: 30000 });
  await waitFor(A.page, s => Object.keys(s.players).length === 2, 'two players', 20000);
  await row('lobby (guest, joined by the hush word)', B);
  ok(bBefore === 0 && B.n === 1, `JOIN by the hush word from a parked start (sockets ${bBefore} → ${B.n})`);

  // ---- 4. an invite link from a parked start: the title checks the room (roomExists), then JOIN
  const I = await phone('INVITE', `/?room=${code}`, { profile: false });
  await I.page.waitForSelector('.nd-go', { timeout: 30000 });
  await sleep(1500);
  await row('title with an invite link (checked, not joined)', I);
  ok(!(await evalIn(I.page, s => s.inviteExpired)), 'the invite link is seen as a live room');
  await I.page.evaluate(() => document.querySelector('.nd-go').click());
  await I.page.waitForSelector('.input-code', { timeout: 15000 });
  await I.page.type('.setup-screen input.input:not(.input-code)', 'INVITE');
  await I.page.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
  await I.page.waitForSelector('.lobby-screen', { timeout: 30000 });
  await row('lobby (joined by an invite link)', I);
  ok(I.n === 1, `JOIN by an invite link (${I.n} socket)`);

  // ---- 5. a game
  await A.page.evaluate(() => import('/js/host.js').then(m => m.startGame('cipher', { rounds: 3 })));
  await waitFor(B.page, s => s.game && s.game.id === 'cipher', 'the game on the guest', 20000);
  await sleep(2000);
  await row('in a game (host)', A); await row('in a game (guest)', B);
  ok(A.n === 1 && B.n === 1, `in a game: one socket each (${A.n}, ${B.n})`);

  // ---- 6. a refresh mid-game resumes
  const match = await evalIn(B.page, s => s.game.matchId);
  await B.page.reload();
  await waitFor(B.page, (s, m) => s.ready && s.game && s.game.matchId === m, 'the guest back in the game after a refresh', 30000, match);
  await sleep(1000);
  await row('in a game after a refresh', B);
  ok(B.n === 1, `a refresh mid-game resumes the game (${B.n} socket)`);

  // ---- 7. the guest's tab hidden mid-game (an app switch): the socket stays (presence + host election need it)
  await setHidden(B, true); await sleep(HID + 2500);
  await row('in a game, tab hidden', B);
  ok(B.n === 1, `a hidden tab IN A ROOM keeps its socket (${B.n})`);
  await setHidden(B, false);

  // ---- 8. the host's phone LOCKS mid-game (the page frozen: no JS, the socket left open): the others take over, as today
  await A.cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  const t = Date.now();
  const aUid = await evalIn(B.page, s => s.meta.hostId);
  let moved = '';
  while (Date.now() - t < 45000) {
    const host = await evalIn(B.page, s => s.meta && s.meta.hostId).catch(() => aUid);
    if (host && host !== aUid) { moved = host === await evalIn(B.page, s => s.uid) ? 'GUEST' : 'INVITE'; break; }
    await sleep(500);
  }
  ok(!!moved, `a host whose phone locks mid-game hands over (${moved || 'nobody'} took over in ${Math.round((Date.now() - t) / 1000)} s)`);
  await A.cdp.send('Page.setWebLifecycleState', { state: 'active' });
  await sleep(1500);

  // ---- 9. QUIT → the title: the socket stays through the grace (a quick re-host never reconnects twice), then closes
  await B.page.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()));
  await waitFor(B.page, s => !s.code, 'the guest on the title', 15000);
  await sleep(500);
  await row('title right after QUIT', B);
  await sleep(GRACE + 2500);
  await row(`title ${((GRACE + 3000) / 1000).toFixed(0)} s after QUIT (the grace is ${GRACE / 1000} s in the test, 30 s live)`, B);
  ok(B.n === 0, `QUIT, then the grace: the socket closes (${B.n})`);
  ok(!(await warned(B)), 'after QUIT the parked title shows no connection warning');
  // HOST again from the parked title works (and reconnects)
  await B.page.evaluate(() => import('/js/room.js').then(m => m.createRoom(JSON.parse(localStorage.getItem('na:1:profile')))));
  await B.page.waitForSelector('.lobby-screen', { timeout: 30000 });
  await row('lobby again (re-host after parking)', B);
  ok(B.n === 1, `HOST again from a parked title (${B.n} socket)`);
  await B.page.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()));
  await waitFor(B.page, s => !s.code, 'B on the title again', 15000);

  // ---- 10. a hidden title tab with no room: parked after the hidden wait
  const H = await phone('HIDDEN');
  await titleUp(H);
  await H.page.evaluate(() => import('/js/firebase.js').then(f => f.firebaseReady).then(() => import('/js/room.js')).then(m => m.roomExists('ZZZZ')));   // (a read: the line opens)
  await sleep(800);
  const hOpen = H.n;
  await setHidden(H, true);
  await sleep(HID + 2500);
  await row('title, tab hidden (no room)', H, `open before hiding: ${hOpen}`);
  ok(H.n === 0, `a hidden title tab parks the database (${hOpen} → ${H.n})`);
  await setHidden(H, false); await sleep(800);
  ok(!(await warned(H)), 'back from hidden: no connection warning');
  await H.ctx.close();

  // ---- 11. THE BOARD (/board) + the admin page (/admin): /api only
  { const Bd = await phone('BOARD', '/board'); await sleep(6000); await row('/board', Bd); ok(Bd.opened === 0, `/board opens no socket (${Bd.opened})`); await Bd.ctx.close(); }
  { const Ad = await phone('ADMIN', '/admin'); await sleep(6000); await row('/admin', Ad); ok(Ad.opened === 0, `/admin opens no socket (${Ad.opened})`); await Ad.ctx.close(); }
  // ---- 12. City 2.0 with the preview panel (an admin): the live listener — one socket while the panel can send
  { const Pn = await phone('PANEL', '/?city=2&panel=1'); await titleUp(Pn); await sleep(9000);
    await row('City 2.0, an admin (the preview panel)', Pn); await Pn.ctx.close(); }

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
} finally {
  console.log('\n| state | open sockets | ever opened |\n| --- | --- | --- |');
  for (const r of table) console.log(`| ${r.state}${r.note ? ` (${r.note})` : ''} | ${r.sockets} | ${r.opened} |`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  writeFileSync(`${OUT}conn-report.json`, JSON.stringify({ table, checks, errors }, null, 2));
  await browser.close();
}
