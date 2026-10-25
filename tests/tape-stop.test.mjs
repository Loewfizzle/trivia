// THE TAPE STOP IN WEB AUDIO (audio/tape-stop.js + core/tape-math.js) on a FAKE AudioContext + a fake <audio> element, the real
// slice of a real song (core/mp3-slice.js). The owner's rule (Oct 25): the element's playbackRate is NEVER assigned; a stalled element
// is loaded again at the right time; back-to-back runs (the panel's loop) never leave the music dead; a room-clocked song ends on the
// room's clock; the title's mood music goes on from where the tape got to; a dead graph / the page hidden abort cleanly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTapeStop, TAPE } from '../js/audio/tape-stop.js';
import { createSchedule, ramp, rateAt, posAt, lostAt } from '../js/core/tape-math.js';
import { frameTable } from '../js/core/mp3-slice.js';

const SONG = new Uint8Array(readFileSync(new URL('../audio/music/c2-party1.mp3', import.meta.url)));   // 203.9 s

// ---- the fakes
function param(v = 0) {
  const p = { value: v, calls: [], setValueAtTime(x, t) { p.calls.push(['set', x, t]); p.value = x; return p; }, linearRampToValueAtTime(x, t) { p.calls.push(['ramp', x, t]); p.target = x; p.at = t; return p; },
    cancelScheduledValues(t) { p.calls.push(['cancel', t]); return p; }, setTargetAtTime(x, t, tc) { p.calls.push(['tgt', x, t, tc]); p.target = x; return p; } };
  return p;
}
function node(c, extra = {}) { const n = { c, out: [], connect(x) { n.out.push(x); return x; }, disconnect() { n.out = []; n.disconnected = true; }, ...extra }; return n; }
function fakeCtx() {
  const c = { state: 'running', currentTime: 10, made: { src: [], gain: [], osc: [] } };
  c.createGain = () => { const g = node(c, { gain: param(1) }); c.made.gain.push(g); return g; };
  c.createOscillator = () => { const o = node(c, { type: 'sine', frequency: param(0), start(t) { o.startedAt = t; }, stop() { o.stopped = true; } }); c.made.osc.push(o); return o; };
  // (a real source throws on a second stop(): the first scheduled stop stands)
  c.createBufferSource = () => { const s = node(c, { buffer: null, playbackRate: param(1), start(t, off) { s.startedAt = t; s.offset = off; }, stop(t) { if (s.stopAt != null) throw new Error('InvalidStateError'); s.stopAt = t ?? c.currentTime; } }); c.made.src.push(s); return s; };
  return c;
}
function fakeEl(at) {
  let rateSets = 0;
  const el = { _t: at, paused: false, error: null, stall: false, plays: [], seeks: [], get currentTime() { return el._t; }, set currentTime(v) { el._t = v; el.seeks.push(v); },
    get playbackRate() { return 1; }, set playbackRate(v) { rateSets++; throw new Error(`the element's playbackRate was set to ${v}`); },
    play(why) { el.plays.push(why); if (!el.stall) el.paused = false; return Promise.resolve(); }, pause() { el.paused = true; }, rateSets: () => rateSets };
  return el;
}
// the whole rig: the context, a voice, the tape with the real slice + a fake decode (the slice's real duration)
function rig({ at = 96.6, clocked = false, decodeMs = 0 } = {}) {
  const c = fakeCtx(), el = fakeEl(at), log = [];
  const voice = { el, gain: c.createGain(), elGain: c.createGain(), id: 'm:c2-party1' };
  let frozen = false, visible = true;
  const reloads = [];
  const tape = createTapeStop({
    ctx: () => c, frozen: () => frozen, log: m => log.push(m), perfNow: () => c.currentTime * 1000, visible: () => visible,
    fetchBytes: async () => SONG,
    decode: async (_c, ab) => { const t = frameTable(new Uint8Array(ab)); return { duration: t.frames.length * t.spf / t.sr, sampleRate: t.sr, numberOfChannels: 2 }; },
    elPlay: (e, why) => e.play(why),
    elReload: (v, atS) => { reloads.push(atS); v.el.stall = false; v.el._t = atS; v.el.play('reload'); },
  });
  if (clocked) tape.setClocked(true);
  // advance the clocks: the context, the element while it plays (unless stalled); tick every 0.2 s like music.js's watch
  const adv = s => { const steps = Math.max(1, Math.round(s / 0.2)); for (let i = 0; i < steps; i++) { const d = s / steps; c.currentTime += d; if (!el.paused && !el.stall) el._t += d; const n = el.seeks.length; tape.tick(); if (el.seeks.length > n) el.seekT = c.currentTime; } };
  const settle = () => new Promise(r => setTimeout(r, decodeMs + 5));
  return { c, el, voice, tape, log, adv, settle, reloads, setFrozen: v => { frozen = v; }, setVisible: v => { visible = v; }, src: () => c.made.src[c.made.src.length - 1] };
}
const URL_ = '/audio/music/c2-party1.mp3';
const bend = (R, rate, s = 1.2) => R.tape.bend(R.voice, R.voice.id, URL_, rate, s, { wow: 0.025, flutter: 0.008 });

