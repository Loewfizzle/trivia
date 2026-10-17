// PRISM DROP audio.
//
// SONGS. Each match plays the room playlist's songs on the server clock: song i starts at songStarts(game)[i],
// so everyone (and anyone who rejoins) hears the same moment. Like PULSE, each song is fetched and decoded ONCE
// into an AudioBuffer and scheduled on the audio clock (pulse/clock.js#ctxAtServer: "heard at server time X") —
// sample-accurate, nothing to correct while it plays, no seeking. (A first version streamed <audio> elements
// and nudged their speed / seeked them toward the server clock every frame; on phones, where an element's
// reported position is coarse, that warbled and stuttered constantly.)
// Each song -> its own gain (crossfades are scheduled automation) -> one low-pass filter (DANGER: the stack near
// the top pulls it toward an "underwater" 600 Hz) -> a lift gain (FINAL DUEL: a sweep + a small swell) -> the
// music bus (the Music slider still rules). Only the playing song and (≤ 45 s before its crossfade) the next one
// are kept decoded. If the context was suspended (app in the background) the clock map shifts: the song is
// restarted at the right spot once, with a short fade.
//
// MUSICAL SFX. Every effect is synthesized in the current song's key and scale (data/prism/prismN.json:
// tonic + mode), soft and round, with a shared reverb, on the SFX bus. Line clears are scheduled on the song's
// next 16th note, on the same "heard at server time" clock as the song, so they land exactly in time.
import { getContext, getMusicBus, getSfxBus } from '../../audio/engine.js';
import { serverNow } from '../../firebase.js';
import { settings } from '../../audio/settings.js';
import { ctxAtServer } from '../pulse/clock.js';
import { songStarts, XF_MS } from './logic.js';
import { songUrl, beatClock } from './songs.js';

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const PENT = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ================================================================ songs
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

