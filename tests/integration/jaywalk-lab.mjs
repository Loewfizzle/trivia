// JAYWALK H1 — THE JAYWALK LAB's own check (/jaywalk-lab — js/games/jaywalk/lab.js + graybox.js; docs/jaywalk.md "THE LAB"), on the LOCAL
// server + the emulators (NEVER THE LIVE SITE):
//   · a STRANGER gets the door (no canvas, three.js never fetched) — the owner gate, like /lab
//   · the local preview (localhost + ?emu + &preview=1) opens the graybox: the proven camera (the kid ≈ 65 % down the screen at 390 × 844),
//     EVERY TAP ACTS (a tap hops on release · a swipe fires the moment it crosses its threshold · swipe down = back · no page scroll)
//   · a run played to its end by the bot through the page's own input path: THE REPLAY = THE LIVE RUN (the determinism line), one tap = HOP AGAIN
//   · --perf: the frame rate + frame time at 390 × 844 @3 under a 4× CPU throttle (the pass log's number); shots into [outDir]
//   node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), PERF = argv.includes('--perf'), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(100); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
const open = async (w, h, dpr, q = '') => {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => reqs.push(r.url()));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  await p.goto(guardUrl(`${BASE}/jaywalk-lab?emu${q}`, 'jaywalk-lab'), { waitUntil: 'load' });
  return { p, errs, reqs, close: () => ctx.close() };
};
const st = p => p.evaluate(() => window.__jwLab.state());
/** a real touch: down at (x, y), moves, up — through CDP (pointer events of type touch) */
const touch = async (p, pts, hold = 12) => {
  const c = await p.createCDPSession(), tp = (x, y) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pts[0][0], pts[0][1]) });
  for (const [x, y] of pts.slice(1)) { await sleep(hold); await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x, y) }); }
  await sleep(hold);
  const mid = await st(p);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
  return mid;
};

