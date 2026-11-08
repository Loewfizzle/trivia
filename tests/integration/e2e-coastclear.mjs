// COAST CLEAR — the daily end to end (CC1 — docs/coastclear.md; the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`):
//   E2E_BASE=http://localhost:<port> node e2e-coastclear.mjs "<browser>" ./shots-coastclear      (env SHOTS=0; FAST=1 = the same path)
// The REAL view (coastclear-daily.html) with THE API JUDGE against the REAL /api/daily: start (the opening, no pills, no glyphs) → a dig (the
// number from the server) → a flood (the whole calm area in one answer) → buoys by long-press + a CHORD → a SPOT (+30 s, the lamp lit, play goes
// on) → a REFRESH mid-run resumes (the cells, the light, the buoys) → a PAUSE (THE DAILY MODULE's call) + the screen torn down + rebuilt (the
// view resumes the clock) → every safe cell → COAST CLEAR + the server's score (= its replay) → ONE TRY (a reload lands on the end). A second
// phone on a 150 ms line: the tap's press still instant, the answers pipelined → three lights → CAUGHT. Every /api answer checked: no cell named
// that the record hasn't opened. THE NUMBERS: the dig round trip (p50 / p95) on the emulators + with 150 ms added, the calls + the record's size.
// CC2: THE SWEEP (a beam lands on the light — a tap during it still works; the lamp + the clock jump when it lands) · LOOK FLIPS mid-dig, mid-flood,
// mid-sweep + on the end screen (nothing resets) · THE WIN (COAST CLEAR, the sign steps aside, one big time, the line, the shrunk harbor with
// every light, SHARE, NEXT HARBOR IN; the board + the switch gone) · RESUME onto the end screen · CAUGHT (three beams converge, no big time) ·
// the lights REVEALED only once a run is over · the share's inputs (no board) + the 1080 × 1350 image · 60 fps through the sweep, the catch +
// the lighthouse (the preview page — real frame timing, also at 4× CPU).
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { buildBoard, unpackBoard } from '../../api/_lib/cc-board.js';
import { dailySecret } from '../../api/_lib/daily-secret.js';
import { countsOf, nbOf, runView, replay, safeCount } from '../../js/games/coastclear/logic.js';
import { streakDay } from '../../js/core/streak.js';

const H = await createHarness({ name: 'coastclear', slot: 'cc', sizes: [[390, 844], [402, 874], [430, 932]] });
const { log, sleep, ok, shotAll, BASE, browser } = H;
const day = streakDay(Date.now());
const board = buildBoard(day, await dailySecret(day)).board;   // (DM1 ADD-ON: THE DAILY SECRET — never the pepper)
const counts = countsOf(board), L = new Set(board.lights), NB = nbOf(board.w, board.h);
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null; };

const answers = [];   // every /api/daily answer the phones got: { name, body, req }
const rttA = [];      // ALICE's round trips, gathered before each reload / tear-down (a mount starts its own list)
const grab = async page => { rttA.push(...(await page.evaluate(() => window.__coastclear ? window.__coastclear.rtts() : []))); };
const openPhone = async (slot, name, { latency = 0 } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource/i.test(m.text())) H.errors.push(`${name}: ${m.text()}`); });
  page.on('response', async r => { if (r.url().endsWith('/api/daily') && r.request().method() === 'POST') { try { answers.push({ name, body: await r.json(), req: JSON.parse(r.request().postData() || '{}') }); } catch { /* fine */ } } });
  await page.setViewport(H.VIEW);
  if (latency) { const cdp = await page.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency, downloadThroughput: -1, uploadThroughput: -1 }); }
  await page.goto(guardUrl(`${BASE}/tests/integration/coastclear-daily.html?emu&slot=${slot}&name=${name}`, 'e2e-coastclear'));
  await ready(page);
  return page;
};
const ready = page => page.waitForFunction(() => document.body.dataset.ready === '1' && window.__coastclear && window.__coastclear.ready(), { timeout: 30000 });
const S = page => page.evaluate(() => window.__coastclear.state());
const V = page => page.evaluate(() => window.__coastclear.view());
const cellSel = i => `.cc-cell[data-i="${i}"]`;
const tap = (page, i) => page.click(cellSel(i));
const longPress = async (page, i) => { const b = await (await page.$(cellSel(i))).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await sleep(520); await page.mouse.up(); };
const idle = page => page.waitForFunction(() => window.__coastclear.state().pending === 0 && window.__coastclear.state().inflight === 0, { timeout: 20000 });
/** CC2 — every beam landed + gone (a spot's sweep is ~0.7 s + its hold / fade) */
const calm = page => page.waitForFunction(() => window.__coastclear.state().landing === 0 && window.__coastclear.state().beams === 0, { timeout: 10000 });
/** CC2 — flip the look (the console sets body[data-look]) and wait for the REAL end of the crossfade (the look's painted layer fully in, no CSS
 *  transition still running inside the screen) — never a fixed sleep (CC2 Group 0) */
