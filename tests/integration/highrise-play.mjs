// HIGH RISE S2 — THE TEST PAGE's own check (/highrise-play — js/games/highrise/play.js + night.js — docs/highrise.md "THE TEST PAGE"),
// the BROWSER half of tests/highrise-play.test.mjs, on the LOCAL server (NEVER THE LIVE SITE):
//   · the page loads at 390 × 844: the sign (HIGH / RISE), TAP TO START, the night look (the plate, the reflection map, the glass tower)
//   · a BOT RUN THROUGH REAL TAPS (CDP touches timed at each slab's perfect moment): every drop logged at the touch's own tick, the
//     view's tower == the engine's, the HUD (the big floor number, the band's name, the announcer lane), REPLAY = LIVE ✓ on the end card
//   · YOUR BEST = THIS PHONE: stored after a run, the right-edge tag while it is above you (never in THE DROP ZONE), the gold tape +
//     NEW BEST at the crossing
//   · THE HEIGHT AREAS: the band's name + its plate change as the tower climbs; only two plates are ever held
//   · THE SOUNDS: the cues asked of the engine (the chime climbing its scale), THE AUDITION sheet + COPY MY PICKS
//   · THE LOST CONTEXT: the scene rebuilt on the same tower, the run never stopped
//   · **NOTHING COUNTS**: NO request but the page's own static files, three.js from its CDN and the fonts — no /api, no Firebase, no
//     web socket, no service worker; the only thing stored: `hi:play:*` on this phone
//   · `--look` = the review's shots only (every band, the moments, the end) · `--perf` = the measured frame rate, every tier, 1× + 4× CPU
//   node tests/integration/highrise-play.mjs "<chromium>" [outDir] [--look] [--perf]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, LOOK = argv.includes('--look'), PERF = argv.includes('--perf');
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

/** THE ONLY REQUESTS THE PAGE MAY MAKE: its own page + static files, three.js from the import map's CDN, the fonts */
const OWN = [/^\/highrise-play(\.html)?$/, /^\/css\/(base|components|highrise-play)\.css$/, /^\/js\/games\/highrise\/[a-z-]+\.js$/, /^\/js\/games\/kit\/tiers\.js$/, /^\/js\/core\/rng\.js$/,
  /^\/js\/ui\/(dom|lazy-import|sheet|layers)\.js$/, /^\/js\/audio\/(engine|settings|sound-state|leave-text)\.js$/, /^\/js\/(errlog|core\/bot-ua)\.js$/, /^\/assets\/highrise\/(plates\/night-[1-5]\.webp|env-night\.png)$/, /^\/audio\/highrise\/[a-z-]+\.wav$/,
  /^\/assets\/favicon-64\.png$/, /^\/favicon\.ico$/, /^\/assets\/fonts\//];
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const allowed = url => { if (url === THREE_URL || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) return true; const u = new URL(url); return u.origin === new URL(BASE).origin && OWN.some(re => re.test(u.pathname)); };
const COUNTS = /\/api\/|firebaseio|firebasejs|\/js\/(profile|progress|board|daily|vault|chat|admin|screens)\/|\/js\/(firebase|store|room|host|identity|seat|app|config)\.js|share|report|cards?\b|sw\.js/i;

async function open(w, h, dpr, q = '', before = null) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [], sockets = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`console: ${m.text()}`); });
  p.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(`${r.method()} ${r.url()}`); });
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', e => sockets.push(e.url));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 700, hasTouch: w < 700 });
  if (before) await p.evaluateOnNewDocument(before);
  await p.goto(guardUrl(`${BASE}/highrise-play${q}`, 'highrise-play'), { waitUntil: 'load' });
  const up = await waitFor(p, "!!window.__hiPlay && !!document.querySelector('canvas.hi-canvas')");
  return { p, cdp, errs, reqs, sockets, up, touch: w < 700, close: () => ctx.close() };
}
const st = p => p.evaluate(() => window.__hiPlay.state());
const ready = p => waitFor(p, '(() => { const i = window.__hiPlay.state().info; return i.env && i.plates.includes(0) && i.warmed > 0; })()', 15000);
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
    const L = window.__hiPlay;
    if (L.state().over) return res('over');
    const m = L.msToPerfect();
    if (m != null && m <= ld) return res('go');
    if (performance.now() - t0 > 9000) return res('timeout');
    setTimeout(poll, m != null && m - ld > 12 ? Math.min(40, m - ld - 6) : 1);
  })();
}), lead);
const sameTop = s => JSON.stringify(s.top) === JSON.stringify(s.viewTop);
/** the tower `n` floors up through the page's own climb hook (real drops, played at once), `off(i)` in ticks, then a few frames */
const climb = async (p, n, offSrc = '() => 0') => { const f = await p.evaluate((k, src) => window.__hiPlay.climb(k, (0, eval)(src)), n, offSrc); await sleep(450); return f; };

