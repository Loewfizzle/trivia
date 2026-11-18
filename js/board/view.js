// THE BOARD — the leaderboard hall of the speakeasy. Shared by the app's screen (js/board/screen.js) and the public
// page (board.html → js/board/public.js).
//
// BOARD 2.0 B (the owner's mock, Nov 9 — tests/integration/board2-preview.html): THE TABS = XP · DAILIES · OVERCLOCK · PRISM DROP (the two
// playable games only), opening on XP, THIS WEEK; THIS WEEK / ALL TIME on every tab. SLIM CARDS EVERYWHERE: every row = that player's slim
// card through ui/strip-board.js (stripKit / stripFor / stripFx — never a second strip system; the public rows carry exactly its fields:
// cd es tb g l n a c), the RANK at the left (gold / silver / bronze coins for the top 3), the SCORE on the line UNDER the card at its right
// end (DFIX2's rule), the ⋯ (REPORT — a bare icon, CITY E) at that line's left; YOUR row marked by a glowing left edge (CITY E — never a gold
// frame; profile.bid) + pinned at the foot with your exact
// rank (from the server, even outside the top 100) — or "N MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3" on a dailies board's ALL TIME. A tap on
// a card = THE PLAYER PAGE (the app only — `onPlayer`). CITY E (the owner, Nov 15): THE BACKGROUND = a darkened, faded still of the REAL night
// harbor skyline (assets/board-sky.webp, baked from the city by shots.mjs), nothing animates; the tabs THE NEON TABS (ui/neon-tabs.js); no
// pill, no gold; the buttons THE NEON TUBE (tubeButton).
// THE SPEED RULES: only the top 10 cards are built (SHOW ALL builds the rest, the pages after it as they scroll in), ONE fx surface for the list
// (every strip CALM — fx/renderer.js draws only the slots on screen), the city is not running behind (the board is its own screen); a tab
// switch rebuilds the list only. THE TAP WATCH (the owner's LOST TAP on the HOLD'EM tab, Nov 13): the tabs, the switches and the picks are
// built ONCE — a tab / period / board change paints their state IN PLACE (classes, aria, hidden), never a new node under a finger; the rows
// list (it holds controls) is swapped only when no finger is down (swapRows → ui/tapwatch.js#afterTap). tests/integration/wk-board-taps.mjs.
//
// CITY H2 — LAYOUT B (the owner's pick, Nov 18 — docs/harbor/passes/city-h2.md): a SHORT real skyline strip (assets/board-sky.webp, the city
// framed at 760 × 520 so JAY / WALK, OVER / CLOCK, HOLDEM + PRISM all show, never under the title) + THE BOARD · HALL OF FAME; the game tabs;
// ONE row = THIS WEEK | ALL TIME (a squared two-part switch) + the board picker (a drop-down → a standard sheet: ALL DAILIES + every live daily;
// a game's RECORDS + CAREER boards); the rank medal with the points UNDER it + FULL-SIZE slim cards; no heading, no YOU / ⋯ line (REPORT lives
// in the player page's MORE; on the public page a tap on a card reports); THE LIST SCROLLS WITH THE PAGE (no fixed box); YOUR rank, when your
// card isn't on screen, is ONE slim line pinned at the foot. YOUR card = THE YOU ROW (ui/strip-board.js — the breathing pink glow).
//   createBoardView({ mode: 'app' | 'public', me: () => ({ pid, profile }) | null, ranks: (boards) => Promise<{…}>,
//                     onBack, onProfile, onPlay, onPlayer({ b, bid, row }), initial: { game | tab, cat, period, board } })
//   → { el, start(), destroy() }
import { openSheet } from '../ui/sheet.js';
import { rankMedal } from '../ui/medal.js';   // (CITY B: THE DECO MEDALS — one component)
import { h } from '../ui/dom.js';
import { avatar, tubeButton, row as shellRow } from '../ui/components.js';
import { emblem } from '../ui/emblems.js';
import { GAMES, DAILIES } from '../config.js';
import { boardDef, recordBoards, careerBoards, tabBoards, fmtValue, MIN_WR_GAMES } from '../core/boards.js';
import { POINT_DAILIES } from '../core/daily-points.js';
import { weekEndsAt } from '../core/week.js';
import { board as fetchBoard, reportRow } from '../profile/api.js';
import { stripKit, stripFor, stripFx } from '../ui/strip-board.js';
import { boardSfx } from './audio.js';
import { lazyImport } from '../ui/lazy-import.js';
import { afterTap } from '../ui/tapwatch.js';
import { neonTabs } from '../ui/neon-tabs.js';   // (CITY E: THE NEON TABS — ONE builder with the STATS sheet's)

