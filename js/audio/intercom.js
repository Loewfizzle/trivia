// CITY CONTROLS B — THE INTERCOM on every phone (docs/audio.md#the-intercom; the rules: core/radio-intercom.js). The owner's voice is the one
// sound in the app that MEANS something — still polish: a locked / muted / blocked engine plays nothing, the headline still goes up, nothing
// breaks. Three ways in, one player:
//   'room'  a lobby's node rooms/{CODE}/radio (room.js — the room's socket, ~1–2 s): LOBBY ONLY + EVERYONE's lobby copy — the lobby's
//           phones start it TOGETHER at its `at` on the server clock
//   'feed'  the city's cached GET (screens/harbor/remote.js, ~45 s): EVERYONE on the title
//   'desk'  the owner's own phone (screens/harbor/radio-intercom.js): at once
// THE SOUND (Web Audio, into the SFX bus — the Effects slider + Mute): the VIBRAPHONE CHIME → the music DUCKS → the voice through a tinny
// 1920s PA (band-limited 320 Hz – 3.4 kHz, a presence bump, a touch of drive, the soft CRACKLE under it, a short SLAP ECHO off the
// buildings) → the chime → the music back up. Never over a legendary's own audio (setIntercomBusy: it waits). WAIT FOR THE LOBBY: a phone
// in a running game HOLDS it (≤ an hour) until it's back in the lobby / the title; DON'T WAIT plays over the game — unless the game exports
// NO_INTERCOM (music is the gameplay: `true`, or a function of the game → true while its round runs). One at a time; each id plays once
// (this tab: sessionStorage).
import { getContext, getSfxBus, isUnlocked, audioLog } from './engine.js';
import { settings } from './settings.js';
import { duckMusic, musicDuckLevel } from './music.js';
import { cityLoop } from './city-sound.js';
import { takesOf } from '../core/city-sounds.js';
import { serverNow } from '../firebase.js';
import { state as store } from '../store.js';
import { metaOf } from '../games/registry.js';
import { icDecide, icLen, headLines, CHIME_S, GAP_IN, GAP_OUT } from '../core/radio-intercom.js';
import { knob } from '../core/harbor-schedule.js';

const PLAYED_KEY = 'nd:ic-played';
const known = new Map();                 // id → { m, source, held }
let played = new Set((() => { try { return JSON.parse(sessionStorage.getItem(PLAYED_KEY) || '[]'); } catch { return []; } })());
let busyFn = () => false, headFn = null, now$ = () => serverNow();
let tickT = 0, playing = null;
const log = [];                          // (tests) what happened: { id, what, at }
const starts = {};                       // (tests — FRIENDS C) id → the server ms its first chime starts on this phone
// FRIENDS C — THE INTERCOM IN SYNC: a phone begins up to PREP_MS before `at` (the clip fetched + decoded), the sound SCHEDULED on the audio
// clock for `at` on the server clock — every phone the same moment (core/radio-intercom.js#icDecide)
const PREP_MS = 4000;
const note = (id, what) => { log.push({ id, what, at: Date.now() }); if (log.length > 40) log.shift(); audioLog(`intercom ${id}: ${what}`); };

/** the harbor tells the intercom when a legendary's own audio is on (it waits) */
export function setIntercomBusy(fn) { busyFn = typeof fn === 'function' ? fn : () => false; }
/** the harbor's billboard: (lines | null) → the headline up while the voice plays (core/harbor-billboard.js#setIntercomHead) */
export function setIntercomHead(fn) { headFn = typeof fn === 'function' ? fn : null; }

/** feed the moments a source knows (the WHOLE list it has now — gone ids from that source are forgotten unless held) */
export function intercomFeed(source, list, stopped = []) {
  const ids = new Set();
  for (const m of list || []) {
    if (!m || m.kind !== 'intercom' || !m.id) continue;
    ids.add(m.id);
    const k = known.get(m.id);
    if (k) { k.m = { ...k.m, ...m }; if (rank(source) > rank(k.source)) k.source = source; }
    else known.set(m.id, { m, source, held: false });
  }
  for (const id of stopped || []) { const k = known.get(id); if (k) k.m = { ...k.m, state: 'stopped' }; }
  if (playing && known.get(playing.id) && known.get(playing.id).m.state === 'stopped') playing.stop();
  kick();
}
/** an UNSEND seen on the owner's own desk: stop it here at once */
export function intercomStopped(id) { const k = known.get(id); if (k) k.m = { ...k.m, state: 'stopped' }; if (playing && playing.id === id) playing.stop(); }
const rank = s => (s === 'desk' ? 3 : s === 'room' ? 2 : 1);

