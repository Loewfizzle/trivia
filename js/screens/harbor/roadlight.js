// CITY 2.0 — THE HARBOR, PART 8a: THE IMPLIED ROAD's cars — never seen (no car behind the dock: the owner's rule), shown only as
// LIGHT: at night a car's headlights sweep across the near cobbles, gliding left or right with it; by day a soft passing shadow
// along the front walk. Its sound (the car-1920s-pass slot: harbor/sounds.js) starts with the pass, the light peaks when the car is
// nearest. The schedule is on the clock (core/harbor-promenade.js#roadPassAt: every phone the same, joins mid-way). Behind the
// owner's flag: &force=no-implied-road switches the road off (the setts then run to the screen's foot); &force=road-pass a car
// every ~13 s. THE RAID's hook (7b): wash({ col, k }) — a red / blue wash rolling up from the front.
import { project, groundY } from '../../core/harbor-layout.js';
import { roadPassAt, ROAD_PASS } from '../../core/harbor-promenade.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const sprite = (rgbStr, soft = 0.5) => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = safeCtx(c);
  if (x) { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgbStr},1)`); g.addColorStop(soft, `rgba(${rgbStr},0.45)`); g.addColorStop(1, `rgba(${rgbStr},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  return c;
};

export function createRoadLight() {
  let L = null, cam = null, beam = null, shade = null, washSp = null;
  let cur = null, center = 0, washCol = null, washK = 0;
  const playing = new Set();
  return {
    layout(l) { L = l; cam = l.cam; },
    /** the raid (7b): a coloured wash from the front ({ col: [r,g,b], k: 0..1 }; null clears) */
    wash(o) { washCol = o && o.col ? o.col : null; washK = o ? Math.max(0, Math.min(1, +o.k || 0)) : 0; },
    /**
     * f: { ms (the city's clock), now (performance.now), hour (local, for the busy-ness — a function of ms), night (the lamps'
     * darkness 0..1), day (0..1), motion, fade, on (the implied road is on), force (a pass every ~13 s), play(slot, o) → handle | null }
     */
    draw(c, f) {
      if (!L || !f.on || f.fade <= 0) return;
      const pass = roadPassAt(f.ms, f.hourAt, { force: f.force });
      if (pass && (!cur || cur.id !== pass.id)) {
        cur = pass; center = pass.t0 + ROAD_PASS.peak;
        // its sound: only when caught at its start (a pass already under way when the page opened shows its light, silently)
        if (f.play && f.ms - pass.t0 < 1500 && !playing.has(pass.id)) {
          const h = f.play('car-1920s-pass', { pan: 0, gain: pass.lane ? 0.8 : 1 });
          playing.add(pass.id); if (playing.size > 8) playing.delete(playing.values().next().value);
          if (h && h.peak) center = pass.t0 + h.peak * 1000;
        }
      }
      if (!pass) cur = null;
      // the wash (the raid's lights) first, under the car's own light
      if (washCol && washK > 0.01) {
        if (!washSp || washSp.key !== washCol.join()) { washSp = sprite(washCol.join(), 0.4); washSp.key = washCol.join(); }
        const W = cam.W, r = W * 0.9;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * washK * f.fade; c.drawImage(washSp, W / 2 - r, cam.H - r * 0.55, r * 2, r * 1.1); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      if (!cur) return;
      // the car's x (world) along the road just below the frame: nearest (x 0) at `center`, ~6 u/s (a 1920s cruise)
      const tt = (f.ms - center) / 1000, zc = L.edge ? L.edge.z - 4 : 31.5, span = cam.hw(zc) + 14;
      const carX = cur.dir * tt * (span * 2 / 9);
      if (Math.abs(carX) > span) return;
      const env = Math.max(0, 1 - Math.abs(carX) / span) ** 0.6;
      const P = (x, z) => project(cam, x, 0, z);
      // AT NIGHT: the headlights' light ahead of the car on the near cobbles (a long soft pool + a brighter core near the curb), the
      // curb's top catching it; warm 1920s incandescent
      if (f.night > 0.05) {
        if (!beam) beam = sprite('255,226,170', 0.35);
        const k = f.night * env * f.fade;
        c.globalCompositeOperation = 'lighter';
        for (const [dz, rx, rz, a] of [[4.2, 10, 5, 0.34], [2.2, 6, 2.6, 0.55], [0.9, 3.4, 1.1, 0.7]]) {
          const z = (L.edge ? L.edge.z : 35.6) + dz, [cx] = P(carX + cur.dir * 5, z), ya = groundY(cam, z + rz), yb = groundY(cam, z - rz), rw = cam.F * rx / z;
          c.globalAlpha = a * k; c.drawImage(beam, cx - rw, ya, rw * 2, yb - ya);
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // BY DAY: a soft shadow sliding along the front walk (the car in the sun just below the frame)
      if (f.day > 0.2) {
        if (!shade) shade = sprite('20,16,34', 0.55);
        const z = (L.edge ? L.edge.z : 35.6) + 0.9, [cx] = P(carX, z), rx = 3.4, ya = groundY(cam, z + 0.9), yb = groundY(cam, z - 0.9), rw = cam.F * rx / z;
        c.globalAlpha = 0.22 * f.day * env * f.fade; c.drawImage(shade, cx - rw, ya, rw * 2, yb - ya); c.globalAlpha = 1;
      }
    },
    debug: () => ({ pass: cur ? { id: cur.id, dir: cur.dir, center } : null, played: playing.size, wash: washK }),
    destroy() { for (const s of [beam, shade, washSp]) if (s) s.width = s.height = 0; beam = shade = washSp = null; },
  };
}
