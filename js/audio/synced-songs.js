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
import { songEnvelope, envelopeFrom } from '../core/sync-math.js';
import { prefixCut, bytesPerSecond, frameTable, frameHeader } from '../core/mp3-slice.js';
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
// (PD-5A — QUICK START: `onPart` → the song is streamed and its FIRST SLICES are decoded as the bytes arrive (quickDecode) — each part
// handed to every player that wants the song; the whole decode still resolves `p`)
const keyFor = (url, fromS = 0) => (fromS >= RANGE_FROM_S ? `${url}#${fromS.toFixed(3)}` : url);
function acquire(url, onPart = null, need = null, fromS = 0, ff = 0) {
  prune();
  const key = keyFor(url, fromS);
  let e = decoded.get(key);
  if (!e) {
    e = { p: null, refs: 0, at: 0, part: null, subs: new Set() };
    const ent = e;
    e.p = onPart ? quickDecode(url, part => { if (!ent.full) { ent.part = part; for (const fn of ent.subs) fn(part); } }, need, fromS, ff) : decode(url);
    e.p.then(b => { ent.full = true; ent.buf = b; ent.part = null; }, () => {});   // (LOAD FIX 3: the buffer kept on the entry — a song already decoded is handed over at once, never a tick later)
    decodes++; decoded.set(key, e); e.p.catch(() => { if (decoded.get(key) === e) decoded.delete(key); });
  }
  if (onPart) { e.subs.add(onPart); if (e.part) onPart(e.part); }
  e.refs++;
  return e.p;
}
function release(url, onPart = null, fromS = 0) { const e = decoded.get(fromS >= RANGE_FROM_S ? `${url}#${fromS.toFixed(3)}` : url); if (!e) return; if (onPart) e.subs.delete(onPart); e.refs = Math.max(0, e.refs - 1); if (!e.refs) { e.at = Date.now(); prune(); } }
// LOAD FIX 3 — THE MUSIC ON THE TAP: the city's station song decoded AHEAD of the first tap (party-music.js#warmAhead — fetched + decoded
// on an OFFLINE context: no sound, no unlocked graph — after the city's reveal), held by a ref of its own until the player made at the tap
// has taken it: the tap then only unlocks + starts (LOAD FIX 2's known issue: the fetch + the decode ran after the tap — ½–1 s of silence)
const warmed = new Set();
export function warmSong(url) { if (warmed.has(url)) return; warmed.add(url); acquire(url); }
export function coolSong(url) { if (warmed.delete(url)) release(url); }
/** TESTS + THE AUDIO panel: the shared decodes (url → refs) and how many fetch + decodes this page has started */
export const songCache = () => ({ decodes, parts, held: [...decoded].map(([u, e]) => ({ url: u.split('/').pop(), refs: e.refs, part: e.part ? +e.part.endS.toFixed(1) : null, full: !!e.full, flow: flow.get(u.split('#')[0]) ? { ...flow.get(u.split('#')[0]), ago: Math.round(performance.now() - flow.get(u.split('#')[0]).t0) } : null })) });

