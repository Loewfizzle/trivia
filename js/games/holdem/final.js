// HOLD'EM — THE END SCREEN's BODY (HE4 — docs/holdem.md "THE END SCREEN"). The console owns the FRAME (ui/final.js: BACK TO THE ROOM, the XP
// box, the card reveal); this draws the body — premium but calm, a short gold reveal, no confetti walls:
//   TOURNAMENT — THE WINNER (their emblem, the name big in the casino gold, WINS HOLD'EM), then EVERY PLACE as the console's SLIM CARDS (1st … last,
//                KOs · hands won under each), then two AWARD CHIPS from the server's record: BIGGEST POT (who + how much) · MOST KOs (who + n)
//   CASH — THE LEDGER: one slim card per player who played, sorted by net (BOUGHT IN · FINAL under the card, the NET at its right end (HE5: + green, − red, 0 white —
//          the shared --good / --bad); the foot: hands played · the biggest pot (who, how much). Chips only — no money signs anywhere.
// The rows + the numbers come from the console's game node (`game.rows` + `game.sum`, written by the director from the dealer's table — logic.js).
// The body shows every place itself → el.dataset.podium = 'all' (the frame draws no list of its own).
import { h } from '../../ui/dom.js';
import { avatar, leaderboard } from '../../ui/components.js';
import { colorHex } from '../../config.js';

export const holdemRows = game => (game && Array.isArray(game.rows) ? game.rows : []);
const fmt = n => Math.round(n || 0).toLocaleString('en-US');
const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };

export function finalScene(el, game, state) {
  const players = (state && state.players) || {};
  const rows = holdemRows(game);
  el.classList.add('he-fs');
  if (!rows.length) { el.dataset.podium = 'none'; return; }
  el.dataset.podium = 'all';
  const cash = game.endMode === 'cash' || (game.settings && game.settings.mode === 'cash');
  const sum = game.sum || {};
  const me = state && state.uid;
  const name = id => (players[id] || GHOST).name;
  const names = ids => { const list = (ids || []).map(name); return list.length > 2 ? `${list.length} PLAYERS` : list.join(' & '); };
  el.classList.toggle('is-cash', cash);
  if (cash) {
    el.append(h('div.he-fs-head', h('b', 'THE LEDGER')));
    const list = leaderboard(rows, players, { me, stagger: 50 });
    // (the net's colour rides the row — the slim card upgrade keeps the row + its score element)
    [...list.children].forEach((li, i) => { const n = rows[i] && rows[i].score; li.dataset.net = n > 0 ? '+' : n < 0 ? '-' : '0'; });
    list.classList.add('he-fs-list');
    el.append(list);
    const b = sum.biggest;
    el.append(h('div.he-fs-foot', h('span', `${fmt(sum.hands)} HAND${sum.hands === 1 ? '' : 'S'} PLAYED`),
      b ? h('span', 'BIGGEST POT ', h('b', fmt(b.amount)), ` · ${names(b.ids)}`) : null));
    return;
  }
  const top = rows[0], w = players[top.uid] || GHOST;
  el.append(h('div.he-fs-win', { style: { '--c': colorHex(w.color) } },
    h('div.he-fs-av', avatar(w.avatar, w.color, 58)),
    h('div.he-fs-wt', h('b.he-fs-name', w.name), h('small', 'WINS HOLD’EM'))));
  const list = leaderboard(rows, players, { me, stagger: 50 });
  list.classList.add('he-fs-list');
  el.append(list);
  const chips = [];
  if (sum.biggest) chips.push(chip('BIGGEST POT', fmt(sum.biggest.amount), names(sum.biggest.ids)));
  if (sum.kos) chips.push(chip('MOST KOs', String(sum.kos.n), names(sum.kos.ids)));
  if (chips.length) el.append(h('div.he-fs-chips', chips));
}

function chip(k, v, who) {
  return h('div.he-fs-chip', h('small', k), h('b', v), h('span', who));
}
