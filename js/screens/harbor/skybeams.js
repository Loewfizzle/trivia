// CITY 2.0 — THE HARBOR, NEON PASS 4: THE SKY BEAMS (the owner's idea — the Luxor sky-beam look; docs/harbor.md#neon-pass-4).
// On party nights EVERY hero + word tower shoots a STATIONARY VERTICAL BEAM straight up from the crown, in that tower's colour
// (on a party night its colour in the rotating palette: it changes with the show): the clearest "it's a party" sign in a single
// frame. A soft volumetric beam (a bright core + a wide soft glow, brighter on a hazy night), fading out with height, rising to the
// top of the screen. NEON PASS 5 (the owner's whole-sky rule, plan.md): the beams rise BEHIND the NEON sign and the tagline (the
// sign is the page above the canvas: it always draws on top) — NEON PASS 6: and behind the music + menu buttons too. (Neon Pass
// 4 stopped a beam under the sign at the tagline, so a phone showed 2–3 — the owner's iPhone, one.)
// it PULSES on the beat (the hard pulse), takes the show's colour sweeps, switches on one by one through the warm-up and stands
// together from the 11 pm peak; the sweeping searchlights take turns with it (core/harbor-show.js: out.beams / out.lights).
// A REUSABLE SYSTEM: set({ count, colours, ids, width }) — holidays (red / white / blue on July 4th) and the Sept 11 Tribute in
// Light (two white beams, plan.md) use the same beams. Cheap: one cached white beam sprite tinted per colour (additive).
//   layout(L, { textRects, corner, W, H })   the candidate towers (their crowns' tops on screen) + each beam's reach
//   draw(c, f)   f: { signs ([rects]: a roof sign over a crown — the beam rises from above it), k (0..1 strength), on (how many are on, fractional: one by one), cols(ids) → [rgb] per beam, punch,
//                haze (0..1), motion, tier, fade }
import { project } from '../../core/harbor-layout.js';
import { ctx2d, safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** the beam's soft foot (pt at the reference scale): the last stretch above the crown fades out instead of ending on a line */
const FOOT = 16;

export function createSkyBeams() {
  let beams = [], K = 1, cand = [];
  const cfg = { count: null, colours: null, ids: null, width: 1 };
  const sprites = new Map();             // colour key → the beam sprite (a horizontal profile × a vertical fade), white-hot core
  let flare = null;

  // the beam: 64 × 256, a soft wide glow + a narrow bright core, fading upward (the base at the bottom)
  // (C1.5 — the party's colour sweeps asked for a new sprite nearly every frame of a fade: the shape is now computed ONCE (SHAPE:
  // each pixel's alpha + how far its colour runs to white — the beam is linear in its colour), so a new colour is a few multiplies
  // a pixel, the foot comes from the same table (no getImageData readback), and the cache drops its oldest entry instead of all
  // of them — the same pixels as before, a fraction of the work)
  const SW = 64, SH = 256;
  let SHAPE = null;
  function shape() {
    if (SHAPE) return SHAPE;
    const A = new Uint8ClampedArray(SW * SH), HOT = new Float64Array(SW * SH);
    for (let j = 0; j < SH; j++) {
      const v = 1 - j / (SH - 1);                                   // 0 at the base (the bottom row) → 1 at the top
      // (bright for most of its height, then a long soft fade — gone at the top)
      const fade = (1 - v * v * 0.55) * Math.pow(1 - v, 0.7);
      for (let i = 0; i < SW; i++) {
        const u = Math.abs(i + 0.5 - SW / 2) / (SW / 2);            // 0 at the centre → 1 at the edge
        // (a wide soft glow — the beam's light in the haze — a mid glow, a narrow white-hot core)
        const glow = Math.pow(1 - u, 2.2) * 0.3 + Math.pow(Math.max(0, 1 - u * 3), 2) * 0.45, core = Math.max(0, 1 - u * 12) ** 1.4;
        A[j * SW + i] = Math.round(clamp01((glow + core) * fade) * 255);
        HOT[j * SW + i] = core * 0.55;                              // the core runs toward white
      }
    }
    return (SHAPE = { A, HOT });
  }
  const CACHE = 40;
  function spriteFor(col) {
    const key = col.join(',');
    const hit = sprites.get(key);
    if (hit) return hit;
    const w = SW, h = SH, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = ctx2d(cv);
    if (!x) { cv.width = 0; return null; }                          // (iOS out of canvas memory: no beam, never a thrown frame)
    const { A, HOT } = shape(), img = x.createImageData(w, h), d = img.data;
    const r = col[0], g = col[1], b = col[2], dr = 255 - r, dg = 255 - g, db = 255 - b;
    for (let p = 0, o = 0; p < w * h; p++, o += 4) {
      const hot = HOT[p];
      d[o] = Math.round(r + dr * hot); d[o + 1] = Math.round(g + dg * hot); d[o + 2] = Math.round(b + db * hot); d[o + 3] = A[p];
    }
    x.putImageData(img, 0, 0);
    cv._col = [r, g, b];
    if (sprites.size >= CACHE) { const [k0, s0] = sprites.entries().next().value; s0.width = 0; sprites.delete(k0); }
    sprites.set(key, cv);
    return cv;
  }
  // the FOOT (NEON PASS 6): the beam's bottom row, fading out downward (smoothstep) — drawn under the main sprite's last row, so the
  // beam melts into the crown instead of ending on a line (its row from SHAPE: the sprite's own last row, never read back)
  const feet = new WeakMap();
  function footFor(sp) {
    if (feet.has(sp)) return feet.get(sp);
    const w = sp.width, h = 32, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = ctx2d(cv);
    if (!x || !sp._col) { cv.width = 0; feet.set(sp, null); return null; }
    const { A, HOT } = shape(), [r, g, b] = sp._col, row = (SH - 1) * SW, img = x.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) {
      const v = j / (h - 1), k = 1 - v * v * (3 - 2 * v);           // 1 at the top (meets the beam) → 0 at the crown
      for (let i = 0; i < w; i++) {
        const o = (j * w + i) * 4, hot = HOT[row + i];
        d[o] = Math.round(r + (255 - r) * hot); d[o + 1] = Math.round(g + (255 - g) * hot); d[o + 2] = Math.round(b + (255 - b) * hot); d[o + 3] = Math.round(A[row + i] * k);
      }
    }
    x.putImageData(img, 0, 0);
    feet.set(sp, cv);
    return cv;
  }
  function flareSprite() {
    if (flare) return flare;
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return (flare = c);
  }

  function layout(L, o) {
    const cam = L.cam; K = cam.F / 600;
    const corner = o.corner || null;
    cand = [];
    for (const t of L.towers) {
      // (DT1 — the owner: the gap in the row of beams by the thin glass tower looked odd: glassL gets one too — the farthest tower,
      // so a thinner, fainter, ice-white beam that still joins the colour sweeps)
      const far = t.id === 'glassL' && !cam.wide;
      if (!['hero', 'word', 'pano'].includes(t.rank) && !(t.rank === 'modern' && cam.wide) && !far) continue;
      const tp = t.tiers[t.tiers.length - 1], cx = (tp.x0 + tp.x1) / 2;
      const [x, y] = project(cam, cx, tp.y0 + tp.h + (tp.crown ? tp.crown.h : 0) + (t.needle || 0), tp.z0);
      if (x < 6 || x > cam.W - 6) continue;
      const under = false;
      // (NEON PASS 6, the owner: every beam rises to the top — the one under the music + menu buttons too, BEHIND them: the canvas is
      // under the page, the buttons stay on top and tappable)
      const top = 0;
      if (y - top < 40 * K) continue;                                // (too little sky above it: no beam)
      cand.push({ id: t.id, x, y, top, under, len: y - top, far });
    }
    // the ones rising free of the sign first (the tall beams), then the tallest — spread out (never two within ~40 pt)
    cand.sort((a, b) => (a.under - b.under) || a.y - b.y);
    const picked = [];
    for (const c of cand) if (!picked.some(p => Math.abs(p.x - c.x) < 40 * K)) picked.push(c);
    cand = picked;
    pick();
  }
  function pick() {
    const list = cfg.ids ? cfg.ids.map(id => cand.find(c => c.id === id)).filter(Boolean) : cand;
    const n = cfg.count != null ? cfg.count : list.length;            // (NEON PASS 5: every hero + word tower)
    beams = list.slice(0, n);
    // (the switch-on order: the beams that rise free of the sign first, then the rest — left to right)
    beams.sort((a, b) => (a.under - b.under) || a.x - b.x);
  }

  function draw(c, f) {
    if (!beams.length || f.k <= 0.004) return;
    const cols = f.cols ? f.cols(beams.map(b => b.id)) : beams.map(() => [255, 255, 255]);
    const haze = 1 + 0.7 * clamp01(f.haze || 0);
    const pulse = 0.55 + 0.75 * (f.punch || 0);                       // (NEON PASS 5: a clear punch on the strong beats)
    c.save(); c.globalCompositeOperation = 'lighter';
    const rs = f.signs || [];
    beams.forEach((b, i) => {
      const on = clamp01((f.on ?? beams.length) - i);
      // (a roof sign standing over this crown: the beam starts above it — the sign stands in front of the beam's root)
      let y0 = b.y;
      for (const r of rs) if (b.x > r.x - 2 && b.x < r.x + r.w + 2 && r.y < y0 && r.y + r.h > y0 - 60 * K) y0 = Math.min(y0, r.y - 3 * K);
      if (y0 - b.top < 24 * K) return;
      const a = f.k * on * f.fade;
      if (a < 0.01) return;
      let col = (cfg.colours && cfg.colours[i % cfg.colours.length]) || cols[i] || [255, 255, 255];
      if (b.far) col = col.map((v, j) => Math.round([224, 240, 255][j] * 0.72 + v * 0.28));      // (the glass tower's: ice-white, a touch of the sweep)
      const sp = spriteFor(col.map(v => Math.round(v / 8) * 8)), gw = 64 * K * cfg.width * (0.92 + 0.2 * (f.punch || 0)) * (b.far ? 0.5 : 1);
      if (!sp) return;
      c.globalAlpha = Math.min(1, a * pulse * haze * 0.95 * (b.far ? 0.5 : 1));
      // (NEON PASS 6, the owner: the beam ended in a sharp horizontal line at the crown — its last FOOT pt now come from a fade sprite:
      // the same beam, fading out softly into the crown; everything above exactly as before)
      const ft = FOOT * K, yf = y0 + 2 - ft;
      // (SP: a cloud overhead takes the beam — bright up to its belly, then only what gets through it: clouds.js#rayHit)
      const hit = f.hit && yf - b.top > 30 * K ? f.hit(b.x, yf, 0, -1, yf - b.top) : null;
      if (hit) {
        // (in pieces: full up to the first cloud, then what gets through it, then through the next)
        const H = sp.height - 1, a0 = c.globalAlpha, rowOf = y => H * (y - b.top) / (yf - b.top);
        let yBot = yf, keep = 1;
        for (let h = hit; h; h = h.next) {
          const yc = Math.max(b.top + 1, yf - h.d), r0 = rowOf(yc), r1 = rowOf(yBot);
          if (yBot - yc > 0.5) { c.globalAlpha = a0 * keep; c.drawImage(sp, 0, r0, sp.width, r1 - r0, b.x - gw / 2, yc, gw, yBot - yc); }
          yBot = yc; keep *= 0.1 + 0.9 * h.trans;
        }
        if (yBot - b.top > 0.5) { c.globalAlpha = a0 * keep; c.drawImage(sp, 0, 0, sp.width, rowOf(yBot), b.x - gw / 2, b.top, gw, yBot - b.top); }
        c.globalAlpha = a0;
      } else c.drawImage(sp, 0, 0, sp.width, sp.height - 1, b.x - gw / 2, b.top, gw, yf - b.top);
      const fs = footFor(sp);
      if (fs) c.drawImage(fs, b.x - gw / 2, yf, gw, ft + 3 * K);
      // the beam's root: a bright flare where it leaves the crown (it punches on the beat)
      const r = (5 + 5 * (f.punch || 0)) * K * (b.far ? 0.55 : 1);
      c.globalAlpha = Math.min(1, a * (0.55 + 0.45 * (f.punch || 0)) * (b.far ? 0.6 : 1));
      c.drawImage(flareSprite(), b.x - r, y0 - r * 0.7, r * 2, r * 2);
      // (SP: the cloud it goes into lights up there — clouds.js#beamPatch)
      // (the patch's size from the beam's own width, not its beat pulse — the beat is only its brightness)
      if (hit && f.patch) { let k = Math.min(1, a * pulse * haze * (b.far ? 0.5 : 1)); const pw = 64 * K * cfg.width * (b.far ? 0.5 : 1); for (let h = hit; h; h = h.next) { f.patch(h, col, k, pw); k *= 0.1 + 0.9 * h.trans; } }
    });
    c.restore();
  }

  return {
    layout, draw,
    count: () => beams.length,
    /** holidays / CITY CONTROL / the tribute: { count, colours: [[r,g,b]…], ids: [tower ids], width } (null resets each) */
    set(o = {}) { for (const k of ['count', 'colours', 'ids', 'width']) if (k in o) cfg[k] = o[k] == null ? (k === 'width' ? 1 : null) : o[k]; pick(); },
    debug: () => ({ beams: beams.map(b => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y), top: Math.round(b.top), under: b.under })), cand: cand.length, cfg: { ...cfg } }),
    destroy() { for (const s of sprites.values()) s.width = 0; sprites.clear(); if (flare) flare.width = 0; flare = null; },
  };
}
