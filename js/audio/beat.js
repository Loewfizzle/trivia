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

export function beatSource() {
  if (settings.musicOff || settings.muted) return null;
  const np = lobbyNow() || nowPlaying();
  if (!np || !np.id) return null;
  const d = moodData();
  const song = d && d.songs && d.songs[np.id];
  if (!song || !(song.bpm > 0)) return null;
  const g = song.grid && song.grid.bpm > 0 ? song.grid : null;
  // (pos AS HEARD: the element's / the buffer's clock runs ahead of the speaker by the output latency)
  return { id: np.id, bpm: g ? g.bpm : song.bpm, pos: Math.max(0, np.at - outLatency()), grid: g };
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
