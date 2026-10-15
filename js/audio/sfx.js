// Synthesized sound effects (Web Audio only, no files).
// Palette: sine/triangle voices, soft attacks, low-pass filtering, a shared
// plate-ish reverb and a dark dotted delay; notes drawn from C-major-7 /
// A-minor-pentatonic so everything sits with synthwave music. Deliberately quiet.
import { getContext, getSfxBus, isUnlocked } from './engine.js';

let fx = null; // { reverb, delayIn, noise }

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// 'E5' -> Hz
function hz(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semi - 69) / 12);
}

function setup() {
  const ctx = getContext();
  const out = getSfxBus();
  // Reverb: generated stereo impulse (exponentially decaying filtered noise).
  const len = Math.floor(ctx.sampleRate * 2.2);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp = lp * 0.82 + (Math.random() * 2 - 1) * 0.18; // darken
      d[i] = lp * (1 - i / len) ** 3.2;
    }
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = ir;
  const revOut = ctx.createGain();
  revOut.gain.value = 0.9;
  reverb.connect(revOut).connect(out);

  // Dotted delay with a dark feedback loop.
  const delayIn = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.33;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  delayIn.connect(delay);
  delay.connect(tone).connect(fb).connect(delay);
  tone.connect(out);
  tone.connect(reverb);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  fx = { reverb, delayIn, noise, out };
}

// One enveloped oscillator note.
function tone({ f, to, type = 'sine', at = 0, dur = 0.25, gain = 0.05, attack = 0.006, lp = 6000, rev = 0.2, dly = 0, pan = 0 }) {
  const ctx = getContext();
  const t = ctx.currentTime + 0.005 + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = lp;
  filt.Q.value = 0.3;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  osc.connect(filt).connect(env);
  let last = env;
  if (p) { p.pan.value = pan; env.connect(p); last = p; }
  last.connect(fx.out);
  if (rev) { const s = ctx.createGain(); s.gain.value = rev; last.connect(s).connect(fx.reverb); }
  if (dly) { const s = ctx.createGain(); s.gain.value = dly; last.connect(s).connect(fx.delayIn); }
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Filtered noise swell/burst.
function noise({ at = 0, dur = 0.2, gain = 0.03, type = 'bandpass', f = 1200, to, q = 0.8, rev = 0.2 }) {
  const ctx = getContext();
  const t = ctx.currentTime + 0.005 + at;
  const src = ctx.createBufferSource();
  src.buffer = fx.noise;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(f, t);
  if (to) filt.frequency.exponentialRampToValueAtTime(to, t + dur);
  filt.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 3));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(env).connect(fx.out);
  if (rev) { const s = ctx.createGain(); s.gain.value = rev; env.connect(s).connect(fx.reverb); }
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const arp = (notes, step, opts) => notes.forEach((n, i) => tone({ f: hz(n), at: i * step, ...opts, pan: (i / Math.max(1, notes.length - 1) - 0.5) * 0.5 }));

const PENTA = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];

