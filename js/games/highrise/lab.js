// /highrise-lab — THE HIGH RISE LAB (S1 — docs/highrise.md "THE LAB"): the GRAYBOX of a game BEING BUILT, on the live site, on a phone.
// Open to anyone with the link, noindex nofollow, linked from nowhere.
// **THE LAB NEVER COUNTS**: the run is the pure engine in this tab — ZERO server calls, ZERO database writes; it imports nothing from
// /api, the profile, progression, the report, share or the cards, and makes no request of its own (its only files: this page's own
// static modules + three.js from the page's import map). tests/highrise-lab.test.mjs + tests/integration/highrise-lab.mjs prove it.
// Every import below is STATIC — no dynamic import, no skew wrapper, no deploy check: nothing here can ever call the server.
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, BEAT, FLOOR_TICKS_MAX, SEED_MAX } from './tuning.js';
import { createRun, stepTo, tap, isOver, resultOf } from './engine.js';
import { replay } from './replay.js';
import { END_WORDS, endWords, tickOf } from './logic.js';
import { createGraybox } from './graybox.js';   // (+ its tower.js)

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
/** `?seed=` — the SAME slabs on every retry (a random one, shown, without it) */
const FIXED = (Q.get('seed') || '').replace(/[^!-~]/g, '').slice(0, SEED_MAX);
const clock = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** the end's words stay this long before a tap is TAP TO RETRY (a rhythm's next tap must not wipe them unread) */
const RETRY_MS = 600;
/** a tap just before THE CAP is still the player's: the cap is shown this many ticks late (a touch may reach the page after its frame) */
const CAP_GRACE = 6;
/** a button that acts on its own press + lift (never a click), and is never a drop */
function press(node, fn) {
  let id = null;
  node.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  node.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; node.blur(); fn(); } });   // (blur: Space / Enter is a DROP again, not this button)
  node.addEventListener('pointercancel', () => { id = null; });
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
  return node;
}

