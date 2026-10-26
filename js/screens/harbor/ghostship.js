// CITY 2.0 — THE HARBOR, PART 11a-1: THE GHOST SHIP — Halloween night's LEGENDARY (docs/harbor.md#part-11a-1). WHEN + WHERE is pure:
// core/harbor-holiday.js#ghostShipAt (two crossings on the night) + core/harbor-ghost.js#ghostCrossing (its drift, its fade);
// &force=ghost-ship loops a crossing (#ghostForced). This module DRAWS it:
//   a translucent spectral-green three-masted galleon — the high stern castle with its lit gallery, the gun ports burning green,
//   TATTERED sails (ragged hems, holes the city shows through), a snapped main topgallant hanging in its rigging, shrouds + ratlines,
//   a stern lantern + a bow lantern, a long torn pennant + a ragged ensign streaming — baked ONCE into sprites at the scene's scale
//   (the body + a soft glow made by down/up-sampling: no canvas filter, Safari-safe); per frame only the sprite blits, the lanterns'
//   flicker, the two streamers, a slow bob + roll, the materialising flicker and the MIST rolling off the hull onto the water.
// Depth: z = GHOST.z (behind the breakwater + the lighthouse and Rosie, in front of the far tug) — drawn at scene.js's
// HOOK-B-WATER-FAR (after the far boats, before the baked pier / lighthouse layer); its reflection + its lanterns' columns go into the
// water's mirror queue before the water composes (HOOK-B-LOW: queue()).
import { GHOST, ghostCrossing, ghostForced, batColonyAt, batColonyForced, batJinkAt } from '../../core/harbor-ghost.js';
import { createWitch } from './witch.js';
import { ghostShipAt } from '../../core/harbor-holiday.js';
import { project } from '../../core/harbor-layout.js';
import { LEVEL, axisAt } from './water.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const h01 = (n, s = 0) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s | 0, 0x27d4eb2d); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

// the ship in its own units (facing right: the stern at x 0, the bow → +x; u up from the waterline). The sprite's box:
const BX0 = -4.5, BX1 = 38.5, BU0 = -1.6, BU1 = 31;
// the spectral palette
const LINE = 'rgba(186,255,218,0.92)', LINE2 = 'rgba(150,250,196,0.55)', FAINT = 'rgba(140,240,190,0.22)';
const MASTS = [{ x: 5.4, u0: 8.9, u1: 21.2, top: 14.6 }, { x: 14.4, u0: 5.3, u1: 25.6, top: 16.8, broken: true }, { x: 23.3, u0: 6.7, u1: 24.4, top: 15.6 }];
// (the line widths' multiplier: at a phone's size a 0.06-unit rope is under half a device pixel — bake() raises it so every line
// stays ≥ ~0.75 px; blown up it is 1)
let LW = 1;
// sheer: the deck line rises toward both ends
const sheer = x => 0.0045 * (x - 15) * (x - 15);

