// CITY 2.0 — PART 8b2: THE RAID (core/harbor-raid.js). node --test tests/harbor-raid.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { RAID, raidEvening, raidNear, raidPlan, raidAt, raidCarAt, forcedRaid } from '../js/core/harbor-raid.js';
import { bootlegNight, prevKey } from '../js/core/harbor-workers.js';
import { legendNight } from '../js/core/harbor-legend.js';
import { holidayOf } from '../js/core/sky.js';
import { signalAt } from '../js/core/harbor-promenade.js';
import { folkMap, folkAt, FOLK } from '../js/core/harbor-people.js';

const OFF = -240;     // Grand Rapids in October (EDT)
const SIZES = { '390x844': [390, 844, 47], '402x874': [402, 874, 62], '430x932': [430, 932, 59] };
const setup = k => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); return { cam, L: harborLayout(cam) }; };
const keyOf = n => { const d = new Date(Date.UTC(2026, 0, 1) + n * 864e5); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
const day0Of = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 1000 - OFF * 60; };
const dowOf = key => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

test('8b2 — THE RAID\'s SCHEDULE: it follows the bootleggers (the night after a delivery, ~50 %) + a rare party-night raid; ~one a week; prime time; never a holiday or a legendary night; every phone the same', () => {
  let n = 0, after = 0, party = 0, deliveries = 0;
  const days = 364;
  for (let i = 0; i < days; i++) {
    const key = keyOf(i), day0 = day0Of(key), rd = raidEvening(key, { off: OFF, day0 });
    const prev = prevKey(key), delivered = bootlegNight(prev) || dowOf(prev) === 6;
    if (delivered) deliveries++;
    if (!rd) continue;
    n++;
    assert.deepEqual(raidEvening(key, { off: OFF, day0 }), rd, 'the same on every phone');
    const h = (rd.t0 - day0) / 3600;
    assert.ok(h >= RAID.window[0] - 1e-6 && h <= RAID.window[1] + 0.05, `${key}: prime time (${h.toFixed(2)} h)`);
    assert.ok(rd.why === 'after-delivery' ? delivered : [5, 6].includes(dowOf(key)), `${key}: ${rd.why}`);
    if (rd.why === 'after-delivery') after++; else party++;
    const [y, m, d] = key.split('-').map(Number);
    assert.ok(!legendNight(y, m, d), `${key}: never on a legendary night`);
    const hol = holidayOf(y, m, d); assert.ok(!(hol && hol.full), `${key}: never on a holiday (${hol && hol.id})`);
  }
  const perWeek = n / (days / 7);
  assert.ok(perWeek > 0.6 && perWeek < 1.5, `~one a week (${perWeek.toFixed(2)})`);
  assert.ok(after / Math.max(1, deliveries) > 0.3 && after / deliveries < 0.6, `the night after a delivery ~50 % (${after}/${deliveries})`);
  assert.ok(party >= 6 && party <= 20, `a party-night raid ~once a month (${party} a year)`);
});

