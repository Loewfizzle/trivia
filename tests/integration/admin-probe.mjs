// DFIX3 — /ADMIN's LOOK on the emulators (a dev tool): makes an owner profile through /api, starts its OWN serve.mjs with that profile in
// ADMIN_PIDS, restores the profile's key in a browser (so that browser's anonymous uid IS the admin), seeds a few daily plays, and shoots
// /admin → THE DAILIES (the stats + TODAY'S PLAYERS + ADD FRIEND) at a phone width + desktop. Stops its server when done.
//   node tests/integration/admin-probe.mjs "<browser>" [./shots-dfix3]      (the emulators up; port 5179)
// STATS=1 (THE POOL FIXES add-on 3): /admin → STATS instead — WHO'S ON (its server answer stubbed in the browser: two rows, the city + a room)
// + GAMES PLAYED, at 390 / 402 / 430 + 1440
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.DAILY_TEST ||= '1';
import puppeteer from './kit/puppeteer.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { ref, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';

const OUT = (process.argv[3] || './shots-dfix3').replace(/\/?$/, '/'), PORT = 5179;
mkdirSync(OUT, { recursive: true });
const now = Date.now(), weekAgo = now - 7 * 864e5;
const owner = await profileAction(`adm-probe-owner-${Date.now().toString(36)}`, { action: 'ensure', name: 'Ben', avatar: 'star', color: 'cyan' }, '', weekAgo);
await ref(`ppriv/${owner.pid}/at`).set(weekAgo);
// a few players today: one finished THE PASSWORD, one mid COAST CLEAR, one brand new
const mk = async (uid, name, at) => { const p = await profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'magenta' }, '', at); await ref(`ppriv/${p.pid}/at`).set(at); return p; };
await mk('adm-probe-ann', 'Ann', weekAgo); await mk('adm-probe-bob', 'Bob', weekAgo); await mk('adm-probe-cat', 'Cat', now);
const s = await dailyAction('adm-probe-ann', { action: 'start', game: 'test' }, now);
await dailyAction('adm-probe-ann', { action: 'finish', game: 'test', result: { guess: s.seed % 1000 } }, now + 1000);
await dailyAction('adm-probe-ann', { action: 'start', game: 'coastclear' }, now + 2000);
await dailyAction('adm-probe-bob', { action: 'start', game: 'coastclear' }, now + 3000);
await dailyAction('adm-probe-cat', { action: 'start', game: 'password' }, now + 4000);
const key = owner.key;
if (!key) { console.log('the owner profile already existed (no key handed out) — remove adm-probe-* in the emulator and run again'); process.exit(1); }

