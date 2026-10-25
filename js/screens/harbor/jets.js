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
import { FORMATIONS } from '../../core/harbor-legend.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** the hour's light on a jet (from the look): day / golden / dark (0..1) */
export function jetLook(L) { return { day: clamp01(L.w.day + L.w.dawn * 0.7), golden: L.w.golden || 0, dark: clamp01(L.w.night + L.w.late) }; }

// ------------------------------------------------------------------ the airframe (nose → +x, in jet lengths; y down; the nozzle at 0)
// POLISH 4 — THE F-16, MUCH MORE DETAIL (the owner: "a real F-16 shape, two-tone grey camouflage with panel lines, USAF roundels, a
// small American flag on the tail, wingtip missiles + ordnance on pylons"). Seen from the side + a little below: the ogive radome +
// its pitot, the gold-tinted BUBBLE canopy far forward (the pilot's helmet in it), the CHIN INTAKE's big mouth under the cockpit,
// the leading-edge STRAKE flowing into the cropped delta (the near wing seen from just below), the tall swept FIN (its rudder line,
// the flag, the cap), the all-moving stabilator, the ventral fins, the nozzle's petals; THE CAMO — the medium grey sides, the
// darker grey upper surfaces in a soft disruptive pattern, the light grey belly; engraved panel lines + access panels; THE STAR-AND-
// BAR on the intake + under the near wing; THE STORES — an AIM-9 on the wingtip rail, an AIM-120 on the outer pylon, a 370-gal tank
// on the inner one. Lit by the hour: the sun on the spine by day (warm at golden hour), a dark shape with the moon's cool hair on its
// back at night (the city is dark under the TR-3B).
const FUSE = [   // the fuselage outline (cubic beziers: c1, c2, end)
  ['M', 1.0, 0.004],
  ['C', 0.96, -0.012, 0.91, -0.03, 0.84, -0.04],            // the radome up to the windscreen's foot
  ['L', 0.6, -0.05],                                         // (under the canopy)
  ['C', 0.5, -0.058, 0.38, -0.056, 0.27, -0.05],             // the dorsal spine
  ['C', 0.16, -0.046, 0.08, -0.04, 0.035, -0.033],           // down to the nozzle
  ['L', 0.035, 0.03],
  ['C', 0.1, 0.04, 0.24, 0.05, 0.36, 0.052],                 // the engine's belly
  ['C', 0.42, 0.06, 0.5, 0.08, 0.58, 0.084],                 // the intake duct's underside
  ['L', 0.655, 0.086],                                       // the lower lip
  ['L', 0.69, 0.034],                                        // the mouth's leading edge, up to the fuselage
  ['C', 0.8, 0.03, 0.92, 0.022, 1.0, 0.004],                 // the chin up to the nose
];
function fusePath(x) {
  x.beginPath();
  for (const s of FUSE) { if (s[0] === 'M') x.moveTo(s[1], s[2]); else if (s[0] === 'L') x.lineTo(s[1], s[2]); else x.bezierCurveTo(s[1], s[2], s[3], s[4], s[5], s[6]); }
  x.closePath();
}
const FIN = [[0.3, -0.049], [0.125, -0.325], [0.05, -0.325], [0.04, -0.04]];
const WING = [[0.54, 0.028], [0.305, 0.142], [0.215, 0.142], [0.19, 0.042]];
const FARW = [[0.5, -0.052], [0.36, -0.088], [0.29, -0.088], [0.23, -0.05]];
const STAB = [[0.13, 0.028], [0.005, 0.094], [-0.035, 0.092], [-0.008, 0.028]];
const VENT = [[0.16, 0.045], [0.115, 0.088], [0.085, 0.088], [0.1, 0.045]];
function paintJet(x, look) {
  const day = clamp01(look.day + look.golden * 0.8) * (1 - look.dark), gold = clamp01(look.golden * 1.3) * (1 - look.dark), dark = look.dark;
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  // (the hour's light on a paint colour: warm at golden hour, a dark blue-grey at night that keeps a little of the colour)
  const lit = c => mix(mix(c, c.map((v, i) => (v + [190, 140, 110][i]) / 2), gold * 0.55), c.map(v => 22 + v * 0.18), dark * 0.85);
  // THE GREYS (FS 36118 gunship grey on top, 36270 on the sides, 36375 under) — lit by the hour
  const gTop = lit([84, 90, 98]), gSide = lit([128, 134, 140]), gBelly = lit([166, 171, 176]), gDark = lit([62, 66, 74]);
  const line = (a = 0.3) => rgb([0, 0, 0], a * (0.6 + 0.4 * day));
  const hair = (a = 0.16) => rgb([255, 255, 255], a * day);
  // the FAR wing + the far stabilator (behind the body, darker): their edges just showing above the spine
  poly(FARW, rgb(mix(gTop, [10, 12, 18], 0.35)));
  poly([[0.12, -0.03], [0.0, -0.08], [-0.035, -0.077], [-0.005, -0.028]], rgb(mix(gTop, [10, 12, 18], 0.4)));
  // THE FIN: tall + swept; the camo's dark grey on its upper half, the rudder's hinge, the cap, the flag, the leading edge lit
  poly(FIN, rgb(gSide));
  x.save(); x.beginPath(); FIN.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.clip();
  x.fillStyle = rgb(gTop); x.beginPath(); x.moveTo(0.3, -0.12); x.bezierCurveTo(0.22, -0.16, 0.14, -0.1, 0.02, -0.15); x.lineTo(0.02, -0.34); x.lineTo(0.3, -0.34); x.closePath(); x.fill();
  x.fillStyle = rgb(gDark); x.fillRect(0.04, -0.33, 0.12, 0.022);                                      // (the antenna cap)
  x.strokeStyle = line(0.35); x.lineWidth = 0.003; x.beginPath(); x.moveTo(0.072, -0.3); x.lineTo(0.074, -0.06); x.stroke();   // (the rudder)
  // THE FLAG (a small one, mid-fin): seven stripes + the blue canton with its stars as a speckle
  { const fx = 0.105, fy = -0.235, fw = 0.072, fh = 0.042, R = lit([178, 34, 52]), Wt = lit([238, 238, 236]), B = lit([40, 52, 104]);
    for (let k = 0; k < 7; k++) { x.fillStyle = rgb(k % 2 ? Wt : R); x.fillRect(fx, fy + fh * k / 7, fw, fh / 7 + 0.0006); }
    x.fillStyle = rgb(B); x.fillRect(fx, fy, fw * 0.42, fh * 4 / 7);
    x.fillStyle = rgb(Wt, 0.8); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.fillRect(fx + 0.006 + i * 0.01, fy + 0.006 + j * 0.01, 0.003, 0.003);
    x.strokeStyle = line(0.25); x.lineWidth = 0.0015; x.strokeRect(fx, fy, fw, fh); }
  x.restore();
  x.strokeStyle = hair(0.45); x.lineWidth = 0.004; x.beginPath(); x.moveTo(0.3, -0.049); x.lineTo(0.125, -0.325); x.stroke();
  // THE FUSELAGE: the side grey, the top dark grey in a wavy disruptive band, the light grey belly (+ the intake's shadowed mouth)
  fusePath(x); x.fillStyle = rgb(gSide); x.fill();
  x.save(); fusePath(x); x.clip();
  x.fillStyle = rgb(gBelly); x.beginPath(); x.moveTo(0, 0.03); x.bezierCurveTo(0.3, 0.025, 0.6, 0.04, 1.0, 0.016); x.lineTo(1.0, 0.1); x.lineTo(0, 0.1); x.closePath(); x.fill();
  x.fillStyle = rgb(gTop); x.beginPath(); x.moveTo(0, -0.06);
  for (let i = 0; i <= 24; i++) { const u = i / 24, py = -0.024 + 0.012 * Math.sin(u * 19 + 0.8) + 0.007 * Math.sin(u * 41 + 2) + (u > 0.82 ? (u - 0.82) * 0.08 : 0); x.lineTo(u, py); }
  x.lineTo(1, -0.1); x.lineTo(0, -0.1); x.closePath(); x.fill();
  // the disruptive patches: soft blobs of the darker grey across the side (the old wraparound pattern, toned down)
  x.fillStyle = rgb(gDark, 0.7);
  for (const [cx, cy, rx, ry, a] of [[0.47, -0.02, 0.07, 0.014, 0.1], [0.22, -0.015, 0.06, 0.013, -0.12], [0.78, -0.02, 0.045, 0.01, 0.15]]) { x.beginPath(); x.ellipse(cx, cy, rx, ry, a, 0, TAU); x.fill(); }
  // the light: the sun on the spine (a lit band) by day, the shade under
  const lg = x.createLinearGradient(0, -0.07, 0, 0.09);
  lg.addColorStop(0, `rgba(255,250,240,${(0.22 * day).toFixed(3)})`); lg.addColorStop(0.35, 'rgba(255,250,240,0)'); lg.addColorStop(0.7, 'rgba(0,0,0,0)'); lg.addColorStop(1, `rgba(0,0,10,${(0.22 + 0.1 * dark).toFixed(3)})`);
  x.fillStyle = lg; x.fillRect(0, -0.1, 1.05, 0.2);
  // PANEL LINES: the stations, the strake's seam along the side, access panels (engraved: a dark cut + a hair of light)
  x.lineWidth = 0.0026;
  for (const [px, top, bot] of [[0.885, -0.03, 0.02], [0.6, -0.05, 0.035], [0.5, -0.056, 0.07], [0.4, -0.056, 0.057], [0.31, -0.052, 0.05], [0.2, -0.047, 0.045], [0.1, -0.04, 0.038]]) {
    x.strokeStyle = line(0.32); x.beginPath(); x.moveTo(px, top); x.lineTo(px - 0.004, bot); x.stroke();
    x.strokeStyle = hair(0.1); x.beginPath(); x.moveTo(px + 0.003, top); x.lineTo(px - 0.001, bot); x.stroke();
  }
  x.strokeStyle = line(0.3); x.beginPath(); x.moveTo(0.84, 0.008); x.bezierCurveTo(0.7, 0.012, 0.5, 0.016, 0.22, 0.012); x.stroke();
  for (const [ax, ay, aw, ah] of [[0.55, -0.035, 0.03, 0.014], [0.34, -0.04, 0.035, 0.012], [0.25, 0.018, 0.03, 0.016], [0.43, 0.02, 0.025, 0.014]]) { x.strokeStyle = line(0.26); x.strokeRect(ax, ay, aw, ah); }
  // the intake's mouth (dark, its lip lit) + the boundary-layer gap above it
  x.fillStyle = rgb(mix(gBelly, [6, 6, 10], 0.7)); x.beginPath(); x.moveTo(0.69, 0.036); x.lineTo(0.655, 0.084); x.lineTo(0.641, 0.083); x.quadraticCurveTo(0.66, 0.055, 0.676, 0.037); x.closePath(); x.fill();
  x.strokeStyle = hair(0.35); x.lineWidth = 0.003; x.beginPath(); x.moveTo(0.69, 0.035); x.lineTo(0.655, 0.085); x.stroke();
  x.strokeStyle = line(0.4); x.lineWidth = 0.003; x.beginPath(); x.moveTo(0.69, 0.031); x.bezierCurveTo(0.6, 0.033, 0.5, 0.04, 0.4, 0.045); x.stroke();
  // THE STAR-AND-BAR on the intake's side
  roundel(x, 0.5, 0.055, 0.019, 1, lit);
  x.restore();
  // the radome's tip + the pitot probe
  x.strokeStyle = rgb(gDark); x.lineWidth = 0.0035; x.beginPath(); x.moveTo(0.995, 0.004); x.lineTo(1.045, 0.003); x.stroke();
  x.fillStyle = rgb(mix(gSide, [20, 22, 28], 0.25)); x.beginPath(); x.moveTo(1.0, 0.004); x.bezierCurveTo(0.975, -0.004, 0.955, -0.012, 0.93, -0.018); x.lineTo(0.93, 0.016); x.bezierCurveTo(0.955, 0.012, 0.975, 0.009, 1.0, 0.004); x.fill();
  // THE LEADING-EDGE STRAKE (a lit edge from under the canopy into the wing root)
  x.strokeStyle = hair(0.4); x.lineWidth = 0.0035; x.beginPath(); x.moveTo(0.8, 0.006); x.bezierCurveTo(0.7, 0.01, 0.6, 0.016, 0.54, 0.027); x.stroke();
  // THE CANOPY: the frameless bubble, gold-tinted; the pilot's helmet + the ejection seat's head inside; a long highlight
  { x.beginPath(); x.moveTo(0.84, -0.04); x.bezierCurveTo(0.815, -0.118, 0.69, -0.124, 0.6, -0.05); x.closePath();
    const cg = x.createLinearGradient(0.6, -0.105, 0.82, -0.04);
    cg.addColorStop(0, rgb(mix([24, 22, 20], [196, 150, 70], day * 0.9 + 0.06))); cg.addColorStop(0.6, rgb(mix([14, 14, 16], [120, 88, 44], day))); cg.addColorStop(1, rgb(mix([30, 30, 34], [210, 176, 110], day)));
    x.fillStyle = cg; x.fill();
    x.save(); x.clip();
    x.fillStyle = rgb(mix([10, 10, 14], [44, 46, 52], day)); x.beginPath(); x.arc(0.715, -0.079, 0.018, 0, TAU); x.fill();      // the helmet
    x.fillStyle = rgb(mix([8, 8, 10], [26, 26, 30], day)); x.fillRect(0.664, -0.088, 0.022, 0.04);                                  // the seat's head
    x.fillStyle = rgb(mix([20, 16, 10], [150, 110, 40], day), 0.8); x.beginPath(); x.ellipse(0.728, -0.08, 0.008, 0.007, 0, 0, TAU); x.fill();   // the visor
    x.restore();
    x.strokeStyle = rgb([255, 246, 226], 0.3 + 0.45 * day); x.lineWidth = 0.004; x.beginPath(); x.moveTo(0.818, -0.072); x.quadraticCurveTo(0.745, -0.113, 0.645, -0.088); x.stroke();
    x.strokeStyle = line(0.5); x.lineWidth = 0.003; x.beginPath(); x.moveTo(0.84, -0.04); x.lineTo(0.6, -0.05); x.stroke(); }
  // THE NEAR WING seen from just below (the cropped delta; its underside the light grey) + its flaperon line + the roundel under it
  poly(WING, rgb(mix(gBelly, [255, 255, 255], 0.05 * day)));
  x.save(); x.beginPath(); WING.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.clip();
  const wg = x.createLinearGradient(0, 0.03, 0, 0.14); wg.addColorStop(0, rgb([0, 0, 10], 0.18)); wg.addColorStop(1, rgb([255, 255, 255], 0.06 * day)); x.fillStyle = wg; x.fillRect(0.1, 0, 0.5, 0.15);
  x.strokeStyle = line(0.3); x.lineWidth = 0.0026; x.beginPath(); x.moveTo(0.235, 0.055); x.lineTo(0.235, 0.135); x.stroke();
  roundel(x, 0.33, 0.1, 0.022, 0.42, lit);
  x.restore();
  x.strokeStyle = hair(0.45); x.lineWidth = 0.004; x.beginPath(); x.moveTo(WING[0][0], WING[0][1]); x.lineTo(WING[1][0], WING[1][1]); x.stroke();
  // the stabilator (near) + the ventral fins
  poly(STAB, rgb(mix(gSide, gBelly, 0.4)));
  x.strokeStyle = hair(0.35); x.lineWidth = 0.003; x.beginPath(); x.moveTo(STAB[0][0], STAB[0][1]); x.lineTo(STAB[1][0], STAB[1][1]); x.stroke();
  poly(VENT, rgb(mix(gBelly, [0, 0, 0], 0.22)));
  // THE STORES: the 370-gal tank on the inner pylon, an AIM-120 on the outer one, the AIM-9 on the wingtip rail
  const white = lit([228, 230, 232]), grey = lit([150, 154, 160]), pyl = rgb(mix(gBelly, [0, 0, 0], 0.32));
  x.fillStyle = pyl; x.fillRect(0.335, 0.052, 0.04, 0.016); x.fillRect(0.285, 0.098, 0.035, 0.012);
  { const tg = x.createLinearGradient(0, 0.06, 0, 0.088); tg.addColorStop(0, rgb(mix(grey, [255, 255, 255], 0.2 * day))); tg.addColorStop(1, rgb(mix(grey, [0, 0, 0], 0.3)));
    x.fillStyle = tg; x.beginPath(); x.moveTo(0.47, 0.074); x.bezierCurveTo(0.44, 0.062, 0.3, 0.062, 0.24, 0.07); x.lineTo(0.215, 0.074); x.lineTo(0.24, 0.078); x.bezierCurveTo(0.3, 0.087, 0.44, 0.087, 0.47, 0.074); x.fill();
    poly([[0.25, 0.071], [0.215, 0.06], [0.21, 0.062], [0.235, 0.074]], rgb(grey)); }
  const missile = (x0, x1, y, w, body, nose) => {
    x.fillStyle = rgb(body); x.fillRect(x1, y - w / 2, x0 - x1, w);
    x.fillStyle = rgb(nose); x.beginPath(); x.moveTo(x0, y - w / 2); x.quadraticCurveTo(x0 + w * 2.4, y - w * 0.2, x0 + w * 2.6, y); x.quadraticCurveTo(x0 + w * 2.4, y + w * 0.2, x0, y + w / 2); x.fill();
    x.fillStyle = rgb(mix(body, [0, 0, 0], 0.3)); x.fillRect(x1, y + w * 0.1, x0 - x1, w * 0.4);                // (its shaded underside)
    x.fillStyle = rgb(lit([200, 170, 60])); x.fillRect(x0 - 0.03, y - w / 2, 0.006, w);                         // (the warhead band)
    poly([[x1 + 0.028, y], [x1 - 0.004, y - w * 2.1], [x1 - 0.014, y - w * 2.1], [x1, y]], rgb(body));
    poly([[x1 + 0.028, y], [x1 - 0.004, y + w * 2.1], [x1 - 0.014, y + w * 2.1], [x1, y]], rgb(mix(body, [0, 0, 0], 0.2)));
    poly([[x0 - 0.045, y], [x0 - 0.058, y - w * 1.5], [x0 - 0.066, y - w * 1.5], [x0 - 0.062, y]], rgb(body));
  };
  missile(0.4, 0.17, 0.112, 0.012, white, grey);                           // AIM-120 (under the wing)
  x.fillStyle = pyl; x.fillRect(0.21, 0.138, 0.1, 0.006);                   // (the wingtip rail)
  missile(0.35, 0.16, 0.15, 0.011, white, lit([120, 120, 128]));           // AIM-9 (on the tip)
  // THE NOZZLE: the petals ("turkey feathers") round the exhaust
  { const ng = x.createLinearGradient(0, -0.032, 0, 0.03); ng.addColorStop(0, rgb(lit([92, 86, 80]))); ng.addColorStop(1, rgb(lit([40, 38, 40])));
    x.fillStyle = ng; x.beginPath(); x.moveTo(0.04, -0.033); x.lineTo(-0.012, -0.027); x.lineTo(-0.012, 0.025); x.lineTo(0.04, 0.03); x.closePath(); x.fill();
    x.strokeStyle = line(0.45); x.lineWidth = 0.0022; for (let i = 0; i < 5; i++) { const yy = -0.026 + i * 0.0125; x.beginPath(); x.moveTo(0.035, yy * 1.1); x.lineTo(-0.01, yy); x.stroke(); }
    x.fillStyle = rgb([14, 12, 14]); x.fillRect(-0.014, -0.025, 0.005, 0.05); }
  // night: the moon's cool hair along the spine + the fin's edge (a dark shape that still reads against the sky)
  if (dark > 0.05) {
    x.strokeStyle = `rgba(170,186,220,${(0.32 * dark).toFixed(3)})`; x.lineWidth = 0.004;
    x.beginPath(); x.moveTo(0.93, -0.022); x.bezierCurveTo(0.8, -0.045, 0.5, -0.06, 0.3, -0.052); x.stroke();
    x.beginPath(); x.moveTo(0.3, -0.05); x.lineTo(0.125, -0.325); x.stroke();
  }
}
/** the USAF star-and-bar at (cx, cy), radius r (jet lengths), sq: its vertical squash (seen at a slant under the wing) */
function roundel(x, cx, cy, r, sq, lit) {
  const B = rgb(lit([34, 48, 104])), Wt = rgb(lit([236, 236, 234])), R = rgb(lit([178, 34, 52]));
  x.save(); x.translate(cx, cy); x.scale(1, sq);
  // the bars: blue outline, white field, the red stripe — then the blue disc + the white star
  x.fillStyle = B; x.fillRect(-r * 2.05, -r * 0.5, r * 4.1, r * 1.0);
  x.fillStyle = Wt; x.fillRect(-r * 1.95, -r * 0.4, r * 3.9, r * 0.8);
  x.fillStyle = R; x.fillRect(-r * 1.95, -r * 0.13, r * 3.9, r * 0.26);
  x.fillStyle = B; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
  x.fillStyle = Wt; x.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.38 : r * 0.92; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  x.closePath(); x.fill();
  x.restore();
}

