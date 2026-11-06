// OVERCLOCK — TRUE OR FALSE: rapid statements. OC1 — THE OVERDRIVE LOOK (docs/overclock.md): one big statement card (blue-edged glass), two
// huge ~110 pt buttons ✓ TRUE / ✕ FALSE — both neutral graphite until tapped, the tapped one turns ORANGE — and "WRONG ANSWERS COST POINTS".
// Right: the button bursts + sparks into the score; wrong: it cracks + shakes and the right one lights. Your pick is kept for THE ANSWER
// (api.pick). Timings unchanged (260 / 800 ms between statements).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { tubeMark } from '../../kit/answer.js';

export default function uiTrueFalse(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-tf.oc-tf');
  let locked = false, timer = 0;
  let yes, no;
  const btn = (v, cls, mark, word) => {
    const b = h(`button.oc-tf-btn.tf-btn.${cls}`, { type: 'button', dataset: { sfx: 'none' }, 'aria-label': word },
      h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('span.oc-tile-glow'), h('i.oc-tf-mark', mark), h('b.oc-tf-word', word),
      h('i.oc-tile-mark.oc-tf-sock', { 'aria-hidden': 'true' }));
    b.addEventListener('pointerdown', e => { e.preventDefault(); choose(v); });
    b.addEventListener('click', e => { if (e.detail === 0) choose(v); });
    return b;
  };
  const show = () => {
    if (chal.p >= s.items.length) return;
    const it = s.items[chal.p];
    const card = h('div.oc-tf-card', h('span.oc-tf-card-glass'), h('span.oc-tf-n', h('b', String(chal.p + 1)), ` / ${s.items.length}`), h('p.oc-tf-q.tf-q', it.text));
    yes = btn(true, 'tf-true', '✓', 'TRUE');
    no = btn(false, 'tf-false', '✕', 'FALSE');
    wrap.replaceChildren(card, h('div.oc-tf-btns.tf-btns', yes, no), h('p.oc-tf-warn', 'WRONG ANSWERS COST POINTS'));
    pulseClass(card, 'q-in');
  };
  const choose = v => {
    if (locked || chal.done) return;
    locked = true;
    const k = chal.p;
    const it = s.items[k];
    const right = v === it.truth;
    const mine = v ? yes : no, other = v ? no : yes;
    mine.classList.add('is-picked');
    yes.classList.add('is-locked'); no.classList.add('is-locked');
    const truthBtn = it.truth ? yes : no;
    truthBtn.classList.add('is-right');
    truthBtn.querySelector('.oc-tf-sock').replaceChildren(tubeMark('check', 'Right answer'));
    if (!right) { mine.classList.add('is-wrong'); mine.querySelector('.oc-tf-sock').replaceChildren(tubeMark('cross', 'Wrong')); }
    else other.classList.add('is-dim');
    api.pick(k, v);
    api.fx(mine, right);
    api.part(right);
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 260 : 800);
  };
  api.key = e => {
    const k = e.key.toLowerCase();
    if (k === 't' || k === 'arrowleft') choose(true);
    else if (k === 'f' || k === 'arrowright') choose(false);
  };
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
