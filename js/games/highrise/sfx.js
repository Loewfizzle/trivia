// HIGH RISE — THE SOUNDS (S2 — docs/highrise.md "THE SOUNDS"; the files: audio/highrise/ + CREDITS.md). The site's sound-engine pattern
// (docs/audio.md; JAYWALK's sfx.js): the bytes fetched early (no AudioContext — nothing sounds before a tap), decoded ONCE when the SHARED
// engine unlocks, each sound a buffer source → its gain → A SOFT LIMITER → the console's SFX bus (the Effects slider, the toggle, THE ONE
// MUTE and THE CUT apply there). 8 VOICES by PRIORITY (sounds.js#admit). Audio is POLISH: locked, muted, a missing file — nothing plays,
// nothing throws; the game never asks the sounds anything.
// ONE take a sound (S3 — the owner's picks are final: ALL A; S2's B takes + this phone's `hi:play:snd:<id>` picks left the game).
import { getContext, getSfxBus, isUnlocked, onUnlock } from '../../audio/engine.js';
import { SOUNDS, SOUND_FILES, VOICES, DROP_VARY, admitSlot, cuesOf } from './sounds.js';
export { SOUNDS, cuesOf };

const DIR = new URL('../../../audio/highrise/', import.meta.url);
export const HI_SFX_REV = 2;   // (bump when a sound file is replaced — 2: the files ship as MP3, S2 FIX)
// THE FILES ARE MP3 (S2 FIX — scripts/build-highrise-sounds.mjs: 633 KB of WAV → 121 KB). An MP3 begins with its encoder's LEAD-IN
// (~25–50 ms of near-silence a WAV never had): each sound is started at its first audible sample (less a millisecond) — a drop's
// sound stays ON its tap. Measured once a file, when its decode lands.
export const LEAD_AT = 0.003, LEAD_MAX = 0.08;
export function leadOf(b) {
  try {
    const d = b.getChannelData(0), n = Math.min(d.length, Math.floor(b.sampleRate * LEAD_MAX));
    for (let i = 0; i < n; i++) if (d[i] > LEAD_AT || d[i] < -LEAD_AT) return Math.max(0, i / b.sampleRate - 0.001);
  } catch { /* an odd buffer: from its start */ }
  return 0;
}
const leads = new Map();              // file → seconds skipped at its start
const BY = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
export const LIMITER = Object.freeze({ threshold: -8, knee: 6, ratio: 8, attack: 0.002, release: 0.16 });
export const TRIM = 0.8;       // (takes the compressor's own make-up gain back out: a lone sound plays at its level)

const bytes = new Map();               // file → Promise<ArrayBuffer | null>
const bufs = new Map();                // file → AudioBuffer (for bufCtx)
let bufCtx = null, bus = null, busCtx = null, hooked = false, lockWait = false;
// ZERO GARBAGE (S4A FIX — the owner's iPhone: a stall a floor, the collector's): a sound that starts makes ONE thing — its buffer
// source (Web Audio's one-shot: it can not be kept). Its VOICE is one of a POOL of slots made once: each keeps its own gain node
// (wired to the limiter once a context), its own `ended` handler, its own record; the test hooks write into two rings of records.
// (It used to make, a sound: a gain node, a voice object, two closures, a copy of the voices' list, two log records with built strings.)
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
let workAt = 0;                        // the last time the sounds did one-off work (a decode landed, the limiter was built) — THE HITCH COUNTER's 'audio' tag (play.js)
export const lastWork = () => workAt;

