// `card-penthouse` (epic — two effects): THE VIEW FROM UP HERE — the city at night far below a penthouse window, its grid of lights
// running away to the horizon (baked once per size: avenues + blocks in perspective, warm + cool lamps, a few neon signs), the lights
// TWINKLING, and TRAFFIC streaming along the avenues (white headlights coming, red tail lights going). The window's gold mullions are
// the card's material (css/vault.css .vl-s-penthouse).
import { glow, stamp, sprite, rng } from './kit.js';
import { rrect } from './renderer.js';

/** the grid's geometry: the horizon at hz, the vanishing point at vx; avenues fan out from it */
function geo(w, h, full) { return { hz: h * (full ? 0.34 : 0.3), vx: w * (full ? 0.55 : 0.68), av: full ? 13 : 9 }; }
const city = (w, h, dpr, full) => sprite(`fx-pent:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr);
  const { hz, vx, av } = geo(w, h, full), r = rng(17);
  // the sky over the far horizon: a band of the city's glow
  const g = c.createLinearGradient(0, 0, 0, hz * 1.4); g.addColorStop(0, 'rgba(10,10,30,0)'); g.addColorStop(0.75, 'rgba(120,70,120,0.35)'); g.addColorStop(1, 'rgba(255,170,110,0.25)');
  c.fillStyle = g; c.fillRect(0, 0, w, hz * 1.4);
  // the blocks' lights: points on a perspective grid (rows denser toward the horizon)
  for (let row = 1; row < 60; row++) {
    const z = row / 60, y = hz + (h - hz) * Math.pow(z, 2.2), spread = 0.15 + z * 2.2;
    const n = Math.round(14 + 30 * (1 - z));
    for (let i = 0; i < n; i++) {
      const u = (i + r()) / n, x = vx + (u - 0.5) * w * spread;
      if (x < -4 || x > w + 4 || r() < 0.35) continue;
      const k = r(), col = k < 0.55 ? '255,206,140' : k < 0.85 ? '220,230,255' : k < 0.93 ? '255,110,200' : '120,255,220';
      c.fillStyle = `rgba(${col},${0.5 + 0.5 * r()})`; const sz = 0.7 + z * 2; c.fillRect(x, y, sz, sz * 0.8);
    }
  }
  // the avenues: faint lines of streetlight fanning from the vanishing point
  for (let a = 0; a < av; a++) {
    const u = a / (av - 1) - 0.5, x1 = vx + u * w * 2.6;
    c.strokeStyle = 'rgba(255,190,120,0.3)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(vx + u * 6, hz); c.lineTo(x1, h); c.stroke();
  }
});

export default {
  id: 'penthouse', tier: 'epic', bleed: 0, stillT: 1.9,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, tt = Q.still ? 1.9 : t;
    const dpr = Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4)), { hz, vx, av } = geo(w, h, full);
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(city(w, h, dpr, full), 0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    // TWINKLE: a scatter of the lights catching (the air shimmering over the city)
    const r = rng(9), n = Math.round((full ? 40 : 18) * (0.5 + 0.5 * Q.q));
    for (let i = 0; i < n; i++) {
      const z = Math.pow(r(), 0.6), y = hz + (h - hz) * Math.pow(z, 2.2), x = vx + (r() - 0.5) * w * (0.15 + z * 2.2);
      const tw = Q.still ? 0.5 : Math.max(0, Math.sin(tt * (1.5 + r() * 2) + i * 1.3));
      stamp(c, glow(r() < 0.6 ? '255,214,160' : '220,232,255', 0.4, 16), x, y, 2 + z * 4, tw * 0.8);
    }
    // TRAFFIC: dots streaming along the avenues — headlights toward you, tail lights away
    const na = Math.round((full ? 3 : 2) * (0.7 + 0.3 * Q.q));
    for (let a = 0; a < av; a++) {
      const u = a / (av - 1) - 0.5, x0 = vx + u * 6, x1 = vx + u * w * 2.6;
      for (let k = 0; k < na; k++) {
        for (const [col, dir, ph] of [['255,250,230', 1, 0], ['255,70,60', -1, 0.5]]) {
          let p = ((tt * 0.07 * (1 + (a % 3) * 0.2) * dir + k / na + ph + a * 0.13) % 1 + 1) % 1, z = Math.pow(p, 1.6);
          const x = x0 + (x1 - x0) * z + dir * 1.5 * z, y = hz + (h - hz) * z;
          if (y > h || x < 0 || x > w) continue;
          stamp(c, glow(col, 0.4, 16), x, y, 1.5 + z * 4, 0.85);
        }
      }
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