// ---- THE LOOK: the review's shots (every band, the moments, the end) at 390 × 844 @3 — + the other sizes
async function look() {
  const t = await open(390, 844, 3, '?seed=look1');
  const { p } = t;
  ok(t.up && await ready(p), 'the page + its night look are up (the plate, the reflection map, the warm frame)');
  await sleep(400);
  await shot(p, 'play-390-start.png');
  // the rooftops: a few clean drops, then a cut (sparks + the falling piece), then a perfect (the ring)
  await climb(p, 6, 'i => (i % 3 === 2 ? 5 : 0)');
  await shot(p, 'play-390-rooftops.png');
  await p.evaluate(() => window.__hiPlay.climb(1, () => 7)); await sleep(30); await shot(p, 'play-390-cut.png');
  await sleep(300);
  await p.evaluate(() => window.__hiPlay.climb(1, () => 0)); await sleep(30); await shot(p, 'play-390-perfect.png');
  if (await waitFor(p, '(() => { const m = window.__hiPlay.msToPerfect(); return m != null && m > 250 && m < 600; })()', 3000)) await shot(p, 'play-390-slide.png');
  for (const [n, name] of [[30, 'skyline'], [70, 'clouds'], [125, 'stars'], [185, 'space'], [240, 'deep']]) {
    const f = (await st(p)).floor;
    await climb(p, n - f, 'i => (i % 11 === 10 ? 3 : 0)');
    if (await waitFor(p, '(() => { const m = window.__hiPlay.msToPerfect(); return m != null && m > 120 && m < 420; })()', 3000)) await shot(p, `play-390-${name}.png`);
    console.log('  ', name, JSON.stringify((await st(p)).info));
  }
  // the end: stop tapping — THE FUSE
  await waitFor(p, 'window.__hiPlay.state().shown', 15000); await sleep(300);
  await shot(p, 'play-390-out.png');
  ok(t.errs.length === 0, `no page error (${t.errs.join(' | ')})`);
  await t.close();
  for (const [w, h, dpr, name] of [[375, 667, 2, 'play-375x667'], [430, 932, 3, 'play-430x932'], [1440, 900, 1, 'play-1440x900']]) {
    const d = await open(w, h, dpr, '?seed=look2');
    await ready(d.p); await sleep(300);
    await shot(d.p, `${name}-start.png`);
    await climb(d.p, 34, 'i => (i % 5 === 4 ? 4 : 0)'); await sleep(500);
    if (await waitFor(d.p, '(() => { const m = window.__hiPlay.msToPerfect(); return m != null && m > 150 && m < 520; })()', 4000)) await shot(d.p, `${name}-run.png`);
    await waitFor(d.p, 'window.__hiPlay.state().shown', 15000); await sleep(300);
    await shot(d.p, `${name}-out.png`);
    ok(d.errs.length === 0, `${w} × ${h}: no page error (${d.errs.join(' | ')})`);
    await d.close();
  }
}

