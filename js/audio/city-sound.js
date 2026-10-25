// CITY 2.0 — THE CITY SOUNDS' player (Part 8a; docs/audio.md#the-city-sounds). Plays the slots of core/city-sounds.js:
//   citySound(slot, { gain, pan, rate, delay, take })  a one-shot: one of the slot's takes (weighted at random, never the same
//                                                        twice running) → a handle { slot, take, peak, stop(fade) } or null
//   cityLoop(slot, { gain, pan, fadeIn })               a bed while its thing lasts → { set({ gain, pan }, ramp), stop(fade) }
//   cityPreview(slot)                                   THE PREVIEW PANEL's ▶: a one-shot once / a loop ~8 s
// AN EMPTY SLOT IS SILENT: citySound → null, cityLoop → a handle whose methods do nothing — never an error, never a beep. Audio is
// polish: locked iOS audio, the Effects slider at 0 or Mute, a missing file, a decode error, a frozen or rebuilt context — all
// silent and harmless (a loop picks itself up again on the next context: audio/engine.js#onRebuild).
// Everything goes through ONE chain into the SFX bus (the Effects slider, Mute): CITY_GAIN → a soft PEAK CAP (nothing spikes)
// → sfxBus. The files are mono 32 kHz MP3s (scripts/add-city-sfx.py): decoded at 32 kHz when the browser lets an
// OfflineAudioContext do it (a third less memory than at the phone’s 48 kHz; a hum at 16 kHz), fetched only when first played.
// LOOPS are seamless whatever the MP3 decoder's padding: the file holds the loop + a tail (`xf` s of what followed it in the
// recording); each pass starts a fresh voice `loop` s after the last and crossfades the old voice's tail into it (equal power).
// The first pass starts at a random place in the loop and fades in.
import { getContext, getSfxBus, isUnlocked, onRebuild, clockFrozen } from './engine.js';
import { settings } from './settings.js';
import { slotOf, takesOf, pickTake, syncStart } from '../core/city-sounds.js';

/** one knob for the whole city's level (× each slot's gain × the caller's) — trim by ear */
export const CITY_GAIN = 1;
const CAP = 0.3;                       // the peak cap's ceiling into the SFX bus (linear: −10.5 dBFS)
const ONESHOT_MB = 10;                 // decoded one-shots kept (LRU) — the loops' buffers are kept while they play
const DECODE_RATE = 32000;

const audible = () => !settings.muted && (settings.sfx == null || settings.sfx > 0.01);
const now = c => c.currentTime;
/** a param set on a clock that may not be moving (a frozen graph / a fresh context: a ramp would never arrive — M4) */
function setP(p, v, c, ramp) {
  try {
    if (!ramp || clockFrozen() || c.currentTime === 0) { p.cancelScheduledValues(0); p.value = v; return; }
    p.cancelScheduledValues(c.currentTime); p.setValueAtTime(p.value, c.currentTime); p.linearRampToValueAtTime(v, c.currentTime + ramp);
  } catch { try { p.value = v; } catch { /* gone */ } }
}

// ---------------------------------------------------------------- the chain (per context)
let chain = null;
function out(c) {
  if (chain && chain.c === c) return chain.in;
  const g = c.createGain(); g.gain.value = CITY_GAIN;
  const N = 2049, curve = new Float32Array(N), k = CAP / 2;
  for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * 2 - 1, a = Math.abs(x); curve[i] = Math.sign(x) * (a < k ? a : k + (CAP - k) * Math.tanh((a - k) / (CAP - k))); }
  const ws = c.createWaveShaper(); ws.curve = curve;
  g.connect(ws).connect(getSfxBus());
  chain = { c, in: g };
  return g;
}
/** a panner into `into` → { node, set(pan, ramp) }: a StereoPannerNode, or (an engine without one) an equal-power PannerNode on a
 *  half circle in front of the listener; neither → straight through (centred) */
function panner(c, pan, into) {
  const v0 = Math.max(-1, Math.min(1, +pan || 0));
  try {
    if (c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = v0; p.connect(into);
      return { node: p, own: true, set: (v, ramp) => setP(p.pan, Math.max(-1, Math.min(1, v)), c, ramp) };
    }
    if (c.createPanner) {
      const p = c.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'linear'; p.rolloffFactor = 0;
      const place = (v, ramp) => {
        const a = Math.max(-1, Math.min(1, v)) * Math.PI / 2, x = Math.sin(a), z = -Math.cos(a);
        if (p.positionX) { setP(p.positionX, x, c, ramp); setP(p.positionZ, z, c, ramp); } else p.setPosition(x, 0, z);
      };
      place(v0, 0); p.connect(into);
      return { node: p, own: true, set: place };
    }
  } catch { /* fall through */ }
  return { node: into, set() {} };
}

