// HIGH RISE S5 — THE PLACE NUMBER + THE RANKED LIST IN WATCH + THE ANNOUNCER CHECK (docs/highrise.md "THE MATCH" · docs/games/passes/
// highrise-s5.md "GROUP 1"), on the LOCAL server (NEVER THE LIVE SITE): /highrise-play?mode=match&rivals=7 — you + seven bot rivals on
// the same seed (nothing counts), 390 × 844 @3, by NIGHT and by DAY.
//   · THE PLACE NUMBER: the run starts 20 floors up, the game is FROZEN on one instant (hook.freeze) and the bots' pump stopped; the
//     rivals' rows are then handed in by hand so YOUR place is exactly 1ST · 4TH · 8TH — "1ST / 8" gold, the others white; "/ 8" smaller
//     + dimmer. Its box: top-left, under ☰, clear of THE DROP ZONE + of the tags' column; its size read at 390 unzoomed. A change = ONE
//     pulse (up = cyan, down = soft pink — its glow copy's class + a running animation); the SAME place handed again writes NOTHING
//     (a MutationObserver on it); a place is a live climber's only (gone in WATCH).
//   · THE RANKED LIST (WATCH only): the run ends, the page WATCHES the leader (the cartridge's flow on the page); every row ≥ 44 pt with
//     the place, the colour bar, the name, the floor; the watched row lit; a tap on a row = watch that player; a tap elsewhere = the next.
//   · THE ANNOUNCER: one short line, ≥ 16 px, inside the HUD's column — never over THE DROP ZONE or a tag; held ≈ 1.2–1.6 s before it
//     fades; the same words twice inside 4 s = said once.
//   · THE ALTIMETER is gone from live play (no `.hi-alt` row shows while you climb).
//   node tests/integration/highrise-place.mjs "<chromium>" [outDir]     (outDir: the shots — Downloads\NEON\highrise-s5\match)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
const LOOKS = (process.env.PLACE_LOOKS || 'night,day').split(',');
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(p, js, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await p.evaluate(js); if (v) return v; } catch { /* loading */ } await sleep(60); } return null; }
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

/** the rivals' rows for an exact place: `above` of the seven over your floor, the rest under it (two floors or more: a tape) */
const ROWS = (above, look) => `(() => {
  const L = window.__hiPlay, F = L.state().floor, N = ['ALEX','BOB','CLEO','DEE','EVE','FINN','GUS'], C = ['#00f0ff','#ff2bd6','#3dff8b','#f3ff3a','#ff8a3d','#8f7bff','#ff5a5a'];
  const rgb = h => [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
  const rows = N.map((n, i) => ({ uid: 's' + i, name: n, hex: C[i], rgb: rgb(C[i]), floor: i < ${above} ? F + 1 + i * 2 : F - 2 - (i - ${above}) * 2, perfects: 0, over: false, end: '', silent: false, me: false, watched: false }));
  rows.push({ uid: 'me', name: 'YOU', hex: '#ffffff', rgb: [1,1,1], floor: F, perfects: 0, over: false, end: '', silent: false, me: true, watched: false });
  L.rivals(rows); return F;
})()`;

