// OVERCLOCK — COLOR CLASH: tap the color the word is shown in.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { STROOP_COLORS } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiStroop(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-stroop');
  let locked = false;
  let btns = [];
  const show = () => {
    if (chal.p >= s.items.length) return;
    const it = s.items[chal.p];
    const word = h('div.cc-word', { style: { '--ink': STROOP_COLORS[it.ink].hex }, 'aria-label': `The word ${STROOP_COLORS[it.word].name}` }, STROOP_COLORS[it.word].name);
    btns = it.order.map((id, k) => fastButton('button.cc-opt', { dataset: { c: id }, 'aria-label': `${STROOP_COLORS[id].name} text` }, () => choose(id), h('span.cc-key', String(k + 1)), STROOP_COLORS[id].name));
    wrap.replaceChildren(h('div.ch-prompt', `TAP THE TEXT COLOR · ${chal.p + 1}/${s.items.length}`), word, h('div.cc-opts', btns));
    pulseClass(word, 'q-in');
  };
  const choose = id => {
    if (locked || chal.done) return;
    locked = true;
    const it = s.items[chal.p];
    const right = id === it.ink;
    btns.find(b => b.dataset.c === it.ink).classList.add('is-correct');
    if (!right) btns.find(b => b.dataset.c === id).classList.add('is-wrong');
    api.part(right);
    setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 220 : 650);
  };
  api.key = e => { const k = Number(e.key); if (k >= 1 && k <= 4 && s.items[chal.p]) choose(s.items[chal.p].order[k - 1]); };
  show();
  return { el: wrap, destroy() { api.key = null; } };
}
