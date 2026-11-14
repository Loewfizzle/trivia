// PRISM DROP — THE WATERCOLOR SKIN's DRAWINGS (SKINS 1; REWORKED in SKINS 2A — the owner via the city chat, Nov 14: "it read too close to
// crayon at 390" — docs/games/plan.md "SKINS 2A"; docs/prism.md "THE SKINS").
// Every piece of paint is PRE-DRAWN ONCE into a cached sprite at the board's full pixel ratio (3× on an iPhone) — the frame loop only blits.
//   THE BLOCK — WATERCOLOR, NOT CRAYON: NO DARK OUTLINE. Two TRANSPARENT washes of the piece's colour on a wobbly soft-cornered square (never a
//   perfect rect, never a round blob); a LIGHTER MIDDLE where the paper shows through (the wash lifted there + the paper's tooth); the pigment
//   POOLED darker at the edge — a SOFT BAND in the colour's own deeper shade that thickens unevenly (never a line); an uneven, BLOTCHY wash
//   (soft lighter + darker patches); 2 of the 6 variants carry a BLOOM (a cauliflower back-run: a paler patch inside a crinkled, scalloped
//   edge of pushed pigment). SIX variants a colour. The sprite keeps its translucency — the paper shows THROUGH the paint. Junk = a neutral
//   grey wash.
//   + THE BLEED (seamSprite — where two DIFFERENT colours touch in the stack, a soft patch of the two paints run together across the seam;
//   painted once into the board's cached stack layer — skins.js#seams — never per frame, no blur), the landing ghost (a faint WASH outline in
//   the piece's own colour — no dark line), the danger drain (the block in grey), the INCOMING rows' grey wash, the wet sheen (a lock), the
//   drip (a clear's run — KEPT), the droplet (a splash, a cancel), the bloom (4 LINES — a wet wash spreading behind the stack).
//   waterSprite(size, kind, t, v) · seamSprite(size, a, b, flat) · dripSprite(w, color) · dropSprite(size, color) · bloomSprite(size, colors) ·
//   warmWater(size, ms) · clearWater()
import { mixHex } from './neon.js';
import { seeded, spriteCache, newCanvas, rgba } from './skin-kit.js';

export const VARIANTS = 6;
// the paints: 1 long (turquoise) · 2 square (yellow) · 3 twist (violet) · 4 S (green) · 5 Z (red) · 6 J (blue) · 7 L (orange) · 8 junk (a neutral grey)
// — the SAME colour families as every skin (tests/prism-skins.test.mjs: the hue within its JEWEL family)
export const WATER = Object.freeze([null, '#19b3c8', '#f2b61e', '#8f5bd9', '#2faa5e', '#e23f5a', '#3a6fd8', '#f2812a', '#878b95']);
const DEEP = '#1c1638';
/** the paint's darkest shade (a drip's bead, a droplet's edge, the wet sheen) */
export const rimOf = hex => mixHex(hex, DEEP, 0.46);
export const WATER_RIM = Object.freeze(WATER.map(c => (c ? rimOf(c) : c)));
/** where the pigment POOLED as the wash dried: the colour's own deeper shade — still clearly the colour (never a dark line) */
export const poolOf = hex => mixHex(hex, DEEP, 0.3);
export const WATER_POOL = Object.freeze(WATER.map(c => (c ? poolOf(c) : c)));
/** a paint's NEIGHBOURS on the palette (wet-in-wet: a blotch of a close hue ran into the wash) — each stays inside the piece's own colour
 *  family (a blotch is mixed ≤ 35 % toward one, over a part of the tile) */
export const WATER_NEAR = Object.freeze([null, ['#2f8fd6', '#2fc79a'], ['#f29a1e', '#f4d23a'], ['#b85ad6', '#6a6fe6'], ['#1fa38e', '#57b84f'], ['#f0603a', '#d93f8a'], ['#6a55d8', '#2f9fe0'], ['#ea5a3a', '#f2ac2a'], ['#7a8496', '#958d88']]);
/** the variants that carry a BLOOM (a cauliflower back-run): 2 of the 6 — a strong one + a faint one (≈ 1 tile in 4 shows one at a glance) */
export const BLOOMS = Object.freeze({ 1: 1, 4: 0.55 });
export const PENCIL = '#5b6272';   // the ghost's outline, the grid, the warning marks
export const WASH = '#8d919b';     // the incoming rows' grey wash

