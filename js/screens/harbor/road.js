// CITY 2.0 — THE HARBOR: the waterside road (z 54–64) behind the promenade: the railing at the water's edge, the asphalt, the
// lane line, the curb; the two stop lights at the near curb; the bus and the cars. Part 1: the road baked, the signals in the
// stage layer (in front of the traffic), the traffic drawn every frame as placeholders at their places. Part 8 builds them.
import { project, groundY } from '../../core/harbor-layout.js';
import { box, rgb, shade, vehicle } from './shapes.js';

export function roadSteps(L, T) {
  const cam = L.cam, r = L.road, rail = L.rail;
  return [x => {
    const yRail = groundY(cam, r.z1), yCurb = groundY(cam, r.z0);
    x.fillStyle = rgb(T.road); x.fillRect(0, yRail, cam.W, yCurb - yRail + 1);
    // the lane line: dashes, shorter further away
    const [, yl] = project(cam, 0, 0, r.lane), s = cam.F / r.lane;
    x.fillStyle = rgb(T.lane, 0.8);
    for (let sx = -((cam.W / 2) % 26); sx < cam.W; sx += 26) x.fillRect(sx, yl - Math.max(0.4, s * 0.05), 13, Math.max(0.8, s * 0.1));
    // the railing on the water's edge: the rail, the balusters
    const [, yr] = project(cam, 0, rail.y, rail.z), sr = cam.F / rail.z;
    x.fillStyle = rgb(T.rail); x.fillRect(0, yr, cam.W, Math.max(1.2, sr * 0.1));
    for (let sx = 0; sx < cam.W; sx += 1.1 * sr) x.fillRect(sx, yr, 0.7, yRail - yr);
    // THE CROSSWALK (8a) between the two stop lights: wide white bars across the road, worn
    if (L.crosswalk) {
      const cw = L.crosswalk, n = 9;
      x.fillStyle = rgb(shade(T.lane, -0.05), 0.75);
      for (let i = 0; i < n; i++) {
        const z0 = cw.z0 + (cw.z1 - cw.z0) * i / n, z1 = z0 + (cw.z1 - cw.z0) / n * 0.55;
        const [a, ya] = project(cam, cw.x0, 0, z0), [b] = project(cam, cw.x1, 0, z0), [a2, yb] = project(cam, cw.x0, 0, z1), [b2] = project(cam, cw.x1, 0, z1);
        x.beginPath(); x.moveTo(a, ya); x.lineTo(b, ya); x.lineTo(b2, yb); x.lineTo(a2, yb); x.closePath(); x.fill();
      }
    }
    // the curb
    x.fillStyle = rgb(shade(T.prom, -0.25)); x.fillRect(0, yCurb - Math.max(1, cam.F * 0.22 / r.z0), cam.W, Math.max(1.5, cam.F * 0.22 / r.z0));
  }];
}

/** the stop lights (baked into the stage, in front of the traffic): pole, arm, a head 1.3× real with its three lamps */
export function signalSteps(L, T) {
  const cam = L.cam;
  return L.signals.map(sg => x => {
    box(x, cam, { x0: sg.x - 0.12, x1: sg.x + 0.12, z0: sg.z, z1: sg.z + 0.2, h: sg.h }, T.lamp, { top: false });
    // (8a: a 1920s pole-top signal — arm 0: the head sits on the pole; the old mast arm when sg.arm is set)
    const armL = sg.arm ?? 2.6, arm = armL ? armL + 0.6 : 0, hx = sg.x + sg.dir * armL;
    if (arm) {
      const [a, ya] = project(cam, Math.min(sg.x, sg.x + sg.dir * arm), sg.h - 0.1, sg.z), [b] = project(cam, Math.max(sg.x, sg.x + sg.dir * arm), sg.h, sg.z);
      x.fillStyle = rgb(T.lamp); x.fillRect(a, ya, b - a, Math.max(1, cam.F * 0.12 / sg.z));
    }
    const s = cam.F / sg.z, hw = s * 0.45 * 1.3, hh = s * 1.25 * 1.3;
    const [cx, cy] = project(cam, hx, sg.h - 0.1, sg.z);
    x.fillStyle = rgb(shade(T.lamp, -0.2)); x.beginPath(); x.roundRect(cx - hw / 2, cy, hw, hh, hw * 0.2); x.fill();
    for (let i = 0; i < 3; i++) { x.fillStyle = rgb([[120, 40, 40], [120, 100, 40], [40, 110, 60]][i]); x.beginPath(); x.arc(cx, cy + hh * (0.2 + i * 0.3), hw * 0.28, 0, Math.PI * 2); x.fill(); }
    sg.head = { x: cx, y: cy, w: hw, h: hh };
  });
}

/** the traffic: the bus (~110 pt) and the cars (~55 pt), far lane first. density (fs.density.road): a heavy event elsewhere
 *  thins the road to that share of its vehicles (the bus stays) */
export function drawTraffic(c, L, T, density = 1) {
  const cam = L.cam, night = T.night > 0.5;
  const cars = density >= 1 ? L.cars : L.cars.slice(0, Math.floor(L.cars.length * density));
  const vs = [{ ...L.bus, bus: true }, ...cars].sort((a, b) => b.z - a.z);
  for (const v of vs) {
    if (Math.abs(v.x) > cam.hw(v.z) + v.len) continue;
    vehicle(c, cam, v, v.bus ? T.bus : v.id === 'suv' ? shade(T.car, -0.3) : T.car, { bus: !!v.bus, win: night ? [255, 220, 160] : shade(T.glass, 0.2), cabin: v.bus ? 0 : 0.55 });
  }
}
