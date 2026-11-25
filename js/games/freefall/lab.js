// /freefall-lab — THE FREEFALL LAB (F1 — docs/freefall.md "THE LAB"): the GRAYBOX of a game BEING BUILT, on the live site, on a phone.
// Open to anyone with the link, noindex nofollow, linked from nowhere — deleted at the go-live (as HIGH RISE's was).
// **THE LAB NEVER COUNTS**: the run is the pure engine in this tab — ZERO server calls, ZERO database writes; it imports nothing from
// /api, the profile, progression, the report, share or the cards, and makes no request of its own (its only files: this page's own
// static modules + three.js from the page's import map). tests/freefall-lab.test.mjs + tests/integration/freefall-lab.mjs prove it.
// Every import below is STATIC — no dynamic import, no skew wrapper, no deploy check: nothing here can ever call the server.
import { TICK_MS, TICK_HZ, TURN, SLICES, BALL, GAP, MODES, MAX_SPIN, SEED_MAX } from './tuning.js';
import { createRun, stepTo, turn, isOver, resultOf, logOf, darkGap, floorNow } from './engine.js';
import { sliceStart, kindAt, wrap, angDiff } from './tower-gen.js';
import { replay, judgeRun } from './replay.js';
import { endWords, tickOf, areaOf } from './logic.js';
import { createGraybox } from './graybox.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** `?seed=` — the SAME tower on every restart (a random one, shown, without it) · `?mode=solo|match` */
const FIXED = (Q.get('seed') || '').replace(/[^!-~]/g, '').slice(0, SEED_MAX);
const LAB_MODES = ['solo', 'match'];
const clock = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** the arrow keys (a desk): this many angle units a tick while one is held */
const KEY_SPIN = 60;
/** the most turn the page keeps owing when a flick out-runs MAX SPIN: 8 ticks of catching up (the rest of a wilder flick is dropped) */
const OWED_MAX = 8 * MAX_SPIN;
/** a button that acts on its own press + lift (never a click), and is never a drag on the tower */
function press(node, fn) {
  let id = null;
  node.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  node.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; node.blur(); fn(); } });
  node.addEventListener('pointercancel', () => { id = null; });
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
  return node;
}

