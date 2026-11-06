// OVERCLOCK's sounds (OC1 — the owner's Grok set: scripts/build-oc-sfx.py → audio/sfx/overclock/*.mp3, mono 96 kbps, Grok's four loudness tiers
// kept; credits.txt beside them). Felt more than heard: through the console's engine (its SFX bus — the SFX slider + THE ONE MUTE apply; the
// console owns the unlock-on-tap). Audio is POLISH: before the unlock, muted, a missing file or a dead graph — nothing plays, nothing throws.
// preloadSounds() FETCHES the bytes during the walk inside (no AudioContext needed: they decode on first use).
//   ocSfx(name, { gain }) → bool        ocSfxBytes(names) → Promise   (index.js#preload)
// A name can be a SLICE of a file: 07-321-go.mp3 = three beeps 0.35 s apart + a hit at 1.05 s — faster than the slam's 3 · 2 · 1 (one a
// second), so each number plays the beep alone and GO plays the hit.
import { getContext, getSfxBus, isUnlocked } from '../../audio/engine.js';

const DIR = new URL('../../../audio/sfx/overclock/', import.meta.url);
// name → [file, gain, offset s, duration s, min gap ms]
export const OC_SOUNDS = Object.freeze({
  correct: ['01-correct', 0.55, 0, 0, 60],
  wrong: ['02-wrong', 0.55, 0, 0, 60],
  combo2: ['03-combo-x2', 0.5, 0, 0, 200],
  combo3: ['03-combo-x3', 0.5, 0, 0, 200],
  combo5: ['03-combo-x5', 0.55, 0, 0, 200],
  tick: ['04-tick', 0.6, 0, 0, 300],
  tickUrgent: ['05-tick-urgent', 0.6, 0, 0, 300],
  timesUp: ['06-times-up', 0.5, 0, 0, 800],
  count: ['07-321-go', 0.5, 0, 0.3, 300],
  go: ['07-321-go', 0.55, 1.03, 0.65, 300],
  intro: ['08-challenge-intro', 0.42, 0.28, 0, 600],
  tap: ['09-tap', 0.55, 0, 0, 50],
  submit: ['11-submit', 0.5, 0, 0, 120],
  // OC2 — THE RESULTS FLOW: the round winner's stamp, the standings' re-sort, a climb, THE WINNER's sign powering up (17 — the owner's main
  // fanfare, never the rejected -b)
  stamp: ['18-bonus', 0.45, 0, 0, 300],
  swoosh: ['15-standings-swoosh', 0.42, 0, 0, 400],
  rankUp: ['16-rank-up', 0.4, 0, 0, 600],
  fanfare: ['17-winner-fanfare', 0.5, 0, 0, 3000],
  // OC4 — THE VISUAL / REFLEX CHALLENGES: MEMORY's nine node tones (one per node — mem0 … mem8), SIGNAL LOCK's GO flash, REWIRE's turn
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`mem${i}`, [`14-memory-tone-${i + 1}`, 0.42, 0, 0, 0]])),
  flash: ['13-reflex-flash', 0.5, 0, 0, 200],
  place: ['10-tile-place', 0.32, 0, 0, 40],
  // OC5 — DUMB LUCK (its own five — fetched only when a match deals it: DL_FILES, view.js): the bell at the off, the hooves under the race
  // (a gapless loop — ocLoop), the crowd swelling down the stretch, the photo-finish freeze, LONG SHOT!
  bell: ['19-starting-bell', 0.42, 0, 0, 2000],
  hooves: ['20-hooves-loop', 0.2, 0, 0, 0],
  roar: ['21-crowd-roar', 0.32, 0, 0, 0],
  photo: ['22-photo-finish', 0.5, 0, 0, 1500],
  longshot: ['23-longshot-win', 0.5, 0, 0, 3000],
});
/** DUMB LUCK's files (lazy: only a match that deals it fetches them) */
export const DL_FILES = ['19-starting-bell', '20-hooves-loop', '21-crowd-roar', '22-photo-finish', '23-longshot-win'];
/** the files every match preloads (index.js#preload — DUMB LUCK's wait for a match that deals it) */
export const OC1_FILES = [...new Set(Object.values(OC_SOUNDS).map(s => s[0]))].filter(f => !DL_FILES.includes(f));

const bytes = new Map();    // file → Promise<ArrayBuffer | null>
const bufs = new Map();     // file → AudioBuffer | Promise | null (per context)
let bufCtx = null;
const last = {};

