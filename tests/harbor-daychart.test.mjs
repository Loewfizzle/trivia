// SCHED Group 5 — THE DAY CHART (core/harbor-daychart.js): built from the timetable + the planners (never a hand-made list) — the night's
// legendaries, the fireworks, the party, the window scenes in it; THE 30-SECOND RULE (something moving in view in any 30 s of prime time);
// the year view agrees with the showcase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayChart, quietWindows, yearView } from '../js/core/harbor-daychart.js';
import { legendsTonight } from '../js/core/harbor-showcase.js';

test('a Tuesday: tonight’s legendaries, the weeknight fireworks at 9:30, the window scenes, the medium moments, the billboard', () => {
  const C = dayChart('2026-11-03', { off: -300 });
  assert.equal(C.items.filter(i => i.cat === 'legendary').length, legendsTonight(2026, 11, 3).length);
  assert.ok(C.items.some(i => i.cat === 'fireworks' && Math.abs(i.h0 - 21.5) < 0.05 && i.label === 'THE FIREWORKS'));
  for (const n of ['THE JUGGLER', 'THE CHARLESTON', 'THE CRATE GUY']) assert.ok(C.items.some(i => i.label === n), n);
  assert.ok(C.items.filter(i => i.cat === 'medium').length > 40 && C.items.some(i => i.cat === 'billboard'));
  assert.ok(!C.party);
});
test('a Saturday party night: the street party, its dance breaks, the party show, four legendaries from 8 pm', () => {
  const C = dayChart('2026-11-07', { off: -300 });
  assert.ok(C.party && C.items.some(i => i.label === 'THE STREET PARTY') && C.items.some(i => /DANCE BREAK/.test(i.label)) && C.items.some(i => i.label === 'THE PARTY SHOW'));
  assert.equal(C.items.filter(i => i.cat === 'legendary').length, 4);
});
test('THE FULL 24 HOURS (the owner\'s SCHED review): 4 am → 4 am — the milkman at 6, the boss\'s TV to 3 am + his shade, the lights out 2–4 am', () => {
  const C = dayChart('2026-11-03', { off: -300 });
  assert.ok(C.items.some(i => i.label === 'The milk truck' && i.h0 < 6.1));
  assert.ok(C.items.some(i => /BOSS pulls his shade/.test(i.label) && i.h0 === 27));
  const outs = C.items.filter(i => /^LIGHTS OUT/.test(i.label));
  assert.ok(outs.length >= 3 && outs.every(i => i.h0 >= 26 && i.h0 < 28.5), outs.map(i => i.h0).join());
});
test('a stormy winter day: the fireworks called off', () => {
  const C = dayChart('2027-01-19', { off: -300, wx: { storm: true, rain: 0.9 } });
  assert.ok(C.items.some(i => i.cat === 'fireworks' && /CALLED OFF/.test(i.label)));
});
test('THE 30-SECOND RULE: in prime time (6–11 pm) no 30-s window with nothing moving in view — a weeknight, a party night, a Sunday, a storm', () => {
  for (const [k, wx] of [['2026-11-03'], ['2026-11-07'], ['2026-11-08'], ['2027-01-19', { storm: true, rain: 0.9 }]]) assert.deepEqual(quietWindows(k, { off: -300, wx }), [], k);
});
test('THE YEAR VIEW at HIGH: every legendary kind most months, the raids, the party nights, the ghost ship in October', () => {
  const Y = yearView(2027);
  assert.ok(Y.totals['THE BLACKBIRD'] > 150 && Y.totals['THE UFO ABDUCTION'] > 100 && Y.totals['PARTY NIGHTS'] >= 100);
  assert.ok(Y.months[9].counts['THE GHOST SHIP'] === 2 && !Y.months[3].counts['THE GHOST SHIP']);
});