/** a jet sprite: len pt long, nose toward +x (mirrored when drawn) → { cv, w, h, ox, oy (the nozzle's place in the sprite, pt) } */
export function jetSprite(len, look, dpr) {
  const W = len * 1.14, H = len * 0.64, d = 3;                  // (3× always: a small sprite — the detail needs the pixels)
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  const ox = len * 0.06, oy = len * 0.36;
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
  for (const [a, b] of [[0.72, -0.02], [0.21, -0.04], [0.19, -0.17]]) c.drawImage(tinted(G), a * len - gs, b * len - gs * 0.5, gs * 2, gs);
  c.globalAlpha = 1;
  strip(0.78, -0.018, 0.67, -0.022); strip(0.3, -0.042, 0.12, -0.036); strip(0.22, -0.12, 0.165, -0.22);
  const nav = navDir > 0 ? [90, 255, 140] : [255, 60, 60];
  c.globalAlpha = 0.85 * night; c.drawImage(tinted(nav), 0.6 * len - gs * 0.6, 0.062 * len - gs * 0.6, gs * 1.2, gs * 1.2);
  c.globalAlpha = night; c.fillStyle = rgb(nav); c.beginPath(); c.arc(0.6 * len, 0.062 * len, Math.max(0.6, len * 0.012), 0, TAU); c.fill();
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
    /** bake a jet's sprite ahead of its pass (never on the frame it screams in) */
    warm(len, look) { sprite(len, look); },
    setDpr(d) { if (d !== dpr) { dpr = d; for (const v of cache.values()) v.cv.width = 0; cache.clear(); } },
    destroy() { for (const v of cache.values()) v.cv.width = 0; cache.clear(); },
  };
}

