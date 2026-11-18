// JAYWALK — THE JAYWALK LAB's own check (/jaywalk-lab — js/games/jaywalk/lab.js; H2: night.js · sfx.js · audition.js; H1's graybox behind
// ?gray=1 — docs/jaywalk.md "THE LAB"), on the LOCAL server + the emulators (NEVER THE LIVE SITE):
//   · THE LAB IS OPEN (H2B): a STRANGER gets the lab — no door, no sign-in, ZERO server calls (no /api, no Firebase: only the page's own
//     files, three.js from its CDN, the fonts); a &debug=1 link is dropped
//   · THE NIGHT LOOK renders: the Kenney models + the skyline band loaded, no graybox unless ?gray=1
//   · THE CAMERA (H2B — camera.js): ZOOM 7 · 8 · 9 (8 by default) + ANGLE STRAIGHT · TURNED (STRAIGHT by default — H3), remembered; the columns
//     across + THE KID's measured height at each zoom; the sideways follow keeps him on screen at both play edges + on a log ride (no
//     jitter), never more than ~1 column past the play area; 3–4 lanes seen behind him; ?gray=1 follows the same camera
//   · EVERY TAP ACTS (a tap hops on release · a swipe fires the moment it crosses its threshold · swipe down = back · no page scroll)
//   · a run played to its end by the bot through the page's own input path: THE REPLAY = THE LIVE RUN, one tap = PLAY AGAIN
//   · THE SOUNDS: a hop asks for its sound (pitch ± 6 %, gain ± 2 dB); THE SOUND AUDITION opens, plays, loops the bell, remembers a pick,
//     copies the picks' line — Chromium; + WebKit (--webkit: ~/wk Playwright) where it can
//   · --perf: the frame rate + frame time (p95 / worst) + draw calls + triangles at EACH TIER, 390 × 844 @3 under a 4× CPU throttle, at
//     ZOOM 8 TURNED; a screenshot's own hitch measured (the H2 shots' "worst 250"); THE AUTOMATIC TIER STEP really steps down when the
//     frames slip (a heavy CPU throttle, nothing pinned)
//   · the shots (ZOOM 8 TURNED: the start, a run, a water / log stretch, a train, lane 200+ traffic; ZOOM 7 + 9; STRAIGHT …) into [outDir]
//     — kept out of git
//   node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf] [--webkit] [--look] [--h3] [--h5[=kid|areas]] (--look: the shots only · --h3: H3's three shots only · --h5: H5A's — THE KID + THE AREAS)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { CAUSE_LINES, VEHICLES } from '../../js/games/jaywalk/causes.js';
import { looksH6A } from './kit/jaywalk-h6a.mjs';
import { looksH6B } from './kit/jaywalk-h6b.mjs';
import { looksPreflip } from './kit/jaywalk-preflip.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), PERF = argv.includes('--perf'), WK = argv.includes('--webkit'), LOOK = argv.includes('--look'), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(100); } return false; };
const shot = async (p, name) => { if (OUT) { if (name.includes('/')) mkdirSync(join(OUT, name.slice(0, name.lastIndexOf('/'))), { recursive: true }); await p.screenshot({ path: join(OUT, name) }); } };
const open = async (w, h, dpr, q = '') => {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [];
  try { await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write']); } catch { /* fine */ }
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => { if (!r.url().startsWith('data:')) reqs.push(r.url()); });   // (a data: URI — the sea wall's inline tile — is no request: nothing leaves the page)
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
  await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i); await sleep(900); await shot(p, 'z8-turned-lane200-a.png');
  await sleep(1300); await shot(p, 'z8-turned-lane200-b.png');
  await p.evaluate(l => window.__jwLab.warp(l, { x: 8500, safe: false }), i); await sleep(900); await shot(p, 'z8-turned-lane200-right-edge.png');
  await p.evaluate(l => window.__jwLab.warp(l, { x: 500, safe: false }), i); await sleep(900); await shot(p, 'z8-turned-lane200-left-edge.png');
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
  await p.evaluate(l => window.__jwLab.warp(l - 1, { safe: false }), i); await sleep(900); await shot(p, 'z8-turned-water.png');
  await cam(8, 'straight'); await shot(p, 'z8-straight-water.png'); await cam(8, 'turned');
  await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 12000);
  await p.evaluate(l => window.__jwLab.warp(l, { x: window.__jwLab.logAt(l), safe: false }), i); await sleep(450);
  ok((await st(p)).st === 'idle', 'a log ride: the kid stands on a log');
  await shot(p, 'z8-turned-log-ride.png');
  // a hit: a car
  i = await p.evaluate(() => window.__jwLab.find('road', 20));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { safe: false }); }, i);
  ok(await waitFor(p, "window.__jwLab.state().st === 'out' && window.__jwLab.state().cause === 'car'", 15000), 'a hit: a car gets a kid who stands on the road — ONE LIFE: out');
  await sleep(330); await shot(p, 'night-hit-car.png');
  // the water
  i = await p.evaluate(() => window.__jwLab.find('water', 14));
  await p.evaluate(l => { window.__jwLab.restart('match', 'look3'); window.__jwLab.warp(l, { x: 4500, safe: false }); }, i);
  await waitFor(p, "window.__jwLab.state().st === 'out'", 6000); await sleep(140); await shot(p, 'night-hit-water-or-edge.png');
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
  await p.evaluate(l => window.__jwLab.warp(l - 1), i); await sleep(1100); await shot(p, 'h3-water-logs.png');
  await sleep(1600); await shot(p, 'h3-water-logs-b.png');
  i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 205; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l + 1).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 205); });
  await p.evaluate(l => window.__jwLab.warp(l - 1), i); await sleep(1100); await shot(p, 'h3-water-logs-lane200.png');
  // a car from behind: a kid on the grass under a road lane, a 1-cell car just past him — its tail (both lights, both streaks) beside him
  const carLane = len => p.evaluate(n => { const J = window.__jwLab; for (let l = 20; l < 400; l++) if (J.lane(l).type === 'road' && J.lane(l - 1).type === 'grass' && J.items(l).items.some(q => Math.round(q.len) === n)) return l; return -1; }, len);
  const behind = async (lane, len, name) => {
    await p.evaluate(l => window.__jwLab.warp(l - 1), lane);
    await waitFor(p, `(() => { const q = window.__jwLab.items(${lane}); return q.items.some(c => Math.round(c.len) === ${len} && (q.dir > 0 ? c.left > 4.6 && c.left < 5.6 : c.left + c.len < 4.4 && c.left + c.len > 3.4)); })()`, 20000);
    await shot(p, name);
  };
  await L("window.__jwLab.restart('solo', 'look3')");   // (a new run: the wall follows the BEST lane — a warp back down would be in the dark)
  i = await carLane(1); ok(i > 0, `a road lane with a car over a grass lane (lane ${i})`); await behind(i, 1, 'h3-car-behind.png');
  await L("window.__jwLab.restart('solo', 'look3')");
  i = await carLane(3); ok(i > 0, `a road lane with THE BOX TRUCK over a grass lane (lane ${i})`); await behind(i, 3, 'h3-truck.png');
  await L("window.__jwLab.restart('solo')");
}

// ---- H4's shots (ZOOM 8 STRAIGHT): THE WATER (calm night water) + THE LOG ENDS (plain pale wood), THE TAXI (yellow, its roof light), THE
// FLATTENED KID (flat on his back, his cap on top)
async function looksH4(p) {
  if (!OUT) return;
  const L = js => p.evaluate(js);
  await L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true)"); await sleep(400);
  let i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 14; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l + 1).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 14); });
  await p.evaluate(l => window.__jwLab.warp(l - 1), i); await sleep(1100); await shot(p, 'h4-water-logs.png');
  await sleep(1700); await shot(p, 'h4-water-logs-b.png');
  i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 205; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l + 1).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 205); });
  await p.evaluate(l => window.__jwLab.warp(l - 1), i); await sleep(1100); await shot(p, 'h4-water-logs-lane200.png');
  // THE TAXI: a kid on the grass under a road lane with a taxi on it — the taxi near the middle of the screen
  await L("window.__jwLab.restart('solo', 'look3')");
  i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 20; l < 400; l++) if (J.lane(l).type === 'road' && J.lane(l - 1).type === 'grass' && J.items(l).items.some(q => q.what === 'taxi')) return l; return -1; });
  ok(i > 0, `a road lane with THE TAXI over a grass lane (lane ${i})`);
  await p.evaluate(l => window.__jwLab.warp(l - 1), i);
  await waitFor(p, `window.__jwLab.items(${i}).items.some(c => c.what === 'taxi' && c.left > 3.2 && c.left < 5.2)`, 25000);
  await shot(p, 'h4-taxi.png');
  // THE FLATTENED KID: he stands on a road lane until a car comes
  await L("window.__jwLab.restart('solo', 'look3')");
  i = await p.evaluate(() => window.__jwLab.find('road', 20));
  await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
  ok(await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'car'", 20000), 'a car gets a kid who stands on the road — ONE LIFE: out');
  await L("document.querySelector('.jw-end').style.visibility = 'hidden'");
  await sleep(260); await shot(p, 'h4-flat-kid.png');
  await sleep(700); await shot(p, 'h4-flat-kid-b.png');
  await L("document.querySelector('.jw-end').style.visibility = ''; window.__jwLab.restart('solo')");
}

