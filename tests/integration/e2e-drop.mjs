// THE DROP A — THE DROP end to end (docs/prism.md "THE DROP"; docs/testing.md): the emulators + a test server that opens THE DROP's OFF row:
//   DAILY_TEST=1 DAILY_TEST_OFF=drop node scripts/serve.mjs 5173 --emu
//   cd tests/integration && node e2e-drop.mjs "<chromium>" ./shots-drop
// A bot plays a DROP run on PRISM DROP's REAL view (the daily's run overlay) → its checkpoints reach the server (the record's tick moves) → a
// PAUSE hides the board (one of the 3) → RESUME → a REFRESH resumes at the latest checkpoint, paused, one more pause used (the one line says so)
// → RESUME → the run tops out → the final upload + finish → the stored score = the replayed one + its points; a tampered upload + an early
// finish are refused (over /api, a second player). Shots of the run, the pause + the end at 390 / 402 / 430 × Safari heights.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.DAILY_TEST ||= '1';
process.env.DAILY_TEST_OFF ||= 'drop';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { ref, val } from '../../api/_lib/fb.js';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { streakDay } from '../../js/core/streak.js';
import { dailyPoints } from '../../js/core/daily-points.js';
import { createDropRun, input, stepTo } from '../../js/games/prism/drop.js';

const H = await createHarness({ name: 'drop', slot: 'dr', sizes: [[390, 650], [402, 690], [430, 746]] });
const { log, sleep, ok, BASE, browser } = H;
const day = streakDay(Date.now());
const WEEK_AGO = Date.now() - 7 * 864e5;
const waitFor = (p, js, what, timeout = 20000) => p.waitForFunction(js, { timeout, polling: 100 }).catch(e => { throw new Error(`${what}: ${e.message}`); });
const st = p => p.evaluate(() => (window.__drop ? window.__drop.state() : null));

