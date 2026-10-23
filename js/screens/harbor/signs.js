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

/** each game's sign colour (its accent; the same as the title's game tiles) */
export const SIGN_ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
/** the name a sign spells for a game (the blade word; NEON PAR keeps its space) */
export const signName = g => (bladeWord(g) === 'NEONPAR' ? 'NEON PAR' : bladeWord(g));
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
      tw = Math.max(0.7, Math.min(1.55, L2.lh * 0.14));
      parts.push({ tubes: L2.polys, col: mix(col, [255, 255, 255], 0.12), w: tw, hot: true, boxes: L2.boxes });
      bulbs = [];
      const per = roundRectPts(R.x + bl.ring, R.y + bl.ring, R.w - bl.ring * 2, R.h - bl.ring * 2, Math.min(R.w, R.h) * 0.12);
      let acc = 0;
      for (let i = 1; i < per.length; i++) { const [ax, ay] = per[i - 1], [bx, by] = per[i], d = Math.hypot(bx - ax, by - ay); for (let t = 0; t < d; t += 0.5) { acc += 0.5; if (acc >= 3.6 * k) { acc = 0; bulbs.push([ax + (bx - ax) * t / d, ay + (by - ay) * t / d]); } } }
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
/** a roof sign's steel frame (screen pt): fr = { roofY, legs: [x0, x1], beacon: [x, y] } */
function roofFrame(x, sg, fr, day, sd) {
  const R = sg.rect, gy = R.y + R.h, foot = fr.roofY, k = Math.max(0.5, R.h / 18);
  const steel = mix([20, 16, 28], [96, 84, 78], day), lit = mix([34, 28, 44], [168, 150, 128], day), dark = mix([10, 8, 16], [52, 44, 44], day);
  const [l0, l1] = fr.legs;
  // the girder under the cabinet (a little wider than it), its shadow side
  x.fillStyle = rgba(steel); x.fillRect(R.x - 0.8 * k, gy - 0.2, R.w + 1.6 * k, 1.1 * k);
  x.fillStyle = rgba(dark); x.fillRect(R.x - 0.8 * k, gy + 0.9 * k - 0.2, R.w + 1.6 * k, 0.35 * k);
  // the legs: lattice columns (two rails + zigzag lacing) from the roof to the girder, raking out to the cabinet's ends
  const tops = [R.x + R.w * 0.1, R.x + R.w * 0.9];
  x.lineCap = 'butt';
  [l0, l1].forEach((lx, i) => {
    const tx = tops[i], cw = 1.3 * k;
    x.strokeStyle = rgba(i === (sd > 0 ? 1 : 0) ? lit : steel); x.lineWidth = Math.max(0.35, 0.32 * k);
    x.beginPath(); x.moveTo(lx - cw / 2, foot); x.lineTo(tx - cw / 2, gy + 0.8 * k); x.moveTo(lx + cw / 2, foot); x.lineTo(tx + cw / 2, gy + 0.8 * k); x.stroke();
    x.lineWidth = Math.max(0.25, 0.2 * k); x.beginPath();
    const n = Math.max(3, Math.round((foot - gy) / (1.6 * k)));
    for (let j = 0; j < n; j++) { const a = j / n, b = (j + 1) / n, xa = lx + (tx - lx) * (1 - a), ya = foot + (gy + 0.8 * k - foot) * a, xb = lx + (tx - lx) * (1 - b), yb = foot + (gy + 0.8 * k - foot) * b; x.moveTo(xa + (j % 2 ? cw : -cw) / 2, ya); x.lineTo(xb + (j % 2 ? -cw : cw) / 2, yb); }
    x.stroke();
  });
  // the X braces between the legs, the catwalk rail just under the girder
  x.strokeStyle = rgba(steel, 0.85); x.lineWidth = Math.max(0.25, 0.22 * k);
  const mY = (foot + gy) / 2;
  x.beginPath(); x.moveTo(l0, foot - 0.6); x.lineTo((tops[1] + l1) / 2, mY); x.moveTo(l1, foot - 0.6); x.lineTo((tops[0] + l0) / 2, mY); x.stroke();
  x.strokeStyle = rgba(lit, 0.8); x.lineWidth = Math.max(0.25, 0.18 * k);
  x.beginPath(); x.moveTo(R.x + 1, gy + 2.2 * k); x.lineTo(R.x + R.w - 1, gy + 2.2 * k); for (let px = R.x + 2; px < R.x + R.w - 1; px += 3.2 * k) { x.moveTo(px, gy + 1.1 * k); x.lineTo(px, gy + 2.2 * k); } x.stroke();
  // the beacon's post on top of the cabinet (+ its little cage)
  const [bx, by] = fr.beacon;
  x.strokeStyle = rgba(steel); x.lineWidth = Math.max(0.35, 0.36 * k);
  x.beginPath(); x.moveTo(bx, R.y); x.lineTo(bx, by + 0.6 * k); x.stroke();
  x.fillStyle = rgba(dark); x.beginPath(); x.arc(bx, by + 0.4 * k, 0.75 * k, 0, Math.PI * 2); x.fill();
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
    if (sg.bulbs) { for (const [bx, by] of sg.bulbs) { x.fillStyle = rgba(mix([30, 24, 30], [230, 220, 200], day)); x.beginPath(); x.arc(bx, by, 0.55, 0, Math.PI * 2); x.fill(); } }
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
  for (const p of text) if (p.t.length) { const sp = p.hot ? sprite(bbox(p.t), Math.max(2.6, p.w * 3.4) * 2.6, dpr, x => { drawLit(x, p.t, p.col, { w: p.w, glow: Math.max(2.6, p.w * 3.4), a: 1, dpr }); }) : one(p.t, p.col, p.w); sp.role = 'text'; sp.box = bbox(p.t); out.push(sp); }
  return out;
}

