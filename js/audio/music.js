// Background music: lazy-loaded MP3s, ~1.5s crossfades between tracks, and
// seamless looping by crossfading each track into a fresh copy of itself just
// before it ends (MP3 encoder padding makes plain `loop` click/gap).
//
// Tracks play through a small pool of <audio> "voices" routed into Web Audio
// (iOS ignores element.volume, so gain must come from Web Audio). The pool is
// activated inside the first user gesture, which lets iOS start them later
// without another tap. A missing file just marks the track missing — the game
// stays silent (or uses the fallback track) with no errors.
//
// THE DIRECT PATH (M4, the owner's iPhone — docs/audio.md#m4): when the graph is dead (a 'running' context whose clock never moves,
// even a fresh one made inside a tap — iOS kept the audio session inactive), the song plays through ONE MORE <audio> element that is
// NOT connected to Web Audio: iOS's own media pipeline plays it, so the music never stays silent because the graph is stuck. It is
// activated (the silent wav) inside the first gesture like the voices, so it may start later without a tap — the moment the clock
// is seen frozen. On it: no crossfades (a cut between songs), the volume slider / ducks only where an element's volume works (not
// iOS), mute + MUSIC OFF mute the element; the beat follows the song's grid (the kick listener hears nothing). At the next tap with
// the graph seen running for 2 s the song moves back onto a Web Audio voice at its place.
import { getContext, getMusicBus, onUnlock, onVisibility, isUnlocked, canStart, inGesture, clockFrozen, graphOk, onResume, onRebuild, onGesture, onFrozen, tapFoundSilence, audioHealth, audioLog, audioEvents } from './engine.js';
import { settings, onSettings } from './settings.js';
import { musicUrl } from './music-url.js';
import { createTapeStop } from './tape-stop.js';

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
let direct = null;        // THE DIRECT PATH's element: { el, gain: null, direct: true, id, armed, busyUntil }
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
// + THE PROBE: a small analyser on its output (before the bus, so mute / MUSIC OFF don't matter) → a silent gain → the destination
// (WebKit only runs nodes that reach it). It tells a voice that is "playing" but sends nothing (iOS after the lock screen) — see heal().
let toneNode = null, probe = null;
function tone() {
  const ctx = getContext();
  if (toneNode && toneNode.context === ctx) return toneNode;
  toneNode = ctx.createBiquadFilter();
  toneNode.type = 'lowpass';
  toneNode.frequency.value = 20000;
  toneNode.Q.value = 0.5;
  toneNode.connect(getMusicBus());
  try {
    const a = ctx.createAnalyser(); a.fftSize = 512;
    const z = ctx.createGain(); z.gain.value = 0;
    toneNode.connect(a); a.connect(z); z.connect(ctx.destination);
    probe = { a, buf: new Float32Array(a.fftSize) };
  } catch { probe = null; }
  return toneNode;
}
// the loudest sample the probe saw in its last window (−1 = can't tell)
function probePeak() {
  if (!probe || typeof probe.a.getFloatTimeDomainData !== 'function') return -1;
  probe.a.getFloatTimeDomainData(probe.buf);
  let m = 0;
  for (let i = 0; i < probe.buf.length; i++) { const v = Math.abs(probe.buf[i]); if (v > m) m = v; }
  return m;
}