const flipLook = async (page, look) => {
  await page.evaluate(l => { document.body.dataset.look = l; }, look);
  await page.waitForFunction(l => document.body.dataset.look === l && getComputedStyle(document.querySelector('.cc-screen'), '::after').opacity === (l === 'day' ? '1' : '0'), { timeout: 5000, polling: 'raf' }, look);
  await page.waitForFunction(() => { const scr = document.querySelector('.cc-screen'); return !document.getAnimations().some(a => a.constructor.name === 'CSSTransition' && a.playState === 'running' && (!a.effect || !a.effect.target || scr.contains(a.effect.target))); }, { timeout: 5000, polling: 'raf' });
};
const cellLook = (page, i) => page.$eval(`.cc-cell[data-i="${i}"]`, e => getComputedStyle(e).backgroundImage + '|' + getComputedStyle(e).boxShadow);
/** real frame timing in a page for ms (rAF intervals): fps, p95, frames over 25 ms */
const frames = (page, ms) => page.evaluate(ms => new Promise(res => { const t = []; let last = performance.now(); const t0 = last; const f = now => { t.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else { const s = t.slice(1).sort((a, b) => a - b); res({ fps: Math.round(10 * (t.length - 1) / ((now - t0) / 1000)) / 10, p95: Math.round(10 * s[Math.floor(s.length * 0.95)]) / 10, long: s.filter(x => x > 25).length }); } }; requestAnimationFrame(f); }), ms);
const openSet = v => new Set(v.open.map(c => c[0]));
const pidOf = page => page.evaluate(() => window.__daily.pid);
/** CC2 — the sounds that actually STARTED on the audio context (js/games/coastclear/sfx.js#ccSfxPlayed — after the console's unlock-on-tap) */
const played = page => page.evaluate(() => import('/js/games/coastclear/sfx.js').then(m => m.ccSfxPlayed().map(x => x.name)));
const recOf = async page => val(`dly/coastclear/${day}/p/${await pidOf(page)}`);

