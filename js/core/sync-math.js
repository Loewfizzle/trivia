// PURE (APP FIXES — Grok 3.1 / 3.3 / 3.5): the music's clocks + a song voice's gain envelope, unit-tested (tests/sync-math.test.mjs).
//
// clockStep — the audio clock's map (games/pulse/clock.js): ctx time − performance time, the median of recent samples. A context
//   suspended (the lock screen, a call) stops its clock while performance time runs on: the first sample after it is off by the
//   whole pause. The old samples are THROWN AWAY + the map SNAPS (a jump > SNAP_S) — before, the median of the old samples held the
//   old map for ~6 s and the radio played the bar it left at the lock screen.
// serverOffsetFrom — the server clock's offset with NO socket (the title parks the database): GET /api/time samples
//   { t0, t1 (Date.now() before + after), server (its Date.now()) } → offset = server − the round trip's midpoint, from the sample
//   with the shortest round trip; null when no sample is sane (|offset| ≥ 1 day — a broken answer, never a clock).
// songEnvelope — the gain points of one synced song voice (synced-songs.js#start): ONE MONOTONIC envelope — the fade-in finishes
//   before the fade-out begins; a voice joining so late that the fade-out is due during its fade-in turns over at that moment, from
//   the value the fade-in had reached (no jump back up to full volume, no ramp scheduled before the one before it).
export const SNAP_S = 0.5;
export const CLOCK_SAMPLES = 24;
export const MAX_OFFSET_MS = 864e5;

/** one clock sample o (s) → the new { offs, offset } */
export function clockStep(st, o, max = CLOCK_SAMPLES) {
  const prev = st || { offs: [], offset: null };
  if (prev.offset != null && Math.abs(o - prev.offset) > SNAP_S) return { offs: [o], offset: o, snapped: true };
  const offs = [...prev.offs, o];
  if (offs.length > max) offs.shift();
  const sorted = [...offs].sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1];
  // follow real drift, ignore single-sample noise (a render quantum's jitter)
  const offset = prev.offset == null || Math.abs(med - prev.offset) > 0.05 ? med : prev.offset + (med - prev.offset) * 0.2;
  return { offs, offset, snapped: false };
}

/** samples [{ t0, t1, server }] (ms) → { offset (ms), rtt (ms) } or null */
export function serverOffsetFrom(samples) {
  let best = null;
  for (const s of samples || []) {
    if (!s || !Number.isFinite(s.t0) || !Number.isFinite(s.t1) || !Number.isFinite(s.server) || s.t1 < s.t0) continue;
    const rtt = s.t1 - s.t0, offset = Math.round(s.server - (s.t0 + s.t1) / 2);
    if (Math.abs(offset) >= MAX_OFFSET_MS) continue;
    if (!best || rtt < best.rtt) best = { offset, rtt };
  }
  return best;
}

/**
 * The gain points of a voice: [{ t, v, ramp }] (ramp = a linear ramp TO v at t; else a set at t), times never decreasing.
 *   at: when the voice starts sounding (ctx s) · origin: when its position 0 is heard · crossIn: a crossfade in from the previous
 *   song (xfS long, from the song's own start) · joinFade: the ramp when joining mid-song · out: { start, end } of the fade-out
 *   (into the next song / the last song's end) or null.
 */
export function songEnvelope({ at, origin, crossIn = false, xfS = 0, joinFade = 0.15, out = null }) {
  const off = at - origin;
  const pts = [];
  let inEnd = at, inFrom = 1, inStart = at;
  if (crossIn) {
    inFrom = Math.min(1, (off + 0.001) / xfS);
    pts.push({ t: at, v: 0, ramp: false }, { t: at + 0.001, v: inFrom, ramp: true });
    inStart = at + 0.001; inEnd = Math.max(inStart, origin + xfS);
    pts.push({ t: inEnd, v: 1, ramp: true });
  } else if (off > 0.02) {
    inFrom = 0; inStart = at; inEnd = at + joinFade;
    pts.push({ t: at, v: 0, ramp: false }, { t: inEnd, v: 1, ramp: true });
  } else {
    pts.push({ t: at, v: 1, ramp: false });
  }
  if (!out) return pts;
  let s = Math.max(out.start, at + 0.2);
  if (s < inEnd) {
    // the fade-out is due before the fade-in is over: turn over at s, from the value the fade-in reached there
    const k = inEnd > inStart ? (s - inStart) / (inEnd - inStart) : 1;
    const peak = Math.max(0, Math.min(1, inFrom + (1 - inFrom) * Math.max(0, Math.min(1, k))));
    pts.pop();
    pts.push({ t: s, v: peak, ramp: true });
  } else {
    pts.push({ t: s, v: 1, ramp: false });
  }
  const e = Math.max(out.end, s + 0.05);
  pts.push({ t: e, v: 0, ramp: true });
  return pts;
}
