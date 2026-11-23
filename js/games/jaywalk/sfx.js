// JAYWALK — THE SOUNDS (H2 — docs/jaywalk.md "THE SOUNDS"; the files: audio/jaywalk/ + CREDITS.md). The site's sound-engine pattern
// The long notes: docs/games/jaywalk-notes.md
import { getContext, getSfxBus, isUnlocked, onUnlock } from '../../audio/engine.js';
import { getPref, setPref } from './lab-prefs.js';
import { SOUNDS, VOICES, HOP_VARY, admit, TRAIN_DUCK, FADE_S, MATCH_SOUNDS, seasonSoundsOf } from './sounds.js';
export { SOUNDS, VOICES, HOP_VARY, admit, TRAIN_DUCK, FADE_S, MATCH_SOUNDS, seasonSoundsOf };

const DIR = new URL('../../../audio/jaywalk/', import.meta.url);
export const JW_SFX_REV = 4;
const BY = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
export const LIMITER = Object.freeze({ threshold: -8, knee: 6, ratio: 8, attack: 0.002, release: 0.16 });
export const TRIM = 0.8;

/** THE TAKES ARE PINNED (BEFORE THE FLIP — the owner, Nov 17): the GAME plays the owner's picks for everyone — every A / B sound its … */
let labPicks = false;
export function useLabPicks(on = true) { labPicks = !!on; }
/** the take a sound plays: 'a' | 'b' — the owner's (A) in the game; this phone's audition pick in the lab */
export const pick = id => (labPicks && BY[id] && BY[id].b && getPref(`snd:${id}`, 'a') === 'b' ? 'b' : 'a');
export function setPick(id, ab) { if (BY[id]) setPref(`snd:${id}`, ab === 'b' && BY[id].b ? 'b' : 'a'); }
/** the one line the owner pastes into chat */
export const picksLine = () => `JAYWALK SOUNDS: ${SOUNDS.map(s => `${s.id} ${pick(s.id).toUpperCase()}`).join(' · ')}`;
const fileOf = (id, ab) => `${id}${ab === 'b' ? '-b' : ''}.${BY[id].ext || 'mp3'}`;
const keysOf = s => (s.b ? [`${s.id}:a`, `${s.id}:b`] : [`${s.id}:a`]);

const bytes = new Map();
const bufs = new Map();
let bufCtx = null, bus = null, busCtx = null, hooked = false, lockWait = false;
const live = new Set();
const log = [];
const asked = [];
const total = { asked: 0, started: 0, by: {} };

/** fetch the bytes now (no AudioContext needed). `ids`: which sounds (default: every sound in play); `both` = a sound's pick AND its … */
export function fetchSounds(ids = SOUNDS.filter(s => s.play && !s.match && !s.season).map(s => s.id), both = false) {
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
/** … */
export function play(id, o = {}) {
  const s = BY[id];
  if (!s) return null;
  const ab = o.ab === 'a' || o.ab === 'b' ? o.ab : pick(id), key = `${id}:${s.b ? ab : 'a'}`, t0 = performance.now();
  if (!o.late) { total.asked++; total.by[id] = (total.by[id] || 0) + 1; asked.push({ id, ab: key.slice(-1), rate: +(o.rate || 1).toFixed(3), vol: +(o.vol == null ? 1 : o.vol).toFixed(3), loop: !!(o.loop || s.loop) }); if (asked.length > 200) asked.shift(); }
  try {
    if (!bytes.has(key)) fetchSounds([id], true);
    const ctx = getContext();
    // (isUnlocked() = running OR NAPPING — CITY I's PODCAST MODE suspends the context between effects and a source's own start wakes it …
    if (!isUnlocked() || !ctx || !bufs.get(key) || bufCtx !== ctx) {
      // (not ready: the first tap's own sound, or the first play of a sound just fetched — wait for the decode, play if still fresh)
      if (!o.late) { const go = () => decode().then(() => { if (performance.now() - t0 < (s.loop ? 1500 : 220)) { const h = play(id, { ...o, ab, late: true }); if (h && o.onLate) o.onLate(h); } }); if (isUnlocked()) go(); else if (!lockWait) { lockWait = true; onUnlock(() => { lockWait = false; go(); }); } }
      return null;
    }
    const voices = [...live], a = admit(voices, s.pri);
    if (!a.ok) return null;
    if (s.max && voices.filter(q => q.id === id).length >= s.max) return null;
    if (a.drop >= 0) voices[a.drop].end();
    const src = ctx.createBufferSource(), g = ctx.createGain(), v = { src, id, pri: s.loop ? 9 : s.pri, at: t0, fade: s.fade || 0 };
    src.buffer = bufs.get(key); src.playbackRate.value = o.rate || 1; src.loop = !!(o.loop || s.loop);
    g.gain.value = s.gain * (o.vol == null ? 1 : o.vol);
    // (H5A — PANNED by the side it is on: a stereo panner where the browser has one; none = the middle)
    let tail = g;
    if (o.pan && ctx.createStereoPanner) { try { const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(pn); tail = pn; } catch { tail = g; } }
    src.connect(g); tail.connect(out(ctx));
    src.start(); live.add(v); src.onended = () => live.delete(v);
    // (H5B — a sound with a `fade` NEVER stops dead: its own end ramps out over its last `fade` s — the take's tail is not trusted …)
    if (s.fade && !src.loop) { const dur = src.buffer.duration / src.playbackRate.value, t = ctx.currentTime; if (dur > s.fade * 2) { g.gain.setValueAtTime(g.gain.value, t + dur - s.fade); g.gain.linearRampToValueAtTime(0, t + dur); } }
    // (… and a stop — the bell's signals ending, a new run, the unmount, a voice a louder sound takes — ramps out the same way)
    v.end = (fade = v.fade) => {
      live.delete(v);
      try { if (fade > 0) { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); src.stop(t + fade + 0.02); } else src.stop(); } catch { /* ended */ }
    };
    total.started++; log.push({ id, ab: key.slice(-1), rate: +src.playbackRate.value.toFixed(3), gain: +g.gain.value.toFixed(3), loop: src.loop, pan: +(o.pan || 0).toFixed(2) }); if (log.length > 200) log.shift();
    /** stop it — `fade` s (default: the sound's own — the train sounds' 0.5 s): a ramp first, never a dead cut · set(vol, rate): a loop … */
    const set = (vol, rate) => { try { const t = ctx.currentTime; g.gain.setTargetAtTime(s.gain * vol, t, 0.15); if (rate) src.playbackRate.setTargetAtTime(rate, t, 0.25); } catch { /* ended */ } };
    return { stop: v.end, set };
  } catch { return null; }
}
/** the game is LEFT (not PLAY AGAIN): the decoded sounds are let go — the fetched bytes stay, the next visit decodes them again */
export function release() { stopAll(); bufs.clear(); bufCtx = null; }
/** silence everything still sounding (the unmount, the lab closing) — a sound with a `fade` (the train's) ramps out, the rest stop */
export function stopAll() { bellWant = false; bell = null; tickWant = null; tick = null; for (const v of [...live]) v.end(); live.clear(); }

