// CITY 2.0 — THE HARBOR, PART 8P: THE BUS — a 1920s city coach on the back road (its timetable: core/harbor-people.js#busesOf). Seen
// side-on, its right side (the door side) toward us: it comes from behind the speakeasy, through the crossing on green, stops at the
// curb right of it (the folding front door opens, riders step off + on), pulls away to the right. A two-tone livery (cream over a deep
// harbor green, a red pinstripe, "HARBOR LINE"), a domed roof with a route board, a row of drop windows, spoked wheels turning with the
// distance, bullet headlamps; at night its windows lit warm with the riders' heads, the headlamps' beams along the road, a red tail.
import { project } from '../../core/harbor-layout.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));

/** the coach's proportions (world units, along its length from the rear 0 → the front len; up from the road) */
export const COACH = Object.freeze({ h: 2.95, floor: 0.62, belt: 1.45, win: [1.58, 2.38], roof: 2.62, wheel: 0.52, wheels: [0.17, 0.78], door: [0.8, 0.95] });

/**
 * drawBus(c, cam, b, env): b = { xNow (its centre, world), z, len, door (open), dist (s.t. the wheels turn), riders (heads in the
 * windows at night) }, env = { T (tones), dark (the lamps' ramp), t } → its box on screen
 */
export function drawBus(c, cam, b, env) {
  const T = env.T || { day: 1 }, dark = clamp01(env.dark || 0), C = COACH, len = b.len, x0 = b.xNow - len / 2, z = b.z;
  const P = (u, v) => project(cam, x0 + u, v, z), s = cam.F / z, K = u => u * len;
  const cream = tri(T, [232, 222, 194], [244, 206, 160], [62, 58, 74]), green = tri(T, [34, 84, 66], [52, 70, 52], [14, 22, 26]), red = tri(T, [176, 40, 40], [190, 60, 44], [56, 18, 24]);
  const roofC = tri(T, [196, 188, 166], [214, 176, 136], [40, 38, 52]), dk = tri(T, [26, 26, 30], [30, 24, 26], [8, 8, 14]), chrome = tri(T, [210, 214, 220], [236, 204, 170], [60, 60, 76]);
  const glass = tri(T, [120, 150, 180], [196, 150, 130], [16, 16, 30]);
  let doorBox = null;
  c.save();
  // the shadow on the road
  { const [a, ya] = P(0, 0), [bb] = P(len, 0); c.fillStyle = `rgba(6,6,14,${(0.35 + 0.15 * dark).toFixed(3)})`; c.beginPath(); c.ellipse((a + bb) / 2, ya, (bb - a) / 2 + 2, Math.max(1.5, s * 0.18), 0, 0, Math.PI * 2); c.fill(); }
  // the body: the lower panels (green), the upper (cream), the domed roof — rounded at the front + the rear
  const [ax, ay] = P(0.05, C.floor * 0.55), [bx] = P(len - 0.02, 0), [, yb] = P(0, C.belt), [, yr] = P(0, C.roof), [, yt] = P(0, C.h);
  const W = bx - ax, rr = s * 0.55;
  c.fillStyle = rgb(green); c.beginPath(); c.roundRect(ax, yb, W, ay - yb, [0, 0, s * 0.18, s * 0.18]); c.fill();
  c.fillStyle = rgb(cream); c.beginPath(); c.roundRect(ax, yr, W, yb - yr + 0.5, [rr * 0.5, rr, 0, 0]); c.fill();
  c.fillStyle = rgb(roofC); c.beginPath(); c.roundRect(ax + s * 0.15, yt, W - s * 0.35, yr - yt + 1, [rr, rr * 1.2, 0, 0]); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(ax + s * 0.4, yt + (yr - yt) * 0.25, W - s * 1.2, Math.max(0.5, s * 0.05));
  // the red pinstripe on the belt, the rubbing strake, the skirt's shade
  c.fillStyle = rgb(red); c.fillRect(ax, yb - Math.max(0.6, s * 0.05), W, Math.max(0.8, s * 0.07));
  c.fillStyle = rgb(mix(green, [0, 0, 0], 0.35)); c.fillRect(ax, ay - s * 0.14, W, s * 0.14);
  // the windows: a row of drop windows (the door's window at the front), lit at night with the riders
  const [, yw0] = P(0, C.win[1]), [, yw1] = P(0, C.win[0]), n = 6, wa = 0.08, wb = C.door[0] - 0.02;
  for (let i = 0; i < n; i++) {
    const u0 = wa + (wb - wa) * i / n + 0.012, u1 = wa + (wb - wa) * (i + 1) / n - 0.012, [p] = P(K(u0), 0), [q] = P(K(u1), 0);
    c.fillStyle = rgb(dark > 0.3 ? mix(glass, [255, 206, 140], 0.85 * dark) : glass); c.beginPath(); c.roundRect(p, yw0, q - p, yw1 - yw0, Math.max(0.5, s * 0.08)); c.fill();
    if (dark < 0.3) { c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(p + (q - p) * 0.15, yw0); c.lineTo(p + (q - p) * 0.45, yw0); c.lineTo(p + (q - p) * 0.1, yw1); c.lineTo(p, yw1); c.closePath(); c.fill(); }
    // the riders: heads + shoulders in the window (dark against the lit glass at night, faint by day)
    if ((b.riders || 0) > 0 && (i * 7 + (b.seed || 0)) % 3 !== 0 && i < 1 + (b.riders || 0) * 2) {
      c.fillStyle = dark > 0.3 ? 'rgba(30,18,16,0.85)' : 'rgba(20,24,30,0.4)'; const hx = (p + q) / 2 + (i % 2 ? 1 : -1) * (q - p) * 0.12, hh = yw1 - yw0;
      c.beginPath(); c.arc(hx, yw1 - hh * 0.52, hh * 0.16, 0, Math.PI * 2); c.fill(); c.fillRect(hx - hh * 0.26, yw1 - hh * 0.34, hh * 0.52, hh * 0.34);
    }
    c.fillStyle = rgb(cream); c.fillRect(q, yw0, Math.max(0.6, P(K(u1 + 0.024), 0)[0] - q), yw1 - yw0);
  }
  // the windscreen (a sliver at the front, raked) + the destination board over it
  { const [p] = P(K(0.955), 0), [q] = P(len - 0.06, 0); c.fillStyle = rgb(dark > 0.3 ? mix(glass, [255, 214, 160], 0.5 * dark) : glass); c.beginPath(); c.moveTo(p, yw0); c.lineTo(q - s * 0.08, yw0); c.lineTo(q, yw1); c.lineTo(p, yw1); c.closePath(); c.fill();
    const [r0] = P(K(0.6), 0), [r1] = P(K(0.94), 0), by = yt + (yr - yt) * 0.15, bh = (yr - yt) * 0.62;
    c.fillStyle = rgb(dk); c.fillRect(r0, by, r1 - r0, bh);
    c.fillStyle = dark > 0.3 ? 'rgb(255,226,160)' : rgb(mix(cream, [255, 255, 255], 0.3)); c.font = `700 ${Math.max(4, bh * 0.78).toFixed(1)}px "Chakra Petch", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7  HARBOR', (r0 + r1) / 2, by + bh * 0.55); }
  // the folding door (front, our side): closed — two glazed leaves; open — the dark doorway, the step lit at night
  { const [p] = P(K(C.door[0]), 0), [q] = P(K(C.door[1]), 0), [, yd0] = P(0, C.win[1] + 0.05), [, yd1] = P(0, C.floor * 0.6);
    doorBox = { x: p, y: yd0, w: q - p, h: yd1 - yd0 };
    if (b.door) { c.fillStyle = rgb(dark > 0.3 ? [120, 84, 52] : [30, 28, 32]); c.fillRect(p, yd0, q - p, yd1 - yd0); c.fillStyle = rgb(chrome); c.fillRect(p, yd0, Math.max(0.6, (q - p) * 0.12), yd1 - yd0); c.fillRect(q - Math.max(0.6, (q - p) * 0.12), yd0, Math.max(0.6, (q - p) * 0.12), yd1 - yd0); }
    else { c.fillStyle = rgb(green); c.fillRect(p, yd0, q - p, yd1 - yd0); c.fillStyle = rgb(dark > 0.3 ? mix(glass, [255, 206, 140], 0.6 * dark) : glass); for (const k of [0, 0.5]) c.fillRect(p + (q - p) * (k + 0.08), yd0 + (yd1 - yd0) * 0.06, (q - p) * 0.34, (yd1 - yd0) * 0.48); c.fillStyle = rgb(dk); c.fillRect((p + q) / 2 - 0.3, yd0, 0.6, yd1 - yd0); } }
  // the lettering on the green: HARBOR LINE
  { const [p] = P(K(0.12), 0), [q] = P(K(0.72), 0), y = (yb + ay) / 2, hh = (ay - yb) * 0.42; c.fillStyle = rgb(mix(cream, [236, 196, 110], 0.5)); c.font = `700 ${Math.max(3.5, hh).toFixed(1)}px "Chakra Petch", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HARBOR  LINE', (p + q) / 2, y); }
  // the wheels: spoked discs in their arches, turning with the distance (b.dist), the rear a pair
  for (const wu of C.wheels) {
    const [wx, wy] = P(K(wu), C.wheel), r = C.wheel * s, rot = (b.dist || 0) / C.wheel;
    c.fillStyle = rgb(mix(green, [0, 0, 0], 0.55)); c.beginPath(); c.arc(wx, wy, r * 1.18, Math.PI, 0); c.fill();
    c.fillStyle = rgb(dk); c.beginPath(); c.arc(wx, wy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgb(mix(cream, dk, 0.3)); c.beginPath(); c.arc(wx, wy, r * 0.62, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgb(dk); c.lineWidth = Math.max(0.5, r * 0.09);
    for (let k = 0; k < 8; k++) { const an = rot + k * Math.PI / 4; c.beginPath(); c.moveTo(wx + Math.cos(an) * r * 0.16, wy + Math.sin(an) * r * 0.16); c.lineTo(wx + Math.cos(an) * r * 0.6, wy + Math.sin(an) * r * 0.6); c.stroke(); }
    c.fillStyle = rgb(chrome); c.beginPath(); c.arc(wx, wy, r * 0.18, 0, Math.PI * 2); c.fill();
  }
  // the front: the bumper, a bullet headlamp, the radiator's edge; the tail lamp at the rear
  { const [fx, fy] = P(len - 0.05, C.floor), hl = s * 0.17;
    c.fillStyle = rgb(chrome); c.fillRect(fx - s * 0.1, fy + s * 0.12, s * 0.42, Math.max(0.8, s * 0.09));
    c.fillStyle = rgb(dk); c.beginPath(); c.ellipse(fx + s * 0.06, fy - s * 0.12, hl * 1.1, hl, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = dark > 0.3 ? 'rgb(255,246,214)' : rgb(chrome); c.beginPath(); c.ellipse(fx + s * 0.12, fy - s * 0.12, hl * 0.55, hl * 0.75, 0, 0, Math.PI * 2); c.fill();
    if (dark > 0.3) {
      // the headlamp's beam along the road ahead (soft, short) + its tight halo
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(fx, 0, fx + s * 4.5, 0); g.addColorStop(0, `rgba(255,240,200,${(0.32 * dark).toFixed(3)})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(fx + s * 0.1, fy - s * 0.2); c.lineTo(fx + s * 4.5, fy - s * 0.05); c.lineTo(fx + s * 4.5, fy + s * 0.75); c.lineTo(fx + s * 0.1, fy + s * 0.1); c.closePath(); c.fill();
      const h2 = c.createRadialGradient(fx + s * 0.12, fy - s * 0.12, 0, fx + s * 0.12, fy - s * 0.12, hl * 2.4); h2.addColorStop(0, `rgba(255,236,190,${(0.6 * dark).toFixed(3)})`); h2.addColorStop(1, 'rgba(255,236,190,0)');
      c.fillStyle = h2; c.fillRect(fx + s * 0.12 - hl * 2.4, fy - s * 0.12 - hl * 2.4, hl * 4.8, hl * 4.8);
      const [tx, ty] = P(0.02, C.floor + 0.25); const h3 = c.createRadialGradient(tx, ty, 0, tx, ty, s * 0.3); h3.addColorStop(0, `rgba(255,60,50,${(0.8 * dark).toFixed(3)})`); h3.addColorStop(1, 'rgba(255,60,50,0)');
      c.fillStyle = h3; c.fillRect(tx - s * 0.3, ty - s * 0.3, s * 0.6, s * 0.6);
      c.globalCompositeOperation = 'source-over';
    }
    const [tx, ty] = P(0.02, C.floor + 0.25); c.fillStyle = dark > 0.3 ? 'rgb(255,90,70)' : rgb(red); c.fillRect(tx - 0.6, ty - s * 0.08, Math.max(1, s * 0.08), s * 0.16); }
  c.restore();
  return { x: ax, y: yt, w: W, h: ay - yt, door: b.door ? doorBox : null };
}
