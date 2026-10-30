// THE BEAT (PARTY NIGHTS, docs/title.md + docs/audio.md#the-beat): which song is sounding on this phone right now, its tempo and
// position — the city breathes to it. In a lobby that's the room's synced song (every phone the same); on the title this phone's
// mood song. null when nothing can be followed (before the first tap, music off or muted, CLASSIC menu music, a song still
// loading): the city then breathes slowly on its own (core/party.js#advanceBeat; City 2.0: core/harbor-beat.js).
//
// NEON PASS 5 (City 2.0): the song's BEAT GRID (data/mood-music.json `grid`: the exact bpm, the first beat, the downbeat) and
// THE SOUND ITSELF — beatKick() reads the low end (kick + bass) off the music bus through an AnalyserNode. THE BEAT-SYNC PASS
// (Oct 24 2026, docs/audio.md#the-beat-sync-pass): what it hears never drives the lights — it CALIBRATES THE LEAD (where the song's
// clock sits against the sound: core/harbor-beat.js#leadKick) and reports the music's loudness (how hard the city punches).
import { nowPlaying, musicOut } from './music.js';
import { lobbyNow } from './lobby-music.js';
import { moodData } from './mood.js';
import { settings } from './settings.js';
import { getContext, getMusicBus, clockFrozen, onRebuild, onResume } from './engine.js';
import { createOnsets, onsetStep, onsetEnergy, kickLag, createLead, leadKick, leadFast, leadAnchor, leadState, leadToSave, heardPos, createSongClock, songClockStep, kickErrWide, outputKey, outputLabel, readLeads, LEAD_N } from '../core/harbor-beat.js';

// ---- WHEN THE BEAT IS HEARD (M2, the owner: the party's sync "kind of — not perfect")
// Two delays sit between a song's clock and the ear:
//  1. OUTPUT: the graph → the speaker. Chrome reports `outputLatency`; Safari does NOT always (only a tiny `baseLatency`), so on an
//     iPhone the lights ran a little early. Without it: the context's output timestamp (how far the graph runs ahead of what is
//     heard), else a measured-ish iPhone speaker figure.
//  2. THE ELEMENT'S LEAD: the mood song is an <audio> element; its currentTime can run ahead of (or behind) the samples that reach
//     the graph (WebKit buffers the element's audio on the way in) — and on iOS that changes after the home screen (+107 / +237 ms
//     on the owner's phone). Nothing reports it, so each phone MEASURES it, always (core/harbor-beat.js#leadKick): every strong kick
//     the listener hears on a song with a trusted grid whose kicks land on its beats (agree ≥ 0.5) says how far the sound sits from
//     where the lights land; the lead follows that in bounded steps — fast for a while after every resume / return / route change
//     (leadFast), gently otherwise. Kept per device (localStorage, the steady-state value) so the next visit starts in sync. The
//     lobby's synced song (decoded buffers on the audio clock) learns its own (≈ 0). The default with nothing learned: iOS −40 ms
//     (her phone's steady −34…−42), elsewhere 0.
const IOS_OUT = 0.02;                // an iPhone's built-in speaker after the graph when Safari reports nothing
const IOS_LEAD = -0.04;              // the element → graph lead on an iPhone in a fresh session (measured on the owner's phone)
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
// NIGHT-A2 — A SAVED LEAD PER OUTPUT (the owner's iPhone, Oct 29: a +156 ms settled after a focus restart — 15 min after his Bluetooth
// glasses — was saved CLAMPED as +120, and every later visit started 120 ms off): the leads are kept per OUTPUT (core/harbor-beat.js#
// outputKey: 'bt' / 'wired' from the reported outputLatency — a Bluetooth visit never poisons the speaker's value, and switching back finds
// the speaker's at once; 'unknown' where the browser reports nothing — iOS), and a lead is SAVED only when it is the device's steady
// value (leadToSave: learned after the page's own start, never after a return / a restart / a route change, never outside the range).
const CAL_KEY = 'na:beatcal';      // (the old single value: migrated once, only when it sits INSIDE the saved range — readLeads)
const LEAD_KEY = 'na:beatlead';    // { v: 2, out: { [outputKey]: { el, buf, at } }, last }
let savedEl = false, savedBuf = false;   // (8b1: a lead learned on an earlier visit — the readout: "the saved lead")
let LEADS = { v: 2, out: {}, last: 'unknown' }, route = 'unknown';
const cal = (() => {
  try { LEADS = readLeads(localStorage.getItem(LEAD_KEY), localStorage.getItem(CAL_KEY)); } catch { /* private mode */ }
  route = LEADS.last || 'unknown';
  const s = LEADS.out[route] || null;
  savedEl = !!(s && s.el != null); savedBuf = !!(s && s.buf != null);
  return { el: createLead(s ? s.el : null, WEBKIT ? IOS_LEAD : 0), buf: createLead(s ? s.buf : null, 0) };
})();
// THE BEAT's HISTORY (SEND REPORT + /admin): the lead's values + why, the routes, the saves, the songs — the last 40 events
const HIST = [], T0 = typeof performance !== 'undefined' ? performance.now() : 0;
function hist(ev, txt = '') { try { HIST.push(`${((performance.now() - T0) / 1000).toFixed(1)} s ${ev}${txt ? ` ${txt}` : ''} · lead ${Math.round(cal.el.v * 1000)} ms`); if (HIST.length > 40) HIST.shift(); } catch { /* polish */ } }
hist('load', `${route}: saved ${JSON.stringify(LEADS.out[route] || null)}`);
let calSaved = 0;
function saveLeads() {
  const e = LEADS.out[route] || { el: null, buf: null, at: 0 }, el = leadToSave(cal.el), buf = leadToSave(cal.buf);
  if (el == null && buf == null) return;
  LEADS.out[route] = { el: el ?? e.el, buf: buf ?? e.buf, at: Date.now() }; LEADS.last = route;
  try { localStorage.setItem(LEAD_KEY, JSON.stringify(LEADS)); } catch { /* private mode */ }
  if (el != null && el !== e.el) hist('saved', `${route} ${Math.round(el * 1000)} ms`);
}
function learn(kind, wide, grid, nowMs) {
  const r = leadKick(cal[kind], wide, grid, nowMs);
  if (r === 'locked' && kind === 'el') hist('locked', `after ${cal.el.last ? cal.el.last.why : '?'} (${cal.el.errs.length} kicks)`);
  if (r !== 'learn' && r !== 'locked' && r !== 'ok') return;
  if (performance.now() - calSaved > 10000) { calSaved = performance.now(); saveLeads(); }
}
// SETTLE THE LEAD AGAIN (core/harbor-beat.js#leadFast): on every resume / context rebuild / page return / output route change the lead
// re-converges on the next kicks heard, within a few bars; the output latency is re-read fresh too (the smoothed timestamp estimate
// starts over).
function refresh(why) {
  const now = performance.now();
  for (const k of ['el', 'buf']) leadFast(cal[k], why, now);
  stamp.v = 0; stamp.at = -1e9;
  hist('settle', why);
}
/** NIGHT-A2: the output changed bucket (outputKey) — its own saved lead at once (if it has one); a route the browser NAMES learns its own
 *  value (the settle counts as a start); 'unknown' keeps the route rule (this visit's, never saved) */
