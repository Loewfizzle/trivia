// THE FLAME LEGENDARIES (THE VAULT 1C — legendary: a living scene + THE BORDER LASER), the streak's two top cards:
//   `card-wildfire` (two hundred nights) — a RIDGE ON FIRE at night: the hills' black line, pines against the blaze, a wall of flame
//                   along the crest breathing + leaning in the wind, the smoke above it lit orange from below, embers whirled up
//   `card-eternal`  (a whole year) — THE ETERNAL FLAME: a bronze brazier holding one tall, slow, VIOLET-into-GOLD flame (its tongues
//                   baked once in their own colours), its light on the bowl, sparks spiralling up round it, a soft heat halo
import { glow, stamp, puff, lick, sprite, rng, wob, unit } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';

// ---------------------------------------------------------------- WILDFIRE
/** the ridge + its pines (baked per size): the hills' silhouette, the trees on the crest */
const ridge = (w, h, dpr, full) => sprite(`fx-ridge:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr); const r = rng(3), y0 = h * (full ? 0.66 : 0.72);
  const crest = x => y0 + Math.sin(x / w * 5.2 + 0.6) * h * 0.05 + Math.sin(x / w * 13 + 2) * h * 0.02;
  c.fillStyle = '#070303'; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 2) c.lineTo(x, crest(x)); c.lineTo(w, h); c.closePath(); c.fill();
  // pines on the crest (silhouettes against the fire)
  for (let i = 0; i < (full ? 26 : 22); i++) {
    const x = r() * w, base = crest(x) + 1, th = h * (full ? 0.08 : 0.14) * (0.6 + r() * 0.7), tw = th * 0.32;
    c.beginPath(); c.moveTo(x, base - th);
    for (let k = 1; k <= 4; k++) { const y = base - th + th * k / 4; c.lineTo(x + tw * (k / 4) * 1.1, y); c.lineTo(x + tw * (k / 4) * 0.5, y - th * 0.04); }
    c.lineTo(x - tw * 0.5, base - th * 0.04);
    for (let k = 4; k >= 1; k--) { const y = base - th + th * k / 4; c.lineTo(x - tw * (k / 4) * 1.1, y); }
    c.closePath(); c.fill();
  }
});

export const wildfire = {
  id: 'wildfire', tier: 'legendary', bleed: 10, stillT: 1.8,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, U = unit(s), tt = Q.still ? 1.8 : t, r = rng(11);
    const dpr = Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4)), y0 = h * (full ? 0.66 : 0.72);
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    // the sky lit from below + the SMOKE rolling up, its underside orange
    stamp(c, glow('255,90,30', 0.05, 64), w * 0.5, y0, w * 1.6, 0.55, h * 0.9);
    const ns = Math.round((full ? 18 : 10) * (0.6 + 0.4 * Q.q));
    for (let i = 0; i < ns; i++) {
      const sp = 0.05 + r() * 0.05, u = Q.still ? r() : ((tt * sp + r()) % 1), x = r() * w + u * U * 0.8 + (Q.still ? 0 : wob(tt * 0.2, i) * U * 0.2), y = y0 - u * h * 0.9;
      const R = U * (0.6 + u * 1.4);
      c.globalCompositeOperation = 'source-over'; stamp(c, puff('40,22,20', i % 4, 128), x, y, R * 1.3, 0.5 * Math.sin(u * Math.PI), R);
      c.globalCompositeOperation = 'lighter'; stamp(c, puff('255,120,50', (i + 1) % 4, 128), x, y + R * 0.2, R * 1.2, 0.22 * (1 - u), R * 0.8);
    }
    c.globalCompositeOperation = 'source-over';
    // THE FIRE along the crest (behind the trees): tongues breathing + leaning
    const L = lick(64), nf = Math.round((full ? 60 : 44) * (0.6 + 0.4 * Q.q));
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < nf; i++) {
      const x = (i + r()) / nf * w, life = Q.still ? 0.7 : 0.55 + 0.45 * Math.sin(tt * (2 + r() * 2) + r() * 6), lean = Q.still ? 0 : wob(tt * 0.6, 3) * 0.25;
      const fh = (full ? h * 0.24 : h * 0.55) * (0.5 + 0.6 * life) * (0.6 + r() * 0.6), fw = fh * 0.42, cy = y0 + Math.sin(x / w * 5.2 + 0.6) * h * 0.05 + Math.sin(x / w * 13 + 2) * h * 0.02 + fh * 0.1;
      c.save(); c.translate(x, cy); c.rotate(lean); c.globalAlpha = 0.75 * life; c.drawImage(L, -fw / 2, -fh, fw, fh); c.restore();
    }
    stamp(c, glow('255,150,50', 0.1, 64), w * 0.5, y0 + h * 0.02, w * 1.4, 0.4, h * 0.12);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.drawImage(ridge(w, h, dpr, full), 0, 0, w, h);
    // the EMBERS whirled up over it
    c.globalCompositeOperation = 'lighter';
    const ne = Math.round((full ? 50 : 22) * (0.5 + 0.5 * Q.q));
    for (let i = 0; i < ne; i++) {
      const sp = 0.15 + r() * 0.2, u = Q.still ? r() : ((tt * sp + r()) % 1), x = r() * w + Math.sin(tt * 1.3 + i) * U * 0.25 + u * U * 0.6, y = y0 - u * h * 0.95;
      stamp(c, glow('255,180,80', 0.4, 16), x, y, 1.4 + U * 0.04, Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(tt * 11 + i)));
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,120,50', still: Q.still, radius: rad });
  },
};

// ---------------------------------------------------------------- ETERNAL FLAME
/** a flame tongue in the eternal flame's colours (violet edge → magenta → gold → white root), baked */
const tongue = () => sprite('fx-eternal-tongue', 64, 160, (c, W, H) => {
  const shape = (s, lean) => { const bx = W / 2, by = H * 0.95, R = W * 0.34 * s; c.beginPath(); c.moveTo(bx - R, by - R); c.bezierCurveTo(bx - R * 1.05, by - H * 0.45 * s, bx - R * 0.2 + lean, by - H * 0.62 * s, bx + lean * 1.4, by - H * 0.92 * s); c.bezierCurveTo(bx + R * 0.3 + lean * 0.6, by - H * 0.6 * s, bx + R * 1.05, by - H * 0.4 * s, bx + R, by - R); c.arc(bx, by - R, R, 0, Math.PI); c.closePath(); };
  c.globalCompositeOperation = 'lighter';
  let g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, 'rgba(255,150,230,0.9)'); g.addColorStop(0.4, 'rgba(170,90,255,0.75)'); g.addColorStop(1, 'rgba(90,40,200,0)');
  c.fillStyle = g; shape(1, W * 0.05); c.fill();
  g = c.createLinearGradient(0, H, 0, H * 0.3); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.35, 'rgba(255,214,120,0.9)'); g.addColorStop(1, 'rgba(255,140,210,0)');
  c.fillStyle = g; shape(0.55, W * 0.03); c.fill();
});
/** the brazier (baked): a bronze bowl on a short stem, lit from above by its own flame */
const brazier = (W, dpr) => sprite(`fx-brazier:${Math.round(W)}@${dpr}`, W * dpr, W * 0.7 * dpr, (c, CW, CH) => {
  c.scale(dpr, dpr); const w = W, h = W * 0.7;
  let g = c.createLinearGradient(0, 0, 0, h * 0.45); g.addColorStop(0, '#f2c070'); g.addColorStop(0.35, '#a06a28'); g.addColorStop(1, '#2a1606');
  c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.04, h * 0.08); c.quadraticCurveTo(w * 0.5, h * 0.62, w * 0.96, h * 0.08); c.closePath(); c.fill();
  c.fillStyle = '#e6b060'; c.fillRect(w * 0.02, h * 0.04, w * 0.96, h * 0.06);
  g = c.createLinearGradient(w * 0.42, 0, w * 0.58, 0); g.addColorStop(0, '#2a1606'); g.addColorStop(0.5, '#8a5a20'); g.addColorStop(1, '#2a1606');
  c.fillStyle = g; c.fillRect(w * 0.44, h * 0.34, w * 0.12, h * 0.4); c.fillRect(w * 0.3, h * 0.72, w * 0.4, h * 0.08);
});

export const eternal = {
  id: 'eternal', tier: 'legendary', bleed: 10, stillT: 2.4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, tt = Q.still ? 2.4 : t, r = rng(29);
    const dpr = Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4));
    const cx = full ? w * 0.76 : w * 0.6, base = full ? h * 0.7 : h * 0.93, FH = full ? h * 0.62 : h * 1.1, BW = full ? w * 0.26 : h * 0.8;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    // the heat halo
    stamp(c, glow('170,90,255', 0.05, 64), cx, base - FH * 0.4, FH * 1.6, 0.4, FH * 1.3);
    stamp(c, glow('255,190,110', 0.1, 64), cx, base - FH * 0.15, FH * 0.9, 0.35, FH * 0.5);
    // THE FLAME: tongues layered, each its own slow breath + sway (a slow flame — it never goes out)
    const T = tongue();
    for (let i = 0; i < 9; i++) {
      const ph = r() * 6, life = Q.still ? 0.8 : 0.65 + 0.35 * Math.sin(tt * (1.3 + r()) + ph), sway = Q.still ? 0 : wob(tt * 0.8, i) * 0.12;
      const fh = FH * (0.55 + 0.5 * r()) * life, fw = fh * 0.4, ox = (r() - 0.5) * BW * 0.4;
      c.save(); c.translate(cx + ox, base); c.rotate(sway); c.globalAlpha = 0.55 + 0.4 * life; c.drawImage(T, -fw / 2, -fh, fw, fh); c.restore();
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.drawImage(brazier(BW, dpr), cx - BW / 2, base - BW * 0.05, BW, BW * 0.7);
    // its light on the bowl's rim
    c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,220,160', 0.2, 64), cx, base, BW * 1.1, 0.5, BW * 0.12);
    // SPARKS spiralling up round the flame
    const ns = Math.round((full ? 30 : 14) * (0.5 + 0.5 * Q.q));
    for (let i = 0; i < ns; i++) {
      const sp = 0.12 + r() * 0.12, u = Q.still ? r() : ((tt * sp + r()) % 1), ang = tt * 1.6 + i * 2.4 + u * 6, R = BW * (0.15 + u * 0.35);
      const x = cx + Math.cos(ang) * R, y = base - u * FH * 1.3;
      stamp(c, glow(i % 2 ? '220,160,255' : '255,220,140', 0.4, 16), x, y, 1.6 + u * 1.5, Math.sin(u * Math.PI) * 0.9);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '200,130,255', still: Q.still, radius: rad });
  },
};
