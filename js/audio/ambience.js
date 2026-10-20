// Title-screen ambience, synthesized (no files), on the SFX bus so it follows the Effects slider and Mute.
//   neonPowerOn({ crackles })  the sign warming up: a warm mains hum that swells and settles, with soft
//                              electrical crackles at the given offsets (seconds) — one per flicker
//   neonTick()                 the tiny crackle of a single letter's rare flicker
//   startRain(level) -> stop()  the rain (LIVE WEATHER): a breathing bed, a downpour roar, droplet ticks; stop.level(l)
//   thunder({ near, delay, level })   real recorded thunder after a lightning flash (audio/weather/: a close strike as recorded,
//                                     a distant one filtered and quieter); the synthesized crack + roll if a file can't load
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

// ---------------------------------------------------------------- weather: the rain and the thunder (LIVE WEATHER)
// The rain follows the real rain (level 0..1): a soft bed of filtered noise that breathes, a low roar that only heavy rain
// brings, and fine droplet ticks on the glass and the street. startRain(level) -> stop(fade); stop.level(l) changes it live.
let brownBuf = null, irBuf = null;
// RECORDED WEATHER (optional): royalty-free recordings beat any synthesis. Put the files in audio/weather/ and list them here —
// a thunder file is picked at random per strike (near / far), a rain loop replaces the synthesized bed. Empty = synthesized.
export const RECORDED = {
  // two close strikes with long rolls (Oct 2026): a distant strike plays the same recordings through a low-pass, quieter
  thunderNear: ['thunderstrike.mp3', 'thunderstrike2.mp3'],
  thunderFar: ['thunderstrike.mp3', 'thunderstrike2.mp3'],
  rainLoop: null,
};
// each file's level, so they sit at the same loudness (thunderstrike2 is ~7 dB louder: RMS −18.7 vs −25.6 dB)
const REC_GAIN = { 'thunderstrike.mp3': 1, 'thunderstrike2.mp3': 0.45 };
let rolling = 0;            // recorded strikes sounding now (at most two at once: a storm never piles up into a wall)
const decoded = new Map();
function loadRec(ctx, name) {
  if (!decoded.has(name)) decoded.set(name, fetch(new URL(`../../audio/weather/${name}`, import.meta.url)).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))).then(b => ctx.decodeAudioData(b)).catch(() => null));
  return decoded.get(name);
}
function brown(ctx) {
  if (brownBuf && brownBuf.sampleRate === ctx.sampleRate) return brownBuf;
  const len = ctx.sampleRate * 4;
  brownBuf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = brownBuf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  }
  return brownBuf;
}
// a big, dark space (thunder rolling between the towers): stereo noise decaying over ~4 s, the highs dying first
function space(ctx) {
  if (irBuf && irBuf.sampleRate === ctx.sampleRate) return irBuf;
  const len = Math.round(ctx.sampleRate * 4.2);
  irBuf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = irBuf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      const k = Math.min(0.6, 0.05 + t * 0.12);
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - i / len, 2.2) * (t < 0.02 ? t / 0.02 : 1);
    }
  }
  return irBuf;
}

