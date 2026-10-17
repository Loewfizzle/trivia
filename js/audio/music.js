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
  spy1: 'spy1', spy2: 'spy2', spy3: 'spy3',
};
export const TRACK_IDS = Object.keys(FILES);
// Playlists: ask for the list's id and its tracks play in order, crossfading into the next one at
// each track's end (then back to the first). The position survives re-asks, so a game that keeps
// asking for the same list never restarts it.
const PLAYLISTS = { spy: ['spy1', 'spy2', 'spy3'] };
const listPos = {}; // list id -> index of the track playing / next to play
const listOf = id => (PLAYLISTS[id] ? id : null);
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
let duckLevel = 1;        // 1 = full; duckMusic() lowers the current track (e.g. a tense reveal)

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
  fade(voice, duckLevel, XFADE);
  const prev = current;
  current = { id, voice, list: desired && listOf(desired.id) };
  if (current.list) prefetch(nextInList(current.list, id));
  if (prev) stopVoice(prev.voice, XFADE);
}

// The playlist track to play now: the saved position, skipping missing files.
function listTrack(list) {
  const ids = PLAYLISTS[list];
  for (let k = 0; k < ids.length; k++) {
    const i = ((listPos[list] || 0) + k) % ids.length;
    if (status[ids[i]] !== 'missing') { listPos[list] = i; return ids[i]; }
  }
  return null;
}
function nextInList(list, id) {
  const ids = PLAYLISTS[list];
  for (let k = 1; k <= ids.length; k++) {
    const nid = ids[(ids.indexOf(id) + k) % ids.length];
    if (status[nid] !== 'missing') return nid;
  }
  return id;
}

function resolveTrack() {
  if (!desired) return null;
  if (PLAYLISTS[desired.id]) {
    const t = listTrack(desired.id);
    if (t) return t;
  } else if (status[desired.id] !== 'missing') return desired.id;
  if (desired.fallback && status[desired.fallback] !== 'missing') return desired.fallback;
  return null;
}

function apply() {
  if (!isUnlocked() || !visible || !voices.length) return;
  const id = resolveTrack();
  if (current && current.id === id) return; // already playing: never restart
  // a playlist keeps going on its own (watchLoop moves it to the next track)
  if (current && current.list && desired && current.list === desired.id && PLAYLISTS[current.list].includes(current.id)) return;
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
  // a playlist moves on to its next track; anything else loops into a fresh copy of itself
  const list = current.list;
  const nid = list ? nextInList(list, id) : id;
  const next = freeVoice(voice);
  next.el.preload = 'auto';
  if (next.id !== nid || !next.el.src.includes(FILES[nid])) next.el.src = urlFor(nid);
  next.id = nid;
  try { next.el.currentTime = 0; } catch { /* fine */ }
  next.gain.gain.value = 0;
  next.el.play().catch(() => {});
  fade(next, duckLevel, LOOP_XFADE);
  current = { id: nid, voice: next, list };
  positions[id] = 0;
  positions[nid] = 0;
  if (list) { listPos[list] = PLAYLISTS[list].indexOf(nid); prefetch(nextInList(list, nid)); }
  stopVoice(voice, LOOP_XFADE);
}

/** Ask for a track. Same track = no-op (keeps playing seamlessly). */
export function playMusic(id, fallback = null) {
  if (desired && desired.id === id && desired.fallback === fallback) { apply(); return; }
  if (!desired || desired.id !== id) duckLevel = 1; // a new track never starts ducked
  desired = id ? { id, fallback } : null;
  // Nothing can play before the first tap, so don't spend the player's bandwidth until then.
  if (isUnlocked()) { if (id) prefetch(id); if (fallback) prefetch(fallback); }
  apply();
}

/** Warm the HTTP cache for a track (called when a game is chosen). */
export function prefetch(id) {
  if (PLAYLISTS[id]) { prefetch(PLAYLISTS[id][listPos[id] || 0]); return; }
  if (!FILES[id] || prefetching[id] || status[id] === 'missing') return;
  prefetching[id] = fetch(urlFor(id), { priority: 'low' })
    .then(r => { status[id] = r.ok ? 'ok' : 'missing'; return r.ok ? r.blob() : null; })
    .then(() => apply())
    .catch(() => { delete prefetching[id]; });
}

/** Lower (or restore) the current music: level 0..1 over `seconds`. Reset when the track changes. */
export function duckMusic(level, seconds = 0.6) {
  const to = Math.max(0, Math.min(1, level));
  if (to === duckLevel) return;
  duckLevel = to;
  if (current && getContext()) fade(current.voice, duckLevel, seconds);
}

export function musicDebug() {
  return {
    desired: desired && desired.id,
    playing: current && current.id,
    list: current && current.list,
    duck: duckLevel,
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
  else { current.voice.el.play().catch(() => {}); fade(current.voice, duckLevel, 0.6); apply(); }
});
setInterval(watchLoop, 200);
