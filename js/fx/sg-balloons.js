// THE BALLOON CARDS (THE VAULT 1C) — card-sg-skull (`card-sg-skull`) + card-sg-btc (`card-sg-btc`). Both draw the
// city's OWN balloons (screens/harbor/balloons.js#balloonArt — the same envelope, gores, fabric light, the skull / the ₿ painted on, its
// basket; each baked once per size, with its "lit from inside" twin) in a scene of their own:
//   THE SKULL  a cold overcast night over the rooftops (the city's sodium glow under the clouds), the black envelope drifting + swaying,
//              the bone faint in the dark — then the BURNER ROARS in bursts: a tongue of flame at the mouth, the skull LIT FROM BELOW
//              (the city's tap reaction, on its own beat), embers rising
//   THE ₿s     the festival at sunset: the ORANGE ₿ balloon (a black ₿ — the night's look) near, the BLACK one (an orange ₿ — the day's)
//              farther off, the festival's other balloons small in the distance rising, the sun low; the burners flaring now + then; every
//              few seconds a NEW BLOCK — a gold pulse through the ₿ + a ring spreading from it ("tick tock, next block")
import { glow, stamp, lick, rng, wob, smooth, sprite } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';
import { city, backdrop, skylineLayer, bakeDpr, stage } from './sg-kit.js';

const arts = new Map();
function art(B, key, R, scheme, light, dpr, kind) {
  const k = `${key}:${R.toFixed(1)}@${dpr}`;
  if (!arts.has(k)) { if (arts.size > 16) arts.clear(); arts.set(k, B.balloonArt(R, scheme, light, dpr, kind)); }
  return arts.get(k);
}
const loadB = () => city('balloons', () => import('../screens/harbor/balloons.js'));
/** a balloon's burner: a few tongues of flame up into the mouth + its warm halo (b 0..1) */
function burner(c, x, y, R, b, t, still) {
  if (b < 0.02) return;
  c.globalCompositeOperation = 'lighter';
  stamp(c, glow('255,170,70', 0.12, 64), x, y - R * 0.1, R * 1.6, 0.5 * b, R * 1.2);
  const L = lick(64);
  for (let i = 0; i < 3; i++) {
    const fl = still ? 0.9 : 0.75 + 0.25 * Math.sin(t * (31 + i * 7) + i), hh = R * (0.55 + 0.25 * i % 2) * b * fl, ww = hh * 0.42;
    c.globalAlpha = Math.min(1, b * (0.9 - i * 0.2)); c.drawImage(L, x - ww / 2 + (i - 1) * R * 0.04, y - hh, ww, hh);
  }
  stamp(c, glow('255,250,220', 0.5, 32), x, y - R * 0.05, R * 0.18, b);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- card-sg-skull
const NIGHT = { sky: [[0, '#07080e'], [0.45, '#11131c'], [0.75, '#2a1c1a'], [1, '#3a2418']], stars: 6, starTo: 0.25, seed: 101,
  glow: [{ x: 0.5, y: 1.1, r: 0.9, rgb: '255,140,60', a: 0.22, sy: 0.4 }],
  clouds: [{ y0: 0.05, y1: 0.75, rgb: '70,62,74', a: 0.32, n: 16, sx: 5 }, { y0: 0.4, y1: 0.85, rgb: '140,90,60', a: 0.16, n: 10, sx: 6, seed: 3 }] };
const ROOFS = { y: 0.86, gap: 0.06, tall: 0.06, dark: ['#120f12', '#07060a'], win: [['255,190,110', 0.75], ['255,236,200', 0.25]], p: 0.12, rim: 'rgba(255,150,80,0.16)' };
/** the burns: a burst of ~1.4 s every ~4.5 s (a few pulses in it) */
const burnAt = (t, still) => { if (still) return 0.9; const P = 4.6, u = t % P; return u < 1.5 ? Math.min(1, u * 6, (1.5 - u) * 3) * (0.7 + 0.3 * Math.max(0, Math.sin(t * 13))) : 0; };

export const skull = {
  id: 'sg-skull', tier: 'legendary', bleed: 10, stillT: 0.5,
  draw(c, s, t, Q) {
    const B = loadB(), S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 0.5 : t;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'sk-full' : 'sk', w, h, dpr, NIGHT), 0, 0, w, h);
    c.drawImage(skylineLayer(full ? 'sk-full' : 'sk', w, h, dpr, { ...ROOFS, y: full ? 0.88 : 0.96, tall: full ? 0.06 : 0.1 }, h, 111, 'all'), 0, 0, w, h);
    const R = full ? h * 0.14 : h * 0.38, cx = (full ? w * 0.5 : w * 0.69) + (still ? 0 : wob(tt * 0.12, 2) * R * 0.25), top = (full ? h * 0.115 : -h * 0.06) + (still ? 0 : wob(tt * 0.3, 4) * R * 0.06);
    const sway = still ? 0 : wob(tt * 0.5, 7) * 0.025, b = burnAt(tt, still);
    if (B && fxDiag.sprites) {
      const A = art(B, 'skull', R, B.BALLOON_SCHEMES.skull[0], { side: -1, day: 0, gold: 0 }, dpr, 'skull');
      c.save(); c.translate(cx, top + A.oy); c.rotate(sway); c.translate(-cx, -(top + A.oy));
      c.drawImage(A.cv, cx - A.w / 2, top, A.w, A.h);
      // the bone glowing faintly at night (as in the city), brighter in a burn
      c.globalAlpha = 0.1 + 0.45 * b; c.drawImage(A.glow, cx - A.w / 2, top, A.w, A.h);
      // THE ROAR: the flame's warm light thrown UP over the skull from below (the lower half of the envelope, falling off upward)
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.55 * b; c.drawImage(glow('255,140,50', 0.05, 64), cx - A.w * 0.5, top + A.oy, A.w, A.h * 0.62);
      c.globalAlpha = 0.28 * b; c.drawImage(A.glow, cx - A.w / 2, top, A.w, A.h);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      burner(c, cx, top + A.oy + A.mouth + R * 0.06, R, b, tt, still);
      // embers rising out of the mouth in a burn
      const er = rng(3), ne = Math.round(14 * Q.q);
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ne && !still; i++) {
        const ph = er(), u = ((tt * (0.5 + er() * 0.5) + ph) % 1), x = cx + (er() - 0.5) * R * 0.5 + Math.sin(tt * 2 + i) * R * 0.1, y = top + A.oy + A.mouth - u * R * 0.9;
        stamp(c, glow('255,180,90', 0.4, 16), x, y, 2.4, (0.2 + 0.8 * b) * Math.sin(u * Math.PI) * 0.8);
      }
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,150,70', still, radius: rad });
  },
};

