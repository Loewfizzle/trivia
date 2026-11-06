// OVERCLOCK CARDS (Nov 5 night — the owner's approved mock: Downloads\NEON\gifts\overclock\overclock-cards-mock.png) — the motion of the two
// OVERCLOCK cards, on the SHARED surface (js/fx/renderer.js — never a canvas per card) through THE GL PAINTER. The art (Grok's master) is the
// card's material (css/vault.css .vl-s-oc-*); this draws what the game adds over it, in ART px mapped exactly like the CSS crop
// (oc-specs.js#ocMap — the art is 1280 × 720). The FX plates were light on black: scripts/build-oc-cards.mjs turned them into light
// WITH ALPHA, drawn 'lighter' — no black box ever shows. Reduced motion = the mock's frame (the needle pegged in the red / the laser on the
// line with a soft flash).
//   REDLINE (legendary): THE NEEDLE (a tapered blade, white-hot core + an orange-red glow, pivoting UNDER the chrome cap) sweeps up from rest
//     (7:30) when the card appears, SLAMS into the red, overshoots, then SHAKES like a pegged engine — a hard judder settling into a fine
//     tremble that never stops (a rev now and then); THE HEAT (baked to the red zone's arc) pulses with the shake; THE SPARKS pour off the
//     needle's tip up + right (two staggered copies drifting out, flickering); THE BORDER LASER in molten orange.
//   PHOTO FINISH (rare): THE LASER — a thin red line ON the finish line, a bright point scanning top → bottom + back; as it crosses the noses
//     THE FLASH pops (a white bloom, ~250 ms) + THE SPARKS crackle between the noses; the light trails SHIMMER (a sheen sliding back along them).
import { sprite, stamp, glow, sparkle, smooth, fract } from './kit.js';
import { image } from './sg-kit.js';
import { rrect } from './renderer.js';
import { drawLaser } from './laser.js';
import { OC_SPECS, OC_AH, ocMap } from './oc-specs.js';

export const OC_ART = new URL('../../assets/vault/oc/', import.meta.url).href;
const img = n => image(`${OC_ART}${n}.webp`);
const D2R = Math.PI / 180;
/** a hash → [-1, 1] (the judder's steps: the same frame on every phone) */
const hn = k => { const v = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
/** a stepped noise, eased between its steps (a hard judder, not a smooth wobble) */
const judder = (t, hz, seed = 0) => { const x = t * hz, k = Math.floor(x), u = x - k, e = u * u * (3 - 2 * u); return hn(k + seed) * (1 - e) + hn(k + 1 + seed) * e; };

// ---- the bakes
// the needle: horizontal, pointing right; the pivot at (NP, NH/2); the tip at NT — a tapered blade, an orange-red glow, a white-hot core
const NW = 640, NH = 120, NP = 92, NT = 604;
const needle = () => sprite('oc-needle3', NW, NH, (c, w, h) => {
  const y = h / 2, blade = () => { c.beginPath(); c.moveTo(16, y - 11); c.lineTo(NP, y - 21); c.lineTo(NT, y - 4); c.quadraticCurveTo(NT + 10, y, NT, y + 4); c.lineTo(NP, y + 21); c.lineTo(16, y + 11); c.closePath(); };
  c.save(); c.shadowColor = 'rgba(255,70,20,0.95)'; c.shadowBlur = 22; c.fillStyle = 'rgb(255,84,30)'; blade(); c.fill(); c.fill(); c.restore();
  const g = c.createLinearGradient(0, y - 21, 0, y + 21); g.addColorStop(0, 'rgb(255,96,34)'); g.addColorStop(0.32, 'rgb(255,200,150)'); g.addColorStop(0.5, 'rgb(255,248,236)'); g.addColorStop(0.68, 'rgb(255,190,140)'); g.addColorStop(1, 'rgb(220,52,18)');
  c.fillStyle = g; blade(); c.fill();
  // the white-hot core: a thin line down the blade, hottest toward the tip
  const k = c.createLinearGradient(NP, 0, NT, 0); k.addColorStop(0, 'rgba(255,240,220,0.55)'); k.addColorStop(0.7, 'rgba(255,255,250,1)'); k.addColorStop(1, 'rgba(255,255,255,1)');
  c.fillStyle = k; c.beginPath(); c.moveTo(NP, y - 6.5); c.lineTo(NT - 6, y - 1.8); c.lineTo(NT - 6, y + 1.8); c.lineTo(NP, y + 6.5); c.closePath(); c.fill();
});
// a soft band, bright down its middle column (stretched: the trails' sheen, the laser line's glow)
const band = rgb => sprite(`oc-band:${rgb}`, 64, 64, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h);
});