const fetchBytes = file => {
  if (!bytes.has(file)) bytes.set(file, fetch(new URL(`${file}.mp3`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return bytes.get(file);
};
/** fetch these files' bytes now (the preload — no AudioContext needed) */
export const ocSfxBytes = (files = OC1_FILES) => Promise.all(files.map(fetchBytes));

function buffer(file) {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (bufs.has(file)) return bufs.get(file);
  const p = fetchBytes(file).then(a => (a ? new Promise((res, rej) => ctx.decodeAudioData(a.slice(0), res, rej)) : null))
    .then(b => { bufs.set(file, b); return b; }, () => { bufs.set(file, null); return null; });
  bufs.set(file, p);
  return p;
}

/** a LOOP (the hooves): a buffer source with loop = true (Web Audio's own seamless loop — never <audio loop>), faded in; → { stop(ms), gain(g, ms) }
 *  (a no-op handle when audio is locked / missing — never throws) */
export function ocLoop(name, { gain = 1, fadeMs = 400 } = {}) {
  const none = { stop() {}, gain() {} };
  try {
    const def = OC_SOUNDS[name];
    if (!def || !isUnlocked()) return none;
    const ctx = getContext(), bus = getSfxBus();
    if (!ctx) return none;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(bus || ctx.destination);
    let src = null, dead = false, want = def[1] * gain;
    const b = buffer(def[0]);
    const start = buf => {
      if (dead || !buf || ctx.state !== 'running') return;
      src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = buf.duration;
      src.connect(g);
      src.start();
      g.gain.setTargetAtTime(want, ctx.currentTime, fadeMs / 3000);
    };
    if (b && typeof b.then === 'function') b.then(start); else start(b);
    return {
      stop(ms = 500) { dead = true; try { g.gain.setTargetAtTime(0, ctx.currentTime, ms / 3000); if (src) src.stop(ctx.currentTime + ms / 1000 + 0.1); } catch { /* gone */ } },
      gain(v, ms = 600) { want = def[1] * v; try { g.gain.setTargetAtTime(want, ctx.currentTime, ms / 3000); } catch { /* gone */ } },
    };
  } catch { return none; }
}
/** A NEON HUM (DUMB LUCK's sign powering up): a quiet 120 Hz buzz synthesized on the spot (a saw through a low-pass + a fast flutter while the
 *  tubes flicker), ~1.4 s — no file. Felt more than heard. */
export function ocHum({ gain = 1, ms = 1400 } = {}) {
  try {
    if (!isUnlocked()) return false;
    const ctx = getContext(), bus = getSfxBus();
    if (!ctx || ctx.state !== 'running') return false;
    const t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 120; o2.type = 'square'; o2.frequency.value = 240;
    f.type = 'lowpass'; f.frequency.value = 620; f.Q.value = 0.7;
    const top = 0.05 * gain;
    g.gain.setValueAtTime(0, t);
    // the flicker: the buzz stutters on with the tubes, then settles
    [[0.02, 1], [0.07, 0.15], [0.12, 0.9], [0.16, 0.2], [0.22, 1]].forEach(([d, k]) => g.gain.setValueAtTime(top * k, t + d));
    g.gain.setTargetAtTime(top * 0.55, t + 0.3, 0.2);
    g.gain.setTargetAtTime(0, t + ms / 1000 - 0.3, 0.12);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(bus || ctx.destination);
    o.start(t); o2.start(t); o.stop(t + ms / 1000 + 0.2); o2.stop(t + ms / 1000 + 0.2);
    return true;
  } catch { return false; }
}

/** play one (never throws) */
export function ocSfx(name, { gain = 1 } = {}) {
  try {
    const def = OC_SOUNDS[name];
    if (!def || !isUnlocked()) return false;
    const [file, g0, offset, dur, gap] = def;
    const now = performance.now();
    if (now - (last[name] || 0) < gap) return false;
    last[name] = now;
    const ctx = getContext(), bus = getSfxBus();
    const play = b => {
      if (!b || !ctx || ctx.state !== 'running') return;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b;
      g.gain.value = g0 * gain;
      s.connect(g); g.connect(bus || ctx.destination);
      if (dur) s.start(0, offset, dur); else s.start(0, offset);
    };
    const b = buffer(file);
    if (b && typeof b.then === 'function') b.then(play); else play(b);
    return true;
  } catch { return false; }
}