// ---- THE WHOLE CHECK
async function main() {
  const t = await open(390, 844, 3);
  const { p } = t;
  ok(t.up && await ready(p), 'the page loads at 390 × 844: its stage, the night look (the plate, the reflection map, the warm frame) — no gate, no door');
  await sleep(300);
  const s = await st(p);
  ok(s.mode === 'solo' && !s.started && s.floor === 0 && /^[0-9a-z]{4,}$/.test(s.seed) && s.best === 0, `a new SOLO run waits for its start, a random seed (${s.seed}), no best yet on this phone`);
  const dom = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return { x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(c.fontSize), text: e.textContent, op: +c.opacity }; };
    return { sign: box(q('.hi-sign')), go: box(q('.hi-start-go')), l: box(q('.hi-start-l')), best: q('.hi-start-best').textContent, snd: box(q('.hi-snd')), note: box(q('.hi-note')), hud: box(q('.hi-hud')), endHidden: q('.hi-end').hidden, fps: !!q('.hi-fps'), stage: box(q('.hi-stage')), w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')) };
  });
  ok(dom.sign.text === 'HIGHRISE' && dom.sign.fs >= 56 && dom.sign.y > 40 && dom.sign.y + dom.sign.h < 844 * 0.36, `THE SIGN: HIGH / RISE stacked, big (${dom.sign.fs} px), in the free band above the tower`);
  ok(dom.go.text === 'TAP TO START' && dom.go.fs >= 20 && dom.l.text === 'ONE TAP DROPS EACH SLAB' && dom.l.fs >= 13 && dom.best === '' && dom.endHidden, 'TAP TO START + the one rule under it; no best line on a first visit');
  ok(dom.snd.text === 'SOUNDS' && dom.snd.h >= 44 && dom.snd.w >= 44 && dom.snd.x >= 0 && dom.snd.y < 80 && dom.note.text === 'TEST PAGE · SOLO · NOTHING COUNTS YET' && dom.note.fs >= 11, 'SOUNDS in the top left corner (≥ 44 pt); the foot says TEST PAGE · SOLO · NOTHING COUNTS YET');
  ok(dom.hud.op === 0 && !dom.fps && dom.scroll <= dom.w && dom.stage.w === 390, 'the HUD waits for the run; no fps readout without ?fps=1; no sideways scroll');
  const geo = await p.evaluate(() => { const V = window.__hiPlay.view, a = V.project(5000, 0, -5000), c = V.project(-5000, 0, 5000), top = V.project(0, 0, 0); return { wide: Math.abs(a[0] - c[0]), level: Math.abs(a[1] - c[1]), topY: top[1], topX: top[0], zone: V.zoneTop() }; });
  ok(geo.wide > 0.56 && geo.wide < 0.64 && geo.level < 0.01 && Math.abs(geo.topX - 0.5) < 0.02 && geo.topY > 0.5 && geo.topY < 0.68, `THE CAMERA: the first slab ≈ 60 % of the screen width (${(geo.wide * 100).toFixed(1)} %), corner-on, level, its top ${(geo.topY * 100).toFixed(0)} % down`);
  ok(dom.go.y + dom.go.h < geo.topY * 844 - 40, 'the start\'s words sit clear above the tower\'s top');
  ok(s.info.look === 'night' && s.info.tier === 2 && s.info.bloom && s.info.env && s.info.plates.includes(0) && s.info.held.length <= 2 && s.info.calls <= 12, `THE NIGHT LOOK: tier 2 + the bloom, the reflection map + the rooftops' plate in, ≤ 2 plates held (${s.info.held}), ${s.info.calls} draw calls a frame`);

  // ---- A BOT RUN THROUGH REAL TAPS
  await tapAt(t, 195, 500);
  await waitFor(p, 'window.__hiPlay.state().started', 3000);
  const s0 = await st(p);
  ok(s0.started && s0.taps === 0 && s0.floor === 0, 'the first touch only STARTS the run (tick 0 = that touch) — it is not a drop');
  const live = await p.evaluate(() => { const q = sel => document.querySelector(sel); return { snd: q('.hi-snd').hidden, note: q('.hi-note').hidden, start: q('.hi-start').hidden, hud: +getComputedStyle(q('.hi-hud')).opacity > 0 || q('.hi-stage').classList.contains('is-live') }; });
  ok(live.snd && live.note && live.start && live.hud, 'while a run is LIVE the SOUNDS button + the note are off the screen (a thumb anywhere is a drop); the HUD is on');
  let beatChecked = false, tops = true, perfectSeen = false;
  for (let i = 0; i < 12; i++) {
    if (await atPerfect(p, 14) !== 'go') break;
    const before = await st(p);
    await tapAt(t, 195, i % 2 ? 790 : 500);   // (every other tap at the FOOT)
    const after = await st(p);
    if (after.taps !== before.taps + 1) { tops = false; break; }
    if (after.over) break;
    if (/^PERFECT/.test(after.call)) perfectSeen = true;
    if (!beatChecked && after.st === 'beat') {
      await tapAt(t, 195, 500);   // (a touch in THE LANDING BEAT)
      const again = await st(p);
      ok(again.taps === after.taps && again.floor === after.floor, 'a touch in the landing beat is not a drop: nothing logged, nothing changed');
      beatChecked = true;
    }
  }
  await sleep(120);
  const s1 = await st(p);
  ok(tops && s1.floor >= 6 && (s1.over || sameTop(s1)), `every real tap is one logged drop — in the middle or at the foot (${s1.taps} taps → floor ${s1.floor}); the view's tower == the engine's`);
  const hud = await p.evaluate(() => { const q = sel => document.querySelector(sel), r = q('.hi-num').getBoundingClientRect(); return { n: q('.hi-num').getAttribute('aria-label'), fs: parseFloat(getComputedStyle(q('.hi-num')).fontSize), y: r.top, b: r.bottom, band: q('.hi-band').textContent, bandFs: parseFloat(getComputedStyle(q('.hi-band')).fontSize), digits: q('.hi-num').children.length }; });
  ok(hud.n === String(s1.floor) && hud.fs >= 64 && hud.y < 844 * 0.1 && hud.digits === String(s1.floor).length && hud.band === 'THE ROOFTOPS' && hud.bandFs >= 13, `THE HUD: the floor number big at the top (${hud.fs} px, each digit its own box), the band's name under it`);
  ok(perfectSeen, 'a PERFECT is called in the announcer lane');
  ok(s1.info.rings > 0 && s1.info.boxes >= s1.floor + 2, `a perfect pulses its ring of light (${s1.info.rings} rings so far); every floor is a box in the ONE mesh (${s1.info.boxes})`);
  await shot(p, 'e2e-390-run.png');
  // … then it stops tapping: THE FUSE ends the run — the end card after the slab is seen falling
  ok(await waitFor(p, 'window.__hiPlay.state().shown', 15000), 'the run ends by itself (THE FUSE) — the end card follows');
  const e = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, fs: parseFloat(getComputedStyle(el).fontSize), text: el.textContent }; };
    const L = window.__hiPlay, last = L.ends[L.ends.length - 1], tp = L.state().viewTop;
    return { hidden: q('.hi-end').hidden, card: box(q('.hi-end')), words: box(q('.hi-end-t')), n: q('.hi-end-n').getAttribute('aria-label'), nfs: parseFloat(getComputedStyle(q('.hi-end-n')).fontSize), band: box(q('.hi-end-band')), line: box(q('.hi-end-l')), best: box(q('.hi-end-best')), go: box(q('.hi-end-go')), check: box(q('.hi-check')), okCls: q('.hi-check').classList.contains('is-ok'),
      top: L.view.project((tp.x0 + tp.x1) / 2, tp.floor, (tp.z0 + tp.z1) / 2)[1] * innerHeight, snd: !q('.hi-snd').hidden, last: { same: last.same, live: last.live, replay: last.replay, best: last.best, was: last.was }, stored: localStorage.getItem('hi:play:best'), keys: Object.keys(localStorage) };
  });
  ok(!e.hidden && e.words.text === 'TOO SLOW' && e.words.fs >= 28 && e.n === String(s1.floor) && e.nfs >= 56 && e.band.text === 'THE ROOFTOPS', `THE END: "${e.words.text}" (${e.words.fs} px), FLOOR ${e.n} big, the band reached`);
  ok(/^\d+ PERFECTS? · BEST STREAK \d+$/.test(e.line.text) && e.best.text === `YOUR BEST ${s1.floor}` && e.go.text === 'TAP TO PLAY AGAIN' && e.go.fs >= 18, `"${e.line.text}" · "${e.best.text}" · TAP TO PLAY AGAIN`);
  ok(e.card.b <= e.top + 6 && [e.words, e.line, e.best, e.go, e.check].every(x => x.x >= 0 && x.x + x.w <= 390), `the end card ends above the top slab — the tower stays in view (card to ${e.card.b.toFixed(0)}, the top slab at ${e.top.toFixed(0)}); it fits the screen`);
  ok(e.check.text === 'REPLAY = LIVE ✓' && e.okCls && e.last.same && JSON.stringify(e.last.live) === JSON.stringify(e.last.replay), `after the run: ${e.check.text}`);
  ok(e.stored === String(s1.floor) && e.last.was === 0 && e.last.best === s1.floor && e.snd, `YOUR BEST = THIS PHONE: stored (hi:play:best = ${e.stored}); the SOUNDS button is back`);
  await shot(p, 'e2e-390-out.png');

  // ---- THE SOUNDS: what the run asked of the engine + THE AUDITION
  await waitFor(p, '!!window.__hiPlay.sfx', 5000);
  const snd = await p.evaluate(() => { const S = window.__hiPlay.sfx; return { wanted: S.wanted(), played: S.played().length }; });
  const ids = new Set(snd.wanted.map(x => x.id));
  ok(ids.has('drop') && ids.has('perfect') && ids.has('out') && snd.wanted.filter(x => x.id === 'drop').length >= s1.floor - 1, `THE SOUNDS: the run asked for its drops, its chime, its OUT (${[...ids].join(' · ')}; ${snd.played} started on the audio context)`);
  const drops = snd.wanted.filter(x => x.id === 'drop').map(x => x.rate);
  ok(new Set(drops).size > 1 && drops.every(r => r > 0.95 && r < 1.05), 'a drop is never the same twice (its pitch within ± 4 %)');
  const sb = await p.evaluate(() => { const r = document.querySelector('.hi-snd').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await tapAt(t, sb[0], sb[1]);
  ok(await waitFor(p, "!!document.querySelector('.hi-au-sheet.is-in, .hi-au-sheet') && document.querySelectorAll('.hi-au-row').length === 9", 6000), 'a real tap on SOUNDS opens THE AUDITION sheet: nine sounds');
  await sleep(450);
  const au = await p.evaluate(() => ({ rows: [...document.querySelectorAll('.hi-au-row')].map(r => ({ id: r.dataset.id, plays: r.querySelectorAll('.hi-au-play').length, picks: [...r.querySelectorAll('.hi-au-pick')].map(b => [b.textContent, b.classList.contains('is-on'), b.getBoundingClientRect().height]) })), line: document.querySelector('.hi-au-line').textContent, open: window.__hiPlay.state().sheet }));
  ok(au.open && au.rows.filter(r => r.plays === 2).map(r => r.id).join() === 'drop,perfect,slice' && au.rows.every(r => r.picks.every(x => x[2] >= 44)) && au.line === 'HIGH RISE SOUNDS: drop A · perfect A · slice A · falling-piece A · grow-back A · streak A · out A · band-arrival A · pass A', `the audition: PLAY A · PLAY B + USE A / B for drop · perfect · slice; "${au.line}"`);
  const press = async sel => { const c = await p.evaluate(q => { const el = document.querySelector(q); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel); await sleep(80); await tapAt(t, c[0], c[1]); await sleep(120); };
  const before = (await p.evaluate(() => window.__hiPlay.sfx.wanted().length));
  await press('.hi-au-play[data-snd="slice:b"]');
  await press('.hi-au-pick[data-pick="slice:b"]');
  await press('.hi-au-pick[data-pick="perfect:b"]');
  const au2 = await p.evaluate(() => ({ line: document.querySelector('.hi-au-line').textContent, slice: localStorage.getItem('hi:play:snd:slice'), perfect: localStorage.getItem('hi:play:snd:perfect'), wanted: window.__hiPlay.sfx.wanted().slice(-1)[0], n: window.__hiPlay.sfx.wanted().length }));
  ok(au2.n === before + 1 && au2.wanted.id === 'slice' && au2.wanted.ab === 'b' && au2.slice === 'b' && au2.perfect === 'b' && /slice B/.test(au2.line) && /perfect B/.test(au2.line) && /drop A/.test(au2.line), `PLAY B plays the backup; USE B is remembered on this phone; the line follows ("${au2.line.slice(0, 60)}…")`);
  await press('.hi-au-play[data-snd="perfect:b"]');
  await sleep(320 * 9 + 200);
  const scale = await p.evaluate(() => window.__hiPlay.sfx.wanted().filter(x => x.id === 'perfect' && x.ab === 'b').slice(-9).map(x => x.rate));
  const want = [0, 2, 4, 7, 9, 12, 14, 16, 16].map(k => +(0.6674 * Math.pow(2, k / 12)).toFixed(4));
  ok(JSON.stringify(scale) === JSON.stringify(want), `THE PERFECT CHIME climbs its major-pentatonic scale and HOLDS at the top (${scale.map(r => r.toFixed(2)).join(' ')})`);
  await press('.hi-au-copy');
  const said = await p.evaluate(() => document.querySelector('.hi-au-said').textContent);
  ok(said === 'COPIED — PASTE IT INTO CHAT' || said === 'PRESS AND HOLD THE LINE ABOVE TO COPY IT', `COPY MY PICKS answers ("${said}")`);
  // the run holds still under the sheet: a tap on the sheet is never a start
  ok(!(await st(p)).started || (await st(p)).shown, 'the game holds still under the sheet');
  await p.evaluate(() => document.querySelector('.sh-x').click());
  ok(await waitFor(p, '!window.__hiPlay.state().sheet', 3000), 'the sheet closes');
  await p.evaluate(() => { localStorage.removeItem('hi:play:snd:slice'); localStorage.removeItem('hi:play:snd:perfect'); });
  await sleep(400);

  // ---- YOUR BEST: the tag while it is above you (never in THE DROP ZONE), the gold tape + NEW BEST at the crossing
  const bestWas = s1.floor;
  await tapAt(t, 195, 500);   // TAP TO PLAY AGAIN = the next run's start
  await waitFor(p, 'window.__hiPlay.state().started && !window.__hiPlay.state().shown', 3000);
  const r0 = await st(p);
  ok(r0.started && !r0.shown && r0.floor === 0 && r0.taps === 0 && r0.seed !== s.seed && r0.best === bestWas, 'ONE tap = PLAY AGAIN: the next run is on (a new seed), its best = the stored one');
  await sleep(250);
  const tagOf = () => p.evaluate(() => { const q = document.querySelector('.hi-tag'), r = q.getBoundingClientRect(), V = window.__hiPlay.view, hud = document.querySelector('.hi-hud').getBoundingClientRect(); return { hidden: q.hidden, text: q.textContent, x: r.left, r: r.right, y: r.top, b: r.bottom, h: r.height, fs: parseFloat(getComputedStyle(q).fontSize), zone: V.zoneTop() * innerHeight, hud: hud.bottom, w: innerWidth }; });
  let tg = await tagOf();
  ok(!tg.hidden && tg.text === `BEST ${bestWas} ▲${bestWas}` && tg.fs >= 13 && Math.abs(tg.r - tg.w) < 1.5 && tg.y >= tg.hud && tg.b <= tg.zone, `YOUR BEST above you = the right-edge tag "${tg.text}" (at ${tg.y.toFixed(0)}–${tg.b.toFixed(0)}: under the HUD's ${tg.hud.toFixed(0)}, above THE DROP ZONE's ${tg.zone.toFixed(0)})`);
  await climb(p, bestWas - 1);
  tg = await tagOf();
  ok(tg.text === `BEST ${bestWas} ▲1` && tg.b <= tg.zone && tg.y >= tg.hud, `one floor under it: "${tg.text}" — still clear of THE DROP ZONE (tag to ${tg.b.toFixed(0)}, the zone from ${tg.zone.toFixed(0)})`);
  await shot(p, 'e2e-390-tag.png');
  await climb(p, 1);
  tg = await tagOf();
  const lvl = await st(p);
  ok(tg.text === `BEST ${bestWas} · ONE MORE` && !lvl.tapeOn && lvl.info.tape === 0 && tg.b <= tg.zone, `standing ON it: "${tg.text}" — no tape yet`);
  await p.evaluate(() => window.__hiPlay.climb(1)); await sleep(140);
  const x = await st(p);
  const gold = await p.evaluate(() => ({ cls: document.querySelector('.hi-stage').classList.contains('is-gold'), tagHidden: document.querySelector('.hi-tag').hidden, call: document.querySelector('.hi-call').textContent }));
  ok(x.floor === bestWas + 1 && x.tapeOn && x.newBest && x.info.tape === bestWas && gold.cls && gold.tagHidden && gold.call === 'NEW BEST', `CROSSING IT: the gold tape lies on floor ${x.info.tape}, NEW BEST is called, the floor number turns gold, the tag is gone`);
  await shot(p, 'e2e-390-newbest.png');
  const cueN = await p.evaluate(() => window.__hiPlay.sfx.wanted().filter(q => q.id === 'streak' && Math.abs(q.rate - 1.12) < 0.001).length);
  ok(cueN === 1, 'NEW BEST sounds once');

  // ---- THE HEIGHT AREAS: the band's name + its plate follow the climb; only two plates are ever held
  await climb(p, 26 - x.floor);
  await sleep(900);
  const b1 = await st(p), l1 = await p.evaluate(() => document.querySelector('.hi-band').textContent);
  ok(b1.floor >= 26 && b1.band === 1 && l1 === 'THE SKYLINE' && b1.info.held.length <= 2, `floor ${b1.floor}: THE SKYLINE (plates held: ${b1.info.held})`);
  await climb(p, 70 - b1.floor);
  await sleep(1300);
  const b2 = await st(p), l2 = await p.evaluate(() => document.querySelector('.hi-band').textContent);
  ok(b2.band === 2 && l2 === 'THE CLOUDS' && b2.info.held.length <= 2 && b2.info.plates.includes(2) && !b2.info.held.includes(0), `floor ${b2.floor}: THE CLOUDS — its plate is in, the rooftops' is let go (held: ${b2.info.held}; ${b2.info.loads} loaded so far)`);
  const arr = await p.evaluate(() => window.__hiPlay.sfx.wanted().filter(q => q.id === 'band-arrival').length);
  ok(arr === 2, 'a band\'s arrival sounds once a band');
  ok(sameTop(b2) && b2.info.calls <= 12, `the view's tower == the engine's after ${b2.taps} drops; ${b2.info.calls} draw calls a frame`);

  // ---- THE LOST CONTEXT: the scene is rebuilt on the same tower — the run never stopped
  const lost = await p.evaluate(() => { const c = document.querySelector('canvas.hi-canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'), x2 = gl && gl.getExtension('WEBGL_lose_context'); if (!x2) return false; c.dataset.old = '1'; x2.loseContext(); return true; });
  if (lost) {
    ok(await waitFor(p, "window.__hiPlay.state().rebuilds === 1 && !document.querySelector('canvas.hi-canvas').dataset.old && window.__hiPlay.state().info.frames > 3", 4000), 'THE LOST CONTEXT: a new scene within 1.5 s, on a new canvas, drawing');
    const a2 = await st(p);
    ok(a2.floor === b2.floor && !a2.shown && a2.info.tape === bestWas && a2.info.slabs === b2.info.slabs && sameTop(a2) && (await p.evaluate(() => document.querySelectorAll('canvas.hi-canvas').length)) === 1, 'the same tower, the same gold tape, ONE canvas — the run is where it was');
    if (!a2.over && await atPerfect(p, 14) === 'go') { await tapAt(t, 195, 500); await sleep(120); const a3 = await st(p); ok(a3.taps === a2.taps + 1 && (a3.over || sameTop(a3)), 'the next real tap drops its slab on the rebuilt scene'); }
  } else ok(true, '(this browser cannot lose a context on purpose)');
  // the end: NEW BEST · WAS n
  ok(await waitFor(p, 'window.__hiPlay.state().shown', 15000), 'the run ends (THE FUSE)');
  const e2 = await p.evaluate(() => ({ best: document.querySelector('.hi-end-best').textContent, isNew: document.querySelector('.hi-end-best').classList.contains('is-new'), stored: localStorage.getItem('hi:play:best'), check: document.querySelector('.hi-check').textContent, band: document.querySelector('.hi-end-band').textContent, floor: window.__hiPlay.state().floor, ends: window.__hiPlay.ends.map(q => q.same) }));
  ok(e2.best === `NEW BEST · WAS ${bestWas}` && e2.isNew && e2.stored === String(e2.floor) && e2.band === 'THE CLOUDS', `the end card: "${e2.best}" — stored (${e2.stored})`);
  ok(e2.check === 'REPLAY = LIVE ✓' && e2.ends.every(Boolean), `every run of this page: REPLAY = LIVE (${e2.ends.length} runs — real taps, the climb hook's drops, a lost context)`);
  ok(t.errs.length === 0, `no page error (${t.errs.join(' | ')})`);

  // ---- NO PAUSE + THE DOOR: hide the page with its sound on — the run goes on behind it, and nothing is sent
  await sleep(700);
  await tapAt(t, 195, 500);
  await waitFor(p, 'window.__hiPlay.state().started && !window.__hiPlay.state().shown', 3000);
  if (await atPerfect(p, 14) === 'go') await tapAt(t, 195, 500);
  const nBefore = t.reqs.length;
  await t.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const other = await (await p.browserContext()).newPage(); await other.bringToFront();
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
  await sleep(6500);
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.bringToFront(); await other.close();
  ok(await waitFor(p, 'window.__hiPlay.state().shown', 6000) && (await p.evaluate(() => document.querySelector('.hi-end-t').textContent)) === 'TOO SLOW', 'HIDING THE APP = NO PAUSE: back from 6.5 s away the run is over — TOO SLOW (the fuse)');
  const outs = await p.evaluate(() => window.__hiPlay.sfx.wanted().slice(-3).map(q => q.id));
  ok(outs[outs.length - 1] === 'out' && (await p.evaluate(() => window.__hiPlay.ends.slice(-1)[0].same)), 'the batch that came back sounds only its OUT; REPLAY = LIVE');
  const sent = t.reqs.slice(nBefore).filter(q => /\/api\//.test(q));
  const door = await p.evaluate(async () => { let f = 'sent'; try { await fetch('/api/log', { method: 'POST', body: '{}' }); } catch (er) { f = String(er.message); } return { f, b: navigator.sendBeacon('/api/log', 'x') }; });
  ok(sent.length === 0 && door.f === 'this page never calls the server' && door.b === true && !t.reqs.some(q => /\/api\//.test(q)), `THE DOOR: leaving with the sound on sends NOTHING (the shared audio engine's quiet counter ${t.reqs.some(q => q.endsWith('/js/errlog.js')) ? 'WAS loaded — its beacon stopped here' : 'was not even loaded'}); a fetch / a beacon to /api/ from this page never leaves the phone`);

  // ---- NOTHING COUNTS
  const stray = t.reqs.filter(q => !allowed(q.slice(q.indexOf(' ') + 1)) || !q.startsWith('GET '));
  ok(stray.length === 0, `NO request but the page's own static files, three.js from its CDN and the fonts (${t.reqs.length} requests${stray.length ? ` — STRAY: ${stray.join(' , ')}` : ''})`);
  ok(t.reqs.some(q => q.endsWith(THREE_URL)) && t.reqs.some(q => /\/assets\/highrise\/plates\/night-1\.webp/.test(q)) && t.reqs.some(q => /\/audio\/highrise\/drop\.wav/.test(q)), '… (three.js, the plates, the sounds really came through them)');
  ok(!t.reqs.some(q => COUNTS.test(q.replace('/highrise-play', ''))), 'no /api, no Firebase, no profile / progression / report / share / cards / app module was loaded');
  ok(t.sockets.length === 0, 'no web socket');
  const page = await p.evaluate(async () => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage).length, cookie: document.cookie, sw: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0, arcade: typeof window.__arcade }));
  ok(page.ls.every(k => /^hi:play:/.test(k) || /^na:(settings|audio)/.test(k)) && page.ls.includes('hi:play:best') && page.ss === 0 && page.cookie === '' && page.sw === 0 && page.arcade === 'undefined', `the only thing stored: this phone's own best (${page.ls.join(', ')}); no cookie, no service worker, no app`);
  await t.close();

  // ---- ?seed= · ?mode= · ?fps=1 · ?tier= — and a phone that remembers its best
  {
    const d = await open(390, 844, 3, '?mode=match&seed=abc&fps=1&tier=1&debug=1', () => { try { localStorage.setItem('hi:play:best', '41'); } catch { /* fine */ } });
    await ready(d.p); await sleep(700);
    const q = await st(d.p);
    const dm = await d.p.evaluate(() => [document.querySelector('.hi-start-best').textContent, (document.querySelector('.hi-fps') || {}).textContent || '', location.search]);
    ok(q.mode === 'match' && q.seed === 'abc' && q.best === 41 && dm[0] === 'YOUR BEST 41 · THIS PHONE' && q.info.tier === 1 && !q.info.bloom, '?mode=match&seed=abc&tier=1: the seed, the pinned tier (no bloom under the top tier); the start says YOUR BEST 41 · THIS PHONE');
    ok(/^\d+ fps · [\d.]+ ms · worst \d+ · tier 1 · \d+ calls · \d+ tris · 390×844 @2 · tick \d+$/.test(dm[1]), `?fps=1: the frame-rate readout (${dm[1]})`);
    ok(!/debug/.test(dm[2]), 'a &debug=1 link: the flag is dropped from the address (the shared audio engine never reports from here)');
    await tapAt(d, 195, 500);
    await waitFor(d.p, "window.__hiPlay.state().st === 'slide'", 3000);
    const clock = await d.p.evaluate(() => document.querySelector('.hi-clock').textContent);
    ok(/^[56]:\d\d$/.test(clock), `the match's clock runs under the band's name (${clock})`);
    await tapAt(d, 195, 500);   // (a drop the moment it entered: off the tower)
    ok(await waitFor(d.p, 'window.__hiPlay.state().shown', 6000) && (await d.p.evaluate(() => document.querySelector('.hi-end-t').textContent)) === 'MISSED THE STACK', 'a drop with the slab off the tower: MISSED THE STACK');
    const kept = await d.p.evaluate(() => [document.querySelector('.hi-end-best').textContent, localStorage.getItem('hi:play:best')]);
    ok(kept[0] === 'YOUR BEST 41' && kept[1] === '41', 'a run under your best leaves it alone');
    ok(d.errs.length === 0 && d.reqs.every(r => allowed(r.slice(r.indexOf(' ') + 1))), `no page error, no stray request (${d.errs.join(' | ')})`);
    await d.close();
  }

  // ---- REDUCED MOTION: no sparks, the rings + the tower stay
  {
    const d = await open(390, 844, 2, '?seed=calm');
    await d.p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await d.p.reload({ waitUntil: 'load' });
    await waitFor(d.p, '!!window.__hiPlay', 8000); await ready(d.p);
    await climb(d.p, 8, 'i => (i % 2 ? 6 : 0)');
    const q = await st(d.p);
    ok(q.info.reduce && q.info.sparks === 0 && q.floor === 8 && q.info.rings > 0, `reduced motion: ${q.info.sparks} sparks after four cuts — the tower + the perfect's ring stay`);
    await d.close();
  }

  // ---- the other sizes: a small phone, a big phone, 1440 × 900 (DESKTOP COMES FREE)
  for (const [w, h, dpr, name] of [[375, 667, 2, 'e2e-375x667'], [430, 932, 3, 'e2e-430x932'], [1440, 900, 1, 'e2e-1440x900']]) {
    const d = await open(w, h, dpr, '?seed=size');
    await ready(d.p); await sleep(300);
    const cx = w / 2;
    await tapAt(d, cx, h * 0.6);
    let n = 0;
    for (let i = 0; i < 7; i++) { if (await atPerfect(d.p, 14) !== 'go') break; await tapAt(d, cx, h * 0.6); n++; if ((await st(d.p)).over) break; }
    await sleep(120);
    const q = await st(d.p);
    await shot(d.p, `${name}-run.png`);
    await waitFor(d.p, 'window.__hiPlay.state().shown', 15000);
    const m = await d.p.evaluate(() => { const qs = sel => document.querySelector(sel), L = window.__hiPlay, tp = L.state().viewTop, st2 = qs('.hi-stage').getBoundingClientRect(), V = L.view, a = V.project(tp.x1, tp.floor, tp.z0), c = V.project(tp.x0, tp.floor, tp.z1); return { card: qs('.hi-end').getBoundingClientRect().bottom, top: V.project((tp.x0 + tp.x1) / 2, tp.floor, (tp.z0 + tp.z1) / 2)[1] * st2.height, stage: [st2.left, st2.width, st2.height], scroll: document.documentElement.scrollWidth, w: innerWidth, words: qs('.hi-end-t').textContent, go: qs('.hi-end-go').getBoundingClientRect(), check: qs('.hi-check').textContent }; });
    ok(d.up && q.taps === n && n >= 3 && m.scroll <= m.w && d.errs.length === 0, `${w} × ${h}: the game runs (floor ${q.floor} after ${n} real taps), no sideways scroll, no page error`);
    ok(m.card <= m.top + 6 && m.check === 'REPLAY = LIVE ✓', `${w} × ${h}: the end card ends above the top slab (${m.card.toFixed(0)} ≤ ${m.top.toFixed(0)}); REPLAY = LIVE ✓`);
    if (w > 700) ok(Math.abs(m.stage[1] - 0.6 * h) < 2 && Math.abs(m.stage[0] - (w - 0.6 * h) / 2) < 2, `${w} × ${h}: the phone's own column, centred (${m.stage[1].toFixed(0)} px wide)`);
    await shot(d.p, `${name}-out.png`);
    await d.close();
  }
}

// ---- THE MEASURE: the frame rate at every tier, at 1× and 4× CPU, the bot playing (a cut + its sparks every third drop) high in the clouds
async function perf() {
  console.log('\n| tier | cpu | fps | frame ms (p95 · worst) | calls | tris | size |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
    const d = await open(390, 844, 3, `?seed=perf&tier=${tier}`);
    await ready(d.p); await sleep(300);
    await climb(d.p, 62, 'i => (i % 9 === 8 ? 2 : 0)');
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    // the bot plays in the page for 10 s: a drop at each slab's perfect moment — every third one late (a cut, its sparks, a falling piece)
    const r = await d.p.evaluate(() => new Promise(res => {
      const L = window.__hiPlay, play = document.querySelector('.hi-play'), t0 = performance.now();
      let n = 0, f0 = L.frames().length;
      (function poll() {
        if (performance.now() - t0 > 10000 || L.state().over) { const fr = L.frames().slice(f0 + 20).sort((a, b) => a - b), i = L.state().info; return res({ n, frames: fr.length, avg: fr.reduce((a, b) => a + b, 0) / fr.length, p95: fr[Math.floor(fr.length * 0.95)], worst: fr[fr.length - 1], calls: i.calls, tris: i.tris, w: i.w, h: i.h, dpr: i.dpr, tier: i.tier, bloom: i.bloom, over: L.state().over, floor: L.state().floor }); }
        const m = L.msToPerfect();
        if (m != null && m <= 10) { setTimeout(() => { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); n++; setTimeout(poll, 220); }, n % 3 === 2 ? m + 42 : Math.max(0, m - 4)); return; }
        setTimeout(poll, 4);
      })();
    }));
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log(`| ${r.tier}${r.bloom ? ' (bloom)' : ''} | ${rate}× | ${(1000 / r.avg).toFixed(1)} | ${r.avg.toFixed(1)} (${r.p95.toFixed(1)} · ${r.worst.toFixed(1)}) | ${r.calls} | ${r.tris} | ${r.w}×${r.h} @${r.dpr} |   (${r.n} drops → floor ${r.floor}${r.over ? ', out' : ''}, ${r.frames} frames)`);
    ok(1000 / r.avg > 57 && r.p95 < 20.5, `tier ${tier} at ${rate}× CPU: ${(1000 / r.avg).toFixed(1)} fps (p95 ${r.p95.toFixed(1)} ms, worst ${r.worst.toFixed(1)} ms)`);
    ok(d.errs.length === 0, `… no page error (${d.errs.join(' | ')})`);
    await d.close();
  }
}

if (LOOK) await look();
else if (PERF) await perf();
else await main();

await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