/** the ship's art in units → a ctx already set to units (scale k, y flipped). Everything that does not move. */
function paintShip(x, mode = 'fill') {
  // (the LINE pass keeps only the light-emitting fills: the lit gun ports, the gallery's windows, the glowing rent — the rest of its
  // fills are skipped)
  const litRect = x.fillRect.bind(x), litFill = x.fill.bind(x);
  if (mode === 'line') { x.fill = () => {}; x.fillRect = () => {}; }
  x.lineCap = 'round'; x.lineJoin = 'round';
  const L = (pts, w, col) => { x.strokeStyle = col; x.lineWidth = w * LW; x.beginPath(); pts.forEach(([a, u], i) => (i ? x.lineTo(a, u) : x.moveTo(a, u))); x.stroke(); };
  // ---- THE MASTS (behind the sails' near faces: drawn first, tapered, bright edged)
  for (const m of MASTS) {
    const top = m.broken ? 24.2 : m.u1;
    x.fillStyle = 'rgba(120,230,170,0.42)';
    x.beginPath(); x.moveTo(m.x - 0.24, m.u0); x.lineTo(m.x - 0.12, top); x.lineTo(m.x + 0.12, top); x.lineTo(m.x + 0.24, m.u0); x.closePath(); x.fill();
    L([[m.x - 0.24, m.u0], [m.x - 0.12, top]], 0.07, LINE); L([[m.x + 0.24, m.u0], [m.x + 0.12, top]], 0.05, LINE2);
    // the fighting top: a small platform + its rail
    x.fillStyle = 'rgba(120,230,170,0.35)'; x.fillRect(m.x - 1.0, m.top - 0.25, 2.0, 0.42);
    L([[m.x - 1.0, m.top + 0.17], [m.x + 1.0, m.top + 0.17]], 0.08, LINE);
    L([[m.x - 0.9, m.top + 0.17], [m.x - 0.9, m.top + 0.75], [m.x + 0.9, m.top + 0.75], [m.x + 0.9, m.top + 0.17]], 0.05, LINE2);
  }
  // the SNAPPED main topgallant: hanging askew in its rigging from the break
  L([[14.3, 24.0], [16.6, 20.6]], 0.2, 'rgba(150,240,190,0.6)'); L([[14.3, 24.0], [16.6, 20.6]], 0.06, LINE);
  L([[15.2, 22.6], [13.2, 21.3]], 0.12, 'rgba(150,240,190,0.5)');                       // (its yard, cock-billed)
  // ---- THE SAILS (translucent, bellied, tattered; their holes cut later)
  const sail = (cx, uTop, uBot, hwT, hwB, belly, seed, rag) => {
    // a square sail on its yard, seen at an angle: the top on the yard, the sides bellying out, the foot RAGGED
    const g = x.createLinearGradient(0, uTop, 0, uBot);
    g.addColorStop(0, 'rgba(206,255,228,0.46)'); g.addColorStop(0.5, 'rgba(156,248,200,0.3)'); g.addColorStop(1, 'rgba(120,236,176,0.14)');
    x.fillStyle = g;
    const foot = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const f = i / n, a = cx + hwB * (2 * f - 1) * (1 + 0.04 * Math.sin(f * 9 + seed));
      // the ragged foot: notches + long torn strips, seeded
      const r = h01(i, seed), tear = r < rag ? (0.6 + h01(i, seed + 3) * 2.6) : r < rag + 0.25 ? 0.25 + h01(i, seed + 5) * 0.4 : 0;
      foot.push([a, uBot + (i % 2 ? 0.18 : -0.1) + tear * (i % 2 ? 1 : -0.5)]);
    }
    x.beginPath(); x.moveTo(cx - hwT, uTop);
    x.quadraticCurveTo(cx - hwB - belly, (uTop + uBot) / 2, foot[0][0], foot[0][1]);
    for (const p of foot) x.lineTo(p[0], p[1]);
    x.quadraticCurveTo(cx + hwB + belly * 0.6, (uTop + uBot) / 2, cx + hwT, uTop);
    x.closePath(); x.fill();
    // the seams (faint verticals) + the bright edge + the belly's light (a soft brighter band where the cloth bulges)
    x.save(); x.clip();
    for (let k = 1; k < 6; k++) { const a = cx - hwB + (2 * hwB) * k / 6; L([[a + (k - 3) * 0.05, uTop], [a + (k - 3) * 0.18, uBot]], 0.035, FAINT); }
    const bg = x.createLinearGradient(cx - hwB, 0, cx + hwB, 0); bg.addColorStop(0, 'rgba(210,255,230,0)'); bg.addColorStop(0.35, 'rgba(210,255,230,0.18)'); bg.addColorStop(0.6, 'rgba(210,255,230,0.05)'); bg.addColorStop(1, 'rgba(210,255,230,0)');
    x.fillStyle = bg; x.fillRect(cx - hwB - 1, uBot - 3, hwB * 2 + 2, uTop - uBot + 4);
    x.restore();
    x.strokeStyle = LINE2; x.lineWidth = LW * 0.06; x.beginPath(); x.moveTo(cx - hwT, uTop); x.quadraticCurveTo(cx - hwB - belly, (uTop + uBot) / 2, foot[0][0], foot[0][1]); x.stroke();
    x.beginPath(); x.moveTo(cx + hwT, uTop); x.quadraticCurveTo(cx + hwB + belly * 0.6, (uTop + uBot) / 2, foot[n][0], foot[n][1]); x.stroke();
    x.strokeStyle = 'rgba(200,255,226,0.7)'; x.lineWidth = LW * 0.06; x.beginPath(); foot.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
  };
  // (the yards: a hair braced — each drawn as a slightly tilted spar)
  const yard = (cx, u, hw, tilt = 0.05) => { L([[cx - hw, u - tilt * hw], [cx + hw, u + tilt * hw]], 0.2, 'rgba(150,240,190,0.55)'); L([[cx - hw, u - tilt * hw], [cx + hw, u + tilt * hw]], 0.06, LINE); };
  // the MIZZEN's lateen (a ragged triangle on its long diagonal yard)
  {
    x.fillStyle = 'rgba(160,248,200,0.2)';
    x.beginPath(); x.moveTo(0.6, 11.0); x.lineTo(10.6, 19.8);
    const pts = [[9.4, 17.6], [8.6, 15.4], [9.1, 14.6], [7.8, 12.7], [7.2, 11.2], [6.0, 10.1]];
    for (const p of pts) x.lineTo(p[0], p[1]);
    x.lineTo(3.4, 10.4); x.lineTo(2.6, 9.6); x.lineTo(1.6, 10.6); x.closePath(); x.fill();
    L([[0.6, 11.0], [10.6, 19.8]], 0.18, 'rgba(150,240,190,0.55)'); L([[0.6, 11.0], [10.6, 19.8]], 0.06, LINE);
    L([[10.6, 19.8], ...pts, [3.4, 10.4], [2.6, 9.6], [1.6, 10.6], [0.6, 11.0]], 0.05, LINE2);
  }
  // the MAIN: course (torn: a big rent), topsail (full, bellied); the topgallant gone with its mast
  sail(14.4, 11.6, 6.9, 4.6, 5.0, 0.9, 11, 0.32); yard(14.4, 11.6, 4.8);
  sail(14.4, 19.4, 12.4, 3.5, 4.2, 0.8, 23, 0.22); yard(14.4, 19.4, 3.7);
  // the FORE: course, topsail, a small ragged topgallant
  sail(23.3, 12.4, 7.9, 4.0, 4.4, 0.8, 37, 0.3); yard(23.3, 12.4, 4.2);
  sail(23.3, 18.8, 13.2, 3.0, 3.6, 0.7, 41, 0.2); yard(23.3, 18.8, 3.2);
  sail(23.3, 23.0, 19.4, 2.0, 2.4, 0.5, 53, 0.45); yard(23.3, 23.0, 2.1);
  // the JIB from the bowsprit to the fore top (ragged)
  {
    x.fillStyle = 'rgba(160,248,200,0.16)';
    const jib = [[35.6, 10.8], [24.2, 16.4], [26.8, 8.6], [28.6, 9.6], [29.4, 8.9], [31.4, 9.9], [32.2, 9.4]];
    x.beginPath(); jib.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill();
    L([...jib, jib[0]], 0.05, LINE2);
  }
  // ---- THE HOLES: the city through the cloth (cut clean out of the sails — real transparency)
  x.save(); x.globalCompositeOperation = 'destination-out';
  const hole = (a, u, rx, ry, seed) => { x.beginPath(); for (let i = 0; i < 9; i++) { const t = (i / 9) * TAU, r = 0.65 + 0.55 * h01(i, seed); const px = a + Math.cos(t) * rx * r, pu = u + Math.sin(t) * ry * r; i ? x.lineTo(px, pu) : x.moveTo(px, pu); } x.closePath(); x.fill(); };
  hole(12.6, 8.6, 1.3, 1.0, 5); hole(16.4, 10.0, 0.6, 0.5, 9); hole(13.5, 15.6, 0.7, 0.9, 13); hole(24.6, 10.0, 0.9, 0.7, 17); hole(22.0, 15.4, 0.45, 0.6, 19); hole(6.6, 13.0, 0.7, 0.5, 29);
  x.restore();
  // the holes' torn edges glow (a thin bright rim round each)
  // ---- THE RIGGING: shrouds + their ratlines, the stays, broken lines hanging
  const rail = a => 5.0 + sheer(a) + (a < 9 ? (a < 4.2 ? 4.0 : 2.0) : a > 22.4 ? 1.6 : 0);
  for (const m of MASTS) {
    const topU = m.top, feet = [-2.9, -1.9, -0.9, 0.6].map(d => m.x + d), shr = [];
    for (const f of feet) { L([[m.x, topU], [f, rail(f)]], 0.045, FAINT.replace('0.22', '0.5')); shr.push(f); }
    // the ratlines: short rungs across the shrouds (the rope ladder — the read that says "a sailing ship")
    x.strokeStyle = 'rgba(160,248,200,0.3)'; x.lineWidth = LW * 0.035; x.beginPath();
    for (let v = 0.12; v < 0.9; v += 0.075) {
      const pA = [m.x + (shr[0] - m.x) * v, topU + (rail(shr[0]) - topU) * v], pB = [m.x + (shr[2] - m.x) * v, topU + (rail(shr[2]) - topU) * v];
      x.moveTo(pA[0], pA[1]); x.lineTo(pB[0], pB[1]);
    }
    x.stroke();
    // the topmast shrouds (from the top to the masthead)
    L([[m.x - 1.0, m.top], [m.x, (m.broken ? 24 : m.u1) - 0.6]], 0.035, FAINT); L([[m.x + 0.9, m.top], [m.x, (m.broken ? 24 : m.u1) - 0.6]], 0.035, FAINT);
  }
  L([[23.3, 24.2], [35.8, 10.9]], 0.05, LINE2);              // the fore topmast stay to the bowsprit's end
  L([[23.3, 15.6], [32.4, 9.0]], 0.045, LINE2);              // the fore stay
  L([[14.4, 23.8], [23.3, 17.0]], 0.04, FAINT.replace('0.22', '0.45'));
  L([[14.4, 16.8], [23.3, 8.4]], 0.045, LINE2);              // the main stay
  L([[5.4, 20.8], [14.4, 13.5]], 0.04, FAINT.replace('0.22', '0.45'));
  L([[5.4, 14.6], [14.4, 8.6]], 0.04, LINE2);
  L([[14.4, 23.4], [2.2, 9.8]], 0.035, FAINT);                // a backstay
  // broken lines, hanging in loose curves
  x.strokeStyle = 'rgba(170,252,206,0.4)'; x.lineWidth = LW * 0.04;
  for (const [a0, u0, a1, u1, sag] of [[19.0, 11.4, 20.6, 6.6, 1.2], [9.8, 11.8, 10.4, 7.8, 0.8], [26.9, 13.1, 28.0, 9.6, 0.9], [11.0, 19.0, 9.7, 15.4, -0.7]]) {
    x.beginPath(); x.moveTo(a0, u0); x.quadraticCurveTo((a0 + a1) / 2 + sag, (u0 + u1) / 2, a1, u1); x.stroke();
  }
  // the BOWSPRIT (+ its jib-boom)
  L([[28.4, 6.3], [36.2, 10.9]], 0.34, 'rgba(150,240,190,0.55)'); L([[28.4, 6.3], [36.2, 10.9]], 0.07, LINE);
  // ---- THE HULL (in front of the masts' feet + the shrouds' ends)
  const hull = new Path2D();
  // the stern: the taffrail high + overhanging, the transom curving under to the waterline
  hull.moveTo(-0.9, 9.9);
  hull.quadraticCurveTo(-1.6, 7.6, -0.6, 5.2);
  hull.quadraticCurveTo(0.2, 2.4, 2.2, 0.4);
  hull.quadraticCurveTo(4.0, -0.9, 7.0, -1.0);
  hull.lineTo(24.0, -1.0);
  // the forefoot curving up to the stem + the beakhead
  hull.quadraticCurveTo(27.6, -0.6, 28.8, 2.2);
  hull.quadraticCurveTo(29.6, 3.9, 31.0, 4.6);
  hull.lineTo(32.4, 5.6);
  hull.lineTo(30.6, 6.1);
  // the forecastle's rail, the step down to the waist, the waist along the sheer, the quarterdeck + the poop stepping up
  hull.lineTo(28.9, 7.2 + sheer(28.9) * 0.4);
  hull.lineTo(22.4, 7.0 + sheer(22.4) * 0.3);
  hull.lineTo(22.0, 5.2 + sheer(22));
  hull.quadraticCurveTo(15.5, 4.95 + sheer(15.5), 9.0, 5.2 + sheer(9));
  hull.lineTo(8.6, 7.2 + sheer(8.6) * 0.3);
  hull.lineTo(4.3, 7.4);
  hull.lineTo(3.9, 9.1);
  hull.lineTo(-0.9, 9.9);
  hull.closePath();
  const hg = x.createLinearGradient(0, 9.9, 0, -1.0);
  hg.addColorStop(0, 'rgba(120,236,170,0.62)'); hg.addColorStop(0.45, 'rgba(70,196,132,0.46)'); hg.addColorStop(0.85, 'rgba(46,160,108,0.2)'); hg.addColorStop(1, 'rgba(40,150,100,0)');
  x.fillStyle = hg; x.fill(hull);
  // planking (faint lines along the sheer) + the two WALES (strong bands) + the rubbing strakes
  x.save(); x.clip(hull);
  for (let u = 0.3; u < 9.5; u += 0.42) L(Array.from({ length: 16 }, (_, i) => { const a = -1 + i * 2.2; return [a, u + sheer(a) * 0.9]; }), 0.025, 'rgba(150,240,190,0.16)');
  for (const u of [1.45, 3.15]) { L(Array.from({ length: 16 }, (_, i) => { const a = -1 + i * 2.2; return [a, u + sheer(a) * 0.9]; }), 0.2, 'rgba(160,246,200,0.38)'); L(Array.from({ length: 16 }, (_, i) => { const a = -1 + i * 2.2; return [a, u + 0.1 + sheer(a) * 0.9]; }), 0.04, LINE); }
  // THE GUN PORTS: two rows, most burning a sickly green-gold (the ghost crew's light), a few dark, one open lid hanging
  const port = (a, u, lit, seed) => {
    const w = 0.7, h = 0.62, uu = u + sheer(a) * 0.9;
    x.fillStyle = lit ? `rgba(${200 + 40 * h01(seed, 2) | 0},255,${120 + 40 * h01(seed, 4) | 0},${0.75 + 0.2 * h01(seed, 6)})` : 'rgba(10,40,26,0.55)';
    (lit ? litRect : x.fillRect.bind(x))(a - w / 2, uu - h / 2, w, h);
    x.strokeStyle = LINE2; x.lineWidth = LW * 0.04; x.strokeRect(a - w / 2, uu - h / 2, w, h);
  };
  for (let i = 0; i < 8; i++) port(6.6 + i * 2.25, 2.25, h01(i, 41) > 0.22, i);
  for (let i = 0; i < 5; i++) port(10.4 + i * 2.3, 4.05, h01(i, 43) > 0.4, i + 20);
  // the open lid, hanging off its port
  L([[15.15, 2.6 + sheer(15.15)], [15.6, 1.6 + sheer(15.6)]], 0.18, 'rgba(160,246,200,0.5)');
  // THE QUARTER GALLERY: the stern castle's carved box with its lit windows (the captain's cabin, burning green)
  x.fillStyle = 'rgba(120,236,170,0.35)'; x.beginPath(); x.moveTo(-0.4, 5.4); x.lineTo(3.4, 5.6); x.lineTo(3.6, 8.7); x.lineTo(-0.7, 8.9); x.closePath(); x.fill();
  L([[-0.4, 5.4], [3.4, 5.6], [3.6, 8.7], [-0.7, 8.9], [-0.4, 5.4]], 0.06, LINE);
  for (let i = 0; i < 3; i++) { const a = 0.15 + i * 1.12; x.fillStyle = 'rgba(214,255,150,0.9)'; litRect(a, 6.2, 0.72, 1.4); x.fillStyle = 'rgba(40,110,60,0.6)'; x.fillRect(a + 0.33, 6.2, 0.06, 1.4); x.fillRect(a, 6.85, 0.72, 0.06); }
  // the carved scroll under the gallery + the taffrail's carving
  L([[-0.3, 5.2], [1.6, 4.6], [3.6, 5.3]], 0.08, LINE2);
  L([[-0.9, 9.9], [0.6, 10.5], [2.4, 10.2], [3.9, 9.1]], 0.07, LINE2);
  // a RENT in the hull below the waist: jagged, glowing from inside
  { x.fillStyle = 'rgba(200,255,170,0.42)'; x.strokeStyle = LINE; x.lineWidth = LW * 0.05; x.beginPath(); const pts = [[17.6, 0.6], [18.4, 1.4], [18.1, 1.9], [19.0, 2.1], [19.6, 1.5], [20.3, 1.9], [20.1, 0.9], [20.8, 0.4], [19.6, 0.2], [18.6, -0.1]]; pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1] + sheer(p[0]) * 0.9) : x.moveTo(p[0], p[1] + sheer(p[0]) * 0.9))); x.closePath(); x.fill(); x.stroke(); }
  x.restore();
  // the hull's bright outline (the spectral edge) + the deck rails' balusters
  // (the bright edge only above the waterline: below it the hull melts into the mist)
  x.save(); x.beginPath(); x.rect(-10, 0.15, 60, 40); x.clip(); x.strokeStyle = LINE; x.lineWidth = LW * 0.09; x.stroke(hull); x.restore();
  x.save(); x.beginPath(); x.rect(-10, -0.6, 60, 0.75); x.clip(); x.strokeStyle = 'rgba(186,255,218,0.3)'; x.lineWidth = LW * 0.06; x.stroke(hull); x.restore();
  x.strokeStyle = 'rgba(160,246,200,0.5)'; x.lineWidth = LW * 0.04;
  x.beginPath();
  for (let a = 9.4; a < 22; a += 0.55) { const u = 5.2 + sheer(a); x.moveTo(a, u); x.lineTo(a, u + 0.75); }
  for (let a = 4.6; a < 8.4; a += 0.5) { x.moveTo(a, 7.4); x.lineTo(a, 8.1); }
  for (let a = 23; a < 28.6; a += 0.5) { const u = 7.0 + sheer(a) * 0.3; x.moveTo(a, u); x.lineTo(a, u + 0.7); }
  x.stroke();
  L(Array.from({ length: 14 }, (_, i) => { const a = 9.2 + i * 0.98; return [a, 5.95 + sheer(a)]; }), 0.06, LINE2);
  // the rudder at the stern + the figurehead under the beakhead
  L([[0.4, 2.6], [1.4, -0.8]], 0.3, 'rgba(140,236,186,0.4)');
  x.fillStyle = 'rgba(170,252,206,0.5)'; x.beginPath(); x.moveTo(31.0, 4.6); x.quadraticCurveTo(32.4, 4.0, 32.9, 5.0); x.quadraticCurveTo(32.6, 5.7, 32.0, 5.6); x.closePath(); x.fill();
  // the lanterns' brackets (the flames are live)
  L([[-0.6, 9.9], [-1.5, 11.0], [-1.5, 10.4]], 0.08, LINE2);
  L([[31.9, 5.8], [32.4, 6.9]], 0.07, LINE2);
}
export const LANTERNS = Object.freeze([[-1.5, 10.0, 1], [32.4, 6.6, 0.75], [14.4, 17.3, 0.5]]);   // (the stern lantern, the bow's, a lamp on the main top)

