// OVERCLOCK — helpers shared by the view, the challenge screens (ui/*.js) and the reveals.
import { h } from '../../ui/dom.js';

// 3, 2.5, 3.47 → '3', '2.5', '3.5' (partial credit)
export const fmtOk = n => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString());
// 1234.5 → '1,234.5' (Closest Call)
export const fmtVal = v => { const [i, d] = String(v).split('.'); return Number(i).toLocaleString('en-US') + (d != null ? `.${d}` : ''); };
// Higher or Lower values: 39 million, 1.44 billion, 0.49 km², 1876, c. 2560 BC
export function fmtStat(unit, v, shown) {
  if (shown) return shown;
  if (unit === 'year') return String(v);
  if (unit === 'million' && v >= 1000) return `${(v / 1000).toFixed(2).replace(/0$/, '')} billion`;
  if (unit === 'million' && v < 1) return `${Math.round(v * 1000)} thousand`;
  return unit ? `${fmtVal(v)} ${unit}` : fmtVal(v);
}
// Sort It only stores the net score (right − ½ wrong) and how many cards were sorted; this recovers right/wrong.
export const sortSplit = (ok, p) => { const wrong = Math.max(0, Math.round((p - ok) / 1.5)); return { right: p - wrong, wrong }; };
// Make 24 tiles: whole numbers, or an exact fraction drawn stacked
export const fmtSigned = n => (n < 0 ? `−${-n}` : String(n));
export const fracEl = v => (v[1] === 1 ? h('span.m24-int', fmtSigned(v[0])) : h('span.m24-frac', h('b', fmtSigned(v[0])), h('i'), h('b', String(v[1]))));
// Compass rose (static) and needle (turned with a CSS transform)
export const ROSE_SVG = (() => {
  const p = (r, a) => { const t = (a * Math.PI) / 180; return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)]; };
  const ticks = [];
  for (let a = 0; a < 360; a += 10) {
    const big = a % 90 === 0, mid = a % 45 === 0;
    const [x1, y1] = p(92, a), [x2, y2] = p(big ? 78 : mid ? 82 : 87, a);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${big ? 'tk-b' : 'tk'}"/>`);
  }
  const star = (r1, r2, rot) => Array.from({ length: 8 }, (_, i) => p(i % 2 ? r2 : r1, i * 45 + rot).join(',')).join(' ');
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" class="ring"/><circle cx="100" cy="100" r="70" class="ring2"/>${ticks.join('')}`
    + `<polygon points="${star(64, 16, 0)}" class="star"/><polygon points="${star(42, 11, 22.5)}" class="star2"/></svg>`;
})();
export const NEEDLE_SVG = '<svg viewBox="0 0 200 200" aria-hidden="true"><polygon points="100,24 113,100 87,100" class="nd-n"/><polygon points="100,176 113,100 87,100" class="nd-s"/><circle cx="100" cy="100" r="8" class="nd-hub"/></svg>';
export const DIR_NAME = { N: 'NORTH', E: 'EAST', S: 'SOUTH', W: 'WEST' };
export const TURN_TEXT = { L: 'TURN LEFT', R: 'TURN RIGHT', A: 'TURN AROUND' };
export const TURN_SVG = {
  R: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40V22a8 8 0 0 1 8-8h14"/><path d="M30 6l8 8-8 8"/></svg>',
  L: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M34 40V22a8 8 0 0 0-8-8H12"/><path d="M18 6l-8 8 8 8"/></svg>',
  A: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40V20a10 10 0 0 1 20 0v14"/><path d="M26 28l8 8 8-8"/></svg>',
};

// Buttons that react on touch-down (a click waits for the finger to lift — too slow for these).
export const fastButton = (sel, attrs, onPress, ...kids) => h(sel, {
  type: 'button', dataset: { sfx: 'none', ...(attrs.dataset || {}) }, ...attrs,
  onpointerdown: e => { e.preventDefault(); onPress(e); },
  onclick: e => { if (e.detail === 0) onPress(e); }, // keyboard / assistive activation
}, ...kids);
