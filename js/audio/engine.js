// Web Audio core: one AudioContext, a music bus and an SFX bus into a soft limiter.
//
// Mobile rules handled here:
//  - iOS/Chrome only allow audio after a user gesture: the context is created and
//    resumed on the first tap/key (and re-resumed on later taps if iOS suspended it).
//  - Audio pauses when the page is hidden and resumes when it comes back. iOS often refuses
//    that resume (or 'interrupts' the context, e.g. around the system keyboard), so every
//    later tap/keystroke/focus retries, and onResume listeners restart playback.
//  - THE STUCK CONTEXT (iOS: leaving Safari, the lock screen, a call, Siri, another app's audio):
//    sometimes the context never runs again: resume() is refused or never settles, and before
//    this only a reload helped. Every resume we ask for is checked STUCK_MS later; a context
//    still not running then is "stuck", and the next tap REBUILDS it (a fresh AudioContext,
//    created + started inside that tap, which iOS always allows). onRebuild listeners move their
//    nodes over (music.js re-makes its voices in the same tap); modules that key their nodes to
//    getContext() follow on their own.
//  - navigator.audioSession.type = 'ambient' (iOS 17+): mixes politely with other
//    apps' audio and respects the ring/silent switch.
import { settings, onSettings } from './settings.js';

let ctx = null;
let musicBus = null;
let sfxBus = null;
let unlocked = false;
let visibleNow = true;
let askedAt = 0;          // performance.now() of the last resume we asked for (0 = none pending)
let stuck = false;        // a resume we asked for didn't bring the context back: the next tap rebuilds it
let rebuilds = 0, lastWhy = '';
const STUCK_MS = 1500;
const unlockListeners = new Set();
const visibilityListeners = new Set();
const resumeListeners = new Set();
const rebuildListeners = new Set();
const gestureListeners = new Set();

export const getContext = () => ctx;
export const getMusicBus = () => musicBus;
export const getSfxBus = () => sfxBus;
export const isUnlocked = () => unlocked && !!ctx && ctx.state === 'running';

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* unsupported */ }
  const c = ctx = new AC({ latencyHint: 'interactive' });
  c.onstatechange = () => {
    if (c !== ctx) return;
    if (c.state === 'running') { stuck = false; askedAt = 0; resumeListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); }
    // the OS took it away while we're on screen (a call, Siri, another app's audio, the route changed): ask for it back
    else if (visibleNow && unlocked && document.visibilityState === 'visible') ask();
  };
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.25;
  limiter.connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(limiter);
  sfxBus.connect(limiter);
  applyVolumes(true);
  return ctx;
}

// Perceptual-ish volume curve: slider 0..1 -> gain.
const curve = v => Math.max(0, Math.min(1, v)) ** 2;

function applyVolumes(instant) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const m = settings.muted || settings.musicOff ? 0 : curve(settings.music);
  const s = settings.muted ? 0 : curve(settings.sfx);
  if (instant) { musicBus.gain.value = m; sfxBus.gain.value = s; return; }
  musicBus.gain.setTargetAtTime(m, t, 0.08);
  sfxBus.gain.setTargetAtTime(s, t, 0.05);
}
onSettings(() => applyVolumes(false));

// A 1-sample silent buffer started inside the gesture fully unlocks iOS.
function blip() {
  try {
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
  } catch { /* closed */ }
}

// Ask the context to run, and check STUCK_MS later whether it did.
function ask() {
  if (!ctx || ctx.state === 'running') return;
  if (ctx.state !== 'closed') ctx.resume().catch(() => {});
  const at = askedAt = performance.now();
  setTimeout(() => {
    if (askedAt === at && ctx && ctx.state !== 'running' && visibleNow && document.visibilityState === 'visible') stuck = true;
  }, STUCK_MS);
}

/** A fresh AudioContext in place of one iOS won't give back: only ever inside a gesture (so it may start). */
function rebuild(why) {
  const old = ctx;
  ctx = null; musicBus = null; sfxBus = null;
  if (!createContext()) { ctx = old; return; }
  stuck = false; rebuilds++; lastWhy = why;
  try { old.onstatechange = null; old.close().catch(() => {}); } catch { /* gone */ }
  ctx.resume().catch(() => {});
  blip();
  rebuildListeners.forEach(fn => { try { fn(ctx); } catch (e) { console.warn(e); } });
}

let offTapAt = -1e9;      // the last tap that found the context not running (the music button reads it: that tap means "play")
/** Did a tap in the last 1.5 s find the audio stopped (so it is restarting it now)? */
export const tapFoundSilence = () => performance.now() - offTapAt < 1500;

function unlock() {
  if (!ctx && !createContext()) return;
  if (document.visibilityState !== 'visible') return;
  if (unlocked && ctx.state !== 'running') offTapAt = performance.now();
  if (unlocked && ctx.state !== 'running' && (ctx.state === 'closed' || stuck)) rebuild(ctx.state === 'closed' ? 'closed' : 'stuck ' + ctx.state);
  else if (ctx.state !== 'running') { ask(); if (unlocked) blip(); }
  if (!unlocked) {
    unlocked = true;
    blip();
    unlockListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
  }
  // inside the tap: whatever needs a gesture to play again (music.js: a paused / broken / re-made voice)
  gestureListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
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

/** The engine's state for tests + the readout: { state, stuck, rebuilds, why, unlocked }. */
export const audioHealth = () => ({ state: ctx ? ctx.state : 'none', stuck, rebuilds, why: lastWhy, unlocked, visible: visibleNow });

/** Test hook: pretend iOS won't give the context back (resume() never settles, the state stays put) until a rebuild. */
export function simulateStuck(state = 'interrupted') {
  if (!ctx) return;
  const c = ctx;
  c.suspend().catch(() => {});
  c.resume = () => new Promise(() => {});
  try { Object.defineProperty(c, 'state', { get: () => state, configurable: true }); } catch { /* read-only here */ }
  ask();
}

// Retry a resume (no-op when already running or not yet unlocked by a gesture).
function kick() {
  if (!ctx || !unlocked || document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ask();
}

export function onVisibility(fn) {
  visibilityListeners.add(fn);
}

export function installAudio() {
  for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
  // typing on the iOS system keyboard / focusing inputs / coming back to the app: try again
  for (const ev of ['input', 'focusin', 'touchstart']) document.addEventListener(ev, kick, { capture: true, passive: true });
  window.addEventListener('focus', kick);
  // hidden / shown: visibilitychange, + pagehide / pageshow for the back-forward cache (a restored page may get no visibilitychange)
  const setVisible = visible => {
    if (visible === visibleNow) { if (visible) kick(); return; }
    visibleNow = visible;
    if (ctx) {
      if (visible && unlocked) ask();
      else if (!visible) { askedAt = 0; if (ctx.state === 'running') ctx.suspend().catch(() => {}); }
    }
    visibilityListeners.forEach(fn => fn(visible));
  };
  document.addEventListener('visibilitychange', () => setVisible(document.visibilityState === 'visible'));
  window.addEventListener('pagehide', () => setVisible(false));
  window.addEventListener('pageshow', () => setVisible(document.visibilityState === 'visible'));
  // iOS 17+: the audio session comes back after a call / Siri / another app's audio
  try { if (navigator.audioSession && navigator.audioSession.addEventListener) navigator.audioSession.addEventListener('statechange', kick); } catch { /* unsupported */ }
}
