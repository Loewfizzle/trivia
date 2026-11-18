// DAILY A — JAYWALK's DAILY end to end on the emulators (the TEST PAGE — tests/integration/jaywalk-daily.html; B builds the real screens):
// the row opened the real way (THE SCHEDULED GO-LIVE from today — progress/dlive/jaywalk; under DAILY_TEST the switch needs nothing else), a
// real phone (Chromium, 390 × 844, touch) plays THREE TRIES with the greedy bot: START → the hop chunks land on its proof node with the
// DATABASE's server timestamps → FINISH / HIDDEN → the server's lanes = the phone's (REPLAY = LIVE) → the best counts → the 4th refused; the
// record + the chunks checked in the database; the page's LOCAL JUDGE (the owner's phone link) once; a screenshot of each for the look.
//   DAILY_TEST=1 node scripts/serve.mjs <port> --emu   then   node tests/integration/e2e-jaywalk-daily.mjs "<browser>" [--base http://localhost:<port>] [--shots <dir>]
// The schedule is removed at the end (the server's 30 s cache: run e2e-daily BEFORE this, never right after).
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
import { jwLanes } from '../../js/core/daily-best.js';

const argv = process.argv.slice(2);
const exe = argv[0];
const BASE = (i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--base'));
const SHOTS = (i => (i < 0 ? join(process.cwd(), 'shots-jaywalk-daily') : argv[i + 1]))(argv.indexOf('--shots'));
mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
const ok = (c, what) => { if (!c) bad++; console.log(c ? 'OK  ' : 'FAIL', what); };
const day = streakDay(Date.now());

const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const errors = [];
try {
  // ---- the row opened the real way: THE SCHEDULED GO-LIVE from today (DAILY_TEST opens the switch)
  await ref('progress/dlive/jaywalk').set({ from: day, at: Date.now(), by: 'e2e-jaywalk-daily' });
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const slot = `jd${Date.now() % 100000}`;
  await p.goto(guardUrl(`${BASE}/tests/integration/jaywalk-daily.html?emu&slot=${slot}&auto=1&name=JDTEST`, 'e2e-jaywalk-daily'));
  await p.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__jwd, { timeout: 40000 });
  if (!(await dailyTestMode(p))) { console.log(`FATAL ${DAILY_MODE_FIX}`); process.exit(2); }
  // (the server's switch cache is ~30 s: wait for JAYWALK in today's list)
  let open = false;
  for (let i = 0; i < 50 && !open; i++) { open = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'today' })).then(r => r.dailies.some(d => d.id === 'jaywalk'))); if (!open) await sleep(1000); }
  ok(open, 'JAYWALK\'s daily opened by THE SCHEDULED GO-LIVE (its row ships OFF)');
  const pid = await p.evaluate(s => (JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null') || {}).pid, slot) || await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('profile', { action: 'ensure', name: 'JDTEST', avatar: 'bolt', color: 'cyan' })).then(r => r.pid));
  const st = () => p.evaluate(() => window.__jwd.state());

  /** one try: START, the bot plays `ms` of the clock, then FINISH (or `hide`) → its end row */
  async function oneTry(n, ms, how = 'finish') {
    await p.evaluate(() => window.__jwd.start());
    await p.waitForFunction(() => window.__jwd.state().playing && window.__jwd.state().t > 60, { timeout: 15000 });
    if (n === 1) await p.screenshot({ path: join(SHOTS, 'jd-01-playing.png') });
    const until = Date.now() + ms;
    while (Date.now() < until && (await st()).playing) await sleep(500);
    const s0 = await st();
    ok(s0.sent > 0 || s0.hops === 0, `TRY ${n}: the hops went up in chunks while it played (${s0.sent} of ${s0.hops} sent)`);
    if (s0.playing) await p.evaluate(h => (h === 'hide' ? window.__jwd.hide() : window.__jwd.finish()), how);
    await p.waitForFunction(k => window.__jwd.state().ends.length >= k, { timeout: 20000 }, n);
    const s1 = await st();
    return s1.ends[n - 1];
  }
  const e1 = await oneTry(1, 12000);
  ok(e1.server === e1.replay && e1.server >= e1.live && e1.hops > 5, `TRY 1 (FINISH mid-run — as it stands): the server's lanes = the phone's own replay of its log (a hop in the air lands) (${JSON.stringify(e1)})`);
  const e2 = await oneTry(2, 20000, 'hide');
  ok(e2.server === e2.replay && e2.server >= e2.live, `TRY 2 (the page HIDDEN mid-run — the try ends): ${e2.server} lanes on the server = ${e2.replay} replayed on the phone (${e2.live} shown)`);
  const e3 = await oneTry(3, 8000);
  ok(e3.server === e3.replay && e3.server >= e3.live, `TRY 3: ${e3.server} lanes (= the phone's)`);
  await p.screenshot({ path: join(SHOTS, 'jd-02-three-tries.png') });
  const s3 = await st();
  const best = Math.max(e1.server, e2.server, e3.server);
  ok(s3.left === 0 && s3.tries.length === 3 && s3.tries.every(t => !t.open), `three tries used, all closed (${s3.tries.map(t => t.l).join(' · ')})`);
  ok(jwLanes(s3.dayBest) === best, `the day's score = the BEST try (${jwLanes(s3.dayBest)} lanes)`);
  ok(s3.best && jwLanes(s3.best.s) === best, `DAILY BEST = ${s3.best && jwLanes(s3.best.s)} lanes`);
  // a 4th: refused
  await p.evaluate(() => window.__jwd.start());
  const s4 = await st();
  ok(s4.err === 'no_tries' && !s4.playing, `a 4th try REFUSED (${s4.err})`);
  // ---- the database: the record, the proof nodes with SERVER timestamps, the day's score
  const rec = await val(`dly/jaywalk/${day}/p/${pid}`);
  const tries = Object.values((rec && rec.t) || {});
  ok(tries.length === 3 && tries.every(t => t.e > 0 && Number.isFinite(t.l)), `the record: 3 tries closed by the server (${tries.map(t => `${t.l}/${t.why}${t.cut ? '/CUT' : ''}${t.bad ? `/${t.bad}` : ''}`).join(' · ')})`);
  ok(tries.map(t => t.l).sort().join() === [e1.server, e2.server, e3.server].sort().join(), 'the record\'s lanes = the page\'s');
  ok((await val(`dly/jaywalk/${day}/r/${pid}`)) === s3.dayBest, 'the day\'s score stored = the best try');
  const uid = tries[0] && tries[0].u, node = uid ? await val(`dly/jaywalk/${day}/w/${uid}/0`) : null;
  const cs = Object.values((node && node.c) || {});
  ok(node && node.go === tries[0].go && node.e > 0 && cs.length > 3 && cs.every(c => c.at >= node.go && c.at <= node.z), `the proof node: GO + z the server's, ${cs.length} chunks each stamped by the database inside the window, closed (e)`);
  await ctx.close();

  // ---- THE LOCAL JUDGE (the owner's phone link: no emulators needed)
  const ctx2 = await browser.createBrowserContext();
  const q = await ctx2.newPage();
  q.on('pageerror', e => errors.push(`local pageerror: ${e.message}`));
  await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await q.goto(guardUrl(`${BASE}/tests/integration/jaywalk-daily.html?auto=1`, 'e2e-jaywalk-daily'));
  await q.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__jwd, { timeout: 40000 });
  await q.evaluate(() => window.__jwd.start());
  await q.waitForFunction(() => window.__jwd.state().t > 6 * 60, { timeout: 20000 });
  await q.evaluate(() => window.__jwd.finish());
  await q.waitForFunction(() => window.__jwd.state().ends.length === 1, { timeout: 10000 });
  const L = await q.evaluate(() => window.__jwd.state());
  ok(L.mode === 'local' && L.ends[0].server === L.ends[0].replay && L.ends[0].hops > 3, `THE LOCAL JUDGE: the server's own code in the page — ${JSON.stringify(L.ends[0])} ${JSON.stringify(L.tries)}`);
  await q.screenshot({ path: join(SHOTS, 'jd-03-local.png') });
  await ctx2.close();
} catch (e) { bad++; console.log('FATAL', e && e.stack || e); }
finally {
  await ref('progress/dlive/jaywalk').remove().catch(() => {});
  await browser.close();
  await deleteApp(fb().app).catch(() => {});
}
ok(!errors.length, `no page errors${errors.length ? ` (${errors.slice(0, 4).join(' · ')})` : ''}`);
console.log(bad ? `${bad} FAILED` : 'ALL GREEN');
process.exit(bad ? 1 : 0);