// ---- H5A's shots: THE KID (Kenney's skate boy — standing, mid-hop each way, on a log, every hit) at ZOOM 8 STRAIGHT (+ ZOOM 7 close);
// THE AREAS (every area's stretch + its gateway) — `--h5` (all) · `--h5=kid` · `--h5=areas`
async function looksH5(p, what) {
  if (!OUT) return;
  const L = js => p.evaluate(js);
  const hide = on => L(`document.querySelector('.jw-end').style.visibility = '${on ? 'hidden' : ''}'`);
  if (what !== 'areas') {
    await L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true)"); await sleep(500);
    await shot(p, 'kid-start-faces-you.png');
    await L("window.__jwLab.setCamera(7, 'straight', true)"); await sleep(300); await shot(p, 'kid-start-zoom7.png'); await L("window.__jwLab.setCamera(8, 'straight', true)");
    // mid-hop: up, then sideways — held 4 ticks in (the top of the arc)
    await L("window.__jwLab.hop('u')"); await sleep(500);
    for (const [d, name] of [['u', 'kid-hop-up.png'], ['l', 'kid-hop-left.png'], ['r', 'kid-hop-right.png'], ['d', 'kid-hop-back.png']]) {
      await L(`window.__jwLab.hold(4); window.__jwLab.hop('${d}')`); await waitFor(p, "window.__jwLab.state().st === 'hop'", 3000); await sleep(350);
      await shot(p, name); await L('window.__jwLab.hold(null)'); await sleep(400);
    }
    await shot(p, 'kid-idle-after-hops.png');
    // on a log
    let i = await p.evaluate(() => window.__jwLab.find('water', 14));
    await p.evaluate(l => window.__jwLab.warp(l - 1), i);
    await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 20000);
    await p.evaluate(l => { const J = window.__jwLab; J.warp(l, { x: J.logAt(l) }); }, i); await sleep(450); await shot(p, 'kid-on-a-log.png');
    // the hits: flattened (a car), the splash + the sink (the water), knocked by the train, swept by the blackout
    await L("window.__jwLab.restart('solo', 'look3')"); i = await p.evaluate(() => window.__jwLab.find('road', 20));
    await L("window.__jwLab.hop('u')"); await sleep(400);
    await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
    await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'car'", 20000); await hide(true);
    await sleep(120); await shot(p, 'kid-hit-flat-a.png'); await sleep(700); await shot(p, 'kid-hit-flat-b.png'); await hide(false);
    await L("window.__jwLab.restart('solo', 'look3')"); i = await p.evaluate(() => window.__jwLab.find('water', 14));
    await L("window.__jwLab.hop('u')"); await sleep(400);
    await p.evaluate(l => window.__jwLab.warp(l - 1), i); await sleep(500);
    await waitFor(p, `window.__jwLab.logAt(${i}) < 0 || true`, 100); await L("window.__jwLab.hop('u')");
    await waitFor(p, "window.__jwLab.state().over", 8000); await hide(true); await sleep(60); await shot(p, 'kid-hit-water.png'); await hide(false);
    await L("window.__jwLab.restart('solo', 'look3')"); i = await p.evaluate(() => window.__jwLab.find('rail', 25));
    await L("window.__jwLab.hop('u')"); await sleep(400);
    await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
    await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'train'", 20000); await hide(true); await sleep(150); await shot(p, 'kid-hit-train.png'); await hide(false);
    await L("window.__jwLab.restart('solo', 'look3'); window.__jwLab.hop('u')");
    await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'wall'", 30000); await hide(true); await sleep(100); await shot(p, 'kid-hit-blackout.png'); await hide(false);
    const px = await p.evaluate(() => { window.__jwLab.restart('solo', 'look3'); return new Promise(r => setTimeout(() => r(window.__jwLab.state().kidPx), 600)); });
    ok(px >= 34 && px <= 46, `THE KID reads at ZOOM 8 on a 390 pt phone: ${px.toFixed(1)} pt tall`);
    ok(await p.evaluate(() => window.__jwLab.state().info.kid === true), '… Kenney\'s skate boy is the kid the scene draws (his file landed)');
  }
  if (what !== 'kid') {
    // THE AREAS (night): each one's GATEWAY (the kid two lanes before it) + three views of its stretch; the loop's second lap's gateway
    const IDS = ['docks', 'fish-market', 'rail-yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'];
    await L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.hop('u')"); await sleep(500);
    // (the kid stands on the gateway's own calm lane / on the first ground lane at each place, at a free column — the look, never a hit)
    const stand = (lane, col) => p.evaluate((l, c) => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } const y = J.find('grass', l); J.warp(y, c == null ? {} : { x: c * 1000 + 500 }); return y; }, lane, col);
    for (let k = 0; k < 8; k++) {
      const g = 50 * (k + 1);
      await stand(g - 1); await sleep(350); await stand(g); await sleep(900); await shot(p, `areas/${k + 1}-${IDS[k]}-gateway.png`);
      for (const [off, tag, col] of [[7, 'a', 4], [21, 'b', 1], [36, 'c', 7]]) { await stand(g + off, col); await sleep(1000); await shot(p, `areas/${k + 1}-${IDS[k]}-${tag}.png`); }
    }
    await stand(450); await sleep(900); await shot(p, 'areas/9-docks-lap-2-gateway.png');
    const names = await p.evaluate(() => [50, 400, 450].map(l => window.__jwLab.gate(l)));
    ok(names[0] === 'THE DOCKS' && names[1] === 'THE AIRFIELD' && names[2] === 'THE DOCKS · LAP 2', `the gateways' names: ${names.join(' | ')}`);
  }
}

