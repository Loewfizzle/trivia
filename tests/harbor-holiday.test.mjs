// CITY 2.0 — PART 11a-1: THE HOLIDAY CALENDAR (PURE: js/core/harbor-holiday.js) — a whole year, Halloween's build-up by date, the
// come-down overnight into Day of the Dead, Nov 3's take-down, the pieces, the ghost ship's crossings, the light rules.
// Run: node --test tests/harbor-holiday.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { holidayAt, halloweenPieces, dotdPieces, lightRules, titleHoliday, ghostShipAt, ghostShipTimes, GHOST_LEN, PUMPKIN_DAYS, PUMPKINS_MAX, processionAt, PROCESSION_LEN, spookyFlicker, HOLIDAY_TABLE, SPIDER2_DAY } from '../js/core/harbor-holiday.js';
import { WEB_SPECS, buildWeb, webGrowth } from '../js/screens/harbor/dress-halloween.js';

const lc = (m, d, h = 21, mi = 0, y = 2026) => ({ y, m, d, h, mi, s: 0 });
const days = y => { const out = []; for (let t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += 864e5) { const D = new Date(t); out.push([D.getUTCMonth() + 1, D.getUTCDate()]); } return out; };

test('a whole year: Oct 1 → Nov 3 + the Thanksgiving build-up are dressed — Halloween through October, Day of the Dead Nov 1–3, Thanksgiving Nov 4 → the morning after the day (11a-2)', async () => {
  const { thanksgivingDay } = await import('../js/core/harbor-holiday.js');
  for (const y of [2026, 2027, 2028]) for (const [m, d] of days(y)) for (const h of [3, 9, 15, 21]) {
    const H = holidayAt(lc(m, d, h, 0, y));
    const td = thanksgivingDay(y), tg = m === 11 && d >= 4 && (d <= td || (d === td + 1 && h < 4));
    const want = m === 10 || (m === 11 && d === 1 && h < 4) ? 'halloween' : m === 11 && (d === 1 || d === 2 || (d === 3 && h < 19)) ? 'dotd' : tg ? 'thanksgiving' : null;
    assert.equal(H.id, want, `${y}-${m}-${d} ${h}:00`);
    if (!want) assert.equal(H.key, 'none');
  }
  assert.equal(holidayAt(null).id, null);
  assert.deepEqual(HOLIDAY_TABLE.map(r => r.id), ['halloween', 'dotd', 'thanksgiving']);
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
  assert.equal(titleHoliday(holidayAt(lc(11, 20))).full, false, 'the build-up: the tubes their own');
  assert.equal(titleHoliday(holidayAt(lc(11, 26, 12))).full, true, 'the day: AMBER tubes');
  assert.equal(titleHoliday(holidayAt(lc(12, 5))), null);
  let dips = 0;
  for (let s = 0; s < 600; s += 0.05) for (let i = 0; i < 8; i++) { const v = spookyFlicker(s, i); assert.ok(v >= 0 && v <= 0.9); if (v > 0.5) dips++; }
  assert.ok(dips > 200 && dips < 4000, `a few stutters a minute per lamp (${dips})`);
});

test('11a-2 — THE GIANT (the Bitcoin pumpkin) on the calendar: on its plinth from Oct 20 uncarved, carved overnight into Oct 28 (by 4 am), carved on the night, gone at 4 am Nov 1', async () => {
  const { holidayAt, halloweenPieces } = await import('../js/core/harbor-holiday.js');
  const g = (m, d, h) => { const H = holidayAt({ y: 2026, m, d, h, mi: 0 }); const P = H.id === 'halloween' ? halloweenPieces(H, { hour: h }) : null; return P ? P.giant : null; };
  assert.equal(g(10, 19, 12), null);
  assert.deepEqual([g(10, 20, 9).carved, g(10, 27, 23).carved, g(10, 28, 3).carved, g(10, 28, 5).carved, g(10, 31, 21).carved], [false, false, false, true, true]);
  assert.equal(g(11, 1, 5), null);
});
test('11a-2 — BIG PIECES CHANGE OFF-CAMERA (latchBig): held while watching, changed at a load / a return / a jump; the rest of the pieces live', async () => {
  const { latchBig, BIG_KEYS } = await import('../js/core/harbor-holiday.js');
  let r = latchBig(null, { giant: { carved: false }, web: 0.5 }, true);
  assert.deepEqual(r.pieces, { giant: { carved: false }, web: 0.5 });
  r = latchBig(r.held, { giant: { carved: true }, web: 0.6 }, false);           // (its moment passed on screen: still uncarved, the web grows)
  assert.deepEqual(r.pieces, { giant: { carved: false }, web: 0.6 });
  r = latchBig(r.held, { giant: { carved: true }, web: 0.6 }, true);            // (the next load: carved)
  assert.equal(r.pieces.giant.carved, true);
  r = latchBig(r.held, { marigolds: 1 }, false);                              // (the holiday over on screen: the giant stays until the next load)
  assert.ok(r.pieces.giant && r.pieces.marigolds === 1);
  r = latchBig(r.held, null, true);
  assert.equal(r.pieces, null);
  assert.ok(BIG_KEYS.includes('giant') && BIG_KEYS.includes('harvest'));
});

