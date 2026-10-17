// OVERCLOCK — ODD ONE OUT: find the one different symbol, three grids.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, clear } from '../../../ui/dom.js';

export default function uiOddOne(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-odd');
  const show = () => {
    clear(wrap);
    if (chal.p >= s.grids.length) return;
    const gspec = s.grids[chal.p];
    const grid = h('div.odd-grid', { style: { '--n': gspec.size } });
    for (let i = 0; i < gspec.size * gspec.size; i++) {
      const b = h('button.odd-cell', { type: 'button', dataset: { sfx: 'none' }, onclick: () => pickCell(i, gspec, grid) }, i === gspec.idx ? gspec.odd : gspec.base);
      grid.append(b);
    }
    wrap.append(h('div.ch-prompt', `FIND THE ODD ONE · ${chal.p + 1}/${s.grids.length}`), grid);
  };
  let locked = false;
  const pickCell = (i, gspec, grid) => {
    if (locked) return;
    locked = true;
    const right = i === gspec.idx;
    grid.children[gspec.idx].classList.add('is-odd');
    if (!right) grid.children[i].classList.add('is-miss');
    api.part(right);
    setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 350 : 750);
  };
  show();
  return { el: wrap };
}
