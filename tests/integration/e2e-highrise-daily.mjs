// HIGH RISE DAILY A — THE HIGH RISE DAILY end to end on the emulators (the REAL app: the dailies screen's run → js/games/highrise/daily-run.js
// → the real HIGH RISE stage): a real phone (Chromium, 390 × 844, touch) STARTS the daily, a bot drops slabs at their perfect moments
// (every third a touch late — cuts), the page is HIDDEN mid-run (THE HELD RUN: the clock stops, nothing ends), comes BACK (a hold — the
// 3 · 2 · 1, the slab from its entry, leg 1), plays on, lets the fuse end it → the end card's floors = the phone's run = the SERVER's
// replay (the record + the day's score), every tap's chunk server-stamped on its leg's node; a second START answers the day's score (ONE SHOT).
//   DAILY_TEST=1 DAILY_TEST_OFF=highrise node scripts/serve.mjs <port> --emu   then   node tests/integration/e2e-highrise-daily.mjs "<browser>" [--base http://localhost:<port>] [--shots <dir>]
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { dailyTestMode, DAILY_MODE_FIX } from './kit/daily-mode.mjs';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { streakDay } from '../../js/core/streak.js';
import { judgeRun } from '../../js/games/highrise/replay.js';
import { hrFloors, hrPerfects, hrScore } from '../../js/games/highrise/held.js';

