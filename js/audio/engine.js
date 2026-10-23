// Web Audio core: one AudioContext, a music bus and an SFX bus into a soft limiter.
//
// Mobile rules handled here:
//  - iOS/Chrome only allow audio after a user gesture: the context is created and
//    resumed on the first tap/key (and re-resumed on later taps if iOS suspended it).
//  - THE GESTURE (M3, the owner's iPhone: "still doesn't come back, even when I tap"): on iOS only touchend, click and
//    keydown let a media element or an AudioContext START — a touch's pointerdown does NOT. The rebuild + the plays used to
//    run in pointerdown (the first event of a tap): iOS refused them silently and nothing tried again in the touchend. Now
//    the real work runs in touchend / click / keydown (+ a MOUSE pointerdown, a gesture on a computer); a touch's pointerdown
//    only asks for a resume. Every tap retries — nothing is "tried once".
//  - Audio pauses when the page is hidden and resumes when it comes back. iOS often refuses
//    that resume (or 'interrupts' the context, e.g. around the system keyboard), so every
//    later tap/keystroke/focus retries, and onResume listeners restart playback.
//  - THE STUCK CONTEXT (iOS: leaving Safari, the lock screen, a call, Siri, another app's audio):
//    sometimes the context never runs again: resume() is refused or never settles. Every resume we ask
//    for is checked STUCK_MS later; a context still not running then is "stuck", and the next tap
//    REBUILDS it (a fresh AudioContext, created + started inside that tap). Also rebuilt at once in a tap:
//    an 'interrupted' context (the OS still holds it), one whose resume asked in an earlier tap never ran,
//    and a FROZEN one (says 'running' but its clock has stopped — a WebKit bug after the background).
//    onRebuild listeners move their nodes over (music.js re-makes its voices in the same tap); modules
//    that key their nodes to getContext() follow on their own.
//  - navigator.audioSession.type = 'ambient' (iOS 17+): mixes politely with other
//    apps' audio and respects the ring/silent switch.
//  - THE LOG (audioLog / audioEvents): the last events with times — what the &debug=1 AUDIO block shows (audio/diag.js).
import { settings, onSettings } from './settings.js';

let ctx = null;
let musicBus = null;
let sfxBus = null;
let unlocked = false;
let visibleNow = true;
let visibleAt = 0;        // performance.now() when the page last came back on screen
let askedAt = 0;          // performance.now() of the last resume we asked for (0 = none pending)
let gestureAskAt = 0;     // ... and of the last one asked INSIDE a gesture (iOS must honour that one; if it didn't, rebuild)
let stuck = false;        // a resume we asked for didn't bring the context back: the next tap rebuilds it
let frozen = false;       // 'running' but its clock stopped
let rebuilds = 0, lastWhy = '';
let gestureAt = -1e9;     // performance.now() of the gesture being handled (touchend / click / keydown / a mouse's pointerdown)
const STUCK_MS = 1500, FROZEN_MS = 1500;
const unlockListeners = new Set();
const visibilityListeners = new Set();
const resumeListeners = new Set();
const rebuildListeners = new Set();
const gestureListeners = new Set();

// ---- THE LOG: the last 24 audio events { at (Date.now()), m }
const LOG = [];
export function audioLog(m) { LOG.push({ at: Date.now(), m }); if (LOG.length > 24) LOG.shift(); }
export const audioEvents = () => LOG.slice();

export const getContext = () => ctx;
export const getMusicBus = () => musicBus;
export const getSfxBus = () => sfxBus;
export const isUnlocked = () => unlocked && !!ctx && ctx.state === 'running';
/** Inside a gesture's handling right now (iOS lets a media element / a context start only here)? */
export const inGesture = () => performance.now() - gestureAt < 60;
/** May the music start now? Running, or inside a gesture that just asked the context to run (it will). */
export const canStart = () => unlocked && !!ctx && ctx.state !== 'closed' && (ctx.state === 'running' || inGesture());
/** The context's clock: is it moving? (false = frozen: 'running' but stopped) */
export const clockFrozen = () => frozen;

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* unsupported */ }
  const c = ctx = new AC({ latencyHint: 'interactive' });
  c.onstatechange = () => {
    if (c !== ctx) return;
    audioLog(`ctx → ${c.state}`);
    if (c.state === 'running') { stuck = false; askedAt = 0; gestureAskAt = 0; resumeListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } }); }
    // the OS took it away while we're on screen (a call, Siri, another app's audio, the route changed): ask for it back
    else if (visibleNow && unlocked && document.visibilityState === 'visible') ask('os took it');
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
  clock = { t: -1, since: performance.now() }; frozen = false;
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

