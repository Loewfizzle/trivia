// FR7 FIXES C — THANKSGIVING's SIGN: THE MAPLE LEAVES (the owner, Nov 13 — "the wreath looks terrible": the harvest wreath + the wheat swags
// RETIRED). REAL maple leaves (Grok's — the atlas assets/city/thanksgiving/leaves.webp, built by scripts/build-thanksgiving-leaves.mjs) BEHIND
// the NEON letters — never in front of a tube, never over SPEAKEASY. In LOGO UNITS (ui/logo.js: the letters in 0..332 × 0..100, y down).
// FR7 FIXES C2 — THE LEAVES READ AS LEAVES (the owner's iPhone, Nov 13 7 am: "it's hard to tell these are leaves" — 92 small leaves, overlapped,
// darkened at night, most inside the letters = a dark brown fuzzy halo): FEWER, BIGGER leaves in a RING round the letters, their real colours.
//   THE LAYOUT   ONE seeded layout (the same on every phone — PURE: leafLayout()): ~27 leaves, each ~40–58 pt at 390, each covered ≤ 30 % by the
//                others (its five points + stem whole), most of each OUTSIDE the letters (above, below, in the gaps, past both N's), clear of
//                SPEAKEASY + the corner buttons' row; its ORDER centre-out: the bank fills in over the build-up (core/harbor-holiday.js#thanksLeaves)
//   THE BAKE     the leaves up now drawn ONCE into a canvas (safeCtx) per look — never leaf by leaf per frame: NIGHT = their real colours lit warm
//                by the tubes (signdress.js#lightField — the nearest brightest, the furthest ≥ ~55 % of daylight: NIGHT_FLOOR) + a SMOOTH dark
//                halo hugging the tubes (blurred, baked — the letters read over the bank: measured ≥ a plain night's); DAY = natural colours
//   THE LAYER    a box INSIDE the logo's wrap at z-index −1: behind the tubes + their glow (the wrap is a stacking context — title.css), in front of
//                the sky; day ↔ night = the two canvases' opacity (the compositor); a new day's leaves FADE IN over `fadeS` (a new bake laid over
//                the old one, then the old freed) — never a pop, the first showing too (the atlas loads after the reveal)
//   THE COST     ≤ 2 canvases of the bank's box at the scene's dress resolution (+ one while a fade runs); the frame only compares keys
import { safeCtx, freeCanvases } from '../../ui/canvas-safe.js';
import { LOGO_LETTERS } from '../../ui/logo.js';
import { flattenPath } from '../../core/tube-path.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { knob } from '../../core/harbor-schedule.js';
import { lightField } from './signdress.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
/** the bank's box in logo units (the SVG's viewBox is −26 −30 384 160): wide of the letters, never down to the SPEAKEASY word */
export const BANK_BOX = Object.freeze({ x0: -108, y0: -86, x1: 440, y1: 138 });
const VB = { x: -26, y: -30, w: 384 };
/** the letters' boxes (logo units: N · E · O · N — ui/logo.js) — the leaves sit AROUND these, never packed inside a letter */
export const LETTER_BOXES = Object.freeze([[0, 64], [92, 154], [176, 240], [268, 332]].map(([x0, x1]) => Object.freeze({ x0, x1, y0: 0, y1: 100 })));
/** FR7 FIXES C2 — THE RING (the owner's iPhone, Nov 13 7 am: "it's hard to tell these are leaves" — 92 small leaves overlapped into a brown
 *  halo): a rounded band AROUND + BEHIND the four letters — above them, below them (clear of SPEAKEASY), in the gaps between, out past
 *  both N's — the reference's spread (leaves-bank-ref.png), wider + taller than the first bank */
export const RING = Object.freeze({ cx: 166, cy: 46, ax: 206, top: -36, bottom: 104, p: 3.2 });
/** the leaves' size, logo units (the long side): ~43–58 pt at 390 (0.833 pt a unit there — measured); the bottom row a touch smaller (SPEAKEASY) */
export const LEAF_S = Object.freeze({ min: 52, max: 70, low: [48, 54] });
/** the overlap rule: the share of a leaf's body any other leaves may cover (each maple shape stays whole) */
export const MAX_COVER = 0.3;
/** a leaf's body as a disc (the maple's five lobes fill ~ a disc of 0.4 × its long side) */
export const bodyR = s => 0.4 * s;
/** the lowest a leaf's body may reach (SPEAKEASY's top ≈ 134 logo units) */
export const FLOOR_Y = 128;
/** the highest a leaf's picture may reach (the corner buttons' row sits just above the sign on a phone) */
export const CEIL_Y = -62;
export const LEAF_N = 30;
/** the gap a new leaf wants to its nearest neighbour, as a share of their radii (−0.3 = a light overlap) */
const GAP = -0.4;
/** the tubes' gold for THE GOLD WEEK (the light the night's leaves are lit by — css/title.css .sg-thanksgiving) */
export const GOLD = Object.freeze([255, 190, 58]);
const ATLAS = '/assets/city/thanksgiving/leaves';
/** the night's multiply for a leaf far from every tube (warm, ≥ ~55 % of its daylight: never brown / olive / black) */
export const NIGHT_FLOOR = Object.freeze([0.66, 0.56, 0.46]);

