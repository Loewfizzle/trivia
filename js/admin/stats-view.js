// CITY C — ONE STATS BUILDER (the owner: STATS in an owner-only ☰ sheet, the SAME code as /admin — never a second copy): the blocks /admin's STATS
// card shows (moved here from js/admin/admin.js) + the sheet's own sections (the dailies, legendaries spotted, players, the week) — each a pure
// function of the server's numbers (api/admin.js#stats → core/insights.js#summarize; the sheet's snapshot: api/admin.js#statsSheet).
//   statsBlocks(S, { view, rerender, onPlayer })   → [games, players, matches per day, players' growth, the heat map]
//   openStatsSheet({ api })                        → THE SHEET over the city (loads once + REFRESH; no timer)
// CITY H2 (the owner, Nov 18): THE TILES (PLAYERS = who has PLAYED + "N signed up, never played" · NEW THIS WEEK → its members' sheet · MATCHES
// TODAY — three in one row; FOUNDING MEMBERS gone) → MATCHES PER DAY (a tap on a bar = a small box above it, "NOV 17 · 84 MATCHES") → THE DAILIES
// → GAMES PLAYED → the rest; NO GOLD IN STATS (every bar cyan; a two-tone bar = a dim cyan outer + a hot-pink inner — THE WEEK's visits + games
// too); every slim-card list folds to 3 + SHOW ALL (N) / SHOW LESS. /admin's matching charts follow (the same builders).
import { h } from '../ui/dom.js';
import { avatar, tubeButton } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { fmtTag } from '../core/names.js';
import { GAMES, DAILIES } from '../config.js';
import { lazyImport } from '../ui/lazy-import.js';
import { neonTabs } from '../ui/neon-tabs.js';   // (CITY E: THE NEON TABS — ONE builder with THE BOARD's)

const gameName = id => ([...GAMES, ...DAILIES].find(g => g.id === id) || { name: id }).name;
const CYAN = '#5fe3ff';   // (CITY H2 — NO GOLD IN STATS: every bar the one cyan)
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function big(n, label, sub) {
  return h('div.ad-big', h('b', String(n)), h('span', label), sub ? h('small', sub) : null);
}

