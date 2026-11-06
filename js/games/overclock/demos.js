// OVERCLOCK — THE RULES DEMOS (OC3 — docs/overclock.md "Timing": the hard challenges get a ~3 s looping demo). Shown INSIDE the rules card
// (kit/slam.js's `demo` slot) the first time a type comes up — BRIEF_MS 7 s unchanged: the demo just loops while the card is up.
//   PATTERN LOCK: a short sequence fills itself in chip by chip, the step shows between them (+3), then the next number DROPS into the
//                 glowing slot.
//   (MISSING LINK's — OC3 Group 3.)
// Each piece runs its OWN keyframes on ONE shared 3-s loop (the Web Animations API — transform + opacity only, on the compositor), so every
// piece's timing is exact whatever the others do. Reduced motion: the finished picture, still.
import { h, reducedMotion } from '../../ui/dom.js';

export const DEMO_MS = 3000;
const HIDE = { opacity: 0, transform: 'translateY(10px)' }, SHOW = { opacity: 1, transform: 'none' };

/** run `el` through key moments on the shared loop: keys = [[ms, { opacity, transform }], …] (the last key holds to the loop's end) */
function loop(el, keys, anims) {
  const frames = keys.map(([t, f]) => ({ ...f, offset: Math.max(0, Math.min(1, t / DEMO_MS)) }));
  if (frames[0].offset > 0) frames.unshift({ ...keys[0][1], offset: 0 });
  if (frames[frames.length - 1].offset < 1) frames.push({ ...keys[keys.length - 1][1], offset: 1 });
  anims.push(el.animate(frames, { duration: DEMO_MS, iterations: Infinity, easing: 'linear' }));
}
/** a piece that appears at `at` (rising in), holds, and goes with the rest at the loop's end */
const appear = (el, at, anims, from = HIDE, dur = 220) => loop(el, [[at, from], [at + dur, SHOW], [2620, SHOW], [2860, { ...SHOW, opacity: 0 }]], anims);

function demoBox(cls, kids, run) {
  const el = h(`div.oc-demo.${cls}`, { 'aria-hidden': 'true' }, h('span.oc-demo-tag', 'WATCH'), ...kids);
  const anims = [];
  if (!reducedMotion()) run(anims); else el.classList.add('is-still');
  return { el, destroy() { anims.forEach(a => a.cancel()); } };
}

/** PATTERN LOCK: 3 · 6 · 9 · ? — the "+3" between each, then 12 drops into the slot */
export function patternDemo() {
  const SEQ = [3, 6, 9], NEXT = 12;
  const chips = SEQ.map(v => h('span.oc-seq-chip', h('b', String(v))));
  const steps = SEQ.map(() => h('span.oc-demo-step', '+3'));
  const q = h('b.oc-demo-q', '?');
  const ans = h('b.oc-demo-ans', String(NEXT));
  const glow = h('span.oc-seq-glow');
  const slot = h('span.oc-seq-chip.is-slot', glow, q, ans);
  const row = h('div.oc-seq.oc-demo-seq', chips.flatMap((c, i) => [c, steps[i]]), slot);
  const hit = h('span.oc-demo-hit');
  slot.append(hit);
  return demoBox('oc-demo-pat', [row, h('div.oc-demo-cap', 'EACH STEP IS THE SAME → ', h('b', 'TYPE THE NEXT ONE'))], anims => {
    chips.forEach((c, i) => appear(c, 120 + i * 300, anims));
    steps.forEach((s, i) => appear(s, 330 + i * 300, anims, { opacity: 0, transform: 'scale(0.6)' }, 160));
    appear(slot, 1020, anims);
    loop(q, [[0, { opacity: 1 }], [1820, { opacity: 1 }], [1900, { opacity: 0 }], [2860, { opacity: 0 }]], anims);
    loop(ans, [[0, { opacity: 0, transform: 'translateY(-34px) scale(1.25)' }], [1820, { opacity: 0, transform: 'translateY(-34px) scale(1.25)' }], [2000, { opacity: 1, transform: 'translateY(2px) scale(0.96)' }], [2100, { opacity: 1, transform: 'none' }], [2620, { opacity: 1, transform: 'none' }], [2860, { opacity: 0, transform: 'none' }]], anims);
    loop(hit, [[0, { opacity: 0, transform: 'scale(0.7)' }], [1990, { opacity: 0, transform: 'scale(0.7)' }], [2060, { opacity: 1, transform: 'scale(1)' }], [2500, { opacity: 0, transform: 'scale(1.35)' }]], anims);
  });
}

/** the demo for a type (null = none) */
export function demoFor(type) {
  if (type === 'pattern') return patternDemo();
  return null;
}
