// CITY 2.0 — THE ABDUCTION's CRAFT FROM A REAL MODEL: "UFO" by sebslom (CC BY 4.0; ☰ → CREDITS), baked OFFLINE by scripts/bake-model.mjs ufo (scripts/bake/ufo.mjs)
// into sprites in assets/city/ufo/ (docs/harbor/passes/the-ufo-bake.md). No three.js here: two turntable atlases (24 yaw frames over the
// model's 30° symmetry — 12 ports, 12 seams) at the camera's two real view angles on the craft (hi: hovering, ~6° below its rim's
// plane; lo: the approach + the exit, ~19°), each as a lit BODY + its LIGHTS (the model's own green ports, drawn 'lighter') + every
// port's place per frame (ufo.json) — the code dims, pulses + chases them. LAZY: fetched only when an abduction is due (legends.js#warm),
// never at first paint; until it's in (or if it fails) the hand-drawn saucer stands in. &ufo=classic = the hand-drawn saucer always.
import { ctx2d } from '../../ui/canvas-safe.js';
const BASE = new URL('../../../assets/city/ufo/', import.meta.url);
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

let loading = null;
/** the sprites + their meta → Promise<{ rows: { hi, lo } }> (each row: its meta + body + lights images, decoded) */
export function loadUfoModel() {
  if (loading) return loading;
  const img = name => new Promise((res, rej) => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i));
    i.onerror = () => rej(new Error(`ufo sprite ${name}`));
    i.src = new URL(name, BASE).href;
  });
  loading = (async () => {
    const r = await fetch(new URL('ufo.json', BASE).href);
    if (!r.ok) throw new Error(`ufo.json ${r.status}`);
    const meta = await r.json(), rows = {};
    await Promise.all(Object.keys(meta.rows).map(async id => {
      let [body, lights] = await Promise.all([img(`body-${id}.webp`), img(`lights-${id}.webp`)]);
      // 9c — THE FLIGHT's STUTTER: decoded + uploaded BEFORE the craft appears (a bitmap, then one draw off-screen), never on its first frame
      if (typeof createImageBitmap === 'function') { try { [body, lights] = await Promise.all([createImageBitmap(body), createImageBitmap(lights)]); } catch { /* the images stand */ } }
      try { const cv = document.createElement('canvas'); cv.width = cv.height = 8; const x = ctx2d(cv); if (x) { x.drawImage(body, 0, 0, 8, 8); x.drawImage(lights, 0, 0, 8, 8); } cv.width = cv.height = 0; } catch { /* fine */ }
      rows[id] = { ...meta.rows[id], body, lights };
    }));
    return { rows };
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

// THE VIEW ANGLE between the two bakes: the craft's height on screen grows with the angle we see it from (measured on the two bakes:
// ~0.46 + 0.89·sin(elev) hull radii), so each row is STRETCHED vertically to the true angle and the hand-off from one to the other
// happens at their midpoint, where both are stretched to the same silhouette (a plain cross-fade of the two showed the steep view's
// taller hull half-transparent)
const tall = e => 0.46 + 0.89 * Math.sin(e * Math.PI / 180);
/** which rows to draw at a view angle (°, from below): [[row, alpha, sy (its vertical stretch)], …] */
export function rowsAt(M, elev) {
  // (9c — THE STUTTER: the hand-off was ±0.3° — a snap between the two bakes in ~0.3 s of the approach; now ±2.5°, the outgoing view
  // drawn OPAQUE under the incoming one (never two half-transparent hulls), both stretched to the true angle: one continuous change)
  const hi = M.rows.hi, lo = M.rows.lo, mid = (hi.elev + lo.elev) / 2, w = smooth(mid - 2.5, mid + 2.5, elev);
  const sy = row => Math.max(0.8, Math.min(1.3, tall(elev) / tall(row.elev)));
  const out = [];
  if (w < 0.999) out.push([hi, 1, sy(hi)]);
  if (w > 0.001) out.push([lo, w, sy(lo)]);
  return out;
}
/** the frame of a row at a spin (degrees, any): its index (the turntable wraps on the model's symmetry) */
export const frameAt = (row, spin) => { const p = row.period, u = (((spin % p) + p) % p) / p; return Math.min(row.n - 1, Math.floor(u * row.n)); };

/** THE HULL: one row's frame, its rim's centre at (0, 0), the hull R wide each side, stretched sy tall (c already translated / scaled) */
export function drawBody(c, row, i, R, alpha = 1, sy = 1) {
  const k = R / row.rpx, fx = (i % row.cols) * row.fw, fy = Math.floor(i / row.cols) * row.fh;
  c.globalAlpha = alpha;
  c.drawImage(row.body, fx, fy, row.fw, row.fh, -row.ax * k, -row.ay * k * sy, row.fw * k, row.fh * k * sy);
}
/** THE LIGHTS' layer (the ports as the model lights them + the faint blue ring round the dome): 'lighter' at a level */
export function drawLights(c, row, i, R, alpha = 1, sy = 1) {
  if (alpha <= 0.004) return;
  const k = R / row.rpx, fx = (i % row.cols) * row.fw, fy = Math.floor(i / row.cols) * row.fh;
  c.globalAlpha = Math.min(1, alpha);
  c.drawImage(row.lights, fx, fy, row.fw, row.fh, -row.ax * k, -row.ay * k * sy, row.fw * k, row.fh * k * sy);
}
/** the ports of a frame: [{ x, y (hull radii from the rim's centre), az (the world angle round the rim, rad), size, lv }] */
export const portsAt = (row, i) => row.ports[i].map(([x, y, az, size, lv]) => ({ x, y, az, size, lv }));
