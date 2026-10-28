// CITY 2.0 — WIN add-on: THE DRESSING SPOTS (core/harbor-spots.js, PURE) + Halloween's big set pieces on them + the door's five pumpkins.
// node --test tests/harbor-spots.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { dressingSpots, spotProblems, spotById } from '../js/core/harbor-spots.js';
import { bigPumpkins, BIG_PIECES, pumpkinSlots, BALE } from '../js/core/harbor-holidayprops.js';
import { PUMPKINS_MAX, BIG_DAY, halloweenPieces, holidayAt } from '../js/core/harbor-holiday.js';
import { linePlaces } from '../js/core/harbor-people.js';
import { RING } from '../js/core/harbor-routines.js';

const SIZES = { '390x844': [390, 844, 47], '402x874': [402, 874, 62], '430x932': [430, 932, 59], '1440x900': [1440, 900, 0] };
const setup = k => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); return { cam, L: harborLayout(cam) }; };
const rect = (cam, p) => { const [x, y] = project(cam, p.x, p.y || 0, p.z), s = cam.F / p.z, w = p.d * s; return { x: x - w / 2, y: y - w * 0.95, w, h: w * 0.95 }; };
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('WIN — THE DRESSING SPOTS (PROM: no lampposts — by the BIG pieces only: the bench, the two trees, the compass, the hydrant, the railing + the open corner) — every one obeys the rules at every phone', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), sp = dressingSpots(L), ids = sp.map(s => s.id);
    // (a desktop panorama drops the spots its left edge cuts — the front strip's; every phone has them all)
    assert.ok(!ids.some(i => /^(lamp|globe)-/.test(i)), `${k}: no lamp-post spots (${ids.join(' ')})`);
    for (const id of [...(L.cam.wide ? ['bench-left', 'bench-right', 'compass-left', 'compass-right'] : ['bench-left', 'bench-right', 'maple', 'compass-left', 'compass-right', 'hydrant', 'corner-right'])]) assert.ok(ids.includes(id), `${k}: ${id}`);
    assert.ok(ids.filter(i => i.startsWith('rail-')).length >= 2, `${k}: spots along the railing (${ids.join(' ')})`);
    assert.equal(new Set(ids).size, ids.length, `${k}: distinct ids`);
    for (const s of sp) {
      assert.ok(['near', 'top', 'far'].includes(s.pass) && s.r > 0.5 && s.r < 1.2, `${k}: ${s.id} pass ${s.pass} r ${s.r}`);
      assert.deepEqual(spotProblems(L, s), [], `${k}: ${s.id} obeys the rules`);
    }
    if (!L.cam.wide) assert.equal(spotById(L, 'hydrant').pass, 'top', 'the front strip: nearer than anyone on the floor');
    // a spot in the lobby line / the door's approach / on the crosswalk would be refused
    const g = linePlaces(L, 8)[2];
    assert.ok(spotProblems(L, { x: g.x, z: g.z, r: 0.7 }).includes('in the lobby line'), `${k}: the line is refused`);
    const s = L.speakeasy; assert.ok(spotProblems(L, { x: s.x0 + 9.8, z: s.z0 - 1.2, r: 0.6 }).some(m => m.includes('door')), `${k}: the door's approach is refused`);
    const cw = L.crosswalk; assert.ok(spotProblems(L, { x: (cw.x0 + cw.x1) / 2, z: 52.5, r: 0.6 }).some(m => m.includes('crosswalk')), `${k}: the crosswalk's landing is refused`);
  }
});

