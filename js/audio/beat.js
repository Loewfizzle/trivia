// THE BEAT (PARTY NIGHTS, docs/title.md + docs/audio.md#the-beat): which song is sounding on this phone right now, its tempo and
// position — the city breathes to it. In a lobby that's the room's synced song (every phone the same); on the title this phone's
// mood song. null when nothing can be followed (before the first tap, music off or muted, CLASSIC menu music, a song still
// loading): the city then breathes slowly on its own (core/party.js#advanceBeat; City 2.0: core/harbor-beat.js).
//
// NEON PASS 5 (City 2.0): the song's BEAT GRID (data/mood-music.json `grid`: the exact bpm, the first beat, the downbeat) and
// THE SOUND ITSELF — beatKick() reads the low end (kick + bass) off the music bus through an AnalyserNode and reports the kicks
// it hears (core/harbor-beat.js#onsetStep), late by the output's latency so the light lands when the sound does.
import { nowPlaying } from './music.js';
import { lobbyNow } from './lobby-music.js';
import { moodData } from './mood.js';
import { settings } from './settings.js';
import { getContext, getMusicBus } from './engine.js';
import { createOnsets, onsetStep } from '../core/harbor-beat.js';

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
const IOS_OUT = 0.02;                // an iPhone's built-in speaker after the graph when Safari reports nothing
const KICK_LAG = 0.024;              // the kick listener fires ~24 ms after the beat it hears (offline replay: 15–37 ms per party song)
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
  const blank = () => ({ v: 0, n: 0, errs: [] });
  try { const s = JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); if (s) return { el: { ...blank(), v: +s.el || 0, n: s.el != null ? 12 : 0 }, buf: { ...blank(), v: +s.buf || 0, n: s.buf != null ? 12 : 0 } }; } catch { /* private mode */ }
  return { el: blank(), buf: blank() };
})();
let calSaved = 0;
function learn(kind, err) {
  const c = cal[kind];
  c.errs.push(err); if (c.errs.length > 32) c.errs.shift();
  if (c.errs.length < 12) return;
  const s = c.errs.slice().sort((a, b) => a - b), med = s[s.length >> 1];
  const spread = s[Math.floor(s.length * 0.75)] - s[Math.floor(s.length * 0.25)];
  if (spread > 0.06) return;                          // (not consistent enough yet: keep what we had)
  c.v = Math.max(-0.1, Math.min(0.25, med)); c.n = c.errs.length;
  if (performance.now() - calSaved > 10000) {
    calSaved = performance.now();
    try { localStorage.setItem(CAL_KEY, JSON.stringify({ el: cal.el.n ? +cal.el.v.toFixed(3) : null, buf: cal.buf.n ? +cal.buf.v.toFixed(3) : null })); } catch { /* private mode */ }
  }
}

// (NEON PASS 6: an <audio> element's currentTime may move in coarse steps on iOS — a step every few frames, not every frame. The
// position is carried forward on the frame clock between its steps, so the beat never jerks back and forth with them.)
const smooth = { id: null, at: -1, perf: 0 };
function dequantize(id, at, now) {
  if (id !== smooth.id || at < smooth.at || at - smooth.at > 1) { smooth.id = id; smooth.at = at; smooth.perf = now; return at; }
  if (at !== smooth.at) { smooth.at = at; smooth.perf = now; return at; }
  return at + Math.min(0.5, (now - smooth.perf) / 1000);
}
/** why the beat is calm right now (the &debug=1 readout: "beat calm — music off") — '' when a song is being followed */
let why = '';
export const beatWhy = () => why;
export function beatSource(nowMs = performance.now()) {
  if (settings.musicOff) { why = 'music off'; return null; }
  if (settings.muted) { why = 'muted'; return null; }
  const lob = lobbyNow(), np = lob || nowPlaying();
  if (!np || !np.id) { const c = getContext(); why = !c || c.state !== 'running' ? 'tap for sound' : settings.menuMusic === 'classic' ? 'classic music' : 'no song'; return null; }
  const d = moodData();
  if (!d) { why = 'songs loading'; return null; }
  const song = d.songs && d.songs[np.id];
  if (!song || !(song.bpm > 0)) { why = 'song unknown'; return null; }
  const all = song.grid && song.grid.bpm > 0 ? song.grid : null;
  // (CITY 2.0 MUSIC: add-city2-music.py marks a grid it couldn't verify — `trusted: false`: the city then follows the kicks it hears)
  const untrusted = !!(all && all.trusted === false);
  const g = untrusted ? null : all;
  why = '';
  // (pos AS HEARD: the element's / the buffer's clock runs ahead of the speaker by the output latency + the element's own lead)
  return { id: np.id, bpm: g ? g.bpm : song.bpm, pos: Math.max(0, dequantize(np.id, np.at, nowMs) - outLatency() - cal[lob ? 'buf' : 'el'].v), grid: g, untrusted };
}

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
export function beatKick(nowMs = performance.now()) {
  if (settings.musicOff || settings.muted || !(lobbyNow() || nowPlaying())) return null;
  const A = analyser();
  if (!A || A.ctx.state !== 'running') return null;
  let s = 0, n;
  if (A.f) { A.a.getFloatTimeDomainData(A.f); n = A.f.length; for (let i = 0; i < n; i++) s += A.f[i] * A.f[i]; }
  else { A.a.getByteTimeDomainData(A.b); n = A.b.length; for (let i = 0; i < n; i++) { const v = (A.b[i] - 128) / 128; s += v * v; } }
  const rms = Math.sqrt(s / n);
  if (rms > 1e-3) heardAt = nowMs;
  const hit = onsetStep(ons, rms, nowMs / 1000);
  if (hit > 0) queue.push([nowMs + outLatency() * 1000, hit]);
  // a strong kick on a song whose kicks land on its trusted grid: how far the song's clock is from that beat (the element's lead)
  if (hit >= 0.5) {
    const lob = lobbyNow(), np = lob || nowPlaying(), d = moodData();
    const g = np && d && d.songs && d.songs[np.id] && d.songs[np.id].grid;
    if (g && g.bpm > 0 && g.trusted !== false && (g.agree == null || g.agree >= 0.5)) {
      const p = 60 / g.bpm, x = dequantize(np.id, np.at, nowMs) - KICK_LAG - g.t0, err = x - Math.round(x / p) * p;
      if (Math.abs(err) < Math.min(0.2, 0.15 * p * 2)) learn(lob ? 'buf' : 'el', err);
    }
  }
  let out = 0;
  while (queue.length && queue[0][0] <= nowMs) out = Math.max(out, queue.shift()[1]);
  return { hit: out, live: nowMs - heardAt < 2000 };
}
/** the debug view (window.__arcade.beat / the readout) */
export function beatDebug() {
  const c = getContext();
  return { analyser: !!an, peak: +ons.peak.toFixed(4), level: +ons.level.toFixed(4), latency: +outLatency().toFixed(3),
    reported: c ? +(c.outputLatency || 0).toFixed(3) : 0, stamp: +stamp.v.toFixed(3), lead: +cal.el.v.toFixed(3), leadN: cal.el.errs.length, buf: +cal.buf.v.toFixed(3), bufN: cal.buf.errs.length };
}
/** the &debug=1 readout's line: what the beat subtracts to land on the sound as HEARD */
export function syncLine() {
  const d = beatDebug();
  return `sync out ${Math.round(d.latency * 1000)} ms${d.reported ? '' : d.stamp ? ' (stamp)' : ' (est)'} · lead ${Math.round(d.lead * 1000)} ms (${d.leadN} kicks)`;
}
