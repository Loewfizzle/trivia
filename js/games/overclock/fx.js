// OVERCLOCK — THE OVERDRIVE FEEDBACK + THE COMBO METER (OC1 — docs/overclock.md "Look"). Visual + sound only (no vibration on iPhone web).
//   RIGHT: the tile bursts (a pre-rendered ring scales out) + sparks stream into the score (each spark one transform animation).
//   WRONG: the tile cracks + shakes, a red EDGE flash, a small screen KICK — quick.
//   THE COMBO: right answers in a row across the match (logic.js#comboFold — the game's combo/{uid} + this challenge's marks): x2, x3 …;
//   x4 = the OVERDRIVE banner (once, pointer-events none); x10 = a quick white flash (≤ 1.5 s, never blocks a tap, never pauses a clock, NO
//   "card unlocked" text — the OVERDRIVE card is the console's reveal after the match, once the server has replayed the feat).
// 60 fps: transform + opacity only; the glows are static layers. Positions are read once per tap (an event, never a frame loop).
// Reduced motion: no sparks, no shake, no kick — the colors, marks and the meter still say it.
import { h, reducedMotion } from '../../ui/dom.js';
import { ocSfx } from './sfx.js';

export const OD_AT = 4;      // the OVERDRIVE banner
export const X10_AT = 10;    // the quick flash (the OVERDRIVE card's feat — OC2 / OC5 report it)
const SPARKS = 9;

/** the combo meter: COMBO ×n + four pips toward OVERDRIVE */
export function createCombo() {
  const n = h('b.oc-combo-n', '×0');
  const pips = Array.from({ length: OD_AT }, () => h('i'));
  const el = h('div.oc-combo', { 'aria-live': 'polite' },
    h('span.oc-combo-glow', { 'aria-hidden': 'true' }),
    h('span.oc-combo-k', 'COMBO'), n, h('span.oc-combo-pips', pips), h('span.oc-combo-od', 'OVERDRIVE'));
  let cur = -1;
  return {
    el,
    get value() { return Math.max(0, cur); },
    /** → what crossed: { up, hitOD, hit10 } (silent on the first set — a refresh never replays a moment) */
    set(v) {
      const prev = cur;
      cur = Math.max(0, v | 0);
      n.textContent = `×${cur}`;
      pips.forEach((p, i) => p.classList.toggle('is-on', i < Math.min(cur, OD_AT)));
      el.classList.toggle('is-live', cur >= 2);
      el.classList.toggle('is-od', cur >= OD_AT);
      if (prev < 0) return { up: false, hitOD: false, hit10: false };
      const up = cur > prev;
      if (up && !reducedMotion()) { el.classList.remove('is-pop'); requestAnimationFrame(() => el.classList.add('is-pop')); }
      return { up, hitOD: prev < OD_AT && cur >= OD_AT, hit10: prev < X10_AT && cur >= X10_AT };
    },
  };
}

/** the sound of a combo step */
export function comboSound(n) {
  if (n >= 4) ocSfx('combo5'); else if (n === 3) ocSfx('combo3'); else if (n === 2) ocSfx('combo2');
}

const CRACK = '<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M52 0 L47 11 L56 17 L44 27 L50 40 M47 11 L33 7 M56 17 L71 13 L82 20 M44 27 L29 31"/></svg>';

/** the full-screen feedback layer (the view appends `el` once; everything inside is pointer-events: none) */
export function createFx(root) {
  const red = h('i.oc-fx-red');
  const white = h('i.oc-fx-white');
  const banner = h('div.oc-fx-banner', h('span.oc-fx-banner-plate'), h('b', 'OVERDRIVE'));
  const el = h('div.oc-fx', { 'aria-hidden': 'true' }, red, white, banner);
  const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };   // (a class re-trigger on a tap — one reflow, never in a frame loop)
  return {
    el,
    /** a right answer on this tile: the burst + the sparks into `target` (the score) */
    right(tile, target) {
      if (tile) { tile.append(h('i.oc-ring')); replay(tile, 'oc-burst'); }
      if (!tile || !target || reducedMotion()) return;
      const a = tile.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      for (let i = 0; i < SPARKS; i++) {
        const s = h('i.oc-spark');
        el.append(s);
        const sx = x0 + (i - (SPARKS - 1) / 2) * (a.width / (SPARKS + 1)), mx = (sx + x1) / 2 + (i % 2 ? 40 : -40), my = Math.min(y0, y1) - 30 - (i % 3) * 18;
        const anim = s.animate([
          { transform: `translate(${sx}px, ${y0}px) scale(1)`, opacity: 1 },
          { transform: `translate(${mx}px, ${my}px) scale(0.9)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.2 },
        ], { duration: 520 + i * 24, delay: i * 18, easing: 'cubic-bezier(0.3, 0.1, 0.4, 1)', fill: 'both' });
        anim.onfinish = () => s.remove();
      }
      setTimeout(() => { if (target.isConnected) replay(target, 'oc-bump'); }, 520);
    },
    /** a wrong answer on this tile (or none): the crack + shake, the red edge, the kick */
    wrong(tile) {
      if (tile) {
        const c = h('i.oc-crack');
        c.innerHTML = CRACK;
        tile.append(c);
        if (!reducedMotion()) replay(tile, 'oc-shake');
      }
      replay(red, 'is-on');
      if (!reducedMotion() && root) root.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-5px, 2px)' }, { transform: 'translate(4px, -2px)' }, { transform: 'translate(-2px, 1px)' }, { transform: 'translate(0, 0)' }], { duration: 260, easing: 'ease-out' });
    },
    /** x4: the OVERDRIVE banner sweeps across once */
    overdrive() { replay(banner, 'is-on'); },
    /** x10: a quick white flash (≤ 1.5 s) */
    x10() { replay(white, 'is-on'); },
    destroy() { el.remove(); },
  };
}
