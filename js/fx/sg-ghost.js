// `card-sg-ghostship` — card-sg-ghostship (THE VAULT 1C; the owner: "the ghost ship (Halloween), its green lantern + fog on the water").
// The city's OWN ghost ship (screens/harbor/ghostship.js#ghostArt — the translucent spectral galleon, its tattered sails, its rigging +
// lit ports, baked once per size, the same two passes + its bloom) under sail on Halloween night: a big pale moon in a green haze, the
// ship riding a slow swell (bob + roll), its LANTERNS flickering green, its glow breathing, its REFLECTION rippling on the black water,
// the moon's glitter path, FOG BANKS drifting across the water + mist rolling off the hull, a few bats crossing the moon (a full card).
import { glow, stamp, puff, sprite, rng, wob, clamp01 } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';
import { city, backdrop, bakeDpr, stage } from './sg-kit.js';

const BX0 = -4.5, BX1 = 38.5, BU0 = -1.6, BU1 = 31;          // (the ship's box in its own units — ghostship.js)
const SKY = { sky: [[0, '#020807'], [0.3, '#061712'], [0.47, '#0e2f25'], [0.5, '#0a2019'], [0.62, '#04110d'], [1, '#010504']], stars: 16, starRgb: '210,255,230', starTo: 0.42, seed: 31,
  glow: [{ x: 0.19, y: 0.31, r: 0.5, rgb: '120,220,170', a: 0.26 }, { x: 0.5, y: 0.47, r: 0.9, rgb: '90,200,150', a: 0.12, sy: 0.15 }],
  clouds: [{ y0: 0.05, y1: 0.35, rgb: '60,110,90', a: 0.16, n: 9, sx: 7 }] };
const SKY_STRIP = { ...SKY, sky: [[0, '#03100c'], [0.6, '#0d2c22'], [0.72, '#0a2019'], [1, '#010504']], glow: [{ x: 0.95, y: 0.3, r: 0.22, rgb: '120,220,170', a: 0.3 }], clouds: [{ y0: 0, y1: 0.5, rgb: '60,110,90', a: 0.16, n: 8, sx: 9 }] };

