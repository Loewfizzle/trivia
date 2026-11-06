// OVERCLOCK — THE RULES DEMOS (OC3 — docs/overclock.md "Timing": the hard challenges get a ~3 s looping demo). Shown INSIDE the rules card
// (kit/slam.js's `demo` slot) the first time a type comes up — BRIEF_MS 7 s unchanged: the demo just loops while the card is up.
//   PATTERN LOCK: a short sequence fills itself in chip by chip, the step shows between them (+3), then the next number DROPS into the
//                 glowing slot.
//   MISSING LINK: three clue words come in, the link TYPES ITSELF into the slot letter by letter, then the three JOINS light up one by one
//                 (SUN ═ FLOWER · CORN ═ FLOWER · WALL ═ FLOWER — OC3B: a lit tube joins them, never an arrow: it can't read backwards).
//   HIGHER OR LOWER (OC3B): BIG BEN 96 m over EIFFEL TOWER ? with the VS slamming in between, a finger taps HIGHER (it turns hot), 330 m
//                 FLIPS in, the card lights --good, the first streak segment lights.
// Each piece runs its OWN keyframes on ONE shared 3-s loop (the Web Animations API — transform + opacity only, on the compositor), so every
// piece's timing is exact whatever the others do. Reduced motion: the finished picture, still.
import { h, reducedMotion } from '../../ui/dom.js';
import { joinTube } from './shared.js';
import { tubeLayers, rwSource, rwCore } from './ui/rewire.js';

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

/** MISSING LINK: SUN · CORN · WALL — FLOWER types itself into the slot, then each clue's join (a lit tube + FLOWER) slides in + lights */
export function linkDemo() {
  const WORDS = ['SUN', 'CORN', 'WALL'], LINK = 'FLOWER';
  const lines = WORDS.map(w => {
    const lit = h('i.oc-demo-join-lit');
    const tail = h('span.oc-demo-tail', joinTube(), h('em', LINK));
    return { el: h('span.oc-demo-join', lit, h('b', w), tail), lit, tail };
  });
  const letters = [...LINK].map(ch => h('b', ch));
  const slot = h('div.oc-ml-slot.oc-demo-slot', { style: { '--n': LINK.length } }, h('span.oc-ml-glow'), ...letters.map(b => h('span.oc-ml-cell', b)));
  return demoBox('oc-demo-link', [slot, h('div.oc-demo-joins', lines.map(l => l.el))], anims => {
    lines.forEach((l, i) => appear(l.el, 100 + i * 170, anims));
    appear(slot, 560, anims);
    letters.forEach((c, i) => loop(c, [[0, { opacity: 0, transform: 'translateY(-8px) scale(1.3)' }], [800 + i * 120, { opacity: 0, transform: 'translateY(-8px) scale(1.3)' }], [880 + i * 120, { opacity: 1, transform: 'none' }], [2620, { opacity: 1, transform: 'none' }], [2860, { opacity: 0, transform: 'none' }]], anims));
    lines.forEach((l, i) => {
      const at = 1640 + i * 200;
      loop(l.tail, [[0, { opacity: 0, transform: 'translateX(-12px)' }], [at, { opacity: 0, transform: 'translateX(-12px)' }], [at + 160, { opacity: 1, transform: 'none' }], [2620, { opacity: 1, transform: 'none' }], [2860, { opacity: 0, transform: 'none' }]], anims);
      loop(l.lit, [[0, { opacity: 0 }], [at + 80, { opacity: 0 }], [at + 160, { opacity: 1 }], [at + 520, { opacity: 0.6 }], [2620, { opacity: 0.6 }], [2860, { opacity: 0 }]], anims);
    });
  });
}