const SOUNDS = {
  tap: () => tone({ f: hz('E6'), dur: 0.07, gain: 0.018, lp: 3500, rev: 0.1 }),
  key: () => tone({ f: hz('A5'), dur: 0.05, gain: 0.014, lp: 2600, rev: 0.05 }),
  select: () => tone({ f: hz('C5'), to: hz('G5'), dur: 0.12, gain: 0.03, type: 'triangle', lp: 3000, rev: 0.15 }),
  lock: () => { tone({ f: hz('G5'), dur: 0.1, gain: 0.03, lp: 3000, rev: 0.15 }); tone({ f: hz('D6'), at: 0.06, dur: 0.14, gain: 0.02, lp: 3500, rev: 0.2 }); },
  join: () => { arp(['C5', 'E5', 'G5', 'B5', 'E6'], 0.075, { dur: 0.6, gain: 0.04, type: 'sine', rev: 0.4, dly: 0.18, lp: 4000 }); noise({ dur: 0.9, gain: 0.012, f: 3000, to: 800, rev: 0.4 }); },
  playerJoined: () => { tone({ f: hz('E5'), dur: 0.5, gain: 0.035, rev: 0.35, dly: 0.12 }); tone({ f: hz('B5'), at: 0.09, dur: 0.7, gain: 0.03, rev: 0.4, dly: 0.15 }); tone({ f: hz('B5') * 2.01, at: 0.09, dur: 0.3, gain: 0.006, rev: 0.3 }); },
  // Cipher tile flips: state-coloured soft notes rising across the row.
  flip: ({ state = '0', i = 0 } = {}) => {
    const at = 0;
    if (state === '2') tone({ f: hz(PENTA[Math.min(7, 3 + i)]), at, dur: 0.28, gain: 0.035, rev: 0.25, lp: 4200 });
    else if (state === '1') tone({ f: hz(PENTA[Math.min(7, 1 + i)]), at, dur: 0.22, gain: 0.03, type: 'triangle', rev: 0.2, lp: 2600 });
    else tone({ f: hz('A3'), at, dur: 0.14, gain: 0.03, lp: 700, rev: 0.08 });
    noise({ at, dur: 0.04, gain: 0.006, f: 5000, q: 1.2, rev: 0 });
  },
  correct: () => { tone({ f: hz('E5'), dur: 0.5, gain: 0.035, rev: 0.3 }); tone({ f: hz('G5'), at: 0.05, dur: 0.5, gain: 0.03, rev: 0.3 }); tone({ f: hz('C6'), at: 0.1, dur: 0.6, gain: 0.025, rev: 0.35, dly: 0.12 }); },
  present: () => tone({ f: hz('D5'), dur: 0.3, gain: 0.03, type: 'triangle', lp: 2400, rev: 0.25 }),
  absent: () => tone({ f: hz('A3'), dur: 0.2, gain: 0.03, lp: 600, rev: 0.1 }),
  solve: () => arp(['C5', 'E5', 'G5', 'C6', 'E6'], 0.07, { dur: 0.55, gain: 0.04, type: 'triangle', rev: 0.35, dly: 0.2, lp: 3800 }),
  invalid: () => { tone({ f: 150, to: 70, dur: 0.18, gain: 0.08, lp: 380, rev: 0.05 }); noise({ dur: 0.08, gain: 0.01, type: 'lowpass', f: 400, rev: 0 }); },
  tick: ({ last = false } = {}) => tone({ f: hz(last ? 'E5' : 'A5'), dur: 0.06, gain: last ? 0.03 : 0.02, lp: 2400, rev: 0.12 }),
  roundEnd: () => ['G4', 'E4', 'C4'].forEach((n, i) => tone({ f: hz(n), at: i * 0.11, dur: 0.9, gain: 0.03, rev: 0.45, dly: 0.1, lp: 1800 })),
  shimmer: () => arp(['C6', 'D6', 'E6', 'G6', 'A6'], 0.04, { dur: 0.25, gain: 0.012, rev: 0.3, dly: 0.25, lp: 7000 }),
  // Last Signal
  strike: () => { noise({ dur: 0.28, gain: 0.04, f: 3200, to: 500, q: 0.9, rev: 0.25 }); tone({ f: 120, to: 50, at: 0.12, dur: 0.3, gain: 0.12, lp: 500, rev: 0.15 }); },
  hit: () => { tone({ f: 95, to: 38, dur: 0.42, gain: 0.16, lp: 420, rev: 0.2 }); noise({ dur: 0.22, gain: 0.03, type: 'lowpass', f: 900, to: 200, rev: 0.2 }); },
  shieldBreak: () => { [1760, 2637, 3520].forEach((f, i) => tone({ f, at: i * 0.018, dur: 0.38, gain: 0.014, rev: 0.45, lp: 9000 })); noise({ dur: 0.14, gain: 0.018, f: 4200, q: 2, rev: 0.4 }); },
  eliminate: () => { tone({ f: 440, to: 55, dur: 1.3, gain: 0.07, lp: 1400, rev: 0.5 }); tone({ f: 660, to: 82, dur: 1.3, gain: 0.03, type: 'triangle', lp: 900, rev: 0.5 }); noise({ dur: 1.1, gain: 0.02, type: 'lowpass', f: 1600, to: 120, rev: 0.4 }); },
  // Overclock
  challenge: () => arp(['G4', 'C5', 'E5', 'G5'], 0.08, { dur: 0.4, gain: 0.04, type: 'triangle', rev: 0.3, dly: 0.15, lp: 3600 }),
  ocCorrect: () => { tone({ f: hz('E5'), dur: 0.25, gain: 0.035, rev: 0.25 }); tone({ f: hz('B5'), at: 0.05, dur: 0.35, gain: 0.03, rev: 0.3 }); },
  ocWrong: () => { tone({ f: hz('E4'), dur: 0.18, gain: 0.04, lp: 1200, rev: 0.15 }); tone({ f: hz('C4'), at: 0.1, dur: 0.28, gain: 0.04, lp: 900, rev: 0.2 }); },
  node: ({ i = 0 } = {}) => tone({ f: hz(PENTA[i % PENTA.length]), dur: 0.3, gain: 0.03, rev: 0.3, lp: 4000 }),
  victory: () => {
    arp(['C4', 'G4', 'C5', 'E5', 'G5', 'B5', 'D6'], 0.09, { dur: 1.1, gain: 0.035, type: 'triangle', rev: 0.5, dly: 0.25, lp: 4200 });
    ['C4', 'E4', 'G4', 'B4'].forEach(n => tone({ f: hz(n), at: 0.6, dur: 2.2, gain: 0.012, attack: 0.4, rev: 0.6, lp: 1600 }));
  },
};

const lastPlayed = {};

/** Play a named effect. Silently does nothing before audio is unlocked. */
export function sfx(name, opts) {
  if (!isUnlocked() || !SOUNDS[name]) return;
  if (!fx) setup();
  const now = performance.now();
  if (name !== 'flip' && name !== 'node' && now - (lastPlayed[name] || 0) < 45) return; // de-dupe bursts
  lastPlayed[name] = now;
  try { SOUNDS[name](opts); } catch (e) { console.warn('sfx', name, e); }
}

export const SFX_NAMES = Object.keys(SOUNDS);
