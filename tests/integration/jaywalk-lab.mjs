// JAYWALK — THE JAYWALK LAB's own check (/jaywalk-lab — js/games/jaywalk/lab.js; H2: night.js · sfx.js · audition.js; H1's graybox behind
// ?gray=1 — docs/jaywalk.md "THE LAB"), on the LOCAL server + the emulators (NEVER THE LIVE SITE):
//   · a STRANGER gets the door (no canvas; three.js, the scene + the models never fetched) — the owner gate, like /lab
//   · THE NIGHT LOOK renders (the local preview: localhost + ?emu + &preview=1): the Kenney models + the skyline band loaded, no graybox
//     unless ?gray=1; THE WIDER VIEW (WIDTH 11 by default, 9 — remembered), THE KID's measured height at both; the proven camera
//   · EVERY TAP ACTS (a tap hops on release · a swipe fires the moment it crosses its threshold · swipe down = back · no page scroll)
//   · a run played to its end by the bot through the page's own input path: THE REPLAY = THE LIVE RUN, one tap = HOP AGAIN
//   · THE SOUNDS: a hop asks for its sound (pitch ± 6 %, gain ± 2 dB); THE SOUND AUDITION opens, plays, loops the bell, remembers a pick,
//     copies the picks' line — Chromium; + WebKit (--webkit: ~/wk Playwright) where it can
//   · --perf: the frame rate + frame time (p95 / worst) + draw calls + triangles at EACH TIER, 390 × 844 @3 under a 4× CPU throttle
//   · the shots (night, WIDTH 11 + 9, a train coming, the flight path's tell, a log ride, a hit …) into [outDir] — kept out of git
//   node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf] [--webkit] [--look] (--look: the shots only)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), PERF = argv.includes('--perf'), WK = argv.includes('--webkit'), LOOK = argv.includes('--look'), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(100); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
const open = async (w, h, dpr, q = '') => {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [];
  try { await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write']); } catch { /* fine */ }
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => reqs.push(r.url()));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  await p.goto(guardUrl(`${BASE}/jaywalk-lab?emu${q}`, 'jaywalk-lab'), { waitUntil: 'load' });
  return { p, errs, reqs, close: () => ctx.close() };
};
const st = p => p.evaluate(() => window.__jwLab.state());
const up = p => waitFor(p, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')").then(() => p.evaluate(() => window.__jwLab.ready));
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
const tapEl = async (p, sel) => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; }, sel); if (!r) return null; await touch(p, [[r[0], r[1]]]); await sleep(150); return r; };