// ---- the math
test('tape-math: a ramp\'s integral is exact; the position holds the rate after it; lost = real time − song time', () => {
  const s = createSchedule(10, 96.6, 1);
  assert.equal(posAt(s, 13), 99.6);
  ramp(s, 13, 0.5, 2);                       // 1 → 0.5 over 2 s: eats 1.5 s of song
  assert.equal(rateAt(s, 14), 0.75);
  assert.ok(Math.abs(posAt(s, 15) - 101.1) < 1e-9);
  assert.ok(Math.abs(posAt(s, 25) - 106.1) < 1e-9, 'then 10 s at 0.5 = 5 s of song');
  assert.ok(Math.abs(lostAt(s, 25) - (15 - 9.5)) < 1e-9, 'behind by 5.5 s');
  ramp(s, 25, 1, 1.5);                       // back up: 0.5 → 1 over 1.5 s eats 1.125
  assert.ok(Math.abs(posAt(s, 26.5) - 107.225) < 1e-9);
  assert.ok(Math.abs(posAt(s, 30) - 110.725) < 1e-9);
  // a ramp interrupted by a new one keeps the position continuous
  const s2 = createSchedule(0, 0, 1); ramp(s2, 0, 0.5, 4); ramp(s2, 2, 0.5, 4);
  assert.ok(Math.abs(rateAt(s2, 2) - 0.75) < 1e-9 && Math.abs(posAt(s2, 2) - 1.75) < 1e-9);
});

