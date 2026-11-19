// HIGH RISE — THE SOUNDS (S2 — docs/highrise.md "THE SOUNDS"; the files: audio/highrise/ + CREDITS.md). The site's sound-engine pattern
// (docs/audio.md; JAYWALK's sfx.js): the bytes fetched early (no AudioContext — nothing sounds before a tap), decoded ONCE when the SHARED
// engine unlocks, each sound a buffer source → its gain → A SOFT LIMITER → the console's SFX bus (the Effects slider, the toggle, THE ONE
// MUTE and THE CUT apply there). 8 VOICES by PRIORITY (sounds.js#admit). Audio is POLISH: locked, muted, a missing file — nothing plays,
// nothing throws; the game never asks the sounds anything.
// ONE take a sound (S3 — the owner's picks are final: ALL A; S2's B takes + this phone's `hi:play:snd:<id>` picks left the game).
import { getContext, getSfxBus, isUnlocked, onUnlock } from '../../audio/engine.js';
import { SOUNDS, SOUND_FILES, VOICES, DROP_VARY, admit, cuesOf } from './sounds.js';
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
const live = new Set();                // the voices sounding: { src, pri, at }
const log = [], asked = [];            // the test hooks: what started · what was asked for (locked / headless included)
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
/**
 * play one sound NOW: id, { rate (× the take's own), vol, delay (s) } → true = it started
 * (false: locked, muted, undecoded, outranked). A sound asked BEFORE the unlock (the first tap's own drop) plays as soon as it lands, if
 * still fresh.
 */
export function play(id, o = {}) {
  const s = BY[id];
  if (!s) return false;
  const tk = s, t0 = performance.now();
  if (!o.late) { asked.push({ id, rate: +((o.rate || 1) * tk.rate).toFixed(4), delay: +(o.delay || 0).toFixed(3) }); if (asked.length > 300) asked.shift(); }
  try {
    if (!bytes.has(tk.file)) fetchSounds([tk.file]);
    const ctx = getContext();
    // (isUnlocked() = running OR NAPPING — CITY I's PODCAST MODE suspends the context between effects and a source's own start wakes
    //  it (engine.js#wakeFor): asking for `running` here made the whole game silent with the site's music off — the review's find)
    if (!isUnlocked() || !ctx || !bufs.get(tk.file) || bufCtx !== ctx) {
      // (not ready: the first tap's own sound, or the first play of a sound just fetched — wait for the decode, play if still fresh)
      if (!o.late) { const go = () => decode().then(() => { if (performance.now() - t0 < 220) play(id, { ...o, late: true }); }); if (isUnlocked()) go(); else if (!lockWait) { lockWait = true; onUnlock(() => { lockWait = false; go(); }); } }
      return false;
    }
    const voices = [...live], a = admit(voices, s.pri, VOICES);
    if (!a.ok) return false;
    if (a.drop >= 0) voices[a.drop].end();
    const src = ctx.createBufferSource(), g = ctx.createGain(), v = { src, id, pri: s.pri, at: t0 };
    src.buffer = bufs.get(tk.file); src.playbackRate.value = (o.rate || 1) * tk.rate;
    g.gain.value = s.gain * (o.vol == null ? 1 : o.vol);
    src.connect(g); g.connect(out(ctx));
    src.start(ctx.currentTime + (o.delay || 0), leads.get(tk.file) || 0); live.add(v); src.onended = () => live.delete(v);
    // (a dropped voice never stops dead: a 30 ms ramp, then the source)
    v.end = () => { live.delete(v); try { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.03); src.stop(t + 0.05); } catch { /* ended */ } };
    log.push({ id, rate: +src.playbackRate.value.toFixed(4), gain: +g.gain.value.toFixed(3) }); if (log.length > 300) log.shift();
    return true;
  } catch { return false; }
}
/** a frame's CUES (sounds.js#cuesOf) → the sounds: a drop never the same twice (pitch ± 4 %, gain ± 1.5 dB) */
export function playCues(cues, rnd = Math.random) {
  for (const c of cues) {
    if (c.vary) play(c.id, { rate: 1 + (rnd() * 2 - 1) * DROP_VARY.rate, vol: Math.pow(10, (rnd() * 2 - 1) * DROP_VARY.db / 20), delay: c.delay });
    else play(c.id, { rate: c.rate, delay: c.delay });
  }
}
/** silence everything still sounding (the sheet closing, the page leaving) */
export function stopAll() { for (const v of [...live]) v.end(); live.clear(); }
/** the test hooks: what started on the audio context · what was asked for · the voices sounding */
export const played = () => log.slice();
export const wanted = () => asked.slice();
export const sounding = () => live.size;
/** each decoded file: its length + the lead-in skipped at its start (s) */
export const decoded = () => [...bufs.entries()].map(([file, b]) => ({ file, s: +b.duration.toFixed(3), lead: +(leads.get(file) || 0).toFixed(4) }));
