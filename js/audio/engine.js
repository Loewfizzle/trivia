// Web Audio core: one AudioContext, a music bus and an SFX bus into a soft limiter.
// THE HEADER (every rule this engine keeps, M2 → FIXES R3 — the gesture, the stuck / frozen context, the session, the rebuild loop, THE FADE ON
// LEAVING, the home-screen app, THE CUT IN ONE ORDER, THE LEAVE RECORD) lives in docs/audio.md "engine.js — THE HEADER (moved Nov 16)", verbatim
// (FIXES R3: moved out of the boot bytes — THE BOOT BUDGET). CITY G: the leave modes' test bench is gone — ONE path: THE SESSION BY STATE + THE
// HARD CUT while 'ambient' + every media element paused in the cut (docs/audio.md "CITY G — THE THREE-WAY BUTTON + THE SESSION BY STATE").
import { settings, onSettings } from './settings.js';
import { LEAVE_REC_KEY, isLeftSignal, sessionFor } from './sound-state.js';
import { lazyImport } from '../ui/lazy-import.js';

let ctx = null;
let musicBus = null;
let sfxBus = null;
let master = null;        // THE MASTER (DFIX3 ADD-ON): the one gain every path leaves through — the fade on leaving / the ramp back
let fadeT = 0, pendingFadeIn = false, intT = 0;
const FADE_OUT_S = 0.09, FADE_IN_S = 0.15, SUSPEND_AFTER_MS = 60, BLUR_BACK_MS = 400;
// (FIXES R2 — THE CUT: a bus to 0 · the leave's ramp · how long the output stays exactly 0 before any suspend)
const CUT_S = 0.08, LEAVE_S = 0.025, ZERO_HOLD_MS = 100;
let unlocked = false;
let visibleNow = true;
let visibleAt = 0;        // performance.now() when the page last came back on screen
let askedAt = 0;          // performance.now() of the last resume we asked for (0 = none pending)
let gestureAskAt = 0;     // ... and of the last one asked INSIDE a gesture (iOS must honour that one; if it didn't, rebuild)
let stuck = false;        // a resume we asked for didn't bring the context back: the next tap rebuilds it
let frozen = false;       // 'running' but its clock stopped
let rebuilds = 0, lastWhy = '', lastRebuildAt = -1e9, bornOfRebuild = false, frozenAfterRebuild = false;
let made = 0, closed = 0; // contexts made / whose close() resolved (the panel: alive = made − closed)
let gestureAt = -1e9;     // performance.now() of the gesture being handled (touchend / click / keydown / a mouse's pointerdown)
const STUCK_MS = 1500, FROZEN_MS = 1500, NEVER_STARTED_MS = 700, REBUILD_GAP = 20000;
const unlockListeners = new Set();
const visibilityListeners = new Set();
const resumeListeners = new Set();
const rebuildListeners = new Set();
const gestureListeners = new Set();
const frozenListeners = new Set();

// ---- THE LOG: the last 24 audio events { at (Date.now()), m }
const LOG = [];
export function audioLog(m) { LOG.push({ at: Date.now(), m }); if (LOG.length > 24) LOG.shift(); }
export const audioEvents = () => LOG.slice();

export const getContext = () => ctx;
export const getMusicBus = () => musicBus;
export const getSfxBus = () => sfxBus;
export const getMaster = () => master;
/** the fade's timings (the tests + the docs): the ramp out, the ramp back, the suspend's wait after the ramp is scheduled */
export const FADE = Object.freeze({ outS: FADE_OUT_S, inS: FADE_IN_S, suspendMs: SUSPEND_AFTER_MS, cutS: CUT_S, leaveS: LEAVE_S, zeroHoldMs: ZERO_HOLD_MS,
  hushSuspendMs: Math.round(FADE_OUT_S * 1000) + ZERO_HOLD_MS, leaveSuspendMs: Math.round(LEAVE_S * 1000) + ZERO_HOLD_MS });
export const isUnlocked = () => unlocked && !!ctx && ctx.state === 'running';
/** Inside a gesture's handling right now (iOS lets a media element / a context start only here)? */
export const inGesture = () => performance.now() - gestureAt < 60;
/** May the music start now? Running, or inside a gesture that just asked the context to run (it will). */
export const canStart = () => unlocked && !!ctx && ctx.state !== 'closed' && (ctx.state === 'running' || inGesture());
/** The context's clock: is it moving? (false = frozen: 'running' but stopped) */
export const clockFrozen = () => frozen;
/** a resume we asked for didn't bring the context back (the next tap rebuilds it) · the first tap has happened */
export const audioStuck = () => stuck;
export const audioUnlocked = () => unlocked;
/** APP FIXES (Grok 3.4) — THE DEAD-GRAPH RULE: the graph can't sound — closed, 'interrupted' (a call, Siri: the OS holds it), frozen
 *  ('running' but its clock stopped) or stuck (asked to resume, still not running 1.5 s later — a 'suspended' one that won't come
 *  back). The synced players stop + this phone's own player takes THE DIRECT PATH (music.js). Before the first tap: not dead (nothing
 *  can play yet anyway). */
export const graphDead = () => !!ctx && (ctx.state === 'closed' || ctx.state === 'interrupted' || frozen || stuck);
/** The graph can be trusted: running, not frozen, its clock seen moving for ≥ 2 s (music.js moves a direct song back onto it then). */
export const graphOk = () => !!ctx && ctx.state === 'running' && !frozen && clock.t > 0 && clock.moving > 0 && performance.now() - clock.moving > 2000;