// ---- the whole TR-3B on the tape
test('the TR-3B: prepared, the tape takes over at the element\'s exact time, the element is paused + its rate NEVER set, the song slows, then the element resumes where the tape got to', async () => {
  const R = rig();
  assert.equal(R.tape.prepare(R.voice, R.voice.id, URL_), true);
  await R.settle();
  const st0 = R.tape.state();
  assert.equal(st0.phase, 'ready'); assert.ok(st0.ready > 41 && st0.ready < 44, `~42 s decoded (${st0.ready})`);
  R.adv(2);                                                        // the element plays on 2 s before the first bend
  assert.equal(bend(R, 0.9), 'bent');
  const src = R.src();
  assert.ok(Math.abs(src.startedAt - (R.c.currentTime + 0.02)) < 1e-9, 'the source starts now');
  assert.ok(Math.abs((98.6 - src.offset) - R.tape._st().slice.startS) < 1e-6 && src.offset > 1.9 && src.offset < 2.2, `the source starts at the element's song time (offset ${src.offset.toFixed(3)} into a slice from ${R.tape._st().slice.startS.toFixed(3)})`);
  assert.ok(!R.el.paused, 'the element still plays through the crossfade');
  R.adv(0.6);
  assert.ok(R.el.paused, 'then it is paused');
  assert.ok(R.voice.elGain.gain.calls.some(x => x[0] === 'ramp' && x[1] === 0), 'the element faded out');
  // the drain: a few ramps down to 0.5, held
  bend(R, 0.7); R.adv(1.2); bend(R, 0.5); R.adv(1.2);
  const held = R.tape.state();
  assert.ok(held.bent && Math.abs(held.rate - 0.5) < 1e-6, `held at 0.5 (${held.rate})`);
  assert.ok(src.playbackRate.calls.filter(x => x[0] === 'ramp').length >= 3 && src.playbackRate.target === 0.5, 'the SOURCE\'s rate ramped');
  assert.ok(R.c.made.osc.length === 2 && R.c.made.osc.every(o => o.out[0].out.includes(src.playbackRate)), 'two oscillators ride on the source\'s rate (the warble)');
  const wobble = R.c.made.gain.find(g => g.gain.target && Math.abs(g.gain.target - 0.025 * 0.5) < 1e-9);
  assert.ok(wobble, 'the wow\'s depth = 2.5 % of the rate');
  const before = R.tape.clock();
  R.adv(20);
  assert.ok(Math.abs(R.tape.clock() - (before + 10)) < 1e-6, '20 s of real time at 0.5 = 10 s of song');
  assert.ok(R.tape.playing() && R.tape.active(), 'sounding (the graph runs, the source inside its buffer)');
  assert.equal(R.el.rateSets(), 0, 'the element\'s playbackRate was never assigned');
  // the release: up to 1 over 1.5 s, then the element seeked + played, seen moving, the fade back
  bend(R, 1, 1.5);
  assert.equal(R.tape.state().phase, 'releasing');
  R.adv(1.4);
  assert.equal(R.el.plays.length, 0, 'not played before the rate is back at 1');
  R.adv(0.4);
  assert.ok(R.el.plays.includes('tape release'), 'played once the rate is 1');
  const tapeAt = R.tape.clock();
  assert.ok(Math.abs(R.el.currentTime - (tapeAt + TAPE.lead)) < 0.25, `seeked just ahead of the tape (el ${R.el.currentTime.toFixed(2)} vs tape ${tapeAt.toFixed(2)})`);
  R.adv(0.4);
  const after = R.tape.state();
  assert.ok(after.phase === 'ending' || after.phase === 'idle', `the fade back once the element moved (${after.phase})`);
  R.adv(0.6);
  assert.equal(R.tape.state().phase, 'idle');
  assert.ok(!R.el.paused && Math.abs(R.el.currentTime - R.tape._st().phase === 'idle' ? 0 : 0) < 1, 'the element plays on');
  assert.ok(src.stopAt > 0 && src.disconnected, 'the source stopped + disconnected');
  assert.equal(R.voice.elGain.gain.target, 1, 'the element\'s gain back to 1');
  assert.equal(R.el.rateSets(), 0, 'the element\'s playbackRate was never assigned (the whole run)');
  assert.ok(R.log.some(m => /^tape on/.test(m)) && R.log.some(m => /^tape off/.test(m)), R.log.join(' | '));
});

test('the title\'s mood music goes on from where the tape got to; a ROOM-CLOCKED song ends on the room\'s clock (the lost time made up)', async () => {
  for (const clocked of [false, true]) {
    const R = rig({ clocked });
    R.tape.prepare(R.voice, R.voice.id, URL_); await R.settle();
    const el0 = R.el.currentTime;
    bend(R, 0.5, 1); R.adv(1); R.adv(20); R.tape.catchUp();
    bend(R, 1, 1);
    const sched = R.tape._st().sched;
    R.adv(1.2); R.adv(0.4);
    // the seek that brought the element back: at tape time posAt (free) or on the room's clock (clocked) — + the lead
    const seek = R.el.seeks[R.el.seeks.length - 1], ts = R.el.seekT;
    const free = posAt(sched, ts), room = sched.songAt0 + (ts - sched.t0), want = clocked ? room : free;
    assert.ok(Math.abs(seek - (want + TAPE.lead)) < 0.05, `${clocked ? 'clocked' : 'free'}: seeked to ${seek.toFixed(2)} ≈ ${want.toFixed(2)} + lead (tape ${free.toFixed(2)}, room ${room.toFixed(2)}: ${(room - free).toFixed(1)} s apart)`);
    assert.ok(room - free > 9, 'the tape fell well behind the room');
    assert.equal(R.tape.state().catchUp, clocked);
  }
});

