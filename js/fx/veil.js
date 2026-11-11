// `card-aurora` (rare — an effect + glowing edges): NORTHERN LIGHTS UNDER GLASS — the city's aurora strands (screens/harbor/aurora.js's
// looks, the sighting card's own bake — js/fx/sg-aurora.js shares it) filling the card as a slow curtain, rippling, the two looks
// crossfading; no skyline (the card is the glass case, not the harbor — the sighting card has the harbor). Lazy: the strands come with
// the city's aurora module; until then a soft green band stands in.
import { glow, stamp, sprite } from './kit.js';
import { rrect } from './renderer.js';
import { city } from './sg-kit.js';
import { lazyImport } from '../ui/lazy-import.js';

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

export default {
  id: 'veil', tier: 'rare', bleed: 0, stillT: 4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, tt = Q.still ? 4 : t;
    const A = city('aurora', () => lazyImport(import('../screens/harbor/aurora.js'), '../screens/harbor/aurora.js'));
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    if (!A) { stamp(c, glow('80,255,170', 0.1, 64), w * 0.6, h * 0.6, w, 0.25, h * 0.5); c.restore(); c.globalCompositeOperation = 'source-over'; return; }
    const BB = strands(A), n = Math.round((full ? 40 : 30) * (0.6 + 0.4 * Q.q)), calm = s.opts.calm ? 0.8 : 1;
    // the curtain slanting across (low at the left, high at the right), two layers
    for (const [base, amp, ph, sp, a] of [[0.95, 0.07, 0, 0.1, 0.55], [0.75, 0.06, 2.4, 0.07, 0.38]]) {
      for (let i = 0; i < n; i++) {
        const u = i / n, x = u * w * 1.1 - w * 0.05;
        const y = h * (base + amp * Math.sin(u * 6 + tt * sp * 3 + ph) + 0.03 * Math.sin(u * 19 + tt * sp * 7) - 0.12 * u);
        const hgt = h * (full ? 0.8 : 1.1) * (0.75 + 0.2 * Math.sin(u * 5 + tt * sp * 2 + ph)), bw = w / n * 7;
        const al = Math.min(1, a * calm * (0.7 + 0.3 * Math.sin(u * 5 + tt * 0.6 + ph)));
        const wB = 0.5 + 0.5 * Math.sin(u * 3.1 + tt * 0.08 + ph);
        if (wB < 0.98) { c.globalAlpha = al * (1 - wB); c.drawImage(BB[0], x - bw / 2, y - hgt, bw, hgt); }
        if (wB > 0.02) { c.globalAlpha = al * wB; c.drawImage(BB[1], x - bw / 2, y - hgt, bw, hgt); }
      }
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
