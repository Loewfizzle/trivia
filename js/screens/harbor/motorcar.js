// CITY 2.0 — THE HARBOR, FP2: THE MOTORCAR — the implied road's car, SEEN while the dock rests (the owner: "so the sound finally has a
// car"). POL4 (the owner: "too CARTOONISH … a VARIETY"): the car itself is THE VEHICLE KIT's now (vehicles.js — a Packard, a Model A,
// a Checker cab, a roadster, a coupe; the street's own cycle, never the same twice in a row: vehicleFor(n, 'street')); this file keeps
// what the STREET does to it: its light + its shadow. Its own light: at night the headlamps' pool on the cobbles ahead + glints along
// the rails, the tail lamp's red on the ground; by day its soft contact shadow + the sun's cast shadow; the street lamps' light on its
// body (the kit's 'lamp' look, by how near a lamp it rolls). Only the wheels turn live (the kit); the body rides the cobbles.
// Where + when: roadlight.js (core/harbor-promenade.js#carAt — the implied road's pass on the city's clock); only while the dock rests.
import { groundY } from '../../core/harbor-layout.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { sunShadow } from '../../core/harbor-light.js';
import { createVehicles, MODELS, anatomy } from './vehicles.js';

const CAR_W = 2.1;                                     // (the cars' width on the ground — the footprint of the shadow, world units)
const glowSprite = (col, soft) => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = safeCtx(c);
  if (x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(soft, `rgba(${col},0.4)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  return c;
};

export function createMotorcar() {
  const kit = createVehicles();
  let glowR = null, pool = null, dark = null, last = null;
  return {
    /**
     * the car at its place: car (core/harbor-promenade.js#carAt), o: { cam, T (the bake's tones: the sun's side + height), k (its
     * visibility × the city's fade), night (the lamps' ramp), lampAt (x → 0..1: the street lamps' light on it), vehicle ({ model, paint,
     * trade, rumble } — vehicles.js#vehicleFor), underglow ([r,g,b] | null — a party night's), dpr, t (s), motion, wet, rails }
     */
    draw(c, car, o) {
      const v = o.vehicle || { model: 'modelA', paint: 0 }, id = MODELS[v.model] ? v.model : 'modelA', M = MODELS[id], A = anatomy(id);
      const cam = o.cam, sp = cam.F / car.z, gy = groundY(cam, car.z), cx = cam.VPX + cam.F * car.x / car.z, dir = car.dir;
      const T = o.T || {}, day = (T.day || 0) + (T.gold || 0), night = o.night || 0;
      const lamps = o.lamps == null ? 1 : Math.max(0, Math.min(1, o.lamps));   // (Oct 25: the TR-3B's blackout — its lamps + the street's light on it die with the city)
      const look = night > 0.5 ? 'night' : (T.gold || 0) > (T.day || 0) ? 'golden' : 'day';
      const len = M.len * sp, x0 = cx - len / 2, x1 = cx + len / 2;
      last = { x: cx, y: gy, w: len, h: M.h * sp, z: car.z, dir, look, top: gy - M.h * sp, model: id };
      if (x1 < -40 || x0 > cam.W + 40 || o.k <= 0.004) return;
      c.save(); c.globalAlpha = o.k;
      // ---- on the ground first: the shadows (by day the sun's, always a soft contact shade under the body)
      if (!dark) dark = glowSprite('14,12,26', 0.55);
      const sh = day > 0.15 ? sunShadow(T, M.h) : null;
      if (sh) {
        // the sun's cast shadow: the car's footprint swept along the sun (a box's shadow — the hull of the footprint + its shifted copy)
        const P = (wx, wz) => [cam.VPX + cam.F * wx / wz, groundY(cam, wz)], a = car.x - M.len / 2 + 0.25, b = car.x + M.len / 2 - 0.15, z0 = car.z + 0.1, z1 = car.z + CAR_W - 0.1;
        const dx = sh.dx * 0.85, dz = sh.dz * 0.85;
        const pts = dx >= 0 ? [[a, z0], [b, z0], [b + dx, z0 + dz], [b + dx, z1 + dz], [a + dx, z1 + dz], [a, z1]] : [[b, z0], [a, z0], [a + dx, z0 + dz], [a + dx, z1 + dz], [b + dx, z1 + dz], [b, z1]];
        c.beginPath(); pts.forEach(([wx, wz], i) => { const [px, py] = P(wx, wz); if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath();
        c.fillStyle = 'rgba(24,18,40,1)'; c.globalAlpha = o.k * Math.min(0.6, sh.a * 1.5); c.fill();
        c.strokeStyle = 'rgba(24,18,40,1)'; c.lineJoin = 'round'; c.lineWidth = 2.4; c.globalAlpha = o.k * Math.min(0.3, sh.a * 0.7); c.stroke();
      }
      { const ya = groundY(cam, car.z + CAR_W), yb = gy + 1.5; c.globalAlpha = o.k * (0.5 - 0.15 * night); c.drawImage(dark, x0 + len * 0.02, ya, len * 0.96, yb - ya);
        const ux0 = cx + (A.wheels[0] - M.len / 2 - M.r) * sp, ux1 = cx + (A.wheels[1] - M.len / 2 + M.r) * sp, uy = gy - 0.42 * sp;
        const ug = c.createLinearGradient(0, uy, 0, gy + 0.6); ug.addColorStop(0, 'rgba(14,12,26,0.25)'); ug.addColorStop(1, 'rgba(14,12,26,0.85)');
        c.globalAlpha = o.k * (0.75 - 0.25 * night); c.fillStyle = ug; c.fillRect(Math.min(ux0, ux1), uy, Math.abs(ux1 - ux0), gy + 0.6 - uy); }
      // ---- at night: the headlamps' pool on the cobbles ahead + the glints along the rails, the tail lamp's red on the ground
      const hk = night * o.k * lamps;
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
      // ---- the car (the kit): its wheels turning by the distance rolled, the body riding the cobbles, the street lamps' light on it,
      // its lamps lit at night, a party night's underglow
      const bob = o.motion ? 0.012 * sp * Math.sin(o.t * 17.3) + 0.006 * sp * Math.sin(o.t * 29.1 + 1) : 0;
      const lampK = Math.max(0, Math.min(1, o.lampAt ? o.lampAt(car.x) * night * lamps : 0));
      c.globalAlpha = 1;
      kit.draw(c, { id, paint: v.paint || 0, trade: v.trade || 0, rumble: !!v.rumble, x: cx, y: gy, sp, dir, dist: car.dist != null ? car.dist : car.x * dir, speed: car.speed, look, lampK, lit: night * lamps, underglow: o.underglow || null, glowK: night * lamps, dpr: o.dpr, bob, k: o.k, sign: v.sign != null ? v.sign : null, door: v.door || 0 });   // (PROM: the cab stand's taxi — its TAXI lamp + its door)
      c.restore();
      last.drawn = true;
    },
    /** the last draw's box (screen pt) — the tests read it */
    debug: () => last,
    reset() { last = null; },
    destroy() { kit.destroy(); for (const s of [glowR, pool, dark]) if (s) s.width = s.height = 0; glowR = pool = dark = null; },
  };
}