// ------------------------------------------------------------------ THE AIR SHOW + THE MISSING MAN (POLISH 4 — plan.md 6b note 8)
// The owner after 6b: "comically bad" (flat jets, jerky smoke, an abrupt pull-up into a perfect circle) → DECIDED: no loops; only
// what can look great. Flights are a function of the seconds since they began (every phone the same sky, a late arrival mid-show):
//   'airshow'   THE FORMATION FLYBY: a tight DIAMOND of four, straight across the sky, smooth + fast, smoke on by day — a pass left →
//               right low in the open sky, then (after a breath) a second pass right → left higher up. ~16 s.
//   'missing'   THE MISSING MAN (Memorial + Veterans Day): a finger-four straight across right → left; #3 pulls up in a smooth, gentle
//               climb (an eased curve, never a snap) and peels away into the sky alone while the three fly on. ~11 s, no smoke.
// THE SMOKE: each jet's trail is ONE continuous ribbon along its own past path (analytic: sampled densely every frame, sub-pixel),
// widening + thinning with age, drifting a touch, a wide faint body under a brighter core — never segmented.
export const SHOW_LEN = { airshow: 16, missing: 11, flyby: 5 };
const sm01 = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
/** the passes: [{ t0, dur, dir (±1), y (fraction of the box's height) }] */
export const SHOW_PASSES = Object.freeze({ airshow: [{ t0: 0, dur: 5.2, dir: 1, y: 0.85 }, { t0: 8, dur: 5.6, dir: -1, y: 0.68 }], missing: [{ t0: 0, dur: 10.5, dir: -1, y: 0.8 }],
  // POLISH 4 — THE SURPRISE FLYBY: one fast pass, full afterburner, low over the crowns (its direction + size per evening)
  flyby: [{ t0: 0, dur: 3.6, dir: 1, y: 0.8 }] });
