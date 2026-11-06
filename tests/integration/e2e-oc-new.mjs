// OVERCLOCK's newer challenges end to end: TRUE OR FALSE (OC1's look + the combo + the after-challenge skip), TIMELINE, CLOSEST CALL, REWIRE
// with N players (default 8). (LEXICON was cut in OC1.)
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
  await host.evaluate(() => {
    const s = window.__arcade.state;
    const first = ['truefalse', 'timeline', 'closest', 'rewire'];
    const order = [...first, ...s.game.order.filter(t => !first.includes(t))].slice(0, s.game.total);
    return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, seen: { truefalse: true }, tq: {}, tUsed: 0 }));
  });
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
  ok(await evalIn(host, s => !!(s.game.deal && s.game.deal[0] && s.game.deal[0].length === 4)), 'THE NIGHT MEMORY: the host dealt the four facts');
  // ALICE answers all 8 right; BOB misses the 4th (a 4-in-a-row, then 4 more); everyone else misses one somewhere
  async function answerTF(page, wrongAt) {
    await page.evaluate(async miss => {
      const sp = window.__oc.spec();
      for (let k = 0; k < sp.items.length; k++) {
        for (let w = 0; w < 40 && !document.querySelector('.tf-btn:not([disabled])'); w++) await new Promise(r => setTimeout(r, 40));
        const truth = sp.items[k].truth, pickTrue = k === miss ? !truth : truth;
        const b = document.querySelector(pickTrue ? '.tf-true' : '.tf-false');
        b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, k === miss ? 900 : 360));
      }
    }, wrongAt);
  }
  await answerTF(pages[0], -1);
  await sleep(200);
  await shotBoth(pages[0], 'o-02-truefalse-done');
  await all(alive().filter(i => i > 0), i => answerTF(pages[i], i === 1 ? 3 : i % 8));
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
  await all(alive(), i => pages[i].waitForSelector('.oc-next-btn', { timeout: 8000 }).then(() => pages[i].evaluate(() => document.querySelector('.oc-next-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })))));
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
  await press(pages[1], '.tm-item', correct[0]);
  await press(pages[1], '.tm-item', correct[2]);
  await press(pages[1], '.tm-item', correct[2]); // undo
  await press(pages[1], '.tm-item', correct[1]);
  await sleep(250);
  await shotBoth(pages[1], 'o-05-timeline-play');
  await press(pages[1], '.tm-item', correct[2]);
  await press(pages[1], '.tm-item', correct[3]);
  await click(pages[1], '.tl-submit');
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
    for (const n of picks) await press(pages[i], '.tm-item', n);
    await click(pages[i], '.tl-submit');
  }
  await waitFor(pages[1], (s, old) => s.meta.hostId !== old, 'host migrated', 45000, oldHost);
  ok(true, 'host migrated mid-challenge');
  await waitPhase(pages[1], 'standings', 1, 'timeline standings', 60000);
  await sleep(2000);
  await shotBoth(pages[1], 'o-07-timeline-reveal');
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
  async function keyIn(page, value) {
    for (const ch of String(value)) await press(page, '.cl-pad .kp', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].indexOf(ch));
  }
  const guesses = {};
  for (const i of alive()) {
    const g = Math.max(1, Math.round(cSpec.answer * factors[i % factors.length]));
    guesses[uids[i]] = g;
    await keyIn(pages[i], g);
    if (i === 1) { await sleep(200); await shotBoth(pages[1], 'o-09-closest-play'); }
    await click(pages[i], '.cl-lock');
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
