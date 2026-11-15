// CITY C — ONE STATS BUILDER (the owner: STATS in an owner-only ☰ sheet, the SAME code as /admin — never a second copy): the blocks /admin's STATS
// card shows (moved here from js/admin/admin.js) + the sheet's own sections (the dailies, legendaries spotted, players, the week) — each a pure
// function of the server's numbers (api/admin.js#stats → core/insights.js#summarize; the sheet's snapshot: api/admin.js#statsSheet).
//   statsBlocks(S, { view, rerender, onPlayer })   → [games, players, matches per day, players' growth, the heat map]
//   openStatsSheet({ api })                        → THE SHEET over the city (loads once + REFRESH; no timer)
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { fmtTag } from '../core/names.js';
import { GAMES, DAILIES } from '../config.js';
import { GAME_LIGHT } from '../board/view.js';
import { lazyImport } from '../ui/lazy-import.js';

const gameName = id => ([...GAMES, ...DAILIES].find(g => g.id === id) || { name: id }).name;
const light = id => (GAME_LIGHT[id] || ['#f2c869'])[0];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function big(n, label, sub) {
  return h('div.ad-big', h('b', String(n)), h('span', label), sub ? h('small', sub) : null);
}

function tabs(view, key, opts, rerender) {
  return h('div.ad-tabs', ...opts.map(([v, label]) => h('button.ad-tab', { type: 'button', class: view[key] === v ? 'is-on' : '', onclick: () => { view[key] = v; rerender(); } }, label)));
}

function gamesBlock(S, o) {
  const view = o.view, G = S.games;
  const src = view.games === 'today' ? (G.today || {}) : view.games === 'week' ? G.week : view.games === '30' ? G.last30 : G.all;
  // (THE POOL FIXES add-on 3: the PLAYABLE games + any game that has plays in this period — never the ten frozen games at 0)
  const rows = GAMES.map(g => ({ id: g.id, n: src[g.id] || 0, on: !!g.playable })).filter(r => r.on || r.n > 0).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...rows.map(r => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0);
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Games played'), tabs(view, 'games', [['today', 'Today'], ['week', 'This week'], ['30', '30 days'], ['all', 'All time']], o.rerender)),
    h('ol.ad-bars', ...rows.map((r, i) => h('li', { style: { '--c': light(r.id), '--w': `${(r.n / max) * 100}%` } },
      h('span.ad-bar-n', `${i + 1}`),
      h('span.ad-bar-name', gameName(r.id)),
      h('span.ad-bar', h('i')),
      h('b', String(r.n)),
      h('small', G.avgPlayers[r.id] ? `${G.avgPlayers[r.id]} avg players` : '')))),
    h('p.ad-note', `${total} matches · counted when the server verifies a finished match`));
}

function dailyBlock(S) {
  const D = S.games.daily;
  const max = Math.max(1, ...D.map(d => d.n));
  const label = k => { const d = new Date(Date.UTC(+k.slice(1, 5), +k.slice(5, 7) - 1, +k.slice(7, 9))); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
  return h('div.ad-block',
    h('h3', 'Matches per day · last 30 days'),
    h('div.ad-cols', ...D.map((d, i) => h('div.ad-col', { title: `${label(d.k)}: ${d.n}`, style: { '--h': `${(d.n / max) * 100}%` } },
      h('i'), h('small', i % 5 === 4 || i === D.length - 1 ? label(d.k) : '')))));
}

function playersBlock(S, o) {
  const view = o.view, P = S.players;
  const list = view.players === 'today' ? (P.topToday || []) : view.players === 'week' ? P.topWeek : view.players === 'all' ? P.topAll : P.topXp;
  const empty = { today: 'No matches yet today.', week: 'No matches yet this week.', all: 'No matches yet.', xp: 'No XP yet.' }[view.players];
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Most active players'), tabs(view, 'players', [['today', 'Today'], ['week', 'This week'], ['all', 'All time'], ['xp', 'XP']], o.rerender)),
    list.length ? h('ol.ad-top', ...list.map((p, i) => h('li',
      h('span.ad-bar-n', String(i + 1)),
      avatar(p.a, p.c, 26),
      o.onPlayer ? h('button.ad-linkbtn', { type: 'button', onclick: () => o.onPlayer(p.pid) }, p.n, h('small', p.t ? fmtTag(p.t) : '')) : h('span.ad-linkbtn', p.n),
      emblem(p.r, 18),
      p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null,
      h('b', view.players === 'xp' ? `${p.x.toLocaleString()} XP` : `${p.n_matches} ${p.n_matches === 1 ? 'match' : 'matches'}`)))) : h('p.ad-dim', empty));
}

