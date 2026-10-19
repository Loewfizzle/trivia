// HUSH WORDS end to end (emulators + scripts/serve.mjs --emu; run rules.test.mjs first so the emulator has the current rules).
//   node e2e-hush.mjs "<browser path>" ./shots-hush        (env SHOTS=0 skips the screenshots)
// 1. The host opens a room: its code is a word from data/hushwords.json, on the lobby's password card.
// 2. A second phone joins by typing the word in the dock's JOIN panel; a third by the invite link.
// 3. LOCK THE DOOR: a fourth phone is refused ("The door's locked…"); a player already inside refreshes and is back in.
// 4. Unlocked: the fourth phone joins.
// 5. An old-style random-code room (made before HUSH WORDS) still joins by typing its code.
// 6. Closing a room records its word in hush/ (24 h rest); with every other word resting, a new room gets the one free word.
// 7. The guessing guard: five words that open nothing in a minute → a short, friendly wait.
// Screenshots of the lobby card + JOIN panel at 390×844, 430×932, 412×915, 1440×900.
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, get, set, update } from 'firebase/database';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-hush').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0';
const WORDS = JSON.parse(readFileSync(new URL('../../data/hushwords.json', import.meta.url), 'utf8'));
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };

const env = await initializeTestEnvironment({ projectId: 'demo-arcade', database: { host: '127.0.0.1', port: 9000 } });
// (withSecurityRulesDisabled resolves to nothing: hand the result back ourselves)
const admin = async fn => { let out; await env.withSecurityRulesDisabled(async ctx => { out = await fn(ctx.database('http://127.0.0.1:9000?ns=demo-arcade-default-rtdb')); }); return out; };
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });
const ctxs = [];

async function open(slot, { view = [390, 844], qs = '' } = {}) {
  const ctx = await browser.createBrowserContext(); ctxs.push(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(m.text())) { errors.push(`${slot}: ${m.text()}`); log(slot, 'console.error', m.text()); } });
  const [w, h] = view, mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument(s => {
    try { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase().slice(0, 12), color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  }, slot);
  await p.goto(`${BASE}/?emu&slot=${slot}&when=2026-10-14T21:30&tz=America/New_York${qs}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done', `${slot} title`, 25000);
  await sleep(500);
  return { ctx, p };
}
const ev = (p, js) => p.evaluate(js);
const code = p => ev(p, 'window.__arcade && window.__arcade.state.code');
const msg = p => ev(p, `(document.querySelector('.nd-msg') || {}).textContent || ''`);
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
// type a word into the dock's JOIN panel (opening it first); it joins by itself on the 4th letter
async function typeWord(p, word) {
  const open = await ev(p, `document.querySelector('.nd-actions').classList.contains('is-join')`);
  if (!open) { await p.click('.nd-joinbtn'); await sleep(400); }
  await p.evaluate(() => { const i = document.querySelector('.nd-code-in'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.focus('.nd-code-in');
  await p.keyboard.type(word.toLowerCase(), { delay: 70 });
}
const leave = async p => { try { await p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom())); } catch { /* gone */ } };
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${OUT}${name}.png` }); };

