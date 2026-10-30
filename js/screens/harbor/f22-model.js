// CITY 2.0 — SKY-A: THE F-22 FROM A REAL MODEL: "F22 Raptor FREE" by NLM (CC BY 4.0; ☰ → CREDITS), baked OFFLINE by
// scripts/bake-model.mjs f22 (scripts/bake/f22.mjs) into assets/city/f22/: the jet in profile (nose → +x, seen a little from below, a hair
// toward its near side), gear UP, the boarding ladder off, the stencils softened away, gunmetal — at four BANKS (0 / 6 / 12 / 18°, its top
// turning to the viewer) in the city's three LIGHTS (day · golden · night: one sheet each). No three.js here. LAZY: fetched when a jet is
// due (jets.js#warm — the TR-3B's chase, the air show, the flyby, the skytypers), never at first paint; until it's in (or if it fails) the
// hand-drawn Raptor stands in. &f22=drawn = the hand-drawn one always (the A/B).
import { ctx2d } from '../../ui/canvas-safe.js';
const BASE = new URL('../../../assets/city/f22/', import.meta.url);
// (the nozzles' exit in the frame (px): the afterburner's root — the model's rearmost point is the stabilator's tip, behind it)
const NOZZLE = [30, 85];

let loading = null, model = null;
/** → Promise<{ meta, sheets: { day, golden, night } }> (decoded, uploaded once off-screen) */
export function loadF22Model() {
  if (loading) return loading;
  const img = name => new Promise((res, rej) => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i));
    i.onerror = () => rej(new Error(`f22 sprite ${name}`));
    i.src = new URL(name, BASE).href;
  });
  loading = (async () => {
    const r = await fetch(new URL('f22.json', BASE).href);
    if (!r.ok) throw new Error(`f22.json ${r.status}`);
    const meta = await r.json(), sheets = {};
    await Promise.all(meta.lights.map(async lt => {
      let im = await img(`f22-${lt}.webp`);
      if (typeof createImageBitmap === 'function') { try { im = await createImageBitmap(im); } catch { /* the image stands */ } }
      try { const cv = document.createElement('canvas'); cv.width = cv.height = 8; const x = ctx2d(cv); if (x) x.drawImage(im, 0, 0, 8, 8); cv.width = cv.height = 0; } catch { /* fine */ }
      sheets[lt] = im;
    }));
    model = { meta, sheets };
    return model;
  })();
  loading.catch(() => { /* the hand-drawn jet stays */ });
  return loading;
}
export const f22Ready = () => model;

/**
 * a jet sprite from the bake: len pt long (nozzle → nose), in the hour's light (look: day / golden / dark), banked roll° (0 … 18, its top
 * toward the viewer) at d px a pt → { cv, w, h, ox, oy } — the nozzle at (ox, oy) in the sprite, nose → +x (jets.js mirrors it). The
 * lights + the two nearest banks are BLENDED (a weighted average of the baked frames: never a pop as the hour moves or the bank changes).
 */
export function f22Sprite(len, look, roll, d, mk) {
  const M = model; if (!M) return null;
  const { meta, sheets } = M, k = len / (meta.lenPx - (NOZZLE[0] - meta.tail[0]));
  const W = meta.fw * k, H = meta.fh * k, cv = mk(W * d, H * d), x = ctx2d(cv);
  if (!x) return null;
  const n = Math.max(0, Math.min(1, look.dark)), g = Math.max(0, Math.min(1, look.golden || 0)) * (1 - n), dd = Math.max(0, 1 - n - g);
  const rs = meta.rolls, rr = Math.max(rs[0], Math.min(rs[rs.length - 1], roll || 0));
  let i0 = 0; while (i0 < rs.length - 2 && rr > rs[i0 + 1]) i0++;
  const f = rs.length > 1 ? (rr - rs[i0]) / (rs[i0 + 1] - rs[i0]) : 0;
  const parts = [];
  for (const [lt, w] of [['day', dd], ['golden', g], ['night', n]]) if (w > 0.002 && sheets[lt]) { if (1 - f > 0.002) parts.push([lt, i0, w * (1 - f)]); if (f > 0.002) parts.push([lt, i0 + 1, w * f]); }
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  let sum = 0;
  for (const [lt, fi, w] of parts) { sum += w; x.globalAlpha = w / sum; x.drawImage(sheets[lt], fi * meta.fw, 0, meta.fw, meta.fh, 0, 0, W * d, H * d); }
  x.globalAlpha = 1;
  return { cv, w: W, h: H, ox: NOZZLE[0] * k, oy: NOZZLE[1] * k, model: true };
}
