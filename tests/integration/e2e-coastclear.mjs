// COAST CLEAR — the daily end to end (CC1 — docs/coastclear.md; the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`):
//   E2E_BASE=http://localhost:<port> node e2e-coastclear.mjs "<browser>" ./shots-coastclear      (env SHOTS=0; FAST=1 = the same path)
// The REAL view (coastclear-daily.html) with THE API JUDGE against the REAL /api/daily: start (the opening, no pills, no glyphs) → a dig (the
// number from the server) → a flood (the whole calm area in one answer) → buoys by long-press + a CHORD → a SPOT (+30 s, the lamp lit, play goes
// on) → a REFRESH mid-run resumes (the cells, the light, the buoys) → a PAUSE (THE DAILY MODULE's call) + the screen torn down + rebuilt (the
// view resumes the clock) → every safe cell → COAST CLEAR + the server's score (= its replay) → ONE TRY (a reload lands on the end). A second
// phone on a 150 ms line: the tap's press still instant, the answers pipelined → three lights → CAUGHT. Every /api answer checked: no cell named
// that the record hasn't opened. THE NUMBERS: the dig round trip (p50 / p95) on the emulators + with 150 ms added, the calls + the record's size.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { buildBoard, unpackBoard } from '../../api/_lib/cc-board.js';
import { countsOf, nbOf, runView, replay, safeCount } from '../../js/games/coastclear/logic.js';
import { streakDay } from '../../js/core/streak.js';

const H = await createHarness({ name: 'coastclear', slot: 'cc', sizes: [[390, 844], [402, 874], [430, 932]] });
const { log, sleep, ok, shotAll, BASE, browser } = H;
const day = streakDay(Date.now());
const board = buildBoard(day, fb().pepper).board;
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
const openSet = v => new Set(v.open.map(c => c[0]));
const pidOf = page => page.evaluate(() => window.__daily.pid);
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

  // ---- a FLOOD: a 0 outside what's open → its whole calm area in ONE answer
  const zero = [...Array(108).keys()].find(i => !openSet(v).has(i) && counts[i] === 0);
  if (zero != null) {
    const n0 = answers.length;
    await tap(p, zero); await idle(p);
    v = await V(p);
    const a = answers.slice(n0).find(x => x.req.action === 'dig' && x.req.cell === zero);
    ok(a && a.body.cells.length > 1 && a.body.cells.every(([c]) => openSet(v).has(c)), `a FLOOD: the 0 opened ${a && a.body.cells.length} cells in one answer`);
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

  // ---- a SPOT: dig a light → +30 s, the lamp lit, the light stays, play goes on
  const clock0 = await p.evaluate(() => window.__coastclear.state().clock);
  v = await V(p);
  const bu0 = new Set(await p.evaluate(() => window.__coastclear.buoys()));
  const light = board.lights.find(c => !bu0.has(c));
  await tap(p, light); await idle(p);
  const s1 = await S(p);
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
  await p.evaluate(() => window.__api({ action: 'pause' }));
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
  const end = await p.evaluate(() => ({ t: document.querySelector('.cc-end-t').textContent, n: (document.querySelector('.cc-end-n') || {}).textContent, line: document.querySelector('.cc-end-line').textContent, buoys: window.__coastclear.buoys().length, text: document.querySelector('.cc-screen').innerText }));
  ok(fin.o === 'clear' && rep && score === rep.score && end.t === 'COAST CLEAR' && /1 SPOT/.test(end.line) && /1 PAUSE/.test(end.line), `COAST CLEAR: the server's score ${score} = its replay (time + 30 + 15) — "${end.t} ${end.n} · ${end.line}"`);
  ok(end.buoys === 17 && !/null|undefined/.test(end.text), 'on the clear every cell still shut gets its buoy (deduced — never told); no stray text');
  await shotAll(p, 'cc-03-clear');
  // ---- ONE TRY: a reload lands on the end; the server keeps the first score
  await grab(p);
  await p.reload(); await ready(p);
  await p.waitForFunction(() => window.__coastclear.state().end, { timeout: 10000 });
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
  ok(press.every(x => x.ok && x.ms < 8) && peak >= 3, `150 ms LINE: every press shows in the same event (${Math.max(...press.map(x => x.ms)).toFixed(1)} ms max), ${peak} taps in flight at once, all six answered in ${all} ms`);
  for (const c of board.lights.slice(0, 3)) await tap(q, c);
  await q.waitForFunction(() => window.__coastclear.state().end, { timeout: 15000 });
  const qs = await S(q);
  const qEnd = await q.$eval('.cc-end-t', e => e.textContent);
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
    if (/"(l|mv|board|counts)"/.test(JSON.stringify(b))) bad++;
  }
  ok(bad === 0 && answers.length > 40, `NO LEAK: ${answers.length} answers, every cell named was opened by its own player, no board / record in any`);

  // ---- THE NUMBERS
  const digs = calls.filter(a => a.req.action === 'dig' || a.req.action === 'chord').length;
  log(`THE NUMBERS — ALICE: ${calls.length} /api/daily calls (${digs} digs + chords), the record ${JSON.stringify(fin).length} bytes, the board ${JSON.stringify(await val(`dly/coastclear/${day}/b`)).length} bytes`);
  log(`  the dig round trip on the emulators: p50 ${pct(rttA, 0.5)} ms · p95 ${pct(rttA, 0.95)} ms (${rttA.length} answers)`);
  log(`  with 150 ms added each way-ish (CDP latency 150): p50 ${pct(rttB, 0.5)} ms · p95 ${pct(rttB, 0.95)} ms — the press itself ${Math.max(...press.map(x => x.ms)).toFixed(1)} ms`);
  void safeCount; void unpackBoard;
});