// ---------------------------------------------------------------- the buffers
const bufs = new Map();               // file → { p: Promise<AudioBuffer|null>, mb, used, pins }
// OfflineAudioContexts that decode at a take's rate (32 kHz; a hum with nothing above ~6 kHz says r: 16000 — half the memory);
// false = not available here: decode on the live context (its own rate)
const decoders = new Map();
let noOffline = false;
function decodeWith(c, ab) {
  return new Promise((res, rej) => { try { const p = c.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } });
}
function decoderAt(rate) {
  if (noOffline) return null;
  if (!decoders.has(rate)) {
    let d = null;
    try { const O = typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext); d = O ? new O(1, 1, rate) : null; } catch { d = null; }
    if (!d) { noOffline = true; return null; }
    decoders.set(rate, d);
  }
  return decoders.get(rate);
}
function decode(ab, rate) {
  const live = getContext(), d = decoderAt(rate);
  if (!d) return decodeWith(live, ab);
  // (some engines detach the bytes even when a decode fails: keep a copy for the second try on the live context)
  const copy = ab.slice(0);
  return decodeWith(d, ab).catch(() => { noOffline = true; return decodeWith(live, copy); });
}
function load(take) {
  let e = bufs.get(take.f);
  if (!e) {
    e = { p: null, mb: 0, used: performance.now(), pins: 0 };
    e.p = fetch(new URL(`../../audio/city/${take.f}${take.v ? `?v=${take.v}` : ''}`, import.meta.url))
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then(ab => decode(ab, take.r || DECODE_RATE))
      .then(b => { e.mb = (b.length * b.numberOfChannels * 4) / 1e6; trim(); return b; })
      .catch(() => { bufs.delete(take.f); return null; });          // (a later call tries again)
    bufs.set(take.f, e);
  }
  e.used = performance.now();
  return e;
}
// the one-shots' decoded buffers: the least recently used go once they pass ONESHOT_MB (a pinned one — a loop's — stays)
function trim() {
  const free = [...bufs.entries()].filter(([, e]) => !e.pins && e.mb > 0).sort((a, b) => a[1].used - b[1].used);
  let mb = free.reduce((s, [, e]) => s + e.mb, 0);
  for (const [f, e] of free) { if (mb <= ONESHOT_MB) break; bufs.delete(f); mb -= e.mb; }
}

// ---------------------------------------------------------------- one-shots
const lastTake = new Map();
/** what the city played lately (newest last; tests + the panel): { slot, f, gain, at } */
export const cityLog = [];
/**
 * A one-shot from a slot. gain: × the slot's mix level; pan −1..1; rate: playback rate (+ a little pitch variety: ±jitter, 3 % by
 * default); delay: s from now; take: an index to force one.
 * sync (FP3 — a sound placed on a clock, whatever the wait for its file): { peakIn: () => s from NOW until the take's peak must
 * sound, pre: s of the take before its peak at most, fade, late, mark } — mark (8P): what lands on the clock instead of the peak:
 * 'hit' (the take's `hit` — a latch, a thud, a stop) or 'start' (the take's beginning) — evaluated when the buffer is ready (core/city-sounds.js#
 * syncStart): the start is delayed, or joined part-way with a fade, so the peak lands on time; too late → it stays silent. A synced
 * sound plays at exactly `rate` (no jitter: the peak's time is in the take's own seconds).
 * → { slot, take: the file, i, peak: s into it where it's loudest, hit (its marked moment, s, or null), dur, set({ gain, pan }, ramp), stop(fade), started(): the
 * performance.now() it began (0 = not yet), ended(), late() } or null (an empty slot, audio locked, effects off).
 */