test('11a-2 — THE NOVEMBER BUILD-UP grows day by day: mums first, the bales, the corn stalks, the spots\' pumpkins, the harvest display, the wreath; the day itself amber + the parade in the morning; the raker by day until ~Nov 22; the trees held at peak colour', async () => {
  const { holidayAt, thanksgivingPieces, holidaySeason } = await import('../js/core/harbor-holiday.js');
  const at = (d, h = 12) => { const H = holidayAt({ y: 2026, m: 11, d, h, mi: 0 }); return { H, P: thanksgivingPieces(H, { hour: h }) }; };
  let prev = null;
  for (let d = 4; d <= 25; d++) { const { P } = at(d); if (prev) for (const k of ['mums', 'spots', 'wreath']) assert.ok(P[k] >= prev[k], `${k} never shrinks (Nov ${d})`); if (prev) for (const k of ['bales', 'stalks', 'harvest']) if (prev[k]) assert.ok(P[k], `${k} stays (Nov ${d})`); prev = P; }
  assert.ok(at(4).P.mums >= 1 && !at(4).P.bales && !at(4).P.harvest && at(4).P.wreath === 0, 'Nov 4: the first mums only');
  assert.ok(at(14).P.harvest && at(14).P.stalks && at(14).P.bales, 'mid-November: the harvest display stands');
  assert.ok(at(25, 21).P.party && at(25, 21).P.wreath === 1, 'the Wednesday: the homecoming party, the wreath complete');
  assert.ok(at(26, 9).P.parade && at(26, 9).P.amber && !at(26, 14).P.parade, 'the day: the parade in the morning, amber tubes');
  assert.ok(at(10, 11).P.raker && !at(10, 18).P.raker && !at(24, 11).P.raker, 'the raker: late mornings until ~Nov 22');
  assert.deepEqual(holidaySeason(at(24).H, 'winter', 0.05), { season: 'autumn', phase: 0.62 }, 'the trees at their peak colour on Thanksgiving week');
  assert.deepEqual(holidaySeason(holidayAt({ y: 2026, m: 12, d: 5, h: 12, mi: 0 }), 'winter', 0.1), { season: 'winter', phase: 0.1 }, 'after: the real season');
});

test('11a-2 — THE HOMECOMING: the night before Thanksgiving is a party night (both clocks), Thanksgiving evening is not', async () => {
  const { partyHour, partyDow, homecomingNight } = await import('../js/core/party.js');
  const { partyAt, partyAtT } = await import('../js/core/harbor-moments.js');
  const L = (y, d, h, dow) => ({ y, m: 11, d, h, mi: 0, dow });
  // 2026: Thanksgiving Thu Nov 26 → the homecoming Wed Nov 25; 2027: Thu Nov 25 → Wed Nov 24
  assert.equal(homecomingNight(2026, 11, 25), true); assert.equal(homecomingNight(2027, 11, 24), true); assert.equal(homecomingNight(2026, 11, 18), false);
  assert.equal(partyHour(L(2026, 25, 21, 3)), 21);                 // Wednesday 9 pm: the party
  assert.equal(partyHour(L(2026, 26, 1, 4)), 25);                  // its small hours (Thanksgiving 1 am)
  assert.equal(partyHour(L(2026, 26, 21, 4)), null);               // Thanksgiving evening: quiet
  assert.equal(partyHour(L(2026, 18, 21, 3)), null);               // an ordinary Wednesday
  assert.equal(partyDow(2026, 11, 27, 5), 5);                      // Black Friday is still a Friday
  const off = -300, at = (d, h) => Date.UTC(2026, 10, d, h) / 1000 - off * 60;
  assert.equal(partyAtT(at(25, 22), off), true); assert.equal(partyAtT(at(26, 1), off), true);
  assert.equal(partyAtT(at(26, 22), off), false); assert.equal(partyAtT(at(18, 22), off), false); assert.equal(partyAtT(at(27, 22), off), true);
  assert.equal(partyAt(3, 22, '2026-11-25'), true); assert.equal(partyAt(3, 22), false);
});
