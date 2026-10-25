// CITY 2.0 — THE HARBOR, PART 6b: THE BARNSTORMER THROUGH THE SIGN (plan.md "THE BARNSTORMER THROUGH THE SIGN"; docs/harbor.md#part-6b).
// The one planned exception to "nothing flies across the sign" (THE THREE DEPTH RULES: (3) THROUGH the letters). A 1920s barnstormer —
// POLISH 4 (the owner: "looks cheap" → premium): a red biplane with white trim — two fabric-covered wings (rib tapes, airfoil edges,
// the lower wing's underside showing), N-struts + cabane struts with crossed BRACING WIRES, a RADIAL ENGINE (finned cylinder heads
// round the cowl, exhaust stubs) and a SPINNING PROPELLER (a blurred disc + two blades turning), a leather-helmeted pilot with goggles
// and a white SCARF fluttering back, spoked wheels on a V undercarriage, a tail skid. ITS ROUTE (the owner): in from the left weaving
// THROUGH the first N (behind its uprights, in front of its diagonal), past the E, a full LOOP AROUND THE O (the circle drawn round the
// letter, never across it), then THREADING THE LAST N (behind its left upright, in front of its diagonal, behind its right upright) and
// away climbing. ITS SMOKE (by day): THICK billowing puffs laid on its real path (a fixed grid of times: they never crawl), each one
// swelling, softening, rising a little and DRIFTING WITH THE REAL WIND, lasting ~10 s after it has gone — the loop's ring of smoke hangs
// round the O and drifts off. At night its wingtip + tail lights glint, the sign's pink on its top, the letters flicker in its wake.
//   HOW IT GOES BETWEEN THE LAYERS: the sign is the page's (DOM) — it draws over the city's canvas. The plane is drawn on a small OVERLAY
//   canvas above the sign (made for the flight, removed after), and the strokes it passes BEHIND are cut out of that overlay (their
//   tube paths from ui/logo.js, mapped like the sign's dark halo), so the real glass shows over the plane there. Its smoke stays on the
//   city's canvas (behind the sign). The path is a function of the seconds since it began (every phone the same flight).
import { LOGO_W } from '../../ui/logo.js';
import { BARN_LEN } from '../../core/harbor-legend.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hash01 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// the strokes it passes BEHIND (logo units: each letter's own 0..64 × 0..100 box + its x offset — ui/logo.js#LETTERS)
const BEHIND = [
  { x: 0, d: 'M0 100 V10 Q0 0 7 7' },                                   // the first N's left upright
  { x: 0, d: 'M57 93 Q64 100 64 90 V0' },                                // … and its right upright (the diagonal stays behind the plane)
  { x: 268, d: 'M0 100 V10 Q0 0 7 7' },                                  // the last N's left upright (threading it)
  { x: 268, d: 'M57 93 Q64 100 64 90 V0' },                              // … and its right upright (in front of its diagonal between them)
];
const TUBE_CUT = 10.5;                                                   // (logo units: the glass tube + a hair)
/** the plane's length in logo units (≈ 40 pt on a phone) */
export const BARN_PLANE = 44;
/** how long its smoke hangs after it has gone (s) */
export const BARN_SMOKE = 10;

