// CITY 2.0 — NIGHT-B Group 0: THE SOLIDS (core/harbor-solids.js — the owner, Oct 29 9:33 pm: "a walker walked THROUGH THE CHESTNUT CART").
// node --test tests/harbor-solids.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { folkMap, folkAt, aroundSolids } from '../js/core/harbor-people.js';
import { promenadeSolids, furnitureSolids, cartSolids, usesSolid, solidsDuring, SOLID } from '../js/core/harbor-solids.js';

const SIZES = { '390x844': [390, 844, 47], '402x660': [402, 660, 62], '430x932': [430, 932, 59] };
const setup = k => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); return harborLayout(cam); };
const HPS = { none: null, tg: { harvest: true, bales: true, mums: 4, spots: 3, stalks: true, cider: true }, hw: { bigs: true } };
// the visits that sit on a bench walk onto its seat (their own bench) — every other body stays a body's width clear of every base
const SITTERS = new Set(['bench', 'lunch', 'cabwait', 'waterbench']);
const BODY = 0.2;

test('NIGHT-B — THE SOLIDS: one registry — both benches (their sitters excepted), the two trunks, the hydrant, the crossing\'s poles, the cart (parked + rolling, its vendor excepted) + every holiday piece', () => {
  const L = setup('402x660'), ids = promenadeSolids(L, HPS.tg).map(q => q.id);
  for (const id of ['water-bench', 'cab-bench', 'trunk-maple', 'trunk-crab', 'hydrant', 'pole-west', 'pole-east', 'harvest', 'tg-bench-left', 'tg-stalks-0']) assert.ok(ids.includes(id), `${id} registered (${ids.join(', ')})`);
  assert.deepEqual(promenadeSolids(L, null).map(q => q.id), furnitureSolids(L).map(q => q.id), 'no holiday: the furniture only');
  const ev = { t0: 1000, ta: 1010, tb: 5000, t1: 5010, dur: 10 }, cs = cartSolids(L, ev, { below: true, xIn: 30.4 });
  const park = cs.find(q => q.id === 'cart');
  assert.ok(park && park.t0 === ev.ta && park.t1 === ev.tb, 'the parked cart is solid for its rest');
  assert.equal(cs.filter(q => q.id === 'cart-roll').length, 2, 'its two rolls (in + out) are corridors');
  assert.ok(park.x0 <= L.cart.x - 1.22 && park.x1 >= L.cart.x + 1.22 && park.z1 >= L.cart.z + 1.18 * 1.5, 'it covers the drawn body (X ± 1.22, depth 1.18 × 1.5)');
  assert.deepEqual(solidsDuring(cs, 0, 900), [], 'nothing before its evening');
  assert.ok(usesSolid({ kind: 'vendor', legs: [] }, park), 'the vendor works AT the cart');
  const bench = promenadeSolids(L, null).find(q => q.id === 'cab-bench');
  assert.ok(usesSolid({ kind: 'cabwait', legs: [{ k: 'pose', pose: 'sit', x: L.cabStand.x, z: L.cabStand.z + 0.6, t0: 0, t1: 9 }] }, bench), 'a sitter uses its bench');
  assert.ok(usesSolid({ kind: 'bdancer', onBench: 'cab-bench', legs: [] }, bench), 'a bench dancer stands on it');
  assert.ok(!usesSolid({ kind: 'stroller', legs: [] }, bench), 'a stroller does not');
  // (a straight walk through the parked cart while it stands → bent round it; the same walk before its evening → straight)
  const walk = (t0, t1) => ({ legs: [{ k: 'walk', pts: [{ x: L.cart.x - 8, z: L.cart.z + 0.8 }, { x: L.cart.x + 8, z: L.cart.z + 0.8 }], t0, t1, v: 16 / (t1 - t0) }] });
  assert.ok(aroundSolids(walk(2000, 2014), cs, 'a').legs[0].pts.length > 2, 'round the parked cart');
  assert.equal(aroundSolids(walk(100, 114), cs, 'b').legs[0].pts.length, 2, 'straight before it came');
});

test('NIGHT-B — THE SOLIDS: over long seeded nights (a plain October evening with the cart, a party night, Halloween\'s party, a Thanksgiving build-up evening with the cider board) nobody\'s drawn body overlaps any solid — at 390 / 402×660 / 430', () => {
  const nights = [['plain', 'none', '2026-10-21T22:00:00Z', false, false], ['party', 'none', '2026-10-24T00:30:00Z', true, false], ['hween', 'hw', '2026-11-01T00:00:00Z', true, false], ['tg', 'tg', '2026-11-19T23:00:00Z', false, true]];
  for (const k of Object.keys(SIZES)) {
    const L = setup(k), P = SOLID.pad;
    for (const [name, hp, when, party, ring] of nights) {
      const S = promenadeSolids(L, HPS[hp]), M = folkMap(L, { event: ring, ring }), t0 = Date.parse(when) / 1000, cache = new Map();
      const ctx = { off: -240, seed: 1924, budget: 1, shopOpen: () => true, event: ring, ring, solids: S, solidsKey: hp, ...(party ? { party: () => ({ mode: 'party', peak: 1 }) } : {}) };
      const bad = []; let cartSeen = 0;
      for (let i = 0; i < 2400 && bad.length < 4; i++) {
        const t = t0 + i * 1.5, f = folkAt(t, { L, M, ctx }, cache);
        const cs = f.cart && f.cart.on ? [{ id: 'cart', x0: L.cart.x - (L.cart.hand > 0 ? SOLID.cart.near : SOLID.cart.handle), x1: L.cart.x + (L.cart.hand > 0 ? SOLID.cart.handle : SOLID.cart.near), z0: (f.cart.z ?? L.cart.z) + SOLID.cart.d0, z1: (f.cart.z ?? L.cart.z) + SOLID.cart.d1, owner: ['vendor'] }] : [];
        if (cs.length) cartSeen++;
        const base = [...S.map(q => ({ ...q, x0: q.x0 + P, x1: q.x1 - P, z0: q.z0 + P, z1: q.z1 - P })), ...cs];
        for (const x of f.members) for (const q of base) {
          if ((q.owner && q.owner.includes(x.kind)) || (q.sit && (x.s.pose === 'sit' || SITTERS.has(x.kind)))) continue;
          if (x.s.x > q.x0 - BODY && x.s.x < q.x1 + BODY && x.s.z > q.z0 - BODY && x.s.z < q.z1 + BODY) bad.push(`+${(i * 1.5 / 60).toFixed(1)} min: ${x.kind} ${x.m.role} ${x.s.pose} at ${x.s.x.toFixed(2)},${x.s.z.toFixed(2)} in ${q.id}`);
        }
      }
      assert.deepEqual(bad, [], `${k} ${name}`);
      if (name === 'plain' || name === 'tg') assert.ok(cartSeen > 500, `${k} ${name}: the cart was out (${cartSeen} frames)`);
    }
  }
});