const cache = spriteCache();

/** a wobbly soft-cornered SQUARE (a squircle with a hand's wobble) as a closed smooth path: centre, half-size, wobble (a share of half) */
function squircle(x, cx, cy, half, rnd, wob = 0.03, e = 5.2) {
  const n = 36, ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const k = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s), e), -1 / e);
    const w = 1 + wob * (Math.sin(a * 2 + ph[0]) * 0.5 + Math.sin(a * 3 + ph[1]) * 0.35 + Math.sin(a * 5 + ph[2]) * 0.25);
    pts.push([cx + c * half * k * w, cy + s * half * k * w]);
  }
  x.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  x.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); x.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  x.closePath();
}

// ---- the paper's TOOTH through the paint (granulation): a small tile of soft speckle, punched out of a sprite at low strength
let grainC = null;
function grainTile() {
  if (grainC) return grainC;
  const n = 96, r = seeded(4177);
  grainC = newCanvas(n);
  const x = grainC.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  // two octaves of value noise → soft pits (alpha = how much paint the paper's valleys didn't take)
  const grid = cell => { const m = Math.ceil(n / cell) + 2, g = new Float32Array(m * m); for (let i = 0; i < g.length; i++) g[i] = r(); return (px, py) => { const fx = px / cell, fy = py / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = g[iy * m + ix], b = g[iy * m + ix + 1], c = g[(iy + 1) * m + ix], e = g[(iy + 1) * m + ix + 1], sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return a + (b - a) * sx + (c - a) * sy + (a - b - c + e) * sx * sy; }; };
  const g1 = grid(3.2), g2 = grid(9);
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
    const v = g1(xx, y) * 0.65 + g2(xx, y) * 0.35;
    const a = Math.max(0, v - 0.52) / 0.48;
    d[(y * n + xx) * 4 + 3] = Math.round(255 * a * a);
  }
  x.putImageData(img, 0, 0);
  return grainC;
}
function punchGrain(x, size, strength, seed) {
  const g = grainTile();
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = strength;
  const k = Math.max(1, size / 60);   // (the speckle keeps its size on the page, whatever the cell)
  const ox = (seed * 37) % g.width, oy = (seed * 53) % g.height;
  x.setTransform(k, 0, 0, k, -ox * k, -oy * k);
  x.fillStyle = x.createPattern(g, 'repeat');
  x.fillRect(ox, oy, size / k + 1, size / k + 1);
  x.restore();
}

/** a BLOOM's edge: a crinkled, scalloped blob (a cauliflower back-run — uneven lobes, never a stamped flower) as a closed path */
function cauliflower(x, bx, by, R, rnd) {
  const lobes = 5 + Math.floor(rnd() * 3), n = 84, p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28, sq = 0.7 + rnd() * 0.45, rot = rnd() * 3.14;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  x.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = R * (0.7 + 0.3 * Math.pow(Math.abs(Math.sin(a * lobes / 2 + p1)), 0.7)) * (1 + 0.24 * Math.sin(a + p2) + 0.12 * Math.sin(a * 3 + p3));
    const ux = Math.cos(a) * r, uy = Math.sin(a) * r * sq;
    const px = bx + ux * cr - uy * sr, py = by + ux * sr + uy * cr;
    if (i) x.lineTo(px, py); else x.moveTo(px, py);
  }
  x.closePath();
}

/**
 * THE BLOCK (SKINS 2A): transparent washes, a lighter middle, the pigment pooled at the edge as a soft band, blotches, the tooth, sometimes a
 * bloom — and NO outline. col = the paint, pool = its deeper shade. o: { junk, grey, thin (the incoming rows' flat wash), hot }
 */
