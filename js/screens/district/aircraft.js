// LIVING CITY — air traffic and satellites (docs/title.md). Simulated: no flight data, no network.
//   draw(c, s)   in the sky layer, behind the clouds and the skyline (scene.js draws it right after the sun / moon):
//     PLANES     a few minutes apart, busiest in the evening, rare in the small hours (trafficRate); never level — each climbs
//                or descends a little on its own heading, at its own height and speed (high ones small, faint and slow; some
//                drift toward or away from us); planned through open sky only, never across the sign, the tagline or the
//                buttons (planPath). Night: just the lights — red on the left wingtip, green on the right (as seen for its
//                direction: navLights), a white strobe double-flashing about once a second, a slow red beacon; an APPROACH
//                plane, low and closer, adds its landing lights. Sunset / dawn: a small dark silhouette, its contrail catching
//                the light; day: a glint of sun and a thin white contrail, spreading and fading. Rain: fewer, lights only, faint;
//                fog: lights soft and blurred; no contrails in rain or under overcast.
//     SATELLITES only in the twilight hours (the sky dark, satellites still sunlit: the sun 6–18° below the horizon) on clear
//                nights: now and then a single faint point drifting across; on about one evening / morning in four or five
//                (the same nights for everyone) a STARLINK TRAIN — a straight line of evenly spaced, steady points — fading
//                into the earth's shadow partway across in the evening, out of it before dawn.
// Pure helpers (exported, tested in tests/aircraft.test.mjs): trafficRate, planPath, navLights, starlinkNight, satTwilight.
// Preview: &force=planes,approach,satellites,sat. Reduced effects: fewer planes, steady lights, contrails that don't spread.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

// ---------------------------------------------------------------- pure helpers
/** PURE: how busy the sky is at a local hour, 0..1: busiest in the evening, steady by day, quieter late, very rare 2–5 am. */
export function trafficRate(hr) {
  const g = (c, w) => Math.exp(-Math.pow((hr - c) / w, 2));
  if (hr >= 2 && hr < 5) return 0.04;
  const day = 0.62 * smooth(5, 8, hr) * (1 - smooth(22, 24.5, hr));
  const evening = 0.42 * g(19.5, 2.2);
  const late = hr < 2 ? 0.26 * (1 - hr / 2.2) : hr >= 22 ? 0.3 : 0;
  return clamp01(Math.max(day + evening, late, 0.04));
}

/** PURE: a straight path across the open sky, never level, never through a clear zone. Returns { x0, y0, x1, y1, dir, slope } or null.
 *  o: { W, top, bottom, zones: [{x, y, w, h}], rand, minSlope, maxSlope, margin } — the path runs from off one side to off the other. */
export function planPath({ W, top, bottom, zones = [], rand = Math.random, minSlope = 0.035, maxSlope = 0.16, margin = 16, dir = null, tries = 120 }) {
  for (let i = 0; i < tries; i++) {
    const d = dir || (rand() < 0.5 ? 1 : -1);
    const slope = (minSlope + rand() * (maxSlope - minSlope)) * (rand() < 0.5 ? 1 : -1);     // climbing or descending a little
    const x0 = d > 0 ? -60 : W + 60, x1 = d > 0 ? W + 60 : -60;
    const y0 = top + rand() * (bottom - top);
    const y1 = y0 + slope * (x1 - x0) * d * d;
    if (y1 < top || y1 > bottom) continue;
    let ok = true;
    for (let x = -20; x <= W + 20 && ok; x += 8) {
      const y = y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      for (const z of zones) if (x > z.x - margin && x < z.x + z.w + margin && y > z.y - margin && y < z.y + z.h + margin) { ok = false; break; }
    }
    if (ok) return { x0, y0, x1, y1, dir: d, slope: (y1 - y0) / (x1 - x0) };
  }
  return null;
}

/** PURE: which navigation light is the near wingtip (seen from the street, facing south: screen-right is west) for a plane
 *  heading screen-right (dir 1) or screen-left (−1). The near wingtip shows a little higher on screen, the far one lower
 *  (it's further off, nearer the horizon). Port (left) is red, starboard (right) green. */
