// COAST CLEAR — THE SCREEN (CC1 + CC2 — docs/coastclear.md "The screen"). Renders purely from the RUN the server hands back (judge.start → the
// opening + the record so far; every dig / chord answer folded in with logic.js#foldAnswer): the sign, the status row (the TIME in plain neon
// type, THREE drawn searchlights — lit = spotted —, a drawn buoy + the buoys left), the 9 × 12 harbor, the DIG / BUOY switch in the thumb zone.
// THE INSTANT FEEL: a tap presses the tile down AT ONCE (+ a soft pending shimmer) and its request fires at once; the number pops in the moment
// its answer lands; a flood ripples outward from the tapped cell; buoys are the phone's own (instant, kept per device for the day). DFIX3 —
// COALESCED MOVES: taps made while an answer is in flight QUEUE and go out TOGETHER in the next call (judge.moves — one invocation answers several
// cells; nothing waits on purpose: the first tap always fires at once; the answers fold in in order). A dropped connection → the call retries (a
// repeat is free on the server); a quiet RECONNECTING line only past ~2 s. The clock = SERVER time (the start's + every answer's `now`), the
// pauses stopped, + 30 s a spot. `&debug=1` logs every tap → number time + the server's Server-Timing phases (the hook: __coastclear.taps()).
// CC2: GETTING SPOTTED (a white searchlight BEAM sweeps in from off-screen and lands on the cell — the gold burst, the siren blip, "+30 s"
// floating up, a status lamp lights; play never stops) · CAUGHT (three beams converge on the last cell, one red pulse, the firmer siren) ·
// THE END SCREENS (the board + the switch leave: COAST CLEAR with the lighthouse sweep · CAUGHT in red; the finished harbor shrunk; SHARE;
// NEXT HARBOR IN) · THE DAY LOOK (css/coastclear.css retokens under body[data-look] — the game draws no switch, it re-themes live) · the sounds.
//   createView() → { mount(el, state), update(state), unmount() }   state.game = the run shell (daily.create / start) · state.judge = a judge
//   (the preview's fake; default THE API JUDGE — judge.js) · window.__coastclear = the test hook (the preview + the E2E)
import { h, clear, reducedMotion } from '../../ui/dom.js';
import { foldAnswer, emptyView, clockMs, fmtClock, buoysLeft, chordTargets, nbOf, headline, endLine, finalMs, endMap, shareLine, shareInputs, MAX_SPOTS, W, H, LIGHTS, SPOT_S } from './logic.js';
import { retryable, recordFinish, tickTurn, endActions, shareOrLine, NOT_RECORDED } from '../../daily/end.js';
import { runDayKey } from '../../daily/clock.js';
import { createApiJudge } from './judge.js';
import { ccSfx, ccSfxBytes } from './sfx.js';