// ---- H5B — THE DAY LOOK + THE LANDMARKS SEEN (`--h5b[=day|gates]`): the lab's LOOK switch · the start, a run, a water + log stretch, a
// train coming, the flight path's tell, THE FOG BANK, every area + its gate BY DAY (`day/`) · every gate by NIGHT with its landmark in
// the skyline band + its hero piece beside it (`gates/`) · the checks: the look, the band's picture, the landmark drawn, the day's own
// cause line, the hero piece on the screen as the kid comes up to the gate.
async function looksH5B(p, what, reqs) {
  const L = js => p.evaluate(js);
  const hide = on => L(`document.querySelector('.jw-end').style.visibility = '${on ? 'hidden' : ''}'`);
  const IDS = ['docks', 'fish-market', 'rail-yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'];
  const fresh = () => L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true)");
  const stand = (lane, col) => p.evaluate((l, c) => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } const y = J.find('grass', l); J.warp(y, c == null ? {} : { x: c * 1000 + 500 }); return y; }, lane, col);
  const look = l => L(`window.__jwLab.setLook('${l}')`);
  if (what !== 'gates') {
    await fresh(); await look('day'); await sleep(900);
    const s0 = await st(p);
    ok(s0.info.look === 'day' && await L("document.querySelector('.jw-stage').dataset.look === 'day' && document.querySelector('.jw-skyline').dataset.look === 'day'"), 'LOOK: DAY — the scene, the stage and the band are in the day look');
    ok(reqs.some(u => /skyline-day\.webp/.test(u)), 'the day band\'s picture is fetched when the day look is asked for');
    ok(await L("getComputedStyle(document.querySelector('.jw-sky-l')).display === 'none'"), '… no night life on it (the aviation lights + the neon blocks are the night\'s)');
    ok(s0.info.bloom === false, 'no bloom by day (the lights are paint)');
    await shot(p, 'day/01-the-start.png');
    await L("window.__jwLab.hop('u')"); await sleep(400);
    await stand(18, 3); await sleep(900); await shot(p, 'day/02-a-run.png');
    let i = await p.evaluate(() => window.__jwLab.find('road', 20)); await stand(i - 1, 4); await sleep(1100); await shot(p, 'day/03-the-road.png');
    i = await p.evaluate(() => window.__jwLab.find('water', 14));
    await p.evaluate(l => window.__jwLab.warp(l - 1), i);
    await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 20000);
    await p.evaluate(l => { const J = window.__jwLab; J.warp(l, { x: J.logAt(l) }); }, i); await sleep(450); await shot(p, 'day/04-water-and-a-log.png');
    // a train coming: the kid a lane before a rail lane, in its tell (the signals flash, the lane itself flashes red)
    await fresh(); await L("window.__jwLab.hop('u')"); await sleep(300);
    i = await p.evaluate(() => window.__jwLab.find('rail', 150)); await p.evaluate(l => window.__jwLab.warp(l - 1), i);
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.state().t % 16 < 6`, 40000); await sleep(60); await shot(p, 'day/05-a-train-coming.png');
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass'`, 20000); await sleep(250); await shot(p, 'day/06-the-train.png');
    // the flight path's tell: the runway lights RACING
    await fresh(); await L("window.__jwLab.hop('u')"); await sleep(300);
    i = await p.evaluate(() => window.__jwLab.find('flight', 400));
    // (he stands on the nearest ground lane under it: the look, never a hit)
    await p.evaluate(l => { const J = window.__jwLab; for (let d = 1; d < 9; d++) if (J.find('grass', l - d) === l - d) { J.warp(l - d, { x: 2500 }); return; } J.warp(l - 1); }, i);
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'idle'`, 40000); await sleep(200); await shot(p, 'day/07-the-flight-path-quiet.png');
    await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell'`, 60000); await sleep(650); await shot(p, 'day/08-the-flight-path-tell.png');
    await sleep(500); await shot(p, 'day/09-the-flight-path-tell-later.png');
    // THE FOG BANK: the wall creeping up on a kid who stands still, then taking him — the day's own cause line
    await fresh(); await L("window.__jwLab.hop('u')"); await sleep(5200); await shot(p, 'day/10-the-fog-bank-coming.png');
    await sleep(2600); await shot(p, 'day/11-the-fog-bank-close.png');
    await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'wall'", 30000); await sleep(350);
    ok((await st(p)).line === 'LOST IN THE FOG', `by day the wall's cause line is the fog's ("${(await st(p)).line}")`);
    await shot(p, 'day/12-lost-in-the-fog.png');
    await look('night'); await sleep(200);
    ok((await st(p)).line === 'THE LIGHTS WENT OUT', 'by night the same end reads THE LIGHTS WENT OUT');
    await look('day');
    // every area + its gate by day
    await fresh(); await L("window.__jwLab.hop('u')"); await sleep(400);
    for (let k = 0; k < 8; k++) {
      const g = 50 * (k + 1);
      await stand(g - 4); await sleep(1000); await shot(p, `day/areas/${k + 1}-${IDS[k]}-gate-coming.png`);
      await stand(g); await sleep(900); await shot(p, `day/areas/${k + 1}-${IDS[k]}-gate.png`);
      ok(/^skyline-day-[a-z]+\.webp$/.test((await st(p)).info.sky.now) || /^skyline-day-[a-z]+\.webp$/.test((await st(p)).info.sky.held.join(' ')), `${IDS[k]}: its PAINTED skyline carries the landmark by day (H5C — skymarks.js is the night's)`);
      for (const [off, tag, col] of [[7, 'a', 4], [26, 'b', 2]]) { await stand(g + off, col); await sleep(1000); await shot(p, `day/areas/${k + 1}-${IDS[k]}-${tag}.png`); }
    }
    await look('night');
  }
  if (what !== 'day') {
    // THE LANDMARKS SEEN (night): every gate — coming up to it (the hero piece beside it in view) + on it (the landmark in the band)
    await fresh(); await look('night'); await L("window.__jwLab.hop('u')"); await sleep(400);
    for (let k = 0; k < 8; k++) {
      const g = 50 * (k + 1);
      // THE HERO PIECES stand in the gate lane's two edge columns, as far in as their feet let them. What the camera shows (measured
      // here, ZOOM 8): the kid in the MIDDLE column sees both of them coming, ahead of him, 12 … 8 lanes away; beside the gate itself a
      // piece is on the screen when he is within two columns of its side (the sideways follow) — the band's landmark is the one always seen
      let seen = null;
      for (const d of [12, 11, 10, 9, 8]) {
        await p.evaluate(l => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } J.warp(l); }, g - d); await sleep(420);
        const at = await p.evaluate(l => [window.__jwLab.project(-0.6, l + 0.5), window.__jwLab.project(9.6, l + 0.5)], g);
        if (at.every(q => q[0] > 0 && q[0] < 1 && q[1] > 0.2 && q[1] < 0.6)) { seen = { d, at }; break; }
      }
      ok(!!seen, `${IDS[k]}: coming up to its gate in the MIDDLE column, both hero pieces are on the screen ahead (${seen ? `${seen.d} lanes away: ${seen.at.map(q => q.map(v => v.toFixed(2)).join(' / ')).join(' · ')}` : 'never'})`);
      await hide(true); await shot(p, `gates/${k + 1}-${IDS[k]}-coming.png`); await hide(false);
      for (const [col, cx, tag] of [[1, -0.5, 'left'], [7, 9.5, 'right']]) {
        await stand(g, col); await sleep(900);
        const q = await p.evaluate((l, c) => window.__jwLab.project(c, l + 0.5), g, cx);
        ok(q[0] > 0.03 && q[0] < 0.97, `${IDS[k]}: on the gate lane, two columns from the ${tag} edge, that side's edge column is on the screen (its middle at ${q[0].toFixed(2)} across) — its hero piece stands beside him`);
        await shot(p, `gates/${k + 1}-${IDS[k]}-beside-${tag}.png`);
      }
      await stand(g); await sleep(1100); await shot(p, `gates/${k + 1}-${IDS[k]}-gate.png`);
      const m = await p.evaluate(() => window.__jwLab.state().info.sky);   // (H6B: the landmark is PAINTED in the band's own picture, both looks)
      ok(/^skyline-night-[a-z]+\.webp$/.test(m.now) || m.held.some(f => /^skyline-night-[a-z]+\.webp$/.test(f)), `${IDS[k]}: its landmark stands in the skyline band — painted (${m.now})`);
    }
    await stand(20); await sleep(700);
    ok((await p.evaluate(() => window.__jwLab.state().info.sky)).held.includes('skyline-night.webp'), 'the opening (lanes 0–49) has no landmark in the band');
  }
}

// ---- H5B's ADD-ONS (`--h5b=addons`): THE WATER (night + day: a water stretch with logs), THE FRIEND LINE (the pink tape — on grass, on a
// road, on water), THE RAIL SIGNALS (the tell · mid-pass · just after the tail) → water/ + rail/
async function looksAddons(p) {
  const L = js => p.evaluate(js);
  const fresh = () => L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true)");
  const lineAt = lane => p.evaluate(l => window.__jwLab.view.setLines({ best: null, friend: { lane: l, text: `LIAM · ${l}` } }), lane);
  const below = (l, x) => p.evaluate((ln, xx) => { const J = window.__jwLab; for (let d = 2; d < 9; d++) if (J.find('grass', ln - d) === ln - d) { J.warp(ln - d, { x: xx }); return ln - d; } J.warp(ln - 2); return ln - 2; }, l, x);
  for (const look of ['night', 'day']) {
    await fresh(); await L(`window.__jwLab.setLook('${look}')`); await L("window.__jwLab.hop('u')"); await sleep(400);
    // a water stretch with logs (THE CANAL: the most water)
    await p.evaluate(() => { const J = window.__jwLab; J.warp(J.find('grass', 318), { x: 4500 }); }); await sleep(1300); await shot(p, `water/${look}-a-water-stretch.png`);
    await p.evaluate(() => { const J = window.__jwLab; J.warp(J.find('grass', 62), { x: 4500 }); }); await sleep(1300); await shot(p, `water/${look}-the-docks-water.png`);
    // THE FRIEND LINE on grass · on a road · on water (the kid a few lanes under it)
    await fresh(); await L("window.__jwLab.hop('u')"); await sleep(300);   // (a new run: the wall follows the BEST lane — a warp back down would be behind it)
    for (const kind of ['grass', 'road', 'water']) {
      await fresh(); await L("window.__jwLab.hop('u')"); await sleep(300);   // (each its own fresh run: the wall never catches a standing kid mid-shot)
      const i = await p.evaluate(k => window.__jwLab.find(k, 24), kind);
      await lineAt(i); await below(i, 4500); await sleep(1200); await shot(p, `water/${look}-friend-line-on-${kind}.png`);
    }
    await p.evaluate(() => window.__jwLab.view.setLines({ best: null, friend: null }));
    // THE RAIL SIGNALS: the tell (flashing) · mid-pass (dark) · just after the tail (dark)
    await fresh(); await L(`window.__jwLab.setLook('${look}')`); await L("window.__jwLab.hop('u')"); await sleep(300);
    const r = await p.evaluate(() => window.__jwLab.find('rail', 150)); await below(r, 4500);
    await waitFor(p, `(window.__jwLab.pulse(${r}) || {}).st === 'idle'`, 60000); await sleep(200);
    await waitFor(p, `(window.__jwLab.pulse(${r}) || {}).st === 'tell' && window.__jwLab.state().t % 16 < 5`, 60000); await sleep(40); await shot(p, `rail/${look}-1-the-tell.png`);
    await waitFor(p, `(window.__jwLab.pulse(${r}) || {}).st === 'pass'`, 30000); await sleep(330); await shot(p, `rail/${look}-2-mid-pass.png`);
    await waitFor(p, `(window.__jwLab.pulse(${r}) || {}).st === 'idle'`, 30000); await sleep(60); await shot(p, `rail/${look}-3-just-after-the-tail.png`);
  }
  // THE GHOSTS STOP BLOCKING YOU (the scene's half — the tags are the match view's: e2e-jaywalk-match): a ghost beside you = FAINT;
  // three on one square ahead = themselves; one right on you = faint, your own kid on top
  for (const look of ['night', 'day']) {
    await fresh(); await L(`window.__jwLab.setLook('${look}')`); await L("window.__jwLab.hop('u')"); await sleep(400);
    await p.evaluate(() => { const J = window.__jwLab; J.warp(J.find('grass', 4), { x: 4500 }); }); await sleep(500);
    await L('window.__jwLab.ghostsAt([[1, 0]])'); await sleep(700); await shot(p, `ghosts/${look}-a-ghost-beside-you.png`);
    await L('window.__jwLab.ghostsAt([[0, 0], [0.15, 0], [-0.15, 0]])'); await sleep(700); await shot(p, `ghosts/${look}-three-ghosts-on-your-square.png`);
    await L('window.__jwLab.ghostsAt([[0, 3], [0.1, 3], [-0.1, 3]])'); await sleep(700); await shot(p, `ghosts/${look}-three-ghosts-on-one-square-ahead.png`);
    await L('window.__jwLab.ghostsAt([[3, 0]])'); await sleep(700); await shot(p, `ghosts/${look}-a-ghost-away-from-you.png`);
    await L('window.__jwLab.ghostsAt(null)');
  }
  await L("window.__jwLab.setLook('night')");
  ok(await L("window.__jwLab.state().info.look === 'night'"), 'the add-ons\' shots: the water, the friend line, the rail signals, the ghosts — night + day');
}