// ---- the look's shots: the night at both widths, a run, a train coming + passing, the flight path's tell, a log ride, a hit, the wall, a landmark
async function looks(p) {
  if (!OUT) return;
  const L = js => p.evaluate(js);
  await L("window.__jwLab.bot(false); window.__jwLab.restart('match', 'look3')"); await sleep(500);
  await shot(p, 'night-start-w11.png');
  await L('window.__jwLab.setCols(9)'); await sleep(400); await shot(p, 'night-start-w9.png'); await L('window.__jwLab.setCols(11)');
  await L('window.__jwLab.bot(true)'); await waitFor(p, 'window.__jwLab.state().best >= 16', 30000); await shot(p, 'night-run-w11.png');
  await L('window.__jwLab.setCols(9)'); await sleep(900); await shot(p, 'night-run-w9.png'); await L('window.__jwLab.setCols(11); window.__jwLab.bot(false)');
  const at = async (kind, from, back, o) => { const i = await p.evaluate((k, f) => window.__jwLab.find(k, f), kind, from); await p.evaluate((l, oo) => window.__jwLab.warp(l, oo), i - back, o || {}); await sleep(700); return i; };
  let i = await at('rail', 30, 3);
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 34 && Math.floor(window.__jwLab.state().t / 8) % 2 === 0`, 15000); await shot(p, 'night-train-coming.png');
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s > 9`, 5000); await shot(p, 'night-train-passing.png');
  i = await at('flight', 150, 3);
  ok(i >= 150, `a flight path on the course (lane ${i})`);
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 50`, 15000); await shot(p, 'night-flight-tell.png');
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s >= 4`, 5000); await shot(p, 'night-flight-pass.png');
  i = await at('ufo', 100, 2);
  ok(i >= 100, `a UFO on the course (its zone from lane ${i})`);
  await sleep(600); await shot(p, 'night-ufo.png');
  await L("window.__jwLab.restart('match', 'look3')"); i = await at('mark', 40, 3); await shot(p, 'night-landmark.png');
  // a log ride: the kid put on a log's back (no blink), carried along
  await L("window.__jwLab.restart('match', 'look3')");   // (a new run: the wall follows the BEST lane — a warp back down would be behind it)
  i = await p.evaluate(() => window.__jwLab.find('water', 14));
  await p.evaluate(l => window.__jwLab.warp(l - 1), i); await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 12000);
  await p.evaluate(l => window.__jwLab.warp(l, { x: window.__jwLab.logAt(l), blink: 0 }), i); await sleep(450);
  ok((await st(p)).st === 'idle', 'a log ride: the kid stands on a log');
  await shot(p, 'night-log-ride.png');
  // a hit: a car
  i = await p.evaluate(() => window.__jwLab.find('road', 20));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { blink: 0 }); }, i);
  ok(await waitFor(p, "window.__jwLab.state().st === 'down'", 15000), 'a hit: a car gets a kid who stands on the road');
  await sleep(330); await shot(p, 'night-hit-car.png');
  // the water
  i = await p.evaluate(() => window.__jwLab.find('water', 14));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { x: 4500, blink: 0 }); }, i);
  await waitFor(p, "window.__jwLab.state().st === 'down'", 6000); await sleep(140); await shot(p, 'night-hit-water-or-edge.png');
  // THE BLACKOUT coming up behind a kid who stops
  await L("window.__jwLab.restart('solo', 'look3'); window.__jwLab.hop('u')"); await sleep(11200); await shot(p, 'night-blackout.png');
  ok((await st(p)).wall > -4 && !(await st(p)).over, 'THE BLACKOUT comes up behind a kid who stops (seen before it catches them)');
  await L("window.__jwLab.restart('solo')");
}

