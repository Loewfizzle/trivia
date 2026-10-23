// Quick smoke test on NORMAL phone tabs (no ?slot= — the other E2E suites all use test slots, which once hid a lobby bug
// that printed "null" only on a regular phone).
//   node e2e-smoke.mjs "<browser path>" ./shots
// Two plain tabs (separate browser contexts = two players): title → create / join → lobby → HOW TO PLAY → each of the six
// games started from the lobby, watched through its opening screens → back to the lobby. Fails on any visible "null",
// "undefined", "NaN" or "[object Object]", on page errors, and on console errors. Takes about two minutes.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const WATCH_MS = Number(process.env.WATCH_MS || 14000);
// quick settings so each game reaches real play fast (DOUBLE AGENT needs 4 players — e2e-agent.mjs covers it)
// (GAMES=cipher,pulse: only those — the one-game smoke check a City 2.0 pass runs when it touches a shared file; plan.md TESTING SCOPE)
const ONLY_GAMES = (process.env.GAMES || '').split(',').filter(Boolean);
const ALL_GAMES = [
  ['cipher', { rounds: 3 }],
  ['signal', {}],
  ['overclock', { mode: 'quick' }],
  ['bluff', {}],
  ['pulse', { count: 1 }],
  ['golf', { mode: 'quick3' }],
  ['prism', { mode: 'battle' }],
  ['slip', { lives: 1 }],
  ['gridlock', { mode: 'classic', placeSec: 45 }],
  ['gridlock', { mode: 'arcade', placeSec: 45 }],
  ['stakes', {}],
  ['rum', { days: 15, daySec: 30 }],
];
const GAMES = ONLY_GAMES.length ? ALL_GAMES.filter(([id]) => ONLY_GAMES.includes(id)) : ALL_GAMES;
const BAD = /\bnull\b|\bundefined\b|\bNaN\b|\[object Object\]/;
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const NAMES = ['HOSTY', 'GUEST'];
const pages = [];
async function open(i, qs = '') {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'warning' && /game view/.test(m.text())) errors.push(`game view failed to load: ${m.text()}`); });
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(NAMES[i], 'PAGEERROR', e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|TOO LATE/i.test(t) && !/blocked by CORS policy/i.test(t) /* an outside site (the trivia APIs) refusing a request: not ours */) { errors.push(`${NAMES[i]}: ${t}`); log(NAMES[i], 'console.error', t); } });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/?emu${qs}`); // no &slot= : a regular phone
  pages[i] = page;
  return page;
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return; } catch { /* busy */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
// every visible piece of text (innerText skips hidden elements), plus attributes people can see or hear
const scan = page => page.evaluate(() => {
  const txt = document.body.innerText;
  const attrs = [...document.querySelectorAll('[aria-label],[placeholder],[title]')].map(e => [e.getAttribute('aria-label'), e.getAttribute('placeholder'), e.getAttribute('title')].join(' '));
  return `${txt}\n${attrs.join('\n')}`;
});
const seen = new Set();
async function check(where) {
  for (let i = 0; i < pages.length; i++) {
    const text = await scan(pages[i]).catch(() => '');
    const m = text.match(BAD);
    if (m) {
      const at = text.indexOf(m[0]);
      const key = `${where}|${m[0]}`;
      if (!seen.has(key)) {
        seen.add(key);
        const ctx = text.slice(Math.max(0, at - 50), at + 30).replace(/\s+/g, ' ');
        errors.push(`${NAMES[i]} @ ${where}: "${m[0]}" in "…${ctx}…"`);
        log('FAIL', `${NAMES[i]} @ ${where}: stray "${m[0]}" — …${ctx}…`);
        await pages[i].screenshot({ path: `${OUT}smoke-bad-${where.replace(/\W+/g, '_')}-${i}.png` }).catch(() => {});
      }
    }
  }
}
async function watch(where, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { await check(where); await sleep(400); }
}
const tap = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };

try {
  // ---- title + create (host) — a brand-new phone
  const host = await open(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  await host.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
  ok(await host.evaluate(() => !/[?&]slot=/.test(location.search)), 'host is a regular phone tab (no test slot)');
  await check('title');
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tap(host, '.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await check('setup');
  await host.type('.setup-screen input.input', NAMES[0]);
  await tap(host, '.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  const code = await evalIn(host, s => s.code);
  log('room', code);

  // ---- join (guest) through the invite link, also a regular phone
  const guest = await open(1, `&room=${code}`);
  await guest.waitForSelector('.nd-go', { timeout: 20000 });
  await guest.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
  await check('invite');
  await tap(guest, '.nd-go');
  await guest.waitForSelector('.input-code');
  await guest.type('.setup-screen input.input:not(.input-code)', NAMES[1]);
  await tap(guest, '.form-cta .btn-primary');
  await guest.waitForSelector('.lobby-screen', { timeout: 20000 });
  await waitFor(host, s => Object.keys(s.players).length === 2, 'two players', 20000);
  await sleep(1500); // chat strip + lobby art load lazily
  await watch('lobby', 2000);
  await host.screenshot({ path: `${OUT}smoke-lobby.png`, fullPage: true });
  ok(true, 'lobby on two regular phones');

  // ---- HOW TO PLAY sheet (every game's rules)
  await host.evaluate(() => document.querySelector('.gc-help').click());
  await sleep(700);
  const tabs = await host.$$eval('.help-tab, [role="tab"]', els => els.length).catch(() => 0);
  for (let k = 0; k < tabs; k++) {
    await host.evaluate(n => { const t = document.querySelectorAll('.help-tab, [role="tab"]')[n]; if (t) t.click(); }, k);
    await sleep(250);
    await check(`help-${k}`);
  }
  await host.keyboard.press('Escape');
  await host.evaluate(() => { const c = document.querySelector('.modal .sheet-close, .modal [aria-label="Close"]'); if (c) c.click(); });
  await sleep(500);

  // ---- each game: start, watch its opening screens on both phones, back to the lobby
  for (const [id, settings] of GAMES) {
    await host.evaluate(([g, s]) => import('/js/host.js').then(m => m.startGame(g, s)), [id, settings]);
    await waitFor(host, (s, g) => s.game && s.game.id === g, `${id} started`, 20000, id);
    await waitFor(guest, (s, g) => s.game && s.game.id === g, `${id} on the guest`, 20000, id);
    await watch(id, WATCH_MS);
    await guest.screenshot({ path: `${OUT}smoke-${id}.png` });
    const phase = await evalIn(guest, s => s.game && s.game.phase);
    ok(true, `${id}: watched to phase "${phase}" with no stray text`);
    await host.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(guest, s => !s.game || s.meta.status === 'lobby', `${id}: back to lobby`, 20000);
    await guest.waitForSelector('.lobby-screen', { timeout: 15000 });
    await sleep(800);
    await check(`lobby after ${id}`);
  }

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  for (let i = 0; i < pages.length; i++) await pages[i]?.screenshot({ path: `${OUT}smoke-fail-${i}.png` }).catch(() => {});
} finally {
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  writeFileSync(`${OUT}smoke-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
