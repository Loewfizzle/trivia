// CITY 2.0 — THE HARBOR, PART 11a-1: THE HOLIDAY DRESSINGS ON THE GROUND — drawn (the places: core/harbor-holidayprops.js, PURE; what
// shows when: core/harbor-holiday.js). docs/harbor.md#part-11a-1. Three passes, each where it really stands (scene.js):
//   'ground'  after the speakeasy's live layer + the centrepiece, before the people: the marigold petal path to the side door, the
//             marigolds (the door's pots, the back half of a tree's ring, the back lamps' feet), the back lamps' garlands, THE
//             JACK-O'-LANTERNS on the side door's steps (their candle glow flickering through the carved faces, spilling on the steps)
//   'air'     after the people, before the front row: THE PAPEL PICADO strung across the promenade, fluttering in the real wind
//   'top'     after the front row: the front lamps' garlands + clumps, the front tree's ring (its front half), THE MONARCHS by day
// Everything static is PRE-RENDERED once per light key (the night level, the day's tones) into small sprites at the phone's dpr, in
// colours lit like the promenade's animals (fauna.js#litCol: the night + each lamp's pool); per frame only sprites are drawn (+ the
// flags' transforms, the candles' flicker, a monarch's wings). Reduced motion: the flags still, the candles steady, no monarchs.
import { project } from '../../core/harbor-layout.js';
import { pumpkinSlots, PUMPKIN_KINDS, marigoldSpots, garlandPosts, petalPath, papelRuns, monarchSlot, monarchAt, bigPumpkins, BALE, giantPiece, giantDecor, thanksgivingSpots } from '../../core/harbor-holidayprops.js';
import { createHarvest, paintSpotPiece, onHarvestModel } from './harvest.js';
import { createGiant } from './giant.js';
import { createFloods, atCentreScale } from './floods.js';
import { centreK } from '../../core/harbor-promenade.js';
import { GIANT as GIANT_P } from '../../core/harbor-holidayprops.js';
import { paintTreeStand } from './treestand.js';
import { spotById } from '../../core/harbor-spots.js';
import { lightField } from '../../core/harbor-light.js';
import { litCol } from './fauna.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { rngFrom, hashString } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${+a.toFixed(3)})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// the marigolds (cempasúchil): the deep orange + the gold, a few near-red — their leaves a dark fern green
const MARI = [[255, 128, 8], [255, 160, 16], [255, 186, 30], [240, 104, 10], [255, 142, 20]];
const LEAF = [44, 92, 40];
// the papel picado's tissue: hot pink, orange, purple, turquoise, yellow, green, red
const TISSUE = [[255, 46, 140], [255, 132, 24], [146, 64, 255], [24, 200, 196], [255, 214, 34], [56, 204, 92], [236, 40, 64]];

// ------------------------------------------------------------------ THE PUMPKINS (one sprite per slot per light; a glow sprite per face)
/** the carved face as paths in the pumpkin's own unit box (radius 1, y down), at its front */
function facePath(x, face, w) {
  const tri = (pts) => { x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); };
  const ex = 0.36 * w;
  switch (face) {
    case 'triangles':
      tri([[-ex - 0.17, -0.06], [-ex + 0.17, -0.06], [-ex, -0.34]]); tri([[ex - 0.17, -0.06], [ex + 0.17, -0.06], [ex, -0.34]]);
      tri([[-0.08, 0.12], [0.08, 0.12], [0, -0.02]]);
      x.moveTo(-0.5 * w, 0.2); x.quadraticCurveTo(0, 0.62, 0.5 * w, 0.2); x.lineTo(0.36 * w, 0.27); x.lineTo(0.26 * w, 0.22); x.lineTo(0.16 * w, 0.34); x.lineTo(-0.04, 0.29); x.lineTo(-0.16 * w, 0.37); x.lineTo(-0.28 * w, 0.25); x.lineTo(-0.38 * w, 0.29); x.closePath();
      break;
    case 'toothy':
      x.ellipse(-ex, -0.18, 0.14, 0.12, 0, 0, TAU); x.moveTo(ex + 0.14, -0.18); x.ellipse(ex, -0.18, 0.14, 0.12, 0, 0, TAU);
      tri([[-0.06, 0.06], [0.06, 0.06], [0, -0.06]]);
      x.moveTo(-0.56 * w, 0.14); x.quadraticCurveTo(0, 0.7, 0.56 * w, 0.14); x.quadraticCurveTo(0, 0.36, -0.56 * w, 0.14);
      break;
    case 'scary':
      tri([[-ex - 0.2, -0.28], [-ex + 0.14, -0.1], [-ex - 0.12, -0.02]]); tri([[ex + 0.2, -0.28], [ex - 0.14, -0.1], [ex + 0.12, -0.02]]);
      tri([[-0.05, 0.1], [0.05, 0.1], [0, 0.0]]);
      x.moveTo(-0.52 * w, 0.18); x.lineTo(-0.38 * w, 0.42); x.lineTo(-0.28 * w, 0.28); x.lineTo(-0.16 * w, 0.48); x.lineTo(-0.04, 0.3); x.lineTo(0.08, 0.5); x.lineTo(0.2 * w, 0.3); x.lineTo(0.32 * w, 0.46); x.lineTo(0.44 * w, 0.26); x.lineTo(0.54 * w, 0.18); x.lineTo(0.3 * w, 0.3); x.lineTo(0, 0.24); x.lineTo(-0.3 * w, 0.3); x.closePath();
      break;
    case 'cat': {
      // a sitting cat's silhouette cut through the skin, the moon behind it (a crescent)
      x.moveTo(-0.14, 0.42); x.quadraticCurveTo(-0.28, 0.1, -0.12, -0.08); x.lineTo(-0.16, -0.3); x.lineTo(-0.06, -0.18); x.lineTo(0.06, -0.18); x.lineTo(0.12, -0.3); x.lineTo(0.1, -0.06); x.quadraticCurveTo(0.24, 0.12, 0.16, 0.42); x.closePath();
      x.moveTo(0.18, 0.42); x.quadraticCurveTo(0.44, 0.4, 0.36, 0.18); x.quadraticCurveTo(0.4, 0.36, 0.2, 0.36); x.closePath();
      x.moveTo(0.52 * w, -0.32); x.arc(0.4 * w, -0.32, 0.12, 0, TAU);
      break;
    }
    case 'happy':
      x.moveTo(-ex - 0.16, -0.08); x.quadraticCurveTo(-ex, -0.36, -ex + 0.16, -0.08); x.quadraticCurveTo(-ex, -0.2, -ex - 0.16, -0.08);
      x.moveTo(ex - 0.16, -0.08); x.quadraticCurveTo(ex, -0.36, ex + 0.16, -0.08); x.quadraticCurveTo(ex, -0.2, ex - 0.16, -0.08);
      x.moveTo(-0.52 * w, 0.1); x.quadraticCurveTo(0, 0.72, 0.52 * w, 0.1); x.quadraticCurveTo(0, 0.4, -0.52 * w, 0.1);
      break;
    case 'wink':
      tri([[-ex - 0.16, -0.06], [-ex + 0.16, -0.06], [-ex, -0.32]]);
      x.moveTo(ex - 0.17, -0.15); x.quadraticCurveTo(ex, -0.24, ex + 0.17, -0.15); x.quadraticCurveTo(ex, -0.19, ex - 0.17, -0.15);
      x.moveTo(-0.46 * w, 0.18); x.quadraticCurveTo(0.05, 0.6, 0.5 * w, 0.1); x.quadraticCurveTo(0.05, 0.36, -0.46 * w, 0.18);
      break;
    case 'surprised':
      x.ellipse(-ex, -0.18, 0.12, 0.15, 0, 0, TAU); x.moveTo(ex + 0.12, -0.18); x.ellipse(ex, -0.18, 0.12, 0.15, 0, 0, TAU);
      x.moveTo(0.14, 0.3); x.ellipse(0, 0.3, 0.14, 0.17, 0, 0, TAU);
      break;
    case 'fangs':
      tri([[-ex - 0.17, -0.1], [-ex + 0.15, -0.04], [-ex - 0.02, -0.3]]); tri([[ex + 0.17, -0.1], [ex - 0.15, -0.04], [ex + 0.02, -0.3]]);
      x.moveTo(-0.5 * w, 0.14); x.quadraticCurveTo(0, 0.56, 0.5 * w, 0.14); x.lineTo(0.22 * w, 0.24); x.lineTo(0.16 * w, 0.4); x.lineTo(0.1 * w, 0.26); x.lineTo(-0.1 * w, 0.26); x.lineTo(-0.16 * w, 0.4); x.lineTo(-0.22 * w, 0.24); x.closePath();
      break;
    default: break;
  }
}
/** a pumpkin into its sprite (px: the diameter in px). col: the light at its place; carved: its face cut (dark by day, a glowing cavity at
 *  night is the glow sprite's). Returns { cv, cx, cy (the foot), r } */
