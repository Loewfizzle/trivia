// GRIDLOCK sound: synthesized, soft, premium — felt more than heard. Everything on the SFX bus; music is handled by
// audio/music.js (the seeded playlist, duckMusic + filterMusic for the impacts).
import { getContext, getSfxBus } from '../../audio/engine.js';
import { settings } from '../../audio/settings.js';

export function createSfx() {
  let ctx = null, out = null, noise = null, rev = null;
  const log = [];
  function ready() {
    const c = getContext();
    if (!c || c.state !== 'running' || settings.muted) return null;
    if (ctx !== c) {
      ctx = c;
      out = ctx.createGain(); out.gain.value = 0.6; out.connect(getSfxBus());
      const n = ctx.sampleRate * 2;
      noise = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      // a short, dark room for the impacts
      const ir = ctx.createBuffer(2, ctx.sampleRate * 1.6, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < x.length; i++) { lp = lp * 0.7 + (Math.random() * 2 - 1) * 0.3; x[i] = lp * Math.pow(1 - i / x.length, 3); } }
      rev = ctx.createConvolver(); rev.buffer = ir;
      const rg = ctx.createGain(); rg.gain.value = 0.35; rev.connect(rg).connect(out);
    }
    return ctx;
  }
  const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
  function tone(f, t, { type = 'sine', a = 0.005, dec = 0.3, peak = 0.08, wet = 0, slide = null } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + a + dec);
    const g = ctx.createGain(); env(g, t, a, peak, dec);
    o.connect(g).connect(out); if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(rev); }
    o.start(t); o.stop(t + a + dec + 0.05);
  }
  function hiss(t, { from = 400, to = 2400, dur = 0.3, peak = 0.08, q = 1.2, wet = 0 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out); if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(rev); }
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  return {
    log,
    play(name, o = {}) {
      log.push(name); if (log.length > 80) log.shift();
      if (!ready()) return;
      const t = ctx.currentTime + 0.004;
      switch (name) {
        case 'snap': tone(620, t, { type: 'triangle', dec: 0.09, peak: 0.05 }); tone(930, t + 0.03, { dec: 0.12, peak: 0.04 }); break;
        case 'rotate': tone(1400, t, { type: 'square', dec: 0.03, peak: 0.02 }); tone(1050, t + 0.03, { type: 'square', dec: 0.03, peak: 0.015 }); break;
        case 'invalid': tone(220, t, { type: 'triangle', dec: 0.12, peak: 0.05 }); tone(180, t + 0.08, { type: 'triangle', dec: 0.14, peak: 0.05 }); break;
        case 'lock': tone(440, t, { dec: 0.1, peak: 0.05 }); tone(880, t + 0.06, { dec: 0.35, peak: 0.05, wet: 0.4 }); hiss(t, { from: 2000, to: 6000, dur: 0.12, peak: 0.02, q: 3 }); break;
        case 'targetLock': {   // tense, subtle: two low pulses + a thin rising tone
          tone(110, t, { type: 'triangle', dec: 0.22, peak: 0.06 }); tone(110, t + 0.26, { type: 'triangle', dec: 0.22, peak: 0.05 });
          tone(1200, t, { type: 'sine', a: 0.3, dec: 0.4, peak: 0.018, slide: 1900 }); break;
        }
        case 'launch': hiss(t, { from: 300, to: 2600, dur: 0.42, peak: 0.07, q: 1.4 }); tone(180, t, { type: 'sawtooth', dec: 0.3, peak: 0.02, slide: 620 }); break;
        case 'whoosh': hiss(t, { from: 900, to: 300, dur: 0.5, peak: 0.035, q: 1 }); break;
        case 'hit': {
          tone(70, t, { type: 'sine', dec: 0.45, peak: 0.16, wet: 0.6 }); hiss(t, { from: 5000, to: 500, dur: 0.35, peak: 0.1, q: 0.8, wet: 0.5 });
          for (let i = 0; i < 4; i++) tone(1500 + Math.random() * 2500, t + 0.01 + i * 0.02, { type: 'triangle', dec: 0.18, peak: 0.02 });
          break;
        }
        case 'miss': tone(880, t, { dec: 0.35, peak: 0.035, wet: 0.7, slide: 660 }); hiss(t, { from: 1200, to: 400, dur: 0.4, peak: 0.015, q: 2 }); break;
        case 'repeat': tone(500, t, { type: 'triangle', dec: 0.15, peak: 0.03 }); break;
        case 'shatter': {
          tone(55, t, { type: 'sine', dec: 0.9, peak: 0.18, wet: 0.7 });
          hiss(t, { from: 3000, to: 300, dur: 0.9, peak: 0.08, q: 0.7, wet: 0.6 });
          for (let i = 0; i < 9; i++) tone(900 + Math.random() * 3000, t + 0.04 + i * 0.045, { type: 'triangle', dec: 0.3, peak: 0.025, wet: 0.5 });
          break;
        }
        case 'powerDown': {
          const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(28, t + 1.1);
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(120, t + 1.1);
          const g = ctx.createGain(); env(g, t, 0.03, 0.07, 1.1); o2.connect(f).connect(g).connect(out); o2.start(t); o2.stop(t + 1.2);
          hiss(t + 0.1, { from: 2000, to: 150, dur: 1, peak: 0.03, q: 1 });
          break;
        }
        case 'bounty': tone(1046.5, t, { dec: 0.4, peak: 0.045, wet: 0.5 }); tone(1318.5, t + 0.09, { dec: 0.45, peak: 0.045, wet: 0.5 }); tone(1568, t + 0.18, { dec: 0.7, peak: 0.045, wet: 0.6 }); break;
        case 'elimYou': tone(196, t, { dec: 1.2, peak: 0.06 }); tone(146.8, t + 0.15, { dec: 1.4, peak: 0.05 }); break;
        case 'tick': tone(o.last ? 1100 : 820, t, { type: 'sine', dec: 0.06, peak: 0.03 }); break;
        case 'turn': tone(660, t, { dec: 0.2, peak: 0.04 }); tone(990, t + 0.07, { dec: 0.3, peak: 0.04, wet: 0.3 }); break;
        case 'sweep': hiss(t, { from: 400, to: 1600, dur: 1.2, peak: 0.006, q: 4 }); break;
        case 'win': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, { dec: 0.9, peak: 0.05, wet: 0.6 })); break;
        default: break;
      }
    },
  };
}
