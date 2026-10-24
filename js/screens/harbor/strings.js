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
/** THE SWITCH for the speakeasy roof's string lights (scene.js draws them, speakeasy.js bakes their iron posts on the parapet only
 *  while it is on). PF turned them off until 7b re-rendered them: 7b — REAL ROUND BULBS hanging from their sockets on a gently
 *  sagging wire between the posts (glass globes by day; at night a crisp lit globe + a small tight halo, never a blurry dot), their
 *  light landing on the parapet's coping + face; warm white every night, warm + colourful + changing on party nights. */
export const STRINGS_ON = true;
/** 7b — the bulbs' look (pt × K, the camera's scale: ~1 on a phone): the globe's radius, the socket's drop, the halo, the parapet's light */
export const BULB = Object.freeze({ r: 1.25, socket: 0.9, halo: 3.4, haloA: 0.42, land: 0.2, edge: 0.34 });
const SCHEMES = {
  warm: [[255, 214, 150]],
  party: [[255, 170, 60], [255, 70, 150], [255, 60, 70], [255, 206, 84], [176, 96, 255]],
  christmas: [[255, 60, 60], [80, 255, 120], [255, 214, 120], [90, 160, 255]],
  halloween: [[255, 140, 30], [170, 70, 255]],
};

export function createStrings() {
  let runs = [], bulbs = [], K = 1, cfg = { scheme: null, colours: null }, par = null, litCv = null, litKey = '', litAt = null;
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
    // (7a: never closer than ~5.5 pt on screen — a run foreshortened down a side wall would crowd its bulbs into one glare)
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), sl = Math.hypot(pts[n][0] - pts[0][0], pts[n][1] - pts[0][1]), nb = Math.max(1, Math.min(Math.round(len / gap), Math.round(sl / (5.5 * cam.F / 600))));
    const bs = [];
    for (let i = 0; i <= nb; i++) { const u = (i + 0.5) / (nb + 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u) - 0.12, z = a[2] + (b[2] - a[2]) * u; bs.push(project(cam, x, y, z)); }
    return { pts, bs };
  }
  function layout(L) {
    // PART 7a — MOUNTED: swags between the iron POSTS on the speakeasy's parapet (one per pier: L.roof.posts, 1.15 units over the
    // coping), round the corner and along the side wall's parapet to its far end — every end on a post, nothing floating (the
    // owner's look review: a run up to a roof pole drew a loop over the wheel — dropped)
    const cam = L.cam, s = L.speakeasy, pl = L.roof.pole, z = s.z0 - 0.05, top = 11.25 + 1.12;
    K = cam.F / 600;
    runs = []; bulbs = []; litKey = '';
    const add = r => { runs.push(r.pts); for (const p of r.bs) if (p[0] > -6 && p[0] < cam.W + 6) bulbs.push({ x: p[0], y: p[1], i: bulbs.length }); };
    const len = Math.hypot(s.side.x - s.x1, s.side.z - s.z0), dx = (s.side.x - s.x1) / len, dz = (s.side.z - s.z0) / len;
    const sideP = w => [s.x1 + w * dx, top, s.z0 + w * dz];
    const posts = (L.roof.posts || [s.x0 + 3.55, s.x0 + 6.75, s.x0 + 9.95, s.x1]).map(x => [x, top, z]);
    const left = [s.x0 + 0.35, top, z];
    const chain = [left, ...posts, ...[0.4, 0.75, 1].map(f => sideP(len * f - 0.1))];
    for (let i = 0; i + 1 < chain.length; i++) add(catenary(cam, chain[i], chain[i + 1], 0.3, 0.42));
    // (7b: the parapet under the front run — its coping's line + its foot at the cornice — where the bulbs' light lands)
    { const [xa, ya] = project(cam, s.x0, 11.25, s.z0), [xb] = project(cam, s.x1, 11.25, s.z0), [, yb] = project(cam, s.x0, 10.5, s.z0); par = { x0: Math.max(0, xa), x1: xb, y0: ya, y1: yb }; }
    void pl;
  }
  function colours() { return cfg.colours || SCHEMES[cfg.scheme] || null; }
  /** the lit bulbs into one sprite (screen pt + a halo's pad), at the canvas's device scale */
  function paintLit(dpr, tier, colOf, rb, k) {
    if (!bulbs.length) return;
    const pad = rb * BULB.halo * 1.4 + 2, x0 = Math.min(...bulbs.map(b => b.x)) - pad, y0 = Math.min(...bulbs.map(b => b.y)) - pad;
    litAt = { x: x0, y: y0, w: Math.max(...bulbs.map(b => b.x)) + pad - x0, h: Math.max(...bulbs.map(b => b.y)) + pad - y0 };
    litCv = litCv || document.createElement('canvas'); litCv.width = Math.ceil(litAt.w * dpr); litCv.height = Math.ceil(litAt.h * dpr);
    const x = safeCtx(litCv); x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); x.clearRect(x0, y0, litAt.w, litAt.h);
    x.globalCompositeOperation = 'lighter';
    if (tier !== 0) for (const b of bulbs) { const [col, a] = colOf(b); x.globalAlpha = Math.min(1, a * BULB.haloA); const r = rb * BULB.halo * (a > 1 ? 1 + 0.3 * (a - 1) : 1); x.drawImage(dot(col), b.x - r, b.y - r, r * 2, r * 2); }
    x.globalCompositeOperation = 'source-over';
    for (const b of bulbs) {
      const [col, a] = colOf(b), e = Math.min(1, a);
      x.globalAlpha = 1; x.fillStyle = `rgb(${col.map(v => Math.round(v * (0.55 + 0.45 * e) + 40 * (1 - e) * (1 - k))).join(',')})`; x.beginPath(); x.arc(b.x, b.y, rb, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(255,252,240,${(0.85 * e).toFixed(3)})`; x.beginPath(); x.arc(b.x, b.y + rb * 0.1, rb * 0.5, 0, Math.PI * 2); x.fill();
    }
  }

  function draw(c, f) {
    if (!runs.length) return;
    const k = f.k || 0, day = f.day || 0, rb = BULB.r * K + 0.25;
    c.save();
    // the wire (always): a thin dark line, catching a little light at night
    c.lineWidth = Math.max(0.6, 0.5 * K); c.strokeStyle = k > 0.3 ? 'rgba(66,50,42,0.9)' : 'rgba(40,36,40,0.85)';
    c.beginPath(); for (const pts of runs) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); } c.stroke();
    // the sockets: a short dark drop from the wire to each bulb
    c.fillStyle = 'rgba(30,26,28,0.95)'; for (const b of bulbs) c.fillRect(b.x - 0.35 * K, b.y - rb - BULB.socket * K, 0.7 * K, BULB.socket * K + 0.2);
    // by day (and fading as they light): the glass globes — pale glass, a highlight
    if (k < 0.98) {
      const a = (1 - k) * (0.5 + 0.5 * day);
      c.fillStyle = `rgba(222,218,206,${(0.9 * a).toFixed(3)})`; for (const b of bulbs) { c.beginPath(); c.arc(b.x, b.y, rb, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = `rgba(255,255,255,${(0.8 * a).toFixed(3)})`; for (const b of bulbs) { c.beginPath(); c.arc(b.x - rb * 0.32, b.y - rb * 0.32, rb * 0.36, 0, Math.PI * 2); c.fill(); }
    }
    if (k > 0.01) {
      const p = f.party, pk = p && p.on > 0.05 ? clamp01(p.on) : 0, own = colours();
      const pal = own || (pk > 0.05 ? SCHEMES.party : SCHEMES.warm);
      // the warm-up cycles every 2.2 s; the peak chases on the beat (and punches with it)
      const peak = pk * clamp01(((p && p.energy) || 0.6) * 2.5 - 1.5);
      const step = !f.motion ? 0 : peak > 0.3 ? (p.beats || 0) : Math.floor(f.t / 2.2), fr = !f.motion ? 1 : peak > 0.3 ? clamp01((p.beatU || 0) * 6) : clamp01(((f.t / 2.2) % 1) * 3);
      const punch = p ? (p.punch || 0) * pk : 0;
      const colOf = b => { let col = pal[0], a = k;
        if (pal.length > 1) {
          const ci = ((b.i + step) % pal.length + pal.length) % pal.length, cj = ((b.i + step - 1) % pal.length + pal.length) % pal.length;
          col = fr >= 1 ? pal[ci] : pal[fr > 0.5 ? ci : cj];
          if (peak > 0.3) a *= ((b.i + step) % 3 === 0 ? 1 + 0.9 * punch : 0.62 + 0.25 * punch);
        }
        if (pk > 0.05 && pal !== SCHEMES.party && !own) col = pal[0];
        return [col, a]; };
      // THE LIGHT LANDING on the parapet under the front run: the coping's lit edge + a warm fall down its face (crisp, no haze)
      if (par && par.x1 > par.x0) {
        const gc = pk > 0.3 ? [255, 150, 150] : [255, 206, 146];
        const g = c.createLinearGradient(0, par.y0, 0, par.y1);
        g.addColorStop(0, `rgba(${gc},${(BULB.land * k).toFixed(3)})`); g.addColorStop(1, `rgba(${gc},0)`);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(par.x0, par.y0, par.x1 - par.x0, par.y1 - par.y0);
        c.fillStyle = `rgba(${gc},${(BULB.edge * k).toFixed(3)})`; c.fillRect(par.x0, par.y0 - 0.6 * K, par.x1 - par.x0, 0.7 * K);
      }
      // the halos (tight: ~3.4 bulb radii; none at tier 0) + each bulb's crisp lit globe with its hotter heart — ONE SPRITE, re-painted
      // only when the light, the chase's step or the punch moves a notch (a steady night: one drawImage a frame)
      const key = `${Math.round(k * 16)}|${f.tier === 0 ? 0 : 1}|${pk > 0.05 ? `${step}|${Math.round(fr * 3)}|${Math.round(punch * 8)}|${Math.round(peak * 4)}` : 's'}|${own ? own.join(';') : ''}|${c.getTransform().a.toFixed(2)}`;
      if (key !== litKey) { litKey = key; paintLit(c.getTransform().a, f.tier, colOf, rb, k); }
      if (litCv && litAt) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1; c.drawImage(litCv, litAt.x, litAt.y, litAt.w, litAt.h); }
    }
    c.restore();
  }
  return {
    layout, draw,
    /** later parts: { scheme: 'warm'|'party'|'christmas'|'halloween' } or { colours: [[r,g,b]…] } (null resets) */
    set(o = {}) { if ('scheme' in o) cfg.scheme = o.scheme || null; if ('colours' in o) cfg.colours = o.colours || null; },
    debug: () => ({ runs: runs.length, bulbs: bulbs.length, cfg: { ...cfg } }),
    destroy() { for (const d of dots.values()) d.width = 0; dots.clear(); runs = []; bulbs = []; if (litCv) litCv.width = litCv.height = 0; litCv = null; litKey = ''; },
  };
}
