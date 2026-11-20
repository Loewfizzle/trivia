// HIGH RISE S5 — THE PLACE NUMBER + THE RANKED LIST IN WATCH + THE ANNOUNCER CHECK (docs/highrise.md "THE MATCH" · docs/games/passes/
// highrise-s5.md "GROUP 1"), on the LOCAL server (NEVER THE LIVE SITE): /highrise-play?mode=match&rivals=7 — you + seven bot rivals on
// the same seed (nothing counts), 390 × 844 @3, by NIGHT and by DAY.
//   · THE PLACE NUMBER: the run starts 20 floors up, the game is FROZEN on one instant (hook.freeze) and the bots' pump stopped; the
//     rivals' rows are then handed in by hand so YOUR place is exactly 1ST · 4TH · 8TH — "1ST / 8" gold, the others white; "/ 8" smaller
//     + dimmer, UNDER it (REVIEW FIX A). Its box: ALONE top-right, under the music button, clear of THE DROP ZONE + of the tags' column;
//     its size read at 390 unzoomed. THE TOP HUD's GAPS (REVIEW FIX A — the review measured 6 · 0 · 12 · 4 px): the floor → the band
//     line → the callout → the announcer, each ≥ 16 px; the place number ≥ 16 px clear of every one of them + of the tags — with a
//     PERFECT ×5 AND a pass call on screen at once, at every place, by day + night. Ties (the owner's call): the floor, then the most
//     perfects — seven level bots no longer all "1". A change = ONE
//     pulse (up = cyan, down = soft pink — its glow copy's class + a running animation); the SAME place handed again writes NOTHING
//     (a MutationObserver on it); a place is a live climber's only (gone in WATCH).
//   · THE RANKED LIST (WATCH only): the run ends, the page WATCHES the leader (the cartridge's flow on the page); every row ≥ 44 pt with
//     the place, the colour bar, the name, the floor; the watched row lit; a tap on a row = watch that player; a tap elsewhere = the next.
//     REVIEW FIX A (SHOULD 2): at most 5 rows (the leaders + the watched + YOU, "+N MORE") — the list ends above THE DROP ZONE.
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
/** THE TOP HUD's boxes (REVIEW FIX A): the floor's digits · the band line (its box + its words) · the call lane (its box + its baked
 *  words) · the announcer's lane (its box + its line) · THE PLACE NUMBER · the tags */