try {
  if (LOOK) { const o = await open(390, 844, 3, '&preview=1&seed=look3&cols=11'); await up(o.p); await sleep(600); await looks(o.p); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
  // ---- 1. a stranger gets the door
  {
    const { p, errs, reqs, close } = await open(390, 844, 2);
    const door = await waitFor(p, "!!document.querySelector('.jw-deny')");
    ok(door, 'a STRANGER gets the door (/api/admin whoami says no)');
    ok(!(await p.evaluate(() => !!document.querySelector('canvas'))), '… no scene behind it');
    ok(!reqs.some(u => /three/.test(u)), '… three.js was never fetched');
    ok(!reqs.some(u => /graybox\.js|night\.js|\.glb|skyline|audio\/jaywalk/.test(u)), '… nor the scene, a model, the skyline or a sound');
    ok(await p.evaluate(() => document.querySelector('meta[name=robots]').content === 'noindex, nofollow'), 'noindex, nofollow');
    ok(!errs.length, `no page error at the door${errs.length ? `: ${errs[0]}` : ''}`);
    await shot(p, 'door-390x844.png');
    ok(/localhost|127\.0\.0\.1/.test(await p.evaluate(() => location.hostname)), 'the test runs on a local host');
    await close();
  }
  // ---- 2. THE NIGHT LOOK (the local preview)
  const { p, errs, reqs, close } = await open(390, 844, 3, '&preview=1&seed=labseed1&fps=1');
  ok(await up(p), 'the local preview opens THE NIGHT LOOK (three.js 0.160 from the import map) + Kenney\'s models arrive');
  await sleep(700);
  let s = await st(p);
  ok(s.mode === 'solo' && s.seed === 'labseed1' && s.y === 0, `a solo run on its seed, the kid on lane 0 (${JSON.stringify({ mode: s.mode, seed: s.seed })})`);
  ok(s.gray === false && s.info.look === 'night' && !reqs.some(u => /graybox\.js/.test(u)), 'the night look — no graybox (its file never fetched)');
  ok(reqs.filter(u => /assets\/jaywalk\/models\/[\w-]+\.glb/.test(u)).length === 12 && reqs.some(u => /assets\/jaywalk\/skyline-night\.webp/.test(u)), 'the 12 Kenney models + the night skyline loaded (only the current look\'s picture)');
  ok(s.info.calls >= 14 && s.info.calls <= 48 && s.info.tris > 4000, `the scene draws: ${s.info.calls} draw calls, ${s.info.tris} triangles (everything that repeats is instanced)`);
  ok(Math.abs(s.kidY - 0.65) <= 0.04, `THE CAMERA: the kid sits ${(s.kidY * 100).toFixed(1)} % down the screen (≈ 65 %)`);
  ok(Math.abs(s.info.fov - 54) < 0.6, `fov ${s.info.fov.toFixed(1)} at 390 × 844`);
  ok(await p.evaluate(() => { const a = document.querySelector('.jw-skyline').getBoundingClientRect(), z = document.querySelector('.jw-blackout').getBoundingClientRect(), f = a.height / innerHeight; return a.top === 0 && f >= 0.215 && f <= 0.245 && z.bottom >= innerHeight - 1 && !document.querySelector('.jw-sky'); }), 'THE SKYLINE BAND: the top 22–24 % of the screen; the bottom always fades to black');
  ok(await p.evaluate(() => { const i = document.querySelector('.jw-skyline-img').getBoundingClientRect(); return i.width >= innerWidth * 1.1 && document.querySelectorAll('.jw-sky-l').length >= 6 && document.querySelectorAll('.jw-sky-n').length >= 3; }), '… the picture covers the band with room to slide; the aviation lights + the neon blocks are there (the night life)');
  ok(await p.evaluate(() => { const e = document.querySelector('.jw-lanes'), c = getComputedStyle(e); return e.textContent === '0' && e.getBoundingClientRect().height >= 56 && /rgb/.test(c.textShadow) && !/Orbitron/.test(c.fontFamily.split(',')[0]); }), 'THE LANE COUNT: big neon numerals at the top (the numbers\' font — never the heavy block 0)');
  // THE WIDER VIEW
  ok(s.cols === 11 && s.info.cols === 11, 'THE WIDER VIEW: 11 columns seen by default (the 9 played + a dimmer edge column each side)');
  const px11 = s.kidPx;
  let r = await tapEl(p, '.jw-w[data-cols="9"]'); await sleep(250); s = await st(p);
  const px9 = s.kidPx;
  ok(s.cols === 9 && s.info.cols === 9 && s.hops === 0 && r[2] >= 44 && r[3] >= 44, `WIDTH 9: the switch acts on its own press (no hop), ${r[2].toFixed(0)} × ${r[3].toFixed(0)} pt`);
  ok(px9 > px11 * 1.15 && px11 >= 24, `THE KID's height at 390: ${px11.toFixed(1)} pt at WIDTH 11 · ${px9.toFixed(1)} pt at WIDTH 9`);
  ok(Math.abs(s.kidY - 0.65) <= 0.04, `… the kid still ${(s.kidY * 100).toFixed(1)} % down the screen at WIDTH 9`);
  console.log('KID', JSON.stringify({ w11: +px11.toFixed(1), w9: +px9.toFixed(1) }));
  ok(await p.evaluate(() => localStorage.getItem('jw:lab:cols') === '9'), '… remembered on this phone');
  await tapEl(p, '.jw-w[data-cols="11"]'); s = await st(p);
  ok(s.cols === 11 && await p.evaluate(() => document.querySelector('.jw-w[data-cols="11"]').classList.contains('is-on')), 'WIDTH 11 again');
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
  const y0 = (await st(p)).y;
  await touch(p, [[195, 500]], 4); await touch(p, [[195, 500]], 4); await sleep(420); s = await st(p);
  ok(s.y === y0 + 2, `two quick taps = two hops (one buffered): lane ${y0} → ${s.y}`);
  ok(await p.evaluate(() => scrollY === 0 && document.documentElement.scrollHeight <= innerHeight + 1 && getComputedStyle(document.querySelector('.jw-play')).touchAction === 'none'), 'no page scroll, touch-action none on the play area');
  // THE SOUNDS IN PLAY: every hop asked for its sound, never the same twice
  ok(await waitFor(p, '!!window.__jwLab.sfx', 8000), 'the sounds are on the SHARED audio engine (installed after the door)');
  let w = await p.evaluate(() => window.__jwLab.sfx.wanted().filter(x => x.id === 'hop'));
  ok(w.length >= 6 && w.every(x => Math.abs(x.rate - 1) <= 0.0601 && x.vol >= 0.79 && x.vol <= 1.26) && new Set(w.map(x => x.rate)).size > 3, `a hop asks for its sound: ${w.length} hops, pitch ± 6 % (${Math.min(...w.map(x => x.rate))} … ${Math.max(...w.map(x => x.rate))}), gain ± 2 dB`);
  const heard = await p.evaluate(() => window.__jwLab.sfx.played().length);
  ok(heard >= 1, `… and they SOUND once the first tap unlocked the audio (${heard} started on the audio context)`);
  // ---- 3. the bot plays the run out through the page's own input path: THE REPLAY = THE LIVE RUN
  await p.evaluate(() => window.__jwLab.bot(true));
  ok(await waitFor(p, 'window.__jwLab.state().best >= 12', 30000), 'the bot hops up the course');
  await shot(p, 'run-390x844.png');
  ok(await waitFor(p, 'window.__jwLab.ends.length >= 1', 240000), 'the run ends (1 life in solo)');
  await p.evaluate(() => window.__jwLab.bot(false));   // (at once: the measure's bot starts a new run 600 ms after an end)
  await sleep(200);
  let e = await p.evaluate(() => ({ end: window.__jwLab.ends[0], t: document.querySelector('.jw-end-t').textContent, l: document.querySelector('.jw-end-l').textContent, c: document.querySelector('.jw-check').textContent, cls: document.querySelector('.jw-check').className, hidden: document.querySelector('.jw-end').hidden }));
  ok(!e.hidden && /LANE \d+/.test(e.l) && e.t.length > 2, `the end screen names the cause + the lane ("${e.t}" · "${e.l}")`);
  ok(e.end.same === true && /is-ok/.test(e.cls) && /^REPLAY = LIVE/.test(e.c), `THE REPLAY = THE LIVE RUN (${e.c})`);
  ok(e.end.live.lanes === e.end.replay.lanes && e.end.live.tick === e.end.replay.tick && e.end.live.cause === e.end.replay.cause, 'lanes, tick + cause identical');
  w = await p.evaluate(() => window.__jwLab.sfx.wanted().slice(-3).map(x => x.id));
  ok(w.includes('hit') || w.includes('splash'), `the hit has its sound (${w.join(' · ')})`);
  await shot(p, 'end-390x844.png');
  await p.evaluate(() => window.__jwLab.bot(false));
  await sleep(350);
  await touch(p, [[195, 400]]); await sleep(200); s = await st(p);
  ok(!s.over && s.seed !== 'labseed1' && s.best <= 1, `ONE TAP = HOP AGAIN, at once, on a NEW seed (${s.seed})`);
  ok(await p.evaluate(() => document.querySelector('.jw-end').hidden), 'the end screen is gone');
  // ---- 4. the mode switch + NEW SEED (their own press + lift — never the play area's hop)
  r = await tapEl(p, '.jw-tab[data-mode="match"]'); s = await st(p);
  ok(s.mode === 'match' && s.lives === 3 && s.hops === 0, 'MATCH: 3 lives, a new run — the tap on the tab is no hop');
  ok(r[2] >= 44 && r[3] >= 44, `the tabs' tap area ≥ 44 pt (${r[2].toFixed(0)} × ${r[3].toFixed(0)})`);
  ok(/THE MOTHERSHIP 5:5\d|THE MOTHERSHIP 6:00/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'MATCH shows THE MOTHERSHIP\'s countdown (6:00) + the lives');
  await tapEl(p, '.jw-tab[data-mode="daily"]'); s = await st(p);
  ok(s.mode === 'daily' && /THE MOTHERSHIP 4:5\d|THE MOTHERSHIP 5:00/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'DAILY: THE MOTHERSHIP at 5:00');
  const seedA = s.seed;
  await tapEl(p, '.jw-new:not(.jw-snd)'); s = await st(p);
  ok(s.seed !== seedA && s.mode === 'daily', 'NEW SEED: a new course, the same mode');
  await tapEl(p, '.jw-tab[data-mode="solo"]');
  ok(/ENDLESS/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'SOLO: ENDLESS — no mothership');
  ok(await p.evaluate(() => !!document.querySelector('.jw-fps') && /fps/.test(document.querySelector('.jw-fps').textContent)), 'the fps readout shows with &fps=1 …');
  // ---- 4b. THE SOUND AUDITION
  await touch(p, [[195, 500]]); await sleep(300);   // (a run under way: the sheet must hold it still)
  r = await tapEl(p, '.jw-snd');
  ok(await waitFor(p, "!!document.querySelector('.sh.jw-au-sheet.is-in')", 6000) && r[2] >= 44 && r[3] >= 44, 'SOUNDS → THE SOUND AUDITION opens (THE SHEET)');
  await sleep(450);
  const tA = (await st(p)).t; await sleep(500);
  ok((await st(p)).t === tA, '… and the run holds still under it');
  const rows = await p.evaluate(() => [...document.querySelectorAll('.jw-au-row')].map(x => ({ id: x.dataset.id, plays: x.querySelectorAll('.jw-au-play').length, picks: x.querySelectorAll('.jw-au-pick').length })));
  ok(rows.length === 12 && rows.filter(x => x.plays === 2 && x.picks === 2).length === 7 && rows.filter(x => x.plays === 1 && x.picks === 0).length === 5, `EVERY JAYWALK sound: ${rows.length} rows — 7 with a pick + its backup side by side (PLAY A · PLAY B · USE A / B), 5 with one take`);
  const n0 = await p.evaluate(() => ({ w: window.__jwLab.sfx.wanted().length, p: window.__jwLab.sfx.played().length }));
  await tapEl(p, '[data-snd="hop:a"]'); await tapEl(p, '[data-snd="hop:b"]'); await tapEl(p, '[data-snd="new-best:b"]'); await sleep(500);
  const n1 = await p.evaluate(() => ({ w: window.__jwLab.sfx.wanted().slice(-3).map(x => `${x.id}:${x.ab}`), p: window.__jwLab.sfx.played().length, last: window.__jwLab.sfx.played().slice(-3).map(x => `${x.id}:${x.ab}`) }));
  ok(n1.w.join() === 'hop:a,hop:b,new-best:b', `EVERY TAP ACTS: PLAY A, PLAY B (${n1.w.join(' · ')})`);
  ok(n1.p - n0.p === 3 && n1.last.join() === 'hop:a,hop:b,new-best:b', `… each one SOUNDS, the first time it is asked for (${n1.p - n0.p} started — a backup is fetched + decoded on its first tap)`);
  await tapEl(p, '[data-snd="train-bell:a"]'); await sleep(700);
  let bell = await p.evaluate(() => ({ on: document.querySelector('[data-snd="train-bell:a"]').classList.contains('is-on'), n: window.__jwLab.sfx.sounding(), last: window.__jwLab.sfx.played().slice(-1)[0] }));
  ok(bell.on && bell.n >= 1 && bell.last.id === 'train-bell' && bell.last.loop === true, 'the train bell plays as a LOOP (the whole 16-bit WAV — no MP3 padding)');
  await sleep(2300);
  ok(await p.evaluate(() => window.__jwLab.sfx.sounding() >= 1), '… still ringing after its first lap (1.9 s)');
  await tapEl(p, '.jw-au-stop'); await sleep(200);
  ok(await p.evaluate(() => window.__jwLab.sfx.sounding() === 0 && !document.querySelector('.jw-au-play.is-on')), 'STOP ends it');
  await tapEl(p, '[data-pick="hop:b"]'); await tapEl(p, '[data-pick="land-wood:b"]');
  const line = await p.evaluate(() => ({ t: document.querySelector('.jw-au-line').textContent, ls: [localStorage.getItem('jw:lab:snd:hop'), localStorage.getItem('jw:lab:snd:land-wood')], on: document.querySelector('[data-pick="hop:b"]').classList.contains('is-on') }));
  ok(line.on && line.ls.join() === 'b,b' && /^JAYWALK SOUNDS: hop B · land-wood B · hit A · splash A · car-pass A · horn A · train-bell A · train-pass A · lights-die A · landmark A · new-best A · respawn A$/.test(line.t), `a choice a sound, remembered on this phone ("${line.t}")`);
  // COPY MY PICKS: inside the tap's own lift. A browser that REFUSES the clipboard (this headless one does) → the line itself is there to hold;
  // one that takes it → COPIED (the clipboard's write stood in for, so the text it was handed is read back)
  await tapEl(p, '.jw-au-copy'); await sleep(400);
  const refused = await p.evaluate(() => document.querySelector('.jw-au-said').textContent);
  ok(/COPIED|PRESS AND HOLD THE LINE/.test(refused) && await p.evaluate(() => getComputedStyle(document.querySelector('.jw-au-line')).userSelect !== 'none'), `COPY MY PICKS never a dead button: "${refused}" (the line can be held + copied)`);
  await p.evaluate(() => { window.__clip = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.__clip = t; return Promise.resolve(); } } }); });
  await tapEl(p, '.jw-au-copy'); await sleep(300);
  const clip = await p.evaluate(() => window.__clip), said = await p.evaluate(() => document.querySelector('.jw-au-said').textContent);
  ok(clip === line.t && /COPIED/.test(said), `COPY MY PICKS hands the clipboard the one line ("${String(clip).slice(0, 44)}…" · "${said}")`);
  await shot(p, 'audition-390x844.png');
  await p.evaluate(() => document.querySelector('.sh-x').click()); await sleep(450);
  ok(await p.evaluate(() => !document.querySelector('.sh.jw-au-sheet.is-in')), 'the × closes it');
  const hb = await p.evaluate(() => window.__jwLab.sfx.wanted().length);
  await touch(p, [[195, 500]]); await sleep(300);
  w = await p.evaluate(n => window.__jwLab.sfx.wanted().slice(n), hb);
  ok(w.length === 1 && w[0].id === 'hop' && w[0].ab === 'b', 'the game plays the owner\'s choice (hop B) — and the run goes on');
  await p.evaluate(() => { localStorage.removeItem('jw:lab:snd:hop'); localStorage.removeItem('jw:lab:snd:land-wood'); });
  ok(!errs.length, `no page error in the lab${errs.length ? `: ${errs.slice(0, 2).join(' · ')}` : ''}`);
  await p.evaluate(() => window.__jwLab.restart('solo'));
  // ---- 5. the looks (shots only)
  await looks(p);
  await close();
  // ---- 5b. the frame rate at EACH TIER: 390 × 844 @3, 1× + 4× CPU, the bot playing
  if (PERF) {
    const rows2 = [];
    for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&cols=11`);
      await up(o.p); await o.p.emulateCPUThrottling(rate);
      await o.p.evaluate(() => { window.__jwLab.restart('solo', 'perfseed7'); window.__jwLab.bot(true); });
      await sleep(3000); await o.p.evaluate(() => window.__jwLab.clearFrames()); await sleep(15000);
      const f = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), co: window.__jwLab.cost(), s: window.__jwLab.state() }));
      await o.p.emulateCPUThrottling(1);
      const fr = f.fr.slice().sort((a, c) => a - c), avg = fr.reduce((a, c) => a + c, 0) / fr.length, co = f.co.slice().sort((a, c) => a - c);
      const row = { tier, cpu: `${rate}×`, frames: fr.length, fps: +(1000 / avg).toFixed(1), avgMs: +avg.toFixed(2), p95Ms: +fr[Math.floor(fr.length * 0.95)].toFixed(2), worstMs: +fr[fr.length - 1].toFixed(1), over33: fr.filter(x => x > 33.4).length, calls: f.s.info.calls, tris: f.s.info.tris, canvas: `${f.s.info.w}×${f.s.info.h} @${f.s.info.dpr}`, bloom: f.s.info.bloom, workMedianMs: +co[co.length >> 1].toFixed(2), workP95Ms: +co[Math.floor(co.length * 0.95)].toFixed(2), workWorstMs: +co[co.length - 1].toFixed(1) };
      console.log('PERF', JSON.stringify(row)); rows2.push(row);
      ok(f.s.info.tier === tier && !o.errs.length, `tier ${tier} pinned (CPU ${rate}×): ${row.fps} fps · ${row.avgMs} ms (p95 ${row.p95Ms}, worst ${row.worstMs}) · ${row.calls} calls · ${row.tris} tris · ${row.canvas}${row.bloom ? ' · bloom' : ''}`);
      await o.close();
    }
    const at4 = rows2.filter(x => x.cpu === '4×');
    ok(at4.some(x => x.fps >= 55), `4× CPU: a tier holds 60 (${at4.map(x => `tier ${x.tier} ${x.fps}`).join(' · ')}) — the automatic steps find it`);
    ok(rows2.every(x => x.calls <= 48), `≤ 48 draw calls a frame at every tier (${rows2.map(x => x.calls).join(' · ')})`);
    if (OUT) writeFileSync(join(OUT, 'perf.json'), JSON.stringify(rows2, null, 1));
  }
  // ---- 6. the fps readout only when asked + THE GRAYBOX behind ?gray=1 (H1's, for comparison)
  const noFps = await open(390, 844, 2, '&preview=1');
  await up(noFps.p);
  ok(!(await noFps.p.evaluate(() => !!document.querySelector('.jw-fps'))), '… and never without it');
  await noFps.close();
  {
    const g = await open(390, 844, 2, '&preview=1&gray=1&seed=labseed1');
    await waitFor(g.p, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')"); await sleep(500);
    const q = await st(g.p);
    ok(q.gray === true && !q.info.look && g.reqs.some(u => /graybox\.js/.test(u)) && !g.reqs.some(u => /night\.js|\.glb|skyline/.test(u)), '?gray=1 keeps THE GRAYBOX (H1\'s boxes — no model, no skyline fetched)');
    ok(await g.p.evaluate(() => !!document.querySelector('.jw-sky') && !document.querySelector('.jw-skyline') && !document.querySelector('.jw-w') && !document.querySelector('.jw-snd')), '… its empty band, no WIDTH switch, no SOUNDS');
    await g.p.evaluate(() => window.__jwLab.bot(true)); await waitFor(g.p, 'window.__jwLab.state().best >= 9', 30000);
    await shot(g.p, 'gray-390x844.png');
    ok(!g.errs.length, `no page error in the graybox${g.errs.length ? `: ${g.errs[0]}` : ''}`);
    await g.close();
  }
  // ---- 7. the other sizes (the look review's shots): 402 / 430 phones + 1440 × 900 (DESKTOP COMES FREE: the same phone-shaped play area, centred)
  for (const [w2, h2, dpr] of [[402, 874, 3], [430, 932, 3], [1440, 900, 1]]) {
    const o = await open(w2, h2, dpr, '&preview=1&seed=labseed1');
    await up(o.p); await o.p.evaluate(() => window.__jwLab.bot(true));
    await waitFor(o.p, 'window.__jwLab.state().best >= 9', 30000);
    await shot(o.p, `run-${w2}x${h2}.png`);
    await o.p.evaluate(() => window.__jwLab.bot(false)); await sleep(1100);
    const q = await st(o.p);
    ok(q.info.w <= Math.ceil(h2 * 0.62) + 1 && Math.abs(q.kidY - 0.65) <= 0.04, `${w2} × ${h2}: the play area ${q.info.w} wide, the kid at rest ${(q.kidY * 100).toFixed(0)} % down, ${q.kidPx.toFixed(0)} pt tall, fov ${q.info.fov.toFixed(1)}`);
    ok(!o.errs.length, `${w2} × ${h2}: no page error`);
    await o.close();
  }
  // ---- 8. WebKit (Playwright's, as an iPhone): the night look opens, the audition opens + every tap asks for its sound
  if (WK) {
    const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
    const wb = await webkit.launch(), ctx = await wb.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const wp = await ctx.newPage(), werr = [];
    wp.on('pageerror', x => werr.push(x.message));
    await wp.goto(guardUrl(`${BASE}/jaywalk-lab?emu&preview=1&seed=labseed1`, 'jaywalk-lab'), { waitUntil: 'load' });
    const wwait = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await wp.evaluate(js)) return true; } catch { /* loading */ } await sleep(100); } return false; };
    ok(await wwait("!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')") && await wp.evaluate(() => window.__jwLab.ready), 'WebKit: the night look opens + the models arrive');
    await sleep(600);
    const ws = await wp.evaluate(() => window.__jwLab.state());
    ok(ws.info.look === 'night' && ws.info.calls >= 14 && Math.abs(ws.kidY - 0.65) <= 0.04, `WebKit: the scene draws (${ws.info.calls} calls, ${ws.info.tris} tris, the kid ${ws.kidPx.toFixed(1)} pt)`);
    await wp.touchscreen.tap(195, 500); await sleep(300);
    ok((await wp.evaluate(() => window.__jwLab.state())).y === 1, 'WebKit: a tap hops');
    const wtap = async sel => { const bx = await wp.evaluate(q => { const el = document.querySelector(q); el.scrollIntoView({ block: 'center', behavior: 'instant' }); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); await wp.touchscreen.tap(bx[0], bx[1]); await sleep(200); };
    await wtap('.jw-snd');
    ok(await wwait("!!document.querySelector('.sh.jw-au-sheet.is-in')", 6000), 'WebKit: SOUNDS → the audition sheet opens');
    await sleep(450);
    const b0 = await wp.evaluate(() => window.__jwLab.sfx.wanted().length);
    await wtap('[data-snd="hop:a"]'); await wtap('[data-snd="splash:a"]'); await wtap('[data-snd="respawn:b"]');
    const ww = await wp.evaluate(n => ({ w: window.__jwLab.sfx.wanted().slice(n).map(x => `${x.id}:${x.ab}`), p: window.__jwLab.sfx.played().length }), b0);
    ok(ww.w.join() === 'hop:a,splash:a,respawn:b', `WebKit: every PLAY tap acts (${ww.w.join(' · ')}; ${ww.p} started on its audio context — Playwright's WebKit on Windows may have no audio device)`);
    await wtap('[data-pick="respawn:b"]');
    ok(/respawn B$/.test(await wp.evaluate(() => document.querySelector('.jw-au-line').textContent)), 'WebKit: a pick is taken');
    if (OUT) await wp.screenshot({ path: join(OUT, 'webkit-audition-390x844.png') });
    ok(!werr.length, `WebKit: no page error${werr.length ? `: ${werr[0]}` : ''}`);
    await wb.close();
  }
} catch (e) { if (!e.look) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); } }
finally { await b.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
