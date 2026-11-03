// `card-sg-tr3b` — THE TR-3B's CARD (THE VAULT 1C; the owner: "card-sg-tr3b — the TR-3B (WHITE corner lights + a RED centre, its circuitry)
// over a DARKENED city, the power drained, the lamps dying"). The city's OWN craft (screens/harbor/legends.js#tr3bSprite — the hull, the
// panels, the pods, the hub, the etched circuitry, baked once per size) hovering high over the harbor, a slow drift + a hair of yaw; its
// WHITE corner lights pulsing in turn (a hot core, a bloom, a flat flare — they light the hull round them), the RED centre's heavy pulse,
// the edge lamps running to the nose, energy pulses racing out along the circuitry. UNDER IT THE CITY DIES: the skyline's windows go out
// in a wave spreading from beneath the craft (each column flickering as it fails), the quay's lamps sputter + die, its red light on the
// roofs; a hold in the dark; then the power stutters back. A 10-second loop, the same on every phone.
import { glow, stamp, rng, wob, clamp01, smooth, lerp } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect, fxDiag } from './renderer.js';
import { city, backdrop, skylineLayer, bakeDpr, stage, failing } from './sg-kit.js';

const LOOP = 10;
// (the sky: a moonlit overcast behind the craft — the black triangle reads as a SILHOUETTE against it; the moon itself off the card, upper left)
const SKY = { sky: [[0, '#0a0d18'], [0.45, '#121626'], [0.75, '#0f0f1a'], [1, '#05050a']], stars: 14, starRgb: '220,226,255', starTo: 0.4, seed: 33,
  glow: [{ x: 0.2, y: -0.05, r: 0.7, rgb: '150,165,215', a: 0.22 }, { x: 0.5, y: 0.32, r: 0.55, rgb: '120,20,24', a: 0.14, sy: 0.6 }],
  clouds: [{ y0: 0.05, y1: 0.5, rgb: '120,132,176', a: 0.2, n: 14, sx: 6 }, { y0: 0.1, y1: 0.4, rgb: '170,180,220', a: 0.1, n: 8, sx: 8, seed: 9 }],
  water: { y: 0.9, top: '#06070c', bottom: '#020205', shine: '160,170,220' } };
const SKY_STRIP = { ...SKY, glow: [{ x: 0.5, y: -0.4, r: 0.8, rgb: '150,165,215', a: 0.2 }, { x: 0.7, y: 0.3, r: 0.32, rgb: '120,20,24', a: 0.18, sy: 0.6 }],
  clouds: [{ y0: 0, y1: 0.7, rgb: '120,132,176', a: 0.2, n: 12, sx: 7 }], water: null };
const CITY = { y: 0.74, tall: 0.12, dark: ['#0b0c14', '#06070c'], win: [['255,214,140', 0.5], ['236,240,255', 0.3], ['255,120,200', 0.2]], p: 0.22, rim: 'rgba(120,130,170,0.18)' };
const CITY_STRIP = { ...CITY, y: 0.8, tall: 0.18 };

/** the power: 1 lit · 0 dark — at x (0..1 of w) and the loop's u — the drain spreads from cx outward, the return stutters in */
function powerAt(xu, cxu, u, t, i) {
  const r = smooth(0.12, 0.42, u) * 1.15, back = smooth(0.7, 0.84, u);
  const d = Math.abs(xu - cxu), front = r - d;                         // (> 0: the drain has reached this column)
  let p = front > 0.06 ? 0 : front > -0.02 ? (failing(t, i, 11) > 0.5 ? 0.6 : 0.05) : 1;
  if (back > 0) p = Math.max(p, back >= 1 ? 1 : (failing(t + 0.3, i + 40, 8) > 0.5 ? back : back * 0.15));
  return p;
}

const tri = new Map();
function hull(L, len, dpr) {
  const k = `${Math.round(len)}@${dpr}`;
  if (!tri.has(k)) { if (tri.size > 6) tri.clear(); tri.set(k, L.tr3bSprite(len, dpr, true)); }
  return tri.get(k);
}

