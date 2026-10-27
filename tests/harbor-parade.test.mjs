// 11a-2 — THE PARADE SYSTEM (core/harbor-parade.js, PURE): the window on the clock, the units in order + spaced, joining mid-way, the
// traffic hold, the crowd's cheers as each balloon passes, the balloons' motion in the wind
import test from 'node:test';
import assert from 'node:assert/strict';
import { PARADE, PARADES, UNIT, BALLOONS, paradeWindow, paradeHold, paradeUnits, unitsAt, unitPeople, paradeCrowd, balloonMotion } from '../js/core/harbor-parade.js';

const OFF = -300, T = iso => Date.parse(iso) / 1000;
test('the window: Thanksgiving morning 9:00 → ~11:24 (the fourth Thursday), none the day before; forced from its flag', () => {
  const w = paradeWindow(T('2026-11-26T09:30:00-05:00'), { off: OFF });
  assert.ok(w && Math.abs(w.T0 - T('2026-11-26T09:00:00-05:00')) < 1 && w.T1 - w.T0 === PARADES.thanksgiving.len);
  assert.equal(paradeWindow(T('2026-11-25T09:30:00-05:00'), { off: OFF }), null);
  assert.equal(paradeWindow(T('2026-11-26T15:30:00-05:00'), { off: OFF }), null);
  const f = paradeWindow(1000, { forceAt: 990 }); assert.ok(f.forced && f.T0 === 991.5);
  const h = paradeHold(w, 80); assert.ok(h[0] === w.T0 - PARADE.lead && h[1] === w.T1 + 80);
});
test('the units: the cycle in order, every balloon kind in turn, each entering once the one before is clear (its length + the gap), seeded the same for everyone', () => {
  const w = paradeWindow(T('2026-11-26T09:30:00-05:00'), { off: OFF }), U = paradeUnits(w);
  assert.deepEqual(U, paradeUnits(w), 'seeded');
  assert.deepEqual(U.slice(0, 7).map(u => u.kind), PARADES.thanksgiving.cycle);
  assert.deepEqual(U.filter(u => u.kind === 'balloon').slice(0, 4).map(u => u.balloon), ['turkey', 'pumpkin', 'acorn', 'cider']);
  for (let i = 1; i < U.length; i++) assert.ok(Math.abs((U[i].t - U[i - 1].t) * PARADE.v - (U[i - 1].len + PARADE.gap)) < 1e-6, 'spaced by the length + the gap');
  assert.ok(U.length > 150 && U[U.length - 1].t < w.T1, `${U.length} units over the morning`);
  // joining mid-way: at 10:00 units are already in view, heads past the start
  const mid = unitsAt(U, T('2026-11-26T10:00:00-05:00'), -12, 24);
  assert.ok(mid.length >= 2 && mid.every(u => u.head >= -12 && u.head - u.len <= 24), `${mid.length} units in view mid-way`);
  for (const k of Object.keys(UNIT)) if (U.some(u => u.kind === k)) assert.ok(unitPeople(U.find(u => u.kind === k)).length >= 2, `${k} has its people`);
  const b = U.find(u => u.kind === 'balloon'), hp = unitPeople(b);
  assert.equal(hp.length, BALLOONS[b.balloon].handlers);
  assert.ok(hp.every(p => p.dx < 0 && p.dx > -b.len && PARADE.files.some(z => Math.abs(z - p.z) < 0.3)), 'the handlers under their balloon, in the files');
});
test('the crowd: spectators along the kerb, in place before the head, cheering as each balloon passes in front of them, off after', () => {
  const w = paradeWindow(T('2026-11-26T09:30:00-05:00'), { off: OFF }), U = paradeUnits(w), C = paradeCrowd(w, U, -12, [-6, 16]);
  assert.equal(C.length, PARADE.crowd);
  for (const s of C) {
    assert.ok(s.t0 < w.T0 && s.t1 > w.T1 && s.z >= PARADE.kerb[0] && s.z <= PARADE.kerb[1]);
    assert.ok(s.cheers.length > 50, `${s.cheers.length} balloons cheered`);
    const b = U.find(u => u.kind === 'balloon'), when = b.t + (s.x + 12) / PARADE.v + b.len / PARADE.v / 2;
    assert.ok(s.cheers.some(([a, z]) => when >= a && when <= z), 'cheering when the first balloon is in front of them');
  }
});
test('the balloons sway + bob in the real wind (more wind, more lean), never wildly', () => {
  const u = { seed: 12345 };
  let calm = 0, windy = 0;
  for (let t = 0; t < 60; t += 0.1) { const a = balloonMotion(u, t, 1, 0), b = balloonMotion(u, t, 12, 8); calm += Math.abs(a.sway); windy += Math.abs(b.sway); assert.ok(Math.abs(b.sway) < 0.2 && Math.abs(a.bob) < 0.4); }
  assert.ok(windy > calm * 1.5, `the wind leans them (${(windy / 600).toFixed(3)} vs ${(calm / 600).toFixed(3)} rad)`);
});