for (const look of LOOKS) {
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|404/.test(m.text())) errs.push(`console: ${m.text()}`); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?mode=match&rivals=7&seed=place5&floor=20&look=${look}`, 'highrise-play'), { waitUntil: 'load' });
  ok(!!await until(p, '(() => { const L = window.__hiPlay; return L && L.sim && L.state().warm; })()', 25000), `${look}: the page + its seven bots are up, the scene warm`);
  await p.evaluate("document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }))");
  ok(!!await until(p, '(() => { const L = window.__hiPlay; return L.phase() === 1 && L.state().floor >= 20; })()'), `${look}: the run is LIVE from floor 20`);
  await sleep(700);
  // THE ALTIMETER IS GONE from live play
  const altRows = await p.evaluate("[...document.querySelectorAll('.hi-alt li')].filter(li => li.getBoundingClientRect().height > 0).length");
  ok(altRows === 0, `${look}: no altimeter while you climb (${altRows} rows shown)`);
  // freeze + the bots' pump stopped: YOUR place set by hand
  await p.evaluate('window.__hiPlay.sim.stop(); window.__hiPlay.freeze(true)');
  const places = [[0, '1ST / 8', 'first'], [3, '4TH / 8', 'mid'], [7, '8TH / 8', 'last']];
  for (const [above, want, tag] of places) {
    await p.evaluate(ROWS(above, look));
    const got = await until(p, `(() => { const s = window.__hiPlay.matchState(); return s.place === '${want}' ? s : null; })()`, 4000);
    ok(!!got, `${look}: THE PLACE NUMBER reads "${want}" (${got ? got.place : (await p.evaluate('window.__hiPlay.matchState().place'))})`);
    await sleep(800);   // (the pulse's 650 ms over: the still number)
    const geo = await p.evaluate(`(() => {
      const el = document.querySelector('.hi-place'), r = el.getBoundingClientRect(), n = el.querySelector('.hi-place-in b').getBoundingClientRect(), of = el.querySelector('.hi-place-in span');
      const cs = getComputedStyle(el.querySelector('.hi-place-in')), ocs = getComputedStyle(of);
      const tags = [...document.querySelectorAll('.hi-rtag:not([hidden])')].map(t => t.getBoundingClientRect()).map(q => ({ l: q.left, t: q.top, b: q.bottom }));
      const st = window.__hiPlay.state(), zone = window.__hiPlay.view.restZone();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, digitH: n.height, color: cs.color, ofColor: ocs.color, ofSize: parseFloat(ocs.fontSize), numSize: parseFloat(getComputedStyle(el.querySelector('.hi-place-in b')).fontSize), tags, zone, first: el.classList.contains('is-first'), shown: getComputedStyle(el).display !== 'none' };
    })()`);
    const zoneTop = typeof geo.zone === 'number' ? geo.zone * 844 : null;
    ok(geo.shown && geo.l >= 8 && geo.t >= 50 && geo.r <= 140, `${look} ${tag}: top-left under ☰ (${geo.l.toFixed(0)},${geo.t.toFixed(0)} → ${geo.r.toFixed(0)},${geo.b.toFixed(0)})`);
    ok(geo.numSize >= 44 && geo.ofSize < geo.numSize * 0.6, `${look} ${tag}: BIG at 390 unzoomed — the number ${geo.numSize}px, "/ 8" ${geo.ofSize}px (smaller)`);
    ok(geo.tags.every(q => q.l > geo.r + 40 || q.t > geo.b), `${look} ${tag}: clear of the tags' column`);
    if (zoneTop != null) ok(geo.b < zoneTop, `${look} ${tag}: clear of THE DROP ZONE (ends at ${geo.b.toFixed(0)} — the zone from ${zoneTop.toFixed(0)})`);
    ok((tag === 'first') === geo.first, `${look} ${tag}: ${tag === 'first' ? '1ST is GOLD' : 'white (gold = 1ST only)'} (${geo.color})`);
    await shot(p, `place-${look}-390x844-${tag}.png`);
  }
  // THE SAME place handed again writes NOTHING; a change = one pulse (8TH → 2ND: up = cyan)
  const muts = await p.evaluate(`(() => new Promise(res => {
    const el = document.querySelector('.hi-place'); let n = 0; const mo = new MutationObserver(m => { n += m.length; }); mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });
    for (let i = 0; i < 5; i++) ${ROWS(7, look)};
    setTimeout(() => { mo.disconnect(); res(n); }, 400);
  }))()`);
  ok(muts === 0, `${look}: the SAME place handed five times writes NOTHING (${muts} mutations)`);
  await p.evaluate(ROWS(1, look));
  await until(p, "window.__hiPlay.matchState().place === '2ND / 8'", 3000);
  await sleep(120);
  const up = await p.evaluate("(() => { const fx = document.querySelector('.hi-place-fx'); return { cls: fx.className, running: fx.getAnimations().length, op: Number(getComputedStyle(fx).opacity) }; })()");
  ok(/is-up/.test(up.cls) && up.running > 0, `${look}: a better place = the CYAN pulse (${up.cls}, ${up.running} animation, opacity ${up.op.toFixed(2)})`);
  await shot(p, `place-${look}-390x844-pulse-up.png`);
  await sleep(800);
  await p.evaluate(ROWS(5, look));
  await until(p, "window.__hiPlay.matchState().place === '6TH / 8'", 3000);
  await sleep(120);
  const dn = await p.evaluate("(() => { const fx = document.querySelector('.hi-place-fx'); return { cls: fx.className, running: fx.getAnimations().length }; })()");
  ok(/is-down/.test(dn.cls) && dn.running > 0, `${look}: a worse place = the soft PINK pulse (${dn.cls})`);
  await shot(p, `place-${look}-390x844-pulse-down.png`);
  await sleep(800);

  // THE ANNOUNCER: geometry + hold + no repeat burst
  const ann = await p.evaluate(`(() => new Promise(res => {
    const H = window.__hiPlay.hud(); H.announce('YOU PASSED CHRISTOPHER', 'pass'); H.announce('YOU PASSED CHRISTOPHER', 'pass'); H.announce('YOU PASSED CHRISTOPHER', 'pass');
    const t0 = performance.now(); let outAt = 0;
    const el = () => document.querySelector('.hi-ann-in');
    const first = el(); const r = first.getBoundingClientRect(), fs = parseFloat(getComputedStyle(first).fontSize);
    const tags = [...document.querySelectorAll('.hi-rtag:not([hidden])')].map(t => t.getBoundingClientRect()).map(q => ({ l: q.left, t: q.top, r: q.right, b: q.bottom }));
    const iv = setInterval(() => { const e = el(); if (!outAt && (!e || e.classList.contains('is-out'))) outAt = performance.now() - t0; }, 20);
    setTimeout(() => { clearInterval(iv); res({ l: r.left, r: r.right, t: r.top, b: r.bottom, fs, lines: Math.round(r.height / (fs * 1.2)), hold: outAt, log: window.__hiPlay.matchState().calls.filter(c => c === 'YOU PASSED CHRISTOPHER').length, tags, zone: window.__hiPlay.view.restZone() }); }, 2600);
  }))()`);
  ok(ann.fs >= 16 && ann.b - ann.t < ann.fs * 2.4, `${look}: the announcer is ONE short line, big (${ann.fs}px, ${(ann.b - ann.t).toFixed(0)} px tall, ${ann.l.toFixed(0)} → ${ann.r.toFixed(0)})`);
  ok(ann.hold >= 1150 && ann.hold <= 1700, `${look}: held ${ann.hold.toFixed(0)} ms before it fades (1.2–1.6 s)`);
  ok(ann.log === 1, `${look}: the same words three times in a burst = said ONCE (${ann.log})`);
  ok(typeof ann.zone !== 'number' || ann.b < ann.zone * 844, `${look}: the announcer never sits over THE DROP ZONE (ends ${ann.b.toFixed(0)}, the zone from ${typeof ann.zone === 'number' ? (ann.zone * 844).toFixed(0) : '?'})`);
  ok(ann.tags.every(q => q.t > ann.b || q.b < ann.t || q.l > ann.r || q.r < ann.l), `${look}: … nor over a tag`);

  // WATCH with the ranked list: the run ends (the bots' pump back on), the page watches the leader
  await p.evaluate("window.__hiPlay.freeze(false); window.__hiPlay.sim.stop(); window.__hiPlay.sim = null");
  await p.goto(guardUrl(`${BASE}/highrise-play?mode=match&rivals=7&seed=place5&floor=6&look=${look}`, 'highrise-play'), { waitUntil: 'load' });
  await until(p, '(() => { const L = window.__hiPlay; return L && L.sim && L.state().warm; })()', 25000);
  await p.evaluate("document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }))");
  await until(p, 'window.__hiPlay.phase() === 1');
  // (no tap of yours: your slab's fuse ends the run — TOO SLOW — then WATCH)
  const w = await until(p, '(() => { const L = window.__hiPlay, s = L.matchState(); return L.watching() && s.alt.length === 8 ? s : null; })()', 20000);
  ok(!!w, `${look}: OUT → WATCH on the test page (watching ${w ? w.watching : '—'}; the list: ${w ? w.alt.map(r => r.text).join(' | ') : '—'})`);
  // (the one you follow STAYS while they climb — level bots used to swap the view at every floor)
  const firstW = await p.evaluate('window.__hiPlay.watching()');
  let swaps = 0, prevW = firstW;
  for (let i = 0; i < 30; i++) { await sleep(100); const s = await p.evaluate("(() => { const L = window.__hiPlay; return { w: L.watching(), out: (L.sim.state().find(x => x.uid === L.watching()) || {}).over }; })()"); if (s.w !== prevW) { if (!s.out) swaps++; prevW = s.w; } }
  ok(swaps === 0, `${look}: WATCH stays on ${firstW} while they climb — no swap between level players (${swaps} in 3 s)`);
  await sleep(300);
  const L = await p.evaluate(`(() => {
    const lis = [...document.querySelectorAll('.hi-alt li')], r = lis.map(li => li.getBoundingClientRect());
    const hud = document.querySelector('.hi-num').getBoundingClientRect(), list = document.querySelector('.hi-alt').getBoundingClientRect();
    return { n: lis.length, minH: Math.min(...r.map(q => q.height)), watched: lis.filter(li => li.classList.contains('is-watched')).map(li => li.dataset.uid), me: lis.filter(li => li.classList.contains('is-me')).length, ranks: lis.map(li => li.querySelector('em').textContent), floors: lis.map(li => Number(li.querySelector('b').textContent)), place: getComputedStyle(document.querySelector('.hi-place')).display, hudL: hud.left, listR: list.right, nameFs: parseFloat(getComputedStyle(lis[0].querySelector('.hi-alt-n')).fontSize) };
  })()`);
  ok(L.n === 8 && L.minH >= 44, `${look}: WATCH's ranked list — 8 rows, each ≥ 44 pt (${L.minH.toFixed(0)}), names ${L.nameFs}px`);
  ok(L.floors.every((f, i) => i === 0 || f <= L.floors[i - 1]) && L.ranks[0] === '1', `${look}: … the highest first (${L.floors.join(' · ')}; places ${L.ranks.join(' ')})`);
  ok(L.watched.length === 1 && L.me === 1, `${look}: … the watched row lit (${L.watched[0]}), YOU outlined`);
  ok(L.place === 'none', `${look}: … THE PLACE NUMBER is gone while you watch`);
  ok(L.hudL >= L.listR - 1, `${look}: … the watched tower's number stands clear of the list (the number from ${L.hudL.toFixed(0)}, the list to ${L.listR.toFixed(0)})`);
  await shot(p, `watch-${look}-390x844-list.png`);
  // a tap on a row = watch that player (press + lift on the row) — the LAST row that is not YOU and not watched
  const target = await p.evaluate(`(() => { const lis = [...document.querySelectorAll('.hi-alt li')].filter(li => !li.classList.contains('is-me') && !li.classList.contains('is-watched')); const li = lis[lis.length - 1]; const r = li.getBoundingClientRect(); return { uid: li.dataset.uid, x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await p.touchscreen.tap(target.x, target.y);
  ok(!!await until(p, `window.__hiPlay.watching() === '${target.uid}'`, 4000), `${look}: a tap on a row = WATCH that player (${target.uid})`);
  await sleep(500);
  await shot(p, `watch-${look}-390x844-picked.png`);
  // a tap anywhere else = the next player
  const before = await p.evaluate('window.__hiPlay.watching()');
  await p.touchscreen.tap(300, 620);
  const after = await until(p, `(() => { const u = window.__hiPlay.watching(); return u && u !== '${before}' ? u : null; })()`, 4000);
  ok(!!after, `${look}: a tap off the list = the next player (${before} → ${after})`);
  ok(errs.length === 0, `${look}: no page error (${errs.join(' | ')})`);
  await p.close();
}
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
