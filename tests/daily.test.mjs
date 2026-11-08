// THE DAILY CONTRACT (PROGRESSION A), pure: a cartridge plugs in; the standing, the bands (from ~50 finishers), YOUR TABLE's TODAY, the
// daily's step (the streak + the counters, idempotent). The /api side: tests/integration/progression.test.mjs (the TEST-ONLY fake daily).
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SWEEP_XP, isPenthouse, penthouseCut, registerDaily, unregisterDaily, dailyOf, standing, bandFor, todayView, BAND_MIN, dailyRows, dailyRow, listedDailies, todaysDailies, addDailyRow, removeDailyRow, sweptDay, dailyXp, DAILY_XP } from '../js/core/daily.js';
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
    assert.equal(xp, 4 * DAILY_XP + SWEEP_XP, 'the XP cap = one credit per daily on the list (4) + the DM2 sweep bonus');
    assert.equal(r.xp.cap, 4); assert.equal(s.dl.sw, 1); assert.ok(r.ach.includes('the-triple'), 'THE SWEEP');
    assert.equal(s.dl.sr.n, 1, 'PERFECT WEEK’s run: one swept day in a row (DM2)');
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

// ---------------------------------------------------------------- DM2 — THE REWARDS (the owner's Step 0)
test('DM2 — THE SWEEP BONUS: +10 XP once on the day every daily is finished, counted only', () => {
  const day = 'd20261110', now = Date.UTC(2026, 10, 10, 20), today = ['a', 'b'];
  let r = dailyStep(null, { game: 'a', day, now, today });
  assert.equal(r.xp.total, DAILY_XP, 'the first daily: no bonus');
  r = dailyStep(r.next, { game: 'b', day, now, today });
  assert.equal(r.swept, true); assert.equal(r.xp.total, DAILY_XP + SWEEP_XP, 'the last daily: DAILY_XP + the sweep bonus');
  assert.ok(r.xp.parts.some(p => p.k === 'sweep' && p.v === SWEEP_XP), 'the moment’s line: THE SWEEP +10');
  assert.equal(r.next.xp, 2 * DAILY_XP + SWEEP_XP);
  // a same-day profile (THE THROWAWAY GATE): no sweep, no bonus
  let g = dailyStep(null, { game: 'a', day, now, today, counts: false });
  g = dailyStep(g.next, { game: 'b', day, now, today, counts: false });
  assert.equal(g.swept, false); assert.equal(g.next.xp, 2 * DAILY_XP, 'no bonus for a non-counting profile');
});

test('DM2 — PERFECT WEEK = THE SWEEP on 7 daily-days IN A ROW (any 7 — never a weekday), once; a gap starts the run again', () => {
  const today = ['a'], t0 = Date.UTC(2026, 10, 12, 20);   // a Thursday — not a week's start
  const day = i => `d202611${String(12 + i).padStart(2, '0')}`;
  let s = null, r = null;
  for (let i = 0; i < 6; i++) { r = dailyStep(s, { game: 'a', day: day(i), now: t0 + i * 864e5, today }); s = r.next; }
  assert.equal(s.dl.sr.n, 6); assert.ok(!r.ach.includes('perfect-week') && !(s.it && s.it['card-perfect-week']), 'six in a row: not yet');
  r = dailyStep(s, { game: 'a', day: day(6), now: t0 + 6 * 864e5, today }); s = r.next;
  assert.equal(s.dl.sr.n, 7); assert.ok(r.ach.includes('perfect-week') && r.items.includes('card-perfect-week'), 'the 7th in a row: PERFECT WEEK + its card');
  r = dailyStep(s, { game: 'a', day: day(7), now: t0 + 7 * 864e5, today }); s = r.next;
  assert.ok(!r.ach.includes('perfect-week'), 'once only');
  // a gap: the run starts again (a missed day) — six after a gap is not seven
  let u = null;
  for (const i of [0, 1, 2, 4, 5, 6, 7, 8]) { r = dailyStep(u, { game: 'a', day: day(i), now: t0 + i * 864e5, today }); u = r.next; }
  assert.equal(u.dl.sr.n, 5, 'the run after the gap'); assert.ok(!(u.it && u.it['card-perfect-week']), 'a gap: no PERFECT WEEK');
  // a non-counting profile never builds the run
  let x = null;
  for (let i = 0; i < 8; i++) { r = dailyStep(x, { game: 'a', day: day(i), now: t0 + i * 864e5, today, counts: false }); x = r.next; }
  assert.ok(!x.dl.sr && !(x.it && x.it['card-perfect-week']), 'never for a same-day profile');
});

test('DM2 — PENTHOUSE: rank ≤ max(1, floor(n × 1 %)) AND n ≥ 50 — exact at the edges, dormant below 50', () => {
  assert.equal(penthouseCut(50), 1); assert.equal(penthouseCut(199), 1); assert.equal(penthouseCut(200), 2); assert.equal(penthouseCut(1000), 10);
  assert.equal(isPenthouse(1, 49), false, 'below 50: dormant'); assert.equal(isPenthouse(1, 50), true, 'the top one at 50');
  assert.equal(isPenthouse(2, 199), false); assert.equal(isPenthouse(2, 200), true); assert.equal(isPenthouse(3, 200), false);
  assert.equal(isPenthouse(10, 1000), true); assert.equal(isPenthouse(11, 1000), false); assert.equal(isPenthouse(0, 100), false);
  const day = 'd20261110', now = Date.UTC(2026, 10, 10, 20);
  const ph = (rank, n, counts = true) => dailyStep(null, { game: 'a', day, now, rank, n, today: ['a', 'b'], counts });
  assert.equal(ph(1, 50).dl.ph, 1); assert.ok(ph(1, 50).ach.includes('penthouse-suite') && ph(1, 50).items.includes('card-penthouse'));
  assert.equal(ph(1, 49).dl.ph, 0, 'the 49th finisher’s day: dormant');
  assert.equal(ph(2, 150).dl.ph, 0, '2nd of 150: not the penthouse (floor(1.5) = 1)');
  assert.equal(ph(1, 80, false).dl.ph, 0); assert.deepEqual(ph(1, 80, false).ach, [], 'never for a same-day profile');
});
