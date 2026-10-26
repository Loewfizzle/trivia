// CITY 2.0 — PART 11a-1: THE HOLIDAY CALENDAR (PURE: js/core/harbor-holiday.js) — a whole year, Halloween's build-up by date, the
// come-down overnight into Day of the Dead, Nov 3's take-down, the pieces, the ghost ship's crossings, the light rules.
// Run: node --test tests/harbor-holiday.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { holidayAt, halloweenPieces, dotdPieces, lightRules, titleHoliday, ghostShipAt, ghostShipTimes, GHOST_LEN, PUMPKIN_DAYS, PUMPKINS_MAX, processionAt, PROCESSION_LEN, spookyFlicker, HOLIDAY_TABLE, SPIDER2_DAY } from '../js/core/harbor-holiday.js';
import { WEB_SPECS, buildWeb, webGrowth } from '../js/screens/harbor/dress-halloween.js';

const lc = (m, d, h = 21, mi = 0, y = 2026) => ({ y, m, d, h, mi, s: 0 });
const days = y => { const out = []; for (let t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += 864e5) { const D = new Date(t); out.push([D.getUTCMonth() + 1, D.getUTCDate()]); } return out; };

test('a whole year: only Oct 1 → Nov 3 is dressed — Halloween through October, Day of the Dead Nov 1–3, nothing else (yet)', () => {
  for (const y of [2026, 2027, 2028]) for (const [m, d] of days(y)) for (const h of [3, 9, 15, 21]) {
    const H = holidayAt(lc(m, d, h, 0, y));
    const want = m === 10 || (m === 11 && d === 1 && h < 4) ? 'halloween' : m === 11 && (d === 1 || d === 2 || (d === 3 && h < 19)) ? 'dotd' : null;
    assert.equal(H.id, want, `${y}-${m}-${d} ${h}:00`);
    if (!want) assert.equal(H.key, 'none');
  }
  assert.equal(holidayAt(null).id, null);
  assert.deepEqual(HOLIDAY_TABLE.map(r => r.id), ['halloween', 'dotd']);
});

test('HALLOWEEN builds up BY DATE: the stage climbs every day of October, the web fully woven as the 31st\'s night begins', () => {
  let last = -1;
  for (let d = 1; d <= 31; d++) for (const h of [0, 12, 17]) {
    const H = holidayAt(lc(10, d, h));
    assert.ok(H.stage >= last, `Oct ${d} ${h}:00 — the stage never goes back (${H.stage})`); last = H.stage;
  }
  assert.ok(holidayAt(lc(10, 1, 12)).stage < 0.03, 'Oct 1: barely begun');
  assert.ok(Math.abs(holidayAt(lc(10, 16, 0)).stage - 0.49) < 0.03, 'mid-month: about half');
  const o27 = holidayAt(lc(10, 27, 21)); assert.ok(o27.stage > 0.85 && o27.stage < 0.92 && o27.phase === 'build', `Oct 27 as far along as it should look (${o27.stage.toFixed(2)})`);
  const day = holidayAt(lc(10, 31, 12)), eve = holidayAt(lc(10, 31, 17, 45)), late = holidayAt(lc(11, 1, 2));
  assert.deepEqual([day.phase, day.stage, day.eve], ['day', 1, false]);
  assert.deepEqual([eve.phase, eve.stage, eve.eve], ['night', 1, true]);
  assert.deepEqual([late.id, late.phase, late.eve], ['halloween', 'night', true], '2 am Nov 1 is still Halloween night');
  assert.equal(halloweenPieces(eve).web, 1, 'the web fully woven by Halloween night');
  assert.equal(halloweenPieces(holidayAt(lc(10, 31, 16, 59))).web, 1, 'and through the day of the 31st');
});

