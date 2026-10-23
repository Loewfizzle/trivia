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
//  - THE AUDIO SESSION (M4, the owner's iPhone AFTER M3 — the AUDIO panel's evidence: every NEW context, created inside a real
//    touchend, said 'running' (resume ok) and never rendered one quantum: its clock stayed at 0.00, the probe heard nothing, while
//    the song element's own clock ran on; six rebuilds, none ever started. A context that was started but is never called is
//    what Core Audio does when the app's AVAudioSession isn't ACTIVE. This page set navigator.audioSession.type = 'ambient'
//    (iOS 17+) on every context: an AMBIENT session is deactivated whenever the app leaves the foreground and iOS gives it no
//    "resume" after another app's audio — and WebKit re-activates it for a media element's playback, not for Web Audio alone
//    (the element here plays through the graph, so its sound only exists in the dead graph). Now: 'playback' while the music is
//    ON — the category every music app uses: it survives the background and is re-activated with the element; it also PLAYS
//    WITH THE RING / SILENT SWITCH ON SILENT, like YouTube in Safari, and stops other apps' music while ours plays —, 'ambient'
//    only while the music is OFF or muted (effects only: mixes with other apps, respects the switch). Set BEFORE the context is
//    made and re-asserted inside every tap, on the way back on screen and when the setting changes.
//  - THE REBUILD LOOP (M4): a rebuilt context that freezes too is NOT rebuilt again on the next tap for REBUILD_GAP (iOS's hardware
//    contexts are finite and every live graph costs a real-time thread — her readout showed 5–6 % slow frames in that state);
//    music.js takes THE DIRECT PATH instead (a plain <audio> element, iOS's own pipeline — docs/audio.md#m4). A context that
//    never started (clock 0.00 after 0.7 s of 'running') is frozen at once, not after 1.5 s. The old context is closed FIRST,
//    and the panel counts the contexts alive (made − closed).
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
export const isUnlocked = () => unlocked && !!ctx && ctx.state === 'running';
/** Inside a gesture's handling right now (iOS lets a media element / a context start only here)? */
export const inGesture = () => performance.now() - gestureAt < 60;
/** May the music start now? Running, or inside a gesture that just asked the context to run (it will). */
export const canStart = () => unlocked && !!ctx && ctx.state !== 'closed' && (ctx.state === 'running' || inGesture());
/** The context's clock: is it moving? (false = frozen: 'running' but stopped) */
export const clockFrozen = () => frozen;
/** The graph can be trusted: running, not frozen, its clock seen moving for ≥ 2 s (music.js moves a direct song back onto it then). */
export const graphOk = () => !!ctx && ctx.state === 'running' && !frozen && clock.t > 0 && clock.moving > 0 && performance.now() - clock.moving > 2000;

// ---- THE AUDIO SESSION (iOS 17+): 'playback' while the music is on, 'ambient' (effects only) while it is off / muted
let sessionSet = { type: '', at: 0, why: '' };
const sessionWant = () => (settings.muted || settings.musicOff ? 'ambient' : 'playback');
function setSession(why) {
  let a;
  try { a = navigator.audioSession; } catch { a = null; }
  if (!a) return;
  const want = sessionWant();
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
  clock = { t: -1, since: performance.now(), moving: 0 }; frozen = false;
  return ctx;
}

// Perceptual-ish volume curve: slider 0..1 -> gain.
const curve = v => Math.max(0, Math.min(1, v)) ** 2;

function applyVolumes(instant) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const m = settings.muted || settings.musicOff ? 0 : curve(settings.music);
  const s = settings.muted ? 0 : curve(settings.sfx);
  // (a ramp on a clock that isn't moving never arrives: set it straight — M4)
  if (instant || frozen || t === 0) { musicBus.gain.value = m; sfxBus.gain.value = s; return; }
  musicBus.gain.setTargetAtTime(m, t, 0.08);
  sfxBus.gain.setTargetAtTime(s, t, 0.05);
}
onSettings(() => { applyVolumes(false); setSession('settings'); });

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

// close a context we're done with (counting the ones that really went away)
function closeContext(c) {
  try { c.onstatechange = null; Promise.resolve(c.close()).then(() => { closed++; }, () => {}); } catch { /* gone */ }
}

/** A fresh AudioContext in place of one iOS won't give back: only ever inside a gesture (so it may start). The old one is closed FIRST. */
function rebuild(why) {
  const old = ctx;
  closeContext(old);
  ctx = null; musicBus = null; sfxBus = null;
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
export const audioHealth = () => ({ state: ctx ? ctx.state : 'none', stuck, frozen, rebuilds, why: lastWhy, unlocked, visible: visibleNow,
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
  if (!ctx || !unlocked || document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ask('retry');
}

// THE CLOCK WATCH: a 'running' context whose clock doesn't move for FROZEN_MS is frozen (the next tap rebuilds it, or the direct
// path plays); one that NEVER started (still 0.00 after NEVER_STARTED_MS) counts at once
let clock = { t: -1, since: 0, moving: 0 };   // moving: performance.now() since when the clock has been seen moving (0 = not yet)
function watchClock() {
  if (!ctx || !unlocked || !visibleNow || document.visibilityState !== 'visible' || ctx.state !== 'running') { clock = { t: -1, since: performance.now(), moving: 0 }; if (frozen && ctx && ctx.state !== 'running') frozen = false; return; }
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
    if (visible) { visibleAt = performance.now(); setSession('back on screen'); }
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
  try { if (navigator.audioSession && navigator.audioSession.addEventListener) navigator.audioSession.addEventListener('statechange', () => { audioLog(`session ${sessionInfo()}`); setSession('session change'); kick(); }); } catch { /* unsupported */ }
  setInterval(watchClock, 250);
}