export const LONG_MS = 380;           // a long-press = a buoy (in DIG mode)
export const RIPPLE_MS = 30;          // the flood: one ring outward every 30 ms
export const SLOW_MS = 2000;          // an answer this late → the quiet RECONNECTING line
// CC2 — GETTING SPOTTED's beats: the beam's sweep in (it lands on the cell), its hold on the cell, its fade; CAUGHT's converge + pulse
export const SWEEP = Object.freeze({ travel: 700, hold: 280, fade: 420, stagger: 90, pulse: 620, caughtEnd: 1500 });
export const LEAVE_MS = 320;          // the board + the switch animate out before the end screen comes in
export const MAX_BATCH = 12;          // DFIX3 — the most queued taps one coalesced call carries (api/daily.js#MAX_BATCH)
const MOVE_PX = 12;                   // a finger that slides this far is not a tap

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (vb, cls, inner) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); s.innerHTML = inner; return s; };
/** THE BUOY (drawn): a round float with a white band (+ a second band by day: red-and-white stripes), a little lamp on top + its halo */
const BUOY = '<circle class="cc-bu-halo" cx="12" cy="7" r="5.5"/><path class="cc-bu-mast" d="M12 3.5V9"/><circle class="cc-bu-lamp" cx="12" cy="4.6" r="1.7"/>'
  + '<path class="cc-bu-body" d="M4.5 17.2 C5 11.4 8.4 9 12 9 C15.6 9 19 11.4 19.5 17.2 Z"/><path class="cc-bu-band" d="M6.1 13.4 H17.9"/><path class="cc-bu-band2" d="M8.4 10.6 H15.6 M4.9 16.1 H19.1"/><path class="cc-bu-wl" d="M3 19.6 Q7.5 18 12 19.6 T21 19.6"/>';
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
  let queue = [], flying = false, calls = 0;   // DFIX3 — the taps waiting for the next call; one coalesced call in flight at a time; the calls made
  const taps = [];                             // the dev-only timing: { cell, ms: the tap → its number on screen, server: Server-Timing's phases }
  let timers = [], tickT = 0, netT = 0, clockT = 0, press = null;
  const landing = new Set();      // CC2: lights the server has named whose beam is still on its way (painted lit when it lands)
  let beams = 0;                  // beams in flight (the hook + the E2E)
  const rtts = [];
  const els = {}, cells = [];
  const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); if (!gone) fn(); }, ms); timers.push(t); return t; };
  const wait = ms => new Promise(res => later(res, ms));
  const serverNow = () => Date.now() + offset;
  /** the view + its two lookups (the opened cells, the spotted lights) — always replaced together, never mutated */
  const setView = v => { view = v; om = new Map(v.open); ls = new Set(v.lit); };
  /** the spots the screen SHOWS (a light whose beam hasn't landed yet isn't counted on screen — the clock + the lamps jump when it lands) */
  const shownSpots = () => Math.max(0, view.spots - [...landing].filter(c => ls.has(c)).length);

  function build() {
    els.sign = h('h1.cc-sign', h('span.cc-sign-t', 'COAST CLEAR'), h('span.cc-sign-dot', { 'aria-hidden': 'true' }, '.'));
    els.head = h('header.cc-head', els.sign);
    els.time = h('span.cc-time', '0:00');
    els.spots = Array.from({ length: MAX_SPOTS }, () => svg('0 0 32 24', 'cc-spot', LAMP));
    els.left = h('span.cc-left', String(LIGHTS));
    els.status = h('div.cc-status', { role: 'status' },
      h('div.cc-st-time', els.time),
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
    // DFIX3 — THE ONE-TIME HINT (state.hint — the DAILY screen hands it in on a player's first COAST CLEAR): one calm line under the board, gone
    // once the first dig reveals a number (the run host then marks it seen on the server — never again, any device)
    els.hint = h('p.cc-hint', { hidden: !(st && st.hint) }, st && st.hint ? String(st.hint) : '');
    els.dig = h('button.cc-mode-b', { type: 'button', 'data-m': 'dig', onclick: () => pickMode('dig') }, svg('0 0 24 24', 'cc-mode-i cc-mode-dig', RIPPLE), h('span', 'DIG'));
    els.buoy = h('button.cc-mode-b', { type: 'button', 'data-m': 'buoy', onclick: () => pickMode('buoy') }, svg('0 0 24 24', 'cc-mode-i cc-mode-buoy', BUOY), h('span', 'BUOY'));
    els.mode = h('div.cc-mode', { role: 'radiogroup', 'aria-label': 'what a tap does' }, els.dig, els.buoy);
    els.end = h('div.cc-end', { role: 'dialog', 'aria-label': 'the result', hidden: true });
    els.play = h('div.cc-play', els.status, els.board);
    // the light show's own layer over everything (the beams, the pools, the "+30 s", the red pulse) — never takes a tap
    els.fx = h('div.cc-fx', { 'aria-hidden': 'true' });
    els.red = h('i.cc-red');
    els.fx.append(els.red);
    root.classList.add('cc-screen');
    els.play.append(els.hint);   // (right under the board — it moves with it)
    root.append(els.head, els.play, els.note, els.mode, els.end, els.fx);
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
    const n = om.get(i), coming = landing.has(i), lit = ls.has(i) && !coming, b = buoys.has(i) && n == null && !ls.has(i);
    const waiting = (pending.has(i) && n == null && !ls.has(i)) || coming;
    c.classList.toggle('is-open', n != null);
    c.classList.toggle('is-lit', lit);
    c.classList.toggle('is-buoy', b);
    c.classList.toggle('is-wait', waiting);
    if (!waiting && press?.i !== i) c.classList.remove('is-press');
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
    const shown = shownSpots();
    els.spots.forEach((s, k) => s.classList.toggle('is-on', k < shown));
    els.left.textContent = String(Math.max(0, buoysLeft(view, [...buoys].filter(i => !om.has(i) && !ls.has(i)).length)));
    paintTime();
  }
  function paintTime() { els.time.textContent = fmtClock(ready ? clockMs({ ...view, spots: shownSpots() }, serverNow()) : 0); }
  function setMode(m) {
    mode = m === 'buoy' ? 'buoy' : 'dig';
    for (const b of [els.dig, els.buoy]) { const on = b.dataset.m === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); b.setAttribute('role', 'radio'); }
    if (root) root.dataset.mode = mode;
  }
  /** the player flips the switch (the click: a sound) */
  function pickMode(m) { if (m !== mode) ccSfx('mode'); setMode(m); }
  const ring = (a, b) => Math.max(Math.abs((a % view.w) - (b % view.w)), Math.abs(Math.floor(a / view.w) - Math.floor(b / view.w)));

  // ---- CC2: GETTING SPOTTED — the beam sweeps in from off-screen and lands on the cell ---------------------------------------------
  /** where a cell's centre is, in the screen's own px (read ONCE per beam — never in a frame loop) */
  function spotGeo(i) {
    const r = root.getBoundingClientRect(), c = cells[i].getBoundingClientRect();
    return { W: r.width, H: r.height, x: c.left - r.left + c.width / 2, y: c.top - r.top + c.height / 2, s: c.width };
  }
  /**
   * ONE BEAM: a long soft cone pivoting on an off-screen lamp at `from` ({ x, y } in screen px) that sweeps in (`swing` degrees short of the
   * cell) and lands on the cell's centre, holds, fades. transform + opacity only (WAAPI on the compositor); resolves when it LANDS.
   */
  function beam(g, from, { delay = 0, swing = 38, travel = SWEEP.travel } = {}) {
    const dx = g.x - from.x, dy = g.y - from.y;
    const len = Math.hypot(dx, dy) + g.s * 0.9, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const spread = g.s * 3.2;
    const start = ang + (from.x > g.W / 2 ? swing : -swing) * (from.y > g.H ? -1 : 1);
    const el = h('i.cc-beam', { style: { left: `${from.x}px`, top: `${from.y - spread / 2}px`, width: `${len}px`, height: `${spread}px` } }, h('i.cc-beam-l', h('i.cc-beam-h')));
    els.fx.append(el);
    beams++;
    const light = el.firstChild;
    el.animate([{ transform: `rotate(${start}deg)` }, { transform: `rotate(${ang}deg)` }], { duration: travel, delay, easing: 'cubic-bezier(0.33, 0.05, 0.22, 1)', fill: 'both' });
    light.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1 }], { duration: travel, delay, easing: 'linear', fill: 'both' });
    return new Promise(res => later(() => {
      light.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SWEEP.fade, delay: SWEEP.hold, easing: 'ease-out', fill: 'both' });
      later(() => { el.remove(); beams--; }, SWEEP.hold + SWEEP.fade + 40);
      res();
    }, delay + travel));
  }
  /** the pool of light on the cell + "+30 s" floating up from it (when the beam lands) */
  function landFx(g, caught) {
    const pool = h('i.cc-pool', { style: { left: `${g.x}px`, top: `${g.y}px`, width: `${g.s * 2.6}px`, height: `${g.s * 2.6}px` } });
    els.fx.append(pool);
    pool.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.4)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.35 }, { opacity: 0, transform: 'translate(-50%, -50%) scale(1.15)' }], { duration: SWEEP.hold + SWEEP.fade + 200, easing: 'ease-out', fill: 'both' });
    later(() => pool.remove(), SWEEP.hold + SWEEP.fade + 260);
    if (caught) return;
    const f = h('i.cc-float', { style: { left: `${g.x}px`, top: `${g.y - g.s * 0.55}px` } }, `+${SPOT_S} s`);
    els.fx.append(f);
    f.animate([{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, -6px)', offset: 0.18 }, { opacity: 1, transform: 'translate(-50%, -22px)', offset: 0.7 }, { opacity: 0, transform: 'translate(-50%, -34px)' }], { duration: 1250, easing: 'ease-out', fill: 'both' });
    later(() => f.remove(), 1300);
  }
  /** a light found you: the sweep (one beam — three on the CAUGHT spot), then the cell lights; play never stops meanwhile */
  async function spotted(i, caught) {
    if (reducedMotion() || !root) { landing.delete(i); paintCell(i); paintStatus(); ccSfx(caught ? 'caught' : 'spotted'); return; }
    const g = spotGeo(i);
    landing.add(i); paintCell(i); paintStatus();
    ccSfx(caught ? 'caught' : 'spotted');
    const left = { x: -0.2 * g.W, y: -0.08 * g.H }, right = { x: 1.2 * g.W, y: -0.08 * g.H }, low = { x: 0.5 * g.W + (g.x < g.W / 2 ? 0.45 : -0.45) * g.W, y: 1.1 * g.H };
    if (caught) {
      // THE CATCH: three beams converge on the last cell (left, right, from below), one red pulse over the screen
      await Promise.all([beam(g, left), beam(g, right, { delay: SWEEP.stagger }), beam(g, low, { delay: SWEEP.stagger * 2, swing: 30 })]);
      if (gone) return;
      els.red.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: SWEEP.pulse, easing: 'ease-out' });
    } else {
      await beam(g, g.x < g.W / 2 ? right : left);   // (from the far side, so it sweeps in ACROSS the harbor)
      if (gone) return;
    }
    landing.delete(i);
    paintCell(i, { burst: true });
    landFx(g, caught);
    paintStatus();
  }

  // ---- the network (DFIX3 — COALESCED MOVES): the first tap fires AT ONCE; taps made while its answer is in flight queue and go out together
  // in the next call (judge.moves); a judge without `moves` pipelines singles. A lost answer retries (a repeat is free on the server) -------
  const DEBUG = typeof location !== 'undefined' && /[?&]debug=1/.test(location.search);
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
  /** a move the player made: { a: 'dig' | 'chord', cell, buoys?, cellsOf, origin, at } → the queue → the next call */
  function enqueue(mv) { queue.push(mv); pump(); }
  function pump() {
    if (gone || !queue.length) return;
    if (typeof judge.moves !== 'function') { while (queue.length) fire([queue.shift()]); return; }   // (the old fake: singles, pipelined)
    if (flying) return;
    fire(queue.splice(0, MAX_BATCH));
  }
  async function fire(batch) {
    const id = ++seq;
    flying = true; calls++;
    inflight.set(id, Date.now()); watchNet();
    const one = batch.length === 1 ? batch[0] : null;
    const call = () => (one ? (one.a === 'dig' ? judge.dig(one.cell) : judge.chord(one.cell, one.buoys))
      : judge.moves(batch.map(m => ({ a: m.a, cell: m.cell, ...(m.a === 'chord' ? { buoys: m.buoys } : {}) }))));
    for (let tries = 0; !gone; tries++) {
      const d0 = Date.now();
      try {
        const resp = await call();
        if (gone) return;
        sample(resp, d0, Date.now());
        inflight.delete(id); watchNet();
        const answers = one ? [resp] : (resp.answers || []).map(a => (a ? { ...a, now: resp.now } : null));
        let bad = false;
        batch.forEach((m, k) => {
          const a = answers[k];
          if (!a || a.refused) { bad = true; for (const c of m.cellsOf) { pending.delete(c); paintCell(c); } return; }
          land(a, m.origin, m.cellsOf);
          timed(m);
        });
        if (bad && !view.done) resync();   // out of step (a refused chord, a cell the server says is shut): the server's record is the truth
        break;
      } catch (e) {
        if (gone) return;
        if (retryable(e)) { await wait(Math.min(1500, 250 * 2 ** Math.min(tries, 3))); continue; }
        inflight.delete(id); watchNet();
        for (const m of batch) for (const c of m.cellsOf) { pending.delete(c); paintCell(c); }
        resync();   // out of step (finished, a refused chord, a cell the server says is shut): the server's record is the truth
        break;
      }
    }
    flying = false;
    pump();
  }
  /** DFIX3 — the dev-only timing: the tap → its number on screen (+ the server's Server-Timing phases of the newest answer) */
  function timed(m) {
    const ms = Math.round(performance.now() - m.at), server = serverTimingNow();
    taps.push({ cell: m.cell, ms, server });
    if (taps.length > 400) taps.shift();
    if (DEBUG) console.info(`[cc] tap → number ${ms} ms`, server ? Object.entries(server).map(([k, v]) => `${k} ${v}`).join(' · ') : '');
  }
  /** the newest /api/daily answer's Server-Timing (same origin: the browser hands the phases to the resource entries) → { phase: ms, phase_: desc } */
  function serverTimingNow() {
    try {
      const es = performance.getEntriesByType('resource').filter(e => /\/api\/daily(\?|$)/.test(e.name));
      const e = es[es.length - 1];
      if (!e || !e.serverTiming || !e.serverTiming.length) return null;
      const o = {};
      for (const t of e.serverTiming) { o[t.name] = t.duration; if (t.description) o[`${t.name}_`] = t.description; }   // (tx_ = the attempts, region_)
      return o;
    } catch { return null; }
  }
  /** an answer lands: the opened cells pop in (a ripple outward from the tapped cell), a light → THE SWEEP (CC2) */
  function land(resp, origin, cellsOf) {
    const before = om, litBefore = ls;
    const wasDone = view.done;
    setView(foldAnswer(view, resp));
    for (const c of cellsOf) pending.delete(c);
    let far = 0, fresh = 0, calm = false, numbered = false;
    for (const [c, n] of resp.cells || []) {
      if (before.has(c)) { paintCell(c); continue; }
      buoys.delete(c);
      fresh++; if (n === 0) calm = true; else numbered = true;
      const d = reducedMotion() ? 0 : Math.min(14, ring(c, origin)) * RIPPLE_MS;
      far = Math.max(far, d);
      paintCell(c, { pop: true, delay: d });
    }
    const caughtNow = view.done && !wasDone && view.out === 'caught';
    const lights = (resp.lit || []).filter(c => !litBefore.has(c));
    lights.forEach((c, k) => { buoys.delete(c); spotted(c, caughtNow && k === lights.length - 1); });
    if (fresh && !lights.length) ccSfx(calm && fresh > 1 ? 'flood' : 'dig');
    if (numbered) hintDone();
    for (const c of cellsOf) paintCell(c);
    paintStatus(); saveBuoys();
    if (view.done && !wasDone) later(() => end(false), caughtNow && !reducedMotion() ? SWEEP.caughtEnd : far + (lights.length ? SWEEP.travel + 500 : 450));
  }

  /** THE ONE-TIME HINT goes (a soft fade; reduced motion = at once) and the run host hears it (state.onHint — the server flag) */
  let hintGone = false;
  function hintDone() {
    if (hintGone || !els.hint || els.hint.hidden) return;
    hintGone = true;
    els.hint.classList.add('is-gone');
    later(() => { if (els.hint) els.hint.hidden = true; }, reducedMotion() ? 0 : 700);
    if (st && typeof st.onHint === 'function') { try { st.onHint(); } catch (e) { console.warn('[cc] hint', e); } }
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
    enqueue({ a: 'dig', cell: i, cellsOf: [i], origin: i, at: performance.now() });
  }
  function chord(i) {
    const t = chordTargets(view, i, buoys);
    if (!t || t.some(j => pending.has(j))) { nudge(i); return; }
    const nb = nbOf(view.w, view.h)[i].filter(j => buoys.has(j));
    for (const j of t) { pending.add(j); paintCell(j); }
    enqueue({ a: 'chord', cell: i, buoys: nb, cellsOf: t, origin: i, at: performance.now() });
  }
  function toggleBuoy(i) {
    if (!ready || view.done || ended) return;
    if (om.has(i) || ls.has(i) || pending.has(i)) return;
    const on = !buoys.has(i);
    if (on) buoys.add(i); else buoys.delete(i);
    ccSfx(on ? 'buoy' : 'unbuoy');
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
    landing.clear();
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

  // ---- CC2: THE END SCREENS — the board + the switch leave; COAST CLEAR (the lighthouse sweep) or CAUGHT; the finished harbor; SHARE ------
  const dayKey = () => runDayKey(day, view.startedAt, Date.now());   // (DFIX1 — the run's own day; DM1 — THE DAILY KIT)
  /** the finished harbor, shrunk: numbers, buoys, every searchlight (the server reveals them once the run is over) — animated in by rows */
  function endHarbor() {
    const map = endMap(view, [...buoys]);
    const el = h('div.cc-end-map', { role: 'img', 'aria-label': 'the harbor you crossed', style: { '--cc-cols': String(view.w || W) } });
    map.forEach((m, i) => {
      const c = h('i.cc-mc', { class: `is-${m.k}`, style: { '--r': String(Math.floor(i / (view.w || W))) } });
      if (m.k === 'open') { c.dataset.n = String(m.n); if (m.n > 0) c.textContent = String(m.n); }
      el.append(c);
    });
    return el;
  }
  function end(still) {
    if (ended) { paintEnd(still); return; }
    ended = true;
    landing.clear();
    // a CLEAR: every cell still shut must be a light — the phone buoys them all (deduced, never told)
    if (view.out === 'clear') { for (let i = 0; i < cells.length; i++) if (!om.has(i) && !ls.has(i)) buoys.add(i); saveBuoys(); }
    paintAll();
    root.classList.add('is-end');
    root.dataset.out = view.out || '';
    const show = () => {
      if (gone) return;
      els.play.hidden = true; els.mode.hidden = true;
      paintEnd(still);
      els.end.hidden = false;
      if (still || reducedMotion()) els.end.classList.add('is-in', 'is-still');
      else { void els.end.offsetWidth; els.end.classList.add('is-in'); }
      if (!still && view.out === 'clear') ccSfx('win');
    };
    if (still || reducedMotion()) show();
    else { root.classList.add('is-leaving'); later(show, LEAVE_MS); }
    if (doneScore == null) record();
  }
  function paintEnd() {
    clear(els.end);
    const clean = view.out === 'clear';
    els.end.dataset.out = view.out || '';
    const title = h('h2.cc-end-t', headline(view));
    const stage = h('div.cc-end-stage', clean ? h('div.cc-lh', { 'aria-hidden': 'true' }, h('i.cc-lh-glow'), h('i.cc-lh-beam', h('i.cc-lh-core'))) : null, title);
    const acts = endActions('cc', { onShare: () => share(), rec: finished === 'FAILED' ? NOT_RECORDED : '' });   // (DM1 — THE DAILY KIT)
    const next = acts.next;
    els.rec = acts.rec;
    els.end.append(
      h('div.cc-end-result',
        stage,
        clean ? h('div.cc-end-n', fmtClock(finalMs(view))) : null,
        h('div.cc-end-line', endLine(view)),
        endHarbor()),
      acts.el);
    tickClock(next);
  }
  /** "NEXT HARBOR IN 13:06:44" — to the next 4 am Eastern, ticking (the server's clock); a run that crossed the turn (DFIX1): today's is open */
  function tickClock(el) {
    clearInterval(clockT);
    clockT = tickTurn(el, { now: serverNow, day: dayKey, open: 'TODAY’S HARBOR IS OPEN', next: 'NEXT HARBOR IN', alive: () => !gone });
  }
  async function record() {
    const r = await recordFinish(() => judge.finish(), { wait, alive: () => !gone });   // (DM1 — THE DAILY KIT: retried, backed off)
    if (gone) return;
    if (r.ok) { doneScore = r.resp.score; finished = 'RECORDED'; return; }
    if (doneScore == null) { finished = 'FAILED'; if (els.rec) els.rec.textContent = NOT_RECORDED; }
  }
  /** SHARE (CC2 — share.js, lazy): an image with NO BOARD + the one line, through the share sheet */
  async function share() {
    const line = shareLine(view, dayKey());
    return shareOrLine(async () => (await import('./share.js')).shareRun({ inputs: shareInputs(view, dayKey()), line, look: document.body.dataset.look || 'night' }), line);
  }

  const api = {
    mount(el, state) {
      root = el; st = state; gone = false;
      judge = (state && state.judge) || createApiJudge();
      const g = state && state.game;
      if (g && g.run) setView({ ...emptyView(), ...g.run });
      build();
      paintAll();
      ccSfxBytes();   // (the sounds' bytes now; they decode once the audio is unlocked — never a wait, never a throw)
      tickT = setInterval(() => { if (gone) clearInterval(tickT); else if (ready && !ended) paintTime(); }, 250);
      resync();
      window.__coastclear = {
        view: () => view, buoys: () => [...buoys], pending: () => [...pending], mode: () => mode, ready: () => ready, finished: () => finished, score: () => doneScore,
        setMode, tap, long: i => toggleBuoy(i), resync, share, rtts: () => rtts.slice(), offset: () => offset, inflight: () => inflight.size, beams: () => beams,
        queued: () => queue.length, calls: () => calls, taps: () => taps.slice(),   // (DFIX3 — the coalescing + the timing)
        shareInputs: () => shareInputs(view, dayKey()), shareLine: () => shareLine(view, dayKey()),
        state: () => ({ ready, done: view.done, out: view.out, spots: view.spots, shown: shownSpots(), open: view.open.length, lit: view.lit.length, buoys: buoys.size, pending: pending.size, inflight: inflight.size, queued: queue.length, calls, beams, landing: landing.size, mode, note: els.note.textContent, end: ended && els.end.classList.contains('is-in'), clock: els.time.textContent, paused: !!view.paused, pauses: view.pauses, hint: !!(els.hint && !els.hint.hidden && !hintGone) }),
      };
    },
    update(state) { st = state; },
    unmount() {
      gone = true;
      for (const t of timers) clearTimeout(t);
      timers = [];
      clearInterval(tickT); clearInterval(netT); clearInterval(clockT);
      if (press) clearTimeout(press.t);
      if (root) { clear(root); root.classList.remove('cc-screen', 'is-end', 'is-leaving'); delete root.dataset.ready; delete root.dataset.mode; delete root.dataset.out; }
      delete window.__coastclear;
      root = null; cells.length = 0; press = null; pending = new Set(); inflight = new Map(); landing.clear(); beams = 0; queue = []; flying = false; taps.length = 0;
    },
  };
  return api;
}