// ------------------------------------------------------------------ THE ROUTE (logo units, y down; the logo box 0..332 × 0..100)
// Built once as a polyline sampled every ~1 unit, walked by distance at the flight's own speed (a constant airspeed, a touch slower
// over the loop's top): the weave through the first N + the E, a dive under the O, the LOOP AROUND THE O (an inside loop: up its right
// side, inverted over its top, down its left side), then the climb THROUGH THE LAST N and away.
const LOOP = { cx: 203, cy: 50, rx: 50, ry: 68 };
let ROUTE = null;
function route() {
  if (ROUTE) return ROUTE;
  const pts = [];
  const add = (x, y) => { const l = pts[pts.length - 1]; if (!l || Math.hypot(x - l[0], y - l[1]) > 0.25) pts.push([x, y]); };
  const bez = (p0, p1, p2, p3, n) => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; add(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]); } };
  const bot = [LOOP.cx, LOOP.cy + LOOP.ry];
  // in from the left: a gentle weave at mid-height through the first N (its diagonal crossed in front at ~y 50), past the E's middle bar,
  // then easing down under the O to the loop's bottom
  for (let x = -110; x <= 60; x += 2) add(x, 52 + Math.sin((x + 40) / 52) * 7);
  bez([60, 52 + Math.sin(100 / 52) * 7], [110, 58], [150, bot[1]], bot, 60);
  // THE LOOP AROUND THE O (the angle from the bottom; up the right side first)
  for (let i = 1; i <= 240; i++) { const a = (i / 240) * TAU; add(LOOP.cx + LOOP.rx * Math.sin(a), LOOP.cy + LOOP.ry * Math.cos(a)); }
  // out of the loop's bottom, a short level run, then the climb THROUGH THE LAST N — behind its left upright (~y 72), across its
  // diagonal in front (~y 48), behind its right upright (~y 24) — and away up to the right
  bez(bot, [236, bot[1]], [252, 92], [268, 72], 40);
  bez([268, 72], [290, 45], [312, 34], [332, 24], 40);
  bez([332, 24], [372, 4], [420, -36], [520, -90], 80);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  ROUTE = { pts, cum, len: cum[cum.length - 1], loop0: 0, loop1: 0 };
  // where the loop starts + ends along it (the speed profile)
  const ib = pts.findIndex(p => Math.abs(p[0] - bot[0]) < 0.6 && Math.abs(p[1] - bot[1]) < 0.6);
  ROUTE.loop0 = cum[ib]; ROUTE.loop1 = ROUTE.loop0 + Math.PI * (3 * (LOOP.rx + LOOP.ry) - Math.sqrt((3 * LOOP.rx + LOOP.ry) * (LOOP.rx + 3 * LOOP.ry)));
  return ROUTE;
}
/** the distance flown s seconds in (a constant airspeed that fits the flight into BARN_LEN; a touch slower over the loop's top) */
function distAt(s) {
  const R = route(), v = R.len / (BARN_LEN - 0.4);
  let d = v * s;
  // (over the loop the speed breathes: slower climbing to its top, faster diving out — the distance stays the same at its end)
  if (d > R.loop0 && d < R.loop1) { const u = (d - R.loop0) / (R.loop1 - R.loop0); d = R.loop0 + (R.loop1 - R.loop0) * (u + 0.05 * Math.sin(u * TAU)); }
  return d;
}

/**
 * THE PATH (logo units, y down) at s seconds → { x, y, ang (screen heading), on, dir (the mirror: ±1), loop (0..1 through the loop or
 * null) }.
 */
export function barnAt(s) {
  if (s < 0 || s > BARN_LEN) return { on: false };
  const R = route(), d = Math.min(R.len - 0.01, distAt(s));
  let lo = 0, hi = R.cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R.cum[m] <= d) lo = m; else hi = m; }
  const a = R.pts[lo], b = R.pts[hi], u = (d - R.cum[lo]) / Math.max(1e-6, R.cum[hi] - R.cum[lo]);
  // the heading over a short chord (smooth through every sample)
  const j0 = Math.max(0, lo - 3), j1 = Math.min(R.pts.length - 1, hi + 3), A = R.pts[j0], B = R.pts[j1];
  const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
  const loop = d > R.loop0 && d < R.loop1 ? (d - R.loop0) / (R.loop1 - R.loop0) : null;
  return { x, y, ang: Math.atan2(B[1] - A[1], B[0] - A[0]), on: x < LOGO_W + 190 && y > -150, dir: 1, loop };
}

