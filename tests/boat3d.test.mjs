// CITY 2.0 — 8b2 Group 3: THE BOATS' 3-D KIT (js/screens/harbor/boat3d.js + boat-models.js), PURE: node --test tests/boat3d.test.mjs
// The renderer's rules that the look depends on: back faces culled, a part resting on another drawn after it, Rosie's wheel
// between her back + front (behind her hull seen from ahead, in front of it from astern), her name only on the side we see.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, REF_TITLE } from '../js/core/harbor-layout.js';
import { pose, newPart, box } from '../js/screens/harbor/boat3d.js';
import { rosieModel, taxiModel, tugModel, sailModel } from '../js/screens/harbor/boat-models.js';

const cam = cameraFor(402, 874, { tag: REF_TITLE.tag, dock: { ...REF_TITLE.dock, w: 374, y: 758 } }, REF_TITLE.safe);
const pal = () => [200, 200, 200];
const V = (o = {}) => ({ cam, X: 18, Z: 142, hd: 0, c0: 12, pal: r => (r === 'none' ? null : pal(r)), ...o });
const order = P => P.list.map(p => p.id);

test('THE 3-D KIT: a box shows at most three faces (the back faces culled); seen from above-right it shows its top, its front + its left end', () => {
  const P0 = newPart('b'); box(P0, 0, 4, 0, 2, -1, 1, 'x', { skip: [] });
  const P = pose([P0], { cam, X: 20, Z: 100, hd: 0, c0: 2, pal: () => [100, 100, 100] });
  assert.equal(P.list[0].vis.length, 3, 'three faces');
  const [x0, y0, x1, y1] = P.bounds; assert.ok(x1 > x0 && y1 > y0);
});

test('ROSIE IN 3D: every part sorted, a part resting on another after it; the wheel BEHIND her hull from ahead, IN FRONT of it from astern', () => {
  const M = rosieModel();
  for (const hd of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, -2.4]) {
    const P = pose(M.parts, V({ hd, c0: M.c0 })), ids = order(P);
    assert.equal(new Set(ids).size, M.parts.length, 'every part once');
    for (const p of M.parts) if (p.on) assert.ok(ids.indexOf(p.id) > ids.indexOf(p.on), `${p.id} after ${p.on} (hd ${hd.toFixed(2)})`);
    assert.equal(ids[ids.length - 1], 'strings', 'the bulb strings last');
    assert.ok(ids.indexOf('hood') > ids.indexOf('wheel'), 'the hood over the wheel');
  }
  const ahead = order(pose(M.parts, V({ hd: -Math.PI / 2, c0: M.c0 }))), astern = order(pose(M.parts, V({ hd: Math.PI / 2, c0: M.c0 })));
  assert.ok(ahead.indexOf('hull') > ahead.indexOf('wheel'), 'bow toward us: the hull drawn over the wheel (it hides behind her)');
  assert.ok(astern.indexOf('hull') < astern.indexOf('wheel'), 'stern toward us: the wheel drawn over the hull');
});

test('ROSIE IN 3D: her name on the paddle box reads only from the side we see; her running lights + bulbs + windows are there', () => {
  const M = rosieModel();
  const names = hd => pose(M.parts, V({ hd, c0: M.c0 })).list.flatMap(p => p.texts).length;
  assert.equal(names(0), 1, 'broadside: one ROSIE (the starboard side, toward us)');
  assert.equal(names(Math.PI), 1, 'heading left: one ROSIE (the port side)');
  assert.equal(names(-Math.PI / 2), 0, 'bow-on: no name (edge-on)');
  const P = pose(M.parts, V({ c0: M.c0 }));
  assert.ok(P.dots.filter(d => d.kind === 'bulb').length > 30, 'her bulb strings');
  assert.equal(P.dots.filter(d => d.kind === 'side').length, 2, 'two sidelights');
  assert.ok(P.list.flatMap(p => p.decs).filter(d => d.win).length > 30, 'her lit windows on the side we see');
  // ~101 pt long broadside at her landing (the Part 5 hero size)
  const [x0, , x1] = P.bounds; assert.ok(x1 - x0 > 95 && x1 - x0 < 125, `her length on screen ${(x1 - x0).toFixed(0)} pt`);
});

test('THE OTHER BOATS IN 3D: the taxi, the tug, the fishing tug (its lantern), the sloop (sails both sides) all pose at any heading', () => {
  for (const [M, Z] of [[taxiModel(), 94], [tugModel(9.5, 5.2, false), 214], [tugModel(8, 4.6, true), 232], [sailModel(6.5, 10, { side: 1, boom: 0.5 }), 214], [sailModel(6.5, 10, { side: -1, boom: 0.1, luff: 1 }), 205]]) {
    for (let hd = -Math.PI; hd < Math.PI; hd += 0.5) {
      const P = pose(M.parts, { cam, X: 40, Z, hd, c0: M.c0, pal: () => [180, 180, 180] });
      assert.ok(P.list.reduce((s, p) => s + p.vis.length, 0) > 5 && Number.isFinite(P.bounds[0]), 'faces drawn');
    }
  }
  assert.equal(pose(tugModel(8, 4.6, true).parts, { cam, X: 40, Z: 232, hd: 0, c0: 4, pal: () => [1, 1, 1] }).dots.filter(d => d.kind === 'lantern').length, 1, 'the fishing tug\'s bow lantern');
});
