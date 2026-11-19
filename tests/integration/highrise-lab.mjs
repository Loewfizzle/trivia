// HIGH RISE S1 — THE HIGH RISE LAB's own check (/highrise-lab — js/games/highrise/lab.js + graybox.js — docs/highrise.md "THE LAB"), the
// BROWSER half of tests/highrise-lab.test.mjs, on the LOCAL server (NEVER THE LIVE SITE):
//   · the lab loads at 390 × 844: its stage, the graybox, TAP TO START; the first slab ≈ 60 % of the screen width; the HUD readable
//   · a BOT RUN THROUGH REAL TAPS (CDP touches, timed at each slab's perfect moment): the first touch only STARTS the run; every drop is
//     logged at the touch's own tick; a touch in a landing beat is not a drop; the view's tower == the engine's
//   · the run ends (THE FUSE): the cause's words big in the middle band (between the HUD and the top slab), TAP TO RETRY, **REPLAY = LIVE ✓**;
//     one tap = the next run; the longest end states (MADE IT TO THE MOTHERSHIP · TIME'S UP + the red REPLAY ≠ LIVE line) fit the phone
//   · the mode switch (SOLO / MATCH / DAILY, ?mode=) — BETWEEN runs only: off the screen while a run is live (a thumb at the foot is a
//     drop) · ?seed= (the same slabs every retry) · ?fps=1
//   · **THE LAB NEVER COUNTS**: NO request but the page's own static files + three.js from its CDN — no /api, no Firebase, no web
//     socket, no profile / progression / report / share / cards module, no service worker, nothing stored
//   · the shots (390 × 844 — the pass's review; + 375 × 667 and 1440 × 900) into [outDir] — kept out of git
//   node tests/integration/highrise-lab.mjs "<chromium>" [outDir]
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
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

