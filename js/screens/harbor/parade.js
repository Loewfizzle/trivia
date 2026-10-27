// CITY 2.0 — THE HARBOR, 11a-2 Group 2: THE PARADE drawn — the GIANT BALLOONS + their ropes + their shadows, the HARVEST FLOAT (the
// plan + the clock: core/harbor-parade.js, PURE; the marchers + the crowd are people: core/harbor-people.js#paradeVisit / crowdVisit,
// their looks folk.js#paradeLook). Items for people.js's FAR pass (z-sorted with the marchers on the near lane: the handlers in the
// front file over the balloon's ropes, the back file behind).
//
// THE BALLOONS (original, unbranded — a TURKEY with its fanned tail, a ribbed PUMPKIN with a curling vine, an ACORN under its scaled cap,
// a CIDER MUG with a cinnamon stick + its steam): each part an inflated VOLUME (a radial light from upper-left: the sheen → the base →
// the dark rim where the fabric turns away), the fabric's SEAMS (gores) following each part, a soft specular SHEEN, the shade where one
// part sits on another; baked once per kind + size + light, drawn live: floating high over the road, swaying + bobbing + leaning in the
// REAL wind (core/harbor-parade.js#balloonMotion), held down by ropes to each handler's raised hand, its shadow soft on the road.
import { project } from '../../core/harbor-layout.js';
import { PARADE, BALLOONS, unitsAt, unitPeople, balloonMotion } from '../../core/harbor-parade.js';
import { lightFor, lit, norm } from './props-light.js';
import { pieceCtx } from '../../core/harbor-light.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { rngFrom } from '../../core/rng.js';
import { paintSpotPiece } from './harvest.js';
import { paintPumpkin } from './holidayprops.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${+a.toFixed(3)})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** an inflated part: an ellipse (cx, cy, rx, ry in px, y down; rot) of colour col — lit by Lt (props-light#lit) from its own normals:
 *  the sheen up-left, the base, the dark rim turning away; its seams (gores: n arcs), a soft specular spot */
