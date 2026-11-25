// HIGH RISE S2 — THE TEST PAGE's own check (/highrise-play — js/games/highrise/play.js + night.js — docs/highrise.md "THE TEST PAGE"),
// the BROWSER half of tests/highrise-play.test.mjs, on the LOCAL server (NEVER THE LIVE SITE):
//   · the page loads at 390 × 844: the sign (HIGH / RISE), TAP TO START, the night look (the plate, the reflection map, the glass tower)
//   · a BOT RUN THROUGH REAL TAPS (CDP touches timed at each slab's perfect moment): every drop logged at the touch's own tick, the
//     view's tower == the engine's, the HUD (the big floor number, the band's name, the announcer lane), REPLAY = LIVE ✓ on the end card
//   · YOUR BEST = THIS PHONE: stored after a run, the right-edge tag while it is above you (never in THE DROP ZONE), the gold tape +
//     NEW BEST at the crossing
//   · THE HEIGHT AREAS: the band's name + its plate change as the tower climbs; the look's FIVE plates are held from the welcome on (S4B — PRE-WARM)
//   · THE SOUNDS: the cues asked of the engine (the chime climbing its scale), THE AUDITION sheet + COPY MY PICKS
//   · THE LOST CONTEXT: the scene rebuilt on the same tower, the run never stopped
//   · **NOTHING COUNTS**: NO request but the page's own static files, three.js from its CDN and the fonts — no /api, no Firebase, no
//     web socket, no service worker; the only thing stored: `hi:play:*` on this phone
//   · `--look` = the review's shots only (every band, the moments, the end) · `--perf` = the measured frame rate, every tier, 1× + 4× CPU
//   · `--webkit` = Playwright's WebKit as an iPhone (~/wk): every shader builds, the scene draws, real touches drop slabs, REPLAY = LIVE
//   · S3 (`s3()` — the whole check runs it; `--s3` = it alone): BOTH LOOKS (AUTO · DAY · NIGHT on the start screen, remembered), a look
//     SWITCH MID-RUN with no hitch + no new program, EACH FLYER AT ITS FLOOR in both looks (the seed's Blackbird / F-22 pair, the UFO,
//     THE MOTHERSHIP + its solo moment + deep space, the match's FINISH + its gold card), NOTHING INSIDE THE PLAY ZONE (the canvas's own
//     pixels under THE DROP ZONE's edge: the same with a flyer up as without), the day's words + the tape readable on a bright sky
//   · `--fly` = the flyers' look shots · `--hitch` = THE LAG HUNT's long run (HITCH_Q='&look=day' = by day; the flyers fly in it)
//   node tests/integration/highrise-play.mjs "<chromium>" [outDir] [--look] [--fly] [--perf] [--webkit] [--review] [--s3] [--hitch] [--end]   (--review = the fresh-eyes review's finds only; the whole check runs them too · --end = S4B's END SCREEN: every cause + the finish, both looks)
import { frameCheck } from './kit/frame-report.mjs';
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { flashWatch } from './kit/flash-watch.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { flyPlan, FLY_FLOORS } from '../../js/games/highrise/flyplan.js';
import { slabColor } from '../../js/games/highrise/bands.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, LOOK = argv.includes('--look'), PERF = argv.includes('--perf');
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 900000 /* (--hitch: one call lasts the whole run) */, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };
const shot = async (p, name) => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };

/** THE ONLY REQUESTS THE PAGE MAY MAKE: its own page + static files, three.js from the import map's CDN, the fonts */
const OWN = [/^\/highrise-play(\.html)?$/, /^\/css\/(base|components|highrise-play)\.css$/, /^\/js\/games\/highrise\/[a-z-]+\.js$/, /^\/js\/games\/kit\/(tiers|look|moments)\.js$/, /^\/js\/core\/(rng|sky|weather|harbor-weather|party|proof)\.js$/,   // (THE PROOF PASS: + core/proof.js — PURE, no imports: THE FIRST GO, read by logic.js)
 
  /^\/js\/ui\/(dom|lazy-import|sheet|layers)\.js$/, /^\/js\/audio\/(engine|settings|sound-state|leave-text)\.js$/, /^\/js\/(errlog|core\/bot-ua)\.js$/, /^\/assets\/highrise\/(plates\/(night|day)-[1-5]\.webp|env-(night|day)\.png)$/, /^\/audio\/highrise\/[a-z0-9-]+\.mp3$/,
  /^\/assets\/favicon-64\.png$/, /^\/favicon\.ico$/, /^\/assets\/fonts\//,
  // (S3: THE FLYERS — JAYWALK's own Blackbird + UFO (shared, cached) + its GLB reader, HIGH RISE's F-22, the city's jet / UFO sounds)
  /^\/js\/games\/jaywalk\/models\.js$/, /^\/assets\/jaywalk\/models\/(blackbird|ufo)\.glb$/, /^\/assets\/highrise\/models\/f22\.glb$/, /^\/audio\/city\/(jet-scream|jets-formation|ufo-hum|ufo-beam-on)\.mp3$/];
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const allowed = url => { if (url === THREE_URL || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) return true; const u = new URL(url); return u.origin === new URL(BASE).origin && OWN.some(re => re.test(u.pathname)); };
const COUNTS = /\/api\/|firebaseio|firebasejs|\/js\/(profile|progress|board|daily|vault|chat|admin|screens)\/|\/js\/(firebase|store|room|host|identity|seat|app|config)\.js|share|report|cards?\b|sw\.js/i;