// ---------------------------------------------------------------- card-sg-btc
const SUNSET = { sky: [[0, '#16234e'], [0.3, '#3a3a78'], [0.55, '#b06878'], [0.75, '#ff9a5c'], [0.88, '#ffbf72'], [1, '#ffcf8a']], seed: 121,
  glow: [{ x: 0.86, y: 0.84, r: 0.55, rgb: '255,200,120', a: 0.6, sy: 0.55 }, { x: 0.86, y: 0.86, r: 0.1, rgb: '255,246,220', a: 0.95 }],
  clouds: [{ y0: 0.45, y1: 0.8, rgb: '255,170,140', a: 0.22, n: 10, sx: 8 }] };
const HILLS = { y: 0.9, gap: 0.04, tall: 0.05, dark: ['#2a1a2c', '#140c16'], win: [['255,214,140', 1]], p: 0.06 };
const ring = () => sprite('sg-ring', 128, 128, (c, W) => { const m = W / 2, g = c.createRadialGradient(m, m, m * 0.72, m, m, m); g.addColorStop(0, 'rgba(255,200,80,0)'); g.addColorStop(0.55, 'rgba(255,214,110,1)'); g.addColorStop(1, 'rgba(255,190,70,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
const BLOCK = 5.5;

export const btc = {
  id: 'sg-btc', tier: 'legendary', bleed: 10, stillT: 0.35,
  draw(c, s, t, Q) {
    const B = loadB(), S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12, tt = still ? 0.35 : t;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'btc-full' : 'btc', w, h, dpr, SUNSET), 0, 0, w, h);
    const light = { side: 1, day: 0.55, gold: 0.9 };
    if (B && fxDiag.sprites) {
      // the festival far off: small balloons of the city's kinds, rising slowly + drifting
      const fr = rng(7), far = full ? 7 : 4;
      for (let i = 0; i < far; i++) {
        const kind = ['vstripes', 'pinstripes', 'smiley', 'vstripes', 'pinstripes', 'vstripes', 'pinstripes'][i % 7], sch = (B.BALLOON_SCHEMES[kind] || B.BALLOON_SCHEMES.vstripes)[i % 2] || B.BALLOON_SCHEMES[kind][0];
        const Rf = (full ? h : h * 1.6) * (0.035 + fr() * 0.035), A = art(B, `far${i}`, Rf, sch, light, dpr, kind);
        const x = (full ? w * (0.05 + fr() * 0.9) : w * (0.45 + fr() * 0.55)) + (still ? 0 : wob(tt * 0.1, i) * Rf), y = (full ? h * (0.16 + fr() * 0.38) : h * (fr() * 0.5)) - (still ? 0 : ((tt * (1 + fr()) ) % 40) * 0.0);
        c.globalAlpha = 0.85; c.drawImage(A.cv, x - A.w / 2, y, A.w, A.h);
      }
      c.globalAlpha = 1;
      // THE BLACK ₿ (farther, an orange ₿ glowing)
      const R2 = full ? h * 0.085 : h * 0.24, x2 = (full ? w * 0.22 : w * 0.53) + (still ? 0 : wob(tt * 0.15, 3) * R2 * 0.2), y2 = (full ? h * 0.17 : h * 0.04) + (still ? 0 : wob(tt * 0.3, 5) * R2 * 0.08);
      const A2 = art(B, 'btc-black', R2, null, light, dpr, 'bitcoin');
      c.drawImage(A2.cv, x2 - A2.w / 2, y2, A2.w, A2.h);
      // THE ORANGE ₿ (near — the hero)
      const R = full ? h * 0.13 : h * 0.34, x1 = (full ? w * 0.62 : w * 0.67) + (still ? 0 : wob(tt * 0.12, 9) * R * 0.2), y1 = (full ? h * 0.135 : -h * 0.04) + (still ? 0 : wob(tt * 0.28, 1) * R * 0.07);
      const A1 = art(B, 'btc-orange', R, null, light, dpr, 'btc-orange');
      c.drawImage(A1.cv, x1 - A1.w / 2, y1, A1.w, A1.h);
      // A NEW BLOCK: a gold pulse through the hero's ₿ + a ring spreading out from it
      const e = still ? 0.35 : tt % BLOCK, pz = Math.exp(-(((e - 0.35) / 0.22) ** 2));
      c.globalCompositeOperation = 'lighter';
      if (pz > 0.02) { c.globalAlpha = 0.85 * pz; c.drawImage(A1.glow, x1 - A1.w / 2, y1, A1.w, A1.h); }
      if (!still && e < 1.8) { const u = e / 1.8, rr = R * (0.6 + 2.2 * u); c.globalAlpha = 0.55 * (1 - u) * smooth(0, 0.15, u); c.drawImage(ring(), x1 - rr, y1 + A1.oy - rr, rr * 2, rr * 2); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // the burners now + then (each its own beat)
      const bn = (P, o) => { if (still) return 0; const u = (tt + o) % P; return u < 1.1 ? Math.min(1, u * 6, (1.1 - u) * 3) * (0.7 + 0.3 * Math.sin(tt * 15 + o)) : 0; };
      burner(c, x1, y1 + A1.oy + A1.mouth + R * 0.06, R, bn(6.3, 2), tt, still);
      burner(c, x2, y2 + A2.oy + A2.mouth + R2 * 0.06, R2, bn(7.9, 0), tt, still);
    }
    c.drawImage(skylineLayer(full ? 'btc-full' : 'btc', w, h, dpr, { ...HILLS, y: full ? 0.9 : 0.98 }, h, 131, 'all'), 0, 0, w, h);
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,190,70', still, radius: rad });
  },
};