// ---- THE AUDIO SESSION BY STATE (iOS 17+ — CITY G, the owner's decisions Nov 16–17; PURE: sound-state.js#sessionFor): the music ON → 'playback'
// (C2 — the no-squeal path he tested); the music OFF + the effects ON → 'ambient' (the phone's own podcast / Spotify KEEPS PLAYING, the effects
// mix on top; the silent switch obeyed); everything OFF → iOS left alone ('auto' — set back only if we had set it). 'play-and-record' while
// THE INTERCOM holds the mic (CC-B: a 'playback' session can't capture). Switching the state switches the type at once (onSettings below).
let sessionSet = { type: '', at: 0, why: '' };
let micHeld = 0;
const sessionWant = () => sessionFor(settings, micHeld);
/** THE INTERCOM: the mic is wanted (on) / let go (off) — sets the session synchronously (call it inside the hold's own gesture). */
export function micSession(on) { micHeld = Math.max(0, micHeld + (on ? 1 : -1)); setSession(on ? 'mic on' : 'mic off'); }
export const sessionType = () => { try { return (navigator.audioSession && navigator.audioSession.type) || ''; } catch { return ''; } };
function setSession(why) {
  let a;
  try { a = navigator.audioSession; } catch { a = null; }
  if (!a) return;
  const want = sessionWant();
  // (everything off: leave iOS alone — back to 'auto' only if this page set a type before)
  if (want === 'auto' && (!sessionSet.type || sessionSet.type === 'auto')) return;
  try {
    if (a.type !== want) { a.type = want; audioLog(`session → ${want} (${why})`); }
    if (sessionSet.type !== want) sessionSet = { type: want, at: Date.now(), why };
  } catch { /* unsupported value */ }
}

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  setSession('new context');
  let c;
  try { c = ctx = new AC({ latencyHint: 'interactive' }); }
  catch (e) { audioLog(`new context ✗ ${(e && e.name) || 'error'} (alive ${made - closed})`); ctx = null; return null; }
  made++;
  sleepy(c);
  c.onstatechange = () => {
    if (c !== ctx) return;
    const rs = realOf(c);
    if (rs === 'running') asleep = false, wakeAt = 0;
    else if (asleep && rs === 'suspended') return audioLog('ctx → asleep');
    audioLog(`ctx → ${c.state}`);
    leaveNote(`ctx ${c.state}`, c.state === 'interrupted');
    if (c.state === 'running') {
      stuck = false; askedAt = 0; gestureAskAt = 0; clearTimeout(intT); intT = 0;
      // (FIXES R1: running OFF SCREEN — the OS gave it back while the app is away: never a sound there; the return brings it back from 0)
      if (!visibleNow || document.visibilityState === 'hidden') { if (master) silence(c); pendingFadeIn = false; setTimeout(() => { if (ctx === c && c.state === 'running' && (!visibleNow || document.visibilityState === 'hidden')) c.suspend().catch(() => {}); }, ZERO_HOLD_MS); audioLog('running off screen — silenced + suspended'); return; }
      // (FIXES R1 — THE REVIEW A15: a context that started itself while hushed — NOTHING RUNS)
      if (hushed) { hushNow('running while hushed'); return; }
      if (pendingFadeIn) fadeIn('running again');
      resumeListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
    } else if (c.state === 'interrupted' && visibleNow && unlocked && !hushed) {
      // (FIXES R1: the OS interrupting the context IS a leave signal — the home-screen app often gets it before any blur / hidden: silent at
      //  once + the beds stopped; the fade back waits for 'running'; a resume is asked only if the page is still on screen a moment later)
      if (master) silence(c);
      pauseBeds('interrupted'); mediaCut(true, 'interrupted'); pendingFadeIn = true;
      clearTimeout(intT);
      intT = setTimeout(() => { intT = 0; if (ctx === c && visibleNow && unlocked && !hushed && document.visibilityState === 'visible' && c.state !== 'running') ask('os took it'); }, BLUR_BACK_MS);
    }
    // the OS took it away while we're on screen (a call, Siri, another app's audio, the route changed): ask for it back
    else if (visibleNow && unlocked && !hushed && document.visibilityState === 'visible') ask('os took it');
  };
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.25;
  master = ctx.createGain();
  master.gain.value = pendingFadeIn ? 0 : 1;   // (made while coming back on screen: it ramps up once it runs — never a pop)
  limiter.connect(master);
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(limiter);
  sfxBus.connect(limiter);
  applyVolumes(true);
  clock = { t: -1, since: performance.now(), moving: 0 }; frozen = false;
  if (hushWanted()) { hushed = true; master.gain.value = 0; }   // (CITY A: made while muted — silent from its first sample)
  return ctx;
}

// Perceptual-ish volume curve: slider 0..1 -> gain.
const curve = v => Math.max(0, Math.min(1, v)) ** 2;

function applyVolumes(instant) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const m = settings.muted || settings.musicOff ? 0 : curve(settings.music);
  const s = settings.muted || settings.sfxOff ? 0 : curve(settings.sfx);   // (SHELL 2.0 A: the ☰ menu's SOUND EFFECTS toggle)
  if (s > 0) sfxCutAt = 0; else if (!sfxCutAt) sfxCutAt = performance.now();
  // (a ramp on a clock that isn't moving never arrives: set it straight — M4)
  if (instant || frozen || t === 0) { musicBus.gain.value = m; sfxBus.gain.value = s; return; }
  busTo(musicBus.gain, m, t, 0.08, 0.12);
  busTo(sfxBus.gain, s, t, 0.05, CUT_S);
}
/** FIXES R2 — a bus to its level: to 0 (or up from 0) on a LINEAR ramp that ARRIVES (setTargetAtTime never reaches 0: −66 dBFS a quarter-second
 *  later, measured); a slider's move between two levels eases as before */
function busTo(p, v, t, tau, ramp) {
  try {
    const cur = p.value;
    if (v === 0 || cur < 1e-4) { p.cancelScheduledValues(t); p.setValueAtTime(cur, t); p.linearRampToValueAtTime(v, t + ramp); }
    else p.setTargetAtTime(v, t, tau);
  } catch { try { p.value = v; } catch { /* closed */ } }
}
let sfxCutAt = 0;   // performance.now() the effects went to 0 (0 = they're on)
/** FIXES R2: the effects are OFF and their bus has reached 0 — a loop may be stopped now (city-sound.js: never mid-sound) */
export const sfxSilent = () => !!sfxCutAt && performance.now() - sfxCutAt >= CUT_S * 1000 + 30;
onSettings(() => { applyVolumes(false); setSession('settings'); hushCheck('settings'); if (effectsOnly()) pauseBeds('effects only'); else { wake(); if (visibleNow && !blurred) resumeBeds(); } });

