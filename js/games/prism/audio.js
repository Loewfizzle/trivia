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
import { getContext, getMusicBus, getSfxBus, getMaster, isUnlocked } from '../../audio/engine.js';
import { serverNow } from '../../firebase.js';
import { settings } from '../../audio/settings.js';
import { ctxAtServer, heard } from '../pulse/clock.js';
import { createSyncedSongs, speakerLead } from '../../audio/synced-songs.js';
import { createOnsets, onsetStep, createLead, leadKick, leadState, kickLag } from '../../core/harbor-beat.js';
import { songUrl, beatClock, loadManifest } from './songs.js';
import { heardSongPos, serverSongPos, ctxForSongTime, unreportedOut, kickErr, leadGrid } from './sync.js';
import { LOCK_WANDER_CENTS, keyShift, pitchedLockRate } from './sfx-key.js';

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
      inp.connect(lp).connect(an).connect(z).connect(getMaster() || ctx.destination);   // (CITY A — item 29: ONLY the master reaches the destination)
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
      if (v && c && c.state === 'running') {   // (a MUSIC gate — the synced song's own voice + clock: kept, CITY PART 1's sweep names it)
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
// SKINS 2A — A SKIN's SOURCED SOUNDS (docs/prism.md "THE SKINS" → the sounds; audio/sfx/prism/ + its CREDITS.md — scripts/build-prism-skin-sfx.py):
// a skin's `sounds.files` = { lock, clear } → a small mp3 each, FETCHED ONLY WHEN THE SKIN SHOWS (setVoices), decoded on the first context,
// played through the synth's own chain at the level of the code-made voice it replaces (SAMPLE_GAIN × the file's −8 dBFS peak ≈ the voice's
// own gain — quiet under the song). THE FALLBACK IS THE CODE-MADE VOICE: a file that is missing, still loading or will not decode = the
// synth's plip / swish / tap / rip plays, exactly as before — audio is polish, never a dependency.
export const SFX_DIR = new URL('../../../audio/sfx/prism/', import.meta.url).href;
/** how loud a file plays, by the voice it replaces — LEVELLED IN THE GAME (the owner's add-on, Nov 14): each skin's lock + clear measured on
 *  the SFX bus in the real view (tests/integration/prism-sfx-level.mjs — K-weighted, the loudest 400 ms) and set so they sit LEVEL WITH THE
 *  OTHER SKINS' (the crayon's / the neon's code-made lock + clear at 1, 2 and 4 lines) and under the song. As recorded, paper's clear sat
 *  1.6 – 3.2 dB under the others and watercolor's lock 2 dB under — hence these. A clear grows with its lines, as the code-made one does.
 *  NOTE_GAIN = the clear's own notes under a file. (A machine's balance — the owner's ear is the last word: these are the numbers to move.) */
export const SAMPLE_GAIN = Object.freeze({ plip: () => 0.176, tap: () => 0.18, swish: l => 0.09 + 0.035 * Math.min(4, l || 1), rip: l => 0.15 + 0.04 * Math.min(4, l || 1),
  // (SKINS 2B — the NIGHT skins' files, levelled the same way — the pixel's dense 8-bit blip + sting sit far under their −8 dBFS peak, the
  //  galaxy's chime + stardust whoosh are airy. Measured: locks −50.2 / −50.1 beside the neon's −50.2 · clears × 1 / 2 / 4 −43.7 / −40.2 /
  //  −35.2 (pixel) and −44.4 / −41.7 / −35.2 (galaxy) beside −44.2 / −41.0 / −35.0 — the song −34.3)
  blip: () => 0.076, chime: () => 0.1, chip: l => 0.03 + 0.03 * Math.min(4, l || 1), dust: l => [0.096, 0.096, 0.132, 0.146, 0.16][Math.max(0, Math.min(4, Math.round(l || 1)))] });
export const NOTE_GAIN = Object.freeze({ swish: 0.058, rip: 0.05, chip: 0.028, dust: 0.03 });
/** a 4-line clear's run of notes under a file is lifted this much (the other skins' 4-line run is the loudest thing they play) */
export const RUN_LIFT = 2;
/** a lock's file: its pitch varies ± this much each play (3 %) — an UNPITCHED file's (a drop, a paper tap) */
export const LOCK_PITCH = 0.03;
// PFIX-3 — S13 (FABLE REVIEW 2): THE PITCHED SKIN SOUNDS ARE KEYED TO THE SONG. The code-made voices always followed the song's key (setKey —
// each song's `tonic` + `mode`: data/prism/<id>.json, THE per-song key table); the SOURCED files were played as recorded — pixel's lock is a
// clear G, galaxy's lock + the shimmer of its clear a clear C: galaxy's C clashed under the D-major night song, both under three of the five
// day songs — and the lock's random ±3 % is ±51 cents (sour on its own note six plays in ten). A skin now names each pitched file's note
// (skins.js `sounds.pitch`: { lock: 7 } = G — a pitch class 0 … 11; a noise file has none) and the synth plays it at the rate that lands
// that note on the song's ROOT or FIFTH, whichever is nearer (never more than 3 semitones — a blip / a chime keeps its character; a file
// that rings a CHORD lands where the whole chord is in the scale — sfx-key.js); a pitched lock's wander is held inside
// ±LOCK_WANDER_CENTS. Levels unchanged (SAMPLE_GAIN). An unpitched file plays as before.
export { LOCK_WANDER_CENTS, keyShift, pitchedLockRate };   // (PURE — sfx-key.js: the unit tests import it without the audio engine)
const sampleBytes = new Map();   // file → Promise<ArrayBuffer | null> (the page's — fetched once)
const fetchSample = file => {
  if (!sampleBytes.has(file)) sampleBytes.set(file, fetch(`${SFX_DIR}${file}.mp3`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return sampleBytes.get(file);
};
/** the files a skin's sounds name ([] = none): only these are ever fetched for it (tests/prism-skins-2a.test.mjs) */
export const soundFiles = sounds => (sounds && sounds.files ? [...new Set(Object.values(sounds.files))] : []);
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
  let voices = {};    // (SKINS 1) a skin's own voices: name → the SOUNDS entry that plays instead
  let files = {};     // (SKINS 2A) the skin's sourced sounds: name ('lock' | 'clear') → its file — the voice's code-made sound is the fallback
  let pitch = {};     // (PFIX-3 — S13) the note of each PITCHED file: name → its pitch class (skins.js `sounds.pitch`); none = a noise file
  const bufs = new Map();   // file → AudioBuffer | Promise | null (this context's)
  let bufCtx = null;
  /** the skin's file for a sound, decoded → an AudioBuffer once it is ready; null = not (yet) → the code-made voice plays */
  function sample(name) {
    const f = files[name];
    if (!f || !ctx) return null;
    if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
    if (bufs.has(f)) { const b = bufs.get(f); return b && typeof b.then !== 'function' ? b : null; }
    const c = ctx;
    bufs.set(f, fetchSample(f).then(a => (a ? new Promise((res, rej) => c.decodeAudioData(a.slice(0), res, rej)) : null))
      .then(b => { if (bufCtx === c) bufs.set(f, b || null); }, () => { if (bufCtx === c) bufs.set(f, null); }));
    return null;
  }
  /** a decoded file through the synth's chain (the SFX bus, a little of the shared reverb); rate = its pitch (1 = as recorded) */
  function playBuf(buf, at, gain, rev = 0, rate = 1) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = rate;
    g.gain.value = gain;
    src.connect(g);
    out(g, rev);
    src.start(at);
  }
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

  const record = (name, notes, songAt, voice, file, rate) => { log.push({ name, notes, songAt, key: tonic, mode, ...(voice ? { voice } : {}), ...(file ? { file } : {}), ...(file && rate ? { rate } : {}) }); if (log.length > 400) log.shift(); };
  /** (the owner's add-on, Nov 14) a LOCK's file plays a little higher or lower each time — ± LOCK_PITCH (3 %) at random: a sound heard many
   *  times a minute never repeats exactly (a one-shot effect's own pitch — never a song's) */
  // (PFIX-3 — S13: a PITCHED lock (the skin names its note) lands on the song's root / fifth and wanders inside ±20 cents instead)
  const lockRate = () => (pitch.lock != null ? pitchedLockRate(pitch.lock, tonic, mode, Math.random()) : 1 + (Math.random() * 2 - 1) * LOCK_PITCH);
  /** a clear's file: as recorded — or, pitched, moved onto the song's root / fifth (no wander: it rings under the clear's own notes) */
  const clearRate = () => (pitch.clear != null ? keyShift(pitch.clear, tonic, mode).rate : 1);

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
    // ---- SKINS 1 — a skin's own voices (skins.js `sounds`: play('lock') / play('clear') sound these instead — setVoices). Code-made, QUIET,
    // in the song's key (note()), the clears on its 16ths (q16) with the same notes the synth's own clear plays (a combo still climbs the scale):
    // only the VOICE changes. The slam's thud is never swapped. Logged under the name the game played ('lock' / 'clear') + the voice.
    /** WATERCOLOR's lock: a soft wet PLIP — a drop's quick upward chirp on the tonic */
    plip() {
      const m = note(0, 5), b = sample('lock'), rate = lockRate();
      if (b) playBuf(b, ctx.currentTime + 0.002, SAMPLE_GAIN.plip(), 0, rate);   // (SKINS 2A: the sourced water drop — else the code-made chirp)
      else drip(m, ctx.currentTime + 0.002, { gain: 0.05, dur: 0.1 });
      record('lock', [m], undefined, 'plip', b ? files.lock : null, rate);
    },
    /** WATERCOLOR's clear: a brush SWISH (soft noise swept up + back) + a tiny DRIP on each of the clear's notes */
    swish({ lines = 1, combo = 0 } = {}) {
      const q = q16();
      const notes = clearNotes(lines, combo);
      // (SKINS 2A: the sourced brush swish + its drip replaces the code-made brush; the clear's own notes stay — quieter under a file — so a
      //  bigger clear / a combo still climbs the scale)
      const b = sample('clear');
      if (b) playBuf(b, q.at, SAMPLE_GAIN.swish(lines), 0.15);
      else brush(q.at, { gain: 0.035 + 0.008 * Math.min(4, lines), dur: 0.26 + 0.04 * Math.min(4, lines), lo: 700, hi: 3200 });
      notes.forEach((m, i) => drip(m, q.at + 0.05 + i * q.step, { gain: b ? NOTE_GAIN.swish * (lines >= 4 ? RUN_LIFT : 1) : 0.07, dur: 0.2, rev: 0.3 }));
      if (lines >= 4) {
        const top = q.at + notes.length * q.step, base = 2 + Math.min(10, Math.max(0, combo));
        [7, 9, 11, 14].forEach((d, i) => bell(note(base + d, 5), top + i * 0.035, { gain: 0.028, dur: 1.6, rev: 0.7 }));
      }
      record('clear', notes, q.songAt, 'swish', b ? files.clear : null);
    },
    /** PAPER CUT-OUT's lock: a papery TAP — a short dry tick of filtered noise + a muted tonic knock */
    tap() {
      const at = ctx.currentTime + 0.002, m = note(0, 4), b = sample('lock'), rate = lockRate();
      if (b) playBuf(b, at, SAMPLE_GAIN.tap(), 0, rate);   // (SKINS 2A: the sourced paper rustle + its thup — else the code-made tick + knock)
      else {
        noise(at, { gain: 0.045, dur: 0.035, from: 3800, to: 1600, q: 1.4 });
        pluck(m, at, { gain: 0.035, dur: 0.05, bright: 700, rev: 0.04 });
      }
      record('lock', [m], undefined, 'tap', b ? files.lock : null, rate);
    },
    /** PAPER CUT-OUT's clear: a short RIP (a crackle of noise torn upward) + a soft WHOOSH as the strip flies off, the clear's notes muted under it */
    rip({ lines = 1, combo = 0 } = {}) {
      const q = q16();
      const notes = clearNotes(lines, combo);
      // (SKINS 2A: the sourced paper rip + its lift whoosh replaces the code-made tear + brush; the clear's notes stay, quieter under a file)
      const b = sample('clear');
      if (b) playBuf(b, q.at, SAMPLE_GAIN.rip(lines), 0.1);
      else {
        tear(q.at, { gain: 0.05 + 0.008 * Math.min(4, lines), dur: 0.13 + 0.02 * Math.min(4, lines) });
        brush(q.at + 0.1, { gain: 0.03, dur: 0.3, lo: 500, hi: 1800 });
      }
      notes.forEach((m, i) => pluck(m, q.at + i * q.step, { gain: b ? NOTE_GAIN.rip * (lines >= 4 ? RUN_LIFT : 1) : 0.05, dur: 0.16, bright: 1500, rev: 0.2 }));
      if (lines >= 4) {
        const top = q.at + notes.length * q.step, base = 2 + Math.min(10, Math.max(0, combo));
        [7, 9, 11, 14].forEach((d, i) => bell(note(base + d, 5), top + i * 0.035, { gain: 0.026, dur: 1.5, rev: 0.65 }));
      }
      record('clear', notes, q.songAt, 'rip', b ? files.clear : null);
    },
    // ---- SKINS 2B — the NIGHT skins' voices (the same rules: the song's key, the clears on its 16ths, a file when the skin's is in — else code-made)
    /** ARCADE PIXEL's lock: an 8-bit BLIP — the sourced chip blip, else a short square tick on the tonic */
    blip() {
      const at = ctx.currentTime + 0.002, m = note(0, 5), b = sample('lock'), rate = lockRate();
      if (b) playBuf(b, at, SAMPLE_GAIN.blip(), 0, rate);
      else pluck(m, at, { gain: 0.06, dur: 0.05, bright: 5200, rev: 0, type: 'square' });
      record('lock', [m], undefined, 'blip', b ? files.lock : null, rate);
    },
    /** ARCADE PIXEL's clear: the sourced 8-bit rising STING under the clear's own notes as square chips (code-made: the chips alone, a touch louder) */
    chip({ lines = 1, combo = 0 } = {}) {
      const q = q16();
      const notes = clearNotes(lines, combo);
      const b = sample('clear');
      const crate = clearRate();
      if (b) playBuf(b, q.at, SAMPLE_GAIN.chip(lines), 0, crate);
      notes.forEach((m, i) => pluck(m, q.at + i * q.step, { gain: b ? NOTE_GAIN.chip * (lines >= 4 ? RUN_LIFT : 1) : 0.085, dur: 0.11, bright: 5200, rev: 0.05, type: 'square' }));
      if (lines >= 4) {
        const top = q.at + notes.length * q.step, base = 2 + Math.min(10, Math.max(0, combo));
        [7, 9, 11, 14].forEach((d, i) => pluck(note(base + d, 5), top + i * 0.035, { gain: b ? 0.02 : 0.04, dur: 0.2, bright: 5200, rev: 0.1, type: 'square' }));
      }
      record('clear', notes, q.songAt, 'chip', b ? files.clear : null, crate);
    },
    /** GALAXY's lock: a STAR CHIME — the sourced chime, else a small high bell on the tonic */
    chime() {
      const at = ctx.currentTime + 0.002, m = note(0, 6), b = sample('lock'), rate = lockRate();
      if (b) playBuf(b, at, SAMPLE_GAIN.chime(), 0.25, rate);
      else bell(m, at, { gain: 0.03, dur: 0.4, rev: 0.4, ratio: 2.76 });
      record('lock', [m], undefined, 'chime', b ? files.lock : null, rate);
    },
    /** GALAXY's clear: the sourced STARDUST WHOOSH + its shimmer under the clear's own notes as soft bells (code-made: a high brush of noise) */
    dust({ lines = 1, combo = 0 } = {}) {
      const q = q16();
      const notes = clearNotes(lines, combo);
      const b = sample('clear');
      const crate = clearRate();
      if (b) playBuf(b, q.at, SAMPLE_GAIN.dust(lines), 0.3, crate);
      else brush(q.at, { gain: 0.03 + 0.007 * Math.min(4, lines), dur: 0.4 + 0.05 * Math.min(4, lines), lo: 2200, hi: 7000 });
      notes.forEach((m, i) => bell(m, q.at + i * q.step, { gain: b ? NOTE_GAIN.dust * (lines >= 4 ? RUN_LIFT : 1) : lines >= 4 ? 0.055 : 0.043, dur: 0.7, rev: 0.6, ratio: 2.76 }));
      if (lines >= 4) {
        const top = q.at + notes.length * q.step, base = 2 + Math.min(10, Math.max(0, combo));
        [7, 9, 11, 14].forEach((d, i) => bell(note(base + d, 5), top + i * 0.035, { gain: 0.03, dur: 1.8, rev: 0.75 }));
      }
      record('clear', notes, q.songAt, 'dust', b ? files.clear : null, crate);
    },
  };
  /** the notes a clear plays (the synth's own rule — combos climb the scale; 4 lines = a run up) */
  function clearNotes(lines, combo) {
    const base = 2 + Math.min(10, Math.max(0, combo));
    const degs = lines >= 4 ? [0, 1, 2, 3, 4, 5, 6, 7].map(d => base + d) : lines === 3 ? [base, base + 2, base + 4] : lines === 2 ? [base, base + 2] : [base];
    return degs.map(d => note(d, 5));
  }
  /** a water DROP: a sine that chirps UP into its note (a fifth below → the note in ~35 ms), a quick soft decay */
  function drip(midi, at, { gain = 0.06, dur = 0.14, rev = 0.2 } = {}) {
    const f = mtof(midi);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.62, at);
    o.frequency.exponentialRampToValueAtTime(f, at + 0.035);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    o.connect(g);
    out(g, rev);
    o.start(at);
    o.stop(at + dur + 0.05);
  }
  /** a BRUSH / a whoosh: soft noise through a band that sweeps up then back, a slow swell in + out (never a click) */
  function brush(at, { gain = 0.04, dur = 0.3, lo = 700, hi = 3000 } = {}) {
    const len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(lo, at);
    f.frequency.exponentialRampToValueAtTime(hi, at + dur * 0.45);
    f.frequency.exponentialRampToValueAtTime(lo * 1.3, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + dur * 0.35);
    g.gain.linearRampToValueAtTime(0, at + dur);
    s.connect(f).connect(g);
    out(g, 0.15);
    s.start(at);
  }
  /** a TEAR: a crackle — noise chopped into uneven grains, high-passed, its band rising as the rip runs */
  function tear(at, { gain = 0.05, dur = 0.14 } = {}) {
    const len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let on = 1, left = 0;
    for (let i = 0; i < len; i++) {
      if (left-- <= 0) { on = Math.random() < 0.72 ? 1 : 0.12; left = 20 + Math.random() * 130; }
      d[i] = (Math.random() * 2 - 1) * on * (0.55 + 0.45 * (i / len));
    }
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.setValueAtTime(1400, at);
    f.frequency.exponentialRampToValueAtTime(3600, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.008);
    g.gain.setValueAtTime(gain, at + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, at + dur);
    s.connect(f).connect(g);
    out(g, 0.08);
    s.start(at);
  }

  return {
    setKey(t, m) { tonic = ((t | 0) % 12 + 12) % 12; mode = m === 'major' ? 'major' : 'minor'; },
    setClock(fn) { clockFn = fn; },
    /** SKINS 1 — a skin's own voices: { lock: 'plip', clear: 'swish' } = play('lock') sounds SOUNDS.plip (skins.js `sounds`); {} = the synth's own */
    /** SKINS 2A — + its SOURCED sounds (`files`: { lock, clear }): fetched NOW (the skin shows — never before, never another skin's) and
     *  decoded as soon as there is a context; until a file is ready — or if it never is — the voice's code-made sound plays */
    setVoices(v) {
      voices = v || {};
      files = (v && v.files) || {};
      pitch = (v && v.pitch) || {};
      for (const f of soundFiles(v)) fetchSample(f);
      if (ensure()) for (const name of Object.keys(files)) sample(name);
    },
    /** (the test hook) which of the skin's files are decoded + ready on this context */
    samplesReady: () => Object.keys(files).filter(name => !!sample(name)),
    play(name, opts) {
      if (settings.muted || !ensure() || !isUnlocked()) return;   // (CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP: an effect asks isUnlocked() — THE ONE GATE (engine.js), never the context's state)
      const fn = SOUNDS[voices[name]] || SOUNDS[name];
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
    destroy() { clockFn = null; ctx = bus = dry = verb = null; log.length = 0; bufs.clear(); bufCtx = null; files = {}; pitch = {}; },
  };
}

export { beatClock };