async function openApp(slot, name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource/i.test(m.text())) H.errors.push(`${name}: ${m.text()}`); });
  await page.setViewport({ width: 390, height: 650, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-drop'));
  await page.evaluate((s, n) => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, slot, name);
  await page.reload();
  await waitFor(page, `!document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem('na:${slot}:me') || 'null') || {}).pid`, `${name}: the title + a profile`, 40000);
  const pid = await page.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).pid, slot);
  return { ctx, page, pid };
}
const openRun = p => p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'run', id: 'drop' } })));
const sizes = async (p, name) => { if (!H.SHOTS) return; for (const [w, h] of [[390, 650], [402, 690], [430, 746]]) { await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(350); await p.screenshot({ path: `${H.OUT || './shots-drop/'}${name}-${w}x${h}.png` }); } await p.setViewport({ width: 390, height: 650, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); };

await H.run(async () => {
  const A = await openApp('dra', 'DROPPY');
  await ref(`ppriv/${A.pid}/at`).set(WEEK_AGO);                           // (an old member: the run COUNTS — THE THROWAWAY GATE)
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${A.pid}`, null])));

  // ================================================================ 1. the run opens on PRISM DROP's real view, its clock running
  await openRun(A.page);
  await waitFor(A.page, '!!window.__drop && !!document.querySelector(".pd.pd-drop .pd-board-c")', 'THE DROP run on the PRISM view', 30000);
  ok(true, 'THE DROP mounts PRISM DROP\'s real view in its DROP mode (the board, the rail, SLAM)');
  await waitFor(A.page, 'window.__drop.state().k > 120', 'the run\'s clock (after the 3-2-1)', 15000);
  const top = await A.page.evaluate(() => document.querySelector('.pd-mode').textContent);
  ok(/^THE DROP · \d+:\d\d$/.test(top), `the top line: ${top}`);
  ok(await A.page.evaluate(() => !!document.querySelector('.pd-rail .dr-pause') && document.querySelector('.dr-pause .dr-left').textContent === '3'), 'the PAUSE control at the rail\'s top, 3 left');
  await A.page.evaluate(() => window.__drop.bot({ every: 70 }));
  await waitFor(A.page, 'window.__drop.state().sent > 0', 'the first checkpoint (30 s of play — the add-on rhythm)', 45000);
  await sleep(500);
  const rec1 = await val(`dly/drop/${day}/p/${A.pid}`);
  const s1 = await st(A.page);
  ok(rec1 && rec1.k > 0 && rec1.len > 0 && rec1.len <= s1.len, `the checkpoints reach the server (its tick ${rec1 && rec1.k}, log ${rec1 && rec1.len} / ${s1.len} chars)`);
  await sizes(A.page, 'drop-01-run');

  // ================================================================ 2. PAUSE: the board hidden, the server's clock stopped, one of the 3
  await A.page.evaluate(() => window.__drop.pause());
  await waitFor(A.page, 'window.__drop.state().paused && document.querySelector(".pd").classList.contains("dr-paused")', 'paused', 8000);
  await sleep(800);
  const pz = await A.page.evaluate(() => ({ board: getComputedStyle(document.querySelector('.pd-board-c')).visibility, next: getComputedStyle(document.querySelector('.pd-next')).visibility, card: document.querySelector('.dr-card').innerText }));
  ok(pz.board === 'hidden' && pz.next === 'hidden', `the board + NEXT hidden while paused (${pz.board}, ${pz.next})`);
  ok(/PAUSED/.test(pz.card) && /2 PAUSES LEFT/.test(pz.card) && /RESUME/.test(pz.card), `the card: ${pz.card.replace(/\s+/g, ' ')}`);
  const kp = (await st(A.page)).k;
  await sleep(1500);
  ok((await st(A.page)).k === kp, 'the run stands still while paused');
  const rp = await val(`dly/drop/${day}/p/${A.pid}`);
  ok(rp.pz && rp.pz.n === 1 && rp.pz.at != null, 'the server timed the pause (one used)');
  await sizes(A.page, 'drop-02-paused');
  await A.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(A.page, '!window.__drop.state().paused', 'RESUME', 8000);
  await sleep(7000);
  ok((await st(A.page)).k > kp + 300, 'RESUME: the run goes on');

  // ================================================================ 3. A REFRESH: back at the latest checkpoint, paused, one more pause used
  // (the page hiding sends a checkpoint of its own — THE ADD-ON — so "the latest" is the record as the resume finds it)
  await A.page.evaluate(() => localStorage.setItem('ns:look', 'day'));     // (the refresh + the end in THE DAY LOOK — PRISM's crayon; the run + pause by night)
  await A.page.reload();
  await waitFor(A.page, '!document.getElementById("boot") && !!window.__arcade', 'the reload', 40000);
  await openRun(A.page);
  await waitFor(A.page, '!!window.__drop && window.__drop.state().paused', 'resumed into a pause', 30000);
  const rs = await st(A.page);
  const before = await val(`dly/drop/${day}/p/${A.pid}`);
  const card = await A.page.evaluate(() => document.querySelector('.dr-card').innerText.replace(/\s+/g, ' '));
  ok(rs.refresh && rs.left === 1 && rs.k === before.k && before.k > kp, `the refresh resumed at the latest checkpoint (tick ${rs.k} = the record's ${before.k}, past the pause's ${kp}), one pause used (${rs.left} left)`);
  ok(/LAST CHECKPOINT · 1 PAUSE USED/.test(card), `one line says so: ${card}`);
  ok(await A.page.evaluate(() => document.querySelector('.pd').dataset.look === 'crayon'), 'the day look: PRISM DROP’s crayon board');
  await sizes(A.page, 'drop-03-refresh');
  await A.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(A.page, '!window.__drop.state().paused', 'RESUME after the refresh', 8000);

  // ================================================================ 4. THE END: the top-out → the final upload → finish → the stored score + points
  await A.page.evaluate(() => window.__drop.bot({ every: 150, dumb: true }));
  await waitFor(A.page, 'window.__drop.state().finished || !!window.__drop.state().refused', 'the run topped out + was scored', 90000);
  const end = await st(A.page);
  ok(!end.refused, `the server accepted the run (${end.refused || 'ok'})`);
  const r = await val(`dly/drop/${day}/r/${A.pid}`);
  ok(end.result && end.result.score === r && r > 0, `the stored score = the finish's (${r})`);
  ok(Math.floor(r / 1000) === Math.round(end.t / 100) && r % 1000 === end.lines, `the score = the phone's run: tenths × 1000 + lines (${(end.t / 1000).toFixed(1)} s, ${end.lines} lines)`);
  ok(end.result.outcome && end.result.outcome.points === dailyPoints('drop', r), `the points (${end.result.outcome && end.result.outcome.points})`);
  const endCard = await A.page.evaluate(() => document.querySelector('.dr-card').innerText.replace(/\s+/g, ' '));
  ok(/THE DROP/.test(endCard) && /SCORED/.test(endCard), `the end card: ${endCard}`);
  await sizes(A.page, 'drop-04-end');
  ok(!(await A.page.evaluate(() => !!document.querySelector('.pd-board-over .pd-ko, .pd-ko'))), 'no room KO card over THE DROP\'s end (the driver\'s card alone)');
  ok((await val('rooms/undefined')) == null, 'the run wrote nothing under rooms/ (a daily is /api only)');

  // ================================================================ 5. the refusals (a second player, over /api): a tampered upload, an early finish
  const B = await profileAction('e2e-dr-bob', { action: 'ensure', name: 'BOBBY', avatar: 'bolt', color: 'cyan' }, '', WEEK_AGO);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${B.pid}`, null])));
  const sb = await dailyAction('e2e-dr-bob', { action: 'start', game: 'drop' });
  const fake = createDropRun(sb.run.seed);
  for (let k = 0; k < 3600; k += 12) { stepTo(fake, k); input(fake, 'X'); }
  const forged = await dailyAction('e2e-dr-bob', { action: 'checkpoint', game: 'drop', day: sb.day, at: 0, add: fake.log, k: fake.k }).then(() => null, e => e);
  ok(forged && forged.status === 422, `a log faster than the clock is refused (${forged && forged.code})`);
  const early = await dailyAction('e2e-dr-bob', { action: 'finish', game: 'drop', day: sb.day }).then(() => null, e => e);
  ok(early && early.status === 409 && early.code === 'not_done', `a finish before the end is refused (${early && early.code})`);
  log(`THE DROP: ${(end.t / 1000).toFixed(1)} s · ${end.lines} lines · score ${r}`);
});
