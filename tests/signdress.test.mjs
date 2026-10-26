// 11a-1 — THE SIGN DECORATION SYSTEM's pure parts: the webs (built like a garden spider builds, growing with the build-up), the
// neon's light field, Day of the Dead's garland / candles / flags (js/screens/harbor/{signdress,dress-halloween,dress-dotd}.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEB_SPECS, buildWeb, webState, webGrowth } from '../js/screens/harbor/dress-halloween.js';
import { lightField, BOX } from '../js/screens/harbor/signdress.js';
import { garlandBlooms, candleSet, papelFlags } from '../js/screens/harbor/dress-dotd.js';
import { halloweenPieces, holidayAt } from '../js/core/harbor-holiday.js';

test('the webs: deterministic, a real orb web (radials, a long spiral, dew), inside the dressing box', () => {
  for (const spec of WEB_SPECS) {
    const a = buildWeb(spec), b = buildWeb(spec);
    assert.deepEqual(JSON.stringify(a), JSON.stringify(b), `${spec.id}: the same web on every phone`);
    assert.ok(a.radials.length >= spec.radials * 0.8, `${spec.id}: radials ${a.radials.length}`);
    assert.ok(a.spiral.length > a.radials.length * 3, `${spec.id}: the capture spiral goes round several times (${a.spiral.length})`);
    assert.ok(a.spiral.some(s => s.dew.length), `${spec.id}: dew on the spiral`);
    for (const s of a.spiral) for (const p of [s.a, s.b]) assert.ok(p[0] > BOX.x0 && p[0] < BOX.x1 && p[1] > BOX.y0 && p[1] < BOX.y1, `${spec.id}: inside the overlay`);
    // the spiral goes from the outside in: its first crossings further from the hub than its last
    const d = s => Math.hypot(s.a[0] - a.hub[0], s.a[1] - a.hub[1]);
    assert.ok(d(a.spiral[0]) > d(a.spiral[a.spiral.length - 1]) * 2, `${spec.id}: outside → in`);
  }
});

test('the web grows with the build-up: nothing on Oct 1, more every day, fully woven as Halloween night begins, gone Nov 1', () => {
  const main = buildWeb(WEB_SPECS[0]), corner = buildWeb(WEB_SPECS[1]);
  let prev = -1;
  for (let d = 1; d <= 31; d++) {
    const H = holidayAt({ y: 2026, m: 10, d, h: d === 31 ? 18 : 12, mi: 0 }), P = halloweenPieces(H, { hour: 12 });
    const st = webState(main, webGrowth(main, P.web)), n = st.frame + st.radials + st.spiral;
    assert.ok(n >= prev, `day ${d}: never shrinks`); prev = n;
    if (d === 1) assert.ok(n < 1, 'Oct 1: at most the first thread');
  }
  const H31 = holidayAt({ y: 2026, m: 10, d: 31, h: 18, mi: 0 }), P31 = halloweenPieces(H31, { hour: 18 });
  const s1 = webState(main, webGrowth(main, P31.web)), s2 = webState(corner, webGrowth(corner, P31.web));
  assert.equal(s1.spiral, main.spiral.length, 'the main web is fully woven'); assert.equal(s2.spiral, corner.spiral.length, 'the corner web too');
  assert.equal(halloweenPieces(holidayAt({ y: 2026, m: 11, d: 1, h: 9, mi: 0 }), { hour: 9 }), null, 'Nov 1: no Halloween pieces → no web');
  // the corner web only late in the month
  assert.equal(webGrowth(corner, halloweenPieces(holidayAt({ y: 2026, m: 10, d: 15, h: 12, mi: 0 }), {}).web), 0);
});

test('the light field: bright on the tubes, falling off with distance, pointing at the light, coloured per letter', () => {
  const LF = lightField([[255, 0, 0], [0, 0, 255], [255, 0, 0], [0, 0, 255]]);
  const on = LF.at(64, 40), near = LF.at(74, 40), far = LF.at(-50, -40);
  assert.ok(on.i > 1, `on the N's stroke: ${on.i}`); assert.ok(near.i < on.i && near.i > 0.2, `10 off: ${near.i}`); assert.ok(far.i < 0.05, `far: ${far.i}`);
  assert.ok(near.dx < 0, 'right of the N: the light is to the left');
  assert.ok(LF.at(32, 50).r > 200 && LF.at(32, 50).b < 60, 'inside the N: red'); assert.ok(LF.at(120, 50).b > 200, 'on the E: blue');
});

test('Day of the Dead: the garland, the candles + the flags — deterministic, in order, strands of varying lengths', () => {
  const g = garlandBlooms(), c = candleSet(), f = papelFlags();
  assert.deepEqual(JSON.stringify(g), JSON.stringify(garlandBlooms())); assert.deepEqual(JSON.stringify(c), JSON.stringify(candleSet()));
  assert.ok(g.blooms.length > 60, `blooms ${g.blooms.length}`);
  for (const b of g.blooms) assert.ok(b.order >= 0 && b.order <= 1);
  const strands = g.blooms.filter(b => b.strand), ends = new Map();
  for (const b of strands) ends.set(Math.round(b.x), Math.max(ends.get(Math.round(b.x)) || 0, b.y));
  assert.ok(new Set([...ends.values()].map(v => Math.round(v / 4))).size >= 4, 'the strands hang to different lengths');
  assert.ok(c.length >= 12 && c.every(k => k.h > 0 && k.w > 0)); assert.ok(f.length >= 6);
});
