// JAYWALK — THE JAYWALK LAB's own check (/jaywalk-lab — js/games/jaywalk/lab.js; H2: night.js · sfx.js · audition.js; H1's graybox behind
// ?gray=1 — docs/jaywalk.md "THE LAB"), on the LOCAL server + the emulators (NEVER THE LIVE SITE):
//   · THE LAB IS OPEN (H2B): a STRANGER gets the lab — no door, no sign-in, ZERO server calls (no /api, no Firebase: only the page's own
//     files, three.js from its CDN, the fonts); a &debug=1 link is dropped
//   · THE NIGHT LOOK renders: the Kenney models + the skyline band loaded, no graybox unless ?gray=1
//   · THE CAMERA (H2B — camera.js): ZOOM 7 · 8 · 9 (8 by default) + ANGLE STRAIGHT · TURNED (STRAIGHT by default — H3), remembered; the columns
//     across + THE KID's measured height at each zoom; the sideways follow keeps him on screen at both play edges + on a log ride (no
//     jitter), never more than ~1 column past the play area; 3–4 lanes seen behind him; ?gray=1 follows the same camera
//   · EVERY TAP ACTS (a tap hops on release · a swipe fires the moment it crosses its threshold · swipe down = back · no page scroll)
//   · a run played to its end by the bot through the page's own input path: THE REPLAY = THE LIVE RUN, one tap = HOP AGAIN
//   · THE SOUNDS: a hop asks for its sound (pitch ± 6 %, gain ± 2 dB); THE SOUND AUDITION opens, plays, loops the bell, remembers a pick,
//     copies the picks' line — Chromium; + WebKit (--webkit: ~/wk Playwright) where it can
//   · --perf: the frame rate + frame time (p95 / worst) + draw calls + triangles at EACH TIER, 390 × 844 @3 under a 4× CPU throttle, at
//     ZOOM 8 TURNED; a screenshot's own hitch measured (the H2 shots' "worst 250"); THE AUTOMATIC TIER STEP really steps down when the
//     frames slip (a heavy CPU throttle, nothing pinned)
//   · the shots (ZOOM 8 TURNED: the start, a run, a water / log stretch, a train, lane 200+ traffic; ZOOM 7 + 9; STRAIGHT …) into [outDir]
//     — kept out of git
//   node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf] [--webkit] [--look] [--h3] (--look: the shots only · --h3: H3's three shots only)
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
/** THE CAMERA's numbers on the page: the columns across the screen at the kid's row · the lanes seen behind him (a lane's middle above 88 % of
 *  the screen: over the lab's own rows — a real match's foot fades from 83 %) · how far the lanes run off level (degrees) */
const camOf = p => p.evaluate(() => {
  const L = window.__jwLab, s = L.state(), ky = s.y + 0.5, a = L.project(s.x - 0.5, ky), b = L.project(s.x + 0.5, ky), hw = innerHeight / innerWidth;
  let behind = 0;
  for (let k = 1; k <= 9; k++) if (L.project(s.x, ky - k)[1] <= 0.88) behind = k;
  return { across: 1 / Math.hypot(b[0] - a[0], (b[1] - a[1]) * hw), behind, slope: Math.atan2((b[1] - a[1]) * hw, b[0] - a[0]) * 180 / Math.PI, kidY: s.kidY, kidX: s.kidX, kidPx: s.kidPx, yaw: s.info.yaw, camX: s.info.camX, fov: s.info.fov };
});
const tapEl = async (p, sel) => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; }, sel); if (!r) return null; await touch(p, [[r[0], r[1]]]); await sleep(150); return r; };