/** fetch the bytes now (no AudioContext needed) — every file by default (nine small MP3s) */
export function fetchSounds(files = SOUND_FILES) {
  for (const f of files) {
    if (bytes.has(f)) continue;
    const p = fetch(new URL(`${f}.mp3?v=${HI_SFX_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
      .then(a => { if (!a && bytes.get(f) === p) bytes.delete(f); return a; });
    bytes.set(f, p);
  }
  if (!hooked) { hooked = true; try { onUnlock(() => { decode(); }); } catch { /* no engine */ } }
}
/** decode what was fetched, once for the live context (the unlock, or a call after it) → a promise */
export function decode() {
  const ctx = getContext();
  if (!ctx) return Promise.resolve();
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  return Promise.all([...bytes.entries()].map(([k, p]) => (bufs.has(k) ? null : p.then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null))
    .then(b => { if (b && bufCtx === ctx) { bufs.set(k, b); leads.set(k, leadOf(b)); workAt = performance.now(); } }, () => {}))))
    // (S2 FIX — THE LAG HUNT: the limiter + its trim are built HERE, with the decode at the unlock — not inside the first drop's frame)
    .then(r => { try { if (isUnlocked()) out(ctx); } catch { /* at the first play, then */ } return r; });
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
/** S4A — THE SOUND SYNC: is EVERY fetched sound decoded for the live context (nothing a drop would have to wait for)? */
export const ready = () => { const ctx = getContext(); return !!ctx && bufCtx === ctx && bytes.size > 0 && [...bytes.keys()].every(k => bufs.has(k)); };
/** → a promise: every sound decoded — or `ms` passed (no engine, no signal, a locked phone: the run never waits longer). START waits
 *  this moment, so no sound of a run takes the late path below */
export function whenReady(ms = 600) {
  return new Promise(res => {
    const t = setTimeout(res, ms), done = () => { clearTimeout(t); res(); };
    try { onUnlock(() => { decode().then(() => (ready() ? done() : null), () => {}); }); } catch { done(); }
  });
}
let lateN = 0;
/** how often a sound was asked BEFORE it could play (locked / undecoded — the late path): 0 in a run (the pass's check) */
export const lates = () => lateN;
/**
 * play one sound NOW: id, { rate (× the take's own), vol, delay (s) } → true = it started
 * (false: locked, muted, undecoded, outranked). A sound asked BEFORE the unlock (the first tap's own drop) plays as soon as it lands, if
 * still fresh.
 */
export function play(id, o) { return o ? start(id, o.rate || 1, o.vol == null ? 1 : o.vol, o.delay || 0, !!o.late) : start(id, 1, 1, 0, false); }
/** … the same by plain numbers (a frame's cues: no options object is made) */
function start(id, rate, vol, delay, late) {
  const s = BY[id];
  if (!s) return false;
  const t0 = performance.now();
  if (!late) { const q = asked[askedN++ % RING]; q.id = id; q.rate = r4(rate * s.rate); q.delay = r3(delay); }
  try {
    if (!bytes.has(s.file)) fetchSounds([s.file]);
    const ctx = getContext(), buf = bufs.get(s.file);
    // (isUnlocked() = running OR NAPPING — CITY I's PODCAST MODE suspends the context between effects and a source's own start wakes
    //  it (engine.js#wakeFor): asking for `running` here made the whole game silent with the site's music off — the review's find)
    if (!isUnlocked() || !ctx || !buf || bufCtx !== ctx) {
      // (not ready: the first tap's own sound, or the first play of a sound just fetched — wait for the decode, play if still fresh)
      if (!late) lateStart(id, rate, vol, delay, t0);
      return false;
    }
    const a = admitSlot(slots, s.pri, VOICES);
    if (a === -2) return false;
    if (a >= 0) endVoice(slots[a]);
    let v = null;
    for (let i = 0; i < POOL; i++) { const q = slots[i]; if (!q.on && q.busy <= t0) { v = q; break; } }
    if (!v) return false;   // (every spare voice is still fading — never in play: three at once would have to be outranked within 60 ms)
    const dst = out(ctx);
    if (v.gctx !== ctx) { v.g = ctx.createGain(); v.g.connect(dst); v.gctx = ctx; }   // (a voice's gain: made + wired ONCE a context)
    const src = ctx.createBufferSource(), t = ctx.currentTime, gain = s.gain * vol;
    src.buffer = buf; src.playbackRate.value = rate * s.rate;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(gain, t);
    src.connect(v.g);
    src.onended = v.ended;
    src.start(t + delay, leads.get(s.file) || 0);
    v.on = true; v.src = src; v.id = id; v.pri = s.pri; v.at = t0;
    const l = log[logN++ % RING]; l.id = id; l.rate = r4(rate * s.rate); l.gain = r3(gain);
    return true;
  } catch { return false; }
}
/** THE LATE PATH (never in a run — START waits for every decode): kept OUT of start() — a function an inner function reads the
 *  numbers of is given a fresh record for them at every call, and start() runs for every sound */
function lateStart(id, rate, vol, delay, t0) {
  lateN++;
  const go = () => decode().then(() => { if (performance.now() - t0 < 220) start(id, rate, vol, delay, true); });
  if (isUnlocked()) go(); else if (!lockWait) { lockWait = true; onUnlock(() => { lockWait = false; go(); }); }
}
/** a frame's CUES (sounds.js#cuesOf) → the sounds: a drop never the same twice (pitch ± 4 %, gain ± 1.5 dB) */
export function playCues(cues, rnd = Math.random) {
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    if (c.vary) start(c.id, 1 + (rnd() * 2 - 1) * DROP_VARY.rate, Math.pow(10, (rnd() * 2 - 1) * DROP_VARY.db / 20), c.delay || 0, false);
    else start(c.id, c.rate || 1, 1, c.delay || 0, false);
  }
}
/** silence everything still sounding (the sheet closing, the page leaving) */
export function stopAll() { for (let i = 0; i < POOL; i++) endVoice(slots[i]); }
/** the test hooks: what started on the audio context · what was asked for · the voices sounding */
export const played = () => ringOut(log, logN, l => ({ id: l.id, rate: l.rate, gain: l.gain }));
export const wanted = () => ringOut(asked, askedN, q => ({ id: q.id, rate: q.rate, delay: q.delay }));
export const sounding = () => { let n = 0; for (let i = 0; i < POOL; i++) if (slots[i].on) n++; return n; };
/** each decoded file: its length + the lead-in skipped at its start (s) */
export const decoded = () => [...bufs.entries()].map(([file, b]) => ({ file, s: +b.duration.toFixed(3), lead: +(leads.get(file) || 0).toFixed(4) }));