function inGame() { return !!(store.code && store.meta && store.meta.status === 'playing'); }
function holdGame() {
  const g = store.game, mod = g && g.id ? metaOf(g.id) : null, no = mod && mod.NO_INTERCOM;
  if (!no || !inGame()) return false;
  try { return typeof no === 'function' ? !!no(g) : true; } catch { return true; }
}
function kick() { if (!tickT) tickT = setTimeout(tick, 0); }
function tick() {
  tickT = 0;
  const now = now$();
  let pending = false;
  for (const [id, k] of known) {
    if (played.has(id)) { if (k.m.state === 'stopped' || now > (k.m.made || k.m.at) + knob('radio.intercom').keep * 1000) known.delete(id); continue; }
    const d = icDecide(k.m, { now, source: k.source, inGame: inGame(), holdGame: holdGame(), busy: !!playing || safe(busyFn), held: k.held, prep: k.held ? 0 : PREP_MS });
    if (d === 'skip') { known.delete(id); markPlayed(id); note(id, 'skipped'); continue; }
    if (d === 'hold') { if (!k.held) note(id, 'held (a game is on)'); k.held = true; pending = true; continue; }
    if (d === 'wait') { pending = true; continue; }
    if (d === 'play' && !playing) { markPlayed(id); play(k.m, k.held); pending = true; }
    else pending = true;
  }
  if (pending && !tickT) tickT = setTimeout(tick, 400);
}
const safe = fn => { try { return !!fn(); } catch { return false; } };
function markPlayed(id) {
  played.add(id);
  if (played.size > 60) played = new Set([...played].slice(-40));
  try { sessionStorage.setItem(PLAYED_KEY, JSON.stringify([...played])); } catch { /* fine */ }
}

// ---------------------------------------------------------------- the sound
let chimeBuf = null, chimeP = null;
const decode = (c, ab) => new Promise((res, rej) => { const p = c.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
function chime(c) {
  if (chimeBuf) return Promise.resolve(chimeBuf);
  if (!chimeP) {
    const t = takesOf('radio-chime')[0];
    chimeP = t ? fetch(new URL(`../../audio/city/${t.f}${t.v ? `?v=${t.v}` : ''}`, import.meta.url)).then(r => r.arrayBuffer()).then(ab => decode(c, ab)).then(b => (chimeBuf = b)).catch(() => { chimeP = null; return null; }) : Promise.resolve(null);
  }
  return chimeP;
}
/** the 1920s PA: band-limit, a presence bump, a touch of drive, a slap echo → { input, output } */
function paChain(c) {
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320; hp.Q.value = 0.8;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400; lp.Q.value = 0.9;
  const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1800; pk.Q.value = 1.1; pk.gain.value = 5;
  const sh = c.createWaveShaper(), n = 1024, curve = new Float32Array(n), drive = 2.4;
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * drive) / Math.tanh(drive); }
  sh.curve = curve; sh.oversample = '2x';
  const pre = c.createGain(); pre.gain.value = 1.4;
  const out = c.createGain(); out.gain.value = 0.9;
  // the slap off the buildings across the harbor (110 ms, dark, two soft repeats)
  const dl = c.createDelay(0.5); dl.delayTime.value = 0.11;
  const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
  const fb = c.createGain(); fb.gain.value = 0.22;
  const wet = c.createGain(); wet.gain.value = 0.26;
  pre.connect(hp); hp.connect(lp); lp.connect(pk); pk.connect(sh); sh.connect(out);
  sh.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(wet); wet.connect(out);
  return { input: pre, output: out, nodes: [pre, hp, lp, pk, sh, out, dl, dlp, fb, wet] };
}
const audible = () => !settings.muted && !settings.sfxOff && (settings.sfx == null || settings.sfx > 0.01);

/**
 * play one announcement; `late` s already gone (a lobby phone a moment late joins the timeline) → a handle { id, stop() }. Also used by
 * the owner's PLAY BACK (o.local: a Blob / ArrayBuffer — his phone only, nothing sent).
 */