await H.run(async () => {
  await ref(`dly/coastclear/${day}`).remove();   // a fresh day on the emulator (the board itself is the pepper's: rebuilt the same)
  const p = await openPhone('cc0', 'ALICE');
  // ---- START: the opening only; plain type + drawn objects (no pills, no glyph icons, no emoji, no dev text)
  let v = await V(p);
  ok(v.open.length === board.open.length && v.open.every(([c, n]) => counts[c] === n) && v.lit.length === 0, `START: the pre-opened safe area exactly (${v.open.length} cells, every number the server's), nothing else`);
  const look = await p.evaluate(() => ({
    pill: [...document.querySelectorAll('.cc-screen *')].some(e => parseFloat(getComputedStyle(e).borderRadius) >= 100),
    glyph: /[⌫✓✕]|\p{Extended_Pictographic}/u.test(document.querySelector('.cc-screen').innerText),
    text: document.querySelector('.cc-screen').innerText.replace(/\s+/g, ' ').trim(),
    lamps: document.querySelectorAll('.cc-spot svg, svg.cc-spot').length, buoy: !!document.querySelector('.cc-st-buoy'), mode: document.querySelector('.cc-mode-b.is-on').dataset.m,
    cell: document.querySelector('.cc-cell').getBoundingClientRect().width,
  }));
  ok(!look.pill && !look.glyph && look.lamps === 3 && look.buoy && look.mode === 'dig' && !/undefined|null|NaN|error/i.test(look.text), `the screen: three drawn searchlights, a drawn buoy, DIG on — no capsule, no glyph icon, no dev text ("${look.text.slice(0, 60)}…")`);
  ok(look.cell >= 36 && look.cell <= 40, `the cells ~38 pt at 390 wide (${look.cell.toFixed(1)})`);
  await shotAll(p, 'cc-01-opening');

  // ---- a DIG: a numbered cell beside the opening → its number from the server
  const opening = new Set(board.open);
  const num = [...Array(108).keys()].find(i => !opening.has(i) && counts[i] > 0 && NB[i].some(j => opening.has(j)));
  const pressNow = await p.evaluate(sel => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4, pointerId: 3, button: 0 })); const now = el.classList.contains('is-press'); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4, pointerId: 3, button: 0 })); return now; }, cellSel(num));
  await idle(p);
  v = await V(p);
  ok(pressNow && openSet(v).has(num) && new Map(v.open).get(num) === counts[num], `a DIG: the tile pressed in the same event, the number (${counts[num]}) from the server`);
  // CC2 — THE LOOK FLIP mid-dig: the tap fires, the look flips while it's in flight → the answer still lands, the tile re-themes, the switch kept
  {
    const nxt = [...Array(108).keys()].find(i => !openSet(v).has(i) && !L.has(i) && counts[i] > 0 && NB[i].some(j => openSet(v).has(j)));
    const night = await cellLook(p, nxt);
    const fired = await p.evaluate(i => { window.__coastclear.tap(i); return window.__coastclear.state().pending; }, nxt);
    await flipLook(p, 'day');
    await idle(p);
    const day = await cellLook(p, nxt);
    const vv = await V(p);
    ok(fired === 1 && new Map(vv.open).get(nxt) === counts[nxt] && day !== night && (await S(p)).mode === 'dig', 'LOOK FLIP mid-dig → DAY: the dig in flight still landed (its number), the cells re-themed, the switch kept on DIG');
    await flipLook(p, 'night');
    v = vv;
  }

  // ---- a FLOOD: a 0 outside what's open → its whole calm area in ONE answer
  const zero = [...Array(108).keys()].find(i => !openSet(v).has(i) && counts[i] === 0);
  if (zero != null) {
    const n0 = answers.length;
    const clockF = await p.evaluate(() => window.__coastclear.state().clock);
    await tap(p, zero);
    await flipLook(p, 'day');                         // CC2 — THE LOOK FLIP mid-flood (the dig in flight / the ripple running)
    await idle(p);
    v = await V(p);
    const a = answers.slice(n0).find(x => x.req.action === 'dig' && x.req.cell === zero);
    ok(a && a.body.cells.length > 1 && a.body.cells.every(([c]) => openSet(v).has(c)), `a FLOOD: the 0 opened ${a && a.body.cells.length} cells in one answer`);
    const secs0 = t => t.split(':').reduce((m, x) => m * 60 + Number(x), 0);
    ok(await p.$eval(cellSel(zero), e => e.classList.contains('is-open')) && secs0(await p.evaluate(() => window.__coastclear.state().clock)) >= secs0(clockF), 'LOOK FLIP mid-flood → DAY: the flood still opened, the clock carried on (nothing reset)');
    await shotAll(p, 'cc-01b-day', [[390, 844]]);
    await flipLook(p, 'night');
  } else log('(no 0 left outside the opening on today\'s board)');

  // ---- BUOYS (long-press) + a CHORD: an open number with exactly its lights buoyed → its other neighbours open
  v = await V(p);
  let chorded = false;
  for (const [c, n] of v.open) {
    if (n <= 0) continue;
    const unk = NB[c].filter(j => !openSet(v).has(j));
    const lights = unk.filter(j => L.has(j)), safe = unk.filter(j => !L.has(j));
    if (!lights.length || !safe.length || lights.length !== n) continue;
    for (const j of lights) await longPress(p, j);
    const bu = await p.evaluate(() => window.__coastclear.buoys());
    ok(lights.every(j => bu.includes(j)) && (await S(p)).pending === 0, `BUOYS by long-press: ${lights.length} placed on the phone (no server call)`);
    const n0 = answers.length;
    await tap(p, c); await idle(p);
    v = await V(p);
    const a = answers.slice(n0).find(x => x.req.action === 'chord');
    ok(a && safe.every(j => openSet(v).has(j)) && a.body.lit.length === 0, `a CHORD on the ${n}: ${safe.length} neighbour(s) opened in one call`);
    chorded = true;
    break;
  }
  ok(chorded, 'a chordable number was found on today\'s board');
  // CC2 — the switch's click (trusted taps on the two halves)
  await p.click('.cc-mode-b[data-m="buoy"]'); await p.click('.cc-mode-b[data-m="dig"]');

  // ---- a SPOT: dig a light → +30 s, the lamp lit, the light stays, play goes on
  const clock0 = await p.evaluate(() => window.__coastclear.state().clock);
  v = await V(p);
  const bu0 = new Set(await p.evaluate(() => window.__coastclear.buoys()));
  const light = board.lights.find(c => !bu0.has(c));
  // CC2 — THE SWEEP: the beam is in the air (the cell not lit yet, the lamp + the clock not jumped), a tap DURING it still works, a look flip mid-sweep
  // changes nothing; then it lands: the cell lit, one lamp, +30 s
  await tap(p, light);
  await p.waitForFunction(() => window.__coastclear.state().beams > 0, { timeout: 5000 });
  const mid = await p.evaluate(sel => ({ lit: document.querySelector(sel).classList.contains('is-lit'), lamps: document.querySelectorAll('.cc-spot.is-on').length, st: window.__coastclear.state() }), cellSel(light));
  const openNow = openSet(await V(p));
  const during = [...Array(108).keys()].find(i => !L.has(i) && !openNow.has(i) && !bu0.has(i));
  if (during != null) await p.evaluate(i => window.__coastclear.tap(i), during);
  await flipLook(p, 'day');
  await calm(p); await idle(p);
  const s1 = await S(p);
  ok(!mid.lit && mid.lamps === 0 && mid.st.spots === 1 && mid.st.shown === 0, 'THE SWEEP: the beam in the air — the light not painted yet, no lamp lit, the clock not jumped (the server already counted it)');
  ok(during == null || openSet(await V(p)).has(during), 'a tap DURING the sweep still dug (play never stops)');
  ok(s1.spots === 1 && s1.shown === 1 && s1.beams === 0, 'a LOOK FLIP mid-sweep: the beam still landed (one lamp lit, the spot counted)');
  await shotAll(p, 'cc-02b-spotted-day', [[390, 844]]);
  const snd = await played(p);
  ok(['dig', 'flood', 'buoy', 'mode', 'spotted'].every(n => snd.includes(n)), `THE SOUNDS start on the audio context after the first tap's unlock: ${[...new Set(snd)].join(' · ')}`);
  await flipLook(p, 'night');
  const secs = t => t.split(':').reduce((m, x) => m * 60 + Number(x), 0);
  ok(s1.spots === 1 && !s1.done && (await p.$eval(cellSel(light), e => e.classList.contains('is-lit'))) && (await p.$$eval('.cc-spot.is-on', e => e.length)) === 1 && secs(s1.clock) - secs(clock0) >= 30,
    `SPOTTED: one lamp lit, the light stays in its cell, the clock +30 s (${clock0} → ${s1.clock}), play goes on`);
  await shotAll(p, 'cc-02-spotted', [[390, 844]]);

  // ---- a REFRESH mid-run resumes: the cells, the light, the buoys (the phone's own, kept)
  const before = await V(p), buB = (await p.evaluate(() => window.__coastclear.buoys())).sort();
  await grab(p);
  await p.reload(); await ready(p);
  const after = await V(p), buA = (await p.evaluate(() => window.__coastclear.buoys())).sort();
  ok(after.open.length === before.open.length && after.lit.join() === before.lit.join() && after.spots === 1 && buA.join() === buB.join(), `REFRESH → the run resumes from the server (${after.open.length} cells, 1 light) + the buoys come back`);

  // ---- a PAUSE (THE DAILY MODULE calls it when the room starts a game) + the screen torn down → rebuilt: the clock goes on by itself
  // (DM1 — THE ROOM WINS: the server pauses only for a room that really started a game, with this phone in it)
  const pUid = await p.evaluate(() => window.__daily.uid);
  // (DFIX2 — THE ROOM WINS needs 2+ players: a second player in the room, else a room of one can't stop the clock)
  await ref('rooms/CCEE').set({ meta: { hostId: pUid, status: 'playing', createdAt: Date.now() }, players: { [pUid]: { name: 'ALICE', pid: await pidOf(p) }, 'cc-e2e-bob': { name: 'BOB' } } });
  await p.evaluate(() => window.__api({ action: 'pause', room: 'CCEE' }));
  await grab(p);
  await p.evaluate(() => window.__suspend());
  await sleep(2500);
  const recP = await recOf(p);
  ok(recP.p && recP.p.n === 1 && recP.p.at, 'PAUSED on the server (the clock stopped)');
  await p.evaluate(() => window.__resume());
  await ready(p);
  await p.waitForFunction(() => !window.__coastclear.state().paused, { timeout: 10000 });
  const recR = await recOf(p);
  ok(recR.p.n === 1 && recR.p.at == null && recR.p.ms >= 2400 && (await S(p)).pauses === 1, `RESUMED by the screen coming back: the pause closed on the server (${recR.p.ms} ms stopped, +15 s)`);

  // ---- every safe cell (taps fired fast — pipelined) → COAST CLEAR + the server's score
  for (let round = 0; round < 4; round++) {
    v = await V(p);
    const left = [...Array(108).keys()].filter(i => !L.has(i) && !openSet(v).has(i));
    if (!left.length) break;
    const bu = new Set(await p.evaluate(() => window.__coastclear.buoys()));
    for (const i of left) { if (bu.has(i)) await longPress(p, i); await tap(p, i); }
    await idle(p);
  }
  await p.waitForFunction(() => window.__coastclear.state().end, { timeout: 15000 });
  await p.waitForFunction(() => window.__coastclear.finished() === 'RECORDED', { timeout: 15000 });
  const fin = await recOf(p), rep = replay(fin, board);
  const score = await p.evaluate(() => window.__coastclear.score());
  const endOf = page => page.evaluate(() => ({
    t: document.querySelector('.cc-end-t').textContent, n: (document.querySelector('.cc-end-n') || {}).textContent, line: document.querySelector('.cc-end-line').textContent,
    buoys: window.__coastclear.buoys().length, text: document.querySelector('.cc-screen').innerText,
    gone: !document.querySelector('.cc-play:not([hidden])') && !document.querySelector('.cc-mode:not([hidden])'),
    sign: getComputedStyle(document.querySelector('.cc-sign')).opacity, lh: !!document.querySelector('.cc-lh-beam'),
    map: [...document.querySelectorAll('.cc-mc')].map(c => c.className.replace('cc-mc ', '')),
    share: !!document.querySelector('.btn.cc-share.btn-primary'), next: document.querySelector('.cc-end-next').textContent,
    still: document.querySelector('.cc-end').classList.contains('is-still'),
    pill: [...document.querySelectorAll('.cc-screen *')].some(e => parseFloat(getComputedStyle(e).borderRadius) >= 100 && e.getBoundingClientRect().width > e.getBoundingClientRect().height * 1.6),
    top: document.querySelector('.cc-end-t').getBoundingClientRect().top, foot: innerHeight - document.querySelector('.cc-end-actions').getBoundingClientRect().bottom,
  }));
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.cc-sign')).opacity === '0', { timeout: 5000 }).catch(() => {});   // (the sign's 0.35 s step aside)
  const end = await endOf(p);
  ok(fin.o === 'clear' && rep && score === rep.score && end.t === 'COAST CLEAR' && end.line === '1 SPOTTED · +30 s · 1 PAUSE · +15 s' && end.n === `${Math.floor(score / 60)}:${String(score % 60).padStart(2, '0')}`, `COAST CLEAR: the server's score ${score} = its replay = the big time (${end.n}) — "${end.line}"`);
  ok(end.gone && end.sign === '0' && end.lh && end.share && /^NEXT HARBOR IN \d+:\d\d:\d\d$/.test(end.next) && !end.pill, `THE WIN SCREEN: the board + the switch gone, the top sign stepped aside (the name once), the lighthouse beam, SHARE, ${end.next} — no capsule${end.gone && end.sign === '0' && end.lh && end.share && !end.pill ? '' : ` [${JSON.stringify({ gone: end.gone, sign: end.sign, lh: end.lh, share: end.share, pill: end.pill })}]`}`);
  const kinds = k => end.map.filter(c => c.includes(`is-${k}`)).length;
  ok(end.map.length === 108 && kinds('spot') === 1 && kinds('buoy') === 17 && kinds('open') === 108 - 18 && end.buoys === 17 && !/null|undefined/.test(end.text), `THE FINISHED HARBOR shrunk: 90 open (numbers), 1 gold light, 17 buoys — every light shown (deduced on a clear)`);
  ok(end.top < 160 && end.foot > 20, `never top-heavy: the headline ${Math.round(end.top)} pt from the top, the leftover space at the foot (${Math.round(end.foot)} pt)`);
  const inputs = await p.evaluate(() => window.__coastclear.shareInputs());
  const img = await p.evaluate(async () => { const S = await import('/js/games/coastclear/share.js'); const cv = S.renderShare({ inputs: window.__coastclear.shareInputs(), look: 'night' }); return [cv.width, cv.height]; });
  ok(JSON.stringify(Object.keys(inputs).sort()) === JSON.stringify(['caught', 'dayNo', 'head', 'line', 'site', 'spots', 'time']) && inputs.spots === 1 && img.join() === '1080,1350' && /^COAST CLEAR #\d+ · \d+:\d\d · 1 spotted · neonspeakeasy\.com$/.test(await p.evaluate(() => window.__coastclear.shareLine())), `THE SHARE: the card's inputs (no board — head / time / line / lamps / day / site), a 1080 × 1350 image, the one line`);
  await shotAll(p, 'cc-03-clear');
  ok((await played(p)).includes('win'), 'the WIN sound with the lighthouse sweep');
  await flipLook(p, 'day');
  ok((await endOf(p)).t === 'COAST CLEAR' && !!(await p.$('.cc-end.is-in')), 'a LOOK FLIP on the end screen: it stands');
  await shotAll(p, 'cc-03-clear-day', [[390, 844]]);
  await flipLook(p, 'night');
  // ---- ONE TRY: a reload lands on the end; the server keeps the first score
  await grab(p);
  await p.reload(); await ready(p);
  await p.waitForFunction(() => window.__coastclear.state().end, { timeout: 10000 });
  const endR = await endOf(p);
  ok(endR.still && endR.gone && endR.t === 'COAST CLEAR' && endR.map.length === 108, 'RESUME onto the end screen: lands on it at once (no motion replayed), the harbor drawn');
  await p.evaluate(() => window.__suspend()); await p.evaluate(() => window.__resume()); await ready(p);
  await p.waitForFunction(() => window.__coastclear.state().end, { timeout: 10000 });
  ok((await endOf(p)).still, 'torn down + rebuilt on the end screen: the same clean landing');
  const again = await p.evaluate(() => window.__api({ action: 'finish' }));
  const dig2 = await p.evaluate(() => window.__api({ action: 'dig', cell: 0 }).then(() => 'ok', e => e.code));
  ok(again.again === true && again.score === score && dig2 === 'finished', 'ONE TRY: a reload shows the end, a second finish gets the stored score back, a dig after the end is refused');
  const calls = answers.filter(a => a.name === 'ALICE');

  // ---- a SECOND PHONE on a 150 ms line: the press still instant, the taps pipelined; three lights → CAUGHT
  const q = await openPhone('cc1', 'BOB', { latency: 150 });
  const qv = await V(q);
  const safeQ = [...Array(108).keys()].filter(i => !L.has(i) && !openSet(qv).has(i)).slice(0, 6);
  const t0 = Date.now();
  const press = await q.evaluate(sels => sels.map(sel => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const t = performance.now(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4, pointerId: 9, button: 0 })); const ok = el.classList.contains('is-press'); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4, pointerId: 9, button: 0 })); return { ok, ms: performance.now() - t }; }), safeQ.map(cellSel));
  const peak = await q.evaluate(() => window.__coastclear.state().inflight);
  await idle(q);
  const all = Date.now() - t0;
  ok(press.every(x => x.ok && x.ms < 16) && peak >= 3, `150 ms LINE: every press shows in the same event (${Math.max(...press.map(x => x.ms)).toFixed(1)} ms max), ${peak} taps in flight at once, all six answered in ${all} ms`);
  for (const c of board.lights.slice(0, 2)) { await tap(q, c); await calm(q); }
  await tap(q, board.lights[2]);
  const conv = await q.waitForFunction(() => window.__coastclear.state().beams >= 3, { timeout: 8000, polling: 'raf' }).then(() => true, () => false);
  await q.waitForFunction(() => window.__coastclear.state().end, { timeout: 15000 });
  const qs = await S(q);
  const qEnd = await q.$eval('.cc-end-t', e => e.textContent);
  const qLook = await q.evaluate(() => ({ n: !!document.querySelector('.cc-end-n'), line: document.querySelector('.cc-end-line').textContent, sign: getComputedStyle(document.querySelector('.cc-sign')).opacity, lh: !!document.querySelector('.cc-lh-beam'), dim: getComputedStyle(document.querySelector('.cc-end-map')).opacity, light: document.querySelectorAll('.cc-mc.is-light, .cc-mc.is-buoy').length + document.querySelectorAll('.cc-mc.is-spot').length }));
  ok((await played(q)).includes('caught') && !(await played(q)).includes('win'), 'the CAUGHT sound with the converging beams (no win sound)');
  ok(conv && !qLook.n && /^3 SPOTTED · \d+:\d\d$/.test(qLook.line) && qLook.sign === '1' && !qLook.lh && Number(qLook.dim) < 1 && qLook.light === 18, `CAUGHT: three beams converged, then CAUGHT — no big time, one line (${qLook.line}), the sign stays, no lighthouse, the harbor dimmed with EVERY light revealed (18)${conv && !qLook.n && qLook.sign === '1' && !qLook.lh && Number(qLook.dim) < 1 && qLook.light === 18 ? '' : ` [${JSON.stringify({ conv, ...qLook })}]`}`);
  await q.waitForFunction(() => window.__coastclear.finished() === 'RECORDED', { timeout: 15000 });
  const qRec = await recOf(q);
  ok(qs.out === 'caught' && qs.spots === 3 && qEnd === 'CAUGHT' && replay(qRec, board).score > 9999, `CAUGHT: the third light ends the run (score ${replay(qRec, board).score} — below every finished run)`);
  await shotAll(q, 'cc-04-caught', [[390, 844]]);
  const rttB = await q.evaluate(() => window.__coastclear.rtts());

  // ---- NO LEAK: every answer names only cells its player's record has opened / lights it has spotted; no board, no record
  const finals = { ALICE: runView(fin, board), BOB: runView(qRec, board) };
  let bad = 0;
  for (const a of answers) {
    const f = finals[a.name], open = new Map(f.open), lit = new Set(f.lit);
    const b = a.body;
    for (const [c, n] of [...(b.cells || []), ...((b.run && b.run.open) || [])]) if (open.get(c) !== n) bad++;
    for (const c of [...(b.lit || []), ...((b.run && b.run.lit) || [])]) if (!lit.has(c)) bad++;
    if ((b.reveal && !b.done) || (b.run && b.run.reveal && !b.run.done)) bad++;      // (CC2: the lights revealed only once the run is over)
    if (/"(l|mv|board|counts)"/.test(JSON.stringify(b))) bad++;
  }
  ok(bad === 0 && answers.length > 40, `NO LEAK: ${answers.length} answers, every cell named was opened by its own player, no board / record in any`);

  // ---- CC2 — 60 FPS: real frame timing (rAF) through the sweep, the catch + the lighthouse, on the preview page (no network in the way), + at 4× CPU
  const perf = [];
  for (const [label, qs, ms] of [['the sweep', 'sweep=1', 1400], ['the catch', 'end=caught', 1700], ['the lighthouse', 'end=clear', 3200]]) {
    for (const cpu of [1, 4]) {
      const pg = await browser.newPage();
      await pg.setViewport(H.VIEW);
      if (cpu > 1) { const cdp = await pg.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
      await pg.goto(guardUrl(`${BASE}/tests/integration/coastclear-preview.html?${qs}&fdelay=50&toggle=0`, 'e2e-coastclear'));
      await pg.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
      await pg.waitForFunction(() => window.__coastclear.state().beams > 0 || window.__coastclear.state().done, { timeout: 8000, polling: 'raf' });
      perf.push({ label, cpu, ...(await frames(pg, ms)) });
      await pg.close();
    }
  }
  log(`60 FPS — ${perf.map(x => `${x.label} ${x.cpu}×: ${x.fps} fps (p95 ${x.p95} ms, ${x.long} > 25 ms)`).join(' · ')}`);
  ok(perf.filter(x => x.cpu === 1).every(x => x.fps >= 55 && x.p95 <= 20), `60 FPS through the sweep, the catch + the lighthouse (${perf.filter(x => x.cpu === 1).map(x => `${x.fps}`).join(' / ')} fps)`);

  // ---- CC2 — THE FIRST-TAP CATCH (iOS: a tap's pointerup comes BEFORE the touchend that unlocks the audio): a buoy's sound asked for with NO
  // gesture yet, then a real tap 120 ms later unlocks it → the held sound still plays; asked for with no tap at all → it never plays
  {
    const pg = await browser.newPage();
    await pg.setViewport(H.VIEW);
    await pg.goto(guardUrl(`${BASE}/tests/integration/coastclear-preview.html?state=opening&toggle=0`, 'e2e-coastclear'));
    await pg.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
    const free = await pg.evaluate(() => { const v = window.__coastclear.view(), open = new Set(v.open.map(c => c[0])); return [...Array(108).keys()].filter(i => !open.has(i)).slice(0, 2); });
    await pg.evaluate(i => { window.__coastclear.long(i); }, free[0]);          // (no gesture: the sound is held)
    await sleep(120);
    await pg.mouse.click(4, 400);                                               // a real tap on the screen → the console's unlock
    await pg.waitForFunction(() => import('/js/games/coastclear/sfx.js').then(m => m.ccSfxPlayed().some(x => x.name === 'buoy')), { timeout: 3000, polling: 100 }).catch(() => {});
    const got = await played(pg);
    await pg.evaluate(i => { window.__coastclear.long(i); }, free[1]);          // unlocked now: plays at once
    await sleep(150);
    const got2 = await played(pg);
    ok(got.includes('buoy') && got2.filter(n => n === 'unbuoy' || n === 'buoy').length >= 2, `THE FIRST-TAP CATCH: a sound asked for before the unlock plays once the tap unlocks the audio (${got2.join(' · ')})`);
    await pg.close();
    const pg2 = await browser.newPage();
    await pg2.goto(guardUrl(`${BASE}/tests/integration/coastclear-preview.html?state=opening&toggle=0`, 'e2e-coastclear'));
    await pg2.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
    await pg2.evaluate(() => { const v = window.__coastclear.view(), open = new Set(v.open.map(c => c[0])); window.__coastclear.long([...Array(108).keys()].find(i => !open.has(i))); });
    await sleep(700);
    ok((await played(pg2)).length === 0, 'with no tap at all, nothing plays (never a sound without a gesture)');
    await pg2.close();
  }

  // ---- THE NUMBERS
  const digs = calls.filter(a => a.req.action === 'dig' || a.req.action === 'chord').length;
  log(`THE NUMBERS — ALICE: ${calls.length} /api/daily calls (${digs} digs + chords), the record ${JSON.stringify(fin).length} bytes, the board ${JSON.stringify(await val(`dly/coastclear/${day}/b`)).length} bytes`);
  log(`  the dig round trip on the emulators: p50 ${pct(rttA, 0.5)} ms · p95 ${pct(rttA, 0.95)} ms (${rttA.length} answers)`);
  log(`  with 150 ms added each way-ish (CDP latency 150): p50 ${pct(rttB, 0.5)} ms · p95 ${pct(rttB, 0.95)} ms — the press itself ${Math.max(...press.map(x => x.ms)).toFixed(1)} ms`);
  void safeCount; void unpackBoard;
});
