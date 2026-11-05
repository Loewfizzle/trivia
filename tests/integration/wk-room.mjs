// LOBBY 2.0 B — THE ROOM's SHOWS IN WEBKIT (the owner's real-phone test, Nov 4 10:37 am: none of the show played on two iPhones). Safari's own
// engine (Playwright's WebKit — ~/wk/node_modules/playwright, or WK_PLAYWRIGHT): two phones, fresh loads, motion ON, the real taps (HOST → JOIN
// by the link → PLAY → a game → INITIATE), then BACK TO THE ROOM. It FAILS unless the show runs: the sign powers down + the game's logo, the
// file-in, the walk back out, THE WINNER's BANNER PLANE, the vote's dots. Every console error + page error is printed.
//   node tests/integration/wk-room.mjs   (on the emulators + serve.mjs --emu)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { guardUrl } from './kit/live-guard.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173', PROD = !!process.env.PROD;
// (FR6 FIXES A — G7: PROD=1 is the live site — refused unless LIVE=1 too; then every page carries &test=1: no push, no profile, no Nº)
if (PROD) guardUrl(BASE, 'wk-room.mjs (PROD=1)');   // (PROD=1: the live site — no emulators: the night entry written by the host's own page)
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (c, what) => { checks.push(!!c); console.log(c ? 'OK  ' : 'FAIL', what); if (!c) errors.push(what); };
async function phone(slot, qs = '') {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([s]) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: s === 'wka' ? 'magenta' : 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.log(`[${slot}] PAGEERROR`, e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')); errors.push(`${slot}: ${e.message}`); });
  p.on('console', m => { if (m.type() === 'error' || /warn/.test(m.type())) { const t = m.text(); if (!/favicon|permission_denied|Failed to load resource/i.test(t)) console.log(`[${slot}] console.${m.type()}`, t.slice(0, 300)); } });
  await p.goto(guardUrl(PROD ? `${BASE}/?slot=${slot}${qs}` : `${BASE}/?emu&slot=${slot}${qs}`, 'wk-room.mjs'));
  await p.waitForFunction(() => !!(window.__district && window.__district.phase && window.__district.phase().done && window.__district.harbor() && window.__district.harbor().shown), null, { timeout: 40000 });
  return { ctx, p };
}
const wf = (p, js, ms = 20000) => p.waitForFunction(js, null, { timeout: ms }).then(() => true, () => false);

const A = await phone('wka'), p = A.p;
await sleep(1000);
await p.evaluate(() => document.querySelector('.nd-hostbtn').click());
await wf(p, 'window.__arcade.state.code && window.__district.room()');
const code = await p.evaluate('window.__arcade.state.code');
const B = await phone('wkb', `&room=${code}`), q = B.p;
await q.evaluate(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); });
await wf(q, `window.__arcade.state.code === '${code}' && !!window.__district.room()`);
await wf(p, '(() => { const r = window.__district.room(); return r && r.people && r.people.length === 2 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 40000);
console.log('both in the room', code);
// the REAL taps: PLAY → OVERCLOCK → INITIATE
await p.evaluate(() => document.querySelector('.rdk-play').click());
await wf(p, "document.querySelectorAll('.rc-games-sheet .rc-game').length >= 2", 8000);
await p.evaluate(() => document.querySelector('.rc-games-sheet .rc-game[data-game="overclock"]').click());
await wf(p, "!!document.querySelector('.sh.options .btn-primary')", 8000);
await p.evaluate(() => document.querySelector('.sh.options .btn-primary').click());
const sign = await Promise.all([p, q].map(x => wf(x, "!!document.querySelector('.nd-sign.rc-go .rc-tonight')", 4000)));
const go = await p.evaluate('window.__arcade.state.meta && window.__arcade.state.meta.go');
console.log('meta.go', JSON.stringify(go));
const walk = await Promise.all([p, q].map(x => wf(x, '(() => { const r = window.__district.room && window.__district.room(); return !!(r && r.people && r.people.some(y => y.goIn)); })()', 3000)));
ok(sign.every(Boolean), `THE GAME START in WebKit: the sign powers down + the game's logo on both phones (${sign})`);
ok(walk.every(Boolean), `…the two lines file in (${walk})`);
await Promise.all([p, q].map(x => wf(x, '!document.querySelector(".title-screen:not(.screen-out)")', 8000)));
// the podium → BACK TO THE ROOM (a night entry: the winner)
const m = await p.evaluate('window.__arcade.state.game.matchId');
const H = { Authorization: 'Bearer owner', 'content-type': 'application/json' };
const players = await p.evaluate('window.__arcade.state.players');
const pts = {}, n = {}; Object.keys(players).forEach((u, i) => { pts[u] = i === 0 ? 3 : 1; n[u] = players[u].name; });
if (PROD) await p.evaluate(([c, mm, e]) => import('/js/firebase.js').then(F => F.set(F.dbRef(`rooms/${c}/night/${mm}`), { ...e, at: F.serverTimestamp() })), [code, m, { g: 'overclock', p: pts, n }]);
else await fetch(`http://127.0.0.1:9000/rooms/${code}/night/${m}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: H, body: JSON.stringify({ g: 'overclock', p: pts, n, at: { '.sv': 'timestamp' } }) });
await sleep(800);
await p.evaluate(() => import('/js/host.js').then(mm => mm.backToLobby()));
await Promise.all([p, q].map(x => wf(x, '!!document.querySelector(".title-screen:not(.screen-out)") && !!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', 20000)));
const back = await p.evaluate('window.__arcade.state.meta.back');
console.log('meta.back', JSON.stringify(back));
const out = await Promise.all([p, q].map(x => wf(x, '(() => { const r = window.__district.room && window.__district.room(); return !!(r && r.people && r.people.some(y => y.s && y.s.pose === "walk" || !y.s || y.inside)); })()', 6000)));
ok(out.some(Boolean), `THE WALK BACK OUT in WebKit (${out})`);
const ban = await Promise.all([p, q].map(x => wf(x, '(() => { const r = window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.how); })()', 30000).then(() => x.evaluate('window.__district.roomBanner().last'))));
console.log('banner', JSON.stringify(ban));
ok(ban.every(b => b && b.how === 'flown'), `THE WINNER's BANNER PLANE flies in WebKit (${ban.map(b => b && b.how).join(' / ')})`);
const ring = await wf(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm') && document.querySelector('.rdk-votes').hidden && document.querySelector('.rdk-games').textContent.includes('NEW GAME')", 15000);
ok(ring, 'THE REMATCH RING (no votes yet: no pill) + NEW GAME in the dock in WebKit');
await p.screenshot({ path: 'shots-room2/wk-vote-host.png' });
// THE STUCK JOIN (CITY 1.0 OUT Group 0): the guest (joined by the link) LEAVES → JOIN is fresh (empty, nothing breathing) → a new word typed → in
{ const C = await phone('wkc'), r = C.p;
  await r.evaluate(() => document.querySelector('.nd-hostbtn').click());
  await wf(r, 'window.__arcade.state.code && window.__district.room()');
  const code2 = await r.evaluate('window.__arcade.state.code');
  await q.evaluate(() => import('/js/room.js').then(mm => mm.leaveRoom()));
  await wf(q, "!window.__arcade.state.code && !document.querySelector('.title-screen.is-room')", 10000);
  const before = await q.evaluate(() => ({ v: document.querySelector('.nd-code-in').value, busy: !!document.querySelector('.nd-codebox.is-busy') }));
  await q.evaluate(() => document.querySelector('.nd-joinbtn').click());
  await q.focus('.nd-code-in'); await q.keyboard.type(code2, { delay: 45 });
  const inn = await wf(q, `window.__arcade.state.code === '${code2}' && !!window.__district.room()`);
  ok(before.v === '' && !before.busy && inn, `THE STUCK JOIN in WebKit: after a LEAVE the field "${before.v}", breathing ${before.busy}; typed ${code2} → in (${inn})`);
  await C.ctx.close(); }
console.log(`checks ${checks.filter(Boolean).length}/${checks.length}`);
await browser.close();
process.exit(errors.length ? 1 : 0);