// ---- CITY H1 — MUSIC OFF = EFFECTS ONLY ('ambient'): no bed; the context SLEEPS while no effect sounds (sources COUNTED; "asleep" still SAYS
// 'running' on screen) and a source's start WAKES it — docs/audio.md "CITY H1".
const DOZE_MS = 300, REAL = new WeakMap();
let voices = 0, voiceAt = 0, asleep = false, dozeT = 0, wakeAt = 0;
const effectsOnly = () => sessionWant() === 'ambient' && !hushed;
globalThis.__nsBedsOff = effectsOnly;   // (the city's loops: city-sound.js + ambience.js read it through the hub)
const realOf = c => (REAL.get(c) || (() => c.state))();
const stNow = () => (!ctx ? 'none' : asleep && realOf(ctx) === 'suspended' ? 'asleep' : realOf(ctx));
function sleepy(c) {
  const d = Object.getOwnPropertyDescriptor(c, 'state');
  let own = d && 'value' in d ? d.value : null, get = null;
  for (let p = d ? null : Object.getPrototypeOf(c); p && !get; p = Object.getPrototypeOf(p)) { const q = Object.getOwnPropertyDescriptor(p, 'state'); if (q && q.get) get = q.get; }
  const real = () => (get ? get.call(c) : own);
  try { Object.defineProperty(c, 'state', { configurable: true, get: () => { const s = real(); return asleep && !hushed && visibleNow && c === ctx && s === 'suspended' ? 'running' : s; }, set: v => { own = v; } }); REAL.set(c, real); } catch { /* fine */ }
  for (const k of ['createBufferSource', 'createOscillator']) {
    const mk = c[k];
    if (typeof mk === 'function') c[k] = function () {
      const s = mk.apply(c, arguments), st = s.start;
      s.start = function () {
        let on = c === ctx;
        const end = () => { if (on) { on = false; voices = Math.max(0, voices - 1); voiceAt = performance.now(); } };
        if (on) { voices++; try { s.addEventListener('ended', end); } catch { /* fine */ } wake(); }
        try { return st.apply(s, arguments); } catch (e) { end(); throw e; }
      };
      return s;
    };
  }
}
function doze() {
  const c = ctx;
  if (!c || asleep || dozeT || voices || !effectsOnly() || !unlocked || !visibleNow || blurred || frozen || realOf(c) !== 'running' || performance.now() - voiceAt < DOZE_MS) return;
  quiet(c, LEAVE_S);   // (a short ramp — an effect's reverb tail may still ring; a leave in it steps to 0 at once)
  dozeT = setTimeout(() => { dozeT = 0; if (ctx === c && !voices && effectsOnly() && visibleNow && realOf(c) === 'running') { asleep = true; wakeAt = askedAt = gestureAskAt = 0; silence(c); c.suspend().catch(() => {}); } else silence(c, 1); }, Math.round(LEAVE_S * 1000) + ZERO_HOLD_MS);
}
function wake() {
  const c = ctx;
  if (dozeT) { clearTimeout(dozeT); dozeT = 0; if (c) silence(c, 1); }
  if (!asleep || !c || hushed || !visibleNow) return;   // (never woken off screen — the return wakes nothing either: the next effect does)
  silence(c, 1);
  audioLog('awake for an effect');
  if (!wakeAt) wakeAt = performance.now();
  c.resume().catch(() => {});
}

// ---- CITY A — item 29, THE LEAVING SQUEAL (the owner's iPhone, SOUND MUTED, no music: a short high-pitched noise switching from Safari to another
// app). Muted = every voice at 0, so it was the audio MACHINERY still live — the context running for THE PROBE / the beat analysers, the
// elements on their silent activation. Now while MUTED (or the music AND the effects both off) NOTHING RUNS: the master ramps to 0, the context
// is SUSPENDED after the ramp (music.js pauses every element + releases the direct path's src — no silent loop); a tap no longer resumes it.
// UNMUTE is a tap: inside that gesture the context resumes, music.js re-activates its elements, the master ramps up from 0 (no pop).
export const hushWanted = (s = settings) => !!(s.muted || (s.musicOff && s.sfxOff));
let hushed = false, hushT = 0;
/** is the audio machinery hushed now (muted / everything off)? */
export const audioHushed = () => hushed;
function hushCheck(why) {
  const want = hushWanted();
  if (want === hushed) { if (want && ctx && ctx.state === 'running' && !hushT) hushNow(why); return; }
  hushed = want;
  if (want) { asleep = false; audioLog(`hush (${why}) — the master to 0, then the context suspended`); hushNow(why); return; }
  clearTimeout(hushT); hushT = 0;
  audioLog(`unhush (${why}${inGesture() ? ' · in tap' : ''})`);
  if (!ctx || !unlocked) return;
  pendingFadeIn = true;
  try { if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); } } catch { /* closed */ }
  if (ctx.state === 'running' && !frozen) fadeIn('unmuted'); else { ask('unmuted'); blip(); }
  hushListeners.forEach(fn => { try { fn(false); } catch (e) { console.warn(e); } });
}
function hushNow(why) {
  const c = ctx;
  hushListeners.forEach(fn => { try { fn(true); } catch (e) { console.warn(e); } });
  if (!c) return;
  clearTimeout(hushT); clearTimeout(fadeT);
  if (c.state !== 'running' || !master) { hushT = 0; if (c.state === 'running') c.suspend().catch(() => {}); return; }
  try { const t = c.currentTime, g = master.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + FADE_OUT_S); } catch { /* closed */ }
  // (FIXES R2 — THE ZEROS FIRST: the suspend waits for the ramp's end + ZERO_HOLD_MS of exact silence; it was 60 ms into a 90-ms ramp)
  cutStart(why === 'settings' ? (settings.muted ? 'muted' : 'effects off') : why);
  const go = () => {
    hushT = 0;
    if (ctx !== c || !hushed || c.state !== 'running') return;
    if (master && master.gain.value > 1e-5) { hushT = setTimeout(go, 40); return; }
    cutSuspend(c);
    c.suspend().then(() => { if (ctx === c) audioLog(`suspended (hushed: ${why})`); }, () => {});
  };
  hushT = setTimeout(go, Math.round(FADE_OUT_S * 1000) + ZERO_HOLD_MS);
}
const hushListeners = new Set();
/** music.js: (on) → the hush began (pause + release every element) / ended (inside the unmuting tap: re-activate + play) */
export function onHush(fn) { hushListeners.add(fn); return () => hushListeners.delete(fn); }

