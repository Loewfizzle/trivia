// THE DROP A — THE DROP end to end (docs/prism.md "THE DROP"; docs/testing.md): the emulators + a test server that opens THE DROP's OFF row:
//   DAILY_TEST=1 DAILY_TEST_OFF=drop node scripts/serve.mjs 5173 --emu
//   cd tests/integration && node e2e-drop.mjs "<chromium>" ./shots-drop
// A bot plays a DROP run on PRISM DROP's REAL view (the daily's run overlay) → its checkpoints reach the server (the record's tick moves) → a
// PAUSE hides the board (one of the 3) → RESUME → a REFRESH resumes at the latest checkpoint, paused, one more pause used (the one line says so)
// → RESUME → the run tops out → the final upload + finish → the stored score = the replayed one + its points; a tampered upload + an early
// finish are refused (over /api, a second player). Shots of the run, the pause + the end at 390 / 402 / 430 × Safari heights.
// THE DROP B: the run plays PRISM DROP's own songs (the console's music silent) · the one-time hint (a first run) · HIDING THE PAGE = a pause
// (a 10 s hide → paused, RESUME, the run goes on) · a second phone: 3 hides, then a 30 s hide with none left → ended at its checkpoint + 15 s.
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
/** a phone's app switch: the page hidden / shown (visibilityState + hidden + the event — as iOS's) */
const setHidden = (p, on) => p.evaluate(hid => { for (const [k, v] of [['visibilityState', hid ? 'hidden' : 'visible'], ['hidden', hid]]) Object.defineProperty(document, k, { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); }, on);

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
  // (SKINS 1: THE GAME LOOK pinned to NIGHT for the run + the pause — AUTO follows the real sun, so this suite went red by day: the night set
  //  was expected whatever the hour; the refresh + the end switch to DAY below, as before)
  await A.page.evaluate(() => { localStorage.setItem('ns:look', 'night'); window.dispatchEvent(new CustomEvent('ns-look', { detail: 'night' })); });
  await openRun(A.page);
  await waitFor(A.page, '!!window.__drop && !!document.querySelector(".pd.pd-drop .pd-board-c")', 'THE DROP run on the PRISM view', 30000);
  ok(true, 'THE DROP mounts PRISM DROP\'s real view in its DROP mode (the board, the rail, SLAM)');
  await waitFor(A.page, 'window.__drop.state().k > 120', 'the run\'s clock (after the 3-2-1)', 15000);
  const top = await A.page.evaluate(() => document.querySelector('.pd-mode').textContent);
  ok(/^PRISM DROP · \d+:\d\d$/.test(top), `the top line: ${top}`);
  ok(await A.page.evaluate(() => !!document.querySelector('.pd-rail .dr-pause') && document.querySelector('.dr-pause .dr-left').textContent === '3'), 'the PAUSE control at the rail\'s top, 3 left');
  // THE DROP B — PRISM DROP's OWN SONGS (the night set by night), the console's decks silent; the one-time hint on a first run
  const bt = await A.page.evaluate(() => (window.__prism && window.__prism.beat ? window.__prism.beat() : null));
  ok(bt && typeof bt.id === 'string' && bt.set === 'night', `the run plays PRISM DROP's own songs — the night set (${bt && bt.id}, ${bt && bt.set})`);
  ok(await A.page.evaluate(() => window.__arcade.musicDebug().desired == null), 'the console plays nothing of its own (no daily deck over the songs)');
  ok(await A.page.evaluate(() => { const e = document.querySelector('.dr-hint'); return !!e && /rows keep rising/.test(e.textContent); }), 'the one-time hint on a first run');
  await sizes(A.page, 'drop-00-hint');
  await waitFor(A.page, '!document.querySelector(".dr-hint")', 'the hint goes (6 s of play)', 15000);
  { let ls = null; for (let i = 0; i < 30 && ls !== 1; i++) { ls = await val(`pstats/${A.pid}/ls/drop`); if (ls !== 1) await sleep(200); } ok(ls === 1, 'the hint seen once — the server\'s flag (every device)'); }
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
  ok(/PAUSED · 2 LEFT/.test(pz.card) && /RESUME/.test(pz.card), `the card: ${pz.card.replace(/\s+/g, ' ')}`);
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

  // ================================================================ 2b. THE DROP B — HIDING THE PAGE = an automatic PLAYER pause (one of the 3)
  await setHidden(A.page, true);
  await waitFor(A.page, 'window.__drop.state().paused && window.__drop.state().away && window.__drop.state().pzOk', 'the hide paused the run (server-confirmed)', 8000);
  const kh = (await st(A.page)).k;
  const rh = await val(`dly/drop/${day}/p/${A.pid}`);
  ok(rh.pz && rh.pz.n === 2 && rh.pz.at != null && rh.k === kh, `the hide = a PLAYER pause, server-timed, its chunk carried (pauses used ${rh.pz && rh.pz.n}, tick ${rh.k} = ${kh})`);
  await sleep(10000);                                                       // (10 s away — a call)
  await setHidden(A.page, false);
  await sleep(600);
  const ph = await A.page.evaluate(() => ({ board: getComputedStyle(document.querySelector('.pd-board-c')).visibility, card: document.querySelector('.dr-card').innerText.replace(/\s+/g, ' ') }));
  ok(ph.board === 'hidden' && /PAUSED · 1 LEFT/.test(ph.card) && /RESUME/.test(ph.card), `back on the page: the board hidden behind RESUME (${ph.board}; ${ph.card})`);
  ok((await st(A.page)).k === kh, 'the run stood still while away');
  await sizes(A.page, 'drop-02b-hidden');
  await A.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(A.page, '!window.__drop.state().paused', 'RESUME after the hide', 8000);
  await sleep(4000);
  ok((await st(A.page)).k > kh + 150, 'the run goes on after the hide');

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
  ok(rs.refresh && rs.left === 0 && rs.k === before.k && before.k > kh, `the refresh resumed at the latest checkpoint (tick ${rs.k} = the record's ${before.k}, past the hide's ${kh}), one pause used (${rs.left} left)`);
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
  ok(/PRISM DROP/.test(endCard) && /SCORED/.test(endCard), `the end card: ${endCard}`);
  await sizes(A.page, 'drop-04-end');
  // CITY D — THE END CARD SHRINKS (the owner: it never went away): ~1.5 s later a slim straight-edged bar at the board's foot — THE DROP · the
  // time · SHARE; a tap on the bar opens the card again, a tap outside it shrinks it at once
  await waitFor(A.page, 'window.__drop.bar()', 'the end card shrinks to its bar', 6000);
  const barOf = () => A.page.evaluate(() => { const c = document.querySelector('.dr-card'), r = c.getBoundingClientRect(), o = c.parentElement.getBoundingClientRect(); return { text: c.innerText.replace(/\s+/g, ' ').trim(), h: Math.round(r.height), foot: Math.round(o.bottom - r.bottom), share: !!c.querySelector('.dr-share'), rad: parseFloat(getComputedStyle(c).borderTopLeftRadius), at: [r.left + 30, r.top + r.height / 2], out: [o.left + o.width / 2, o.top + o.height * 0.3] }; });
  const bar = await barOf();
  ok(bar.h <= 60 && bar.foot <= 16 && bar.share && /^PRISM DROP\s+(·\s*)?\d+:\d\d/.test(bar.text) && !/SCORED|LINES?\b/.test(bar.text) && bar.rad <= 4, `THE END CARD SHRINKS: a ${bar.h}-pt bar ${bar.foot} pt off the board's foot, straight-edged (${bar.rad} px) — "${bar.text}"`);
  await sizes(A.page, 'drop-04b-bar');
  await A.page.mouse.click(...bar.at);
  await waitFor(A.page, '!window.__drop.bar()', 'a tap on the bar opens the card again', 3000);
  await A.page.mouse.click(...bar.out);
  ok(await waitFor(A.page, 'window.__drop.bar()', 'a tap outside the card shrinks it at once', 1000).then(() => true, () => false), 'THE END CARD: a tap on the bar opens the card again, a tap outside it shrinks it at once');
  ok(!(await A.page.evaluate(() => !!document.querySelector('.pd-board-over .pd-ko, .pd-ko'))), 'no room KO card over THE DROP\'s end (the driver\'s card alone)');
  ok((await val('rooms/undefined')) == null, 'the run wrote nothing under rooms/ (a daily is /api only)');

  // ================================================================ 5. the refusals (a second player, over /api): a tampered upload, an early finish
  const B = await profileAction('e2e-dr-bob', { action: 'ensure', name: 'BOBBY', avatar: 'bolt', color: 'cyan' }, '', WEEK_AGO);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${B.pid}`, null])));
  const sb = await dailyAction('e2e-dr-bob', { action: 'start', game: 'drop' });
  const fake = createDropRun(sb.run.seed);
  stepTo(fake, 3600);   // (THE FIX PASS: 30 s of play the moment the run starts — the old slam-every-12-ticks forgery topped out at tick 120, 1 s, inside FAST_TOL_MS)
  const forged = await dailyAction('e2e-dr-bob', { action: 'checkpoint', game: 'drop', day: sb.day, at: 0, add: fake.log, k: fake.k }).then(() => null, e => e);
  ok(forged && forged.status === 422, `a log faster than the clock is refused (${forged && forged.code})`);
  const early = await dailyAction('e2e-dr-bob', { action: 'finish', game: 'drop', day: sb.day }).then(() => null, e => e);
  ok(early && early.status === 409 && early.code === 'not_done', `a finish before the end is refused (${early && early.code})`);
  log(`THE DROP: ${(end.t / 1000).toFixed(1)} s · ${end.lines} lines · score ${r}`);

  // ================================================================ 6. THE DROP B — 3 hides, then a 30 s hide with none left → ended at its checkpoint + 15 s
  const C = await openApp('drc', 'HIDER');
  await ref(`ppriv/${C.pid}/at`).set(WEEK_AGO);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${C.pid}`, null])));
  await openRun(C.page);
  await waitFor(C.page, '!!window.__drop && window.__drop.state().k > 200', 'the second phone\'s run', 30000);
  await C.page.evaluate(() => window.__drop.bot({ every: 120 }));
  for (let i = 1; i <= 3; i++) {
    await setHidden(C.page, true);
    await waitFor(C.page, 'window.__drop.state().paused && window.__drop.state().pzOk', `hide ${i} paused`, 8000);
    await sleep(1200);
    await setHidden(C.page, false);
    await C.page.evaluate(() => document.querySelector('.dr-card .btn').click());
    await waitFor(C.page, '!window.__drop.state().paused', `resume ${i}`, 8000);
    await sleep(1500);
  }
  ok((await st(C.page)).left === 0 && (await val(`dly/drop/${day}/p/${C.pid}`)).pz.n === 3, 'three hides = the three pauses');
  await C.page.evaluate(() => window.__drop.noBot());
  await setHidden(C.page, true);
  await sleep(1500);
  const c0 = await st(C.page), rc0 = await val(`dly/drop/${day}/p/${C.pid}`);
  ok(!c0.paused && rc0.k === c0.k && !rc0.pz.at, `the 4th hide pauses nothing — its checkpoint landed (tick ${rc0.k})`);
  await sleep(30000);                                                       // (30 s away, no pause left)
  await setHidden(C.page, false);
  await waitFor(C.page, 'window.__drop.state().finished || !!window.__drop.state().refused', 'the away run ended + was scored', 30000);
  const ce = await st(C.page), rc = await val(`dly/drop/${day}/p/${C.pid}`), sc = await val(`dly/drop/${day}/r/${C.pid}`);
  ok(!ce.refused && rc.e === 1 && rc.o === 'late', `ended by the bound (${rc.o}; ${ce.refused || 'accepted'})`);
  ok(Math.abs(rc.t - (rc0.t + 15000)) <= 50 || ce.over, `at the checkpoint + 15 s of play (${(rc.t / 1000).toFixed(1)} s vs ${((rc0.t + 15000) / 1000).toFixed(1)} s)`);
  ok(sc != null && Math.floor(sc / 1000) === Math.round(rc.t / 100), `scored at that time (${sc})`);
  await sizes(C.page, 'drop-06-away-end');
  await C.ctx.close();

  // ================================================================ 7. PFIX-3 — NO HONEST RUN LOST (FABLE REVIEW 2: M1, M2, M3)
  const E = await openApp('dre', 'RACER');
  await ref(`ppriv/${E.pid}/at`).set(WEEK_AGO);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${E.pid}`, null])));
  await openRun(E.page);
  await waitFor(E.page, '!!window.__drop && window.__drop.state().k > 300', 'the third phone\'s run', 30000);
  await E.page.evaluate(() => window.__drop.bot({ every: 110 }));
  await sleep(2500);
  const recE = () => val(`dly/drop/${day}/p/${E.pid}`);
  // M1 — PAUSE tapped while a checkpoint is uploading: the server MUST hold the pause (it used to say PAUSED with the clock running)
  const m1 = await E.page.evaluate(() => { window.__drop.send(); const flying = window.__drop.state().flying; window.__drop.pause(); return { flying, paused: window.__drop.state().paused }; });
  ok(m1.flying && m1.paused, 'M1: PAUSE tapped while a checkpoint is in flight — frozen at the tap');
  await waitFor(E.page, 'window.__drop.state().paused && window.__drop.state().pzOk', 'M1: the pause confirmed by the server', 8000);
  const k1 = (await st(E.page)).k, r1 = await recE();
  ok(r1.pz && r1.pz.at != null && r1.pz.n === 1 && r1.k === k1, `M1: the SERVER paused, its chunk carried to the tap's tick (pauses used ${r1.pz && r1.pz.n}, tick ${r1.k} = ${k1})`);
  await sleep(6000);
  await E.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(E.page, '!window.__drop.state().paused', 'M1: RESUME', 8000);
  await sleep(1000);
  const k1b = (await st(E.page)).k;
  ok(k1b > k1 && k1b - k1 < 120 * 3, `M1: RESUME goes on from the tap — no fast-forward through the pause (${((k1b - k1) / 120).toFixed(2)} s of play 1 s after RESUME; it was the whole pause)`);
  // S4 — a SLOW answer no longer moves the run's clock back (it froze the board for the answer's delay, then lurched)
  const s4 = await E.page.evaluate(() => { const o0 = window.__drop.off(), k0 = window.__drop.state().k; window.__drop.took({ now: Date.now() + o0 - 2500 }); return { o0, o1: window.__drop.off(), k0 }; });
  await sleep(600);
  const k4b = (await st(E.page)).k;
  ok(s4.o1 === s4.o0 && k4b - s4.k0 > 40, `S4: an answer that took 2.5 s leaves the clock where it was (offset ${s4.o0} → ${s4.o1} ms) — the run keeps stepping (${k4b - s4.k0} ticks in 0.6 s; it stood still for 2.4 s)`);
  // M2 — the page hides while a checkpoint is uploading: paused, 27 s away, the run goes on
  await sleep(1500);
  await E.page.evaluate(() => { window.__drop.send(); });
  await setHidden(E.page, true);
  await waitFor(E.page, 'window.__drop.state().paused && window.__drop.state().away && window.__drop.state().pzOk', 'M2: the hide paused the run though an upload was in flight', 8000);
  const k2 = (await st(E.page)).k, r2 = await recE();
  ok(r2.pz && r2.pz.at != null && r2.pz.n === 2 && r2.k === k2 && !r2.e, `M2: the SERVER paused (pauses used ${r2.pz && r2.pz.n}), the log up to the hide in (tick ${r2.k} = ${k2})`);
  await sleep(27000);                                                       // (27 s away — past the 20 s bound that ended the run before)
  await setHidden(E.page, false);
  await sleep(600);
  ok(/PAUSED · 1 LEFT/.test(await E.page.evaluate(() => document.querySelector('.dr-card').innerText.replace(/\s+/g, ' '))), 'M2: back after 27 s — PAUSED · 1 LEFT');
  await E.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(E.page, '!window.__drop.state().paused', 'M2: RESUME', 8000);
  await sleep(2500);
  const s2 = await st(E.page), r2b = await recE();
  ok(!s2.ended && !r2b.e && s2.k > k2 && s2.k - k2 < 120 * 5, `M2: the run goes on from the hide (${((s2.k - k2) / 120).toFixed(2)} s of play 2.5 s after RESUME) — not ended late`);
  // M3 — the hide's pause call NEVER ARRIVES: asked again on the return (27 s later) = a backdated pause, the run goes on
  await E.page.evaluate(() => window.__drop.lose(true));
  await setHidden(E.page, true);
  await sleep(800);
  const s3 = await st(E.page), r3 = await recE();
  ok(s3.paused && s3.away && !s3.pzOk && !(r3.pz && r3.pz.at != null), 'M3: the hide\'s call was lost — the phone frozen + unconfirmed, the server not paused');
  await sleep(26000);
  await E.page.evaluate(() => window.__drop.lose(false));
  const back3 = Date.now();
  await setHidden(E.page, false);
  await waitFor(E.page, 'window.__drop.state().paused && window.__drop.state().pzOk', 'M3: the return asked again — paused', 8000);
  const r3b = await recE();
  ok(!r3b.e && r3b.pz && r3b.pz.n === 3 && r3b.k === s3.k, `M3: a pause was left → the run is NOT ended (pauses used ${r3b.pz && r3b.pz.n}; the log up to the hide in — tick ${r3b.k} = ${s3.k})`);
  ok(back3 - r3b.pz.at > 24000, `M3: the pause is backdated to the hide (${((back3 - r3b.pz.at) / 1000).toFixed(1)} s back)`);
  await E.page.evaluate(() => document.querySelector('.dr-card .btn').click());
  await waitFor(E.page, '!window.__drop.state().paused', 'M3: RESUME', 8000);
  await sleep(2500);
  const s3b = await st(E.page), r3c = await recE();
  ok(!s3b.ended && !r3c.e && s3b.k > s3.k && s3b.k - s3.k < 120 * 5, `M3: the run goes on from the hide's tick (${((s3b.k - s3.k) / 120).toFixed(2)} s of play 2.5 s after RESUME)`);
  // S5 — THE FINISH NEVER GIVES UP: no signal as the run tops out → "SENDING YOUR RUN…" for as long as it takes (it used to stop after 6
  // tries, ~21 s, for good); the signal back (`online`) → sent at once
  await E.page.evaluate(() => { window.__drop.lose(true); window.__drop.bot({ every: 150, dumb: true }); });
  await waitFor(E.page, 'window.__drop.state().ended', 'the third phone\'s run topped out (no signal)', 90000);
  await sleep(25000);
  const s5 = await st(E.page), c5 = await E.page.evaluate(() => document.querySelector('.dr-card').innerText.replace(/\s+/g, ' '));
  ok(s5.ended && !s5.finished && !s5.refused && /SENDING YOUR RUN/.test(c5) && (await val(`dly/drop/${day}/r/${E.pid}`)) == null, `S5: 25 s with no signal — still trying, never given up (${c5})`);
  const t5 = Date.now();
  await E.page.evaluate(() => { window.__drop.lose(false); window.dispatchEvent(new Event('online')); });
  await waitFor(E.page, 'window.__drop.state().finished || !!window.__drop.state().refused', 'the third phone\'s run was scored once the signal came back', 20000);
  ok(Date.now() - t5 < 6000, `S5: the signal back → the finish goes at once (${Date.now() - t5} ms — not the back-off's 15 s)`);
  const eE =await st(E.page), scE = await val(`dly/drop/${day}/r/${E.pid}`);
  ok(!eE.refused && eE.result && eE.result.score === scE && Math.floor(scE / 1000) === Math.round(eE.t / 100), `after a pause in flight, a hide in flight and a lost hide the whole run is scored (${scE})`);
  await E.ctx.close();

  // ================================================================ 8. PFIX-3 — S3: A REFUSED FINISH IS NEVER A DEAD END
  // (the hole FABLE REVIEW 2 made — here the stored log is simply taken away mid-run: the finish's replay cannot check the run → it is scored
  //  at the last point the store can prove (nothing → the floor), marked, and the phone SAYS so: the end card, TODAY's ticket, a re-open)
  const F = await openApp('drf', 'HOLEY');
  await ref(`ppriv/${F.pid}/at`).set(WEEK_AGO);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'l', 'x'].map(k => [`dly/drop/${day}/${k}/${F.pid}`, null])));
  await openRun(F.page);
  await waitFor(F.page, '!!window.__drop && window.__drop.state().k > 300', 'the fourth phone\'s run', 30000);
  await F.page.evaluate(() => window.__drop.bot({ every: 110 }));
  await sleep(3000);
  await F.page.evaluate(() => { window.__drop.send(); });
  await waitFor(F.page, 'window.__drop.state().sent > 0', 'a checkpoint landed', 8000);
  await ref(`dly/drop/${day}/l/${F.pid}`).remove();
  await F.page.evaluate(() => window.__drop.bot({ every: 150, dumb: true }));
  await waitFor(F.page, 'window.__drop.state().finished || (!!window.__drop.state().refused && !window.__drop.state().ended)', 'the run with a hole in its log ended + was answered', 90000);
  const sF = await st(F.page), rF = await val(`dly/drop/${day}/r/${F.pid}`), pF = await val(`dly/drop/${day}/p/${F.pid}`);
  ok(sF.finished && sF.result && sF.result.rf === true && rF === sF.result.score && rF != null, `S3: the finish is ANSWERED with a score (${rF}) — no 422, nothing left "in progress"`);
  ok(pF.rf === 'log_missing' && Math.floor(rF / 1000) === 0, `S3: the record is marked (${pF.rf}); with nothing of the log provable the score is the floor (${rF})`);
  const cF = await F.page.evaluate(() => document.querySelector('.dr-card').innerText.replace(/\s+/g, ' '));
  ok(/THIS RUN COULDN’T BE CHECKED/.test(cF) && !/SENDING/.test(cF) && !/SHARE/.test(cF), `S3: the end card says so (${cF})`);
  await sizes(F.page, 'drop-08-unchecked');
  await F.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen' } })));
  await waitFor(F.page, `!!document.querySelector('.dy-ticket[data-id="drop"].is-done')`, 'TODAY: THE DROP done (never RESUME)', 15000);
  const tF = await F.page.evaluate(() => document.querySelector('.dy-ticket[data-id="drop"]').innerText.replace(/\s+/g, ' '));
  ok(/THIS RUN COULDN’T BE CHECKED/.test(tF) && !/RESUME/.test(tF), `S3: TODAY's ticket: ${tF}`);
  await sizes(F.page, 'drop-08b-ticket');
  await openRun(F.page);
  await waitFor(F.page, `!!document.querySelector('.dr-done')`, 'the re-opened run', 15000);
  const dF = await F.page.evaluate(() => document.querySelector('.dr-done').innerText.replace(/\s+/g, ' '));
  ok(/TODAY’S DROP IS DONE/.test(dF) && /THIS RUN COULDN’T BE CHECKED/.test(dF), `S3: re-opened: ${dF} (never "SENDING YOUR RUN…")`);
  await F.ctx.close();
});