function tabs(view, key, opts, rerender) {
  return neonTabs(opts.map(([v, l]) => ({ v, l })), { value: view[key], cls: 'ad-tabs', onPick: v => { view[key] = v; rerender(); } }).el;
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
    h('ol.ad-bars', ...rows.map((r, i) => h('li', { style: { '--c': CYAN, '--w': `${(r.n / max) * 100}%` } },
      h('span.ad-bar-n', `${i + 1}`),
      h('span.ad-bar-name', gameName(r.id)),
      h('span.ad-bar', h('i')),
      h('b', String(r.n)),
      h('small', G.avgPlayers[r.id] ? `${G.avgPlayers[r.id]} avg players` : '')))),
    h('p.ad-note', `${total} matches · counted when the server verifies a finished match`));
}

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** MATCHES PER DAY (CITY H2: a TAP on a bar → a small box above it, "NOV 17 · 84 MATCHES"; another bar moves it, a tap outside closes it). ONE hit
 *  zone over the whole chart (data-press; the full chart height ≥ 44 pt, so every bar's target is 44 pt tall) — the bar from the tap's x (a tap is
 *  no frame loop: its rect read then) */
function dailyBlock(S) {
  const D = S.games.daily;
  const max = Math.max(1, ...D.map(d => d.n));
  const date = k => new Date(Date.UTC(+k.slice(1, 5), +k.slice(5, 7) - 1, +k.slice(7, 9)));
  const label = k => { const d = date(k); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
  const cols = D.map((d, i) => h('div.ad-col', { style: { '--h': `${(d.n / max) * 100}%` } }, h('i'), h('small', i % 5 === 4 || i === D.length - 1 ? label(d.k) : '')));
  const tip = h('div.st-tip', { hidden: true, role: 'status' });
  const hit = h('div.st-hit', { 'data-press': true, 'aria-label': 'Tap a day for its matches' });
  const chart = h('div.st-chart', h('div.ad-cols.st-mpd', ...cols), hit, tip);
  let on = -1, down = null;
  const outside = e => { if (!chart.contains(e.target)) close(); };
  function close() { if (on >= 0 && cols[on]) cols[on].classList.remove('is-on'); on = -1; tip.hidden = true; document.removeEventListener('pointerdown', outside, true); }
  function show(i) {
    if (on >= 0 && cols[on]) cols[on].classList.remove('is-on');
    on = i; cols[i].classList.add('is-on');
    const d = date(D[i].k);
    tip.textContent = `${MON[d.getUTCMonth()]} ${d.getUTCDate()} · ${D[i].n} ${D[i].n === 1 ? 'MATCH' : 'MATCHES'}`;
    tip.style.setProperty('--x', `${((i + 0.5) / D.length) * 100}%`);
    tip.style.setProperty('--yf', String(D[i].n / max));
    tip.dataset.edge = i < 4 ? 'l' : i > D.length - 5 ? 'r' : '';
    tip.hidden = false;
    document.addEventListener('pointerdown', outside, true);
  }
  hit.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  hit.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) { down = null; return; }   // (a scroll, not a tap)
    down = null;
    const r = hit.getBoundingClientRect(), i = Math.max(0, Math.min(D.length - 1, Math.floor(((e.clientX - r.left) / Math.max(1, r.width)) * D.length)));
    if (i === on) close(); else show(i);
  });
  return h('div.ad-block',
    h('h3', 'Matches per day · last 30 days'),
    chart,
    h('p.ad-note', 'Tap a bar for its day.'));
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
  const all = view.players === 'today' ? (P.topToday || []) : view.players === 'week' ? P.topWeek : view.players === 'all' ? P.topAll : P.topXp;
  // (CITY D — the add-on: the list's class was .st-top — the sheet's own header row's: its justify-content shrank the grid to its content →
  //  every card collapsed to its plate. Now .st-players; the strips built once the list HAS its width — fillWhenSized)
  // (CITY H2: 3 cards, then SHOW ALL (N) — SHOW LESS folds it back)
  const list = view['players:all'] ? all : all.slice(0, FOLD);
  const ol = h('ol.wo-list.is-strips.is-still.st-players');
  ol.append(...list.map(p => h('li.wo-row', h('div.wo-card', h('span.fr-knock-ph', String(p.n || '').toUpperCase())), h('div.wo-meta', h('b.wo-where', view.players === 'xp' ? `${(p.x || 0).toLocaleString()} XP` : `${p.n_matches} ${p.n_matches === 1 ? 'match' : 'matches'}`)))));
  fillWhenSized(ol, list);
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Most active players'), tabs(view, 'players', [['today', 'Today'], ['week', 'This week'], ['all', 'All time'], ['xp', 'XP']], v => { view['players:all'] = false; o.rerender(v); })),
    all.length ? ol : h('p.ad-dim', 'No matches yet.'),
    all.length > FOLD ? foldBtn(view, 'players:all', all.length, o.rerender) : null);
}
/** CITY H2 — THE FOLD: every slim-card list in STATS shows FOLD cards + SHOW ALL (N); SHOW LESS folds it back (THE NEON TUBE, small, squared) */
const FOLD = 3;
function foldBtn(view, key, n, rerender) {
  const open = !!view[key];
  return tubeButton(open ? 'SHOW LESS' : `SHOW ALL (${n})`, { kind: 'secondary', size: 'sm', block: true, cls: 'st-fold', attrs: { 'data-press': true, 'aria-expanded': String(open) }, onClick: () => { view[key] = !open; rerender(); } });
}
/** CITY D: the slim cards into a list's rows once it HAS a width (a sheet still opening measures 0 — the long-name fit then wrapped a name
 *  one letter a line) — the STILLS (stripFor: no effect, ui/live-lane.js's rule), ONE per frame */
