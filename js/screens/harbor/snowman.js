// CITY 2.0 — PART 9b: THE JANUARY SNOWMAN, DRAWN (the plan: core/harbor-snowman.js; the stage he stands on: THE CENTREPIECE RIG,
// centre.js — baked into its sprite, lit by its floor spots at night). BIG (≈ 1.8 × a person) and read by SILHOUETTE + a few bold
// accents at phone size: three shaded snowballs, coal eyes + buttons, the ORANGE carrot, a RED scarf with its tail, the black top hat,
// the stick arms. A thaw SLUMPS him (squashed, the head tipped, the arms drooping, the hat askew); the melt shrinks + settles him.
import { rgb, mix } from './shapes.js';
import { frame, lightFor, lit, norm, FRONT } from './props-light.js';
import { has } from '../../core/harbor-snowman.js';

const SNOW = [244, 247, 255], COAL = [26, 24, 30], CARROT = [236, 112, 30], SCARF = [196, 36, 44], HAT = [24, 22, 28], STICK = [92, 64, 40];
const R = { base: 0.95, middle: 0.68, head: 0.47 };
/** his height (world units) for the rig's cap: the three balls + the hat */
export const SNOWMAN_H = 4.6;

/** a shaded snowball: its lit side up + toward the light, a blue shade under, a soft rim — at (cx, cy) radii rx, ry (pt) */
function ball(x, Lt, cx, cy, rx, ry) {
  const hi = lit(Lt, SNOW, norm([-0.35, 0.75, -0.55]), 0.08), mid = lit(Lt, SNOW, FRONT), lo = lit(Lt, mix(SNOW, [150, 170, 210], 0.35), norm([0.45, -0.5, -0.5]));
  const g = x.createRadialGradient(cx - rx * 0.32, cy - ry * 0.4, rx * 0.1, cx, cy, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, rgb(hi)); g.addColorStop(0.55, rgb(mid)); g.addColorStop(1, rgb(lo));
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
}

