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
    // (CITY A: waits for the state the URL asks for — a fixed 400 ms read the dock before its DAILY tab settled, a different check each run)
    const at = async q => {
      await p.goto(`${BASE}/tests/integration/title-preview.html?${q}`); await waitFor(p, '!!document.querySelector(".nd-flank .nd-tab-daily") && !!window.__district', 'the title preview', 40000);
      const Q = new URLSearchParams(q), st = Q.get('daily'), T = 'document.querySelector(".nd-flank:not(.rdk-dock) .nd-tab-daily")';
      const want = st === 'off' ? `${T}.hidden` : st === 'done' ? `!${T}.hidden && ${T}.dataset.state === 'done'` : `!${T}.hidden && ${T}.dataset.state === '${st}' && ${T}.querySelector('.nd-dy-n').textContent === '${Q.get('left') || ''}'`;
      await waitFor(p, want, `the dock settled for ${q}`, 8000).catch(() => {});
      await sleep(150);
      return dock(p);
    };
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
  // (DFIX5 — EVERYONE ON SCORES lists the WHOLE day: a clean day for this suite's dailies — every earlier run's finishers gone, the day's stored
  //  pair / board (b) + its close marker (c) kept — so the everyone list holds exactly this run's players)
  for (const g of ['password', 'coastclear', 'test']) { const node = (await val(`dly/${g}/${day}`)) || {}; await ref('/').update(Object.fromEntries(Object.keys(node).filter(k => k !== 'b' && k !== 'c').map(k => [`dly/${g}/${day}/${k}`, null]))); }
  const A = await openApp('dya', 'ALICE'); await backdate(A.pid);
  await ref('/').update({ [`pfr/${A.pid}/f/${bobPid}`]: Date.now(), [`pfr/${bobPid}/f/${A.pid}`]: Date.now() });   // (friends — FRIENDS A's shape)
  // BOBBY cracks THE PASSWORD in three (a miss first)
  await dailyAction('e2e-dy-bob', { action: 'start', game: 'password' });
  await words();
  for (const w of [MISS, W1, W2]) await dailyAction('e2e-dy-bob', { action: 'guess', game: 'password', word: w });
  const bf = await dailyAction('e2e-dy-bob', { action: 'finish', game: 'password' });
  log(`BOBBY's PASSWORD: ${bf.score}`);
  // DFIX5 — BOBBY clears COAST CLEAR with ONE spot (a light dug first, then every safe cell) — THE SPOT ICONS on SCORES, from the server's record
  { const bd = await ccBoard(day), LB = new Set(bd.lights);
    await dailyAction('e2e-dy-bob', { action: 'start', game: 'coastclear' });
    let r = await dailyAction('e2e-dy-bob', { action: 'dig', game: 'coastclear', cell: bd.lights[0] });
    for (let i = 0; i < bd.w * bd.h && !r.done; i++) if (!LB.has(i)) r = await dailyAction('e2e-dy-bob', { action: 'dig', game: 'coastclear', cell: i });
    const cf = await dailyAction('e2e-dy-bob', { action: 'finish', game: 'coastclear' });
    log(`BOBBY's COAST CLEAR: ${cf.score} (1 spot)`); }
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
  // DFIX5 — EVERYONE BY DEFAULT: the day's counting finishers (BOBBY — PLAYED, his score hidden until ALICE plays; his card says "LV n · FRIEND"
  // in gold), the FRIENDS box UNCHECKED; checked → YOUR TABLE (DFIX2's slim cards: BOBBY + "STILL TO PLAY · YOU", no FRIEND word)
  const scan = () => A.page.evaluate(() => [...document.querySelectorAll('.dy-sec')].map(s => ({ h: s.querySelector('.dy-sec-h').textContent, sub: (s.querySelector('.dy-sub') || {}).textContent || '', rows: [...s.querySelectorAll('.dy-crow')].map(r => r.innerText.replace(/\s+/g, ' ').trim()),
    strips: s.querySelectorAll('.dy-crow .vl-strip').length, friend: [...s.querySelectorAll('.dy-crow .vl-friend')].map(f => f.closest('.vl-strip').querySelector('.vl-name').textContent), still: (s.querySelector('.dy-still') || {}).textContent || '', canvases: s.querySelectorAll('.fx-host canvas').length, quiet: [...s.querySelectorAll('.dy-quiet, .dy-none')].map(q => q.textContent).join(' | ') })));
  const box = () => A.page.evaluate(() => { const b = document.querySelector('.dy-fbox'), sw = document.querySelector('.dy-scope'); if (!b) return null; const r = b.getBoundingClientRect(), rs = sw.getBoundingClientRect(); return { on: b.getAttribute('aria-checked') === 'true', text: b.textContent, h: r.height, right: r.left >= rs.right - 1 || r.top >= rs.bottom - 1, inside: r.right <= innerWidth - 8, tick: !!b.querySelector('svg path') }; });
  await waitFor(A.page, `(() => { const l = document.querySelector('.dy-sec[data-id="password"] .dy-cards'); return l && l.dataset.strips === '1'; })()`, 'the everyone strips on SCORES', 10000);
  let pwSec = (await scan()).find(x => /PASSWORD/.test(x.h));
  const bx0 = await box();
  ok(bx0 && !bx0.on && bx0.text === 'FRIENDS' && bx0.h >= 44 && bx0.right && bx0.inside && bx0.tick, `DFIX5 — the scope row: the switch + a drawn FRIENDS box beside it, UNCHECKED, a 44 pt tap (${JSON.stringify(bx0)})`);
  ok(pwSec && pwSec.sub === 'EVERYONE · TODAY' && pwSec.rows.length === 1 && /BOBBY.*PLAYED/.test(pwSec.rows[0]) && !pwSec.rows.some(r => /GUESS/.test(r)) && pwSec.friend.join() === 'BOBBY' && /Play it to see their scores/.test(pwSec.quiet), `SCORES before you play = EVERYONE: BOBBY PLAYED (never his score), his card "FRIEND" in gold (${pwSec && pwSec.rows.join(' | ')})`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-07-scores-before');
  await click(A.page, '.dy-fbox');
  await waitFor(A.page, `(() => { const s = document.querySelector('.dy-sec[data-id="password"]'); return s && /YOUR FRIENDS · TODAY/.test(s.innerText) && s.querySelector('.dy-cards') && s.querySelector('.dy-cards').dataset.strips; })()`, 'YOUR TABLE', 10000);
  pwSec = (await scan()).find(x => /PASSWORD/.test(x.h));
  ok((await box()).on && pwSec && pwSec.strips === 1 && pwSec.rows.length === 1 && /STILL TO PLAY · YOU/.test(pwSec.still) && pwSec.canvases <= 1 && !pwSec.friend.length, `the FRIENDS box CHECKED → YOUR TABLE: BOBBY's slim card (${pwSec && pwSec.strips} strip, ${pwSec && pwSec.canvases} effect canvas), ALICE in one line ("${pwSec && pwSec.still}"), no FRIEND word`);
  // (BOARD 2.0 B → DFIX5 — ALL TIME: EVERYONE's board by default; the box → YOUR FRIENDS' average a day)
  ok(await A.page.evaluate(() => [...document.querySelectorAll('.dy-scope-b')].map(b => b.textContent).join('|') === 'TODAY’S SCORES|ALL TIME'), 'SCORES: TODAY’S SCORES · ALL TIME (the switch unchanged)');
  await A.page.evaluate(() => [...document.querySelectorAll('.dy-scope-b')].find(b => /ALL TIME/.test(b.textContent)).click());
  await A.page.waitForFunction(() => /AVERAGE A DAY/.test(document.querySelector('.dy-overlay').innerText), { timeout: 10000 });
  ok(/YOUR FRIENDS · AVERAGE A DAY/.test(await A.page.evaluate(() => document.querySelector('.dy-overlay').innerText)), 'ALL TIME + the box: YOUR FRIENDS’ average a day (/api/daily points)');
  await click(A.page, '.dy-fbox');
  await A.page.waitForFunction(() => /EVERYONE · ALL TIME/.test(document.querySelector('.dy-overlay').innerText) && !/AVERAGE A DAY/.test(document.querySelector('.dy-overlay').innerText), { timeout: 10000 });
  ok(true, 'ALL TIME, the box unchecked: EVERYONE · ALL TIME (the daily’s ALL TIME board)');
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
  await waitFor(A.page, `/1ST OF 2 TODAY/.test(document.querySelector('.dy-ticket[data-id="password"]').innerText)`, 'the everyone place', 10000).catch(() => {});
  const pwRow = await ev(A.page, `document.querySelector('.dy-ticket[data-id="password"]').innerText.replace(/\\s+/g, ' ')`);
  const stamp = await A.page.evaluate(() => { const s = document.querySelector('.dy-ticket[data-id="password"] .dy-stamp'); if (!s) return null; const m = /rotate\((-?[\d.]+)deg\)|matrix\(([^)]+)\)/.exec(getComputedStyle(s).transform) || []; return { svg: !!s.querySelector('svg text'), word: (s.querySelector('svg text') || {}).textContent, check: !!document.querySelector('.dy-check'), serial: (document.querySelector('.dy-ticket[data-id="password"] .dy-serial') || {}).textContent, tilted: getComputedStyle(s).transform !== 'none' }; });
  ok(/2 GUESSES/.test(pwRow) && /1ST OF 2 TODAY/.test(pwRow) && stamp && stamp.svg && stamp.word === 'ADMITTED' && !stamp.check && stamp.tilted && /^Nº \d{4}$/.test(stamp.serial || ''), `DONE: the score + the EVERYONE place (DFIX5 — "1ST OF 2 TODAY") + the drawn ADMITTED stamp (tilted, no check circle) + the serial ${stamp && stamp.serial} ("${pwRow}")`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-03-mixed');
  // DFIX2 — SCORES after you play: ALICE 1ST (2 GUESSES) framed as YOU, BOBBY 2ND (3 GUESSES) — each their slim card, the score UNDER it
  await click(A.page, '.dy-tab:nth-child(2)');
  await waitFor(A.page, `(() => { const l = document.querySelector('.dy-sec[data-id="password"] .dy-cards'); return l && l.dataset.strips === '2'; })()`, 'two slim cards', 10000);
  const sc2 = await A.page.evaluate(() => {
    const rows = [...document.querySelectorAll('.dy-sec[data-id="password"] .dy-crow')];
    const me = rows.find(r => r.classList.contains('is-me'));
    const sr = me.querySelector('.vl-strip').getBoundingClientRect(), sc = me.querySelector('.dy-cscore').getBoundingClientRect(), rk = me.querySelector('.lb-rank').getBoundingClientRect();
    // (CITY B: places 1–3 are THE DECO MEDALS — their label says the place: "1st place" → 1ST)
    const place = r => { const m = r.querySelector('.lb-rank .rk-medal'); return m ? m.getAttribute('aria-label').split(' ')[0].toUpperCase() : r.querySelector('.lb-rank').textContent; };
    return { rows: rows.map(r => `${place(r)}|${r.querySelector('.vl-name').textContent}|${r.querySelector('.dy-cscore').textContent}`),
      under: sc.top >= sr.bottom - 1, rightEnd: Math.abs(sc.right - sr.right) < 8, rankLeft: rk.right <= sr.left, frame: getComputedStyle(me.querySelector('.dy-card .vl-strip')).boxShadow !== 'none' && getComputedStyle(me.querySelector('.dy-card'), '::after').boxShadow === 'none', still: !!document.querySelector('.dy-sec[data-id="password"] .dy-still') };
  });
  ok(sc2.rows[0] === '1ST|ALICE|2 GUESSES' && sc2.rows[1] === '2ND|BOBBY|3 GUESSES', `SCORES · EVERYONE as slim cards: ${sc2.rows.join(' · ')}`);
  { const fr = await A.page.evaluate(() => [...document.querySelectorAll('.dy-sec[data-id="password"] .dy-crow')].map(r => !!r.querySelector('.vl-friend')));
    ok(fr.join() === 'false,true', `a FRIEND in the everyone list: BOBBY's card says FRIEND, YOU's doesn't (${fr.join()})`); }
  ok(sc2.under && sc2.rightEnd && sc2.rankLeft && sc2.frame && !sc2.still, `the rank LEFT of the card, the score UNDER it at its right end, YOU framed, nobody still to play (${JSON.stringify({ under: sc2.under, rightEnd: sc2.rightEnd, rankLeft: sc2.rankLeft, frame: sc2.frame })})`);
  if (H.SHOTS) await H.shotAll(A.page, 'dy-08-scores');
  // ================================================================ 3b. NO TAP EVER GOES THROUGH THE DAILY SCREEN TO THE CITY
  // (the owner's live bug, Nov 14: on SCORES a tap on a slim card opened PRISM DROP's game card — the city behind answered it. title-taps.js
  //  #covered + ui/layers.js#cityCovered: a screen on top owns every touch.) REAL touches (trusted pointer events) on every SCORES card — its
  //  middle, its four edges — the gaps between the rows, the panel's padding, and on the very points where the city WOULD answer (a game's
  //  sign / billboard under the screen): no game card, no sheet, the DAILY screen still up on the same tab. Then ALL TIME + the TODAY
  //  results list the same way; closed, the same point opens the game's card again (the test's teeth: the point was a real billboard).
  {
    const pg = A.page;
    const cityOpened = () => pg.evaluate(() => ({ card: !!document.querySelector('.nd-card-sheet'), sheet: document.querySelectorAll('.sh, .modal').length, daily: !!document.querySelector('.dy-screen'), tab: (document.querySelector('.dy-tab.is-on, .dy-tab[aria-selected="true"]') || {}).textContent || '' }));
    // (a REAL touch — and only on a plain part of the DAILY screen: what is under the point is asked again at the tap, a list may have moved)
    const tap = async (x, y, anywhere = false) => {
      // (plain = the DAILY screen's own non-button surface, with no button within 14 px above / below — a real button is never pressed here)
      const plain = anywhere || await pg.evaluate((x, y) => [-14, 0, 14].every(d => { const e = document.elementFromPoint(x, y + d); return !!(e && e.closest('.dy-overlay') && !e.closest('button, a, input, label')); }), Math.round(x), Math.round(y));
      if (!plain) return false;
      await pg.touchscreen.tap(Math.round(x), Math.round(y)); await new Promise(r => setTimeout(r, 40));
      return true;
    };
    // the points where the city answers with a game's card (a playable game's sign), wherever they are on this screen
    const signs = await pg.evaluate(async () => {
      const { GAMES } = await import('/js/config.js'), play = new Set(GAMES.filter(g => g.playable).map(g => g.id)), out = [];
      for (let y = 70; y < innerHeight - 70; y += 10) for (let x = 10; x < innerWidth - 10; x += 10) { const h = window.__district.hit(x, y); if (h && h.kind === 'sign' && play.has(h.id)) out.push([x, y, h.id]); }
      return out;
    });
    ok(signs.length > 0, `the city has a game sign to hit behind the DAILY screen (${signs.length} points — ${[...new Set(signs.map(p => p[2]))].join(', ')})`);
    // a list's tap points: each row's middle + its four edges, the gaps between the rows, the padding left + right of the rows
    const pointsOf = sel => pg.evaluate(sel => {
      const rows = [...document.querySelectorAll(sel)].map(r => r.getBoundingClientRect()).filter(r => r.width > 0 && r.bottom > 0 && r.top < innerHeight), pts = [];
      rows.forEach((r, i) => {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        pts.push([cx, cy, 'middle'], [r.left + 2, cy, 'left edge'], [r.right - 2, cy, 'right edge'], [cx, r.top + 1, 'top edge'], [cx, r.bottom - 1, 'bottom edge']);
        pts.push([Math.max(2, r.left / 2), cy, 'padding left'], [Math.min(innerWidth - 2, (r.right + innerWidth) / 2), cy, 'padding right']);
        if (rows[i + 1] && rows[i + 1].top > r.bottom) pts.push([cx, (r.bottom + rows[i + 1].top) / 2, 'gap']);
      });
      return pts.filter(p => p[1] > 0 && p[1] < innerHeight).map(p => { const e = document.elementFromPoint(p[0], p[1]); return [...p, !!(e && e.closest('button, a, input, label'))]; });
    }, sel);
    // (a list must have LANDED before it is tapped — ALL TIME's rows + EVERYONE's top 3 arrive async and push the buttons down)
    const settled = async () => { let last = '', same = 0; for (let i = 0; i < 40 && same < 4; i++) { const sig = await pg.evaluate(() => { const b = document.querySelector('.dy-body'); return b ? `${b.scrollHeight}|${b.querySelectorAll('*').length}|${[...b.querySelectorAll('.dy-quiet')].some(q => /…$/.test(q.textContent.trim()))}` : ''; }); same = sig === last && !/\|true$/.test(sig) ? same + 1 : 0; last = sig; await new Promise(r => setTimeout(r, 200)); } };
    // (every pop-up that EVER opens is counted — a card the next tap closes again must not slip past an end-of-sweep look)
    await pg.evaluate(() => { window.__popups = []; new MutationObserver(l => { for (const m of l) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches('.sh, .modal, .sheet')) window.__popups.push(String(n.className).slice(0, 60)); }).observe(document.body, { childList: true }); });
    const sweep = async (what, sel) => {
      await settled();
      await pg.evaluate(() => { window.__popups.length = 0; });
      const pts = (await pointsOf(sel)).filter(p => !p[3]);   // (a button is a button: never tapped here)
      const before = await cityOpened();
      let n = 0, m = 0;
      for (const [x, y] of pts) if (await tap(x, y)) n++;
      // + the city's own answering points under this screen (whatever lies over them — a card, a gap, the padding; never a button)
      const under = (await pg.evaluate(pts => pts.filter(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e.closest('.dy-overlay') && !e.closest('button, a, input, label'); }), signs)).filter((_, i) => i % 3 === 0).slice(0, 14);
      for (const [x, y] of under) if (await tap(x, y)) m++;
      await new Promise(r => setTimeout(r, 350));
      const after = await cityOpened(), cov = await pg.evaluate(() => !!window.__district && window.__district.covered()), pops = await pg.evaluate(() => window.__popups.slice());
      ok(!after.card && pops.length === 0 && after.sheet === before.sheet && after.daily && after.tab === before.tab, `${what}: ${n} taps on the rows (middles, edges, gaps, padding) + ${m} on a billboard's own points → no game card, no sheet EVER opened (${pops.length ? pops.join(' | ') : 'none'}), the screen still up (${JSON.stringify(after)})`);
      ok(cov, `${what}: the city knows a screen is on top (title-taps.js#covered)`);
      return under.slice(0, m);
    };
    const u1 = await sweep('SCORES · TODAY’S SCORES', '.dy-sec .dy-crow');
    await pg.evaluate(() => { const b = [...document.querySelectorAll('.dy-scope-b')].find(x => /ALL TIME/.test(x.textContent)); if (b) b.click(); });
    await sweep('SCORES · ALL TIME', '.dy-sec .dy-crow, .dy-sec .dy-card, .dy-sec .lb-row, .dy-sec p');
    await pg.evaluate(() => { const b = [...document.querySelectorAll('.dy-scope-b')].find(x => /TODAY/.test(x.textContent)); if (b) b.click(); });
    await click(pg, '.dy-tab:nth-child(1)');
    await waitFor(pg, `document.querySelectorAll('.dy-ticket').length === 3`, 'TODAY for the taps', 8000);
    const u2 = await sweep('TODAY · the results list (the tickets)', '.dy-ticket');
    ok(u1.length + u2.length > 0, `a billboard's own points lay under the DAILY screen's plain areas (${u1.length} on SCORES, ${u2.length} on TODAY) — the taps above would have reached it`);
    // THE TEETH: with the screen CLOSED the same kind of tap opens the game's card (the point is a real billboard; the rule lifts with the screen)
    await click(pg, '.dy-screen .dy-back');
    await waitFor(pg, `!document.querySelector('.dy-overlay')`, 'closed for the city tap', 6000);
    const free = await pg.evaluate(pts => { const p = pts.find(([x, y]) => { const e = document.elementFromPoint(x, y); return e && !e.closest('button, a, input, label, .nd-actions'); }); return p || null; }, signs);
    if (free) {
      await new Promise(r => setTimeout(r, 300));
      await tap(free[0], free[1], true);
      const opened = await pg.waitForFunction(() => !!document.querySelector('.nd-card-sheet'), { timeout: 4000 }).then(() => true).catch(() => false);
      // (CITY A — FABLE REVIEW 2's C3: this used to pass while the card was only FADING OUT — the tap's own click closed it. The card must
      //  still be up, not leaving, 700 ms later)
      await new Promise(r => setTimeout(r, 700));
      const stays = await pg.evaluate(() => { const c = document.querySelector('.nd-card-sheet'); return !!c && !c.classList.contains('is-out'); });
      ok(opened && stays, `the screen closed: the same tap on the city opens ${free[2]}'s card again (the point was a real billboard) — and it STAYS open (no closing by its own tap: ${stays})`);
      await pg.keyboard.press('Escape');
      await waitFor(pg, `!document.querySelector('.nd-card-sheet')`, 'the card closed', 6000);
    } else ok(true, 'the screen closed (every sign point sits under the dock on this size — the city tap not repeated)');
    // (back to SCORES for the checks below)
    await pg.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
    await waitFor(pg, `(() => { const l = document.querySelector('.dy-sec[data-id="password"] .dy-cards'); return l && l.dataset.strips === '2'; })()`, 'SCORES again', 10000);
  }
  // DFIX5 — the FRIENDS box is UNCHECKED on every visit (never remembered): checked, closed, opened again → unchecked, EVERYONE
  await click(A.page, '.dy-fbox');
  await waitFor(A.page, `document.querySelector('.dy-fbox').getAttribute('aria-checked') === 'true'`, 'the box checked', 4000);
  await click(A.page, '.dy-screen .dy-back');
  await waitFor(A.page, `!document.querySelector('.dy-overlay')`, 'closed', 6000);
  await A.page.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
  await waitFor(A.page, `!!document.querySelector('.dy-fbox')`, 'SCORES again', 8000);
  ok(await A.page.evaluate(() => document.querySelector('.dy-fbox').getAttribute('aria-checked') === 'false' && /EVERYONE · TODAY/.test(document.querySelector('.dy-body').innerText)), 'the FRIENDS box unchecked on the next visit — EVERYONE again');
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
  // DFIX5 — THE SPOT ICONS (the server's own spots): COAST CLEAR's ticket = ALICE's time, no lamp (a clean run); SCORES · EVERYONE — BOBBY's
  // time + ONE drawn searchlight ("…, 1 spot"), ALICE's none; one line each, never wrapping
  {
    const tkc = await A.page.evaluate(() => { const r = document.querySelector('.dy-ticket[data-id="coastclear"] .dy-result'); return { text: r.textContent, marks: r.querySelectorAll('.dy-mark').length, place: (document.querySelector('.dy-ticket[data-id="coastclear"] .dy-rank') || {}).textContent }; });
    ok(/^\d+:\d\d$/.test(tkc.text) && tkc.marks === 0 && /^(1ST|2ND) OF 2 TODAY$/.test(tkc.place), `COAST CLEAR's ticket: the time, no lamp on a clean run, the everyone place (${JSON.stringify(tkc)})`);
    await click(A.page, '.dy-tab:nth-child(2)');
    await waitFor(A.page, `(() => { const l = document.querySelector('.dy-sec[data-id="coastclear"] .dy-cards'); return l && l.dataset.strips === '2'; })()`, 'COAST CLEAR on SCORES', 10000);
    const cc = await A.page.evaluate(() => [...document.querySelectorAll('.dy-sec[data-id="coastclear"] .dy-crow')].map(r => { const s = r.querySelector('.dy-cscore'), b = s.getBoundingClientRect(); return { who: r.querySelector('.vl-name').textContent, text: s.textContent, marks: s.querySelectorAll('.dy-mark svg path').length ? s.querySelectorAll('.dy-mark').length : 0, label: s.getAttribute('aria-label') || '', oneLine: b.height < 24 }; }));
    const bob = cc.find(r => r.who === 'BOBBY'), ali = cc.find(r => r.who === 'ALICE');
    ok(bob && bob.marks === 1 && /^\d+:\d\d, 1 spot$/.test(bob.label) && bob.oneLine && ali && ali.marks === 0 && ali.oneLine, `SCORES: BOBBY "${bob && bob.label}" — one drawn searchlight; ALICE "${ali && ali.text}" — none`);
    if (H.SHOTS) await H.shotAll(A.page, 'dy-09-spot-icons');
    await click(A.page, '.dy-tab:nth-child(1)');
    await waitFor(A.page, `!!document.querySelector('.dy-today .dy-share')`, 'TODAY again', 8000);
  }
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
  // PFIX-3 — S11, THE CARD IS BUILT BEFORE THE TAP (FABLE REVIEW 2: the tap used to start imports + an /api call + the drawing, and only then
  // the share sheet — Safari may refuse a share that late, and nothing was shown). TODAY with every daily done: the card's file is READY
  // before any tap; the tap calls navigator.share AT ONCE with it; a double tap sends ONE; a phone that can't share a file is SHOWN the card
  // in a sheet (PRESS AND HOLD TO SAVE) + a message — never a silent download.
  {
    const pg = A.page;
    await waitFor(pg, `!!document.querySelector('.dy-today .dy-share')`, 'the SHARE TODAY button', 10000);
    const ready = await pg.evaluate(() => window.__daily2.shareReady());
    ok(ready === true, 'S11: the share card (its PNG file) is BUILT when TODAY shows the button — before any tap');
    // a phone that shares files: the tap reaches navigator.share in the same task as the click (nothing awaited that takes time)
    const fast = await pg.evaluate(async () => {
      const calls = [];
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: d => !!(d && d.files && d.files.length) });
      Object.defineProperty(navigator, 'share', { configurable: true, value: d => { calls.push({ at: performance.now(), file: d.files && d.files[0] ? { name: d.files[0].name, type: d.files[0].type, size: d.files[0].size } : null, text: d.text || '' }); return new Promise(r => setTimeout(r, 400)); } });
      let downloads = 0; const click0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) downloads++; return click0.call(this); };
      const btn = document.querySelector('.dy-today .dy-share'), t0 = performance.now();
      btn.click(); btn.click();                                              // (a double tap)
      await new Promise(r => setTimeout(r, 900));
      HTMLAnchorElement.prototype.click = click0;
      return { calls, t0, downloads, sheet: !!document.querySelector('.shr-img') };
    });
    ok(fast.calls.length === 1, `S11: a double tap sends ONE share (${fast.calls.length})`);
    const c0 = fast.calls[0] || {};
    ok(c0.file && c0.file.name === 'neon-speakeasy-dailies.png' && c0.file.type === 'image/png' && c0.file.size > 20000 && /neonspeakeasy\.com/.test(c0.text), `S11: the share sheet gets the READY file + the line (${JSON.stringify(c0.file)}; "${String(c0.text).slice(0, 60)}")`);
    ok(c0.at - fast.t0 < 50, `S11: navigator.share is called ${(c0.at - fast.t0).toFixed(1)} ms after the tap — at once (it used to wait for imports, /api and the drawing)`);
    ok(fast.downloads === 0 && !fast.sheet, 'S11: shared → no download, no sheet');
    // a phone that CAN'T share a file (plain http, a desktop): the card is SHOWN — the picture + PRESS AND HOLD TO SAVE + a message
    const shown = await pg.evaluate(async () => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
      let shares = 0; Object.defineProperty(navigator, 'share', { configurable: true, value: () => { shares++; return Promise.reject(new Error('no')); } });
      let downloads = 0; const click0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) downloads++; return click0.call(this); };
      document.querySelector('.dy-today .dy-share').click();
      for (let i = 0; i < 60 && !document.querySelector('.shr-img'); i++) await new Promise(r => setTimeout(r, 50));
      const img = document.querySelector('.shr-img');
      if (img && !img.complete) await new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 2000); });
      HTMLAnchorElement.prototype.click = click0;
      const sheet = img && img.closest('.sh');
      return { img: !!img, nat: img ? [img.naturalWidth, img.naturalHeight] : null, w: img ? Math.round(img.getBoundingClientRect().width) : 0, hold: sheet ? /PRESS AND HOLD TO SAVE/.test(sheet.innerText) : false, go: !!(sheet && sheet.querySelector('.shr-go')),
        toast: [...document.querySelectorAll('.sh-msgs b')].map(b => b.textContent).join(' | '), downloads, shares, callout: img ? getComputedStyle(img).webkitTouchCallout || getComputedStyle(img).getPropertyValue('-webkit-touch-callout') : '' };
    });
    ok(shown.img && shown.nat && shown.nat[0] === 1080 && shown.nat[1] === 1350 && shown.w >= 200 && shown.hold, `S11: no file sharing → the card is SHOWN in a sheet (${shown.nat} px, ${shown.w} px wide on screen) with PRESS AND HOLD TO SAVE`);
    // (THE ADD-ON, Nov 14 4:14 pm: NO message over this sheet — it covered the card and repeated the line under it. No shot of it here
    //  either: this suite's third daily is the TEST-ONLY fake — the sheet is reviewed on the preview links, which hold real dailies only)
    ok(!/card is ready/i.test(shown.toast) && shown.downloads === 0 && !shown.go, `S11: nothing over the card (no message: "${shown.toast}") — and never a silent download (${shown.downloads}); no SHARE tube where the phone can't share`);
    await pg.keyboard.press('Escape');
    await waitFor(pg, `!document.querySelector('.shr-img')`, 'the card sheet closed', 6000);
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
  // DFIX5 — THE THROWAWAY GATE on the everyone lists: CASEY never appears, never counts in "OF n"; CASEY's own row = NOT COUNTED (no place)
  { const evB = await dailyAction('e2e-dy-bob', { action: 'every' }), evC = await api(C.page, { action: 'every' });
    const t = evB.every.test;
    ok(t && !t.rows.some(r => r.n === 'CASEY') && t.n === 1 && t.rows.length === 1 && t.rows.every(r => !('k' in r) && !('pid' in r)), `the everyone list: CASEY (a same-day profile) never listed, never counted — n ${t && t.n}, rows ${t && t.rows.map(r => r.n).join(', ')}; no pid in a row`);
    ok(evC.every.test.me && evC.every.test.me.gated === 1 && !evC.every.test.me.rank, `CASEY's own view: her row NOT COUNTED, no place (${JSON.stringify(evC.every.test.me)})`); }
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

  // ================================================================ 9. PFIX-3 — C1, THE CITY's EDGES (FABLE REVIEW 2): wider than a phone held upright
  // (SKINS 2B's tap-guard counted only the title's ROOT as the city — a 560 / 1180 px column — so on a desktop, an iPad and a phone held
  //  sideways every tap BESIDE it was "a screen on top": the door, the signs out there, the hover — dead. The city = the root, its ancestors,
  //  the scene's wrap (ui/layers.js#touchInCity). REAL input at each size, on points BESIDE the column only: the door → JOIN, a game's sign →
  //  its card, the mouse → the pointer; and with the DAILY screen up the very same points stay silent — the guard still holds out there.)
  {
    const W = await openApp('dyw', 'WIDER');
    const pg = W.page;
    const beside = kind => pg.evaluate(async kind => {
      const root = document.querySelector('.title-screen.nd');
      if (!root || !window.__district || !window.__district.hit) return null;
      const r = root.getBoundingClientRect(), out = [];
      const { GAMES } = await import('/js/config.js'), play = new Set(GAMES.filter(g => g.playable).map(g => g.id));
      for (let y = 30; y < innerHeight - 12; y += 6) for (let x = 6; x < innerWidth - 6; x += 6) {
        if (x >= r.left - 3 && x <= r.right + 3) continue;                    // (BESIDE the title's column only)
        const h = window.__district.hit(x, y);
        if (!h || h.kind !== kind) continue;
        const e = document.elementFromPoint(x, y);
        if (e && !root.contains(e) && !e.closest('button, a, input, label, .nd-actions, .menu-btn, .music-btn, .nd-corner')) out.push([x, y, h.id || kind, kind !== 'sign' || play.has(h.id)]);
      }
      return { col: [Math.round(r.left), Math.round(r.right)], pts: out };
    }, kind);
    const mid = pts => pts[Math.floor(pts.length / 2)];
    for (const V of [
      // (the SIDEWAYS framing with a fine pointer — a short wide window. A real PHONE held sideways shows the console's TURN YOUR PHONE UPRIGHT
      //  card over everything (index.html #ns-turn — the owner's Nov 2 rule): its own case below)
      { name: '844 × 390 (the sideways framing, mouse)', view: { width: 844, height: 390, deviceScaleFactor: 1, isMobile: false, hasTouch: false }, touch: false, need: ['door'] },
      { name: '820 × 1180 (an iPad, touch)', view: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, touch: true, need: ['sign'] },
      { name: '1440 × 900 (a desktop, mouse)', view: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false }, touch: false, need: ['door'] },
    ]) {
      await pg.setViewport(V.view);
      await pg.reload();
      await waitFor(pg, `!document.getElementById('boot') && !!window.__arcade && !!window.__district && !!document.querySelector('.title-screen.nd')`, `${V.name}: the title`, 40000);
      // (the city's own hit map must have landed at this size — the door is always on it)
      await waitFor(pg, `(() => { for (let y = 30; y < innerHeight; y += 8) for (let x = 6; x < innerWidth; x += 8) { const h = window.__district.hit(x, y); if (h && h.kind === 'door') return true; } return false; })()`, `${V.name}: the city's hit map`, 30000);
      const tapAt = async (x, y) => { if (V.touch) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); };
      /** tap until the city answers (its opening timeline may still be running right after the load) */
      const until = async (x, y, js) => { for (let i = 0; i < 14; i++) { await tapAt(x, y); if (await pg.waitForFunction(js, { timeout: 700, polling: 50 }).then(() => true).catch(() => false)) return true; } return false; };
      const door = await beside('door'), sign = await beside('sign');
      for (const k of V.need) ok((k === 'door' ? door : sign).pts.length > 0, `${V.name}: the ${k} lies BESIDE the title's column (x ${door.col[0]}–${door.col[1]}; ${(k === 'door' ? door : sign).pts.length} points out there)`);
      if (door.pts.length) {
        const [x, y] = mid(door.pts);
        ok(!(await pg.evaluate((x, y) => window.__district.covered(document.elementFromPoint(x, y)), x, y)), `${V.name}: beside the column, nothing open → NOT covered (the touch is the city's)`);
        if (!V.touch) {
          await pg.mouse.move(x - 3, y - 3); await pg.mouse.move(x, y);
          const hov = await pg.waitForFunction(() => document.querySelector('.title-screen.nd').classList.contains('nd-hovering'), { timeout: 8000, polling: 50 }).then(() => true).catch(() => false);
          ok(hov, `${V.name}: the mouse over the door at [${x}, ${y}] → the pointer + the glow`);
        }
        ok(await until(x, y, `document.querySelector('.nd-actions').classList.contains('is-join')`), `${V.name}: the door at [${x}, ${y}] → JOIN opens`);
        await pg.evaluate(() => { if (document.querySelector('.nd-actions').classList.contains('is-join')) document.querySelector('.nd-tab-join').click(); });
        await waitFor(pg, `!document.querySelector('.nd-actions').classList.contains('is-join')`, `${V.name}: JOIN closed`, 6000);
      }
      // (a sign of a playable game opens its card; one of a game still to come answers with its COMING SOON message — either way the city answered)
      const soon = sign.pts.filter(p => !p[3]);
      sign.pts = sign.pts.filter(p => p[3]);
      if (!sign.pts.length && soon.length) {
        const [x, y, id] = mid(soon);
        ok(await until(x, y, `[...document.querySelectorAll('.sh-msgs b')].some(t => /coming soon/i.test(t.textContent))`), `${V.name}: ${id}'s sign at [${x}, ${y}] (a game still to come) → its COMING SOON message`);
      }
      if (sign.pts.length) {
        const [x, y, id] = mid(sign.pts);
        ok(await until(x, y, `!!document.querySelector('.nd-card-sheet')`), `${V.name}: ${id}'s sign at [${x}, ${y}] → its card opens`);
        await pg.keyboard.press('Escape');
        await waitFor(pg, `!document.querySelector('.nd-card-sheet')`, `${V.name}: the card closed`, 6000);
        await sleep(400);
        // the guard still holds out there: the DAILY screen up → the same point is silent
        await pg.evaluate(() => { window.__pops = 0; window.__popObs = new MutationObserver(l => { for (const m of l) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches('.sh, .modal, .sheet')) window.__pops++; }); window.__popObs.observe(document.body, { childList: true }); });
        await pg.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen' } })));
        await waitFor(pg, `!!document.querySelector('.dy-overlay.dy-screen')`, `${V.name}: the DAILY screen`, 15000);
        const plain = await pg.evaluate((x, y) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('.dy-overlay') && !e.closest('button, a, input, label')); }, x, y);
        if (plain) { for (let i = 0; i < 3; i++) { await tapAt(x, y); await sleep(150); } }
        await sleep(400);
        const quiet = await pg.evaluate(() => ({ pops: window.__pops, card: !!document.querySelector('.nd-card-sheet'), daily: !!document.querySelector('.dy-screen') }));
        ok(plain ? quiet.pops === 0 && !quiet.card && quiet.daily : quiet.daily, `${V.name}: the DAILY screen up → the same point is silent (${plain ? `${quiet.pops} pop-ups` : 'a button sits there — not tapped'})`);
        await pg.evaluate(() => { window.__popObs.disconnect(); return import('/js/store.js').then(m => m.setState({ daily: null })); });
        await waitFor(pg, `!document.querySelector('.dy-overlay')`, `${V.name}: the DAILY screen closed`, 8000);
      }
    }
    // A REAL PHONE HELD SIDEWAYS (844 × 390, touch): the TURN YOUR PHONE UPRIGHT card is the screen on top — it owns every touch; the door's
    // own point stays silent under it (before SKINS 2B's guard a tap went THROUGH the card and opened JOIN behind it)
    await pg.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.reload();
    await waitFor(pg, `!document.getElementById('boot') && !!window.__arcade && !!window.__district && !!document.querySelector('.title-screen.nd')`, 'the phone held sideways: the title', 40000);
    await waitFor(pg, `(() => { for (let y = 30; y < innerHeight; y += 8) for (let x = 6; x < innerWidth; x += 8) { const h = window.__district.hit(x, y); if (h && h.kind === 'door') return true; } return false; })()`, 'the phone held sideways: the hit map', 30000);
    const turn = await pg.evaluate(() => { const t = document.getElementById('ns-turn'); return !!t && getComputedStyle(t).display !== 'none'; });
    const dpt = await pg.evaluate(() => { for (let y = 30; y < innerHeight - 12; y += 6) for (let x = 6; x < 140; x += 6) { const h = window.__district.hit(x, y); if (h && h.kind === 'door') return [x, y]; } return null; });
    ok(turn && !!dpt, `a real phone held sideways (844 × 390, touch): TURN YOUR PHONE UPRIGHT is up over the city (the door under it at ${JSON.stringify(dpt)})`);
    if (dpt) {
      await sleep(3000);                                                      // (past the opening — a tap would be answered if it could be)
      for (let i = 0; i < 4; i++) { await pg.touchscreen.tap(dpt[0], dpt[1]); await sleep(200); }
      const q = await pg.evaluate((x, y) => ({ join: document.querySelector('.nd-actions').classList.contains('is-join'), card: !!document.querySelector('.nd-card-sheet'), cov: window.__district.covered(document.elementFromPoint(x, y)) }), dpt[0], dpt[1]);
      ok(!q.join && !q.card && q.cov, `… the card owns the touch: 4 taps on the door's point → no JOIN, no game card behind it (${JSON.stringify(q)})`);
    }
    await W.ctx.close();
    // THE TITLE PREVIEW held sideways (the owner's check link — the preview page has no TURN card): the door at the far left → JOIN
    {
      const ctx = await browser.createBrowserContext(), pv = await ctx.newPage();
      await pv.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await pv.goto(guardUrl(`${BASE}/tests/integration/title-preview.html`, 'e2e-daily'));
      await waitFor(pv, `!!window.__district && !!document.querySelector('.title-screen.nd') && (() => { for (let y = 30; y < innerHeight; y += 8) for (let x = 6; x < 140; x += 8) { const h = window.__district.hit(x, y); if (h && h.kind === 'door') return true; } return false; })()`, 'the title preview sideways', 40000);
      // (the door's point asked again before every tap — the preview's camera is still settling right after its load)
      const doorPt = () => pv.evaluate(() => { const pts = []; for (let y = 30; y < innerHeight - 12; y += 6) for (let x = 6; x < 140; x += 6) { const h = window.__district.hit(x, y); if (h && h.kind === 'door') pts.push([x, y]); } return pts[Math.floor(pts.length / 2)] || null; });
      let opened = false, pt = null;
      for (let i = 0; i < 20 && !opened; i++) { pt = await doorPt(); if (!pt) { await sleep(400); continue; } await pv.touchscreen.tap(pt[0], pt[1]); opened = await pv.waitForFunction(() => document.querySelector('.nd-actions').classList.contains('is-join'), { timeout: 700, polling: 50 }).then(() => true).catch(() => false); }
      ok(opened, `the title preview held sideways (844 × 390, touch — no TURN card there): the door at [${pt}] → JOIN opens`);
      await ctx.close();
    }
  }
});
