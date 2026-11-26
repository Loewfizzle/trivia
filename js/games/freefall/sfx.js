// FREEFALL — THE SOUNDS (F2 — docs/freefall.md "THE SOUNDS"; the files: audio/freefall/ + CREDITS.md, two of JAYWALK's). HIGH RISE's
// player (js/games/highrise/sfx.js — the site's sound-engine pattern, docs/audio.md): the bytes fetched early (no AudioContext — nothing
// sounds before a touch), decoded ONCE when the SHARED engine unlocks, each sound a buffer source → its gain → A SOFT LIMITER → the
// console's SFX bus (the Effects slider, the toggle, THE ONE MUTE and THE CUT apply there). 8 VOICES by PRIORITY (sounds.js#admitSlot).
// Audio is POLISH: locked, muted, a missing file — nothing plays, nothing throws; the game never asks the sounds anything.
// ZERO GARBAGE: a sound that starts makes ONE thing — its buffer source; its voice is one of a pool made once.
import { getContext, getSfxBus, isUnlocked, onUnlock, onRebuild, audioUnlocked, audioHushed } from '../../audio/engine.js';
import { leadIn, lateGate, decodeOnce } from '../../audio/sfx-kit.js';
import { SOUNDS, SOUND_FILES, VOICES, BOUNCE_VARY_DB, admitSlot, cuesOf } from './sounds.js';
export { SOUNDS, cuesOf };

const DIR = new URL('../../../audio/', import.meta.url);
export const FF_SFX_REV = 1;   // (bump when a sound file is replaced)
const BY = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
const keyOf = s => `${s.dir}/${s.file}`;
export const LIMITER = Object.freeze({ threshold: -8, knee: 6, ratio: 8, attack: 0.002, release: 0.16 });
export const TRIM = 0.8;       // (takes the compressor's own make-up gain back out: a lone sound plays at its level)

const bytes = new Map();               // "dir/file" → Promise<ArrayBuffer | null>
const bufs = new Map();                // "dir/file" → AudioBuffer (for bufCtx)
let bufCtx = null, bus = null, busCtx = null, hooked = false;
const gate = lateGate(), decoding = new Map();
const POOL = VOICES + 3;               // (a voice that is being faded out — 50 ms — is not free yet: three to spare)
const slots = [];                      // { on, src, g, gctx, id, pri, at, busy (ms: its fade's end), ended }
for (let i = 0; i < POOL; i++) {
  const v = { on: false, src: null, g: null, gctx: null, id: '', pri: 0, at: 0, busy: 0, ended: null };
  v.ended = e => { if (e.target === v.src) { v.on = false; v.src = null; } };   // (an old source's late `ended` never frees the voice's next sound)
  slots.push(v);
}
/** a voice stops: never dead — a 30 ms ramp, then the source; its gain is free again once the ramp is through */
function endVoice(v) {
  if (!v.on) return;
  v.on = false;
  try { const c = v.gctx, t = c.currentTime; v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 0.03); v.src.stop(t + 0.05); } catch { /* ended */ }
  v.src = null; v.busy = performance.now() + 60;
}
// the test hooks: what started · what was asked for (locked / headless included) — the last RING of each, records made once
const RING = 300, log = [], asked = [];
let logN = 0, askedN = 0;
for (let i = 0; i < RING; i++) { log.push({ id: '', rate: 0, gain: 0 }); asked.push({ id: '', rate: 0, delay: 0 }); }
const r4 = x => Math.round(x * 1e4) / 1e4, r3 = x => Math.round(x * 1e3) / 1e3;
const ringOut = (a, n, pick) => { const out = [], k = Math.min(n, RING); for (let i = n - k; i < n; i++) out.push(pick(a[i % RING])); return out; };
let workAt = 0;                        // the last time the sounds did one-off work (a decode landed, the limiter was built)
export const lastWork = () => workAt;

