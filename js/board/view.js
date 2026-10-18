// THE BOARD — the leaderboard hall of the speakeasy. Shared by the app's screen (js/board/screen.js) and the public
// page (board.html → js/board/public.js).
//
// A grand scoreboard behind the bar: game tabs that relight the room in each game's colours, RECORDS / CAREER,
// THIS WEEK / ALL TIME, the board's own picks (a song and difficulty for PULSE, a mode for GRIDLOCK…), rows that
// cascade in, the top three lit gold / silver / bronze, and your own row pinned at the bottom in your colour with your
// exact rank (from the server, even outside the top 100).
//
//   createBoardView({ mode: 'app' | 'public', me: () => ({ pid, profile }) | null, ranks: (boards) => Promise<{…}>,
//                     onBack, onProfile, onPlay, initial: { game, cat, period, board } })
//   → { el, start(), destroy() }
import { h, reducedMotion } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem, rankBadge, RANK_COLORS } from '../ui/emblems.js';
import { GAMES, colorHex } from '../config.js';
import { boardDef, recordBoards, careerBoards, fmtValue, BOARD_GAMES, PULSE_DIFFS, MIN_WR_GAMES } from '../core/boards.js';
import { weekEndsAt } from '../core/week.js';
import { fmtTag } from '../core/names.js';
import { RANKS } from '../core/ranks.js';
import { board as fetchBoard, activeGames } from '../profile/api.js';
import { createHall } from './scene.js';
import { boardSfx } from './audio.js';
import { settings } from '../audio/settings.js';

// each game's light: [key colour, second colour]
export const GAME_LIGHT = {
  cipher: ['#3dff8b', '#00f0ff'], signal: ['#ff3355', '#ff8c1a'], slip: ['#ffc46b', '#5aa9ff'], prism: ['#9fe8ff', '#ff7ccb'],
  gridlock: ['#7fb2ff', '#ff8c1a'], overclock: ['#ffb627', '#ff2bd6'], golf: ['#2ff5d2', '#a66bff'], agent: ['#e6e9ef', '#ff3355'],
  pulse: ['#a374ff', '#00f0ff'], bluff: ['#efe6d2', '#d7262e'], stakes: ['#3fd49a', '#f2c869'], rum: ['#f0c75e', '#e0465f'],
};
const PAGE = 25;
const MEDAL = ['', 'gold', 'silver', 'bronze'];
// the games in board order: the most played first (from /api/board?active=1), the rest in lobby order
let activeOrder = [];
const games = () => { const list = GAMES.filter(g => BOARD_GAMES.includes(g.id)); const rank = id => { const i = activeOrder.indexOf(id); return i < 0 ? 999 : i; }; return list.slice().sort((a, b) => rank(a.id) - rank(b.id)); };
const gameName = id => (GAMES.find(g => g.id === id) || { name: id.toUpperCase() }).name;
const store = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { /* fine */ } return null; };

let songsP = null;
const pulseSongs = () => (songsP ||= fetch(new URL('../../data/pulse/manifest.json', import.meta.url)).then(r => r.json()).then(m => m.songs || []).catch(() => { songsP = null; return []; }));

