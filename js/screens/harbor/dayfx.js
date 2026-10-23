// CITY 2.0 — THE HARBOR: THE DAY'S MOTION (THE DAY PASS) — so the sunlit city feels alive like the night:
//   - FLAGS on a few roofs, stirring in the REAL wind (its speed: limp in a calm, snapping in a gale; its direction: they fly
//     downwind), a ripple running along the cloth with its folds shaded;
//   - SUN GLINTS on glass: now and then a pane on the towers' sunny side flashes as the light shifts (a soft star, a second long).
// Both by daylight only (gone below a 1° sun — the dusk and the night never see them); per frame a handful of paths, the places
// worked out once per layout (and when the sun changes side). Reduced motion: the flags hold still, no glints.
import { project } from '../../core/harbor-layout.js';
import { winHash } from '../../core/harbor-windows.js';
import { cellRect, isDeco } from './blocks.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
// (vintage pennant colours: a harbor city's flags — no real nation's flag: holidays bring theirs in Part 10)
const CLOTH = [[196, 38, 46], [240, 196, 84], [30, 62, 130], [244, 238, 222], [26, 122, 104]];

export function createDayFx() {
  let flags = [], glints = [], sideKey = '', cam = null, L = null;
  function layout(l, signRects = []) {
    L = l; cam = l.cam; sideKey = '';
    // the flags: the hero blocks' roofs + the tallest near-band roofs clear of the wheel, the signs and the lighthouse
    const s0 = cam.F / 600, cand = [];
    for (const b of l.heroes) cand.push({ b, u: 0.78 });
    const near = l.bands.find(b => b.id === 'near');
    if (near) [...near.blocks].sort((p, q) => q.h - p.h).slice(0, 10).forEach(b => cand.push({ b, u: 0.3 }));
    const w = cam.wheelQuiet, lh = l.lighthouse ? project(cam, l.lighthouse.x, 0, l.lighthouse.z)[0] : -1e9;
    flags = [];
    for (const { b, u } of cand) {
      const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0), x = a + (c - a) * u, s = cam.F / b.z0;
      const pole = 3.6 * s, len = 2.3 * s, hgt = 1.5 * s;
      if (x < 6 || x > cam.W - 6 || c - a < 4) continue;
      if (w && Math.hypot(x - w.x, ty - pole - w.y) < w.r + 8) continue;
      if (Math.abs(x - lh) < 34 * s0) continue;
      if (signRects.some(r => x > r.x - 4 && x < r.x + r.w + len + 4 && ty - pole - 2 < r.y + r.h && ty > r.y + 1)) continue;
      if (flags.some(f => Math.abs(f.x - x) < 20 * s0)) continue;
      flags.push({ x, y: ty, pole, len, hgt, col: CLOTH[flags.length % CLOTH.length], ph: winHash(b.seed || 1, 5, 5, 5, 5) * 6.28 });
      if (flags.length >= 4) break;
    }
  }
  // the glints: upper panes of the towers' top tiers on the sunny half, nothing nearer in front of them
  function placeGlints(sd) {
    glints = [];
    if (!L || !sd) return;
    const boxes = [...L.bands.flatMap(b => b.blocks), ...L.heroes, ...L.towers.flatMap(t => t.tiers.map(tr => ({ ...tr })))];
    const hidden = (x, y, z) => boxes.some(b => b.z0 < z - 1 && (() => { const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0); return x > a && x < c && y > ty - 1; })());
    for (const t of L.towers) {
      if (t.rank === 'modern' || t.z0 > 420) continue;
      const tr = t.tiers[t.tiers.length > 1 ? t.tiers.length - 2 : 0], b = { ...tr, seed: t.seed }, g = tr.win;
      if (!g || g.rows < 2) continue;
      for (let r = Math.floor(g.rows * 0.35); r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
        const side = sd > 0 ? c >= g.cols * 0.5 : c < g.cols * 0.5;
        if (!side || winHash(t.seed, 9, c, r, 51) > 0.05) continue;
        const [x, y, w, h] = cellRect(cam, b, c, r, isDeco(t.rank));
        if (w < 1 || hidden(x + w / 2, y + h / 2, tr.z0)) continue;
        glints.push({ x: x + w / 2, y: y + h * 0.3, s: Math.max(w, h) * 1.4, per: 7 + 9 * winHash(t.seed, 9, c, r, 52), ph: winHash(t.seed, 9, c, r, 53) * 20 });
        if (glints.length > 18) return;
      }
    }
  }
  const star = (c, x, y, r, a) => {
    if (a < 0.02) return;
    c.globalAlpha = a;
    const g = c.createRadialGradient(x, y, 0, x, y, r * 0.9); g.addColorStop(0, 'rgba(255,255,250,0.95)'); g.addColorStop(1, 'rgba(255,250,236,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.fillStyle = 'rgba(255,255,252,0.9)';
    c.beginPath(); c.moveTo(x - r * 1.8, y); c.lineTo(x, y - r * 0.12); c.lineTo(x + r * 1.8, y); c.lineTo(x, y + r * 0.12); c.fill();
    c.beginPath(); c.moveTo(x, y - r * 1.3); c.lineTo(x + r * 0.1, y); c.lineTo(x, y + r * 1.3); c.lineTo(x - r * 0.1, y); c.fill();
  };
  return {
    layout,
    /** f: { t (s), LK, T (the baked tones: sunDir), fade, motion, tier } */
    draw(c, f) {
      const el = f.LK && f.LK.sun ? f.LK.sun.el : -10, k = smooth(1, 4, el) * (f.fade ?? 1) * (1 - 0.8 * smooth(0.7, 0.95, f.LK.cloud || 0)) * (f.LK.rain ? 0.3 : 1);
      if (k < 0.01 || !cam) return;
      const t = f.motion ? f.t : 0, wind = f.LK.wind == null ? 3 : f.LK.wind, dir = Math.sin(((f.LK.windDir == null ? 250 : f.LK.windDir)) * Math.PI / 180) >= 0 ? 1 : -1;
      // ---- the flags: limp below ~1 m/s, out straight in a gale; the ripple faster with the wind
      const out = smooth(0.5, 9, wind), droop = 1 - out, spd = 3 + wind * 0.9, day = clamp01(f.T ? f.T.day + 0.7 * f.T.gold : 1);
      c.lineCap = 'round';
      for (const fl of flags) {
        const px = fl.x, top = fl.y - fl.pole;
        c.globalAlpha = k; c.strokeStyle = `rgb(${Math.round(70 + 60 * day)},${Math.round(66 + 56 * day)},${Math.round(64 + 50 * day)})`; c.lineWidth = Math.max(0.4, fl.pole * 0.05);
        c.beginPath(); c.moveTo(px, fl.y); c.lineTo(px, top - 0.5); c.stroke();
        const n = 8, pts = [];
        for (let i = 0; i <= n; i++) {
          const u = i / n, ang = droop * 1.25 * u, wav = Math.sin(u * 5.2 - t * spd + fl.ph) * fl.hgt * (0.12 + 0.22 * out) * u;
          pts.push([px + dir * fl.len * u * Math.cos(ang), top + fl.len * u * Math.sin(ang) + wav]);
        }
        for (let i = 0; i < n; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1], hh = fl.hgt * (1 - 0.35 * (i + 0.5) / n), slope = (by - ay) / Math.max(0.01, Math.abs(bx - ax) + 0.01);
          const lit = 0.82 + 0.3 * Math.max(-0.6, Math.min(0.6, -slope * dir));
          const [r, g, b] = fl.col;
          c.fillStyle = `rgb(${Math.min(255, r * lit) | 0},${Math.min(255, g * lit) | 0},${Math.min(255, b * lit) | 0})`;
          c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(bx + (bx - ax) * 0.02, by + hh * Math.cos(droop * 1.25 * (i + 1) / n)); c.lineTo(ax, ay + hh * Math.cos(droop * 1.25 * i / n) * (i ? 1 : 1.02)); c.closePath(); c.fill();
        }
        c.fillStyle = 'rgba(250,240,210,0.9)'; c.beginPath(); c.arc(px, top - 0.5, Math.max(0.4, fl.pole * 0.06), 0, Math.PI * 2); c.fill();
      }
      // ---- the glints (only with the sun on a side, and moving)
      const sd = f.T ? f.T.sunDir || 0 : 0, sk = `${Math.sign(sd)}|${cam.F}`;
      if (sk !== sideKey) { sideKey = sk; placeGlints(sd); }
      if (f.motion && f.tier > 0 && glints.length) {
        c.globalCompositeOperation = 'lighter';
        for (const g of glints) { const ph = ((f.t + g.ph) % g.per) / g.per, a = ph < 0.09 ? Math.sin(ph / 0.09 * Math.PI) : 0; star(c, g.x, g.y, g.s * (0.7 + 0.5 * a), a * 0.85 * k); }
        c.globalCompositeOperation = 'source-over';
      }
      c.globalAlpha = 1;
    },
    debug: () => ({ flags: flags.length, glints: glints.length }),
  };
}