export function startRain(level = 0.6) {
  if (!isUnlocked()) { const f = () => {}; f.level = () => {}; return f; }
  const ctx = getContext();
  const t = ctx.currentTime;
  const out = ctx.createGain(); out.gain.setValueAtTime(0, t);
  out.connect(getSfxBus());
  // the bed: bright, airy rain, breathing slowly so it never sounds like a hiss (or the recorded loop, when there is one)
  const src = ctx.createBufferSource(); src.buffer = noise(ctx); src.loop = true;
  if (RECORDED.rainLoop) loadRec(ctx, RECORDED.rainLoop).then(buf => { if (buf && !stopped) { const r = ctx.createBufferSource(); r.buffer = buf; r.loop = true; const rg = ctx.createGain(); rg.gain.value = 40; r.connect(rg).connect(out); r.start(); lg.disconnect(); bed.gain.value = 0; recSrc = r; } });   // the recording replaces the synthesized bed (its breathing too)
  let recSrc = null;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
  const bed = ctx.createGain(); bed.gain.value = 1;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lg = ctx.createGain(); lg.gain.value = 0.28;
  lfo.connect(lg).connect(bed.gain);
  src.connect(hp).connect(lp).connect(bed).connect(out);
  // the roar of a downpour: low and wide, only when it pours
  const roarSrc = ctx.createBufferSource(); roarSrc.buffer = brown(ctx); roarSrc.loop = true;
  const roarLp = ctx.createBiquadFilter(); roarLp.type = 'lowpass'; roarLp.frequency.value = 520;
  const roar = ctx.createGain(); roar.gain.value = 0;
  roarSrc.connect(roarLp).connect(roar).connect(out);
  src.start(t); lfo.start(t); roarSrc.start(t);
  let lvl = 0, stopped = false;
  const BASE = 0.0081;                                     // the bed at a medium rain (felt more than heard)
  function setLevel(l, ramp = 3) {
    lvl = Math.max(0.1, Math.min(1.2, l));
    const n = ctx.currentTime;
    out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n);
    out.gain.linearRampToValueAtTime(BASE * (0.55 + 0.75 * lvl), n + ramp);
    roar.gain.cancelScheduledValues(n); roar.gain.setValueAtTime(roar.gain.value, n);
    roar.gain.linearRampToValueAtTime(Math.max(0, lvl - 0.45) * 1.6, n + ramp);
  }
  setLevel(level);
  // droplet ticks: a few a second on the glass and the street, more as it pours (scheduled a little ahead)
  let timer = 0;
  const tickLoop = () => {
    if (stopped) return;
    const n = ctx.currentTime, rate = 3 + lvl * 14;
    for (let tt = 0; tt < 0.25; tt += -Math.log(1 - Math.random()) / rate) droplet(ctx, n + 0.02 + tt, out, 0.5 + Math.random() * 1.1);
    timer = setTimeout(tickLoop, 250);
  };
  tickLoop();
  const stop = (fade = 0.8) => {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    const n = ctx.currentTime;
    out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.linearRampToValueAtTime(0, n + fade);
    for (const x of [src, lfo, roarSrc, recSrc]) if (x) x.stop(n + fade + 0.05);
    setTimeout(() => out.disconnect(), (fade + 0.2) * 1000);
  };
  stop.level = l => { if (!stopped && Math.abs(l - lvl) > 0.05) setLevel(l, 4); };
  return stop;
}
// a single droplet: a tiny, bright, pitched tick
function droplet(ctx, at, dest, gain) {
  const s = ctx.createBufferSource(); s.buffer = noise(ctx);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 5200; f.Q.value = 4 + Math.random() * 6;
  const g = ctx.createGain(); const dur = 0.012 + Math.random() * 0.03;
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + 0.0015); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  s.connect(f).connect(g);
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; g.connect(p).connect(dest); } else g.connect(dest);
  s.start(at, Math.random() * 1.5, dur + 0.02);
}

/** Thunder, a moment after a lightning flash. near: a close strike (sooner, a crack, a deep thump); far: a long low roll.
 *  delay: seconds after the flash (light outruns sound). On the SFX bus: the Effects volume and mute apply. */
export function thunder({ near = false, delay = 2, level = 1 } = {}) {
  if (!isUnlocked()) return;
  const ctx = getContext();
  const t0 = ctx.currentTime + delay;
  const files = near ? RECORDED.thunderNear : RECORDED.thunderFar;
  if (!files.length) { synthThunder(ctx, near, t0, delay, level); return; }
  if (rolling >= 2) return;
  const name = files[Math.floor(Math.random() * files.length)];
  rolling++;
  loadRec(ctx, name).then(buf => {
    if (!buf) { rolling--; synthThunder(ctx, near, t0, delay, level); return; }
    const s = ctx.createBufferSource(); s.buffer = buf;
    s.playbackRate.value = 0.93 + Math.random() * 0.1;              // a touch of variety: no two strikes quite the same
    const g = ctx.createGain(); g.gain.value = (near ? 0.5 : 0.3) * (REC_GAIN[name] ?? 1) * level;
    let node = s;
    if (!near) {
      // far away the highs are gone: the crack becomes a deep roll
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520 + Math.random() * 260; lp.Q.value = 0.5;
      s.connect(lp); node = lp;
    }
    node.connect(g);
    let last = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.1 - 0.55; g.connect(p); last = p; }
    last.connect(getSfxBus());
    s.onended = () => { rolling--; try { last.disconnect(); } catch { /* gone */ } };
    s.start(Math.max(ctx.currentTime, t0));
  });
}

/** A firework, heard from across the city: a soft low thump as it bursts, then a short sparkle of crackles (PARTY NIGHTS'
 *  midnight finale). delay: seconds from now (the burst is in the sky before the sound arrives). Quiet, premium. */
