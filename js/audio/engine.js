// Web Audio core: one AudioContext, a music bus and an SFX bus into a soft limiter.
//
// Mobile rules handled here:
//  - iOS/Chrome only allow audio after a user gesture: the context is created and
//    resumed on the first tap/key (and re-resumed on later taps if iOS suspended it).
//  - Audio pauses when the page is hidden and resumes when it comes back. iOS often refuses
//    that resume (or 'interrupts' the context, e.g. around the system keyboard), so every
//    later tap/keystroke/focus retries, and onResume listeners restart playback.
//  - navigator.audioSession.type = 'ambient' (iOS 17+): mixes politely with other
//    apps' audio and respects the ring/silent switch.
import { settings, onSettings } from './settings.js';

let ctx = null;
let musicBus = null;
let sfxBus = null;
let unlocked = false;
const unlockListeners = new Set();
const visibilityListeners = new Set();
const resumeListeners = new Set();

export const getContext = () => ctx;
export const getMusicBus = () => musicBus;
export const getSfxBus = () => sfxBus;
export const isUnlocked = () => unlocked && !!ctx && ctx.state === 'running';

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* unsupported */ }
  ctx = new AC({ latencyHint: 'interactive' });
  ctx.onstatechange = () => {
    if (ctx.state === 'running') resumeListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
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

function unlock() {
  if (!ctx && !createContext()) return;
  if (document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  if (!unlocked) {
    unlocked = true;
    // A 1-sample silent buffer started inside the gesture fully unlocks iOS.
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(0);
    unlockListeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
  }
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

// Retry a resume (no-op when already running or not yet unlocked by a gesture).
function kick() {
  if (!ctx || !unlocked || document.visibilityState !== 'visible') return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
}

export function onVisibility(fn) {
  visibilityListeners.add(fn);
}

export function installAudio() {
  for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
  // typing on the iOS system keyboard / focusing inputs / coming back to the app: try again
  for (const ev of ['input', 'focusin', 'touchstart']) document.addEventListener(ev, kick, { capture: true, passive: true });
  window.addEventListener('pageshow', kick);
  window.addEventListener('focus', kick);
  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible';
    if (ctx) {
      if (visible && unlocked) ctx.resume().catch(() => {});
      else if (!visible) ctx.suspend().catch(() => {});
    }
    visibilityListeners.forEach(fn => fn(visible));
  });
}
