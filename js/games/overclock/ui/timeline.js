// OVERCLOCK — TIMELINE: tap four items into order.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { timelineCorrect } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiTimeline(s, api) {
  const { chal } = api;
  let picks = [];
  const [from, to] = s.dir.split('→').map(x => x.trim());
  const submitBtn = h('button.btn.btn-primary.btn-block.tl-submit', { type: 'button', disabled: true, onclick: () => submit() }, 'LOCK IN ORDER');
  const rows = s.shown.map((_, idx) => fastButton('button.tm-item', { 'aria-label': s.items[s.shown[idx]].label }, () => tap(idx),
    h('span.tm-badge'), h('span.tm-label', s.items[s.shown[idx]].label), h('span.tm-val')));
  const paint = () => {
    rows.forEach((r, idx) => {
      const k = picks.indexOf(idx);
      r.classList.toggle('is-picked', k >= 0);
      r.querySelector('.tm-badge').textContent = k >= 0 ? String(k + 1) : '';
    });
    submitBtn.disabled = picks.length < 4;
  };
  const tap = idx => {
    if (chal.done) return;
    const k = picks.indexOf(idx);
    if (k >= 0) picks.splice(k, 1); else if (picks.length < 4) picks.push(idx);
    sfx(k >= 0 ? 'tap' : 'key');
    vibrate(6);
    paint();
  };
  const submit = () => {
    if (chal.done || picks.length < 4) return;
    const right = timelineCorrect(s, picks);
    rows.forEach((r, idx) => {
      const pos = s.shown[idx];
      r.classList.add(picks.indexOf(idx) === pos ? 'is-right' : 'is-wrong');
      r.querySelector('.tm-val').textContent = `#${pos + 1} · ${s.items[pos].value}`;
    });
    sfx(right === 4 ? 'solve' : right >= 2 ? 'ocCorrect' : 'ocWrong');
    vibrate(right === 4 ? [20, 40, 20] : 12);
    api.progress(right, 4, { o: picks.join('') }, true, 2200);
  };
  paint();
  const el = h('div.ch.ch-timeline',
    h('div.tm-head', h('span.tm-cat', s.title), h('p.tm-ask', s.ask)),
    h('div.tm-dir', h('span', '1 = ', h('b', from)), h('i', '→'), h('span', '4 = ', h('b', to))),
    h('div.tm-list', rows),
    submitBtn);
  return { el };
}
