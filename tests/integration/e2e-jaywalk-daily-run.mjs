// DAILY B — JAYWALK's DAILY on the REAL screens, end to end on the emulators: THE GO-LIVE (THE SCHEDULED GO-LIVE for JAYWALK + THE DROP from
// today → TODAY shows 4 tickets, THE SWEEP 4 segments) → JAYWALK's ticket (orange, PLAY) → the run in the REAL JAYWALK view (MODES.daily, the
// day's seed from the server's START, the hops on the proof node) → (J3) NO STOP anywhere: the bot past 50 lanes, then the kid left to the wall
// → the END CARD shows the SERVER's lanes (the record's) + TRY AGAIN · 2 TRIES LEFT · COME BACK LATER → COME BACK LATER (nothing marked done:
// the ticket keeps TRY AGAIN · 2 TRIES LEFT) → TRY AGAIN from the ticket → a REFRESH mid-try ends it (the ticket then shows the try as the server scored it — no RESUME anywhere) → THE
// ROOM WINS on the 3rd (a host starts a game: the banner "TRY ENDED", the server's try `why: room`) → ADMITTED only now (the place line), never
// while tries remained → YOUR BEST raised from the daily (pstats b['jaywalk-solo']) → SHARE TODAY's `today { share }` inputs for JAYWALK
// (spoiler-free + J3's best-time line) → J3 THE TIME BOARDS: `every` + `today` carry the day's split board = the record's server splits
// (best per split, a tab per 50 reached) → the SCORES tab row on the real screen → the share card on the preview page with 4 sections.
//   DAILY_TEST=1 node scripts/serve.mjs <port> --emu   then   node tests/integration/e2e-jaywalk-daily-run.mjs "<browser>" [./shots-dir]   (LOOK=night | day: THE GAME LOOK)
//   J3_SHOTS=1 (+ a shots dir): J3's review shots — a second player plays all 3 tries to their END CARDS (try 1: TRY AGAIN · 2 TRIES LEFT ·
//   COME BACK LATER; try 3: ADMITTED) + the ticket between tries, at 390 × 844 + 375 × 667 → daily-endcard-try1 / -try3 / daily-ticket-between
// The two schedules are removed at the end (the server's 30 s cache: run e2e-daily BEFORE this, never right after).
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { fitChecks as sharedFit } from './kit/daily-fit.mjs';
import { dailyTestMode, DAILY_MODE_FIX } from './kit/daily-mode.mjs';
import { ref, val } from '../../api/_lib/fb.js';
import { streakDay } from '../../js/core/streak.js';
import { jwLanes } from '../../js/core/daily-best.js';

const H = await createHarness({ name: 'jaywalk-daily-run', slot: 'jr', sizes: [[375, 667], [390, 844], [430, 932]] });
const { ok, log, sleep, browser, BASE } = H;
const day = streakDay(Date.now());
const WEEK_AGO = Date.now() - 8 * 864e5;
const waitFor = (p, js, what, timeout = 20000) => p.waitForFunction(js, { timeout, polling: 100 }).catch(e => { throw new Error(`${what}: ${e.message}`); });
const ev = (p, js) => p.evaluate(js);
const api = (p, body) => p.evaluate(b => import('/js/profile/api.js').then(m => m.api('daily', b)), body);

