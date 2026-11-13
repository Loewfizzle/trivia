// JAYWALK CARDS (Nov 12 night — docs/harbor/passes/jaywalk-cards.md; built like REDLINE + PHOTO FINISH, js/fx/oc-cards.js) — the motion of JAYWALK's
// three cards, on the SHARED surface (js/fx/renderer.js — never a canvas per card) through THE GL PAINTER. The art (Grok's master) is the card's
// material (css/vault.css .vl-s-jw-*); this draws what the game adds over it, in ART px mapped exactly like the CSS crop (jw-specs.js#jwMap). The
// FX plates were light on black: scripts/build-jaywalk-cards.mjs turned them into light WITH ALPHA, drawn 'lighter' — no black box ever shows.
// Reduced motion = a still frame (each waits for its images — sg-kit.js#image calls renderer.js#fxAssetIn when one lands).
//   SONIC BOOM (rare): the burners on both plumes (one plate drawn twice, each fitted to its plume) — a fast flicker + the shock diamonds
//     shimmering (a slight breathe along the plume's axis); every 4 s THE RING BURSTS out of the vapor cone (0.6 → 1.15, bright → gone over 0.9 s)
//     with a short white flash, the city's lights dipping for a beat as it passes; calm between bursts.
//   CLOSE ENCOUNTER (rare): THE BEAM under the saucer (its narrow top at the belly) — a slow pulse + a gentle sway (±2°), its pool on the road
//     brightening with each pulse; a SHEEN sliding along the cars' light trails toward the vanishing point (never over the plate's corner).
//   RIGHT OF WAY (legendary — he leads: THE PROMINENCE RULE): THE HOP — the arc draws on toward the kid (0.8 s), the puff blooms at his trailing
//     hip, then fades, every 5 s; the RUNWAY LIGHTS chase toward the camera (a lit dot down each row); THE BORDER LASER in hot pink.
import { stamp, glow, sparkle, fract } from './kit.js';
import { image } from './sg-kit.js';
import { rrect } from './renderer.js';
import { drawLaser } from './laser.js';
import { JW_SPECS, PLATES, jwMap, ringAt, hopAt } from './jw-specs.js';

