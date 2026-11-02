// SCHED Group 3 — THE SHOWCASE (core/harbor-showcase.js) + THE SCHEDULE SIM (scripts/sim-sched.mjs): the owner's decided rates hold over a
// whole year at every dial level — weeknights 2–3 legendaries at HIGH, party nights one an hour from 8 pm (all four), never the same one
// twice a night, never over the fireworks, the jaw-droppers rarer than the soft ones, the medium tier every ~3–5 min in prime time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legendsTonight, mediumDay, primeWeight, setShowcase, showcaseLevel, legendPool } from '../js/core/harbor-showcase.js';
import { simYear } from '../scripts/sim-sched.mjs';

test('the dial: HIGH by default, a level from the server / a preview, back to the default on null', () => {
  assert.equal(showcaseLevel(), 'high');
  setShowcase('low'); assert.equal(showcaseLevel(), 'low');
  setShowcase('nonsense'); assert.equal(showcaseLevel(), 'high');
  setShowcase(null);
});
test('the pool: every legendary row with knobs.pool — a new one joins by its row alone', () => {
  assert.deepEqual(legendPool().map(p => p.kind).sort(), ['blackbird', 'flyby', 'tr3b', 'ufo']);
});
test('prime time: the evenings most (Fri + Sat more), lunch a little, the dead hours calm', () => {
  assert.equal(primeWeight(20, 2), 1);
  assert.ok(primeWeight(20, 6) > primeWeight(20, 2));
  assert.ok(primeWeight(12.5, 2) > 0 && primeWeight(12.5, 2) < 1);
  assert.equal(primeWeight(3, 2), 0);
  assert.equal(primeWeight(15, 2), 0);
});
test('THE SIM at HIGH: weeknights 2–3, party nights 4, never twice a night, never over the fireworks, the medium tier every ~3–5 min', () => {
  const r = simYear('high');
  assert.ok(r.weeknight.legendsPerNight >= 2 && r.weeknight.legendsPerNight <= 3, `weeknight ${r.weeknight.legendsPerNight}`);
  assert.ok(r.party.legendsPerNight >= 3.8, `party ${r.party.legendsPerNight}`);
  assert.equal(r.twice, 0); assert.equal(r.fwClash, 0); assert.equal(r.tooClose, 0);
  assert.ok(r.kinds.ufo < r.kinds.blackbird && r.kinds.tr3b < r.kinds.flyby, 'the jaw-droppers rarer than the soft ones');
  assert.ok(r.medium.gapMedianMin >= 3 && r.medium.gapMedianMin <= 5, `medium gap ${r.medium.gapMedianMin} min`);
  assert.ok(r.party.oneIn < r.weeknight.oneIn, 'a party night catches more');
});
test('THE SIM: lower levels show less (legendaries + medium)', () => {
  const [h, n, l] = ['high', 'normal', 'low'].map(lv => simYear(lv, { days: 120 }));
  assert.ok(h.weeknight.legendsPerNight > n.weeknight.legendsPerNight && n.weeknight.legendsPerNight > l.weeknight.legendsPerNight);
  assert.ok(h.medium.primePerHour > n.medium.primePerHour && n.medium.primePerHour > l.medium.primePerHour);
});
test('Halloween night is the ghost ship’s; the fireworks nights have no TR-3B; the party hours start at 8 pm', () => {
  assert.deepEqual(legendsTonight(2026, 10, 31), []);
  assert.ok(!legendsTonight(2026, 7, 4).some(l => l.kind === 'tr3b'));
  const fri = legendsTonight(2026, 11, 6); assert.equal(fri.length, 4); assert.ok(fri[0].h >= 20 && fri[0].h < 21);
});
test('the medium tier: none in the dead hours, never inside a legendary’s minutes', () => {
  const day0 = Date.UTC(2026, 10, 4) / 1000, md = mediumDay('2026-11-4', day0, 3), L = legendsTonight(2026, 11, 4);
  for (const e of md) { const h = (e.t - day0) / 3600; assert.ok(!((h >= 2 && h < 6) || (h >= 14 && h < 17)), `dead hour ${h}`); for (const x of L) assert.ok(!(h > x.h - 0.05 && h < x.h + x.len / 3600 + 0.05), `inside ${x.kind}`); }
});
