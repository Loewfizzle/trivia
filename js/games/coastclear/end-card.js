// COAST CLEAR — THE END SCREEN's result block, ONE builder (FIXES R2): the live end screen (view.js#paintEnd) + TAP A TICKET's sheet
// (js/daily/end-sheet.js — a finished run read back from the server, read-only). Pure DOM from a run view (logic.js#runView, its `reveal` in
// once the run is over) + the phone's buoys: the lighthouse + the headline · the time (a clear) · the line · the finished harbor, shrunk.
import { h } from '../../ui/dom.js';
import { fmtClock, headline, endLineNb, finalMs, endMap, W } from './logic.js';

/** the finished harbor, shrunk: numbers, buoys, every searchlight — animated in by rows (--r) only inside a live .cc-end.is-in */
export function endHarbor(view, buoys = []) {
  const cols = view.w || W;
  const el = h('div.cc-end-map', { role: 'img', 'aria-label': 'the harbor you crossed', style: { '--cc-cols': String(cols) } });
  endMap(view, [...buoys]).forEach((m, i) => {
    const c = h('i.cc-mc', { class: `is-${m.k}`, style: { '--r': String(Math.floor(i / cols)) } });
    if (m.k === 'open') { c.dataset.n = String(m.n); if (m.n > 0) c.textContent = String(m.n); }
    el.append(c);
  });
  return el;
}
/** view + buoys → { el: div.cc-end-result, title, clean: a clear } */
export function ccEndResult(view, buoys = []) {
  const clean = view.out === 'clear';
  const title = h('h2.cc-end-t', headline(view));
  const stage = h('div.cc-end-stage', clean ? h('div.cc-lh', { 'aria-hidden': 'true' }, h('i.cc-lh-glow'), h('i.cc-lh-beam', h('i.cc-lh-core'))) : null, title);
  const el = h('div.cc-end-result', stage, clean ? h('div.cc-end-n', fmtClock(finalMs(view))) : null, h('div.cc-end-line', endLineNb(view)), endHarbor(view, buoys));
  return { el, title, clean };
}
