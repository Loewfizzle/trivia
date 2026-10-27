// SP5 — THE DANCE CLOCK (js/core/harbor-dance.js): the dancers follow the song's grid but never snap — a new song's phase + tempo blend in
// over ~1 s; they wind down over a song's last bars, idle in the gap (a cheer as it ends), pick up smoothly on the new song.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDanceClock, stepDanceClock, idleMoves, WIND_S, CHEER_S } from '../js/core/harbor-dance.js';

const DT = 1 / 60;
test('on a song the clock tracks the grid within a few hundredths; the energy is full; without any beat it free-runs at a calm 2 beats / s', () => {
  const D = createDanceClock();
  let bf = 0;
  for (let t = 0; t < 10; t += DT) { bf += 2.1 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'a', left: 100, gap: false }); }
  assert.ok(Math.abs(D.bf - bf) < 0.05 && Math.abs(D.rate - 2.1) < 0.05 && D.dk > 0.99, `tracks: off ${(D.bf - bf).toFixed(3)}, rate ${D.rate.toFixed(2)}, energy ${D.dk.toFixed(2)}`);
  // a jump of whole bars (a new song's count from 0): the phase is what it keeps — no snap at all
  const before = D.bf; stepDanceClock(D, DT, { beatsF: bf - 40, id: 'a', left: 100, gap: false });
  assert.ok(Math.abs(D.bf - before - 2.1 * DT) < 0.02, `a 40-beat jump in the count: the clock moved ${(D.bf - before).toFixed(3)} (its own step)`);
  const E = createDanceClock(); for (let t = 0; t < 5; t += DT) stepDanceClock(E, DT, null);
  assert.ok(Math.abs(E.bf - 10) < 0.2 && E.dk === 1 && E.gap === 0, `no beat at all: free-runs ${E.bf.toFixed(2)} beats in 5 s, the energy full (music off is not a gap)`);
});

test('a song switch: the phase jumps 1.8 beats and the tempo 2.0 → 2.6 — no frame moves more than 0.2 beats off its own rate; the offset closes over ~1 s', () => {
  const D = createDanceClock();
  let bf = 0;
  for (let t = 0; t < 6; t += DT) { bf += 2.0 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'a', left: 100, gap: false }); }
  bf += 1.8;                                                   // (the new song's grid lands elsewhere in the bar — the widest shift there is ~2 beats)
  let maxStep = 0, closedAt = -1, prev = D.bf;
  for (let t = 0; t < 4; t += DT) { bf += 2.6 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'b', left: 100, gap: false }); const step = Math.abs((D.bf - prev) - D.rate * DT); maxStep = Math.max(maxStep, step); prev = D.bf; const ph = ((bf - D.bf) % 4 + 6) % 4 - 2; if (closedAt < 0 && Math.abs(ph) < 0.1) closedAt = t; }   // (the phase in the bar — the count itself may differ by whole bars)
  assert.ok(maxStep < 0.2, `never a snap: the biggest frame step beyond its own rate ${maxStep.toFixed(3)} beats (a snap would be 1.8)`);
  assert.ok(closedAt > 0.4 && closedAt < 2.5, `the offset closed over ${closedAt.toFixed(2)} s (blended, not instant, not slow)`);
  assert.ok(Math.abs(D.rate - 2.6) < 0.08, `the tempo eased to ${D.rate.toFixed(2)}`);
});

test('the song ends: the energy winds down over its last 8 s, a cheer as the gap begins, idle in the gap (the clock keeps time), a smooth pick-up on the new song', () => {
  const D = createDanceClock();
  let bf = 0, t = 0;
  for (; t < 4; t += DT) { bf += 2 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'a', left: 30, gap: false }); }
  assert.ok(D.dk > 0.99);
  const dks = [];
  for (let left = WIND_S; left > 0; left -= DT, t += DT) { bf += 2 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'a', left, gap: false }); dks.push(D.dk); }
  assert.ok(dks[Math.floor(dks.length / 2)] < 0.7 && dks[dks.length - 1] < 0.12 && dks.every((v, i) => !i || v <= dks[i - 1] + 1e-6), `winds down: half-way ${dks[Math.floor(dks.length / 2)].toFixed(2)}, at the end ${dks[dks.length - 1].toFixed(2)}, monotone`);
  // the gap: 3 s with no song (the music on) — a cheer first, then idle; the clock keeps advancing at its last rate
  const bf0 = D.bf; let cheer0 = 0, cheerLate = 1;
  for (let g = 0; g < 3; g += DT, t += DT) { stepDanceClock(D, DT, { beatsF: 0, id: null, left: null, gap: true }); if (g < 0.2) cheer0 = Math.max(cheer0, D.cheer); if (g > CHEER_S + 0.1) cheerLate = Math.min(cheerLate, D.cheer); }
  assert.ok(cheer0 > 0.85 && cheerLate === 0 && D.dk < 0.03 && D.gap === 1 && Math.abs(D.bf - bf0 - 6) < 0.4, `the gap: a cheer ${cheer0.toFixed(2)} then none, idle (energy ${D.dk.toFixed(2)}), the clock ran ${(D.bf - bf0).toFixed(1)} beats in 3 s`);
  // the new song: its own grid; the energy up over ~1.2 s, the phase blended
  bf = 100; let upAt = -1, maxStep = 0, prev = D.bf;
  for (let g = 0; g < 3; g += DT, t += DT) { bf += 2.4 * DT; stepDanceClock(D, DT, { beatsF: bf, id: 'b', left: 200, gap: false }); maxStep = Math.max(maxStep, Math.abs((D.bf - prev) - D.rate * DT)); prev = D.bf; if (upAt < 0 && D.dk > 0.9) upAt = g; }
  assert.ok(upAt > 0.6 && upAt < 2.2 && maxStep < 0.3 && D.gap === 0, `picks up over ${upAt.toFixed(2)} s, the phase blended (max step ${maxStep.toFixed(3)})`);
});

test('the idle moves: bounded, seeded apart, a clap for one dancer in three + a sip for another', () => {
  let claps = 0, sips = 0;
  for (let seed = 0; seed < 9; seed++) for (let t = 0; t < 40; t += 0.1) { const m = idleMoves(t, seed); for (const k of ['sway', 'shift', 'turn']) assert.ok(Math.abs(m[k]) <= 1); assert.ok(m.clap >= 0 && m.clap <= 1 && m.sip >= 0 && m.sip <= 1); if (m.clap > 0.9) claps++; if (m.sip > 0.9) sips++; }
  assert.ok(claps > 10 && sips > 10, `claps ${claps}, sips ${sips}`);
  assert.notDeepEqual(idleMoves(5, 1), idleMoves(5, 2), 'each dancer its own');
});