// ---- the look's shots (H2B): ZOOM 8 TURNED — the start, a run, a water / log stretch, a train, lane 200+ busy traffic; ZOOM 7 + 9; STRAIGHT;
// + the flight path, the UFO, a landmark, the hits, the blackout
async function looks(p) {
  if (!OUT) return;
  const L = js => p.evaluate(js);
  const cam = async (z, a) => { await p.evaluate((zz, aa) => window.__jwLab.setCamera(zz, aa, true), z, a); await sleep(350); };
  await L("window.__jwLab.bot(false); window.__jwLab.restart('match', 'look3')"); await cam(8, 'turned'); await sleep(300);
  await shot(p, 'z8-turned-start.png');
  await L('window.__jwLab.bot(true)'); await waitFor(p, 'window.__jwLab.state().best >= 16', 30000); await L('window.__jwLab.bot(false)'); await sleep(500);
  await shot(p, 'z8-turned-run.png');
  await cam(7, 'turned'); await shot(p, 'z7-turned-run.png');
  await cam(9, 'turned'); await shot(p, 'z9-turned-run.png');
  await cam(8, 'straight'); await shot(p, 'z8-straight-run.png');
  await cam(8, 'turned');
  const at = async (kind, from, back, o) => { const i = await p.evaluate((k, f) => window.__jwLab.find(k, f), kind, from); await p.evaluate((l, oo) => window.__jwLab.warp(l, oo), i - back, o || {}); await sleep(700); return i; };
  let i = await at('rail', 30, 3);
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 34 && Math.floor(window.__jwLab.state().t / 8) % 2 === 0`, 15000); await shot(p, 'z8-turned-train-coming.png');
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s > 9`, 5000); await shot(p, 'z8-turned-train-passing.png');
  // LANE 200+: busy traffic — the kid (cyan by default) beside the cars, at both sides of the play area too
  await L("window.__jwLab.restart('match', 'look3')");
  i = await p.evaluate(() => { for (let l = 204; l < 400; l++) if (window.__jwLab.lane(l).type === 'grass' && window.__jwLab.lane(l + 1).type === 'road' && window.__jwLab.lane(l - 1).type === 'road') return l; return 210; });
  await p.evaluate(l => window.__jwLab.warp(l, { blink: 0 }), i); await sleep(900); await shot(p, 'z8-turned-lane200-a.png');
  await sleep(1300); await shot(p, 'z8-turned-lane200-b.png');
  await p.evaluate(l => window.__jwLab.warp(l, { x: 8500, blink: 0 }), i); await sleep(900); await shot(p, 'z8-turned-lane200-right-edge.png');
  await p.evaluate(l => window.__jwLab.warp(l, { x: 500, blink: 0 }), i); await sleep(900); await shot(p, 'z8-turned-lane200-left-edge.png');
  i = await at('flight', 150, 3);
  ok(i >= 150, `a flight path on the course (lane ${i})`);
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.pulse(${i}).left < 50`, 15000); await shot(p, 'night-flight-tell.png');
  await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass' && window.__jwLab.pulse(${i}).s >= 4`, 5000); await shot(p, 'night-flight-pass.png');
  i = await at('ufo', 100, 2);
  ok(i >= 100, `a UFO on the course (its zone from lane ${i})`);
  await sleep(600); await shot(p, 'night-ufo.png');
  await L("window.__jwLab.restart('match', 'look3')"); i = await at('mark', 40, 3); await shot(p, 'night-landmark.png');
  // THE WATER: a kid on the bank before a water stretch (water = danger, a log = safe), then a log ride
  await L("window.__jwLab.restart('match', 'look3')");   // (a new run: the wall follows the BEST lane — a warp back down would be behind it)
  i = await p.evaluate(() => window.__jwLab.find('water', 14));
  await p.evaluate(l => window.__jwLab.warp(l - 1, { blink: 0 }), i); await sleep(900); await shot(p, 'z8-turned-water.png');
  await cam(8, 'straight'); await shot(p, 'z8-straight-water.png'); await cam(8, 'turned');
  await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 12000);
  await p.evaluate(l => window.__jwLab.warp(l, { x: window.__jwLab.logAt(l), blink: 0 }), i); await sleep(450);
  ok((await st(p)).st === 'idle', 'a log ride: the kid stands on a log');
  await shot(p, 'z8-turned-log-ride.png');
  // a hit: a car
  i = await p.evaluate(() => window.__jwLab.find('road', 20));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { blink: 0 }); }, i);
  ok(await waitFor(p, "window.__jwLab.state().st === 'down'", 15000), 'a hit: a car gets a kid who stands on the road');
  await sleep(330); await shot(p, 'night-hit-car.png');
  // the water
  i = await p.evaluate(() => window.__jwLab.find('water', 14));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { x: 4500, blink: 0 }); }, i);
  await waitFor(p, "window.__jwLab.state().st === 'down'", 6000); await sleep(140); await shot(p, 'night-hit-water-or-edge.png');
  // THE BLACKOUT coming up behind a kid who stops: seen climbing in the lanes behind him
  await L("window.__jwLab.restart('solo', 'look3'); window.__jwLab.hop('u')"); await sleep(9000); await shot(p, 'z8-turned-blackout.png');
  ok((await st(p)).wall > -4 && !(await st(p)).over, 'THE BLACKOUT comes up behind a kid who stops (seen before it catches them)');
  await L("window.__jwLab.restart('solo')");
}