/** a soft radial sprite (the lanterns' glow, the mist) */
function softSprite(col, size = 64, stops = [[0, 1], [0.25, 0.55], [0.6, 0.14], [1, 0]]) {
  const cv = mk(size, size), x = safeCtx(cv), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [t, a] of stops) g.addColorStop(t, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return cv;
}

export function createGhostShip() {
  let spr = null, sprKey = '';               // { body, glow, k, dpr }
  let mist = [], motes = [], lastT = -1, playedCreak = -1, playedBell = -1, playedBell2 = -1, cur = null, frames = 0;
  const lampSpr = softSprite([150, 255, 120], 64, [[0, 1], [0.12, 0.85], [0.35, 0.3], [0.7, 0.06], [1, 0]]);
  const mistSpr = softSprite([170, 255, 210], 64, [[0, 0.55], [0.4, 0.3], [0.75, 0.08], [1, 0]]);
  const poolSpr = softSprite([70, 255, 150], 64, [[0, 0.7], [0.4, 0.28], [0.8, 0.05], [1, 0]]);

  function bake(k, dpr) {
    const key = `${k.toFixed(3)}|${dpr}`;
    if (spr && sprKey === key) return spr;
    sprKey = key;
    const pu = k * dpr, w = (BX1 - BX0) * pu, h = (BU1 - BU0) * pu;
    LW = Math.max(1, Math.min(3.2, 0.75 / (0.06 * pu)));
    // TWO PASSES of the same art: the FILLS (translucent cloth + timber, drawn over the city) and the LINES (the spectral edges, the
    // rigging, the lit ports — drawn ADDITIVELY: the ghost's light on top of the city's); a pass skips the other's calls
    if (spr) { for (const cv of [spr.body, spr.lines, spr.glow]) cv.width = cv.height = 0; }
    const body = mk(w, h), lines = mk(w, h);
    for (const [cv, mode] of [[body, 'fill'], [lines, 'line']]) {
      const x = safeCtx(cv);
      if (mode === 'fill') { x.stroke = () => {}; x.strokeRect = () => {}; }
      x.setTransform(pu, 0, 0, -pu, -BX0 * pu, BU1 * pu);
      paintShip(x, mode);
      x.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the glow: the body down-sampled twice + back up (a soft bloom of its own light; no canvas filter — Safari-safe)
    const s1 = mk(w / 6, h / 6), s2 = mk(w / 3, h / 3), glow = mk(w / 2, h / 2);
    const a = safeCtx(s1); a.imageSmoothingEnabled = true; a.drawImage(body, 0, 0, s1.width, s1.height); a.drawImage(lines, 0, 0, s1.width, s1.height);
    const b = safeCtx(s2); b.imageSmoothingEnabled = true; b.drawImage(s1, 0, 0, s2.width, s2.height); b.globalAlpha = 0.6; b.drawImage(body, 0, 0, s2.width, s2.height);
    const g = safeCtx(glow); g.imageSmoothingEnabled = true; g.drawImage(s2, 0, 0, glow.width, glow.height);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(90,255,160)'; g.fillRect(0, 0, glow.width, glow.height);
    s1.width = s1.height = s2.width = s2.height = 0;
    spr = { body, lines, glow, k, dpr, w: w / dpr, h: h / dpr };
    return spr;
  }

  /** where the ship is this frame (or null): env { L, cam, W, lc (LK.local), nowS, since (&force's start, s) | null, motion } */
  function place(env) {
    const run = env.since != null ? ghostForced(env.nowS, env.since) : ghostShipAt(env.lc);
    if (!run) return null;
    const g = ghostCrossing(run.s, run.n);
    if (g.alpha <= 0.002 && g.mist <= 0.002) return { run, g, off: true };
    const { cam } = env.L, z = GHOST.z, k = cam.F / z * GHOST.scale, axis = axisAt(env.L, z);
    // its drift is slow: ~1–1.5 pt a second on a phone; the hull's middle at fx of the screen
    const cx = env.W * g.fx, t = env.t;
    const bob = env.motion ? Math.sin(t * 0.55) * 0.22 + Math.sin(t * 0.23 + 1) * 0.12 : 0, roll = env.motion ? Math.sin(t * 0.41) * 0.022 : 0;
    // the materialising flicker: the apparition catching + dropping (stepped noise, never more than 3 a second)
    let flick = 1;
    if (env.motion && g.flick > 0.01) { const step = Math.floor(t * 3); flick = 1 - g.flick * (h01(step, 9) < 0.45 ? 0.55 * h01(step, 11) : 0); }
    // a slow breathing of its light (the ghost's own pulse)
    const pulse = env.motion ? 0.86 + 0.14 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 2) : 0.92;
    return { run, g, k, axis, cx, bob, roll, a: g.alpha * flick, pulse, dir: g.dir };
  }

  // draw the ship at its place in screen pt (an upright ship whose waterline sits on `axis`); a: alpha; mirror: the reflection's pass
  function drawShip(c, P, sp, a, mirror = false, t = 0, motion = true) {
    if (a <= 0.004) return;
    const pu = P.k, ox = P.cx, oy = P.axis - P.bob * pu;
    c.save();
    c.translate(ox, oy); c.rotate(P.roll * P.dir); c.scale(P.dir, 1);
    // the sprite's origin: the hull's middle (x 15 units) on the waterline
    const x0 = (BX0 - 15) * pu, y0 = -BU1 * pu;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.78 * a * P.pulse * (mirror ? 0.8 : 1));
    c.drawImage(sp.glow, x0 - pu * 0.6, y0 - pu * 0.6, sp.w + pu * 1.2, sp.h + pu * 1.2);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a * (mirror ? 0.85 : 0.97));
    c.drawImage(sp.body, x0, y0, sp.w, sp.h);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * (mirror ? 0.7 : 1) * (0.85 + 0.15 * P.pulse));
    c.drawImage(sp.lines, x0, y0, sp.w, sp.h);
    c.globalCompositeOperation = 'source-over';
    // the live bits: the lanterns' flames + halos, the long torn pennant + the ragged ensign streaming
    c.globalCompositeOperation = 'lighter';
    for (const [la, lu, s] of LANTERNS) {
      const fl = motion ? 0.75 + 0.25 * Math.sin(t * 11 + la) * Math.sin(t * 7.3 + lu) : 0.9;
      const r = pu * (2.2 + 1.2 * s) * fl;
      c.globalAlpha = Math.min(1, a * (0.85 * s) * fl);
      c.drawImage(lampSpr, (la - 15) * pu - r, -lu * pu - r, r * 2, r * 2);
      c.globalAlpha = Math.min(1, a * fl);
      c.fillStyle = 'rgb(236,255,190)'; c.beginPath(); c.arc((la - 15) * pu, -lu * pu, Math.max(0.6, pu * 0.22 * s), 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // the PENNANT from the main masthead (streaming aft — the wind of its own going), the ENSIGN on the stern staff
    const wv = motion ? t : 0;
    const streamer = (a0, u0, len, wid, n, sp2, col) => {
      c.beginPath();
      const top = [], bot = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n, ax = (a0 - 15 - f * len) * pu, w = Math.sin(f * 5.2 - wv * sp2) * f * 0.9 * pu + Math.sin(f * 11 - wv * sp2 * 1.6) * f * 0.25 * pu;
        const hw = wid * (1 - f * 0.75) * pu;
        top.push([ax, -(u0 * pu) - w - hw * 0.5]); bot.push([ax, -(u0 * pu) - w + hw * 0.5 + (i % 3 === 2 ? f * 0.5 * pu : 0)]);
      }
      top.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
      c.closePath(); c.fillStyle = col; c.fill();
      c.strokeStyle = 'rgba(200,255,226,0.8)'; c.lineWidth = Math.max(0.4, 0.05 * pu); c.stroke();
    };
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.9);
    streamer(14.4, 24.3, 9, 0.55, 18, 2.6, 'rgba(70,255,150,0.5)');
    c.strokeStyle = LINE2; c.lineWidth = Math.max(0.4, 0.07 * pu); c.beginPath(); c.moveTo((-0.9 - 15) * pu, -9.9 * pu); c.lineTo((-2.4 - 15) * pu, -14.2 * pu); c.stroke();
    streamer(-2.4, 13.6, 3.8, 1.9, 10, 2.1, 'rgba(70,250,150,0.4)');
    c.globalCompositeOperation = 'source-over';
    c.restore(); c.globalAlpha = 1;
  }

  return {
    /**
     * queue(env, water): this frame's place + its reflection and its lanterns' columns into the water's mirror (call BEFORE the water
     * composes — scene.js HOOK-B-LOW). env: { L, W, dpr, lc, nowS, since, t, dt, motion, tier, fade, play } → the place (or null)
     */
    queue(env, water) {
      const P = place(env);
      cur = P && !P.off ? P : null;
      if (P && P.run) {
        // the sounds at their beats: the creak as it materialises, the bell tolling twice through the crossing
        const s = P.run.s, key = `${P.run.n}|${Math.floor((env.nowS - s) / 10)}`, pan = Math.max(-1, Math.min(1, (P.g.fx * 2 - 1)));
        if (env.play && s > 1.2 && s < 4 && playedCreak !== key) { playedCreak = key; env.play('ghost-ship-creak', { pan, gain: 0.85 }); }
        if (env.play && s > 26 && s < 29 && playedBell !== key) { playedBell = key; env.play('ghost-bell', { pan, gain: 0.7 }); }
        if (env.play && s > 96 && s < 99 && playedBell2 !== key) { playedBell2 = key; env.play('ghost-bell', { pan, gain: 0.55 }); }
      }
      if (!cur || env.fade <= 0) return cur;
      const sp = bake(cur.k, env.dpr);
      if (water) {
        const motion = env.motion, t = env.t, P2 = cur;
        water.reflect(cx => drawShip(cx, P2, sp, 0.55 * P2.a * env.fade, true, t, motion), P2.axis);
        // the lanterns + the gun ports' green light as columns in the water (the mirror's copy doesn't carry what's drawn after it)
        for (const [la, lu, s] of LANTERNS) water.light(P2.cx + (la - 15) * P2.k * P2.dir, P2.axis - lu * P2.k, [140, 255, 150], 0.7 * s * P2.a * env.fade, 2.4 * P2.k * 0.5);
        water.light(P2.cx, P2.axis - 2.4 * P2.k, [90, 255, 160], 0.4 * P2.a * env.fade, GHOST.len * P2.k * 0.32);
      }
      return cur;
    },
    /** the ship on the water (scene.js HOOK-B-WATER-FAR): its green pool on the water, the ship, the mist rolling off its hull */
    draw(c, env) {
      const dt = Math.min(0.1, (env.dt || 16) / 1000), t = env.t;
      const P = cur;
      // the MIST: puffs born along the waterline under the hull, rolling outward + aft, rising a little, spreading (kept in screen
      // pt: it stays where it was breathed out while the ship drifts on — a trail of mist)
      if (P && env.motion && P.g.mist > 0.01) {
        const n = env.tier === 0 ? 8 : 18;
        if (mist.length < n && h01(frames, 3) < 0.5 + 0.5 * P.g.mist) {
          const f = h01(frames, 5), side = h01(frames, 7) < 0.5 ? -1 : 1;
          mist.push({ x: P.cx + (f - 0.5) * GHOST.len * 1.15 * P.k, y: P.axis - (0.3 + h01(frames, 11) * 1.2) * P.k, vx: side * (0.8 + h01(frames, 13) * 1.6) * P.k * 0.4 - P.dir * 0.4 * P.k, vy: -(0.05 + 0.1 * h01(frames, 17)) * P.k, r: (2.2 + 2.6 * h01(frames, 19)) * P.k, life: 0, max: 7 + 5 * h01(frames, 23) });
        }
      }
      frames++;
      if (mist.length) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const keep = [];
        for (const m of mist) {
          m.life += dt; if (m.life > m.max) continue; keep.push(m);
          m.x += m.vx * dt; m.y += m.vy * dt; m.r += 0.12 * P0(P) * dt * 6;
          const a = Math.sin(Math.PI * m.life / m.max) * 0.26 * (P ? Math.max(0.3, P.g.mist) : 0.5) * env.fade;
          c.globalAlpha = a; c.drawImage(mistSpr, m.x - m.r * 1.6, m.y - m.r * 0.55, m.r * 3.2, m.r * 1.1);
        }
        mist = keep; c.restore(); c.globalAlpha = 1;
      }
      if (!P || env.fade <= 0) return;
      const sp = bake(P.k, env.dpr);
      // its GREEN POOL on the water round the hull (the water lit from above by the ship's light)
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.32 * P.a * P.pulse * env.fade);
      const pw = GHOST.len * P.k * 1.5, ph = 4.2 * P.k;
      c.drawImage(poolSpr, P.cx - pw / 2, P.axis - ph * 0.35, pw, ph);
      c.restore(); c.globalAlpha = 1;
      drawShip(c, P, sp, P.a * env.fade, false, t, env.motion);
      // THE GHOST LIGHTS: a few green motes drifting up off the decks + the rigging, fading as they rise (the ship's own will-o'-wisps)
      if (env.motion) {
        if (motes.length < (env.tier === 0 ? 4 : 9) && h01(frames, 29) < 0.08) motes.push({ a: 2 + h01(frames, 31) * 30, u: 6 + h01(frames, 37) * 12, life: 0, max: 3 + h01(frames, 41) * 3, dr: (h01(frames, 43) - 0.5) * 0.8 });
        c.save(); c.globalCompositeOperation = 'lighter';
        const keep = [];
        for (const m of motes) {
          m.life += dt; if (m.life > m.max) continue; keep.push(m);
          const u = m.u + m.life * 1.1, a0 = m.a + m.dr * m.life + Math.sin(m.life * 2.1 + m.a) * 0.3, k = Math.sin(Math.PI * m.life / m.max);
          const sx = P.cx + (a0 - 15) * P.k * P.dir, sy = P.axis - (u - P.bob) * P.k, r = Math.max(1.4, P.k * 0.55);
          c.globalAlpha = Math.min(1, 0.8 * k * P.a * env.fade); c.drawImage(lampSpr, sx - r, sy - r, r * 2, r * 2);
        }
        motes = keep; c.restore(); c.globalAlpha = 1;
      }
      // the MIST SKIRT along the waterline: the hull's foot melting into a low bank (in front of it)
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const f = (i + 0.5) / 5, x = P.cx + (f - 0.5) * GHOST.len * 1.1 * P.k * P.dir + (env.motion ? Math.sin(t * 0.3 + i * 1.7) * 0.8 * P.k : 0);
        c.globalAlpha = Math.min(1, 0.3 * (P.g.mist * 0.6 + 0.4 * P.a) * env.fade);
        const r = (4.5 + (i % 2)) * P.k;
        c.drawImage(mistSpr, x - r * 1.7, P.axis - r * 0.5, r * 3.4, r * 0.95);
      }
      c.restore(); c.globalAlpha = 1;
    },
    /** the preview page: the ship at a given place (no clock) — P: { cx, axis, k, dir, a, bob, roll, pulse } */
    drawAt(c, P, env) { drawShip(c, { bob: 0, roll: 0, pulse: 1, ...P }, bake(P.k, env.dpr || 2), P.a == null ? 1 : P.a, false, env.t || 0, env.motion !== false); },
    active: () => !!cur,
    busy: () => !!cur || mist.length > 0,
    debug: () => (cur ? { on: true, s: +cur.run.s.toFixed(1), n: cur.run.n, x: Math.round(cur.cx), axis: Math.round(cur.axis), a: +cur.a.toFixed(2), k: +cur.k.toFixed(2), mist: mist.length } : { on: false, mist: mist.length }),
    destroy() { if (spr) { for (const cv of [spr.body, spr.lines, spr.glow]) cv.width = cv.height = 0; } spr = null; mist = []; motes = []; },
  };
}
const P0 = P => (P ? P.k : 3);

