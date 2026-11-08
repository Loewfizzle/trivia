// THE DAILY MODULE — THE SCREENS (DM2 — docs/progression.md "THE DAILY MODULE — DM2: THE SCREENS"; prefix `dy-`, css/daily.css on demand).
// Driven by `state.daily` (app.js#paintDaily → syncDaily on every render — a screen renders from the state):
//   { v: 'screen', tab?: 'today' | 'scores' }  THE DAILY SCREEN — TODAY (the sign, THE SWEEP meter, one TICKET ROW per live daily, SHARE TODAY,
//                                              the countdown to 4 am Eastern) · SCORES (YOUR TABLE per daily + the everyone line; ALL TIME hidden
//                                              until BOARD 2.0 — the owner, Step 0)
//   { v: 'run', id }                           a daily's RUN: its cartridge's own view, mounted solo (state.game = daily.create's shell, the judge =
//                                              its API judge wrapped so the screen hears the start + the finish) — first its LESSON once per
//                                              player (a row's `lesson` + the cartridge's createLesson: COAST CLEAR's PRACTICE HARBOR)
// Both are OVERLAYS over the city (like YOUR CARD in a room): the title + its city stay mounted, their frames HELD underneath (ui/city-hold.js).
// THE ROOM WINS (DM1's server half): the room starts a game mid-run → the run closes ("GAME STARTING · YOUR DAILY IS SAVED"), COAST CLEAR's
// clock paused on the server (+15 s), the run HELD (js/daily/today.js) → the RESUME chip after the match brings it back exactly where it was.
import { h, clear } from '../ui/dom.js';
import { tubeButton } from '../ui/components.js';
import { sfx } from '../audio/sfx.js';
import { state, setState } from '../store.js';
import { serverNow } from '../firebase.js';
import { loadProfile } from '../identity.js';
import { takeLayer, onCloseAll } from '../ui/layers.js';
import { holdCity } from '../ui/city-hold.js';
import { easternParts } from '../core/week.js';
import { streakDay } from '../core/streak.js';
import { dailyRow } from '../core/daily.js';
import { msToTurn, fmtCountdown } from '../daily/clock.js';
import { loadToday, todayNow, onToday, markFinished, markStarted, markLesson, heldRun, holdRun, dropHeld } from '../daily/today.js';
import { rowState, sweepState, tableFor, everyoneLine, ordinal, COUNTS_FROM_TOMORROW, ROOM_BANNER } from '../daily/today-logic.js';

