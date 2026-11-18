// THE STREAK FLAME — CITY H2: THE PINK TUBE (the owner's pick A, Nov 18 — Downloads/NEON/city-h2/refs/streak-flame-options.png): TWO TUBE STROKES
// only — the OUTER flame in the house pink (#ff6fc8 family) + ONE INNER TONGUE warm white-hot (#fff0b0 family). NIGHT = neon tubes (each a glow
// stack + its coloured tube + a white core line, built like the sign's tubes, no filters: crisp at 3×); DAY (`glow: false` — SHARE TODAY by day)
// = the same two strokes, no glow, no fill, deeper colours. NOT PLAYED YET (waiting) = the same shape dimmed + a SLOW FLICKER (opacity only,
// css/progress.css); FROZEN stays blue; OUT = a dark outline. Motion: the lit tongue breathes (transform + opacity); reduced motion = lit, still.
// ONE FILE everywhere: SHARE TODAY (as a bitmap — it still reads at the 360-px downscale), the profile, THE PLAYER PAGE, the streak card + its
// week, the end-of-match moment (look.js#flameIcon).
import { h } from '../ui/dom.js';

/** the paths (viewBox 0 0 120 150 — the base at the bottom centre) */
export const FLAME = Object.freeze({
  outer: 'M60 8 C71 34 92 52 92 86 C92 116 78 136 60 138 C42 136 28 116 28 86 C28 52 49 34 60 8 Z',
  tongue: 'M60 64 C67 80 77 92 77 108 C77 122 69 130 60 130 C51 130 43 122 43 108 C43 92 53 80 60 64 Z',
});
/** the palettes per state: o = the outer tube, t = the tongue, g / tg = their glows (r,g,b), a = the light's strength (0 = unlit) */
export const FLAME_LOOK = Object.freeze({
  lit: { o: '#ff6fc8', t: '#fff0b0', g: '255,79,200', tg: '255,226,150', a: 1 },
  waiting: { o: '#a0507f', t: '#b4a57a', g: '200,80,160', tg: '200,180,120', a: 0.45 },
  frozen: { o: '#3fb6ff', t: '#e6f8ff', g: '80,190,255', tg: '190,235,255', a: 0.95 },
  out: { o: '#4a3a44', t: '#544a40', g: '0,0,0', tg: '0,0,0', a: 0 },
});
/** DAY (no glow): the same two strokes, deeper (they read on the morning sky / a light card) */
export const FLAME_DAY = Object.freeze({
  lit: { o: '#d4147f', t: '#c99410' }, waiting: { o: '#c98bb0', t: '#cdbb8a' }, frozen: { o: '#1f86d6', t: '#5ab4ec' }, out: { o: '#8a7d84', t: '#9a9088' },
});
const NS = 'http://www.w3.org/2000/svg';
const S = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const stroke = (d, col, w) => S('path', { d, fill: 'none', stroke: col, 'stroke-width': String(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

/** a tube: by night its glow (two soft wide strokes) + the coloured tube + the white core line; by day the coloured stroke alone */
function tube(d, col, glow, a, w, cls, night) {
  const g = S('g', { class: cls });
  if (night && a > 0) { g.append(stroke(d, `rgba(${glow},${(0.18 * a).toFixed(3)})`, w * 3.6)); g.append(stroke(d, `rgba(${glow},${(0.38 * a).toFixed(3)})`, w * 2)); }
  g.append(stroke(d, col, w));
  if (night && a > 0) g.append(stroke(d, 'rgba(255,250,244,0.92)', w * 0.34));
  return g;
}

/** the flame as an <svg> (state: lit · waiting · frozen · out; w: its width in px; glow: false = the DAY look) */
export function flameSvg(state = 'lit', w = 160, { glow = true } = {}) {
  const L = FLAME_LOOK[state] || FLAME_LOOK.lit, D = FLAME_DAY[state] || FLAME_DAY.lit;
  const tw = w < 40 ? 6 : w < 90 ? 4.6 : 3.8;   // (a small flame: thicker tubes so it reads at 24 px)
  const o = glow ? L.o : D.o, t = glow ? L.t : D.t;
  return S('svg', { viewBox: '-10 -6 140 160', width: String(w), height: String(Math.round(w * 160 / 140)), 'aria-hidden': 'true', class: 'pg-fl-svg' },
    tube(FLAME.outer, o, L.g, L.a, tw, 'pg-fl-outer', glow),
    tube(FLAME.tongue, t, L.tg, L.a, tw * 0.92, 'pg-fl-core', glow));
}
/** the flame in a span (the shared root class pg-flame + is-<state>) */
export function flameArt(state = 'lit', w = 28) {
  return h('span.pg-flame.pg-fl', { class: `is-${state}`, style: { '--f': `${w}px` } }, flameSvg(state, w));
}