async function open(w, h, dpr, q0 = '', before = null) {
  // (the S2 checks are the NIGHT look's: a page opens by night unless its address names a look — or asks for the phone's own choice: auto=1)
  const q = /[?&](look|auto)=/.test(q0) ? q0 : `${q0}${q0 ? '&' : '?'}look=night`;
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
async function look() { for (const lk of (process.env.LOOKS || 'night,day').split(',')) await lookOf(lk); }
async function lookOf(lk) {
  const L = lk === 'day' ? 'day-' : '', LQ = `&look=${lk}`;
  const t = await open(390, 844, 3, `?seed=look1${LQ}`);
  const { p } = t;
  ok(t.up && await ready(p), `the page + its ${lk} look are up (the plate, the reflection map, the warm frame)`);
  await sleep(400);
  await shot(p, `play-390-${L}start.png`);
  // the rooftops: a few clean drops, then a cut (sparks + the falling piece), then a perfect (the ring)
  await climb(p, 6, 'i => (i % 3 === 2 ? 5 : 0)');
  await shot(p, `play-390-${L}rooftops.png`);
  await p.evaluate(() => window.__hiPlay.climb(1, () => 7)); await sleep(30); await shot(p, `play-390-${L}cut.png`);
  await sleep(300);
  await p.evaluate(() => window.__hiPlay.climb(1, () => 0)); await sleep(30); await shot(p, `play-390-${L}perfect.png`);
  if (await waitFor(p, '(() => { const m = window.__hiPlay.msToPerfect(); return m != null && m > 250 && m < 600; })()', 3000)) await shot(p, `play-390-${L}slide.png`);
  for (const [n, name] of [[30, 'skyline'], [70, 'clouds'], [125, 'stars'], [185, 'space'], [240, 'deep']]) {
    const f = (await st(p)).floor;
    await climb(p, n - f, 'i => (i % 11 === 10 ? 3 : 0)');
    if (await waitFor(p, '(() => { const m = window.__hiPlay.msToPerfect(); return m != null && m > 120 && m < 420; })()', 3000)) await shot(p, `play-390-${L}${name}.png`);
    console.log('  ', name, JSON.stringify((await st(p)).info));
  }
  // the end: stop tapping — THE FUSE
  await waitFor(p, 'window.__hiPlay.state().shown', 15000); await sleep(300);
  await shot(p, `play-390-${L}out.png`);
  ok(t.errs.length === 0, `${lk}: no page error (${t.errs.join(' | ')})`);
  await t.close();
  // YOUR BEST: the tag above you, then the gold tape on the tower once crossed (after its flash has gone), then a few floors on
  {
    const d = await open(390, 844, 3, `?seed=look3${LQ}`, () => { try { localStorage.setItem('hi:play:best', '9'); } catch { /* fine */ } });
    await ready(d.p); await sleep(300);
    await climb(d.p, 5); await sleep(500);
    await shot(d.p, `play-390-${L}besttag.png`);
    await climb(d.p, 5); await sleep(1400);
    await shot(d.p, `play-390-${L}tape.png`);
    await climb(d.p, 4); await sleep(700);
    await shot(d.p, `play-390-${L}tape-later.png`);
    await d.close();
  }
  for (const [w, h, dpr, nm] of [[375, 667, 2, 'play-375x667'], [430, 932, 3, 'play-430x932'], [1440, 900, 1, 'play-1440x900']]) {
    const d = await open(w, h, dpr, `?seed=look2${LQ}`), name = `${nm}${lk === 'day' ? '-day' : ''}`;
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
    return { sign: box(q('.hi-sign')), go: box(q('.hi-start-go')), l: box(q('.hi-start-l')), best: q('.hi-tag').hidden ? '' : q('.hi-tag').textContent, sub: box(q('.hi-start-sub')), box: getComputedStyle(q('.hi-start')).backgroundColor + getComputedStyle(q('.hi-start')).borderTopWidth, snd: box(q('.hi-snd')), note: box(q('.hi-note')), hud: box(q('.hi-hud')), endHidden: q('.hi-end').hidden, fps: !!q('.hi-fps'), stage: box(q('.hi-stage')), w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')) };
  });
  ok(dom.sign.text === 'HIGHRISE' && dom.sign.fs >= 56 && dom.sign.fs >= 80 && dom.sign.y > 60 && dom.sign.y + dom.sign.h < 844 * 0.4 && dom.sub.text === 'STACK IT AS HIGH AS YOU DARE' && dom.sub.fs >= 13 && dom.sub.y > dom.sign.y + dom.sign.h && dom.box === 'rgba(0, 0, 0, 0)0px', `THE WELCOME = A · THE SIGN: HIGH / RISE stacked, BIG (${dom.sign.fs} px), in the sky; its one line under it; no box, no panel`);
  ok(dom.go.text === 'TAP TO START' && dom.go.fs >= 20 && dom.l.text === 'ONE TAP DROPS EACH SLAB' && dom.l.fs >= 13 && dom.go.fs >= 23 && dom.go.y > 844 * 0.8 && dom.l.y > dom.go.y && dom.best === '' && dom.endHidden, `TAP TO START big (${dom.go.fs} px) at the foot + the one rule under it; no BEST tag on a first visit`);
  ok(dom.snd.text === 'SOUNDS' && dom.snd.h >= 44 && dom.snd.w >= 44 && dom.snd.x >= 0 && dom.snd.y < 80 && dom.note.text === 'TEST PAGE · SOLO · NOTHING COUNTS YET' && dom.note.fs >= 11, 'SOUNDS in the top left corner (≥ 44 pt); the foot says TEST PAGE · SOLO · NOTHING COUNTS YET');
  ok(dom.hud.op === 0 && !dom.fps && dom.scroll <= dom.w && dom.stage.w === 390, 'the HUD waits for the run; no fps readout without ?fps=1; no sideways scroll');
  const geo = await p.evaluate(() => { const V = window.__hiPlay.view, a = V.project(5000, 0, -5000), c = V.project(-5000, 0, 5000), top = V.project(0, 0, 0); return { wide: Math.abs(a[0] - c[0]), level: Math.abs(a[1] - c[1]), topY: top[1], topX: top[0], zone: V.zoneTop() }; });
  ok(geo.wide > 0.54 && geo.wide < 0.64 && geo.level < 0.01 && Math.abs(geo.topX - 0.5) < 0.02 && geo.topY > 0.64 && geo.topY < 0.76, `THE CAMERA at THE WELCOME: the first slab ≈ 60 % of the screen width (${(geo.wide * 100).toFixed(1)} %), corner-on, level, its top ≈ 70 % down the screen (${(geo.topY * 100).toFixed(0)} %) — the sign has the sky`);
  ok(dom.sub.y + dom.sub.h < geo.topY * 844 - 60 && dom.go.y > geo.topY * 844 + 40, 'the sign + its line sit clear above the top of the tower; TAP TO START below it, in the fade at the foot');
  ok(s.info.look === 'night' && s.info.tier === 2 && s.info.bloom && s.info.env && s.info.plates.includes(0) && s.info.held.length === 5 && s.info.calls <= 12, `THE NIGHT LOOK: tier 2 + the bloom, the reflection map + the rooftops' plate in, the look's five plates held (${s.info.held} — S4B's PRE-WARM), ${s.info.calls} draw calls a frame`);

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
  const hud = await p.evaluate(() => { const q = sel => document.querySelector(sel), r = q('.hi-num').getBoundingClientRect(); return { n: q('.hi-num').getAttribute('aria-label'), fs: parseFloat(getComputedStyle(q('.hi-num')).fontSize), y: r.top, b: r.bottom, band: q('.hi-band').textContent, bandFs: parseFloat(getComputedStyle(q('.hi-band')).fontSize), digits: q('.hi-num').querySelectorAll('.hi-dg').length }; });
  ok(hud.n === String(s1.floor) && hud.fs >= 64 && hud.y < 844 * 0.1 && hud.digits === String(s1.floor).length && hud.band === 'THE ROOFTOPS' && hud.bandFs >= 13, `THE HUD: the floor number big at the top (${hud.fs} px, each digit its own box), the band's name under it`);
  ok(perfectSeen, 'a PERFECT is called in the announcer lane');
  ok(s1.info.rings > 0 && s1.info.boxes >= s1.floor + 2, `a perfect pulses its ring of light (${s1.info.rings} rings so far); every floor is a box in the ONE mesh (${s1.info.boxes})`);
  await shot(p, 'e2e-390-run.png');
  // … then it stops tapping: THE FUSE ends the run — the end card after the slab is seen falling
  ok(await waitFor(p, 'window.__hiPlay.state().shown', 15000), 'the run ends by itself (THE FUSE) — the end card follows');
  const e = await p.evaluate(() => {
    const q = sel => document.querySelector(sel), box = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, fs: parseFloat(getComputedStyle(el).fontSize), text: el.textContent }; };
    const L = window.__hiPlay, last = L.ends[L.ends.length - 1], tp = L.state().viewTop;
    const col = sel => getComputedStyle(q(sel)).color;
    return { hidden: q('.hi-end').hidden, card: box(q('.hi-ec')), hd: box(q('.hi-ec-hd')), hdCols: [col('.fn-w1'), col('.fn-w2'), col('.fn-m')], words: box(q('.hi-ec-cause')), wordsCol: col('.hi-ec-cause'), n: q('.hi-ec-n').getAttribute('aria-label'), nBox: box(q('.hi-ec-n')), nCol: col('.hi-ec-n'), nfs: parseFloat(getComputedStyle(q('.hi-ec-n')).fontSize), fl: box(q('.hi-ec-fl')), best: box(q('.hi-ec-best')), bestCol: col('.hi-ec-best'), line: box(q('.hi-ec-line')), strip: !!q('.hi-ec-strip, .hi-ec-col'), tagOn: !q('.hi-tag').hidden, go: box(q('.hi-again')), goR: parseFloat(getComputedStyle(q('.hi-again')).borderTopLeftRadius), goBg: getComputedStyle(q('.hi-again')).backgroundColor, goOld: !!q('.hi-end-go'), note: box(q('.hi-note')), sndB: box(q('.hi-snd')), check: box(q('.hi-check')), okCls: q('.hi-check').classList.contains('is-ok'),
      top: L.view.project((tp.x0 + tp.x1) / 2, tp.floor, (tp.z0 + tp.z1) / 2)[1] * innerHeight, snd: !q('.hi-snd').hidden, last: { same: last.same, live: last.live, replay: last.replay, best: last.best, was: last.was }, stored: localStorage.getItem('hi:play:best'), keys: Object.keys(localStorage) };
  });
  ok(!e.hidden && e.hd.text === 'HIGH RISE · SOLO' && e.hdCols.join('|') === 'rgb(255, 79, 216)|rgb(54, 201, 255)|rgb(201, 182, 255)' && e.hd.y >= e.sndB.b - 1, `THE END = JAYWALK'S STANDARD: the header "${e.hd.text}" — HIGH hot pink, RISE cyan, the mode lavender (${e.hdCols.join(' · ')}), under the SOUNDS button's row`);
  ok(e.words.text === 'TOO SLOW' && e.words.fs >= 30 && e.words.fs <= 34 && e.wordsCol === 'rgb(255, 79, 216)' && e.n === String(s1.floor) && e.nfs >= 84 && e.nCol === 'rgb(255, 255, 255)' && e.fl.text === (s1.floor === 1 ? 'FLOOR' : 'FLOORS') && e.hd.y < e.words.y && e.words.y < e.nBox.y && e.nBox.y < e.fl.y && e.fl.y < e.best.y && e.best.y < e.line.y, `… "${e.words.text}" BIG in saturated hot pink (${e.words.fs.toFixed(0)} px, ${e.wordsCol}) · the floor ${e.n} HUGE + white (${e.nfs.toFixed(0)} px) · ${e.fl.text} · the best · the stats line — in that order`);
  ok(e.best.text === `YOUR BEST · ${s1.floor}` && e.bestCol === 'rgb(255, 210, 87)' && /^\d+ PERFECTS? · BEST STREAK \d+$/.test(e.line.text) && !e.strip && !e.tagOn && e.go.text === 'PLAY AGAIN' && e.go.fs >= 19 && !e.goOld, `"${e.best.text}" in gold · "${e.line.text}" · no stats strip, no tag over the tower · PLAY AGAIN`);
  // THE END's FOOT (S2 FIX): ONE big solid bar in the game's accent — full width inside the gutters, ≥ 56 pt tall, a rounded rectangle (no pill), clear of the card, the SOUNDS button and the note
  ok(e.go.h >= 56 && e.go.x === 16 && e.go.w === 390 - 32 && e.goR > 0 && e.goR <= 14 && e.goR < e.go.h / 3 && e.goBg === 'rgb(255, 79, 216)', `THE FOOT: the PLAY AGAIN bar ${e.go.w} × ${e.go.h.toFixed(0)}, ${e.goR} px corners (no pill), solid in the accent (${e.goBg})`);
  ok(e.go.y >= e.card.b + 8 && e.go.y >= e.sndB.b + 8 && e.go.b <= e.note.y - 4 && e.go.b <= 844 - 8, `… clear of the card (${e.card.b.toFixed(0)} → ${e.go.y.toFixed(0)}), SOUNDS and the note (${e.go.b.toFixed(0)} → ${e.note.y.toFixed(0)})`);
  ok(e.card.b <= e.check.y - 8 && [e.hd, e.words, e.nBox, e.fl, e.line, e.best, e.go, e.check].every(x => x.x >= 0 && x.x + x.w <= 390), `the card fits the screen: its last line ends at ${e.card.b.toFixed(0)}, well above the small line over the bar (${e.check.y.toFixed(0)}); nothing runs off the 390`);
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
  ok(await waitFor(p, "!!document.querySelector('.hi-au-sheet.is-in, .hi-au-sheet') && document.querySelectorAll('.hi-au-row').length === 9", 6000), 'a real tap on SOUNDS opens the SOUNDS sheet: nine sounds');
  await sleep(450);
  // (S3 — the owner's picks are FINAL, ALL A: the sheet is a plain list — every sound, ONE PLAY each; nothing to choose, nothing stored)
  const au = await p.evaluate(() => ({ rows: [...document.querySelectorAll('.hi-au-row')].map(r => ({ id: r.dataset.id, plays: [...r.querySelectorAll('.hi-au-play')].map(b => [b.textContent, b.getBoundingClientRect().height]) })), extra: document.querySelectorAll('.hi-au-pick, .hi-au-copy, .hi-au-line').length, text: document.querySelector('.hi-au-sheet').textContent, open: window.__hiPlay.state().sheet }));
  ok(au.open && au.rows.map(r => r.id).join() === 'drop,perfect,slice,falling-piece,grow-back,streak,out,band-arrival,pass' && au.rows.every(r => r.plays.length === 1 && r.plays[0][0] === 'PLAY' && r.plays[0][1] >= 40) && au.extra === 0 && !/PLAY B|USE|COPY MY PICK/.test(au.text), 'the SOUNDS list: every sound, ONE PLAY each — GROW-BACK too (S4A FIX 2: its pick is FINAL — the five takes + COPY MY PICK are gone)');
  ok(await p.evaluate(() => localStorage.getItem('hi:play:snd:grow-back') === null && !document.querySelector('.hi-au-take')), "GROW-BACK = ONE take (the owner's pick): no chooser, and S4A FIX's pick on this phone is cleared");
  await sleep(2000);
  const press = async sel => { const c = await p.evaluate(q => { const el = document.querySelector(q); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel); await sleep(80); await tapAt(t, c[0], c[1]); await sleep(120); };
  const before = (await p.evaluate(() => window.__hiPlay.sfx.wanted().length));
  await press('.hi-au-play[data-snd="slice"]');
  const au2 = await p.evaluate(() => ({ wanted: window.__hiPlay.sfx.wanted().slice(-1)[0], n: window.__hiPlay.sfx.wanted().length, ls: Object.keys(localStorage).filter(k => /snd/.test(k)) }));
  ok(au2.n === before + 1 && au2.wanted.id === 'slice' && au2.wanted.rate === 1 && !('ab' in au2.wanted) && au2.ls.length === 0, 'PLAY plays the sound\'s one take (the slice = the glassy snap); nothing is stored for the sounds');
  await press('.hi-au-play[data-snd="perfect"]');
  await sleep(320 * 9 + 200);
  const scale = await p.evaluate(() => window.__hiPlay.sfx.wanted().filter(x => x.id === 'perfect').slice(-9).map(x => x.rate));
  const want = [0, 2, 4, 7, 9, 12, 14, 16, 16].map(k => +(0.5 * Math.pow(2, k / 12)).toFixed(4));
  ok(JSON.stringify(scale) === JSON.stringify(want), `THE PERFECT CHIME starts an octave down, climbs its major-pentatonic scale and HOLDS at the top (${scale.map(r => r.toFixed(2)).join(' ')})`);
  // the run holds still under the sheet: a tap on the sheet is never a start
  ok(!(await st(p)).started || (await st(p)).shown, 'the game holds still under the sheet');
  await p.evaluate(() => document.querySelector('.sh-x').click());
  ok(await waitFor(p, '!window.__hiPlay.state().sheet', 3000), 'the sheet closes');
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

  // ---- THE HEIGHT AREAS: the band's name + its plate follow the climb; the look's five plates are held all along (S4B: nothing is loaded at a seam)
  await climb(p, 26 - x.floor);
  await sleep(900);
  const b1 = await st(p), l1 = await p.evaluate(() => document.querySelector('.hi-band').textContent);
  ok(b1.floor >= 26 && b1.band === 1 && l1 === 'THE SKYLINE' && b1.info.held.length === 5, `floor ${b1.floor}: THE SKYLINE (plates held: ${b1.info.held})`);
  await climb(p, 70 - b1.floor);
  await sleep(1300);
  const b2 = await st(p), l2 = await p.evaluate(() => document.querySelector('.hi-band').textContent);
  ok(b2.band === 2 && l2 === 'THE CLOUDS' && b2.info.held.length === 5 && b2.info.plates.includes(2) && b2.info.loads === b1.info.loads, `floor ${b2.floor}: THE CLOUDS — its plate was in long before (held: ${b2.info.held}); nothing loaded on the way up (${b2.info.loads} loads, all before the first tap)`);
  const arr = await p.evaluate(() => window.__hiPlay.sfx.wanted().filter(q => q.id === 'band-arrival').length);
  ok(arr === 2, 'a band\'s arrival sounds once a band');
  ok(sameTop(b2) && b2.info.calls <= 13 + (b2.info.lights ? 6 : 0),   /* (the tape on: + its line, + its faint back edges, + its line in the bloom pass; S3: a flyer in the sky — the climb just passed the flyby's floor — adds its bodies + its lights + their bloom twins: ≤ 6) */ `the view's tower == the engine's after ${b2.taps} drops; ${b2.info.calls} draw calls a frame${b2.info.lights ? ' (a flyer in the sky)' : ''}`);

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
  const e2 = await p.evaluate(() => ({ best: document.querySelector('.hi-ec-best').textContent, isNew: document.querySelector('.hi-ec-best').classList.contains('is-new'), stored: localStorage.getItem('hi:play:best'), check: document.querySelector('.hi-check').textContent, fl: document.querySelector('.hi-ec-fl').textContent, floor: window.__hiPlay.state().floor, ends: window.__hiPlay.ends.map(q => q.same) }));
  ok(e2.best === `NEW BEST · WAS ${bestWas}` && e2.floor > bestWas && e2.isNew && e2.stored === String(e2.floor) && e2.fl === 'FLOORS', `the end card: floor ${e2.floor} — "${e2.best}" (gold) — stored (${e2.stored})`);
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
  ok(await waitFor(p, 'window.__hiPlay.state().shown', 6000) && (await p.evaluate(() => document.querySelector('.hi-ec-cause').textContent)) === 'TOO SLOW', 'HIDING THE APP = NO PAUSE: back from 6.5 s away the run is over — TOO SLOW (the fuse)');
  const outs = await p.evaluate(() => window.__hiPlay.sfx.wanted().slice(-3).map(q => q.id));
  ok(outs[outs.length - 1] === 'out' && (await p.evaluate(() => window.__hiPlay.ends.slice(-1)[0].same)), 'the batch that came back sounds only its OUT; REPLAY = LIVE');
  const sent = t.reqs.slice(nBefore).filter(q => /\/api\//.test(q));
  const door = await p.evaluate(async () => { let f = 'sent'; try { await fetch('/api/log', { method: 'POST', body: '{}' }); } catch (er) { f = String(er.message); } return { f, b: navigator.sendBeacon('/api/log', 'x') }; });
  ok(sent.length === 0 && door.f === 'this page never calls the server' && door.b === true && !t.reqs.some(q => /\/api\//.test(q)), `THE DOOR: leaving with the sound on sends NOTHING (the shared audio engine's quiet counter ${t.reqs.some(q => q.endsWith('/js/errlog.js')) ? 'WAS loaded — its beacon stopped here' : 'was not even loaded'}); a fetch / a beacon to /api/ from this page never leaves the phone`);

  // ---- NOTHING COUNTS
  const stray = t.reqs.filter(q => !allowed(q.slice(q.indexOf(' ') + 1)) || !q.startsWith('GET '));
  ok(stray.length === 0, `NO request but the page's own static files, three.js from its CDN and the fonts (${t.reqs.length} requests${stray.length ? ` — STRAY: ${stray.join(' , ')}` : ''})`);
  ok(t.reqs.some(q => q.endsWith(THREE_URL)) && t.reqs.some(q => /\/assets\/highrise\/plates\/night-1\.webp/.test(q)) && t.reqs.some(q => /\/audio\/highrise\/drop\.mp3/.test(q)) && !t.reqs.some(q => /\.wav/.test(q)), '… (three.js, the plates, the sounds really came through them)');
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
    const dm = await d.p.evaluate(() => [document.querySelector('.hi-tag').hidden ? '' : document.querySelector('.hi-tag').textContent, (document.querySelector('.hi-fps') || {}).textContent || '', location.search]);
    ok(q.mode === 'match' && q.seed === 'abc' && q.best === 41 && dm[0] === 'BEST 41' && q.info.tier === 1 && !q.info.bloom, '?mode=match&seed=abc&tier=1: the seed, the pinned tier (no bloom under the top tier); the welcome shows YOUR BEST as the tape\'s tag — BEST 41');
    ok(/^\d+ fps · [\d.]+ ms · worst \d+ · tier 1 · \d+ calls · \d+ tris · 390×844 @2 · tick \d+ · HITCH \d+( \(last: .+\))?( · GC \d+)?$/.test(dm[1]), `?fps=1: the frame-rate readout (${dm[1]})`);
    ok(!/debug/.test(dm[2]), 'a &debug=1 link: the flag is dropped from the address (the shared audio engine never reports from here)');
    await tapAt(d, 195, 500);
    await waitFor(d.p, "window.__hiPlay.state().st === 'slide'", 3000);
    const clock = await d.p.evaluate(() => document.querySelector('.hi-clock').textContent);
    ok(/^[56]:\d\d$/.test(clock), `the match's clock runs under the band's name (${clock})`);
    await tapAt(d, 195, 500);   // (a drop the moment it entered: off the tower)
    ok(await waitFor(d.p, 'window.__hiPlay.state().shown', 6000) && (await d.p.evaluate(() => document.querySelector('.hi-ec-cause').textContent)) === 'MISSED THE STACK', 'a drop with the slab off the tower: MISSED THE STACK');
    const kept = await d.p.evaluate(() => [document.querySelector('.hi-ec-best').textContent, localStorage.getItem('hi:play:best')]);
    ok(kept[0] === 'YOUR BEST · 41' && kept[1] === '41', 'a run under your best leaves it alone (YOUR BEST · 41 on the card)');
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
    const m = await d.p.evaluate(() => { const qs = sel => document.querySelector(sel), L = window.__hiPlay, tp = L.state().viewTop, st2 = qs('.hi-stage').getBoundingClientRect(), V = L.view, a = V.project(tp.x1, tp.floor, tp.z0), c = V.project(tp.x0, tp.floor, tp.z1); return { card: qs('.hi-ec').getBoundingClientRect().bottom, top: V.project((tp.x0 + tp.x1) / 2, tp.floor, (tp.z0 + tp.z1) / 2)[1] * st2.height, stage: [st2.left, st2.width, st2.height], scroll: document.documentElement.scrollWidth, w: innerWidth, words: qs('.hi-ec-cause').textContent, goTop: qs('.hi-again').getBoundingClientRect().top, check: qs('.hi-check').textContent }; });
    ok(d.up && q.taps === n && n >= 3 && m.scroll <= m.w && d.errs.length === 0, `${w} × ${h}: the game runs (floor ${q.floor} after ${n} real taps), no sideways scroll, no page error`);
    ok(m.card <= m.goTop - 30 && m.check === 'REPLAY = LIVE ✓', `${w} × ${h}: the end card ends above the PLAY AGAIN bar (${m.card.toFixed(0)} < ${m.goTop.toFixed(0)}); REPLAY = LIVE ✓`);
    if (w > 700) ok(Math.abs(m.stage[1] - 0.6 * h) < 2 && Math.abs(m.stage[0] - (w - 0.6 * h) / 2) < 2, `${w} × ${h}: the phone's own column, centred (${m.stage[1].toFixed(0)} px wide)`);
    await shot(d.p, `${name}-out.png`);
    await d.close();
  }
}

// ---- THE FRESH-EYES REVIEW's FINDS, each with its own check (docs/games/passes/highrise-s2.md "THE FRESH-EYES REVIEW")
async function review() {
  const hit = (a, c) => !(a.r <= c.x || c.r <= a.x || a.b <= c.y || c.b <= a.y);
  const boxes = p => p.evaluate(() => { const bx = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom }; }, L = window.__hiPlay, tp = L.state().viewTop, sh = document.querySelector('.hi-stage').getBoundingClientRect().height; return { t: bx('.hi-ec-cause'), hd: bx('.hi-ec-hd'), card: bx('.hi-ec'), bar: bx('.hi-again'), snd: bx('.hi-snd'), top: L.view.project((tp.x0 + tp.x1) / 2, tp.floor, (tp.z0 + tp.z1) / 2)[1] * sh, words: document.querySelector('.hi-ec-cause').textContent, best: document.querySelector('.hi-ec-best').textContent, w: innerWidth }; });
  // (1) a phone in a Safari TAB is only ~660 px tall: the end's title never runs into the SOUNDS button — and THE END HOLD holds for a TAP's end
  for (const [w, h] of [[390, 664], [375, 667], [430, 739]]) {
    const d = await open(w, h, 2, '?seed=short');
    await ready(d.p); await sleep(200);
    await tapAt(d, w / 2, h * 0.6);
    await waitFor(d.p, "window.__hiPlay.state().st === 'slide'", 3000);
    await tapAt(d, w / 2, h * 0.6);   // (a drop the moment it entered: MISSED THE STACK — a TAP ends this run)
    const t0 = Date.now();
    await waitFor(d.p, 'window.__hiPlay.state().over', 2000);
    const early = await d.p.evaluate(() => window.__hiPlay.state().shown);
    await waitFor(d.p, 'window.__hiPlay.state().shown', 4000);
    const held = Date.now() - t0;
    const g = await boxes(d.p);
    if (w === 390) ok(!early && held >= 550, `THE END HOLD holds when a TAP ends the run: the card came ${held} ms after the miss (the slab is seen falling first)`);
    ok(g.words === 'MISSED THE STACK' && !hit(g.hd, g.snd) && g.hd.y >= g.snd.b - 1 && g.card.b <= g.bar.y - 30 && g.t.x >= 0 && g.t.r <= g.w && g.hd.x >= 0 && g.hd.r <= g.w, `${w} × ${h} (a Safari tab): the header + "${g.words}" sit under the SOUNDS button's row (the header from ${g.hd.y.toFixed(0)}, the button to ${g.snd.b.toFixed(0)}) and the card ends above the PLAY AGAIN bar (${g.card.b.toFixed(0)} < ${g.bar.y.toFixed(0)})`);
    if (w === 390) ok(g.best === '', 'a first run that never landed a slab shows no "YOUR BEST 0" (no best line at all)');
    await shot(d.p, `review-${w}x${h}-missed.png`);
    await d.close();
  }
  // (2) the longest title — MADE IT TO THE MOTHERSHIP, in gold — on the small phone
  {
    const d = await open(375, 667, 2, '?seed=made&mode=match');
    await ready(d.p); await sleep(200);
    await d.p.evaluate(() => window.__hiPlay.climb(200));
    await waitFor(d.p, 'window.__hiPlay.state().shown', 6000);
    const g = await boxes(d.p), s = await st(d.p);
    const gold = await d.p.evaluate(() => document.querySelector('.hi-stage').classList.contains('is-made'));
    ok(s.floor === 200 && g.words === 'MADE IT TO THE MOTHERSHIP' && gold && !hit(g.hd, g.snd) && g.card.b <= g.bar.y - 30 && g.t.x >= 0 && g.t.r <= g.w && g.t.b - g.t.y < 80, `375 × 667: floor 200 = "${g.words}" in gold, two lines (${(g.t.b - g.t.y).toFixed(0)} px) — clear of SOUNDS, above the PLAY AGAIN bar (${g.card.b.toFixed(0)} < ${g.bar.y.toFixed(0)}), inside the screen`);
    ok((await d.p.evaluate(() => document.querySelector('.hi-check').textContent)) === 'REPLAY = LIVE ✓', '… REPLAY = LIVE ✓ for a full 200-floor match run');
    await shot(d.p, 'review-375x667-made.png');
    await d.close();
  }
  // (3) THE SITE's MUSIC OFF (HEAR THE HARBOR — was PODCAST MODE): the game still SOUNDS
  {
    const d = await open(390, 844, 2, '?seed=pod', () => { try { localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); } catch { /* fine */ } });
    await ready(d.p); await waitFor(d.p, '!!window.__hiPlay.sfx', 5000); await sleep(600);
    await tapAt(d, 195, 500);
    for (let i = 0; i < 6; i++) { if (await atPerfect(d.p, 14) !== 'go') break; await tapAt(d, 195, 500); if ((await st(d.p)).over) break; }
    await sleep(300);
    const a = await d.p.evaluate(() => ({ asked: window.__hiPlay.sfx.wanted().length, played: window.__hiPlay.sfx.played().map(q => q.id) }));
    ok(a.asked >= 6 && a.played.filter(q => q === 'drop').length >= 3, `MUSIC OFF (HEAR THE HARBOR): the sounds still start — ${a.played.length} of ${a.asked} asked (${[...new Set(a.played)].join(' · ')})`);
    await d.close();
  }
  // (4) a best FAR above (behind the diagonal camera): the tag stays at the TOP of its clear column
  {
    const d = await open(390, 844, 2, '?seed=far', () => { try { localStorage.setItem('hi:play:best', '300'); } catch { /* fine */ } });
    await ready(d.p); await sleep(200);
    await tapAt(d, 195, 500); await sleep(1000);   // (the tag rides from the welcome's tape to its column on a 0.56 s transition)
    const g = await d.p.evaluate(() => { const r = document.querySelector('.hi-tag').getBoundingClientRect(), hud = document.querySelector('.hi-hud').getBoundingClientRect(); return { text: document.querySelector('.hi-tag').textContent, y: r.top, hud: hud.bottom, zone: window.__hiPlay.view.zoneTop() * innerHeight }; });
    ok(g.text === 'BEST 300 ▲300' && g.y - g.hud < 14 && g.y >= g.hud, `a best 300 floors up: the tag "${g.text}" sits at the TOP of its column (${g.y.toFixed(0)}, just under the HUD's ${g.hud.toFixed(0)} — never down against the drop zone at ${g.zone.toFixed(0)})`);
    await d.close();
  }
  // (5) a WebGL 1 phone: the glass still builds (its edges' derivatives) — the tower is there
  {
    const d = await open(390, 844, 2, '?seed=gl1', () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...a) { return type === 'webgl2' ? null : g.call(this, type, ...a); }; });
    await ready(d.p); await sleep(300);
    await climb(d.p, 6);
    const s = await st(d.p);
    const gl1 = await d.p.evaluate(() => { const c = document.querySelector('canvas.hi-canvas'); return typeof WebGL2RenderingContext === 'undefined' || !(c.getContext('webgl') instanceof WebGL2RenderingContext); });
    ok(gl1 && d.errs.length === 0 && s.info.programs >= 4 && s.info.frames > 10 && sameTop(s), `a WebGL 1 context: every shader builds (${s.info.programs} programs, no shader error${d.errs.length ? ` — ${d.errs.join(' | ').slice(0, 200)}` : ''}), the tower is drawn`);
    await shot(d.p, 'review-webgl1.png');
    await d.close();
  }
  // (6) a rebuild that gets NO context keeps trying — the scene comes back by itself
  {
    const d = await open(390, 844, 2, '?seed=nogl');
    await ready(d.p); await sleep(200);
    await climb(d.p, 5);
    await d.p.evaluate(() => {
      const g = HTMLCanvasElement.prototype.getContext; window.__noGL = true;
      HTMLCanvasElement.prototype.getContext = function (type, ...a) { return window.__noGL && /webgl/.test(type) ? null : g.call(this, type, ...a); };
      const c = document.querySelector('canvas.hi-canvas'); (g.call(c, 'webgl2') || g.call(c, 'webgl')).getExtension('WEBGL_lose_context').loseContext();
    });
    ok(await waitFor(d.p, "!!document.querySelector('.hi-nogl') && !document.querySelector('canvas.hi-canvas')", 4000), 'a lost context + NO new context: the line says so (the run goes on)');
    await d.p.evaluate(() => { window.__noGL = false; });
    ok(await waitFor(d.p, "!document.querySelector('.hi-nogl') && !!document.querySelector('canvas.hi-canvas') && window.__hiPlay.state().rebuilds === 1 && window.__hiPlay.state().info.frames > 3", 5000), '… and the rebuild KEEPS TRYING: the scene is back by itself, the line is gone');
    ok(d.errs.filter(e => !/WebGL|context/i.test(e)).length === 0, `no page error (${d.errs.filter(e => !/WebGL|context/i.test(e)).join(' | ')})`);
    await d.close();
  }
  // (7) a FASTER that lands under a STREAK call waits its turn · (8) the tape keeps ITS floor through a rebuild on the end card
  {
    const d = await open(390, 844, 2, '?seed=notch', () => { try { localStorage.setItem('hi:play:best', '5'); } catch { /* fine */ } });
    await ready(d.p); await sleep(200);
    await climb(d.p, 208, 'i => (i === 8 ? 3 : 0)');   // (one cut at drop 9: the streak's tens then land on floors 209, 219, …)
    await d.p.evaluate(() => window.__hiPlay.climb(1)); await sleep(60);
    const c1 = await d.p.evaluate(() => document.querySelector('.hi-call').textContent);
    const later = await waitFor(d.p, "document.querySelector('.hi-call').textContent === 'FASTER'", 3000);
    ok(c1 !== 'FASTER' && c1.length > 0 && later, `floor 209 lands the first notch under a bigger call ("${c1}"): FASTER waits its turn, then shows`);
    await waitFor(d.p, 'window.__hiPlay.state().shown', 12000);
    const tapeWas = (await st(d.p)).info.tape;
    await d.p.evaluate(() => { const c = document.querySelector('canvas.hi-canvas'); (c.getContext('webgl2') || c.getContext('webgl')).getExtension('WEBGL_lose_context').loseContext(); });
    await waitFor(d.p, 'window.__hiPlay.state().rebuilds === 1 && window.__hiPlay.state().info.frames > 3', 4000);
    const s2 = await st(d.p);
    ok(tapeWas === 5 && s2.info.tape === tapeWas && s2.best > 5, `a context lost on the END CARD: the gold tape stays where the run's crossing laid it — floor ${s2.info.tape} (S4B: the end no longer moves it onto the top slab; the best moved on from 5 to ${s2.best})`);
    // (9) PLAY AGAIN from high up: the first band's plate is back already
    ok(s2.info.held.includes(0) || s2.info.plates.includes(0), `the end card keeps the FIRST band's plate ready for PLAY AGAIN (held: ${s2.info.held})`);
    await d.close();
  }
  // ---- S2 FIX: THE END's FOOT on a short phone in a Safari tab (375 × 667) with the fps line on — the bar's own press + lift
  {
    const d = await open(375, 667, 2, '?seed=foot&fps=1');
    await ready(d.p); await sleep(200);
    await climb(d.p, 4);
    await waitFor(d.p, 'window.__hiPlay.state().shown', 15000);
    const shownAt = Date.now();
    const g = await d.p.evaluate(() => { const bx = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom }; }; return { bar: bx('.hi-again'), card: bx('.hi-end'), fps: bx('.hi-fps'), snd: bx('.hi-snd'), note: bx('.hi-note'), text: document.querySelector('.hi-again').textContent, fs: parseFloat(getComputedStyle(document.querySelector('.hi-again')).fontSize), fpsText: document.querySelector('.hi-fps').textContent }; });
    ok(g.text === 'PLAY AGAIN' && g.bar.h >= 56 && g.bar.x === 16 && g.bar.w === 375 - 32 && g.fs >= 19, `375 × 667: the PLAY AGAIN bar ${g.bar.w} × ${g.bar.h.toFixed(0)} (${g.fs.toFixed(1)} px)`);
    ok(g.card.b + 8 <= g.fps.y && g.fps.b + 4 <= g.bar.y && g.bar.b + 4 <= g.note.y && g.snd.b + 8 <= g.bar.y && g.card.b + 8 <= g.bar.y, `… nothing overlaps: the card to ${g.card.b.toFixed(0)}, the fps line ${g.fps.y.toFixed(0)}–${g.fps.b.toFixed(0)}, the bar ${g.bar.y.toFixed(0)}–${g.bar.b.toFixed(0)}, the note from ${g.note.y.toFixed(0)}`);
    ok(/HITCH \d+/.test(g.fpsText), `?fps=1 shows THE HITCH COUNTER ("${g.fpsText.slice(g.fpsText.indexOf('HITCH'))}")`);
    if (OUT) await shot(d.p, 'review-375-foot.png');
    await sleep(Math.max(0, 750 - (Date.now() - shownAt)));
    await tapAt(d, g.bar.x + g.bar.w / 2, g.bar.y + g.bar.h / 2);
    ok(await waitFor(d.p, '(() => { const s = window.__hiPlay.state(); return s.started && !s.shown && s.floor === 0 && s.taps === 0; })()', 3000) && await d.p.evaluate(() => document.querySelector('.hi-again').hidden), 'the bar\'s own press + lift = PLAY AGAIN: the next run is on, the bar is gone');
    ok(d.errs.length === 0, `… no page error (${d.errs.join(' | ')})`);
    await d.close();
  }
}

