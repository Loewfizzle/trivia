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
/** HE10 (A41): bump when a sound file is replaced — the site's pattern (audio/progress-sfx.js#PG_REV): a 7-day cache never keeps an old sound */
export const HE_SFX_REV = 1;
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

let bytes = null;                      // name → Promise<ArrayBuffer | null> (fetched once a page — preload / mount; HE10 — A37: a failed one is dropped, the next call retries)
const bufs = new Map();                // name → AudioBuffer (for bufCtx — a failed decode is simply missing: the next decodeAll retries it)
let bufCtx = null, decoding = null, bus = null, busCtx = null, hooked = false;
const live = new Set();                // HE10 (A36): every source scheduled and not yet ended — stopAll() silences them (hidden page, a new match)
const log = [];                        // the test hook: what actually started (name, rate, gain, at)
const plan = [];                       // the test hook: every cue ASKED for (locked / headless included) — the scheduling, testable silently

/** fetch every file's bytes now (no AudioContext needed — the cartridge's preload) */
export function fetchSounds() {
  if (!bytes) bytes = new Map();
  for (const n of FILES) {
    if (bytes.has(n)) continue;
    const p = fetch(new URL(`${n}.mp3?v=${HE_SFX_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
      .then(a => { if (!a && bytes.get(n) === p) bytes.delete(n); return a; });
    bytes.set(n, p);
  }
  if (!hooked) { hooked = true; try { onUnlock(() => decodeAll()); } catch { /* no engine */ } }
  return Promise.all(FILES.map(n => bytes.get(n) || null));
}

/** decode every buffer ONCE for the live context (the unlock, or a mount after it) */
export function decodeAll() {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx === ctx && decoding) return decoding;
  if (bufCtx !== ctx) bufs.clear();
  bufCtx = ctx;
  fetchSounds();
  // (HE10 — A42: the promise form of decodeAudioData is caught too — a bad file never becomes an unhandled rejection; A37: a missing / failed
  //  sound stays missing only until the next decodeAll — a mount, the 'online' event)
  const one = n => (bufs.get(n) ? Promise.resolve() : (bytes.get(n) || Promise.resolve(null))
    .then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null))
    .then(b => { if (bufCtx === ctx && b) bufs.set(n, b); }, () => {}));
  const d = decoding = Promise.all(FILES.map(one)).then(() => { if (decoding === d && FILES.some(n => !bufs.get(n))) decoding = null; });
  return d;
}

/** HE10 (A36): silence every sound still scheduled (a hidden page, a new match, the unmount) — a suspend never plays them late */
export function stopAll() {
  for (const s of live) { try { s.stop(); } catch { /* already ended */ } }
  live.clear();
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
    return start(cues);
  } catch { return 0; }
}
function start(cues) {
  try {
    if (!cues || !cues.length || !isUnlocked()) return 0;
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return 0;
    // HE10 (A42): the first batch after an audio-engine rebuild (a new context — its buffers decoding) waits for them, then plays what's
    // still ahead (each cue its time less the wait; one already ≥ 150 ms late is dropped) — never silently lost
    if (bufCtx !== ctx || (decoding && !decoded(cues))) {
      const t0 = performance.now(), p = decodeAll();
      if (p) {
        p.then(() => { const late = performance.now() - t0; const next = cues.map(c => ({ ...c, at: (c.at || 0) - late })).filter(c => c.at > -150 && bufs.get(c.name)); if (next.length) start(next); });
        return 0;
      }
    }
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
      live.add(s); s.onended = () => live.delete(s);
      log.push({ name: c.name, at: Math.round(c.at || 0), rate: +(c.rate || 1).toFixed(3), gain: +g.gain.value.toFixed(3) }); if (log.length > 120) log.shift();
      n++;
    }
    return n;
  } catch { return 0; }
}
const decoded = cues => cues.every(c => bufs.get(c.name));
export const playSound = (name, opts = {}) => playCues([{ name, at: 0, ...opts }]);
/** the test hook: the cues that started on the audio context */
export const played = () => log.slice();
export const planned = () => plan.slice();
