// `card-sg-fireball` — card-sg-fireball (THE VAULT 1C; the owner: "the fireball streaking across the night"). The city's fireball
// (screens/harbor/meteors.js: a big slow GREEN-WHITE streak that FLARES + BREAKS UP, its glowing TRAIN lingering) given the whole card:
// a deep night with the Milky Way's band, the harbor's skyline + its water; the bolide comes in from the top left — a hot white core in a
// green head, a tapering tail through amber to red — FLARES (the sky + the water light up for an instant), BREAKS into four burning
// pieces that fan out + burn out, shedding sparks; behind it the PERSISTENT TRAIN glows on, cooling from green to a faint blue-grey
// ribbon that drifts + fades. A 6-second loop (one fireball a loop, the quiet sky between).
import { glow, stamp, sprite, sparkle, rng, clamp01 } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { backdrop, skylineLayer, bakeDpr, stage } from './sg-kit.js';

const LOOP = 4.2, FLY = 2.4;
const SKY = { sky: [[0, '#030616'], [0.45, '#071030'], [0.7, '#0b1636'], [1, '#03050c']], stars: 46, starRgb: '220,230,255', starTo: 0.66, seed: 91,
  glow: [{ x: 0.62, y: 0.2, r: 0.5, rgb: '120,140,220', a: 0.12, sy: 0.25 }, { x: 0.3, y: 0.32, r: 0.35, rgb: '160,150,220', a: 0.08, sy: 0.3 }] };