// ---- H3's shots (ZOOM 8 STRAIGHT — the defaults): the water + the logs (each its own length, half-sunk, the waterline), a car from
// behind (BOTH tail lights + their two thin streaks), THE BOX TRUCK
async function looksH3(p) {
  if (!OUT) return;
  const L = js => p.evaluate(js);
  await L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true)"); await sleep(400);
  // the water: the bank before the first stretch with 2+ water lanes (the logs of several lengths in one picture)
  let i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 14; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l + 1).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 14); });
  await p.evaluate(l => window.__jwLab.warp(l - 1, { blink: 9000 }), i); await sleep(1100); await shot(p, 'h3-water-logs.png');
  await sleep(1600); await shot(p, 'h3-water-logs-b.png');
  i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 205; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l + 1).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 205); });
  await p.evaluate(l => window.__jwLab.warp(l - 1, { blink: 9000 }), i); await sleep(1100); await shot(p, 'h3-water-logs-lane200.png');
  // a car from behind: a kid on the grass under a road lane, a 1-cell car just past him — its tail (both lights, both streaks) beside him
  const carLane = len => p.evaluate(n => { const J = window.__jwLab; for (let l = 20; l < 400; l++) if (J.lane(l).type === 'road' && J.lane(l - 1).type === 'grass' && J.items(l).items.some(q => Math.round(q.len) === n)) return l; return -1; }, len);
  const behind = async (lane, len, name) => {
    await p.evaluate(l => window.__jwLab.warp(l - 1, { blink: 9000 }), lane);
    await waitFor(p, `(() => { const q = window.__jwLab.items(${lane}); return q.items.some(c => Math.round(c.len) === ${len} && (q.dir > 0 ? c.left > 4.6 && c.left < 5.6 : c.left + c.len < 4.4 && c.left + c.len > 3.4)); })()`, 20000);
    await shot(p, name);
  };
  await L("window.__jwLab.restart('solo', 'look3')");   // (a new run: the wall follows the BEST lane — a warp back down would be in the dark)
  i = await carLane(1); ok(i > 0, `a road lane with a car over a grass lane (lane ${i})`); await behind(i, 1, 'h3-car-behind.png');
  await L("window.__jwLab.restart('solo', 'look3')");
  i = await carLane(3); ok(i > 0, `a road lane with THE BOX TRUCK over a grass lane (lane ${i})`); await behind(i, 3, 'h3-truck.png');
  await L("window.__jwLab.restart('solo')");
}