test('WATCHDOG: the element\'s clock not moving 1 s after play() → loaded again at the right time; then the fade back onto it', async () => {
  const R = rig();
  R.tape.prepare(R.voice, R.voice.id, URL_); await R.settle();
  bend(R, 0.5, 1); R.adv(1); R.adv(10);
  R.el.stall = true;                                                // iOS: play() resolves, the clock never moves
  bend(R, 1, 1); R.adv(1.2);
  assert.ok(R.el.plays.includes('tape release') && R.reloads.length === 0);
  R.adv(0.8);
  assert.equal(R.reloads.length, 0, 'not yet (under 1 s)');
  R.adv(0.4);
  assert.equal(R.reloads.length, 1, 'the reload after ~1 s still');
  assert.ok(Math.abs(R.reloads[0] - (R.tape.clock() + TAPE.lead + 0.3)) < 0.3, `at the tape's time (+ a lead): ${R.reloads[0].toFixed(2)} vs ${R.tape.clock().toFixed(2)}`);
  R.adv(0.6);
  const st = R.tape.state();
  assert.ok(st.phase === 'ending' || st.phase === 'idle', `the element moves after the reload → the fade back (${st.phase})`);
  assert.equal(st.reloads, 1);
  R.adv(1);
  assert.ok(!R.el.paused && R.tape.state().phase === 'idle' && R.el.rateSets() === 0);
});

test('WATCHDOG: an element dead even after the reload — the fade back happens anyway (the health watch takes over), no exception', async () => {
  const R = rig();
  R.tape.prepare(R.voice, R.voice.id, URL_); await R.settle();
  bend(R, 0.5, 1); R.adv(1); R.adv(6);
  R.el.stall = true;
  const dead = R.tape._st(); void dead;
  // the reload leaves it stalled too
  const origReload = R.reloads;
  R.tape.setClocked(false);
  bend(R, 1, 1); R.adv(1.2);
  // (replace the fake reload's un-stall: keep it dead)
  R.el.play = why => { R.el.plays.push(why); return Promise.resolve(); };
  R.adv(1.2);
  assert.equal(origReload.length, 1, 'reloaded once');
  R.el.stall = true; R.el.paused = true;
  R.adv(2.6);
  assert.equal(R.tape.state().phase, 'idle', 'gave the song back to the element after 1.5 s more');
  assert.ok(R.log.some(m => /tape off \(forced\)/.test(m)), R.log.join(' | '));
});

