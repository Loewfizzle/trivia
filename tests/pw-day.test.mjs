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
