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
//  - THE FADE ON LEAVING (DFIX3 ADD-ON, the owner's iPhone: a short high hum when switching out of Safari with the sound on — the context
//    was suspended INSTANTLY, mid-buffer, and iOS clicked / looped the last buffer): EVERY sound path ends on ONE MASTER gain (music bus +
//    SFX bus → the limiter → master → the speaker). On hidden / pagehide / freeze the master ramps to 0 ON THE AUDIO CLOCK first (scheduled
//    synchronously — iOS may freeze the page's JS right after pagehide, so the ramp must already be on the audio thread before anything
//    waits), the suspend follows ~110 ms later. Back on screen (visible / pageshow / resume): the master is set to 0, the context asked to
//    run, and the moment it runs everything ramps back up over ~150 ms — never a jump to full (no pop). THE DIRECT PATH's plain <audio>
//    (iOS ignores an element's volume) is paused at the START of the fade; the graph's voices after it (music.js). The clock watch, the
//    unlock, the retries + the rebuilds are unchanged. The log reads: fade out → suspended after the fade → fade in.
//  - CITY D — THE LEAVING SQUEAL WITH EFFECTS ON (the owner's iPhone: music off, effects ON, the daily screen → leaving Safari → the glitch
//    again; CITY A fixed only muted / everything off): on the EARLIEST leave signal (blur on a touch phone · pagehide · hidden · freeze) the
//    master goes to 0 AT ONCE (setValueAtTime — no ramp: a 90-ms ramp was still sounding when iOS froze the page), every BED / LOOP source
//    stops (holdBed — the neon hum, a game's loop), and the context suspends ~60 ms later (the zeros already on the audio thread). Back on
//    screen: resume → the master ramps up from 0 + the beds ramp back in. A blur that comes back while the page stayed visible (the share
//    sheet, a system alert) brings it all back after ~400 ms — and a desktop's blur (another window clicked) is not a leave at all.
//  - FIXES R1 — THE SQUEAL IN THE HOME-SCREEN APP (the owner: fixed in Safari by CITY D, still heard in the saved home-screen app, leaving
//    AND coming back). A standalone app gets its leave / return signals in another order — often NO blur, a late (or no) visibilitychange —
//    and iOS INTERRUPTS the context as the app goes (and may resume it before the page's JS runs again). Now: (1) the context's own
//    'interrupted' is a LEAVE signal too — the master to 0 at once, the beds stopped, the fade back waits for 'running' (a resume is asked only
//    if the page is still on screen BLUR_BACK_MS later — never fighting the OS on its way out); (2) a context that turns 'running' while the
//    page is NOT on screen (the OS gave it back in the background) is silenced + suspended at once — the sound comes back only through the
//    return (visible → resume → running → the ramp from 0); (3) THE REVIEW A7: a blur's return that finds the context not running asks for it
//    + leaves the fade pending (it was resumeBeds() alone — the master stayed at 0 until the next hide / show); (4) THE REVIEW A15: running
//    while hushed → hushed again (NOTHING RUNS). navigator.audioSession stays 'playback' with the music on: an 'ambient' session is what left
//    the graph dead after the background (M4, above) — not used as a squeal fix.
//  - FIXES R2 — THE SQUEAL IS THE CUT (the owner's tests, Nov 15 7:27 pm, iOS 18.7: ALL sound off → leaving = no squeal; music ON + effects
//    OFF → no squeal; and switching the SOUND EFFECTS toggle OFF squeals by itself). The effects' cut was abrupt in three places, measured
//    by tests/integration/audio-cut.mjs (the master + the effects bus recorded sample by sample): (1) THE HUSH suspended the context 60 ms
//    into its 90-ms ramp — the last buffer rendered before the suspend still sounding (−51 dBFS): what iOS's output keeps playing; (2) the
//    effects bus went down on setTargetAtTime — never exactly 0 (−66 dBFS a quarter-second later) — and the city's LOOPS were dropped at the
//    next pump, mid-sound; (3) on leaving, the beds were stopped in the same instant as the master's step to 0 (a loop cut with the bus at
//    49 %). Now EVERY CUT runs in one order: the bus / the master RAMPS to exactly 0 (linear: the effects bus CUT_S, the hush FADE_OUT_S,
//    the leave LEAVE_S — short, the page may freeze any moment after a blur), a loop is stopped only once its sound is 0 (sfxSilent() ·
//    the beds after the leave's ramp), and the context is suspended only after THE ZEROS FIRST — the output exactly 0 for ZERO_HOLD_MS.
//    The way back is unchanged: the master from 0, ramped up once the context RUNS. THE PHONE'S ROW (kind 'audio', AUDIO CUT in /admin —
//    the owner's phone or &debug=1 only): each cut's engine state, the session, the master at the suspend and the zeros held before it.
//  - THE LOG (audioLog / audioEvents): the last events with times — what the &debug=1 AUDIO block shows (audio/diag.js).
import { settings, onSettings } from './settings.js';

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