function decodeBytes(ab) {
  // an offline context decodes without an unlocked (tapped) audio context
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const c = new AC(2, 1, 44100);
  return new Promise((resolve, reject) => c.decodeAudioData(ab, resolve, reject));
}
function decode(url) {
  return fetch(url).then(r => { if (!r.ok) throw new Error(`song ${r.status}`); return r.arrayBuffer(); }).then(decodeBytes);
}
// ---- PD-5A — QUICK START (docs/audio.md "QUICK START"): on slow signal a whole song (2–3 MB) took seconds to arrive + decode, and the
// match's first seconds were silent. Now the file is STREAMED (one request — no second download) and, while it arrives, slices of it are
// decoded from the bytes so far — always from the STREAM's first frame, so every slice's samples are the SAME samples as the whole decode
// of that stream (the same priming, the same bit reservoir): the player swaps slice → longer slice → whole on one sample (#swap), no seam,
// no double play. A slice is decoded only while the rest is still more than QUICK_MIN_S away (on good signal: one whole decode, as before).
//   PREFIX mode (a song played from its top): the stream = the file from byte 0 (the tag + the encoder's header kept).
//   RANGE mode (a song with a CUE-IN — its soft intro is never played): the stream = the file from a frame just before the cue (a Range
//   request; the first 4 KB fetched beside it say where the frames start + their size). A headerless decode lands LAME_DELAY samples LATER
//   than the whole file's trimmed decode — the same samples otherwise (measured in Chrome on every PRISM file: the difference 0) — so each
//   buffer carries the FILE time of its sample 0 (`bufferT0`). The intro's bytes are never fetched (Feeling Human Again: ~500 KB saved).
export const QUICK_STEPS = [12, 30, 75];   // (12 s first: GO can land ~6 s into an 80 BPM song — 3.2 s + up to a bar)
const QUICK_MIN_S = 1.2;
const QUICK_AHEAD = 6;    // a slice covers where the song will be: its place now + this (never less than the step)
const QUICK_MAX = 8;      // slices per song at most (each decodes the stream from its start: the work stays bounded — the short ones are cheap)
const QUICK_LOW_S = 45;   // a slice running low is re-cut from what has arrived only this far into the stream (past it: the steps, then the whole)
const RANGE_FROM_S = 1.5; // a cue-in at least this far in → RANGE mode
const RANGE_PRE_S = 0.5;  // with game.ff known: the stream starts this long before the cue (two lead frames + slack)
export const LAME_DELAY = 1105;   // samples (576 = LAME's encoder delay + 529 = the decoder's): a headerless slice's offset vs the whole file
let parts = 0;
const flow = new Map();   // url → { t0 (perf ms the fetch began), head (ms to the response), n (bytes so far), total, mode } — the AUDIO panel + the tests
const t0Of = new WeakMap();
/** the FILE time (s) of a decoded buffer's sample 0 — 0 for a whole file; a cue-in's RANGE stream: its first frame − LAME_DELAY */
export const bufferT0 = b => (b && t0Of.get(b)) || 0;

// RANGE mode's start: where the cue's frames are → { r (the streamed response from a frame boundary's byte), base (the file time of the
// stream's decoded sample 0), startS (the file time of its first frame), skip (bytes before that first frame) } | null (no ranges: prefix)
async function rangeFrom(url, fromS, ff = 0) {
  // ONE request when the file's first audio frame is known (game.ff — the build measured it): its frames placed from the stream's own header
  if (ff > 0) {
    const est = ff + Math.max(0, Math.floor((fromS - RANGE_PRE_S) * 14000));   // (112 kbps = 14 000 B/s; the frame found is placed exactly)
    const rb = await fetch(url, { headers: { Range: `bytes=${est}-` } });
    if (rb.status !== 206) { try { rb.body && rb.body.cancel(); } catch { /* gone */ } return null; }
    return { r: rb, est, first: ff, avg: 0, fs: 0, sr: 0 };   // (avg / fs / sr from the stream's first frame — quickDecode)
  }
  const est = Math.max(0, Math.floor((fromS - 1.5) * 14000));   // (PRISM's files are 112 kbps = 14 000 B/s; the frame found is placed exactly)
  const [ra, rb] = await Promise.all([fetch(url, { headers: { Range: 'bytes=0-4095' } }), fetch(url, { headers: { Range: `bytes=${est}-` } })]);
  if (ra.status !== 206 || rb.status !== 206) { try { rb.body && rb.body.cancel(); } catch { /* gone */ } return null; }
  const head = new Uint8Array(await ra.arrayBuffer());
  const ft = frameTable(head);
  const h = ft && ft.frames.length ? frameHeader(head, ft.frames[0]) : null;
  if (!h) { try { rb.body.cancel(); } catch { /* gone */ } return null; }
  const avg = (h.mpeg1 ? 144 : 72) * h.br / h.sr, fs = h.spf / h.sr;   // a CBR frame's average size (bytes) + length (s)
  return { r: rb, est, first: ft.frames[0], avg, fs, sr: h.sr };
}