// ---- THE MEASURE: the frame rate at every tier, at 1× and 4× CPU, the bot playing (a cut + its sparks every third drop) high in the clouds
async function perf() {
  console.log('\n| tier | cpu | fps | frame ms (p95 · worst) | calls | tris | size |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const tier of [2, 1, 0]) for (const rate of [1, 4]) {
    const d = await open(390, 844, 3, `?seed=perf&tier=${tier}${process.env.PERF_Q || ''}`);   // (PERF_Q='&look=day': the day look's measure)
    await ready(d.p); await sleep(300);
    await climb(d.p, process.env.PERF_CLIMB != null ? Number(process.env.PERF_CLIMB) : 62, 'i => (i % 9 === 8 ? 2 : 0)');   // (HIGH RISE PAD + GO: PERF_Q='&floor=80&dpr=2' + PERF_CLIMB=0 = the lab's own start at floor 80)
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate });
    // the bot plays in the page for 10 s: a drop at each slab's perfect moment — every third one late (a cut, its sparks, a falling piece)
    const r = await d.p.evaluate(() => new Promise(res => {
      const L = window.__hiPlay, play = document.querySelector('.hi-play'), t0 = performance.now();
      let n = 0, f0 = L.frames().length;
      (function poll() {
        if (performance.now() - t0 > 10000 || L.state().over) { const fr = L.frames().slice(f0 + 20).sort((a, b) => a - b), i = L.state().info; return res({ list: fr, n, frames: fr.length, avg: fr.reduce((a, b) => a + b, 0) / fr.length, p95: fr[Math.floor(fr.length * 0.95)], worst: fr[fr.length - 1], calls: i.calls, tris: i.tris, w: i.w, h: i.h, dpr: i.dpr, tier: i.tier, bloom: i.bloom, over: L.state().over, floor: L.state().floor }); }
        const m = L.msToPerfect();
        if (m != null && m <= 10) { setTimeout(() => { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); n++; setTimeout(poll, 220); }, n % 3 === 2 ? m + 42 : Math.max(0, m - 4)); return; }
        setTimeout(poll, 4);
      })();
    }));
    await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log(`| ${r.tier}${r.bloom ? ' (bloom)' : ''} | ${rate}× | ${(1000 / r.avg).toFixed(1)} | ${r.avg.toFixed(1)} (${r.p95.toFixed(1)} · ${r.worst.toFixed(1)}) | ${r.calls} | ${r.tris} | ${r.w}×${r.h} @${r.dpr} |   (${r.n} drops → floor ${r.floor}${r.over ? ', out' : ''}, ${r.frames} frames)`);
    frameCheck(ok, `HIGH RISE tier ${tier} at ${rate}× CPU`, r.list);
    ok(1000 / r.avg > 57 && r.p95 < 20.5, `tier ${tier} at ${rate}× CPU: ${(1000 / r.avg).toFixed(1)} fps (p95 ${r.p95.toFixed(1)} ms, worst ${r.worst.toFixed(1)} ms)`);
    ok(d.errs.length === 0, `… no page error (${d.errs.join(' | ')})`);
    await d.close();
  }
}