/** Low-pass the music to `hz` over `seconds` (20000 = open). */
export function filterMusic(hz, seconds = 0.4) {
  const ctx = getContext();
  if (!ctx || !toneNode || toneNode.context !== ctx) return;
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

// play() an element and log what came of it (a song's play, or a refused activation); a refusal iOS gives outside a gesture = needs a tap
const short = u => String(u || '').replace(/^.*\//, '').replace(/\?.*$/, '') || '–';
function playEl(el, why, voice) {
  const silent = el.src.startsWith('blob:'), g = inGesture() ? ' · in tap' : '';
  let p;
  try { p = el.play(); } catch (e) { audioLog(`play threw ${(e && e.name) || 'error'} (${why})`); return Promise.resolve(false); }
  return Promise.resolve(p).then(() => {
    if (voice) voice.armed = true;
    if (!silent) audioLog(`play ok ${short(el.src)} (${why}${g})`);
    return true;
  }, e => {
    const n = (e && e.name) || 'error';
    if (n !== 'AbortError' || !silent) audioLog(`play ✗ ${n} ${silent ? 'activation' : short(el.src)} (${why}${g})`);
    if (n === 'NotAllowedError' && !silent) needTap = true;
    return false;
  });
}

let silentUrl = null;
function watchErrors(voice) {
  const el = voice.el;
  el.addEventListener('error', () => {
    if (!voice.id || el.src.startsWith('blob:')) return;
    // A lost connection or a decode hiccup after the phone slept is NOT a missing file (it used to silence that song for the
    // whole visit): ask the server. Only a real "not there" marks it missing; anything else is reloaded (heal / the next tap).
    const id = voice.id;
    voice.broken = true;
    fetch(urlFor(id), { method: 'HEAD', cache: 'no-store' }).then(r => (r.ok ? 'ok' : r.status === 404 || r.status === 410 ? 'missing' : 'retry'), () => 'retry').then(s => {
      if (voice.id !== id || s !== 'missing') return;
      status[id] = 'missing'; voice.id = null; voice.broken = false;
      if (current && current.voice === voice) current = null;
      apply();
    });
  });
}
// Activate an element inside the gesture (iOS), then park it (unless a song took it meanwhile).
function activate(voice) {
  const silent = silentUrl || (silentUrl = silentWavUrl());
  voice.el.src = silent;
  playEl(voice.el, 'activate', voice).then(ok => {
    if (ok && voice.el.src === silent) voice.el.pause();
    // the direct element just became able to play while the graph is dead and a voice holds the song: over to it now
    if (ok && voice.direct && current && !current.ended && !current.voice.direct && useDirect()) goDirect('armed');
  });
}
function makeVoices() {
  const ctx = getContext();
  if (!ctx) return;
  if (!direct) {
    // the direct path's element: no MediaElementSource — it plays through iOS's own pipeline, whatever the graph does
    const el = new Audio();
    el.preload = 'none';
    el.setAttribute('playsinline', '');
    direct = { el, gain: null, direct: true, id: null, busyUntil: 0, armed: false };
    watchErrors(direct);
    activate(direct);
    applyDirectVolume();
  }
  if (voices.length) return;
  for (let i = 0; i < 3; i++) {
    const el = new Audio();
    el.preload = 'none';
    el.crossOrigin = 'anonymous';
    el.setAttribute('playsinline', '');
    const gain = ctx.createGain();
    gain.gain.value = 0;
    // (THE TAPE STOP: the element's own gain sits between its source and the voice's level, so the tape can fade the element out
    // and in under the same fades + ducks — tape-stop.js)
    const elGain = ctx.createGain();
    elGain.gain.value = 1;
    try { ctx.createMediaElementSource(el).connect(elGain); } catch { continue; }
    elGain.connect(gain);
    gain.connect(tone());
    const voice = { el, gain, elGain, id: null, busyUntil: 0, armed: false };
    watchErrors(voice);
    activate(voice);
    voices.push(voice);
  }
}
// the direct element's level: muted with the music off / muted; the slider + the duck where an element's volume works (not on iOS)
const curve = v => Math.max(0, Math.min(1, v)) ** 2;
function applyDirectVolume() {
  if (!direct) return;
  try { direct.el.muted = !!(settings.muted || settings.musicOff); direct.el.volume = Math.max(0, Math.min(1, curve(settings.music) * duckLevel)); } catch { /* fine */ }
}
onSettings(applyDirectVolume);
/** the output the music is on: 'direct' (iOS's own pipeline) or 'web' (a voice through the graph) */
export const musicOut = () => (current && current.voice && current.voice.direct ? 'direct' : 'web');
// which output a song starts on now: the direct element while the graph is dead (if it may play), else a voice
const graphDead = () => { const c = getContext(); return !c || c.state === 'closed' || clockFrozen(); };
const useDirect = () => !!(direct && direct.armed && graphDead());

// a voice's song again from `at` s (a fresh load: after an error, a stall, a lost connection)
function reloadVoice(voice, at) {
  const { el, id } = voice;
  if (!id || !FILES[id]) return;
  voice.broken = false;
  el.preload = 'auto';
  el.src = urlFor(id); voice.srcAt = performance.now();
  const seek = () => { try { if (at > 0 && Math.abs(el.currentTime - at) > 0.5) el.currentTime = at; } catch { /* not yet */ } };
  el.addEventListener('loadedmetadata', seek, { once: true });
  try { el.load(); } catch { /* fine */ }
  seek();
  playEl(el, 'reload', voice);
}


function freeVoice(exclude) {
  const c = getContext(), now = c ? c.currentTime : 0;
  return voices.find(v => v !== exclude && (!current || v !== current.voice) && v.busyUntil <= now)
    || voices.find(v => v !== exclude && (!current || v !== current.voice))
    || voices[0];
}

function fade(voice, to, seconds) {
  if (voice.direct) { applyDirectVolume(); return; }
  const ctx = getContext();
  if (!ctx || voice.gain.context !== ctx) return;
  const g = voice.gain.gain;
  const t = ctx.currentTime;
  g.cancelScheduledValues(t);
  // a ramp scheduled on a clock that isn't moving (frozen, or a fresh context that hasn't rendered yet) never arrives: set it straight
  if (clockFrozen() || t === 0) { g.value = to; return; }
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(to, t + seconds);
}

function stopVoice(voice, seconds) {
  if (!voice) return;
  if (voice.direct) seconds = Math.min(seconds, 0.3);   // (no fade on the direct element: a short overlap, then it pauses)
  fade(voice, 0, seconds);
  const c = getContext();
  voice.busyUntil = (c ? c.currentTime : 0) + seconds + 0.1;
  const id = voice.id;
  setTimeout(() => {
    if (current && current.voice === voice) return; // re-used meanwhile
    if (id && voice.id === id) positions[id] = voice.el.currentTime || 0;
    voice.el.pause();
  }, seconds * 1000 + 80);
}

// out: 'web' (a voice through the graph) | 'direct' (iOS's own pipeline) | undefined = the direct element while the graph is dead
function startTrack(id, xf = XFADE, out) {
  if (tape.active()) tape.abort('new song');
  let toDirect = out === 'direct' || (out !== 'web' && useDirect());
  if (!toDirect && !voices.length) { if (direct && direct.armed) toDirect = true; else return; }
  const voice = toDirect ? direct : freeVoice();
  if (voice.id !== id || !voice.el.src.includes(FILES[id])) {
    voice.el.preload = 'auto';
    voice.el.src = urlFor(id); voice.srcAt = performance.now();
  }
  voice.id = id;
  const at = positions[id] || 0;
  try { voice.el.currentTime = at; } catch { /* not seekable yet */ }
  if (voice.gain) voice.gain.gain.value = 0;
  voice.broken = false;
  playEl(voice.el, toDirect ? 'start direct' : 'start', voice).then(ok => { if (ok) status[id] = status[id] || 'ok'; });
  fade(voice, duckLevel, xf);
  const prev = current;
  current = { id, voice, list: listFor(id) };
  if (current.list && !PROVIDERS[current.list]) prefetch(nextInList(current.list, id));
  if (prev && prev.voice !== voice) stopVoice(prev.voice, xf);
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
  // (canStart: running — or inside a tap that just asked a fresh / suspended context to run: start the song IN the tap, iOS's rule)
  if (!visible) return;
  if ((!canStart() || !voices.length) && !useDirect()) return;   // (a dead graph with the direct element armed may still start a song)
  // the voices were re-made (a rebuilt context / a dead voice): the same song goes on from where it was
  if (carry && !current && desired) {
    const c = carry; carry = null;
    if (status[c.id] !== 'missing' && (c.list === desired.id || c.id === desired.id || c.list === desired.fallback || c.id === desired.fallback)) {
      positions[c.id] = c.at;
      startTrack(c.id, 0.8);
      current.list = c.list; current.next = c.next;
      return;
    }
  }
  const id = resolveTrack();
  if (current && current.id === id) return; // already playing: never restart
  // a playlist keeps going on its own (watchLoop moves it to the next track)
  if (current && current.list && desired && current.list === desired.id && (PROVIDERS[current.list] || PLAYLISTS[current.list].includes(current.id))) return;
  if (!id) { if (current) { stopVoice(current.voice, nextStopFade || XFADE); nextStopFade = 0; current = null; } return; }
  startTrack(id);
}

// ---- THE HEALTH WATCH (iOS: leaving Safari, the lock screen, a call, Siri, another app's audio, a lost connection)
let needTap = false;      // something only a tap can restart (a play() refused, a dead voice): the next tap does it
let dead = false;         // the voice "plays" (its clock runs) but the probe hears nothing at all: re-make the voices in the next tap
let deadRuns = { n: 0, t: 0 };
let stall = { t: -1, since: 0, still: false };
let carry = null;         // { id, list, next, at }: the song to go on with after the voices were re-made
let heals = 0, lastHeal = '', rescuedAt = -1e9;

/** Is the music actually sounding (as far as this page can tell)? false when it should be and isn't. */
export function musicSounding() {
  if (current && current.ended) return true;                 // a fanfare that has finished: nothing to rescue
  if (!current) return !desired || isUnlocked();             // not started yet (before the first tap) = not sounding
  const el = current.voice.el, ctx = getContext();
  if (current.voice.direct) return !el.paused && !el.error && !current.voice.broken && !needTap && !stall.still;   // (the graph doesn't matter)
  // (THE TAPE STOP carries the song: the element is paused on purpose — the graph running + the source inside its buffer is "sounding")
  if (tape.active()) return !!ctx && ctx.state === 'running' && !clockFrozen() && tape.playing() && !el.error && !current.voice.broken && !dead;
  return !!ctx && ctx.state === 'running' && !clockFrozen() && !el.paused && !el.error && !current.voice.broken && !dead && !needTap && !stall.still;
}
/** THE MUSIC'S FIRST TAP (title.js, City 2.0): the playing song's own clock (s) while a song really sounds — playing, sounding, the
 *  music on, not muted, its volume up — else -1. The title's sign answers the moment this starts moving after a tap. */
export function musicClock() {
  if (!current || current.ended || settings.musicOff || settings.muted || !(settings.music > 0) || !musicSounding()) return -1;
  if (tape.active()) return tape.clock();
  const el = current.voice.el;
  return el && !el.paused && isFinite(el.currentTime) ? el.currentTime : -1;
}

// Loop watcher: crossfade into a fresh copy before the end.
let lastNudge = 0;
function watchLoop() {
  tape.tick();
  if (!current || !visible) return;
  const { voice, id } = current;
  const el = voice.el;
  // Self-heal: the OS paused our track behind our back (iOS keyboard, app switch, call).
  if (current.ended) return;              // a one-shot fanfare that has finished: stay quiet
  if (voice.broken && isUnlocked() && performance.now() - lastNudge > 3000) {
    lastNudge = performance.now();
    heals++; lastHeal = 'reload (error)';
    reloadVoice(voice, el.currentTime || positions[id] || 0);
    return;
  }
  // (the tape carries the song: its element is paused on purpose, its clock still — the tape's own watchdog looks after the way back)
  if (tape.active()) { stall = { t: -1, since: performance.now(), still: false }; return; }
  if (el.paused && !el.ended && (isUnlocked() || voice.direct) && !needTap && performance.now() - lastNudge > 1500) {
    lastNudge = performance.now();
    playEl(el, 'watchdog', voice);
    return;
  }
  // a STALL: playing, but its clock hasn't moved for 5 s (the connection dropped while the phone slept) → load it again from there
  if (!el.paused && (isUnlocked() || voice.direct)) {
    const nowMs = performance.now();
    if (Math.abs(el.currentTime - stall.t) > 0.01) { if (stall.still) audioLog(`song clock moving (${el.currentTime.toFixed(1)} s)`); stall = { t: el.currentTime, since: nowMs, still: false }; }
    else if (!stall.still && nowMs - stall.since > 1500 && el.currentTime > 0.05) { stall.still = true; audioLog(`song clock still at ${el.currentTime.toFixed(1)} s (ready ${el.readyState} · net ${el.networkState})`); }
    else if (nowMs - stall.since > 5000 && performance.now() - lastNudge > 5000) {
      lastNudge = nowMs; stall.since = nowMs;
      heals++; lastHeal = 'reload (stalled)';
      reloadVoice(voice, el.currentTime || positions[id] || 0);
      return;
    }
    // DEAD: the clock runs, the voice is up, yet not one sample reaches the probe (WebKit's element → Web Audio link after the lock
    // screen) — three looks a second apart; only digital silence counts (a quiet intro still has a little signal)
    if (voice.gain && el.currentTime > 3 && voice.gain.gain.value > 0.05 && !clockFrozen() && Math.abs(el.currentTime - deadRuns.t) > 0.5) {
      const pk = probePeak();
      deadRuns = pk === 0 ? { n: deadRuns.n + 1, t: el.currentTime } : { n: 0, t: el.currentTime };
      if (deadRuns.n >= 3 && !dead) { dead = true; lastHeal = 'dead voice: next tap'; audioLog('dead voice: playing, but the probe hears nothing'); }
      else if (pk > 0 && dead) dead = false;          // (a song's own silent gap, not a dead voice)
    }
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
  // on the direct path (or a dead graph): the next song on the same element — a cut, not a crossfade (a voice again once the graph runs)
  if (voice.direct || useDirect()) {
    positions[id] = 0; positions[nid] = 0;
    startTrack(nid, 0, voice.direct && !graphOk() ? 'direct' : undefined);
    current.list = list;
    if (list && PLAYLISTS[list]) { listPos[list] = PLAYLISTS[list].indexOf(nid); prefetch(nextInList(list, nid)); }
    return;
  }
  const next = freeVoice(voice);
  next.el.preload = 'auto';
  if (next.id !== nid || !next.el.src.includes(FILES[nid])) { next.el.src = urlFor(nid); next.srcAt = performance.now(); }
  next.id = nid;
  try { next.el.currentTime = 0; } catch { /* fine */ }
  next.gain.gain.value = 0;
  playEl(next.el, 'next', next);
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
  applyDirectVolume();
}

/**
 * THE TAPE STOP (City 2.0, 6b → Oct 25 — the TR-3B "bends the music"; docs/audio.md#the-tape-stop-in-web-audio): the song's speed to
 * `rate` (0.25..1) over `seconds`, the pitch sagging with it — like a record player losing power — IN WEB AUDIO (tape-stop.js): a
 * decoded slice of the song on an AudioBufferSourceNode takes over from the element (paused), its playbackRate ramped, a wow + a
 * flutter on it (`wow` / `flutter`: depths as fractions of the rate); rate 1 releases: the element resumes where the tape got to (a
 * room-clocked song: where it would be) once its clock is seen moving. The element's own playbackRate is NEVER changed (iOS Safari
 * stalls / silences a media element whose rate changes — the owner's panel, Oct 25). Nothing happens on the direct path or without
 * a running graph (the caller's duck is the dip). Silent no-op without a song.
 */
const tape = createTapeStop({
  ctx: getContext, frozen: clockFrozen, log: audioLog,
  fetchBytes: url => fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); }).then(ab => new Uint8Array(ab)),
  decode: (c, ab) => new Promise((res, rej) => { try { const p = c.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }),
  elPlay: (el, why) => playEl(el, why, current && current.voice.el === el ? current.voice : null),
  elReload: (voice, at) => { heals++; lastHeal = 'tape: reload'; reloadVoice(voice, at); },
  visible: () => visible,
});
export function bendMusic(rate, seconds = 0.5, o = {}) {
  if (!current || current.ended || !current.id) return 'idle';
  return tape.bend(current.voice, current.id, urlFor(current.id), rate, seconds, o);
}
/** decode the slice ahead of the first bend (the craft arriving: ~3 s before the sag starts) */
export function prepareBend() { if (!current || current.ended || !current.id) return false; return tape.prepare(current.voice, current.id, urlFor(current.id)); }
/** a room-clocked song makes up the time the tape lost when it comes back (the title's mood music goes on from where the tape got to) */
export function musicCatchUp() { return tape.catchUp(); }
export function setMusicClocked(v) { tape.setClocked(v); }
/** the tape stop's state (tests, the AUDIO panel): { phase, rate, at, lost, bent, runs, aborts, reloads … } */
export const musicBend = () => tape.state();

/** Test hook: cut the playing voice off from the probe (what WebKit does after the lock screen: its clock runs, nothing comes out). */
export function musicSimulateDead() {
  if (!current || current.voice.direct) return;
  const g = current.voice.gain, z = g.context.createGain();
  z.gain.value = 0;
  try { g.disconnect(); g.connect(z); z.connect(tone()); } catch { /* fine */ }
}

/** Test hook: jump the playing track to `secondsFromEnd` before its end. */
export function musicSeek(secondsFromEnd) { if (current && current.voice.el.duration) current.voice.el.currentTime = Math.max(0, current.voice.el.duration - secondsFromEnd); }

/** The MOOD MUSIC song sounding right now on this phone: { id (without 'm:'), at (s), dur (s) } — or null (music off, CLASSIC,
 *  not unlocked yet, a game's music, paused). The lobby uses it to carry the host's song into the room unchanged. */
export function nowPlaying() {
  if (!current || !current.id || !current.id.startsWith('m:') || current.ended) return null;
  const el = current.voice.el;
  // (on the tape: the song's time + speed are the tape's — the element is paused on purpose)
  if (tape.active()) return { id: current.id.slice(2), at: tape.clock(), dur: isFinite(el.duration) && el.duration > 0 ? el.duration : 0, el, rate: tape.rate(), tape: true };
  if (!el || el.paused || !isFinite(el.currentTime)) return null;
  return { id: current.id.slice(2), at: el.currentTime || 0, dur: isFinite(el.duration) && el.duration > 0 ? el.duration : 0, el, rate: el.playbackRate || 1 };
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
    voices: voices.map(v => ({ id: v.id, gain: +v.gain.gain.value.toFixed(3), paused: v.el.paused, t: +(v.el.currentTime || 0).toFixed(2), broken: !!v.broken })),
    out: musicOut(),
    health: { sounding: musicSounding(), needTap, dead, heals, last: lastHeal, peak: +probePeak().toFixed(4), out: musicOut(), ...audioHealth() },
    tape: tape.state(),
  };
}

