// I WANT TO BELIEVE — THE UFO's LIFE (THE VAULT 1A; the owner: "the city's REAL baked UFO sprite + its lit portholes over the harbor
// skyline, the beam pulsing, motes rising"; the minimum class for every sighting card — docs/harbor/plan.md "THE SIGHTING CARDS' BAR").
// The city's OWN bake (screens/harbor/ufo-model.js — "UFO" by sebslom, CC BY 4.0) at its hover angle, turning slowly on its turntable,
// a gentle bob; its ports chase round the rim (the model's own port places per frame, brightened in turn); THE BEAM from the belly down
// to the quay — three nested cones (a soft edge, no blur), pulsing, motes rising in it, a pool of light on the skyline; the night sky +
// the harbor skyline (its lit windows) baked once per size. Until the sprite is in, the beam + the sky stand alone (never a blank strip).
import { loadUfoModel, drawBody, drawLights, frameAt, portsAt } from '../screens/harbor/ufo-model.js';
import { sprite, glow, stamp, rng, wob, clamp01 } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';

let model = null, asking = false;
function want() { if (model || asking) return; asking = true; loadUfoModel().then(m => { model = m; }).catch(() => { asking = false; }); }

/** the night: a deep green-teal sky (the beam's colour in the air), stars, the harbor skyline with lit windows — once per size */
function sky(w, h, dpr) {
  return sprite(`ufo-sky:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c, W, H) => {
    c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04130f'); g.addColorStop(0.55, '#06201a'); g.addColorStop(1, '#020806');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const glowR = c.createRadialGradient(w * 0.66, h * 0.15, 0, w * 0.66, h * 0.15, w * 0.45); glowR.addColorStop(0, 'rgba(60,200,140,0.22)'); glowR.addColorStop(1, 'rgba(60,200,140,0)');
    c.fillStyle = glowR; c.fillRect(0, 0, w, h);
    const r = rng(1947);
    for (let i = 0; i < Math.round(w * 0.32); i++) { const x = r() * w, y = r() * h * 0.7, a = 0.25 + r() * 0.7, s = r() < 0.12 ? 1.3 : 0.7; c.fillStyle = `rgba(230,255,240,${a})`; c.fillRect(x, y, s, s); }
    // the skyline: towers of a few widths along the bottom, a darker near row, windows lit in warm / pink / green pixels
    const rows = [{ y: h * 0.58, dark: '#04130f', n: 1 }, { y: h * 0.7, dark: '#020a08', n: 0 }];
    for (const row of rows) {
      let x = -4;
      while (x < w + 4) {
        const bw = 9 + r() * 18, bh = h - row.y + r() * h * 0.16 * (row.n + 1);
        c.fillStyle = row.dark; c.fillRect(x, h - bh, bw, bh);
        for (let wy = h - bh + 3; wy < h - 2; wy += 3.4) for (let wx = x + 2; wx < x + bw - 2; wx += 3.2) {
          if (r() < 0.16) { const k = r(); c.fillStyle = k < 0.55 ? 'rgba(255,214,120,0.85)' : k < 0.8 ? 'rgba(255,110,200,0.8)' : 'rgba(120,255,180,0.85)'; c.fillRect(wx, wy, 1, 1.1); }
        }
        x += bw + (r() < 0.3 ? 1 : 0);
      }
    }
    // the water line's faint shine
    c.fillStyle = 'rgba(80,220,160,0.08)'; c.fillRect(0, h - 2, w, 2);
  });
}

/** the beam: a cone from the belly to the ground, three nested (a soft edge without blur), pulsing */
function beam(c, x, y0, w0, w1, h, k) {
  c.globalCompositeOperation = 'lighter';
  for (const [f, a] of [[1.35, 0.1], [1, 0.2], [0.55, 0.3]]) {
    const g = c.createLinearGradient(0, y0, 0, h);
    g.addColorStop(0, `rgba(150,255,195,${a * k})`); g.addColorStop(0.6, `rgba(110,255,170,${a * 0.65 * k})`); g.addColorStop(1, `rgba(90,240,160,${a * 0.42 * k})`);
    c.fillStyle = g; c.globalAlpha = 1;
    c.beginPath(); c.moveTo(x - w0 * f / 2, y0); c.lineTo(x + w0 * f / 2, y0); c.lineTo(x + w1 * f / 2, h); c.lineTo(x - w1 * f / 2, h); c.closePath(); c.fill();
  }
}

export default {
  id: 'ufo', tier: 'legendary', bleed: 10, stillT: 4.2,
  draw(c, s, t, Q) {
    want();
    const { w, h } = s, dpr = Math.min(3, Math.round(Q.dpr * 4) / 4), still = Q.still;
    const rad = s.opts.radius || 12;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(sky(w, h, dpr), 0, 0, w, h);
    // twinkling stars (a few, over the baked ones)
    const r = rng(77);
    for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h * 0.5, p = r() * 6; stamp(c, glow('220,255,235', 0.3, 16), x, y, 5, still ? 0.5 : 0.25 + 0.6 * Math.max(0, Math.sin(t * 1.3 + p))); }
    // the craft: right of the name plate, high in the strip; a slow bob + a slow turn
    const R = h * 0.84, cx = w * 0.6, cy = h * 0.24 + (still ? 0 : wob(t * 0.45, 2) * h * 0.035);
    const pulse = still ? 0.9 : 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.2)) + 0.05 * wob(t * 3, 5);
    const belly = cy + R * 0.27;
    beam(c, cx, belly, R * 0.5, R * 1.7, h + 2, pulse * (s.opts.calm ? 0.85 : 1));
    // the pool on the skyline
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('110,255,175', 0.1, 64), cx, h - 2, R * 2.2, 0.35 * pulse, R * 0.6);
    // motes rising in the beam
    const nm = Math.round(26 * Q.q * (s.opts.calm ? 0.7 : 1)), mr = rng(5);
    for (let i = 0; i < nm; i++) {
      const sp = 0.18 + mr() * 0.22, ph = mr(), u = still ? (ph * 0.9 + 0.05) : ((t * sp + ph) % 1);
      const y = h - u * (h - belly - 2), wy = R * 0.5 + (R * 1.7 - R * 0.5) * ((y - belly) / (h - belly));
      const x = cx + (mr() - 0.5) * wy * 0.7 + Math.sin(t * 1.4 + i) * 1.2;
      stamp(c, glow('200,255,220', 0.35, 16), x, y, 2.4 + mr() * 1.6, 0.85 * Math.sin(u * Math.PI));
    }
    c.globalCompositeOperation = 'source-over';
    if (model && model.rows && model.rows.hi && fxDiag.sprites) {
      const row = model.rows.hi, i = frameAt(row, still ? 4 : t * 7);
      c.save(); c.translate(cx, cy);
      // (its shadow side lit from below by its own beam: a faint green under-glow first)
      c.globalCompositeOperation = 'lighter'; stamp(c, glow('90,255,160', 0.1, 64), 0, R * 0.2, R * 2.2, 0.28 * pulse, R * 0.7);
      c.globalCompositeOperation = 'source-over';
      drawBody(c, row, i, R, 1, 1);
      c.globalCompositeOperation = 'lighter';
      drawLights(c, row, i, R, 0.55 + 0.25 * pulse, 1);
      // THE PORTS CHASE: each port brightened as a wave runs round the rim (by its world angle)
      for (const p of portsAt(row, i)) {
        const b = still ? 0.7 : 0.25 + 0.75 * Math.pow(Math.max(0, Math.cos(p.az - t * 3.1)), 3);
        stamp(c, glow('120,255,170', 0.25, 32), p.x * R, p.y * R, R * (0.2 + p.size * 2.2), b * 0.9);
      }
      c.restore();
    } else {
      // (the sprite still on its way: a soft silhouette glow where the craft will be)
      c.globalCompositeOperation = 'lighter'; stamp(c, glow('120,255,170', 0.2, 64), cx, cy, R * 2, 0.3, R * 0.5);
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // THE BORDER LASER — over the edge, its glow bleeding out
    drawLaser(c, w, h, t, { rgb: '120,255,190', still, radius: rad });
  },
};
export const ufoReady = () => !!model;
