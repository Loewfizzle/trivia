// THE DAILY MODULE — THE SCREENS end to end (DM2 — docs/progression.md "THE DAILY MODULE — DM2"; the emulators + `DAILY_TEST=1 node
// scripts/serve.mjs <port> --emu`):   node e2e-daily.mjs "<browser>" ./shots-daily        (E2E_BASE=http://localhost:<port>; SHOTS=0)
// THE DOCK BUTTON (the title preview: off → no button, the pill's 3 old icons; WAITING + the count; ALL DONE + the check) → the REAL app on the
// emulators: WAITING · 3 (THE PASSWORD, COAST CLEAR + DAILY_TEST's fake = the FAKE 3rd daily) → THE DAILY SCREEN (TODAY's tickets, SCORES: a
// friend who played shows PLAYED, never the score) → THE ONE-TIME HINT once (DFIX3: one line under the real board; gone on the first number; seen on
// the profile; the next open shows none) → THE PASSWORD cracked in the overlay → DONE + "1ST OF 2 AT YOUR TABLE" → THE ROOM WINS
// (a host + this phone in a room: the ☰ row → the dailies → RESUME COAST CLEAR; the host's "1 PLAYER IS MID-DAILY"; the host starts OVERCLOCK →
// the banner, the run held + PAUSED on the server; back to the room → RESUME YOUR DAILY → the run resumes, unpaused) → COAST CLEAR cleared by
// taps → THE SWEEP (the meter fills, SWEPT; dl.sw + the +10 bonus) → the dock ALL DONE. A same-day profile: YOUR SCORE COUNTS FROM TOMORROW.
// DFIX2: SCORES = SLIM CARDS (a finisher's strip, the rank left, the score under, YOU framed, STILL TO PLAY in one line; no leak over 30 opens);
// the host's MID-DAILY line from the player's OWN flag (players/{uid}/dy — no poll); a room of ONE can't pause (the hold stays, the clock runs);
// the 4 am turn on an open DAILY screen (a stale answer re-read, no reload).
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.DAILY_TEST ||= '1';   // (this process calls /api/daily directly for BOBBY — the dailies open as on the test server)
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { ref, val } from '../../api/_lib/fb.js';
import { pwDay, pwLists } from '../../api/_lib/pw.js';
import { ccBoard } from '../../api/_lib/cc.js';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { pausesOf } from '../../js/games/coastclear/logic.js';
import { streakDay } from '../../js/core/streak.js';
import { SWEEP_XP, DAILY_XP } from '../../js/core/daily.js';

const H = await createHarness({ name: 'daily', slot: 'dy', sizes: [[390, 844], [402, 874], [430, 932]] });
const { log, sleep, ok, BASE, browser } = H;
const day = streakDay(Date.now());
const WEEK_AGO = Date.now() - 7 * 864e5;
let W1 = '', W2 = '', MISS = '';
/** the day's pair the SERVER judges from (its stored pair — never recomputed here: the server's own memo + THE DAILY SECRET decide) */
async function words() {
  [W1, W2] = (await pwDay(day)).words;
  const bad = new Set((W1 + W2).split(''));
  MISS = pwLists().answers.find(w => new Set(w).size === 5 && ![...w].some(c => bad.has(c))) || 'XXXXX';
}

const ev = (p, js) => p.evaluate(js);
const waitFor = (p, js, what, timeout = 20000) => p.waitForFunction(js, { timeout, polling: 100 }).catch(e => { throw new Error(`${what}: ${e.message}`); });
async function openApp(slot, name) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource/i.test(m.text())) H.errors.push(`${name}: ${m.text()}`); });
  await page.setViewport(H.VIEW);
  await page.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-daily'));
  await page.evaluate((s, n) => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, slot, name);
  await page.reload();
  await waitFor(page, `!document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem('na:${slot}:me') || 'null') || {}).pid`, `${name}: the title + a profile`, 40000);
  const pid = await page.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).pid, slot);
  return { ctx, page, pid };
}
const backdate = pid => ref(`ppriv/${pid}/at`).set(WEEK_AGO);   // (an old member: its results COUNT — THE THROWAWAY GATE)
const api = (p, body) => p.evaluate(b => import('/js/profile/api.js').then(m => m.api('daily', b)), body);
const today = p => p.evaluate(() => import('/js/daily/today.js').then(m => m.loadToday({ fresh: true })));
const dock = p => p.evaluate(() => { const t = document.querySelector('.nd-flank:not(.rdk-dock) .nd-tab-daily'); const pill = document.querySelector('.nd-flank:not(.rdk-dock) .nd-pill'); return t ? { hidden: t.hidden, state: t.dataset.state || '', n: t.querySelector('.nd-dy-n').textContent, ok: getComputedStyle(t.querySelector('.nd-dy-ok')).display !== 'none', four: pill.classList.contains('is-four'), tabs: [...pill.querySelectorAll('.nd-tab')].filter(x => !x.hidden).length } : null; });
const tickets = p => p.$$eval('.dy-ticket', ts => ts.map(t => `${t.dataset.id}:${(t.className.match(/is-(waiting|progress|done)/) || [])[1]}`));
const click = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error(`no ${s}`); e.click(); }, sel);
const up = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) throw new Error(`no ${s}`); e.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); }, sel);

