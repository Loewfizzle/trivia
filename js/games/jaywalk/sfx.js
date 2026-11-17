// JAYWALK — THE SOUNDS (H2 — docs/jaywalk.md "THE SOUNDS"; the files: audio/jaywalk/ + CREDITS.md). The site's sound-engine pattern
// (docs/audio.md; HOLD'EM's sfx.js): the bytes fetched at preload (no AudioContext — nothing sounds before a tap), decoded ONCE when the
// SHARED engine unlocks, each sound an AudioBufferSourceNode → its gain → A SOFT LIMITER → the console's SFX bus (the Effects slider, the
// toggle, THE ONE MUTE and THE CUT apply there). ≈ 8 VOICES, by PRIORITY: your own hit / splash over a hop / a landing.
// Audio is POLISH: locked, muted, a missing file — nothing plays, nothing throws; every hazard keeps its visual tell.
//   IN PLAY: hop (pitch ± 6 %, gain ± 2 dB a hop) · land-wood (a landing on a log) · hit · splash (H2 — the engine's events: onEvent) +
//   H5A — THE WORLD's (cues.js → onCue): the train bell (a seamless loop while the signals flash) + the train passing, a car passing (a
//   real near miss, ≤ 2 at once, panned), the horn (≤ 1 per 3 s), the lights dying, a gateway (landmark), new-best. The mix is H6's.
//   EVERY sound has its pick (A) and, where one was delivered, a `-b` backup (B): pick(id) is the owner's choice on this phone.
import { getContext, getSfxBus, isUnlocked, onUnlock } from '../../audio/engine.js';
import { getPref, setPref } from './lab-prefs.js';
import { SOUNDS, VOICES, HOP_VARY, admit, TRAIN_DUCK } from './sounds.js';
export { SOUNDS, VOICES, HOP_VARY, admit, TRAIN_DUCK };

const DIR = new URL('../../../audio/jaywalk/', import.meta.url);
export const JW_SFX_REV = 1;   // (bump when a sound file is replaced)
const BY = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
export const LIMITER = Object.freeze({ threshold: -8, knee: 6, ratio: 8, attack: 0.002, release: 0.16 });
export const TRIM = 0.8;       // (takes the compressor's own make-up gain back out: a lone sound plays at its level)

/** the owner's pick for a sound on this phone: 'a' | 'b' */
export const pick = id => (BY[id] && BY[id].b && getPref(`snd:${id}`, 'a') === 'b' ? 'b' : 'a');
export function setPick(id, ab) { if (BY[id]) setPref(`snd:${id}`, ab === 'b' && BY[id].b ? 'b' : 'a'); }
/** the one line the owner pastes into chat */
export const picksLine = () => `JAYWALK SOUNDS: ${SOUNDS.map(s => `${s.id} ${pick(s.id).toUpperCase()}`).join(' · ')}`;
const fileOf = (id, ab) => `${id}${ab === 'b' ? '-b' : ''}.${BY[id].ext || 'mp3'}`;
const keysOf = s => (s.b ? [`${s.id}:a`, `${s.id}:b`] : [`${s.id}:a`]);

const bytes = new Map();               // 'id:a' → Promise<ArrayBuffer | null>
const bufs = new Map();                // 'id:a' → AudioBuffer (for bufCtx)
let bufCtx = null, bus = null, busCtx = null, hooked = false;
const live = new Set();                // the voices sounding: { src, pri, at }
const log = [];                        // the test hook: what started
const asked = [];                      // the test hook: what was asked for (locked / headless included)
const total = { asked: 0, started: 0, by: {} };   // (… and how many EVER — the two lists keep their last 200: H5A's cues fill them fast)

/** fetch the bytes now (no AudioContext needed). `ids`: which sounds (default: every sound in play); `both` = a sound's pick AND its
 *  backup (the audition's — the game fetches the take it plays: the owner's pick, A unless this phone chose B) */
