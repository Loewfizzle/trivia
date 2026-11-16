// JAYWALK — THE GAME's SCREEN (H3 — THE SOLO RUN; docs/jaywalk.md "THE SOLO GAME"). The night look (night.js — the same scene the lab
// draws), the kid, the controls + the sounds, inside the console's game frame (THE CITY PAUSE, the corner menu, the station's music).
// Renders from the room's state; the RUN itself is this phone's own pure engine, played ON THE SERVER's CLOCK:
//   · GO: the moment the run is on screen the phone writes its proof node's `go` (rooms/{CODE}/jw/{matchId}/{uid}/go — the rules: the
//     SERVER's time, once) and reads it back → THE COURSE IS PICKED AFTER GO (logic.js#seedOf: hash(code + matchId + that time)). Until it
//     lands the screen shows THE START (the kid on the calm opening lanes, the rest still in the dark — never a blank frame).
//   · tick 0 = GO; the engine is stepped to the server clock's tick every frame (a stall / a hidden page is caught up — the rules never
//     skip a tick, and a run never pauses: a pause would be a slow-motion hole)
//   · THE PROOF: the hop log goes up in chunks, one a second, each stamped by the SERVER (c/{i} = { s, at }); at the end the last chunk +
//     `e` (a signal: the host's step then ends the match). The score is the SERVER's replay of that node — never this phone's claim.
//   · a refused GO (no signal, rules not yet published) = an UNPROVEN run: it still plays, on a seed of its own, and is never counted —
//     its end shows here with HOP AGAIN / BACK TO THE CITY (the console's podium needs the proof's `e`).
// A room of 2+ (THE MATCH — H4) still shows the stub.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { dbRef, set as dbSet, get as dbGet, update as dbUpdate, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { liveKeyFor } from '../registry.js';
import { createFinal } from '../../ui/final.js';
import { backToLobby } from '../../host.js';
import { createTiers } from '../kit/tiers.js';
import { TICK_HZ, FP, CLOCK } from './tuning.js';
import { createCourse } from './course.js';
import { createRun, step, isOver, canLog } from './engine.js';
import { packLog, logFromChunks } from './replay.js';
import { seedOf, standings } from './logic.js';
import { wireControls } from './controls.js';
import { createNight } from './night.js';
import { getPref, setPref } from './lab-prefs.js';
import { ZOOMS, ZOOM, ANGLES, ANGLE } from './camera.js';
import * as SFX from './sfx.js';
import { causeLine, hitVehicle } from './causes.js';
import { buildEnd } from './victory.js';

/** how long the hit is seen before the end screen covers it (ms) */
export const END_HOLD_MS = 850;
/** GO's answer is waited this long before the run goes on UNPROVEN (never a stuck start) */
export const GO_WAIT_MS = 4000;
/** the most ticks one frame catches up (a long stall is spread over a few frames; the rules never skip one) */
const CATCH_UP = 900;
const ZERO = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0, 0]);
/** THE START (before the course is known): plain calm ground — what lanes 0–3 are on EVERY course */
const START = Object.freeze({ seed: 'start', oneUp: false, lane: i => ({ i, type: 'grass', heat: 0, mark: null, ufo: null, obs: ZERO, oneUp: -1 }), safeLane: f => f });

// THE SCENE STAYS WARM over HOP AGAIN (the console's INSTANT AGAIN remounts the view for the next match): the night scene — its WebGL
// context, its models — is parked for a moment and the next mount takes it back. Any other unmount destroys it at once.
let parked = null;
const unpark = () => { if (!parked) return null; clearTimeout(parked.t); const p = parked; parked = null; return p; };
const park = (play, night) => { if (parked) { clearTimeout(parked.t); parked.night.destroy(); } parked = { play, night, t: setTimeout(() => { if (parked && parked.night === night) { parked = null; night.destroy(); play.remove(); } }, 2500) }; };

