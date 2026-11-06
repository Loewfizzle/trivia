// OVERCLOCK — ODD ONE OUT's NEON TUBE ICONS (OC4 — odd.js's tokens → a cell's picture). Every shape is a NEON TUBE in the kit's style: a
// wide soft glow stroke, the blue tube, a white-hot core — drawn as stacked strokes in ONE static SVG per token (cached), never animated (a
// cell's pop / dim moves its HTML wrapper). THE PHONE RULE: at the 6×6 grid's ~50-pt cells every difference is a THICK stroke or a clear angle
// — the tube is ≥ TUBE_W / 100 of the cell (≈ 3.5 pt at 50 pt), pips + points are fat (tests/overclock-oc4.test.mjs reads these numbers).
//   oddArt(token, fam) → HTML string (the glyph as text, or an <svg>); oddTurn(token) → the CSS transform of a turned / mirrored shape
import { oddToken } from '../odd.js';

export const TUBE_W = 7.5;        // the tube's stroke (of a 100-wide cell picture)
export const PIP_R = 7.5;         // a die's pip
// the stroke stack (outer → inner): the glow, the tube, the core
const STACK = [['#2e8bff', 19, 0.22], ['#64aaff', TUBE_W, 1], ['#f2f8ff', 2.6, 1]];
// paths in a 100 × 100 box (a turned shape's turn + a flip are the wrapper's)
const PATHS = {
  arrow: 'M18 50H80M60 30L81 50L60 70',
  chevron: 'M36 20L66 50L36 80',
  key: 'M43 50H84M72 50V64M82 50V60M43 50A14 14 0 1 1 15 50A14 14 0 1 1 43 50',
  bracket: 'M30 18V80H74',
  pin: 'M50 86C40 72 26 58 26 41A24 24 0 0 1 74 41C74 58 60 72 50 86ZM50 34A7 7 0 1 1 49.9 34Z',
  flag: 'M30 14V88M30 18L74 32L30 47',
  note: 'M50 74V18C62 22 72 30 70 46M50 74A12 9 -25 1 1 26 74A12 9 -25 1 1 50 74',
  boot: 'M34 14V60L70 66C77 67 80 72 80 78V84H28V14Z',
  bolt: 'M58 10L30 54H50L42 90L72 42H52L60 10Z',
};
const stroke = (d, extra = '') => STACK.map(([c, w, o]) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`).join('');
const dot = (x, y, r) => STACK.map(([c, w, o], i) => `<circle cx="${x}" cy="${y}" r="${(r + [5, 0, -3.4][i]).toFixed(1)}" fill="${c}" fill-opacity="${i ? o : 0.24}"/>`).join('');
const svg = inner => `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;

/** a ring with a 70° gap centred at angle a (0 = up, clockwise) */
export function gapPath(a) {
  const r = 30, half = 35, rad = d => ((d - 90) * Math.PI) / 180;
  const p = d => `${(50 + r * Math.cos(rad(d))).toFixed(2)} ${(50 + r * Math.sin(rad(d))).toFixed(2)}`;
  return `M${p(a + half)}A${r} ${r} 0 1 1 ${p(a - half)}`;
}
/** a 5-point star (points = 5) or the same star with its TOP point gone (points = 4) */
export function starPath(points = 5) {
  const pt = (i, R) => { const t = ((-90 + i * 36) * Math.PI) / 180; return [50 + R * Math.cos(t), 54 + R * Math.sin(t)]; };
  const v = [];
  for (let i = 0; i < 10; i++) v.push(pt(i, i % 2 ? 15 : 36));
  const pts = points === 5 ? v : v.slice(1);   // the missing point: its tip gone, the two inner corners joined (a flat top)
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
}
const DIE = { 6: [[32, 28], [32, 50], [32, 72], [68, 28], [68, 50], [68, 72]], 5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]], 4: [[31, 31], [69, 31], [31, 69], [69, 69]] };
export const diePips = n => DIE[n] || DIE[6];

const cache = new Map();
/** the picture of a token: a glyph (letters family — text in the mono face), else a neon tube <svg> */
export function oddArt(token, fam) {
  if (fam === 'glyph') return null;
  if (cache.has(token)) return cache.get(token);
  const t = oddToken(token);
  let out = '';
  if (!t) out = '';
  else if (PATHS[t.shape]) out = svg(stroke(PATHS[t.shape]));
  else if (t.shape === 'gap') out = svg(stroke(gapPath(t.a)));
  else if (t.shape === 'star5' || t.shape === 'star4') out = svg(stroke(starPath(t.shape === 'star5' ? 5 : 4)));
  else if (/^die\d$/.test(t.shape)) out = svg(stroke('M22 14H78A8 8 0 0 1 86 22V78A8 8 0 0 1 78 86H22A8 8 0 0 1 14 78V22A8 8 0 0 1 22 14Z') + diePips(Number(t.shape.slice(3))).map(([x, y]) => dot(x, y, PIP_R)).join(''));
  cache.set(token, out);
  return out;
}
/** the wrapper's transform for a turned / mirrored shape (the gap's angle is in its path — no turn) */
export function oddTurn(token, fam) {
  if (fam !== 'rot' && fam !== 'mirror') return '';
  const t = oddToken(token);
  if (!t) return '';
  return `${t.a ? `rotate(${t.a}deg)` : ''}${t.m ? ' scaleX(-1)' : ''}`.trim();
}