// each tab's light: [key colour, second colour] (the tab's lit pill + the panel's glow)
export const GAME_LIGHT = {
  xp: ['#f2c869', '#ff7ccb'], dailies: ['#ff7ccb', '#5aa9ff'],
  cipher: ['#3dff8b', '#00f0ff'], signal: ['#ff3355', '#ff8c1a'], slip: ['#ffc46b', '#5aa9ff'], prism: ['#9fe8ff', '#ff7ccb'],
  gridlock: ['#7fb2ff', '#ff8c1a'], overclock: ['#ff6a1a', '#2e8bff'], golf: ['#2ff5d2', '#a66bff'], agent: ['#e6e9ef', '#ff3355'],
  pulse: ['#a374ff', '#00f0ff'], bluff: ['#efe6d2', '#d7262e'], stakes: ['#3fd49a', '#f2c869'], rum: ['#f0c75e', '#e0465f'],
  holdem: ['#f2c14e', '#39d98a'],   // (HOLD'EM IN THE CITY: its casino gold + the felt)
  jaywalk: ['#ff4fc4', '#35e3ff'],   // (THE GO-LIVE PASS: its signs' pink + THE SIGNAL's cyan)
};
const gameName = id => (GAMES.find(g => g.id === id) || DAILIES.find(g => g.id === id) || { name: String(id).toUpperCase() }).name;
/** THE TABS (the owner, Nov 9): the overall XP board, the dailies' points, the playable games (HOLD'EM IN THE CITY, Nov 11: + HOLD'EM —
 *  FIVE tabs at 390 without a sideways scroll: PRISM DROP's tab reads PRISM; THE GO-LIVE PASS, Nov 17: + JAYWALK — SIX) */
