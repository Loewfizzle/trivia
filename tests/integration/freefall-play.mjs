// FREEFALL F2 — THE TEST PAGE's own check (/freefall-play — js/games/freefall/play.js + stage.js + night.js — docs/freefall.md "THE TEST
// PAGE"), the BROWSER half of tests/freefall-play.test.mjs, on the LOCAL server (NEVER THE LIVE SITE; scripts/serve.mjs is enough):
//   · THE OPENING at 390 × 844: the live scene, the sign FREE / FALL, FALL AS DEEP AS YOU CAN, YOUR BEST, the hint + DRAG TO SPIN +
//     THE ROOFTOP · FLOOR 0; the FIRST DRAG starts the run (the logo + the hint fade, the camera sweeps to the play camera)
//   · THE RUN THROUGH REAL DRAGS (CDP touches): 1 : 1, FAIR INPUT; the ball ≥ 34 pt, its floor ≈ 30 % from the top, 4–5 floors in sight
//     below it; the big number; THE BLAZE, a SHATTER, the landing after it; the areas' walls; THE TRENCH's moving red
//   · THE HOLD: the page hidden mid-run = the run held (a logged hold), back = 3 · 2 · 1, then on; a match runs on
//   · THE END = JAYWALK's standard (the header's colours, the cause — never red —, the number, YOUR BEST, PLAY AGAIN · SHARE | CITY);
//     REPLAY = LIVE after every run (the console); YOUR BEST = this phone's
//   · **NOTHING COUNTS**: no request to /api, no Firebase, no web socket — its own static files, three.js, the fonts
//   · the lost context: the scene is built again, the run never stops
//   node tests/integration/freefall-play.mjs "<chromium>" [outDir] [--look] [--perf] [--webkit]
//     --look = the review's shots only (THE OPENING, every area, the moments, the greyscale red, the hold, the end, the sizes)
//     --perf = the measured frame rate, every tier, 1× + 4× CPU (the bot playing) — FREEFALL's speed test
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, LOOK = argv.includes('--look'), PERF = argv.includes('--perf');
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 240000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(40); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

async function open(w, h, dpr, q = '', { best = 0 } = {}) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [], sockets = [], logs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /freefall|WebGL|THREE/i.test(t)) logs.push(`${m.type()}: ${t}`); });
  p.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(`${r.method()} ${r.url()}`); });
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', e => sockets.push(e.url));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  if (best) await p.evaluateOnNewDocument(n => { try { localStorage.setItem('ff:play:best', String(n)); } catch { /* fine */ } }, best);
  await p.goto(guardUrl(`${BASE}/freefall-play${q}`, 'freefall-play'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__ffPlay && !!document.querySelector('canvas.ff-canvas') && window.__ffPlay.state().info.frames > 3");
  return { p, cdp, errs, reqs, sockets, logs, up, touch: w < 700, w, h, close: () => ctx.close() };
}
const st = p => p.evaluate(() => window.__ffPlay.state());
/** a REAL finger: down at (x, y), across by `dx` px in `steps` moves, (up) */
async function drag(t, x, y, dx, { steps = 4, up = true, down = true } = {}) {
  const pt = px => ({ x: px, y, id: 1, radiusX: 4, radiusY: 4, force: 1 });
  if (!t.touch) {
    if (down) { await t.p.mouse.move(x, y); await t.p.mouse.down(); }
    for (let k = 1; k <= steps; k++) await t.p.mouse.move(x + dx * k / steps, y);
    if (up) await t.p.mouse.up();
    return;
  }
  if (down) await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(x)] });
  for (let k = 1; k <= steps; k++) await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(x + dx * k / steps)] });
  if (up) await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** start the run with a real touch (no turn), wait until it is live */
async function start(t) { await drag(t, t.w / 2, t.h * 0.7, 0, { steps: 1 }); return waitFor(t.p, 'window.__ffPlay.state().started'); }
const auto = (p, mode) => p.evaluate(m => { window.__ffPlay.auto = m; }, mode);
const hideShow = (p, hidden) => p.evaluate(hd => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hd ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);

