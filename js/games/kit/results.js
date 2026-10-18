// Match kit — the results panel under the podium: a stats table (one row per player, your row marked) and the
// Call the Winner outcomes. `ordinal(3)` → "3rd".
//
//   reportPanel({ prefix: 'gl', title: 'BATTLE REPORT', head: ['PLACE', 'PTS', …],
//                 rows: standings.map(r => ({ uid, name, color, me: bool, cells: [ordinal(r.rank), pts, …] })),
//                 calls: game.calls, player })
import { h } from '../../ui/dom.js';
import { colorHex } from '../../config.js';

const cls = (prefix, name) => (prefix && prefix !== 'mk' ? `${prefix}-${name}` : `mk-${name}`);

export const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;

/** The CALL THE WINNER list: who called whom, ✓ + night points or ✗. `calls` = game.calls ({ uid: { w, ok, bonus } }). */
export function callsList({ prefix = 'mk', calls, player }) {
  const items = Object.entries(calls || {}).map(([uid, c]) => {
    const p = player(uid), w = player(c.w);
    return h('li', { class: c.ok ? 'is-ok' : 'is-miss' }, h('b', { style: { color: colorHex(p.color) } }, p.name), ' called ',
      h('b', { style: { color: colorHex(w.color) } }, w.name), h('em', c.ok ? ` ✓ +${c.bonus} night pts` : ' ✗'));
  });
  return [h(`div.${cls(prefix, 'kicker')}`, 'CALL THE WINNER'), items.length ? h(`ul.${cls(prefix, 'calls')}`, ...items) : h(`p.${cls(prefix, 'none')}`, 'Nobody made a call.')];
}

export function reportPanel({ prefix = 'mk', title, head, rows, calls, player, showCalls = true }) {
  const body = rows.map(r => h('tr', { class: r.me ? 'is-me' : null, style: { '--c': colorHex(r.color) } }, h('th', r.name), ...r.cells.map(c => h('td', String(c)))));
  const panel = h(`div.${cls(prefix, 'res')}`, h(`div.${cls(prefix, 'kicker')}`, title),
    h(`div.${cls(prefix, 'res-scroll')}`, h('table', h('thead', h('tr', h('th', ''), ...head.map(x => h('th', x)))), h('tbody', ...body))));
  if (showCalls) panel.append(...callsList({ prefix, calls, player }));
  return panel;
}
