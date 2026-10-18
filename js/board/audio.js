// THE BOARD's sounds: synthesized, layered, quiet — the hall of a speakeasy, not an arcade.
//   tab (a glassy click over felt), rows (the cascade: a soft run of ticks), pb (a bell chime), top10 (a rising
//   flourish), first (a short brass fanfare for #1), forge (rank-up: a swell, an anvil strike in light, a bloom).
// Everything plays through the SFX bus (the settings slider) and is silent when muted or audio is locked.
import { getContext, getSfxBus } from '../audio/engine.js';
import { settings } from '../audio/settings.js';

let ctx = null, out = null, noise = null, hall = null;
const NOTE = n => 440 * 2 ** ((n - 69) / 12);   // MIDI → Hz
const rnd = (a, b) => a + Math.random() * (b - a);

function impulse(c, seconds, decay, bright) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) { lp = lp * (1 - bright) + (Math.random() * 2 - 1) * bright; d[i] = lp * Math.pow(1 - i / len, decay) * (i < 64 ? i / 64 : 1); }
  }
  return buf;
}

function ready() {
  const c = getContext();
  if (!c || c.state !== 'running' || settings.muted) return null;
  if (ctx !== c) {
    ctx = c;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 2.4; comp.attack.value = 0.008; comp.release.value = 0.25;
    out = ctx.createGain(); out.gain.value = 0.6;
    out.connect(comp).connect(getSfxBus());
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    hall = ctx.createConvolver(); hall.buffer = impulse(ctx, 2.8, 2.6, 0.42);
    const hg = ctx.createGain(); hg.gain.value = 0.5; hall.connect(hg).connect(out);
  }
  return ctx;
}

function env(g, t, a, peak, dec, hold = 0) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  if (hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + dec);
}
function send(node, { pan = 0, wet = 0.2, lp = 0 } = {}) {
  let n = node;
  if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.Q.value = 0.5; n.connect(f); n = f; }
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
  n.connect(out);
  if (wet) { const w = ctx.createGain(); w.gain.value = wet; n.connect(w).connect(hall); }
}
function tone(f, t, { type = 'sine', a = 0.004, dec = 0.3, hold = 0, peak = 0.04, slide = 0, detune = 0, ...rest } = {}) {
  const o = ctx.createOscillator(); o.type = type; o.detune.value = detune;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + a + hold + dec);
  const g = ctx.createGain(); env(g, t, a, peak, dec, hold);
  o.connect(g); send(g, rest);
  o.start(t); o.stop(t + a + hold + dec + 0.05);
}
/** a bell: FM with a slowly closing index — glassy, expensive */
function bell(f, t, { peak = 0.03, dec = 1.6, ratio = 3.5, index = 2.2, ...rest } = {}) {
  const c = ctx.createOscillator(); c.frequency.value = f;
  const m = ctx.createOscillator(); m.frequency.value = f * ratio;
  const mg = ctx.createGain(); mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dec * 0.6);
  m.connect(mg).connect(c.frequency);
  const g = ctx.createGain(); env(g, t, 0.003, peak, dec);
  c.connect(g); send(g, rest);
  c.start(t); m.start(t); c.stop(t + dec + 0.1); m.stop(t + dec + 0.1);
}
function hiss(t, { from = 800, to = 4000, dur = 0.4, peak = 0.02, q = 0.9, type = 'bandpass', a = null, ...rest } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain(); const att = a ?? dur * 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g); send(g, rest);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
/** a soft brass voice: two detuned saws through a swelling low-pass */
function brass(f, t, { peak = 0.018, a = 0.06, hold = 0.25, dec = 0.7, ...rest } = {}) {
  const g = ctx.createGain(); env(g, t, a, peak, dec, hold);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.1;
  lp.frequency.setValueAtTime(f * 1.2, t); lp.frequency.exponentialRampToValueAtTime(f * 5, t + a + 0.08); lp.frequency.exponentialRampToValueAtTime(f * 1.6, t + a + hold + dec);
  for (const d of [-7, 7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + a + hold + dec + 0.05); }
  lp.connect(g); send(g, rest);
}

