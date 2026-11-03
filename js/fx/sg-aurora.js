// `card-sg-aurora` — card-sg-aurora (THE VAULT 1C; the owner: "the aurora's ribbons over the harbor"). The city's OWN aurora (its strand looks —
// screens/harbor/aurora.js#AURORA_LOOKS: green in the middle band, a pink / magenta hem along the foot, crimson high up, a touch of violet —
// baked into feathered strands the same way) as a living CURTAIN over the harbor: two layers of many wide, overlapping strands summed into
// one glow, rippling + drifting, the two looks crossfading along it, a BRIGHTENING WAVE running along the curtain every few seconds (the
// city's tap reaction, on its own beat); stars behind; the harbor's dark skyline under it; its soft REFLECTION wavering on the water.
import { glow, stamp, sprite, wob } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { city, backdrop, skylineLayer, bakeDpr, stage } from './sg-kit.js';

const SKY = { sky: [[0, '#020611'], [0.4, '#04101a'], [0.62, '#062018'], [1, '#02060a']], stars: 34, starRgb: '225,240,255', starTo: 0.6, seed: 61,
  glow: [{ x: 0.5, y: 0.55, r: 0.7, rgb: '40,180,120', a: 0.18, sy: 0.4 }] };
const CITY = { y: 0.66, gap: 0.05, tall: 0.07, dark: ['#04100e', '#020807'], win: [['255,214,140', 0.6], ['140,255,200', 0.4]], p: 0.08, rim: 'rgba(110,255,190,0.16)' };

let bands = null;
function strands(L) {
  if (bands) return bands;
  bands = L.AURORA_LOOKS.map((stops, i) => sprite(`sg-aur:${i}`, 48, 160, (x, w, h) => {
    const g = x.createLinearGradient(0, h, 0, 0);
    for (const [u, r, gg, bb, al] of stops) g.addColorStop(u, `rgba(${r},${gg},${bb},${al})`);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const m = x.createLinearGradient(0, 0, w, 0);
    for (let k = 0; k <= 10; k++) { const u = k / 10, d = (u - 0.5) * 2; m.addColorStop(u, `rgba(0,0,0,${Math.exp(-d * d * 3.2).toFixed(3)})`); }
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, w, h);
  }));
  return bands;
}
const curtain = (u, tt, base, amp, ph, sp) => base + amp * Math.sin(u * 7 + tt * sp * 3 + ph) + 0.03 * Math.sin(u * 23 + tt * sp * 7);

export default {
  id: 'sg-aurora', tier: 'legendary', bleed: 10, stillT: 5,
  draw(c, s, t, Q) {
    const A = city('aurora', () => import('../screens/harbor/aurora.js'));
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 5 : t;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    const water = full ? 0.74 : 0.9;
    c.drawImage(backdrop(full ? 'au-full' : 'au', w, h, dpr, { ...SKY, water: { y: water, top: '#03130f', bottom: '#010403', shine: '120,255,190' } }), 0, 0, w, h);
    const y0 = full ? h * 0.02 : -h * 0.1, y1 = full ? h * 0.6 : h * 0.86, span = y1 - y0;
    if (A) {
      const BB = strands(A), n = Math.round((full ? 46 : 34) * (0.6 + 0.4 * Q.q));
      // the brightening wave (every ~7 s it runs along the curtain from the left)
      const wu = still ? -1 : ((tt % 7) / 7) * 1.6 - 0.3;
      c.globalCompositeOperation = 'lighter';
      for (const [base, amp, ph, sp, a] of [[0.96, 0.05, 0, 0.11, 0.62], [0.8, 0.05, 2.2, 0.08, 0.42]]) {
        for (let i = 0; i < n; i++) {
          const u = i / n, x = u * w * 1.1 - w * 0.05, wv = wu > -1 ? Math.exp(-((u - wu) ** 2) / 0.01) : 0;
          const y = y0 + span * (curtain(u, tt, base, amp, ph, sp) - 0.05 * wv);
          const hgt = span * (0.72 + 0.16 * Math.sin(u * 5 + tt * sp * 2 + ph)), bw = w / n * 7.5;
          const al = Math.min(1, a * (0.72 + 0.28 * Math.sin(u * 5 + tt * 0.6 + ph)) * (0.55 + 0.45 * Math.sin(Math.PI * u)) * (1 + 0.7 * wv));
          const wB = 0.5 + 0.5 * Math.sin(u * 3.1 + tt * 0.08 + ph);
          if (wB < 0.98) { c.globalAlpha = al * (1 - wB); c.drawImage(BB[0], x - bw / 2, y - hgt, bw, hgt); }
          if (wB > 0.02) { c.globalAlpha = al * wB; c.drawImage(BB[1], x - bw / 2, y - hgt, bw, hgt); }
        }
      }
      // THE RAYS: many thin shafts in the lower curtain, each its own height + flicker (the curtain's fine structure)
      const nr = Math.round((full ? 120 : 80) * (0.6 + 0.4 * Q.q));
      for (let i = 0; i < nr; i++) {
        const u = i / nr, x = u * w * 1.06 - w * 0.03, ph = Math.sin(i * 12.9898) * 43758.5453 % 1;
        const y = y0 + span * (curtain(u, tt, 0.96, 0.05, 0, 0.11)), hgt = span * (0.25 + 0.4 * Math.abs(ph)) * (still ? 1 : 0.75 + 0.25 * Math.sin(tt * (1.5 + Math.abs(ph) * 2) + i));
        c.globalAlpha = 0.32 * Math.abs(Math.sin(i * 3.7 + tt * 0.7)) * (0.55 + 0.45 * Math.sin(Math.PI * u));
        c.drawImage(BB[i % 2], x - 1.5, y - hgt, 3, hgt);
      }
      // its reflection: wide soft strands of its green + pink, stretched down the water, wavering
      const wy = water * h, wh = h - wy;
      for (let i = 0; i < (full ? 11 : 7); i++) {
        const u = (i + 0.5) / (full ? 11 : 7), x = u * w + (still ? 0 : Math.sin(u * 7 + tt * 0.33) * w * 0.015);
        stamp(c, glow(i % 3 ? '80,255,170' : '255,90,190', 0.05, 64), x, wy + wh * 0.35, w / 6, 0.22 * Math.sin(Math.PI * u), wh * 0.9);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    // the harbor under it: the skyline (its roofs lit green by the sky)
    c.drawImage(skylineLayer(full ? 'au-full' : 'au', w, h, dpr, { ...CITY, y: full ? 0.66 : 0.86, tall: full ? 0.07 : 0.1 }, water * h, 81, 'all'), 0, 0, w, h);
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,130,220', still, radius: rad });
  },
};