/** PURE — the area two discs share (radii a, b; centres d apart) */
export function discOverlap(a, b, d) {
  if (d >= a + b) return 0;
  if (d <= Math.abs(a - b)) return Math.PI * Math.min(a, b) ** 2;
  const a2 = a * a, b2 = b * b;
  const al = Math.acos((d * d + a2 - b2) / (2 * d * a)), be = Math.acos((d * d + b2 - a2) / (2 * d * b));
  return a2 * (al - Math.sin(2 * al) / 2) + b2 * (be - Math.sin(2 * be) / 2);
}
/** PURE — the share of a leaf's body (a disc at x, y, radius r) inside the letters' boxes (a 9 × 9 sample grid) */
export function insideLetters(x, y, r) {
  let n = 0, inn = 0;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    const u = (i / 8) * 2 - 1, v = (j / 8) * 2 - 1;
    if (u * u + v * v > 1) continue;
    n++;
    const px = x + u * r, py = y + v * r;
    if (LETTER_BOXES.some(B => px >= B.x0 && px <= B.x1 && py >= B.y0 && py <= B.y1)) inn++;
  }
  return n ? inn / n : 0;
}
/** PURE — the share of leaf i's body the others cover (the sum of the pairwise overlaps — conservative: ignores who's on top) */
export function coverOf(L, i) {
  const A = L[i], ra = bodyR(A.s);
  let c = 0;
  for (let j = 0; j < L.length; j++) if (j !== i) c += discOverlap(ra, bodyR(L[j].s), Math.hypot(L[j].x - A.x, L[j].y - A.y));
  return c / (Math.PI * ra * ra);
}
/** the ring's own "radius" of a point (1 = on the band's outer edge; a superellipse — a rounded box) */
function ringE(x, y) {
  const ay = y < RING.cy ? RING.cy - RING.top : RING.bottom - RING.cy;
  return (Math.abs(x - RING.cx) / RING.ax) ** RING.p + (Math.abs(y - RING.cy) / ay) ** RING.p;
}

/** PURE — the seeded bank: [{ x, y, s (the long side, logo units), rot (rad), flip, leaf (0..11), order (0..1, centre-out), z }] —
 *  FEWER, BIGGER leaves (~30 of ~43–58 pt at 390), each covered ≤ 30 % by the others, most of each OUTSIDE the letters, none over SPEAKEASY.
 *  The bank GROWS: of a few hundred seeded tries the one nearest a light overlap with its closest neighbour (GAP) — even, touching, never mush. */
export function leafLayout(n = LEAF_N) {
  const R = rngFrom(hashString('thanks|maple-ring|c2'));
  const out = [];
  let deck = [];
  const deal = () => { if (!deck.length) { deck = [...Array(12).keys()]; for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } } return deck.pop(); };
  const fits = c => {
    const r = bodyR(c.s);
    if (c.y + r > FLOOR_Y || c.y - 0.45 * c.s < CEIL_Y) return false;
    if (ringE(c.x, c.y) > 1) return false;
    if (insideLetters(c.x, c.y, r) > 0.45) return false;
    const L = [...out, c];
    if (coverOf(L, L.length - 1) > MAX_COVER) return false;
    for (let i = 0; i < out.length; i++) if (coverOf(L, i) > MAX_COVER) return false;
    return true;
  };
  for (let guard = 0; out.length < n && guard < n * 4; guard++) {
    let best = null, bestD = -Infinity;
    for (let t = 0; t < 400; t++) {
      const x = RING.cx + (R() * 2 - 1) * RING.ax, y = RING.top + R() * (RING.bottom - RING.top);
      const low = y > 86, s = low ? lerp(LEAF_S.low[0], LEAF_S.low[1], R()) : lerp(LEAF_S.min, LEAF_S.max, R());
      const c = { x, y, s };
      if (!fits(c)) continue;
      // (the closest neighbour's gap, as a share of the radii: a light overlap — ~ −0.3 r — packs the ring with every shape still whole)
      const g = out.length ? Math.min(...out.map(o => (Math.hypot(o.x - x, o.y - y) - bodyR(o.s) - bodyR(s)) / ((bodyR(o.s) + bodyR(s)) / 2))) : 0;
      const score = -Math.abs(g - GAP);
      if (score > bestD) { bestD = score; best = c; }
    }
    if (!best) break;
    out.push({ ...best, rot: (R() * 2 - 1) * 0.6, flip: R() < 0.4, leaf: deal(), z: R() });
  }
  // the build-up's order: centre-out (from behind E–O to the ends), a little seeded jitter
  for (const o of out) o.order = Math.hypot((o.x - RING.cx) / RING.ax, (o.y - RING.cy) / (RING.bottom - RING.top)) + 0.12 * R();
  const byOrder = [...out].sort((a, b) => a.order - b.order);
  byOrder.forEach((o, i) => { o.order = (i + 0.5) / byOrder.length; });
  return out.sort((a, b) => a.z - b.z);
}