try {
  // ---- 1. a stranger gets the door
  {
    const { p, errs, reqs, close } = await open(390, 844, 2);
    const door = await waitFor(p, "!!document.querySelector('.jw-deny')");
    ok(door, 'a STRANGER gets the door (/api/admin whoami says no)');
    ok(!(await p.evaluate(() => !!document.querySelector('canvas'))), '… no graybox behind it');
    ok(!reqs.some(u => /three/.test(u)), '… three.js was never fetched');
    ok(!reqs.some(u => /graybox\.js/.test(u)), '… nor the graybox');
    ok(await p.evaluate(() => document.querySelector('meta[name=robots]').content === 'noindex, nofollow'), 'noindex, nofollow');
    ok(!errs.length, `no page error at the door${errs.length ? `: ${errs[0]}` : ''}`);
    await shot(p, 'door-390x844.png');
    // &preview=1 opens nothing without ?emu on a local host — and nothing at all elsewhere (the rule is the host's name: config.js's)
    ok(/localhost|127\.0\.0\.1/.test(await p.evaluate(() => location.hostname)), 'the test runs on a local host');
    await close();
  }
  // ---- 2. the graybox (the local preview)
  const { p, errs, close } = await open(390, 844, 3, '&preview=1&seed=labseed1&fps=1');
  ok(await waitFor(p, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')"), 'the local preview opens the graybox (three.js 0.160 from the import map)');
  await sleep(700);
  let s = await st(p);
  ok(s.mode === 'solo' && s.seed === 'labseed1' && s.y === 0, `a solo run on its seed, the kid on lane 0 (${JSON.stringify({ mode: s.mode, seed: s.seed })})`);
  ok(Math.abs(s.kidY - 0.65) <= 0.04, `THE CAMERA: the kid sits ${(s.kidY * 100).toFixed(1)} % down the screen (≈ 65 %)`);
  ok(Math.abs(s.info.fov - 54) < 0.6, `fov ${s.info.fov.toFixed(1)} at 390 × 844`);
  ok(await p.evaluate(() => { const a = document.querySelector('.jw-sky').getBoundingClientRect(), z = document.querySelector('.jw-blackout').getBoundingClientRect(); return a.top === 0 && a.height > 150 && z.bottom >= innerHeight - 1; }), 'the skyline band\'s space at the top + the blackout gradient at the bottom (screen-space)');
  ok(await p.evaluate(() => document.querySelector('.jw-lanes').textContent === '0' && document.querySelector('.jw-lanes').getBoundingClientRect().height >= 56), 'the lane count: big, at the top');
  await shot(p, 'start-390x844.png');
  await sleep(1500); s = await st(p);
  ok(!s.started && s.t === 0 && /TAP TO HOP/.test(await p.evaluate(() => document.querySelector('.jw-mark').textContent)), 'the run waits for the FIRST touch (tick 0 = the first hop — the wall never runs at a kid nobody is playing)');
  // EVERY TAP ACTS
  let mid = await touch(p, [[195, 500]]);
  ok(mid.y === 0 && mid.st === 'idle' && mid.asked === 0, 'a TAP does nothing while the finger is down …');
  await sleep(260); s = await st(p);
  ok(s.y === 1 && s.hops === 1, '… and hops forward on RELEASE');
  mid = await touch(p, [[195, 500], [203, 501], [222, 503]]);
  ok(mid.asked === 2, 'a SWIPE fires the moment it crosses its threshold (before the finger lifts — the hop is asked for; the next tick logs it)');
  await sleep(260); s = await st(p);
  ok(Math.abs(s.x - 5.5) < 0.01 && s.y === 1 && s.hops === 2, `swipe right = one column right (x ${s.x}) — and the lift adds no second hop`);
  await touch(p, [[195, 500], [180, 500], [150, 500]]); await sleep(260); s = await st(p);
  ok(Math.abs(s.x - 4.5) < 0.01, 'swipe left = back to the centre column');
  await touch(p, [[195, 500], [195, 520], [195, 545]]); await sleep(260); s = await st(p);
  ok(s.y === 0, 'swipe DOWN = a hop back');
  await touch(p, [[195, 500], [198, 509], [201, 513]]); await sleep(260); s = await st(p);
  ok(s.hops === 5, 'a short flick (past a tap, short of a swipe) still acts — no touch is dropped');
  // two quick taps: the second is BUFFERED while the first hop is in flight
  const y0 = (await st(p)).y;
  await touch(p, [[195, 500]], 4); await touch(p, [[195, 500]], 4); await sleep(420); s = await st(p);
  ok(s.y === y0 + 2, `two quick taps = two hops (one buffered): lane ${y0} → ${s.y}`);
  ok(await p.evaluate(() => scrollY === 0 && document.documentElement.scrollHeight <= innerHeight + 1 && getComputedStyle(document.querySelector('.jw-play')).touchAction === 'none'), 'no page scroll, touch-action none on the play area');
  // ---- 3. the bot plays the run out through the page's own input path: THE REPLAY = THE LIVE RUN
  await p.evaluate(() => window.__jwLab.bot(true));
  ok(await waitFor(p, 'window.__jwLab.state().best >= 12', 30000), 'the bot hops up the course');
  await shot(p, 'run-390x844.png');
  ok(await waitFor(p, 'window.__jwLab.ends.length >= 1', 240000), 'the run ends (1 life in solo)');
  await sleep(200);
  let e = await p.evaluate(() => ({ end: window.__jwLab.ends[0], t: document.querySelector('.jw-end-t').textContent, l: document.querySelector('.jw-end-l').textContent, c: document.querySelector('.jw-check').textContent, cls: document.querySelector('.jw-check').className, hidden: document.querySelector('.jw-end').hidden }));
  ok(!e.hidden && /LANE \d+/.test(e.l) && e.t.length > 2, `the end screen names the cause + the lane ("${e.t}" · "${e.l}")`);
  ok(e.end.same === true && /is-ok/.test(e.cls) && /^REPLAY = LIVE/.test(e.c), `THE REPLAY = THE LIVE RUN (${e.c})`);
  ok(e.end.live.lanes === e.end.replay.lanes && e.end.live.tick === e.end.replay.tick && e.end.live.cause === e.end.replay.cause, 'lanes, tick + cause identical');
  await shot(p, 'end-390x844.png');
  await p.evaluate(() => window.__jwLab.bot(false));
  await sleep(350);
  await touch(p, [[195, 400]]); await sleep(200); s = await st(p);
  ok(!s.over && s.seed !== 'labseed1' && s.best <= 1, `ONE TAP = HOP AGAIN, at once, on a NEW seed (${s.seed})`);
  ok(await p.evaluate(() => document.querySelector('.jw-end').hidden), 'the end screen is gone');
  // ---- 4. the mode switch + NEW SEED (their own press + lift — never the play area's hop)
  const tapEl = async sel => { const r = await p.evaluate(q => { const x = document.querySelector(q).getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; }, sel); await touch(p, [[r[0], r[1]]]); await sleep(150); return r; };
  let r = await tapEl('.jw-tab[data-mode="match"]'); s = await st(p);
  ok(s.mode === 'match' && s.lives === 3 && s.hops === 0, 'MATCH: 3 lives, a new run — the tap on the tab is no hop');
  ok(r[2] >= 44 && r[3] >= 44, `the tabs' tap area ≥ 44 pt (${r[2].toFixed(0)} × ${r[3].toFixed(0)})`);
  ok(/THE MOTHERSHIP 5:5\d|THE MOTHERSHIP 6:00/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'MATCH shows THE MOTHERSHIP\'s countdown (6:00) + the lives');
  await tapEl('.jw-tab[data-mode="daily"]'); s = await st(p);
  ok(s.mode === 'daily' && /THE MOTHERSHIP 4:5\d|THE MOTHERSHIP 5:00/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'DAILY: THE MOTHERSHIP at 5:00');
  const seedA = s.seed;
  await tapEl('.jw-new'); s = await st(p);
  ok(s.seed !== seedA && s.mode === 'daily', 'NEW SEED: a new course, the same mode');
  await tapEl('.jw-tab[data-mode="solo"]');
  ok(/ENDLESS/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'SOLO: ENDLESS — no mothership');
  ok(await p.evaluate(() => !!document.querySelector('.jw-fps') && /fps/.test(document.querySelector('.jw-fps').textContent)), 'the fps readout shows with &fps=1 …');
  ok(!errs.length, `no page error in the lab${errs.length ? `: ${errs.slice(0, 2).join(' · ')}` : ''}`);
  // ---- 5. the frame rate at 390 × 844 @3, 4× CPU
  if (PERF) {
    const measure = async (label, rate) => {
      await p.emulateCPUThrottling(rate);
      await p.evaluate(() => { window.__jwLab.restart('solo', 'perfseed7'); window.__jwLab.bot(true); });
      await sleep(2500);
      await p.evaluate(() => window.__jwLab.clearFrames());
      await sleep(15000);
      const f = await p.evaluate(() => ({ fr: window.__jwLab.frames(), co: window.__jwLab.cost(), s: window.__jwLab.state() }));
      await p.emulateCPUThrottling(1);
      const fr = f.fr.slice().sort((a, c) => a - c), avg = fr.reduce((a, c) => a + c, 0) / fr.length, co = f.co.slice().sort((a, c) => a - c);
      const row = { label, frames: fr.length, fps: +(1000 / avg).toFixed(1), avgMs: +avg.toFixed(2), medianMs: +fr[fr.length >> 1].toFixed(2), p95Ms: +fr[Math.floor(fr.length * 0.95)].toFixed(2), worstMs: +fr[fr.length - 1].toFixed(1), over33: fr.filter(x => x > 33.4).length, calls: f.s.info.calls, tris: f.s.info.tris, canvas: `${f.s.info.w}×${f.s.info.h} @${f.s.info.dpr}`, workMedianMs: +co[co.length >> 1].toFixed(2), workP95Ms: +co[Math.floor(co.length * 0.95)].toFixed(2), workWorstMs: +co[co.length - 1].toFixed(1), ticks: f.s.steps };
      console.log('PERF', JSON.stringify(row));
      return row;
    };
    const rows = [await measure('390×844 @3, CPU 1×', 1), await measure('390×844 @3, CPU 4×', 4)];
    ok(rows[1].fps >= 50, `4× CPU: ${rows[1].fps} fps (avg ${rows[1].avgMs} ms, p95 ${rows[1].p95Ms} ms, worst ${rows[1].worstMs} ms)`);
    ok(rows[1].calls <= 30, `${rows[1].calls} draw calls a frame (everything that repeats is instanced)`);
    if (OUT) writeFileSync(join(OUT, 'perf.json'), JSON.stringify(rows, null, 1));
    await p.evaluate(() => window.__jwLab.bot(false));
  }
  // ---- 5b. the look checks (shots only): the train's signal lights, the flight path's runway lights + THE BLACKBIRD, THE UFO + its beam, the wall
  if (OUT) {
    await p.evaluate(() => { window.__jwLab.bot(false); window.__jwLab.restart('match', 'look3'); });
    const at = async (kind, from, back) => { const i = await p.evaluate((k, f) => window.__jwLab.find(k, f), kind, from); await p.evaluate(l => window.__jwLab.warp(l), i - back); await sleep(700); return i; };
    let i = await at('rail', 30, 3);
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 30`, 15000); await shot(p, 'look-rail-tell.png');
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s > 8`, 5000); await shot(p, 'look-rail-train.png');
    i = await at('flight', 150, 3);
    ok(i >= 150, `a flight path on the course (lane ${i})`);
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 40`, 15000); await shot(p, 'look-flight-tell.png');
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s >= 4`, 5000); await shot(p, 'look-flight-pass.png');
    i = await at('ufo', 100, 2);
    ok(i >= 100, `a UFO on the course (its zone from lane ${i})`);
    await sleep(600); await shot(p, 'look-ufo.png');
    i = await at('mark', 40, 4); await shot(p, 'look-landmark.png');
    await p.evaluate(() => { window.__jwLab.restart('solo', 'look3'); window.__jwLab.hop('u'); }); await sleep(11500); await shot(p, 'look-wall.png');
    ok((await st(p)).wall > -4 && !(await st(p)).over, 'the wall comes up behind a kid who stops (seen before it catches them)');
    await p.evaluate(() => window.__jwLab.restart('solo'));
  }
  const noFps = await open(390, 844, 2, '&preview=1');
  await waitFor(noFps.p, '!!window.__jwLab');
  ok(!(await noFps.p.evaluate(() => !!document.querySelector('.jw-fps'))), '… and never without it');
  await noFps.close();
  await close();
  // ---- 6. the other sizes (the look review's shots): 402 / 430 phones + 1440 × 900 (DESKTOP COMES FREE: the same phone-shaped play area, centred)
  for (const [w, h, dpr] of [[402, 874, 3], [430, 932, 3], [1440, 900, 1]]) {
    const o = await open(w, h, dpr, '&preview=1&seed=labseed1');
    await waitFor(o.p, '!!window.__jwLab'); await o.p.evaluate(() => window.__jwLab.bot(true));
    await waitFor(o.p, 'window.__jwLab.state().best >= 9', 30000);
    await shot(o.p, `run-${w}x${h}.png`);
    await o.p.evaluate(() => window.__jwLab.bot(false)); await sleep(900);
    const q = await st(o.p);
    ok(q.info.w <= Math.ceil(h * 0.62) + 1 && Math.abs(q.kidY - 0.65) <= 0.04, `${w} × ${h}: the play area ${q.info.w} wide, the kid at rest ${(q.kidY * 100).toFixed(0)} % down, fov ${q.info.fov.toFixed(1)}`);
    ok(!o.errs.length, `${w} × ${h}: no page error`);
    await o.close();
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await b.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