await H.run(async () => {
  // (nothing of the day's own data is wiped — the stored pair + board stay the server's; every phone here is a fresh profile; BOBBY's old try goes)

  // ================================================================ 1. THE DOCK BUTTON's states (the title preview — the switch off / on)
  { const ctx = await browser.createBrowserContext(), p = await ctx.newPage(); await p.setViewport(H.VIEW);
    const at = async q => { await p.goto(`${BASE}/tests/integration/title-preview.html?${q}`); await waitFor(p, '!!document.querySelector(".nd-flank .nd-tab-daily") && !!window.__district', 'the title preview', 40000); await sleep(400); return dock(p); };
    let d = await at('daily=off');
    ok(d && d.hidden && !d.four && d.tabs === 3, `OFF (no live daily): no DAILY button — the pill's 3 old icons exactly as before (${JSON.stringify(d)})`);
    d = await at('daily=waiting&of=2&left=2');
    ok(d && !d.hidden && d.state === 'waiting' && d.n === '2' && d.four && d.tabs === 4, `WAITING: DAILY lit + the count (2 left) — 4 icons (${JSON.stringify(d)})`);
    d = await at('daily=waiting&of=3&left=3');
    ok(d && d.n === '3', `a FAKE 3rd daily: the count follows the registry → 3 (${d && d.n})`);
    d = await at('daily=done&of=2');
    ok(d && !d.hidden && d.state === 'done' && d.n === '' && d.ok, `ALL DONE: the dock's own style + a drawn check, no count (${JSON.stringify(d)})`);
    const fit = await p.evaluate(() => { const r = document.querySelector('.nd-flank:not(.rdk-dock)').getBoundingClientRect(); return { l: r.left, r: innerWidth - r.right }; });
    ok(fit.l >= 8 && fit.r >= 8, `the 4-icon dock fits at 390 with a gutter (${Math.round(fit.l)} / ${Math.round(fit.r)} px)`);
    await ctx.close(); }

  // ================================================================ 2. the real app: a friend, a member, the dock on the emulators
  const B = await profileAction('e2e-dy-bob', { action: 'ensure', name: 'BOBBY', avatar: 'bolt', color: 'cyan' }, '', WEEK_AGO);
  const bobPid = B.pid; await backdate(bobPid);
  await ref('/').update(Object.fromEntries(['s', 'r', 'p', 'x'].map(k => [`dly/password/${day}/${k}/${bobPid}`, null])));
  const A = await openApp('dya', 'ALICE'); await backdate(A.pid);
  await ref('/').update({ [`pfr/${A.pid}/f/${bobPid}`]: Date.now(), [`pfr/${bobPid}/f/${A.pid}`]: Date.now() });   // (friends — FRIENDS A's shape)
  // BOBBY cracks THE PASSWORD in three (a miss first)
  await dailyAction('e2e-dy-bob', { action: 'start', game: 'password' });
  await words();
  for (const w of [MISS, W1, W2]) await dailyAction('e2e-dy-bob', { action: 'guess', game: 'password', word: w });
  const bf = await dailyAction('e2e-dy-bob', { action: 'finish', game: 'password' });
  log(`BOBBY's PASSWORD: ${bf.score}`);
  await today(A.page);
  await waitFor(A.page, `(() => { const t = document.querySelector('.nd-tab-daily'); return t && !t.hidden; })()`, 'the DAILY button', 20000);
  let d = await dock(A.page);
  ok(d.state === 'waiting' && d.n === '3', `the REAL app: WAITING · ${d.n} (THE PASSWORD, COAST CLEAR + the fake 3rd — DAILY_TEST's test daily)`);
  // the fake 3rd daily, finished through /api (its seed → the target)
  const s = await api(A.page, { action: 'start', game: 'test' });
  await api(A.page, { action: 'finish', game: 'test', result: { guess: s.seed % 1000 } });
  await today(A.page);
  await waitFor(A.page, `document.querySelector('.nd-tab-daily .nd-dy-n').textContent === '2'`, 'the count after one finish', 8000);
  ok(true, 'the count follows the finishes: 3 → 2');

  // ================================================================ 3. THE DAILY SCREEN: TODAY + SCORES
  await click(A.page, '.nd-tab-daily');
  await waitFor(A.page, `document.querySelectorAll('.dy-ticket').length === 3`, 'THE DAILY SCREEN', 10000);
  let tk = await tickets(A.page);
  ok(tk.join() === 'password:waiting,coastclear:waiting,test:done', `TODAY: one ticket per live daily, in the list's order (${tk.join(', ')})`);
  const look = await A.page.evaluate(() => ({ pills: [...document.querySelectorAll('.dy-overlay *')].filter(e => parseFloat(getComputedStyle(e).borderRadius) >= 40 && e.getBoundingClientRect().width > 60).length, emoji: /\p{Extended_Pictographic}/u.test(document.querySelector('.dy-overlay').innerText), seg: document.querySelectorAll('.dy-seg').length, next: document.querySelector('.dy-next').textContent, menu: getComputedStyle(document.querySelector('.menu-btn')).display }));
  ok(look.pills === 0 && !look.emoji && look.seg === 3 && /^NEW DAILIES IN \d+:\d\d:\d\d$/.test(look.next) && look.menu === 'none', `TODAY's look: no pills, no emoji, THE SWEEP meter of 3, the 4 am countdown ("${look.next}"), BACK in the ☰'s corner`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-01-today');
  await click(A.page, '.dy-tab:nth-child(2)');
  await waitFor(A.page, `!!document.querySelector('.dy-sec')`, 'SCORES', 6000);
  // DFIX2 — SLIM CARDS: BOBBY (played, his score hidden) = his strip + PLAYED under it; ALICE hasn't played → STILL TO PLAY · YOU
  await waitFor(A.page, `[...document.querySelectorAll('.dy-sec[data-id="password"] .dy-cards')].length === 1 && !!document.querySelector('.dy-sec[data-id="password"] .dy-cards').dataset.strips`, 'the strips on SCORES', 10000);
  const sc = await A.page.evaluate(() => [...document.querySelectorAll('.dy-sec')].map(s => ({ h: s.querySelector('.dy-sec-h').textContent, rows: [...s.querySelectorAll('.dy-crow')].map(r => r.innerText.replace(/\s+/g, ' ').trim()),
    strips: s.querySelectorAll('.dy-crow .vl-strip').length, still: (s.querySelector('.dy-still') || {}).textContent || '', canvases: s.querySelectorAll('.fx-host canvas').length })));
  const pwSec = sc.find(x => /PASSWORD/.test(x.h));
  ok(pwSec && pwSec.rows.some(r => /BOBBY.*PLAYED/.test(r)) && !pwSec.rows.some(r => /GUESS/.test(r)), `SCORES before you play: YOUR TABLE shows BOBBY PLAYED — never his score (${pwSec && pwSec.rows.join(' | ')})`);
  ok(pwSec && pwSec.strips === 1 && pwSec.rows.length === 1 && /STILL TO PLAY · YOU/.test(pwSec.still) && pwSec.canvases <= 1, `DFIX2 — SLIM CARDS: BOBBY's row is his slim card (${pwSec && pwSec.strips} strip, ${pwSec && pwSec.canvases} effect canvas for the panel); ALICE in one line: "${pwSec && pwSec.still}"`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-07-scores-before');
  // (BOARD 2.0 B — ALL TIME OPENED: TODAY'S SCORES · ALL TIME on SCORES; ALL TIME = YOUR TABLE's average a day + EVERYONE's top 3, never an empty tab)
  ok(await A.page.evaluate(() => [...document.querySelectorAll('.dy-scope-b')].map(b => b.textContent).join('|') === 'TODAY’S SCORES|ALL TIME'), 'SCORES: TODAY’S SCORES · ALL TIME (BOARD 2.0 B opened it)');
  await A.page.evaluate(() => [...document.querySelectorAll('.dy-scope-b')].find(b => /ALL TIME/.test(b.textContent)).click());
  await A.page.waitForFunction(() => document.querySelectorAll('.dy-sec .dy-sub').length && /AVERAGE A DAY/.test(document.querySelector('.dy-overlay').innerText), { timeout: 10000 });
  ok(/YOUR TABLE · AVERAGE A DAY/.test(await A.page.evaluate(() => document.querySelector('.dy-overlay').innerText)) && /EVERYONE · ALL TIME/.test(await A.page.evaluate(() => document.querySelector('.dy-overlay').innerText)), 'ALL TIME: YOUR TABLE’s average a day + EVERYONE (from /api/daily points + the board)');
  await A.page.evaluate(() => [...document.querySelectorAll('.dy-scope-b')].find(b => /TODAY/.test(b.textContent)).click());
  await click(A.page, '.dy-tab:nth-child(1)');

  // ================================================================ 4. THE ONE-TIME HINT (DFIX3 — the practice harbor cut)
  await waitFor(A.page, `!!document.querySelector('.dy-ticket[data-id="coastclear"] .dy-play')`, 'TODAY', 6000);
  await click(A.page, '.dy-ticket[data-id="coastclear"] .dy-play');
  await waitFor(A.page, `document.querySelectorAll('.dy-run .cc-board .cc-cell').length === 108 && !document.querySelector('.cc-lesson') && !!window.__coastclear && window.__coastclear.ready()`, 'today’s harbor', 20000);
  const H0 = await A.page.evaluate(() => { const h = document.querySelector('.dy-run .cc-hint'); const b = document.querySelector('.dy-run .cc-board').getBoundingClientRect(), r = h && h.getBoundingClientRect(); return { text: h && h.textContent, shown: !!h && !h.hidden && getComputedStyle(h).opacity !== '0', under: !!r && r.top >= b.bottom - 1, oneLine: !!r && r.height < 24, inside: !!r && r.left >= 0 && r.right <= innerWidth, state: window.__coastclear.state().hint }; });
  ok(H0.text === 'EACH NUMBER = SEARCHLIGHTS TOUCHING THAT SQUARE' && H0.shown && H0.under && H0.oneLine && H0.inside && H0.state, `THE ONE-TIME HINT: straight to the real board, one calm line under it ("${H0.text}") — no practice harbor (${JSON.stringify(H0)})`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-02-hint');
  ok(!(await val(`pstats/${A.pid}/ls/coastclear`)), 'not yet seen on the profile (it stays until the first number)');
  // the first dig that reveals a NUMBER → the hint fades, SEEN on the profile
  { const board0 = await ccBoard(day), counts0 = (await import('../../js/games/coastclear/logic.js')).countsOf(board0);
    const numbered = await A.page.evaluate(C => { const c = [...document.querySelectorAll('.dy-run .cc-cell')].find(x => !x.classList.contains('is-open') && C[+x.dataset.i] > 0); return c ? +c.dataset.i : -1; }, counts0);
    await A.page.click(`.dy-run .cc-cell[data-i="${numbered}"]`);
    await waitFor(A.page, `window.__coastclear.state().pending === 0 && window.__coastclear.state().inflight === 0 && !window.__coastclear.state().hint`, 'the number landed → the hint goes', 10000);
    await waitFor(A.page, `(() => { const h = document.querySelector('.dy-run .cc-hint'); return h && (h.hidden || getComputedStyle(h).opacity === '0'); })()`, 'the hint faded', 4000);
    ok(true, 'the first number revealed → the hint fades (opacity only)');
    for (let i = 0; i < 40 && !(await val(`pstats/${A.pid}/ls/coastclear`)); i++) await sleep(150);
    ok((await val(`pstats/${A.pid}/ls/coastclear`)) === 1, 'the hint SEEN — remembered on the profile (every device)'); }
  await click(A.page, '.dy-run > .dy-back');
  await waitFor(A.page, `!!document.querySelector('.dy-ticket[data-id="coastclear"].is-progress')`, 'IN PROGRESS', 8000);
  ok(true, 'BACK: COAST CLEAR\'s ticket reads RESUME (in progress)');

  // ================================================================ 5. THE PASSWORD in the overlay → DONE + YOUR TABLE's place
  await click(A.page, '.dy-ticket[data-id="password"] .dy-play');
  await waitFor(A.page, `!!document.querySelector('.dy-run .pw-screen .gk-kb-key') && !!window.__password && !window.__password.busy()`, 'THE PASSWORD', 20000);
  const typeWord = async w => { for (const ch of w) { await A.page.click(`.gk-kb-key[data-k="${ch}"]`); await sleep(30); } await A.page.click('.gk-kb-r3 .gk-go'); };
  await typeWord(W1);
  await waitFor(A.page, `window.__password && window.__password.run().doors[0].state === 'solved' && !window.__password.busy() && !window.__password.state().reveal`, 'THE FRONT DOOR', 20000);
  await typeWord(W2);
  await waitFor(A.page, `!!document.querySelector('.pw-endscr.is-in')`, 'the end screen', 20000);
  await sleep(1200);
  await click(A.page, '.dy-run > .dy-back');
  await waitFor(A.page, `!!document.querySelector('.dy-ticket[data-id="password"].is-done')`, 'DONE', 10000);
  await waitFor(A.page, `/1ST OF 2 AT YOUR TABLE/.test(document.querySelector('.dy-ticket[data-id="password"]').innerText)`, 'the table rank', 10000).catch(() => {});
  const pwRow = await ev(A.page, `document.querySelector('.dy-ticket[data-id="password"]').innerText.replace(/\\s+/g, ' ')`);
  const stamp = await A.page.evaluate(() => { const s = document.querySelector('.dy-ticket[data-id="password"] .dy-stamp'); if (!s) return null; const m = /rotate\((-?[\d.]+)deg\)|matrix\(([^)]+)\)/.exec(getComputedStyle(s).transform) || []; return { svg: !!s.querySelector('svg text'), word: (s.querySelector('svg text') || {}).textContent, check: !!document.querySelector('.dy-check'), serial: (document.querySelector('.dy-ticket[data-id="password"] .dy-serial') || {}).textContent, tilted: getComputedStyle(s).transform !== 'none' }; });
  ok(/2 GUESSES/.test(pwRow) && /1ST OF 2 AT YOUR TABLE/.test(pwRow) && stamp && stamp.svg && stamp.word === 'ADMITTED' && !stamp.check && stamp.tilted && /^Nº \d{4}$/.test(stamp.serial || ''), `DONE: the score + YOUR TABLE's place + the drawn ADMITTED stamp (tilted, no check circle) + the serial ${stamp && stamp.serial} ("${pwRow}")`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-03-mixed');
  // DFIX2 — SCORES after you play: ALICE 1ST (2 GUESSES) framed as YOU, BOBBY 2ND (3 GUESSES) — each their slim card, the score UNDER it
  await click(A.page, '.dy-tab:nth-child(2)');
  await waitFor(A.page, `(() => { const l = document.querySelector('.dy-sec[data-id="password"] .dy-cards'); return l && l.dataset.strips === '2'; })()`, 'two slim cards', 10000);
  const sc2 = await A.page.evaluate(() => {
    const rows = [...document.querySelectorAll('.dy-sec[data-id="password"] .dy-crow')];
    const me = rows.find(r => r.classList.contains('is-me'));
    const sr = me.querySelector('.vl-strip').getBoundingClientRect(), sc = me.querySelector('.dy-cscore').getBoundingClientRect(), rk = me.querySelector('.lb-rank').getBoundingClientRect();
    return { rows: rows.map(r => `${r.querySelector('.lb-rank').textContent}|${r.querySelector('.vl-name').textContent}|${r.querySelector('.dy-cscore').textContent}`),
      under: sc.top >= sr.bottom - 1, rightEnd: Math.abs(sc.right - sr.right) < 8, rankLeft: rk.right <= sr.left, frame: getComputedStyle(me.querySelector('.dy-card .vl-strip')).boxShadow !== 'none' && getComputedStyle(me.querySelector('.dy-card'), '::after').boxShadow === 'none', still: !!document.querySelector('.dy-sec[data-id="password"] .dy-still') };
  });
  ok(sc2.rows[0] === '1ST|ALICE|2 GUESSES' && sc2.rows[1] === '2ND|BOBBY|3 GUESSES', `SCORES as slim cards: ${sc2.rows.join(' · ')}`);
  ok(sc2.under && sc2.rightEnd && sc2.rankLeft && sc2.frame && !sc2.still, `the rank LEFT of the card, the score UNDER it at its right end, YOU framed, nobody still to play (${JSON.stringify({ under: sc2.under, rightEnd: sc2.rightEnd, rankLeft: sc2.rankLeft, frame: sc2.frame })})`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-08-scores');
  // no leak: 30 opens / closes of SCORES → every effect surface gone with the screen
  for (let i = 0; i < 30; i++) {
    await click(A.page, '.dy-screen .dy-back');
    await waitFor(A.page, `!document.querySelector('.dy-overlay')`, 'closed', 6000);
    await A.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
    await waitFor(A.page, `(() => { const l = document.querySelector('.dy-sec[data-id="password"] .dy-cards'); return l && l.dataset.strips === '2'; })()`, `open ${i}`, 10000);
  }
  await click(A.page, '.dy-screen .dy-back');
  await waitFor(A.page, `!document.querySelector('.dy-overlay')`, 'the screen closed', 6000);
  const leak = await A.page.evaluate(() => ({ surfaces: window.__daily2.surfaces(), canvases: document.querySelectorAll('.dy-overlay .fx-host canvas, .dy-cards').length }));
  ok(leak.surfaces === 0 && leak.canvases === 0, `30 opens / closes of SCORES: 0 surfaces, 0 card lists left (${JSON.stringify(leak)})`);
  // DFIX2 — THE 4 AM TURN on an open DAILY screen: a stale answer (yesterday's day) is re-read by the turn, no reload — the screen stays, the day is today's
  await A.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'today' } })));
  await waitFor(A.page, `document.querySelectorAll('.dy-ticket').length === 3`, 'TODAY again', 8000);
  const turned = await A.page.evaluate(async () => { const T = await import('/js/daily/today.js'); const nav = performance.getEntriesByType('navigation').length; window.__daily2.stale(); const before = T.todayNow().day; await window.__daily2.turn(); return { before, after: T.todayNow().day, tickets: document.querySelectorAll('.dy-ticket').length, nav, overlay: !!document.querySelector('.dy-screen') }; });
  ok(turned.before === 'd00000000' && turned.after === day && turned.tickets === 3 && turned.overlay, `the 4 am turn re-reads today (${turned.before} → ${turned.after}) with the screen open, no reload`);
  await click(A.page, '.dy-screen .dy-back');
  await waitFor(A.page, `!document.querySelector('.dy-overlay')`, 'the screen closed', 6000);

  // ================================================================ 6. THE ROOM WINS — the full loop on COAST CLEAR
  const Hst = await openApp('dyh', 'HOSTA');
  const code = await Hst.page.evaluate(() => import('/js/room.js').then(async m => { const { loadProfile } = await import('/js/identity.js'); await m.createRoom(loadProfile()); return window.__arcade.state.code; }));
  await waitFor(Hst.page, `!!window.__arcade.state.code && !!window.__arcade.state.meta`, 'the host\'s room', 20000);
  await A.page.evaluate(c => import('/js/room.js').then(async m => { const { loadProfile } = await import('/js/identity.js'); await m.joinRoom(c, loadProfile()); }), code);
  await waitFor(A.page, `window.__arcade.state.code === ${JSON.stringify(code)} && !!window.__arcade.state.meta`, 'ALICE in the room', 20000);
  ok(true, `a room (${code}): HOSTA + ALICE`);
  // the ☰ menu's row → the dailies → RESUME COAST CLEAR (inside the room)
  await click(A.page, '.menu-btn');
  await waitFor(A.page, `!!document.querySelector('.gm-dailies')`, 'the ☰ row', 6000);
  ok(/1 LEFT/.test(await ev(A.page, `document.querySelector('.gm-dailies').innerText`)), 'the ☰ menu (in the room): THE DAILIES · 1 LEFT');
  await click(A.page, '.gm-dailies');
  await waitFor(A.page, `!!document.querySelector('.dy-ticket[data-id="coastclear"] .dy-play')`, 'the screen from the menu', 8000);
  await click(A.page, '.dy-ticket[data-id="coastclear"] .dy-play');
  await waitFor(A.page, `!!window.__coastclear && window.__coastclear.ready() && !!document.querySelector('.dy-run .cc-board')`, 'COAST CLEAR resumed', 20000);
  ok(!(await A.page.$('.cc-lesson')) && !(await A.page.evaluate(() => { const h = document.querySelector('.dy-run .cc-hint'); return h && !h.hidden; })), 'RESUME: straight to the board — no hint on a resume, never again once seen');
  // the host's line (who only)
  await waitFor(Hst.page, `(() => { const m = document.querySelector('.rdk-mid'); return m && !m.hidden && /1 PLAYER IS MID-DAILY/.test(m.textContent); })()`, 'the host\'s MID-DAILY line', 30000).catch(() => {});
  const hostLine = await ev(Hst.page, `(document.querySelector('.rdk-mid:not([hidden])') || {}).textContent || ''`);
  ok(/1 PLAYER IS MID-DAILY/.test(hostLine), `the HOST sees "${hostLine}" before START (who only — nothing about the run)`);
  ok(!(await A.page.$('.rdk-mid:not([hidden])')), 'a guest sees no MID-DAILY line');
  const aUid = await ev(A.page, 'window.__arcade.state.uid');
  ok((await val(`rooms/${code}/players/${aUid}/dy`)) === true, 'DFIX2: the line reads ALICE\'s OWN flag on her player node (players/{uid}/dy — no poll, zero /api calls)');
  if (H.SHOTS) await H.shotAll(Hst.page, 'dy-05-hostline');
  // the host starts a game → the banner, the run held + paused on the server, the overlay gone
  await Hst.page.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', {})));
  await waitFor(A.page, `!document.querySelector('.dy-run') && /GAME STARTING · YOUR DAILY IS SAVED/.test((document.querySelector('.dy-banner') || {}).textContent || '')`, 'the banner', 20000);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-05b-banner', [[390, 844]]);
  ok(true, 'GAME STARTING · YOUR DAILY IS SAVED — the run closed for the match');
  ok(!!(await ev(A.page, `JSON.parse(localStorage.getItem('daily:held') || 'null')`)), 'the run HELD (the RESUME chip comes after the match)');
  let rec = null;
  for (let i = 0; i < 40; i++) { rec = await val(`dly/coastclear/${day}/p/${A.pid}`); if (rec && pausesOf(rec).at != null) break; await sleep(200); }
  ok(rec && pausesOf(rec).at != null && pausesOf(rec).n === 1, `COAST CLEAR PAUSED on the server (THE ROOM WINS — the room really started a game): ${JSON.stringify(pausesOf(rec || {}))}`);
  await waitFor(A.page, `(window.__arcade.state.game || {}).id === 'overclock'`, 'ALICE dealt in', 20000);
  ok(!!(await ev(A.page, `window.__arcade.state.game.participants[window.__arcade.state.uid]`)), 'ALICE dealt into the match like everyone else');
  await sleep(1500);
  await Hst.page.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await waitFor(A.page, `(() => { const c = document.querySelector('.nd-dychip'); return c && !c.hidden; })()`, 'RESUME YOUR DAILY', 40000);
  ok(true, 'back in the room: RESUME YOUR DAILY');
  if (H.SHOTS) await H.shotAll(A.page, 'dy-06-chip');
  // FR7 FIXES A — DY1 (FR7-B's MUST-FIX): a FRESH PAGE (iOS dropped the tab, a refresh) → the chip → the run opens STYLED — it used to mount
  // transparent over the title (css/daily.css was linked only by THE DAILY SCREEN, which a chip never opens)
  await A.page.reload();
  await waitFor(A.page, `!document.getElementById('boot') && !!window.__arcade && window.__arcade.state.code === '${code}' && (() => { const c = document.querySelector('.nd-dychip'); return c && !c.hidden; })()`, 'the chip after a reload', 60000);
  ok(true, 'a fresh page in the room: RESUME YOUR DAILY again');
  await click(A.page, '.nd-dychip');
  await waitFor(A.page, `!!window.__coastclear && window.__coastclear.ready() && !!document.querySelector('.dy-run .cc-board')`, 'the run again', 20000);
  const styled = await ev(A.page, `(() => { const o = getComputedStyle(document.querySelector('.dy-run')); return { bg: o.getPropertyValue('--dy-bg-0').trim(), pos: o.position, vis: o.visibility, back: !!document.querySelector('.dy-run .dy-back') }; })()`);
  ok(/^#[0-9a-f]{6}$/i.test(styled.bg) && styled.pos !== 'static' && styled.vis === 'visible' && styled.back, `DY1: the run on a fresh page opens STYLED (${JSON.stringify(styled)})`);
  for (let i = 0; i < 40; i++) { rec = await val(`dly/coastclear/${day}/p/${A.pid}`); if (rec && pausesOf(rec).at == null) break; await sleep(200); }
  ok(rec && pausesOf(rec).at == null && pausesOf(rec).n === 1, 'RESUMED exactly where it was — the clock running again (+15 s for the one pause)');
  ok(await ev(A.page, `!(document.querySelector('.nd-dychip') || {}).hidden === false || document.querySelector('.nd-dychip').hidden`), 'the chip gone once the run is open');
  ok((await val(`rooms/${code}/players/${aUid}/dy`)) === true, 'the flag stays while the run is open in the room');

  // ================================================================ 7. COAST CLEAR cleared by taps → THE SWEEP
  const board = await ccBoard(day), LIGHTS = new Set(board.lights);   // (the day's STORED board — the server's)
  for (let guard = 0; guard < 200; guard++) {
    const next = await A.page.evaluate(L => { const c = [...document.querySelectorAll('.dy-run .cc-cell')].find(x => !x.classList.contains('is-open') && !L.includes(+x.dataset.i)); return c ? +c.dataset.i : -1; }, [...LIGHTS]);
    if (next < 0) break;
    await A.page.click(`.dy-run .cc-cell[data-i="${next}"]`);
    await A.page.waitForFunction(() => window.__coastclear.state().pending === 0 && window.__coastclear.state().inflight === 0, { timeout: 20000 });
  }
  await waitFor(A.page, `window.__coastclear.state().done`, 'the harbor cleared', 20000);
  for (let i = 0; i < 60; i++) { if (await val(`dly/coastclear/${day}/r/${A.pid}`) != null) break; await sleep(200); }
  await sleep(1500);
  await click(A.page, '.dy-run > .dy-back');
  await waitFor(A.page, `window.__daily2.sweptAt() > 0 && /SWEPT/.test(document.querySelector('.dy-sweep-l').textContent)`, 'THE SWEEP moment', 10000);
  ok(true, 'THE SWEEP: the last daily done → the meter fills, SWEPT + a short flourish');
  if (H.SHOTS) { await sleep(300); await H.shotAll(A.page, 'dy-04-swept'); }
  const st = await val(`pstats/${A.pid}`);
  ok(st.dl && st.dl.sw === 1 && st.dl.sr && st.dl.sr.n === 1, `the server: one swept day (dl.sw ${st.dl && st.dl.sw}), PERFECT WEEK's run started (dl.sr.n ${st.dl && st.dl.sr && st.dl.sr.n})`);
  ok(st.xp >= 3 * DAILY_XP + SWEEP_XP, `the XP: three dailies + the sweep bonus (${st.xp} ≥ ${3 * DAILY_XP + SWEEP_XP})`);
  // BOARD 2.0 B — SHARE TODAY = ONE CARD (the owner's add-on): `today { share }` → each finished run's spoiler-free inputs from the SERVER's record —
  // THE PASSWORD's marks + counts (never a word), COAST CLEAR's no-board inputs; then the card itself draws (one section each + NOT YET none)
  {
    const sh = await api(A.page, { action: 'today', share: true });
    const pw = sh.share && sh.share.password, cc = sh.share && sh.share.coastclear;
    ok(pw && pw.done && Array.isArray(pw.doors) && pw.doors.every(d => Array.isArray(d.marks) && typeof d.n === 'number') && !JSON.stringify(pw).match(/"[A-Z]{5}"/), `SHARE TODAY's data: THE PASSWORD = marks + counts, no word (${JSON.stringify(pw).slice(0, 90)})`);
    ok(cc && cc.head && !cc.caught && cc.time && !('board' in cc) && !('lights' in cc), `…COAST CLEAR = its no-board inputs (${JSON.stringify(cc)})`);
    const regular = await api(A.page, { action: 'today' });
    ok(!('share' in regular), '…only when asked (the regular `today` carries none)');
    const drawn = await A.page.evaluate(async () => { const m = await import('/js/daily/share-today.js'); const t = await import('/js/daily/contract.js').then(c => c.dailyShare()); const cv = await m.drawToday(t, (id, s) => String(s), 'night', { share: t.share }); return { w: cv.width, h: cv.height, plan: m.planToday(t, t.share) }; });
    ok(drawn.w === 1080 && drawn.h === 1350 && drawn.plan.sections.filter(s => s.own).length >= 2, `SHARE TODAY draws ONE card: a section from each daily's own pieces (${JSON.stringify(drawn.plan.sections)})`);
  }
  for (let i = 0; i < 30 && (await val(`rooms/${code}/players/${aUid}/dy`)) != null; i++) await sleep(200);
  ok((await val(`rooms/${code}/players/${aUid}/dy`)) == null, 'the run finished → the flag cleared (the host\'s line goes)');
  await click(A.page, '.dy-screen .dy-back');
  await A.page.evaluate(() => import('/js/room.js').then(m => m.leaveRoom && m.leaveRoom()));
  await waitFor(A.page, `!window.__arcade.state.code`, 'ALICE left the room', 15000).catch(() => {});
  await today(A.page);
  await waitFor(A.page, `(() => { const t = document.querySelector('.nd-flank:not(.rdk-dock) .nd-tab-daily'); return t && t.dataset.state === 'done'; })()`, 'the dock ALL DONE', 15000).catch(() => {});
  d = await dock(A.page);
  ok(d && d.state === 'done' && d.ok && d.n === '', `the dock: ALL DONE + the drawn check (${JSON.stringify(d)})`);
  await Hst.ctx.close();

  // ================================================================ 8. a same-day profile: its own result says so (quiet), never ranked
  const C = await openApp('dyc', 'CASEY');
  const s2 = await api(C.page, { action: 'start', game: 'test' });
  const f2 = await api(C.page, { action: 'finish', game: 'test', result: { guess: s2.seed % 1000 } });
  ok(f2.counted === false && f2.countsFrom > Date.now(), 'a same-day profile: counted false + countsFrom (tomorrow\'s 4 am)');
  await today(C.page);
  await C.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen' } })));
  await waitFor(C.page, `!!document.querySelector('.dy-ticket[data-id="test"].is-done')`, 'CASEY\'s TODAY', 10000);
  ok(/YOUR SCORE COUNTS FROM TOMORROW/.test(await ev(C.page, `document.querySelector('.dy-ticket[data-id="test"]').innerText`)), 'YOUR SCORE COUNTS FROM TOMORROW on its own result (quiet, small)');
  const bobToday = await dailyAction('e2e-dy-bob', { action: 'today' });
  ok(!bobToday.table.includes(C.pid), 'absent from others\' tables (not a friend; a friend\'s non-counting result is left out on the server)');
  // DFIX2 — A ROOM OF ONE CAN'T PAUSE: CASEY alone in a room, COAST CLEAR open, starts a game → the banner + the hold, but the server refuses the
  // pause (409 no_room_game) — the clock keeps running
  await C.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: null })));
  const soloCode = await C.page.evaluate(() => import('/js/room.js').then(async m => { const { loadProfile } = await import('/js/identity.js'); await m.createRoom(loadProfile()); return window.__arcade.state.code; }));
  await waitFor(C.page, `!!window.__arcade.state.code && !!window.__arcade.state.meta`, 'CASEY\'s solo room', 20000);
  await C.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'run', id: 'coastclear' } })));
  await waitFor(C.page, `!!window.__coastclear && window.__coastclear.ready() && !!document.querySelector('.dy-run .cc-board')`, 'CASEY\'s harbor', 20000);
  ok(await C.page.evaluate(() => window.__coastclear.state().hint), 'a new player: the one-time hint under the board (no step to skip — the practice harbor is cut)');
  await C.page.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', {})));
  await waitFor(C.page, `!document.querySelector('.dy-run') && !!JSON.parse(localStorage.getItem('daily:held') || 'null')`, 'the run held', 20000);
  await sleep(1500);
  // (a run with no move yet has no record at all — a refused pause writes nothing; a start there proves the run is real)
  const [soloRec, soloStart] = await Promise.all([val(`dly/coastclear/${day}/p/${C.pid}`), val(`dly/coastclear/${day}/s/${C.pid}`)]);
  ok(!!soloStart && (!soloRec || (pausesOf(soloRec).at == null && pausesOf(soloRec).n === 0)), `a room of ONE (${soloCode}): the run is held, but the server refused the pause — the clock runs (record ${soloRec ? JSON.stringify(pausesOf(soloRec)) : 'untouched'})`);
  await C.ctx.close(); await A.ctx.close();
});
