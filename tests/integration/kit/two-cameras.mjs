// LOAD FIX 5 (Nov 11) — NO TWO CAMERAS: ONE runner for every path that can change the city's camera, its box or its bake, driven by BOTH
// engines — Playwright's WebKit (tests/integration/wk-double.mjs: Safari's engine, the owner's phone class) and puppeteer's Chromium (the
// harbor `load` group: the cloud's). The owner's DOUBLED CITY (his iPhone, Safari, the first open of the day, fog —
// docs/harbor/passes/load-fix-5/owner-iphone.png: the billboard, EST. 1924 and the PRISM DROP blade each twice): the city's box grew
// before the reveal with no window resize, the canvas stayed CSS-fitted to a box it was not built for, the crisp lettering did not.
// Each path is watched on EVERY frame (load-probe.mjs#CAM_REC + camJudge: the bake / the lit windows at another camera, the canvas fitted
// to a box it was not built for with no pin, more than one scene / frame loop) AND by PIXELS at its steady moments (the crisp lettering
// hidden for one screenshot: the copy the city paints under the billboard's face / the date stone / the blade must sit AT the crisp item
// — a better match elsewhere = the second copy the owner saw, in pt).
//   plain            a normal load (the control)
//   box-pre@N        THE OWNER'S: the city's box (100lvh) grows 659 → 712 N ms into the boot, BEFORE the reveal, with NO window resize
//   box-pre-shrink   the same, shrinking 712 → 659
//   box-post         the box grows 3 s after the reveal
//   box-hidden       the box grows while the page is hidden; shown again 6 s later (past the held picture's 4 s safety)
//   resize-hidden    the whole viewport 659 → 712 while hidden 6 s (the dock moves: the camera really shifts), then shown
//   box-return       a FROZEN tab resumed: hidden 6 s, the box grows in the same moment the page is shown again
//   bfcache          a back-forward-cache return as the page sees it: pagehide (persisted) + hidden → the box grows → visible + pageshow (persisted)
//   restore          a tab RESTORED for real: away to another page + BACK (a reload or the bfcache — said in the line), the box growing as it comes back
//   hours            hidden 6 s while the clock (the phone's AND the server's) jumps +10 h (the morning → the night), then shown
//   hours-box        the same + the box grows while hidden
//   hours-dusk[@HH:MM] FR7 FIXES C2 — hours-box with the clock SET so the +10 h lands at HH:MM Grand Rapids time on Nov 13 (default 17:20 — its
//                    sunset: the cloud's red landed there — the return crosses the dusk: the lamps, the tubes, the boards' night faces)
//   wx-late          the real clock: yesterday's CLEAR kept on this device, today's FOG lands 2.5 s after the reveal
//   bars-pre|after|late   Safari's bars as a real window resize (659 → 712 → 659) with the box pinned at the large viewport
//   resize-post      the whole viewport 659 → 712 after the reveal (no pinned box: a rotation-like re-layout)
//   tier             a tier step down 3 s after the reveal, back up 3 s later
//   no-observer-pre  the box grows before the reveal and NO ResizeObserver reports it (the layer's observer stubbed out): the reveal's own look
//   no-observer-post the same 3 s after the reveal: THE NET — the once-a-second look re-fits it (two cameras for ≤ 1.5 s, never for good)
//   lost-hidden      FR7 FIXES A — THE BLANK CITY: hidden 6 s, every canvas's pixels WIPED while hidden (iOS discarding the backing stores — no
//                    event), then shown: the city comes back WHOLE by itself within ~1 s (the dark held, the one re-fit path), no refresh
import { CAM_REC, camJudge } from './load-probe.mjs';

export const ALL_PATHS = ['plain', 'box-pre@50', 'box-pre@250', 'box-pre@600', 'box-pre-shrink', 'box-post', 'box-hidden', 'resize-hidden', 'box-return', 'bfcache', 'restore', 'hours', 'hours-box', 'hours-dusk', 'wx-late', 'bars-pre', 'bars-after', 'bars-late', 'resize-post', 'tier', 'no-observer-pre', 'no-observer-post', 'lost-hidden'];
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const OWNER = `when=2026-11-11T08:30&wx=fog${GR}`;   // (his morning)
const sleep = ms => new Promise(r => setTimeout(r, ms));

