// OVERCLOCK update 2 end to end: MISSING LINK, SPELLCHECK, COMPASS, SORT IT, HIGHER OR LOWER with N players (default 8). (MAKE 24 was cut in OC2.)
//   node e2e-oc-2.mjs "<browser path>" ./shots
// The host's match order is set to open with the five newer types. Covers: rules cards, identical puzzles on every phone,
// real UI play (typing into Missing Link, taps on spellings / compass points, real touch swipes and
// half-screen taps in Sort It), scoring checked against what the host wrote,
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
const NEW = ['missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower'];
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
  // (OC3) THE LETTER KEYBOARD — a finger on each glass key; no input element anywhere (the system keyboard never opens)
  const kbType = async (pg, word) => { for (const ch of String(word).toUpperCase()) await press(pg, `.gk-kb-key[data-k="${ch}"]`); };
  const kbGo = pg => press(pg, '.gk-keyboard .gk-go');
  ok(await pages[1].evaluate(() => !document.querySelector('.screen.oc input, .screen.oc textarea')), 'MISSING LINK: no input element — never the system keyboard');
  const fits = await pages[1].evaluate(() => { const g = document.querySelector('.gk-keyboard .gk-go').getBoundingClientRect(), w = document.querySelector('.oc-ml-word').getBoundingClientRect(), sl = document.querySelector('.oc-ml-slot').getBoundingClientRect(); return g.bottom <= innerHeight + 1 && w.top >= 0 && sl.bottom <= document.querySelector('.gk-keyboard').getBoundingClientRect().top + 1; });
  ok(fits, 'MISSING LINK: the clues, the slot and the whole keyboard (GO included) on screen at once');
  // BOB: a wrong guess (shakes, stays on puzzle 1), then the answer typed on a COMPUTER keyboard in lower case (keydown → the kit keyboard;
  // after a wrong GO the next letter starts a fresh word); then a plural on puzzle 2 on the glass keys
  await kbType(pages[1], 'zzzz');
  await kbGo(pages[1]);
  await sleep(250);
  ok((await OC(pages[1], 'O.state().p')) === 0 && (await pages[1].$eval('.oc-ml-hint', e => e.textContent)).includes('NOT IT'), 'MISSING LINK: a wrong guess just shakes');
  await shotBoth(pages[1], 'q-03-link-wrong');
  await pages[1].keyboard.type(a1.toLowerCase());
  await waitFor(pages[1], () => window.__oc.state().ok === 1, 'BOB linked puzzle 1', 5000);
  ok(true, 'MISSING LINK: the exact answer locks in as it is typed (any case, a computer keyboard too; a fresh word after a miss)');
  await sleep(1100);
  await shotBoth(pages[1], 'q-04-link-puzzle2');
  await kbType(pages[1], `${a2}s`);
  await kbGo(pages[1]);
  await waitFor(pages[1], () => window.__oc.state().done, 'BOB linked both', 5000);
  ok(true, 'MISSING LINK: a plural is accepted with GO');
  // ALICE solves one and skips the other; the rest: even → solve both, odd → skip then solve
  for (const i of alive().filter(i => i !== 1)) {
    const pg = pages[i];
    if (i % 2 === 1 || i === 0) {
      await press(pg, '.oc-ml-skip');
      await sleep(1450);
    } else { await kbType(pg, a1); await sleep(1100); }
    await kbType(pg, a2);
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
  // (OC3B) the spellings in the plain UPRIGHT face — never slanted (letters must be easy to compare)
  ok(await pages[1].evaluate(() => [...document.querySelectorAll('.oc-sp-word')].every(e => { const cs = getComputedStyle(e); return cs.fontStyle === 'normal' && (cs.transform === 'none' || cs.transform === ''); }) && document.querySelectorAll('.oc-sp-opt').length === 4), 'SPELLCHECK: four style-C tiles, the spellings upright');
  // player i gets the first (i % 6) right, then wrong
  for (let k = 0; k < 5; k++) {
    for (const i of alive()) {
      const right = i === 1 || k < i % 6;
      const it = sp.items[k];
      await press(pages[i], '.oc-sp-opt', right ? it.ans : (it.ans + 1) % 4);
    }
    if (k === 0) { await sleep(150); await shotBoth(pages[2], 'q-08-spell-answer'); }
    await sleep(1250);
  }
  await waitPhase(pages[1], 'standings', 1, 'spell standings', 45000);
  await sleep(1400);
  await shotBoth(pages[1], 'q-09-spell-reveal');
  const r1 = await checkScores(pages[1], 1, 'spellcheck', alive().map(i => uids[i]));
  ok(r1[uids[1]].ok === 5 && r1[uids[1]].pts > 100 && r1[uids[2]].pts === 40, 'SPELLCHECK: 20 a word, perfect 5 earns speed');

  // ---------------- 3. COMPASS
  await waitPhase(pages[1], 'ready', 2, 'compass ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-15-compass-rules');
  await waitPhase(pages[1], 'play', 2, 'compass play');
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
  await waitPhase(pages[1], 'standings', 2, 'compass standings', 45000);
  await sleep(4200);
  await shotBoth(pages[1], 'q-19-compass-reveal');
  const r3 = await checkScores(pages[1], 2, 'compass', alive().map(i => uids[i]));
  log('compass ask times', JSON.stringify(await OC(pages[1], 'O.state().local.askAt')), 'BOB board', JSON.stringify(await evalIn(pages[1], (s, u) => ({ b: s.live.boards[u], start: s.game.playStartAt, r: s.game.results[2][u] }), uids[1])));
  ok(r3[uids[1]].ok === 5 && r3[uids[1]].pts > 100, `COMPASS: all five right earns the answer-speed bonus (${r3[uids[1]].pts})`);

  // ---------------- 4. SORT IT (+ the host's phone dies)
  await waitPhase(pages[1], 'ready', 3, 'sortit ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-20-sort-rules');
  await waitPhase(pages[1], 'play', 3, 'sortit play');
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
  await waitPhase(pages[1], 'standings', 3, 'sortit standings', 60000);
  await sleep(1600);
  await shotBoth(pages[1], 'q-23-sort-reveal');
  const r4 = await checkScores(pages[1], 3, 'sortit', alive().map(i => uids[i]));
  ok(r4[uids[1]].ok === 10.5 && r4[uids[1]].pts === 100, 'SORT IT: 11 right + 1 wrong = 10.5 net = 100, no speed bonus');
  const back = await openPlayer(hostIdx);
  dead.delete(hostIdx);
  await back.waitForSelector('.screen.oc', { timeout: 30000 });

  // ---------------- 5. HIGHER OR LOWER
  await waitPhase(pages[1], 'ready', 4, 'higherlower ready');
  await sleep(800);
  await shotBoth(pages[1], 'q-24-hl-rules');
  ok(await pages[1].evaluate(() => !!document.querySelector('.gk-slam .oc-demo-hl .oc-hl-card') && document.querySelectorAll('.gk-slam .oc-demo-hl .oc-hl-card').length === 2), 'HIGHER OR LOWER: its ~3 s DEMO plays in the rules card (two cards, the buttons)');
  await waitPhase(pages[1], 'play', 4, 'higherlower play');
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
      // (OC3B) the hidden card's value vs the known one: HIGHER is right when it's the bigger (the winner rule unchanged)
      const up = P.b.v > P.a.v, right = k !== stopAt(i);
      await press(pages[i], `.oc-hl-btn.is-${(right ? up : !up) ? 'up' : 'down'}`).catch(() => {});
    }
    if (k === 0) { await sleep(200); await shotBoth(pages[1], 'q-26-hl-values'); }
    await sleep(1350);
  }
  await waitPhase(pages[1], 'standings', 4, 'hl standings', 45000);
  await sleep(1400);
  await shotBoth(pages[1], 'q-27-hl-reveal');
  const r5 = await checkScores(pages[1], 4, 'higherlower', alive().map(i => uids[i]));
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
