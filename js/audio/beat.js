// THE BEAT (PARTY NIGHTS, docs/title.md + docs/audio.md#the-beat): which song is sounding on this phone right now, its tempo and
// position — the city breathes to it. In a lobby that's the room's synced song (every phone the same); on the title this phone's
// mood song. null when nothing can be followed (before the first tap, music off or muted, CLASSIC menu music, a song still
// loading): the city then breathes slowly on its own (core/party.js#advanceBeat; City 2.0: core/harbor-beat.js).
//
// NEON PASS 5 (City 2.0): the song's BEAT GRID (data/mood-music.json `grid`: the exact bpm, the first beat, the downbeat) and
// THE SOUND ITSELF — beatKick() reads the low end (kick + bass) off the music bus through an AnalyserNode and reports the kicks
// it hears (core/harbor-beat.js#onsetStep), late by the output's latency so the light lands when the sound does.
import { nowPlaying, musicOut } from './music.js';
import { lobbyNow } from './lobby-music.js';
import { moodData } from './mood.js';
import { settings } from './settings.js';
import { getContext, getMusicBus, clockFrozen, onRebuild, onResume } from './engine.js';
import { createOnsets, onsetStep, kickLag, createLead, leadKick, leadRefresh, heardPos, createSongClock, songClockStep, kickErrWide, createHeard, heardStep, heardSkew } from '../core/harbor-beat.js';

// ---- WHEN THE BEAT IS HEARD (M2, the owner: the party's sync "kind of — not perfect")
// Two delays sit between a song's clock and the ear:
//  1. OUTPUT: the graph → the speaker. Chrome reports `outputLatency`; Safari does NOT (only a tiny `baseLatency`), so on an iPhone
//     the lights ran a little early. Without it: the context's output timestamp (how far the graph runs ahead of what is heard),
//     else a measured-ish iPhone speaker figure.
//  2. THE ELEMENT'S LEAD: the mood song is an <audio> element; its currentTime can run ahead of (or behind) the samples that reach
//     the graph (WebKit buffers the element's audio on the way in). Nothing reports it — so each phone MEASURES it: every strong kick
//     the kick listener hears on a song with a trusted grid whose kicks land on its beats (agree ≥ 0.5) says how far the element's
//     clock is from that beat, minus the listener's own lag (KICK_LAG, measured offline on the party songs). The median of the last
//     kicks is the lead; kept per device (localStorage) so the next visit starts in sync. The lobby's synced song (decoded buffers on
//     the audio clock) learns its own (≈ 0).
// M3 (her iPhone: "sync out 18 ms · lead −42 ms"): the sign is right (core/harbor-beat.js has the maths + its test); the learning now
// takes only kicks within ±80 ms (a fifth of a beat) of a beat — a 16th-note bass hit no longer counts — clamped to −80…+120 ms;
// the listener's delay follows the frame rate (a 30 Hz phone hears a kick ~8 ms later); a heard kick is released when it is HEARD
// (its detection − the listener's delay + the output), no longer a listener's delay late.
const IOS_OUT = 0.02;                // an iPhone's built-in speaker after the graph when Safari reports nothing
const WEBKIT = typeof navigator !== 'undefined' && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Android/.test(navigator.userAgent);
const stamp = { v: 0, at: -1e9 };
function stampLatency(c) {
  const now = performance.now();
  if (now - stamp.at < 250) return stamp.v;
  stamp.at = now;
  try {
    const ts = c.getOutputTimestamp && c.getOutputTimestamp();
    if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
      const l = (c.currentTime - ts.contextTime) - (now - ts.performanceTime) / 1000;
      if (l > 0.003 && l < 0.5) stamp.v = stamp.v ? stamp.v + (l - stamp.v) * 0.2 : l;
    }
  } catch { /* unsupported */ }
  return stamp.v;
}
/** the audible delay after the graph (the speaker / Bluetooth's buffering) — capped */
function outLatency() {
  const c = getContext();
  if (!c) return 0;
  let l = c.outputLatency > 0 ? c.outputLatency : stampLatency(c);
  if (!(l > 0)) l = WEBKIT ? IOS_OUT : 0;
  return Math.min(0.35, Math.max(0, l + (c.baseLatency || 0)));
}
const CAL_KEY = 'na:beatcal';
const cal = (() => {
  try { const s = JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); if (s) return { el: createLead(s.el), buf: createLead(s.buf) }; } catch { /* private mode */ }
  return { el: createLead(), buf: createLead() };
})();
let calSaved = 0;
function learn(kind, wide, grid, nowMs) {
  const r = leadKick(cal[kind], wide, grid, nowMs);
  if (r !== 'learn' && r !== 'done') return;
  if (performance.now() - calSaved > 10000) {
    calSaved = performance.now();
    // (the device value is saved within the ordinary range — a re-measured return offset is this visit's, createLead clamps it)
    try { localStorage.setItem(CAL_KEY, JSON.stringify({ el: cal.el.n ? +cal.el.v.toFixed(3) : null, buf: cal.buf.n ? +cal.buf.v.toFixed(3) : null })); } catch { /* private mode */ }
  }
}
// FP2 — RE-MEASURE THE LEAD (core/harbor-beat.js#leadRefresh): on every resume / context rebuild / page return / output route change
// (and on a SKEW seen on its own) the lead is re-measured from the next kicks heard, within a few bars; the output latency is re-read
// fresh too (the smoothed timestamp estimate starts over).
function refresh(why) {
  const now = performance.now();
  for (const k of ['el', 'buf']) { const c = cal[k]; if (!c.fast) leadRefresh(c, why, now); else { c.fast.why = why; c.fast.errs.length = 0; c.fast.seen = 0; } }
  stamp.v = 0; stamp.at = -1e9;
}
let routeOut = null;           // the reported outputLatency last seen: a jump > 15 ms = a new route (speaker ↔ headphones ↔ Bluetooth)