// (the page's test controls, installed before it mounts: the city's box by a style — a box change with NO window resize, what a late /
//  changed 100lvh is; a faked visibility — neither engine can background a tab; a clock that can jump; pagehide / pageshow as events)
export const INIT = ([h0, kept, noRO, slot, start]) => {
  // (no-observer: the city's layer is never reported by a ResizeObserver — every other observer works)
  if (noRO && window.ResizeObserver) { const RO = window.ResizeObserver; window.ResizeObserver = class extends RO { observe(el, o) { if (el && el.classList && el.classList.contains('nd-scene')) return; super.observe(el, o); } }; }
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${slot}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (kept) localStorage.setItem('nd:wx', kept); } catch { /* fine */ }
  let st = null, want = h0;
  const put = () => { if (!document.head) return; if (!st || !st.isConnected) { st = document.createElement('style'); document.head.append(st); } st.textContent = want ? `.nd-scene.nd-lvh { height: ${want}px !important; }` : ''; };
  document.addEventListener('DOMContentLoaded', put);
  window.__box = h => { want = h; put(); };
  let fake = null;
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => fake || 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => fake === 'hidden' });
  window.__hide = on => { fake = on ? 'hidden' : null; document.dispatchEvent(new Event('visibilitychange')); };
  const RD = Date; let off = start || 0;
  // eslint-disable-next-line no-global-assign
  Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } };
  window.__jump = ms => { off += ms; };
  window.__page = (type, persisted) => { const e = new Event(type); Object.defineProperty(e, 'persisted', { value: !!persisted }); window.dispatchEvent(e); };
  window.__ps = []; window.addEventListener('pageshow', e => window.__ps.push(!!e.persisted));
  try { window.__bootN = (Number(sessionStorage.getItem('w5:boots')) || 0) + 1; sessionStorage.setItem('w5:boots', String(window.__bootN)); } catch { window.__bootN = 1; }
};

// THE PIXEL CHECK, run in a blank helper page (it decodes the two screenshots — `k` = their pixels per pt): for each crisp item's box, the
// picture WITH the crisp layer vs the same moment WITHOUT it — the best match of the item in the city's own picture, ± 48 pt
export const PIXELS = async ([A, B, boxes, k]) => {
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = Math.round(im.width / k); c.height = Math.round(im.height / k); const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data, L = new Float32Array(c.width * c.height); for (let i = 0; i < L.length; i++) L[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; res({ w: c.width, h: c.height, L }); }; im.onerror = rej; im.src = 'data:image/png;base64,' + src; });
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
      const n = Math.ceil(h / 2) * Math.ceil(w / 2);
      let bm = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) bm += b.L[(by0 + y) * b.w + bx0 + x]; bm /= n;
      let s = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) s += Math.abs((a.L[(y0 + y) * a.w + x0 + x] - tm) - (b.L[(by0 + y) * b.w + bx0 + x] - bm)); s /= n;
      if (dx === 0 && dy === 0) s00 = s;
      if (s < best.s) best = { s, dx, dy };
    }
    out.push({ box: [x0, y0, w, h], dx: best.dx, dy: best.dy, s: +best.s.toFixed(2), s00: +s00.toFixed(2), contrast: +tv.toFixed(1) });
  }
  return out;
};

/**
 * one path. D = the engine's driver:
 *   D.open({ vh, inits: [[fn, arg], …], routes: [[regex, async () => ({ status, body })], …] }) → P
 *   P.ev(js) → value | null · P.goto(url) (resolves at the commit) · P.vp(h) · P.shot() → { png: Buffer, k: px per pt } · P.back() · P.errors · P.close()
 *   D.pixels(a, b, boxes, k) → PIXELS' answer (a blank helper page)
 * o: { base, slot, vh 659, grow 712, fast (shorter settles — the harbor group), guard(url) }
 * → { name, ok (revealed), revealAt, bad, frames: camJudge's, pixels: [{ label, boxes, off }], info, errs, marks, net, restored, line, pics }
 */
