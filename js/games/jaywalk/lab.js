// /jaywalk-lab — THE JAYWALK LAB (H1 — docs/jaywalk.md "THE LAB"): the owner's preview of a game BEING BUILT, on the LIVE site, on his
// phone, on cellular. OWNER-GATED like /lab (POST /api/admin whoami → admin, else the door); NO room, NO database writes, NO Firebase
// writes of any kind — the page signs in (this browser's own anonymous identity), asks who it is, and then never talks to the server
// again: the run is the pure engine in this tab. noindex. three.js loads only once the door has opened.
// A LOCAL emulator page that asks (`localhost` / `127.0.0.1` + `?emu` + `&preview=1` — config.js's rule for a game being built) skips the
// door: the pass's own look + frame-rate checks (tests/integration/jaywalk-lab.mjs). Nothing else does.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, FP } from './tuning.js';
import { createCourse, pulseAt, moverLeft } from './course.js';
import { createRun, step, isOver, resultOf, canLog } from './engine.js';
import { replay } from './replay.js';
import { wireControls } from './controls.js';
import { createTiers } from '../kit/tiers.js';
import { getPref, setPref } from './lab-prefs.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
const localOpen = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && Q.has('emu') && Q.get('preview') === '1';

function door(who, msg) {
  app.replaceChildren(h('section.jw-deny',
    h('div.jw-lab-k', 'NEON SPEAKEASY · BEING BUILT'),
    h('h1', 'THE JAYWALK LAB'),
    h('p', msg || 'This room is for the owner. Open it in the browser where your admin profile lives (the one with the radio).'),
    who && who.pid ? h('p', 'This browser’s profile id: ', h('code', who.pid)) : null,
    h('p', h('a.jw-a', { href: '/' }, '‹ THE CITY'))));
}

const CAUSE = { car: 'HIT BY A CAR', water: 'IN THE WATER', train: 'HIT BY THE TRAIN', edge: 'CARRIED OFF THE EDGE', blackbird: 'THE BLACKBIRD', ufo: 'ABDUCTED', wall: 'THE WALL GOT YOU' };
const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
const clock = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** a button that acts on its own press + lift (never a click: iOS drops them on a page that just moved) */
function press(el, fn) {
  let id = null;
  el.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  el.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; fn(); } });
  el.addEventListener('pointercancel', () => { id = null; });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
  return el;
}

