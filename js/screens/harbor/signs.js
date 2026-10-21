// CITY 2.0 — THE HARBOR, Part 3: THE SIGNS, built like real sign-shop neon (docs/harbor.md#signs). Each sign is a few sprites:
//   the HOUSING (per look: the cabinet with its depth, enamel and trim, brackets to the wall or a scaffold to the roof, the
//   unlit glass tubes — by day weathered paint, sunlit glass, a cast shadow; at night a dark cabinet) and its LIT PARTS (the
//   border tube, the game's mark, the name — each its own sprite so they buzz on one by one), drawn additively with the power.
//   Types: vbox (vertical: the name stacked, the mark on top) · box (horizontal) · icon (the game's tube mark on a raceway) ·
//   script (open tube letters on a raceway: JAZZ) · billboard (a painted 1920s board, gooseneck lamps lighting it at night).
// The games' marks + the tube alphabet are district/marks.js (the same marks as City 1.0's signs and the tube logos).
import { MARKS, LETTERS, markFor, bladeWord, hexRgb } from '../district/marks.js';
import { flattenPath } from '../../core/harbor-neon.js';
import { tube, drawLit, drawGlass, sprite, bbox, mix, rgba } from './tubes.js';

/** each game's sign colour (its accent; the same as the title's game tiles) */
export const SIGN_ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
/** the name a sign spells for a game (the blade word; NEON PAR keeps its space) */
export const signName = g => (bladeWord(g) === 'NEONPAR' ? 'NEON PAR' : bladeWord(g));
const accOf = g => hexRgb(SIGN_ACC[g.id] || (markFor(g).tubes[0] || {}).col || '#9fd8ff');
const ICE = [214, 240, 255];

// tube letters along a line / down a column, in a box: → tubes (screen pt)
function lettersRow(text, x0, y0, w, h, { skew = 0 } = {}) {
  const ch = [...text], n = ch.length, lh = Math.min(h, (w / Math.max(1, n)) / 0.86 * (14 / 10)), s = lh / 14, lw = 10 * s, gap = Math.max(0, (w - n * lw) / Math.max(1, n));
  const used = n * lw + (n - 1) * Math.min(gap, lw * 0.35), ox = x0 + (w - used) / 2, oy = y0 + (h - lh) / 2;
  const out = [];
  ch.forEach((c, i) => { const d = LETTERS[c]; if (!d) return; const lx = ox + i * (lw + Math.min(gap, lw * 0.35)); for (const p of flattenPath(d, s, lx, oy, 1)) out.push(skewP(p, skew, oy + lh)); });
  return { polys: out, lh };
}
function lettersCol(text, x0, y0, w, h) {
  const ch = [...text], n = ch.length, lh = Math.min(w * 0.64 * 1.4, h / Math.max(1, n) * 0.8), s = lh / 14, lw = 10 * s, step = h / Math.max(1, n);
  const out = [];
  ch.forEach((c, i) => { const d = LETTERS[c]; if (!d) return; for (const p of flattenPath(d, s, x0 + (w - lw) / 2, y0 + i * step + (step - lh) / 2, 1)) out.push(p); });
  return { polys: out, lh };
}
const skewP = (p, k, base) => (k ? { ...p, pts: p.pts.map(([x, y]) => [x + (base - y) * k, y]) } : p);
// a mark (0..100 box) into a square: → [{ polys, col }]
function markTubes(g, x0, y0, size) {
  const m = markFor(g), s = size / 100;
  return m.tubes.map(t => ({ polys: flattenPath(t.d, s, x0, y0, 1), col: hexRgb(t.col) }));
}
const roundRectPts = (x, y, w, h, r) => {
  const p = [], seg = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i * Math.PI / 8; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  seg(x + w - r, y + r, -Math.PI / 2); seg(x + w - r, y + h - r, 0); seg(x + r, y + h - r, Math.PI / 2); seg(x + r, y + r, Math.PI); p.push(p[0]);
  return p;
};

/**
 * Build a sign: spot (core/harbor-neon.js#signSpots, with .rect on screen), game (or null for a fixed sign), ctx: { W, dpr,
 * roofY (for a roof mount: the screen y its scaffold stands on), s (pt per reference pt: the city's scale) }.
 * → { id, game, rect, parts: [{ tubes, col, w }], border, bulbs?, housing(T) → sprite, lit() → [sprites], billboard? }
 */