// =============================================================================================================== THE LOOK (the review's shots)
async function look() {
  const SIZES = [[390, 844, 3, '']];
  for (const [w, h, dpr] of SIZES) {
    // THE OPENING
    let t = await open(w, h, dpr, '?seed=look1&tier=2', { best: 88 });
    await sleep(900);
    await shot(t.p, 'f2-01-opening.png');
    console.log('opening', JSON.stringify((await st(t.p)).info), t.errs, t.logs.slice(0, 6));
    // the first floors: THE ROOFTOP
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 3 && window.__ffPlay.state().fl === "bounce"');
    await sleep(250); await shot(t.p, 'f2-02-rooftop.png');
    // THE BLAZE
    await auto(t.p, 'gap');
    await waitFor(t.p, 'window.__ffPlay.state().blaze');
    await sleep(120); await shot(t.p, 'f2-03-blaze.png');
    // … through a slice: SMASH
    await auto(t.p, 'smash');
    await waitFor(t.p, 'window.__ffPlay.state().shatters >= 1');
    await sleep(70); await shot(t.p, 'f2-04-shatter.png');
    await sleep(160); await shot(t.p, 'f2-04b-shatter-later.png');
    await t.close();
    // every area's wall (the ball bouncing on a floor of it) + THE TRENCH's moving red
    for (const [name, floor] of [['offices', 46], ['seam-speakeasy', 77], ['speakeasy', 88], ['harbor', 128], ['deep', 168], ['trench', 214], ['trench-lap3', 300]]) {
      t = await open(w, h, dpr, `?seed=look2&tier=2&floor=${floor}`, { best: 141 });
      await start(t); await auto(t.p, 'play');
      await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().fl === "bounce"`, 30000);
      await auto(t.p, 'safe');
      await sleep(500); await shot(t.p, `f2-05-${name}.png`);
      if (name === 'speakeasy') { await t.p.evaluate(() => window.__ffPlay.view.grey(true)); await sleep(120); await shot(t.p, 'f2-06-red-greyscale.png'); await t.p.evaluate(() => window.__ffPlay.view.grey(false)); }
      if (name === 'trench') console.log('trench', JSON.stringify((await st(t.p)).info));
      await t.close();
    }
    // YOUR BEST's tape + the crossing
    t = await open(w, h, dpr, '?seed=look3&tier=2', { best: 6 });
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 2 && window.__ffPlay.state().fl === "bounce"');
    await sleep(200); await shot(t.p, 'f2-07-best-tape.png');
    await waitFor(t.p, 'window.__ffPlay.state().newBest');
    await sleep(350); await shot(t.p, 'f2-08-new-best.png');
    // THE DARKNESS closing in (hands off)
    await auto(t.p, 'safe');
    await waitFor(t.p, 'window.__ffPlay.state().dark <= 2', 30000);
    await sleep(300); await shot(t.p, 'f2-09-darkness.png');
    await waitFor(t.p, 'window.__ffPlay.state().shown', 30000);
    await sleep(500); await shot(t.p, 'f2-10-end-dark-newbest.png');
    await t.close();
    // THE HOLD + the end on red
    t = await open(w, h, dpr, '?seed=look4&tier=2', { best: 88 });
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 12');
    await hideShow(t.p, true); await sleep(200); await hideShow(t.p, false);
    await sleep(700); await shot(t.p, 'f2-11-hold.png');
    await waitFor(t.p, '!window.__ffPlay.state().held', 6000);
    await auto(t.p, 'red');
    await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
    await sleep(500); await shot(t.p, 'f2-12-end.png');
    console.log('end', JSON.stringify(await t.p.evaluate(() => window.__ffPlay.ends.map(e => [e.same, e.live.cause, e.live.floor, e.holds]))), t.errs, t.logs.slice(-4));
    await t.close();
  }
  // the other sizes: the opening + a play frame
  for (const [w, h, dpr] of [[375, 667, 2], [430, 932, 3], [1440, 900, 1]]) {
    const t = await open(w, h, dpr, '?seed=look1&tier=2', { best: 88 });
    await sleep(700); await shot(t.p, `f2-20-opening-${w}x${h}.png`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 4 && window.__ffPlay.state().fl === "bounce"');
    await sleep(250); await shot(t.p, `f2-21-play-${w}x${h}.png`);
    await auto(t.p, 'red');
    await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
    await sleep(400); await shot(t.p, `f2-22-end-${w}x${h}.png`);
    await t.close();
  }
}

// =============================================================================================================== THE CHECKS
const box = (p, sel) => p.evaluate(s => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(), cs = getComputedStyle(n); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, text: n.textContent, col: cs.color, op: +cs.opacity, fs: parseFloat(cs.fontSize), hidden: !!n.hidden || cs.display === 'none' }; }, sel);
const OUTSIDE = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;
const COUNTS = /\/api\/|firebase|gstatic\.com\/firebasejs|\/js\/(profile|progress|board|daily|vault|chat|admin|screens)\/|\/js\/(firebase|store|room|host|identity|seat|app|config)\.js|sw\.js/i;

async function checks1() {
  // ---- THE OPENING (390 × 844 @3)
  const t = await open(390, 844, 3, '?seed=chk1', { best: 88 });
  ok(t.up && !t.errs.length, `the page loads at 390 × 844: its stage + the scene, no error (${t.errs.join(' | ') || 'none'})`);
  await sleep(600);
  let s = await st(t.p);
  ok(/\bis-open\b/.test(s.cls) && !s.started && s.floor === 0 && s.info.pose[0] === 27, `THE OPENING = the live scene: not started, the ball on floor 0, the camera high over the tower top (pitch ${s.info.pose[0]}°)`);
  const free = await box(t.p, '.ff-free'), fall = await box(t.p, '.ff-fall'), tag = await box(t.p, '.ff-tag'), bestL = await box(t.p, '.ff-best'), ft = await box(t.p, '.ff-foot-t'), fl = await box(t.p, '.ff-foot-l'), hint = await box(t.p, '.ff-hint'), sndB = await box(t.p, '.ff-snd'), note = await box(t.p, '.ff-note');
  ok(free.text === 'FREE' && fall.text === 'FALL' && free.x >= 8 && fall.r <= 390 - 8 && fall.x > free.x + 20 && fall.y > free.y + 40 && free.fs >= 70, `the sign FREE / FALL stacked (FALL a step down-right), ${free.fs.toFixed(0)} px, inside the screen (${free.x.toFixed(0)} … ${fall.r.toFixed(0)})`);
  ok(tag.text === 'FALL AS DEEP AS YOU CAN' && tag.fs >= 13 && tag.y > fall.b, `"${tag.text}" under it`);
  ok(bestL.text === 'YOUR BEST 88' && bestL.fs >= 13 && bestL.y < free.y, `"${bestL.text}" at the top`);
  ok(ft.text === 'DRAG TO SPIN' && ft.fs >= 22 && fl.text === 'THE ROOFTOP · FLOOR 0' && hint.y < ft.y && fl.b < 844 - 20, `at the foot: the thumb-sweep hint · ${ft.text} (${ft.fs.toFixed(0)} px) · ${fl.text}`);
  ok(sndB && sndB.w >= 44 && sndB.h >= 44 && note.text === 'TEST PAGE — NOTHING COUNTS YET', `SOUNDS ≥ 44 pt (${sndB.w.toFixed(0)} × ${sndB.h.toFixed(0)}) · the note "${note.text}"`);
  ok(s.warmed && s.info.programs >= 9 && /sky:1/.test(s.info.walls) && /offices:1/.test(s.info.walls), `THE WARM FRAME behind the opening: ${s.info.programs} programs built, the skyline + the first wall uploaded (${s.info.walls})`);
  await shot(t.p, 'chk-01-opening.png');

  // ---- THE FIRST DRAG starts the run
  const ok1 = await start(t);
  s = await st(t.p);
  ok(ok1 && s.started && !/\bis-open\b/.test(s.cls) && /\bis-live\b/.test(s.cls), 'the FIRST DRAG starts the run (tick 0), the opening leaves');
  await sleep(1200);
  s = await st(t.p);
  const open2 = await box(t.p, '.ff-open'), hud = await box(t.p, '.ff-hud');
  ok(open2.op === 0 && hud.op === 1 && Math.abs(s.info.pose[0] - 33) < 0.01 && Math.abs(s.info.pose[2] - 0.34) < 0.001, `the logo + the hint fade, the camera sweeps down to the play camera (pitch ${s.info.pose[0].toFixed(1)}°)`);
  ok(s.st === 'live' && s.bounces >= 1 && s.floor === 0, `a touch that does not turn leaves the ball bouncing on floor 0 (${s.bounces} bounces)`);
  const F = s.frame;
  ok(F.ball.d >= 34 && Math.abs(F.floorY - 0.34) < 0.03, `THE BALL ${F.ball.d.toFixed(0)} pt across (≥ 34), its floor ${(F.floorY * 100).toFixed(0)} % from the top`);
  const below = F.rows.filter(y => y < 1).length - 1;
  ok(below >= 4 && below <= 7, `${below} floors in sight below the ball's`);
  const apex = await t.p.evaluate(() => window.__ffPlay.apexY()), area = await box(t.p, '.ff-area');
  ok(area.b <= apex + 1, `the HUD (the number + the area's name) ends above the ball's highest point (${area.b.toFixed(0)} of ${apex.toFixed(0)} pt)`);
  const numB = await box(t.p, '.ff-num');
  ok(numB.fs >= 64 && s.num === '0' && area.text === 'THE ROOFTOP', `the big number ${numB.fs.toFixed(0)} px ("${s.num}") · ${area.text}`);

  // ---- THE DRAG IS 1 : 1 (F1's scale): the ring under the ball moves as far as the finger
  await waitFor(t.p, 'window.__ffPlay.msToLanding() > 380');
  const a0 = (await st(t.p)).a, ppr = s.pxPerRad;
  await drag(t, 150, 600, 88, { steps: 8 });
  await sleep(120);
  s = await st(t.p);
  const turned = ((s.a - a0 + 6144) % 4096) - 2048, want = 88 * 4096 / (2 * Math.PI * ppr);
  ok(Math.abs(turned - want) <= 4 && s.owed === 0 && ppr > 100 && ppr < 125, `a drag of 88 px turns the tower ${turned} units (1 : 1 = ${want.toFixed(0)}; ${ppr.toFixed(0)} px a radian — F1's scale: a quarter turn = ${(ppr * Math.PI / 2).toFixed(0)} px)`);
  ok(s.entries > 0, `the moves are in the engine's own log (${s.entries} entries)`);

  // ---- floor after floor; THE BLAZE; a SHATTER
  await auto(t.p, 'play');
  ok(await waitFor(t.p, 'window.__ffPlay.state().floor >= 4'), 'gap by gap, the ball falls floor after floor');
  s = await st(t.p);
  ok(s.num === String(s.floor), `the big number follows the floors (${s.num})`);
  await auto(t.p, 'gap');
  ok(await waitFor(t.p, 'window.__ffPlay.state().blaze'), 'three clean floors light THE BLAZE');
  const call = await box(t.p, '.ff-call');
  ok(call.text === 'BLAZE!' && call.fs >= 26, `the announcer: "${call.text}" (${call.fs.toFixed(0)} px)`);
  await auto(t.p, 'smash');
  ok(await waitFor(t.p, 'window.__ffPlay.state().shatters >= 1'), 'THE BLAZE goes through a solid slice (a shatter)');
  ok((await box(t.p, '.ff-call')).text === 'SMASH!', 'the announcer: "SMASH!"');
  await shot(t.p, 'chk-02-shatter.png');

  // ---- THE HOLD (SOLO): hidden = held; back = 3 · 2 · 1, then on
  await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 12 && window.__ffPlay.state().fl === "bounce"');
  await hideShow(t.p, true);
  s = await st(t.p);
  const heldAt = s.t;
  ok(s.held && s.holds === 1 && /\bis-held\b/.test(s.cls), `the page hidden mid-run: the run is HELD at tick ${heldAt} (a logged hold: ${s.holds})`);
  await sleep(700);
  s = await st(t.p);
  ok(s.held && s.t === heldAt && !s.over, 'held: the clock stands, nothing lands, the darkness waits');
  await hideShow(t.p, false);
  await sleep(250);
  const hn = await box(t.p, '.ff-hold-n'), hl = await box(t.p, '.ff-hold-l');
  ok((await st(t.p)).counting && hn.text === '3' && hn.fs >= 100 && hl.text === '2 PAUSES LEFT', `back on screen: 3 · 2 · 1 ("${hn.text}", ${hn.fs.toFixed(0)} px) · "${hl.text}"`);
  await shot(t.p, 'chk-03-hold.png');
  ok(await waitFor(t.p, '!window.__ffPlay.state().held', 4000), '… then on');
  await sleep(300);
  s = await st(t.p);
  ok(s.t > heldAt && s.t < heldAt + 60 && !/\bis-held\b/.test(s.cls), `the run goes on from the hold's own tick (tick ${s.t}: the 3 s away + the count were never run time)`);
  // two more holds, then none left: the fourth hide runs on
  for (let k = 0; k < 2; k++) { await hideShow(t.p, true); await sleep(60); await hideShow(t.p, false); await waitFor(t.p, '!window.__ffPlay.state().held', 4000); }
  s = await st(t.p);
  await hideShow(t.p, true);
  const s4 = await st(t.p);
  await hideShow(t.p, false);
  ok(s.holds === 3 && !s4.held && s4.holds === 3, `three holds a run (${s.holds}); the 4th hide holds nothing — the run goes on`);

  // ---- THE END = JAYWALK's STANDARD; REPLAY = LIVE in the console
  await auto(t.p, 'red');
  ok(await waitFor(t.p, 'window.__ffPlay.state().shown', 40000), 'onto the red: the run ends, the end card comes');
  await sleep(500);
  s = await st(t.p);
  const e = await t.p.evaluate(() => { const q = x => document.querySelector(x), c = x => getComputedStyle(q(x)).color, r = x => q(x).getBoundingClientRect(); const last = window.__ffPlay.ends[window.__ffPlay.ends.length - 1];
    return { hd: q('.ff-ec-hd').textContent, cols: [c('.fn-w1'), c('.fn-w2'), c('.fn-m')], cause: q('.ff-ec-cause').textContent, causeCol: c('.ff-ec-cause'), n: q('.ff-ec-n').getAttribute('aria-label'), nFs: parseFloat(getComputedStyle(q('.ff-ec-n')).fontSize), fl: q('.ff-ec-fl').textContent, best: q('.ff-ec-best').textContent, line: q('.ff-ec-line').textContent,
      again: { x: r('.ff-again').left, r: r('.ff-again').right, h: r('.ff-again').height, b: r('.ff-again').bottom, bg: getComputedStyle(q('.ff-again')).backgroundColor, rad: getComputedStyle(q('.ff-again')).borderRadius }, share: { dis: q('.ff-share').disabled, text: q('.ff-share').textContent, h: r('.ff-share').height }, city: { href: q('.ff-city').getAttribute('href'), h: r('.ff-city').height }, lineB: r('.ff-ec-line').bottom, againT: r('.ff-again').top, hudOp: +getComputedStyle(q('.ff-hud')).opacity,
      last: { same: last.same, cause: last.live.cause, floor: last.live.floor, judge: last.judge.ok, jf: last.judge.floor, holds: last.holds, entries: last.entries } }; });
  ok(e.hd === 'FREEFALL · SOLO' && e.cols.join('|') === 'rgb(195, 91, 255)|rgb(184, 255, 59)|rgb(201, 182, 255)', `the header "${e.hd}": FREE ultraviolet · FALL lime · the mode lavender (${e.cols.join(' ')})`);
  ok(e.cause === 'HIT THE RED' && e.causeCol === 'rgb(195, 91, 255)', `the cause "${e.cause}" in ultraviolet neon (${e.causeCol}) — never red`);
  ok(e.n === String(s.floor) && e.nFs >= 84 && e.fl === 'FLOORS', `the big number ${e.n} (${e.nFs.toFixed(0)} px) · ${e.fl}`);
  ok(e.best === 'YOUR BEST · 88' && /^\d+ BOUNCES? · \d+ BLAZES? · BEST RUN \d+$/.test(e.line), `"${e.best}" in gold · "${e.line}"`);
  ok(e.again.h >= 58 && e.again.x >= 15 && e.again.r <= 375 && e.again.bg === 'rgb(184, 255, 59)' && e.again.rad === '8px' && e.lineB < e.againT, `PLAY AGAIN: one solid lime bar, ${e.again.h.toFixed(0)} pt tall, a rounded rectangle (${e.again.rad}), under the card`);
  ok(e.share.dis && e.share.text === 'SHARE · SOON' && e.city.href === '/' && e.share.h >= 44 && e.city.h >= 44, `the foot: ${e.share.text} (a placeholder until F4) | CITY (→ ${e.city.href}), both ≥ 44 pt`);
  ok(e.hudOp === 0, 'the HUD leaves at once when the card comes');
  ok(e.last.same && e.last.judge && e.last.jf === e.last.floor && e.last.cause === 'red' && e.last.holds === 3, `REPLAY = LIVE: the log (${e.last.entries} entries + ${e.last.holds} holds) through a fresh engine + the judge = the live run (floor ${e.last.floor})`);
  ok(t.logs.some(l => /\[freefall\] REPLAY = LIVE ✓/.test(l)) && !(await box(t.p, '.ff-check')), 'REPLAY = LIVE ✓ is said in the console only (no line on the card)');
  await shot(t.p, 'chk-04-end.png');
  // the sounds: asked on the audio engine (the browser may refuse to sound without a real gesture — what was ASKED is the check)
  const snd = await t.p.evaluate(() => { const S = window.__ffPlay.sfx; return S ? { wanted: [...new Set(S.wanted().map(w => w.id))], played: S.played().length, lates: S.lates(), decoded: S.decoded().length, notes: [...new Set(S.wanted().filter(w => w.id === 'bounce').map(w => w.rate))].length } : null; });
  ok(snd && ['bounce', 'whoosh', 'blaze', 'shatter', 'crash'].every(id => snd.wanted.includes(id)) && snd.notes >= 3, `THE SOUNDS asked in the run: ${snd && snd.wanted.join(' · ')} (${snd && snd.notes} pitches of the note; ${snd && snd.played} started, ${snd && snd.decoded} files decoded, ${snd && snd.lates} late)`);
  // PLAY AGAIN: the opening again, a fresh run
  await t.p.evaluate(() => { const b = document.querySelector('.ff-again'), r = b.getBoundingClientRect(); window.__again = [r.left + r.width / 2, r.top + r.height / 2]; });
  const [ax, ay] = await t.p.evaluate(() => window.__again);
  await drag(t, ax, ay, 0, { steps: 1 });
  await sleep(300);
  s = await st(t.p);
  ok(!s.shown && !s.started && /\bis-open\b/.test(s.cls) && s.floor === 0 && s.entries === 0 && s.top === 'YOUR BEST 88', 'PLAY AGAIN: the opening again, a fresh run, YOUR BEST kept');

  // ---- NOTHING COUNTS: the page hidden with its sound on (the audio engine's leave count) → still no call
  await hideShow(t.p, true); await t.p.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await sleep(400); await hideShow(t.p, false);
  const bad = t.reqs.filter(r => COUNTS.test(r)), out = t.reqs.map(r => r.split(' ')[1]).filter(u => !u.startsWith(BASE) && !OUTSIDE.test(u));
  ok(!bad.length && !out.length && !t.sockets.length, `NOTHING COUNTS: ${t.reqs.length} requests — none to /api, none to Firebase, no web socket; outside the site only three.js + the fonts (${bad.concat(out).slice(0, 3).join(' ') || 'clean'})`);
  const stored = await t.p.evaluate(() => Object.keys(localStorage).sort().join(' '));
  ok(/^ff:play:best( |$)/.test(stored) || stored === 'ff:play:best' || stored.split(' ').every(k => k === 'ff:play:best' || k.startsWith('na:') || k.startsWith('snd') || k.startsWith('ns')), `its storage: ${stored}`);
  ok(!t.errs.length, `no page error in the whole session (${t.errs.join(' | ') || 'none'})`);
  await t.close();
}

async function checks2() {
  // ---- NEW BEST: the crossing (gold), the end's NEW BEST · WAS n, this phone's best written
  let t = await open(390, 844, 2, '?seed=chk2', { best: 3 });
  await start(t); await auto(t.p, 'play');
  ok(await waitFor(t.p, 'window.__ffPlay.state().newBest'), 'the fall past YOUR BEST = the crossing');
  let s = await st(t.p);
  ok(/\bis-gold\b/.test(s.cls) && s.floor === 4 && s.call === 'NEW BEST', `floor ${s.floor}: NEW BEST in the announcer, the number turns gold`);
  ok(s.info.frames > 0 && s.tapeFloor === 3, `YOUR BEST's gold tape lies round floor ${s.tapeFloor}`);
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 12');
  await auto(t.p, 'red');
  await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
  await sleep(300);
  const bl = await box(t.p, '.ff-ec-best'), stored = await t.p.evaluate(() => localStorage.getItem('ff:play:best'));
  s = await st(t.p);
  ok(bl.text === 'NEW BEST · WAS 3' && stored === String(s.floor) && s.best === s.floor, `the end: "${bl.text}" · this phone's best is now ${stored}`);
  await shot(t.p, 'chk-05-new-best.png');
  await t.close();

  // ---- a MATCH never holds (`?mode=match`): hidden = the run goes on
  t = await open(390, 844, 2, '?seed=chk3&mode=match', { best: 88 });
  await start(t); await auto(t.p, 'safe');
  await waitFor(t.p, 'window.__ffPlay.state().bounces >= 2');
  await hideShow(t.p, true);
  s = await st(t.p);
  const t1 = s.t;
  await sleep(500); await hideShow(t.p, false); await sleep(200);
  const s2 = await st(t.p);
  ok(!s.held && s.holds === 0 && s2.t > t1 + 20 && s2.holds === 0, `a match does NOT hold: the clock ran on behind the hidden page (tick ${t1} → ${s2.t})`);
  ok((await box(t.p, '.ff-ec-hd')).text === 'FREEFALL · MATCH', 'the header would say MATCH');
  await t.close();

  // ---- `?floor=N`: the look check — live from floor N, its area's wall, never YOUR BEST
  t = await open(390, 844, 2, '?seed=chk4&floor=128', { best: 88 });
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 130 && window.__ffPlay.state().fl === "bounce"', 30000);
  s = await st(t.p);
  ok(s.floor >= 130 && s.area === 'UNDER THE HARBOR' && /harbor:1/.test(s.info.walls) && s.info.area === 3, `?floor=128: live from floor ${s.floor}, ${s.area}, its wall on the shaft (${s.info.walls})`);
  await auto(t.p, 'red'); await waitFor(t.p, 'window.__ffPlay.state().shown', 40000); await sleep(200);
  const e = await t.p.evaluate(() => { const l = window.__ffPlay.ends[0]; return [l.same, l.isNew, l.best, localStorage.getItem('ff:play:best'), document.querySelector('.ff-ec-best').textContent]; });
  ok(e[0] && !e[1] && e[2] === 88 && e[3] === '88' && e[4] === 'YOUR BEST · 88', `… REPLAY = LIVE holds; not a run: YOUR BEST stays ${e[3]} ("${e[4]}")`);
  await t.close();

  // ---- THE TRENCH: the red moves (the view follows the rules' own slice)
  t = await open(390, 844, 2, '?seed=chk5&floor=212', { best: 88 });
  await start(t); await auto(t.p, 'safe');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 203 && window.__ffPlay.state().fl === "bounce"', 30000);
  s = await st(t.p);
  ok(s.area === 'THE TRENCH' && s.info.area === 6 && /deep:1/.test(s.info.walls), `?floor=212: ${s.area} (the deep's wall)`);
  await shot(t.p, 'chk-06-trench.png');
  await t.close();

  // ---- THE LOST CONTEXT: the scene is built again, the run never stops
  t = await open(390, 844, 2, '?seed=chk6', { best: 88 });
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 3');
  const lost = await t.p.evaluate(() => window.__ffPlay.lose());
  const back = await waitFor(t.p, 'window.__ffPlay.state().rebuilds >= 1', 6000);
  s = await st(t.p);
  const f1 = s.floor;
  await waitFor(t.p, `window.__ffPlay.state().floor >= ${f1 + 2}`, 8000);
  const s3 = await st(t.p);
  ok(lost && back && s3.floor >= f1 + 2 && s3.info.frames > 5 && !t.errs.length, `a context lost mid-run: a new scene (${s3.rebuilds} rebuild), the run never stopped (floor ${f1} → ${s3.floor})`);
  await t.close();

  // ---- the tiers: pinned by `?tier=`
  for (const [tier, dprMax, bloom] of [[0, 1.5, false], [1, 2, false], [2, 3, true]]) {
    t = await open(390, 844, 3, `?seed=chk7&tier=${tier}`);
    s = await st(t.p);
    ok(s.info.tier === tier && s.info.dpr <= dprMax && s.info.bloom === bloom, `tier ${tier}: ${s.info.dpr}× ${s.info.bloom ? 'with' : 'no'} bloom`);
    await t.close();
  }

  // ---- the other sizes: the opening fits, the ball ≥ 34 pt, the HUD above the ball, the end's foot on the screen
  for (const [w, h, dpr] of [[375, 667, 2], [430, 932, 3], [1440, 900, 1]]) {
    t = await open(w, h, dpr, '?seed=chk8', { best: 88 });
    await sleep(400);
    const stg = await box(t.p, '.ff-stage'), free = await box(t.p, '.ff-free'), fall = await box(t.p, '.ff-fall'), ft = await box(t.p, '.ff-foot-t'), tag = await box(t.p, '.ff-tag');
    ok(free.x >= stg.x + 6 && fall.r <= stg.r - 6 && tag.b < ft.y && ft.b < h, `${w} × ${h}: the opening fits its column (the sign ${free.x.toFixed(0)} … ${fall.r.toFixed(0)} of ${stg.x.toFixed(0)} … ${stg.r.toFixed(0)})`);
    await start(t); await sleep(1200);
    s = await st(t.p);
    const apex = await t.p.evaluate(() => window.__ffPlay.apexY()), area = await box(t.p, '.ff-area'), below = s.frame.rows.filter(y => y < 1).length - 1;
    ok(s.frame.ball.d >= 34 && area.b <= apex + 1 && below >= 4, `${w} × ${h}: the ball ${s.frame.ball.d.toFixed(0)} pt, the HUD ends above it (${area.b.toFixed(0)} of ${apex.toFixed(0)}), ${below} floors below`);
    await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 11'); await auto(t.p, 'red');
    await waitFor(t.p, 'window.__ffPlay.state().shown', 40000); await sleep(300);
    const ag = await box(t.p, '.ff-again'), cy = await box(t.p, '.ff-city'), ln = await box(t.p, '.ff-ec-line'), hd = await box(t.p, '.ff-ec-hd'), sb = await box(t.p, '.ff-snd');
    ok(cy.b <= h - 20 && ln.b < ag.y && hd.y >= sb.b - 2 && ag.h >= 58, `${w} × ${h}: the end card under the SOUNDS row, PLAY AGAIN + SHARE | CITY on the screen (foot ${cy.b.toFixed(0)} of ${h})`);
    await t.close();
  }
}

// =============================================================================================================== THE SPEED (FREEFALL's speed test)
async function perf() {
  const rows = [];
  for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
    const d = await open(390, 844, 3, `?seed=perf&tier=${tier}&floor=84`);
    await start(d); await auto(d.p, 'smash');   // (the heaviest play: THE BLAZE's trail, a shatter's shards + sparks every few floors, THE SPEAKEASY's wall)
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await sleep(1500);
    await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; });
    await sleep(10000);
    const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s = P.state(), n = s.info.frames - window.__n0, ms = performance.now() - window.__f0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / ms, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], worst: a[a.length - 1], calls: s.info.calls, slices: s.info.slices, dpr: s.info.dpr, floor: s.floor, over: s.over, shatters: s.shatters, hitches: s.hitches }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ tier, rate, ...r });
    ok(r.fps >= 58 && r.p95 <= 20, `tier ${tier} at ${rate}× CPU: ${r.fps.toFixed(1)} fps (frame p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms) — floor ${r.floor}, ${r.shatters} shatters, @${r.dpr}`);
    await d.close();
  }
  console.log('\n| tier | cpu | fps | frame ms (p50 · p95 · worst) | size | hitches |\n| --- | --- | --- | --- | --- | --- |');
  for (const r of rows) console.log(`| ${r.tier} | ${r.rate}× | ${r.fps.toFixed(1)} | ${r.p50.toFixed(1)} · ${r.p95.toFixed(1)} · ${r.worst.toFixed(1)} | 390×844 @${r.dpr} | ${r.hitches} |`);
}

if (LOOK) await look();
else if (PERF) await perf();
else { await checks1(); await checks2(); }
await b.close();
console.log(`\n${checks} checks · ${fails.length} failed`);
for (const f of fails) console.log('  ✗', f);
process.exit(fails.length ? 1 : 0);
