// OVERCLOCK update 2 end to end: MISSING LINK, SPELLCHECK, MAKE 24, COMPASS, SORT IT, HIGHER OR LOWER with N players (default 8).
//   node e2e-oc-2.mjs "<browser path>" ./shots
// The host's match order is set to open with the six new types. Covers: rules cards, identical puzzles on every phone,
// real UI play (typing into Missing Link, taps on spellings / tiles / operators / compass points, real touch swipes and
// half-screen taps in Sort It), scoring checked against what the host wrote, a refresh mid-Make 24 (solved puzzle kept),
// the host's phone dying mid-Sort It (migration), and every new screen + reveal at 390×844 and 412×915.
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
const SHOTS = process.env.SHOTS !== '0';
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const NEW = ['missinglink', 'spellcheck', 'make24', 'compass', 'sortit', 'higherlower'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio'] });
const pages = [];
const ctxs = [];
const dead = new Set();

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|TOO LATE/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=q${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  if (!SHOTS) return;
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(380);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(120);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(120); }
  fail(`timeout: ${what}`);
}
const OC = (page, expr) => page.evaluate(`(() => { const O = window.__oc; return O ? (${expr}) : null; })()`);
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const hostIndex = async () => {
  for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return i; } catch { /* */ } }
  return alive()[0];
};
// a finger press (these buttons react on pointerdown)
const press = (page, sel, nth = 0) => page.evaluate(([s, n]) => {
  const el = document.querySelectorAll(s)[n];
  if (!el) throw new Error(`no ${s}[${n}]`);
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
}, [sel, nth]);
const waitPhase = (page, phase, ci, what, timeout = 60000) => waitFor(page, (s, a) => s.game && s.game.ci === a.ci && s.game.phase === a.phase, what, timeout, { ci, phase });
async function waitSpec(page, type) {
  const end = Date.now() + 20000;
  while (Date.now() < end) { const t = await OC(page, 'O.spec() && O.spec().type').catch(() => null); if (t === type) return; await sleep(120); }
  fail(`${type}: challenge never mounted`);
}
const results = (page, ci) => evalIn(page, (s, c) => s.game.results && s.game.results[c], ci);
const sameSpecs = async type => { const all = await Promise.all(alive().map(i => OC(pages[i], 'JSON.stringify(O.spec())'))); return all.every(x => x === all[0]) ? JSON.parse(all[0]) : null; };
// expected points (mirrors logic.js#challengeScore; the result's parts/ok come from the host)
const COMPASS_SCRIPT = 22470;
function expectPts(type, r, b, startAt, final = false) {
  const acc = Math.min(1, r.ok / r.parts);
  const base = type === 'sortit' ? Math.round(100 * Math.min(1, r.ok / 10)) : Math.round(100 * acc);
  const [s0, span] = type === 'compass' ? [startAt + COMPASS_SCRIPT, 30000 - COMPASS_SCRIPT] : [startAt, 30000];
  const speed = r.ok >= r.parts && b && b.done ? Math.round(60 * Math.max(0, Math.min(1, 1 - (b.doneAt - s0) / span))) : 0;
  return (base + speed) * (final ? 2 : 1);
}
async function checkScores(page, ci, type, uids) {
  const res = await results(page, ci);
  const boards = await evalIn(page, s => s.live.boards || {});
  const startAt = await evalIn(page, s => s.game.playStartAt);
  let good = 0;
  for (const u of uids) if (res[u] && res[u].pts === expectPts(type, res[u], boards[u], startAt)) good++;
  ok(good === uids.length, `${type}: every player's points match the scoring rule (${good}/${uids.length})`);
  return res;
}

