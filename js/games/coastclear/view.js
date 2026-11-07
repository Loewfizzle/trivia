// COAST CLEAR — THE SCREEN (CC1 — docs/coastclear.md "The screen"). Renders purely from the RUN the server hands back (judge.start → the
// opening + the record so far; every dig / chord answer folded in with logic.js#foldAnswer): the sign, the status row (the TIME in plain neon
// type, THREE drawn searchlights — lit = spotted —, a drawn buoy + the buoys left), the 9 × 12 harbor, the DIG / BUOY switch in the thumb zone.
// THE INSTANT FEEL: a tap presses the tile down AT ONCE (+ a soft pending shimmer) and its request fires at once — taps never wait for each
// other (pipelined; the answers fold in in any order); the number pops in the moment its answer lands; a flood ripples outward from the
// tapped cell; buoys are the phone's own (instant, kept per device for the day). A dropped connection → the answers retry; a quiet
// RECONNECTING line only past ~2 s. The clock = SERVER time (the start's + every answer's `now`), the pauses stopped, + 30 s a spot.
//   createView() → { mount(el, state), update(state), unmount() }   state.game = the run shell (daily.create / start) · state.judge = a judge
//   (the preview's fake; default THE API JUDGE — judge.js) · window.__coastclear = the test hook (the preview + the E2E)
import { h, clear, reducedMotion } from '../../ui/dom.js';
import { foldAnswer, emptyView, clockMs, fmtClock, buoysLeft, chordTargets, nbOf, MAX_SPOTS, W, H, LIGHTS, SPOT_S } from './logic.js';
import { createApiJudge } from './judge.js';

export const LONG_MS = 380;           // a long-press = a buoy (in DIG mode)
export const RIPPLE_MS = 30;          // the flood: one ring outward every 30 ms
export const SLOW_MS = 2000;          // an answer this late → the quiet RECONNECTING line
const MOVE_PX = 12;                   // a finger that slides this far is not a tap

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (vb, cls, inner) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); s.innerHTML = inner; return s; };
/** THE BUOY (drawn): a round orange float with a white band, a little lamp on top + its halo (a faint wide circle — no filter) */
const BUOY = '<circle class="cc-bu-halo" cx="12" cy="7" r="5.5"/><path class="cc-bu-mast" d="M12 3.5V9"/><circle class="cc-bu-lamp" cx="12" cy="4.6" r="1.7"/>'
  + '<path class="cc-bu-body" d="M4.5 17.2 C5 11.4 8.4 9 12 9 C15.6 9 19 11.4 19.5 17.2 Z"/><path class="cc-bu-band" d="M6.1 13.4 H17.9"/><path class="cc-bu-wl" d="M3 19.6 Q7.5 18 12 19.6 T21 19.6"/>';
/** THE SEARCHLIGHT (drawn): a lamp on a short stand, its beam a cone to the upper right */
const LAMP = '<path class="cc-sl-beam" d="M13.5 9.5 L31 1.5 L31 14.5 L14.5 13.5 Z"/><circle class="cc-sl-head" cx="10" cy="11.5" r="4.6"/><circle class="cc-sl-lens" cx="11.4" cy="11.2" r="2"/><path class="cc-sl-stand" d="M10 16 V21 M6.5 21.5 H13.5"/>';
/** the spotted cell's light: a gold lamp face + its rays */
const BURST = '<g class="cc-lt-rays"><path d="M12 1.5V5 M12 19V22.5 M1.5 12H5 M19 12H22.5 M4.6 4.6L7 7 M17 17L19.4 19.4 M19.4 4.6L17 7 M7 17L4.6 19.4"/></g><circle class="cc-lt-glow" cx="12" cy="12" r="7.5"/><circle class="cc-lt-core" cx="12" cy="12" r="4.4"/>';
/** DIG = a sounding probe: a ring with its centre dot + four ticks (where the tap lands) */
const RIPPLE = '<circle cx="12" cy="12" r="2.2"/><path d="M12 4.5 A7.5 7.5 0 1 1 11.99 4.5 Z M12 1.5 V4.2 M12 19.8 V22.5 M1.5 12 H4.2 M19.8 12 H22.5"/>';

