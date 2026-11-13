// FR7 FIXES C — THANKSGIVING's SIGN: THE MAPLE LEAVES (the owner, Nov 13 — "the wreath looks terrible": the harvest wreath + the wheat swags
// RETIRED). A dense bank of REAL maple leaves (Grok's — the atlas assets/city/thanksgiving/leaves.webp, built by scripts/build-thanksgiving-leaves.mjs)
// BEHIND the NEON letters: a loose wide oval hugging the four letters, thickest behind the middle (E–O), thinning at the edges — never in front of
// a tube, never over SPEAKEASY. In LOGO UNITS (ui/logo.js: the letters in 0..332 × 0..100, y down).
//   THE LAYOUT   ONE seeded layout (the same on every phone — PURE: leafLayout()), each leaf ~24–42 pt on the phone, all 12 leaves used, turned ±40°;
//                its ORDER centre-out: the bank fills in over the build-up (core/harbor-holiday.js#thanksLeaves — the timetable's `thanksgiving.leaves`)
//   THE BAKE     the leaves up now drawn ONCE into a canvas (safeCtx) per look — never leaf by leaf per frame: NIGHT = lit by the tubes (the sign's
//                own light field — signdress.js#lightField: near a tube warm + bright, further back a deep warm red-brown, never olive / green /
//                black) + a soft dark halo just round the tubes (the letters read over the bank); DAY = the leaves in daylight, natural colours
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
export const BANK_BOX = Object.freeze({ x0: -108, y0: -76, x1: 440, y1: 138 });
const VB = { x: -26, y: -30, w: 384 };
/** the oval the leaves sit in: its middle behind E–O, a loose wide hug of the four letters */
export const OVAL = Object.freeze({ cx: 166, cy: 50, rx: 206, ry: 72, yMin: -44, yMax: 106 });
export const LEAF_N = 92;
/** the tubes' gold for THE GOLD WEEK (the light the night's leaves are lit by — css/title.css .sg-thanksgiving) */
export const GOLD = Object.freeze([255, 190, 58]);
const ATLAS = '/assets/city/thanksgiving/leaves';

