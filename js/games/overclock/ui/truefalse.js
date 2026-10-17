// OVERCLOCK — TRUE OR FALSE: rapid statements.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { fastButton } from '../shared.js';

export default function uiTrueFalse(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-tf');
  let locked = false;
  let yes, no;
  const show = () => {
    if (chal.p >= s.items.length) return;
    const it = s.items[chal.p];
    const text = h('p.tf-q', it.text);
    yes = fastButton('button.tf-btn.tf-true', {}, () => choose(true), 'TRUE');
    no = fastButton('button.tf-btn.tf-false', {}, () => choose(false), 'FALSE');
    wrap.replaceChildren(h('div.ch-prompt', `TRUE OR FALSE · ${chal.p + 1}/${s.items.length}`), text, h('div.tf-btns', no, yes));
    pulseClass(text, 'q-in');
  };
  const choose = v => {
    if (locked || chal.done) return;
    locked = true;
    const it = s.items[chal.p];
    const right = v === it.truth;
    (it.truth ? yes : no).classList.add('is-correct');
    if (!right) (v ? yes : no).classList.add('is-wrong');
    api.part(right);
    setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 260 : 800);
  };
  api.key = e => {
    const k = e.key.toLowerCase();
    if (k === 't' || k === 'arrowright') choose(true);
    else if (k === 'f' || k === 'arrowleft') choose(false);
  };
  show();
  return { el: wrap, destroy() { api.key = null; } };
}