// ------------------------------------------------------------------ BILLBOARDS (painted, 1920s; gooseneck lamps)
/** what a billboard shows: { game } → its name, its tag line, its mark, its colours; or { title, sub, col: [bg, ink] } (CITY CONTROL) */
export function billboardContent(show, games) {
  const g = games.find(x => x.id === (show && show.game)) || null;
  if (g) { const acc = accOf(g); return { title: g.name, sub: g.tag || '', game: g, bg: mix(acc, [30, 18, 40], 0.78), ink: mix(acc, [255, 246, 226], 0.35), acc }; }
  return { title: (show && show.title) || 'NEON SPEAKEASY', sub: (show && show.sub) || 'YOUR FRIENDS ARE ALREADY INSIDE', game: null, bg: (show && show.bg) || [40, 22, 48], ink: (show && show.ink) || [255, 214, 120], acc: (show && show.acc) || [255, 46, 151] };
}
/** a billboard's sprites: day (painted, weathered, sunlit), night (lit by its gooseneck lamps), the lamps' light */
export function buildBillboard(spot, content, ctx) {
  const R = spot.rect, dpr = ctx.dpr;
  // (the lamps keep their real size on a bigger board: an arm ~7 pt, a head ~4 pt — Part 4)
  const LH = Math.min(R.h, 22);
  const lamps = [0.18, 0.5, 0.82].map(f => ({ x: R.x + R.w * f, y: R.y - LH * 0.34 }));
  const paint = x => {
    // the board: the paper's ground, seams, the art
    x.fillStyle = rgba(content.bg); x.fillRect(R.x, R.y, R.w, R.h);
    const g = x.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.16)'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
    // the paper's seams (under the paint: never a line through the lettering)
    x.fillStyle = 'rgba(0,0,0,0.1)'; for (const f of [0.34, 0.67]) x.fillRect(R.x + R.w * f, R.y, 0.35, R.h);
    // NEON PASS 5 (the owner: the game's name was small beside the icon, hard to read): the mark SMALL in the top-left corner, the
    // NAME across the whole board under it, as big as the board allows (the condensed UI face: a long name still reads), one line
    const ms = R.h * 0.3, mx = R.x + R.w * 0.045, my = R.y + R.h * 0.07;
    if (content.game) {
      const m = markFor(content.game), s = ms / 100;
      x.save(); x.translate(mx, my); x.scale(s, s); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const t of m.tubes) { x.strokeStyle = t.col; x.lineWidth = 11; x.stroke(new Path2D(t.d)); }
      x.restore();
    }
    // (beside the mark, small, the tag line only if it really reads — at least 6.5 pt: on a phone it doesn't, the name has the board)
    const tx = R.x + R.w * 0.05, tw = R.w * 0.9;
    const FONT = fs => `700 ${fs}px "Chakra Petch", Orbitron, sans-serif`;
    const nameTop = content.game ? my + ms + R.h * 0.03 : R.y + R.h * 0.12, nameH = R.y + R.h * 0.95 - nameTop;
    let fs = nameH * 1.25; x.font = FONT(fs);
    while (fs > 3 && x.measureText(content.title).width > tw) { fs *= 0.95; x.font = FONT(fs); }
    let fs2 = R.h * 0.15; const sw = R.x + R.w * 0.96 - (mx + ms + R.w * 0.04); x.font = `600 ${fs2}px "Chakra Petch", sans-serif`;
    while (fs2 > 2 && x.measureText(content.sub).width > sw) { fs2 *= 0.92; x.font = `600 ${fs2}px "Chakra Petch", sans-serif`; }
    const sub = !content.game && fs2 >= 6.5 && content.sub;
    x.font = FONT(fs); x.fillStyle = rgba(content.ink); x.textBaseline = 'alphabetic';
    x.fillText(content.title, tx + (tw - x.measureText(content.title).width) / 2, nameTop + (nameH + fs * 0.7) / 2);
    if (sub) { x.font = `600 ${fs2}px "Chakra Petch", sans-serif`; x.fillStyle = rgba(mix(content.ink, content.bg, 0.25)); x.fillText(content.sub, mx + ms + R.w * 0.04, my + ms * 0.72); }
    // a peeled corner
    x.fillStyle = 'rgba(232,224,206,0.7)'; x.beginPath(); x.moveTo(R.x + R.w, R.y + R.h); x.lineTo(R.x + R.w - R.h * 0.18, R.y + R.h); x.lineTo(R.x + R.w, R.y + R.h - R.h * 0.2); x.fill();
  };
  const frame = (x, day) => {
    const steel = mix([20, 16, 26], [74, 66, 64], day);
    // the legs + braces to the roof, the catwalk under the board, the frame
    x.strokeStyle = rgba(steel); x.lineWidth = Math.max(0.5, R.h * 0.04);
    const foot = Math.max(R.y + R.h + 3, ctx.roofY || R.y + R.h + 6);
    x.beginPath(); for (const f of [0.12, 0.5, 0.88]) { x.moveTo(R.x + R.w * f, R.y + R.h); x.lineTo(R.x + R.w * f, foot); } x.moveTo(R.x + R.w * 0.12, R.y + R.h + 1); x.lineTo(R.x + R.w * 0.5, foot); x.moveTo(R.x + R.w * 0.88, R.y + R.h + 1); x.lineTo(R.x + R.w * 0.5, foot); x.stroke();
    x.fillStyle = rgba(steel); x.fillRect(R.x - 1, R.y + R.h, R.w + 2, Math.max(0.6, R.h * 0.06));
    x.fillRect(R.x - 1, R.y + R.h + R.h * 0.06 - 2.2, 0.4, 2.2); x.fillRect(R.x + R.w + 0.6, R.y + R.h + R.h * 0.06 - 2.2, 0.4, 2.2);
    x.strokeStyle = rgba(mix([30, 24, 34], [120, 104, 88], day)); x.lineWidth = Math.max(0.5, R.h * 0.05); x.strokeRect(R.x, R.y, R.w, R.h);
    // the gooseneck lamps: an arm curving out over the board, a shade pointing down at it
    x.strokeStyle = rgba(steel); x.lineWidth = Math.max(0.45, R.h * 0.035);
    for (const l of lamps) {
      x.beginPath(); x.moveTo(l.x, R.y); x.quadraticCurveTo(l.x, l.y, l.x + LH * 0.12, l.y); x.stroke();
      x.fillStyle = rgba(mix([24, 20, 30], [60, 70, 66], day)); x.beginPath(); x.moveTo(l.x + LH * 0.04, l.y - 0.4); x.lineTo(l.x + LH * 0.26, l.y + LH * 0.08); x.lineTo(l.x + LH * 0.02, l.y + LH * 0.1); x.fill();
    }
  };
  const box = { x0: R.x - 2, y0: R.y - LH * 0.5, x1: R.x + R.w + 2, y1: Math.max(R.y + R.h + 4, ctx.roofY || 0) };
  // THE DAY PASS — the board by day is a 1920s PAINTED POSTER: the game's enamel colours, a Deco sunburst behind its mark painted big,
  // the NAME across the whole board under it (gold leaf / keyline + a drop shadow) — a bold image + a big word, no small text
  const poster = (x, sd) => {
    const pt = dayPaint(content.game, content.acc);
    x.fillStyle = rgba(pt.face); x.fillRect(R.x, R.y, R.w, R.h);
    const FONT = fs => `700 ${fs}px "Chakra Petch", Orbitron, sans-serif`, tw = R.w * 0.84;
    let fs = R.h * 0.62; x.font = FONT(fs);
    while (fs > 3 && x.measureText(content.title).width > tw) { fs *= 0.96; x.font = FONT(fs); }
    const base = R.y + R.h * 0.9, capH = fs * 0.7, top = R.y + R.h * 0.07, imgB = base - capH - R.h * 0.08, ih = imgB - top;
    // the sunburst: rays fanning up from behind the mark, a lighter tint of the board, clipped to the image's band
    const cx = R.x + R.w / 2, cy = imgB + ih * 0.15;
    x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, imgB - R.y + 0.5); x.clip();
    x.fillStyle = rgba(mix(pt.face, pt.light ? [255, 250, 236] : pt.edge, pt.light ? 0.5 : 0.22));
    const n = 14, Rr = R.w * 0.8;
    for (let i = 0; i < n; i += 2) { const a0 = Math.PI + i * Math.PI / n, a1 = a0 + Math.PI / n; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a0) * Rr, cy + Math.sin(a0) * Rr); x.lineTo(cx + Math.cos(a1) * Rr, cy + Math.sin(a1) * Rr); x.fill(); }
    x.restore();
    // a band under the image (the poster's rule line) in the edge colour
    x.fillStyle = rgba(pt.edge, 0.9); x.fillRect(R.x + R.w * 0.04, imgB + R.h * 0.02, R.w * 0.92, Math.max(0.5, R.h * 0.025));
    if (content.game && ih > 4) {
      const m = markFor(content.game), ms = ih * 0.96, s2 = ms / 100, mx = cx - ms / 2, my = top + (ih - ms) / 2;
      const lw = 12;
      x.save(); x.translate(mx, my); x.scale(s2, s2); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const t of m.tubes) { const p = new Path2D(t.d); x.save(); x.translate((sd > 0 ? -1 : 1) * 4, 5); x.strokeStyle = rgba(pt.shade, 0.45); x.lineWidth = lw + 9; x.stroke(p); x.restore(); }
      for (const t of m.tubes) { const p = new Path2D(t.d); x.strokeStyle = rgba(pt.edge); x.lineWidth = lw + 7; x.stroke(p); }
      for (const t of m.tubes) { const p = new Path2D(t.d); x.strokeStyle = rgba(mix(hexRgb(t.col), pt.ink, 0.45)); x.lineWidth = lw; x.stroke(p); }
      x.restore();
    }
    // the name: shadow → keyline → the letters → the sun on their top
    const nw = x.measureText(content.title).width, nx = R.x + (R.w - nw) / 2;
    x.lineJoin = 'round';
    x.fillStyle = rgba(pt.shade, 0.5); x.fillText(content.title, nx + (sd > 0 ? -1 : 1) * fs * 0.05, base + fs * 0.06);
    x.strokeStyle = rgba(pt.edge); x.lineWidth = Math.max(0.6, fs * 0.1); x.strokeText(content.title, nx, base);
    x.fillStyle = rgba(pt.ink); x.fillText(content.title, nx, base);
    x.save(); x.beginPath(); x.rect(R.x, base - capH, R.w, capH * 0.32); x.clip(); x.fillStyle = rgba(mix(pt.ink, [255, 252, 240], 0.35), 0.6); x.fillText(content.title, nx, base); x.restore();
    // the paper: seams, a sun-faded top, a peeled corner
    x.fillStyle = 'rgba(0,0,0,0.08)'; for (const f of [0.34, 0.67]) x.fillRect(R.x + R.w * f, R.y, 0.35, R.h);
    const g = x.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, 'rgba(255,248,230,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
    x.fillStyle = 'rgba(232,224,206,0.75)'; x.beginPath(); x.moveTo(R.x + R.w, R.y + R.h); x.lineTo(R.x + R.w - R.h * 0.18, R.y + R.h); x.lineTo(R.x + R.w, R.y + R.h - R.h * 0.2); x.fill();
  };
  // day: painted + weathered + the sun's shading
  const dayDraw = (x, T) => {
    const day = Math.min(1, T.day + 0.8 * T.gold);
    if (day > 0.05) { x.fillStyle = `rgba(20,14,30,${0.25 * day})`; x.fillRect(R.x + 1.5, R.y + 2, R.w, R.h); }
    // (the poster by day; the night's lamp-lit board under it, unchanged — the poster fades out with the day)
    paint(x);
    if (day > 0.02) { x.save(); x.globalAlpha = Math.min(1, day * 1.15); poster(x, T.sunDir || 0); x.restore(); }
    // weathered by day (faded, streaks), dusk-dark at night (the unlit board)
    x.fillStyle = `rgba(238,226,204,${0.12 * day})`; x.fillRect(R.x, R.y, R.w, R.h);
    x.fillStyle = `rgba(90,56,40,${0.16 * day})`; for (let i = 0; i < 5; i++) x.fillRect(R.x + R.w * (0.08 + i * 0.2), R.y, Math.max(0.3, R.w * 0.01), R.h * (0.2 + 0.1 * (i % 3)));
    if (T.night > 0.02) { x.fillStyle = `rgba(6,5,14,${0.86 * T.night})`; x.fillRect(R.x, R.y, R.w, R.h); }
    frame(x, day);
  };
  // night: the board as its three lamps light it — bright under each lamp, falling off to the edges — and the lamps' light
  const nightS = sprite(box, 3, dpr, x => {
    paint(x);
    // the lamps' light on the paper: bright under each lamp (warm), falling off down the board and between the lamps
    const lightC = document.createElement('canvas'); lightC.width = Math.ceil(R.w * dpr); lightC.height = Math.ceil(R.h * dpr);
    const lx = lightC.getContext('2d'); lx.scale(dpr, dpr); lx.fillStyle = 'rgb(46,38,52)'; lx.fillRect(0, 0, R.w, R.h); lx.globalCompositeOperation = 'lighter';
    for (const l of lamps) { const cx = l.x - R.x + R.h * 0.15, g = lx.createRadialGradient(cx, 0, 0, cx, R.h * 0.25, R.h * 1.1); g.addColorStop(0, 'rgba(255,236,200,0.95)'); g.addColorStop(0.55, 'rgba(230,190,140,0.5)'); g.addColorStop(1, 'rgba(160,120,90,0)'); lx.fillStyle = g; lx.fillRect(0, 0, R.w, R.h); }
    x.globalCompositeOperation = 'multiply'; x.drawImage(lightC, R.x, R.y, R.w, R.h); lightC.width = lightC.height = 0;
    x.globalCompositeOperation = 'source-over';
    frame(x, 0);
    for (const l of lamps) { const g = x.createRadialGradient(l.x + LH * 0.15, l.y + LH * 0.08, 0, l.x + LH * 0.15, l.y + LH * 0.08, LH * 0.25); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,200,130,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(l.x - LH * 0.2, l.y - LH * 0.2, LH * 0.7, LH * 0.6); }
  });
  return { id: spot.id, spot, rect: R, content, dayDraw, nightS, lamps };
}
export { MARKS };
