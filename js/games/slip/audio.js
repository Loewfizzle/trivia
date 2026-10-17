// SLIPSTREAM audio.
//
// SONGS play on the server clock (audio/synced-songs.js), through an adaptive chain:
//   voices -> low-pass -> high-shelf -> [dry | reverb send | echo send] -> swell gain -> out -> music bus
// Each biome sets a treatment (crossfaded as the biome blends): DUSK DUNES soft, warm, low-passed and dreamy;
// CRYSTAL CANYON open with a shimmering reverb; FLOATING CITY clear and bright; LIGHTNING STORM full power and
// punchy; OPEN SPACE huge and echoing. The rider adds reactions on top: airtime swells the music, a near-crash
// drops it out for a heartbeat, a crash muffles it briefly, LAST RIDERS opens the whole mix up. All small moves.
//
// SFX are synthesized (soft, on the SFX bus): wind rush that follows speed, launch whoosh, flip swoosh, a landing
// chime that climbs a pentatonic scale with the combo, crash shatter, the rewind, a laser hum near gates, rings.
import { getContext, getMusicBus, getSfxBus } from '../../audio/engine.js';
import { createSyncedSongs } from '../../audio/synced-songs.js';
import { settings } from '../../audio/settings.js';

const base = new URL('../../../', import.meta.url);
export const songUrl = id => new URL(`audio/music/${id}.mp3`, base).href;

// biome treatments: lp (Hz), shelf (dB at 6 kHz), rev (send), echo (send), echoT (s), gain
export const TREAT = {
  dunes: { lp: 2600, shelf: -5, rev: 0.32, echo: 0.12, echoT: 0.42, gain: 0.92 },
  crystal: { lp: 15000, shelf: 2.5, rev: 0.5, echo: 0.16, echoT: 0.33, gain: 0.95 },
  city: { lp: 20000, shelf: 1.5, rev: 0.12, echo: 0.04, echoT: 0.25, gain: 1 },
  storm: { lp: 20000, shelf: 3, rev: 0.06, echo: 0.02, echoT: 0.2, gain: 1.08 },
  space: { lp: 8500, shelf: -1, rev: 0.62, echo: 0.36, echoT: 0.55, gain: 0.96 },
};
const lerp = (a, b, k) => a + (b - a) * k;
const logLerp = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));

function impulse(ctx, secs = 3.2, decay = 2.6) {
  const n = Math.floor(ctx.sampleRate * secs);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) { lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = lp * Math.pow(1 - i / n, decay); }
  }
  return b;
}

