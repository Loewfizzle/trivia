// HIGH RISE — THE END SCREEN's BODY: "A · THE HERO NUMBER" (S4A FIX's add-on — the owner's pick, Nov 19: Downloads\NEON\highrise-end-A.png;
// docs/highrise.md "THE END SCREEN"). ONE builder for the test page's own card (stage.js) AND the cartridge's body inside the console's
// podium frame (final.js) — the same four things, top to bottom, nothing else:
//   the CAUSE, small, in the accent (MISSED THE STACK · SLIPPED OFF · TOO SLOW · TIME'S UP — MADE IT TO THE MOTHERSHIP in gold)
//   THE FLOOR NUMBER, huge, centred, the cyan glow
//   one line: FLOOR · THE CLOUDS
//   THE STATS STRIP: three columns between two hairlines, thin dividers — PERFECTS · BEST STREAK · YOUR BEST (the best in gold;
//     NEW BEST takes its label's place, in gold, when the run beat it). No boxes, no pills.
// The tower stays LIT under it (the stage's own picture: night.js#pose 'end'); THE FOOT is the caller's (the page's PLAY AGAIN bar · the
// console's standard foot). A VIEW's helper: DOM only — no rules, no storage, no fetch.
import { h } from '../../ui/dom.js';
import { BANDS, bandAt } from './bands.js';

const whole = n => Math.max(0, Math.floor(Number(n) || 0));
const say = n => whole(n).toLocaleString('en-US');

/**
 * endCard() → { el, set({ words, made, floor, perfects, streak }), best(value, isNew) }
 *   set: the run's own numbers (the judge's / the engine's) · best: YOUR BEST's column — 0 = no best yet (the column says —);
 *   isNew = this run beat it (the label reads NEW BEST)
 */
export function endCard() {
  const cause = h('div.hi-ec-cause'), n = h('div.hi-ec-n'), line = h('div.hi-ec-line');
  const perf = h('b', '0'), streak = h('b', '0'), bestV = h('b', '—'), bestK = h('span.hi-ec-k', 'YOUR BEST');
  const bestCol = h('div.hi-ec-col.is-best', bestK, bestV);
  const strip = h('div.hi-ec-strip', h('div.hi-ec-col', h('span.hi-ec-k', 'PERFECTS'), perf), h('div.hi-ec-col', h('span.hi-ec-k', 'BEST STREAK'), streak), bestCol);
  const el = h('div.hi-ec', cause, n, line, strip);
  return {
    el,
    set({ words, made, floor, perfects, streak: st }) {
      const f = whole(floor);
      el.classList.toggle('is-made', !!made);
      cause.textContent = words || '';
      // (each digit its own box — a little room between two: a 1 never runs into its neighbour)
      n.replaceChildren(...[...String(f)].map(d => h('span.hi-dg', { 'aria-hidden': 'true' }, d)));
      n.setAttribute('aria-label', String(f)); n.dataset.dg = String(String(f).length);
      line.textContent = `FLOOR · ${BANDS[bandAt(f)].name}`;
      perf.textContent = say(perfects); streak.textContent = say(st);
    },
    best(value, isNew) {
      const v = whole(value);
      bestV.textContent = v ? say(v) : '—';
      bestK.textContent = isNew && v ? 'NEW BEST' : 'YOUR BEST';
      bestCol.classList.toggle('is-new', !!isNew && v > 0);
    },
  };
}
