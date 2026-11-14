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
//
// PD-5A — THE HEARD BEAT (sync.js + createHeardBeat below): every beat-timed visual reads the song AS HEARD (the sounding voice's own
// clock − SPEAKER DELAY − what the browser can't report − the measured lead), and the musical SFX schedule on the song's own clock
// (+ the lead) — never the server clock beside it. QUICK START: the songs stream in and start from their first slices
// (synced-songs.js `quick`). A day song's CUE-IN (game.cu) is inside the voice's origin.
import { getContext, getMusicBus, getSfxBus } from '../../audio/engine.js';
import { serverNow } from '../../firebase.js';
import { settings } from '../../audio/settings.js';
import { ctxAtServer, heard } from '../pulse/clock.js';
import { createSyncedSongs, speakerLead } from '../../audio/synced-songs.js';
import { createOnsets, onsetStep, createLead, leadKick, leadState, kickLag } from '../../core/harbor-beat.js';
import { songUrl, beatClock, loadManifest } from './songs.js';
import { heardSongPos, serverSongPos, ctxForSongTime, unreportedOut, kickErr, leadGrid } from './sync.js';

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const PENT = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ================================================================ songs
/** THE DROP A Group 0 — THE DUCK's shape (s / dB): down in 20 ms, held 0.1 s, back over 0.12 s (~0.15 s of dip under the thud), −4 dB; one a DUCK_GAP */
export const DUCK_DB = 4, DUCK_IN = 0.02, DUCK_HOLD = 0.1, DUCK_OUT = 0.12, DUCK_GAP = 0.32;
export function createSongPlayer() {
  let chain = null;      // { filter, lift, out }
  // (PFIX-A — THE NIGHT GAIN: the manifest's `gain` (dB, a cut) per song — the night set played at the day set's −14.4 LUFS; the files untouched)
  const levels = new Map();
  loadManifest().then(list => { for (const x of list || []) if (Number(x.gain)) levels.set(x.id, Math.pow(10, Math.min(0, Number(x.gain)) / 20)); songs.relevel(); }).catch(() => {});
  let game = null;
  let danger = 0;
  let duelAt = null;
  let duelDone = false;
  let finaleAt = null;
  let kick = null;       // (PD-5A) the listener's reading this frame: { e (the low end's level), t (ctx s) }
  let wave = null;
  const songs = createSyncedSongs({
    urlFor: songUrl,
    label: 'prism song',
    quick: true,
    levelOf: id => levels.get(id) ?? 1,
    connect(ctx) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 20000;
      filter.Q.value = 0.7;
      const lift = ctx.createGain();
      lift.gain.value = 1;
      const out = ctx.createGain();
      out.gain.value = 1;
      // (THE DROP A Group 0 — THE DUCK: a short dip under every SLAM's thud, its own gain so the finale's fade + the duel's swell never fight it)
      const dk = ctx.createGain();
      dk.gain.value = 1;
      filter.connect(lift).connect(dk).connect(out).connect(getMusicBus());
      // THE LISTENER (PD-5A — the city's own, audio/beat.js#analyser: a 150 Hz low-pass → a 1024 analyser's time-domain RMS, pulled
      // through a silent gain, so its KICK_LAG holds): the songs' low end BEFORE the danger filter / the volume — its kicks only
      // calibrate the lead (createHeardBeat), they never time anything themselves
      const inp = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 150; lp.Q.value = 0.7;
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0;
      const z = ctx.createGain();
      z.gain.value = 0;
      inp.connect(filter);
      inp.connect(lp).connect(an).connect(z).connect(ctx.destination);
      wave = new Float32Array(an.fftSize);
      chain = { filter, lift, out, dk, inp, an, lp, z };
      return inp;
    },
  });

  function listen(ctx) {
    if (!chain || !chain.an || typeof chain.an.getFloatTimeDomainData !== 'function') { kick = null; return; }
    chain.an.getFloatTimeDomainData(wave);
    let s = 0;
    for (let i = 0; i < wave.length; i++) s += wave[i] * wave[i];
    kick = { e: Math.sqrt(s / wave.length), t: ctx.currentTime };
  }

  function tick() {
    const ctx = songs.tick();
    if (!ctx || !chain) { kick = null; return; }
    listen(ctx);
    const t = serverNow();
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

  // THE DROP A Group 0 (PD-6's review, Ben) — THE DUCK: on a SLAM the music dips DUCK_DB for ~0.15 s under the thud, then comes back — the thud
  // heard without getting louder. On the audio clock (scheduled automation — no timers); ONE dip at a time: a SLAM inside DUCK_GAP of the last
  // dip's start is skipped, so a spammed SLAM never stacks into a long dip (the music back between dips). No songs / no chain = nothing to duck.
  let duckAt = -1, ducks = 0;
  function duck() {
    if (!chain || !chain.dk) return false;
    const ctx = chain.dk.context, now = ctx.currentTime;
    if (duckAt >= 0 && now - duckAt < DUCK_GAP && now >= duckAt) return false;
    duckAt = now; ducks++;
    const g = chain.dk.gain, lo = Math.pow(10, -DUCK_DB / 20);
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(lo, now + DUCK_IN);
    g.setValueAtTime(lo, now + DUCK_IN + DUCK_HOLD);
    g.linearRampToValueAtTime(1, now + DUCK_IN + DUCK_HOLD + DUCK_OUT);
    return true;
  }

  return {
    duck,
    setGame(g) { songs.setGame(g); game = g; duelAt = g && g.duelAt ? g.duelAt : duelAt; },
    setDanger(d) { danger = Math.max(0, Math.min(1, d)); },
    setDuel(at) { if (at && !duelAt) duelAt = at; },
    /** fade the songs out (results) from server time `at` */
    fadeOutAt(at) { finaleAt = at; },
    tick,
    ready: i => songs.ready(i),
    /** (PD-5A) song i's voice { origin, part } | null · the loudest sounding song { i, at, origin } | null · this frame's kick reading */
    voice: i => songs.voice(i),
    levels: () => songs.levels(),
    now: () => songs.now(),
    kick: () => kick,
    debug() {
      return { ready: !!chain, filter: chain ? Math.round(chain.filter.frequency.value) : null, lift: chain ? +chain.lift.gain.value.toFixed(3) : 1, duck: chain ? +chain.dk.gain.value.toFixed(3) : 1, ducks, ...songs.debug(), levels: songs.levels() };
    },
    stop() {
      songs.stop();
      void game;
      if (chain) setTimeout(() => { try { chain.inp.disconnect(); chain.lp.disconnect(); chain.an.disconnect(); chain.z.disconnect(); chain.filter.disconnect(); chain.lift.disconnect(); chain.dk.disconnect(); chain.out.disconnect(); } catch { /* fine */ } }, 900);
    },
  };
}

