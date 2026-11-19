// HIGH RISE — THE FLYER PATH CHECK (S4A FIX 2 — docs/highrise.md "THE FLYERS"; the owner, Nov 19: "THE UFO visibly JUMPS on every slab
// landing"). The cause: a flyer keeps to a band of sky whose lower edge was THE DROP ZONE's upper edge AS THE CAMERA SAW IT NOW — a
// landing moves the top slab up a floor at once while the camera eases after it, so the band (and the flyer in it) leapt up the screen
// and eased back, every landing. Now a flyer moves on the REAL clock in a band read off the RESTED camera (night.js — FR.bot).
// THE CHECK: a bot drops every slab on its beat (real pointer touches, a timer set for each slab's perfect moment) while each flyer
// crosses — THE BLACKBIRD · the F-22 pair · THE UFO · THE MOTHERSHIP's solo pass — and the flyer's place ON THE SCREEN is recorded at
// every frame it is drawn (flyers.js#path: its path point through the very camera that frame draws with + the frame's own time). Each
// sample is set against its two neighbours, interpolated BY TIME: a smooth path agrees to a hundredth of a pixel at any frame rate (a slow
// frame is a longer step along the SAME curve); a jump at a landing is pixels off. FAILS if any frame deviates more than FLY_TOL px
// (1.5) — in Chromium AND Playwright's WebKit as an iPhone, 390 × 844 @3.
//   node tests/integration/highrise-flypath.mjs "<chromium>" [--no-webkit]      FLY_TOL (px) · WK_PLAYWRIGHT (the WebKit build's index.mjs)
// The page is the TEST PAGE: zero server calls — a plain `node scripts/serve.mjs` is enough (no emulators).
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), TOL = Number(process.env.FLY_TOL) || 1.5, W = 390, H = 844;
const KINDS = [['blackbird', 1], ['f22', 1], ['ufo', 2], ['pass', 3]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

/** in the page: the bot — a touch on each slab's perfect moment (a timer for it), all the time the check runs; window.__fp.drops = the touches */
const BOT = () => {
  const L = window.__hiPlay, play = document.querySelector('.hi-play'), init = { bubbles: true, pointerType: 'touch', button: 0 };
  const B = window.__fp = { drops: 0, at: [], stop: false };
  (function poll() {
    if (B.stop) return;
    if (L.phase() !== 1) { setTimeout(poll, 20); return; }
    const m = L.soon();
    if (m !== -9999 && m <= 40) { setTimeout(() => { B.drops++; B.at.push(performance.now()); play.dispatchEvent(new PointerEvent('pointerdown', init)); setTimeout(poll, 200); }, Math.max(0, m - 2)); return; }
    setTimeout(poll, 4);
  })();
};

/** one flyer across the sky while the bot drops: → its rows [t, x, y, kind] + the touches in its flight */
async function cross(ev, kind) {
  await ev(() => window.__hiPlay.flyPath(true));
  const d0 = await ev(() => window.__fp.drops);
  const flew = await ev(k => window.__hiPlay.fly(k, 1), kind);
  if (!flew) return { flew: false };
  await ev(k => new Promise(res => {
    const t0 = performance.now();
    (function wait() {
      const i = window.__hiPlay.flyInfo(), on = k === 'pass' ? i.ship && i.ship.pass : k === 'ufo' ? i.ufo : !!i.jet;
      if ((!on && performance.now() - t0 > 400) || performance.now() - t0 > 15000) return res();
      setTimeout(wait, 50);
    })();
  }), kind);
  const rows = await ev(() => window.__hiPlay.flyPath(false)), d1 = await ev(() => window.__fp.drops), st = await ev(() => window.__hiPlay.state());
  return { flew: true, rows, drops: d1 - d0, over: st.over };
}

/** each sample against its neighbours, by time → the worst deviation in px + where */
function judge(rows, kind) {
  const r = rows.filter(q => q[3] === kind).sort((a, b) => a[0] - b[0]);
  let worst = 0, at = -1, n = 0, gaps = 0;
  for (let i = 1; i < r.length - 1; i++) {
    const [ta, xa, ya] = r[i - 1], [t, x, y] = r[i], [tb, xb, yb] = r[i + 1];
    if (!(t > ta && tb > t)) continue;
    const k = (t - ta) / (tb - ta), px = xa + (xb - xa) * k, py = ya + (yb - ya) * k, dev = Math.hypot((x - px) * W, (y - py) * H);
    n++; if (t - ta > 0.025) gaps++;
    if (dev > worst) { worst = dev; at = i; }
  }
  return { n, worst, at, gaps, frames: r.length };
}

async function run(name, ev, close) {
  console.log(`\n— ${name}, ${W} × ${H} @3`);
  await ev(() => document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })));
  const end = Date.now() + 8000;
  while (Date.now() < end && !(await ev(() => window.__hiPlay.phase() === 1))) await sleep(50);
  await ev(() => window.__hiPlay.climb(30));
  await ev(BOT);
  for (const [kind, code] of KINDS) {
    const c = await cross(ev, kind);
    ok(c.flew, `${name}: ${kind} flew`);
    if (!c.flew) continue;
    const j = judge(c.rows, code);
    console.log(`     ${kind}: ${j.frames} frames drawn, ${c.drops} slabs landed in its flight, ${j.gaps} frames slower than 25 ms · the worst frame ${j.worst.toFixed(3)} px off its path`);
    ok(j.n > 40 && c.drops >= 2 && !c.over, `${name}: ${kind} crossed while slabs landed (${j.n} samples, ${c.drops} landings, the run live)`);
    ok(j.worst <= TOL, `${name}: ${kind} — no frame jumps off its smooth path at a landing (worst ${j.worst.toFixed(3)} px ≤ ${TOL})`);
  }
  await ev(() => { window.__fp.stop = true; });
  await close();
}

// ---- Chromium
{
  const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?seed=flypath&look=night`, 'highrise-play'), { waitUntil: 'load' });
  await p.waitForFunction(() => { const i = window.__hiPlay && window.__hiPlay.state().info; return !!i && i.warmed > 0 && i.frames > 5; }, { timeout: 30000 });
  await run('Chromium', (fn, a) => p.evaluate(fn, a), async () => { ok(errs.length === 0, `Chromium: no page error (${errs.join(' | ')})`); await b.close(); });
}
// ---- WebKit (Playwright's, as an iPhone)
if (!argv.includes('--no-webkit')) {
  let wb = null;
  try {
    const { webkit: wk } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
    wb = await wk.launch();
  } catch (e) { console.log(`(no Playwright WebKit here — ${String(e.message).split('\n')[0]})`); ok(false, 'WebKit is here'); }
  if (wb) {
    const ctx = await wb.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const wp = await ctx.newPage(), errs = [];
    wp.on('pageerror', e => errs.push(String(e.message || e)));
    await wp.goto(guardUrl(`${BASE}/highrise-play?seed=flypath&look=night`, 'highrise-play'), { waitUntil: 'load' });
    const end = Date.now() + 30000;
    while (Date.now() < end) { try { if (await wp.evaluate(() => { const i = window.__hiPlay && window.__hiPlay.state().info; return !!i && i.warmed > 0 && i.frames > 5; })) break; } catch { /* loading */ } await sleep(80); }
    await run('WebKit (an iPhone)', (fn, a) => wp.evaluate(fn, a), async () => { ok(errs.length === 0, `WebKit: no page error (${errs.join(' | ')})`); await wb.close(); });
  }
}
console.log(`\n${checks - fails.length} / ${checks} checks`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
