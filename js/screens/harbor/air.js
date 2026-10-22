// CITY 2.0 — THE HARBOR, Part 6a: THE AIR — the airliners, the satellites, the helicopter (docs/harbor.md#part-6a).
// The district's behaviour (district/aircraft.js: the traffic by the hour, paths that climb or descend a little, approaches
// with landing lights, contrails only high + dry + by day, the Starlink evenings + lone satellites at twilight) on the Harbor's
// SKY LANES (sky-high: over the sign; sky-low: under the tagline, behind the taller towers) — never across the NEON sign or the
// tagline, never in a lane a sky event holds; and new ARTWORK:
//   AIRLINERS   a crafted sprite per plane (its size, its slope, its heading, the hour's light): a tapered fuselage with the
//               belly in shade and the sun on its crown, swept wings + engines under them, the tail in one of three liveries,
//               a cheatline, the cockpit glass, a row of windows (lit at night on a big one); at night a dark shape whose TAIL is
//               lit by its logo lights, NAV LIGHTS (red port, green starboard), a white tail light, red beacons top + belly,
//               double-flash white STROBES, and on approach the LANDING LIGHTS with a glare reaching ahead
//   CONTRAILS   two engine trails that merge, widen, drift on the real wind and fade — a ring of ≤ 60 samples drawn in six
//               batched strokes: the cost is CAPPED (Part 2's Known issue: the district's puffs piled up to +2.3 ms)
//   SATELLITES  the district's twilight points + Starlink trains (behaviour unchanged)
//   HELICOPTER  a crafted chopper (glass canopy, a two-tone body, skids, a tail rotor) with a motion-blurred rotor disc; it
//               comes in, hovers over the harbor and goes; at night a SEARCHLIGHT beam to the water + its pool, a red beacon,
//               nav lights. fly(route) is the hook for Part 10's party yacht landing.
import { trafficRate, planPath, navLights, starlinkNight, satTwilight } from '../district/aircraft.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const LIVERIES = [{ tail: [28, 52, 118], line: [214, 170, 70] }, { tail: [176, 34, 48], line: [176, 34, 48] }, { tail: [16, 110, 122], line: [240, 196, 80] }];
const CAP = 60;                                        // contrail samples per plane (the cost's cap)

/** the hour's light on an aircraft: { day, golden, dawn, dark, warm (0..1 golden side), haze } from the look */
export function airLook(L) {
  return { dark: clamp01(L.w.night + L.w.late), golden: L.w.golden, dawn: L.w.dawn, day: L.w.day, wet: (L.rain || 0) > 0.1, fog: L.fog || 0, overcast: (L.cloud || 0) > 0.78 };
}

// ------------------------------------------------------------------ the airliner sprite
/** an airliner (nose toward +x before the flip), len pt long, in the hour's light → { cv, ox, oy, w, h, pts } (pts: its light
 *  positions in the sprite's frame: wing tips, tail, beacons, landing lights — screen offsets from its centre) */