// FP — THE SONG CLOCK (core/harbor-beat.js#songClockStep): the beat's position always comes from the SONG — the element's
// currentTime — run forward between its (coarse, iOS) updates and re-anchored on every event that can move the song against the
// frame clock. (Replaces NEON PASS 6's dequantize, which carried a stuck reading forward 0.5 s and then let it snap back.)
const sclock = createSongClock();
let pendWhy = '';
const reanchor = why => { pendWhy = why; };     // (the latest event names the re-anchor)
const wired = new WeakSet();
const EL_EVENTS = ['play', 'playing', 'pause', 'seeking', 'seeked', 'waiting', 'stalled', 'ratechange'];
function wire(el) {
  if (!el || wired.has(el) || typeof el.addEventListener !== 'function') return;
  wired.add(el);
  for (const e of EL_EVENTS) el.addEventListener(e, () => reanchor(e));
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { const v = document.visibilityState === 'visible'; reanchor(v ? 'visible' : 'hidden'); if (v) refresh('visible'); });
  addEventListener('pageshow', () => { reanchor('pageshow'); refresh('pageshow'); });
  try { if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', () => refresh('route')); } catch { /* unsupported */ }
}
try { onRebuild(() => { reanchor('rebuild'); refresh('rebuild'); }); onResume(() => { reanchor('ctx resume'); refresh('resume'); }); } catch { /* no engine (tests) */ }
let stepAt = -1, stepPos = -1;
/** the song's position on its own clock this frame (s), the same value for every caller in the frame */
function songPos(np, nowMs) {
  if (nowMs === stepAt && sclock.id === np.id) return stepPos;
  if (np.el) wire(np.el);
  const why = pendWhy; pendWhy = '';
  stepAt = nowMs;
  return (stepPos = songClockStep(sclock, { id: np.id, t: np.at, rate: np.rate, paused: false }, nowMs, why));
}
/** why the beat is calm right now (the &debug=1 readout: "beat calm — music off") — '' when a song is being followed */
let why = '';
export const beatWhy = () => why;
export function beatSource(nowMs = performance.now()) {
  if (settings.musicOff) { why = 'music off'; return null; }
  if (settings.muted) { why = 'muted'; return null; }
  const lob = lobbyNow(), np = lob || nowPlaying();
  if (!np || !np.id) { if (sclock.id) songClockStep(sclock, null, nowMs); const c = getContext(); why = !c || c.state !== 'running' ? 'tap for sound' : settings.menuMusic === 'classic' ? 'classic music' : 'no song'; return null; }
  const d = moodData();
  if (!d) { why = 'songs loading'; return null; }
  const song = d.songs && d.songs[np.id];
  if (!song || !(song.bpm > 0)) { why = 'song unknown'; return null; }
  const all = song.grid && song.grid.bpm > 0 ? song.grid : null;
  // (CITY 2.0 MUSIC: add-city2-music.py marks a grid it couldn't verify — `trusted: false`: the city then follows the kicks it hears)
  const untrusted = !!(all && all.trusted === false);
  const g = untrusted ? null : all;
  why = '';
  // 7a: the mood song on THE DIRECT ELEMENT (M4: the graph is dead) — iOS's own media pipeline plays it, so its currentTime is what is
  // heard (AVFoundation's clock follows the audio device and compensates its output latency — that is how video stays in sync, Bluetooth
  // included). Neither the graph's output latency nor the learned lead (the graph tap's offset from the element) applies: 0 + 0. If
  // anything this errs toward the light a hair EARLY, the side the eye forgives (a sound behind its light is natural; ahead is not).
  const direct = !lob && musicOut() === 'direct';
  // (pos AS HEARD: the element's / the buffer's clock runs ahead of the speaker by the output latency + the element's own lead)
  const at = songPos(np, nowMs);
  const pos = direct ? heardPos(at, DIRECT_OUT, 0) : heardPos(at, outLatency(), cal[lob ? 'buf' : 'el'].v);
  return { id: np.id, bpm: g ? g.bpm : song.bpm, pos, grid: g, untrusted, loose: untrusted ? all : null, direct, snap: sclock.snap };
}
const DIRECT_OUT = 0;              // the direct element's output estimate (s): its clock is the presentation time already