/** CITY C — the sheet's MOST ACTIVE PLAYERS as SLIM CARDS (ui/strip-board.js — SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS; still, no motion) */
function playersSlim(S, o) {
  const view = o.view, P = S.players;
  const list = view.players === 'today' ? (P.topToday || []) : view.players === 'week' ? P.topWeek : view.players === 'all' ? P.topAll : P.topXp;
  const ol = h('ol.wo-list.is-strips.is-still.st-top');
  ol.append(...list.slice(0, 8).map(p => h('li.wo-row', h('div.wo-card', h('span.fr-knock-ph', String(p.n || '').toUpperCase())), h('div.wo-meta', h('b.wo-where', view.players === 'xp' ? `${(p.x || 0).toLocaleString()} XP` : `${p.n_matches} ${p.n_matches === 1 ? 'match' : 'matches'}`)))));
  lazyImport(import('../ui/strip-board.js'), '../ui/strip-board.js').then(m => m.stripKit().then(K => { [...ol.children].forEach((li, i) => { const c = li.querySelector('.wo-card'); if (c && list[i]) c.replaceChildren(m.stripFor(K, list[i]).el); }); })).catch(() => {});
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Most active players'), tabs(view, 'players', [['today', 'Today'], ['week', 'This week'], ['all', 'All time'], ['xp', 'XP']], o.rerender)),
    list.length ? ol : h('p.ad-dim', 'No matches yet.'));
}
function growthBlock(S) {
  const P = S.players, T = S.totals;
  const max = Math.max(1, ...P.newByWeek.map(w => w.n));
  const wl = k => `${+k.slice(5, 7)}/${+k.slice(7, 9)}`;
  return h('div.ad-block',
    h('h3', 'Players'),
    h('div.ad-bigs.is-small',
      big(S.today ? S.today.players : 0, 'played today', S.today ? `${S.today.matches} ${S.today.matches === 1 ? 'match' : 'matches'} today` : null),
      big(P.activeWeek, 'played this week', P.activeWeek ? `${P.returningWeek} came back from an earlier week` : null),
      big(T.played, 'have played', `${T.multiNight} on more than one night`),
      big(T.players, 'profiles')),
    h('div.ad-subh', 'New players per week'),
    h('div.ad-cols.is-weeks', ...P.newByWeek.map(w => h('div.ad-col', { title: `week of ${wl(w.wk)}: ${w.n}`, style: { '--h': `${(w.n / max) * 100}%` } },
      h('i'), h('em', String(w.n)), h('small', wl(w.wk))))));
}

function timesBlock(S) {
  const T = S.times;
  const hours = [0, 6, 12, 18];
  return h('div.ad-block.ad-wide',
    h('h3', `Busiest times · last ${T.days} days · Eastern`),
    h('div.ad-heat',
      h('span'), ...Array.from({ length: 24 }, (_, hr) => h('small.ad-heat-h', hours.includes(hr) ? ['12a', '6a', '12p', '6p'][hours.indexOf(hr)] : '')),
      ...T.grid.flatMap((row, d) => [h('small.ad-heat-d', DOW[d]), ...row.map((n, hr) => h('i', { title: `${DOW[d]} ${hr}:00 — ${n} ${n === 1 ? 'match' : 'matches'}`, style: { '--a': T.max ? (n ? 0.15 + 0.85 * (n / T.max) : 0) : 0 } }))])),
    h('p.ad-note', 'Each square is an hour; brighter = more matches finished then.'));
}

/** the blocks both places show */
export function statsBlocks(S, o = {}) {
  const O = { view: o.view || { games: '30', players: 'all' }, rerender: o.rerender || (() => {}), onPlayer: o.onPlayer || null };
  return [gamesBlock(S, O), playersBlock(S, O), dailyBlock(S), growthBlock(S), timesBlock(S)];
}

