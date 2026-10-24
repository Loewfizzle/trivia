// CITY 2.0 — THE HARBOR, PART 6b: THE JETS — F-16s that look BADASS (docs/harbor.md#part-6b; plan.md "THE MILITARY JETS", "MACH
// DIAMONDS"). One painter shared by the TR-3B's CHASE, THE AIR SHOW (a diamond of four, smoke on) and THE MISSING MAN (a finger-four,
// #3 pulling up and away). Seen from below + the side as they cross:
//   THE AIRFRAME   a sharp F-16 silhouette — the pointed radome, the gold-tinted bubble canopy, the chin intake, the tall swept fin, the
//                  cropped delta wing seen from just below, the stabilator, ventral fins; two-tone air-superiority grey camo (the sun on
//                  its spine by day, warm at golden hour; a dark shape at night lit from below by the city); wingtip MISSILES + under-wing
//                  pylons with their stores; a sprite per (size, light, direction), cached
//   THE AFTERBURNER (live, additive) a tapered plume from the nozzle with MACH DIAMONDS — 5 evenly spaced shock nodes: white-hot at
//                  the nozzle, then blue-white, violet, orange, a dim orange — crisp rhombi with a tight glow, flickering a touch; at night
//                  a soft glow round the whole plume (dimmer by day, still read)
//   THE LIGHTS     at night: the green FORMATION ("slime") strips on the spine, the intake + the fin, the near wingtip's nav light (green
//                  flying right: its starboard side is ours; red flying left), a white tail light, a red beacon on the fin
//   VAPOUR + SMOKE a vapour cone round the wing on a hard pull (the air show), a white smoke trail by day (the air show's smoke on)
import { safeCtx } from '../../ui/canvas-safe.js';
import { FORMATIONS, missingManAt } from '../../core/harbor-legend.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** the hour's light on a jet (from the look): day / golden / dark (0..1) */
export function jetLook(L) { return { day: clamp01(L.w.day + L.w.dawn * 0.7), golden: L.w.golden || 0, dark: clamp01(L.w.night + L.w.late) }; }