export function fetchSounds(ids = SOUNDS.filter(s => s.play).map(s => s.id), both = false) {
  for (const id of ids) for (const k of both ? keysOf(BY[id]) : [`${id}:${pick(id)}`]) {
    if (bytes.has(k)) continue;
    const p = fetch(new URL(`${fileOf(id, k.slice(-1))}?v=${JW_SFX_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
      .then(a => { if (!a && bytes.get(k) === p) bytes.delete(k); return a; });
    bytes.set(k, p);
  }
  if (!hooked) { hooked = true; try { onUnlock(() => { decode(); }); } catch { /* no engine */ } }
}
/** decode what was fetched, once for the live context (the unlock, or a call after it) → a promise */
export function decode() {
  const ctx = getContext();
  if (!ctx) return Promise.resolve();
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  return Promise.all([...bytes.entries()].map(([k, p]) => (bufs.has(k) ? null : p.then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null))
    .then(b => { if (b && bufCtx === ctx) bufs.set(k, b); }, () => {}))));
}
function out(ctx) {
  if (bus && busCtx === ctx) return bus;
  busCtx = ctx;
  const comp = ctx.createDynamicsCompressor(), trim = ctx.createGain();
  for (const [k, v] of Object.entries(LIMITER)) { try { comp[k].value = v; } catch { /* an old Safari */ } }
  trim.gain.value = TRIM; comp.connect(trim); trim.connect(getSfxBus() || ctx.destination);
  bus = comp;
  return bus;
}
/**
 * play one sound NOW: name, { ab ('a' | 'b' — default: the owner's pick), rate, vol, loop } → a handle { stop() } (null = nothing started:
 * locked, muted, undecoded, outranked). A tap that comes BEFORE the unlock (the first hop) plays as soon as it lands, if still fresh.
 */
export function play(id, o = {}) {
  const s = BY[id];
  if (!s) return null;
  const ab = o.ab === 'a' || o.ab === 'b' ? o.ab : pick(id), key = `${id}:${s.b ? ab : 'a'}`, t0 = performance.now();
  if (!o.late) { total.asked++; total.by[id] = (total.by[id] || 0) + 1; asked.push({ id, ab: key.slice(-1), rate: +(o.rate || 1).toFixed(3), vol: +(o.vol == null ? 1 : o.vol).toFixed(3), loop: !!(o.loop || s.loop) }); if (asked.length > 200) asked.shift(); }
  try {
    if (!bytes.has(key)) fetchSounds([id], true);
    const ctx = getContext();
    if (!isUnlocked() || !ctx || ctx.state !== 'running' || !bufs.get(key) || bufCtx !== ctx) {
      // (not ready: the first tap's own sound, or the first play of a sound just fetched — wait for the decode, play if still fresh)
      if (!o.late) { const go = () => decode().then(() => { if (performance.now() - t0 < (s.loop ? 1500 : 220)) { const h = play(id, { ...o, ab, late: true }); if (h && o.onLate) o.onLate(h); } }); if (isUnlocked()) go(); else { let once = false; onUnlock(() => { if (!once) { once = true; go(); } }); } }
      return null;
    }
    const voices = [...live], a = admit(voices, s.pri);
    if (!a.ok) return null;
    if (s.max && voices.filter(q => q.id === id).length >= s.max) return null;   // (H5A — a sound's own cap: ≤ 2 car passes, one horn, one bell)
    if (a.drop >= 0) { try { voices[a.drop].src.stop(); } catch { /* ended */ } live.delete(voices[a.drop]); }
    const src = ctx.createBufferSource(), g = ctx.createGain(), v = { src, id, pri: s.loop ? 9 : s.pri, at: t0 };
    src.buffer = bufs.get(key); src.playbackRate.value = o.rate || 1; src.loop = !!(o.loop || s.loop);
    g.gain.value = s.gain * (o.vol == null ? 1 : o.vol);
    // (H5A — PANNED by the side it is on: a stereo panner where the browser has one; none = the middle)
    let tail = g;
    if (o.pan && ctx.createStereoPanner) { try { const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(pn); tail = pn; } catch { tail = g; } }
    src.connect(g); tail.connect(out(ctx));
    src.start(); live.add(v); src.onended = () => live.delete(v);
    total.started++; log.push({ id, ab: key.slice(-1), rate: +src.playbackRate.value.toFixed(3), gain: +g.gain.value.toFixed(3), loop: src.loop, pan: +(o.pan || 0).toFixed(2) }); if (log.length > 200) log.shift();
    /** stop it — `fade` s: a short ramp first (a loop cut dead clicks) */
    return { stop(fade = 0) {
      live.delete(v);
      try { if (fade > 0) { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); src.stop(t + fade + 0.02); } else src.stop(); } catch { /* ended */ }
    } };
  } catch { return null; }
}
/** silence everything still sounding (a hidden page, the lab closing) */
export function stopAll() { bellWant = false; bell = null; for (const v of live) { try { v.src.stop(); } catch { /* ended */ } } live.clear(); }

// H5A — THE WORLD's CUES (cues.js#cuesAt → here): the bell is ONE seamless loop held while the signals flash — started on `bell-on`
// (a start that lands late, the first sound after an unlock, is still wanted or let go), faded out on `bell-off`
let bell = null, bellWant = false;
const cued = [];   // the test hook: every cue asked
export function onCue(q) {
  cued.push(q.cue); if (cued.length > 200) cued.shift();
  if (q.cue === 'bell-on') { bellWant = true; if (!bell) bell = play('train-bell', { loop: true, onLate: h => { if (bellWant && !bell) bell = h; else h.stop(); } }); return bell; }
  if (q.cue === 'bell-off') { bellWant = false; if (bell) { bell.stop(0.18); bell = null; } return null; }
  if (q.cue === 'train-pass') return play('train-pass', { pan: q.pan });
  if (q.cue === 'car-pass') return play('car-pass', { pan: q.pan, rate: 0.94 + Math.random() * 0.12 });
  if (q.cue === 'horn') return play('horn', { pan: q.pan });
  if (q.cue === 'lights-die') return play('lights-die');
  return null;
}
export const cues = () => cued.slice();

/** THE ENGINE's EVENTS → the sounds in play (engine.js#step's `ev`): hop · a landing on a log · hit / out (+ the splash for the water / the edge) */
export function onEvent(e, rnd = Math.random) {
  if (e.e === 'hop') return play('hop', { rate: 1 + (rnd() * 2 - 1) * HOP_VARY.rate, vol: Math.pow(10, (rnd() * 2 - 1) * HOP_VARY.db / 20) });
  if (e.e === 'land' && e.on === 'wood') return play('land-wood', { rate: 1 + (rnd() * 2 - 1) * 0.04 });
  if (e.e === 'out') return e.cause === 'water' || e.cause === 'edge' ? play('splash') : play('hit');
  return null;
}
/** the test hooks: what started on the audio context · what was asked for · the voices sounding */
export const played = () => log.slice();
export const wanted = () => asked.slice();
export const sounding = () => live.size;
export const totals = () => ({ ...total, by: { ...total.by } });   // (by: how often each sound was ever asked for)
