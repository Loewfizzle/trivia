// Room chat end to end: N players (default 8) in separate browser contexts.
//   node e2e-chat.mjs "<browser path>" ./shots          (GPU=0 for software WebGL)
// Covers: the lobby strip + sheet (typing via the real UI), 8 players chatting, grouping, own-message styling,
// typing indicators (2 at once, auto-clear), unread badge, receive sound (only when allowed), the profanity
// toggle (host settings → masks past messages on every phone; Scunthorpe/assassin/class untouched), the
// client throttle hint + a rules-rejected message (failed → tap to retry), offline send (pending → delivered),
// a kicked player losing access, a refresh + a late joiner seeing the history, system lines (join, kick, start,
// win), the iOS keyboard layout (fake visualViewport), clear chat, and the lock state in every game (badge keeps
// counting, no sound, no toasts), unlocked breaks (Last Signal reveal, Neon Par after holing out).
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
const GPU = process.env.GPU !== '0';
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL', 'IVY'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio', '--ignore-gpu-blocklist',
  ...(GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])] });
const pages = [];
const ctxs = [];

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message, String(e.stack || '').split(String.fromCharCode(10)).slice(1, 3).join(' | ')); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=c${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(450);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(150);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  fail(`timeout: ${what}`);
}
const CH = (page, expr) => page.evaluate(`(() => { const C = window.__chat; return C ? (${expr}) : null; })()`);
async function waitC(page, expr, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await CH(page, expr)) return true; } catch { /* busy */ } await sleep(120); }
  fail(`timeout: ${what}`);
}
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };
const playerMsgs = page => CH(page, 'C.msgs().filter(m => m.u).length');
async function typeAndSend(page, text) {
  if (!(await page.$('.chat-sheet'))) { await tapReal(page, '.chat-strip'); await page.waitForSelector('.chat-input'); }
  await page.type('.chat-input', text, { delay: 8 });
  await page.keyboard.press('Enter');
}
const toasts = page => page.evaluate(() => document.querySelectorAll('.toast').length);

