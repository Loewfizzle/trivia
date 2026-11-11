// LOAD FIX 5 (Nov 11) — NO TWO CAMERAS, in Safari's engine: the owner's DOUBLED CITY (his iPhone, Safari, the first open of the day, fog —
// docs/harbor/passes/load-fix-5/owner-iphone.png: the billboard, EST. 1924 and the PRISM DROP blade each twice). Playwright's WebKit
// (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×659 @3 — the owner's page between Safari's bars — his morning (Nov 11 8:30, fog).
// EVERY path that can change the city's camera, its box or its bake, each watched on EVERY frame (kit/load-probe.mjs#CAM_REC + camJudge:
// the bake / the lit windows at another camera, the canvas CSS-fitted to a box it was not built for, more than one scene / loop) AND by
// PIXELS at its key moments (the crisp lettering hidden for one screenshot: the copy the city paints under each crisp item must sit AT
// the item — an offset = the second copy the owner saw):
//   plain            a normal load (the control)
//   box-pre@N        THE OWNER'S: the city's box (100lvh) grows 659 → 712 N ms into the boot, BEFORE the reveal, with NO window resize
//   box-pre-shrink   the same, shrinking 712 → 659
//   box-post         the box grows 3 s after the reveal
//   box-hidden       the box grows while the page is hidden; shown again 6 s later (past the held picture's 4 s safety)
//   resize-hidden    the whole viewport 659 → 712 while hidden 6 s (the dock moves: the camera really shifts), then shown
//   box-return       a FROZEN tab resumed: hidden 6 s, the box grows in the same moment the page is shown again
//   bfcache          a back-forward-cache return as the page sees it: pagehide (persisted) + hidden → the box grows → visible + pageshow (persisted)
//   restore          a tab RESTORED for real: away to another page + BACK (Playwright's WebKit RELOADS — said in the line), the box growing as it boots
//   hours            hidden 6 s while the clock (the phone's AND the server's) jumps +10 h (the morning → the night), then shown
//   hours-box        the same + the box grows while hidden
//   wx-late          the real clock: yesterday's CLEAR kept on this device, today's FOG lands 2.5 s after the reveal
//   bars-pre|after|late   Safari's bars as a real window resize (659 → 712 → 659) with the box pinned at the large viewport
//   resize-post      the whole viewport 659 → 712 after the reveal (no pinned box: a rotation-like re-layout)
//   tier             a tier step down 3 s after the reveal, back up 3 s later
//   node tests/integration/wk-double.mjs [--paths all|a,b] [--shots DIR] [--json out.json] [--vh 659] [--grow 712]
// Exit 1 when any path showed two cameras (frames or pixels). On the emulators + scripts/serve.mjs --emu.
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { CAM_REC, camJudge } from './kit/load-probe.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const VH = Number(opt('vh', 659)), GROW = Number(opt('grow', 712)), SHOTS = opt('shots', '') || '';
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const OWNER = `when=2026-11-11T08:30&wx=fog${GR}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ALL = ['plain', 'box-pre@50', 'box-pre@250', 'box-pre@600', 'box-pre-shrink', 'box-post', 'box-hidden', 'resize-hidden', 'box-return', 'bfcache', 'restore', 'hours', 'hours-box', 'wx-late', 'bars-pre', 'bars-after', 'bars-late', 'resize-post', 'tier'];
const pathsArg = String(opt('paths', 'all'));
const PATHS = pathsArg === 'all' ? ALL : pathsArg.split(',');
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const results = [];

// (the page's test controls, installed before it mounts: the city's box by a style — a box change with NO window resize, what a late /
//  changed 100lvh is; a faked visibility — Playwright can't background a tab; a clock that can jump)
const INIT = ([h0, kept]) => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:w5:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (kept) localStorage.setItem('nd:wx', kept); } catch { /* fine */ }
  let st = null, want = h0;
  const put = () => { if (!document.head) return; if (!st || !st.isConnected) { st = document.createElement('style'); document.head.append(st); } st.textContent = want ? `.nd-scene.nd-lvh { height: ${want}px !important; }` : ''; };
  document.addEventListener('DOMContentLoaded', put);
  window.__box = h => { want = h; put(); };
  let fake = null;
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => fake || 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => fake === 'hidden' });
  window.__hide = on => { fake = on ? 'hidden' : null; document.dispatchEvent(new Event('visibilitychange')); };
  const RD = Date; let off = 0;
  // eslint-disable-next-line no-global-assign
  Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } };
  window.__jump = ms => { off += ms; };
  window.__page = (type, persisted) => { const e = new Event(type); Object.defineProperty(e, 'persisted', { value: !!persisted }); window.dispatchEvent(e); };
  window.__ps = []; window.addEventListener('pageshow', e => window.__ps.push(!!e.persisted));
  window.__boot = (window.__bootN = (Number(sessionStorage.getItem('w5:boots')) || 0) + 1); try { sessionStorage.setItem('w5:boots', String(window.__bootN)); } catch { /* fine */ }
};

// THE PIXEL CHECK (a helper page decodes the two screenshots): for each crisp item's box, the picture WITH the crisp layer vs the same
// moment WITHOUT it (the city paints the same thing under it) — the best match of the item in the city's own picture, ± 48 pt
const helper = await (await browser.newContext()).newPage();
await helper.goto('about:blank');
const pixels = (a, b, boxes) => helper.evaluate(async ([A, B, boxes]) => {
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, L = new Float32Array(c.width * c.height); for (let i = 0; i < L.length; i++) L[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; res({ w: c.width, h: c.height, L }); }; im.onerror = rej; im.src = 'data:image/png;base64,' + src; });
  const [a, b] = await Promise.all([load(A), load(B)]);
  const R = 48, out = [];
  for (const bx of boxes) {
    const x0 = Math.max(0, Math.round(bx.x)), y0 = Math.max(0, Math.round(bx.y)), w = Math.min(a.w - x0, Math.round(bx.w)), h = Math.min(a.h - y0, Math.round(bx.h));
    if (w < 8 || h < 8) continue;
    let tm = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tm += a.L[(y0 + y) * a.w + x0 + x]; tm /= w * h;
    let tv = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tv += Math.abs(a.L[(y0 + y) * a.w + x0 + x] - tm); tv /= w * h;
    let best = { s: 1e9, dx: 0, dy: 0 }, s00 = 1e9;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const bx0 = x0 + dx, by0 = y0 + dy; if (bx0 < 0 || by0 < 0 || bx0 + w > b.w || by0 + h > b.h) continue;
      let bm = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) bm += b.L[(by0 + y) * b.w + bx0 + x]; bm /= Math.ceil(h / 2) * Math.ceil(w / 2);
      let s = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) s += Math.abs((a.L[(y0 + y) * a.w + x0 + x] - tm) - (b.L[(by0 + y) * b.w + bx0 + x] - bm)); s /= Math.ceil(h / 2) * Math.ceil(w / 2);
      if (dx === 0 && dy === 0) s00 = s;
      if (s < best.s) best = { s, dx, dy };
    }
    out.push({ box: [x0, y0, w, h], dx: best.dx, dy: best.dy, s: +best.s.toFixed(2), s00: +s00.toFixed(2), contrast: +tv.toFixed(1) });
  }
  return out;
}, [a.toString('base64'), b.toString('base64'), boxes]);

async function run(name) {
  const [kind, atArg] = name.split('@');
  const shrink = kind === 'box-pre-shrink', pinned = /^bars-/.test(kind);
  const h0 = kind === 'resize-hidden' ? 0 : shrink || pinned ? GROW : VH, h1 = shrink ? VH : GROW;
  const live = kind === 'wx-late', realClock = live || /^hours/.test(kind);
  const base = { code: 2, fog: 0, gust: 3, lat: 43, lon: -85.5, rain: 0, rate: 0, snow: 0, snowDepth: 0, snowfall: 0, src: 'test', storm: 0, temp: 8, veil: 0, vis: 20000, wind: 2.5, windDir: 226 };
  const FAIR = { ...base, cloud: 0.15, kind: 'clear', layers: { hi: 0.15, lo: 0.05, mid: 0.05 }, opaque: 0.1 };
  const FOG = { ...base, code: 45, vis: 180, fog: 1, dense: true, cloud: 1, kind: 'fog', layers: { hi: 0.05, lo: 1, mid: 0.2 }, opaque: 0.9 };
  const MIN = 60e3;
  const ctx = await browser.newContext({ viewport: { width: 402, height: VH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(INIT, [h0, live ? JSON.stringify({ ...FAIR, at: Date.now() - 33 * MIN, got: Date.now() - 33 * MIN }) : '']);
  await ctx.addInitScript(CAM_REC);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let shownWall = 0, jump = 0;
  if (/^hours/.test(kind)) await ctx.route(/\/api\/time/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ t: Date.now() + jump }) }).catch(() => {}));   // (the server's clock moved with the phone's)
  if (live) await ctx.route(/\/api\/sky/, async r => { while (!shownWall) await sleep(40); const w = shownWall + 2500 - Date.now(); if (w > 0) await sleep(w); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...FOG, at: Date.now() - 2 * MIN }) }).catch(() => {}); });
  const url = guardUrl(`${BASE}/?emu&slot=w5&${live ? '' : realClock ? `wx=fog${GR}&` : `${OWNER}&`}city=2`, 'wk-double.mjs');
  const ev = js => page.evaluate(js).catch(() => null);
  const shown = () => ev('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown)');
  const sceneUp = () => ev('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe().W)');
  const waitFor = async (fn, ms) => { const e = Date.now() + ms; while (Date.now() < e) { if (await fn()) return true; await sleep(20); } return false; };
  const mark = l => ev(`window.__cam && window.__cam.mark(${JSON.stringify(l)})`);
  const vp = h => page.setViewportSize({ width: 402, height: h }).catch(() => {});
  const checks = [], pics = [];
  // one pixel check: the crisp boxes now, a screenshot with the crisp layer, one without (hidden for that one shot)
  const look = async label => {
    const boxes = await ev(`(() => { const w = document.querySelector('.nd-scene'); if (!w) return []; const seen = new Set(), out = []; for (const c of w.querySelectorAll('canvas.hc-crisp')) { const cs = getComputedStyle(c); if (cs.display === 'none' || +cs.opacity < 0.5 || !/^(roofboard|datestone|blade-board)$/.test(c.dataset.item || '')) continue;   /* (the owner's three: the billboard's face, EST. 1924, the blade — lettering the city paints under its crisp copy; a window scene / a light has nothing under it) */ const r = c.getBoundingClientRect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join(','); if (seen.has(k) || r.width < 16 || r.height < 12) continue; seen.add(k); out.push({ x: r.left, y: r.top, w: r.width, h: r.height }); } return out; })()`) || [];
    const a = await page.screenshot({ scale: 'css' });
    await ev("(() => { const s = document.createElement('style'); s.id = 'w5-nocrisp'; s.textContent = 'canvas.hc-crisp { opacity: 0 !important; }'; document.head.append(s); })()");
    const b = await page.screenshot({ scale: 'css' });
    await ev("(() => { const s = document.getElementById('w5-nocrisp'); if (s) s.remove(); })()");
    const px = boxes.length ? await pixels(a, b, boxes) : [];
    // (a second copy: the city's own picture of the item sits more than 3 pt from the crisp item, and matches there clearly better than at it)
    const off = px.filter(p => p.contrast > 6 && Math.hypot(p.dx, p.dy) > 3 && p.s < 0.75 * p.s00);
    checks.push({ label, boxes: px.length, off: off.map(p => `${p.box[2]}×${p.box[3]} item: its copy ${p.dx},${p.dy} pt away`), px });
    pics.push({ label, a });
  };

  const t0 = Date.now();
  const nav = page.goto(url, { waitUntil: 'commit', timeout: 60000 });
  if (kind === 'box-pre' || shrink) { await waitFor(sceneUp, 20000); await sleep(Number(atArg) || 250); const was = await shown(); await mark(`the box ${h0} → ${h1}, no window resize${was ? ' (ALREADY SHOWN)' : ''}`); await ev(`window.__box(${h1})`); }
  if (kind === 'bars-pre') { await sleep(300); await vp(GROW); await sleep(500); await vp(VH); }
  await nav.catch(() => {});
  const ok = await waitFor(shown, 30000); shownWall = Date.now();
  const revealAt = Date.now() - t0;
  await mark('the reveal');
  await sleep(700); await look('0.7 s after the reveal');
  if (kind === 'box-post') { await sleep(2300); await mark(`the box ${h0} → ${h1}`); await ev(`window.__box(${h1})`); await sleep(350); await look('0.35 s after the box grew'); }
  if (kind === 'box-hidden' || kind === 'resize-hidden' || kind === 'box-return' || kind === 'bfcache' || /^hours/.test(kind)) {
    await sleep(2300); await mark('hidden'); if (kind === 'bfcache') await ev("window.__page('pagehide', true)"); await ev('window.__hide(true)'); await sleep(500);
    if (/^hours/.test(kind)) { jump = 10 * 3600e3; await ev('window.__jump(10 * 3600e3)'); await mark('the clock +10 h'); }
    if (kind === 'resize-hidden') { await vp(GROW); await mark('the viewport 659 → 712 while hidden'); }
    else if (kind !== 'hours' && kind !== 'box-return') { await ev(`window.__box(${h1})`); await mark(`the box ${h0} → ${h1} while hidden`); }
    await sleep(6000);
    if (kind === 'box-return') await ev(`(window.__box(${h1}), window.__cam.mark('the box ${h0} → ${h1} as it returns'), window.__hide(false))`);
    else await ev('window.__hide(false)');
    if (kind === 'bfcache') await ev("window.__page('pageshow', true)");
    await mark('shown again'); await sleep(250); await look('0.25 s after the return'); await sleep(700); await look('1 s after the return');
  }
  if (kind === 'restore') {
    await sleep(2300); await mark('away'); await page.goto(`${BASE}/404.html`, { waitUntil: 'load' }).catch(() => {}); await sleep(1500);
    const back = page.goBack({ waitUntil: 'commit' }).catch(() => {});
    await waitFor(sceneUp, 20000); await ev(`window.__box(${h1})`); await mark(`back: the box ${h0} → ${h1}`); await back;
    await waitFor(shown, 30000); await sleep(600); await look('0.6 s after BACK');
  }
  if (kind === 'wx-late') { await sleep(2500 + 600); await look('0.6 s after the fog landed'); await sleep(3000); await look('3.6 s after the fog landed'); }
  if (kind === 'bars-after') { await sleep(300); await vp(GROW); await sleep(600); await look('the bars away'); await vp(VH); }
  if (kind === 'bars-late') { await sleep(2100); await vp(GROW); await sleep(1300); await look('the bars away'); await sleep(1300); await vp(VH); }
  if (kind === 'resize-post') { await sleep(2300); await ev('window.__box(0)'); await sleep(900); await mark('the viewport 659 → 712'); await vp(GROW); await sleep(300); await look('0.3 s after the resize'); }
  if (kind === 'tier') { await sleep(2300); await mark('tier 2 → 1'); await ev('window.__district.setTier(1)'); await sleep(350); await look('0.35 s after the step down'); await sleep(2700); await mark('tier 1 → 2'); await ev('window.__district.setTier(2)'); await sleep(350); await look('0.35 s after the step up'); }
  await sleep(1800); await look('settling');
  await sleep(4500); await look('the end');
  const D = await ev('window.__cam ? window.__cam.dump() : null');
  const info = await ev(`(() => { const p = window.__district && window.__district.loadProbe ? window.__district.loadProbe() : null, w = document.querySelector('.nd-scene'), c = w && w.querySelector('canvas:not([class])'); let log = []; try { log = window.__district.harbor().loadLog.rows.filter(r => /layout|reveal|resize|dock|canvas|hold|box/.test(r.kind)).map(r => Math.round(r.t || r.ms || 0) + ' ' + r.kind + ' ' + r.msg); } catch { /* */ } return { built: p ? [p.W, p.H] : null, box: c ? [c.clientWidth, c.clientHeight] : null, holds: p ? p.holds : null, ps: window.__ps, boots: window.__bootN, log }; })()`);
  const J = camJudge(D ? D.frames : []);
  const pxBad = checks.filter(c => c.off.length);
  const bad = !ok || J.n > 0 || pxBad.length > 0 || errs.length > 0;
  const restored = kind === 'restore' && info ? (info.boots > 1 ? 'RELOADED on BACK' : `bfcache (pageshow persisted ${JSON.stringify(info.ps)})`) : '';
  results.push({ name, ok, revealAt, bad, frames: J, pixels: checks.map(c => ({ label: c.label, boxes: c.boxes, off: c.off })), info, errs, marks: D ? D.marks : [] });
  console.log(`${bad ? 'FAIL' : 'OK  '} ${name.padEnd(16)} reveal ${ok ? `${revealAt} ms` : 'NEVER'} · frames ${J.seen} seen: ${J.n ? `✗ ${J.n} with TWO CAMERAS (${Object.entries(J.kinds).map(([k, v]) => `${k} ${v}`).join(', ')}) — ${J.what}` : '✓ one camera'} · pixels ${checks.length} looks: ${pxBad.length ? `✗ ${pxBad.map(c => `${c.label}: ${c.off.join('; ')}`).join(' | ')}` : '✓ one copy'}${info ? ` · built ${info.built && info.built.join('×')} in a ${info.box && info.box.join('×')} box · holds ${info.holds}` : ''}${restored ? ` · ${restored}` : ''}${errs.length ? ` · errors: ${errs[0]}` : ''}`);
  if (opt('log', false) && info) for (const l of info.log) console.log('      ' + l);
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); const tag = name.replace(/[@]/g, '-'); pics.forEach((p, i) => { if (bad || i === pics.length - 1 || /after|landed|away|return|BACK/.test(p.label)) writeFileSync(join(SHOTS, `${tag}-${i}-${p.label.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`), p.a); }); }
  await ctx.close();
}

for (const p of PATHS) await run(p);
await browser.close();
if (opt('json', '')) writeFileSync(opt('json'), JSON.stringify(results, null, 1));
const bad = results.filter(r => r.bad);
console.log(`\nwk-double: ${results.length} paths · ${bad.length} with two cameras${bad.length ? ` (${bad.map(r => r.name).join(', ')})` : ''}`);
process.exit(bad.length ? 1 : 0);
