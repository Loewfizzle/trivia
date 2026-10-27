// 11a-2 — BLACK FRIDAY + THE FIRST OF CHRISTMAS (core/harbor-xmas.js) + the first crew (core/harbor-workers.js#SHOWS.xlights) + the
// sale banner (core/harbor-sky.js#SALE_DAYS) + Thanksgiving's day off for the workers' trucks
import test from 'node:test';
import assert from 'node:assert/strict';
import { xmasPrelude, blackFriday, sillsAt, xlightSegments, rushAtT, XMAS } from '../js/core/harbor-xmas.js';
import { workDay, holidayOff } from '../js/core/harbor-workers.js';
import { saleDayOn, eventMessage, HOLIDAY_BANNERS } from '../js/core/harbor-sky.js';
import { SPEAK_WIN, SPEAK_V } from '../js/core/harbor-speakeasy.js';
import { mixNow } from '../js/core/harbor-people.js';

const L = (m, d, h, y = 2026) => ({ y, m, d, h: Math.floor(h), mi: Math.round((h % 1) * 60) });

test('Black Friday is the day after the fourth Thursday of November', () => {
  assert.deepEqual(blackFriday(2026), { m: 11, d: 27 });
  assert.deepEqual(blackFriday(2027), { m: 11, d: 26 });
  assert.deepEqual(blackFriday(2030), { m: 11, d: 29 });
});

test('the day by the clock: the rush, the tree stand, the crew, the strings up + lit, the banner', () => {
  assert.equal(xmasPrelude(L(11, 26, 20)).bf, false, 'Thanksgiving evening: nothing yet');
  assert.equal(xmasPrelude(L(11, 26, 20)).lights, 0);
  const m = xmasPrelude(L(11, 27, 8));
  assert.ok(m.bf && m.rush > 0.5 && m.tree && m.crew === 'before' && m.lights === 0 && !m.lit, 'Black Friday 8 am: the rush, the stand, before the crew');
  const w = xmasPrelude(L(11, 27, 11));
  assert.ok(w.crew === 'during' && w.lights === 0 && w.banner && w.rush === 1, '11 am: the crew at work, the sale banner');
  const a = xmasPrelude(L(11, 27, 13));
  assert.ok(a.crew === 'after' && a.lights === 1 && !a.lit, '1 pm: the strings up, not lit by day');
  assert.ok(xmasPrelude(L(11, 27, 18.5)).lit, 'the first evening: lit');
  assert.ok(xmasPrelude(L(11, 28, 0.5)).lit, '…into the small hours');
  assert.ok(!xmasPrelude(L(11, 28, 12)).lit && xmasPrelude(L(11, 28, 12)).lights === 1 && !xmasPrelude(L(11, 28, 12)).bf, 'Saturday noon: up, off, no rush');
  assert.ok(xmasPrelude(L(12, 24, 20)).tree && !xmasPrelude(L(12, 24, 21.5)).tree, 'the stand until Christmas Eve 9 pm');
  assert.ok(xmasPrelude(L(1, 6, 18, 2027)).lit && !xmasPrelude(L(1, 7, 18, 2027)).lit, 'the strings to Jan 6');
  assert.ok(!xmasPrelude(L(11, 27, 0.5)).lit, 'never the night before Black Friday');
  assert.equal(xmasPrelude(L(11, 27, 13, 2027)).bf, false, '2027: Black Friday is the 26th');
  assert.ok(xmasPrelude(L(11, 26, 13, 2027)).bf);
});

test('the crew: hung in the rig\'s order, every string done by its end; the segments on the real front', () => {
  const segs = xlightSegments(SPEAK_WIN, SPEAK_V.rows, SPEAK_V.cornice[0], { u0: 2, u1: 8.1, v: 3.06 });
  assert.equal(segs.length, 1 + SPEAK_WIN.length * SPEAK_V.rows.length + 1, 'the cornice + a sill per window + the awning');
  for (const g of segs) assert.ok(g.u1 > g.u0 && g.n >= 6 && g.u0 > -0.5 && g.u1 < 11.7, `${g.id} on the front`);
  const k0 = sillsAt(0), k1 = sillsAt(1);
  for (const g of segs.filter(g => !g.awning)) { assert.equal(k0[g.id] || 0, 0, `${g.id} not up at the start`); assert.equal(k1[g.id], 1, `${g.id} all up at the end`); }
  assert.ok(sillsAt(0.2)['sill-1-2'] > 0 && sillsAt(0.2)['sill-0-0'] === 0, 'the top floor before the lower one');
  for (let k = 0; k < 1; k += 0.05) { const a = sillsAt(k), b = sillsAt(k + 0.05); for (const id of Object.keys(a)) assert.ok(b[id] >= a[id], `${id} never comes down`); }
});

test('the workers: the lights crew on Black Friday only, at its hour; Thanksgiving a day off for every truck', () => {
  const day0 = (y, m, d) => Date.UTC(y, m - 1, d) / 1000 + 300 * 60;
  const bf = workDay('2026-11-27', { day0: day0(2026, 11, 27), off: -300, seed: 1924 });
  const xl = bf.find(w => w.kind === 'xlights');
  assert.ok(xl && Math.abs((xl.t0 - day0(2026, 11, 27)) / 3600 - XMAS.crew.at) < 1e-6 && xl.truck && xl.truck.model === 'van', 'the crew at 9:45 with the van');
  assert.ok(!bf.some(w => w.show && w !== xl && w.t0 < xl.t1 && w.t1 > xl.t0), 'no other show over it');
  for (const k of ['2026-11-20', '2026-11-28', '2026-12-04']) assert.ok(!workDay(k, { day0: 0, off: -300 }).some(w => w.kind === 'xlights'), `${k}: no lights crew`);
  assert.ok(holidayOff('2026-11-26') && !holidayOff('2026-11-27'));
  const tg = workDay('2026-11-26', { day0: day0(2026, 11, 26), off: -300, seed: 1924 });
  assert.ok(!tg.some(w => w.show && w.kind !== 'newsdrop'), `Thanksgiving: no truck show but the newspaper van (${tg.filter(w => w.show).map(w => w.kind)})`);
});

test('the rush: more people, hurrying; the sale banner on its day', () => {
  const a = mixNow({ h: 13, dow: 5 }), b = mixNow({ h: 13, dow: 5, rush: 1 });
  assert.ok(b.n > a.n * 1.3 && (b.mix.brisk || 0) > (a.mix.brisk || 0) + 2, 'more out, most brisk');
  assert.ok(rushAtT(Date.UTC(2026, 10, 27, 18) / 1000, -300) === 1 && rushAtT(Date.UTC(2026, 10, 28, 18) / 1000, -300) === 0);
  const sd = saleDayOn(2026, 11, 27);
  assert.ok(sd && sd.banner && sd.banner.h >= 9 && sd.banner.h <= 16 && sd.banner.text.every(t => t.length <= 24), 'the sale banner at its hour, panels ≤ 24');
  assert.equal(saleDayOn(2026, 11, 26), null);
  const lines = HOLIDAY_BANNERS.blackfriday.flat().join(' ');
  assert.ok(!/[a-z]/.test(lines) && /SALE/.test(lines), 'capitals, a sale — no store, no brand');
  let n = 0; for (let s = 0; s < 30; s++) if (HOLIDAY_BANNERS.blackfriday.some(p => p === eventMessage('banner', s, [], 'blackfriday'))) n++;
  assert.ok(n >= 18, `two of three random banners carry the sale (${n}/30)`);
});