async function openApp(slot, name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource|WebGL|GPU stall/i.test(m.text())) H.errors.push(`${name}: ${m.text()}`); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(guardUrl(`${BASE}/?emu&slot=${slot}${process.env.JW_CV != null ? `&jwcv=${process.env.JW_CV}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(process.env.JW_DAY || '') ? `&jwday=${process.env.JW_DAY}` : ''}`, 'e2e-jaywalk-daily-run'));   // (J2: JW_CV=0 — v2, with a JW_CV_SWITCH_MS=0 server)
  await page.evaluate((s, n, lk) => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'orange', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); if (lk) localStorage.setItem('ns:look', lk); }, slot, name, process.env.LOOK || '');
  await page.reload();
  await waitFor(page, `!document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem('na:${slot}:me') || 'null') || {}).pid`, `${name}: the title + a profile`, 40000);
  const pid = await page.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).pid, slot);
  return { ctx, page, pid };
}
const screen = p => p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'today' } })));
const ticket = p => p.evaluate(() => { const t = document.querySelector('.dy-ticket[data-id="jaywalk"]'); if (!t) return null; return { st: (t.className.match(/is-(waiting|progress|between|done)/) || [])[1], text: t.innerText.replace(/\s+/g, ' ').trim(), stamp: !!t.querySelector('.dy-stamp'), play: (t.querySelector('.dy-play') || {}).textContent || '', left: (t.querySelector('.dy-left') || {}).textContent || '' }; });
const rec = pid => val(`dly/jaywalk/${day}/p/${pid}`);
const closedTries = r => Object.entries((r && r.t) || {}).filter(([, x]) => x && x.e).map(([i, x]) => ({ i: Number(i), ...x }));
/** a real tap (press + lift — the house's tap watch acts on its own press + lift) */
const click = (p, sel) => p.evaluate(q => { const e = document.querySelector(q); if (!e) throw new Error(`no ${q}`); e.click(); }, sel);
const tap = async (p, sel) => { const b = await p.$(sel); if (!b) throw new Error(`no ${sel}`); await b.tap(); };
/** PLAY / TRY AGAIN on the ticket → the run, the bot on, the run playing past `ticks` */
/** JT2 — TAP TO START: the try's start line → ONE tap on the stage (a remount by TRY AGAIN starts at once: nothing to tap) */
async function startTap(p, what, before) {
  await waitFor(p, `!!window.__jwGame && (window.__jwGame.state().waiting || window.__jwGame.state().mode === 'run')`, `${what}: the start line`, 30000);
  if (!(await p.evaluate(() => window.__jwGame.state().waiting))) return;
  if (before) await before();
  // (B2 — THE TRY-3 FLAKE: one fixed tap at (195, 520) — in a room the room dock sits low and a tap could land off the stage, or before its
  //  controls were wired: the try never started (30 s). The tap goes to the STAGE's own middle and is tapped again until the run starts)
  for (let k = 0; k < 6; k++) {
    const at = await p.evaluate(() => { const e = document.querySelector('.jw-game .jw-play') || document.querySelector('.jw-game canvas.jw-canvas'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.55]; });
    await p.touchscreen.tap(...(at || [195, 520]));
    const on = await waitFor(p, `!window.__jwGame.state().waiting`, `${what}: the tap started it`, 4000).then(() => true, () => false);
    if (on) return;
  }
}
async function playTry(p, ticks, what, { before } = {}) {
  // JT2 — TAP TO START: the try waits for the FIRST tap (the course behind veiled, the try NOT spent) — a tap on the stage starts it
  await startTap(p, what, before);
  await waitFor(p, `!!window.__jwGame && window.__jwGame.state().mode === 'run' && window.__jwGame.state().proven`, `${what}: the run started (proven)`, 30000)
    .catch(async e => { log('DUMP', JSON.stringify(await p.evaluate(() => ({ g: window.__jwGame && window.__jwGame.state && (({ mode, proven, seed, t }) => ({ mode, proven, seed, t }))(window.__jwGame.state()), run: (document.querySelector('.dy-run') || {}).innerText, d: window.__daily2 && window.__daily2.state() })))); throw e; });
  await p.evaluate(() => window.__jwGame.bot(true));
  await waitFor(p, `window.__jwGame.state().t > ${ticks} || window.__jwGame.state().over`, `${what}: the run played`, 60000);
  return p.evaluate(() => window.__jwGame.state());
}

/** DAILY B — 4 TICKETS FIT → HIGH RISE DAILY B — 5 TICKETS FIT: the shared check (kit/daily-fit.mjs — also e2e-daily's) */
const fitChecks = () => sharedFit({ browser: H.browser, BASE, ok, sleep, waitFor, name: 'e2e-jaywalk-daily-run' });
const unschedule = async () => { for (const g of ['jaywalk', 'drop']) await ref(`progress/dlive/${g}`).remove().catch(() => {}); };
await H.run(async () => { await fitChecks(); try { await day1(); if (H.SHOTS && process.env.J3_SHOTS === '1') await j3Shots(); } finally { await unschedule(); } });

/** J3 — the review shots: three whole tries (the bot past a split or two, then the wall — no STOP), each end card + the ticket between */
async function j3Shots() {
  const lk = process.env.LOOK || 'night';
  const B = await openApp('jr3', 'JAYSHOT');
  await ref(`ppriv/${B.pid}/at`).set(WEEK_AGO);
  await screen(B.page);
  await waitFor(B.page, `!!document.querySelector('.dy-ticket[data-id="jaywalk"] .dy-play')`, 'J3 shots: TODAY', 20000);
  const both = async name => { for (const [w, h] of [[390, 844], [375, 667]]) { await B.page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(600); await B.page.screenshot({ path: `${H.OUT}${name}-${lk}-${w}.png` }); } await B.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await sleep(300); };
  for (let i = 0; i < 3; i++) {
    await tap(B.page, '.dy-ticket[data-id="jaywalk"] .dy-play');
    await playTry(B.page, 300, `J3 shots: try ${i + 1}`);
    await waitFor(B.page, `window.__jwGame.state().best >= ${[56, 106, 70][i]} || window.__jwGame.state().over`, `J3 shots: try ${i + 1} played`, 180000).catch(() => {});
    await B.page.evaluate(() => window.__jwGame.bot(false));
    await waitFor(B.page, `!!document.querySelector('.dy-jw-end[data-lanes]') && /LANE/.test(document.querySelector('.dy-jw-big').textContent)`, `J3 shots: end card ${i + 1}`, 90000);
    await sleep(900);
    if (i === 0) await both('daily-endcard-try1');
    if (i === 2) { await waitFor(B.page, `!!document.querySelector('.dy-jw-end .dy-stamp')`, 'J3 shots: ADMITTED', 15000); await both('daily-endcard-try3'); await tap(B.page, '.dy-jw-end .btn').catch(() => {}); break; }
    await tap(B.page, '.dy-jw-later');
    await waitFor(B.page, `!document.querySelector('.dy-run') && /TR(Y|IES) LEFT/.test((document.querySelector('.dy-ticket[data-id="jaywalk"] .dy-left') || {}).textContent || '')`, 'J3 shots: the ticket between tries', 20000);
    if (i === 0) await both('daily-ticket-between');
  }
  ok(true, `J3 shots (${lk}): the end cards + the ticket between tries saved`);
  await B.ctx.close();
}

async function day1() {
  const A = await openApp('jr1', 'JAYDAY');
  if (!(await dailyTestMode(A.page))) { console.log(`FATAL ${DAILY_MODE_FIX}`); process.exit(2); }
  await ref(`ppriv/${A.pid}/at`).set(WEEK_AGO);   // (an old member: its results COUNT — THE THROWAWAY GATE)
  // ================================================================ GROUP 5 — THE GO-LIVE: JAYWALK (+ THE DROP) scheduled from today
  for (const g of ['jaywalk', 'drop']) await ref(`progress/dlive/${g}`).set({ from: day, at: Date.now(), by: 'e2e-jaywalk-daily-run' });
  let ids = [];
  for (let i = 0; i < 45 && !(ids.includes('jaywalk') && ids.includes('drop')); i++) { ids = ((await api(A.page, { action: 'today' })).dailies || []).map(d => d.id); if (!ids.includes('jaywalk')) await sleep(1000); }
  ok(ids.includes('jaywalk') && ids.includes('drop'), `GO LIVE AT THE NEXT 4 AM (progress/dlive, liveFrom) opened JAYWALK like THE DROP: today = ${ids.join(' · ')}`);
  const live = ids.filter(id => id !== 'test');
  await screen(A.page);
  await waitFor(A.page, `document.querySelectorAll('.dy-ticket').length >= 4 && !!document.querySelector('.dy-ticket[data-id="jaywalk"] .dy-play')`, 'TODAY with JAYWALK', 20000);
  const look = await A.page.evaluate(() => ({ tickets: document.querySelectorAll('.dy-ticket').length, segs: document.querySelectorAll('.dy-seg').length, label: document.querySelector('.dy-sweep-l').textContent }));
  ok(look.tickets === ids.length && look.segs === ids.length, `TODAY: ${look.tickets} tickets, THE SWEEP ${look.segs} segments — one per live daily (${ids.length}: ${live.length} real${ids.includes('test') ? ' + THE TEST DAILY' : ''})`);
  ok(!/\bOF\b/.test(look.label), `THE SWEEP's count is the meter itself ("${look.label}")`);
  const t0 = await ticket(A.page);
  ok(t0 && t0.st === 'waiting' && /PLAY/.test(t0.play) && /JAYWALK/.test(t0.text), `JAYWALK's ticket before the first try: PLAY (${t0 && t0.text})`);
  const ink = await A.page.evaluate(() => getComputedStyle(document.querySelector('.dy-ticket[data-id="jaywalk"]')).getPropertyValue('--tk0').trim());
  ok(ink === '#ff4058', `its ink = HIGH RISE DAILY B's RED (${ink})`);
  if (H.SHOTS) await H.shotAll(A.page, 'jr-01-today-before');

  // ================================================================ TRY 1 — (J3) no STOP: the bot past 50 lanes (a split for THE TIME BOARDS), then the wall
  await tap(A.page, '.dy-ticket[data-id="jaywalk"] .dy-play');
  const s1 = await playTry(A.page, 420, 'TRY 1', { before: async () => {
    // JT2 — THE DAILY's START: the day's course DIMMED + BLURRED behind TAP TO START, the try not spent (no try opened on the server) — then,
    // after the wait, the tap opens it (its 3 · 2 · 1, its clock, THE MOTHERSHIP's 5:00 from there)
    const w = await A.page.evaluate(() => ({ s: window.__jwGame.state(), words: [...document.querySelectorAll('.jw-start > div')].map(e => e.textContent), blur: getComputedStyle(document.querySelector('.jw-play')).filter }));
    ok(w.s.waiting && w.s.veiled && /blur/.test(w.blur) && w.words[0] === 'TAP TO START' && w.words.includes('YOUR TRY STARTS AT THE TAP'), `THE DAILY's START: TAP TO START over the course dimmed + blurred (${w.blur}) — "${w.words.join(' · ')}"`);
    if (H.SHOTS) await A.page.screenshot({ path: `${H.OUT}jt2-daily-start-390.png` });
    await sleep(4000);
    const r0 = await rec(A.pid);
    ok(!(r0 && r0.n) && (await A.page.evaluate(() => window.__jwGame.state().t)) === 0, `… 4 s on it: the try NOT spent (the record: ${r0 ? JSON.stringify({ n: r0.n || 0 }) : 'none'}), nothing ticks`);
  } });
  const noStop = await A.page.evaluate(() => ({ el: !!document.querySelector('.dy-jw-stop'), btn: [...document.querySelectorAll('.dy-run button')].some(b => /STOP/.test(b.textContent)) }));
  ok(!noStop.el && !noStop.btn, 'THREE TRIES ALL DAY: no STOP element in the run (a try ends by a hit or THE MOTHERSHIP)');
  const seed1 = s1.seed;
  ok(/^d/.test(seed1) && s1.isMatch === false, `TRY 1 plays the REAL view in MODES.daily on the DAY's seed from the server's START (${seed1.slice(0, 8)}…)`);
  if (H.SHOTS) await A.page.screenshot({ path: `${H.OUT}jr-02-run.png` });
  const node1 = await val(`dly/jaywalk/${day}/w/${await ev(A.page, 'window.__arcade.state.uid')}/0`);
  // J2 — COURSE RULES v2: the SERVER picks the try's version at START (the day's — JW_CV=0 + the server's JW_CV_SWITCH_MS=0: v2) and keeps it
  // in the try record; the phone plays exactly that course
  { const V = await import('../../js/games/jaywalk/versions.js'); if (process.env.JW_CV != null) V.setCvSwitch(Number(process.env.JW_CV));
    const want = V.versionOfDay(day), r0 = await rec(A.pid);
    const tcv = r0 && r0.t && r0.t[0] ? (r0.t[0].cv || 1) : null;
    ok(s1.cv === want && (tcv == null || tcv === want), `COURSE RULES v${want}: the try's version (record ${tcv == null ? '—' : `v${tcv}`}) = the day's = the course the phone plays (v${s1.cv})`); }
  ok(node1 && node1.go > 0 && node1.c && Object.values(node1.c).every(c => typeof c.at === 'number'), `the hops go up in chunks on the proof node, each stamped by the DATABASE (${Object.keys((node1 && node1.c) || {}).length} chunks)`);
  await waitFor(A.page, `window.__jwGame.state().best >= 56 || window.__jwGame.state().over`, 'TRY 1: past 50 lanes', 120000);
  await A.page.evaluate(() => window.__jwGame.bot(false));   // (the kid left standing: the wall takes him — the try's own end, no STOP)
  await waitFor(A.page, `!!document.querySelector('.dy-jw-end[data-lanes]')`, 'TRY 1: the end card with the server\'s lanes', 90000);
  const end1 = await A.page.evaluate(() => { const c = document.querySelector('.dy-jw-end'); return { lanes: Number(c.dataset.lanes), left: Number(c.dataset.left), text: c.innerText.replace(/\s+/g, ' '), stamp: !!c.querySelector('.dy-stamp'), again: !!c.querySelector('.dy-jw-again'), later: !!c.querySelector('.dy-jw-later'), done: [...c.querySelectorAll('button')].some(b => /^\s*DONE\s*$/.test(b.textContent)) }; });
  let R = await rec(A.pid);
  const c1 = closedTries(R).find(x => x.i === 0);
  ok(c1 && end1.lanes === c1.l, `the end card shows the SERVER's lanes (${end1.lanes} = the record's ${c1 && c1.l}) — never the phone's own count`);
  ok(end1.left === 2 && end1.again && end1.later && !end1.done && /2 TRIES LEFT/.test(end1.text) && /COME BACK LATER/.test(end1.text) && !end1.stamp && !/ADMITTED/.test(end1.text), `TRY AGAIN · 2 TRIES LEFT · COME BACK LATER (no DONE) — no ADMITTED while tries remain ("${end1.text.slice(0, 110)}")`);
  if (H.SHOTS) { await sleep(500); await A.page.screenshot({ path: `${H.OUT}jr-03-end1.png` }); }   // (after the card's 0.22 s fade)

  // ================================================================ (J3) COME BACK LATER — back to the dailies, NOTHING marked done
  await tap(A.page, '.dy-jw-later');
  await waitFor(A.page, `!document.querySelector('.dy-run') && !!document.querySelector('.dy-ticket[data-id="jaywalk"]')`, 'COME BACK LATER: TODAY again', 15000);
  let tb = null;
  for (let i = 0; i < 20; i++) { tb = await ticket(A.page); if (tb && tb.st === 'between') break; await sleep(500); }
  const doneKey = await ev(A.page, `localStorage.getItem('dy:done:jaywalk')`);
  ok(tb && tb.st === 'between' && /TRY AGAIN/.test(tb.play) && /2 TRIES LEFT/.test(tb.left) && !tb.stamp && !doneKey, `COME BACK LATER marks nothing: the ticket keeps TRY AGAIN · 2 TRIES LEFT, no stamp (${tb && tb.text}; dy:done ${doneKey})`);
  if (H.SHOTS) await H.shotAll(A.page, 'jr-03b-today-between-later');

  // ================================================================ TRY 2 — A REFRESH mid-try ends it
  await tap(A.page, '.dy-ticket[data-id="jaywalk"] .dy-play');
  await startTap(A.page, 'TRY 2');   // (JT2 — TAP TO START)
  await waitFor(A.page, `!!window.__jwGame && window.__jwGame.state().mode === 'run' && window.__jwGame.state().seed !== ${JSON.stringify('x')} && window.__jwGame.state().proven && window.__jwGame.state().t < 600`, 'TRY 2 started', 30000);
  const s2 = await playTry(A.page, 300, 'TRY 2');
  // (J3: try 2 also plays on toward a split — a course where try 1's bot fell short still gives THE TIME BOARDS a time to check)
  await waitFor(A.page, `window.__jwGame.state().best >= 56 || window.__jwGame.state().over`, 'TRY 2: toward 50 lanes', 120000).catch(() => {});
  ok(s2.seed === seed1, 'TRY 2: the same course (the day\'s seed — every try, every player)');
  await A.page.reload();
  await waitFor(A.page, `!document.getElementById('boot') && !!window.__arcade`, 'the page back after the refresh', 40000);
  await screen(A.page);
  let t2 = null;
  for (let i = 0; i < 40; i++) { await A.page.evaluate(() => import('/js/daily/today.js').then(m => m.loadToday({ fresh: true }))); t2 = await ticket(A.page); if (t2 && t2.st === 'between' && /1 TRY LEFT/.test(t2.left)) break; await sleep(1000); }
  R = await rec(A.pid);
  const c2 = closedTries(R).find(x => x.i === 1);
  ok(!!c2, `the refresh ENDED try 2 (the server closed it: why ${c2 && c2.why})`);
  ok(t2 && t2.st === 'between' && /TRY AGAIN/.test(t2.play) && /1 TRY LEFT/.test(t2.left) && !t2.stamp && !/RESUME/.test(t2.text), `the ticket between tries: the last try big + DAILY BEST + TRY AGAIN · 1 TRY LEFT, no RESUME, no ADMITTED (${t2 && t2.text})`);
  ok(t2 && new RegExp(`${c2 ? c2.l : -1} LANES?`).test(t2.text) && /DAILY BEST/.test(t2.text), 'the ticket\'s big line = the LAST try (the server\'s), DAILY BEST under it');
  if (H.SHOTS) await H.shotAll(A.page, 'jr-04-today-between');

  // ================================================================ TRY 3 — THE ROOM WINS
  const Hst = await openApp('jr2', 'JAYHOST');
  const code = await Hst.page.evaluate(() => import('/js/room.js').then(async m => { const { loadProfile } = await import('/js/identity.js'); await m.createRoom(loadProfile()); return window.__arcade.state.code; }));
  await waitFor(Hst.page, `!!window.__arcade.state.code && !!window.__arcade.state.meta`, 'the host\'s room', 20000);
  await A.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: null })));
  await A.page.evaluate(c => import('/js/room.js').then(async m => { const { loadProfile } = await import('/js/identity.js'); await m.joinRoom(c, loadProfile()); }), code);
  await waitFor(A.page, `window.__arcade.state.code === ${JSON.stringify(code)} && !!window.__arcade.state.meta`, 'JAYDAY in the room', 20000);
  await screen(A.page);
  await waitFor(A.page, `!!document.querySelector('.dy-ticket[data-id="jaywalk"] .dy-play')`, 'TRY AGAIN on the ticket (in the room)', 15000);
  await click(A.page, '.dy-ticket[data-id="jaywalk"] .dy-play');   // (in a room the city's room dock sits low on the screen — the e2e-daily way)
  await playTry(A.page, 240, 'TRY 3');
  await Hst.page.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', {})));
  await waitFor(A.page, `!document.querySelector('.dy-run') && /TRY ENDED/.test((document.querySelector('.dy-banner') || {}).textContent || '')`, 'THE ROOM WINS\' banner', 20000);
  const bannerText = await ev(A.page, `document.querySelector('.dy-banner').textContent`);
  ok(bannerText.trim() === 'TRY ENDED' && !/RESUME|SAVED/.test(bannerText), `THE ROOM WINS: "${bannerText.trim()}" (none left) — no RESUME, nothing held`);
  ok(!(await ev(A.page, `JSON.parse(localStorage.getItem('daily:held') || 'null')`)), 'no HELD run (a try is never resumed)');
  if (H.SHOTS) await A.page.screenshot({ path: `${H.OUT}jr-05-banner.png` });
  let c3 = null;
  for (let i = 0; i < 30 && !c3; i++) { c3 = closedTries(await rec(A.pid)).find(x => x.i === 2) || null; if (!c3) await sleep(500); }
  ok(c3 && c3.why === 'room', `the server ended try 3 as it stood (why: ${c3 && c3.why})`);
  await A.page.evaluate(() => import('/js/room.js').then(m => m.leaveRoom && m.leaveRoom()));
  await waitFor(A.page, `!window.__arcade.state.code`, 'JAYDAY left the room', 15000).catch(() => {});

  // ================================================================ ADMITTED — only now
  await screen(A.page);
  let t3 = null;
  for (let i = 0; i < 20; i++) { await A.page.evaluate(() => import('/js/daily/today.js').then(m => m.loadToday({ fresh: true }))); t3 = await ticket(A.page); if (t3 && t3.st === 'done') break; await sleep(500); }
  R = await rec(A.pid);
  const best = Math.max(...closedTries(R).map(x => x.l));
  ok(t3 && t3.st === 'done' && t3.stamp && new RegExp(`${best} LANES?`).test(t3.text), `ADMITTED once no try is left: the BEST try (${best} lanes) + the stamp (${t3 && t3.text})`);
  ok(t3 && /(\d+(ST|ND|RD|TH) OF \d+ PLAYERS?|NEW DAILY BEST|DONE FOR TODAY)/.test(t3.text), 'the place line (or the gold NEW DAILY BEST) under it');
  if (H.SHOTS) await H.shotAll(A.page, 'jr-06-today-admitted');

  // ================================================================ YOUR BEST + the cards' path: the SERVER's replay of a daily try
  const yb = await val(`pstats/${A.pid}/b/jaywalk-solo`);
  ok(yb && yb.a === best, `YOUR BEST raised by the daily (pstats b['jaywalk-solo'].a = ${yb && yb.a} = the best try's ${best})`);
  const feats = closedTries(R).map(x => x.f || '').filter(Boolean);
  const gf = (await val(`pstats/${A.pid}/pa/gf`)) || {};
  ok(feats.every(f => f.split(' ').every(k => gf[`jaywalk-${k}`])), `every feat a try earned is a card flag (${feats.join(' | ') || 'none this time'})`);

  // ================================================================ SHARE TODAY — JAYWALK's spoiler-free inputs + the card
  const sh = await api(A.page, { action: 'today', share: true });
  const J = sh.share && sh.share.jaywalk;
  ok(J && Array.isArray(J.t) && J.t.length === 3 && J.t.every(v => v === null || Number.isInteger(v)) && Object.keys(J).every(k => ['t', 'b', 'nb', 'day', 'hs'].includes(k)), `SHARE TODAY's JAYWALK inputs: ${JSON.stringify(J)} — the tries' lanes (+ J3's best-time split) only, never the course`);
  // ================================================================ J3 — THE TIME BOARDS: the day's split board = the record's server splits
  { const { dayFromTries } = await import('../../js/core/jw-times.js');
    const want = dayFromTries(closedTries(R));
    const board = await val(`dly/jaywalk/${day}/sp/${A.pid}`);
    if (!want.length) {
      // (the bot fell short of 50 on every try of this course: no split → no row on the board, no best-time line — checked, the rest skipped)
      ok(board == null && !(J && J.hs), `no try reached 50 on this course: no board row (${JSON.stringify(board)}), no best-time line — the time-board checks skipped`);
    } else {
    ok(want.length >= 1 && JSON.stringify(board) === JSON.stringify(want), `THE DAY's SPLIT BOARD = the best per split of the closed tries' SERVER splits (${JSON.stringify(board)} = ${JSON.stringify(want)})`);
    ok(J && J.hs && J.hs.at === want.length * 50 && J.hs.t === want[want.length - 1], `the share card's best-time line: TO ${J && J.hs && J.hs.at} (the highest 50 reached, its best tick ${J && J.hs && J.hs.t})`);
    const E = (await api(A.page, { action: 'every' })).every.jaywalk;
    const T = E && E.times;
    // (the day's board holds everyone's runs: the tabs run 50 … the farthest anyone counted reached — yours among them, never a gap)
    ok(T && T.tabs.every((l, i) => l === (i + 1) * 50) && T.tabs.length >= want.length, `EVERYONE · TODAY: a tab per 50 reached (50 … the farthest) — ${T && T.tabs.join(' · ')}`);
    const r50 = T && T.b[50] && (T.b[50].rows.find(r => r.me) || T.b[50].me);
    ok(r50 && r50.t === want[0] && r50.rank >= 1, `… your time to 50 = the server's (${r50 && r50.t} ticks, place ${r50 && r50.rank})`);
    const TT = (await api(A.page, { action: 'today' })).jt;
    ok(TT && TT.jaywalk && TT.jaywalk.tabs.length === want.length && TT.jaywalk.b[50].list.some(r => r.k === A.pid && r.t === want[0]), 'YOUR TABLE · TODAY (`today`\'s jt) carries the same split for you');
    ok(jwLanes(sh.mine.jaywalk) === best, 'the time boards never changed the lanes result');
    // the SCORES screen: the tab row (MOST LANES first) → FASTEST TO 50 → a time row
    await A.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
    await waitFor(A.page, `!!document.querySelector('.dy-sec[data-id="jaywalk"] .dy-ttabs')`, 'SCORES: JAYWALK\'s tab row', 20000);
    const tabs = await A.page.evaluate(() => [...document.querySelectorAll('.dy-sec[data-id="jaywalk"] .dy-ttabs .nt-tab')].map(b => ({ t: b.textContent, on: b.classList.contains('is-on'), h: b.getBoundingClientRect().height })));
    ok(tabs[0] && tabs[0].t === 'MOST LANES' && tabs[0].on && (tabs[1] || {}).t === 'FASTEST TO 50' && tabs.every(b => b.h >= 44), `the tabs: ${tabs.map(b => b.t).join(' · ')} — MOST LANES lit first, each ≥ 44 px tall`);
    await tap(A.page, '.dy-sec[data-id="jaywalk"] .dy-ttabs .nt-tab[data-v="50"]');
    await waitFor(A.page, `!!document.querySelector('.dy-sec[data-id="jaywalk"] .dy-times .dy-time')`, 'FASTEST TO 50: the time rows', 15000);
    const tr = await A.page.evaluate(() => [...document.querySelectorAll('.dy-sec[data-id="jaywalk"] .dy-times .dy-time')].map(e => e.textContent));
    const { timeClock } = await import('../../js/core/jw-time-text.js');
    ok(tr.includes(timeClock(want[0])), `FASTEST TO 50 lists your time ${timeClock(want[0])} (${tr.join(' · ')})`);
    if (H.SHOTS) await H.shotAll(A.page, 'jr-06b-scores-to50');
    await screen(A.page); } }
  ok(J && J.t[J.b] === best && jwLanes(sh.mine.jaywalk) === best, 'its best bar = the day\'s result');
  for (const lk of ['night', 'day']) {
    const pv = await H.browser.newPage();
    await pv.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    await pv.goto(guardUrl(`${BASE}/tests/integration/daily-preview.html?view=share&state=swept&drop=1&dropst=done&jw=done&look=${lk}`, 'e2e-jaywalk-daily-run'));
    await waitFor(pv, `document.body.dataset.ready === '1' && !!window.__share`, `the share card (${lk})`, 30000);
    const secs = await pv.evaluate(() => window.__share.sections.map(s => s.id));
    const sc = await pv.evaluate(() => [...new Set(window.__share.sections.map(s => s.s.toFixed(4)))]);
    ok(sc.length === 1, `… every section at the SAME scale (${sc.join(', ')})`);
    ok(secs.join(',') === 'password,coastclear,drop,jaywalk', `SHARE TODAY (${lk}): 4 sections, evenly scaled — ${secs.join(' · ')}`);
    if (H.SHOTS) await pv.screenshot({ path: `${H.OUT}jr-07-share-${lk}.png` });
    await pv.close();
  }
  await Hst.ctx.close();
  await A.ctx.close();
}