// ------------------------------------------------------------------ the airframe (nose → +x, in jet lengths; y down)
function paintJet(x, look) {
  const day = clamp01(look.day + look.golden * 0.8) * (1 - look.dark), gold = clamp01(look.golden * 1.3) * (1 - look.dark), dark = look.dark;
  // (the camo: the light grey underside + the darker grey on top; at night a deep blue-grey lit faintly from below)
  const top = mix(mix([34, 38, 48], [104, 112, 124], day), [150, 120, 104], gold * 0.5);
  const side = mix(mix([40, 44, 56], [128, 136, 148], day), [176, 140, 118], gold * 0.45);
  const belly = mix(mix([52, 50, 68], [164, 172, 184], day), [190, 150, 140], gold * 0.4);
  const farW = mix(top, [20, 22, 30], 0.35), edge = mix([80, 86, 104], [220, 226, 236], day);
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  // the FAR wing + the far stabilator (behind the body, darker): just their edges showing above the fuselage
  poly([[0.56, -0.01], [0.26, -0.11], [0.17, -0.11], [0.2, -0.02]], rgb(farW));
  poly([[0.13, -0.01], [0.0, -0.07], [-0.04, -0.065], [0.0, -0.005]], rgb(farW));
  // THE FIN: tall, swept, the leading edge lit
  poly([[0.27, -0.035], [0.11, -0.3], [0.04, -0.3], [0.05, -0.035]], rgb(side));
  x.fillStyle = rgb(mix(side, [0, 0, 0], 0.25)); x.fillRect(0.05, -0.3, 0.07, 0.02);                                         // (its antenna cap)
  x.strokeStyle = rgb(edge, 0.55 + 0.3 * day); x.lineWidth = 0.008; x.beginPath(); x.moveTo(0.27, -0.035); x.lineTo(0.11, -0.3); x.stroke();
  // THE FUSELAGE: the radome's point, the long spine, the engine bulge to the nozzle; the chin intake under the cockpit
  x.beginPath();
  x.moveTo(1.0, 0.012);
  x.bezierCurveTo(0.93, -0.012, 0.84, -0.035, 0.74, -0.042);    // the radome up to the canopy's foot
  x.lineTo(0.42, -0.045); x.bezierCurveTo(0.24, -0.046, 0.12, -0.04, 0.04, -0.03);   // the spine
  x.lineTo(0.0, -0.026); x.lineTo(0.0, 0.028);                    // the nozzle's face
  x.bezierCurveTo(0.1, 0.04, 0.3, 0.05, 0.46, 0.05);             // the engine's belly
  x.lineTo(0.62, 0.062); x.lineTo(0.64, 0.05);                   // the intake's lip
  x.bezierCurveTo(0.8, 0.044, 0.92, 0.035, 1.0, 0.012);
  x.closePath();
  const g = x.createLinearGradient(0, -0.05, 0, 0.06);
  g.addColorStop(0, rgb(mix(top, [255, 250, 240], 0.12 * day))); g.addColorStop(0.45, rgb(side)); g.addColorStop(1, rgb(belly));
  x.fillStyle = g; x.fill();
  // the chin intake (a dark mouth under the cockpit)
  poly([[0.66, 0.03], [0.6, 0.068], [0.52, 0.066], [0.55, 0.04]], rgb(mix(belly, [8, 8, 14], 0.75)));
  // panel lines + the camo's soft blotches (subtle — read as a real airframe at 3×, invisible at a glance)
  x.strokeStyle = rgb([0, 0, 0], 0.16); x.lineWidth = 0.004;
  for (const px of [0.82, 0.58, 0.36, 0.2]) { x.beginPath(); x.moveTo(px, -0.044); x.lineTo(px - 0.01, 0.048); x.stroke(); }
  x.fillStyle = rgb(mix(top, [0, 0, 0], 0.18), 0.5);
  x.beginPath(); x.ellipse(0.48, -0.025, 0.08, 0.016, 0, 0, TAU); x.ellipse(0.22, -0.02, 0.06, 0.014, 0, 0, TAU); x.fill();
  // THE CANOPY: the F-16's gold-tinted bubble, a highlight along its top
  x.beginPath(); x.moveTo(0.84, -0.036); x.bezierCurveTo(0.8, -0.085, 0.68, -0.09, 0.6, -0.046); x.closePath();
  const cg = x.createLinearGradient(0.6, -0.09, 0.8, -0.04);
  cg.addColorStop(0, rgb(mix([30, 26, 20], [214, 170, 80], day * 0.9 + 0.1))); cg.addColorStop(1, rgb(mix([12, 10, 10], [110, 80, 40], day)));
  x.fillStyle = cg; x.fill();
  x.strokeStyle = rgb([255, 244, 220], 0.35 + 0.4 * day); x.lineWidth = 0.006; x.beginPath(); x.moveTo(0.81, -0.06); x.quadraticCurveTo(0.73, -0.088, 0.65, -0.07); x.stroke();
  // THE NEAR WING seen from just below (the cropped delta under the body) + its leading edge
  poly([[0.6, 0.04], [0.28, 0.15], [0.16, 0.152], [0.17, 0.045]], rgb(mix(belly, [255, 255, 255], 0.06 * day)));
  x.strokeStyle = rgb(edge, 0.5); x.lineWidth = 0.006; x.beginPath(); x.moveTo(0.6, 0.04); x.lineTo(0.28, 0.15); x.stroke();
  // the stabilator (near) + a ventral fin
  poly([[0.13, 0.03], [0.0, 0.1], [-0.045, 0.098], [-0.005, 0.03]], rgb(belly));
  poly([[0.16, 0.045], [0.1, 0.085], [0.07, 0.085], [0.09, 0.045]], rgb(mix(belly, [0, 0, 0], 0.2)));
  // THE STORES: the wingtip missile (an AIM-9 on the tip rail, its fins), an under-wing pylon with a missile, a centreline tank
  const missile = (x0, x1, y, w, col) => {
    x.fillStyle = rgb(col); x.fillRect(x1, y - w / 2, x0 - x1, w);
    x.beginPath(); x.moveTo(x0, y - w / 2); x.lineTo(x0 + w * 2.2, y); x.lineTo(x0, y + w / 2); x.fill();          // (the seeker's point)
    poly([[x1 + 0.03, y], [x1 - 0.005, y - w * 2.2], [x1 - 0.015, y - w * 2.2], [x1, y]], rgb(col));                  // (its fins)
    poly([[x1 + 0.03, y], [x1 - 0.005, y + w * 2.2], [x1 - 0.015, y + w * 2.2], [x1, y]], rgb(col));
    poly([[x0 - 0.04, y], [x0 - 0.055, y - w * 1.6], [x0 - 0.065, y - w * 1.6], [x0 - 0.06, y]], rgb(col));
  };
  const store = mix(mix([60, 62, 70], [196, 200, 206], day), [210, 176, 150], gold * 0.4);
  missile(0.36, 0.13, 0.158, 0.011, store);
  x.fillStyle = rgb(mix(belly, [0, 0, 0], 0.3)); x.fillRect(0.33, 0.09, 0.012, 0.03);                                   // (the pylon)
  missile(0.42, 0.24, 0.124, 0.01, store);
  x.fillStyle = rgb(mix(belly, [0, 0, 0], 0.1)); x.beginPath(); x.ellipse(0.4, 0.064, 0.1, 0.014, 0, 0, TAU); x.fill();   // (the centreline tank)
  // the nozzle ring
  x.fillStyle = rgb([22, 20, 26]); x.fillRect(-0.012, -0.026, 0.02, 0.054);
  x.strokeStyle = rgb(mix([60, 56, 60], [150, 140, 130], day)); x.lineWidth = 0.005; x.beginPath(); x.moveTo(-0.012, -0.026); x.lineTo(-0.012, 0.028); x.stroke();
  // night: the city's glow on the belly (a faint warm-violet underlight)
  if (dark > 0.05) {
    x.globalCompositeOperation = 'source-atop';
    const u = x.createLinearGradient(0, -0.1, 0, 0.16); u.addColorStop(0, 'rgba(0,0,0,0)'); u.addColorStop(1, `rgba(150,90,170,${(0.28 * dark).toFixed(3)})`);
    x.fillStyle = u; x.fillRect(-0.05, -0.32, 1.1, 0.5);
    x.globalCompositeOperation = 'source-over';
  }
}

