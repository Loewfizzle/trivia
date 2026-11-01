// CITY 2.0 — THE PEOPLE, part of harbor-people.test.mjs split out (PERF-A, FR5 D4: the unit suite's wall time is its slowest FILE —
// the one 79-s file became six of ~8–15 s, the same checks): THE BENCHES + THE STANDING PROPS ARE SOLID, THE BENCH'S SEATS. node --test tests/harbor-people-solids.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { wallPlan, hushState, strikeLevel, darkLevel } from '../js/core/harbor-hush.js';
import { lampThresholds, warmUp, lampMoment, LAMP_LIFE } from '../js/core/harbor-lamps.js';
import { standSpots } from '../js/core/harbor-cabs.js';
import { BUS, DOOR, busDoorAt, CART_IN_Z, FOLK, MIX, mixNow, folkMap, folkAt, jogHour, JOG, busesOf, busStopX, FOLK_CACHE, dogOffset, linePlaces, roofAt, roofCrowd, KINDS, TIER_CAP, capByTier } from '../js/core/harbor-people.js';
import { signalAt, centreK } from '../js/core/harbor-promenade.js';

const SIZES = {
  '390x844': { W: 390, H: 844, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, safe: { top: 59, bottom: 34 } },
};
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { dock: { x: 14, y: s.H - 116, w: s.W - 28, h: 76 } }, s.safe); return { cam, L: harborLayout(cam) }; };

// ------------------------------------------------------------------ THE HUSH WORD SIGN

const OFF = -240, DAY = Date.UTC(2026, 9, 22, 4) / 1000;     // (Thu Oct 22 2026, local midnight in Grand Rapids)
const inR = (p, r) => p.x > r.x0 + 0.05 && p.x < r.x1 - 0.05 && p.z > r.z0 + 0.05 && p.z < r.z1 - 0.05;
const onScreen = (cam, R) => R.members.filter(m => m.m.role !== 'dog' && m.routine !== 'dance' && m.s.z >= FOLK.zMin - 0.3 && Math.abs(m.s.x) < cam.hw(m.s.z));
// (NIGHT-B: `keep` picks who counts — the everyday crowd by default; THE STREET PARTY's people are on top of it, counted on their own)
const bandMean = (cam, L, M, day, h0, h1, cache, step = 30, keep = m => !m.sp) => { let n = 0, k = 0; for (let t = day + h0 * 3600; t < day + h1 * 3600; t += step) { n += onScreen(cam, folkAt(t, { L, M, ctx: { off: OFF } }, cache)).filter(keep).length; k++; } return n / k; };
// 9f — THE JOGGERS ON THEIR OWN LANE (the owner, Oct 28: "the joggers didn't show" — 1 person in ~20 at lunch): one every ~1–2 min in
// their hours, none in heavy rain, &force=joggers every ~20 s at any hour

test('8b2 — THE BENCH\'S SEATS: reserved — two sitters never share a seat (nobody sits on anybody), each at least a body apart; a full bench means they walk on', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), seen = new Map();
  let both = 0;
  for (let t = DAY + 6 * 3600; t < DAY + 2 * 86400; t += 4) {
    const R = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    const sitting = R.members.filter(m => m.m.role === 'lead' && m.s.pose === 'sit');
    for (let i = 0; i < sitting.length; i++) for (let j = i + 1; j < sitting.length; j++) assert.ok(Math.abs(sitting[i].s.x - sitting[j].s.x) > 0.9, `two on one seat at ${((t - DAY) / 3600).toFixed(2)} h`);
    if (sitting.length >= 2) both++;
    for (const v of R.visits) if (v.seat) seen.set(v.id, v.seat);
  }
  const S = [...seen.values()];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if (S[i].i === S[j].i) assert.ok(S[i].t1 <= S[j].t0 || S[j].t1 <= S[i].t0, 'a seat reserved twice at once');
  assert.ok(S.length >= 20 && both > 0, `the bench is used (${S.length} sitters, ${both} samples with two at once)`);
});

test('C4c — THE BENCHES ARE SOLID (the owner, Oct 29: a cab-stand waiter from behind walked THROUGH the bench, then sat): at 390 / 402 / 430 over a day + forced cab-stand waiters, nobody\'s feet are ever inside either bench\'s footprint except a sitter on it (seated, or stepping into a seat of the water bench from its water side); a waiter reaches the cab bench round its END', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), M = folkMap(L), cache = new Map(), bad = [];
    const fp = [L.bench, L.cabStand].filter(Boolean).map(b => ({ id: b.face, b, x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z, z1: b.z + 1.62 }));
    const seatOK = (m, q) => q.id === 'water' && (m.kind === 'bench' || m.kind === 'lunch' || m.kind === 'waterbench') && m.m.role === 'lead' && Math.abs(m.s.z - (q.b.z + 0.95)) < 1.15;
    const step = k === '402x874' ? 1 : 3;
    for (const [from, to, ctx] of [[DAY + 6 * 3600, DAY + 24 * 3600, { off: OFF }], [DAY + 20 * 3600, DAY + 20.6 * 3600, { off: OFF, forceStandAt: DAY + 20 * 3600 }]]) {
      for (let t = from; t < to; t += step) {
        const f = folkAt(t, { L, M, ctx }, cache);
        for (const m of f.members) { if (m.m.role === 'dog' || m.s.pose === 'sit') continue;
          for (const q of fp) if (m.s.x > q.x0 && m.s.x < q.x1 && m.s.z > q.z0 && m.s.z < q.z1 && !seatOK(m, q)) bad.push(`${q.id} ${m.kind}/${m.m.role} ${m.s.pose} @${((t - DAY) / 3600).toFixed(3)} h (${m.s.x.toFixed(2)}, ${m.s.z.toFixed(2)})`); }
      }
    }
    assert.equal(bad.length, 0, `${k}: inside a bench — ${bad.slice(0, 5).join(' · ')}`);
    // the forced waiter: seated on the cab bench, having come round its end (his path never crosses the bench's x-span behind its front)
    const S = standSpots(L);
    assert.ok(S.up.x < L.cabStand.x - L.cabStand.w / 2 && S.up.z < L.cabStand.z, `${k}: the waiter steps up at the bench's front-left corner`);
  }
});

