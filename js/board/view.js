// THE BOARD — the leaderboard hall of the speakeasy. Shared by the app's screen (js/board/screen.js) and the public
// page (board.html → js/board/public.js).
//
// BOARD 2.0 B (the owner's mock, Nov 9 — tests/integration/board2-preview.html): THE TABS = XP · DAILIES · OVERCLOCK · PRISM DROP (the two
// playable games only), opening on XP, THIS WEEK; THIS WEEK / ALL TIME on every tab. SLIM CARDS EVERYWHERE: every row = that player's slim
// card through ui/strip-board.js (stripKit / stripFor / stripFx — never a second strip system; the public rows carry exactly its fields:
// cd es tb g l n a c), the RANK at the left (gold / silver / bronze coins for the top 3), the SCORE on the line UNDER the card at its right
// end (DFIX2's rule), the ⋯ (REPORT) at that line's left; YOUR card in a drawn gold frame (profile.bid) + pinned at the foot with your exact
// rank (from the server, even outside the top 100) — or "N MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3" on a dailies board's ALL TIME. A tap on
// a card = THE PLAYER PAGE (the app only — `onPlayer`). THE BACKGROUND = BLACK VELVET + GOLD DECO (the owner's pick over the brown bar hall):
// drawn in CSS + one SVG sunburst, nothing animates.
// THE SPEED RULES: only the top 10 cards are built (SHOW ALL builds the rest, the pages after it as they scroll in), ONE fx surface for the list
// (every strip CALM — fx/renderer.js draws only the slots on screen), the city is not running behind (the board is its own screen); a tab
// switch rebuilds the list only (the controls are rebuilt only when their own state changes — THE TAP WATCH).
//
//   createBoardView({ mode: 'app' | 'public', me: () => ({ pid, profile }) | null, ranks: (boards) => Promise<{…}>,
//                     onBack, onProfile, onPlay, onPlayer({ b, bid, row }), initial: { game | tab, cat, period, board } })
//   → { el, start(), destroy() }
import { openSheet } from '../ui/sheet.js';
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { GAMES, DAILIES } from '../config.js';
import { boardDef, recordBoards, careerBoards, fmtValue, MIN_WR_GAMES } from '../core/boards.js';
import { POINT_DAILIES } from '../core/daily-points.js';
import { weekEndsAt } from '../core/week.js';
import { board as fetchBoard, reportRow } from '../profile/api.js';
import { stripKit, stripFor, stripFx } from '../ui/strip-board.js';
import { boardSfx } from './audio.js';

// each tab's light: [key colour, second colour] (the tab's lit pill + the panel's glow)
export const GAME_LIGHT = {
  xp: ['#f2c869', '#ff7ccb'], dailies: ['#ff7ccb', '#5aa9ff'],
  cipher: ['#3dff8b', '#00f0ff'], signal: ['#ff3355', '#ff8c1a'], slip: ['#ffc46b', '#5aa9ff'], prism: ['#9fe8ff', '#ff7ccb'],
  gridlock: ['#7fb2ff', '#ff8c1a'], overclock: ['#ffb627', '#ff2bd6'], golf: ['#2ff5d2', '#a66bff'], agent: ['#e6e9ef', '#ff3355'],
  pulse: ['#a374ff', '#00f0ff'], bluff: ['#efe6d2', '#d7262e'], stakes: ['#3fd49a', '#f2c869'], rum: ['#f0c75e', '#e0465f'],
};
const gameName = id => (GAMES.find(g => g.id === id) || DAILIES.find(g => g.id === id) || { name: String(id).toUpperCase() }).name;
/** THE TABS (the owner, Nov 9): the overall XP board, the dailies' points, the two playable games */
export const TABS = Object.freeze(['xp', 'dailies', 'overclock', 'prism']);
const tabName = id => (id === 'xp' ? 'XP' : id === 'dailies' ? 'DAILIES' : gameName(id));
/** a deep link's / the title preview's game → its tab (a game without a tab → XP) */
export const tabOf = g => (TABS.includes(g) ? g : g && String(g).startsWith('daily') ? 'dailies' : 'xp');
const PAGE = 25, TOP = 10, MAX = 100;
const MEDAL = ['', 'gold', 'silver', 'bronze'];
const DOTS = '<svg viewBox="0 0 16 4" aria-hidden="true"><circle cx="2" cy="2" r="1.8"/><circle cx="8" cy="2" r="1.8"/><circle cx="14" cy="2" r="1.8"/></svg>';
// the gold Art Deco sunburst behind the title (drawn once, in code): rays + three arcs
const SUN = (() => {
  const rays = Array.from({ length: 29 }, (_, i) => { const a = Math.PI * (i / 28); const x = 380 - Math.cos(a) * 380, y = 120 + Math.sin(a) * 340; return `<line x1="380" y1="120" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#f2c869" stroke-opacity="${i % 2 ? 0.07 : 0.16}" stroke-width="${i % 2 ? 1 : 1.4}"/>`; }).join('');
  const arcs = [110, 190, 280].map((r, i) => `<path d="M${380 - r} 120 A${r} ${r} 0 0 0 ${380 + r} 120" fill="none" stroke="#f2c869" stroke-opacity="${(0.22 - i * 0.05).toFixed(2)}" stroke-width="1.2"/>`).join('');
  return `<svg viewBox="0 0 760 460" width="760" height="460" aria-hidden="true">${rays}${arcs}</svg>`;
})();

