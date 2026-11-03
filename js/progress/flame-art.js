// THE BIG FLAME (PROGRESSION B's add-on — the owner's streak card redesign, Nov 2: the chat's "1 · THE BIG FLAME"): THREE NESTED NEON
// TUBES — a red-orange outer flame with two side LICKS + a tall centre tip, an amber middle flame, a WHITE-HOT CORE — each tube a glow
// stack + its coloured tube + a white core line (built like the sign's tubes, no filters: crisp at 3×), a soft FILL of light inside the
// outer flame (clear at the top → warm at the base) and a warm radial glow behind. Motion (css/progress.css pg-fl-*): the licks flicker +
// the core breathes — transform + opacity only; reduced motion = lit, still. ONE SHAPE everywhere: the streak card (big), the week's
// seven days, the end-of-round streak line + the profile (flameIcon), the dock's badge (flame.js paints the same paths on its canvas).
import { h } from '../ui/dom.js';

/** the paths (viewBox 0 0 120 150 — the base at the bottom centre) */
export const FLAME = Object.freeze({
  outer: 'M60 6 C70 32 92 50 92 84 C92 114 78 134 60 136 C42 134 28 114 28 84 C28 50 50 32 60 6 Z',
  // (the licks: tongues OFF the shoulders, outside the body — never crossing it)
  lickL: 'M29 90 C17 78 12 63 15 46 C21 60 27 66 32 69',
  lickR: 'M91 90 C103 78 108 63 105 46 C99 60 93 66 88 69',
  mid: 'M60 40 C67 60 80 72 80 96 C80 118 70 128 60 129 C50 128 40 118 40 96 C40 72 53 60 60 40 Z',
  core: 'M60 78 C64 89 70 97 70 108 C70 118 65 123 60 123 C55 123 50 118 50 108 C50 97 56 89 60 78 Z',
});
/** the palettes per state: [outer, mid, core] tube colours + the glow + the fill */
export const FLAME_LOOK = Object.freeze({
  lit: { o: '#ff5a2a', m: '#ffad48', c: '#fff4e2', g: '255,96,40', fill: '255,128,48', a: 1 },
  waiting: { o: '#c4643a', m: '#d69a5c', c: '#f3dfc8', g: '210,110,60', fill: '210,120,60', a: 0.6 },
  frozen: { o: '#3fb6ff', m: '#9fe2ff', c: '#f4fcff', g: '80,190,255', fill: '90,200,255', a: 0.95 },
  out: { o: '#4a3a32', m: '#3c302a', c: '#56473e', g: '0,0,0', fill: '0,0,0', a: 0 },
});
const NS = 'http://www.w3.org/2000/svg';
const S = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
let uid = 0;

/** a tube: its glow (two soft wide strokes), the coloured tube, the white core line */
function tube(d, col, glow, a, w, cls = '') {
  const g = S('g', { class: cls });
  if (a > 0) {
    g.append(S('path', { d, fill: 'none', stroke: `rgba(${glow},${(0.16 * a).toFixed(3)})`, 'stroke-width': String(w * 3.6), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    g.append(S('path', { d, fill: 'none', stroke: `rgba(${glow},${(0.34 * a).toFixed(3)})`, 'stroke-width': String(w * 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }
  g.append(S('path', { d, fill: 'none', stroke: col, 'stroke-width': String(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  if (a > 0) g.append(S('path', { d, fill: 'none', stroke: 'rgba(255,250,240,0.9)', 'stroke-width': String(w * 0.34), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return g;
}

/** the flame as an <svg> (state: lit · waiting · frozen · out; w: its width in px — the height is 1.25 ×) */
export function flameSvg(state = 'lit', w = 160) {
  const L = FLAME_LOOK[state] || FLAME_LOOK.lit, id = `fl${++uid}`;
  const thin = w < 40;   // (a small flame: thicker tubes so it reads; the licks drop)
  const tw = thin ? 5.2 : 3.2;
  const defs = S('defs',
    S('linearGradient', { id: `${id}f`, x1: '0', y1: '0', x2: '0', y2: '1' },
      S('stop', { offset: '0', 'stop-color': `rgba(${L.fill},0)` }), S('stop', { offset: '0.55', 'stop-color': `rgba(${L.fill},${(0.16 * L.a).toFixed(3)})` }), S('stop', { offset: '1', 'stop-color': `rgba(${L.fill},${(0.5 * L.a).toFixed(3)})` })),
    S('radialGradient', { id: `${id}g`, cx: '0.5', cy: '0.68', r: '0.5' },
      S('stop', { offset: '0', 'stop-color': `rgba(${L.g},${(0.5 * L.a).toFixed(3)})` }), S('stop', { offset: '1', 'stop-color': `rgba(${L.g},0)` })));
  const svg = S('svg', { viewBox: '-10 -6 140 160', width: String(w), height: String(Math.round(w * 160 / 140)), 'aria-hidden': 'true', class: 'pg-fl-svg' }, defs,
    S('ellipse', { cx: '60', cy: '98', rx: '66', ry: '62', fill: `url(#${id}g)`, class: 'pg-fl-halo' }),
    S('path', { d: FLAME.outer, fill: `url(#${id}f)` }),
    tube(FLAME.outer, L.o, L.g, L.a, tw, 'pg-fl-outer'),
    thin ? null : tube(FLAME.lickL, L.o, L.g, L.a, tw * 0.9, 'pg-fl-lick pg-fl-l'),
    thin ? null : tube(FLAME.lickR, L.o, L.g, L.a, tw * 0.9, 'pg-fl-lick pg-fl-r'),
    tube(FLAME.mid, L.m, L.g, L.a, tw * 0.9, 'pg-fl-mid'),
    tube(FLAME.core, L.c, '255,240,220', L.a, tw * 0.85, 'pg-fl-core'));
  return svg;
}
/** the flame in a span (the shared root class pg-flame + is-<state>) */
export function flameArt(state = 'lit', w = 28) {
  return h('span.pg-flame.pg-fl', { class: `is-${state}`, style: { '--f': `${w}px` } }, flameSvg(state, w));
}
