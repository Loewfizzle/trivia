// WINDOWS — THE JUGGLER (core/harbor-juggler.js). node --test tests/harbor-juggler.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { jugglerPlan, segAt, ballsAt, trickAt, jugglerCues, jugglerSceneCues, PAT, JUG } from '../js/core/harbor-juggler.js';
import { scenesTonight, sceneAt } from '../js/core/harbor-scenes.js';

const LEN = 3 * 3600 - 41.5;
const stateAt = (plan, s) => { const S = segAt(plan, s); if (!S || ['rest', 'fetch'].includes(S.seg.kind)) return null; return { i: S.i, st: PAT[S.seg.kind] ? ballsAt(S.seg, S.e) : trickAt(S.seg, S.e) }; };

test('THE JUGGLER — a fresh routine for 3 hours: every kind of run + tricks, drops now + then, rests every ~25–35 min; the same on every phone', () => {
  for (const key of ['2026-11-03', '2026-11-06', '2026-12-24']) {
    const plan = jugglerPlan(key, LEN), kinds = new Set(plan.map(s => s.kind));
    assert.deepEqual(jugglerPlan(key, LEN), plan, 'every phone the same');
    for (const k of ['slow', 'cascade', 'shower', 'fast', 'under', 'high', 'pause', 'rest', 'fetch']) assert.ok(kinds.has(k), `${key}: ${k}`);
    const drops = plan.filter(s => s.drop), rests = plan.filter(s => s.kind === 'rest');
    assert.ok(drops.length >= 15 && drops.length <= 60, `${key}: ${drops.length} drops — now + then`);
    assert.ok(rests.length >= 3 && rests.length <= 8, `${key}: ${rests.length} rests`);
    for (let i = 1; i < plan.length; i++) assert.ok(Math.abs(plan[i].t0 - (plan[i - 1].t0 + plan[i - 1].d)) < 1e-6, 'back to back, no gaps');
    assert.ok(plan.at(-1).t0 + plan.at(-1).d <= LEN + 1e-6, 'ends inside his work');
    // (every drop is followed by the fetch + a slow restart)
    for (const d of drops) { const i = plan.indexOf(d); assert.equal(plan[i + 1].kind, 'fetch'); assert.equal(plan[i + 2].kind === 'slow' || plan[i + 2].kind === 'rest', true); }
  }
});

test('THE JUGGLER — the balls fly smooth: no ball jumps inside a run; three balls always; the held ones in his hands', () => {
  const plan = jugglerPlan('2026-11-03', LEN);
  let prev = null, worst = 0;
  for (let s = 300; s < 2700; s += 1 / 60) {
    const r = stateAt(plan, s); if (!r) { prev = null; continue; }
    assert.equal(r.st.balls.length, 3);
    const m = Object.fromEntries(r.st.balls.map(B => [B.id, [B.x, B.y]]));
    if (prev && prev.i === r.i) for (const id of [0, 1, 2]) worst = Math.max(worst, Math.hypot(m[id][0] - prev.m[id][0], m[id][1] - prev.m[id][1]));
    prev = { i: r.i, m };
  }
  assert.ok(worst < 0.075, `the biggest move in one frame: ${worst.toFixed(3)} of his height (a fast throw in flight)`);
  // (a cascade's apex near his head; the balls never under the floor)
  const c = plan.find(s => s.kind === 'cascade' && !s.drop), ys = [];
  for (let e = 0; e < c.d; e += 0.02) for (const B of ballsAt(c, e).balls) ys.push(B.y);
  assert.ok(Math.max(...ys) > 0.8 && Math.max(...ys) < 0.95 && Math.min(...ys) > 0.3, `cascade heights ${Math.min(...ys).toFixed(2)}–${Math.max(...ys).toFixed(2)}`);
});

test('THE JUGGLER — the drop: it falls, bounces lower each time, rolls to a stop on the floor; its sound at the first floor contact (juggler-drop / juggler-thud); no catch sounds', () => {
  const plan = jugglerPlan('2026-11-03', LEN), d = plan.find(s => s.drop && !s.drop.dead);
  const ys = []; for (let e = d.drop.hit - 0.05; e < d.d; e += 0.01) { const B = ballsAt(d, e).balls.find(b => b.floor); if (B) ys.push(B.y); }
  assert.ok(ys.length > 10 && Math.min(...ys) >= JUG.ballR - 1e-6, 'never under the floor');
  const end = ballsAt(d, d.d - 0.01).balls.find(b => b.floor); assert.ok(end && end.rest, 'rolled to a stop');
  const cues = jugglerCues(d.t0, d.t0 + d.d, plan);
  assert.ok(cues.some(q => Math.abs(q.at - (d.t0 + d.drop.hit)) < 1e-6 && q.slot === 'juggler-drop'), 'the drop heard as it lands');
  assert.ok(jugglerCues(0, 29.9, plan).every(q => /^juggler-(drop|thud)$/.test(q.slot)));
  // (on the evening's clock: the bag set down in his entrance + every drop of the night)
  const sc = scenesTonight('2026-11-03', { all: true }).find(x => x.id === 'juggler'), all = [];
  for (let a = sc.start; a < sc.end; a += 20) all.push(...jugglerSceneCues(sc, a, a + 20, '2026-11-03'));
  assert.ok(all[0].slot === 'juggler-thud' && all.length >= 16, `${all.length} cues tonight (the bag first)`);
  assert.ok(sceneAt(sc, sc.start + 3600).phase === 'work');
});
