// HOLO — a holographic foil: a wide band of the whole spectrum sliding diagonally across the card, fine diffraction lines shimmering in
// it, the colours shifting along the band as it moves (PRISM LEGEND's first effect — its second, `twinkle`, the white glints).
import { sprite, fract } from './kit.js';
import { rrect } from './renderer.js';

/** the band, baked: a rainbow across it, soft to nothing at both edges, fine diffraction lines over it */
const band = () => sprite('fx-holo', 256, 64, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0);
  const hues = ['255,60,120', '255,170,60', '240,255,90', '80,255,160', '60,200,255', '120,110,255', '230,90,255', '255,60,120'];
  hues.forEach((h, i) => g.addColorStop(i / (hues.length - 1), `rgba(${h},1)`));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'destination-in';
  const m = c.createLinearGradient(0, 0, W, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.3, 'rgba(0,0,0,0.85)'); m.addColorStop(0.5, 'rgba(0,0,0,1)'); m.addColorStop(0.7, 'rgba(0,0,0,0.85)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = m; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < W; x += 3) { c.fillStyle = `rgba(0,0,0,${0.25 + 0.2 * Math.sin(x * 0.7)})`; c.fillRect(x, 0, 1, H); }
});

export default {
  id: 'holo', tier: 'epic', bleed: 0, stillT: 1.6,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, P = s.opts.full ? 5.5 : 4.6, u = Q.still ? 0.45 : fract(t / P + (s.opts.seed || 0) * 0.21);
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    const D = Math.hypot(w, h), bw = D * 0.8, x = -bw + u * (w + bw * 2);
    c.save(); c.translate(x, h / 2); c.rotate(-0.5);
    c.globalAlpha = 0.34 * (s.opts.calm ? 0.8 : 1); c.drawImage(band(), -bw / 2, -D, bw, D * 2);
    c.globalAlpha = 0.16; c.drawImage(band(), -bw * 0.9 + bw * 0.2, -D, bw * 1.8, D * 2);
    c.restore();
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
