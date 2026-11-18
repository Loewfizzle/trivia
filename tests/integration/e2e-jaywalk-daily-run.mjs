// DAILY B — JAYWALK's DAILY on the REAL screens, end to end on the emulators: THE GO-LIVE (THE SCHEDULED GO-LIVE for JAYWALK + THE DROP from
// today → TODAY shows 4 tickets, THE SWEEP 4 segments) → JAYWALK's ticket (orange, PLAY) → the run in the REAL JAYWALK view (MODES.daily, the
// day's seed from the server's START, the hops on the proof node) → STOP (a second tap) → the END CARD shows the SERVER's lanes (the record's)
// → TRY AGAIN (2 TRIES LEFT) → a REFRESH mid-try ends it (the ticket then shows the try as the server scored it — no RESUME anywhere) → THE
// ROOM WINS on the 3rd (a host starts a game: the banner "TRY ENDED", the server's try `why: room`) → ADMITTED only now (the place line), never
// while tries remained → YOUR BEST raised from the daily (pstats b['jaywalk-solo']) → SHARE TODAY's `today { share }` inputs for JAYWALK
// (spoiler-free) → the share card on the preview page with 4 sections (night + day, full + a 360-px downscale).
//   DAILY_TEST=1 node scripts/serve.mjs <port> --emu   then   node tests/integration/e2e-jaywalk-daily-run.mjs "<browser>" [./shots-dir]
// The two schedules are removed at the end (the server's 30 s cache: run e2e-daily BEFORE this, never right after).
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
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
  await page.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-jaywalk-daily-run'));
  await page.evaluate((s, n) => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'orange', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, slot, name);
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
async function playTry(p, ticks, what) {
  await waitFor(p, `!!window.__jwGame && window.__jwGame.state().mode === 'run' && window.__jwGame.state().proven`, `${what}: the run started (proven)`, 30000)
    .catch(async e => { log('DUMP', JSON.stringify(await p.evaluate(() => ({ g: window.__jwGame && window.__jwGame.state && (({ mode, proven, seed, t }) => ({ mode, proven, seed, t }))(window.__jwGame.state()), run: (document.querySelector('.dy-run') || {}).innerText, d: window.__daily2 && window.__daily2.state() })))); throw e; });
  await p.evaluate(() => window.__jwGame.bot(true));
  await waitFor(p, `window.__jwGame.state().t > ${ticks} || window.__jwGame.state().over`, `${what}: the run played`, 60000);
  return p.evaluate(() => window.__jwGame.state());
}

/** DAILY B — 4 TICKETS FIT: the preview page (the REAL screen, scripted `today`) at the three phones, both looks, every ticket state: the
 *  header + THE SWEEP + all 4 tickets on screen (the last ticket's bottom inside the viewport), no name / line clipped */