/** THE ONLY REQUESTS THE LAB MAY MAKE: its own page + static files, and three.js from the import map's CDN */
const OWN = [/^\/highrise-lab(\.html)?$/, /^\/css\/highrise\.css$/, /^\/js\/games\/highrise\/(lab|graybox|tower|engine|replay|logic|meta|tuning)\.js$/, /^\/js\/core\/rng\.js$/, /^\/assets\/favicon-64\.png$/, /^\/favicon\.ico$/];
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
  await p.goto(guardUrl(`${BASE}/highrise-lab${q}`, 'highrise-lab'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__hiLab && !!document.querySelector('canvas.hi-canvas')");
  return { p, cdp, errs, reqs, sockets, up, touch: w < 700, close: () => ctx.close() };
}
const st = p => p.evaluate(() => window.__hiLab.state());
/** a REAL tap at (x, y): a touch through CDP on a phone, the mouse on a desktop */
async function tapAt(t, x, y) {
  if (!t.touch) { await t.p.mouse.click(x, y); return; }
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
  await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** wait IN THE PAGE until the sliding slab is `lead` ms before dead on → 'go' | 'over' | 'timeout' */
const atPerfect = (p, lead) => p.evaluate(ld => new Promise(res => {
  const t0 = performance.now();
  (function poll() {
    const L = window.__hiLab;
    if (L.state().over) return res('over');
    const m = L.msToPerfect();
    if (m != null && m <= ld) return res('go');
    if (performance.now() - t0 > 9000) return res('timeout');
    setTimeout(poll, m != null && m - ld > 12 ? Math.min(40, m - ld - 6) : 1);
  })();
}), lead);
const sameTop = s => JSON.stringify(s.top) === JSON.stringify(s.viewTop);

// ---- 390 × 844: the page, the graybox, the HUD
const t = await open(390, 844, 3);
{
  const { p } = t;
  ok(t.up, 'the lab loads at 390 × 844: its stage + the graybox canvas (no gate, no door)');
  await sleep(500);
  const s = await st(p);
  ok(s.mode === 'solo' && !s.started && s.floor === 0 && /^[0-9a-z]{4,}$/.test(s.seed), `a new run waits for its start: SOLO, floor 0, a random seed shown (${s.seed})`);
  const dom = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(e).fontSize), text: e.textContent }; };
    return { floor: box(q('.hi-floor')), k: box(q('.hi-k')), streak: box(q('.hi-streak')), sub: box(q('.hi-sub')), start: box(q('.hi-start-t')), startHidden: q('.hi-start').hidden, endHidden: q('.hi-end').hidden,
      tabs: [...document.querySelectorAll('.hi-tab')].map(e => ({ ...box(e), on: e.classList.contains('is-on') })), seed: box(q('.hi-seed')), fps: !!q('.hi-fps'), w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth };
  });
  ok(dom.floor.text === '0' && dom.floor.fs >= 64 && dom.floor.y < 844 * 0.15 && dom.k.text === 'FLOOR', `FLOOR big at the top (${dom.floor.fs} px)`);
  ok(dom.streak.text === 'STREAK 0' && dom.streak.fs >= 16 && dom.sub.text === 'SOLO · ENDLESS' && dom.sub.fs >= 13, 'the STREAK + the mode line under it, readable');
  ok(!dom.startHidden && dom.start.text === 'TAP TO START' && dom.start.fs >= 20 && dom.endHidden, 'TAP TO START in the middle');
  ok(dom.tabs.length === 3 && dom.tabs.map(x => x.text).join() === 'SOLO,MATCH,DAILY' && dom.tabs.every(x => x.h >= 44 && x.w >= 44 && x.x >= 0 && x.x + x.w <= dom.w) && dom.tabs[0].on && !dom.tabs[1].on, 'the mode switch: SOLO · MATCH · DAILY, each ≥ 44 pt, SOLO on');
  ok(dom.seed.text === `seed ${s.seed}` && dom.seed.fs >= 12 && !dom.fps, 'the seed shown; no fps readout without ?fps=1');
  ok(dom.scroll <= dom.w, 'no sideways scroll');
  const geo = await p.evaluate(() => { const V = window.__hiLab.view, a = V.project(5000, 0, -5000), c = V.project(-5000, 0, 5000), top = V.project(0, 0, 0); return { wide: Math.abs(a[0] - c[0]), level: Math.abs(a[1] - c[1]), topY: top[1], topX: top[0] }; });
  ok(geo.wide > 0.56 && geo.wide < 0.64, `THE FIRST SLAB ≈ 60 % of the screen width (${(geo.wide * 100).toFixed(1)} %)`);
  ok(geo.level < 0.01 && Math.abs(geo.topX - 0.5) < 0.02 && geo.topY > 0.5 && geo.topY < 0.68, `THE DIAGONAL CAMERA: the slab seen corner-on, level, centred, its top ${(geo.topY * 100).toFixed(0)} % down the screen`);
  ok(dom.floor.y + dom.floor.h < geo.topY * 844 - 60, 'the big FLOOR number sits clear above the tower\'s top');
  await shot(p, 'lab-390x844-start.png');

  // ---- A BOT RUN THROUGH REAL TAPS
  let best = null;
  for (let go = 0; go < 5 && !(best && best.floor >= 6); go++) {
    if (go) { await waitFor(p, 'window.__hiLab.state().shown', 12000); await sleep(700); }
    await tapAt(t, 195, 500);   // (the START — or TAP TO RETRY, which starts the next run)
    await waitFor(p, 'window.__hiLab.state().started && !window.__hiLab.state().over', 3000);
    const s0 = await st(p);
    if (!go) ok(s0.started && s0.taps === 0 && s0.floor === 0, 'the first touch only STARTS the run (tick 0 = that touch) — it is not a drop');
    if (!go) ok(await p.evaluate(() => document.querySelector('.hi-bar').hidden && getComputedStyle(document.querySelector('.hi-bar')).display === 'none'), 'while a run is LIVE the mode switch is off the screen (a thumb at the foot is a drop, never a restart)');
    let beatChecked = go > 0, tops = true, floors = 0;
    for (let i = 0; i < 14; i++) {
      const sig = await atPerfect(p, 14);
      if (sig !== 'go') break;
      const before = await st(p);
      await tapAt(t, 195, i % 2 ? 787 : 500);   // (every other tap at the FOOT, where the mode switch sits between runs)
      const after = await st(p);
      if (after.taps !== before.taps + 1) { tops = false; break; }
      if (!after.over) { floors = after.floor; if (!sameTop(after)) await sleep(40); }
      if (!beatChecked && !after.over && after.st === 'beat') {
        await tapAt(t, 195, 500);   // (a touch in THE LANDING BEAT)
        const again = await st(p);
        ok(again.taps === after.taps && again.floor === after.floor, 'a touch in the landing beat is not a drop: nothing logged, nothing changed');
        beatChecked = true;
      }
      if (after.over) break;
    }
    const s1 = await st(p);
    if (!best || s1.floor > best.floor) best = { floor: s1.floor, taps: s1.taps, tops, floors };
    if (go === 0 || s1.floor >= 6) {
      await sleep(80);
      const s2 = await st(p);
      ok(tops && s2.mode === 'solo' && (s2.over || sameTop(s2)), `every real tap is one logged drop — in the middle or at the foot (${s2.taps} taps → floor ${s2.floor}); the view's tower == the engine's`);
      if (!s2.over) {
        await shot(p, 'lab-390x844-run.png');
        // (the review: a shot WITH the sliding slab — the next slab on its way in; the bot has stopped tapping: THE FUSE follows)
        if (await waitFor(p, '(() => { const m = window.__hiLab.msToPerfect(); return m != null && m > 150 && m < 520; })()', 4000)) await shot(p, 'lab-390x844-slide.png');
      }
    }
  }
  ok(best && best.floor >= 3, `the bot's real taps build a tower (floor ${best && best.floor})`);
  // … then it stops tapping: THE FUSE ends the run
  ok(await waitFor(p, 'window.__hiLab.state().shown', 15000), 'the run ends by itself (THE FUSE)');
  const e = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(el).fontSize), text: el.textContent }; };
    const L = window.__hiLab, last = L.ends[L.ends.length - 1];
    return { hidden: q('.hi-end').hidden, panel: box(q('.hi-end')), bar: !q('.hi-bar').hidden, top: L.view.project(0, L.state().floor, 0)[1] * innerHeight, hudBottom: q('.hi-sub').getBoundingClientRect().bottom, words: box(q('.hi-end-t')), line: box(q('.hi-end-l')), go: box(q('.hi-end-go')), check: box(q('.hi-check')), okCls: q('.hi-check').classList.contains('is-ok'), ends: L.ends.map(x => ({ same: x.same, cause: x.live.cause, floor: x.live.floor, taps: x.taps.length })), last: { same: last.same, at: last.at, live: last.live, replay: last.replay }, s: L.state() };
  });
  ok(!e.hidden && ['TOO SLOW', 'MISSED THE STACK', 'SLIPPED OFF'].includes(e.words.text) && e.words.fs >= 30 && e.words.y > 844 * 0.25 && e.words.y + e.words.h < 844 * 0.5, `on OUT the cause's words big in the middle band: "${e.words.text}" (${e.words.fs} px)`);
  ok(e.panel.y >= e.hudBottom && e.panel.y + e.panel.h <= e.top + 6 && e.bar, `the end's words sit between the HUD and the middle of the top slab — the action stays in view (panel ${e.panel.y.toFixed(0)}–${(e.panel.y + e.panel.h).toFixed(0)}, the top slab at ${e.top.toFixed(0)}); the mode switch is back`);
  ok(e.go.text === 'TAP TO RETRY' && e.go.fs >= 20 && /^FLOOR \d+\n\d+ PERFECTS? · BEST STREAK \d+$/.test(e.line.text), `TAP TO RETRY under it (+ "${e.line.text.replace('\n', ' / ')}")`);
  ok(/^REPLAY = LIVE ✓ · floor \d+ · tick \d+ · \d+ taps$/.test(e.check.text) && e.okCls && e.last.same && JSON.stringify(e.last.live) === JSON.stringify(e.last.replay), `after the run: ${e.check.text}`);
  ok(e.ends.every(x => x.same), `every run of this page so far: REPLAY = LIVE (${e.ends.map(x => `${x.cause} floor ${x.floor}, ${x.taps} taps`).join(' · ')})`);
  ok([e.words, e.line, e.go, e.check].every(x => x.x >= 0 && x.x + x.w <= 390), 'the end\'s words fit the screen');
  await shot(p, 'lab-390x844-out.png');
  // one tap = the next run
  await sleep(700);
  const seedWas = e.s.seed;
  await tapAt(t, 195, 500);
  await waitFor(p, 'window.__hiLab.state().started && !window.__hiLab.state().shown', 3000);
  const r = await st(p);
  ok(r.started && !r.shown && r.floor === 0 && r.taps === 0 && r.seed !== seedWas, 'ONE tap = TAP TO RETRY: the next run is on, a new random seed');
  ok(await p.evaluate(() => document.querySelector('.hi-end').hidden && document.querySelector('.hi-start').hidden), '… the end\'s words gone');
  // the mode switch lives BETWEEN runs: end this one (a drop the moment the slab enters — off the tower), then a real tap on MATCH
  await waitFor(p, "window.__hiLab.state().st === 'slide'", 3000);
  await tapAt(t, 195, 500);
  ok(await waitFor(p, "window.__hiLab.state().shown && !document.querySelector('.hi-bar').hidden", 6000) && (await p.evaluate(() => document.querySelector('.hi-end-t').textContent)) === 'MISSED THE STACK', 'a drop with the slab off the tower: MISSED THE STACK — the mode switch is back');
  const tab = await p.evaluate(() => { const r = document.querySelector('.hi-tab[data-mode="match"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await tapAt(t, tab[0], tab[1]);
  await waitFor(p, "window.__hiLab.state().mode === 'match' && document.querySelector('.hi-sub').textContent.startsWith('MATCH')", 3000);
  const m = await st(p);
  const sub = await p.evaluate(() => [document.querySelector('.hi-sub').textContent, document.querySelector('.hi-tab[data-mode="match"]').classList.contains('is-on'), document.querySelector('.hi-start').hidden]);
  ok(m.mode === 'match' && !m.started && m.taps === 0 && sub[0] === 'MATCH · 6:00' && sub[1] && !sub[2], 'the mode switch: MATCH — a fresh run waits for its start, the clock shows its 6:00 cap');
  // THE LONGEST END STATES fit the phone (a LOOK CHECK — the panel filled by hand: floor 200 takes 3:28 of perfect taps)
  for (const [cause, bad, name] of [['made', false, 'lab-390x844-made.png'], ['cap', true, 'lab-390x844-timesup-bad.png']]) {
    const f = await p.evaluate((c, bd) => {
      const L = window.__hiLab; L.showWords(c, bd);
      const q = sel => document.querySelector(sel), box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(el).fontSize), text: el.textContent, sw: el.scrollWidth, cw: el.clientWidth }; };
      return { panel: box(q('.hi-end')), words: box(q('.hi-end-t')), check: box(q('.hi-check')), go: box(q('.hi-end-go')), top: L.view.project(0, L.state().floor, 0)[1] * innerHeight, hudBottom: q('.hi-sub').getBoundingClientRect().bottom };
    }, cause, bad);
    ok(f.words.fs >= 30 && [f.words, f.check, f.go].every(x => x.x >= 0 && x.x + x.w <= 390 && x.sw <= x.cw + 1) && f.panel.y >= f.hudBottom - 2 && f.panel.y + f.panel.h <= f.top + 6,
      `"${f.words.text}"${bad ? ' + the long REPLAY ≠ LIVE line' : ''}: fits the phone, between the HUD and the tower's top (panel ${f.panel.y.toFixed(0)}–${(f.panel.y + f.panel.h).toFixed(0)}, HUD to ${f.hudBottom.toFixed(0)}, the top slab at ${f.top.toFixed(0)})`);
    await shot(p, name);
  }
  await p.evaluate(() => window.__hiLab.restart());
  ok(t.errs.length === 0, `no page error (${t.errs.join(' | ')})`);

  // ---- THE LAB NEVER COUNTS
  const stray = t.reqs.filter(x => !allowed(x.slice(x.indexOf(' ') + 1)) || !x.startsWith('GET '));
  ok(stray.length === 0, `NO request but the page's own static files + three.js from its CDN (${t.reqs.length} requests${stray.length ? ` — STRAY: ${stray.join(' , ')}` : ''})`);
  ok(t.reqs.some(x => x.endsWith(THREE_URL)) && t.reqs.some(x => x.endsWith('/js/games/highrise/engine.js')), '… (the graybox\'s three.js + the engine really came through them)');
  ok(!t.reqs.some(x => COUNTS.test(x.replace('/highrise-lab', ''))), 'no /api, no Firebase, no profile / progression / report / share / cards / app module was loaded');
  ok(t.sockets.length === 0, 'no web socket');
  const page = await p.evaluate(async () => ({
    res: performance.getEntriesByType('resource').map(x => x.name), ls: Object.keys(localStorage).length, ss: Object.keys(sessionStorage).length, cookie: document.cookie,
    sw: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0, arcade: typeof window.__arcade, fb: typeof window.firebase,
  }));
  ok(page.res.every(allowed), `the page's own resource list agrees (${page.res.length} resources)`);
  ok(page.ls === 0 && page.ss === 0 && page.cookie === '' && page.sw === 0 && page.arcade === 'undefined', 'nothing stored (no localStorage, no sessionStorage, no cookie), no service worker, no app');
}
await t.close();

