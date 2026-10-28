// CITY 2.0 — BNAME (Oct 28): THE CONSTRUCTION TOWER's CRANE FROM A REAL MODEL — "Crane" by J-Toastie (CC BY 3.0; ☰ → CREDITS), baked
// OFFLINE by scripts/bake-model.mjs crane into assets/city/crane/ (docs/harbor.md#bname). No three.js here:
//   TOP   the slewing part (the jib, the counter-jib + its weight, the cab, the tower head, the hook block) in 45 SLEW frames (±66° about
//         broadside, 3° a step) as DAY + NIGHT atlases — two neighbours cross-faded so the swing reads smooth, night blended over day
//         by the darkness; each frame's anchor (the mast's axis at the slewing line), the tower head's apex + the jib's tip (the RED
//         BEACONS stay code: tower.js, on the skyline's pulse)
//   MAST  a head strip + a seamless lattice TILE repeated down to the roofs in front (day | night columns)
// LAZY: fetched only while the crane is up (tower.js asks when st.crane), never at first paint; until it's in (or if it fails) the
// hand-drawn crane stands in. &crane=classic = the hand-drawn crane always.
import { ctx2d } from '../../ui/canvas-safe.js';
const BASE = new URL('../../../assets/city/crane/', import.meta.url);

let loading = null, model = null, failed = false;
/** whether the sprites were ever asked for (the tests: never while the crane is down) */
export const craneAsked = () => !!loading;
/** starts the load (once); → the model or null while loading / failed */
export function craneModel() {
  if (model || failed) return model;
  if (!loading) {
    const img = name => new Promise((res, rej) => {
      const i = new Image(); i.decoding = 'async';
      i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i));
      i.onerror = () => rej(new Error(`crane sprite ${name}`));
      i.src = new URL(name, BASE).href;
    });
    loading = (async () => {
      const r = await fetch(new URL('crane.json', BASE).href);
      if (!r.ok) throw new Error(`crane.json ${r.status}`);
      const meta = await r.json();
      let [day, night, mast] = await Promise.all([img('top-day.webp'), img('top-night.webp'), img('mast.webp')]);
      // decoded + uploaded before the first frame that draws them (as the UFO: no stutter when the crane appears)
      if (typeof createImageBitmap === 'function') { try { [day, night, mast] = await Promise.all([day, night, mast].map(i => createImageBitmap(i))); } catch { /* the images stand */ } }
      try { const cv = document.createElement('canvas'); cv.width = cv.height = 8; const x = ctx2d(cv); if (x) { x.drawImage(day, 0, 0, 8, 8); x.drawImage(night, 0, 0, 8, 8); x.drawImage(mast, 0, 0, 8, 8); } cv.width = cv.height = 0; } catch { /* fine */ }
      model = { ...meta, img: { day, night, mast } };   // (meta.mast is the strip's numbers: the images live apart)
      return model;
    })();
    loading.catch(() => { failed = true; });
  }
  return null;
}

const lerp = (a, b, u) => a + (b - a) * u;
/** the frame pair at a slew (°): [i, j, u] — j drawn over i at u */
export function slewFrames(top, deg) {
  const p = Math.max(0, Math.min(top.n - 1, (deg - top.slews[0]) / (top.slews[1] - top.slews[0])));
  const i = Math.floor(p), j = Math.min(top.n - 1, i + 1);
  return [i, j, p - i];
}

/**
 * THE CRANE drawn: (mx, ay) = the mast's axis at the slewing line (pt), J = pt per jib unit, deg = the slew, night 0..1, foot = where
 * the mast goes down to (pt; the roofs in front hide it). → { apex: [x, y], tip: [x, y] } (pt) for the beacons.
 */
export function drawCrane(c, M, { mx, ay, J, deg, night, foot }) {
  const T = M.top, k = J / T.px;   // (pt per baked px)
  const [i, j, u] = slewFrames(T, deg);
  const cell = n => [(n % T.cols) * T.fw, Math.floor(n / T.cols) * T.fh];
  const at = n => T.frames[n].a;
  // THE MAST first (behind the cab): the head strip, then the tile down to the foot
  const S = M.mast, sk = J / S.px, mw = S.fw * sk, x0 = mx - S.ax * sk;
  const mastLayer = (col, a) => {
    if (a <= 0.004) return;
    c.globalAlpha = a;
    const sx = col * S.fw;
    c.drawImage(M.img.mast, sx, 0, S.fw, S.fh, x0, ay, mw, S.fh * sk);
    const th = S.tile * sk;
    for (let y = ay + S.fh * sk; y < foot && th > 0.5; y += th) c.drawImage(M.img.mast, sx, S.head, S.fw, S.tile, x0, y - 0.25, mw, th + 0.5);
  };
  const ga = c.globalAlpha;
  mastLayer(0, ga); mastLayer(1, ga * night);
  // THE TOP: frame i, frame j over it at u; night over day
  const topLayer = (img, a) => {
    for (const [n, w] of [[i, 1], [j, u]]) {
      if (w * a <= 0.004) continue;
      const [sx, sy] = cell(n), [axu, ayu] = at(n);
      c.globalAlpha = a * w;
      c.drawImage(img, sx, sy, T.fw, T.fh, mx - axu * J, ay - ayu * J, T.fw * k, T.fh * k);
    }
  };
  topLayer(M.img.day, ga); topLayer(M.img.night, ga * night);
  c.globalAlpha = ga;
  // the beacons' places (interpolated between the two frames)
  const pt = key => { const A = T.frames[i], B = T.frames[j]; return [mx + (lerp(A[key][0], B[key][0], u) - lerp(A.a[0], B.a[0], u)) * J, ay + (lerp(A[key][1], B[key][1], u) - lerp(A.a[1], B.a[1], u)) * J]; };
  return { apex: pt('apex'), tip: pt('tip') };
}