function switchRoute(key) {
  const from = route; route = key; LEADS.last = key;
  const s = LEADS.out[key];
  for (const k of ['el', 'buf']) { const v = s && s[k]; if (v != null) { cal[k].v = v; cal[k].n = LEAD_N; } }
  savedEl = !!(s && s.el != null); savedBuf = !!(s && s.buf != null);
  hist('route', `${from} → ${key}${s && s.el != null ? ` (its saved ${Math.round(s.el * 1000)} ms)` : ''}`);
  refresh(key === 'unknown' ? 'route' : 'start');
}
let started = false;           // (the first context resume = the page's audio STARTING — the unlock tap — not a return)
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
  // (NIGHT-A2: pageshow fires on EVERY load — only a page restored from the back/forward cache is a return)
  addEventListener('pageshow', e => { reanchor('pageshow'); if (e && e.persisted) refresh('pageshow'); });
  try { if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', () => refresh(route === 'unknown' ? 'route' : 'start'));    /* (NIGHT-A2: a named output: switchRoute finds its value on the next kick) */ } catch { /* unsupported */ }
}
try { onRebuild(() => { reanchor('rebuild'); refresh('rebuild'); }); onResume(() => { reanchor('ctx resume'); refresh(started ? 'resume' : 'start'); started = true; }); } catch { /* no engine (tests) */ }
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
  // (CITY 2.0 MUSIC: add-city2-music.py marks a grid it couldn't verify — `trusted: false`: the city then keeps a steady pulse at its tempo)
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
 * This frame's listening (call once a frame while a party wants the beat): { live (the analyser hears the music: a signal in the
 * last 2 s), energy (0..1: the low end's loudness against its recent peak — how hard the city punches), hit (0..1: a kick heard
 * this frame — counted against the grid for the readout, never a punch) } — or null (no music, muted, no Web Audio).
 */
