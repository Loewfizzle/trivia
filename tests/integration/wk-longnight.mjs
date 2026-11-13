// THE CITY's LONG NIGHT (Nov 12 night — docs/harbor/passes/jaywalk-cards.md Group 4), in Safari's engine: the city is destroyed + rebuilt on every
// room / game / menu trip (THE CITY PAUSE) — what its teardown misses grows over a long night on an iPhone. Two phones (Playwright's WebKit as an
// iPhone, 402 × 874 @3 — ~/wk/node_modules/playwright or WK_PLAYWRIGHT): A hosts, B joins, then N TRIPS city → game start → back to the room (the
// host's startGame + backToLobby — the same path PLAY and BACK TO THE ROOM take), then M trips title → a menu (YOUR CARD) → title on a third phone.
// After each trip, back on the city: the memory guard's LIVE canvases (ui/canvas-safe.js#canvasMb — every canvas that took a context, still
// holding pixels) + the LIVE GPU contexts (every webgl / webgl2 context made, not lost, its canvas still alive — an init script counts them).
// FAILS when either grows past the first trip's (+ a small slack).
//   node tests/integration/wk-longnight.mjs [--trips 30] [--menus 10] [--json out.json]      (on the emulators + scripts/serve.mjs --emu)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const TRIPS = Number(opt('trips', 30)), MENUS = Number(opt('menus', 10)), JSON_OUT = opt('json', '');
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const checks = [], fails = [];
const ok = (c, what) => { checks.push(!!c); console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
// (the GPU counter: every webgl / webgl2 context made — alive = its canvas still referenced + not lost)
function glCounter() {
  const made = []; window.__glMade = made;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const c = orig.call(this, type, ...rest);
    if (c && /webgl/.test(String(type)) && !made.some(r => r.deref() === c)) made.push(new WeakRef(c));
    return c;
  };
  window.__glLive = () => made.filter(r => { const c = r.deref(); return c && !c.isContextLost(); }).length;
}
async function phone(slot, qs = '') {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([s]) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot]);
  await ctx.addInitScript(glCounter);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log(`[${slot}] PAGEERROR`, e.message));
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&wx=clear${qs}`, 'wk-longnight.mjs'));
  return { ctx, p };
}
const until = async (p, js, what, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(js).catch(() => false)) return true; await sleep(250); } throw new Error(`timed out: ${what}`); };
const onCity = "!!(window.__district && window.__district.harbor && window.__district.harbor() && document.querySelector('.nd-scene'))";
const up = p => until(p, `${onCity} && !!window.__district.harbor().shown`, 'the city up', 45000).catch(() => until(p, onCity, 'the city', 20000));
const sample = p => p.evaluate(() => import('/js/ui/canvas-safe.js').then(m => { const c = m.canvasMb(); return { n: c.n, mb: +c.mb.toFixed(1), gl: window.__glLive ? window.__glLive() : -1, dom: document.querySelectorAll('canvas').length }; }));

const A = await phone('lna');
await up(A.p);
await A.p.evaluate(() => document.querySelector('.nd-hostbtn').click());
await until(A.p, '!!(window.__arcade.state.code && window.__district.room())', 'hosted');
const code = await A.p.evaluate(() => window.__arcade.state.code);
const B = await phone('lnb', `&room=${code}`);
await up(B.p); await sleep(900);
await B.p.evaluate(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); });
await until(A.p, 'Object.keys(window.__arcade.state.players || {}).length >= 2', 'B joined', 40000);
await sleep(3000);
const S = [await sample(A.p)];
console.log('in the room before:', JSON.stringify(S[0]));
for (let i = 1; i <= TRIPS; i++) {
  await A.p.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', {})));
  await until(A.p, `!(${onCity})`, `trip ${i}: the game`, 20000);
  await sleep(1500);
  await A.p.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await until(A.p, onCity, `trip ${i}: back on the city`, 20000); await up(A.p);
  await sleep(2500);
  S.push(await sample(A.p));
  if (i === 1 || i % 5 === 0) console.log(`trip ${i}:`, JSON.stringify(S[i]));
}
const C = await phone('lnc');
await up(C.p); await sleep(2500);
const M = [await sample(C.p)];
for (let i = 1; i <= MENUS; i++) {
  await C.p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'profile' })));
  await until(C.p, `!(${onCity})`, `menu ${i}: the card`, 15000); await sleep(800);
  await C.p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
  await until(C.p, onCity, `menu ${i}: back`, 20000); await up(C.p); await sleep(2000);
  M.push(await sample(C.p));
}
console.log('menus:', M.map(s => `${s.n}/${s.gl}`).join(' '));
// (judged on the night's PEAK of live canvases (before the fix: the old cities' canvases piled up until WebKit's next GC — 457 at trip 15) + the MB
//  MEDIAN (the trips 2–6 vs the last five) + the GPU contexts — a single sample swings ±15 canvases as the bakes come + go, so never one sample)
const med = xs => { const v = [...xs].sort((p, q) => p - q); return v[v.length >> 1]; };
const band = (arr, a, b, k) => med(arr.slice(a, b).map(x => x[k]));
const sum = arr => ({ n0: band(arr, 2, 7, 'n'), n1: band(arr, -5, undefined, 'n'), mb0: band(arr, 2, 7, 'mb'), mb1: band(arr, -5, undefined, 'mb'), peak: Math.max(...arr.slice(1).map(x => x.n)), gl0: band(arr, 2, 7, 'gl'), gl1: band(arr, -5, undefined, 'gl') });
const T = sum(S), Mn = sum(M);
console.log('trips', JSON.stringify(T), 'menus', JSON.stringify(Mn));
ok(T.peak <= T.n0 * 1.25 && T.mb1 - T.mb0 <= 3, `THE LONG NIGHT — ${TRIPS} trips city → game → room: the live canvases flat after the first trips (median ${T.n0} → ${T.n1}, ${T.mb0} → ${T.mb1} MB; the night's peak ${T.peak})`);
ok(T.gl1 <= T.gl0, `…the live GPU contexts flat (${T.gl0} → ${T.gl1})`);
ok(Mn.peak <= Mn.n0 * 1.25 && Mn.mb1 - Mn.mb0 <= 3 && Mn.gl1 <= Mn.gl0, `${MENUS} trips title → YOUR CARD → title: canvases median ${Mn.n0} → ${Mn.n1} (${Mn.mb0} → ${Mn.mb1} MB; peak ${Mn.peak}), GPU contexts ${Mn.gl0} → ${Mn.gl1}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ trips: S, menus: M }, null, 1));
await browser.close();
console.log(`checks ${checks.filter(Boolean).length}/${checks.length}`);
process.exit(fails.length ? 1 : 0);
