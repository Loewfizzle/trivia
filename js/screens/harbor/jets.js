// CITY 2.0 — THE HARBOR, PART 6b → Oct 25: THE JETS — ONE stealth fighter shared by the TR-3B's CHASE, THE AIR SHOW (a diamond of four,
// smoke on), THE MISSING MAN (a finger-four, #3 pulling up and away) and THE SURPRISE FLYBY (docs/harbor/passes/the-tr-3bs-music-the-f-22-no-traffic.md; plan.md "THE JETS →
// AN F-22 RAPTOR-STYLE STEALTH FIGHTER": the F-16s "look too cartoonish — they need to look like modern, real, menacing flying death
// machines"). Seen from below + the side as they cross. Realism at phone size comes from SILHOUETTE + SHADING:
//   THE AIRFRAME   the angular FACETED body — a chined forebody with a hard light / dark edge along it, the long gold-tinted bubble canopy,
//                  the raked parallelogram INTAKES, the DIAMOND wing seen from just below, the big diamond stabilators, TWIN CANTED
//                  TAILS, the 2-D vectoring nozzles with SERRATED edges; INTERNAL weapons bays (their sawtooth doors closed on the
//                  belly — nothing hangs outside); dark GUNMETAL grey with real specular highlights (the sun along the spine + the chine,
//                  a hot spot on the canopy, a sheen across the fin) and per-panel shading (no flat fills, no thick outlines);
//                  low-visibility grey USAF markings (a grey-on-grey star-and-bar, the fin's flash); a sprite per (size, light), cached
//   THE AFTERBURNER (live, additive) a tapered plume from the nozzle with MACH DIAMONDS — 5 evenly spaced shock nodes: white-hot at
//                  the nozzle, then blue-white, violet, orange, a dim orange — crisp rhombi with a tight glow, flickering a touch; at night
//                  a soft glow round the whole plume (dimmer by day, still read); HEAT HAZE behind the engines (a shimmer of pale blobs)
//   MOTION BLUR    (live) on full burn the airframe streaks: two fainter copies trail it by a hair
//   THE LIGHTS     at night: the formation strips (the forebody's chine, the aft fuselage, the fin's tip), the near wingtip's nav light
//                  (green flying right: its starboard side is ours; red flying left), a white tail light, the beacon on the spine
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
// THE F-22 (Oct 25). Every edge is a straight facet or a long flat curve — nothing bulbous. The forebody is a wedge with a CHINE (the
// sharp edge running from the nose along the side to the intake's top corner): above it the upper facet catches the sky and the sun,
// below it the lower facet sits in shade — that one hard tone break is what makes it read as a stealth jet at 90 pt. The intakes are
// raked parallelograms under the chine, their mouths dark with a lit sharp lip. The wing is a big diamond: its leading edge swept back
// from the intake's top to the cropped tip, its trailing edge swept forward to the root at the nozzles. The stabilators are diamonds too,
// overlapping the fins' feet. The twin fins are canted outward: the near one leans toward us (its outer face lit), the far one shows as
// a sliver above it. The nozzles are flat 2-D wedges with serrated trailing edges. The belly carries the sawtooth outlines of the closed
// weapons bay doors. The paint: a gunmetal grey that changes tone panel by panel, a bright specular line along the spine, a hair of light
// on every leading edge, the gold canopy with a hot spot, grey-on-grey markings.
const FUSE = [   // the fuselage outline (cubic beziers: c1, c2, end)
  ['M', 1.0, 0.0],
  ['C', 0.95, -0.01, 0.89, -0.026, 0.84, -0.034],           // the chined forebody up to the canopy's foot
  ['L', 0.59, -0.047],                                       // (the canopy sill)
  ['C', 0.5, -0.053, 0.4, -0.054, 0.33, -0.052],             // the spine behind the canopy
  ['L', 0.2, -0.045],                                        // the aft deck between the fins
  ['L', 0.05, -0.03],
  ['L', 0.0, -0.026],                                        // the nozzle's top
  ['L', 0.0, 0.03],
  ['L', 0.14, 0.044],                                        // the engine bay's underside
  ['C', 0.3, 0.056, 0.46, 0.064, 0.6, 0.083],                // the belly out to the intake's underside
  ['L', 0.72, 0.085],                                        // the intake's lower lip
  ['L', 0.78, 0.027],                                        // the mouth's raked edge up to the chine
  ['C', 0.86, 0.02, 0.94, 0.009, 1.0, 0.0],                  // the chine to the nose
];
function fusePath(x) {
  x.beginPath();
  for (const s of FUSE) { if (s[0] === 'M') x.moveTo(s[1], s[2]); else if (s[0] === 'L') x.lineTo(s[1], s[2]); else x.bezierCurveTo(s[1], s[2], s[3], s[4], s[5], s[6]); }
  x.closePath();
}
const FIN = [[0.33, -0.05], [0.175, -0.255], [0.09, -0.255], [0.1, -0.045]];                 // the near canted fin (short + broad: a Raptor's)
const FINF = [[0.35, -0.058], [0.205, -0.268], [0.12, -0.268], [0.118, -0.056]];              // the far one (a sliver above + behind the near)
const WING = [[0.62, 0.04], [0.33, 0.172], [0.255, 0.172], [0.2, 0.06]];                      // the near wing, from just below
const FARW = [[0.56, -0.05], [0.4, -0.066], [0.33, -0.066], [0.25, -0.05]];                   // the far wing's edge: a sliver over the spine
const STAB = [[0.26, 0.036], [0.075, 0.11], [-0.005, 0.108], [-0.03, 0.036]];                 // the near stabilator (a diamond)
const MOUTH = [[0.78, 0.027], [0.72, 0.085], [0.705, 0.084], [0.762, 0.03]];                  // the intake's mouth (dark)
const CHINE = [[1.0, 0.0], [0.94, 0.009], [0.86, 0.02], [0.78, 0.027], [0.64, 0.032], [0.6, 0.083], [0.72, 0.085]];   // (the lower forebody facet, under the chine)
function paintJet(x, look) {
  const day = clamp01(look.day + look.golden * 0.8) * (1 - look.dark), gold = clamp01(look.golden * 1.3) * (1 - look.dark), dark = look.dark;
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  const clipPoly = pts => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.clip(); };
  // (the hour's light on a paint colour: warm at golden hour, a dark blue-grey at night that keeps a little of the colour)
  const lit = c => mix(mix(c, c.map((v, i) => (v + [190, 140, 110][i]) / 2), gold * 0.5), c.map(v => 16 + v * 0.2), dark * 0.85);
  // THE GUNMETAL: the upper surfaces darkest, the sides mid, the belly lighter (the Raptor's two greys, metallic)
  const gTop = lit([50, 54, 60]), gSide = lit([72, 76, 83]), gBelly = lit([98, 102, 108]), gDark = lit([34, 37, 42]), gEdge = lit([120, 124, 130]);
  const line = (a = 0.3) => rgb([0, 0, 0], a * (0.55 + 0.45 * day));
  const hair = (a = 0.16) => rgb([255, 252, 246], a * (0.25 + 0.75 * day));
  const sheen = (x0, y0, x1, y1, a0, a1 = 0) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgb([255, 250, 240], a0)); g.addColorStop(1, rgb([255, 250, 240], a1)); return g; };
  // ---- the far pieces (behind the body, darker): the far wing's edge over the spine, the far fin's sliver
  poly(FARW, rgb(mix(gTop, [8, 10, 14], 0.4)));
  x.strokeStyle = hair(0.12); x.lineWidth = 0.003; x.beginPath(); x.moveTo(FARW[0][0], FARW[0][1]); x.lineTo(FARW[1][0], FARW[1][1]); x.stroke();
  poly(FINF, rgb(mix(gTop, [8, 10, 14], 0.45)));
  // ---- THE NEAR FIN (canted toward us: its outer face catches the light — a diagonal sheen, a lit leading edge, the flash near the top)
  poly(FIN, rgb(gSide));
  x.save(); clipPoly(FIN);
  x.fillStyle = sheen(0.3, -0.05, 0.12, -0.24, 0.0, 0.18 * (0.3 + 0.7 * day)); x.fillRect(0, -0.35, 0.4, 0.35);
  x.fillStyle = rgb(gTop, 0.55); x.beginPath(); x.moveTo(0.33, -0.05); x.lineTo(0.25, -0.16); x.lineTo(0.1, -0.045); x.closePath(); x.fill();   // (the darker panel at its foot)
  x.fillStyle = rgb(gEdge, 0.55); x.fillRect(0.07, -0.243, 0.14, 0.015);                                                   // (the fin's flash: a low-vis grey band)
  x.fillStyle = rgb(gDark, 0.7); x.fillRect(0.095, -0.254, 0.085, 0.007);                                                  // (the tip's cap)
  x.strokeStyle = line(0.3); x.lineWidth = 0.0024; x.beginPath(); x.moveTo(0.145, -0.235); x.lineTo(0.112, -0.05); x.stroke();   // (the rudder's hinge)
  x.restore();
  x.strokeStyle = hair(0.5); x.lineWidth = 0.0036; x.beginPath(); x.moveTo(FIN[0][0], FIN[0][1]); x.lineTo(FIN[1][0], FIN[1][1]); x.stroke();
  // ---- THE FUSELAGE: the side grey, then the facets — the upper surfaces dark, the belly light, the lower forebody facet under the chine in shade
  fusePath(x); x.fillStyle = rgb(gSide); x.fill();
  x.save(); fusePath(x); x.clip();
  // the vertical tone: dark on top, lighter under (the sky's light from below on a belly seen from under it)
  { const vg = x.createLinearGradient(0, -0.055, 0, 0.09); vg.addColorStop(0, rgb(gTop)); vg.addColorStop(0.42, rgb(gSide)); vg.addColorStop(0.75, rgb(gBelly)); vg.addColorStop(1, rgb(mix(gBelly, [255, 255, 255], 0.06 * day)));
    x.fillStyle = vg; x.fillRect(-0.05, -0.1, 1.1, 0.2); }
  // the lower forebody facet (under the chine): in shade, a hard edge along the chine
  poly(CHINE, rgb(mix(gSide, [0, 0, 6], 0.28)));
  // the upper forebody facet (above the chine, under the canopy's foot): lit — the sun on the wedge
  { x.fillStyle = sheen(0.95, -0.02, 0.8, 0.02, 0.22 * (0.2 + 0.8 * day), 0.02); x.beginPath(); x.moveTo(1.0, 0.0); x.lineTo(0.84, -0.034); x.lineTo(0.78, 0.027); x.lineTo(0.94, 0.009); x.closePath(); x.fill(); }
  // the chine itself: a bright hairline the whole way (a sharp metal edge catching light), darker just under it
  x.strokeStyle = hair(0.55); x.lineWidth = 0.0032; x.beginPath(); x.moveTo(0.995, 0.001); x.bezierCurveTo(0.94, 0.009, 0.86, 0.02, 0.78, 0.027); x.lineTo(0.64, 0.032); x.stroke();
  x.strokeStyle = line(0.35); x.lineWidth = 0.0026; x.beginPath(); x.moveTo(0.98, 0.005); x.bezierCurveTo(0.93, 0.013, 0.86, 0.024, 0.78, 0.031); x.lineTo(0.64, 0.036); x.stroke();
  // the intake's side panel (a touch darker than the side) + the mouth (dark, the lit lip on its raked edge)
  poly([[0.78, 0.027], [0.64, 0.032], [0.6, 0.083], [0.72, 0.085]], rgb(mix(gSide, [0, 0, 4], 0.14)));
  poly(MOUTH, rgb(mix(gDark, [0, 0, 2], 0.6)));
  x.strokeStyle = hair(0.5); x.lineWidth = 0.003; x.beginPath(); x.moveTo(0.78, 0.027); x.lineTo(0.72, 0.085); x.stroke();
  // the engine bay's underside behind the wing root: a darker facet to the nozzles
  poly([[0.2, 0.052], [0.0, 0.03], [0.0, 0.0], [0.2, 0.0]], rgb(mix(gSide, [0, 0, 6], 0.2)));
  // THE METALLIC PANELS: the tone shifting a couple of percent panel by panel along the stations (never flat, never a checkerboard)
  for (const [px, py, pw, ph, a] of [[0.86, -0.03, 0.08, 0.06, -0.03], [0.72, -0.025, 0.06, 0.06, 0.025], [0.5, -0.053, 0.1, 0.11, 0.025], [0.4, -0.054, 0.1, 0.11, -0.03], [0.2, -0.045, 0.1, 0.1, 0.025], [0.06, -0.03, 0.08, 0.075, -0.03]]) {
    x.fillStyle = rgb(a > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(a) * (0.5 + 0.5 * day)); x.fillRect(px, py, pw, ph);
  }
  // THE SPECULAR LINE along the spine (the sun / the moon on the top edge) — the one bright line on the jet
  x.strokeStyle = dark > 0.5 ? `rgba(170,186,220,${(0.38 * dark + 0.1).toFixed(3)})` : hair(0.6); x.lineWidth = 0.0036;
  x.beginPath(); x.moveTo(0.9, -0.024); x.bezierCurveTo(0.87, -0.03, 0.85, -0.033, 0.84, -0.034); x.moveTo(0.58, -0.048); x.bezierCurveTo(0.5, -0.054, 0.4, -0.055, 0.33, -0.053); x.lineTo(0.2, -0.046); x.stroke();
  // PANEL LINES (engraved: a dark cut + a hair of light), the radome's SAWTOOTH seam, the canopy's rear deck, the bay doors' sawtooth outlines
  x.lineWidth = 0.0022;
  const saw = (x0, y0, x1, y1, n, amp) => { x.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, px = x0 + (x1 - x0) * u + (i % 2 ? amp : -amp) * (y1 - y0 === 0 ? 0 : 1), py = y0 + (y1 - y0) * u + (i % 2 ? amp : -amp) * (x1 - x0 === 0 ? 0 : 1); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
  x.strokeStyle = line(0.38); saw(0.862, -0.028, 0.856, 0.022, 6, 0.004);                                    // the radome's seam
  x.strokeStyle = line(0.3);
  for (const [px, top, bot] of [[0.64, -0.05, 0.03], [0.5, -0.053, 0.06], [0.4, -0.054, 0.058], [0.3, -0.051, 0.052], [0.2, -0.045, 0.05], [0.1, -0.038, 0.042]]) { x.beginPath(); x.moveTo(px, top); x.lineTo(px - 0.003, bot); x.stroke(); }
  x.strokeStyle = hair(0.12);
  for (const [px, top, bot] of [[0.64, -0.05, 0.03], [0.5, -0.053, 0.06], [0.4, -0.054, 0.058], [0.3, -0.051, 0.052]]) { x.beginPath(); x.moveTo(px + 0.0025, top); x.lineTo(px - 0.0005, bot); x.stroke(); }
  x.strokeStyle = line(0.32); saw(0.6, 0.058, 0.36, 0.058, 8, 0.0035); saw(0.6, 0.078, 0.36, 0.078, 8, 0.0035);          // the main bay doors (closed)
  x.beginPath(); x.moveTo(0.6, 0.058); x.lineTo(0.6, 0.078); x.moveTo(0.36, 0.058); x.lineTo(0.36, 0.078); x.stroke();
  x.strokeStyle = line(0.26); x.strokeRect(0.66, 0.045, 0.05, 0.03);                                           // the side bay
  // THE STAR-AND-BAR, low-vis: grey on grey
  roundel(x, 0.44, 0.004, 0.019, 1, lit, true);
  x.restore();
  // ---- THE CANOPY: one long gold-tinted bubble (frameless), the pilot's helmet + the seat inside, a HOT SPOT + a long highlight
  { const cp = () => { x.beginPath(); x.moveTo(0.84, -0.034); x.bezierCurveTo(0.83, -0.066, 0.795, -0.092, 0.74, -0.094); x.bezierCurveTo(0.67, -0.096, 0.615, -0.08, 0.59, -0.047); x.closePath(); };
    cp();
    const cg = x.createLinearGradient(0.6, -0.105, 0.84, -0.035);
    cg.addColorStop(0, rgb(mix([22, 20, 18], [150, 112, 50], day * 0.9 + 0.08))); cg.addColorStop(0.55, rgb(mix([12, 12, 14], [96, 70, 34], day))); cg.addColorStop(1, rgb(mix([28, 28, 32], [190, 158, 96], day)));
    x.fillStyle = cg; x.fill();
    x.save(); cp(); x.clip();
    x.fillStyle = rgb(mix([10, 10, 14], [40, 42, 48], day)); x.beginPath(); x.arc(0.74, -0.07, 0.016, 0, TAU); x.fill();       // the helmet
    x.fillStyle = rgb(mix([8, 8, 10], [24, 24, 28], day)); x.fillRect(0.695, -0.078, 0.022, 0.036);                                // the seat's head
    x.fillStyle = rgb(mix([20, 16, 10], [140, 100, 36], day), 0.8); x.beginPath(); x.ellipse(0.752, -0.071, 0.008, 0.006, 0, 0, TAU); x.fill();   // the visor
    // the hot spot (the sun's reflection) + a soft gold bloom round it
    { const hs = x.createRadialGradient(0.775, -0.08, 0, 0.775, -0.08, 0.05); hs.addColorStop(0, rgb([255, 248, 220], 0.75 * (0.15 + 0.85 * day))); hs.addColorStop(0.35, rgb([255, 220, 150], 0.3 * (0.1 + 0.9 * day))); hs.addColorStop(1, rgb([255, 220, 150], 0)); x.fillStyle = hs; x.fillRect(0.6, -0.12, 0.25, 0.09); }
    x.restore();
    x.strokeStyle = rgb([255, 246, 226], 0.28 + 0.5 * day); x.lineWidth = 0.0036; x.beginPath(); x.moveTo(0.828, -0.058); x.quadraticCurveTo(0.77, -0.098, 0.655, -0.086); x.stroke();
    x.strokeStyle = line(0.5); x.lineWidth = 0.0026; x.beginPath(); x.moveTo(0.84, -0.034); x.lineTo(0.59, -0.047); x.stroke(); }   // (the sill)
  // ---- THE NEAR WING (the diamond, from just below): the underside in shade, lighter out to the tip, a hair of light on the leading edge
  poly(WING, rgb(mix(gBelly, [0, 0, 8], 0.08)));
  x.save(); clipPoly(WING);
  { const wg = x.createLinearGradient(0.6, 0.04, 0.3, 0.17); wg.addColorStop(0, rgb([0, 0, 10], 0.22)); wg.addColorStop(0.5, rgb([0, 0, 0], 0.04)); wg.addColorStop(1, rgb([255, 255, 255], 0.12 * day)); x.fillStyle = wg; x.fillRect(0.1, 0, 0.6, 0.2); }
  x.fillStyle = rgb(gTop, 0.6); x.beginPath(); x.moveTo(0.62, 0.04); x.lineTo(0.5, 0.095); x.lineTo(0.3, 0.075); x.lineTo(0.2, 0.06); x.closePath(); x.fill();   // (the root's darker facet: the diamond's fold)
  x.strokeStyle = line(0.3); x.lineWidth = 0.0024; x.beginPath(); x.moveTo(0.3, 0.085); x.lineTo(0.3, 0.17); x.moveTo(0.42, 0.06); x.lineTo(0.37, 0.165); x.stroke();   // (the flaperon + a station)
  roundel(x, 0.37, 0.115, 0.02, 0.45, lit, true);
  x.restore();
  x.strokeStyle = hair(0.5); x.lineWidth = 0.0036; x.beginPath(); x.moveTo(WING[0][0], WING[0][1]); x.lineTo(WING[1][0], WING[1][1]); x.stroke();
  x.strokeStyle = line(0.25); x.lineWidth = 0.002; x.beginPath(); x.moveTo(WING[2][0], WING[2][1]); x.lineTo(WING[3][0], WING[3][1]); x.stroke();
  // ---- the stabilator (near): a diamond over the fin's foot, its underside lighter
  poly(STAB, rgb(mix(gSide, gBelly, 0.5)));
  x.save(); clipPoly(STAB); x.fillStyle = sheen(0.26, 0.036, 0.05, 0.11, 0.0, 0.1 * day); x.fillRect(-0.05, 0.03, 0.35, 0.09); x.restore();
  x.strokeStyle = hair(0.4); x.lineWidth = 0.003; x.beginPath(); x.moveTo(STAB[0][0], STAB[0][1]); x.lineTo(STAB[1][0], STAB[1][1]); x.stroke();
  // ---- THE NOZZLES: flat 2-D wedges, heat-tinted titanium, SERRATED trailing edges (the far one a touch higher + darker)
  const nozzle = (dx, dy, k) => {
    const ng = x.createLinearGradient(0, -0.03 + dy, 0, 0.03 + dy);
    ng.addColorStop(0, rgb(lit([96, 88, 82]).map(v => v * k))); ng.addColorStop(0.5, rgb(lit([64, 60, 66]).map(v => v * k))); ng.addColorStop(1, rgb(lit([40, 36, 40]).map(v => v * k)));
    x.fillStyle = ng; x.beginPath(); x.moveTo(0.0 + dx, -0.026 + dy);
    // the serrated exit: six teeth
    for (let i = 0; i <= 6; i++) { const u = i / 6; x.lineTo(-0.056 + dx + (i % 2 ? 0.013 : 0), -0.016 + dy + 0.034 * u); }
    x.lineTo(0.0 + dx, 0.03 + dy); x.closePath(); x.fill();
    x.strokeStyle = line(0.4); x.lineWidth = 0.002; for (let i = 0; i < 4; i++) { const yy = -0.02 + dy + i * 0.013; x.beginPath(); x.moveTo(dx, yy * 1.05); x.lineTo(-0.048 + dx, yy * 0.9); x.stroke(); }
  };
  nozzle(-0.006, -0.012, 0.75);
  nozzle(0, 0, 1);
  x.fillStyle = rgb([12, 10, 12]); x.fillRect(-0.052, -0.011, 0.006, 0.024);                                   // (the exit's dark throat)
  x.strokeStyle = hair(0.3); x.lineWidth = 0.0024; x.beginPath(); x.moveTo(0.0, -0.026); x.lineTo(-0.056, -0.016); x.stroke();
  // ---- the belly's edge + the wing root's light (the lower outline catching the ground's light), the nose's tip
  x.strokeStyle = hair(0.22); x.lineWidth = 0.0028; x.beginPath(); x.moveTo(0.14, 0.044); x.bezierCurveTo(0.3, 0.056, 0.46, 0.064, 0.6, 0.083); x.lineTo(0.72, 0.085); x.stroke();
  x.fillStyle = rgb(mix(gSide, [20, 22, 28], 0.3)); x.beginPath(); x.moveTo(1.0, 0.0); x.lineTo(0.965, -0.012); x.lineTo(0.965, 0.006); x.closePath(); x.fill();
  // ---- night: the moon's cool hair along the fin's edge + the canopy (a dark shape that still reads against the sky)
  if (dark > 0.05) {
    x.strokeStyle = `rgba(170,186,220,${(0.3 * dark).toFixed(3)})`; x.lineWidth = 0.0036;
    x.beginPath(); x.moveTo(0.33, -0.05); x.lineTo(0.175, -0.255); x.stroke();
    x.beginPath(); x.moveTo(0.828, -0.058); x.quadraticCurveTo(0.77, -0.098, 0.655, -0.086); x.stroke();
  }
}
/** the USAF star-and-bar at (cx, cy), radius r (jet lengths), sq: its vertical squash (seen at a slant under the wing); lowVis: grey on grey */
function roundel(x, cx, cy, r, sq, lit, lowVis = false) {
  const B = rgb(lowVis ? lit([46, 50, 56]) : lit([34, 48, 104])), Wt = rgb(lowVis ? lit([104, 108, 114]) : lit([236, 236, 234])), R = rgb(lowVis ? lit([62, 66, 72]) : lit([178, 34, 52]));
  x.save(); x.translate(cx, cy); x.scale(1, sq);
  // the bars: the outline, the field, the stripe — then the disc + the star
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
function jetSprite(len, look, dpr) {
  const W = len * 1.14, H = len * 0.64, d = 3;                  // (3× always: a small sprite — the detail needs the pixels)
  const cv = mk(W * d, H * d), x = safeCtx(cv);
  const ox = len * 0.08, oy = len * 0.36;
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
 * k (0..1 its burn), o = { night (0..1), t (s, the flicker), dir }. Additive. HEAT HAZE first: a shimmer of pale blobs wavering behind
 * the engines, beyond the diamonds (the air boiling — no refraction on a canvas, but the eye reads the flutter).
 */
function drawBurner(c, nx, ny, ang, len, k, o = {}) {
  if (k <= 0.01) return;
  const night = o.night || 0, t = o.t || 0, fl = 0.92 + 0.08 * Math.sin(t * 61 + nx) * Math.sin(t * 37);
  const L = len * (0.82 + 0.1 * k) * fl, w = len * 0.05;
  c.save(); c.translate(nx, ny); c.rotate(ang + Math.PI); c.globalCompositeOperation = 'lighter';
  // the heat haze: five soft blobs along the plume's axis, each wavering on its own, faint (fainter still by day)
  { const hz = tinted([214, 206, 196]), a = (0.035 + 0.03 * night) * k;
    for (let i = 0; i < 5; i++) { const u = 0.35 + i * 0.2, px = L * u + Math.sin(t * (29 + i * 7) + i) * w * 0.8, py = Math.sin(t * (23 + i * 5) + i * 2.1) * w * (0.9 + i * 0.3), s = w * (2.6 + i * 1.1) * (1 + 0.15 * Math.sin(t * 41 + i));
      c.globalAlpha = a * (1 - i * 0.12); c.drawImage(hz, px - s, py - s * 0.6, s * 2, s * 1.2); } }
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
function drawJetLights(c, len, navDir, night, t, i = 0) {
  if (night < 0.05) return;
  const G = [150, 255, 160];
  const strip = (x0, y0, x1, y1) => { c.strokeStyle = rgb(G, 0.9 * night); c.lineWidth = Math.max(0.7, len * 0.011); c.beginPath(); c.moveTo(x0 * len, y0 * len); c.lineTo(x1 * len, y1 * len); c.stroke(); };
  c.save(); c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.45 * night; const gs = len * 0.13;
  for (const [a, b] of [[0.86, 0.012], [0.2, -0.04], [0.135, -0.24]]) c.drawImage(tinted(G), a * len - gs, b * len - gs * 0.5, gs * 2, gs);
  c.globalAlpha = 1;
  // the F-22's strips: along the forebody's chine, the aft fuselage, the fin's tip
  strip(0.92, 0.01, 0.8, 0.018); strip(0.28, -0.04, 0.12, -0.036); strip(0.17, -0.24, 0.1, -0.24);
  const nav = navDir > 0 ? [90, 255, 140] : [255, 60, 60];
  c.globalAlpha = 0.85 * night; c.drawImage(tinted(nav), 0.295 * len - gs * 0.6, 0.168 * len - gs * 0.6, gs * 1.2, gs * 1.2);
  c.globalAlpha = night; c.fillStyle = rgb(nav); c.beginPath(); c.arc(0.295 * len, 0.168 * len, Math.max(0.6, len * 0.011), 0, TAU); c.fill();
  c.fillStyle = 'rgb(255,250,240)'; c.beginPath(); c.arc(-0.04 * len, 0.0, Math.max(0.5, len * 0.008), 0, TAU); c.fill();        // the tail light
  const bk = Math.sin(t * 7.5 + i * 1.3) > 0.55 ? 1 : 0.15;
  c.globalAlpha = night * bk; c.drawImage(tinted([255, 40, 30]), 0.47 * len - gs * 0.5, -0.06 * len - gs * 0.5, gs, gs);          // the beacon on the spine
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
    // the afterburner first (behind the tail), then the airframe (streaked on full burn — a hint of motion blur), the vapour, the lights
    if (j.burn > 0) drawBurner(c, 0, 0, 0, L, j.burn, { night, t: j.t });
    if (j.burn > 0.5 && j.blur !== false) {
      const b = (j.burn - 0.5) * 2;
      c.globalAlpha = 0.09 * b; c.drawImage(s.cv, -s.ox - L * 0.07, -s.oy, s.w, s.h);
      c.globalAlpha = 0.2 * b; c.drawImage(s.cv, -s.ox - L * 0.035, -s.oy, s.w, s.h);
      c.globalAlpha = 1;
    }
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
const climbOf = (theta, dir) => (dir > 0 ? -theta : theta - Math.PI);

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
