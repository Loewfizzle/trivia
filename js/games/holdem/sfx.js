// HOLD'EM — THE SOUNDS (HE5 — docs/holdem.md "THE SOUNDS"; Ben approved the set + the balance by ear, docs/games/plan.md "HE5"). The site's
// sound-engine pattern (docs/audio.md): the bytes fetched in the cartridge's preload(), decoded ONCE (decodeAudioData) when the audio is
// unlocked (the console's unlock-on-tap — audio/engine.js), each sound an AudioBufferSourceNode → its gain → THE SOFT LIMITER (one per
// audio context) → the console's SFX bus (the SFX slider, the ☰ SOUND EFFECTS toggle + THE ONE MUTE apply there). Audio is POLISH: locked,
// muted, a missing file, a dead graph — nothing plays, nothing throws, the game is the same.
//   THE BALANCE (Ben): the NEW real-recording set (sfx2) at +7 dB (gain 2.2) · the KEPT stings at 1.0 · the DEALS at about half the new set
//   (1.1) with ±4 % rate + 0.85–1.0 volume variety (16 in a row never robotic) — everything through the limiter, so a busy moment never clips
//   (measured: tests/integration/he-sfx-measure.mjs).
//   WHICH SOUND WHEN = sound-plan.js (PURE — from the motion's own timeline, so a sound lands with its animation and never replays after a
//   refresh); this file only plays cues at their times.
import { getContext, getSfxBus, isUnlocked, onUnlock } from '../../audio/engine.js';

const DIR = new URL('../../../audio/holdem/', import.meta.url);
const NEW = 2.2, KEPT = 1.0, DEAL = 1.1;
/** THE GAIN TABLE (Ben's balance) */
export const GAIN = Object.freeze({
  shuffle: NEW, deal: DEAL, flip: NEW, fold: NEW, check: NEW, 'chip-bet': NEW, 'chip-raise': NEW, 'chip-stack': NEW, 'all-in': NEW, 'pot-win': NEW,
  'your-turn': KEPT, 'timer-tick': KEPT, showdown: KEPT, 'hand-win': KEPT, knockout: KEPT, 'blinds-up': KEPT, champion: KEPT,
});
export const FILES = Object.freeze(Object.keys(GAIN));
/** each file's lead-in (s) to skip — MEASURED by tests/integration/he-sfx-measure.mjs: every one ≤ 6 ms (the browsers strip the MP3 encoder's
 *  delay — LAME's gapless header), so none is skipped; a new file with an audible lead-in gets its row here */
export const OFFSET = Object.freeze({});
/** THE SOFT LIMITER on HOLD'EM's own sub-bus (a gentle knee, fast attack — threshold −6 dB) */
export const LIMITER = Object.freeze({ threshold: -6, knee: 4, ratio: 8, attack: 0.002, release: 0.18 });
/** the trim after it: Web Audio's compressor adds its own make-up gain — this takes it back out, so a sound under the threshold plays at its
 *  normal level (the kept stings at 1.0) and only the loud overlaps are held down. MEASURED (he-sfx-measure.mjs, Chromium): out ÷ in of a
 *  kept sting alone = 1.00 · the busiest moment (7 sounds in 150 ms) peaks ≈ 0.87 (2.43 without the limiter) */
export const TRIM = 0.76;
/** the deals' variety: rate 1 ± 0.04, volume 0.85–1.0 */
export const DEAL_VARY = Object.freeze({ rate: 0.04, vol: [0.85, 1] });

let bytes = null;                      // name → Promise<ArrayBuffer | null> (fetched once a page — preload / mount)
const bufs = new Map();                // name → AudioBuffer | null (for bufCtx)
let bufCtx = null, decoding = null, bus = null, busCtx = null, hooked = false;
const log = [];                        // the test hook: what actually started (name, rate, gain, at)
const plan = [];                       // the test hook: every cue ASKED for (locked / headless included) — the scheduling, testable silently

/** fetch every file's bytes now (no AudioContext needed — the cartridge's preload) */
export function fetchSounds() {
  if (!bytes) {
    bytes = new Map(FILES.map(n => [n, fetch(new URL(`${n}.mp3`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)]));
  }
  if (!hooked) { hooked = true; try { onUnlock(() => decodeAll()); } catch { /* no engine */ } }
  return Promise.all([...bytes.values()]);
}

/** decode every buffer ONCE for the live context (the unlock, or a mount after it) */
export function decodeAll() {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx === ctx && decoding) return decoding;
  bufCtx = ctx; bufs.clear();
  fetchSounds();
  decoding = Promise.all(FILES.map(n => bytes.get(n)
    .then(a => (a ? new Promise((res, rej) => ctx.decodeAudioData(a.slice(0), res, rej)) : null))
    .then(b => { if (bufCtx === ctx) bufs.set(n, b); }, () => { if (bufCtx === ctx) bufs.set(n, null); })));
  return decoding;
}

function limiterBus(ctx) {
  if (bus && busCtx === ctx) return bus;
  busCtx = ctx;
  const comp = ctx.createDynamicsCompressor(), trim = ctx.createGain();
  for (const [k, v] of Object.entries(LIMITER)) { try { comp[k].value = v; } catch { /* old Safari */ } }
  trim.gain.value = TRIM;
  comp.connect(trim);
  trim.connect(getSfxBus() || ctx.destination);
  bus = comp;
  return bus;
}

/**
 * Play cues: [{ name, at (ms from now), rate?, vol? }] — scheduled on the AUDIO clock (sample-accurate, never smeared by a busy main thread).
 * Silently nothing when locked / muted / undecoded. → the number started.
 */
export function playCues(cues) {
  try {
    const w = Date.now();
    for (const c of cues || []) { plan.push({ name: c.name, at: Math.round(c.at || 0), when: w + Math.round(c.at || 0), rate: c.rate || 1, gain: +((GAIN[c.name] || 1) * (c.vol == null ? 1 : c.vol)).toFixed(3) }); }
    if (plan.length > 400) plan.splice(0, plan.length - 400);
    if (!cues || !cues.length || !isUnlocked()) return 0;
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return 0;
    if (bufCtx !== ctx) decodeAll();
    const out = limiterBus(ctx);
    const t0 = ctx.currentTime + 0.01;
    let n = 0;
    for (const c of cues) {
      const b = bufs.get(c.name);
      if (!b) continue;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b;
      s.playbackRate.value = c.rate || 1;
      g.gain.value = (GAIN[c.name] || 1) * (c.vol == null ? 1 : c.vol);
      s.connect(g); g.connect(out);
      s.start(t0 + Math.max(0, c.at || 0) / 1000, OFFSET[c.name] || 0);
      log.push({ name: c.name, at: Math.round(c.at || 0), rate: +(c.rate || 1).toFixed(3), gain: +g.gain.value.toFixed(3) }); if (log.length > 120) log.shift();
      n++;
    }
    return n;
  } catch { return 0; }
}
export const playSound = (name, opts = {}) => playCues([{ name, at: 0, ...opts }]);
/** the test hook: the cues that started on the audio context */
export const played = () => log.slice();
export const planned = () => plan.slice();
export const clearPlayed = () => { log.length = 0; plan.length = 0; };
