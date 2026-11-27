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
//     --contrast = FIX A — THE DAY HUD's contrast on every area (frozen frames, the digits vs what is behind them) · --watershot = THE WATER at 119, both looks
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

/** (F3) a check names its look: without `?look=` the page is AUTO — it would follow the clock of the machine the checks run on. `auto: true` = leave it AUTO */
const withLook = (q, auto) => (auto || /[?&]look=/.test(q) ? q : `${q}${q ? '&' : '?'}look=night`);
async function open(w, h, dpr, q = '', { best = 0, auto = false } = {}) {
  q = withLook(q, auto);
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [], sockets = [], logs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /freefall|WebGL|THREE/i.test(t)) logs.push(`${m.type()}: ${t}`); });
  p.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(`${r.method()} ${r.url()}`); });
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', e => sockets.push(e.url));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  // (F5A — THE REVIEW's SLOW MOTION, the test browser's alone: `window.__slowmo(k)` runs the page's clock (performance.now + the frame's
  //  own stamp) at k × the real one — a 0.3 s moment can be shot frame by frame at 3×, where one screenshot takes a third of a second.
  //  At 1 (until it is asked for) the clock is the real one, shifted by nothing.)
  await p.evaluateOnNewDocument(() => {
    const real = performance.now.bind(performance), raf = window.requestAnimationFrame.bind(window);
    let k = 1, base = 0, vbase = 0, on = false;
    const now = () => (on ? vbase + (real() - base) * k : real());
    window.__slowmo = v => { const n = now(); vbase = n; base = real(); k = v; if (!on) { on = true; performance.now = now; window.requestAnimationFrame = cb => raf(() => cb(now())); } };
  });
  if (best) await p.evaluateOnNewDocument(n => { try { localStorage.setItem('ff:play:best', String(n)); } catch { /* fine */ } }, best);
  await p.goto(guardUrl(`${BASE}/freefall-play${q}`, 'freefall-play'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__ffPlay && !!document.querySelector('canvas.ff-canvas') && window.__ffPlay.state().info.frames > 3");
  return { p, cdp, errs, reqs, sockets, logs, up, touch: w < 700, w, h, close: () => ctx.close() };
}
const st = p => p.evaluate(() => window.__ffPlay.state());
/** the band that is up (F3B: every band is its own kept node — an arrival touches no DOM) */
const bandSel = s => `.ff-banners > .ff-banner:nth-of-type(${s.banner.at + 1})`;
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
// F3: BOTH LOOKS (`?look=night|day`), every area, THE OPENING, a banner, THE BLAZE on the day's water. `--scenes=a,b` + `--looks=night`
// shoot a part of it (a refine pass looks at what it changed); the files: f3-<look>-<nn>-<name>.png
const SCENES = (argv.find(a => a.startsWith('--scenes=')) || '').slice(9).split(',').filter(Boolean), LOOKS = ((argv.find(a => a.startsWith('--looks=')) || '').slice(8) || 'night,day').split(',').filter(Boolean);
const want = s => !SCENES.length || SCENES.includes(s);
const grey = async (p, on) => { await p.evaluate(g => { document.querySelector('.ff-stage').style.filter = g ? 'grayscale(1)' : ''; }, on); await sleep(120); };
/** the areas' shots: [name, the floor the run starts from] — the ball bouncing two floors on */
const AREA_SHOTS = [['rooftop', 0], ['rooftop-30', 28], ['border-offices', 36], ['offices', 46], ['border-speakeasy', 77], ['speakeasy', 88], ['border-harbor', 116], ['harbor', 128], ['border-deep', 157], ['deep', 168], ['trench', 205], ['trench-lap2', 250], ['trench-lap3', 300]];
async function look() {
  const [w, h, dpr] = [390, 844, 3];
  for (const lk of LOOKS) {
    const q = `&tier=2&look=${lk}`, f = n => `f3b-${lk}-${n}.png`;
    let t;
    if (want('opening')) {
      // THE OPENING: the title as it fades in, mid-GLINT, at rest
      t = await open(w, h, dpr, `?seed=look1${q}`, { best: 88 });
      // (THE REVIEW: the glint's shots at a FIXED moment of its animation — mid-sweep, then the star at its fullest; then on, at rest)
      await waitFor(t.p, "document.querySelector('.ff-title').classList.contains('is-ready') && document.getAnimations().some(a => a.animationName === 'ff-glint')", 8000);
      const at = ms => t.p.evaluate(m => { for (const a of document.getAnimations()) if (a.animationName === 'ff-glint' || a.animationName === 'ff-star') { a.pause(); a.currentTime = m; } }, ms);
      await at(350 + 430); await sleep(120); await shot(t.p, f('01a-opening-glint'));
      await at(350 + 875); await sleep(120); await shot(t.p, f('01b-opening-star'));
      await at(350 + 2400); await sleep(120); await shot(t.p, f('01-opening'));
      if (lk === LOOKS[0]) { const j = await open(w, h, dpr, `?seed=look1${q}&pano=0.5`, { best: 88 }); await waitFor(j.p, '/pano(-day)?:1/.test(window.__ffPlay.state().info.walls)', 12000); await sleep(600); await shot(j.p, f('01c-opening-the-join')); await j.close(); }
      console.log(lk, 'opening', JSON.stringify((await st(t.p)).info), t.errs, t.logs.slice(0, 6));
      await t.close();
    }
    if (want('blaze')) {
      t = await open(w, h, dpr, `?seed=look1${q}`, { best: 88 });
      await start(t); await auto(t.p, 'play');
      await waitFor(t.p, 'window.__ffPlay.state().floor >= 3 && window.__ffPlay.state().fl === "bounce"');
      await sleep(250); await shot(t.p, f('02-rooftop-ball'));
      await auto(t.p, 'gap');
      await waitFor(t.p, 'window.__ffPlay.state().blaze');
      await sleep(520); await shot(t.p, f('03-blaze'));
      await grey(t.p, true); await shot(t.p, f('03b-blaze-greyscale')); await grey(t.p, false);
      await auto(t.p, 'smash');
      await waitFor(t.p, 'window.__ffPlay.state().shatters >= 1');
      await sleep(70); await shot(t.p, f('04-shatter'));
      await sleep(160); await shot(t.p, f('04b-shatter-later'));
      await t.close();
      // THE BLAZE on the water (UNDER THE HARBOR — by day: the pale water)
      t = await open(w, h, dpr, `?seed=look6${q}&floor=124`, { best: 141 });
      await start(t); await auto(t.p, 'gap');
      await waitFor(t.p, 'window.__ffPlay.state().blaze && window.__ffPlay.state().floor >= 129', 30000);
      await sleep(330); await shot(t.p, f('03c-blaze-harbor'));
      await grey(t.p, true); await shot(t.p, f('03d-blaze-harbor-greyscale')); await grey(t.p, false);
      await t.close();
    }
    if (want('areas')) {
      for (const [name, floor] of AREA_SHOTS) {
        if (argv.includes('--few') && /border|lap/.test(name)) continue;
        t = await open(w, h, dpr, `?seed=look2${q}${floor ? `&floor=${floor}` : ''}`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().fl === "bounce"`, 30000);
        await auto(t.p, 'safe');
        await sleep(2300);   // (an arrival's banner has left)
        await shot(t.p, f(`05-${name}`));
        if (!/border|lap/.test(name)) { await grey(t.p, true); await shot(t.p, f(`06-${name}-greyscale`)); await grey(t.p, false); }
        if (t.errs.length) console.log(lk, name, t.errs);
        await t.close();
      }
    }
    if (want('banner')) {
      // THE ARRIVAL BANNERS: the ball falls into an area — the band at its fullest
      for (const [name, floor] of [['offices', 38], ['speakeasy', 78], ['harbor', 118], ['deep', 158], ['lap2', 239]]) {   // (F5B: every area's band — they copy floor 120's)
        t = await open(w, h, dpr, `?seed=look2${q}&floor=${floor}`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2}`, 30000);
        await sleep(620); await shot(t.p, f(`07-banner-${name}`));
        await t.close();
      }
    }
    if (want('best')) {
      t = await open(w, h, dpr, `?seed=look3${q}`, { best: 6 });
      await start(t); await auto(t.p, 'play');
      await waitFor(t.p, 'window.__ffPlay.state().floor >= 2 && window.__ffPlay.state().fl === "bounce"');
      await sleep(200); await shot(t.p, f('08-best-tape'));
      await waitFor(t.p, 'window.__ffPlay.state().newBest');
      await sleep(350); await shot(t.p, f('08b-new-best'));
      await t.close();
    }
    if (want('dark')) {
      // THE DARKNESS closing in (hands off): the rooftop (by day THE STORM CLOUD), a walled room, under the water (by day THE MURK)
      for (const [name, floor] of [['rooftop', 0], ['speakeasy', 86], ['harbor', 126]]) {
        t = await open(w, h, dpr, `?seed=look5${q}${floor ? `&floor=${floor}` : ''}`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().fl === "bounce"`, 30000);
        await auto(t.p, 'safe');
        // (F3 — JAYWALK-style pressure: a stalled run, the darkness 3 · 2 · 1 floors above — the edge creeps down in step)
        for (const gap of [3, 2, 1]) { await waitFor(t.p, `window.__ffPlay.state().dark === ${gap} && window.__ffPlay.state().fl === "bounce"`, 30000); await sleep(700); await shot(t.p, f(`09-darkness-${name}-${gap}`)); }
        if (name === 'rooftop') { await waitFor(t.p, 'window.__ffPlay.state().shown', 30000); await sleep(500); await shot(t.p, f('10-end-dark')); }
        await t.close();
      }
    }
    if (want('hold')) {
      t = await open(w, h, dpr, `?seed=look4${q}`, { best: 88 });
      await start(t); await auto(t.p, 'play');
      await waitFor(t.p, 'window.__ffPlay.state().floor >= 12');
      await hideShow(t.p, true); await sleep(200); await hideShow(t.p, false);
      await sleep(700); await shot(t.p, f('11-hold'));
      await waitFor(t.p, '!window.__ffPlay.state().held', 6000);
      await auto(t.p, 'red');
      await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
      await sleep(500); await shot(t.p, f('12-end'));
      console.log(lk, 'end', JSON.stringify(await t.p.evaluate(() => window.__ffPlay.ends.map(e => [e.same, e.live.cause, e.live.floor, e.holds]))), t.errs, t.logs.slice(-4));
      await t.close();
    }
    // ---- F3B's scenes: THE ROOF BELOW (the title + floors 0 / 15 / 30 / 39 at three phone sizes) · each BREAKTHROUGH mid-play (a burst of
    // frames through it — at the 4 sizes) · THE COLOUR RULE (each area's floor beside a red slice — and with the colour removed) · PAUSED
    const toFloor = async (t2, n) => { await start(t2); await auto(t2.p, 'play'); await waitFor(t2.p, `window.__ffPlay.state().floor >= ${n} && window.__ffPlay.state().fl === "bounce"`, 40000); await auto(t2.p, 'safe'); await sleep(450); };
    if (want('roof')) {
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2], [430, 932, 3]]) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look1${q}`, { best: 88 });
        await waitFor(t.p, 'window.__ffPlay.state().info.landed >= 13', 15000); await sleep(1200);
        await shot(t.p, f(`30-roof-title-${tag}`));
        await t.close();
        for (const floor of [0, 15, 30, 39]) {
          t = await open(sw, sh, sd, `?seed=look2${q}${floor > 2 ? `&floor=${floor - 2}` : ''}`, { best: 141 });
          await toFloor(t, Math.max(1, floor));
          await shot(t.p, f(`31-roof-floor-${String(floor).padStart(2, '0')}-${tag}`));
          if (t.errs.length) console.log(lk, 'roof', floor, t.errs);
          await t.close();
        }
      }
    }
    // F4B — THE SKYLIGHT's FRAME BAR (the owner's iPhone, night, floor 40: the frame's bar stayed across the screen at the ball's height + a
    // dark bar at the top): floor 39 (the skylight whole) → the ball STANDING on floor 40 (0.3 s · 1 s · 2.2 s after the break) → floor 41
    if (want('framebar')) {
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2], [430, 932, 3]]) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=37`, { best: 141 });
        await toFloor(t, 39); await shot(t.p, f(`45-framebar-39-${tag}`));
        await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().info.breaks.skylight >= 1', 40000);
        await auto(t.p, 'safe');
        await sleep(300); await shot(t.p, f(`45-framebar-40-a-0.3s-${tag}`));
        await sleep(700); await shot(t.p, f(`45-framebar-40-b-1.0s-${tag}`));
        await sleep(1200); await shot(t.p, f(`45-framebar-40-c-2.2s-${tag}`));
        await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 41 && window.__ffPlay.state().fl === "bounce"', 20000); await auto(t.p, 'safe'); await sleep(450);
        await shot(t.p, f(`45-framebar-41-${tag}`));
        if (t.errs.length) console.log(lk, 'framebar', t.errs);
        await t.close();
      }
    }
    // F4B — THE MATCH on the page (the bot room: `?mode=match&rivals=7`): the ghosts (their tags, the x-ray, the outline near my ball), THE
    // DEPTH RAIL, the edge markers — at the 4 sizes; a look's own contrast (the day's pearl / gold / lavender floors, the water)
    if (want('match')) {
      const M = 'window.__ffPlay.matchState()';
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2], [430, 932, 3], [1440, 900, 1]]) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look3&mode=match&rivals=7${q}`, { best: 88 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `${M}.ghosts.length === 7 && window.__ffPlay.state().floor >= 1`, 20000);
        await sleep(500); await shot(t.p, f(`50-match-a-start-${tag}`));
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 7 && window.__ffPlay.state().fl === "bounce"', 30000); await auto(t.p, 'safe'); await sleep(700);
        await shot(t.p, f(`50-match-b-ghosts-${tag}`));
        await sleep(2200); await shot(t.p, f(`50-match-c-below-${tag}`));
        console.log(lk, tag, 'match', JSON.stringify(await t.p.evaluate(`(() => { const m = ${M}; return { top: m.top, hud: m.hud, layer: m.layer, g: m.ghosts.map(g => [g.name, g.floor, +g.alpha.toFixed(2), +g.near.toFixed(2), g.over, g.lost]) }; })()`)), t.errs);
        await t.close();
      }
      // … deep in a run, the rivals level with me (the bot room's clock shifted): the offices · the speakeasy's gold · the harbor's pearl + the water
      for (const [name, floor, shift] of [['offices', 46, 900], ['speakeasy', 88, 2300], ['harbor', 124, 3500], ['deep', 166, 5200]]) {
        t = await open(w, h, dpr, `?seed=look3&mode=match&rivals=7&floor=${floor}&simshift=${shift}${q}`, { best: 88 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `${M}.ghosts.length === 7`, 20000);
        await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().fl === "bounce"`, 30000); await auto(t.p, 'safe'); await sleep(900);
        await shot(t.p, f(`51-match-${name}`));
        console.log(lk, name, JSON.stringify(await t.p.evaluate(`${M}.ghosts.map(g => [g.name, g.floor, +g.alpha.toFixed(2)])`)), t.errs);
        await t.close();
      }
    }
    // F4B — THE END SCREEN (THE LOGO header, the cause, the number, YOUR BEST, the stats line, THE UNIVERSAL FOOTER): a red out · the
    // lights · a NEW BEST · THE BOTTOM (gold) — at the 4 sizes + a phone held sideways
    if (want('end')) {
      const endShown = "window.__ffPlay.state().shown && !document.querySelector('.ff-end').hidden";
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2], [430, 932, 3], [1440, 900, 1], [844, 390, 2]]) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look2${q}`, { best: 88 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 7', 30000); await auto(t.p, 'red');
        await waitFor(t.p, endShown, 30000); await sleep(500);
        await shot(t.p, f(`60-end-red-${tag}`));
        await t.close();
        if (sw !== 390 && sw !== 375) continue;
        t = await open(sw, sh, sd, `?seed=look2${q}`, { best: 4 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 9', 30000); await auto(t.p, 'safe');
        await waitFor(t.p, endShown, 30000); await sleep(700);
        await shot(t.p, f(`60-end-newbest-dark-${tag}`));
        await t.close();
        t = await open(sw, sh, sd, `?seed=look2&mode=match&floor=198${q}`, { best: 141 });
        await start(t); await auto(t.p, 'gap');
        await waitFor(t.p, endShown, 30000); await sleep(600);
        await shot(t.p, f(`60-end-made-${tag}`));
        await t.close();
      }
    }
    if (want('swap')) {
      // F5B — THE WATER SWAP: the surface from above (floor 119) + under it (121 · 125), the ball standing, 390 × 844 @3
      for (const fl of [119, 121, 125]) {
        t = await open(390, 844, 3, `?seed=look2${q}&floor=${fl - 2}`, { best: 141 });
        await toFloor(t, fl); await sleep(1500);
        await shot(t.p, f(`50-water-${fl}`));
        await t.close();
      }
    }
    if (want('moments')) {
      // F5C — THE MATCH MOMENTS on the bot room (3 rivals: the sloppy ones go out first): RIVAL OUT's callout in their colour, then LAST ONE
      // STANDING's card once every rival is down and my hand still falls — at 390 × 844 @3 + 375 × 667
      const M = 'window.__ffPlay.matchState()';
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2]]) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look4&mode=match&rivals=3${q}`, { best: 88 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, `${M}.hud.outTotal >= 1`, 120000); await sleep(250);
        await shot(t.p, f(`52-moment-out-${tag}`));
        console.log(lk, tag, 'out', JSON.stringify(await t.p.evaluate(`${M}.hud.outs`)));
        const got = await waitFor(t.p, `${M}.hud.lastTotal >= 1 || window.__ffPlay.state().over`, 170000).catch(() => false);
        if (got && await t.p.evaluate(`${M}.hud.lastTotal >= 1`)) { await sleep(450); await shot(t.p, f(`53-moment-last-${tag}`)); console.log(lk, tag, 'last', JSON.stringify(await t.p.evaluate(`${M}.hud.last`))); }
        else console.log(lk, tag, 'last: not reached (my run ended first)');
        await t.close();
      }
    }
    if (want('crown')) {
      // F5B — THE PLUNGE's CROWN frame by frame (the review: a near-white flash for a frame or two): the page's clock at 0.08 × the real one
      // from the splash on — 14 frames 8 ms of game time apart, 390 × 844 @3
      t = await open(390, 844, 3, `?seed=look2${q}&floor=116`, { best: 141 });
      await toFloor(t, 118); await auto(t.p, 'play');
      await waitFor(t.p, 'window.__ffPlay.state().floor >= 119', 30000);
      await t.p.evaluate(() => window.__slowmo(0.08));
      await waitFor(t.p, 'window.__ffPlay.state().info.breaks.splash >= 1', 60000);
      for (let i = 0; i < 14; i++) { await shot(t.p, f(`45-crown-${String(i + 1).padStart(2, '0')}`)); await sleep(100); }
      await t.close();
    }
    if (want('breaks')) {
      // each breakthrough: the floor before it (the piece in sight), then a burst of frames through the moment
      const through = async (t2, name, until, n, gap, first = 0) => { await waitFor(t2.p, until, 40000); if (first) await sleep(first); for (let i = 0; i < n; i++) { await shot(t2.p, f(`${name}-${i + 1}`)); if (i + 1 < n) await sleep(gap); } };
      for (const [sw, sh, sd] of [[390, 844, 3], [375, 667, 2], [430, 932, 3], [1440, 900, 1]]) {
        const tag = sw === 390 ? '' : `-${sw}x${sh}`, few = sw !== 390;
        // THE SKYLIGHT (floor 40)
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=37`, { best: 141 });
        await toFloor(t, 39); await shot(t.p, f(`40-skylight-0-before${tag}`));
        await auto(t.p, 'play'); await through(t, `40-skylight${tag}`, 'window.__ffPlay.state().info.breaks.skylight >= 1', few ? 2 : 5, 40);
        await t.close();
        // THE SPLASHDOWN (floor 120)
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=116`, { best: 141 });
        await toFloor(t, 118); await shot(t.p, f(`41-splashdown-0-before${tag}`));
        await auto(t.p, 'play'); await through(t, `41-splashdown${tag}`, 'window.__ffPlay.state().info.breaks.splash >= 1', few ? 2 : 5, 30);
        if (!few) { await sleep(900); await shot(t.p, f('41-splashdown-6-under')); }
        await t.close();
        // THE BOTTOM (floor 200) — SOLO: the impact, then the seabed cracks open
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=196`, { best: 141 });
        await toFloor(t, 198); await shot(t.p, f(`42-bottom-0-before${tag}`));
        await auto(t.p, 'play'); await through(t, `42-bottom${tag}`, 'window.__ffPlay.state().info.breaks.bottom >= 1', few ? 2 : 3, 120);
        if (!few) await through(t, '42-bottom-crack', 'window.__ffPlay.state().info.breaks.bottom >= 2', 3, 110);
        await t.close();
        // … and as a FINISH (match): the drop onto the seabed, the gold band, by night the firework
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=196&mode=match`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await through(t, `43-finish${tag}`, 'window.__ffPlay.state().info.breaks.bottom >= 1', few ? 2 : 5, few ? 700 : 260, 60);
        if (!few) { await waitFor(t.p, 'window.__ffPlay.state().shown', 6000); await sleep(400); await shot(t.p, f('43-finish-9-card')); }
        await t.close();
      }
    }
    if (want('colours')) {
      // THE COLOUR RULE: each area's floor beside a red slice — and with the colour removed (red must still read)
      for (const [name, floor] of [['rooftop', 22], ['offices', 60], ['speakeasy', 100], ['harbor', 140], ['deep', 180], ['trench', 215]]) {
        t = await open(w, h, dpr, `?seed=look7${q}&floor=${floor - 2}`, { best: name === 'speakeasy' ? 103 : 141 });
        await toFloor(t, floor); await sleep(1900);
        await shot(t.p, f(`50-colour-${name}`));
        await grey(t.p, true); await shot(t.p, f(`51-colour-${name}-greyscale`)); await grey(t.p, false);
        await t.close();
      }
    }
    if (want('paused')) {
      t = await open(w, h, dpr, `?seed=look4${q}`, { best: 88 });
      await start(t); await auto(t.p, 'play');
      await waitFor(t.p, 'window.__ffPlay.state().floor >= 12');
      await hideShow(t.p, true); await sleep(200); await hideShow(t.p, false);
      await sleep(900); await shot(t.p, f('60-paused'));
      await t.close();
    }
    // ---- F5A's scenes (THE LOOK POLISH — the files: f5a-<look>-…): THE WATER beside the owner's two targets (floor 119, the same framing —
    // 390 × 844 @3 + 375 × 667 + 430 × 932), then ?floor=118 → the plunge · THE FINISH (a match's floor 200: the sand, the rocks, the dust,
    // by night the firework, by day the bubbles + the sun rays) · THE ROOF GRAIN (floors 36 – 39)
    const g5 = n => `f5a-${lk}-${n}.png`;
    const SIZES5 = argv.includes('--one-size') ? [[390, 844, 3]] : [[390, 844, 3], [375, 667, 2], [430, 932, 3]], STILL = argv.includes('--still');
    if (want('water')) {
      for (const [sw, sh, sd] of SIZES5) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=117`, { best: 145 });
        await toFloor(t, 119); await sleep(1500);
        await shot(t.p, g5(`10-water-119-${tag}`));
        if (sw === 390) { await sleep(1400); await shot(t.p, g5(`10-water-119-b-later-${tag}`)); }
        if (STILL) { if (t.errs.length || t.logs.length) console.log(lk, 'water', t.errs, t.logs.slice(0, 5)); await t.close(); continue; }
        await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().info.breaks.splash >= 1', 40000);
        for (let i = 0; i < (sw === 390 ? 5 : 2); i++) { await shot(t.p, g5(`11-plunge-${i + 1}-${tag}`)); await sleep(sw === 390 ? 30 : 60); }
        if (t.errs.length) console.log(lk, 'water', t.errs);
        await t.close();
      }
    }
    if (want('finish')) {
      // (the moment in SLOW MOTION — the page's clock at 0.1 ×: each frame is taken at its own time AFTER THE IMPACT, on the page's clock)
      const timed = async (t2, name, tag, at) => {
        const hit = await t2.p.evaluate(() => performance.now());
        for (const ms of at) { await waitFor(t2.p, `performance.now() >= ${hit + ms}`, 60000); await shot(t2.p, g5(`${name}-${String(ms).padStart(4, '0')}ms-${tag}`)); }
      };
      for (const [sw, sh, sd] of SIZES5) {
        const tag = `${sw}x${sh}`;
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=196&mode=match`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 199', 40000); await t.p.evaluate(() => window.__slowmo(0.1)); await shot(t.p, g5(`20-finish-0-before-${tag}`));
        await waitFor(t.p, 'window.__ffPlay.state().info.breaks.bottom >= 1', 90000);
        await timed(t, '20-finish', tag, sw === 390 ? [60, 250, 600, 950, 1150, 1400, 1700, 2100] : [250, 1150, 1700]);
        if (t.errs.length || t.logs.length) console.log(lk, 'finish', t.errs, t.logs.slice(0, 4));
        await t.close();
        if (sw !== 390 || STILL) continue;
        // SOLO: the shelf of sand + the trench's mouth, the impact, the bed cracking open
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=196`, { best: 141 });
        await toFloor(t, 198); await shot(t.p, g5(`21-bottom-solo-0-before-${tag}`));
        await t.p.evaluate(() => window.__slowmo(0.1));
        await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().info.breaks.bottom >= 1', 90000);
        await timed(t, '21-bottom-solo', tag, [120, 500]);
        await t.close();
      }
    }
    if (want('roofgrain')) {
      for (const [sw, sh, sd] of SIZES5) {
        const tag = `${sw}x${sh}`;
        for (const floor of [34, 36, 37, 38, 39]) {
          if (sw !== 390 && floor !== 37 && floor !== 39) continue;
          t = await open(sw, sh, sd, `?seed=look2${q}&floor=${floor - 2}`, { best: 141 });
          await toFloor(t, floor);
          await shot(t.p, g5(`30-roofgrain-${floor}-${tag}`));
          if (t.errs.length) console.log(lk, 'roofgrain', floor, t.errs);
          await t.close();
        }
      }
    }
    // F5A's ADD-ON — THE DAY OFFICES FOG: THE OFFICES beside THE SPEAKEASY + UNDER THE HARBOR (?floor=48 · 90 · 130, 390 × 844 @3) — the
    // floors' fade into the haze must begin at the same height in all three (the files: f5a-<look>-40-fog-<floor>.png)
    if (want('dayfog')) {
      for (const floor of [48, 90, 130]) {
        t = await open(390, 844, 3, `?seed=look2${q}&floor=${floor}`, { best: 141 });
        await toFloor(t, floor + 2); await sleep(2300);
        await shot(t.p, g5(`40-fog-${floor}`));
        await t.close();
      }
    }
    if (want('sizes')) {
      // the other sizes: the opening, a play frame, an arrival's banner, the end
      for (const [sw, sh, sd] of [[375, 667, 2], [430, 932, 3], [1440, 900, 1], [844, 390, 2]]) {
        t = await open(sw, sh, sd, `?seed=look1${q}`, { best: 88 });
        await sleep(1500); await shot(t.p, f(`20-opening-${sw}x${sh}`));
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 4 && window.__ffPlay.state().fl === "bounce"');
        await sleep(250); await shot(t.p, f(`21-play-${sw}x${sh}`));
        await auto(t.p, 'red');
        await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
        await sleep(400); await shot(t.p, f(`22-end-${sw}x${sh}`));
        await t.close();
        t = await open(sw, sh, sd, `?seed=look2${q}&floor=118`, { best: 141 });
        await start(t); await auto(t.p, 'play');
        await waitFor(t.p, 'window.__ffPlay.state().floor >= 120', 30000);
        await sleep(620); await shot(t.p, f(`23-banner-${sw}x${sh}`));
        await t.close();
      }
    }
  }
}