async function mount() {
  // THE NIGHT LOOK (H2 — night.js); `?gray=1` keeps H1's graybox for comparison (the same engine, the same camera at 9 columns)
  const GRAY = Q.get('gray') === '1';
  const [{ createGraybox, createNight }, { greedyBot }] = await Promise.all([
    GRAY ? lazyImport(import('./graybox.js'), './graybox.js') : lazyImport(import('./night.js'), './night.js'), lazyImport(import('./bot.js'), './bot.js')]);
  let kidColor = '#00f0ff';
  try { const p = JSON.parse(localStorage.getItem('na:1:profile') || 'null'); const C = { cyan: '#00f0ff', magenta: '#ff2bd6', yellow: '#f3ff3a', green: '#3dff8b', orange: '#ff8c1a', violet: '#a66bff', red: '#ff3355', blue: '#3d7bff' }; if (p && C[p.color]) kidColor = C[p.color]; } catch { /* the default */ }

  // ---- the page: the play area (the canvas + the two screen-space bands), the HUD over it
  const play = h('div.jw-play', { role: 'application', 'aria-label': 'Jaywalk — tap to hop, swipe to move' });
  const lanes = h('div.jw-lanes', '0'), sub = h('div.jw-sub', ''), mark = h('div.jw-mark', '');
  const tabs = MODE_IDS.map(m => press(h('button.jw-tab', { type: 'button', 'data-mode': m }, m.toUpperCase()), () => restart(m)));
  const seedBtn = press(h('button.jw-new', { type: 'button' }, 'NEW SEED'), () => restart(mode));
  // THE WIDER VIEW's switch (the owner judges by feel): WIDTH 9 · 11 — remembered on this phone; the rules are 9 columns either way
  let cols = Q.get('cols') === '9' ? 9 : Q.get('cols') === '11' ? 11 : getPref('cols', '11') === '9' ? 9 : 11;
  const widths = [9, 11].map(n => press(h('button.jw-tab.jw-w', { type: 'button', 'data-cols': String(n), 'aria-label': `Width ${n} columns` }, String(n)), () => setCols(n)));
  function setCols(n) { cols = n; setPref('cols', n); view.setCols(n); for (const b of widths) b.classList.toggle('is-on', b.dataset.cols === String(n)); }
  const end = h('div.jw-end', { hidden: true }), endT = h('div.jw-end-t'), endL = h('div.jw-end-l'), endGo = h('div.jw-end-go', 'TAP — HOP AGAIN'), check = h('div.jw-check');
  end.append(endT, endL, endGo, check);
  const fps = Q.get('fps') === '1' ? h('div.jw-fps', '') : null, seedLine = h('div.jw-seed', '');
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first tap, never before) + THE SOUND AUDITION (the SOUNDS sheet)
  let snd = null, sheetOpen = false;
  const soundsBtn = press(h('button.jw-new.jw-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  if (!GRAY) Promise.all([lazyImport(import('../../audio/engine.js'), '../../audio/engine.js'), lazyImport(import('./sfx.js'), './sfx.js')]).then(([E, S]) => { E.installAudio(); S.fetchSounds(); snd = S; lab.sfx = S; }).catch(() => { /* silent: audio is polish */ });
  const tools = GRAY ? null : h('div.jw-bar.jw-bar2', h('div.jw-tabs', h('span.jw-bar-k', 'WIDTH'), ...widths), soundsBtn);
  app.replaceChildren(h(`div.jw-stage${GRAY ? '.is-gray' : ''}`, play, GRAY ? h('div.jw-sky') : null, h('div.jw-blackout'),
    h('div.jw-hud', lanes, sub, mark), tools, h('div.jw-bar', h('div.jw-tabs', ...tabs), seedBtn), end, seedLine, fps));
  const pin = /^[012]$/.test(Q.get('tier') || '') ? Number(Q.get('tier')) : null;   // (`?tier=0|1|2` pins a quality tier — the pass's measure)
  const view = GRAY ? createGraybox(play, { kidColor }) : createNight(play, { kidColor, cols, tier: pin == null ? 2 : pin });
  for (const b of widths) b.classList.toggle('is-on', b.dataset.cols === String(cols));
  // AUTOMATIC quality steps (the match kit's tiers 2 / 1 / 0): the frame time slips → a step down; headroom → back up
  const tiers = createTiers({ apply: t => { if (view.setTier) view.setTier(t); }, initial: pin == null ? 2 : pin });

  // ---- the run: the pure engine, stepped at 60 ticks a second from the frame clock (the RULES never read it)
  let mode = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo', seed, course, run, log, queue = [], acc = 0, last = 0, overAt = 0, shown = false, bot = null, markUntil = 0;
  const frames = [], cost = [];   // (the frame times + the work in each frame, for &fps=1 + the pass's measure)
  let steps = 0, slow = 0, warped = false, started = false;   // (started: the run's tick 0 is the FIRST touch — the page never runs the wall at a kid nobody is playing)
  function restart(m = mode, s = Q.get('seed') && !seed ? Q.get('seed') : newSeed()) {
    mode = m; seed = s; course = createCourse(seed); run = createRun({ seed, mode }); log = []; queue = []; acc = 0; shown = false; overAt = 0; warped = false; started = false;
    end.hidden = true; mark.textContent = 'TAP TO HOP · SWIPE TO MOVE'; markUntil = 0;
    for (const t of tabs) t.classList.toggle('is-on', t.dataset.mode === mode);
    seedLine.textContent = `seed ${seed}`;
    if (bot) bot = greedyBot({ seed });
  }
  const hop = d => { if (!isOver(run) && queue.length < 2) queue.push(d); };
  wireControls(play, { onHop: hop, onAny: () => { if (isOver(run) && shown && performance.now() - overAt > 300) restart(); } });

  function tick() {
    let d = '';
    if (bot && !queue.length) { const b = bot(run, course); if (b) queue.push(b); }
    if (queue.length && canLog(log, run.t, queue[0])) { d = queue.shift(); log.push({ t: run.t, d }); }
    const ev = [];
    step(run, course, d, ev);
    for (const e of ev) { if (e.e === 'landmark') { mark.textContent = e.name; markUntil = performance.now() + 2600; } if (snd) snd.onEvent(e); }
    steps++;
  }
  function showEnd() {
    shown = true; overAt = performance.now();
    const live = resultOf(run);
    endT.textContent = live.taken ? `TAKEN AT LANE ${live.lanes}` : (CAUSE[live.cause] || 'OUT');
    endL.textContent = live.taken ? 'THE MOTHERSHIP CAME — THAT IS A WIN' : `LANE ${live.lanes}`;
    // THE DETERMINISM CHECK: the run replayed from its seed + hop log — the SAME code the server runs
    const { used, ...r } = replay({ seed, mode, log });
    const same = JSON.stringify(r) === JSON.stringify(live) && used === log.length;
    check.className = `jw-check ${warped ? '' : same ? 'is-ok' : 'is-bad'}`;
    check.textContent = warped ? 'WARPED (a look check) — no replay' : same ? `REPLAY = LIVE · lane ${r.lanes} · tick ${r.tick} · ${log.length} hops`
      : `REPLAY ≠ LIVE — live lane ${live.lanes} t ${live.tick} ${live.cause} · replay lane ${r.lanes} t ${r.tick} ${r.cause} (${used}/${log.length} hops)`;
    end.hidden = false;
    lab.ends.push({ seed, mode, same, live, replay: r, hops: log.length });
  }
  let raf = 0, hudKey = '';
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden' || sheetOpen) return;   // (the SOUNDS sheet holds the run still)
    const t0 = performance.now();
    if (bot && shown && now - overAt > 600) restart();   // (the measure's bot plays on)
    if (!started) { if (queue.length || bot) { started = true; mark.textContent = ''; } else acc = -dt; }
    acc += dt;
    let n = 0;
    while (acc >= TICK_MS && n < 6) { if (!isOver(run)) tick(); acc -= TICK_MS; n++; }
    if (acc > TICK_MS) { acc = 0; slow++; }   // (a long stall: the run simply waits — it never skips rules)
    if (isOver(run) && !shown) showEnd();
    view.draw(run, course, isOver(run) ? 0 : acc / TICK_MS, dt);
    tiers.sample(now, performance.now() - t0); if (pin == null && !GRAY) tiers.tick(now);
    const M = MODES[mode];
    const key = `${run.best}|${run.lives}|${M.cap ? Math.ceil((M.cap - run.t) / TICK_HZ) : ''}`;
    if (key !== hudKey) {
      if (lanes.textContent !== String(run.best)) { lanes.textContent = String(run.best); lanes.classList.remove('is-pop'); void lanes.offsetWidth; lanes.classList.add('is-pop'); }
      hudKey = key;
      sub.textContent = [M.lives > 1 ? `LIVES ${run.lives}` : '', M.cap ? `THE MOTHERSHIP ${clock(M.cap - run.t)}` : 'ENDLESS'].filter(Boolean).join(' · ');
    }
    if (markUntil && now > markUntil) { mark.textContent = ''; markUntil = 0; }
    if (frames.length < 20000) { frames.push(dt); cost.push(performance.now() - t0); }
    if (fps && frames.length % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr}${i.tier == null ? '' : ` · tier ${i.tier}`} · tick ${run.t}`; }
  }
  document.addEventListener('visibilitychange', () => { last = 0; acc = 0; });
  restart();
  raf = requestAnimationFrame(frame);

  // (the pass's own checks — tests/integration/jaywalk-lab.mjs: the bot plays through the same input path, the frame times, the camera)
  const lab = window.__jwLab = {
    ends: [], view,
    state: () => ({ mode, seed, t: run.t, st: run.st, y: run.y, x: run.x / FP, best: run.best, lives: run.lives, wall: run.wall / FP, hops: log.length, asked: log.length + queue.length, over: isOver(run), shown, started, steps, slow, kidY: view.kidScreenY(), kidPx: view.kidHeightPx ? view.kidHeightPx() : 0, cols, gray: GRAY, info: view.info() }),
    bot(on) { bot = on ? greedyBot({ seed }) : null; },
    restart: (m, s) => restart(m || mode, s),
    setCols, setTier: t => tiers.set(t), ready: view.ready || Promise.resolve(true),
    lane: i => { const L = course.lane(i); return { type: L.type, dir: L.dir || (L.pulse && L.pulse.dir) || 0, mark: L.mark || '' }; },
    hop,
    frames: () => frames.slice(),
    cost: () => cost.slice(),
    clearFrames() { frames.length = 0; cost.length = 0; },
    stop() { cancelAnimationFrame(raf); view.destroy(); },
    // (the look checks only: put the kid on a lane far up the course — the run is then no longer its log's, the end screen says WARPED)
    warp(lane, o = {}) { warped = true; run.y = lane; run.best = Math.max(run.best, lane); run.x = o.x == null ? 4.5 * FP : o.x; run.st = 'idle'; run.buf = ''; run.blink = o.blink == null ? 600 : o.blink; run.wall = (lane - 5) * FP; queue = []; started = true; mark.textContent = ''; },
    /** (a look check) the middle of a log on this water lane that is well inside the 9 columns right now (FP; −1 = none) */
    logAt(lane) { const L = course.lane(lane); if (L.type !== 'water') return -1; for (const it of L.items) { const l = moverLeft(L, it, run.t); if (l > 1500 && l + it.len < 7500) return l + it.len / 2; } return -1; },
    find(kind, from = 0) { for (let i = from; i < from + 900; i++) { const L = course.lane(i); if (kind === 'ufo' ? L.ufo && L.ufo.y0 === i : kind === 'mark' ? !!L.mark : L.type === kind) return i; } return -1; },
    pulse(lane) { const L = course.lane(lane); return L.pulse ? pulseAt(L.pulse, run.t) : null; },
  };
}

async function boot() {
  try {
    if (localOpen()) { await mount(); return; }
    const { initFirebase, isConfigured } = await lazyImport(import('../../firebase.js'), '../../firebase.js');
    if (!isConfigured) { door(null, 'Firebase is not configured.'); return; }
    await initFirebase();
    const { api } = await lazyImport(import('../../profile/api.js'), '../../profile/api.js');
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { door(who); return; }
    await mount();
  } catch (e) {
    door(null, `Can’t open the lab: ${(e && e.message) || e}`);
  }
}
boot();