/** the song sounding on this phone and what the beat knows of it (the preview panel's MUSIC row, the readout): { id, at, dur, bpm, grid:
 *  'trusted' | 'NOT TRUSTED' | 'none', lock } or null when no mood song is sounding */
export function songInfo() {
  const np = lobbyNow() || nowPlaying();
  if (!np || !np.id) return null;
  const d = moodData(), s = d && d.songs && d.songs[np.id];
  const g = s && s.grid && s.grid.bpm > 0 ? s.grid : null;
  return { id: np.id, at: np.at, dur: s ? s.dur : 0, bpm: g ? g.bpm : null, grid: !g ? 'none' : g.trusted === false ? 'NOT TRUSTED' : 'trusted', lock: g && g.lock != null ? g.lock : null };
}

// ---------------------------------------------------------------- THE SOUND: the low end, off the music bus
// music bus → a low-pass (150 Hz: the kick + the bass) → an AnalyserNode → a silent gain → the destination (WebKit only runs
// nodes that reach the destination). Built the first time a party asks; the RMS of the analyser's last window a frame.
let an = null;
const ons = createOnsets();
const queue = [];              // the hits heard, waiting out the output latency: [release (ms), strength]
let heardAt = -1e9;
let frameS = 1 / 60, lastFrame = 0;   // the frame interval (smoothed): the listener's delay depends on it
function analyser() {
  const ctx = getContext(), bus = getMusicBus();
  if (!ctx || !bus) return null;
  if (an && an.ctx === ctx) return an;
  try {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 0.7;
    const a = ctx.createAnalyser(); a.fftSize = 1024; a.smoothingTimeConstant = 0;
    const z = ctx.createGain(); z.gain.value = 0;
    bus.connect(lp); lp.connect(a); a.connect(z); z.connect(ctx.destination);
    an = { ctx, a, f: typeof a.getFloatTimeDomainData === 'function' ? new Float32Array(a.fftSize) : null, b: new Uint8Array(a.fftSize) };
  } catch (e) { console.warn('beat analyser', e); an = null; }
  return an;
}
/**
 * This frame's kick (call once a frame while a party wants the beat): { hit (0..1 a kick that sounds now, its strength), live
 * (the analyser hears the music: a signal in the last 2 s) } — or null (no music, muted, no Web Audio).
 */