const VOICES = {
  // a glassy click over felt: the tab under your finger
  tab(t) {
    tone(2400 * rnd(0.97, 1.03), t, { peak: 0.012, dec: 0.05, type: 'triangle', wet: 0.12 });
    tone(180, t, { peak: 0.03, dec: 0.09, slide: 120, wet: 0.05 });
    hiss(t, { from: 3000, to: 6000, dur: 0.05, peak: 0.006, wet: 0.1 });
  },
  // the rows cascading in: a soft run up a pentatonic, very quiet
  rows(t) {
    [72, 74, 76, 79, 81, 84].forEach((n, i) => tone(NOTE(n), t + i * 0.042, { peak: 0.006 - i * 0.0004, dec: 0.16, type: 'sine', wet: 0.3, pan: -0.3 + i * 0.12 }));
    hiss(t, { from: 2000, to: 7000, dur: 0.32, peak: 0.004, wet: 0.3 });
  },
  // NEW PERSONAL BEST: a bell triad with a shimmer
  pb(t) {
    [[84, 0], [88, 0.06], [91, 0.12]].forEach(([n, d], i) => bell(NOTE(n), t + d, { peak: 0.022 - i * 0.003, dec: 1.8, wet: 0.45, pan: -0.25 + i * 0.25 }));
    tone(NOTE(60), t, { peak: 0.02, dec: 0.9, type: 'sine', wet: 0.3 });
    hiss(t + 0.08, { from: 5000, to: 9000, dur: 0.8, peak: 0.004, type: 'highpass', wet: 0.5 });
  },
  // ENTERED THE TOP 10 / #N WORLDWIDE: a rising flourish
  top10(t) {
    [67, 72, 76, 79, 84, 88].forEach((n, i) => bell(NOTE(n), t + i * 0.055, { peak: 0.012 + i * 0.0012, dec: 0.9 + i * 0.12, ratio: 2.0, index: 1.4, wet: 0.4, pan: -0.4 + i * 0.16 }));
    hiss(t, { from: 600, to: 6000, dur: 0.42, peak: 0.008, wet: 0.35 });
    tone(NOTE(48), t + 0.3, { peak: 0.022, dec: 1.1, wet: 0.3 });
  },
  // #1 THIS WEEK: a short brass fanfare over a soft timpani
  first(t) {
    const chord = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]];
    const at = [0, 0.16, 0.32, 0.5];
    chord.forEach((c, i) => c.forEach((n, k) => brass(NOTE(n), t + at[i], { peak: 0.012, hold: i === 3 ? 0.55 : 0.08, dec: i === 3 ? 1.0 : 0.18, pan: (k - 1) * 0.35, wet: 0.35 })));
    [0, 0.5].forEach((d, i) => { tone(70, t + d, { peak: 0.06, dec: 0.5 + i * 0.3, slide: 48, wet: 0.25 }); hiss(t + d, { type: 'lowpass', from: 500, to: 120, dur: 0.35, peak: 0.02, a: 0.004, wet: 0.2 }); });
    bell(NOTE(91), t + 0.5, { peak: 0.012, dec: 1.6, wet: 0.5 });
  },
  // RANK UP: a swell of air, an anvil struck in light, a bloom of a chord
  forge(t) {
    hiss(t, { type: 'bandpass', from: 180, to: 3200, dur: 1.15, peak: 0.03, q: 0.7, a: 1.0, wet: 0.4 });
    tone(55, t, { peak: 0.035, a: 0.9, dec: 0.4, slide: 110, wet: 0.2 });
    const hit = t + 1.12;
    // the strike: inharmonic metal partials + a sub thump
    [1, 2.76, 5.4, 8.93].forEach((r, i) => bell(420 * r, hit, { peak: 0.016 / (i + 1), dec: 1.2 - i * 0.2, ratio: 1.41, index: 0.8, wet: 0.5, pan: (i % 2 ? 0.2 : -0.2) }));
    tone(90, hit, { peak: 0.08, dec: 0.45, slide: 40, wet: 0.2 });
    hiss(hit, { type: 'highpass', from: 4000, to: 9000, dur: 0.25, peak: 0.02, a: 0.002, wet: 0.4 });
    // the bloom
    [48, 55, 60, 64, 67, 71].forEach((n, i) => brass(NOTE(n), hit + 0.08 + i * 0.03, { peak: 0.008, a: 0.35, hold: 0.6, dec: 1.4, pan: -0.5 + i * 0.2, wet: 0.5 }));
    [84, 88, 91, 96].forEach((n, i) => bell(NOTE(n), hit + 0.25 + i * 0.09, { peak: 0.008, dec: 2, wet: 0.6 }));
  },
};

/** Plays one of THE BOARD's sounds (never throws). */
export function boardSfx(name) {
  try {
    if (!ready()) return;
    VOICES[name] && VOICES[name](ctx.currentTime + 0.01);
  } catch { /* audio is polish */ }
}