/** REDLINE's needle angle (degrees, clockwise from 3 o'clock) at T s since the card appeared (t = the surface clock) + how hard it shakes */
export function needleAt(S, T, t, still) {
  if (still) return { a: S.peg, shake: 0.35, inRed: 1 };
  let a, amp;
  if (T < 0.22) a = S.rest;                                                         // a beat at rest
  else if (T < 0.98) { const u = (T - 0.22) / 0.76; a = S.rest + (S.over - S.rest) * Math.pow(u, 2.1); }   // the rev: faster + faster
  else { const v = T - 0.98; a = S.peg + (S.over - S.peg) * Math.exp(-5.5 * v) * Math.cos(24 * v); }      // the slam: overshoot, bounce
  if (T < 0.98) amp = 0;
  else {
    const v = T - 0.98, rev = fract(t / 6.4), blip = rev < 0.12 ? Math.sin(rev / 0.12 * Math.PI) : 0;  // (a rev every 6.4 s)
    amp = 1.0 + 4.6 * Math.exp(-v / 0.7) + 2.6 * blip;
    a += amp * (0.72 * judder(t, 31) + 0.28 * judder(t, 67, 9)) - 3.5 * blip;
  }
  return { a, shake: Math.min(1, amp / 5), inRed: smooth(340, S.peg - 4, a) };
}

function redline(c, s, t, Q) {
  const S = OC_SPECS['card-redline'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = ocMap(s.w, s.h, full ? S.full : S.strip), P = (x, y) => [M.ox + x * M.k, M.oy + y * M.k];
  const calm = full ? 1 : 0.88;
  if (s.ocBorn == null || t < s.ocBorn) s.ocBorn = t;
  const N = needleAt(S, t - s.ocBorn, t, still), ar = N.a * D2R;
  const [cx, cy] = P(S.cap[0], S.cap[1]);
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  // 1 · THE HEAT on the red zone's arc — pulsing with the shake (lit only once the needle is in the red)
  const heat = img('redline-heat');
  if (heat) {
    const pulse = still ? 0.8 : 0.55 + 0.22 * Math.sin(t * 8.3) + 0.35 * N.shake * (0.6 + 0.4 * Math.abs(judder(t, 23, 4)));
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, pulse) * N.inRed * calm;
    c.drawImage(heat, M.ox + 1037 * M.k, M.oy + 165 * M.k, 157 * M.k, 382 * M.k);
    c.globalAlpha = 1;
  }
  // 2 · THE NEEDLE (under the cap) + its hot tip
  const cap = img('redline-cap'), sc = S.len * M.k / (NT - NP);
  if (cap) {
    c.globalCompositeOperation = 'source-over';
    c.save(); c.translate(cx, cy); c.rotate(ar); c.drawImage(needle(), -NP * sc, -NH / 2 * sc, NW * sc, NH * sc); c.restore();
    const tx = cx + Math.cos(ar) * S.len * M.k, ty = cy + Math.sin(ar) * S.len * M.k;
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,96,30', 0.22), tx, ty, 70 * M.k, (0.45 + 0.4 * N.shake) * N.inRed * calm);
    // 3 · THE SPARKS pouring off the tip (up + right): two copies drifting out, flickering; they follow the needle's shake
    const spk = img('redline-sparks');
    if (spk && N.inRed > 0.02) {
      for (let i = 0; i < 2; i++) {
        const u = still ? 0.45 + i * 0.3 : fract(t / 0.95 + i * 0.5), fl = still ? 0.85 : 0.72 + 0.28 * hn(Math.floor(t * 19) + i * 7);
        const k = (0.34 + 0.2 * u) * M.k * 2, a = Math.sin(u * Math.PI) * fl * N.inRed * calm;   // (the plate is halved: ×2 back to art px)
        c.save(); c.translate(tx + u * 10 * M.k, ty - u * 14 * M.k); c.rotate((N.a - S.peg) * D2R * 0.6); c.globalAlpha = a;
        c.drawImage(spk, -20 * k, -272.5 * k, 360 * k, 360 * k); c.restore();
      }
      c.globalAlpha = 1;
    }
    // the chrome cap back over the needle's root
    c.globalCompositeOperation = 'source-over'; c.drawImage(cap, cx - 70 * M.k, cy - 70 * M.k, 140 * M.k, 140 * M.k);
  }
  c.restore();
  // 4 · THE BORDER LASER (every legendary) in molten orange
  c.save(); drawLaser(c, s.w, s.h, t, { rgb: '255,170,90', rgb2: '255,70,20', still, radius: rad }); c.restore();
}

