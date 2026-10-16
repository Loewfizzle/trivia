// Background music: lazy-loaded MP3s, ~1.5s crossfades between tracks, and
// seamless looping by crossfading each track into a fresh copy of itself just
// before it ends (MP3 encoder padding makes plain `loop` click/gap).
//
// Tracks play through a small pool of <audio> "voices" routed into Web Audio
// (iOS ignores element.volume, so gain must come from Web Audio). The pool is
// activated inside the first user gesture, which lets iOS start them later
// without another tap. A missing file just marks the track missing — the game
// stays silent (or uses the fallback track) with no errors.
import { getContext, getMusicBus, onUnlock, onVisibility, isUnlocked, onResume } from './engine.js';

const FILES = {
  menu: 'menu', cipher: 'cipher-breach', signal: 'last-signal',
  overclock: 'overclock', bluff: 'neural-bluff', victory: 'victory',
  'golf-rooftops': 'golf-rooftops', 'golf-cyber': 'golf-cyber', 'golf-arcade': 'golf-arcade',
};
export const TRACK_IDS = Object.keys(FILES);
const XFADE = 1.5;        // seconds, between tracks
const LOOP_XFADE = 1.8;   // seconds, track into itself
const urlFor = id => new URL(`../../audio/music/${FILES[id]}.mp3`, import.meta.url).href;

const status = {};        // id -> 'ok' | 'missing' (unknown if absent)
const positions = {};     // id -> seconds to resume from
const prefetching = {};
let voices = [];
let current = null;       // { id, voice }
let desired = null;       // { id, fallback }
let visible = true;

function silentWavUrl() {
  const n = 800;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function makeVoices() {
  const ctx = getContext();
  if (!ctx || voices.length) return;
  const silent = silentWavUrl();
  for (let i = 0; i < 3; i++) {
    const el = new Audio();
    el.preload = 'none';
    el.crossOrigin = 'anonymous';
    el.setAttribute('playsinline', '');
    const gain = ctx.createGain();
    gain.gain.value = 0;
    try { ctx.createMediaElementSource(el).connect(gain); } catch { continue; }
    gain.connect(getMusicBus());
    const voice = { el, gain, id: null, busyUntil: 0 };
    el.addEventListener('error', () => {
      if (voice.id && el.src.includes('/audio/music/')) { status[voice.id] = 'missing'; voice.id = null; if (current && current.voice === voice) current = null; apply(); }
    });
    // Activate the element inside the unlock gesture (iOS), then park it.
    el.src = silent;
    el.play().then(() => el.pause()).catch(() => {});
    voices.push(voice);
  }
}

function freeVoice(exclude) {
  const now = getContext().currentTime;
  return voices.find(v => v !== exclude && (!current || v !== current.voice) && v.busyUntil <= now)
    || voices.find(v => v !== exclude && (!current || v !== current.voice))
    || voices[0];
}

function fade(voice, to, seconds) {
  const ctx = getContext();
  const g = voice.gain.gain;
  const t = ctx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(to, t + seconds);
}

function stopVoice(voice, seconds) {
  if (!voice) return;
  fade(voice, 0, seconds);
  voice.busyUntil = getContext().currentTime + seconds + 0.1;
  const id = voice.id;
  setTimeout(() => {
    if (current && current.voice === voice) return; // re-used meanwhile
    if (id && voice.id === id) positions[id] = voice.el.currentTime || 0;
    voice.el.pause();
  }, seconds * 1000 + 80);
}

function startTrack(id) {
  const voice = freeVoice();
  if (voice.id !== id || !voice.el.src.includes(FILES[id])) {
    voice.el.preload = 'auto';
    voice.el.src = urlFor(id);
  }
  voice.id = id;
  const at = positions[id] || 0;
  try { voice.el.currentTime = at; } catch { /* not seekable yet */ }
  voice.gain.gain.value = 0;
  voice.el.play().then(() => { status[id] = status[id] || 'ok'; }).catch(() => {});
  fade(voice, 1, XFADE);
  const prev = current;
  current = { id, voice };
  if (prev) stopVoice(prev.voice, XFADE);
}

function resolveTrack() {
  if (!desired) return null;
  if (status[desired.id] !== 'missing') return desired.id;
  if (desired.fallback && status[desired.fallback] !== 'missing') return desired.fallback;
  return null;
}

function apply() {
  if (!isUnlocked() || !visible || !voices.length) return;
  const id = resolveTrack();
  if (current && current.id === id) return; // already playing: never restart
  if (!id) { if (current) { stopVoice(current.voice, XFADE); current = null; } return; }
  startTrack(id);
}

// Loop watcher: crossfade into a fresh copy before the end.
let lastNudge = 0;
function watchLoop() {
  if (!current || !visible) return;
  const { voice, id } = current;
  const el = voice.el;
  // Self-heal: the OS paused our track behind our back (iOS keyboard, app switch, call).
  if (el.paused && isUnlocked() && performance.now() - lastNudge > 1500) {
    lastNudge = performance.now();
    el.play().catch(() => {});
    return;
  }
  if (!el.duration || !isFinite(el.duration) || el.paused) return;
  if (el.currentTime < el.duration - LOOP_XFADE - 0.15) return;
  const next = freeVoice(voice);
  next.el.preload = 'auto';
  if (next.id !== id || !next.el.src.includes(FILES[id])) next.el.src = urlFor(id);
  next.id = id;
  try { next.el.currentTime = 0; } catch { /* fine */ }
  next.gain.gain.value = 0;
  next.el.play().catch(() => {});
  fade(next, 1, LOOP_XFADE);
  current = { id, voice: next };
  positions[id] = 0;
  stopVoice(voice, LOOP_XFADE);
}

/** Ask for a track. Same track = no-op (keeps playing seamlessly). */
export function playMusic(id, fallback = null) {
  if (desired && desired.id === id && desired.fallback === fallback) { apply(); return; }
  desired = id ? { id, fallback } : null;
  // Nothing can play before the first tap, so don't spend the player's bandwidth until then.
  if (isUnlocked()) { if (id) prefetch(id); if (fallback) prefetch(fallback); }
  apply();
}

/** Warm the HTTP cache for a track (called when a game is chosen). */
export function prefetch(id) {
  if (!FILES[id] || prefetching[id] || status[id] === 'missing') return;
  prefetching[id] = fetch(urlFor(id), { priority: 'low' })
    .then(r => { status[id] = r.ok ? 'ok' : 'missing'; return r.ok ? r.blob() : null; })
    .then(() => apply())
    .catch(() => { delete prefetching[id]; });
}

export function musicDebug() {
  return {
    desired: desired && desired.id,
    playing: current && current.id,
    status: { ...status },
    voices: voices.map(v => ({ id: v.id, gain: +v.gain.gain.value.toFixed(3), paused: v.el.paused, t: +(v.el.currentTime || 0).toFixed(2) })),
  };
}

onUnlock(() => {
  makeVoices();
  if (desired) { prefetch(desired.id); if (desired.fallback) prefetch(desired.fallback); }
  apply();
});
// The context came back (often only on the next tap after iOS refused a resume): the
// current voice may have been paused by the OS meanwhile, so start it again.
onResume(() => {
  if (!visible) return;
  if (current && current.voice.el.paused) current.voice.el.play().catch(() => {});
  apply();
});
onVisibility(v => {
  visible = v;
  if (!current) { apply(); return; }
  if (!v) { positions[current.id] = current.voice.el.currentTime || 0; voices.forEach(x => x.el.pause()); }
  else { current.voice.el.play().catch(() => {}); fade(current.voice, 1, 0.6); apply(); }
});
setInterval(watchLoop, 200);
