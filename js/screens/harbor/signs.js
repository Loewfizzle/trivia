// CITY 2.0 — THE HARBOR, Part 3: THE SIGNS, built like real sign-shop neon (docs/harbor.md#signs). Each sign is a few sprites:
//   the HOUSING (per look: the cabinet with its depth, enamel and trim, brackets to the wall or a scaffold to the roof, the
//   unlit glass tubes — by day weathered paint, sunlit glass, a cast shadow; at night a dark cabinet) and its LIT PARTS (the
//   border tube, the game's mark, the name — each its own sprite so they buzz on one by one), drawn additively with the power.
//   Types: vbox (vertical: the name stacked, the mark on top) · box (horizontal) · icon (the game's tube mark on a raceway) ·
//   script (open tube letters on a raceway; JAZZ used it until NEON PASS 4) · billboard (a painted 1920s board, gooseneck lamps lighting it at night).
// The games' marks + the tube alphabet are district/marks.js (the same marks as City 1.0's signs and the tube logos).
import { MARKS, LETTERS, markFor, bladeWord, hexRgb } from '../district/marks.js';
import { flattenPath, signSpots } from '../../core/harbor-neon.js';
import { tube, drawLit, drawGlass, sprite, bbox, mix, rgba } from './tubes.js';
import { safeCtx } from '../../ui/canvas-safe.js';

/** each game's sign colour (its accent; the same as the title's game tiles) */
export const SIGN_ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
/**
 * THE NAME A SIGN SPELLS (DT1 — the owner: "never a shortened name anywhere"): the game's city name, whole — the two-word ones
 * with both words (HIGH STAKES, DOUBLE AGENT, NEON PAR: never "STAKES" or "AGENT"); the others their one-word sign name (the
 * marks' blade word: SIGNAL, CIPHER, BLUFF, PRISM — the city's names the owner lists as one-word). A new game without a mark:
 * its name, spaces kept. Where it may hang: core/harbor-neon.js#fitsSpot (the slot rule).
 */
export const SIGN_NAMES = Object.freeze({ stakes: 'HIGH STAKES', agent: 'DOUBLE AGENT', golf: 'NEON PAR' });
export const signName = g => SIGN_NAMES[g.id] || (MARKS[g.id] ? bladeWord(g) : String(g.name || g.id).toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim());
const accOf = g => hexRgb(SIGN_ACC[g.id] || (markFor(g).tubes[0] || {}).col || '#9fd8ff');
const ICE = [214, 240, 255];

// ------------------------------------------------------------------ THE DAY FACES (THE DAY PASS)
// Real neon is nearly invisible in sunlight, so a real sign is built to read UNLIT: an enamelled / hand-painted board with bold
// solid letters, the glass tubes riding on top. VINTAGE 1920s (the owner's call): theatre-sign enamel, warm and a little
// sun-faded, the letters edged in GOLD LEAF (or a dark keyline on a light board) with a drop shadow. Each game its own scheme
// from its colours: face (the board), ink (the letters + the mark), edge (the keyline round them), band (the border stripe).
// The letters are the tube alphabet's own strokes, painted thick right under the tubes — the same word by day and by night.
const GOLD_LEAF = [214, 172, 86], KEY_DARK = [38, 26, 30];
export const DAY_PAINT = {
  signal: { face: [150, 30, 40], ink: [248, 234, 206], edge: GOLD_LEAF },              // cream on deep red
  stakes: { face: [28, 24, 28], ink: [236, 194, 96], edge: [128, 88, 34] },            // gold on black
  agent: { face: [26, 40, 88], ink: [244, 238, 222], edge: GOLD_LEAF },                // white on navy
  bluff: { face: [238, 224, 192], ink: [172, 34, 40], edge: KEY_DARK },                // red on cream
  cipher: { face: [22, 84, 60], ink: [244, 232, 198], edge: GOLD_LEAF },               // cream on bottle green
  pulse: { face: [70, 34, 100], ink: [244, 208, 120], edge: [250, 236, 206] },         // gold on plum
  prism: { face: [28, 88, 126], ink: [246, 240, 222], edge: GOLD_LEAF },               // white on peacock blue
  golf: { face: [16, 98, 92], ink: [248, 236, 204], edge: GOLD_LEAF },                 // cream on teal
  rum: { face: [96, 26, 32], ink: [238, 198, 110], edge: [250, 232, 196] },            // gold on oxblood
  overclock: { face: [222, 126, 40], ink: [34, 24, 22], edge: [250, 230, 190] },       // black on orange
  gridlock: { face: [34, 70, 150], ink: [248, 238, 214], edge: GOLD_LEAF },            // cream on royal blue
  slip: { face: [232, 174, 74], ink: [28, 38, 84], edge: [250, 236, 206] },            // navy on amber
};
// POLISH 4 — THE ROOF BILLBOARD's POSTERS (the owner: OVERCLOCK read amber-on-amber under the warm gooseneck lamps): a poster may not
// stand on a warm orange / amber / gold field — under those lamps it blends; each game's poster gets a field that CONTRASTS with warm
// light (DOUBLE AGENT's navy + cream-gold is the bar) — only the posters change (the day signs keep DAY_PAINT). `mark`: the icon's own
// bright accent (else the mark's tube colours toward the ink)
export const POSTER_PAINT = {
  overclock: { face: [10, 70, 104], ink: [250, 238, 210], edge: [12, 14, 26], mark: [255, 150, 44] },       // cream on electric teal-blue, the orange icon
  slip: { face: [30, 34, 72], ink: [246, 206, 110], edge: [10, 12, 26], mark: [92, 226, 255] },             // gold on midnight, the cyan icon
  // (its deep red / oxblood read ORANGE-brown under the lamps at night)
  signal: { face: [34, 26, 56], ink: [250, 238, 214], edge: [10, 8, 18], mark: [255, 74, 74] },            // cream on deep violet-black, the red icon
  rum: { face: [16, 30, 42], ink: [240, 202, 116], edge: [6, 10, 16], mark: [255, 176, 70] },              // gold on night-harbour blue, the amber bottle
};
/** a poster's scheme: POSTER_PAINT's override, else the sign's painted scheme */
export function posterPaint(game, col) {
  const id = game && (game.id || game), o = id && POSTER_PAINT[id];
  if (!o) return dayPaint(game, col);
  const f = c => mix(c, FADE, 0.06);
  return { face: f(o.face), ink: f(o.ink), edge: f(o.edge), band: f(mix(o.edge, o.face, 0.15)), shade: [6, 6, 14], light: false, mark: o.mark };
}
const FADE = [236, 226, 204];           // the sun fades every painted colour a touch toward warm paper
/** a sign's painted scheme (sun-faded): { face, ink, edge, band, shade } */
export function dayPaint(game, col) {
  const p = (game && DAY_PAINT[game.id || game]) || { face: mix(col || [200, 60, 60], [40, 20, 30], 0.55), ink: [248, 234, 206], edge: GOLD_LEAF };
  const f = c => mix(c, FADE, 0.08);
  const light = (p.face[0] + p.face[1] + p.face[2]) / 3 > 150;
  return { face: f(p.face), ink: f(p.ink), edge: f(p.edge), band: f(mix(p.edge, p.face, 0.15)), shade: light ? [70, 46, 34] : [8, 6, 12], light };
}
function strokePolys(x, polys, dx = 0, dy = 0) {
  x.beginPath();
  for (const p of polys) { const q = p.pts || p; q.forEach(([a, b], i) => (i ? x.lineTo(a + dx, b + dy) : x.moveTo(a + dx, b + dy))); if (p.closed) x.closePath(); }
}
/**
 * Paint a sign's letters + mark onto its board (by day; a = the day's share): the drop shadow (down + away from the sun), the
 * keyline / gold leaf, the solid letter, then the sun catching its top edge. lh: the letters' height (pt).
 */