function photoFinish(c, s, t, Q) {
  const S = OC_SPECS['card-photofinish'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = ocMap(s.w, s.h, full ? S.full : S.strip), P = (x, y) => [M.ox + x * M.k, M.oy + y * M.k];
  const calm = full ? 1 : 0.88, mid = (S.noses[0] + S.noses[1]) / 2;
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // 1 · THE TRAILS' SHIMMER: a sheen sliding back along each car's light trails (staggered)
  S.trails.forEach(([x0, x1, y0, y1, rgb], i) => {
    const u = still ? 0.35 : fract(t / 2.6 + i * 0.45); if (u > 0.7) return;
    const v = u / 0.7, x = x1 - (x1 - x0) * v, wd = 150 * M.k, [px, py] = P(x, y0);
    c.globalAlpha = Math.sin(v * Math.PI) * 0.42 * calm; c.drawImage(band(rgb), px - wd / 2, py, wd, (y1 - y0) * M.k);
  });
  // 2 · THE LASER: the line (steady) + its glow + the scanning point
  const PASS = 2.8, up = still ? 0 : fract(t / PASS), dn = still ? true : Math.floor(t / PASS) % 2 === 0;
  const sy = still ? mid : (dn ? up : 1 - up) * OC_AH, [lx] = P(S.line, 0), lw = Math.max(1, 2.6 * M.k);
  c.globalAlpha = 0.28 * calm; c.drawImage(band('255,40,60'), lx - 14 * M.k, 0, 28 * M.k, s.h);
  c.globalAlpha = 0.8 * calm; c.fillStyle = 'rgb(255,46,64)'; c.fillRect(lx - lw / 2, 0, lw, s.h);
  const [, py] = P(S.line, sy);
  c.globalAlpha = 1;
  stamp(c, glow('255,40,60', 0.25), lx, py, 90 * M.k, 0.9 * calm);
  stamp(c, glow('255,235,235', 0.4), lx, py, 26 * M.k, calm);
  // 3 · the crossing: the point passes between the noses (their middle) once a pass → THE FLASH pops + THE SPARKS crackle
  // (s since the point last crossed the middle: a down pass crosses at u = mid / H, an up pass at 1 − mid / H; before this pass's
  //  crossing, the last one was the previous pass's — the other direction)
  const ucDn = mid / OC_AH, ucNow = dn ? ucDn : 1 - ucDn, ucPrev = dn ? 1 - ucDn : ucDn;
  const since = still ? 0.12 : (up >= ucNow ? up - ucNow : up + 1 - ucPrev) * PASS;
  const near = smooth(150, 40, Math.abs(sy - mid));                                           // (the point between the noses)
  const spk = img('pf-sparks'), fl = img('pf-flash'), [nx, ny] = P(S.line + 2, mid);
  if (spk) {
    const env = Math.max(near, 1 - smooth(0, 0.55, since)), crack = still ? 0.6 : (0.55 + 0.45 * hn(Math.floor(t * 22))) * (0.8 + 0.2 * hn(Math.floor(t * 9) + 3));
    const k = 0.88 * M.k * (0.92 + 0.08 * env);
    if (env > 0.01) { c.globalAlpha = Math.min(1, env * crack) * calm; c.drawImage(spk, nx - 277.5 * k, ny - 130 * k, 550 * k, 250 * k); }
  }
  if (fl) {
    const a = still ? 0.5 : since < 0.25 ? Math.pow(1 - since / 0.25, 1.4) : 0;
    if (a > 0.01) { const k = (0.62 + 0.25 * (1 - a)) * M.k; c.globalAlpha = a * calm; c.drawImage(fl, nx - 120 * k, ny - 120 * k, 240 * k, 240 * k); stamp(c, glow('255,255,255', 0.35), nx, ny, 120 * M.k, a * 0.7 * calm); }
  }
  c.globalAlpha = 1;
  c.restore();
}

export const ocRedline = { id: 'ocRedline', tier: 'legendary', bleed: 0, stillT: 2.2, draw: redline };
export const ocPhoto = { id: 'ocPhoto', tier: 'rare', bleed: 0, stillT: 1.4, draw: photoFinish };
