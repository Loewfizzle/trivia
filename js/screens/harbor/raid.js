// CITY 2.0 — THE HARBOR, PART 8b2: THE RAID, DRAWN (the plan: core/harbor-raid.js — PURE). The patrol cars themselves are THE VEHICLE
// KIT's 'police' on the back road (people.js#drawCar, + their roof BEACON: drawBeacon there, beaconOf here); the officer is a people visit
// (folk.js's 'flash' pose + gear.js's flashlight). This module lays THE LIGHT:
//   ground(c, R, env)   before the people's far pass: the red + blue wash pooled round each car on the WET ROAD (+ the beacon's streak
//                       mirrored in it), spilling over the promenade's back edge + the near water — a slow alternation (red ⇄ blue, never
//                       a strobe across a big area: the owner's rule), stronger the darker it is
//   facade(c, R, env, o) after the speakeasy: the wash up the speakeasy's SIDE WALL (the one facing the road), the SHADES snapped down over
//                       every window (raised one by one as the lights come back), the officer's FLASHLIGHT — a cone from his hand to a
//                       bright spot sweeping the dark windows
// Depth: the wash is light on surfaces (road, kerb, water, the side wall) — never in front of the promenade's people (drawn before their
// near pass); the beam starts at the officer at the kerb (z ≈ 54) and lands on the facade (z 44): behind everyone on the promenade.
import { project } from '../../core/harbor-layout.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = u => { const x = clamp01(u); return x * x * (3 - 2 * x); };
/** a beacon's lamps at t (s) for car n: { red, blue } 0..1 — each a quick DOUBLE flash, alternating (period 0.95 s) */
export function beaconOf(t, n = 0) {
  const p = (((t / 0.95 + n * 0.31) % 1) + 1) % 1;
  const pulse = (a, b) => (p >= a && p < b ? Math.sin(((p - a) / (b - a)) * Math.PI) : 0);
  // (a dim ember between the flashes: the lens always reads red + blue)
  return { red: Math.max(0.22, pulse(0, 0.11), pulse(0.17, 0.28)), blue: Math.max(0.22, pulse(0.5, 0.61), pulse(0.67, 0.78)) };
}
/** the WASH's colour balance at t for car n (smooth: red ⇄ blue over ~1.1 s, the sum steady) → { r, b } */
export function washOf(t, n = 0) { const s = 0.5 + 0.5 * Math.sin((t / 1.1 + n * 0.29) * TAU); return { r: s, b: 1 - s }; }