export function createView() {
  let root = null, st = null, judge = null, gone = false;
  let view = emptyView(), om = new Map(), ls = new Set(), ready = false, mode = 'dig', day = null, doneScore = null, finished = null, ended = false;
  let buoys = new Set(), pending = new Set(), inflight = new Map(), seq = 0, offset = 0, bestRtt = Infinity, net = false;
  let timers = [], tickT = 0, netT = 0, press = null;
  const rtts = [];
  const els = {}, cells = [];
  const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); if (!gone) fn(); }, ms); timers.push(t); return t; };
  const wait = ms => new Promise(res => later(res, ms));
  const serverNow = () => Date.now() + offset;
  /** the view + its two lookups (the opened cells, the spotted lights) — always replaced together, never mutated */
  const setView = v => { view = v; om = new Map(v.open); ls = new Set(v.lit); };

  function build() {
    els.sign = h('h1.cc-sign', 'COAST CLEAR');
    els.time = h('span.cc-time', '0:00');
    els.plus = h('span.cc-plus', { 'aria-hidden': 'true' }, `+${SPOT_S}`);
    els.spots = Array.from({ length: MAX_SPOTS }, () => svg('0 0 32 24', 'cc-spot', LAMP));
    els.left = h('span.cc-left', String(LIGHTS));
    els.status = h('div.cc-status', { role: 'status' },
      h('div.cc-st-time', els.time, els.plus),
      h('div.cc-st-spots', { 'aria-label': 'spotted' }, ...els.spots),
      h('div.cc-st-buoys', svg('0 0 24 24', 'cc-st-buoy', BUOY), els.left));
    els.board = h('div.cc-board', { role: 'grid', 'aria-label': 'the harbor' });
    els.board.style.setProperty('--cc-cols', String(view.w || W));
    els.water = h('div.cc-water', { 'aria-hidden': 'true' });
    els.board.append(els.water);
    for (let i = 0; i < (view.w || W) * (view.h || H); i++) {
      const c = h('div.cc-cell', { role: 'gridcell', 'data-i': String(i) }, h('span.cc-n'));
      cells.push(c); els.board.append(c);
    }
    els.note = h('div.cc-note', { role: 'status', 'aria-live': 'polite' });
    els.dig = h('button.cc-mode-b', { type: 'button', 'data-m': 'dig', onclick: () => setMode('dig') }, svg('0 0 24 24', 'cc-mode-i cc-mode-dig', RIPPLE), h('span', 'DIG'));
    els.buoy = h('button.cc-mode-b', { type: 'button', 'data-m': 'buoy', onclick: () => setMode('buoy') }, svg('0 0 24 24', 'cc-mode-i cc-mode-buoy', BUOY), h('span', 'BUOY'));
    els.mode = h('div.cc-mode', { role: 'radiogroup', 'aria-label': 'what a tap does' }, els.dig, els.buoy);
    els.end = h('div.cc-end', { hidden: true });
    els.play = h('div.cc-play', els.status, els.board);
    root.classList.add('cc-screen');
    root.append(h('header.cc-head', els.sign), els.play, els.note, els.mode, els.end);
    els.board.addEventListener('pointerdown', onDown);
    els.board.addEventListener('pointermove', onMove);
    els.board.addEventListener('pointerup', onUp);
    els.board.addEventListener('pointercancel', onCancel);
    els.board.addEventListener('contextmenu', e => e.preventDefault());
    setMode(mode);
  }

  // ---- painting ----------------------------------------------------------------------------------------------------------------------
  /** one cell from the view (opts.delay: the ripple's wait before it pops; opts.pop: animate it in) */
  function paintCell(i, { pop = false, delay = 0, burst = false } = {}) {
    const c = cells[i];
    if (!c) return;
    const n = om.get(i), lit = ls.has(i), b = buoys.has(i) && n == null && !lit;
    c.classList.toggle('is-open', n != null);
    c.classList.toggle('is-lit', lit);
    c.classList.toggle('is-buoy', b);
    c.classList.toggle('is-wait', pending.has(i) && n == null && !lit);
    if (!(pending.has(i) && n == null && !lit) && press?.i !== i) c.classList.remove('is-press');
    c.dataset.n = n != null ? String(n) : '';
    const num = c.firstChild;
    num.textContent = n > 0 ? String(n) : '';
    // the buoy + the light are drawn objects inside the cell (made on demand, kept)
    let bu = c.querySelector('.cc-buoy');
    if (b && !bu) { bu = svg('0 0 24 24', 'cc-buoy', BUOY); c.append(bu); }
    if (!b && bu) bu.remove();
    let lt = c.querySelector('.cc-light');
    if (lit && !lt) { lt = svg('0 0 24 24', 'cc-light', BURST); c.append(lt); if (burst && !reducedMotion()) { const ring = h('i.cc-ring'); c.append(ring); later(() => ring.remove(), 900); } }
    if (pop && !reducedMotion()) {
      c.style.setProperty('--d', `${delay}ms`);
      c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop');
      later(() => c.classList.remove('is-pop'), delay + 420);
    }
    c.setAttribute('aria-label', lit ? 'a searchlight' : n != null ? (n ? `${n}` : 'calm water') : b ? 'a buoy' : 'water');
  }
  function paintAll() { for (let i = 0; i < cells.length; i++) paintCell(i); paintStatus(); }
  function paintStatus() {
    els.spots.forEach((s, k) => s.classList.toggle('is-on', k < view.spots));
    els.left.textContent = String(Math.max(0, buoysLeft(view, [...buoys].filter(i => !om.has(i) && !ls.has(i)).length)));
    paintTime();
  }
  function paintTime() { els.time.textContent = fmtClock(ready ? clockMs(view, serverNow()) : 0); }
  function setMode(m) {
    mode = m === 'buoy' ? 'buoy' : 'dig';
    for (const b of [els.dig, els.buoy]) { const on = b.dataset.m === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); b.setAttribute('role', 'radio'); }
    if (root) root.dataset.mode = mode;
  }
  function plus() {
    if (reducedMotion()) return;
    els.plus.classList.remove('is-on'); void els.plus.offsetWidth; els.plus.classList.add('is-on');
  }
  const ring = (a, b) => Math.max(Math.abs((a % view.w) - (b % view.w)), Math.abs(Math.floor(a / view.w) - Math.floor(b / view.w)));

  // ---- the network: every move fires AT ONCE; a lost answer retries (a repeat is free on the server) ----------------------------------
  function sample(resp, d0, d1) {
    const rtt = d1 - d0;
    rtts.push(rtt); if (rtts.length > 400) rtts.shift();
    if (resp && typeof resp.now === 'number' && rtt <= bestRtt) { bestRtt = rtt; offset = resp.now - (d0 + d1) / 2; }
  }
  function watchNet() {
    const slow = [...inflight.values()].some(t => Date.now() - t >= SLOW_MS);
    if (slow !== net) { net = slow; els.note.textContent = slow ? 'RECONNECTING' : ''; els.note.classList.toggle('is-on', slow); }
    clearInterval(netT);
    if (inflight.size) netT = setInterval(() => { if (gone) clearInterval(netT); else watchNet(); }, 400);
  }
  const retryable = e => !e || e.status === 0 || e.status >= 500 || e.code === 'offline' || e.code === 'http';
  async function send(fn, cellsOf, origin) {
    const id = ++seq;
    inflight.set(id, Date.now()); watchNet();
    for (let tries = 0; !gone; tries++) {
      const d0 = Date.now();
      try {
        const resp = await fn();
        if (gone) return;
        sample(resp, d0, Date.now());
        inflight.delete(id); watchNet();
        land(resp, origin, cellsOf);
        return;
      } catch (e) {
        if (gone) return;
        if (retryable(e)) { await wait(Math.min(1500, 250 * 2 ** Math.min(tries, 3))); continue; }
        inflight.delete(id); watchNet();
        for (const c of cellsOf) { pending.delete(c); paintCell(c); }
        resync();   // out of step (finished, a refused chord, a cell the server says is shut): the server's record is the truth
        return;
      }
    }
  }
  /** an answer lands: the opened cells pop in (a ripple outward from the tapped cell), a light bursts + the +30 flash */
  function land(resp, origin, cellsOf) {
    const before = om, litBefore = ls;
    const wasDone = view.done;
    setView(foldAnswer(view, resp));
    for (const c of cellsOf) pending.delete(c);
    let far = 0;
    for (const [c] of resp.cells || []) {
      if (before.has(c)) { paintCell(c); continue; }
      buoys.delete(c);
      const d = reducedMotion() ? 0 : Math.min(14, ring(c, origin)) * RIPPLE_MS;
      far = Math.max(far, d);
      paintCell(c, { pop: true, delay: d });
    }
    let spotted = false;
    for (const c of resp.lit || []) if (!litBefore.has(c)) { buoys.delete(c); paintCell(c, { burst: true }); spotted = true; }
    for (const c of cellsOf) paintCell(c);
    if (spotted) plus();
    paintStatus(); saveBuoys();
    if (view.done && !wasDone) later(() => end(false), far + (spotted ? 700 : 450));
  }

  // ---- the moves ---------------------------------------------------------------------------------------------------------------------
  function tap(i) {
    if (!ready || view.done || ended || i == null) return;
    if (ls.has(i)) return;
    if (om.has(i)) { chord(i); return; }
    if (pending.has(i)) return;
    if (mode === 'buoy') { toggleBuoy(i); return; }
    if (buoys.has(i)) return;                              // a tap on a buoyed cell does nothing
    pending.add(i); paintCell(i);
    send(() => judge.dig(i), [i], i);
  }
  function chord(i) {
    const t = chordTargets(view, i, buoys);
    if (!t || t.some(j => pending.has(j))) { nudge(i); return; }
    const nb = nbOf(view.w, view.h)[i].filter(j => buoys.has(j));
    for (const j of t) { pending.add(j); paintCell(j); }
    send(() => judge.chord(i, nb), t, i);
  }
  function toggleBuoy(i) {
    if (!ready || view.done || ended) return;
    if (om.has(i) || ls.has(i) || pending.has(i)) return;
    if (buoys.has(i)) buoys.delete(i); else buoys.add(i);
    paintCell(i);
    const bu = cells[i].querySelector('.cc-buoy');
    if (bu && !reducedMotion()) { bu.classList.remove('is-new'); void bu.offsetWidth; bu.classList.add('is-new'); }
    paintStatus(); saveBuoys();
  }
  function nudge(i) {
    const c = cells[i];
    if (!c || reducedMotion()) return;
    c.classList.remove('is-nudge'); void c.offsetWidth; c.classList.add('is-nudge');
    later(() => c.classList.remove('is-nudge'), 400);
  }

  // ---- the finger: press at once; a long press = a buoy; a slide = nothing --------------------------------------------------------
  const cellAt = e => { const c = e.target && e.target.closest ? e.target.closest('.cc-cell') : null; return c ? Number(c.dataset.i) : null; };
  function onDown(e) {
    if (e.button > 0) return;
    const i = cellAt(e);
    if (i == null || !ready || view.done) return;
    cancelPress();
    const c = cells[i];
    const diggable = !om.has(i) && !ls.has(i);
    if (diggable && !pending.has(i)) c.classList.add('is-press');
    press = { i, x: e.clientX, y: e.clientY, id: e.pointerId, done: false, t: setTimeout(() => {
      if (!press || press.i !== i) return;
      press.done = true;
      if (diggable && !pending.has(i)) { toggleBuoy(i); try { navigator.vibrate && navigator.vibrate(12); } catch { /* fine */ } }
      c.classList.remove('is-press');
    }, LONG_MS) };
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_PX) cancelPress();
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const p = press; press = null;
    clearTimeout(p.t);
    if (!p.done) tap(p.i);
    if (!pending.has(p.i)) cells[p.i].classList.remove('is-press');
  }
  function onCancel() { cancelPress(); }
  function cancelPress() {
    if (!press) return;
    clearTimeout(press.t);
    const i = press.i; press = null;
    if (!pending.has(i)) cells[i].classList.remove('is-press');
  }

  // ---- buoys: the phone's own, kept per device for the day -------------------------------------------------------------------------
  const buoyKey = () => `cc:buoys:${day || 'today'}:${(st && st.uid) || ''}`;
  function saveBuoys() { try { localStorage.setItem(buoyKey(), [...buoys].join(',')); } catch { /* fine */ } }
  function loadBuoys() { try { const s = localStorage.getItem(buoyKey()); buoys = new Set(s ? s.split(',').map(Number).filter(Number.isInteger) : []); } catch { buoys = new Set(); } }

  // ---- the run from the server (a mount, a resume, an out-of-step answer) --------------------------------------------------------
  async function resync() {
    let r;
    const d0 = Date.now();
    try { r = await judge.start(); } catch (e) {
      if (gone) return false;
      if (retryable(e)) { els.note.textContent = 'RECONNECTING'; els.note.classList.add('is-on'); await wait(1500); return resync(); }
      return false;
    }
    if (gone) return false;
    sample(r, d0, Date.now());
    els.note.textContent = ''; els.note.classList.remove('is-on'); net = false;
    const first = !ready;
    day = r.day || day;
    doneScore = r.done != null ? r.done : null;
    if (doneScore != null) finished = 'RECORDED';
    setView({ ...emptyView(), ...r.run, startedAt: (r.run && r.run.startedAt) || r.startedAt });
    if (first) loadBuoys();
    for (const i of [...buoys]) if (om.has(i) || ls.has(i)) buoys.delete(i);
    pending = new Set([...pending].filter(i => !om.has(i) && !ls.has(i)));
    ready = true;
    if (root) root.dataset.ready = '1';
    paintAll();
    // the first mount of a fresh run: the opening ripples open from its heart (the server lists it from there)
    if (first && !reducedMotion() && view.open.length && view.open.length <= 20 && !view.lit.length && !view.done) {
      const o = view.open[0][0];
      for (const [c] of view.open) paintCell(c, { pop: true, delay: Math.min(14, ring(c, o)) * RIPPLE_MS });
    }
    // back on the screen after a pause (the room played a game): the clock goes on
    if (view.paused && !view.done) {
      try { const p = await judge.resume(); if (!gone && p) { setView({ ...view, paused: !!p.paused, pausedMs: p.pausedMs ?? view.pausedMs, pauses: p.pauses ?? view.pauses, pausedAt: null }); paintStatus(); } } catch { /* the next move resumes it too */ }
    }
    if (view.done) end(true);
    return true;
  }

  // ---- THE END (CC1: a simple placeholder — the lighthouse win, the caught screen + the share are CC2) -----------------------------
  function end(still) {
    if (ended) { paintEnd(); return; }
    ended = true;
    root.classList.add('is-end');
    // a CLEAR: every cell still shut must be a light — the phone buoys them all (deduced, never told)
    if (view.out === 'clear') { for (let i = 0; i < cells.length; i++) if (!om.has(i) && !ls.has(i)) buoys.add(i); paintAll(); saveBuoys(); }
    paintEnd();
    els.end.hidden = false;
    if (still || reducedMotion()) els.end.classList.add('is-in');
    else requestAnimationFrame(() => requestAnimationFrame(() => els.end.classList.add('is-in')));
    if (doneScore == null) record();
  }
  function paintEnd() {
    clear(els.end);
    const clean = view.out === 'clear';
    const ms = clockMs(view, serverNow());
    const bits = [`${view.spots} ${view.spots === 1 ? 'SPOT' : 'SPOTS'}`];
    if (view.pauses) bits.push(`${view.pauses} ${view.pauses === 1 ? 'PAUSE' : 'PAUSES'}`);
    els.end.dataset.out = view.out || '';
    const parts = [h('div.cc-end-t', clean ? 'COAST CLEAR' : 'CAUGHT')];
    if (clean) parts.push(h('div.cc-end-n', fmtClock(ms)));
    parts.push(h('div.cc-end-line', clean ? bits.join(' · ') : `${fmtClock(ms)} · THE THIRD LIGHT FOUND YOU`));
    if (finished === 'FAILED') parts.push(h('div.cc-end-rec', 'NOT RECORDED · NO SIGNAL'));
    els.end.append(...parts);
  }
  async function record() {
    for (let tries = 0; tries < 4 && !gone; tries++) {
      try { const f = await judge.finish(); if (gone) return; doneScore = f.score; finished = 'RECORDED'; paintEnd(); return; } catch (e) {
        if (!retryable(e)) break;
        await wait(800 * (tries + 1));
      }
    }
    if (!gone && doneScore == null) { finished = 'FAILED'; paintEnd(); }
  }

  const api = {
    mount(el, state) {
      root = el; st = state; gone = false;
      judge = (state && state.judge) || createApiJudge();
      const g = state && state.game;
      if (g && g.run) setView({ ...emptyView(), ...g.run });
      build();
      paintAll();
      tickT = setInterval(() => { if (gone) clearInterval(tickT); else if (ready) paintTime(); }, 250);
      resync();
      window.__coastclear = {
        view: () => view, buoys: () => [...buoys], pending: () => [...pending], mode: () => mode, ready: () => ready, finished: () => finished, score: () => doneScore,
        setMode, tap, long: i => toggleBuoy(i), resync, rtts: () => rtts.slice(), offset: () => offset, inflight: () => inflight.size,
        state: () => ({ ready, done: view.done, out: view.out, spots: view.spots, open: view.open.length, lit: view.lit.length, buoys: buoys.size, pending: pending.size, inflight: inflight.size, mode, note: els.note.textContent, end: ended && els.end.classList.contains('is-in'), clock: els.time.textContent, paused: !!view.paused, pauses: view.pauses }),
      };
    },
    update(state) { st = state; },
    unmount() {
      gone = true;
      for (const t of timers) clearTimeout(t);
      timers = [];
      clearInterval(tickT); clearInterval(netT);
      if (press) clearTimeout(press.t);
      if (root) { clear(root); root.classList.remove('cc-screen', 'is-end'); delete root.dataset.ready; delete root.dataset.mode; }
      delete window.__coastclear;
      root = null; cells.length = 0; press = null; pending = new Set(); inflight = new Map();
    },
  };
  return api;
}