// =============================================================================================================== THE CHECKS
const box = (p, sel) => p.evaluate(s => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(), cs = getComputedStyle(n); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, text: n.textContent, col: cs.color, op: +cs.opacity, fs: parseFloat(cs.fontSize), hidden: !!n.hidden || cs.display === 'none' }; }, sel);
const OUTSIDE = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;
// (F5B — SHARE = THE PICTURE ONLY: the end card's SHARE draws the run's card on the site's share kit — js/daily/share.js's DRAWING helpers +
//  js/config.js's data come with it, lazily; tests/freefall-play.test.mjs proves neither asks a server. Every other path that counts stays out)
const COUNTS = /\/api\/|firebase|gstatic\.com\/firebasejs|\/js\/(profile|progress|board|daily\/(?!share\.js)|vault|chat|admin|screens)\/?|\/js\/(firebase|store|room|host|identity|seat|app)\.js|sw\.js/i;

async function checks1() {
  // ---- THE OPENING (390 × 844 @3)
  const t = await open(390, 844, 3, '?seed=chk1', { best: 88 });
  ok(t.up && !t.errs.length, `the page loads at 390 × 844: its stage + the scene, no error (${t.errs.join(' | ') || 'none'})`);
  await sleep(600);
  let s = await st(t.p);
  ok(/\bis-open\b/.test(s.cls) && !s.started && s.floor === 0 && s.info.pose[0] === 27, `THE OPENING = the live scene: not started, the ball on floor 0, the camera high over the tower top (pitch ${s.info.pose[0]}°)`);
  const ttl = await box(t.p, '.ff-title'), tagl = await box(t.p, '.ff-tagline'), bestL = await box(t.p, '.ff-best'), ft = await box(t.p, '.ff-foot-t'), hint = await box(t.p, '.ff-hint'), sndB = await box(t.p, '.ff-snd'), note = await box(t.p, '.ff-note');
  await waitFor(t.p, "document.querySelector('.ff-title-img').complete && document.querySelector('.ff-tagline').complete && document.querySelector('.ff-glint').classList.contains('is-ready')", 8000);
  const glintOf = () => t.p.evaluate(() => { const a = document.querySelector('.ff-title-img'), b = document.querySelector('.ff-tagline'), g = document.querySelector('.ff-glint'), gs = getComputedStyle(g), an = getComputedStyle(g, '::before'), file = u => u.split('/').pop().split('?')[0]; return { a: [a.complete, a.naturalWidth, file(a.currentSrc), a.alt], b: [b.complete, b.naturalWidth, file(b.currentSrc), b.alt], mask: (gs.webkitMaskImage || gs.maskImage || '').includes(file(a.currentSrc)), ready: g.classList.contains('is-ready'), anim: an.animationName, dur: an.animationDuration, star: getComputedStyle(document.querySelector('.ff-star')).animationName, old: !!document.querySelector('.ff-logo, .ff-free, .ff-fall, .ff-drop, .ff-tag') }; });
  const pics = await glintOf();
  ok(pics.a[0] && pics.a[2] === 'lettering-1170.webp' && pics.a[3] === 'Freefall' && Math.abs(ttl.w / 390 - 0.85) < 0.01 && Math.abs(ttl.x + ttl.w / 2 - 195) < 1 && ttl.y >= 60 && ttl.b <= 844 * 0.35 && !pics.old, `THE OPENING's title = title-05's lettering (${pics.a[2]}, ${pics.a[1]} px at 3×): ${ttl.w.toFixed(0)} pt wide = 85 % of the width, centred, in the top 35 % (${ttl.y.toFixed(0)} … ${ttl.b.toFixed(0)} of 844); F2's tube sign + its dropping ball are gone`);
  ok(pics.b[0] && pics.b[3] === 'Fall as deep as you can' && tagl.y >= ttl.b - 2 && tagl.y - ttl.b < 24 && tagl.w >= 220 && Math.abs(tagl.x + tagl.w / 2 - 195) < 1, `its tagline (${pics.b[2]}) just under it (${tagl.y.toFixed(0)} … ${tagl.b.toFixed(0)}, ${tagl.w.toFixed(0)} pt wide)`);
  ok(pics.ready && pics.mask && pics.anim === 'ff-glint' && pics.dur === '7s' && pics.star === 'ff-star', `THE GLINT: a band swept over the lettering every ${pics.dur} while the opening waits, MASKED to the lettering's own alpha (the mask = the file the picture picked: ${pics.mask}), its star (${pics.star})`);
  ok(bestL.text === 'YOUR BEST 88' && bestL.fs >= 13 && bestL.b <= ttl.y + 8, `"${bestL.text}" at the top`);
  ok(ft.text === 'DRAG TO SPIN' && ft.fs >= 22 && hint.y < ft.y && ft.b < 844 - 20 && hint.y > ttl.b + 200, `at the foot: the thumb-sweep hint · ${ft.text} (${ft.fs.toFixed(0)} px)`);
  ok(sndB && sndB.w >= 44 && sndB.h >= 44 && note.text === 'TEST PAGE — NOTHING COUNTS YET', `SOUNDS ≥ 44 pt (${sndB.w.toFixed(0)} × ${sndB.h.toFixed(0)}) · the note "${note.text}"`);
  ok(s.warmed && s.info.programs >= 9 && /pano:1/.test(s.info.walls) && /offices:1/.test(s.info.walls), `THE WARM FRAME behind the opening: ${s.info.programs} programs built, the rooftop's panorama + the first wall uploaded (${s.info.walls})`);
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
  const apex = await t.p.evaluate(() => window.__ffPlay.apexY()), area = await box(t.p, '.ff-num'), gone = await t.p.evaluate(() => !document.querySelector('.ff-area'));
  ok(area.b <= apex + 1 && gone, `the big number ends above the ball's highest point (${area.b.toFixed(0)} of ${apex.toFixed(0)} pt); F2's small area name under it is gone (the arrival banners name an area)`);
  const numB = await box(t.p, '.ff-num');
  ok(numB.fs >= 64 && s.num === '0' && s.area === 'THE ROOFTOP' && s.areaAttr === 'rooftop', `the big number ${numB.fs.toFixed(0)} px ("${s.num}") · the area ${s.area} (the stage's data-area: ${s.areaAttr})`);

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
  { const i = (await st(t.p)).info; ok(i.fx === 1 && i.flames === 96, `THE BLAZE = NEON FIRE: its flame sprites are in (the atlas uploaded), a fixed pool of ${i.flames}`); }
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
    return { hd: q('.ff-ec-logo').getAttribute('aria-label'), logo: { w: r('.ff-ec-logo-img').width, h: r('.ff-ec-logo-img').height, nat: q('.ff-ec-logo-img').naturalWidth, src: q('.ff-ec-logo-img').currentSrc, cardW: r('.ff-ec').width, stageW: r('.ff-stage').width }, mode: q('.ff-ec-mode').textContent, modeCol: c('.ff-ec-mode'), modeFs: parseFloat(getComputedStyle(q('.ff-ec-mode')).fontSize), cause: q('.ff-ec-cause').textContent, causeCol: c('.ff-ec-cause'), n: q('.ff-ec-n').getAttribute('aria-label'), nFs: parseFloat(getComputedStyle(q('.ff-ec-n')).fontSize), fl: q('.ff-ec-fl').textContent, best: q('.ff-ec-best').textContent, line: q('.ff-ec-line').textContent,
      again: { x: r('.ff-again').left, r: r('.ff-again').right, h: r('.ff-again').height, b: r('.ff-again').bottom, bg: getComputedStyle(q('.ff-again')).backgroundColor, rad: getComputedStyle(q('.ff-again')).borderRadius }, share: { dis: q('.ff-share').disabled, text: q('.ff-share').textContent, h: r('.ff-share').height, x: r('.ff-share').left, ico: !!q('.ff-share svg') }, city: { href: q('.ff-city').getAttribute('href'), text: q('.ff-city').textContent, h: r('.ff-city').height, x: r('.ff-city').left, ico: !!q('.ff-city svg') }, lineB: r('.ff-ec-line').bottom, againT: r('.ff-again').top, hudOp: +getComputedStyle(q('.ff-hud')).opacity,
      last: { same: last.same, cause: last.live.cause, floor: last.live.floor, judge: last.judge.ok, jf: last.judge.floor, holds: last.holds, entries: last.entries } }; });
  ok(e.hd === 'Freefall, solo' && e.logo.nat > 0 &&/lettering-(780|1170)\.webp/.test(e.logo.src) && e.logo.w >= 210 && e.logo.w / e.logo.stageW >= 0.55 && e.logo.w / e.logo.stageW <= 0.62 && Math.abs(e.logo.w / e.logo.h - 780 / 379) < 0.03, `F4B — THE HEADER = THE LOGO: title-05's lettering, ${e.logo.w.toFixed(0)} pt wide = ${(100 * e.logo.w / e.logo.stageW).toFixed(0)} % of the card (≥ 210 pt: the script reads)`);
  ok(e.mode === 'SOLO' && e.modeCol === 'rgb(39, 224, 230)' && e.modeFs >= 12, `… the mode under it: "${e.mode}" in small teal caps (${e.modeFs} px)`);
  ok(e.cause === 'HIT THE RED' && e.causeCol === 'rgb(39, 224, 230)', `the cause "${e.cause}" in teal neon (${e.causeCol}) — never red`);
  ok(e.n === String(s.floor) && e.nFs >= 84 && e.fl === 'FLOORS', `the big number ${e.n} (${e.nFs.toFixed(0)} px) · ${e.fl}`);
  ok(e.best === 'YOUR BEST 88 · AVG —' && /^\d+ BOUNCES? · \d+ BLAZES? · BEST RUN \d+$/.test(e.line), `"${e.best}" in gold · "${e.line}"`);
  ok(e.again.h >= 58 && e.again.x >= 15 && e.again.r <= 375 && e.again.bg === 'rgb(39, 224, 230)' && e.again.rad === '12px' && e.lineB < e.againT, `PLAY AGAIN: one solid teal bar, ${e.again.h.toFixed(0)} pt tall, a rounded rectangle (${e.again.rad}), under the card`);
  ok(!e.share.dis && e.share.text === 'SHARE' && e.share.ico && e.city.text === 'HOME' && e.city.ico && e.city.href === '/' && e.share.x < e.city.x && e.share.h >= 44 && e.city.h >= 44, `F4B — THE UNIVERSAL FOOTER: PLAY AGAIN, then ${e.share.text} | ${e.city.text} (→ ${e.city.href}) with their drawn icons, both ≥ 44 pt — SHARE works (no "SOON")`);
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
  // ---- NEW BEST: the crossing (gold), the end's NEW BEST · n (F5C) + the AVG under it, this phone's best written
  let t = await open(390, 844, 2, '?seed=chk2', { best: 3 });
  await start(t); await auto(t.p, 'play');
  ok(await waitFor(t.p, 'window.__ffPlay.state().newBest'), 'the fall past YOUR BEST = the crossing');
  let s = await st(t.p);
  ok(!/\bis-gold\b/.test(s.cls) && s.floor === 4 && s.call !== 'NEW BEST', `floor ${s.floor}: a best under floor 10 is crossed QUIETLY — no gold, no call over the number (FIX A; the end still says NEW BEST)`);
  ok(s.info.frames > 0 && s.tapeFloor === 3, `YOUR BEST's gold tape lies round floor ${s.tapeFloor}`);
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 12');
  await auto(t.p, 'red');
  await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
  await sleep(300);
  const bl = await box(t.p, '.ff-ec-best'), avl = await box(t.p, '.ff-ec-avg'), stored = await t.p.evaluate(() => localStorage.getItem('ff:play:best'));
  s = await st(t.p);
  ok(bl.text === `NEW BEST · ${s.floor}` && avl.text === 'AVG —' && stored === String(s.floor) && s.best === s.floor, `the end: "${bl.text}" · this phone's best is now ${stored}`);
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
  ok((await box(t.p, '.ff-ec-mode')).text === 'MATCH', 'the mode under the logo says MATCH');
  await t.close();

  // ---- `?floor=N`: the look check — live from floor N, its area's wall, never YOUR BEST
  t = await open(390, 844, 2, '?seed=chk4&floor=128', { best: 88 });
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 130 && window.__ffPlay.state().fl === "bounce"', 30000);
  s = await st(t.p);
  ok(s.floor >= 130 && s.area === 'UNDER THE HARBOR' && /harbor:1/.test(s.info.walls) && s.info.area === 3, `?floor=128: live from floor ${s.floor}, ${s.area}, its wall on the shaft (${s.info.walls})`);
  await auto(t.p, 'red'); await waitFor(t.p, 'window.__ffPlay.state().shown', 40000); await sleep(200);
  const e = await t.p.evaluate(() => { const l = window.__ffPlay.ends[0]; return [l.same, l.isNew, l.best, localStorage.getItem('ff:play:best'), document.querySelector('.ff-ec-best').textContent]; });
  ok(e[0] && !e[1] && e[2] === 88 && e[3] === '88' && e[4] === 'YOUR BEST 88 · AVG —', `… REPLAY = LIVE holds; not a run: YOUR BEST stays ${e[3]} ("${e[4]}")`);
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

  // ---- THE FRESH-EYES REVIEW's finds
  t = await open(390, 844, 2, '?seed=chk9', { best: 88 });
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 3 && window.__ffPlay.state().fl === "bounce"');
  await auto(t.p, 'safe');
  await hideShow(t.p, true); await sleep(80); await hideShow(t.p, false);
  await sleep(1000);                                   // (the count is at 2 …)
  const mid = (await box(t.p, '.ff-hold-n')).text;
  await hideShow(t.p, true); await sleep(300);         // … hidden AGAIN during the 3 · 2 · 1
  const blank = (await box(t.p, '.ff-hold-n')).text;
  await hideShow(t.p, false); await sleep(350);
  s = await st(t.p);
  const again3 = (await box(t.p, '.ff-hold-n')).text;
  await sleep(1300);
  const s5 = await st(t.p);
  ok(mid === '2' && blank === '' && s.held && s.counting && again3 === '3' && s5.held && s5.holds === 1, `hidden AGAIN during the 3 · 2 · 1: the count starts over when the page is back ("${mid}" → hidden → "${again3}"), never skipped; still ONE hold`);
  await waitFor(t.p, '!window.__ffPlay.state().held', 4000);
  // a second finger never steals the drag
  await waitFor(t.p, 'window.__ffPlay.msToLanding() > 420');
  const pt = (id, x) => ({ x, y: 600, id, radiusX: 4, radiusY: 4, force: 1 });
  await auto(t.p, null);
  await waitFor(t.p, 'window.__ffPlay.state().owed === 0', 2000);   // (F3: the checks' own hand may still owe a turn when it is let go — since THE HOLD = EXACT RESUME it comes back mid-flight; the tower rests before the finger's turn is measured)
  const aA = (await st(t.p)).a;
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(1, 120)] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(1, 150)] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(1, 150), pt(2, 300)] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(1, 180), pt(2, 300)] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(1, 208)] });   // (the second finger is gone from the list: it lifted — the first moves on)
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(120);
  s = await st(t.p);
  const got = ((s.a - aA + 6144) % 4096) - 2048, exp = 88 * 4096 / (2 * Math.PI * s.pxPerRad);
  ok(Math.abs(got - exp) <= 5, `a second finger never steals the drag: the first finger's 88 px turn the tower ${got} units (1 : 1 = ${exp.toFixed(0)}) with a second finger down and up on the way`);
  // the tail of a double tap on PLAY AGAIN is not a start
  await auto(t.p, 'red'); await sleep(50);
  await t.p.evaluate(() => { window.__ffPlay.auto = 'safe'; });
  await waitFor(t.p, 'window.__ffPlay.state().shown', 45000);
  await sleep(300);
  const ab = await box(t.p, '.ff-again');
  await drag(t, ab.x + ab.w / 2, ab.y + ab.h / 2, 0, { steps: 1 }); await drag(t, ab.x + ab.w / 2, ab.y + ab.h / 2, 0, { steps: 1 });
  await sleep(150);
  s = await st(t.p);
  const tapped = !s.started && !s.starting && /\bis-open\b/.test(s.cls);
  await sleep(350); await drag(t, 195, 600, 0, { steps: 1 }); await waitFor(t.p, 'window.__ffPlay.state().started', 3000);
  ok(tapped && (await st(t.p)).started, 'a double tap on PLAY AGAIN lands on THE OPENING (its second tap starts nothing); the next press starts the run');
  ok(!t.errs.length, `no page error (${t.errs.join(' | ') || 'none'})`);
  await t.close();
  // a phone held SIDEWAYS: the end card + the hold stay inside the column; a drag on the bars beside the column turns the tower
  t = await open(844, 390, 2, '?seed=chk10', { best: 88 });
  await drag(t, 60, 300, 0, { steps: 1 });            // (a press on the side bar starts the run)
  const side = await waitFor(t.p, 'window.__ffPlay.state().started', 3000);
  await waitFor(t.p, 'window.__ffPlay.msToLanding() > 400');
  const a1 = (await st(t.p)).a;
  await drag(t, 60, 300, 40, { steps: 4 }); await sleep(100);
  const a2 = (await st(t.p)).a;
  await hideShow(t.p, true); await sleep(60); await hideShow(t.p, false); await sleep(300);
  const hT = await box(t.p, '.ff-hold-t'), hN = await box(t.p, '.ff-hold-n'), hL = await box(t.p, '.ff-hold-l');
  await waitFor(t.p, '!window.__ffPlay.state().held', 4000);
  await auto(t.p, 'safe'); await waitFor(t.p, 'window.__ffPlay.state().shown', 45000); await sleep(300);
  const stg = await box(t.p, '.ff-stage'), agn = await box(t.p, '.ff-again'), agT = await box(t.p, '.ff-again-t'), cty = await box(t.p, '.ff-city'), ecn = await box(t.p, '.ff-ec-n'), ecl = await box(t.p, '.ff-ec-line');
  ok(side && a2 !== a1, 'sideways (844 × 390): a press + a drag on the bar beside the column start the run and turn the tower');
  ok(hT.b <= hN.y + 1 && hN.b <= hL.y + 1, 'sideways: PAUSED · the count · the pauses left stand clear of each other');
  ok(agT.r <= stg.r && agn.r <= stg.r && cty.r <= stg.r && cty.b <= 390 && ecn.b <= ecl.y + 1 && ecl.r <= stg.r + 1 && ecl.b < agn.y, `sideways: the end card stays inside its ${stg.w.toFixed(0)} px column (PLAY AGAIN's words to ${agT.r.toFixed(0)}, CITY to ${cty.r.toFixed(0)} of ${stg.r.toFixed(0)})`);
  await shot(t.p, 'chk-07-sideways-end.png');
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
    const stg = await box(t.p, '.ff-stage'), ttl = await box(t.p, '.ff-title'), ft = await box(t.p, '.ff-foot-t'), tagl = await box(t.p, '.ff-tagline');
    ok(ttl.x >= stg.x + 6 && ttl.r <= stg.r - 6 && Math.abs(ttl.w / stg.w - 0.85) < 0.01 && ttl.b <= stg.h * 0.37 && tagl.b < ft.y && ft.b < h, `${w} × ${h}: the opening fits its column (the lettering ${ttl.x.toFixed(0)} … ${ttl.r.toFixed(0)} of ${stg.x.toFixed(0)} … ${stg.r.toFixed(0)}, 85 % of it, in its top ${(100 * ttl.b / stg.h).toFixed(0)} %)`);
    await start(t); await sleep(1200);
    s = await st(t.p);
    const apex = await t.p.evaluate(() => window.__ffPlay.apexY()), area = await box(t.p, '.ff-num'), below = s.frame.rows.filter(y => y < 1).length - 1;
    ok(s.frame.ball.d >= 34 && area.b <= apex + 1 && below >= 4, `${w} × ${h}: the ball ${s.frame.ball.d.toFixed(0)} pt, the HUD ends above it (${area.b.toFixed(0)} of ${apex.toFixed(0)}), ${below} floors below`);
    await auto(t.p, 'play'); await waitFor(t.p, 'window.__ffPlay.state().floor >= 11'); await auto(t.p, 'red');
    await waitFor(t.p, 'window.__ffPlay.state().shown', 40000); await sleep(300);
    const ag = await box(t.p, '.ff-again'), cy = await box(t.p, '.ff-city'), ln = await box(t.p, '.ff-ec-line'), hd = await box(t.p, '.ff-ec-hd'), sb = await box(t.p, '.ff-snd');
    ok(cy.b <= h - 20 && ln.b < ag.y && hd.y >= sb.b - 2 && ag.h >= 58, `${w} × ${h}: the end card under the SOUNDS row, PLAY AGAIN + SHARE | CITY on the screen (foot ${cy.b.toFixed(0)} of ${h})`);
    await t.close();
  }
}

