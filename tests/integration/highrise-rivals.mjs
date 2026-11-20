// HIGH RISE S4B — THE TAPES NEVER BLOCK THE PLAY: THE PIXEL TEST (docs/highrise.md "THE MATCH"), on the LOCAL server (NEVER THE LIVE
// SITE). EIGHT PLAYERS — you + seven bot rivals on the same seed (/highrise-play?mode=match&rivals=7: their towers through the same
// rivals.js path a real match's proof nodes take; nothing counts) — at 390 × 844, by NIGHT and by DAY.
//   · The run starts 24 floors up (the page's own climb hook — the rivals' clocks with it) and a bot climbs on; every 4th sample it is
//     held a pass (the rivals get ABOVE you — tags "ALEX ▲1"); the rivals that fall leave their HEIGHT TAPES on your tower as you pass.
//   · At each sample, WHILE A SLAB SLIDES, the game is FROZEN on one instant (hook.freeze: the same frame drawn again) and shot TWICE —
//     with every rival thing on (THE PLACE NUMBER, the tags, the tapes, the announcer's lane) and with them all off. The pixels that
//     DIFFER are exactly the rivals' pixels.
//   · THE PLAY ZONE = where the sliding slab can be: under THE DROP ZONE's upper edge (night.js#zoneTop — the highest point its path
//     reaches) and over the top slab's TOP FACE's two near edges, extended to the screen's edges (the plane the slab slides on).
//     NOT ONE rival pixel may lie in it. (Sanity: outside it there ARE rival pixels in every sample — THE PLACE NUMBER at least (S5: the altimeter is gone from live play).)
//   node tests/integration/highrise-rivals.mjs "<chromium>" [outDir] [--samples=24]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, SAMPLES = Number((argv.find(a => a.startsWith('--samples=')) || '').slice(10)) || 24;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 600000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// (the differ: its own blank page — two PNGs → a canvas each → the pixels that differ, inside / outside the play zone)
const differ = await b.newPage();
const diff = (a64, b64, z) => differ.evaluate(async (A, B, Z) => {
  const load = s => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = `data:image/png;base64,${s}`; });
  const [ia, ib] = await Promise.all([load(A), load(B)]), w = ia.width, h = ia.height, sc = w / Z.w;
  const px = im => { const c = new OffscreenCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h).data; };
  const da = px(ia), db = px(ib);
  // the lower edge of the play zone at column x: the top face's near edges through its NEAR corner, extended to the screen's edges
  const lower = x => { const X = x / sc, e = X <= Z.near[0] ? Z.left : Z.right, k = (e[1] - Z.near[1]) / (e[0] - Z.near[0] || 1e-9); return (Z.near[1] + k * (X - Z.near[0])) * sc; };
  let inZ = 0, outZ = 0, first = null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) <= 18) continue;
    if (x >= Z.x0 * sc && x < Z.x1 * sc && y >= Z.top * sc && y <= lower(x)) { inZ++; if (!first) first = [Math.round(x / sc), Math.round(y / sc)]; } else outZ++;
  }
  return { inZ, outZ, first, w, h };
}, a64, b64, z);