function mount() {
  // ---- the page: the play area (the canvas), the plain-text HUD over it
  const play = el('div', 'hi-play');
  play.setAttribute('role', 'application'); play.setAttribute('aria-label', 'High Rise — tap to drop the slab');
  const floorN = el('div', 'hi-floor', '0'), streakN = el('div', 'hi-streak', 'STREAK 0'), sub = el('div', 'hi-sub', '');
  const hud = el('div', 'hi-hud'); hud.append(el('div', 'hi-k', 'FLOOR'), floorN, streakN, sub);
  const start = el('div', 'hi-start'); start.append(el('div', 'hi-start-t', 'TAP TO START'), el('div', 'hi-start-l', 'ONE TAP DROPS EACH SLAB'));
  const end = el('div', 'hi-end'), endT = el('div', 'hi-end-t'), endL = el('div', 'hi-end-l'), check = el('div', 'hi-check');
  end.hidden = true; end.append(endT, endL, el('div', 'hi-end-go', 'TAP TO RETRY'), check);
  const tabs = MODE_IDS.map(m => { const b = el('button', 'hi-tab', m.toUpperCase()); b.type = 'button'; b.dataset.mode = m; return press(b, () => restart(m)); });
  const tabRow = el('div', 'hi-tabs'); tabRow.append(...tabs);
  const seedLine = el('div', 'hi-seed', ''), bar = el('div', 'hi-bar'); bar.append(tabRow, seedLine);
  const fps = Q.get('fps') === '1' ? el('div', 'hi-fps', '') : null;
  const stage = el('div', 'hi-stage');
  stage.append(play, hud, start, end, bar); if (fps) stage.append(fps);
  app.replaceChildren(stage);
  let view;
  try { view = createGraybox(play); }
  catch { stage.append(el('p', 'hi-nogl', 'This browser can’t draw the game here (it has no WebGL).')); return; }   // (the page still loaded: its stage is up)

  // ---- the run: the pure engine on this tab's clock. Tick 0 = the START touch; the RULES never read the clock — the page turns it into ticks.
  let mode = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo', seed = '', run = null, taps = [], t0 = null, shown = false, overAt = 0;
  const ev = [], liveEv = [];   // the events since the last frame (for the view) · every event of the live run (the replay's check)
  const frames = [];
  function restart(m = mode, s = FIXED || newSeed()) {
    mode = m; seed = s; run = createRun({ seed, mode }); taps = []; t0 = null; shown = false; overAt = 0; ev.length = 0; liveEv.length = 0;
    view.reset(run);
    end.hidden = true; start.hidden = false; bar.hidden = false; hudKey = '';
    for (const t of tabs) t.classList.toggle('is-on', t.dataset.mode === mode);
    seedLine.textContent = `seed ${seed}`;
  }
  // (while a run is LIVE the mode switch + the seed are off the screen: a thumb resting at the foot is a DROP, never a restart)
  const begin = ts => { t0 = ts; start.hidden = true; bar.hidden = true; };

  // FAIR TAPS: a tap counts at the finger's TOUCH — the pointerdown's own event.timeStamp → its tick — never "the next frame"
  function touch(ts) {
    const now = performance.now();
    if (!(ts > 0 && ts <= now + 4 && now - ts < 1000)) ts = now;   // (a browser whose event clock is not the page's: the handler's own time)
    if (shown) { if (now - overAt > RETRY_MS) { restart(); begin(ts); } return; }   // TAP TO RETRY = the next run's START
    if (t0 == null) { begin(ts); return; }
    if (isOver(run)) return;
    const T = tickOf(ts, t0);
    if (tap(run, T, ev)) taps.push(T);   // (false = a landing beat: not a drop, never logged)
  }
  play.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; touch(e.timeStamp); });
  play.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // (no page scroll under a finger)
  document.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); touch(e.timeStamp); } });

  function showEnd(now) {
    shown = true; overAt = now;
    const live = resultOf(run);
    endT.textContent = endWords(live);
    endL.textContent = `FLOOR ${live.floor}\n${live.perfects} PERFECT${live.perfects === 1 ? '' : 'S'} · BEST STREAK ${live.maxStreak}`;
    // THE DETERMINISM CHECK: the recorded tap log replayed through a FRESH engine — the SAME code the server's judge runs
    const { used, bad, why, ...r } = replay({ seed, mode, taps });
    let same = bad < 0 && used === taps.length && JSON.stringify(r) === JSON.stringify(live), at = -1;
    const fresh = createRun({ seed, mode }), evR = [];
    for (const t of taps) tap(fresh, t, evR);
    stepTo(fresh, (taps.length ? taps[taps.length - 1] : 0) + BEAT + FLOOR_TICKS_MAX, evR);
    for (let i = 0; i < Math.max(evR.length, liveEv.length); i++) {
      if (JSON.stringify(evR[i]) !== JSON.stringify(liveEv[i])) { same = false; at = Math.min(evR[i] ? evR[i].t : Infinity, liveEv[i] ? liveEv[i].t : Infinity); break; }
    }
    check.className = `hi-check ${same ? 'is-ok' : 'is-bad'}`;
    check.textContent = same ? `REPLAY = LIVE ✓ · floor ${r.floor} · tick ${r.tick} · ${taps.length} taps`
      : `REPLAY ≠ LIVE ✗ · first differs at tick ${at < 0 || at === Infinity ? '?' : at} · live floor ${live.floor} ${live.cause} · replay floor ${r.floor} ${r.cause}${why ? ` (${why})` : ''}`;
    end.hidden = false; bar.hidden = false;
    lab.ends.push({ seed, mode, same, at, live, replay: r, taps: taps.slice() });
  }

  let raf = 0, last = 0, hudKey = '', frameN = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden') return;
    let tau = 0;
    if (t0 != null) {
      tau = Math.max(0, (now - t0) / TICK_MS);
      if (!isOver(run)) {
        const T = Math.floor(tau), cap = MODES[mode].capTicks;
        stepTo(run, cap != null && T >= cap && T < cap + CAP_GRACE ? cap - 1 : T, ev);
      }
    }
    if (ev.length) { view.feed(ev); if (liveEv.length < 400000) liveEv.push(...ev); ev.length = 0; }
    if (isOver(run) && !shown) showEnd(now);
    view.draw(run, isOver(run) ? run.end : tau, dt);
    const cap = MODES[mode].capTicks, left = cap == null ? '' : clock(cap - (isOver(run) ? run.end : Math.floor(tau)));
    const key = `${run.floor}|${run.streak}|${left}`;
    if (key !== hudKey) {
      hudKey = key;
      floorN.textContent = String(run.floor);
      streakN.textContent = `STREAK ${run.streak}`;
      sub.textContent = cap == null ? 'SOLO · ENDLESS' : `${mode.toUpperCase()} · ${left}`;
    }
    frameN++;
    if (frames.length < 20000) frames.push(dt); else frames[frameN % 20000] = dt;
    if (fps && frameN % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr} · tick ${run.t}`; }
  }
  document.addEventListener('visibilitychange', () => { last = 0; });

  // (the pass's own checks — tests/integration/highrise-lab.mjs)
  const lab = window.__hiLab = {
    ends: [], view,
    state: () => ({ mode, seed, started: t0 != null, shown, over: isOver(run), st: run.st, t: run.t, floor: run.floor, streak: run.streak, perfects: run.perfects, s0: run.s0, S: run.S, taps: taps.length, words: endT.textContent, check: check.textContent, top: { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, floor: run.floor }, viewTop: view.top(), info: view.info() }),
    /** ms until the sliding slab is dead on the tower (null = no slab) */
    msToPerfect: () => (t0 != null && run.st === 'slide' ? t0 + (run.s0 + run.S / 2) * TICK_MS - performance.now() : null),
    restart: (m, s) => restart(m || mode, s),
    frames: () => frames.slice(),
    /** (a LOOK CHECK only — never a run) the end panel with a cause's words + a long check line: the longest states fit the phone */
    showWords(cause, bad) { endT.textContent = END_WORDS[cause] || ''; endL.textContent = 'FLOOR 200\n200 PERFECTS · BEST STREAK 200'; check.className = `hi-check ${bad ? 'is-bad' : 'is-ok'}`; check.textContent = bad ? 'REPLAY ≠ LIVE ✗ · first differs at tick 12345 · live floor 200 made · replay floor 199 thin (past the end)' : 'REPLAY = LIVE ✓ · floor 200 · tick 12480 · 200 taps'; end.hidden = false; start.hidden = true; },
    stop() { cancelAnimationFrame(raf); view.destroy(); },
  };
  restart();
  raf = requestAnimationFrame(frame);
}

try { mount(); }
catch (e) { app.replaceChildren(el('p', 'hi-wait', `Can’t open the lab: ${(e && e.message) || e}`)); }