async function fitChecks() {
  const pv = await H.browser.newPage();
  const states = ['state=waiting&drop=1&jw=before&best=1', 'state=one&drop=1&jw=between&best=1', 'state=swept&drop=1&dropst=done&jw=done', 'state=swept&drop=1&dropst=done&jw=gold&gold=password'];
  for (const [w, h] of [[375, 667], [390, 844], [430, 932]]) for (const lk of ['night', 'day']) for (const q of states) {
    await pv.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await pv.goto(guardUrl(`${BASE}/tests/integration/daily-preview.html?${q}&look=${lk}`, 'e2e-jaywalk-daily-run'));
    await waitFor(pv, `document.body.dataset.ready === '1' && document.querySelectorAll('.dy-ticket').length === 4`, `the preview ${q}`, 20000);
    await sleep(120);
    const f = await pv.evaluate(() => {
      const ts = [...document.querySelectorAll('.dy-ticket')], last = ts[ts.length - 1].getBoundingClientRect(), head = document.querySelector('.dy-sign').getBoundingClientRect(), meter = document.querySelector('.dy-sweep').getBoundingClientRect();
      const clipped = [...document.querySelectorAll('.dy-ticket .dy-name, .dy-ticket .dy-nw, .dy-ticket .dy-result')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
      return { bottom: Math.round(last.bottom), H: innerHeight, head: Math.round(head.top), meter: Math.round(meter.top), segs: document.querySelectorAll('.dy-seg').length, clipped };
    });
    ok(f.bottom <= f.H && f.head >= 0 && f.meter > f.head && f.segs === 4 && !f.clipped.length, `FIT ${w}x${h} ${lk} ${q.replace(/state=|&drop=1|&dropst=done/g, '')}: the 4th ticket ends at ${f.bottom} of ${f.H}, header + THE SWEEP (4) above${f.clipped.length ? ` — CLIPPED ${f.clipped.join(' | ')}` : ''}`);
  }
  await pv.close();
}
const unschedule = async () => { for (const g of ['jaywalk', 'drop']) await ref(`progress/dlive/${g}`).remove().catch(() => {}); };
await H.run(async () => { await fitChecks(); try { await day1(); } finally { await unschedule(); } });

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
  ok(ink === '#ffa53a', `its ink = the owner's orange (${ink})`);
  if (H.SHOTS) await H.shotAll(A.page, 'jr-01-today-before');

  // ================================================================ TRY 1 — STOP
  await tap(A.page, '.dy-ticket[data-id="jaywalk"] .dy-play');
  const s1 = await playTry(A.page, 420, 'TRY 1');
  const seed1 = s1.seed;
  ok(/^d/.test(seed1) && s1.isMatch === false, `TRY 1 plays the REAL view in MODES.daily on the DAY's seed from the server's START (${seed1.slice(0, 8)}…)`);
  if (H.SHOTS) await A.page.screenshot({ path: `${H.OUT}jr-02-run.png` });
  const node1 = await val(`dly/jaywalk/${day}/w/${await ev(A.page, 'window.__arcade.state.uid')}/0`);
  ok(node1 && node1.go > 0 && node1.c && Object.values(node1.c).every(c => typeof c.at === 'number'), `the hops go up in chunks on the proof node, each stamped by the DATABASE (${Object.keys((node1 && node1.c) || {}).length} chunks)`);
  let stopped = false;
  if (!s1.over) {
    await tap(A.page, '.dy-jw-stop');
    await sleep(150);
    const armed = await A.page.evaluate(() => (document.querySelector('.dy-jw-stop') || {}).textContent || '');
    ok(/TAP AGAIN/.test(armed), `STOP asks for a second tap ("${armed.trim()}") — a mis-tap never costs a try`);
    await tap(A.page, '.dy-jw-stop');
    stopped = true;
  }
  await waitFor(A.page, `!!document.querySelector('.dy-jw-end[data-lanes]')`, 'TRY 1: the end card with the server\'s lanes', 30000);
  const end1 = await A.page.evaluate(() => { const c = document.querySelector('.dy-jw-end'); return { lanes: Number(c.dataset.lanes), left: Number(c.dataset.left), text: c.innerText.replace(/\s+/g, ' '), stamp: !!c.querySelector('.dy-stamp'), again: !!c.querySelector('.dy-jw-again') }; });
  let R = await rec(A.pid);
  const c1 = closedTries(R).find(x => x.i === 0);
  ok(c1 && end1.lanes === c1.l, `the end card shows the SERVER's lanes (${end1.lanes} = the record's ${c1 && c1.l}) — never the phone's own count${stopped ? ' (STOPPED early: it counts as played)' : ''}`);
  ok(end1.left === 2 && end1.again && /2 TRIES LEFT/.test(end1.text) && !end1.stamp && !/ADMITTED/.test(end1.text), `TRY AGAIN · 2 TRIES LEFT · DONE — no ADMITTED while tries remain ("${end1.text.slice(0, 90)}")`);
  if (H.SHOTS) { await sleep(500); await A.page.screenshot({ path: `${H.OUT}jr-03-end1.png` }); }   // (after the card's 0.22 s fade)

  // ================================================================ TRY 2 — A REFRESH mid-try ends it
  await tap(A.page, '.dy-jw-again');
  await waitFor(A.page, `!!window.__jwGame && window.__jwGame.state().mode === 'run' && window.__jwGame.state().seed !== ${JSON.stringify('x')} && window.__jwGame.state().proven && window.__jwGame.state().t < 600`, 'TRY 2 started', 30000);
  const s2 = await playTry(A.page, 300, 'TRY 2');
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
  ok(J && Array.isArray(J.t) && J.t.length === 3 && J.t.every(v => v === null || Number.isInteger(v)) && Object.keys(J).every(k => ['t', 'b', 'nb', 'day'].includes(k)), `SHARE TODAY's JAYWALK inputs: ${JSON.stringify(J)} — the tries' lanes only, never the course`);
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