for (const look of ['night', 'day']) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?mode=match&rivals=7&seed=px-${look}&look=${look}`, 'highrise-rivals'), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__hiPlay && window.__hiPlay.state().warm && !!window.__hiPlay.sim, { timeout: 30000 });
  await sleep(400);
  const cdp = await p.createCDPSession();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForFunction(() => window.__hiPlay.phase() === 1, { timeout: 5000 });
  await p.evaluate(() => window.__hiPlay.climb(24)); await sleep(600);   // (24 floors up at once: the sloppiest rivals are about to fall)
  // the bot: every slab on a perfect moment (its first — or, after a sample's freeze, its second pass); never while a sample holds it
  await p.evaluate(() => { (function poll() { const L = window.__hiPlay; if (L.phase() !== 1) return; const m = window.__pxHold ? -9999 : L.soon(); if (m !== -9999 && m <= 5) { document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); return setTimeout(poll, 150); } setTimeout(poll, m !== -9999 && m > 14 ? Math.min(30, m - 8) : 2); })(); });
  const shot = async () => (await cdp.send('Page.captureScreenshot', { format: 'png' })).data;
  const frames = n => p.evaluate(k => new Promise(res => { (function f(i) { if (i <= 0) return res(); requestAnimationFrame(() => f(i - 1)); })(k); }), n);
  let n = 0, bad = 0, worst = null, withTape = 0, withTag = 0, withUp = 0, outMin = Infinity, seenAlt = 0, kept = 0;
  const tStart = Date.now();
  while (n < SAMPLES && Date.now() - tStart < 240000) {
    // (a sample every ~1.6 s — and at once when a tape lies on the tower: those moments are the ones to prove)
    await sleep(900);
    const live = await p.evaluate(() => window.__hiPlay.phase() === 1);
    if (!live) break;
    // WHILE A SLAB SLIDES — a quarter of a second into its slide: the camera rests on the new floor
    const got = await p.evaluate(() => new Promise(res => { const L = window.__hiPlay, t0 = performance.now(); (function w8() { const s = L.state(); if (L.phase() !== 1) return res(false); if (s.st === 'slide' && s.t - s.s0 >= 16 && s.t - s.s0 <= 40) { window.__pxHold = true; L.freeze(true); return res(true); } if (performance.now() - t0 > 6000) return res(false); requestAnimationFrame(w8); })(); }));
    if (!got) continue;
    await frames(3);
    const geo = await p.evaluate(() => {
      const L = window.__hiPlay, V = L.view, s = L.state(), tp = s.viewTop, st = document.querySelector('.hi-stage').getBoundingClientRect(), m = L.matchState();
      const pt = (x, z) => { const q = V.project(x, tp.floor, z); return [st.left + q[0] * st.width, st.top + q[1] * st.height]; };
      const c = [pt(tp.x0, tp.z0), pt(tp.x1, tp.z0), pt(tp.x0, tp.z1), pt(tp.x1, tp.z1)];
      const near = c.reduce((a, q) => (q[1] > a[1] ? q : a)), left = c.reduce((a, q) => (q[0] < a[0] ? q : a)), right = c.reduce((a, q) => (q[0] > a[0] ? q : a));
      const alt = document.querySelector('.hi-place').getBoundingClientRect(), tags = [...document.querySelectorAll('.hi-rtag:not([hidden])')].map(e => e.getBoundingClientRect().bottom);
      return { z: { w: innerWidth, x0: st.left, x1: st.right, top: st.top + V.zoneTop() * st.height, near, left, right }, floor: s.floor, st: s.st, tapes: m.tapes.filter(t => t.on).map(t => t.floor), tags: m.tags.map(t => t.text), altRows: m.alt.length, place: m.place, altBottom: alt.bottom, tagBottoms: tags, dim: m.dim };
    });
    const A = await shot();
    await p.evaluate(() => window.__hiPlay.showRivals(false)); await frames(3);
    const B = await shot();
    // (every 4th sample the bot is held one more pass: the rivals climb past you)
    await p.evaluate(hold => { const L = window.__hiPlay; L.showRivals(true); L.freeze(false); if (hold) setTimeout(() => { window.__pxHold = false; }, 1500); else window.__pxHold = false; }, n % 4 === 3);
    const d = await diff(A, B, geo.z);
    n++;
    if (geo.tapes.length) withTape++; if (geo.tags.length) withTag++; if (geo.tags.some(t => /▲/.test(t))) withUp++; if (geo.altRows === 0 && / \/ 8$/.test(geo.place) && geo.altBottom > 0) seenAlt++;
    outMin = Math.min(outMin, d.outZ);
    const domOk = geo.altBottom <= geo.z.top && geo.tagBottoms.every(y => y <= geo.z.top);
    if (d.inZ > 0 || !domOk) { bad++; if (!worst || d.inZ > worst.inZ) worst = { ...d, floor: geo.floor, tapes: geo.tapes, tags: geo.tags, top: geo.z.top, alt: geo.altBottom, tb: geo.tagBottoms }; if (OUT) { writeFileSync(join(OUT, `rivals-${look}-FAIL-${n}-a.png`), Buffer.from(A, 'base64')); writeFileSync(join(OUT, `rivals-${look}-FAIL-${n}-b.png`), Buffer.from(B, 'base64')); } }
    // (the pass's own pictures: a sample with a tape AND a tag on, the first of each look)
    if (OUT && kept < 2 && geo.tapes.length && geo.tags.length) { kept++; writeFileSync(join(OUT, `rivals-${look}-390x844-floor${geo.floor}.png`), Buffer.from(A, 'base64')); }
    console.log(`   ${look} #${n}: floor ${geo.floor} · tapes at ${geo.tapes.join(' ') || '—'} · tags ${geo.tags.join(' | ') || '—'}${geo.dim ? ' (dim)' : ''} · rival pixels: ${d.inZ} IN the play zone, ${d.outZ} outside (the zone from ${geo.z.top.toFixed(0)})`);
  }
  ok(n >= Math.min(SAMPLES, 12) && errs.length === 0, `${look}: ${n} frozen samples of an 8-player match while a slab slid, no page error (${errs.join(' | ')})`);
  ok(seenAlt === n, `${look}: THE PLACE NUMBER (\"n… / 8\") in every sample — no altimeter while you climb (S5) — and it is in the allowed map: outside THE DROP ZONE`);
  ok(withTape >= 2 && withTag >= 3 && withUp >= 1, `${look}: the samples cover the rivals' things — a HEIGHT TAPE on the tower in ${withTape}, a tag in ${withTag} ("▲n" — a rival above — in ${withUp})`);
  ok(outMin > 200, `${look}: (the differ sees them) every sample has rival pixels OUTSIDE the play zone — at least ${outMin}`);
  ok(bad === 0, `${look}: NO RIVAL PIXEL IN THE PLAY ZONE — 0 of ${n} samples${worst ? ` — WORST: ${worst.inZ} px at floor ${worst.floor}, first at ${worst.first}, tapes ${worst.tapes}, tags ${worst.tags} (zone from ${worst.top.toFixed(0)}; THE PLACE NUMBER to ${worst.alt.toFixed(0)}, the tags to ${worst.tb.map(y => y.toFixed(0))})` : ''}`);
  await ctx.close();
}
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed${fails.length ? `\nFAILED:\n  ${fails.join('\n  ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