/** THE AUDIO DIAGNOSTIC (audio/diag.js, &debug=1): the engine, the playing element, what should be playing, the last events. */
export function musicDiag() {
  const v = current && current.voice, el = v && v.el;
  return {
    want: desired ? desired.id + (desired.fallback ? '/' + desired.fallback : '') : null,
    off: settings.musicOff ? 'music off' : settings.muted ? 'muted' : '',
    playing: current ? current.id : null, ended: !!(current && current.ended), carry: carry ? carry.id : null,
    el: el ? { paused: el.paused, ready: el.readyState, net: el.networkState, err: el.error ? el.error.code : 0, t: el.currentTime || 0,
      src: short(el.src), gain: v.gain ? v.gain.gain.value : el.muted ? 0 : el.volume, broken: !!v.broken, rate: el.playbackRate } : null,
    voices: voices.length, armed: voices.filter(x => x.armed).length, out: musicOut(), direct: direct ? (direct.armed ? 'armed' : 'not armed') : 'none',
    sounding: musicSounding(), needTap, dead, still: !!stall.still, heals, last: lastHeal, peak: probePeak(),
    tape: tape.state(),
    engine: audioHealth(), events: audioEvents(),
  };
}

// Throw the voices away and make new ones (inside a tap: iOS lets a new element start only there), keeping the song + its place.
function remakeVoices(why) {
  if (tape.active()) tape.abort('new voices');
  const onDirect = !!(current && current.voice.direct);
  if (current && !current.ended && current.id && !onDirect) {
    const el = current.voice.el;
    carry = { id: current.id, list: current.list, next: current.next, at: (el && el.currentTime) || positions[current.id] || 0 };
  }
  for (const v of voices) { try { v.el.pause(); v.el.removeAttribute('src'); v.el.load(); } catch { /* gone */ } try { v.gain.disconnect(); } catch { /* gone */ } }
  voices = []; dead = false; deadRuns = { n: 0, t: 0 }; needTap = false;
  if (!onDirect) current = null;                      // (a song on the direct path plays on: only the voices are new)
  heals++; lastHeal = why;
  audioLog(`new voices (${why})`);
  makeVoices();
  apply();
}