// =============================================================================================================== THE DAY LOOK (F3)
async function checks3() {
  // ---- `?look=day`: the day scene, the page's inks, the day pictures — and nothing asked of a server
  let t = await open(390, 844, 3, '?seed=day1&look=day', { best: 88 });
  await waitFor(t.p, '/pano-day:1/.test(window.__ffPlay.state().info.walls) && /offices-day:1/.test(window.__ffPlay.state().info.walls)', 12000);
  let s = await st(t.p);
  const pics = t.reqs.filter(r => /\/walls\/|\/sky\/|skyline/.test(r)).map(r => r.split('/').pop().split('?')[0]);
  ok(t.up && !t.errs.length && s.look === 'day' && s.lookAttr === 'day' && s.info.look === 'day' && /pano-day:1/.test(s.info.walls), `?look=day: the page loads in THE DAY LOOK — the scene, the stage's data-look (${s.lookAttr}), no error (${t.errs.join(' | ') || 'none'})`);
  ok(pics.length >= 2 && pics.every(p => /-day\.webp$/.test(p)), `by day only the DAY pictures are asked for: ${pics.join(' · ')}`);
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 3 && window.__ffPlay.state().fl === "bounce"');
  await sleep(300);
  let num = await box(t.p, '.ff-num'), bestL = await box(t.p, '.ff-best');
  ok(num.col === 'rgb(255, 255, 255)' && bestL.col === 'rgb(255, 255, 255)', `FIX A — THE DAY HUD: the big number WHITE (${num.col}) in its navy outline, YOUR BEST white in a dark edge (${bestL.col})`);
  // THE LOOK LOCK (FIX A — the review's M1): a look asked for mid-run (the console's GAME LOOK, AUTO's sun) WAITS for the run's end
  await t.p.evaluate(() => window.__ffPlay.setLook('night')); await sleep(400);
  s = await st(t.p);
  ok(s.look === 'day' && s.lookWant === 'night' && s.lookAttr === 'day' && s.info.look === 'day' && !s.over, `THE LOOK LOCK: night asked for mid-run — the run stays in its DAY look (scene ${s.info.look}, stage ${s.lookAttr}, waiting: ${s.lookWant}; floor ${s.floor})`);
  await t.p.evaluate(() => window.__ffPlay.setLook('day')); await sleep(300);
  s = await st(t.p);
  ok(s.look === 'day' && s.lookWant === 'day' && s.info.look === 'day', `…asked back for day: nothing to wait for (${s.lookWant})`);
  // THE LOST CONTEXT by day: the scene is rebuilt IN THE DAY LOOK
  const lost = await t.p.evaluate(() => window.__ffPlay.lose());
  const back = await waitFor(t.p, 'window.__ffPlay.state().rebuilds >= 1', 6000);
  s = await st(t.p);
  ok(!lost || (back && s.info.look === 'day' && s.lookAttr === 'day'), `a lost context by day: the scene is rebuilt in the day look (${s.rebuilds} rebuild, look ${s.info.look})`);
  await auto(t.p, 'red');
  await waitFor(t.p, 'window.__ffPlay.state().shown', 40000);
  const e = await t.p.evaluate(() => window.__ffPlay.ends[0]);
  ok(e && e.same && e.live.over && !t.errs.length, `REPLAY = LIVE on a run whose look was asked to turn twice (held by THE LOOK LOCK) and whose context was lost (floor ${e && e.live.floor}, ${e && e.live.cause} — the first ten floors have no red: the lights took it; errors: ${t.errs.join(' | ') || 'none'})`);
  await t.p.evaluate(() => window.__ffPlay.setLook('night'));
  const turned = await waitFor(t.p, "window.__ffPlay.state().look === 'night' && window.__ffPlay.state().info.look === 'night' && window.__ffPlay.state().lookAttr === 'night'", 3000);
  ok(turned, 'THE LOOK LOCK lets go at the end card: a look asked for there turns the scene at once');
  ok(!t.reqs.some(r => COUNTS.test(r)) && !t.sockets.length && t.reqs.every(r => r.startsWith('GET ') && (r.includes(BASE) || OUTSIDE.test(r.slice(4)))), `by day too: ${t.reqs.length} requests — its own static files, three.js, the fonts; nothing that counts, no socket`);
  await t.close();
  // ---- UNDER THE HARBOR by day: THE CAUSTICS on the slices, the rising BUBBLES (a fixed pool — the tier's count); by night neither
  t = await open(390, 844, 3, '?seed=day2&look=day&floor=124&tier=2');
  await start(t); await auto(t.p, 'play');
  const wet = await waitFor(t.p, 'window.__ffPlay.state().floor >= 126 && window.__ffPlay.state().info.moteKind === 1 && window.__ffPlay.state().info.motes === 48 && window.__ffPlay.state().info.caust > 0.9', 30000);
  s = await st(t.p);
  ok(wet && s.areaAttr === 'harbor' && /harbor-day:1/.test(s.info.walls), `UNDER THE HARBOR by day (floor ${s.floor}): the caustics on the slices (${s.info.caust.toFixed(2)}), ${s.info.motes} bubbles of a pool of 48, its day wall (${s.info.walls})`);
  await t.p.evaluate(() => window.__ffPlay.setTier(0));
  const trimmed = await waitFor(t.p, 'window.__ffPlay.state().info.motes === 18 && window.__ffPlay.state().info.caust < 0.05', 6000);
  s = await st(t.p);
  ok(trimmed, `tier 0 trims it: ${s.info.motes} bubbles, the caustics on the wall only (${s.info.caust.toFixed(2)} on the slices)`);
  await t.close();
  // (FIX A — THE LOOK LOCK: a look never turns mid-run — the night run opens in its own look)
  t = await open(390, 844, 3, '?seed=day2&look=night&floor=124&tier=2');
  await start(t); await auto(t.p, 'play');
  const wetN = await waitFor(t.p, 'window.__ffPlay.state().floor >= 126 && window.__ffPlay.state().info.motes > 0 && window.__ffPlay.state().info.caust > 0.5', 30000);
  // (F5B — THE WATER SWAP: by night UNDER THE HARBOR wears the day's water too — its bubbles (cyan) + the caustics' shimmer on the slices)
  s = await st(t.p);
  ok(wetN && !t.errs.length, `by night too (F5B — THE WATER SWAP): ${s.info.motes} bubbles, the caustics on the slices (${s.info.caust.toFixed(2)})`);
  await t.close();
  // ---- the other areas' motes by day: dust in the two rooms, drifting particles in THE DEEP, none on the rooftop
  for (const [floor, kind, area] of [[2, 0, 'rooftop'], [44, 3, 'offices'], [164, 2, 'deep']]) {
    t = await open(390, 844, 2, `?seed=day4&look=day&floor=${floor}&tier=2`);
    await start(t); await auto(t.p, 'play');
    const got = await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().info.moteKind === ${kind} && window.__ffPlay.state().areaAttr === '${area}'`, 30000);
    s = await st(t.p);
    ok(got && !t.errs.length, `${area} by day (floor ${s.floor}): the motes' kind ${s.info.moteKind} (${['none', 'bubbles', 'drifting particles', 'dust'][s.info.moteKind]}), data-area ${s.areaAttr}`);
    await t.close();
  }
  // ---- THE ARRIVAL BANNERS (F3 · F3B — the owner: UNDER THE BIG NUMBER, never over a floor below the ball; THE STUTTERS: every band of the run
  // baked BEHIND THE OPENING, kept — an arrival bakes nothing)
  const ALL_BANDS = 'THE OFFICES|FLOOR 40,THE SPEAKEASY|FLOOR 80,UNDER THE HARBOR|FLOOR 120,THE DEEP|FLOOR 160,YOU HIT THE BOTTOM|FLOOR 200,THE TRENCH|FLOOR 201,THE TRENCH|LAP 2 · FLOOR 241';
  for (const lk of ['night', 'day']) {
    t = await open(390, 844, 3, `?seed=bnr1&look=${lk}&floor=77`);
    await waitFor(t.p, 'window.__ffPlay.state().banner.baked >= 7', 6000);
    await sleep(700);   // (the fonts are in: the bands are settled)
    const ahead = (await st(t.p)).banner;
    ok(ahead.keys.join(',') === ALL_BANDS && ahead.shows === 0, `${lk}: behind the opening EVERY band of the run is baked (${ahead.baked}: the areas' six + the trench's first lap)`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().banner.shows === 1', 30000);
    await sleep(520);
    s = await st(t.p);
    const sel = bandSel(s), band = await box(t.p, sel), numB = await box(t.p, '.ff-num'), apex = await t.p.evaluate(() => window.__ffPlay.apexY());
    const ink = await t.p.evaluate(q => { const b = document.querySelector(q), cs = getComputedStyle(b), c = b.querySelector('canvas'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let on = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) on++; return { bg: cs.backgroundImage, rule: cs.borderTopColor, on, w: c.width, words: b.querySelector('.ff-banner-n').textContent + ' / ' + b.querySelector('.ff-banner-s').textContent, hidden: getComputedStyle(b.querySelector('.ff-banner-n')).color, kids: document.querySelector('.ff-banners').children.length }; }, sel);
    ok(s.floor >= 80 && s.banner.showing && band.op > 0.9 && s.banner.bakes === ahead.bakes && ink.kids === 8, `${lk}: the ball reaches floor 80 — the band crosses (opacity ${band.op.toFixed(2)}); NOTHING was baked or built in the run (${s.banner.bakes} bakes, all behind the opening; the same ${ink.kids - 1} band nodes)`);
    ok(band.x <= 0.5 && band.r >= 389.5 && band.h >= 40 && band.y >= numB.b && band.b <= apex + 0.5, `${lk}: the band lies UNDER THE BIG NUMBER (${band.y.toFixed(0)} … ${band.b.toFixed(0)} of 844 — the number's foot ${numB.b.toFixed(0)}) and ends above the ball's highest point (${apex.toFixed(0)}): never over a floor below the ball`);
    ok(ink.words === 'THE SPEAKEASY / FLOOR 80' && ink.on > 250 && ink.w === 1170 && ink.hidden === 'rgba(0, 0, 0, 0)' && (lk === 'day' ? /236, 247, 255/.test(ink.bg) && ink.rule !== 'rgb(255, 79, 168)' : /8, 4, 20/.test(ink.bg) && ink.rule === 'rgb(255, 79, 168)'), `${lk}: "${ink.words}" BAKED into the band's canvas (${ink.on} inked samples at 3×), the DOM words transparent under it; ${lk === 'day' ? 'a frosted pale band' : 'a dark band between two thin pink rules'}`);
    await sleep(1500);
    const after = await box(t.p, sel);
    s = await st(t.p);
    ok(after.op < 0.05 && s.banner.bakes === ahead.bakes && !t.errs.length, `${lk}: it is gone after 1.6 s (opacity ${after.op.toFixed(2)}); the next ones were ready all along (${s.banner.bakes} bakes)`);
    // F5B — EVERY AREA's BAND IS UNDER THE HARBOR's (the owner: floor 120's is "perfect, out of the way, up long enough to read"): the same
    // box, the same class (no area of its own — only THE BOTTOM's gold), the same canvas — 40 · 80 · 120 · 160 · the trench + its laps
    const boxes = await t.p.evaluate(() => [...document.querySelectorAll('.ff-banners > .ff-banner')].map(b => { const r = b.getBoundingClientRect(); return { k: b.querySelector('.ff-banner-n').textContent, cls: b.className.replace(/\s*is-baked/, ''), y: r.top, h: r.height, x: r.left, w: r.width, cw: b.querySelector('canvas').width, ch: b.querySelector('canvas').height }; }));
    const ref = boxes.find(b => b.k === 'UNDER THE HARBOR'), rest = boxes.filter(b => !/is-gold/.test(b.cls));
    ok(!!ref && rest.length >= 5 && rest.every(b => b.cls === 'ff-banner' && b.y === ref.y && b.h === ref.h && b.x === ref.x && b.w === ref.w && b.cw === ref.cw && b.ch === ref.ch), `${lk}: every area's band = UNDER THE HARBOR's (${rest.map(b => b.k).join(' · ')}): ${ref ? `${ref.y.toFixed(0)} … ${(ref.y + ref.h).toFixed(0)} of 844, ${ref.w.toFixed(0)} wide` : 'no 120 band'} — one box, one class, one 1.6 s (banner.js#BANNER_MS)`);
    await t.close();
  }
  // THE BOTTOM (200) = the GOLD band "YOU HIT THE BOTTOM" (with the impact); THE TRENCH (201) crosses after it; a later LAP names itself
  t = await open(390, 844, 2, '?seed=bnr2&floor=198');
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().banner.shows === 1', 30000);
  const first = (await st(t.p)).banner, goldInk = await t.p.evaluate(q => getComputedStyle(document.querySelector(q)).borderTopColor, bandSel({ banner: first }));
  await waitFor(t.p, 'window.__ffPlay.state().banner.shows === 2', 12000);
  s = await st(t.p);
  ok(first.key === 'YOU HIT THE BOTTOM|FLOOR 200' && first.gold && goldInk === 'rgb(255, 200, 60)' && s.banner.key === 'THE TRENCH|FLOOR 201' && !s.banner.gold && s.floor >= 201, `floor 200: the GOLD band "${first.key.replace('|', '" / "')}" (its rules ${goldInk}), then — after it — "${s.banner.key.replace('|', '" / "')}" (the ball on floor ${s.floor})`);
  await t.close();
  t = await open(390, 844, 2, '?seed=bnr3&floor=239');
  await waitFor(t.p, 'window.__ffPlay.state().banner.baked >= 7', 6000);
  await start(t); await auto(t.p, 'play');
  const lapShown = await waitFor(t.p, 'window.__ffPlay.state().banner.shows === 1 && window.__ffPlay.state().floor >= 241', 30000);
  const lapKey = (await st(t.p)).banner.key;
  ok(lapKey === 'THE TRENCH|LAP 2 · FLOOR 241' && lapShown && !t.errs.length, `THE TRENCH's second lap names itself: "${lapKey.replace('|', '" / "')}"`);
  await t.close();
  // a narrow phone + a phone held sideways: the longest name fits its band — still under the number, above the ball's highest point
  for (const [w, h] of [[375, 667], [430, 932], [844, 390]]) {
    t = await open(w, h, 2, '?seed=bnr4&floor=118');
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().banner.shows === 1', 30000);
    await sleep(500);
    const sel = bandSel(await st(t.p)), band = await box(t.p, sel), nm = await box(t.p, `${sel} .ff-banner-n`), stg = await box(t.p, '.ff-stage'), numB = await box(t.p, '.ff-num'), apex = await t.p.evaluate(() => window.__ffPlay.apexY());
    ok(nm.text === 'UNDER THE HARBOR' && nm.x >= stg.x + 2 && nm.r <= stg.r - 2 && band.y >= numB.b - 0.5 && band.b <= apex + 1, `${w} × ${h}: "${nm.text}" fits its band (${nm.x.toFixed(0)} … ${nm.r.toFixed(0)} of ${stg.x.toFixed(0)} … ${stg.r.toFixed(0)}), under the number (${numB.b.toFixed(0)}), above the ball's highest point (${band.b.toFixed(0)} ≤ ${apex.toFixed(0)})`);
    await t.close();
  }
  // ---- AUTO (no `?look=`): the phone's clock at once, then the site's own sun rule — one look, the page's attribute = the picture's; nothing asked of a server
  t = await open(390, 844, 2, '?seed=day3', { auto: true });
  await sleep(900);
  s = await st(t.p);
  ok(t.up && !t.errs.length && (s.look === 'day' || s.look === 'night') && s.lookAttr === s.look && s.info.look === s.look, `AUTO: the look is the ${s.look}'s (the phone's clock, then the sun rule) — the stage + the scene agree`);
  ok(!t.reqs.some(r => /\/api\//.test(r)) && t.reqs.some(r => /core\/sky\.js/.test(r)), 'AUTO asks the SITE\'s own sun rule (core/sky.js — worked out on the phone): nothing is asked of /api');
  await t.close();
}

// =============================================================================================================== F3B — THE ROOF BELOW + THE BREAKTHROUGHS
async function checks4() {
  let t, s;
  const P = (p, js) => p.evaluate(js);
  const wanted = p => p.evaluate(() => window.__ffPlay.sfx.wanted().map(q => `${q.id}+${q.delay}`));
  // ---- THE ROOF BELOW: the title screen has the roof's painting + its city + the 3D skylight riding on it; EVERY picture of the look is in before the first drag
  for (const lk of ['night', 'day']) {
    t = await open(390, 844, 2, `?seed=f3b1&look=${lk}&tier=2`);
    await waitFor(t.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
    s = await st(t.p);
    const names = s.info.walls.split(' ').map(x => x.split(':')[0]).sort().join(' ');
    ok(s.info.landed === 13 && s.info.roof[0] === 1 && s.info.roof[2] === 1 && s.info.roof[3] === 1 && s.info.breaks.deck && s.info.breaks.glass && !t.errs.length, `${lk} — THE TITLE SCREEN: the roof below (its painting + its city in, all of it there) with the 3D skylight riding on it; ${s.info.landed} pictures in before the first drag — FIX A: + the water's ripple map (${names})`);
    const before = s.info.landed, shows0 = s.info.roof[1];
    await start(t); await auto(t.p, 'gap');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 30', 30000);
    s = await st(t.p);
    ok(s.info.roof[1] < shows0 * 0.6 && s.info.roof[0] === 1 && s.info.breaks.skylight === 0, `${lk}: by floor ${s.floor} the roof has RISEN toward you (a world unit shows ${(shows0 / s.info.roof[1]).toFixed(2)}× the painting it did on floor 0)`);
    // THE SKYLIGHT (floor 40)
    await waitFor(t.p, 'window.__ffPlay.state().info.breaks.skylight >= 1', 30000);
    await sleep(700);
    s = await st(t.p);
    const w = await wanted(t.p);
    ok(s.info.breaks.played === 1 && s.info.roof[0] < 0.05 && s.floor >= 40 && w.includes('skylight+0.133') && !w.some(x => x.startsWith('area-arrive')), `${lk} — THE SKYLIGHT: the ball breaks through at floor 40 (played once; the roof below is gone, the room under it open) — its own sound at the hit (${w.filter(x => /skylight/.test(x)).join(' ')}), no arrival jingle over it`);
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 48', 30000);
    s = await st(t.p);
    ok(s.info.landed === before && s.info.breaks.skylight === 2 && !s.hitchLog.some(h => h.why === 'pic' || h.why === 'band') && !t.errs.length, `${lk}: NO picture landed and NO band was baked in the run (${s.info.landed} pictures still; ${s.hitches} long frames: ${s.hitchLog.map(h => `${h.why} ${h.ms} ms @${h.floor}`).join(', ') || 'none'})`);
    await t.close();
  }
  // a run that starts under the roof: the skylight just is not there (no effect played)
  t = await open(390, 844, 2, '?seed=f3b2&floor=46');
  await start(t); await sleep(600);
  s = await st(t.p);
  ok(s.info.breaks.skylight === 2 && s.info.breaks.played === 0 && s.info.roof[0] < 0.05, `?floor=46: the skylight is long gone (nothing played), the roof below with it`);
  await t.close();
  // ---- THE SPLASHDOWN (floor 120): the plunge, the waterline's sweep, the mix muffled, its own sound
  for (const lk of ['night', 'day']) {
    t = await open(390, 844, 2, `?seed=f3b3&look=${lk}&floor=116`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 118 && window.__ffPlay.state().info.breaks.water', 30000);
    s = await st(t.p);
    ok(s.info.breaks.water && s.info.breaks.splash === 0 && s.info.breaks.line === -2, `${lk}: on floor ${s.floor} the water lies under the last speakeasy floors (a real plane, calm)`);
    await waitFor(t.p, 'window.__ffPlay.state().info.breaks.splash >= 1', 30000);
    const mid = await st(t.p);
    await waitFor(t.p, 'window.__ffPlay.state().info.breaks.splash === 2', 4000);
    s = await st(t.p);
    const w = await wanted(t.p);
    ok(mid.info.breaks.splash >= 1 && s.info.breaks.splash === 2 && !s.info.breaks.water && s.muffles === 1 && w.includes('splashdown+0.133') && !t.errs.length, `${lk} — THE SPLASHDOWN: the plunge at floor 120, THE WATERLINE swept up the screen (the plane is gone: under water), the mix muffled once, its own sound at the plunge (splash ${mid.info.breaks.splash} → ${s.info.breaks.splash}, water ${s.info.breaks.water}, muffles ${s.muffles}, wanted ${w.filter(x => x.startsWith('splash')).join(' ') || '—'}, errors ${t.errs.length}${t.errs.length ? ': ' + String(t.errs[0]).slice(0, 160) : ''})`);
    await t.close();
  }
  // ---- THE BOTTOM (floor 200), SOLO: the seabed rises into view, the impact, the gold band, then it CRACKS OPEN into THE TRENCH
  t = await open(390, 844, 2, '?seed=f3b4&floor=196');
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 198 && window.__ffPlay.state().info.breaks.bed', 30000);
  s = await st(t.p);
  ok(s.info.breaks.bed && s.info.breaks.bottom === 0, `SOLO: on floor ${s.floor} the seabed has risen into view`);
  ok(s.info.breaks.mouth > 1 && s.info.breaks.rocks === 9, `SOLO — THE TRENCH's MOUTH (the fresh-eyes review): the bed is open round the tower + along the cleft toward the viewer (${s.info.breaks.mouth} wide a side) — the floor under the ball is in sight before, on and after floor 200`);
  await waitFor(t.p, 'window.__ffPlay.state().info.breaks.bottom >= 2', 30000);
  s = await st(t.p);
  let w = await wanted(t.p);
  ok(s.floor >= 201 && !s.over && w.includes('bottom+0.3') && s.info.breaks.played >= 2, `SOLO — THE BOTTOM: the impact (bottom.mp3 at the hit), then the seabed CRACKS OPEN — the run falls on into THE TRENCH (floor ${s.floor}, still live)`);
  await waitFor(t.p, 'window.__ffPlay.state().info.breaks.bottom === 3', 5000);
  s = await st(t.p);
  ok(s.info.breaks.bottom === 3 && !s.info.breaks.bed && !w.some(x => x.startsWith('fireworks')) && !t.errs.length, 'the bed is gone (endless, as before) — no firework in solo');
  await t.close();
  // ---- THE BOTTOM as a FINISH (match + daily): MADE IT — the moment plays before the card, then the run is handed on (the hook F4 wires)
  for (const lk of ['night', 'day']) {
    t = await open(390, 844, 2, `?seed=f3b5&look=${lk}&mode=match&floor=196`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, "window.__ffPlay.state().st === 'made'", 30000);
    const t0 = Date.now();
    await sleep(1500);
    s = await st(t.p);
    const midShown = s.shown, midBand = s.banner, midFin = s.finished;
    await waitFor(t.p, 'window.__ffPlay.state().shown', 6000);
    const cardMs = Date.now() - t0;
    s = await st(t.p);
    w = await wanted(t.p);
    const words = await t.p.evaluate(() => document.querySelector('.ff-ec-cause').textContent);
    ok(!midShown && midBand.key === 'YOU HIT THE BOTTOM|FLOOR 200' && midBand.gold && s.info.breaks.bottom === 1 && cardMs >= 2200 && words === 'YOU HIT THE BOTTOM', `${lk} — THE FINISH: the ball drops onto the seabed, the gold band, the card waits for the moment (${cardMs} ms) — "${words}"`);
    ok(midFin && midFin.floor === 200 && midFin.same === null && s.finished && s.finished.floor === 200 && s.finished.mode === 'match' && s.finished.same === true && s.finished.judged === true && s.finished.look === lk, `${lk}: THE FINISH's HOOK — the run handed on once, AT THE made EVENT (there before the card): floor ${s.finished && s.finished.floor}; with the card: REPLAY = LIVE, the judge's own verdict`);
    ok(s.info.breaks.mouth === 0 && s.info.breaks.rocks === 14, `${lk}: a finish's bed is whole (no mouth) — rocks in front of the ball too (${s.info.breaks.rocks})`);
    // (F5A — THE DAY CELEBRATION: a finish celebrates in BOTH looks — by night the firework, by day the bubbles + the sun rays — with the same soft fireworks.mp3)
    ok(w.includes('bottom+0.3') && w.includes('fireworks+1.2') && s.info.breaks.played >= 3 && !t.errs.length, `${lk}: bottom.mp3 at the hit, then ${lk === 'night' ? 'the FIREWORK' : 'THE DAY CELEBRATION (the bubbles + the sun rays)'} (the fireworks' sound softly, 0.9 s on; the bursts played: ${s.info.breaks.played})`);
    await t.close();
  }
  // ---- PAUSED: a dark, BLURRED cover over the tower while held
  t = await open(390, 844, 2, '?seed=f3b6');
  await start(t); await auto(t.p, 'play');
  await waitFor(t.p, 'window.__ffPlay.state().floor >= 3', 20000);
  await hideShow(t.p, true); await sleep(150); await hideShow(t.p, false); await sleep(300);
  const cover = await t.p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.ff-hold')); return { blur: cs.backdropFilter || cs.webkitBackdropFilter || '', bg: cs.backgroundColor, n: document.querySelector('.ff-hold-n').textContent, l: document.querySelector('.ff-hold-l').textContent }; });
  s = await st(t.p);
  ok(s.held && /blur\(18px\)/.test(cover.blur) && /rgba\(5, 3, 13, 0\.8\)/.test(cover.bg) && /^[123]$/.test(cover.n) && /PAUSES LEFT/.test(cover.l), `PAUSED: a dark, blurred cover over the tower (${cover.blur} on ${cover.bg}) — the count "${cover.n}" + "${cover.l}" sharp on it`);
  await t.close();
  // ---- THE DARKNESS EASES WITH DEPTH on the page: a ball that stops is out 6 s after its last floor up to floor 100, 8 s from floor 160
  for (const [floor, ticks] of [[60, 360], [170, 480]]) {
    t = await open(390, 844, 2, `?seed=f3b7&floor=${floor}`);
    await start(t); await auto(t.p, 'safe');
    await waitFor(t.p, 'window.__ffPlay.state().over', 25000);
    const r = await t.p.evaluate(() => { const P = window.__ffPlay, r = P.result(); return { cause: r.cause, floor: r.floor, stood: r.end - r.tick }; });
    await waitFor(t.p, 'window.__ffPlay.ends.length === 1', 4000);
    const same = await t.p.evaluate(() => window.__ffPlay.ends[0].same);
    ok(r.cause === 'dark' && r.stood === ticks && same, `a ball that stops on floor ${r.floor}: THE LIGHTS WENT OUT ${(r.stood / 60).toFixed(0)} s after it got there (${r.stood} ticks) — REPLAY = LIVE`);
    await t.close();
  }
  // ---- THE COLOURS: YOUR BEST's tape on a GOLD floor (THE SPEAKEASY) is white with a dark edge
  t = await open(390, 844, 2, '?seed=f3b8&floor=84', { best: 90 });
  await start(t); await sleep(500);
  const tape = await t.p.evaluate(() => { const v = window.__ffPlay.view; return v.tapeInfo ? v.tapeInfo() : null; });
  ok(tape && tape.dark === 1 && tape.col[0] > 1 && tape.col[1] > 1 && tape.col[2] > 1, `YOUR BEST on floor 90 (THE SPEAKEASY's gold): the tape is WHITE with a dark edge (${tape && tape.col.map(x => x.toFixed(2)).join(' ')})`);
  await t.close();
}

// =============================================================================================================== F4A — GROUP 0: THE F3B FIXES
/** the picture's colour at points of the canvas ([[x, y] | null …], 0 … 1), right after the stage's own frame: the mean of an 8 × 8 css px patch at each, two frames */
const coloursAt = (p, pts) => p.evaluate(pts => new Promise(res => {
  const c = document.querySelector('canvas.ff-canvas'), k = c.width / c.clientWidth, n = Math.max(4, Math.round(8 * k)), o = document.createElement('canvas');
  o.width = n; o.height = n;
  const g = o.getContext('2d', { willReadFrequently: true }), sums = pts.map(() => [0, 0, 0]);
  let left = 2;
  const one = () => requestAnimationFrame(() => {
    pts.forEach((pt, q) => {
      if (!pt) return;
      g.drawImage(c, Math.round(pt[0] * c.width - n / 2), Math.round(pt[1] * c.height - n / 2), n, n, 0, 0, n, n);
      const d = g.getImageData(0, 0, n, n).data;
      for (let i = 0; i < d.length; i += 4) { sums[q][0] += d[i]; sums[q][1] += d[i + 1]; sums[q][2] += d[i + 2]; }
    });
    if (--left) one(); else res(sums.map((s, q) => (pts[q] ? s.map(v => v / (2 * n * n)) : null)));
  });
  one();
}), pts);
/** a colour → its lightness (0 … 255) + how colourful it is (max − min, 0 … 255) */
const lumOf = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], chromaOf = c => Math.max(...c) - Math.min(...c);
const HAZE = [['THE SKYLIGHT', 40, 'skylight'], ['THE SPLASHDOWN', 120, 'splash'], ['THE BOTTOM', 200, 'bottom']];
/** THE HAZE AFTER A BREAKTHROUGH (the owner's phone: by day the floors 1–3 floors past the splashdown were ~20 % less colourful + brighter):
 *  the ball goes through and stays on the first floor under it; the colour of the three floors BELOW it (a safe slice's top on each — the
 *  same points of the picture each time: the tower stands still under a ball that only bounces) is read 0.3 s · 0.5 s · 1 s after the
 *  hit and held against 3.5 s after it — a normal floor of that area, every effect long gone. Both looks. `measureOnly` = print only. */
async function haze(measureOnly = false) {
  const pc = v => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} %`;
  for (const lk of ['day', 'night']) for (const [name, F, key] of HAZE) {
    const t = await open(390, 844, 2, `?seed=f4a-haze&look=${lk}&floor=${F - 2}&tier=2${F === 200 ? '' : ''}`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, `window.__ffPlay.state().info.breaks.${key} >= 1`, 30000);
    const hit = Date.now();
    await auto(t.p, 'safe');
    const s0 = await st(t.p);
    // (the points are found again at every reading: the camera still glides down to the ball's floor for a moment after the hit)
    const read = async () => coloursAt(t.p, await t.p.evaluate(() => [1, 2, 3].map(d => window.__ffPlay.spot(d))));
    const reads = [];
    for (const ms of [300, 500, 1000, 3500]) {
      await sleep(Math.max(0, ms - (Date.now() - hit)));
      const at = Date.now() - hit;
      reads.push({ at, c: await read() });
      if (OUT) await shot(t.p, `f4a-haze-${lk}-${F}-${String(ms).padStart(4, '0')}.png`);
    }
    const s1 = await st(t.p), still = s1.floor === s0.floor && !s1.over && s1.a === s0.a, ref = reads[3].c;
    const med = v => { const a = v.slice().sort((x, y) => x - y); return a.length ? a[Math.floor((a.length - 1) / 2)] : 9; };
    const parts = [];
    let worst = 0, n = 0;
    for (let k = 0; k < 3; k++) {
      const row = [], dls = [], dcs = [];
      for (let i = 0; i < 3; i++) {
        if (!ref[i] || !reads[k].c[i]) continue;
        const dl = (lumOf(reads[k].c[i]) - lumOf(ref[i])) / Math.max(8, lumOf(ref[i])), dc = (chromaOf(reads[k].c[i]) - chromaOf(ref[i])) / 255;
        dls.push(Math.abs(dl)); dcs.push(Math.abs(dc));
        row.push(`+${i + 1}: ${pc(dl)} / ${pc(dc)}`);
      }
      // (a WASH lies on every floor — a shard, a bar, a bubble crossing ONE point is the moment's own debris: the middle one of the three floors' readings decides)
      if (dls.length >= 2) { worst = Math.max(worst, med(dls), med(dcs)); n++; }
      parts.push(`${(reads[k].at / 1000).toFixed(2)} s — ${row.join(' · ')}`);
    }
    const line = `${lk} — ${name}: the three floors under floor ${s0.floor}, lightness / colour against 3.5 s after the hit: ${parts.join(' | ')} — the middle reading's worst ${pc(worst)}`;
    if (measureOnly) console.log('    ', line, still ? '' : '(THE TOWER MOVED)');
    else ok(n === 3 && !t.errs.length && worst <= 0.05, `THE HAZE — ${line}`);
    await t.close();
  }
}
async function checks5() {
  await haze();
  // ---- THE HAZE FOLLOWS THE FLOOR (the cause of the owner's "floors 1–3 past the splashdown ~20 % less colourful + brighter": by day the
  // speakeasy's warm haze was eased over a second onto the harbor's pearl floors, under a surface that took 0.6 s to leave them): the
  // floors under the border wear THEIR OWN area's haze before the ball gets there and from the very frame it goes through — nothing eases
  {
    const t = await open(390, 844, 2, '?seed=f4a-fog&look=day&floor=117&tier=2');
    await start(t); await auto(t.p, 'safe'); await sleep(500);
    const near = v => Math.abs(v) < 1e-6, HARBOR = [0.0018, 0.042, 0.107], SPEAK = [0.5, 0.33, 0.22];
    let s = await st(t.p), f = s.info.fog;
    ok(s.floor >= 116 && s.floor < 120 && SPEAK.every((v, i) => near(f[i] - v)) && HARBOR.every((v, i) => near(f[3 + i] - v)) && near(f[6] + 119.5), `day, floor ${s.floor} (three above the water): the floors down to 119 fade into THE SPEAKEASY's haze, the floors from 120 down into THE HARBOR's own — the border at floor ${-(f[6] - 0.5)}`);
    await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().info.breaks.splash >= 1', 30000);
    const t0 = Date.now();
    s = await st(t.p); f = s.info.fog;
    ok(HARBOR.every((v, i) => near(f[3 + i] - v)) && near(f[6] + 119.5), `… the frame the ball goes through: the floors under the surface wear THE HARBOR's haze, whole (${f.slice(3, 6).map(v => v.toFixed(3)).join(' ')}) — nothing eases over them`);
    const off = await waitFor(t.p, 'window.__ffPlay.state().info.breaks.line >= 1.2', 3000), took = Date.now() - t0;
    ok(off && took <= 520, `… and the surface is off the tower ${took} ms after the plunge (it was 600 ms)`);
    await t.close();
  }
  // ---- THE SOLO "YOU HIT THE BOTTOM" BAND (the owner: faint grey by night, near-invisible by day — it was seen in its fade, THE TRENCH's band
  // a floor behind it): the GOLD band snaps in and STAYS — whole 0.2 s after it comes and still whole 1.8 s after, in solo, both looks
  for (const lk of ['night', 'day']) {
    const t = await open(390, 844, 2, `?seed=f4a-band&look=${lk}&floor=197&tier=2`);
    await start(t); await auto(t.p, 'gap');
    const up = await waitFor(t.p, "(b => b.showing && /^YOU HIT THE BOTTOM/.test(b.key))(window.__ffPlay.state().banner)", 20000), t0 = Date.now();
    await sleep(200);
    const a = (await st(t.p)).banner, aAt = Date.now() - t0;
    if (OUT) await shot(t.p, `f4a-band-${lk}-solo.png`);
    await sleep(Math.max(0, 1800 - (Date.now() - t0)));
    const c = (await st(t.p)).banner, cAt = Date.now() - t0;
    const ink = await t.p.evaluate(() => { const n = document.querySelector('.ff-banner.is-gold'); n.classList.remove('is-baked'); const v = [getComputedStyle(n.querySelector('.ff-banner-n')).color, getComputedStyle(n).backgroundImage]; n.classList.add('is-baked'); return v; });
    ok(up && a.gold && a.opacity > 0.99 && c.gold && /^YOU HIT/.test(c.key) && c.opacity > 0.99 && ink[0] === 'rgb(255, 246, 216)' && /rgba\(20, 12, 2, 0\.9\)/.test(ink[1]) && !t.errs.length, `${lk} — SOLO: "YOU HIT THE BOTTOM" is the GOLD band (pale gold words on its own dark ground), whole ${aAt} ms after it comes (opacity ${a.opacity.toFixed(2)}) and still whole at ${cAt} ms (${c.opacity.toFixed(2)})`);
    const next = await waitFor(t.p, "(b => b.showing && /^THE TRENCH/.test(b.key))(window.__ffPlay.state().banner)", 4000);
    ok(next, `${lk} — … THE TRENCH's band crosses AFTER it (${Date.now() - t0} ms)`);
    await t.close();
  }
  // ---- THE DARKNESS's LOOK (timing, steps + rumble untouched): the warning plate ends ABOVE the ball's highest point on every phone; by day no
  // pale stripe (the step's edge is a darker rim); the day BLAZE! = pale letters on a dark backing
  for (const [w, h] of [[390, 844], [375, 667], [430, 932]]) {
    const t = await open(w, h, 2, '?seed=f4a-warn&look=day&floor=20');
    await start(t); await auto(t.p, 'safe');
    const near = await waitFor(t.p, "window.__ffPlay.state().cls.includes('is-near')", 12000);
    const m = await t.p.evaluate(() => { const P = window.__ffPlay, r = document.querySelector('.ff-warn').getBoundingClientRect(), n = document.querySelector('.ff-num').getBoundingClientRect(), cs = getComputedStyle(document.querySelector('.ff-warn')); return { bottom: r.bottom, top: r.top, left: r.left, right: r.right, apex: P.apexY(), numFoot: n.bottom, shown: cs.opacity !== '0', vw: innerWidth }; });
    if (OUT && w === 390) await shot(t.p, 'f4a-dark-day-warn.png');
    ok(near && m.shown && m.bottom <= m.apex && m.top >= m.numFoot - 8 && m.left >= 0 && m.right <= m.vw, `${w} × ${h}: THE LIGHTS ARE GOING OUT ends ${Math.round(m.apex - m.bottom)} px ABOVE the ball's highest point (the plate ${Math.round(m.top)} … ${Math.round(m.bottom)}, the apex ${Math.round(m.apex)}), under the number`);
    await t.close();
  }
  {
    const t = await open(390, 844, 2, '?seed=f4a-edge&look=day&floor=20');
    await start(t); await auto(t.p, 'safe');
    await waitFor(t.p, "window.__ffPlay.state().darkAttr === '2'", 12000);
    await sleep(700);
    if (OUT) await shot(t.p, 'f4a-dark-day-step2.png');
    const edges = await t.p.evaluate(() => { const st = document.querySelector('.ff-stage'), d = document.querySelector('.ff-dark'), out = {}, was = st.dataset.area; for (const a of ['rooftop', 'offices', 'speakeasy', 'harbor', 'deep']) { st.dataset.area = a; out[a] = getComputedStyle(d).getPropertyValue('--ff-dk-edge').split(',').map(Number); } st.dataset.area = was; return out; });
    ok(Object.values(edges).every(e => e.length === 3 && Math.max(...e) < 60), `by day THE DARKNESS's edge is a DARKER rim in every area — no pale stripe through the big number (${Object.entries(edges).map(([k, v]) => `${k} ${v.join(' ')}`).join(' · ')})`);
    await t.close();
    const u = await open(390, 844, 2, '?seed=f4a-blaze&look=day&floor=84');
    await start(u); await auto(u.p, 'gap');
    await waitFor(u.p, "window.__ffPlay.state().call === 'BLAZE!'", 12000);
    const cs = await u.p.evaluate(() => { const c = getComputedStyle(document.querySelector('.ff-call')); return [c.color, c.textShadow]; });
    await sleep(160);
    if (OUT) await shot(u.p, 'f4a-blaze-day.png');
    ok(cs[0] === 'rgb(255, 244, 214)' && (cs[1].match(/rgba?\(46, 10, 0/g) || []).length >= 4, `the day BLAZE!: pale letters (${cs[0]}) on a dark, warm backing — read on the flame`);
    await u.close();
  }
}

// =============================================================================================================== THE SPEED (FREEFALL's speed test)
const ONE = (argv.find(a => a.startsWith('--one=')) || '').slice(6);
async function perf() {
  const rows = [];
  // BOTH LOOKS: the heaviest play in THE SPEAKEASY (THE BLAZE's fire, a shatter every few floors) — and by day UNDER THE HARBOR (the
  // caustics on the slices + the wall, the sun rays, the bubbles, the fire on the water)
  for (const [lk, floor, where] of [['night', 84, 'THE SPEAKEASY'], ['day', 84, 'THE SPEAKEASY'], ['day', 124, 'UNDER THE HARBOR'], ['night', 124, 'UNDER THE HARBOR']]) for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {   // (F5B: UNDER THE HARBOR by night wears the day's water now)
    if (ONE && ONE !== `${lk}-${floor}-${tier}-${rate}`) continue;   // (`--one=day-84-1-4`: one row again)
    const d = await open(390, 844, 3, `?seed=perf&tier=${tier}&floor=${floor}&look=${lk}`);
    await start(d); await auto(d.p, 'smash');
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await sleep(1500);
    await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; });
    await sleep(10000);
    const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s = P.state(), n = s.info.frames - window.__n0, ms = performance.now() - window.__f0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / ms, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], worst: a[a.length - 1], calls: s.info.calls, slices: s.info.slices, dpr: s.info.dpr, floor: s.floor, over: s.over, shatters: s.shatters, hitches: s.hitches, motes: s.info.motes, caust: s.info.caust, look: s.info.look, pic: Math.round(performance.now() - P.view.lastWork()), walls: s.info.walls }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ lk, where, tier, rate, ...r });
    ok(r.look === lk && r.fps >= 58 && r.p95 <= 20, `${lk} · ${where} · tier ${tier} at ${rate}× CPU: ${r.fps.toFixed(1)} fps (frame p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms) — floor ${r.floor}, ${r.shatters} shatters, ${r.motes} motes, @${r.dpr}`);
    await d.close();
  }
  // F5A — THE WATER SURFACE STANDING IN THE PICTURE (both looks, every tier, 1× + 4× CPU): the ball bouncing on floor 119, the whole lower
  // screen the water's shader (the swell, the streaks' column reads, the plankton · by day the lines + the foam) — 8 s of it
  for (const lk of ['night', 'day']) for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
    if (ONE && ONE !== `${lk}-water-${tier}-${rate}`) continue;
    const d = await open(390, 844, 3, `?seed=look2&tier=${tier}&floor=117&look=${lk}`);
    await waitFor(d.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
    await start(d); await auto(d.p, 'play');
    await waitFor(d.p, 'window.__ffPlay.state().floor >= 119 && window.__ffPlay.state().fl === "bounce"', 40000); await auto(d.p, 'safe');
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await sleep(800);
    await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; });
    await sleep(8000);
    const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s2 = P.state(), n = s2.info.frames - window.__n0, ms = performance.now() - window.__f0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / ms, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], worst: a[a.length - 1], floor: s2.floor, look: s2.look, water: s2.info.breaks.water, dpr: window.devicePixelRatio }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ lk, where: 'THE WATER (floor 119)', tier, rate, ...r });
    ok(r.look === lk && r.water === true && r.floor === 119 && r.fps >= 58 && r.p95 <= 20, `${lk} · THE WATER SURFACE in the picture (floor ${r.floor}) · tier ${tier} at ${rate}× CPU: ${r.fps.toFixed(1)} fps (frame p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms) @${r.dpr}`);
    await d.close();
  }
  // F3B — EACH BREAKTHROUGH PLAYING (both looks, tiers 2 + 0, 1× + 4× CPU): the frames from four floors above it to four floors past it
  for (const [lk, floor, where, mode] of [['night', 36, 'THE SKYLIGHT', ''], ['day', 36, 'THE SKYLIGHT', ''], ['night', 116, 'THE SPLASHDOWN', ''], ['day', 116, 'THE SPLASHDOWN', ''], ['night', 196, 'THE BOTTOM (solo: the crack)', ''], ['day', 196, 'THE BOTTOM (solo: the crack)', ''], ['night', 196, 'THE BOTTOM (a finish + the firework)', '&mode=match'], ['day', 196, 'THE BOTTOM (a finish + THE DAY CELEBRATION)', '&mode=match']]) for (const tier of [2, 0]) for (const rate of [1, 4]) {
    if (ONE && ONE !== `${lk}-${floor}-${tier}-${rate}`) continue;
    const d = await open(390, 844, 3, `?seed=perfb&tier=${tier}&floor=${floor}&look=${lk}${mode}`);
    await waitFor(d.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await start(d); await auto(d.p, 'play');
    await sleep(1100);
    await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; });
    await waitFor(d.p, mode ? 'window.__ffPlay.state().shown' : `window.__ffPlay.state().floor >= ${floor + 8} || window.__ffPlay.state().over`, 40000);
    const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s = P.state(), n = s.info.frames - window.__n0, ms = performance.now() - window.__f0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / ms, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], worst: a[a.length - 1], dpr: s.info.dpr, floor: s.floor, played: s.info.breaks.played, look: s.info.look, hitches: s.hitches, log: s.hitchLog.map(h => `${h.why} ${h.ms} @${h.floor}`).join(', '), motes: s.info.motes }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    rows.push({ lk, where, tier, rate, ...r });
    ok(r.look === lk && r.played >= 1 && r.fps >= 58 && r.p95 <= 20, `${lk} · ${where} · tier ${tier} at ${rate}× CPU: ${r.fps.toFixed(1)} fps through it (frame p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms; ${r.hitches} long frames${r.log ? `: ${r.log}` : ''}) — floor ${r.floor}, @${r.dpr}`);
    await d.close();
  }
  console.log('\n| look | where | tier | cpu | fps | frame ms (p50 · p95 · worst) | size | motes |\n| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) console.log(`| ${r.lk} | ${r.where} | ${r.tier} | ${r.rate}× | ${r.fps.toFixed(1)} | ${r.p50.toFixed(1)} · ${r.p95.toFixed(1)} · ${r.worst.toFixed(1)} | 390×844 @${r.dpr} | ${r.motes} |`);
}

