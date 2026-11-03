// `card-house` (THE VAULT 2A; the level-100 card — the owner's pick, Nov 3 11:50 am: the speakeasy in full blaze at night — every sign lit,
// the finale's gold willows falling behind it, a neon crown over the door). The
// speakeasy's front, straight on, at night: Deco brick (a stepped parapet, limestone coping) washed warm from below, every window lit,
// the BLADE out on its bracket (SPEAKEASY in the city's tube alphabet, its marquee bulbs chasing), the title's NEON over the ground floor,
// and over the door a CROWN in gold neon, breathing. Behind the roof the FINALE: gold willow shells bursting in turn (the city's finale
// colour — fireworks.js's willow: long, slow, drooping gold), their trails raining down behind the building, each burst washing the
// front in gold. A 9-second loop; the still frame: everything lit, two willows hanging. + THE BORDER LASER (gold).
import { glow, stamp, sprite, rng, smooth, fract } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { backdrop, bakeDpr } from './sg-kit.js';
import { signLayout, bladeLayout, drawTube, hum, PINK, CREAM, GOLD } from './sign-kit.js';
import { flattenPath } from '../core/tube-path.js';

const LOOP = 9;
const SKY = { sky: [[0, '#04030a'], [0.55, '#0c0818'], [1, '#160c16']], stars: 24, starRgb: '240,232,255', starTo: 0.6, seed: 100,
  glow: [{ x: 0.7, y: 0.25, r: 0.8, rgb: '255,180,80', a: 0.1 }],
  skyline: { y: 0.98, tall: 0.18, dark: ['#0e0a16', '#08060e'], win: [['255,214,140', 0.7], ['255,120,200', 0.3]], p: 0.14 } };
// the building in its own units: 100 wide, 128 tall (y down from the parapet's top); the blade hangs off its left edge
const BW = 100, BH = 128;
const WIN = []; for (const y of [20, 42]) for (const x of [22, 50, 78]) WIN.push([x, y]);
const NEON = signLayout([{ logo: true, y: 67, h: 10, cx: 50, col: PINK, tw: 11 }]);
const BLADE = bladeLayout('SPEAKEASY', -9, 14, 6.4, CREAM, 1.35, 0.36);
const CROWN = [{ key: 'crown', polys: flattenPath('M3 17 H27 M4 14 L1.5 3.5 L9 9 L15 0.5 L21 9 L28.5 3.5 L26 14 Z', 0.86, 37.1, 82.2, 1.2), col: GOLD, tw: 1.7 }];
// the blade's bulbs: round its board (x -16..-2, y 10..96)
const BULBS = (() => { const b = [], x0 = -16, x1 = -2, y0 = 10, y1 = 96, st = 3.4; for (let y = y0; y <= y1; y += st) { b.push([x0, y]); } for (let x = x0 + st; x < x1; x += st) b.push([x, y1]); for (let y = y1; y >= y0; y -= st) b.push([x1, y]); for (let x = x1 - st; x > x0; x -= st) b.push([x, y0]); return b; })();
// the finale: three willow shells a loop (where, when — in the sky's units: x 0..1 of the building's span, y above the roof)
const SHELLS = [{ t: 0, x: 0.3, y: -0.42, n: 30 }, { t: 3, x: 0.78, y: -0.5, n: 30 }, { t: 6, x: 0.52, y: -0.34, n: 34 }];
const LIFE = 5.6;