// back on screen / the context running again / a tap: put the current song back the way it should be
function heal(why) {
  if (!visible) return;
  if (!current) { apply(); return; }
  if (current.ended) return;
  if (tape.active()) { fade(current.voice, duckLevel, 0.6); apply(); return; }   // (the tape carries the song: its element is paused on purpose)
  const v = current.voice, el = v.el;
  // errored / no source left (iOS can drop it while the phone sleeps) / stuck still while "playing": load it again (inside a tap: allowed)
  // (networkState 3 = no source: right after a new src it reads 3 for a moment while the browser picks it up — only later is it lost)
  if (v.broken || el.error || (el.networkState === 3 && performance.now() - (v.srcAt || 0) > 3000) || (stall.still && inGesture())) { heals++; lastHeal = why + ': reload'; stall = { t: -1, since: performance.now(), still: false }; reloadVoice(v, el.currentTime || positions[current.id] || 0); }
  else if (el.paused) playEl(el, why, v);
  fade(v, duckLevel, 0.6);
  apply();
}

/**
 * THE MUSIC BUTTON (settings-panel.js): was the music meant to be on but silent at this tap? Then this tap is "play", not "off" —
 * true when the tap's own gesture just rescued it (or it still isn't sounding: the rescue runs now, inside the tap).
 */