// ---- WEBKIT (Playwright's, as an iPhone — the phones this game is for): the shaders build, the scene draws, real touches drop slabs
async function webkit() {
  let wb;
  try {
    const { webkit: wk } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
    wb = await wk.launch();
  } catch (e) { console.log(`(no Playwright WebKit here — ${String(e.message).split('\n')[0]})`); return; }
  const ctx = await wb.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const wp = await ctx.newPage(), errs = [], reqs = [];
  wp.on('pageerror', e => errs.push(String(e.message || e)));
  wp.on('console', m => { if (m.type() === 'error' || /THREE\.WebGL|shader|GLSL/i.test(m.text())) errs.push(`console: ${m.text().slice(0, 300)}`); });
  wp.on('request', r => reqs.push(r.url()));
  await wp.goto(guardUrl(`${BASE}/highrise-play?seed=wk`, 'highrise-play'), { waitUntil: 'load' });
  const wait = async (js, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await wp.evaluate(js)) return true; } catch { /* loading */ } await sleep(80); } return false; };
  ok(await wait("!!window.__hiPlay && !!document.querySelector('canvas.hi-canvas')") && await wait('(() => { const i = window.__hiPlay.state().info; return i.env && i.plates.includes(0) && i.warmed > 0 && i.frames > 5; })()'), 'WebKit (an iPhone): the page + its night look are up — the plate, the reflection map, the warm frame, frames drawn');
  const i0 = await wp.evaluate(() => window.__hiPlay.state().info);
  ok(errs.length === 0 && i0.programs >= 4, `every shader built in WebKit — the glass, the plate, the sparks, the rings (+ the bloom's): ${i0.programs} programs, no shader error (${errs.join(' | ')})`);
  await wp.touchscreen.tap(195, 500);
  await wait('window.__hiPlay.state().started', 3000);
  let n = 0;
  for (let k = 0; k < 6; k++) {
    const sig = await wp.evaluate(() => new Promise(res => { const t0 = performance.now(); (function poll() { const L = window.__hiPlay; if (L.state().over) return res('over'); const m = L.msToPerfect(); if (m != null && m <= 30) return res('go'); if (performance.now() - t0 > 9000) return res('timeout'); setTimeout(poll, 2); })(); }));
    if (sig !== 'go') break;
    const before = await wp.evaluate(() => window.__hiPlay.state().taps);
    await wp.touchscreen.tap(195, 500);
    if (await wp.evaluate(() => window.__hiPlay.state().taps) === before + 1) n++;
    if (await wp.evaluate(() => window.__hiPlay.state().over)) break;
  }
  ok(n >= 3, `real touches drop slabs in WebKit (${n} drops)`);
  await wp.evaluate(() => window.__hiPlay.climb(20, i => (i % 3 === 2 ? 4 : 0))); await sleep(500);
  const s1 = await wp.evaluate(() => window.__hiPlay.state());
  ok(JSON.stringify(s1.top) === JSON.stringify(s1.viewTop) && s1.info.sparks > 0 && s1.info.rings > 0 && s1.info.frames > i0.frames + 10, `the view's tower == the engine's on floor ${s1.floor}; sparks + rings flew; the frames keep coming`);
  if (OUT) await wp.screenshot({ path: join(OUT, 'webkit-390x844-run.png') });
  ok(await wait('window.__hiPlay.state().shown', 15000) && (await wp.evaluate(() => document.querySelector('.hi-check').textContent)) === 'REPLAY = LIVE ✓', 'the run ends (THE FUSE): REPLAY = LIVE ✓ in WebKit');
  if (OUT) await wp.screenshot({ path: join(OUT, 'webkit-390x844-out.png') });
  ok(errs.length === 0 && !reqs.some(u => /\/api\//.test(u)), `no page error, no shader error, no /api request in WebKit (${errs.join(' | ')})`);
  await wb.close();
}

// ---- THE LAG HUNT (S2 FIX — docs/games/passes/highrise-s2-fix.md): ONE LONG SOLO RUN, a bot at each slab's perfect moment (every 9th
// drop a cut: its sparks + its falling piece), from the rooftops through every band's seam — every frame over 25 ms is logged with its
// floor + (from S2 FIX on) the page's own cause tag. `--hitch` [--webkit] · HITCH_S (seconds, 240) · HITCH_CPU (Chromium's CPU throttle, 1)
// · HITCH_Q (extra query, e.g. &tier=2). Chromium also reports the garbage made a second (performance.memory).
const HITCH_BOT = secs => new Promise(res => {
  const L = window.__hiPlay, play = document.querySelector('.hi-play'), T0 = performance.now(), rec = [], heap = [];
  const tap = () => play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }));
  let last = 0, n = 0, runs = 1, frames = 0, over25 = 0, over33 = 0, over50 = 0, worst = 0, topFloor = 0, memAt = 0, grew = 0, gcs = 0;
  const gaps = [];
  const mem = () => (performance.memory ? performance.memory.usedJSHeapSize : 0);
  (function fr(now) {
    if (last) {
      const gap = now - last, t = now - T0;
      if (t > 1000) {
        frames++; if (gaps.length < 40000) gaps.push(gap);
        if (gap > 25) { over25++; if (gap > 33) over33++; if (gap > 50) over50++; if (gap > worst) worst = gap; if (rec.length < 400) { const s = L.state(), hs = L.hitches ? L.hitches() : null, h = hs && hs.list.length ? hs.list[hs.list.length - 1] : null; rec.push({ t: Math.round(t), gap: Math.round(gap), floor: s.floor, tier: s.tier, why: h && Math.abs(h.gap - gap) < 6 ? h.why : '' }); } }
        const m = mem(); if (m) { if (memAt && m > memAt) grew += m - memAt; else if (memAt && m < memAt - 200000) gcs++; memAt = m; }
      }
    }
    last = now;
    if (now - T0 < secs * 1000) requestAnimationFrame(fr);
    else { const s = L.state(), hs = L.hitches ? L.hitches() : null; gaps.sort((x, y) => x - y); const med = gaps[gaps.length >> 1] || 0; res({ med: +med.toFixed(1), spikes: gaps.filter(g => g > med + 25).length, secs, frames, over25, over33, over50, worst: Math.round(worst), rec, drops: n, runs, floor: s.floor, topFloor: Math.max(topFloor, s.floor), tier: s.tier, tierPath: s.tierPath, grewKBs: Math.round(grew / 1024 / secs), gcs, page: hs ? { n: hs.n, last: hs.last } : null, plates: s.info.plates, programs: s.info.programs }); }
  })(performance.now());
  tap();   // TAP TO START
  let seen = 0;
  (function poll() {
    const at = performance.now();
    if (at - T0 > secs * 1000) return;
    const m = L.msToPerfect();
    // (the page's whole state is read four times a second, not at every poll: the reading itself makes garbage — the measure's own)
    if (m == null && at - seen > 250) {
      seen = at;
      const s = L.state();
      if (s.floor > topFloor) topFloor = s.floor;
      if (s.shown) { setTimeout(() => { tap(); runs++; setTimeout(poll, 300); }, 700); return; }
    }
    if (m != null && m <= 10) { setTimeout(() => { tap(); n++; setTimeout(poll, 200); }, n % 9 === 8 ? m + 28 : Math.max(0, m - 3)); return; }
    setTimeout(poll, 4);
  })();
});
async function hitch() {
  const SECS = Number(process.env.HITCH_S) || 240, RATE = Number(process.env.HITCH_CPU) || 1, Q = `?seed=hitch&fps=1${process.env.HITCH_Q || ''}`, WK = argv.includes('--webkit');
  let r, errs;
  if (WK) {
    const { webkit: wk } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
    const wb = await wk.launch(), ctx = await wb.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' }), wp = await ctx.newPage();
    errs = []; wp.on('pageerror', e => errs.push(String(e.message || e)));
    await wp.goto(guardUrl(`${BASE}/highrise-play${Q}`, 'highrise-play'), { waitUntil: 'load' });
    const end = Date.now() + 20000;
    while (Date.now() < end) { try { if (await wp.evaluate(() => { const i = window.__hiPlay && window.__hiPlay.state().info; return !!i && i.env && i.plates.includes(0) && i.warmed > 0 && i.frames > 5; })) break; } catch { /* loading */ } await sleep(80); }
    await sleep(600);
    r = await wp.evaluate(HITCH_BOT, SECS);
    if (OUT) await wp.screenshot({ path: join(OUT, 'hitch-webkit.png') });
    await wb.close();
  } else {
    const d = await open(390, 844, 3, Q);
    await ready(d.p); await sleep(600 + (Number(process.env.HITCH_IDLE) || 0));   // (HITCH_IDLE: the page waits on its start screen first — is a pause tied to the FLOOR, or to the browser's own clock?)
    if (RATE > 1) await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    r = await d.p.evaluate(HITCH_BOT, SECS);
    r.fly = await d.p.evaluate(() => ({ plan: window.__hiPlay.plan(), info: window.__hiPlay.flyInfo(), look: window.__hiPlay.state().info.look, space: window.__hiPlay.state().info.space }));
    if (RATE > 1) await d.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    if (OUT) await shot(d.p, `hitch-chromium-${RATE}x.png`);
    errs = d.errs; await d.close();
  }
  const who = WK ? 'WebKit (an iPhone) 1×' : `Chromium ${RATE}× CPU`;
  console.log(`\nTHE LAG HUNT — ${who}, ${r.secs} s after the first second: ${r.frames} frames · ${r.over25} over 25 ms · ${r.over33} over 33 ms · ${r.over50} over 50 ms · worst ${r.worst} ms · the usual frame ${r.med} ms, ${r.spikes} frames 25 ms over it`);
  console.log(`  ${r.drops} drops, ${r.runs} run(s), top floor ${r.topFloor} (ends on ${r.floor}) · tier ${r.tierPath.join(' → ')} · plates held ${r.plates.join()} · ${r.programs} programs${r.grewKBs ? ` · garbage ≈ ${r.grewKBs} KB/s, ${r.gcs} collections seen` : ''}${r.page ? ` · the page's own HITCH counter: ${r.page.n} (last: ${r.page.last || '—'})` : ''}`);
  // (S3: the long run flies its flyers — the seed's flyby, the UFO, THE MOTHERSHIP + its moment, on into deep space)
  if (r.fly) console.log(`  the ${r.fly.look} look · the flyers: ${r.fly.plan.jet} at floor ${r.fly.plan.jetAt}, the UFO at ${r.fly.plan.ufoAt} — flown ${JSON.stringify(r.fly.plan.flown)} · their sounds asked ${r.fly.info.played ? r.fly.info.played.join(' · ') : '—'} · THE MOTHERSHIP done ${r.fly.info.ship ? r.fly.info.ship.done : '—'} · deep space ${r.fly.space}`);
  for (const h of r.rec.slice(0, 60)) console.log(`    ${String(h.t).padStart(6)} ms  ${String(h.gap).padStart(4)} ms  floor ${h.floor}  tier ${h.tier}${h.why ? `  ${h.why}` : ''}`);
  ok(errs.length === 0, `no page error (${errs.join(' | ')})`);
  if (process.env.HITCH_GATE) ok(r.over33 <= Number(process.env.HITCH_GATE), `≤ ${process.env.HITCH_GATE} frames over 33 ms after the first second (${r.over33})`);
}

// ---- THE FLYERS' LOOK (S3): each flyer in both looks at 390 × 844 @3 — the flyby mid-pass (THE BLACKBIRD · the F-22 pair), the UFO,
// THE MOTHERSHIP coming down / fully down / the solo moment, the match's finish + its gold end card. `FLY_LOOKS=day` = one look.
/** keep a run alive while a flyer is watched: a clean drop every 0.8 s through the page's own climb hook — never slower than the game's own
 *  pace (a floor = 54 ticks = 0.9 s from floor 120 on: a slower hand falls behind the run's clock and THE FUSE ends it) */
const alive = (p, on) => p.evaluate(v => { clearInterval(window.__alive); if (v) window.__alive = setInterval(() => { const L = window.__hiPlay; if (!L.state().over) L.climb(1); }, 800); }, on);
async function flyLook() {
  for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    const t = await open(390, 844, 3, `?seed=fly1&look=${lk}`), { p } = t;
    ok(t.up && await ready(p), `${lk}: the page is up`);
    await alive(p, true);
    await climb(p, 38, 'i => (i % 11 === 10 ? 3 : 0)');
    for (const kind of ['blackbird', 'f22']) {
      // (REVIEW FIX B — the review's note: the script asked for the F-22 while the Blackbird — the seed's own flyby, met in the climb, or
      //  the last one asked here — was still in the sky; the game (rightly) flies ONE jet at a time. Wait for a clear sky first.)
      ok(await waitFor(p, "!window.__hiPlay.flyInfo().jet", 20000), `${lk}: the sky is clear before the ${kind} is asked for`);
      const flew = await p.evaluate(k => window.__hiPlay.fly(k, k === 'f22' ? -1 : 1), kind);
      ok(flew === true, `${lk}: ${kind} flies`);
      await sleep(1050); await shot(p, `fly-${lk}-${kind}-a.png`);
      await sleep(500); await shot(p, `fly-${lk}-${kind}-b.png`);
      await sleep(550); await shot(p, `fly-${lk}-${kind}-c.png`);
      console.log('  ', kind, JSON.stringify((await p.evaluate(() => window.__hiPlay.flyInfo())).boxes));
      await sleep(1900);
    }
    await climb(p, 84 - (await st(p)).floor, 'i => (i % 11 === 10 ? 3 : 0)');   // (REVIEW FIX B: under the UFO's own floor 85 — at 86 the game had flown it already: one at a time)
    ok(await waitFor(p, '!window.__hiPlay.flyInfo().ufo && !window.__hiPlay.flyInfo().jet', 20000), `${lk}: the sky is clear before the UFO is asked for`);
    ok(await p.evaluate(() => window.__hiPlay.fly('ufo', 1)) === true, `${lk}: the UFO flies`);
    await sleep(2600); await shot(p, `fly-${lk}-ufo-a.png`);
    await sleep(1700); await shot(p, `fly-${lk}-ufo-b.png`);
    await sleep(4200);
    await climb(p, 190 - (await st(p)).floor, 'i => (i % 11 === 10 ? 3 : 0)');
    await waitFor(p, "(window.__hiPlay.flyInfo().models || []).includes('mothership')", 8000); await sleep(900);
    await shot(p, `fly-${lk}-ship-190.png`);
    await climb(p, Math.max(0, 199 - (await st(p)).floor)); await sleep(500);
    await shot(p, `fly-${lk}-ship-199.png`);
    await climb(p, Math.max(0, 200 - (await st(p)).floor)); await sleep(1500);
    await shot(p, `fly-${lk}-ship-pass-a.png`);
    console.log('  ship', JSON.stringify(await p.evaluate(() => window.__hiPlay.flyInfo())));
    await sleep(2300); await shot(p, `fly-${lk}-ship-pass-b.png`);
    await sleep(2600);
    await climb(p, 16); await sleep(700);
    await shot(p, `fly-${lk}-deep.png`);
    await alive(p, false);
    ok(t.errs.length === 0, `${lk}: no page error (${t.errs.join(' | ')})`);
    await t.close();
    // THE MATCH's FINISH
    const m = await open(390, 844, 3, `?seed=fly2&mode=match&look=${lk}`);
    await ready(m.p);
    await climb(m.p, 199); await sleep(1200);
    await climb(m.p, 1); await sleep(1300);
    await shot(m.p, `fly-${lk}-finish-pour.png`);
    await waitFor(m.p, 'window.__hiPlay.state().shown', 8000); await sleep(500);
    await shot(m.p, `fly-${lk}-finish-card.png`);
    ok(m.errs.length === 0, `${lk} match: no page error (${m.errs.join(' | ')})`);
    await m.close();
  }
}

