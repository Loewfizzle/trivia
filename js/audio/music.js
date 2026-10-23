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
import { musicUrl } from './music-url.js';

const FILES = {
  menu1: 'menu', menu2: 'menu2', menu3: 'menu3', menu4: 'menu4', cipher: 'cipher-breach', signal: 'last-signal',
  overclock: 'overclock', bluff: 'neural-bluff',
  victory1: 'victory', victory2: 'victory2', victory3: 'victory3', victory4: 'victory4',
  'golf-rooftops': 'golf-rooftops', 'golf-cyber': 'golf-cyber', 'golf-arcade': 'golf-arcade',
  spy1: 'spy1', spy2: 'spy2', spy3: 'spy3',
  high1: 'high1', high2: 'high2', high3: 'high3',
  run1: 'run1', run2: 'run2', run3: 'run3', run4: 'run4',
};
export const TRACK_IDS = Object.keys(FILES);
/** Add tracks at run time (MOOD MUSIC registers 'm:<file>' ids from data/mood-music.json). */
export function registerTracks(map) { Object.assign(FILES, map); }
// Lists whose next song is chosen by a function, when it's needed (≈ 45 s before the current song ends, so a change of
// mood never cuts a song off: it finishes, then the next comes from the new mood). provider(prevId) -> next track id.
const PROVIDERS = {};
export function setListProvider(id, fn) { PROVIDERS[id] = fn; }
// Playlists: ask for the list's id and its tracks play in order, crossfading into the next one at
// each track's end (then back to the first). The position survives re-asks, so a game that keeps
// asking for the same list never restarts it.
// 'menu' (title, setup, lobby) is the four menu tracks in a fresh random order on every visit, so it never goes
// stale; it keeps its place while you play a game and continues from there in the lobby.
const shuffled = a => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
// 'victory' (every podium) is four short fanfares, shuffled per visit; each new podium moves on to the next one.
const PLAYLISTS = { spy: ['spy1', 'spy2', 'spy3'], menu: shuffled(['menu1', 'menu2', 'menu3', 'menu4']), victory: shuffled(['victory1', 'victory2', 'victory3', 'victory4']),
  gridlock: ['spy1', 'spy2', 'spy3', 'signal'],
  stakes: ['high1', 'high2', 'high3'],
  rum: ['run1', 'run2', 'run3', 'run4'] };   // RUMRUNNER: a seeded order per room (setPlaylist), each once before any repeats   // HIGH STAKES: a seeded order per room (setPlaylist), each once before any repeats   // GRIDLOCK: re-ordered per room by the view (setPlaylist)
const FRESH_EACH_TIME = new Set(['victory']);
const ONE_SHOT = new Set(['victory']);         // lists whose track plays once and then leaves silence (a fanfare)   // lists that start on their next track whenever they're asked for again
const listPlayed = {};
const listPos = {}; // list id -> index of the track playing / next to play
const XFADE = 1.5;        // seconds, between tracks
const LOOP_XFADE = 1.8;   // seconds, track into itself
// Browsers keep audio for a week (vercel.json). When a file is REPLACED under the same name, bump its number here so every
// phone fetches the new one instead of playing its cached copy.
const REV = { menu: 2, menu3: 2, menu4: 2 };
const urlFor = id => musicUrl(FILES[id], REV[FILES[id]] ? `?v=${REV[FILES[id]]}` : '');

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

// one low-pass between the voices and the music bus: filterMusic() pulls it down for a moment (GRIDLOCK's impacts)
let toneNode = null;
function tone() {
  if (toneNode) return toneNode;
  const ctx = getContext();
  toneNode = ctx.createBiquadFilter();
  toneNode.type = 'lowpass';
  toneNode.frequency.value = 20000;
  toneNode.Q.value = 0.5;
  toneNode.connect(getMusicBus());
  return toneNode;
}

/** Low-pass the music to `hz` over `seconds` (20000 = open). */
export function filterMusic(hz, seconds = 0.4) {
  const ctx = getContext();
  if (!ctx || !toneNode) return;
  toneNode.frequency.cancelScheduledValues(ctx.currentTime);
  toneNode.frequency.setTargetAtTime(Math.max(200, Math.min(20000, hz)), ctx.currentTime, Math.max(0.02, seconds / 3));
}

