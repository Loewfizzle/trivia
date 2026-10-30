// NIGHT-C Group 4 — THE QUIET BUILDING: core/harbor-moments.js#parkedNight / parkedLevel (PURE); the drawing: screens/harbor/windows.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parkedNight, parkedLevel, PARKED_ROOMS, LIVE_ROOMS, BOSS_ROOM } from '../js/core/harbor-moments.js';
import { knob } from '../js/core/harbor-schedule.js';

test('THE QUIET BUILDING: the live rooms are the boss\'s TV room + the two cut-off side rooms; the bar, the jazz room + the upper middle parked', () => {
  assert.deepEqual([...LIVE_ROOMS].sort(), ['apartment', 'edge2', 'edge3']); assert.ok(LIVE_ROOMS.includes(BOSS_ROOM));
  assert.deepEqual([...PARKED_ROOMS].sort(), ['back', 'bar', 'jazz']);
  assert.ok(!PARKED_ROOMS.some(id => LIVE_ROOMS.includes(id)));
});

test('TONIGHT\'S PARKED ROOMS: a mix — 1 or 2 of 3 warm-lit (never all dark, never all lit), each lit lamp out one by one between outFrom + outTo; every phone the same', () => {
  const P = knob('windows.parked'), counts = new Set();
  for (let d = 1; d <= 60; d++) {
    const key = `2026-11-${String((d % 28) + 1).padStart(2, '0')}|${d}`, N = parkedNight(key, { seed: 1924 });
    const lit = PARKED_ROOMS.filter(id => N.lit[id]); counts.add(lit.length);
    assert.ok(lit.length >= P.litMin && lit.length <= P.litMax, `${key}: ${lit.length} lit`);
    const outs = lit.map(id => N.out[id]).sort((a, b) => a - b);
    for (const s of outs) assert.ok(s >= (P.outFrom - 24) * 3600 && s <= (P.outTo - 24) * 3600, `${key}: out at ${s}`);
    for (let i = 1; i < outs.length; i++) assert.ok(outs[i] - outs[i - 1] > 10 * 60, 'one by one — never two together');
    assert.deepEqual(parkedNight(key, { seed: 1924 }), N, 'every phone the same');
  }
  assert.deepEqual([...counts].sort(), [1, 2], 'both mixes happen');
});

test('A PARKED ROOM\'s LIGHT: lit until its time, then its lamp CLICKS off (off, a flash, off) — a dark room stays dark', () => {
  const N = { lit: { bar: true, jazz: false, back: true }, out: { bar: -3600, back: 1800 } };
  assert.equal(parkedLevel(N, 'bar', -4000), 1); assert.equal(parkedLevel(N, 'bar', -3599.9), 0.3); assert.equal(parkedLevel(N, 'bar', -3599.85), 0.85); assert.equal(parkedLevel(N, 'bar', -3500), 0);
  assert.equal(parkedLevel(N, 'jazz', -9000), 0, 'never lit tonight');
  assert.equal(parkedLevel(N, 'back', 1000), 1); assert.equal(parkedLevel(N, 'back', 2000), 0);
  assert.equal(parkedLevel(null, 'bar', 0), 0);
});
