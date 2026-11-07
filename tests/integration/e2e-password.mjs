// THE PASSWORD — the daily end to end (PW1 — docs/password.md; the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`):
//   node e2e-password.mjs "<browser>" ./shots-password        (env SHOTS=0, E2E_BASE=http://localhost:<port>; FAST=1 = the same path)
// The REAL view (password-daily.html) with THE API JUDGE against the REAL /api/daily: start → a refused non-word (no cost) → a miss → a
// refresh mid-door RESUMES the marks → THE DOOR cracked → the hand-off → letters typed, the screen torn down + rebuilt (the row cleared, the
// run on the same door) → THE BACK ROOM cracked → the result + the server's score → ONE TRY (a reload lands on the result, the keys locked).
// A second phone: six misses → THE DOOR HELD, 206. The day's words come from the server's own schedule (api/_lib/pw.js on the emulator pepper).
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
const settle = page => page.waitForFunction(() => window.__password && !window.__password.busy() && !window.__password.state().handoff, { timeout: 20000 });
const marksOf = (page, row) => page.$$eval(`.pw-row:nth-child(${row + 1}) .pw-tile`, ts => ts.map(t => (t.className.match(/is-(hit|near|miss)/) || [])[1] || '-'));

await H.run(async () => {
  await ref(`dly/password/${day}`).remove();   // a fresh day on the emulator
  const p = await openPhone('pw0', 'ALICE');
  ok((await S(p)).guesses.join() === '0,0' && (await p.$eval('.pw-line', e => e.textContent)) === 'DOOR 1 · THE DOOR · 6 OF 6 LEFT', 'START: an empty board, THE DOOR in play (the server\'s run: no guesses yet)');
  const kbx = await p.evaluate(() => ({ back: !!document.querySelector('.gk-kb-key.is-back svg'), go: document.querySelector('.gk-kb-r3 .gk-go').textContent.trim(), glyph: /[⌫✓✕]/.test(document.querySelector('.pw-screen').innerText) }));
  ok(kbx.back && kbx.go === 'ENTER' && !kbx.glyph, 'the kit keyboard: ENTER + a DRAWN delete key (no glyph icons anywhere on the screen)');
  await shotAll(p, 'pw-01-empty');

  // ---- a word that isn't one: refused on the phone's pre-check, NOTHING written; a non-word past the pre-check is refused by the server the same way
  await typeWord(p, 'QZXWV'); await enter(p);
  await p.waitForFunction(() => document.querySelector('.pw-note.is-on') && /NOT IN THE LIST/.test(document.querySelector('.pw-note').textContent), { timeout: 3000 });
  ok((await S(p)).guesses.join() === '0,0' && (await S(p)).typed === 'QZXWV', 'REFUSED: "NOT IN THE LIST", the row shakes, nothing counted (the letters stay to fix)');
  await shotAll(p, 'pw-02-refused', [[390, 844]]);
  for (let i = 0; i < 5; i++) await tap(p, '⌫');
  // the server's own check: a word the pre-check can't see (the list not loaded) → 422 not_a_word, no cost
  const srv = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'guess', game: 'password', word: 'ZZZZZ' }).then(() => 'ok', e => e.code)));
  ok(srv === 'not_a_word' && (await val(`dly/password/${day}/p/${await p.evaluate(() => window.__daily.pid)}`)) === null, 'the server refuses a non-word too (422 not_a_word) — nothing stored');

  // ---- a miss, judged by the server: five flat tiles, the keys dimmed
  await typeWord(p, MISS); await enter(p); await settle(p);
  ok((await S(p)).guesses.join() === '1,0' && (await marksOf(p, 0)).every(m => m === 'miss'), `a miss judged on the server: ${MISS} → five MISS tiles`);
  ok((await p.$$eval('.gk-kb-key[data-st="miss"]', ks => ks.length)) === 5, 'the five keys dimmed');
  const pid = await p.evaluate(() => window.__daily.pid);
  const rec1 = await val(`dly/password/${day}/p/${pid}`);
  ok(rec1 && rec1.g && rec1.g[0] && rec1.g[0][0] === MISS && !JSON.stringify(rec1).includes('miss'), 'the server keeps the WORD only (no marks, no answer)');

  // ---- a refresh mid-door resumes: the same row, the same marks, from the server
  await p.reload(); await ready(p);
  ok((await S(p)).guesses.join() === '1,0' && (await marksOf(p, 0)).every(m => m === 'miss') && (await S(p)).typed === '', 'REFRESH mid-door → the run resumes from the server (the marks back, the typed row empty)');

  // ---- THE DOOR cracked → the hand-off → THE BACK ROOM
  await typeWord(p, W1); await enter(p);
  await p.waitForFunction(() => document.querySelector('.pw-handoff.is-in'), { timeout: 8000 });
  ok(true, 'THE DOOR OPENS → the hand-off card (THE BACK ROOM)');
  await settle(p);
  const chip = await p.$eval('.pw-door[data-door="0"]', e => `${e.className}|${e.textContent}`);
  ok((await S(p)).door === 1 && /is-open/.test(chip) && /2$/.test(chip.split('|')[1]) && (await marksOf(p, 0)).every(m => m === '-'), `door 2 in play: THE DOOR's chip carries its check + 2 guesses, a fresh grid (${chip.split('|')[1]})`);
  ok((await p.$eval('.pw-line', e => e.textContent)) === 'DOOR 2 · THE BACK ROOM · 6 OF 6 LEFT', 'the line: DOOR 2 · THE BACK ROOM · 6 OF 6 LEFT');

  // ---- a wrong guess on door 2, then letters typed + the screen torn down (the room starts a game) → rebuilt: the row cleared, the door kept
  const wrong2 = pwLists().answers.find(w => w !== W2 && [...w].filter(c => W2.includes(c)).length >= 2 && !W1.includes(w[0])) || MISS;
  await typeWord(p, wrong2); await enter(p); await settle(p);
  const m2 = await marksOf(p, 0);
  ok((await S(p)).guesses.join() === '2,1' && m2.some(m => m === 'hit' || m === 'near'), `door 2's first guess judged (${m2.join(' ')})`);
  await typeWord(p, 'LI');
  ok((await S(p)).typed === 'LI', 'two letters typed, not sent');
  await p.evaluate(() => window.__suspend());
  ok(!(await p.$('.pw-grid')) && !(await p.evaluate(() => !!window.__password)), 'SUSPENDED: the screen is gone (the room started a game)');
  await p.evaluate(() => window.__resume()); await ready(p);
  const after = await S(p);
  ok(after.door === 1 && after.guesses.join() === '2,1' && after.typed === '' && (await marksOf(p, 0)).join() === m2.join() && (await p.$$eval('.pw-tile.is-typed', t => t.length)) === 0, 'RESUMED: the same door + guess, the marks back, the unsent letters CLEARED');
  await shotAll(p, 'pw-03-door2');

  // ---- THE BACK ROOM cracked → the result, the server's score
  await typeWord(p, W2); await enter(p);
  await p.waitForFunction(() => document.querySelector('.pw-end.is-in'), { timeout: 10000 });
  await p.waitForFunction(() => /RECORDED/.test(document.querySelector('.pw-end-note').textContent), { timeout: 10000 });
  const end = await p.evaluate(() => ({ t: document.querySelector('.pw-end .pw-card-t').textContent, rows: [...document.querySelectorAll('.pw-end-row b')].map(b => b.textContent), words: [...document.querySelectorAll('.pw-end-word b')].map(b => b.textContent), note: document.querySelector('.pw-end-note').textContent, locked: !!document.querySelector('.gk-keyboard.is-locked') }));
  ok(end.t === 'YOU\'RE IN' && end.rows[0] === '2/2' && end.rows[1] === '4' && end.words.join() === `${W1},${W2}` && end.locked, `THE RESULT: YOU'RE IN · 2/2 doors · 4 guesses · both words shown (${end.rows.join(' · ')})`);
  ok(end.note === 'RECORDED · SCORE 4' && (await val(`dly/password/${day}/r/${pid}`)) === 4, 'the server scored it from ITS record: 4 (2 + 2 guesses)');
  await shotAll(p, 'pw-04-crack');
  await H.cleanText(p, 'the result', '.pw-screen');

  // ---- ONE TRY: a reload lands on the result; the keys stay locked; a guess is refused
  await p.reload(); await ready(p);
  await p.waitForFunction(() => document.querySelector('.pw-end.is-in'), { timeout: 8000 });
  ok((await S(p)).done && (await p.$eval('.gk-keyboard', e => e.classList.contains('is-locked'))), 'ONE TRY: a reload shows the result, the keyboard locked');
  const again = await p.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'guess', game: 'password', word: 'ABOUT' }).then(() => 'ok', e => e.code)));
  ok(again === 'finished', 'a guess after the run: 409 finished');

  // ---- a second phone: THE DOOR HELD (six misses) → 206, THE BACK ROOM never opened, its word in no response
  const p2 = await openPhone('pw1', 'BOB');
  const leaks = [];
  p2.on('response', async r => { if (r.url().includes('/api/daily')) { try { const t = await r.text(); if (t.includes(`"${W2}"`)) leaks.push(t.slice(0, 80)); } catch { /* */ } } });
  for (let i = 0; i < 6; i++) { await typeWord(p2, MISS); await enter(p2); await settle(p2); }
  await p2.waitForFunction(() => document.querySelector('.pw-end.is-in') && /RECORDED/.test(document.querySelector('.pw-end-note').textContent), { timeout: 12000 });
  const end2 = await p2.evaluate(() => ({ t: document.querySelector('.pw-end .pw-card-t').textContent, words: [...document.querySelectorAll('.pw-end-word b')].map(b => b.textContent), note: document.querySelector('.pw-end-note').textContent, reveal: document.querySelector('.pw-reveal').textContent, chip: document.querySelector('.pw-door[data-door="0"]').className }));
  ok(end2.t === 'THE DOOR HELD' && end2.words[0] === W1 && end2.words[1] === 'NEVER OPENED' && end2.note === 'RECORDED · SCORE 206' && /is-shut/.test(end2.chip), 'BOB: THE DOOR HELD · its word shown · THE BACK ROOM never opened · 206');
  ok(leaks.length === 0, 'THE BACK ROOM\'s word was in NO response to BOB');
  await shotAll(p2, 'pw-05-fail1');
  await H.cleanText(p2, 'the door held', '.pw-screen');
});