export function musicNeedsRescue() {
  if (settings.musicOff || settings.muted) return false;
  // (on the direct path a frozen context is no silence: the song sounds without it — that tap means OFF, as usual)
  const recent = performance.now() - rescuedAt < 1500 || (tapFoundSilence() && musicOut() !== 'direct');
  // still not sounding: rescue again inside THIS click (the button's own gesture — never a silent "MUSIC ON")
  if (desired && !musicSounding()) { rescue('the music button'); return true; }
  return recent;
}
function rescue(why) {
  rescuedAt = performance.now();
  audioLog(`rescue (${why})`);
  if (dead || (voices.length && voices[0].gain.context !== getContext())) { remakeVoices(why + ': new voices'); return; }
  if (!voices.length) { makeVoices(); apply(); return; }
  needTap = false;
  // voices whose activation iOS refused (not in a gesture then): activate them now, inside this one
  if (inGesture()) for (const x of [...voices, ...(direct ? [direct] : [])]) if (!x.armed && (!current || x !== current.voice) && x.el.src.startsWith('blob:')) playEl(x.el, 'activate', x).then(ok => { if (ok && x.el.src.startsWith('blob:')) x.el.pause(); });
  // the graph is dead (frozen, and not being rebuilt in this tap): the song goes on through the direct element, now
  if (current && !current.ended && !current.voice.direct && useDirect()) { goDirect(why); return; }
  heal(why);
}