/** PURE — the leaves up at share k (0..1): the first ⌈k·n⌉ in centre-out order */
export const leavesUp = (L, k) => (k <= 0 ? [] : L.filter(o => o.order <= clamp01(k) + 1e-9));

let LAYOUT = null;
let atlasP = null;
function loadAtlas() {
  if (atlasP) return atlasP;
  atlasP = (async () => {
    const [rects, img] = await Promise.all([
      fetch(`${ATLAS}.json`).then(r => (r.ok ? r.json() : Promise.reject(new Error(`leaves.json ${r.status}`)))),
      new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => no(new Error('leaves.webp')); i.src = `${ATLAS}.webp`; }),
    ]);
    return { img, rects: rects.rects };
  })();
  atlasP.catch(() => { atlasP = null; });
  return atlasP;
}

export function createLeafBank() {
  let host = null, box = null, ro = null, wpx = 0, atlas = null, loading = false, failed = 0;
  // the canvases up: [{ cv, look: 'night' | 'day', key, born }] (the newest last); a fade = a new pair over the old one
  let layers = [];
  let curKey = '', want = null, dayOp = -1, litOp = -1, bakes = 0, lastBakeMs = 0;
  const LF = { cols: '', f: null };

  function setHost(el) {
    if (el === host && box && box.isConnected) return;
    detach();
    host = el; if (!host || typeof document === 'undefined') return;
    box = document.createElement('div'); box.className = 'nd-leafbank'; box.setAttribute('aria-hidden', 'true');
    // (z-index −1 inside .nd-logo-wrap — a stacking context: behind the SVG's tubes + glow, in front of the sky)
    Object.assign(box.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px', zIndex: '-1' });
    host.prepend(box);
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w && Math.abs(w - wpx) > 0.25) { wpx = w; curKey = ''; } }); ro.observe(host); }
    wpx = host.clientWidth || 0;            // (once, at attach — never in the frame loop)
    curKey = '';
  }
  function free(list) { for (const l of list) { freeCanvases(l.cv); l.cv.remove(); } }
  function detach() { if (ro) { ro.disconnect(); ro = null; } free(layers); layers = []; if (box) box.remove(); box = null; host = null; curKey = ''; }

  /** one look's bake of the leaves up (k) → a canvas */
  function bake(look, k, o) {
    const dpr = o.dpr, kk = wpx / VB.w, sc = kk * dpr;
    const PW = Math.ceil((BANK_BOX.x1 - BANK_BOX.x0) * sc), PH = Math.ceil((BANK_BOX.y1 - BANK_BOX.y0) * sc);
    const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
    Object.assign(cv.style, { position: 'absolute', left: `${((BANK_BOX.x0 - VB.x) * kk).toFixed(2)}px`, top: `${((BANK_BOX.y0 - VB.y) * kk).toFixed(2)}px`,
      width: `${(PW / dpr).toFixed(2)}px`, height: `${(PH / dpr).toFixed(2)}px`, opacity: '0', willChange: 'opacity' });
    const x = safeCtx(cv);
    if (!x) return cv;
    x.setTransform(sc, 0, 0, sc, -BANK_BOX.x0 * sc, -BANK_BOX.y0 * sc);
    const night = look === 'night', light = night ? o.light : null;
    // one leaf at a time through a small tinting canvas (the multiply + the alpha restored), its soft shadow on the leaves beneath
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = 2;
    const tx = safeCtx(tmp); if (!tx) return cv;
    for (const L of leavesUp(LAYOUT, k)) {
      const r = atlas.rects[L.leaf]; if (!r) continue;
      const [rx, ry, rw, rh] = r, s = L.s / Math.max(rw, rh), w = rw * s, hgt = rh * s;
      const pw = Math.max(2, Math.ceil(w * sc)), ph = Math.max(2, Math.ceil(hgt * sc));
      tmp.width = pw; tmp.height = ph;
      tx.globalCompositeOperation = 'source-over'; tx.drawImage(atlas.img, rx, ry, rw, rh, 0, 0, pw, ph);
      let mul;
      if (night) {
        // NIGHT (FR7 FIXES C2 — the owner: "a dark brown fuzzy halo"): the leaves keep their REAL colours, lit warm by the tubes — the nearest
        // brightest, a GENTLE falloff: the furthest ≥ ~55 % of their daylight (NIGHT_FLOOR), never brown / olive / black
        const li = light.at(L.x, L.y), t = Math.pow(clamp01(li.i / 1.2), 0.8);
        const lc = [0.86 + 0.14 * li.r / 255, 0.8 + 0.16 * li.g / 255, 0.68 + 0.2 * li.b / 255];
        mul = [lerp(NIGHT_FLOOR[0], lc[0], t), lerp(NIGHT_FLOOR[1], lc[1], t), lerp(NIGHT_FLOOR[2], lc[2], t)];
      } else mul = [0.98, 0.95, 0.9];                                   // (DAY: daylight — the leaves' own colours, a touch of warmth)
      tx.globalCompositeOperation = 'multiply'; tx.fillStyle = `rgb(${Math.round(mul[0] * 255)},${Math.round(mul[1] * 255)},${Math.round(mul[2] * 255)})`; tx.fillRect(0, 0, pw, ph);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(atlas.img, rx, ry, rw, rh, 0, 0, pw, ph);
      x.save();
      x.translate(L.x, L.y); x.rotate(L.rot); if (L.flip) x.scale(-1, 1);
      // the overlap shading: a soft darkening cast down onto the leaf beneath (the canvas shadow — baked once)
      // (C2: lighter — the shapes stay crisp; the old night shadow helped turn the bank into mush)
      x.shadowColor = night ? 'rgba(14,4,0,0.4)' : 'rgba(46,22,6,0.3)'; x.shadowBlur = 4 * dpr * kk; x.shadowOffsetX = 0.8 * dpr * kk; x.shadowOffsetY = 2 * dpr * kk;
      x.drawImage(tmp, -w / 2, -hgt / 2, w, hgt);
      x.restore();
    }
    // THE NEON STAYS READABLE: a slight dark halo just round the tubes (the bank pushed back where a letter's stroke runs) — measured
    // (docs/harbor/passes/fr7-fixes-c.md): without it a gold tube over a gold leaf at night lost its edge
    const haloA = night ? o.halo : o.haloDay;
    if (haloA > 0) {
      x.save();
      x.globalCompositeOperation = 'source-atop';
      x.lineCap = 'round'; x.lineJoin = 'round';
      // (C2: a SMOOTH fall-off — the old stepped strokes read as dark brown outlines round every letter: each pass is now a blurred
      //  stroke's SHADOW (the stroke itself drawn far off the canvas, its shadow brought back — a gaussian, baked once), dark next to the
      //  tube, gone ~14 pt out where the leaves' own colour takes over; measured: the cores vs what's beside them ≥ a plain night's)
      const OFF = 4000;
      for (const [wd, blur, a] of HALO_PASSES) {
        x.shadowColor = night ? `rgba(16,6,2,${(haloA * a).toFixed(3)})` : `rgba(40,22,10,${(haloA * a).toFixed(3)})`;
        x.shadowBlur = blur * sc; x.shadowOffsetX = -OFF * sc; x.shadowOffsetY = 0;
        x.strokeStyle = '#000'; x.lineWidth = wd;
        for (const P of tubePaths()) { x.beginPath(); P.forEach(([px, py], i) => (i ? x.lineTo(px + OFF, py) : x.moveTo(px + OFF, py))); x.stroke(); }
      }
      x.restore();
    }
    tmp.width = tmp.height = 0;
    return cv;
  }

  /**
   * once a frame (scene-holiday.js#dressTick): env = { k (the leaves' share 0..1, 0 = none), day (0..1), lit (the sign's level 0..1), gold,
   * cols (the letters' light: 4 × [r,g,b]), dpr (the dress resolution), tier, motion }
   */
  function frame(env) {
    if (!host || !box) return;
    const k = clamp01(env.k || 0);
    if (k <= 0) { if (layers.length) { free(layers); layers = []; curKey = ''; } return; }
    if (!atlas) {
      if (!loading && failed < 3) { loading = true; loadAtlas().then(a => { atlas = a; loading = false; }).catch(e => { loading = false; failed++; console.warn('[harbor] leaves', e && e.message); }); }
      return;
    }
    if (!wpx) return;
    if (!LAYOUT) LAYOUT = leafLayout();
    const day = clamp01(env.day || 0), dpr = Math.max(1, Math.min(env.dpr || 2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
    // which looks are needed: night under, day over (twilight: both)
    const looks = [...(day < 0.98 ? ['night'] : []), ...(day > 0.02 ? ['day'] : [])];
    const cols = (env.cols || [GOLD, GOLD, GOLD, GOLD]).map(c => c.join(',')).join('|');
    const key = `${Math.round(k * 1000)}|${looks.join('+')}|${cols}|${env.gold ? 'g' : 'p'}|${wpx.toFixed(1)}|${dpr}`;
    if (key !== curKey) {
      const t0 = performance.now();
      if (LF.cols !== cols) { LF.cols = cols; LF.f = lightField(env.cols || [GOLD, GOLD, GOLD, GOLD]); }
      const o = { dpr, light: LF.f, halo: env.gold ? knobHalo().night : knobHalo().pink, haloDay: knobHalo().day };
      const same = layers.length && layers.every(l => l.k === Math.round(k * 1000));   // (only the looks / the size changed: no fade — swap)
      const fresh = looks.map(look => ({ look, k: Math.round(k * 1000), cv: bake(look, k, o) }));
      // night first (under), day over it
      for (const f of fresh) box.append(f.cv);
      const old = layers;
      layers = fresh;
      const fade = !same && env.motion !== false ? knob('thanksgiving.leaves').fadeS * 1000 : 0;
      dayOp = -1; litOp = -1;
      setOps(day, env.lit, fade);
      if (old.length) { if (fade) setTimeout(() => free(old), fade + 200); else free(old); }
      curKey = key; bakes++; lastBakeMs = +(performance.now() - t0).toFixed(1);
      return;
    }
    setOps(day, env.lit, 0);
  }
  function setOps(day, lit, fadeMs) {
    const d = Math.round(day * 50) / 50, l = Math.round(clamp01(lit == null ? 1 : lit) * 20) / 20;
    if (d === dayOp && l === litOp) return;
    dayOp = d; litOp = l;
    for (const L of layers) {
      const op = L.look === 'day' ? (layers.some(o => o.look === 'night') ? d : 1) : (0.72 + 0.28 * l);   // (C2: a dimmer sign still shows the leaves' colours — never a faint ghost)
      L.cv.style.transition = fadeMs ? `opacity ${fadeMs}ms ease-in-out` : 'none';
      if (fadeMs) { void L.cv.offsetWidth; }                                   // (the fade starts from 0: one style flush, only at a bake)
      L.cv.style.opacity = op.toFixed(3);
    }
  }

  return {
    setHost, frame, destroy: detach,
    debug: () => ({ on: layers.length > 0, layers: layers.map(l => ({ look: l.look, k: l.k / 1000, w: l.cv.width, h: l.cv.height, op: l.cv.style.opacity })), atlas: !!atlas, failed, bakes, lastBakeMs, leaves: LAYOUT ? LAYOUT.length : 0 }),
  };
}

/** the halo's strength (the timetable doesn't time it: a look constant, measured — night / day) */
// (C2: the GOLD tubes over yellow + gold leaves need the strong halo — measured; the PINK build-up nights have the hue contrast already
//  (Nov 18: 7.0 : 1 with the strong halo, 8.5 without the bank) and the strong halo turned their middle leaves dark: a lighter one there)
const knobHalo = () => ({ night: 0.95, pink: 0.4, day: 0.6 });
/** the halo's passes: [the stroke's full width, its blur (logo units), strength] — a wide soft one, then a tight dark one */
const HALO_PASSES = [[28, 18, 1], [18, 9, 1], [10, 4, 1]];

let PATHS = null;
/** the letters' tube centrelines (logo units) */
function tubePaths() {
  if (PATHS) return PATHS;
  PATHS = [];
  for (const L of LOGO_LETTERS) for (const p of flattenPath(L.d, 1, L.x, 0, 2)) PATHS.push(p.pts);
  return PATHS;
}