/** each kind's formation: the flyby's 2–4 (an echelon, four in a finger), the missing man's finger-four, the air show's diamond */
const slotsOf = (kind, n = 4) => (kind === 'missing' ? FORMATIONS.finger : kind === 'flyby' ? (n >= 4 ? FORMATIONS.finger : FORMATIONS.chase.slice(0, Math.max(2, n))) : FORMATIONS.diamond);
/** the missing man's #3: its climb (rad, nose up) e seconds into the pass — eased in over 2.8 s from 4.4 s, held, a little more later */
export const mmClimb = e => 0.62 * sm01(4.4, 7.2, e) + 0.22 * sm01(7.6, 9.6, e);
/** the lead's place at s (box: the open sky { x, y, w, h }) → { x, y, ang (screen heading: 0 = right, π = left), on, burn, dir, pass, u } */
export function showLead(kind, s, box, flip = 1) {
  const { x: X, y: Y, w: Wd, h: Hh } = box;
  const P = SHOW_PASSES[kind] || [];
  for (let k = 0; k < P.length; k++) {
    const p0 = P[k], p = flip < 0 ? { ...p0, dir: -p0.dir } : p0, e = s - p.t0;
    if (e < -0.6 || e > p.dur + 1.2) continue;
    const u = e / p.dur, xf = -0.22 + 1.44 * u;            // (from just off one edge to just off the other)
    // a gentle, shallow drift — the formation's line never quite flat, never a bump
    const y = Y + Hh * (p.y + 0.025 * Math.sin(u * Math.PI));
    return { x: p.dir > 0 ? X + Wd * xf : X + Wd * (1 - xf), y, ang: p.dir > 0 ? -0.025 * Math.cos(u * Math.PI) : Math.PI + 0.025 * Math.cos(u * Math.PI), on: true, burn: kind === 'missing' ? 0.3 : kind === 'flyby' ? 1 : 0.4, dir: p.dir, pass: k, u, e, v: Wd * 1.44 / p.dur };
  }
  return { on: false };
}
/** the formation at s → [{ x, y, ang, burn, i, dir }] (the missing man's #3 its own way: its climb integrated along its path) */
export function showJets(kind, s, box, len, flip = 1, n = 4) {
  const slots = slotsOf(kind, n), out = [];
  const L0 = showLead(kind, s, box, flip);
  if (!L0.on) return out;
  slots.forEach(([fx, fy], i) => {
    // (each slot in the lead's own frame: fx jet lengths back along the heading, fy across it)
    const ca = Math.cos(L0.ang), sa = Math.sin(L0.ang);
    let x = L0.x + ca * fx * len * 1.05 - sa * fy * len * 0.58, y = L0.y + sa * fx * len * 1.05 + ca * fy * len * 0.58;
    let ang = L0.ang, burn = L0.burn;
    if (kind === 'missing' && i === 2) {
      // THE PULL-UP: the heading eases up from level (a smooth curve, integrated — the path is the heading's own), the burner lit as it climbs
      const n = 40, e1 = L0.e, e0 = 4.2;
      if (e1 > e0) {
        let px = 0, py = 0;
        for (let k = 0; k < n; k++) { const e = e0 + (e1 - e0) * (k + 0.5) / n, c = mmClimb(e); px += Math.cos(c) * (e1 - e0) / n; py -= Math.sin(c) * (e1 - e0) / n; }
        const straight = e1 - e0, v = L0.v;                                    // (pt / s along the path)
        x += L0.dir * (px - straight) * v; y += py * v;
        const c = mmClimb(e1); ang = L0.dir > 0 ? -c : Math.PI + c;
        burn = 0.3 + 0.7 * sm01(4.6, 6, e1);
      }
    }
    out.push({ x, y, ang, burn, i, dir: L0.dir, vapour: 0 });
  });
  return out;
}