/** fetch the bytes now (no AudioContext needed) — every file of the table by default (nine small MP3s) */
export function fetchSounds(list = SOUNDS) {
  for (const s of list) {
    const k = keyOf(s);
    if (bytes.has(k)) continue;
    const p = fetch(new URL(`${s.dir}/${s.file}.mp3?v=${FF_SFX_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
      .then(a => { if (!a && bytes.get(k) === p) bytes.delete(k); return a; });
    bytes.set(k, p);
  }
  if (!hooked) { hooked = true; try { onUnlock(() => { decode(); }); } catch { /* no engine */ } }
}
/** decode what was fetched, once for the live context (the unlock, or a call after it) → a promise */
export function decode() {
  const ctx = getContext();
  if (!ctx) return Promise.resolve();
  if (bufCtx !== ctx) { bufs.clear(); decoding.clear(); bufCtx = ctx; }
  const jobs = [];
  // (a decode IN FLIGHT is shared; a FAILED one is forgotten with its bytes; the MP3's lead-in is measured HERE — never in a landing's frame)
  for (const [k, p] of bytes) if (!bufs.has(k)) jobs.push(decodeOnce(ctx, k, p, decoding, (b, had) => { if (b && bufCtx === ctx) { bufs.set(k, b); leadIn(b); workAt = performance.now(); } else if (!b && had && bytes.get(k) === p) bytes.delete(k); }));
  // (the limiter + its trim are built HERE, with the decode at the unlock — not inside the first bounce's frame)
  return Promise.all(jobs).then(r => { try { if (isUnlocked()) out(ctx); } catch { /* at the first play, then */ } return r; });
}
function out(ctx) {
  if (bus && busCtx === ctx) return bus;
  busCtx = ctx; workAt = performance.now();
  const comp = ctx.createDynamicsCompressor(), trim = ctx.createGain();
  for (const [k, v] of Object.entries(LIMITER)) { try { comp[k].value = v; } catch { /* an old Safari */ } }
  trim.gain.value = TRIM; comp.connect(trim); trim.connect(getSfxBus() || ctx.destination);
  bus = comp;
  return bus;
}
/** THE SOUND SYNC: is EVERY fetched sound decoded for the live context (nothing a landing would have to wait for)? */
export const ready = () => { const ctx = getContext(); return !!ctx && bufCtx === ctx && bytes.size > 0 && [...bytes.keys()].every(k => bufs.has(k)); };
/** → a promise: every sound decoded — or `ms` passed (no engine, no signal, a locked phone: the run never waits longer) */
export function whenReady(ms = 600) {
  return new Promise(res => {
    let off = null;
    const done = () => { clearTimeout(t); if (off) { try { off(); } catch { /* gone */ } off = null; } res(); };
    const t = setTimeout(done, ms);
    try { off = onUnlock(() => { off = null; decode().then(() => (ready() ? done() : null), () => {}); }) || null; } catch { done(); }
  });
}
let lateN = 0;
/** how often a sound was asked BEFORE it could play (locked / undecoded — the late path): 0 in a run (the pass's check) */
export const lates = () => lateN;
/** play one sound NOW: id, { rate, vol, delay (s) } → true = it started (false: locked, muted, undecoded, outranked) */
export function play(id, o) { return o ? start(id, o.rate || 1, o.vol == null ? 1 : o.vol, o.delay || 0, !!o.late) : start(id, 1, 1, 0, false); }
function start(id, rate, vol, delay, late) {
  const s = BY[id];
  if (!s) return false;
  const t0 = performance.now(), k = keyOf(s);
  if (!late) { const q = asked[askedN++ % RING]; q.id = id; q.rate = r4(rate * s.rate); q.delay = r3(delay); }
  try {
    if (!bytes.has(k)) fetchSounds([s]);
    const ctx = getContext(), buf = bufs.get(k);
    // (isUnlocked() — never the context's own state: AN EFFECT ASKS isUnlocked(), docs/audio.md)
    if (!isUnlocked() || !ctx || !buf || bufCtx !== ctx) { if (!late) lateStart(id, rate, vol, delay, t0); return false; }
    const a = admitSlot(slots, s.pri, VOICES);
    if (a === -2) return false;
    if (a >= 0) endVoice(slots[a]);
    let v = null;
    for (let i = 0; i < POOL; i++) { const q = slots[i]; if (!q.on && q.busy <= t0) { v = q; break; } }
    if (!v) return false;
    const dst = out(ctx);
    if (v.gctx !== ctx) { v.g = ctx.createGain(); v.g.connect(dst); v.gctx = ctx; }   // (a voice's gain: made + wired ONCE a context)
    const src = ctx.createBufferSource(), t = ctx.currentTime, gain = s.gain * vol;
    src.buffer = buf; src.playbackRate.value = rate * s.rate;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(gain, t);
    src.connect(v.g);
    src.onended = v.ended;
    src.start(t + delay, leadIn(buf));
    v.on = true; v.src = src; v.id = id; v.pri = s.pri; v.at = t0;
    const l = log[logN++ % RING]; l.id = id; l.rate = r4(rate * s.rate); l.gain = r3(gain);
    return true;
  } catch { return false; }
}
// THE LATE PATH (never in a run — the start waits for every decode): MUTED = nothing waits, nothing is made; else ONE wait, the LATEST sound only
let lateId = '', lateRate = 1, lateVol = 1, lateDelay = 0, lateT0 = 0;
const lateGo = () => { const id = lateId, rate = lateRate, vol = lateVol, delay = lateDelay, t0 = lateT0; decode().then(() => { if (performance.now() - t0 < 220) start(id, rate, vol, delay, true); }); };
function lateStart(id, rate, vol, delay, t0) {
  lateN++;
  if (audioUnlocked() && audioHushed()) return;
  lateId = id; lateRate = rate; lateVol = vol; lateDelay = delay; lateT0 = t0;
  gate.when(lateGo);
}
/** a frame's CUES (sounds.js#cuesOf) → the sounds: a bounce never the same twice (gain ± 1.5 dB) */
export function playCues(cues, rnd = Math.random) {
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    start(c.id, c.rate || 1, (c.vol == null ? 1 : c.vol) * (c.vary ? Math.pow(10, (rnd() * 2 - 1) * BOUNCE_VARY_DB / 20) : 1), c.delay || 0, false);
  }
}
/** silence everything still sounding (the sheet closing, the page leaving) */
export function stopAll() { for (let i = 0; i < POOL; i++) endVoice(slots[i]); }
/** the test hooks: what started on the audio context · what was asked for · the voices sounding */
export const played = () => ringOut(log, logN, l => ({ id: l.id, rate: l.rate, gain: l.gain }));
export const wanted = () => ringOut(asked, askedN, q => ({ id: q.id, rate: q.rate, delay: q.delay }));
export const sounding = () => { let n = 0; for (let i = 0; i < POOL; i++) if (slots[i].on) n++; return n; };
/** each decoded file: its length + the lead-in skipped at its start (s) */
export const decoded = () => [...bufs.entries()].map(([file, b]) => ({ file, s: +b.duration.toFixed(3), lead: +leadIn(b).toFixed(4) }));
export const waiting = () => gate.waiting();
export const files = () => SOUND_FILES;

// iOS's CONTEXT REBUILD (engine.js#rebuild): the old context's sources never fire `ended` — every voice is free again, the limiter +
// the buffers are the new context's (decoded again now, not at the next landing)
try {
  onRebuild(() => {
    for (let i = 0; i < POOL; i++) { const v = slots[i]; if (v.src) v.src.onended = null; v.on = false; v.src = null; v.busy = 0; v.g = null; v.gctx = null; }
    bus = null; busCtx = null; bufs.clear(); decoding.clear(); gate.reset(); bufCtx = null;
    if (bytes.size) decode().catch(() => {});
  });
} catch { /* no engine */ }
