// APP FIXES — Group 2 (THE RADIO): the pure parts of the music's clocks + a synced voice's envelope (js/core/sync-math.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { clockStep, serverOffsetFrom, songEnvelope, SNAP_S } from '../js/core/sync-math.js';

test('THE LOCK SCREEN: a sample a whole pause off throws the old samples away + snaps (Grok 3.3 — the old bar for ~6 s)', () => {
  let st = null;
  for (let i = 0; i < 24; i++) st = clockStep(st, 10 + (i % 3) * 0.001);
  assert.ok(Math.abs(st.offset - 10) < 0.01);
  // the context slept 40 s: ctx time stood still while performance time ran → the map moves by −40 s
  st = clockStep(st, -30);
  assert.equal(st.offset, -30, 'the first sample after the pause is the map at once');
  assert.equal(st.offs.length, 1, 'the old samples are gone');
  assert.equal(st.snapped, true);
  // the old way (a median of 24): the first 11 new samples changed nothing
  st = clockStep(st, -30.002);
  assert.ok(Math.abs(st.offset + 30) < 0.01, 'it keeps following the new map');
});

test('the clock still ignores single-sample jitter + follows small drift', () => {
  let st = null;
  for (let i = 0; i < 10; i++) st = clockStep(st, 5);
  st = clockStep(st, 5 + SNAP_S * 0.9);   // one wild sample under the snap: the median holds
  assert.ok(Math.abs(st.offset - 5) < 0.01, `held at ${st.offset}`);
  for (let i = 0; i < 30; i++) st = clockStep(st, 5.03);
  assert.ok(Math.abs(st.offset - 5.03) < 0.005, 'drift followed');
});

test('THE TITLE\'s CLOCK without a socket (Grok 3.1): the shortest round trip wins; a broken answer is never a clock', () => {
  const r = serverOffsetFrom([
    { t0: 1000, t1: 1400, server: 6250 },   // 400 ms round trip
    { t0: 2000, t1: 2060, server: 7030 },   // 60 ms: offset = 7030 − 2030 = 5000
  ]);
  assert.deepEqual(r, { offset: 5000, rtt: 60 });
  assert.equal(serverOffsetFrom([{ t0: 0, t1: 50, server: 9e12 }]), null, '|offset| ≥ 1 day: refused');
  assert.equal(serverOffsetFrom([{ t0: 10, t1: 5, server: 100 }]), null, 'a negative round trip');
  assert.equal(serverOffsetFrom([]), null);
  assert.equal(serverOffsetFrom([{ t0: 0, t1: 20, server: NaN }]), null);
});

const monotonic = pts => {
  for (let k = 1; k < pts.length; k++) assert.ok(pts[k].t >= pts[k - 1].t, `time goes back at point ${k}: ${JSON.stringify(pts)}`);
};
// the gain reached just before each point: a set (not a ramp) must never JUMP up from where the envelope was
const noJumpUp = pts => {
  for (let k = 1; k < pts.length; k++) if (!pts[k].ramp) assert.ok(pts[k].v <= pts[k - 1].v + 1e-9, `a jump up to ${pts[k].v} at ${pts[k].t}: ${JSON.stringify(pts)}`);
};

test('A JOIN NEAR A SONG\'s END (Grok 3.5): one monotonic envelope — the fade-out after the fade-in, never a jump back to full', () => {
  // a station join (1.2-s fade-in) 0.6 s before the crossfade into the next song
  const at = 100, origin = 100 - 170, out = { start: 100.6, end: 106.6 };
  const pts = songEnvelope({ at, origin, joinFade: 1.2, out });
  monotonic(pts); noJumpUp(pts);
  const peak = pts.find(p => p.t === 100.6);
  assert.ok(peak && peak.v > 0.3 && peak.v < 0.7, `turns over at the value it reached (${peak && peak.v})`);
  assert.equal(pts[pts.length - 1].v, 0);
  // the OLD code: setValueAtTime(1, x0) in the middle of the 1.2-s ramp (a jump to full volume), as here:
  const old = [{ t: 100, v: 0, ramp: false }, { t: 101.2, v: 1, ramp: true }, { t: 100.6, v: 1, ramp: false }];
  assert.throws(() => monotonic(old));
});

test('the ordinary envelopes are unchanged: a crossfade in, a mid-song join, a start on the beat, the last song\'s end', () => {
  const xf = songEnvelope({ at: 10.05, origin: 10, crossIn: true, xfS: 6, out: { start: 200, end: 206 } });
  monotonic(xf); assert.equal(xf[2].t, 16); assert.equal(xf[3].t, 200); assert.equal(xf[3].v, 1); assert.equal(xf.at(-1).t, 206);
  const join = songEnvelope({ at: 50, origin: 20, joinFade: 0.35, out: { start: 200, end: 206 } });
  monotonic(join); assert.deepEqual(join.slice(0, 2), [{ t: 50, v: 0, ramp: false }, { t: 50.35, v: 1, ramp: true }]);
  const beat = songEnvelope({ at: 20, origin: 20, out: null });
  assert.deepEqual(beat, [{ t: 20, v: 1, ramp: false }]);
  const last = songEnvelope({ at: 20, origin: 20, out: { start: 198.5, end: 200 } });
  monotonic(last); noJumpUp(last);
});
