// `card-century` (epic — two effects): THE DECO SUNBURST (LOBBY 2.0 A — the owner: CENTURY and INFERNO were "too similar", both mostly
// flames; INFERNO keeps the fire, CENTURY loses it). Burnished BRONZE foil (css/vault.css .vl-s-century) with an Art Deco sunburst
// PRESSED into it, fanning from BEHIND the name plate: alternating broad + slender rays, three stepped arcs round its heart, baked ONCE
// into one sprite (one drawImage a frame); a slow LIGHT SWEEP crosses the foil (a baked band, moved — the rays catch it as it passes);
// golden embers drift up over it (the embers effect, no coal bed — fx/index.js#century).
// NOT GOLD FOIL's look (fx/rays.js — its rays lit one after another round a burst at the strip's right foot): here the burst stands
// still, in bronze, from behind the plate; the motion is the light travelling across the metal.
import { sprite } from './kit.js';
import { rrect } from './renderer.js';

/** the pressed burst: N ray pairs round the centre (a broad ray + a slender one), the stepped arcs — baked in bronze light + shadow */
const burst = () => sprite('fx-deco-burst', 512, 512, (c, W) => {
  const cx = W / 2, cy = W / 2, R = W / 2, N = 18;
  for (let i = 0; i < N * 2; i++) {
    const broad = i % 2 === 0, a = (i / (N * 2)) * Math.PI * 2, half = (broad ? 0.62 : 0.24) * (Math.PI / (N * 2));
    const g = c.createLinearGradient(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    if (broad) { g.addColorStop(0, 'rgba(255,214,160,0.0)'); g.addColorStop(0.12, 'rgba(255,214,160,0.55)'); g.addColorStop(0.7, 'rgba(232,162,98,0.32)'); g.addColorStop(1, 'rgba(232,162,98,0)'); }
    else { g.addColorStop(0, 'rgba(255,236,200,0)'); g.addColorStop(0.18, 'rgba(255,236,200,0.75)'); g.addColorStop(1, 'rgba(255,220,170,0)'); }
    c.fillStyle = g; c.beginPath(); c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a - half) * R, cy + Math.sin(a - half) * R); c.lineTo(cx + Math.cos(a + half) * R, cy + Math.sin(a + half) * R);
    c.closePath(); c.fill();
    // the pressed edge: a thin dark line beside each broad ray (the relief)
    if (broad) { c.strokeStyle = 'rgba(40,16,4,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx + Math.cos(a + half) * R * 0.12, cy + Math.sin(a + half) * R * 0.12); c.lineTo(cx + Math.cos(a + half) * R * 0.95, cy + Math.sin(a + half) * R * 0.95); c.stroke(); }
  }
  // the stepped arcs (deco rings) + the sun's disc at the heart
  for (const [r, w, a] of [[0.13, 3, 0.85], [0.2, 2, 0.6], [0.27, 1.5, 0.42]]) { c.strokeStyle = `rgba(255,220,170,${a})`; c.lineWidth = w; c.beginPath(); c.arc(cx, cy, R * r, 0, Math.PI * 2); c.stroke(); }
  const d = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.1); d.addColorStop(0, 'rgba(255,240,210,0.9)'); d.addColorStop(1, 'rgba(240,170,100,0.35)');
  c.fillStyle = d; c.beginPath(); c.arc(cx, cy, R * 0.1, 0, Math.PI * 2); c.fill();
});
/** the light sweep: a soft vertical band (baked), skewed + moved across the foil */
const band = () => sprite('fx-deco-band', 128, 8, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,226,180,0)'); g.addColorStop(0.35, 'rgba(255,226,180,0.35)'); g.addColorStop(0.5, 'rgba(255,246,225,0.9)'); g.addColorStop(0.65, 'rgba(255,226,180,0.35)'); g.addColorStop(1, 'rgba(255,226,180,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
});

export default {
  id: 'deco', tier: 'epic', bleed: 0, stillT: 2.4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, calm = s.opts.calm ? 0.8 : 1, tt = Q.still ? 2.4 : t;
    // the burst's heart: behind the name plate (the strip: under its left third; the full card: behind the name block, low centre)
    const ox = full ? w * 0.5 : w * 0.2, oy = full ? h * 0.66 : h * 0.5, Rr = full ? Math.hypot(w, h) * 0.9 : w * 0.95;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.62 * calm; c.drawImage(burst(), ox - Rr, oy - Rr, Rr * 2, Rr * 2);
    // the sweep: one pass every ~7 s, left → right, leaning like light on a turned plate; a soft glow where it crosses the burst
    const P = 7.2, u = ((tt % P) / P) * 1.6 - 0.3, bw = full ? w * 0.42 : w * 0.3, x = u * (w + bw) - bw;
    if (u > -0.3 && u < 1.3) {
      c.save(); c.translate(x + bw / 2, h / 2); c.transform(1, 0, -0.38, 1, 0, 0);
      c.globalAlpha = 0.34 * calm; c.drawImage(band(), -bw / 2, -h, bw, h * 2);
      c.restore();
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