function fillWhenSized(ol, faces) {
  const go = () => lazyImport(import('../ui/strip-board.js'), '../ui/strip-board.js').then(m => m.stripKit().then(K => {
    const rows = [...ol.children];
    const step = i => { if (i >= rows.length || !ol.isConnected) return; const c = rows[i].querySelector('.wo-card'); if (c && faces[i]) c.replaceChildren(m.stripFor(K, faces[i]).el); requestAnimationFrame(() => step(i + 1)); };
    step(0);
  })).catch(() => {});
  if (typeof ResizeObserver === 'undefined') { go(); return; }
  const ro = new ResizeObserver(es => { for (const e of es) if (e.contentRect.width > 0) { ro.disconnect(); go(); return; } });
  ro.observe(ol);
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
  const O = { view: o.view || { games: 'today', players: 'today' }, rerender: o.rerender || (() => {}), onPlayer: o.onPlayer || null };
  return [gamesBlock(S, O), playersBlock(S, O), dailyBlock(S), growthBlock(S), timesBlock(S)];
}

// ---- THE SHEET's own sections (the snapshot's extras)
const dayLabel = k => { const m = /^d?(\d{4})-?(\d{2})-?(\d{2})$/.exec(String(k || '')); return m ? `${+m[2]}/${+m[3]}` : String(k || ''); };
const metas = new Map();
/** a daily's thin meta (its scoreLine) — the daily screen's own way (lazy, tiny) */
const metaFor = id => { if (!metas.has(id)) metas.set(id, lazyImport(import(`../games/${id}/meta.js`), '../games/*/meta.js').catch(() => ({}))); return metas.get(id); };
const DOW3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dow = k => { const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(String(k || '')); return m ? DOW3[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] : ''; };
/** CITY D — the add-on (Nov 15 10:47 am): WHO played a daily — TODAY · THIS WEEK (neon-underline tabs), newest first, as slim cards (stills)
 *  with the result (its scoreLine — guesses / time / lines; LOCKED OUT / CAUGHT say they failed) or DIDN'T FINISH, a quiet NOT COUNTED (THE
 *  THROWAWAY GATE); ~10 shown, "+N MORE" opens the rest the snapshot kept */
function whoBlock(g, W, view, rerender) {
  const k = `who:${g.id}`, scope = view[k] || 'today', open = view[`${k}:all`];
  const L = g[scope] || { n: 0, rows: [] }, rows = open ? L.rows : L.rows.slice(0, FOLD);   // (CITY H2: 3, then SHOW ALL (N))
  const faces = rows.map(r => W.faces[r.i] || { n: '?' });
  const t = neonTabs([{ v: 'today', l: 'TODAY' }, { v: 'week', l: 'THIS WEEK' }], { value: scope, cls: 'ad-tabs st-who-tabs', onPick: v => { view[k] = v; view[`${k}:all`] = false; rerender(); } }).el;
  const res = h('div.st-who-res');
  const list = h('ol.wo-list.is-strips.is-still.st-who', ...rows.map(r => {
    const out = h('b.wo-where.st-res', r.s != null ? '…' : (scope === 'today' && r.d === W.day ? 'NOT DONE YET' : 'DIDN’T FINISH'));
    if (r.s != null) metaFor(g.id).then(m => { out.textContent = m && typeof m.scoreLine === 'function' ? m.scoreLine(r.s) : String(r.s); });
    return h('li.wo-row', h('div.wo-card', h('span.fr-knock-ph', String((W.faces[r.i] || {}).n || '').toUpperCase())),
      h('div.wo-meta', out, h('small.wo-ago', scope === 'week' ? dow(r.d) : new Date(r.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })), r.x ? h('small.st-nc', 'NOT COUNTED') : null));
  }));
  if (rows.length) fillWhenSized(list, faces);
  // (CITY G — STATS "null": DOM append(null) PRINTS the word "null" — only real nodes go in)
  res.append(rows.length ? list : h('p.ad-dim', scope === 'today' ? 'Nobody has played it today yet.' : 'Nobody played it this week.'));
  if (open && L.n > L.rows.length) res.append(h('p.ad-note', `+${L.n - L.rows.length} more not kept in this copy`));
  if (L.rows.length > FOLD) res.append(foldBtn(view, `${k}:all`, L.n, rerender));
  return h('div.st-who', h('div.ad-row.ad-between', h('small.ad-dim', `${L.n} ${L.n === 1 ? 'player' : 'players'}`), t), res);
}
/** CITY G — THE DAILIES CHART (the 5:42 pm entry — ONE builder: /admin's THE DAILIES + the ☰ STATS sheet): each column a day — the TALL bar =
 *  started with the BRIGHT bar INSIDE it = finished, "finished/started" on top, the day under (TODAY for today); "STARTED n · FINISHED n" (today)
 *  in the header; the note under it. days: [{ day, started, finished }] · today: the day key that reads TODAY → [the head row, the columns, the note] */
