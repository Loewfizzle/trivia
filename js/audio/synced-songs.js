// Songs on the server clock, shared by PRISM DROP and SLIPSTREAM.
//
// A match plays a list of songs (game.songs, durations game.sd in ms) one after another: song i starts at
// songStarts(game)[i] (server ms) and crossfades into the next XF_MS before its end. Like PULSE, each song is
// fetched and decoded ONCE into an AudioBuffer and scheduled on the audio clock (pulse/clock.js#ctxAtServer:
// "heard at server time X") — sample-accurate, nothing to correct while it plays, no seeking. (Streaming <audio>
// elements and nudging their speed toward the server clock warbled and stuttered on phones.)
// Only the playing song and (≤ 45 s before its crossfade) the next one stay decoded. If the context was suspended
// (app in the background) the clock map shifts: the song is restarted at the right spot once, with a short fade.
//
// The caller owns the processing chain: createSyncedSongs({ urlFor, connect }) where connect(ctx) returns the node
// every song voice plugs into (created once, the first time audio runs). tick() returns the running context (or null).
import { getContext, clockFrozen } from './engine.js';
import { songEnvelope } from '../core/sync-math.js';
import { serverNow } from '../firebase.js';
import { ctxAtServer } from '../games/pulse/clock.js';
import { RESYNC_S } from '../core/sync-math.js';
import { songStarts, XF_MS } from '../core/playlist.js';
import { settings } from './settings.js';
// MODELS — TWO DEVICES IN STEP (the owner's iPhone + the mini PC through a TV + a soundbar over eARC: the same station song, a slight lag):
// ctxAtServer already schedules by what the browser says is HEARD (getOutputTimestamp, else currentTime − outputLatency); a TV's +
// a soundbar's own processing (often 100–200 ms) is past what any page can see — SETTINGS → SPEAKER DELAY plays this device's songs that
// much earlier (ms), so its sound leaves the speakers in step with a phone's
export const speakerLead = () => Math.max(0, Math.min(0.5, (Number(settings.speakerDelay) || 0) / 1000));

const LOOKAHEAD_MS = 45_000; // decode the next song this long before its crossfade
const END_FADE = 1.5;        // seconds: the very end of the last song fades out

// SPEED PASS B — E2 (b) (review-6.md: the host re-fetched + re-decoded a station song 4× in a session — the player re-made after the city's
// pause — and the game song 2× — two consumers): ONE decode per song URL on this page, shared by every player that wants it (refs); a song
// no player wants any more stays decoded a little (KEEP_N, KEEP_MS) so the city's rebuild after a match picks it up again — at most ONE extra
// (a decoded song is tens of MB: never more than the three the players held before). `decoded` = THE MUSIC CACHE (docs/audio.md).
const KEEP_N = 1, KEEP_MS = 4 * 60_000;
const decoded = new Map();   // url → { p: Promise<AudioBuffer>, refs, at (released) }
let decodes = 0;
function prune() {
  const now = Date.now(), idle = [...decoded].filter(([, e]) => !e.refs).sort((a, b) => b[1].at - a[1].at);
  idle.forEach(([u, e], k) => { if (k >= KEEP_N || now - e.at > KEEP_MS) decoded.delete(u); });
}
function acquire(url) {
  prune();
  let e = decoded.get(url);
  if (!e) { e = { p: decode(url), refs: 0, at: 0 }; decodes++; decoded.set(url, e); e.p.catch(() => { if (decoded.get(url) === e) decoded.delete(url); }); }
  e.refs++;
  return e.p;
}
function release(url) { const e = decoded.get(url); if (!e) return; e.refs = Math.max(0, e.refs - 1); if (!e.refs) { e.at = Date.now(); prune(); } }
/** TESTS + THE AUDIO panel: the shared decodes (url → refs) and how many fetch + decodes this page has started */
export const songCache = () => ({ decodes, held: [...decoded].map(([u, e]) => ({ url: u.split('/').pop(), refs: e.refs })) });

function decode(url) {
  return fetch(url).then(r => { if (!r.ok) throw new Error(`song ${r.status}`); return r.arrayBuffer(); }).then(ab => {
    // an offline context decodes without an unlocked (tapped) audio context
    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new AC(2, 1, 44100);
    return new Promise((resolve, reject) => c.decodeAudioData(ab, resolve, reject));
  });
}

