// FREEFALL F1 — THE FREEFALL LAB's own check (/freefall-lab — js/games/freefall/lab.js + graybox.js — docs/freefall.md "THE LAB"), the
// BROWSER half of tests/freefall-lab.test.mjs, on the LOCAL server (NEVER THE LIVE SITE):
//   · the lab loads at 390 × 844: its stage, the graybox, TOUCH TO START; THE BALL ≥ 34 pt, about 30 % from the top, 4–5 floors in sight
//     below it; the plain-text HUD (FLOOR · CLEAN · BLAZE · DARK · the area) readable; RESTART ≥ 44 pt
//   · A RUN THROUGH REAL DRAGS (CDP touches): the first touch only STARTS the run; a drag turns the tower 1 : 1 (the ring under the ball
//     moves as far as the finger), at once; drag to each floor's gap → the ball falls floor after floor; then hands off: THE LIGHTS GO OUT
//   · the run ends: the cause's words, RESTART, **REPLAY = LIVE ✓** (the judge re-plays the log); RESTART = a fresh run
//   · ?mode=solo|match, ?seed= (the same tower every restart), ?fps=1
//   · **THE LAB NEVER COUNTS**: NO request but the page's own static files + three.js from its CDN — no /api, no Firebase, no web socket,
//     no profile / progression / report / share / cards module, nothing stored
//   · the shots (390 × 844 — the pass's review; + 375 × 667 and 1440 × 900) into [outDir] — kept out of git
//   node tests/integration/freefall-lab.mjs "<chromium>" [outDir]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(50); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

/** THE ONLY REQUESTS THE LAB MAY MAKE: its own page + static files, and three.js from the import map's CDN */
const OWN = [/^\/freefall-lab(\.html)?$/, /^\/css\/freefall-lab\.css$/, /^\/js\/games\/freefall\/(lab|graybox|engine|replay|logic|tuning|tower-gen)\.js$/, /^\/js\/core\/rng\.js$/, /^\/assets\/favicon-64\.png$/, /^\/favicon\.ico$/];
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const allowed = url => { if (url === THREE_URL) return true; const u = new URL(url); return u.origin === new URL(BASE).origin && OWN.some(re => re.test(u.pathname)); };
const COUNTS = /\/api\/|firebase|gstatic|googleapis|\/js\/(profile|progress|board|daily|vault|chat|admin|audio|ui|screens)\/|\/js\/(firebase|store|room|host|identity|seat|errlog|app|config)\.js|share|report|cards?\b|sw\.js/i;