export function fireworkBurst({ delay = 0.35, level = 1 } = {}) {
  if (!isUnlocked()) return;
  const ctx = getContext();
  const t0 = ctx.currentTime + delay;
  const out = ctx.createGain(); out.gain.value = 0.55 * level;
  out.connect(getSfxBus());
  // the thump: a low sine dropping in pitch, a little body from filtered noise
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(96, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.32);
  const og = ctx.createGain(); og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(0.22, t0 + 0.012); og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
  o.connect(og).connect(out); o.start(t0); o.stop(t0 + 0.6);
  const body = ctx.createBufferSource(); body.buffer = noise(ctx);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
  const bg = ctx.createGain(); bg.gain.setValueAtTime(0, t0); bg.gain.linearRampToValueAtTime(0.16, t0 + 0.01); bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
  body.connect(lp).connect(bg).connect(out); body.start(t0, Math.random(), 0.45);
  // the crackle: a sparkle of tiny bright pops over the next second and a half, thinning out
  const n = 10 + Math.floor(Math.random() * 8);
  for (let i = 0; i < n; i++) {
    const at = t0 + 0.12 + Math.pow(Math.random(), 0.7) * 1.5;
    const s = ctx.createBufferSource(); s.buffer = noise(ctx);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 3200; bp.Q.value = 2.5;
    const g = ctx.createGain(); const a = 0.035 * (1 - (at - t0) / 1.9) * (0.5 + Math.random() * 0.5);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, at + 0.05 + Math.random() * 0.06);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.2 - 0.6; s.connect(bp).connect(g).connect(pan).connect(out); } else s.connect(bp).connect(g).connect(out);
    s.start(at, Math.random() * 1.8, 0.15);   // (the noise buffer is 2 s: an offset past ~1.85 s cut the crackle short or silent)
  }
  setTimeout(() => { try { out.disconnect(); } catch { /* gone */ } }, (delay + 2.5) * 1000);
}

// the synthesized thunder (no recordings listed, or a file that won't load): a crack + thump (near) and a reverberant roll
function synthThunder(ctx, near, t0, delay, level = 1) {
  const out = ctx.createGain(); out.gain.value = (near ? 1 : 0.62) * level;
  const verb = ctx.createConvolver(); verb.buffer = space(ctx);
  const wet = ctx.createGain(); wet.gain.value = near ? 0.55 : 0.85;
  out.connect(getSfxBus()); out.connect(verb); verb.connect(wet).connect(getSfxBus());
  const pan = (node, v) => { if (!ctx.createStereoPanner) return node; const p = ctx.createStereoPanner(); p.pan.value = v; node.connect(p); return p; };
  const side = Math.random() * 1.2 - 0.6;
  if (near) {
    // the crack: a tearing burst of bright noise, then a sizzle of smaller cracks
    const s = ctx.createBufferSource(); s.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.075, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.002, t0 + 0.35);
    s.connect(hp).connect(g); pan(g, side).connect(out);
    s.start(t0, Math.random(), 0.4);
    for (let i = 0; i < 9; i++) droplet(ctx, t0 + 0.02 + Math.random() * 0.4, out, 0.05 * (1 - i / 10));
    // the thump you feel: a low sine dropping in pitch
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(62, t0 + 0.03); o.frequency.exponentialRampToValueAtTime(34, t0 + 0.9);
    const og = ctx.createGain(); og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(0.12, t0 + 0.05); og.gain.exponentialRampToValueAtTime(0.001, t0 + 1.2);
    o.connect(og).connect(out); o.start(t0); o.stop(t0 + 1.3);
  }
  // the roll: several overlapping swells of low rumble, each from a slightly different direction
  const rolls = near ? 4 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);
  let at = t0 + (near ? 0.08 : 0);
  for (let i = 0; i < rolls; i++) {
    const s = ctx.createBufferSource(); s.buffer = brown(ctx); s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = (near ? 260 : 150) * (0.75 + Math.random() * 0.5); lp.Q.value = 0.7;
    const g = ctx.createGain();
    const peak = (near ? 0.5 : 0.36) * (i === 0 ? 1 : 0.55 + Math.random() * 0.5), rise = 0.12 + Math.random() * 0.35, fall = 1.4 + Math.random() * 2.4;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + rise); g.gain.exponentialRampToValueAtTime(0.0004, at + rise + fall);
    s.connect(lp).connect(g); pan(g, Math.max(-1, Math.min(1, side + (Math.random() - 0.5) * 0.8))).connect(out);
    s.start(at, Math.random() * 3, rise + fall + 0.1);
    at += 0.25 + Math.random() * (near ? 0.7 : 1.1);
  }
  setTimeout(() => { out.disconnect(); wet.disconnect(); }, (delay + 9) * 1000);
}
