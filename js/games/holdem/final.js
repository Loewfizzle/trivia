// HOLD'EM — THE PODIUM's BODY (HE3 — a simple, correct body; HE4 makes it premium). The console owns the FRAME (ui/final.js); this draws:
//   TOURNAMENT — the winner + the top 3 as slim cards (KOs · hands won under each)
//   CASH — THE LEDGER: each player's net (+ / −), final chips + bought in (the top 3 here, the frame's list from 4th) — chips only
// The rows come from the console's game node (`game.rows`, written by the director from the dealer's table — logic.js#finalRowsOf).
import { h } from '../../ui/dom.js';
import { leaderboard } from '../../ui/components.js';

export const holdemRows = game => (game && Array.isArray(game.rows) ? game.rows : []);

export function finalScene(el, game, state) {
  const players = (state && state.players) || {};
  const rows = holdemRows(game);
  el.classList.add('he-fs');
  if (!rows.length) { el.dataset.podium = 'none'; return; }
  const cash = game.endMode === 'cash' || (game.settings && game.settings.mode === 'cash');
  const top = rows[0], w = players[top.uid] || { name: 'GHOST' };
  el.append(h('div.he-fs-line',
    h('small', cash ? 'THE LEDGER' : 'LAST ONE WITH CHIPS'),
    h('b', cash ? `${w.name} ${top.scoreText} CHIPS` : w.name),
    h('span', top.note || '')));
  // the top 3 as the console's slim cards (the frame's list starts at 4th — CASH's ledger rows go on there)
  const pick = rows.slice(0, 3);
  const list = leaderboard(pick, players, { me: state && state.uid, stagger: 90 });
  list.classList.add('he-fs-list');
  el.append(list);
}
