// CITY 2.0 — THE HARBOR, PROM: THE STILL PIECES, LIVE + SHARP. The two benches (the water bench at the crabapple, turned to face the
// harbor; THE CAB STAND at the front curb, facing us) are drawn LIVE in the near pass, sorted by depth with the walkers — the water
// bench's leaning back in FRONT of its sitters (seen from behind: hats + shoulders over it), the cab stand's waiters in front of it —
// from small sprites at the phone's FULL device pixel ratio (3× on an iPhone; the city's own canvas is capped at 2×), re-drawn only when
// the light changes a step (the bake's tones, the lamps, the snow). Their cast shadows stay baked in the ground (stage.js).
import { drawBench, drawBenchBack, benchBoxAny } from './props.js';
import { pieceCtx } from '../../core/harbor-light.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const r2 = v => Math.round((v || 0) * 50) / 50;
const toneKey = T => (T ? [T.day, T.gold, T.night, T.lamps, T.sunDir, T.sunEl, T.ovc].map(r2).join(',') : '-');

export function createStill() {
  const cache = new Map();
  let drawn = 0;
  /** a bench's sprite for this light: { cv, box }; pw: the lamps' power (C4c — the TR-3B's drain + blackout: the lamp light painted
   *  into the sprite goes with the city's lamps, in the scene's steps) */
  function sprite(L, b, T, dpr, pw = 1) {
    const cam = L.cam, c0 = pieceCtx(L), cx = pw < 1 ? { ...c0, lampK: (c0.lampK || 0) * pw } : c0, key = `${b.x.toFixed(2)}|${b.z}|${b.face}|${dpr}|${cam.W}x${cam.H}|${toneKey(T)}|${r2(cx.lampK)}|${r2(cx.snow)}|${cx.season}`;
    const id = `${b.face}|${b.x.toFixed(2)}|${b.z}`;
    let e = cache.get(id);
    if (e && e.key === key) return e;
    const bx = benchBoxAny(cam, b), box = { x: Math.floor(bx.x - 3), y: Math.floor(bx.y - 3), w: Math.ceil(bx.w + 6), h: Math.ceil(bx.h + 6) };
    const cv = (e && e.cv) || document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(box.w * dpr)); cv.height = Math.max(1, Math.ceil(box.h * dpr));
    const x = safeCtx(cv);
    if (!x) return null;
    x.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    x.clearRect(box.x, box.y, box.w, box.h);
    (b.face === 'water' ? drawBenchBack : drawBench)(x, cam, b, T, cx);
    e = { key, cv, box }; cache.set(id, e); drawn++;
    return e;
  }
  return {
    /** the benches' sprites now (the crisp overlay's — scene.js#crispTick): [{ id, z (the depth a figure must be nearer than to stand in
     *  front), cv, box, key }] */
    sprites(L, T, dpr, pw = 1) {
      if (!L || !T) return [];
      return [L.bench, L.cabStand].filter(Boolean).map(b => { const e = sprite(L, b, T, Math.max(1, Math.min(3, dpr)), pw); return e ? { id: `still-${b.face}`, z: b.z + (b.face === 'water' ? -0.25 : 0.1), cv: e.cv, box: e.box, key: e.key } : null; }).filter(Boolean);
    },
    /** the near pass's still pieces → [{ z, draw(c) }] (people.js's extras); T: the bake's tones; dpr: the phone's own */
    items(L, T, { dpr = 2, fade = 1, pw = 1 } = {}) {
      if (!L || !T || !(fade > 0)) return [];
      const out = [];
      for (const b of [L.bench, L.cabStand]) {
        if (!b) continue;
        out.push({ z: b.z + (b.face === 'water' ? -0.25 : 0.1), still: b.face === 'water' ? 'water-bench' : 'cab-stand', draw: c => {
          const e = sprite(L, b, T, Math.max(1, Math.min(3, dpr)), pw);
          if (!e) return;
          c.save(); c.globalAlpha *= fade; c.drawImage(e.cv, e.box.x, e.box.y, e.box.w, e.box.h); c.restore();
        } });
      }
      return out;
    },
    debug: () => ({ sprites: [...cache.entries()].map(([id, e]) => ({ id, w: e.cv.width, h: e.cv.height, box: e.box })), drawn }),
    destroy() { for (const e of cache.values()) e.cv.width = e.cv.height = 0; cache.clear(); },
  };
}