export function createSongPlayer() {
  let chain = null;      // { filter, lift, out }
  let game = null;
  let danger = 0;
  let duelAt = null;
  let duelDone = false;
  let stopped = false;
  let finaleAt = null;
  let lastCheck = 0;
  let restarts = 0;
  const bufs = new Map();    // `${matchId}:${i}` -> { buf, failed }
  const voices = new Map();  // song index -> { src, gain, origin, startedAt }
  const done = new Set();    // song indexes that played to their end (never restart)

  const keyOf = i => `${game.matchId}:${i}`;

  function build(ctx) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 0.7;
    const lift = ctx.createGain();
    lift.gain.value = 1;
    const out = ctx.createGain();
    out.gain.value = 1;
    filter.connect(lift).connect(out).connect(getMusicBus());
    return { filter, lift, out };
  }

  function load(i) {
    const k = keyOf(i);
    if (bufs.has(k)) return;
    const e = { buf: null, failed: false };
    bufs.set(k, e);
    decode(songUrl(game.songs[i])).then(b => { e.buf = b; }).catch(err => { e.failed = true; console.warn('prism song', err && err.message); });
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
    src.connect(gain).connect(chain.filter);
    const g = gain.gain;
    const ctxOf = ms => origin + (ms - starts[i]) / 1000;
    // fade in: a crossfade from the previous song, or a short ramp when joining mid-song
    if (i > 0 && off < XF_MS / 1000) {
      g.setValueAtTime(0, at);
      g.linearRampToValueAtTime(Math.min(1, (off + 0.001) / (XF_MS / 1000)), at + 0.001);
      g.linearRampToValueAtTime(1, origin + XF_MS / 1000);
    } else if (off > 0.02) {
      g.setValueAtTime(0, at);
      g.linearRampToValueAtTime(1, at + 0.15);
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

  function tick() {
    if (!game || stopped || !game.songs || !game.songs.length) return;
    const t = serverNow();
    const starts = songStarts(game);
    const want = wanted(t, starts);
    for (const i of want) load(i);
    // drop decoded songs we no longer need (a decoded song is tens of MB)
    for (const k of [...bufs.keys()]) {
      const [m, si] = k.split(':');
      if (m !== game.matchId || (!want.includes(Number(si)) && !voices.has(Number(si)))) bufs.delete(k);
    }
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return;
    if (!chain) chain = build(ctx);
    for (const i of want) {
      if (voices.has(i) || done.has(i)) continue;
      if (t > starts[i] + game.sd[i] - 300) { done.add(i); continue; }
      start(ctx, i, starts);
    }
    // after a suspension (background, a call, the iOS keyboard) the ctx clock stopped while the server clock ran
    // on: if a song is no longer where the server clock says, restart it there (checked twice a second)
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
    // danger: the music sinks under water as the stack nears the top
    const target = danger > 0.01 ? 20000 * Math.pow(600 / 20000, Math.min(1, danger)) : 20000;
    if (!duelAt || duelDone) chain.filter.frequency.setTargetAtTime(target, ctx.currentTime, 0.25);
    // final duel: one sweep up from a muffled 350 Hz + a small swell that stays
    if (duelAt && !duelDone && t >= duelAt) {
      duelDone = true;
      const now = ctx.currentTime;
      chain.filter.frequency.cancelScheduledValues(now);
      chain.filter.frequency.setValueAtTime(350, now);
      chain.filter.frequency.exponentialRampToValueAtTime(20000, now + 2.6);
      chain.lift.gain.cancelScheduledValues(now);
      chain.lift.gain.setValueAtTime(chain.lift.gain.value, now);
      chain.lift.gain.linearRampToValueAtTime(1.22, now + 2.6);
    }
    if (finaleAt && t >= finaleAt) {
      chain.out.gain.setTargetAtTime(0, ctx.currentTime, 0.9);
      finaleAt = null;
    }
  }

  return {
    setGame(g) {
      if (game && g && game.matchId !== g.matchId) { const ctx = getContext(); if (ctx) for (const i of [...voices.keys()]) stopVoice(ctx, i, 0.3); done.clear(); }
      game = g;
      duelAt = g && g.duelAt ? g.duelAt : duelAt;
    },
    setDanger(d) { danger = Math.max(0, Math.min(1, d)); },
    setDuel(at) { if (at && !duelAt) duelAt = at; },
    /** fade the songs out (results) from server time `at` */
    fadeOutAt(at) { finaleAt = at; },
    tick,
    /** is song i decoded and ready? (the view waits on it for the countdown) */
    ready(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && e.buf); },
    debug() {
      const ctx = getContext();
      return {
        ready: !!chain, filter: chain ? Math.round(chain.filter.frequency.value) : null, lift: chain ? +chain.lift.gain.value.toFixed(3) : 1,
        decoded: [...bufs].filter(([, e]) => e.buf).map(([k]) => k), restarts,
        slots: [...voices].map(([i, v]) => ({ id: game.songs[i], i, t: ctx ? +(ctx.currentTime - v.origin).toFixed(2) : 0, paused: false, gain: +v.gain.gain.value.toFixed(3) })),
      };
    },
    stop() {
      stopped = true;
      const ctx = getContext();
      if (ctx) for (const i of [...voices.keys()]) stopVoice(ctx, i, 0.6);
      bufs.clear();
      if (chain) setTimeout(() => { try { chain.filter.disconnect(); chain.lift.disconnect(); chain.out.disconnect(); } catch { /* fine */ } }, 900);
    },
  };
}

