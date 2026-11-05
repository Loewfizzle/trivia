// THE CITY's PALETTE (core/palette.js — the Harbor's light timeline reads it): the windows through the night. (CITY 1.0 OUT: City 1.0's
// street people — core/people.js — went; this palette test is what stayed of people.test.mjs.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { look, skyClock } from '../js/core/sky.js';
import { paletteFor } from '../js/core/palette.js';

test('windows through the night: sparser after midnight, 3 am sparsest, a few kitchens before dawn (never a jump); party nights hold till 2', () => {
  const win = (d, h) => { const ck = skyClock(`?when=${d}T${h}&tz=America/Detroit&at=42.96,-85.67`); return paletteFor(look(ck.now(), ck.tz, { wx: ck.wx })).win; };
  assert.ok(win('2026-10-21', '21:00') > win('2026-10-22', '00:30') && win('2026-10-22', '00:30') > win('2026-10-22', '03:00'), 'going dark after midnight');
  assert.ok(win('2026-10-22', '03:00') < 0.4, '3 am: noticeably sparser');
  const pre = ['04:00', '04:30', '05:00', '05:30', '06:00'].map(h => win('2026-10-22', h));
  for (let i = 1; i < pre.length; i++) assert.ok(pre[i] - pre[i - 1] < 0.12 && pre[i] >= pre[i - 1] - 1e-9, `a few kitchens, gradually (${pre.map(v => v.toFixed(2))})`);
  assert.ok(pre[pre.length - 1] < 0.65, 'only a few, not the whole city');
  assert.ok(win('2026-10-24', '01:30') > 0.95, 'a party night: lit until 2 am');
});