export function createMusic() {
  let ch = null;
  let want = { ...TREAT.dunes };
  let react = { swell: 0, lastRiders: false };
  let muffleUntil = 0, dipUntil = 0;
  const songs = createSyncedSongs({
    urlFor: songUrl,
    label: 'slip song',
    connect(ctx) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = TREAT.dunes.lp; lp.Q.value = 0.6;
      const shelf = ctx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 6000; shelf.gain.value = TREAT.dunes.shelf;
      const dry = ctx.createGain();
      const revSend = ctx.createGain(); revSend.gain.value = TREAT.dunes.rev;
      const rev = ctx.createConvolver(); rev.buffer = impulse(ctx);
      const echoSend = ctx.createGain(); echoSend.gain.value = TREAT.dunes.echo;
      const echo = ctx.createDelay(1.5); echo.delayTime.value = TREAT.dunes.echoT;
      const fb = ctx.createGain(); fb.gain.value = 0.35;
      const echoLp = ctx.createBiquadFilter(); echoLp.type = 'lowpass'; echoLp.frequency.value = 3500;
      const swell = ctx.createGain(); swell.gain.value = 1;
      const out = ctx.createGain(); out.gain.value = TREAT.dunes.gain;
      lp.connect(shelf);
      shelf.connect(dry).connect(swell);
      shelf.connect(revSend).connect(rev).connect(swell);
      shelf.connect(echoSend).connect(echo).connect(echoLp).connect(swell);
      echoLp.connect(fb).connect(echo);
      swell.connect(out).connect(getMusicBus());
      ch = { lp, shelf, revSend, echoSend, echo, swell, out, all: [lp, shelf, dry, revSend, rev, echoSend, echo, fb, echoLp, swell, out] };
      return lp;
    },
  });
  let finaleAt = null, faded = false;   // once the ride's music has faded out (results) it stays out
  let lastApply = 0;

  function tick(nowServer) {
    const ctx = songs.tick();
    if (!ctx || !ch) return;
    const t = ctx.currentTime;
    const pn = performance.now();
    if (pn - lastApply < 60) return;
    lastApply = pn;
    const muffled = pn < muffleUntil;
    const lr = react.lastRiders;
    // the low-pass: the biome's, opened by airtime / LAST RIDERS, closed hard by a crash
    let lp = want.lp;
    if (lr) lp = Math.max(lp, 14000);
    lp = logLerp(lp, 20000, Math.min(1, react.swell * 0.5));
    if (muffled) lp = 520;
    ch.lp.frequency.setTargetAtTime(lp, t, muffled ? 0.04 : 0.35);
    ch.shelf.gain.setTargetAtTime(want.shelf + (lr ? 2.5 : 0), t, 0.4);
    ch.revSend.gain.setTargetAtTime(want.rev, t, 0.6);
    ch.echoSend.gain.setTargetAtTime(want.echo, t, 0.6);
    ch.echo.delayTime.setTargetAtTime(want.echoT, t, 0.8);
    const dip = pn < dipUntil;
    ch.swell.gain.setTargetAtTime(dip ? 0.18 : 1 + react.swell * 0.1 + (lr ? 0.08 : 0), t, dip ? 0.015 : 0.25);
    if (finaleAt && nowServer >= finaleAt) { faded = true; finaleAt = null; }
    ch.out.gain.setTargetAtTime(faded ? 0 : want.gain, t, faded ? 0.9 : 0.5);
  }

  return {
    setGame(g) { songs.setGame(g); },
    /** the biome blend at the rider: { a: id, b: id|null, mix } */
    setBiome(a, b, mix) {
      const A = TREAT[a] || TREAT.dunes, B = b ? TREAT[b] : null;
      if (!B) { want = { ...A }; return; }
      const k = mix * mix * (3 - 2 * mix);
      want = { lp: logLerp(A.lp, B.lp, k), shelf: lerp(A.shelf, B.shelf, k), rev: lerp(A.rev, B.rev, k), echo: lerp(A.echo, B.echo, k), echoT: lerp(A.echoT, B.echoT, k), gain: lerp(A.gain, B.gain, k) };
    },
    /** airtime 0..1 (eased by the caller) */
    setSwell(v) { react.swell = Math.max(0, Math.min(1, v)); },
    setLastRiders(on) { react.lastRiders = !!on; },
    nearCrash() { dipUntil = performance.now() + 140; },
    crash() { muffleUntil = performance.now() + 900; },
    fadeOutAt(at) { finaleAt = at; },
    tick,
    ready: i => songs.ready(i),
    debug() {
      return {
        ready: !!ch, out: ch ? +ch.out.gain.value.toFixed(3) : null, faded, want: { ...want, lp: Math.round(want.lp) }, lp: ch ? Math.round(ch.lp.frequency.value) : null,
        swell: ch ? +ch.swell.gain.value.toFixed(3) : 1, rev: ch ? +ch.revSend.gain.value.toFixed(3) : 0, lastRiders: react.lastRiders,
        ...songs.debug(),
      };
    },
    stop() {
      songs.stop();
      if (ch) { const nodes = ch.all; setTimeout(() => nodes.forEach(n => { try { n.disconnect(); } catch { /* fine */ } }), 1200); }
    },
  };
}