test('8b2 — THE RAID\'s CONVOY at 390 / 402 / 430: out from behind the speakeasy, the rolling cars cross only on green, the last stops at the stop line + pulls away on green, the officer at the kerb with his flashlight, everyone gone', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), base = day0Of('2026-10-26') + 21.5 * 3600;
    for (const t0 of [base, base + 37, base + 81]) {
      const P = raidPlan({ key: `t${t0}`, t0, party: false, why: 'test' }, L);
      assert.equal(P.cars.length, RAID.cars);
      assert.ok(P.tStop != null && P.tDepart > P.tStop + 10, `${k}: the last car stops a while`);
      const last = P.cars[P.cars.length - 1];
      assert.ok(Math.abs(raidCarAt(last, P.tStop + 2).x - P.stopX) < 0.4 && raidCarAt(last, P.tStop + 2).speed < 0.05, `${k}: stopped at the line`);
      assert.equal(signalAt(P.tDepart * 1000).road, 'green', `${k}: it pulls away on green`);
      // the rolling cars on the crossing only on green
      for (const c of P.cars.slice(0, -1)) for (let t = P.t0; t < P.tEnd; t += 0.2) { const s = raidCarAt(c, t); if (s && s.x + c.len / 2 > L.crosswalk.x0 - 0.6 && s.x - c.len / 2 < L.crosswalk.x1) assert.equal(signalAt(t * 1000).road, 'green', `${k}: car ${c.n} on the crossing at ${(t - P.t0).toFixed(1)} s`); }
      // the cars never overlap (a gap kept)
      for (let t = P.t0; t < P.tEnd; t += 0.5) { const xs = P.cars.map(c => raidCarAt(c, t)).map(s => (s ? s.x : null)); for (let i = 1; i < xs.length; i++) if (xs[i] != null && xs[i - 1] != null) assert.ok(xs[i - 1] - xs[i] > RAID.len + 0.6, `${k}: a gap kept`); }
      // the officer: out at the kerb (on the road's edge, never on the promenade) while the beam sweeps
      const o = P.officer.legs[1]; assert.equal(o.pose, 'flash'); assert.ok(o.z > FOLK.roadZ && o.z < FOLK.roadZ + 1, `${k}: at the kerb`);
      assert.ok(P.officer.t1 < P.tDepart, `${k}: back in before it leaves`);
      // the lights: dark from the first car showing, back after the last is gone
      assert.equal(raidAt(P, P.tAppear - 0.5).power, 1);
      assert.equal(raidAt(P, P.tAppear + 0.5).power, 0);
      assert.equal(raidAt(P, P.tStop + 3).power, 0);
      assert.ok(raidAt(P, P.tBack + RAID.back.full + 1).power > 0.99, `${k}: back on`);
      assert.ok(raidAt(P, P.tAppear + 1).club < 0.1 && raidAt(P, P.tBack + 14).club > 0.9, `${k}: the club hushed, then back`);
      const w0 = [...Array(6).keys()].map(i => raidAt(P, P.tBack + 0.8).win(i)), w1 = [...Array(6).keys()].map(i => raidAt(P, P.tBack + 3.2).win(i));
      assert.ok(w0.filter(v => v == null || v > 0.5).length < w1.filter(v => v == null || v > 0.5).length, `${k}: one window, then another`);
      assert.equal(raidAt(P, P.tEnd + 1).cars.length, 0, `${k}: all gone`);
    }
  }
});

test('8b2 — THE RAID on the promenade: people freeze / walk off / look away, the doorman slips inside, the officer comes out; nobody new while it lasts; the near lane holds', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map();
  const sat = day0Of('2026-10-24');      // (a party night: the line, its doorman)
  const P = raidPlan(forcedRaid(sat + 22 * 3600, sat + 22 * 3600 - 40, true), L);
  const ctx = { off: OFF, raid: P };
  const at = t => folkAt(t, { L, M, ctx }, cache);
  const before = at(P.tAppear - 1), mid = at(P.tStop + 4), after = at(P.tBack + 60);
  assert.ok(mid.members.some(m => m.kind === 'officer' && m.s.pose === 'flash'), 'the officer with his flashlight');
  const newcomers = mid.visits.filter(v => v.t0 > P.tAppear + 1 && v.kind !== 'officer' && !v.routine);
  assert.equal(newcomers.length, 0, 'nobody new while it lasts');
  const frozen = mid.members.filter(m => m.s.pose === 'wait' && m.m.role === 'lead' && m.s.z < FOLK.roadZ);
  assert.ok(before.members.length === 0 || frozen.length >= 1 || mid.members.length < before.members.length, 'they freeze or leave');
  assert.ok(!mid.members.some(m => m.kind === 'doorman' && !m.s.door && m.s.z < FOLK.doorZ + 2 && m.s.pose === 'wait' && Math.abs(m.s.hd + Math.PI / 2) < 0.3), 'the doorman is not at his post');
  // the near lane: no ordinary car on it while the convoy's out
  for (let t = P.t0; t < P.tEnd; t += 3) for (const c of at(t).cars) if (!c.beacon && c.lane === 'near') assert.ok(c.ts < P.t0 - 1, `a car entered the near lane during the raid (${c.id})`);
  assert.ok(after.members.length >= 0);
  // raidNear finds a scheduled raid
  for (let i = 0; i < 120; i++) { const key = keyOf(270 + i), day0 = day0Of(key), rd = raidEvening(key, { off: OFF, day0 }); if (rd) { assert.equal(raidNear(rd.t0 + 30, { off: OFF }).t0, rd.t0); break; } }
});