export function createSyncedSongs({ urlFor, connect, label = 'song', joinFade = 0.15 }) {
  let minIndex = 0;          // songs before this one are not played here (another player has them: the lobby's handoff)
  let dest = null;
  let game = null;
  let stopped = false;
  let lastCheck = 0;
  let restarts = 0;
  let failures = 0;          // voices whose start() threw (disconnected at once — APP FIXES, Grok 3.5)
  const bufs = new Map();    // `${matchId}:${i}` -> { buf, failed }
  const voices = new Map();  // song index -> { src, gain, origin, startedAt }
  const done = new Set();    // song indexes that played to their end (never restart)
  const keyOf = i => `${game.matchId}:${i}`;

  function load(i) {
    const k = keyOf(i);
    if (bufs.has(k)) return;
    const url = urlFor(game.songs[i]);
    const e = { buf: null, failed: false, url };
    bufs.set(k, e);
    acquire(url).then(b => { e.buf = b; }).catch(err => { e.failed = true; console.warn(label, err && err.message); });
  }
  const drop = k => { const e = bufs.get(k); if (!e) return; bufs.delete(k); release(e.url); };

  // which songs matter at server time t: the one playing, the next (close to its turn), the previous (still fading)
  function wanted(t, starts) {
    let cur = 0;
    while (cur + 1 < starts.length && t >= starts[cur + 1]) cur++;
    const w = [cur];
    if (cur + 1 < starts.length && starts[cur + 1] - t < LOOKAHEAD_MS) w.push(cur + 1);
    // (SPEED PASS B — E2 (a): the PREVIOUS song only if this phone already has it — a phone arriving mid-crossfade never fetches a whole song
    //  for the last few seconds of its fade, inaudible under the new one)
    if (cur > 0 && t < starts[cur] + XF_MS && bufs.has(keyOf(cur - 1))) w.push(cur - 1);
    return w;
  }

  // → true when a voice for song i is now scheduled (APP FIXES, Grok 3.5: ONE monotonic envelope — core/sync-math.js#songEnvelope —
  // and a start that throws leaves no source behind)
  function start(ctx, i, starts) {
    const e = bufs.get(keyOf(i));
    if (!e || !e.buf) return false;
    const buf = e.buf;
    const origin = ctxAtServer(starts[i]) - speakerLead();   // ctx time at which position 0 is heard (− this device's speaker delay)
    const at = Math.max(ctx.currentTime + 0.05, origin);
    const off = at - origin;
    if (off >= buf.duration - 0.25) { done.add(i); return false; }
    const ctxOf = ms => origin + (ms - starts[i]) / 1000;
    // fade in: a crossfade from the previous song, or a short ramp when joining mid-song; fade out: into the next song, or at the very
    // end of the last one — the fade-out never before the fade-in is over
    const end = origin + buf.duration;
    let out = null;
    if (i + 1 < starts.length) out = { start: ctxOf(starts[i + 1]), end: ctxOf(starts[i + 1] + XF_MS) };
    else if (end - END_FADE > at + 0.2) out = { start: end - END_FADE, end };
    const pts = songEnvelope({ at, origin, crossIn: i > 0 && off < XF_MS / 1000, xfS: XF_MS / 1000, joinFade, out });
    let src = null, gain = null;
    try {
      src = ctx.createBufferSource();
      src.buffer = buf;
      gain = ctx.createGain();
      src.connect(gain).connect(dest);
      const g = gain.gain;
      for (const pt of pts) { if (pt.ramp) g.linearRampToValueAtTime(pt.v, pt.t); else g.setValueAtTime(pt.v, pt.t); }
      src.onended = () => {
        try { src.disconnect(); gain.disconnect(); } catch { /* gone */ }
        if (voices.get(i) && voices.get(i).src === src) { voices.delete(i); done.add(i); }
      };
      src.start(at, off);
    } catch (err) {
      failures++;
      try { if (src) src.disconnect(); if (gain) gain.disconnect(); } catch { /* never connected */ }
      console.warn(label, 'start', err && err.name);
      return false;
    }
    voices.set(i, { src, gain, origin, startedAt: ctx.currentTime, startAt: at });
    return true;
  }

  function stopVoice(ctx, i, fade = 0.12) {
    const v = voices.get(i);
    if (!v) return;
    voices.delete(i);
    fadeOut(ctx, v, fade);
  }
  function fadeOut(ctx, v, fade) {
    const t = ctx.currentTime;
    try {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(v.gain.gain.value, t);
      v.gain.gain.linearRampToValueAtTime(0, t + fade);
      v.src.stop(t + fade + 0.02);
    } catch { /* never started */ }
  }

  return {
    setGame(g) {
      if (game && g && game.matchId !== g.matchId) { const ctx = getContext(); if (ctx) for (const i of [...voices.keys()]) stopVoice(ctx, i, 0.3); done.clear(); }
      // (APP FIXES — Grok 3.8: the same queue MOVED in time — the preview panel's time jump, a backward jump — the songs that "played to
      // their end" may be ahead again: forget them; tick() stops the voices that aren't wanted any more)
      else if (game && g && Math.abs((g.songStartAt || 0) - (game.songStartAt || 0)) > 100) done.clear();
      game = g;
    },
    /** call every frame; returns the running AudioContext (null before the first tap / while suspended) */
    tick() {
      if (!game || stopped || !game.songs || !game.songs.length) return null;
      const t = serverNow();
      const starts = songStarts(game);
      const want = wanted(t, starts);
      for (const i of want) if (i >= minIndex) load(i);
      // drop decoded songs we no longer need (a decoded song is tens of MB)
      for (const k of [...bufs.keys()]) {
        const [m, si] = k.split(':');
        if (m !== game.matchId || (!want.includes(Number(si)) && !voices.has(Number(si)))) drop(k);
      }
      const ctx = getContext();
      // a rebuilt context (engine.js#rebuild, iOS): the old voices died with the old one — drop them now (they must not report a
      // place), start again on the room clock once the new one runs
      if (dest && ctx && dest.context !== ctx) { voices.clear(); dest = null; restarts++; }
      if (!ctx || ctx.state !== 'running') return null;
      if (!dest) dest = connect(ctx);
      // a voice whose song isn't wanted any more (a jump in time): out, quickly
      for (const i of [...voices.keys()]) if (!want.includes(i)) stopVoice(ctx, i, 0.3);
      for (const i of want) {
        if (voices.has(i) || done.has(i) || i < minIndex) continue;
        if (t > starts[i] + game.sd[i] - 300) { done.add(i); continue; }
        start(ctx, i, starts);
      }
      // after a suspension the ctx clock stopped while the server clock ran on: re-place the song (twice a second)
      if (performance.now() - lastCheck > 500) {
        lastCheck = performance.now();
        for (const [i, v] of [...voices]) {
          if (Math.abs(v.origin - (ctxAtServer(starts[i]) - speakerLead())) > RESYNC_S && ctx.currentTime - v.startedAt > 0.5) {
            restarts++;
            // (APP FIXES — Grok 3.5: the replacement first; the old voice goes only once it started — else it plays on)
            voices.delete(i);
            if (start(ctx, i, starts)) fadeOut(ctx, v, 0.08);
            else if (!voices.has(i)) voices.set(i, v);
          }
        }
      }
      return ctx;
    },
    /** never play songs before index i here (it only ever moves forward) */
    setMinIndex(i) { if (i > minIndex) minIndex = i; },
    /** is a song sounding right now? */
    playing() { return voices.size > 0; },
    /** the song sounding loudest right now: { i, id, at (s into it) } or null */
    now() {
      const ctx = getContext();
      // (APP FIXES — Grok 3.4: a suspended / interrupted / frozen graph sounds nothing — never report a place from it)
      if (!ctx || !game || !voices.size || ctx.state !== 'running' || clockFrozen()) return null;
      let best = null;
      // (NIGHT-C: a song scheduled to START LATER — the next one, decoded + queued ahead of its crossfade — isn't sounding yet: its gain
      // node reads its intrinsic 1 before its first scheduled value, which made it "the loudest" (the beat followed the wrong song))
      // (ATM-C — THE PANEL PARTY ON miss, found at last: a voice JOINING MID-SONG has its origin in the past but starts ~50 ms from now — its
      // gain read the same intrinsic 1 for that moment, so the song was "heard" once at full volume, then not at all while its real fade-in
      // was still under 0.05: the check sampled the false yes, then null. Nothing sounds before a voice's own start (+ a render quantum or
      // two for the audio thread to post the first scheduled value).)
      for (const [i, v] of voices) { if (ctx.currentTime < v.startAt + 0.02) continue; const g = v.gain.gain.value; if (!best || g > best.g) best = { i, g, at: ctx.currentTime - v.origin }; }
      return best && best.g > 0.05 ? { i: best.i, id: game.songs[best.i], at: Math.max(0, best.at) } : null;
    },
    /** is song i decoded and ready? */
    ready(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && e.buf); },
    /** did song i fail to load / decode? (SKY-A: the party's own player then covers) */
    failed(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && e.failed); },
    debug() {
      const ctx = getContext();
      return {
        decoded: [...bufs].filter(([, e]) => e.buf).map(([k]) => k), restarts, failures, connected: !!dest,
        slots: game ? [...voices].filter(([, v]) => !ctx || v.gain.context === ctx).map(([i, v]) => (   // (a rebuilt context: the old one's voices are gone, not 'playing')
          { id: game.songs[i], i, t: ctx ? +(ctx.currentTime - v.origin).toFixed(2) : 0, paused: false, gain: +v.gain.gain.value.toFixed(3) })) : [],
      };
    },
    // (APP FIXES — Grok 3.2 / 3.6: the fade the caller asks for — a legendary's hold / a dead graph ≈ 0.25 s — and the node connect()
    // made is disconnected once the fade is over: every station change used to leave one more gain on the music bus)
    stop(fade = 0.6) {
      stopped = true;
      const ctx = getContext();
      if (ctx) for (const i of [...voices.keys()]) stopVoice(ctx, i, fade);
      voices.clear();
      for (const k of [...bufs.keys()]) drop(k);   // (E2 (b): back to the shared cache — the rebuild's new player picks them up)
      const d = dest;
      dest = null;
      if (d) setTimeout(() => { try { d.disconnect(); } catch { /* gone */ } }, (fade + 0.1) * 1000);
    },
  };
}
