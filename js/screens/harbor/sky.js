// CITY 2.0 — THE HARBOR: the sky's own paint — the hour's gradient (palette.js, from the real sky: core/sky.js#look) and the
// glow low over the harbor, repainted only when the look changes. The real sky ON it (the stars, the sun, the moon, planes,
// clouds, rain, birds, fireworks, rainbows) is the district's sky modules, called as they are (docs/harbor.md#sky).
import { css } from '../district/palette.js';

export function paintSky(cv, W, HZ, dpr, P, o = {}) {
  const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(HZ * dpr));
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  const x = cv.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  // (THE DAY PASS: o.stops — the Harbor's own day sky, tones.js#harborSky; the palette's at night)
  const st = o.stops || P.sky;
  const g = x.createLinearGradient(0, 0, 0, HZ);
  g.addColorStop(0, css(st[0])); g.addColorStop(0.45, css(st[1])); g.addColorStop(0.8, css(st[2])); g.addColorStop(1, css(st[3]));
  x.fillStyle = g; x.fillRect(0, 0, W, HZ);
  const hg = x.createRadialGradient(W * 0.5, HZ * 1.02, 0, W * 0.5, HZ * 1.02, Math.max(W, HZ) * 0.9);
  hg.addColorStop(0, css(P.glow)); hg.addColorStop(0.45, css(P.glow2)); hg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = hg; x.fillRect(0, 0, W, HZ);
  // NEON PASS 3 — THE CITY'S LIGHT ON THE NIGHT AIR: a real neon city lights the haze over it — a soft violet bloom over the
  // middle of the skyline, teal toward the right, a warm magenta hint at the left; low over the roofs (o.roof: the roofline's
  // median), fading up into the dark. Baked here with the sky (no cost a frame); stronger the darker the night.
  const k = Math.max(0, Math.min(1, ((P.dark || 0) - 0.3) / 0.5)) * (o.k ?? 1);
  if (k > 0.01 && o.roof) {
    const y = o.roof, R = Math.max(W * 0.62, (HZ - y) * 2.2);
    // (NEON PASS 4: a party night's glow, stronger: the city is lit up for the party; o.party 0..1. NEON PASS 5 — the owner: "I
    // don't want them to just be pink": the party's air in the palette's colours — electric blue-violet over the middle, a warm
    // gold to the right, red to the left — never a pink wash)
    const pa = Math.max(0, Math.min(1, o.party || 0));
    const blend = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * pa));
    for (const [fx, col, a, sx, sy] of [[0.5, blend([150, 70, 235], [90, 80, 255]), 0.3 * (1 + 0.15 * pa), 1.25, 0.62], [0.82, blend([40, 200, 210], [255, 170, 60]), 0.2 * (1 + 0.1 * pa), 0.75, 0.5], [0.16, blend([235, 60, 170], [255, 60, 70]), 0.16 * (1 + 0.3 * pa), 0.7, 0.5]]) {
      x.save(); x.translate(W * fx, y); x.scale(sx, sy);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, `rgba(${col},${(a * k).toFixed(3)})`); g.addColorStop(0.4, `rgba(${col},${(a * k * 0.4).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`);
      x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(-R, -R, R * 2, R * 2); x.restore();
    }
    x.globalCompositeOperation = 'source-over';
  }
  return cv;
}