async function open(w, h, dpr, q = '') {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [], sockets = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => { if (!r.url().startsWith('data:')) reqs.push(`${r.method()} ${r.url()}`); });
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', e => sockets.push(e.url));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  await p.goto(guardUrl(`${BASE}/freefall-lab${q}`, 'freefall-lab'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__ffLab && !!document.querySelector('canvas.ff-canvas')");
  return { p, cdp, errs, reqs, sockets, up, touch: w < 700, w, h, close: () => ctx.close() };
}
const st = p => p.evaluate(() => window.__ffLab.state());
/** a REAL finger: down at (x, y), across by `dx` px in `steps` moves, (up) */
async function drag(t, x, y, dx, { steps = 4, up = true, down = true } = {}) {
  const pt = (px) => ({ x: px, y, id: 1, radiusX: 4, radiusY: 4, force: 1 });
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
const tapAt = (t, x, y) => drag(t, x, y, 0, { steps: 0 });
const angDiff = (to, from) => ((((to - from + 2048) % 4096) + 4096) % 4096) - 2048;

// ---- 390 × 844: the page, the graybox, the HUD
const t = await open(390, 844, 3, '?seed=lab1');
{
  const { p } = t;
  ok(t.up, 'the lab loads at 390 × 844: its stage + the graybox canvas (no gate, no door)');
  await sleep(400);
  const s = await st(p);
  ok(s.mode === 'solo' && !s.started && s.floor === 0 && s.seed === 'lab1', `a new run waits for its start: SOLO, floor 0, ?seed= shown (${s.seed})`);
  const dom = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(e).fontSize), text: e.textContent, hidden: e.hidden || getComputedStyle(e).display === 'none' }; };
    return { floor: box(q('.ff-floor')), k: box(q('.ff-k')), stats: box(q('.ff-stats')), area: box(q('.ff-area')), sub: box(q('.ff-sub')), start: box(q('.ff-start-t')), startBox: box(q('.ff-start')), end: box(q('.ff-end')),
      restart: box(q('.ff-restart')), tabs: [...document.querySelectorAll('.ff-tab')].map(e => ({ ...box(e), on: e.classList.contains('is-on') })), seed: box(q('.ff-seed')), fps: !!q('.ff-fps'), w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth };
  });
  ok(dom.floor.text === '0' && dom.floor.fs >= 54 && dom.floor.y < 844 * 0.12 && dom.k.text === 'FLOOR', `FLOOR big at the top (${dom.floor.fs} px)`);
  ok(dom.stats.text === 'CLEAN 0 · BLAZE — · DARK 6' && dom.stats.fs >= 16, `the plain-text HUD: "${dom.stats.text}" (${dom.stats.fs} px)`);
  ok(dom.area.text === 'THE ROOFTOP' && dom.area.fs >= 14 && dom.sub.text === 'SOLO · 30:00' && dom.sub.fs >= 13, `the area name + the mode's clock: "${dom.area.text}" · "${dom.sub.text}"`);
  ok(!dom.startBox.hidden && dom.start.text === 'TOUCH TO START' && dom.start.fs >= 20 && dom.end.hidden, 'TOUCH TO START up, the end card hidden');
  ok(dom.restart.text === 'RESTART' && dom.restart.h >= 44 && dom.restart.w >= 44 && dom.restart.x + dom.restart.w <= dom.w && dom.restart.y >= 0, `a RESTART button, ${dom.restart.w.toFixed(0)} × ${dom.restart.h.toFixed(0)} pt, in the top-right corner`);
  ok(dom.tabs.length === 2 && dom.tabs.map(x => x.text).join() === 'SOLO,MATCH' && dom.tabs.every(x => x.h >= 44 && x.w >= 44) && dom.tabs[0].on && !dom.tabs[1].on, 'the mode switch: SOLO · MATCH, each ≥ 44 pt, SOLO on');
  ok(dom.seed.text === 'seed lab1' && !dom.fps, 'the seed shown; no fps readout without ?fps=1');
  ok(dom.scroll <= dom.w, 'no sideways scroll');
  const f = s.frame;
  ok(f.ball.d >= 34, `THE BALL is ${f.ball.d.toFixed(1)} pt across (≥ 34)`);
  ok(Math.abs(f.ball.x - 195) < 3, 'the ball sits at the front, in the middle of the screen');
  ok(f.ball.y / 844 > 0.24 && f.ball.y / 844 < 0.40, `before the start the ball hangs ${(f.ball.y / 844 * 100).toFixed(0)} % down the screen, about to drop in (≈ 30 %)`);
  const inSight = f.rows.filter(y => y > f.ball.y / 844 && y < 0.985).length;
  ok(inSight >= 4 && inSight <= 6, `${inSight} floors in sight below the ball (4–5)`);
  ok(f.ring[0] > 0.02 && f.ring[1] < 0.98 && f.ring[1] - f.ring[0] > 0.7, `the ring spans ${((f.ring[1] - f.ring[0]) * 100).toFixed(0)} % of the screen width`);
  ok(dom.sub.y + dom.sub.h < f.ball.y - f.ball.d / 2 && Math.abs(dom.sub.y - dom.area.y) < 4, 'the HUD sits clear above the ball (the area + the clock share one row)');
  await shot(p, 'lab-390x844-start.png');

  // ---- A RUN THROUGH REAL DRAGS
  await tapAt(t, 195, 620);
  await waitFor(p, 'window.__ffLab.state().started', 3000);
  const s0 = await st(p);
  ok(s0.started && s0.moves === 0 && s0.a === 0, 'the first touch only STARTS the run (tick 0 = that touch) — the tower has not moved');
  // the ball has dropped in and bounces on floor 0: THE FRAME the game is played in
  await waitFor(p, "window.__ffLab.state().fl === 'bounce' && window.__ffLab.state().t > 60", 4000);
  const fr = (await st(p)).frame, below = fr.rows.slice(1).filter(y => y > fr.floorY && y < 0.985).length;
  ok(fr.floorY > 0.27 && fr.floorY < 0.40, `in play the ball's floor is ${(fr.floorY * 100).toFixed(0)} % down the screen (≈ 30 %)`);
  ok(below >= 4 && below <= 5, `${below} floors in sight below the ball's (4–5)`);
  const hudEnd0 = await p.evaluate(() => document.querySelector('.ff-row').getBoundingClientRect().bottom), apex0 = await p.evaluate(() => window.__ffLab.apexY());
  ok(hudEnd0 < apex0, `the HUD ends at ${hudEnd0.toFixed(0)} pt — above the ball's highest point (${apex0.toFixed(0)} pt)`);
  const hidden = await p.evaluate(() => ({ start: document.querySelector('.ff-start').hidden, bar: document.querySelector('.ff-bar').hidden }));
  ok(hidden.start && hidden.bar, 'in a run: the start card + the mode switch are off the screen (a thumb at the foot is a drag)');
  // 1 : 1 — a drag of 60 px turns the tower by 60 px of ring under the ball; at once (no frame to wait for)
  const k = 4096 / (2 * Math.PI * s0.pxPerRad);
  await drag(t, 120, 640, 60, { steps: 6 });
  const s1 = await st(p);
  const turned = angDiff(s1.a + s1.owed, s0.a);
  ok(Math.abs(turned - 60 * k) <= 6, `a 60 px drag to the right = ${turned} units (${(60 * k).toFixed(0)} is 1 : 1)`);
  ok(s1.moves >= 1, 'the move is in the log');
  await drag(t, 240, 640, -60, { steps: 6 });
  const s2 = await st(p);
  ok(Math.abs(angDiff(s2.a + s2.owed, s0.a)) <= 6, 'the same drag back: the tower is where it was');
  ok(Math.abs(60 * k / 4096 * 360 - 60 / s0.pxPerRad * 180 / Math.PI) < 0.01 && s0.pxPerRad > 60, `the drag's scale: ${s0.pxPerRad.toFixed(0)} px a radian (a full-width drag = ${(390 / s0.pxPerRad / (2 * Math.PI)).toFixed(2)} of a turn)`);
  // a flick faster than MAX SPIN: the tower catches up (the log never turns more than 171 a tick)
  await drag(t, 60, 640, 280, { steps: 1 });
  await sleep(250);
  const s3 = await st(p);
  ok(s3.owed === 0, 'a flick: what MAX SPIN held back is caught up within a moment');
  // drag to each floor's gap: the ball falls floor after floor
  let floors = 0;
  for (let n = 0; n < 60 && floors < 7; n++) {
    const now = await st(p);
    if (now.over) break;
    const need = await p.evaluate(() => window.__ffLab.toGap());
    const dx = need / k;
    if (Math.abs(dx) >= 1) await drag(t, 195 - dx / 2, 650, dx, { steps: Math.max(2, Math.ceil(Math.abs(dx) / 30)) });
    await waitFor(p, `window.__ffLab.state().floor > ${now.floor} || window.__ffLab.state().over`, 1500);
    floors = (await st(p)).floor;
  }
  const s4 = await st(p);
  ok(s4.floor >= 6 && !s4.over, `dragging each floor's gap under the ball: ${s4.floor} floors down`);
  ok(s4.hud[0] === String(s4.floor) && /^CLEAN \d+ · BLAZE (ON|—) · DARK [1-6]$/.test(s4.hud[1]), `the HUD follows: FLOOR ${s4.hud[0]} · ${s4.hud[1]}`);
  await shot(p, 'lab-390x844-run.png');
  // hands off: THE LIGHTS GO OUT (≤ 15 s after the last floor … or the ball lands on red on the way)
  const over = await waitFor(p, 'window.__ffLab.state().shown', 24000);
  ok(over, 'hands off the screen: the run ends by itself');
  const e = (await p.evaluate(() => window.__ffLab.ends))[0], s5 = await st(p);
  ok(['dark', 'red'].includes(e.live.cause) && s5.words === (e.live.cause === 'dark' ? 'THE LIGHTS WENT OUT' : 'HIT THE RED'), `the end's words: ${s5.words}`);
  ok(e.same && /^REPLAY = LIVE ✓ · floor \d+ · tick \d+ · \d+ moves/.test(s5.check), `the determinism check: ${s5.check}`);
  ok(e.judge.ok && e.judge.floor === e.live.floor && e.judge.end === e.live.end && e.replay.floor === e.live.floor, 'the judge re-plays the log: the same floor, the same end tick');
  const endDom = await p.evaluate(() => { const q = sel => document.querySelector(sel), r = q('.ff-again').getBoundingClientRect(); return { hidden: q('.ff-end').hidden, again: { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }, text: q('.ff-end-l').textContent, ok: q('.ff-check').classList.contains('is-ok') }; });
  ok(!endDom.hidden && endDom.again.h >= 48 && endDom.ok && /^FLOOR \d+ · THE ROOFTOP/.test(endDom.text), `the end card: "${endDom.text.split('\n')[0]}" + RESTART (${endDom.again.h.toFixed(0)} pt)`);
  await shot(p, 'lab-390x844-end.png');
  // a touch on the tower with the end up does nothing; RESTART = a fresh run on the same ?seed
  await tapAt(t, 195, 330);
  ok((await st(p)).shown, 'a touch on the play area does not restart (RESTART is its own button)');
  await tapAt(t, endDom.again.x, endDom.again.y);
  await waitFor(p, '!window.__ffLab.state().shown', 3000);
  const s6 = await st(p);
  ok(!s6.shown && !s6.started && s6.floor === 0 && s6.seed === 'lab1' && s6.moves === 0, 'RESTART: a fresh run waits for its touch — the same tower (?seed=)');
  // the corner RESTART mid-run
  await tapAt(t, 195, 620); await waitFor(p, 'window.__ffLab.state().started', 3000);
  await tapAt(t, 390 - 30, 30); await waitFor(p, '!window.__ffLab.state().started', 3000);
  ok(!(await st(p)).started, 'the corner RESTART ends a live run at once');

  // ---- THE LAB NEVER COUNTS: the whole session's requests
  const bad = t.reqs.filter(r => !allowed(r.split(' ')[1]));
  ok(bad.length === 0, `NO request but the page's own files + three.js (${t.reqs.length} requests${bad.length ? ` — NOT ALLOWED: ${bad.slice(0, 4).join(' | ')}` : ''})`);
  ok(!t.reqs.some(r => COUNTS.test(r.replace(BASE, '').replace('/freefall-lab', ''))), 'nothing that counts: no /api, no Firebase, no profile / progression / report / share / cards module');
  ok(t.reqs.every(r => r.startsWith('GET ')) && t.sockets.length === 0, 'only GETs, no web socket');
  const stored = await p.evaluate(async () => ({ ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie, sw: (await navigator.serviceWorker?.getRegistrations?.() || []).length }));
  ok(stored.ls === 0 && stored.ss === 0 && stored.cookie === '' && stored.sw === 0, 'nothing stored: no localStorage, no cookie, no service worker');
  ok(t.errs.length === 0, `no page error${t.errs.length ? `: ${t.errs[0]}` : ''}`);
  await t.close();
}