export function createBoardView({ mode = 'app', me = () => null, ranks = null, onBack = null, onProfile = null, onPlay = null, initial = {} } = {}) {
  const pub = mode === 'public';
  const reduced = () => !!settings.reducedFx || reducedMotion();
  const S = {
    game: initial.game || null,   // null: the busiest game (picked once the activity loads; a tab tap is for this visit only)
    cat: initial.cat || null,
    period: initial.period || store('bd:period') || 'week',
    board: initial.board || null,
    diff: 'normal',
    song: null,
    rows: [],
    more: false,
    loading: false,
    token: 0,
  };
  const explicitGame = !!initial.game;
  if (!BOARD_GAMES.includes(S.game)) S.game = games()[0].id;
  let songs = [];
  let hall = null, ro = null, io = null, tintFlip = false, destroyed = false, cascadeSound = false;
  const els = {};
  const myRankCache = new Map();

  // ------------------------------------------------------------------ skeleton
  els.canvas = h('canvas');
  els.tintA = h('div.bd-tint.is-on');
  els.tintB = h('div.bd-tint');
  els.scene = h('div.bd-scene', { 'aria-hidden': 'true' }, h('div.bd-drift', els.canvas), els.tintA, els.tintB, h('div.bd-dust', ...Array.from({ length: 14 }, (_, i) => h('i', { style: { left: `${(i * 37 + 11) % 100}%`, top: `${30 + ((i * 53) % 60)}%`, animationDelay: `${-((i * 7.3) % 22)}s` } }))));
  els.tabs = h('nav.bd-games', { 'aria-label': 'Games' });
  els.cat = h('div.bd-seg', { role: 'tablist', 'aria-label': 'Records or career' });
  els.period = h('div.bd-seg.bd-period', { role: 'tablist', 'aria-label': 'This week or all time' });
  els.picks = h('div.bd-picks');
  els.label = h('h2.bd-label');
  els.when = h('span.bd-when');
  els.colV = h('span.bd-col-v');
  els.rows = h('ol.bd-rows', { 'aria-live': 'polite' });
  els.sentinel = h('li.bd-sentinel', { 'aria-hidden': 'true' });
  els.me = h('div.bd-me');
  els.card = h('article.bd-card',
    h('header.bd-card-head',
      h('div.bd-plate', els.label, els.when),
      h('div.bd-cols', h('span', 'RANK'), h('span', 'PLAYER'), els.colV)),
    h('div.bd-scroll', els.rows),
    els.me);
  const head = h('header.bd-head',
    pub ? h('a.bd-back', { href: '/', 'aria-label': 'Neon Speakeasy' }, '‹') : h('button.bd-back', { type: 'button', 'aria-label': 'Back', onclick: () => onBack && onBack() }, '‹'),
    h('div.bd-title',
      h('span.bd-kicker', 'NEON SPEAKEASY'),
      h('h1.bd-name', { 'data-text': 'THE BOARD' }, 'THE BOARD'),
      h('span.bd-sub', 'HALL OF FAME')),
    els.meBtn = pub ? h('span.bd-head-pad') : h('button.bd-mebtn', { type: 'button', 'aria-label': 'Your profile', onclick: () => onProfile && onProfile() }));
  els.el = h('section.bd', { class: pub ? 'is-public' : '' },
    els.scene,
    h('div.bd-wrap',
      head,
      els.tabs,
      h('div.bd-ctrl', els.cat, els.period),
      els.picks,
      els.card,
      pub ? h('div.bd-cta',
        h('a.bd-play', { href: '/', onclick: e => { if (onPlay) { e.preventDefault(); onPlay(); } } }, h('span.bd-play-sheen'), h('span.bd-play-l', 'PLAY NOW')),
        h('span.bd-cta-line', 'Twelve party games · one phone each · no signup')) : null));

  // ------------------------------------------------------------------ controls
  function seg(holder, opts, value, onPick) {
    holder.replaceChildren(...opts.map(o => h('button.bd-seg-b', {
      type: 'button', role: 'tab', 'aria-selected': String(o.v === value), disabled: o.off || null,
      class: o.v === value ? 'is-on' : '', onclick: () => { if (o.v !== value) onPick(o.v); },
    }, o.l)));
  }

  function hasRecords(game) { return game === 'pulse' ? songs.length > 0 || true : recordBoards(game).length > 0; }

  function boardsNow() {
    if (S.cat === 'records') {
      if (S.game === 'pulse') return recordBoards('pulse', songs).filter(b => b.diff === S.diff);
      return recordBoards(S.game);
    }
    return careerBoards(S.game);
  }

  function renderTabs() {
    els.tabs.replaceChildren(...games().map(g => {
      const [a1, a2] = GAME_LIGHT[g.id] || ['#fff', '#fff'];
      return h('button.bd-gtab', {
        type: 'button', class: g.id === S.game ? 'is-on' : '', 'aria-pressed': String(g.id === S.game),
        style: { '--a1': a1, '--a2': a2 }, dataset: { id: g.id },
        onclick: () => pickGame(g.id),
      }, h('span.bd-gdot'), h('span', g.name));
    }));
    const on = els.tabs.querySelector('.is-on');
    if (on) requestAnimationFrame(() => on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' }));
  }

  function renderControls() {
    const rec = hasRecords(S.game);
    if (!S.cat || (S.cat === 'records' && !rec)) S.cat = rec ? 'records' : 'career';
    seg(els.cat, [{ v: 'records', l: 'RECORDS', off: !rec }, { v: 'career', l: 'CAREER' }], S.cat, v => { S.cat = v; S.board = null; boardSfx('tab'); refresh(); });
    seg(els.period, [{ v: 'week', l: 'THIS WEEK' }, { v: 'all', l: 'ALL TIME' }], S.period, v => { S.period = v; store('bd:period', v); boardSfx('tab'); refresh(); });
    const list = boardsNow();
    if (!S.board || !list.some(b => b.id === S.board)) S.board = list[0] ? list[0].id : null;
    const chips = list.length > 1 ? list.map(b => h('button.bd-chip', {
      type: 'button', class: b.id === S.board ? 'is-on' : '', onclick: () => { if (b.id !== S.board) { S.board = b.id; boardSfx('tab'); refresh(); } },
    }, S.game === 'pulse' ? b.label : b.short || b.label)) : [];
    const diff = S.cat === 'records' && S.game === 'pulse'
      ? h('div.bd-seg.bd-diff', ...PULSE_DIFFS.map(d => h('button.bd-seg-b', { type: 'button', class: d === S.diff ? 'is-on' : '', onclick: () => { if (d !== S.diff) { S.diff = d; S.board = null; boardSfx('tab'); refresh(); } } }, d.toUpperCase())))
      : null;
    els.picks.replaceChildren(...(diff ? [diff] : []), ...(chips.length ? [h('div.bd-chips', ...chips)] : []));
    els.picks.hidden = !diff && !chips.length;
  }

  function relight() {
    const [a1, a2] = GAME_LIGHT[S.game] || ['#ffcf8a', '#ff7ccb'];
    els.el.style.setProperty('--a1', a1);
    els.el.style.setProperty('--a2', a2);
    els.el.dataset.game = S.game;
    // crossfade the room's coloured light (two layers, opacity only)
    const next = tintFlip ? els.tintA : els.tintB;
    const prev = tintFlip ? els.tintB : els.tintA;
    tintFlip = !tintFlip;
    next.style.setProperty('--t1', a1); next.style.setProperty('--t2', a2);
    next.classList.add('is-on'); prev.classList.remove('is-on');
  }

  function pickGame(id) {
    if (id === S.game) return;
    S.game = id; S.cat = null; S.board = null;
    boardSfx('tab');
    renderTabs();
    relight();
    refresh();
  }

  // ------------------------------------------------------------------ the board
  function plate(def) {
    const song = def && def.song && songs.find(s => s.id === def.song);
    els.label.textContent = def ? (def.song ? `${song && song.title ? song.title.toUpperCase() : def.label} · ${S.diff.toUpperCase()}` : def.label) : '';
    els.colV.textContent = def ? (def.kind === 'career' ? def.short || def.label : def.short || 'SCORE') : '';
    if (S.period === 'week') {
      const ms = weekEndsAt(Date.now()) - Date.now();
      const d = Math.floor(ms / 86_400_000), hr = Math.floor((ms % 86_400_000) / 3_600_000);
      els.when.textContent = `THIS WEEK · RESETS IN ${d ? `${d}D ` : ''}${hr}H`;
    } else els.when.textContent = 'ALL TIME';
    if (def && def.min) els.when.textContent += ` · ${MIN_WR_GAMES}+ GAMES`;
  }

  function skeleton() {
    els.rows.replaceChildren(...Array.from({ length: 8 }, (_, i) => h('li.bd-row.is-skel', { style: { '--i': i } }, h('span.bd-rank'), h('span.bd-sk-av'), h('span.bd-sk-n'), h('span.bd-sk-v'))));
  }

  function row(r, i, def) {
    const mine = myPid() && r.pid === myPid();
    const top = r.rank <= 3;
    const c = colorHex(r.c);
    const li = h('li.bd-row', {
      class: [top ? `is-top is-${r.rank}` : '', mine ? 'is-me' : ''].join(' '),
      style: { '--i': Math.min(i, 16), '--c': c },
    },
    h('span.bd-rank', top ? h('span.bd-medal', { class: `is-${MEDAL[r.rank]}` }, String(r.rank)) : String(r.rank)),
    avatar(r.a, r.c, top ? 36 : 30),
    h('span.bd-who',
      h('span.bd-n', r.n),
      h('span.bd-t', emblem(r.r | 0, 14), h('span', fmtTag(r.t)), r.rank === 1 ? h('span.bd-crown', RANKS[r.r | 0].name) : null)),
    h('span.bd-v', fmtValue(def, r.v)));
    return li;
  }

  function myPid() { const m = me(); return m && m.pid; }

  async function refresh() {
    renderControls();
    const def = boardDef(S.board);
    plate(def);
    const token = ++S.token;
    S.rows = []; S.more = false;
    if (!def) { empty('No board here yet.'); paintMe(null, null); return; }
    skeleton();
    paintMe(def, 'loading');
    cascadeSound = true;
    try {
      const data = await fetchBoard(def.id, S.period, { start: 0, n: PAGE });
      if (token !== S.token || destroyed) return;
      S.rows = data.rows; S.more = data.more;
      renderRows(def, true);
    } catch (e) {
      if (token !== S.token || destroyed) return;
      els.rows.replaceChildren(h('li.bd-empty.is-error',
        h('b', 'THE BOARD IS DARK RIGHT NOW'),
        h('span', 'The games still work — results are saved and land here when the lights come back.'),
        h('button.bd-retry', { type: 'button', onclick: () => refresh() }, 'TRY AGAIN')));
    }
    loadMe(def, token);
  }

  function empty(text) {
    els.rows.replaceChildren(h('li.bd-empty', h('span.bd-empty-mark', emblem(0, 46, { mini: false })), h('b', 'NO NAMES ON THIS BOARD YET'), h('span', text)));
  }

  function renderRows(def, fresh) {
    if (!S.rows.length) {
      empty(def.kind === 'record' ? `Play ${gameName(def.game)} to set the first record${S.period === 'week' ? ' this week' : ''}.` : `Win a ${gameName(def.game)} match to claim the top spot.`);
      return;
    }
    const start = fresh ? 0 : els.rows.querySelectorAll('.bd-row').length;
    const frag = S.rows.slice(start).map((r, i) => row(r, fresh ? i : i + 2, def));
    if (fresh) els.rows.replaceChildren(...frag);
    else { els.sentinel.remove(); els.rows.append(...frag); }
    if (S.more) els.rows.append(els.sentinel);
    else if (fresh) els.rows.append(h('li.bd-end', { style: { '--i': Math.min(S.rows.length, 16) } }, h('span', S.rows.length < 10 ? 'THE HOUSE AWAITS NEW NAMES' : 'THE TOP OF THE HOUSE')));
    if (fresh) {
      els.rows.parentElement.scrollTop = 0;
      els.card.classList.remove('is-cascade'); void els.card.offsetWidth; els.card.classList.add('is-cascade');
      if (cascadeSound) { boardSfx('rows'); cascadeSound = false; }
    }
  }

  async function more() {
    const def = boardDef(S.board);
    if (!def || !S.more || S.loading) return;
    S.loading = true;
    const token = S.token;
    try {
      const data = await fetchBoard(def.id, S.period, { start: S.rows.length, n: PAGE });
      if (token !== S.token || destroyed) return;
      S.rows = S.rows.concat(data.rows); S.more = data.more && S.rows.length < 100;
      renderRows(def, false);
    } catch { /* the sentinel stays; scrolling again retries */ } finally { S.loading = false; }
  }

  // ------------------------------------------------------------------ your row
  function paintMe(def, state, info) {
    const m = me();
    if (pub) {
      // the public page: your row only when this browser has a profile on the board
      const r = m && S.rows.find(x => x.pid === m.pid);
      els.me.hidden = !r;
      if (r) fillMe(def, { rank: r.rank, v: r.v }, m);
      return;
    }
    els.me.hidden = false;
    if (!m || !m.profile) {
      els.me.replaceChildren(h('span.bd-me-note', 'Finish a match to get your name on the board — no signup, it’s automatic.'));
      els.me.style.removeProperty('--c');
      return;
    }
    fillMe(def, state === 'loading' ? 'loading' : info, m);
  }

  function fillMe(def, info, m) {
    const p = m.profile;
    els.me.style.setProperty('--c', colorHex(p.c));
    const rank = info && info !== 'loading' && info.rank;
    const val = info && info !== 'loading' && info.v != null ? fmtValue(def, info.v) : null;
    let note = null;
    if (info === 'loading') note = '…';
    else if (!info) note = def && def.min ? `${MIN_WR_GAMES}+ GAMES` : def && def.kind === 'record' ? 'NO RECORD YET' : 'NOT RANKED YET';
    els.me.replaceChildren(
      h('span.bd-rank', rank ? `#${rank.toLocaleString('en-US')}` : '—'),
      avatar(p.a, p.c, 30),
      h('span.bd-who', h('span.bd-me-k', p.h ? 'YOU · HIDDEN FROM THE BOARDS' : 'YOU'), h('span.bd-n', p.n, rankBadge(p))),
      h('span.bd-v', val || h('small', note)));
    els.me.classList.toggle('is-ranked', !!rank);
    els.me.classList.toggle('is-hidden-me', !!p.h);
  }

  async function loadMe(def, token) {
    if (pub || !def || !ranks) { paintMe(def, null); return; }
    const m = me();
    if (!m || !m.pid) { paintMe(def, null); return; }
    const key = `${def.id}|${S.period}`;
    const hit = myRankCache.get(key);
    if (hit && Date.now() - hit.at < 20_000) { paintMe(def, 'done', hit.v); return; }
    try {
      const r = await ranks([def.id]);
      if (token !== S.token || destroyed) return;
      const x = r[def.id] && r[def.id][S.period === 'week' ? 'week' : 'all'];
      myRankCache.set(key, { at: Date.now(), v: x || null });
      paintMe(def, 'done', x || null);
    } catch {
      if (token !== S.token || destroyed) return;
      // no rank from the server: show the row as it appears in the list, if it does
      const r = S.rows.find(x => x.pid === m.pid);
      paintMe(def, 'done', r ? { rank: r.rank, v: r.v } : null);
    }
  }

  function paintMeBtn() {
    if (pub || !els.meBtn) return;
    const m = me();
    els.meBtn.replaceChildren(...(m && m.profile
      ? [emblem(m.profile.r | 0, 30), h('span.bd-mebtn-l', RANKS[m.profile.r | 0].name)]
      : [h('span.bd-mebtn-l', 'PROFILE')]));
    if (m && m.profile) els.meBtn.style.setProperty('--rk', RANK_COLORS[m.profile.r | 0]);
  }

  // ------------------------------------------------------------------ life
  async function start() {
    hall = createHall(els.canvas, { still: initial.still || null });
    const fit = () => hall && hall.resize(els.scene.clientWidth || innerWidth, els.scene.clientHeight || innerHeight);
    ro = new ResizeObserver(fit);
    ro.observe(els.scene);
    fit();
    io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { root: els.rows.parentElement, rootMargin: '200px' });
    io.observe(els.sentinel);
    paintMeBtn();
    // open on the most played game (this week, then all time) unless a game was asked for
    const act = await Promise.race([activeGames(), new Promise(r => setTimeout(() => r(null), 2500))]);
    if (destroyed) return;
    if (act && Array.isArray(act.order)) { activeOrder = act.order.filter(id => BOARD_GAMES.includes(id)); if (!explicitGame && activeOrder.length) S.game = activeOrder[0]; }
    renderTabs();
    relight();
    songs = await pulseSongs();
    if (destroyed) return;
    refresh();
  }

  return {
    el: els.el,
    start,
    /** the player's profile changed (rename, rank-up, opt-out) */
    meChanged() { paintMeBtn(); myRankCache.clear(); const def = boardDef(S.board); if (def) loadMe(def, S.token); },
    state: () => ({ ...S, rows: S.rows.length }),
    pick: (game, cat, period) => { if (period) S.period = period; if (cat) S.cat = cat; if (game && game !== S.game) pickGame(game); else refresh(); },
    destroy() {
      destroyed = true;
      ro && ro.disconnect();
      io && io.disconnect();
      hall && hall.destroy();
    },
  };
}
