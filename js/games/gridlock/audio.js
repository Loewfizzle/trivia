// GRIDLOCK sound: synthesized, layered, premium — felt more than heard. Everything on the SFX bus; music is handled by
// audio/music.js (the seeded playlist, duckMusic + filterMusic for the impacts).
//
// Every effect is a few LAYERS mixed like a sound designer would: a sub body (a sine that drops in pitch), a filtered
// noise burst with its own sweep, FM "metal" partials for the glassy / mechanical ring, and a send to one of two
// convolution reverbs (a short dark room for the UI, a long plate for the war). A soft compressor on the game's own
// bus glues the layers; a little random detune and pan keeps repeated hits from sounding like the same sample.
import { getContext, getSfxBus } from '../../audio/engine.js';
import { settings } from '../../audio/settings.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export function createSfx() {
  let ctx = null, out = null, noise = null, room = null, plate = null, comp = null;
  const log = [];

  function impulse(c, seconds, decay, bright) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp = lp * (1 - bright) + (Math.random() * 2 - 1) * bright;
        d[i] = lp * Math.pow(1 - t, decay) * (i < 48 ? i / 48 : 1);
      }
    }
    return buf;
  }
  function ready() {
    const c = getContext();
    if (!c || c.state !== 'running' || settings.muted) return null;
    if (ctx !== c) {
      ctx = c;
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.006; comp.release.value = 0.22;
      out = ctx.createGain(); out.gain.value = 0.7;
      out.connect(comp).connect(getSfxBus());
      const n = ctx.sampleRate * 2;
      noise = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      room = ctx.createConvolver(); room.buffer = impulse(ctx, 0.7, 3.2, 0.3);
      const rg = ctx.createGain(); rg.gain.value = 0.35; room.connect(rg).connect(out);
      plate = ctx.createConvolver(); plate.buffer = impulse(ctx, 2.4, 2.2, 0.5);
      const pg = ctx.createGain(); pg.gain.value = 0.45; plate.connect(pg).connect(out);
    }
    return ctx;
  }

  // ---------------------------------------------------------------- building blocks (all at audio time t)
  /** gain envelope: attack to peak, then exponential decay (optional hold) */
  function env(g, t, a, peak, dec, hold = 0) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + dec);
  }
  /** the tail of a voice: optional filter, pan, dry out + a reverb send */
  function tail(node, t, life, { pan = 0, wet = 0, verb = 'room', filter = null } = {}) {
    let n = node;
    if (filter) {
      const f = ctx.createBiquadFilter(); f.type = filter.type || 'lowpass'; f.Q.value = filter.q || 0.8;
      f.frequency.setValueAtTime(filter.f0, t);
      if (filter.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, filter.f1), t + (filter.dur || life));
      n.connect(f); n = f;
    }
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(p); n = p; }
    n.connect(out);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; n.connect(w).connect(verb === 'plate' ? plate : room); }
  }
  /** one oscillator voice */
  function tone(f, t, { type = 'sine', a = 0.004, dec = 0.3, hold = 0, peak = 0.06, slide = null, slideDur = null, detune = 0, ...rest } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + (slideDur || a + hold + dec));
    const g = ctx.createGain(); env(g, t, a, peak, dec, hold);
    o.connect(g); tail(g, t, a + hold + dec, rest);
    o.start(t); o.stop(t + a + hold + dec + 0.08);
  }
  /** an FM voice: a carrier bent by a modulator at `ratio` × its pitch; index = how metallic (modulation depth) */
  function fm(f, t, { ratio = 2, index = 2, a = 0.003, dec = 0.4, peak = 0.05, slide = null, idxDec = null, ...rest } = {}) {
    const c = ctx.createOscillator(); c.frequency.setValueAtTime(f, t);
    if (slide) c.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + a + dec);
    const m = ctx.createOscillator(); m.frequency.setValueAtTime(f * ratio, t);
    const mg = ctx.createGain(); mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(Math.max(1, f * index * 0.05), t + (idxDec || dec));
    m.connect(mg).connect(c.frequency);
    const g = ctx.createGain(); env(g, t, a, peak, dec);
    c.connect(g); tail(g, t, a + dec, rest);
    c.start(t); m.start(t); c.stop(t + a + dec + 0.08); m.stop(t + a + dec + 0.08);
  }
  /** a burst of noise through a swept filter */
  function hiss(t, { type = 'bandpass', from = 400, to = 2400, dur = 0.3, a = null, peak = 0.08, q = 1.2, ...rest } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    const att = a ?? dur * 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g); tail(g, t, dur, rest);
    s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.05);
  }
  /** a sub body: a sine that falls in pitch (the weight of an impact) */
  const sub = (f0, f1, t, dur, peak, rest = {}) => tone(f0, t, { type: 'sine', a: 0.004, dec: dur, peak, slide: f1, slideDur: dur, ...rest });
  /** a metallic ring: noise into a short feedback delay (a comb) */
  function ring(t, f, dur, peak, fb = 0.62, rest = {}) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    const d = ctx.createDelay(0.05); d.delayTime.value = 1 / f;
    const fbg = ctx.createGain(); fbg.gain.value = fb;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
    const o = ctx.createGain(); env(o, t, 0.002, 1, dur);
    s.connect(g).connect(d); d.connect(lp).connect(fbg).connect(d); d.connect(o); g.connect(o);
    tail(o, t, dur, rest);
    s.start(t, Math.random()); s.stop(t + 0.1);
    setTimeout(() => { try { d.disconnect(); fbg.disconnect(); lp.disconnect(); } catch { /* gone */ } }, (dur + 0.3) * 1000);
  }

  return {
    log,
    play(name) {
      log.push(name); if (log.length > 80) log.shift();
      if (!ready()) return;
      try { voice(name, ctx.currentTime + 0.004); } catch (e) { console.warn('gridlock sfx', name, e && e.message); }   // audio is polish, never a dependency
    },
  };

  function voice(name, t) {
      const pan = rnd(-0.25, 0.25), dt = rnd(-30, 30);
      switch (name) {
        // ---- placement
        case 'snap':   // a ship seats on the grid: a soft magnetic clunk with a bright tick
          hiss(t, { type: 'lowpass', from: 1400, to: 260, dur: 0.07, a: 0.002, peak: 0.16, q: 0.7, pan });
          tone(170, t, { type: 'sine', dec: 0.1, peak: 0.14, slide: 120, pan });
          tone(2600, t + 0.012, { type: 'triangle', dec: 0.04, peak: 0.04, pan, wet: 0.3 });
          break;
        case 'rotate':   // a servo turning: two tiny clicks
          hiss(t, { type: 'highpass', from: 2400, to: 2400, dur: 0.018, a: 0.001, peak: 0.07, q: 0.7, pan });
          hiss(t + 0.045, { type: 'highpass', from: 1900, to: 1900, dur: 0.016, a: 0.001, peak: 0.05, q: 0.7, pan });
          tone(900, t, { type: 'sine', dec: 0.03, peak: 0.04, slide: 680, pan });
          break;
        case 'invalid':   // a dull refusal: two low buzzes under a lid
          for (let i = 0; i < 2; i++) { tone(112, t + i * 0.1, { type: 'square', dec: 0.08, peak: 0.045, filter: { type: 'lowpass', f0: 520 }, pan }); tone(68, t + i * 0.1, { dec: 0.1, peak: 0.05, pan }); }
          break;
        case 'lock': {   // a heavy latch closing, then a quiet confirm chime
          hiss(t, { type: 'lowpass', from: 900, to: 180, dur: 0.11, a: 0.003, peak: 0.1, q: 0.6, pan });
          sub(95, 52, t, 0.28, 0.1, { pan, wet: 0.3 });
          fm(1100, t + 0.01, { ratio: 2.76, index: 2.6, dec: 0.5, peak: 0.028, pan, wet: 0.5, verb: 'plate' });
          tone(880, t + 0.1, { dec: 0.3, peak: 0.03, pan, wet: 0.4 }); tone(1320, t + 0.13, { dec: 0.42, peak: 0.024, pan, wet: 0.4 });
          break;
        }
        case 'turn':   // YOUR SHOT: a crisp two-note heads-up over a breath of air
          fm(880, t, { ratio: 2, index: 1.1, dec: 0.4, peak: 0.04, wet: 0.4 });
          fm(1320, t + 0.085, { ratio: 2, index: 0.9, dec: 0.5, peak: 0.034, wet: 0.45 });
          hiss(t, { type: 'bandpass', from: 500, to: 1800, dur: 0.35, peak: 0.012, q: 2 });
          break;
        case 'targetLock': {   // tense: two low pulses, a thin rising tone, a dark pad underneath
          for (let i = 0; i < 2; i++) fm(1480, t + i * 0.26, { ratio: 1.5, index: 1.8, a: 0.005, dec: 0.12, peak: 0.028, pan: i ? 0.2 : -0.2 });
          for (let i = 0; i < 2; i++) tone(110, t + i * 0.26, { type: 'triangle', dec: 0.2, peak: 0.055 });
          tone(55, t, { type: 'sawtooth', a: 0.05, hold: 0.3, dec: 0.3, peak: 0.03, filter: { type: 'lowpass', f0: 360, q: 2 } });
          tone(55.6, t, { type: 'sawtooth', a: 0.05, hold: 0.3, dec: 0.3, peak: 0.03, filter: { type: 'lowpass', f0: 360, q: 2 } });
          tone(1200, t, { a: 0.3, dec: 0.4, peak: 0.016, slide: 1900, slideDur: 0.7 });
          break;
        }
        // ---- the volley
        case 'launch': {   // a rail charging and letting go: a rising FM sweep, a whoosh, a thump, then the flight
          fm(160, t, { ratio: 1.01, index: 3.5, a: 0.02, dec: 0.34, peak: 0.045, slide: 900, pan, wet: 0.3, verb: 'plate' });
          hiss(t, { type: 'bandpass', from: 260, to: 3800, dur: 0.42, a: 0.18, peak: 0.07, q: 1.1, pan });
          sub(90, 48, t + 0.3, 0.25, 0.09, { pan });
          hiss(t + 0.32, { type: 'bandpass', from: 2600, to: 420, dur: 0.6, a: 0.05, peak: 0.035, q: 1.4, pan: -pan });   // the travel: a doppler fall
          break;
        }
        case 'whoosh': hiss(t, { type: 'bandpass', from: 2400, to: 380, dur: 0.55, peak: 0.06, q: 1.2, pan }); break;
        case 'hit': {   // the big one: weight, crack, debris, ring, plate
          sub(150 + dt, 36, t, 0.55, 0.22, { pan, wet: 0.5, verb: 'plate' });
          hiss(t, { type: 'lowpass', from: 6500, to: 180, dur: 0.42, a: 0.004, peak: 0.17, q: 0.9, pan, wet: 0.35, verb: 'plate' });
          tone(230, t, { type: 'square', dec: 0.07, peak: 0.07, slide: 55, filter: { type: 'highpass', f0: 280 }, pan });
          ring(t + 0.01, 180 + dt, 0.45, 0.12, 0.66, { pan, wet: 0.4, verb: 'plate' });
          for (let i = 0; i < 5; i++) fm(rnd(1800, 4200), t + 0.015 + i * rnd(0.012, 0.03), { ratio: 3.5, index: 1.8, dec: rnd(0.18, 0.34), peak: 0.026, pan: rnd(-0.6, 0.6), wet: 0.5, verb: 'plate' });
          hiss(t + 0.05, { type: 'lowpass', from: 300, to: 60, dur: 1.1, a: 0.1, peak: 0.05, q: 0.5, wet: 0.6, verb: 'plate' });   // the rumble that follows
          break;
        }
        case 'miss': {   // a hollow plasma ping and a little spray — pretty, empty
          fm(620 + dt, t, { ratio: 2.01, index: 1.4, dec: 0.9, peak: 0.055, slide: 540, pan, wet: 0.7, verb: 'plate' });
          hiss(t, { type: 'bandpass', from: 1900, to: 520, dur: 0.38, a: 0.02, peak: 0.04, q: 1.6, pan, wet: 0.4 });
          tone(92, t, { dec: 0.16, peak: 0.06, slide: 60, pan });
          break;
        }
        case 'repeat':   // already hit there: a dull tap
          hiss(t, { type: 'lowpass', from: 800, to: 300, dur: 0.05, a: 0.002, peak: 0.1, q: 0.7, pan });
          tone(400, t, { type: 'triangle', dec: 0.12, peak: 0.06, slide: 330, pan });
          break;
        case 'shatter': {   // a hull breaking up: weight, a wide burst, a cloud of glass, a rumble
          sub(62, 28, t, 0.9, 0.2, { wet: 0.6, verb: 'plate' });
          hiss(t, { type: 'highpass', from: 1500, to: 900, dur: 0.6, a: 0.004, peak: 0.09, q: 0.7, wet: 0.5, verb: 'plate' });
          hiss(t, { type: 'lowpass', from: 3000, to: 260, dur: 0.5, a: 0.004, peak: 0.1, q: 0.8, wet: 0.4, verb: 'plate' });
          for (let i = 0; i < 14; i++) fm(rnd(2400, 7000), t + 0.03 + rnd(0, 0.5) * (i / 14), { ratio: 1.41, index: 1.2, dec: rnd(0.22, 0.6), peak: 0.02, pan: rnd(-0.8, 0.8), wet: 0.6, verb: 'plate' });
          ring(t + 0.02, 140, 0.7, 0.1, 0.7, { wet: 0.5, verb: 'plate' });
          hiss(t + 0.1, { type: 'lowpass', from: 220, to: 50, dur: 1.4, a: 0.15, peak: 0.06, q: 0.5, wet: 0.6, verb: 'plate' });
          break;
        }
        case 'powerDown': {   // a reactor spinning down: two detuned saws through a resonant sweep, crackles, a last thud
          for (const d of [0, 7]) tone(180, t, { type: 'sawtooth', a: 0.02, dec: 1.3, peak: 0.045, slide: 22, slideDur: 1.3, detune: d, filter: { type: 'lowpass', f0: 2200, f1: 90, dur: 1.3, q: 6 }, wet: 0.4, verb: 'plate' });
          hiss(t, { type: 'bandpass', from: 1800, to: 120, dur: 1.2, a: 0.05, peak: 0.035, q: 1 });
          for (let i = 0; i < 6; i++) hiss(t + 0.15 + i * rnd(0.12, 0.2), { type: 'highpass', from: 3000 - i * 350, to: 2000 - i * 250, dur: 0.02, a: 0.001, peak: 0.04, q: 0.7, pan: rnd(-0.5, 0.5) });
          sub(70, 30, t + 1.25, 0.5, 0.12, { wet: 0.5, verb: 'plate' });
          break;
        }
        case 'bounty': {   // a golden chime: three FM bells and a shimmer
          [1046.5, 1318.5, 1568].forEach((f, i) => fm(f, t + i * 0.09, { ratio: 3.01, index: 0.8, dec: 0.9 + i * 0.15, peak: 0.034, pan: (i - 1) * 0.3, wet: 0.6, verb: 'plate' }));
          tone(3136, t + 0.2, { a: 0.08, dec: 0.9, peak: 0.01, wet: 0.7, verb: 'plate' });
          break;
        }
        case 'elimYou': {   // your fleet is gone: a dark chord sinking
          for (const [f, d] of [[196, 0], [196, 6], [147, -4]]) tone(f, t, { type: 'sawtooth', a: 0.03, hold: 0.3, dec: 1.4, peak: 0.03, slide: f / 2, slideDur: 1.7, detune: d, filter: { type: 'lowpass', f0: 700, f1: 160, dur: 1.7, q: 1.5 }, wet: 0.6, verb: 'plate' });
          sub(60, 32, t + 0.1, 1.2, 0.08, { wet: 0.5, verb: 'plate' });
          break;
        }
        // ---- Part 2: SALVO markers, the ARCADE cards and their abilities
        case 'marker':   // a shot marker set down: a soft magnetic tick with a rising ping
          hiss(t, { type: 'lowpass', from: 1800, to: 400, dur: 0.05, a: 0.002, peak: 0.08, q: 0.8, pan });
          fm(980, t, { ratio: 2, index: 0.8, dec: 0.16, peak: 0.03, slide: 1180, pan, wet: 0.3 });
          break;
        case 'volley': {   // several shots locked in: the latch, then a quick rising run of pings
          hiss(t, { type: 'lowpass', from: 900, to: 180, dur: 0.11, a: 0.003, peak: 0.1, q: 0.6, pan });
          sub(95, 52, t, 0.28, 0.1, { pan, wet: 0.3 });
          [660, 830, 990, 1320].forEach((f, i) => fm(f, t + 0.08 + i * 0.055, { ratio: 2, index: 0.9, dec: 0.3, peak: 0.028, pan: (i - 1.5) * 0.2, wet: 0.45, verb: 'plate' }));
          break;
        }
        case 'cardDraw':   // a new card slides into your hand: a paper-glass flick and a soft chime
          hiss(t, { type: 'bandpass', from: 1200, to: 4200, dur: 0.14, a: 0.01, peak: 0.05, q: 1.2, pan });
          fm(1568, t + 0.08, { ratio: 3.01, index: 0.7, dec: 0.6, peak: 0.028, pan, wet: 0.5, verb: 'plate' });
          break;
        case 'cardArm':   // a card armed: a crisp snap and a short rising tone
          hiss(t, { type: 'highpass', from: 1800, to: 2600, dur: 0.03, a: 0.002, peak: 0.07, q: 0.7, pan });
          tone(620, t, { type: 'triangle', dec: 0.14, peak: 0.04, slide: 980, slideDur: 0.1, pan, wet: 0.3 });
          break;
        case 'cardPlay': {   // a card played: the latch plus a bright FM flourish
          hiss(t, { type: 'lowpass', from: 900, to: 180, dur: 0.11, a: 0.003, peak: 0.1, q: 0.6, pan });
          sub(95, 52, t, 0.28, 0.1, { pan, wet: 0.3 });
          fm(1320, t + 0.06, { ratio: 1.5, index: 2.2, dec: 0.5, peak: 0.034, slide: 1760, pan, wet: 0.55, verb: 'plate' });
          fm(2640, t + 0.16, { ratio: 2, index: 0.8, dec: 0.5, peak: 0.02, pan, wet: 0.6, verb: 'plate' });
          break;
        }
        case 'sonar': {   // a ping leaves and comes back off the deep: FM ping, a long wet tail, a second fainter echo
          fm(1180, t, { ratio: 1.0, index: 0.4, a: 0.004, dec: 1.4, peak: 0.05, slide: 1060, wet: 0.85, verb: 'plate' });
          fm(1180, t + 0.42, { ratio: 1.0, index: 0.4, a: 0.004, dec: 1.0, peak: 0.022, slide: 1060, wet: 0.9, verb: 'plate', pan: 0.3 });
          hiss(t, { type: 'bandpass', from: 700, to: 2400, dur: 0.9, a: 0.3, peak: 0.012, q: 3, wet: 0.6, verb: 'plate' });
          break;
        }
        case 'sonarHit': [880, 1108.7, 1318.5].forEach((f, i) => fm(f, t + i * 0.07, { ratio: 2, index: 0.9, dec: 0.5, peak: 0.03, wet: 0.5, verb: 'plate' })); break;   // signals found
        case 'sonarEmpty': fm(660, t, { ratio: 2, index: 0.6, dec: 0.7, peak: 0.03, slide: 560, wet: 0.6, verb: 'plate' }); break;   // nothing there
        case 'clusterSplit':   // one projectile becomes four: a crack and four quick pings fanning out
          hiss(t, { type: 'highpass', from: 2500, to: 1200, dur: 0.08, a: 0.002, peak: 0.08, q: 0.8, pan });
          [1, 2, 3, 4].forEach(i => fm(1400 + i * 180, t + 0.02 + i * 0.035, { ratio: 2.5, index: 1.2, dec: 0.2, peak: 0.024, pan: (i - 2.5) * 0.35, wet: 0.4 }));
          break;
        case 'torpedo': {   // a run along the grid: a rising whine over a long whoosh, a sub rumble under it
          tone(220, t, { type: 'sawtooth', a: 0.05, hold: 0.5, dec: 0.3, peak: 0.028, slide: 640, slideDur: 0.8, filter: { type: 'lowpass', f0: 900, f1: 2600, dur: 0.8, q: 3 }, pan, wet: 0.4, verb: 'plate' });
          hiss(t, { type: 'bandpass', from: 500, to: 1800, dur: 0.85, a: 0.2, peak: 0.055, q: 1.1, pan });
          sub(70, 50, t, 0.9, 0.06, { wet: 0.3 });
          break;
        }
        case 'fizzle':   // a torpedo runs off the far edge: a dying hiss, a dull low tap
          hiss(t, { type: 'bandpass', from: 1600, to: 300, dur: 0.5, a: 0.02, peak: 0.04, q: 1.4, pan, wet: 0.4, verb: 'plate' });
          tone(110, t + 0.1, { type: 'triangle', dec: 0.25, peak: 0.035, slide: 70, pan });
          break;
        case 'shieldUp': {   // a dome rising: a swelling pad with a bright shimmer on top
          for (const d of [0, 7, -7]) tone(196, t, { type: 'sawtooth', a: 0.22, hold: 0.25, dec: 0.6, peak: 0.022, detune: d, slide: 262, slideDur: 0.3, filter: { type: 'lowpass', f0: 500, f1: 3200, dur: 0.5, q: 2 }, wet: 0.5, verb: 'plate' });
          fm(2093, t + 0.25, { ratio: 2, index: 0.6, dec: 0.7, peak: 0.022, wet: 0.7, verb: 'plate' });
          hiss(t + 0.1, { type: 'highpass', from: 3000, to: 6000, dur: 0.5, a: 0.2, peak: 0.02, q: 0.8, wet: 0.5, verb: 'plate' });
          break;
        }
        case 'shieldBlock': {   // a shot deflects off the dome: an electric zap and a ringing hex
          hiss(t, { type: 'bandpass', from: 4000, to: 900, dur: 0.16, a: 0.002, peak: 0.1, q: 2, pan });
          fm(1760, t, { ratio: 1.41, index: 3, dec: 0.35, peak: 0.045, slide: 1320, pan, wet: 0.5, verb: 'plate' });
          ring(t + 0.01, 420, 0.5, 0.08, 0.72, { pan, wet: 0.5, verb: 'plate' });
          tone(90, t, { dec: 0.15, peak: 0.05, slide: 60, pan });
          break;
        }
        case 'relocate': {   // a hull dissolves into light and re-forms: a glassy rising-then-falling shimmer
          for (let i = 0; i < 8; i++) fm(rnd(1500, 3800), t + i * 0.07, { ratio: 1.41, index: 0.9, dec: 0.35, peak: 0.02, pan: -0.6 + i * 0.17, wet: 0.7, verb: 'plate' });
          tone(330, t, { type: 'triangle', a: 0.2, hold: 0.2, dec: 0.5, peak: 0.02, slide: 660, slideDur: 0.45, filter: { type: 'lowpass', f0: 1200, f1: 3000, dur: 0.5 }, wet: 0.6, verb: 'plate' });
          hiss(t, { type: 'bandpass', from: 2000, to: 5000, dur: 0.6, a: 0.25, peak: 0.02, q: 1.5, wet: 0.6, verb: 'plate' });
          break;
        }
        case 'tick': tone(820, t, { type: 'sine', dec: 0.06, peak: 0.03 }); break;
        case 'sweep': hiss(t, { from: 400, to: 1600, dur: 1.2, peak: 0.006, q: 4 }); break;
        case 'win': {   // last fleet standing: a pad opening up under a rising arpeggio
          for (const [f, d] of [[130.8, 0], [196, 5], [329.6, -5]]) tone(f, t, { type: 'sawtooth', a: 0.4, hold: 1.0, dec: 1.2, peak: 0.028, detune: d, filter: { type: 'lowpass', f0: 700, f1: 2600, dur: 1.6, q: 1 }, wet: 0.6, verb: 'plate' });
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => fm(f, t + 0.15 + i * 0.11, { ratio: 2, index: 0.9, dec: 1.1, peak: 0.04, pan: (i - 1.5) * 0.2, wet: 0.6, verb: 'plate' }));
          fm(2093, t + 0.65, { ratio: 3, index: 0.6, dec: 1.6, peak: 0.02, wet: 0.7, verb: 'plate' });
          break;
        }
        default: break;
      }
  }
}