// ================================================================ musical sfx
export function createSynth() {
  let ctx = null;
  let bus = null;
  let dry = null;
  let verb = null;
  let tonic = 0;
  let mode = 'minor';
  let walk = 2;
  let lastMove = 0;
  let clockFn = null; // () => { pos (song seconds now), clk (beatClock) } | null
  const log = []; // test hook: what was played, in which key, when (song position)

  function ensure() {
    const c = getContext();
    if (!c) return false;
    if (ctx === c) return true;
    ctx = c;
    bus = ctx.createGain();
    bus.gain.value = 0.9;
    bus.connect(getSfxBus());
    dry = ctx.createGain();
    dry.gain.value = 1;
    dry.connect(bus);
    verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.6, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet).connect(bus);
    return true;
  }

  function impulse(c, seconds, decay) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp = lp * 0.72 + (Math.random() * 2 - 1) * 0.28; // a soft, dark tail
        d[i] = lp * Math.pow(1 - t, decay) * (i < 64 ? i / 64 : 1);
      }
    }
    return buf;
  }

  // scale degree -> MIDI note (deg 0 = tonic in octave `oct`, C4 = 60)
  const note = (deg, oct = 5, pent = false) => {
    const sc = pent ? PENT[mode] : SCALES[mode];
    const n = sc.length;
    const o = Math.floor(deg / n);
    return 12 * (oct + 1) + tonic + sc[((deg % n) + n) % n] + 12 * o;
  };

  function out(node, rev) {
    node.connect(dry);
    if (rev > 0) { const s = ctx.createGain(); s.gain.value = rev; node.connect(s).connect(verb); }
  }

  function pluck(midi, at, { gain = 0.08, dur = 0.18, bright = 2200, rev = 0.25, type = 'triangle' } = {}) {
    const f = mtof(midi);
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2.0, at);
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(bright, at);
    lp.frequency.exponentialRampToValueAtTime(Math.max(200, bright * 0.25), at + dur);
    lp.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g);
    out(g, rev);
    o.start(at); o2.start(at);
    o.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
  }

  // crystalline FM bell
  function bell(midi, at, { gain = 0.06, dur = 1.2, rev = 0.5, ratio = 3.5 } = {}) {
    const f = mtof(midi);
    const c = ctx.createOscillator();
    c.type = 'sine';
    c.frequency.setValueAtTime(f, at);
    const m = ctx.createOscillator();
    m.type = 'sine';
    m.frequency.setValueAtTime(f * ratio, at);
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 1.6, at);
    mg.gain.exponentialRampToValueAtTime(f * 0.05, at + dur * 0.6);
    m.connect(mg).connect(c.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0004, at + dur);
    c.connect(g);
    out(g, rev);
    c.start(at); m.start(at);
    c.stop(at + dur + 0.05); m.stop(at + dur + 0.05);
  }

  // warm detuned pad (chords)
  function pad(midis, at, { gain = 0.05, attack = 0.12, hold = 0.6, release = 2.2, rev = 0.6, bright = 2600 } = {}) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(bright * 0.4, at);
    lp.frequency.linearRampToValueAtTime(bright, at + attack + 0.2);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, bright * 0.3), at + attack + hold + release);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + attack);
    g.gain.setValueAtTime(gain, at + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0004, at + attack + hold + release);
    lp.connect(g);
    out(g, rev);
    const end = at + attack + hold + release + 0.05;
    for (const m of midis) for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(mtof(m), at);
      o.detune.setValueAtTime(det, at);
      const og = ctx.createGain();
      og.gain.value = 1 / (midis.length * 2);
      o.connect(og).connect(lp);
      o.start(at);
      o.stop(end);
    }
  }

  function thump(at, { gain = 0.22, from = 130, to = 42, dur = 0.22 } = {}) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur + 0.08);
    o.connect(g);
    out(g, 0.08);
    o.start(at);
    o.stop(at + dur + 0.12);
  }

  function noise(at, { gain = 0.06, dur = 0.25, from = 3000, to = 300, q = 0.7 } = {}) {
    const len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(from, at);
    f.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(f).connect(g);
    out(g, 0.3);
    s.start(at);
  }

  // the next 16th note of the song (ctx time) — so clears land in time
  function q16(extra = 0) {
    const now = ctx.currentTime;
    const c = clockFn && clockFn();
    if (!c || !c.clk) return { at: now + 0.01, step: 0.12 };
    const { pos, clk } = c;
    const p = clk.period;
    const step = p / 4;
    const bi = clk.indexAt(pos);
    const bt = clk.timeOf(bi);
    const k = Math.ceil((pos - bt + 0.015) / step);
    const tNext = bt + k * step + extra * step;
    // heard at the same moment as that point of the song (same clock map as the song itself)
    const at = c.start != null ? ctxAtServer(c.start + tNext * 1000) : now + (tNext - pos);
    return { at: Math.max(now + 0.005, at), step, songAt: tNext };
  }

  const record = (name, notes, songAt) => { log.push({ name, notes, songAt, key: tonic, mode }); if (log.length > 400) log.shift(); };

  const SOUNDS = {
    move() {
      const now = ctx.currentTime;
      if (now - lastMove < 0.035) return;
      lastMove = now;
      walk = Math.max(0, Math.min(9, walk + (Math.random() < 0.5 ? -1 : 1)));
      const m = note(walk, 5, true);
      pluck(m, now + 0.002, { gain: 0.03, dur: 0.07, bright: 2400, rev: 0.12 });
      record('move', [m]);
    },
    rotate({ dir = 1 } = {}) {
      const m = note(walk + (dir > 0 ? 2 : 1), 5, true);
      pluck(m, ctx.currentTime + 0.002, { gain: 0.04, dur: 0.09, bright: 3200, rev: 0.16 });
      record('rotate', [m]);
    },
    lock() {
      const m = note(0, 3);
      pluck(m, ctx.currentTime + 0.002, { gain: 0.07, dur: 0.14, bright: 900, rev: 0.1 });
      record('lock', [m]);
    },
    hard() {
      const at = ctx.currentTime + 0.002;
      thump(at, { gain: 0.2 });
      const m = note(0, 2);
      pluck(m, at, { gain: 0.1, dur: 0.22, bright: 700, rev: 0.08 });
      record('hard', [m]);
    },
    hold() {
      const m = note(4, 6, true);
      bell(m, ctx.currentTime + 0.002, { gain: 0.03, dur: 0.6, rev: 0.4, ratio: 2.01 });
      record('hold', [m]);
    },
    clear({ lines = 1, combo = 0 } = {}) {
      const q = q16();
      const base = 2 + Math.min(10, Math.max(0, combo)); // combos climb the scale
      let degs;
      if (lines >= 4) degs = [0, 1, 2, 3, 4, 5, 6, 7].map(d => base + d);
      else if (lines === 3) degs = [base, base + 2, base + 4];
      else if (lines === 2) degs = [base, base + 2];
      else degs = [base];
      const notes = degs.map(d => note(d, 5));
      notes.forEach((m, i) => pluck(m, q.at + i * q.step, { gain: 0.085, dur: 0.32, bright: 3800, rev: 0.35 }));
      if (lines >= 4) {
        const top = q.at + notes.length * q.step;
        [7, 9, 11, 14].forEach((d, i) => bell(note(base + d, 5), top + i * 0.035, { gain: 0.035, dur: 1.8, rev: 0.7 }));
      }
      record('clear', notes, q.songAt);
    },
    twist() {
      const q = q16();
      const a = note(7, 6), b = note(11, 6);
      bell(a, q.at, { gain: 0.07, dur: 1.6, rev: 0.6 });
      bell(b, q.at + q.step / 2, { gain: 0.05, dur: 1.8, rev: 0.6 });
      record('twist', [a, b], q.songAt);
    },
    pc() {
      const q = q16();
      const notes = [0, 2, 4, 8, 9 + 2].map((d, i) => note(d, i < 3 ? 4 : 5));
      pad(notes, q.at, { gain: 0.07, attack: 0.15, hold: 0.8, release: 2.6, rev: 0.7 });
      [7, 9, 11, 14, 16].forEach((d, i) => bell(note(d, 5), q.at + 0.06 * i, { gain: 0.03, dur: 2, rev: 0.7 }));
      record('pc', notes, q.songAt);
    },
    incoming() {
      const at = ctx.currentTime + 0.01;
      const a = note(0, 2), b = note(1, 2);
      for (let i = 0; i < 3; i++) {
        pluck(a, at + i * 0.11, { gain: 0.06 - i * 0.012, dur: 0.12, bright: 500, rev: 0.05, type: 'sawtooth' });
        pluck(b, at + i * 0.11, { gain: 0.035 - i * 0.008, dur: 0.12, bright: 500, rev: 0.05, type: 'sawtooth' });
      }
      record('incoming', [a, b]);
    },
    junk() {
      const at = ctx.currentTime + 0.002;
      noise(at, { gain: 0.09, dur: 0.2, from: 600, to: 120, q: 0.9 });
      thump(at, { gain: 0.14, from: 90, to: 38, dur: 0.18 });
      record('junk', []);
    },
    ko() {
      const q = q16();
      const notes = [9, 7, 4, 0].map(d => note(d, 5));
      notes.forEach((m, i) => bell(m, q.at + i * q.step * 0.75, { gain: 0.06, dur: 0.9, rev: 0.5 }));
      noise(q.at, { gain: 0.035, dur: 0.6, from: 6000, to: 400 });
      record('ko', notes, q.songAt);
    },
    badge() {
      const at = ctx.currentTime + 0.01;
      const notes = [0, 1, 2, 3, 4, 5].map(d => note(d + 5, 6, true));
      notes.forEach((m, i) => bell(m, at + i * 0.045, { gain: 0.03, dur: 0.7, rev: 0.6, ratio: 2.76 }));
      record('badge', notes);
    },
    duel() {
      const at = ctx.currentTime + 0.01;
      thump(at, { gain: 0.26, from: 110, to: 32, dur: 0.5 });
      const notes = [note(0, 2), note(4, 2), note(7, 2), note(0, 3)];
      pad(notes, at, { gain: 0.08, attack: 0.02, hold: 0.4, release: 3.2, rev: 0.8, bright: 1800 });
      noise(at, { gain: 0.05, dur: 1.4, from: 200, to: 6000 });
      record('duel', notes);
    },
    count({ go = false, at = null } = {}) {
      const t = at != null ? at : ctx.currentTime + 0.005;
      if (go) {
        const notes = [note(0, 4), note(2, 4), note(4, 4), note(7, 5)];
        pad(notes, t, { gain: 0.06, attack: 0.01, hold: 0.25, release: 1.6, rev: 0.6 });
        bell(note(7, 6), t, { gain: 0.05, dur: 1.4, rev: 0.6 });
        record('go', notes);
      } else {
        const m = note(4, 5);
        bell(m, t, { gain: 0.05, dur: 0.6, rev: 0.4 });
        record('count', [m]);
      }
    },
    finale({ at = null } = {}) {
      const t = at != null ? at : ctx.currentTime + 0.01;
      const notes = [note(0, 3), note(4, 3), note(0, 4), note(2, 4), note(4, 4), note(7, 4)];
      pad(notes, t, { gain: 0.08, attack: 0.02, hold: 1.2, release: 3.5, rev: 0.8 });
      [0, 2, 4, 7, 9, 11, 14].forEach((d, i) => bell(note(d, 5), t + i * 0.07, { gain: 0.035, dur: 2.4, rev: 0.75 }));
      thump(t, { gain: 0.2, from: 100, to: 36, dur: 0.6 });
      record('finale', notes);
    },
    topout() {
      const at = ctx.currentTime + 0.01;
      const notes = [note(4, 4), note(2, 4), note(0, 4), note(-3, 4)];
      notes.forEach((m, i) => pluck(m, at + i * 0.13, { gain: 0.07, dur: 0.5, bright: 1400 - i * 250, rev: 0.5 }));
      record('topout', notes);
    },
    level() {
      const q = q16();
      const notes = [note(4, 5), note(7, 5)];
      notes.forEach((m, i) => bell(m, q.at + i * q.step, { gain: 0.04, dur: 1, rev: 0.5 }));
      record('level', notes, q.songAt);
    },
  };

  return {
    setKey(t, m) { tonic = ((t | 0) % 12 + 12) % 12; mode = m === 'major' ? 'major' : 'minor'; },
    setClock(fn) { clockFn = fn; },
    play(name, opts) {
      if (settings.muted || !ensure() || ctx.state !== 'running') return;
      const fn = SOUNDS[name];
      if (fn) { try { fn(opts); } catch (e) { console.warn('prism sfx', name, e && e.message); } }
    },
    /** ctx time for a song position (seconds) of the current song, for scheduling the countdown on the beat */
    ctxAt(songSec) {
      if (!ensure()) return null;
      const c = clockFn && clockFn();
      if (!c) return null;
      return c.start != null ? Math.max(ctx.currentTime + 0.005, ctxAtServer(c.start + songSec * 1000)) : ctx.currentTime + (songSec - c.pos);
    },
    scale: () => ({ tonic, mode, notes: SCALES[mode].map(s => (tonic + s) % 12) }),
    log,
  };
}

export { beatClock };
