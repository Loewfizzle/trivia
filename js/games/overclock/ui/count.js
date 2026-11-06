// OVERCLOCK — QUICK COUNT: shapes flash, then count one kind (the owner's favourite — "hard but fun"). OC4 — THE OVERDRIVE LOOK
// (docs/overclock.md "QUICK COUNT look" + "Rules kept"): each shape its OWN NEON TUBE in its own colour — triangle PINK, circle CYAN, square
// YELLOW, diamond GREEN (the shapes stay clearly different → colour-blind safe); a BLUE BAR drains during the flash; then "HOW MANY [the
// shape, big as a neon tube] ?" + four big slanted number tiles + "OFF BY ONE STILL EARNS HALF". Right = green, off by one = --close (half),
// wrong = red + the real-glass crack (no ✓ / ✕ on the tiles — the owner, Nov 6).
// THE EXACT FLASH (the owner's rule — tests/overclock-oc4.test.mjs): the shapes are on screen INSTANTLY at full brightness (no fade-in, no
// entrance animation on the grid) and the flash clock (flashMs = 1800 − level × 600, unchanged) STARTS ONLY ONCE THEY'VE PAINTED (two
// animation frames after they're in the page) — the look time is never eaten, it can only run a frame long. The bar starts in that same frame.
// Timings unchanged otherwise (420 / 900 ms to the next count).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h } from '../../../ui/dom.js';

export const SHAPE_NAME = { tri: 'triangle', dot: 'circle', sq: 'square', dia: 'diamond' };
export const SHAPE_COLOR = { tri: '#ff4fb4', dot: '#3fe0ff', sq: '#ffe23a', dia: '#3dff8b' };
const SHAPE_D = {
  tri: 'M50 14L88 82H12Z',
  dot: 'M50 16A34 34 0 1 1 49.9 16Z',
  sq: 'M19 19H81V81H19Z',
  dia: 'M50 10L90 50L50 90L10 50Z',
};
const cache = {};
/** one shape as a neon tube in its colour: the glow, the coloured tube, the white-hot core (a static SVG) */
export function shapeSvg(id) {
  if (cache[id]) return cache[id];
  const c = SHAPE_COLOR[id], d = SHAPE_D[id];
  cache[id] = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="none" stroke="${c}" stroke-width="20" stroke-opacity="0.24" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fffaf2" stroke-width="3" stroke-linejoin="round"/></svg>`;
  return cache[id];
}
export const shapeEl = (id, cls = '') => h(`i.oc-qc-shape${cls}`, { dataset: { s: id }, role: 'img', 'aria-label': SHAPE_NAME[id], html: shapeSvg(id) });
/** run fn once the page has PAINTED what was just put in it (two animation frames) — the flash clock's start */
export const afterPaint = fn => { let a = requestAnimationFrame(() => { a = requestAnimationFrame(fn); }); return () => cancelAnimationFrame(a); };

export default function uiCount(s, api) {
  const { chal } = api;
  const N = s.items.length;
  const wrap = h('div.ch.oc-qc.oc-ownbar');
  const segs = Array.from({ length: N }, () => h('i'));
  const bar = h('div.oc-segbar.oc-qc-bar', { 'aria-hidden': 'true' }, segs);
  const qn = h('b', '1');
  const body = h('div.oc-qc-body');
  let timer = 0, stopPaint = () => {};
  let locked = false;
  const paintBar = () => segs.forEach((g, i) => { g.className = i < chal.p ? 'is-on' : i === chal.p ? 'is-cur' : ''; });
  const show = () => {
    if (chal.p >= N) return;
    const it = s.items[chal.p];
    locked = false;
    qn.textContent = String(chal.p + 1);
    const drain = h('i.oc-qc-drain-fill', { style: { animationDuration: `${it.flashMs}ms` } });
    const grid = h('div.oc-qc-grid', { style: { '--n': it.size } }, it.cells.map(c => h('span.oc-qc-cell', c ? shapeEl(c) : null)));
    body.replaceChildren(h('p.oc-q.oc-qc-q', 'MEMORIZE'), h('div.oc-qc-drain', { 'aria-hidden': 'true' }, drain), grid);
    paintBar();
    // THE EXACT FLASH: the clock + the bar start once the shapes have painted (never before)
    stopPaint = afterPaint(() => {
      if (!grid.isConnected) return;
      chal.local.flashAt = performance.now();   // (the E2E + the timing test read it)
      drain.classList.add('is-run');
      timer = setTimeout(() => ask(it), it.flashMs);
    });
  };
  const ask = it => {
    const k = chal.p;
    const opts = it.options.map(v => {
      const b = h('button.oc-tile.oc-qc-opt', { type: 'button', dataset: { sfx: 'none', v: String(v) }, 'aria-label': String(v) },
        h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-qc-close'), h('span.oc-tile-bad'), h('span.oc-tile-glow'), h('b.oc-qc-n', String(v)), h('small.oc-qc-half', '½'));
      b.addEventListener('pointerdown', e => { e.preventDefault(); choose(v, it, opts, k); });
      b.addEventListener('click', e => { if (e.detail === 0) choose(v, it, opts, k); });
      return b;
    });
    body.replaceChildren(
      h('p.oc-q.oc-qc-ask', 'HOW MANY ', shapeEl(it.target, '.is-big'), ' ?'),
      h('div.oc-qc-opts', opts),
      h('p.oc-qc-note', 'OFF BY ONE STILL EARNS HALF'));
  };
  const choose = (v, it, opts, k) => {
    if (locked || chal.done || k !== chal.p) return;
    locked = true;
    const credit = v === it.ans ? 1 : Math.abs(v - it.ans) === 1 ? 0.5 : 0;
    if (api.pick) api.pick(chal.p, v);   // (OC2 — THE ANSWER)
    const mine = opts.find(b => Number(b.dataset.v) === v);
    opts.forEach(b => b.classList.add('is-locked'));
    mine.classList.add('is-picked');
    opts.find(b => Number(b.dataset.v) === it.ans).classList.add('is-right');
    if (credit === 0.5) mine.classList.add('is-close');
    else if (credit === 0) mine.classList.add('is-wrong');
    opts.forEach(b => { if (!b.classList.contains('is-right') && b !== mine) b.classList.add('is-dim'); });
    if (credit >= 1) api.fx(mine, true); else if (credit === 0) api.fx(mine, false);   // (off by one: no burst, no crack — the --close glow + ½)
    api.part(credit);
    paintBar();
    timer = setTimeout(() => { if (!chal.done) show(); }, credit === 1 ? 420 : 900);
  };
  api.key = e => { const n = Number(e.key); const b = body.querySelectorAll('.oc-qc-opt')[n - 1]; if (n >= 1 && n <= 4 && b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); };
  wrap.append(h('div.oc-qhead', h('span.oc-chip', 'QUICK COUNT'), h('span.oc-qn', qn, ` / ${N}`)), bar, body);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); stopPaint(); api.key = null; } };
}