export function paintPumpkin(slot, px, col, carved, night) {
  const K = PUMPKIN_KINDS[slot.kind], R = px / 2, W = R * 2.6 * Math.max(1, K.w), H = R * 2.6, cv = mk(W, H), x = safeCtx(cv);
  const cx = W / 2, foot = H * 0.86, rx = R * K.w, ry = R * K.h, cy = foot - ry;
  const r = rngFrom(slot.seed);
  if (K.cluster) {
    // THE GOURDS: three small ones — a striped green-yellow, a little orange one, a pale bumpy one
    const G = [[-0.5, 0.42, 0.5, [226, 196, 60], [70, 110, 40]], [0.42, 0.36, 0.44, [236, 124, 30], [130, 60, 14]], [-0.02, 0.52, 0.46, [232, 220, 180], [150, 140, 100]]];
    for (const [dx, sr, h, c0, c1] of G) {
      const gx = cx + dx * R * 1.3, gr = R * sr, gy = foot - gr * 0.85;
      const g = x.createRadialGradient(gx - gr * 0.35, gy - gr * 0.4, gr * 0.1, gx, gy, gr * 1.1);
      g.addColorStop(0, rgb(col(mix(c0, [255, 255, 255], 0.25)))); g.addColorStop(0.6, rgb(col(c0))); g.addColorStop(1, rgb(col(c1)));
      x.fillStyle = g; x.beginPath(); x.ellipse(gx, gy, gr, gr * (0.8 + h * 0.3), 0, 0, TAU); x.fill();
      if (c0[1] > 180 && c0[2] < 100) { x.strokeStyle = rgb(col([84, 120, 46]), 0.7); x.lineWidth = Math.max(0.5, gr * 0.12); for (const k of [-0.5, 0, 0.5]) { x.beginPath(); x.ellipse(gx + k * gr * 0.5, gy, gr * (1 - Math.abs(k) * 0.6) * 0.5, gr * 0.9, 0, -1.2, 1.2); x.stroke(); } }
      x.strokeStyle = rgb(col([80, 72, 40])); x.lineWidth = Math.max(0.6, gr * 0.16); x.lineCap = 'round'; x.beginPath(); x.moveTo(gx, gy - gr * 0.85); x.quadraticCurveTo(gx + gr * 0.2, gy - gr * 1.2, gx + gr * 0.35, gy - gr * 1.25); x.stroke();
    }
    return { cv, cx, foot, r: R, w: W, h: H };
  }
  // the lobes: the ribs as overlapping vertical ellipses — the back ones darker, the side ones narrower, the middle one lightest
  const n = K.ribs, skin = col(K.skin), dark = col(K.dark), hi = col(mix(K.skin, [255, 240, 200], 0.35));
  x.save();
  // the body's silhouette first (a little flattened top + bottom, the stem's dimple)
  const body = () => { x.beginPath(); x.moveTo(cx, cy - ry * 0.86); x.bezierCurveTo(cx + rx * 0.62, cy - ry * 1.16, cx + rx * 1.06, cy - ry * 0.6, cx + rx, cy + ry * 0.05); x.bezierCurveTo(cx + rx * 0.96, cy + ry * 0.78, cx + rx * 0.5, cy + ry * 1.0, cx, cy + ry * 0.96); x.bezierCurveTo(cx - rx * 0.5, cy + ry * 1.0, cx - rx * 0.96, cy + ry * 0.78, cx - rx, cy + ry * 0.05); x.bezierCurveTo(cx - rx * 1.06, cy - ry * 0.6, cx - rx * 0.62, cy - ry * 1.16, cx, cy - ry * 0.86); x.closePath(); };
  body(); x.fillStyle = rgb(dark); x.fill();
  x.clip();
  // each lobe: across the front, its own gradient (lit from up-left), its edge a dark groove
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k + 0.5) / n * Math.PI, sx = Math.sin(a), w = Math.cos(a) * 0.9 + 0.1;   // −1 … 1 across, w: how front-on
    const lx = cx + sx * rx * 0.84, lw = rx * (0.22 + 0.36 * w) * (8 / n) * 1.1;
    const g = x.createLinearGradient(lx - lw, cy - ry, lx + lw, cy + ry);
    const lit = clamp01(0.55 + 0.45 * w - 0.25 * sx);
    g.addColorStop(0, rgb(mix(skin, hi, lit * 0.8))); g.addColorStop(0.55, rgb(mix(dark, skin, 0.55 + 0.45 * lit))); g.addColorStop(1, rgb(mix(dark, skin, 0.3 * lit)));
    x.fillStyle = g; x.beginPath(); x.ellipse(lx, cy + ry * 0.02, lw, ry * (0.98 - 0.05 * Math.abs(sx)), 0, 0, TAU); x.fill();
  }
  // the grooves between the lobes (curving round the body)
  x.strokeStyle = rgb(mix(dark, [20, 8, 4], 0.35), 0.75); x.lineWidth = Math.max(0.4, R * 0.045);
  for (let k = 1; k < n; k++) { const a = -Math.PI / 2 + k / n * Math.PI, sx = Math.sin(a), gx = cx + sx * rx * 0.86; x.beginPath(); x.moveTo(cx + sx * rx * 0.22, cy - ry * 0.84); x.quadraticCurveTo(gx + sx * rx * 0.18, cy, cx + sx * rx * 0.28, cy + ry * 0.94); x.stroke(); }
  // the skin's matte sheen (up-left) + the shade at its foot
  { const g = x.createRadialGradient(cx - rx * 0.38, cy - ry * 0.45, 0, cx - rx * 0.38, cy - ry * 0.45, rx * 0.9); g.addColorStop(0, rgb(hi, night ? 0.12 : 0.34)); g.addColorStop(1, rgb(hi, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  { const g = x.createLinearGradient(0, cy + ry * 0.2, 0, cy + ry); g.addColorStop(0, 'rgba(20,6,2,0)'); g.addColorStop(1, 'rgba(20,6,2,0.45)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  if (K.warts) { x.fillStyle = rgb(mix(skin, [120, 140, 60], 0.4)); for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.8; x.beginPath(); x.arc(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, Math.max(0.4, R * (0.04 + r() * 0.04)), 0, TAU); x.fill(); } }
  // the carved face: the cut-out (a dark cavity by day; the night's glow is the glow sprite, drawn over), the cut flesh's pale edge
  if (carved && slot.face !== 'none') {
    x.save(); x.translate(cx, cy + ry * 0.05); x.scale(rx * 1.0, ry * 1.0);
    x.beginPath(); facePath(x, slot.face, 1);
    x.fillStyle = night ? 'rgb(54,20,6)' : 'rgb(30,12,6)'; x.fill('evenodd');
    x.lineWidth = 0.05; x.strokeStyle = rgb(col([250, 214, 120]), night ? 0.35 : 0.65); x.stroke();
    x.restore();
  }
  x.restore();
  // the outline's dark edge
  body(); x.lineWidth = Math.max(0.5, R * 0.05); x.strokeStyle = rgb(mix(dark, [10, 4, 2], 0.5), 0.8); x.stroke();
  // the stem: a short twisted woody stalk, curving, its cut top lighter
  const sc = col(K.stem), sh = ry * (0.36 + r() * 0.16), lean = (r() - 0.5) * 0.8 * R;
  x.lineCap = 'round'; x.strokeStyle = rgb(mix(sc, [20, 18, 10], 0.35)); x.lineWidth = Math.max(0.8, R * 0.2);
  x.beginPath(); x.moveTo(cx, cy - ry * 0.82); x.quadraticCurveTo(cx + lean * 0.2, cy - ry * 0.82 - sh * 0.7, cx + lean, cy - ry * 0.82 - sh); x.stroke();
  x.strokeStyle = rgb(sc); x.lineWidth = Math.max(0.5, R * 0.1);
  x.beginPath(); x.moveTo(cx - R * 0.03, cy - ry * 0.84); x.quadraticCurveTo(cx + lean * 0.2 - R * 0.03, cy - ry * 0.84 - sh * 0.7, cx + lean - R * 0.02, cy - ry * 0.82 - sh); x.stroke();
  x.fillStyle = rgb(mix(sc, [230, 220, 170], 0.5)); x.beginPath(); x.arc(cx + lean, cy - ry * 0.82 - sh, Math.max(0.4, R * 0.085), 0, TAU); x.fill();
  return { cv, cx, foot, cy, rx, ry, r: R, w: W, h: H };
}
/** the face's light (a candle behind the cut): the holes filled hot yellow-white → orange at their edges + the flesh glowing round them */
function paintFaceGlow(slot, sp) {
  const cv = mk(sp.w, sp.h), x = safeCtx(cv), { cx, cy, rx, ry } = sp;
  // the warm translucence of the skin round the face (the candle through the flesh)
  { const g = x.createRadialGradient(cx, cy + ry * 0.1, 0, cx, cy + ry * 0.1, rx * 1.05); g.addColorStop(0, 'rgba(255,150,40,0.2)'); g.addColorStop(0.55, 'rgba(255,110,20,0.07)'); g.addColorStop(1, 'rgba(255,90,10,0)');
    x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry * 0.98, 0, 0, TAU); x.clip(); x.fillStyle = g; x.fillRect(0, 0, sp.w, sp.h); x.restore(); }
  x.save(); x.translate(cx, cy + ry * 0.05); x.scale(rx * 1.0, ry * 1.0);
  x.beginPath(); facePath(x, slot.face, 1);
  const g = x.createRadialGradient(0, 0.1, 0, 0, 0.1, 0.9); g.addColorStop(0, 'rgb(255,250,214)'); g.addColorStop(0.45, 'rgb(255,214,96)'); g.addColorStop(1, 'rgb(255,128,20)');
  x.fillStyle = g; x.fill('evenodd');
  x.lineWidth = 0.05; x.strokeStyle = 'rgba(255,150,50,0.85)'; x.stroke();
  x.restore();
  return cv;
}
let glowCache = null;
function glowSprite() {
  if (glowCache) return glowCache;
  const S = 96, cv = mk(S, S), x = safeCtx(cv), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (const [t, a] of [[0, 1], [0.2, 0.55], [0.45, 0.2], [0.75, 0.05], [1, 0]]) g.addColorStop(t, `rgba(255,${Math.round(150 + 60 * (1 - t))},${Math.round(60 * (1 - t))},${a})`);
  x.fillStyle = g; x.fillRect(0, 0, S, S); return (glowCache = cv);
}

// ------------------------------------------------------------------ THE MARIGOLDS (a bloom painter + the spots + the garlands)
/** one cempasúchil bloom at (bx, by), radius br px: a ruffled pompom — layers of frilled petals, the gold edges, a deeper heart */
function bloom(x, bx, by, br, c0, col, r) {
  const deep = col(mix(c0, [150, 40, 0], 0.45)), base = col(c0), edge = col(mix(c0, [255, 230, 120], 0.45));
  x.fillStyle = rgb(deep); x.beginPath(); x.ellipse(bx, by + br * 0.12, br, br * 0.86, 0, 0, TAU); x.fill();
  if (br < 1.1) { x.fillStyle = rgb(base); x.beginPath(); x.ellipse(bx - br * 0.2, by - br * 0.15, br * 0.6, br * 0.5, 0, 0, TAU); x.fill(); return; }
  // the ruffle: petals round the rim in two rings, each a little scalloped dab
  for (const [ring, k, cc] of [[0.72, 9, base], [0.4, 6, edge]]) {
    for (let i = 0; i < k; i++) { const a = i / k * TAU + r() * 0.5, px = bx + Math.cos(a) * br * ring * 0.9, py = by + Math.sin(a) * br * ring * 0.75 - br * 0.08; x.fillStyle = rgb(cc); x.beginPath(); x.ellipse(px, py, br * 0.34, br * 0.26, a, 0, TAU); x.fill(); }
  }
  x.fillStyle = rgb(mix(deep, base, 0.4)); x.beginPath(); x.arc(bx + br * 0.05, by - br * 0.02, br * 0.2, 0, TAU); x.fill();
  x.fillStyle = rgb(col([255, 240, 170]), 0.55); x.beginPath(); x.ellipse(bx - br * 0.3, by - br * 0.38, br * 0.28, br * 0.16, -0.5, 0, TAU); x.fill();
}
function leafy(x, lx, ly, len, ang, col) {
  // a fern-like marigold leaf: a midrib + little leaflets
  x.strokeStyle = rgb(col(LEAF)); x.lineWidth = Math.max(0.4, len * 0.08); x.lineCap = 'round';
  const ex = lx + Math.cos(ang) * len, ey = ly + Math.sin(ang) * len;
  x.beginPath(); x.moveTo(lx, ly); x.lineTo(ex, ey); x.stroke();
  x.fillStyle = rgb(col(mix(LEAF, [20, 50, 20], 0.3)));
  for (let i = 1; i < 5; i++) { const u = i / 5, px = lerp(lx, ex, u), py = lerp(ly, ey, u); for (const s of [-1, 1]) { x.beginPath(); x.ellipse(px + Math.cos(ang + s * 1.1) * len * 0.12, py + Math.sin(ang + s * 1.1) * len * 0.12, len * 0.11, len * 0.045, ang + s * 1.1, 0, TAU); x.fill(); } }
}

// ------------------------------------------------------------------ THE PAPEL PICADO (one sprite per colour × pattern × light)
const PAT = ['calavera', 'flores', 'corazon', 'paloma'];
function paintFlag(ci, pi, col, lit) {
  const Wd = 54, Hd = 66, cv = mk(Wd, Hd), x = safeCtx(cv);
  const c0 = col(TISSUE[ci]);
  // the tissue: a faint vertical grain + its slightly paler top hem folded over the string
  x.fillStyle = rgb(c0, lit ? 0.96 : 0.94); x.fillRect(1, 3, Wd - 2, Hd - 4);
  x.fillStyle = rgb(mix(c0, [255, 255, 255], 0.18)); x.fillRect(1, 0, Wd - 2, 6);
  x.fillStyle = rgb(mix(c0, [0, 0, 0], 0.25)); x.fillRect(1, 5.5, Wd - 2, 1.2);
  // the cut-outs: holes through the tissue (destination-out) — the border lattice, the scalloped + fringed hem, the motif
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  // the border: a row of small diamonds near the top + down both sides
  for (let u = 6; u < Wd - 4; u += 6) { x.beginPath(); x.moveTo(u, 10); x.lineTo(u + 2, 12.5); x.lineTo(u, 15); x.lineTo(u - 2, 12.5); x.fill(); }
  for (let v = 19; v < Hd - 16; v += 6) for (const u of [5, Wd - 5]) { x.beginPath(); x.arc(u, v, 1.35, 0, TAU); x.fill(); }
  // the hem: scallops + a fringe of little triangles
  for (let u = 0; u < Wd; u += 6) { x.beginPath(); x.moveTo(u, Hd); x.lineTo(u + 3, Hd - 6); x.lineTo(u + 6, Hd); x.fill(); }
  for (let u = 3; u < Wd - 2; u += 6) { x.beginPath(); x.arc(u, Hd - 10.5, 1.6, 0, TAU); x.fill(); }
  // the motif, centred
  const mx = Wd / 2, my = 35;
  const pat = PAT[pi];
  if (pat === 'calavera') {
    // a sugar-skull: the skull's outline as a lacy ring, the eyes + nose holes, the teeth's slots; flowers for eyes
    x.beginPath(); x.ellipse(mx, my - 3, 12, 11, 0, 0, TAU); x.ellipse(mx, my - 3, 9.6, 8.6, 0, 0, TAU); x.fill('evenodd');
    x.beginPath(); x.ellipse(mx - 5, my - 4, 3.4, 3.8, 0, 0, TAU); x.ellipse(mx + 5, my - 4, 3.4, 3.8, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(mx, my + 0.5); x.lineTo(mx - 1.6, my + 3.4); x.lineTo(mx + 1.6, my + 3.4); x.fill();
    for (let i = -2; i <= 2; i++) x.fillRect(mx + i * 2.6 - 0.8, my + 6, 1.6, 4.5);
  } else if (pat === 'flores') {
    // a big flower: petals round a ring + four small ones in the corners
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.beginPath(); x.ellipse(mx + Math.cos(a) * 7.5, my + Math.sin(a) * 7.5, 4.4, 2.2, a, 0, TAU); x.fill(); }
    x.beginPath(); x.arc(mx, my, 2.6, 0, TAU); x.fill();
    for (const [dx, dy] of [[-15, -12], [15, -12], [-15, 12], [15, 12]]) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; x.beginPath(); x.arc(mx + dx + Math.cos(a) * 2.4, my + dy + Math.sin(a) * 2.4, 1.3, 0, TAU); x.fill(); }
  } else if (pat === 'corazon') {
    // a heart in a lattice ring
    x.beginPath(); x.moveTo(mx, my + 9); x.bezierCurveTo(mx - 15, my - 2, mx - 7, my - 13, mx, my - 5); x.bezierCurveTo(mx + 7, my - 13, mx + 15, my - 2, mx, my + 9); x.fill();
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; x.beginPath(); x.arc(mx + Math.cos(a) * 16, my + Math.sin(a) * 15, 1.4, 0, TAU); x.fill(); }
  } else {
    // a dove (paloma) over a little arch of holes
    x.beginPath(); x.moveTo(mx - 13, my); x.quadraticCurveTo(mx - 4, my - 12, mx + 2, my - 2); x.quadraticCurveTo(mx + 9, my - 6, mx + 13, my - 4); x.quadraticCurveTo(mx + 9, my - 1, mx + 6, my + 3); x.quadraticCurveTo(mx - 2, my + 6, mx - 8, my + 4); x.closePath(); x.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; x.beginPath(); x.arc(mx + Math.cos(a) * 14, my + 12 + Math.sin(a) * 6, 1.3, 0, TAU); x.fill(); }
  }
  x.restore();
  // the paper's soft folds (two faint creases) + by day the light through it
  x.fillStyle = rgb([0, 0, 0], 0.07); x.fillRect(Wd * 0.33, 6, 1, Hd - 12); x.fillRect(Wd * 0.66, 6, 1, Hd - 12);
  return cv;
}