/** a jet sprite: len pt long, nose toward +x (mirrored when drawn) → { cv, w, h, ox, oy (the nozzle's place in the sprite, pt) } */
export function jetSprite(len, look, dpr) {
  const W = len * 1.12, H = len * 0.56, d = Math.min(3, Math.max(1.5, dpr));
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  const ox = len * 0.06, oy = H * 0.56;
  x.setTransform(d, 0, 0, d, ox * d, oy * d); x.scale(len, len);
  paintJet(x, look);
  return { cv, w: W, h: H, ox, oy };
}

// ------------------------------------------------------------------ the afterburner + MACH DIAMONDS (live)
const DIAMOND = [[255, 255, 248], [214, 228, 255], [178, 160, 255], [255, 168, 104], [255, 120, 80]];
let glowCache = null;
function glowSprite() {
  if (glowCache) return glowCache;
  const cv = mk(64, 64), x = safeCtx(cv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (glowCache = cv);
}
const tints = new Map();
function tinted(col) {
  const k = col.join(',');
  if (tints.has(k)) return tints.get(k);
  const cv = mk(64, 64), x = safeCtx(cv);
  x.drawImage(glowSprite(), 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgb(col); x.fillRect(0, 0, 64, 64);
  tints.set(k, cv);
  return cv;
}
/**
 * The afterburner from the nozzle (nx, ny) back along the angle `ang` (the direction the jet flies, rad), len pt (the jet's length),
 * k (0..1 its burn), o = { night (0..1), t (s, the flicker), dir }. Additive.
 */
export function drawBurner(c, nx, ny, ang, len, k, o = {}) {
  if (k <= 0.01) return;
  const night = o.night || 0, t = o.t || 0, fl = 0.92 + 0.08 * Math.sin(t * 61 + nx) * Math.sin(t * 37);
  const L = len * (0.82 + 0.1 * k) * fl, w = len * 0.05;
  c.save(); c.translate(nx, ny); c.rotate(ang + Math.PI); c.globalCompositeOperation = 'lighter';
  // the soft night glow round the whole plume
  if (night > 0.05) { c.globalAlpha = 0.45 * night * k; c.drawImage(tinted([255, 140, 90]), -L * 0.1, -w * 3.6, L * 1.05, w * 7.2); }
  // the plume: an orange-pink outer cone + a hot inner core, tapering
  const pl = (len2, w2, col, a) => {
    const g = c.createLinearGradient(0, 0, len2, 0);
    g.addColorStop(0, rgb(col, a)); g.addColorStop(0.55, rgb(col, a * 0.45)); g.addColorStop(1, rgb(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -w2); c.quadraticCurveTo(len2 * 0.4, -w2 * 0.9, len2, 0); c.quadraticCurveTo(len2 * 0.4, w2 * 0.9, 0, w2); c.closePath(); c.fill();
  };
  c.globalAlpha = 1;
  pl(L, w * 1.15, [255, 120, 70], (0.42 + 0.3 * night) * k);
  pl(L * 0.7, w * 0.75, [190, 150, 255], (0.38 + 0.25 * night) * k);
  pl(L * 0.32, w * 0.55, [255, 250, 236], 0.85 * k);
  // THE MACH DIAMONDS: 5 evenly spaced shock nodes (crisp rhombi + a tight glow), white-hot first, fading down the plume
  const n = 5, sp = L * 0.155;
  for (let i = 0; i < n; i++) {
    const cx = sp * (0.7 + i) * (1 + 0.012 * Math.sin(t * 23 + i * 2.1)), dl = sp * 0.42 * (1 - i * 0.08), dh = w * (0.62 - i * 0.07);
    const a = k * (1 - i * 0.16) * (0.78 + 0.22 * Math.sin(t * 47 + i * 1.7)) * (night > 0.3 ? 1 : 0.8);
    const col = DIAMOND[i];
    c.globalAlpha = Math.min(1, a * 0.75); const gs = dh * 4.2; c.drawImage(tinted(col), cx - gs, -gs * 0.55, gs * 2, gs * 1.1);
    c.globalAlpha = Math.min(1, a); c.fillStyle = rgb(col); c.beginPath(); c.moveTo(cx - dl, 0); c.lineTo(cx, -dh); c.lineTo(cx + dl, 0); c.lineTo(cx, dh); c.closePath(); c.fill();
    c.globalAlpha = Math.min(1, a * 0.9); c.fillStyle = 'rgb(255,255,255)'; c.beginPath(); c.moveTo(cx - dl * 0.45, 0); c.lineTo(cx, -dh * 0.4); c.lineTo(cx + dl * 0.45, 0); c.lineTo(cx, dh * 0.4); c.closePath(); c.fill();
  }
  // the nozzle's own white-hot ring
  c.globalAlpha = k; c.drawImage(tinted([255, 244, 220]), -w * 2, -w * 2, w * 4, w * 4);
  c.restore();
}

/** the jet's lights at night (formation strips, nav, tail, beacon), in the jet's own frame (the nozzle at 0, the nose at +len); navDir:
 *  its real direction on the screen (green flying right: its starboard side faces us; red flying left) */
export function drawJetLights(c, len, navDir, night, t, i = 0) {
  if (night < 0.05) return;
  const G = [150, 255, 160];
  const strip = (x0, y0, x1, y1) => { c.strokeStyle = rgb(G, 0.95 * night); c.lineWidth = Math.max(0.7, len * 0.012); c.beginPath(); c.moveTo(x0 * len, y0 * len); c.lineTo(x1 * len, y1 * len); c.stroke(); };
  c.save(); c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.5 * night; const gs = len * 0.14;
  for (const [a, b] of [[0.7, -0.03], [0.2, -0.04], [0.15, -0.17]]) c.drawImage(tinted(G), a * len - gs, b * len - gs * 0.5, gs * 2, gs);
  c.globalAlpha = 1;
  strip(0.76, -0.032, 0.66, -0.036); strip(0.3, -0.042, 0.12, -0.036); strip(0.2, -0.12, 0.13, -0.22);
  const nav = navDir > 0 ? [90, 255, 140] : [255, 60, 60];
  c.globalAlpha = 0.85 * night; c.drawImage(tinted(nav), 0.26 * len - gs * 0.6, 0.158 * len - gs * 0.6, gs * 1.2, gs * 1.2);
  c.globalAlpha = night; c.fillStyle = rgb(nav); c.beginPath(); c.arc(0.27 * len, 0.158 * len, Math.max(0.6, len * 0.012), 0, TAU); c.fill();
  c.fillStyle = 'rgb(255,250,240)'; c.beginPath(); c.arc(-0.005 * len, -0.03 * len, Math.max(0.5, len * 0.009), 0, TAU); c.fill();
  const bk = Math.sin(t * 7.5 + i * 1.3) > 0.55 ? 1 : 0.15;
  c.globalAlpha = night * bk; c.drawImage(tinted([255, 40, 30]), 0.07 * len - gs * 0.5, -0.3 * len - gs * 0.5, gs, gs);
  c.restore();
}

/**
 * The jets: a cache of sprites + one call that draws a jet whole. draw(c, { x, y (its centre), dir (±1: flying right / left), ang (its
 * climb, rad: + = nose up), len, look, burn (0..1), t, i (its slot: the flicker + the beacon's phase), vapour (0..1) }).
 */
export function createJets() {
  const cache = new Map();
  let dpr = 2;
  function sprite(len, look) {
    const key = `${Math.round(len)}|${Math.round(look.day * 8)}|${Math.round(look.golden * 8)}|${Math.round(look.dark * 8)}`;
    let s = cache.get(key);
    if (!s) { if (cache.size > 12) { for (const v of cache.values()) v.cv.width = 0; cache.clear(); } s = jetSprite(len, look, dpr); cache.set(key, s); }
    return s;
  }
  function draw(c, j) {
    const s = sprite(j.len, j.look), night = j.look.dark, L = j.len;
    c.save(); c.translate(j.x, j.y); c.scale(j.dir < 0 ? -1 : 1, 1); c.rotate(-(j.ang || 0));
    c.translate(-L * 0.5, 0);                                   // (the jet's own frame: the nozzle at 0, the nose at +L)
    // the afterburner first (behind the tail), then the airframe, the vapour, the lights
    if (j.burn > 0) drawBurner(c, 0, 0, 0, L, j.burn, { night, t: j.t });
    c.drawImage(s.cv, -s.ox, -s.oy, s.w, s.h);
    if (j.vapour > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * j.vapour; c.drawImage(tinted([236, 240, 248]), L * 0.12, -L * 0.12, L * 0.56, L * 0.34); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    if (night > 0.05) drawJetLights(c, L, j.dir, night, j.t, j.i || 0);
    c.restore();
  }
  return {
    draw,
    setDpr(d) { if (d !== dpr) { dpr = d; for (const v of cache.values()) v.cv.width = 0; cache.clear(); } },
    destroy() { for (const v of cache.values()) v.cv.width = 0; cache.clear(); },
  };
}

// ------------------------------------------------------------------ THE AIR SHOW + THE MISSING MAN (6b — plan.md "THE MILITARY JETS")
// Flights are a function of the seconds since they began (every phone the same sky, a late arrival mid-show). The formation flies
// one PATH (the lead's); each jet holds its slot in the lead's own frame (rotated with the heading), so a loop turns the whole diamond.
//   'airshow'   our own unbranded team: a DIAMOND of four, smoke on by day — a low pass left → right, a big LOOP in the open sky right →
//               left (the smoke drawing the circle), then a VERTICAL PULL-UP in the middle on full afterburner (vapour cones on the
//               pull), climbing out of the top. ~24 s.
//   'missing'   THE MISSING MAN (Memorial + Veterans Day): a finger-four in a calm flat pass right → left; #3 pulls up and away,
//               climbing out alone while the three fly on. ~11 s, no smoke.
export const SHOW_LEN = { airshow: 24, missing: 11 };
const sm01 = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
/** the lead's place at s (box: the open sky { x, y, w, h }) → { x, y, ang (screen heading, rad: 0 = right, −π/2 = up), on, vapour, burn } */
export function showLead(kind, s, box) {
  const { x: X, y: Y, w: Wd, h: Hh } = box, low = Y + Hh * 0.82, mid = Y + Hh * 0.5;
  if (kind === 'missing') {
    const u = s / SHOW_LEN.missing, x = X + Wd * (1.25 - 1.5 * u);
    return { x, y: Y + Hh * 0.62 - u * Hh * 0.08, ang: Math.PI - 0.05, on: u > 0 && u < 1, vapour: 0, burn: 0.25, u, dir: -1 };
  }
  // the air show: pass 1 (0–3.6 s) → the loop (6–15 s) → the pull-up (17–24 s)
  if (s < 3.6) { const u = s / 3.6; return { x: X - Wd * 0.25 + Wd * 1.5 * u, y: low - Math.sin(u * Math.PI) * Hh * 0.06, ang: -0.06 * Math.cos(u * Math.PI), on: true, vapour: 0, burn: 0.35, dir: 1 }; }
  if (s >= 6 && s < 15.5) {
    // in from the right, a full loop round the middle of the sky (the circle's bottom on the flight line), out to the left
    const R = Math.min(Wd * 0.3, Hh * 0.38), cx = X + Wd * 0.5, cy = mid + Hh * 0.04, v = R * 1.25;            // (pt / s)
    const inLen = (X + Wd * 1.25) - cx, loopLen = 2 * Math.PI * R, e = s - 6, d = e * v + (s >= 6 ? 0 : 0);
    const by = cy + R;
    if (d < inLen) return { x: X + Wd * 1.25 - d, y: by, ang: Math.PI, on: true, vapour: 0, burn: 0.35, dir: -1 };
    if (d < inLen + loopLen) { const a = (d - inLen) / R; return { x: cx - Math.sin(a) * R, y: cy + Math.cos(a) * R, ang: Math.PI + a, on: true, vapour: sm01(0, 0.4, a) * (1 - sm01(0.9, 1.6, a)), burn: 0.8, dir: -1 }; }
    return { x: cx - (d - inLen - loopLen), y: by, ang: Math.PI + 2 * Math.PI, on: true, vapour: 0, burn: 0.35, dir: -1 };
  }
  if (s >= 17 && s < 24) {
    const e = s - 17, x0 = X + Wd * 0.5, v = Wd * 0.42, turn = Math.min(Hh * 0.22, Wd * 0.2);
    const run = Wd * 0.75 + x0 - X;                   // (in from the left, along the low line, then up)
    const d = e * v;
    if (d < run) return { x: X - Wd * 0.25 + d, y: low, ang: 0, on: true, vapour: 0, burn: 0.5, dir: 1 };
    const q = d - run, a = Math.min(Math.PI / 2, q / turn);
    if (a < Math.PI / 2) return { x: x0 + Math.sin(a) * turn, y: low - (1 - Math.cos(a)) * turn, ang: -a, on: true, vapour: sm01(0.1, 0.5, a) * (1 - sm01(1.2, 1.57, a)), burn: 1, dir: 1 };
    const up = q - turn * Math.PI / 2;
    return { x: x0 + turn, y: low - turn - up, ang: -Math.PI / 2, on: true, vapour: 0, burn: 1, dir: 1 };
  }
  return { on: false };
}
/** the formation at s → [{ x, y, ang, burn, vapour, i }] (the missing man's #3 its own way) */
export function showJets(kind, s, box, len) {
  const slots = kind === 'missing' ? FORMATIONS.finger : FORMATIONS.diamond, out = [];
  slots.forEach(([fx, fy], i) => {
    // (each jet a moment behind the lead on the same path — a formation turns as one)
    const lag = -fx * len * 0.9 / Math.max(60, box.w * 0.42), L0 = showLead(kind, s - lag, box);
    if (!L0.on) return;
    let { x, y, ang } = L0;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    x += -sa * fy * len * 0.62; y += ca * fy * len * 0.62;
    let burn = L0.burn, climb = 0;
    if (kind === 'missing' && i === 2) { const m = missingManAt(L0.u); climb = m.climb; y -= m.rise * len; x -= m.rise * len * 0.25; burn = 0.25 + 0.75 * Math.min(1, m.climb * 2); }
    out.push({ x, y, ang: ang + (kind === 'missing' && i === 2 ? climb : 0), burn, vapour: L0.vapour, i, dir: L0.dir });
  });
  return out;
}

/** a jet's nose-up angle for jets.draw from its screen heading θ and its leg's mirror direction (a loop goes inverted over the top) */
export const climbOf = (theta, dir) => (dir > 0 ? -theta : theta - Math.PI);

/** THE AIR SHOW / THE MISSING MAN on the screen: start(kind, at) · draw(c, s, box) · on() · listen() (the sound's moment) */
export function createAirShow() {
  const jets = createJets();
  let cur = null, dpr = 2;
  const lenOf = box => Math.max(30, Math.min(box.w * 0.11, 64));
  function smoke(c, s, box, e, len, night) {
    if (cur.kind !== 'airshow' || night > 0.5) return;
    // the smoke: each jet's own past positions on the analytic path (every phone the same), widening + fading over ~6 s
    c.save(); c.lineCap = 'round';
    const N = 34, dt = 0.18, day = 1 - night;
    for (let i = 0; i < 4; i++) {
      let prev = null;
      for (let k = 0; k <= N; k++) {
        const t = e - k * dt; if (t < 0) break;
        const J = showJets(cur.kind, t, box, len).find(j => j.i === i);
        if (!J) { prev = null; continue; }
        const ca = Math.cos(J.ang), sa = Math.sin(J.ang), pt = [J.x - ca * len * 0.5, J.y - sa * len * 0.5];
        if (prev) { const age = k * dt, a = 0.7 * (1 - age / (N * dt)) * day; c.strokeStyle = `rgba(250,250,252,${a.toFixed(3)})`; c.lineWidth = 1.4 + age * 1.3; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(pt[0], pt[1]); c.stroke(); }
        prev = pt;
      }
    }
    c.restore();
  }
  return {
    start(kind, at) { if (!SHOW_LEN[kind]) return false; cur = { kind, at }; return true; },
    on: () => !!cur,
    kind: () => (cur ? cur.kind : null),
    stop() { cur = null; },
    setDpr(d) { dpr = d; jets.setDpr(d); },
    draw(c, s, box) {
      if (!cur || !box) return;
      const e = (s.now - cur.at) / 1000;
      if (e > SHOW_LEN[cur.kind] + 2) { cur = null; return; }
      if (e < 0) return;
      const len = lenOf(box), look = jetLook(s.L);
      smoke(c, s, box, e, len, look.dark);
      for (const J of showJets(cur.kind, e, box, len)) jets.draw(c, { x: J.x, y: J.y, dir: J.dir, ang: climbOf(J.ang, J.dir), len, look, burn: J.burn, vapour: J.vapour, t: performance.now() / 1000 + J.i * 0.29, i: J.i });
    },
    /** the sound: the jets' pass ({ dir }) at the moments their roar should start (each pass's peak lands mid-screen) */
    listen(s) {
      if (!cur) return null;
      const e = (s.now - cur.at) / 1000, at = cur.kind === 'missing' ? [0.4] : [-3.7, 4.9, 14.2];
      for (const t0 of at) if (e >= t0 && e < t0 + 0.6) return { dir: cur.kind === 'missing' ? -1 : t0 > 10 ? 1 : t0 > 0 ? -1 : 1, gain: 1 };
      return null;
    },
    debug: () => (cur ? { kind: cur.kind, at: cur.at } : null),
    destroy() { jets.destroy(); cur = null; },
  };
}