function blockArt(size, col, pool, v, o = {}) {
  const c = newCanvas(size), x = c.getContext('2d');
  const hue = Math.round(parseInt(col.slice(1), 16) % 997);
  const rnd = seeded(v * 7919 + 13 + (o.junk ? 71 : 0) + hue);
  const cx = size / 2, cy = size / 2, half = size * 0.478;
  // (a brushed SQUARE: nearly square, soft corners, a hand's wobble — it fills its cell, so neighbours' washes meet)
  const shape = (k = 1) => squircle(x, cx, cy, half * k, seeded(v * 131 + 5), 0.028, 8.5);
  const near = o.near || null;
  // THE WASH: one transparent pass of the paint (the paper shows through all of it)
  shape();
  x.fillStyle = rgba(mixHex(col, '#ffffff', 0.06), o.thin ? 0.32 : 0.7);
  x.fill();
  x.save();
  shape();
  x.clip();
  x.globalCompositeOperation = 'source-atop';
  // UNEVEN + BLOTCHY: wet-in-wet patches — a second pass that went on heavier here, a close hue that ran in there, a few deeper spots where
  // the pigment settled (soft patches, each a different size — never a shaded ball)
  const patch = (px, py, rr, color, a) => { const g = x.createRadialGradient(px, py, rr * 0.15, px, py, rr); g.addColorStop(0, rgba(color, a)); g.addColorStop(0.6, rgba(color, a * 0.6)); g.addColorStop(1, rgba(color, 0)); x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); };
  const spots = o.thin ? 3 : 7;
  for (let i = 0; i < spots; i++) {
    const px = size * (0.1 + rnd() * 0.8), py = size * (0.1 + rnd() * 0.8), rr = size * (0.16 + rnd() * 0.22), pick = rnd();
    if (near && pick < 0.36) patch(px, py, rr, mixHex(col, near[i % 2], 0.6), 0.34);
    else if (pick < 0.7) patch(px, py, rr, col, o.thin ? 0.14 : 0.32);
    else patch(px, py, rr * 0.8, pool, o.thin ? 0.08 : 0.2);
  }
  // THE POOLING: the pigment gathered at the edge as the wash dried — a SOFT BAND in the colour's own deeper shade, deepening to the edge
  // (wide faint passes under narrow ones: a gradient, never a line)…
  shape();
  for (const [w, a] of [[0.24, 0.08], [0.15, 0.13], [0.09, 0.19], [0.05, 0.24]]) {
    x.lineWidth = size * w;
    x.strokeStyle = rgba(pool, o.thin ? a * 0.6 : a);
    x.stroke();
  }
  // …unevenly: it pooled much more along two or three stretches of the edge (the low side of a tilted sheet)
  const a0 = rnd() * 6.28;
  for (let i = 0; i < 3; i++) {
    const a = a0 + i * (1.6 + rnd() * 1.1), px = cx + Math.cos(a) * half * 0.96, py = cy + Math.sin(a) * half * 0.96;
    patch(px, py, size * (0.2 + rnd() * 0.14), pool, o.thin ? 0.16 : 0.36);
  }
  // THE LIGHTER MIDDLE: the wash is thinnest inside — the paper comes through (the paint itself goes; never a white highlight). Two or three
  // off-centre lifts, so the middle is uneven too
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const px = cx + (rnd() - 0.5) * size * 0.36, py = cy + (rnd() - 0.5) * size * 0.36, rr = size * (0.2 + rnd() * 0.16);
    const l = x.createRadialGradient(px, py, 0, px, py, rr);
    l.addColorStop(0, `rgba(0,0,0,${o.thin ? 0.1 : 0.2})`);
    l.addColorStop(0.6, `rgba(0,0,0,${o.thin ? 0.05 : 0.09})`);
    l.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = l;
    x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  // A BLOOM (2 variants of 6): water ran back into the drying wash — a paler patch, its pigment pushed out into a crinkled, scalloped edge
  // (most of them reach the tile's edge: only a part of the bloom shows)
  const bloom = !o.thin && !o.grey ? BLOOMS[v] || 0 : 0;
  if (bloom) {
    const br = seeded(v * 577 + 9 + (hue % 89));
    const ba = br() * 6.28, bd = half * (0.45 + br() * 0.4), bx = cx + Math.cos(ba) * bd, by = cy + Math.sin(ba) * bd, R = size * (0.26 + br() * 0.1);
    const seed = Math.round(br() * 1e6);
    cauliflower(x, bx, by, R, seeded(seed));
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = `rgba(0,0,0,${0.26 * bloom})`;
    x.fill();
    x.globalCompositeOperation = 'source-atop';
    cauliflower(x, bx, by, R, seeded(seed));
    x.lineJoin = 'round';
    x.lineWidth = size * 0.09; x.strokeStyle = rgba(pool, 0.12 * bloom); x.stroke();     // (the pushed pigment: a soft halo…)
    x.lineWidth = size * 0.03; x.strokeStyle = rgba(pool, 0.42 * bloom); x.stroke();     // (…gathered in the crinkled edge)
  }
  x.restore();
  // the tooth: the paper's valleys the paint skipped (granulation)
  x.globalCompositeOperation = 'source-over';
  punchGrain(x, size, o.thin ? 0.34 : 0.4, v * 3 + 1);
  if (o.hot) {
    // a due row: the wash still wet — its edge pooled much deeper all round (a band, not a line)
    x.save();
    shape(); x.clip(); shape();
    x.globalCompositeOperation = 'source-atop';
    for (const [w, a] of [[0.2, 0.2], [0.1, 0.34]]) { x.lineWidth = size * w; x.strokeStyle = rgba(pool, a); x.stroke(); }
    x.restore();
  }
  return c;
}