// 7a — THE DEAF LISTENER: a graph whose clock has stopped (iOS after the background) keeps the analyser's LAST window for ever — the
// music that was playing when it froze. Its RMS then never changes, so it looked "live" (a signal in the last 2 s) with no kicks: the
// clock read that as a breakdown and calmed the city to a quarter (hb.level 0.25) — the owner's "the lights stopped pulsing" after
// coming back. The same RMS frame after frame (a real signal never repeats to 1e-7 for 8 frames), a frozen clock, or the song on the
// direct element = nothing heard.
let lastRms = -1, sameN = 0;
// FP — THE HEARD OFFSET (core/harbor-beat.js#heardStep): where the strong kicks land vs the grid (± half a beat), per song
const heard = createHeard();
let heardId = null, heardAnch = 0;
export function beatKick(nowMs = performance.now()) {
  if (settings.musicOff || settings.muted || !(lobbyNow() || nowPlaying())) return null;
  // (the song on THE DIRECT ELEMENT or the graph frozen: the listener can't hear it — no kicks, not live; the grid leads: 'direct-grid')
  if ((!lobbyNow() && musicOut() === 'direct') || clockFrozen()) { heardAt = -1e9; queue.length = 0; sameN = 0; return { hit: 0, live: false, deaf: true }; }
  const A = analyser();
  if (!A || A.ctx.state !== 'running') return null;
  let s = 0, n;
  if (A.f) { A.a.getFloatTimeDomainData(A.f); n = A.f.length; for (let i = 0; i < n; i++) s += A.f[i] * A.f[i]; }
  else { A.a.getByteTimeDomainData(A.b); n = A.b.length; for (let i = 0; i < n; i++) { const v = (A.b[i] - 128) / 128; s += v * v; } }
  const rms = Math.sqrt(s / n);
  sameN = rms > 1e-3 && Math.abs(rms - lastRms) < 1e-7 ? sameN + 1 : 0; lastRms = rms;
  if (sameN >= 8) { heardAt = -1e9; return { hit: 0, live: false, deaf: true }; }
  if (rms > 1e-3) heardAt = nowMs;
  if (lastFrame && nowMs - lastFrame < 100) frameS += ((nowMs - lastFrame) / 1000 - frameS) * 0.05;
  lastFrame = nowMs;
  const lag = kickLag(frameS);
  { const ro = A.ctx.outputLatency > 0 ? A.ctx.outputLatency : null;
    if (ro != null && routeOut != null && Math.abs(ro - routeOut) > 0.015) refresh('route');
    if (ro != null) routeOut = ro; }
  const hit = onsetStep(ons, rms, nowMs / 1000);
  // (released when HEARD: the kick entered the graph a listener's delay ago, and sounds the output latency after that)
  if (hit > 0) queue.push([nowMs + Math.max(0, outLatency() - lag) * 1000, hit]);
  // a strong kick on a song whose kicks land on its trusted grid: how far the song's clock is from that beat (the element's lead)
  if (hit >= 0.6) {
    const lob = lobbyNow(), np = lob || nowPlaying(), d = moodData();
    const g = np && d && d.songs && d.songs[np.id] && d.songs[np.id].grid;
    if (g && g.bpm > 0 && g.trusted !== false && (g.agree == null || g.agree >= 0.5)) {
      const at = songPos(np, nowMs);
      if (heardId !== np.id) { heardId = np.id; heard.errs.length = 0; heard.n = 0; heard.steady = false; }
      if (heardAnch !== sclock.anchors) { heardAnch = sclock.anchors; heard.errs.length = 0; heard.steady = false; }   // (a re-anchor: what was measured before it is history)
      const wide = kickErrWide(at, g, lag), kind = lob ? 'buf' : 'el';
      if (wide != null) heardStep(heard, wide);
      // (FP2: a SKEW seen on its own — the kicks steadily off the lead — starts a re-measure too)
      if (!cal[kind].fast && heardSkew(heard, cal[kind].v)) refresh('skew');
      if (wide != null) learn(kind, wide, g, nowMs);
    }
  }
  let out = 0;
  while (queue.length && queue[0][0] <= nowMs) out = Math.max(out, queue.shift()[1]);
  // (the heard kicks steadily off the grid beyond the lead: not listened to — they'd add off-beat punches; the grid leads alone)
  if (heardSkew(heard, cal[lobbyNow() ? 'buf' : 'el'].v)) return { hit: 0, live: false, skew: true };
  return { hit: out, live: nowMs - heardAt < 2000 };
}
/** the debug view (window.__arcade.beat / the readout) */
export function beatDebug() {
  const c = getContext();
  return { analyser: !!an, peak: +ons.peak.toFixed(4), level: +ons.level.toFixed(4), latency: +outLatency().toFixed(3),
    reported: c ? +(c.outputLatency || 0).toFixed(3) : 0, base: c ? +(c.baseLatency || 0).toFixed(3) : 0, stamp: +stamp.v.toFixed(3), lead: +cal.el.v.toFixed(3), leadN: cal.el.errs.length, buf: +cal.buf.v.toFixed(3), bufN: cal.buf.errs.length,
    remeasure: remeasureOf(lobbyNow() ? cal.buf : cal.el),
    lag: +kickLag(frameS).toFixed(3), fps: Math.round(1 / frameS),
    clock: { id: sclock.id, pos: +sclock.pos.toFixed(3), err: +sclock.err.toFixed(3), stuck: sclock.stuck, anchors: sclock.anchors, why: sclock.why },
    heard: { v: +heard.v.toFixed(3), n: heard.n, steady: heard.steady, skew: heardSkew(heard, cal.el.v) } };
}
/** the &debug=1 readout's line: what the beat subtracts to land on the sound as HEARD */
/** FP2: the lead's re-measure for the readout: { state: 'measuring' | 'done' | 'gave up', why, from, to (ms), n (kicks agreeing / seen), ago (s) } | null */
function remeasureOf(c) {
  const ms = v => Math.round(v * 1000);
  if (c.fast && c.fast.seen > 0) return { state: 'measuring', why: c.fast.why, from: ms(c.fast.from), to: ms(c.v), n: c.fast.errs.length, seen: c.fast.seen };
  if (c.last && performance.now() - c.last.at < 20000) return { state: c.last.ok ? 'done' : 'gave up', why: c.last.why, from: ms(c.last.from), to: ms(c.last.to), n: c.last.kicks, ago: Math.round((performance.now() - c.last.at) / 1000) };
  return null;
}
export function syncLine() {
  const d = beatDebug(), r = d.remeasure, sg = v => `${v >= 0 ? '+' : '−'}${Math.abs(v)}`, kind = lobbyNow() ? 'buf' : 'el';
  // (FP2: the lead re-converging after a return: "lead −39 → +62 ms (re-measuring · 8 kicks · visible)"; then "(re-measured −39 → +107 · 4 s ago)")
  const lead = Math.round(cal[kind].v * 1000);
  const leadTxt = r && r.state === 'measuring' ? `lead ${sg(r.from)} → ${sg(lead)} ms (re-measuring · ${r.seen} kicks · ${r.why})`
    : r ? `lead ${sg(lead)} ms (${r.state === 'done' ? `re-measured ${sg(r.from)} → ${sg(r.to)}` : 're-measure gave up'} · ${r.ago} s ago)`
    : `lead ${sg(lead)} ms (${kind === 'buf' ? d.bufN : d.leadN} kicks)`;
  return `sync out ${Math.round(d.latency * 1000)} ms${d.reported ? '' : d.stamp ? ' (stamp)' : ' (est)'} · ${leadTxt} · lag ${Math.round(d.lag * 1000)} ms`;
}
/** FP — the readout's song-clock line: the last element reading vs the run-forward clock, the re-anchors (+ the last why), the heard
 *  kicks' offset from the grid (`~` = not steady yet, SKEW = steady + beyond the lead: the kicks are ignored) */
export function clockLine() {
  const d = beatDebug(), ms = v => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 1000))}`;
  return `clock el ${ms(d.clock.err)} ms${d.clock.stuck ? ' STUCK' : ''} · anchors ${d.clock.anchors}${d.clock.why ? ` (${d.clock.why})` : ''}${d.heard.n >= 8 ? ` · heard ${ms(d.heard.v)} ms${d.heard.steady ? '' : ' ~'}${d.heard.skew ? ' SKEW' : ''}` : ''}`;
}
