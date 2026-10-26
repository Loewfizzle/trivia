// 9a — THE BALLOONS STAY UP (the owner, Oct 25): the flights' lengths, the burner rare + irregular, the festival's line-up, and a
// flight found again on load after its scheduler window (screens/harbor/balloons.js PURE helpers + core/harbor-events.js#recent).
import test from 'node:test';
import assert from 'node:assert/strict';
import { flightLen, burnSchedule, FLIGHT, BURN, FESTIVAL_ORDER, BALLOON_KINDS, BALLOON_SCHEMES, FAST, driftAt } from '../js/screens/harbor/balloons.js';
import { createScheduler, HARBOR_EVENTS, SLOT_MS, RECENT_MS } from '../js/core/harbor-events.js';

test('a single flight lasts 45–60 min, the festival 60–90 — seeded (every phone the same)', () => {
  for (let s = 1; s < 400; s += 7) {
    const a = flightLen(s, false), b = flightLen(s, true);
    assert.ok(a >= FLIGHT.single[0] * 60 && a <= FLIGHT.single[1] * 60, `single ${a}`);
    assert.ok(b >= FLIGHT.festival[0] * 60 && b <= FLIGHT.festival[1] * 60, `festival ${b}`);
    assert.equal(flightLen(s, false), a);
  }
  assert.ok(FAST >= 10, 'the preview\'s fast crossing');
});

test('the burner: RARE + irregular on a cruise (45–120 s), often while climbing, never on a rhythm', () => {
  const climb = 80, b = burnSchedule(12345, climb, 60 * 60);
  const gaps = [];
  for (let i = 1; i < b.length; i++) {
    const g = b[i][0] - (b[i - 1][0] + b[i - 1][1]), [g0, g1] = b[i - 1][0] < climb ? BURN.climb : BURN.cruise;
    assert.ok(g >= g0 - 1e-9 && g <= g1 + 1e-9, `gap ${g.toFixed(1)} after ${b[i - 1][0].toFixed(0)} s`);
    if (b[i - 1][0] >= climb) gaps.push(g);
  }
  assert.ok(b.filter(x => x[0] < climb).length >= 8, 'flaring as it climbs');
  assert.ok(gaps.length >= 25 && gaps.length <= 85, `${gaps.length} burns in an hour's cruise`);
  const mean = gaps.reduce((a, c) => a + c, 0) / gaps.length, sd = Math.sqrt(gaps.reduce((a, c) => a + (c - mean) ** 2, 0) / gaps.length);
  assert.ok(sd > 12, `irregular (σ ${sd.toFixed(1)} s)`);
  for (const [, len] of b) assert.ok(len >= BURN.len[0] && len <= BURN.len[1]);
  assert.deepEqual(burnSchedule(12345, climb, 600), burnSchedule(12345, climb, 600));
});

test('the festival line-up in the owner\'s order + the new styles', () => {
  assert.deepEqual(FESTIVAL_ORDER, ['btc-orange', 'alien', 'bitcoin', 'bullseye', 'smiley', 'flag']);
  for (const k of ['vstripes', 'pinstripes', 'bullseye', 'smiley']) { assert.ok(BALLOON_KINDS.includes(k), k); assert.ok(BALLOON_SCHEMES[k].length >= 1, k); }
  assert.equal(BALLOON_SCHEMES.pinstripes.length, 2, 'two of the old schemes kept');
  assert.ok(!BALLOON_KINDS.includes('bitcoin') && !BALLOON_KINDS.includes('alien'), 'the specials keep their rare odds');
  assert.equal(driftAt(0), 0); assert.equal(driftAt(1), 1); assert.ok(driftAt(0.05) < 0.05, 'eased from rest');
});

test('a flight still up is found on load: the scheduler keeps what started (recent) after its 12-min window', () => {
  const ctxAt = ms => ({ ms, force: new Set(), night: false, el: 8, az: 110, month: 7, south: false });
  const t0 = Date.UTC(2026, 6, 10, 0, 0, 0);
  const sch = createScheduler(HARBOR_EVENTS, ctxAt, { seed: 1924, anchor: t0 });
  // walk a day: every balloon flight found in `recent` long after its window has closed
  let found = null;
  for (let ms = t0; ms < t0 + 86400e3 && !found; ms += SLOT_MS) {
    const r = sch.at(ms);
    const b = r.recent.find(e => e.id === 'balloons' && ms - e.end > 20 * 60e3);
    if (b) found = { b, ms, active: r.active.some(e => e.id === 'balloons' && e.start === b.start) };
  }
  assert.ok(found, 'a balloon flight in recent after its window');
  assert.equal(found.active, false, 'no longer active — only recent');
  assert.ok(found.ms - found.b.start < RECENT_MS);
});
