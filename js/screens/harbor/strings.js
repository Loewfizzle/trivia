// CITY 2.0 — THE HARBOR, NEON PASS 4: STRING LIGHTS (the owner; docs/harbor.md#neon-pass-4). Round bulbs on a gently sagging
// wire along THE SPEAKEASY's roof edge (the big corner building in the foreground), a run up to the rooftop pole, a few loops
// draped down at the corner; a soft warm glow every night from dusk, lighting the roof edge with a faint warm glow below.
// PARTY NIGHTS: warm, colourful, changing — amber, pink, red, gold, a little violet — slowly cycling at the warm-up, chasing on the
// beat (and punching with it) at the peak; back to warm white after the 2 am wind-down.
// A REUSABLE SYSTEM: createStrings() takes any runs (screen-space catenaries between world points): Part 8's promenade strings and
// Part 11's holiday bulbs (Christmas C9s, Halloween orange / violet) reuse it — set({ scheme: 'warm'|'party'|'christmas'|
// 'halloween' }) or set({ colours: [[r,g,b]…] }).
//   layout(L)   the runs on screen (the speakeasy's parapet, the pole, the corner loops)
//   draw(c, f)  f: { k (0..1 lit), day (0..1), party: { on, energy, beats, beatU, punch } | null, t, motion, tier }
import { project } from '../../core/harbor-layout.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const SCHEMES = {
  warm: [[255, 214, 150]],
  party: [[255, 170, 60], [255, 70, 150], [255, 60, 70], [255, 206, 84], [176, 96, 255]],
  christmas: [[255, 60, 60], [80, 255, 120], [255, 214, 120], [90, 160, 255]],
  halloween: [[255, 140, 30], [170, 70, 255]],
};