const argv = process.argv.slice(2);
const exe = argv[0];
const BASE = (i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--base'));
const SHOTS = (i => (i < 0 ? join(process.cwd(), 'shots-highrise-daily') : argv[i + 1]))(argv.indexOf('--shots'));
mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
const ok = (c, what) => { if (!c) bad++; console.log(c ? 'OK  ' : 'FAIL', what); };
const day = streakDay(Date.now());
const WEEK_AGO = Date.now() - 30 * 86_400_000;

const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
try {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const slot = `hd${Date.now() % 100000}`;
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-highrise-daily'));
  await p.evaluate(s => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'HDTEST', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, slot);
  await p.reload();
  await p.waitForFunction(s => !document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null') || {}).pid, { timeout: 40000 }, slot);
  if (!(await dailyTestMode(p))) { console.log(`FATAL ${DAILY_MODE_FIX}`); process.exit(2); }
  const pid = await p.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).pid, slot);
  await ref(`ppriv/${pid}/at`).set(WEEK_AGO);   // (an old member: the result COUNTS — THE THROWAWAY GATE)
  const listed = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'today' })).then(r => r.dailies.map(d => d.id)));
  ok(listed.includes('highrise'), `HIGH RISE's daily opened on the emulators only (DAILY_TEST_OFF — its row ships OFF): ${listed.join(' · ')}`);

  // ---- THE RUN: the dailies screen's run overlay → the real stage
  await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'run', id: 'highrise' } })));
  await p.waitForFunction(() => !!window.__hiDailyRun && !!window.__hiDaily && !!document.querySelector('.dy-run .hi-play'), { timeout: 30000 });
  await sleep(800);
  await p.screenshot({ path: join(SHOTS, 'hd-01-welcome.png') });
  const tapPlay = () => p.evaluate(() => document.querySelector('.dy-run .hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })));
  await tapPlay();
  await p.waitForFunction(() => window.__hiDailyRun.state() === 'count' || window.__hiDailyRun.state() === 'live', { timeout: 20000 });
  await sleep(1200);
  await p.screenshot({ path: join(SHOTS, 'hd-02-count.png') });
  await p.waitForFunction(() => window.__hiDailyRun.state() === 'live' && window.__hiDaily.state().st === 'slide', { timeout: 15000 });
  const leg0 = await p.evaluate(() => window.__hiDailyRun.leg());
  ok(leg0 && /\/w\/[^/]+\/0$/.test(leg0.path) && leg0.T === 0 && leg0.left === 3, `START: leg 0 (${leg0 && leg0.path}), tick 0, 3 holds`);

  /** the bot in the page: a drop at each slab's perfect moment (every third a touch late) until `floors` more floors, or `ms` */
  const bot = (floors, ms = 60000) => p.evaluate((floors, ms) => new Promise(res => {
    const L = window.__hiDaily, play = document.querySelector('.dy-run .hi-play'), t0 = performance.now(), f0 = L.state().floor;
    let n = 0;
    (function poll() {
      const s = L.state();
      if (performance.now() - t0 > ms || s.over || s.floor - f0 >= floors || window.__hiDailyRun.state() !== 'live') return res({ n, floor: s.floor, over: s.over });
      const m = L.msToPerfect();
      if (m != null && m <= 10) { setTimeout(() => { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); n++; setTimeout(poll, 220); }, n % 3 === 2 ? m + 30 : Math.max(0, m - 4)); return; }
      setTimeout(poll, 4);
    })();
  }), floors, ms);
  const b1 = await bot(14);
  await sleep(400);
  await p.screenshot({ path: join(SHOTS, 'hd-03-playing.png') });
  ok(b1.floor >= 12 && !b1.over, `the bot climbed live (${b1.floor} floors)`);
  // every tap's chunk went up at once — on leg 0's node, stamped by the database
  await sleep(1200);
  const n0 = await val(leg0.path);
  const c0 = Object.values((n0 && n0.c) || {});
  ok(c0.length >= b1.floor - 1 && c0.every(c => c.at >= n0.go && c.at <= n0.z), `the tap chunks on the leg's node, server-stamped inside its window (${c0.length} chunks for ${b1.floor} floors)`);

  // ---- HIDDEN mid-run: THE HELD RUN (the clock stops — nothing ends)
  const setVis = hidden => p.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
  const before = await p.evaluate(() => ({ floor: window.__hiDaily.state().floor, taps: window.__hiDaily.taps().length }));
  await setVis(true);
  ok((await p.evaluate(() => window.__hiDailyRun.state())) === 'held', 'hidden: the run is HELD');
  await sleep(6000);   // (longer than the fuse's two sweeps — a run on the clock would be over)
  const during = await p.evaluate(() => ({ over: window.__hiDaily.state().over, floor: window.__hiDaily.state().floor, held: window.__hiDaily.held() }));
  ok(!during.over && during.floor === before.floor && during.held, `six seconds hidden: nothing fell, nothing ended (${JSON.stringify(during)})`);
  // ---- BACK: a hold — the 3 · 2 · 1, the slab from its entry (leg 1)
  await setVis(false);
  await p.waitForFunction(() => window.__hiDailyRun.leg() && /\/1$/.test(window.__hiDailyRun.leg().path), { timeout: 20000 });
  await sleep(900);
  await p.screenshot({ path: join(SHOTS, 'hd-04-back-count.png') });
  const leg1 = await p.evaluate(() => window.__hiDailyRun.leg());
  ok(leg1.left === 2 && leg1.base === before.taps, `BACK: a HOLD — leg 1, 2 holds left, the log the server had (${leg1.base} taps) replayed`);
  const after = await p.evaluate(() => ({ floor: window.__hiDaily.state().floor, s0: window.__hiDaily.state().s0, log: window.__hiDaily.log() }));
  ok(after.floor === before.floor && after.s0 === leg1.T, `the tower as it was (${after.floor} floors); the next slab enters at T = ${leg1.T}`);
  ok(Number.isFinite((await val(leg0.path)).e), 'leg 0 CLOSED by the server (no queued chunk lands after the hold)');
  await p.waitForFunction(() => window.__hiDailyRun.state() === 'live' && window.__hiDaily.state().st === 'slide', { timeout: 15000 });
  const b2 = await bot(10);
  ok(b2.floor >= before.floor + 8, `played on after the hold (${b2.floor} floors)`);
  // ---- THE END: the bot stops — THE FUSE ends it (TOO SLOW) → `e` + FINISH → the SERVER's floors on the end card
  await p.waitForFunction(() => window.__hiDaily.state().over, { timeout: 20000 });
  await p.waitForFunction(() => { const c = document.querySelector('.dy-run .dy-hr-end'); return c && c.dataset.floors != null; }, { timeout: 30000 });
  await sleep(600);
  await p.screenshot({ path: join(SHOTS, 'hd-05-end.png') });
  const end = await p.evaluate(() => { const c = document.querySelector('.dy-run .dy-hr-end'); return { floors: Number(c.dataset.floors), perfects: Number(c.dataset.perfects), text: c.innerText, phone: window.__hiDaily.result(), log: window.__hiDaily.log() }; });
  const seedNow = await p.evaluate(() => window.__hiDaily.seed());
  const J = judgeRun({ seed: seedNow, mode: 'daily', taps: end.log });
  ok(J.ok && J.floor === end.phone.floor && J.perfects === end.phone.perfects && J.holds === 1, `REPLAY = LIVE: the phone's log (taps + the hold) judged = the phone's run (${J.floor} floors, ${J.perfects} perfects, ${J.holds} hold)`);
  const rec = await val(`dly/highrise/${day}/p/${pid}`), r = await val(`dly/highrise/${day}/r/${pid}`);
  ok(rec && rec.e && rec.f === end.phone.floor && rec.p === end.phone.perfects && rec.h === 1, `THE SERVER's replay of both legs = the phone's (${rec && rec.f} floors, ${rec && rec.p} perfects, ${rec && rec.h} hold — ${rec && rec.o})`);
  ok(r === hrScore(end.phone.floor, end.phone.perfects, end.phone.tick), 'the day\'s score = floors → perfects → the earlier tick');
  ok(end.floors === end.phone.floor && end.perfects === end.phone.perfects && /FLOOR/.test(end.text) && /BACK TO THE DAILIES/.test(end.text) && !/TRY AGAIN|PLAY AGAIN/.test(end.text), `the end card: the SERVER's ${end.floors} floors, BACK TO THE DAILIES, no TRY AGAIN (ONE SHOT)`);
  ok(hrFloors(r) === end.floors && hrPerfects(r) === end.perfects, 'the card reads the stored score');
  // (the look: the end card at the other phone widths + THE DESKTOP — the pass's sizes)
  for (const [w, hh, mob] of [[402, 874, true], [430, 932, true], [1440, 900, false]]) { await p.setViewport({ width: w, height: hh, deviceScaleFactor: mob ? 2 : 1, isMobile: true, hasTouch: true });   // (isMobile kept: flipping it reloads the page)
    await sleep(700); await p.screenshot({ path: join(SHOTS, `hd-06-end-${w}.png`) }); }
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // ONE SHOT: a second START answers the day's score
  const again = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'start', game: 'highrise' })));
  ok(again.done === r && again.run == null, 'a second START: the day\'s score, no run');
  await ctx.close();
} catch (e) { bad++; console.log('FATAL', e && e.stack || e); }
finally {
  await browser.close();
  await deleteApp(fb().app).catch(() => {});
}
ok(!errors.length, `no page errors${errors.length ? ` (${errors.slice(0, 4).join(' · ')})` : ''}`);
console.log(bad ? `${bad} FAILED` : 'ALL GREEN');
process.exit(bad ? 1 : 0);