function paintStrokes(x, polys, lh, pt, sd, a, mark = false) {
  if (!polys.length || a <= 0.01) return;
  const ink = Math.max(0.8, lh * (mark ? 0.13 : 0.17)), edge = Math.max(0.45, lh * 0.055), sx = (sd > 0 ? -1 : sd < 0 ? 1 : 0.35) * Math.max(0.35, lh * 0.06), sy = Math.max(0.4, lh * 0.07);
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = a;
  strokePolys(x, polys, sx, sy); x.strokeStyle = rgba(pt.shade, 0.55); x.lineWidth = ink + edge * 2; x.stroke();
  strokePolys(x, polys); x.strokeStyle = rgba(pt.edge); x.lineWidth = ink + edge * 2; x.stroke();
  x.strokeStyle = rgba(pt.ink); x.lineWidth = ink; x.stroke();
  // the sun on the paint: a fine lighter line along the letter's upper edge (toward the light)
  strokePolys(x, polys, (sd > 0 ? 1 : -1) * ink * 0.18, -ink * 0.22); x.strokeStyle = rgba(mix(pt.ink, [255, 252, 240], 0.55), 0.5); x.lineWidth = Math.max(0.25, ink * 0.28); x.stroke();
  x.restore();
}
/** a sign's whole painted face (the board is already filled): its border stripe, the mark, the letters */
function paintFace(x, sg, pt, day, sd, P) {
  if (day <= 0.02) return;
  x.save(); x.globalAlpha = day;
  // a painted pinstripe just inside the board's edge (where the border tube rides) + a fine inner keyline: theatre-sign trim
  const inset = Math.max(0.9, Math.min(P.w, P.h) * 0.07);
  x.strokeStyle = rgba(pt.band); x.lineWidth = Math.max(0.6, Math.min(P.w, P.h) * 0.045);
  x.beginPath(); x.roundRect(P.x + inset * 0.6, P.y + inset * 0.6, P.w - inset * 1.2, P.h - inset * 1.2, Math.max(0.5, (P.r || 1) * 0.8)); x.stroke();
  x.strokeStyle = rgba(pt.band, 0.55); x.lineWidth = Math.max(0.3, Math.min(P.w, P.h) * 0.016);
  x.beginPath(); x.roundRect(P.x + inset * 1.35, P.y + inset * 1.35, P.w - inset * 2.7, P.h - inset * 2.7, Math.max(0.4, (P.r || 1) * 0.6)); x.stroke();
  x.restore();
  for (const p of sg.parts) {
    const b = bbox(p.t), lh = p.mark ? (b.y1 - b.y0) * 0.6 : (p.boxes && p.boxes[0] ? p.boxes[0].y1 - p.boxes[0].y0 - 1.2 : b.y1 - b.y0);
    paintStrokes(x, p.tubes, lh, pt, sd, day, !!p.mark);
  }
}

// tube letters along a line / down a column, in a box: → tubes (screen pt)
// NEON PASS 4 (the owner: "the SIGNAL / CIPHER roof signs are clipped at the right edge"): the row FITS its box — its letters'
// real ink + half a tube inside [x0, x0 + w], centred (it used to run ~8 % past the box on each side: the last letter sat on the
// cabinet's edge, over the border tube, its glow out at the screen's edge). Letters keep ≥ 5 % of a cell between them (+ their own side bearings).
export const tubeWidthFor = lh => Math.max(0.55, Math.min(1.25, lh * 0.13));
function lettersRow(text, x0, y0, w, h, { skew = 0 } = {}) {
  const ch = [...text], n = Math.max(1, ch.length);
  const lay = lh => {
    const s = lh / 14, lw = 10 * s, wa = w - tubeWidthFor(lh) - 0.3, gap = n > 1 ? Math.max(lw * 0.05, Math.min(lw * 0.35, (wa - n * lw) / (n - 1))) : 0;
    const polys = [], cells = [];
    let ix0 = Infinity, ix1 = -Infinity, at = 0;
    ch.forEach(c => {
      const d = LETTERS[c], lx = at;
      at += (d ? lw : lw * 0.45) + gap;                 // (a space: under half a cell)
      if (!d) return;
      for (const p of flattenPath(d, s, lx, 0, 1)) { const q = skewP(p, skew, lh); polys.push(q); for (const [x] of q.pts) { if (x < ix0) ix0 = x; if (x > ix1) ix1 = x; } }
      cells.push(lx);
    });
    return { lh, s, lw, polys, cells, ix0, ix1 };
  };
  let r = lay(Math.min(h, (w / n) * 1.4));
  for (let k = 0; k < 3 && r.ix1 > r.ix0; k++) {
    const avail = w - tubeWidthFor(r.lh) - 0.3, inkW = r.ix1 - r.ix0;
    if (inkW <= avail) break;
    r = lay(r.lh * avail / inkW * 0.995);
  }
  const dx = x0 + (w - (r.ix1 - r.ix0)) / 2 - r.ix0, oy = y0 + (h - r.lh) / 2;
  const polys = r.polys.map(p => ({ ...p, pts: p.pts.map(([x, y]) => [x + dx, y + oy]) }));
  const boxes = r.cells.map(lx => ({ x0: lx + dx - 0.6, y0: oy - 0.6, x1: lx + dx + r.lw + r.lh * skew + 0.6, y1: oy + r.lh + 0.6 }));
  return { polys, lh: r.lh, boxes };
}
function lettersCol(text, x0, y0, w, h, { fill = 0.8, wide = 0.64 } = {}) {
  const ch = [...text], n = ch.length, lh = Math.min(w * wide * 1.4, h / Math.max(1, n) * fill), s = lh / 14, lw = 10 * s, step = h / Math.max(1, n);
  const out = [], boxes = [];
  ch.forEach((c, i) => { const d = LETTERS[c]; if (!d) return; const lx = x0 + (w - lw) / 2, ly = y0 + i * step + (step - lh) / 2; for (const p of flattenPath(d, s, lx, ly, 1)) out.push(p); boxes.push({ x0: lx - 0.6, y0: ly - 0.6, x1: lx + lw + 0.6, y1: ly + lh + 0.6 }); });
  return { polys: out, lh, boxes };
}
const skewP = (p, k, base) => (k ? { ...p, pts: p.pts.map(([x, y]) => [x + (base - y) * k, y]) } : p);
// a mark (0..100 box) into a square: → [{ polys, col }]
function markTubes(g, x0, y0, size) {
  const m = markFor(g), s = size / 100;
  return m.tubes.map(t => ({ polys: flattenPath(t.d, s, x0, y0, 1), col: hexRgb(t.col) }));
}
/**
 * THE GAME BLADE's layout (NEON PASS 3, the owner: "the LETTERS must win"): the cabinet R → the bulbs' OUTER FRAME (a ring just
 * inside the cabinet's edge), the dark PANEL inside it (a clear gap between the bulbs and the panel), the letters' box inside the
 * panel, and the height six stacked letters stand (pt) — the glance test reads it (tests/harbor.test.mjs).
 */
export function bladeLayout(R, n = 6) {
  // (NEON PASS 4: the blade got 2.5 pt shorter — clear of docked Rosie — so the margins inside it tightened a touch: the dark
  // gap 2.0 pt, the letters' box 1 pt in from the panel's top + bottom; six letters still stand ≥ 10 pt)
  const ring = 1.15, gap = ring + 2.0, pad = 1.0;
  const panel = { x: R.x + gap, y: R.y + gap, w: R.w - gap * 2, h: R.h - gap * 2 };
  const box = { x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h - pad * 2 };
  // (NEON PASS 5: the letters a touch closer — 0.93 of a row each — so six stand >= 10 pt at 390 wide: the glance test)
  const lh = Math.min(box.w * 0.82 * 1.4, box.h / Math.max(1, n) * 0.93);
  return { ring, panel, box, lh, fill: 0.93, wide: 0.82 };
}
const roundRectPts = (x, y, w, h, r) => {
  const p = [], seg = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i * Math.PI / 8; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  seg(x + w - r, y + r, -Math.PI / 2); seg(x + w - r, y + h - r, 0); seg(x + r, y + h - r, Math.PI / 2); seg(x + r, y + r, Math.PI); p.push(p[0]);
  return p;
};

/**
 * Build a sign: spot (core/harbor-neon.js#signSpots, with .rect on screen), game (or null for a fixed sign), ctx: { W, dpr,
 * roofY (for a roof mount: the screen y its scaffold stands on), s (pt per reference pt: the city's scale) }.
 * → { id, game, rect, parts: [{ tubes, col, w }], border, bulbs?, lit() → [sprites], billboard? }
 */
