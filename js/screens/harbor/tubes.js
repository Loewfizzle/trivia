// CITY 2.0 — THE HARBOR, Part 3: THE TUBE — one crafted neon system for every sign, outline and tube logo in the city (canvas).
// Built like the NEON logo (ui/logo.js) and a sign shop's glass: the tube BODY, a NEAR + a WIDE glow (true gaussian glows:
// shadowBlur, baked once), a white-hot CORE, a thin glass HIGHLIGHT, ELECTRODE caps at the open ends, mounting CLIPS. The light
// is UNEVEN like real neon (core/harbor-neon.js#tubeLight: hotter on the bends, dimmer near the electrodes). Unlit (by day, or
// a dark tube at night) it is clear / tinted glass catching the sun, with its highlight, its caps and a soft shadow on the wall.
// Lit tubes are drawn into SPRITES (small canvases sized to the tube + its glow) once, then drawn every frame additively with
// their power (the boot-up, the flicker, the moments).
import { tubeLight } from '../../core/harbor-neon.js';

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const WHITE = [255, 255, 255];

/** resample a polyline every `step` pt (keeps the corners) → [[x, y], …] */
export function resample(pts, step = 1.2) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

/** a tube ready to draw: { pts, lv (light per point), closed, ends: [start?, end?] (electrodes at the open ends) } */
export function tube(pts, closed = false, w = 1, ends = [!closed, !closed]) {
  const p = resample(pts, Math.max(0.8, w * 0.9));
  const lv = tubeLight(p, closed || !(ends[0] || ends[1]), w);
  return { pts: p, lv, closed, ends };
}

/** the bounding box of tubes */
export function bbox(tubes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const t of tubes) for (const [x, y] of t.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
}

function path(x, t, dx = 0, dy = 0) {
  x.moveTo(t.pts[0][0] + dx, t.pts[0][1] + dy);
  for (let i = 1; i < t.pts.length; i++) x.lineTo(t.pts[i][0] + dx, t.pts[i][1] + dy);
}

/**
 * The LIT tube (into a sprite's context; screen pt, the context already scaled by dpr). col [r,g,b]; o: { w (tube width),
 * glow (pt), a (strength 0..1), dpr }. Wide glow → near glow → body (uneven) → core (uneven) → highlight.
 */
export function drawLit(x, tubes, col, o) {
  const w = o.w, a = o.a ?? 1, dpr = o.dpr || 1, glow = o.glow ?? w * 4, soft = o.soft || 0;   // (soft: far tubes — less white core, no sharp highlight)
  x.save();
  x.lineCap = 'round'; x.lineJoin = 'round';
  // the light on the surroundings: a wide, soft glow, then a near one (gaussian: shadowBlur is in device pixels)
  x.beginPath(); for (const t of tubes) path(x, t);
  x.shadowColor = rgba(col, 0.75 * a); x.shadowBlur = glow * 2.2 * dpr;
  x.strokeStyle = rgba(col, 0.16 * a); x.lineWidth = w * 2.4; x.stroke();
  x.shadowColor = rgba(col, 0.95 * a); x.shadowBlur = glow * 0.75 * dpr;
  x.strokeStyle = rgba(col, 0.5 * a); x.lineWidth = w * 1.5; x.stroke();
  x.shadowBlur = 0; x.shadowColor = 'rgba(0,0,0,0)';
  // the body: the gas glowing in the glass, segment by segment — brighter where the light is hotter
  const body = mix(col, WHITE, 0.18 * (1 - soft)), dim = col.map(v => v * 0.72);
  x.lineCap = 'round';
  for (const t of tubes) {
    for (let i = 1; i < t.pts.length; i++) {
      const lv = (t.lv[i - 1] + t.lv[i]) / 2, c = lv < 1 ? mix(dim, body, (lv - 0.43) / 0.57) : mix(body, WHITE, Math.min(0.6, (lv - 1) * 1.6));
      x.strokeStyle = rgba(c, a); x.lineWidth = w;
      x.beginPath(); x.moveTo(t.pts[i - 1][0], t.pts[i - 1][1]); x.lineTo(t.pts[i][0], t.pts[i][1]); x.stroke();
    }
  }
  // the white-hot core
  for (const t of tubes) {
    for (let i = 1; i < t.pts.length; i++) {
      const lv = (t.lv[i - 1] + t.lv[i]) / 2;
      x.strokeStyle = rgba(mix(col, WHITE, Math.min(0.95, 0.62 + (lv - 0.86) * 0.9) * (1 - soft * 0.6)), a * Math.min(1, 0.55 + lv * 0.45) * (1 - soft * 0.45)); x.lineWidth = Math.max(0.3, w * 0.4 * (1 - soft * 0.25));
      x.beginPath(); x.moveTo(t.pts[i - 1][0], t.pts[i - 1][1]); x.lineTo(t.pts[i][0], t.pts[i][1]); x.stroke();
    }
  }
  // the glass highlight: a fine bright line along the upper-left of the tube
  if (soft < 0.5) { x.beginPath(); for (const t of tubes) path(x, t, -w * 0.22, -w * 0.26); x.strokeStyle = rgba(WHITE, 0.32 * a * (1 - soft * 1.6)); x.lineWidth = Math.max(0.25, w * 0.16); x.stroke(); }
  x.restore();
}

