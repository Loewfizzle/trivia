// THE PASSWORD — the daily end to end (PW1 + PW2 — docs/password.md; the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`):
//   node e2e-password.mjs "<browser>" ./shots-password        (env SHOTS=0, E2E_BASE=http://localhost:<port>; FAST=1 = the same path)
// The REAL view (password-daily.html) with THE API JUDGE against the REAL /api/daily: start → a refused non-word (no cost) → a miss → a
// refresh mid-door RESUMES the marks → a LOOK FLIP mid-guess (the typed letters stay, the tiles re-theme) → THE FRONT DOOR cracked → THE DOOR
// REVEAL (the drawn door swings open) → the screen torn down MID-REVEAL + rebuilt (THE BACK ROOM's board, the front door opened) → letters typed,
// torn down + rebuilt again (the row cleared) → THE BACK ROOM cracked → THE END SCREEN (the board + keyboard gone; YOU'RE IN · 4 GUESSES · both
// mini grids + words · SHARE · the countdown) + the server's score → ONE TRY (a reload lands on the end screen). A second phone: six misses →
// THE FRONT DOOR HELD (the door dims, the word shown, one mini grid), 206, THE BACK ROOM's word in no response.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { ref, val } from '../../api/_lib/fb.js';
import { wordsFor, pwLists } from '../../api/_lib/pw.js';
import { streakDay } from '../../js/core/streak.js';

const H = await createHarness({ name: 'password', slot: 'pw', sizes: [[390, 844], [402, 874], [430, 932]] });
const { log, sleep, ok, shotAll, BASE, browser } = H;
const day = streakDay(Date.now());
const [W1, W2] = wordsFor(day);
const bad = new Set((W1 + W2).split(''));
const MISS = pwLists().answers.find(w => new Set(w).size === 5 && ![...w].some(c => bad.has(c))) || 'XXXXX';
log(`today ${day}: the miss word ${MISS} (the answers stay in this log's head only)`);

const openPhone = async (slot, name) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|permission|Failed to load resource/i.test(m.text())) H.errors.push(`${name}: ${m.text()}`); });
  await page.setViewport(H.VIEW);
  await page.goto(guardUrl(`${BASE}/tests/integration/password-daily.html?emu&slot=${slot}&name=${name}`, 'e2e-password'));
  await ready(page);
  return page;
};
const ready = page => page.waitForFunction(() => document.body.dataset.ready === '1' && window.__password && window.__password.run() && !window.__password.busy(), { timeout: 30000 });
const S = page => page.evaluate(() => window.__password.state());
const tap = async (page, k) => { await page.click(`.gk-kb-key[data-k="${k}"]`); await sleep(40); };
const typeWord = async (page, w) => { for (const ch of w) await tap(page, ch); };
const enter = page => page.click('.gk-kb-r3 .gk-go');
const settle = page => page.waitForFunction(() => window.__password && !window.__password.busy() && !window.__password.state().reveal, { timeout: 20000 });
const marksOf = (page, row) => page.$$eval(`.pw-row:nth-child(${row + 1}) .pw-tile`, ts => ts.map(t => (t.className.match(/is-(hit|near|miss)/) || [])[1] || '-'));
const doorsOf = page => page.$$eval('.pw-dr', ds => ds.map(d => `${d.dataset.st}:${d.querySelector('.pw-dr-sub').textContent}`));
const endOf = page => page.evaluate(() => ({
  on: !!document.querySelector('.pw-endscr.is-in'), playGone: !!document.querySelector('.pw-play[hidden]') && !document.querySelector('.pw-play:not([hidden]) .gk-keyboard'),
  t: document.querySelector('.pw-end-t').textContent, n: (document.querySelector('.pw-end-n') || {}).textContent, time: (document.querySelector('.pw-end-time') || {}).textContent, line: (document.querySelector('.pw-end-line') || {}).textContent,
  top: document.querySelector('.pw-end-t').getBoundingClientRect().top - document.querySelector('.pw-doors').getBoundingClientRect().bottom,
  grids: [...document.querySelectorAll('.pw-mini')].map(g => g.querySelectorAll('.pw-mini-row').length), letters: /[A-Z]/.test([...document.querySelectorAll('.pw-mini')].map(g => g.textContent).join('')),
  words: [...document.querySelectorAll('.pw-end-word')].map(b => b.textContent), share: !!document.querySelector('.btn.pw-share.btn-primary'),
  next: document.querySelector('.pw-end-next').textContent, rec: document.querySelector('.pw-end-rec').textContent, glyph: /[⌫✓✕]|\p{Extended_Pictographic}/u.test(document.querySelector('.pw-screen').innerText),
}));