// Make 24 bot: finds merges [a, op, b] in the same tile layout the UI uses (result replaces b, a disappears)
function planMerges(nums) {
  const F = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = (x, y) => (y ? g(y, x % y) : Math.abs(x) || 1); const k = g(n, d); return [n / k, d / k]; };
  const ap = (a, o, b) => (o === '+' ? F(a[0] * b[1] + b[0] * a[1], a[1] * b[1]) : o === '-' ? F(a[0] * b[1] - b[0] * a[1], a[1] * b[1]) : o === '*' ? F(a[0] * b[0], a[1] * b[1]) : b[0] === 0 ? null : F(a[0] * b[1], a[1] * b[0]));
  const rec = tiles => {
    if (tiles.length === 1) return tiles[0][0] === 24 && tiles[0][1] === 1 ? [] : null;
    for (let i = 0; i < tiles.length; i++) for (let j = 0; j < tiles.length; j++) {
      if (i === j) continue;
      for (const o of ['+', '-', '*', '/']) {
        const v = ap(tiles[i], o, tiles[j]);
        if (!v) continue;
        const next = tiles.flatMap((t, k) => (k === i ? [] : k === j ? [v] : [t]));
        const rest = rec(next);
        if (rest) return [[i, o, j], ...rest];
      }
    }
    return null;
  };
  return rec(nums.map(n => [n, 1]));
}
async function playMake24(page, nums) {
  for (const [i, o, j] of planMerges(nums)) {
    if (!(await page.$$eval('.m24-tile',(t, k) => t[k].classList.contains('is-sel'), i))) { await press(page, '.m24-tile', i); await sleep(60); }
    await press(page, `.m24-op[data-op="${o}"]`); await sleep(60);
    await press(page, '.m24-tile', j); await sleep(120);
  }
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

  // ---------------- start: the six new types first, then the usual mix
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', { mode: 'standard' })));
  await waitFor(host, s => s.game && s.game.id === 'overclock', 'overclock started', 20000);
  const natural = await evalIn(host, s => s.game.order);
  const { categoryClashes } = await host.evaluate(() => import('/js/games/overclock/logic.js').then(m => ({ categoryClashes: m.categoryClashes(window.__arcade.state.game.order) })));
  ok(new Set(natural).size === 12 && categoryClashes === 0, `the dealt order: 12 different types, no category back to back (${natural.join(' ')})`);
  await host.evaluate(newTypes => {
    const s = window.__arcade.state;
    const order = [...newTypes, ...s.game.order.filter(t => !newTypes.includes(t))].slice(0, s.game.total);
    return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, seen: { [newTypes[0]]: true }, tq: {}, tUsed: 0 }));
  }, NEW);
  await waitFor(pages[1], s => s.game.order[0] === 'missinglink', 'forced order', 10000);

  // ---------------- 1. MISSING LINK
  await pages[1].waitForSelector('.oc-ready', { timeout: 15000 });
  await sleep(800);
  await shotBoth(pages[1], 'q-01-link-rules');
  await waitPhase(host, 'play', 0, 'missing link play');
  for (const i of alive()) await waitSpec(pages[i], 'missinglink');
  const ml = await sameSpecs('missinglink');
  ok(!!ml, 'MISSING LINK: the same two puzzles on every phone');
  const [a1, a2] = ml.puzzles.map(p => p.answer);
  await sleep(300);
  await shotBoth(pages[1], 'q-02-link-play');
  // BOB: a wrong guess (shakes, stays on puzzle 1), then the answer in lower case; then a plural on puzzle 2
  await pages[1].tap('.ml-input');
  await pages[1].type('.ml-input', 'zzzz');
  await pages[1].keyboard.press('Enter');
  await sleep(250);
  ok((await OC(pages[1], 'O.state().p')) === 0 && (await pages[1].$eval('.ml-hint', e => e.textContent)).includes('NOT IT'), 'MISSING LINK: a wrong guess just shakes');
  await shotBoth(pages[1], 'q-03-link-wrong');
  await pages[1].evaluate(() => { const i = document.querySelector('.ml-input'); i.value = ''; i.dispatchEvent(new Event('input')); });
  await pages[1].type('.ml-input', a1.toLowerCase());
  await waitFor(pages[1], () => window.__oc.state().ok === 1, 'BOB linked puzzle 1', 5000);
  ok(true, 'MISSING LINK: the exact answer locks in as it is typed (any case)');
  await sleep(1100);
  // keyboard up: the layout keeps words, boxes and buttons visible
  await pages[1].evaluate(() => { const r = document.querySelector('.screen.oc'); r.style.setProperty('--kb', '330px'); r.classList.add('kb-open'); });
  await sleep(200);
  const kbOk = await pages[1].evaluate(() => { const b = document.querySelector('.ml-go').getBoundingClientRect(); return b.bottom <= innerHeight - 330 + 2 && document.querySelector('.ml-word').getBoundingClientRect().top >= 0; });
  ok(kbOk, 'MISSING LINK: with the keyboard up, the words and ENTER stay above it');
  await shotBoth(pages[1], 'q-04-link-keyboard');
  await pages[1].evaluate(() => { const r = document.querySelector('.screen.oc'); r.style.removeProperty('--kb'); r.classList.remove('kb-open'); });
  await pages[1].type('.ml-input', `${a2}s`);
  await pages[1].keyboard.press('Enter');
  await waitFor(pages[1], () => window.__oc.state().done, 'BOB linked both', 5000);
  ok(true, 'MISSING LINK: a plural is accepted with ENTER');
  // ALICE solves one and skips the other; the rest: even → solve both, odd → skip then solve
  for (const i of alive().filter(i => i !== 1)) {
    const pg = pages[i];
    if (i % 2 === 1 || i === 0) {
      await press(pg, '.ml-skip');
      await sleep(1450);
    } else { await pg.type('.ml-input', a1); await sleep(1100); }
    await pg.type('.ml-input', a2);
  }
  await waitPhase(host, 'standings', 0, 'link standings', 45000);
  await sleep(1300);
  await shotBoth(pages[1], 'q-05-link-reveal');
  const r0 = await checkScores(pages[1], 0, 'missinglink', alive().map(i => uids[i]));
  ok(r0[uids[1]].ok === 2 && r0[uids[1]].pts > 100 && r0[uids[3]].ok === 1 && r0[uids[3]].pts === 50, 'MISSING LINK: 50 a link, speed bonus only for both');

  // ---------------- 2. SPELLCHECK
  await waitPhase(pages[1], 'ready', 1, 'spellcheck ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-06-spell-rules');
  await waitPhase(pages[1], 'play', 1, 'spellcheck play');
  for (const i of alive()) await waitSpec(pages[i], 'spellcheck');
  const sp = await sameSpecs('spellcheck');
  ok(!!sp && sp.items.length === 5, 'SPELLCHECK: the same five words on every phone');
  await sleep(300);
  await shotBoth(pages[1], 'q-07-spell-play');
  // player i gets the first (i % 6) right, then wrong
  for (let k = 0; k < 5; k++) {
    for (const i of alive()) {
      const right = i === 1 || k < i % 6;
      const it = sp.items[k];
      await press(pages[i], '.sp-opt', right ? it.ans : (it.ans + 1) % 4);
    }
    if (k === 0) { await sleep(150); await shotBoth(pages[2], 'q-08-spell-answer'); }
    await sleep(1250);
  }
  await waitPhase(pages[1], 'standings', 1, 'spell standings', 45000);
  await sleep(1400);
  await shotBoth(pages[1], 'q-09-spell-reveal');
  const r1 = await checkScores(pages[1], 1, 'spellcheck', alive().map(i => uids[i]));
  ok(r1[uids[1]].ok === 5 && r1[uids[1]].pts > 100 && r1[uids[2]].pts === 40, 'SPELLCHECK: 20 a word, perfect 5 earns speed');

  // ---------------- 3. MAKE 24 (+ a refresh between the puzzles)
  await waitPhase(pages[1], 'ready', 2, 'make24 ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-10-m24-rules');
  await waitPhase(pages[1], 'play', 2, 'make24 play');
  for (const i of alive()) await waitSpec(pages[i], 'make24');
  const m24 = await sameSpecs('make24');
  ok(!!m24, 'MAKE 24: the same tiles on every phone');
  ok(m24.puzzles.every(p => planMerges(p.nums)), 'MAKE 24: both puzzles solvable');
  // everyone else plays at the same time (player i: puzzle 1, evens also the hard one)
  const othersM24 = Promise.all(alive().filter(i => i !== 1).map(async i => {
    await sleep(500 * i);
    await playMake24(pages[i], m24.puzzles[0].nums);
    if (i % 2 === 0) { await sleep(1200); await playMake24(pages[i], m24.puzzles[1].nums); }
  }));
  await sleep(300);
  await shotBoth(pages[1], 'q-11-m24-play');
  // BOB: one merge, undo it, then solve puzzle 1
  await press(pages[1], '.m24-tile', 0); await press(pages[1], '.m24-op[data-op="+"]'); await press(pages[1], '.m24-tile', 1);
  await sleep(200);
  await shotBoth(pages[1], 'q-12-m24-merged');
  ok((await pages[1].$$eval('.m24-tile', t => t.length)) === 3, 'MAKE 24: two tiles merge into one');
  await pages[1].evaluate(() => [...document.querySelectorAll('.m24-actions .btn')].find(b => b.textContent.includes('UNDO')).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await sleep(150);
  ok((await pages[1].$$eval('.m24-tile', t => t.length)) === 4, 'MAKE 24: UNDO puts the tiles back');
  await playMake24(pages[1], m24.puzzles[0].nums);
  await waitFor(pages[1], () => window.__oc.state().ok === 1, 'BOB solved puzzle 1', 5000);
  await sleep(1300);
  await pages[1].reload();
  await pages[1].waitForSelector('.m24-tile', { timeout: 30000 });
  await sleep(400);
  ok((await pages[1].$eval('.ch-m24 .ch-prompt', e => e.textContent)).includes('2/2') && (await OC(pages[1], 'O.state().ok')) === 1, 'MAKE 24: a refresh keeps the solved puzzle and opens the hard one');
  await shotBoth(pages[1], 'q-13-m24-hard');
  await playMake24(pages[1], m24.puzzles[1].nums);
  await waitFor(pages[1], () => window.__oc.state().done, 'BOB solved both', 5000);
  await othersM24;
  await waitPhase(pages[1], 'standings', 2, 'make24 standings', 45000);
  await sleep(1300);
  await shotBoth(pages[1], 'q-14-m24-reveal');
  const r2 = await checkScores(pages[1], 2, 'make24', alive().map(i => uids[i]));
  ok(r2[uids[1]].ok === 2 && r2[uids[3]].ok === 1 && r2[uids[3]].pts === 50, 'MAKE 24: 50 a puzzle');

  // ---------------- 4. COMPASS
  await waitPhase(pages[1], 'ready', 3, 'compass ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-15-compass-rules');
  await waitPhase(pages[1], 'play', 3, 'compass play');
  for (const i of alive()) await waitSpec(pages[i], 'compass');
  const cp = await sameSpecs('compass');
  ok(!!cp && cp.rounds.map(r => r.turns.length).join() === '3,4,5,6,7', 'COMPASS: the same five rounds (3 → 7 turns) on every phone');
  // every phone answers as soon as ITS question shows (BOB always right; player i wrong from round i % 5 + 1)
  const compassBot = async i => {
    for (let r = 0; r < 5; r++) {
      await pages[i].waitForFunction(n => window.__oc.state().p === n && document.querySelector('.ch-compass.is-asking'), { timeout: 15000, polling: 30 }, r);
      if (i === 1 && r === 0) await pages[1].screenshot({ path: `${OUT}q-17-compass-ask-390.png` });
      const R = cp.rounds[r];
      const right = i === 1 || r < (i % 5) + 1;
      await press(pages[i], `.cp-${'nesw'[right ? R.ans : (R.ans + 2) % 4]}`);
      if (i === 1 && r === 0) { await sleep(120); await pages[1].screenshot({ path: `${OUT}q-18-compass-right-390.png` }); }
    }
  };
  const turnShot = (async () => {
    await pages[2].waitForFunction(() => window.__oc.state().p === 1 && document.querySelector('.cp-card.is-turn'), { timeout: 20000, polling: 30 });
    await pages[2].screenshot({ path: `${OUT}q-16-compass-turn-390.png` });
  })().catch(() => {});
  await Promise.all([...alive().map(compassBot), turnShot]);
  await waitPhase(pages[1], 'standings', 3, 'compass standings', 45000);
  await sleep(4200);
  await shotBoth(pages[1], 'q-19-compass-reveal');
  const r3 = await checkScores(pages[1], 3, 'compass', alive().map(i => uids[i]));
  log('compass ask times', JSON.stringify(await OC(pages[1], 'O.state().local.askAt')), 'BOB board', JSON.stringify(await evalIn(pages[1], (s, u) => ({ b: s.live.boards[u], start: s.game.playStartAt, r: s.game.results[3][u] }), uids[1])));
  ok(r3[uids[1]].ok === 5 && r3[uids[1]].pts > 100, `COMPASS: all five right earns the answer-speed bonus (${r3[uids[1]].pts})`);

  // ---------------- 5. SORT IT (+ the host's phone dies)
  await waitPhase(pages[1], 'ready', 4, 'sortit ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-20-sort-rules');
  await waitPhase(pages[1], 'play', 4, 'sortit play');
  for (const i of alive()) await waitSpec(pages[i], 'sortit');
  const so = await sameSpecs('sortit');
  ok(!!so && so.cards.length === 12, 'SORT IT: the same 12 cards on every phone');
  const hostIdx = await hostIndex();
  dead.add(hostIdx);
  await pages[hostIdx].close();
  log(`killed the host (${NAMES[hostIdx]}) mid-Sort It`);
  // the play screen at both sizes comes from a spectating bot's phone (CHARLIE), BOB plays meanwhile
  const shot = (async () => { await sleep(400); await shotBoth(pages[2], 'q-21-sort-play'); })();
  // BOB: real touch — swipes for most cards, a half-screen tap now and then, one deliberate mistake
  const box = await pages[1].$eval('.ch-sort', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const midY = box.y + box.h * 0.55;
  const bob = (async () => {
    for (;;) {
      await pages[1].waitForFunction(() => window.__oc.state().done || document.querySelector('.st-card.is-in:not(.is-out)'), { timeout: 6000, polling: 30 });
      const c = await OC(pages[1], 'O.state().done ? -1 : O.state().p');
      if (c < 0) break;
      const want = c === 5 ? 1 - so.cards[c].s : so.cards[c].s;
      const cx = box.x + box.w / 2;
      if (c % 4 === 3) await pages[1].touchscreen.tap(want ? box.x + box.w * 0.85 : box.x + box.w * 0.15, midY);
      else {
        await pages[1].touchscreen.touchStart(cx, midY);
        for (let k = 1; k <= 6; k++) { await pages[1].touchscreen.touchMove(cx + (want ? 1 : -1) * k * 22, midY + k); await sleep(12); }
        if (c === 5) await pages[1].screenshot({ path: `${OUT}q-22-sort-drag-390.png` });
        await pages[1].touchscreen.touchEnd();
      }
      await pages[1].waitForFunction(n => window.__oc.state().p > n, { timeout: 4000, polling: 30 }, c);
    }
  })();
  // the others: arrow keys, player i gets the first i % 4 cards wrong
  const kb = alive().filter(i => i !== 1 && i !== 2).map(async i => {
    for (;;) {
      const c = await pages[i].waitForFunction(() => (window.__oc.state().done ? -1 : document.querySelector('.st-card.is-in:not(.is-out)') ? window.__oc.state().p : null), { timeout: 8000, polling: 30 }).then(h => h.jsonValue());
      if (c < 0) break;
      const side = c < i % 4 ? 1 - so.cards[c].s : so.cards[c].s;
      await pages[i].keyboard.press(side ? 'ArrowRight' : 'ArrowLeft');
      await pages[i].waitForFunction(n => window.__oc.state().p > n, { timeout: 4000, polling: 30 }, c);
    }
  });
  await Promise.all([bob, shot, ...kb]);
  await waitFor(pages[1], () => window.__oc.state().done, 'BOB sorted all 12', 8000);
  const bobSort = await OC(pages[1], 'O.state().local.sort');
  ok(bobSort.right === 11 && bobSort.wrong === 1, `SORT IT: touch swipes and side taps sort the cards (${bobSort.right} right, ${bobSort.wrong} wrong; ${JSON.stringify(bobSort.log)} vs ${JSON.stringify(so.cards.map(c => c.s))})`);
  await waitFor(pages[1], (s, old) => s.meta.hostId !== old, 'host migrated', 45000, uids[hostIdx]);
  ok(true, 'SORT IT: the host migrated mid-challenge');
  await waitPhase(pages[1], 'standings', 4, 'sortit standings', 60000);
  await sleep(1600);
  await shotBoth(pages[1], 'q-23-sort-reveal');
  const r4 = await checkScores(pages[1], 4, 'sortit', alive().map(i => uids[i]));
  ok(r4[uids[1]].ok === 10.5 && r4[uids[1]].pts === 100, 'SORT IT: 11 right + 1 wrong = 10.5 net = 100, no speed bonus');
  const back = await openPlayer(hostIdx);
  dead.delete(hostIdx);
  await back.waitForSelector('.screen.oc', { timeout: 30000 });

  // ---------------- 6. HIGHER OR LOWER
  await waitPhase(pages[1], 'ready', 5, 'higherlower ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-24-hl-rules');
  await waitPhase(pages[1], 'play', 5, 'higherlower play');
  for (const i of alive()) await waitSpec(pages[i], 'higherlower');
  const hl = await sameSpecs('higherlower');
  ok(!!hl && hl.pairs.length === 10, 'HIGHER OR LOWER: the same ten pairs on every phone');
  await sleep(300);
  await shotBoth(pages[1], 'q-25-hl-play');
  const stopAt = i => (i === 1 ? 10 : [3, 99, 5, 7, 2, 8, 4, 6][i]); // BOB perfect; the others miss at pick n
  for (let k = 0; k < 10; k++) {
    for (const i of alive()) {
      if (k > stopAt(i)) continue;
      const P = hl.pairs[k];
      await press(pages[i], '.hl-opt', k === stopAt(i) ? 1 - P.ans : P.ans).catch(() => {});
    }
    if (k === 0) { await sleep(200); await shotBoth(pages[1], 'q-26-hl-values'); }
    await sleep(1350);
  }
  await waitPhase(pages[1], 'standings', 5, 'hl standings', 45000);
  await sleep(1400);
  await shotBoth(pages[1], 'q-27-hl-reveal');
  const r5 = await checkScores(pages[1], 5, 'higherlower', alive().map(i => uids[i]));
  ok(r5[uids[1]].ok === 10 && r5[uids[1]].pts > 100 && r5[uids[0]].ok === 3 && r5[uids[0]].pts === 30, 'HIGHER OR LOWER: 10 a pick, the streak ends on the first miss');
  await sleep(1000);
  await shotBoth(pages[1], 'q-28-standings');

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { if (pages[1]) await pages[1].screenshot({ path: `${OUT}q-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}oc-2-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