/** THE MILKY WAY: a band of fine stars across the sky (baked once per size) */
const milky = (w, h, dpr, full) => sprite(`sg-milky:${w}x${h}@${dpr}:${full}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr); const r = rng(55), n = Math.round(w * (full ? 3.2 : 1.6));
  const g = c.createLinearGradient(0, full ? h * 0.62 : h * 0.9, w, full ? h * 0.12 : 0);
  for (let i = 0; i < n; i++) {
    const u = r(), v = (r() + r() + r() - 1.5) * 0.16, x = u * w * 1.2 - w * 0.1, y = (full ? h * (0.62 - u * 0.5) : h * (0.9 - u * 0.9)) + v * h;
    c.fillStyle = `rgba(230,234,255,${0.15 + r() * 0.55})`; const s = r() < 0.1 ? 1.2 : 0.6; c.fillRect(x, y, s, s);
  }
  void g;
});
const CITY = { y: 0.7, gap: 0.05, tall: 0.07, dark: ['#070b18', '#03050c'], win: [['255,214,140', 0.55], ['236,240,255', 0.25], ['255,120,200', 0.2]], p: 0.14 };

/** the head's tail: a long tapered streak baked along +x (its head at the right): white → green → amber → red → nothing */
const streak = () => sprite('sg-fb-tail', 256, 32, (c, W, H) => {
  const band = (k, stops) => {
    const g = c.createLinearGradient(W, 0, 0, 0); for (const [u, col] of stops) g.addColorStop(u, col);
    c.fillStyle = g; c.beginPath(); c.moveTo(W, H / 2 - H * 0.5 * k); c.quadraticCurveTo(W * 0.5, H / 2 - H * 0.12 * k, 0, H / 2); c.quadraticCurveTo(W * 0.5, H / 2 + H * 0.12 * k, W, H / 2 + H * 0.5 * k); c.closePath(); c.fill();
  };
  c.globalCompositeOperation = 'lighter';
  band(1, [[0, 'rgba(120,255,150,0.55)'], [0.25, 'rgba(255,190,80,0.35)'], [0.6, 'rgba(255,80,40,0.16)'], [1, 'rgba(255,60,30,0)']]);
  band(0.45, [[0, 'rgba(240,255,240,1)'], [0.2, 'rgba(160,255,170,0.7)'], [0.5, 'rgba(255,200,110,0.3)'], [1, 'rgba(255,150,60,0)']]);
});

export default {
  id: 'sg-fireball', tier: 'legendary', bleed: 10, stillT: 1.65,
  draw(c, s, t, Q) {
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12;
    const tt = still ? 1.65 : t, e = tt % LOOP;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    const water = full ? 0.82 : 1.2;
    c.drawImage(backdrop(full ? 'fb-full' : 'fb', w, h, dpr, { ...SKY, water: full ? { y: water, top: '#060b1c', bottom: '#020308', shine: '160,190,255' } : null }), 0, 0, w, h);
    c.globalAlpha = 0.9; c.drawImage(milky(w, h, dpr, full), 0, 0, w, h); c.globalAlpha = 1;
    // the path: in from the top left, down to the right
    const A = full ? [-w * 0.05, h * 0.03] : [w * 0.34, -h * 0.2], B = full ? [w * 0.92, h * 0.46] : [w * 1.04, h * 0.66];
    const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const at = u => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
    const pr = clamp01(e / FLY), flare = Math.exp(-(((e - FLY * 0.62) / 0.12) ** 2)), on = e < FLY + 0.6;
    const flash = flare * 0.85;
    // THE FLASH lights the sky + the water (under everything else)
    c.globalCompositeOperation = 'lighter';
    if (flash > 0.02) {
      const F = at(0.62);
      stamp(c, glow('150,255,170', 0.05, 64), F[0], F[1], w * 1.6, 0.35 * flash, h * 1.4);
      if (full) stamp(c, glow('150,255,190', 0.1, 64), F[0], water * h + 4, w * 0.5, 0.5 * flash, h * 0.08);
    }
    // THE PERSISTENT TRAIN: every bit of the path glows from the moment the head passed, cooling + fading over ~3 s, drifting a hair
    const unit = full ? h * 0.46 : h;
    const N = full ? 34 : 22, segL = L / N * 2.4;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N, passed = u * FLY; if (passed > e || u > 1.02) continue;
      const age = e - passed, a = Math.exp(-age / 2.6) * (u > 0.62 ? 0.6 : 1), cool = clamp01(age / 2.2);
      if (a < 0.02) continue;
      const [x, y] = at(u), dr = age * 1.2;
      c.save(); c.translate(x, y + dr); c.rotate(ang);
      const col = cool < 0.35 ? '150,255,170' : cool < 0.7 ? '140,230,200' : '150,170,235';
      c.globalAlpha = Math.min(1, a * 0.7); c.drawImage(glow(col, 0.25, 64), -segL / 2, -unit * (0.035 + age * 0.02), segL, unit * (0.07 + age * 0.04));
      c.restore();
    }
    // (the last loop's train, still fading: the sky never empty)
    if (e < 1.6) {
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N; if (u > 0.66) continue;
        const age = LOOP - u * FLY + e, a = Math.exp(-age / 2.6) * 0.9; if (a < 0.02) continue;
        const [x, y] = at(u); c.save(); c.translate(x, y + age * 1.2); c.rotate(ang); c.globalAlpha = Math.min(1, a * 0.5);
        c.drawImage(glow('150,170,230', 0.25, 64), -segL / 2, -unit * (0.035 + age * 0.02), segL, unit * (0.07 + age * 0.04)); c.restore();
      }
    }
    // THE HEAD (+ its tail) — until it breaks up
    if (on && pr < 0.66) {
      const [x, y] = at(pr), tl = unit * (0.9 + pr * 0.5);
      c.save(); c.translate(x, y); c.rotate(ang);
      c.globalAlpha = 1; c.drawImage(streak(), -tl, -unit * 0.07, tl, unit * 0.14);
      c.restore();
      stamp(c, glow('120,255,150', 0.15, 64), x, y, unit * (0.6 + flare * 0.9), 0.85);
      stamp(c, glow('240,255,240', 0.4, 32), x, y, unit * (0.14 + flare * 0.25), 1);
      if (flare > 0.1) stamp(c, sparkle('230,255,230'), x, y, unit * 0.8 * flare, flare);
    }
    // THE BREAK-UP: four pieces fan out, each a smaller head + tail, burning out
    if (on && pr >= 0.6) {
      const k0 = clamp01((e - FLY * 0.6) / (FLY * 0.4 + 0.6)), fr = rng(5);
      for (let j = 0; j < 4; j++) {
        const spread = (j - 1.5) * 0.045 * k0, lag = j * 0.025 + fr() * 0.02, u = 0.6 + (1 - 0.6) * k0 - lag, burn = (1 - k0) * (0.6 + 0.4 * fr());
        if (burn < 0.03) continue;
        const [x0, y0] = at(u), x = x0 - Math.sin(ang) * spread * L, y = y0 + Math.cos(ang) * spread * L, tl = unit * 0.45 * burn;
        c.save(); c.translate(x, y); c.rotate(ang + spread * 0.6); c.globalAlpha = burn; c.drawImage(streak(), -tl, -unit * 0.035, tl, unit * 0.07); c.restore();
        stamp(c, glow(j % 2 ? '255,200,110' : '140,255,160', 0.2, 32), x, y, unit * 0.16 * burn + 2, burn);
        stamp(c, glow('255,255,240', 0.5, 32), x, y, unit * 0.04 * burn + 1, burn);
      }
      // the sparks shed in the break-up
      const sr = rng(19), ns = Math.round(24 * Q.q);
      for (let i = 0; i < ns; i++) {
        const born = 0.6 + sr() * 0.3, age = (e - FLY * born) / 0.9; if (age < 0 || age > 1) continue;
        const [x0, y0] = at(born), vx = (sr() - 0.3) * unit * 0.5, vy = (sr() - 0.2) * unit * 0.5;
        stamp(c, glow('255,220,150', 0.4, 16), x0 + vx * age, y0 + vy * age + age * age * unit * 0.2, 2.2, (1 - age) * 0.9);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the harbor: its skyline lit green in the flash
    c.drawImage(skylineLayer(full ? 'fb-full' : 'fb', w, h, dpr, { ...CITY, y: full ? 0.72 : 0.9, tall: full ? 0.07 : 0.12 }, full ? water * h : h, 93, 'all'), 0, 0, w, h);
    if (flash > 0.02) { c.globalCompositeOperation = 'lighter'; stamp(c, glow('150,255,180', 0.05, 64), w * 0.6, full ? h * 0.72 : h * 0.95, w * 1.2, 0.25 * flash, h * 0.2); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '190,255,140', still, radius: rad });
  },
};
