// OVERCLOCK — ODD ONE OUT: find the one different symbol, three grids (4×4 · 5×5 · 6×6), each from a different FAMILY (odd.js — letters /
// numbers · rotation · mirror · neon shapes). OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks" + "ODD ONE OUT"): GLASS CELLS, the
// symbol a neon tube (ui/oddart.js) or a glyph in the monospace "coding" face; THREE SLANTED PIPS for the three grids. Found: the cell BLAZES
// WHITE-HOT and pops while the rest dim. Wrong: the REAL-GLASS CRACK on that cell, glowing red — and the odd one shows itself green (no ✓ / ✕
// on the cells — the owner, Nov 6: green + red, the red one cracked). Timings unchanged (350 ms / 750 ms to the next grid).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { oddArt, oddTurn } from './oddart.js';

/** one glass cell's picture (shared with THE ANSWER's mini grids) */
export function oddFace(token, fam) {
  const art = oddArt(token, fam);
  const t = oddTurn(token, fam);
  return art ? h('i.oc-odd-art', { html: art, style: t ? { transform: t } : null }) : h('b.oc-odd-glyph', token);
}

export default function uiOddOne(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.oc-odd.oc-ownbar');
  const pips = s.grids.map(() => h('i'));
  const bar = h('div.oc-segbar.oc-odd-pips', { 'aria-hidden': 'true' }, pips);
  const qn = h('b', '1');
  const famK = h('span.oc-odd-fam');
  const holder = h('div.oc-odd-hold');
  let locked = false, timer = 0, cells = [];
  const FAM_LABEL = { glyph: 'LETTERS + NUMBERS', rot: 'ONE IS TURNED', mirror: 'ONE IS FLIPPED', shape: 'ONE IS DIFFERENT' };
  const paintPips = () => pips.forEach((g, i) => { g.className = i < chal.p ? 'is-on' : i === chal.p ? 'is-cur' : ''; });
  const show = () => {
    if (chal.p >= s.grids.length) return;
    const k = chal.p;
    const g = s.grids[k];
    qn.textContent = String(k + 1);
    famK.textContent = FAM_LABEL[g.fam] || '';
    cells = Array.from({ length: g.size * g.size }, (_, i) => {
      const b = h('button.oc-odd-cell', { type: 'button', dataset: { sfx: 'none', i: String(i) }, 'aria-label': `Row ${Math.floor(i / g.size) + 1}, column ${(i % g.size) + 1}` },
        h('i.oc-odd-glass'), h('i.oc-odd-hot'), oddFace(i === g.idx ? g.odd : g.base, g.fam));
      b.addEventListener('pointerdown', e => { e.preventDefault(); pick(i, k); });
      b.addEventListener('click', e => { if (e.detail === 0) pick(i, k); });
      return b;
    });
    const grid = h('div.oc-odd-grid', { class: `is-${g.fam}`, style: { '--n': g.size } }, cells);
    holder.replaceChildren(grid);
    paintPips();
    pulseClass(grid, 'q-in');
  };
  const pick = (i, k) => {
    if (locked || chal.done || k !== chal.p) return;
    locked = true;
    const g = s.grids[k];
    const right = i === g.idx;
    if (api.pick) api.pick(k, i);   // (OC2 — THE ANSWER)
    const grid = holder.firstChild;
    grid.classList.add('is-done');
    cells[g.idx].classList.add(right ? 'is-found' : 'is-right');
    if (!right) cells[i].classList.add('is-wrong');
    if (right) pulseClass(cells[g.idx], 'is-pop', 360);
    api.fx(cells[i], right, { k: i });
    api.part(right);
    paintPips();
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 350 : 750);
  };
  wrap.append(
    h('div.oc-qhead', h('span.oc-chip', 'GRID ', qn, ' / 3'), famK),
    bar,
    h('p.oc-q.oc-odd-q', 'FIND THE ODD ONE'),
    holder);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); } };
}
