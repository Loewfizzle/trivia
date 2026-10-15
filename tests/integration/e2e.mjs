// End-to-end: three headless browser tabs (slots 1-3) play a full CIPHER BREACH
// match against the Firebase emulators, including host loss and a mid-round refresh.
//
//   1) emulators running (see CLAUDE.md → Testing)   2) node scripts/serve.mjs
//   3) cd tests/integration && node e2e.mjs [path-to-chrome-or-edge] [screenshotDir]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BROWSER = process.argv[2] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SHOTS = process.argv[3] || './shots';
// E2E_BASE=https://trivia.loewfizzle.com runs against production (real Firebase, no ?emu).
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const EMU = BASE.includes('localhost') ? 'emu&' : '';
mkdirSync(SHOTS, { recursive: true });

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const errors = [];
const fail = msg => { throw new Error(msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, protocolTimeout: 60000, args: ['--no-first-run', '--disable-features=Translate', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });

async function open(slot, qs = '') {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => { errors.push(`slot${slot} pageerror: ${e.message}`); log(`slot${slot} PAGEERROR`, e.message); });
  page.on('console', m => { if (m.type() === 'error') { errors.push(`slot${slot} console: ${m.text()}`); log(`slot${slot} console.error`, m.text()); } });
  await page.goto(`${BASE}/?${EMU}slot=e2e${slot}${qs}`, { waitUntil: 'domcontentloaded' });
  page.slot = slot;
  // Hidden tabs don't run requestAnimationFrame, which puppeteer's actions wait on.
  for (const fn of ['click', 'type']) { const orig = page[fn].bind(page); page[fn] = async (...a) => { await page.bringToFront(); return orig(...a); }; }
  for (const fn of ['type', 'press']) { const orig = page.keyboard[fn].bind(page.keyboard); page.keyboard[fn] = async (...a) => { await page.bringToFront(); return orig(...a); }; }
  return page;
}
const shot = async (page, name) => { await page.bringToFront(); await sleep(120); return page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const clickText = async (page, text) => { await page.bringToFront(); return page.locator(`::-p-text(${text})`).click(); };
const evalState = (page, fn) => page.evaluate(async src => {
  const { state } = await import('/js/store.js');
  const L = await import('/js/games/cipher/logic.js');
  return new Function('state', 'L', `return (${src})(state, L)`)(state, L);
}, fn.toString());
const answerOf = page => evalState(page, (state, L) => L.decodeWord(state.game.secret, L.secretKey(state.code, state.game.matchId, state.game.round)));
const phaseOf = page => evalState(page, state => state.game && state.game.phase);
async function waitFor(page, fn, what, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await evalState(page, fn)) return; } catch { /* page reloading */ }
    await sleep(200);
  }
  fail(`timeout waiting for ${what} (slot ${page.slot})`);
}
async function typeWord(page, word, viaScreenKeys = false) {
  if (viaScreenKeys) {
    for (const ch of word) await page.click(`.key[data-k="${ch}"]`);
    await page.click('.key[data-k=">"]');
  } else {
    await page.keyboard.type(word, { delay: 15 });
    await page.keyboard.press('Enter');
  }
  await sleep(150);
}
const toastText = page => page.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));