/** the front (baked): brick + its courses, the warm wash from below, the parapet + coping, the windows lit, the ground floor, the door, the blade's board */
function front(k, dpr) {
  const W = (BW + 24) * k, H = (BH + 14) * k, ox = 20 * k, oy = 10 * k;
  return { ox, oy, cv: sprite(`hs-front:${k.toFixed(3)}@${dpr}`, W * dpr, H * dpr, (c) => {
    c.scale(dpr, dpr); c.translate(ox, oy);
    const X = u => u * k, r = rng(100);
    // the wall: oxblood brick, darker high, lit warm from below
    const g = c.createLinearGradient(0, 0, 0, BH * k); g.addColorStop(0, '#2a1016'); g.addColorStop(0.6, '#3d1a1a'); g.addColorStop(1, '#5a2a1c');
    c.fillStyle = g; c.fillRect(0, 0, X(BW), X(BH));
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for (let v = 3; v < BH; v += 2.6) { c.fillRect(0, X(v), X(BW), Math.max(0.4, 0.28 * k)); const off = (Math.round(v / 2.6) % 2) * 2.5; for (let u = off; u < BW; u += 5) c.fillRect(X(u), X(v - 2.6), Math.max(0.3, 0.22 * k), X(2.6)); }
    // the wall-washers: warm cones up the piers from the ground floor
    for (const u of [6, 36, 64, 94]) {
      const wg = c.createRadialGradient(X(u), X(BH - 30), 0, X(u), X(BH - 30), X(46));
      wg.addColorStop(0, 'rgba(255,170,90,0.36)'); wg.addColorStop(0.5, 'rgba(255,140,70,0.12)'); wg.addColorStop(1, 'rgba(255,140,70,0)');
      c.fillStyle = wg; c.fillRect(X(u - 46), X(BH - 76), X(92), X(76));
    }
    // the parapet: a stepped Deco crown, limestone coping + a belt course
    c.fillStyle = '#2a1016';
    c.beginPath(); c.moveTo(X(30), 0); c.lineTo(X(30), X(-6)); c.lineTo(X(38), X(-6)); c.lineTo(X(38), X(-10)); c.lineTo(X(62), X(-10)); c.lineTo(X(62), X(-6)); c.lineTo(X(70), X(-6)); c.lineTo(X(70), 0); c.closePath(); c.fill();
    c.fillStyle = '#cdbba0';
    c.fillRect(0, 0, X(BW), Math.max(1, X(1.6))); c.fillRect(X(30), X(-6), X(8), Math.max(0.8, X(1.2))); c.fillRect(X(62), X(-6), X(8), Math.max(0.8, X(1.2))); c.fillRect(X(38), X(-10), X(24), Math.max(0.8, X(1.2)));
    c.fillRect(0, X(62), X(BW), Math.max(1, X(1.4))); c.fillRect(0, X(100), X(BW), Math.max(1, X(1.6)));
    // chevrons in the crown (a Deco fan)
    c.strokeStyle = 'rgba(214,190,150,0.6)'; c.lineWidth = Math.max(0.5, 0.5 * k);
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(X(42 + i * 1.2), X(-1)); c.lineTo(X(50), X(-8 + i * 1.6)); c.lineTo(X(58 - i * 1.2), X(-1)); c.stroke(); }
    // the windows: warm amber, mullions + a transom, now + then a coloured shade (the party upstairs)
    for (const [x, y] of WIN) {
      const wx = X(x - 7), wy = X(y), ww = X(14), wh = X(16);
      c.fillStyle = '#120a0c'; c.fillRect(wx - X(1), wy - X(1), ww + X(2), wh + X(2));
      const shade = r(), wg = c.createLinearGradient(0, wy, 0, wy + wh);
      if (shade < 0.25) { wg.addColorStop(0, '#ff7ac4'); wg.addColorStop(1, '#c43c86'); } else if (shade < 0.4) { wg.addColorStop(0, '#7fe8e0'); wg.addColorStop(1, '#2c9c9a'); } else { wg.addColorStop(0, '#ffd78e'); wg.addColorStop(1, '#e09a48'); }
      c.fillStyle = wg; c.fillRect(wx, wy, ww, wh);
      c.fillStyle = 'rgba(40,16,12,0.85)'; c.fillRect(wx + ww / 2 - X(0.5), wy, X(1), wh); c.fillRect(wx, wy + X(5), ww, X(0.9));
      c.fillStyle = '#cdbba0'; c.fillRect(wx - X(1.5), wy + wh + X(1), ww + X(3), Math.max(0.8, X(1.2)));       // (the sill)
    }
    // the NEON band's backing (a dark sign panel between the floors)
    c.fillStyle = '#0d0709'; c.fillRect(X(24), X(64.5), X(52), X(15));
    c.strokeStyle = 'rgba(214,178,106,0.7)'; c.lineWidth = Math.max(0.6, 0.6 * k); c.strokeRect(X(24.5), X(65), X(51), X(14));
    // THE GROUND FLOOR: two shop windows lit gold, the door (deep red, brass), its steps
    for (const x0 of [8, 66]) { const sg = c.createLinearGradient(0, X(104), 0, X(124)); sg.addColorStop(0, '#ffcf7a'); sg.addColorStop(1, '#b8682e'); c.fillStyle = '#120a0c'; c.fillRect(X(x0 - 1), X(103), X(28), X(22)); c.fillStyle = sg; c.fillRect(X(x0), X(104), X(26), X(20)); c.fillStyle = 'rgba(40,16,12,0.8)'; c.fillRect(X(x0 + 12.5), X(104), X(1), X(20)); }
    c.fillStyle = '#120a0c'; c.fillRect(X(40), X(101), X(20), X(BH - 101));
    const dg = c.createLinearGradient(X(41), 0, X(59), 0); dg.addColorStop(0, '#4a0c14'); dg.addColorStop(0.5, '#7a1622'); dg.addColorStop(1, '#3c0810');
    c.fillStyle = dg; c.fillRect(X(41.5), X(103), X(17), X(BH - 103));
    c.strokeStyle = 'rgba(232,190,110,0.85)'; c.lineWidth = Math.max(0.6, 0.6 * k); c.strokeRect(X(43.5), X(106), X(13), X(18));
    c.fillStyle = '#f0c770'; c.beginPath(); c.arc(X(50), X(110), Math.max(0.8, X(1.1)), 0, Math.PI * 2); c.fill();    // (the peephole's brass)
    c.fillStyle = '#cdbba0'; c.fillRect(X(37), X(BH - 1.4), X(26), X(1.4));
    // THE BLADE's board: off the left edge on its bracket
    c.fillStyle = '#16100f'; c.fillRect(X(-2), X(14), X(4), X(1.2)); c.fillRect(X(-2), X(90), X(4), X(1.2));
    c.fillStyle = '#0c0708'; c.fillRect(X(-16.5), X(9.5), X(15), X(87));
    c.strokeStyle = 'rgba(214,178,106,0.8)'; c.lineWidth = Math.max(0.6, 0.7 * k); c.strokeRect(X(-15.2), X(11.2), X(12.4), X(83.6));
  }) };
}

