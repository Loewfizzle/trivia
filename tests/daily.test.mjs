// THE DAILY CONTRACT (PROGRESSION A), pure: a cartridge plugs in; the standing, the bands (from ~50 finishers), YOUR TABLE's TODAY, the
// daily's step (the streak + the counters, idempotent). The /api side: tests/integration/progression.test.mjs (the TEST-ONLY fake daily).
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDaily, unregisterDaily, dailyOf, standing, bandFor, todayView, BAND_MIN } from '../js/core/daily.js';
import { dailyStep } from '../js/core/progress.js';

const FAKE = { id: 'fake', name: 'FAKE', buckets: 101, bucket: s => s / 10, verify: (seed, r) => (Number.isInteger(r && r.guess) ? 1000 - Math.abs(r.guess - (seed % 1000)) : null) };
const LOW = { id: 'fakelow', name: 'FAKE LOW', better: 'low', buckets: 100, bucket: s => s, verify: () => 1 };

test('a cartridge plugs in (and a bad one is refused)', () => {
  registerDaily(FAKE); registerDaily(LOW);
  assert.equal(dailyOf('fake').better, 'high');
  assert.throws(() => registerDaily({ id: 'X!', verify: () => 0 }));
  assert.equal(FAKE.verify(1234, { guess: 234 }), 1000);
  assert.equal(FAKE.verify(1234, { guess: 'x' }), null);
});

test('the standing: the percentile + the band only from ~50 finishers', () => {
  const hist = { 10: 5, 50: 3, 100: 1 };   // 9 finishers
  const s = standing(dailyOf('fake'), hist, 9, 1000);
  assert.deepEqual([s.better, s.worse, s.pct, s.band], [0, 8, 100, null]);
  const mid = standing(dailyOf('fake'), hist, 9, 500);
  assert.equal(mid.pct, Math.round(100 * 5 / 8));
  // 100 finishers: the top one = PENTHOUSE, the 10th = VIP ROOM, the 60th = FLOOR
  const big = {}; for (let i = 0; i < 100; i++) big[i] = 1;
  const at = rankFromTop => standing(dailyOf('fakelow'), big, 100, rankFromTop - 1);
  assert.equal(at(1).band.name, 'PENTHOUSE');
  assert.equal(at(10).band.name, 'VIP ROOM');
  assert.equal(at(25).band.name, 'LOUNGE');
  assert.equal(at(50).band.name, 'BAR');
  assert.equal(at(60).band.name, 'FLOOR');
  assert.equal(bandFor(100).name, 'FLOOR');
  assert.equal(BAND_MIN, 50);
});

test('YOUR TABLE\'s TODAY: their score only once you have played that daily', () => {
  assert.deepEqual(todayView({}, { fake: 900 }), { fake: { done: true } });
  assert.deepEqual(todayView({ fake: 700 }, { fake: 900, fakelow: 3 }), { fake: { score: 900 }, fakelow: { done: true } });
});

test('the daily\'s step: the streak + DAILY BREAD / THE TRIPLE / EARLY BIRD / PENTHOUSE counters, idempotent', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0);   // 7 am Eastern
  let r = dailyStep(null, { game: 'fake', day: 'd20261110', now, top: 1, n: 80, hourET: 7 });
  assert.deepEqual([r.dl.n, r.dl.early, r.dl.ph, r.streak.n], [1, 1, 1, 1]);
  assert.equal(dailyStep(r.next, { game: 'fake', day: 'd20261110', now, hourET: 7 }).skip, 'counted');
  r = dailyStep(r.next, { game: 'fakelow', day: 'd20261110', now, top: 40, n: 30, hourET: 9 });
  assert.deepEqual([r.dl.n, Object.keys(r.dl.day.g).length, r.dl.early, r.dl.ph], [1, 2, 1, 1]);
  r = dailyStep(r.next, { game: 'fake', day: 'd20261111', now: now + 864e5, top: 1, n: 20, hourET: 21 });
  assert.deepEqual([r.dl.n, r.dl.ph, r.streak.n], [2, 1, 2], 'a top-1 % under 50 finishers isn\'t the PENTHOUSE');
  unregisterDaily('fake'); unregisterDaily('fakelow');
});