// ---- ?mode= · ?seed= · ?fps=1
{
  const d = await open(390, 844, 3, '?mode=daily&seed=abc&fps=1');
  const { p } = d;
  await sleep(900);
  const s = await st(p);
  const dom = await p.evaluate(() => [document.querySelector('.hi-sub').textContent, document.querySelector('.hi-seed').textContent, (document.querySelector('.hi-fps') || {}).textContent || '', document.querySelector('.hi-tab[data-mode="daily"]').classList.contains('is-on')]);
  ok(s.mode === 'daily' && s.seed === 'abc' && dom[0] === 'DAILY · 5:00' && dom[1] === 'seed abc' && dom[3], '?mode=daily&seed=abc: the daily (its 5:00 cap), the seed "abc" shown');
  ok(/^\d+ fps · [\d.]+ ms · worst \d+ · \d+ calls · \d+ tris · 390×844 @3 · tick \d+$/.test(dom[2]), `?fps=1: the frame-rate readout (${dom[2]})`);
  // the same seed = the same slabs: two runs' first slab the same; out at once (a tap as it enters), retry keeps the seed
  await tapAt(d, 195, 500);
  await waitFor(p, "window.__hiLab.state().st === 'slide'", 3000);
  const a = await st(p);
  await tapAt(d, 195, 500);   // (a drop the moment it entered: off the tower — MISSED THE STACK)
  ok(await waitFor(p, 'window.__hiLab.state().shown', 6000), 'a tap with the slab off the tower ends the run');
  const words = await p.evaluate(() => [document.querySelector('.hi-end-t').textContent, document.querySelector('.hi-check').textContent]);
  ok(words[0] === 'MISSED THE STACK' && /^REPLAY = LIVE ✓/.test(words[1]), `"${words[0]}" — ${words[1]}`);
  await sleep(700);
  await tapAt(d, 195, 500);
  await waitFor(p, "window.__hiLab.state().st === 'slide' && !window.__hiLab.state().shown", 3000);
  const c = await st(p);
  ok(c.seed === 'abc' && c.S === a.S && c.s0 === a.s0, '?seed= stays for every retry: the same slabs again');
  ok(d.errs.length === 0 && d.reqs.every(x => allowed(x.slice(x.indexOf(' ') + 1))), 'no page error, no stray request');
  await d.close();
}

