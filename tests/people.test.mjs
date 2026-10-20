// THE STREET, Part 2 (core/people.js + core/sky.js's windows through the night): who's out when, umbrellas, the door's visits and
// the hint, the cab hails, the party line, the holidays.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pedWant, pedKind, PED_KINDS, umbrellaFor, doorGap, visitSlot, hintDue, hailGap, lineLength, holidayStreet } from '../js/core/people.js';
import { look, skyClock } from '../js/core/sky.js';
import { paletteFor } from '../js/screens/district/palette.js';

test('a quiet street: 1–3 people on an evening, a couple more at rush hour and on party nights, almost nobody 2–5 am', () => {
  const ev = pedWant(21, { dow: 3 });
  assert.ok(ev >= 1 && ev <= 3, `an evening: ${ev}`);
  assert.ok(pedWant(17.6, { dow: 3 }) > pedWant(14, { dow: 3 }), 'more at rush hour');
  assert.ok(pedWant(22, { dow: 5, party: 1 }) >= pedWant(22, { dow: 5 }) + 2, 'more on a party night');
  assert.equal(pedWant(3, { dow: 3 }), 0); assert.equal(pedWant(4.5, { dow: 3 }), 0);
  assert.ok(pedWant(12, { dow: 3 }) <= 2, 'by day: few');
  assert.ok(pedWant(21, { dow: 3, phone: false }) >= pedWant(21, { dow: 3 }), 'a wide street holds a few more');
  const kinds = new Set(Array.from({ length: 200 }, (_, i) => pedKind(i / 200, 19)));
  for (const k of PED_KINDS) assert.ok(kinds.has(k), k);
  assert.ok(!new Set(Array.from({ length: 200 }, (_, i) => pedKind(i / 200, 3))).has('waiter'), 'nobody waits for a bus that isn\'t coming');
});

test('umbrellas: rain brings most out, drizzle some, never in the snow or the dry', () => {
  const share = L => Array.from({ length: 1000 }, (_, i) => umbrellaFor(i / 1000, L, i / 1000)).filter(Boolean).length / 1000;
  assert.ok(share({ rain: 0.75 }) > 0.8, 'rain: nearly all');
  const d = share({ rain: 0.22 }); assert.ok(d > 0.3 && d < 0.6, `drizzle: some (${d})`);
  assert.equal(share({ rain: 0 }), 0); assert.equal(share({ rain: 0.4, snow: 0.5 }), 0, 'snow: hoods, not umbrellas');
  const cols = new Set(Array.from({ length: 50 }, (_, i) => String(umbrellaFor(0.1, { rain: 0.8 }, i / 50))));
  assert.ok(cols.size >= 5, 'coloured domes (red, blue, yellow, black…)');
});

test('the door: a rare little story by night, often on a party night, an ordinary door by day; the hint when the title rests', () => {
  assert.equal(doorGap(13), Infinity); assert.equal(doorGap(8), Infinity);
  assert.ok(doorGap(22, 1) < doorGap(22) / 3, 'party nights: often');
  assert.ok(doorGap(22) >= 3, 'otherwise rare');
  const t = Date.UTC(2026, 9, 21, 2);
  assert.equal(visitSlot(t, 4), visitSlot(t + 30_000, 4)); assert.notEqual(visitSlot(t, 4), visitSlot(t + 4 * 60_000, 4));
  assert.equal(visitSlot(t, Infinity), null);
  assert.equal(hintDue(5, null), false, 'not while someone is using the title');
  assert.equal(hintDue(25, null), true, 'resting: the peephole flicks open');
  assert.equal(hintDue(40, 25), false); assert.equal(hintDue(56, 25), true, 'then every ~30 s');
});

test('cab hails: evenings and nights, more on party nights; the party line grows at the peak and thins after hours', () => {
  assert.equal(hailGap(13), Infinity); assert.equal(hailGap(4), Infinity);
  assert.ok(hailGap(22, 1) < hailGap(22));
  assert.equal(lineLength(null), 0); assert.equal(lineLength({ on: 0 }), 0);
  const warm = lineLength({ on: 1, energy: 0.65, phase: 'warm' }), peak = lineLength({ on: 1, energy: 1, phase: 'peak' });
  assert.ok(warm >= 3 && peak === 5 && lineLength({ on: 1, energy: 1, phase: 'peak' }, false) === 6, `3 in the warm-up, 5 at the peak (6 on desktop): ${warm}, ${peak}`);
  assert.ok(lineLength({ on: 1, energy: 0.7, phase: 'after' }) < peak, 'after hours: thinning');
  assert.equal(lineLength({ on: 0.4, energy: 0.45, phase: 'after' }), 0, 'to nobody by the end');
});

test('the holidays on the street: Halloween kids, July 4th sparklers after dark, the New Year line\'s sparklers, the wreath', () => {
  const L = (m, d, h, mi = 0, extra = {}) => ({ local: { m, d, h, mi }, w: { night: h >= 20 || h < 5 ? 1 : 0, late: 0 }, ...extra });
  assert.ok(holidayStreet(L(10, 31, 19, 30)).halloweenKids && !holidayStreet(L(10, 31, 23)).halloweenKids && !holidayStreet(L(10, 30, 19)).halloweenKids);
  assert.ok(holidayStreet(L(7, 4, 22)).sparklers && !holidayStreet(L(7, 4, 14)).sparklers, 'July 4th: after dark');
  assert.ok(holidayStreet(L(1, 1, 0, 1, { nye: { finale: 60 } })).nyeSparklers, 'New Year: the line gets sparklers at midnight');
  assert.ok(holidayStreet(L(12, 22, 21)).wreath && !holidayStreet(L(12, 28, 21)).wreath, 'Christmas week: the wreath');
  assert.ok(holidayStreet(L(12, 31, 23)).nyeLine > 0 && holidayStreet(L(1, 1, 0, 30)).nyeLine > 0 && !holidayStreet(L(1, 1, 3)).nyeLine, "New Year's Eve: a line at the door, whatever the day");
});

test('windows through the night: sparser after midnight, 3 am sparsest, a few kitchens before dawn (never a jump); party nights hold till 2', () => {
  const win = (d, h) => { const ck = skyClock(`?when=${d}T${h}&tz=America/Detroit&at=42.96,-85.67`); return paletteFor(look(ck.now(), ck.tz, { wx: ck.wx })).win; };
  assert.ok(win('2026-10-21', '21:00') > win('2026-10-22', '00:30') && win('2026-10-22', '00:30') > win('2026-10-22', '03:00'), 'going dark after midnight');
  assert.ok(win('2026-10-22', '03:00') < 0.4, '3 am: noticeably sparser');
  const pre = ['04:00', '04:30', '05:00', '05:30', '06:00'].map(h => win('2026-10-22', h));
  for (let i = 1; i < pre.length; i++) assert.ok(pre[i] - pre[i - 1] < 0.12 && pre[i] >= pre[i - 1] - 1e-9, `a few kitchens, gradually (${pre.map(v => v.toFixed(2))})`);
  assert.ok(pre[pre.length - 1] < 0.65, 'only a few, not the whole city');
  assert.ok(win('2026-10-24', '01:30') > 0.95, 'a party night: lit until 2 am');
});