/** where the falling piece lands: a faint WASH outline in the piece's own colour — a ring of thin paint, the paper clear inside (no dark line) */
function ghostArt(size, col, pool) {
  const c = newCanvas(size), x = c.getContext('2d'), cx = size / 2, cy = size / 2, half = size * 0.44;
  squircle(x, cx, cy, half, seeded(77), 0.03, 8.5);
  x.fillStyle = rgba(col, 0.09);
  x.fill();
  x.save();
  squircle(x, cx, cy, half, seeded(77), 0.03, 8.5);
  x.clip();
  squircle(x, cx, cy, half, seeded(77), 0.03, 8.5);
  for (const [w, a] of [[0.3, 0.14], [0.2, 0.2], [0.11, 0.26]]) { x.lineWidth = size * w; x.strokeStyle = rgba(mixHex(col, pool, 0.35), a); x.stroke(); }
  x.restore();
  punchGrain(x, size, 0.3, 11);
  return c;
}
/** the wet sheen of a block that just set: a soft darker wash over the cell, fading as it dries (waterfx.js) */
function wetArt(size, rim) {
  const c = newCanvas(size), x = c.getContext('2d');
  squircle(x, size / 2, size / 2, size * 0.45, seeded(9), 0.02);
  const g = x.createRadialGradient(size / 2, size * 0.55, size * 0.05, size / 2, size / 2, size * 0.6);
  g.addColorStop(0, rgba(rim, 0.5));
  g.addColorStop(1, rgba(rim, 0.15));
  x.fillStyle = g;
  x.fill();
  return c;
}