const HUD_GEO = `(() => {
  const R = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
  const span = els => { const r = els.map(R).filter(q => q && q.r > q.l); return r.length ? { l: Math.min(...r.map(q => q.l)), t: Math.min(...r.map(q => q.t)), r: Math.max(...r.map(q => q.r)), b: Math.max(...r.map(q => q.b)) } : { l: 0, t: 0, r: 0, b: 0 }; };
  const q = s => document.querySelector(s);
  const words = el => { const rg = document.createRange(); rg.selectNodeContents(el); const q = rg.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
  const callc = q('.hi-callc'), call = q('.hi-call');
  return {
    num: span([...document.querySelectorAll('.hi-num .hi-dg')]), bandrow: R(q('.hi-bandrow')), bandText: span([q('.hi-band'), q('.hi-clock')].map(e => e && e.textContent ? words(e) : null).filter(Boolean).map(w => ({ getBoundingClientRect: () => ({ left: w.l, top: w.t, right: w.r, bottom: w.b }) }))),
    bandWords: q('.hi-bandrow').textContent, call: R(call), callText: words(q('.hi-callt') || call), ann: R(q('.hi-ann')), annText: R(q('.hi-ann-in')) || { l: 0, t: 0, r: 0, b: 0 },
    place: R(q('.hi-place')), tags: [...document.querySelectorAll('.hi-rtag:not([hidden])')].map(R),
  };
})()`;
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
  await shot(p, `place-${look}-390x844-start.png`);
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
      const o = of.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, numB: n.bottom, ofT: o.top, ofR: o.right, digitH: n.height, color: cs.color, ofColor: ocs.color, ofSize: parseFloat(ocs.fontSize), numSize: parseFloat(getComputedStyle(el.querySelector('.hi-place-in b')).fontSize), tags, zone, first: el.classList.contains('is-first'), shown: getComputedStyle(el).display !== 'none' };
    })()`);
    const zoneTop = typeof geo.zone === 'number' ? geo.zone * 844 : null;
    ok(geo.shown && geo.r <= 382 && geo.r >= 360 && geo.l >= 260 && geo.t >= 56, `${look} ${tag}: ALONE top-right, under the music button (${geo.l.toFixed(0)},${geo.t.toFixed(0)} → ${geo.r.toFixed(0)},${geo.b.toFixed(0)})`);
    ok(geo.ofT >= geo.numB - 1 && geo.ofR >= geo.r - 6, `${look} ${tag}: "/ 8" small UNDER the ordinal, right-aligned (the ordinal to ${geo.numB.toFixed(0)}, "/ 8" from ${geo.ofT.toFixed(0)})`);
    // THE TOP HUD's gaps — a PERFECT ×5 on the game's lane + a pass call on the announcer, both up at once
    await p.evaluate("window.__hiPlay.say('PERFECT ×5'); window.__hiPlay.hud().announce('CHRISTOPHER PASSED YOU', 'passed')");
    await sleep(450);
    const g = await p.evaluate(HUD_GEO);
    const gaps = [['the floor → the band line', g.bandrow.t - g.num.b], ['the band line → the callout', g.call.t - g.bandrow.b], ['the callout → the announcer', g.ann.t - g.call.b]];
    for (const [what, v] of gaps) ok(v >= 16, `${look} ${tag}: ${what} ${v.toFixed(0)} px (≥ 16)`);
    const sep = (a, q) => Math.max(q.l - a.r, a.l - q.r, q.t - a.b, a.t - q.b);
    for (const [what, q] of [['the floor', g.num], ['the band line', g.bandText], ['the callout', g.callText], ['the announcer', g.annText], ...g.tags.map((q, i) => [`tag ${i + 1}`, q])]) ok(sep(g.place, q) >= 16, `${look} ${tag}: THE PLACE NUMBER ≥ 16 px clear of ${what} (${sep(g.place, q).toFixed(0)} px)`);
    ok(g.bandText.r - g.bandText.l <= 200, `${look} ${tag}: the band line stays NARROW (${(g.bandText.r - g.bandText.l).toFixed(0)} px: "${g.bandWords}")`);
    await shot(p, `hud-${look}-390x844-${tag}-calls.png`);
    await sleep(1900);
    ok(geo.numSize >= 44 && geo.ofSize < geo.numSize * 0.6, `${look} ${tag}: BIG at 390 unzoomed — the number ${geo.numSize}px, "/ 8" ${geo.ofSize}px (smaller)`);
    ok(geo.tags.every(q => q.l > geo.r + 40 || q.t > geo.b), `${look} ${tag}: clear of the tags' column`);
    if (zoneTop != null) ok(geo.b < zoneTop, `${look} ${tag}: clear of THE DROP ZONE (ends at ${geo.b.toFixed(0)} — the zone from ${zoneTop.toFixed(0)})`);
    ok((tag === 'first') === geo.first, `${look} ${tag}: ${tag === 'first' ? '1ST is GOLD' : 'white (gold = 1ST only)'} (${geo.color})`);
    await shot(p, `place-${look}-390x844-${tag}.png`);
  }
  // TIES (REVIEW FIX A — the owner's call): level floors are ranked by the most perfects; the same floor + perfects share the place
  const tie = await p.evaluate(`(() => {
    const L = window.__hiPlay, F = L.state().floor, P = L.state().perfects, N = ['ALEX','BOB','CLEO','DEE','EVE','FINN','GUS'];
    const rows = N.map((n, i) => ({ uid: 't' + i, name: n, hex: '#00f0ff', rgb: [0, 1, 1], floor: F, perfects: i < 3 ? P + 2 : P, over: false, end: '', silent: false, me: false, watched: false }));
    rows.push({ uid: 'me', name: 'YOU', hex: '#ffffff', rgb: [1,1,1], floor: F, perfects: P, over: false, end: '', silent: false, me: true, watched: false });
    L.rivals(rows); return P;
  })()`);
  const tieGot = await until(p, "(() => { const s = window.__hiPlay.matchState(); return s.place === '4TH / 8' ? s.place : null; })()", 4000);
  ok(!!tieGot, `${look}: TIES — everyone on your floor, three with more perfects → "4TH / 8" (the four level on perfects share it; you have ${tie}) — got ${tieGot || await p.evaluate('window.__hiPlay.matchState().place')}`);
  await sleep(800);
  await p.evaluate(ROWS(7, look));
  await until(p, "window.__hiPlay.matchState().place === '8TH / 8'", 3000);
  await sleep(800);
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
  const w = await until(p, '(() => { const L = window.__hiPlay, s = L.matchState(); return L.watching() && s.alt.length === 5 && s.more === 3 ? s : null; })()', 20000);
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
    lis.splice(lis.findIndex(li => li.classList.contains('hi-alt-more')), 1); r.length = lis.length; for (let i = 0; i < lis.length; i++) r[i] = lis[i].getBoundingClientRect();
    return { listB: list.bottom, zone: window.__hiPlay.view.restZone(), more: document.querySelector('.hi-alt-more') ? document.querySelector('.hi-alt-more').textContent : '', n: lis.length, minH: Math.min(...r.map(q => q.height)), watched: lis.filter(li => li.classList.contains('is-watched')).map(li => li.dataset.uid), me: lis.filter(li => li.classList.contains('is-me')).length, ranks: lis.map(li => li.querySelector('em').textContent), floors: lis.map(li => Number(li.querySelector('b').textContent)), place: getComputedStyle(document.querySelector('.hi-place')).display, hudL: hud.left, listR: list.right, nameFs: parseFloat(getComputedStyle(lis[0].querySelector('.hi-alt-n')).fontSize) };
  })()`);
  ok(L.n === 5 && L.minH >= 44 && L.more === '+3 MORE', `${look}: WATCH's ranked list — 8 players in 5 rows + "${L.more}", each ≥ 44 pt (${L.minH.toFixed(0)}), names ${L.nameFs}px`);
  ok(typeof L.zone !== 'number' || L.listB < L.zone * 844 - 8, `${look}: … the list ends above where the slab comes in (to ${L.listB.toFixed(0)} — THE DROP ZONE from ${typeof L.zone === 'number' ? (L.zone * 844).toFixed(0) : '?'})`);
  ok(L.floors.every((f, i) => i === 0 || f <= L.floors[i - 1]) && L.ranks[0] === '1', `${look}: … the highest first (${L.floors.join(' · ')}; places ${L.ranks.join(' ')})`);
  ok(L.watched.length === 1 && L.me === 1, `${look}: … the watched row lit (${L.watched[0]}), YOU outlined`);
  ok(L.place === 'none', `${look}: … THE PLACE NUMBER is gone while you watch`);
  ok(L.hudL >= L.listR - 1, `${look}: … the watched tower's number stands clear of the list (the number from ${L.hudL.toFixed(0)}, the list to ${L.listR.toFixed(0)})`);
  await shot(p, `watch-${look}-390x844-list.png`);
  // a tap on a row = watch that player (press + lift on the row) — the LAST row that is not YOU and not watched
  const target = await p.evaluate(`(() => { const lis = [...document.querySelectorAll('.hi-alt li:not(.hi-alt-more)')].filter(li => !li.classList.contains('is-me') && !li.classList.contains('is-watched')); const li = lis[lis.length - 1]; const r = li.getBoundingClientRect(); return { uid: li.dataset.uid, x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await p.touchscreen.tap(target.x, target.y);
  ok(!!await until(p, `window.__hiPlay.watching() === '${target.uid}'`, 4000), `${look}: a tap on a row = WATCH that player (${target.uid})`);
  await sleep(500);
  await shot(p, `watch-${look}-390x844-picked.png`);
  // a tap anywhere else = the next player
  const before = await p.evaluate('window.__hiPlay.watching()');
  await p.touchscreen.tap(300, 620);
  const after = await until(p, `(() => { const u = window.__hiPlay.watching(); return u && u !== '${before}' ? u : null; })()`, 4000);
  ok(!!after, `${look}: a tap off the list = the next player (${before} → ${after})`);
  // the list's TIES (the owner's call): the bots' pump stopped, seven level players on different perfects → their places by perfects
  await p.evaluate("window.__hiPlay.sim.stop()");
  await p.evaluate(`(() => {
    const L = window.__hiPlay, w = L.watching(), N = ['ALEX','BOB','CLEO','DEE','EVE','FINN','GUS'];
    const rows = N.map((n, i) => ({ uid: 's' + i, name: n, hex: '#00f0ff', rgb: [0, 1, 1], floor: 30, perfects: [5, 9, 9, 2, 0, 7, 1][i], over: false, end: '', silent: false, me: false, watched: 's' + i === w }));
    rows.push({ uid: 'me', name: 'YOU', hex: '#ffffff', rgb: [1,1,1], floor: 3, perfects: 0, over: true, end: 'out', silent: false, me: true, watched: false });
    L.rivals(rows);
  })()`);
  await sleep(200);
  const ranks = await p.evaluate("[...document.querySelectorAll('.hi-alt li:not(.hi-alt-more)')].map(li => li.querySelector('.hi-alt-n').textContent + ' ' + li.querySelector('em').textContent)");
  ok(ranks.slice(0, 2).join() === 'BOB 1,CLEO 1' && ranks.includes('FINN 3') && ranks.includes('YOU 8'), `${look}: the list's ties — the floor, then the most perfects; the same both share (${ranks.join(' · ')})`);
  // (THE CLOSE's review) WATCH over → the page's own card is UP: PLAY AGAIN works, no rival tag left over YOUR tower
  await p.evaluate('window.__hiPlay.sim.watchOff = true; window.__hiPlay.unwatch()');
  const cardUp = await until(p, "(() => { const s = window.__hiPlay.state(); return s.card && !document.querySelector('.hi-end').hidden && ![...document.querySelectorAll('.hi-rtag')].some(t => !t.hidden && getComputedStyle(t).display !== 'none') ? s : null; })()", 4000);
  ok(!!cardUp, `${look}: WATCH over → the end card is up, no rival tag left (card ${cardUp ? cardUp.card : '—'})`);
  await sleep(900);
  await p.touchscreen.tap(195, 500);
  ok(!!await until(p, '(() => { const L = window.__hiPlay; return !L.state().card && !L.watching(); })()', 4000), `${look}: … and a tap = PLAY AGAIN (the page never stuck)`);
  ok(errs.length === 0, `${look}: no page error (${errs.join(' | ')})`);
  await p.close();
}
// DESKTOP COMES FREE (REVIEW FIX A): the same HUD at 1440 × 900 — THE PLACE NUMBER clear of the floor, the band line, a callout + the announcer
{
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(guardUrl(`${BASE}/highrise-play?mode=match&rivals=7&seed=place5&floor=20&look=night`, 'highrise-play'), { waitUntil: 'load' });
  await until(p, '(() => { const L = window.__hiPlay; return L && L.sim && L.state().warm; })()', 25000);
  await p.evaluate("document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }))");
  await until(p, '(() => { const L = window.__hiPlay; return L.phase() === 1 && L.state().floor >= 20; })()');
  await sleep(700);
  await p.evaluate('window.__hiPlay.sim.stop(); window.__hiPlay.freeze(true)');
  await p.evaluate(ROWS(7, 'night'));
  await until(p, "window.__hiPlay.matchState().place === '8TH / 8'", 4000);
  await p.evaluate("window.__hiPlay.say('PERFECT ×5'); window.__hiPlay.hud().announce('CHRISTOPHER PASSED YOU', 'passed')");
  await sleep(900);
  const dk = await p.evaluate(HUD_GEO);
  const dsep = (a, q) => Math.max(q.l - a.r, a.l - q.r, q.t - a.b, a.t - q.b);
  ok([dk.num, dk.bandText, dk.callText, dk.annText].every(q => dsep(dk.place, q) >= 16), `1440 × 900: THE PLACE NUMBER clear of the floor / band / callout / announcer (${[dk.num, dk.bandText, dk.callText, dk.annText].map(q => dsep(dk.place, q).toFixed(0)).join(' · ')} px)`);
  await shot(p, 'hud-night-1440x900.png');
  await p.close();
}
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