// ---- THE AUDIO SESSION (iOS 17+): 'playback' while the music is on, 'ambient' (effects only) while it is off / muted — and
// 'play-and-record' while THE INTERCOM holds the mic (CC-B review, the owner's iPhone: a 'playback' session can't capture, so
// getUserMedia failed and the desk said "no mic on this device")
let sessionSet = { type: '', at: 0, why: '' };
let micHeld = 0;
const sessionWant = () => (micHeld ? 'play-and-record' : settings.muted || settings.musicOff ? 'ambient' : 'playback');
/** THE INTERCOM: the mic is wanted (on) / let go (off) — sets the session synchronously (call it inside the hold's own gesture). */
export function micSession(on) { micHeld = Math.max(0, micHeld + (on ? 1 : -1)); setSession(on ? 'mic on' : 'mic off'); }
export const sessionType = () => { try { return (navigator.audioSession && navigator.audioSession.type) || ''; } catch { return ''; } };
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
      pauseBeds('interrupted'); pendingFadeIn = true;
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
onSettings(() => { applyVolumes(false); setSession('settings'); hushCheck('settings'); });

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
  if (want) { audioLog(`hush (${why}) — the master to 0, then the context suspended`); hushNow(why); return; }
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
  try { c.onstatechange = null; Promise.resolve(c.close()).then(() => { closed++; }, () => {}); } catch { /* gone */ }
}

