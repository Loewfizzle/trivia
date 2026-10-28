// CITY 2.0 — PART 8b2: THE CABS (core/harbor-cabs.js). node --test tests/harbor-cabs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { CAB, cabEvents, cabPlan } from '../js/core/harbor-cabs.js';
import { folkMap, folkAt, FOLK } from '../js/core/harbor-people.js';
import { signalAt } from '../js/core/harbor-promenade.js';

const OFF = -240;
const setup = () => { const cam = cameraFor(402, 874, { dock: { x: 14, y: 758, w: 374, h: 76 } }, { top: 62, bottom: 34 }); return { cam, L: harborLayout(cam) }; };
const day0Of = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 1000 - OFF * 60; };
const evH = t => { const h = ((((t + OFF * 60) / 3600) % 24) + 24) % 24; return h < 12 ? h + 24 : h; };

test('8b2 — THE CABS\' CALLS: at night only (from ~7:15 pm to ~1:30 am), more on party nights, drops early + pick-ups late, every phone the same', () => {
  const count = key => { let n = 0, drops = 0, picks = 0; const d0 = day0Of(key); for (let k = Math.floor(d0 / FOLK.block); k < Math.floor((d0 + 30 * 3600) / FOLK.block); k++) for (const e of cabEvents(k, { off: OFF })) { n++; assert.ok(evH(e.t) >= CAB.from - 0.2 && evH(e.t) <= CAB.to + 0.2, `at night (${evH(e.t).toFixed(2)})`); if (e.kind === 'drop') drops++; else picks++; } return { n, drops, picks }; };
  const wed = count('2026-10-21'), sat = count('2026-10-24');
  assert.ok(wed.n >= 10 && wed.n <= 40, `a weeknight's cabs: ${wed.n}`);
  assert.ok(sat.n > wed.n * 1.5, `a party night busier: ${sat.n} vs ${wed.n}`);
  assert.ok(wed.drops > 0 && wed.picks > 0, 'drops + pick-ups');
  assert.deepEqual(cabEvents(400000, { off: OFF }), cabEvents(400000, { off: OFF }));
});

test('8b2 — A CAB at the curb: stops short of the crossing, its fares out to the side door (lamp dark → lit) or a guest hails + gets in (lit → dark), away on green, never long; no car drives through it', () => {
  const { L } = setup(), M = folkMap(L), cache = new Map();
  const d0 = day0Of('2026-10-24');
  let seen = 0, drops = 0, picks = 0;
  for (let k = Math.floor((d0 + 20 * 3600) / FOLK.block); k < Math.floor((d0 + 25 * 3600) / FOLK.block) && seen < 6; k++) {
    for (const e of cabEvents(k, { off: OFF })) {
      const pl = cabPlan(e, L, M); if (!pl) continue;
      const T = pl.T;
      assert.ok(T.xc + T.len / 2 < L.crosswalk.x0, 'short of the crosswalk');
      assert.ok(T.tD - T.tA < 40, `never long at the curb (${(T.tD - T.tA).toFixed(1)} s)`);
      assert.equal(signalAt(T.tD * 1000).road, 'green', 'away on green');
      if (pl.kind === 'drop') { drops++; assert.equal(T.sign(T.tA), 0, 'a fare aboard: the lamp dark'); assert.equal(T.sign(T.tD), 1, 'free: lit'); for (const v of pl.riders) assert.ok(v.legs.some(lg => lg.k === 'door' && lg.door === 'side' && lg.dir === 'in'), 'to the side door'); }
      else { picks++; assert.equal(T.sign(T.tA - 1), 1, 'free: lit as it comes'); assert.equal(T.sign(T.tD), 0, 'taken: dark'); const v = pl.riders[0]; assert.ok(v.legs.some(lg => lg.k === 'pose' && lg.pose === 'wave'), 'the hail'); assert.ok(v.legs[0].k === 'door' && v.legs[0].door === 'side', 'out of the side door'); }
      seen++;
    }
  }
  assert.ok(drops > 0 && picks > 0, `both kinds (${drops} drops, ${picks} pick-ups)`);
  // on the promenade: the cabs drawn with the road's cars; no ordinary car on the near lane overlapping a standing cab
  let cabs = 0;
  for (let t = d0 + 21 * 3600; t < d0 + 23 * 3600; t += 4) {
    const R = folkAt(t, { L, M, ctx: { off: OFF } }, cache), cab = R.cars.filter(c => c.cab);
    cabs += cab.length;
    for (const c of cab) for (const o of R.cars) if (!o.cab && o.lane === 'near' && Math.abs(o.x - c.x) < (o.len + c.len) / 2) assert.fail(`a car through a cab at ${((t - d0) / 3600).toFixed(2)} h`);
  }
  assert.ok(cabs > 0, 'cabs seen on the road');
});

test('PROM — THE CAB STAND: waiters walk up + sit on the front bench facing the street (never two on one seat), then give up — walk off or cross to HAIL a back-road cab of their own; never stuck', async () => {
  const { cameraFor, harborLayout } = await import('../js/core/harbor-layout.js');
  const { folkMap, FOLK } = await import('../js/core/harbor-people.js');
  const { standEvents, standPlan, standSpots, STAND } = await import('../js/core/harbor-cabs.js');
  const cam = cameraFor(402, 874, { dock: { x: 14, y: 758, w: 374, h: 76 } }, { top: 62, bottom: 34 }), L = harborLayout(cam), M = folkMap(L), S = standSpots(L);
  const OFF = -240, day0 = Date.UTC(2026, 9, 22, 4) / 1000;
  let n = 0, hail = 0, walk = 0;
  for (let k = Math.floor(day0 / FOLK.block); k < Math.floor((day0 + 86400) / FOLK.block); k++) for (const e of standEvents(k, { off: OFF })) {
    const pl = standPlan(e, L, M); assert.ok(pl, `${e.id} planned`); n++;
    const legs = pl.rider.legs, sit = legs.find(l => l.k === 'pose' && l.pose === 'sit'), last = legs[legs.length - 1];
    assert.ok(sit && Math.abs(sit.x - S.seats[e.seat].x) < 0.05 && Math.abs(sit.z - S.seats[e.seat].z) < 0.05 && sit.face === 0, `${e.id}: sits on its seat facing the street`);
    assert.ok(sit.t1 - sit.t0 >= STAND.sit[0] - 0.01 && sit.t1 - sit.t0 <= STAND.sit[1] + 0.01, 'waits a while');
    if (pl.cab) { hail++; assert.ok(legs.some(l => l.k === 'pose' && l.pose === 'wave') && last.k === 'door' && last.dir === 'in' && pl.cab.T.tA >= sit.t1, `${e.id}: hails on the back road + gets in`); }
    else { walk++; assert.ok(last.k === 'walk' && Math.abs(last.pts[last.pts.length - 1].x) > cam.hw(last.pts[last.pts.length - 1].z), `${e.id}: walks off an edge`); }
  }
  assert.ok(n > 20 && hail >= 1 && walk > hail, `a day of waiters (${n}: ${walk} walk off, ${hail} hail)`);
  const ev = standEvents(Math.floor(day0 / FOLK.block) + 60, { off: OFF, forceStandAt: day0 + 60 * FOLK.block });
  assert.ok(ev.length >= 4, `&force=cabstand: a waiter every ~${STAND.every} s (${ev.length} in a block)`);
});