export async function runPath(D, name, o = {}) {
  const BASE = o.base || 'http://localhost:5173', VH = o.vh || 659, GROW = o.grow || 712, slot = o.slot || 'w5', fast = !!o.fast;
  const [kind, atArg] = name.split('@');
  const shrink = kind === 'box-pre-shrink', pinned = /^bars-/.test(kind);
  const h0 = kind === 'resize-hidden' ? 0 : shrink || pinned ? GROW : VH, h1 = shrink ? VH : GROW;
  const live = kind === 'wx-late', realClock = live || /^hours/.test(kind);
  const base = { code: 2, fog: 0, gust: 3, lat: 43, lon: -85.5, rain: 0, rate: 0, snow: 0, snowDepth: 0, snowfall: 0, src: 'test', storm: 0, temp: 8, veil: 0, vis: 20000, wind: 2.5, windDir: 226 };
  const FAIR = { ...base, cloud: 0.15, kind: 'clear', layers: { hi: 0.15, lo: 0.05, mid: 0.05 }, opaque: 0.1 };
  const FOG = { ...base, code: 45, vis: 180, fog: 1, dense: true, cloud: 1, kind: 'fog', layers: { hi: 0.05, lo: 1, mid: 0.2 }, opaque: 0.9 };
  const MIN = 60e3;
  // (hours-dusk: the phone's + the server's clocks start where the +10 h lands at the given local time — EST on Nov 13 = UTC − 5)
  const dusk = kind === 'hours-dusk', duskAt = String(atArg || '17:20').split(':').map(Number);
  const startOff = dusk ? Date.UTC(2026, 10, 13, duskAt[0] + 5, duskAt[1] || 0) - 10 * 3600e3 - Date.now() : 0;
  let shownWall = 0, jump = startOff;
  const routes = [];
  if (/^hours/.test(kind)) routes.push([/\/api\/time/, async () => ({ status: 200, body: JSON.stringify({ t: Date.now() + jump }) })]);   // (the server's clock moved with the phone's)
  if (live) routes.push([/\/api\/sky/, async () => { while (!shownWall) await sleep(40); const w = shownWall + 2500 - Date.now(); if (w > 0) await sleep(w); return { status: 200, body: JSON.stringify({ ...FOG, at: Date.now() - 2 * MIN }) }; }]);
  const P = await D.open({ vh: VH, inits: [[INIT, [h0, live ? JSON.stringify({ ...FAIR, at: Date.now() - 33 * MIN, got: Date.now() - 33 * MIN }) : '', /^no-observer/.test(kind), slot, startOff]], [CAM_REC, null]], routes });
  const raw = `${BASE}/?emu&slot=${slot}&${live ? '' : realClock ? `wx=fog${GR}&` : `${OWNER}&`}city=2`;
  const url = o.guard ? o.guard(raw) : raw;
  const ev = P.ev;
  const shown = () => ev('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown)');
  const sceneUp = () => ev('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe().W)');
  const waitFor = async (fn, ms) => { const e = Date.now() + ms; while (Date.now() < e) { if (await fn()) return true; await sleep(20); } return false; };
  const mark = l => ev(`window.__cam && window.__cam.mark(${JSON.stringify(l)})`);
  const checks = [], pics = [];
  // (a look is two screenshots + the boxes: it only reads a STEADY picture — the city's state must be the same before + after it. A pin →
  //  hold → cut inside a look would compare two different moments; the frames check owns those. Retaken up to 3×, else said + skipped.)
  const state = () => ev("(() => { const w = document.querySelector('.nd-scene'), c = w && w.querySelector('canvas:not([class])'), p = window.__district && window.__district.loadProbe ? window.__district.loadProbe() : null; return JSON.stringify([c && c.style.width, w && w.style.transform, p && p.hold, p && p.W, p && p.H, p && p.cams && p.cams.now, p && p.cams && p.cams.baked]); })()");
  // (the owner's three: the billboard's face, EST. 1924, the blade — lettering the city paints under its crisp copy; a window scene / a
  //  light has nothing under it. crisp.js names its canvases: data-item)
  const BOXES = "(() => { const w = document.querySelector('.nd-scene'); if (!w) return []; const seen = new Set(), out = []; for (const c of w.querySelectorAll('canvas.hc-crisp')) { const cs = getComputedStyle(c); if (cs.display === 'none' || +cs.opacity < 0.5 || !/^(roofboard|datestone|blade-board)$/.test(c.dataset.item || '')) continue; const r = c.getBoundingClientRect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join(','); if (seen.has(k) || r.width < 16 || r.height < 12) continue; seen.add(k); out.push({ x: r.left, y: r.top, w: r.width, h: r.height }); } return out; })()";
  // (FR7 FIXES C2: THE BOARD's OWN CROSS-FADE — a message's spell starting / ending swaps the roof board with a 0.9-s dissolve (LOBBY 2.0 A:
  //  the old board's copy fades OUT on the crisp layer over the new one). A look inside it reads that deliberate copy as "the item's copy
  //  elsewhere" (seen: hours-dusk@12:12 — STREET PARTY's spell ending 5 s after the return). The look waits it out (≤ 1.5 s) and a dissolve
  //  that starts between its two shots makes it unsteady — the frames check still watches every frame of it.)
  //  The same for THE TRI-VISION's turn (live from Nov 12: its slats on the crisp layer turn the board between two faces for ~1 s — a look on a
  //  real clock can land in one).
  const xfOn = async () => !!(await ev("(() => { const D = window.__district; const x = D && D.boardXf ? D.boardXf() : null, t = D && D.tri ? D.tri() : null; return !!((x && x.a > 0) || (t && t.turn)); })()"));
  const look = async label => {
    for (let n = 0; n < 3; n++) {
      await waitFor(async () => !(await xfOn()), 1500);
      const s0 = await state();
      const boxes = (await ev(BOXES)) || [];
      const a = await P.shot();
      await ev("(() => { const s = document.createElement('style'); s.id = 'w5-nocrisp'; s.textContent = 'canvas.hc-crisp { opacity: 0 !important; }'; document.head.append(s); })()");
      const b = await P.shot();
      await ev("(() => { const s = document.getElementById('w5-nocrisp'); if (s) s.remove(); })()");
      if (!a || !b || (await state()) !== s0 || await xfOn()) { await sleep(120); continue; }
      const px = boxes.length ? await D.pixels(a.png, b.png, boxes, a.k) : [];
      // (a second copy: the city's own picture of the item sits more than 3 pt from the crisp item, and matches there clearly better than at it)
      const off = px.filter(p => p.contrast > 6 && Math.hypot(p.dx, p.dy) > 3 && p.s < 0.75 * p.s00);
      checks.push({ label, boxes: px.length, off: off.map(p => `${p.box[2]}×${p.box[3]} item: its copy ${p.dx},${p.dy} pt away`) });
      pics.push({ label, png: a.png, bare: b.png, px, diag: o.diag ? await ev(o.diag) : null });   // (bare: the same moment without the crisp layer — cr-double.mjs saves both)
      return;
    }
    checks.push({ label: `${label} (unsteady: mid-transition — the frames check's)`, boxes: 0, off: [] });
  };

  const t0 = Date.now();
  const nav = P.goto(url);
  if (kind === 'box-pre' || kind === 'no-observer-pre' || shrink) { await waitFor(sceneUp, 20000); await sleep(Number(atArg) || 250); const was = await shown(); await mark(`the box ${h0} → ${h1}, no window resize${was ? ' (ALREADY SHOWN)' : ''}`); await ev(`window.__box(${h1})`); }
  if (kind === 'bars-pre') { await sleep(300); await P.vp(GROW); await sleep(500); await P.vp(VH); }
  await nav.catch(() => {});
  const ok = await waitFor(shown, 30000); shownWall = Date.now();
  const revealAt = Date.now() - t0;
  await mark('the reveal');
  await sleep(700); await look('0.7 s after the reveal');
  if (kind === 'no-observer-post') { await sleep(2300); await mark(`the box ${h0} → ${h1}, no observer`); await ev(`window.__box(${h1})`); await sleep(1700); await look('1.7 s after the box grew'); }
  if (kind === 'box-post') { await sleep(2300); await mark(`the box ${h0} → ${h1}`); await ev(`window.__box(${h1})`); await sleep(350); await look('0.35 s after the box grew'); }
  if (kind === 'box-hidden' || kind === 'resize-hidden' || kind === 'box-return' || kind === 'bfcache' || /^hours/.test(kind)) {
    await sleep(2300); await mark('hidden'); if (kind === 'bfcache') await ev("window.__page('pagehide', true)"); await ev('window.__hide(true)'); await sleep(500);
    if (/^hours/.test(kind)) { jump = startOff + 10 * 3600e3; await ev('window.__jump(10 * 3600e3)'); await mark('the clock +10 h'); }
    if (kind === 'resize-hidden') { await P.vp(GROW); await mark('the viewport 659 → 712 while hidden'); }
    else if (kind !== 'hours' && kind !== 'box-return') { await ev(`window.__box(${h1})`); await mark(`the box ${h0} → ${h1} while hidden`); }
    await sleep(6000);
    if (kind === 'box-return') await ev(`(window.__box(${h1}), window.__cam.mark('the box ${h0} → ${h1} as it returns'), window.__hide(false))`);
    else await ev('window.__hide(false)');
    if (kind === 'bfcache') await ev("window.__page('pageshow', true)");
    await mark('shown again'); await sleep(250); await look('0.25 s after the return'); await sleep(700); await look('1 s after the return');
  }
  let lostLine = '', lostBad = false;
  if (kind === 'lost-hidden') {
    // (the ground band's light, read from the city's own canvas: a whole city vs a blank one)
    const band = () => ev("(() => { const c = document.querySelector('.nd-scene canvas:not([class])'); if (!c || !c.width) return -1; const x = c.getContext('2d'); let s = 0, n = 0; for (const fy of [0.72, 0.8, 0.88]) { const d = x.getImageData(0, Math.floor(c.height * fy), c.width, 1).data; for (let i = 0; i < d.length; i += 4 * 8) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; } } return n ? s / n : -1; })()");
    await sleep(2300);
    const before = await band();
    await mark('hidden'); await ev('window.__hide(true)'); await sleep(500);
    const wiped = await ev('window.__district.purge()');
    await mark(`every canvas wiped while hidden (${wiped})`);
    await sleep(6000);
    await ev('window.__hide(false)'); await mark('shown again');
    let backMs = -1;
    const t1 = Date.now();
    for (let k = 0; k < 40; k++) { await sleep(50); const L0 = await ev('window.__district.lost()'); const b = await band(); if (L0 && L0.n >= 1 && !L0.holdOn && b >= before * 0.6) { backMs = Date.now() - t1; break; } }
    const L1 = await ev('window.__district.lost()');
    await look('1 s after the return');
    const after = await band();
    lostBad = !(backMs >= 0 && backMs <= 1500 && L1 && L1.n >= 1);
    lostLine = ` · THE LOST LOOK: ${wiped} canvases wiped · ${L1 ? `seen ${L1.n}× (${L1.why})` : 'no probe'} · the ground band ${before.toFixed(1)} → ${after.toFixed(1)} · whole again ${backMs >= 0 ? `in ${backMs} ms` : 'NEVER (≤ 2 s)'}`;
  }
  if (kind === 'restore') {
    await sleep(2300); await mark('away'); await P.goto(`${BASE}/404.html`).catch(() => {}); await sleep(1500);
    const back = P.back().catch(() => {});
    await waitFor(sceneUp, 20000); await ev(`window.__box(${h1})`); await mark(`back: the box ${h0} → ${h1}`); await back;
    await waitFor(shown, 30000); await sleep(600); await look('0.6 s after BACK');
  }
  if (kind === 'wx-late') { await sleep(2500 + 600); await look('0.6 s after the fog landed'); await sleep(3000); await look('3.6 s after the fog landed'); }
  if (kind === 'bars-after') { await sleep(300); await P.vp(GROW); await sleep(600); await look('the bars away'); await P.vp(VH); }
  if (kind === 'bars-late') { await sleep(2100); await P.vp(GROW); await sleep(1300); await look('the bars away'); await sleep(1300); await P.vp(VH); }
  if (kind === 'resize-post') { await sleep(2300); await ev('window.__box(0)'); await sleep(900); await mark('the viewport 659 → 712'); await P.vp(GROW); await sleep(300); await look('0.3 s after the resize'); }
  if (kind === 'tier') { await sleep(2300); await mark('tier 2 → 1'); await ev('window.__district.setTier(1)'); await sleep(350); await look('0.35 s after the step down'); await sleep(2700); await mark('tier 1 → 2'); await ev('window.__district.setTier(2)'); await sleep(350); await look('0.35 s after the step up'); }
  await sleep(fast ? 1500 : 1800); await look('settling');
  await sleep(fast ? 1500 : 4500); await look('the end');
  const Dm = await ev('window.__cam ? window.__cam.dump() : null');
  const info = await ev("(() => { const p = window.__district && window.__district.loadProbe ? window.__district.loadProbe() : null, w = document.querySelector('.nd-scene'), c = w && w.querySelector('canvas:not([class])'); let log = []; try { log = window.__district.harbor().loadLog.rows.filter(r => /layout|reveal|resize|dock|canvas|hold|box/.test(r.kind)).map(r => Math.round(r.t || r.ms || 0) + ' ' + r.kind + ' ' + r.msg); } catch { /* */ } return { built: p ? [p.W, p.H] : null, box: c ? [c.clientWidth, c.clientHeight] : null, holds: p ? p.holds : null, live: p ? p.live : null, ps: window.__ps, boots: window.__bootN, log }; })()");
  let J = camJudge(Dm ? Dm.frames : []);
  // (THE NET: with no observer the once-a-second look re-fits the box — two cameras allowed for ≤ 1.5 s after the change, never later)
  let net = '';
  if (kind === 'no-observer-post' && Dm) { const m = Dm.marks.find(x => /no observer/.test(x.label)), t1 = m ? m.t : 0; const first = camJudge(Dm.frames.filter(f => f.t <= t1 + 1500)); J = camJudge(Dm.frames.filter(f => f.t > t1 + 1500)); J.seen += first.seen; net = `THE NET: ${first.n} frames with two cameras in the first 1.5 s, ${J.n} after`; }
  const errs = (P.errors || []).filter(m => !/access control checks|Load failed|cancelled|Failed to fetch/i.test(m));   // (a fetch cut off by the path's own navigation away is no error of the page's)
  const pxBad = checks.filter(c => c.off.length);
  // (the picture at rest: built for its box, ONE scene, ONE loop, not left held)
  const rest = info && info.built && info.box && Math.abs(info.built[0] - info.box[0]) <= 1 && Math.abs(info.built[1] - info.box[1]) <= 1 && (!info.live || (info.live.scenes === 1 && info.live.loops === 1 && !info.live.dup));
  const bad = !ok || J.n > 0 || pxBad.length > 0 || errs.length > 0 || !rest || !J.seen || lostBad;
  const restored = kind === 'restore' && info ? (info.ps && info.ps.some(Boolean) ? 'the bfcache (pageshow persisted)' : 'RELOADED on BACK') : '';
  const line = `${name.padEnd(16)} reveal ${ok ? `${revealAt} ms` : 'NEVER'} · frames ${J.seen} seen: ${J.n ? `✗ ${J.n} with TWO CAMERAS (${Object.entries(J.kinds).map(([k, v]) => `${k} ${v}`).join(', ')}) — ${J.what}` : '✓ one camera'} · pixels ${checks.length} looks: ${pxBad.length ? `✗ ${pxBad.map(c => `${c.label}: ${c.off.join('; ')}`).join(' | ')}` : '✓ one copy'}${info ? ` · built ${info.built && info.built.map(Math.round).join('×')} in a ${info.box && info.box.join('×')} box${info.live ? ` · ${info.live.scenes} scene, ${info.live.loops} loop` : ''} · holds ${info.holds}` : ' · NO PROBE'}${restored ? ` · ${restored}` : ''}${net ? ` · ${net}` : ''}${lostLine}${errs.length ? ` · errors: ${errs[0]}` : ''}`;
  await P.close();
  return { name, ok, revealAt, bad, frames: J, pixels: checks, info, errs, marks: Dm ? Dm.marks : [], net, restored, line, pics };
}