export function citySound(slot, { gain = 1, pan = 0, rate = 1, delay = 0, take = null, jitter = 0.03, sync = null } = {}) {
  try {
    const s = slotOf(slot);
    if (!s || !takesOf(slot).length || !isUnlocked() || !audible()) return null;
    const pick = take != null && takesOf(slot)[take] ? { take: takesOf(slot)[take], i: take } : pickTake(slot, Math.random, lastTake.has(slot) ? lastTake.get(slot) : -1);
    if (!pick) return null;
    lastTake.set(slot, pick.i);
    const c = getContext(), t = pick.take, e = load(t);
    let v = s.gain * gain, p = pan;
    let src = null, g = null, pn = null, stopped = false, startedAt = 0, ended = false, late = false, r = rate;
    e.p.then(buf => {
      if (!buf || stopped || getContext() !== c) return;
      let at = Math.max(c.currentTime, c.currentTime + delay), off = 0, fade = 0.012;
      if (sync && typeof sync.peakIn === 'function') {
        // (POLISH 4: sync.at — a moment of the take's own, s in, placed on the clock instead of its measured peak: the jets' roar)
        const tk = sync.at != null ? { ...t, peak: sync.at } : sync.mark === 'hit' && t.hit != null ? { ...t, peak: t.hit } : sync.mark === 'start' ? { ...t, peak: 0 } : t;
        const plan = syncStart(tk, sync.peakIn(), sync);
        if (!plan) { late = true; ended = true; cityLog.push({ slot, f: t.f, late: true, at: performance.now() }); if (cityLog.length > 40) cityLog.shift(); return; }
        at = c.currentTime + plan.delay; off = plan.offset; fade = Math.max(0.012, plan.fade);
      } else r = rate * (1 - jitter + Math.random() * 2 * jitter);
      src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = r;
      g = c.createGain(); g.gain.value = 0;
      try { g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + fade); } catch { g.gain.value = v; }
      pn = panner(c, p, out(c));
      src.connect(g).connect(pn.node);
      src.onended = () => { ended = true; try { g.disconnect(); } catch { /* gone */ } try { if (pn.own) pn.node.disconnect(); } catch { /* gone */ } };
      src.start(at, off);
      startedAt = performance.now() + (at - c.currentTime) * 1000 - (off / r) * 1000;    // (as if the take had begun from its start)
      cityLog.push({ slot, f: t.f, gain: +v.toFixed(4), pan: +(+p).toFixed(2), off: +off.toFixed(2), wait: +(at - c.currentTime).toFixed(2), at: performance.now() }); if (cityLog.length > 40) cityLog.shift();
    }).catch(() => { ended = true; });
    return {
      slot, take: t.f, i: pick.i, peak: t.peak ?? 0, hit: t.hit ?? null, dur: t.d, t,
      /** follow the thing it belongs to: × the slot's level, the pan (ramped) — before it starts, its start takes them */
      set(o = {}, ramp = 0.25) {
        if (o.gain != null) v = s.gain * o.gain;
        if (o.pan != null) p = o.pan;
        if (!src || stopped) return;
        if (o.gain != null) setP(g.gain, v, c, ramp);
        if (o.pan != null) pn.set(p, ramp);
      },
      started: () => startedAt,
      ended: () => ended || stopped,
      late: () => late,
      rate: () => r,
      stop(fade = 0.6) {
        stopped = true;
        if (!src) return;
        try { setP(g.gain, 0, c, fade); src.stop(c.currentTime + fade + 0.05); } catch { /* gone */ }
      },
    };
  } catch { return null; }
}