export function createRaid() {
  let L = null, spr = null;
  const sprite = col => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const x = safeCtx(cv); if (x) { const g = x.createRadialGradient(48, 48, 0, 48, 48, 48); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.35, `rgba(${col},0.5)`); g.addColorStop(0.7, `rgba(${col},0.14)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 96, 96); }
    return cv;
  };
  const sprites = () => (spr || (spr = { r: sprite('255,46,60'), b: sprite('56,104,255'), w: sprite('255,246,226') }));
  // a soft pool (an ellipse) of the wash at screen (x, y): rx × ry, the two colours by w, alpha a
  const pool = (c, x, y, rx, ry, w, a) => {
    const S = sprites();
    if (w.r * a > 0.004) { c.globalAlpha = w.r * a; c.drawImage(S.r, x - rx, y - ry, rx * 2, ry * 2); }
    if (w.b * a > 0.004) { c.globalAlpha = w.b * a; c.drawImage(S.b, x - rx, y - ry, rx * 2, ry * 2); }
  };
  function layout(l) { L = l; }

  /** the wash on the ground: R = core/harbor-raid.js#raidAt now; env { t, dark (0..1), wet (0..1), fade } */
  function ground(c, R, env) {
    if (!L || !R || !R.cars.length) return;
    const cam = L.cam, t = env.t || 0, dk = clamp01(env.dark == null ? 1 : env.dark), k0 = (0.22 + 0.78 * dk) * (env.fade == null ? 1 : env.fade), wet = clamp01(env.wet == null ? 0.6 : env.wet);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const car of R.cars) {
      const w = washOf(t, car.n), b = beaconOf(t, car.n), [gx, gy] = project(cam, car.x, 0, car.z), sp = cam.F / car.z;
      if (gx < -12 * sp || gx > cam.W + 12 * sp) continue;
      // the road round the car (wide + flat), the promenade's back edge toward us, the near water behind
      // (8b2 review 1: it must read as POLICE at a glance on a phone — a strong pool round each car, its glow up the car's own flanks)
      pool(c, gx, gy, 8.5 * sp, 1.9 * sp, w, 1.0 * k0);
      pool(c, gx, gy + 0.3 * sp, 3.6 * sp, 0.9 * sp, w, 0.55 * k0);
      pool(c, gx, gy - 1.1 * sp, 4.5 * sp, 1.6 * sp, w, 0.32 * k0);
      { const z = 51.5, s2 = cam.F / z, [px, py] = project(cam, car.x - 0.6, 0, z); pool(c, px, py, 6.5 * s2, 1.5 * s2, w, 0.42 * k0); }
      { const z = 74, s3 = cam.F / z, [wx, wy] = project(cam, car.x + 1, 0, z); pool(c, wx, wy, 13 * s3, 2.8 * s3, w, 0.5 * k0); }
      // the far quay's facades across the water catch it faintly
      { const z = 112, s4 = cam.F / z, [fx, fy] = project(cam, car.x + 2, 3.5, z); pool(c, fx, fy, 18 * s4, 6 * s4, w, 0.22 * k0); }
      // THE WET ROAD: the beacon's own colour mirrored in the asphalt below the car (a narrow streak toward us, its flashes)
      const bx = gx + car.dir * 0.15 * sp, bh = 2.2 * sp, S = sprites();
      for (const [n, col] of [['red', S.r], ['blue', S.b]]) { const v = b[n]; if (v < 0.03) continue; c.globalAlpha = v * k0 * (0.25 + 0.4 * wet); c.drawImage(col, bx - 0.35 * sp, gy - 0.1 * sp, 0.7 * sp, bh * 0.9); }
    }
    c.restore();
  }

  /**
   * the facade: R (raidAt), env { t, dark, fade }, o { side (the speakeasy's side wall polygon on screen | null), windows ([{ id, rect }]),
   * officer ({ hand, dir, H } | null — people.js#officer) }
   */
  function facade(c, R, env, o = {}) {
    if (!L || !R) return;
    const cam = L.cam, t = env.t || 0, dk = clamp01(env.dark == null ? 1 : env.dark), fade = env.fade == null ? 1 : env.fade;
    // THE WASH UP THE SIDE WALL (the face toward the road): the nearest car's colours, stronger the closer it is to the corner
    if (o.side && R.cars.length && L.speakeasy) {
      const sx = L.speakeasy.x1;
      c.save(); c.beginPath(); o.side.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
      c.globalCompositeOperation = 'lighter';
      for (const car of R.cars) {
        const d = car.x - car.len / 2 - sx; if (d > 18 || d < -2) continue;
        const near = (1 - smooth(d / 18)) * (0.25 + 0.75 * dk) * fade, z = Math.min(L.speakeasy.z1 - 0.5, car.z), [wx, wy] = project(cam, sx, 2.6, z), sp = cam.F / z;
        pool(c, wx, wy, 7.5 * sp, 5.5 * sp, washOf(t, car.n), 0.6 * near);
      }
      c.restore();
    }
    // THE SHADES: snapped down over every window the instant the cars show; each raised as its light comes back
    const wins = o.windows || [];
    if (wins.length && (R.shades > 0.01 || R.dark)) {
      c.save();
      wins.forEach((wn, i) => {
        const lv = R.win ? R.win(i) : null, down = R.dark ? R.shades : lv === 0 ? 1 : 0;
        if (down < 0.01) return;
        const r = wn.rect, h = r.h * down;
        c.globalAlpha = 0.94 * fade;
        const g = c.createLinearGradient(0, r.y, 0, r.y + h); g.addColorStop(0, 'rgb(44,32,30)'); g.addColorStop(1, 'rgb(62,46,40)');
        c.fillStyle = g; c.fillRect(r.x, r.y, r.w, h);
        // its creases + the hem bar with its pull
        c.globalAlpha = 0.5 * fade; c.fillStyle = 'rgb(24,16,16)';
        for (let k = 1; k < 3; k++) if (r.h * k / 3 < h) c.fillRect(r.x, r.y + r.h * k / 3, r.w, Math.max(0.5, r.h * 0.012));
        c.globalAlpha = 0.9 * fade; c.fillRect(r.x, r.y + h - Math.max(0.8, r.h * 0.04), r.w, Math.max(0.8, r.h * 0.04));
      });
      c.restore();
    }
    // THE FLASHLIGHT: a cone from the officer's hand to a bright spot sweeping across the dark windows
    if (R.beam > 0.01 && o.officer && wins.length) {
      const [hx, hy] = o.officer.hand, xs = wins.map(w => w.rect.x + w.rect.w / 2), ys = wins.map(w => w.rect.y + w.rect.h / 2);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), yTop = Math.min(...ys), yBot = Math.max(...ys);
      const u = (R.sweep + 1) / 2, tx = x0 + (x1 - x0) * u, ty = yTop + (yBot - yTop) * (0.5 + 0.45 * Math.sin(t * 0.9));
      const sp = cam.F / (L.speakeasy ? L.speakeasy.z0 : 44), rs = 0.75 * sp, dx = tx - hx, dy = ty - hy, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
      const a = R.beam * fade * (0.55 + 0.45 * dk);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(hx, hy, tx, ty); g.addColorStop(0, `rgba(255,246,222,${(0.32 * a).toFixed(3)})`); g.addColorStop(1, `rgba(255,246,222,${(0.07 * a).toFixed(3)})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(hx + nx * 0.6, hy + ny * 0.6); c.lineTo(tx + nx * rs, ty + ny * rs); c.lineTo(tx - nx * rs, ty - ny * rs); c.lineTo(hx - nx * 0.6, hy - ny * 0.6); c.closePath(); c.fill();
      const S = sprites();
      c.globalAlpha = 0.75 * a; c.drawImage(S.w, tx - rs * 1.6, ty - rs * 1.35, rs * 3.2, rs * 2.7);
      c.globalAlpha = 0.9 * a; c.drawImage(S.w, tx - rs * 0.7, ty - rs * 0.6, rs * 1.4, rs * 1.2);
      c.globalAlpha = a; c.drawImage(S.w, hx - 3, hy - 3, 6, 6);
      c.restore();
    }
  }
  return { layout, ground, facade, destroy() { spr = null; } };
}