/** the unit under a score: XP · PTS · AVG (a game's record keeps its own format: km, s, %) */
export function unitOf(def, period) {
  if (!def) return '';
  if (def.id === 'xp') return 'XP';
  if (def.points) return period === 'all' ? 'AVG' : 'PTS';
  if (def.kind === 'career' && def.fmt !== 'pct') return def.stat === 'w' ? 'WINS' : '';
  return '';
}
/** the plate's two lines for a board + period */
export function plateOf(def, period, now = Date.now(), ends = null) {
  if (!def) return { label: '', when: '' };
  const label = def.kind === 'overall' ? (period === 'all' ? def.all : def.week) : def.label;
  let when;
  if (period === 'week') {
    const ms = Math.max(0, (ends || weekEndsAt(now)) - now);
    const d = Math.floor(ms / 86_400_000), hr = Math.floor((ms % 86_400_000) / 3_600_000);
    when = `RESETS MONDAY · IN ${d ? `${d}D ` : ''}${hr}H`;
  } else when = def.minDays ? `RANKED FROM ${def.minDays} DAYS PLAYED` : 'ALL TIME';
  if (def.min) when += ` · ${MIN_WR_GAMES}+ GAMES`;
  return { label, when };
}
/** the empty board's two lines (a fresh week is a real state every Monday — never a blank panel) */
export function emptyOf(def, period) {
  if (!def) return ['NO BOARD HERE YET', ''];
  if (def.id === 'xp') return period === 'week' ? ['A FRESH WEEK', 'The board starts over every Monday. Earn XP in any match or daily to take the first spot.'] : ['NO NAMES YET', 'Play a match or a daily to put the first name up.'];
  if (def.points) return period === 'week' ? ['A FRESH WEEK', 'Play today’s dailies to put the first points on the board.'] : ['NO ONE RANKED YET', `A player is ranked after ${def.minDays} days of dailies.`];
  return ['NO NAMES ON THIS BOARD YET', def.kind === 'record' ? `Play ${gameName(def.game)} to set the first record${period === 'week' ? ' this week' : ''}.` : `Win a ${gameName(def.game)} match to claim the top spot.`];
}