export function dailyChart(name, days, today, { head = 'h3' } = {}) {
  const D = days || [], max = Math.max(1, ...D.map(x => x.started || 0)), t = D.find(x => x.day === today) || { started: 0, finished: 0 };
  return [
    h('div.ad-row.ad-between', h(head, name), h('b.ad-dly-today', `STARTED ${t.started || 0} · FINISHED ${t.finished || 0}`)),
    h('div.ad-cols.is-weeks.ad-dly-cols', ...D.map(x => h('div.ad-col', { title: `${dayLabel(x.day)}: ${x.started || 0} started · ${x.finished || 0} finished`, style: { '--h': `${((x.started || 0) / max) * 100}%`, '--f': `${((x.finished || 0) / max) * 100}%` } },
      h('i'), h('i.ad-col-f'), h('em', `${x.finished || 0}/${x.started || 0}`), h('small', x.day === today ? 'TODAY' : dayLabel(x.day))))),
    h('p.ad-note', 'Each column is a day: the tall bar = started, the bright one = finished (finished/started).'),
  ];
}
function dailiesBlock(D, W, view = {}, rerender = () => {}) {
  const rows = (D && D.dailies) || [];
  const whoOf = id => (W && Array.isArray(W.dailies) ? W.dailies.find(x => x.id === id) : null);
  const today = (D && D.day) || (W && W.day) || null;
  return h('div.ad-block', h('h3', 'The dailies · plays a day · finish rate · who'),
    rows.length ? h('div.st-dly', ...rows.map(g => {
      const days = g.days || [], st = days.reduce((a, x) => a + (x.started || 0), 0), fi = days.reduce((a, x) => a + (x.finished || 0), 0);
      // (the chart = /admin's, the sheet's own extras kept: the finish rate + the WHO list)
      return h('div.st-dly-g', ...dailyChart(g.name || g.id, days, today, { head: 'b' }),
        h('small.ad-dim.st-dly-rate', st ? `${Math.round(100 * fi / st)}% finish · ${st} plays / ${days.length} days` : 'no plays yet'),
        whoOf(g.id) ? whoBlock(whoOf(g.id), W, view, rerender) : null);
    })) : h('p.ad-dim', 'No daily is live.'));
}
/** THE WEEK (CITY H2: a bar INSIDE a bar, like the dailies chart — the tall dim cyan = visits, the hot-pink inside = games) */
function weekBlock(W, spotted) {
  const wk = W || [], max = Math.max(1, ...wk.map(x => Math.max(x.visits || 0, x.games || 0)));
  return h('div.ad-block', h('h3', 'The week · visits + games'),
    h('div.ad-cols.is-weeks.ad-dly-cols', ...wk.map(x => h('div.ad-col', { title: `${dayLabel(x.d)}: ${x.visits} visits · ${x.games} games`, style: { '--h': `${((x.visits || 0) / max) * 100}%`, '--f': `${((x.games || 0) / max) * 100}%` } }, h('i'), h('i.ad-col-f'), h('em', `${x.games || 0}/${x.visits || 0}`), h('small', dayLabel(x.d))))),
    h('p.ad-note', 'The tall bar = visits, the bright one = games (games/visits). Visits are an estimate (a visible city says hello every ~5 min).'),
    h('div.ad-subh', 'Legendaries spotted'),
    h('div.ad-cols.is-weeks.st-sp', ...(spotted || []).map(x => h('div.ad-col', { title: `${dayLabel(x.d)}: ${x.n}`, style: { '--h': `${(x.n / Math.max(1, ...(spotted || []).map(y => y.n))) * 100}%` } }, h('i'), h('em', String(x.n)), h('small', dayLabel(x.d))))));
}
/** THE TILES (CITY H2): PLAYERS = who has PLAYED (big) + "N signed up, never played" · NEW THIS WEEK (a tap → its members as slim cards, the day
 *  each joined) · MATCHES TODAY — three in one row at 390 (FOUNDING MEMBERS gone) */