export function buildSign(spot, game, ctx) {
  const R = spot.rect, k = ctx.s || 1, mid = R.x + R.w / 2 < ctx.W / 2;     // (the side face toward the middle shows)
  const col = spot.col || (game ? accOf(game) : ICE);
  const parts = [];
  let panel = null, border = null, bulbs = null, tw = Math.max(0.6, Math.min(1.2, R.w * 0.085));
  if (spot.type === 'vbox' || spot.type === 'box') {
    const text = spot.text || signName(game);
    panel = { x: R.x, y: R.y, w: R.w, h: R.h, r: Math.min(R.w, R.h) * 0.12 };
    const pad = Math.min(R.w, R.h) * 0.16;
    border = { pts: roundRectPts(R.x + pad * 0.45, R.y + pad * 0.45, R.w - pad * 0.9, R.h - pad * 0.9, Math.min(R.w, R.h) * 0.1), col: spot.id === 'hotel' ? [255, 236, 214] : mix(col, ICE, 0.55) };
    if (spot.type === 'vbox') {
      // (the mark on top only where it reads: a wide cabinet — on a slim one a small mark reads as a letter)
      const markH = game && R.w >= 14 && R.h > R.w * (text.length + 2.2) * 0.9 ? R.w * 0.86 : 0;
      if (markH) for (const m of markTubes(game, R.x + (R.w - markH) / 2, R.y + pad * 0.9, markH)) parts.push({ tubes: m.polys, col: m.col, w: tw * 0.85, mark: true });
      const L2 = lettersCol(text.replace(/ /g, ' '), R.x + pad, R.y + pad + (markH ? markH + pad * 0.6 : 0), R.w - pad * 2, R.h - pad * 2 - (markH ? markH + pad * 0.6 : 0));
      tw = Math.max(0.55, Math.min(1.25, L2.lh * 0.13));
      parts.push({ tubes: L2.polys, col, w: tw });
    } else {
      const ms = game ? R.h - pad * 2 : 0;
      if (ms) for (const m of markTubes(game, R.x + pad, R.y + pad, ms)) parts.push({ tubes: m.polys, col: m.col, w: tw * 0.85, mark: true });
      const L2 = lettersRow(text, R.x + pad + (ms ? ms + pad * 0.6 : 0), R.y + pad, R.w - pad * 2 - (ms ? ms + pad * 0.6 : 0), R.h - pad * 2);
      tw = Math.max(0.55, Math.min(1.25, L2.lh * 0.13));
      parts.push({ tubes: L2.polys, col, w: tw });
    }
    if (spot.id === 'hotel') {
      // the HOTEL's chaser bulbs: round the panel, every ~3.4 pt
      bulbs = [];
      const per = roundRectPts(R.x + 0.9, R.y + 0.9, R.w - 1.8, R.h - 1.8, Math.min(R.w, R.h) * 0.12);
      let acc = 0;
      for (let i = 1; i < per.length; i++) { const [ax, ay] = per[i - 1], [bx, by] = per[i], d = Math.hypot(bx - ax, by - ay); for (let t = 0; t < d; t += 0.5) { acc += 0.5; if (acc >= 3.4 * k) { acc = 0; bulbs.push([ax + (bx - ax) * t / d, ay + (by - ay) * t / d]); } } }
      border = null;
    }
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
  const sign = { id: spot.id, spot, game: game ? game.id : null, rect: R, col, parts, panel, border, bulbs, mid, kind: spot.kind, type: spot.type };
  sign.housing = (T, dpr) => housing(sign, T, dpr, ctx);
  sign.lit = (dpr, scheme) => litSprites(sign, dpr);
  return sign;
}

// ------------------------------------------------------------------ the housing (per look)
function housing(sg, T, dpr, ctx) {
  const R = sg.rect, day = Math.min(1, T.day + 0.8 * T.gold), night = T.night, sd = T.sunDir || 0;
  const all = [...sg.parts.flatMap(p => p.t), ...(sg.border ? sg.border.t : [])];
  const b = all.length ? bbox(all) : { x0: R.x, y0: R.y, x1: R.x + R.w, y1: R.y + R.h };
  const box = { x0: Math.min(b.x0, R.x) - 3, y0: Math.min(b.y0, R.y) - 3, x1: Math.max(b.x1, R.x + R.w) + 3, y1: Math.max(b.y1, R.y + R.h, ctx.roofY || 0) + 3 };
  return sprite(box, 2, dpr, x => drawHousing(x, sg, T, ctx));
}
/** the housing drawn straight into a context (the facade bake: the signs' cabinets are static per look) */
export function drawHousing(x, sg, T, ctx) {
  const R = sg.rect, day = Math.min(1, T.day + 0.8 * T.gold), sd = T.sunDir || 0;
  {
    const enamelDay = sg.game ? mix(mix(sg.col, [40, 36, 48], 0.72), [92, 84, 80], 0.25) : [70, 32, 34];
    const enamel = mix([14, 11, 22], enamelDay, day);
    const trim = mix([40, 34, 50], [214, 196, 160], day);
    // the scaffold to the roof (a roof mount): two legs + a cross brace
    if (sg.spot.mount === 'roof' && ctx.roofY > R.y + R.h) {
      x.strokeStyle = rgba(mix([22, 18, 30], [70, 60, 58], day), 1); x.lineWidth = Math.max(0.5, R.w * 0.05);
      x.beginPath(); for (const f of [0.18, 0.82]) { x.moveTo(R.x + R.w * f, R.y + R.h); x.lineTo(R.x + R.w * f, ctx.roofY); }
      x.moveTo(R.x + R.w * 0.18, R.y + R.h + 1); x.lineTo(R.x + R.w * 0.82, ctx.roofY); x.stroke();
    }
    if (sg.panel) {
      const P = sg.panel;
      // the cast shadow on the wall (day)
      if (day > 0.05) { x.fillStyle = `rgba(20,14,30,${0.25 * day})`; x.beginPath(); x.roundRect(P.x + (sd > 0 ? -1.2 : 1.2), P.y + 1.6, P.w, P.h, P.r); x.fill(); }
      // the brackets (wall side): two arms
      x.fillStyle = rgba(mix([18, 14, 24], [60, 52, 52], day));
      const bx = sg.mid ? P.x + P.w : P.x - 1.6;
      for (const f of [0.12, 0.88]) x.fillRect(bx, P.y + P.h * f - 0.5, 1.6, 1);
      // the depth: the cabinet's side toward the middle
      const dw = Math.max(0.8, Math.min(2, P.w * 0.14));
      x.fillStyle = rgba(mix(enamel, [0, 0, 0], 0.4)); x.beginPath(); x.roundRect(sg.mid ? P.x + P.w - 0.5 : P.x - dw + 0.5, P.y + 0.6, dw, P.h - 0.6, P.r * 0.5); x.fill();
      // the face: enamel, the trim, the top catching the light
      x.fillStyle = rgba(enamel); x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill();
      x.strokeStyle = rgba(trim, 0.9); x.lineWidth = Math.max(0.4, P.w * 0.04); x.stroke();
      if (day > 0.05) {
        const g = x.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
        g.addColorStop(0, `rgba(255,248,230,${0.16 * day})`); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(20,10,20,${0.18 * day})`);
        x.fillStyle = g; x.beginPath(); x.roundRect(P.x, P.y, P.w, P.h, P.r); x.fill();
        // weathering: a few streaks under the bottom edge + faded blotches
        x.fillStyle = `rgba(90,60,40,${0.18 * day})`;
        for (let i = 0; i < 3; i++) x.fillRect(P.x + P.w * (0.2 + 0.3 * i), P.y + P.h * 0.55, Math.max(0.3, P.w * 0.05), P.h * 0.45);
      }
    } else if (sg.type === 'script' || sg.type === 'icon') {
      // the raceway: a slim painted metal bar the tubes are mounted on (the transformers inside)
      x.fillStyle = rgba(mix([16, 12, 22], [96, 84, 76], day), 0.95);
      const rh = Math.max(1, R.h * 0.18);
      x.beginPath(); x.roundRect(R.x + R.w * 0.04, R.y + R.h * 0.52 - rh / 2, R.w * 0.92, rh, rh * 0.3); x.fill();
      if (day > 0.05) { x.fillStyle = `rgba(255,250,230,${0.25 * day})`; x.fillRect(R.x + R.w * 0.04, R.y + R.h * 0.52 - rh / 2, R.w * 0.92, Math.max(0.3, rh * 0.25)); }
    }
    // the bulbs' sockets (HOTEL)
    if (sg.bulbs) { for (const [bx, by] of sg.bulbs) { x.fillStyle = rgba(mix([30, 24, 30], [230, 220, 200], day)); x.beginPath(); x.arc(bx, by, 0.55, 0, Math.PI * 2); x.fill(); } }
    // the glass tubes, unlit (clear glass by day; dark at night)
    for (const p of sg.parts) drawGlass(x, p.t, p.col, T, { w: p.w, clipEvery: 18 });
    if (sg.border) drawGlass(x, sg.border.t, sg.border.col, T, { w: sg.border.t[0] ? sg.parts[0] ? sg.parts[0].w * 0.75 : 0.7 : 0.7, clips: false, shadow: false });
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
    out.push(sprite(b, glow * 2.6, dpr, x => { for (const p of marks) drawLit(x, p.t, p.col, { w: p.w, glow, a: 1, dpr }); }));
  }
  for (const p of text) if (p.t.length) out.push(one(p.t, p.col, p.w));
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
  const lamps = [0.18, 0.5, 0.82].map(f => ({ x: R.x + R.w * f, y: R.y - R.h * 0.34 }));
  const paint = x => {
    // the board: the paper's ground, seams, the art
    x.fillStyle = rgba(content.bg); x.fillRect(R.x, R.y, R.w, R.h);
    const g = x.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.16)'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
    // the mark, painted (flat strokes in its colours) on the left; the name + the tag line on the right
    const ms = R.h * 0.78;
    if (content.game) {
      const m = markFor(content.game), s = ms / 100;
      x.save(); x.translate(R.x + R.h * 0.12, R.y + (R.h - ms) / 2); x.scale(s, s); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const t of m.tubes) { x.strokeStyle = t.col; x.lineWidth = 9; x.stroke(new Path2D(t.d)); }
      x.restore();
    }
    const tx = R.x + (content.game ? R.h * 0.12 + ms + R.h * 0.1 : R.w * 0.06), tw = R.x + R.w - R.w * 0.04 - tx;
    let fs = R.h * 0.36;
    x.font = `900 ${fs}px Orbitron, "Chakra Petch", sans-serif`;
    while (fs > 3 && x.measureText(content.title).width > tw) { fs *= 0.92; x.font = `900 ${fs}px Orbitron, "Chakra Petch", sans-serif`; }
    x.fillStyle = rgba(content.ink); x.textBaseline = 'alphabetic'; x.fillText(content.title, tx, R.y + R.h * 0.5 + fs * 0.35);
    let fs2 = R.h * 0.17; x.font = `600 ${fs2}px "Chakra Petch", sans-serif`;
    while (fs2 > 2 && x.measureText(content.sub).width > tw) { fs2 *= 0.92; x.font = `600 ${fs2}px "Chakra Petch", sans-serif`; }
    x.fillStyle = rgba(mix(content.ink, content.bg, 0.25)); x.fillText(content.sub, tx, R.y + R.h * 0.84);
    // the paper's seams + a peeled corner
    x.fillStyle = 'rgba(0,0,0,0.14)'; for (const f of [0.34, 0.67]) x.fillRect(R.x + R.w * f, R.y, 0.35, R.h);
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
      x.beginPath(); x.moveTo(l.x, R.y); x.quadraticCurveTo(l.x, l.y, l.x + R.h * 0.12, l.y); x.stroke();
      x.fillStyle = rgba(mix([24, 20, 30], [60, 70, 66], day)); x.beginPath(); x.moveTo(l.x + R.h * 0.04, l.y - 0.4); x.lineTo(l.x + R.h * 0.26, l.y + R.h * 0.08); x.lineTo(l.x + R.h * 0.02, l.y + R.h * 0.1); x.fill();
    }
  };
  const box = { x0: R.x - 2, y0: R.y - R.h * 0.5, x1: R.x + R.w + 2, y1: Math.max(R.y + R.h + 4, ctx.roofY || 0) };
  // day: painted + weathered + the sun's shading
  const dayS = T => sprite(box, 3, dpr, x => dayDraw(x, T));
  const dayDraw = (x, T) => {
    const day = Math.min(1, T.day + 0.8 * T.gold);
    if (day > 0.05) { x.fillStyle = `rgba(20,14,30,${0.25 * day})`; x.fillRect(R.x + 1.5, R.y + 2, R.w, R.h); }
    paint(x);
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
    for (const l of lamps) { const g = x.createRadialGradient(l.x + R.h * 0.15, l.y + R.h * 0.08, 0, l.x + R.h * 0.15, l.y + R.h * 0.08, R.h * 0.25); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,200,130,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(l.x - R.h * 0.2, l.y - R.h * 0.2, R.h * 0.7, R.h * 0.6); }
  });
  return { id: spot.id, spot, rect: R, content, dayS, dayDraw, nightS, lamps };
}
export { MARKS };