// THE DIRECT PATH: the current song over to the direct element at its place (the voice pauses); or the other way round
function goDirect(why) {
  if (!current || current.ended || current.voice.direct || !direct || !direct.armed) { if (!direct || !direct.armed) needTap = true; return; }
  if (tape.active()) tape.abort('direct path');
  const el = current.voice.el;
  positions[current.id] = el.currentTime || positions[current.id] || 0;
  heals++; lastHeal = why + ': direct';
  audioLog(`direct element (${why}) from ${positions[current.id].toFixed(1)} s`);
  const { list, next } = current;
  startTrack(current.id, 0.3, 'direct');
  current.list = list; current.next = next;
}
function backToGraph(why) {
  if (!current || current.ended || !current.voice.direct || !voices.length || !voices.some(v => v.armed) || voices[0].gain.context !== getContext()) return;
  const el = current.voice.el;
  positions[current.id] = el.currentTime || positions[current.id] || 0;
  heals++; lastHeal = why + ': web audio';
  audioLog(`back to web audio (${why}) from ${positions[current.id].toFixed(1)} s`);
  const { list, next } = current;
  startTrack(current.id, 0.8, 'web');
  current.list = list; current.next = next;
}

onUnlock(() => {
  makeVoices();
  if (desired) { prefetch(desired.id); if (desired.fallback) prefetch(desired.fallback); }
  apply();
});
// The context came back (often only on the next tap after iOS refused a resume): the
// current voice may have been paused by the OS meanwhile, so start it again.
onResume(() => heal('resumed'));
// A stuck context was replaced (engine.js#rebuild, inside a tap): the elements are tied to the old one — new voices, same song.
onRebuild(() => { toneNode = null; remakeVoices('new context'); rescuedAt = performance.now(); });
// The clock of a 'running' context seen stopped (a fresh one that never started, or the old one after the background): the song
// goes on through the direct element at once — no tap needed, it was activated in an earlier gesture (else the next tap does it).
onFrozen(() => { if (visible && desired && current && !current.ended && !current.voice.direct) goDirect('frozen clock'); });
// Every tap: anything that only a gesture may restart (a refused play(), a dead voice) — before the tap's own click runs.
onGesture(() => {
  // elements whose activation never settled (iOS refused it outside a gesture; a pause aborted it): activate them again, in this tap
  for (const x of [...voices, ...(direct ? [direct] : [])]) if (!x.armed && x.el.src.startsWith('blob:') && (!current || x !== current.voice)) activate(x);
  if (!visible || !desired) return;
  const ctx = getContext();
  // on the direct path with the graph seen running for 2 s: back onto a voice (its fades, the kick listener) at the same place
  if (current && current.voice.direct && graphOk()) { if (voices.length && voices[0].gain.context !== ctx) remakeVoices('new context'); backToGraph('tap'); return; }
  const off = !!current && !current.ended && ((current.voice.el.paused && !tape.active()) || current.voice.broken || !!current.voice.el.error);
  if (needTap || dead || off || !musicSounding() || (voices.length && voices[0].gain.context !== ctx)) rescue('tap');
});
onVisibility(v => {
  visible = v;
  if (!current) { apply(); return; }
  // (an element still on its silent blob is being activated: pausing it would abort that — leave it)
  if (!v) { if (tape.active()) tape.abort('hidden'); positions[current.id] = current.voice.el.currentTime || 0; for (const x of [...voices, ...(direct ? [direct] : [])]) if (!x.el.src.startsWith('blob:')) x.el.pause(); stall = { t: -1, since: 0, still: false }; }
  else {
    heal('back on screen');
    // 1.5 s later: still not sounding? the next tap restarts it (the engine rebuilds a stuck context in that same tap)
    setTimeout(() => { if (visible && desired && !musicSounding()) needTap = true; }, 1500);
  }
});
setInterval(watchLoop, 200);