/** the moon: a pale disc, soft maria, a cold rim, its halo */
const moon = () => sprite('sg-moon', 128, 128, (c, W) => {
  const m = W / 2, R = W * 0.36;
  let g = c.createRadialGradient(m, m, R * 0.9, m, m, m); g.addColorStop(0, 'rgba(190,255,220,0.35)'); g.addColorStop(1, 'rgba(190,255,220,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, W);
  g = c.createRadialGradient(m - R * 0.3, m - R * 0.3, 0, m, m, R); g.addColorStop(0, '#fbfff2'); g.addColorStop(0.7, '#dfeedd'); g.addColorStop(1, '#b8d4c4');
  c.fillStyle = g; c.beginPath(); c.arc(m, m, R, 0, Math.PI * 2); c.fill();
  const r = rng(8);
  c.save(); c.beginPath(); c.arc(m, m, R, 0, Math.PI * 2); c.clip();
  for (let i = 0; i < 9; i++) { const x = m + (r() - 0.5) * R * 1.4, y = m + (r() - 0.5) * R * 1.4, rr = R * (0.12 + r() * 0.22); const gg = c.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, 'rgba(120,150,140,0.35)'); gg.addColorStop(1, 'rgba(120,150,140,0)'); c.fillStyle = gg; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  c.restore();
});
/** a bat (wings at a flap phase 0..1): a silhouette */
function bat(c, x, y, s, f) {
  const up = Math.sin(f * Math.PI * 2);
  c.beginPath(); c.moveTo(x, y);
  c.quadraticCurveTo(x - s * 0.5, y - s * 0.5 * up - s * 0.1, x - s, y - s * 0.3 * up);
  c.lineTo(x - s * 0.6, y + s * 0.05); c.lineTo(x - s * 0.3, y - s * 0.02); c.lineTo(x, y + s * 0.15);
  c.lineTo(x + s * 0.3, y - s * 0.02); c.lineTo(x + s * 0.6, y + s * 0.05); c.lineTo(x + s, y - s * 0.3 * up);
  c.quadraticCurveTo(x + s * 0.5, y - s * 0.5 * up - s * 0.1, x, y); c.closePath(); c.fill();
}

const arts = new Map();
function art(G, k, dpr) {
  const key = `${k.toFixed(3)}@${dpr}`;
  if (!arts.has(key)) { if (arts.size > 4) { for (const a of arts.values()) for (const cv of [a.body, a.lines, a.glow]) cv.width = cv.height = 0; arts.clear(); } arts.set(key, G.ghostArt(k, dpr)); }
  return arts.get(key);
}

export default {
  id: 'sg-ghost', tier: 'legendary', bleed: 10, stillT: 2.6,
  draw(c, s, t, Q) {
    const G = city('ghostship', () => import('../screens/harbor/ghostship.js'));
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 2.6 : t;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    const horizon = full ? h * 0.47 : h * 0.72;
    c.drawImage(backdrop(full ? 'gh-full' : 'gh', w, h, dpr, { ...(full ? SKY : SKY_STRIP), water: { y: horizon / h, top: '#06211a', bottom: '#010503', shine: '150,255,210' } }), 0, 0, w, h);
    // THE MOON + its glitter path on the water
    const mx = full ? w * 0.19 : w * 0.95, my = full ? h * 0.31 : h * 0.3, mr = full ? h * 0.34 : h * 0.62;   // (clear of the ship's whole crossing — the owner's note)
    c.drawImage(moon(), mx - mr / 2, my - mr / 2, mr, mr);
    c.globalCompositeOperation = 'lighter';
    const gr = rng(17), ng = full ? 26 : 10;
    for (let i = 0; i < ng; i++) {
      const v = gr(), y = horizon + 2 + v * v * (h - horizon) * 0.9, x = mx + (gr() - 0.5) * (6 + v * mr * 0.5), tw = still ? 0.5 : 0.5 + 0.5 * Math.sin(tt * (2 + gr() * 3) + i);
      c.globalAlpha = 0.25 * tw * (1 - v * 0.6); c.fillStyle = 'rgb(220,255,236)'; c.fillRect(x - 2 - v * 3, y, 4 + v * 6, 0.8);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the bats across the moon (a full card)
    if (full) {
      c.fillStyle = 'rgb(4,10,8)';
      for (let i = 0; i < 3; i++) {
        const P = 9 + i * 2.3, u = still ? 0.4 + i * 0.08 : ((tt + i * 3.1) % P) / P, x = mx - mr * 0.9 + u * mr * 2.2, y = my - mr * 0.15 + i * mr * 0.12 + Math.sin(u * 9 + i) * 3;
        bat(c, x, y, 4.5 - i * 0.6, still ? 0.2 : tt * 3.2 + i * 0.4);
      }
    }
    // THE SHIP SAILS: materialises, crosses on the swell with its wake, dissolves, comes again (a 26-s crossing)
    const CROSS = 26, cu = still ? 0.5 : (tt % CROSS) / CROSS;
    const shipH = full ? h * 0.4 : h * 0.78, k = shipH / (BU1 - BU0);
    const xa = full ? w * 0.4 : w * 0.5, xb = full ? w * 0.84 : w * 0.82, cx = xa + (xb - xa) * cu;
    const step = Math.floor(tt * 6), hsh = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    const fadeIn = Math.min(1, cu / 0.09), fadeOut = Math.min(1, (1 - cu) / 0.1);
    const appear = still ? 1 : Math.min(fadeIn, fadeOut) * ((fadeIn < 1 || fadeOut < 1) && hsh(step) < 0.4 ? 0.35 + 0.5 * hsh(step + 7) : 1);
    const bob = still ? 0 : (Math.sin(tt * 0.9) * 0.38 + Math.sin(tt * 0.37 + 1) * 0.2) * k, roll = still ? 0 : Math.sin(tt * 0.7) * 0.05 + Math.sin(tt * 0.31) * 0.02;
    const pulse = still ? 0.92 : 0.84 + 0.16 * Math.sin(tt * 0.9) * Math.sin(tt * 0.37 + 2);
    const flick = (still ? 1 : (Math.floor(tt * 3) % 7 === 3 ? 0.78 : 1)) * appear;
    // ITS WAKE: a glowing furrow on the water behind the stern + a bow wave, fading back (under the ship)
    if (appear > 0.02) {
      c.globalCompositeOperation = 'lighter';
      const stern = cx + (BX0 - 15 + 4) * k, bow = cx + (BX1 - 15 - 4) * k;
      for (let i = 0; i < 9; i++) {
        const back = i * k * 2.6, x = stern - back, wy = horizon + 1.5 + i * 0.35, a = (1 - i / 9) * 0.34 * appear;
        stamp(c, glow('150,255,200', 0.15, 32), x, wy, k * (5 + i * 1.6), a * (still ? 0.8 : 0.75 + 0.25 * Math.sin(tt * 3 + i)), k * (0.9 + i * 0.12));
      }
      stamp(c, glow('200,255,225', 0.3, 32), bow, horizon + 1, k * 4, 0.45 * appear * (still ? 1 : 0.7 + 0.3 * Math.sin(tt * 4)), k * 0.9);
      c.globalCompositeOperation = 'source-over';
    }
    if (G && fxDiag.sprites) {
      const A = art(G, k, dpr), x0 = (BX0 - 15) * k, y0 = -BU1 * k;
      // the REFLECTION first: the ship flipped under its waterline, rippling in slices, faint
      c.save(); c.translate(cx, horizon + 1); c.scale(1, -0.62);
      const nS = full ? 10 : 6, sh = A.h / nS;
      for (let i = 0; i < nS; i++) {
        const off = still ? 0 : Math.sin(tt * 1.6 + i * 0.9) * k * 0.35 * (i / nS + 0.3), sy = (A.h - (i + 1) * sh);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * pulse * flick * (0.5 + 0.5 * (i / nS));
        c.drawImage(A.lines, 0, sy * dpr, A.w * dpr, sh * dpr, x0 + off, y0 + sy, A.w, sh);
        c.globalAlpha = 0.3 * pulse * appear * (0.5 + 0.5 * (i / nS));
        c.drawImage(A.glow, 0, sy * dpr * 0.5, A.w * dpr * 0.5, sh * dpr * 0.5, x0 + off, y0 + sy, A.w, sh);
      }
      c.restore();
      c.save(); c.translate(cx, horizon - bob); c.rotate(roll);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.82 * pulse * flick);
      c.drawImage(A.glow, x0 - k * 0.6, y0 - k * 0.6, A.w + k * 1.2, A.h + k * 1.2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.95 * flick;
      c.drawImage(A.body, x0, y0, A.w, A.h);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (0.88 + 0.12 * pulse) * flick);
      c.drawImage(A.lines, x0, y0, A.w, A.h);
      // THE LANTERNS: flickering green flames, their halos (the stern's the biggest)
      for (const [la, lu, sz] of G.LANTERNS) {
        const fl = still ? 0.9 : 0.72 + 0.28 * Math.sin(tt * 11 + la) * Math.sin(tt * 7.3 + lu);
        const lx = (la - 15) * k, ly = -lu * k, R = k * (3 + 2.4 * sz) * fl;
        stamp(c, glow('140,255,130', 0.15, 64), lx, ly, R * 3.2, 0.5 * sz * fl * appear);
        stamp(c, glow('190,255,160', 0.35, 32), lx, ly, R, 0.95 * fl * appear);
        stamp(c, glow('240,255,210', 0.5, 32), lx, ly, Math.max(2, k * 0.6 * sz), appear);
        // its column of light on the water
        if (sz > 0.6) stamp(c, glow('120,255,160', 0.1, 32), lx, lu * k * 0.62 + bob * 1.6, k * 2, 0.35 * fl * sz * appear, lu * k * 0.9);
      }
      c.restore();
    } else { c.globalCompositeOperation = 'lighter'; stamp(c, glow('90,255,160', 0.15, 64), cx, horizon - shipH * 0.45, shipH, 0.3); }
    // FOG on the water: long banks drifting right → left across the horizon (+ the mist off the hull)
    c.globalCompositeOperation = 'source-over';
    const fr = rng(41), nf = Math.round((full ? 16 : 8) * Q.q + 4);
    for (let i = 0; i < nf; i++) {
      const sp = 4 + fr() * 7, span = w * 1.6, x = w * 1.3 - (((still ? 0 : tt) * sp + fr() * span) % span), y = horizon + (fr() - 0.35) * (full ? h * 0.12 : h * 0.22);
      const R = (full ? w * 0.3 : w * 0.22) * (0.6 + fr() * 0.6);
      stamp(c, puff('170,235,210', i % 4, 128), x, y, R, 0.42 + 0.3 * fr(), R * 0.26);
    }
    c.globalCompositeOperation = 'lighter';
    const nm = Math.round((full ? 10 : 5) * Q.q + 2), mr2 = rng(52);
    for (let i = 0; i < nm; i++) {
      const u = still ? (i / nm) : ((tt * (0.08 + mr2() * 0.06) + mr2()) % 1), x = cx + (mr2() - 0.5) * shipH * 0.9 - u * shipH * 0.5, y = horizon - shipH * 0.04 + u * shipH * 0.12;
      stamp(c, puff('150,255,210', i % 4, 128), x, y, shipH * (0.3 + u * 0.5), 0.22 * Math.sin(u * Math.PI) * (0.25 + 0.75 * appear), shipH * (0.1 + u * 0.12));
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '130,255,200', still, radius: rad });
  },
};
