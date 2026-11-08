// THE DAILY CONTRACT (PROGRESSION A), pure: a cartridge plugs in; the standing, the bands (from ~50 finishers), YOUR TABLE's TODAY, the
// daily's step (the streak + the counters, idempotent). The /api side: tests/integration/progression.test.mjs (the TEST-ONLY fake daily).
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SWEEP_XP, isPenthouse, penthouseCut, penthouseWinners, registerDaily, unregisterDaily, dailyOf, standing, bandFor, todayView, BAND_MIN, dailyRows, dailyRow, listedDailies, todaysDailies, addDailyRow, removeDailyRow, sweptDay, dailyXp, DAILY_XP } from '../js/core/daily.js';
import { dailyStep, penthouseStep } from '../js/core/progress.js';

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
  assert.deepEqual([r.dl.n, r.dl.early, r.dl.ph, r.streak.n], [1, 1, 0, 1], 'DFIX2: PENTHOUSE is never decided at finish time (the day\'s close — penthouseStep)');
  assert.equal(dailyStep(r.next, { game: 'fake', day: 'd20261110', now, hourET: 7 }).skip, 'counted');
  r = dailyStep(r.next, { game: 'fakelow', day: 'd20261110', now, top: 40, n: 30, hourET: 9 });
  assert.deepEqual([r.dl.n, Object.keys(r.dl.day.g).length, r.dl.early, r.dl.ph], [1, 2, 1, 0]);
  r = dailyStep(r.next, { game: 'fake', day: 'd20261111', now: now + 864e5, top: 1, n: 20, hourET: 21 });
  assert.deepEqual([r.dl.n, r.dl.ph, r.streak.n], [2, 0, 2]);
  assert.deepEqual(Object.keys(r.dl.days).sort(), ['d20261110', 'd20261111'], 'DFIX2: the two newest days keep their own counters');
  assert.equal(r.dl.day.k, 'd20261111', 'dl.day mirrors the newest day');
  unregisterDaily('fake'); unregisterDaily('fakelow');
});

// ---------------------------------------------------------------- DM1 — PLUG-AND-PLAY (no fixed count anywhere)
test('DM1 — PLUG-AND-PLAY: a FAKE 3rd + 4th daily appear in the list, the live set, THE SWEEP and the XP cap with no other change; one fewer → the sweep needs one fewer', () => {
  const ids = () => todaysDailies();
  assert.deepEqual(dailyRows().filter(r => !r.test).map(r => r.id), ['password', 'coastclear'], 'config.js#DAILIES, in order');
  assert.ok(dailyRows().every(r => r.ticket && typeof r.lesson === 'boolean' && Number.isFinite(r.order)), 'every row: order · ticket · lesson');
  assert.equal(dailyRow('coastclear').lesson, true, 'COAST CLEAR has a first-time lesson (DFIX3: THE ONE-TIME HINT under the board)');
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
  assert.ok(['keyhole', 'safecracker', 'early-bird', 'the-triple'].every(a => c.ach.includes(a)), c.ach.join());
  assert.ok(!c.ach.includes('penthouse-suite'), 'DFIX2: PENTHOUSE waits for the day\'s close');
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
  // DFIX2 — never at finish time: a finish with rank 1 of 80 adds nothing to dl.ph
  const fin = dailyStep(null, { game: 'a', day, now, rank: 1, n: 80, today: ['a', 'b'] });
  assert.equal(fin.dl.ph, 0); assert.ok(!fin.ach.includes('penthouse-suite') && !fin.items.includes('card-penthouse'));
  // THE DAY'S CLOSE (penthouseWinners): the review's probe — #1 = 950 (the day's early best), #2–#49 = 500, #50 = 950, #51 = 1000, #52–#60 = 500
  const scores = {}; for (let i = 1; i <= 60; i++) scores[`P${String(i).padStart(2, '0')}`] = i === 1 || i === 50 ? 950 : i === 51 ? 1000 : 500;
  assert.deepEqual(penthouseWinners(scores, 'high'), ['P51'], 'the one true rank 1 of the day (was: #50 + #51 at finish time)');
  scores.P51 = 950;
  assert.deepEqual(penthouseWinners(scores, 'high'), ['P01', 'P50', 'P51'], 'a tie at the top: all of them (the early best included)');
  const low = {}; for (let i = 1; i <= 200; i++) low[`L${String(i).padStart(3, '0')}`] = i <= 2 ? 3 : i === 3 ? 4 : 10;
  assert.deepEqual(penthouseWinners(low, 'low'), ['L001', 'L002'], 'a LOW daily: fewer is better; cut 2 at 200');
  low.L003 = 3;
  assert.deepEqual(penthouseWinners(low, 'low'), ['L001', 'L002', 'L003'], 'a tie AT the cutoff: all of them win');
  const few = {}; for (let i = 1; i <= 49; i++) few[`F${i}`] = i;
  assert.deepEqual(penthouseWinners(few, 'high'), [], '49 finishers: nobody (dormant below 50)');
  assert.deepEqual(penthouseWinners({}, 'high'), []);
  // penthouseStep: the winner's grant — dl.ph + PENTHOUSE SUITE + the card, ONCE (idempotent by ph_<game>_<day>)
  let w = penthouseStep(fin.next, { game: 'a', day, now: now + 36e5 });
  assert.equal(w.next.dl.ph, 1); assert.ok(w.ach.includes('penthouse-suite') && w.items.includes('card-penthouse'));
  assert.equal(penthouseStep(w.next, { game: 'a', day, now: now + 72e5 }).skip, 'counted', 'two racing closers: one grant');
  w = penthouseStep(w.next, { game: 'b', day, now: now + 72e5 });
  assert.equal(w.next.dl.ph, 2); assert.deepEqual(w.ach, [], 'a second daily\'s penthouse the same day: the counter, the achievement once');
  assert.equal(penthouseStep(null, { game: 'a', day, now }).next.dl.ph, 1, 'a profile with no stats yet');
});