/** A fresh AudioContext in place of one iOS won't give back: only ever inside a gesture (so it may start). */
function rebuild(why) {
  const old = ctx;
  ctx = null; musicBus = null; sfxBus = null;
  if (!createContext()) { ctx = old; return; }
  stuck = false; rebuilds++; lastWhy = why; askedAt = 0; gestureAskAt = 0;
  audioLog(`rebuild #${rebuilds} (${why})`);
  try { old.onstatechange = null; old.close().catch(() => {}); } catch { /* gone */ }
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
  if (frozen) return 'frozen clock';
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
  if (!ctx && !createContext()) return;
  const s = ctx.state;
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

/** The engine's state for tests + the readout. */
export const audioHealth = () => ({ state: ctx ? ctx.state : 'none', stuck, frozen, rebuilds, why: lastWhy, unlocked, visible: visibleNow,
  time: ctx ? +ctx.currentTime.toFixed(2) : 0, session: sessionInfo() });
function sessionInfo() { try { const a = navigator.audioSession; return a ? `${a.type || '?'}/${a.state || '?'}` : ''; } catch { return ''; } }

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
  if (!ctx || !unlocked || document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ask('retry');
}

// THE CLOCK WATCH: a 'running' context whose clock doesn't move for FROZEN_MS is frozen (the next tap rebuilds it)
let clock = { t: -1, since: 0 };
function watchClock() {
  if (!ctx || !unlocked || !visibleNow || document.visibilityState !== 'visible' || ctx.state !== 'running') { clock = { t: -1, since: performance.now() }; if (frozen && ctx && ctx.state !== 'running') frozen = false; return; }
  const now = performance.now(), t = ctx.currentTime;
  if (t !== clock.t) { if (frozen) audioLog('clock moving again'); clock = { t, since: now }; frozen = false; return; }
  if (!frozen && now - clock.since > FROZEN_MS) { frozen = true; audioLog(`clock frozen at ${t.toFixed(2)} s (says running)`); }
}

export function onVisibility(fn) {
  visibilityListeners.add(fn);
}

export function installAudio() {
  // the gestures (capture, on the document: a tap ANYWHERE counts, before any handler can stop it) — every tap, never removed
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
  // typing on the iOS system keyboard / focusing inputs / coming back to the app: try again
  for (const ev of ['input', 'focusin', 'touchstart']) document.addEventListener(ev, kick, { capture: true, passive: true });
  window.addEventListener('focus', () => { audioLog('focus'); kick(); });
  window.addEventListener('blur', () => audioLog('blur'));
  // hidden / shown: visibilitychange, + pagehide / pageshow for the back-forward cache (a restored page may get no visibilitychange)
  const setVisible = visible => {
    if (visible === visibleNow) { if (visible) kick(); return; }
    visibleNow = visible;
    if (visible) visibleAt = performance.now();
    if (ctx) {
      if (visible && unlocked) ask('back on screen');
      else if (!visible) { askedAt = 0; gestureAskAt = 0; frozen = false; if (ctx.state === 'running') ctx.suspend().catch(() => {}); }
    }
    visibilityListeners.forEach(fn => fn(visible));
  };
  document.addEventListener('visibilitychange', () => { audioLog(`visibility ${document.visibilityState}`); setVisible(document.visibilityState === 'visible'); });
  window.addEventListener('pagehide', e => { audioLog(`pagehide${e.persisted ? ' (persisted)' : ''}`); setVisible(false); });
  window.addEventListener('pageshow', e => { audioLog(`pageshow${e.persisted ? ' (persisted)' : ''}`); setVisible(document.visibilityState === 'visible'); });
  // iOS 17+: the audio session comes back after a call / Siri / another app's audio
  try { if (navigator.audioSession && navigator.audioSession.addEventListener) navigator.audioSession.addEventListener('statechange', () => { audioLog(`session ${sessionInfo()}`); kick(); }); } catch { /* unsupported */ }
  setInterval(watchClock, 250);
}