// 7a — THE DEAF LISTENER: a graph whose clock has stopped (iOS after the background) keeps the analyser's LAST window for ever — the
// music that was playing when it froze. Its RMS then never changes, so it looked "live" (a signal in the last 2 s) with no kicks: the
// clock read that as a breakdown and calmed the city to a quarter (hb.level 0.25) — the owner's "the lights stopped pulsing" after
// coming back. The same RMS frame after frame (a real signal never repeats to 1e-7 for 8 frames), a frozen clock, or the song on the
// direct element = nothing heard.
let lastRms = -1, sameN = 0;
let leadId = null, leadAnch = 0;
export function beatKick(nowMs = performance.now()) {
  if (settings.musicOff || settings.muted || !(lobbyNow() || nowPlaying())) return null;
  // (the song on THE DIRECT ELEMENT or the graph frozen: the listener can't hear it — not live; the grid leads: 'direct-grid')
  if ((!lobbyNow() && musicOut() === 'direct') || clockFrozen()) { heardAt = -1e9; sameN = 0; return { hit: 0, live: false, deaf: true, energy: 0 }; }
  const A = analyser();
  if (!A || A.ctx.state !== 'running') return null;
  let s = 0, n;
  if (A.f) { A.a.getFloatTimeDomainData(A.f); n = A.f.length; for (let i = 0; i < n; i++) s += A.f[i] * A.f[i]; }
  else { A.a.getByteTimeDomainData(A.b); n = A.b.length; for (let i = 0; i < n; i++) { const v = (A.b[i] - 128) / 128; s += v * v; } }
  const rms = Math.sqrt(s / n);
  sameN = rms > 1e-3 && Math.abs(rms - lastRms) < 1e-7 ? sameN + 1 : 0; lastRms = rms;
  if (sameN >= 8) { heardAt = -1e9; return { hit: 0, live: false, deaf: true, energy: 0 }; }
  if (rms > 1e-3) heardAt = nowMs;
  if (lastFrame && nowMs - lastFrame < 100) frameS += ((nowMs - lastFrame) / 1000 - frameS) * 0.05;
  lastFrame = nowMs;
  const lag = kickLag(frameS);
  { const ro = A.ctx.outputLatency > 0 ? A.ctx.outputLatency : null, key = outputKey(A.ctx.outputLatency, A.ctx.baseLatency);
    // (a context reports no latency for a moment as it starts: 'unknown' never replaces an output the browser has named — a flap
    // wired → unknown → wired re-settled the lead + marked it unsaveable on every reload)
    if (key !== route && key !== 'unknown') switchRoute(key);
    // (a jump inside a NAMED bucket: the same kind of output — settle, and the learned value is still that output's to keep)
    else if (ro != null && routeOut != null && Math.abs(ro - routeOut) > 0.015) refresh(route === 'unknown' ? 'route' : 'start');
    if (ro != null) routeOut = ro; }
  const hit = onsetStep(ons, rms, nowMs / 1000);
  // a strong kick on a song whose kicks land on its trusted grid: how far the sound sits from where the lights land → the lead
  if (hit >= 0.6) {
    const lob = lobbyNow(), np = lob || nowPlaying(), d = moodData();
    const g = np && d && d.songs && d.songs[np.id] && d.songs[np.id].grid;
    if (g && g.bpm > 0 && g.trusted !== false && (g.agree == null || g.agree >= 0.5)) {
      const kind = lob ? 'buf' : 'el', c = cal[kind];
      const at = songPos(np, nowMs);
      // (a new song, or the song clock re-anchored — a jump, a seek, a return: what was measured before it is history; the lead stays)
      if (leadId !== np.id || leadAnch !== sclock.anchors) { if (leadId !== np.id) hist('song', np.id); leadId = np.id; leadAnch = sclock.anchors; leadAnchor(c); }
      learn(kind, kickErrWide(at, g, lag), g, nowMs);
    }
  }
  return { hit, live: nowMs - heardAt < 2000, energy: onsetEnergy(ons) };
}
/** 8b1 — THE SAFETY RULE's input (core/harbor-beat.js#stepSafety): the lead's calibration for the song sounding — the agreed residual,
 *  settling, the kicks behind it — the song clock's identity + re-anchors, and whether this device had a lead saved from a visit before */