// ------------------------------------------------------------------ THE LIVE MANAGER
export function createHolidayProps() {
  const stat = { rects: [] };
  let L = null, lay = '', slots = [], spots = [], posts = [], path = null, runs = [], bigs = [], giantG = null, decor = [];
  const giant = createGiant();   // (11a-2: THE GIANT JACK-O'-LANTERN on the centre circle — giant.js)
  const harvest = createHarvest({ paintPumpkin }), unwatch = [];
  const floods = createFloods();   // (9c: THE SHOW LIGHTING on the centre circle's piece — the giant, the harvest display: floods.js)   // (11a-2: THE HARVEST DISPLAY on the centre circle — harvest.js)
  let tgKey = '', tgList = [];
  const cache = new Map();
  let lightKey = '', lightFn = null, lightDark = -1;
  const SPRITE_MAX = 220;
  const put = (k, v) => { cache.set(k, v); if (cache.size > SPRITE_MAX) { const old = cache.keys().next().value; const o = cache.get(old); if (o && o.cv) o.cv.width = o.cv.height = 0; cache.delete(old); } return v; };

  function layout(Lnew, dpr) {
    const sig = `${Lnew.cam.W}|${Lnew.cam.H}|${Lnew.cam.F}|${dpr}|${Lnew.speakeasy.x0.toFixed(3)}`;
    if (L === Lnew && sig === lay) return;
    L = Lnew; lay = sig;
    slots = pumpkinSlots(L); spots = marigoldSpots(L); posts = garlandPosts(L); path = petalPath(L); runs = papelRuns(L); bigs = bigPumpkins(L); giantG = giantPiece(L); decor = giantDecor(L);
    for (const v of cache.values()) if (v && v.cv) v.cv.width = v.cv.height = 0;
    cache.clear(); lightKey = '';
  }
  function envLight(env) {
    const dark = clamp01(env.dark || 0), k = Math.round(dark * 20) / 20;
    if (k !== lightDark) { lightDark = k; lightFn = k > 0.01 ? lightField(L, { lamps: k }) : null; }
    const T = env.T || { day: 1 };
    const key = `${k}|${Math.round((T.day || 0) * 10)}|${Math.round((T.gold || 0) * 10)}|${Math.round((T.night || 0) * 10)}|${Math.round((T.ovc || 0) * 5)}|${lay}`;
    if (key !== lightKey) { lightKey = key; }
    return { T, dark: k, lightAt: lightFn };
  }
  // (the dressings' own light — fauna.js#litCol darkens an animal to a silhouette; a marigold or a pumpkin keeps its colour in the lamps'
  // pools: the night takes 0.6 of it, each lamp's light comes back off the pigment)
  const colAt = (E, x, z, k = 1) => c => {
    const T = E.T || { day: 1 }, dark = Math.max(E.dark || 0, clamp01(T.night || 0));
    let v = c;
    if (T.gold) v = mix(v, [v[0] * 1.1 + 12, v[1] * 0.95, v[2] * 0.8], T.gold * 0.5);
    if ((T.ovc || 0) > 0.3) v = mix(v, [v[0] * 0.86 + 14, v[1] * 0.88 + 14, v[2] * 0.9 + 18], (T.ovc - 0.3) * 0.6);
    if (dark > 0.01) {
      v = mix(v, [22, 18, 36], 0.66 * dark);
      const lt = E.lightAt ? E.lightAt(x, z) : null;
      if (lt) { const q = Math.min(1, 210 / Math.max(1, lt[0], lt[1], lt[2])); v = [0, 1, 2].map(i => v[i] + lt[i] * q * 0.42 * k * (E.dark || 0) * (0.3 + 0.7 * c[i] / 255)); }
    }
    return [Math.min(255, v[0]), Math.min(255, v[1]), Math.min(255, v[2])];
  };

  // ---------------------------------------------------------------- the pumpkins
  function pumpkinSprite(sl, E, carved, dpr) {
    const k = `pk|${sl.i}|${carved ? 1 : 0}|${lightKey}`;
    let sp = cache.get(k); if (sp) return sp;
    const s = L.cam.F / sl.z, px = sl.d * s * dpr;
    const lc = colAt(E, sl.x, sl.z, carved ? 0.55 : 1.1), nk = carved ? clamp01((E.dark - 0.25) / 0.5) * 0.4 : 0;
    sp = paintPumpkin(sl, px, c => lc(c).map(v => v * (1 - nk)), carved, E.dark > 0.4);
    sp.glow = carved && sl.face !== 'none' ? paintFaceGlow(sl, sp) : null;
    return put(k, sp);
  }
  function drawPumpkins(c, env, E, list) {
    const dpr = env.dpr || 2, t = env.t || 0, mo = env.motion !== false, night = clamp01((E.dark - 0.25) / 0.5) * (env.power == null ? 1 : env.power);
    const on = new Map(list.map(p => [p.i, p]));
    const order = slots.filter(s => on.has(s.i)).sort((a, b) => b.z - a.z);
    const glows = []; stat.pk = order.length; stat.night = +night.toFixed(2); stat.dark = E.dark; stat.glows = 0;
    for (const sl of order) {
      const p = on.get(sl.i), carved = !!p.carved, sp = pumpkinSprite(sl, E, carved, dpr);
      const [sx, sy] = project(L.cam, sl.x, sl.y, sl.z), s = L.cam.F / sl.z;
      // the contact shadow on the stone
      c.fillStyle = 'rgba(10,6,12,0.42)'; c.beginPath(); c.ellipse(sx, sy, sl.d * s * 0.55, sl.d * s * 0.13, 0, 0, TAU); c.fill();
      c.save(); c.translate(sx, sy); c.rotate(sl.tilt);
      c.drawImage(sp.cv, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr);
      stat.rects.push({ id: `step-${sl.i}`, x: +(sx - sp.cx / dpr).toFixed(1), y: +(sy - sp.foot / dpr).toFixed(1), w: +(sp.w / dpr).toFixed(1), h: +(sp.h / dpr).toFixed(1) });
      // the candle inside (after dark): the glow through the carved face, flickering
      if (sp.glow && night > 0.02) {
        const fl = mo ? clamp01(0.78 + 0.12 * Math.sin(t * 9.1 * sl.flick + sl.seed) + 0.07 * Math.sin(t * 23.7 + sl.seed * 0.3) + 0.05 * Math.sin(t * 3.3 + sl.i)) : 0.9;
        c.globalAlpha = night * fl; c.drawImage(sp.glow, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr);
        if (env.tier !== 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * night * fl; c.drawImage(sp.glow, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr); c.globalCompositeOperation = 'source-over'; } c.globalAlpha = 1;
        glows.push({ sx, sy: sy - sl.d * s * 0.42, gy: sy, r: sl.d * s * 2.0, k: night * fl }); stat.glows++;
      }
      c.restore();
    }
    // the light spilling on the steps, the door, the pavement (one additive pass)
    if (glows.length) {
      const g = glowSprite(); c.save(); c.globalCompositeOperation = 'lighter';
      for (const o of glows) { c.globalAlpha = 0.34 * o.k; c.drawImage(g, o.sx - o.r, o.gy - o.r * 0.32, o.r * 2, o.r * 0.64); c.globalAlpha = 0.12 * o.k; c.drawImage(g, o.sx - o.r * 0.7, o.sy - o.r * 0.9, o.r * 1.4, o.r * 1.4); }
      c.restore(); c.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- WIN — THE BIG JACK-O'-LANTERNS on the DRESSING SPOTS (+ their straw bales)
  // (the owner: "BIG jack-o'-lanterns on the promenade, readable at a glance: a big one next to the BENCH, another by a LAMP POST or the FIRE
  // HYDRANT, carved faces glowing at night, some on a straw bale" — core/harbor-holidayprops.js#BIG_PIECES on core/harbor-spots.js's spots;
  // each a sprite per light key like the steps' ones; z-sorted with the walkers through people.js's extras (items('near')), the front
  // strip's in the 'top' pass)
  function baleSprite(b, E, dpr) {
    const k = `bale|${b.i}|${lightKey}`; let sp = cache.get(k); if (sp) return sp;
    const px = L.cam.F / b.z * dpr, col = colAt(E, b.x, b.z, 1.0), side = b.side || 1, r = rngFrom(b.seed + 7);
    const w = BALE.w * px, h = BALE.h * px, dd = BALE.d * 0.38 * px, W = w + dd + 0.3 * px, Hh = h + dd + 0.24 * px, cv = mk(W, Hh), x = safeCtx(cv), cx = W / 2, foot = Hh - 0.04 * px;
    const straw = [214, 172, 72], strawHi = [240, 208, 112], strawLo = [146, 104, 38], twine = [92, 62, 28];
    // the front face: straw, darker at the foot; the top face lighter + leaning back; the side we see (away from the screen's centre) darker
    { const g = x.createLinearGradient(0, foot - h, 0, foot); g.addColorStop(0, rgb(col(mix(straw, strawHi, 0.25)))); g.addColorStop(1, rgb(col(strawLo))); x.fillStyle = g; x.fillRect(cx - w / 2, foot - h, w, h); }
    x.fillStyle = rgb(col(mix(straw, strawHi, 0.55))); x.beginPath(); x.moveTo(cx - w / 2, foot - h); x.lineTo(cx + w / 2, foot - h); x.lineTo(cx + w / 2 + side * dd * 0.35, foot - h - dd); x.lineTo(cx - w / 2 + side * dd * 0.35, foot - h - dd); x.closePath(); x.fill();
    x.fillStyle = rgb(col(mix(strawLo, [90, 60, 24], 0.35))); x.beginPath(); x.moveTo(cx + side * w / 2, foot); x.lineTo(cx + side * w / 2, foot - h); x.lineTo(cx + side * (w / 2 + dd * 0.35), foot - h - dd); x.lineTo(cx + side * (w / 2 + dd * 0.35), foot - dd * 0.55); x.closePath(); x.fill();
    // the fibres: short straws across the front + the top, lighter + darker; a few sticking out of the top edge
    x.lineCap = 'round'; x.lineWidth = Math.max(0.5, 0.012 * px);
    for (let i = 0; i < 80; i++) { const fx = cx - w / 2 + r() * w, fy = foot - r() * h, len = (0.05 + r() * 0.12) * px, a = (r() - 0.5) * 0.5; x.strokeStyle = rgb(col(r() < 0.5 ? strawHi : strawLo), 0.7); x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * len, fy + Math.sin(a) * len); x.stroke(); }
    for (let i = 0; i < 20; i++) { const fx = cx - w / 2 + r() * w, fy = foot - h - r() * dd * 0.9, len = (0.06 + r() * 0.1) * px; x.strokeStyle = rgb(col(strawHi), 0.8); x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + len * 0.9, fy - len * 0.2); x.stroke(); }
    x.lineWidth = Math.max(0.5, 0.014 * px); x.strokeStyle = rgb(col(strawHi));
    for (let i = 0; i < 7; i++) { const fx = cx - w / 2 + r() * w, len = (0.08 + r() * 0.1) * px; x.beginPath(); x.moveTo(fx, foot - h); x.lineTo(fx + (r() - 0.5) * len, foot - h - len); x.stroke(); }
    // the twine: two dark bands round the bale (over the front + the top)
    x.fillStyle = rgb(col(twine), 0.9);
    for (const f of [0.3, 0.7]) { const bx = cx - w / 2 + w * f; x.fillRect(bx - 0.016 * px, foot - h, 0.032 * px, h); x.beginPath(); x.moveTo(bx - 0.016 * px, foot - h); x.lineTo(bx + 0.016 * px, foot - h); x.lineTo(bx + 0.016 * px + side * dd * 0.35, foot - h - dd); x.lineTo(bx - 0.016 * px + side * dd * 0.35, foot - h - dd); x.closePath(); x.fill(); }
    { const g = x.createLinearGradient(0, foot - h * 0.35, 0, foot); g.addColorStop(0, 'rgba(30,16,4,0)'); g.addColorStop(1, 'rgba(30,16,4,0.38)'); x.fillStyle = g; x.fillRect(cx - w / 2 - dd, foot - h, w + dd * 2, h); }
    return put(k, { cv, cx, foot, w: W, h: Hh });
  }
  function bigSprite(b, E, dpr, gourd = false) {
    const k = `big|${b.i}|${gourd ? 'g' : 'p'}|${lightKey}`; let sp = cache.get(k); if (sp) return sp;
    const s = L.cam.F / b.z, slot = gourd ? { ...b, kind: 'gourds', face: 'none', seed: b.seed + 3 } : b, px = (gourd ? 0.55 : b.d) * s * dpr, lc = colAt(E, b.x, b.z, gourd ? 1.1 : 0.55), nk = gourd ? 0 : clamp01((E.dark - 0.25) / 0.5) * 0.4;
    sp = paintPumpkin(slot, px, c => lc(c).map(v => v * (1 - nk)), !gourd, E.dark > 0.4);
    sp.glow = !gourd && b.face !== 'none' ? paintFaceGlow(b, sp) : null;
    return put(k, sp);
  }
  /** one big piece where it stands: the contact shadow, the bale (if any), the pumpkin (+ a gourd beside it), the candle's glow after dark */
  function drawBig(c, b, env, E) {
    const dpr = env.dpr || 2, t = env.t || 0, mo = env.motion !== false, night = clamp01((E.dark - 0.25) / 0.5) * (env.power == null ? 1 : env.power), cam = L.cam, s = cam.F / b.z, fade = env.fade == null ? 1 : env.fade;
    const [gx, gy] = project(cam, b.x, 0, b.z), [sx, sy] = project(cam, b.x, b.y, b.z);
    c.save(); c.globalAlpha = fade;
    // (11a-2: the giant's plinth decor stands ON the plinth — its contact shadow on the straw, not on the cobbles under it)
    c.fillStyle = 'rgba(10,6,12,0.42)'; c.beginPath(); c.ellipse(gx, b.decor ? sy : gy, (b.bale ? BALE.w * 0.62 : b.d * 0.55) * s, (b.bale ? BALE.w * 0.15 : b.d * 0.13) * s, 0, 0, TAU); c.fill();
    if (b.bale) { const bs = baleSprite(b, E, dpr); c.drawImage(bs.cv, gx - bs.cx / dpr, gy - bs.foot / dpr, bs.w / dpr, bs.h / dpr); }
    if (b.gourd) { const g = bigSprite(b, E, dpr, true), gxx = sx + (b.side || 1) * (b.d * 0.5 + 0.3) * s; c.drawImage(g.cv, gxx - g.cx / dpr, sy - g.foot / dpr, g.w / dpr, g.h / dpr); }
    const sp = bigSprite(b, E, dpr);
    c.save(); c.translate(sx, sy); c.rotate(b.tilt);
    c.drawImage(sp.cv, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr);
    const fl = mo ? clamp01(0.78 + 0.12 * Math.sin(t * 9.1 * b.flick + b.seed) + 0.07 * Math.sin(t * 23.7 + b.seed * 0.3) + 0.05 * Math.sin(t * 3.3 + b.i)) : 0.9;
    if (sp.glow && night > 0.02) {
      c.globalAlpha = night * fl * fade; c.drawImage(sp.glow, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr);
      if (env.tier !== 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * night * fl * fade; c.drawImage(sp.glow, -sp.cx / dpr, -sp.foot / dpr, sp.w / dpr, sp.h / dpr); c.globalCompositeOperation = 'source-over'; }
    }
    c.restore();
    if (sp.glow && night > 0.02) {
      // the light on the paving / the bale round it (one additive pass, as the steps')
      const g = glowSprite(), r = b.d * s * 2.0; c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.34 * night * fl * fade; c.drawImage(g, sx - r, gy - r * 0.32, r * 2, r * 0.64);
      c.globalAlpha = 0.12 * night * fl * fade; c.drawImage(g, sx - r * 0.7, sy - b.d * s * 0.42 - r * 0.9, r * 1.4, r * 1.4);
      c.globalCompositeOperation = 'source-over'; stat.bigGlows = (stat.bigGlows || 0) + 1;
    }
    c.restore();
    stat.rects.push({ id: b.spot, x: +(sx - sp.cx / dpr).toFixed(1), y: +(sy - sp.foot / dpr).toFixed(1), w: +(sp.w / dpr).toFixed(1), h: +(sp.h / dpr).toFixed(1), big: !b.decor, decor: !!b.decor });
  }
  /** the big pieces on a pass as z-sorted extras for people.js ('near': with the walkers; 'far': across the road) → [{ z, draw(c) }] */
  // 11a-2 — THE CHRISTMAS-TREE STAND (treestand.js) at the bench's left end, from Black Friday morning (env.tree: core/harbor-xmas.js,
  // latched by the scene like every big piece); its lantern's glow after dark
  function treeItems(pass, env) {
    if (pass !== 'near' || !env.L || !env.T || !(env.fade > 0)) return [];
    layout(env.L, env.dpr || 2);
    const sp = spotById(env.L, 'bench-left'); if (!sp) return [];
    const E = envLight(env), night = clamp01((E.dark - 0.25) / 0.5);
    return [{ z: sp.z, draw: c => {
      const k = `tree|${lightKey}`; let o = cache.get(k); if (!o) o = put(k, paintTreeStand(L, sp, Math.min(BAKE_CAP, env.dpr || 2), colAt(E, sp.x, sp.z, 1.0)));
      c.save(); c.globalAlpha = env.fade == null ? 1 : env.fade; c.drawImage(o.cv, o.x, o.y, o.w, o.h);
      if (night > 0.02) { const g = glowSprite(), r = 0.9 * o.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * night * (env.power == null ? 1 : env.power) * (env.fade == null ? 1 : env.fade); c.drawImage(g, o.lantern[0] - r, o.lantern[1] - r, r * 2, r * 2); }
      // (its rect replaces last frame's: on a day with no holiday the ground pass never resets the list)
      c.restore(); stat.rects = stat.rects.filter(q => q.id !== 'treestand'); stat.rects.push({ id: 'treestand', x: +o.x.toFixed(1), y: +o.y.toFixed(1), w: +o.w.toFixed(1), h: +o.h.toFixed(1), big: true });
    } }];
  }
  function items(pass, env) { const a = itemsHol(pass, env); return env.tree ? a.concat(treeItems(pass, env)) : a; }
  function itemsHol(pass, env) {
    const HS = env.HS, HP = env.HP;
    // (11a-2: the big pieces are LATCHED (core/harbor-holiday.js#latchBig) — they may outlive their holiday on screen until the next load)
    if (env.L && HP && (HP.harvest || HP.bales || HP.stalks || HP.mums) && env.fade > 0 && env.T) { giant.clearLight(); return tgItems(pass, env); }
    if (!env.L || !HP || !(HP.bigs || HP.giant) || !(env.fade > 0) || !env.T) { giant.clearLight(); return []; }
    layout(env.L, env.dpr || 2);
    const E = envLight(env), out = HP.bigs ? bigs.filter(b => b.pass === pass).map(b => ({ z: b.z, draw: c => drawBig(c, b, env, E) })) : [];
    // 11a-2 — THE GIANT JACK-O'-LANTERN on the inlay: one item at the inlay's centre — the ring of dancers in depth round it
    if (pass === 'near' && HP.giant && giantG) {
      const gp = HP.giant, night = clamp01((E.dark - 0.25) / 0.5);
      for (const b of decor) out.push({ z: b.z, draw: c => drawBig(c, b, env, E) });
      // (9c: floodlit at night — dimmed to a low fill once its carved fire is lit: the fire is the star)
      const fo = { cam: L.cam, m: { x: giantG.x, z: giantG.z, r: GIANT_P.body.R }, h: GIANT_P.plinth.h + GIANT_P.body.yc + GIANT_P.body.Hh, lamps: E.dark, self: gp.carved ? night : 0, t: env.t || 0, fade: env.fade, tier: env.tier, power: env.power };
      out.push({ z: giantG.z, draw: c => atCentreScale(c, L.cam, giantG.x, giantG.z, centreK(L), () => { floods.under(c, fo); giant.draw(c, { L, g: giantG, T: E.T, dark: E.dark, dpr: env.dpr || 2, carved: !!gp.carved, lit: night, bright: HS && HS.id === 'halloween' && HS.eve ? 1.3 : 1, t: env.t || 0, mo: env.motion !== false, fade: env.fade, tier: env.tier, power: env.power, lightKey }); floods.over(c, { ...fo, sprite: giant.lastSprite() }); }) });   // (PROM: today's size on the bigger compass)
    } else if (pass === 'near') giant.clearLight();
    return out;
  }

  // ---------------------------------------------------------------- 11a-2 — THANKSGIVING: the harvest display + the spot pieces
  function tgPieces(HP) { const key = `${lay}|${HP.mums}|${HP.bales ? 1 : 0}|${HP.spots}|${HP.stalks ? 1 : 0}`; if (key !== tgKey) { tgKey = key; tgList = thanksgivingSpots(L, HP); } return tgList; }
  function tgSprite(pc, E, dpr) {
    const k = `tg|${pc.id}|${tgKey}|${lightKey}`; let sp = cache.get(k); if (sp) return sp;
    sp = paintSpotPiece(L, pc, E.T, E.dark, Math.min(BAKE_CAP, dpr), { paintPumpkin, col: (x, z) => colAt(E, x, z, 1.0) });
    return sp ? put(k, sp) : null;
  }
  function drawTg(c, pc, env, E) { const sp = tgSprite(pc, E, env.dpr || 2); if (!sp) return; c.save(); c.globalAlpha = env.fade == null ? 1 : env.fade; c.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h); c.restore(); stat.rects.push({ id: `tg-${pc.id}`, x: sp.x, y: sp.y, w: sp.w, h: sp.h, tg: true }); }
  /** the November pieces on a pass as z-sorted extras (+ THE HARVEST DISPLAY on the inlay, 'near') */
  function tgItems(pass, env) {
    layout(env.L, env.dpr || 2);
    const E = envLight(env), HP = env.HP, out = [];
    for (const pc of tgPieces(HP)) if (pc.pass === pass) out.push({ z: pc.z, draw: c => drawTg(c, pc, env, E) });
    if (pass === 'near' && HP.harvest && L.medallion) { const m = L.medallion, night = clamp01((E.dark - 0.25) / 0.5);
      // (9c: floodlit at night; its own Edison bulbs make it a lit display — the floods ease to a fill as they come on)
      const fo = { cam: L.cam, m: { x: m.x, z: m.z, r: (m.r || 1.55) * 1.3 }, h: 2.2, lamps: E.dark, self: night * 0.8, t: env.t || 0, fade: env.fade, tier: env.tier, power: env.power };
      out.push({ z: m.z, draw: c => atCentreScale(c, L.cam, m.x, m.z, centreK(L), () => { floods.under(c, fo); harvest.draw(c, { L, m, T: E.T, dark: E.dark, dpr: env.dpr || 2, lightKey, col: (x, z) => colAt(E, x, z, 1.0), lit: night, power: env.power, fade: env.fade, model: !!env.propModel }); floods.over(c, { ...fo, sprite: harvest.lastSprite() }); }) }); }
    return out;
  }

  // ---------------------------------------------------------------- the marigolds (a sprite per spot / per post)
  function spotSprite(sp, E, dpr) {
    const k = `mg|${spots.indexOf(sp)}|${lightKey}`;
    let o = cache.get(k); if (o) return o;
    const s = L.cam.F / sp.z, px = s * dpr, col = colAt(E, sp.x, sp.z, 1.3), r = rngFrom(hashString(`mari|${sp.x.toFixed(2)}|${sp.z}|${sp.half || ''}|${sp.kind}`));
    const W = (sp.w * 2 + 0.8) * px, Hh = (sp.kind === 'pot' ? 1.5 : 1.0) * px, cv = mk(W, Hh), x = safeCtx(cv), cx = W / 2, foot = Hh - 2;
    const br = 0.085 * px;   // a bloom ~ 0.17 units across (exaggerated: they read as a bright mass)
    if (sp.kind === 'pot') {
      // a terracotta pot: tapered, a rolled rim, lit from the left; the blooms heaped over its rim
      const pw = sp.w * 0.62 * px, ph = 0.5 * px, top = foot - ph;
      const g = x.createLinearGradient(cx - pw, 0, cx + pw, 0); g.addColorStop(0, rgb(col([196, 104, 62]))); g.addColorStop(0.45, rgb(col([176, 84, 48]))); g.addColorStop(1, rgb(col([104, 46, 28])));
      x.fillStyle = g; x.beginPath(); x.moveTo(cx - pw * 0.78, foot); x.lineTo(cx + pw * 0.78, foot); x.lineTo(cx + pw, top + ph * 0.18); x.lineTo(cx - pw, top + ph * 0.18); x.closePath(); x.fill();
      x.fillStyle = rgb(col([206, 118, 72])); x.fillRect(cx - pw * 1.06, top, pw * 2.12, ph * 0.2);
      x.fillStyle = rgb(col([90, 40, 24]), 0.6); x.fillRect(cx - pw * 1.06, top + ph * 0.19, pw * 2.12, Math.max(0.5, ph * 0.04));
      for (let i = 0; i < 4; i++) leafy(x, cx + (r() - 0.5) * pw * 1.6, top + 2, 0.32 * px, -Math.PI / 2 + (r() - 0.5) * 2.2, col);
      for (let i = 0; i < sp.n; i++) { const a = r(), bx = cx + (a - 0.5) * pw * 2.1, by = top - br * 0.4 - Math.sin(a * Math.PI) * br * 2.2 - r() * br * 1.2; bloom(x, bx, by, br * (0.85 + r() * 0.35), MARI[Math.floor(r() * MARI.length)], col, r); }
    } else {
      // a clump / a ring half / a planter: a low mound of leaves + blooms
      const half = sp.half, n = sp.n;
      for (let i = 0; i < Math.round(n * 0.6); i++) leafy(x, cx + (r() - 0.5) * sp.w * 2 * px, foot - r() * 0.12 * px, 0.28 * px, -Math.PI / 2 + (r() - 0.5) * 2.4, col);
      const items = [];
      for (let i = 0; i < n; i++) {
        let ax, ay;
        if (sp.kind === 'ring') { const a = (half === 'back' ? Math.PI : 0) + (i + r() * 0.6) / n * Math.PI; ax = Math.cos(a) * sp.w; ay = Math.sin(a) * sp.w * 0.32; }
        else { ax = (r() - 0.5) * sp.w * 2; ay = (r() - 0.5) * sp.w * 0.4; }
        items.push([ax, ay]);
      }
      items.sort((a, b) => a[1] - b[1]);
      for (const [ax, ay] of items) bloom(x, cx + ax * px, foot - 0.16 * px + ay * px * 0.5 - r() * 0.1 * px, br * (0.85 + r() * 0.4), MARI[Math.floor(r() * MARI.length)], col, r);
    }
    return put(k, { cv, cx, foot, w: W, h: Hh });
  }
  function drawSpots(c, env, E, front, k) {
    if (k <= 0.01) return;
    const dpr = env.dpr || 2;
    for (const sp of spots) {
      if (!!sp.front !== front) continue;
      const o = spotSprite(sp, E, dpr), [sx, sy] = project(L.cam, sp.x, sp.y, sp.z);
      c.globalAlpha = k; c.drawImage(o.cv, sx - o.cx / dpr, sy - o.foot / dpr, o.w / dpr, o.h / dpr); c.globalAlpha = 1;
    }
  }
  function postSprite(p, E, dpr) {
    const k = `gl|${posts.indexOf(p)}|${lightKey}`;
    let o = cache.get(k); if (o) return o;
    const s = L.cam.F / p.z, px = s * dpr, col = colAt(E, p.x, p.z, 1.2), r = rngFrom(hashString(`garl|${p.x.toFixed(2)}|${p.z}`));
    const W = 1.0 * px, Hh = (p.h + 0.3) * px, cv = mk(W, Hh), x = safeCtx(cv), cx = W / 2, foot = Hh - 1;
    const R = (p.r || (p.kind === 'tall' ? 0.15 : 0.13)) * px, br = 0.072 * px, turns = p.turns || (p.kind === 'tall' ? 4.4 : 3.2), n = Math.round(turns * 11);
    // the garland wound up the post: a helix of blooms (the ones behind the post smaller + darker, cut by its width), a few leaves
    const pts = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1), a = u * turns * TAU, y = foot - (p.base + u * (p.h - p.base)) * px; pts.push({ x: cx + Math.sin(a) * R, y: y + Math.cos(a) * R * 0.18, front: Math.cos(a) > 0, d: Math.cos(a) }); }
    // the twine first (dark, under the blooms)
    x.strokeStyle = rgb(col([60, 70, 40]), 0.8); x.lineWidth = Math.max(0.5, 0.02 * px); x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y))); x.stroke();
    for (const q of pts.filter(q => !q.front)) { if (Math.abs(q.x - cx) < R * 0.55) continue; bloom(x, q.x, q.y, br * 0.75, mix(MARI[Math.floor(r() * MARI.length)], [80, 30, 10], 0.35), col, r); }
    for (const q of pts.filter(q => q.front)) { if (r() < 0.25) leafy(x, q.x, q.y, 0.18 * px, (r() - 0.5) * 3, col); bloom(x, q.x, q.y, br * (0.9 + 0.3 * q.d), MARI[Math.floor(r() * MARI.length)], col, r); }
    // a short hanging tail of blooms at the top (varying length)
    const top = pts[pts.length - 1];
    for (let j = 1; j < 4 + Math.floor(r() * 3); j++) bloom(x, top.x + Math.sin(j) * br * 0.4, top.y + j * br * 1.6, br * (0.9 - j * 0.08), MARI[Math.floor(r() * MARI.length)], col, r);
    return put(k, { cv, cx, foot, w: W, h: Hh });
  }
  function drawPosts(c, env, E, front, k) {
    if (k <= 0.01) return;
    const dpr = env.dpr || 2;
    for (const p of posts) {
      if (!!p.front !== front) continue;
      const o = postSprite(p, E, dpr), [sx, sy] = project(L.cam, p.x, 0, p.z);
      // (going up / coming down: the garland's height follows k — wound from the foot)
      const hh = o.h * k;
      c.drawImage(o.cv, 0, o.h - hh, o.w, hh, sx - o.cx / dpr, sy - hh / dpr, o.w / dpr, hh / dpr);
    }
  }
  // ---------------------------------------------------------------- the petal path (one sprite, the path's box)
  function pathSprite(E, dpr) {
    const k = `pp|${lightKey}`;
    let o = cache.get(k); if (o) return o;
    const pts = path.pts.map(p => { const [sx, sy] = project(L.cam, p.x, 0.01, p.z); return { ...p, sx, sy, sc: L.cam.F / p.z }; });
    const x0 = Math.min(...pts.map(p => p.sx)) - 6, x1 = Math.max(...pts.map(p => p.sx)) + 6, y0 = Math.min(...pts.map(p => p.sy)) - 4, y1 = Math.max(...pts.map(p => p.sy)) + 4;
    const cv = mk((x1 - x0) * dpr, (y1 - y0) * dpr), x = safeCtx(cv);
    x.scale(dpr, dpr); x.translate(-x0, -y0);
    const PET = [[255, 132, 10], [255, 168, 20], [246, 108, 8], [255, 190, 40], [214, 84, 6]];
    for (const p of pts) {
      const col = colAt(E, p.x, p.z, 1.3), c0 = col(PET[Math.floor(p.hue * PET.length)]), rr = p.r * p.sc;
      x.fillStyle = rgb(mix(c0, [0, 0, 0], 0.35), 0.5); x.beginPath(); x.ellipse(p.sx + rr * 0.15, p.sy + rr * 0.12, rr * 1.05, rr * 0.5, p.rot, 0, TAU); x.fill();
      x.fillStyle = rgb(c0, 0.95); x.beginPath(); x.ellipse(p.sx, p.sy, rr, rr * 0.5 * (0.6 + 0.5 * p.s), p.rot, 0, TAU); x.fill();
    }
    return put(k, { cv, x0, y0, w: x1 - x0, h: y1 - y0 });
  }

  // ---------------------------------------------------------------- the votives along the path (glass cups, a candle each)
  const GLASS = [[214, 40, 48], [236, 226, 210], [232, 150, 40]];
  function drawVotives(c, env, E, k) {
    if (k <= 0.01 || !path || !path.candles) return;
    const t = env.t || 0, mo = env.motion !== false, night = clamp01((E.dark - 0.2) / 0.5) * (env.power == null ? 1 : env.power), glows = [];
    const nOn = Math.round(path.candles.length * k);
    for (let i = path.candles.length - nOn; i < path.candles.length; i++) {
      const v = path.candles[i], s = L.cam.F / v.z, [sx, sy] = project(L.cam, v.x, 0, v.z), w = 0.21 * s, h = 0.27 * s;
      const gc = colAt(E, v.x, v.z, 1.2)(GLASS[v.glass]), lit = night > 0.02;
      c.fillStyle = 'rgba(10,6,12,0.4)'; c.beginPath(); c.ellipse(sx, sy, w * 0.7, w * 0.2, 0, 0, TAU); c.fill();
      // the cup (its glass lit from within at night), the rim, the flame
      c.fillStyle = rgb(lit ? mix(gc, mix(GLASS[v.glass], [255, 220, 150], 0.4), night) : gc, 0.92); c.fillRect(sx - w / 2, sy - h, w, h);
      c.fillStyle = rgb(mix(gc, [255, 255, 255], 0.35), 0.7); c.fillRect(sx - w / 2, sy - h, w, Math.max(0.4, h * 0.14));
      const fl = mo ? 0.85 + 0.15 * Math.sin(t * 11 + i * 2.3) + 0.08 * Math.sin(t * 27 + i) : 1, fh = h * 0.75 * fl, fx = sx + (mo ? Math.sin(t * 7 + i) * w * 0.06 : 0);
      c.fillStyle = 'rgba(255,214,120,0.95)'; c.beginPath(); c.moveTo(fx, sy - h - fh); c.quadraticCurveTo(fx + w * 0.28, sy - h - fh * 0.3, fx, sy - h + 0.2); c.quadraticCurveTo(fx - w * 0.28, sy - h - fh * 0.3, fx, sy - h - fh); c.fill();
      c.fillStyle = 'rgba(255,252,236,0.95)'; c.beginPath(); c.ellipse(fx, sy - h - fh * 0.3, w * 0.07, fh * 0.22, 0, 0, TAU); c.fill();
      if (lit) glows.push({ sx, sy: sy - h, r: 0.9 * s, k: night * fl });
    }
    if (glows.length) { const g = glowSprite(); c.save(); c.globalCompositeOperation = 'lighter'; for (const o of glows) { c.globalAlpha = 0.3 * o.k; c.drawImage(g, o.sx - o.r, o.sy - o.r * 0.6, o.r * 2, o.r * 1.2); c.globalAlpha = 0.5 * o.k; c.drawImage(g, o.sx - o.r * 0.25, o.sy - o.r * 0.3, o.r * 0.5, o.r * 0.5); } c.restore(); c.globalAlpha = 1; }
  }

  // ---------------------------------------------------------------- the papel picado
  function flagSprite(ci, pi, E, litK) {
    const q = Math.round(E.dark * 4) / 4, k = `pf|${ci}|${pi}|${q}|${litK}|${Math.round(((E.T && E.T.gold) || 0) * 4)}`;
    let o = cache.get(k); if (o) return o;
    const night = q, col = c => { let v = c; if ((E.T && E.T.gold) > 0.3) v = mix(v, [v[0] * 1.08 + 10, v[1] * 0.95, v[2] * 0.82], 0.4); if (night > 0.01) v = mix(v, [24, 20, 40], 0.78 * night); if (litK) v = mix(v, [Math.min(255, c[0] * 1.15 + 50), Math.min(255, c[1] * 1.05 + 30), Math.min(255, c[2] * 0.9 + 10)], 0.62 * night); return v; };
    return put(k, { cv: paintFlag(ci, pi, col, litK) });
  }
  function drawPapel(c, env, E, k, rail = false) {
    if (k <= 0.01 || !runs.length) return;
    const mo = env.motion !== false, t = mo ? env.t || 0 : 0, wind = mo ? (env.wind || 0) : 0, gust = mo ? (env.gust || 0) : 0, tier = env.tier == null ? 2 : env.tier;
    const wn = Math.max(-1.4, Math.min(1.4, wind / 6)), gk = clamp01((Math.abs(gust) - Math.abs(wind)) / 6 + 0.1 * Math.abs(wn));
    runs.forEach((run, ri) => {
      if (!!run.rail !== rail) return;   // (PROM: the railing's runs on the ground pass, under the traffic; the rest over the people)
      const [ax, ay] = project(L.cam, run.a.x, run.a.y, run.a.z), [bx, by] = project(L.cam, run.b.x, run.b.y, run.b.z);
      const sMid = L.cam.F / ((run.a.z + run.b.z) / 2), sag = run.sag * sMid * (0.92 + 0.08 * Math.sin(t * 0.7 + ri) * (mo ? 1 : 0));
      const at = u => [lerp(ax, bx, u), lerp(ay, by, u) + 4 * sag * u * (1 - u)];
      // how many flags are up (going up / coming down: strung from the left end)
      const nOn = Math.round(run.n * k);
      // the string (twine): dark, catching a little light at night
      c.strokeStyle = 'rgba(30,24,30,0.85)'; c.lineWidth = Math.max(0.5, 0.025 * sMid); c.beginPath();
      for (let i = 0; i <= 16; i++) { const [px, py] = at(i / 16); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      for (let i = 0; i < nOn; i++) {
        const u = (i + 0.5) / run.n, [px, py] = at(u), z = lerp(run.a.z, run.b.z, u), s = L.cam.F / z;
        const fw = 0.44 * s, fh = 0.54 * s, ci = (i + ri * 3) % TISSUE.length, pi = (i * 7 + ri) % PAT.length;
        const [nx, ny] = at(Math.min(1, u + 0.01)), slope = (ny - py) / Math.max(0.01, nx - px);
        // the flutter: the real wind lifts + swings each flag, the gusts snap them; each its own phase (a twist turns it edge-on a little)
        const ph = i * 1.73 + ri * 2.9;
        const swing = (0.28 * wn + (0.05 + 0.2 * Math.abs(wn) + 0.25 * gk) * Math.sin(t * (2.2 + 1.3 * Math.abs(wn)) + ph) + 0.06 * Math.sin(t * 5.1 + ph * 1.7) * (0.3 + gk)) * (mo ? 1 : 0.2);
        const lift = clamp01(Math.abs(wn) * 0.35 + 0.18 * gk * (0.5 + 0.5 * Math.sin(t * 3.4 + ph)));
        const twist = 0.86 + 0.14 * Math.cos(t * (1.6 + 0.6 * Math.abs(wn)) + ph * 2.3) * (mo ? 1 : 0);
        // (each flag's sprite for this light — looked up once per light key, not every frame)
        if (!run.fl || run.flKey !== lightKey) { run.flKey = lightKey; run.fl = []; }
        let fs = run.fl[i];
        if (!fs) { const lp = E.lightAt ? E.lightAt(lerp(run.a.x, run.b.x, u), z) : null, litK = lp && E.dark > 0.3 && (lp[0] + lp[1] + lp[2]) > 150 ? 1 : 0; fs = run.fl[i] = flagSprite(ci, pi, E, litK); }
        c.save(); c.translate(px, py);
        c.transform(twist, slope * twist, Math.sin(swing) * 0.9, Math.cos(swing) * (1 - 0.45 * lift), 0, 0);
        c.drawImage(fs.cv, -fw / 2, -0.06 * s, fw, fh);
        c.restore();
      }
    });
  }

  // ---------------------------------------------------------------- the monarchs
  function drawMonarch(c, env, E, m) {
    const p = monarchAt(m.n, m.u, L), s = L.cam.F / p.z, [sx, sy] = project(L.cam, p.x, p.y, p.z), t = env.t || 0;
    const span = 0.62 * s, flap = p.glide ? 0.35 + 0.1 * Math.sin(t * 3) : Math.abs(Math.sin(t * 22 + m.n));   // (the wings' open width 0..1)
    const fade = Math.min(1, m.u / 0.06, (1 - m.u) / 0.06);
    const day = clamp01(((E.T && E.T.day) || 0) + ((E.T && E.T.gold) || 0) * 0.8);
    const or = litCol([246, 132, 18], E, p.x, p.z), blk = litCol([24, 16, 14], E, p.x, p.z);
    c.save(); c.translate(sx, sy); c.scale(p.dir, 1); c.globalAlpha = fade * day;
    // the shadow on the cobbles below it (by day)
    const [, gy] = project(L.cam, p.x, 0, p.z); c.fillStyle = 'rgba(20,14,30,0.18)'; c.beginPath(); c.ellipse(0, gy - sy, span * 0.35 * (0.4 + flap), span * 0.08, 0, 0, TAU); c.fill();
    const wing = (k, up) => {
      // a forewing (rounded triangle) + a hindwing (rounder), orange with the black veins + border (a few white dots in it)
      const w = span * 0.5 * (0.25 + 0.75 * k), sgn = up;
      c.fillStyle = rgb(blk); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w * 0.55 * sgn, -span * 0.42, w * sgn, -span * 0.36); c.quadraticCurveTo(w * 1.08 * sgn, -span * 0.1, w * 0.6 * sgn, -span * 0.02); c.closePath(); c.fill();
      c.fillStyle = rgb(or); c.beginPath(); c.moveTo(w * 0.06 * sgn, -span * 0.02); c.quadraticCurveTo(w * 0.52 * sgn, -span * 0.36, w * 0.88 * sgn, -span * 0.3); c.quadraticCurveTo(w * 0.94 * sgn, -span * 0.12, w * 0.56 * sgn, -span * 0.05); c.closePath(); c.fill();
      c.fillStyle = rgb(blk); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w * 0.8 * sgn, span * 0.02, w * 0.7 * sgn, span * 0.24); c.quadraticCurveTo(w * 0.3 * sgn, span * 0.32, 0, span * 0.06); c.closePath(); c.fill();
      c.fillStyle = rgb(or); c.beginPath(); c.moveTo(w * 0.06 * sgn, span * 0.04); c.quadraticCurveTo(w * 0.66 * sgn, span * 0.05, w * 0.6 * sgn, span * 0.2); c.quadraticCurveTo(w * 0.3 * sgn, span * 0.26, w * 0.05 * sgn, span * 0.08); c.closePath(); c.fill();
      if (span > 5) { c.strokeStyle = rgb(blk, 0.8); c.lineWidth = Math.max(0.3, span * 0.025); c.beginPath(); c.moveTo(w * 0.1 * sgn, -span * 0.04); c.lineTo(w * 0.8 * sgn, -span * 0.27); c.moveTo(w * 0.1 * sgn, 0); c.lineTo(w * 0.58 * sgn, span * 0.16); c.stroke(); }
    };
    wing(flap, -1); wing(flap, 1);
    c.fillStyle = rgb(blk); c.beginPath(); c.ellipse(0, 0, span * 0.05, span * 0.2, 0.15, 0, TAU); c.fill();
    c.restore(); c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the passes
  /**
   * draw(c, pass, env): pass 'ground' | 'air' | 'top'. env = { L, HS, HP, T, dark (the lamps 0..1), t, ms, motion, tier, dpr, wind
   * (m/s, signed along the screen), gust, fade, power (the legendaries' cut 0..1), monarchAt (forced: the clock ms the flag came on) }
   */
  function draw(c, pass, env) {
    const HS = env.HS, HP = env.HP;
    if (!env.L || (!HS || !HS.id) && env.monarchAt == null) return;
    layout(env.L, env.dpr || 2);
    if (!(env.fade > 0)) return;
    const E = envLight(env), fade = env.fade;
    c.save(); c.globalAlpha = 1;
    if (fade < 1) c.globalAlpha = fade;
    const halloween = HS && HS.id === 'halloween' && HP, dotd = HS && HS.id === 'dotd' && HP;
    if (pass === 'ground') {
      stat.rects = []; stat.bigGlows = 0; stat.big = halloween && HP.bigs ? bigs.length : 0;
      if (dotd && HP.petals > 0.01 && path) { const o = pathSprite(E, env.dpr || 2); c.globalAlpha = fade * HP.petals; c.drawImage(o.cv, o.x0, o.y0, o.w, o.h); c.globalAlpha = 1; drawVotives(c, env, E, HP.petals); }
      if (dotd) { drawSpots(c, env, E, false, HP.marigolds * fade); drawPosts(c, env, E, false, HP.garlands); drawPapel(c, env, E, HP.papel, true); }
      if (halloween && HP.pumpkins && HP.pumpkins.length) drawPumpkins(c, env, E, HP.pumpkins);
    } else if (pass === 'air') {
      if (dotd) drawPapel(c, env, E, HP.papel);
    } else if (pass === 'top') {
      if (dotd) { drawSpots(c, env, E, true, HP.marigolds * fade); drawPosts(c, env, E, true, HP.garlands); }
      if (HP && HP.bigs) for (const b of bigs) if (b.pass === 'top') drawBig(c, b, env, E);   // (WIN: the front strip's big jack-o'-lantern — nearer than anyone on the floor)
      if (HP && (HP.mums || HP.stalks) && !HP.bigs) for (const pc of tgPieces(HP)) if (pc.pass === 'top') drawTg(c, pc, env, E);   // (11a-2: the front strip's November pieces)
      if (env.motion !== false && env.tier !== 0) {
        const m = monarchSlot(env.ms || Date.now(), { on: !!(dotd && HP.monarchs), forceAt: env.monarchAt });
        if (m) drawMonarch(c, env, E, m);
      }
    }
    c.restore();
  }
  return {
    draw, items,
    /** 11a-2: the giant jack-o'-lantern's light this frame (people.js lights the dancers + walkers by it) + whether it stands */
    giantLight: () => giant.pointLight(),
    giantOn: (HS, HP) => !!(HP && (HP.giant || HP.harvest)),   // (a centrepiece the hourly dance RINGS: the giant pumpkin, the harvest display)
    // (C4d: the harvest model's load state → the scene's LOAD LOG; the watcher leaves with these props — a module-level watcher kept every
    // old scene alive: +125 MB over the perf group's 20 title ↔ setup cycles)
    onHarvestModel: fn => { const off = onHarvestModel(fn); unwatch.push(off); return off; },
    debug: () => ({ giant: giant.debug(), harvest: harvest.debug(), floods: floods.debug(), tg: tgList.map(p => p.id), stat: { ...stat, rects: (stat.rects || []).slice() }, bigs: bigs.map(b => ({ spot: b.spot, pass: b.pass, d: b.d })), slots: slots.length, spots: spots.length, posts: posts.length, runs: runs.map(r => r.n), petals: path ? path.pts.length : 0, sprites: cache.size }),
    destroy() { for (const v of cache.values()) if (v && v.cv) v.cv.width = v.cv.height = 0; cache.clear(); giant.destroy(); harvest.destroy(); for (const off of unwatch.splice(0)) off(); },
  };
}
