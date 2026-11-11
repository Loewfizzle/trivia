// HOLD'EM — THE RANKINGS SHEET (HE3): one tap from your hand label (or HOW TO PLAY): the ten hands best → worst, each with a tiny example
// in the four-colour faces (the phone's own CARD COLOURS choice). On THE SHEET (ui/sheet.js) — the layer stack, the one Esc.
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { settings } from '../../audio/settings.js';
import { loadSheet } from '../lazy-view.js';
import { faceSvg, RANKINGS } from './card-art.js';

let open = null;
export function openRankings({ mark = null } = {}) {
  if (open) return open;
  loadSheet('holdem');
  const deck = settings.heDeck === 'two' ? 'two' : 'four';
  const list = h('ol.he-rk', RANKINGS.map(([name, line, cards], i) => h(`li.he-rk-row${mark === name ? '.is-mine' : ''}`,
    h('span.he-rk-n', String(i + 1)),
    h('div.he-rk-t', h('b', name), h('small', line)),
    h('div.he-rk-cards', { html: cards.map(c => faceSvg(c, deck, 'mini')).join('') }))));
  open = openSheet({ title: 'HAND RANKINGS', kicker: 'BEST → WORST', cls: 'he-rk-sheet', theme: 'holdem', label: 'Hand rankings', body: [list,
    h('p.he-rk-foot', 'Your best five cards count — any mix of your two and the five on the table. Same hand? The next-best cards decide; a true tie splits the pot.')], onClose: () => { open = null; } });
  return open;
}