test('BACK TO BACK (the panel\'s loop): a second run while the first is still releasing starts once the nodes are gone; three runs, never dead', async () => {
  const R = rig();
  R.tape.prepare(R.voice, R.voice.id, URL_); await R.settle();
  bend(R, 0.5, 1); R.adv(1); R.adv(8);
  bend(R, 1, 1); R.adv(0.6);
  // the next run asks for a bend mid-release
  assert.equal(bend(R, 0.8, 1), 'releasing');
  R.adv(0.6); R.adv(0.4); R.adv(0.6);
  // the first run ended, the second was deferred → it prepares (async) → starts
  await R.settle(); R.adv(0.2); await R.settle(); R.adv(0.2);
  let st = R.tape.state();
  assert.ok(st.phase === 'bent' || st.phase === 'preparing' || st.phase === 'ready', `the deferred run on its way (${st.phase})`);
  await R.settle(); R.adv(0.4);
  st = R.tape.state();
  assert.equal(st.phase, 'bent', 'the second run bent');
  assert.equal(st.runs, 2);
  R.adv(4); bend(R, 1, 1); R.adv(1.2); R.adv(0.4); R.adv(0.6);
  assert.equal(R.tape.state().phase, 'idle');
  assert.ok(!R.el.paused, 'the element plays between runs');
  // a third run after a quiet gap: a fresh slice from where the element is now
  R.adv(3);
  const elNow = R.el.currentTime;
  bend(R, 0.5, 1); await R.settle(); R.adv(0.2);
  assert.equal(R.tape.state().phase, 'bent');
  assert.ok(Math.abs(R.src().offset + R.tape._st().slice.startS - elNow) < 0.3, 'the third slice starts at the element\'s current time');
  assert.equal(R.tape.state().runs, 3);
  assert.equal(R.el.rateSets(), 0);
  bend(R, 1, 1); R.adv(1.2); R.adv(0.4); R.adv(0.6);
  assert.ok(!R.el.paused && R.tape.state().phase === 'idle', 'the music on the element at the end');
});

test('ABORT: the graph frozen / the page hidden mid-bend → the element resumes at the tape\'s time at once, its gain up; no new bend on that run until the rate is asked back to 1', async () => {
  const R = rig();
  R.tape.prepare(R.voice, R.voice.id, URL_); await R.settle();
  bend(R, 0.5, 1); R.adv(1); R.adv(6);
  const tapeAt = R.tape.clock();
  R.setFrozen(true); R.adv(0.2);
  assert.equal(R.tape.state().phase, 'idle');
  assert.ok(!R.el.paused && Math.abs(R.el.currentTime - tapeAt) < 0.3, `the element back at the tape's time (${R.el.currentTime.toFixed(2)} vs ${tapeAt.toFixed(2)})`);
  assert.equal(R.voice.elGain.gain.value, 1);
  assert.ok(R.log.some(m => /tape aborted \(frozen clock\)/.test(m)));
  R.setFrozen(false);
  assert.equal(bend(R, 0.5, 1), 'idle', 'blocked for the rest of this run');
  bend(R, 1, 1);
  bend(R, 0.5, 1); await R.settle(); R.adv(0.6);
  assert.equal(R.tape.state().phase, 'bent', 'the next run bends again');
  assert.ok(R.el.paused, 'the element paused under the tape');
  // the explicit abort (the page hidden): the element seeked to the tape's time, NOT played (not visible — music.js plays it on return)
  R.setVisible(false);
  const at = R.tape.clock();
  R.tape.abort('hidden');
  assert.ok(R.el.paused && Math.abs(R.el.currentTime - at) < 0.05 && R.tape.state().phase === 'idle' && R.tape.state().aborts === 2, `hidden: seeked to ${R.el.currentTime.toFixed(2)} (tape ${at.toFixed(2)}), left paused`);
});

test('the DIRECT path and a non-running graph bend nothing; a slice too short (the song\'s end) is skipped cleanly', async () => {
  const R = rig();
  const direct = { el: fakeEl(10), direct: true, gain: null, elGain: null, id: 'm:x' };
  assert.equal(R.tape.bend(direct, 'm:x', URL_, 0.5, 1), 'idle');
  R.c.state = 'suspended';
  assert.equal(bend(R, 0.5), 'idle');
  R.c.state = 'running';
  const E = rig({ at: 200 });                                        // 3.9 s before the song's end
  E.tape.prepare(E.voice, E.voice.id, URL_); await E.settle();
  assert.equal(E.tape.state().phase, 'ready');
  bend(E, 0.5);
  assert.equal(E.tape.state().phase, 'idle');
  assert.ok(E.log.some(m => /tape skipped/.test(m)), E.log.join(' | '));
  assert.ok(!E.el.paused && E.el.rateSets() === 0);
});