// H5A — THE WORLD's CUES (cues.js#cuesAt → here): the bell is ONE seamless loop held while the signals flash — started on `bell-on` …
let bell = null, bellWant = false;
// BEFORE THE FLIP — THE STOPWATCH: ONE loop, held while the dark is close; `tick` cues glide its level + speed, `tick-off` fades it out
let tick = null, tickWant = null;
const cued = [];
export function onCue(q) {
  cued.push(q.cue); if (cued.length > 200) cued.shift();
  if (q.cue === 'bell-on') { bellWant = true; if (!bell) bell = play('train-bell', { loop: true, onLate: h => { if (bellWant && !bell) bell = h; else h.stop(); } }); return bell; }
  if (q.cue === 'bell-off') { bellWant = false; if (bell) { bell.stop(FADE_S); bell = null; } return null; }
  if (q.cue === 'train-pass') return play('train-pass', { pan: q.pan });
  if (q.cue === 'train-horn') return play('train-horn', { pan: q.pan });
  if (q.cue === 'horn') return play('horn', { pan: q.pan });
  if (q.cue === 'truck-horn') return play('truck-horn', { pan: q.pan });
  if (q.cue === 'tick') {
    tickWant = { level: q.level, rate: q.rate };
    if (tick) tick.set(q.level, q.rate);
    else tick = play('stopwatch-tick', { loop: true, vol: q.level, rate: q.rate, onLate: h => { if (tickWant && !tick) { tick = h; h.set(tickWant.level, tickWant.rate); } else h.stop(0); } });
    return tick;
  }
  if (q.cue === 'tick-off') { tickWant = null; if (tick) { tick.stop(0.4); tick = null; } return null; }
  return null;
}
export const cues = () => cued.slice();

/** THE ENGINE's EVENTS → the sounds in play (engine.js#step's `ev`): hop · a landing on a log · hit / out (+ the splash for the water / the edge) */
export function onEvent(e, rnd = Math.random) {
  if (e.e === 'hop') return play('hop', { rate: 1 + (rnd() * 2 - 1) * HOP_VARY.rate, vol: Math.pow(10, (rnd() * 2 - 1) * HOP_VARY.db / 20) });
  if (e.e === 'land' && e.on === 'wood') return play('land-wood', { rate: 1 + (rnd() * 2 - 1) * 0.04 });
  if (e.e === 'out') return e.cause === 'water' || e.cause === 'edge' ? play('splash') : e.cause === 'ufo' ? null : play('hit');
  return null;
}
/** the test hooks: what started on the audio context · what was asked for · the voices sounding */
export const played = () => log.slice();
export const wanted = () => asked.slice();
export const sounding = () => live.size;
export const totals = () => ({ ...total, by: { ...total.by } });