test('the pieces of Halloween: the pumpkins multiply + get carved, the scenes + the night\'s people come in on time', () => {
  assert.equal(PUMPKIN_DAYS.length, PUMPKINS_MAX);
  let n = 0;
  for (let d = 1; d <= 31; d++) {
    const P = halloweenPieces(holidayAt(lc(10, d, 20)), { hour: 20 });
    assert.ok(P.pumpkins.length >= n, `Oct ${d}: never fewer pumpkins`); n = P.pumpkins.length;
    assert.ok(P.pumpkins.every(p => !p.carved || d >= PUMPKIN_DAYS[p.i].carve || d === 31), 'carved on its day');
  }
  assert.equal(halloweenPieces(holidayAt(lc(10, 1, 20))).pumpkins.length, 0, 'none on Oct 1');
  const eve = halloweenPieces(holidayAt(lc(10, 31, 19)), { hour: 19 });
  assert.equal(eve.pumpkins.length, PUMPKINS_MAX); assert.ok(eve.pumpkins.every(p => p.carved), 'all carved + lit on the night');
  assert.ok(eve.trickOrTreat && !eve.zombies && eve.ghostShip && eve.spooky === 1 && eve.windows === 1);
  const z = halloweenPieces(holidayAt(lc(10, 31, 22)), { hour: 22 }); assert.ok(!z.trickOrTreat && z.zombies, '10 pm: the zombies, the kids home');
  const ln = halloweenPieces(holidayAt(lc(11, 1, 1)), { hour: 1 }); assert.ok(ln.zombies && !ln.trickOrTreat, '1 am: still shambling');
  const b = halloweenPieces(holidayAt(lc(10, 10, 21)), { hour: 21 });
  assert.ok(!b.trickOrTreat && !b.zombies && !b.ghostShip && b.windows === 0 && b.spooky === 0, 'Oct 10: none of the night\'s pieces');
  assert.ok(halloweenPieces(holidayAt(lc(10, 27, 21))).windows > 0.5, 'Oct 27: the window scenes most nights');
  assert.equal(halloweenPieces(holidayAt(lc(11, 2, 12))), null, 'not on Day of the Dead');
  // WIN3 — THE SECOND SPIDER by date (the owner: part of the build-up — it arrives Oct 29, so the 30th + 31st have two), on a corner web
  // already more than half spun that day (signdress.js wants both: the piece + the web's growth ≥ ½)
  assert.equal(SPIDER2_DAY, 29);
  for (const d of [26, 27, 28]) assert.ok(!halloweenPieces(holidayAt(lc(10, d, 21)), { hour: 21 }).spider2, `Oct ${d}: one spider`);
  for (const [d, h] of [[29, 0], [29, 21], [30, 12], [31, 21]]) assert.ok(halloweenPieces(holidayAt(lc(10, d, h)), { hour: h }).spider2, `Oct ${d} ${h}:00: two spiders`);
  const web = buildWeb(WEB_SPECS[1]);
  assert.ok(webGrowth(web, holidayAt(lc(10, 29, 0)).stage) >= 0.5, `the corner web half spun by Oct 29 00:00 (${webGrowth(web, holidayAt(lc(10, 29, 0)).stage).toFixed(2)})`);
  assert.ok(halloweenPieces(holidayAt(lc(11, 1, 1)), { hour: 1 }).spider2, 'still there in the small hours of Nov 1');
});

test('DAY OF THE DEAD: dressed 4 → 7 am Nov 1, up through Nov 2, taken down through Nov 3; the procession on Nov 2 at dusk only', () => {
  const d0 = dotdPieces(holidayAt(lc(11, 1, 4, 30)), { hour: 4.5 }), d1 = dotdPieces(holidayAt(lc(11, 1, 9)), { hour: 9 });
  assert.ok(d0.marigolds > 0 && d0.petals === 0, '4:30 am: the first marigolds, no petals yet');
  assert.ok(['marigolds', 'garlands', 'papel', 'petals', 'sign', 'ofrendas'].every(k => d1[k] === 1), '9 am: all up');
  const nov3 = [8, 12, 16, 18.9].map(h => dotdPieces(holidayAt(lc(11, 3, Math.floor(h), Math.round((h % 1) * 60))), { hour: h }));
  for (let i = 1; i < nov3.length; i++) assert.ok(nov3[i].up <= nov3[i - 1].up, 'Nov 3: only coming down');
  assert.ok(nov3[nov3.length - 1].up < 0.05, 'gone by the evening of Nov 3');
  for (const [d, h, want] of [[1, 18, false], [2, 17, false], [2, 18, true], [2, 18.9, true], [2, 20, false], [3, 18, false]]) {
    const P = dotdPieces(holidayAt(lc(11, d, Math.floor(h), Math.round((h % 1) * 60))), { hour: h, dusk: 17.6 });
    assert.equal(P.procession, want, `Nov ${d} ${h}`);
  }
  assert.ok(Math.abs(processionAt(lc(11, 2, 17, 47), 17.6) - 60) < 1e-6, 'a minute in at 5:47 (dusk 5:36 + 10 min)');
  assert.equal(processionAt(lc(11, 1, 18), 17.6), null);
  assert.ok(PROCESSION_LEN >= 3600, 'about an hour + 10 min');
  assert.ok(dotdPieces(holidayAt(lc(11, 1, 12)), { hour: 12, dusk: 17.6 }).monarchs && !dotdPieces(holidayAt(lc(11, 1, 21)), { hour: 21 }).monarchs, 'monarchs by day');
});

