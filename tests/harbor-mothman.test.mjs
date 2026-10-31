// THE MODELS PASS — THE MOTHMAN (core/harbor-mothman.js): his nights + the swap's timing. docs/harbor/passes/models.md
import test from 'node:test';
import assert from 'node:assert/strict';
import { mothmanNight, mothmanAt, stutterAt } from '../js/core/harbor-mothman.js';
import { legendNight } from '../js/core/harbor-legend.js';
import { knob, SCHEDULE } from '../js/core/harbor-schedule.js';
import { EVENTS } from '../js/core/harbor-remote.js';

const days = (y0, y1, fn) => { for (let y = y0; y <= y1; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) { const t = new Date(Date.UTC(y, m - 1, d)); if (t.getUTCMonth() !== m - 1) continue; fn(y, m, d); } };
const next = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d + 1)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };

test('MODELS — THE MOTHMAN: ~twice a month, the small hours (in 2–2:30 am, out 5–5:30), never a legendary night, Halloween or two nights running', () => {
  let n = 0, all = 0;
  days(2026, 2028, (y, m, d) => {
    all++;
    const t = mothmanNight(y, m, d, { dice: true });
    if (!t) return;
    n++;
    assert.equal(legendNight(y, m, d), null, `${y}-${m}-${d}: not a legendary's night`);
    assert.ok(!(m === 10 && d === 31), 'never Halloween (the ghost ship)');
    assert.ok(t.arrive >= 26 && t.arrive <= 26.5 && t.leave >= 29 && t.leave <= 29.5, `${y}-${m}-${d}: in ${t.arrive}, out ${t.leave}`);
    assert.equal(mothmanNight(...next(y, m, d), { dice: true }), null, `${y}-${m}-${d}: never two nights running`);
  });
  const perMonth = n / all * 30.44;
  assert.ok(perMonth > 1.4 && perMonth < 2.6, `~twice a month (${perMonth.toFixed(2)})`);
});

test('MODELS — THE SWAP hides in the needle\'s dark: the stutter dips + goes DARK, the model changes in the long dark, then the light is back', () => {
  const P = knob('legend.mothman');
  let swapAt = null, darkAround = 1;
  for (let s = 0; s <= P.stutter; s += 0.01) { const st = stutterAt(s); if (st.swapped && swapAt == null) { swapAt = s; darkAround = st.k; } }
  assert.ok(swapAt != null && darkAround === 0, `the swap happens with the needle fully dark (at ${swapAt && swapAt.toFixed(2)} s, light ${darkAround})`);
  assert.equal(stutterAt(P.stutter + 0.01).k, 1, 'the light back after');
  assert.ok([0.1, 0.25, 0.5].some(s => stutterAt(s * P.stutter).k < 0.4), 'it flickers before the long dark');
});

test('MODELS — HIS NIGHT, minute by minute: the glide in, the swap to the perch, perched, the swap to the glide, gone — a late page joins him perched', () => {
  // (find a night + walk its clock)
  let ev = null; days(2026, 2026, (y, m, d) => { if (!ev && m >= 11) { const t = mothmanNight(y, m, d, { dice: true }); if (t) ev = { y, m, d, ...t }; } });
  assert.ok(ev, 'a night in Nov–Dec 2026');
  const P = knob('legend.mothman');
  const at = hr => { const t = new Date(Date.UTC(ev.y, ev.m - 1, ev.d) + hr * 3600e3); return mothmanAt({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() + (t.getUTCMilliseconds() / 1000) }, { dice: true }); };
  assert.equal(at(ev.arrive - 0.01), null, 'not yet');
  const a = at(ev.arrive + 5 / 3600); assert.equal(a.phase, 'in'); assert.equal(a.model, 'glide');
  const sw = at(ev.arrive + (P.glideIn + P.stutter * 0.9) / 3600); assert.equal(sw.model, 'perch', 'perched after the stutter\'s dark');
  const p = at(ev.arrive + 1.5); assert.equal(p.phase, 'perch'); assert.equal(p.needle, 1);
  const o = at(ev.leave + (P.stutter + 3) / 3600); assert.equal(o.phase, 'out'); assert.equal(o.model, 'glide'); assert.ok(o.u > 0 && o.u < 1);
  const g = at(ev.leave + (P.stutter + P.glideOut + 2) / 3600); assert.equal(g.phase, 'gone');
  assert.equal(at(ev.leave + 0.5), null, 'long gone (the next morning)');
});

test('MODELS — THE PREVIEWS: &force=mothman perched at once; mothman-arrive glides in then perches; mothman-leave stutters then glides away; every flag has a panel row + the timetable row is live', () => {
  const P = knob('legend.mothman');
  assert.equal(mothmanAt(null, { force: true }).model, 'perch', 'perched now');
  assert.equal(mothmanAt(null, { force: true, since: 2 }).phase, 'in');
  assert.equal(mothmanAt(null, { force: true, since: P.glideIn + P.stutter + 1 }).model, 'perch');
  assert.equal(mothmanAt(null, { force: true, leaveAt: -1 }).model, 'perch', 'a link\'s leaving waits perched until it starts');
  assert.equal(mothmanAt(null, { force: true, leaveAt: P.stutter + 2 }).model, 'glide');
  assert.equal(mothmanAt(null, { force: true, leaveAt: P.stutter + P.glideOut + 1 }).phase, 'gone');
  for (const id of ['mothman', 'mothman-arrive', 'mothman-leave', 'no-mothman']) assert.ok(EVENTS.some(e => e.id === id), `${id}: a panel row`);
  assert.equal(SCHEDULE.find(r => r.id === 'legend.mothman').status, 'off', 'ATM-A: postponed — the row says off (its previews stay)');
});

test('ATM-A — THE MOTHMAN POSTPONED (the owner, Oct 31: "looks very cheap, needs major work"): his switch OFF — no night in a whole year, the previews kept', () => {
  assert.equal(knob('legend.mothman').on, false, 'the timetable switch is off');
  let n = 0; days(2026, 2027, (y, m, d) => { if (mothmanNight(y, m, d)) n++; });
  assert.equal(n, 0, 'no Mothman night scheduled');
  assert.equal(mothmanAt({ y: 2026, m: 11, d: 12, h: 3, mi: 0, s: 0 }), null, 'nothing at 3 am on any night');
  assert.equal(mothmanAt(null, { force: true }).model, 'perch', '&force=mothman still previews him');
});
