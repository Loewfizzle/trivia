// PRISM DROP — THE PAPER CUT-OUT SKIN's DRAWINGS (SKINS 1 — the owner's spec: docs/games/plan.md "SKINS 1 — PAPER CUT-OUT"; docs/prism.md
// "THE SKINS"). Every piece of paper is PRE-CUT ONCE into a cached sprite at the board's full pixel ratio — the frame loop only blits.
//   THE BLOCK: a MATTE square of coloured paper (the piece's colour lifted a touch toward white), cut by hand — its four edges a little uneven,
//   turned a hair (±1.5°), the paper's fibre speckle, a thin WHITE top edge (the sheet's thickness catching the light) and a soft DROP SHADOW
//   BAKED INTO THE SPRITE (it lies on the sheet under it). SIX variants a colour (the cut, the turn, the fibres). Junk = grey card.
//   + the landing ghost (a DASHED CUT LINE), the danger drain (the square in grey), the INCOMING rows' grey card stock, the scraps (a slam's
//   puff, a cancel, a big clear's confetti) and the STRIP's shadow (the peel — paperfx.js).
//   paperSprite(size, kind, t, v) · scrapSprite(size, color, k) · warmPaper(size, ms) · clearPaper()
import { mixHex } from './neon.js';
import { seeded, spriteCache, newCanvas, rgba } from './skin-kit.js';

export const VARIANTS = 6;
// the papers: 1 long (turquoise) · 2 square (yellow) · 3 twist (violet) · 4 S (green) · 5 Z (red) · 6 J (blue) · 7 L (orange) · 8 junk (grey card)
// — the SAME colour families as every skin, each lifted a touch toward white: matte construction paper (tests/prism-skins.test.mjs: the hue test)
export const CUT = Object.freeze([null, '#35bccd', '#f5c33a', '#9a70dc', '#49b572', '#e75b72', '#5283de', '#f4944a', '#a3a19c']);
export const CARD = '#b9b6b0';       // the incoming rows' grey card stock
export const CUT_LINE = '#5a4a38';   // the ghost's + the frame's dashed cut line
const SHADOW = '60, 38, 10';

const cache = spriteCache();

/** a hand-cut square: four corners nudged, each edge with one small kink (scissors never run dead straight), turned by `rot` */
function cutPath(x, size, rnd, inset, rot) {
  const c = size / 2, h = size / 2 - inset, j = () => (rnd() - 0.5) * size * 0.028;
  const P = [[-h + j(), -h + j()], [h + j(), -h + j()], [h + j(), h + j()], [-h + j(), h + j()]];
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const T = ([px, py]) => [c + px * cs - py * sn, c + px * sn + py * cs];
  x.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = P[i], b = P[(i + 1) % 4], t = 0.3 + rnd() * 0.4;
    const k = [a[0] + (b[0] - a[0]) * t + (i % 2 ? j() * 0.5 : 0), a[1] + (b[1] - a[1]) * t + (i % 2 ? 0 : j() * 0.5)];
    const A = T(a), K = T(k);
    if (i) x.lineTo(A[0], A[1]); else x.moveTo(A[0], A[1]);
    x.lineTo(K[0], K[1]);
  }
  x.closePath();
  return { P: P.map(T) };
}

/** THE BLOCK: the shadow, the matte paper, the fibres, the white top edge. o: { junk, grey, card (the incoming rows' stock), hot } */
function blockArt(size, col, v, o = {}) {
  const c = newCanvas(size), x = c.getContext('2d');
  const seed = v * 6151 + 29 + Math.round(parseInt(col.slice(1), 16) % 991);
  const rot = ((seeded(seed + 1)() - 0.5) * 2) * (1.5 * Math.PI / 180);
  const inset = size * 0.065;
  // the shadow BAKED IN: the paper lies a hair above the sheet (light from the top-left)
  x.save();
  x.shadowColor = `rgba(${SHADOW}, ${o.card ? 0.3 : 0.42})`;
  x.shadowBlur = size * 0.07;
  x.shadowOffsetX = size * 0.018;
  x.shadowOffsetY = size * 0.04;
  cutPath(x, size, seeded(seed), inset, rot);
  x.fillStyle = col;
  x.fill();
  x.restore();
  // the paper itself (drawn again over its shadow's bleed), matte: a barely-there fall of light across it
  const { P } = cutPath(x, size, seeded(seed), inset, rot);
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, mixHex(col, '#ffffff', 0.07));
  g.addColorStop(1, mixHex(col, '#000000', 0.045));
  x.fillStyle = g;
  x.fill();
  x.save();
  x.clip();
  // the fibres: short pale + dark flecks, a few longer threads
  const r = seeded(seed + 7);
  for (let i = 0; i < 46; i++) {
    const fx = r() * size, fy = r() * size, a = r() * Math.PI, l = size * (0.012 + r() * (i % 9 === 0 ? 0.09 : 0.03));
    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l);
    x.lineWidth = Math.max(0.7, size * 0.008);
    x.strokeStyle = i % 2 ? `rgba(255,255,255,${0.2 + r() * 0.16})` : `rgba(40,25,10,${0.07 + r() * 0.07})`;
    x.stroke();
  }
  x.restore();
  // the thin WHITE top edge (the sheet's thickness) + the left edge fainter; a hairline of shade along the bottom + right
  x.lineCap = 'round';
  x.beginPath(); x.moveTo(P[0][0], P[0][1]); x.lineTo(P[1][0], P[1][1]);
  x.lineWidth = Math.max(1.2, size * 0.028);
  x.strokeStyle = `rgba(255,255,255,${o.card ? 0.6 : 0.88})`;
  x.stroke();
  x.beginPath(); x.moveTo(P[0][0], P[0][1]); x.lineTo(P[3][0], P[3][1]);
  x.lineWidth = Math.max(1, size * 0.016);
  x.strokeStyle = 'rgba(255,255,255,0.4)';
  x.stroke();
  x.beginPath(); x.moveTo(P[1][0], P[1][1]); x.lineTo(P[2][0], P[2][1]); x.lineTo(P[3][0], P[3][1]);
  x.lineWidth = Math.max(1, size * 0.014);
  x.strokeStyle = rgba(mixHex(col, '#2a1808', 0.5), 0.5);
  x.stroke();
  if (o.hot) {
    // a due row: the card's edge inked darker all round
    cutPath(x, size, seeded(seed), inset, rot);
    x.lineWidth = Math.max(1.5, size * 0.035);
    x.strokeStyle = 'rgba(70, 60, 52, 0.85)';
    x.stroke();
  }
  return c;
}
/** where the falling piece lands: a DASHED CUT LINE (cut here) */
function ghostArt(size) {
  const c = newCanvas(size), x = c.getContext('2d'), p = size * 0.09, s = size - 2 * p;
  x.setLineDash([size * 0.13, size * 0.09]);
  x.lineWidth = Math.max(1.2, size * 0.032);
  x.strokeStyle = rgba(CUT_LINE, 0.62);
  x.strokeRect(p, p, s, s);
  return c;
}