try {
  if (argv.includes('--h3')) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksH3(o.p); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
  if (LOOK) { const o = await open(390, 844, 3, '&preview=1&seed=look3&fps=1'); await up(o.p); await sleep(600); await looks(o.p); await looksH3(o.p); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
  // ---- 1. THE LAB IS OPEN (H2B): a stranger — a fresh browser, a plain link — gets the lab; ZERO server calls
  {
    const { p, errs, reqs, close } = await open(390, 844, 2, '&debug=1');
    ok(await up(p), 'a STRANGER gets THE LAB (a fresh browser, no profile, no key): the night look opens');
    ok(await p.evaluate(() => !document.querySelector('.jw-deny') && !!document.querySelector('.jw-stage canvas.jw-canvas')), '… no door, no "for the owner"');
    await touch(p, [[195, 500]]); await sleep(350);
    ok((await st(p)).y === 1, '… and it plays: a tap hops');
    await sleep(1500);
    const own = new URL(BASE).host, okHost = u => { try { const h = new URL(u).host; return h === own || h === 'cdn.jsdelivr.net' || h === 'fonts.googleapis.com' || h === 'fonts.gstatic.com'; } catch { return /^(data|blob):/.test(u); } };
    const calls = reqs.filter(u => /\/api\/|firebase|identitytoolkit|securetoken|googleapis\.com\/(?!css)/i.test(u)), away = reqs.filter(u => !okHost(u));
    ok(calls.length === 0, `ZERO server calls: no /api, no Firebase, no sign-in${calls.length ? ` — ${calls.slice(0, 3).join(' · ')}` : ` (${reqs.length} requests, all files)`}`);
    ok(away.length === 0, `… every request = the page's own files, three.js (its CDN) or the fonts${away.length ? ` — ${away.slice(0, 3).join(' · ')}` : ''}`);
    ok(await p.evaluate(() => !/debug/.test(location.search) && !document.body.classList.contains('rd-owner')), '… a &debug=1 link is dropped from the address (the shared audio engine never reports from here)');
    ok(await p.evaluate(() => document.querySelector('meta[name=robots]').content === 'noindex, nofollow'), 'noindex, nofollow');
    ok(await p.evaluate(() => ['SOLO', 'MATCH', 'DAILY'].every(t => [...document.querySelectorAll('.jw-tab')].some(b => b.textContent === t)) && !!document.querySelector('.jw-snd') && document.querySelectorAll('.jw-w').length === 3 && document.querySelectorAll('.jw-ang').length === 2 && !!document.querySelector('.jw-new:not(.jw-snd)')), 'everything on it stays: SOLO · MATCH · DAILY, ZOOM, ANGLE, SOUNDS, NEW SEED');
    ok(!errs.length, `no page error${errs.length ? `: ${errs[0]}` : ''}`);
    await shot(p, 'open-390x844.png');
    ok(/localhost|127\.0\.0\.1/.test(await p.evaluate(() => location.hostname)), 'the test runs on a local host');
    await close();
  }
  // ---- 2. THE NIGHT LOOK (the local preview)
  const { p, errs, reqs, close } = await open(390, 844, 3, '&preview=1&seed=labseed1&fps=1');
  ok(await up(p), 'THE NIGHT LOOK opens (three.js 0.160 from the import map) + Kenney\'s models arrive');
  await sleep(700);
  let s = await st(p);
  ok(s.mode === 'solo' && s.seed === 'labseed1' && s.y === 0, `a solo run on its seed, the kid on lane 0 (${JSON.stringify({ mode: s.mode, seed: s.seed })})`);
  ok(s.gray === false && s.info.look === 'night' && !reqs.some(u => /graybox\.js/.test(u)), 'the night look — no graybox (its file never fetched)');
  ok(reqs.filter(u => /assets\/jaywalk\/models\/[\w-]+\.glb/.test(u)).length === 10 && !reqs.some(u => /crate-box|traffic-barrier/.test(u)) && reqs.some(u => /assets\/jaywalk\/skyline-night\.webp/.test(u)), 'the 10 Kenney models the scene draws (no crate, no jersey barrier — H2B) + the night skyline loaded (only the current look\'s picture)');
  ok(s.info.calls >= 14 && s.info.calls <= 48 && s.info.tris > 4000, `the scene draws: ${s.info.calls} draw calls, ${s.info.tris} triangles (everything that repeats is instanced)`);
  ok(s.kidY >= 0.6 && s.kidY <= 0.65, `THE CAMERA: the kid sits ${(s.kidY * 100).toFixed(1)} % down the screen (60–65 %)`);
  ok(Math.abs(s.info.fov - 54.4) < 0.6, `fov ${s.info.fov.toFixed(1)} at 390 × 844`);
  ok(await p.evaluate(() => { const a = document.querySelector('.jw-skyline').getBoundingClientRect(), z = document.querySelector('.jw-blackout').getBoundingClientRect(), f = a.height / innerHeight; return a.top === 0 && f >= 0.215 && f <= 0.245 && z.bottom >= innerHeight - 1 && !document.querySelector('.jw-sky'); }), 'THE SKYLINE BAND: the top 22–24 % of the screen; the bottom always fades to black');
  ok(await p.evaluate(() => { const i = document.querySelector('.jw-skyline-img').getBoundingClientRect(); return i.width >= innerWidth * 1.1 && document.querySelectorAll('.jw-sky-l').length >= 6 && document.querySelectorAll('.jw-sky-n').length >= 3; }), '… the picture covers the band with room to slide; the aviation lights + the neon blocks are there (the night life)');
  ok(await p.evaluate(() => { const e = document.querySelector('.jw-lanes'), c = getComputedStyle(e); return e.textContent === '0' && e.getBoundingClientRect().height >= 56 && /rgb/.test(c.textShadow) && !/Orbitron/.test(c.fontFamily.split(',')[0]); }), 'THE LANE COUNT: big neon numerals at the top (the numbers\' font — never the heavy block 0)');
  // THE CAMERA (H2B — camera.js; H3: the defaults ZOOM 8 + ANGLE STRAIGHT — the owner's pick so far); each zoom + both angles render; the kid's height per zoom
  let c = await camOf(p);
  ok(s.zoom === 8 && s.angle === 'straight' && s.info.zoom === 8 && Math.abs(c.yaw) < 0.002, `ZOOM 8 + ANGLE STRAIGHT by default (H3 — the turn: ${(c.yaw * 180 / Math.PI).toFixed(1)}°)`);
  ok(Math.abs(c.across - 8) < 0.25 && Math.abs(c.slope) < 0.4, `… ${c.across.toFixed(2)} columns across at the kid's row; the lanes level (${c.slope.toFixed(2)}°)`);
  ok(c.behind >= 3 && c.behind <= 5, `… ${c.behind} lanes seen behind the kid (THE BLACKOUT is seen climbing)`);
  ok(await p.evaluate(() => !document.querySelector('.jw-w[data-cols]') && document.querySelectorAll('.jw-w[data-zoom]').length === 3 && document.querySelectorAll('.jw-ang').length === 2 && document.querySelector('.jw-w[data-zoom="8"]').classList.contains('is-on') && document.querySelector('.jw-ang[data-angle="straight"]').classList.contains('is-on')), 'the lab: ZOOM 7 · 8 · 9 + ANGLE STRAIGHT · TURNED (the WIDTH switch is retired)');
  const kidAt = {};
  let r;
  for (const z of [7, 9, 8]) {
    r = await tapEl(p, `.jw-w[data-zoom="${z}"]`); await sleep(1000); s = await st(p); c = await camOf(p);
    kidAt[z] = c.kidPx;
    ok(s.zoom === z && s.info.zoom === z && s.hops === 0 && r[2] >= 44 && r[3] >= 44, `ZOOM ${z}: the switch acts on its own press (no hop), ${r[2].toFixed(0)} × ${r[3].toFixed(0)} pt`);
    ok(Math.abs(c.across - z) < 0.25 && c.kidY >= 0.6 && c.kidY <= 0.65 && c.behind >= 3 && c.behind <= 5 && s.info.calls >= 14, `… it renders: ${c.across.toFixed(2)} columns across, the kid ${c.kidPx.toFixed(1)} pt tall, ${(c.kidY * 100).toFixed(1)} % down, ${c.behind} lanes behind him`);
  }
  ok(kidAt[7] > kidAt[8] * 1.08 && kidAt[8] > kidAt[9] * 1.08 && kidAt[9] >= 32, `THE KID's height at 390 × 844: ${kidAt[7].toFixed(1)} pt at ZOOM 7 · ${kidAt[8].toFixed(1)} pt at ZOOM 8 · ${kidAt[9].toFixed(1)} pt at ZOOM 9`);
  console.log('KID', JSON.stringify({ z7: +kidAt[7].toFixed(1), z8: +kidAt[8].toFixed(1), z9: +kidAt[9].toFixed(1) }));
  ok(await p.evaluate(() => localStorage.getItem('jw:lab:zoom') === '8'), '… the zoom is remembered on this phone');
  r = await tapEl(p, '.jw-ang[data-angle="turned"]'); await sleep(1000); s = await st(p); c = await camOf(p);
  ok(s.angle === 'turned' && Math.abs(c.yaw - 12 * Math.PI / 180) < 0.002 && c.slope > 5 && c.slope < 15 && s.hops === 0 && await p.evaluate(() => localStorage.getItem('jw:lab:angle') === 'turned'), `ANGLE TURNED is one switch away: the lanes run ${c.slope.toFixed(1)}° off level (a gentle diagonal); remembered`);
  r = await tapEl(p, '.jw-ang[data-angle="straight"]'); await sleep(1000); s = await st(p); c = await camOf(p);
  ok(s.angle === 'straight' && Math.abs(c.yaw) < 0.002 && Math.abs(c.slope) < 0.4 && s.hops === 0 && r[2] >= 44 && r[3] >= 44, `ANGLE STRAIGHT: the lanes level (${c.slope.toFixed(2)}°), its own press (${r[2].toFixed(0)} × ${r[3].toFixed(0)} pt)`);
  ok(Math.abs(c.across - 8) < 0.25 && c.kidY >= 0.6 && c.kidY <= 0.65 && await p.evaluate(() => localStorage.getItem('jw:lab:angle') === 'straight'), `… ${c.across.toFixed(2)} columns across, the kid ${(c.kidY * 100).toFixed(1)} % down; remembered`);
  await tapEl(p, '.jw-ang[data-angle="turned"]'); await sleep(1000); s = await st(p); c = await camOf(p);
  ok(s.angle === 'turned' && c.slope > 5 && await p.evaluate(() => document.querySelector('.jw-ang[data-angle="turned"]').classList.contains('is-on') && localStorage.getItem('jw:lab:angle') === 'turned'), 'ANGLE TURNED again');
  ok(await p.evaluate(() => { const hud = document.querySelector('.jw-sub').getBoundingClientRect(), bar = document.querySelector('.jw-bar2').getBoundingClientRect(), k = window.__jwLab.state(); return hud.bottom < innerHeight * 0.3 && bar.top > innerHeight * 0.85 && k.kidY * innerHeight - k.kidPx > hud.bottom + 80 && k.kidY * innerHeight < bar.top - 60; }), 'the lane count + the HUD never cover the play (the count over the skyline, the lab\'s rows under the lanes behind the kid)');
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
  ok(await waitFor(p, '!!window.__jwLab.sfx', 8000), 'the sounds are on the SHARED audio engine (installed when the lab mounts)');
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
  // ---- 4c. THE SIDEWAYS FOLLOW (H2B): the kid on screen at both play edges, never more than ~1 column past the play area; a log ride
  for (const [name, x, sign] of [['RIGHT', 8500, 1], ['LEFT', 500, -1]]) {
    await p.evaluate(xx => { window.__jwLab.restart('solo', 'labseed1'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.warp(2, { x: xx }); }, x);
    await sleep(900); s = await st(p);
    const past = await p.evaluate(sg => window.__jwLab.project(sg > 0 ? 10 : -1, 2.5)[0], sign);
    ok(Math.abs(s.info.camX - sign * 1.5) < 0.02 && s.kidX > 0.06 && s.kidX < 0.94 && (sign > 0 ? s.kidX > 0.7 : s.kidX < 0.3), `the follow at the ${name} play edge: the kid on screen (${(s.kidX * 100).toFixed(0)} % across), the camera stops ${s.info.camX.toFixed(2)} columns over`);
    ok(Math.abs(past - (sign > 0 ? 1 : 0)) < 0.03, `… never more than ~1 column past the play area (the outer edge of the column beyond it sits at ${(past * 100).toFixed(0)} % of the width)`);
    await p.evaluate(() => window.__jwLab.setCamera(8, 'turned', true)); await sleep(500); s = await st(p);
    ok(s.kidX > 0.06 && s.kidX < 0.94 && s.kidY > 0.5 && s.kidY < 0.72, `… TURNED too: the kid on screen (${(s.kidX * 100).toFixed(0)} % across, ${(s.kidY * 100).toFixed(0)} % down)`);
  }
  for (const z of [7, 9]) {
    await p.evaluate(zz => { window.__jwLab.setCamera(zz, 'turned', true); window.__jwLab.warp(2, { x: 8500 }); }, z); await sleep(900); s = await st(p);
    ok(Math.abs(s.info.camX - (5.5 - z / 2)) < 0.02 && s.kidX > 0.06 && s.kidX < 0.94, `ZOOM ${z}: the follow stops ${s.info.camX.toFixed(2)} columns over, the kid on screen at the edge (${(s.kidX * 100).toFixed(0)} % across)`);
  }
  {
    await p.evaluate(() => { window.__jwLab.restart('solo', 'labseed1'); window.__jwLab.setCamera(8, 'turned', true); });
    const wl = await p.evaluate(() => window.__jwLab.find('water', 12));
    await p.evaluate(l => window.__jwLab.warp(l - 1), wl);
    await waitFor(p, `window.__jwLab.logAt(${wl}) > 0`, 15000);
    await p.evaluate(l => window.__jwLab.warp(l, { x: window.__jwLab.logAt(l), blink: 0 }), wl); await sleep(600);
    const ride = await p.evaluate(() => new Promise(res => { const out = []; const f = () => { const q = window.__jwLab.state(); out.push([q.x, q.info.camX, q.kidX, q.st === 'idle' ? 1 : 0]); if (out.length < 90) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }));
    const on = ride.filter(q => q[3] && Math.abs(q[1]) < 1.45), xs = on.map(q => q[2]), moved = Math.abs(ride[ride.length - 1][0] - ride[0][0]);
    let step = 0; for (let k = 1; k < on.length; k++) step = Math.max(step, Math.abs(xs[k] - xs[k - 1]));
    ok(moved > 0.4 && ride.every(q => q[2] > 0.05 && q[2] < 0.95), `a LOG RIDE: carried ${moved.toFixed(2)} columns in ${ride.length} frames, the kid on screen all the way`);
    ok(on.length < 20 || (Math.max(...xs) - Math.min(...xs) < 0.06 && step < 0.008), `… the camera rides with him: no lag, no jitter (his place on the screen moved ${on.length ? ((Math.max(...xs) - Math.min(...xs)) * 100).toFixed(1) : '—'} % of the width over ${on.length} frames, ${(step * 100).toFixed(2)} % at most in one)`);
  }
  await p.evaluate(() => { window.__jwLab.setCamera(8, 'turned', true); window.__jwLab.restart('solo'); });
  // ---- 5. the looks (shots only)
  await looks(p);
  await close();
  // ---- 5b. the frame rate at EACH TIER: 390 × 844 @3, 1× + 4× CPU, the bot playing
  if (PERF) {
    const rows2 = [];
    for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=turned`);
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
    // THE SHOT's OWN HITCH (H2's shots read "49–54 fps · worst 217–250" at tier 2): a quiet run has no such frame — a screenshot makes one
    {
      const o = await open(390, 844, 3, '&preview=1&seed=perfseed7&tier=2&zoom=8&angle=turned');
      await up(o.p); await o.p.evaluate(() => { window.__jwLab.restart('solo', 'perfseed7'); window.__jwLab.bot(true); });
      await sleep(3000); await o.p.evaluate(() => window.__jwLab.clearFrames()); await sleep(8000);
      const quiet = Math.max(...await o.p.evaluate(() => window.__jwLab.frames()));
      await o.p.evaluate(() => window.__jwLab.clearFrames()); await o.p.screenshot(); await sleep(400);
      const shotMs = Math.max(...await o.p.evaluate(() => window.__jwLab.frames()));
      await o.p.evaluate(() => { window.__jwLab.clearFrames(); window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(40); }); await sleep(600);
      const warpMs = Math.max(...await o.p.evaluate(() => window.__jwLab.frames()));
      console.log('HITCH', JSON.stringify({ quietWorstMs: +quiet.toFixed(1), afterScreenshotMs: +shotMs.toFixed(1), afterRestartWarpMs: +warpMs.toFixed(1) }));
      ok(quiet < 34, `a quiet run at tier 2 has NO long frame (worst ${quiet.toFixed(1)} ms in 8 s) — a screenshot's own stall: ${shotMs.toFixed(0)} ms; a restart + warp: ${warpMs.toFixed(0)} ms (the H2 shots' "worst 250" were the shots')`);
      rows2.push({ hitch: { quietWorstMs: +quiet.toFixed(1), afterScreenshotMs: +shotMs.toFixed(1), afterRestartWarpMs: +warpMs.toFixed(1) } });
      await o.close();
    }
    // THE AUTOMATIC TIER STEP: nothing pinned, the frames made to slip (a heavy CPU throttle) → it must step down by itself
    {
      const o = await open(390, 844, 3, '&preview=1&seed=perfseed7&zoom=8&angle=turned');
      await up(o.p); await o.p.evaluate(() => { window.__jwLab.restart('solo', 'perfseed7'); window.__jwLab.bot(true); });
      await sleep(2500);
      const t0 = (await st(o.p)).tier;
      let rate = 0, slipped = 0;
      for (const r2 of [12, 20, 32]) {
        await o.p.evaluate(() => window.__jwLab.clearFrames()); await o.p.emulateCPUThrottling(r2); await sleep(3000);
        const fr = (await o.p.evaluate(() => window.__jwLab.frames())).sort((x, y) => x - y);
        rate = r2; slipped = fr[Math.floor(fr.length * 0.75)] || 0;
        if (slipped > 19.5 || (await st(o.p)).tier < 2) break;
      }
      const end = Date.now() + 40000;
      while (Date.now() < end && (await st(o.p)).tier > 0) await sleep(250);
      const seen = (await st(o.p)).tierPath;
      await o.p.emulateCPUThrottling(1);
      console.log('STEP', JSON.stringify({ cpu: `${rate}×`, p75Ms: +slipped.toFixed(1), tiers: seen }));
      ok(t0 === 2 && seen.length > 1 && Math.min(...seen) < 2, `THE AUTOMATIC STEP: at ${rate}× CPU the frames slip (p75 ${slipped.toFixed(1)} ms) → the tiers step by themselves: ${seen.join(' → ')}`);
      rows2.push({ step: { cpu: `${rate}×`, p75Ms: +slipped.toFixed(1), tiers: seen } });
      await o.close();
    }
    if (OUT) writeFileSync(join(OUT, 'perf.json'), JSON.stringify(rows2, null, 1));
  }
  // ---- 6. the fps readout only when asked + THE GRAYBOX behind ?gray=1 (H1's, for comparison)
  const noFps = await open(390, 844, 2, '&preview=1');
  await up(noFps.p);
  ok(!(await noFps.p.evaluate(() => !!document.querySelector('.jw-fps'))), '… and never without it');
  await noFps.close();
  {
    const g = await open(390, 844, 2, '&preview=1&gray=1&seed=labseed1&zoom=7&angle=straight');
    await waitFor(g.p, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')"); await sleep(500);
    const q = await st(g.p);
    ok(q.gray === true && !q.info.look && g.reqs.some(u => /graybox\.js/.test(u)) && !g.reqs.some(u => /night\.js|\.glb|skyline/.test(u)), '?gray=1 keeps THE GRAYBOX (H1\'s boxes — no model, no skyline fetched)');
    ok(await g.p.evaluate(() => !!document.querySelector('.jw-sky') && !document.querySelector('.jw-skyline') && !document.querySelector('.jw-snd')), '… its empty band, no SOUNDS');
    let gc = await camOf(g.p);
    ok(q.zoom === 7 && q.angle === 'straight' && Math.abs(gc.across - 7) < 0.25 && Math.abs(gc.slope) < 0.4 && gc.kidY >= 0.58 && gc.kidY <= 0.65, `… THE SAME CAMERA (?zoom=7&angle=straight): ${gc.across.toFixed(2)} columns across, level, the kid ${(gc.kidY * 100).toFixed(1)} % down`);
    await tapEl(g.p, '.jw-w[data-zoom="8"]'); await tapEl(g.p, '.jw-ang[data-angle="turned"]'); await sleep(1000); gc = await camOf(g.p);
    ok(Math.abs(gc.across - 8) < 0.25 && gc.slope > 5 && Math.abs(gc.yaw - 12 * Math.PI / 180) < 0.002, `… ZOOM 8 + TURNED on its own switches: ${gc.across.toFixed(2)} columns across, the lanes ${gc.slope.toFixed(1)}° off level`);
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
    const qc = await camOf(o.p);
    ok(q.info.w <= Math.ceil(h2 * 0.62) + 1 && q.kidY >= 0.595 && q.kidY <= 0.655 && Math.abs(qc.across - 8) < 0.25 && qc.behind >= 3, `${w2} × ${h2}: the play area ${q.info.w} wide, ${qc.across.toFixed(2)} columns across (the same on every screen), the kid at rest ${(q.kidY * 100).toFixed(0)} % down, ${q.kidPx.toFixed(0)} pt tall, ${qc.behind} lanes behind him, fov ${q.info.fov.toFixed(1)}`);
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
    ok(ws.info.look === 'night' && ws.info.calls >= 14 && ws.kidY >= 0.6 && ws.kidY <= 0.65 && ws.zoom === 8 && ws.angle === 'turned', `WebKit: the scene draws (${ws.info.calls} calls, ${ws.info.tris} tris, the kid ${ws.kidPx.toFixed(1)} pt)`);
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
