// CITY 2.0 — THE HARBOR, Part 6a: THE AIR — the airliners, the satellites, the helicopter (docs/harbor/passes/part-6a.md).
// The district's behaviour (district/aircraft.js: the traffic by the hour, paths that climb or descend a little, approaches
// with landing lights, contrails only high + dry + by day, the Starlink evenings + lone satellites at twilight) on the Harbor's
// SKY LANES (sky-high: over the sign; sky-low: under the tagline, behind the taller towers) — never across the NEON sign or the
// tagline, never in a lane a sky event holds; and new ARTWORK:
//   AIRLINERS   a crafted sprite per plane (its size, its slope, its heading, the hour's light): a tapered fuselage with the
//               belly in shade and the sun on its crown, swept wings + engines under them, the tail in one of three liveries,
//               a cheatline, the cockpit glass, a row of windows (lit at night on a big one); at night a dark shape whose TAIL is
//               lit by its logo lights, NAV LIGHTS (red port, green starboard), a white tail light, red beacons top + belly,
//               double-flash white STROBES, and on approach the LANDING LIGHTS with a glare reaching ahead
//   CONTRAILS   (SP) two thin engine lines merging into ONE smooth trail of soft puffs on the plane's real path, each tied to
//               the moment it was laid (never crawling or jumping at 60 or 30 Hz), spreading, drifting on the real wind and fading
//               evenly — ~90 puffs a plane at most (every other one fades out as the trail spreads)
//   SATELLITES  the district's twilight points + Starlink trains (behaviour unchanged)
//   HELICOPTER  a crafted chopper (glass canopy, a two-tone body, skids, a tail rotor) with a motion-blurred rotor disc; it
//               comes in, hovers over the harbor and goes; at night a SEARCHLIGHT beam to the water + its pool, a red beacon,
//               nav lights. fly(route) is the hook for Part 10's party yacht landing.
import { trafficRate, planPath, navLights, starlinkNight, satTwilight } from '../district/aircraft.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { knob } from '../../core/harbor-schedule.js';
import { tierVal } from '../../core/harbor-tiers.js';
import { beatSweep, beamColour, beamPair, breakDrift } from '../../core/harbor-heli.js';
import { hashString } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const cam0Wide = W => W > 800;
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const LIVERIES = [{ tail: [28, 52, 118], line: [214, 170, 70] }, { tail: [176, 34, 48], line: [176, 34, 48] }, { tail: [16, 110, 122], line: [240, 196, 80] }];
const BEAM_WHITE = [226, 236, 255];
const BREAK_LEN = 54;                                  // SKY-A: the break's craft, pt at 402 wide (was 34 — the owner: bigger, closer)
const CAP = 260;                                       // contrail samples per plane (every 0.1 s: the path; the puffs drawn are capped by their spacing)

/** the hour's light on an aircraft: { day, golden, dawn, dark, warm (0..1 golden side), haze } from the look */
function airLook(L) {
  return { dark: clamp01(L.w.night + L.w.late), golden: L.w.golden, dawn: L.w.dawn, day: L.w.day, wet: (L.rain || 0) > 0.1, fog: L.fog || 0, overcast: (L.cloud || 0) > 0.78 };
}

// ------------------------------------------------------------------ the airliner sprite
/** an airliner (nose toward +x before the flip), len pt long, in the hour's light → { cv, ox, oy, w, h, pts } (pts: its light
 *  positions in the sprite's frame: wing tips, tail, beacons, landing lights — screen offsets from its centre) */
function airliner(len, look, dir, slope, lv, dpr, big) {
  const W = len * 1.25, H = len * 0.72, d = Math.min(3, dpr * (big ? 1 : 1.25));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
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
function chopper(len, look, dir, dpr, rim = false) {
  const W = len * 1.2, H = len * 0.75, d = Math.min(3, dpr * 1.25);
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H * 0.55) * d); x.scale(dir * len, len);
  const day = clamp01(look.day + look.golden * 0.9 + look.dawn * 0.8) * (1 - look.dark), gold = clamp01((look.golden + look.dawn) * 1.4) * (1 - look.dark);
  // (SKY-A, rim: the night paint a lit mid-tone — the city's glow on it — so the craft reads as a silhouette against the dark quay)
  const body = mix(mix(rim ? [54, 58, 94] : [16, 18, 34], [26, 46, 96], day), [90, 60, 90], gold * 0.4), lite = mix(body, [210, 222, 255], 0.35 * day + (rim ? 0.3 : 0.12)), dark = mix(body, [6, 6, 12], 0.5);
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
  // SKY-A — AT NIGHT, LIT BY THE CITY (the owner: "bigger + more readable"; a near-black craft vanished on the dark breakwater): the city's
  // cool neon along its top edges, the crowd's + the street's warm light under its belly — a clear silhouette, never a flat dark shape
  if (rim && look.dark > 0.3) {
    const k = clamp01((look.dark - 0.3) / 0.5);
    x.globalCompositeOperation = 'source-atop';
    const rg = x.createLinearGradient(0, -0.27, 0, 0.18);
    rg.addColorStop(0, `rgba(206,190,255,${0.85 * k})`); rg.addColorStop(0.3, `rgba(170,156,240,${0.5 * k})`); rg.addColorStop(0.55, 'rgba(0,0,0,0)');
    rg.addColorStop(0.8, `rgba(255,170,130,${0.12 * k})`); rg.addColorStop(1, `rgba(255,190,150,${0.42 * k})`);
    x.fillStyle = rg; x.fillRect(-0.7, -0.3, 1.1, 0.5);
    x.globalCompositeOperation = 'source-over';
  }
  return { cv, w: W, h: H, oy: H * 0.55 };
}

// ------------------------------------------------------------------ SKY-A — THE BEAM, DIFFUSED (the owner, Oct 30 8:19 am: NIGHT-C's
// break beam read "fragmented / too concentrated"): ONE soft cone + ONE soft pool sprite per colour — a gaussian feather across the cone
// (no hard edge), brightest at the lamp, steady down to a wide end; the pool a smooth falloff. Baked BEFORE the flight (no first-swing
// hitch) and only for the palette's own colours: a cross-fade between two is the two sprites ADDED (the beam is additive, so the pair IS
// the in-between shade) — never a canvas per shade (NIGHT-C's beam made ~30 canvases a bar that way: the iPhone's 949).
const SOFT = 0.006;                                   // (a whisper of dither: no 8-bit banding when the sprite is scaled up 4–6×)
function softCone(col) {
  const SW = 48, SH = 96, cv = mk(SW, SH), x = safeCtx(cv), img = x.createImageData(SW, SH), d = img.data;
  for (let j = 0; j < SH; j++) {
    const v = (j + 0.5) / SH, half = 0.07 + 0.43 * v;
    const along = (0.62 * Math.exp(-v * 2.6) + 0.38) * smooth(0, 0.05, v) * (1 - 0.45 * smooth(0.8, 1, v));
    for (let i = 0; i < SW; i++) {
      const q = Math.abs((i + 0.5) / SW - 0.5) * 2 / half, h = (((i * 73856093) ^ (j * 19349663)) >>> 0) % 997 / 997 - 0.5;
      const a = Math.max(0, along * Math.exp(-q * q * 1.9) + h * SOFT), o = (j * SW + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return cv;
}
function softPool(col) {
  const S = 48, cv = mk(S, S), x = safeCtx(cv), img = x.createImageData(S, S), d = img.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const r = Math.hypot((i + 0.5) / S - 0.5, (j + 0.5) / S - 0.5) * 2, h = (((i * 73856093) ^ (j * 19349663)) >>> 0) % 997 / 997 - 0.5;
    const a = Math.max(0, Math.exp(-r * r * 3.2) * (1 - smooth(0.8, 1, r)) + h * SOFT), o = (j * S + i) * 4;
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(Math.min(1, a) * 255);
  }
  x.putImageData(img, 0, 0);
  return cv;
}

// ------------------------------------------------------------------ THE MODELS PASS — THE HELICOPTER AS A BAKED MODEL ("2D looks cheap when
// it TURNS" — the owner, Oct 30): "Utility helicopter" by 3D Assets (CC0, made with AI tools — ☰ → CREDITS) baked by scripts/bake/heli.mjs
// at 24 headings (0° = the nose right, 90° = toward the viewer, 180° = left, 270° = away) in a DAY + a NIGHT light (a lighter paint + the
// city's rim at night); its rotors hidden in the bake and drawn here live, at their hubs (heli.json, per heading) — as the nav lights, the
// beacon + the searchlight's root. LAZY: fetched when a patrol starts; until it's in (or if it fails) the drawn chopper stands in.
const HELI = new URL('../../../assets/city/heli/', import.meta.url);
let heliLoad = null, heliModel = null;
function loadHeliModel() {
  if (heliLoad) return heliLoad;
  const img = n => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i)); i.onerror = () => rej(new Error(n)); i.src = new URL(n, HELI).href; });
  heliLoad = (async () => { const r = await fetch(new URL('heli.json', HELI).href); if (!r.ok) throw new Error('heli.json'); const meta = await r.json(), sheets = {}; for (const lt of meta.lights) sheets[lt] = await img(`heli-${lt}.webp`); heliModel = { meta, sheets }; return heliModel; })();
  heliLoad.catch(() => { heliLoad = null; });
  return heliLoad;
}
export const heliModelReady = () => !!heliModel;