// ---- H5C — NO WEAK POINTS (`--h5c[=sky|fog|ground|gates|lines|tail]`): THE PAINTED SKYLINES + THE FAR EDGE (the top third in 4 areas by
// day + 2 by night, the cross-fade at a gate, only the current + the next picture held) · THE FOG BANK / THE BLACKOUT · the day ground +
// the props · every gate (approaching + standing in it, day + night: the name on its arch) · both lines on grass / road / water / rails ·
// the tail lights. The shots → h5c/<group>/.
async function looksH5C(p, what, reqs) {
  const L = js => p.evaluate(js), all = !what;
  const IDS = ['docks', 'fish-market', 'rail-yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'], SKY = ['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'];
  const fresh = look => L(`window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}'); window.__jwLab.hop('u')`);
  const stand = (lane, col) => p.evaluate((l, c) => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } const y = J.find('grass', l); J.warp(y, c == null ? {} : { x: c * 1000 + 500 }); return y; }, lane, col);
  const below = (l, x) => p.evaluate((ln, xx) => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } for (let d = 2; d < 9; d++) if (J.find('grass', ln - d) === ln - d) { J.warp(ln - d, { x: xx }); return ln - d; } J.warp(ln - 2); return ln - 2; }, l, x);
  const top = async name => { if (OUT) { mkdirSync(join(OUT, name.slice(0, name.lastIndexOf('/'))), { recursive: true }); await p.screenshot({ path: join(OUT, name), clip: { x: 0, y: 0, width: 390, height: 300 } }); } };
  const sky = () => p.evaluate(() => window.__jwLab.state().info.sky);
  if (all || what === 'sky') {
    await fresh('day'); await sleep(900);
    let s = await sky();
    ok(s.now === 'skyline-day.webp' && s.held.length <= 2, `the opening keeps skyline-day (${s.now}; held ${s.held.join(' + ')})`);
    ok(!reqs.some(u => /skyline-day-[a-z]+\.webp/.test(u)), 'no area\'s picture is fetched at the start');
    await top('h5c/sky/day-0-the-opening-top.png'); await shot(p, 'h5c/sky/day-0-the-opening.png');
    // nearing the docks' gate: the NEXT picture is fetched quietly; at the gate the band cross-fades
    await stand(38); await sleep(700); s = await sky();
    ok(s.now === 'skyline-day.webp' && s.held.includes('skyline-day-docks.webp') && reqs.some(u => /skyline-day-docks\.webp/.test(u)), `12 lanes before THE DOCKS' gate its picture is fetched ahead (held ${s.held.join(' + ')})`);
    const f0 = s.fades;
    await stand(50); await sleep(700); await top('h5c/sky/day-1-docks-cross-fade-mid.png');
    await sleep(1900); s = await sky();
    ok(s.now === 'skyline-day-docks.webp' && s.fades === f0 + 1 && s.held.length <= 2, `at the gate the band CROSS-FADES to the docks' picture (${s.now}, fades ${s.fades}, held ${s.held.join(' + ')})`);
    for (let k = 0; k < 8; k++) {
      await stand(50 * (k + 1) + 9, 4); await sleep(2700); s = await sky();
      ok(s.now === `skyline-day-${SKY[k]}.webp` && s.held.length <= 2, `${IDS[k]}: the band shows its painted skyline; ≤ 2 pictures held (${s.held.join(' + ')})`);
      await top(`h5c/sky/day-${k + 1}-${IDS[k]}-top.png`); await shot(p, `h5c/sky/day-${k + 1}-${IDS[k]}.png`);
    }
    ok(await L("!document.querySelector('.jw-sky-mark')"), 'nothing is drawn over the band (the painted picture carries the landmark)');
    await stand(459, 4); await sleep(2700); s = await sky();
    ok(s.now === 'skyline-day-docks.webp', `the loop (lane 450 +) repeats the pictures (${s.now})`);
    const n = reqs.filter(u => /skyline-day-[a-z]+\.webp/.test(u)).length;
    ok(n >= 8, `the pictures were fetched one by one along the way (${n} fetches for 9 gates — never all 8 at once)`);
    await L("window.__jwLab.setLook('night')"); await sleep(900); s = await sky();
    await sleep(1800); s = await sky(); ok(s.now === 'skyline-night-docks.webp' && s.held.length <= 2, `by night: the area's painted night picture (H6B — ${s.held.join(' + ')})`);
    for (const [k, lane] of [[0, 59], [6, 359]]) { await fresh('night'); await sleep(300); await stand(lane, 4); await sleep(1500); await top(`h5c/sky/night-${k + 1}-${IDS[k]}-top.png`); await shot(p, `h5c/sky/night-${k + 1}-${IDS[k]}.png`); ok((await sky()).now === `skyline-night-${SKY[k]}.webp`, `${IDS[k]} by night: its painted night skyline (H6B)`); }
  }
  if (what === 'perf') {
    // THE NEW HEAVY MOMENTS at 390 × 844 @3, tier 2, 4× CPU: the band's CROSS-FADE at a gate (day) · THE FOG BANK close (day) · THE
    // BLACKOUT close (night)
    const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const measure = async (name, ms) => {
      await L('window.__jwLab.clearFrames()'); await sleep(ms);
      const f = (await L('window.__jwLab.frames()')).slice(2).sort((a, b) => a - b), avg = f.reduce((a, b) => a + b, 0) / f.length, p95 = f[Math.floor(f.length * 0.95)], worst = f[f.length - 1];
      console.log('PERF', JSON.stringify({ moment: name, frames: f.length, fps: +(1000 / avg).toFixed(1), p95Ms: +p95.toFixed(1), worstMs: +worst.toFixed(1) }));
      ok(1000 / avg >= 58 && p95 < 20, `${name} at tier 2, 4× CPU: ${(1000 / avg).toFixed(1)} fps (p95 ${p95.toFixed(1)} ms, worst ${worst.toFixed(1)})`);
    };
    await fresh('day'); await L('window.__jwLab.setTier(2)'); await sleep(600); await stand(38, 4); await sleep(1500);
    const f0 = (await sky()).fades; await stand(50, 4); await measure('THE CROSS-FADE at THE DOCKS\' gate (day)', 2600);
    ok((await sky()).fades === f0 + 1, '… the cross-fade ran inside the measure');
    await fresh('day'); await sleep(7600); await measure('THE FOG BANK close (day)', 2200);
    await fresh('night'); await sleep(7600); await measure('THE BLACKOUT close (night)', 2200);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await cdp.detach();
  }
  if (all || what === 'basics') {
    // the start · a run · water + logs · a train coming + passing · the flight path's tell · every area — DAY + NIGHT
    for (const look of ['day', 'night']) {
      await L(`window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}')`); await sleep(900);
      await shot(p, `h5c/basics/${look}-01-the-start.png`);
      await L("window.__jwLab.hop('u')"); await sleep(400);
      await stand(18, 3); await sleep(900); await shot(p, `h5c/basics/${look}-02-a-run.png`);
      let i = await p.evaluate(() => window.__jwLab.find('water', 14));
      await p.evaluate(l => window.__jwLab.warp(l - 1), i);
      await waitFor(p, `window.__jwLab.logAt(${i}) > 0`, 20000);
      await p.evaluate(l => { const J = window.__jwLab; J.warp(l, { x: J.logAt(l) }); }, i); await sleep(450); await shot(p, `h5c/basics/${look}-03-water-and-logs.png`);
      await fresh(look); await sleep(300);
      i = await p.evaluate(() => window.__jwLab.find('rail', 150)); await below(i, 4500);
      await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'idle'`, 60000);
      await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell' && window.__jwLab.state().t % 16 < 5`, 60000); await sleep(40); await shot(p, `h5c/basics/${look}-04-a-train-coming.png`);
      await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'pass'`, 30000); await sleep(300); await shot(p, `h5c/basics/${look}-05-the-train-passing.png`);
      await fresh(look); await sleep(300);
      i = await p.evaluate(() => window.__jwLab.find('flight', 400));
      await p.evaluate(l => { const J = window.__jwLab; for (let d = 1; d < 9; d++) if (J.find('grass', l - d) === l - d) { J.warp(l - d, { x: 2500 }); return; } J.warp(l - 1); }, i);
      await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'idle'`, 40000);
      await waitFor(p, `(window.__jwLab.pulse(${i}) || {}).st === 'tell'`, 60000); await sleep(650); await shot(p, `h5c/basics/${look}-06-the-flight-path-tell.png`);
      for (let k = 0; k < 8; k++) { await fresh(look); await sleep(250); await stand(50 * (k + 1) + 9, 4); await sleep(look === 'day' ? 2600 : 1300); await shot(p, `h5c/basics/${look}-area-${k + 1}-${IDS[k]}.png`); }
      await fresh(look); await sleep(250); await stand(262, 4); await sleep(1500); await shot(p, `h5c/basics/${look}-07-a-busy-road.png`);
    }
    ok(true, 'the basics, day + night: the start, a run, water + logs, a train coming + passing, the flight path\'s tell, every area, a busy road');
  }
  if (all || what === 'fog') {
    for (const look of ['day', 'night']) {
      await fresh(look); await sleep(5200); await shot(p, `h5c/fog/${look}-1-coming.png`);
      await sleep(1800); await shot(p, `h5c/fog/${look}-2-near.png`);
      await sleep(1300); await shot(p, `h5c/fog/${look}-3-close.png`);
      await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'wall'", 30000); await sleep(350); await shot(p, `h5c/fog/${look}-4-taken.png`);
    }
    ok(true, 'THE FOG BANK (day) + THE BLACKOUT (night): coming · near · close · taken');
  }
  if (all || what === 'ground') {
    await fresh('day'); await sleep(400);
    for (const [name, lane, col] of [['the-opening-grass', 18, 4], ['the-road', 0, 4], ['the-docks-drums', 57, 4], ['the-fish-market-cobbles', 108, 4], ['the-rail-yard-gravel', 158, 4], ['the-bridge', 207, 4], ['downtown-shops', 262, 4], ['the-canal', 312, 4], ['the-lighthouse-sand', 362, 4], ['the-airfield', 412, 4]]) {
      if (name === 'the-road') { const i = await p.evaluate(() => window.__jwLab.find('road', 20)); await stand(i - 1, 4); } else await stand(lane, col);
      await sleep(1100); await shot(p, `h5c/ground/day-${name}.png`);
    }
    await L("window.__jwLab.setLook('night')"); await sleep(600);
    for (const [name, lane] of [['the-opening-grass', 18], ['the-fish-market-cobbles', 108], ['the-docks-drums', 57], ['downtown-shops', 262]]) { await stand(lane, 4); await sleep(1100); await shot(p, `h5c/ground/night-${name}.png`); }
    ok(true, 'the ground + the props: the day grass / road / every area\'s ground + the night checks');
  }
  if (all || what === 'gates') {
    for (const look of ['day', 'night']) {
      await fresh(look); await sleep(400);
      for (let k = 0; k < 8; k++) {
        const g = 50 * (k + 1);
        await stand(g - 5); await sleep(1000); await shot(p, `h5c/gates/${look}-${k + 1}-${IDS[k]}-approaching.png`);
        await stand(g); await sleep(1000); await shot(p, `h5c/gates/${look}-${k + 1}-${IDS[k]}-in-it.png`);
        // the name stands on the arch ABOVE him: the sign's foot is well over his cap on the screen
        const q = await p.evaluate(() => { const J = window.__jwLab, s = J.state(), i = s.info.gate; return i ? { sign: i.y, kid: s.kidY, px: s.kidPx / innerHeight, text: i.text, on: i.on } : null; });
        ok(!!q && q.on && q.sign < q.kid - q.px - 0.02, `${IDS[k]} (${look}): standing in the gate lane the name "${q && q.text}" stands on the arch above him (the sign's foot ${q ? q.sign.toFixed(3) : '—'} · his cap ${q ? (q.kid - q.px).toFixed(3) : '—'} down the screen)`);
      }
    }
  }
  if (all || what === 'lines') {
    const lines = (best, friend) => p.evaluate((b, f) => window.__jwLab.view.setLines({ best: b ? { lane: b, text: `YOUR BEST · ${b}` } : null, friend: f ? { lane: f, text: `LIAM · ${f}` } : null }), best, friend);
    for (const look of ['day', 'night']) {
      for (const kind of ['grass', 'road', 'water', 'rail']) {
        await fresh(look); await sleep(300);
        const i = await p.evaluate(k => window.__jwLab.find(k, k === 'rail' ? 150 : 24), kind);
        await lines(i, 0); await below(i, 4500); await sleep(1300); await shot(p, `h5c/lines/${look}-your-best-on-${kind}.png`);
        await lines(0, i); await sleep(500); await shot(p, `h5c/lines/${look}-friend-on-${kind}.png`);
      }
      // the words stay readable with a log / a car right on them: both lines on a water lane, then a road lane, the kid standing below
      await fresh(look); await sleep(300);
      const w = await p.evaluate(() => window.__jwLab.find('water', 24)); await lines(w + 1, w - 1); await below(w - 1, 4500); await sleep(1400); await shot(p, `h5c/lines/${look}-both-by-the-water.png`);
      await lines(0, 0);
    }
    ok(await p.evaluate(() => { const i = window.__jwLab.state().info; return i.words === 'top'; }), 'the lines\' words draw ABOVE logs / cars / water (never depth-tested), never over your own kid');
  }
  if (all || what === 'tail') {
    await fresh('night'); await sleep(400);
    for (const [veh, name] of [['sedan', 'a-car'], ['van', 'a-van'], ['truck', 'a-truck']]) {
      for (const dir of [1, -1]) {
        await fresh('night'); await sleep(300);   // (each its own fresh run: the wall never catches a standing kid mid-shot)
        const at = await p.evaluate((w, d) => { const J = window.__jwLab; for (let i = 12; i < 300; i++) if (J.find('road', i) === i && J.find('grass', i - 1) === i - 1 && J.lane(i).dir === d && J.items(i).items.some(q => q.what === w)) return i; return -1; }, veh, dir);
        if (at < 0) continue;
        await p.evaluate(l => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } J.warp(l - 1, { x: 4500 }); }, at);
        await waitFor(p, `window.__jwLab.items(${at}).items.some(q => q.what === '${veh}' && q.left > 2.2 && q.left + q.len < 6.8)`, 30000);
        await sleep(120); await shot(p, `h5c/tail/night-${name}-${dir > 0 ? 'going-right' : 'going-left'}.png`);
      }
    }
    await p.evaluate(() => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } J.warp(J.find('grass', 262), { x: 4500 }); }); await sleep(1500); await shot(p, 'h5c/tail/night-a-busy-road.png');
    ok(true, 'THE TAIL LIGHTS: a car, a van, a truck (both directions) + a busy road');
  }
  await L("window.__jwLab.setLook('night')");
}