function mount() {
  // ---- the page: the play area (the canvas — a drag ANYWHERE on it spins the tower), the plain-text HUD over it
  const play = el('div', 'ff-play');
  play.setAttribute('role', 'application'); play.setAttribute('aria-label', 'Freefall — drag left or right to spin the tower');
  const floorN = el('div', 'ff-floor', '0'), stats = el('div', 'ff-stats', ''), areaN = el('div', 'ff-area', ''), sub = el('div', 'ff-sub', '');
  const row = el('div', 'ff-row'); row.append(areaN, sub);
  const hud = el('div', 'ff-hud'); hud.append(el('div', 'ff-k', 'FLOOR'), floorN, stats, row);
  const dark = el('div', 'ff-dark');
  const start = el('div', 'ff-start'); start.append(el('div', 'ff-start-t', 'TOUCH TO START'), el('div', 'ff-start-l', 'DRAG LEFT / RIGHT TO SPIN THE TOWER'));
  const end = el('div', 'ff-end'), endT = el('div', 'ff-end-t'), endL = el('div', 'ff-end-l'), check = el('div', 'ff-check');
  const again = el('button', 'ff-btn ff-again', 'RESTART'); again.type = 'button';
  end.hidden = true; end.append(endT, endL, again, check);
  const restartB = el('button', 'ff-btn ff-restart', 'RESTART'); restartB.type = 'button';
  const tabs = LAB_MODES.map(m => { const b = el('button', 'ff-tab', m.toUpperCase()); b.type = 'button'; b.dataset.mode = m; return press(b, () => restart(m)); });
  const tabRow = el('div', 'ff-tabs'); tabRow.append(...tabs);
  const seedLine = el('div', 'ff-seed', ''), bar = el('div', 'ff-bar'); bar.append(tabRow, seedLine);
  const fps = Q.get('fps') === '1' ? el('div', 'ff-fps', '') : null;
  const stage = el('div', 'ff-stage');
  stage.append(play, dark, hud, start, end, bar, restartB); if (fps) stage.append(fps);
  app.replaceChildren(stage);
  let view;
  try { view = createGraybox(play); }
  catch { stage.append(el('p', 'ff-nogl', 'This browser can’t draw the game here (it has no WebGL).')); return; }   // (the page still loaded: its stage is up)

  // ---- the run: the pure engine on this tab's clock. Tick 0 = the START touch; the RULES never read the clock — the page turns it into ticks.
  let mode = LAB_MODES.includes(Q.get('mode')) ? Q.get('mode') : 'solo', seed = '', run = null, t0 = null, shown = false, overAt = 0;
  let owed = 0, carry = 0, clamped = 0, drag = null, keyDir = 0, keyTick = 0;   // the turn not yet applied (MAX SPIN) · the drag's fraction of a unit · ticks the clamp bit · the finger · an arrow key
  const ev = [], liveEv = [];   // the events since the last frame (for the view) · every event of the live run (the replay's check)
  const frames = [];
  function restart(m = mode, s = FIXED || newSeed()) {
    mode = m; seed = s; run = createRun({ seed, mode }); t0 = null; shown = false; overAt = 0; ev.length = 0; liveEv.length = 0;
    owed = 0; carry = 0; clamped = 0; drag = null; keyDir = 0;
    view.reset(run);
    end.hidden = true; start.hidden = false; bar.hidden = false; hudKey = '';
    for (const t of tabs) t.classList.toggle('is-on', t.dataset.mode === mode);
    seedLine.textContent = `seed ${seed}`;
  }
  const begin = ts => { t0 = ts; start.hidden = true; bar.hidden = true; };   // (the mode switch + the seed leave the screen: a thumb at the foot is a DRAG)
  press(restartB, () => restart());
  press(again, () => restart());

  /** offer the turn still owed, tick by tick up to tick T (MAX SPIN: at most 171 units count at one tick — the tower catches up) */
  function settle(T) {
    for (let t = Math.max(run.mt + 1, run.ll + 1); t <= T && owed !== 0 && !isOver(run); t++) { owed -= turn(run, t, owed, ev); if (owed !== 0) clamped++; }
  }
  /** FAIR INPUT: a move counts at the tick of its own EVENT TIME (pointermove's timeStamp → the nearest tick) — never "the next frame" */
  function move(ts, units) {
    if (t0 == null || isOver(run) || !units) return;
    const T = tickOf(ts, t0);
    if (T < 0) return;
    settle(T - 1);          // (what was still owed belongs to the ticks before this move)
    owed += units;
    owed -= turn(run, T, owed, ev);
    if (owed > OWED_MAX) owed = OWED_MAX; else if (owed < -OWED_MAX) owed = -OWED_MAX;   // (a wild flick: never more than 8 ticks — 0.13 s — of catching up after the finger)
  }
  const stamp = ts => { const now = performance.now(); return ts > 0 && ts <= now + 4 && now - ts < 1000 ? ts : now; };   // (a browser whose event clock is not the page's: the handler's own time)

  play.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (shown) return;                      // (the end is up: RESTART is its own button)
    if (t0 == null) begin(stamp(e.timeStamp));
    drag = { id: e.pointerId, x: e.clientX };
    try { play.setPointerCapture(e.pointerId); } catch { /* fine */ }
  });
  play.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    // every sample the browser gathered since the last frame, each at its own time (a 120 Hz finger on a 60 Hz frame)
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
    for (const s of list && list.length ? list : [e]) {
      // 1 : 1 — the ring under the ball moves exactly as far as the finger: px → radians (the view's px per radian) → angle units
      carry += (s.clientX - drag.x) * TURN / (2 * Math.PI * view.pxPerRad());
      drag.x = s.clientX;
      const units = Math.trunc(carry);
      carry -= units;
      move(stamp(s.timeStamp), units);
    }
  });
  const lift = e => { if (drag && drag.id === e.pointerId) drag = null; };
  play.addEventListener('pointerup', lift); play.addEventListener('pointercancel', lift);
  play.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // (no page scroll under a finger)
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (shown) return;
    if (t0 == null) begin(stamp(e.timeStamp));
    keyDir = e.key === 'ArrowLeft' ? -1 : 1;
  });
  document.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keyDir = 0; });

  function showEnd(now) {
    shown = true; overAt = now; drag = null; keyDir = 0;
    const live = resultOf(run), log = logOf(run);
    endT.textContent = endWords(live);
    const many = (n, word) => `${n} ${word}${n === 1 ? '' : 'S'}`;
    endL.textContent = `FLOOR ${live.floor} · ${areaOf(live.floor).name}\n${many(live.bounces, 'BOUNCE')} · ${many(live.blazes, 'BLAZE')} · BEST RUN ${live.bestRun}`;
    // THE DETERMINISM CHECK: the recorded input log replayed through a FRESH engine — the SAME code the server's judge runs
    const evR = [], { used, bad, why, ...r } = replay({ seed, mode, log, ev: evR });
    let same = bad < 0 && used === log.length && JSON.stringify(r) === JSON.stringify(live), at = -1;
    for (let i = 0; i < Math.max(evR.length, liveEv.length); i++) {
      if (JSON.stringify(evR[i]) !== JSON.stringify(liveEv[i])) { same = false; at = Math.min(evR[i] ? evR[i].t : Infinity, liveEv[i] ? liveEv[i].t : Infinity); break; }
    }
    const verdict = judgeRun({ seed, mode, log });
    if (!verdict.ok) same = false;
    check.className = `ff-check ${same ? 'is-ok' : 'is-bad'}`;
    check.textContent = same ? `REPLAY = LIVE ✓ · floor ${r.floor} · tick ${r.tick} · ${log.length} moves${clamped ? ` · max spin held ${clamped} ticks` : ''}`
      : `REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live floor ${live.floor} ${live.cause} · replay floor ${r.floor} ${r.cause}${why ? ` (${why})` : ''}${verdict.ok ? '' : ` · the judge: ${verdict.why}`}`;
    end.hidden = false; bar.hidden = false;
    lab.ends.push({ seed, mode, same, at, live, replay: r, judge: verdict, moves: log.length, clamped });
  }

  let raf = 0, last = 0, hudKey = '';
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden') return;
    let tau = 0;
    if (t0 != null) {
      tau = Math.max(0, (now - t0) / TICK_MS);
      if (!isOver(run)) {
        const T = Math.floor(tau);
        if (keyDir) { for (let t = Math.max(keyTick + 1, T - 3); t <= T; t++) owed += keyDir * KEY_SPIN; keyTick = T; } else keyTick = T;
        settle(T);                          // (the turn still owed — MAX SPIN's catching up, an arrow key — up to this frame's tick)
        stepTo(run, T, ev);                 // … THEN the landings up to it
      }
    }
    if (ev.length) { view.feed(ev); if (liveEv.length < 400000) liveEv.push(...ev); ev.length = 0; }
    if (isOver(run) && !shown) showEnd(now);
    view.draw(run, isOver(run) ? run.end : tau, dt);
    const cap = MODES[mode].capTicks, left = clock(cap - (isOver(run) ? run.end : Math.floor(tau))), gap = darkGap(run);
    const key = `${run.floor}|${run.clean}|${run.blaze}|${gap}|${left}`;
    if (key !== hudKey) {
      hudKey = key;
      floorN.textContent = String(run.floor);
      stats.textContent = `CLEAN ${run.clean} · BLAZE ${run.blaze ? 'ON' : '—'} · DARK ${gap}`;
      areaN.textContent = areaOf(run.floor).name;
      sub.textContent = `${mode.toUpperCase()} · ${left}`;
      // the darkness, as plain as it gets: the screen's edges close in as it comes nearer (6 floors off = nothing) — never over the ball
      dark.style.opacity = String(Math.max(0, Math.min(1, (6 - gap) / 6)));
      stats.classList.toggle('is-near', gap <= 2);
    }
    if (frames.length < 20000) frames.push(dt);
    if (fps && frames.length % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr} · tick ${run.t} · owed ${owed}`; }
  }
  document.addEventListener('visibilitychange', () => { last = 0; });

  // (the pass's own checks — tests/integration/freefall-lab.mjs)
  const lab = window.__ffLab = {
    ends: [], view,
    state: () => ({ mode, seed, started: t0 != null, shown, over: isOver(run), st: run.st, t: run.t, a: run.a, floor: run.floor, clean: run.clean, blaze: run.blaze, dark: darkGap(run), nl: run.nl, fl: run.fl, moves: run.lt.length, owed, clamped, words: endT.textContent, check: check.textContent, hud: [floorN.textContent, stats.textContent, areaN.textContent, sub.textContent], frame: view.frame(run), info: view.info(), pxPerRad: view.pxPerRad() }),
    /** the tower turn (angle units, signed: + = a drag to the right) that brings the middle of the nearest gap of the ball's floor under the ball */
    toGap() {
      const fl = floorNow(run), p = wrap(BALL - run.a - fl.twist);
      let best = null;
      for (let k = 0; k < SLICES; k++) if (kindAt(fl, k) === GAP) { const d = angDiff(sliceStart(k) + 170, p); if (best == null || Math.abs(d) < Math.abs(best)) best = d; }
      return best == null ? 0 : -best;
    },
    /** the top of the ball at the top of its bounce, in px from the top of the screen (the HUD ends above it) */
    apexY: () => view.apexY(run) * play.clientHeight,
    /** ms until the next landing (null = not started / over) */
    msToLanding: () => (t0 != null && !isOver(run) ? t0 + run.nl * TICK_MS - performance.now() : null),
    restart: (m, s) => restart(m || mode, s),
    frames: () => frames.slice(),
    stop() { cancelAnimationFrame(raf); view.destroy(); },
  };
  restart();
  raf = requestAnimationFrame(frame);
}

try { mount(); }
catch (e) { app.replaceChildren(el('p', 'ff-wait', `Can’t open the lab: ${(e && e.message) || e}`)); }
