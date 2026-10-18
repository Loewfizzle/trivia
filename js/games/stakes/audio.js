// HIGH STAKES sound: tactile and warm, never loud. Everything on the SFX bus (the settings slider), silent when muted.
//   chip    a clay chip set down: two tiny resonant clacks (band-passed noise + a short high ping), a soft felt thump
//   chips   a stack sliding in: n clacks with a little random timing and pitch, settling
//   flip    a card turning: a paper whoosh and a crisp snap
//   lock    the bet pushed in: a felt thump, a clack, a low warm note
//   correct the right answer glowing: a soft bell over a low fifth
//   lose    chips sliding away to the house: a dry rustle falling in pitch
//   dd      DOUBLE DOWN: a low swell, a struck gold shimmer
//   allin   ALL IN: a low beating drone (start / stop)
//   tick    a showdown card's tick
// If a voice ever sounds cheap, it gets quieter or simpler — never louder.
import { getContext, getSfxBus } from '../../audio/engine.js';
import { settings } from '../../audio/settings.js';

export function createSfx() {
  let ctx = null, out = null, noise = null, room = null, drone = null;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function ready() {
    const c = getContext();
    if (!c || c.state !== 'running' || settings.muted) return null;
    if (ctx !== c) {
      ctx = c;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 14; comp.ratio.value = 2.4; comp.attack.value = 0.004; comp.release.value = 0.2;
      out = ctx.createGain(); out.gain.value = 0.65;
      out.connect(comp).connect(getSfxBus());
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // a small warm room: the back room's walls
      room = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 0.9);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp = lp * 0.75 + (Math.random() * 2 - 1) * 0.25; x[i] = lp * Math.pow(1 - i / len, 3.4); } }
      room.buffer = ir;
      const rg = ctx.createGain(); rg.gain.value = 0.3; room.connect(rg).connect(out);
    }
    return ctx;
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function send(node, wet = 0.15, pan = 0) {
    let n = node;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(out);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; n.connect(w).connect(room); }
  }
  function burst(t, { f = 3800, q = 6, dur = 0.03, peak = 0.05, type = 'bandpass', to = null, wet = 0.1, pan = 0 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.Q.value = q; flt.frequency.setValueAtTime(f, t);
    if (to) flt.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); env(g, t, 0.0015, peak, dur);
    s.connect(flt).connect(g); send(g, wet, pan);
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.05);
  }
  function tone(f, t, { type = 'sine', a = 0.003, dec = 0.08, peak = 0.02, slide = 0, wet = 0.1, pan = 0 } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + a + dec);
    const g = ctx.createGain(); env(g, t, a, peak, dec);
    o.connect(g); send(g, wet, pan);
    o.start(t); o.stop(t + a + dec + 0.05);
  }
  function bell(f, t, { peak = 0.02, dec = 1.2, ratio = 3.01, index = 1.4, wet = 0.35, pan = 0 } = {}) {
    const c = ctx.createOscillator(); c.frequency.value = f;
    const m = ctx.createOscillator(); m.frequency.value = f * ratio;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(f * 0.03, t + dec * 0.5);
    m.connect(mg).connect(c.frequency);
    const g = ctx.createGain(); env(g, t, 0.004, peak, dec);
    c.connect(g); send(g, wet, pan);
    c.start(t); m.start(t); c.stop(t + dec + 0.1); m.stop(t + dec + 0.1);
  }
  // one clay chip meeting another
  function clack(t, k = 1, pan = 0) {
    const f = rnd(3300, 4400) * k;
    burst(t, { f, q: 9, dur: 0.022, peak: 0.05, wet: 0.08, pan });
    tone(f * 0.62, t, { dec: 0.045, peak: 0.009, wet: 0.05, pan });
    burst(t + rnd(0.012, 0.02), { f: f * rnd(0.86, 0.95), q: 8, dur: 0.018, peak: 0.028, wet: 0.06, pan });
  }

  const VOICES = {
    chip(t, { pan = 0 } = {}) {
      clack(t, 1, pan);
      burst(t, { type: 'lowpass', f: 420, q: 0.7, dur: 0.06, peak: 0.03, wet: 0.04, pan });   // felt
    },
    chips(t, { n = 6, pan = 0 } = {}) {
      const m = Math.max(2, Math.min(14, n));
      let at = t;
      for (let i = 0; i < m; i++) { clack(at, rnd(0.94, 1.06) * (1 - i * 0.008), pan + rnd(-0.1, 0.1)); at += rnd(0.035, 0.07) * (i > m - 4 ? 1.4 : 1); }
      burst(at, { type: 'lowpass', f: 380, q: 0.7, dur: 0.08, peak: 0.025, wet: 0.05, pan });
    },
    flip(t) {
      burst(t, { type: 'bandpass', f: 1600, to: 5200, q: 0.8, dur: 0.12, peak: 0.022, wet: 0.12 });
      burst(t + 0.11, { f: 5200, q: 3, dur: 0.018, peak: 0.04, wet: 0.08 });
      tone(320, t + 0.11, { dec: 0.05, peak: 0.01 });
    },
    deal(t) {
      burst(t, { type: 'bandpass', f: 900, to: 2600, q: 0.6, dur: 0.22, peak: 0.016, wet: 0.1 });
    },
    lock(t) {
      burst(t, { type: 'lowpass', f: 300, q: 0.8, dur: 0.1, peak: 0.07, wet: 0.06 });
      clack(t + 0.01, 0.9);
      tone(196, t + 0.02, { type: 'triangle', dec: 0.35, peak: 0.018, wet: 0.25 });
      tone(294, t + 0.04, { type: 'sine', dec: 0.3, peak: 0.01, wet: 0.25 });
    },
    correct(t) {
      bell(1046.5, t, { peak: 0.018, dec: 1.4 });
      bell(1568, t + 0.05, { peak: 0.011, dec: 1.2, pan: 0.2 });
      tone(261.6, t, { dec: 0.9, peak: 0.016, wet: 0.3 });
      tone(392, t + 0.02, { dec: 0.8, peak: 0.01, wet: 0.3 });
    },
    wrong(t) {
      tone(220, t, { type: 'triangle', dec: 0.4, peak: 0.014, slide: 196, wet: 0.2 });
    },
    lose(t) {
      burst(t, { type: 'bandpass', f: 2600, to: 700, q: 0.9, dur: 0.45, peak: 0.02, wet: 0.12 });
      for (let i = 0; i < 4; i++) clack(t + 0.05 + i * 0.07, 0.8 - i * 0.04);
    },
    dd(t) {
      tone(55, t, { type: 'sine', a: 0.5, dec: 0.9, peak: 0.05, slide: 82, wet: 0.2 });
      burst(t, { type: 'bandpass', f: 200, to: 2400, q: 0.6, dur: 0.6, peak: 0.02, wet: 0.3 });
      [784, 1175, 1568, 2093].forEach((f, i) => bell(f, t + 0.55 + i * 0.06, { peak: 0.01, dec: 1.6, ratio: 2.0, index: 0.9, pan: -0.3 + i * 0.2 }));
    },
    tick(t) {
      burst(t, { f: 2400, q: 5, dur: 0.02, peak: 0.03, wet: 0.08 });
      tone(880, t, { dec: 0.04, peak: 0.006 });
    },
    win(t) {
      bell(784, t, { peak: 0.014, dec: 1.0 });
      bell(1175, t + 0.08, { peak: 0.012, dec: 1.0, pan: 0.2 });
      VOICES.chips(t + 0.1, { n: 8 });
    },
    deny(t) {
      tone(140, t, { dec: 0.12, peak: 0.03, slide: 100, wet: 0.05 });
    },
  };

  /** The ALL IN drone: two low sines beating against each other, under everything (on/off). */
  function tension(on) {
    if (!ready()) return;
    const t = ctx.currentTime;
    if (on && !drone) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 2.5);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const o1 = ctx.createOscillator(); o1.frequency.value = 55;
      const o2 = ctx.createOscillator(); o2.frequency.value = 55.7;
      const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 82.4; const g3 = ctx.createGain(); g3.gain.value = 0.25;
      o1.connect(lp); o2.connect(lp); o3.connect(g3).connect(lp); lp.connect(g); send(g, 0.25);
      [o1, o2, o3].forEach(o => o.start(t));
      drone = { g, osc: [o1, o2, o3] };
    } else if (!on && drone) {
      const d = drone; drone = null;
      d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(Math.max(0.0001, d.g.gain.value), t); d.g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      d.osc.forEach(o => o.stop(t + 1.3));
    }
  }

  return {
    play(name, opts) { try { if (ready() && VOICES[name]) VOICES[name](ctx.currentTime + 0.01, opts || {}); } catch { /* polish */ } },
    tension(on) { try { tension(on); } catch { /* polish */ } },
    stop() { try { tension(false); } catch { /* fine */ } },
  };
}