await H.run(async () => {
  await ref(`dly/password/${day}`).remove();   // a fresh day on the emulator
  const p = await openPhone('pw0', 'ALICE');
  ok((await S(p)).guesses.join() === '0,0' && (await doorsOf(p)).join('|') === 'on:6 OF 6 LEFT|locked:' && !(await p.$('.pw-line')), 'START: an empty board, THE FRONT DOOR lit (6 OF 6 LEFT), THE BACK ROOM a dim outline with NO label — no status line, no pills');
  const names = await p.$$eval('.pw-dr-name', ns => ns.map(n => n.textContent));
  ok(names.join('|') === 'THE FRONT DOOR|THE BACK ROOM' && !/THE DOOR\b/.test(await p.$eval('.pw-screen', e => e.innerText)), 'THE RENAME: THE FRONT DOOR → THE BACK ROOM (never "THE DOOR")');
  const kbx = await p.evaluate(() => ({ back: !!document.querySelector('.gk-kb-key.is-back svg'), go: document.querySelector('.gk-kb-r3 .gk-go').textContent.trim(), glyph: /[⌫✓✕]/.test(document.querySelector('.pw-screen').innerText), pill: [...document.querySelectorAll('.pw-screen *')].some(e => parseFloat(getComputedStyle(e).borderRadius) >= 100) }));
  ok(kbx.back && kbx.go === 'ENTER' && !kbx.glyph && !kbx.pill, 'the kit keyboard: ENTER + a DRAWN delete key (no glyph icons, no capsule anywhere on the screen)');
  await shotAll(p, 'pw-01-empty');

  // ---- a word that isn't one: refused on the phone's pre-check, NOTHING written; a non-word past the pre-check is refused by the server the same way
  await typeWord(p, 'QZXWV'); await enter(p);
  await p.waitForFunction(() => document.querySelector('.pw-note.is-on') && /NOT IN THE LIST/.test(document.querySelector('.pw-note').textContent), { timeout: 3000 });
  ok((await S(p)).guesses.join() === '0,0' && (await S(p)).typed === 'QZXWV', 'REFUSED: "NOT IN THE LIST", the row shakes, nothing counted (the letters stay to fix)');
  for (let i = 0; i < 5; i++) await tap(p, '⌫');
  const srv = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'guess', game: 'password', word: 'ZZZZZ' }).then(() => 'ok', e => e.code)));
  ok(srv === 'not_a_word' && (await val(`dly/password/${day}/p/${await p.evaluate(() => window.__daily.pid)}`)) === null, 'the server refuses a non-word too (422 not_a_word) — nothing stored');

  // ---- a miss, judged by the server: five sunken tiles, the keys dimmed
  await typeWord(p, MISS); await enter(p); await settle(p);
  ok((await S(p)).guesses.join() === '1,0' && (await marksOf(p, 0)).every(m => m === 'miss'), `a miss judged on the server: ${MISS} → five MISS tiles`);
  ok((await p.$$eval('.gk-kb-key[data-st="miss"]', ks => ks.length)) === 5 && (await doorsOf(p))[0] === 'on:5 OF 6 LEFT', 'the five keys dimmed; the door says 5 OF 6 LEFT');
  const pid = await p.evaluate(() => window.__daily.pid);
  const rec1 = await val(`dly/password/${day}/p/${pid}`);
  ok(rec1 && rec1.g && rec1.g[0] && rec1.g[0][0] === MISS && !JSON.stringify(rec1).includes('miss'), 'the server keeps the WORD only (no marks, no answer)');

  // ---- a refresh mid-door resumes: the same row, the same marks, from the server
  await p.reload(); await ready(p);
  ok((await S(p)).guesses.join() === '1,0' && (await marksOf(p, 0)).every(m => m === 'miss') && (await S(p)).typed === '', 'REFRESH mid-door → the run resumes from the server (the marks back, the typed row empty)');

  // ---- THE LOOK FLIP mid-guess (PW2 — the console sets body[data-look]; the game re-themes live): the typed letters stay, the tiles change colour
  await typeWord(p, 'AB');
  const night = await p.$eval('.pw-tile', t => getComputedStyle(t).backgroundColor + '|' + getComputedStyle(t).color);
  await p.evaluate(() => { document.body.dataset.look = 'day'; });
  await sleep(450);
  const dayLook = await p.evaluate(() => ({ tile: getComputedStyle(document.querySelector('.pw-tile')).backgroundColor + '|' + getComputedStyle(document.querySelector('.pw-tile')).color, sign: document.querySelector('.pw-sign').textContent, after: getComputedStyle(document.querySelector('.pw-screen'), '::after').opacity }));
  ok((await S(p)).typed === 'AB' && dayLook.tile !== night && dayLook.after === '1' && /the password\./i.test(dayLook.sign), `LOOK FLIP mid-guess → DAY: the letters stay (AB), the tiles re-theme, the sky layer in, the sign "the password." (${dayLook.tile})`);
  await shotAll(p, 'pw-02-day', [[390, 844]]);
  await p.evaluate(() => { document.body.dataset.look = 'night'; });
  const backNight = await p.waitForFunction(n => getComputedStyle(document.querySelector('.pw-tile')).backgroundColor + '|' + getComputedStyle(document.querySelector('.pw-tile')).color === n, { timeout: 3000 }, night).then(() => true, () => false);
  ok(backNight && (await S(p)).typed === 'AB', 'and back to NIGHT (the ~0.3 s crossfade settled), the letters still there');
  for (let i = 0; i < 2; i++) await tap(p, '⌫');

  // ---- THE FRONT DOOR cracked → THE DOOR REVEAL; torn down MID-REVEAL (the room starts a game) → rebuilt on THE BACK ROOM's board
  await typeWord(p, W1); await enter(p);
  await p.waitForFunction(() => window.__password.state().reveal && document.querySelector('.pw-dr[data-door="0"]').dataset.st === 'open', { timeout: 8000 });
  ok((await S(p)).door === 1 && (await S(p)).reveal, 'THE FRONT DOOR cracked → the reveal: the drawn door swings OPEN (the run already on door 2)');
  await shotAll(p, 'pw-03-reveal', [[390, 844]]);
  await p.evaluate(() => window.__suspend());
  ok(!(await p.$('.pw-grid')) && !(await p.evaluate(() => !!window.__password)), 'SUSPENDED mid-reveal: the screen is gone');
  await p.evaluate(() => window.__resume()); await ready(p);
  ok((await S(p)).door === 1 && !(await S(p)).reveal && (await doorsOf(p)).join('|') === 'open:2 GUESSES|on:6 OF 6 LEFT' && (await marksOf(p, 0)).every(m => m === '-'), 'RESUMED mid-reveal → THE BACK ROOM\'s empty board, THE FRONT DOOR opened (2 GUESSES), THE BACK ROOM lit (6 OF 6 LEFT)');

  // ---- a wrong guess on door 2, then letters typed + the screen torn down → rebuilt: the row cleared, the door kept
  const wrong2 = pwLists().answers.find(w => w !== W2 && [...w].filter(c => W2.includes(c)).length >= 2 && !W1.includes(w[0])) || MISS;
  await typeWord(p, wrong2); await enter(p); await settle(p);
  const m2 = await marksOf(p, 0);
  ok((await S(p)).guesses.join() === '2,1' && m2.some(m => m === 'hit' || m === 'near'), `door 2's first guess judged (${m2.join(' ')})`);
  await typeWord(p, 'LI');
  await p.evaluate(() => window.__suspend());
  await p.evaluate(() => window.__resume()); await ready(p);
  const after = await S(p);
  ok(after.door === 1 && after.guesses.join() === '2,1' && after.typed === '' && (await marksOf(p, 0)).join() === m2.join() && (await p.$$eval('.pw-tile.is-typed', t => t.length)) === 0, 'torn down with letters typed → RESUMED: the same door + guess, the marks back, the unsent letters CLEARED');
  await shotAll(p, 'pw-04-door2');

  // ---- THE BACK ROOM cracked → the short reveal → THE END SCREEN, the server's score
  await typeWord(p, W2); await enter(p);
  await p.waitForFunction(() => document.querySelector('.pw-endscr.is-in'), { timeout: 12000 });
  await p.waitForFunction(() => window.__password.finished() === 'RECORDED', { timeout: 10000 });
  const end = await endOf(p);
  ok(end.on && end.playGone, 'THE END SCREEN: the board + the keyboard are GONE');
  ok(end.t === 'WELCOME IN' && end.n.trim() === '4GUESSES' && /^\d+:\d\d$/.test(end.time) && end.grids.join() === '2,2' && !end.letters && end.words.join() === `${W1},${W2}`, `WELCOME IN · 4 GUESSES · the time · two mini grids (no letters) · both words (${end.words.join(' · ')})`);
  ok(end.top > 8 && end.top < 60 && end.rec === '', `the result block sits just under the door row (${Math.round(end.top)} pt), no status text`);
  ok(end.share && /^NEXT PASSWORD IN \d+:\d\d:\d\d$/.test(end.next) && !end.glyph, `SHARE is the one pink tube; the countdown ticks (${end.next}); no glyph icons`);
  ok((await val(`dly/password/${day}/r/${pid}`)) === 4, 'the server scored it from ITS record: 4 (2 + 2 guesses)');
  ok((await doorsOf(p)).join('|') === 'open:2 GUESSES|open:2 GUESSES', 'both drawn doors open');
  await shotAll(p, 'pw-05-crack');
  await p.evaluate(() => { document.body.dataset.look = 'day'; }); await sleep(450);
  ok(!!(await p.$('.pw-endscr.is-in')) && (await endOf(p)).n.trim() === '4GUESSES', 'a look flip ON the end screen: the screen stands');
  await shotAll(p, 'pw-05-crack-day', [[390, 844]]);
  await p.evaluate(() => { document.body.dataset.look = 'night'; });
  await H.cleanText(p, 'the result', '.pw-screen');

  // ---- ONE TRY: a reload lands on the end screen; a guess is refused
  await p.reload(); await ready(p);
  await p.waitForFunction(() => document.querySelector('.pw-endscr.is-in'), { timeout: 8000 });
  ok((await S(p)).done && (await endOf(p)).playGone, 'ONE TRY: a reload shows the end screen (no board, no keys)');
  const again = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'guess', game: 'password', word: 'ABOUT' }).then(() => 'ok', e => e.code)));
  ok(again === 'finished', 'a guess after the run: 409 finished');

  // ---- a second phone: THE FRONT DOOR HELD (six misses) → 206, THE BACK ROOM never opened, its word in no response
  const p2 = await openPhone('pw1', 'BOB');
  const leaks = [];
  p2.on('response', async r => { if (r.url().includes('/api/daily')) { try { const t = await r.text(); if (t.includes(`"${W2}"`)) leaks.push(t.slice(0, 80)); } catch { /* */ } } });
  for (let i = 0; i < 5; i++) { await typeWord(p2, MISS); await enter(p2); await settle(p2); }
  await typeWord(p2, MISS); await enter(p2);
  await p2.waitForFunction(() => document.querySelector('.pw-dr[data-door="0"]').dataset.st === 'held' && !document.querySelector('.pw-reveal').hidden, { timeout: 8000 });
  ok(/HELD · THE WORD WAS/.test(await p2.$eval('.pw-reveal', e => e.textContent)) && (await p2.$eval('.pw-reveal b', e => e.textContent)) === W1 && (await doorsOf(p2))[0] === 'held:LOCKED OUT', 'BOB: THE FRONT DOOR held — the door dims red, LOCKED OUT under it, its word shown under the grid');
  await shotAll(p2, 'pw-06-held', [[390, 844]]);
  await p2.waitForFunction(() => document.querySelector('.pw-endscr.is-in') && window.__password.finished() === 'RECORDED', { timeout: 12000 });
  const end2 = await endOf(p2);
  ok(end2.t === 'LOCKED OUT' && end2.n == null && /^6 GUESSES · \d+:\d\d$/.test(end2.line) && end2.grids.join() === '6' && end2.words.join() === W1 && (await doorsOf(p2)).join('|') === 'held:LOCKED OUT|locked:', 'THE END SCREEN: LOCKED OUT (no big number — one small line: 6 GUESSES · the time) · ONE mini grid + its word · THE FRONT DOOR reads LOCKED OUT, THE BACK ROOM dim with no label');
  ok(!/HELD|RECORD/.test(await p2.$eval('.pw-endscr', e => e.textContent)), 'no HELD, no status text anywhere on the end screen');
  ok((await val(`dly/password/${day}/r/${await p2.evaluate(() => window.__daily.pid)}`)) === 206 && leaks.length === 0, 'the server: 206; THE BACK ROOM\'s word was in NO response to BOB');
  const fit = await p2.evaluate(() => { const e = document.querySelector('.pw-end-t'); return { fits: e.scrollWidth <= e.clientWidth + 1, size: getComputedStyle(e).fontSize }; });
  ok(fit.fits && fit.size === (await p.$eval('.pw-end-t', e => getComputedStyle(e).fontSize)), `LOCKED OUT fits its line at the same size + weight as WELCOME IN (${fit.size})`);
  await shotAll(p2, 'pw-07-fail1');
  await H.cleanText(p2, 'the door held', '.pw-screen');
});
