// CITY 2.0 — THE HARBOR, FP2: THE MOTORCAR — the implied road's car, SEEN while the dock rests (the owner: "so the sound finally has a
// car"). A 1928 two-door sedan in side view (a Tudor: an upright cabin with a black leatherette roof + a sun visor, a long louvred hood
// to a nickel radiator shell with its cap, drum headlamps on a bar, sweeping black fenders + running boards, a spare on the back, a tail
// lamp, wooden artillery wheels, a driver in a flat cap), in one of five period paints by the pass (maroon, bottle green, Niagara blue,
// primrose, black). BAKED once per look (day / golden / night / night-under-a-lamp) + lane + paint + dpr into a small sprite and blitted;
// only the wheels turn live (their spokes rotated by the distance rolled, a half-step ghost for motion blur) and the body rides the
// cobbles (a fraction of a point). Its own light: at night the headlamps (a white-hot core + a tight halo — never a haze) throw a pool
// on the cobbles ahead + glints along the rails, the tail lamp a red ember; by day its soft contact shadow + the sun's cast shadow.
// Where + when: roadlight.js (core/harbor-promenade.js#carAt — the implied road's pass on the city's clock); only while the dock rests.
import { groundY } from '../../core/harbor-layout.js';
import { STREET } from '../../core/harbor-promenade.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { rgb, shade, mix } from './shapes.js';
import { sunShadow } from './stage.js';

const C = STREET.car;                                  // len 4.95, h 2.06, w 2.1, r 0.46, base 3.09 (world units)
const WHEELS = [0.86, 0.86 + C.base];                  // the wheels' centres from the rear (u)
const PAD = 0.3, TOPV = 2.25;                          // the sprite's margins: u −0.3 … len + 0.3, v −0.1 … 2.25
/** the period paints (by the pass: the same car on every phone) */
export const PAINTS = Object.freeze([[118, 26, 38], [26, 72, 50], [48, 82, 128], [206, 186, 120], [30, 30, 36]]);
const BLACK = [20, 20, 26];

/** the look's colours: the paint's multiplier, what its gloss mirrors (the sky / the sun / a lamp), the glass */
function lookOf(name, paint) {
  if (name === 'day') return { p: paint, hi: [206, 224, 246], hiA: 0.42, sun: [255, 250, 236], glassT: [150, 172, 200], glassB: [52, 62, 84], bk: BLACK, bkHi: [170, 186, 210], chrome: [214, 220, 230], chromeLo: [96, 102, 116], spoke: [226, 206, 160] };
  if (name === 'golden') return { p: mix(paint, [255, 160, 110], 0.12), hi: [255, 196, 150], hiA: 0.42, sun: [255, 214, 160], glassT: [236, 170, 140], glassB: [70, 50, 60], bk: [26, 20, 24], bkHi: [236, 160, 120], chrome: [246, 206, 166], chromeLo: [110, 80, 76], spoke: [236, 192, 140] };
  const lit = name === 'lamp';
  return { p: mix(shade(paint, lit ? -0.38 : -0.6), [40, 44, 80], lit ? 0.08 : 0.22), hi: lit ? [255, 200, 140] : [96, 104, 150], hiA: lit ? 0.4 : 0.3, sun: lit ? [255, 214, 160] : [120, 128, 170], glassT: lit ? [96, 76, 70] : [40, 44, 70], glassB: [10, 11, 20], bk: [10, 10, 16], bkHi: lit ? [230, 170, 110] : [80, 88, 130], chrome: lit ? [214, 176, 132] : [96, 100, 130], chromeLo: [30, 30, 44], spoke: lit ? [150, 120, 90] : [70, 66, 80] };
}

