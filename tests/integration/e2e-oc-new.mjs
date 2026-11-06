// OVERCLOCK's newer challenges end to end: TRUE OR FALSE (OC1's look + the combo + the after-challenge skip), TIMELINE, CLOSEST CALL, REWIRE,
// UNSCRAMBLE (OC3B — real finger taps on its tiles, slots, CLEAR + SHUFFLE; a wrong word + the right one) with N players (default 8).
// (LEXICON was cut in OC1.)
//   node e2e-oc-new.mjs "<browser path>" ./shots
// The host's match order is set to open with those four (then the usual mix). Covers: rules cards,
// identical puzzles on every phone, real UI play (taps on tiles / items / keypad / circuit tiles), scoring math
// against what the host wrote, a refresh mid-Rewire (turns + solved circuits restored), the host's phone dying
// mid-Timeline (migration), and every new screen + reveal at 390×844 and 412×915.
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const pages = [];
const ctxs = [];
const dead = new Set();

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message, String(e.stack || '').split(String.fromCharCode(10)).slice(1, 3).join(' | ')); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|TOO LATE/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=o${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(450);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(150);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  fail(`timeout: ${what}`);
}
const OC = (page, expr) => page.evaluate(`(() => { const O = window.__oc; return O ? (${expr}) : null; })()`);
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const all = (idx, fn) => Promise.all(idx.map(fn));
const hostPage = async () => {
  for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return pages[i]; } catch { /* */ } }
  return pages[alive()[0]];
};
// pointer taps exactly like a finger (the challenge buttons react on pointerdown)
const press = (page, sel, nth = 0) => page.evaluate(([s, n]) => {
  const el = document.querySelectorAll(s)[n];
  if (!el) throw new Error(`no ${s}[${n}]`);
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
}, [sel, nth]);
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);

async function waitPhase(page, phase, ci, what, timeout = 60000) {
  return waitFor(page, (s, a) => s.game && s.game.ci === a.ci && s.game.phase === a.phase, what, timeout, { ci, phase });
}
async function waitSpec(page, type) {
  const end = Date.now() + 20000;
  while (Date.now() < end) { const t = await OC(page, 'O.spec() && O.spec().type').catch(() => null); if (t === type) return; await sleep(150); }
  fail(`${type}: challenge never mounted`);
}

