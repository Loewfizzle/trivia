// FIXES R2 — GROUP 2, TAP A TICKET: a real phone (Chromium 390 × 844 @3, the emulators + serve.mjs --emu) whose player FINISHED all three
// dailies today (played here over /api in-process — THE PASSWORD locked out, COAST CLEAR caught, THE DROP topped out by the bot). THE DAILIES →
// TODAY: each finished ticket is tappable → its END SCREEN in a sheet (the server's `ended` — read-only), the game's own end-screen block:
// THE PASSWORD the doors' marks + words · COAST CLEAR the final harbor with every light · THE DROP its final board + time / lines (its row may
// be OFF on this server: its sheet opened with the server's own answer). Shots: Downloads\NEON\fixes-r2\ticket-*-390.png (SHOTS=<dir>).
//   node tests/integration/daily-tickets.mjs "<chromium>"
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.DAILY_TEST = '1';
process.env.DAILY_TEST_OFF = 'drop';   // (THE DROP's row ships OFF — opened in THIS process only, as daily-drop.test does)
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';
import { fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { loadDailies } from '../../api/_lib/dailies.js';
import { wordsFor, pwLists } from '../../api/_lib/pw.js';
import { ccBoard } from '../../api/_lib/cc.js';
import { streakDay } from '../../js/core/streak.js';
import { GUESSES } from '../../js/games/password/logic.js';
import { createDropRun, input, stepTo, TICK } from '../../js/games/prism/drop.js';
import { CK_MS } from '../../js/games/prism/drop-judge.js';
import { dropKey } from '../../js/games/prism/bot.js';
import { rngFrom } from '../../js/core/rng.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
await loadDailies();
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
try {
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:tk1:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  p.on('pageerror', e => fails.push(`page error: ${e.message}`));
  await p.goto(guardUrl(`${BASE}/?emu&slot=tk1&city=2&idle=1`, 'daily-tickets.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__arcade.state.uid)', { timeout: 60000 });
  const uid = await p.evaluate('window.__arcade.state.uid');
  const now0 = Date.now(), day = streakDay(now0);
  await profileAction(uid, { action: 'ensure', name: 'Ava', avatar: 'bolt', color: 'cyan' }, '', now0 - 7 * 864e5);
  // THE PASSWORD — locked out: six misses on door 1
  const [W1, W2] = await wordsFor(day), bad = new Set(W1 + W2);
  const miss = pwLists().answers.find(w => new Set(w).size === 5 && ![...w].some(c => bad.has(c)));
  let t = now0;
  await dailyAction(uid, { action: 'start', game: 'password' }, t);
  for (let i = 0; i < GUESSES; i++) await dailyAction(uid, { action: 'guess', game: 'password', word: miss }, (t += 1500));
  await dailyAction(uid, { action: 'finish', game: 'password' }, (t += 1000));
  // COAST CLEAR — two safe cells, then three lights: CAUGHT
  await dailyAction(uid, { action: 'start', game: 'coastclear' }, (t = Date.now()));
  const board = await ccBoard(day);
  for (const c of board.open.slice(0, 2)) await dailyAction(uid, { action: 'dig', game: 'coastclear', cell: c }, (t += 900));
  for (const c of board.lights.slice(0, 3)) await dailyAction(uid, { action: 'dig', game: 'coastclear', cell: c }, (t += 900));
  await dailyAction(uid, { action: 'finish', game: 'coastclear' }, (t += 900));
  // THE DROP — the bot plays until it tops out (checkpoints every CK_MS, the final upload, the finish)
  const s = await dailyAction(uid, { action: 'start', game: 'drop' }, (t = Date.now()));
  const run = createDropRun(s.run.seed), rnd = rngFrom(uid);
  let sent = 0, plan = null, next = 0, now = s.run.go, ck = now + CK_MS;
  const send = async () => { const b = { action: 'checkpoint', game: 'drop', day: s.day, at: sent, add: run.log.slice(sent), k: run.k, ...(run.over ? { fin: 1 } : {}) }; const r = await dailyAction(uid, b, now); if (!r.resync) sent = b.at + b.add.length; };
  while (!run.over && now < s.run.go + 12 * 60e3) { now += 16; stepTo(run, Math.floor((now - s.run.go) / TICK)); if (run.over) break; if (now >= next) { next = now + 80; const r = dropKey(run.eng, plan, { rnd }); plan = r.plan; if (r.code) input(run, r.code); } if (now >= ck) { ck += CK_MS; await send(); } }
  await send();
  await dailyAction(uid, { action: 'finish', game: 'drop', day: s.day }, now + 500);
  const dropEnd = await dailyAction(uid, { action: 'ended', game: 'drop' }, now + 900);
  ok(!!(dropEnd && dropEnd.run && dropEnd.run.b), 'the three dailies finished over /api (THE DROP\'s end view in)');
  // THE DAILIES → TODAY: the finished tickets
  await p.evaluate(() => import('/js/daily/today.js').then(T => T.loadToday({ fresh: true })).catch(() => {}));
  await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'today' } })));
  await p.waitForFunction(() => document.querySelectorAll('.dy-ticket.is-done').length >= 2, { timeout: 20000 }).catch(() => {});
  const tk = await p.evaluate(() => [...document.querySelectorAll('.dy-ticket')].map(x => ({ id: x.dataset.id, done: x.classList.contains('is-done'), tap: x.getAttribute('role') === 'button' && x.hasAttribute('data-press') })));
  ok(tk.filter(x => x.done).every(x => x.tap) && tk.filter(x => !x.done).every(x => !x.tap), `TODAY: every FINISHED ticket tappable, an unfinished one not (${tk.map(x => `${x.id}:${x.done ? 'done' : 'open'}${x.tap ? '·tap' : ''}`).join(' ')})`);
  for (const id of ['password', 'coastclear']) {
    if (!tk.find(x => x.id === id && x.done)) { ok(false, `${id}: its ticket finished on TODAY`); continue; }
    await p.evaluate(g => document.querySelector(`.dy-ticket[data-id="${g}"]`).click(), id);
    const got = await p.waitForFunction(() => { const b = document.querySelector('.dy-end-body'); return b && b.dataset.state; }, { timeout: 10000 }).then(h => h.jsonValue(), () => 'none');
    const what = await p.evaluate(() => { const b = document.querySelector('.dy-end-body'); return b ? { pw: b.querySelectorAll('.pw-mini-c').length, words: [...b.querySelectorAll('.pw-end-word')].map(x => x.textContent), cc: b.querySelectorAll('.cc-mc').length, lights: b.querySelectorAll('.cc-mc.is-light, .cc-mc.is-lit, .cc-mc.is-spot').length, anim: [...b.querySelectorAll('*')].filter(e => getComputedStyle(e).animationName !== 'none').length } : null; });
    ok(got === 'end' && what && (id === 'password' ? what.pw === GUESSES * 5 && what.words.length === 1 : what.cc > 60) && what.anim === 0, `${id}: the ticket → its END SCREEN in a sheet, still (${JSON.stringify(what)})`);
    if (SHOTS) { await sleep(500); await p.screenshot({ path: `${SHOTS}/ticket-${id}-390.png` }); }
    await p.keyboard.press('Escape'); await sleep(500);
  }
  await p.evaluate(r => import('/js/daily/end-sheet.js').then(m => m.openEndSheet({ id: 'drop', name: 'THE DROP' }, { answer: r })), dropEnd);
  const dg = await p.waitForFunction(() => { const i = document.querySelector('.dy-end-body img.dy-end-drop'); return i && i.complete && i.naturalWidth > 0; }, { timeout: 15000 }).then(() => true, () => false);
  ok(dg, 'THE DROP: its final board + time / lines in the sheet (a still picture)');
  if (SHOTS) { await sleep(400); await p.screenshot({ path: `${SHOTS}/ticket-drop-390.png` }); }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); try { await deleteApp(fb().app); } catch { /* fine */ } }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
