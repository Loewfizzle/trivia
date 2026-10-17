// OVERCLOCK — SPELLCHECK: pick the one correct spelling of four.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { fastButton } from '../shared.js';

export default function uiSpellcheck(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-spell');
  let locked = false;
  let btns = [];
  const show = () => {
    if (chal.p >= s.items.length) return;
    const it = s.items[chal.p];
    btns = it.options.map((w, k) => fastButton('button.sp-opt', { 'aria-label': w }, () => choose(k), h('span.sp-key', String(k + 1)), h('span.sp-word', w)));
    wrap.replaceChildren(h('div.ch-prompt', `WHICH IS SPELLED RIGHT? · ${chal.p + 1}/${s.items.length}`), h('div.sp-opts', btns));
    pulseClass(wrap, 'q-in');
  };
  const choose = k => {
    if (locked || chal.done) return;
    locked = true;
    const it = s.items[chal.p];
    const right = k === it.ans;
    btns[it.ans].classList.add('is-correct');
    if (!right) btns[k].classList.add('is-wrong');
    btns.forEach((b, i) => { if (i !== it.ans && i !== k) b.classList.add('is-dim'); });
    api.part(right);
    setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 480 : 1100);
  };
  api.key = e => { const k = Number(e.key); if (k >= 1 && k <= 4) choose(k - 1); };
  show();
  return { el: wrap, destroy() { api.key = null; } };
}
