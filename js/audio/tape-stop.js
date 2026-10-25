// THE TAPE STOP IN WEB AUDIO (the TR-3B's power drain — docs/audio.md#the-tape-stop-in-web-audio).
// The owner's iPhone (Oct 25, 11:29): with the bend ALONE on, the AUDIO panel read NOT SOUNDING, the song clock still, 13 reloads
// failing; with it off, "sounding". Changing an <audio> element's playbackRate on iOS Safari stalls / silences it (and a reload keeps
// the bent rate, so every heal failed too). So the element's playbackRate is NEVER touched again. Instead:
//   PREPARE   as the craft arrives: the song's bytes (the file is in the cache: prefetch() fetched it before it played), the frames
//             covering the next ~42 s of the song from where the element is (core/mp3-slice.js: placed to one frame), decoded into an
//             AudioBuffer (~15 MB for 42 s; dropped after the run)
//   BEND      when the first bend is asked: an AudioBufferSourceNode starts at the element's exact song time, crossfaded IN over
//             `xf` s (the element's own gain down, the source's up — the same audio, so a linear fade sums flat), then the element is
//             PAUSED. The source's playbackRate is ramped (speed + pitch together, like a record losing power); two oscillators on
//             the rate make the WARBLE (a wow + a flutter) in the audio thread — no per-frame work. The song position is the exact
//             integral of the rate (core/tape-math.js), so the beat and the panel still read a song clock.
//   RELEASE   the rate ramped back to 1; then the element is SEEKED to where the tape got to (+ what it lost, for a room-clocked
//             song), played, and once its clock is SEEN MOVING (nudged once if it landed off) the crossfade back; the source stops.
//   WATCHDOG  the element's clock not moving within 1 s of play() → a fresh load at the right time (the caller's reload); still not
//             within 1.5 s more → the fade back happens anyway and the music's health watch (music.js) takes it from there: the rate
//             is 1, so its reloads work. A frozen graph, the page hidden, a new context or a new song ABORT the bend: the element
//             resumes at the tape's time at once, no fade.
//   DIRECT    on the direct path (no usable Web Audio) nothing is bent — the caller's duck is the only dip.
// Everything is injected so tests/tape-stop.test.mjs drives it with a fake AudioContext + element: the element's playbackRate is never
// assigned, a stalled element is reloaded, back-to-back runs never leave the music dead, a room-clocked song ends on the room's clock.
import { createSchedule, ramp, rateAt, posAt, lostAt, settledAt } from '../core/tape-math.js';
import { sliceAt } from '../core/mp3-slice.js';

export const TAPE = Object.freeze({
  sliceS: 42,       // s of song decoded ahead (the TR-3B eats ~27 s of song in its ~42 s of bend; the rest is the release's margin)
  xf: 0.35,         // the crossfades (s)
  lead: 0.22,       // the element is seeked this far AHEAD of the tape when played back: ≈ its start latency on a buffered file
  waitMs: 1000,     // the element's clock must move within this of play() (else the reload)
  waitReloadMs: 1500,
  nudge: 0.12,      // |element − tape| over this after it starts → one corrective seek (while still silent)
  readyMs: 150000,  // an unused decoded slice is dropped after this
  minAhead: 6,      // the slice must have at least this many s left where the element is, or the bend is skipped
});

/**
 * createTapeStop({ ctx: () => AudioContext|null, frozen: () => bool, fetchBytes: url => Promise<Uint8Array>, decode: (ctx, ArrayBuffer)
 *   => Promise<AudioBuffer>, elPlay: (el, why) => void, elReload: (voice, atS) => void, log: m => void, perfNow: () => ms, visible: () => bool })
 * A voice is { el, gain (the voice's level: fades + ducks — the source joins the graph here), elGain (the element's own gain, between
 * its MediaElementSource and `gain`), direct?, id }.
 */