export function createStrings() {
  let runs = [], bulbs = [], K = 1, cfg = { scheme: null, colours: null };
  const dots = new Map();
  // a bulb's light: a hot centre and a soft glow, per colour (cached)
  function dot(col) {
    const key = col.join(',');
    if (dots.has(key)) return dots.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,244,1)'); g.addColorStop(0.16, `rgba(${col},0.95)`); g.addColorStop(0.42, `rgba(${col},0.3)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    if (dots.size > 40) { for (const d of dots.values()) d.width = 0; dots.clear(); }
    dots.set(key, c);
    return c;
  }
  // a sagging run between two world points (u from 0 to 1): screen points + bulbs every `gap` world units
  function catenary(cam, a, b, sag, gap) {
    const n = 24, pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), z = a[2] + (b[2] - a[2]) * u;
      pts.push(project(cam, x, y, z));
    }
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), nb = Math.max(2, Math.round(len / gap));
    const bs = [];
    for (let i = 0; i <= nb; i++) { const u = (i + 0.5) / (nb + 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u) - 0.12, z = a[2] + (b[2] - a[2]) * u; bs.push(project(cam, x, y, z)); }
    return { pts, bs };
  }
  function layout(L) {
    const cam = L.cam, s = L.speakeasy, pl = L.roof.pole, z = s.z0 - 0.05, top = s.h + 0.55;
    K = cam.F / 600;
    runs = []; bulbs = [];
    const add = r => { runs.push(r.pts); for (const p of r.bs) if (p[0] > -6 && p[0] < cam.W + 6) bulbs.push({ x: p[0], y: p[1], i: bulbs.length }); };
    // the parapet run: swags between the parapet's posts every ~2.4 units, left (off the screen) → the corner
    const post = []; for (let u = 0; u <= 11.2 + 1e-6; u += 2.24) post.push(s.x0 + u);
    for (let i = 0; i + 1 < post.length; i++) add(catenary(cam, [post[i], top, z], [post[i + 1], top, z], 0.32, 0.42));
    // up to the rooftop pole (a long swag), and back down to the parapet's middle (a second, deeper swag)
    add(catenary(cam, [s.x1 - 0.1, top, z], [pl.x, s.h + pl.h, pl.z], 0.55, 0.42));
    add(catenary(cam, [pl.x, s.h + pl.h, pl.z], [s.x0 + 6.7, top + 0.1, z + 0.2], 0.9, 0.42));
    // the loops draped down at the corner (two short hanging loops on the face)
    add(catenary(cam, [s.x1 - 0.12, top - 0.05, z], [s.x1 - 1.3, top - 0.1, z], 0.55, 0.38));
    add(catenary(cam, [s.x1 - 1.3, top - 0.1, z], [s.x1 - 2.6, top - 0.05, z], 0.45, 0.38));
  }
  function colours() { return cfg.colours || SCHEMES[cfg.scheme] || null; }

  function draw(c, f) {
    if (!runs.length) return;
    const k = f.k || 0, day = f.day || 0;
    c.save();
    // the wire (always): a thin dark line, catching a little light at night
    c.lineWidth = Math.max(0.6, 0.55 * K); c.strokeStyle = k > 0.3 ? 'rgba(60,46,40,0.9)' : 'rgba(40,36,40,0.85)';
    c.beginPath(); for (const pts of runs) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); } c.stroke();
    // by day: the unlit glass bulbs
    if (k < 0.98) { c.fillStyle = `rgba(230,226,214,${(0.75 * (1 - k) * (0.4 + 0.6 * day)).toFixed(3)})`; for (const b of bulbs) { c.beginPath(); c.arc(b.x, b.y, 1.05 * K + 0.3, 0, Math.PI * 2); c.fill(); } }
    if (k > 0.01) {
      c.globalCompositeOperation = 'lighter';
      const p = f.party, pk = p && p.on > 0.05 ? clamp01(p.on) : 0, own = colours();
      const pal = own || (pk > 0.05 ? SCHEMES.party : SCHEMES.warm);
      // the warm glow they throw on the roof edge + the wall below (one soft band)
      if (bulbs.length) {
        const y0 = Math.min(...bulbs.map(b => b.y)), y1 = Math.max(...bulbs.map(b => b.y)), x0 = Math.max(0, Math.min(...bulbs.map(b => b.x))), x1 = Math.max(...bulbs.map(b => b.x));
        const g = c.createLinearGradient(0, y0 - 6 * K, 0, y1 + 34 * K);
        const gc = pk > 0.3 ? [255, 120, 140] : [255, 196, 130];
        g.addColorStop(0, `rgba(${gc},0)`); g.addColorStop(0.3, `rgba(${gc},${(0.16 * k).toFixed(3)})`); g.addColorStop(1, `rgba(${gc},0)`);
        c.fillStyle = g; c.fillRect(x0 - 6, y0 - 6 * K, x1 - x0 + 12, y1 - y0 + 40 * K);
      }
      // the bulbs: warm white — or, on a party night, the colours cycling (the warm-up) and chasing on the beat (the peak)
      const peak = pk * clamp01(((p && p.energy) || 0.6) * 2.5 - 1.5);
      const step = !f.motion ? 0 : peak > 0.3 ? (p.beats || 0) : Math.floor(f.t / 2.2), fr = !f.motion ? 1 : peak > 0.3 ? clamp01((p.beatU || 0) * 6) : clamp01(((f.t / 2.2) % 1) * 3);
      const punch = p ? (p.punch || 0) * pk : 0;
      for (const b of bulbs) {
        let col = pal[0], a = k;
        if (pal.length > 1) {
          const ci = ((b.i + step) % pal.length + pal.length) % pal.length, cj = ((b.i + step - 1) % pal.length + pal.length) % pal.length;
          col = fr >= 1 ? pal[ci] : pal[fr > 0.5 ? ci : cj];
          // (the chase: every third bulb leads, brighter, punching on the beat)
          if (peak > 0.3) a *= ((b.i + step) % 3 === 0 ? 1 + 0.9 * punch : 0.62 + 0.25 * punch);
        }
        if (pk > 0.05 && pal !== SCHEMES.party && !own) col = pal[0];
        const r = (3.6 + (a > 1 ? 1.6 * (a - 1) : 0)) * K + 1.2;
        c.globalAlpha = Math.min(1, a);
        c.drawImage(dot(col), b.x - r, b.y - r, r * 2, r * 2);
      }
    }
    c.restore();
  }
  return {
    layout, draw,
    /** later parts: { scheme: 'warm'|'party'|'christmas'|'halloween' } or { colours: [[r,g,b]…] } (null resets) */
    set(o = {}) { if ('scheme' in o) cfg.scheme = o.scheme || null; if ('colours' in o) cfg.colours = o.colours || null; },
    debug: () => ({ runs: runs.length, bulbs: bulbs.length, cfg: { ...cfg } }),
    destroy() { for (const d of dots.values()) d.width = 0; dots.clear(); runs = []; bulbs = []; },
  };
}
