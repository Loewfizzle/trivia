// THE DOCK's STREAK FLAME (PROGRESSION A — the owner, Nov 2 ~6 pm): a small NEON FLAME + the day count as a BADGE on the title dock's
// PROFILE button. Built at the device's FULL dpr (3× on an iPhone), the same class as the sign's tubes: a coloured glow (a soft wide stroke
// stack — no canvas filter, WebKit-safe), the coloured tube, a WHITE-HOT CORE; a gentle flicker = the glow layer's OPACITY only (css
// pg-flick, steps). Painted once per size / state (two little canvases, never a frame loop). No streak = no badge; reduced motion = lit, still.
// States: lit (played tonight — orange) · waiting (not yet tonight — dimmer amber) · frozen (a freeze covers a missed night — ice blue).
import { h } from '../ui/dom.js';
import { ctx2d } from '../ui/canvas-safe.js';
import { streakView, streakDay } from '../core/streak.js';
import { pgSheet } from './look.js';
import { FLAME } from './flame-art.js';

// (PROGRESSION A's 24-unit flame — superseded by FLAME; kept for an A/B)
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
  // (PROGRESSION B's add-on: THE BIG FLAME's own shape — flame-art.js's paths, 120 × 150 units — the outer flame + the middle + the core)
  const k = (dpr * H) / 150 * 0.98;
  x.setTransform(k, 0, 0, k, (cv.width - 120 * k) / 2, (cv.height - 150 * k) / 2 + dpr * 0.3);
  const outer = new Path2D(FLAME.outer), inner = new Path2D(FLAME.mid), core = new Path2D(FLAME.core);
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (layer === 'glow') {
    // the halo: wide, faint strokes stacked (the sign's tubes do the same without ctx.filter)
    for (const [w, a] of [[44, 0.06], [32, 0.09], [23, 0.14], [17, 0.2]]) {
      x.strokeStyle = `rgba(${L.glow.join(',')},${a * L.a})`; x.lineWidth = w; x.stroke(outer);
    }
    x.fillStyle = `rgba(${L.glow.join(',')},${0.16 * L.a})`; x.fill(outer);
    return;
  }
  x.strokeStyle = L.tube; x.lineWidth = 10; x.stroke(outer);
  x.strokeStyle = `rgba(${L.glow.join(',')},0.8)`; x.lineWidth = 8; x.stroke(inner);
  x.strokeStyle = L.core; x.lineWidth = 4.6; x.stroke(outer);   // the white-hot core along the tube
  x.lineWidth = 4; x.stroke(inner); x.lineWidth = 6; x.stroke(core);
}

/** SHELL 2.0 A — THE DOCK's STREAK PILL (the owner, Nov 5 6:57 am: the dock's flame goes): the count in a small neon pill on YOU — an amber
 *  tube lit (played tonight), quieter while it waits for tonight's match, ice-blue when a freeze holds it. null with no streak alive. */
export function streakPill(st, now = Date.now()) {
  const v = st ? streakView(st, streakDay(now)) : null;
  if (!v || !v.n) return null;
  pgSheet();
  const state = v.state === 'lit' ? 'lit' : v.state === 'frozen' ? 'frozen' : 'waiting';
  return h('span.pg-dock.pg-pill', { class: `is-${state}`, dataset: { n: String(v.n), state }, 'aria-hidden': 'true' }, h('b', String(v.n)));
}