// A 1-sample silent buffer started inside the gesture fully unlocks iOS.
function blip() {
  try {
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(master || ctx.destination);   // (CITY A — item 29: ONLY the master reaches the destination — a silent buffer too)
    s.start(0);
  } catch { /* closed */ }
}

// Ask the context to run (logging what came of it), and check STUCK_MS later whether it did.
function ask(why) {
  if (!ctx || ctx.state === 'running') return;
  const c = ctx, from = c.state, inG = inGesture();
  if (inG) gestureAskAt = performance.now();
  if (c.state !== 'closed') {
    try {
      c.resume().then(() => { if (c === ctx) audioLog(`resume ok (${why})`); }, e => { if (c === ctx) audioLog(`resume ✗ ${(e && e.name) || 'error'} (${why}, was ${from})`); });
    } catch (e) { audioLog(`resume threw ${(e && e.name) || 'error'}`); }
  }
  const at = askedAt = performance.now();
  setTimeout(() => {
    if (askedAt === at && ctx === c && c.state !== 'running' && visibleNow && document.visibilityState === 'visible' && !stuck) { stuck = true; audioLog(`stuck: still ${c.state} 1.5 s after resume (${why})`); }
  }, STUCK_MS);
}

// close a context we're done with (counting the ones that really went away)
function closeContext(c) {
  if (!c) return;
  try { c.onstatechange = null; Promise.resolve(c.close()).then(() => { closed++; }, () => {}); } catch { /* gone */ }
}

/** A fresh AudioContext in place of one iOS won't give back: only ever inside a gesture (so it may start). The old one is closed FIRST. */
function rebuild(why) {
  const old = ctx;
  closeContext(old);
  ctx = null; musicBus = null; sfxBus = null; master = null; voices = 0; asleep = false;
  if (!createContext()) { ctx = old; return; }
  stuck = false; rebuilds++; lastWhy = why; askedAt = 0; gestureAskAt = 0; lastRebuildAt = performance.now(); bornOfRebuild = true; frozenAfterRebuild = false;
  audioLog(`rebuild #${rebuilds} (${why}) · alive ${made - closed}`);
  ask('new context');
  blip();
  rebuildListeners.forEach(fn => { try { fn(ctx); } catch (e) { console.warn(e); } });
}

let offTapAt = -1e9;      // the last tap that found the context not running (the music button reads it: that tap means "play")
/** Did a tap in the last 1.5 s find the audio stopped (so it is restarting it now)? */
export const tapFoundSilence = () => performance.now() - offTapAt < 1500;

// why a tap should replace the context (null = it shouldn't)
function rebuildWhy() {
  if (!unlocked || !ctx) return null;
  const now = performance.now(), s = ctx.state;
  if (s === 'closed') return 'closed';
  // (a rebuilt context that froze too: no new one for a while — the direct path plays meanwhile; M4)
  if (frozen) return frozenAfterRebuild && now - lastRebuildAt < REBUILD_GAP ? null : 'frozen clock';
  if (s === 'running') return null;
  if (stuck) return 'stuck ' + s;
  if (s === 'interrupted' && now - visibleAt > 400) return 'interrupted';          // (just back on screen: give iOS a moment first)
  if (gestureAskAt && now - gestureAskAt > 700) return 'a tap\'s resume never ran (' + s + ')';
  return null;
}

/** A gesture: touchend, click, keydown or a mouse's pointerdown (iOS starts audio only in these — never a touch's pointerdown). */
function unlock(e) {
  if (e && e.type === 'pointerdown' && e.pointerType !== 'mouse') { kick(); return; }
  if (document.visibilityState !== 'visible') return;
  gestureAt = performance.now();
  setSession('tap');
  if (!ctx && !createContext()) return;
  // (CITY A — item 29: HUSHED — the tap unlocks (the listeners learn it) but nothing is resumed, blipped or rebuilt: the context stays asleep)
  if (hushed || hushWanted()) {
    hushed = true;
    if (ctx.state === 'running') hushNow('a tap while hushed');
    if (!unlocked) { unlocked = true; audioLog(`unlock (${e ? e.type : '?'} · hushed)`); unlockListeners.forEach(fn => { try { fn(); } catch (err) { console.warn(err); } }); }
    gestureListeners.forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
    return;
  }
  const s = ctx.state;
  // the tap looks at the clock itself: 'running' yet not past the watcher's last sample (≥ 300 ms old, the page on screen for
  // 500 ms) = frozen NOW — no waiting 1.5 s for the watcher (the owner's tap right after coming back did nothing: M4)
  if (unlocked && !frozen && s === 'running' && clock.t >= 0 && ctx.currentTime === clock.t && gestureAt - clock.since > 300 && gestureAt - visibleAt > 500) {
    frozen = true; clock.moving = 0; frozenAfterRebuild = bornOfRebuild;
    audioLog(`clock frozen at ${clock.t.toFixed(2)} s (seen at the tap)`);
    frozenListeners.forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
  }
  if (unlocked && (s !== 'running' || frozen)) { offTapAt = performance.now(); audioLog(`tap ${e ? e.type : '?'} · ctx ${s}${frozen ? ' (frozen)' : ''}`); }
  const why = rebuildWhy();
  if (why) rebuild(why);
  else if (ctx.state !== 'running') { ask(e ? e.type : 'tap'); blip(); }
  if (!unlocked) {
    unlocked = true;
    audioLog(`unlock (${e ? e.type : '?'})`);
    blip();
    unlockListeners.forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
  }
  // inside the tap: whatever needs a gesture to play again (music.js: a paused / broken / re-made voice) — on EVERY tap
  gestureListeners.forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
}

export function onUnlock(fn) {
  unlockListeners.add(fn);
  if (unlocked) fn();
}

/** Called whenever the context (re)starts running — e.g. after iOS let it resume. */
export function onResume(fn) {
  resumeListeners.add(fn);
  return () => resumeListeners.delete(fn);
}