export function playAnnouncement(m, o = {}) {
  const c = getContext(), bus = getSfxBus(), id = m.id || 'local', head = m.head ? headLines(m.head) : null;
  const h = { id, stopped: false, done: null, stop() {} };
  let endT = 0, nodes = [], crackle = null, prevDuck = null;
  const showHead = on => { try { if (headFn && head) headFn(on ? head : null); } catch { /* polish */ } };
  // (FRIENDS C: o.at = the server ms it starts — the timeline's place is worked out when the sound is SCHEDULED, after the fetch + decode)
  const lateNow = () => (o.at != null ? (now$() - o.at) / 1000 : Math.max(0, o.late || 0));
  let headT = 0, duckT = 0;
  const finish = why => {
    if (h.stopped) return; h.stopped = true; clearTimeout(endT); clearTimeout(headT); clearTimeout(duckT);
    showHead(false);
    try { if (crackle) crackle.stop(0.3); } catch { /* fine */ }
    for (const n of nodes) { try { if (n.stop) n.stop(); } catch { /* fine */ } try { n.disconnect(); } catch { /* fine */ } }
    if (prevDuck != null) duckMusic(prevDuck, 1.2);
    if (playing === h) playing = null;
    note(id, why); if (h.onEnd) h.onEnd(why);
    kick();
  };
  h.stop = () => finish('stopped');
  playing = h;
  // (ms: from now to the first chime — < 0 = already that far in) → the headline up then, the start noted on the server clock
  const begin = ms => { headT = setTimeout(() => { if (!h.stopped) showHead(true); }, Math.max(0, ms)); starts[id] = Math.round(now$() + ms); };
  const silent = () => { const late = lateNow(), len = icLen(m.dur || 3) * 1000; begin(-late * 1000); endT = setTimeout(() => finish('done (silent — audio locked or off)'), Math.max(0, len - late * 1000)); return h; };
  if (!c || !bus || !isUnlocked() || !audible()) return silent();
  const clip = o.local ? Promise.resolve(o.local).then(b => (b instanceof Blob ? b.arrayBuffer() : b)) : fetch(`/api/admin?clip=${encodeURIComponent(id)}`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`clip ${r.status}`))));
  Promise.all([clip.then(ab => decode(c, ab.slice ? ab.slice(0) : ab)), chime(c)]).then(([voice, ch]) => {
    if (h.stopped) return;
    const late = lateNow(), t0 = c.currentTime + (o.at != null ? 0 : 0.05) - late;
    begin((t0 - c.currentTime) * 1000);
    const out = c.createGain(); out.gain.value = 1; out.connect(bus); nodes.push(out);
    const at = (src, t, dest = out) => { src.connect(dest); const w = Math.max(c.currentTime, t), off = Math.max(0, c.currentTime - t); if (src.buffer && off >= src.buffer.duration) return; src.start(w, off); nodes.push(src); };
    // the chime in
    if (ch) { const s = c.createBufferSource(); s.buffer = ch; const g = c.createGain(); g.gain.value = 0.95; g.connect(out); nodes.push(g); at(s, t0, g); }
    // the music ducks with the first ding (the ducking: music.js — the song voice, the party song, the direct path)
    duckT = setTimeout(() => { if (h.stopped) return; prevDuck = musicDuckLevel(); duckMusic(Math.min(prevDuck, knob('radio.intercom').duck), 0.6); }, Math.max(0, (t0 - c.currentTime) * 1000));
    // the voice through the PA (+ the crackle bed under it)
    const vT = t0 + (ch ? CHIME_S : 0.4) + GAP_IN, pa = paChain(c); pa.output.connect(out); nodes.push(...pa.nodes);
    const v = c.createBufferSource(); v.buffer = voice; at(v, vT, pa.input);
    const vEnd = vT + voice.duration;
    setTimeout(() => { if (!h.stopped) { try { crackle = cityLoop('radio-crackle', { gain: 1.4, fadeIn: 0.25 }); /* (the slot's 0.25 × 1.4 ≈ −34 LUFS under the voice) */ } catch { crackle = null; } } }, Math.max(0, (vT - 0.2 - c.currentTime) * 1000));
    setTimeout(() => { try { if (crackle) { crackle.stop(0.4); crackle = null; } } catch { /* fine */ } }, Math.max(0, (vEnd + 0.15 - c.currentTime) * 1000));
    // the chime out
    let end = vEnd + 0.3;
    if (ch) { const s = c.createBufferSource(); s.buffer = ch; const g = c.createGain(); g.gain.value = 0.85; g.connect(out); nodes.push(g); at(s, vEnd + GAP_OUT, g); end = vEnd + GAP_OUT + CHIME_S; }
    note(id, `playing (${voice.duration.toFixed(1)} s${late ? `, ${late.toFixed(1)} s late` : ''})`);
    endT = setTimeout(() => finish('done'), Math.max(0, (end - c.currentTime) * 1000) + 120);
  }).catch(e => { note(id, `could not play: ${e && e.message}`); if (!h.stopped) silent(); });
  return h;
}
function play(m, held) {
  // (FRIENDS C: on the server clock — scheduled for `at`, or mid-way when late; a phone that held it through a game: from the top, now)
  playAnnouncement(m, held || !Number.isFinite(m.at) ? { late: 0 } : { at: m.at });
}

/** (tests + the panel) what the intercom knows + did */
export const intercomDebug = () => ({ starts: { ...starts }, known: [...known.values()].map(k => ({ id: k.m.id, source: k.source, held: k.held, state: k.m.state, at: k.m.at })), played: [...played], playing: playing ? playing.id : null, log: log.slice() });
/** (tests) a fake clock */
export function intercomTestClock(fn) { now$ = typeof fn === 'function' ? fn : () => serverNow(); }