/** fetch + decode a take ahead of its moment (the motorcar's next pass: its sound then starts on time) → true when asked */
export function cityPrefetch(slot, i = 0) {
  try {
    const t = takesOf(slot)[i];
    if (!t || !isUnlocked() || !audible()) return false;
    load(t);
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------- loops
const loops = new Set();
let pumpT = 0;
const SILENT = Object.freeze({ silent: true, slot: '', set() {}, stop() {}, playing: () => false, debug: () => null });

/**
 * A bed while its thing lasts: the slot's loop (its first take), started at a random place with a fade-in, crossfaded into itself.
 * → { set({ gain, pan }, ramp s), stop(fade s), playing(), debug() }; an EMPTY slot → a handle that does nothing.
 */
export function cityLoop(slot, { gain = 1, pan = 0, fadeIn = 2, start = null } = {}) {
  const s = slotOf(slot), t = takesOf(slot)[0];
  if (!s || !t || !(t.loop > 0)) return { ...SILENT, slot };
  // (start: s into the loop for the first pass — tests put the seam a few seconds away; default a random place)
  const L = { slot, s, t, gain, pan, fadeIn, start, want: true, c: null, outG: null, pn: null, voices: [], next: 0, entry: null, started: 0 };
  loops.add(L);
  if (!pumpT) pumpT = setInterval(pump, 400);
  pumpOne(L);
  return {
    slot,
    set(o = {}, ramp = 0.8) {
      if (!L.want) return;
      if (o.gain != null) L.gain = o.gain;
      if (o.pan != null) L.pan = o.pan;
      if (L.outG) setP(L.outG.gain, L.s.gain * L.gain, L.c, ramp);
      if (L.pn) setP(L.pn.pan, Math.max(-1, Math.min(1, L.pan)), L.c, ramp);
    },
    stop(fade = 2) { stopLoop(L, fade); },
    playing: () => L.voices.length > 0,
    debug: () => ({ slot, gain: +(L.s.gain * L.gain).toFixed(4), pan: +L.pan.toFixed(2), voices: L.voices.length, on: L.voices.length > 0, file: t.f, lp: L.lp ? L.s.lp : 0 }),
  };
}
function stopLoop(L, fade) {
  if (!L.want) return;
  L.want = false; loops.delete(L);
  // (a loop's buffer is big — a minute of audio: freed once nothing plays it; the HTTP cache has the file if it's wanted again)
  if (L.entry) { L.entry.pins = Math.max(0, L.entry.pins - 1); L.entry.used = performance.now(); if (!L.entry.pins && bufs.get(L.t.f) === L.entry) bufs.delete(L.t.f); }
  const c = L.c, og = L.outG, lp = L.lp, vs = L.voices.slice();
  L.voices = [];
  if (c && og) {
    setP(og.gain, 0, c, fade);
    setTimeout(() => { for (const v of vs) { try { v.src.stop(); } catch { /* gone */ } } try { og.disconnect(); } catch { /* gone */ } try { if (lp) lp.disconnect(); } catch { /* gone */ } }, fade * 1000 + 120);
  }
  if (!loops.size) { clearInterval(pumpT); pumpT = 0; }
  trim();
}
function drop(L) {
  // (a context gone — rebuilt / closed — or the effects switched off: its nodes go, the loop restarts with a fade when it can)
  for (const v of L.voices) { try { v.src.stop(); } catch { /* gone */ } }
  try { if (L.outG) L.outG.disconnect(); } catch { /* gone */ }
  try { if (L.lp) L.lp.disconnect(); } catch { /* gone */ }
  L.voices = []; L.outG = null; L.pn = null; L.lp = null; L.c = null;
}
function pump() { for (const L of [...loops]) pumpOne(L); }
function pumpOne(L) {
  try {
    if (!L.want) return;
    const c = getContext();
    if (!c || !isUnlocked() || !audible()) { if (L.voices.length && (!c || c !== L.c || !audible())) drop(L); return; }
    if (L.c && L.c !== c) drop(L);
    if (!L.entry) { if (performance.now() < (L.retryAt || 0)) return; L.entry = load(L.t); L.entry.pins++; }
    L.entry.used = performance.now();
    if (!L.buf) {
      if (!L.waiting) {
        L.waiting = true;
        const e = L.entry;
        e.p.then(b => { L.waiting = false; if (L.entry !== e) return; if (b) { L.buf = b; pumpOne(L); } else { e.pins = Math.max(0, e.pins - 1); L.entry = null; L.retryAt = performance.now() + 30000; } });   // (a failed file: tried again in 30 s)
      }
      return;
    }
    if (clockFrozen()) return;                                      // (a dead graph: nothing would sound; the rebuild restarts it)
    if (!L.outG) {
      L.c = c;
      L.outG = c.createGain(); L.outG.gain.value = L.s.gain * L.gain;
      L.pn = c.createStereoPanner ? c.createStereoPanner() : null;
      // (FP: a slot's `lp` — the water's highs softened, heard from the promenade rather than at the water's edge)
      let tail = L.outG;
      L.lp = null;
      if (L.s.lp) { try { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = L.s.lp; f.Q.value = 0.5; L.outG.connect(f); tail = f; L.lp = f; } catch { tail = L.outG; } }
      if (L.pn) { L.pn.pan.value = Math.max(-1, Math.min(1, L.pan)); tail.connect(L.pn).connect(out(c)); } else tail.connect(out(c));
      // the first pass: a random place in the loop, faded in
      const t0 = c.currentTime + 0.05, off = L.start != null ? Math.max(0, Math.min(L.t.loop - 0.5, L.start)) : Math.random() * L.t.loop * 0.9;
      L.start = null;
      voice(L, t0, off, Math.max(0.1, Math.min(L.fadeIn, L.t.loop - off - 0.1)), 'in');     // (the fade-in done before its seam: curves never overlap)
      L.next = t0 + (L.t.loop - off);
      L.started = performance.now();
    }
    // the next passes, scheduled ~2.5 s ahead (the context's own clock: exact, whatever the timers do)
    const xf = Math.min(L.t.xf, Math.max(0.2, L.buf.duration - L.t.loop - 0.02));
    if (c.currentTime > L.next + xf) { drop(L); pumpOne(L); return; }     // (fell behind — a long stall: start over, faded in)
    while (c.currentTime > L.next - 2.5) {
      const at = L.next;
      for (const v of L.voices) if (!v.out) { fadeOut(v, at, xf); v.out = true; }
      voice(L, at, 0, xf, 'xf');
      L.next = at + L.t.loop;
    }
    L.voices = L.voices.filter(v => !v.ended);
  } catch { /* polish: never throw */ }
}
const EQ = n => { const a = new Float32Array(n), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1); a[i] = Math.sin(x * Math.PI / 2); b[i] = Math.cos(x * Math.PI / 2); } return { up: a, down: b }; };
const CURVES = EQ(33);
function voice(L, at, off, fade, kind) {
  const c = L.c, src = c.createBufferSource(), g = c.createGain();
  src.buffer = L.buf;
  g.gain.value = 0;
  try { g.gain.setValueCurveAtTime(CURVES.up, at, Math.max(0.05, fade)); }
  catch { try { g.gain.linearRampToValueAtTime(1, at + fade); } catch { g.gain.value = 1; } }
  src.connect(g).connect(L.outG);
  const v = { src, g, out: false, ended: false };
  src.onended = () => { v.ended = true; try { g.disconnect(); } catch { /* gone */ } };
  src.start(at, off);
  L.voices.push(v);
}
function fadeOut(v, at, xf) {
  try { v.g.gain.setValueCurveAtTime(CURVES.down, at, xf); v.src.stop(at + xf + 0.05); }
  catch { try { v.src.stop(at + xf); } catch { /* gone */ } }
}
// a new context (audio/engine.js rebuilt it inside a tap): every loop starts again on it, faded in
onRebuild(() => { for (const L of loops) drop(L); setTimeout(pump, 50); });