/** Called (inside the tap) after a stuck context was replaced by a fresh one: move your nodes to getContext(). */
export function onRebuild(fn) { rebuildListeners.add(fn); return () => rebuildListeners.delete(fn); }

/** Called synchronously inside every tap / key press, after the context was asked to run (iOS only lets some things start here). */
export function onGesture(fn) { gestureListeners.add(fn); return () => gestureListeners.delete(fn); }

/** Called when a 'running' context's clock is seen stopped (music.js: the direct path, if its element may play). */
export function onFrozen(fn) { frozenListeners.add(fn); return () => frozenListeners.delete(fn); }

/** The engine's state for tests + the readout. */
export const audioHealth = () => ({ state: stNow(), voices, hushed, session: sessionWant(), bedsOn: bedsPaused ? 0 : beds.size, pendingFadeIn, stuck, frozen, rebuilds, why: lastWhy, unlocked, visible: visibleNow, master: master ? +master.gain.value.toFixed(3) : null,
  time: ctx ? +ctx.currentTime.toFixed(2) : 0, session: sessionInfo(), sessionSet: { ...sessionSet }, made, closed, alive: made - closed,
  movingFor: clock.moving > 0 && !frozen ? Math.round(performance.now() - clock.moving) : 0, ok: graphOk() });
function sessionInfo() { try { const a = navigator.audioSession; return a ? `${a.type || '?'}/${'state' in a ? a.state || '?' : 'n/a'}` : ''; } catch { return ''; } }

/** Test hook: pretend iOS won't give the context back (resume() never settles, the state stays put) until a rebuild. */
export function simulateStuck(state = 'interrupted') {
  if (!ctx) return;
  const c = ctx;
  c.suspend().catch(() => {});
  c.resume = () => new Promise(() => {});
  try { Object.defineProperty(c, 'state', { get: () => state, configurable: true }); } catch { /* read-only here */ }
  ask('test');
}
/** Test hook: the WebKit bug — the context says 'running' but its clock (and its sound) stopped. */
export function simulateFrozen() {
  if (!ctx) return;
  const c = ctx, t = c.currentTime;
  c.suspend().catch(() => {});
  c.resume = () => new Promise(() => {});
  try { Object.defineProperty(c, 'state', { get: () => 'running', configurable: true }); Object.defineProperty(c, 'currentTime', { get: () => t, configurable: true }); } catch { /* read-only here */ }
}