try {
  // ---------------- lobby with N players
  const host = await openPlayer(0);
  await host.waitForSelector('.title-actions .btn-primary', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tapReal(host, '.title-actions .btn-primary').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  const code = await evalIn(host, s => s.code);
  log('room', code);
  await host.waitForSelector('.chat-strip', { timeout: 15000 });
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.invite-card', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 }); // (taps under the boot screen are lost, as on a phone)
    await tapReal(p, '.invite-card');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.chat-strip', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  const uids = [];
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);
  const bob = pages[1];
  await waitC(bob, 'C.msgs().filter(m => m.s === "join").length >= ' + (N - 1), 'join lines', 20000);
  ok(true, `system lines: ${N - 1} "joined"`);
  await sleep(500);
  await shotBoth(bob, 'c-01-lobby-strip');

  // ---------------- everyone talks (BOB + ALICE through the real UI)
  await typeAndSend(bob, 'hey all, ready when you are');
  await sleep(1000);
  await typeAndSend(host, 'two more coming 🙌');
  await sleep(1100);
  await typeAndSend(host, 'the host is waiting 👀');
  for (let i = 2; i < N; i++) { await CH(pages[i], `C.send(${JSON.stringify(`${NAMES[i]} here — let's go`)})`); }
  for (const p of pages) await waitC(p, `C.msgs().filter(m => m.u).length >= ${N + 1}`, 'everyone sees every message', 20000);
  ok(true, `${N} players: every phone has all ${N + 1} messages`);
  const g = await bob.evaluate(() => [...document.querySelectorAll('.chat-list .cm')].map(e => ({ me: e.classList.contains('is-me'), cont: e.classList.contains('is-cont'), t: e.querySelector('.cm-text').textContent })));
  ok(g.find(x => x.t.startsWith('hey all')).me && !g.find(x => x.t.startsWith('two more')).me, 'own messages styled distinctly');
  ok(g.find(x => x.t.startsWith('the host is waiting')).cont, 'consecutive messages from one sender are grouped');
  // typing: CHARLIE + DANA type (real UI) without sending
  for (const i of [2, 3]) { await tapReal(pages[i], '.chat-strip'); await pages[i].waitForSelector('.chat-input'); await pages[i].type('.chat-input', 'hmm let me th', { delay: 15 }); }
  await bob.waitForFunction(() => /CHARLIE and DANA are typing|DANA and CHARLIE are typing/.test(document.querySelector('.chat-typing').textContent), { timeout: 8000 });
  ok(true, 'typing indicator: "CHARLIE and DANA are typing…"');
  await shotBoth(bob, 'c-02-sheet-typing');
  await bob.waitForFunction(() => document.querySelector('.chat-typing').textContent === '', { timeout: 12000 });
  ok(true, 'typing indicator clears ~4 s after they stop');
  for (const i of [2, 3]) await pages[i].evaluate(() => window.__chatUI.close());

  // ---------------- unread badge + soft sound while the sheet is closed
  await bob.evaluate(() => window.__chatUI.close());
  await sleep(400);
  const s0 = await CH(bob, 'C.debug.sounds');
  await CH(pages[4], 'C.send("unread test 1")'); await sleep(1000);
  await CH(pages[5], 'C.send("unread test 2")');
  await waitC(bob, 'C.state().unread === 2', 'unread badge counts 2');
  ok(await bob.evaluate(() => document.querySelector('.cs-badge').textContent === '2'), 'unread badge shows 2 on the strip');
  ok((await CH(bob, 'C.debug.sounds')) - s0 === 2, 'a soft sound for each message from others (lobby, sheet closed)');
  await shotBoth(bob, 'c-03-strip-unread');
  await tapReal(bob, '.chat-strip');
  await waitC(bob, 'C.state().unread === 0', 'opening the chat clears the badge');
  ok(true, 'opening the chat clears unread');

  // ---------------- profanity filter (host toggle, render time)
  await CH(pages[4], 'C.send("what the fuck — Scunthorpe assassin class")');
  await bob.waitForFunction(() => [...document.querySelectorAll('.cm-text')].some(e => e.textContent.includes('fuck')), { timeout: 8000 });
  ok(true, 'filter OFF by default: text shown as written');
  await click(host, '.gear');
  await host.waitForSelector('.sheet.settings', { timeout: 5000 });
  await sleep(450);
  await shotBoth(host, 'c-04-host-settings');
  await host.evaluate(() => [...document.querySelectorAll('.sheet.settings .set-row')].find(r => r.textContent.includes('FILTER LANGUAGE')).querySelector('.switch').click());
  await bob.waitForFunction(() => [...document.querySelectorAll('.cm-text')].some(e => e.textContent.includes('f*** — Scunthorpe assassin class')), { timeout: 8000 });
  ok(true, 'filter ON: past messages masked on other phones ("f***"), Scunthorpe/assassin/class untouched');
  await host.evaluate(() => document.querySelector('.modal').click());
  await shotBoth(bob, 'c-05-filtered');

  // ---------------- rate limits: client hint, and a rules-rejected send → failed → retry
  const f = pages[5];
  await tapReal(f, '.chat-strip'); await f.waitForSelector('.chat-input');
  const before = await playerMsgs(f);
  for (const t of ['spam 1', 'spam 2', 'spam 3']) { await f.type('.chat-input', t); await f.keyboard.press('Enter'); await f.evaluate(() => { document.querySelector('.chat-input').value = ''; }); }
  ok(await f.evaluate(() => document.querySelector('.chat-hint').classList.contains('is-on') && /Slow down/.test(document.querySelector('.chat-hint').textContent)), 'client throttle: gentle "slow down" hint');
  await sleep(1200);
  ok((await playerMsgs(f)) === before + 1, 'only one of three rapid sends went out');
  await sleep(1000);
  await CH(f, 'C.rawSend("first")');
  await CH(f, 'C.rawSend("second, too fast for the rules")');
  await f.waitForSelector('.cm[data-state="failed"] .cm-retry', { timeout: 8000 });
  ok(true, 'the rules reject a send < 800 ms after the last → shown as NOT SENT');
  await shotBoth(f, 'c-06-failed-retry');
  await sleep(1000);
  await click(f, '.cm[data-state="failed"] .cm-retry');
  await waitC(bob, 'C.msgs().some(m => m.t === "second, too fast for the rules")', 'retry delivers', 8000);
  ok(true, 'tap to retry delivers it');
  await f.evaluate(() => window.__chatUI.close());

  // ---------------- offline send: pending, then delivered when the connection returns
  const gr = pages[6 % N];
  await tapReal(gr, '.chat-strip'); await gr.waitForSelector('.chat-input');
  await CH(gr, 'C.goOffline()');
  await sleep(500);
  await gr.type('.chat-input', 'typed in a tunnel'); await gr.keyboard.press('Enter');
  await gr.waitForSelector('.cm[data-state="pending"]', { timeout: 5000 });
  await sleep(1500);
  ok(!(await CH(bob, 'C.msgs().some(m => m.t === "typed in a tunnel")')), 'offline: the message waits (shown as SENDING…)');
  await shotBoth(gr, 'c-07-offline-pending');
  await CH(gr, 'C.goOnline()');
  await waitC(bob, 'C.msgs().some(m => m.t === "typed in a tunnel")', 'delivered after reconnect', 15000);
  await gr.waitForFunction(() => !document.querySelector('.cm[data-state="pending"]'), { timeout: 8000 });
  ok(true, 'offline message delivered when the connection returns');
  await gr.evaluate(() => window.__chatUI.close());

  // ---------------- iOS keyboard layout (fake visualViewport: a 336 px keyboard)
  await bob.evaluate(() => { window.__fakeVV = { height: 844 - 336, offsetTop: 0 }; window.__chatLayout(); });
  await sleep(300);
  const kb = await bob.evaluate(() => {
    const f2 = document.querySelector('.chat-form').getBoundingClientRect();
    const list = document.querySelector('.chat-list');
    const last = list.lastElementChild.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    return { formBottom: f2.bottom, lastBottom: last.bottom, listBottom: lr.bottom, listTop: lr.top };
  });
  ok(kb.formBottom <= 508 + 1 && kb.lastBottom <= kb.listBottom + 1 && kb.listTop >= 0, `keyboard: input above the keyboard (bottom ${Math.round(kb.formBottom)} ≤ 508), latest message visible`);
  await bob.screenshot({ path: `${OUT}c-08-keyboard-390.png` });
  await bob.evaluate(() => { delete window.__fakeVV; window.__chatLayout(); });
  await bob.evaluate(() => window.__chatUI.close());

  // ---------------- kicked player loses access; refresh + late joiner see history
  if (N >= 8) {
    const hal = pages[7];
    await host.evaluate(uid => import('/js/room.js').then(m => m.kickPlayer(uid)), uids[7]);
    await waitFor(hal, s => !s.code, 'HAL is out', 15000);
    const denied = await hal.evaluate(code2 => import('/js/firebase.js').then(m => m.get(m.dbRef(`chats/${code2}/m`)).then(() => 'read', e => String(e.message))), code);
    ok(/permission/i.test(denied), 'kicked player can’t read the chat any more');
    await waitC(bob, 'C.msgs().some(m => m.s === "kick")', 'kick line', 10000);
    ok(true, 'system line: "HAL was removed by the host"');
    // late joiner (IVY) sees the history
    const ivy = await openPlayer(8, `room=${code}`);
    await ivy.waitForSelector('.invite-card', { timeout: 20000 });
    await ivy.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await tapReal(ivy, '.invite-card');
    await ivy.waitForSelector('.input-code');
    await ivy.type('.setup-screen input.input:not(.input-code)', 'IVY');
    await tapReal(ivy, '.form-cta .btn-primary');
    await waitC(ivy, 'C.msgs().filter(m => m.u).length >= 10', 'late joiner sees history', 20000);
    ok(true, 'a late joiner sees the recent history');
    pages[7] = ivy;
    uids[7] = await evalIn(ivy, s => s.uid);
  }
  const nBefore = await playerMsgs(pages[2]);
  await pages[2].reload();
  await waitC(pages[2], `C.msgs().filter(m => m.u).length === ${nBefore}`, 'history after refresh', 20000);
  ok(true, `refresh: the history comes back (${nBefore} messages)`);

  // ---------------- games: locked during active play (badge counts, no sound, no toasts), open in breaks
  const start = (id, settings = {}) => host.evaluate(([gid, st]) => import('/js/host.js').then(m => m.startGame(gid, st)), [id, settings]);
  const lobby = () => host.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  async function lockedCheck(id, settings, phaseFn, label) {
    await start(id, settings);
    await waitFor(bob, phaseFn, `${label}: active phase`, 60000);
    await bob.waitForSelector('.chat-fab.is-locked', { timeout: 10000 });
    const snd = await CH(bob, 'C.debug.sounds'), un = await CH(bob, 'C.state().unread');
    await sleep(1200); // (real people don't send twice within the 0.9 s throttle — the previous check just did)
    const sent = await CH(pages[2], `C.send(${JSON.stringify(`${label}: talking during play`)})`);
    try { await waitC(bob, `C.state().unread === ${un + 1}`, `${label}: badge counts while locked`, 25000); }
    catch (e) { log('debug', sent, JSON.stringify(await CH(pages[2], 'C.state()')), JSON.stringify(await CH(bob, 'C.state()')), un); throw e; }
    ok((await CH(bob, 'C.debug.sounds')) === snd && (await toasts(bob)) === 0, `${label}: locked while playing — badge counts, no sound, no toast`);
    ok(!(await bob.evaluate(() => { document.querySelector('.chat-fab').click(); return !!document.querySelector('.chat-sheet'); })), `${label}: the locked button doesn’t open the chat`);
    await sleep(800);
    await shotBoth(bob, `c-09-locked-${id}`);
    return true;
  }
  await lockedCheck('cipher', { rounds: 1, roundSec: 60 }, s => s.game && s.game.phase === 'play', 'CIPHER BREACH');
  await sleep(600);
  await shotBoth(bob, 'c-09-cipher-locked');
  await waitC(bob, 'C.msgs().some(m => m.s === "start")', 'start line', 8000);
  ok(true, 'system line: "CIPHER BREACH started"');
  // a quick winner: host jumps the match to its podium
  await host.evaluate(() => { const s = window.__arcade.state; return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { phase: 'final', phaseStartAt: m.serverNow(), phaseEndsAt: m.serverNow() + 60000 })); });
  await waitC(bob, 'C.msgs().some(m => m.s === "win")', 'win line', 10000);
  await bob.waitForSelector('.chat-fab:not(.is-locked)', { timeout: 8000 });
  ok(true, 'system line: "… won CIPHER BREACH"; results screen unlocks chat');
  await click(bob, '.chat-fab');
  await bob.waitForSelector('.chat-sheet', { timeout: 5000 });
  await sleep(500);
  await shotBoth(bob, 'c-10-results-chat');
  await bob.evaluate(() => window.__chatUI.close());
  await lobby();
  await waitFor(bob, s => s.meta.status === 'lobby', 'back to lobby', 15000);

  await lockedCheck('signal', {}, s => s.game && s.game.phase === 'question', 'LAST SIGNAL');
  await waitFor(bob, s => s.game.phase === 'reveal', 'signal reveal', 40000);
  await bob.waitForSelector('.chat-fab:not(.is-locked)', { timeout: 8000 });
  ok(true, 'LAST SIGNAL: the reveal (between questions) unlocks chat');
  await shotBoth(bob, 'c-11-signal-break');
  await lobby(); await waitFor(bob, s => s.meta.status === 'lobby', 'lobby', 15000);

  await lockedCheck('overclock', {}, s => s.game && s.game.phase === 'play', 'OVERCLOCK');
  await lobby(); await waitFor(bob, s => s.meta.status === 'lobby', 'lobby', 15000);
  await lockedCheck('bluff', {}, s => s.game && s.game.phase === 'write', 'NEURAL BLUFF');
  await lobby(); await waitFor(bob, s => s.meta.status === 'lobby', 'lobby', 15000);
  await lockedCheck('pulse', { song: 'random', count: 1, diff: 'easy', echo: 'off' }, s => s.game && s.game.phase === 'song', 'PULSE');
  await lobby(); await waitFor(bob, s => s.meta.status === 'lobby', 'lobby', 15000);

  // NEON PAR: locked while playing the hole, open once BOB has holed out
  await lockedCheck('golf', { mode: 'quick3' }, s => s.game && s.game.phase === 'play', 'NEON PAR');
  await bob.waitForFunction('!!window.__golf && window.__golf.state()', { timeout: 40000 });
  await sleep(600);
  await shotBoth(bob, 'c-12-golf-locked');
  // chat must cost a running game nothing: BOB's frame pacing, quiet vs. while the room chats
  await bob.evaluate(() => window.__golf.perfReset()); await sleep(4000);
  const quiet = await bob.evaluate(() => window.__golf.perf());
  await bob.evaluate(() => window.__golf.perfReset());
  for (let k = 0; k < 8; k++) { await CH(pages[2 + (k % 3)], `C.send("busy chat ${k}")`); await sleep(500); }
  const busy = await bob.evaluate(() => window.__golf.perf());
  log('golf frames quiet', JSON.stringify(quiet), 'while chatting', JSON.stringify(busy));
  ok(busy.p95 <= quiet.p95 * 1.25 + 4, `NEON PAR frame pacing unchanged while the room chats (p95 ${quiet.p95} → ${busy.p95} ms)`);
  for (let k = 0; k < 8 && !(await bob.evaluate(() => window.__golf.state().status === 'done')); k++) {
    await bob.evaluate(() => window.__golf.skipIntro());
    await bob.waitForFunction(() => { const s = window.__golf.state(); return s.status === 'aim' || s.status === 'done'; }, { timeout: 40000 });
    if (await bob.evaluate(() => window.__golf.state().status === 'done')) break;
    await bob.evaluate(() => window.__golf.autoShot({ angStep: 5, powStep: 0.07 }));
    await bob.waitForFunction(() => { const s = window.__golf.state(); return s.status !== 'roll' && s.status !== 'fall'; }, { timeout: 40000 });
  }
  await bob.waitForSelector('.chat-fab:not(.is-locked)', { timeout: 10000 });
  ok(true, 'NEON PAR: holed out (others still playing) → chat opens');
  await click(bob, '.chat-fab');
  await bob.waitForSelector('.chat-sheet', { timeout: 5000 });
  await sleep(600);
  await shotBoth(bob, 'c-13-golf-chat');
  await bob.evaluate(() => window.__chatUI.close());
  await lobby(); await waitFor(bob, s => s.meta.status === 'lobby', 'lobby', 15000);

  // ---------------- clear chat (host)
  await click(host, '.gear');
  await host.waitForSelector('.sheet.settings', { timeout: 5000 });
  await host.evaluate(() => { const b = [...document.querySelectorAll('.sheet.settings .btn')].find(x => x.textContent.includes('CLEAR CHAT')); b.click(); b.click(); });
  await waitC(bob, 'C.msgs().length === 1 && C.msgs()[0].s === "clear"', 'chat cleared', 10000);
  ok(true, 'host CLEAR CHAT empties it on every phone (one quiet system line left)');
  await host.evaluate(() => document.querySelector('.modal') && document.querySelector('.modal').click());
  await sleep(500);
  await shotBoth(bob, 'c-14-lobby-after-clear');

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { if (pages[1]) await pages[1].screenshot({ path: `${OUT}c-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}chat-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
