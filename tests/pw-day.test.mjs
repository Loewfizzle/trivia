// THE PASSWORD — THE SECRET SCHEDULE (PW1 — api/_lib/pw-day.js): deterministic for a pepper, two different words a day, no repeat across a
// whole cycle, a different pepper → a different order, never a function of the date alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayWords, orderFor, slotOf, keyedRng, SCHEDULE_EPOCH } from '../api/_lib/pw-day.js';
import { dayOf, dayNum } from '../js/core/streak.js';

const LIST = Array.from({ length: 201 }, (_, i) => `w${String(i).padStart(4, '0')}`);   // an ODD list: the leftover word rotates by cycle
const P1 = 'pepper-one', P2 = 'pepper-two';

test('deterministic for a fixed pepper; two different words a day; upper case', () => {
  const a = dayWords('d20261107', LIST, P1), b = dayWords('d20261107', LIST, P1);
  assert.deepEqual(a, b);
  assert.equal(a.length, 2); assert.notEqual(a[0], a[1]);
  assert.ok(a.every(w => /^W\d{4}$/.test(w)));
  assert.notDeepEqual(dayWords('d20261107', LIST, P1), dayWords('d20261108', LIST, P1));
});

test('no word repeats until the list is used up: a whole cycle uses every word once (the odd one left over), then a fresh order', () => {
  const per = Math.floor(LIST.length / 2);
  const seen = new Map();
  for (let k = 0; k < per; k++) for (const w of dayWords(dayOf(SCHEDULE_EPOCH + k), LIST, P1)) seen.set(w, (seen.get(w) || 0) + 1);
  assert.equal(seen.size, LIST.length - 1, 'every word but the leftover, once');
  assert.ok([...seen.values()].every(c => c === 1));
  // the next cycle: a different order — not the same pairs again
  const c0 = Array.from({ length: per }, (_, k) => dayWords(dayOf(SCHEDULE_EPOCH + k), LIST, P1).join('+'));
  const c1 = Array.from({ length: per }, (_, k) => dayWords(dayOf(SCHEDULE_EPOCH + per + k), LIST, P1).join('+'));
  assert.notDeepEqual(c0, c1);
  assert.ok(c1.filter((p, i) => p === c0[i]).length < per / 10, 'the pairs are new');
  assert.deepEqual(slotOf(dayOf(SCHEDULE_EPOCH + per + 3), LIST.length), { cycle: 1, k: 3, per });
  // a day before the epoch still gets two words (the cycle before)
  const early = dayWords(dayOf(SCHEDULE_EPOCH - 5), LIST, P1);
  assert.equal(early.length, 2); assert.notEqual(early[0], early[1]);
  assert.equal(slotOf(dayOf(SCHEDULE_EPOCH - 5), LIST.length).cycle, -1);
});

test('a different pepper → a different order; the date alone decides nothing', () => {
  const o1 = orderFor(LIST, P1, 0), o2 = orderFor(LIST, P2, 0);
  assert.notDeepEqual(o1, o2);
  assert.deepEqual([...o1].sort(), LIST, 'a permutation');
  let same = 0;
  for (let k = 0; k < 60; k++) if (dayWords(dayOf(SCHEDULE_EPOCH + k), LIST, P1).join() === dayWords(dayOf(SCHEDULE_EPOCH + k), LIST, P2).join()) same++;
  assert.ok(same <= 1, `two peppers agree on ${same} of 60 days`);
  // the stream: in [0, 1), keyed, deterministic
  const r = keyedRng(P1, 'x'), r2 = keyedRng(P1, 'x');
  const xs = Array.from({ length: 20 }, () => r());
  assert.ok(xs.every(x => x >= 0 && x < 1) && new Set(xs).size > 15);
  assert.deepEqual(xs, Array.from({ length: 20 }, () => r2()));
  assert.throws(() => dayWords('d20261107', ['one'], P1)); assert.throws(() => dayWords('d20261107', LIST, ''));
  assert.equal(SCHEDULE_EPOCH, dayNum('d20261101'));
});

// ---------------------------------------------------------------- DM1 — THE FROZEN SCHEDULE (FABLE REVIEW #1, 13)
import { freezeSchedule, extendSchedule, reconcileSchedule, frozenWords, dayIndex, listHash } from '../api/_lib/pw-day.js';
const EVEN = Array.from({ length: 200 }, (_, i) => `w${String(i).padStart(4, '0')}`);
const run = (rec, list, days) => { const out = []; for (let k = 0; k < days; k++) { rec = extendSchedule(rec, list, P1, k); out.push(frozenWords(rec, k).join('+')); } return { rec, out }; };

test('DM1 — THE FROZEN SCHEDULE equals the old formula while the list is untouched (switching to it moved nothing), across cycles', () => {
  for (const list of [LIST, EVEN]) {
    const { out } = run(freezeSchedule(list, P1), list, 3 * Math.floor(list.length / 2) + 5);
    out.forEach((pair, k) => assert.equal(pair, dayWords(dayOf(SCHEDULE_EPOCH + k), list, P1).join('+'), `day ${k}`));
  }
  assert.equal(dayIndex(dayOf(SCHEDULE_EPOCH + 7)), 7);
  assert.notEqual(listHash(LIST), listHash(EVEN));
});

test('DM1 — removing a word changes NOTHING before its day (the later days slide up; no reshuffle); every day two different words', () => {
  const days = 150;
  const base = run(freezeSchedule(EVEN, P1), EVEN, days);
  const today = 40;
  const gone = base.rec.s[2 * 90];                       // a word scheduled for day 90
  const pastWord = base.rec.s[2 * 10];                    // and one already played (day 10)
  const list2 = EVEN.filter(w => w.toUpperCase() !== gone && w.toUpperCase() !== pastWord);
  let rec = reconcileSchedule(extendSchedule(freezeSchedule(EVEN, P1), EVEN, P1, today), list2, P1, today);
  const after = run(rec, list2, days).out;
  for (let k = 0; k < 90; k++) assert.equal(after[k], base.out[k], `day ${k} (before the removed word's day) unchanged`);
  assert.ok(!after.slice(90).some(p => p.split('+').includes(gone)), 'the removed word is skipped');
  assert.equal(after[90].split('+')[0], base.rec.s[2 * 90 + 1], 'its day slides up one word');
  assert.ok(after.every(p => { const [a, b] = p.split('+'); return a && b && a !== b; }));
});

test('DM1 — adding a word changes nothing already scheduled: it joins the END of the cycle', () => {
  const per = EVEN.length / 2, today = 30;
  const base = run(freezeSchedule(EVEN, P1), EVEN, per).out;
  const list2 = [...EVEN, 'NEWW1', 'NEWW2', 'NEWW3'];
  const rec0 = extendSchedule(freezeSchedule(EVEN, P1), EVEN, P1, today);
  const rec = reconcileSchedule(rec0, list2, P1, today);
  const after = run(rec, list2, per + 2).out;
  for (let k = 0; k < per; k++) assert.equal(after[k], base[k], `day ${k} unchanged`);
  const tail = after.slice(per, per + 2).join('+').split('+');
  assert.ok(['NEWW1', 'NEWW2', 'NEWW3'].every(w => rec.s.slice(-3).includes(w)), 'the new words at the end');
  assert.ok(tail.some(w => w.startsWith('NEWW')), 'played right after the cycle\'s last day');
  assert.equal(rec.h, listHash(list2));
  // reconciling twice with the same list is a no-op
  assert.deepEqual(reconcileSchedule(rec, list2, P1, today).s, rec.s);
});