// ---------------------------------------------------------------- THE PREVIEW PANEL
let preview = null;
/** ▶ in the panel's SOUNDS: a one-shot plays once; a loop ~8 s (1 s in, 1.5 s out) — at twice its city level so it's heard
 *  over the music (the city's own level is the slot's gain). → { ok, why } */
export function cityPreview(slot, { seconds = 8 } = {}) {
  const s = slotOf(slot);
  if (!s) return { ok: false, why: 'no such slot' };
  if (!takesOf(slot).length) return { ok: false, why: 'empty' };
  if (!isUnlocked()) return { ok: false, why: 'tap the city first (audio locked)' };
  if (!audible()) return { ok: false, why: 'effects are off / muted' };
  if (preview) { preview.stop(0.3); preview = null; }
  if (s.kind === 'once') { const h = citySound(slot, { gain: 2 }); preview = h; return { ok: !!h, why: h ? h.take : 'could not play' }; }
  const h = cityLoop(slot, { gain: 2, fadeIn: 1 });
  preview = h;
  setTimeout(() => { if (preview === h) preview = null; h.stop(1.5); }, Math.max(2, seconds - 1.5) * 1000);
  return { ok: true, why: takesOf(slot)[0].f };
}

/** the player's state (the panel, the tests): the loops running, the decoded MB, the last one-shots */
export function citySoundsDebug() {
  const mb = [...bufs.values()].reduce((s, e) => s + e.mb, 0);
  return { loops: [...loops].map(L => ({ slot: L.slot, gain: +(L.s.gain * L.gain).toFixed(4), pan: +L.pan.toFixed(2), voices: L.voices.length, ready: !!L.buf, lp: L.lp ? L.s.lp : 0 })), mb: +mb.toFixed(2), files: [...bufs.keys()], log: cityLog.slice(-8), decodeRate: noOffline ? 'context' : [...decoders.keys()].join('/') || DECODE_RATE };
}
