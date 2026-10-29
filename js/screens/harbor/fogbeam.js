// CITY 2.0 — THE HARBOR, POLISH 4: A BEAM IN FOG, VOLUMETRIC (the owner's 6b note 7: the lighthouse beam in fog — + the searchlights + the
// party's sky beams — "still read as weird FLAT 2D beams"). WHY THEY READ FLAT (the diagnosis): each beam was a polygon (a wedge) filled
// with a gradient ALONG its axis only — the same brightness straight across it, so it had hard straight edges and no body; its light fell
// off linearly to a cut end; layered wedges only stepped those edges; and nothing in it moved but the beam itself, so it read as a sheet
// of paper swinging round. A beam in fog is light SCATTERED BY THE AIR: brightest down its axis and melting into the murk at its sides
// (a gaussian, never an edge), dimming EXPONENTIALLY with distance (the denser the fog, the shorter it reaches), widening as it goes, a
// big glow round the lamp, and lumpy — the fog's own thicker patches light up as the beam sweeps through them.
//   drawFogBeam   the body: ONE baked white sprite (gaussian across × exponential along × faint density streaks), tinted per colour
//                 (cached), mapped onto any cone by an affine transform (the lamp, the axis, the far half-width) — a lighthouse fan in
//                 perspective, a searchlight's sweep, a sky beam straight up — + a touch of white down its core
//   fogPatches    the fog's patches lit where the beam passes: a few soft glows along its axis, each brightening + fading with a slow
//                 drifting density field (in SCREEN space: the fog stands still, the beam sweeps through it)
//   fogGlow       the big soft glow round the lamp (the light scattered all round it)
// Each a handful of drawImage calls a beam — cheaper than the layered wedges it replaces.
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** the sprite: AL along (the lamp at x 0 → the far end at AL), AC across; it spans ±SPAN of the cone's far half-width across */
const AL = 256, AC = 64, SPAN = 1.7;
/** how fast it dims along its length (exp(−ATT·v)): at its far end ~7 % of the light at the lamp */
const FOG_ATT = 2.7;

let base = null;
const tints = new Map(), glows = new Map();
function baseSprite() {
  if (base) return base;
  base = mk(AL, AC);
  const x = safeCtx(base), img = x.createImageData(AL, AC), D = img.data;
  for (let i = 0; i < AL; i++) {
    const v = i / (AL - 1);
    const w = 0.05 + 0.95 * v;                                            // (the cone: its half-width at v, of the far end's)
    const att = Math.exp(-FOG_ATT * v) * (0.55 + 0.45 * Math.min(1, v * 30)) * (0.5 + 0.5 * (1 - v));
    for (let j = 0; j < AC; j++) {
      const d = Math.abs(j + 0.5 - AC / 2) / (AC / 2) * SPAN, q = d / w;
      const soft = Math.exp(-q * q * 2.1), core = Math.exp(-q * q * 16) * 0.5;
      // (faint density streaks down its length: the fog's body — never a pattern you'd notice, only that it isn't a flat sheet)
      const streak = 0.84 + 0.16 * (0.5 + 0.5 * Math.sin(v * 21 + Math.sin(d * 5.3 + v * 3) * 2.2)) * (0.5 + 0.5 * Math.sin(v * 7.3 - d * 2.1));
      const a = clamp01((soft * 0.78 + core) * att * streak * 1.25);
      const o = (j * AL + i) * 4; D[o] = 255; D[o + 1] = 255; D[o + 2] = 255; D[o + 3] = Math.round(a * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return base;
}
function tinted(col) {
  const key = col.map(v => Math.round(v / 8) * 8).join(',');
  let cv = tints.get(key);
  if (!cv) {
    if (tints.size > 24) { const [k0, c0] = tints.entries().next().value; c0.width = 0; tints.delete(k0); }
    cv = mk(AL, AC); const x = safeCtx(cv);
    x.drawImage(baseSprite(), 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${key})`; x.fillRect(0, 0, AL, AC);
    tints.set(key, cv);
  }
  return cv;
}
function glowOf(col) {
  const key = col.map(v => Math.round(v / 8) * 8).join(',');
  let cv = glows.get(key);
  if (!cv) {
    if (glows.size > 24) { const [k0, c0] = glows.entries().next().value; c0.width = 0; glows.delete(k0); }
    cv = mk(64, 64); const x = safeCtx(cv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${key},1)`); g.addColorStop(0.3, `rgba(${key},0.42)`); g.addColorStop(0.65, `rgba(${key},0.1)`); g.addColorStop(1, `rgba(${key},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glows.set(key, cv);
  }
  return cv;
}

/**
 * THE BODY of a beam in fog (the context already 'lighter'): from the lamp (x0, y0) along (ax, ay) — the axis to its far end (its whole
 * length) — with (bx, by) its HALF-WIDTH vector at that far end (perpendicular-ish to the axis; any skew: a fan in perspective);
 * col [r, g, b], a its strength (0..1), core (0..1) the white-hot share down its axis.
 */
export function drawFogBeam(c, x0, y0, ax, ay, bx, by, col, a, core = 0.25) {
  if (a <= 0.004) return;
  c.save();
  c.transform(ax, ay, bx, by, x0, y0);
  c.globalAlpha = Math.min(1, a); c.drawImage(tinted(col), 0, -SPAN, 1, SPAN * 2);
  if (core > 0.01) { c.globalAlpha = Math.min(1, a * core); c.drawImage(baseSprite(), 0, -SPAN * 0.5, 0.75, SPAN); }
  c.restore();
}

/**
 * THE FOG'S PATCHES lit where the beam passes: n soft glows along its axis (the lamp (x0, y0), the axis (ax, ay), its far half-width
 * hw pt), each as bright as the fog is thick there — a slow drifting density field in screen space — and dimming with distance like
 * the beam. t: s (the drift; 0 = still).
 */
export function fogPatches(c, x0, y0, ax, ay, hw, col, a, t = 0, n = 5) {
  if (a <= 0.004) return;
  const g = glowOf(col);
  for (let i = 0; i < n; i++) {
    const f = 0.1 + 0.75 * (i + 0.5) / n, px = x0 + ax * f, py = y0 + ay * f;
    const den = 0.5 + 0.5 * Math.sin(px * 0.031 + t * 0.21 + i * 1.7) * Math.sin(py * 0.043 - t * 0.16 + i * 0.6);
    const r = hw * (0.15 + 0.95 * f) + 6;
    c.globalAlpha = Math.min(1, a * Math.exp(-FOG_ATT * f) * (0.1 + 0.55 * den * den));
    c.drawImage(g, px - r, py - r * 0.8, r * 2, r * 1.6);
  }
}

/** the big soft glow round a lamp in fog (the light scattered all round it): r pt, a 0..1 */
export function fogGlow(c, x, y, r, col, a) {
  if (a <= 0.004 || r <= 0.5) return;
  c.globalAlpha = Math.min(1, a); c.drawImage(glowOf(col), x - r, y - r, r * 2, r * 2);
}

