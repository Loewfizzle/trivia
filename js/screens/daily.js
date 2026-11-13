// THE DAILY MODULE — THE SCREENS (DM2 — docs/progression.md "THE DAILY MODULE — DM2: THE SCREENS"; prefix `dy-`, css/daily.css on demand).
// Driven by `state.daily` (app.js#paintDaily → syncDaily on every render — a screen renders from the state):
//   { v: 'screen', tab?: 'today' | 'scores' }  THE DAILY SCREEN — TODAY (the sign, THE SWEEP meter, one TICKET ROW per live daily, SHARE TODAY,
//                                              the countdown to 4 am Eastern) · SCORES (TODAY: YOUR TABLE per daily + the everyone line · ALL TIME —
//                                              BOARD 2.0 B: YOUR TABLE's average a day + the everyone board's top 3 → THE BOARD)
//   { v: 'run', id }                           a daily's RUN: its cartridge's own view, mounted solo (state.game = daily.create's shell, the judge =
//                                              its API judge wrapped so the screen hears the start + the finish) — with its ONE-TIME HINT on a
//                                              player's first run (a row's `lesson` + the cartridge's HINT line — DFIX3; the practice harbor is cut)
// Both are OVERLAYS over the city (like YOUR CARD in a room): the title + its city stay mounted, their frames HELD underneath (ui/city-hold.js).
// THE ROOM WINS (DM1's server half): the room starts a game mid-run → the run closes ("GAME STARTING · YOUR DAILY IS SAVED"), COAST CLEAR's
// clock paused on the server (+15 s), the run HELD (js/daily/today.js) → the RESUME chip after the match brings it back exactly where it was.
import { h, clear, reducedMotion } from '../ui/dom.js';
import { tubeButton } from '../ui/components.js';
import { sfx } from '../audio/sfx.js';
import { state, setState } from '../store.js';
import { retryWhile } from '../daily/retry.js';
import { serverNow } from '../firebase.js';
import { loadProfile } from '../identity.js';
import { takeLayer, onCloseAll } from '../ui/layers.js';
import { holdCity } from '../ui/city-hold.js';
import { easternParts } from '../core/week.js';
import { streakDay } from '../core/streak.js';
import { dailyRow } from '../core/daily.js';
import { msToTurn, fmtCountdown } from '../daily/clock.js';
import { loadToday, todayNow, onToday, markFinished, markStarted, markLesson, heldRun, holdRun, dropHeld, turnNow, staleToday } from '../daily/today.js';
import { rowState, sweepState, tableFor, everyoneLine, ordinal, tableCut, cardRows, stillToPlay, allTimeRows, allTimeLine, COUNTS_FROM_TOMORROW, ROOM_BANNER } from '../daily/today-logic.js';
import { MIN_DAYS } from '../core/daily-points.js';
import { syncMidFlag, wantFlag } from '../daily/room-flag.js';
import { stripKit, stripFor, stripFx } from '../ui/strip-board.js';