// ================================================================ synth sfx
const PENT = [0, 2, 4, 7, 9];
export function createSfx() {
  let ctx = null, out = null, noise = null, wind = null, hum = null;
  const log = [];
  function ready() {
    const c = getContext();
    if (!c || c.state !== 'running' || settings.muted) return null;
    if (ctx !== c) {
      ctx = c;
      out = ctx.createGain(); out.gain.value = 0.55; out.connect(getSfxBus());
      const n = ctx.sampleRate * 2;
      noise = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      wind = null; hum = null;
    }
    return ctx;
  }
  function noiseSrc(loop = false) { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = loop; return s; }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, t, { type = 'sine', a = 0.005, dec = 0.4, peak = 0.12, dest = out, detune = 0 } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const g = ctx.createGain(); env(g, t, a, peak, dec);
    o.connect(g).connect(dest); o.start(t); o.stop(t + a + dec + 0.05);
  }
  function whoosh(t, { from = 400, to = 2400, dur = 0.35, peak = 0.12, q = 1.2 } = {}) {
    const s = noiseSrc(); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  return {
    log,
    /** continuous: wind with speed (0..1), laser hum when near a gate (0..1); call every frame-ish */
    loops({ speed = 0, hum: h = 0, on = true }) {
      if (!ready()) return;
      const t = ctx.currentTime;
      if (!wind) {
        const s = noiseSrc(true); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7; f.frequency.value = 500;
        const g = ctx.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(out); s.start();
        wind = { s, f, g };
      }
      wind.g.gain.setTargetAtTime(on ? 0.004 + speed * speed * 0.05 : 0, t, 0.25);
      wind.f.frequency.setTargetAtTime(300 + speed * 1600, t, 0.3);
      if (!hum) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
        const g = ctx.createGain(); g.gain.value = 0; o.connect(f).connect(g).connect(out); o.start();
        hum = { o, g };
      }
      hum.g.gain.setTargetAtTime(on ? h * 0.018 : 0, t, 0.12);
    },
    play(name, o = {}) {
      log.push(name); if (log.length > 60) log.shift();
      if (!ready()) return;
      const t = ctx.currentTime + 0.005;
      if (name === 'launch') whoosh(t, { from: 300, to: 1800, dur: 0.45, peak: 0.09 });
      else if (name === 'flip') whoosh(t, { from: 900, to: 3200, dur: 0.28, peak: 0.07, q: 2 });
      else if (name === 'land') {
        // a soft chime, one pentatonic step higher per combo; bigger combos add a fifth
        const k = Math.min(14, o.combo || 0);
        const step = PENT[k % 5] + 12 * Math.floor(k / 5);
        const f = 523.25 * Math.pow(2, step / 12);
        tone(f, t, { type: 'sine', dec: 0.9, peak: 0.07 });
        tone(f * 2, t, { type: 'triangle', dec: 0.35, peak: 0.02 });
        if (k >= 3) tone(f * 1.5, t + 0.05, { dec: 0.7, peak: 0.035 });
      } else if (name === 'touch') {
        // a plain landing: a soft low thump
        tone(110, t, { type: 'sine', dec: 0.12, peak: 0.07 });
      } else if (name === 'crash') {
        whoosh(t, { from: 5000, to: 600, dur: 0.6, peak: 0.12, q: 0.8 });
        for (let i = 0; i < 6; i++) tone(1800 + Math.random() * 2600, t + i * 0.025 + Math.random() * 0.02, { type: 'triangle', dec: 0.25, peak: 0.025 });
        tone(70, t, { type: 'sine', dec: 0.4, peak: 0.1 });
      } else if (name === 'rewind') {
        const o2 = ctx.createOscillator(); o2.type = 'sine';
        o2.frequency.setValueAtTime(900, t); o2.frequency.exponentialRampToValueAtTime(220, t + 0.8);
        const g = ctx.createGain(); env(g, t, 0.05, 0.05, 0.75);
        o2.connect(g).connect(out); o2.start(t); o2.stop(t + 0.9);
        whoosh(t, { from: 3000, to: 400, dur: 0.85, peak: 0.05 });
      } else if (name === 'respawn') {
        tone(392, t, { dec: 0.5, peak: 0.05 }); tone(587.33, t + 0.08, { dec: 0.6, peak: 0.05 });
      } else if (name === 'ring') {
        tone(1046.5, t, { type: 'sine', dec: 0.5, peak: 0.06 }); tone(1568, t + 0.06, { type: 'sine', dec: 0.6, peak: 0.05 });
        whoosh(t, { from: 1500, to: 5000, dur: 0.3, peak: 0.04, q: 3 });
      } else if (name === 'gate') whoosh(t, { from: 2000, to: 700, dur: 0.22, peak: 0.035, q: 4 });
      else if (name === 'gflip') {
        const o2 = ctx.createOscillator(); o2.type = 'triangle';
        o2.frequency.setValueAtTime(o.g < 0 ? 220 : 440, t); o2.frequency.exponentialRampToValueAtTime(o.g < 0 ? 440 : 220, t + 0.5);
        const g = ctx.createGain(); env(g, t, 0.02, 0.05, 0.5); o2.connect(g).connect(out); o2.start(t); o2.stop(t + 0.6);
      } else if (name === 'count') tone(o.go ? 880 : 660, t, { type: 'sine', dec: o.go ? 0.6 : 0.2, peak: 0.07 });
      else if (name === 'out') { tone(196, t, { dec: 1.2, peak: 0.06 }); tone(146.8, t + 0.12, { dec: 1.4, peak: 0.05 }); }
      else if (name === 'lead') { tone(784, t, { dec: 0.3, peak: 0.04 }); tone(1174.7, t + 0.07, { dec: 0.4, peak: 0.04 }); }
    },
    stop() {
      try { if (wind) { wind.s.stop(); wind.g.disconnect(); } if (hum) { hum.o.stop(); hum.g.disconnect(); } } catch { /* fine */ }
      wind = null; hum = null;
    },
  };
}