// ---- THE PINK TAPE's WHITE CORE (S4A FIX — the owner: THE NEXT FRIEND's tape read only by its glow over the rooftops' own pink
// slabs): a seed whose floors 2 … 5 are the rooftops' PINK by night; the friend's tape on floor 3 (the gold one on floor 6 beside it,
// unchanged), just crossed + a few floors down (its faint back edges), in both looks — the whole screen + the tapes close. The
// friend's TAG is the cartridge's (YOUR TABLE): its look is shot with a stand-in line. `--tape`
async function tapeLook() {
  const pink = c => c[0] > 0.8 && c[1] < 0.42 && c[2] > 0.55;
  let seed = 'tape0', found = false;
  for (let i = 0; i < 4000 && !found; i++) { seed = `tape${i}`; found = [2, 3, 4].every(f => pink(slabColor('night', seed, f))); }
  console.log(`  the seed ${seed}: floors 2 … 4 pink by night ${found} — floor 3 = ${slabColor('night', seed, 3).map(v => v.toFixed(2)).join(' ')}`);
  for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    const t = await open(390, 844, 3, `?seed=${seed}&look=${lk}`), { p } = t;
    ok(t.up && await ready(p), `${lk}: the page is up (seed ${seed})`);
    for (const [n, floors] of [['a', 8], ['b', 13]]) {
      await climb(p, floors - (await st(p)).floor);
      await p.evaluate(() => { const V = window.__hiPlay.view; V.setFriend(3); V.setBest(6); const f = document.querySelector('.hi-ftag'); f.firstChild.firstChild.data = 'LIAM 57 ▲12'; f.style.transform = 'translate3d(0, 300px, 0)'; f.hidden = false; });
      await sleep(700);
      await shot(p, `tape-${lk}-${n}.png`);
      const y = await p.evaluate(() => { const L = window.__hiPlay, tp = L.state().viewTop; return L.view.project((tp.x0 + tp.x1) / 2, 4.5, (tp.z0 + tp.z1) / 2)[1] * innerHeight; });
      if (OUT) await p.screenshot({ path: join(OUT, `tape-${lk}-${n}-close.png`), clip: { x: 45, y: Math.max(0, Math.min(844 - 190, y - 95)), width: 300, height: 190 } });
      if (OUT && n === 'a') await p.screenshot({ path: join(OUT, `tape-${lk}-tag.png`), clip: { x: 230, y: 262, width: 160, height: 48 } });
    }
    ok(t.errs.length === 0, `${lk}: no page error (${t.errs.join(' | ')})`);
    await t.close();
  }
}

// ---- THE WELCOME + THE END (S4A FIX's add-ons — the owner's picks "A · THE SIGN" + "A · THE HERO NUMBER"): the start screen and the
// end screen in both looks at 390 × 844 @3 and 375 × 667 @2 — a first-ever visit + one with a best; a miss under the best, a NEW
// BEST, MADE IT TO THE MOTHERSHIP (the match's finish — gold). `--screens` (SCREENS=start|end · FLY_LOOKS=day)
async function screensLook() {
  const which = process.env.SCREENS || 'start,end';
  for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    for (const [w, h, dpr] of [[390, 844, 3], [375, 667, 2]]) {
      const size = `${w}x${h}`;
      if (which.includes('start')) {
        for (const best of [0, 119]) {
          const t = await open(w, h, dpr, `?seed=welcome&look=${lk}`, best ? `try { localStorage.setItem('hi:play:best', '${best}'); } catch {}` : null);
          ok(t.up && await ready(t.p), `${lk} ${size}: the start screen is up${best ? ' (a best of 119)' : ' (a first visit)'}`);
          await sleep(900);
          await shot(t.p, `start-${lk}-${size}${best ? '-best' : ''}.png`);
          ok(t.errs.length === 0, `${lk} ${size}: no page error (${t.errs.join(' | ')})`);
          await t.close();
        }
      }
      if (which.includes('end')) {
        // a miss at floor 75 under a best of 119 · a NEW BEST (57 → 63)
        for (const [name, best, floors] of [['miss', 119, 75], ['newbest', 57, 63]]) {
          const t = await open(w, h, dpr, `?seed=end1&look=${lk}`, `try { localStorage.setItem('hi:play:best', '${best}'); } catch {}`);
          await ready(t.p);
          await climb(t.p, floors, 'i => (i % 7 === 6 ? 2 : 0)');
          await t.p.evaluate(() => new Promise(res => { const L = window.__hiPlay; (function w8() { if (L.state().st === 'slide') { const pl = document.querySelector('.hi-play'); pl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); res(); } else setTimeout(w8, 4); })(); }));
          await waitFor(t.p, 'window.__hiPlay.state().shown', 9000); await sleep(1300);
          await shot(t.p, `end-${lk}-${size}-${name}.png`);
          ok(t.errs.length === 0, `${lk} ${size} ${name}: no page error (${t.errs.join(' | ')})`);
          await t.close();
        }
        if (w === 390) {
          const m = await open(w, h, dpr, `?seed=fly2&mode=match&look=${lk}`);
          await ready(m.p);
          await climb(m.p, 200);
          await waitFor(m.p, 'window.__hiPlay.state().shown', 9000); await sleep(1300);
          await shot(m.p, `end-${lk}-${size}-made.png`);
          ok(m.errs.length === 0, `${lk} ${size} made: no page error (${m.errs.join(' | ')})`);
          await m.close();
        }
      }
    }
  }
}

// ---- S4B — THE END = JAYWALK'S STANDARD (docs/highrise.md "THE END"): the test page's card at 390 × 844 @3 in BOTH looks, out by EACH
// CAUSE — MISSED THE STACK · SLIPPED OFF · TOO SLOW · TIME'S UP (a real 6:00 match run: every slab dropped on its second pass) — + a NEW
// BEST + the gold MADE IT TO THE MOTHERSHIP. Each: the header's three neons, the cause's colour (hot pink — gold for the finish), the
// floor white, the order, nothing off the screen. `--end` (FLY_LOOKS=day)
async function endLook() {
  const tapNow = pg => pg.evaluate(() => new Promise(res => { const L = window.__hiPlay; (function w8() { if (L.state().st === 'slide') { document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); res(); } else setTimeout(w8, 4); })(); }));
  const CASES = [
    ['miss', '?seed=end1', 119, 'MISSED THE STACK', async pg => { await climb(pg, 75, 'i => (i % 7 === 6 ? 2 : 0)'); await tapNow(pg); }],
    ['thin', '?seed=thin2', 119, 'SLIPPED OFF', async pg => { await pg.evaluate(() => window.__hiPlay.climb(40, () => 3)); }],
    ['slow', '?seed=end3', 119, 'TOO SLOW', async pg => { await climb(pg, 12); }],
    ['cap', '?seed=end4&mode=match', 0, 'TIME’S UP', async pg => { await pg.evaluate(() => window.__hiPlay.climb(190, () => window.__hiPlay.state().S)); }],
    ['newbest', '?seed=end1', 57, 'MISSED THE STACK', async pg => { await climb(pg, 63, 'i => (i % 7 === 6 ? 2 : 0)'); await tapNow(pg); }],
    ['made', '?seed=fly2&mode=match', 0, 'MADE IT TO THE MOTHERSHIP', async pg => { await climb(pg, 200); }],
  ];
  // (REVIEW FIX B: `END_SIZES=390x844,375x667` — the short phone too; the default stays the one size)
  const SIZES = (process.env.END_SIZES || '390x844').split(',').map(z => z.split('x').map(Number));
  for (const [VW, VH] of SIZES) for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    for (const [name, q, best, words, play] of CASES) {
      const t = await open(VW, VH, 3, `${q}&look=${lk}`, best ? `try { localStorage.setItem('hi:play:best', '${best}'); } catch {}` : null);
      await ready(t.p);
      await play(t.p);
      const shown = await waitFor(t.p, 'window.__hiPlay.state().shown', 15000);
      await sleep(1300);
      const e = await t.p.evaluate(() => {
        const q = sel => document.querySelector(sel), bx = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom }; }, col = sel => getComputedStyle(q(sel)).color;
        const parts = ['.hi-ec-hd', '.hi-ec-cause', '.hi-ec-n', '.hi-ec-fl', '.hi-ec-best', '.hi-ec-line'].map(x => bx(q(x)));
        return { hd: q('.hi-ec-hd').textContent, hdCols: [col('.fn-w1'), col('.fn-w2'), col('.fn-m')], words: q('.hi-ec-cause').textContent, cause: col('.hi-ec-cause'), causeH: parts[1].b - parts[1].y, n: col('.hi-ec-n'), floor: q('.hi-ec-n').getAttribute('aria-label'), fl: q('.hi-ec-fl').textContent, best: q('.hi-ec-best').textContent, bestCol: col('.hi-ec-best'), line: q('.hi-ec-line').textContent, parts, bar: bx(q('.hi-again')), check: bx(q('.hi-check')), note: q('.hi-note').textContent, look: q('.hi-stage').dataset.look, strip: !!q('.hi-ec-strip, .hi-ec-col'), tag: !q('.hi-tag').hidden, w: innerWidth, scroll: document.documentElement.scrollWidth };
      });
      const made = name === 'made', inOrder = e.parts.every((b, i) => !i || b.y >= e.parts[i - 1].y), inside = e.parts.every(b => b.x >= 0 && b.r <= e.w) && e.scroll <= e.w;
      ok(shown && e.words === words && e.look === lk && e.hd === `HIGH RISE · ${/mode=match/.test(q) ? 'MATCH' : 'SOLO'}` && e.hdCols.join('|') === 'rgb(255, 79, 216)|rgb(54, 201, 255)|rgb(201, 182, 255)', `${lk} · ${name}: "${e.hd}" (pink · cyan · lavender) over "${e.words}"`);
      ok(e.cause === (made ? 'rgb(255, 200, 60)' : 'rgb(255, 79, 216)') && e.causeH <= 80 && e.n === 'rgb(255, 255, 255)' && e.bestCol === 'rgb(255, 210, 87)' && /^FLOORS?$/.test(e.fl) && /^\d+ PERFECTS? · BEST STREAK \d+$/.test(e.line), `${lk} · ${name}: the cause ${made ? 'GOLD' : 'saturated HOT PINK'} on ≤ 2 lines (${e.causeH.toFixed(0)} px) · ${e.floor} ${e.fl} white · "${e.best}" gold · "${e.line}"`);
      ok(inOrder && inside && !e.strip && !e.tag && e.parts[5].b <= e.check.y - 8 && e.check.b <= e.bar.y + 1 && /NOTHING COUNTS/.test(e.note), `${lk} · ${name}: in order, inside the 390, no strip / tag; the card ends at ${e.parts[5].b.toFixed(0)}, REPLAY = LIVE just over the PLAY AGAIN bar (${e.bar.y.toFixed(0)}), the note under it`);
      if (name === 'newbest') ok(e.best === 'NEW BEST · WAS 57', `${lk}: a floor past YOUR BEST = "${e.best}"`);
      if (name === 'cap') ok(Number(e.floor) > 60 && Number(e.floor) < 200, `${lk}: the 6:00 cap ended a real run on floor ${e.floor} (never the finish)`);
      // REVIEW FIX B — THE DAY END SCREEN: by day the scene shows through as ONE soft still (no filter) — by night none; every stat line
      // still reads ≥ 4.5 : 1 against the brightest of its own ground (the tinted still in its box — the worst of it)
      await waitFor(t.p, "document.querySelector('.hi-stage').classList.contains('has-still') || document.querySelector('.hi-stage').dataset.look === 'night'", 3000);
      await sleep(400);
      const st = await t.p.evaluate(() => { const S = document.querySelector('.hi-stage'), c = document.querySelector('.hi-endbg'); return { still: S.classList.contains('has-still'), op: getComputedStyle(c).opacity, w: c.width, sw: S.clientWidth, filter: [...document.querySelectorAll('.hi-canvas, .hi-endbg, .hi-shade')].map(x => getComputedStyle(x).filter).filter(f => f && f !== 'none') }; });
      if (lk === 'day') ok(st.still && st.op === '1' && st.w === Math.round(st.sw / 2) && !st.filter.length, `${lk} · ${name}: the day scene shows through — ONE soft still ${st.w} px wide (half of ${st.sw}), opacity ${st.op}, no CSS filter`);
      else ok(!st.still && st.op === '0', `${lk} · ${name}: by night no still (today's veil)`);
      const lines = await t.p.evaluate(() => ['.hi-ec-hd .fn-w1', '.hi-ec-hd .fn-w2', '.hi-ec-hd .fn-m', '.hi-ec-cause', '.hi-ec-n', '.hi-ec-fl', '.hi-ec-best', '.hi-ec-line'].map(sel => document.querySelector(sel)).filter(el => el && el.getBoundingClientRect().height > 0).map(el => { const sel = el.className, r = el.getBoundingClientRect(), cs = getComputedStyle(el); return { sel, x: Math.max(0, r.left), y: r.top, w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: r.height, col: cs.color }; }));
      const worst = [];
      // (the GROUND alone: the card's words hidden for the measure — no neighbour's glow counted — each line's own box sampled, then shown again)
      await t.p.evaluate(() => { const st = document.createElement('style'); st.id = 'hi-measure'; st.textContent = '.hi-end, .hi-check, .hi-again, .hi-note, .hi-snd { visibility: hidden !important; }'; document.head.append(st); });
      await sleep(80);
      for (const L of lines) {
        const bands = [await t.p.screenshot({ encoding: 'base64', clip: { x: L.x, y: L.y, width: L.w, height: L.h } })];
        const r = await t.p.evaluate(async (bands, col) => {
          const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const ls = [];
          for (const b64 of bands) { const im = new Image(); im.src = `data:image/png;base64,${b64}`; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 4) ls.push(lum(d[i], d[i + 1], d[i + 2])); }
          ls.sort((a, b) => a - b);
          const bg = ls[Math.floor(ls.length * 0.95)], m = col.match(/\d+/g).map(Number), fg = lum(m[0], m[1], m[2]);
          return (fg + 0.05) / (bg + 0.05);
        }, bands, L.col);
        worst.push(`${L.sel} ${r.toFixed(1)}`);
        if (r < 4.5) worst.push('LOW');
      }
      await t.p.evaluate(() => document.getElementById('hi-measure').remove());
      ok(!worst.includes('LOW'), `${VW}x${VH} ${lk} · ${name}: EVERY line (the header's three words, the cause, the number + the stat lines — THE GO-LIVE) reads ≥ 4.5 : 1 on its own ground (the brightest 5 % of the tinted scene in its box, the words hidden) — ${worst.join(' · ')}`);
      await shot(t.p, `page-${lk}-${VW}x${VH}-${name}.png`);
      ok(t.errs.length === 0, `${lk} · ${name}: no page error (${t.errs.join(' | ')})`);
      await t.close();
    }
  }
}