try {
  // ---------- host creates a room ----------
  const A = await open(1);
  await A.waitForSelector('.title-screen .logo', { timeout: 15000 });
  await sleep(1200);
  await shot(A, '01-title');
  await clickText(A, 'HOST GAME');
  await A.waitForSelector('.setup-screen input.input');
  await A.type('.setup-screen input.input', 'ALICE');
  await A.click('.avatar-pick[data-id="crown"]');
  await A.click('.swatch[data-id="magenta"]');
  await sleep(300);
  await shot(A, '02-setup-host');
  await clickText(A, 'CREATE ROOM');
  await A.waitForSelector('.lobby-screen .room-code');
  const code = (await A.$eval('.room-code', el => el.textContent)).trim();
  log('room code', code);
  if (!/^[A-HJ-NP-Z]{4}$/.test(code)) fail(`bad code ${code}`);
  await sleep(500);
  await shot(A, '03-access-granted');

  // ---------- two friends join via invite link ----------
  const B = await open(2, `&room=${code}`);
  await B.waitForSelector('.invite-card');
  await shot(B, '04-title-invite');
  await B.click('.invite-card');
  await B.waitForSelector('.input-code');
  if ((await B.$eval('.input-code', el => el.value)) !== code) fail('invite code not prefilled');
  await B.type('.setup-screen input.input:not(.input-code)', 'BOB');
  await B.click('.swatch[data-id="magenta"]'); // same as Alice: should be auto-reassigned
  await clickText(B, 'CONNECT');
  await B.waitForSelector('.lobby-screen');

  const C = await open(3);
  await C.waitForSelector('.title-screen');
  await clickText(C, 'JOIN GAME');
  await C.waitForSelector('.input-code');
  await C.type('.input-code', code.toLowerCase());
  await C.type('.setup-screen input.input:not(.input-code)', 'CHARLIE-THE-LONG-NAME');
  await clickText(C, 'CONNECT');
  await C.waitForSelector('.lobby-screen');
  await waitFor(A, s => Object.keys(s.players).length === 3 && Object.values(s.presence).filter(p => p.online).length === 3, '3 players online');
  const colors = await evalState(A, s => Object.values(s.players).map(p => p.color));
  if (new Set(colors).size !== 3) fail(`colors collide: ${colors}`);
  const cName = await evalState(A, s => Object.values(s.players).map(p => p.name).find(n => n.startsWith('CHARLIE')));
  if (cName.length > 12) fail('name not truncated');
  await sleep(1500);
  await shot(A, '05-lobby-host');
  await shot(B, '06-lobby-guest');
  log('lobby OK, colors', colors);

  // locked game cards
  await A.evaluate(() => document.querySelector('.game-card[data-theme="bluff"]').scrollIntoView({ block: 'center' }));
  await sleep(300);
  await A.click('.game-card[data-theme="bluff"]');
  if (!(await toastText(A)).includes('COMING SOON')) fail('locked card toast missing');

  // ---------- start Cipher Breach: 3 rounds, 1:00 ----------
  await A.evaluate(() => document.querySelector('.game-card[data-theme="cipher"]').scrollIntoView({ block: 'center' }));
  await sleep(300);
  await A.click('.game-card[data-theme="cipher"]');
  await A.waitForSelector('.modal .options');
  await sleep(600); // sheet slide-in
  await A.click('.modal .seg-btn[data-v="3"]');
  await A.click('.modal .seg-btn[data-v="60"]');
  await sleep(400);
  await shot(A, '07-options');
  await clickText(A, 'INITIATE');
  for (const p of [A, B, C]) await p.waitForSelector('.cb', { timeout: 15000 });
  await sleep(600);
  await shot(B, '08-intro');
  for (const p of [A, B, C]) await waitFor(p, s => s.game.phase === 'play', 'play phase');
  log('round 1 started');

  // ---------- round 1 ----------
  const ans1 = await answerOf(A);
  if ((await answerOf(B)) !== ans1) fail('players see different words');
  log('round 1 word length', ans1.length);
  await typeWord(C, 'zzzzz');
  if (!(await toastText(C)).includes('NOT IN DICTIONARY')) fail('no dictionary toast');
  for (let i = 0; i < 5; i++) await C.keyboard.press('Backspace');
  await typeWord(C, 'abc');
  if (!(await toastText(C)).includes('NOT ENOUGH')) fail('no length toast');
  for (let i = 0; i < 5; i++) await C.keyboard.press('Backspace');
  const wrong = ans1 === 'crane' ? 'slate' : 'crane';
  await typeWord(C, wrong, true);
  await typeWord(C, ans1 === 'pious' ? 'adieu' : 'pious');
  await sleep(1200);
  await typeWord(B, wrong);
  await sleep(900);
  await shot(A, '09-play-opponents');
  await shot(C, '10-play-board');
  await typeWord(B, ans1);
  await typeWord(A, ans1, true);
  await sleep(1500);
  await shot(A, '11-solved');
  for (let i = 0; i < 4 && (await phaseOf(C)) === 'play'; i++) await typeWord(C, ['plumb', 'dwarf', 'fight', 'joker'][i] === ans1 ? 'vouch' : ['plumb', 'dwarf', 'fight', 'joker'][i]);
  await waitFor(A, s => s.game.phase === 'reveal', 'reveal phase');
  await sleep(1800);
  await shot(C, '12-reveal');
  const r1 = await evalState(A, s => s.game.results[0]);
  log('round 1 results', JSON.stringify(Object.values(r1).map(r => [r.pts, r.solved, r.n])));
  await waitFor(A, s => s.game.phase === 'standings', 'standings');
  await sleep(1600);
  await shot(B, '13-standings');

  // ---------- round 2: host vanishes mid-round ----------
  for (const p of [A, B, C]) await waitFor(p, s => s.game.phase === 'play' && s.game.round === 1, 'round 2 play');
  const ans2 = await answerOf(B);
  const hostUid = await evalState(A, s => s.uid);
  const bUid = await evalState(B, s => s.uid);
  await typeWord(B, ans2.length === 6 ? (ans2 === 'planet' ? 'stream' : 'planet') : 'planets');
  log('closing host tab mid-round');
  await A.close();
  const tClose = Date.now();
  await waitFor(B, s => s.meta.hostId === s.uid, 'B becomes host', 40000);
  log(`host migrated to B after ${((Date.now() - tClose) / 1000).toFixed(1)}s`);
  if (hostUid === bUid) fail('uids collided across slots');
  await shot(C, '14-after-migration');
  await typeWord(B, ans2);
  await typeWord(C, ans2);
  await waitFor(C, s => s.game.phase === 'reveal' && s.game.round === 1, 'round 2 reveal under new host', 20000);
  log('round 2 closed by new host');

  // ---------- round 3: C refreshes mid-round ----------
  for (const p of [B, C]) await waitFor(p, s => s.game.phase === 'play' && s.game.round === 2, 'round 3 play', 40000);
  const ans3 = await answerOf(C);
  const filler = ans3 === 'example' ? 'machine' : 'example';
  await typeWord(C, filler);
  await sleep(800);
  const scoreBefore = await evalState(C, (s, L) => L.totals(s.game)[s.uid]);
  log('C refreshes mid-round');
  await C.reload({ waitUntil: 'domcontentloaded' });
  await C.waitForSelector('.cb', { timeout: 15000 });
  await sleep(1200);
  const restoredRows = await C.$$eval('.cb-board .cb-row', rows => rows.filter(r => r.querySelector('.tile.flip')).length);
  if (restoredRows !== 1) fail(`expected 1 restored row, got ${restoredRows}`);
  const scoreAfter = await evalState(C, (s, L) => L.totals(s.game)[s.uid]);
  if (scoreAfter !== scoreBefore) fail('score changed on refresh');
  await shot(C, '15-after-refresh');
  log('refresh restored board + score', scoreAfter);
  await typeWord(C, ans3);
  await typeWord(B, ans3);

  // ---------- final ----------
  await waitFor(B, s => s.game && s.game.phase === 'final', 'final', 40000);
  await sleep(1000);
  await shot(B, '16-final-early');
  await sleep(3200);
  await shot(B, '17-final');
  await shot(C, '18-final-guest');
  const standings = await evalState(B, (s, L) => L.standings(s.game).map(r => [s.players[r.uid] ? s.players[r.uid].name : r.uid, r.score]));
  log('final standings', JSON.stringify(standings));

  // ---------- old host returns: lands back in the room ----------
  const A2 = await open(1);
  await A2.waitForSelector('.cb', { timeout: 15000 });
  log('old host rejoined as a player during final');

  await clickText(B, 'BACK TO LOBBY');
  for (const p of [B, C, A2]) await p.waitForSelector('.lobby-screen', { timeout: 15000 });
  await sleep(1200);
  await shot(A2, '19-back-in-lobby');
  const lobbyHost = await evalState(C, s => s.meta.hostId);
  if (lobbyHost !== bUid) fail('host should still be B');

  // ---------- kick ----------
  const cUid = await evalState(C, s => s.uid);
  await B.click(`.player[data-uid="${cUid}"] .kick`);
  await sleep(300);
  await shot(B, '20-kick-confirm');
  await B.click(`.player[data-uid="${cUid}"] .kick`);
  await C.waitForSelector('.title-screen', { timeout: 10000 });
  log('kick works', cUid.slice(0, 6));

  if (errors.length) fail(`browser errors:\n${errors.join('\n')}`);
  log('E2E PASSED');
} catch (e) {
  log('E2E FAILED:', e.message);
  for (const p of await browser.pages()) { try { await p.screenshot({ path: `${SHOTS}/zz-fail-${Math.random().toString(36).slice(2, 6)}.png` }); } catch { /* closed */ } }
  process.exitCode = 1;
} finally {
  await browser.close();
}
