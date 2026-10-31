// Idle rooms close after an hour without a game.
//   node e2e-idle.mjs "<browser path>" ./shots      (emulators running; run rules.test.mjs first so the emulator has the current rules)
// 1. Lobby countdown in the last 10 minutes on every phone, KEEP OPEN (host) resets it.
// 2. Past the hour the host closes the room live: every phone lands on the title with a message.
// 3. "Next day": nobody's online, the room is an hour stale, a player opens the site again → title + message, room deleted.
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, get, update } from 'firebase/database';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const NAMES = ['ALICE', 'BOB', 'CHARLIE'];
const HOUR = 3600_000;
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const env = await initializeTestEnvironment({ projectId: 'demo-arcade', database: { host: '127.0.0.1', port: 9000 } });
// the app's namespace (rules-unit-testing defaults to ns=projectId, a different emulator DB)
const admin = fn => env.withSecurityRulesDisabled(ctx => fn(ctx.database('http://127.0.0.1:9000?ns=demo-arcade-default-rtdb')));
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });
const ctxs = [];
const pages = [];

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${NAMES[i]} pageerror: ${e.message}`));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED/i.test(t)) errors.push(`${NAMES[i]}: ${t}`); });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=i${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 20000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };
async function shotBoth(page, name) {
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(400);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
}
async function makeRoom(n) {
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tapReal(host, '.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  const code = await evalIn(host, s => s.code);
  for (let i = 1; i < n; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await tapReal(p, '.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  return code;
}
const setActive = (code, at) => admin(db => update(ref(db, `rooms/${code}/meta`), { activeAt: at }));
const roomGone = async code => { let gone; await admin(async db => { gone = !(await get(ref(db, `rooms/${code}/meta`))).exists(); }); return gone; };

try {
  // ---- 1 + 2: live lobby
  const code = await makeRoom(3);
  log('room', code);
  ok(await evalIn(pages[0], () => document.querySelector('.lobby-idle').hidden), 'fresh room: no countdown');
  await setActive(code, Date.now() - HOUR + 8 * 60_000);
  for (const p of pages) await p.waitForFunction(() => { const e = document.querySelector('.lobby-idle'); return e && !e.hidden; }, { timeout: 8000 });
  const txt = await pages[1].evaluate(() => document.querySelector('.lobby-idle').textContent);
  ok(/ROOM CLOSES IN 8 MIN/.test(txt), `countdown on every phone (“${txt.slice(0, 22)}…”)`);
  ok(!/null/.test(txt), 'no stray text in the banner');
  ok(!(await pages[1].$('.lobby-idle .btn')) && !!(await pages[0].$('.lobby-idle .btn')), 'KEEP OPEN only for the host');
  await pages[0].evaluate(() => document.querySelector('.lobby-idle').scrollIntoView({ block: 'center' }));
  await shotBoth(pages[0], 'idle-01-countdown-host');
  await pages[1].evaluate(() => document.querySelector('.lobby-idle').scrollIntoView({ block: 'center' }));
  await shotBoth(pages[1], 'idle-02-countdown-player');
  await pages[0].evaluate(() => document.querySelector('.lobby-idle .btn').click());
  for (const p of pages) await p.waitForFunction(() => document.querySelector('.lobby-idle').hidden, { timeout: 8000 });
  ok(true, 'KEEP OPEN hides the countdown everywhere');

  await setActive(code, Date.now() - HOUR - 5000);
  for (const p of pages) await waitFor(p, s => s.view === 'title' && !s.code, 'back on the title', 15000);
  ok(true, 'past the hour: every phone is back on the title');
  ok(await pages[2].evaluate(() => document.body.innerText.includes('NO GAME FOR AN HOUR')), 'players see why');
  await shotBoth(pages[2], 'idle-03-closed-live');
  ok(await roomGone(code), 'the room was deleted');
  ok(!(await pages[1].evaluate(() => location.search.includes('room='))), 'invite link cleared from the URL');

  // ---- 3: the next day
  for (const p of pages) await p.close();
  pages.length = 0;
  const code2 = await makeRoom(2);
  log('room 2', code2);
  for (const p of pages) await p.close();
  await sleep(800);
  await setActive(code2, Date.now() - 20 * HOUR);
  const bob = await openPlayer(1, `room=${code2}`); // the reloaded tab still has ?room= in its URL
  await waitFor(bob, s => s.ready && s.view === 'title', 'title after the night', 20000);
  ok(!(await evalIn(bob, s => s.code)), 'the next day: not dropped back into the stale room');
  ok(await bob.evaluate(() => document.body.innerText.includes('AN HOUR WITHOUT A GAME')), 'told the room closed');
  ok(!(await bob.$('.nd-go.is-ready')), 'no stale invite card to rejoin');
  await shotBoth(bob, 'idle-04-next-day');
  ok(await roomGone(code2), 'the stale room was deleted by the returning (non-host) player');
} catch (e) {
  errors.push(e.message);
  log('FAILED', e.message);
} finally {
  log('checks', `${checks.filter(c => c.ok).length}/${checks.length}`, 'errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
  await env.cleanup();
}