/** the piece for the rig, for a state { progress, slump, melt } */
export function snowmanPiece(S) {
  const p = S.progress, sl = S.slump || 0, me = S.melt || 0;
  const draw = (x, cam, m, T, ctx = {}) => {
    const z0 = m.z - 0.4, P = frame(cam, z0, 1), s = P.s, X = m.x, Lt = lightFor(T, ctx, m.x, m.z);
    const shrink = 1 - 0.42 * me, squash = 1 - 0.2 * sl - 0.15 * me, widen = 1 + 0.12 * sl + 0.3 * me;
    // the growth: each ball rolls up to its size over its stretch of the build
    const grow = (a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
    const rb = R.base * (0.45 + 0.55 * grow(0.04, 0.22)) * shrink, rm = R.middle * (0.5 + 0.5 * grow(0.24, 0.4)) * shrink, rh = R.head * (0.6 + 0.4 * grow(0.42, 0.53)) * shrink;
    const lean = 0.18 * sl + 0.1 * me;                                // (a slump leans him over to the right)
    // the contact shadow + the rolled-up snow round his foot
    { const [gx, gy] = P(X, 0, 1); x.fillStyle = 'rgba(40,46,80,0.28)'; x.beginPath(); x.ellipse(gx, gy, rb * s * 1.35 * widen, rb * s * 0.3, 0, 0, Math.PI * 2); x.fill(); }
    if (!has(p, 'base')) return;
    const yb = rb * 0.9 * squash, [bx, by] = P(X, yb, 1);
    ball(x, Lt, bx, by, rb * s * widen, rb * s * squash);
    let ym = 0, mx = bx, my = 0, hx = bx, hy = 0;
    if (has(p, 'middle')) {
      ym = yb + (rb * 0.78 + rm * 0.86) * squash; [mx, my] = P(X + lean * 0.6, ym, 1);
      ball(x, Lt, mx, my, rm * s * (1 + 0.08 * sl), rm * s * squash);
    }
    if (has(p, 'head') && me < 0.75) {
      const yh = ym + (rm * 0.8 + rh * 0.88) * squash; [hx, hy] = P(X + lean * 1.4, yh, 1);
      ball(x, Lt, hx, hy, rh * s, rh * s * (1 - 0.08 * sl));
    }
    const dot = (cx, cy, r, c) => { x.fillStyle = rgb(c); x.beginPath(); x.arc(cx, cy, Math.max(0.9, r), 0, Math.PI * 2); x.fill(); };
    const coal = lit(Lt, COAL, FRONT, 0.4);
    if (has(p, 'face') && has(p, 'middle')) for (let i = 0; i < 3; i++) dot(mx + lean * 0.4 * s * i * 0.2, my - rm * s * (0.45 - i * 0.42) * squash, 0.085 * s, coal);
    if (has(p, 'face') && has(p, 'head') && me < 0.75) { dot(hx - rh * s * 0.33, hy - rh * s * 0.18, 0.085 * s, coal); dot(hx + rh * s * 0.33, hy - rh * s * 0.18, 0.085 * s, coal); }
    if (has(p, 'smile') && me < 0.6) for (let i = 0; i < 5; i++) { const a = Math.PI * (0.2 + 0.6 * i / 4); dot(hx + Math.cos(a) * rh * s * 0.48, hy + rh * s * 0.18 + Math.sin(a) * rh * s * 0.22, 0.05 * s, coal); }
    // THE CARROT: the bright accent — a long orange cone pointing out + a little down (drooping as he melts)
    if (has(p, 'carrot') && me < 0.75) {
      const c = lit(Lt, CARROT, FRONT, 0.3), L0 = rh * s * 0.15, len = 0.5 * s, dy = (0.08 + 0.25 * sl + 0.3 * me) * s;
      x.fillStyle = rgb(c); x.beginPath(); x.moveTo(hx - L0 * 0.2, hy - rh * s * 0.02 - 0.07 * s); x.lineTo(hx + L0 + len, hy + dy); x.lineTo(hx - L0 * 0.2, hy + 0.08 * s); x.closePath(); x.fill();
    }
    // THE SCARF: a red band at the neck + its tail hanging (blowing a little)
    if (has(p, 'scarf') && has(p, 'head') && me < 0.75) {
      const c = lit(Lt, SCARF, FRONT, 0.1), ny = (my - rm * s * squash * 0.9 + hy + rh * s * 0.85) / 2, nx = (mx + hx) / 2, w = rm * s * 0.92;
      x.fillStyle = rgb(c); x.beginPath(); x.ellipse(nx, ny, w, 0.14 * s, -lean * 0.4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(nx + w * 0.35, ny); x.lineTo(nx + w * 0.62, ny); x.lineTo(nx + w * 0.75, ny + 0.62 * s); x.lineTo(nx + w * 0.45, ny + 0.6 * s); x.closePath(); x.fill();
      x.fillStyle = rgb(lit(Lt, mix(SCARF, [255, 255, 255], 0.5), FRONT)); x.fillRect(nx + w * 0.47, ny + 0.48 * s, w * 0.26, Math.max(0.6, 0.05 * s));   // (a stripe at its end)
    }
    // THE HAT: a black top hat (askew in a slump)
    if (has(p, 'hat') && has(p, 'head') && me < 0.7) {
      const c = lit(Lt, HAT, FRONT, 0.3), top = hy - rh * s * 0.82, tilt = -0.12 - 0.35 * sl;
      x.save(); x.translate(hx + rh * s * 0.05, top); x.rotate(tilt * -0.6);
      x.fillStyle = rgb(c); x.fillRect(-rh * s * 0.95, -0.06 * s, rh * s * 1.9, 0.12 * s);
      x.fillRect(-rh * s * 0.62, -0.62 * s, rh * s * 1.24, 0.6 * s);
      x.fillStyle = rgb(lit(Lt, SCARF, FRONT, 0.2)); x.fillRect(-rh * s * 0.62, -0.16 * s, rh * s * 1.24, 0.1 * s);    // (its red band)
      x.restore();
    }
    // THE STICK ARMS: twigs out of the middle (drooping as he slumps), a fork at each end
    if (has(p, 'arms') && has(p, 'middle')) {
      x.strokeStyle = rgb(lit(Lt, STICK, FRONT)); x.lineWidth = Math.max(0.8, 0.07 * s); x.lineCap = 'round';
      for (const sd of [-1, 1]) {
        const ax = mx + sd * rm * s * 0.85, ay = my - rm * s * 0.15, droop = (0.25 + 0.6 * sl + 0.5 * me) * s * (sd > 0 ? 1 : 0.7);
        const ex = ax + sd * 0.95 * s, ey = ay - 0.55 * s + droop;
        x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex, ey); x.moveTo(ax + (ex - ax) * 0.7, ay + (ey - ay) * 0.7); x.lineTo(ex + sd * 0.1 * s, ey - 0.3 * s); x.moveTo(ex, ey); x.lineTo(ex + sd * 0.28 * s, ey + 0.05 * s); x.stroke();
      }
    }
  };
  return { draw };
}