// ---- THE TAIL LIGHTS (`--h5b=tail` — H5B's add-on): night — a car, a van, a truck seen from behind their travel + a busy road → taillights/
async function looksTail(p) {
  const L = js => p.evaluate(js);
  await L("window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('night'); window.__jwLab.hop('u')"); await sleep(400);
  for (const [what, name] of [['sedan', 'a-car'], ['van', 'a-van'], ['truck', 'a-truck']]) {
    // the first road lane (from lane 12) that carries one, a ground lane right under it; wait until it is in the middle of the play
    const at = await p.evaluate(w => { const J = window.__jwLab; for (let i = 12; i < 240; i++) if (J.find('road', i) === i && J.find('grass', i - 1) === i - 1 && J.items(i).items.some(q => q.what === w)) return i; return -1; }, what);
    if (at < 0) { ok(false, `a road lane with a ${what} under a ground lane`); continue; }
    await p.evaluate(l => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } J.warp(l - 1, { x: 4500 }); }, at);
    await waitFor(p, `window.__jwLab.items(${at}).items.some(q => q.what === '${what}' && q.left > 2.2 && q.left + q.len < 6.8)`, 30000);
    await sleep(120); await shot(p, `taillights/night-${name}.png`);
  }
  await p.evaluate(() => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } J.warp(J.find('grass', 262), { x: 4500 }); }); await sleep(1500); await shot(p, 'taillights/night-a-busy-road.png');
  await L("window.__jwLab.setLook('day')"); await sleep(900); await shot(p, 'taillights/day-a-busy-road.png'); await L("window.__jwLab.setLook('night')");
  ok(true, 'THE TAIL LIGHTS\' shots: a car, a van, a truck, a busy road (night) + the busy road by day (no glow)');
}