// ---- ?mode=match, a random seed, ?fps=1; the mode switch
{
  const m = await open(390, 844, 2, '?mode=match&fps=1');
  const s = await st(m.p);
  ok(s.mode === 'match' && s.hud[3] === 'MATCH · 3:00' && /^[0-9a-z]{4,}$/.test(s.seed), `?mode=match: ${s.hud[3]}, a random seed (${s.seed})`);
  ok(await m.p.evaluate(() => !!document.querySelector('.ff-fps')), '?fps=1: the readout is there');
  const tab = await m.p.evaluate(() => { const r = document.querySelector('.ff-tab[data-mode="solo"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await tapAt(m, tab.x, tab.y);
  await waitFor(m.p, "window.__ffLab.state().mode === 'solo'", 3000);
  const s2 = await st(m.p);
  ok(s2.mode === 'solo' && !s2.started && s2.seed !== s.seed, 'the mode switch: SOLO — a new run, a new seed');
  ok(m.errs.length === 0, 'no page error');
  await m.close();
}

// ---- the other sizes (the shots; the same checks of the frame)
for (const [w, h, dpr] of [[375, 667, 2], [430, 932, 3], [1440, 900, 1]]) {
  const o = await open(w, h, dpr, '?seed=lab1');
  await sleep(400);
  await shot(o.p, `lab-${w}x${h}-start.png`);
  if (w < 700) await tapAt(o, w / 2, h * 0.75); else await o.p.mouse.click(w / 2, h * 0.7);
  await waitFor(o.p, "window.__ffLab.state().fl === 'bounce' && window.__ffLab.state().t > 60", 4000);
  const s = await st(o.p), f = s.frame;
  const below = f.rows.slice(1).filter(y => y > f.floorY && y < 0.985).length;
  ok(o.up && f.ball.d >= 34 && f.floorY > 0.26 && f.floorY < 0.42 && below >= 4 && below <= 5, `${w} × ${h}: the ball ${f.ball.d.toFixed(0)} pt, its floor ${(f.floorY * 100).toFixed(0)} % down, ${below} floors below`);
  // the HUD never sits on the ball: its last line ends above the ball's highest point (the top of its bounce)
  const hudEnd = await o.p.evaluate(() => document.querySelector('.ff-row').getBoundingClientRect().bottom), apex = await o.p.evaluate(() => window.__ffLab.apexY());
  ok(hudEnd < apex, `${w} × ${h}: the HUD ends at ${hudEnd.toFixed(0)} pt, the ball's highest point is ${apex.toFixed(0)} pt`);
  await shot(o.p, `lab-${w}x${h}-play.png`);
  if (w === 1440) {
    // a desk: the mouse drags, the arrow keys spin
    const a0 = (await st(o.p)).a;
    await drag(o, 600, 620, 80, { steps: 5 });
    const a1 = (await st(o.p)).a;
    ok(a1 !== a0, 'a mouse drag spins the tower');
    await o.p.keyboard.down('ArrowLeft'); await sleep(200); await o.p.keyboard.up('ArrowLeft');
    const a2 = (await st(o.p)).a;
    ok(a2 !== a1 && angDiff(a2, a1) < 0, 'the arrow keys spin it too');
    await shot(o.p, 'lab-1440x900-run.png');
  }
  ok(o.errs.length === 0, `${w} × ${h}: no page error`);
  await o.close();
}

await b.close();
console.log(`\n${checks - fails.length} / ${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
