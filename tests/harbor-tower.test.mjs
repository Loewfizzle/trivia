// CITY 2.0 — 9e: THE CONSTRUCTION TOWER (core/harbor-tower.js) + THE SUN NEVER BREAKS (harbor-layout.js#envelope)
import test from 'node:test';
import assert from 'node:assert/strict';
import { towerAt, forcedTower, slotShape, towerKey, implosionDay, openingDay, implosionAt, implosionSounds, designFor, DESIGNS, IMPLODE, STAGES } from '../js/core/harbor-tower.js';
import { cameraFor, harborLayout, roofline } from '../js/core/harbor-layout.js';

const at = (y, m, d, h = 12) => towerAt({ y, m, d, h });
test('9e THE TOWER: today stands until the first spring implosion; then the year in order on the real calendar', () => {
  assert.equal(at(2026, 10, 28).stage, 'standing');
  assert.equal(at(2027, 4, 1).stage, 'standing');
  const imp = implosionDay(2027);
  assert.deepEqual([imp.m, new Date(Date.UTC(imp.y, imp.m - 1, imp.d)).getUTCDay()], [4, 0], 'a Sunday in April');
  assert.ok(at(2027, 4, imp.d - 2).announce && !at(2027, 4, imp.d - 5).announce, 'the banner plane the days before');
  assert.equal(at(2027, 4, imp.d, 9.9).stage, 'standing');
  const mid = at(2027, 4, imp.d, 10 + 5 / 3600); assert.equal(mid.stage, 'implosion'); assert.ok(Math.abs(mid.s - 5) < 0.01);
  assert.equal(at(2027, 4, imp.d + 3).stage, 'rubble');
  assert.equal(at(2027, 5, 10).stage, 'cleanup');
  // BNAME (the owner, Oct 28): the rise June 1 → Sept 1 (~3 months), topping Sept 1–8, the crane down mid-September, the opening the
  // FIRST Saturday of October at 7 pm
  assert.equal(at(2027, 5, 31).stage, 'cleanup');
  const r1 = at(2027, 6, 2), r2 = at(2027, 8, 30); assert.equal(r1.stage, 'rising'); assert.ok(r2.k > 0.95 && r2.k > r1.k && r1.crane, 'it rises, the crane up');
  assert.ok(Math.abs(at(2027, 7, 16).k - 0.5) < 0.03, 'half way by mid-July');
  assert.equal(at(2027, 9, 3).stage, 'topping');
  assert.ok(at(2027, 9, 3).crane);
  assert.equal(at(2027, 9, 10).stage, 'finishing');
  assert.ok(at(2027, 9, 10).crane && !at(2027, 9, 20).crane, 'the crane comes down mid-September');
  const op = openingDay(2027); assert.equal(new Date(Date.UTC(op.y, op.m - 1, op.d)).getUTCDay(), 6);
  assert.ok(op.m === 10 && op.d <= 7, 'the first Saturday of October');
  assert.equal(at(2027, 10, op.d, 18.9).stage, 'finishing');
  assert.equal(at(2027, 10, op.d, 20).stage, 'opening');
  assert.equal(at(2027, 10, op.d + 1).stage, 'finished');
  for (const y of [2027, 2028, 2029, 2030, 2031, 2032, 2033]) { const o = openingDay(y); assert.ok(o.m === 10 && o.d >= 1 && o.d <= 7 && new Date(Date.UTC(y, 9, o.d)).getUTCDay() === 6, `${y}`); }
  assert.equal(at(2027, 12, 20).stage, 'finished');
  assert.equal(at(2028, 2, 1).stage, 'finished');
  assert.notEqual(at(2027, 12, 20).design, at(2026, 12, 20).design, 'a new design each cycle');
  assert.equal(at(2028, 2, 1).design, designFor(2027));
  for (const s of STAGES) assert.ok(forcedTower(s), s);
});
test('9e THE IMPLOSION: the siren, the horns, the charges, the drop in order; the dust settles over minutes', () => {
  const snd = implosionSounds(-200, 30).map(x => x.slot);
  assert.deepEqual(snd, ['tower-siren', 'tower-horn', 'tower-horn', 'tower-horn', 'implosion-charges', 'implosion-rumble']);
  assert.ok(implosionAt(-10).standing && !implosionAt(-10).flash);
  assert.ok(implosionAt(1.3).flash && implosionAt(1.3).standing);
  assert.ok(implosionAt(5).drop > 0.1 && implosionAt(5).drop < 0.9 && implosionAt(IMPLODE.drop1 + 1).drop === 1);
  assert.ok(implosionAt(30).dust.grow > 0.8 && implosionAt(IMPLODE.dust1 + 1).dust.fade === 0);
});
test('9e THE SUN MUST NOT BREAK: the skyline envelope the sun reads is the same at every stage (the slot always full height)', () => {
  for (const [W, H] of [[390, 844], [402, 874], [430, 932]]) {
    const cam = cameraFor(W, H, { tag: { x: 40, y: 230, w: W - 80, h: 24 }, dock: { y: H - 96 } });
    const ref = Array.from(harborLayout(cam, 1924, {}).envelope);
    for (const s of ['standing', 'implosion', 'rubble', 'cleanup', 'rising', 'topping', 'finishing', 'finished']) {
      const L = harborLayout(cam, 1924, { tower: forcedTower(s) });
      assert.deepEqual(Array.from(L.envelope), ref, `${W}: the envelope at ${s}`);
      const sh = slotShape(forcedTower(s)), t = L.towers.find(x => x.id === 'wordV');
      if (sh && sh.works === 'gone') assert.ok(t.h < 2 && !t.word, `${s}: the slot empty`);
      if (sh && sh.works === 'frame') assert.ok(t.works === 'frame' && !t.word && !t.crown, `${s}: a steel frame`);
      if (s === 'rubble') assert.ok(roofline(L).some((v, i) => v > ref[i] + 3), 'the gap shows in the drawing');
    }
  }
  assert.ok(towerKey(forcedTower('rising', 0.5)) !== towerKey(forcedTower('rising', 0.6)) && towerKey(forcedTower('finished')) === towerKey(forcedTower('opening')));
  assert.ok(DESIGNS.length >= 4);
});
test('PROM THE IMPLOSION’s NEW TIMELINE (the owner: "it takes way too long"): 10 s after the siren ENDS the horns, 5 s after the last blast ENDS the fall', () => {
  const SIREN = 10.5, HORN = 4.65;   // (tower-siren-2 · warning-horn — HORN B, the default)
  assert.ok(Math.abs(IMPLODE.horns[0] - (IMPLODE.siren + SIREN + 10)) < 0.05);
  assert.ok(Math.abs(IMPLODE.flash0 - (IMPLODE.horns[2] + HORN + 5)) < 0.1);
  for (let i = 1; i < 3; i++) assert.ok(IMPLODE.horns[i] - IMPLODE.horns[i - 1] >= HORN + 1, 'the blasts never overlap');
  assert.ok(IMPLODE.flash0 - IMPLODE.siren < 45, 'the countdown under 45 s (was 60)');
});