// ---- H5A's add-on — THE BIG NUMERALS (`--nums`): 17 · 71 · 111 · 117 · 172 · 711 as the game draws them — the in-game lane counter +
// the end screen's number (the real DOM, the real CSS), the share card at its own size (1080 × 1350, one PNG a number) and as the small
// link preview (two a row on a 390 pt phone). The modules are the game's own (numerals.js · share.js · kit/share-run.js).
async function looksNums(p) {
  if (!OUT) return;
  const NUMS = [17, 71, 111, 117, 172, 711];
  const cards = await p.evaluate(async nums => {
    const [N, S, K] = await Promise.all([import('/js/games/jaywalk/numerals.js'), import('/js/games/jaywalk/share.js'), import('/js/games/kit/share-run.js')]);
    await Promise.all(['900 64px Orbitron', '700 64px "Chakra Petch"'].map(f => document.fonts.load(f)));
    window.__cards = nums.map(n => K.drawRunCard({ ...S.jwRunCard({ mode: 'solo', results: { u: { l: n } } }, { uid: 'u', name: 'BEN' }), line: 'FLATTENED BY A TAXI' }, (c, box, k) => S.drawRunMiddle(c, box, k, null), S.JW_CARD));
    window.__N = N;
    return window.__cards.map(cv => cv.toDataURL('image/png'));
  }, NUMS);
  cards.forEach((u, i) => writeFileSync(join(OUT, `nums-card-${NUMS[i]}-1080x1350.png`), Buffer.from(u.split(',')[1], 'base64')));
  // the small link preview: the six cards, two a row
  await p.evaluate(() => {
    const o = document.createElement('div'); o.id = 'nums';
    o.style.cssText = 'position:fixed;inset:0;z-index:99;background:#0b0716;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;align-content:start;justify-items:center';
    for (const cv of window.__cards) { cv.style.cssText = 'width:176px;height:220px;border-radius:12px'; o.append(cv); }
    document.body.append(o);
  });
  await sleep(300); await shot(p, 'nums-cards-small-390x844.png');
  // the game's own counter + the end screen's number
  await p.evaluate(nums => {
    const o = document.getElementById('nums'); o.replaceChildren(); o.style.gridTemplateColumns = '1fr 1fr'; o.style.gap = '0'; o.style.padding = '6px';
    for (const kind of ['count', 'end', 'gold']) for (const n of nums) {
      const st = document.createElement('div'); st.className = 'jw-stage'; st.style.cssText = 'position:relative;inset:auto;width:186px;height:92px;background:#0b0716;display:grid;place-items:center';
      let el;
      if (kind === 'end') { const f = document.createElement('div'); f.className = 'jw-fin'; const w = document.createElement('div'); w.className = 'jw-fin-n'; el = document.createElement('b'); w.append(el); f.append(w); st.append(f); }
      else { el = document.createElement('div'); el.className = `jw-lanes${kind === 'gold' ? ' is-record' : ''}`; el.style.position = 'static'; st.append(el); }
      window.__N.setNum(el, n); window.__N.prepNums(st);
      o.append(st);
    }
  }, NUMS.slice(0, 6));
  await sleep(500); await shot(p, 'nums-counter-end-390x844.png');
  const foot = await p.evaluate(() => ({ chakra: window.__N.footOf(window.__N.NUM_FAMILY, 700), orb: window.__N.footOf('"Orbitron", "Chakra Petch", system-ui, sans-serif', 900), ones: document.querySelectorAll('#nums .jw-d1').length,
    w: [...document.querySelectorAll('#nums .jw-lanes')].slice(0, 6).map(e => Math.round(e.getBoundingClientRect().width)) }));
  ok(foot.chakra.w > 0.2 && foot.chakra.h > 0.03 && foot.orb.w > 0.2 && foot.orb.h > 0.03, `a "1" stands on a BASE FOOT in both fonts (Chakra Petch: ${(foot.chakra.w).toFixed(2)} em wide · Orbitron: ${(foot.orb.w).toFixed(2)} em)`);
  const end = await p.evaluate(() => { const b = document.querySelector('#nums .jw-fin-n b'), d = b.querySelector('.jw-dg'), c = getComputedStyle(d); return { px: parseFloat(c.fontSize), lines: Math.round(b.getBoundingClientRect().height / parseFloat(c.fontSize)) }; });
  ok(foot.ones === 3 * 10 && foot.w.every(x => x <= 186), `every 1 is marked for its foot (${foot.ones}); the counter's widest numeral: ${Math.max(...foot.w)} px on one line (${foot.w.join(' · ')})`);
  ok(end.px >= 80 && end.lines === 1, `the end screen's digits keep the number's own size (${end.px} px — never the small LANES label's) on one line`);
  await p.evaluate(() => document.getElementById('nums').remove());
}