export function beatCal() {
  const c = lobbyNow() ? cal.buf : cal.el;
  // (NIGHT-A2: deafSong — the song's grid is trusted but its kicks land off its beats (agree < 0.5): the listener never feeds the lead on
  // it, so it can't confirm — the safety rule keeps the half punch on the grid and says why)
  const np = lobbyNow() || nowPlaying(), d = moodData(), g = np && d && d.songs && d.songs[np.id] && d.songs[np.id].grid;
  const deafSong = !!(g && g.bpm > 0 && g.trusted !== false && g.agree != null && g.agree < 0.5);
  return { res: c.res, fast: c.fast ? { why: c.fast.why } : null, n: c.n, seen: c.seen, errs: c.errs.length, song: sclock.id, anchors: sclock.anchors, saved: lobbyNow() ? savedBuf : savedEl, deafSong, route, visit: c.visit };
}
/** NIGHT-A2 — the beat for SEND REPORT + /admin: the output's bucket, the saved leads per output, the lead's state now, whether it may be
 *  saved, the kicks heard, the last 40 events (the lead's values + why, the routes, the saves, the songs) */
export function beatReport() {
  const c = cal.el, st = leadState(c, performance.now());
  return { route, last: LEADS.last, saved: LEADS.out, lead: st, saveable: leadToSave(c) != null, visit: c.visit, kicks: c.seen, buf: Math.round(cal.buf.v * 1000), hist: HIST.slice() };
}
/** the debug view (window.__arcade.beat / the readout) */
export function beatDebug() {
  const c = getContext(), now = performance.now();
  return { analyser: !!an, peak: +ons.peak.toFixed(4), level: +ons.level.toFixed(4), energy: +onsetEnergy(ons).toFixed(3), latency: +outLatency().toFixed(3),
    reported: c ? +(c.outputLatency || 0).toFixed(3) : 0, base: c ? +(c.baseLatency || 0).toFixed(3) : 0, stamp: +stamp.v.toFixed(3), lead: +cal.el.v.toFixed(3), leadN: cal.el.n, buf: +cal.buf.v.toFixed(3), bufN: cal.buf.n,
    cal: leadState(lobbyNow() ? cal.buf : cal.el, now), res: cal.el.res == null ? null : +cal.el.res.toFixed(3), seen: cal.el.seen,
    lag: +kickLag(frameS).toFixed(3), fps: Math.round(1 / frameS),
    clock: { id: sclock.id, pos: +sclock.pos.toFixed(3), err: +sclock.err.toFixed(3), stuck: sclock.stuck, anchors: sclock.anchors, why: sclock.why } };
}
/** the &debug=1 readout's line: what the beat subtracts to land on the sound as HEARD, and the lead's calibration state —
 *  `sync out 18 ms · lead −40 ms (default) · lag 24 ms` / `lead −34 ms (locked · 22 kicks)` / `lead −34 → +180 ms (settling · visible · 8 kicks)` /
 *  `lead +237 ms (settled −34 → +237 · 4 s ago)` */
export function syncLine() {
  const d = beatDebug(), c = d.cal, sg = v => `${v >= 0 ? '+' : '−'}${Math.abs(v)}`;
  const leadTxt = c.state === 'settling' ? `lead ${sg(c.from)} → ${sg(c.ms)} ms (settling · ${c.why} · ${c.n} kicks)`
    : c.state === 'settled' ? `lead ${sg(c.ms)} ms (${c.ok ? 'settled' : 'kept'} ${sg(c.from)} → ${sg(c.ms)} · ${c.ago} s ago)`
    : c.state === 'locked' ? `lead ${sg(c.ms)} ms (locked · ${c.n} kicks)`
    : `lead ${sg(c.ms)} ms (default)`;
  // (NIGHT-A2: + the output's bucket, and when this visit's lead won't be saved — after a return / a restart / a route change)
  return `sync out ${Math.round(d.latency * 1000)} ms${d.reported ? '' : d.stamp ? ' (stamp)' : ' (est)'} · ${leadTxt} · lag ${Math.round(d.lag * 1000)} ms · ${outputLabel(route)}${cal.el.visit ? ` · not saved (after ${cal.el.visit})` : ''}`;
}
/** FP — the readout's song-clock line: the last element reading vs the run-forward clock, the re-anchors (+ the last why), and `heard`:
 *  where the strong kicks land against the lights (the agreed residual; `~` while the last kicks don't agree) */
export function clockLine() {
  const d = beatDebug(), ms = v => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 1000))}`;
  const heard = d.res != null ? ` · heard ${ms(d.res)} ms` : d.seen >= 6 ? ' · heard ~' : '';
  return `clock el ${ms(d.clock.err)} ms${d.clock.stuck ? ' STUCK' : ''} · anchors ${d.clock.anchors}${d.clock.why ? ` (${d.clock.why})` : ''}${heard}`;
}
