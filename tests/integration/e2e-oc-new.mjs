// OVERCLOCK's newer challenges end to end: LEXICON, TIMELINE, CLOSEST CALL, REWIRE with N players (default 8).
//   node e2e-oc-new.mjs "<browser path>" ./shots
// The host's match order is set to open with the four new types (then the usual mix). Covers: rules cards,
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
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
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
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  const uids = [];
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);

  // ---------------- start: the four new types first, then the usual mix (12 different)
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', { mode: 'standard' })));
  await waitFor(host, s => s.game && s.game.id === 'overclock', 'overclock started', 20000);
  await host.evaluate(() => {
    const s = window.__arcade.state;
    const first = ['lexicon', 'timeline', 'closest', 'rewire'];
    const order = [...first, ...s.game.order.filter(t => !first.includes(t))].slice(0, s.game.total);
    return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, seen: { lexicon: true }, tq: {}, tUsed: 0 }));
  });
  await waitFor(pages[1], s => s.game.order[0] === 'lexicon', 'forced order', 10000);
  const order = await evalIn(host, s => s.game.order);
  ok(new Set(order).size === order.length, `no repeated types in the match (${order.length} different)`);
  log('order', order.join(' '));

  // ---------------- 1. LEXICON
  await pages[1].waitForSelector('.oc-ready', { timeout: 15000 });
  await sleep(700);
  await shotBoth(pages[1], 'o-01-lexicon-rules');
  await waitPhase(host, 'play', 0, 'lexicon play');
  for (const i of alive()) await waitSpec(pages[i], 'lexicon');
  const lexSpecs = await Promise.all(alive().map(i => OC(pages[i], '({ max: O.spec().max, best: O.spec().best, letters: [...O.spec().letters].sort().join("") })')));
  ok(lexSpecs.every(x => JSON.stringify(x) === JSON.stringify(lexSpecs[0])), 'LEXICON: the same letters on every phone');
  ok(lexSpecs[0].max >= 7, `LEXICON: a ${lexSpecs[0].max}-letter word is possible`);
  const words = await OC(pages[1], 'O.spec().words');
  // BOB types a 5-letter word through the tiles, then a 4-letter one
  async function typeWord(page, w) {
    for (const ch of w) {
      const n = await page.evaluate(c => [...document.querySelectorAll('.lx-tile')].findIndex(b => !b.disabled && b.textContent.toLowerCase() === c), ch);
      await press(page, '.lx-tile', n);
      await sleep(40);
    }
    await click(page, '.lx-go');
    await sleep(250);
  }
  const five = words.find(w => w.length === 5), four = words.find(w => w.length === 4);
  await typeWord(pages[1], five);
  await typeWord(pages[1], four);
  await sleep(300);
  await shotBoth(pages[1], 'o-02-lexicon-play');
  ok((await OC(pages[1], 'O.state().extra.w')) === five, 'LEXICON: only the longest word counts (5 beats 4)');
  // ALICE finds a longest word → done early with the speed bonus; others land somewhere in between
  await typeWord(pages[0], lexSpecs[0].best[0]);
  await waitFor(pages[0], () => window.__oc.state().done, 'ALICE done on the longest word', 6000);
  for (const i of alive().filter(i => i > 1)) {
    const w = words.find(x => x.length === 3 + (i % 4)) || words[words.length - 1];
    await typeWord(pages[i], w);
  }
  await waitPhase(host, 'standings', 0, 'lexicon standings', 45000);
  await sleep(1600);
  await shotBoth(pages[1], 'o-03-lexicon-reveal');
  const r0 = await evalIn(host, s => s.game.results[0]);
  ok(r0[uids[0]].ok === 6 && r0[uids[0]].pts > 100, `LEXICON: the longest word scores full + speed (${r0[uids[0]].pts})`);
  ok(r0[uids[1]].ok === Math.max(0, 6 - (lexSpecs[0].max - 5)) && r0[uids[1]].pts === Math.round(100 * r0[uids[1]].ok / 6), `LEXICON: BOB's 5-letter word = ${r0[uids[1]].pts} pts, no speed bonus`);

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