/** a willow shell's particle j at age a (s): where it is, relative to the burst (in px; R = the shell's reach) */
function willowAt(j, n, a, R, seed) {
  const r = rng(seed * 131 + j * 7), th = (j / n) * Math.PI * 2 + (r() - 0.5) * 0.3, sp = 0.75 + r() * 0.35;
  const out = R * sp * (1 - Math.exp(-2.1 * a)), droop = R * 0.16 * a * a;
  return [Math.cos(th) * out, Math.sin(th) * out * 0.92 + droop];
}

export default {
  id: 'house', tier: 'legendary', bleed: 10, stillT: 4.4,
  draw(c, s, t, Q) {
    const { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still, tt = still ? 4.4 : t;
    // the building's place: a full card — the right side, tall (the plate on the left); a strip — right of the plate, roof to door
    const k = full ? (h * 0.6) / BH : (h * 1.05) / BH, bx = full ? w * 0.95 - BW * k : w * 0.63 - BW * k * 0.5, by = full ? h * 0.82 - BH * k : h * 0.1;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'hs-full' : 'hs', w, h, dpr, SKY), 0, 0, w, h);
    // THE FINALE (behind the building): gold willows bursting in turn, their trails raining down
    c.globalCompositeOperation = 'lighter';
    const R = full ? w * 0.24 : h * 1.15, span = full ? w * 0.62 : w * 0.56, sx0 = full ? w * 0.36 : w * 0.38, q = Q.q || 1;
    let flash = 0;
    for (const S of SHELLS) {
      for (const lap of [0, -1]) {
        const a = fract((tt - S.t) / LOOP) * LOOP + lap * LOOP;
        if (a < 0 || a > LIFE) continue;
        const cx = sx0 + S.x * span, cy = by + S.y * (full ? h : h * 1.2) + (full ? 0 : h * 0.05);
        if (a < 0.5) { const f = 1 - a / 0.5; flash = Math.max(flash, f); stamp(c, glow('255,214,140', 0.2, 64), cx, cy, R * 1.4, 0.5 * f); }
        const n = Math.max(12, Math.round(S.n * q)), fade = Math.pow(1 - a / LIFE, 1.3);
        for (let j = 0; j < n; j++) {
          for (let m = 0; m < 9; m++) {
            const am = a - m * 0.13; if (am < 0) break;
            const [px, py] = willowAt(j, n, am, R, S.t + 1), f = 1 - m / 9;
            const tw = m === 0 ? 0.75 + 0.25 * Math.sin(tt * 17 + j * 3.7) : 1;
            stamp(c, glow(a > 3.2 ? '255,150,60' : '255,210,130', 0.45, 32), cx + px, cy + py, (full ? 5 : 3.8) * (0.55 + f), fade * (0.25 + 0.75 * f) * 0.95 * tw);
          }
        }
      }
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // THE FRONT
    const F = front(k, dpr);
    c.drawImage(F.cv, bx - F.ox, by - F.oy, F.cv.width / dpr, F.cv.height / dpr);
    // the finale's light on the front (each burst washes it gold) + the street's glow at its foot
    c.globalCompositeOperation = 'lighter';
    if (flash > 0.01) stamp(c, glow('255,200,120', 0.1, 64), bx + BW * k * 0.5, by + BH * k * 0.2, BW * k * 1.8, 0.22 * flash, BH * k * 1.2);
    stamp(c, glow('255,160,80', 0.1, 64), bx + BW * k * 0.5, by + BH * k, BW * k * 1.6, 0.35, 40 * k);
    c.globalCompositeOperation = 'source-over';
    // THE SIGNS: the blade (+ its bulbs), NEON over the ground floor, THE CROWN over the door — all lit
    BLADE.forEach((L, i) => drawTube(c, L, k, dpr, bx, by, still ? 1 : hum(tt, i)));
    NEON.forEach((L, i) => drawTube(c, L, k, dpr, bx, by, still ? 1 : hum(tt, i + 20)));
    const breathe = still ? 1 : 0.78 + 0.22 * Math.sin(tt * 2.1);
    drawTube(c, CROWN[0], k, dpr, bx, by, breathe);
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,190,70', 0.15, 64), bx + 50 * k, by + 90 * k, 52 * k, 0.45 * breathe, 32 * k);
    // the bulbs: a chase round the blade's board
    const head = still ? 0 : tt * 9;
    BULBS.forEach(([u, v], i) => {
      const ph = fract((i - head) / 6), on = still ? (i % 3 ? 0.55 : 1) : ph < 0.34 ? 1 : 0.35;
      stamp(c, glow('255,226,160', 0.4, 32), bx + u * k, by + v * k, (full ? 4.4 : 3) * (0.6 + 0.4 * on), on);
    });
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,206,120', still, radius: rad });
    void smooth;
  },
};