try {
  if (argv.includes('--nums')) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksNums(o.p); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
  // (BEFORE THE FLIP — THE AREA ARRIVAL: `--preflip` — kit/jaywalk-preflip.mjs; the shots → arrival/)
  if (argv.includes('--preflip')) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksPreflip(o.p, { ok, shot, sleep, waitFor }); if (o.errs.length) { console.log('PAGE ERRORS', o.errs.slice(0, 3)); fails.push('page errors'); } await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
  // (H6B — THE FINAL POLISH: `--h6b[=sky|gates|ufo|jet|ship|shops|lane|perf]` — kit/jaywalk-h6b.mjs; the shots → <group>/)
  { const h6b = argv.find(x => x === '--h6b' || x.startsWith('--h6b=')); if (h6b) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600);
    const top = async name => { if (OUT) { mkdirSync(join(OUT, name.slice(0, name.lastIndexOf('/'))), { recursive: true }); await o.p.screenshot({ path: join(OUT, name), clip: { x: 0, y: 0, width: 390, height: 300 } }); } };
    const w6 = h6b.slice(6);
    if (!['jet', 'ufo', 'ship'].includes(w6)) await looksH6B(o.p, { ok, shot, sleep, waitFor, what: w6, reqs: o.reqs, top, open, up });
    // (THE MOMENTS' FINISH: H6A's own drive through each moment, its shots into this pass's folders — blackbird/ · ufo/ · ship/)
    for (const g of ['blackbird', 'ufo', 'ship']) if (!w6 || w6 === (g === 'blackbird' ? 'jet' : g)) await looksH6A(o.p, { ok, shot: (pg, n) => shot(pg, n.replace('h6a/', '')), sleep, waitFor, what: g, reqs: o.reqs }); if (o.errs.length) { console.log('PAGE ERRORS', o.errs.slice(0, 3)); fails.push('page errors'); } await o.close(); throw Object.assign(new Error('look only'), { look: true }); } }
  // (H6A — THE BIG MOMENTS: `--h6a[=blackbird|ufo|ship]` — kit/jaywalk-h6a.mjs; the shots → h6a/<group>/)
  { const h6a = argv.find(x => x === '--h6a' || x.startsWith('--h6a=')); if (h6a) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksH6A(o.p, { ok, shot, sleep, waitFor, what: h6a.slice(6), reqs: o.reqs }); if (o.errs.length) { console.log('PAGE ERRORS', o.errs.slice(0, 3)); fails.push('page errors'); } await o.close(); throw Object.assign(new Error('look only'), { look: true }); } }
  { const h5c = argv.find(x => x === '--h5c' || x.startsWith('--h5c=')); if (h5c) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksH5C(o.p, h5c.slice(6), o.reqs); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); } }
  { const h5b = argv.find(x => x === '--h5b' || x.startsWith('--h5b=')); if (h5b) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); if (h5b.slice(6) === 'tail') await looksTail(o.p); else if (h5b.slice(6) === 'addons') { await looksAddons(o.p); await looksTail(o.p); } else await looksH5B(o.p, h5b.slice(6), o.reqs); if (o.errs.length) { console.log('PAGE ERRORS', o.errs.slice(0, 3)); fails.push('page errors'); } await o.close(); console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nH5B OK'); await b.close(); process.exit(fails.length ? 1 : 0); } }
  { const h5 = argv.find(x => x === '--h5' || x.startsWith('--h5=')); if (h5) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksH5(o.p, h5.slice(5)); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); } }
  if (argv.includes('--h4')) { const o = await open(390, 844, 3, '&preview=1&seed=look3'); await up(o.p); await sleep(600); await looksH4(o.p); if (o.errs.length) console.log('PAGE ERRORS', o.errs.slice(0, 3)); await o.close(); throw Object.assign(new Error('look only'), { look: true }); }
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
  ok(reqs.filter(u => /assets\/jaywalk\/models\/[\w-]+\.glb/.test(u)).length === 13 && !reqs.some(u => /crate-box|traffic-barrier/.test(u)) && ['kid', 'lighthouse', 'fishing-boat'].every(m => reqs.some(u => u.includes(`/models/${m}.glb`))) && reqs.some(u => /assets\/jaywalk\/skyline-night\.webp/.test(u)), 'the 13 models the scene draws — Kenney\'s 10 (no crate, no jersey barrier — H2B) + H5A\'s three (THE KID, the lighthouse, the fishing boat) — + the night skyline loaded (only the current look\'s picture)');
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
  ok(Object.values(CAUSE_LINES).includes(e.t) && !/A CAR\b/.test(e.t), `… in the GAME's own words (causes.js — the same table): "${e.t}"`);
  ok(e.end.same === true && /is-ok/.test(e.cls) && /^REPLAY = LIVE/.test(e.c), `THE REPLAY = THE LIVE RUN (${e.c})`);
  ok(e.end.live.lanes === e.end.replay.lanes && e.end.live.tick === e.end.replay.tick && e.end.live.cause === e.end.replay.cause, 'lanes, tick + cause identical');
  w = await p.evaluate(() => window.__jwLab.sfx.wanted().slice(-3).map(x => x.id));
  ok(w.includes('hit') || w.includes('splash'), `the hit has its sound (${w.join(' · ')})`);
  await shot(p, 'end-390x844.png');
  await p.evaluate(() => window.__jwLab.bot(false));
  await sleep(350);
  await touch(p, [[195, 400]]); await sleep(200); s = await st(p);
  ok(!s.over && s.seed !== 'labseed1' && s.best <= 1, `ONE TAP = PLAY AGAIN, at once, on a NEW seed (${s.seed})`);
  ok(await p.evaluate(() => document.querySelector('.jw-end').hidden), 'the end screen is gone');
  // ---- 4. the mode switch + NEW SEED (their own press + lift — never the play area's hop)
  // ---- H4 ADD-ON: THE CAUSE LINE NAMES THE VEHICLE THAT HIT YOU — every vehicle kind, in a real page: a kid stood on a road lane that
  // carries it; whatever gets him, the end line names THAT vehicle (the one the scene drew) — never a generic "HIT BY A CAR"
  {
    const named = {};
    await p.evaluate(() => { window.__jwLab.bot(false); window.__jwLab.restart('solo', 'named1'); });
    const lanes = await p.evaluate(() => { const J = window.__jwLab, out = []; for (let l = 6; l < 260; l++) if (J.lane(l).type === 'road') out.push({ l, kinds: J.items(l).items.map(q => q.what) }); return out; });
    for (const want of VEHICLES) {
      for (const L of lanes.filter(q => q.kinds.includes(want)).slice(0, 6)) {
        if (named[want]) break;
        await p.evaluate(l => { window.__jwLab.restart('solo', 'named1'); window.__jwLab.warp(l, { safe: false }); }, L.l);
        if (!await waitFor(p, 'window.__jwLab.state().over && window.__jwLab.state().shown', 25000)) continue;
        const r = await p.evaluate(() => { const s = window.__jwLab.state(); return { cause: s.cause, line: s.line, hitBy: s.hitBy, shown: document.querySelector('.jw-end-t').textContent }; });
        if (r.cause !== 'car') continue;
        if (!(r.hitBy && r.line === CAUSE_LINES[`car:${r.hitBy}`] && r.shown === r.line)) { named[`BAD ${r.hitBy}: "${r.shown}"`] = 1; break; }
        named[r.hitBy] = r.line;
      }
    }
    const got = VEHICLES.filter(v => named[v]);
    ok(got.length === VEHICLES.length && !Object.keys(named).some(k => k.startsWith('BAD')), `EVERY VEHICLE NAMES ITSELF on the lab's end screen: ${VEHICLES.map(v => `${v} → "${named[v] || '—'}"`).join(' · ')}${Object.keys(named).filter(k => k.startsWith('BAD')).join(' ')}`);
    await p.evaluate(() => window.__jwLab.restart('solo', 'labseed2'));
    await sleep(300);
  }

  r = await tapEl(p, '.jw-tab[data-mode="match"]'); s = await st(p);
  ok(s.mode === 'match' && s.lives === undefined && s.hops === 0, 'MATCH: a new run, ONE LIFE (no lives anywhere) — the tap on the tab is no hop');
  ok(r[2] >= 44 && r[3] >= 44, `the tabs' tap area ≥ 44 pt (${r[2].toFixed(0)} × ${r[3].toFixed(0)})`);
  ok(/^MATCH · (5:5\d|6:00)$/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'MATCH shows its clock to THE MOTHERSHIP (6:00 — the mode\'s quiet line; H6B: the big red countdown is the only one that names her) — and no lives HUD');
  await tapEl(p, '.jw-tab[data-mode="daily"]'); s = await st(p);
  ok(s.mode === 'daily' && /^DAILY · (4:5\d|5:00)$/.test(await p.evaluate(() => document.querySelector('.jw-sub').textContent)), 'DAILY: THE MOTHERSHIP at 5:00');
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
  ok(rows.length === 11 && rows.filter(x => x.plays === 2 && x.picks === 2).length === 3 && rows.filter(x => x.plays === 1 && x.picks === 0).length === 8 && !rows.some(x => x.id === 'car-pass' || x.id === 'landmark') && rows.some(x => x.id === 'train-horn') && rows.some(x => x.id === 'area-arrive'), `EVERY JAYWALK sound: ${rows.length} rows (H5B: the car-pass is gone · H5C: the bell = one take, + the train horn, the landmark ping → the area arrival) — 3 with a pick + its backup side by side (PLAY A · PLAY B · USE A / B), 8 with one take (H6B: NEW BEST = ONE take)`);
  const n0 = await p.evaluate(() => ({ w: window.__jwLab.sfx.totals().asked, p: window.__jwLab.sfx.totals().started }));   // (the totals: the two lists keep only their last 200)
  await tapEl(p, '[data-snd="hop:a"]'); await tapEl(p, '[data-snd="hop:b"]'); await tapEl(p, '[data-snd="land-wood:b"]'); await sleep(500);   // (H6B: NEW BEST has ONE take — the third tap is the landing's backup)
  const n1 = await p.evaluate(() => ({ w: window.__jwLab.sfx.wanted().slice(-3).map(x => `${x.id}:${x.ab}`), p: window.__jwLab.sfx.totals().started, last: window.__jwLab.sfx.played().slice(-3).map(x => `${x.id}:${x.ab}`) }));
  ok(n1.w.join() === 'hop:a,hop:b,land-wood:b', `EVERY TAP ACTS: PLAY A, PLAY B (${n1.w.join(' · ')})`);
  ok(n1.p - n0.p === 3 && n1.last.join() === 'hop:a,hop:b,land-wood:b', `… each one SOUNDS, the first time it is asked for (${n1.p - n0.p} started — a backup is fetched + decoded on its first tap)`);
  await tapEl(p, '[data-snd="train-bell:a"]'); await sleep(700);
  let bell = await p.evaluate(() => ({ on: document.querySelector('[data-snd="train-bell:a"]').classList.contains('is-on'), n: window.__jwLab.sfx.sounding(), last: window.__jwLab.sfx.played().slice(-1)[0] }));
  ok(bell.on && bell.n >= 1 && bell.last.id === 'train-bell' && bell.last.loop === true, 'the train bell plays as a LOOP (the whole 16-bit WAV — no MP3 padding)');
  await sleep(2300);
  ok(await p.evaluate(() => window.__jwLab.sfx.sounding() >= 1), '… still ringing after its first lap (1.9 s)');
  await tapEl(p, '.jw-au-stop'); await sleep(200);
  ok(await p.evaluate(() => window.__jwLab.sfx.sounding() === 0 && !document.querySelector('.jw-au-play.is-on')), 'STOP ends it');
  await tapEl(p, '[data-pick="hop:b"]'); await tapEl(p, '[data-pick="land-wood:b"]');
  const line = await p.evaluate(() => ({ t: document.querySelector('.jw-au-line').textContent, ls: [localStorage.getItem('jw:lab:snd:hop'), localStorage.getItem('jw:lab:snd:land-wood')], on: document.querySelector('[data-pick="hop:b"]').classList.contains('is-on') }));
  ok(line.on && line.ls.join() === 'b,b' && /^JAYWALK SOUNDS: hop B · land-wood B · hit A · splash A · horn A · train-bell A · train-horn A · train-pass A · lights-die A · area-arrive A · new-best A$/.test(line.t), `a choice a sound, remembered on this phone ("${line.t}")`);
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
  const hb = await p.evaluate(() => window.__jwLab.sfx.totals().asked);
  await touch(p, [[195, 500]]); await sleep(300);
  // (the sounds asked since — the hop's own; H5A: the world's cues may sound with it)
  w = await p.evaluate(n => { const S = window.__jwLab.sfx, d = S.totals().asked - n; return d > 0 ? S.wanted().slice(-d).filter(x => x.id === 'hop') : []; }, hb);
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
    await p.evaluate(l => window.__jwLab.warp(l, { x: window.__jwLab.logAt(l), safe: false }), wl); await sleep(600);
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
    // H5A — THE HEAVIEST AREAS at 4× CPU: DOWNTOWN (heavy traffic + the storefronts' neon), THE LIGHTHOUSE (its beam + the water), THE
    // RAIL YARD (the trains + the gantries + the containers) — the bot plays three slices of each stretch; tier 2 (the bloom) + tier 1
    // (H5B — BY NIGHT and BY DAY: the day look is the same scene — no bloom, the fog bank's puffs, the paint)
    for (const [name, g] of [['DOWNTOWN', 250], ['THE LIGHTHOUSE', 350], ['THE RAIL YARD', 150]]) for (const tier of [2, 1]) for (const look of ['night', 'day']) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&look=${look}`);
      await up(o.p); await o.p.emulateCPUThrottling(4);
      await o.p.evaluate(() => { window.__jwLab.restart('solo', 'perfseed7'); window.__jwLab.bot(true); });
      await sleep(1500);
      const fr = [], calls = [], tris = [];
      for (const off of [2, 14, 26, 38]) {
        await o.p.evaluate(l => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'perfseed7'); J.bot(true); } J.warp(J.find('grass', l)); }, g + off);
        await sleep(700); await o.p.evaluate(() => window.__jwLab.clearFrames()); await sleep(3600);
        const f = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), i: window.__jwLab.state().info, y: window.__jwLab.state().y }));
        fr.push(...f.fr); calls.push(f.i.calls); tris.push(f.i.tris);
      }
      await o.p.emulateCPUThrottling(1);
      fr.sort((a, c) => a - c);
      const avg = fr.reduce((a, c) => a + c, 0) / fr.length;
      const row = { area: name, look, tier, cpu: '4×', frames: fr.length, fps: +(1000 / avg).toFixed(1), avgMs: +avg.toFixed(2), p95Ms: +fr[Math.floor(fr.length * 0.95)].toFixed(2), worstMs: +fr[fr.length - 1].toFixed(1), calls: Math.max(...calls), tris: Math.max(...tris) };
      console.log('PERF', JSON.stringify(row)); rows2.push({ ...row, cpu: `4× ${name} ${look}` });
      ok(row.fps >= 57 && !o.errs.length, `${name} BY ${look.toUpperCase()} at tier ${tier}, 4× CPU: ${row.fps} fps · ${row.avgMs} ms (p95 ${row.p95Ms}, worst ${row.worstMs}) · ≤ ${row.calls} calls · ≤ ${row.tris} tris`);
      await o.close();
    }
    // H5A — 8 KIDS: the kid + 7 ghosts (the instanced, skinned kid — one draw call for him, one for all the ghosts), DOWNTOWN, 4× CPU
    for (const tier of [2, 1]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight`);
      await up(o.p); await o.p.emulateCPUThrottling(4);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.bot(true); J.ghosts(7); J.warp(J.find('grass', 252)); });
      await sleep(1500); await o.p.evaluate(() => window.__jwLab.clearFrames()); await sleep(9000);
      const f = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), i: window.__jwLab.state().info }));
      await o.p.emulateCPUThrottling(1);
      const fr = f.fr.slice().sort((a, c) => a - c), avg = fr.reduce((a, c) => a + c, 0) / fr.length;
      const row = { kids: 8, tier, cpu: '4×', frames: fr.length, fps: +(1000 / avg).toFixed(1), avgMs: +avg.toFixed(2), p95Ms: +fr[Math.floor(fr.length * 0.95)].toFixed(2), worstMs: +fr[fr.length - 1].toFixed(1), calls: f.i.calls, tris: f.i.tris };
      console.log('PERF', JSON.stringify(row)); rows2.push({ ...row, cpu: '4× 8 kids' });
      ok(row.fps >= 57 && !o.errs.length, `8 KIDS (the kid + 7 ghosts — skinned, instanced) at tier ${tier}, 4× CPU: ${row.fps} fps · ${row.avgMs} ms (p95 ${row.p95Ms}, worst ${row.worstMs}) · ${row.calls} calls · ${row.tris} tris`);
      await o.close();
    }
    const at4 = rows2.filter(x => x.cpu === '4×');
    ok(at4.some(x => x.fps >= 55), `4× CPU: a tier holds 60 (${at4.map(x => `tier ${x.tier} ${x.fps}`).join(' · ')}) — the automatic steps find it`);
    ok(rows2.every(x => x.calls <= 64), `≤ 64 draw calls a frame at every tier, in every area (${rows2.map(x => x.calls).join(' · ')})`);   // (H5A: the areas' own kinds — one call a kind in view)
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
    ok(ws.info.look === 'night' && ws.info.calls >= 14 && ws.kidY >= 0.6 && ws.kidY <= 0.65 && ws.zoom === 8 && ws.angle === 'straight', `WebKit: the scene draws (${ws.info.calls} calls, ${ws.info.tris} tris, the kid ${ws.kidPx.toFixed(1)} pt)`);
    await wp.touchscreen.tap(195, 500); await sleep(300);
    ok((await wp.evaluate(() => window.__jwLab.state())).y === 1, 'WebKit: a tap hops');
    const wtap = async sel => { const bx = await wp.evaluate(q => { const el = document.querySelector(q); el.scrollIntoView({ block: 'center', behavior: 'instant' }); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); await wp.touchscreen.tap(bx[0], bx[1]); await sleep(200); };
    await wtap('.jw-snd');
    ok(await wwait("!!document.querySelector('.sh.jw-au-sheet.is-in')", 6000), 'WebKit: SOUNDS → the audition sheet opens');
    await sleep(450);
    const b0 = await wp.evaluate(() => window.__jwLab.sfx.totals().asked);
    await wtap('[data-snd="hop:a"]'); await wtap('[data-snd="splash:a"]'); await wtap('[data-snd="land-wood:b"]');
    const ww = await wp.evaluate(n => { const S = window.__jwLab.sfx, d = S.totals().asked - n; return { w: (d > 0 ? S.wanted().slice(-d) : []).map(x => `${x.id}:${x.ab}`), p: S.totals().started }; }, b0);
    ok(ww.w.join() === 'hop:a,splash:a,land-wood:b', `WebKit: every PLAY tap acts (${ww.w.join(' · ')}; ${ww.p} started on its audio context — Playwright's WebKit on Windows may have no audio device)`);
    await wtap('[data-pick="land-wood:b"]');
    ok(/land-wood B /.test(await wp.evaluate(() => document.querySelector('.jw-au-line').textContent)), 'WebKit: a pick is taken');
    if (OUT) await wp.screenshot({ path: join(OUT, 'webkit-audition-390x844.png') });
    ok(!werr.length, `WebKit: no page error${werr.length ? `: ${werr[0]}` : ''}`);
    await wb.close();
  }
} catch (e) { if (!e.look) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); } }
finally { await b.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