// ---- NO PINK FLASH AT A RUN's END (S4A FIX — the owner's iPhone; the cartridge's own watch is in e2e-highrise.mjs: there the console's
// podium frame flashed the accent over the whole screen): every frame the browser presents from the run's last moment to the settled
// end screen, then through PLAY AGAIN into the next start — both looks, each way a tower ends (a miss · too thin · the fuse). No frame
// may be far pinker than the screen was before AND is once settled (kit/flash-watch.mjs). `--flash`
async function flashLook() {
  for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    for (const cause of ['miss', 'thin', 'slow']) {
      const t = await open(390, 844, 1, `?seed=flash-${cause}&look=${lk}`), { p } = t;
      await ready(p);
      const w = await flashWatch(b, t.cdp);
      if (cause === 'thin') await p.evaluate(() => window.__hiPlay.climb(40, () => 3));   // (every drop a cut: the slab thins until it slips off)
      else {
        await climb(p, 12);
        if (cause === 'miss') await p.evaluate(() => new Promise(res => { const L = window.__hiPlay; (function w8() { if (L.state().st === 'slide') { document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })); res(); } else setTimeout(w8, 4); })(); }));
      }
      const ended = await waitFor(p, 'window.__hiPlay.state().shown', 12000);
      await sleep(3600);
      const r = await w.stop({ lead: 500, settle: 500 }), said = await p.evaluate(() => window.__hiPlay.state().words);
      ok(ended && r.frames >= 20 && r.flash.length === 0, `${lk}, ${said}: NO PINK FLASH as the end screen comes up — ${r.frames} frames over ${r.ms} ms, the pinkest ${r.worst ? `${(r.worst.pink * 100).toFixed(0)} % of the screen at ${r.worst.t} ms` : '—'} (before ${(r.before * 100).toFixed(0)} %, settled ${(r.after * 100).toFixed(0)} %)${r.flash.length ? ` — FLASH: ${r.flash.slice(0, 4).map(f => `${(f.pink * 100).toFixed(0)} % at ${f.t} ms`).join(' · ')}` : ''}`);
      const w2 = await flashWatch(b, t.cdp);
      await tapAt(t, 195, 500);   // PLAY AGAIN (a tap anywhere) → the next run starts
      await sleep(1300);
      const r2 = await w2.stop({ lead: 60, settle: 300 });
      ok(r2.frames >= 8 && r2.flash.length === 0 && await p.evaluate(() => window.__hiPlay.state().started), `${lk}, ${said}: … and none at PLAY AGAIN, into the next start (${r2.frames} frames; the pinkest ${r2.worst ? `${(r2.worst.pink * 100).toFixed(0)} %` : '—'}, before ${(r2.before * 100).toFixed(0)} %, settled ${(r2.after * 100).toFixed(0)} %)`);
      ok(t.errs.length === 0, `${lk}, ${cause}: no page error (${t.errs.join(' | ')})`);
      await t.close();
    }
  }
}

// ---- THE ICON (S4A FIX — the owner's pick "A · THE TOWER", js/core/marks.js `highrise`): the mark through the app's ONE builder
// (ui/mark-svg.js — the PLAY shelf's row + the room's PICK A GAME: 40 px, stroke 7) at its real size and twice + four times it, beside
// JAYWALK's, and in the PLAY sheet's preview tile (72 % of a dark tile). `--icon`
async function iconLook() {
  const t = await open(390, 844, 3, '?look=night'), { p } = t;
  await p.evaluate(async () => {
    const { markSvg } = await import('/js/ui/mark-svg.js');
    const box = document.createElement('div');
    box.id = 'icon-look';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0818;display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:26px;align-content:start;font:600 12px/1.2 sans-serif;color:#9d94c8';
    const cell = (id, px, label, tile) => `<div style="display:grid;justify-items:center;gap:6px"><div style="display:grid;place-items:center;width:${tile || px + 10}px;height:${tile || px + 10}px;${tile ? 'background:#0d0a1c;' : ''}filter:drop-shadow(0 0 5px ${id === 'highrise' ? 'rgba(53,227,255,.6)' : 'rgba(255,98,200,.6)'})">${markSvg({ id }).replace('<svg ', `<svg style="width:${px}px;height:${px}px" `)}</div><span>${label}</span></div>`;
    box.innerHTML = [['highrise', 40, 'HIGH RISE · the shelf row (40 px)'], ['jaywalk', 40, 'JAYWALK · the shelf row'], ['highrise', 24, '24 px'], ['jaywalk', 24, '24 px'], ['highrise', 80, '80 px'], ['jaywalk', 80, '80 px'], ['highrise', 115, 'the preview tile (72 %)', 160], ['jaywalk', 115, 'the preview tile', 160]].map(c => cell(...c)).join('');
    document.body.append(box);
  });
  await sleep(300);
  await shot(p, 'icon-390x844.png');
  // (does a stroke leave its 0 … 100 box? the mark's own drawn bounds, stroke and all)
  const bb = await p.evaluate(() => [...document.querySelectorAll('#icon-look svg')].slice(0, 1).map(sv => { const r = sv.getBoundingClientRect(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const pa of sv.querySelectorAll('path')) { const b = pa.getBBox(); x0 = Math.min(x0, b.x - 2.25); y0 = Math.min(y0, b.y - 2.25); x1 = Math.max(x1, b.x + b.width + 2.25); y1 = Math.max(y1, b.y + b.height + 2.25); } return { x0, y0, x1, y1, px: r.width }; })[0]);
  ok(bb.x0 >= 0 && bb.y0 >= 0 && bb.x1 <= 100 && bb.y1 <= 100, `THE TOWER's strokes stay inside the mark's 0 … 100 box, stroke and all (${bb.x0.toFixed(1)} · ${bb.y0.toFixed(1)} … ${bb.x1.toFixed(1)} · ${bb.y1.toFixed(1)})`);
  ok(t.errs.length === 0, `no page error (${t.errs.join(' | ')})`);
  await t.close();
}

// ---- THE UFO's LIGHTS (S4A FIX — the owner: its amber rim lamps on the FAR side showed THROUGH the hull): the UFO at four moments of
// its drift in both looks at 390 × 844 @3 — the whole screen + the saucer itself, close (its own box, a margin round it). `--ufo`
async function ufoLook() {
  for (const lk of (process.env.FLY_LOOKS || 'night,day').split(',')) {
    const t = await open(390, 844, 3, `?seed=fly1&look=${lk}`), { p } = t;
    ok(t.up && await ready(p), `${lk}: the page is up`);
    await alive(p, true);
    await climb(p, 86, 'i => (i % 11 === 10 ? 3 : 0)');
    ok(await p.evaluate(() => window.__hiPlay.fly('ufo', 1)) === true, `${lk}: the UFO flies`);
    let wait = 1500;
    for (const n of [1, 2, 3, 4]) {
      await sleep(wait); wait = 1300;
      const box = await p.evaluate(() => window.__hiPlay.flyInfo().boxes.ufo);
      await shot(p, `ufo-${lk}-${n}.png`);
      if (box && OUT) { const m = 0.05, x = Math.max(0, (box[0] - m) * 390), y = Math.max(0, (box[1] - m) * 844), w = Math.min(390 - x, (box[2] - box[0] + 2 * m) * 390), h = Math.min(844 - y, (box[3] - box[1] + 2 * m) * 844); if (w > 8 && h > 8) await p.screenshot({ path: join(OUT, `ufo-${lk}-${n}-close.png`), clip: { x, y, width: w, height: h } }); }
    }
    await alive(p, false);
    ok(t.errs.length === 0, `${lk}: no page error (${t.errs.join(' | ')})`);
    await t.close();
  }
}

// ---- S3: THE LOOKS · THE LOOK SWITCH · THE FLYERS · DEEP SPACE · THE FINISH (docs/highrise.md; docs/games/passes/highrise-s3.md)
/** the first seed of a family whose plan picks `kind` ('blackbird' | 'f22') — the page plays the SAME plan (flyplan.js is pure) */
const seedFor = kind => { for (let i = 0; ; i++) { const sd = `s3${kind}${i}`; if (flyPlan(sd).jet === kind) return sd; } };
/** THE CANVAS's OWN PIXELS (a small copy, read inside a frame, right after the page drew): the rows from `from` to `to` (0 … 1 from the
 *  top) — the first call keeps them as the reference (`key`), a later one says how far the picture is from it */
const grabDiff = (p, key, from, to) => p.evaluate((k, f, t2) => new Promise(res => requestAnimationFrame(() => {
  const c = document.querySelector('canvas.hi-canvas'), w = 195, h = 422, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, w, h);
  const y0 = Math.ceil(f * h), y1 = Math.floor(t2 * h), d = x.getImageData(0, y0, w, Math.max(1, y1 - y0)).data;
  window.__grab = window.__grab || {};
  if (!window.__grab[k]) { window.__grab[k] = d; return res({ ref: true, n: d.length / 4 }); }
  const r = window.__grab[k]; let changed = 0, max = 0;
  for (let i = 0; i < d.length; i += 4) { const m = Math.max(Math.abs(d[i] - r[i]), Math.abs(d[i + 1] - r[i + 1]), Math.abs(d[i + 2] - r[i + 2])); if (m > 10) changed++; if (m > max) max = m; }
  res({ ref: false, n: d.length / 4, changed, max });
})), key, from, to);
/** the band a flyer keeps to, on the screen (0 … 1 from the top): the HUD's foot … THE DROP ZONE's upper edge */
const bandOf = p => p.evaluate(() => { const hud = document.querySelector('.hi-hud'), st2 = document.querySelector('.hi-stage'); return { top: (hud.offsetTop + hud.offsetHeight) / st2.clientHeight, zone: window.__hiPlay.view.zoneTop() }; });
const flyInfo = p => p.evaluate(() => window.__hiPlay.flyInfo());
/** WCAG's contrast of two sRGB colours */
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const contrast = (a, b2) => { const x = lum(a), y = lum(b2); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** HOW THE WORDS READ, measured on the real pixels: a 3× capture of the element → its letters (the pixels in its own colour) against what
 *  is RIGHT ROUND them (the halo over the sky) → WCAG's contrast */
async function wordsRead(p, sel) {
  const r = await p.evaluate(q => { const b2 = document.querySelector(q).getBoundingClientRect(); return { x: Math.max(0, b2.left - 5), y: Math.max(0, b2.top - 5), width: b2.width + 10, height: b2.height + 10 }; }, sel);
  const b64 = await p.screenshot({ clip: r, encoding: 'base64' });
  const m = await p.evaluate(async (data, q) => {
    const im = new Image(); im.src = `data:image/png;base64,${data}`; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, col = getComputedStyle(document.querySelector(q)).color.match(/\d+/g).slice(0, 3).map(Number), w = c.width, h = c.height, isT = new Uint8Array(w * h);
    let nT = 0;
    for (let i = 0; i < w * h; i++) { const dr = d[i * 4] - col[0], dg = d[i * 4 + 1] - col[1], db = d[i * 4 + 2] - col[2]; if (dr * dr + dg * dg + db * db < 45 * 45) { isT[i] = 1; nT++; } }
    const a = [0, 0, 0]; let n = 0;
    for (let y = 0; y < h; y += 2) for (let xx = 0; xx < w; xx += 2) {
      const i = y * w + xx; if (isT[i]) continue;
      let near = false; for (const [dx, dy] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) { const X = xx + dx, Y = y + dy; if (X >= 0 && X < w && Y >= 0 && Y < h && isT[Y * w + X]) { near = true; break; } }
      if (near) { a[0] += d[i * 4]; a[1] += d[i * 4 + 1]; a[2] += d[i * 4 + 2]; n++; }
    }
    return { col, nT, n, round: n ? a.map(v => Math.round(v / n)) : null, text: document.querySelector(q).textContent };
  }, b64, sel);
  return { ...m, k: m.round ? contrast(m.col, m.round) : 0 };
}
/** the mean colour BEHIND an element (its box on the canvas — the WebGL picture, not the words) */
const behind = (p, sel) => p.evaluate(q => new Promise(res => requestAnimationFrame(() => {
  const el = document.querySelector(q), r = el.getBoundingClientRect(), c = document.querySelector('canvas.hi-canvas'), cr = c.getBoundingClientRect(), cv = document.createElement('canvas'); cv.width = 195; cv.height = Math.round(195 * cr.height / cr.width);
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, cv.width, cv.height);
  const k = cv.width / cr.width, d = x.getImageData(Math.max(0, Math.floor((r.left - cr.left) * k)), Math.max(0, Math.floor((r.top - cr.top) * k)), Math.max(1, Math.ceil(r.width * k)), Math.max(1, Math.ceil(r.height * k))).data;
  let a = [0, 0, 0], hi = 0, lo = 255; for (let i = 0; i < d.length; i += 4) { a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; if (L > hi) hi = L; if (L < lo) lo = L; }
  const n = d.length / 4, col = getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);
  res({ bg: a.map(v => Math.round(v / n)), hi: Math.round(hi), lo: Math.round(lo), col, text: el.textContent });
})), sel);