export function buildSign(spot, game, ctx) {
  const R = spot.rect, k = ctx.s || 1, mid = R.x + R.w / 2 < ctx.W / 2;     // (the side face toward the middle shows)
  const col = spot.col || (game ? accOf(game) : ICE);
  const parts = [];
  let panel = null, border = null, bulbs = null, tw = Math.max(0.6, Math.min(1.2, R.w * 0.085));
  if (spot.type === 'vbox' || spot.type === 'box') {
    const text = spot.text || signName(game);
    panel = { x: R.x, y: R.y, w: R.w, h: R.h, r: Math.min(R.w, R.h) * 0.12 };
    if (spot.bulbs) {
      // THE GAME BLADE (NEON PASS 3): the bulbs on the outer frame, a dark gap, the dark panel, big bright letters inside it
      const bl = bladeLayout(R, [...text.replace(/ /g, '')].length);
      panel = { ...bl.panel, r: Math.min(bl.panel.w, bl.panel.h) * 0.1, frame: { x: R.x, y: R.y, w: R.w, h: R.h, r: Math.min(R.w, R.h) * 0.14 } };
      const L2 = lettersCol(text.replace(/ /g, ''), bl.box.x, bl.box.y, bl.box.w, bl.box.h, { fill: bl.fill, wide: bl.wide });
      // (DT1 — the owner: "a little bolder / brighter, it's hard to read"): thicker tubes, a whiter core colour, a touch more glow
      tw = Math.max(0.85, Math.min(1.85, L2.lh * 0.17));
      parts.push({ tubes: L2.polys, col: mix(col, [255, 255, 255], 0.22), w: tw, hot: true, boxes: L2.boxes });
      bulbs = [];
      const per = roundRectPts(R.x + bl.ring, R.y + bl.ring, R.w - bl.ring * 2, R.h - bl.ring * 2, Math.min(R.w, R.h) * 0.12);
      let acc = 0;
      for (let i = 1; i < per.length; i++) { const [ax, ay] = per[i - 1], [bx, by] = per[i], d = Math.hypot(bx - ax, by - ay); for (let t = 0; t < d; t += 0.5) { acc += 0.5; if (acc >= 4.1 * k) { acc = 0; bulbs.push([ax + (bx - ax) * t / d, ay + (by - ay) * t / d]); } } }
    } else {
    const pad = Math.min(R.w, R.h) * 0.16;
    border = { pts: roundRectPts(R.x + pad * 0.45, R.y + pad * 0.45, R.w - pad * 0.9, R.h - pad * 0.9, Math.min(R.w, R.h) * 0.1), col: spot.bulbs ? [255, 236, 214] : mix(col, ICE, 0.55) };
    if (spot.type === 'vbox') {
      // (the mark on top only where it reads: a wide cabinet — on a slim one a small mark reads as a letter)
      const markH = game && R.w >= 14 && R.h > R.w * (text.length + 2.2) * 0.9 ? R.w * 0.86 : 0;
      if (markH) for (const m of markTubes(game, R.x + (R.w - markH) / 2, R.y + pad * 0.9, markH)) parts.push({ tubes: m.polys, col: m.col, w: tw * 0.85, mark: true });
      const L2 = lettersCol(text.replace(/ /g, ' '), R.x + pad, R.y + pad + (markH ? markH + pad * 0.6 : 0), R.w - pad * 2, R.h - pad * 2 - (markH ? markH + pad * 0.6 : 0));
      tw = Math.max(0.55, Math.min(1.25, L2.lh * 0.13));
      parts.push({ tubes: L2.polys, col, w: tw, boxes: L2.boxes });
    } else if (spot.stack && text.includes(' ')) {
      // DT1 — A TWO-WORD NAME ON A ROOF SIGN (the slot rule): the FULL name stacked on two lines — HIGH / STAKES — both lines the
      // same letter height (a sign shop's), centred, filling the cabinet; no mark (it would shrink the letters under the glance test)
      const px = Math.max(1.6, R.h * 0.06), py = Math.max(1.4, R.h * 0.05), gp = R.h * 0.05, rh = (R.h - py * 2 - gp) / 2;
      const [w1, ...more] = text.split(' '), w2 = more.join(' ');
      const lh = Math.min(lettersRow(w1, R.x + px, R.y + py, R.w - px * 2, rh).lh, lettersRow(w2, R.x + px, R.y + py + rh + gp, R.w - px * 2, rh).lh);
      const A = lettersRow(w1, R.x + px, R.y + py + (rh - lh) / 2, R.w - px * 2, lh), B = lettersRow(w2, R.x + px, R.y + py + rh + gp + (rh - lh) / 2, R.w - px * 2, lh);
      tw = tubeWidthFor(lh);
      parts.push({ tubes: [...A.polys, ...B.polys], col, w: tw, boxes: [...A.boxes, ...B.boxes], lines: 2 });
      border = { pts: roundRectPts(R.x + 0.55, R.y + 0.55, R.w - 1.1, R.h - 1.1, Math.min(R.w, R.h) * 0.1), col: mix(col, ICE, 0.55) };
    } else if (spot.stack) {
      // NEON PASS 5 — A ROOF SIGN, STACKED (the owner: the names were too small for the glance test): the game's mark centred on
      // top, the NAME across the cabinet's whole width under it — ≥ 10 pt at 390 wide (tests/harbor.test.mjs), never clipped
      const px = Math.max(1.6, R.h * 0.06), py = Math.max(1.4, R.h * 0.05), ms = game ? Math.min(R.h * 0.34, R.w * 0.4) : 0, gp = R.h * 0.04;
      if (ms) for (const m of markTubes(game, R.x + (R.w - ms) / 2, R.y + py + 0.6, ms)) parts.push({ tubes: m.polys, col: m.col, w: Math.max(0.55, tw * 0.75), mark: true });
      const L2 = lettersRow(text, R.x + px, R.y + py + ms + gp, R.w - px * 2, R.h - py * 2 - ms - gp);
      tw = tubeWidthFor(L2.lh);
      parts.push({ tubes: L2.polys, col, w: tw, boxes: L2.boxes });
      border = { pts: roundRectPts(R.x + 0.55, R.y + 0.55, R.w - 1.1, R.h - 1.1, Math.min(R.w, R.h) * 0.1), col: mix(col, ICE, 0.55) };
    } else {
      // (NEON PASS 4: the name now fits inside the border — a slightly smaller mark + tighter gaps give the letters the room back;
      // the text box ends 0.8 pad in from the edge: just inside the border tube)
      const ms = game ? (R.h - pad * 2) * 0.9 : 0, mx = R.x + pad + tw * 0.45, tx = mx + (ms ? ms + pad * 0.45 : 0);
      if (ms) for (const m of markTubes(game, mx, R.y + (R.h - ms) / 2, ms)) parts.push({ tubes: m.polys, col: m.col, w: tw * 0.85, mark: true });
      const L2 = lettersRow(text, tx, R.y + pad, R.x + R.w - pad * 0.8 - tx, R.h - pad * 2);
      tw = tubeWidthFor(L2.lh);
      parts.push({ tubes: L2.polys, col, w: tw, boxes: L2.boxes });
    }
    }
    if (spot.bulbs) border = null;
  } else if (spot.type === 'icon') {
    const size = Math.min(R.w, R.h);
    for (const m of markTubes(game, R.x + (R.w - size) / 2, R.y + (R.h - size) / 2, size)) parts.push({ tubes: m.polys, col: m.col, w: Math.max(0.6, size * 0.065), mark: true });
  } else if (spot.type === 'script') {
    const L2 = lettersRow(spot.text, R.x, R.y, R.w, R.h, { skew: 0.22 });
    parts.push({ tubes: L2.polys, col, w: Math.max(0.7, L2.lh * 0.14) });
  }
  // the tubes, ready to draw (uneven light, electrodes at the open ends)
  for (const p of parts) p.t = p.tubes.map(pl => tube(pl.pts, pl.closed, p.w));
  if (border) border.t = [tube(border.pts, true, tw * 0.75, [false, false])];
  const sign = { id: spot.id, spot, game: game ? game.id : null, rect: R, col, parts, panel, border, bulbs, mid, kind: spot.kind, type: spot.type, frame: ctx.frame || null, letterBoxes: (parts.find(p => p.boxes) || {}).boxes || [], nText: [...String(spot.text || (game ? signName(game) : '')).replace(/ /g, '')].length };
  sign.lit = (dpr, scheme) => litSprites(sign, dpr);
  return sign;
}

// ------------------------------------------------------------------ SOLID CABINETS vs THE LIT WINDOWS (NEON PASS 4)
/**
 * The lit windows are their own baked layers, drawn OVER the facades + the signs' baked housings — so a lit window behind a sign
 * shone through its cabinet (the owner: "the blade is partly hidden behind the building in front of it": the hotel's windows
 * lay over the GAME BLADE). A last step for a lit-window bake: the solid cabinets (vbox / box panels, the blade, the billboards'
 * boards — not the open icons) cut out of the layer (destination-out), and the per-frame window touches behind them (a TV's
 * flicker, a light switched on, a twinkle) dropped. group: 'far' | 'near' (neon.js#groupOf); meta: lights.js#newMeta (the
 * layer's touch lists); hung: the ids of the signs that really hang tonight (null: every spot).
 */
export function cabinetCut(L, group, meta = null, hung = null) {
  const rects = signSpots(L).filter(sp => ((sp.z ?? 0) >= 300 ? 'far' : 'near') === group && (sp.type === 'vbox' || sp.type === 'box' || sp.type === 'billboard') && (!hung || !hung.length || sp.kind === 'billboard' || hung.includes(sp.id))).map(sp => sp.rect);
  return x => {
    if (!rects.length) return;
    x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    for (const R of rects) { x.beginPath(); x.roundRect(R.x - 0.4, R.y - 0.4, R.w + 0.8, R.h + 0.8, Math.min(R.w, R.h) * 0.12); x.fill(); }
    x.restore();
    if (!meta) return;
    const behind = r => rects.some(R => r[0] < R.x + R.w + 0.4 && r[0] + r[2] > R.x - 0.4 && r[1] < R.y + R.h + 0.4 && r[1] + r[3] > R.y - 0.4);
    for (const k of ['cands', 'tv', 'twinkle']) if (Array.isArray(meta[k])) meta[k] = meta[k].filter(w => !w.rect || !behind(w.rect));
    if (Array.isArray(meta.boxes)) for (const R of rects) meta.boxes.push({ idx: Infinity, x0: R.x, x1: R.x + R.w, y0: R.y, y1: R.y + R.h });
    // (the power-on wave's windows too: lights.js#drawWave)
    if (meta.wave && Array.isArray(meta.wave.list)) for (const w of meta.wave.list) if (w.vis && behind([w.x, w.y, w.w, w.h])) w.vis = 0;
  };
}