test('WIN — THE BIG JACK-O\'-LANTERNS: three on known spots (the hydrant, the bench\'s end on a bale, the right lamp post on a bale), ≥ 15 pt across at 390, above the dock, apart from everything; the farm delivery Oct 20', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), bigs = bigPumpkins(L), spots = dressingSpots(L), steps = pumpkinSlots(L);
    assert.equal(bigs.length, BIG_PIECES.length, `${k}: every piece placed`);
    for (const b of bigs) {
      const sp = spots.find(q => q.id === b.spot); assert.ok(sp, `${k}: ${b.spot} is a spot`);
      assert.ok(b.d / 2 <= sp.r + 0.05, `${k}: ${b.spot}: the pumpkin (d ${b.d}) fits the spot (r ${sp.r})`);
      const r = rect(cam, b); assert.ok(r.w >= 15, `${k}: ${b.spot} reads at a glance: ${r.w.toFixed(1)} pt across`);
      assert.ok(r.y + r.h < cam.dock.y - 2, `${k}: ${b.spot} above the dock (${(r.y + r.h).toFixed(0)} < ${cam.dock.y})`);
      assert.equal(b.y, b.bale ? BALE.h : 0, `${k}: ${b.spot} ${b.bale ? 'on its bale' : 'on the paving'}`);
      for (const o of steps) assert.ok(!overlap(r, rect(cam, o)), `${k}: ${b.spot} clear of the door's pumpkins`);
    }
    for (let i = 0; i < bigs.length; i++) for (let j = i + 1; j < bigs.length; j++) assert.ok(!overlap(rect(cam, bigs[i]), rect(cam, bigs[j])), `${k}: ${bigs[i].spot} + ${bigs[j].spot} apart`);
    // (11a-2: the giant owns the centre — the bench's piece at its FAR end, the front corner's retired)
    assert.ok(bigs.some(b => b.spot === 'hydrant' && !b.bale) && bigs.some(b => b.spot === 'bench-left' && b.bale) && !bigs.some(b => b.spot === 'corner-right' || b.spot === 'bench-right'), `${k}: the hydrant's + the bench's far end on a bale`);
    // (WIN3: the corner piece on the front strip — nearer than any walker (zMin 38.75), left of the cart's rest, above the dock)
    // (11a-2: every big piece clear of THE GIANT's dance ring round the inlay)
    { const m = L.medallion; for (const b of bigs) { const e = Math.hypot((b.x - m.x) / RING.rx, (b.z - m.z - RING.cz) / RING.rz); assert.ok(e > 1.15, `${k}: ${b.spot} clear of the ring (${e.toFixed(2)})`); } }
  }
  const at = (d, h = 21) => halloweenPieces(holidayAt({ y: 2026, m: 10, d, h, mi: 0 }));
  assert.equal(BIG_DAY, 20); assert.ok(!at(19).bigs && at(20).bigs && at(27).bigs && at(31).bigs, 'the big ones from Oct 20');
});

test('WIN — THE DOOR\'S FIVE at 390: a stepped group on the steps + one each side of the door, apart on screen, the door\'s path free', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), sl = pumpkinSlots(L), s = L.speakeasy;
    assert.equal(sl.length, PUMPKINS_MAX, `${k}: five`); assert.equal(PUMPKINS_MAX, 5);
    const onSteps = sl.filter(p => p.y > 0.05), left = sl.filter(p => p.y <= 0.05 && p.x - s.x0 < s.door.u0), right = sl.filter(p => p.y <= 0.05 && p.x - s.x0 > s.door.u1);
    assert.ok(onSteps.length === 3 && left.length === 1 && right.length === 1, `${k}: 3 on the steps, 1 left, 1 right (${onSteps.length}/${left.length}/${right.length})`);
    assert.ok(onSteps.some(p => p.y > 0.2), `${k}: one on the upper step (the stepped group)`);
    const rs = sl.map(p => rect(cam, p));
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j], gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), sameLevel = Math.abs(sl[i].y - sl[j].y) < 0.05 && Math.abs(sl[i].z - sl[j].z) < 0.3;
      if (sameLevel) assert.ok(gapX >= 0.5, `${k}: ${i} + ${j} apart on screen (gap ${gapX.toFixed(1)} pt)`);
    }
    for (const p of sl) { const u = p.x - s.x0; assert.ok(!(p.y > 0.2 && u > 9.3 + p.d / 2 && u < 10.3 - p.d / 2), `${k}: the door's path free`); }
    assert.equal(new Set(sl.map(p => p.face)).size, sl.length, `${k}: every face different`);
  }
});

test('11a-2 — THE NOVEMBER SPOT PIECES: the bench\'s bale, the hydrant\'s mums, the corn stalks round the two trees (PROM: no lampposts) — on screen, above the dock, clear of the dance ring, at three phone sizes', async () => {
  const { thanksgivingSpots } = await import('../js/core/harbor-holidayprops.js');
  const full = { mums: 4, bales: true, spots: 3, stalks: true };
  for (const k of ['390x844', '402x874', '430x932']) {
    const { L } = setup(k), list = thanksgivingSpots(L, full), m = L.medallion;
    assert.deepEqual(list.map(p => p.id).sort(), ['bench-left', 'hydrant', 'stalks-0', 'stalks-1'].sort(), `${k}: the four pieces`);
    for (const p of list) {
      const [sx, sy] = project(L.cam, p.x, 0, p.z);
      assert.ok(sx > 0 && sx < L.cam.W && sy < L.cam.dock.y - 2, `${k}: ${p.id} on screen above the dock (${sx.toFixed(0)}, ${sy.toFixed(0)})`);
      if (p.id === 'bench-left' || p.id === 'hydrant') { const e = Math.hypot((p.x - m.x) / RING.rx, (p.z - m.z - RING.cz) / RING.rz); assert.ok(e > 1.1, `${k}: ${p.id} clear of the dance ring (${e.toFixed(2)})`); }
    }
    assert.equal(thanksgivingSpots(L, { mums: 1, bales: false, spots: 0, stalks: false }).length, 1, `${k}: Nov 4 — the hydrant's first mums only`);
  }
});