/**
 * The UNLIT tube (baked with the facades / the sign's housing): by day clear glass with a tint of its colour, the sun's
 * highlight and a soft shadow on the wall; at night dark glass. T: the tones (day / gold / night, sunDir). o: { w, shadow }
 */
export function drawGlass(x, tubes, col, T, o) {
  const w = o.w, day = Math.min(1, (T.day || 0) + 0.8 * (T.gold || 0)), night = T.night || 0, sd = T.sunDir || 0;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // the shadow on the wall (day), away from the sun and down
  if (day > 0.05 && o.shadow !== false && !o.faint) {
    x.beginPath(); for (const t of tubes) path(x, t, (sd > 0 ? -1 : sd < 0 ? 1 : 0.3) * w * 0.7, w * 0.9);
    x.strokeStyle = `rgba(22,16,34,${0.22 * day})`; x.lineWidth = w * 1.2; x.stroke();
  }
  // the glass: day — pale and clear, a hint of its colour (the coating), the gas tint inside; night — dark glass
  x.beginPath(); for (const t of tubes) path(x, t);
  // (faint: a building's outline — up close by day only a glint of clear glass along its edges, never a painted line)
  const fk = o.faint ? 0.45 : 1;
  const glassDay = mix([214, 222, 232], col, o.faint ? 0.1 : 0.26), glassNight = mix(col, [26, 20, 40], 0.78);
  x.strokeStyle = rgba(mix(glassNight, glassDay, day), (0.55 + 0.25 * day) * fk); x.lineWidth = w * (o.faint ? 0.8 : 1); x.stroke();
  if (day > 0.05) {
    x.strokeStyle = rgba(mix(col, WHITE, 0.25), 0.3 * day * fk * fk); x.lineWidth = w * 0.42; x.stroke();
    // the sun's highlight on the glass (toward the sun), white
    x.beginPath(); for (const t of tubes) path(x, t, (sd > 0 ? 1 : -1) * w * 0.24, -w * 0.24);
    x.strokeStyle = rgba(WHITE, (0.55 + 0.3 * (T.gold || 0)) * day); x.lineWidth = Math.max(0.25, w * 0.2); x.stroke();
  } else if (night > 0.5) {
    x.beginPath(); for (const t of tubes) path(x, t, -w * 0.2, -w * 0.24);
    x.strokeStyle = rgba(WHITE, 0.08 * night); x.lineWidth = Math.max(0.25, w * 0.16); x.stroke();
  }
  x.restore();
  caps(x, tubes, w, day);
  if (o.clips !== false) clips(x, tubes, w, o.clipEvery || 26);
}

/** the electrode caps at a tube's open ends (dark housings, a glint by day) */
export function caps(x, tubes, w, day = 0) {
  x.save();
  for (const t of tubes) {
    const n = t.pts.length;
    for (const [end, i, j] of [[t.ends[0], 0, 1], [t.ends[1], n - 1, n - 2]]) {
      if (!end || n < 2) continue;
      const [ax, ay] = t.pts[i], [bx, by] = t.pts[j], ang = Math.atan2(ay - by, ax - bx);
      x.save(); x.translate(ax, ay); x.rotate(ang);
      x.fillStyle = '#17121e'; x.beginPath(); x.roundRect(-w * 0.3, -w * 0.62, w * 1.25, w * 1.24, w * 0.3); x.fill();
      if (day > 0.1) { x.fillStyle = `rgba(255,255,255,${0.35 * day})`; x.fillRect(0, -w * 0.5, w * 0.7, w * 0.18); }
      x.restore();
    }
  }
  x.restore();
}
/** mounting clips: little dark standoffs across the tube, every `every` pt along it */
export function clips(x, tubes, w, every = 26) {
  x.save(); x.fillStyle = 'rgba(20,14,24,0.85)';
  for (const t of tubes) {
    let acc = every * 0.5;
    for (let i = 1; i < t.pts.length; i++) {
      const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], d = Math.hypot(bx - ax, by - ay);
      acc += d;
      if (acc < every) continue;
      acc = 0;
      const ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang), ny = Math.cos(ang), hl = w * 0.95, hw = Math.max(0.25, w * 0.22);
      x.beginPath(); x.moveTo(bx - nx * hl - Math.cos(ang) * hw, by - ny * hl - Math.sin(ang) * hw); x.lineTo(bx + nx * hl - Math.cos(ang) * hw, by + ny * hl - Math.sin(ang) * hw);
      x.lineTo(bx + nx * hl + Math.cos(ang) * hw, by + ny * hl + Math.sin(ang) * hw); x.lineTo(bx - nx * hl + Math.cos(ang) * hw, by - ny * hl + Math.sin(ang) * hw); x.fill();
    }
  }
  x.restore();
}

/**
 * A sprite: a small canvas holding something drawn in screen pt around a box. → { c, x, y, w, h } (pt; draw with
 * drawImage(c, x, y, w, h)). draw(ctx) draws in screen pt (the context is translated + scaled).
 */
export function sprite(box, pad, dpr, draw) {
  const x0 = Math.floor(box.x0 - pad), y0 = Math.floor(box.y0 - pad), w = Math.ceil(box.x1 + pad) - x0, h = Math.ceil(box.y1 + pad) - y0;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
  draw(x);
  return { c, x: x0, y: y0, w, h, mb: c.width * c.height * 4 / 1e6 };
}
export const free = s => { if (s && s.c) { s.c.width = 0; s.c.height = 0; } };
export { mix, rgba };