// F5B — THE WATER HITCHES (`--water`): F5A saw ONE 83 – 100 ms frame in most standing-water rows. Here: the ball standing on floor 119 for
// 8 s (the water's surface filling the lower screen) + THE SPLASHDOWN played through (116 → 124), both looks, tier 2, 1× + 4× CPU —
// the worst frame + every frame over 33 ms NAMED (the stage's hitch log). The target: no frame over 33 ms at the splashdown.
async function water() {
  const name = h => `${h.ms.toFixed(0)} ms ${h.why} @${h.floor}`;
  for (const lk of ['night', 'day']) for (const rate of [1, 4]) {
    for (const what of ['stand', 'splash']) {
      const d = await open(390, 844, 3, `?seed=look2&tier=2&floor=${what === 'stand' ? 117 : 116}&look=${lk}`);
      await waitFor(d.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
      await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await start(d); await auto(d.p, 'play');
      if (what === 'stand') { await waitFor(d.p, 'window.__ffPlay.state().floor >= 119 && window.__ffPlay.state().fl === "bounce"', 40000); await auto(d.p, 'safe'); }
      await sleep(what === 'stand' ? 600 : 300);
      await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; window.__h0 = window.__ffPlay.state().hitches; });
      if (what === 'stand') await sleep(8000); else await waitFor(d.p, 'window.__ffPlay.state().floor >= 124 || window.__ffPlay.state().over', 40000);
      const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s = P.state(), n = s.info.frames - window.__n0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / (performance.now() - window.__f0), worst: a[a.length - 1], p95: a[Math.floor(a.length * 0.95)], log: s.hitchLog.slice(0, Math.max(0, s.hitches - window.__h0)), floor: s.floor, splash: s.info.breaks.splash }; });
      await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      ok(r.fps >= 58 && (what === 'stand' || r.worst <= 33), `${lk} · THE WATER (${what === 'stand' ? 'standing on 119, 8 s' : `the splashdown, 116 → ${r.floor}`}) · ${rate}× CPU: ${r.fps.toFixed(1)} fps · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms${r.log.length ? ` — long: ${r.log.map(name).join(' · ')}` : ''}`);
      await d.close();
    }
  }
}