/** the body (everything but the wheels) at s px a unit, facing right; transparent where the wheels show (the arches cut out) */
function bakeBody(s, look) {
  const W = Math.ceil((C.len + PAD * 2) * s), H = Math.ceil((TOPV + 0.1) * s), cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = safeCtx(cv);
  if (!x) return cv;
  const X = u => (u + PAD) * s, Y = v => (TOPV - v) * s, K = look, p = K.p;
  const lw = v => Math.max(0.6, v * s);
  // the spare on the back: a tyre standing in its carrier (its tread, a nickel hub plate)
  x.fillStyle = rgb(K.bk); x.beginPath(); x.roundRect(X(-0.27), Y(1.3), 0.32 * s, 0.88 * s, 0.15 * s); x.fill();
  x.strokeStyle = rgb(shade(K.bkHi, -0.3), 0.7); x.lineWidth = lw(0.025); x.beginPath(); x.roundRect(X(-0.22), Y(1.24), 0.22 * s, 0.76 * s, 0.1 * s); x.stroke();
  x.fillStyle = rgb(K.chrome, 0.85); x.beginPath(); x.roundRect(X(-0.16), Y(0.92), 0.1 * s, 0.12 * s, 0.03 * s); x.fill();
  // the chassis' dark valance under the body (the frame rail, the splash aprons)
  x.fillStyle = rgb(shade(K.bk, 0.05)); x.fillRect(X(0.24), Y(0.64), 4.24 * s, 0.22 * s);
  // THE BODY: the cabin + the hood in one silhouette — a rounded rear, a crowned roof, a raked windshield, the radiator standing proud
  const g = x.createLinearGradient(0, Y(2.02), 0, Y(0.58));
  const st = (v, c) => g.addColorStop(Math.max(0, Math.min(1, (2.02 - v) / (2.02 - 0.58))), rgb(c));
  st(2.02, p); st(1.62, p); st(1.44, mix(p, K.hi, 0.18)); st(1.39, mix(p, K.hi, K.hiA)); st(1.36, shade(p, -0.22)); st(1.26, mix(p, K.hi, 0.22)); st(1.0, p); st(0.58, shade(p, -0.38));
  const shell = () => {
    x.beginPath(); x.moveTo(X(0.22), Y(0.62)); x.lineTo(X(0.1), Y(1.1)); x.bezierCurveTo(X(0.04), Y(1.56), X(0.14), Y(1.86), X(0.44), Y(1.94));
    x.quadraticCurveTo(X(0.62), Y(1.98), X(0.92), Y(1.98)); x.quadraticCurveTo(X(1.8), Y(2.01), X(2.6), Y(1.98)); x.quadraticCurveTo(X(2.7), Y(1.97), X(2.73), Y(1.9));
    x.lineTo(X(2.84), Y(1.43)); x.lineTo(X(4.28), Y(1.41)); x.lineTo(X(4.31), Y(1.48)); x.lineTo(X(4.46), Y(1.47)); x.lineTo(X(4.49), Y(0.62)); x.closePath();
  };
  x.fillStyle = g; shell(); x.fill();
  // the black leatherette roof (above the windows), its gloss line; the sun visor over the windshield
  x.save(); shell(); x.clip(); x.fillStyle = rgb(K.bk); x.fillRect(X(-0.1), Y(2.1), 3.0 * s, 0.22 * s); x.restore();
  x.strokeStyle = rgb(K.bkHi, 0.55); x.lineWidth = lw(0.025); x.beginPath(); x.moveTo(X(0.8), Y(1.965)); x.quadraticCurveTo(X(1.8), Y(1.99), X(2.5), Y(1.97)); x.stroke();
  x.fillStyle = rgb(K.bk); x.beginPath(); x.moveTo(X(2.62), Y(1.95)); x.lineTo(X(2.96), Y(1.9)); x.lineTo(X(2.94), Y(1.87)); x.lineTo(X(2.66), Y(1.88)); x.closePath(); x.fill();
  // the windows: the glass mirroring the sky, the driver behind the door's
  const win = (u0, u1, rr) => { x.beginPath(); x.roundRect(X(u0), Y(1.86), (u1 - u0) * s, 0.39 * s, rr); };
  for (const [u0, u1, rr, drv] of [[0.48, 1.72, [0.24 * s, 0.03 * s, 0.03 * s, 0.03 * s], false], [1.86, 2.64, [0.03 * s, 0.1 * s, 0.03 * s, 0.03 * s], true]]) {
    x.save(); win(u0, u1, rr); x.clip();
    x.fillStyle = rgb(mix(K.glassB, K.glassT, 0.25)); x.fillRect(X(u0), Y(1.86), (u1 - u0) * s, 0.4 * s);
    if (drv) {
      // the driver: shoulders, a head, a flat cap (a silhouette with a soft rim of the light outside), the wheel's rim edge-on
      const dk = shade(K.glassB, -0.4);
      x.fillStyle = rgb(dk); x.beginPath(); x.roundRect(X(2.06), Y(1.58), 0.5 * s, 0.2 * s, 0.07 * s); x.fill();
      x.beginPath(); x.ellipse(X(2.32), Y(1.66), 0.1 * s, 0.12 * s, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(X(2.34), Y(1.76), 0.14 * s, 0.045 * s, -0.05, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(X(2.31), Y(1.79), 0.1 * s, 0.05 * s, 0, Math.PI, 0); x.fill();
      x.fillStyle = rgb(K.hi, 0.25); x.fillRect(X(2.4), Y(1.72), 0.025 * s, 0.1 * s);
      x.strokeStyle = rgb(dk); x.lineWidth = lw(0.03); x.beginPath(); x.moveTo(X(2.5), Y(1.62)); x.lineTo(X(2.6), Y(1.44)); x.stroke();
    }
    const gg = x.createLinearGradient(0, Y(1.86), 0, Y(1.46));
    gg.addColorStop(0, rgb(K.glassT, 0.75)); gg.addColorStop(1, rgb(K.glassB, 0.35));
    x.fillStyle = gg; x.fillRect(X(u0), Y(1.86), (u1 - u0) * s, 0.4 * s);
    x.fillStyle = rgb(K.sun, 0.22); x.beginPath(); x.moveTo(X(u0 + 0.18), Y(1.86)); x.lineTo(X(u0 + 0.34), Y(1.86)); x.lineTo(X(u0 + 0.12), Y(1.46)); x.lineTo(X(u0 - 0.04), Y(1.46)); x.closePath(); x.fill();
    x.restore();
    x.strokeStyle = rgb(K.chrome, 0.55); x.lineWidth = lw(0.018); win(u0, u1, rr); x.stroke();
  }
  // the windshield's frame (edge-on, raked), the door: its seams + the handle; the belt moulding (a fine cream pinstripe)
  x.strokeStyle = rgb(shade(p, -0.3)); x.lineWidth = lw(0.05); x.beginPath(); x.moveTo(X(2.72), Y(1.9)); x.lineTo(X(2.82), Y(1.44)); x.stroke();
  x.strokeStyle = rgb(shade(p, -0.45), 0.9); x.lineWidth = lw(0.016);
  x.beginPath(); x.moveTo(X(1.79), Y(0.66)); x.lineTo(X(1.79), Y(1.88)); x.moveTo(X(2.74), Y(0.66)); x.lineTo(X(2.74), Y(1.86)); x.moveTo(X(1.79), Y(0.66)); x.lineTo(X(2.74), Y(0.66)); x.stroke();
  x.fillStyle = rgb(K.chrome); x.fillRect(X(1.86), Y(1.31), 0.13 * s, Math.max(0.6, 0.03 * s));
  x.fillStyle = rgb(mix(p, [236, 220, 170], 0.55), 0.85); x.fillRect(X(0.16), Y(1.385), 4.12 * s, Math.max(0.5, 0.014 * s));
  // the long hood: its hinge line, the louvres
  x.strokeStyle = rgb(shade(p, -0.35)); x.lineWidth = lw(0.014); x.beginPath(); x.moveTo(X(2.86), Y(1.36)); x.lineTo(X(4.28), Y(1.35)); x.stroke();
  for (let i = 0; i < 14; i++) {
    const u = 3.1 + i * 0.066;
    x.fillStyle = rgb(shade(p, -0.5)); x.fillRect(X(u), Y(1.24), Math.max(0.5, 0.02 * s), 0.34 * s);
    x.fillStyle = rgb(mix(p, K.hi, 0.5), 0.6); x.fillRect(X(u + 0.022), Y(1.24), Math.max(0.4, 0.012 * s), 0.34 * s);
  }
  // the radiator shell (nickel: bright, the sky in it), its cap + the motometer
  const rg = x.createLinearGradient(0, Y(1.48), 0, Y(0.62));
  rg.addColorStop(0, rgb(K.chrome)); rg.addColorStop(0.45, rgb(K.chromeLo)); rg.addColorStop(0.55, rgb(K.chrome)); rg.addColorStop(1, rgb(K.chromeLo));
  x.fillStyle = rg; x.beginPath(); x.moveTo(X(4.31), Y(1.48)); x.lineTo(X(4.46), Y(1.47)); x.lineTo(X(4.49), Y(0.62)); x.lineTo(X(4.36), Y(0.62)); x.closePath(); x.fill();
  x.fillStyle = rgb(K.chrome); x.beginPath(); x.roundRect(X(4.34), Y(1.53), 0.08 * s, 0.06 * s, 0.02 * s); x.fill();
  x.beginPath(); x.ellipse(X(4.38), Y(1.56), 0.045 * s, 0.025 * s, 0, 0, Math.PI * 2); x.fill();
  // THE WHEEL ARCHES: cut out of the body + the valance (the wheels show through, drawn under this sprite)
  x.globalCompositeOperation = 'destination-out';
  for (const u of WHEELS) { x.beginPath(); x.arc(X(u), Y(C.r), 0.6 * s, 0, Math.PI * 2); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  // THE FENDERS (glossy black, a sweep over each wheel down to the running board, the front one long + low to its tip) + the running
  // board with its bright edge strip
  const fender = (cxu, front) => {
    const cx = X(cxu), cy = Y(C.r), ro = 0.65 * s, ri = 0.54 * s, a0 = front ? -2.95 : -0.38, a1 = front ? -0.2 : -3.3;
    x.beginPath();
    if (front) {
      x.moveTo(X(3.2), Y(0.37)); x.lineTo(X(3.2), Y(0.45)); x.quadraticCurveTo(X(3.26), Y(0.56), cx + ro * Math.cos(a0), cy + ro * Math.sin(a0));
      x.arc(cx, cy, ro, a0, a1, false);
      x.quadraticCurveTo(X(4.68), Y(0.86), X(4.84), Y(0.6)); x.lineTo(X(4.74), Y(0.55));
      x.arc(cx, cy, ri, -0.24, -2.9, true); x.lineTo(X(3.34), Y(0.37));
    } else {
      x.moveTo(X(1.56), Y(0.37)); x.lineTo(X(1.56), Y(0.45)); x.quadraticCurveTo(X(1.5), Y(0.58), cx + ro * Math.cos(a0), cy + ro * Math.sin(a0));
      x.arc(cx, cy, ro, a0, a1, true);
      x.quadraticCurveTo(X(-0.02), Y(0.54), X(-0.06), Y(0.42)); x.lineTo(X(0.06), Y(0.4));
      x.arc(cx, cy, ri, -3.24, -0.46, false); x.lineTo(X(1.42), Y(0.37));
    }
    x.closePath(); x.fillStyle = rgb(K.bk); x.fill();
    // the gloss along its crown
    x.strokeStyle = rgb(K.bkHi, 0.75); x.lineWidth = lw(0.03); x.beginPath();
    if (front) x.arc(cx, cy, ro - 0.035 * s, -2.55, -0.75, false); else x.arc(cx, cy, ro - 0.035 * s, -0.7, -2.45, true);
    x.stroke();
    // a little shade the fender throws on the tyre's top (over the wheel, drawn after it: part of this sprite)
    const sg = x.createRadialGradient(cx, cy, ri * 0.8, cx, cy, ri);
    sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.3)');
    x.fillStyle = sg; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, ri, front ? -2.9 : -3.24, front ? -0.24 : -0.46, false); x.closePath(); x.fill();
  };
  fender(WHEELS[0], false); fender(WHEELS[1], true);
  x.fillStyle = rgb(K.bk); x.fillRect(X(1.4), Y(0.45), 1.86 * s, 0.09 * s);
  x.fillStyle = rgb(K.chrome, 0.85); x.fillRect(X(1.4), Y(0.45), 1.86 * s, Math.max(0.5, 0.022 * s));
  // the headlamp on its bar (a black drum with a nickel rim; its lens faces forward — lit live) + the bumpers' ends + the tail lamp
  x.strokeStyle = rgb(K.bk); x.lineWidth = lw(0.045); x.beginPath(); x.moveTo(X(4.56), Y(0.72)); x.lineTo(X(4.6), Y(0.92)); x.stroke();
  x.fillStyle = rgb(K.bk); x.beginPath(); x.moveTo(X(4.47), Y(1.11)); x.quadraticCurveTo(X(4.5), Y(1.31), X(4.76), Y(1.31)); x.lineTo(X(4.78), Y(0.91)); x.quadraticCurveTo(X(4.5), Y(0.91), X(4.47), Y(1.11)); x.closePath(); x.fill();
  x.strokeStyle = rgb(K.bkHi, 0.7); x.lineWidth = lw(0.025); x.beginPath(); x.moveTo(X(4.52), Y(1.22)); x.quadraticCurveTo(X(4.58), Y(1.28), X(4.72), Y(1.28)); x.stroke();
  x.fillStyle = rgb(K.chrome); x.beginPath(); x.ellipse(X(4.78), Y(1.11), 0.05 * s, 0.205 * s, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(K.chrome); x.fillRect(X(4.82), Y(0.7), 0.17 * s, 0.11 * s); x.fillRect(X(-0.36), Y(0.58), 0.14 * s, 0.1 * s);
  x.fillStyle = rgb(K.bk); x.beginPath(); x.roundRect(X(0.12), Y(1.03), 0.14 * s, 0.13 * s, 0.03 * s); x.fill();
  x.fillStyle = rgb([150, 20, 24]); x.fillRect(X(0.1), Y(1.01), 0.04 * s, 0.09 * s);
  return cv;
}

/** a wheel's turning part (rim + 12 wooden spokes + the hub) and its still tyre, at s px a unit */
function bakeWheel(s, look) {
  const R = C.r * s, N = Math.ceil(R * 2 + 4), mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const tyre = mk(), spin = mk(), t = safeCtx(tyre), x = safeCtx(spin), m = N / 2, K = look;
  if (t) {
    t.fillStyle = rgb([16, 16, 20]); t.beginPath(); t.arc(m, m, R, 0, Math.PI * 2); t.fill();
    t.strokeStyle = rgb(shade(K.bkHi, -0.35), 0.8); t.lineWidth = Math.max(0.6, R * 0.07); t.beginPath(); t.arc(m, m, R * 0.86, 0, Math.PI * 2); t.stroke();
    t.strokeStyle = rgb(K.bkHi, 0.45); t.lineWidth = Math.max(0.5, R * 0.05); t.beginPath(); t.arc(m, m, R * 0.95, -2.6, -0.6); t.stroke();
  }
  if (x) {
    const sp = K.spoke, rim = R * 0.7;
    x.strokeStyle = rgb(shade(sp, -0.25)); x.lineWidth = Math.max(0.8, R * 0.1); x.beginPath(); x.arc(m, m, rim, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      x.strokeStyle = rgb(i % 2 ? sp : shade(sp, -0.12)); x.lineWidth = Math.max(0.7, R * 0.11); x.lineCap = 'butt';
      x.beginPath(); x.moveTo(m + ca * R * 0.16, m + sa * R * 0.16); x.lineTo(m + ca * rim, m + sa * rim); x.stroke();
    }
    x.fillStyle = rgb(K.chrome); x.beginPath(); x.arc(m, m, R * 0.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(K.chromeLo); x.beginPath(); x.arc(m, m, R * 0.09, 0, Math.PI * 2); x.fill();
  }
  return { tyre, spin, N };
}

const glowSprite = (col, soft) => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = safeCtx(c);
  if (x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(soft, `rgba(${col},0.4)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  return c;
};

export function createMotorcar() {
  const cache = new Map();
  let glowW = null, glowR = null, pool = null, dark = null, last = null;
  const sprite = (kind, s, look, paint) => {
    const key = `${kind}|${look}|${paint}|${Math.round(s * 8)}`;
    let v = cache.get(key);
    if (!v) {
      const K = lookOf(look, PAINTS[paint]);
      v = kind === 'body' ? bakeBody(s, K) : bakeWheel(s, K);
      if (cache.size > 12) { for (const o of cache.values()) for (const cv of o.tyre ? [o.tyre, o.spin] : [o]) cv.width = cv.height = 0; cache.clear(); }
      cache.set(key, v);
    }
    return v;
  };
  return {
    /**
     * the car at its place: car (core/harbor-promenade.js#carAt), o: { cam, T (the bake's tones: the sun's side + height), k (its
     * visibility × the city's fade), night (the lamps' ramp), lampAt (x → 0..1: the street lamps' light on it), paint (0..4),
     * dpr, t (s), motion, wet }
     */
    draw(c, car, o) {
      const cam = o.cam, sp = cam.F / car.z, gy = groundY(cam, car.z), cx = cam.VPX + cam.F * car.x / car.z, dir = car.dir;
      const s = sp * o.dpr, T = o.T || {}, day = (T.day || 0) + (T.gold || 0), night = o.night || 0;
      const look = night > 0.5 ? 'night' : (T.gold || 0) > (T.day || 0) ? 'golden' : 'day';
      const len = C.len * sp, x0 = cx - len / 2, x1 = cx + len / 2;
      last = { x: cx, y: gy, w: len, h: C.h * sp, z: car.z, dir, look, top: gy - C.h * sp };
      if (x1 < -40 || x0 > cam.W + 40 || o.k <= 0.004) return;
      c.save(); c.globalAlpha = o.k;
      // ---- on the ground first: the shadows (by day the sun's, always a soft contact shade under the body)
      if (!dark) dark = glowSprite('14,12,26', 0.55);
      const sh = day > 0.15 ? sunShadow(T, C.h) : null;
      if (sh) {
        // the sun's cast shadow: the car's footprint swept along the sun (a box's shadow — the hull of the footprint + its shifted copy),
        // a crisp-soft edge (a fill + a wide faint stroke), its alpha the lamps' + the trees' (stage.js#sunShadow)
        const P = (wx, wz) => [cam.VPX + cam.F * wx / wz, groundY(cam, wz)], a = car.x - C.len / 2 + 0.25, b = car.x + C.len / 2 - 0.15, z0 = car.z + 0.1, z1 = car.z + C.w - 0.1;
        const dx = sh.dx * 0.85, dz = sh.dz * 0.85;
        const pts = dx >= 0 ? [[a, z0], [b, z0], [b + dx, z0 + dz], [b + dx, z1 + dz], [a + dx, z1 + dz], [a, z1]] : [[b, z0], [a, z0], [a + dx, z0 + dz], [a + dx, z1 + dz], [b + dx, z1 + dz], [b, z1]];
        c.beginPath(); pts.forEach(([wx, wz], i) => { const [px, py] = P(wx, wz); if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath();
        c.fillStyle = 'rgba(24,18,40,1)'; c.globalAlpha = o.k * Math.min(0.6, sh.a * 1.5); c.fill();
        c.strokeStyle = 'rgba(24,18,40,1)'; c.lineJoin = 'round'; c.lineWidth = 2.4; c.globalAlpha = o.k * Math.min(0.3, sh.a * 0.7); c.stroke();
      }
      // the shade under the car (the body keeps the sky off the cobbles between its wheels) + a soft contact round it
      { const ya = groundY(cam, car.z + C.w), yb = gy + 1.5; c.globalAlpha = o.k * (0.5 - 0.15 * night); c.drawImage(dark, x0 + len * 0.02, ya, len * 0.96, yb - ya);
        const ux0 = cx + (WHEELS[0] - C.len / 2 - C.r) * sp, ux1 = cx + (WHEELS[1] - C.len / 2 + C.r) * sp, uy = gy - 0.42 * sp;
        const ug = c.createLinearGradient(0, uy, 0, gy + 0.6); ug.addColorStop(0, 'rgba(14,12,26,0.25)'); ug.addColorStop(1, 'rgba(14,12,26,0.85)');
        c.globalAlpha = o.k * (0.75 - 0.25 * night); c.fillStyle = ug; c.fillRect(Math.min(ux0, ux1), uy, Math.abs(ux1 - ux0), gy + 0.6 - uy); }
      // ---- at night: the headlamps' pool on the cobbles ahead + the glints along the rails, the tail lamp's red on the ground
      const hk = night * o.k;
      if (hk > 0.02) {
        if (!pool) pool = glowSprite('255,226,172', 0.4);
        c.globalCompositeOperation = 'lighter';
        const fx = cx + dir * (len / 2), wet = o.wet || 0;
        for (const [ahead, rx, z0, z1, a] of [[4.6, 4.8, -1.2, 3.0, 0.42], [2.2, 2.3, -0.5, 2.4, 0.5], [0.9, 1.0, -0.2, 2.2, 0.4]]) {
          const px = fx + dir * ahead * sp, ya = groundY(cam, car.z + z1), yb = groundY(cam, car.z + z0), rw = rx * sp;
          c.globalAlpha = a * hk * (1 + 0.7 * wet); c.drawImage(pool, px - rw, ya, rw * 2, yb - ya);
        }
        for (const zr of o.rails || []) {
          if (zr < car.z - 1.4 || zr > car.z + 3.2) continue;
          const ry = groundY(cam, zr), a0 = fx + dir * 0.5 * sp, a1 = fx + dir * 8 * sp;
          const g = c.createLinearGradient(a0, 0, a1, 0); g.addColorStop(0, 'rgba(255,236,196,0.85)'); g.addColorStop(1, 'rgba(255,236,196,0)');
          c.globalAlpha = hk * 0.8; c.fillStyle = g; c.fillRect(Math.min(a0, a1), ry - 0.9, Math.abs(a1 - a0), 1.2);
        }
        if (!glowR) glowR = glowSprite('255,40,40', 0.3);
        const tx = cx - dir * (len / 2 - 0.1 * sp), ty = groundY(cam, car.z + 0.6), tr = 1.4 * sp;
        c.globalAlpha = 0.18 * hk; c.drawImage(glowR, tx - tr, ty - tr * 0.3, tr * 2, tr * 0.6);
        c.globalCompositeOperation = 'source-over';
      }
      // ---- the car: the wheels (turning), then the body riding the cobbles over them
      const roll = (car.x * dir) / C.r, bob = o.motion ? 0.012 * sp * Math.sin(o.t * 17.3) + 0.006 * sp * Math.sin(o.t * 29.1 + 1) : 0;
      const lampK = Math.max(0, Math.min(1, o.lampAt ? o.lampAt(car.x) * night : 0));
      c.globalAlpha = o.k;
      c.translate(cx, gy); c.scale(dir, 1);
      const wh = sprite('wheel', s, look, o.paint), wn = wh.N / o.dpr, step = (car.speed / C.r) / 60;
      for (const u of WHEELS) {
        const wx = (u - C.len / 2) * sp, wy = -C.r * sp;
        c.drawImage(wh.tyre, wx - wn / 2, wy - wn / 2, wn, wn);
        for (const [da, a] of [[0, 1], [-step * 0.5, 0.45]]) {
          c.save(); c.translate(wx, wy); c.rotate(roll + da); c.globalAlpha = o.k * a; c.drawImage(wh.spin, -wn / 2, -wn / 2, wn, wn); c.restore();
        }
      }
      c.globalAlpha = o.k;
      const body = sprite('body', s, look, o.paint), bw = body.width / o.dpr, bh = body.height / o.dpr, bx = (-PAD - C.len / 2) * sp, by = -(TOPV) * sp + bob;
      c.drawImage(body, bx, by, bw, bh);
      if (lampK > 0.03 && look === 'night') { c.globalAlpha = o.k * lampK; c.drawImage(sprite('body', s, 'lamp', o.paint), bx, by, bw, bh); }
      // ---- its lamps lit (crisp: a white-hot core + a tight halo — never a haze)
      if (hk > 0.02) {
        if (!glowW) glowW = glowSprite('255,236,200', 0.28);
        c.globalCompositeOperation = 'lighter';
        const hx = (4.79 - C.len / 2) * sp, hy = -1.11 * sp + bob, r1 = 0.6 * sp, r2 = 0.22 * sp;
        c.globalAlpha = 0.55 * hk; c.drawImage(glowW, hx - r1, hy - r1, r1 * 2, r1 * 2);
        c.globalAlpha = hk; c.drawImage(glowW, hx - r2, hy - r2 * 1.6, r2 * 2, r2 * 3.2);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(255,250,236,${hk})`; c.beginPath(); c.ellipse(hx, hy, 0.045 * sp, 0.18 * sp, 0, 0, Math.PI * 2); c.fill();
        c.globalCompositeOperation = 'lighter';
        const tx = (0.11 - C.len / 2) * sp, ty = -0.96 * sp + bob, r3 = 0.22 * sp;
        c.globalAlpha = 0.8 * hk; c.drawImage(glowR, tx - r3, ty - r3, r3 * 2, r3 * 2);
        c.globalCompositeOperation = 'source-over';
      }
      c.restore();
      last.drawn = true;
    },
    /** the last draw's box (screen pt) — the tests read it */
    debug: () => last,
    reset() { last = null; },
    destroy() { for (const o of cache.values()) for (const cv of o.tyre ? [o.tyre, o.spin] : [o]) cv.width = cv.height = 0; cache.clear(); for (const s of [glowW, glowR, pool, dark]) if (s) s.width = s.height = 0; glowW = glowR = pool = dark = null; },
  };
}