test('THE GHOST SHIP: Halloween night only, two crossings at seeded hours (the same for everyone), never another night', () => {
  for (const y of [2026, 2027, 2030]) {
    const ts = ghostShipTimes(y);
    assert.ok(ts[0] >= 20.75 && ts[0] <= 21.75 && ts[1] >= 23 && ts[1] <= 24.5, `${y}: ${ts}`);
    assert.deepEqual(ghostShipTimes(y), ts, 'seeded');
    for (const [n, hr] of ts.entries()) {
      const h = hr % 24, isNext = hr >= 24, at = isNext ? lc(11, 1, Math.floor(h), Math.round((h % 1) * 60) + 1, y) : lc(10, 31, Math.floor(h), Math.round((h % 1) * 60) + 1, y);
      const g = ghostShipAt(at); assert.ok(g && g.n === n && g.s > 0 && g.s < GHOST_LEN, `${y} crossing ${n} at ${hr}`);
    }
    assert.equal(ghostShipAt(lc(10, 30, 21, 30, y)), null, 'not the night before');
    assert.equal(ghostShipAt(lc(11, 1, 21, 30, y)), null, 'not the night after');
  }
});

test('THE HOLIDAY LIGHT RULES: the wheel from the last week, the beam + Rosie + the strings on the night, the spooky light; Day of the Dead warm', () => {
  const r10 = lightRules(holidayAt(lc(10, 10, 21)));
  assert.deepEqual([r10.wheel, r10.beam, r10.windowTintK, r10.lampFlicker], [null, null, 0, 0], 'Oct 10: the city\'s own light');
  const r27 = lightRules(holidayAt(lc(10, 27, 21)));
  assert.equal(r27.wheel, 'halloween'); assert.equal(r27.beam, null);
  const rn = lightRules(holidayAt(lc(10, 31, 21)), { dark: 1 });
  assert.ok(rn.wheel === 'halloween' && rn.rosie === 'halloween' && rn.strings === 'halloween' && rn.beam && rn.beam[1] > rn.beam[0], 'the night: green beam, orange/purple wheel');
  assert.ok(rn.windowTintK > 0.4 && rn.lampFlicker === 1 && rn.shadow > 0.3, 'the spooky light');
  assert.equal(lightRules(holidayAt(lc(10, 31, 21)), { dark: 0 }).lampFlicker, 0, 'only after dark');
  const rd = lightRules(holidayAt(lc(11, 1, 21)));
  assert.ok(rd.sign === 'dotd' && rd.wheel === 'dotd' && rd.beam === null && rd.lampFlicker === 0, 'Day of the Dead: warm, never spooky');
  assert.deepEqual(lightRules(holidayAt(lc(12, 1))), lightRules(holidayAt(null)));
});

test('the title\'s sign reads City 2.0\'s calendar (titleHoliday); the lamps\' gutter stays in range', () => {
  assert.deepEqual(titleHoliday(holidayAt(lc(10, 20))), { id: 'halloween', full: false, k: 0.3 + 0.45 * holidayAt(lc(10, 20)).stage, c2: true });
  assert.equal(titleHoliday(holidayAt(lc(10, 31, 12))).full, true, 'the pumpkin O on the 31st');
  assert.equal(titleHoliday(holidayAt(lc(11, 2, 12))).id, 'dotd');
  assert.equal(titleHoliday(holidayAt(lc(11, 20))), null);
  let dips = 0;
  for (let s = 0; s < 600; s += 0.05) for (let i = 0; i < 8; i++) { const v = spookyFlicker(s, i); assert.ok(v >= 0 && v <= 0.9); if (v > 0.5) dips++; }
  assert.ok(dips > 200 && dips < 4000, `a few stutters a minute per lamp (${dips})`);
});