test('NIGHT-A2 — THE STANDING PROPS ARE SOLID (the owner: people CLIPPING THROUGH the harvest display): over a seeded Thanksgiving evening, a Thanksgiving party night + a Halloween party night nobody\'s drawn position falls inside a standing piece\'s base (the harvest display, the bench\'s bale + mums, the hydrant\'s, the corn-stalk bundles, Halloween\'s big pumpkin on its bale); a detoured leg keeps its timing at a sane pace; a way left ↔ right still exists', async () => {
  const { standingFootprints, SOLID_PAD, HARVEST_FOOT } = await import('../js/core/harbor-holidayprops.js');
  const { aroundSolids, route } = await import('../js/core/harbor-people.js');
  const { HARVEST } = await import('../js/screens/harbor/harvest.js');
  // (the footprint covers the drawn display's base: its bottom tier + every foot piece, by its radius)
  for (const [x, y, z, , d] of HARVEST.pieces) if (y === 0) assert.ok(Math.abs(x) + d / 2 <= HARVEST_FOOT.x + 0.05 && z - d / 2 >= HARVEST_FOOT.z0 - 0.05 && z + d / 2 <= HARVEST_FOOT.z1 + 0.05, `the foot piece at ${x},${z} inside HARVEST_FOOT`);
  assert.ok(HARVEST.tiers[0].x <= HARVEST_FOOT.x && HARVEST.tiers[0].z0 >= HARVEST_FOOT.z0 && HARVEST.tiers[0].z1 <= HARVEST_FOOT.z1, 'the bottom tier inside it');
  const { L } = setup('402x874');
  const HPS = { tg: { harvest: true, bales: true, mums: 4, spots: 3, stalks: true }, hw: { bigs: true } };
  { const ids = standingFootprints(L, HPS.tg).map(q => q.id); for (const id of ['harvest', 'tg-bench-left', 'tg-stalks-0', 'tg-stalks-1']) assert.ok(ids.includes(id), `${id} covered (${ids})`); }
  assert.ok(standingFootprints(L, HPS.hw).some(q => q.id === 'big-bench-left'), 'Halloween\'s big pumpkin on its bale covered');
  assert.deepEqual(standingFootprints(L, null), [], 'no pieces, no footprints');
  let worst = 1;
  for (const [hp, when, party] of [['tg', '2026-11-20T01:00:00Z', false], ['tg', '2026-11-26T03:30:00Z', true], ['hw', '2026-11-01T02:30:00Z', true]]) {
    const S = standingFootprints(L, HPS[hp]), base = S.map(q => ({ ...q, x0: q.x0 + SOLID_PAD, x1: q.x1 - SOLID_PAD, z0: q.z0 + SOLID_PAD, z1: q.z1 - SOLID_PAD }));
    const ring = hp === 'tg', M = folkMap(L, { event: ring, ring }), t0 = Date.parse(when) / 1000, cache = new Map();
    const ctx = { off: -300, seed: 1924, budget: 1, shopOpen: () => true, event: ring, ring, solids: S, solidsKey: hp, ...(party ? { party: () => ({ mode: 'party', peak: 1 }) } : {}) };
    for (let i = 0; i < 1200; i++) {
      const f = folkAt(t0 + i * 1.5, { L, M, ctx }, cache);
      for (const x of f.members) for (const q of base) assert.ok(!(x.s.x > q.x0 && x.s.x < q.x1 && x.s.z > q.z0 && x.s.z < q.z1), `${hp} ${when} +${i * 1.5} s: ${x.kind} ${x.m.role} at ${x.s.x.toFixed(2)},${x.s.z.toFixed(2)} inside ${q.id}`);
    }
    // (a detour's pace: a straight crossing through the display → round it, in the same time)
    const m = L.medallion, v = { legs: [{ k: 'walk', pts: [{ x: m.x - 14, z: m.z - 0.5 }, { x: m.x + 14, z: m.z + 0.3 }], t0: 0, t1: 20, v: 28 / 20 }] }, o = aroundSolids(v, S, 'pace');
    if (hp === 'tg') { assert.ok(o.legs[0].pts.length > 2, 'bent round the display'); worst = Math.max(worst, o.legs[0].v / v.legs[0].v); }
    // (left ↔ right along the promenade's middle: a way exists round every piece)
    const MS = { rects: [...M.rects, ...S.map(q => ({ ...q, front: true }))], circles: M.circles }, w = route(MS, { x: -12, z: 42 }, { x: 14, z: 42 });
    assert.ok(w.length > 2 || !S.some(q => q.z0 < 42 && q.z1 > 42), `${hp}: a way left ↔ right (${w.length} points)`);
  }
  assert.ok(worst < 1.35, `a detoured crossing at most ${worst.toFixed(2)}× its pace`);
});
