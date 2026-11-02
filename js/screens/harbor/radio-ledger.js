// CITY CONTROLS A — THE LEDGER (the radio's right face; mockup 3): NIXIE tubes (IN THE CITY now · ROOMS OPEN · GAMES ON); TODAY on a ledger
// page (visitors — an estimate until Vercel Analytics: a visible city says hello every ~2 min —, new players, matches played, the legendaries
// spotted (a dash until PROGRESSION 2.0 counts them), the longest streak alive, ERRORS FROM PHONES in red → /admin's list); THIS WEEK as a
// bar chart (visits · games); a place kept for THE CREW (CC-B). The server's radioLedger (the owner only; from /admin's STATS + the server).
import { h } from '../../ui/dom.js';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
let memo = null;   // { at, data } — 30 s

function nixie(n, d = 3) { return h('span.rd-nixie', ...String(Math.max(0, Math.min(10 ** d - 1, n | 0))).padStart(d, '0').split('').map(c => h('span', c))); }

export function paint({ api, now }) {
  const holder = h('div.rd-paperwrap', h('section.rd-paper', h('h4', 'TODAY'), h('p.rd-hint', 'Reading the ledger…')));
  const fill = L => {
    const T = L.today, wk = L.week || [], max = Math.max(1, ...wk.map(x => x.visits + x.games));
    holder.replaceChildren(
      h('div.rd-big3',
        h('div', nixie(L.now.here), h('small', 'IN THE CITY')),
        h('div', nixie(L.now.rooms), h('small', 'ROOMS OPEN')),
        h('div', nixie(L.now.games), h('small', 'GAMES ON'))),
      h('section.rd-paper', h('h4', 'TODAY', h('em', 'since midnight · Eastern')),
        h('div.rd-lg', h('span', 'Visitors', h('small', 'an estimate')), h('b', String(T.visitors))),
        h('div.rd-lg', h('span', 'New players'), h('b', String(T.newPlayers))),
        h('div.rd-lg', h('span', 'Matches played'), h('b', String(T.matches))),
        h('div.rd-lg', h('span', 'Legendaries spotted', h('small', 'counted from PROGRESSION 2.0')), h('b', T.spotted == null ? '—' : String(T.spotted))),
        h('div.rd-lg', h('span', 'Longest streak alive'), h('b', T.streak ? `${T.streak} night${T.streak > 1 ? 's' : ''}` : '—')),
        h('div.rd-lg', h('span', h('a', { href: '/admin#errors', target: '_blank', rel: 'noopener' }, 'Errors from phones'), h('small', 'last 24 h')), h('b', { class: T.errors ? 'bad' : '' }, String(T.errors)))),
      h('section.rd-paper', h('h4', 'THIS WEEK', h('em', 'visits · games')),
        h('div.rd-chart', ...wk.map(x => {
          const d = new Date(Date.UTC(+x.d.slice(1, 5), +x.d.slice(5, 7) - 1, +x.d.slice(7, 9))), vh = Math.round(72 * x.visits / max), gh = Math.round(72 * x.games / max);
          return h('div', { title: `${x.visits} visits · ${x.games} games` }, h('i', { style: { height: `${vh}px` } }), h('i.g', { style: { height: `${Math.max(gh, x.games ? 3 : 0)}px` } }), h('span', DOW[d.getUTCDay()]));
        })),
        h('div.rd-key', h('span', h('i'), 'visits (estimate)'), h('span', h('i.g'), 'games'))),
      h('section.rd-paper', h('h4', 'THE CREW', h('em', 'next pass')), h('div.rd-lg', h('span', 'Hand-picked friends with a room radio — add one from their card (CITY CONTROLS B).'))));
  };
  const go = async () => {
    try { if (!memo || now() - memo.at > 30e3) memo = { at: now(), data: await api('admin', { action: 'radioLedger' }) }; fill(memo.data); }
    catch (e) { holder.replaceChildren(h('section.rd-paper', h('h4', 'THE LEDGER'), h('p', `Couldn’t read the ledger: ${(e && e.message) || 'offline'}`))); }
  };
  go();
  return [holder];
}
