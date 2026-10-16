// PULSE timing engine. One clock for everything: the Web Audio output clock.
//
//   heard(perfMs)  -> the AudioContext time of the sample being *heard* at performance time perfMs
//                     (getOutputTimestamp accounts for the browser-reported output latency).
//   Song position heard  = heard(perf) - songOrigin          (songOrigin: ctx time of song position 0)
//   Judged / drawn time  = song position heard - calibration  (calibration: delay the browser can't
//                     see — Bluetooth, TV audio — plus touch latency, measured by "tap along").
// Taps use the pointer event's own timeStamp (same clock as performance.now), never Date / setTimeout.
import { getContext, getMusicBus, getSfxBus } from '../../audio/engine.js';
import { serverNow } from '../../firebase.js';

const CAL_KEY = 'na:pulse:calib';
const SAMPLES = 24;
let offs = [];      // recent (contextTime - performanceTime) samples, seconds
let offset = null;  // smoothed mapping
let lastSample = 0;

function sample() {
  const ctx = getContext();
  if (!ctx) return;
  const now = performance.now();
  if (now - lastSample < 30) return;
  lastSample = now;
  let o;
  const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
  if (ts && ts.performanceTime > 0 && ts.contextTime > 0) o = ts.contextTime - ts.performanceTime / 1000;
  else o = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) - now / 1000;
  offs.push(o);
  if (offs.length > SAMPLES) offs.shift();
  // the output timestamp jitters by a render quantum; the median of recent samples is steady
  const sorted = [...offs].sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1];
  // follow real drift, ignore single-sample noise
  offset = offset == null || Math.abs(med - offset) > 0.05 ? med : offset + (med - offset) * 0.2;
}

/** Context time being heard at performance time perfMs (default: now). */
export function heard(perfMs = performance.now()) {
  sample();
  if (offset == null) { const ctx = getContext(); return ctx ? ctx.currentTime : perfMs / 1000; }
  return offset + perfMs / 1000;
}

/** Context time at which a sound must be scheduled so it is *heard* at server time ms. */
export function ctxAtServer(ms) {
  return heard() + (ms - serverNow()) / 1000;
}

export function resetClock() { offs = []; offset = null; lastSample = 0; }

// ---------------------------------------------------------------- calibration (per device)
export function loadCalibration() {
  try { const c = JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); return c && typeof c.ms === 'number' ? c : null; } catch { return null; }
}
export function saveCalibration(ms) {
  const ctx = getContext();
  const c = { ms: Math.round(ms), lat: ctx ? Math.round(((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000) : null, at: Date.now() };
  try { localStorage.setItem(CAL_KEY, JSON.stringify(c)); } catch { /* private mode: this session only */ }
  memo = c;
  return c;
}
let memo; // undefined = not read yet; null = no calibration saved (read storage once, not every frame)
const cal = () => (memo === undefined ? (memo = loadCalibration()) : memo);
export const calibrationMs = () => (cal() || { ms: 0 }).ms;
export const isCalibrated = () => !!cal();

/** The output route looks different from when we calibrated (headphones on/off, new speaker). */
export function outputChanged() {
  const c = cal();
  const ctx = getContext();
  if (!c || c.lat == null || !ctx) return false;
  const now = Math.round(((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000);
  return Math.abs(now - c.lat) > 25;
}

// ---------------------------------------------------------------- playback
/**
 * Plays a decoded song through the music bus (so it follows the Music slider) with position 0
 * heard at server time startAtMs. Joining late (rejoin / back from background) starts mid-song.
 * Returns { origin (ctx time of position 0), stop() }.
 */
export function playSong(buffer, startAtMs) {
  const ctx = getContext();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  src.connect(gain).connect(getMusicBus());
  const origin = ctxAtServer(startAtMs);
  const lead = 0.06; // scheduling margin
  const at = Math.max(ctx.currentTime + lead, origin);
  const offsetSec = Math.max(0, at - origin);
  if (offsetSec < buffer.duration - 0.05) {
    if (offsetSec > 0) { gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(1, at + 0.12); } // soft entry mid-song
    src.start(at, offsetSec);
  }
  return {
    origin,
    stop(fade = 0.25) {
      const t = ctx.currentTime;
      try { gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + fade); src.stop(t + fade + 0.02); } catch { /* not started */ }
    },
  };
}

/** A short tone, heard at ctx time `at`. Echo patterns + calibration clicks (music bus: always audible with music on). */
export function tone(at, { freq = 660, dur = 0.12, gain = 0.32, type = 'sine', bus = 'music' } = {}) {
  const ctx = getContext();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
  o.connect(g).connect(bus === 'sfx' ? getSfxBus() : getMusicBus());
  o.start(at);
  o.stop(at + dur + 0.02);
}

export const LANE_FREQ = [440, 554.37, 659.25]; // A4, C#5, E5 — a soft major triad across the road
