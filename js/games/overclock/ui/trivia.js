// OVERCLOCK — TRIVIA LIGHTNING: three multiple-choice questions.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass } from '../../../ui/dom.js';

export default function uiTrivia(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-trivia');
  let locked = false;
  const show = () => {
    if (chal.p >= s.questions.length) return;
    const q = s.questions[chal.p];
    const opts = q.a.map((a, i) => h('button.tl-opt', { type: 'button', dataset: { sfx: 'none' }, onclick: () => choose(i, q, opts) }, h('span.tl-key', 'ABCD'[i]), h('span', a)));
    wrap.replaceChildren(
      h('div.ch-prompt', `LIGHTNING · ${chal.p + 1}/${s.questions.length}`),
      h('p.tl-q', q.q),
      h('div.tl-opts', opts));
    pulseClass(wrap, 'q-in');
  };
  const choose = (i, q, opts) => {
    if (locked) return;
    locked = true;
    opts[q.c].classList.add('is-correct');
    if (i !== q.c) opts[i].classList.add('is-wrong');
    api.part(i === q.c);
    setTimeout(() => { locked = false; if (!chal.done) show(); }, i === q.c ? 450 : 900);
  };
  show();
  return { el: wrap };
}