/** a jet's nose-up angle for jets.draw from its screen heading θ and its leg's mirror direction */
export const climbOf = (theta, dir) => (dir > 0 ? -theta : theta - Math.PI);

/** THE AIR SHOW / THE MISSING MAN on the screen: start(kind, at) · draw(c, s, box) · on() · listen() (the sound's moment) */
export function createAirShow() {
  const jets = createJets();
  let cur = null, lastBox = null;
  const lenOf = box => Math.max(36, Math.min(box.w * 0.15, 86));
  // the smoke's ribbons: sampled along each jet's own past positions (dense, analytic — smooth at any frame rate)
  function smoke(c, e, box, len, night) {
    if (cur.kind !== 'airshow' || night > 0.5) return;
    const day = 1 - night, AGE = 5.5, N = 30;
    for (let i = 0; i < 4; i++) {
      const pts = [];
      for (let k = 0; k <= N; k++) {
        const a = (k / N) * (k / N) * AGE, t = e - a;                 // (denser near the jet, where the trail is thin + crisp)
        const J = showJets(cur.kind, t, box, len, cur.flip, cur.n).find(j => j.i === i);
        if (!J) break;
        const ca = Math.cos(J.ang), sa = Math.sin(J.ang);
        // the nozzle's place, the smoke drifting down a touch + billowing as it ages
        pts.push({ x: J.x - ca * len * 0.5 + Math.sin(a * 1.3 + i) * a * 0.8, y: J.y - sa * len * 0.5 + a * a * 0.9 + Math.sin(a * 2.1 + i * 2) * a * 0.5, a, nx: -sa, ny: ca });
      }
      if (pts.length < 2) continue;
      for (const [wk, ak] of [[3.2, 0.16], [1.6, 0.3], [0.7, 0.42]]) {
        c.beginPath();
        for (let k = 0; k < pts.length; k++) { const p = pts[k], w = (0.9 + p.a * 2.4) * wk * 0.5; k ? c.lineTo(p.x + p.nx * w, p.y + p.ny * w) : c.moveTo(p.x + p.nx * w, p.y + p.ny * w); }
        for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k], w = (0.9 + p.a * 2.4) * wk * 0.5; c.lineTo(p.x - p.nx * w, p.y - p.ny * w); }
        c.closePath();
        const p0 = pts[0], p1 = pts[pts.length - 1], g = c.createLinearGradient(p0.x, p0.y, p1.x, p1.y), fade = p1.a / AGE;
        g.addColorStop(0, `rgba(252,252,254,${(ak * day).toFixed(3)})`); g.addColorStop(Math.min(0.99, 0.5 / Math.max(0.5, fade)) * 0.6, `rgba(250,250,252,${(ak * 0.6 * day).toFixed(3)})`); g.addColorStop(1, 'rgba(248,248,250,0)');
        c.fillStyle = g; c.fill();
      }
    }
  }
  return {
    /** o (the surprise flyby): { dir (±1), n (2–4 jets) } */
    start(kind, at, o = {}) { if (!SHOW_LEN[kind]) return false; cur = { kind, at, flip: o.dir === -1 ? -1 : 1, n: o.n || 4 }; return true; },
    on: () => !!cur,
    kind: () => (cur ? cur.kind : null),
    stop() { cur = null; },
    setDpr(d) { jets.setDpr(d); },
    draw(c, s, box) {
      if (!cur || !box) return;
      lastBox = box;
      const e = (s.now - cur.at) / 1000;
      if (e > SHOW_LEN[cur.kind] + 2) { cur = null; return; }
      if (e < -1) return;
      const len = lenOf(box), look = jetLook(s.L);
      // (the jets' sprite baked in the second before they come — never on the frame they enter)
      if (e < 0) { jets.warm(len, look); return; }
      c.save(); smoke(c, e, box, len, look.dark); c.restore();
      for (const J of showJets(cur.kind, e, box, len, cur.flip, cur.n)) jets.draw(c, { x: J.x, y: J.y, dir: J.dir, ang: climbOf(J.ang, J.dir), len, look, burn: J.burn, vapour: 0, t: performance.now() / 1000 + J.i * 0.29, i: J.i });
    },
    /** THE SOUND (POLISH 4: in sync): the pass coming — { key (once per pass), dir, peakIn (s until the formation's middle crosses
     *  the screen's centre: the roar's peak lands there), x (the formation's middle now, a fraction of the box's width) } from ~5 s
     *  before it, or null */
    listen(s) {
      if (!cur) return null;
      const e = (s.now - cur.at) / 1000, P = SHOW_PASSES[cur.kind] || [];
      for (let k = 0; k < P.length; k++) {
        // (the lead crosses the centre at u 0.5; the formation's middle trails it by its mean slot, at the pass's speed)
        const box = lastBox || { w: 400 }, slots = slotsOf(cur.kind, cur.n), back = -slots.reduce((q, [fx]) => q + fx, 0) / slots.length;
        const p = P[k], mid = p.t0 + 0.5 * p.dur + back * lenOf(box) * 1.05 / (box.w * 1.44 / p.dur);
        if (e > mid - 5.5 && e < mid + 1.5) {
          const L0 = lastBox ? showLead(cur.kind, Math.max(p.t0, e), lastBox, cur.flip) : null;
          return { key: `${cur.at}|${k}`, dir: p.dir * cur.flip, peakIn: mid - e, x: L0 && L0.on ? (L0.x - lastBox.x) / lastBox.w : (p.dir > 0 ? 0 : 1), gain: 1 };
        }
      }
      return null;
    },
    debug: () => (cur ? { kind: cur.kind, at: cur.at } : null),
    destroy() { jets.destroy(); cur = null; },
  };
}