// Retry a resume (no-op when already running or not yet unlocked by a gesture).
function kick() {
  if (!ctx || !unlocked || hushed || document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ask('retry');
}

// THE CLOCK WATCH: a 'running' context whose clock doesn't move for FROZEN_MS is frozen (the next tap rebuilds it, or the direct
// path plays); one that NEVER started (still 0.00 after NEVER_STARTED_MS) counts at once
let clock = { t: -1, since: 0, moving: 0 };   // moving: performance.now() since when the clock has been seen moving (0 = not yet)
function watchClock() {
  // (a wake whose resume never ran (iOS refused it): after 1 s the context stops pretending — the usual recovery takes over)
  if (asleep && wakeAt && performance.now() - wakeAt > 1000) { asleep = false; wakeAt = 0; audioLog('the wake never ran'); kick(); }
  doze();
  if (!ctx || asleep || !unlocked || !visibleNow || document.visibilityState !== 'visible' || ctx.state !== 'running') { clock = { t: -1, since: performance.now(), moving: 0 }; if (frozen && ctx && ctx.state !== 'running') frozen = false; return; }
  const now = performance.now(), t = ctx.currentTime;
  if (t !== clock.t) { if (frozen) audioLog('clock moving again'); clock = { t, since: now, moving: frozen || !clock.moving ? now : clock.moving }; frozen = false; return; }
  const limit = t === 0 ? NEVER_STARTED_MS : FROZEN_MS;
  if (!frozen && now - clock.since > limit) {
    frozen = true; clock.moving = 0; frozenAfterRebuild = bornOfRebuild;
    audioLog(`clock frozen at ${t.toFixed(2)} s (says running${frozenAfterRebuild ? ', the rebuilt one' : ''})`);
    frozenListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
  }
}

export function onVisibility(fn) {
  visibilityListeners.add(fn);
}

// ---- THE BEDS (CITY D): every LOOPING source registers here — { pause(why), resume() }; on leaving each stops AT ONCE, back on screen each
// ramps back in. A lazy chunk (a game's sounds) reaches it through the hub globalThis.__nsAudioBeds (THE STALE-MODULE RULE)
const beds = new Set();
let bedsPaused = false;
export function holdBed(bed) { beds.add(bed); if (bedsPaused) { try { bed.pause('left'); } catch { /* fine */ } } return () => beds.delete(bed); }
globalThis.__nsAudioBeds = holdBed;
export const bedCount = () => beds.size;
function pauseBeds(why) { bedsPaused = true; for (const b of [...beds]) { try { b.pause(why); } catch { /* gone */ } } }
function resumeBeds() { if (!bedsPaused || effectsOnly()) return; bedsPaused = false; for (const b of [...beds]) { try { b.resume(); } catch { /* gone */ } } }
// ---- THE FADE ON LEAVING (DFIX3 ADD-ON → CITY D): the master to 0 AT ONCE on the audio clock + the beds stopped, the suspend follows; back = 0 → up once running
function fadeOut(why) {
  clearTimeout(fadeT); clearTimeout(blurT); blurT = 0;
  const c = ctx;
  mediaCut(true, why);   // (CITY G — the 5:44 pm entry: EVERY media element paused in the cut's own step — the podium's victory song too)
  if (!c || !master || c.state !== 'running') { pauseBeds(why); if (c && c.state === 'running') c.suspend().catch(() => {}); return; }
  if (sessionWant() === 'ambient') { hardCut(c, why, () => !visibleNow); return; }
  // (FIXES R2: the master RAMPS to 0 over LEAVE_S (it stepped — and the beds were cut in that same instant); the beds stop once it's 0; the
  //  suspend after THE ZEROS FIRST. A blur already ramped it: then the ramp is already 0 and this only keeps it there.)
  const already = master.gain.value < 1e-5 && blurred === false && bedsPaused;
  quiet(c, LEAVE_S);
  if (!already) cutStart('leave');
  leaveNote('cut: the master ramped to 0');
  audioLog(`fade out (${why}) — the master 0 at once`);
  setTimeout(() => { if (!visibleNow) pauseBeds(why); }, Math.round(LEAVE_S * 1000) + 10);
  fadeT = setTimeout(() => { if (ctx === c && !visibleNow && c.state === 'running') { cutSuspend(c); leaveNote('cut: suspend asked'); c.suspend().then(() => { if (ctx === c) audioLog('suspended after the fade'); }, () => {}); } }, Math.round(LEAVE_S * 1000) + ZERO_HOLD_MS);
}
/** the master to 0 NOW — no ramp. CITY H1 — THE SQUEAL's cause: setValueAtTime alone is only an event on the audio timeline (the page's
 *  value stayed 1.000 until the render thread ran a quantum — on iOS leaving 'ambient' it never did); the VALUE itself is set (v = 1: back up) */
function silence(c, v = 0) { try { const g = master.gain; g.cancelScheduledValues(c.currentTime); g.value = v; } catch { /* closed */ } }
/** FIXES R2 — the master to 0 on a ramp of `s` seconds from wherever it is (a step is a click; CITY D's 90 ms was too long for a leave) */
function quiet(c, s) { try { const t = c.currentTime, g = master.gain; const v = g.value; g.cancelScheduledValues(t); g.setValueAtTime(v, t); g.linearRampToValueAtTime(0, t + s); } catch { /* closed */ } }
function fadeIn(why) {
  const c = ctx;
  pendingFadeIn = false;
  if (!c || !master) return;
  try {
    const t = c.currentTime, g = master.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(1, t + FADE_IN_S);
  } catch { /* closed */ }
  resumeBeds();
  audioLog(`fade in (${why})`);
}
// CITY D — a BLUR on a touch phone is the earliest sign of leaving Safari (before pagehide / hidden): silent at once, the beds stopped; the
// suspend waits for hidden — still visible ~400 ms later (the share sheet, an alert) → everything back. A desktop's blur is not a leave.
let blurT = 0, blurred = false;
const coarse = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
function onBlur() {
  if (!coarse() || !visibleNow || !ctx || hushed) return;
  blurred = true;
  mediaCut(true, 'blur');
  // (CITY G — THE ANTI-SQUEAL GUARD: in 'ambient' iOS does not interrupt the session first (C1 squealed on leave) — the FIRST leave signal cuts
  //  the effects + the city's loops in ONE step: the master 0 at once, the beds stopped, THE ZEROS FIRST, then the suspend)
  if (sessionWant() === 'ambient' && master && ctx.state === 'running') hardCut(ctx, 'blur', () => blurred || !visibleNow);
  else {
    // (FIXES R2: a short ramp, then the beds — never a loop cut while it sounds)
    if (master && ctx.state === 'running') { quiet(ctx, LEAVE_S); cutStart('leave'); audioLog('blur — the master 0 at once'); }
    setTimeout(() => { if (blurred || !visibleNow) pauseBeds('blur'); }, Math.round(LEAVE_S * 1000) + 10);
  }
  clearTimeout(blurT);
  blurT = setTimeout(blurBack, BLUR_BACK_MS);
}
function blurBack() {
  blurT = 0;
  if (!blurred || !visibleNow || document.visibilityState === 'hidden') return;
  blurred = false;
  mediaCut(false, 'still on screen after a blur');
  if (ctx && master && !hushed && ctx.state === 'running') fadeIn('still on screen after a blur');
  // (FIXES R1 — THE REVIEW A7: the OS took the context meanwhile (interrupted — Siri, a call, a prompt): ask for it back and leave the fade
  //  PENDING — it runs with 'running' (onstatechange), the beds with it; resumeBeds() alone left the master at 0 for good)
  else if (ctx && master && !hushed && ctx.state !== 'closed') { pendingFadeIn = true; ask('back after a blur'); }
  else resumeBeds();
}
/** hidden / shown — visibilitychange, pagehide / pageshow (the back-forward cache), freeze / resume (the page frozen in the background) */
function setVisible(visible, why = '') {
  if (visible === visibleNow) { if (visible) kick(); return; }
  visibleNow = visible;
  blurred = false; clearTimeout(blurT); blurT = 0;
  if (visible) { visibleAt = performance.now(); setSession('back on screen'); mediaCutOn = false; }   // (CITY G: the media's own return = onVisibility)
  if (ctx) {
    if (visible && unlocked && hushed) { /* (CITY A: hushed — back on screen wakes nothing) */ }
    else if (visible && unlocked) {
      clearTimeout(fadeT);
      pendingFadeIn = true;
      try { if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); } } catch { /* closed */ }
      if (ctx.state === 'running' && !frozen) fadeIn('back on screen'); else ask('back on screen');
    } else if (!visible) { askedAt = 0; gestureAskAt = 0; frozen = false; pendingFadeIn = false; clearTimeout(intT); intT = 0; fadeOut(why || 'hidden'); }
  }
  visibilityListeners.forEach(fn => fn(visible));
}
/** Test hook: the page leaves / comes back (the fade → the suspend → the resume → the ramp up, in the log). */
export function simulateVisible(v) { setVisible(!!v, v ? 'test show' : 'test hide'); }