const greyOf = h => { const n = parseInt(h.slice(1), 16); const l = Math.round(((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.55 + (n & 255) * 0.15) * 0.55 + 92); const z = Math.max(0, Math.min(255, l)).toString(16).padStart(2, '0'); return `#${z}${z}${z}`; };

/** a paper sprite (cached): kind block | grey | ghost | incoming | ihot; t = the piece (1–7, 8 junk); v = the variant (0–5) */
export function paperSprite(size, kind, t, v = 0) {
  const vv = kind === 'block' ? v % VARIANTS : 0;
  return cache.get(`${size}|${kind}|${t}|${vv}`, () => {
    const col = CUT[t] || CUT[8];
    if (kind === 'block') return blockArt(size, col, vv, { junk: t === 8 });
    if (kind === 'grey') return blockArt(size, greyOf(col), 1, { junk: true, grey: true });
    if (kind === 'ghost') return ghostArt(size);
    if (kind === 'incoming' || kind === 'ihot') return blockArt(size, kind === 'ihot' ? '#a9a5a0' : CARD, kind === 'ihot' ? 2 : 4, { card: true, hot: kind === 'ihot' });
    return blockArt(size, col, 0);
  });
}
/** a SCRAP (a snip of paper — a slam's puff, a cancelled row, a big clear's confetti): a small uneven quad, k = its shape (0–2) */
export function scrapSprite(size, color, k = 0) {
  size = Math.max(4, Math.round(size));
  return cache.get(`scrap|${size}|${color}|${k}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), r = seeded(k * 97 + 11), m = size * 0.14;
    x.beginPath();
    x.moveTo(m + r() * size * 0.2, m + r() * size * 0.15);
    x.lineTo(size - m - r() * size * 0.15, m + r() * size * 0.25);
    x.lineTo(size - m - r() * size * 0.25, size - m - r() * size * 0.15);
    x.lineTo(m + r() * size * 0.2, size - m - r() * size * 0.2);
    x.closePath();
    x.shadowColor = `rgba(${SHADOW}, 0.3)`; x.shadowBlur = size * 0.08; x.shadowOffsetY = size * 0.04;
    x.fillStyle = color;
    x.fill();
    return c;
  });
}
/** the STRIP's shadow (the peel): a soft dark band the lifting strip casts on the sheet — drawn stretched under it, growing as it lifts */
export function stripShadow(w, h) {
  w = Math.round(w); h = Math.round(h);
  return cache.get(`shadow|${w}|${h}`, () => {
    const pad = Math.round(h * 0.4), c = newCanvas(w + pad * 2, h + pad * 2), x = c.getContext('2d');
    x.shadowColor = `rgba(${SHADOW}, 0.5)`;
    x.shadowBlur = pad * 0.75;
    x.shadowOffsetY = c.height;   // (only the shadow lands on the canvas: the rect itself is drawn above it)
    x.fillStyle = '#000';
    x.fillRect(pad, pad - c.height, w, h);
    return c;
  });
}

/** warm the blocks for a size in slices (≤ budgetMs a call): true once every colour × variant + the ghost + the drain + the rows are cut */
export function warmPaper(size, budgetMs = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) {
    for (let v = 0; v < VARIANTS; v++) if (!cache.has(`${size}|block|${t}|${v}`)) { paperSprite(size, 'block', t, v); if (performance.now() - t0 > budgetMs) return false; }
    if (!cache.has(`${size}|grey|${t}|0`)) { paperSprite(size, 'grey', t); if (performance.now() - t0 > budgetMs) return false; }
  }
  for (const k of ['ghost', 'incoming', 'ihot']) if (!cache.has(`${size}|${k}|0|0`)) paperSprite(size, k, 0);
  return true;
}
export const clearPaper = () => cache.clear();
export const paperCount = () => cache.size;