export function createBoardView({ mode = 'app', me = () => null, ranks = null, onBack = null, onProfile = null, onPlay = null, onPlayer = null, initial = {} } = {}) {
  const pub = mode === 'public';
  const S = {
    tab: tabOf(initial.tab || initial.game || (initial.board && boardDef(initial.board) && (boardDef(initial.board).game || initial.board)) || 'xp'),
    cat: initial.cat || null,
    period: initial.period === 'all' ? 'all' : 'week',     // (the owner: it opens on THIS WEEK)
    board: initial.board || null,
    rows: [], more: false, all: false, ends: null,
    loading: false, token: 0,
  };
  let destroyed = false, cascadeSound = false, io = null, surface = null, meSurface = null, K = null, seeMine = null;
  const els = {};
  const myRankCache = new Map();

  // ------------------------------------------------------------------ skeleton
  els.scene = h('div.bd-scene', { 'aria-hidden': 'true' },
    h('div.bd-bg', h('i.bd-bg-base'), h('i.bd-bg-glow'), h('i.bd-bg-pin'), h('i.bd-bg-sun', { html: SUN })));
  els.tabs = h('nav.bd-tabs', { 'aria-label': 'Boards' });
  els.cat = h('div.bd-seg', { role: 'tablist', 'aria-label': 'Records or career' });
  els.period = h('div.bd-seg.bd-period', { role: 'tablist', 'aria-label': 'This week or all time' });
  els.ctrl = h('div.bd-ctrl', els.cat, els.period);
  els.picks = h('div.bd-picks');
  els.label = h('h2.bd-label');
  els.when = h('span.bd-when');
  els.scroll = h('div.bd-scroll');
  els.rows = h('ol.bd-rows');
  els.scroll.append(els.rows);
  els.sentinel = h('li.bd-sentinel', { 'aria-hidden': 'true' });
  els.me = h('div.bd-me');
  els.card = h('article.bd-card',
    h('header.bd-card-head', h('div.bd-plate', els.label, els.when)),
    els.scroll,
    els.me);
  const head = h('header.bd-head',
    pub ? h('a.bd-back', { href: '/', 'aria-label': 'Neon Speakeasy' }, '‹') : h('button.bd-back', { type: 'button', 'aria-label': 'Back', onclick: () => onBack && onBack() }, '‹'),
    h('div.bd-title',
      h('span.bd-kicker', 'NEON SPEAKEASY'),
      h('h1.bd-name', { 'data-text': 'THE BOARD' }, 'THE BOARD'),
      h('span.bd-sub', 'HALL OF FAME')),
    // (PD-1 GROUP 0 — the owner, Nov 9: the gold emblem button beside ‹ is GONE — the bar = ☰ · ‹ · the music, nothing else)
    h('span.bd-head-pad'));
  els.el = h('section.bd', { class: pub ? 'is-public' : '' },
    els.scene,
    h('div.bd-wrap',
      head,
      els.tabs,
      els.ctrl,
      els.picks,
      els.card,
      pub ? h('div.bd-cta',
        h('a.bd-play', { href: '/', onclick: e => { if (onPlay) { e.preventDefault(); onPlay(); } } }, h('span.bd-play-sheen'), h('span.bd-play-l', 'PLAY NOW')),
        h('span.bd-cta-line', 'Party games · one phone each · no signup')) : null));

  // ------------------------------------------------------------------ controls (rebuilt only when their own state changes)
  let ctrlSig = '';
  function seg(holder, opts, value, onPick) {
    holder.replaceChildren(...opts.map(o => h('button.bd-seg-b', {
      type: 'button', role: 'tab', 'aria-selected': String(o.v === value), disabled: o.off || null,
      class: o.v === value ? 'is-on' : '', onclick: () => { if (o.v !== value) onPick(o.v); },
    }, o.l)));
  }
  const isGame = () => S.tab !== 'xp' && S.tab !== 'dailies';
  function boardsNow() {
    if (S.tab === 'xp') return [boardDef('xp')];
    if (S.tab === 'dailies') return [{ ...boardDef('daily'), chip: 'ALL DAILIES' }, ...POINT_DAILIES.map(g => ({ ...boardDef(`daily-${g}`), chip: gameName(g) }))];
    return S.cat === 'career' ? careerBoards(S.tab).map(b => ({ ...b, game: S.tab })) : recordBoards(S.tab).map(b => ({ ...b, game: S.tab }));
  }
  function renderTabs() {
    els.tabs.replaceChildren(...TABS.map(id => {
      const [a1, a2] = GAME_LIGHT[id] || ['#fff', '#fff'];
      return h('button.bd-tab', {
        type: 'button', class: id === S.tab ? 'is-on' : '', 'aria-pressed': String(id === S.tab),
        style: { '--a1': a1, '--a2': a2 }, dataset: { id }, onclick: () => pickTab(id),
      }, h('span', tabName(id)));
    }));
  }
  function renderControls() {
    if (isGame()) { const rec = recordBoards(S.tab).length > 0; if (!S.cat || (S.cat === 'records' && !rec)) S.cat = rec ? 'records' : 'career'; }
    const list = boardsNow();
    if (!S.board || !list.some(b => b.id === S.board)) S.board = list[0] ? list[0].id : null;
    const sig = JSON.stringify([S.tab, S.cat, S.period, S.board]);
    if (sig === ctrlSig) return;
    ctrlSig = sig;
    els.cat.hidden = !isGame();
    if (isGame()) seg(els.cat, [{ v: 'records', l: 'RECORDS', off: !recordBoards(S.tab).length }, { v: 'career', l: 'CAREER' }], S.cat, v => { S.cat = v; S.board = null; boardSfx('tab'); refresh(); });
    seg(els.period, [{ v: 'week', l: 'THIS WEEK' }, { v: 'all', l: 'ALL TIME' }], S.period, v => { S.period = v; boardSfx('tab'); refresh(); });
    const chips = list.length > 1 ? list.map(b => h('button.bd-chip', {
      type: 'button', class: b.id === S.board ? 'is-on' : '', onclick: () => { if (b.id !== S.board) { S.board = b.id; boardSfx('tab'); refresh(); } },
    }, b.chip || b.short || b.label)) : [];
    els.picks.replaceChildren(...(chips.length ? [h('div.bd-chips', ...chips)] : []));
    els.picks.hidden = !chips.length;
  }
  function relight() {
    const [a1, a2] = GAME_LIGHT[S.tab] || ['#f2c869', '#ff7ccb'];
    els.el.style.setProperty('--a1', a1);
    els.el.style.setProperty('--a2', a2);
    els.el.dataset.game = S.tab;
  }
  function pickTab(id) {
    if (id === S.tab) return;
    S.tab = id; S.cat = null; S.board = null;
    boardSfx('tab');
    renderTabs();
    relight();
    refresh();
  }

  // ------------------------------------------------------------------ the board
  const myBid = () => { const m = me(); return (m && m.profile && m.profile.bid) || null; };
  /** your public face for your own strip (the cached profile: n a c x cd es tb g) — no member line (the board's rows carry none) */
  const myPub = () => { const m = me(); const p = (m && m.profile) || {}; return { n: p.n, a: p.a, c: p.c, x: p.x || 0, cd: p.cd, es: p.es, tb: p.tb, g: p.g }; };

  function skeleton() {
    dropSurface();
    els.rows = h('ol.bd-rows.is-skel');
    els.rows.append(...Array.from({ length: 5 }, (_, i) => h('li.bd-row.is-skel', { style: { '--i': i } }, h('span.bd-rank'), h('span.bd-sk-card'))));
    els.scroll.replaceChildren(els.rows);
  }
  function dropSurface() { if (surface) { try { surface.destroy(); } catch { /* fine */ } surface = null; } if (seeMine) { seeMine.disconnect(); seeMine = null; } setInList(false); }

  function row(r, i, def) {
    const bid = myBid();
    const mine = !!(bid && r.id === bid);
    const top = r.rank <= 3;
    const pubFace = mine ? { ...myPub(), l: r.l } : r;
    const strip = stripFor(K, pubFace);
    const name = mine ? myPub().n || r.n : r.n;
    const card = onPlayer && !pub && r.id
      ? h('button.bd-open', { type: 'button', 'aria-label': `${name} — their card`, onclick: () => onPlayer({ b: def.id, bid: r.id, row: { ...r, n: name } }) }, strip.el)
      : h('div.bd-open', strip.el);
    const li = h('li.bd-row', {
      class: [top ? `is-top is-${r.rank}` : '', mine ? 'is-me' : ''].join(' '),
      dataset: { id: r.id || '', n: name || '' },
    },
    h('span.bd-rank', top ? h('span.bd-medal', { class: `is-${MEDAL[r.rank]}` }, String(r.rank)) : String(r.rank)),
    h('div.bd-scard', card, h('div.bd-ssub',
      mine ? h('span.bd-you', 'YOU') : r.id ? h('button.bd-more', { type: 'button', 'aria-label': pub ? `Report ${r.n}` : `${r.n} — add friend or report`, html: DOTS, onclick: e => { e.stopPropagation(); openReport(r, def); } }) : null,
      h('span.bd-v', fmtValue({ ...def, fmt: S.period === 'all' && def.allFmt ? def.allFmt : def.fmt }, r.v), unitOf(def, S.period) ? h('small', unitOf(def, S.period)) : null))));
    if (surface) stripFx(K, surface, strip, (i % 40) + 1);
    return li;
  }

  // ------------------------------------------------------------------ REPORT (BNAME)
  const devId = () => {
    try {
      let d = localStorage.getItem('bd:dev');
      if (!d || !/^[a-z0-9]{8,32}$/.test(d)) { d = Array.from(crypto.getRandomValues(new Uint8Array(12)), x => (x % 36).toString(36)).join(''); localStorage.setItem('bd:dev', d); }
      return d;
    } catch { return ''; }
  };
  function closeReport() { if (els.rep) { const r = els.rep; els.rep = null; r.close(); } }
  function openReport(r, def) {
    closeReport();
    boardSfx('tab');
    const msg = h('p.bd-rep-msg', 'Tell the house what looks wrong. Nobody sees who reported.');
    let btns = [];
    const send = why => async () => {
      btns.forEach(b => { b.disabled = true; });
      try {
        await reportRow(def.id, r.id, why, devId());
        msg.textContent = 'THANKS — THE HOUSE WILL TAKE A LOOK.';
        msg.className = 'bd-rep-msg is-ok';
        setTimeout(closeReport, 1600);
      } catch (e) {
        msg.textContent = e && e.status === 429 ? 'Too many reports from here — try again later.' : 'Couldn’t send it — try again in a moment.';
        msg.className = 'bd-rep-msg is-err';
        btns.forEach(b => { b.disabled = false; });
      }
    };
    // (SHELL 2.0 A: THE SHEET + THE NEON TUBE — the two reasons quiet tubes; the × / CANCEL close)
    btns = [
      h('button.btn.btn-ghost.btn-block.bd-rep-b', { type: 'button', onclick: send('score') }, 'SUSPICIOUS SCORE'),
      h('button.btn.btn-ghost.btn-block.bd-rep-b', { type: 'button', onclick: send('name') }, 'BAD NAME OR EMBLEM'),
    ];
    // (FRIENDS A — ADD FRIEND on THE BOARD: the row's ⋯ = that player — ADD FRIEND (in the app, signed in; never on the public /board), then REPORT)
    const fr = h('div.bd-rep-fr');
    if (!pub) import('../profile/friends-ui.js').then(F => { if (els.rep) fr.replaceChildren(F.friendButton({ b: def.id, bid: r.id }, { name: r.n })); }).catch(() => {});
    els.rep = openSheet({ title: pub ? 'REPORT' : String(r.n || '').toUpperCase(), kicker: `${els.label.textContent} · #${r.rank}`, cls: 'bd-rep', label: `${r.n}`, onClose: () => { els.rep = null; }, body: [
      h('div.bd-rep-who', avatar(r.a, r.c, 30), h('b', r.n)),
      fr,
      pub ? null : h('h4.bd-rep-h', 'REPORT'),
      msg,
      ...btns,
      h('button.btn.btn-text.btn-block.bd-rep-b.is-cancel', { type: 'button', onclick: closeReport }, 'CANCEL')] });
  }

  function paintPlate(def) {
    const p = plateOf(def, S.period, Date.now(), S.ends);
    els.label.textContent = p.label;
    els.when.textContent = p.when;
  }

  async function refresh() {
    renderControls();
    const def = boardDef(S.board);
    S.ends = null;
    paintPlate(def);
    const token = ++S.token;
    S.rows = []; S.more = false; S.all = false;
    if (!def) { empty(def); paintMe(null, null); return; }
    skeleton();
    paintMe(def, 'loading');
    cascadeSound = true;
    try {
      const [data, kit] = await Promise.all([fetchBoard(def.id, S.period, { start: 0, n: PAGE }), stripKit()]);
      if (token !== S.token || destroyed) return;
      K = kit;
      S.rows = data.rows || []; S.more = !!data.more; S.ends = data.ends || null;
      paintPlate(def);
      renderRows(def, true);
    } catch (e) {
      if (token !== S.token || destroyed) return;
      dropSurface();
      els.rows = h('ol.bd-rows', h('li.bd-empty.is-error',
        h('b', 'THE BOARD IS DARK RIGHT NOW'),
        h('span', 'The games still work — results are saved and land here when the lights come back.'),
        h('button.bd-retry', { type: 'button', onclick: () => refresh() }, 'TRY AGAIN')));
      els.scroll.replaceChildren(els.rows);
    }
    loadMe(def, token);
  }

  function empty(def) {
    dropSurface();
    const [t, line] = emptyOf(def, S.period);
    const mark = h('span.bd-empty-mark');
    import('../vault/emblem-art.js').then(E => mark.replaceChildren(E.emblemEl({ avatar: 'crown', color: 'yellow', mode: 'quiet', size: 84 }))).catch(() => mark.replaceChildren(emblem(0, 46, { mini: false })));
    els.rows = h('ol.bd-rows', h('li.bd-empty', mark, h('b', t), line ? h('span', line) : null));
    els.scroll.replaceChildren(els.rows);
  }

  function renderRows(def, fresh) {
    if (!S.rows.length) { empty(def); return; }
    if (fresh) {
      dropSurface();
      els.rows = h('ol.bd-rows');
      els.scroll.replaceChildren(els.rows);
      surface = K.createSurface(els.rows, { label: 'board' });
      els.scroll.scrollTop = 0;
    }
    const built = els.rows.querySelectorAll('.bd-row').length;
    const upto = S.all ? S.rows.length : Math.min(TOP, S.rows.length);
    const frag = S.rows.slice(built, upto).map((r, i) => row(r, built + i, def));
    els.rows.querySelectorAll('.bd-sentinel, .bd-showall-li, .bd-end').forEach(x => x.remove());
    els.rows.append(...frag);
    if (!S.all && (S.rows.length > TOP || S.more)) {
      els.rows.append(h('li.bd-showall-li', h('button.bd-showall', { type: 'button', onclick: () => { boardSfx('tab'); S.all = true; renderRows(def, false); } },
        h('span', S.more ? 'SHOW ALL' : `SHOW ALL ${S.rows.length}`), h('i', { 'aria-hidden': 'true' }))));
    } else if (S.all && S.more) els.rows.append(els.sentinel);
    else els.rows.append(h('li.bd-end', h('span', S.rows.length < 10 ? 'THE HOUSE AWAITS NEW NAMES' : 'THE TOP OF THE HOUSE')));
    els.rows.dataset.built = String(els.rows.querySelectorAll('.bd-row').length);
    watchMine();
    if (fresh) {
      els.card.classList.remove('is-cascade'); void els.card.offsetWidth; els.card.classList.add('is-cascade');
      if (cascadeSound) { boardSfx('rows'); cascadeSound = false; }
    }
  }

  async function more() {
    const def = boardDef(S.board);
    if (!def || !S.all || !S.more || S.loading) return;
    S.loading = true;
    const token = S.token;
    try {
      const data = await fetchBoard(def.id, S.period, { start: S.rows.length, n: PAGE });
      if (token !== S.token || destroyed) return;
      S.rows = S.rows.concat(data.rows || []); S.more = !!data.more && S.rows.length < MAX;
      renderRows(def, false);
    } catch { /* the sentinel stays; scrolling again retries */ } finally { S.loading = false; }
  }

  // ------------------------------------------------------------------ NO DOUBLE "YOU" (PD-1 GROUP 0 — the owner, Nov 9): the pinned row shows ONLY while
  // your own card is NOT on screen in the list (scrolled away, not built yet or ranked off the page). One IntersectionObserver on your row, the
  // list's scroller its root; ≥ 60 % of the card in view = "visible". Stable both ways: hiding the foot only grows the list's view.
  function watchMine() {
    if (seeMine) { seeMine.disconnect(); seeMine = null; }
    const mine = els.rows.querySelector('.bd-row.is-me');
    if (!mine || typeof IntersectionObserver !== 'function') { setInList(false); return; }
    seeMine = new IntersectionObserver(es => { const e = es[es.length - 1]; setInList(!!(e && e.isIntersecting && e.intersectionRatio >= 0.6)); }, { root: els.scroll, threshold: [0, 0.6, 1] });
    seeMine.observe(mine);
  }
  function setInList(on) {
    const v = on ? '1' : '';
    if ((els.me.dataset.inlist || '') !== v) els.me.dataset.inlist = v;
  }

  // ------------------------------------------------------------------ your row (pinned at the foot)
  function paintMe(def, state, info) {
    const m = me();
    if (meSurface) { try { meSurface.destroy(); } catch { /* fine */ } meSurface = null; }
    if (pub) {
      // the public page: your row only when this browser has a profile on the board
      const r = m && m.profile && m.profile.bid && S.rows.find(x => x.id === m.profile.bid);
      els.me.hidden = !r;
      if (r) fillMe(def, { rank: r.rank, v: r.v }, m);
      return;
    }
    els.me.hidden = false;
    if (!m || !m.profile) {
      els.me.replaceChildren(h('span.bd-me-note', 'Finish a match to get your name on the board — no signup, it’s automatic.'));
      els.me.classList.remove('is-ranked');
      return;
    }
    fillMe(def, state === 'loading' ? 'loading' : info, m);
  }

  /** the note under your pinned card: [the value line, a small caption] */
  function meNote(def, info, p) {
    const left = typeof p.m === 'number' ? Math.max(0, (p.mm || 3) - p.m) : 0;
    const daily = def && def.points;
    // BNAME: under the 3-match floor nobody sees you yet (a dailies board counts from the 3rd day played instead — lb.js#hiddenOf)
    if (left && !p.h && !daily) return [null, `${left} MORE PLAY${left === 1 ? '' : 'S'} TO JOIN THE BOARD`];
    if (info === 'loading') return [null, '…'];
    const mine = info && info.mine;
    if (daily && S.period === 'all' && mine && (!info.rank) && mine.days < (mine.need || def.minDays)) {
      const need = (mine.need || def.minDays) - (mine.days || 0);
      return [null, `${need} MORE DAY${need === 1 ? '' : 'S'} TO BE RANKED`, mine.avg != null ? `YOUR AVERAGE ${Number(mine.avg).toFixed(1)}` : null];
    }
    if (info && info.v != null) return [fmtValue({ ...def, fmt: S.period === 'all' && def.allFmt ? def.allFmt : def.fmt }, info.v), null];
    if (def && def.id === 'xp' && S.period === 'week') return ['0', 'NOT ON THE BOARD YET'];
    return [null, def && def.min ? `${MIN_WR_GAMES}+ GAMES` : def && def.kind === 'record' ? 'NO RECORD YET' : 'NOT RANKED YET'];
  }

  function fillMe(def, info, m) {
    const p = m.profile;
    const rank = info && info !== 'loading' && info.rank;
    const [val, ...caps] = meNote(def, info, p);
    if (!K) { stripKit().then(k => { K = k; if (!destroyed) fillMe(def, info, m); }).catch(() => {}); }
    const strip = K ? stripFor(K, myPub()) : null;
    const unit = unitOf(def, S.period);
    els.me.replaceChildren(h('div.bd-row.is-me',
      h('span.bd-rank', { class: rank && String(rank).length > 3 ? 'is-long' : '' }, rank ? `#${rank.toLocaleString('en-US')}` : '—'),
      h('div.bd-scard', strip ? h('div.bd-open', strip.el) : h('div.bd-sk-card'), h('div.bd-ssub',
        h('span.bd-you', p.h ? 'YOU · HIDDEN' : 'YOU'),
        h('span.bd-me-note2', val != null ? h('b', val, unit ? h('small', unit) : null) : null, ...caps.filter(Boolean).map(c => h('span', c)))))));
    if (strip) { meSurface = K.createSurface(els.me, { label: 'board-me' }); stripFx(K, meSurface, strip, 99); }
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
      const v = x || r[def.id] && r[def.id].mine ? { ...(x || {}), mine: r[def.id] && r[def.id].mine } : null;
      myRankCache.set(key, { at: Date.now(), v });
      paintMe(def, 'done', v);
    } catch {
      if (token !== S.token || destroyed) return;
      // no rank from the server: show the row as it appears in the list, if it does
      const r = m.profile && m.profile.bid && S.rows.find(x => x.id === m.profile.bid);
      paintMe(def, 'done', r ? { rank: r.rank, v: r.v } : null);
    }
  }

  // ------------------------------------------------------------------ life
  function start() {
    io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { root: els.scroll, rootMargin: '300px' });
    io.observe(els.sentinel);
    renderTabs();
    relight();
    stripKit().then(k => { K = k; }).catch(() => {});
    refresh();
  }

  return {
    el: els.el,
    start,
    /** the player's profile changed (rename, rank-up, opt-out) */
    meChanged() { myRankCache.clear(); const def = boardDef(S.board); if (def) loadMe(def, S.token); },
    state: () => ({ ...S, rows: S.rows.length, built: els.rows.querySelectorAll('.bd-row').length, pinned: !els.me.hidden && els.me.dataset.inlist !== '1' }),
    pick: (tab, cat, period) => { if (period) S.period = period; if (cat) S.cat = cat; const t = tab && tabOf(tab); if (t && t !== S.tab) pickTab(t); else refresh(); },
    destroy() {
      destroyed = true;
      closeReport();
      io && io.disconnect();
      if (seeMine) seeMine.disconnect();
      dropSurface();
      if (meSurface) { try { meSurface.destroy(); } catch { /* fine */ } }
    },
  };
}