// ================================================================ THE HEARD BEAT (PD-5A — sync.js has the maths)
/** the most the measured lead may trim (s): past it, the song's kicks aren't on its beats — the grid alone */
export const LEAD_CAP = 0.06;
const WEBKIT = typeof navigator !== 'undefined' && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Android/.test(navigator.userAgent);
/**
 * ONE clock for every beat-timed thing in a match: place(i, startMs, cue, clk) → { pos (the song AS HEARD, file s), atCtx(songT) (the ctx time
 * that lands ON song time songT as heard — the SFX, the countdown, the finale), songAtCtx(ctxT) (its inverse), lead (s), origin (the voice's,
 * or null on the server clock while the song loads) }. listen(i, clk) once a frame: a strong kick on the song's grid → the song's lead (the
 * city's estimator — core/harbor-beat.js#leadKick: bounded steps, only when the kicks agree; one lead per song, its own grid's offset).
 */
export function createHeardBeat(player) {
  const leads = new Map();
  const deaf = new Set();   // songs whose kicks sit OFF their beats (a syncopated groove): the grid alone, lead 0 — the city's "deaf song"
  const onsets = createOnsets();
  let lastFrame = 0, frameS = 1 / 60;
  const stamp = { v: 0, at: -1e9 };
  const leadOf = i => { if (!leads.has(i)) leads.set(i, createLead(null, 0)); return leads.get(i); };
  // the output latency an output timestamp implies (the city's beat.js#stampLatency): > 3 ms = the browser reports one
  function stampLat(c) {
    const now = performance.now();
    if (now - stamp.at < 250) return stamp.v;
    stamp.at = now;
    try {
      const ts = c.getOutputTimestamp && c.getOutputTimestamp();
      if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
        const l = (c.currentTime - ts.contextTime) - (now - ts.performanceTime) / 1000;
        if (l > 0.003 && l < 0.5) stamp.v = stamp.v ? stamp.v + (l - stamp.v) * 0.2 : l;
      }
    } catch { /* unsupported */ }
    return stamp.v;
  }
  function unreported() {
    const c = getContext();
    return c ? unreportedOut({ outputLatency: c.outputLatency || 0, stamp: stampLat(c), webkit: WEBKIT }) : 0;
  }
  return {
    place(i, startMs, cue, clk) {
      void clk;
      const lc = leadOf(i), L = deaf.has(i) || lc.fast ? 0 : lc.v, un = unreported(), spk = speakerLead();   // (a lead still settling is not applied yet)
      const v = player.voice(i);
      const c = getContext();
      if (v && c && c.state === 'running') {
        const origin = v.origin;
        return {
          pos: heardSongPos({ heardCtx: heard(), origin, speaker: spk, unreported: un, lead: L }),
          atCtx: songT => ctxForSongTime({ origin, songT, lead: L }),
          songAtCtx: t => t - origin - L,
          lead: L, origin, unreported: un, speaker: spk,
        };
      }
      // (no voice yet — the song still on its way: the room's clock, the same place the voice will take)
      const base = () => ctxAtServer(startMs) - spk - cue;
      return {
        pos: serverSongPos({ serverMs: serverNow(), startMs, cue, unreported: un, lead: L }),
        atCtx: songT => base() + songT + L,
        songAtCtx: t => t - base() - L,
        lead: L, origin: null, unreported: un, speaker: spk,
      };
    },
    listen(i, clk) {
      const now = performance.now();
      if (lastFrame) frameS += (Math.min(0.1, (now - lastFrame) / 1000) - frameS) * 0.1;
      lastFrame = now;
      const k = player.kick();
      if (!k || !clk) return;
      const hit = onsetStep(onsets, k.e, k.t);
      if (!(hit >= 0.6)) return;   // (a STRONG kick, as the city counts one)
      const v = player.voice(i);
      if (!v) return;
      if (deaf.has(i)) return;
      const c = leadOf(i);
      leadKick(c, kickErr(clk, k.t - v.origin, kickLag(frameS)), leadGrid(clk), now);
      // (the grid is the build's, checked against the sound: the lead only trims a small offset — kicks that pull it past LEAD_CAP are
      //  off the beats (Summer Felt Longer Then's sit ~100–340 ms early: a syncopated kick) → this song is the grid alone from here on)
      if (Math.abs(c.v) > LEAD_CAP) { deaf.add(i); c.v = 0; c.errs = []; c.res = null; c.fast = null; }
    },
    lead: i => leadOf(i).v,
    state: i => (deaf.has(i) ? { state: 'deaf', ms: 0, n: leadOf(i).seen } : leadState(leadOf(i), performance.now())),
    /** the tests + the beat check: the song's estimator (its residuals, s — relative to the applied lead) */
    raw: i => { const c = leadOf(i); return { v: c.v, errs: c.errs.slice(), seen: c.seen, res: c.res, deaf: deaf.has(i) }; },
  };
}

