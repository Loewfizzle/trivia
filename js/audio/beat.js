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

/** the audible delay after the graph (the speaker / Bluetooth's buffering) — capped */
function outLatency() {
  const c = getContext();
  return c ? Math.min(0.35, Math.max(0, (c.outputLatency || 0) + (c.baseLatency || 0))) : 0;
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
  const np = lobbyNow() || nowPlaying();
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
  // (pos AS HEARD: the element's / the buffer's clock runs ahead of the speaker by the output latency)
  return { id: np.id, bpm: g ? g.bpm : song.bpm, pos: Math.max(0, dequantize(np.id, np.at, nowMs) - outLatency()), grid: g, untrusted };
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
  let out = 0;
  while (queue.length && queue[0][0] <= nowMs) out = Math.max(out, queue.shift()[1]);
  return { hit: out, live: nowMs - heardAt < 2000 };
}
/** the debug view (window.__arcade.beat / the readout) */
export function beatDebug() { return { analyser: !!an, peak: +ons.peak.toFixed(4), level: +ons.level.toFixed(4), latency: +outLatency().toFixed(3) }; }