// ---- the other sizes (the review's shots): a small phone + 1440 × 900 (DESKTOP COMES FREE)
for (const [w, h, dpr, name] of [[375, 667, 2, 'lab-375x667'], [1440, 900, 1, 'lab-1440x900']]) {
  const d = await open(w, h, dpr, '?seed=shot');
  const { p } = d;
  await sleep(500);
  await tapAt(d, w / 2, h * 0.6);
  let n = 0;
  for (let i = 0; i < 7; i++) { if (await atPerfect(p, 14) !== 'go') break; await tapAt(d, w / 2, h * 0.6); n++; if ((await st(p)).over) break; }
  await sleep(120);
  const s = await st(p);
  const dom = await p.evaluate(() => { const r = document.querySelector('.hi-floor').getBoundingClientRect(), V = window.__hiLab.view, a = V.project(5000, 0, -5000), c = V.project(-5000, 0, 5000); return { fb: r.bottom, wide: Math.abs(a[0] - c[0]) * innerWidth, scroll: document.documentElement.scrollWidth, w: innerWidth }; });
  ok(d.up && s.taps === n && dom.scroll <= dom.w && d.errs.length === 0, `${w} × ${h}: the lab runs (floor ${s.floor} after ${n} real taps), no sideways scroll, no page error`);
  if (w > 700) ok(dom.wide > 0.5 * 0.62 * h && dom.wide < 0.7 * 0.62 * h, `${w} × ${h}: the first slab = 60 % of a phone-shaped column (${dom.wide.toFixed(0)} px wide)`);
  await shot(p, `${name}.png`);
  await d.close();
}

await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