function puff(x, Lt, cx, cy, rx, ry, rot, col, o = {}) {
  const hi = lit(Lt, mix(col, [255, 255, 255], 0.18), [-0.45, 0.6, -0.66], 0.2), base = lit(Lt, col, [0, 0.15, -1], 0.05), lo = lit(Lt, col.map(v => v * 0.55), [0.6, -0.4, -0.5], 0);
  x.save(); x.translate(cx, cy); x.rotate(rot || 0);
  const g = x.createRadialGradient(-rx * 0.35, -ry * 0.38, Math.min(rx, ry) * 0.05, 0, 0, Math.max(rx, ry) * 1.08);
  g.addColorStop(0, rgb(hi)); g.addColorStop(0.55, rgb(base)); g.addColorStop(0.92, rgb(lo)); g.addColorStop(1, rgb(lo.map(v => v * 0.8)));
  x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.fill();
  // the seams: gores following the part (vertical or around), a darker line + a hair of light beside it
  const n = o.seams == null ? 4 : o.seams;
  if (n > 0) { x.save(); x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.clip(); x.lineWidth = Math.max(0.5, Math.min(rx, ry) * 0.025);
    for (let k = 1; k < n; k++) { const u = -1 + 2 * k / n, ex = rx * Math.cos(Math.asin(Math.min(0.999, Math.abs(u)))) * 0;
      x.strokeStyle = rgb(lo, 0.45); x.beginPath(); x.ellipse(u * rx * 0.85 + ex, 0, rx * (1 - Math.abs(u)) * 0.35 + 0.5, ry * 0.99, 0, -Math.PI / 2, Math.PI / 2, u > 0); x.stroke(); }
    x.restore(); }
  // the sheen: a soft bright oval up-left (the fabric's gloss)
  const sg = x.createRadialGradient(-rx * 0.42, -ry * 0.48, 0, -rx * 0.42, -ry * 0.48, Math.min(rx, ry) * 0.45);
  sg.addColorStop(0, `rgba(255,255,255,${(0.38 * (o.gloss == null ? 1 : o.gloss) * (0.4 + 0.6 * (Lt.day + Lt.gold))).toFixed(3)})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sg; x.fillRect(-rx, -ry, rx * 2, ry * 2);
  x.restore();
}
/** the soft shade a part throws onto the part under it (multiplied) */
function shade(x, cx, cy, rx, ry, a = 0.25) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, `rgba(30,16,10,${a})`); g.addColorStop(1, 'rgba(30,16,10,0)'); x.save(); x.translate(cx, cy); x.scale(1, ry / rx); x.translate(-cx, -cy); x.fillStyle = g; x.fillRect(cx - rx, cy - rx, rx * 2, rx * 2); x.restore(); }

/** the balloon's sprite for its kind at u px per unit (Lt: its light) → { cv, w, h (px), ox, oy (its rigging point: the foot's centre),
 *  anchors: [[x, y]…] (px — the ropes' ends on it) } */
const DESIGN_W = { turkey: 6.6, pumpkin: 5.6, acorn: 4.6, cider: 5.0 };   // (the art is drawn in its first size's units — scaled to the balloon's real size)
function paintBalloon(kind, u0, Lt, seed) {
  const B = BALLOONS[kind] || BALLOONS.turkey, u = u0 * B.w / (DESIGN_W[kind] || B.w), W = Math.ceil(B.w * 1.25 * u0), H = Math.ceil(B.h * 1.2 * u0), cv = mk(W, H), x = safeCtx(cv);
  const ox = W / 2, oy = H - 0.08 * u, P = (a, b) => [ox + a * u, oy - b * u], r = rngFrom(seed);
  if (!x) return { cv, w: W, h: H, ox, oy, anchors: [] };
  let anchors = [];
  if (kind === 'turkey') {
    // the TAIL FAN behind: three rings of broad rounded feathers (dark russet → orange → gold), each with its quill stripe
    const [tx, ty] = P(-1.0, 3.6), rings = [[3.0, [138, 52, 30], 13], [2.4, [214, 108, 34], 11], [1.8, [236, 176, 58], 9]];
    for (const [R, col, n] of rings) for (let k = 0; k < n; k++) {
      const a = Math.PI * (1.05 + 0.9 * k / (n - 1)), fx = tx + Math.cos(a) * R * u * 0.62, fy = ty + Math.sin(a) * R * u * 0.62;
      puff(x, Lt, fx, fy, R * u * 0.2, R * u * 0.42, a + Math.PI / 2, col.map(v => v * (0.92 + 0.16 * r())), { seams: 0, gloss: 0.6 });
      x.strokeStyle = rgb(lit(Lt, col.map(v => v * 0.6), [0, 0, -1], 0), 0.6); x.lineWidth = Math.max(0.6, u * 0.05); x.beginPath(); x.moveTo(tx + Math.cos(a) * R * u * 0.25, ty + Math.sin(a) * R * u * 0.25); x.lineTo(fx + Math.cos(a) * R * u * 0.3, fy + Math.sin(a) * R * u * 0.3); x.stroke();
    }
    // the BODY (plump) + its breast, the WING with its scalloped feathers
    const [bx, by] = P(0.2, 2.1);
    puff(x, Lt, bx, by, 2.1 * u, 1.85 * u, 0, [134, 78, 42], { seams: 5 });
    shade(x, bx + 1.1 * u, by - 0.9 * u, 0.9 * u, 0.7 * u, 0.22);
    puff(x, Lt, bx + 1.0 * u, by + 0.15 * u, 1.05 * u, 1.35 * u, -0.2, [168, 104, 58], { seams: 0, gloss: 0.8 });
    puff(x, Lt, bx - 0.4 * u, by + 0.1 * u, 1.25 * u, 0.95 * u, 0.25, [110, 62, 34], { seams: 0, gloss: 0.6 });
    for (let k = 0; k < 4; k++) puff(x, Lt, bx - 0.9 * u + k * 0.38 * u, by + 0.75 * u - k * 0.05 * u, 0.36 * u, 0.5 * u, 0.3, [92 + k * 8, 52, 30], { seams: 0, gloss: 0.4 });
    // the NECK + HEAD (forward, up), the beak, the red snood + wattle, a friendly eye
    const [hx, hy] = P(1.85, 3.9);
    puff(x, Lt, hx - 0.25 * u, hy + 0.7 * u, 0.5 * u, 0.9 * u, 0.3, [150, 92, 54], { seams: 0 });
    puff(x, Lt, hx, hy, 0.72 * u, 0.68 * u, 0, [176, 112, 66], { seams: 2 });
    x.fillStyle = rgb(lit(Lt, [246, 196, 60], [0.6, 0.3, -0.7], 0.3)); x.beginPath(); x.moveTo(hx + 0.6 * u, hy - 0.08 * u); x.lineTo(hx + 1.15 * u, hy + 0.12 * u); x.lineTo(hx + 0.6 * u, hy + 0.3 * u); x.closePath(); x.fill();
    puff(x, Lt, hx + 0.55 * u, hy + 0.75 * u, 0.22 * u, 0.48 * u, -0.15, [206, 40, 40], { seams: 0 });
    x.fillStyle = 'rgb(250,250,246)'; x.beginPath(); x.ellipse(hx + 0.22 * u, hy - 0.18 * u, 0.2 * u, 0.24 * u, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgb(20,16,14)'; x.beginPath(); x.arc(hx + 0.28 * u, hy - 0.14 * u, 0.11 * u, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(hx + 0.31 * u, hy - 0.19 * u, 0.04 * u, 0, TAU); x.fill();
    // the feet tucked under (orange)
    for (const fx of [-0.3, 0.7]) puff(x, Lt, bx + fx * u, by + 1.85 * u, 0.22 * u, 0.28 * u, 0, [236, 140, 40], { seams: 0 });
    anchors = [[-1.6, 0.6], [-0.7, 0.3], [0.4, 0.2], [1.3, 0.4], [-1.1, 0.5], [0.9, 0.3]];
  } else if (kind === 'pumpkin') {
    const [cx, cy] = P(0, 2.4), R = 2.5 * u, n = 8;
    // (a ROUND pumpkin: the ribs drawn back → front — the outer ones shorter (the sphere turning away), each its own lobe; a squat silhouette)
    const order = Array.from({ length: n }, (_, k) => k).sort((p, q) => Math.abs(q - (n - 1) / 2) - Math.abs(p - (n - 1) / 2));
    for (const k of order) { const a = -Math.PI / 2 + (k + 0.5) / n * Math.PI, sx = Math.sin(a), w = Math.cos(a); puff(x, Lt, cx + sx * R * 0.8, cy + (1 - w) * R * 0.04, R * (0.2 + 0.26 * w), R * (0.6 + 0.26 * w), 0, [236, 124, 30].map(v => v * (0.8 + 0.2 * w)), { seams: 0, gloss: 0.4 + 0.6 * w }); }
    puff(x, Lt, cx, cy, R * 0.4, R * 0.86, 0, [244, 136, 36], { seams: 0 });
    // the stem + a curling vine + a leaf
    x.fillStyle = rgb(lit(Lt, [88, 110, 50], [0.3, 0.5, -0.8], 0.1)); x.beginPath(); x.moveTo(cx - 0.22 * u, cy - R * 0.82); x.quadraticCurveTo(cx - 0.1 * u, cy - R * 1.12, cx + 0.3 * u, cy - R * 1.2); x.lineTo(cx + 0.38 * u, cy - R * 1.08); x.quadraticCurveTo(cx + 0.16 * u, cy - R * 1.0, cx + 0.22 * u, cy - R * 0.82); x.closePath(); x.fill();
    x.strokeStyle = rgb(lit(Lt, [70, 120, 50], [0, 0.4, -1], 0)); x.lineWidth = Math.max(0.8, 0.12 * u); x.beginPath(); for (let k = 0; k <= 30; k++) { const a = k / 30 * TAU * 1.4, rr = u * (0.15 + 0.4 * k / 30); x.lineTo(cx + 0.35 * u + k / 30 * 1.2 * u + Math.cos(a) * rr * 0.5, cy - R * 0.95 + Math.sin(a) * rr * 0.4); } x.stroke();
    puff(x, Lt, cx - 0.9 * u, cy - R * 0.9, 0.7 * u, 0.32 * u, -0.4, [74, 128, 56], { seams: 0 });
    anchors = [[-1.8, 0.7], [-1.0, 0.2], [0, 0.05], [1.0, 0.2], [1.8, 0.7], [-0.5, 0.1]];
  } else if (kind === 'acorn') {
    const [cx, cy] = P(0, 2.0);
    puff(x, Lt, cx, cy, 1.85 * u, 2.0 * u, 0, [196, 140, 62], { seams: 6 });
    // the cap: a broad dome of scales (rows of little rounded scales) with its rolled rim, the stem
    const capY = cy - 1.25 * u;
    puff(x, Lt, cx, capY, 2.15 * u, 1.15 * u, 0, [112, 74, 42], { seams: 0 });
    for (let row = 0; row < 4; row++) for (let k = 0; k < 7 + row; k++) { const sx = cx + (k - (6 + row) / 2) * 0.55 * u * (1 - row * 0.12), sy = capY - 0.2 * u - row * 0.3 * u; x.strokeStyle = rgb(lit(Lt, [70, 44, 24], [0, 0.4, -1], 0), 0.7); x.lineWidth = Math.max(0.5, 0.05 * u); x.beginPath(); x.arc(sx, sy, 0.24 * u, 0.2, Math.PI - 0.2); x.stroke(); }
    puff(x, Lt, cx, capY + 0.75 * u, 2.1 * u, 0.32 * u, 0, [132, 90, 52], { seams: 0 });
    x.fillStyle = rgb(lit(Lt, [96, 64, 36], [0.3, 0.5, -0.8], 0)); x.fillRect(cx - 0.14 * u, capY - 1.5 * u, 0.28 * u, 0.5 * u);
    anchors = [[-1.4, 0.7], [-0.5, 0.15], [0.5, 0.15], [1.4, 0.7], [0, 0.05]];
  } else {
    // THE CIDER MUG: a deep red mug with a cream band, its handle, amber cider at the brim, a cinnamon stick + an apple slice, the steam
    const [cx, cy] = P(-0.2, 1.8), mw = 1.7 * u, mh = 1.8 * u;
    const body = lit(Lt, [176, 40, 36], [0, 0.15, -1], 0.1), hi = lit(Lt, [230, 90, 80], [-0.5, 0.4, -0.7], 0.3), lo = lit(Lt, [96, 20, 18], [0.6, 0, -0.6], 0);
    puff(x, Lt, cx + mw * 1.05, cy, 0.62 * u, 0.85 * u, 0, [160, 34, 30], { seams: 0 });
    x.fillStyle = 'rgba(0,0,0,0)';
    const g = x.createLinearGradient(cx - mw, 0, cx + mw, 0); g.addColorStop(0, rgb(lo)); g.addColorStop(0.3, rgb(hi)); g.addColorStop(0.65, rgb(body)); g.addColorStop(1, rgb(lo));
    x.fillStyle = g; x.beginPath(); x.moveTo(cx - mw, cy - mh); x.quadraticCurveTo(cx - mw * 1.05, cy + mh * 0.7, cx - mw * 0.85, cy + mh); x.lineTo(cx + mw * 0.85, cy + mh); x.quadraticCurveTo(cx + mw * 1.05, cy + mh * 0.7, cx + mw, cy - mh); x.closePath(); x.fill();
    x.fillStyle = rgb(lit(Lt, [240, 226, 196], [0, 0.2, -1], 0.1)); x.fillRect(cx - mw * 0.98, cy - mh * 0.1, mw * 1.96, mh * 0.32);
    x.fillStyle = rgb(lit(Lt, [200, 120, 30], [0, 1, -0.2], 0.3)); x.beginPath(); x.ellipse(cx, cy - mh, mw, mh * 0.18, 0, 0, TAU); x.fill();
    x.strokeStyle = rgb(hi); x.lineWidth = Math.max(0.8, 0.1 * u); x.beginPath(); x.ellipse(cx, cy - mh, mw, mh * 0.18, 0, 0, TAU); x.stroke();
    x.fillStyle = rgb(lit(Lt, [126, 70, 40], [0.3, 0.6, -0.7], 0.1)); x.save(); x.translate(cx + 0.5 * u, cy - mh - 0.5 * u); x.rotate(0.35); x.fillRect(-0.15 * u, -0.9 * u, 0.3 * u, 1.4 * u); x.restore();
    puff(x, Lt, cx - 0.65 * u, cy - mh - 0.1 * u, 0.6 * u, 0.32 * u, -0.3, [236, 220, 170], { seams: 0 });
    x.fillStyle = rgb(lit(Lt, [190, 40, 34], [0, 0.4, -1], 0.2)); x.beginPath(); x.ellipse(cx - 0.65 * u, cy - mh - 0.28 * u, 0.62 * u, 0.12 * u, -0.3, Math.PI, 0); x.fill();
    for (let k = 0; k < 3; k++) puff(x, Lt, cx - 0.4 * u + k * 0.55 * u, cy - mh - 1.4 * u - k * 0.55 * u, 0.42 * u - k * 0.06 * u, 0.6 * u - k * 0.08 * u, k * 0.4, [244, 244, 240], { seams: 0, gloss: 0.6 });
    anchors = [[-1.4, 0.05], [-0.5, 0.0], [0.4, 0.0], [1.3, 0.05], [2.0, 1.0]];
  }
  return { cv, w: W, h: H, ox, oy, anchors: anchors.map(([a, b]) => [ox + a * u, oy - b * u]) };
}

export function createParade() {
  const cache = new Map(), stat = { balloons: 0, units: 0, floats: 0, ropes: 0 };
  const put = (k, v) => { cache.set(k, v); if (cache.size > 24) { const k0 = cache.keys().next().value; const o = cache.get(k0); if (o && o.cv) o.cv.width = o.cv.height = 0; cache.delete(k0); } return v; };
  /**
   * the parade's FAR-pass items now: env = { L, w (the window), units, x0 (the route's start), t (s abs), T, dark, dpr, wind (signed),
   * gust, fade, deps (holidayprops: paintPumpkin + col) } → [{ z, draw(c) }]
   */
  function items(env) {
    const { L, units, x0, t } = env, cam = L.cam, out = [], dpr = Math.min(2, env.dpr || 2);
    if (!units) return out;
    const x1 = (cam.hw ? cam.hw(PARADE.z) : 20) + 8;
    const lk = `${Math.round((env.dark || 0) * 10)}|${Math.round(((env.T && env.T.day) || 0) * 10)}|${Math.round(((env.T && env.T.gold) || 0) * 10)}`;
    stat.balloons = 0; stat.units = 0; stat.floats = 0; stat.ropes = 0;
    for (const u of unitsAt(units, t, x0 - 8, x1)) {
      stat.units++;
      if (u.kind === 'balloon') {
        const B = BALLOONS[u.balloon], zc = PARADE.z, s = cam.F / zc, key = `b|${u.balloon}|${Math.round(s * dpr * 4)}|${lk}`;
        let sp = cache.get(key);
        if (!sp) { const Lt = lightFor(env.T || { day: 1 }, { ...pieceCtx(L), lampK: env.dark || 0 }, u.mid, zc); sp = put(key, paintBalloon(u.balloon, s * dpr, Lt, 101 + u.balloon.length)); }
        const mo = balloonMotion(u, t, env.wind || 0, env.gust || 0), cx = u.mid + mo.drift, cy = B.lift + mo.bob;
        const ppl = unitPeople(u);
        out.push({ z: zc + 0.05, draw: c => {
          const fade = env.fade == null ? 1 : env.fade, [gx, gy] = project(cam, cx, 0, zc), [bx, by] = project(cam, cx, cy, zc);
          c.save(); c.globalAlpha = fade;
          // its shadow on the road (soft, a little behind it by day)
          const dayK = clamp01(((env.T && env.T.day) || 0) + ((env.T && env.T.gold) || 0));
          c.fillStyle = `rgba(20,18,30,${(0.22 + 0.12 * dayK).toFixed(3)})`; c.beginPath(); c.ellipse(gx + 0.6 * s, gy - 0.15 * s, B.w * 0.42 * s, B.w * 0.1 * s, 0, 0, TAU); c.fill();
          // the ropes: from each anchor on the balloon down to its handler's raised hand (a slight sag), drawn under the balloon
          const rot = mo.sway, cos = Math.cos(rot), sin = Math.sin(rot), toScr = ([ax, ay]) => { const dx = (ax - sp.ox) / dpr, dy = (ay - sp.oy) / dpr; return [bx + dx * cos - dy * sin, by + dx * sin + dy * cos]; };
          c.strokeStyle = 'rgba(226,218,196,0.85)'; c.lineWidth = Math.max(0.5, 0.035 * s);
          ppl.forEach((p, k) => { const hx = u.head + p.dx, [hpx, hpy] = project(cam, hx, 2.05, p.z), a = toScr(sp.anchors[k % sp.anchors.length]); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + hpx) / 2 + 0.3 * s, (a[1] + hpy) / 2 + 0.25 * s, hpx, hpy); c.stroke(); stat.ropes++; });
          // the balloon: swaying round its rigging point
          c.translate(bx, by); c.rotate(rot); c.drawImage(sp.cv, -sp.ox / dpr, -sp.oy / dpr, sp.w / dpr, sp.h / dpr);
          c.restore();
        } });
        stat.balloons++;
      } else if (u.kind === 'float') {
        // THE HARVEST FLOAT: a farm wagon (its plank sides, four spoked wheels) heaped with straw bales, pumpkins, mums + corn stalks
        const zc = PARADE.files[0] + 0.55, s = cam.F / zc, key = `f|${Math.round(s * dpr * 4)}|${lk}`;
        let sp = cache.get(key);
        if (!sp) {
          const pc = { x: 0, z: zc, seed: 4711, ext: [3.6, 3.2], shadow: 0.1, parts: [['stalks', 2.6, 0.32], ['bale', 1.6, 0.85], ['pumpkin', 'classic', 0.9, -0.9, -0.1, true], ['pumpkin', 'white', 0.7, 0.4, -0.15, true], ['mum', 'gold', 0.7, 1.4, -0.3], ['gourds', 0.5, -1.7, -0.3, false]] };
          const Lc = { ...L, cam: { ...cam, VPX: cam.VPX } };
          const Ltf = lightFor(env.T || { day: 1 }, { ...pieceCtx(L), lampK: env.dark || 0 }, u.mid, zc);
          sp = put(key, paintSpotPiece(Lc, pc, env.T, env.dark || 0, dpr, { paintPumpkin, col: () => c2 => lit(Ltf, c2, [0, 0.3, -1], 0.05) }));
        }
        out.push({ z: zc, draw: c => drawFloat(c, cam, u, zc, sp, env, t) });
        stat.floats++;
      }
    }
    return out;
  }
  function drawFloat(c, cam, u, zc, sp, env, t) {
    const fade = env.fade == null ? 1 : env.fade, cx = u.mid, s = cam.F / zc, len = u.len - 1.2;
    const P = (x, y) => project(cam, cx + x, y, zc), Lt = lightFor(env.T || { day: 1 }, { ...pieceCtx(env.L), lampK: env.dark || 0 }, cx, zc);
    c.save(); c.globalAlpha = fade;
    const [gx, gy] = P(0, 0); c.fillStyle = 'rgba(20,18,30,0.3)'; c.beginPath(); c.ellipse(gx, gy, len * 0.55 * s, 0.3 * s, 0, 0, TAU); c.fill();
    // the wagon bed: plank sides (lit wood), its rim
    const a = P(-len / 2, 0.55), b = P(len / 2, 1.35);
    c.fillStyle = rgb(lit(Lt, [140, 96, 56], [0, 0.1, -1], 0.05)); c.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
    c.strokeStyle = rgb(lit(Lt, [90, 60, 34], [0, 0, -1], 0), 0.8); c.lineWidth = Math.max(0.5, 0.04 * s);
    for (let k = 1; k < 4; k++) { const y = a[1] + (b[1] - a[1]) * k / 4; c.beginPath(); c.moveTo(a[0], y); c.lineTo(b[0], y); c.stroke(); }
    c.fillStyle = rgb(lit(Lt, [176, 126, 70], [0, 1, -0.2], 0.1)); c.fillRect(a[0] - 0.05 * s, b[1] - 0.08 * s, b[0] - a[0] + 0.1 * s, 0.1 * s);
    // the load on the bed (the harvest painter's sprite, its foot on the bed)
    if (sp) { const [lx, ly] = P(0, 1.35), [ox] = project(cam, 0, 0, zc); c.drawImage(sp.cv, sp.x - ox + lx, sp.y - gy + ly, sp.w, sp.h); }
    // four spoked wheels, turning as it rolls
    const roll = (t - u.t) * PARADE.v / 0.55;
    for (const wx of [-len / 2 + 0.7, len / 2 - 0.7]) {
      const [wx0, wy0] = P(wx, 0.55), R = 0.55 * s;
      c.strokeStyle = rgb(lit(Lt, [60, 44, 30], [0, 0, -1], 0)); c.lineWidth = Math.max(0.8, 0.09 * s); c.beginPath(); c.arc(wx0, wy0, R, 0, TAU); c.stroke();
      c.lineWidth = Math.max(0.4, 0.04 * s); for (let k = 0; k < 8; k++) { const an = roll + k * Math.PI / 4; c.beginPath(); c.moveTo(wx0, wy0); c.lineTo(wx0 + Math.cos(an) * R, wy0 + Math.sin(an) * R); c.stroke(); }
    }
    c.restore();
  }
  return { items, debug: () => ({ ...stat, sprites: cache.size }), destroy() { for (const v of cache.values()) if (v && v.cv) v.cv.width = v.cv.height = 0; cache.clear(); } };
}