/** Re-order a playlist (e.g. a seeded order every phone in a room shares). Keeps the track playing if it is in the new list. */
export function setPlaylist(id, ids) {
  if (!PLAYLISTS[id] || !ids || !ids.length) return;
  PLAYLISTS[id] = ids.slice();
  if (current && current.list === id) listPos[id] = Math.max(0, ids.indexOf(current.id));
  else if (!(id in listPos)) listPos[id] = 0;
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
    gain.connect(tone());
    const voice = { el, gain, id: null, busyUntil: 0 };
    el.addEventListener('error', () => {
      if (voice.id && !el.src.startsWith('blob:')) { status[voice.id] = 'missing'; voice.id = null; if (current && current.voice === voice) current = null; apply(); }
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

function startTrack(id, xf = XFADE) {
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
  fade(voice, duckLevel, xf);
  const prev = current;
  current = { id, voice, list: listFor(id) };
  if (current.list && !PROVIDERS[current.list]) prefetch(nextInList(current.list, id));
  if (prev) stopVoice(prev.voice, xf);
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
  if (PROVIDERS[desired.id]) {
    if (current && current.list === desired.id) return current.id;
    for (let k = 0; k < 6; k++) { const t = PROVIDERS[desired.id](null); if (t && status[t] !== 'missing') return t; }
    return null;
  }
  if (PLAYLISTS[desired.id]) {
    const t = listTrack(desired.id);
    if (t) return t;
  } else if (FILES[desired.id] && status[desired.id] !== 'missing') return desired.id;
  // a fallback can be a playlist too (NEON PAR falls back to the menu music)
  if (desired.fallback && PLAYLISTS[desired.fallback]) return listTrack(desired.fallback);
  if (desired.fallback && status[desired.fallback] !== 'missing') return desired.fallback;
  return null;
}
// the playlist a resolved track belongs to (the asked-for list, or a playlist fallback)
const listFor = id => (desired && PROVIDERS[desired.id] ? desired.id : desired && PLAYLISTS[desired.id] && PLAYLISTS[desired.id].includes(id) ? desired.id
  : desired && desired.fallback && PLAYLISTS[desired.fallback] && PLAYLISTS[desired.fallback].includes(id) ? desired.fallback : null);

// a one-off fade length for the next stop (the lobby's handoff to the room's synced song: a real crossfade, not a cut)
let nextStopFade = 0;
export function handoffFade(seconds) { nextStopFade = seconds; }

function apply() {
  if (!isUnlocked() || !visible || !voices.length) return;
  const id = resolveTrack();
  if (current && current.id === id) return; // already playing: never restart
  // a playlist keeps going on its own (watchLoop moves it to the next track)
  if (current && current.list && desired && current.list === desired.id && (PROVIDERS[current.list] || PLAYLISTS[current.list].includes(current.id))) return;
  if (!id) { if (current) { stopVoice(current.voice, nextStopFade || XFADE); nextStopFade = 0; current = null; } return; }
  startTrack(id);
}

// Loop watcher: crossfade into a fresh copy before the end.
let lastNudge = 0;
function watchLoop() {
  if (!current || !visible) return;
  const { voice, id } = current;
  const el = voice.el;
  // Self-heal: the OS paused our track behind our back (iOS keyboard, app switch, call).
  if (current.ended) return;              // a one-shot fanfare that has finished: stay quiet
  if (el.paused && !el.ended && isUnlocked() && performance.now() - lastNudge > 1500) {
    lastNudge = performance.now();
    el.play().catch(() => {});
    return;
  }
  if (!el.duration || !isFinite(el.duration) || el.paused) return;
  if (current.list && PROVIDERS[current.list] && !current.next && el.currentTime > el.duration - 45) {
    for (let k = 0; k < 6 && !current.next; k++) { const t = PROVIDERS[current.list](id); if (t && status[t] !== 'missing') current.next = t; }
    if (current.next) prefetch(current.next);
  }
  if (el.currentTime < el.duration - LOOP_XFADE - 0.15) return;
  // a playlist moves on to its next track; anything else loops into a fresh copy of itself
  const list = current.list;
  if (list && ONE_SHOT.has(list)) { current.ended = true; return; }
  const nid = list && PROVIDERS[list] ? (current.next || PROVIDERS[list](id) || id) : list ? nextInList(list, id) : id;
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
  if (list && PLAYLISTS[list]) { listPos[list] = PLAYLISTS[list].indexOf(nid); prefetch(nextInList(list, nid)); }
  stopVoice(voice, LOOP_XFADE);
}

/**
 * A FORCED change of mood (the listener picked one, the party starts): leave the song now for the provider's next one, a smooth
 * crossfade of `seconds` (never a cut) — after the new song has downloaded, so the crossfade is into sound, not silence. A natural
 * change (evening → late night) never calls this: the song finishes and the next comes from the new mood (watchLoop). Resolves
 * true when it switched. Only a provider list (the mood music outside a room) can; a lobby's queue is the host's.
 */
export async function switchNow(seconds = 4) {
  if (!current || !current.list || !PROVIDERS[current.list] || current.ended || !isUnlocked()) return false;
  const from = current, list = current.list;
  let t = null;
  for (let k = 0; k < 6 && !t; k++) { const c = PROVIDERS[list](from.id); if (c && c !== from.id && status[c] !== 'missing') t = c; }
  if (!t) return false;
  const warm = prefetch(t, true);
  if (warm) await Promise.race([warm, new Promise(r => setTimeout(r, 6000))]);
  if (current !== from || !desired || desired.id !== list || status[t] === 'missing') return false;   // moved on meanwhile
  positions[t] = 0;
  startTrack(t, seconds);
  setTimeout(() => { positions[from.id] = 0; }, seconds * 1000 + 300);     // (the song we left starts from its top next time)
  return true;
}

/** Ask for a track. Same track = no-op (keeps playing seamlessly). */
export function playMusic(id, fallback = null) {
  if (desired && desired.id === id && desired.fallback === fallback) { apply(); return; }
  if (!desired || desired.id !== id) {
    duckLevel = 1; // a new track never starts ducked
    if (FRESH_EACH_TIME.has(id)) { if (listPlayed[id]) listPos[id] = ((listPos[id] || 0) + 1) % PLAYLISTS[id].length; listPlayed[id] = true; }
  }
  desired = id ? { id, fallback } : null;
  // Nothing can play before the first tap, so don't spend the player's bandwidth until then.
  if (isUnlocked()) { if (id) prefetch(id); if (fallback) prefetch(fallback); }
  apply();
}

/** Warm the HTTP cache for a track (called when a game is chosen). */
export function prefetch(id, wait = false) {
  if (PROVIDERS[id]) return null;
  if (PLAYLISTS[id]) return prefetch(PLAYLISTS[id][listPos[id] || 0], wait);
  if (!FILES[id] || status[id] === 'missing') return null;
  if (prefetching[id]) return wait ? prefetching[id] : null;
  prefetching[id] = fetch(urlFor(id), { priority: 'low' })
    .then(r => { status[id] = r.ok ? 'ok' : 'missing'; return r.ok ? r.blob() : null; })
    .then(() => apply())
    .catch(() => { delete prefetching[id]; });
  return wait ? prefetching[id] : null;
}

/** Lower (or restore) the current music: level 0..1 over `seconds`. Reset when the track changes. */
export function duckMusic(level, seconds = 0.6) {
  const to = Math.max(0, Math.min(1, level));
  if (to === duckLevel) return;
  duckLevel = to;
  if (current && getContext()) fade(current.voice, duckLevel, seconds);
}

/** Test hook: jump the playing track to `secondsFromEnd` before its end. */
export function musicSeek(secondsFromEnd) { if (current && current.voice.el.duration) current.voice.el.currentTime = Math.max(0, current.voice.el.duration - secondsFromEnd); }

/** The MOOD MUSIC song sounding right now on this phone: { id (without 'm:'), at (s), dur (s) } — or null (music off, CLASSIC,
 *  not unlocked yet, a game's music, paused). The lobby uses it to carry the host's song into the room unchanged. */
export function nowPlaying() {
  if (!current || !current.id || !current.id.startsWith('m:') || current.ended) return null;
  const el = current.voice.el;
  if (!el || el.paused || !isFinite(el.currentTime)) return null;
  return { id: current.id.slice(2), at: el.currentTime || 0, dur: isFinite(el.duration) && el.duration > 0 ? el.duration : 0 };
}

export function musicDebug() {
  return {
    desired: desired && desired.id,
    playing: current && current.id,
    list: current && current.list,
    next: current && current.next,
    at: current ? +(current.voice.el.currentTime || 0).toFixed(1) : 0,
    dur: current ? +(current.voice.el.duration || 0).toFixed(1) : 0,
    menuOrder: PLAYLISTS.menu.slice(),
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