async function quickDecode(url, onPart, need = null, fromS = 0, ff = 0) {
  const t0 = performance.now();
  const fl = { t0: Math.round(t0), head: null, n: 0, total: 0, mode: 'prefix' };
  flow.set(url, fl);
  let rg = fromS >= RANGE_FROM_S ? await rangeFrom(url, fromS, ff).catch(() => null) : null;
  const r = rg ? rg.r : await fetch(url);
  fl.head = Math.round(performance.now() - t0);
  if (!r.ok) throw new Error(`song ${r.status}`);
  if (!rg && (!r.body || typeof r.body.getReader !== 'function')) return decodeBytes(await r.arrayBuffer());
  const total = Number(r.headers.get('content-length')) || 0;
  fl.total = total;
  const reader = r.body.getReader();
  let chunks = [], n = 0, step = 0, bps = 0, busy = false, made = 0, lastS = 0;
  let skip = 0, startS = 0, base = 0;   // (RANGE: the bytes before the stream's first frame, that frame's file time, the decode's file time)
  const join = () => {
    if (chunks.length === 1) return chunks[0];
    const b = new Uint8Array(n); let o = 0;
    for (const c of chunks) { b.set(c, o); o += c.length; }
    chunks = [b];
    return b;
  };
  const tag = buf => { t0Of.set(buf, base); return buf; };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); n += value.length; fl.n = n;
    // RANGE: place the stream's first frame in the file (its absolute byte → its frame number) — or give up on it (the whole file instead)
    if (rg && !rg.placed) {
      if (n < 8192) continue;
      const loc = frameTable(join());
      if (loc && loc.frames.length && !rg.avg) {   // (one request: the CBR frame's size + length from the stream's own first frame)
        const h = frameHeader(join(), loc.frames[0]);
        if (h) { rg.avg = (h.mpeg1 ? 144 : 72) * h.br / h.sr; rg.fs = h.spf / h.sr; rg.sr = h.sr; }
      }
      const abs = loc && loc.frames.length && rg.avg ? rg.est + loc.frames[0] : -1;
      const k = abs >= 0 ? Math.round((abs - rg.first) / rg.avg) : -1;
      if (k < 0 || k * rg.fs > fromS - 2 * rg.fs) { try { reader.cancel(); } catch { /* gone */ } fl.mode = 'prefix (range missed)'; return quickDecode(url, onPart, need, 0); }
      rg.placed = true; skip = loc.frames[0]; startS = k * rg.fs; base = startS - LAME_DELAY / rg.sr; fl.mode = `range from ${startS.toFixed(2)} s`;
    }
    if (step >= QUICK_STEPS.length || busy || made >= QUICK_MAX) continue;
    if (!bps) { if (n - skip < 8192) continue; bps = bytesPerSecond(join().subarray(skip)) || 14000; }
    const pos = need ? Number(need()) || 0 : 0;   // the song's FILE position now (negative before it starts)
    // (all in the STREAM's seconds: s = the file time − startS)
    const at = Math.max(0, pos - startS);
    let want = Math.max(QUICK_STEPS[step], lastS + 8, at + QUICK_AHEAD);
    // (THE SONG IS DUE and nothing sounds yet — a slow line, a late fetch: whatever has arrived, if it covers this moment + 1 s; the next
    //  slices follow as the bytes come — the e2e's 8-phone run: ~17–24 KB/s, the room's own traffic sharing the line)
    const have = (n - skip - 2048) / bps;
    if (!made && need && pos > startS - 0.5 && have < want && have >= at + 1) want = have;
    // (a slice RUNNING LOW — under 3 s left — on a line barely faster than the song: re-cut from what has arrived, if that adds ≥ 2 s)
    else if (made && need && lastS < QUICK_LOW_S && lastS - at < 3 && have < want && have >= lastS + 2) want = have;
    if (n - skip < want * bps + 2048) continue;
    // (the rest arriving within QUICK_MIN_S anyway: no slice — the whole decode follows at once)
    const rate = n / Math.max(1, performance.now() - t0) * 1000;
    if (total && (total - n) / Math.max(1, rate) < QUICK_MIN_S) { step = QUICK_STEPS.length; continue; }
    const bytes = join().subarray(skip), cut = prefixCut(bytes, want);
    if (!cut) continue;
    while (step < QUICK_STEPS.length && QUICK_STEPS[step] <= cut.s + 0.01) step++;
    busy = true;
    parts++; made++; lastS = cut.s;
    const endS = startS + cut.s;
    decodeBytes(bytes.slice(0, cut.end).buffer)
      .then(buf => onPart({ buf: tag(buf), t0: base, endS: Math.min(endS, base + buf.duration) }), () => { /* the whole decode still comes */ })
      .finally(() => { busy = false; });
  }
  const all = join().subarray(skip);
  return decodeBytes(all.byteOffset === 0 && all.byteLength === all.buffer.byteLength ? all.buffer : all.slice().buffer).then(tag);
}

