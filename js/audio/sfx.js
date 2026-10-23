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
  fx = { reverb, delayIn, noise, out, ctx };
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
  invalid: () => { tone({ f: 150, to: 70, dur: 0.18, gain: 0.06, lp: 380, rev: 0.05 }); noise({ dur: 0.08, gain: 0.01, type: 'lowpass', f: 400, rev: 0 }); },
  tick: ({ last = false } = {}) => tone({ f: hz(last ? 'E5' : 'A5'), dur: 0.06, gain: last ? 0.03 : 0.02, lp: 2400, rev: 0.12 }),
  roundEnd: () => ['G4', 'E4', 'C4'].forEach((n, i) => tone({ f: hz(n), at: i * 0.11, dur: 0.9, gain: 0.03, rev: 0.45, dly: 0.1, lp: 1800 })),
  shimmer: () => arp(['C6', 'D6', 'E6', 'G6', 'A6'], 0.04, { dur: 0.25, gain: 0.012, rev: 0.3, dly: 0.25, lp: 7000 }),
  // Last Signal
  strike: () => { noise({ dur: 0.28, gain: 0.04, f: 3200, to: 500, q: 0.9, rev: 0.25 }); tone({ f: 120, to: 50, at: 0.12, dur: 0.3, gain: 0.09, lp: 500, rev: 0.15 }); },
  hit: () => { tone({ f: 95, to: 38, dur: 0.42, gain: 0.12, lp: 420, rev: 0.2 }); noise({ dur: 0.22, gain: 0.03, type: 'lowpass', f: 900, to: 200, rev: 0.2 }); },
  shieldBreak: () => { [1760, 2637, 3520].forEach((f, i) => tone({ f, at: i * 0.018, dur: 0.38, gain: 0.014, rev: 0.45, lp: 9000 })); noise({ dur: 0.14, gain: 0.018, f: 4200, q: 2, rev: 0.4 }); },
  eliminate: () => { tone({ f: 440, to: 55, dur: 1.3, gain: 0.06, lp: 1400, rev: 0.5 }); tone({ f: 660, to: 82, dur: 1.3, gain: 0.03, type: 'triangle', lp: 900, rev: 0.5 }); noise({ dur: 1.1, gain: 0.02, type: 'lowpass', f: 1600, to: 120, rev: 0.4 }); },
  // Overclock
  challenge: () => arp(['G4', 'C5', 'E5', 'G5'], 0.08, { dur: 0.4, gain: 0.04, type: 'triangle', rev: 0.3, dly: 0.15, lp: 3600 }),
  ocCorrect: () => { tone({ f: hz('E5'), dur: 0.25, gain: 0.035, rev: 0.25 }); tone({ f: hz('B5'), at: 0.05, dur: 0.35, gain: 0.03, rev: 0.3 }); },
  ocWrong: () => { tone({ f: hz('E4'), dur: 0.18, gain: 0.04, lp: 1200, rev: 0.15 }); tone({ f: hz('C4'), at: 0.1, dur: 0.28, gain: 0.04, lp: 900, rev: 0.2 }); },
  node: ({ i = 0 } = {}) => tone({ f: hz(PENTA[i % PENTA.length]), dur: 0.3, gain: 0.03, rev: 0.3, lp: 4000 }),
  // chat: a barely-there two-note blip
  chat: () => { tone({ f: hz('E6'), dur: 0.09, gain: 0.011, lp: 4200, rev: 0.12 }); tone({ f: hz('B6'), at: 0.07, dur: 0.12, gain: 0.008, lp: 4800, rev: 0.18 }); },
  // NEON PAR
  putt: ({ p = 0.5 } = {}) => { // wooden-ish tock, brighter + louder with power
    tone({ f: 900 + p * 700, to: 420, dur: 0.07, gain: 0.03 + p * 0.04, type: 'triangle', lp: 2400 + p * 2600, rev: 0.08 });
    noise({ dur: 0.045, gain: 0.012 + p * 0.02, f: 2600, q: 1.4, rev: 0.05 });
  },
  bounce: ({ v = 0.5 } = {}) => tone({ f: 260 + v * 140, to: 150, dur: 0.06, gain: 0.006 + Math.min(1, v) * 0.022, type: 'triangle', lp: 1200, rev: 0.08 }),
  cup: () => {
    [0, 0.07, 0.13].forEach((at, i) => tone({ f: 520 - i * 60, to: 300, at, dur: 0.06, gain: 0.03 - i * 0.008, type: 'triangle', lp: 1800, rev: 0.12 }));
    arp(['E5', 'G5', 'C6'], 0.06, { at: 0.2, dur: 0.5, gain: 0.025, rev: 0.35, dly: 0.12, lp: 4000 });
  },
  portal: () => { noise({ dur: 0.45, gain: 0.03, f: 300, to: 3200, q: 2.5, rev: 0.4 }); tone({ f: hz('A4'), to: hz('A5'), dur: 0.4, gain: 0.02, rev: 0.4 }); },
  boost: () => { tone({ f: 220, to: 880, dur: 0.22, gain: 0.025, type: 'sawtooth', lp: 1800, rev: 0.15 }); noise({ dur: 0.2, gain: 0.012, f: 2000, to: 5000, rev: 0.1 }); },
  bumper: () => { tone({ f: hz('E6'), dur: 0.12, gain: 0.03, type: 'square', lp: 3000, rev: 0.2 }); tone({ f: hz('B5'), at: 0.03, dur: 0.18, gain: 0.025, type: 'triangle', lp: 3000, rev: 0.25 }); },
  pickup: () => arp(['C5', 'G5', 'C6', 'E6'], 0.045, { dur: 0.3, gain: 0.025, type: 'triangle', rev: 0.3, dly: 0.15, lp: 5000 }),
  powerUse: () => { noise({ dur: 0.35, gain: 0.02, f: 800, to: 4000, q: 1.5, rev: 0.3 }); tone({ f: hz('C5'), to: hz('C6'), dur: 0.3, gain: 0.025, rev: 0.3 }); },
  sabotage: () => { [0, 0.16].forEach(at => tone({ f: hz('E5'), to: hz('B4'), at, dur: 0.14, gain: 0.035, type: 'square', lp: 1600, rev: 0.15 })); noise({ dur: 0.3, gain: 0.015, type: 'lowpass', f: 900, rev: 0.2 }); },
  respawn: () => { arp(['A5', 'E5', 'A4'], 0.035, { dur: 0.1, gain: 0.02, type: 'square', lp: 2600, rev: 0.1 }); noise({ at: 0.15, dur: 0.25, gain: 0.015, f: 500, to: 3000, q: 3, rev: 0.25 }); },
  splash: () => noise({ dur: 0.6, gain: 0.02, type: 'lowpass', f: 1400, to: 200, rev: 0.3 }),
  ace: () => {
    arp(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, { dur: 0.9, gain: 0.035, type: 'triangle', rev: 0.5, dly: 0.25, lp: 5200 });
    noise({ dur: 1.4, gain: 0.02, f: 6000, to: 1200, rev: 0.5 });
  },
  // ---- DOUBLE AGENT
  // the classified-file reveal: a short static crackle + a soft low chord (same for every player in SAME ROOM mode)
  daReveal: () => {
    noise({ dur: 0.22, gain: 0.03, f: 2600, to: 900, q: 0.7, rev: 0.25 });
    noise({ at: 0.05, dur: 0.12, gain: 0.018, f: 5200, q: 2, rev: 0.1 });
    tone({ f: hz('A3'), at: 0.12, dur: 0.9, gain: 0.028, attack: 0.05, lp: 1400, rev: 0.45 });
    tone({ f: hz('E4'), at: 0.16, dur: 0.8, gain: 0.018, attack: 0.05, lp: 1800, rev: 0.45 });
  },
  // the agent's reveal in REMOTE mode: a dark detuned impact with a heavier crackle
  daAgent: () => {
    noise({ dur: 0.5, gain: 0.05, f: 1800, to: 120, q: 0.6, rev: 0.4 });
    tone({ f: 82, to: 41, dur: 1.2, gain: 0.13, lp: 380, rev: 0.35 });
    tone({ f: hz('C#4'), to: hz('C4'), at: 0.08, dur: 1.1, gain: 0.03, type: 'sawtooth', lp: 900, rev: 0.5 });
    tone({ f: hz('G3'), at: 0.08, dur: 1.1, gain: 0.03, type: 'sawtooth', lp: 700, rev: 0.5 });
  },
  daDecode: ({ i = 0 } = {}) => tone({ f: 1800 + (i % 5) * 160, dur: 0.035, gain: 0.008, type: 'square', lp: 4200, rev: 0.04 }),
  daPin: () => { tone({ f: 1500, to: 900, dur: 0.05, gain: 0.02, type: 'triangle', lp: 3000, rev: 0.08 }); noise({ dur: 0.04, gain: 0.008, f: 3000, q: 3, rev: 0 }); },
  daVote: () => { tone({ f: 180, to: 90, dur: 0.16, gain: 0.07, lp: 600, rev: 0.12 }); noise({ dur: 0.08, gain: 0.012, type: 'lowpass', f: 1200, rev: 0.05 }); },
  daUnmask: () => {
    noise({ dur: 0.9, gain: 0.04, f: 600, to: 4800, q: 1.2, rev: 0.4 });
    tone({ f: 55, to: 46, at: 0.85, dur: 1.6, gain: 0.14, lp: 300, rev: 0.4 });
    tone({ f: hz('D#4'), at: 0.85, dur: 1.4, gain: 0.028, type: 'sawtooth', lp: 1100, rev: 0.55 });
    tone({ f: hz('A4'), at: 0.85, dur: 1.4, gain: 0.02, type: 'sawtooth', lp: 1300, rev: 0.55 });
  },
  daInnocent: () => { tone({ f: hz('E4'), dur: 0.5, gain: 0.03, lp: 1600, rev: 0.4 }); tone({ f: hz('B3'), at: 0.08, dur: 0.6, gain: 0.025, lp: 1200, rev: 0.45 }); },
  daStolen: () => {
    noise({ dur: 0.35, gain: 0.04, f: 900, to: 5200, q: 1.5, rev: 0.3 });
    arp(['A4', 'C5', 'D#5', 'A5'], 0.06, { dur: 0.5, gain: 0.035, type: 'sawtooth', lp: 2400, rev: 0.45, dly: 0.2 });
    tone({ f: 98, to: 49, at: 0.25, dur: 1.2, gain: 0.1, lp: 420, rev: 0.4 });
  },
  victory: () => {
    arp(['C4', 'G4', 'C5', 'E5', 'G5', 'B5', 'D6'], 0.09, { dur: 1.1, gain: 0.035, type: 'triangle', rev: 0.5, dly: 0.25, lp: 4200 });
    ['C4', 'E4', 'G4', 'B4'].forEach(n => tone({ f: hz(n), at: 0.6, dur: 2.2, gain: 0.012, attack: 0.4, rev: 0.6, lp: 1600 }));
  },
};

const lastPlayed = {};

/** Play a named effect. Silently does nothing before audio is unlocked. */
export function sfx(name, opts) {
  if (!isUnlocked() || !SOUNDS[name]) return;
  if (!fx || fx.ctx !== getContext()) setup();   // (a rebuilt context — engine.js#rebuild — gets its own chain)
  const now = performance.now();
  if (name !== 'flip' && name !== 'node' && now - (lastPlayed[name] || 0) < 45) return; // de-dupe bursts
  lastPlayed[name] = now;
  try { SOUNDS[name](opts); } catch (e) { console.warn('sfx', name, e); }
}

export const SFX_NAMES = Object.keys(SOUNDS);
