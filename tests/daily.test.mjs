// THE DAILY CONTRACT (PROGRESSION A), pure: a cartridge plugs in; the standing, the bands (from ~50 finishers), YOUR TABLE's TODAY, the
// daily's step (the streak + the counters, idempotent). The /api side: tests/integration/progression.test.mjs (the TEST-ONLY fake daily).
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDaily, unregisterDaily, dailyOf, standing, bandFor, todayView, BAND_MIN, dailyRows, dailyRow, listedDailies, todaysDailies, addDailyRow, removeDailyRow, sweptDay, dailyXp, DAILY_XP } from '../js/core/daily.js';
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

test('the daily\'s step: the streak + DAILY BREAD / THE SWEEP / EARLY BIRD / PENTHOUSE counters, idempotent', () => {
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

// ---------------------------------------------------------------- DM1 — PLUG-AND-PLAY (no fixed count anywhere)
test('DM1 — PLUG-AND-PLAY: a FAKE 3rd + 4th daily appear in the list, the live set, THE SWEEP and the XP cap with no other change; one fewer → the sweep needs one fewer', () => {
  const ids = () => todaysDailies();
  assert.deepEqual(dailyRows().filter(r => !r.test).map(r => r.id), ['password', 'coastclear'], 'config.js#DAILIES, in order');
  assert.ok(dailyRows().every(r => r.ticket && typeof r.lesson === 'boolean' && Number.isFinite(r.order)), 'every row: order · ticket · lesson');
  assert.equal(dailyRow('coastclear').lesson, true, 'COAST CLEAR has a first-time lesson (DM2: the practice harbor)');
  const cart = id => ({ id, name: id, buckets: 10, bucket: s => s, verify: () => 1 });
  // the two real ones live + a FAKE 3rd and 4th (test-only rows + cartridges)
  for (const id of ['password', 'coastclear']) registerDaily(cart(id));
  addDailyRow({ id: 'fake3', order: 3 }); addDailyRow({ id: 'fake4', order: 4 });
  registerDaily(cart('fake3')); registerDaily(cart('fake4'));
  try {
    assert.deepEqual(ids(), ['password', 'coastclear', 'fake3', 'fake4'], 'the live set, in the list\'s order');
    assert.deepEqual(listedDailies(), ['password', 'coastclear', 'fake3', 'fake4']);
    const day = 'd20261110', now = Date.UTC(2026, 10, 10, 20);
    let s = null, xp = 0, r = null;
    for (const g of ids()) {
      r = dailyStep(s, { game: g, day, now }); s = r.next; xp += r.xp.total;
      assert.equal(r.swept, g === 'fake4', `${g}: the sweep only on the last of FOUR`);
    }
    assert.equal(xp, 4 * DAILY_XP, 'the XP cap = one credit per daily on the list (4)');
    assert.equal(r.xp.cap, 4); assert.equal(s.dl.sw, 1); assert.ok(r.ach.includes('the-triple'), 'THE SWEEP');
    assert.equal(s.dl.pw.n, 1, 'PERFECT WEEK\'s counter: one swept day this week');
    // remove one → the sweep needs one fewer (three)
    unregisterDaily('fake4'); removeDailyRow('fake4');
    assert.deepEqual(ids(), ['password', 'coastclear', 'fake3']);
    let t = null;
    for (const g of ids()) { r = dailyStep(t, { game: g, day, now }); t = r.next; }
    assert.equal(r.swept, true); assert.equal(r.xp.cap, 3);
    // the cap holds: a 4th credit on a 3-daily day earns nothing (a list that shrank mid-day)
    assert.equal(dailyXp(3, ids()).total, 0); assert.equal(dailyXp(2, ids()).total, DAILY_XP);
    assert.equal(sweptDay({}, []), false, 'an empty list never sweeps');
  } finally {
    for (const id of ['password', 'coastclear', 'fake3', 'fake4']) unregisterDaily(id);
    removeDailyRow('fake3'); removeDailyRow('fake4');
  }
});

test('DM1 — THE THROWAWAY GATE in the step: a non-counting result keeps the streak + the XP, never a counter, a flag, a sweep or an award', () => {
  const day = 'd20261110', now = Date.UTC(2026, 10, 10, 12);
  const r = dailyStep(null, { game: 'password', day, now, top: 1, n: 80, hourET: 7, flags: { crack: 1, safe: 1 }, today: ['password'], counts: false });
  assert.equal(r.counts, false); assert.equal(r.streak.n, 1, 'the streak as usual'); assert.equal(r.xp.total, DAILY_XP, 'the XP as usual');
  assert.equal(r.next.xp, DAILY_XP);
  assert.deepEqual(r.ach, [], 'no achievement (KEYHOLE, SAFECRACKER, EARLY BIRD, PENTHOUSE, THE SWEEP)');
  assert.ok(!r.items.some(i => /keyhole|safecracker|penthouse|founder|stars/.test(i)), 'no reward item');
  assert.equal(r.swept, false); assert.equal(r.dl.n, 0); assert.equal(r.dl.early, 0); assert.equal(r.dl.ph, 0); assert.deepEqual(r.dl.day.g, {});
  assert.equal(r.next.pa, undefined, 'no flags kept');
  assert.equal(dailyStep(r.next, { game: 'password', day, now, today: ['password'], counts: true }).skip, 'counted', 'one result a day, whatever the gate said');
  // the same run, counted: every reward
  const c = dailyStep(null, { game: 'password', day, now, top: 1, n: 80, hourET: 7, flags: { crack: 1, safe: 1 }, today: ['password'] });
  assert.ok(['keyhole', 'safecracker', 'early-bird', 'penthouse-suite', 'the-triple'].every(a => c.ach.includes(a)), c.ach.join());
});
