// THE DOCK's STREAK FLAME (PROGRESSION A — the owner, Nov 2 ~6 pm): a small NEON FLAME + the day count as a BADGE on the title dock's
// PROFILE button. Built at the device's FULL dpr (3× on an iPhone), the same class as the sign's tubes: a coloured glow (a soft wide stroke
// stack — no canvas filter, WebKit-safe), the coloured tube, a WHITE-HOT CORE; a gentle flicker = the glow layer's OPACITY only (css
// pg-flick, steps). Painted once per size / state (two little canvases, never a frame loop). No streak = no badge; reduced motion = lit, still.
// States: lit (played tonight — orange) · waiting (not yet tonight — dimmer amber) · frozen (a freeze covers a missed night — ice blue).
import { h } from '../ui/dom.js';
import { ctx2d } from '../ui/canvas-safe.js';
import { streakView, streakDay } from '../core/streak.js';
import { pgSheet } from './look.js';

const OUTER = 'M12 2.2c.6 3.1 3.6 4.9 4.9 7.7 1.6 3.3.6 7.7-2.6 9.7-1.1.7-2.4 1-3.6 1-3.9-.1-6.6-3.5-6.1-7.3.3-2.3 1.7-3.9 2.8-5.6.2 1.6.9 2.8 2.1 3.5C9 8.6 10 5.1 12 2.2z';
const INNER = 'M12.1 11.2c.4 1.6 1.9 2.4 2.1 4.1.2 1.8-1.1 3.3-2.8 3.3-1.6 0-2.8-1.3-2.7-2.9.1-1 .7-1.7 1.2-2.4.2.7.6 1.2 1.1 1.4-.1-1.3.3-2.4 1.1-3.5z';
const LOOK = {
  lit: { glow: [255, 110, 40], tube: '#ffab5e', core: '#fff6ea', a: 1 },
  waiting: { glow: [210, 120, 60], tube: '#c98a55', core: '#f2dcc6', a: 0.55 },
  frozen: { glow: [80, 200, 255], tube: '#9fe2ff', core: '#f4fcff', a: 0.9 },
};
const W = 18, H = 22;   // pt (the badge's flame)

/** Paint a flame into a canvas at the device's dpr: layer 'glow' (the soft halo) or 'tube' (the tube + the core). */
export function paintFlame(cv, state = 'lit', layer = 'tube', dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))) {
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const x = ctx2d(cv);
  if (!x) return;
  const L = LOOK[state] || LOOK.lit;
  const k = (dpr * H) / 24 * 0.92;   // the 24-unit path → the canvas
  x.setTransform(k, 0, 0, k, (cv.width - 24 * k) / 2, (cv.height - 24 * k) / 2 + dpr * 0.6);
  const outer = new Path2D(OUTER), inner = new Path2D(INNER);
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (layer === 'glow') {
    // the halo: wide, faint strokes stacked (the sign's tubes do the same without ctx.filter)
    for (const [w, a] of [[7, 0.06], [5.2, 0.09], [3.8, 0.14], [2.8, 0.2]]) {
      x.strokeStyle = `rgba(${L.glow.join(',')},${a * L.a})`; x.lineWidth = w; x.stroke(outer);
    }
    x.fillStyle = `rgba(${L.glow.join(',')},${0.16 * L.a})`; x.fill(outer);
    return;
  }
  x.strokeStyle = L.tube; x.lineWidth = 1.7; x.stroke(outer);
  x.strokeStyle = `rgba(${L.glow.join(',')},0.55)`; x.lineWidth = 1.4; x.stroke(inner);
  x.strokeStyle = L.core; x.lineWidth = 0.75; x.stroke(outer);   // the white-hot core along the tube
  x.lineWidth = 1.05; x.stroke(inner);
}

/** The badge for a streak (pstats.st, or { n, d } from the public profile) — null when there's no streak alive. (await pgSheet() first) */
export function flameBadge(st, now = Date.now()) {
  const v = st ? streakView(st, streakDay(now)) : null;
  if (!v || !v.n) return null;
  pgSheet();
  const state = v.state === 'lit' ? 'lit' : v.state === 'frozen' ? 'frozen' : 'waiting';
  const glow = h('canvas.pg-dock-glow'), tube = h('canvas');
  paintFlame(glow, state, 'glow'); paintFlame(tube, state, 'tube');
  const fl = h('span', { style: { position: 'relative', display: 'block', width: `${W}px`, height: `${H}px` } }, glow, tube);
  for (const c of [glow, tube]) Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' });
  return h('span.pg-dock', { class: `is-${state}`, dataset: { n: String(v.n), state }, 'aria-hidden': 'true' }, fl, h('b', String(v.n)));
}