export function navLights(dir) {
  // heading west (right): its left wing points south — away from us; heading east (left): its left wing points north, toward us
  return dir > 0 ? { near: 'green', far: 'red' } : { near: 'red', far: 'green' };
}

/** PURE: a Starlink evening / morning (about one in four or five, seeded by the local date: the same nights for everyone). */
export const starlinkNight = (y, m, d) => hash(`starlink:${y}-${m}-${d}`) % 100 < 22;

/** PURE: the twilight hours when satellites shine (the sky dark, the satellite still in sunlight): the sun 6–18° down.
 *  Returns 'evening' | 'morning' | null. */
export function satTwilight(sunEl, hour) {
  if (sunEl > -6 || sunEl < -18) return null;
  return hour >= 12 ? 'evening' : 'morning';
}

// ---------------------------------------------------------------- the module
export function createAircraft() {
  let W = 1, H = 1, HZ = 1, K = 1;
  let planes = [], nextPlane = 6 + Math.random() * 12, forcedAt = -1e9;      // the first one soon after the page opens
  let train = null, trainNight = '', sat = null, nextSat = 60 + Math.random() * 180;
  const glows = new Map();
  const glow = (r, g, b) => { const k = `${r},${g},${b}`; let c = glows.get(k); if (!c) { c = mk(32, 32); const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.28, `rgba(${k},0.45)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); glows.set(k, c); } return c; };
  const puffs = new Map();
  const puff = (r, g, b) => { const k = `${r},${g},${b}`; let c = puffs.get(k); if (!c) { c = mk(32, 32); const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${k},0.55)`); gr.addColorStop(0.6, `rgba(${k},0.18)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); puffs.set(k, c); } return c; };

  // the sign (+ the tagline under it) and the dock are off limits; the little round corner buttons are not (a plane passing
  // behind one is fine, and on a phone they sit in the only open strip of sky above the sign)
  const zonesOf = s => (s.clear || []).filter(z => z.y < HZ && z.w >= 70);
  const skyTop = s => Math.max(26, (s.safeTop || 0) + 14);

  // the open sky: the strip above the sign (on a phone the only sky the towers don't hide) and the band under the tagline
  function openSky(s) {
    const zones = zonesOf(s), wide = zones.filter(z => z.w > W * 0.5);
    const top = skyTop(s);
    const stripB = wide.length ? Math.min(...wide.map(z => z.y)) - 14 : HZ * 0.4;
    const lowT = wide.length ? Math.max(...wide.map(z => z.y + z.h)) + 14 : HZ * 0.45;
    return { zones, strip: stripB - top >= 22 ? [top, stripB] : null, low: [Math.min(lowT, HZ * 0.7), HZ * 0.74] };
  }
  function spawnPlane(s, approach) {
    const zones = zonesOf(s);
    // approach: low over the skyline (it may slip behind the towers), always descending; cruise: anywhere in the open sky
    // cruise: mostly the open strip above the sign (on a phone it's the only sky the towers don't hide), the angle fitted to
    // its height; otherwise anywhere open (a desktop has room; low ones slip behind the towers)
    const sky = openSky(s);
    // approach: low, just over the far towers' tops (its landing lights show over the roofs); cruise: mostly the strip
    // (the towers hide everything under the tagline on every screen: the approach comes down through the strip)
    const lowApproach = approach && !sky.strip;      // (low over the skyline only when there's no open strip: the towers hide it elsewhere)
    let top = lowApproach ? sky.low[0] : approach ? sky.strip[0] : skyTop(s), bottom = lowApproach ? Math.min(HZ * 0.78, sky.low[0] + HZ * 0.13) : approach ? sky.strip[1] : HZ * 0.74, minS = approach ? 0.05 : 0.035, maxS = approach ? 0.11 : 0.15;
    if (approach) maxS = Math.min(maxS, (bottom - top - 4) / (W + 120)), minS = Math.min(minS, maxS * 0.6);
    // (always on a portrait phone — the band under the tagline is hidden there; most of the time on a wide screen)
    if (!approach && sky.strip && (H > W || Math.random() < 0.8)) { [top, bottom] = sky.strip; maxS = Math.min(maxS, (bottom - top - 4) / (W + 120)); minS = Math.min(minS, maxS * 0.55); }
    const path = planPath({ W, top, bottom, zones, minSlope: Math.max(0.018, minS), maxSlope: Math.max(0.022, maxS) });
    if (!path) return null;
    if (approach && path.y1 < path.y0) { [path.y0, path.y1] = [path.y1, path.y0]; path.slope = (path.y1 - path.y0) / (path.x1 - path.x0); }   // descending toward the field
    const alt = approach ? 0 : 0.35 + Math.random() * 0.65;          // 1 = high and far
    const size = approach ? 1.75 : 1.35 - alt * 0.6;
    const drift = approach ? 1.15 : Math.random() < 0.35 ? (Math.random() < 0.5 ? 0.72 : 1.35) : 1;   // toward / away from us
    const dur = (approach ? 26 + Math.random() * 10 : 20 + alt * 20 + Math.random() * 4) * Math.max(0.8, W / 420) ** 0.35;
    return { ...path, approach, alt, s0: size, s1: size * drift, dur, k: 0, ph: Math.random() * 10, trail: [], trailAt: 0 };
  }

  // the plane as seen right now: night lights / a silhouette / a sunlit glint, and its contrail
  function drawPlane(c, s, p, look) {
    const { t } = s;
    const u = p.k;
    const x = p.x0 + (p.x1 - p.x0) * u, y = p.y0 + (p.y1 - p.y0) * u;
    const sc = (p.s0 + (p.s1 - p.s0) * u) * K;
    const edge = Math.min(1, u / 0.04, (1 - u) / 0.04);
    const L = s.L, { dark, golden, dawn, day, wet, fog, overcast } = look;
    // the contrail behind it (high planes, dry and not overcast, out of the night)
    const trailOn = !p.approach && p.alt > 0.4 && !wet && !overcast && dark < 0.8;
    const tc = golden + dawn > day ? (golden >= dawn ? [255, 196, 168] : [255, 190, 200]) : [255, 255, 255];
    if (trailOn && u < 1) {
      p.trailAt -= s.dt / 1000;
      if (p.trailAt <= 0) { p.trailAt = 0.08; p.trail.push({ x: x - p.dir * 5 * sc, y, age: 0 }); }
    }
    if (p.trail.length) {
      const life = 26, wind = Math.sin((L.windDir || 250) * Math.PI / 180) * Math.min(10, L.wind || 2) * 0.25;
      const vis = (1 - dark * 0.9) * (0.35 + 0.65 * (day + golden + dawn)) * (fog > 0.3 ? 0.4 : 1);
      p.trail = p.trail.filter(q => {
        q.age += s.dt / 1000; if (q.age > life) return false;
        if (s.motion) q.x += wind * s.dt / 1000;
        const form = smooth(0.15, 1.4, q.age);                         // it forms a little behind the plane
        const fade = Math.pow(1 - q.age / life, 1.4);
        const r = (1.3 + (s.motion ? q.age * 0.15 : 0)) * Math.max(0.85, sc) * (0.8 + 0.4 * (1 - p.alt));   // spreading as it ages
        c.globalAlpha = (day > 0.5 ? 0.42 : 0.32) * form * fade * vis;
        c.drawImage(puff(...tc), q.x - r * 2, q.y - r * 2, r * 4, r * 4);
        return true;
      });
      c.globalAlpha = 1;
    }
    if (overcast && dark < 0.5) return;                                // above the cloud by day: unseen
    // a body by day and at sunset: a small dark silhouette against a bright sky, catching a glint of sun
    const bodyA = clamp01(day + golden + dawn) * (1 - dark) * edge * (wet ? 0.3 : 1);
    if (bodyA > 0.02) {
      const len = Math.max(8, 10 * sc);
      c.save(); c.translate(x, y); c.rotate(Math.atan(p.slope)); c.scale(p.dir, 1);
      c.globalAlpha = bodyA * (day > 0.5 ? 0.85 : 0.9);
      c.fillStyle = day > 0.5 ? 'rgba(46,52,70,1)' : 'rgba(24,16,30,1)';
      c.beginPath(); c.ellipse(0, 0, len * 0.5, len * 0.07, 0, 0, TAU); c.fill();                         // fuselage
      c.beginPath(); c.moveTo(len * 0.06, 0); c.lineTo(-len * 0.16, -len * 0.3); c.lineTo(-len * 0.24, -len * 0.3); c.lineTo(-len * 0.08, 0); c.fill();   // far wing
      c.beginPath(); c.moveTo(len * 0.06, 0); c.lineTo(-len * 0.14, len * 0.22); c.lineTo(-len * 0.22, len * 0.22); c.lineTo(-len * 0.08, 0); c.fill();   // near wing
      c.beginPath(); c.moveTo(-len * 0.4, 0); c.lineTo(-len * 0.5, -len * 0.18); c.lineTo(-len * 0.44, 0); c.fill();                                          // tail
      c.restore();
      // the sun on its skin: a tiny bright glint (gold at sunset)
      const glint = (day * 0.9 + (golden + dawn) * 0.5) * edge * (0.75 + 0.25 * Math.sin(t * 0.8 + p.ph));
      if (glint > 0.03) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = glint * 0.8; const g = day > 0.5 ? [255, 252, 238] : [255, 214, 160]; c.drawImage(glow(...g), x - 3 * sc, y - 3 * sc, 6 * sc, 6 * sc); c.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = 1;
    }
    // the lights: after dusk (faint in rain, soft in fog)
    const lightA = clamp01((dark + golden * 0.35 + dawn * 0.3) * 1.2) * edge * (wet ? 0.65 : 1);
    if (lightA < 0.03) return;
    const blur = 1 + fog * 1.6, a0 = lightA * (1 - fog * 0.35);
    const nl = navLights(p.dir);
    const off = 1.3 * sc;                                              // the near wingtip a little higher, the far one lower
    // each light: a soft glow and a crisp bright core (a real plane's lights are small points, but sharp)
    const light = (lx, ly, col, a, r) => {
      r = Math.max(2.2, r);
      c.globalAlpha = a * 0.75; c.drawImage(glow(...col), lx - r * blur, ly - r * blur, r * 2 * blur, r * 2 * blur);
      const cr = Math.max(0.7, r * 0.22) * (fog > 0.3 ? 1.4 : 1);
      c.globalAlpha = a * (fog > 0.3 ? 0.6 : 1); c.fillStyle = `rgb(${Math.min(255, col[0] + 60)},${Math.min(255, col[1] + 60)},${Math.min(255, col[2] + 60)})`;
      c.beginPath(); c.arc(lx, ly, cr, 0, TAU); c.fill();
    };
    c.globalCompositeOperation = 'lighter';
    const RED = [255, 60, 70], GREEN = [70, 255, 150];
    light(x - p.dir * 0.4 * sc, y - off, nl.near === 'red' ? RED : GREEN, a0 * 0.9, 2.6 * sc);
    light(x + p.dir * 0.4 * sc, y + off * 0.8, nl.far === 'red' ? RED : GREEN, a0 * 0.75, 2.3 * sc);
    // the beacon: a slow red pulse on the body
    const bc = 0.5 + 0.5 * Math.sin((t + p.ph) * TAU / 1.25);
    light(x, y - 0.3 * sc, RED, a0 * (s.motion ? 0.25 + 0.6 * bc * bc : 0.5), 2 * sc);
    // the strobe: a white double flash about once a second (steady and dim with Reduced effects)
    const ph = (t + p.ph * 0.37) % 1.05;
    const strobe = s.motion ? (ph < 0.05 || (ph > 0.14 && ph < 0.19) ? 1 : 0) : 0.35;
    if (strobe > 0) { light(x - p.dir * 0.4 * sc, y - off, [255, 255, 255], a0 * strobe, 4.6 * sc); light(x + p.dir * 0.4 * sc, y + off * 0.8, [255, 255, 255], a0 * strobe * 0.85, 4 * sc); }
    // landing lights on approach: a bright white pair looking our way
    // landing lights on approach: an intense but compact white pair looking our way (a slight shimmer as it turns)
    if (p.approach) { const ll = 0.8 + 0.2 * Math.sin(t * 0.7 + p.ph); light(x + p.dir * 1.8 * sc, y + 0.3 * sc, [255, 248, 230], a0 * 0.75 * ll, 3.4 * sc); light(x + p.dir * 1.2 * sc, y + 0.5 * sc, [255, 255, 255], a0 * 0.9, 2.4 * sc); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- satellites
  function newTrain(s, mode) {
    const n = 20 + Math.floor(Math.random() * 21);
    const sky = openSky(s), band = sky.strip || [skyTop(s), HZ * 0.62];
    const maxS = Math.min(0.3, (band[1] - band[0] - 4) / (W + 120));
    const path = planPath({ W, top: band[0], bottom: band[1], zones: sky.zones, minSlope: Math.max(0.02, Math.min(0.08, maxS * 0.6)), maxSlope: Math.max(0.025, maxS), margin: 18 });
    if (!path) return null;
    const gap = (9 + Math.random() * 3) * K;
    const len = Math.hypot(path.x1 - path.x0, path.y1 - path.y0);
    const dur = 70 + Math.random() * 25;
    // in the evening the train runs into the earth's shadow partway across; before dawn it comes out of it
    return { ...path, n, gap, len, dur, k: 0, mode, shadow: 0.45 + Math.random() * 0.3 };
  }
  function newSat(s, mode) {
    const sky = openSky(s), band = sky.strip || [skyTop(s), HZ * 0.66];
    const maxS = Math.min(0.55, (band[1] - band[0] - 4) / (W + 120));
    const path = planPath({ W, top: band[0], bottom: band[1], zones: sky.zones, minSlope: Math.max(0.02, Math.min(0.04, maxS * 0.5)), maxSlope: Math.max(0.025, maxS), margin: 12 });
    if (!path) return null;
    return { ...path, dur: 80 + Math.random() * 40, k: 0, mode, shadow: 0.4 + Math.random() * 0.45, b: 0.45 + Math.random() * 0.25 };
  }
  function satAlpha(u, mode, shadow) {
    if (mode === 'evening') return 1 - smooth(shadow - 0.06, shadow + 0.06, u);
    if (mode === 'morning') return smooth(shadow - 0.06, shadow + 0.06, u);
    return 1;
  }
  function drawSatPoint(c, x, y, a, zones, moon) {
    if (moon && Math.hypot(x - moon.x, y - moon.y) < moon.r * 1.15) return;     // too small to see against the moon's disc
    for (const z of zones) if (x > z.x - 10 && x < z.x + z.w + 10 && y > z.y - 10 && y < z.y + z.h + 10) return;
    c.globalAlpha = a * 0.55; c.drawImage(glow(225, 234, 255), x - 3, y - 3, 6, 6);
    c.globalAlpha = a; c.fillStyle = '#f2f6ff'; c.fillRect(x - 0.55, y - 0.55, 1.1, 1.1);
  }

  return {
    resize(w, h, hz) { W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 390)); planes = []; train = null; sat = null; },
    draw(c, s) {
      const { L, dt, force, motion, tier } = s;
      const sec = dt / 1000;
      const hr = L.local ? L.local.h + L.local.mi / 60 : 20;
      const look = {
        dark: clamp01(L.w.night + L.w.late), golden: L.w.golden, dawn: L.w.dawn, day: L.w.day,
        wet: (L.rain || 0) > 0.1, fog: L.fog || 0, overcast: (L.cloud || 0) > 0.78,
      };
      // ---- planes
      const max = tier === 0 ? 1 : W > 800 ? 3 : 2;
      const rate = trafficRate(hr) * (look.wet ? 0.5 : 1) * (motion ? 1 : 0.6);
      nextPlane -= sec;
      const forcedPlane = (force.has('planes') || force.has('approach')) && performance.now() - forcedAt > 9000;
      const known = !!(s.clear && s.clear.length);            // never plan a path before the sign's place is known
      if ((forcedPlane || nextPlane <= 0) && planes.length < max && known) {
        const approach = force.has('approach') ? true : force.has('planes') ? false : Math.random() < 0.12 && hr > 6 && hr < 23.5;
        const p = spawnPlane(s, approach);
        if (p) {
          planes.push(p);
          if (forcedPlane) forcedAt = performance.now();
          // the next one: a few minutes on average at this hour, never bunched (at least 45 s apart)
          nextPlane = Math.max(30, (90 / Math.max(0.02, rate)) * (0.55 + Math.random() * 0.9));
        } else nextPlane = 5;                                   // no open path right now (a resize, the keyboard): try again soon
      } else if (nextPlane <= 0) nextPlane = 20;
      planes = planes.filter(p => {
        p.k += sec / p.dur;
        if (p.k < 1) drawPlane(c, s, p, look);
        else if (p.trail.length) { const q = p.k; p.k = 1; drawPlane(c, s, p, look); p.k = q; }
        return p.k < 1 || p.trail.length > 0;
      });
      // ---- satellites: twilight only, clear skies
      const mode = satTwilight(L.sun.el, hr);
      const clear = L.clear && (L.cloud || 0) < 0.45 && !look.wet;
      const night = L.local ? `${L.local.y}-${L.local.m}-${L.local.d}-${mode}` : '';
      if (known && !train && (force.has('satellites') && trainNight !== 'forced' || (mode && clear && L.local && starlinkNight(L.local.y, L.local.m, L.local.d) && trainNight !== night && Math.random() < sec / 40))) {
        train = newTrain(s, force.has('satellites') ? (mode || 'evening') : mode);
        trainNight = force.has('satellites') ? 'forced' : night;
      }
      if (known && !sat && ((force.has('sat') && Math.random() < sec / 2) || (mode && clear && (nextSat -= sec) <= 0))) {
        sat = newSat(s, force.has('sat') ? (mode || 'evening') : mode);
        nextSat = 300 + Math.random() * 300;
      }
      const zones = zonesOf(s);
      const satVis = clamp01(look.dark * 1.4);
      if (train || sat) c.globalCompositeOperation = 'lighter';
      if (train) {
        train.k += sec / train.dur;
        const span = train.n * train.gap;
        for (let i = 0; i < train.n; i++) {
          const along = train.k * (train.len + span) - i * train.gap;      // the leader first, each one a gap behind
          const u = along / train.len;
          if (u < 0 || u > 1) continue;
          const x = train.x0 + (train.x1 - train.x0) * u, y = train.y0 + (train.y1 - train.y0) * u;
          drawSatPoint(c, x, y, 0.78 * satVis * satAlpha(u, train.mode, train.shadow) * Math.min(1, u / 0.03, (1 - u) / 0.03), zones, s.moonAt);
        }
        if (train.k * (train.len + span) - span > train.len) train = null;
      }
      if (sat) {
        sat.k += sec / sat.dur;
        const u = sat.k;
        drawSatPoint(c, sat.x0 + (sat.x1 - sat.x0) * u, sat.y0 + (sat.y1 - sat.y0) * u, sat.b * satVis * satAlpha(u, sat.mode, sat.shadow) * Math.min(1, u / 0.04, (1 - u) / 0.04), zones, s.moonAt);
        if (sat.k >= 1) sat = null;
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    debug: () => ({ planes: planes.filter(p => p.k < 1).map(p => ({ x0: Math.round(p.x0), y0: Math.round(p.y0), x1: Math.round(p.x1), y1: Math.round(p.y1), slope: +p.slope.toFixed(3), dir: p.dir, approach: p.approach, alt: +p.alt.toFixed(2), k: +p.k.toFixed(2) })), trails: planes.reduce((n, p) => n + p.trail.length, 0), train: train ? { n: train.n, mode: train.mode } : null, sat: !!sat, nextPlane: Math.round(nextPlane) }),
  };
}