export default {
  id: 'sg-tr3b', tier: 'legendary', bleed: 10, stillT: 3.2,
  draw(c, s, t, Q) {
    const L = city('legends', () => import('../screens/harbor/legends.js'));
    const S = stage(s), { w, h, full } = S, dpr = bakeDpr(Q), still = Q.still, rad = s.opts.radius || 12;
    const tt = still ? 3.2 : t, u = (tt % LOOP) / LOOP;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'tr3b-full' : 'tr3b', w, h, dpr, full ? SKY : SKY_STRIP), 0, 0, w, h);
    // the craft's place: high, a slow drift + bob
    const len = full ? w * 0.6 : h * 1.95, cx = S.cx + (still ? 0 : wob(tt * 0.2, 3) * len * 0.03), cy = (full ? h * 0.26 : h * 0.4) + (still ? 0 : wob(tt * 0.35, 1) * len * 0.02);
    const cxu = cx / w, dark = 1 - smooth(0.12, 0.42, u) * (1 - smooth(0.7, 0.84, u));      // (1 lit … 0 the whole city dark)
    // THE CITY: its towers, then their windows column by column with the power
    const C = full ? CITY : CITY_STRIP, foot = full ? h * 0.9 : h;
    c.drawImage(skylineLayer(full ? 'tr3b-full' : 'tr3b', w, h, dpr, C, foot, 71, 'shape'), 0, 0, w, h);
    const win = skylineLayer(full ? 'tr3b-full' : 'tr3b', w, h, dpr, C, foot, 71, 'win'), N = full ? 40 : 28, cw = w / N;
    for (let i = 0; i < N; i++) {
      const p = powerAt((i + 0.5) / N, cxu, u, tt, i);
      if (p < 0.02) continue;
      c.globalAlpha = p; c.drawImage(win, i * cw * dpr, 0, cw * dpr, h * dpr, i * cw, 0, cw, h);
    }
    c.globalAlpha = 1;
    // THE QUAY's LAMPS (a full card: along the water; a strip: along the foot) — sputtering + dying with the wave
    c.globalCompositeOperation = 'lighter';
    const nl = full ? 11 : 7, ly = full ? h * 0.9 : h - 3;
    for (let i = 0; i < nl; i++) {
      const lx = (i + 0.5) / nl * w + (i % 2 ? 3 : -3), p = powerAt(lx / w, cxu, u, tt, 90 + i);
      if (p < 0.02) continue;
      stamp(c, glow('255,196,120', 0.25, 32), lx, ly - 1, full ? 10 : 6, 0.85 * p);
      stamp(c, glow('255,214,150', 0.12, 32), lx, ly, full ? 26 : 14, 0.3 * p, full ? 10 : 6);
      if (full) stamp(c, glow('255,190,110', 0.2, 32), lx, ly + 7, 3, 0.4 * p, 14);              // (its streak on the water)
    }
    // its RED light on the roofs + the air under it (stronger as the city dies — it drinks the light)
    const pulse = still ? 0.85 : 0.7 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(tt * 1.7), 2);
    stamp(c, glow('255,40,24', 0.08, 64), cx, full ? h * 0.66 : h * 0.86, len * 1.5, (0.12 + 0.28 * (1 - dark)) * pulse, len * 0.5);
    stamp(c, glow('255,50,30', 0.1, 64), cx, cy + len * 0.25, len * 0.9, (0.08 + 0.12 * (1 - dark)) * pulse, len * 0.9);
    c.globalCompositeOperation = 'source-over';
    if (L && fxDiag.sprites) drawCraft(c, L, len, dpr, cx, cy, tt, still, pulse, 1 - dark, Q);
    else { c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,60,40', 0.2, 64), cx, cy, len * 0.4, 0.3); }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,90,70', still, radius: rad });
  },
};