// (PD-5A) quick: stream + start from the first slices (quickDecode) · a song's CUE-IN = game.cu[i] (ms into the FILE where the room's
// schedule starts it: a soft intro skipped — the file untouched) · now() also gives the voice's ORIGIN (the ctx time of file position 0:
// PRISM's heard beat — games/prism/sync.js)
// (PFIX-A) levelOf(id) → a song's PLAYBACK LEVEL (linear, ≤ 1) — a gain node of its own after the voice's envelope, so a crossfade between
// two songs keeps each one's level and every envelope reading (the heard voice, the tests' gains) is the same as before. Absent = 1 (every
// other player: the lobby, the city's stations — unchanged).
export function createSyncedSongs({ urlFor, connect, label = 'song', joinFade = 0.15, quick = false, levelOf = null }) {
  let minIndex = 0;          // songs before this one are not played here (another player has them: the lobby's handoff)
  let dest = null;
  let game = null;
  let stopped = false;
  let lastCheck = 0;
  let restarts = 0;
  let failures = 0;          // voices whose start() threw (disconnected at once — APP FIXES, Grok 3.5)
  let swaps = 0;             // (PD-5A) part → longer part / whole song, on one sample
  const bufs = new Map();    // `${matchId}:${i}` -> { buf, part, failed }
  const voices = new Map();  // song index -> { src, gain, origin, startedAt, part, endS, env }
  const done = new Set();    // song indexes that played to their end (never restart)
  const keyOf = i => `${game.matchId}:${i}`;
  const cueOf = i => Math.max(0, Number(game && game.cu && game.cu[i]) || 0) / 1000;

  function load(i) {
    const k = keyOf(i);
    if (bufs.has(k)) return;
    const url = urlFor(game.songs[i]);
    const e = { buf: null, part: null, failed: false, url, sub: null };
    if (quick) e.sub = p => { if (!e.buf && (!e.part || p.endS > e.part.endS)) e.part = p; };
    bufs.set(k, e);
    // (the song's file position now — the quick start's slices cover it: the room's clock + its cue-in)
    const mid = game.matchId;
    const need = quick ? () => (game && game.matchId === mid ? (serverNow() - songStarts(game)[i]) / 1000 + cueOf(i) : 0) : null;
    e.from = quick ? cueOf(i) : 0;
    acquire(url, e.sub, need, e.from, quick ? Math.max(0, Number(game.ff && game.ff[i]) || 0) : 0).then(b => { e.buf = b; e.part = null; }).catch(err => { e.failed = true; console.warn(label, err && err.message); });
    // (LOAD FIX 3: decoded already — warmed before the tap, or another player's — the voice can start in THIS tick)
    const en = decoded.get(keyFor(url, e.from));
    if (en && en.buf) { e.buf = en.buf; e.part = null; }
  }
  const drop = k => { const e = bufs.get(k); if (!e) return; bufs.delete(k); release(e.url, e.sub, e.from || 0); };

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
  // the fade-out: into the next song, or at the very end of the last one (a part never knows the song's end: no end fade until the whole)
  function outOf(i, starts, origin, at, buf, part) {
    const ctxOf = ms => origin + cueOf(i) + (ms - starts[i]) / 1000;
    if (i + 1 < starts.length) return { start: ctxOf(starts[i + 1]), end: ctxOf(starts[i + 1] + XF_MS) };
    const end = origin + bufferT0(buf) + buf.duration;
    return !part && end - END_FADE > at + 0.2 ? { start: end - END_FADE, end } : null;
  }
  const levelFor = i => { const v = levelOf && game && game.songs ? Number(levelOf(game.songs[i])) : 1; return Number.isFinite(v) && v > 0 ? Math.min(1, v) : 1; };
  function play(ctx, i, buf, at, off, pts, onEnd) {
    let src = null, gain = null, level = null;
    try {
      src = ctx.createBufferSource();
      src.buffer = buf;
      gain = ctx.createGain();
      const lv = levelFor(i);
      if (lv !== 1) { level = ctx.createGain(); level.gain.value = lv; src.connect(gain).connect(level).connect(dest); }
      else src.connect(gain).connect(dest);
      const g = gain.gain;
      for (const pt of pts) { if (pt.ramp) g.linearRampToValueAtTime(pt.v, pt.t); else g.setValueAtTime(pt.v, pt.t); }
      src.onended = () => { try { src.disconnect(); gain.disconnect(); if (level) level.disconnect(); } catch { /* gone */ } onEnd(src); };
      src.start(at, off);
    } catch (err) {
      failures++;
      try { if (src) src.disconnect(); if (gain) gain.disconnect(); if (level) level.disconnect(); } catch { /* never connected */ }
      console.warn(label, 'start', err && err.name);
      return null;
    }
    return { src, gain, level };
  }
  const ended = (i, part) => src => { const v = voices.get(i); if (v && v.src === src) { voices.delete(i); if (!part) done.add(i); } };

  function start(ctx, i, starts) {
    const e = bufs.get(keyOf(i));
    if (!e || (!e.buf && !e.part)) return false;
    const cue = cueOf(i);
    // ctx time at which FILE position 0 is heard (− this device's speaker delay; the cue-in: the schedule starts the file that far in)
    const origin = ctxAtServer(starts[i]) - speakerLead() - cue;
    const at = Math.max(ctx.currentTime + 0.05, origin + cue);
    const off = at - origin;
    // the whole song, or (PD-5A) a first slice that still covers this moment
    const part = !e.buf;
    const buf = part ? e.part.buf : e.buf, b0 = bufferT0(buf), endS = part ? e.part.endS : b0 + e.buf.duration;
    if (off >= endS - (part ? 0.6 : 0.25)) { if (!part) done.add(i); return false; }
    if (b0 !== 0 && off < b0 + 0.06) return false;   // (a RANGE stream starts just before the cue: never a place before its first frames — a whole file has t0 0)
    // fade in: a crossfade from the previous song, or a short ramp when joining mid-song (or starting at a cue-in); fade out: into the next
    // song, or at the very end of the last one — the fade-out never before the fade-in is over
    const env = { at, origin: origin + cue, crossIn: i > 0 && off - cue < XF_MS / 1000, xfS: XF_MS / 1000, joinFade, minFade: cue > 0 ? 0.012 : 0 };
    const pts = songEnvelope({ ...env, out: outOf(i, starts, origin, at, buf, part) });
    const p = play(ctx, i, buf, at, off - b0, pts, ended(i, part));
    if (!p) return false;
    voices.set(i, { ...p, origin, startedAt: ctx.currentTime, startAt: at, part, endS, env, pts });
    return true;
  }
  // PD-5A — THE SWAP: a voice playing a part takes the longer part / the whole song at T, on the same sample (the same samples — both
  // decoded from byte 0): the new source starts at T where the old stops at T; its gain carries on from the old envelope's value at T
  function swap(ctx, i, starts) {
    const v = voices.get(i), e = bufs.get(keyOf(i));
    if (!v || !v.part || !e) return;
    const next = e.buf ? { buf: e.buf, endS: bufferT0(e.buf) + e.buf.duration, part: false } : e.part && e.part.endS > v.endS + 2 ? { buf: e.part.buf, endS: e.part.endS, part: true } : null;
    if (!next) return;
    const T = Math.max(ctx.currentTime + 0.12, v.startAt + 0.05);
    if (T > v.origin + v.endS - 0.3) return;   // (too late for this part: it ends; the next tick starts the voice again from the better one)
    const pts = envelopeFrom(songEnvelope({ ...v.env, out: outOf(i, starts, v.origin, v.env.at, next.buf, next.part) }), T);
    const p = play(ctx, i, next.buf, T, T - v.origin - bufferT0(next.buf), pts, ended(i, next.part));
    if (!p) return;
    try { v.src.stop(T); } catch { /* already gone */ }
    swaps++;
    voices.set(i, { ...v, ...p, part: next.part, endS: next.endS, pts });
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
        if (voices.has(i)) { if (voices.get(i).part) swap(ctx, i, starts); continue; }
        if (done.has(i) || i < minIndex) continue;
        if (t > starts[i] + game.sd[i] - 300) { done.add(i); continue; }
        start(ctx, i, starts);
      }
      // after a suspension the ctx clock stopped while the server clock ran on: re-place the song (twice a second)
      if (performance.now() - lastCheck > 500) {
        lastCheck = performance.now();
        for (const [i, v] of [...voices]) {
          if (Math.abs(v.origin - (ctxAtServer(starts[i]) - speakerLead() - cueOf(i))) > RESYNC_S && ctx.currentTime - v.startedAt > 0.5) {
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
      for (const [i, v] of voices) { if (ctx.currentTime < v.startAt + 0.02) continue; const g = v.gain.gain.value; if (!best || g > best.g) best = { i, g, at: ctx.currentTime - v.origin, origin: v.origin }; }
      // (PD-5A: + origin — the ctx time of the FILE's position 0 on this voice: PRISM's heard beat reads the voice actually sounding)
      return best && best.g > 0.05 ? { i: best.i, id: game.songs[best.i], at: Math.max(0, best.at), origin: best.origin } : null;
    },
    /** (PD-5A) song i's voice — sounding or scheduled — { origin, part } | null (the SFX + the countdown schedule on its clock) */
    /** (PFIX-A) the levels arrived after a voice started (the manifest still loading): every sounding voice takes its level now */
    relevel() { for (const [i, v] of voices) if (v.level) v.level.gain.value = levelFor(i); else if (levelFor(i) !== 1 && v.gain && dest) { try { const ctx = v.gain.context; const l = ctx.createGain(); l.gain.value = levelFor(i); v.gain.disconnect(); v.gain.connect(l).connect(dest); v.level = l; } catch { /* gone */ } } },
    /** (PFIX-A) each sounding voice's playback level (tests) */
    levels() { return [...voices].map(([i, v]) => ({ id: game && game.songs[i], level: v.level ? +v.level.gain.value.toFixed(3) : 1 })); },
    voice(i) { const v = voices.get(i); const ctx = getContext(); return v && ctx && v.gain.context === ctx ? { origin: v.origin, part: !!v.part } : null; },
    /** is song i decoded and ready? (PD-5A: a quick-start part counts — it can sound) */
    ready(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && (e.buf || e.part)); },
    /** did song i fail to load / decode? (SKY-A: the party's own player then covers) */
    failed(i = 0) { const e = game && bufs.get(keyOf(i)); return !!(e && e.failed); },
    debug() {
      const ctx = getContext();
      return {
        decoded: [...bufs].filter(([, e]) => e.buf).map(([k]) => k), restarts, failures, swaps, connected: !!dest,
        parts: [...bufs].filter(([, e]) => !e.buf && e.part).map(([k, e]) => `${k}@${e.part.endS.toFixed(1)}`),
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

/** TESTS (e2e-prism): the quick start's whole decode of a song streamed from `fromS` (a cue-in's RANGE stream, or 0) → { buf, t0 } */
export const quickWholeForTest = (url, fromS = 0, ff = 0) => quickDecode(url, () => {}, null, fromS, ff).then(buf => ({ buf, t0: bufferT0(buf), mode: (flow.get(url) || {}).mode }));