try {
  // ---------------- lobby
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tapReal(host, '.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.title-screen.is-room .rdk-dock', { timeout: 20000 });   // (SHELL 2.0 B1: the room in the city — the old lobby went with CITY 1.0 OUT)
  const code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await tapReal(p, '.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.title-screen.is-room', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  const uids = [];
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);

  // ---------------- start: the four first, then the usual mix (12 different)
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', { mode: 'standard' })));
  await waitFor(host, s => s.game && s.game.id === 'overclock', 'overclock started', 20000);
  // (OC2 — THE CUES NEVER BLOCK PLAY: EVE starts on a ×6 combo, so her 4th right TRUE OR FALSE answer is her ×10 — ALICE's 4th is her ×4)
  const EVE = N > 4 ? await evalIn(pages[4], s => s.uid) : null;
  await host.evaluate(eve => {
    const s = window.__arcade.state;
    const first = ['truefalse', 'timeline', 'closest', 'rewire', 'unscramble'];
    const order = [...first, ...s.game.order.filter(t => !first.includes(t))].slice(0, s.game.total);
    return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, seen: { truefalse: true }, tq: {}, tUsed: 0, deal: null, dk: null, ...(eve ? { [`combo/${eve}`]: { c: 6, m: 6 } } : {}) }));
  }, EVE);
  await waitFor(pages[1], s => s.game.order[0] === 'truefalse', 'forced order', 10000);
  const order = await evalIn(host, s => s.game.order);
  ok(new Set(order).size === order.length, `no repeated types in the match (${order.length} different)`);
  log('order', order.join(' '));

  // ---------------- 1. TRUE OR FALSE (OC1 — LEXICON cut; the OVERDRIVE look) + THE COMBO + THE AFTER-CHALLENGE SKIP
  await pages[1].waitForSelector('.oc-ready', { timeout: 15000 });
  await sleep(700);
  await shotBoth(pages[1], 'o-01-truefalse-rules');
  await waitPhase(host, 'play', 0, 'true or false play');
  for (const i of alive()) await waitSpec(pages[i], 'truefalse');
  const tfSpecs = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())')));
  ok(tfSpecs.every(x => x === tfSpecs[0]), 'TRUE OR FALSE: the same statements on every phone');
  // (the order was forced after the start, so its deal went with it — the deal itself is tests/overclock-oc1.test.mjs's)
  ok(await evalIn(host, s => !!(s.meta.used && s.meta.used.overclock && s.meta.used.overclock['t-truefalse'])), 'THE NIGHT MEMORY: the room remembers TRUE OR FALSE from the moment it opened (meta/used/overclock/t-truefalse)');
  // ALICE answers all 8 right; BOB misses the 4th (a 4-in-a-row, then 4 more); everyone else misses one somewhere
  // probeAt = the answer that crosses a combo milestone: right after it, the cue must be running in the HEADER band only (nothing of it over
  // the statement card or the buttons — rects at 390 × 844) and the NEXT statement's button must take a tap while the cue still runs
  async function answerTF(page, wrongAt, probeAt = -1) {
    return page.evaluate(async (miss, probe) => {
      const sp = window.__oc.spec();
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      let out = null;
      for (let k = 0; k < sp.items.length; k++) {
        for (let w = 0; w < 40 && !document.querySelector('.tf-btn:not(.is-locked)'); w++) await wait(25);
        const truth = sp.items[k].truth, pickTrue = k === miss ? !truth : truth;
        const b = document.querySelector(pickTrue ? '.tf-true:not(.is-locked)' : '.tf-false:not(.is-locked)');
        if (k === probe + 1 && out) {
          const r = b.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          out.cueAtNextTap = window.__oc.combo().cueing;
          out.nextTapReachesButton = !!(at && b.contains(at));
          out.nextShownMs = Math.round(performance.now() - out.t0);
          const p0 = window.__oc.state().p;
          b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
          out.nextTapLanded = window.__oc.state().p === p0 + 1;
          delete out.t0;
        } else b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        if (k === probe) {
          await wait(60);
          const C = window.__oc.combo();
          const cue = [...document.querySelectorAll('.oc-combo, .oc-fx-streak.is-on i')].map(e => e.getBoundingClientRect());
          const play = [...document.querySelectorAll('.oc-tf-card, .tf-btn, .oc-tf-warn')].map(e => e.getBoundingClientRect());
          out = { t0: performance.now() - 60, n: C.n, cueing: C.cueing, overlaps: cue.some(c => play.some(p => hit(c, p))), cueBottom: Math.round(Math.max(...cue.slice(0, 1).map(c => c.bottom))), playTop: Math.round(Math.min(...play.map(p => p.top))) };
        }
        await wait(k === miss ? 900 : 360);
      }
      return out;
    }, wrongAt, probeAt);
  }
  const cueOD = await answerTF(pages[0], -1, 3);
  ok(cueOD && cueOD.n === 4 && cueOD.cueing && !cueOD.overlaps && cueOD.cueBottom < cueOD.playTop, `THE CUES NEVER BLOCK PLAY: ×4 OVERDRIVE ignites in the header band only (meter bottom ${cueOD && cueOD.cueBottom} < play top ${cueOD && cueOD.playTop}, no overlap)`);
  ok(cueOD && cueOD.cueAtNextTap && cueOD.nextTapReachesButton && cueOD.nextTapLanded, `THE CUES NEVER BLOCK PLAY: a tap on the next statement lands DURING the ×4 cue (${cueOD && cueOD.nextShownMs} ms in)`);
  await sleep(200);
  await shotBoth(pages[0], 'o-02-truefalse-done');
  const tfOthers = await Promise.all(alive().filter(i => i > 0).map(i => answerTF(pages[i], i === 1 ? 3 : i % 8, i === 4 ? 3 : -1).then(r => [i, r])));
  const cue10 = (tfOthers.find(([i]) => i === 4) || [])[1];
  if (EVE) {
    ok(cue10 && cue10.n === 10 && cue10.cueing && !cue10.overlaps && cue10.cueBottom < cue10.playTop, `THE CUES NEVER BLOCK PLAY: ×10 flares in the header band only (${JSON.stringify(cue10 && { n: cue10.n, bottom: cue10.cueBottom, top: cue10.playTop })})`);
    ok(cue10 && cue10.cueAtNextTap && cue10.nextTapReachesButton && cue10.nextTapLanded, `THE CUES NEVER BLOCK PLAY: a tap lands DURING the ×10 cue (${cue10 && cue10.nextShownMs} ms in)`);
  }
  await waitPhase(host, 'standings', 0, 'true or false standings', 45000);
  await sleep(1200);
  await shotBoth(pages[1], 'o-03-truefalse-answer');
  const r0 = await evalIn(host, s => s.game.results[0]);
  ok(r0[uids[0]].ok === 8 && r0[uids[0]].pts > 100, `TRUE OR FALSE: ALICE 8/8 = full + speed (${r0[uids[0]].pts})`);
  ok(r0[uids[1]].ok === 7, `TRUE OR FALSE: BOB 7/8 (${r0[uids[1]].ok})`);
  const combo = await evalIn(host, s => s.game.combo || {});
  ok(combo[uids[0]] && combo[uids[0]].c === 8 && combo[uids[0]].m === 8, `THE COMBO: ALICE 8 in a row (${JSON.stringify(combo[uids[0]])})`);
  ok(combo[uids[1]] && combo[uids[1]].c === 4 && combo[uids[1]].m === 4, `THE COMBO: BOB's miss reset it — 3, then 4 (${JSON.stringify(combo[uids[1]])})`);
  // THE AFTER-CHALLENGE SKIP: everyone taps READY → the next challenge comes long before the 8 s are up (never before 3 s)
  const sk = await evalIn(host, s => ({ at: s.game.phaseStartAt, ends: s.game.phaseEndsAt }));
  // (OC2) THE ANSWER is the first beat; ALICE's READY lights her row on BOB's phone (the room sees who it's waiting on)
  ok(await pages[1].evaluate(() => !!document.querySelector('.oc-beat-answer.is-on .gk-answer') && document.querySelector('.oc-st-body').dataset.beat === 'answer'), 'THE ANSWER: the after-challenge screen opens on it');
  const tapNext = i => pages[i].waitForSelector('.oc-next-btn', { timeout: 8000 }).then(() => pages[i].evaluate(() => document.querySelector('.oc-next-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))));
  await tapNext(0);
  await pages[1].waitForFunction(u => { const r = document.querySelector(`.oc-sb-row[data-uid="${u}"]`); return r && r.classList.contains('is-ready'); }, { timeout: 4000 }, uids[0]).then(() => ok(true, 'TAP WHEN READY: ALICE\'s row shows her lit READY mark on BOB\'s phone'), () => ok(false, 'TAP WHEN READY: ALICE\'s READY mark on BOB\'s phone'));
  ok(await pages[1].evaluate(u => !document.querySelector(`.oc-sb-row[data-uid="${u}"]`).classList.contains('is-ready'), uids[1]), 'TAP WHEN READY: BOB (not tapped yet) is unlit');
  await all(alive().filter(i => i > 0), tapNext);
  await waitPhase(host, 'ready', 1, 'the skip', 12000);
  const skAt = await evalIn(host, s => s.game.phaseStartAt);
  ok(skAt - sk.at >= 3000 && skAt < sk.ends - 1500, `THE SKIP: on after ${((skAt - sk.at) / 1000).toFixed(1)} s (max ${((sk.ends - sk.at) / 1000).toFixed(0)} s, never before 3 s)`);

  // ---------------- 2. TIMELINE (+ the host's phone dies mid-challenge)
  await waitPhase(pages[1], 'ready', 1, 'timeline ready');
  await pages[1].waitForSelector('.oc-ready', { timeout: 15000 });
  await sleep(700);
  await shotBoth(pages[1], 'o-04-timeline-rules');
  await waitPhase(pages[1], 'play', 1, 'timeline play');
  for (const i of alive()) await waitSpec(pages[i], 'timeline');
  const tl = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())')));
  ok(tl.every(x => x === tl[0]), 'TIMELINE: the same set and screen order on every phone');
  const tSpec = JSON.parse(tl[0]);
  const correct = [0, 1, 2, 3].map(pos => tSpec.shown.indexOf(pos));
  // BOB taps two, undoes one, finishes perfectly
  // (OC3B) the four slanted glass rows: a tap turns one orange with its order badge, a tap again takes it back
  await press(pages[1], '.oc-tl-row', correct[0]);
  await press(pages[1], '.oc-tl-row', correct[2]);
  ok(await pages[1].evaluate(i => { const r = document.querySelectorAll('.oc-tl-row')[i]; return r.classList.contains('is-picked') && r.querySelector('.oc-tl-badge').textContent === '2' && document.querySelector('.oc-tl-lock').disabled; }, correct[2]), 'TIMELINE: a tapped row turns orange with its order badge (2); LOCK IT IN waits for all four');
  await press(pages[1], '.oc-tl-row', correct[2]); // undo
  ok(await pages[1].evaluate(i => !document.querySelectorAll('.oc-tl-row')[i].classList.contains('is-picked'), correct[2]), 'TIMELINE: a tap again takes it back');
  await press(pages[1], '.oc-tl-row', correct[1]);
  await sleep(250);
  await shotBoth(pages[1], 'o-05-timeline-play');
  await press(pages[1], '.oc-tl-row', correct[2]);
  await press(pages[1], '.oc-tl-row', correct[3]);
  ok(await pages[1].evaluate(() => !document.querySelector('.oc-tl-lock').disabled), 'TIMELINE: LOCK IT IN lights once all four are numbered');
  await click(pages[1], '.oc-tl-lock');
  await sleep(500);
  await shotBoth(pages[1], 'o-06-timeline-result');
  // kill the host while the others are still ordering
  const hostIdx = pages.indexOf(await hostPage());
  const oldHost = uids[hostIdx];
  dead.add(hostIdx);
  await pages[hostIdx].close();
  log(`killed the host (${NAMES[hostIdx]}) mid-Timeline`);
  for (const i of alive().filter(i => i !== 1)) {
    const picks = i % 2 ? [...correct].reverse() : correct;
    for (const n of picks) await press(pages[i], '.oc-tl-row', n);
    await click(pages[i], '.oc-tl-lock');
  }
  await waitFor(pages[1], (s, old) => s.meta.hostId !== old, 'host migrated', 45000, oldHost);
  ok(true, 'host migrated mid-challenge');
  await waitPhase(pages[1], 'standings', 1, 'timeline standings', 60000);
  await sleep(2000);
  await shotBoth(pages[1], 'o-07-timeline-reveal');
  {
    const tla = await pages[1].evaluate(() => ({ rows: document.querySelectorAll('.oc-beat-answer .oc-tla-row').length, right: document.querySelectorAll('.oc-beat-answer .oc-tla-row.is-right').length, vals: document.querySelectorAll('.oc-beat-answer .oc-tla-val').length }));
    ok(tla.rows === 4 && tla.right === 4 && tla.vals === 4, `TIMELINE — THE ANSWER: four rows in the right order beside the value rail, BOB's all ✓ (${JSON.stringify(tla)})`);
  }
  // (OC2) a phone refreshed mid-results lands on the same beat as everyone else (timed from the phase's start on the server clock)
  {
    const rj = alive().find(i => i > 1);
    await pages[rj].reload();
    await pages[rj].waitForSelector('.oc-st-body', { timeout: 30000 });
    const [a, b] = await Promise.all([pages[1], pages[rj]].map(p => p.evaluate(() => document.querySelector('.oc-st-body').dataset.beat)));
    const stage = await evalIn(pages[1], () => window.__arcade.state.game.phase);
    ok(stage !== 'standings' || a === b, `REJOIN: a refreshed phone lands on the same beat (${a} / ${b})`);
    await waitFor(pages[1], () => document.querySelector('.oc-st-body') && document.querySelector('.oc-st-body').dataset.beat === 'stand', 'the standings beat', 14000);
    const fit = await pages[1].evaluate(() => { const rows = [...document.querySelectorAll('.oc-sb-row')].map(r => r.getBoundingClientRect()); const foot = document.querySelector('.oc-st-foot').getBoundingClientRect(); return { n: rows.length, bottom: Math.max(...rows.map(r => r.bottom)), foot: foot.top, h: innerHeight }; });
    ok(fit.n === N && fit.bottom <= fit.foot, `THE STANDINGS: all ${fit.n} rows above the NEXT / READY footer at 390 × 844 (rows end ${Math.round(fit.bottom)}, footer ${Math.round(fit.foot)})`);
  }
  const r1 = await evalIn(pages[1], s => s.game.results[1]);
  ok(r1[uids[1]].ok === 4 && r1[uids[1]].pts > 100, `TIMELINE: perfect order = full + speed (${r1[uids[1]].pts})`);
  const rev = alive().find(i => i > 1 && i % 2);
  if (rev != null) ok(r1[uids[rev]].pts === Math.round(100 * r1[uids[rev]].ok / 4), 'TIMELINE: partial credit, no speed bonus');
  // the old host's phone comes back
  const back = await openPlayer(hostIdx);
  dead.delete(hostIdx);
  await back.waitForSelector('.screen.oc', { timeout: 30000 });

  // ---------------- 3. CLOSEST CALL
  await waitPhase(pages[1], 'ready', 2, 'closest ready');
  await sleep(900);
  await shotBoth(pages[1], 'o-08-closest-rules');
  await waitPhase(pages[1], 'play', 2, 'closest play');
  for (const i of alive()) await waitSpec(pages[i], 'closest');
  const cc = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())')));
  ok(cc.every(x => x === cc[0]), 'CLOSEST CALL: the same question on every phone');
  const cSpec = JSON.parse(cc[0]);
  const factors = [1.02, 0.7, 1.35, 0.9, 1.8, 1.12, 0.5, 1.25];
  // (OC3) the kit's NUMBER PAD — a finger on each key (no input anywhere: the system keyboard never opens)
  async function keyIn(page, value) {
    ok(await page.evaluate(() => !document.querySelector('.screen.oc input, .screen.oc textarea')), 'CLOSEST CALL: no input element (never the system keyboard)');
    for (const ch of String(value)) await press(page, `.gk-np-key[data-k="${ch}"]`);
  }
  const guesses = {};
  for (const i of alive()) {
    const g = Math.max(1, Math.round(cSpec.answer * factors[i % factors.length]));
    guesses[uids[i]] = g;
    await keyIn(pages[i], g);
    if (i === 1) { await sleep(200); await shotBoth(pages[1], 'o-09-closest-play'); }
    await press(pages[i], '.gk-np .gk-go');
  }
  await waitPhase(pages[1], 'standings', 2, 'closest standings', 45000);
  await sleep(1000);
  await shotBoth(pages[1], 'o-10-closest-line-early');
  await sleep(2400);
  await shotBoth(pages[1], 'o-11-closest-reveal');
  const r2 = await evalIn(pages[1], s => s.game.results[2]);
  const errs = Object.fromEntries(Object.entries(guesses).map(([u, g]) => [u, Math.abs(g - cSpec.answer) / cSpec.answer]));
  const bestU = Object.keys(errs).sort((a, b) => errs[a] - errs[b])[0];
  ok(r2[bestU].pts === 160 || r2[bestU].pts === Math.round(100 * r2[bestU].ok) + 60, `CLOSEST CALL: the closest guess takes the bonus (${r2[bestU].pts})`);
  ok(Object.keys(r2).filter(u => u !== bestU && errs[u] > errs[bestU]).every(u => r2[u].pts === Math.round(100 * r2[u].ok)), 'CLOSEST CALL: nobody else gets a bonus');

  // ---------------- 4. REWIRE (+ refresh mid-circuit)
  await waitPhase(pages[1], 'ready', 3, 'rewire ready');
  await sleep(900);
  await shotBoth(pages[1], 'o-12-rewire-rules');
  await waitPhase(pages[1], 'play', 3, 'rewire play');
  for (const i of alive()) await waitSpec(pages[i], 'rewire');
  const rw = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())')));
  ok(rw.every(x => x === rw[0]), 'REWIRE: the same circuits on every phone');
  const rSpec = JSON.parse(rw[0]);
  ok(rSpec.puzzles.map(p => p.n).join() === '3,4', 'REWIRE: a 3×3 warm-up, then a 4×4');
  async function solve(page, pz, from) {
    for (let i = 0; i < pz.n * pz.n; i++) {
      const turns = ((pz.solution[i] - from[i]) % 4 + 4) % 4;
      for (let k = 0; k < turns; k++) { await press(page, '.rw-tile', i); await sleep(30); }
    }
  }
  await sleep(400);
  await shotBoth(pages[1], 'o-13-rewire-start');
  await solve(pages[1], rSpec.puzzles[0], rSpec.puzzles[0].start);
  await sleep(500);
  await shotBoth(pages[1], 'o-14-rewire-solved');
  await waitFor(pages[1], () => document.querySelectorAll('.rw-tile').length === 16, '4×4 circuit up', 6000);
  // two turns into the 4×4, then a refresh: progress and turns come back
  await press(pages[1], '.rw-tile', 0); await press(pages[1], '.rw-tile', 5);
  await sleep(900);
  const before = await OC(pages[1], 'JSON.stringify(O.state().extra.rw)');
  await pages[1].reload();
  await pages[1].waitForSelector('.rw-tile', { timeout: 30000 });
  await sleep(500);
  const after = await OC(pages[1], 'JSON.stringify(O.state().extra.rw)');
  ok(before === after && (await pages[1].evaluate(() => document.querySelectorAll('.rw-tile').length)) === 16, 'REWIRE: a refresh keeps the solved circuit and the turns');
  const cur = JSON.parse(after).split('').map(Number);
  await solve(pages[1], rSpec.puzzles[1], cur);
  await waitFor(pages[1], () => window.__oc.state().done, 'BOB solved both', 8000);
  ok(true, 'REWIRE: both circuits solved through the UI');
  await pages[1].evaluate(() => new Promise(r => setTimeout(r, 200)));
  await waitPhase(pages[1], 'standings', 3, 'rewire standings', 45000);
  const r3 = await evalIn(pages[1], s => s.game.results[3]);
  ok(r3[uids[1]].ok === 2 && r3[uids[1]].pts > 100, `REWIRE: both solved = full + speed (${r3[uids[1]].pts})`);
  ok(Object.entries(r3).filter(([u]) => u !== uids[1]).every(([, r]) => r.ok < 1 && r.pts === Math.round(50 * r.ok)), 'REWIRE: partial credit for how far the power got');
  await sleep(800);
  await shotBoth(pages[1], 'o-15-standings');

  // ---------------- 4b. UNSCRAMBLE with REAL TAPS (OC3B — OC3 checked its tiles on the preview only): a finger on the tiles fills the slots, a
  // tap on a filled slot takes its letter back, CLEAR empties them, SHUFFLE moves the tiles (the letters kept); BOB submits a WRONG word (a red
  // shake, then empty — nothing scored), then the RIGHT one (full + speed); CHARLIE only ever submits a wrong word; THE ANSWER says both
  await waitPhase(pages[1], 'play', 4, 'unscramble play', 60000);
  for (const i of alive()) await waitSpec(pages[i], 'unscramble');
  const usAll = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())')));
  ok(usAll.every(x => x === usAll[0]), 'UNSCRAMBLE: the same letters on every phone');
  const uSpec = JSON.parse(usAll[0]);
  const W = uSpec.word;
  // a wrong word: the same letters in an order the game refuses (not the word, not another real word)
  const wrongW = await pages[1].evaluate(async word => {
    const [{ unscrambleAccepts }, { isValidGuess }] = await Promise.all([import('/js/games/overclock/challenges.js'), import('/js/games/cipher/words.js')]);
    const a = [...word], tries = [a.slice().reverse().join('')];
    for (let k = 1; k < a.length; k++) tries.push(word.slice(k) + word.slice(0, k));
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) { const b = a.slice(); [b[i], b[j]] = [b[j], b[i]]; tries.push(b.join('')); }
    return tries.find(t => !unscrambleAccepts(t, word, isValidGuess)) || null;
  }, W);
  ok(!!wrongW, `UNSCRAMBLE: a wrong arrangement to submit (${W} → ${wrongW})`);
  // a real finger (CDP touch) on the n-th match of a selector; on the first free tile of a letter
  const tapNth = async (page, sel, nth = 0) => { const els = await page.$$(sel); if (!els[nth]) fail(`no ${sel}[${nth}]`); await els[nth].tap(); };
  const tapLetter = async (page, ch) => {
    const idx = await page.evaluate(c => [...document.querySelectorAll('.oc-us-tile')].findIndex(b => b.dataset.ch === c && !b.classList.contains('is-used')), ch);
    if (idx < 0) fail(`UNSCRAMBLE: no free tile "${ch}"`);
    await tapNth(page, '.oc-us-tile', idx);
  };
  const usState = page => page.evaluate(() => ({
    filled: [...document.querySelectorAll('.oc-us-slot')].map(s => s.textContent).join(''),
    used: document.querySelectorAll('.oc-us-tile.is-used').length,
    tiles: [...document.querySelectorAll('.oc-us-tile')].map(b => b.dataset.ch).join(''),
    bad: !!document.querySelector('.oc-us-slots.is-bad'),
  }));
  const UP = s => String(s).toUpperCase();
  const sorted = s => [...s].sort().join('');
  ok(await pages[1].evaluate(() => !document.querySelector('.screen.oc input, .screen.oc textarea')), 'UNSCRAMBLE: no input element (its own tiles — never the system keyboard)');
  await tapLetter(pages[1], W[0]);
  await tapLetter(pages[1], W[1]);
  let u = await usState(pages[1]);
  ok(u.filled === UP(W.slice(0, 2)) && u.used === 2, `UNSCRAMBLE: two tile taps fill the first two slots (${u.filled}, ${u.used} tiles used)`);
  await sleep(150);
  await shotBoth(pages[1], 'o-15b-unscramble-play');
  await tapNth(pages[1], '.oc-us-slot', 0);
  u = await usState(pages[1]);
  ok(u.filled === UP(W[1]) && u.used === 1, `UNSCRAMBLE: a tap on a filled slot takes its letter back (${u.filled}, ${u.used} used)`);
  await tapNth(pages[1], '.oc-us-key.is-clear');
  u = await usState(pages[1]);
  ok(u.filled === '' && u.used === 0, 'UNSCRAMBLE: CLEAR empties every slot + brings every tile back');
  await tapLetter(pages[1], W[0]);
  const tilesBefore = (await usState(pages[1])).tiles;
  let tilesAfter = tilesBefore;
  for (let k = 0; k < 6 && tilesAfter === tilesBefore; k++) { await tapNth(pages[1], '.oc-us-key.is-shuffle'); tilesAfter = (await usState(pages[1])).tiles; }
  u = await usState(pages[1]);
  ok(tilesAfter !== tilesBefore && sorted(tilesAfter) === sorted(tilesBefore) && u.filled === UP(W[0]) && u.used === 1, `UNSCRAMBLE: SHUFFLE moves the tiles, keeps the letters + the slot you filled (${tilesBefore} → ${tilesAfter})`);
  await tapNth(pages[1], '.oc-us-key.is-clear');
  // the wrong word: a red shake, then the slots empty — nothing scored
  for (const ch of wrongW) await tapLetter(pages[1], ch);
  ok((await usState(pages[1])).bad, 'UNSCRAMBLE: a wrong word shakes red');
  await pages[1].waitForFunction(() => !document.querySelector('.oc-us-slots.is-bad') && ![...document.querySelectorAll('.oc-us-slot')].some(s => s.textContent), { timeout: 3000, polling: 30 });
  ok((await OC(pages[1], 'O.state().ok')) === 0 && !(await OC(pages[1], 'O.state().done')), 'UNSCRAMBLE: the wrong word empties the slots, nothing scored');
  // the right word
  for (const ch of W) await tapLetter(pages[1], ch);
  await waitFor(pages[1], () => window.__oc.state().done && window.__oc.state().ok === 1, 'BOB unscrambled it', 5000);
  ok(true, 'UNSCRAMBLE: the right word, tapped tile by tile, solves it');
  // CHARLIE: a wrong word only (his last guess = YOUR PICK); everyone else types the word on a COMPUTER keyboard
  const CH = N > 2 ? 2 : -1;
  if (CH > 0) for (const ch of wrongW) await tapLetter(pages[CH], ch);
  for (const i of alive().filter(i => i !== 1 && i !== CH)) await pages[i].keyboard.type(W);
  await waitPhase(pages[1], 'standings', 4, 'unscramble standings', 45000);
  const ansOf = (page, word) => page.waitForFunction(w => {
    const a = document.querySelector('.oc-beat-answer.is-on .gk-answer');
    if (!a) return null;
    const pick = a.querySelector('.gk-pick-text');
    return JSON.stringify({ right: a.classList.contains('is-right'), wrong: a.classList.contains('is-wrong'), word: (a.querySelector('.oc-ans-us') || {}).textContent, pick: pick && pick.textContent, you: !!a.querySelector('.gk-you') });
  }, { timeout: 4000, polling: 50 }, word).then(h => h.jsonValue()).then(JSON.parse).catch(() => null);
  const [aBob, aCh] = await Promise.all([ansOf(pages[1]), CH > 0 ? ansOf(pages[CH]) : null]);
  ok(aBob && aBob.right && aBob.you && aBob.word === UP(W), `UNSCRAMBLE — THE ANSWER on BOB's phone: ${UP(W)} white-hot + YOU (${JSON.stringify(aBob)})`);
  if (CH > 0) ok(aCh && aCh.wrong && aCh.word === UP(W) && aCh.pick === UP(wrongW), `UNSCRAMBLE — THE ANSWER on CHARLIE's phone: his ${UP(wrongW)} struck under ${UP(W)} (${JSON.stringify(aCh)})`);
  await shotBoth(pages[CH > 0 ? CH : 1], 'o-15c-unscramble-answer');
  const r4 = await evalIn(pages[1], s => s.game.results[4]);
  ok(r4[uids[1]].ok === 1 && r4[uids[1]].pts > 100, `UNSCRAMBLE: BOB's right word = full + speed (${r4[uids[1]].pts}), the wrong one cost nothing`);
  if (CH > 0) ok(r4[uids[CH]].ok === 0 && r4[uids[CH]].pts === 0, `UNSCRAMBLE: CHARLIE's wrong word only = 0 (${r4[uids[CH]].pts})`);

  // ---------------- 5. THE END OF THE MATCH (OC2): the host jumps the match to its LAST challenge (a TRUE OR FALSE), everyone plays it, then
  // the final's beats — the last round's answer → its round winner → the standings → FINAL STANDINGS → THE VICTORY (the console's frame +
  // OUR body); one phone SKIPs ahead alone; a refresh lands on the right beat; the host dies during the final standings
  {
    const hp = await hostPage();
    await hp.evaluate(() => {
      const s = window.__arcade.state, g = s.game, last = g.total - 1;
      const order = [...g.order]; order[last] = 'truefalse';
      return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, ci: last - 1, ck: String(last - 1), phase: 'standings', phaseEndsAt: m.serverNow(), [`deal/${last}`]: null, [`dk/${last}`]: null, [`seen/truefalse`]: true }));
    });
    const last = await evalIn(pages[1], s => s.game.total - 1);
    await waitPhase(pages[1], 'play', last, 'the last challenge', 30000);
    for (const i of alive()) await waitSpec(pages[i], 'truefalse');
    await all(alive(), i => answerTF(pages[i], i === 0 ? -1 : (i % 8)));
    await waitPhase(pages[1], 'final', last, 'the final', 45000);
    await pages[1].waitForSelector('.oc-fin .oc-st-body', { timeout: 10000 });
    ok(await pages[1].evaluate(() => document.querySelector('.oc-st-body').dataset.beat === 'answer' && !!document.querySelector('.oc-beat-answer.is-on .gk-answer')), 'THE END: the last round opens on THE ANSWER, as every round');
    // SKIP › on DANA's phone: hers moves on, nobody else's does
    const dn = alive().find(i => i >= 3);
    await pages[dn].evaluate(() => document.querySelector('.oc-fin-skip').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));
    await sleep(300);
    const [b1, bd] = await Promise.all([pages[1], pages[dn]].map(p => p.evaluate(() => document.querySelector('.oc-st-body').dataset.beat)));
    ok(b1 === 'answer' && bd !== 'answer', `SKIP › moves only that phone on (BOB ${b1} · ${NAMES[dn]} ${bd})`);
    await waitFor(pages[1], () => document.querySelector('.oc-st-body').dataset.beat === 'banner', 'the round winner beat', 12000);
    ok(await pages[1].evaluate(() => !!document.querySelector('.oc-beat-banner.is-on .oc-rw-stamp')), 'THE END: the last round\'s ROUND WINNER banner');
    await shotBoth(pages[1], 'o-16-final-round-winner');
    await waitFor(pages[1], () => document.querySelector('.oc-st-body').dataset.beat === 'final', 'the final standings beat', 15000);
    await sleep(1600);
    await shotBoth(pages[1], 'o-17-final-standings');
    const fs = await pages[1].evaluate(() => ({ n: document.querySelectorAll('.oc-fs-row').length, bottom: Math.max(...[...document.querySelectorAll('.oc-fs-row, .oc-fs-strip')].map(e => e.getBoundingClientRect().bottom)), foot: document.querySelector('.oc-st-foot').getBoundingClientRect().top, wins: [...document.querySelectorAll('.oc-fs-wins b')].map(b => +b.textContent) }));
    const rw = await evalIn(pages[1], s => { const g = s.game, n = {}; for (const r of Object.values(g.rw || {})) if (r.w) n[r.w] = (n[r.w] || 0) + 1; return Object.values(n).reduce((a, b) => a + b, 0); });
    ok(fs.n === N && fs.bottom <= fs.foot, `FINAL STANDINGS: all ${fs.n} rows + YOUR BEST / WORST above the footer at 390 × 844 (${Math.round(fs.bottom)} ≤ ${Math.round(fs.foot)})`);
    ok(fs.wins.reduce((a, b) => a + b, 0) === rw, `FINAL STANDINGS: the ROUND WINS add up to the stored round wins (${rw})`);
    // a refresh during the final standings lands on them; the host dies here too
    const rj = alive().find(i => i > 1 && i !== dn);
    await pages[rj].reload();
    await pages[rj].waitForSelector('.oc-st-body, .oc-vic', { timeout: 30000 });
    ok(await pages[rj].evaluate(() => { const b = document.querySelector('.oc-st-body'); return b ? b.dataset.beat === 'final' : !!document.querySelector('.oc-vic'); }), 'REJOIN: a refresh during the final standings lands on them');
    const hi = pages.indexOf(await hostPage());
    const oldHost = uids[hi];
    dead.add(hi); await pages[hi].close();
    log(`killed the host (${NAMES[hi]}) during the final standings`);
    const ob = pages[alive().find(i => i !== dn)];   // (a phone still on the shared clock — not the one that skipped)
    await ob.waitForSelector('.oc-vic .oc-sign', { timeout: 20000 });
    await sleep(3200);
    await shotBoth(ob, 'o-18-victory');
    const v = await ob.evaluate(() => ({ sign: document.querySelectorAll('.oc-vic .oc-sign-ch').length, podium: document.querySelectorAll('.oc-vic-step').length, chips: document.querySelectorAll('.oc-vic-chip').length, back: !!document.querySelector('.final-back'), rematch: [...document.querySelectorAll('.final button')].filter(b => /REMATCH|LOBBY/i.test(b.textContent)).length, title: (document.querySelector('.oc-vic-title') || {}).textContent }));
    ok(v.title === 'OVERCLOCKED' && v.sign > 0 && v.podium === Math.min(3, N) && v.back && !v.rematch, `THE VICTORY: OVERCLOCKED, the neon sign (${v.sign} tubes), the podium on the slim cards (${v.podium}), the console's BACK TO THE ROOM, no rematch / lobby buttons`);
    ok(v.chips >= 1, `THE VICTORY: the award chips (${v.chips})`);
    await waitFor(ob, (s, old) => s.meta.hostId !== old, 'host migrated at the end', 45000, oldHost);
    ok(true, 'host migrated during the end of the match');
  }

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { if (pages[1]) await pages[1].screenshot({ path: `${OUT}o-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}oc-new-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