// ------------------------------------------------------------------------------------------------ the sheet + each daily's thin meta
let css = null, cssReady = false;
export function dailySheet() {
  if (css) return css;
  css = new Promise(res => {
    if (document.querySelector('link[data-dy]')) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/daily.css'; l.dataset.dy = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  }).then(() => { cssReady = true; });
  return css;
}
const metas = new Map();
/** a daily's THIN META (pure, tiny — its scoreLine): a test row has none (its score as a number) */
function metaFor(id) {
  if (!metas.has(id)) metas.set(id, lazyImport(import(`../games/${id}/meta.js`), '../games/*/meta.js').catch(() => ({})));
  return metas.get(id);
}
const META = {};
async function loadMetas(ds) { await Promise.all(ds.map(async d => { META[d.id] = await metaFor(d.id); })); }
export const lineOf = (id, score) => { const m = META[id]; return m && typeof m.scoreLine === 'function' ? m.scoreLine(score) : String(score); };

// ------------------------------------------------------------------------------------------------ the drawn pieces (no emoji, no pills)
// (DFIX3 — THE PREMIUM TICKET: the art, the ADMITTED stamp + the serial live in js/daily/ticket-art.js, shared with SHARE TODAY's image)
import { TICKET_ART, stampSvg, serialOf } from '../daily/ticket-art.js';
import { lazyImport } from '../ui/lazy-import.js';
import { afterTap } from '../ui/tapwatch.js';
export { TICKET_ART };
const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';

// ------------------------------------------------------------------------------------------------ the overlay manager
let scr = null, run = null, lastKey = '', sweepNext = false, sweptAt = 0;
const stampNext = new Set();   // DFIX3 — the dailies just finished on this phone: their ADMITTED stamp comes down on the next TODAY paint (once each)
/** app.js calls this on every render: open / close / switch the overlay the state asks for (+ THE ROOM WINS) */
export function syncDaily(st) {
  const d = st.daily || null;
  const roomGame = !!(st.code && st.meta && st.meta.status === 'playing' && st.game && st.quit !== st.game.matchId);
  if (roomGame && (run || scr)) { roomWins(st); return; }
  const key = !d || roomGame ? '' : d.v === 'run' ? `run:${d.id}` : 'screen';
  if (key === lastKey) { if (scr && d && d.v === 'screen') scr.setTab(d.tab || 'today'); return; }
  lastKey = key;
  if (key !== 'screen' && scr) { scr.close(); scr = null; }
  if (!key.startsWith('run:') && run) { run.close(); run = null; }
  if (key === 'screen' && !scr) scr = openScreen(d.tab || 'today');
  if (key.startsWith('run:') && !run) run = openRun(d.id);
  document.body.dataset.daily = key ? (key === 'screen' ? 'screen' : 'run') : '';
  if (!key) delete document.body.dataset.daily;
  syncMidFlag(wantFlag(), st);   // (DFIX2 — THE MID-DAILY FLAG on this phone's room node: a run open / held → the host's line, no poll)
}
onToday(() => syncMidFlag(wantFlag()));   // (a hold dropped — resumed, the day turned, the chip's rule → the flag goes with it)
/** THE ROOM WINS: the host started a game while this phone is mid-daily → the banner, the run saved (paused on the server), the overlay gone */
function roomWins(st) {
  const r = run;
  if (r && !r.isDone()) {
    holdRun(r.id, r.day());
    banner();
    r.pause(st.code);
  }
  if (run) { run.close(); run = null; }
  if (scr) { scr.close(); scr = null; }
  lastKey = '';
  delete document.body.dataset.daily;
  syncMidFlag(wantFlag(), st);
  queueMicrotask(() => setState({ daily: null }));   // (not inside the render that called us)
}
/** THE ROOM WINS' banner: its own strip over the walk inside (~3.6 s) — never THE MESSAGE (the game start's own messages would replace it) */
export function banner() {
  dailySheet();   // (FR7 FIXES A — DY1: the banner can be the first daily thing a fresh page shows)
  const old = document.querySelector('.dy-banner'); if (old) old.remove();
  const el = h('div.dy-banner', { role: 'status', 'aria-live': 'assertive' }, h('span.dy-banner-ic', { html: TICKET_SVG, 'aria-hidden': 'true' }), h('b', ROOM_BANNER));
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, 3600);
}
const TICKET_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 6.6h16.8v3a2.4 2.4 0 0 0 0 4.8v3H3.6v-3a2.4 2.4 0 0 0 0-4.8z"/><path d="M15.2 7.9v1.3M15.2 11.35v1.3M15.2 14.8v1.3"/></svg>';
// THE GAME START closes every pop-up (layers.js#closeAll — at the host's meta/go stamp, before the room says 'playing'): a daily open then is
// THE ROOM WINS (the banner, the run held + paused — the server accepts a pause from the go stamp); any other closeAll (a kick, leaving the
// room) leaves the dailies to the layer stack
onCloseAll(() => {
  const st = state, go = st.meta && st.meta.go;
  if ((run || scr) && st.code && st.meta && (st.meta.status === 'playing' || (go && Math.abs(serverNow() - (go.at || 0)) < 120000))) roomWins(st);
});

/** a full-screen overlay: the layer stack (Esc / the system back = ‹), the city held under it */
function overlay(cls, onBack) {
  // FR7 FIXES A — DY1: EVERY overlay loads the sheet itself (RESUME YOUR DAILY on a fresh page opens a RUN with no SCREEN before it — the run
  // mounted transparent over the title), and stays invisible until the sheet is in (never an unstyled frame)
  const sheet = dailySheet();
  const el = h(`section.screen.screen-in.dy-overlay.${cls}`, { role: 'dialog', 'aria-modal': 'true' });
  if (!cssReady) { el.style.visibility = 'hidden'; sheet.then(() => { el.style.visibility = ''; }); }
  document.body.append(el);
  const release = takeLayer(null, { close: onBack });   // (the ONE Esc; the overlay keeps its own z — css/daily.css — under every sheet + toast)
  const unhold = holdCity();
  return { el, close() { release(); unhold(); el.classList.add('screen-out'); setTimeout(() => el.remove(), 240); } };
}
const backBtn = (label, onClick) => h('button.dy-back', { type: 'button', 'aria-label': label, onclick: onClick }, h('span', { html: BACK }));
const goScreen = (tab = 'today') => setState({ daily: { v: 'screen', tab } });
const closeAll = () => setState({ daily: null });

// ------------------------------------------------------------------------------------------------ THE DAILY SCREEN
function openScreen(tab0) {
  dailySheet();
  const O = overlay('dy-screen', () => closeAll());
  const els = {};
  let tab = tab0, today = todayNow(), friends = null, gone = false, clockT = 0, lastSig = '';
  // DFIX2 — SLIM CARDS ON SCORES: ONE effect surface per daily's panel (fx/renderer.js); every surface goes on a repaint + when the screen closes
  let surfaces = [], showAll = {};
  // BOARD 2.0 B — SCORES → ALL TIME: TODAY · ALL TIME on SCORES; YOUR TABLE's averages (/api/daily points — once a visit) + the everyone board's top 3
  let scope = 'today', pts = null, ptsP = null;
  const every = {};
  const dropSurfaces = () => { for (const sf of surfaces) { try { sf.destroy(); } catch { /* fine */ } } surfaces = []; };
  els.head = h('header.dy-head', backBtn('Back', () => closeAll()),
    h('h1.dy-sign', { 'aria-label': 'The dailies' }, h('span.dy-sign-t', 'THE DAILIES')));
  els.tabs = h('nav.dy-tabs', { role: 'tablist' },
    els.tToday = h('button.dy-tab', { type: 'button', role: 'tab', onclick: () => goScreen('today') }, 'TODAY'),
    els.tScores = h('button.dy-tab', { type: 'button', role: 'tab', onclick: () => goScreen('scores') }, 'SCORES'));
  els.body = h('div.dy-body');
  els.scroll = h('div.dy-scroll', els.head, els.tabs, els.body);
  O.el.append(els.scroll);
  // SCROLL-PAUSE (the owner, Nov 8 — kept on purpose): the foil sheen holds while a finger scrolls (the fx surfaces hold themselves — fx/renderer.js)
  let scrollT = 0;
  els.scroll.addEventListener('scroll', () => { O.el.classList.add('is-scrolling'); clearTimeout(scrollT); scrollT = setTimeout(() => O.el.classList.remove('is-scrolling'), 220); }, { passive: true });

  const paint = async () => {
    if (gone) return;
    const t = today || { dailies: [] };
    await loadMetas(t.dailies || []);
    if (gone) return;
    // (a repaint only when something on screen changed — a tap never lands on a row that was just rebuilt)
    const sig = JSON.stringify([tab, t, names(), pidNow(), showAll, scope, pts, Object.keys(every).filter(k => every[k] !== 'loading')]);
    if (sig === lastSig && !sweepNext && !stampNext.size) return;
    lastSig = sig;
    dropSurfaces();
    els.tToday.classList.toggle('is-on', tab === 'today'); els.tToday.setAttribute('aria-selected', String(tab === 'today'));
    els.tScores.classList.toggle('is-on', tab === 'scores'); els.tScores.setAttribute('aria-selected', String(tab === 'scores'));
    els.body.classList.toggle('is-today', tab !== 'scores'); els.body.classList.toggle('is-scores', tab === 'scores');   // (DFIX3 — TODAY centred)
    clear(els.body);
    if (!t.dailies || !t.dailies.length) { els.body.append(h('p.dy-quiet', t.down ? 'The dailies are resting. Try again in a minute.' : 'No dailies today.')); return; }
    if (tab === 'scores') paintScores(t); else paintToday(t);
  };

  function paintToday(t) {
    const sw = sweepState(t);
    els.meter = h('div.dy-sweep', { role: 'img', 'aria-label': sw.swept ? 'The sweep: every daily done' : `The sweep: ${sw.done} of ${sw.of}` },
      h('div.dy-sweep-bar', { style: { '--n': sw.of } }, ...sw.segs.map((s, i) => h(`span.dy-seg${s.done ? '.is-done' : ''}`, { style: { '--i': i } }))),
      h('div.dy-sweep-l', sw.swept ? h('b', 'SWEPT') : h('span', h('b', `${sw.done} OF ${sw.of}`), ' · THE SWEEP')));
    const rows = t.dailies.map(d => ticketRow(t, d));
    const share = sw.done ? tubeButton('SHARE TODAY', { kind: 'secondary', block: true, cls: 'dy-share', onClick: () => shareToday(t) }) : null;
    els.next = h('div.dy-next', { 'aria-live': 'off' });
    // DFIX3 — TODAY CENTRED: one box (the meter → the tickets → SHARE → the countdown) sits mid-way between the tabs and the bottom safe area; taller
    // than the space (a third daily, the gated line) → it simply scrolls from the top (an auto margin, never a flex centre that clips)
    els.body.append(h('div.dy-today', ...[els.meter, h('div.dy-rows', ...rows), share, els.next].filter(Boolean)));
    tickNext();
    if (stampNext.size) { for (const id of stampNext) { const s = els.body.querySelector(`.dy-ticket[data-id="${id}"] .dy-stamp`); if (s) stampDown(s); } stampNext.clear(); }
    if (sweepNext && sw.swept) { sweepNext = false; playSweep(); }
  }

  /** DFIX3 — THE PREMIUM TICKET: paper (the CC0 grain tile), a tear-off STUB (the art + the serial, a row of punched holes), the name + the hook
   *  / the result, and on the right PLAY · RESUME · the ADMITTED stamp (drawn, tilted — never the green check circle); a lift shadow under it, at
   *  night a neon edge + a foil sheen that drifts (transform only; held while scrolling / reduced motion) */
  function ticketRow(t, d) {
    const st = rowState(t, d.id), row = dailyRow(d.id) || {};
    const art = h('span.dy-art', { html: TICKET_ART[d.ticket] || TICKET_ART[row.ticket] || TICKET_ART.star });
    const serial = h('span.dy-serial', { 'aria-hidden': 'true' }, serialOf(t.day));
    let info, act;
    if (st === 'done') {
      // DONE: the result where the hook was (the score + YOUR TABLE's place, or the everyone line), the ADMITTED stamp on the right
      const tb = tableFor(t, d.id, { names: names(), me: me(), better: d.better });
      const gated = !!(t.gated && t.gated[d.id]);
      const sub = gated ? COUNTS_FROM_TOMORROW : tb.line || everyoneLine(t.stand && t.stand[d.id]) || 'DONE FOR TODAY';
      info = h('div.dy-info', h('b.dy-name', d.name), h('span.dy-result', lineOf(d.id, t.mine[d.id])), h('small.dy-rank', sub));
      act = h('span.dy-stamp', { html: stampSvg(), role: 'img', 'aria-label': 'admitted — done for today' });
    } else info = h('div.dy-info', h('b.dy-name', d.name), h('span.dy-hook', d.hook || row.hook || row.tag || ''));
    if (st !== 'done') act = tubeButton(st === 'progress' ? 'RESUME' : 'PLAY', { kind: st === 'progress' ? 'secondary' : 'main', cls: 'dy-play', onClick: () => play(d.id) });
    const ticket = h(`div.dy-ticket.is-${st}`, { dataset: { id: d.id }, style: { '--tk0': themeInk(d.id) } },
      h('div.dy-stub', art, serial), info, h('div.dy-act', act), h('i.dy-foil', { 'aria-hidden': 'true' }));
    return h('div.dy-tkw', ticket);
  }
  /** the stamp comes DOWN (the daily just finished on this phone): scale-in + a settle + a tiny ink spread — transform + opacity only; reduced
   *  motion = it is simply there */
  function stampDown(el) {
    if (!el || reducedMotion()) return;
    el.classList.remove('is-down'); void el.offsetWidth; el.classList.add('is-down');
    try { sfx('select'); } catch { /* polish */ }
  }

  // SCORES — YOUR TABLE as SLIM CARDS (DFIX2 — Ben: "they look so good, we need to start using them"): each FINISHER's row = their equipped slim
  // card through the results lists' own code (ui/strip-board.js — never a second strip system), the rank LEFT of the card, the SCORE on the line
  // under it at its right end (never over the card), YOU = your card + a lit frame; the ones STILL TO PLAY get no card — one line under the
  // cards; a long table = the top 5 + you (your real place) + SHOW ALL n. The everyone line stays at the panel's foot.
  function paintScores(t) {
    els.body.append(h('div.dy-scope', { role: 'tablist', 'aria-label': 'Today or all time' }, ...[['today', 'TODAY’S SCORES'], ['all', 'ALL TIME']].map(([v, l]) =>
      h(`button.dy-scope-b${scope === v ? '.is-on' : ''}`, { type: 'button', role: 'tab', 'aria-selected': String(scope === v), onclick: () => { if (scope !== v) { sfx('select'); scope = v; paint(); } } }, l))));
    if (scope === 'all') { paintAllTime(t); return; }
    let lonely = true;   // (DFIX3: no friend at any table → ONE hint at the foot, never inside a panel)
    for (const d of t.dailies) {
      const tb = tableFor(t, d.id, { names: names(), me: me(), better: d.better });
      const mineDone = t.mine && t.mine[d.id] != null;
      const { finishers, waiting } = cardRows(tb.rows);
      const cut = tableCut(finishers, { all: !!showAll[d.id] });
      const soloTable = finishers.length <= 1;   // (DFIX3 — a table of one: the card alone, no rank; the ranks come with a second finisher)
      const list = h(`ol.board-list.is-strips.dy-cards${soloTable ? '.is-solo' : ''}`, { 'aria-label': `${d.name} — your table` },
        ...cut.shown.map(r => h(`li.lb-row.lb-strip.dy-crow${r.me ? '.is-me' : ''}${r.place === 1 && !soloTable ? '.is-first' : ''}`, { dataset: { pid: r.pid } },
          h('span.lb-rank', r.place && !soloTable ? ordinal(r.place) : ''),
          h('div.lb-card.dy-card', h('div.lb-sub',
            r.gated ? h('small.dy-cnote', 'NOT COUNTED') : null,
            h('span.lb-pts', h('span.lb-score.dy-cscore', r.score != null ? lineOf(d.id, r.score) : 'PLAYED')))))));
      const more = cut.hidden.length ? h('button.dy-more', { type: 'button', onclick: () => { sfx('select'); showAll[d.id] = true; paint(); } }, h('span', `SHOW ALL ${cut.more}`), h('i', { 'aria-hidden': 'true' })) : null;
      const still = stillToPlay(waiting);
      if (tb.rows.length > 1) lonely = false;
      els.body.append(h('section.dy-sec', { style: { '--tk0': themeInk(d.id) }, dataset: { id: d.id } },
        h('h2.dy-sec-h', h('span.dy-sec-art', { html: TICKET_ART[d.ticket] || TICKET_ART.star }), d.name),
        h('h3.dy-sub', 'YOUR TABLE'),
        cut.shown.length ? list : null,
        more,
        still ? h('p.dy-still', still) : null,
        !mineDone && finishers.length ? h('p.dy-quiet', 'Play it to see their scores.') : null,
        everyoneLine(t.stand && t.stand[d.id]) ? h('p.dy-every', everyoneLine(t.stand[d.id])) : null));
      if (cut.shown.length) dressCards(list, cut.shown, d);
    }
    if (lonely) els.body.append(h('p.dy-foot-hint', FOOT_HINT));
  }
  // BOARD 2.0 B — SCORES → ALL TIME: per daily, YOUR TABLE's average a day as slim cards (ranked from MIN_DAYS days played — the boards' rule; YOU
  // below it: "3 MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3"), then EVERYONE's top 3 (the daily's ALL TIME board) + SEE THE FULL BOARD › (THE BOARD →
  // DAILIES · ALL TIME on that daily). /api down → a quiet line, never a dead panel.
  function paintAllTime(t) {
    if (!pts && !ptsP) {
      ptsP = lazyImport(import('../daily/contract.js'), '../daily/contract.js').then(C => C.dailyPoints(((friends && friends.friends) || []).map(c => c.pid)))
        .then(r => { pts = r || { down: true }; }).catch(() => { pts = { down: true }; }).finally(() => { if (!gone) repaint(); });
    }
    if (!pts) { els.body.append(h('p.dy-quiet', 'Counting up the averages…')); return; }
    for (const d of t.dailies) {
      const board = `daily-${d.id}`;
      const rows = pts.down ? [] : allTimeRows(pts, { board, me: { pid: pidNow() || 'me', name: me().name }, names: names(), need: MIN_DAYS });
      const cut = tableCut(rows, { all: !!showAll[`all:${d.id}`] });
      const list = rows.length ? h('ol.board-list.is-strips.dy-cards', { 'aria-label': `${d.name} — your table, all time` },
        ...cut.shown.map(r => { const ln = allTimeLine(r, MIN_DAYS); return h(`li.lb-row.lb-strip.dy-crow${r.me ? '.is-me' : ''}${r.place === 1 ? '.is-first' : ''}`, { dataset: { pid: r.pid } },
          h('span.lb-rank', r.place ? ordinal(r.place) : ''),
          h('div.lb-card.dy-card', h('div.lb-sub', ln.note ? h('small.dy-cnote.dy-anote', ...ln.note.split(' · ').map(x => h('span', x))) : null,
            ln.score ? h('span.lb-pts', h('span.lb-score.dy-cscore', ln.score, h('small.dy-unit', ln.unit))) : null))); })) : null;
      const more = cut.hidden.length ? h('button.dy-more', { type: 'button', onclick: () => { sfx('select'); showAll[`all:${d.id}`] = true; paint(); } }, h('span', `SHOW ALL ${cut.more}`), h('i', { 'aria-hidden': 'true' })) : null;
      const ev = h('ol.board-list.is-strips.dy-cards.dy-every-list', { 'aria-label': `${d.name} — everyone, all time` });
      const sec = h('section.dy-sec', { style: { '--tk0': themeInk(d.id) }, dataset: { id: d.id } },
        h('h2.dy-sec-h', h('span.dy-sec-art', { html: TICKET_ART[d.ticket] || TICKET_ART.star }), d.name),
        h('h3.dy-sub', 'YOUR TABLE · AVERAGE A DAY'),
        list || h('p.dy-quiet', pts.down ? 'The averages are resting. Try again in a minute.' : `Play ${d.name} to start your average — a player is ranked from ${MIN_DAYS} days.`),
        more,
        h('h3.dy-sub', 'EVERYONE · ALL TIME'),
        ev,
        h('button.dy-more.dy-seeboard', { type: 'button', onclick: () => { sfx('select'); setState({ daily: null, view: 'board', boardGame: 'dailies', boardBoard: board, boardPeriod: 'all' }); } }, h('span', 'SEE THE FULL BOARD'), h('b', { 'aria-hidden': 'true' }, '›')));
      els.body.append(sec);
      if (list) dressCards(list, cut.shown, d);
      paintEvery(ev, board, d);
    }
  }
  /** EVERYONE's top 3 on a daily's ALL TIME board (the public rows — the slim card's own ids), loaded once a visit */
  function paintEvery(ev, board, d) {
    const got = every[board];
    if (!got) { every[board] = 'loading'; lazyImport(import('../profile/api.js'), '../profile/api.js').then(A => A.board(board, 'all', { n: 3 })).then(r => { every[board] = (r && r.rows) || []; }).catch(() => { every[board] = []; }).finally(() => { if (!gone) repaint(); }); }
    if (!Array.isArray(got)) { ev.replaceWith(h('p.dy-quiet', '…')); return; }
    if (!got.length) { ev.replaceWith(h('p.dy-quiet', `Nobody is ranked yet — it takes ${MIN_DAYS} days of ${d.name}.`)); return; }
    ev.append(...got.map(r => h('li.lb-row.lb-strip.dy-crow', { dataset: { pid: r.id } }, h('span.lb-rank', ordinal(r.rank)),
      h('div.lb-card.dy-card', h('div.lb-sub', h('span.lb-pts', h('span.lb-score.dy-cscore', (r.v / 100).toFixed(1), h('small.dy-unit', 'AVG'))))))));
    stripKit().then(K => {
      if (gone || !ev.isConnected) return;
      const surface = K.createSurface(ev, { label: `every:${d.id}` }); surfaces.push(surface);
      got.forEach((r, i) => { const slot = ev.querySelector(`.dy-crow[data-pid="${r.id}"] .dy-card`); if (!slot) return; const st = stripFor(K, r); slot.prepend(st.el); stripFx(K, surface, st, i + 1); });
      ev.dataset.strips = String(got.length);
    }).catch(() => {});
  }
  /** the strips into their rows (async: the kit loads once a page) — a friend from their card in the friends list, you from `me` */
  async function dressCards(list, rows, d) {
    const K = await stripKit();
    if (gone || !list.isConnected) return;
    const surface = K.createSurface(list, { label: `scores:${d.id}` });
    surfaces.push(surface);
    rows.forEach((r, i) => {
      const slot = list.querySelector(`.dy-crow[data-pid="${r.pid}"] .dy-card`);
      if (!slot) return;
      const pub = r.me ? (pidMod && pidMod.myPublic && pidMod.myPublic()) || { n: r.name } : friendCard(r.pid) || { n: r.name };
      const strip = stripFor(K, pub, { name: r.name });
      slot.prepend(strip.el);
      stripFx(K, surface, strip, i + 1);
    });
    list.dataset.strips = String(rows.length);
  }
  const friendCard = pid => ((friends && friends.friends) || []).find(c => c.pid === pid) || null;

  const names = () => Object.fromEntries(((friends && friends.friends) || []).map(c => [c.pid, String(c.n || 'FRIEND').toUpperCase()]));
  const me = () => ({ pid: pidNow(), name: String((loadProfile() || {}).name || 'YOU').toUpperCase() });

  function tickNext() {
    clearInterval(clockT);
    let turned = false;
    const draw = () => {
      if (!els.next || !els.next.isConnected) return;
      const t = serverNow(), ms = msToTurn(easternParts(t), t % 1000);
      els.next.textContent = `NEW DAILIES IN ${fmtCountdown(ms)}`;
      // DFIX2 (finding 4): the countdown reaching zero turns the screen over itself — a fresh `today` (the tickets back to PLAY), no reload
      if (ms <= 1000 && !turned) { turned = true; turnNow(); }
    };
    draw(); clockT = setInterval(draw, 1000);
  }
  function playSweep() {
    if (!els.meter) return;
    sweptAt = Date.now();
    els.meter.classList.remove('is-sweeping'); void els.meter.offsetWidth; els.meter.classList.add('is-sweeping');
    try { sfx('win'); } catch { /* polish */ }
  }

  // (THE ERRORS GROUP, Nov 12 night — /admin's LOST TAP on TODAY'S SCORES' tab `dy-scope-b`: an ANSWER that lands (today, the friends, a board)
  //  repainted the whole body — the tab rebuilt under the finger, its click on a detached button. Every repaint an answer asks for waits for the
  //  tap to land (ui/tapwatch.js#afterTap — the shared layer's rule); a tap's own repaint stays at once)
  const repaint = () => afterTap(() => { if (!gone) paint(); });
  const off = onToday(t => { today = t; repaint(); });
  lazyImport(import('../profile/friends.js'), '../profile/friends.js').then(F => F.loadFriends()).then(f => { friends = f; if (!gone) repaint(); }).catch(() => {});
  paint();
  pidReady.then(() => { if (!gone) repaint(); });
  loadToday({ fresh: true });
  return {
    setTab(t) { if (t !== tab) { tab = t; paint(); } },
    close() { gone = true; off(); clearInterval(clockT); dropSurfaces(); O.close(); },
    surfaces: () => surfaces.length,
  };
}
let pidMod = null;
const pidNow = () => (pidMod ? pidMod.myPid() : null);
const pidReady = lazyImport(import('../profile/me.js'), '../profile/me.js').then(m => { pidMod = m; }).catch(() => {});
/** a daily's ink on the ticket (its theme accent) — THE PASSWORD pink, COAST CLEAR cyan, else the house pink */
/** DFIX3 — the one hint at the foot of SCORES while no friend sits at any table (the house small-caps style) */
export const FOOT_HINT = 'ADD FRIENDS BY THEIR NAME TAG — THEIR SCORES LAND HERE';
const themeInk = id => ({ password: '#ff5ec4', coastclear: '#5fe1ff' })[id] || '#ff6fc8';

/** PLAY / RESUME: a profile first (the dailies are official — /api counts them), then the run */
async function play(id) {
  sfx('select');
  if (!pidNow()) {
    const p = loadProfile();
    if (!p || !p.name) { setState({ daily: null, view: 'setup', setupMode: 'edit' }); return; }
    try { const m = await lazyImport(import('../profile/me.js'), '../profile/me.js'); pidMod = m; await m.syncMe(); } catch { /* the run says so */ }
  }
  setState({ daily: { v: 'run', id } });
}

// ------------------------------------------------------------------------------------------------ SHARE TODAY
async function shareToday(t) {
  try {
    const m = await lazyImport(import('../daily/share-today.js'), '../daily/share-today.js');
    const pub = pidMod && pidMod.myPublic ? pidMod.myPublic() : null;   // (DFIX3 — the streak flame on the share image: the profile's streak)
    await m.shareToday(t, lineOf, { streak: pub && Number(pub.s) > 0 ? Number(pub.s) : 0 });
  } catch (e) { console.warn('[daily share]', e); }
}

// ------------------------------------------------------------------------------------------------ A RUN (+ its one-time hint)
function openRun(id) {
  const O = overlay('dy-run', () => goScreen());
  const row = dailyRow(id) || {};
  let view = null, mod = null, inner = null, gone = false, done = false, day = null;
  const stage = h('div.screen.screen-in.dy-stage');   // (a .screen: the game's view retokens .screen.<id>-screen)
  const back = backBtn('Back to the dailies', () => goScreen());
  O.el.append(stage, back);
  document.body.dataset.theme = row.theme || id;
  (async () => {
    const reg = await lazyImport(import('../games/registry.js'), '../games/registry.js');
    mod = await reg.loadGame(id);
    if (gone) return;
    const t = todayNow() || (await loadToday());
    if (gone) return;
    // DFIX3 — THE ONE-TIME HINT (the owner, Nov 8 — the practice harbor CUT): a daily with a `lesson` row + a HINT line shows it ONCE, under the board
    // of a player's FIRST run (never on a resume, a held run or a seen one — the server's flag, every device)
    const hint = row.lesson && typeof mod.HINT === 'string' && !(t && t.lessons && t.lessons[id]) && !(heldRun() && heldRun().id === id)
      && !(t && t.started && t.started[id]) ? mod.HINT : null;
    mount(hint);
  })().catch(e => { console.warn('[daily run]', e); if (!gone) stage.append(h('p.dy-quiet.dy-fail', 'The daily couldn’t open. Check your signal and try again.')); });

  /** the hint has gone (the first number landed) → seen once per player (the server keeps it on the profile) */
  function hintSeen() {
    markLesson(id);
    lazyImport(import('../profile/api.js'), '../profile/api.js').then(a => a.api('daily', { action: 'lesson', game: id })).catch(() => {});
  }
  function mount(hint = null) {
    clear(stage);
    if (heldRun() && heldRun().id === id) dropHeld();     // (THE ROOM WINS: back in the run — the chip's job is done)
    syncMidFlag(true);                                    // (DFIX2: a run open in a room → the host's MID-DAILY line)
    inner = mod.createApiJudge ? mod.createApiJudge() : null;
    const judge = inner && wrapJudge(inner);
    const uid = state.uid || 'me', now = serverNow(), dk = streakDay(now);
    const game = mod.daily.create({ date: dk, uid, now, daySet: { v: 1, day: dk } });
    const players = { [uid]: { name: (loadProfile() || {}).name || 'YOU', color: (loadProfile() || {}).color || 'cyan', avatar: (loadProfile() || {}).avatar || 'bolt' } };
    view = mod.createView();
    view.mount(stage, { uid, game, players, meta: { status: 'playing' }, ...(judge ? { judge } : {}), ...(hint ? { hint, onHint: hintSeen } : {}) });
  }
  /** the cartridge's API judge, heard: the start (IN PROGRESS), the finish (the score in at once, THE SWEEP moment, counts-from-tomorrow) */
  function wrapJudge(j) {
    const w = Object.create(j);
    w.start = async () => { const r = await j.start(); day = r.day || day; if (r.done != null) done = true; else markStarted(id); return r; };
    w.finish = async () => {
      const r = await j.finish();
      done = true;
      markFinished(id, r.score, r);
      stampNext.add(id);   // (DFIX3 — the ticket's stamp comes down on the next TODAY paint)
      if (r.outcome && r.outcome.swept) sweepNext = true;
      if (r.counted === false) later(() => gatedLine(), 1600);
      return r;
    };
    return w;
  }
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!gone) fn(); }, ms));
  /** a same-day profile: ONE quiet line on its own result (the game's end screen's record line) */
  function gatedLine() {
    const rec = stage.querySelector('[class$="-end-rec"]');
    if (rec) { rec.textContent = COUNTS_FROM_TOMORROW; rec.classList.add('dy-gated-rec'); }
    else stage.append(h('p.dy-gated.dy-gated-run', COUNTS_FROM_TOMORROW));
  }
  return {
    id,
    day: () => day,
    isDone: () => done,
    /** THE ROOM WINS: COAST CLEAR's clock stops on the server (the room really started a game — checked there); THE PASSWORD has no clock */
    // (FR7 FIXES A — DY5: sent ONCE, a failed pause was silent — the banner said SAVED while COAST CLEAR's clock ran through the match. Now
    // retried with a back-off for as long as THAT room is still playing — js/daily/retry.js#retryWhile; the run's close doesn't stop it)
    pause(code) {
      if (!inner || typeof inner.pause !== 'function') return;
      const j = inner;
      // (the first try always goes — THE GAME START's closeAll comes at the go stamp, BEFORE the room says 'playing'; the retries while that
      // room is starting or playing)
      let first = true;
      retryWhile(() => j.pause(code), { alive: () => { if (first) { first = false; return true; } return state.code === code && !!state.meta && (state.meta.status === 'playing' || !!state.meta.go); } }).catch(() => {});
    },
    close() {
      gone = true; timers.forEach(clearTimeout);
      try { if (view) view.unmount(); } catch (e) { console.warn('[daily run] unmount', e); }
      if (document.body.dataset.theme === (row.theme || id)) document.body.dataset.theme = '';
      O.close();
      queueMicrotask(() => syncMidFlag(wantFlag()));       // (closed unheld → the flag goes; held → it stays)
    },
  };
}
// (test hook: the screens' state)
if (typeof window !== 'undefined') window.__daily2 = { syncDaily, state: () => ({ screen: !!scr, run: run ? run.id : null, key: lastKey }), sweptAt: () => sweptAt, heldRun, setSweepNext: v => { sweepNext = !!v; },
  setStampNext: id => { stampNext.add(id); },   // (DFIX3 — the previews + the tests: the stamp-down on the next paint)
  // DFIX2 — the tests: the effect surfaces open on SCORES (0 once the screen closes), the 4 am turn (stale = make the kept answer yesterday's)
  surfaces: () => (scr ? scr.surfaces() : 0), stale: staleToday, turn: turnNow };