test('DFIX2 — FABLE REVIEW #2 finding 1: a run that crossed 4 am finishes on YESTERDAY after today\'s finishes — BOTH days keep their sweep, PERFECT WEEK\'s run grows', () => {
  const today = ['fa', 'fb', 'test'], A = 'd20261109', B = 'd20261110';
  const atA = Date.UTC(2026, 10, 10, 3, 0), atB = Date.UTC(2026, 10, 10, 9, 5);   // day A 10 pm · day B 4:05 am Eastern
  let s = null, r = null;
  for (const g of ['fa', 'fb']) { r = dailyStep(s, { game: g, day: A, now: atA, today }); s = r.next; }      // day A: fa + fb
  for (const g of ['fa', 'fb']) { r = dailyStep(s, { game: g, day: B, now: atB, today }); s = r.next; }      // day B: fa + fb (test still in flight from A)
  assert.equal(r.swept, false); assert.deepEqual(Object.keys(s.dl.days).sort(), [A, B]);
  r = dailyStep(s, { game: 'test', day: A, now: atB + 5 * 60e3, today }); s = r.next;                        // the run from 3:50 finishes on ITS day
  assert.equal(r.swept, true, 'day A swept (was: dl.day replaced → no sweep for A)');
  assert.deepEqual(s.dl.days[B].g, { fa: 1, fb: 1 }, 'day B\'s finishes kept (was: wiped)');
  assert.deepEqual(s.dl.sr, { d: A, n: 1 });
  r = dailyStep(s, { game: 'test', day: B, now: atB + 10 * 60e3, today }); s = r.next;                       // today's test
  assert.equal(r.swept, true, 'day B swept too'); assert.equal(s.dl.sw, 2); assert.deepEqual(s.dl.sr, { d: B, n: 2 }, 'PERFECT WEEK\'s run: two in a row');
  assert.ok(Object.keys(s.m).filter(k => k.startsWith('daily_')).length === 6, 'every finish counted once');
  assert.equal(s.dl.day.k, B, 'dl.day mirrors today');
  // THE OTHER ORDER: today sweeps first, then yesterday's late run → yesterday is bridged INTO today's run (+ the run that ended the day before)
  const Z = 'd20261108', Y = 'd20261107';
  let u = null;
  for (const g of today) { r = dailyStep(u, { game: g, day: Y, now: atA - 2 * 864e5, today }); u = r.next; }   // two days back: swept (a run of 1)
  for (const g of today) { r = dailyStep(u, { game: g, day: B, now: atB, today }); u = r.next; }               // today swept — the gap (Z … A)
  assert.deepEqual(u.dl.sr, { d: B, n: 1 }); assert.equal(u.dl.sp, undefined, 'a two-day gap can never close: nothing held');
  let v = null;
  for (const g of today) { r = dailyStep(v, { game: g, day: Z, now: atA - 864e5, today }); v = r.next; }       // yesterday-but-one swept
  for (const g of ['fa', 'fb']) { r = dailyStep(v, { game: g, day: A, now: atA, today }); v = r.next; }        // yesterday: two of three (one in flight)
  for (const g of today) { r = dailyStep(v, { game: g, day: B, now: atB, today }); v = r.next; }               // today swept first
  assert.deepEqual(v.dl.sr, { d: B, n: 1 }); assert.deepEqual(v.dl.sp, { d: Z, n: 1 }, 'the old run held while yesterday may still sweep');
  r = dailyStep(v, { game: 'test', day: A, now: atB + 60e3, today }); v = r.next;                             // yesterday's late run
  assert.equal(r.swept, true); assert.deepEqual(v.dl.sr, { d: B, n: 3 }, 'Z + A + B: bridged into one run of three'); assert.equal(v.dl.sp, undefined);
  assert.equal(v.dl.sb, 3);
  assert.deepEqual(Object.keys(v.dl.days).sort(), [A, B], 'only the two newest days are kept');
});