// ------------------------------------------------------------------ the module
export function createAir() {
  let W = 1, H = 1, HZ = 1, K = 1, dpr = 2, tier = 2;
  let planes = [], nextPlane = 6 + Math.random() * 12, forcedAt = -1e9, trainGone = -1e9, forcedKind = '';
  let train = null, trainNight = '', sat = null, nextSat = 60 + Math.random() * 180;
  let heli = null, lastS = null;   // (lastS: ATM-C — the last frame's state, for planFor)
  const glows = new Map();
  // (SKY-A: bounded — only fixed colours + the palettes' own ever reach it; a stray shade can never pile up canvases again)
  const glow = (r, g, b) => { const k = `${r},${g},${b}`; let c = glows.get(k); if (!c) { if (glows.size > 40) { for (const q of glows.values()) q.width = 0; glows.clear(); } c = mk(32, 32); const x = safeCtx(c); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.28, `rgba(${k},0.45)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); glows.set(k, c); } return c; };

  // SKY-A — the break beam's baked sprites, one pair per colour (white + the palettes' own): bounded
  const beamArts = new Map();
  const beamArt = col => { const k = col.join(','); let a = beamArts.get(k); if (!a) { if (beamArts.size > 16) { for (const q of beamArts.values()) { q.cone.width = 0; q.pool.width = 0; } beamArts.clear(); } a = { cone: softCone(col), pool: softPool(col) }; beamArts.set(k, a); } return a; };

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
    // THE CONTRAIL (high, dry, not overcast, out of the night): the engines' place every 0.1 s (≤ CAP) — drawTrail lays the puffs
    const trailOn = !p.approach && p.alt > 0.45 && !wet && !overcast && dark < 0.8 && p.k < 1;
    if (trailOn) {
      p.trailAt -= s.dt / 1000;
      if (p.trailAt <= 0) { p.trailAt = 0.1; p.trail.push({ x: x - p.dir * p.len * 0.22, y: y + p.len * 0.05, at: t }); if (p.trail.length > CAP) p.trail.shift(); }
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
  // THE CONTRAIL (SP — the owner: "too jagged, skippy, jumpy"; City 1.0's fluffy contrails are the reference): ONE CONTINUOUS TRAIL
  // of soft puffs laid along the plane's real path — the engines' exact place, sampled every 0.1 s and interpolated between — each
  // puff tied to the moment it was laid (a fixed grid of times), so it never crawls or jumps from frame to frame (60 Hz or Low
  // Power's 30): it only ages — spreading, softening, drifting with the wind, fading out evenly. As the trail spreads, every other
  // puff fades out smoothly (its neighbours grow to cover it): ~90 small sprites a plane, whatever its age. The first half-second
  // is the two thin engine lines, merging, from the engines themselves (a steady head).
  const puffs = new Map();
  function puffOf(col) {
    const k = col.join(',');
    let cv = puffs.get(k);
    if (!cv) {
      // (6b — FLUFFY CONTRAILS BACK, City 1.0's look: a BILLOWY puff — five soft lobes round a core, not one clean dot — so the
      // trail's edge reads puffy as the puffs overlap)
      cv = mk(48, 48); const x = safeCtx(cv);
      for (const [cx, cy, r, a] of [[24, 24, 15, 0.75], [16, 21, 10, 0.55], [32, 20, 11, 0.55], [21, 31, 10, 0.5], [31, 30, 9, 0.5], [24, 15, 9, 0.45]]) {
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        for (let i = 0; i <= 8; i++) { const u = i / 8; g.addColorStop(u, `rgba(${k},${(a * Math.exp(-((u * 2.1) ** 2)) * (1 - u ** 6)).toFixed(4)})`); }
        x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      }
      if (puffs.size > 6) { for (const c of puffs.values()) c.width = 0; puffs.clear(); }
      puffs.set(k, cv);
    }
    return cv;
  }
  function drawTrail(c, s, p, look, hx, hy) {
    const { dark, golden, dawn, day, fog } = look, t = s.t, life = 30, tr = p.trail;
    while (tr.length > 2 && t - tr[1].at > life + 0.5) tr.shift();
    if (tr.length && t - tr[tr.length - 1].at > life) tr.length = 0;     // (all of it faded: the plane can go)
    if (tr.length < 2) return;
    const wind = Math.sin(((s.L.windDir == null ? 250 : s.L.windDir)) * Math.PI / 180) * Math.min(10, s.L.wind == null ? 2 : s.L.wind) * 0.3;
    const vis = (1 - dark * 0.9) * (0.35 + 0.65 * (day + golden + dawn)) * (fog > 0.3 ? 0.4 : 1);
    if (vis < 0.02) return;
    const tc = golden + dawn > day ? (golden >= dawn ? [255, 210, 184] : [255, 200, 212]) : [255, 255, 255];
    const sc = Math.max(0.7, p.len / 20), mo = s.motion;
    // (the engines' place at a moment: the samples, interpolated — a straight path between them, sub-pixel)
    let si = 0;
    const at = tau => {
      while (si < tr.length - 2 && tr[si + 1].at <= tau) si++;
      const a = tr[si], b = tr[si + 1], u = Math.max(0, Math.min(1, (tau - a.at) / Math.max(1e-3, b.at - a.at)));
      return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u];
    };
    const drift = age => (mo ? [wind * age, age * 0.08] : [0, 0]);
    const tFirst = tr[0].at, tLast = tr[tr.length - 1].at;
    // the puffs: their radius + the trail's opacity by age (it forms over a second, then spreads + thins out)
    const rad = age => (0.85 + (mo ? age * 0.38 : 0)) * sc, peak = (day > 0.5 ? 0.52 : 0.4) * vis;
    const speed = Math.max(2, Math.hypot(p.x1 - p.x0, p.y1 - p.y0) / Math.max(1, p.dur)), D0 = Math.max(0.025, Math.min(0.1, 0.4 / speed));
    const young = 0.55, j0 = Math.ceil(Math.max(tFirst, t - life) / D0), j1 = Math.floor(Math.min(tLast, t - young) / D0);
    const sp = puffOf(tc);
    for (let j = j0; j <= j1; j++) {
      const tau = j * D0, age = t - tau, r = rad(age);
      // (the density: spacing ≈ 0.65 of a puff's radius — as it spreads, every other puff fades out over a doubling)
      const Ld = Math.max(0, Math.log2(0.65 * r / (speed * D0))), n = Math.floor(Ld), f = Ld - n;
      const lv = j === 0 ? 30 : 31 - Math.clz32(j & -j);
      if (lv < n) continue;
      const wgt = lv === n ? 1 - f : 1;
      if (wgt <= 0.01) continue;
      const T = peak * smooth(0.2, 1.4, age) * Math.pow(Math.max(0, 1 - age / life), 1.3);
      const spc = speed * D0 * Math.pow(2, n + 1) / (2 - f), over = Math.max(1, 2 * r / spc);
      const a = (1 - Math.pow(1 - Math.min(0.97, T), 1 / over)) * wgt;
      if (a < 0.003) continue;
      // (each puff its own size + a little sideways billow, seeded by its index: every frame the same puff, never a flicker)
      const h1 = ((j * 2654435761) >>> 0) / 4294967296, h2 = ((j * 2246822519 + 7) >>> 0) / 4294967296;
      const [px, py] = at(tau), [dx, dy] = drift(age), R = r * 2.1 * (0.82 + 0.4 * h1), wob = (h2 - 0.5) * r * 0.7 * smooth(0.5, 6, age);
      c.globalAlpha = a; c.drawImage(sp, px + dx - R, py + dy - R + wob, R * 2, R * 2);
    }
    c.globalAlpha = 1;
    // the young trail: two thin engine lines from the engines, merging into the trail (a smooth polyline, every 0.04 s)
    if (p.k < 1) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      const tA = Math.max(tFirst, t - young - 0.15), ex = hx - p.dir * p.len * 0.22, ey = hy + p.len * 0.05;
      // (after the last sample: on toward the engines' place now)
      const atH = tau => { if (tau <= tLast) return at(tau); const L = tr[tr.length - 1], u = Math.min(1, (tau - tLast) / Math.max(1e-3, t - tLast)); return [L.x + (ex - L.x) * u, L.y + (ey - L.y) * u]; };
      c.beginPath();
      for (const off of [-0.6, 0.6]) {
        let first = true;
        si = 0;
        for (let tau = tA; tau < t; tau += 0.04) {
          const age = t - tau, [px, py] = atH(tau), [dx, dy] = drift(age), o = off * sc * (1 - Math.min(1, age / young));
          if (first) { c.moveTo(px + dx, py + dy + o); first = false; } else c.lineTo(px + dx, py + dy + o);
        }
        c.lineTo(ex, ey + off * sc);
      }
      c.strokeStyle = rgb(tc, 0.42 * vis * (day > 0.5 ? 1 : 0.75)); c.lineWidth = 0.6 * sc; c.stroke();
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

  // ---- THE HELICOPTER (a function of the time since it started: every phone shows the same flight) — or a route from fly().
  // A route is [x, y, hold s, scale] points: it flies point to point (eased), holding where hold > 0 (a hover); scale = its depth (1 = the
  // near pass over the harbor, smaller = the far side — slower on screen too). Off-screen legs (the turn round behind the city) aren't drawn.
  // SKY-A — THE PATROL, the ORIGINAL route back (the owner, Oct 30 8:19 am: "round the harbor + back around"), TWO LOOPS: in low over the
  // harbor from one side, a look over it (the searchlight sweeping the water at night), out the other side; round behind the city; back
  // along the FAR side (smaller, higher, a short look); round again — THE CITY TIMETABLE's helicopter.patrol (loops, hovers, the turn).
  // SKY-B — A SLOW CIRCLE ROUND THE CITY (the owner's SKY-A review, Oct 30 12:32 pm: "too FAR away + HOVERS in place too much"): CLOSER —
  // the NEAR pass low over the harbor's water in front of the skyline at ~1.6× the old size, under every skyline sign that hangs near it
  // (the SIGNAL blade, the roof signs; the near pieces — OVERCLOCK, the WAIT / WALK lantern, the promenade's trees — stand in FRONT of it,
  // as they would); then round BEHIND THE TOWERS (the far pass, smaller + higher, drawn in the sky layer: the skyline hides it as it passes,
  // its lights wink through the gaps); and back — LOOPS times, MOVING most of the time. Now + then on a near pass it STOPS when it "sees"
  // something: it slows into a hover and its searchlight swings onto a spot — a BOAT, the far quay's ROOFS (it climbs a little first), the
  // WATER, the PROMENADE — holds there a few seconds, then moves on (beam0 / front). By day the same flight; a stop is a hover's look.
  // Every number in THE CITY TIMETABLE's helicopter.patrol. A route point: [x, y, hold s, scale, { look, behind, v (a speed ×) }].
  function heliPlan(s, start, seed) {
    const wl = s.lanes && s.lanes.water;
    if (!wl) return null;
    const P = knob('helicopter.patrol'), n = airLook(s.L).dark > 0.5 ? 1 : 0, dir = seed % 2 ? 1 : -1;
    const len = 28 * K * P.near, top = len * 0.36, bot = len * 0.26, avoid = (s.avoidSky || []).filter(r => r && r.w > 0 && r.h > 0), occ = (s.heliOcc || []).filter(r => r && r.w > 0 && r.h > 0);
    // the near band: over the water, as low as it allows, under every skyline sign that hangs down near it
    let y = wl.y + wl.h * P.nearY;
    for (let pass = 0; pass < 2; pass++) for (const r of avoid) if (r.y + r.h > wl.y - 90 * K && r.y + r.h < y + bot) y = Math.max(y, r.y + r.h + top + 3);
    y = Math.min(y, wl.y + wl.h - bot * 0.4);
    // the far pass: BEHIND the towers — over the lowest roofs, a share of the way up to the tallest crowns (seen over the low roofs, hidden
    // by every tower taller than that)
    const sk = (s.skyline || []).filter(v => v > 0), low = sk.length ? sk.reduce((a, v) => (v > a ? v : a), 0) : wl.y - 60 * K, hi = sk.length ? sk.reduce((a, v) => (v < a ? v : a), 1e9) : low - 160 * K;
    const fy = Math.min(wl.y - 30 * K, low - 10 * K - (low - hi) * P.farUp), far = P.far / P.near;
    const inX = dir > 0 ? -len : W + len, outX = dir > 0 ? W + len : -len, route = [];
    const rnd = i => { let h = (Math.imul(seed | 0, 2654435761) + Math.imul(i + 1, 40503)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h ^= h >>> 13; return (h % 100000) / 100000; };
    const KINDS = ['boat', 'roof', 'water', 'promenade'];
    // (a roof stop climbs over the far quay's roofs — only where no skyline sign hangs over that spot; else it looks at the water)
    const roofY = wl.y - P.roofUp * K, clearAt = (x, yy) => !avoid.some(r => r.x < x + len * 0.66 && r.x + r.w > x - len * 0.66 && r.y + r.h > yy - top - 3 && r.y < yy + bot);
    for (let i = 0; i < P.loops[n]; i++) {
      route.push([inX, y - 6 * K, 0, 1]);
      const nS = rnd(i * 9 + 1) < P.twoStops[n] ? 2 : 1;
      for (let j = 0; j < nS; j++) {
        const u = nS === 1 ? 0.36 + 0.28 * rnd(i * 9 + 2) : (j === 0 ? 0.2 : 0.6) + 0.18 * rnd(i * 9 + 3 + j);
        const x = dir > 0 ? W * u : W * (1 - u);
        let kind = KINDS[Math.floor(rnd(i * 9 + 5 + j) * KINDS.length) % KINDS.length];
        if (kind === 'roof' && !clearAt(x, roofY)) kind = 'water';
        // (MODELS — the owner: the first close pass's HOVER sat right BEHIND THE SPEAKEASY: a stop whose craft a near piece would hide (the
        // speakeasy + its roof billboard — s.heliOcc) climbs ABOVE it into open sky — over every sign there too — and looks down at the
        // promenade from up there; always visible)
        let sy = kind === 'roof' ? roofY : y, over = false;
        for (let pass = 0; pass < 3; pass++) for (const r of [...occ, ...avoid]) if (r.x < x + len * 0.62 && r.x + r.w > x - len * 0.62 && r.y < sy + bot && r.y + r.h > sy - top && (occ.includes(r) || over)) { sy = r.y - bot - 6 * K; over = true; }   // (ATM-A: 4 → 6 pt — the hover's bob (±1.6) clear too)
        if (over) kind = 'promenade';
        route.push([x, sy, P.stop[n] * (0.85 + 0.3 * rnd(i * 9 + 7 + j)), 1, { look: kind, id: `${i}.${j}`, over }]);
      }
      route.push([outX, y - 12 * K, P.turn[n], 1]);
      route.push([outX, fy, 0, far, { behind: true, v: P.farV }], [inX, fy - 8 * K, i < P.loops[n] - 1 ? P.turn[n] : 0, far, { behind: true, v: P.farV }]);
    }
    clearLegs(route, occ, len, top, bot);
    return { start, route, dir, spr: null, sprKey: '', len, own: false, sp: P.speed * K, occKey: occKeyOf(s), seed, occRef: s.heliOcc, avRef: s.avoidSky };
  }
  /** the near pieces' rects as a key — a route planned before they were all registered (a slow phone's first seconds) re-plans */
  function occKeyOf(s) {
    const r4 = r => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
    return `${(s.heliOcc || []).filter(r => r && r.w > 0).map(r4).join(';')}|${(s.avoidSky || []).filter(r => r && r.w > 0).map(r4).join(';')}|${s.lanes && s.lanes.water ? Math.round(s.lanes.water.y) : '-'}`;
  }
  // ATM-C — THE LEGS CLEAR THE NEAR PIECES TOO (the owner, Oct 31: "the hover is STILL behind the billboard / the speakeasy" — the hover sat
  // above the billboard, but the leg OUT of it dived straight back down through the billboard + the speakeasy's roof, and the low pass left
  // the screen behind the speakeasy): a near leg to / from an OFF-SCREEN point (the way in, the way out) whose straight line would pass
  // behind a near piece (s.heliOcc) gets its off-screen end RAISED until the line clears that piece's top (the craft's belly + 6 pt) — one
  // straight eased leg (a waypoint would stop it: every leg eases in + out), climbing as it nears the speakeasy and leaving over its roof.
  function clearLegs(route, occ, len, top, bot) {
    if (!occ.length) return;
    const half = len * 0.5, pad = 6 * K, off = x => x < 0 || x > W;
    for (let i = 0; i < route.length - 1; i++) {
      const A = route[i], B = route[i + 1];
      if ((A[4] && A[4].behind) || (B[4] && B[4].behind) || (off(A[0]) && off(B[0]))) continue;
      if (!off(A[0]) && !off(B[0])) {
        // (a leg between two ON-SCREEN points — the hover above the billboard → a low stop over the water (WebKit's fresh load, ATM-C): its
        // straight line dived through the billboard. The LOWER end rises to the piece's clearing height: the craft crosses level, then
        // looks down from there)
        for (const r of occ) {
          const need = r.y - bot - pad;
          let hit = false;
          for (let k = 0; k <= 24 && !hit; k++) { const x = A[0] + (B[0] - A[0]) * k / 24, y = A[1] + (B[1] - A[1]) * k / 24; hit = x + half * 0.6 > r.x && x - half * 0.6 < r.x + r.w && y > need + 1 && y - top < r.y + r.h; }
          if (!hit) continue;
          const lo = A[1] > B[1] ? A : B;
          lo[1] = Math.min(lo[1], need); if (lo[4] && lo[2] > 0) lo[4].over = true;
        }
        continue;
      }
      const O = off(B[0]) ? B : A, I = O === B ? A : B;                 // O: the off-screen end (raised), I: the on-screen end (kept)
      for (let pass = 0; pass < 2; pass++) for (const r of occ) {
        // where the craft first enters the rect's span coming from I toward O
        const xe = O[0] < I[0] ? r.x + r.w + half * 0.6 : r.x - half * 0.6;
        const need = r.y - bot - pad;
        if ((xe - I[0]) * (O[0] - I[0]) <= 0) {
          // (the on-screen end is already over the piece — a hover above the billboard: level out from there, never down through it)
          if (I[0] + half * 0.6 > r.x && I[0] - half * 0.6 < r.x + r.w && O[1] > need) O[1] = Math.max(need - 90 * K, Math.min(O[1], Math.max(I[1], need)));
          continue;
        }
        const at = I[1] + (O[1] - I[1]) * (xe - I[0]) / (O[0] - I[0]);
        if (at <= need) continue;
        // (the line through I + that point, carried on to O's x; too steep a climb (a low stop right beside the piece) → the STOP itself
        // hovers at the clearing height and the leg leaves level from there)
        const want = I[1] + (need - I[1]) * (O[0] - I[0]) / (xe - I[0]);
        if (want >= need - 90 * K) O[1] = Math.min(O[1], want);
        else { if (I[2] > 0) { I[1] = Math.min(I[1], need); if (I[4]) I[4].over = true; } O[1] = Math.min(O[1], need); }
      }
    }
  }
  /** ATM-C — the near pieces' rects changed after the flight was planned (a slow phone registers the billboard after the patrol starts):
   *  plan again from the same start + seed and take the new route from the point AFTER the leg it's on (the leg itself kept: no jump) */
  function replanHeli(s, e) {
    heli.occRef = s.heliOcc; heli.avRef = s.avoidSky;
    const k = occKeyOf(s); if (k === heli.occKey) return;
    const h = heliPlan(s, heli.start, heli.seed); if (!h || h.route.length !== heli.route.length) return;
    const i = segAt(heli, e);
    heli.route = heli.route.slice(0, i + 2).concat(h.route.slice(i + 2)); heli.occKey = k; heli.replans = (heli.replans || 0) + 1;
  }
  /** the route point whose hold or outgoing leg the craft is in at e (s) */
  function segAt(h, e) {
    const sp = h.sp || 52 * K; let tt = e;
    for (let i = 0; i < h.route.length - 1; i++) {
      const A = h.route[i], B = h.route[i + 1]; tt -= A[2] || 0; if (tt < 0) return i;
      tt -= Math.hypot(B[0] - A[0], B[1] - A[1]) / (sp * ((A[3] || 1) + (B[3] || 1)) / 2 * ((A[4] && A[4].v) || 1)); if (tt < 0) return i;
    }
    return h.route.length - 1;
  }
  /** a route's whole length (s): its legs at their speed + its holds (the debug readout + the tests: a patrol's loops) */
  function routeDur(h) {
    const sp = h.sp || 52 * K; let t = 0;
    for (let i = 0; i < h.route.length; i++) { const A = h.route[i], B = h.route[i + 1]; t += A[2] || 0; if (B) t += Math.hypot(B[0] - A[0], B[1] - A[1]) / (sp * ((A[3] || 1) + (B[3] || 1)) / 2 * ((A[4] && A[4].v) || 1)); }
    return t;
  }
  /** where the helicopter is at time e (s since its start): { x, y, dir, hover (0..1), sc (its depth scale), vx (pt/s), done, behind, look,
   *  stop: { id, t (s into the hover), hold } } */
  function heliAt(h, e) {
    const sp = h.sp || 52 * K;
    let tt = e;
    for (let i = 0; i < h.route.length - 1; i++) {
      const A = h.route[i], B = h.route[i + 1], [ax, ay, hold] = A, [bx, by] = B, as = A[3] || 1, bs = B[3] || 1, mA = A[4] || null, mB = B[4] || null;
      const hdir = i > 0 ? (ax >= h.route[i - 1][0] ? 1 : -1) : h.dir;          // (a hover keeps the heading it arrived with)
      if (tt < hold) return { x: ax + Math.sin(tt * 0.7) * 2.5 * K * as, y: ay + Math.sin(tt * 1.3) * 1.6 * K * as, dir: hdir, hover: 1, sc: as, vx: 0, done: false, behind: !!(mA && mA.behind), look: mA && mA.look ? mA.look : null, stop: mA && mA.look ? { id: mA.id, t: tt, hold } : null };
      tt -= hold;
      const d = Math.hypot(bx - ax, by - ay), dur = d / (sp * (as + bs) / 2 * ((mA && mA.v) || 1));
      if (tt < dur) { const k = tt / dur, ek = k * k * (3 - 2 * k), dir = bx > ax ? 1 : bx < ax ? -1 : hdir; return { x: ax + (bx - ax) * ek, y: ay + (by - ay) * ek, dir, hover: 0, sc: as + (bs - as) * ek, vx: (bx - ax) * 6 * k * (1 - k) / Math.max(1e-3, dur), done: false, behind: !!(mA && mA.behind && mB && mB.behind), look: null, stop: null }; }
      tt -= dur;
    }
    const last = h.route[h.route.length - 1], mL = last[4] || null;
    if (last[2] && tt < last[2]) return { x: last[0], y: last[1], dir: h.dir, hover: 1, sc: last[3] || 1, vx: 0, done: false, behind: !!(mL && mL.behind), look: null, stop: null };
    return { x: last[0], y: last[1], dir: h.dir, hover: 0, sc: last[3] || 1, vx: 0, done: true, behind: false, look: null, stop: null };
  }
  // SKY-A — THE BREAK FLIGHT drifts BACK AND FORTH over the crowd (core/harbor-heli.js#breakDrift, on the clock: every phone the same); it
  // TURNS to face where it's going — a yaw through its narrow head-on profile at each end of a drift (|vx| low), never a flip
  function breakAt(h, e, nowS) {
    const p = heliAt(h, e), B = h.brk;
    if (!B || !p.hover) return { ...p, pitch: p.hover ? 0 : 0.07 * p.dir * Math.min(1, Math.abs(p.vx) / (40 * K)), vmax: 40 * K };
    const u = breakDrift(nowS, B) * h.dir, du = (breakDrift(nowS + 0.05, B) - breakDrift(nowS - 0.05, B)) * h.dir / 0.1;
    const vx = du * B.A, vmax = Math.max(1, B.A * 2 * Math.PI / knob('helicopter.break').sweepPeriod);
    // (it tilts toward where it moves: the rotor leads, the nose dips on the way)
    return { ...p, x: p.x + u * B.A, vx, vmax, pitch: 0.06 * Math.max(-1, Math.min(1, vx / vmax)) };
  }
  // THE TURN (SKY-A): the craft faces where it flies — when it reverses, it YAWS round through its narrow head-on profile (the heading's
  // cos as the sprite's width, never under 0.2: the cabin's round front) at a helicopter's pace (~1.4 s for the half turn); it keeps its
  // heading while it hovers or creeps. A state per flight (the frame's own time), so it never jumps.
  function turn(h, p, e) {
    if (h.th == null) { h.th = h.dir > 0 ? 0 : Math.PI; h.thE = e; }
    const dt = Number.isFinite(h.thE) ? Math.max(0, Math.min(0.1, e - h.thE)) : 0; h.thE = e;   // (MODELS: a heading set before the model loaded has no time yet)
    const thr = 0.22 * (p.vmax || 40 * K);
    // (MODELS — THE PATROL TURNS IN 3D: on a stop it turns ~35° toward the viewer as it looks (the baked views: its cabin's front shows), and
    // back onto its heading as it moves on; the break's flight as before — through the head-on view at each end of a drift)
    const want = p.patrol ? (p.hover ? (p.dir > 0 ? 0.6 : Math.PI - 0.6) : (p.dir > 0 ? 0 : Math.PI))
      : p.vx > thr ? 0 : p.vx < -thr ? Math.PI : !p.hover && p.dir ? (p.dir > 0 ? 0 : Math.PI) : h.th;
    const step = (Math.PI / 1.4) * dt, d = want - h.th;
    h.th += Math.abs(d) <= step ? d : Math.sign(d) * step;
    const c = Math.cos(h.th);
    return Math.abs(c) < 0.2 ? (c < 0 ? -0.2 : 0.2) : c;
  }
  /** the craft's sprite in this light — ONE (facing +x; the heading is a mirror on draw), rebuilt only when the hour's light moves on */
  function heliSprite(h, look) {
    const key = `${Math.round(look.day * 8)}${Math.round(look.golden * 8)}${Math.round(look.dark * 8)}`;
    if (!h.spr || key !== h.sprKey) { if (h.spr) h.spr.cv.width = 0; h.spr = chopper(h.len, look, 1, dpr, true); h.sprKey = key; }
    return h.spr;
  }
  function drawHeli(c, s, look, layer = 'city') {
    if (!heli) return null;
    const e = (s.now - heli.start) / 1000;
    if (e < 0) return null;
    if (!heli.own && heli.mode !== 'break' && heli.occKey != null && (heli.occRef !== s.heliOcc || heli.avRef !== s.avoidSky)) replanHeli(s, e);
    const p = heli.mode === 'break' ? breakAt(heli, e, s.now / 1000) : { ...heliAt(heli, e), yaw: 0, pitch: 0 };
    if (p.done) { if (heli.spr) heli.spr.cv.width = 0; if (heli.mspr) heli.mspr.width = 0; heli = null; return null; }
    if (heli.mode !== 'break') { p.pitch = p.hover ? 0 : 0.07 * p.dir * Math.min(1, Math.abs(p.vx) / (40 * K)); p.patrol = true; p.yaw = heliModel ? turn(heli, p, e) : p.dir; if (!heliModel) heli.th = p.dir > 0 ? 0 : Math.PI; } else p.yaw = turn(heli, p, e);
    const L = heli.len, sc = p.sc || 1, t = s.t, ext = L * sc * 0.8;
    // (off-screen — the turn round behind the city: not drawn, no beam)
    if (p.x < -ext || p.x > W + ext) return { x: p.x, y: p.y, dir: p.dir, hover: 0, off: true, e, sc, behind: !!p.behind };
    // (SKY-B: the far pass is drawn in the SKY layer, behind the towers; the near pass after the city — each layer draws only its own)
    if ((layer === 'sky') !== !!p.behind) return { x: p.x, y: p.y, dir: p.dir, hover: p.hover, off: true, e, sc, behind: !!p.behind };
    if (heliModel) return drawModel(c, s, look, p, e, L, sc, t);
    const S = heliSprite(heli, look), yw = p.yaw || p.dir;
    c.save(); c.translate(p.x, p.y); c.rotate(p.pitch || 0); c.scale(sc * yw, sc);
    c.drawImage(S.cv, -S.w / 2, -S.oy, S.w, S.h);
    // THE ROTOR: a motion-blurred disc seen edge-on (a flat soft ellipse) + two blade streaks flicking across it — never squashed by the
    // yaw (the disc is round: it stays as wide head-on)
    c.scale(1 / Math.max(0.2, Math.abs(yw)), 1);
    const ry = -L * 0.27, rw = L * 0.72;
    const day = clamp01(look.day + look.golden + look.dawn) * (1 - look.dark);
    const rc = mix([30, 30, 44], [70, 74, 90], day), rk = rgb(rc, 0), rk2 = rgb(rc, 0.22), rk3 = rgb(rc, 0.3);
    if (!heli.rotor || heli.rotorKey !== rk3) { heli.rotorKey = rk3; const g = c.createLinearGradient(-rw, 0, rw, 0); g.addColorStop(0, rk); g.addColorStop(0.2, rk2); g.addColorStop(0.5, rk3); g.addColorStop(0.8, rk2); g.addColorStop(1, rk); heli.rotor = g; }
    c.fillStyle = heli.rotor; c.beginPath(); c.ellipse(0, ry, rw, Math.max(0.8, L * 0.035), 0, 0, TAU); c.fill();
    if (s.motion) { const ph = (t * 7.3) % 1; c.fillStyle = rgb(rc, 0.55); for (const o of [ph, (ph + 0.5) % 1]) { const bx = (o * 2 - 1) * rw * Math.abs(Math.cos(o * Math.PI)); c.fillRect(bx - rw * 0.35, ry - 0.45, rw * 0.7, 0.9); } }
    c.scale(Math.max(0.2, Math.abs(yw)), 1);
    // the tail rotor: a small blurred disc on the fin
    const tx = -L * 0.6, ty = -L * 0.06;
    c.fillStyle = rgb(rc, 0.3); c.beginPath(); c.arc(tx, ty, L * 0.085, 0, TAU); c.fill();
    // the lights at night: the red beacon on the boom, the nav lights, a white tail light
    const lightA = clamp01((look.dark + look.golden * 0.3) * 1.3);
    if (lightA > 0.03) {
      c.globalCompositeOperation = 'lighter';
      const bk = s.motion ? Math.max(0, Math.sin(t * TAU / 1.1)) ** 3 : 0.5, r = 3.2 * K * Math.max(1, L / (28 * K)) ** 0.6;   // (SKY-A: a bigger craft, bigger lights)
      // (6b: at night it reads by its lights — the searchlight's lamp under its belly, a warm cockpit glow)
      c.globalAlpha = lightA * 0.9; c.drawImage(glow(240, 246, 255), L * 0.08 - r * 1.4, L * 0.1 - r * 1.4, r * 2.8, r * 2.8);
      c.globalAlpha = lightA * 0.55; c.drawImage(glow(255, 200, 140), L * 0.25 - r, -L * 0.08 - r, r * 2, r * 2);
      c.globalAlpha = lightA * bk; c.drawImage(glow(255, 50, 60), -L * 0.05 - r * 1.6, -L * 0.2 - r * 1.6, r * 3.2, r * 3.2);
      c.globalAlpha = lightA * 0.8; c.drawImage(glow(...((p.yaw || p.dir) > 0 ? [60, 255, 140] : [255, 50, 60])), L * 0.05 - r, L * 0.02 - r, r * 2, r * 2);
      c.globalAlpha = lightA * 0.6; c.drawImage(glow(255, 255, 255), tx - L * 0.03 - r * 0.8, ty - r * 0.8, r * 1.6, r * 1.6);
    }
    c.restore();
    // (the belly's lamp on screen: the beam's start)
    const bx = L * 0.08 * sc * yw, by = L * 0.12 * sc, cs = Math.cos(p.pitch || 0), sn = Math.sin(p.pitch || 0);
    return { x: p.x + bx * cs - by * sn, y: p.y + bx * sn + by * cs, cx: p.x, cy: p.y, dir: p.dir, hover: p.hover, e, sc, yaw: +yw.toFixed(2), behind: !!p.behind, look: p.look || null, stop: p.stop || null };
  }
  // MODELS — THE BAKED CRAFT at heading th (rad; its two nearest views cross-faded — never a stepped turn), its rotors + lights live
  function drawModel(c, s, look, p, e, L, sc, t) {
    const M = heliModel.meta, N = M.yaws, th = heli.th != null ? heli.th : (p.dir > 0 ? 0 : Math.PI);
    const deg = ((th * 180 / Math.PI) % 360 + 360) % 360, fi = deg / (360 / N), i0 = Math.floor(fi) % N, i1 = (i0 + 1) % N, f = fi - Math.floor(fi);
    const k = (L * sc) / M.px;                          // (pt a sprite px: the fuselage's length 2 units = M.px px = L × sc pt)
    const F0 = M.frames[i0], F1 = M.frames[i1], lerpP = key => [F0[key][0] + (F1[key][0] - F0[key][0]) * f, F0[key][1] + (F1[key][1] - F0[key][1]) * f];
    // (the anchor: under the rotor's hub by the drawn craft's own rotor height (0.3 L) — the model fills the same box: the planners' clearances hold)
    const hub = lerpP('hub'), lamp = lerpP('lamp'), ax = hub[0], ay = hub[1] + 0.3 * M.px;
    const n = clamp01(look.dark * 1.2), dd = 1 - n, pitch = (p.pitch || 0) * Math.cos(th);
    c.save(); c.translate(p.x, p.y); c.rotate(pitch);
    // (THE SPRITE, cached: the two nearest views × the hour's two lights blended ONCE into a small canvas at this size — rebuilt only when
    // the heading, the light or the size moves on (the turn quantised to sixths): one drawImage a frame, as the drawn chopper was)
    const fq = Math.round(f * 6) / 6, nq = Math.round(n * 6) / 6, sz = Math.max(4, Math.round(L * sc)), d = Math.min(3, dpr * 1.25), key = `${i0}|${i1}|${fq}|${nq}|${sz}|${d}`;
    if (!heli.mspr || heli.msprKey !== key) {
      const kk = sz / M.px, w = Math.ceil(M.fw * kk * d), hgt = Math.ceil(M.fh * kk * d);
      if (!heli.mspr) heli.mspr = mk(w, hgt); else if (heli.mspr.width !== w || heli.mspr.height !== hgt) { heli.mspr.width = w; heli.mspr.height = hgt; }
      const x = safeCtx(heli.mspr); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, hgt); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      const blit = (i, a) => { if (a <= 0.003) return; const cx = (i % M.cols) * M.fw, cy = Math.floor(i / M.cols) * M.fh;
        for (const [lt, wt] of [['day', 1 - nq], ['night', nq]]) if (wt > 0.003 && heliModel.sheets[lt]) { x.globalAlpha = a * wt; x.drawImage(heliModel.sheets[lt], cx, cy, M.fw, M.fh, 0, 0, w, hgt); } };
      // (the light: night over day; the two views: the nearer one whole, the next one laid over it by how far the heading has come)
      blit(i0, 1); blit(i1, fq); x.globalAlpha = 1;
      heli.msprKey = key; heli.msprK = kk;
    }
    c.drawImage(heli.mspr, -ax * heli.msprK, -ay * heli.msprK, M.fw * heli.msprK, M.fh * heli.msprK);
    const P = q => [(q[0] - ax) * k, (q[1] - ay) * k];
    // THE ROTORS (hidden in the bake): the main disc — round, seen a little from below (a thin ellipse), its blades flicking across; the
    // tail disc on the fin — face-on from the side, edge-on head-on
    const day = clamp01(look.day + look.golden + look.dawn) * (1 - look.dark);
    const rc = mix([34, 34, 48], [70, 74, 90], day), [hx, hy] = P(hub), R = (M.rotorR / M.lenM) * 2 * M.px * k * 0.5, ry = Math.max(0.8, R * Math.sin(M.elev * Math.PI / 180));
    if (!heli.rotorM || heli.rotorMKey !== `${rc}|${Math.round(R)}`) { heli.rotorMKey = `${rc}|${Math.round(R)}`; const g = c.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, rgb(rc, 0)); g.addColorStop(0.2, rgb(rc, 0.2)); g.addColorStop(0.5, rgb(rc, 0.3)); g.addColorStop(0.8, rgb(rc, 0.2)); g.addColorStop(1, rgb(rc, 0)); heli.rotorM = g; }
    c.save(); c.translate(hx, hy); c.fillStyle = heli.rotorM; c.beginPath(); c.ellipse(0, 0, R, ry, 0, 0, TAU); c.fill();
    if (s.motion) { const ph = (t * 7.3) % 1; c.strokeStyle = rgb(rc, 0.5); c.lineWidth = Math.max(0.8, R * 0.035); c.lineCap = 'round';
      for (const o of [ph, (ph + 0.5) % 1]) { const a = o * TAU, bx = Math.cos(a) * R, by = Math.sin(a) * ry; c.beginPath(); c.moveTo(-bx, -by); c.lineTo(bx, by); c.stroke(); } }
    c.restore();
    const [tx, ty] = P(lerpP('tail')), tr = (M.tailR / M.lenM) * 2 * M.px * k * 0.5;
    c.fillStyle = rgb(rc, 0.32); c.beginPath(); c.ellipse(tx, ty, Math.max(0.6, tr * Math.abs(Math.cos(th))), tr, 0, 0, TAU); c.fill();
    // THE LIGHTS at night: the searchlight's lamp under the belly, the red beacon on the engine deck, the nav light on the near side (green
    // flying right, red flying left), the white tail light
    const lightA = clamp01((look.dark + look.golden * 0.3) * 1.3);
    if (lightA > 0.03) {
      c.globalCompositeOperation = 'lighter';
      const bk = s.motion ? Math.max(0, Math.sin(t * TAU / 1.1)) ** 3 : 0.5, r = 3.2 * K * Math.max(1, (L * sc) / (28 * K)) ** 0.6;
      const [lx, ly] = P(lamp), [bx2, by2] = P(lerpP('beacon')), [nx, ny] = P(lerpP('nose')), [tlx, tly] = P(lerpP('tailLight'));
      c.globalAlpha = lightA * 0.9; c.drawImage(glow(240, 246, 255), lx - r * 1.4, ly - r * 1.4, r * 2.8, r * 2.8);
      c.globalAlpha = lightA * bk; c.drawImage(glow(255, 50, 60), bx2 - r * 1.6, by2 - r * 1.6, r * 3.2, r * 3.2);
      c.globalAlpha = lightA * 0.8; c.drawImage(glow(...(Math.cos(th) >= 0 ? [60, 255, 140] : [255, 50, 60])), nx * 0.7 + lx * 0.3 - r, ny * 0.7 + ly * 0.3 - r, r * 2, r * 2);
      c.globalAlpha = lightA * 0.6; c.drawImage(glow(255, 255, 255), tlx - r * 0.8, tly - r * 0.8, r * 1.6, r * 1.6);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    c.restore();
    // (the belly's lamp on screen: the beam's start — the drawn craft's own point (within a couple of pt of the model's lamp): every planner +
    // clearance check sees the same geometry as before)
    const yw = Math.cos(th), lx0 = L * 0.08 * sc * yw, ly0 = L * 0.12 * sc, cs = Math.cos(pitch), sn = Math.sin(pitch);
    return { x: p.x + lx0 * cs - ly0 * sn, y: p.y + lx0 * sn + ly0 * cs, cx: p.x, cy: p.y, dir: p.dir, hover: p.hover, e, sc, yaw: +yw.toFixed(2), heading: Math.round(deg), behind: !!p.behind, look: p.look || null, stop: p.stop || null, model: true, w: Math.round(L * sc) };
  }
  // SKY-B — WHERE THE PATROL LOOKS on a stop (its searchlight's spot, screen pt): a boat (the nearest on the water, kept for the whole stop),
  // the far quay's roofs, the water, the promenade — or null (not stopped / by day: the moving beam's own spot). lk: how far the beam has
  // swung onto it (0 → 1 over the stop's first ~0.9 s, back over its last).
  function lookAt(h, s, waterY, waterTop) {
    if (!h || !h.stop || !h.look) return null;
    const { t: st, hold } = h.stop, lk = smooth(0, 0.9, st) * (1 - smooth(hold - 0.9, hold, st));
    if (lk <= 0.001) return null;
    const memo = heli.looks || (heli.looks = new Map()), d = h.dir || 1;
    let T = memo.get(h.stop.id);
    if (!T) {
      let kind = h.look, x = h.x + d * 16 * K, y = waterY;
      if (kind === 'boat') {
        const bs = (s.boatSpots ? s.boatSpots() : []).filter(b => b.x > 8 && b.x < W - 8 && Math.abs(b.x - h.x) < 150 * K && b.y > h.y + 6);
        const b = bs.sort((a, b2) => Math.abs(a.x - h.x) - Math.abs(b2.x - h.x))[0];
        if (b) { x = b.x; y = b.y - 2 * K; T = { kind, x, y, boat: b.id }; } else kind = 'water';
      }
      if (!T && kind === 'roof') T = { kind, x: h.x + d * 10 * K, y: waterTop - 9 * K };
      if (!T && kind === 'promenade' && s.promY && s.promY < (s.dockTop || H) - 8) T = { kind, x: h.x + d * 22 * K, y: s.promY };
      if (!T) T = { kind: 'water', x, y };
      memo.set(h.stop.id, T);
    }
    return { ...T, lk };
  }
  let lookNow = null, skyAt = -1, beamAng = null;

  let heliNow = null, heliBeamNow = null;
  // SKY-A — THE HELICOPTER's OWN COST (the craft + its beam, ms a drawn frame, smoothed): the &debug=1 readout + the phone bench
  let heliMs = 0, heliAcc = 0, heliT = null;
  const timed = (s, fn) => { if (s.t !== heliT) { if (heliT != null) heliMs += (heliAcc - heliMs) * 0.05; heliAcc = 0; heliT = s.t; } const t0 = performance.now(); fn(); heliAcc += performance.now() - t0; };
  function breakDraw0(c, s, crowd) {
    if (!heli || heli.mode !== 'break') return;
    const look = airLook(s.L);
    heliNow = drawHeli(c, s, look);
    const h = heliNow;
    if (!h || h.off || !crowd) return;
    const k = clamp01((look.dark - 0.35) * 2) * (s.L.fog > 0.6 ? 0.6 : 1) * clamp01(Math.min(h.e / 4, 1)), lv = tierVal('heliBeam', tier);
    if (k < 0.02) return;
    // THE SWEEP ON THE BEAT: the pool across the dancers, a turn on every `sweepBeats`th downbeat (pulled a little toward the craft: the
    // cone stays a believable searchlight as it drifts); a slow drift between the floor's back + front
    const P = s.party || {}, bf = Number.isFinite(P.beatsF) ? P.beatsF : s.t * 2;
    const u = h.hover ? beatSweep(bf) : -h.dir * 0.6, mid = (crowd.x0 + crowd.x1) / 2, half = Math.max(12, (crowd.x1 - crowd.x0) / 2);
    const px = Math.max(crowd.x0, Math.min(crowd.x1, (mid + u * half) * 0.75 + h.x * 0.25));
    const py = crowd.y + Math.sin(Math.PI * bf / (2 * knob('helicopter.break').sweepBeats)) * (crowd.y1 - crowd.y0) * 0.35;
    const pr = (P.on > 0.3 && beamPair(P.palette, bf)) || null, rx = crowd.r * 1.25, ry = rx * 0.34;
    // (the colour as a PAIR of baked sprites: the bar's colour, + the next one's over the bar's last beat — added: the in-between shade)
    const each = (fn, a) => { if (!pr) { fn(beamArt(BEAM_WHITE), a); return; } if (pr.e < 0.999) fn(beamArt(pr.a), a * (1 - pr.e)); if (pr.e > 0.001) fn(beamArt(pr.b), a * pr.e); };
    c.save(); c.globalCompositeOperation = 'lighter';
    // (never over the dock: JOIN + HOST stay clean — the light stops at its top)
    c.beginPath(); c.rect(0, 0, W, s.dockTop || H); c.clip();
    if (lv >= 2) {   // THE CONE: a soft, wide searchlight — feathered all along its edges, opening from the lamp to a wide end over the pool
      const dx = px - h.x, dy = py - h.y, len = Math.hypot(dx, dy), wd = rx * 3.4;
      c.save(); c.translate(h.x, h.y); c.rotate(Math.atan2(dy, dx) - Math.PI / 2);
      each((A, a) => { c.globalAlpha = a; c.drawImage(A.cone, -wd / 2, 0, wd, len * 1.04); }, 0.55 * k);
      c.restore();
    }
    // THE POOL on the dancers: a soft wide ellipse on the floor + its glow up through the people drawn before it (they stand in it)
    each((A, a) => { c.globalAlpha = a; c.drawImage(A.pool, px - rx * 1.5, py - ry * 1.5, rx * 3, ry * 3); }, 0.75 * k);
    each((A, a) => { c.globalAlpha = a; c.drawImage(A.pool, px - rx * 0.9, py - rx * 1.25, rx * 1.8, rx * 1.55); }, 0.22 * k);
    c.globalAlpha = 0.16 * k; c.drawImage(beamArt(BEAM_WHITE).pool, px - rx * 0.7, py - ry * 0.7, rx * 1.4, ry * 1.4);
    if (lv >= 3) { c.globalAlpha = 0.9 * k; c.drawImage(glow(255, 255, 255), h.x - 3.5, h.y - 3.5, 7, 7); each((A, a) => { c.globalAlpha = a; c.drawImage(A.pool, h.x - 10, h.y - 10, 20, 20); }, 0.4 * k); }
    c.restore();
    heliBeamNow = { x: Math.round(px), y: Math.round(py), col: pr ? (pr.e < 0.5 ? pr.a : pr.b) : BEAM_WHITE, k: +k.toFixed(2), u: +u.toFixed(3) };
  }
  // the patrol's SEARCHLIGHT at night (SKY-B): from the belly — ahead + down while it flies, onto its spot on a stop (lookAt: it swings over
  // + holds there, a tighter, brighter pool) — NIGHT-C: on a PARTY night the party's neon colour (cross-faded bar by bar) swept ON THE BEAT
  // (core/harbor-heli.js — a smooth swing, never a strobe). part 'near' = after the near boats (the craft + the beam down to the railing),
  // 'front' = after the people (the beam's last stretch + its pool on the promenade, never over the dock)
  function beam0(c, s, waterY, part = 'near', waterTop = 0) {
    const h = heliNow;
    if (!h || h.off || !heli || heli.mode === 'break') { if (part === 'near') beamAng = null; return; }   // (NIGHT-C: a break's beam is breakDraw's — on the crowd)
    const look = airLook(s.L), k = clamp01((look.dark - 0.35) * 2) * (s.L.fog > 0.6 ? 0.6 : 1);
    if (k < 0.02) { if (part === 'near') lookNow = null; return; }
    const PT = s.party || {}, party = PT.on > 0.3 && s.motion, bf = Number.isFinite(PT.beatsF) ? PT.beatsF : 0;
    const sw = party ? beatSweep(bf) * 0.32 : s.motion ? Math.sin(h.e * 0.45) * 0.32 : 0.1;
    const pc = party ? beamColour(PT.palette, bf) : null, pr = party ? beamPair(PT.palette, bf) : null;
    // (MODELS — THE SEARCHLIGHT SWEEPS SMOOTHLY (the owner: it jerked / skipped): the angle the beam wants — ahead + down in flight, the
    // sweep on a stop / on the beat — reached by an eased follow every frame (never a jump as the craft slows into a hover or speeds off);
    // the 'front' part draws the very angle the 'near' part settled this frame)
    const want = Math.PI / 2 + (h.hover ? sw : -0.5 * h.dir);
    if (part === 'near') { const dts = Math.max(0, Math.min(0.1, (s.dt || 16) / 1000)); beamAng = beamAng == null || !s.motion ? want : beamAng + (want - beamAng) * (1 - Math.exp(-dts / 0.5)); }
    const ang = beamAng != null ? beamAng : want;
    const len0 = Math.max(30, waterY - h.y), mx = h.x + Math.cos(ang) * len0 / Math.max(0.3, Math.sin(ang)), my = waterY;
    const T = part === 'near' ? (lookNow = lookAt(h, s, waterY, waterTop)) : lookNow;
    const e = T ? T.lk * T.lk * (3 - 2 * T.lk) : 0, ex = mx + ((T ? T.x : mx) - mx) * e, ey = my + ((T ? T.y : my) - my) * e;
    const len = Math.max(20, Math.hypot(ex - h.x, ey - h.y)), spread = len * (0.16 - 0.05 * e);
    const stageY = s.stageY || H, dockTop = s.dockTop || H;
    if (part === 'front' && !(ey > stageY)) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.beginPath(); if (part === 'near') c.rect(0, 0, W, stageY); else c.rect(0, stageY, W, Math.max(0, dockTop - stageY)); c.clip();
    const g = c.createLinearGradient(h.x, h.y, ex, ey);
    const bc = pc || [235, 242, 255], bc2 = pc || [220, 232, 255];
    g.addColorStop(0, rgb(bc, 0.42 * k)); g.addColorStop(0.5, rgb(bc2, (0.14 + 0.06 * e) * k)); g.addColorStop(1, rgb(bc2, (0.06 + 0.08 * e) * k));
    c.fillStyle = g; c.beginPath(); c.moveTo(h.x - 1, h.y); c.lineTo(h.x + 1, h.y); c.lineTo(ex + spread, ey); c.lineTo(ex - spread, ey); c.closePath(); c.fill();
    // (the pool where it lands: the palette's own glow sprites, the in-between shade as the pair ADDED — never a canvas per shade; on a
    // fixed spot a tighter, brighter pool + a hot centre: "it's looking at THAT")
    const pool = (col, a) => { if (a < 0.003) return; c.globalAlpha = a; c.drawImage(glow(...col), ex - spread * 1.6, ey - spread * 0.35, spread * 3.2, spread * 0.7); };
    if ((part === 'near') === !(ey > stageY)) {
      if (pr) { pool(pr.a, (0.5 + 0.25 * e) * k * (1 - pr.e)); pool(pr.b, (0.5 + 0.25 * e) * k * pr.e); } else pool([230, 238, 255], (0.5 + 0.25 * e) * k);
      if (e > 0.02) { c.globalAlpha = 0.5 * e * k; c.drawImage(glow(255, 252, 240), ex - spread * 0.7, ey - spread * 0.2, spread * 1.4, spread * 0.4); }
    }
    if (part === 'near') { c.globalAlpha = 0.9 * k; c.drawImage(glow(255, 255, 255), h.x - 3, h.y - 3, 6, 6); }
    c.restore();
  }
  return {
    resize(w, h, hz) { if (w === W && h === H && hz === HZ) return; W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 402)); for (const p of planes) if (p.spr) p.spr.cv.width = 0; planes = []; train = null; sat = null; },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    /** the sky layer: planes in the free sky lanes, satellites at twilight, the helicopter. free: { 'sky-high': bool, 'sky-low': bool } */
    draw(c, s, free) {
      lastS = s;
      const { L, dt, force, motion } = s;
      const sec = dt / 1000, look = airLook(L);
      const hr = L.local ? L.local.h + L.local.mi / 60 : 20;
      // ---- planes: the district's traffic by the hour, on the free lanes (a sky event's lane is never shared; a heavy event
      // elsewhere thins the sky: fs.density)
      const dens = s.density ? Math.min(s.density['sky-high'], s.density['sky-low']) : 1;
      // (NEON PASS 5 — the owner: from the panel the planes "often don't show up": a forced plane waited 9 s after the last forced one
      // — PLANES then PLANE ON APPROACH got nothing — and for a free lane. A preview switched on resets the wait; a forced plane may
      // join a held lane and the planes already up)
      const fk = (force.has('planes') ? 'p' : '') + (force.has('approach') ? 'a' : '');
      if (fk !== forcedKind) { forcedKind = fk; forcedAt = -1e9; }
      let lanes = ['sky-high', 'sky-low'].filter(id => free[id] && s.lanes && s.lanes[id] && s.lanes[id].h >= 24);
      if (fk && !lanes.length) lanes = ['sky-high', 'sky-low'].filter(id => s.lanes && s.lanes[id] && s.lanes[id].h >= 24);
      const max = Math.floor((tier === 0 ? 1 : W > 800 ? 3 : 2) * dens);
      const rate = trafficRate(hr) * (look.wet ? 0.5 : 1) * (motion ? 1 : 0.6);
      nextPlane -= sec;
      const forcedPlane = !!fk && performance.now() - forcedAt > 9000;
      const known = !!(s.textRects && s.textRects.neon);              // never plan a path before the sign's place is known
      if ((forcedPlane || nextPlane <= 0) && lanes.length && planes.filter(p => p.k < 1).length < (forcedPlane ? Math.max(1, max) + 1 : max) && known) {
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
      // (NEON PASS 5 — the owner: "the SATELLITE TRAIN button does nothing": a forced train flew ONCE a page load — invisible by
      // day, where it burned its one go. Now a forced train comes again a few seconds after each pass, and shows in any sky)
      const trainForced = force.has('satellites');
      if (!trainForced && trainNight === 'forced') trainNight = '';
      if (known && free['sky-high'] && !train && (trainForced && performance.now() - trainGone > 3000 || (mode && clear && L.local && starlinkNight(L.local.y, L.local.m, L.local.d) && trainNight !== night && Math.random() < sec / 40))) {
        train = newTrain(s, trainForced ? (mode || 'evening') : mode); train.forced = trainForced; trainNight = trainForced ? 'forced' : night;
      }
      if (known && free['sky-high'] && !sat && ((force.has('sat') && Math.random() < sec / 2) || (mode && clear && (nextSat -= sec) <= 0))) { sat = newSat(s, force.has('sat') ? (mode || 'evening') : mode); nextSat = 300 + Math.random() * 300; }
      const satVis = clamp01(look.dark * 1.4), trainVis = train && train.forced ? Math.max(0.85, satVis) : satVis;
      if (train || sat) c.globalCompositeOperation = 'lighter';
      if (train) {
        train.k += sec / train.dur;
        const span = train.n * train.gap;
        for (let i = 0; i < train.n; i++) { const u = (train.k * (train.len + span) - i * train.gap) / train.len; if (u < 0 || u > 1) continue; satPoint(c, train.x0 + (train.x1 - train.x0) * u, train.y0 + (train.y1 - train.y0) * u, 0.78 * trainVis * (train.forced ? Math.max(0.7, satAlpha(u, train.mode, train.shadow)) : satAlpha(u, train.mode, train.shadow)) * Math.min(1, u / 0.03, (1 - u) / 0.03), s.moonAt); }
        if (train.k * (train.len + span) - span > train.len) { train = null; trainGone = performance.now(); }
      }
      if (sat) { sat.k += sec / sat.dur; const u = sat.k; satPoint(c, sat.x0 + (sat.x1 - sat.x0) * u, sat.y0 + (sat.y1 - sat.y0) * u, sat.b * satVis * satAlpha(u, sat.mode, sat.shadow) * Math.min(1, u / 0.04, (1 - u) / 0.04), s.moonAt); if (sat.k >= 1) sat = null; }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    /** 6b: the helicopter, over the harbor in front of the skyline (skyfx.city: after the city's layers, before the water) — not while it
     *  flies a DANCE BREAK (NIGHT-C: then it's over the crowd, drawn after the people: breakDraw) */
    heliDraw(c, s) { if (!heli) heliNow = null; },   // (SKY-B: the patrol draws in the sky layer (behind the towers) + after the near boats — heliSky / heliNear)
    /** SKY-B — the patrol's FAR pass, BEHIND THE TOWERS: drawn in the sky layer (the skyline then hides it as it passes) */
    heliSky(c, s) { if (!heli || heli.mode === 'break') return; timed(s, () => { const r = drawHeli(c, s, airLook(s.L), 'sky'); if (r && !r.off) { heliNow = r; skyAt = s.t; } }); },
    /** SKY-B — the patrol's NEAR pass, low over the near water (after the near boats; the railing, the promenade's trees + the near signs
     *  stand in front of it) + its searchlight down to the water / onto its spot. waterY: the near water line, waterTop: the far quay's */
    heliNear(c, s, waterY, waterTop) {
      if (!heli) { heliNow = null; lookNow = null; return; }
      if (heli.mode === 'break') return;
      timed(s, () => { const r = drawHeli(c, s, airLook(s.L), 'city'); if (!(r && r.off && skyAt === s.t)) heliNow = r; if (heliNow && !heliNow.off && !heliNow.behind) beam0(c, s, waterY, 'near', waterTop); else lookNow = null; });
    },
    /** SKY-B — after the people: the searchlight's last stretch + its pool on the PROMENADE (a stop that looks at it) */
    heliFront(c, s, waterY, waterTop) { if (heliNow && !heliNow.off && !heliNow.behind && heli && heli.mode !== 'break' && lookNow) timed(s, () => beam0(c, s, waterY, 'front', waterTop)); },
    lookNow: () => (lookNow ? { kind: lookNow.kind, x: Math.round(lookNow.x), y: Math.round(lookNow.y), lk: +lookNow.lk.toFixed(2), boat: lookNow.boat || null } : null),
    /**
     * NIGHT-C — THE HELICOPTER UP FOR THE DANCE BREAK (core/harbor-heli.js#breakFlight; the owner, Oct 29): in from a side so it is over the
     * crowd as the song starts, there the WHOLE song, off the other side after it — it arrives + leaves by flying (a patrol up at the time
     * flies over from where it is). SKY-A (the owner, Oct 30 8:19 am): LOWER + CLOSER — bigger, over the water in front of the skyline, never
     * in front of a sign (skyfx.heliBreak picks the band) — DRIFTING BACK AND FORTH across the band the whole song (breakAt).
     * f: the break's flight { id, arrive, leave } (abs s); aim: { x, y } the band's middle (pt); band: { x0, x1 } its drift's span.
     */
    breakFly(s, f, aim, band) {
      if (!f || !aim) return;
      if (heli && heli.brkId === f.id) return;
      const sp = 52 * K, len = BREAK_LEN * K, from = heli && !heli.own && heli.mode !== 'break' && heliNow && !heliNow.off ? { x: heliNow.x, y: heliNow.y - len * 0.12 } : null;
      const dir = from ? (aim.x >= from.x ? 1 : -1) : hashString(f.id) % 2 ? 1 : -1;
      const entry = from ? [from.x, from.y] : [dir > 0 ? -70 : W + 70, aim.y - 14 * K];
      const travel = Math.hypot(aim.x - entry[0], aim.y - entry[1]) / sp, arriveMs = f.arrive * 1000;
      const start = from ? s.now : arriveMs - travel * 1000, hold = Math.max(1, f.leave - Math.max(f.arrive, start / 1000 + travel));
      if (heli && heli.spr) heli.spr.cv.width = 0;
      let A = band ? Math.max(0, (band.x1 - band.x0) / 2) : 0;
      // (MODELS — the drift's ENDS clear every sign too: at its far ends the craft's box (±0.7 L wide, −0.36 → +0.26 L tall round its
      // centre) once just reached the WAIT / WALK lantern — a latent near-miss the e2e caught only when its samples landed on an end)
      for (const r of (s.avoidSky || [])) {
        if (!r || !(r.w > 0) || r.y > aim.y + len * 0.26 || r.y + r.h < aim.y - len * 0.36) continue;
        if (r.x + r.w <= aim.x) A = Math.min(A, Math.max(0, aim.x - len * 0.7 - (r.x + r.w) - 2));
        else if (r.x >= aim.x) A = Math.min(A, Math.max(0, r.x - (aim.x + len * 0.7) - 2));
      }
      heli = { start, route: [[entry[0], entry[1], 0], [aim.x, aim.y, hold], [dir > 0 ? W + 80 : -80, aim.y - 18 * K, 0]], dir, spr: null, sprKey: '', len, own: false, mode: 'break', brkId: f.id,
        brk: { arrive: f.arrive, leave: f.leave, A } };
      // (THE PRE-BAKE: the craft in tonight's light + the beam in every palette colour, now — 16 s before the song — never on its first swing)
      loadHeliModel(); heliSprite(heli, airLook(s.L));
      const pal = (s.party && s.party.palette) || [];
      for (const col of [BEAM_WHITE, ...pal]) beamArt(col);
    },
    /** the break's helicopter + its BEAM ON THE CROWD (after the people: they stand in its light) — crowd: { x0, x1 (the dancers' span, pt),
     *  y (the floor's middle), y0 / y1 (the floor's back / front), r (the pool's radius, pt) }; s.party: the party's palette + beat */
    breakDraw(c, s, crowd) { if (!heli || heli.mode !== 'break') return; timed(s, () => breakDraw0(c, s, crowd)); },
    heliMs: () => +heliMs.toFixed(3),
    breakOn: () => !!(heli && heli.mode === 'break'),
    breakLen: () => BREAK_LEN * K,
    beamNow: () => heliBeamNow,
    /** the helicopter's SEARCHLIGHT at night: part 'upper' (with the helicopter, above the waterline) · 'lower' (after the water: the
     *  rest of the cone + its pool on the water) — waterTop: the water's top line */
    beam() { /* (SKY-B: the searchlight draws with the near pass — heliNear + heliFront) */ },
    /** start the helicopter's flight now (the scheduler's event, &force=helicopter): start = clock ms, seed: its side */
    heli(s, start, seed) { if (heli && !heli.own) return; const h = heliPlan(s, start, seed); if (h) { heli = h; loadHeliModel(); heliSprite(heli, airLook(s.L)); for (const col of (s.party && s.party.palette) || []) glow(...col); } },   // (SKY-A: pre-baked — the craft + tonight's beam colours, never on its first swing)
    /** HOOK (Part 10: the party yacht's landing): fly a route of [x, y, hold s] points (screen pt) from now; land: hold at the last */
    fly(s, route, { land = false } = {}) { if (!route || route.length < 2) return; const r = route.map(p => [p[0], p[1], p[2] || 0]); if (land) r[r.length - 1][2] = 1e6; heli = { start: s.now, route: r, dir: r[1][0] >= r[0][0] ? 1 : -1, spr: null, sprKey: '', len: 28 * K, own: true }; },
    heliOn: () => !!heli,
    /** ATM-C (tests): the patrol's route for a seed, planned from this frame's near pieces — [x, y, hold, behind] points (null before a frame) */
    planFor: seed => { if (!lastS) return null; const h = heliPlan(lastS, 0, seed); return h ? { len: h.len, route: h.route.map(q => [Math.round(q[0]), Math.round(q[1]), +(q[2] || 0).toFixed(1), q[4] && q[4].behind ? 1 : 0]) } : null; },
    /** anything crossing the sky right now (the calm frame rate: a plane, the train, a satellite, the helicopter keep 60 fps) */
    busy: () => planes.some(p => p.k < 1) || !!train || !!sat || !!heli,
    lanesInUse: () => new Set(planes.filter(p => p.k < 1).map(p => p.lane)),
    debug: () => ({ planes: planes.filter(p => p.k < 1).map(p => ({ lane: p.lane, x0: Math.round(p.x0), y0: Math.round(p.y0), x1: Math.round(p.x1), y1: Math.round(p.y1), slope: +p.slope.toFixed(3), dir: p.dir, approach: p.approach, len: +p.len.toFixed(1), k: +p.k.toFixed(2) })), trails: planes.reduce((n, p) => n + p.trail.length, 0), cap: CAP, train: train ? { n: train.n, mode: train.mode } : null, sat: !!sat, heli: heliNow ? { x: Math.round(heliNow.x), y: Math.round(heliNow.y), hover: heliNow.hover, behind: !!heliNow.behind, look: lookNow ? lookNow.kind : null, lk: lookNow ? +lookNow.lk.toFixed(2) : 0, mode: heli && heli.mode === 'break' ? 'break' : 'patrol', yaw: heliNow.yaw, model: !!heliNow.model, heading: heliNow.heading, w: heliNow.w, cx: heliNow.cx != null ? Math.round(heliNow.cx) : null, cy: heliNow.cy != null ? Math.round(heliNow.cy) : null, ang: beamAng != null ? +beamAng.toFixed(3) : null, sc: heliNow.sc, off: !!heliNow.off, len: heli ? +heli.len.toFixed(1) : null, dur: heli ? Math.round(routeDur(heli)) : null, e: +(heliNow.e || 0).toFixed(1), band: heli && heli.brk ? Math.round(heli.brk.A * 2) : null, replans: heli ? heli.replans || 0 : 0, route: heli ? heli.route.map(q => [Math.round(q[0]), Math.round(q[1]), +(q[2] || 0).toFixed(1), q[4] && q[4].behind ? 1 : 0]) : null } : null, beamArts: beamArts.size, glows: glows.size, nextPlane: Math.round(nextPlane) }),
    destroy() { for (const p of planes) if (p.spr) p.spr.cv.width = 0; if (heli && heli.spr) heli.spr.cv.width = 0; for (const c of glows.values()) c.width = 0; glows.clear(); for (const q of beamArts.values()) { q.cone.width = 0; q.pool.width = 0; } beamArts.clear(); planes = []; heli = null; },
  };
}
