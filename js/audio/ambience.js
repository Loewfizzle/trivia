// Title-screen ambience, synthesized (no files), on the SFX bus so it follows the Effects slider and Mute.
//   neonPowerOn({ crackles })  the sign warming up: a warm mains hum that swells and settles, with soft
//                              electrical crackles at the given offsets (seconds) — one per flicker
//   neonTick()                 the tiny crackle of a single letter's rare flicker
//   startRain() -> stop()      a very low rain bed under the music (filtered noise, slowly breathing)
// Everything is quiet by design: felt more than heard.
import { getContext, getSfxBus, isUnlocked } from './engine.js';

let noiseBuf = null;
function noise(ctx) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) { b = b * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = b; } // a little darker than white
  return noiseBuf;
}

function crackle(ctx, at, gain = 0.03) {
  const s = ctx.createBufferSource();
  s.buffer = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 2600 + Math.random() * 2400; f.Q.value = 1.4;
  const g = ctx.createGain();
  const dur = 0.025 + Math.random() * 0.05;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0004, at + dur);
  s.connect(f).connect(g).connect(getSfxBus());
  s.start(at, Math.random() * 1.5, dur + 0.02);
}

export function neonPowerOn({ crackles = [0, 0.12, 0.3], dur = 2.2 } = {}) {
  if (!isUnlocked()) return;
  const ctx = getContext();
  const t = ctx.currentTime + 0.01;
  // the hum: 120 Hz (mains, doubled) + its octave, softly filtered
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.034, t + 0.08);
  out.gain.setValueAtTime(0.034, t + 0.45);
  out.gain.linearRampToValueAtTime(0.014, t + 0.9);
  out.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.6;
  lp.connect(out).connect(getSfxBus());
  for (const [f, type, a] of [[120, 'sawtooth', 0.6], [240, 'triangle', 0.25], [60, 'sine', 0.5]]) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = a;
    o.connect(g).connect(lp);
    o.start(t); o.stop(t + dur + 0.1);
  }
  for (const c of crackles) crackle(ctx, t + c, 0.026);
}

/** The district waking up on the first tap: a soft low swell with an airy rise (≈ 1.6 s). */
export function cityPowerOn() {
  if (!isUnlocked()) return;
  const ctx = getContext();
  const t = ctx.currentTime + 0.01;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.05, t + 0.12);
  out.gain.exponentialRampToValueAtTime(0.0005, t + 1.7);
  out.connect(getSfxBus());
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(96, t + 1.2);
  o.connect(out); o.start(t); o.stop(t + 1.8);
  // an airy rise: filtered noise sweeping up
  const n = ctx.createBufferSource(); n.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 1.4);
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.35, t + 0.5); ng.gain.linearRampToValueAtTime(0, t + 1.6);
  n.connect(bp).connect(ng).connect(out);
  n.start(t, 0, 1.7);
}

export function neonTick() {
  if (!isUnlocked()) return;
  const ctx = getContext();
  crackle(ctx, ctx.currentTime + 0.005, 0.009);
}

export function startRain() {
  if (!isUnlocked()) return () => {};
  const ctx = getContext();
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.022, t + 3);
  // a slow breath in the rain (an LFO on the level) so it never sounds like a hiss
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lg = ctx.createGain(); lg.gain.value = 0.006;
  lfo.connect(lg).connect(g.gain);
  src.connect(hp).connect(lp).connect(g).connect(getSfxBus());
  src.start(t); lfo.start(t);
  let stopped = false;
  return (fade = 0.8) => {
    if (stopped) return;
    stopped = true;
    const n = ctx.currentTime;
    g.gain.cancelScheduledValues(n);
    g.gain.setValueAtTime(g.gain.value, n);
    g.gain.linearRampToValueAtTime(0, n + fade);
    src.stop(n + fade + 0.05); lfo.stop(n + fade + 0.05);
  };
}
