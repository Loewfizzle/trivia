// CITY 2.0 — THE HARBOR, NEON PASS 4: THE SKY BEAMS (the owner's idea — the Luxor sky-beam look; docs/harbor.md#neon-pass-4).
// On party nights 3–5 of the tall towers each shoot a STATIONARY VERTICAL BEAM straight up from the crown, in that tower's own
// neon colour: the clearest "it's a party" sign in a single frame. A soft volumetric beam (a bright core + a wide soft glow,
// brighter on a hazy night), fading out with height:
//   - under the sign's width it is gone by the tagline's bottom (it never cuts across the NEON word or the tagline);
//   - a tower outside the sign's width (the left edge's tower, the right word tower; the desktop's side towers) rises to the
//     top of the screen — clear of the corner buttons;
// it PULSES on the beat (the hard pulse), takes the show's colour sweeps, switches on one by one through the warm-up and stands
// together from the 11 pm peak; the sweeping searchlights take turns with it (core/harbor-show.js: out.beams / out.lights).
// A REUSABLE SYSTEM: set({ count, colours, ids, width }) — holidays (red / white / blue on July 4th) and the Sept 11 Tribute in
// Light (two white beams, plan.md) use the same beams. Cheap: one cached white beam sprite tinted per colour (additive).
//   layout(L, { textRects, corner, W, H })   the candidate towers (their crowns' tops on screen) + each beam's reach
//   draw(c, f)   f: { signs ([rects]: a roof sign over a crown — the beam rises from above it), k (0..1 strength), on (how many are on, fractional: one by one), cols(ids) → [rgb] per beam, punch,
//                haze (0..1), motion, tier, fade }
import { project } from '../../core/harbor-layout.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createSkyBeams() {
  let beams = [], K = 1, cand = [];
  const cfg = { count: null, colours: null, ids: null, width: 1 };
  const sprites = new Map();             // colour key → the beam sprite (a horizontal profile × a vertical fade), white-hot core
  let flare = null;

  // the beam: 48 × 256, a soft wide glow + a narrow bright core, fading upward (the base at the bottom)
  function spriteFor(col) {
    const key = col.join(',');
    if (sprites.has(key)) return sprites.get(key);
    const w = 64, h = 256, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), img = x.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) {
      const v = 1 - j / (h - 1);                                    // 0 at the base (the bottom row) → 1 at the top
      // (bright for most of its height, then a long soft fade — gone at the top)
      const fade = (1 - v * v * 0.55) * Math.pow(1 - v, 0.7);
      for (let i = 0; i < w; i++) {
        const u = Math.abs(i + 0.5 - w / 2) / (w / 2);              // 0 at the centre → 1 at the edge
        // (a wide soft glow — the beam's light in the haze — a mid glow, a narrow white-hot core)
        const glow = Math.pow(1 - u, 2.2) * 0.3 + Math.pow(Math.max(0, 1 - u * 3), 2) * 0.45, core = Math.max(0, 1 - u * 12) ** 1.4;
        const a = clamp01((glow + core) * fade);
        const hot = core * 0.55;                                    // the core runs toward white
        const o = (j * w + i) * 4;
        d[o] = Math.round(col[0] + (255 - col[0]) * hot); d[o + 1] = Math.round(col[1] + (255 - col[1]) * hot); d[o + 2] = Math.round(col[2] + (255 - col[2]) * hot);
        d[o + 3] = Math.round(a * 255);
      }
    }
    x.putImageData(img, 0, 0);
    if (sprites.size > 24) { for (const s of sprites.values()) s.width = 0; sprites.clear(); }
    sprites.set(key, cv);
    return cv;
  }
  function flareSprite() {
    if (flare) return flare;
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return (flare = c);
  }

  function layout(L, o) {
    const cam = L.cam; K = cam.F / 600;
    const tr = o.textRects || {}, tag = tr.tag && tr.tag.h > 0 ? tr.tag : null, neon = tr.neon || null, word = tr.word || null;
    // the sign's span (the NEON word, SPEAKEASY, the tagline) + a margin: a beam under it stops at the tagline's bottom
    const spans = [neon, word, tag].filter(Boolean);
    const sx0 = spans.length ? Math.min(...spans.map(r => r.x)) - 9 * K : cam.W * 0.15, sx1 = spans.length ? Math.max(...spans.map(r => r.x + r.w)) + 9 * K : cam.W * 0.85;
    const stopY = tag ? tag.y + tag.h + 6 : neon ? neon.y + neon.h + 40 : cam.H * 0.3;
    const corner = o.corner || null;
    cand = [];
    for (const t of L.towers) {
      if (!['hero', 'word', 'pano'].includes(t.rank) && !(t.rank === 'modern' && cam.wide)) continue;
      const tp = t.tiers[t.tiers.length - 1], cx = (tp.x0 + tp.x1) / 2;
      const [x, y] = project(cam, cx, tp.y0 + tp.h + (tp.crown ? tp.crown.h : 0) + (t.needle || 0), tp.z0);
      if (x < 6 || x > cam.W - 6) continue;
      const under = x > sx0 && x < sx1;
      let top = under ? stopY : 0;
      if (!under && corner && x > corner.x - 10 && x < corner.x + corner.w + 10) top = corner.y + corner.h + 12;
      if (y - top < 40 * K) continue;                                // (too little sky above it: no beam)
      cand.push({ id: t.id, x, y, top, under, len: y - top });
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
    const n = cfg.count != null ? cfg.count : Math.max(3, Math.min(5, list.length));
    beams = list.slice(0, n);
    // (the switch-on order: the beams that rise free of the sign first, then the rest — left to right)
    beams.sort((a, b) => (a.under - b.under) || a.x - b.x);
  }

  function draw(c, f) {
    if (!beams.length || f.k <= 0.004) return;
    const cols = f.cols ? f.cols(beams.map(b => b.id)) : beams.map(() => [255, 255, 255]);
    const haze = 1 + 0.7 * clamp01(f.haze || 0);
    const pulse = 0.62 + 0.62 * (f.punch || 0);
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
      const col = (cfg.colours && cfg.colours[i % cfg.colours.length]) || cols[i] || [255, 255, 255];
      const sp = spriteFor(col.map(v => Math.round(v / 8) * 8)), gw = 64 * K * cfg.width * (0.92 + 0.2 * (f.punch || 0));
      c.globalAlpha = Math.min(1, a * pulse * haze * 0.95);
      c.drawImage(sp, b.x - gw / 2, b.top, gw, y0 - b.top + 2);
      // the beam's root: a bright flare where it leaves the crown (it punches on the beat)
      const r = (5 + 5 * (f.punch || 0)) * K;
      c.globalAlpha = Math.min(1, a * (0.55 + 0.45 * (f.punch || 0)));
      c.drawImage(flareSprite(), b.x - r, y0 - r * 0.7, r * 2, r * 2);
    });
    c.restore();
  }

  return {
    layout, draw,
    /** holidays / CITY CONTROL / the tribute: { count, colours: [[r,g,b]…], ids: [tower ids], width } (null resets each) */
    set(o = {}) { for (const k of ['count', 'colours', 'ids', 'width']) if (k in o) cfg[k] = o[k] == null ? (k === 'width' ? 1 : null) : o[k]; pick(); },
    debug: () => ({ beams: beams.map(b => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y), top: Math.round(b.top), under: b.under })), cand: cand.length, cfg: { ...cfg } }),
    destroy() { for (const s of sprites.values()) s.width = 0; sprites.clear(); if (flare) flare.width = 0; flare = null; },
  };
}