function airliner(len, look, dir, slope, lv, dpr, big) {
  const W = len * 1.25, H = len * 0.72, d = Math.min(3, dpr * (big ? 1 : 1.25));
  const cv = mk(W * d, H * d), x = cv.getContext('2d');
  const ang = Math.atan(slope);
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H / 2) * d); x.rotate(ang); x.scale(dir * len, len);
  const day = clamp01(look.day + look.golden * 0.9 + look.dawn * 0.8) * (1 - look.dark), gold = clamp01((look.golden + look.dawn) * 1.4) * (1 - look.dark);
  const night = look.dark;
  // the paint in this light: silver-white by day, warm on its crown at sunset, a dark shape at night (the city's glow under it)
  const crown = mix(mix([40, 38, 58], [246, 248, 252], day), [255, 214, 176], gold * 0.7), belly = mix(mix([18, 16, 30], [150, 160, 182], day), [118, 92, 120], gold * 0.6);
  const shade = mix(crown, belly, 0.55), wingC = mix(mix([26, 24, 40], [196, 202, 216], day), [210, 160, 150], gold * 0.5), farC = mix(wingC, belly, 0.45);
  const tailC = mix(mix([20, 18, 32], lv.tail, day), [lv.tail[0] * 0.8 + 50, lv.tail[1] * 0.6 + 30, lv.tail[2] * 0.6 + 30].map(Math.round), gold * 0.4);
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  // far wing, far stabiliser, far engine (behind the body)
  poly([[0.1, -0.02], [-0.13, -0.2], [-0.205, -0.208], [-0.06, -0.02]], rgb(farC));
  poly([[-0.35, -0.025], [-0.45, -0.1], [-0.495, -0.1], [-0.43, -0.015]], rgb(farC));
  x.fillStyle = rgb(mix(farC, belly, 0.4)); x.beginPath(); x.ellipse(0.03, -0.05, 0.06, 0.02, 0, 0, TAU); x.fill();
  // the tail fin (the livery), its leading edge lit
  poly([[-0.3, -0.035], [-0.45, -0.24], [-0.525, -0.24], [-0.5, -0.03]], rgb(tailC));
  x.strokeStyle = rgb(mix(tailC, [255, 255, 255], 0.35 * day)); x.lineWidth = 0.012; x.beginPath(); x.moveTo(-0.3, -0.035); x.lineTo(-0.45, -0.24); x.stroke();
  // the fuselage: a tapered tube — the nose rounded, the tail cone sweeping up; the sun on its crown, the belly in shade
  x.beginPath();
  x.moveTo(0.5, 0.004);
  x.bezierCurveTo(0.5, -0.03, 0.47, -0.044, 0.41, -0.045);
  x.lineTo(-0.33, -0.045);
  x.bezierCurveTo(-0.42, -0.044, -0.48, -0.04, -0.53, -0.032);
  x.lineTo(-0.53, -0.018);
  x.bezierCurveTo(-0.45, -0.005, -0.33, 0.035, -0.2, 0.038);
  x.lineTo(0.38, 0.038);
  x.bezierCurveTo(0.46, 0.036, 0.5, 0.025, 0.5, 0.004);
  x.closePath();
  const g = x.createLinearGradient(0, -0.045, 0, 0.04);
  g.addColorStop(0, rgb(crown)); g.addColorStop(0.45, rgb(mix(crown, shade, 0.4))); g.addColorStop(1, rgb(belly));
  x.fillStyle = g; x.fill();
  // the cheatline, the cockpit glass, the windows (lit at night on a big plane)
  x.fillStyle = rgb(mix(lv.line, [30, 26, 40], night * 0.8), 0.9); x.fillRect(-0.36, 0.008, 0.78, 0.01);
  x.fillStyle = rgb(night > 0.5 ? [10, 12, 22] : [34, 44, 66]); x.beginPath(); x.moveTo(0.47, -0.02); x.lineTo(0.43, -0.03); x.lineTo(0.415, -0.012); x.lineTo(0.46, -0.008); x.closePath(); x.fill();
  if (len >= 18) {
    const lit = night > 0.4 && big;
    x.fillStyle = lit ? 'rgba(255,226,170,0.95)' : rgb(mix([60, 70, 92], [24, 22, 36], night), 0.75);
    const r = 0.0065;
    for (let px = 0.36; px > -0.3; px -= 0.032) { x.beginPath(); x.arc(px, -0.016, r, 0, TAU); x.fill(); }
  }
  // the near stabiliser, the near engine + its pylon, the near wing (in front of the body)
  poly([[-0.35, 0.012], [-0.465, 0.105], [-0.51, 0.105], [-0.43, 0.02]], rgb(wingC));
  poly([[0.11, 0.02], [-0.11, 0.255], [-0.2, 0.262], [-0.06, 0.03]], rgb(wingC));
  x.strokeStyle = rgb(mix(wingC, [255, 255, 255], 0.5 * day + 0.2 * gold)); x.lineWidth = 0.01; x.beginPath(); x.moveTo(0.11, 0.02); x.lineTo(-0.11, 0.255); x.stroke();
  x.fillStyle = rgb(mix(wingC, belly, 0.35)); x.fillRect(0.0, 0.06, 0.03, 0.04);
  const ng = x.createLinearGradient(0, 0.075, 0, 0.125); ng.addColorStop(0, rgb(mix(crown, wingC, 0.3))); ng.addColorStop(1, rgb(belly));
  x.fillStyle = ng; x.beginPath(); x.ellipse(0.02, 0.1, 0.075, 0.024, 0, 0, TAU); x.fill();
  x.fillStyle = rgb([12, 12, 20], 0.8); x.beginPath(); x.ellipse(0.093, 0.1, 0.006, 0.019, 0, 0, TAU); x.fill();
  // at night: the logo lights on the tail (a soft wash on the fin) — the premium detail of a night plane
  if (night > 0.3) { const tg = x.createRadialGradient(-0.46, -0.13, 0, -0.46, -0.13, 0.13); tg.addColorStop(0, `rgba(240,244,255,${0.55 * night})`); tg.addColorStop(1, 'rgba(240,244,255,0)'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = tg; x.fillRect(-0.6, -0.3, 0.3, 0.3); x.globalCompositeOperation = 'source-over'; }
  // the light positions (screen offsets from the centre, with the slope + heading applied)
  const P = (u, v) => { const ux = u * len * dir, vy = v * len; return [ux * Math.cos(ang) - vy * Math.sin(ang), ux * Math.sin(ang) + vy * Math.cos(ang)]; };
  return { cv, w: W, h: H, pts: { near: P(-0.2, 0.262), far: P(-0.205, -0.208), tail: P(-0.53, -0.025), top: P(-0.02, -0.048), belly: P(0.05, 0.04), land: P(0.06, 0.045), land2: P(0.3, 0.035), nose: P(0.5, 0) } };
}

