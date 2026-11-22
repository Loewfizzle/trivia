// HIGH RISE DAILY B — THE SCREENS + GO LIVE end to end on the emulators (a server with `DAILY_TEST=1` ONLY — HIGH RISE's row stays closed until
// its own liveFrom, never DAILY_TEST_OFF):
//   1. GOES LIVE BY ITSELF: the server's own set at 3:59 / 4:00 am Eastern on the row's liveFrom day (the code's schedule — no /admin step)
//   2. TODAY before its day: 4 real tickets + 4 sweep segments; at its day (an /admin-style schedule from today, the same rule): 5 + 5
//   3. a real phone plays HIGH RISE's daily from its ticket: PLAY → the bot climbs → HIDDEN (held) → back (a hold) → ‹ BACK mid-run (a hold:
//      the ticket = "FLOOR n · ONE SHOT" from the SERVER's log + RESUME) → RESUME → the fuse ends it → THE END CARD (ADMITTED · ONE SHOT · the
//      SERVER's floors · SHARE · BACK TO THE DAILIES, no TRY AGAIN) → the ticket ADMITTED with its floors
//   4. SHARE TODAY: 1 finished = THE POSTER + the DAILY · ONE SHOT tag (the same pixels as daily-share.js) · 5 finished = THE BIG FIVE
//   DAILY_TEST=1 node scripts/serve.mjs <port> --emu   then   node tests/integration/e2e-highrise-daily-b.mjs "<browser>" [--base …] [--shots <dir>]
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.DAILY_TEST = '1';
delete process.env.DAILY_TEST_OFF;
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { dailyTestMode, DAILY_MODE_FIX } from './kit/daily-mode.mjs';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { openDailies, clearSwitchCache } from '../../api/_lib/dailies.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';
import { hrFloors } from '../../js/games/highrise/held.js';