function drawCraft(c, L, len, dpr, cx, cy, t, still, pulse, drain, Q) {
  const T = hull(L, len, dpr), P = L.tr3bCorners(len);
  c.save(); c.translate(cx, cy); c.rotate(-0.03 + (still ? 0 : wob(t * 0.25, 7) * 0.025));
  c.drawImage(T.cv, -T.ox, -T.oy, T.w, T.h);
  // THE RIM: the moon's cool line along the far edge + the CITY's warm glow on the near edges (it fades as the city dies under it)
  const lit = 1 - drain;
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(190,205,240,0.5)'; c.lineWidth = Math.max(0.8, len * 0.0045);
  c.beginPath(); c.moveTo(P[1][0] * 0.985, P[1][1] * 0.985); c.lineTo(P[0][0] * 0.985, P[0][1] * 0.985); c.stroke();
  if (lit > 0.02) {
    c.strokeStyle = `rgba(226,140,200,${(0.6 * lit).toFixed(3)})`; c.lineWidth = Math.max(0.8, len * 0.005);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[2][0], P[2][1]); c.lineTo(P[1][0], P[1][1]); c.stroke();
  }
  c.globalCompositeOperation = 'lighter';
  // THE CIRCUITRY's PULSES: now and then energy flows out along a trace from the hub, lighting the groove behind it (faster as it drains)
  const traces = L.circuit(len), sp = len * 0.11, tail = len * 0.16, lw = Math.max(0.7, len * 0.0042);
  c.lineCap = 'round';
  for (const tr of traces) {
    const travel = tr.len / (sp * tr.sp), per = travel + 2.2 + 3.5 * tr.ph, ts = still ? 0.45 * per : t;
    const e = (((ts + tr.ph * 17) % per) + per) % per, d = e * sp * tr.sp, over = d - tr.len;
    if (over > tail) continue;
    const hd = Math.min(d, tr.len), d0 = Math.max(0, d - tail);
    if (hd > d0) {
      let A = L.along(tr, d0);
      for (let k = 1; k <= 6; k++) {
        const dd = d0 + (hd - d0) * k / 6, B = L.along(tr, dd), f = k / 6;
        c.globalAlpha = (0.06 + 0.6 * f * f) * (over > 0 ? Math.max(0, 1 - over / tail) : 1);
        c.strokeStyle = f > 0.85 ? 'rgb(170,246,255)' : 'rgb(80,210,240)'; c.lineWidth = lw * (0.6 + 0.5 * f);
        c.beginPath(); c.moveTo(A[0], A[1]); for (let q = A[2]; q < B[2]; q++) c.lineTo(tr.pts[q][0], tr.pts[q][1]); c.lineTo(B[0], B[1]); c.stroke();
        A = B;
      }
    }
    if (d <= tr.len) { const H = L.along(tr, hd); stamp(c, glow('120,236,255', 0.25, 32), H[0], H[1], len * 0.05, 0.7); stamp(c, glow('220,255,255', 0.4, 32), H[0], H[1], len * 0.016, 0.85); }
  }
  c.globalAlpha = 1;
  // THE EDGE LAMPS: small lamps along every edge, a slow pulse running to the nose
  for (const e of L.EDGE_LAMPS) {
    const A = P[e.e], B = P[(e.e + 1) % 3], x = lerp(A[0], B[0], e.f) * 0.93, y = lerp(A[1], B[1], e.f) * 0.93;
    const toNose = e.e === 2 ? 1 - e.f : e.e === 0 ? e.f : 0.5, k = still ? 0.5 : Math.pow(0.5 + 0.5 * Math.cos(t * 2.6 - toNose * 5), 6);
    stamp(c, glow('236,240,255', 0.3, 32), x, y, len * 0.035, 0.35 + 0.6 * k, len * 0.02);
  }
  // the lights WASH the hull (clipped to it): the white corners + the red heart
  const kc = P.map((q, i) => (still ? 0.9 : 0.62 + 0.38 * Math.sin(t * 1.5 + i * 2.1)));
  c.save(); c.beginPath(); P.forEach((q, i) => (i ? c.lineTo(q[0] * 0.97, q[1] * 0.97) : c.moveTo(q[0] * 0.97, q[1] * 0.97))); c.closePath(); c.clip();
  P.forEach((q, i) => stamp(c, glow('200,210,240', 0.1, 64), q[0] * 0.8, q[1] * 0.8, len * 0.7, 0.2 * kc[i], len * 0.3));
  stamp(c, glow('255,40,18', 0.1, 64), 0, 0, len * 1.1, (0.16 + 0.2 * pulse) * (1 + 0.4 * drain), len * 0.45);
  c.restore();
  // THE WHITE CORNER LIGHTS: a hot white core, a cool bloom, a flat flare on the brightest
  P.forEach((q, i) => {
    const k = kc[i], x0 = q[0] * 0.8, y0 = q[1] * 0.8;
    stamp(c, glow('214,224,255', 0.12, 64), x0, y0, len * 0.55, 0.32 * k, len * 0.3);
    stamp(c, glow('255,255,255', 0.3, 64), x0, y0, len * 0.16, 0.95 * k, len * 0.1);
    stamp(c, glow('255,255,255', 0.55, 32), x0, y0, len * 0.05, 1, len * 0.04);
    stamp(c, glow('235,240,255', 0.04, 64), x0, y0, len * (0.35 + 0.35 * k), 0.55 * k, len * 0.014);
  });
  // THE RED CENTRE: the slow heavy pulse — a deep bloom, the hot orb, its flare
  stamp(c, glow('255,36,16', 0.1, 64), 0, 0, len * 0.6, 0.35 + 0.35 * pulse, len * 0.26);
  stamp(c, glow('255,70,40', 0.3, 64), 0, 0, len * 0.16, 0.85 * pulse + 0.15, len * 0.075);
  stamp(c, glow('255,200,170', 0.5, 32), 0, 0, len * 0.05, 0.9 * pulse, len * 0.028);
  stamp(c, glow('255,60,40', 0.05, 64), 0, 0, len * 0.9 * pulse, 0.35 * pulse, len * 0.014);
  c.restore();
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
export const tr3bReady = () => !!city('legends', () => import('../screens/harbor/legends.js'));