// ================================================================ musical sfx
// PFIX-A (FABLE REVIEW optional 18): ONE reverb a page — the convolver + its ~1 MB impulse were built per mount (31 after 30 matches).
// The synth's chain (bus → the sfx bus, dry, the reverb) is the AudioContext's, shared by every PRISM screen that context ever hosts.
let CHAIN = null;   // { ctx, bus, dry, verb }
/** (tests) how many reverbs this page has built */
export let reverbsBuilt = 0;
function chainFor(c) {
  if (CHAIN && CHAIN.ctx === c) return CHAIN;
  const bus = c.createGain();
  bus.gain.value = 0.9;
  bus.connect(getSfxBus());
  const dry = c.createGain();
  dry.gain.value = 1;
  dry.connect(bus);
  const verb = c.createConvolver();
  verb.buffer = impulse(c, 2.6, 2.4);
  reverbsBuilt++;
  const wet = c.createGain();
  wet.gain.value = 0.55;
  verb.connect(wet).connect(bus);
  CHAIN = { ctx: c, bus, dry, verb };
  return CHAIN;
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
    ({ bus, dry, verb } = chainFor(c));
    return true;
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

  // the next 16th note of the song (ctx time) — so clears land in time. (PD-5A: on the SONG's own clock — the sounding voice's origin
  // + the measured lead (clockFn().atCtx): the song + the sound leave through the same speaker, so they land together whatever its delay;
  // before, the server clock beside it put every clear SPEAKER DELAY late)
  function q16(extra = 0) {
    const now = ctx.currentTime;
    const c = clockFn && clockFn();
    if (!c || !c.clk || !c.atCtx) return { at: now + 0.01, step: 0.12 };
    const { clk } = c;
    const pos = c.songAtCtx(now);   // the song time being SCHEDULED now
    const p = clk.period;
    const step = p / 4;
    const bi = clk.indexAt(pos);
    const bt = clk.timeOf(bi);
    const k = Math.ceil((pos - bt + 0.015) / step);
    const tNext = bt + k * step + extra * step;
    return { at: Math.max(now + 0.005, c.atCtx(tNext)), step, songAt: tNext };
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
      // (PD-6 — THE SLAM's WEIGHT: a slightly heavier, deeper thud — the thump starts + ends lower (130 → 42 Hz was; 100 → 32 now) with a touch
      //  more body (a longer fall), the tonic pluck darker + longer; and a SOFT tonic an octave up, so a phone speaker (nothing much under
      //  ~100 Hz) still feels the weight — the low note implied. Still the song's key (note()), still under a clear (0.085 a note) — felt more
      //  than heard)
      const at = ctx.currentTime + 0.002;
      thump(at, { gain: 0.23, from: 100, to: 32, dur: 0.28 });
      const m = note(0, 2), m3 = note(0, 3);
      pluck(m, at, { gain: 0.1, dur: 0.3, bright: 520, rev: 0.08 });
      pluck(m3, at + 0.004, { gain: 0.035, dur: 0.16, bright: 900, rev: 0.06 });
      record('hard', [m, m3]);
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
      if (!c || !c.atCtx) return null;
      return Math.max(ctx.currentTime + 0.005, c.atCtx(songSec));
    },
    scale: () => ({ tonic, mode, notes: SCALES[mode].map(s => (tonic + s) % 12) }),
    log,
    /** PFIX-A: lets go of the clock (it holds the view) + the context's nodes (the shared chain stays the context's) */
    destroy() { clockFn = null; ctx = bus = dry = verb = null; log.length = 0; },
  };
}

export { beatClock };
