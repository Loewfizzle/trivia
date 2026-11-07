// THE PASSWORD — THE DRAWN DOORS (PW2 — docs/password.md "THE DOORS"; the owner's decisions, docs/games/plan.md PW2): the door progress is two
// small DRAWN NEON DOORS (34 × 44 pt) joined by a short line, the door's name in small neon type beside each + one line under it. NO PILLS.
// Inline SVG (crisp at 3×); the "glow" is a second, wide, faint stroke under each tube — no filter. The LEAF is its own HTML-wrapped layer so
// it can SWING in 3D (Safari ignores 3D transforms on SVG children): transform + opacity only, everything else a colour transition.
//   states (data-st): locked = a dim outline · on = lit pink, a gentle 2.6 s pulse (opacity) · open = the leaf swung ajar toward you, warm
//   light in the doorway + spilling out, a green frame · held = closed, dim, a red tint + HELD
//   createDoors(names) → { el, set(run), state(i), el of each door } · doorState / doorLine (logic.js) say what each door shows
import { h, svgEl, clear } from '../../ui/dom.js';
import { doorState, doorLine } from './logic.js';

const FRAME = 'M4.5 42.5 V5 a2.5 2.5 0 0 1 2.5 -2.5 H27 a2.5 2.5 0 0 1 2.5 2.5 V42.5';   // the jambs + the lintel (open at the sill)
const SILL = 'M1.5 42.5 H32.5';
const LEAF = 'M1.5 1.5 H21.5 V34.5 H1.5 Z';                                               // the leaf (its own 23 × 36 box)
const tube = (d, cls = '') => `<path class="pw-dr-glow${cls}" d="${d}"/><path class="pw-dr-tube${cls}" d="${d}"/>`;
const frameSvg = () => svgEl(`<svg class="pw-dr-frame" viewBox="0 0 34 44" aria-hidden="true">
  <rect class="pw-dr-room" x="7" y="4.5" width="20" height="38" rx="1"/>
  ${tube(FRAME)}${tube(SILL)}
</svg>`);
const leafSvg = () => svgEl(`<svg class="pw-dr-leafsvg" viewBox="0 0 23 36" aria-hidden="true">
  <rect class="pw-dr-panel" x="1.5" y="1.5" width="20" height="33"/>
  ${tube(LEAF)}
  <circle class="pw-dr-knob" cx="17" cy="18.5" r="1.7"/>
</svg>`);

export function createDoors(names) {
  const doors = names.map((name, i) => {
    const leaf = h('div.pw-dr-leaf', leafSvg());
    const art = h('div.pw-dr-art', frameSvg(), leaf, h('i.pw-dr-spill'));
    const sub = h('span.pw-dr-sub');
    const el = h('div.pw-dr', { dataset: { door: i, st: 'locked' }, role: 'img' }, art, h('div.pw-dr-txt', h('span.pw-dr-name', name), sub));
    return { el, sub, name };
  });
  const el = h('div.pw-doors', doors[0].el, h('i.pw-dr-link', { 'aria-hidden': 'true' }), doors[1].el);
  return {
    el,
    doors,
    /** every door from the run (no motion of its own — the CSS transitions carry a state change: the swing, the light, the colour) */
    set(run) {
      doors.forEach((d, i) => {
        const st = doorState(run, i), line = doorLine(run, i);
        if (d.el.dataset.st !== st) d.el.dataset.st = st;
        if (d.sub.textContent !== line) d.sub.textContent = line;
        d.el.setAttribute('aria-label', `${d.name}: ${st === 'open' ? `opened in ${line.toLowerCase()}` : st === 'on' ? `in play, ${line.toLowerCase()}` : st}`);
      });
    },
    state: i => doors[i].el.dataset.st,
    destroy() { clear(el); },
  };
}