export function createTapeStop(deps) {
  const { ctx, frozen = () => false, fetchBytes, decode, elPlay, elReload, log = () => {}, perfNow = () => performance.now(), visible = () => true } = deps;
  const T = { ...TAPE, ...(deps.tape || {}) };
  let st = { phase: 'idle' };   // idle | preparing | ready | bent | releasing | ending
  let blocked = null;           // the voice whose run was aborted: no new bend on it until the rate is asked back to 1
  let clocked = false;          // the song is on a room clock: the release makes up the time the tape lost
  let prepN = 0, runs = 0, aborts = 0, reloads = 0;

  const now = () => { const c = ctx(); return c ? c.currentTime : 0; };
  const usable = v => !!v && !v.direct && !!v.elGain && !!v.gain && !!ctx() && ctx().state === 'running' && !frozen();

  // ---- PREPARE: the bytes → the slice from where the element is → the buffer
  async function prepare(voice, id, url) {
    if (st.phase !== 'idle' && !(st.phase === 'ready' && (st.voice !== voice || st.id !== id))) return st.phase;
    if (!usable(voice)) return 'idle';
    const n = ++prepN;
    const el = voice.el;
    st = { phase: 'preparing', voice, id, url, want: null, at: perfNow() };
    try {
      const bytes = await fetchBytes(url);
      if (prepN !== n || st.phase !== 'preparing') return st.phase;
      const from = Math.max(0, el.currentTime || 0);
      const sl = sliceAt(bytes, from, T.sliceS);
      if (!sl) throw new Error('not an mp3');
      const ab = sl.bytes.slice().buffer;
      const c = ctx(); if (!c) throw new Error('no context');
      const buf = await decode(c, ab);
      if (prepN !== n || st.phase !== 'preparing') return st.phase;
      st = { phase: 'ready', voice, id, url, slice: sl, buf, want: st.want, readyAt: perfNow() };
      log(`tape ready: ${buf.duration.toFixed(1)} s of ${id} from ${sl.startS.toFixed(2)} s (${(sl.length / 1024).toFixed(0)} KB)`);
      if (st.want) start();
    } catch (e) {
      log(`tape ✗ ${(e && (e.name || e.message)) || 'error'}`);
      if (prepN === n) st = { phase: 'idle', failedAt: perfNow() };
    }
    return st.phase;
  }

  // ---- START: the source at the element's exact song time, the crossfade in
  function start() {
    const { voice, slice, buf, want } = st, c = ctx(), el = voice.el;
    if (!usable(voice) || !c) { st = { phase: 'idle' }; return false; }
    const elT = el.currentTime || 0, offset = elT - slice.startS;
    if (offset < 0 || offset > buf.duration - T.minAhead) { log(`tape skipped: the element at ${elT.toFixed(1)} s, the slice ${slice.startS.toFixed(1)}–${(slice.startS + buf.duration).toFixed(1)}`); st = { phase: 'idle', failedAt: perfNow() }; return false; }
    const t0 = c.currentTime + 0.02;
    const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = 1;
    const bendGain = c.createGain(); bendGain.gain.value = 0;
    src.connect(bendGain); bendGain.connect(voice.gain);
    const lfo = osc(c, 0.55), flutter = osc(c, 1.9);
    lfo.g.connect(src.playbackRate); flutter.g.connect(src.playbackRate);
    lfo.o.start(t0); flutter.o.start(t0);
    src.start(t0, offset);
    bendGain.gain.setValueAtTime(0, t0); bendGain.gain.linearRampToValueAtTime(1, t0 + T.xf);
    voice.elGain.gain.cancelScheduledValues(t0); voice.elGain.gain.setValueAtTime(1, t0); voice.elGain.gain.linearRampToValueAtTime(0, t0 + T.xf);
    const sched = createSchedule(t0, elT, 1);
    src.onended = () => { if (st.src === src && (st.phase === 'bent' || st.phase === 'releasing')) { log('tape ran out'); back(true); } };
    runs++;
    st = { ...st, phase: 'bent', src, bendGain, lfo, flutter, sched, t0, pauseAt: t0 + T.xf + 0.05, paused: false, catchUp: clocked };
    log(`tape on: ${voice.id || st.id} at ${elT.toFixed(2)} s (slice +${offset.toFixed(2)})`);
    if (want) applyRamp(want.rate, want.seconds, want.wow, want.flutter);
    st.want = null;
    return true;
  }
  function osc(c, hz) {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
    const g = c.createGain(); g.gain.value = 0; o.connect(g);
    return { o, g };
  }
  function applyRamp(rate, seconds, wow = 0, flutter = 0) {
    const c = ctx(), t = c.currentTime, s = st.sched, p = st.src.playbackRate;
    const r0 = rateAt(s, t);
    ramp(s, t, rate, seconds);
    p.cancelScheduledValues(t); p.setValueAtTime(r0, t); p.linearRampToValueAtTime(rate, t + Math.max(0.001, seconds));
    // the warble: the oscillators' depth in rate units (a fraction of the rate it rides on), eased
    const tc = Math.max(0.05, seconds / 3);
    st.lfo.g.gain.setTargetAtTime(wow * rate, t, tc);
    st.flutter.g.gain.setTargetAtTime(flutter * rate, t, tc);
  }

  // ---- RELEASE: the rate back to 1, then the element seeked + played + seen moving, then the fade back
  function release(seconds) {
    if (st.phase !== 'bent') return;
    applyRamp(1, seconds, 0, 0);
    st.phase = 'releasing';
    st.rel = { tR: settledAt(st.sched), played: 0, tries: 0, reloaded: false, done: false };
  }
  const target = t => posAt(st.sched, t) + (st.catchUp ? lostAt(st.sched, t) : 0);
  function playEl(why) {
    const { voice, rel } = st, el = voice.el, t = now();
    const at = target(t) + T.lead;
    try { el.currentTime = at; } catch { /* not seekable now: play() from where it is; the nudge corrects it */ }
    rel.seekAt = at; rel.seekT = t; rel.played = perfNow(); rel.elT0 = el.currentTime;
    elPlay(el, why);
  }
  // the fade back to the element (force: whatever the element does — the music's health watch takes over)
  function back(force = false) {
    const { voice, src, bendGain } = st, c = ctx(), t = c ? c.currentTime : 0;
    if (c) {
      voice.elGain.gain.cancelScheduledValues(t); voice.elGain.gain.setValueAtTime(voice.elGain.gain.value, t); voice.elGain.gain.linearRampToValueAtTime(1, t + T.xf);
      bendGain.gain.cancelScheduledValues(t); bendGain.gain.setValueAtTime(bendGain.gain.value, t); bendGain.gain.linearRampToValueAtTime(0, t + T.xf);
    }
    try { src.stop(t + T.xf + 0.1); } catch { /* ended */ }
    log(`tape off${force ? ' (forced)' : ''}: the element at ${(voice.el.currentTime || 0).toFixed(2)} s, the tape at ${posAt(st.sched, t).toFixed(2)}`);
    st = { ...st, phase: 'ending', endAt: t + T.xf + 0.15 };
  }
  function teardown() {
    const { src, bendGain, lfo, flutter } = st;
    for (const n of [src, bendGain, lfo && lfo.o, lfo && lfo.g, flutter && flutter.o, flutter && flutter.g]) { try { if (n && n.stop) n.stop(); } catch { /* fine */ } try { if (n) n.disconnect(); } catch { /* fine */ } }
    if (src) src.onended = null;
    const after = st.after;
    st = { phase: 'idle' };
    return after;
  }
  /** the bend dropped at once (the page hidden, the graph frozen / replaced, a new song): the element resumes at the tape's time */
  function abort(why) {
    if (!(st.phase === 'bent' || st.phase === 'releasing' || st.phase === 'ending')) { if (st.phase === 'preparing' || st.phase === 'ready') st = { phase: 'idle' }; return false; }
    const { voice } = st, c = ctx(), t = c ? c.currentTime : 0, el = voice.el;
    aborts++;
    if (st.phase !== 'ending') { const at = target(t); try { el.currentTime = at; } catch { /* fine */ } if (visible() && el.paused) elPlay(el, `tape abort (${why})`); }
    try { voice.elGain.gain.cancelScheduledValues(t); voice.elGain.gain.value = 1; } catch { /* fine */ }
    log(`tape aborted (${why})`);
    blocked = voice;
    teardown();
    return true;
  }

  // ---- TICK (the caller's health watch, every ~200 ms): the pause after the fade in, the release's watchdog, the teardown
  function tick() {
    const c = ctx();
    if (st.phase === 'ready' && perfNow() - st.readyAt > T.readyMs) { st = { phase: 'idle' }; return; }
    if (!(st.phase === 'bent' || st.phase === 'releasing' || st.phase === 'ending')) return;
    if (!c || c.state !== 'running' || frozen()) { abort(!c ? 'no context' : c.state !== 'running' ? c.state : 'frozen clock'); return; }
    const t = c.currentTime, { voice } = st, el = voice.el;
    if (st.phase === 'ending') { if (t >= st.endAt) { const after = teardown(); if (after) deferred = after; } return; }
    if (!st.paused && t >= st.pauseAt) { st.paused = true; try { el.pause(); } catch { /* fine */ } }
    // the slice running out before the release has seeked: the element back now (the song's own end, or a very slow tape)
    const left = st.slice.startS + st.buf.duration - posAt(st.sched, t);
    if (st.phase === 'bent' && left < 1.5) { release(0.4); }
    if (st.phase !== 'releasing') return;
    const rel = st.rel;
    if (t < rel.tR && left > 1.0) return;                 // the rate still ramping back
    if (!rel.played) { playEl('tape release'); return; }
    const elT = el.currentTime || 0, moving = !el.paused && elT > rel.elT0 + 0.02;
    if (moving) {
      // (it should sit between the tape and `lead` ahead of it — the lead covers its start latency; farther off → one corrective seek)
      const e = elT - target(t);
      if ((e > T.lead + T.nudge || e < -T.nudge) && rel.tries < 1) { rel.tries++; try { el.currentTime = elT - e + 0.05; } catch { /* fine */ } rel.elT0 = el.currentTime || 0; rel.played = perfNow(); log(`tape nudge ${e > 0 ? '−' : '+'}${Math.abs(e).toFixed(2)} s`); return; }
      back(false); return;
    }
    const waited = perfNow() - rel.played;
    if (!rel.reloaded && waited > T.waitMs) { rel.reloaded = true; reloads++; log(`tape watchdog: the element still ${waited > 9999 ? '' : `after ${Math.round(waited)} ms `}— loaded again`); elReload(voice, target(t) + T.lead + 0.3); rel.played = perfNow(); rel.elT0 = -1; return; }
    if (rel.reloaded && waited > T.waitReloadMs) back(true);
    if (left < 0.6) back(true);
  }
  let deferred = null;   // a bend asked while the last one was ending: starts once the nodes are gone

  // ---- THE API
  return {
    /** decode the slice ahead of the first bend (the craft arriving) */
    prepare(voice, id, url) { if (!usable(voice) || blocked === voice) return false; return prepare(voice, id, url), true; },
    /**
     * bend(voice, id, url, rate, seconds, { wow, flutter }) — rate < 1 bends (starting the tape if it isn't on; preparing first if it must),
     * 1 releases. wow / flutter: the warble's depths as fractions of the rate. → the phase after the call.
     */
    bend(voice, id, url, rate, seconds = 0.5, o = {}) {
      const to = Math.max(0.25, Math.min(1, +rate || 1)), wow = +o.wow || 0, flutter = +o.flutter || 0;
      if (to >= 0.999) {
        if (blocked === voice) blocked = null;
        if (st.phase === 'bent' && st.voice === voice) release(seconds);
        else if ((st.phase === 'ready' || st.phase === 'preparing') && st.want) st.want = null;
        if (st.phase === 'ending') st.after = null;
        deferred = null;
        return st.phase;
      }
      if (!usable(voice) || blocked === voice) return st.phase;
      if (st.failedAt && perfNow() - st.failedAt < 8000) return st.phase;
      if (st.phase === 'idle') { prepare(voice, id, url); if (st.phase === 'preparing') st.want = { rate: to, seconds, wow, flutter }; return st.phase; }
      if (st.voice !== voice) { if (st.phase === 'preparing' || st.phase === 'ready') { st = { phase: 'idle' }; return this.bend(voice, id, url, rate, seconds, o); } return st.phase; }
      if (st.phase === 'preparing') { st.want = { rate: to, seconds, wow, flutter }; return st.phase; }
      if (st.phase === 'ready') { st.want = { rate: to, seconds, wow, flutter }; start(); return st.phase; }
      if (st.phase === 'bent') { applyRamp(to, seconds, wow, flutter); return st.phase; }
      if (st.phase === 'releasing' || st.phase === 'ending') { st.after = { voice, id, url, rate: to, seconds, wow, flutter }; return st.phase; }
      return st.phase;
    },
    /** a room-clocked song (setClocked): the release lands where the song WOULD be — the lost time made up; a free-running song (the
     *  title's mood music) goes on from where the tape got to. → whether this bend will catch up */
    catchUp() { return !!(clocked && (st.phase === 'bent' || st.phase === 'releasing') && (st.catchUp = true)); },
    setClocked(v) { clocked = !!v; },
    tick() {
      tick();
      if (deferred && st.phase === 'idle') { const d = deferred; deferred = null; this.bend(d.voice, d.id, d.url, d.rate, d.seconds, d); }
    },
    abort,
    /** the tape is carrying the song (the element paused or being faded) */
    active: () => st.phase === 'bent' || st.phase === 'releasing' || st.phase === 'ending',
    /** …and sounding: the graph runs, the source is inside its buffer */
    playing() { if (!this.active()) return false; const c = ctx(); if (!c || c.state !== 'running' || frozen()) return false; const t = c.currentTime; return st.phase === 'ending' || posAt(st.sched, t) - st.slice.startS < st.buf.duration; },
    /** the song's own time (s) on the tape, −1 when it isn't on */
    clock() { if (!this.active()) return -1; return posAt(st.sched, now()); },
    rate() { return this.active() ? rateAt(st.sched, now()) : 1; },
    /** for the panel + the tests */
    state() {
      const on = this.active(), t = now();
      return { phase: st.phase, rate: on ? +rateAt(st.sched, t).toFixed(3) : 1, at: on ? +posAt(st.sched, t).toFixed(2) : -1, lost: on ? +lostAt(st.sched, t).toFixed(2) : 0,
        bent: on && rateAt(st.sched, t) < 0.999, ready: st.phase === 'ready' ? +st.buf.duration.toFixed(1) : 0, runs, aborts, reloads, blocked: !!blocked, clocked, catchUp: !!st.catchUp, paused: on ? !!st.paused : false };
    },
    _st: () => st,
  };
}
