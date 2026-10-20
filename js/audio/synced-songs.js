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
import { getContext } from './engine.js';
import { serverNow } from '../firebase.js';
import { ctxAtServer } from '../games/pulse/clock.js';
import { songStarts, XF_MS } from '../core/playlist.js';

const LOOKAHEAD_MS = 45_000; // decode the next song this long before its crossfade
const END_FADE = 1.5;        // seconds: the very end of the last song fades out

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
  const bufs = new Map();    // `${matchId}:${i}` -> { buf, failed }
  const voices = new Map();  // song index -> { src, gain, origin, startedAt }
  const done = new Set();    // song indexes that played to their end (never restart)
  const keyOf = i => `${game.matchId}:${i}`;

  function load(i) {
    const k = keyOf(i);
    if (bufs.has(k)) return;
    const e = { buf: null, failed: false };
    bufs.set(k, e);
    decode(urlFor(game.songs[i])).then(b => { e.buf = b; }).catch(err => { e.failed = true; console.warn(label, err && err.message); });
  }

  // which songs matter at server time t: the one playing, the next (close to its turn), the previous (still fading)
  function wanted(t, starts) {
    let cur = 0;
    while (cur + 1 < starts.length && t >= starts[cur + 1]) cur++;
    const w = [cur];
    if (cur + 1 < starts.length && starts[cur + 1] - t < LOOKAHEAD_MS) w.push(cur + 1);
    if (cur > 0 && t < starts[cur] + XF_MS) w.push(cur - 1);
    return w;
  }

  function start(ctx, i, starts) {
    const e = bufs.get(keyOf(i));
    if (!e || !e.buf) return;
    const buf = e.buf;
    const origin = ctxAtServer(starts[i]);             // ctx time at which position 0 is heard
    const at = Math.max(ctx.currentTime + 0.05, origin);
    const off = at - origin;
    if (off >= buf.duration - 0.25) { done.add(i); return; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    src.connect(gain).connect(dest);
    const g = gain.gain;
    const ctxOf = ms => origin + (ms - starts[i]) / 1000;
    // fade in: a crossfade from the previous song, or a short ramp when joining mid-song
    if (i > 0 && off < XF_MS / 1000) {
      g.setValueAtTime(0, at);
      g.linearRampToValueAtTime(Math.min(1, (off + 0.001) / (XF_MS / 1000)), at + 0.001);
      g.linearRampToValueAtTime(1, origin + XF_MS / 1000);
    } else if (off > 0.02) {
      g.setValueAtTime(0, at);
      g.linearRampToValueAtTime(1, at + joinFade);
    } else {
      g.setValueAtTime(1, at);
    }
    // fade out: into the next song, or at the very end of the last one
    const end = origin + buf.duration;
    if (i + 1 < starts.length) {
      const x0 = Math.max(at + 0.2, ctxOf(starts[i + 1]));
      g.setValueAtTime(1, x0);
      g.linearRampToValueAtTime(0, Math.max(x0 + 0.05, ctxOf(starts[i + 1] + XF_MS)));
    } else if (end - END_FADE > at + 0.2) {
      g.setValueAtTime(1, end - END_FADE);
      g.linearRampToValueAtTime(0, end);
    }
    src.onended = () => { if (voices.get(i) && voices.get(i).src === src) { voices.delete(i); done.add(i); } };
    src.start(at, off);
    voices.set(i, { src, gain, origin, startedAt: ctx.currentTime });
  }

  function stopVoice(ctx, i, fade = 0.12) {
    const v = voices.get(i);
    if (!v) return;
    voices.delete(i);
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
        if (m !== game.matchId || (!want.includes(Number(si)) && !voices.has(Number(si)))) bufs.delete(k);
      }
      const ctx = getContext();
      if (!ctx || ctx.state !== 'running') return null;
      if (!dest) dest = connect(ctx);
      for (const i of want) {
        if (voices.has(i) || done.has(i) || i < minIndex) continue;
        if (t > starts[i] + game.sd[i] - 300) { done.add(i); continue; }
        start(ctx, i, starts);
      }
      // after a suspension the ctx clock stopped while the server clock ran on: re-place the song (twice a second)
      if (performance.now() - lastCheck > 500) {
        lastCheck = performance.now();
        for (const [i, v] of [...voices]) {
          if (Math.abs(v.origin - ctxAtServer(starts[i])) > 0.12 && ctx.currentTime - v.startedAt > 0.5) {
            restarts++;
            stopVoice(ctx, i, 0.08);
            start(ctx, i, starts);
          }
        }
      }
      return ctx;
    },
    /** never play songs before index i here (it only ever moves forward) */
    setMinIndex(i) { if (i > minIndex) minIndex = i; },
    /** is a song sounding right now? */
    playing() { return voices.size > 0; },
    /** is song i decoded and ready? */
    ready(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && e.buf); },
    debug() {
      const ctx = getContext();
      return {
        decoded: [...bufs].filter(([, e]) => e.buf).map(([k]) => k), restarts,
        slots: game ? [...voices].map(([i, v]) => ({ id: game.songs[i], i, t: ctx ? +(ctx.currentTime - v.origin).toFixed(2) : 0, paused: false, gain: +v.gain.gain.value.toFixed(3) })) : [],
      };
    },
    stop() {
      stopped = true;
      const ctx = getContext();
      if (ctx) for (const i of [...voices.keys()]) stopVoice(ctx, i, 0.6);
      bufs.clear();
    },
  };
}