async function s3() {
  const BB = seedFor('blackbird'), F22 = seedFor('f22');
  console.log(`  (S3 seeds: ${BB} → ${JSON.stringify(flyPlan(BB))} · ${F22} → ${JSON.stringify(flyPlan(F22))})`);
  ok(flyPlan(BB).jet === 'blackbird' && flyPlan(F22).jet === 'f22', 'the plan (flyplan.js — pure): one seed picks THE BLACKBIRD, another the F-22 pair');

  // ---- THE START SCREEN's THREE CHOICES: AUTO · DAY · NIGHT — real taps, remembered on this phone; AUTO = the site's own sun rule
  {
    const t = await open(390, 844, 3, '?auto=1&seed=look');
    const { p } = t;
    ok(t.up && await ready(p), 'the page opens with this phone\'s own choice of look (none stored: AUTO)');
    ok(await waitFor(p, 'window.__hiPlay.look().sunKnown', 6000), 'AUTO asks the sun rule');
    await sleep(300);
    const a = await p.evaluate(async () => {
      const K = await import('/js/games/kit/look.js'), up = await K.sunUpNow(Date.now()), L = window.__hiPlay, tabs = [...document.querySelectorAll('.hi-look-b')].map(b2 => { const r = b2.getBoundingClientRect(); return { text: b2.textContent, on: b2.classList.contains('is-on'), w: r.width, h: r.height, y: r.top, b: r.bottom, radius: parseFloat(getComputedStyle(b2).borderRadius) || 0 }; });
      const V = L.view, top = V.project(-5000, 0, -5000)[1] * innerHeight;
      return { sun: K.resolveLook('auto', up), look: L.look(), tabs, top, stage: document.querySelector('.hi-stage').dataset.look, info: L.state().info.look, started: L.state().started, stored: localStorage.getItem('hi:play:look') };
    });
    ok(a.look.choice === 'auto' && a.look.look === a.sun && a.info === a.sun && a.stage === a.sun && a.stored === null, `AUTO = the real sun, by the site's own sun rule (now: ${a.sun}) — the tower, the plates and the page's words follow`);
    ok(a.tabs.map(x => x.text).join(' ') === 'AUTO DAY NIGHT' && a.tabs.every(x => x.h >= 44 && x.w >= 44 && x.radius < 10) && a.tabs[0].on && !a.tabs[1].on && a.tabs.every(x => x.b < a.top - 20), `the three choices under the sign: AUTO · DAY · NIGHT, each ≥ 44 pt, no pill, AUTO lit; clear above the tower's top (${a.tabs[0].b.toFixed(0)} < ${a.top.toFixed(0)})`);
    t.reqs.some(q => /\/js\/core\/sky\.js/.test(q)) ? ok(true, '(the sun rule = core/sky.js, fetched for AUTO)') : ok(false, 'core/sky.js was never fetched');
    const tapTab = async i => { const c = await p.evaluate(k => { const r = document.querySelectorAll('.hi-look-b')[k].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, i); await tapAt(t, c[0], c[1]); await sleep(150); };
    const other = a.sun === 'day' ? 2 : 1, otherName = other === 1 ? 'day' : 'night';
    await tapTab(other);
    const b1 = await p.evaluate(() => ({ L: window.__hiPlay.look(), started: window.__hiPlay.state().started, stored: localStorage.getItem('hi:play:look'), on: [...document.querySelectorAll('.hi-look-b')].map(x => x.classList.contains('is-on')) }));
    ok(b1.L.choice === otherName && b1.stored === otherName && !b1.started && b1.on[other] && !b1.on[0], `a real tap on ${otherName.toUpperCase()}: the choice is made + remembered (hi:play:look = ${b1.stored}) — and it is NOT the START tap`);
    await sleep(700); await shot(p, `s3-390-switch-mid-${otherName}.png`);
    ok(await waitFor(p, `window.__hiPlay.state().info.dayK === ${other === 1 ? 1 : 0} && !window.__hiPlay.state().info.fading`, 9000), `the picture cross-fades to ${otherName}`);
    await sleep(200);   // (the old look's pictures go in the frame after the fade settles)
    const b2 = await p.evaluate(() => ({ i: window.__hiPlay.state().info, stage: document.querySelector('.hi-stage').dataset.look }));
    ok(b2.i.look === otherName && b2.stage === otherName && b2.i.heldAll[otherName === 'day' ? 'night' : 'day'].length === 0 && b2.i.envs.join() === otherName && b2.i.switches === 1, `settled: only the ${otherName} look keeps its plates (${JSON.stringify(b2.i.heldAll)}) + its reflection map (${b2.i.envs})`);
    await shot(p, `s3-390-start-${otherName}.png`);
    // a reload: the choice is remembered — the page opens in it at once (no fade)
    await p.goto(guardUrl(`${BASE}/highrise-play?seed=look`, 'highrise-play'), { waitUntil: 'load' });
    await waitFor(p, '!!window.__hiPlay', 8000); await ready(p);
    const c1 = await p.evaluate(() => ({ L: window.__hiPlay.look(), i: window.__hiPlay.state().info, on: [...document.querySelectorAll('.hi-look-b')].map(x => x.classList.contains('is-on')) }));
    ok(c1.L.choice === otherName && c1.i.look === otherName && c1.i.dayK === (otherName === 'day' ? 1 : 0) && c1.i.switches === 0 && c1.on[other], `a reload: this phone remembers ${otherName.toUpperCase()} — the page opens in it at once`);
    await tapTab(0); await sleep(300);
    ok((await p.evaluate(() => localStorage.getItem('hi:play:look'))) === 'auto', 'a tap on AUTO: back to the real sun');
    ok(t.errs.length === 0 && t.reqs.every(r => allowed(r.slice(r.indexOf(' ') + 1))), `no page error, no stray request (${t.errs.join(' | ')}${t.reqs.filter(r => !allowed(r.slice(r.indexOf(' ') + 1))).join(' , ')})`);
    await t.close();
  }

  // ---- A LOOK SWITCH MID-RUN: the other look's pictures come in off the frame, a 1.5 s cross-fade — no hitch, no new program
  {
    const t = await open(390, 844, 3, '?seed=switch&look=night&fps=1');
    const { p } = t;
    await ready(p);
    await climb(p, 14, 'i => (i % 5 === 4 ? 3 : 0)'); await alive(p, true); await sleep(1300);
    const s0 = await st(p), n0 = t.reqs.length;
    ok(s0.info.look === 'night' && s0.info.heldAll.day.length === 0 && !t.reqs.some(q => /plates\/day-|env-day/.test(q)), 'a night run holds ONLY the night look\'s pictures (no day file was even asked for)');
    const t0 = Date.now();
    await p.evaluate(() => window.__hiPlay.setLook('day'));
    ok(await waitFor(p, 'window.__hiPlay.state().info.fading', 4000), 'the day look\'s pictures are in → the cross-fade begins');
    const tf = Date.now(), mid = await st(p);
    ok(mid.info.plates.length >= 1 && mid.info.envs.includes('day') && mid.info.heldAll.night.length >= 1, `… BOTH looks' pictures are held through the fade (day: ${mid.info.heldAll.day} · night: ${mid.info.heldAll.night}; reflection maps: ${mid.info.envs})`);
    // (no screenshot here: a 3× capture stalls the page ~0.3 s — it would be this check's own hitch; the start screen's switch is shot above)
    ok(await waitFor(p, 'window.__hiPlay.state().info.dayK === 1 && !window.__hiPlay.state().info.fading', 4000), 'the fade ends by day');
    const fadeMs = Date.now() - tf; await sleep(200);   // (the old look's pictures go in the frame after the fade settles)
    const s1 = await st(p), h1 = await p.evaluate(() => window.__hiPlay.hitches());
    ok(fadeMs > 1100 && fadeMs < 2300, `the cross-fade takes ≈ 1.5 s (${fadeMs} ms; the pictures took ${tf - t0} ms to come in first)`);
    ok(s1.info.programs === s0.info.programs && s1.info.heldAll.night.length === 0 && s1.info.envs.join() === 'day' && !s1.over && sameTop(s1), `NO new program (${s0.info.programs} → ${s1.info.programs}); settled, the night look's pictures are gone; the run never stopped (floor ${s0.floor} → ${s1.floor})`);
    ok(h1.n === 0, `NO HITCH through the switch (HITCH ${h1.n}${h1.last ? ` — ${h1.last}` : ''})`);
    const day = await p.evaluate(() => ({ stage: document.querySelector('.hi-stage').dataset.look, sky: document.querySelector('.hi-stage').dataset.sky, num: getComputedStyle(document.querySelector('.hi-num')).color, bloom: window.__hiPlay.state().info.calls }));
    ok(day.stage === 'day' && day.sky === 'bright' && day.num === 'rgb(13, 23, 64)' && day.bloom <= 6, `the page's words follow: dark navy under a sunlit sky; no bloom by day (${day.bloom} draw calls a frame)`);
    ok(t.reqs.slice(n0).some(q => /plates\/day-1\.webp/.test(q)) && t.reqs.slice(n0).some(q => /env-day\.png/.test(q)), 'the day pictures were fetched AT the switch');
    await p.evaluate(() => window.__hiPlay.setLook('night'));
    ok(await waitFor(p, 'window.__hiPlay.state().info.dayK === 0 && !window.__hiPlay.state().info.fading', 6000), '… and back to night');
    await sleep(200);
    const s2 = await st(p), h2 = await p.evaluate(() => window.__hiPlay.hitches());
    ok(s2.info.heldAll.day.length === 0 && s2.info.programs === s0.info.programs && h2.n === 0 && s2.info.bloom, `night again: the day's pictures gone, the bloom back, still no new program, HITCH ${h2.n}`);
    await alive(p, false);
    ok(t.errs.length === 0, `no page error (${t.errs.join(' | ')})`);
    await t.close();
  }

  for (const lk of ['night', 'day']) {
    // ---- THE FLYERS, each AT ITS FLOOR — the seed's BLACKBIRD, the UFO at 85, THE MOTHERSHIP from ~180, the solo moment at 200, deep space
    const plan = flyPlan(BB);
    const t = await open(390, 844, 3, `?seed=${BB}&look=${lk}&fps=1`);
    const { p } = t;
    ok(t.up && await ready(p), `${lk}: the page is up`);
    const i0 = (await st(p)).info;
    ok(i0.look === lk && i0.heldAll[lk === 'day' ? 'night' : 'day'].length === 0 && t.reqs.some(q => new RegExp(`plates/${lk}-1\\.webp`).test(q)) && !t.reqs.some(q => new RegExp(`plates/${lk === 'day' ? 'night' : 'day'}-`).test(q)), `${lk}: only the ${lk} look's plates + reflection map are asked for`);
    ok(t.reqs.some(q => /flyers\.js/.test(q)) && ['blackbird.glb', 'f22.glb', 'ufo.glb'].every(f => t.reqs.some(q => q.includes(f))), `${lk}: S4B — PRE-WARM: the flyers' module + every model are fetched BEHIND THE WELCOME SCREEN (it was: nothing before floor ${FLY_FLOORS.loadJet})`);
    // NOTHING INSIDE THE PLAY ZONE — the canvas's own pixels: before a run the tower stands still, so the rows from THE DROP ZONE's upper
    // edge down must be THE SAME with a flyer in the sky as without one
    const bd = await bandOf(p);
    await p.evaluate(() => window.__hiPlay.view.welcome(false)); await sleep(700);   // (THE WELCOME's own slab breathes in the play zone: put away for this pixel check)
    await grabDiff(p, 'zone', bd.zone, 1); await grabDiff(p, 'sky', bd.top, bd.zone);
    const still = await grabDiff(p, 'zone', bd.zone, 1);
    ok(still.changed === 0, `${lk}: (the play zone's pixels hold still before a run: ${still.changed} of ${still.n} changed)`);
    for (const kind of ['ufo', 'blackbird', 'f22']) {
      ok(await p.evaluate(k => window.__hiPlay.fly(k, 1), kind) === true, `${lk}: ${kind} takes off (before a run — the pixel check)`);
      let worst = 0, seenSky = 0, boxOk = true, boxWorst = '';
      const until = Date.now() + (kind === 'ufo' ? 7600 : 3200);
      while (Date.now() < until) {
        const z = await grabDiff(p, 'zone', bd.zone, 1), sk = await grabDiff(p, 'sky', bd.top, bd.zone), fi = await flyInfo(p), bx = kind === 'ufo' ? fi.boxes.ufo : fi.boxes.jet;
        worst = Math.max(worst, z.changed); seenSky = Math.max(seenSky, sk.changed);
        if (bx && bx[2] > 0.02 && bx[0] < 0.98 && (bx[1] < bd.top - 0.012 || bx[3] > bd.zone + 0.004)) { boxOk = false; boxWorst = bx.map(v => v.toFixed(3)).join(' '); }
        await sleep(90);
      }
      ok(worst === 0, `${lk}: ${kind} — NOTHING INSIDE THE PLAY ZONE: its pixels are the same with the flyer up as without (worst frame: ${worst} of ${still.n} changed)`);
      ok(seenSky > 180, `${lk}: ${kind} — it is SEEN in its band of sky (${seenSky} of the band's ${Math.round((bd.zone - bd.top) * 422) * 195} sample pixels changed at its fullest)`);
      ok(boxOk, `${lk}: ${kind} — its box keeps to the band: under the HUD's foot (${bd.top.toFixed(3)}), above THE DROP ZONE (${bd.zone.toFixed(3)})${boxOk ? '' : ` — OUT: ${boxWorst}`}`);
      await waitFor(p, "(() => { const f = window.__hiPlay.flyInfo(); return !f.jet && !f.ufo; })()", 9000);
    }
    const freed = await flyInfo(p);
    ok(freed.models.length === 4, `${lk}: S4B — a flyer's model STAYS after its moment (the next run uploads nothing): ${freed.models.join(', ')}`);
    // THE RUN: the seed's flyby AT ITS FLOOR
    await climb(p, plan.jetAt - 2); await alive(p, true);
    ok(await waitFor(p, "(() => { const f = window.__hiPlay.flyInfo(); return (f.asked || []).includes('blackbird') || (f.models || []).includes('blackbird'); })()", 4000), `${lk}: THE BLACKBIRD's model is asked for from floor ${FLY_FLOORS.loadJet} — ${plan.jetAt - FLY_FLOORS.loadJet} floors before it flies`);
    ok(await waitFor(p, "window.__hiPlay.flyInfo().jet === 'blackbird'", 6000), `${lk}: THE SKYLINE FLYBY — this seed's flyer is THE BLACKBIRD`);
    const fj = await st(p), fi = await flyInfo(p);
    ok(fj.floor >= plan.jetAt && fj.floor <= plan.jetAt + 2 && fi.jetDir === plan.jetDir, `${lk}: … at ITS floor (planned ${plan.jetAt}, the tower on ${fj.floor}), from its side (${plan.jetDir > 0 ? 'the left' : 'the right'})`);
    await sleep(1500); await shot(p, `s3-390-${lk}-blackbird.png`);
    const bj = (await flyInfo(p)).boxes.jet, bd2 = await bandOf(p);
    ok(!!bj && bj[1] >= bd2.top - 0.012 && bj[3] <= bd2.zone + 0.004 && bj[2] - bj[0] > 0.3, `${lk}: mid-pass it is BIG (${bj ? ((bj[2] - bj[0]) * 100).toFixed(0) : '?'} % of the screen's width) and in its band (${bj ? bj[1].toFixed(3) : '?'} … ${bj ? bj[3].toFixed(3) : '?'} between ${bd2.top.toFixed(3)} and ${bd2.zone.toFixed(3)})`);
    ok((await flyInfo(p)).played.includes('jet-scream'), `${lk}: the city's jet sound is asked for`);
    await waitFor(p, "!window.__hiPlay.flyInfo().jet", 5000);
    // THE UFO at 85
    await alive(p, false); await climb(p, plan.ufoAt - 2 - (await st(p)).floor, 'i => (i % 11 === 10 ? 3 : 0)'); await alive(p, true);
    ok(await waitFor(p, 'window.__hiPlay.flyInfo().ufo', 7000), `${lk}: THE UFO comes at floor ${plan.ufoAt}`);
    await sleep(3300); await shot(p, `s3-390-${lk}-ufo.png`);
    const bu = (await flyInfo(p)).boxes.ufo, bd3 = await bandOf(p);
    ok(!!bu && bu[1] >= bd3.top - 0.012 && bu[3] <= bd3.zone + 0.004 && bu[2] - bu[0] > 0.25 && (await flyInfo(p)).played.includes('ufo-hum'), `${lk}: the UFO drifts in its band (${bu ? bu[1].toFixed(3) : '?'} … ${bu ? bu[3].toFixed(3) : '?'}), ${bu ? ((bu[2] - bu[0]) * 100).toFixed(0) : '?'} % wide; its hum is asked for`);
    await waitFor(p, '!window.__hiPlay.flyInfo().ufo', 9000);
    // THE MOTHERSHIP: seen from ~180, colossal at 200; SOLO: the moment, then on into DEEP SPACE
    await alive(p, false); await climb(p, 176 - (await st(p)).floor, 'i => (i % 11 === 10 ? 3 : 0)'); await sleep(700);
    const k176 = (await flyInfo(p)).ship;
    await climb(p, 190 - (await st(p)).floor); await alive(p, true); await sleep(1200);
    const k190 = (await flyInfo(p)).ship; await shot(p, `s3-390-${lk}-ship-190.png`);
    ok(!k176.vis && k190.vis && k190.k > 0.2 && k190.k < 0.95, `${lk}: THE MOTHERSHIP is not there at 176, coming down at 190 (${(k190.k * 100).toFixed(0)} % of the way)`);
    await alive(p, false); await climb(p, Math.max(0, 199 - (await st(p)).floor)); await sleep(900);
    const k199 = await flyInfo(p); await shot(p, `s3-390-${lk}-ship-199.png`);
    ok(k199.ship.k > 0.97 && !!k199.boxes.ship && k199.boxes.ship[2] - k199.boxes.ship[0] > 2 && k199.boxes.ship[3] < (await bandOf(p)).zone, `${lk}: at 199 it is COLOSSAL — ${k199.boxes.ship ? (k199.boxes.ship[2] - k199.boxes.ship[0]).toFixed(1) : '?'} screens wide, overhead (its lowest point ${k199.boxes.ship ? k199.boxes.ship[3].toFixed(2) : '?'} — above THE DROP ZONE)`);
    await alive(p, true);
    ok(await waitFor(p, 'window.__hiPlay.flyInfo().ship.pass', 5000), `${lk}: FLOOR 200, SOLO — the moment begins`);
    await sleep(700);
    const pm = await p.evaluate(() => ({ call: document.querySelector('.hi-call').textContent, arr: window.__hiPlay.sfx.wanted().filter(q => q.id === 'band-arrival').length, over: window.__hiPlay.state().over, played: window.__hiPlay.flyInfo().played }));
    ok(pm.call === 'THE MOTHERSHIP' && pm.arr >= 1 && !pm.over && pm.played.includes('ufo-hum@ship'), `${lk}: "THE MOTHERSHIP" in the announcer lane + the band-arrival sound; the run goes on`);
    await sleep(600); await shot(p, `s3-390-${lk}-ship-pass.png`);
    ok(await waitFor(p, 'window.__hiPlay.flyInfo().ship.done', 8000), `${lk}: … then it leaves`);
    const gone = await flyInfo(p);
    ok(!gone.ship.vis && gone.models.includes('mothership'), `${lk}: THE MOTHERSHIP is removed from the sky (its hull stays ready — S4B)`);
    await alive(p, false); await climb(p, 216 - (await st(p)).floor); await alive(p, true); await sleep(1400);
    const deep = await st(p); await shot(p, `s3-390-${lk}-deep.png`);
    ok(deep.info.space === 1 && deep.floor >= 216 && !deep.over, `${lk}: past 200 the climb goes on into DEEP SPACE (the stars + the aurora full at floor 212; the tower on ${deep.floor})`);
    const hh = await p.evaluate(() => window.__hiPlay.hitches());
    console.log(`   ${lk}: hitches through the flyers' run: ${hh.n} ${hh.last}`);
    await alive(p, false);
    ok(t.errs.length === 0 && t.reqs.every(r => allowed(r.slice(r.indexOf(' ') + 1))) && !t.reqs.some(q => /\/api\//.test(q)) && t.sockets.length === 0, `${lk}: no page error; NO request beyond the page's own static files + three.js (${t.reqs.length} requests${t.errs.length ? ` — ${t.errs.join(' | ')}` : ''}${t.reqs.filter(r => !allowed(r.slice(r.indexOf(' ') + 1))).join(' , ')})`);
    ok(await waitFor(p, 'window.__hiPlay.state().shown', 15000) && (await p.evaluate(() => window.__hiPlay.ends.slice(-1)[0].same)), `${lk}: after the flyers' run — REPLAY = LIVE ✓`);
    await t.close();

    // the OTHER seed: the F-22 pair, at its floor
    {
      const pl = flyPlan(F22), d = await open(390, 844, 3, `?seed=${F22}&look=${lk}`);
      await ready(d.p);
      await climb(d.p, pl.jetAt - 2); await alive(d.p, true);
      ok(await waitFor(d.p, "window.__hiPlay.flyInfo().jet === 'f22'", 7000), `${lk}: another seed → the F-22 PAIR (the jets' choice follows the seed)`);
      const f = await st(d.p);
      await sleep(1450); await shot(d.p, `s3-390-${lk}-f22.png`);
      const bx = (await flyInfo(d.p)).boxes.jet, bd4 = await bandOf(d.p), pl2 = (await flyInfo(d.p)).played;
      ok(f.floor >= pl.jetAt && f.floor <= pl.jetAt + 2 && !!bx && bx[1] >= bd4.top - 0.012 && bx[3] <= bd4.zone + 0.004 && pl2.includes('jets-formation'), `${lk}: … at its floor (planned ${pl.jetAt}, on ${f.floor}); BOTH jets in the band (${bx ? bx[1].toFixed(3) : '?'} … ${bx ? bx[3].toFixed(3) : '?'} between ${bd4.top.toFixed(3)} and ${bd4.zone.toFixed(3)}); the city's formation sound`);
      ok(d.reqs.some(q => /assets\/highrise\/models\/f22\.glb/.test(q)) && d.reqs.some(q => /blackbird\.glb/.test(q)), `${lk}: its model was fetched — and, since S4B's PRE-WARM, the other jet's too (the next run's seed may pick it; a cartridge's seed is not known before GO)`);
      await alive(d.p, false);
      ok(d.errs.length === 0, `${lk}: no page error (${d.errs.join(' | ')})`);
      await d.close();
    }

    // ---- THE MATCH's FINISH (?mode=match — nothing counts): the white-gold light, then the gold end card
    {
      const d = await open(390, 844, 3, `?seed=finish&mode=match&look=${lk}`);
      await ready(d.p);
      await climb(d.p, 199); await sleep(1000);
      await d.p.evaluate(() => window.__hiPlay.climb(1));
      const tEnd = Date.now();
      ok(await waitFor(d.p, 'window.__hiPlay.flyInfo().ship.pour', 3000), `${lk} match: FLOOR 200 — THE FINISH: the light pours`);
      await sleep(1300); await shot(d.p, `s3-390-${lk}-finish-pour.png`);
      const pr = await d.p.evaluate(() => ({ shown: window.__hiPlay.state().shown, st: window.__hiPlay.state().st, lights: window.__hiPlay.state().info.lights }));
      ok(!pr.shown && pr.st === 'made' && pr.lights > 50, `${lk} match: the run is MADE; the light is seen first (${pr.lights} lights on screen, the card not yet up)`);
      ok(await waitFor(d.p, 'window.__hiPlay.state().shown', 6000), `${lk} match: the end card comes`);
      const held = Date.now() - tEnd;
      await sleep(400); await shot(d.p, `s3-390-${lk}-finish-card.png`);
      const fc = await d.p.evaluate(() => { const q = sel => document.querySelector(sel), cs = sel => getComputedStyle(q(sel)).color; return { words: q('.hi-ec-cause').textContent, made: q('.hi-stage').classList.contains('is-made'), n: q('.hi-ec-n').getAttribute('aria-label'), hd: q('.hi-ec-hd').textContent, line: q('.hi-ec-line').textContent, best: q('.hi-ec-best').textContent, check: q('.hi-check').textContent, cT: cs('.hi-ec-cause'), cN: cs('.hi-ec-n'), bar: getComputedStyle(q('.hi-again')).backgroundColor, sky: q('.hi-stage').dataset.sky }; });
      ok(fc.words === 'MADE IT TO THE MOTHERSHIP' && fc.made && fc.n === '200' && fc.hd === 'HIGH RISE · MATCH' && fc.line === '200 PERFECTS · BEST STREAK 200' && fc.best === '', `${lk} match: the card — ${fc.hd} · "${fc.words}" · ${fc.n} FLOORS · ${fc.line} — no YOUR BEST line ("${fc.best}": a match's floor never sets the SOLO best — the close's review)`);
      ok(fc.cT === 'rgb(255, 200, 60)' && fc.cN === 'rgb(255, 255, 255)' && fc.bar === 'rgb(255, 79, 216)' && fc.sky === 'dark', `${lk} match: … the words in GOLD, the floor the one white hero; the PLAY AGAIN bar keeps HIGH RISE's hot pink`);
      ok(held > 2400 && fc.check === 'REPLAY = LIVE ✓', `${lk} match: the card waited ${held} ms for the light; ${fc.check}`);
      ok(d.errs.length === 0 && d.reqs.every(r => allowed(r.slice(r.indexOf(' ') + 1))), `${lk} match: no page error, no stray request (${d.errs.join(' | ')})`);
      await d.close();
    }
  }

  // ---- `?floor=N` (the test page's look check): the START tap plays N clean drops — the run goes on live from there; YOUR BEST stays
  {
    const d = await open(390, 844, 3, '?floor=193&mode=match&seed=from&look=night', () => { try { localStorage.setItem('hi:play:best', '7'); } catch { /* fine */ } });
    await ready(d.p);
    const n0 = await d.p.evaluate(() => document.querySelector('.hi-note').textContent);
    await tapAt(d, 195, 500); await sleep(500);
    const f0 = await st(d.p);
    ok(n0 === 'TEST PAGE · FROM FLOOR 193 · NOTHING COUNTS' && f0.started && f0.floor === 193 && !f0.over && f0.taps === 193, `?floor=193: ONE tap = the START — the run is live on floor ${f0.floor} (193 clean drops through the real engine); the note says so`);
    ok(await waitFor(d.p, 'window.__hiPlay.flyInfo().ship && window.__hiPlay.flyInfo().ship.k > 0.3', 6000), '… THE MOTHERSHIP is coming down over it');
    let n = 0;
    for (let i = 0; i < 9 && !(await st(d.p)).over; i++) { if (await atPerfect(d.p, 14) !== 'go') break; await tapAt(d, 195, 500); n++; await sleep(60); }
    ok(await waitFor(d.p, 'window.__hiPlay.state().shown', 9000), '… seven REAL taps later: floor 200');
    const fe = await d.p.evaluate(() => ({ words: document.querySelector('.hi-ec-cause').textContent, check: document.querySelector('.hi-check').textContent, best: document.querySelector('.hi-ec-best').textContent, stored: localStorage.getItem('hi:play:best'), floor: window.__hiPlay.state().floor }));
    ok(fe.words === 'MADE IT TO THE MOTHERSHIP' && fe.floor === 200 && n === 7 && fe.check === 'REPLAY = LIVE ✓', `the finish from a ?floor start: "${fe.words}" after ${n} real taps; ${fe.check}`);
    ok(fe.stored === '7' && fe.best === 'YOUR BEST · 7', `a look check never moves YOUR BEST (stored ${fe.stored}; the card: "${fe.best}")`);
    ok(d.errs.length === 0, `no page error (${d.errs.join(' | ')})`);
    await d.close();
  }

  // ---- BY DAY THE WORDS + THE TAPE READ on a bright sky; from THE STARS up the words are light again
  {
    const d = await open(390, 844, 3, '?seed=read&look=day', () => { try { localStorage.setItem('hi:play:best', '9'); } catch { /* fine */ } });
    const { p } = d;
    await ready(p);
    await climb(p, 6); await alive(p, true); await sleep(900);
    const tg = await p.evaluate(() => { const q = document.querySelector('.hi-tag'), c = getComputedStyle(q); return { text: q.textContent, col: c.color, bg: c.backgroundColor }; });
    ok(/^BEST 9 ▲\d$/.test(tg.text) && tg.bg === 'rgba(10, 7, 22, 0.84)', `by day YOUR BEST's tag keeps its own dark flag ("${tg.text}")`);
    for (const [floor, band] of [[12, 'THE ROOFTOPS'], [40, 'THE SKYLINE'], [84, 'THE CLOUDS']]) {
      await alive(p, false); await climb(p, floor - (await st(p)).floor); await alive(p, true); await sleep(1100);
      const sky = await p.evaluate(() => document.querySelector('.hi-stage').dataset.sky), bg = await behind(p, '.hi-num'), num = await wordsRead(p, '.hi-num'), bn = await wordsRead(p, '.hi-band');
      ok(sky === 'bright' && bn.text === band && ['13,23,64', '255,184,31'].includes(num.col.join()) && num.nT > 400 && bn.nT > 60 && num.k >= 4.5 && bn.k >= 4.5, `day, floor ${floor} (${band}, the sky behind the number rgb ${bg.bg}): the big number reads ${num.k.toFixed(1)} : 1 (${num.col.join() === '13,23,64' ? 'dark navy on its light halo' : 'gold with a navy edge — YOUR BEST is passed'}), the band's name ${bn.k.toFixed(1)} : 1`);
      if (floor === 12) {
        // the gold tape lies on floor 9 (crossed at 10): its line is GOLD on the frosted tower, a darker outline beside it
        const tp = await p.evaluate(() => new Promise(res => requestAnimationFrame(() => {
          const L = window.__hiPlay, V = L.view, c = document.querySelector('canvas.hi-canvas'), sl = L.state().viewTop, pt = V.project(sl.x1, 8.5, sl.z1), cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height;
          const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0);
          const px = Math.round(pt[0] * c.width), py = Math.round(pt[1] * c.height), d2 = x.getImageData(px - 60, py - 30, 120, 60).data; let gold = 0, dark = 0;
          for (let i = 0; i < d2.length; i += 4) { const r = d2[i], g = d2[i + 1], b2 = d2[i + 2]; if (r > 190 && g > 95 && g < 218 && b2 < 135 && r - b2 > 95) gold++; if (r < 150 && g < 110 && b2 < 70 && r > b2 + 30) dark++; }
          res({ gold, dark, tape: L.state().info.tape });
        })));
        ok(tp.tape === 9 && tp.gold >= 40 && tp.dark >= 20, `day: the gold tape on floor ${tp.tape} READS on the frosted tower — ${tp.gold} gold pixels at its near corner, ${tp.dark} of its darker outline`);
        await shot(p, 's3-390-day-tape.png');
      }
    }
    await shot(p, 's3-390-day-clouds-hud.png');
    await alive(p, false); await climb(p, 130 - (await st(p)).floor, 'i => (i % 11 === 10 ? 3 : 0)'); await alive(p, true); await sleep(1300);
    const up = await p.evaluate(() => ({ sky: document.querySelector('.hi-stage').dataset.sky, look: document.querySelector('.hi-stage').dataset.look })), numUp = await behind(p, '.hi-num'), bandUp = await behind(p, '.hi-band');
    ok(up.look === 'day' && up.sky === 'dark' && numUp.col.join() === '255,255,255' && contrast(numUp.col, numUp.bg) >= 4.5 && contrast(bandUp.col, bandUp.bg) >= 4.5, `day, floor 130 (THE STARS — a dark plate): the words are LIGHT again (the number ${contrast(numUp.col, numUp.bg).toFixed(1)} : 1, the band's name ${contrast(bandUp.col, bandUp.bg).toFixed(1)} : 1 on rgb ${numUp.bg})`);
    await alive(p, false);
    ok(d.errs.length === 0, `no page error (${d.errs.join(' | ')})`);
    await d.close();
  }
}

if (LOOK) await look();
else if (argv.includes('--ufo')) await ufoLook();
else if (argv.includes('--flash')) await flashLook();
else if (argv.includes('--screens')) await screensLook();
else if (argv.includes('--end')) await endLook();
else if (argv.includes('--icon')) await iconLook();
else if (argv.includes('--tape')) await tapeLook();
else if (argv.includes('--fly')) await flyLook();
else if (argv.includes('--hitch')) await hitch();
else if (PERF) await perf();
else if (argv.includes('--webkit')) await webkit();
else if (argv.includes('--review')) await review();
else if (argv.includes('--s3')) await s3();
else { await main(); await review(); await s3(); await flashLook(); }

await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