// ------------------------------------------------------------------ the housing (per look)
/**
 * A ROOF SIGN'S STEEL (DT1 — the owner: "visible steel lattice frames + a catwalk with a thin railing underneath, so their size reads
 * as deliberate"): the frame's members as strokes (screen pt) — the girder under the cabinet, two LATTICE LEGS (two rails + zigzag
 * lacing) raking from the roof's edges, X braces between them, the CATWALK (a plank deck a little below the cabinet, past both
 * ends) with its RAILING (posts, a top + a mid rail) up to the cabinet's foot, the beacon's post. style(kind) → [colour, width]
 * for 'main' | 'lit' | 'lace' | 'deck' | 'rail' (by day the steel in the sun; at night the sign's own light on it: frameLight).
 */
export function frameGeom(x, R, fr, sd, style) {
  const gy = R.y + R.h, foot = Math.max(gy + 3, fr.roofY), k = Math.max(0.5, R.h / 18), span = foot - gy;
  const [l0, l1] = fr.legs, tops = [R.x + R.w * 0.1, R.x + R.w * 0.9];
  const deckY = gy + Math.min(3 * k, span * 0.42), railTop = gy + 0.35 * k;
  const line = (kind, fn) => { const [c, w] = style(kind); if (!c) return; x.strokeStyle = c; x.lineWidth = w; x.beginPath(); fn(); x.stroke(); };
  x.lineCap = 'butt'; x.lineJoin = 'miter';
  // the girder under the cabinet (a little wider than it)
  line('main', () => { x.moveTo(R.x - 0.8 * k, gy + 0.45 * k); x.lineTo(R.x + R.w + 0.8 * k, gy + 0.45 * k); });
  // the lattice legs: two rails each, from the roof's edge up to the girder, raking out to the cabinet's ends, + the zigzag lacing
  [l0, l1].forEach((lx, i) => {
    const tx = tops[i], cw = 1.5 * k, side = i === (sd > 0 ? 1 : 0) ? 'lit' : 'main';
    line(side, () => { x.moveTo(lx - cw / 2, foot); x.lineTo(tx - cw / 2, gy + 0.9 * k); x.moveTo(lx + cw / 2, foot); x.lineTo(tx + cw / 2, gy + 0.9 * k); });
    const n = Math.max(3, Math.round((foot - gy) / (1.5 * k)));
    line('lace', () => { for (let j = 0; j < n; j++) { const a = j / n, b = (j + 1) / n, xa = lx + (tx - lx) * a, ya = foot + (gy + 0.9 * k - foot) * a, xb = lx + (tx - lx) * b, yb = foot + (gy + 0.9 * k - foot) * b; x.moveTo(xa + (j % 2 ? cw : -cw) / 2, ya); x.lineTo(xb + (j % 2 ? -cw : cw) / 2, yb); } });
  });
  // the X braces between the legs
  const mY = (foot + deckY) / 2;
  line('lace', () => { x.moveTo(l0, foot - 0.4); x.lineTo((tops[1] + l1) / 2, mY); x.moveTo(l1, foot - 0.4); x.lineTo((tops[0] + l0) / 2, mY); });
  // THE CATWALK: the deck (planks) out past both ends, the railing's posts + rails from the deck up to the cabinet's foot
  const d0 = R.x - 1.6 * k, d1 = R.x + R.w + 1.6 * k;
  line('deck', () => { x.moveTo(d0, deckY); x.lineTo(d1, deckY); });
  line('rail', () => {
    x.moveTo(d0, railTop); x.lineTo(d1, railTop);
    x.moveTo(d0, (railTop + deckY) / 2); x.lineTo(d1, (railTop + deckY) / 2);
    for (let px = d0; px <= d1 + 0.01; px += Math.max(2.2, 3 * k)) { x.moveTo(px, railTop); x.lineTo(px, deckY); }
  });
  // the beacon's post on top of the cabinet
  if (fr.beacon) { const [bx, by] = fr.beacon; line('main', () => { x.moveTo(bx, R.y); x.lineTo(bx, by + 0.6 * k); }); }
  return { deckY, foot, k };
}
/** a roof sign's steel frame (screen pt), baked with the housing: fr = { roofY, legs: [x0, x1], beacon: [x, y] } */
function roofFrame(x, sg, fr, day, sd) {
  const R = sg.rect, k = Math.max(0.5, R.h / 18);
  // (DT1: a touch lighter at night than the old near-black, so the lattice reads as a silhouette against the night sky's glow)
  const steel = mix([30, 26, 40], [96, 84, 78], day), lit = mix([44, 38, 54], [176, 158, 134], day), lace = mix([26, 22, 36], [84, 74, 70], day);
  const g = frameGeom(x, R, fr, sd, kind => kind === 'main' ? [rgba(steel), Math.max(0.5, 0.46 * k)] : kind === 'lit' ? [rgba(lit), Math.max(0.5, 0.46 * k)] : kind === 'lace' ? [rgba(lace, 0.95), Math.max(0.3, 0.24 * k)] : kind === 'deck' ? [rgba(steel), Math.max(0.6, 0.62 * k)] : [rgba(mix(steel, [200, 190, 170], 0.15 * day), 0.95), Math.max(0.25, 0.17 * k)]);
  // the deck's sunlit top edge (day) + the beacon's cage
  if (day > 0.05) { x.strokeStyle = rgba([255, 246, 222], 0.5 * day); x.lineWidth = Math.max(0.2, 0.14 * k); x.beginPath(); x.moveTo(R.x - 1.6 * k, g.deckY - 0.3 * k); x.lineTo(R.x + R.w + 1.6 * k, g.deckY - 0.3 * k); x.stroke(); }
  if (fr.beacon) { const [bx, by] = fr.beacon; x.fillStyle = rgba(mix([10, 8, 16], [52, 44, 44], day)); x.beginPath(); x.arc(bx, by + 0.4 * k, 0.75 * k, 0, Math.PI * 2); x.fill(); }
}
/** a roof sign's frame in its own light (night, additive — neon.js draws it with the sign's power): the steel catching the colour */
export function frameLight(x, sg, col) {
  if (!sg.frame) return;
  const R = sg.rect, k = Math.max(0.5, R.h / 18), c = mix(col, [255, 255, 255], 0.25);
  frameGeom(x, R, sg.frame, 0, kind => kind === 'main' || kind === 'lit' ? [rgba(c, 0.5), Math.max(0.5, 0.46 * k)] : kind === 'lace' ? [rgba(c, 0.32), Math.max(0.3, 0.24 * k)] : kind === 'deck' ? [rgba(c, 0.62), Math.max(0.6, 0.62 * k)] : [rgba(c, 0.5), Math.max(0.25, 0.17 * k)]);
}
/** the housing drawn straight into a context (the facade bake: the signs' cabinets are static per look) */
export function drawHousing(x, sg, T, ctx) {
  const R = sg.rect, day = Math.min(1, T.day + 0.8 * T.gold), sd = T.sunDir || 0;
  {
    // (THE DAY PASS: by day the board is the game's painted enamel — dayPaint — not a grey box; the night's dark cabinet unchanged)
    const pt = dayPaint(sg.game, sg.col);
    const enamelDay = pt.face;
    const enamel = mix([14, 11, 22], enamelDay, day);
    const trim = mix([40, 34, 50], [214, 196, 160], day);
    // A TOWER'S ROOF SIGN (Part 5): a riveted steel frame on the tower's roof — two lattice legs on the roof's edges, a girder
    // under the cabinet, X braces, a catwalk; the beacon's post on top (the tower's beacon blinks there: lights.js)
    const fr = sg.spot.mount === 'tower' && ctx.frame;
    if (fr) roofFrame(x, sg, fr, day, sd);
    // the scaffold to the roof (a roof mount): two legs + a cross brace
    if (sg.spot.mount === 'roof' && ctx.roofY > R.y + R.h) {
      x.strokeStyle = rgba(mix([22, 18, 30], [70, 60, 58], day), 1); x.lineWidth = Math.max(0.5, R.w * 0.05);
      x.beginPath(); for (const f of [0.18, 0.82]) { x.moveTo(R.x + R.w * f, R.y + R.h); x.lineTo(R.x + R.w * f, ctx.roofY); }
      x.moveTo(R.x + R.w * 0.18, R.y + R.h + 1); x.lineTo(R.x + R.w * 0.82, ctx.roofY); x.stroke();
    }
    if (sg.panel) {
      // (the game blade: the outer cabinet F carries the bulbs; its dark panel P the letters — NEON PASS 3)
      const P0 = sg.panel, P = P0.frame || P0;
      // the cast shadow on the wall (day)
      if (day > 0.05 && !fr) { x.fillStyle = `rgba(20,14,30,${0.25 * day})`; x.beginPath(); x.roundRect(P.x + (sd > 0 ? -1.2 : 1.2), P.y + 1.6, P.w, P.h, P.r); x.fill(); }
      // the brackets (wall side): two arms
      x.fillStyle = rgba(mix([18, 14, 24], [60, 52, 52], day));
      const bx = sg.mid ? P.x + P.w : P.x - 1.6;
      if (!fr) for (const f of [0.12, 0.88]) x.fillRect(bx, P.y + P.h * f - 0.5, 1.6, 1);
      // the depth: the cabinet's side toward the middle
      const dw = Math.max(0.8, Math.min(2, P.w * 0.14));
      x.fillStyle = rgba(mix(enamel, [0, 0, 0], 0.4)); x.beginPath(); x.roundRect(sg.mid ? P.x + P.w - 0.5 : P.x - dw + 0.5, P.y + 0.6, dw, P.h - 0.6, P.r * 0.5); x.fill();
      // the face: enamel, the trim, the top catching the light
      x.fillStyle = rgba(enamel); x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill();
      x.strokeStyle = rgba(trim, 0.9); x.lineWidth = Math.max(0.4, P.w * 0.04); x.stroke();
      if (P0.frame) {
        // the inner panel: near-black enamel, a fine raised lip — the stage the letters stand on (by day: the game's painted
        // board; the outer frame that carries the bulbs a darker band of the same paint)
        if (day > 0.02) { x.fillStyle = rgba(mix(enamel, mix(pt.face, [10, 8, 14], 0.5), day)); x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill(); }
        x.fillStyle = rgba(mix(mix([6, 5, 12], [0, 0, 0], 0.25), pt.face, day)); x.beginPath(); x.roundRect(P0.x, P0.y, P0.w, P0.h, P0.r); x.fill();
        x.strokeStyle = rgba(mix(trim, [0, 0, 0], 0.35), 0.85); x.lineWidth = Math.max(0.35, P0.w * 0.03); x.stroke();
      }
      if (day > 0.05) {
        const g = x.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
        g.addColorStop(0, `rgba(255,248,230,${0.16 * day})`); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(20,10,20,${0.18 * day})`);
        x.fillStyle = g; x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill();
        // weathering: a few streaks under the bottom edge + faded blotches
        x.fillStyle = `rgba(90,60,40,${0.1 * day})`;
        for (let i = 0; i < 3; i++) x.fillRect(P.x + P.w * (0.2 + 0.3 * i), P.y + P.h * 0.55, Math.max(0.3, P.w * 0.05), P.h * 0.45);
        // THE PAINTED FACE: the border stripe, the mark, the letters (gold leaf / keyline, drop shadow) — the glass rides on top
        paintFace(x, sg, pt, day, sd, P0);
      }
    } else if (sg.type === 'script' || sg.type === 'icon') {
      // the raceway: a slim painted metal bar the tubes are mounted on (the transformers inside)
      x.fillStyle = rgba(mix([16, 12, 22], [96, 84, 76], day), 0.95);
      const rh = Math.max(1, R.h * 0.18);
      x.beginPath(); x.roundRect(R.x + R.w * 0.04, R.y + R.h * 0.52 - rh / 2, R.w * 0.92, rh, rh * 0.3); x.fill();
      if (day > 0.05) { x.fillStyle = `rgba(255,250,230,${0.25 * day})`; x.fillRect(R.x + R.w * 0.04, R.y + R.h * 0.52 - rh / 2, R.w * 0.92, Math.max(0.3, rh * 0.25)); }
    }
    // the bulbs' sockets (the game blade)
    // (DT1: bigger bulbs — a socket ring + the glass bulb, the marquee reads as hardware by day)
    if (sg.bulbs) { for (const [bx, by] of sg.bulbs) { x.fillStyle = rgba(mix([22, 18, 24], [150, 132, 104], day)); x.beginPath(); x.arc(bx, by, 0.95, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba(mix([44, 36, 40], [244, 236, 214], day)); x.beginPath(); x.arc(bx, by, 0.7, 0, Math.PI * 2); x.fill(); } }
    // the glass tubes, unlit (clear glass by day; dark at night)
    // (on a painted board by day the glass is a faint pale line over the paint — onPaint)
    const onPaint = !!sg.panel;
    for (const p of sg.parts) drawGlass(x, p.t, p.col, T, { w: p.w, clipEvery: 18, onPaint });
    if (sg.border) drawGlass(x, sg.border.t, sg.border.col, T, { w: sg.border.t[0] ? sg.parts[0] ? sg.parts[0].w * 0.75 : 0.7 : 0.7, clips: false, shadow: false, onPaint });
  }
}

// ------------------------------------------------------------------ the lit parts (once per sign: power draws them)
function litSprites(sg, dpr) {
  const out = [];
  const one = (tubes, col, w) => {
    const b = bbox(tubes), glow = Math.max(3, w * 5.5);
    return sprite(b, glow * 2.6, dpr, x => drawLit(x, tubes, col, { w, glow, a: 1, dpr }));
  };
  // the panel's own light: the enamel lit from inside by its tubes (a soft wash), with the border tube
  if (sg.border) {
    const P = sg.panel, w = sg.border.t[0] ? (sg.parts[0] ? sg.parts[0].w * 0.75 : 0.7) : 0.7;
    out.push(sprite({ x0: P.x, y0: P.y, x1: P.x + P.w, y1: P.y + P.h }, w * 14, dpr, x => {
      x.fillStyle = rgba(sg.col, 0.12); x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill();
      drawLit(x, sg.border.t, sg.border.col, { w, glow: Math.max(3, w * 5), a: 0.9, dpr });
    }));
  }
  // the mark's tubes (one sprite), the letters (one sprite)
  const marks = sg.parts.filter(p => p.mark), text = sg.parts.filter(p => !p.mark);
  if (marks.length) {
    const all = marks.flatMap(p => p.t), b = bbox(all), glow = Math.max(3, marks[0].w * 5.5);
    const ms = sprite(b, glow * 2.6, dpr, x => { for (const p of marks) drawLit(x, p.t, p.col, { w: p.w, glow, a: 1, dpr }); });
    ms.role = 'mark'; out.push(ms);
  }
  // (the game blade's letters: a tighter glow — six big letters stacked close must not melt into one bar of light)
  for (const p of text) if (p.t.length) { const sp = p.hot ? sprite(bbox(p.t), Math.max(3, p.w * 3.9) * 2.6, dpr, x => { drawLit(x, p.t, p.col, { w: p.w, glow: Math.max(3, p.w * 3.9), a: 1, dpr }); }) : one(p.t, p.col, p.w); sp.role = 'text'; sp.box = bbox(p.t); out.push(sp); }
  return out;
}

// ------------------------------------------------------------------ BILLBOARDS (painted, 1920s; gooseneck lamps)
/** what a billboard shows: { game } → its name, its tag line, its mark, its colours; or { title, sub, col: [bg, ink] } (CITY CONTROL) */
export function billboardContent(show, games) {
  const g = games.find(x => x.id === (show && show.game)) || null;
  if (g) { const acc = accOf(g); return { title: g.name, sub: g.tag || '', game: g, bg: mix(acc, [30, 18, 40], 0.78), ink: mix(acc, [255, 246, 226], 0.35), acc }; }
  return { title: (show && show.title) || 'NEON SPEAKEASY', sub: (show && show.sub) || 'YOUR FRIENDS ARE ALREADY INSIDE', game: null, bg: (show && show.bg) || [40, 22, 48], ink: (show && show.ink) || [255, 214, 120], acc: (show && show.acc) || [255, 46, 151] };
}
/** THE GOOSENECK LAMPS' warm incandescent light (~2700 K amber-gold) */
export const LAMP_C = [255, 196, 122];
/**
 * THE GOOSENECK LAMPS (DT1 — reusable: Part 7's ghost ad on the speakeasy's wall takes the same): where a board's lamps stand —
 * FOUR over its top edge, TWO EACH SIDE of the game's mark at top centre (the mark between them, the name below). Each lamp: its
 * conduit rising from behind the board, the gooseneck arching over the top edge, the shade hanging over the poster.
 * M2 (the owner: "more bold or prominent" — they were specks): a real warehouse lamp at phone size — the SHADE a deep enamelled
 * dish ~6–8 pt across at 402 (W), the arm a clear curve ~0.9 pt thick rising ~1.3 W above the board; the shade's mouth always ABOVE
 * the board's top edge, so the lamps never cover the mark or the name (their light falls on them). → [{ x, y (the shade's mouth),
 * top (the arm's peak), x0 (the conduit), dir (which way it reaches), a, W (the shade's width) }]
 */
export function gooseneckLamps(R, n = 4) {
  const W = Math.max(5.5, Math.min(8, R.w * 0.085)), a = W * 1.25;
  // (SP3 — THE HIGH STAKES BOARD on the speakeasy's roof, the owner: ~15 % brighter, Claude's call: FIVE lamps EVENLY spaced, the centre one
  // lighting the spade — a brighter, more even board; its arm reaches from the left, its shade over the middle)
  const fs = n === 5 ? [0.08, 0.29, 0.5, 0.71, 0.92] : [0.09, 0.25, 0.75, 0.91];
  return fs.map(f => { const dir = f <= 0.5 ? 1 : -1, x = R.x + R.w * f + (f === 0.5 ? 0 : dir * W * 0.55), x0 = x - dir * W * 0.55; return { x, y: R.y - W * 0.12, top: R.y - a * 1.05, x0, dir, a, W }; });
}
/** the lamps as hardware (any hour: by day in the sun, at night dark): the conduit, the gooseneck, the shade */
export function drawGooseneck(x, lamps, day, sd = 0) {
  const steel = mix([20, 18, 26], [64, 62, 60], day), steelHi = mix([44, 40, 48], [196, 190, 176], day);
  const enamel = mix([24, 26, 30], [30, 70, 56], day), enamelHi = mix([44, 46, 52], [120, 176, 150], day), rim = mix([56, 50, 50], [226, 216, 190], day);
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const l of lamps) {
    const W = l.W, aw = Math.max(0.8, W * 0.13), capY = l.y - W * 0.5;
    // the gooseneck: up from behind the board, over in a smooth arc, down into the shade's cap
    const arm = () => { x.beginPath(); x.moveTo(l.x0, l.y + W * 0.7); x.lineTo(l.x0, l.top + l.a * 0.35); x.bezierCurveTo(l.x0, l.top - l.a * 0.05, l.x0 + l.dir * W * 0.2, l.top - l.a * 0.08, l.x0 + l.dir * W * 0.42, l.top + l.a * 0.12); x.quadraticCurveTo(l.x, l.top + l.a * 0.3, l.x, capY - W * 0.08); };
    x.strokeStyle = rgba(steel); x.lineWidth = aw; arm(); x.stroke();
    if (day > 0.05) { x.save(); x.translate(sd > 0 ? aw * 0.22 : -aw * 0.22, -aw * 0.12); x.strokeStyle = rgba(steelHi, 0.55 * day); x.lineWidth = aw * 0.35; arm(); x.stroke(); x.restore(); }
    // the shade: a deep dish (a dome over a flared skirt), its mouth down at the poster
    const hw = W / 2, top = capY + W * 0.06;
    const dish = new Path2D();
    dish.moveTo(l.x - hw * 0.22, top); dish.lineTo(l.x + hw * 0.22, top);
    dish.bezierCurveTo(l.x + hw * 0.62, top + W * 0.06, l.x + hw * 0.78, l.y - W * 0.12, l.x + hw, l.y);
    dish.lineTo(l.x - hw, l.y);
    dish.bezierCurveTo(l.x - hw * 0.78, l.y - W * 0.12, l.x - hw * 0.62, top + W * 0.06, l.x - hw * 0.22, top);
    dish.closePath();
    x.fillStyle = rgba(enamel); x.fill(dish);
    // the enamel's shine on the sunny side by day (a soft band), a faint one at night
    x.save(); x.clip(dish);
    const sx = l.x + (sd >= 0 ? 0.28 : -0.28) * hw, g = x.createRadialGradient(sx, top + W * 0.14, 0, sx, top + W * 0.14, W * 0.42);
    g.addColorStop(0, rgba(enamelHi, 0.95 * Math.max(0.25, day))); g.addColorStop(1, rgba(enamelHi, 0));
    x.fillStyle = g; x.fillRect(l.x - hw, top, W, l.y - top);
    x.restore();
    // the cap where the arm goes in, the bright rolled rim at the mouth
    x.fillStyle = rgba(steel); x.fillRect(l.x - hw * 0.26, top - W * 0.1, hw * 0.52, W * 0.13);
    x.strokeStyle = rgba(rim, 0.92); x.lineWidth = Math.max(0.45, W * 0.07); x.beginPath(); x.moveTo(l.x - hw, l.y); x.lineTo(l.x + hw, l.y); x.stroke();
  }
}
/** the lamps' LIGHT on the poster (a light map, 0..255 a channel, for multiply). M3 (the owner: "it's an advertisement — you should
 *  be able to see it at night"): the four lamps WASH THE WHOLE BOARD — a warm wash from top to bottom (bright under the lamps, ~62 %
 *  at the foot, so the full name reads like the neon around it), the pools under each lamp brighter still at the top, a little
 *  fall-off at the two ends: a lit painted billboard, never a dark board with a lit strip */
export function lampLightMap(lx, R, lamps, lift = 0) {
  const wash = lx.createLinearGradient(0, 0, 0, R.h);
  // (PF — the owner: "a little BRIGHTER": the wash ~+7 % top to foot, the pools under the lamps 0.5 → 0.6)
  wash.addColorStop(0, 'rgb(248,212,164)'); wash.addColorStop(0.35, 'rgb(228,190,144)'); wash.addColorStop(0.75, 'rgb(192,156,118)'); wash.addColorStop(1, 'rgb(162,128,100)');
  lx.fillStyle = wash; lx.fillRect(0, 0, R.w, R.h);
  lx.globalCompositeOperation = 'lighter';
  if (lift > 0) { lx.fillStyle = `rgba(255,214,160,${lift.toFixed(3)})`; lx.fillRect(0, 0, R.w, R.h); }   // (SP3: the roof board's small lift)
  for (const l of lamps) {
    const cx = l.x - R.x, g = lx.createRadialGradient(cx, -R.h * 0.08, 0, cx, -R.h * 0.08, R.h * 0.8);
    g.addColorStop(0, 'rgba(255,230,186,0.6)'); g.addColorStop(0.4, 'rgba(250,204,146,0.27)'); g.addColorStop(1, 'rgba(220,160,110,0)');
    lx.fillStyle = g; lx.fillRect(0, 0, R.w, R.h);
  }
  lx.globalCompositeOperation = 'multiply';
  // the ends (beyond the outer lamps) a little less lit
  const side = lx.createLinearGradient(0, 0, R.w, 0);
  side.addColorStop(0, 'rgb(205,205,205)'); side.addColorStop(0.12, 'rgb(255,255,255)'); side.addColorStop(0.88, 'rgb(255,255,255)'); side.addColorStop(1, 'rgb(205,205,205)');
  lx.fillStyle = side; lx.fillRect(0, 0, R.w, R.h);
  lx.globalCompositeOperation = 'source-over';
}
/** the lamps lit, over the poster (additive): inside each shade the lit enamel + a bright warm bulb, a soft cone of light down the
 *  poster (M2: clearly visible, never covering the name — the cone is light, the bulb sits in the shade above the board) */
export function lampGlows(x, lamps, R, k = 1) {
  x.save(); x.globalCompositeOperation = 'lighter';
  for (const l of lamps) {
    const W = l.W || l.a * 0.72, hw = W / 2, foot = R.y + R.h * 0.62, spread = W * 1.15;
    // the cone: from the mouth down the board, widening, fading
    const cone = x.createLinearGradient(0, l.y, 0, foot);
    // (PF: a little brighter — the cone 0.32 → 0.38, the shade's inside 0.9 → 1, the bulb's halo brighter but TIGHTER: W 0.9 → 0.8)
    cone.addColorStop(0, rgba(LAMP_C, 0.38 * k)); cone.addColorStop(0.45, rgba(LAMP_C, 0.14 * k)); cone.addColorStop(1, rgba(LAMP_C, 0));
    x.fillStyle = cone; x.beginPath(); x.moveTo(l.x - hw * 0.9, l.y); x.lineTo(l.x + hw * 0.9, l.y); x.lineTo(l.x + spread, foot); x.lineTo(l.x - spread, foot); x.closePath(); x.fill();
    // the inside of the shade lit (a warm crescent under the rim)
    const inG = x.createRadialGradient(l.x, l.y, 0, l.x, l.y, hw * 1.05);
    inG.addColorStop(0, rgba([255, 230, 178], 1 * k)); inG.addColorStop(0.6, rgba(LAMP_C, 0.42 * k)); inG.addColorStop(1, rgba(LAMP_C, 0));
    x.fillStyle = inG; x.beginPath(); x.ellipse(l.x, l.y, hw * 1.05, W * 0.3, 0, 0, Math.PI * 2); x.fill();
    // the bulb: a white-hot point in the mouth + its glow
    const by = l.y + W * 0.02, bg = x.createRadialGradient(l.x, by, 0, l.x, by, W * 0.8);
    bg.addColorStop(0, rgba([255, 252, 236], 1 * k)); bg.addColorStop(0.16, rgba([255, 238, 196], 1 * k)); bg.addColorStop(0.45, rgba(LAMP_C, 0.42 * k)); bg.addColorStop(1, rgba(LAMP_C, 0));
    x.fillStyle = bg; x.fillRect(l.x - W, by - W * 0.9, W * 2, W * 1.8);
  }
  x.restore();
}
/**
 * A BILLBOARD (DT1 — the owner: "a proper 1920s painted billboard … BUILT, NOT FLOATING"): ONE POSTER by day and by night — the
 * game's mark at top centre on a Deco sunburst, the FULL NAME big across the board under it (one line, a condensed sign-writer's
 * hand; no tag line), in the game's enamel; a moulded frame; standing on the roof of the near block behind it (its roof lowered
 * for it: core/harbor-layout.js#BILLBOARD) on a STEEL STRUCTURE — three A-frames, X braces, a CATWALK along its foot with a thin
 * RAILING, a ladder (Part 8's billposter climbs it) — and FOUR GOOSENECK LAMPS over its top edge. By day the steel + the paint in
 * the sun; at night the board is dark but where its lamps light it (nightS, drawn with the lamps' level: neon.js).
 * → { id, spot, rect, content, dayDraw(x, T), nightS, lamps }
 */
export function buildBillboard(spot, content, ctx) {
  const R = spot.rect, dpr = ctx.dpr, dun = spot.mount === 'speak', lamps = gooseneckLamps(R, dun ? 5 : 4);
  // (8b1: a burnt-out gooseneck — ctx.dead, its index — throws no light until the billposter fixes it; its shade still hangs there)
  const litLamps = ctx.dead != null ? lamps.filter((l, i) => i !== ctx.dead) : lamps;
  const gy = R.y + R.h, foot = Math.max(gy + 4, ctx.roofY || gy + 7), k = Math.max(0.6, R.h / 40);
  const deckY = gy + 0.75 * k, railTop = gy - 2.2 * k;
  const FONT = fs => `700 ${fs}px "Chakra Petch", Orbitron, sans-serif`;
  const SQ = 0.8;                                               // (the name's condensed hand: 80 % width)
  // THE POSTER (the same art by day + night; sd: the sun's side for the paint's shadows, 0 at night)
  const poster = (x, sd) => {
    const pt = posterPaint(content.game, content.acc);
    x.fillStyle = rgba(pt.face); x.fillRect(R.x, R.y, R.w, R.h);
    // the name: as big as one line across 90 % of the board allows (condensed), its baseline clear of the catwalk's railing
    const tw = R.w * 0.9;
    let fs = R.h * 0.4; x.font = FONT(fs);
    while (fs > 3 && x.measureText(content.title).width * SQ > tw) { fs *= 0.96; x.font = FONT(fs); }
    const base = R.y + R.h * 0.86, capH = fs * 0.72, top = R.y + R.h * 0.07, imgB = base - capH - R.h * 0.07, ih = imgB - top;
    // the sunburst behind the mark (rays fanning up from it), clipped to the image's band
    const cx = R.x + R.w / 2, cy = imgB + ih * 0.12;
    x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, imgB - R.y + 0.5); x.clip();
    x.fillStyle = rgba(mix(pt.face, pt.light ? [255, 250, 236] : pt.edge, pt.light ? 0.5 : 0.24));
    const n = 16, Rr = R.w * 0.8;
    for (let i = 0; i < n; i += 2) { const a0 = Math.PI + i * Math.PI / n, a1 = a0 + Math.PI / n; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a0) * Rr, cy + Math.sin(a0) * Rr); x.lineTo(cx + Math.cos(a1) * Rr, cy + Math.sin(a1) * Rr); x.fill(); }
    x.restore();
    // the poster's rule line under the image, in the keyline colour
    x.fillStyle = rgba(pt.edge, 0.9); x.fillRect(R.x + R.w * 0.05, imgB + R.h * 0.022, R.w * 0.9, Math.max(0.5, R.h * 0.024));
    // the mark, big, at top centre (between the lamps): shadow → keyline → the colours
    if (content.game && ih > 4) {
      const m = markFor(content.game), ms = Math.min(ih * 0.98, R.w * 0.3), s2 = ms / 100, mx = cx - ms / 2, my = top + (ih - ms) / 2, lw = 12;
      x.save(); x.translate(mx, my); x.scale(s2, s2); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const t of m.tubes) { const p = new Path2D(t.d); x.save(); x.translate((sd > 0 ? -1 : 1) * 4, 5); x.strokeStyle = rgba(pt.shade, 0.45); x.lineWidth = lw + 9; x.stroke(p); x.restore(); }
      for (const t of m.tubes) { const p = new Path2D(t.d); x.strokeStyle = rgba(pt.edge); x.lineWidth = lw + 7; x.stroke(p); }
      for (const t of m.tubes) { const p = new Path2D(t.d); x.strokeStyle = rgba(pt.mark ? pt.mark : mix(hexRgb(t.col), pt.ink, 0.45)); x.lineWidth = lw; x.stroke(p); }
      x.restore();
    }
    // the name: shadow → keyline → the letters → a lighter top edge (condensed: drawn in a squeezed frame)
    x.save(); x.translate(cx, base); x.scale(SQ, 1);
    const nw = x.measureText(content.title).width, nx = -nw / 2;
    x.lineJoin = 'round';
    x.fillStyle = rgba(pt.shade, 0.5); x.fillText(content.title, nx + (sd > 0 ? -1 : 1) * fs * 0.06, fs * 0.06);
    x.strokeStyle = rgba(pt.edge); x.lineWidth = Math.max(0.6, fs * 0.1); x.strokeText(content.title, nx, 0);
    x.fillStyle = rgba(pt.ink); x.fillText(content.title, nx, 0);
    x.beginPath(); x.rect(nx - 2, -capH, nw + 4, capH * 0.32); x.clip(); x.fillStyle = rgba(mix(pt.ink, [255, 252, 240], 0.35), 0.6); x.fillText(content.title, nx, 0);
    x.restore();
    // the paper: two seams, a little grime at the foot
    x.fillStyle = 'rgba(0,0,0,0.08)'; for (const f of [0.34, 0.67]) x.fillRect(R.x + R.w * f, R.y, 0.35, R.h);
    const g = x.createLinearGradient(0, R.y, 0, gy); g.addColorStop(0, 'rgba(255,248,230,0.1)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.14)'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
  };
  // THE STRUCTURE (screen pt): the moulding round the poster, the catwalk + its railing, three A-frames to the roof + X braces, a
  // ladder; steel in the sun by day, near-black at night (cols: [steel, lit side, moulding])
  const structure = (x, day, sd) => {
    // (galvanised steel by day — lighter than the brick behind it, so the frame reads as structure; near-black at night)
    const steel = mix([24, 20, 30], [126, 124, 118], day), lit = mix([36, 30, 42], [200, 196, 184], day), mould = mix([30, 24, 30], [134, 110, 84], day);
    x.lineCap = 'butt';
    if (dun) {
      // FP — A SHORT, CLEAN FRAME (the owner: the tall open frame let the brick city behind show through "and looked chaotic"): the
      // board's foot only a little above the string lights; under it ONE dark structure — a shadowed backing (the depth of the frame
      // under the board: nothing busy shows through it), five posts with a Warren lattice of diagonals between them, on the DUNNAGE
      // (a steel I-beam on short posts down to the deck, behind the parapet + the string lights); a soft shadow on the roof by day
      const d0 = R.x - 3 * k, d1 = R.x + R.w + 3 * k, bh = Math.max(1.1, 1.25 * k), dark = mix([12, 10, 18], [64, 62, 66], day);
      const bk = x.createLinearGradient(0, deckY, 0, foot);
      bk.addColorStop(0, rgba(dark, 0.94)); bk.addColorStop(1, rgba(dark, 0.8));
      x.fillStyle = bk; x.fillRect(R.x - 0.6 * k, deckY, R.w + 1.2 * k, foot - deckY + 0.2);
      // the posts (each a lit edge + its steel) + the diagonals, alternating (a Warren truss): read as ONE lattice
      const posts = [0.04, 0.27, 0.5, 0.73, 0.96].map(f => R.x + R.w * f), pw = Math.max(0.7, 0.8 * k);
      x.fillStyle = rgba(steel); for (const px of posts) x.fillRect(px - pw / 2, deckY, pw, foot - deckY);
      if (day > 0.05) { x.fillStyle = rgba(lit, 0.7 * day); for (const px of posts) x.fillRect(px + (sd > 0 ? 0 : -pw / 2), deckY, pw / 2, foot - deckY); }
      x.strokeStyle = rgba(steel); x.lineWidth = Math.max(0.45, 0.45 * k);
      x.beginPath();
      for (let i = 0; i < posts.length - 1; i++) { const up = i % 2 === 0; x.moveTo(posts[i], up ? foot - 0.2 : deckY + 0.3); x.lineTo(posts[i + 1], up ? deckY + 0.3 : foot - 0.2); }
      x.stroke();
      // a mid tie along the frame
      x.fillStyle = rgba(steel, 0.9); x.fillRect(R.x, (deckY + foot) / 2 - 0.2 * k, R.w, Math.max(0.35, 0.35 * k));
      // the dunnage: its posts down to the deck, the beam, its lit flange, the base plates + bolts under each frame post
      x.fillStyle = rgba(steel); for (const f of [0.06, 0.3, 0.5, 0.7, 0.94]) x.fillRect(R.x + R.w * f - 0.5 * k, foot + bh * 0.6, Math.max(0.8, 1.0 * k), 7 * k);
      x.fillStyle = rgba(mix(steel, [0, 0, 0], 0.25)); x.fillRect(d0, foot, d1 - d0, bh);
      x.fillStyle = rgba(lit, 0.95); x.fillRect(d0, foot, d1 - d0, Math.max(0.35, 0.3 * k));
      x.fillStyle = rgba(steel); x.fillRect(d0, foot + bh - Math.max(0.3, 0.25 * k), d1 - d0, Math.max(0.3, 0.25 * k));
      x.fillStyle = rgba(lit, 0.9); for (const px of posts) x.fillRect(px - 1.0 * k, foot - 0.45 * k, 2.0 * k, Math.max(0.4, 0.45 * k));
      // the soft shadow the board throws on the roof (by day: along the sun; a faint one at night under the frame)
      const sh = x.createLinearGradient(0, foot + bh, 0, foot + bh + 4 * k), sa = 0.32 * day + 0.12;
      sh.addColorStop(0, `rgba(10,8,16,${sa.toFixed(3)})`); sh.addColorStop(1, 'rgba(10,8,16,0)');
      x.fillStyle = sh; x.fillRect(d0 + (sd > 0 ? -2 : 2) * k * day, foot + bh, d1 - d0, 4 * k);
    } else {
    // the A-frames: from the roof up to the deck, splayed; a tie across each; the X braces between them
    const legs = [0.13, 0.5, 0.87].map(f => R.x + R.w * f), spread = Math.min(R.w * 0.07, (foot - deckY) * 0.8);
    x.strokeStyle = rgba(steel); x.lineWidth = Math.max(0.5, 0.5 * k);
    x.beginPath(); for (const lx of legs) { x.moveTo(lx - spread, foot); x.lineTo(lx, deckY); x.moveTo(lx + spread, foot); x.lineTo(lx, deckY); } x.stroke();
    x.strokeStyle = rgba(lit, 0.9); x.lineWidth = Math.max(0.35, 0.3 * k);
    x.beginPath(); for (const lx of legs) { const ty = (foot + deckY) / 2; x.moveTo(lx - spread / 2, ty); x.lineTo(lx + spread / 2, ty); } x.stroke();
    x.strokeStyle = rgba(steel, 0.85); x.lineWidth = Math.max(0.3, 0.24 * k);
    x.beginPath(); for (let i = 0; i < legs.length - 1; i++) { x.moveTo(legs[i], foot - 0.3); x.lineTo(legs[i + 1], deckY + 0.4); x.moveTo(legs[i + 1], foot - 0.3); x.lineTo(legs[i], deckY + 0.4); } x.stroke();
    }
    // the ladder up to the catwalk (right of the middle A-frame)
    const lx0 = R.x + R.w * 0.7, lw = Math.max(1.4, 1.5 * k);
    x.strokeStyle = rgba(lit, 0.9); x.lineWidth = Math.max(0.3, 0.22 * k);
    x.beginPath(); x.moveTo(lx0, foot); x.lineTo(lx0, deckY); x.moveTo(lx0 + lw, foot); x.lineTo(lx0 + lw, deckY); for (let y = foot - 1.1 * k; y > deckY; y -= 1.1 * k) { x.moveTo(lx0, y); x.lineTo(lx0 + lw, y); } x.stroke();
    // the moulding round the poster (a wood frame, its top catching the light)
    x.strokeStyle = rgba(mould); x.lineWidth = Math.max(0.7, R.h * 0.04); x.strokeRect(R.x, R.y, R.w, R.h);
    if (day > 0.05) { x.strokeStyle = rgba([255, 244, 220], 0.4 * day); x.lineWidth = Math.max(0.3, R.h * 0.012); x.beginPath(); x.moveTo(R.x, R.y - R.h * 0.01); x.lineTo(R.x + R.w, R.y - R.h * 0.01); x.stroke(); }
    // THE CATWALK: the deck (planks) past both ends, the railing in front of the board's foot (posts, a top + a mid rail)
    const d0 = R.x - 2 * k, d1 = R.x + R.w + 2 * k;
    x.fillStyle = rgba(steel); x.fillRect(d0, deckY - 0.45 * k, d1 - d0, Math.max(0.7, 0.9 * k));
    if (day > 0.05) { x.fillStyle = rgba([255, 244, 220], 0.45 * day); x.fillRect(d0, deckY - 0.45 * k, d1 - d0, Math.max(0.25, 0.22 * k)); }
    x.strokeStyle = rgba(lit, 0.95); x.lineWidth = Math.max(0.25, 0.2 * k);
    x.beginPath(); x.moveTo(d0, railTop); x.lineTo(d1, railTop); x.moveTo(d0, (railTop + deckY) / 2); x.lineTo(d1, (railTop + deckY) / 2);
    for (let px = d0; px <= d1 + 0.01; px += Math.max(2.4, 3.2 * k)) { x.moveTo(px, railTop); x.lineTo(px, deckY); } x.stroke();
    drawGooseneck(x, lamps, day, sd);
  };
  const box = { x0: R.x - 3.5 * k - 1, y0: Math.min(...lamps.map(l => l.top)) - 1.5, x1: R.x + R.w + 3.5 * k + 1, y1: foot + (dun ? 9 * k : 1) };
  // the baked board (per look): its shadow on the roof by day, the poster (in the sun by day; unlit + dark at night), weathering, the
  // structure in the same sun + shade
  const dayDraw = (x, T) => {
    const day = Math.min(1, T.day + 0.8 * T.gold), sd = T.sunDir || 0;
    if (day > 0.05 && !dun) { x.fillStyle = `rgba(20,14,30,${0.22 * day})`; x.fillRect(R.x + (sd > 0 ? -1.4 : 1.4), R.y + 1.8, R.w, R.h); }
    poster(x, sd);
    x.fillStyle = `rgba(238,226,204,${0.1 * day})`; x.fillRect(R.x, R.y, R.w, R.h);
    x.fillStyle = `rgba(90,56,40,${0.14 * day})`; for (let i = 0; i < 5; i++) x.fillRect(R.x + R.w * (0.08 + i * 0.2), R.y, Math.max(0.3, R.w * 0.01), R.h * (0.16 + 0.08 * (i % 3)));
    // (unlit, dusk-dark at night; the lamps light it: nightS)
    const dk = Math.max(T.night, 1 - day) * 0.88;
    if (dk > 0.02) { x.fillStyle = `rgba(6,5,14,${dk})`; x.fillRect(R.x, R.y, R.w, R.h); }
    structure(x, day, sd);
  };
  // the board in its lamps' light: the poster × the warm pools (brightest at the top, falling off down the board), the catwalk +
  // railing catching the spill, the bulbs glowing under their shades (drawn over the dark board with the lamps' level)
  const nightS = sprite(box, 2, dpr, x => {
    poster(x, 0);
    const lightC = document.createElement('canvas'); lightC.width = Math.ceil(R.w * dpr); lightC.height = Math.ceil(R.h * dpr);
    const lx = safeCtx(lightC); lx.scale(dpr, dpr); lampLightMap(lx, R, litLamps, dun ? 0.17 : 0);
    x.globalCompositeOperation = 'multiply'; x.drawImage(lightC, R.x, R.y, R.w, R.h); lightC.width = lightC.height = 0;
    x.globalCompositeOperation = 'source-over';
    structure(x, 0, 0);
    // the catwalk + railing in the poster's spill (a faint warm edge)
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = rgba(LAMP_C, 0.22); x.lineWidth = Math.max(0.25, 0.22 * k);
    x.beginPath(); x.moveTo(R.x - 2 * k, railTop); x.lineTo(R.x + R.w + 2 * k, railTop); x.moveTo(R.x - 2 * k, deckY - 0.45 * k); x.lineTo(R.x + R.w + 2 * k, deckY - 0.45 * k); x.stroke(); x.restore();
    lampGlows(x, litLamps, R, 1);
  });
  // (8b1 — THE BILLPOSTER's sheets: the poster alone + the board's light on it now — by day the sun's wash, at night × the lamps' map)
  const light = (x, T) => {
    const day = Math.min(1, T.day + 0.8 * T.gold), dk = Math.max(T.night || 0, 1 - day);
    x.fillStyle = `rgba(238,226,204,${0.1 * day})`; x.fillRect(R.x, R.y, R.w, R.h);
    if (dk > 0.02) {
      const lc = document.createElement('canvas'); lc.width = Math.max(1, Math.ceil(R.w * 2)); lc.height = Math.max(1, Math.ceil(R.h * 2));
      const lx = safeCtx(lc); if (!lx) return; lx.scale(2, 2); lampLightMap(lx, R, litLamps, dun ? 0.17 : 0);
      x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = dk; x.drawImage(lc, R.x, R.y, R.w, R.h); x.restore(); lc.width = lc.height = 0;
    }
  };
  return { id: spot.id, spot, rect: R, content, dayDraw, nightS, lamps, poster, light, dead: ctx.dead == null ? null : ctx.dead };
}
export { MARKS };