export const TABS = Object.freeze(['xp', 'dailies', 'overclock', 'prism', 'holdem', 'jaywalk']);
const TAB_NAMES = Object.freeze({ xp: 'XP', dailies: 'DAILIES', prism: 'PRISM' });
const tabName = id => TAB_NAMES[id] || gameName(id);
/** a deep link's / the title preview's game → its tab (a game without a tab → XP) */
export const tabOf = g => (TABS.includes(g) ? g : g && String(g).startsWith('daily') ? 'dailies' : 'xp');
const PAGE = 25, TOP = 10, MAX = 100;

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
  const label = def.kind === 'overall' || def.week ? (period === 'all' ? def.all : def.week) : def.label;
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
    period: initial.period === 'all' ? 'all' : 'week',     // (the owner: it opens on THIS WEEK)
    board: initial.board || null,
    rows: [], more: false, all: false, ends: null,
    loading: false, token: 0,
  };
  let destroyed = false, cascadeSound = false, io = null, surface = null, K = null, seeMine = null;
  const els = {};
  const myRankCache = new Map();

  // ------------------------------------------------------------------ skeleton
  els.scene = h('div.bd-scene', { 'aria-hidden': 'true' }, h('div.bd-bg', h('i.bd-bg-base')));
  // (CITY E — THE NEON TABS: the games + THIS WEEK · ALL TIME — js/ui/neon-tabs.js, the STATS sheet's builder; no pill, no gold)
  const gameTabs = neonTabs(TABS.map(id => ({ v: id, l: tabName(id), id })), { tag: 'nav', cls: 'bd-tabs', btnCls: 'bd-tab', even: true, label: 'Boards', onPick: id => pickTab(id) });
  const periodSeg = neonTabs([{ v: 'week', l: 'THIS WEEK' }, { v: 'all', l: 'ALL TIME' }], { cls: 'bd-period', btnCls: 'bd-period-b', even: true, label: 'This week or all time', onPick: v => { S.period = v; boardSfx('tab'); refresh(); } });
  els.tabs = gameTabs.el;
  els.period = periodSeg.el;
  // (CITY H2: the board picker — ONE button, its words set in place; a tap opens the standard sheet)
  els.pickL = h('span.bd-pick-l');
  els.pick = h('button.bd-pick', { type: 'button', 'data-press': true, 'aria-haspopup': 'dialog', onclick: () => openPicker() }, els.pickL, h('i.bd-pick-c', { 'aria-hidden': 'true' }));
  els.ctrl = h('div.bd-ctrl', els.period, els.pick);
  els.label = h('h2.bd-label.sr-only');   // (the board's name — read aloud, not shown: layout B has no heading)
  els.note = h('p.bd-note');   // (a board's one-line explainer — HOLD'EM's TOURNAMENTS ONLY …; a dailies board's ALL TIME floor)
  els.scroll = h('div.bd-scroll');
  els.rows = h('ol.bd-rows');
  els.scroll.append(els.rows);
  els.sentinel = h('li.bd-sentinel', { 'aria-hidden': 'true' });
  els.me = h('div.bd-me');
  els.card = h('article.bd-card', els.label, els.note, els.scroll);
  const head = h('header.bd-head',
    pub ? h('a.bd-back', { href: '/', 'aria-label': 'Neon Speakeasy' }, '‹') : h('button.bd-back', { type: 'button', 'aria-label': 'Back', onclick: () => onBack && onBack() }, '‹'),
    h('div.bd-title',
      h('h1.bd-name', { 'data-text': 'THE BOARD' }, 'THE BOARD'),
      h('span.bd-sub', 'HALL OF FAME')),
    h('i.bd-sky', { 'aria-hidden': 'true' }));
  els.wrap = h('div.bd-wrap',
    head,
    els.tabs,
    els.ctrl,
    els.card,
    pub ? h('div.bd-cta',
      // (CITY E: THE NEON TUBE — the page's ONE pink MAIN; no gold, no drawn pill)
      tubeButton('PLAY NOW', { kind: 'main', block: true, cls: 'bd-play', attrs: { 'data-press': true }, onClick: () => { if (onPlay) onPlay(); else location.href = '/'; } }),
      h('span.bd-cta-line', 'Party games · one phone each · no signup')) : null,
    els.me);
  els.el = h('section.bd', { class: pub ? 'is-public' : '' }, els.scene, els.wrap);

  // ------------------------------------------------------------------ controls — BUILT ONCE, their state painted IN PLACE (THE TAP WATCH — the
  // owner's LOST TAP, Nov 13: a tab switch landing while a finger was down on another tab REBUILT every tab button, so the one under the finger
  // was a new node at the lift and iOS sent no click). The tabs, the two switches and every set of picks keep their nodes for the page's life;
  // a change only flips classes / aria / disabled / hidden. tests/integration/wk-board-taps.mjs.
  let ctrlSig = '', picker = null;
  const isGame = () => S.tab !== 'xp' && S.tab !== 'dailies';
  /** the boards a tab offers (a game: RECORDS first, then CAREER — each tagged `sec` for the picker's sheet) */
  function boardsNow() {
    if (S.tab === 'xp') return [boardDef('xp')];
    if (S.tab === 'dailies') return [{ ...boardDef('daily'), chip: 'ALL DAILIES' }, ...POINT_DAILIES.filter(g => (DAILIES.find(d => d.id === g) || {}).on !== false || (S.live || []).includes(g)).map(g => ({ ...boardDef(`daily-${g}`), chip: gameName(g) }))];   // (THE DROP A: a row that ships OFF gets no chip — THE DROP B: until its scheduled go-live day: the daily board's `live`)
    const own = tabBoards(S.tab);   // (HOLD'EM: its one board — no RECORDS / CAREER)
    if (own) return own.filter(Boolean).map(b => ({ ...b, game: S.tab }));
    return [...recordBoards(S.tab).map(b => ({ ...b, game: S.tab, sec: 'RECORDS' })), ...careerBoards(S.tab).map(b => ({ ...b, game: S.tab, sec: 'CAREER' }))];
  }
  const pickName = b => String((b && (b.chip || b.short || b.label)) || '').toUpperCase();
  function renderTabs() { gameTabs.set(S.tab); }
  function renderControls() {
    const list = boardsNow();
    if (!S.board || !list.some(b => b.id === S.board)) S.board = list[0] ? list[0].id : null;
    const sig = JSON.stringify([S.tab, S.period, S.board, list.length]);
    if (sig === ctrlSig) return;
    ctrlSig = sig;
    periodSeg.set(S.period);
    const cur = list.find(b => b.id === S.board);
    els.pick.hidden = list.length < 2;
    if (els.pickL.textContent !== pickName(cur)) els.pickL.textContent = pickName(cur);
    els.pick.setAttribute('aria-label', `Board: ${pickName(cur)} — pick another`);
  }
  /** THE PICKER (CITY H2): a standard sheet — every board of this tab as a row (a game's under RECORDS / CAREER), the one on show marked */
  function openPicker() {
    if (picker) return;
    const list = boardsNow();
    if (list.length < 2) return;
    boardSfx('tab');
    const body = [];
    let sec = null;
    for (const b of list) {
      if (b.sec && b.sec !== sec) { sec = b.sec; body.push(h('h4.bd-pick-h', sec)); }
      const on = b.id === S.board;
      body.push(shellRow({ label: pickName(b), value: on ? 'SHOWING' : null, chevron: !on, cls: `bd-pick-row${on ? ' is-on' : ''}`, attrs: { 'data-press': true, 'data-board': b.id, 'aria-current': on ? 'true' : null },
        onClick: () => { const s2 = picker; picker = null; if (s2) s2.close(); if (b.id !== S.board) { S.board = b.id; boardSfx('tab'); refresh(); } } }));
    }
    picker = openSheet({ title: S.tab === 'dailies' ? 'THE DAILIES' : tabName(S.tab), kicker: 'PICK A BOARD', cls: 'bd-pick-sheet', label: 'Pick a board', onClose: () => { picker = null; }, body: h('div.sh-row-list', ...body) });
  }
  function relight() {
    const [a1, a2] = GAME_LIGHT[S.tab] || ['#f2c869', '#ff7ccb'];
    els.el.style.setProperty('--a1', a1);
    els.el.style.setProperty('--a2', a2);
    els.el.dataset.game = S.tab;
  }
  function pickTab(id) {
    if (id === S.tab) return;
    S.tab = id; S.board = null;
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

  /** the points under the rank: [the number, a small second line] (HOLD'EM's wins · KOs on two lines) */
  function colValue(def, v) {
    const d = { ...def, fmt: S.period === 'all' && def.allFmt ? def.allFmt : def.fmt };
    if (d.fmt === 'twko') { const [w, k] = fmtValue(d, v).split(' · '); return [w.replace(/ WINS?$/, 'W'), k]; }
    return [fmtValue(d, v), null];
  }
  function row(r, i, def) {
    const bid = myBid();
    const mine = !!(bid && r.id === bid);
    const top = r.rank <= 3;
    const pubFace = mine ? { ...myPub(), l: r.l } : r;
    const strip = stripFor(K, pubFace);
    const name = mine ? myPub().n || r.n : r.n;
    // (CITY H2: no ⋯ line — the app's tap = THE PLAYER PAGE (its MORE holds REPORT); the public page's tap = REPORT)
    const card = !pub && onPlayer && r.id
      ? h('button.bd-open', { type: 'button', 'data-press': true, 'aria-label': `${name} — their card`, onclick: () => onPlayer({ b: def.id, bid: r.id, row: { ...r, n: name }, report: mine ? null : () => openReport(r, def) }) }, strip.el)
      : pub && r.id && !mine ? h('button.bd-open', { type: 'button', 'data-press': true, 'aria-label': `${name} — report`, onclick: () => openReport(r, def) }, strip.el)
        : h('div.bd-open', strip.el);
    const [v, v2] = colValue(def, r.v);
    const li = h('li.bd-row', {
      class: [top ? `is-top is-${r.rank}` : '', mine ? 'is-me sb-me' : ''].join(' '),
      dataset: { id: r.id || '', n: name || '' },
    },
    h('div.bd-rk', h('span.bd-rank', (top && rankMedal(r.rank, { size: 30 })) || String(r.rank)), h('span.bd-v', v), v2 ? h('span.bd-v2', v2) : null),
    h('div.bd-scard', card));
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
    if (!pub) lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js').then(F => { if (els.rep) fr.replaceChildren(F.friendButton({ b: def.id, bid: r.id }, { name: r.n })); }).catch(() => {});
    els.rep = openSheet({ title: pub ? 'REPORT' : String(r.n || '').toUpperCase(), kicker: `${els.label.textContent} · #${r.rank}`, cls: 'bd-rep', label: `${r.n}`, onClose: () => { els.rep = null; }, body: [
      h('div.bd-rep-who', avatar(r.a, r.c, 30), h('b', r.n)),
      fr,
      pub ? null : h('h4.bd-rep-h', 'REPORT'),
      msg,
      ...btns,
      h('button.btn.btn-text.btn-block.bd-rep-b.is-cancel', { type: 'button', onclick: closeReport }, 'CANCEL')] });
  }

  // (a text set only when it changed: the answer's repaint of the same plate replaces nothing)
  const setText = (el, t) => { if (el.textContent !== t) el.textContent = t; };
  function paintPlate(def) {
    const p = plateOf(def, S.period, Date.now(), S.ends);
    setText(els.label, `${p.label} · ${p.when}`);
    // (CITY H2: no heading — only a line a board NEEDS: its explainer, or a dailies board's ALL TIME floor)
    setText(els.note, (def && def.note) || (S.period === 'all' && def && def.minDays ? p.when : ''));
  }
  /** THE ROWS hold controls (a card → THE PLAYER PAGE, the ⋯, SHOW ALL, TRY AGAIN): the list is swapped only when no finger is down
   *  (ui/tapwatch.js#afterTap — right after that tap's click), and only if this refresh is still the latest */
  const swapRows = (token, fn) => afterTap(() => { if (token === S.token && !destroyed) fn(); });

  async function refresh() {
    renderControls();
    const def = boardDef(S.board);
    S.ends = null;
    paintPlate(def);
    const token = ++S.token;
    S.rows = []; S.more = false; S.all = false;
    if (!def) { swapRows(token, () => empty(def)); paintMe(null, null); return; }
    swapRows(token, skeleton);
    paintMe(def, 'loading');
    cascadeSound = true;
    try {
      const [data, kit] = await Promise.all([fetchBoard(def.id, S.period, { start: 0, n: PAGE }), stripKit()]);
      if (token !== S.token || destroyed) return;
      K = kit;
      S.rows = data.rows || []; S.more = !!data.more; S.ends = data.ends || null;
      // (THE DROP B: a daily scheduled live from /admin — its chip joins once the board says it's in today's set)
      if (Array.isArray(data.live) && data.live.join(',') !== (S.live || []).join(',')) { S.live = data.live; ctrlSig = ''; renderControls(); }
      paintPlate(def);
      swapRows(token, () => renderRows(def, true));
    } catch (e) {
      if (token !== S.token || destroyed) return;
      swapRows(token, () => {
        dropSurface();
        els.rows = h('ol.bd-rows', h('li.bd-empty.is-error',
          h('b', 'THE BOARD IS DARK RIGHT NOW'),
          h('span', 'The games still work — results are saved and land here when the lights come back.'),
          tubeButton('TRY AGAIN', { size: 'sm', cls: 'bd-retry', attrs: { 'data-press': true }, onClick: () => refresh() })));
        els.scroll.replaceChildren(els.rows);
      });
    }
    loadMe(def, token);
  }

  function empty(def) {
    dropSurface();
    const [t, line] = emptyOf(def, S.period);
    const mark = h('span.bd-empty-mark');
    lazyImport(import('../vault/emblem-art.js'), '../vault/emblem-art.js').then(E => mark.replaceChildren(E.emblemEl({ avatar: 'crown', color: 'yellow', mode: 'quiet', size: 84 }))).catch(() => mark.replaceChildren(emblem(0, 46, { mini: false })));
    els.rows = h('ol.bd-rows', h('li.bd-empty', mark, h('b', t), line ? h('span', line) : null));
    els.scroll.replaceChildren(els.rows);
  }

  function renderRows(def, fresh) {
    if (!S.rows.length) { empty(def); return; }
    if (fresh) {
      dropSurface();
      els.rows = h('ol.bd-rows');
      els.scroll.replaceChildren(els.rows);
      surface = K.liveList(els.rows, { label: 'board' });
      // (CITY H2 — the list scrolls WITH THE PAGE: a new board brings the controls back to the top of the screen if the page was further down)
      const top = els.tabs.offsetTop - 6; if (els.wrap.scrollTop > top) els.wrap.scrollTop = top;
    }
    const built = els.rows.querySelectorAll('.bd-row').length;
    const upto = S.all ? S.rows.length : Math.min(TOP, S.rows.length);
    const frag = S.rows.slice(built, upto).map((r, i) => row(r, built + i, def));
    els.rows.querySelectorAll('.bd-sentinel, .bd-showall-li, .bd-end').forEach(x => x.remove());
    els.rows.append(...frag);
    if (!S.all && (S.rows.length > TOP || S.more)) {
      els.rows.append(h('li.bd-showall-li', tubeButton(S.more ? 'SHOW ALL' : `SHOW ALL ${S.rows.length}`, { size: 'sm', cls: 'bd-showall', attrs: { 'data-press': true }, onClick: () => { boardSfx('tab'); S.all = true; renderRows(def, false); } })));
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
    seeMine = new IntersectionObserver(es => { const e = es[es.length - 1]; setInList(!!(e && e.isIntersecting && e.intersectionRatio >= 0.6)); }, { root: els.wrap, threshold: [0, 0.6, 1] });
    seeMine.observe(mine);
  }
  function setInList(on) {
    const v = on ? '1' : '';
    if ((els.me.dataset.inlist || '') !== v) els.me.dataset.inlist = v;
  }

  // ------------------------------------------------------------------ your row (pinned at the foot)
  function paintMe(def, state, info) {
    const m = me();
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

  /** CITY H2 — YOUR RANK at the foot: ONE slim line (no card — the list's cards are the page), shown only while your card isn't on screen */
  function fillMe(def, info, m) {
    const p = m.profile;
    const rank = info && info !== 'loading' && info.rank;
    const [val, ...caps] = meNote(def, info, p);
    const unit = unitOf(def, S.period);
    els.me.replaceChildren(h('div.bd-me-line',
      h('span.bd-me-rank', rank ? `#${rank.toLocaleString('en-US')}` : '—'),
      h('b.bd-me-you', p.h ? 'YOU · HIDDEN' : 'YOU'),
      h('span.bd-me-note2', val != null ? h('b', val, unit ? h('small', unit) : null) : null, ...caps.filter(Boolean).map(c => h('span', c)))));
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
    io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { root: els.wrap, rootMargin: '300px' });
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
    pick: (tab, cat, period) => { if (period) S.period = period; const t = tab && tabOf(tab); if (t && t !== S.tab) pickTab(t); else refresh(); },
    destroy() {
      destroyed = true;
      closeReport();
      if (picker) { const s2 = picker; picker = null; s2.close(); }
      io && io.disconnect();
      if (seeMine) seeMine.disconnect();
      dropSurface();
    },
  };
}