/** HIGHER OR LOWER: BIG BEN 96 m · VS · EIFFEL TOWER ? — a tap on HIGHER, 330 m flips in, the first streak segment lights */
export function hlDemo() {
  const card = (name, val, unit, hidden) => {
    const ok = h('span.oc-tile-ok');
    const q = hidden ? h('b.oc-hl-q', '?') : null;
    const num = h('span.oc-hl-num', h('b', val), h('small', unit));
    return { el: h(`div.oc-hl-card.oc-demo-hl-card.${hidden ? 'is-unknown' : 'is-known'}`, h('span.oc-hl-glass'), ok, h('span.oc-hl-name', name), h('span.oc-hl-val', q, num)), ok, q, num };
  };
  const A = card('BIG BEN', '96', 'm', false), B = card('EIFFEL TOWER', '330', 'm', true);
  const vs = h('div.oc-hl-vs', h('span.oc-hl-vs-glow'), h('b', 'VS'));
  const hot = h('span.oc-demo-hl-hot', h('i.oc-hl-arrow'), h('b', 'HIGHER')), tap = h('span.oc-demo-tap');
  const up = h('div.oc-demo-hl-btn.is-up', hot, h('i.oc-hl-arrow'), h('b', 'HIGHER'), tap);
  const down = h('div.oc-demo-hl-btn.is-down', h('i.oc-hl-arrow'), h('b', 'LOWER'));
  const lit = h('span.oc-demo-hl-lit');
  const bar = h('div.oc-segbar.oc-demo-hl-bar', Array.from({ length: 10 }, () => h('i')), lit);
  return demoBox('oc-demo-hl', [bar, h('div.oc-demo-hl-cards', A.el, vs, B.el), h('div.oc-demo-hl-btns', up, down)], anims => {
    const HOLD = { opacity: 1, transform: 'none' }, END = { opacity: 0, transform: 'none' };
    appear(A.el, 80, anims);
    appear(B.el, 200, anims);
    loop(vs, [[0, { opacity: 0, transform: 'scale(2.3) rotate(-8deg)' }], [360, { opacity: 0, transform: 'scale(2.3) rotate(-8deg)' }], [500, { opacity: 1, transform: 'scale(0.9)' }], [580, HOLD], [2620, HOLD], [2860, END]], anims);
    appear(up, 520, anims);
    appear(down, 580, anims);
    loop(tap, [[0, { opacity: 0, transform: 'scale(0.4)' }], [1000, { opacity: 0, transform: 'scale(0.4)' }], [1060, { opacity: 0.95, transform: 'scale(0.75)' }], [1420, { opacity: 0, transform: 'scale(1.6)' }]], anims);
    loop(hot, [[0, { opacity: 0 }], [1040, { opacity: 0 }], [1100, { opacity: 1 }], [2620, { opacity: 1 }], [2860, { opacity: 0 }]], anims);
    loop(B.q, [[0, HOLD], [1180, HOLD], [1300, { opacity: 0, transform: 'scaleY(0.05)' }], [2860, { opacity: 0, transform: 'scaleY(0.05)' }], [2861, HOLD]], anims);
    loop(B.num, [[0, { opacity: 0, transform: 'scaleY(0.05)' }], [1290, { opacity: 0, transform: 'scaleY(0.05)' }], [1430, { opacity: 1, transform: 'scaleY(1.14)' }], [1520, HOLD], [2620, HOLD], [2860, END]], anims);
    loop(B.ok, [[0, { opacity: 0 }], [1500, { opacity: 0 }], [1620, { opacity: 1 }], [2620, { opacity: 1 }], [2860, { opacity: 0 }]], anims);
    loop(lit, [[0, { opacity: 0, transform: 'scaleY(0.3)' }], [1660, { opacity: 0, transform: 'scaleY(0.3)' }], [1780, { opacity: 1, transform: 'scaleY(1.45)' }], [1900, HOLD], [2620, HOLD], [2860, END]], anims);
  });
}

/** REWIRE (OC4): SOURCE → three tube tiles → CORE: a finger turns the first (the tube lights through the second), then the third — the
 *  surge races to the core and it blazes */
export function wireDemo() {
  const tiles = ['I', 'I', 'I'].map(s => { const rot = tubeLayers(s); return { rot, el: h('i.oc-wire-tile', h('i.oc-wire-glass'), rot) }; });
  const taps = [0, 2].map(() => h('span.oc-demo-tap'));
  tiles[0].el.append(taps[0]); tiles[2].el.append(taps[1]);
  const core = rwCore(0, 3);
  const board = h('div.oc-wire-board.oc-demo-wire', { style: { '--n': 3 } }, rwSource(0, 3), h('div.oc-wire-grid', { style: { '--n': 3 } }, tiles.map(t => t.el)), core);
  return demoBox('oc-demo-rw', [board, h('div.oc-demo-cap', 'TAP TO TURN → ', h('b', 'POWER THE CORE'))], anims => {
    const HOLD = { opacity: 1, transform: 'none' };
    appear(board, 60, anims);
    const R = (deg, t0) => [[0, { transform: `rotate(${deg}deg)` }], [t0, { transform: `rotate(${deg}deg)` }], [t0 + 150, { transform: 'rotate(90deg)' }], [2860, { transform: 'rotate(90deg)' }]];
    loop(tiles[0].rot, R(0, 640), anims);
    loop(tiles[1].rot, [[0, { transform: 'rotate(90deg)' }]], anims);
    loop(tiles[2].rot, R(0, 1300), anims);
    const lit = (el, t) => loop(el, [[0, { opacity: 0 }], [t, { opacity: 0 }], [t + 90, { opacity: 1 }], [2620, { opacity: 1 }], [2860, { opacity: 0 }]], anims);
    const q = sel => tiles.map(t => t.rot.querySelector(sel));
    const L = q('.oc-wire-lit'), S = q('.oc-wire-surge');
    lit(L[0], 760); lit(L[1], 820); lit(L[2], 1420);
    S.forEach((s, i) => loop(s, [[0, { opacity: 0 }], [1560 + i * 70, { opacity: 0 }], [1640 + i * 70, { opacity: 1 }], [1900 + i * 70, { opacity: 0.08 }], [2620, { opacity: 0 }]], anims));
    lit(core.querySelector('.oc-wire-lead'), 1760);
    lit(core.querySelector('.oc-wire-ring-glow'), 1780);
    loop(core.querySelector('.oc-wire-ring-hot'), [[0, { opacity: 0, transform: 'scale(0.4)' }], [1780, { opacity: 0, transform: 'scale(0.4)' }], [1900, { opacity: 1, transform: 'scale(1.3)' }], [2300, { opacity: 0.35, transform: 'scale(1.05)' }], [2620, { opacity: 0.35, transform: 'scale(1.05)' }], [2860, { opacity: 0, transform: 'scale(1)' }]], anims);
    taps.forEach((t, i) => { const at = i ? 1240 : 580; loop(t, [[0, { opacity: 0, transform: 'scale(0.4)' }], [at, { opacity: 0, transform: 'scale(0.4)' }], [at + 60, { opacity: 0.95, transform: 'scale(0.75)' }], [at + 420, { opacity: 0, transform: 'scale(1.6)' }]], anims); });
    void HOLD;
  });
}

/** the demo for a type (null = none) */
export function demoFor(type) {
  if (type === 'pattern') return patternDemo();
  if (type === 'missinglink') return linkDemo();
  if (type === 'higherlower') return hlDemo();
  if (type === 'rewire') return wireDemo();
  return null;
}