// ------------------------------------------------------------------------------------------------ the sheet + each daily's thin meta
let css = null;
export function dailySheet() {
  if (css) return css;
  css = new Promise(res => {
    if (document.querySelector('link[data-dy]')) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/daily.css'; l.dataset.dy = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return css;
}
const metas = new Map();
/** a daily's THIN META (pure, tiny — its scoreLine): a test row has none (its score as a number) */
function metaFor(id) {
  if (!metas.has(id)) metas.set(id, import(`../games/${id}/meta.js`).catch(() => ({})));
  return metas.get(id);
}
const META = {};
async function loadMetas(ds) { await Promise.all(ds.map(async d => { META[d.id] = await metaFor(d.id); })); }
export const lineOf = (id, score) => { const m = META[id]; return m && typeof m.scoreLine === 'function' ? m.scoreLine(score) : String(score); };

// ------------------------------------------------------------------------------------------------ the drawn pieces (no emoji, no pills)
const tube = (d, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true"><g class="t">${d}</g><g class="c">${d}</g></svg>`;
/** a ticket's art by its key (config.js#DAILIES `ticket`): THE PASSWORD's door + keyhole · COAST CLEAR's lighthouse + beam · a star */
export const TICKET_ART = {
  password: tube('<path d="M6.6 20.6V4.6c0-.6.5-1.1 1.1-1.1h8.6c.6 0 1.1.5 1.1 1.1v16"/><circle cx="12" cy="10.6" r="1.6"/><path d="M12 12.2v3"/><path d="M4 20.6h16"/>'),
  coastclear: tube('<path d="M9.6 20.6l1.1-10.4h2.6l1.1 10.4"/><path d="M10 10.2h4M10.5 7.7h3l-.3-2.6h-2.4z"/><path d="M14.6 6.1l5.6-2.2M14.6 7.6l5.8 1"/><path d="M3.6 20.6c2.2-1.3 4.4-1.3 6.6 0s4.4 1.3 6.6 0 2.4-1 3.6-.6"/>'),
  star: tube('<path d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>'),
};
const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.4 8.4l3 3 6.2-6.6"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';

// ------------------------------------------------------------------------------------------------ the overlay manager
let scr = null, run = null, lastKey = '', sweepNext = false, sweptAt = 0;
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
}
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
  queueMicrotask(() => setState({ daily: null }));   // (not inside the render that called us)
}
/** THE ROOM WINS' banner: its own strip over the walk inside (~3.6 s) — never THE MESSAGE (the game start's own messages would replace it) */
export function banner() {
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
  const el = h(`section.screen.screen-in.dy-overlay.${cls}`, { role: 'dialog', 'aria-modal': 'true' });
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
  els.head = h('header.dy-head', backBtn('Back', () => closeAll()),
    h('h1.dy-sign', { 'aria-label': 'The dailies' }, h('span.dy-sign-t', 'THE DAILIES')));
  els.tabs = h('nav.dy-tabs', { role: 'tablist' },
    els.tToday = h('button.dy-tab', { type: 'button', role: 'tab', onclick: () => goScreen('today') }, 'TODAY'),
    els.tScores = h('button.dy-tab', { type: 'button', role: 'tab', onclick: () => goScreen('scores') }, 'SCORES'));
  els.body = h('div.dy-body');
  els.scroll = h('div.dy-scroll', els.head, els.tabs, els.body);
  O.el.append(els.scroll);

  const paint = async () => {
    if (gone) return;
    const t = today || { dailies: [] };
    await loadMetas(t.dailies || []);
    if (gone) return;
    // (a repaint only when something on screen changed — a tap never lands on a row that was just rebuilt)
    const sig = JSON.stringify([tab, t, names(), pidNow()]);
    if (sig === lastSig && !sweepNext) return;
    lastSig = sig;
    els.tToday.classList.toggle('is-on', tab === 'today'); els.tToday.setAttribute('aria-selected', String(tab === 'today'));
    els.tScores.classList.toggle('is-on', tab === 'scores'); els.tScores.setAttribute('aria-selected', String(tab === 'scores'));
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
    els.body.append(...[els.meter, h('div.dy-rows', ...rows),
      share, els.next].filter(Boolean));
    tickNext();
    if (sweepNext && sw.swept) { sweepNext = false; playSweep(); }
  }

  function ticketRow(t, d) {
    const st = rowState(t, d.id), row = dailyRow(d.id) || {};
    const art = h('span.dy-art', { html: TICKET_ART[d.ticket] || TICKET_ART[row.ticket] || TICKET_ART.star });
    let info, act;
    if (st === 'done') {
      // DONE: the result where the hook was (the score + YOUR TABLE's place, or the everyone line), a drawn check on the right
      const tb = tableFor(t, d.id, { names: names(), me: me(), better: d.better });
      const gated = !!(t.gated && t.gated[d.id]);
      const sub = gated ? COUNTS_FROM_TOMORROW : tb.line || everyoneLine(t.stand && t.stand[d.id]) || 'DONE FOR TODAY';
      info = h('div.dy-info', h('b.dy-name', d.name), h('span.dy-result', lineOf(d.id, t.mine[d.id])), h('small.dy-rank', sub));
      act = h('span.dy-check', { html: CHECK, role: 'img', 'aria-label': 'done' });
    } else info = h('div.dy-info', h('b.dy-name', d.name), h('span.dy-hook', d.hook || row.hook || row.tag || ''));
    if (st !== 'done') act = tubeButton(st === 'progress' ? 'RESUME' : 'PLAY', { kind: st === 'progress' ? 'secondary' : 'main', cls: 'dy-play', onClick: () => play(d.id) });
    return h(`div.dy-ticket.is-${st}`, { dataset: { id: d.id }, style: { '--tk0': themeInk(d.id) } }, h('div.dy-stub', art), info, h('div.dy-act', act));
  }

  function paintScores(t) {
    for (const d of t.dailies) {
      const tb = tableFor(t, d.id, { names: names(), me: me(), better: d.better });
      const mineDone = t.mine && t.mine[d.id] != null;
      const list = tb.rows.map(r => h(`div.dy-trow${r.me ? '.is-me' : ''}${r.waiting ? '.is-wait' : ''}`,
        h('span.dy-tplace', r.place ? ordinal(r.place) : ''),
        h('span.dy-tname', r.me ? `${r.name} (YOU)` : r.name),
        h('span.dy-tscore', r.score != null ? lineOf(d.id, r.score) : r.gated ? 'NOT COUNTED' : r.played ? 'PLAYED' : 'WAITING')));
      const solo = tb.rows.length <= 1;
      els.body.append(h('section.dy-sec', { style: { '--tk0': themeInk(d.id) } },
        h('h2.dy-sec-h', h('span.dy-sec-art', { html: TICKET_ART[d.ticket] || TICKET_ART.star }), d.name),
        h('h3.dy-sub', 'YOUR TABLE'),
        h('div.dy-table', ...list),
        solo ? h('p.dy-quiet', 'Add friends from a player’s name tag — their scores sit here.') : null,
        !mineDone && tb.rows.some(r => r.played) ? h('p.dy-quiet', 'Play it to see their scores.') : null,
        everyoneLine(t.stand && t.stand[d.id]) ? h('p.dy-every', everyoneLine(t.stand[d.id])) : null));
    }
  }

  const names = () => Object.fromEntries(((friends && friends.friends) || []).map(c => [c.pid, String(c.n || 'FRIEND').toUpperCase()]));
  const me = () => ({ pid: pidNow(), name: String((loadProfile() || {}).name || 'YOU').toUpperCase() });

  function tickNext() {
    clearInterval(clockT);
    const draw = () => { if (els.next && els.next.isConnected) { const t = serverNow(); els.next.textContent = `NEW DAILIES IN ${fmtCountdown(msToTurn(easternParts(t), t % 1000))}`; } };
    draw(); clockT = setInterval(draw, 1000);
  }
  function playSweep() {
    if (!els.meter) return;
    sweptAt = Date.now();
    els.meter.classList.remove('is-sweeping'); void els.meter.offsetWidth; els.meter.classList.add('is-sweeping');
    try { sfx('win'); } catch { /* polish */ }
  }

  const off = onToday(t => { today = t; paint(); });
  import('../profile/friends.js').then(F => F.loadFriends()).then(f => { friends = f; if (!gone) paint(); }).catch(() => {});
  paint();
  pidReady.then(() => { if (!gone) paint(); });
  loadToday({ fresh: true });
  return {
    setTab(t) { if (t !== tab) { tab = t; paint(); } },
    close() { gone = true; off(); clearInterval(clockT); O.close(); },
  };
}
let pidMod = null;
const pidNow = () => (pidMod ? pidMod.myPid() : null);
const pidReady = import('../profile/me.js').then(m => { pidMod = m; }).catch(() => {});
/** a daily's ink on the ticket (its theme accent) — THE PASSWORD pink, COAST CLEAR cyan, else the house pink */
const themeInk = id => ({ password: '#ff5ec4', coastclear: '#5fe1ff' })[id] || '#ff6fc8';

/** PLAY / RESUME: a profile first (the dailies are official — /api counts them), then the run */
async function play(id) {
  sfx('select');
  if (!pidNow()) {
    const p = loadProfile();
    if (!p || !p.name) { setState({ daily: null, view: 'setup', setupMode: 'edit' }); return; }
    try { const m = await import('../profile/me.js'); pidMod = m; await m.syncMe(); } catch { /* the run says so */ }
  }
  setState({ daily: { v: 'run', id } });
}

// ------------------------------------------------------------------------------------------------ SHARE TODAY
async function shareToday(t) {
  try { const m = await import('../daily/share-today.js'); await m.shareToday(t, lineOf); } catch (e) { console.warn('[daily share]', e); }
}

// ------------------------------------------------------------------------------------------------ A RUN (+ its lesson)
function openRun(id) {
  const O = overlay('dy-run', () => goScreen());
  const row = dailyRow(id) || {};
  let view = null, mod = null, inner = null, gone = false, done = false, day = null;
  const stage = h('div.screen.screen-in.dy-stage');   // (a .screen: the game's view retokens .screen.<id>-screen)
  const back = backBtn('Back to the dailies', () => goScreen());
  O.el.append(stage, back);
  document.body.dataset.theme = row.theme || id;
  (async () => {
    const reg = await import('../games/registry.js');
    mod = await reg.loadGame(id);
    if (gone) return;
    const t = todayNow() || (await loadToday());
    if (gone) return;
    if (row.lesson && typeof mod.createLesson === 'function' && !(t && t.lessons && t.lessons[id]) && !(heldRun() && heldRun().id === id)
      && !(t && t.started && t.started[id])) {
      await lesson();
      if (gone) return;
    }
    mount();
  })().catch(e => { console.warn('[daily run]', e); if (!gone) stage.append(h('p.dy-quiet.dy-fail', 'The daily couldn’t open. Check your signal and try again.')); });

  /** the first-time lesson (never scored, never the day's board) → seen once per player (the server keeps it) */
  function lesson() {
    return new Promise(res => {
      const L = mod.createLesson({
        onDone: () => {
          L.unmount(); clear(stage); markLesson(id);
          import('../profile/api.js').then(a => a.api('daily', { action: 'lesson', game: id })).catch(() => {});
          res();
        },
      });
      L.mount(stage);
    });
  }
  function mount() {
    clear(stage);
    if (heldRun() && heldRun().id === id) dropHeld();     // (THE ROOM WINS: back in the run — the chip's job is done)
    inner = mod.createApiJudge ? mod.createApiJudge() : null;
    const judge = inner && wrapJudge(inner);
    const uid = state.uid || 'me', now = serverNow(), dk = streakDay(now);
    const game = mod.daily.create({ date: dk, uid, now, daySet: { v: 1, day: dk } });
    const players = { [uid]: { name: (loadProfile() || {}).name || 'YOU', color: (loadProfile() || {}).color || 'cyan', avatar: (loadProfile() || {}).avatar || 'bolt' } };
    view = mod.createView();
    view.mount(stage, { uid, game, players, meta: { status: 'playing' }, ...(judge ? { judge } : {}) });
  }
  /** the cartridge's API judge, heard: the start (IN PROGRESS), the finish (the score in at once, THE SWEEP moment, counts-from-tomorrow) */
  function wrapJudge(j) {
    const w = Object.create(j);
    w.start = async () => { const r = await j.start(); day = r.day || day; if (r.done != null) done = true; else markStarted(id); return r; };
    w.finish = async () => {
      const r = await j.finish();
      done = true;
      markFinished(id, r.score, r);
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
    pause(code) { if (inner && typeof inner.pause === 'function') inner.pause(code).catch(() => {}); },
    close() {
      gone = true; timers.forEach(clearTimeout);
      try { if (view) view.unmount(); } catch (e) { console.warn('[daily run] unmount', e); }
      if (document.body.dataset.theme === (row.theme || id)) document.body.dataset.theme = '';
      O.close();
    },
  };
}
// (test hook: the screens' state)
if (typeof window !== 'undefined') window.__daily2 = { syncDaily, state: () => ({ screen: !!scr, run: run ? run.id : null, key: lastKey }), sweptAt: () => sweptAt, heldRun, setSweepNext: v => { sweepNext = !!v; } };