const greyOf = h => { const n = parseInt(h.slice(1), 16); const l = Math.round(((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.55 + (n & 255) * 0.15) * 0.6 + 78); const z = Math.max(0, Math.min(255, l)).toString(16).padStart(2, '0'); return `#${z}${z}${z}`; };

/** a watercolor sprite (cached): kind block | grey | ghost | wet | incoming | ihot; t = the piece (1–7, 8 junk); v = the variant (0–5) */
export function waterSprite(size, kind, t, v = 0) {
  const vv = kind === 'block' ? v % VARIANTS : 0;
  return cache.get(`${size}|${kind}|${t}|${vv}`, () => {
    const col = WATER[t] || WATER[8], rim = WATER_RIM[t] || WATER_RIM[8], pool = WATER_POOL[t] || WATER_POOL[8];
    if (kind === 'block') return blockArt(size, col, pool, vv, { junk: t === 8, near: WATER_NEAR[t] || null });
    if (kind === 'grey') { const g = greyOf(col); return blockArt(size, g, poolOf(g), 2, { junk: true, grey: true }); }
    if (kind === 'ghost') return ghostArt(size, col, pool);
    if (kind === 'wet') return wetArt(size, rim);
    if (kind === 'incoming' || kind === 'ihot') return blockArt(size, WASH, poolOf(WASH), kind === 'ihot' ? 2 : 3, { thin: true, hot: kind === 'ihot' });
    return blockArt(size, col, pool, 0);
  });
}

/**
 * THE BLEED (SKINS 2A): where two DIFFERENT paints touch, a little of each ran into the other — a soft patch across the seam, colour `a` on
 * one side shading into `b` on the other, its edge feathered (two overlapping soft pools — gradients, no blur). flat = the seam lies
 * horizontally (a block on top of another: a = the upper one); else the two sit side by side (a = the left one). k = which of 3 shapes.
 * The sprite is 0.62 × 0.8 of a cell, centred on the seam.
 */
export function seamSprite(size, a, b, flat = false, k = 0) {
  const A = WATER[a] || WATER[8], B = WATER[b] || WATER[8];
  return cache.get(`seam|${size}|${a}|${b}|${flat ? 1 : 0}|${k % 3}`, () => {
    const across = Math.max(4, Math.round(size * 0.62)), along = Math.max(4, Math.round(size * 0.8));
    const c = flat ? newCanvas(along, across) : newCanvas(across, along), x = c.getContext('2d'), r = seeded(a * 31 + b * 7 + (k % 3) * 101 + (flat ? 3 : 0));
    // the two paints, run together across the seam
    const g = flat ? x.createLinearGradient(0, 0, 0, across) : x.createLinearGradient(0, 0, across, 0);
    g.addColorStop(0, rgba(A, 0)); g.addColorStop(0.3, rgba(A, 0.7)); g.addColorStop(0.5, rgba(mixHex(A, B, 0.5), 0.8)); g.addColorStop(0.7, rgba(B, 0.7)); g.addColorStop(1, rgba(B, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    // …kept only inside two soft pools on the seam (the feathered edge)
    const m = newCanvas(c.width, c.height), mx = m.getContext('2d');
    for (let i = 0; i < 2; i++) {
      const t = 0.32 + r() * 0.36 + (i ? (r() - 0.5) * 0.3 : 0), rad = along * (0.26 + r() * 0.12);
      const px = flat ? along * t : across / 2 + (r() - 0.5) * across * 0.12, py = flat ? across / 2 + (r() - 0.5) * across * 0.12 : along * t;
      const mg = mx.createRadialGradient(px, py, 0, px, py, rad);
      mg.addColorStop(0, 'rgba(0,0,0,0.95)'); mg.addColorStop(0.55, 'rgba(0,0,0,0.6)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      mx.save();
      mx.translate(px, py); mx.scale(flat ? 1 : 0.62, flat ? 0.62 : 1); mx.translate(-px, -py);   // (a pool is longer along the seam)
      mx.fillStyle = mg; mx.fillRect(px - rad * 2, py - rad * 2, rad * 4, rad * 4);
      mx.restore();
    }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(m, 0, 0);
    m.width = 0; m.height = 0;
    return c;
  });
}
/** PURE: does the seam between a cell and its neighbour bleed? ≈ 3 seams in 5, by place (the same on every phone) → 0 (no) or 1–3 (its shape) */
export function seamAt(x, y, flat) {
  const h = ((x * 73856093) ^ (y * 19349663) ^ (flat ? 83492791 : 0)) >>> 0;
  return h % 5 < 3 ? 1 + (h >>> 3) % 3 : 0;
}

/** a DRIP (a clear's paint running): a thin trail down to a darker bead — drawn stretched to its length (w = its width in px) */
export function dripSprite(w, color) {
  w = Math.max(3, Math.round(w));
  return cache.get(`drip|${w}|${color}`, () => {
    const h = w * 6, c = newCanvas(w, h), x = c.getContext('2d'), rim = rimOf(color);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.3, rgba(color, 0.6));
    g.addColorStop(0.75, rgba(color, 0.88));
    g.addColorStop(1, rgba(rim, 0.95));
    x.fillStyle = g;
    // the trail narrows to the top; the bead at the foot is round
    x.beginPath();
    x.moveTo(w * 0.42, 0);
    x.bezierCurveTo(w * 0.36, h * 0.5, w * 0.08, h * 0.74, w * 0.08, h - w * 0.5);
    x.arc(w / 2, h - w * 0.5, w * 0.42, Math.PI, 0, true);
    x.bezierCurveTo(w * 0.92, h * 0.74, w * 0.64, h * 0.5, w * 0.58, 0);
    x.closePath();
    x.fill();
    // the bead's wet glint
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.beginPath(); x.ellipse(w * 0.4, h - w * 0.62, w * 0.1, w * 0.16, -0.4, 0, Math.PI * 2); x.fill();
    return c;
  });
}
/** a DROPLET (a splash at a slam's foot, a cancelled row's wash coming off): a small soft round bead */
export function dropSprite(size, color) {
  size = Math.max(3, Math.round(size));
  return cache.get(`drop|${size}|${color}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), r = size / 2;
    const g = x.createRadialGradient(r * 0.8, r * 0.8, 0, r, r, r);
    g.addColorStop(0, rgba(mixHex(color, '#ffffff', 0.25), 0.85));
    g.addColorStop(0.7, rgba(color, 0.75));
    g.addColorStop(1, rgba(rimOf(color), 0));
    x.fillStyle = g;
    x.beginPath(); x.arc(r, r, r, 0, Math.PI * 2); x.fill();
    return c;
  });
}
/** THE BLOOM (4 LINES / a perfect clear): a big wet wash spreading on the page — soft-edged pools of two or three paints, a dried rim */
export function bloomSprite(size, colors) {
  size = Math.round(size);
  return cache.get(`bloom|${size}|${colors.join('')}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), r = seeded(colors.length * 17 + 3);
    colors.forEach((col, i) => {
      const a = (i / colors.length) * Math.PI * 2 + r() * 0.8, d = size * 0.13;
      const cx = size / 2 + Math.cos(a) * d, cy = size / 2 + Math.sin(a) * d, rad = size * (0.3 + r() * 0.06);
      const g = x.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad);
      g.addColorStop(0, rgba(col, 0.3));
      g.addColorStop(0.7, rgba(col, 0.24));
      g.addColorStop(0.88, rgba(col, 0.3));   // (the dried rim: pigment carried to the wash's edge)
      g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);
    });
    punchGrain(x, size, 0.25, 5);
    return c;
  });
}

/** warm the blocks for a size in slices (≤ budgetMs a call): true once every colour × variant + the ghost + the drain + the rows are drawn */
export function warmWater(size, budgetMs = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) {
    for (let v = 0; v < VARIANTS; v++) if (!cache.has(`${size}|block|${t}|${v}`)) { waterSprite(size, 'block', t, v); if (performance.now() - t0 > budgetMs) return false; }
    for (const k of ['grey', 'wet', 'ghost']) if (!cache.has(`${size}|${k}|${t}|0`)) { waterSprite(size, k, t); if (performance.now() - t0 > budgetMs) return false; }
  }
  for (const k of ['incoming', 'ihot']) if (!cache.has(`${size}|${k}|0|0`)) waterSprite(size, k, 0);
  return true;
}
export const clearWater = () => { cache.clear(); if (grainC) { grainC.width = 0; grainC.height = 0; grainC = null; } };
export const waterCount = () => cache.size;