// THE STUTTERS (F3B — the owner's iPhone: HITCH 9 a run at tier 2): a WHOLE run, the roof to the trench, at 4× CPU in both looks — every frame
// over 25 ms counted BY AREA and every one over 33 ms NAMED (what landed before it). The target here: worst ≤ 25 ms, HITCH ≤ 2 a run.
async function stutters() {
  const AREAS = [['THE ROOFTOP', 0], ['THE OFFICES', 40], ['THE SPEAKEASY', 80], ['UNDER THE HARBOR', 120], ['THE DEEP', 160], ['THE TRENCH', 201]];
  const out = [];
  for (const lk of LOOKS) for (const rate of [4]) {
    const d = await open(390, 844, 3, `?seed=stut1&tier=2&look=${lk}`);
    await waitFor(d.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
    await sleep(800);
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await start(d); await auto(d.p, 'play');
    // (the page itself keeps each area's worst frame + its count over 25 ms: read once a frame, written into typed slots)
    await d.p.evaluate(() => {
      const P = window.__ffPlay, W = new Float32Array(8), N = new Int32Array(8), F = new Int32Array(8), from = [0, 40, 80, 120, 160, 201];
      let last = performance.now(), t0 = last;
      window.__st = { W, N, F };
      const tick = now => { const dt = now - last; last = now; const s = P.state(); if (!s.over && s.started && !s.held && now - t0 > 1200) { let k = 0; for (let i = 0; i < from.length; i++) if (s.floor >= from[i]) k = i; F[k]++; if (dt > W[k]) W[k] = dt; if (dt > 25) N[k]++; } if (!window.__stStop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    await waitFor(d.p, 'window.__ffPlay.state().floor >= 212 || window.__ffPlay.state().over', 400000);
    const r = await d.p.evaluate(() => { window.__stStop = true; const s = window.__ffPlay.state(), T = window.__st; return { floor: s.floor, over: s.over, cause: s.cause, hitches: s.hitches, worst: s.worstMs, log: s.hitchLog, W: [...T.W], N: [...T.N], F: [...T.F], landed: s.info.landed, bakes: s.banner.bakes, tier: s.tier }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    out.push({ lk, rate, ...r });
    ok(r.floor >= 205 && r.hitches <= 2 && r.landed === 13, `${lk} at ${rate}× CPU, the roof to the trench (floor ${r.floor}): HITCH ${r.hitches} (frames over 33 ms${r.log.length ? `: ${r.log.map(h => `${h.why} ${h.ms} ms @${h.floor}`).join(', ')}` : ''}) · worst ${r.worst.toFixed(1)} ms · no picture landed in the run (${r.landed})`);
    await d.close();
  }
  console.log('\n| look | cpu | area | frames | worst ms | over 25 ms |\n| --- | --- | --- | --- | --- | --- |');
  for (const r of out) AREAS.forEach(([name], k) => console.log(`| ${r.lk} | ${r.rate}× | ${name} | ${r.F[k]} | ${r.W[k].toFixed(1)} | ${r.N[k]} |`));
}

// =============================================================================================================== F4B — the test page's own checks
async function checks6() {
  // ---- THE SKYLIGHT's FRAME BAR (the owner's iPhone, night, floor 40: the frame's bar stayed across the screen at the ball's height + a
  // dark bar at the top, in front of the tiles): once the pane breaks NOTHING of the skylight / the roof is between the camera and the
  // floors — the deck + the outer frame + its tubes gone in 0.25 s, the glazing bars' pieces with the shards. The ball STANDS on floor 40.
  for (const lk of ['night', 'day']) for (const [w, h, d] of [[390, 844, 2], [375, 667, 2], [430, 932, 2]]) {
    const t = await open(w, h, d, `?seed=look2&look=${lk}&floor=37&tier=2`);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().info.breaks.skylight >= 1', 30000);
    const hit = Date.now();
    await auto(t.p, 'safe');
    // (the bar lay across the whole width at the ball's floor: two points of that line, left + right of the tower — and the top bar's line)
    const pts = [[0.07, 0.32], [0.93, 0.32], [0.5, 0.135]];   // (fractions of the canvas)
    const read = () => coloursAt(t.p, pts);
    await sleep(Math.max(0, 450 - (Date.now() - hit)));
    const b0 = (await st(t.p)).info.breaks;
    await sleep(Math.max(0, 1000 - (Date.now() - hit)));
    const c1 = await read();
    await sleep(Math.max(0, 1750 - (Date.now() - hit)));
    const b1 = (await st(t.p)).info.breaks;
    await sleep(Math.max(0, 3200 - (Date.now() - hit)));
    const c3 = await read(), s = await st(t.p);
    const diff = c1.map((c, i) => (c && c3[i] ? Math.abs(lumOf(c) - lumOf(c3[i])) : 99));
    const lit = c3.every(c => c && c.every(Number.isFinite)) && c3.some(c => lumOf(c) > 2);   // (the reading is a real one: the picture is there)
    ok(s.floor === 40 && !s.over && b0.skylight >= 1 && b0.deck === false && b1.frame === false && lit && Math.max(...diff) <= 10 && !t.errs.length,
      `${lk} ${w}×${h} — THE FRAME BAR: the ball stands on floor 40 — 0.45 s after the break the deck is not drawn, 1.75 s after it no piece of the frame is; the bar's line (left · right) + the top bar's line read at 1 s as they do at 3.2 s (lightness off by ${diff.map(v => v.toFixed(1)).join(' · ')} of 255 — nothing lies there)`);
    await t.close();
  }
  // ---- THE MATCH ON THE PAGE (the bot room — `?mode=match&rivals=7`: seven bots on the run's own seed, fed to the ghosts as a room's proof
  // nodes would be; nothing counts, nothing is asked of any server): the ghosts, their tags, the outline near my ball, THE DEPTH RAIL,
  // the edge markers, the top line; OUT = WATCH THE LEADER (a tap = the next player)
  {
    const M = 'window.__ffPlay.matchState()';
    const t = await open(390, 844, 2, '?seed=look3&mode=match&rivals=7&watch=1&look=night');
    await start(t);
    ok(await waitFor(t.p, `${M}.ghosts.length === 7 && ${M}.layer.baked === 1`, 20000), 'THE BOT ROOM: seven rivals — a ghost each, their name tags baked ONCE (behind the start)');
    let m = await t.p.evaluate(M);
    ok(m.on && m.ghosts.every(g => g.floor <= 1 && g.near >= 0.9 && !g.bad) && m.layer.tagged === 0, `at the start everyone stands on the same slice: every ghost within a floor of my ball is an OUTLINE with no tag (${m.ghosts.map(g => g.near.toFixed(1)).join(' ')}) — my own ball is never hidden`);
    ok(/8 PLAYING$/.test(m.top) && m.hud.rail && m.hud.dots.length === 8 && m.hud.dots.some(d => d.uid === 'me'), `the top line "${m.top}" · THE DEPTH RAIL: a dot a player (${m.hud.dots.length}), mine among them`);
    await auto(t.p, 'safe');
    ok(await waitFor(t.p, `${M}.ghosts.some(g => g.alpha === 0 && !g.over && !g.lost) && ${M}.ghosts.some(g => g.alpha > 0.9 && g.near < 0.1)`, 30000), 'the rivals fall on while I stay: a ghost in the picture below me, the far ones out of the picture (named on the rail)');
    m = await t.p.evaluate(M);
    const far = m.ghosts.filter(g => g.floor - (m.ghosts.length ? 0 : 0) >= 0 && g.alpha === 0 && !g.over && !g.lost);
    // (FIX A — THE EDGE MARKERS are gone: every rival's NAME beside its dot on the rail — 7 letters at most, never two closer than a line)
    const nm = m.hud.dots.filter(d => d.name), ny = nm.map(d => d.ny).sort((p, q) => p - q);
    ok(nm.length === 7 && nm.every(d => /^[A-Z…]{1,7}$/.test(d.name)) && ny.every((y, k) => !k || y - ny[k - 1] >= 13.5) && far.length >= 1 && m.layer.tagged >= 1 && m.layer.baked === 1 && !('down' in m.hud), `THE RAIL's NAMES: ${nm.map(d => `${d.name} @${d.ny}`).join(' · ')} — apart, no edge marker · ${far.length} ghosts too far to draw · ${m.layer.tagged} tag(s) over the ghosts in sight · the atlas still baked once`);
    const me0 = m.hud.dots.find(d => d.uid === 'me').y, deep = Math.max(...m.hud.dots.map(d => d.y));
    ok(deep > me0 + 8 && m.hud.railH > 300, `the rail: the deepest dot ${deep.toFixed(0)} px down a ${m.hud.railH}-px rail, mine at ${me0.toFixed(0)}`);
    // … the lights take me (I stood still): OUT → WATCH THE LEADER
    ok(await waitFor(t.p, `window.__ffPlay.state().over && ${M}.watch !== ''`, 30000), 'OUT (the lights went out): WATCH THE LEADER');
    m = await t.p.evaluate(M);
    const lead = m.ghosts.filter(g => !g.over).sort((x, y) => y.floor - x.floor)[0], w1 = m.watch;
    await sleep(2200);
    m = await t.p.evaluate(M);
    const s = await st(t.p);
    ok(w1 === lead.uid && m.watchFloor > 0 && s.num === String(m.watchFloor) && /is-watch/.test(s.cls) && /^WATCHING [A-Z]+ · TAP FOR THE NEXT$/.test(m.hud.watching) && (await t.p.evaluate(() => document.querySelector('.ff-end').hidden)), `… the deepest rival still falling (${lead.name}): the big number shows THEIR floor (${s.num}), "${m.hud.watching}", my own card stays away`);
    ok(m.ghosts.find(g => g.uid === w1).alpha === 0 && m.hud.dots.find(d => d.uid === 'me').cls === 'is-out', 'the watched player is the ball on screen (no ghost of them) · my dot on the rail is crossed');
    await drag(t, 195, 600, 0, { steps: 1 });
    ok(await waitFor(t.p, `${M}.watch !== '' && ${M}.watch !== '${w1}'`, 5000), 'a TAP = the next player');
    ok(!t.errs.length && !t.reqs.some(r => r.includes('/api/')) && !t.sockets.length, `the bot room asked nothing of any server (${t.reqs.filter(r => /matchsim|ghost/.test(r)).length} of its own files) — no error`);
    await t.close();
  }
}

/** F4B — THE SPEED TEST WITH 8 GHOSTS (`--perf8`): the bot room at its fullest — 8 rivals, EVERY one of them in the picture at once with
 *  its tag (the checks' own tool: `simNear`) — in the heaviest play (THE SPEAKEASY: THE BLAZE's fire, a shatter every few floors; by day
 *  UNDER THE HARBOR too), every tier, 1× + 4× CPU, both looks. A MEASURED 60 fps. */
async function perf8() {
  for (const [lk, floor, where] of [['night', 84, 'THE SPEAKEASY'], ['day', 84, 'THE SPEAKEASY'], ['day', 124, 'UNDER THE HARBOR'], ['night', 124, 'UNDER THE HARBOR']]) for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {   // (F5B: UNDER THE HARBOR by night wears the day's water now)
    if (ONE && ONE !== `${lk}-${floor}-${tier}-${rate}`) continue;
    const d = await open(390, 844, 3, `?seed=perf&tier=${tier}&floor=${floor}&look=${lk}&mode=match&rivals=8&simshift=2000`);
    await start(d); await auto(d.p, 'smash');
    await waitFor(d.p, 'window.__ffPlay.matchState().ghosts.length === 8', 20000);
    await d.p.evaluate(() => window.__ffPlay.simNear(true));
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await sleep(1500);
    await d.p.evaluate(() => { window.__f0 = performance.now(); window.__n0 = window.__ffPlay.state().info.frames; });
    await sleep(10000);
    const r = await d.p.evaluate(() => { const P = window.__ffPlay, fr = P.frames(), s = P.state(), m = P.matchState(), n = s.info.frames - window.__n0, ms = performance.now() - window.__f0, a = fr.slice(-Math.min(fr.length, n)).sort((x, y) => x - y); return { fps: 1000 * n / ms, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], worst: a[a.length - 1], floor: s.floor, over: s.over, look: s.look, dpr: s.info.dpr, shown: m.layer.shown, tagged: m.layer.tagged, calls: s.info.calls }; });
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    ok(r.look === lk && r.shown === 8 && r.tagged >= 6 && r.fps >= 58 && r.p95 <= 20, `8 GHOSTS · ${lk} · ${where} · tier ${tier} at ${rate}× CPU: ${r.fps.toFixed(1)} fps (frame p50 ${r.p50.toFixed(1)} · p95 ${r.p95.toFixed(1)} · worst ${r.worst.toFixed(1)} ms) — ${r.shown} ghosts drawn, ${r.tagged} tags, floor ${r.floor}${r.over ? ' (over)' : ''}, @${r.dpr}`);
    await d.close();
  }
}

// =============================================================================================================== THE DAY HUD's CONTRAST
// FIX A (the review's M2): every area by day — the frame FROZEN (__slowmo(0)), shot with the HUD and without it; the digits' own pixels
// (white in the first shot) against what is behind them in the second: the worst 10 % (the brightest) + the median. The top line the same.
// The gold of NEW BEST is judged against the same pixels. `node freefall-play.mjs "<chromium>" <outDir> --contrast [--looks=day,night]`
const CONTRAST_AT = [['rooftop', 0], ['rooftop-30', 28], ['offices', 46], ['speakeasy', 88], ['water', 115], ['harbor', 128], ['deep', 168]];
async function contrast() {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (r, g, b0) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b0);
  const GOLD = lum(0xff, 0xc2, 0x34), rows = [];
  for (const lk of LOOKS) for (const [name, floor] of CONTRAST_AT) {
    const t = await open(390, 844, 3, `?seed=look2&look=${lk}&tier=2${floor ? `&floor=${floor}` : ''}`, { best: 141 });
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, `window.__ffPlay.state().floor >= ${floor + 2} && window.__ffPlay.state().fl === 'bounce'`, 30000);
    await sleep(700);
    await t.p.evaluate(() => window.__slowmo(0)); await sleep(300);
    const bx = await t.p.evaluate(() => {
      const r = n => { const q = n.getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; };
      const best = document.querySelector('.ff-best'), rg = document.createRange(); rg.selectNodeContents(best);
      const tb = rg.getBoundingClientRect();
      return { num: r(document.querySelector('.ff-numc') || document.querySelector('.ff-num')), best: [tb.left, tb.top, tb.width, tb.height], text: best.textContent };
    });
    const clipOf = ([x, y, w, h]) => ({ x: Math.max(0, x), y: Math.max(0, y), width: Math.max(4, w), height: Math.max(4, h) });
    const grab = async () => ({ num: await t.p.screenshot({ encoding: 'base64', clip: clipOf(bx.num) }), best: await t.p.screenshot({ encoding: 'base64', clip: clipOf(bx.best) }) });
    const A = await grab();
    if (OUT) await t.p.screenshot({ path: join(OUT, `contrast-${lk}-${name}.png`) });
    await t.p.evaluate(() => { for (const s of ['.ff-hud', '.ff-best']) document.querySelector(s).style.visibility = 'hidden'; }); await sleep(150);
    const B = await grab();
    const m = await t.p.evaluate(async (A, B) => {
      const px = async b64 => { const im = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob()); const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
      const out = {};
      for (const k of ['num', 'best']) {
        const a = await px(A[k]), b = await px(B[k]), bg = [];
        for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] > 600 && Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) bg.push([b[i], b[i + 1], b[i + 2], a[i], a[i + 1], a[i + 2]]);
        out[k] = bg;
      }
      return out;
    }, A, B);
    const res = {};
    for (const k of ['num', 'best']) {
      const L = m[k].map(([r, g, b0]) => lum(r, g, b0)).sort((x, y) => x - y), T = m[k].map(v => lum(v[3], v[4], v[5])).sort((x, y) => x - y);
      const q = f => L[Math.min(L.length - 1, Math.floor(L.length * f))] || 0, ink = T[Math.floor(T.length / 2)] || 1;   // (the ink = the text's own median pixel)
      res[k] = { n: L.length, worst: (ink + 0.05) / (q(0.9) + 0.05), med: (ink + 0.05) / (q(0.5) + 0.05), gold: (GOLD + 0.05) / (q(0.9) + 0.05) };
    }
    rows.push([lk, name, res]);
    const f2 = v => v.toFixed(1);
    ok(res.num.n > 50 && res.num.worst >= 3 && res.best.n > 10 && res.best.worst >= 4.5, `THE ${lk.toUpperCase()} HUD · ${name}: the number ${f2(res.num.worst)} : 1 (median ${f2(res.num.med)}; NEW BEST's gold ${f2(res.num.gold)}) · the top line "${bx.text}" ${f2(res.best.worst)} : 1 (median ${f2(res.best.med)}) — ${res.num.n} / ${res.best.n} px`);
    await t.close();
  }
  console.log('CONTRAST', JSON.stringify(rows.map(([l, n, r]) => [l, n, +r.num.worst.toFixed(2), +r.num.med.toFixed(2), +r.num.gold.toFixed(2), +r.best.worst.toFixed(2), +r.best.med.toFixed(2)])));
}

// FIX A — THE WATER beside the owner's two targets: standing on floor 119, both looks (`--watershot [--looks=day]`): water-<look>-<n>.png
async function watershot() {
  for (const lk of LOOKS) {
    const t = await open(390, 844, 3, `?seed=look2&tier=2&floor=117&look=${lk}`);
    await waitFor(t.p, 'window.__ffPlay.state().info.landed >= 13', 15000);
    await start(t); await auto(t.p, 'play');
    await waitFor(t.p, 'window.__ffPlay.state().floor >= 119 && window.__ffPlay.state().fl === "bounce"', 40000); await auto(t.p, 'safe');
    for (let k = 0; k < 3; k++) { await sleep(k ? 900 : 1200); await shot(t.p, `water-${lk}-${k}.png`); }
    ok(!t.errs.length, `THE WATER · ${lk}: shot on floor ${(await st(t.p)).floor} (${t.errs.join(' | ') || 'no error'})`);
    await t.close();
  }
}

if (LOOK) await look();
else if (argv.includes('--watershot')) await watershot();
else if (argv.includes('--contrast')) await contrast();
else if (argv.includes('--stutters')) await stutters();
else if (argv.includes('--perf8')) await perf8();
else if (argv.includes('--water')) await water();
else if (PERF) await perf();
else if (argv.includes('--f3b')) await checks4();
else if (argv.includes('--haze')) await haze(true);
else if (argv.includes('--f4a')) await checks5();
else if (argv.includes('--f4b')) await checks6();
else { await checks1(); await checks2(); await checks3(); await checks4(); await checks5(); await checks6(); }
await b.close();
console.log(`\n${checks} checks · ${fails.length} failed`);
for (const f of fails) console.log('  ✗', f);
process.exit(fails.length ? 1 : 0);
