// RUMRUNNER sound: warm and premium, never harsh. Everything on the SFX bus (the settings slider), silent when muted.
// Ambience (continuous, faded by weather): rain, a distant city murmur, the truck's engine while driving.
//   thunder    a low rumble when the sky flashes
//   siren      a two-tone wail for the feds
//   register   ka-ching: the sale rung up          coins   a few clinks (small trades, payments)
//   type       a typewriter key (Vale's lines)     ding    the carriage bell
//   press      the printing press (looping thumps) rustle  a newspaper shaken open
//   sting      a short jazz brass accent (big events)       low   an ominous low accent (Vale's men, hijackers)
//   done       the day locked in                   tick    the last seconds
//   drive      engine on (start / stop)
import { getContext, getSfxBus } from '../../audio/engine.js';
import { settings } from '../../audio/settings.js';
import { thunder as recordedThunder } from '../../audio/ambience.js';

export function createSfx() {
  let ctx = null, out = null, noise = null, amb = null;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function ready() {
    const c = getContext();
    if (!c || c.state !== 'running' || settings.muted) return null;
    if (ctx !== c) {
      ctx = c;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 2.6; comp.attack.value = 0.005; comp.release.value = 0.25;
      out = ctx.createGain(); out.gain.value = 0.6;
      out.connect(comp).connect(getSfxBus());
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      amb = null;
    }
    return ctx;
  }
  const env = (g, t, a, peak, dcy, sus = 0) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + dcy); };
  function tone(freq, { type = 'sine', t = 0, a = 0.005, d = 0.2, v = 0.2, to = null, pan = 0, dest = out } = {}) {
    const c = ready(); if (!c) return;
    const t0 = c.currentTime + t;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    const g = c.createGain(); env(g, t0, a, v, d);
    const p = c.createStereoPanner(); p.pan.value = pan;
    o.connect(g).connect(p).connect(dest); o.start(t0); o.stop(t0 + a + d + 0.05);
  }
  function hiss({ t = 0, a = 0.003, d = 0.12, v = 0.12, hz = 2000, q = 0.8, type = 'bandpass', dest = out } = {}) {
    const c = ready(); if (!c) return null;
    const t0 = c.currentTime + t;
    const s = c.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = q;
    const g = c.createGain(); env(g, t0, a, v, d);
    s.connect(f).connect(g).connect(dest); s.start(t0); s.stop(t0 + a + d + 0.05);
    return { s, f, g };
  }

  // ---------------------------------------------------------------- ambience: rain, the city, the engine
  function ambience() {
    const c = ready(); if (!c) return null;
    if (amb) return amb;
    const mk = (hz, type, q, gain) => { const s = c.createBufferSource(); s.buffer = noise; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(out); s.start(); return { s, f, g, want: 0, max: gain }; };
    const rain = mk(3200, 'bandpass', 0.5, 0.09);
    const city = mk(220, 'lowpass', 0.4, 0.05);
    const eng = c.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 42;
    const engF = c.createBiquadFilter(); engF.type = 'lowpass'; engF.frequency.value = 180;
    const engG = c.createGain(); engG.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = 9; const lg = c.createGain(); lg.gain.value = 6; lfo.connect(lg).connect(eng.frequency); lfo.start();
    eng.connect(engF).connect(engG).connect(out); eng.start();
    amb = { rain, city, engine: { g: engG, want: 0, max: 0.07 }, timer: 0 };
    const step = () => { if (!amb || ctx !== c) return; const t = c.currentTime; for (const k of ['rain', 'city', 'engine']) { const x = amb[k]; x.g.gain.setTargetAtTime(x.want * x.max, t, 1.2); } amb.timer = setTimeout(step, 400); };
    step();
    return amb;
  }

  const api = {
    /** Weather ambience: rain level 0–1.6, the city murmur on. */
    weather(w) {
      const a = ambience(); if (!a) return;
      a.rain.want = w === 'rain' ? 0.6 : w === 'storm' ? 1 : 0;
      a.city.want = w === 'dawn' ? 0.5 : 1;
      a.rain.f.frequency.value = w === 'storm' ? 2200 : 3200;
    },
    drive(on) { const a = ambience(); if (a) a.engine.want = on ? 1 : 0; },
    // real recorded thunder (audio/weather/), under the game's music: mostly distant, now and then close, a little quieter than
    // the title's (the city is the backdrop here)
    thunder() {
      if (!ready()) return;
      recordedThunder({ near: Math.random() < 0.3, delay: 0.5 + Math.random() * 1.6, level: 0.7 });
    },
    siren() {
      const c = ready(); if (!c) return;
      for (let i = 0; i < 4; i++) { tone(i % 2 ? 660 : 495, { type: 'triangle', t: i * 0.42, a: 0.05, d: 0.36, v: 0.045, pan: i % 2 ? 0.3 : -0.3 }); }
      hiss({ d: 1.6, v: 0.02, hz: 1200, q: 0.3 });
    },
    register() {
      tone(2600, { type: 'square', a: 0.001, d: 0.06, v: 0.05 });
      tone(1820, { type: 'triangle', t: 0.07, a: 0.002, d: 0.6, v: 0.16 });
      tone(2730, { type: 'sine', t: 0.07, a: 0.002, d: 0.5, v: 0.08 });
      hiss({ t: 0.05, d: 0.08, v: 0.08, hz: 5000, q: 1.2 });
    },
    coins(n = 3) {
      for (let i = 0; i < Math.min(8, n); i++) { const f = rnd(3200, 4600); tone(f, { type: 'sine', t: i * 0.055 + rnd(0, 0.02), a: 0.001, d: 0.18, v: 0.05, pan: rnd(-0.4, 0.4) }); tone(f * 1.5, { type: 'sine', t: i * 0.055, a: 0.001, d: 0.09, v: 0.025 }); }
    },
    type() { hiss({ a: 0.001, d: 0.045, v: 0.09, hz: rnd(1800, 2600), q: 1.5 }); tone(rnd(900, 1300), { type: 'square', a: 0.001, d: 0.02, v: 0.012 }); },
    ding() { tone(2093, { type: 'sine', a: 0.002, d: 0.7, v: 0.07 }); tone(4186, { type: 'sine', a: 0.002, d: 0.3, v: 0.02 }); },
    press(on) {
      const c = ready(); if (!c) return;
      if (!on) { if (api._press) { clearInterval(api._press); api._press = null; } return; }
      if (api._press) return;
      const thump = () => { tone(70, { type: 'sine', a: 0.004, d: 0.14, v: 0.14, to: 45 }); hiss({ a: 0.002, d: 0.06, v: 0.05, hz: 900, q: 0.7 }); setTimeout(() => hiss({ a: 0.002, d: 0.05, v: 0.035, hz: 2600, q: 1 }), 120); };
      thump(); api._press = setInterval(thump, 520);
    },
    rustle() { hiss({ a: 0.02, d: 0.25, v: 0.07, hz: 3400, q: 0.5 }); hiss({ t: 0.18, a: 0.01, d: 0.3, v: 0.05, hz: 2400, q: 0.5 }); },
    sting() {
      // a brass hit: a root, a flat seventh and a ninth, staccato, a touch of air
      const notes = [220, 392, 495];
      notes.forEach((f, i) => { tone(f, { type: 'sawtooth', a: 0.01, d: 0.42, v: 0.028, pan: (i - 1) * 0.25 }); tone(f * 2, { type: 'triangle', a: 0.01, d: 0.3, v: 0.012 }); });
      hiss({ d: 0.3, v: 0.03, hz: 2400, q: 0.4 });
    },
    low() { tone(55, { type: 'triangle', a: 0.02, d: 1.4, v: 0.14 }); tone(82.4, { type: 'sine', t: 0.1, a: 0.03, d: 1.2, v: 0.07 }); hiss({ a: 0.05, d: 0.8, v: 0.04, hz: 160, q: 0.8, type: 'lowpass' }); },
    done() { tone(392, { type: 'triangle', a: 0.004, d: 0.18, v: 0.07 }); tone(587, { type: 'triangle', t: 0.09, a: 0.004, d: 0.3, v: 0.07 }); hiss({ a: 0.002, d: 0.05, v: 0.05, hz: 1400, q: 1 }); },
    tick() { tone(1400, { type: 'sine', a: 0.001, d: 0.05, v: 0.035 }); },
    tap() { hiss({ a: 0.001, d: 0.03, v: 0.04, hz: 1800, q: 1 }); },
    horn() { tone(185, { type: 'sawtooth', a: 0.05, d: 0.5, v: 0.025 }); tone(233, { type: 'sawtooth', a: 0.05, d: 0.5, v: 0.02 }); },
    stop() { if (api._press) { clearInterval(api._press); api._press = null; } if (amb) { clearTimeout(amb.timer); for (const k of ['rain', 'city', 'engine']) amb[k].want = 0; const a = amb; setTimeout(() => { try { a.rain.s.stop(); a.city.s.stop(); } catch { /* done */ } }, 2500); amb = null; } },
  };
  return api;
}
