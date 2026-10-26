// CITY 2.0 — PART 11a-1: THE HOLIDAY DRESSINGS ON THE GROUND — WHERE (core/harbor-holidayprops.js, PURE).
// node --test tests/harbor-holidayprops.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { pumpkinSlots, PUMPKIN_KINDS, FACES, marigoldSpots, garlandPosts, petalPath, papelRuns, monarchSlot, monarchAt, MONARCH } from '../js/core/harbor-holidayprops.js';
import { PUMPKINS_MAX } from '../js/core/harbor-holiday.js';
import { catSpot, halloweenCat, BLACK_CAT } from '../js/core/harbor-wildlife.js';

const SIZES = { '390x844': [390, 844, 47], '402x874': [402, 874, 62], '430x932': [430, 932, 59], '1440x900': [1440, 900, 0] };
const setup = k => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); return { cam, L: harborLayout(cam) }; };

test('11a-1 — THE PUMPKINS: one place per arrival, on + round the side door\'s steps, the door\'s path + the black cat\'s spot left clear, above the dock', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, sl = pumpkinSlots(L), cat = catSpot(L, 'step');
    assert.equal(sl.length, PUMPKINS_MAX, `${k}: a place for every pumpkin`);
    for (const p of sl) {
      assert.ok(PUMPKIN_KINDS[p.kind], `${k}: a known kind (${p.kind})`); assert.ok(FACES.includes(p.face), p.face);
      const u = p.x - s.x0;
      assert.ok(u > 7.4 && u < 12, `${k}: by the side door (u ${u.toFixed(2)})`);
      assert.ok(p.z < s.z0 && p.z > s.z0 - 1.8, `${k}: on the steps / the pavement in front (dz ${(p.z - s.z0).toFixed(2)})`);
      const onUpper = p.y > 0.2, inPath = u > 9.3 + p.d / 2 && u < 10.3 - p.d / 2;
      assert.ok(!(onUpper && inPath), `${k}: the door's path stays free`);
      assert.ok(Math.hypot(p.x - cat.x, p.z - cat.z) > p.d / 2 + 0.12, `${k}: clear of the black cat's spot`);
      const [, y] = project(cam, p.x, p.y, p.z); assert.ok(y < cam.dock.y, `${k}: above the dock`);
    }
    // never two pumpkins in one place
    for (let i = 0; i < sl.length; i++) for (let j = i + 1; j < sl.length; j++) assert.ok(Math.hypot(sl[i].x - sl[j].x, (sl[i].z - sl[j].z) * 1.6) > (sl[i].d + sl[j].d) * 0.36, `${k}: ${i} + ${j} apart`);
    // the faces differ (the first eight carved ones)
    assert.equal(new Set(sl.map(p => p.face)).size, sl.length, 'each face different');   // (WIN: five, every one its own face)
  }
});

test('11a-1 — DAY OF THE DEAD: the petal path runs from the open promenade to the side door (denser at the door), the votives along it', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, P = petalPath(L);
    assert.ok(P.pts.length > 500, 'a path of petals');
    const doorX = s.x0 + (s.door.u0 + s.door.u1) / 2;
    assert.ok(Math.abs(P.door.x - doorX) < 0.01 && P.door.z < s.z0, `${k}: it ends at the door's steps`);
    assert.ok(P.a.x > doorX + 2, `${k}: it starts out on the promenade (${(P.a.x - doorX).toFixed(1)} units right of the door)`);
    const near = P.pts.filter(p => p.u > 0.75).length, far = P.pts.filter(p => p.u < 0.25).length;
    assert.ok(near > far * 2, `${k}: denser toward the door (${near} vs ${far})`);
    assert.equal(P.candles.length, 8, 'eight votives');
    for (const p of P.pts) { const [, y] = project(cam, p.x, 0, p.z); assert.ok(y < cam.dock.y + 4, `${k}: the petals above the dock (${y.toFixed(0)})`); }
  }
});

test('11a-1 — DAY OF THE DEAD: marigolds at the door, the trees + the lamps; a garland on every lamp post; papel picado strung between the lamps', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), sp = marigoldSpots(L), posts = garlandPosts(L), runs = papelRuns(L);
    assert.equal(sp.filter(o => o.kind === 'pot').length, 2, 'two pots flank the door');
    assert.equal(sp.filter(o => o.kind === 'ring').length, L.trees.filter(t => t.grate).length * 2, 'a ring round every tree (two halves)');
    assert.equal(posts.length, L.lamps.length, 'a garland on every lamp post');
    for (const p of posts) { assert.ok(p.h > p.base && p.h < 6.2, 'wound up the post, below its head'); assert.equal(p.front, p.z < L.speakeasy.z0); }
    assert.ok(runs.length >= 2, `${k}: strings across the promenade (${runs.length})`);
    for (const r of runs) { assert.ok(r.n >= 5 && r.sag > 0.1 && r.sag <= 0.9, 'flags + a sag'); assert.ok(r.a.y > 2.5 && r.b.y > 2.5, 'over the people\'s heads'); }
  }
});

test('11a-1 — THE MONARCHS: rare by day (about one every 13 minutes), across the promenade; the preview every 25 s', () => {
  let on = 0, n = 0;
  for (let s = 0; s < 86400; s += 2) { n++; if (monarchSlot(s * 1000, { on: true })) on++; }
  const perHour = (on * 2 / MONARCH.len) / 24;
  assert.ok(perHour > 2.5 && perHour < 6.5, `~4–5 an hour (${perHour.toFixed(1)})`);
  assert.equal(monarchSlot(5e6, { on: false }), null, 'none when off');
  const f0 = 1e9 * 1000;
  assert.ok(monarchSlot(f0 + 3000, { forceAt: f0 }), 'the preview flies at once');
  const { L } = setup('402x874'), a = monarchAt(3, 0, L), b = monarchAt(3, 1, L);
  assert.ok(Math.sign(a.x) !== Math.sign(b.x), 'it crosses the promenade');
  for (let u = 0; u <= 1; u += 0.05) { const m = monarchAt(3, u, L); assert.ok(m.y >= 0.6 && m.y < 4, 'it flies low over the cobbles'); }
});

test('11a-1 — THE BLACK CAT: Halloween evenings on the side door\'s step from just before sunset, to 1:30 am on the night itself', () => {
  const { L } = setup('402x874'), OFF = -240, day0 = Date.UTC(2026, 9, 27) / 1000 - OFF * 60, sun = { rise: 8, set: 18.5 };
  const p = halloweenCat('2026-10-27', day0, L, { sun }), q = halloweenCat('2026-10-31', day0 + 4 * 86400, L, { sun });
  assert.equal(p.spot, 'step'); assert.ok(p.black);
  const hr = (t, d0) => (t - d0) / 3600;
  assert.ok(hr(p.ta, day0) < sun.set + 0.1, 'out by sunset');
  assert.ok(Math.abs(hr(p.t1, day0) - BLACK_CAT.until) < 0.1, `in by 11:45 pm (${hr(p.t1, day0).toFixed(2)})`);
  assert.ok(Math.abs(hr(q.t1, day0 + 4 * 86400) - BLACK_CAT.untilEve) < 0.1, 'Halloween night: until 1:30 am');
});