export const JW_ART = new URL('../../assets/vault/jw/', import.meta.url).href;
const img = n => image(`${JW_ART}jw-${n}.webp`);
const D2R = Math.PI / 180;
/** a hash → [0, 1] (the flicker's steps: the same frame on every phone) */
const hn = k => { const v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
/** draw plate `n` so its point (ax, ay) (original plate px) lands at slot (x, y), turned `ang`°, scaled (sx, sy) slot px per plate px; an optional
 *  source window [u0, u1] across the plate's box (0 → 1) — the hop's draw-on, the trails' sheen slices */
function plate(c, n, ax, ay, x, y, ang, sx, sy, a, win) {
  const im = img(n); if (!im || a <= 0.003) return;
  const [bx, by, bw, bh] = PLATES[n], u0 = win ? win[0] : 0, u1 = win ? win[1] : 1; if (u1 <= u0) return;
  c.save(); c.translate(x, y); if (ang) c.rotate(ang * D2R); c.globalAlpha = Math.min(1, a);
  c.drawImage(im, im.width * u0, 0, im.width * (u1 - u0), im.height, (bx + bw * u0 - ax) * sx, (by - ay) * sy, bw * (u1 - u0) * sx, bh * sy);
  c.restore();
}

function sonicBoom(c, s, t, Q) {
  const S = JW_SPECS['card-sonicboom'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = jwMap(s.w, s.h, full ? S.full : S.strip), k = M.k, X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const calm = full ? 1 : 0.88, R = ringAt(t, still);
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  // 0 · the city's lights dip as the ring passes (a thin dark wash — under everything the effect adds)
  if (R.dip > 0.01) { const [cx, cy, cw, ch] = S.city; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.34 * R.dip; c.fillStyle = 'rgb(2,2,8)'; c.fillRect(X(cx), Y(cy), cw * k, ch * k); }
  c.globalCompositeOperation = 'lighter';
  // 1 · THE BURNERS — one plate, each fitted to its plume: a fast flicker + the diamonds breathing along the axis
  S.plumes.forEach(([nx, ny, ang, sc], i) => {
    const fl = still ? 0.8 : 0.62 + 0.24 * hn(Math.floor(t * 26) + i * 13) + 0.1 * Math.sin(t * 41 + i * 2);
    const br = still ? 1 : 1 + 0.035 * Math.sin(t * 9.5 + i * 1.7) + 0.02 * Math.sin(t * 23 + i);
    plate(c, 'afterburner', 255, 358.5, X(nx), Y(ny), ang, sc * k * br, sc * k * (2 - br), fl * calm);
    stamp(c, glow('255,200,150', 0.3), X(nx + 6), Y(ny), 70 * sc * k, (0.35 + 0.3 * fl) * calm);   // (the nozzle's white-hot mouth)
  });
  // 2 · THE RING bursting out of the vapor cone + the flash
  const [cx, cy] = S.cone;
  if (R.u >= 0) {
    const sc = (S.ring / 217) * (R.scale / 1.15) * k;
    plate(c, 'shockring', 638, 344, X(cx), Y(cy), 0, sc, sc, R.a * 0.9 * calm);
  }
  if (R.flash > 0.01) { stamp(c, glow('255,255,255', 0.32), X(cx), Y(cy), 220 * k, R.flash * 0.85 * calm); stamp(c, sparkle('255,255,255', 64), X(cx), Y(cy), 150 * k, R.flash * calm); }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

const BEAM_LOOP = 2.6, SHEEN = 2.4, SLICES = 30;
function closeEncounter(c, s, t, Q) {
  const S = JW_SPECS['card-closeencounter'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = jwMap(s.w, s.h, full ? S.full : S.strip), k = M.k, X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const calm = full ? 1 : 0.88;
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // 1 · THE BEAM: its tip at the belly, leaning to the pool (+4.6°) + a gentle sway (±2°); a slow pulse
  const p = still ? 0.7 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / BEAM_LOOP), lean = Math.atan2(S.belly[0] - S.pool[0], S.pool[1] - S.belly[1]) / D2R;
  const sway = still ? 0 : 2 * Math.sin(t * 0.9), ang = lean + sway, [kx, ky] = S.beamK;
  plate(c, 'beam', 639, 42, X(S.belly[0]), Y(S.belly[1]), ang, kx * k, ky * k, (0.28 + 0.34 * p) * calm);
  // its pool on the road brightening with each pulse (follows the sway)
  const L = (655 - 42) * ky, px = S.belly[0] - Math.sin(ang * D2R) * L, py = S.belly[1] + Math.cos(ang * D2R) * L;
  stamp(c, glow('120,255,200', 0.22), X(px), Y(py), 300 * k, (0.12 + 0.3 * p) * calm, 70 * k);
  stamp(c, glow('230,255,245', 0.3), X(S.belly[0]), Y(S.belly[1] + 4), 170 * k, (0.12 + 0.18 * p) * calm, 40 * k);   // (the belly glows with it)
  // 2 · THE SHEEN along the trails toward the vanishing point: the plate in SLICES, each lit by a moving band; faded in across calmX (art x)
  const [vx, vy] = S.vanish, ta = S.trailAng * D2R, tk = S.trailK * k, [bx, , bw] = PLATES.trails;
  const u = still ? 0.55 : fract(t / SHEEN) * 1.5 - 0.25;
  for (let i = 0; i < SLICES; i++) {
    const u0 = i / SLICES, u1 = (i + 1) / SLICES, m = (u0 + u1) / 2, band = Math.max(0, 1 - Math.abs(m - u) / 0.2);
    if (band <= 0) continue;
    const artX = vx + Math.cos(ta) * (bx + bw * m - 1170) * S.trailK, fade = Math.min(1, Math.max(0, (artX - S.calmX[0]) / (S.calmX[1] - S.calmX[0])));
    const a = band * band * (3 - 2 * band) * fade * 0.75 * calm; if (a <= 0.01) continue;
    plate(c, 'trails', 1170, 392, X(vx), Y(vy), S.trailAng, tk, tk, a, [u0, u1]);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

// (the hop's arc as a quadratic through Grok's three points — start, peak, puff — for the bright head that leads the draw-on)
const HOP = [[148, 567], [614, 236], [750, 310]];
const arcY = x => { const [[x0, y0], [x1, y1], [x2, y2]] = HOP; return y0 * ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2)) + y1 * ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2)) + y2 * ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1)); };
const CHASE = 1.7;
function rightOfWay(c, s, t, Q) {
  const S = JW_SPECS['card-rightofway'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = jwMap(s.w, s.h, full ? S.full : S.strip), k = M.k, X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const calm = full ? 1 : 0.9;
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // 1 · THE RUNWAY LIGHTS chase toward the camera: a lit dot down each row (two a row, staggered), growing as it nears
  S.rows.forEach((row, ri) => {
    const seg = row.length - 1;
    for (let d = 0; d < 2; d++) {
      const v = still ? 0.35 + d * 0.4 : fract(t / CHASE + ri * 0.27 + d * 0.5), f = v * seg, j = Math.min(seg - 1, Math.floor(f)), e = f - j;
      const x = row[j][0] + (row[j + 1][0] - row[j][0]) * e, y = row[j][1] + (row[j + 1][1] - row[j][1]) * e, near = 0.55 + 1.1 * v;
      const a = Math.sin(Math.min(1, v * 1.1) * Math.PI) * calm;
      stamp(c, glow('70,150,255', 0.22), X(x), Y(y), 70 * near * k, a * 0.55);
      stamp(c, glow('200,235,255', 0.4), X(x), Y(y), 20 * near * k, a * 0.9);
    }
  });
  // 2 · THE HOP: the arc draws on toward the kid, the puff blooms at his trailing hip (the plate slid: its puff → the hip)
  const H = hopAt(t, still), [hx, hy] = S.hip, ox = hx - 750, oy = hy - 310;
  if (H.a > 0.01) {
    plate(c, 'hop', 750, 310, X(hx), Y(hy), 0, k, k, H.a * 0.95, [0, H.draw]);
    if (!still && H.draw < 1) {   // (the bright head leading the draw-on — faded in past the arc's cleared first third)
      const [bx, , bw] = PLATES.hop, x = Math.min(805, bx + bw * H.draw), fade = Math.min(1, Math.max(0, (x - 300) / 160));
      stamp(c, glow('255,150,225', 0.3), X(x + ox), Y(arcY(x) + oy), 70 * k, 0.8 * fade * H.a);
      stamp(c, sparkle('255,235,250', 48), X(x + ox), Y(arcY(x) + oy), 46 * k, fade * H.a);
    }
  }
  if (H.puff > 0.01) {
    stamp(c, glow('255,170,230', 0.24), X(hx), Y(hy), (110 + 90 * H.puff) * k, 0.55 * H.puff);
    stamp(c, glow('255,240,252', 0.4), X(hx), Y(hy), (40 + 40 * H.puff) * k, 0.7 * H.puff);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // 3 · THE BORDER LASER (every legendary) in hot pink
  c.save(); drawLaser(c, s.w, s.h, t, { rgb: '255,160,225', rgb2: '255,40,170', still, radius: rad }); c.restore();
}

export const jwSonic = { id: 'jwSonic', tier: 'rare', bleed: 0, stillT: 1.3, draw: sonicBoom };
export const jwClose = { id: 'jwClose', tier: 'rare', bleed: 0, stillT: 1.0, draw: closeEncounter };
export const jwRight = { id: 'jwRight', tier: 'legendary', bleed: 0, stillT: 2.2, draw: rightOfWay };