const srv = spawn(process.execPath, ['scripts/serve.mjs', String(PORT), '--emu'], { env: { ...process.env, ADMIN_PIDS: owner.pid }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise(res => { srv.stdout.on('data', d => { if (/serving/.test(String(d))) res(); }); setTimeout(res, 4000); });
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto(`http://localhost:${PORT}/?emu&slot=adm`);
  await p.waitForFunction(() => !!window.__arcade, { timeout: 40000 });
  const r = await p.evaluate(async k => { const m = await import('/js/profile/me.js'); const r = await m.restoreKey(k); return r && r.pid; }, key);
  console.log('restored as', r, r === owner.pid ? '(the owner)' : '(?!)');
  if (process.env.STATS) {
    await p.setRequestInterception(true);
    p.on('request', req => {
      if (req.method() === 'POST' && /\/api\/admin$/.test(req.url()) && /radioWhosOn/.test(req.postData() || '')) {
        const now = Date.now();
        const rows = [
          { card: { id: 'b1', n: 'BEN', l: 41, cd: 'card-sg-ufo', c: '#ff4fa3' }, where: { k: 'city' }, at: now - 20e3 },
          { card: { id: 'b2', n: 'DIME TIME', l: 17, cd: 'card-gift-buzzed', c: '#36e6ff' }, where: { k: 'room', code: 'GULF', g: 'prism', p: 'playing' }, at: now - 120e3 },
        ];
        return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ rows, guests: { n: 1, city: 1, rooms: 0, daily: 0 }, now }) });
      }
      return req.continue();
    });
    for (const [w, h, tag] of [[390, 844, '390'], [402, 874, '402'], [430, 932, '430'], [1440, 900, 'desk']]) {
      const ph = tag !== 'desk';
      await p.setViewport({ width: w, height: h, deviceScaleFactor: ph ? 2 : 1, isMobile: ph, hasTouch: ph });
      await p.evaluate(() => { try { localStorage.setItem('ad:open:ad-stats', '1'); } catch { /* fine */ } });
      await p.goto(`http://localhost:${PORT}/admin?emu&slot=adm`);
      await p.waitForSelector('#ad-stats');
      await p.evaluate(() => { const c = document.getElementById('ad-stats'); if (c && c.classList.contains('is-shut')) c.querySelector('.ad-card-h').click(); });
      await p.waitForFunction(() => !!document.querySelector('#ad-stats .wo-row'), { timeout: 40000 }).catch(() => console.log(tag, 'no WHO\'S ON rows'));
      await new Promise(r2 => setTimeout(r2, 1500));
      const info = await p.evaluate(() => ({ who: [...document.querySelectorAll('#ad-stats .wo-row')].map(r => `${r.querySelector('.wo-card').clientWidth}px · ${r.querySelector('.wo-meta').innerText.replace(/\s+/g, ' ')}`),
        games: [...document.querySelectorAll('#ad-stats .ad-bars li .ad-bar-name')].map(e => e.textContent), anim: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.wo-list')).length }));
      console.log(tag, JSON.stringify(info));
      await p.evaluate(() => document.querySelector('#ad-stats .ad-whoson').scrollIntoView({ block: 'start' }));
      await new Promise(r2 => setTimeout(r2, 300));
      await p.screenshot({ path: `${OUT}admin-stats-${tag}.png` });
    }
    console.log(`shots → ${OUT}admin-stats-*.png`);
  }
  for (const [w, h, tag] of process.env.STATS ? [] : [[390, 844, 'phone'], [1440, 900, 'desk']]) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: tag === 'phone' ? 2 : 1, isMobile: tag === 'phone', hasTouch: tag === 'phone' });
    await p.goto(`http://localhost:${PORT}/admin?emu&slot=adm`);
    await p.waitForFunction(() => !!document.querySelector('.ad-dly-players, #ad-dly-stats p'), { timeout: 40000 });
    await p.waitForFunction(() => !!document.querySelector('.ad-dly-players') || /Couldn|Nobody/.test((document.getElementById('ad-dly-stats') || {}).innerText || ''), { timeout: 40000 });
    await new Promise(r2 => setTimeout(r2, 1200));
    const card = await p.$('#ad-dly-stats');
    const back = await p.evaluate(() => { const a = document.querySelector('a.ad-back'); return a ? { text: a.textContent, href: a.getAttribute('href'), top: a.getBoundingClientRect().top } : null; });
    const info = await p.evaluate(() => ({ players: document.querySelectorAll('.ad-dly-p').length, buttons: [...document.querySelectorAll('.ad-dly-fr .btn')].map(b => b.textContent.trim()), heads: [...document.querySelectorAll('#ad-dly-stats h3')].map(h => h.textContent), text: (document.getElementById('ad-dly-stats') || {}).innerText.slice(0, 400) }));
    console.log(tag, JSON.stringify(back), JSON.stringify(info));
    await p.evaluate(() => { const c = document.getElementById('ad-dailies'); if (c) c.scrollIntoView({ block: 'start' }); });
    await new Promise(r2 => setTimeout(r2, 300));
    await p.screenshot({ path: `${OUT}admin-dailies-${tag}.png` });
    if (card) await card.screenshot({ path: `${OUT}admin-dailies-card-${tag}.png` });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: `${OUT}admin-top-${tag}.png` });
  }
  console.log(`shots → ${OUT}admin-*.png`);
} finally {
  await browser.close();
  srv.kill();
  await deleteApp(fb().app);
}