/** A fresh AudioContext in place of one iOS won't give back: only ever inside a gesture (so it may start). The old one is closed FIRST. */
function rebuild(why) {
  const old = ctx;
  closeContext(old);
  ctx = null; musicBus = null; sfxBus = null; master = null;
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
export const audioHealth = () => ({ state: ctx ? ctx.state : 'none', hushed, stuck, frozen, rebuilds, why: lastWhy, unlocked, visible: visibleNow, master: master ? +master.gain.value.toFixed(3) : null,
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

// ---- THE BEDS (CITY D): every LOOPING source registers here — { pause(why), resume() }; on leaving each stops AT ONCE, back on screen each
// ramps back in. A lazy chunk (a game's sounds) reaches it through the hub globalThis.__nsAudioBeds (THE STALE-MODULE RULE)
const beds = new Set();
let bedsPaused = false;
export function holdBed(bed) { beds.add(bed); if (bedsPaused) { try { bed.pause('left'); } catch { /* fine */ } } return () => beds.delete(bed); }
globalThis.__nsAudioBeds = holdBed;
export const bedCount = () => beds.size;
function pauseBeds(why) { bedsPaused = true; for (const b of [...beds]) { try { b.pause(why); } catch { /* gone */ } } }
function resumeBeds() { if (!bedsPaused) return; bedsPaused = false; for (const b of [...beds]) { try { b.resume(); } catch { /* gone */ } } }
// ---- THE FADE ON LEAVING (DFIX3 ADD-ON → CITY D): the master to 0 AT ONCE on the audio clock + the beds stopped, the suspend follows; back = 0 → up once running
function fadeOut(why) {
  clearTimeout(fadeT); clearTimeout(blurT); blurT = 0;
  const c = ctx;
  if (!c || !master || c.state !== 'running') { pauseBeds(why); if (c && c.state === 'running') c.suspend().catch(() => {}); return; }
  // (FIXES R2: the master RAMPS to 0 over LEAVE_S (it stepped — and the beds were cut in that same instant); the beds stop once it's 0; the
  //  suspend after THE ZEROS FIRST. A blur already ramped it: then the ramp is already 0 and this only keeps it there.)
  const already = master.gain.value < 1e-5 && blurred === false && bedsPaused;
  quiet(c, LEAVE_S);
  if (!already) cutStart('leave');
  audioLog(`fade out (${why}) — the master 0 at once`);
  setTimeout(() => { if (!visibleNow) pauseBeds(why); }, Math.round(LEAVE_S * 1000) + 10);
  fadeT = setTimeout(() => { if (ctx === c && !visibleNow && c.state === 'running') { cutSuspend(c); c.suspend().then(() => { if (ctx === c) audioLog('suspended after the fade'); }, () => {}); } }, Math.round(LEAVE_S * 1000) + ZERO_HOLD_MS);
}
/** the master to 0 now — no ramp (an INTERRUPTED context renders nothing: a ramp there never runs) */
function silence(c) { try { const t = c.currentTime, g = master.gain; g.cancelScheduledValues(t); g.setValueAtTime(0, t); } catch { /* closed */ } }
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
  // (FIXES R2: a short ramp, then the beds — never a loop cut while it sounds)
  if (master && ctx.state === 'running') { quiet(ctx, LEAVE_S); cutStart('leave'); audioLog('blur — the master 0 at once'); }
  setTimeout(() => { if (blurred || !visibleNow) pauseBeds('blur'); }, Math.round(LEAVE_S * 1000) + 10);
  clearTimeout(blurT);
  blurT = setTimeout(blurBack, BLUR_BACK_MS);
}
function blurBack() {
  blurT = 0;
  if (!blurred || !visibleNow || document.visibilityState === 'hidden') return;
  blurred = false;
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
  if (visible) { visibleAt = performance.now(); setSession('back on screen'); }
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

// ---- FIXES R2 — THE PHONE'S ROW: each CUT (effects off · muted · leave) → its trace; at the suspend: the master + the zeros held. ONE row a page
// per kind of cut, kind 'audio' (AUDIO CUT in /admin's phone reports) — only from the owner's phone (body.rd-owner) or with &debug=1; a leave's
// row waits in localStorage for the return / the next load (the page may be frozen right after it). window.__audioCut.last() = the last one.
let cut = null, lastCut = null;
const cutSent = new Set();
const CUT_KEY = 'ns:audiocut';
function cutStart(why) {
  if (!ctx || (cut && cut.why === why && performance.now() - cut.at < 1500)) return;
  cut = { why, at: performance.now(), from: ctx.state, session: sessionInfo() || 'n/a', master: master ? +master.gain.value.toFixed(3) : null, sfx: sfxBus ? +sfxBus.gain.value.toFixed(3) : null, beds: beds.size, visible: document.visibilityState };
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
const reportable = () => { try { return document.body.classList.contains('rd-owner') || /[?&]debug=1(?:&|$)/.test(location.search); } catch { return false; } };
function report(row) {
  if (!row || cutSent.has(row.why) || !reportable()) return;
  if (row.why === 'leave' && document.visibilityState !== 'visible') { try { localStorage.setItem(CUT_KEY, JSON.stringify(row)); } catch { /* fine */ } return; }
  cutSent.add(row.why);
  if (navigator.webdriver) return;   // (a test browser builds the row — window.__audioCut — and sends nothing)
  try {
    const body = JSON.stringify({ p: 'report', r: { kind: 'audio', text: row.text } });
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
  window.addEventListener('focus', () => { audioLog('focus'); if (blurred) { clearTimeout(blurT); blurBack(); } kick(); });
  window.addEventListener('blur', () => { audioLog('blur'); onBlur(); });
  // hidden / shown: visibilitychange, + pagehide / pageshow for the back-forward cache (a restored page may get no visibilitychange), + the
  // Page Lifecycle's freeze / resume (DFIX3 ADD-ON) — each through THE FADE ON LEAVING (above)
  document.addEventListener('visibilitychange', () => { audioLog(`visibility ${document.visibilityState}`); setVisible(document.visibilityState === 'visible', 'hidden'); });
  window.addEventListener('pagehide', e => { audioLog(`pagehide${e.persisted ? ' (persisted)' : ''}`); setVisible(false, 'pagehide'); });
  window.addEventListener('pageshow', e => { audioLog(`pageshow${e.persisted ? ' (persisted)' : ''}`); setVisible(document.visibilityState === 'visible'); });
  document.addEventListener('freeze', () => { audioLog('freeze'); setVisible(false, 'freeze'); });
  document.addEventListener('resume', () => { audioLog('resume (lifecycle)'); setVisible(document.visibilityState === 'visible'); });
  // iOS 17+: the audio session comes back after a call / Siri / another app's audio
  try { if (navigator.audioSession && navigator.audioSession.addEventListener) navigator.audioSession.addEventListener('statechange', () => { audioLog(`session ${sessionInfo()}`); setSession('session change'); kick(); }); } catch { /* unsupported */ }
  setInterval(watchClock, 250);
  setTimeout(sendKept, 4000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(sendKept, 1500); });
}
