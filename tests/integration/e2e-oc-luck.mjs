// OVERCLOCK OC5 — DUMB LUCK end to end on the real app (the emulators), N phones (default 8): a QUICK match with DUMB LUCK moved to the front;
// the crafted neon sign on the slam; THE ODDS BOARD (the same field on every phone, real taps: several on one horse, one on the 12-1 long shot,
// one changing her pick, one never picking); THE LOCK + THE DRAW (the stored winner = the draw of the stored picks + the lock); THE RACE on every
// phone; a REFRESH mid-race; THE HOST killed mid-race (a new host, nothing re-drawn); THE FINISH; the scoring; THE ANSWER; WINNING TICKETS /
// THE HOUSE WINS; the shared round-win rule; the standings — the screens at 390 × 844 + 412 × 915.
//   node tests/integration/e2e-oc-luck.mjs "<browser path>" ./shots-oc-luck
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
  // ---------------- the room (8 phones)
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tapReal(host, '.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.title-screen.is-room .rdk-dock', { timeout: 20000 });
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

  // ---------------- a QUICK match with DUMB LUCK first (the host's dealt order, DUMB LUCK moved to the front; it is never the last)
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', { mode: 'quick' })));
  await waitFor(host, s => s.game && s.game.id === 'overclock', 'overclock started', 20000);
  const natural = await evalIn(host, s => s.game.order);
  ok(natural.filter(t => t === 'dumbluck').length <= 1 && natural[natural.length - 1] !== 'dumbluck', `the dealt order: Dumb Luck at most once, never last (${natural.join(' ')})`);
  await host.evaluate(() => {
    const s = window.__arcade.state;
    const rest = s.game.order.filter(t => t !== 'dumbluck' && t !== 'trivia');
    const order = ['dumbluck', ...rest].slice(0, s.game.total);
    return import('/js/firebase.js').then(m => m.update(m.dbRef(`rooms/${s.code}/game`), { order, seen: { dumbluck: true }, tq: {}, tUsed: 0, deal: null, dk: null }));
  });
  await waitFor(pages[1], s => s.game.order[0] === 'dumbluck', 'forced order', 10000);

  // ---------------- THE TITLE: the crafted neon sign on the slam
  await pages[1].waitForSelector('.oc-ready .oc-dlsign', { timeout: 15000 });
  ok(await pages[1].evaluate(() => document.querySelectorAll('.oc-dlsign .oc-sign-ch').length === 8), 'THE TITLE: DUMB LUCK as a neon tube sign (8 tube letters) on the title slam');
  await sleep(600);
  await shotBoth(pages[1], 'l-01-sign');

  // ---------------- THE ODDS BOARD: the same field on every phone, picks by real taps
  await waitPhase(pages[1], 'play', 0, 'dumb luck play');
  for (const i of alive()) await waitSpec(pages[i], 'dumbluck');
  const spec = await sameSpecs('dumbluck');
  ok(!!spec && spec.field.length === 6, 'THE FIELD: the same six horses + odds on every phone');
  const field = spec.field;
  ok(field.map(f => f.name).join() === 'PINK,GREEN,CYAN,YELLOW,PURPLE,ICE WHITE' && field.map(f => f.n).sort((a, b) => a - b).join() === '2,3,4,5,8,12', `THE FIELD: ${field.map(f => `${f.name} ${f.n}-1`).join(' · ')}`);
  for (const i of alive()) await pages[i].waitForSelector('.oc-dl[data-stage="pick"] .oc-dl-card', { timeout: 10000 });
  const lane = n => field.findIndex(f => f.n === n);
  const LONG = lane(12), FAV = lane(2), MID = lane(4), OTHER = lane(5);
  // BOB the long shot · CHARLIE + DANA + EVE + ALICE on the favourite (EVE changes her mind first) · FINN 5-1 · GRACE 4-1 · HAL never picks
  const want = { 0: FAV, 1: LONG, 2: FAV, 3: FAV, 4: FAV, 5: OTHER, 6: MID };
  await press(pages[4], '.oc-dl-card', MID);
  await sleep(500);
  for (const [i, l] of Object.entries(want)) if (Number(i) < N) await press(pages[i], '.oc-dl-card', l);
  await waitFor(pages[1], (s, a) => { const b = s.live.boards || {}; return a.every(([u, l]) => b[u] && b[u].p === l + 1 && b[u].n === 6); }, 'the picks reached the room', 10000, Object.entries(want).filter(([i]) => Number(i) < N).map(([i, l]) => [uids[i], l]));
  await sleep(400);
  const board = await pages[1].evaluate(l => ({ mine: document.querySelectorAll('.oc-dl-card.is-mine').length, mineLane: [...document.querySelectorAll('.oc-dl-card')].findIndex(c => c.classList.contains('is-mine')), tags: [...document.querySelectorAll('.oc-dl-card')].map(c => c.querySelector('.oc-dl-tags').textContent) }), LONG);
  ok(board.mine === 1 && board.mineLane === LONG, `THE ODDS BOARD: BOB's card fills (the long shot, lane ${LONG + 1})`);
  ok(/\+\d/.test(board.tags[FAV]), `THE ODDS BOARD: several on one horse ride as a name tag ("${board.tags[FAV]}")`);
  await shotBoth(pages[1], 'l-02-odds-board');
  await shotBoth(pages[2], 'l-03-odds-board-crowd');

  // ---------------- THE LOCK + THE DRAW (the host, once — after the gate)
  await waitFor(pages[1], s => !!(s.game.dl && s.game.dl[0] && Number.isInteger(s.game.dl[0].w)), 'the lock', 15000);
  const dl = await evalIn(pages[1], s => s.game.dl[0]);
  const expectPk = Object.fromEntries(Object.entries(want).filter(([i]) => Number(i) < N).map(([i, l]) => [uids[i], l]));
  ok(JSON.stringify(Object.fromEntries(Object.entries(dl.pk).sort())) === JSON.stringify(Object.fromEntries(Object.entries(expectPk).sort())), `THE LOCK: every pick as tapped last (EVE changed hers), HAL no ticket (${JSON.stringify(dl.pk)})`);
  const playStartAt = await evalIn(pages[1], s => s.game.playStartAt);
  ok(dl.lk - playStartAt >= 7000 && dl.lk - playStartAt < 9000, `THE LOCK: after the 7-s odds board (${dl.lk - playStartAt} ms)`);
  const draw = await pages[1].evaluate(a => import('/js/games/overclock/luck.js').then(L => L.dlDraw(window.__arcade.state.game.seed, 0, L.dlField(window.__arcade.state.game.seed, 0), a.pk, a.lk)), dl);
  ok(draw === dl.w, `THE DRAW: the stored winner = the draw of the stored picks + the lock (${field[dl.w].name} ${field[dl.w].n}-1)`);
  for (const i of alive()) await pages[i].waitForSelector('.oc-dl[data-stage="race"]', { timeout: 10000 });
  ok(true, 'THE RACE on every phone');
  await sleep(2500);
  await shotBoth(pages[1], 'l-04-race');

  // ---------------- a REFRESH mid-race lands on the same race at the same moment
  const gi = Math.min(6, N - 1);
  await pages[gi].reload();
  await pages[gi].waitForSelector('.oc-dl[data-stage="race"], .oc-dl[data-stage="finish"]', { timeout: 30000 });
  const atRace = await pages[gi].evaluate(() => import('/js/firebase.js').then(m => m.serverNow())).then(now => now - dl.lk);
  ok(atRace > 4000 && atRace < 16000, `REFRESH mid-race: ${NAMES[gi]} is back in the same race, ${Math.round(atRace / 1000)} s in`);
  ok(await pages[gi].evaluate(() => { const c = document.querySelector('.oc-dl-cv'); return !!c && c.width > 300 && c.height > 300; }), 'REFRESH mid-race: the track redrawn (the canvas sized)');

  // ---------------- THE HOST DIES mid-race: a new host takes over, nothing re-draws
  const hi = await hostIndex();
  const oldHost = uids[hi];
  dead.add(hi); await pages[hi].close();
  log(`killed the host (${NAMES[hi]}) mid-race`);
  const ob = pages[1];
  await waitFor(ob, (s, old) => s.meta.hostId && s.meta.hostId !== old, 'a new host', 30000, oldHost);
  ok(true, 'HOST CHANGE mid-race: a new host');
  // THE FINISH: the freeze, the winner, the payouts
  await ob.waitForSelector('.oc-dl-result.is-on', { timeout: 25000 });
  const fin = await ob.evaluate(() => ({ text: document.querySelector('.oc-dl-result').textContent, long: !!document.querySelector('.oc-dl-long'), photo: !!document.querySelector('.oc-dl-photo') }));
  ok(fin.text.includes(`${field[dl.w].name} WINS`), `THE FINISH: "${field[dl.w].name} WINS" (${fin.text.slice(0, 80)})`);
  ok(fin.long === (field[dl.w].n >= 8), `THE FINISH: LONG SHOT! only for an 8-1 / 12-1 win (${fin.long})`);
  await sleep(700);
  await shotBoth(ob, 'l-05-finish');
  await waitPhase(ob, 'standings', 0, 'dumb luck standings', 30000);
  const dl2 = await evalIn(ob, s => s.game.dl[0]);
  ok(JSON.stringify(dl2) === JSON.stringify(dl), 'HOST CHANGE: the stored race is untouched (never re-drawn)');
  const res = await results(ob, 0);
  const pay = 20 * (field[dl.w].n + 1);
  const goodPts = Object.keys(res).every(u => res[u].pts === (dl.pk[u] === dl.w ? pay : 0));
  ok(goodPts, `SCORING: the winning tickets +${pay}, everyone else 0 (${JSON.stringify(Object.fromEntries(Object.entries(res).map(([u, r]) => [u.slice(0, 4), r.pts])))})`);
  // THE ANSWER → WINNING TICKETS / THE HOUSE WINS → the standings
  await ob.waitForSelector('.oc-beat-answer.is-on .oc-ans-dl-order', { timeout: 10000 });
  ok(await ob.evaluate(() => document.querySelectorAll('.oc-ans-dl-order li').length === 6), 'THE ANSWER: the whole field\'s finishing order (6 rows)');
  await shotBoth(ob, 'l-06-answer');
  await waitFor(ob, () => document.querySelector('.oc-st-body') && document.querySelector('.oc-st-body').dataset.beat === 'banner', 'the banner beat', 12000);
  const winners = Object.keys(dl.pk).filter(u => dl.pk[u] === dl.w);
  const stamp = await ob.evaluate(() => document.querySelector('.oc-beat-banner.is-on .oc-rw-stamp b').textContent);
  ok(stamp === (winners.length ? 'WINNING TICKETS' : 'THE HOUSE WINS'), `THE HAND-OFF: ${stamp} (${winners.length} winning ticket(s))`);
  await shotBoth(ob, 'l-07-banner');
  const rw = await evalIn(ob, s => s.game.rw[0]);
  ok(winners.length === 1 ? rw.w === winners[0] : winners.length > 1 ? !!rw.t : !!rw.n, `THE ROUND WIN = the shared rule (a shared ticket is no sole win) ${JSON.stringify(rw)}`);
  await waitFor(ob, () => document.querySelector('.oc-st-body').dataset.beat === 'stand', 'the standings beat', 12000);
  await sleep(1400);
  await shotBoth(ob, 'l-08-standings');

  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length || checks.some(c => !c.ok)) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { if (pages[1]) await pages[1].screenshot({ path: `${OUT}l-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}oc-luck-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
