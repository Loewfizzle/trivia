// THE TAPE'S MATH (PURE; the TR-3B's tape stop — docs/audio.md#the-tape-stop-in-web-audio).
// A playback RATE SCHEDULE on a clock (the AudioContext's seconds): piecewise-linear ramps asked one after another, as an AudioParam
// would run them, with the SONG POSITION as the exact integral of the rate — the time the tape has eaten. Everything the tape stop
// needs to know where the song is while an AudioBufferSourceNode plays it bent, and where the <audio> element must resume.
//   createSchedule(t0, songAt0, rate0 = 1)  → s
//   ramp(s, now, to, seconds)               a new ramp from the rate now to `to` over `seconds` (cancels the one running, as cancelScheduledValues + setValueAtTime + linearRampToValueAtTime do)
//   rateAt(s, t) · posAt(s, t)              the rate / the song position at clock time t (t ≥ the last ramp's start; the integral is exact)
//   lostAt(s, t)                            how far the song fell behind real time ((t − t0) − (pos − songAt0)); a room-clocked song makes it up
//   settledAt(s)                            the clock time the current ramp ends (the rate holds after it)
export function createSchedule(t0, songAt0, rate0 = 1) {
  return { t0, songAt0, tA: t0, posA: songAt0, rA: rate0, tB: t0, rB: rate0 };
}
export function rateAt(s, t) {
  if (t <= s.tA) return s.rA;
  if (t >= s.tB) return s.rB;
  return s.rA + (s.rB - s.rA) * (t - s.tA) / (s.tB - s.tA);
}
export function posAt(s, t) {
  if (t <= s.tA) return s.posA;
  const tr = Math.min(t, s.tB);
  // the ramp's integral (a trapezoid) + the hold after it
  let p = s.posA + (tr - s.tA) * (s.rA + rateAt(s, tr)) / 2;
  if (t > s.tB) p += (t - s.tB) * s.rB;
  return p;
}
export function ramp(s, now, to, seconds) {
  const r = rateAt(s, now), p = posAt(s, now);
  s.tA = now; s.posA = p; s.rA = r;
  s.tB = now + Math.max(0.001, seconds); s.rB = to;
  return s;
}
export const settledAt = s => s.tB;
export const lostAt = (s, t) => (t - s.t0) - (posAt(s, t) - s.songAt0);