// ---- THE SHEET's own sections (the snapshot's extras)
const dayLabel = k => { const m = /^d?(\d{4})-?(\d{2})-?(\d{2})$/.exec(String(k || '')); return m ? `${+m[2]}/${+m[3]}` : String(k || ''); };
function dailiesBlock(D) {
  const rows = (D && D.dailies) || [];
  return h('div.ad-block', h('h3', 'The dailies · plays a day · finish rate'),
    rows.length ? h('div.st-dly', ...rows.map(g => {
      const days = g.days || [], max = Math.max(1, ...days.map(x => x.started || 0)), st = days.reduce((a, x) => a + (x.started || 0), 0), fi = days.reduce((a, x) => a + (x.finished || 0), 0);
      return h('div.st-dly-g', h('div.ad-row.ad-between', h('b', g.name || g.id), h('small.ad-dim', st ? `${Math.round(100 * fi / st)}% finish · ${st} plays / ${days.length} days` : 'no plays yet')),
        h('div.ad-cols.st-dly-cols', ...days.map(x => h('div.ad-col', { title: `${dayLabel(x.day)}: ${x.started || 0} plays · ${x.finished || 0} finished`, style: { '--h': `${((x.started || 0) / max) * 100}%` } }, h('i'), h('small', dayLabel(x.day))))));
    })) : h('p.ad-dim', 'No daily is live.'));
}
function weekBlock(W, spotted) {
  const wk = W || [], max = Math.max(1, ...wk.map(x => (x.visits || 0) + (x.games || 0)));
  return h('div.ad-block', h('h3', 'The week · visits + games'),
    h('div.ad-cols.is-weeks', ...wk.map(x => h('div.ad-col', { title: `${dayLabel(x.d)}: ${x.visits} visits · ${x.games} games`, style: { '--h': `${(((x.visits || 0) + (x.games || 0)) / max) * 100}%` } }, h('i'), h('em', String((x.visits || 0) + (x.games || 0))), h('small', dayLabel(x.d))))),
    h('p.ad-note', 'Visits are an estimate (a visible city says hello every ~5 min).'),
    h('div.ad-subh', 'Legendaries spotted'),
    h('div.ad-cols.is-weeks.st-sp', ...(spotted || []).map(x => h('div.ad-col', { title: `${dayLabel(x.d)}: ${x.n}`, style: { '--h': `${(x.n / Math.max(1, ...(spotted || []).map(y => y.n))) * 100}%` } }, h('i'), h('em', String(x.n)), h('small', dayLabel(x.d))))));
}
function playersLine(S, X) {
  const T = S.totals || {}, P = S.players || {};
  const newWeek = (P.newByWeek && P.newByWeek.length) ? P.newByWeek[P.newByWeek.length - 1].n : 0;
  return h('div.ad-bigs.is-small', big(T.players || 0, 'players', `${T.played || 0} have played`), big(newWeek, 'new this week'), big(X.founders || 0, 'founding members', X.founder ? (X.founder.open ? 'the window is OPEN' : 'the window is CLOSED') : null),
    big((S.today && S.today.matches) || 0, 'matches today'));
}

/** THE SHEET (the ☰ menu's STATS — the owner only, the server checks): loads ONCE when opened + REFRESH; NO timer; the server hands everyone
 *  the same copy built at most every few minutes (statsSheet) — opening it ten times costs ~nothing */
export function openStatsSheet({ api, openSheet }) {
  const css = document.querySelector('link[data-ad]') ? null : Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/css/admin.css' });
  if (css) { css.dataset.ad = '1'; document.head.append(css); }
  const view = { games: '30', players: 'all' };
  const body = h('div.st-body', h('p.ad-dim', 'Reading the numbers…'));
  const stamp = h('small.st-stamp');
  let X = null, busy = false;
  const paint = () => {
    if (!X) return;
    const S = X.S;
    body.replaceChildren(playersLine(S, X), h('div.ad-stats-grid', dailyBlock(S), timesBlock(S), playersSlim(S, { view, rerender: paint }), dailiesBlock(X.daily), weekBlock(X.week, X.spotted), gamesBlock(S, { view, rerender: paint })));
    stamp.textContent = `built ${new Date(X.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · the same copy for everyone`;
  };
  const load = async fresh => {
    if (busy) return; busy = true;
    try { X = await api('admin', { action: 'statsSheet', ...(fresh ? { fresh: true } : {}) }); paint(); }
    catch (e) { body.replaceChildren(h('p.ad-dim', /not_owner|not_admin|403/.test(String(e && (e.code || e.message))) ? 'The owner only.' : `Couldn’t read the numbers (${(e && e.message) || 'offline'}).`)); }
    finally { busy = false; }
  };
  const refresh = h('button.st-refresh', { type: 'button', 'data-press': true, onclick: () => load(true) }, 'REFRESH');
  const s = openSheet({ title: 'STATS', kicker: 'THE OWNER ONLY · THE HISTORY', cls: 'st-sheet', label: 'Stats', body: [h('div.st-top', stamp, refresh), body] });
  load(false);
  return s;
}