// ------------------------------------------------------------------ THE BIPLANE (nose → +x, `len` pt long; y down; drawn live)
/** the biplane in this light (day 0..1, night 0..1), t (s: the prop + the scarf), pink (the sign's glow on its top 0..1) */
export function drawBiplane(c, len, day, night, t, pink) {
  const L = len;
  const red = mix([92, 22, 26], [206, 34, 38], day), redL = mix(red, [255, 150, 140], 0.28), redD = red.map(v => v * 0.62);
  const white = mix([112, 106, 104], [248, 244, 234], day), whiteD = white.map(v => v * 0.8);
  const metal = mix([46, 46, 52], [128, 126, 128], day), steel = mix([30, 30, 34], [70, 70, 76], day);
  const wire = rgb(mix([90, 90, 96], [214, 214, 220], day), 0.75);
  const P = (pts, fill) => { c.fillStyle = fill; c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a * L, b * L) : c.moveTo(a * L, b * L))); c.closePath(); c.fill(); };
  const line = (x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = Math.max(0.35, w * L); c.beginPath(); c.moveTo(x0 * L, y0 * L); c.lineTo(x1 * L, y1 * L); c.stroke(); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  // a WING (side-on from a touch below): the airfoil slab (round leading edge at the front, a fine trailing edge) + its underside band
  // receding, white leading-edge trim, the fabric's rib tapes
  const wing = (x0, x1, y, th, under, far) => {
    const col = far ? redD : red, up = far ? mix(redD, [0, 0, 0], 0.15) : redL;
    // the underside (seen from below: a band under the slab, darker toward its back)
    if (under > 0) {
      const g = c.createLinearGradient(0, y * L, 0, (y + th + under) * L); g.addColorStop(0, rgb(redD)); g.addColorStop(1, rgb(mix(redD, [0, 0, 0], 0.35)));
      P([[x0 + 0.01, y + th * 0.5], [x1, y + th * 0.4], [x1 - 0.03, y + th + under], [x0 + 0.02, y + th + under * 0.9]], g);
    }
    c.beginPath();
    c.moveTo(x0 * L, (y + th * 0.55) * L);                                        // (the trailing edge, fine)
    c.quadraticCurveTo(((x0 + x1) / 2) * L, (y - th * 0.35) * L, (x1 - th * 0.6) * L, (y - th * 0.1) * L);
    c.quadraticCurveTo((x1 + th * 0.2) * L, (y + th * 0.35) * L, (x1 - th * 0.5) * L, (y + th * 0.95) * L);   // (the round nose)
    c.quadraticCurveTo(((x0 + x1) / 2) * L, (y + th * 0.9) * L, x0 * L, (y + th * 0.55) * L);
    c.closePath();
    const g = c.createLinearGradient(0, (y - th * 0.4) * L, 0, (y + th) * L); g.addColorStop(0, rgb(up)); g.addColorStop(1, rgb(col));
    c.fillStyle = g; c.fill();
    if (!far) {
      line(x1 - th * 0.55, y - th * 0.05, x1 - th * 0.5, y + th * 0.9, 0.012, rgb(white));     // (the leading edge's white trim)
      c.strokeStyle = rgb(mix(up, [255, 255, 255], 0.35), 0.45); c.lineWidth = Math.max(0.3, 0.004 * L);    // (the rib tapes)
      c.beginPath(); for (let x = x0 + 0.035; x < x1 - 0.04; x += 0.045) { c.moveTo(x * L, (y + th * 0.05) * L); c.lineTo(x * L, (y + th * 0.8 + under * 0.9) * L); } c.stroke();
    }
  };
  // ---- far side first: the far wingtips (offset up-back: the span receding), the far half of the undercarriage
  wing(0.4, 0.8, -0.27, 0.036, 0, true);
  wing(0.42, 0.79, 0.045, 0.032, 0, true);
  line(0.66, 0.06, 0.69, 0.19, 0.016, rgb(steel));
  // ---- THE TAIL: the stabilizer (airfoil), the fin + a rounded RUDDER (white with red stripes — the trim)
  wing(-0.02, 0.17, -0.02, 0.026, 0.014, false);
  P([[0.14, -0.04], [0.09, -0.16], [0.05, -0.18], [0.04, -0.04]], rgb(red));
  c.beginPath(); c.moveTo(0.045 * L, -0.03 * L); c.lineTo(0.045 * L, -0.175 * L); c.quadraticCurveTo(0.0, -0.2 * L, -0.045 * L, -0.15 * L);
  c.quadraticCurveTo(-0.06 * L, -0.08 * L, -0.03 * L, 0.0); c.lineTo(0.02 * L, 0.0); c.closePath(); c.fillStyle = rgb(white); c.fill();
  c.save(); c.clip(); c.fillStyle = rgb(red); for (const yy of [-0.155, -0.105, -0.055]) c.fillRect(-0.07 * L, yy * L, 0.12 * L, 0.022 * L); c.restore();
  line(0.045, -0.175, 0.045, -0.03, 0.006, rgb(redD, 0.8));                       // (the rudder's hinge)
  line(0.06, 0.035, 0.02, 0.075, 0.012, rgb(steel));                               // (the tail skid)
  // ---- THE FUSELAGE: fabric over stringers, a turtle deck behind the cockpit, the cowl's sheet metal at the front
  c.beginPath(); c.moveTo(0.86 * L, -0.07 * L); c.lineTo(0.64 * L, -0.074 * L);
  c.quadraticCurveTo(0.45 * L, -0.092 * L, 0.24 * L, -0.06 * L); c.lineTo(0.02 * L, -0.03 * L); c.lineTo(0.0, 0.0);
  c.lineTo(0.02 * L, 0.018 * L); c.quadraticCurveTo(0.35 * L, 0.06 * L, 0.62 * L, 0.072 * L); c.lineTo(0.86 * L, 0.07 * L); c.closePath();
  { const g = c.createLinearGradient(0, -0.09 * L, 0, 0.075 * L); g.addColorStop(0, rgb(mix(redL, [255, 240, 230], 0.25 * day))); g.addColorStop(0.35, rgb(red)); g.addColorStop(1, rgb(redD));
    c.fillStyle = g; c.fill(); }
  c.save(); c.clip();
  c.strokeStyle = rgb(redD, 0.5); c.lineWidth = Math.max(0.3, 0.004 * L);           // (the stringers under the fabric + its formers)
  c.beginPath(); for (const yy of [-0.04, 0.02, 0.05]) { c.moveTo(0.02 * L, yy * L * 0.6); c.lineTo(0.84 * L, yy * L); } c.stroke();
  c.strokeStyle = rgb(mix(redL, [255, 255, 255], 0.3), 0.3); c.beginPath(); for (let x = 0.1; x < 0.8; x += 0.07) { c.moveTo(x * L, -0.09 * L); c.lineTo(x * L, 0.08 * L); } c.stroke();
  // the WHITE CHEATLINE sweeping from the cowl to the tail + a white roundel with the racing number's red ring
  c.fillStyle = rgb(white); c.beginPath(); c.moveTo(0.86 * L, -0.022 * L); c.lineTo(0.02 * L, -0.012 * L); c.lineTo(0.02 * L, -0.002 * L); c.lineTo(0.86 * L, -0.002 * L); c.closePath(); c.fill();
  c.fillStyle = rgb(white); c.beginPath(); c.arc(0.33 * L, 0.012 * L, 0.036 * L, 0, TAU); c.fill();
  c.strokeStyle = rgb(red); c.lineWidth = Math.max(0.4, 0.01 * L); c.beginPath(); c.arc(0.33 * L, 0.012 * L, 0.02 * L, 0, TAU); c.stroke();
  // the cowl's polished panel behind the engine
  { const g = c.createLinearGradient(0, -0.075 * L, 0, 0.075 * L); g.addColorStop(0, rgb(mix(metal, [255, 255, 255], 0.35))); g.addColorStop(0.5, rgb(metal)); g.addColorStop(1, rgb(steel));
    c.fillStyle = g; c.fillRect(0.76 * L, -0.08 * L, 0.11 * L, 0.16 * L); }
  c.restore();
  // ---- THE OPEN COCKPIT: the leather coaming, the windscreen, THE PILOT (a leather helmet, goggles glinting) + HIS SCARF fluttering back
  const scarfW = Math.sin(t * 11), sc = mix([150, 150, 160], [252, 252, 250], day);
  c.fillStyle = rgb(sc); c.beginPath();
  const sx0 = 0.555, sy0 = -0.1, segs = 8, sl = 0.19;
  const sp = k => { const x = sx0 - sl * k, y = sy0 - 0.012 * k + Math.sin(t * 14 - k * 7) * 0.026 * k + scarfW * 0.004; return [x, y]; };
  for (let k = 0; k <= segs; k++) { const [x, y] = sp(k / segs); if (!k) c.moveTo(x * L, (y - 0.012) * L); else c.lineTo(x * L, (y - 0.012 * (1 - k / segs * 0.6)) * L); }
  for (let k = segs; k >= 0; k--) { const [x, y] = sp(k / segs); c.lineTo(x * L, (y + 0.012 * (1 - k / segs * 0.6)) * L); }
  c.closePath(); c.fill();
  c.fillStyle = rgb(mix(sc, [0, 0, 0], 0.18)); { const [x, y] = sp(1); c.beginPath(); c.moveTo(x * L, (y - 0.01) * L); c.lineTo((x - 0.03) * L, (y + 0.006) * L); c.lineTo(x * L, (y + 0.01) * L); c.fill(); }   // (its forked tail)
  const helm = mix([36, 26, 22], [120, 78, 46], day);
  c.fillStyle = rgb(helm); c.beginPath(); c.arc(0.575 * L, -0.112 * L, 0.036 * L, 0, TAU); c.fill();
  c.fillStyle = rgb(mix(helm, [255, 220, 180], 0.25)); c.beginPath(); c.arc(0.582 * L, -0.122 * L, 0.018 * L, Math.PI * 1.1, Math.PI * 1.9); c.fill();   // (the leather's sheen)
  c.fillStyle = rgb(mix([40, 30, 26], [220, 160, 120], day)); c.beginPath(); c.arc(0.6 * L, -0.1 * L, 0.014 * L, 0, TAU); c.fill();                       // (his cheek)
  line(0.55, -0.112, 0.61, -0.116, 0.008, rgb([30, 24, 22]));                        // (the goggles' strap)
  c.fillStyle = rgb(mix([120, 150, 170], [230, 246, 255], day)); c.beginPath(); c.arc(0.606 * L, -0.116 * L, 0.011 * L, 0, TAU); c.fill();   // (a lens glinting)
  P([[0.52, -0.082], [0.66, -0.077], [0.66, -0.068], [0.52, -0.072]], rgb(mix([46, 30, 22], [110, 70, 40], day)));                           // (the coaming)
  P([[0.645, -0.078], [0.665, -0.112], [0.672, -0.112], [0.66, -0.077]], rgb(mix([160, 190, 210], [235, 248, 255], day), 0.75));           // (the windscreen)
  // ---- THE NEAR LOWER WING (under the body) + THE UNDERCARRIAGE (a V of struts, a spoked wheel with a white hub)
  wing(0.44, 0.81, 0.055, 0.034, 0.02, false);
  line(0.67, 0.07, 0.72, 0.2, 0.016, rgb(steel)); line(0.79, 0.07, 0.72, 0.2, 0.016, rgb(steel));
  line(0.66, 0.2, 0.78, 0.2, 0.01, rgb(steel));                                      // (the axle's spreader)
  c.fillStyle = rgb([22, 20, 22]); c.beginPath(); c.arc(0.72 * L, 0.205 * L, 0.056 * L, 0, TAU); c.fill();
  c.strokeStyle = rgb(mix([80, 76, 74], [200, 196, 190], day), 0.7); c.lineWidth = Math.max(0.25, 0.004 * L);
  c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 8 + t * 2; c.moveTo((0.72 + Math.cos(a) * 0.04) * L, (0.205 + Math.sin(a) * 0.04) * L); c.lineTo((0.72 - Math.cos(a) * 0.04) * L, (0.205 - Math.sin(a) * 0.04) * L); } c.stroke();
  c.fillStyle = rgb(white); c.beginPath(); c.arc(0.72 * L, 0.205 * L, 0.015 * L, 0, TAU); c.fill();
  // ---- THE STRUTS + THE BRACING WIRES: the cabane over the cockpit, the near N-strut pair out on the wing, the wires crossed between
  line(0.62, -0.075, 0.6, -0.235, 0.011, rgb(steel)); line(0.72, -0.072, 0.7, -0.235, 0.011, rgb(steel));
  line(0.5, 0.06, 0.48, -0.235, 0.012, rgb(mix(red, [60, 30, 26], 0.4))); line(0.74, 0.06, 0.72, -0.235, 0.012, rgb(mix(red, [60, 30, 26], 0.4)));
  line(0.5, 0.055, 0.72, -0.23, 0.0045, wire); line(0.74, 0.055, 0.48, -0.23, 0.0045, wire);
  line(0.6, -0.07, 0.48, -0.23, 0.0035, wire); line(0.22, -0.035, 0.08, -0.15, 0.0035, wire);
  // ---- THE NEAR UPPER WING on top of them
  wing(0.4, 0.82, -0.265, 0.04, 0.022, false);
  // ---- THE RADIAL ENGINE: finned cylinder heads round the cowl ring (up + down), exhaust stubs, the cowl ring's chrome lip
  c.fillStyle = rgb(steel); c.beginPath(); c.ellipse(0.9 * L, 0, 0.035 * L, 0.095 * L, 0, 0, TAU); c.fill();
  for (const [a, k] of [[-1.25, 1], [-0.62, 0.85], [0, 0.6], [0.62, 0.85], [1.25, 1]]) {
    const cy = Math.sin(a) * 0.088, cx = 0.9 + Math.cos(a) * 0.012, h = 0.034 * k;
    c.save(); c.translate(cx * L, cy * L); c.rotate(a);
    c.fillStyle = rgb(metal); c.fillRect(0, -0.021 * L, h * L, 0.042 * L);
    c.strokeStyle = rgb(mix(metal, [255, 255, 255], 0.35), 0.7); c.lineWidth = Math.max(0.25, 0.004 * L);
    c.beginPath(); for (let f = 0.012; f < h; f += 0.011) { c.moveTo(f * L, -0.021 * L); c.lineTo(f * L, 0.021 * L); } c.stroke();     // (the cooling fins)
    c.restore();
  }
  line(0.86, 0.075, 0.8, 0.105, 0.012, rgb([40, 34, 32])); line(0.87, -0.08, 0.81, -0.105, 0.012, rgb([40, 34, 32]));     // (exhaust stubs)
  c.strokeStyle = rgb(mix(metal, [255, 255, 255], 0.55)); c.lineWidth = Math.max(0.4, 0.01 * L);
  c.beginPath(); c.ellipse(0.925 * L, 0, 0.018 * L, 0.085 * L, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
  // ---- THE PROPELLER: a blurred disc (side-on: a thin ellipse) + two blades turning through it, a spinner
  c.fillStyle = rgb(mix([150, 150, 160], [220, 220, 228], day), 0.22); c.beginPath(); c.ellipse(0.965 * L, 0, 0.02 * L, 0.24 * L, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(mix([150, 150, 160], [230, 230, 236], day), 0.18); c.beginPath(); c.ellipse(0.965 * L, 0, 0.012 * L, 0.24 * L, 0, 0, TAU); c.fill();
  const pa = t * 34;
  for (const off of [0, Math.PI]) {
    const yb = Math.cos(pa + off) * 0.24, w = Math.abs(Math.sin(pa + off)) * 0.02 + 0.006;
    c.fillStyle = rgb(mix([60, 42, 30], [130, 92, 58], day), 0.75); c.beginPath(); c.ellipse(0.965 * L, (yb / 2) * L, w * L, Math.abs(yb / 2) * L + 0.5, 0, 0, TAU); c.fill();
  }
  c.fillStyle = rgb(mix(metal, [255, 255, 255], 0.3)); c.beginPath(); c.ellipse(0.955 * L, 0, 0.022 * L, 0.03 * L, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  // the sign's pink glow on its top + its wingtip / tail lights at night
  if (pink > 0.02) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgb([255, 80, 170], 0.42 * pink); c.fillRect(-0.1 * L, -0.32 * L, 1.2 * L, 0.24 * L); c.globalCompositeOperation = 'source-over'; }
  if (night > 0.1) {
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, col] of [[0.8, -0.255, [90, 255, 140]], [-0.04, -0.16, [255, 250, 240]]]) {
      const r = L * 0.07, gr = c.createRadialGradient(x * L, y * L, 0, x * L, y * L, r); gr.addColorStop(0, rgb(col, night)); gr.addColorStop(1, rgb(col, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(x * L, y * L, r, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
}

// ------------------------------------------------------------------ THE SMOKE (billowing puffs, by day; on the city's canvas)
let puffCv = null;
function puffSprite() {
  if (puffCv) return puffCv;
  const S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = safeCtx(cv);
  // a soft billow: five overlapping lobes, each a soft radial — a cloud puff, never a disc
  for (const [ox, oy, r, a] of [[0, 0, 0.3, 0.55], [-0.15, 0.06, 0.22, 0.45], [0.16, 0.05, 0.22, 0.45], [-0.05, -0.12, 0.2, 0.4], [0.08, 0.12, 0.2, 0.4]]) {
    const cx = S / 2 + ox * S, cy = S / 2 + oy * S, g = x.createRadialGradient(cx, cy, 0, cx, cy, r * S);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.55, `rgba(255,255,255,${a * 0.5})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  return (puffCv = cv);
}
const PUFF_DT = 0.05;                                                    // (a puff every 0.05 s of flight — ~3 units apart: one body of smoke, never beads)

export function createBarnstorm() {
  let cur = null, fg = null, fx = null, band = null, dpr = 2, lastE = -1;
  const ensure = (W, nr) => {
    const top = Math.max(0, nr.y - nr.h * 1.4), h = nr.h * 2.9, d = Math.min(2, dpr);
    if (!fg) {
      fg = document.createElement('canvas'); fg.className = 'nd-skyfront'; fg.setAttribute('aria-hidden', 'true');
      fg.style.cssText = 'position:fixed;left:0;pointer-events:none;z-index:60;';
      document.body.appendChild(fg);
    }
    if (!band || band.top !== top || band.h !== h || band.W !== W) {
      band = { top, h, W }; fg.width = Math.ceil(W * d); fg.height = Math.ceil(h * d);
      fg.style.top = `${top}px`; fg.style.width = `${W}px`; fg.style.height = `${h}px`;
      fx = safeCtx(fg);
    }
    return d;
  };
  const drop = () => { if (fg) { fg.remove(); fg.width = 0; fg = null; fx = null; band = null; } };
  // the logo's box on the screen (title.js#logoRect is 7 % / 18 % inside it — the same mapping as the sign's dark halo)
  const boxOf = nr => { const w0 = nr.w / 0.86, h0 = nr.h / 0.64, x0 = nr.x - w0 * 0.07, y0 = nr.y - h0 * 0.18, k = w0 / (LOGO_W + 52); return { ox: x0 + 26 * k, oy: y0 + 30 * k, k }; };
  /** THE SMOKE: puffs laid on the real path on a fixed grid of times — each swelling, rising, drifting on the wind, fading (~BARN_SMOKE s) */
  function smoke(c, e, B, day, s) {
    const L = s.L, mo = s.motion !== 0 && s.motion !== false;
    const wind = Math.sin(((L.windDir == null ? 250 : L.windDir)) * Math.PI / 180) * Math.min(10, L.wind == null ? 2 : L.wind) * 0.45;
    const P = puffSprite(), k = B.k;
    const last = Math.min(e - 0.06, BARN_LEN), first = Math.max(0, e - BARN_SMOKE);
    if (last <= first) return;
    c.save();
    for (let tk = Math.floor(last / PUFF_DT) * PUFF_DT; tk >= first; tk -= PUFF_DT) {
      const p = barnAt(tk); if (!p.on) continue;
      const age = e - tk, i = Math.round(tk / PUFF_DT);
      // (from the tail: half a plane length behind its centre along the heading)
      const bx = p.x - Math.cos(p.ang) * BARN_PLANE * 0.52, by = p.y - Math.sin(p.ang) * BARN_PLANE * 0.52;
      const j = hash01(i, 3) - 0.5, j2 = hash01(i, 5) - 0.5;
      const grow = 1 - Math.exp(-age / 2.2);
      const r = (4.6 + 16 * grow + age * 0.9) * k * (0.85 + 0.3 * hash01(i, 7));
      const dx = (mo ? wind * age + j * 6 * grow : 0) * k, dy = (mo ? -age * 0.9 + j2 * 5 * grow : 0) * k;
      const a = day * 0.5 * (1 - smooth(BARN_SMOKE * 0.5, BARN_SMOKE, age)) * (0.62 + 0.38 * (1 - grow)) * smooth(0, 0.2, age);
      if (a <= 0.01) continue;
      const [sx, sy] = [B.ox + bx * k + dx, B.oy + by * k + dy];
      c.globalAlpha = Math.min(1, a); c.drawImage(P, sx - r, sy - r, r * 2, r * 2);
    }
    c.restore();
  }
  return {
    start(at) { cur = { at }; lastE = -1; return true; },
    on: () => !!cur,
    /** the plane itself in the air (its smoke may hang on after it): the prop's sound follows this */
    flying: () => !!cur && lastE <= BARN_LEN,
    stop() { cur = null; drop(); },
    setDpr(d) { dpr = d; band = null; },
    /** its smoke on the city's canvas (behind the sign) + the plane on the overlay (between the sign's layers) */
    draw(c, s) {
      const nr = s.textRects && s.textRects.neon;
      if (!cur || !nr) { if (fg) drop(); return; }
      const e = (s.now - cur.at) / 1000;
      lastE = e;
      if (e > BARN_LEN + BARN_SMOKE) { cur = null; drop(); return; }
      if (e < 0) return;
      const B = boxOf(nr), toS = (x, y) => [B.ox + x * B.k, B.oy + y * B.k], L = s.L;
      const day = clamp01(L.w.day + L.w.golden * 0.8 + L.w.dawn * 0.6) * (1 - clamp01(L.w.night + L.w.late)), night = clamp01(L.w.night + L.w.late);
      // THE SMOKE (by day), thick + billowing, hanging after it has gone (behind the sign)
      if (day > 0.2) smoke(c, e, B, day, s);
      if (e > BARN_LEN) { if (day <= 0.2) cur = null; if (fg) drop(); return; }      // (no smoke after dark: done when it has gone)
      // THE PLANE on the overlay, the strokes it's behind cut out of it
      const W = s.cam && s.cam.W ? s.cam.W : (typeof innerWidth !== 'undefined' ? innerWidth : 400);
      const d = ensure(W, nr), p = barnAt(e);
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fg.width, fg.height);
      if (!p.on) return;
      fx.setTransform(d, 0, 0, d, 0, -band.top * d);
      const [px, py] = toS(p.x, p.y), len = BARN_PLANE * B.k;
      const nearSign = 1 - smooth(0, 60, Math.max(0, Math.abs(p.x - 166) - 166));
      fx.save(); fx.translate(px, py); fx.rotate(p.ang); fx.translate(-len * 0.5, 0);
      drawBiplane(fx, len, Math.max(0.2, day), night, performance.now() / 1000, night * nearSign * 0.8);
      fx.restore();
      fx.save(); fx.globalCompositeOperation = 'destination-out'; fx.translate(B.ox, B.oy); fx.scale(B.k, B.k);
      fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.lineWidth = TUBE_CUT; fx.strokeStyle = '#000';
      for (const st of BEHIND) { fx.save(); fx.translate(st.x, 0); fx.stroke(new Path2D(st.d)); fx.restore(); }
      fx.restore();
    },
    /** the letters flicker a touch in its wake (at night, while the sign is lit): a level for the sign-dim hook, or null */
    wake(s) {
      if (!cur) return null;
      const e = (s.now - cur.at) / 1000, p = barnAt(e);
      if (!p.on || p.x < -10 || p.x > LOGO_W + 10) return null;
      return Math.sin(e * 37) > 0.6 ? 0.78 : null;
    },
    debug: () => (cur ? { at: cur.at, overlay: !!fg } : null),
    destroy() { cur = null; drop(); },
  };
}