const argv = process.argv.slice(2);
const exe = argv[0];
const BASE = (i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--base'));
const SHOTS = (i => (i < 0 ? join(process.cwd(), 'shots-highrise-daily-b') : argv[i + 1]))(argv.indexOf('--shots'));
mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0, n = 0;
const ok = (c, what) => { n++; if (!c) bad++; console.log(c ? 'OK  ' : 'FAIL', what); };
const day = streakDay(Date.now()), yday = dayOf(dayNum(day) - 1);
const WEEK_AGO = Date.now() - 30 * 86_400_000;
const ROW = DAILIES.find(d => d.id === 'highrise');
const REAL = ['password', 'coastclear', 'drop', 'jaywalk', 'highrise'];
const dlive = (g, from) => (from ? ref(`progress/dlive/${g}`).set({ from, at: Date.now(), by: 'e2e-highrise-daily-b' }) : ref(`progress/dlive/${g}`).remove());

// ================================================================ 1. GOES LIVE BY ITSELF (the server's own set, by the clock — in-process)
{
  for (const g of ['drop', 'jaywalk']) await dlive(g, yday);
  clearSwitchCache();
  const [y, m, d] = [ROW.liveFrom.slice(1, 5), ROW.liveFrom.slice(5, 7), ROW.liveFrom.slice(7, 9)];
  const at = hm => Date.parse(`${y}-${m}-${d}T${hm}:00-05:00`);
  const before = await openDailies(at('03:59')); clearSwitchCache();
  const after = await openDailies(at('04:00')); clearSwitchCache();
  ok(!before.includes('highrise') && after.includes('highrise'), `GOES LIVE BY ITSELF at ${ROW.liveFrom}'s 4 am Eastern: 3:59 → ${before.filter(x => x !== 'test').join(' · ')} · 4:00 → ${after.filter(x => x !== 'test').join(' · ')}`);
  await openDailies(Date.now());
}

const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
try {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource|WebGL|GPU stall/i.test(m.text())) errors.push(m.text()); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const slot = `hb${Date.now() % 100000}`;
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-highrise-daily-b'));
  await p.evaluate(s => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'HBTEST', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, slot);
  await p.reload();
  await p.waitForFunction(s => !document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null') || {}).pid, { timeout: 40000 }, slot);
  if (!(await dailyTestMode(p))) { console.log(`FATAL ${DAILY_MODE_FIX}`); process.exit(2); }
  const pid = await p.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).pid, slot);
  await ref(`ppriv/${pid}/at`).set(WEEK_AGO);
  const api = body => p.evaluate(b => import('/js/profile/api.js').then(m => m.api('daily', b)), body);
  const ids = async () => ((await api({ action: 'today' })).dailies || []).map(d => d.id);
  const screen = () => p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'today' } })));
  const fresh = () => p.evaluate(() => import('/js/daily/today.js').then(m => m.loadToday({ fresh: true })));
  const look = () => p.evaluate(() => ({ tickets: [...document.querySelectorAll('.dy-ticket')].map(t => t.dataset.id).filter(id => id !== 'test'), segs: [...document.querySelectorAll('.dy-seg')].map(s => s.dataset.id).filter(id => id !== 'test') }));
  const hrTicket = () => p.evaluate(() => { const t = document.querySelector('.dy-ticket[data-id="highrise"]'); return t ? { st: (t.className.match(/is-(waiting|progress|done)/) || [])[1], text: t.innerText.replace(/\s+/g, ' ').trim(), act: (t.querySelector('.dy-play') || {}).textContent || '', stamp: !!t.querySelector('.dy-stamp') } : null; });

  // ================================================================ 2. TODAY: 4 before its day · 5 from it
  let got = [];
  for (let i = 0; i < 45 && !(got.includes('drop') && got.includes('jaywalk')); i++) { got = await ids(); if (!got.includes('jaywalk')) await sleep(1000); }
  ok(!got.includes('highrise') || ROW.liveFrom <= day, `before its day (today ${day}, its liveFrom ${ROW.liveFrom}): the server's list = ${got.filter(x => x !== 'test').join(' · ')}`);
  await screen();
  await p.waitForFunction(() => document.querySelectorAll('.dy-ticket').length >= 4, { timeout: 20000 });
  await sleep(500);
  const L4 = await look();
  if (ROW.liveFrom > day) ok(L4.tickets.length === 4 && L4.segs.length === 4 && !L4.tickets.includes('highrise'), `BEFORE 4 AM: 4 tickets + 4 sweep segments (${L4.tickets.join(' · ')})`);
  // its day comes (the same rule, the owner's schedule path: from today)
  await dlive('highrise', day);
  for (let i = 0; i < 45 && !got.includes('highrise'); i++) { got = await ids(); if (!got.includes('highrise')) await sleep(1000); }
  await fresh();
  await p.waitForFunction(() => !!document.querySelector('.dy-ticket[data-id="highrise"] .dy-play'), { timeout: 30000 });
  await sleep(500);
  const L5 = await look();
  ok(L5.tickets.join() === REAL.join() && L5.segs.join() === REAL.join(), `AFTER 4 AM: 5 tickets + 5 sweep segments, in order (${L5.tickets.join(' · ')})`);
  const t0 = await hrTicket();
  ok(t0 && t0.st === 'waiting' && /One shot\./.test(t0.text) && /PLAY/.test(t0.act), `HIGH RISE's ticket: One shot. + PLAY (${t0 && t0.text})`);
  await p.screenshot({ path: join(SHOTS, 'hb-01-today5-night.png') });

  // ================================================================ 3. THE RUN from its ticket
  await p.evaluate(() => document.querySelector('.dy-ticket[data-id="highrise"] .dy-play').click());
  await p.waitForFunction(() => !!window.__hiDailyRun && !!window.__hiDaily && !!document.querySelector('.dy-run .hi-play'), { timeout: 30000 });
  await sleep(600);
  const tapPlay = () => p.evaluate(() => document.querySelector('.dy-run .hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })));
  await tapPlay();
  await p.waitForFunction(() => window.__hiDailyRun.state() === 'live' && window.__hiDaily.state().st === 'slide', { timeout: 20000 });
  const bot = (floors, ms = 60000) => p.evaluate((floors, ms) => new Promise(res => {
    const Lv = window.__hiDaily, play = document.querySelector('.dy-run .hi-play'), t1 = performance.now(), f0 = Lv.state().floor;
    let k = 0;
    (function poll() {
      const s = Lv.state();
      if (performance.now() - t1 > ms || s.over || s.floor - f0 >= floors || window.__hiDailyRun.state() !== 'live') return res({ k, floor: s.floor, over: s.over });
      const m = Lv.msToPerfect();
      if (m != null && m <= 10) { setTimeout(() => { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); k++; setTimeout(poll, 220); }, k % 3 === 2 ? m + 30 : Math.max(0, m - 4)); return; }
      setTimeout(poll, 4);
    })();
  }), floors, ms);
  const b1 = await bot(10);
  ok(b1.floor >= 8 && !b1.over, `the bot climbed (${b1.floor} floors)`);
  // HIDDEN → held · back → a hold (leg 1)
  const setVis = hidden => p.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
  await sleep(900);
  await setVis(true);
  ok((await p.evaluate(() => window.__hiDailyRun.state())) === 'held', 'hidden mid-run: HELD');
  await sleep(2500);
  await setVis(false);
  await p.waitForFunction(() => window.__hiDailyRun.leg() && /\/1$/.test(window.__hiDailyRun.leg().path) && window.__hiDailyRun.state() === 'live' && window.__hiDaily.state().st === 'slide', { timeout: 25000 });
  const b2 = await bot(6);
  ok(b2.floor >= b1.floor + 4, `back (a hold — leg 1) and climbing (${b2.floor} floors)`);
  // ‹ BACK mid-run = a hold: the ticket says FLOOR n · ONE SHOT (the SERVER's floor) + RESUME
  await sleep(1200);
  const phoneFloor = await p.evaluate(() => window.__hiDaily.state().floor);
  await p.evaluate(() => document.querySelector('.dy-run > .dy-back').click());
  await p.waitForFunction(() => !document.querySelector('.dy-run') && !!document.querySelector('.dy-ticket[data-id="highrise"]'), { timeout: 20000 });
  await fresh();
  await p.waitForFunction(() => /FLOOR \d+ · ONE SHOT/.test((document.querySelector('.dy-ticket[data-id="highrise"]') || {}).innerText || ''), { timeout: 20000 }).catch(() => {});
  const t1 = await hrTicket();
  const fl = t1 && /FLOOR (\d+) · ONE SHOT/.exec(t1.text);
  ok(t1 && t1.st === 'progress' && fl && Number(fl[1]) === phoneFloor && /RESUME/.test(t1.act), `the held run's ticket: "FLOOR ${fl && fl[1]} · ONE SHOT" (the server's log = the phone's ${phoneFloor}) + RESUME`);
  await p.screenshot({ path: join(SHOTS, 'hb-02-ticket-held-night.png') });
  await p.evaluate(() => { document.body.dataset.look = 'day'; });
  await sleep(400);
  await p.screenshot({ path: join(SHOTS, 'hb-02-ticket-held-day.png') });
  await p.evaluate(() => { document.body.dataset.look = 'night'; });
  // RESUME → leg 2 → the fuse ends it
  await p.evaluate(() => document.querySelector('.dy-ticket[data-id="highrise"] .dy-play').click());
  await p.waitForFunction(() => !!window.__hiDailyRun && window.__hiDailyRun.state() !== 'idle' && !!document.querySelector('.dy-run .hi-play'), { timeout: 30000 }).catch(() => {});
  if ((await p.evaluate(() => window.__hiDailyRun.state())) === 'idle') await tapPlay();
  await p.waitForFunction(() => window.__hiDailyRun.leg() && /\/2$/.test(window.__hiDailyRun.leg().path), { timeout: 25000 });
  ok(true, 'RESUME from the ticket: a hold — leg 2, the tower as it was');
  await p.waitForFunction(() => window.__hiDaily.state().over, { timeout: 30000 });
  await p.waitForFunction(() => { const c = document.querySelector('.dy-run .dy-hr-end'); return c && c.dataset.floors != null && !!c.querySelector('.dy-stamp'); }, { timeout: 30000 });
  await sleep(700);
  const end = await p.evaluate(() => { const c = document.querySelector('.dy-run .dy-hr-end'); return { floors: Number(c.dataset.floors), text: c.innerText.replace(/\s+/g, ' '), share: !!c.querySelector('.dy-hr-share'), big: c.querySelector('.dy-hr-big').getBoundingClientRect().height, bigPx: parseFloat(getComputedStyle(c.querySelector('.dy-hr-big')).fontSize), phone: window.__hiDaily.result().floor }; });
  const r = await val(`dly/highrise/${day}/r/${pid}`);
  ok(end.floors === hrFloors(r) && end.floors === end.phone && /HIGH RISE · ONE SHOT/.test(end.text) && /ADMITTED|admitted/i.test(await p.evaluate(() => document.querySelector('.dy-hr-end .dy-stamp').getAttribute('aria-label'))) && end.share && /BACK TO THE DAILIES/.test(end.text) && !/TRY AGAIN|PLAY AGAIN/.test(end.text),
    `THE END CARD: ADMITTED · HIGH RISE · ONE SHOT · the SERVER's ${end.floors} floors · SHARE · BACK TO THE DAILIES (no TRY AGAIN) — "${end.text.slice(0, 90)}"`);
  ok(end.big < end.bigPx * 1.6, `the floors on ONE line (${Math.round(end.big)} px tall at ${end.bigPx} px)`);
  await p.screenshot({ path: join(SHOTS, 'hb-03-end-night.png') });
  await p.evaluate(() => { document.body.dataset.look = 'day'; });
  await sleep(400);
  await p.screenshot({ path: join(SHOTS, 'hb-03-end-day.png') });
  await p.evaluate(() => { document.body.dataset.look = 'night'; });
  // the SHARE card is ready (the server's inputs → THE POSTER + the tag)
  const shareOk = await p.evaluate(async () => { const M = await import('/js/games/highrise/daily-share.js'); const C = await import('/js/daily/contract.js'); const s = await C.dailyShare(); const I = s && s.share && s.share.highrise; return I ? { f: I.f, w: (I.w || []).length, keys: Object.keys(I).sort().join(','), tag: M.DAILY_TAG } : null; });
  ok(shareOk && shareOk.f === end.floors && shareOk.w === end.floors && !/seed|k\b|t\b/.test(shareOk.keys), `the share inputs are the SERVER's, spoiler-free (${shareOk && shareOk.keys})`);
  // BACK TO THE DAILIES → ADMITTED
  await p.evaluate(() => [...document.querySelectorAll('.dy-hr-end .btn')].find(b => /BACK TO THE DAILIES/.test(b.textContent)).click());
  await p.waitForFunction(() => !!document.querySelector('.dy-ticket[data-id="highrise"].is-done .dy-stamp'), { timeout: 20000 });
  const t2 = await hrTicket();
  ok(t2.st === 'done' && t2.stamp && new RegExp(`${end.floors} FLOORS?`).test(t2.text), `the ticket: ${t2.text}`);
  await sleep(800);
  await p.screenshot({ path: join(SHOTS, 'hb-04-ticket-done-night.png') });

  // ================================================================ 4. SHARE TODAY — 1 finished = THE POSTER + the tag · 5 finished = THE BIG FIVE
  const draw = () => p.evaluate(async () => {
    const [T, C, D, HR] = await Promise.all([import('/js/daily/today.js'), import('/js/daily/contract.js'), import('/js/daily/share-today.js'), import('/js/games/highrise/daily-share.js')]);
    const t = await T.loadToday({ fresh: true }), s = await C.dailyShare(), share = (s && s.share) || {};
    const { lineOf } = await import('/js/screens/daily.js');
    const cv = await D.drawToday(t, lineOf, 'night', { streak: 0, share });
    const plan = D.planToday(t, share);
    let same = -1;
    if (plan.single === 'highrise') { const b = await HR.renderShare({ inputs: share.highrise }); const x = cv.getContext('2d').getImageData(0, 0, 1080, 1350).data, y = b.getContext('2d').getImageData(0, 0, 1080, 1350).data; same = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) same++; }
    return { finished: plan.sections.map(x => x.id), single: plan.single, same, five: (cv.sections || []).filter(x => x.five).length, w: cv.width };
  });
  const s1 = await draw();
  ok(s1.single === 'highrise' && s1.same === 0, `SHARE TODAY with HIGH RISE alone = THE POSTER + the DAILY · ONE SHOT tag (${s1.same} px differ)`);
  // the other four finished (their day results in — the server's rows)
  for (const [g, s] of [['password', 5], ['coastclear', 138], ['drop', 1589017], ['jaywalk', 143 * 1e5 + 95000]]) { await ref(`dly/${g}/${day}/s/${pid}`).set(Date.now() - 60000); await ref(`dly/${g}/${day}/r/${pid}`).set(s); }
  const s5 = await draw();
  ok(s5.finished.length === 5 && s5.five === 5, `SHARE TODAY with 5 finished = THE BIG FIVE (${s5.five} text sections: ${s5.finished.join(' · ')})`);
  ok(!errors.length, `no page errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
} finally {
  for (const g of ['drop', 'jaywalk', 'highrise']) await dlive(g, null).catch(() => {});
  await browser.close();
  try { await deleteApp(fb().app); } catch { /* fine */ }
}
console.log(bad ? `${bad} FAILED of ${n}` : `ALL GREEN (${n})`);
process.exit(bad ? 1 : 0);