/** PURE — the seeded bank: [{ x, y, s (the long side, logo units), rot (rad), flip, leaf (0..11), order (0..1, centre-out), z }] */
export function leafLayout(n = LEAF_N) {
  const R = rngFrom(hashString('thanks|maple-bank'));
  const out = [];
  let tries = 0;
  // the leaves' kinds: all 12, each used about the same (a shuffled deck, dealt again when empty) — the reds + the golds balanced
  let deck = [];
  const deal = () => { if (!deck.length) { deck = [...Array(12).keys()]; for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } } return deck.pop(); };
  while (out.length < n && tries < 20000) {
    tries++;
    const x = lerp(OVAL.cx - OVAL.rx * 1.2, OVAL.cx + OVAL.rx * 1.2, R()), y = lerp(OVAL.yMin, OVAL.yMax, R());
    const ex = (x - OVAL.cx) / OVAL.rx, ey = (y - OVAL.cy) / OVAL.ry, e2 = ex * ex + ey * ey;
    // the rim WAVES (a few lobes round the oval — never a straight top edge) + a few stragglers past it: no hard boundary
    const wave = 1 + 0.1 * Math.sin(Math.atan2(ey, ex) * 5 + 1.3) + 0.05 * Math.sin(Math.atan2(ey, ex) * 9 + 0.4), e = Math.sqrt(e2) / wave;
    if (e > 1.08) continue;
    // thickest behind the middle (E–O), thinning naturally to the ends + the rim
    const dens = Math.exp(-1.15 * ex * ex - 1.4 * ey * ey) * (e < 0.75 ? 1 : e < 1 ? 1 - 0.6 * (e - 0.75) / 0.25 : 0.4 * (1.08 - e) / 0.08);
    if (R() > dens) continue;
    const mid = Math.exp(-1.6 * ex * ex - 1.2 * ey * ey);
    const s = lerp(31, 46, mid) * (0.86 + 0.28 * R());                 // (~24–42 pt on a 390 phone: the PHONE-FIRST rule — it reads as a maple leaf)
    // a little room round each (loose overlap, never a clump of ten on one spot)
    if (out.some(o => Math.hypot(o.x - x, o.y - y) < 0.33 * (o.s + s) / 2)) continue;
    // (an edge leaf always touches the bank — never a lone floater off its end)
    if (e > 0.9 && !out.some(o => Math.hypot(o.x - x, o.y - y) < 0.8 * (o.s + s) / 2)) continue;
    out.push({ x, y, s, rot: (R() * 2 - 1) * 0.7, flip: R() < 0.4, leaf: deal(), order: e + 0.18 * R(), z: R() });
  }
  // the build-up's order: centre-out (rank → 0..1)
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
        // NIGHT: the tubes' light at the leaf — near a tube warm + bright, further back a deep warm red-brown (the floor keeps red: never olive)
        const li = light.at(L.x, L.y), t = Math.pow(clamp01(li.i / 1.5), 1.25);
        const lc = [0.5 + 0.42 * li.r / 255, 0.5 + 0.42 * li.g / 255, 0.5 + 0.42 * li.b / 255];
        const floor = [0.3, 0.155, 0.1];
        mul = [lerp(floor[0], lc[0], t), lerp(floor[1], lc[1] * 0.97, t), lerp(floor[2], lc[2] * 0.9, t)];
      } else mul = [0.98, 0.95, 0.9];                                   // (DAY: daylight — the leaves' own colours, a touch of warmth)
      tx.globalCompositeOperation = 'multiply'; tx.fillStyle = `rgb(${Math.round(mul[0] * 255)},${Math.round(mul[1] * 255)},${Math.round(mul[2] * 255)})`; tx.fillRect(0, 0, pw, ph);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(atlas.img, rx, ry, rw, rh, 0, 0, pw, ph);
      x.save();
      x.translate(L.x, L.y); x.rotate(L.rot); if (L.flip) x.scale(-1, 1);
      // the overlap shading: a soft darkening cast down onto the leaf beneath (the canvas shadow — baked once)
      x.shadowColor = night ? 'rgba(14,4,0,0.62)' : 'rgba(46,22,6,0.34)'; x.shadowBlur = 5 * dpr * kk; x.shadowOffsetX = 0.9 * dpr * kk; x.shadowOffsetY = 2.2 * dpr * kk;
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
      for (const [wd, a] of [[22, 0.35], [14, 0.6], [8, 1]]) {
        x.strokeStyle = night ? `rgba(16,6,2,${(haloA * a).toFixed(3)})` : `rgba(40,22,10,${(haloA * a).toFixed(3)})`; x.lineWidth = wd;
        for (const P of tubePaths()) { x.beginPath(); P.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
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
    const key = `${Math.round(k * 1000)}|${looks.join('+')}|${cols}|${wpx.toFixed(1)}|${dpr}`;
    if (key !== curKey) {
      const t0 = performance.now();
      if (LF.cols !== cols) { LF.cols = cols; LF.f = lightField(env.cols || [GOLD, GOLD, GOLD, GOLD]); }
      const o = { dpr, light: LF.f, halo: knobHalo().night, haloDay: knobHalo().day };
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
      const op = L.look === 'day' ? (layers.some(o => o.look === 'night') ? d : 1) : (0.38 + 0.62 * l);
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
const knobHalo = () => ({ night: 0.72, day: 0.4 });

let PATHS = null;
/** the letters' tube centrelines (logo units) */
function tubePaths() {
  if (PATHS) return PATHS;
  PATHS = [];
  for (const L of LOGO_LETTERS) for (const p of flattenPath(L.d, 1, L.x, 0, 2)) PATHS.push(p.pts);
  return PATHS;
}