// ---- CITY G — THE HARD CUT ('ambient' — the music off, the effects on): the master to 0 AT ONCE + the beds stopped in the SAME step, the
// zeros held ZERO_HOLD_MS, then the suspend (THE CUT IN ONE ORDER, docs/audio.md); `still()` = is the page still away (a blur that came back
// keeps the context: blurBack fades it in)
function hardCut(c, why, still) {
  silence(c); pauseBeds(why); cutStart('leave');
  leaveNote('cut: hard (ambient) — the master 0 + the beds stopped');
  audioLog(`hard cut (${why}) — ambient: the master 0 + the beds in one step`);
  clearTimeout(fadeT);
  fadeT = setTimeout(() => { if (ctx === c && still() && c.state === 'running') { cutSuspend(c); leaveNote('cut: suspend asked'); c.suspend().then(() => { if (ctx === c) audioLog('suspended after the hard cut'); }, () => {}); } }, ZERO_HOLD_MS);
}
// ---- CITY G — THE MEDIA CUT (the 5:44 pm entry: "media: voice victory3 PLAYING" at the first signal — an HTML element, not the Web Audio
// master, and iOS may keep one playing behind a 'playback' session): every owner of a media element (music.js — the songs, the podium's
// victory song, a direct path; any game's DOM audio through the hub) pauses EVERY playing element in the cut's own step: onLeaveCut(fn(left,
// why)) — left = true at the cut, false when a blur came back on screen (the hidden → visible return is THE FADE's usual onVisibility).
const leaveCutListeners = new Set();
export function onLeaveCut(fn) { leaveCutListeners.add(fn); return () => leaveCutListeners.delete(fn); }
globalThis.__nsLeaveCut = onLeaveCut;
// (the music off → no synced song on through a 0 bus — synced-songs.js reads it through this hub; CITY G: the music's own switch, no mode)
globalThis.__nsAudioRest = () => !!(settings.musicOff || !(settings.music > 0));
let mediaCutOn = false;
function mediaCut(left, why) {
  if (left === mediaCutOn) return;
  mediaCutOn = left;
  leaveCutListeners.forEach(fn => { try { fn(left, why); } catch (e) { console.warn(e); } });
  // (belt and braces: a page's own <audio> / <video> nobody registered)
  if (left && typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') for (const el of document.querySelectorAll('audio, video')) { try { if (!el.paused) el.pause(); } catch { /* fine */ } }
  if (left) leaveNote(`media after: ${mediaAfter()}`);
}
/** what media still plays right after the cut → 'all paused' | the list (the AUDIO LEAVE row's "media after") */
function mediaAfter() {
  const parts = [];
  // (the ELEMENTS only — music.js's hub; the synced stations are Web Audio voices, silent with the master + suspended with the context)
  const f = soundingHubs.get('media'); if (f) { let v = '—'; try { v = f(); } catch { v = '?'; } if (v && v !== '—' && !/^none/.test(v)) parts.push(v); }
  try { for (const el of document.querySelectorAll('audio, video')) if (!el.paused) parts.push('a DOM element'); } catch { /* fine */ }
  return parts.length ? parts.join(' · ') : 'all paused';
}
/** test hook: the page's media-cut state (left / back) */
export const mediaCutState = () => ({ on: mediaCutOn, after: mediaAfter() });

// ---- FIXES R3 — THE LEAVE RECORD: each signal written SYNCHRONOUSLY → an AUDIO LEAVE row at the next return / load; soundingHub(name, fn)
const soundingHubs = new Map();
export function soundingHub(name, fn) { soundingHubs.set(name, fn); return () => soundingHubs.delete(name); }
globalThis.__nsSounding = soundingHub;
export function soundingNow() {
  const o = { ctx: stNow(), master: master ? +master.gain.value.toFixed(3) : null, fx: sfxBus ? +sfxBus.gain.value.toFixed(3) : null,
    music: musicBus ? +musicBus.gain.value.toFixed(3) : null, beds: bedsPaused ? `${beds.size} stopped` : beds.size, hushed };
  for (const [k, fn] of soundingHubs) { try { o[k] = fn(); } catch { o[k] = '?'; } }
  return o;
}
let episode = null, lastLeave = null;
function leaveNote(sig, start = false) {
  if (!reportable()) { if (start) quietAudio(); return; }   // (CITY G: only an ADMIN phone records a leave — every other phone is COUNTED)
  try {
    const now = Date.now();
    if (!episode) { if (!start) return; episode = { sess: sessionWant(), at: now, dev: deviceLine(), session: sessionInfo() || 'n/a', vis: document.visibilityState, first: soundingNow(), sig: [], left: false }; }
    if (episode.sig.length < 16) episode.sig.push({ s: sig, ms: now - episode.at, st: stNow(), m: master ? +master.gain.value.toFixed(3) : null });
    if (isLeftSignal(sig)) episode.left = true;
    localStorage.setItem(LEAVE_REC_KEY, JSON.stringify(episode));
  } catch { /* storage full / private mode */ }
}
function leaveBack(why) {
  if (!episode) return;
  const e = episode; episode = null;
  if (!e.left) { try { localStorage.removeItem(LEAVE_REC_KEY); } catch { /* fine */ } return; }   // (a blur that stayed on screen: no leave)
  e.back = { why, ms: Date.now() - e.at, st: stNow() };
  try { localStorage.setItem(LEAVE_REC_KEY, JSON.stringify(e)); } catch { /* fine */ }
  setTimeout(sendLeave, 1500);
}
function sendLeave() {
  if (episode) return;
  let e = null;
  try { e = JSON.parse(localStorage.getItem(LEAVE_REC_KEY) || 'null'); } catch { e = null; }
  if (!e || !Array.isArray(e.sig) || !e.left) return;
  return lazyImport(import('./leave-text.js'), './leave-text.js').then(T => {
    lastLeave = { why: `leave@${e.at}`, text: T.leaveReportText(e) };
    if (!reportable()) return;                               // (kept for later)
    try { localStorage.removeItem(LEAVE_REC_KEY); } catch { /* fine */ }
    report(lastLeave, 'leave');
  }).catch(() => {});
}
if (typeof window !== 'undefined') window.__audioLeave = { last: () => lastLeave, sounding: soundingNow, episode: () => episode, send: sendLeave };

// ---- FIXES R2 — THE PHONE'S ROW: each CUT (effects off · muted · leave) → its trace; at the suspend: the master + the zeros held. ONE row a page
// per kind of cut, kind 'audio' (AUDIO CUT in /admin's phone reports) — only from the owner's phone (body.rd-owner) or with &debug=1; a leave's
// row waits in localStorage for the return / the next load (the page may be frozen right after it). window.__audioCut.last() = the last one.
let cut = null, lastCut = null;
const cutSent = new Set();
const CUT_KEY = 'ns:audiocut';
function cutStart(why) {
  if (!ctx || (cut && cut.why === why && performance.now() - cut.at < 1500)) return;
  cut = { why, at: performance.now(), from: stNow(), session: sessionInfo() || 'n/a', master: master ? +master.gain.value.toFixed(3) : null, sfx: sfxBus ? +sfxBus.gain.value.toFixed(3) : null, beds: beds.size, visible: document.visibilityState };
}
function cutSuspend(c) {
  if (!cut || c !== ctx) return;
  const ms = Math.round(performance.now() - cut.at), m = master ? master.gain.value : null;
  lastCut = { why: cut.why, text: cutReportText({ ...cut, ms, mAt: m, held: ZERO_HOLD_MS, log: LOG.slice(-10).map(x => x.m), ua: deviceLine() }) };
  cut = null;
  report(lastCut);
}
const deviceLine = () => { try { const u = navigator.userAgent; const d = u.match(/(iPhone|iPad|Android[^;)]*|Macintosh|Windows NT [\d.]+)/); const v = u.match(/OS (\d+_\d+(?:_\d+)?)/); const sa = (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || navigator.standalone ? ' · home-screen app' : ''; return `${d ? d[1] : 'device'}${v ? ' ' + v[1].replace(/_/g, '.') : ''}${sa}`; } catch { return 'device'; } };
/** PURE (tests): a cut's trace → the row's text */
export function cutReportText(t) {
  const head = `AUDIO CUT · ${t.why} · ctx ${t.from} → suspended after ${t.ms} ms · master ${t.mAt == null ? '?' : (+t.mAt).toFixed(3)} at the suspend · ${t.held} ms of zeros before it`;
  return `${head}\nat the cut: master ${t.master} · effects bus ${t.sfx} · ${t.beds} bed(s) · session ${t.session} · ${t.visible} · ${t.ua || ''}\nlog: ${(t.log || []).join(' · ')}`.slice(0, 1500);
}
// (CITY G: AUDIO LEAVE / AUDIO CUT rows only from an ADMIN phone — body.rd-owner = the radio loaded on the server's yes (ADMIN_PIDS) — or
//  &debug=1; every other phone's leave / cut is COUNTED (errlog.js#countQuiet 'snd' — one number in /admin's errors, never a row))
const reportable = () => { try { return document.body.classList.contains('rd-owner') || /[?&]debug=1(?:&|$)/.test(location.search); } catch { return false; } };
let quietSaid = false;
function quietAudio() { if (quietSaid) return; quietSaid = true; lazyImport(import('../errlog.js'), '../errlog.js').then(m => { if (typeof m.countQuiet === 'function') m.countQuiet('snd'); }).catch(() => {}); }
function report(row, kind = 'audio') {
  if (row && !reportable()) { quietAudio(); return; }
  if (!row || cutSent.has(row.why) || !reportable()) return;
  if (row.why === 'leave' && document.visibilityState !== 'visible') { try { localStorage.setItem(CUT_KEY, JSON.stringify(row)); } catch { /* fine */ } return; }
  cutSent.add(row.why);
  if (navigator.webdriver) return;   // (a test browser builds the row — window.__audioCut — and sends nothing)
  try {
    const body = JSON.stringify({ p: 'report', r: { kind, text: row.text } });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', new Blob([body], { type: 'text/plain' })))) fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* the log is polish */ }
}
function sendKept() { let row = null; try { row = JSON.parse(localStorage.getItem(CUT_KEY) || 'null'); localStorage.removeItem(CUT_KEY); } catch { row = null; } if (row && row.text) report(row); }
if (typeof window !== 'undefined') window.__audioCut = { last: () => lastCut };

export function installAudio() {
  // the gestures (capture, on the document: a tap ANYWHERE counts, before any handler can stop it) — every tap, never removed
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
  // typing on the iOS system keyboard / focusing inputs / coming back to the app: try again
  for (const ev of ['input', 'focusin', 'touchstart']) document.addEventListener(ev, kick, { capture: true, passive: true });
  window.addEventListener('focus', () => { audioLog('focus'); if (episode && !episode.left) leaveBack('focus'); if (blurred) { clearTimeout(blurT); blurBack(); } kick(); });
  window.addEventListener('blur', () => { audioLog('blur'); if (coarse()) leaveNote('blur', true); onBlur(); });
  // hidden / shown: visibilitychange, + pagehide / pageshow for the back-forward cache (a restored page may get no visibilitychange), + the
  // Page Lifecycle's freeze / resume (DFIX3 ADD-ON) — each through THE FADE ON LEAVING (above)
  // (FIXES R3: each leave signal RECORDED first, synchronously)
  document.addEventListener('visibilitychange', () => { const v = document.visibilityState === 'visible'; if (!v) leaveNote('hidden', true); audioLog(`visibility ${document.visibilityState}`); setVisible(v, 'hidden'); if (v) leaveBack('visible'); });
  window.addEventListener('pagehide', e => { leaveNote(`pagehide${e.persisted ? ' (persisted)' : ''}`, true); audioLog(`pagehide${e.persisted ? ' (persisted)' : ''}`); setVisible(false, 'pagehide'); });
  window.addEventListener('pageshow', e => { audioLog(`pageshow${e.persisted ? ' (persisted)' : ''}`); setVisible(document.visibilityState === 'visible'); });
  document.addEventListener('freeze', () => { leaveNote('freeze', true); audioLog('freeze'); setVisible(false, 'freeze'); });
  document.addEventListener('resume', () => { audioLog('resume (lifecycle)'); setVisible(document.visibilityState === 'visible'); });
  // iOS 17+: the audio session comes back after a call / Siri / another app's audio
  try { if (navigator.audioSession && navigator.audioSession.addEventListener) navigator.audioSession.addEventListener('statechange', () => { leaveNote(`session ${sessionInfo()}`); audioLog(`session ${sessionInfo()}`); setSession('session change'); kick(); }); } catch { /* unsupported */ }
  setInterval(watchClock, 250);
  setTimeout(sendKept, 4000);
  for (const ms of [4000, 15000]) setTimeout(sendLeave, ms);   // (FIXES R3: a leave never come back from)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(sendKept, 1500); });
  setSession('boot');   // (CITY G — THE SESSION BY STATE from the first moment: the music on = 'playback' (C2's tested path), off = 'ambient')
}