// ------------------------------------------------------------------ the helicopter sprite (no rotor: that is drawn live)
function chopper(len, look, dir, dpr) {
  const W = len * 1.2, H = len * 0.75, d = Math.min(3, dpr * 1.25);
  const cv = mk(W * d, H * d), x = cv.getContext('2d');
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H * 0.55) * d); x.scale(dir * len, len);
  const day = clamp01(look.day + look.golden * 0.9 + look.dawn * 0.8) * (1 - look.dark), gold = clamp01((look.golden + look.dawn) * 1.4) * (1 - look.dark);
  const body = mix(mix([16, 18, 34], [26, 46, 96], day), [90, 60, 90], gold * 0.4), lite = mix(body, [210, 222, 255], 0.35 * day + 0.12), dark = mix(body, [6, 6, 12], 0.5);
  const stripe = mix([60, 60, 70], [236, 238, 244], day * 0.9 + 0.1);
  // the tail boom (tapering), the fin, the stabiliser
  x.fillStyle = rgb(body); x.beginPath(); x.moveTo(-0.12, -0.06); x.lineTo(-0.56, -0.035); x.lineTo(-0.56, -0.01); x.lineTo(-0.12, 0.03); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-0.5, -0.03); x.lineTo(-0.58, -0.17); x.lineTo(-0.62, -0.17); x.lineTo(-0.6, -0.01); x.closePath(); x.fill();
  x.fillStyle = rgb(dark); x.fillRect(-0.52, -0.005, 0.1, 0.018);
  // the cabin: a rounded pod, lit on top, darker below; the white stripe
  x.beginPath(); x.moveTo(0.3, 0.02); x.bezierCurveTo(0.32, -0.12, 0.18, -0.2, 0.02, -0.2); x.lineTo(-0.1, -0.2); x.bezierCurveTo(-0.2, -0.2, -0.22, -0.1, -0.2, -0.04); x.bezierCurveTo(-0.18, 0.06, -0.06, 0.1, 0.06, 0.1); x.bezierCurveTo(0.2, 0.1, 0.29, 0.08, 0.3, 0.02); x.closePath();
  const g = x.createLinearGradient(0, -0.2, 0, 0.1); g.addColorStop(0, rgb(lite)); g.addColorStop(0.5, rgb(body)); g.addColorStop(1, rgb(dark)); x.fillStyle = g; x.fill();
  x.fillStyle = rgb(stripe, 0.9); x.beginPath(); x.moveTo(-0.2, 0.0); x.lineTo(0.29, 0.0); x.lineTo(0.28, 0.025); x.lineTo(-0.19, 0.03); x.closePath(); x.fill();
  // the glass canopy: the sky in it by day, dark with a warm instrument glow at night; a highlight
  x.beginPath(); x.moveTo(0.29, 0.0); x.bezierCurveTo(0.3, -0.1, 0.2, -0.17, 0.08, -0.175); x.lineTo(0.06, -0.02); x.closePath();
  const cg = x.createLinearGradient(0.06, -0.17, 0.3, 0); cg.addColorStop(0, rgb(mix([20, 28, 48], [150, 190, 230], day))); cg.addColorStop(1, rgb(mix([10, 14, 26], [60, 90, 130], day)));
  x.fillStyle = cg; x.fill();
  if (look.dark > 0.4) { x.fillStyle = `rgba(255,190,110,${0.35 * look.dark})`; x.beginPath(); x.ellipse(0.2, -0.03, 0.06, 0.03, 0, 0, TAU); x.fill(); }
  x.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * day})`; x.lineWidth = 0.012; x.beginPath(); x.moveTo(0.12, -0.15); x.quadraticCurveTo(0.22, -0.14, 0.26, -0.07); x.stroke();
  // the mast + the hub, the skids on their struts
  x.fillStyle = rgb(dark); x.fillRect(-0.03, -0.25, 0.05, 0.06); x.fillRect(-0.06, -0.265, 0.11, 0.022);
  x.strokeStyle = rgb(mix(dark, [120, 120, 130], day * 0.6)); x.lineWidth = 0.022; x.lineCap = 'round';
  x.beginPath(); x.moveTo(0.12, 0.09); x.lineTo(0.14, 0.17); x.moveTo(-0.1, 0.08); x.lineTo(-0.12, 0.17); x.moveTo(-0.24, 0.17); x.lineTo(0.26, 0.17); x.quadraticCurveTo(0.31, 0.17, 0.32, 0.14); x.stroke();
  return { cv, w: W, h: H, oy: H * 0.55 };
}

// ------------------------------------------------------------------ the module
export function createAir() {
  let W = 1, H = 1, HZ = 1, K = 1, dpr = 2, tier = 2;
  let planes = [], nextPlane = 6 + Math.random() * 12, forcedAt = -1e9;
  let train = null, trainNight = '', sat = null, nextSat = 60 + Math.random() * 180;
  let heli = null;
  const glows = new Map();
  const glow = (r, g, b) => { const k = `${r},${g},${b}`; let c = glows.get(k); if (!c) { c = mk(32, 32); const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.28, `rgba(${k},0.45)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); glows.set(k, c); } return c; };

  // a path across a lane (sky-high / sky-low), a little climb or descent, clear of the corner buttons' rows when it can
  function lanePath(lane, approach, avoid) {
    const m = Math.min(10, lane.h * 0.15), top = lane.y + m, bottom = lane.y + lane.h - m;
    if (bottom - top < 8) return null;
    const maxS = Math.min(approach ? 0.1 : 0.09, (bottom - top) / (W + 120) * 0.95), minS = Math.min(0.015, maxS * 0.4);
    return planPath({ W, top, bottom, zones: avoid, minSlope: minS, maxSlope: maxS, margin: 8 });
  }
  function spawnPlane(s, laneId, approach) {
    const lane = s.lanes && s.lanes[laneId];
    if (!lane || lane.h < 24) return null;
    const avoid = [s.textRects && s.textRects.neon, s.textRects && s.textRects.tag].filter(Boolean);
    const path = lanePath(lane, approach, avoid);
    if (!path) return null;
    if (approach && path.y1 < path.y0) { [path.y0, path.y1] = [path.y1, path.y0]; path.slope = (path.y1 - path.y0) / (path.x1 - path.x0); }
    const high = laneId === 'sky-high';
    const alt = approach ? 0 : high ? 0.55 + Math.random() * 0.45 : 0.3 + Math.random() * 0.35;     // 1 = high and far
    const len = (approach ? 32 : high ? 21 - alt * 8 : 25 - alt * 8) * K;
    const dur = (approach ? 30 + Math.random() * 8 : 24 + alt * 22 + Math.random() * 4) * Math.max(0.8, W / 420) ** 0.35;
    return { ...path, lane: laneId, approach, alt, len, dur, k: 0, ph: Math.random() * 10, lv: LIVERIES[Math.floor(Math.random() * LIVERIES.length)], trail: [], trailAt: 0, spr: null, sprKey: '' };
  }

  // ---- the plane, drawn
  function drawPlane(c, s, p, look) {
    const { t } = s;
    const u = Math.min(1, p.k);
    const x = p.x0 + (p.x1 - p.x0) * u, y = p.y0 + (p.y1 - p.y0) * u;
    const edge = Math.min(1, u / 0.03, (1 - u) / 0.03);
    const { dark, golden, dawn, day, wet, fog, overcast } = look;
    // THE CONTRAIL (high, dry, not overcast, out of the night): samples every 0.35 s into a ring of ≤ CAP
    const trailOn = !p.approach && p.alt > 0.45 && !wet && !overcast && dark < 0.8 && p.k < 1;
    if (trailOn) {
      p.trailAt -= s.dt / 1000;
      if (p.trailAt <= 0) { p.trailAt = 0.35; p.trail.push({ x: x - p.dir * p.len * 0.22, y: y + p.len * 0.05, at: t }); if (p.trail.length > CAP) p.trail.shift(); }
    }
    if (p.trail.length > 1) drawTrail(c, s, p, look, x, y);
    if (p.k >= 1) return;
    if (overcast && dark < 0.5) return;                                // above the cloud by day: unseen
    // the body (a sprite per plane per light: rebuilt only when the hour's light moves on)
    const bodyA = edge * (wet ? 0.45 : 1) * (fog > 0.3 ? 0.6 : 1);
    const key = `${Math.round(day * 8)}${Math.round(golden * 8)}${Math.round(dawn * 8)}${Math.round(dark * 8)}`;
    if (!p.spr || key !== p.sprKey) { if (p.spr) p.spr.cv.width = 0; p.spr = airliner(p.len, look, p.dir, p.slope, p.lv, dpr, p.approach || p.len > 24); p.sprKey = key; }
    const S = p.spr;
    if (bodyA > 0.02) {
      // (a high plane in the deep blue is a little hazed; the night one is a dark shape the lights carry)
      c.globalAlpha = bodyA * (1 - 0.25 * p.alt * day) * (dark > 0.5 ? 0.85 : 1);
      c.drawImage(S.cv, x - S.w / 2, y - S.h / 2, S.w, S.h);
      c.globalAlpha = 1;
      // the sun on its skin: a small bright glint on the crown (gold at sunset)
      const glint = (day * 0.8 + (golden + dawn) * 0.6) * edge * (0.7 + 0.3 * Math.sin(t * 0.8 + p.ph)) * (1 - dark);
      if (glint > 0.04) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, glint * 0.8); const g = day > 0.5 ? [255, 252, 238] : [255, 210, 150], r = p.len * 0.12; c.drawImage(glow(...g), x + S.pts.top[0] - r, y + S.pts.top[1] - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    }
    // THE LIGHTS: after dusk (faint in rain, soft in fog)
    const lightA = clamp01((dark + golden * 0.35 + dawn * 0.3) * 1.2) * edge * (wet ? 0.7 : 1);
    if (lightA < 0.03) return;
    const blur = 1 + fog * 1.6, a0 = lightA * (1 - fog * 0.35), sc = p.len / 20;
    const light = (o, col, a, r) => {
      const lx = x + o[0], ly = y + o[1];
      r = Math.max(1.8, r);
      c.globalAlpha = a * 0.7; c.drawImage(glow(...col), lx - r * blur, ly - r * blur, r * 2 * blur, r * 2 * blur);
      c.globalAlpha = a * (fog > 0.3 ? 0.6 : 1); c.fillStyle = `rgb(${Math.min(255, col[0] + 70)},${Math.min(255, col[1] + 70)},${Math.min(255, col[2] + 70)})`;
      c.beginPath(); c.arc(lx, ly, Math.max(0.55, r * 0.2), 0, TAU); c.fill();
    };
    c.globalCompositeOperation = 'lighter';
    const RED = [255, 50, 60], GREEN = [60, 255, 140], nl = navLights(p.dir);
    light(S.pts.near, nl.near === 'red' ? RED : GREEN, a0 * 0.95, 2.6 * sc);
    light(S.pts.far, nl.far === 'red' ? RED : GREEN, a0 * 0.7, 2.2 * sc);
    light(S.pts.tail, [255, 255, 255], a0 * 0.6, 1.8 * sc);
    // the beacons: slow red pulses, top + belly alternating
    const bc = 0.5 + 0.5 * Math.sin((t + p.ph) * TAU / 1.25);
    light(S.pts.top, RED, a0 * (s.motion ? 0.2 + 0.7 * bc * bc : 0.5), 2.2 * sc);
    light(S.pts.belly, RED, a0 * (s.motion ? 0.2 + 0.7 * (1 - bc) * (1 - bc) : 0.4), 2 * sc);
    // the strobes: a white double flash about once a second, on both wing tips + the tail (steady + dim with Reduced effects)
    const ph = (t + p.ph * 0.37) % 1.05;
    const strobe = s.motion ? (ph < 0.05 || (ph > 0.14 && ph < 0.19) ? 1 : 0) : 0.3;
    if (strobe > 0) { light(S.pts.near, [255, 255, 255], a0 * strobe, 5 * sc); light(S.pts.far, [255, 255, 255], a0 * strobe * 0.8, 4.2 * sc); light(S.pts.tail, [255, 255, 255], a0 * strobe * 0.6, 3 * sc); }
    // LANDING LIGHTS on approach: an intense pair looking our way + their glare reaching ahead of the plane into the haze
    if (p.approach) {
      const ll = 0.85 + 0.15 * Math.sin(t * 0.7 + p.ph);
      const fwd = p.len * 0.9, gx = x + S.pts.land2[0] + p.dir * fwd * 0.45, gy = y + S.pts.land2[1] + p.slope * p.dir * fwd * 0.45;
      c.globalAlpha = a0 * 0.22 * ll; c.drawImage(glow(255, 244, 220), gx - fwd * 0.75, gy - fwd * 0.22, fwd * 1.5, fwd * 0.44);
      light(S.pts.land, [255, 250, 236], a0 * 0.95 * ll, 4.2 * sc); light(S.pts.land2, [255, 255, 255], a0 * 0.85, 3 * sc);
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  // THE CONTRAIL: two engine lines that merge after ~3 s, widening + drifting with the real wind, fading over its life; six
  // age batches × two strokes (a soft body + a brighter core) — ≤ 14 draw calls a plane whatever its age
  function drawTrail(c, s, p, look, hx, hy) {
    const { dark, golden, dawn, day, fog } = look, t = s.t, life = 22;
    while (p.trail.length && t - p.trail[0].at > life) p.trail.shift();
    if (p.trail.length < 2) return;
    const wind = Math.sin(((s.L.windDir == null ? 250 : s.L.windDir)) * Math.PI / 180) * Math.min(10, s.L.wind == null ? 2 : s.L.wind) * 0.3;
    const vis = (1 - dark * 0.9) * (0.35 + 0.65 * (day + golden + dawn)) * (fog > 0.3 ? 0.4 : 1);
    if (vis < 0.02) return;
    const tc = golden + dawn > day ? (golden >= dawn ? [255, 206, 178] : [255, 196, 206]) : [255, 255, 255];
    const sc = Math.max(0.7, p.len / 20);
    const at = q => { const age = t - q.at; return [q.x + (s.motion ? wind * age : 0), q.y + (s.motion ? age * 0.08 : 0), age]; };
    c.lineCap = 'round'; c.lineJoin = 'round';
    const N = p.trail.length, B = 6;
    for (let b = 0; b < B; b++) {
      const i0 = Math.floor(b * (N - 1) / B), i1 = Math.floor((b + 1) * (N - 1) / B);
      if (i1 <= i0) continue;
      const mid = at(p.trail[Math.floor((i0 + i1) / 2)]), age = mid[2];
      const form = smooth(0.2, 1.6, age), fade = Math.pow(1 - age / life, 1.3);
      const wd = (1.1 + (s.motion ? age * 0.32 : 0)) * sc;
      const a = (day > 0.5 ? 0.5 : 0.36) * form * fade * vis;
      if (a < 0.01) continue;
      c.beginPath();
      for (let i = i0; i <= i1; i++) { const [px, py] = at(p.trail[i]); if (i === i0) c.moveTo(px, py); else c.lineTo(px, py); }
      c.strokeStyle = rgb(tc, a * 0.35); c.lineWidth = wd * 2.4; c.stroke();
      c.strokeStyle = rgb(tc, a * 0.75); c.lineWidth = wd; c.stroke();
    }
    // the young trail: two thin engine lines from the plane, merging into one (the first ~3 s)
    const young = p.trail.filter(q => t - q.at < 3.2);
    if (young.length && p.k < 1) {
      c.beginPath();
      for (const off of [-0.7, 0.7]) young.forEach((q, i) => { const [px, py, age] = at(q); const o = off * sc * (1 - clamp01(age / 3)); if (i === 0) c.moveTo(px, py + o); else c.lineTo(px, py + o); });
      const last = young[young.length - 1], [lx, ly] = at(last);
      c.moveTo(lx, ly); c.lineTo(hx - p.dir * p.len * 0.3, hy + p.len * 0.05);
      c.strokeStyle = rgb(tc, 0.5 * vis * (day > 0.5 ? 1 : 0.75)); c.lineWidth = 0.7 * sc; c.stroke();
    }
  }

  // ---- satellites (the district's, unchanged)
  function newTrain(s, mode) {
    const n = 20 + Math.floor(Math.random() * 21);
    const lane = s.lanes && s.lanes['sky-high'];
    const path = planPath({ W, top: lane ? lane.y + 6 : 30, bottom: lane ? lane.y + lane.h - 6 : HZ * 0.5, minSlope: 0.04, maxSlope: 0.18 });
    if (!path) return null;
    return { ...path, n, gap: (9 + Math.random() * 3) * K, len: Math.hypot(path.x1 - path.x0, path.y1 - path.y0), dur: 70 + Math.random() * 25, k: 0, mode, shadow: 0.45 + Math.random() * 0.3 };
  }
  function newSat(s, mode) {
    const lane = s.lanes && s.lanes['sky-high'];
    const path = planPath({ W, top: lane ? lane.y + 6 : 30, bottom: lane ? lane.y + lane.h - 6 : HZ * 0.5, minSlope: 0.04, maxSlope: 0.3 });
    if (!path) return null;
    return { ...path, dur: 80 + Math.random() * 40, k: 0, mode, shadow: 0.4 + Math.random() * 0.45, b: 0.45 + Math.random() * 0.25 };
  }
  const satAlpha = (u, mode, shadow) => (mode === 'evening' ? 1 - smooth(shadow - 0.06, shadow + 0.06, u) : mode === 'morning' ? smooth(shadow - 0.06, shadow + 0.06, u) : 1);
  function satPoint(c, x, y, a, moon) {
    if (moon && Math.hypot(x - moon.x, y - moon.y) < moon.r * 1.15) return;
    c.globalAlpha = a * 0.55; c.drawImage(glow(225, 234, 255), x - 3, y - 3, 6, 6);
    c.globalAlpha = a; c.fillStyle = '#f2f6ff'; c.fillRect(x - 0.55, y - 0.55, 1.1, 1.1);
  }

  // ---- THE HELICOPTER: in from a side, a hover over the harbor, out the other side (a function of the time since it started:
  // every phone shows the same flight) — or a route from fly()
  function heliPlan(s, start, seed) {
    const lane = s.lanes && s.lanes['sky-low'];
    if (!lane) return null;
    const dir = seed % 2 ? 1 : -1, sky = s.skyline;
    // the hover: over the harbor where the roofs are lowest (so it is seen whole), a little above them
    // (over the harbor's middle — between the wheel and Rosie's landing — a little above the roofs there)
    const best = W * (0.42 + ((seed >>> 3) % 100) / 100 * 0.22);
    let low = -1;
    if (sky) for (let x = best - 20; x <= best + 20; x += 4) { const ry = sky[Math.max(0, Math.min(sky.length - 1, Math.round(x / 4)))] || 0; if (low < 0 || ry < low) low = ry; }
    const hy = Math.max(lane.y + 16 * K, Math.min(lane.y + lane.h * 0.42, (low > 0 ? low : lane.y + lane.h) - 40 * K));
    const route = [[dir > 0 ? -50 : W + 50, hy - 10 * K, 0], [best, hy, 22], [dir > 0 ? W + 60 : -60, hy - 14 * K, 0]];
    return { start, route, dir, spr: null, sprKey: '', len: 28 * K, own: false };
  }
  /** where the helicopter is at time e (s since its start): { x, y, dir, hover (0..1), done } */
  function heliAt(h, e) {
    const sp = 52 * K;
    let tt = e;
    for (let i = 0; i < h.route.length - 1; i++) {
      const [ax, ay, hold] = h.route[i], [bx, by] = h.route[i + 1];
      if (tt < hold) return { x: ax + Math.sin(tt * 0.7) * 2.5 * K, y: ay + Math.sin(tt * 1.3) * 1.6 * K, dir: h.dir, hover: 1, done: false };
      tt -= hold;
      const d = Math.hypot(bx - ax, by - ay), dur = d / sp;
      if (tt < dur) { const k = tt / dur, ek = k * k * (3 - 2 * k), dir = bx >= ax ? 1 : -1; return { x: ax + (bx - ax) * ek, y: ay + (by - ay) * ek, dir, hover: 0, done: false }; }
      tt -= dur;
    }
    const last = h.route[h.route.length - 1];
    if (last[2] && tt < last[2]) return { x: last[0], y: last[1], dir: h.dir, hover: 1, done: false };
    return { x: last[0], y: last[1], dir: h.dir, hover: 0, done: true };
  }
  function drawHeli(c, s, look) {
    if (!heli) return null;
    const e = (s.now - heli.start) / 1000;
    if (e < 0) return null;
    const p = heliAt(heli, e);
    if (p.done) { if (heli.spr) heli.spr.cv.width = 0; heli = null; return null; }
    const key = `${Math.round(look.day * 8)}${Math.round(look.golden * 8)}${Math.round(look.dark * 8)}|${p.dir}`;
    if (!heli.spr || key !== heli.sprKey) { if (heli.spr) heli.spr.cv.width = 0; heli.spr = chopper(heli.len, look, p.dir, dpr); heli.sprKey = key; }
    const S = heli.spr, L = heli.len, t = s.t;
    const tilt = p.hover ? 0 : 2.2 * K * p.dir;                     // (nose down in forward flight: the body a touch lower in front)
    c.drawImage(S.cv, p.x - S.w / 2, p.y - S.oy + tilt * 0, S.w, S.h);
    // THE ROTOR: a motion-blurred disc seen edge-on (a flat soft ellipse) + two blade streaks flicking across it
    const ry = p.y - L * 0.27, rw = L * 0.72;
    const day = clamp01(look.day + look.golden + look.dawn) * (1 - look.dark);
    const rc = mix([30, 30, 44], [70, 74, 90], day);
    const g = c.createLinearGradient(p.x - rw, 0, p.x + rw, 0);
    g.addColorStop(0, rgb(rc, 0)); g.addColorStop(0.2, rgb(rc, 0.22)); g.addColorStop(0.5, rgb(rc, 0.3)); g.addColorStop(0.8, rgb(rc, 0.22)); g.addColorStop(1, rgb(rc, 0));
    c.fillStyle = g; c.beginPath(); c.ellipse(p.x, ry, rw, Math.max(0.8, L * 0.035), 0, 0, TAU); c.fill();
    if (s.motion) { const ph = (t * 7.3) % 1; c.fillStyle = rgb(rc, 0.55); for (const o of [ph, (ph + 0.5) % 1]) { const bx = p.x + (o * 2 - 1) * rw * Math.abs(Math.cos(o * Math.PI)); c.fillRect(bx - rw * 0.35, ry - 0.45, rw * 0.7, 0.9); } }
    // the tail rotor: a small blurred disc on the fin
    const tx = p.x - p.dir * L * 0.6, ty = p.y - L * 0.06;
    c.fillStyle = rgb(rc, 0.3); c.beginPath(); c.arc(tx, ty, L * 0.085, 0, TAU); c.fill();
    // the lights at night: the red beacon on the boom, the nav lights, a white tail light
    const lightA = clamp01((look.dark + look.golden * 0.3) * 1.3);
    if (lightA > 0.03) {
      c.globalCompositeOperation = 'lighter';
      const bk = s.motion ? Math.max(0, Math.sin(t * TAU / 1.1)) ** 3 : 0.5, r = 2.4 * K;
      c.globalAlpha = lightA * bk; c.drawImage(glow(255, 50, 60), p.x - p.dir * L * 0.05 - r * 1.6, p.y - L * 0.2 - r * 1.6, r * 3.2, r * 3.2);
      c.globalAlpha = lightA * 0.8; c.drawImage(glow(...(p.dir > 0 ? [60, 255, 140] : [255, 50, 60])), p.x + p.dir * L * 0.05 - r, p.y + L * 0.02 - r, r * 2, r * 2);
      c.globalAlpha = lightA * 0.6; c.drawImage(glow(255, 255, 255), tx - p.dir * L * 0.03 - r * 0.8, ty - r * 0.8, r * 1.6, r * 1.6);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    return { x: p.x, y: p.y + L * 0.12, dir: p.dir, hover: p.hover, e };
  }

  let heliNow = null;
  return {
    resize(w, h, hz) { if (w === W && h === H && hz === HZ) return; W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 402)); for (const p of planes) if (p.spr) p.spr.cv.width = 0; planes = []; train = null; sat = null; },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    /** the sky layer: planes in the free sky lanes, satellites at twilight, the helicopter. free: { 'sky-high': bool, 'sky-low': bool } */
    draw(c, s, free) {
      const { L, dt, force, motion } = s;
      const sec = dt / 1000, look = airLook(L);
      const hr = L.local ? L.local.h + L.local.mi / 60 : 20;
      // ---- planes: the district's traffic by the hour, on the free lanes (a sky event's lane is never shared; a heavy event
      // elsewhere thins the sky: fs.density)
      const dens = s.density ? Math.min(s.density['sky-high'], s.density['sky-low']) : 1;
      const lanes = ['sky-high', 'sky-low'].filter(id => free[id] && s.lanes && s.lanes[id] && s.lanes[id].h >= 24);
      const max = Math.floor((tier === 0 ? 1 : W > 800 ? 3 : 2) * dens);
      const rate = trafficRate(hr) * (look.wet ? 0.5 : 1) * (motion ? 1 : 0.6);
      nextPlane -= sec;
      const forcedPlane = (force.has('planes') || force.has('approach')) && performance.now() - forcedAt > 9000;
      const known = !!(s.textRects && s.textRects.neon);              // never plan a path before the sign's place is known
      if ((forcedPlane || nextPlane <= 0) && lanes.length && planes.filter(p => p.k < 1).length < (forcedPlane ? Math.max(1, max) : max) && known) {
        const approach = force.has('approach') ? true : force.has('planes') ? false : Math.random() < 0.12 && hr > 6 && hr < 23.5;
        // (an approach comes in low: sky-low when it is free; a cruise takes either, the high lane twice as often)
        const pickL = approach && lanes.includes('sky-low') ? 'sky-low' : lanes[lanes.length > 1 && Math.random() < 0.35 ? 1 : 0];
        const p = spawnPlane(s, pickL, approach);
        if (p) { planes.push(p); if (forcedPlane) forcedAt = performance.now(); nextPlane = Math.max(30, (90 / Math.max(0.02, rate)) * (0.55 + Math.random() * 0.9)); }
        else nextPlane = 5;
      } else if (nextPlane <= 0) nextPlane = 20;
      planes = planes.filter(p => {
        // (a lane a sky event takes: a plane already in it finishes its crossing — the event waits for its own start)
        p.k += sec / p.dur;
        drawPlane(c, s, p, look);
        const keep = p.k < 1 || p.trail.length > 1;
        if (!keep && p.spr) p.spr.cv.width = 0;
        return keep;
      });
      // ---- satellites: twilight only, clear skies (the district's)
      const mode = satTwilight(L.sun.el, hr), clear = L.clear && (L.cloud || 0) < 0.45 && !look.wet;
      const night = L.local ? `${L.local.y}-${L.local.m}-${L.local.d}-${mode}` : '';
      if (known && free['sky-high'] && !train && (force.has('satellites') && trainNight !== 'forced' || (mode && clear && L.local && starlinkNight(L.local.y, L.local.m, L.local.d) && trainNight !== night && Math.random() < sec / 40))) {
        train = newTrain(s, force.has('satellites') ? (mode || 'evening') : mode); trainNight = force.has('satellites') ? 'forced' : night;
      }
      if (known && free['sky-high'] && !sat && ((force.has('sat') && Math.random() < sec / 2) || (mode && clear && (nextSat -= sec) <= 0))) { sat = newSat(s, force.has('sat') ? (mode || 'evening') : mode); nextSat = 300 + Math.random() * 300; }
      const satVis = clamp01(look.dark * 1.4);
      if (train || sat) c.globalCompositeOperation = 'lighter';
      if (train) {
        train.k += sec / train.dur;
        const span = train.n * train.gap;
        for (let i = 0; i < train.n; i++) { const u = (train.k * (train.len + span) - i * train.gap) / train.len; if (u < 0 || u > 1) continue; satPoint(c, train.x0 + (train.x1 - train.x0) * u, train.y0 + (train.y1 - train.y0) * u, 0.78 * satVis * satAlpha(u, train.mode, train.shadow) * Math.min(1, u / 0.03, (1 - u) / 0.03), s.moonAt); }
        if (train.k * (train.len + span) - span > train.len) train = null;
      }
      if (sat) { sat.k += sec / sat.dur; const u = sat.k; satPoint(c, sat.x0 + (sat.x1 - sat.x0) * u, sat.y0 + (sat.y1 - sat.y0) * u, sat.b * satVis * satAlpha(u, sat.mode, sat.shadow) * Math.min(1, u / 0.04, (1 - u) / 0.04), s.moonAt); if (sat.k >= 1) sat = null; }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // ---- the helicopter
      heliNow = drawHeli(c, s, look);
    },
    /** the helicopter's SEARCHLIGHT at night (after the city: the beam reaches down past the roofs to the water + its pool) */
    beam(c, s, waterY) {
      const h = heliNow;
      if (!h || !heli) return;
      const look = airLook(s.L), k = clamp01((look.dark - 0.35) * 2) * (s.L.fog > 0.6 ? 0.6 : 1);
      if (k < 0.02) return;
      // the beam: from the belly, sweeping slowly over the harbor while it hovers, ahead + down while it flies
      const sw = s.motion ? Math.sin(h.e * 0.45) * 0.32 : 0.1;
      const ang = Math.PI / 2 + (h.hover ? sw : -0.5 * h.dir);
      const len = Math.max(40, waterY - h.y), ex = h.x + Math.cos(ang) * len / Math.max(0.3, Math.sin(ang)), ey = waterY;
      const spread = len * 0.16;
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(h.x, h.y, ex, ey);
      g.addColorStop(0, `rgba(235,242,255,${0.42 * k})`); g.addColorStop(0.5, `rgba(220,232,255,${0.14 * k})`); g.addColorStop(1, `rgba(220,232,255,${0.06 * k})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(h.x - 1, h.y); c.lineTo(h.x + 1, h.y); c.lineTo(ex + spread, ey); c.lineTo(ex - spread, ey); c.closePath(); c.fill();
      c.globalAlpha = 0.5 * k; c.drawImage(glow(230, 238, 255), ex - spread * 1.6, ey - spread * 0.35, spread * 3.2, spread * 0.7);
      c.globalAlpha = 0.9 * k; c.drawImage(glow(255, 255, 255), h.x - 3, h.y - 3, 6, 6);
      c.restore();
    },
    /** start the helicopter's flight now (the scheduler's event, &force=helicopter): start = clock ms, seed: its side */
    heli(s, start, seed) { if (heli && !heli.own) return; const h = heliPlan(s, start, seed); if (h) heli = h; },
    /** HOOK (Part 10: the party yacht's landing): fly a route of [x, y, hold s] points (screen pt) from now; land: hold at the last */
    fly(s, route, { land = false } = {}) { if (!route || route.length < 2) return; const r = route.map(p => [p[0], p[1], p[2] || 0]); if (land) r[r.length - 1][2] = 1e6; heli = { start: s.now, route: r, dir: r[1][0] >= r[0][0] ? 1 : -1, spr: null, sprKey: '', len: 28 * K, own: true }; },
    heliOn: () => !!heli,
    /** anything crossing the sky right now (the calm frame rate: a plane, the train, a satellite, the helicopter keep 60 fps) */
    busy: () => planes.some(p => p.k < 1) || !!train || !!sat || !!heli,
    lanesInUse: () => new Set(planes.filter(p => p.k < 1).map(p => p.lane)),
    debug: () => ({ planes: planes.filter(p => p.k < 1).map(p => ({ lane: p.lane, x0: Math.round(p.x0), y0: Math.round(p.y0), x1: Math.round(p.x1), y1: Math.round(p.y1), slope: +p.slope.toFixed(3), dir: p.dir, approach: p.approach, len: +p.len.toFixed(1), k: +p.k.toFixed(2) })), trails: planes.reduce((n, p) => n + p.trail.length, 0), cap: CAP, train: train ? { n: train.n, mode: train.mode } : null, sat: !!sat, heli: heliNow ? { x: Math.round(heliNow.x), y: Math.round(heliNow.y), hover: heliNow.hover } : null, nextPlane: Math.round(nextPlane) }),
    destroy() { for (const p of planes) if (p.spr) p.spr.cv.width = 0; if (heli && heli.spr) heli.spr.cv.width = 0; for (const c of glows.values()) c.width = 0; glows.clear(); planes = []; heli = null; },
  };
}
