// /admin — moderation for the global boards. Signs in with this browser's own anonymous identity (the same profile as
// the app on this browser); every action goes to POST /api/admin, which checks the profile id against ADMIN_PIDS and
// writes an audit entry. Search players, remove a record, reset a board, rename, hide from the boards, the audit log.
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem, installEmblems } from '../ui/emblems.js';
import { initFirebase, isConfigured } from '../firebase.js';
import { api } from '../profile/api.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { fmtTag, isOffensive } from '../core/names.js';
import { RANKS } from '../core/ranks.js';
import { GAMES } from '../config.js';
import { GAME_LIGHT } from '../board/view.js';

const app = document.getElementById('app');
const gameName = id => (GAMES.find(g => g.id === id) || { name: id }).name;
const when = at => new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
let current = null;

function toast(text, kind = 'ok') {
  const t = h('div.ad-toast', { class: `is-${kind}` }, text);
  document.body.append(t);
  setTimeout(() => t.classList.add('is-out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

async function call(action, body = {}) {
  try { return await api('admin', { action, ...body }); } catch (e) { toast(e.message || 'Failed', 'err'); throw e; }
}

function confirmBtn(label, onConfirm, cls = '') {
  let armed = false;
  const b = h('button.ad-btn', { type: 'button', class: cls, onclick: async () => {
    if (!armed) { armed = true; b.textContent = 'Sure? Tap again'; b.classList.add('is-armed'); setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('is-armed'); }, 3500); return; }
    armed = false; b.disabled = true;
    try { await onConfirm(); } finally { b.disabled = false; b.textContent = label; b.classList.remove('is-armed'); }
  } }, label);
  return b;
}

function denied(who) {
  app.replaceChildren(h('section.ad-card.ad-denied',
    h('div.ad-kicker', 'NEON SPEAKEASY · ADMIN'),
    h('h1', 'Not authorized'),
    h('p', 'This page only works for the profile ids listed in the ADMIN_PIDS environment variable on Vercel.'),
    who && who.pid ? h('div.ad-pidbox', h('span', 'This browser’s profile id'), h('code', who.pid),
      h('button.ad-btn', { type: 'button', onclick: () => navigator.clipboard.writeText(who.pid).then(() => toast('Copied')) }, 'Copy')) : h('p', 'No profile on this browser yet — open the game once (or restore your key) and come back.'),
    h('ol.ad-steps',
      h('li', 'Copy the id above (open this page in the browser where you play).'),
      h('li', 'Vercel → your project → Settings → Environment Variables → ADMIN_PIDS = that id (several: comma-separated).'),
      h('li', 'Redeploy (Deployments → ⋯ → Redeploy), then reload this page.')),
    h('a.ad-link', { href: '/' }, '‹ Back to the game')));
}

function shell() {
  const q = h('input.input.ad-q', { type: 'search', placeholder: 'Name, Name#1234 or profile id', autocomplete: 'off', onkeydown: e => { if (e.key === 'Enter') search(q.value); } });
  app.replaceChildren(
    h('header.ad-head', h('div', h('div.ad-kicker', 'NEON SPEAKEASY'), h('h1', 'Admin')), h('a.ad-link', { href: '/board' }, 'The Board ›')),
    h('div.ad-grid',
      h('section.ad-card.ad-live', { id: 'ad-live' }, h('p.ad-dim', 'Loading…')),
      h('section.ad-card.ad-stats', { id: 'ad-stats' }),
      h('section.ad-card.ad-search',
        h('h2', 'Players'),
        h('div.ad-row', q, h('button.ad-btn.is-primary', { type: 'button', onclick: () => search(q.value) }, 'Search')),
        h('div.ad-results', { id: 'ad-results' }, h('p.ad-dim', 'Search by name to start.'))),
      h('section.ad-card.ad-player', { id: 'ad-player' }, h('p.ad-dim', 'Pick a player.')),
      h('section.ad-card.ad-errors',
        h('div.ad-row.ad-between', h('h2', 'Errors from phones'),
          h('div.ad-row', h('button.ad-btn', { type: 'button', onclick: errors }, 'Refresh'),
            confirmBtn('Clear all', async () => { renderErrors((await call('clearErrors')).errors); toast('Cleared'); audit(); }, 'is-danger'))),
        h('p.ad-dim', 'Code errors on players’ screens, grouped: the same error from many phones is one line with a count. Quiet for 30 days → removed.'),
        h('ol.ad-errs', { id: 'ad-errs' }, h('li.ad-dim', 'Loading…'))),
      h('section.ad-card.ad-audit', h('div.ad-row.ad-between', h('h2', 'Audit log'), h('button.ad-btn', { type: 'button', onclick: audit }, 'Refresh')), h('ol.ad-log', { id: 'ad-log' }))));
  audit();
  errors();
  loadStats();
  // "live now" keeps itself current while the page is open and visible (the server caches it for 30 s)
  setInterval(() => { if (document.visibilityState === 'visible') loadStats(false, true); }, 30_000);
}

async function search(text) {
  const box = document.getElementById('ad-results');
  box.replaceChildren(h('p.ad-dim', 'Searching…'));
  const { players } = await call('search', { q: text });
  box.replaceChildren(...(players.length ? players.map(p => h('button.ad-hit', { type: 'button', onclick: () => open(p.pid) },
    avatar(p.a, p.c, 28), h('span.ad-hit-n', p.n, h('small', fmtTag(p.t))), emblem(p.r, 18), p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null, isOffensive(p.n) ? h('span.ad-tag.is-bad', 'NAME') : null)) : [h('p.ad-dim', 'No one by that name.')]));
}

async function open(pid) {
  current = pid;
  render(await call('player', { pid }));
}

function render(v) {
  const box = document.getElementById('ad-player');
  const p = v.profile;
  const name = h('input.input', { value: p.n, maxLength: 12, 'aria-label': 'New name' });
  const boards = v.boards.slice().sort((a, b) => (a.game + a.b).localeCompare(b.game + b.b));
  box.replaceChildren(
    h('div.ad-who', avatar(p.a, p.c, 46), h('div', h('div.ad-who-n', p.n, h('small', fmtTag(p.t))), h('div.ad-dim', `${RANKS[p.r].name} · ${p.x.toLocaleString()} XP · ${p.pid}`)), emblem(p.r, 40)),
    h('div.ad-flags',
      v.priv.shown ? h('span.ad-tag', 'SHOWN') : h('span.ad-tag.is-hidden', 'OPTED OUT'),
      v.priv.banned ? h('span.ad-tag.is-bad', 'HIDDEN BY ADMIN') : null,
      isOffensive(p.n) ? h('span.ad-tag.is-bad', 'OFFENSIVE NAME — SHOWS AS PLAYER') : null),
    h('h3', 'Rename'),
    h('div.ad-row', name, h('button.ad-btn', { type: 'button', onclick: async () => { render(await call('rename', { pid: p.pid, name: name.value })); toast('Renamed'); audit(); } }, 'Rename')),
    h('h3', 'Visibility'),
    h('div.ad-row', v.priv.banned
      ? confirmBtn('Return to the boards', async () => { render(await call('hide', { pid: p.pid, on: false })); toast('Back on the boards'); audit(); })
      : confirmBtn('Hide from every board', async () => { render(await call('hide', { pid: p.pid, on: true })); toast('Hidden'); audit(); }, 'is-danger')),
    h('h3', 'Boards'),
    boards.length ? h('div.ad-boards', ...boards.map(b => {
      const def = boardDef(b.b);
      return h('div.ad-board',
        h('div.ad-board-h', h('b', `${gameName(b.game)} · ${def ? def.label : b.b}`), h('code', b.b)),
        h('div.ad-board-v',
          h('span', 'ALL TIME ', h('b', b.all ? fmtValue(def, b.all.v) : '—'), b.all && b.all.rank ? ` #${b.all.rank}` : ''),
          h('span', 'THIS WEEK ', h('b', b.week ? fmtValue(def, b.week.v) : '—'), b.week && b.week.rank ? ` #${b.week.rank}` : '')),
        h('div.ad-row',
          def && def.kind === 'record' ? confirmBtn('Remove all-time', async () => { render(await call('removeRecord', { pid: p.pid, b: b.b, p: 'all' })); audit(); }) : null,
          def && def.kind === 'record' ? confirmBtn('Remove this week', async () => { render(await call('removeRecord', { pid: p.pid, b: b.b, p: 'week' })); audit(); }) : null,
          confirmBtn(def && def.kind === 'record' ? 'Remove both' : 'Reset this board', async () => { render(await call(def && def.kind === 'record' ? 'removeRecord' : 'resetBoard', { pid: p.pid, b: b.b })); audit(); }, 'is-danger')));
    })) : h('p.ad-dim', 'Not on any board.'),
    h('h3', 'Games'),
    h('div.ad-games', ...Object.entries(v.stats.g || {}).map(([g, s]) => h('span', h('b', gameName(g)), ` ${s.p || 0} played · ${s.w || 0} won`))));
}

async function audit() {
  const box = document.getElementById('ad-log');
  if (!box) return;
  const { log, names } = await call('audit', { limit: 80 });
  box.replaceChildren(...(log.length ? log.map(l => h('li',
    h('span.ad-when', when(l.at)),
    h('b', l.act),
    h('button.ad-linkbtn', { type: 'button', onclick: () => l.pid && open(l.pid) }, names[l.pid] || l.pid || ''),
    h('span.ad-dim', [l.b, l.p, l.from && `${l.from} → ${l.to}`].filter(Boolean).join(' · ')),
    h('span.ad-dim', `by ${names[l.by] || l.by}`))) : [h('li.ad-dim', 'Nothing yet.')]));
}

// ---------------------------------------------------------------- STATS (js/core/insights.js)
const light = id => (GAME_LIGHT[id] || ['#f2c869'])[0];
const ago = ms => { const m = Math.round(ms / 60_000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
const PHASE = { play: 'playing', intro: 'starting', final: 'podium', lobby: 'in the lobby' };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const view = { games: '30', players: 'all' };   // opens on views that aren't empty on a Monday morning
let S = null;

async function loadStats(fresh = false, quiet = false) {
  try {
    S = await (quiet ? api('admin', { action: 'stats' }) : call('stats', { fresh }));
    renderLive();
    if (!quiet) renderStats();
  } catch { /* the toast said so (or a quiet refresh failed: try again in 30 s) */ }
}

function big(n, label, sub) {
  return h('div.ad-big', h('b', String(n)), h('span', label), sub ? h('small', sub) : null);
}

function renderLive() {
  const box = document.getElementById('ad-live');
  if (!box || !S) return;
  const L = S.live;
  const inGame = Object.values(L.playing).reduce((a, b) => a + b, 0);
  box.replaceChildren(
    h('div.ad-row.ad-between', h('h2', h('i.ad-dot', { class: L.online ? 'is-on' : '' }), 'Live now'),
      h('div.ad-row', h('span.ad-dim', `updated ${new Date(S.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`),
        h('button.ad-btn', { type: 'button', onclick: () => loadStats(true) }, 'Refresh'))),
    h('div.ad-bigs', big(L.online, 'players in rooms'), big(L.rooms, 'rooms open'), big(inGame, 'games in progress')),
    L.list.length ? h('ul.ad-rooms', ...L.list.map(r => h('li', { style: { '--c': r.game ? light(r.game) : 'rgba(255,240,220,0.35)' } },
      h('b', r.game ? gameName(r.game) : 'Lobby'),
      h('span', r.game ? PHASE[r.phase] || r.phase || '' : 'picking a game'),
      h('span', `${r.online} online${r.players > r.online ? ` · ${r.players - r.online} away` : ''}`),
      h('span.ad-dim', `open ${ago(r.age)}`)))) : h('p.ad-dim', 'No one is in a room right now.'),
    h('p.ad-note', 'Counts people in rooms (the title screen has no connection, so visitors who never host or join aren’t seen).'));
}

function tabs(key, opts, rerender) {
  return h('div.ad-tabs', ...opts.map(([v, label]) => h('button.ad-tab', { type: 'button', class: view[key] === v ? 'is-on' : '', onclick: () => { view[key] = v; rerender(); } }, label)));
}

function gamesBlock() {
  const G = S.games;
  const src = view.games === 'today' ? (G.today || {}) : view.games === 'week' ? G.week : view.games === '30' ? G.last30 : G.all;
  const rows = GAMES.map(g => ({ id: g.id, n: src[g.id] || 0 })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...rows.map(r => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0);
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Games played'), tabs('games', [['today', 'Today'], ['week', 'This week'], ['30', '30 days'], ['all', 'All time']], renderStats)),
    h('ol.ad-bars', ...rows.map((r, i) => h('li', { style: { '--c': light(r.id), '--w': `${(r.n / max) * 100}%` } },
      h('span.ad-bar-n', `${i + 1}`),
      h('span.ad-bar-name', gameName(r.id)),
      h('span.ad-bar', h('i')),
      h('b', String(r.n)),
      h('small', G.avgPlayers[r.id] ? `${G.avgPlayers[r.id]} avg players` : '')))),
    h('p.ad-note', `${total} matches · counted when the server verifies a finished match`));
}

function dailyBlock() {
  const D = S.games.daily;
  const max = Math.max(1, ...D.map(d => d.n));
  const label = k => { const d = new Date(Date.UTC(+k.slice(1, 5), +k.slice(5, 7) - 1, +k.slice(7, 9))); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
  return h('div.ad-block',
    h('h3', 'Matches per day · last 30 days'),
    h('div.ad-cols', ...D.map((d, i) => h('div.ad-col', { title: `${label(d.k)}: ${d.n}`, style: { '--h': `${(d.n / max) * 100}%` } },
      h('i'), h('small', i % 5 === 4 || i === D.length - 1 ? label(d.k) : '')))));
}

function playersBlock() {
  const P = S.players;
  const list = view.players === 'today' ? (P.topToday || []) : view.players === 'week' ? P.topWeek : view.players === 'all' ? P.topAll : P.topXp;
  const empty = { today: 'No matches yet today.', week: 'No matches yet this week.', all: 'No matches yet.', xp: 'No XP yet.' }[view.players];
  return h('div.ad-block',
    h('div.ad-row.ad-between', h('h3', 'Most active players'), tabs('players', [['today', 'Today'], ['week', 'This week'], ['all', 'All time'], ['xp', 'XP']], renderStats)),
    list.length ? h('ol.ad-top', ...list.map((p, i) => h('li',
      h('span.ad-bar-n', String(i + 1)),
      avatar(p.a, p.c, 26),
      h('button.ad-linkbtn', { type: 'button', onclick: () => open(p.pid) }, p.n, h('small', p.t ? fmtTag(p.t) : '')),
      emblem(p.r, 18),
      p.h ? h('span.ad-tag.is-hidden', 'HIDDEN') : null,
      h('b', view.players === 'xp' ? `${p.x.toLocaleString()} XP` : `${p.n_matches} ${p.n_matches === 1 ? 'match' : 'matches'}`)))) : h('p.ad-dim', empty));
}

function growthBlock() {
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

function timesBlock() {
  const T = S.times;
  const hours = [0, 6, 12, 18];
  return h('div.ad-block.ad-wide',
    h('h3', `Busiest times · last ${T.days} days · Eastern`),
    h('div.ad-heat',
      h('span'), ...Array.from({ length: 24 }, (_, hr) => h('small.ad-heat-h', hours.includes(hr) ? ['12a', '6a', '12p', '6p'][hours.indexOf(hr)] : '')),
      ...T.grid.flatMap((row, d) => [h('small.ad-heat-d', DOW[d]), ...row.map((n, hr) => h('i', { title: `${DOW[d]} ${hr}:00 — ${n} ${n === 1 ? 'match' : 'matches'}`, style: { '--a': T.max ? (n ? 0.15 + 0.85 * (n / T.max) : 0) : 0 } }))])),
    h('p.ad-note', 'Each square is an hour; brighter = more matches finished then.'));
}

function renderStats() {
  const box = document.getElementById('ad-stats');
  if (!box || !S) return;
  box.replaceChildren(
    h('div.ad-row.ad-between', h('h2', 'Stats'), h('span.ad-dim', `${S.totals.matches.toLocaleString()} matches counted`)),
    h('div.ad-stats-grid', gamesBlock(), playersBlock(), dailyBlock(), growthBlock(), timesBlock()));
}

async function errors() {
  if (!document.getElementById('ad-errs')) return;
  renderErrors((await call('errors')).errors);
}

const counts = o => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ');
function renderErrors(list) {
  const box = document.getElementById('ad-errs');
  if (!box) return;
  box.replaceChildren(...(list.length ? list.map(e => {
    const stack = e.k ? h('pre.ad-stack', e.k) : null;
    if (stack) stack.hidden = true;
    return h('li.ad-err',
      h('div.ad-err-top',
        h('b.ad-err-n', `×${e.n}`),
        h('button.ad-err-m', { type: 'button', title: 'Show the stack', onclick: () => { if (stack) stack.hidden = !stack.hidden; } }, e.m),
        confirmBtn('Clear', async () => { renderErrors((await call('clearErrors', { sig: e.sig })).errors); audit(); })),
      h('div.ad-err-meta',
        h('code', `${e.s || '?'}${e.l ? `:${e.l}` : ''}`),
        e.w ? h('span', e.w) : null,
        h('span', counts(e.d)),
        h('span', counts(e.b)),
        h('span', `last ${when(e.last)}`),
        e.n > 1 ? h('span', `first ${when(e.first)}`) : null,
        e.v ? h('span', `build ${e.v}`) : null,
        e.p === 'board' ? h('span', '/board') : null),
      stack);
  }) : [h('li.ad-dim', 'No errors reported. 🎉')]));
}

async function boot() {
  installEmblems();
  if (!isConfigured) { app.replaceChildren(h('p.ad-wait', 'Firebase is not configured.')); return; }
  try {
    await initFirebase();
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { denied(who); return; }
    shell();
  } catch (e) {
    app.replaceChildren(h('section.ad-card', h('h1', 'Can’t reach the server'), h('p', e.message || String(e)), h('p.ad-dim', 'The /api functions need the Vercel environment variables (see CLAUDE.md → Profiles).')));
  }
}
boot();