// (the pass's own checks — tests/integration/e2e-jaywalk.mjs — on a LOCAL emulator page only: never on the live site)
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
let scenesMade = 0;

const pick = (k, list, d) => { const m = getPref(k, String(d)); return list.map(String).includes(m) ? m : String(d); };

export function createView() {
  let root = null, play = null, night = null, tiers = null, offControls = null, raf = 0, st = null, gone = false;
  let lanesEl = null, markEl = null, hintEl = null, finalWrap = null, final = null, localEnd = null, stub = null;
  // the run
  let code = '', uid = '', matchId = '', mode = 'wait';   // 'wait' (GO is on its way) · 'run' · 'over'
  let run = null, course = START, log = [], queue = [], go = 0, proven = false, asked = false;
  let sent = 0, chunkN = 0, lastFlush = 0, wroteE = false, overAt = 0, goTimer = 0;
  let t0srv = 0, t0perf = 0, last = 0, markUntil = 0, lanesShown = -1, sndOn = false, bot = null, pinned = false;
  const frames = [], cost = [];
  const srvNow = () => t0srv + (performance.now() - t0perf);
  const anchor = () => { t0srv = serverNow(); t0perf = performance.now(); };
  const solo = g => !!g && g.mode === 'solo' && Object.keys(g.participants || {}).length === 1;
  const mine = g => !!(g && g.participants && g.participants[uid]);
  const nodePath = () => `rooms/${code}/jw/${matchId}/${uid}`;

  function build(el) {
    lanesEl = h('div.jw-lanes', '0'); markEl = h('div.jw-mark', '');
    hintEl = getPref('hint', '') ? null : h('div.jw-hint', 'TAP TO HOP · SWIPE TO STEP');
    const had = unpark();
    play = had ? had.play : h('div.jw-play', { role: 'application', 'aria-label': 'Jaywalk — tap to hop, swipe to move' });
    root = h('div.jw-stage.jw-game', play, h('div.jw-blackout'), h('div.jw-hud', lanesEl, markEl), hintEl);
    el.replaceChildren(root);
    const me = (st.players && st.players[uid]) || {};
    try {
      if (!had) scenesMade++;
      night = had ? had.night : createNight(play, { kidColor: colorHex(me.color), zoom: Number(pick('zoom', ZOOMS, ZOOM)), angle: pick('angle', ANGLES, ANGLE), tier: 2 });
      if (had) { night.setKidColor(colorHex(me.color)); night.resize(); }
    } catch { root.append(h('p.jw-nogl', 'This browser can’t draw the game here (it has no WebGL).')); night = null; return; }
    night.setReveal(0, true);
    tiers = createTiers({ apply: t => night && night.setTier(t), initial: night.tier() });
    offControls = wireControls(play, { onHop: hop });
    // the sounds: the SHARED engine's SFX bus (the console unlocked it on a tap long ago); silent if anything fails — audio is polish
    try { SFX.fetchSounds(); sndOn = true; } catch { sndOn = false; }
  }

  // ---- THE RUN
  function reset() {
    mode = 'wait'; course = START; run = createRun({ seed: 'start', mode: 'solo' }); log = []; queue = []; go = 0; proven = false; asked = false;
    sent = 0; chunkN = 0; lastFlush = 0; wroteE = false; overAt = 0; lanesShown = -1; markUntil = 0;
    if (markEl) markEl.textContent = '';
    if (night) night.setReveal(0, true);
    anchor();
  }
  /** GO: the proof node's first write — the SERVER's time, read back → the course */
  function askGo() {
    if (asked) return;
    asked = true;
    const m = matchId, path = `${nodePath()}/go`, node = st.liveKey === liveKeyFor(st.game) && st.live && st.live.runs ? st.live.runs[uid] : null;
    if (node && node.go > 0) { adopt(node.go, node.c, true); return; }   // (a refresh / a rejoin mid-run: the run so far is in the node)
    clearTimeout(goTimer);
    goTimer = setTimeout(() => { if (!gone && m === matchId && mode === 'wait') unproven('no answer'); }, GO_WAIT_MS);
    expectRefusal(path, 'jaywalk GO: already written (a rejoin) or the rules are not published yet');
    dbSet(dbRef(path), serverTimestamp()).then(() => dbGet(dbRef(path))).then(snap => {
      if (gone || m !== matchId || mode !== 'wait') return;
      const v = snap.val();
      if (typeof v === 'number' && v > 0) adopt(v, null, true); else unproven('no go');
    }).catch(() => {
      // refused: this run's GO is already there (a rejoin) — take the node as it is; nothing there = the proof can't be written here
      dbGet(dbRef(nodePath())).then(snap => {
        if (gone || m !== matchId || mode !== 'wait') return;
        const n = snap.val();
        if (n && n.go > 0) adopt(n.go, n.c, true); else unproven('refused');
      }).catch(() => { if (!gone && m === matchId && mode === 'wait') unproven('refused'); });
    });
  }
  /** the course lands: seed = hash(code + matchId + GO) — the run's tick 0 is GO; a node's chunks (a rejoin) are replayed to now */
  function adopt(goAt, chunks, isProof) {
    clearTimeout(goTimer);
    go = goAt; proven = !!isProof;
    const seed = isProof ? seedOf(code, matchId, go) : `u${Math.floor(go).toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
    course = createCourse(seed); run = createRun({ seed, mode: 'solo' });
    const old = chunks ? logFromChunks(chunks) : null;
    log = old || []; sent = log.length; chunkN = chunks ? Object.keys(chunks).length : 0;
    anchor();
    if (log.length) { let i = 0; const target = tickNow().t; while (!isOver(run) && run.t < target) { let d = ''; if (i < log.length && log[i].t === run.t) d = log[i++].d; step(run, course, d); } }
    mode = 'run';
    if (night) night.setReveal(1);
  }
  /** no proof here (no signal, the rules not published): the run still plays — on its own seed + clock, never counted */
  function unproven(why) {
    if (why === 'refused') lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => m.reportError(new Error('JAYWALK: the proof node was refused — the run plays UNPROVEN (re-publish database.rules.json: rooms/{CODE}/jw)'), 'rules')).catch(() => {});
    adopt(serverNow(), null, false);
  }
  const tickNow = () => { const x = (srvNow() - go) * TICK_HZ / 1000, t = Math.floor(x); return { t, a: x - t }; };

  function hop(d) {
    if (mode === 'over' || (run && isOver(run)) || queue.length >= 2) return;
    queue.push(d);
    if (hintEl) { hintEl.remove(); hintEl = null; setPref('hint', '1'); }
  }
  function tick() {
    let d = '';
    if (queue.length && canLog(log, run.t, queue[0])) { d = queue.shift(); log.push({ t: run.t, d }); }
    const ev = [];
    step(run, course, d, ev);
    for (const e of ev) {
      if (e.e === 'landmark' && markEl) { markEl.textContent = e.name; markUntil = performance.now() + 2600; }
      if (sndOn) { try { SFX.onEvent(e); } catch { /* silent */ } }
    }
  }
  /** THE PROOF: the new hops go up, a chunk a second — each stamped by the server (the rules: at === now) */
  function flush(force) {
    if (!proven || sent >= log.length) return;
    const now = performance.now();
    if (!force && now - lastFlush < CLOCK.flushMs) return;
    lastFlush = now;
    while (sent < log.length && chunkN < CLOCK.chunks) {
      let n = log.length - sent, s = packLog(log.slice(0, sent + n), sent);
      while (s.length > CLOCK.chunkMax && n > 1) { n = Math.ceil(n / 2); s = packLog(log.slice(0, sent + n), sent); }
      dbSet(dbRef(`${nodePath()}/c/${chunkN}`), { s, at: serverTimestamp() }).catch(() => { /* a refused chunk: the server simply can't count the run */ });
      chunkN++; sent += n;
    }
  }
  /** the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score) */
  function onOver() {
    mode = 'over'; overAt = performance.now();
    flush(true);
    if (proven && !wroteE) { wroteE = true; dbUpdate(dbRef(nodePath()), { e: { l: run.best, t: run.bestT, w: String(run.cause || '').slice(0, 12) } }).catch(() => {}); }
  }

  // ---- the frame
  function frame(now) {
    if (gone) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : 16.7;
    last = now;
    if (!night || document.visibilityState === 'hidden') return;
    const t0 = performance.now();
    let a = 0;
    if (mode === 'run') {
      const c = tickNow();
      if (bot && !queue.length && !isOver(run)) { const b = bot(run, course); if (b) hop(b); }
      let n = 0;
      while (run.t < c.t && !isOver(run) && n++ < CATCH_UP) tick();
      a = isOver(run) || run.t < c.t ? 0 : c.a;
      flush(false);
      if (isOver(run)) onOver();
    }
    night.draw(run, course, a, dt);
    tiers.sample(now, performance.now() - t0); if (!pinned) tiers.tick(now);
    if (TEST && frames.length < 20000) { frames.push(dt); cost.push(performance.now() - t0); }
    if (run.best !== lanesShown) {
      lanesShown = run.best; lanesEl.textContent = String(run.best);
      if (run.best > 0) { lanesEl.classList.remove('is-pop'); void lanesEl.offsetWidth; lanesEl.classList.add('is-pop'); }
    }
    if (markUntil && now > markUntil) { markEl.textContent = ''; markUntil = 0; }
    if (mode === 'over') endScreen();
  }

  // ---- the end
  function endScreen() {
    if (performance.now() - overAt < END_HOLD_MS) return;
    const g = st.game;
    if (proven) {
      if (g && g.phase === 'final') { if (!final) { hideLocalEnd(); showFinal(g); } }
      else if (!final && !localEnd && performance.now() - overAt > 6000) showLocalEnd();   // (the end never reached the room — no signal: never a frozen screen)
      return;
    }
    if (!localEnd) showLocalEnd();
  }
  /** the console's podium frame; its body = this game's end screen (victory.js#finalScene — the cause, the lanes, the best) */
  function showFinal(g) {
    final = createFinal({ rows: standings(g), players: st.players, me: uid, presence: st.presence, kicker: 'JAYWALK · SOLO', winnerLine: nm => `${nm} WENT THE FARTHEST` });
    finalWrap = h('div.jw-final', final.el);
    root.classList.add('is-over'); root.append(finalWrap);
  }
  /** an UNPROVEN run's end (no proof → the match can't reach the console's podium): the same body + HOP AGAIN · BACK TO THE CITY */
  function showLocalEnd() {
    const body = h('div.final-body.jw-fin-local');
    const vehicle = run.cause === 'car' ? hitVehicle(course, { y: run.y, x: run.x, end: run.end }) : '';
    buildEnd(body, { line: causeLine({ cause: run.cause, vehicle, lanes: run.best, taken: run.st === 'taken' }), lanes: run.best, note: 'NOT COUNTED — NO LINE TO THE BOARD' });
    // (HOP AGAIN here = another UNPROVEN run in the same match: this match's one GO is spent or was refused — PLAY NOW again gets a proven one)
    const again = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: () => { hideLocalEnd(); reset(); asked = true; unproven('again'); } }, h('span', 'HOP AGAIN'));
    const PN = globalThis.__nsPlayNow, soloRoom = !!(PN && PN.isSolo && PN.isSolo());
    const leave = h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => { leave.classList.add('is-busy'); Promise.resolve(soloRoom ? PN.leave() : backToLobby()).catch(() => leave.classList.remove('is-busy')); } }, h('span', soloRoom ? 'BACK TO THE CITY' : 'BACK TO THE ROOM'));
    localEnd = h('div.jw-final.jw-local', h('div.jw-local-in', body, h('div.jw-local-foot', again, leave)));
    root.classList.add('is-over'); root.append(localEnd);
  }
  function hideLocalEnd() { if (localEnd) { localEnd.remove(); localEnd = null; root.classList.remove('is-over'); } }

  function sync() {
    const g = st.game;
    if (!g || !night) return;
    if (g.phase === 'play' && mine(g) && solo(g)) askGo();
    // (a refresh on the podium: the run in the node, replayed to its end, stands behind the frame)
    if (g.phase === 'final' && mode === 'wait' && mine(g) && solo(g) && st.liveKey === liveKeyFor(g)) {
      const node = st.live && st.live.runs ? st.live.runs[uid] : null;
      asked = true; clearTimeout(goTimer);
      if (node && node.go > 0) { adopt(node.go, node.c, true); wroteE = true; mode = 'over'; overAt = -1e9; } else { proven = true; mode = 'over'; overAt = -1e9; }
    }
    if (final) final.refresh();
  }
  const onVis = () => { last = 0; if (document.visibilityState !== 'hidden') anchor0(); };
  /** back on screen: the clock re-read (a suspended tab's own timer may have stood still) — GO stays the run's tick 0 */
  function anchor0() { anchor(); }

  return {
    mount(el, state) {
      st = state; code = state.code; uid = state.uid; matchId = state.game ? state.game.matchId : '';
      const g = state.game;
      if (!g || !solo(g) || !mine(g)) {   // (THE MATCH — H4 — and a spectator: the stub)
        stub = h('section.jw-stub', h('div.jw-stub-k', 'BEING BUILT'), h('h1.jw-stub-t', 'JAYWALK'), h('p.jw-stub-line', 'THE MATCH SCREEN IS BEING BUILT'), h('p.jw-stub-sub', 'One player hops alone for now — PLAY NOW.'));
        el.replaceChildren(stub);
        return;
      }
      build(el);
      reset();
      if (TEST) globalThis.__jwGame = {
        state: () => ({ mode, proven, matchId, go, seed: course.seed, t: run.t, st: run.st, y: run.y, best: run.best, over: isOver(run), hops: log.length, sent, chunks: chunkN, final: !!final, localEnd: !!localEnd, scenes: scenesMade, tier: night ? night.tier() : -1, info: night ? night.info() : null, kidPx: night ? night.kidHeightPx() : 0 }),
        hop, frames: () => frames.slice(), cost: () => cost.slice(), clearFrames() { frames.length = 0; cost.length = 0; },
        setTier(t) { pinned = t != null; if (t != null) tiers.set(t); },
        bot(on) { if (!on) { bot = null; return; } lazyImport(import('./bot.js'), './bot.js').then(B => { bot = B.greedyBot({ seed: course.seed }); }); },
      };
      document.addEventListener('visibilitychange', onVis);
      sync();
      raf = requestAnimationFrame(frame);
    },
    update(state) { st = state; if (!stub) sync(); },
    unmount() {
      gone = true; cancelAnimationFrame(raf); clearTimeout(goTimer);
      document.removeEventListener('visibilitychange', onVis);
      if (mode === 'run' && run && !isOver(run)) flush(true);   // (a QUIT mid-run: what was hopped is in the proof)
      if (offControls) offControls();
      if (final) final.destroy();
      try { SFX.stopAll(); } catch { /* silent */ }
      if (night) {
        // (HOP AGAIN's remount — the console's INSTANT AGAIN marks it: the scene is kept warm for the next run; anything else frees it at once)
        if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(play, night); else night.destroy();
      }
      if (root) root.remove(); if (stub) stub.remove();
      root = null; night = null; stub = null;
    },
  };
}
