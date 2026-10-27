// CITY 2.0 — 9b: THE JANUARY SNOWMAN (core/harbor-snowman.js) — built on snow days through January, slumps in a thaw, melts in a real one
import test from 'node:test';
import assert from 'node:assert/strict';
import { snowmanPlan, forcedSnowman, stageOf, has, STAGES } from '../js/core/harbor-snowman.js';
import { climateDays, nearestStation } from '../js/core/climate.js';

// a run of days from Dec 20 (y-1) to a January / February date, every day cold + snowy unless a function says otherwise
function days(toM, toD, f = () => ({})) {
  const out = [];
  for (let t = Date.UTC(2026, 11, 20); t < Date.UTC(2027, toM - 1, toD); t += 864e5) {
    const d = new Date(t), D = { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), tmax: -3, tmin: -10, snow: 1.5, rain: 0 };
    out.push({ ...D, ...f(D) });
  }
  return out;
}

test('the snowman grows through a snowy January: started ~Jan 2, a head by mid-month, done by ~Jan 31', () => {
  assert.equal(snowmanPlan(days(1, 2)).standing, false, 'nothing before Jan 2');
  const p5 = snowmanPlan(days(1, 5)), p15 = snowmanPlan(days(1, 15)), p31 = snowmanPlan(days(1, 31)), feb = snowmanPlan(days(2, 3));
  assert.ok(p5.standing && p5.stage === 'base', `Jan 5: the base (${p5.stage} ${p5.progress})`);
  assert.ok(has(p15.progress, 'head') && !has(p15.progress, 'hat'), `mid-January: a head, no hat yet (${p15.stage})`);
  assert.equal(p31.progress, 1, `done by Jan 31 (${p31.progress})`);
  assert.equal(feb.progress, 1, 'standing into February');
  assert.equal(stageOf(1), 'smile');
  assert.equal(STAGES.length, 9);
});

test('no snow → no snowman; a brief thaw slumps him and the builders patch him up; a sustained thaw melts him away', () => {
  assert.equal(snowmanPlan(days(1, 31, () => ({ tmax: 24, tmin: 16, snow: 0 }))).standing, false, 'Florida: never');
  // a two-day thaw mid-month: slumped, then patched on the next snow day
  const thaw = D => (D.m === 1 && (D.d === 14 || D.d === 15) ? { tmax: 4, tmin: 0, snow: 0 } : {});
  const at16 = snowmanPlan(days(1, 16, thaw)), at18 = snowmanPlan(days(1, 18, thaw));
  assert.ok(at16.slump > 0.2, `slumped after the thaw (${at16.slump})`);
  assert.ok(at18.slump < at16.slump, `patched up (${at16.slump} → ${at18.slump})`);
  // a real thaw in February: three days over 4 °C and he melts in stages, then is gone
  const warm = from => D => (D.m === 2 && D.d >= from ? { tmax: 8, tmin: 2, snow: 0 } : {});
  const m1 = snowmanPlan(days(2, 13, warm(10))), m2 = snowmanPlan(days(2, 14, warm(10))), m3 = snowmanPlan(days(2, 20, warm(10)));
  assert.ok(m1.standing && m1.melt < m2.melt, `melting in stages (${m1.melt} → ${m2.melt})`);
  assert.equal(m3.standing, false, 'gone after a sustained thaw');
});

test('the climate\'s Januaries: Grand Rapids builds one; Miami never; the previews\' forced stages', () => {
  const gr = nearestStation(42.96, -85.67), mia = nearestStation(25.76, -80.19);
  const p = snowmanPlan(climateDays(gr, 2027, 1, 31, 45), { y: 2027, m: 1, d: 31, h: 14 });
  assert.ok(p.standing && p.progress > 0.8, `Grand Rapids, Jan 31 (${p.stage} ${p.progress})`);
  assert.equal(snowmanPlan(climateDays(mia, 2027, 1, 31, 45), { y: 2027, m: 1, d: 31, h: 14 }).standing, false);
  for (const id of ['base', 'head', 'carrot', 'done', 'slump', 'melt']) assert.ok(forcedSnowman(id).standing, id);
  assert.equal(forcedSnowman('nope'), null);
});