try {
  // ================================================================ 1. the host's room has a hush word
  const H = await open('hhost');
  await H.p.click('.nd-host');
  await waitFor(H.p, `!!document.querySelector('.lobby-screen .hw-card .room-code')`, 'host lobby', 25000);
  const W = await code(H.p);
  ok(WORDS.includes(W), `HOST: the room's code is a hush word (${W})`);
  ok((await ev(H.p, `document.querySelector('.hw-card .room-code').textContent`)) === W && /THE HUSH WORD/.test(await ev(H.p, `document.querySelector('.hw-card').textContent`)), 'LOBBY: the word on the password card ("THE HUSH WORD")');
  ok(await ev(H.p, `!document.querySelector('.hw-lockrow').hidden && document.querySelector('.hw-switch').getAttribute('aria-checked') === 'false' && document.querySelector('.hw-tag').hidden`), 'LOBBY: the host sees LOCK THE DOOR, off by default');
  const shareText = await H.p.evaluate(async () => { let got = null; navigator.share = async d => { got = d; }; [...document.querySelectorAll('.lobby-actions .btn')][0].click(); await new Promise(r => setTimeout(r, 200)); return got; });
  ok(shareText && shareText.text === `Get in here — the hush word is ${W}` && shareText.url.endsWith(`?room=${W}`), `SHARE: "${shareText && shareText.text}" + the link`);

  // ================================================================ 2. join by typing; join by the invite link
  const B = await open('hbob');
  ok(/ENTER THE HUSH WORD/.test(await ev(B.p, `document.querySelector('.nd-jpanel').textContent`)), 'JOIN: the panel says ENTER THE HUSH WORD');
  await typeWord(B.p, W);
  await waitFor(B.p, `window.__arcade.state.code === '${W}'`, 'B joined by typing', 20000);
  ok(true, `JOIN: typed "${W.toLowerCase()}" in the dock — in on the 4th letter`);
  ok(await ev(B.p, `document.querySelector('.hw-lockrow').hidden`), 'LOBBY: a guest has no lock switch');
  const C = await open('hcal', { qs: `&room=${W}` });
  ok(/hush word is/i.test(await msg(C.p)) && (await ev(C.p, `[...document.querySelectorAll('.nd-box')].map(b => b.textContent).join('')`)) === W, `INVITE: the link opens JOIN pre-filled ("${await msg(C.p)}")`);
  await C.p.click('.nd-go');
  await waitFor(C.p, `window.__arcade.state.code === '${W}'`, 'C joined by invite', 20000);
  ok(true, 'INVITE: one tap and in');

  // ================================================================ 3. lock the door
  await H.p.click('.hw-switch');
  await waitFor(H.p, `window.__arcade.state.meta && window.__arcade.state.meta.locked === true`, 'locked', 8000);
  await waitFor(B.p, `!document.querySelector('.hw-tag').hidden && document.querySelector('.hw-card').classList.contains('is-locked')`, 'guest sees the lock', 8000);
  ok(true, 'LOCK: the host locks; every phone shows the LOCKED tag by the word');
  if (SHOTS) for (const [w, h] of [[390, 844], [430, 932], [412, 915], [1440, 900]]) {
    await H.p.setViewport({ width: w, height: h, deviceScaleFactor: w < 800 ? 2 : 1, isMobile: w < 800, hasTouch: w < 800 });
    await sleep(3200); await shot(H.p, `lobby-locked-${w}x${h}`);
  }
  await H.p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const D = await open('hdan');
  await typeWord(D.p, W);
  await waitFor(D.p, `/door’s locked/i.test((document.querySelector('.nd-msg') || {}).textContent || '')`, 'locked message', 15000);
  ok(!(await code(D.p)), `LOCK: a new phone is refused — "${await msg(D.p)}"`);
  ok(!(await admin(db => get(ref(db, `rooms/${W}/players`)))).val()[await ev(D.p, 'window.__arcade.state.uid')], 'LOCK: no seat was written for it');
  await shot(D.p, 'join-locked-390x844');
  // a player already inside refreshes → straight back in (and a dropped phone coming back the same way)
  await B.p.reload();
  await waitFor(B.p, `window.__arcade && window.__arcade.state.code === '${W}' && !!document.querySelector('.lobby-screen')`, 'B back after refresh', 25000);
  ok(true, 'LOCK: a player already inside refreshes and is back in the lobby');
  await C.p.evaluate(() => import('/js/firebase.js').then(f => f.goOffline && f.goOffline()));
  await sleep(1500);
  await C.p.evaluate(() => import('/js/firebase.js').then(f => f.goOnline && f.goOnline()));
  await sleep(2500);
  ok((await code(C.p)) === W, 'LOCK: a phone that drops and comes back keeps its seat');

  // ================================================================ 4. unlock: the fourth phone gets in
  await H.p.click('.hw-switch');
  await waitFor(H.p, `window.__arcade.state.meta && !window.__arcade.state.meta.locked`, 'unlocked', 8000);
  await D.p.click('.nd-go');
  await waitFor(D.p, `window.__arcade.state.code === '${W}'`, 'D joined after unlock', 20000);
  ok(true, 'UNLOCK: the same phone now joins');
  ok((await ev(H.p, `Object.keys(window.__arcade.state.players).length`)) === 4, 'ROOM: four players');

  // ================================================================ 5. an old-style random-code room still joins
  const OLD = 'QXZV';
  await admin(db => set(ref(db, `rooms/${OLD}`), {
    meta: { hostId: 'oldhost', status: 'lobby', createdAt: Date.now(), activeAt: Date.now(), hostBeat: Date.now() },
    players: { oldhost: { name: 'OLDIE', color: 'red', avatar: 'moon', joinedAt: 1 } },
    presence: { oldhost: { online: true, lastSeen: Date.now() } },
  }));
  const E = await open('heve');
  await typeWord(E.p, OLD);
  await waitFor(E.p, `window.__arcade.state.code === '${OLD}'`, 'E joined the old room', 20000);
  ok(!WORDS.includes(OLD), `OLD CODES: a room made before HUSH WORDS (${OLD}) still joins by typing its code`);
  await shot(E.p, 'lobby-oldcode-390x844');
  const E2 = await open('heve2', { qs: `&room=${OLD}` });
  await E2.p.click('.nd-go');
  await waitFor(E2.p, `window.__arcade.state.code === '${OLD}'`, 'old invite link', 20000);
  ok(true, 'OLD CODES: an old invite link to a room still open works');
  await leave(E.p); await leave(E2.p);
  await admin(db => set(ref(db, `rooms/${OLD}`), null));

  // ================================================================ 6. closing rests the word; a new room never gets a resting word
  for (const X of [D, C, B]) await leave(X.p);
  await sleep(500);
  await leave(H.p); // last one out turns off the lights
  await waitFor(H.p, `!window.__arcade.state.code`, 'host out', 10000);
  const rested = (await admin(db => get(ref(db, `hush/${W}`)))).val();
  const roomGone = !(await admin(db => get(ref(db, `rooms/${W}`)))).exists();
  ok(roomGone && rested && Math.abs(rested.closedAt - Date.now()) < 60000, `CLOSE: the room is gone and hush/${W} remembers when (${rested && new Date(rested.closedAt).toISOString()})`);
  // every word resting but one → the next room gets that one
  const FREE = WORDS.find(w => w !== W && w > 'S') || WORDS[1];
  const busy = (await admin(db => get(ref(db, 'rooms')))).val() || {};
  const now = Date.now();
  await admin(db => update(ref(db, 'hush'), Object.fromEntries(WORDS.filter(w => w !== FREE).map(w => [w, { closedAt: now - 60000 }]))));
  await admin(db => set(ref(db, `rooms/${FREE}`), null));
  const G = await open('hgia');
  await G.p.click('.nd-host');
  await waitFor(G.p, `!!window.__arcade.state.code`, 'G hosted', 25000);
  const G1 = await code(G.p);
  ok(G1 === FREE && !busy[FREE], `PICK: with every other word resting, the new room gets the one free word (${G1})`);
  await leave(G.p);
  await waitFor(G.p, `!window.__arcade.state.code`, 'G out', 10000);
  // and with every word resting, the oldest-rested word (never a failure)
  await admin(db => update(ref(db, 'hush'), { [FREE]: { closedAt: now - 30000 }, ZEST: { closedAt: now - 23 * 3600_000 } }));
  await G.p.click('.nd-host');
  await waitFor(G.p, `!!window.__arcade.state.code`, 'G hosted again', 25000);
  const G2 = await code(G.p);
  ok(G2 === 'ZEST', `PICK: every word resting → the longest-rested one, never a failure (${G2})`);
  await leave(G.p);
  await admin(db => set(ref(db, 'hush'), null));

  // ================================================================ 7. the guessing guard
  const K = await open('hkim');
  const misses = ['QQQZ', 'QQZQ', 'QZQQ', 'ZQQQ', 'ZZQQ'];
  for (const m of misses) {
    await typeWord(K.p, m);
    await waitFor(K.p, `/No room behind/i.test((document.querySelector('.nd-msg') || {}).textContent || '')`, `miss ${m}`, 15000);
    await sleep(300);
  }
  await typeWord(K.p, 'ZQZQ');
  await waitFor(K.p, `/too many wrong words/i.test((document.querySelector('.nd-msg') || {}).textContent || '')`, 'cooldown', 15000);
  ok(true, `GUARD: after five misses in a minute — "${await msg(K.p)}"`);
  await K.p.evaluate(() => localStorage.removeItem('na:hushmiss'));

  // ================================================================ screenshots: the JOIN panel and the card (unlocked)
  if (SHOTS) {
    for (const [w, h] of [[390, 844], [430, 932], [412, 915], [1440, 900]]) {
      const J = await open(`hj${w}`, { view: [w, h] });
      await J.p.click('.nd-joinbtn'); await sleep(700);
      await shot(J.p, `join-${w}x${h}`);
      await J.p.click('.nd-host');
      await waitFor(J.p, `!!document.querySelector('.lobby-screen .hw-card')`, 'shot lobby', 25000);
      await sleep(3000);
      await shot(J.p, `lobby-${w}x${h}`);
      await leave(J.p);
      await J.ctx.close();
    }
  }
} catch (e) {
  errors.push(String(e && e.stack || e));
  log('ERROR', e);
}

for (const c of ctxs) await c.close().catch(() => {});
await browser.close();
await env.cleanup();
const passed = checks.filter(c => c.ok).length;
log(`${passed}/${checks.length} checks passed`);
if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1); }
