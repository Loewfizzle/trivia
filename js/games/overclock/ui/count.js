// OVERCLOCK — QUICK COUNT: shapes flash, then count one kind.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h } from '../../../ui/dom.js';
import { fastButton } from '../shared.js';

const SHAPE_NAME = { tri: 'triangle', dot: 'circle', sq: 'square', dia: 'diamond' };
const shape = id => h('i.qc-shape', { dataset: { s: id }, 'aria-label': SHAPE_NAME[id] });
export default function uiCount(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-count');
  let timer = 0;
  let locked = false;
  const show = () => {
    if (chal.p >= s.items.length) return;
    const it = s.items[chal.p];
    locked = false;
    const grid = h('div.qc-grid', { style: { '--n': it.size } }, it.cells.map(c => h('span.qc-cell', c ? shape(c) : null)));
    wrap.replaceChildren(h('div.ch-prompt', `MEMORIZE · ${chal.p + 1}/${s.items.length}`), grid);
    timer = setTimeout(() => ask(it), it.flashMs);
  };
  const ask = it => {
    const opts = it.options.map(v => fastButton('button.qc-opt', { dataset: { v: String(v) } }, () => choose(v, it, opts), String(v)));
    wrap.replaceChildren(
      h('div.ch-prompt', `HOW MANY? · ${chal.p + 1}/${s.items.length}`),
      h('div.qc-ask', 'HOW MANY ', shape(it.target), ' ?'),
      h('div.qc-opts', opts));
  };
  const choose = (v, it, opts) => {
    if (locked || chal.done) return;
    locked = true;
    const credit = v === it.ans ? 1 : Math.abs(v - it.ans) === 1 ? 0.5 : 0;
    opts.find(b => Number(b.dataset.v) === it.ans).classList.add('is-correct');
    if (credit < 1) opts.find(b => Number(b.dataset.v) === v).classList.add(credit ? 'is-close' : 'is-wrong');
    api.part(credit);
    timer = setTimeout(() => { if (!chal.done) show(); }, credit === 1 ? 420 : 900);
  };
  show();
  return { el: wrap, destroy() { clearTimeout(timer); } };
}
