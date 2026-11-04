// `card-house` (THE VAULT 2A; the level-100 card — the owner's pick, Nov 3 11:50 am: the speakeasy in full blaze at night — every sign lit,
// the finale's gold willows falling behind it, a neon crown over the door). The
// speakeasy's front, straight on, at night: Deco brick (a stepped parapet, limestone coping) washed warm from below, every window lit,
// the BLADE out on its bracket (SPEAKEASY in the city's tube alphabet, its marquee bulbs chasing), the title's NEON over the ground floor,
// and over the door a CROWN in gold neon, breathing. Behind the roof the FINALE: gold willow shells bursting in turn (the city's finale
// colour — fireworks.js's willow: long, slow, drooping gold), their trails raining down behind the building, each burst washing the
// front in gold. A 9-second loop; the still frame: everything lit, two willows hanging. + THE BORDER LASER (gold).
import { glow, stamp, sprite, rng, smooth, fract, sparkle } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { backdrop, bakeDpr } from './sg-kit.js';
import { signLayout, bladeLayout, drawTube, hum, PINK, CREAM, GOLD } from './sign-kit.js';
import { flattenPath } from '../core/tube-path.js';
import { front as realFront, drawBoxer } from './speak-front.js';

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

// ---------------------------------------------------------------- THE FULL CARD (THE VAULT 2B — the owner's lab FIX: "Needs to be much
// higher quality and more flair, more special"). the speakeasy at full blast, re-built on the city's OWN building — its real front
// painted face-on by the city's painters (speak-front.js: the brick by kiln run, the chevron belt, the dentil cornice, the Deco crest,
// the EST. 1924 date stone, the wall-washers' cones, the barbershop + its awning, THE REAL ROOMS lit — the bar, the jazz room's honey
// shade, the card game under its green lamp, the TV apartment). Every sign lit: THE BLADE off the corner (SPEAKEASY in the city's tube
// alphabet, its marquee bulbs chasing), the title's NEON over the awning, the GOLD NEON CROWN over the side door (breathing, its light
// on the brick). The FLAIR: the finale's gold willows burst behind the roof in turn, each one washing the whole front gold + glinting off
// the gilt; the party upstairs (the rooms' light pulsing in the bar's colours), the barbershop lit up, gold sparkles drifting down from
// the bursts in front. The still frame: all lit, two willows hanging.
const bladeMemo = new Map();
const bladeFor = (hpx) => { let b = bladeMemo.get(hpx); if (!b) { b = bladeLayout('SPEAKEASY', 0, 0, hpx / 9 / 1.36, CREAM, 1.35, 0.36); bladeMemo.set(hpx, b); } return b; };
const neonMemo = new Map();
const neonFor = (wpx) => { let b = neonMemo.get(wpx); if (!b) { b = signLayout([{ logo: true, y: 0, h: wpx * 100 / 332, cx: wpx / 2, col: PINK, tw: 9 }]); neonMemo.set(wpx, b); } return b; };
const crownMemo = new Map();
const crownFor = (cw) => {
  let b = crownMemo.get(cw);
  if (!b) { const sc = cw / 30; b = [{ key: 'crownF:' + cw.toFixed(2), polys: flattenPath('M3 17 H27 M4 14 L1.5 3.5 L9 9 L15 0.5 L21 9 L28.5 3.5 L26 14 Z', sc, 0, 0, 1.2), col: GOLD, tw: 1.7 * sc }]; crownMemo.set(cw, b); }
  return b;
};
function drawFullHouse(c, s, t, Q) {
  const { w, h } = s, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still, tt = still ? 4.4 : t, q = Q.q || 1;
  const F = realFront((h * 0.74) / 12.3, dpr, { key: 'hs' });
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.drawImage(backdrop('hs-full2', w, h, dpr, { ...SKY, skyline: { ...SKY.skyline, y: 0.9, tall: 0.26 } }), 0, 0, w, h);
  const bw = F.cv ? F.wpx : w * 0.46, bh = F.cv ? F.hpx : h * 0.8, bx = w - 36 - bw, by = h * 0.885 - bh + (F.cv ? F.k * 0.3 : 0), street = h * 0.885;
  const U = u => bx + u * (bw / 11.2), Vy = v => (F.cv ? by + F.v2y(v) : by + bh - v * (bh / 12.3));
  // THE FINALE (behind the roof): gold willows bursting in turn over the building + the sky left of it, their trails raining down
  c.globalCompositeOperation = 'lighter';
  const R = w * 0.22, roofY = Vy(11.3);
  let flash = 0;
  const shells = [{ t: 0, x: bx + bw * 0.28, y: roofY - h * 0.1, n: 30 }, { t: 3, x: bx + bw * 0.82, y: roofY - h * 0.16, n: 30 }, { t: 6, x: w * 0.3, y: h * 0.26, n: 34 }];
  for (const S of shells) for (const lap of [0, -1]) {
    const a = fract((tt - S.t) / LOOP) * LOOP + lap * LOOP;
    if (a < 0 || a > LIFE) continue;
    if (a < 0.5) { const f = 1 - a / 0.5; flash = Math.max(flash, f); stamp(c, glow('255,214,140', 0.2, 64), S.x, S.y, R * 1.5, 0.5 * f); }
    const n = Math.max(12, Math.round(S.n * q)), fade = Math.pow(1 - a / LIFE, 1.3);
    for (let j = 0; j < n; j++) for (let m = 0; m < 9; m++) {
      const am = a - m * 0.13; if (am < 0) break;
      const [px, py] = willowAt(j, n, am, R, S.t + 1), f = 1 - m / 9, tw = m === 0 ? 0.75 + 0.25 * Math.sin(tt * 17 + j * 3.7) : 1;
      stamp(c, glow(a > 3.2 ? '255,150,60' : '255,210,130', 0.45, 32), S.x + px, S.y + py, 5 * (0.55 + f), fade * (0.25 + 0.75 * f) * 0.95 * tw);
    }
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // the pavement under it (granite flags, the shop's light pooling on them) — the card's foot words sit over it
  { const g = c.createLinearGradient(0, street - 2, 0, h); g.addColorStop(0, '#1c1418'); g.addColorStop(1, '#0a070a'); c.fillStyle = g; c.fillRect(0, street - 2, w, h - street + 2);
    c.fillStyle = 'rgba(255,220,170,0.16)'; c.fillRect(0, street - 2, w, 1); }
  // THE BUILDING (the city's own) + its light
  if (F.cv) { c.drawImage(F.cv, bx, by, bw, bh); drawBoxer(c, F, bx, by, t, still); }   // (THE VAULT 2C: the back room = THE SHADOWBOXER, live)
  else { c.fillStyle = '#2a1016'; c.fillRect(bx, by, bw, bh); }
  c.globalCompositeOperation = 'lighter';
  // the party upstairs: each room's light breathing in the bar's colours (pink · teal · amber), in turn
  if (F.cv) F.wins.forEach((r, i) => {
    const col = ['255,120,200', '120,230,230', '255,190,110'][i % 3], a = still ? 0.16 : 0.1 + 0.14 * Math.max(0, Math.sin(tt * 1.6 + i * 1.3));
    c.globalAlpha = a; c.fillStyle = 'rgb(' + col + ')'; c.fillRect(bx + r.x0, by + r.y0, r.x1 - r.x0, r.y1 - r.y0);
  });
  c.globalAlpha = 1;
  // the barbershop lit up (full blaze — its window warm gold, the light spilling onto the pavement)
  {
    const x0 = U(3.3), x1 = U(7.9), y0 = Vy(3.12), y1 = Vy(0.78);
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(255,214,140,0.42)'); g.addColorStop(1, 'rgba(255,170,90,0.6)');
    c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    stamp(c, glow('255,180,100', 0.1, 64), (x0 + x1) / 2, y1 + 4, (x1 - x0) * 1.6, 0.4, 26);
  }
  // each burst washes the front gold + glints off the gilt (the cornice, the crest, the date stone)
  if (flash > 0.01) {
    stamp(c, glow('255,200,120', 0.1, 64), bx + bw * 0.5, roofY, bw * 1.7, 0.32 * flash, bh * 0.9);
    const r = rng(7);
    for (let i = 0; i < 9; i++) stamp(c, sparkle('255,240,200'), U(0.6 + r() * 10), Vy(9.9 + r() * 2.2), 7 + r() * 6, flash * (0.4 + r() * 0.6));
  }
  stamp(c, glow('255,160,80', 0.1, 64), bx + bw * 0.5, h, bw * 1.5, 0.3, 30);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // THE NEON over the awning (the title's own tubes, pink) — on a dark sign panel on the belt course
  const nw = bw * 0.36, nh = nw * 100 / 332, nx = U(5.6) - nw / 2, ny = Vy(3.62) - nh * 0.5;
  c.fillStyle = 'rgba(10,6,10,0.88)'; c.fillRect(nx - nh * 0.22, ny - nh * 0.16, nw + nh * 0.44, nh * 1.32);
  c.strokeStyle = 'rgba(214,178,106,0.75)'; c.lineWidth = 1; c.strokeRect(nx - nh * 0.22 + 0.5, ny - nh * 0.16 + 0.5, nw + nh * 0.44 - 1, nh * 1.32 - 1);
  neonFor(Math.round(nw)).forEach((L, i) => drawTube(c, L, 1, dpr, nx, ny, still ? 1 : hum(tt, i + 20)));
  // THE CROWN over the side door (gold neon, breathing — the level-100 mark), its light on the brick
  const cw = Math.round((U(10.6) - U(9.0)) * 1.15), cx = U(9.8) - cw / 2, cy = Vy(3.72);
  const breathe = still ? 1 : 0.76 + 0.24 * Math.sin(tt * 2.1);
  c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,190,70', 0.15, 64), cx + cw / 2, cy + cw * 0.3, cw * 2.6, 0.5 * breathe, cw * 1.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  drawTube(c, crownFor(cw)[0], 1, dpr, cx, cy, breathe);
  // THE BLADE off the right corner: its bracket, the board, SPEAKEASY lit, the marquee bulbs chasing round it
  const bdX0 = bx + bw + 3, bdW = 26, bdY0 = Vy(10.1), bdY1 = Vy(3.9), bdH = bdY1 - bdY0;
  c.fillStyle = '#16100f'; c.fillRect(bx + bw - 2, bdY0 + 10, 6, 3); c.fillRect(bx + bw - 2, bdY1 - 12, 6, 3);
  c.fillStyle = '#0c0708'; rrect(c, bdX0, bdY0, bdW, bdH, 3); c.fill();
  c.strokeStyle = 'rgba(214,178,106,0.85)'; c.lineWidth = 1.2; rrect(c, bdX0 + 2.5, bdY0 + 2.5, bdW - 5, bdH - 5, 2); c.stroke();
  bladeFor(Math.round(bdH - 14)).forEach((L, i) => drawTube(c, L, 1, dpr, bdX0 + bdW / 2, bdY0 + 8, still ? 1 : hum(tt, i)));
  c.globalCompositeOperation = 'lighter';
  {
    const pts = [], st = 6.2;
    for (let y = bdY0 + 3; y <= bdY1 - 3; y += st) pts.push([bdX0 + 2, y]);
    for (let x = bdX0 + 2 + st; x < bdX0 + bdW - 2; x += st) pts.push([x, bdY1 - 2]);
    for (let y = bdY1 - 3; y >= bdY0 + 3; y -= st) pts.push([bdX0 + bdW - 2, y]);
    for (let x = bdX0 + bdW - 2 - st; x > bdX0 + 2; x -= st) pts.push([x, bdY0 + 2]);
    const head = still ? 0 : tt * 11;
    pts.forEach(([x, y], i) => { const ph = fract((i - head) / 6), on = still ? (i % 3 ? 0.55 : 1) : ph < 0.34 ? 1 : 0.32; stamp(c, glow('255,226,160', 0.4, 32), x, y, 5.2 * (0.6 + 0.4 * on), on); });
  }
  // gold sparkles drifting down out of the bursts, in front
  {
    const r = rng(55), n = Math.round(26 * q);
    for (let i = 0; i < n; i++) {
      const sp = 10 + r() * 16, x = r() * w, ph = r() * 50, y = fract((tt * sp + ph * 13) / (h * 0.9)) * h * 0.9, tw = 0.5 + 0.5 * Math.sin(tt * (5 + r() * 6) + ph);
      stamp(c, sparkle('255,226,150'), x + Math.sin(tt + ph) * 6, y, 4 + r() * 4, (0.25 + 0.6 * tw) * (still ? 0.8 : 1));
    }
  }
  c.restore();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  drawLaser(c, w, h, t, { rgb: '255,206,120', still, radius: rad });
}

export default {
  id: 'house', tier: 'legendary', bleed: 10, stillT: 4.4,
  draw(c, s, t, Q) {
    if (s.opts.full) { drawFullHouse(c, s, t, Q); return; }
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