// ------------------------------------------------------------------ THE HALLOWEEN SKY + WATER controller (scene.js loads this module
// lazily — in October, or for a preview: &force=ghost-ship / witch / bats — and calls three hooks a frame)
/** a landmark tower's crown on screen (the bats' colony pours out of it): the SUNBURST's (the gold crown mid-skyline, clear of the
 *  NEON sign + the tagline), else the tallest tower's — { x, y } in pt, cached per layout */
let crownL = null, crownV = null;
export function crownOf(L) {
  if (L === crownL) return crownV;
  crownL = L; crownV = null;
  const ts = (L && L.towers) || [];
  const t = ts.find(o => o.id === 'sunburst') || ts[0];
  if (!t || !t.tiers) return null;
  const top = t.tiers[t.tiers.length - 1], ch = top.crown ? top.crown.h : (t.crown ? t.crown.h : 0);
  const [x, y] = project(L.cam, (top.x0 + top.x1) / 2, top.y0 + top.h + ch * 0.45, top.z0);
  crownV = { x, y };
  return crownV;
}
export function createHalloweenSky() {
  const ship = createGhostShip(), witch = createWitch();
  let last = { colony: null, jink: null };
  return {
    /** HOOK-B-SKY: the witch (+ her sparks) drawn; → the bats' Halloween input for birds.js (fs.hween) or null.
     *  env: { L, W, HZ, dpr, lc, nowS, t, dt, motion, tier, hp (HP), dusk, force (Set), forceAt(id), play, dark, lanes, moonAt, safeTop } */
    sky(c, env) {
      const f = env.force, hp = env.hp;
      witch.draw(c, { ...env, weight: f.has('no-witch') ? 0 : f.has('witch') ? 1 : hp ? hp.witch || 0 : 0, since: env.forceAt('witch') });
      const wB = f.has('bats') ? 1 : hp ? hp.bats || 0 : 0;
      if (!(wB > 0) || !env.motion) { last = { colony: null, jink: null }; return null; }
      const colony = f.has('bats') ? batColonyForced(env.nowS, env.forceAt('bats')) : batColonyAt(env.lc, wB, env.dusk);
      const jink = f.has('bats') ? null : batJinkAt(env.lc, wB, env.dusk);
      last = { colony, jink };
      return { weight: wB, colony, jink, crown: crownOf(env.L) };
    },
    /** HOOK-B-LOW (before the water composes): the ship's place + its reflection + its lanterns' columns queued into the water */
    queue(env, water) {
      const f = env.force;
      if (f.has('no-ghost-ship')) return ship.queue({ ...env, lc: null, since: null }, null);
      return ship.queue({ ...env, since: env.forceAt('ghost-ship') }, water);
    },
    /** HOOK-B-WATER-FAR: the ship, its pool of green light, the mist */
    water(c, env) { ship.draw(c, env); },
    active: () => ship.active(),
    busy: () => ship.busy() || witch.busy() || last.colony != null,
    debug: () => ({ ship: ship.debug(), witch: witch.debug(), bats: { colony: last.colony == null ? null : +last.colony.toFixed(1), jink: !!last.jink } }),
    destroy() { ship.destroy(); witch.destroy(); },
  };
}