function tilesRow(S, openSheet) {
  const T = S.totals || {}, P = S.players || {};
  const newWeek = (P.newByWeek && P.newByWeek.length) ? P.newByWeek[P.newByWeek.length - 1].n : 0, never = Math.max(0, (T.players || 0) - (T.played || 0));
  const nw = h('button.ad-big.st-tile-go', { type: 'button', 'data-press': true, 'aria-label': `${newWeek} new this week — see who`, onclick: () => openNewMembers(P.newWeek || [], newWeek, openSheet) },
    h('b', String(newWeek)), h('span', 'new this week'), h('small', 'SEE WHO ›'));
  return h('div.ad-bigs.st-tiles', big(T.played || 0, 'players', `${never} signed up, never played`), nw, big((S.today && S.today.matches) || 0, 'matches today'));
}
const DOW_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
/** NEW THIS WEEK's sheet (on top — ONE SHEET STACK): the week's new members as slim cards (stills), newest first, the day each joined */
function openNewMembers(list, n, openSheet) {
  const ol = h('ol.wo-list.is-strips.is-still.st-players.st-new', ...list.map(p => {
    const d = new Date(p.at || 0);
    return h('li.wo-row', h('div.wo-card', h('span.fr-knock-ph', String(p.n || '').toUpperCase())), h('div.wo-meta', h('b.wo-where', `JOINED ${DOW_SHORT[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`), p.h ? h('small.st-nc', 'HIDDEN') : null));
  }));
  if (list.length) fillWhenSized(ol, list);
  return openSheet({ title: 'NEW THIS WEEK', kicker: `${n} NEW ${n === 1 ? 'MEMBER' : 'MEMBERS'}`, cls: 'st-sheet st-new-sheet', label: 'New this week',
    body: [list.length ? ol : h('p.ad-dim', 'Nobody new yet this week.'), n > list.length ? h('p.ad-note', `+${n - list.length} more not kept in this copy`) : null].filter(Boolean) });
}

/** THE SHEET (the ☰ menu's STATS — the owner only, the server checks): loads ONCE when opened + REFRESH; NO timer; the server hands everyone
 *  the same copy built at most every few minutes (statsSheet) — opening it ten times costs ~nothing */
export function openStatsSheet({ api, openSheet }) {
  const css = document.querySelector('link[data-ad]') ? null : Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/css/admin.css' });
  if (css) { css.dataset.ad = '1'; document.head.append(css); }
  const view = { games: 'today', players: 'today' };   // (FIXES R2 — the owner: every tab group in the STATS sheet opens on TODAY)
  const body = h('div.st-body', h('p.ad-dim', 'Reading the numbers…'));
  const stamp = h('small.st-stamp');
  let X = null, busy = false;
  const paint = () => {
    if (!X) return;
    const S = X.S;
    // (CITY H2 — THE ORDER: the tiles → matches per day → THE DAILIES → games played → the rest)
    body.replaceChildren(tilesRow(S, openSheet), h('div.ad-stats-grid', dailyBlock(S), dailiesBlock(X.daily, X.who, view, paint), gamesBlock(S, { view, rerender: paint }), timesBlock(S), playersSlim(S, { view, rerender: paint }), weekBlock(X.week, X.spotted)));
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
