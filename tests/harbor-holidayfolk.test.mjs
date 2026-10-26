// CITY 2.0 — 11a-1: THE PEOPLE OF THE HOLIDAYS (core/harbor-holidayfolk.js + core/harbor-people.js#folkAt): the trick-or-treaters + the
// zombies on Halloween night, the Day of the Dead procession — seeded, on the calendar's hours, continuous, the street closed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { folkMap, folkAt, capByTier } from '../js/core/harbor-people.js';
import { totGroups, zombieGroups, procWindow, procWalkers, procHold, localAt, COSTUMES, TOT, ZOMBIE, PROC } from '../js/core/harbor-holidayfolk.js';

const OFF = -240;                                   // (Grand Rapids in late October: EDT; Nov 2 is EST: −300)
const abs = (iso, off = OFF) => Date.parse(iso + 'Z') / 1000 - off * 60;     // a LOCAL clock time → absolute s
const groupsIn = (fn, a, b, ctx) => { const out = []; for (let k = Math.floor(a / 600); k <= Math.floor(b / 600); k++) out.push(...fn(k, ctx).filter(g => g.t >= a && g.t < b)); return out; };
const setup = () => { const cam = cameraFor(402, 874, { dock: { x: 14, y: 874 - 116, w: 374, h: 76 } }, { top: 62, bottom: 34 }); const L = harborLayout(cam); return { L, M: folkMap(L) }; };

test('trick-or-treat: seeded, 2–4 kids in different costumes + a grown-up, on Halloween night dusk → 9:15 pm only', () => {
  const a = abs('2026-10-31T12:00'), b = abs('2026-11-01T12:00');
  const g1 = groupsIn(totGroups, a, b, { off: OFF }), g2 = groupsIn(totGroups, a, b, { off: OFF });
  assert.deepEqual(g1, g2, 'the same groups on every phone');
  assert.ok(g1.length > 100 && g1.length < 400, `a busy evening: ${g1.length} groups`);
  for (const g of g1) {
    const h = localAt(g.t, OFF).hr;
    assert.ok(h >= 17.5 && h < 21.25, `a group at ${h.toFixed(2)} h`);
    assert.ok(g.kids.length >= TOT.kids[0] && g.kids.length <= TOT.kids[1]);
    assert.equal(new Set(g.kids.map(k => k.costume)).size, g.kids.length, 'no two kids in one group in the same costume');
    for (const k of g.kids) assert.ok(COSTUMES.includes(k.costume));
    assert.ok(['side', 'shop'].includes(g.door));
  }
  // every costume turns up through the night; the side door most
  for (const c of COSTUMES) assert.ok(g1.some(g => g.kids.some(k => k.costume === c)), c);
  assert.ok(g1.filter(g => g.door === 'side').length > g1.length / 2);
  // none on the evenings around it
  assert.equal(groupsIn(totGroups, abs('2026-10-30T12:00'), abs('2026-10-31T12:00'), { off: OFF }).length, 0, 'Oct 30');
  assert.equal(groupsIn(totGroups, abs('2026-11-01T12:00'), abs('2026-11-02T06:00'), { off: OFF }).length, 0, 'Nov 1');
});

test('zombies: groups of 2–4 on Halloween night 8 pm → 2 am only, some going in at the side door', () => {
  const g = groupsIn(zombieGroups, abs('2026-10-31T12:00'), abs('2026-11-01T12:00'), { off: OFF });
  assert.ok(g.length > 60 && g.length < 220, `${g.length} groups`);
  for (const z of g) {
    const h = localAt(z.t, OFF).hr;
    assert.ok(h >= 20 || h < 2, `a group at ${h.toFixed(2)} h`);
    assert.ok(z.n >= ZOMBIE.n[0] && z.n <= ZOMBIE.n[1] && z.looks.length === z.n);
  }
  assert.ok(g.some(z => z.inside) && g.some(z => !z.inside));
  assert.equal(groupsIn(zombieGroups, abs('2026-10-24T12:00'), abs('2026-10-25T12:00'), { off: OFF }).length, 0, 'a normal Saturday night');
});

test('the previews: &force=trick-or-treat / zombies bring groups from the moment they are switched on, any date', () => {
  const at = abs('2026-06-10T14:00');
  const tg = groupsIn(totGroups, at - 600, at + 600, { off: OFF, forceAt: at }), zg = groupsIn(zombieGroups, at - 600, at + 600, { off: OFF, forceAt: at });
  assert.ok(tg.length >= 8 && tg.every(g => g.t > at), `${tg.length} groups after the flag`);
  assert.ok(zg.length >= 6 && zg.every(g => g.t > at));
});

test('the procession: Nov 2 from 10 min after sunset for 70 min — continuous walkers, never bunched, the trio + an ofrenda pass', () => {
  const dusk = () => 17.55 + 0.42;                   // (the people's dusk = sunset + 0.42 h)
  const w = procWindow(abs('2026-11-02T18:30', -300), { off: -300, dusk });
  assert.ok(w, 'a window on Nov 2');
  const start = localAt(w.T0, -300).hr;
  assert.ok(Math.abs(start - (17.55 + 1 / 6)) < 0.01, `starts 10 min after sunset: ${start.toFixed(3)}`);
  assert.equal(w.T1 - w.T0, PROC.len);
  assert.equal(procWindow(abs('2026-11-01T18:30', -300), { off: -300, dusk }), null, 'not on Nov 1');
  assert.equal(procWindow(abs('2026-11-03T18:30', -300), { off: -300, dusk }), null, 'not on Nov 3');
  const all = []; for (let c = 0; c < PROC.len / PROC.chunk; c++) all.push(...procWalkers(c, w, {}));
  assert.deepEqual(all.map(e => e.t), [...all.map(e => e.t)].sort((a, b) => a - b), 'in order through the chunks');
  assert.ok(all.every(e => e.t >= w.T0 && e.t < w.T1));
  const minGap = (PROC.gap[0] / PROC.v) - 0.05;
  for (let i = 1; i < all.length; i++) assert.ok(all[i].t - all[i - 1].t >= Math.min(minGap, 1.9), `walkers ${i - 1}/${i} ${(all[i].t - all[i - 1].t).toFixed(2)} s apart`);
  assert.ok(all.length > 1000, `a long line: ${all.length}`);
  assert.ok(all.filter(e => e.group === 'trio').length >= 8 && all.filter(e => e.group === 'ofrenda').length >= 6);
  assert.deepEqual(procWalkers(7, w, {}), procWalkers(7, w, {}), 'seeded');
  const h = procHold(w, 70); assert.ok(h[0] < w.T0 && h[1] > w.T1, 'the street closed around it');
});

test('folkAt: Halloween night has its trick-or-treaters at the doors (the door swings open, nobody goes in) — a normal night none', () => {
  const { L, M } = setup(), cache = new Map();
  let trick = 0, zombie = 0, treat = 0, swung = 0;
  for (let t = abs('2026-10-31T19:00'); t < abs('2026-10-31T19:20'); t += 3) {
    const w = folkAt(t, { L, M, ctx: { off: OFF, seed: 1924 } }, cache);
    trick += w.members.filter(m => m.kind === 'trick').length; treat += w.members.filter(m => m.s.pose === 'treat').length;
    if (w.members.some(m => m.s.pose === 'treat') && w.doors.side + w.doors.shop > 0.5) swung++;
  }
  for (let t = abs('2026-10-31T22:00'); t < abs('2026-10-31T22:20'); t += 3) zombie += folkAt(t, { L, M, ctx: { off: OFF, seed: 1924 } }, cache).members.filter(m => m.kind === 'zombie').length;
  assert.ok(trick > 50 && treat > 10 && swung > 3, `trick ${trick}, at the door ${treat}, door open ${swung}`);
  assert.ok(zombie > 20, `zombies ${zombie}`);
  const c2 = new Map();
  for (let t = abs('2026-10-24T19:00'); t < abs('2026-10-24T19:20'); t += 15) assert.equal(folkAt(t, { L, M, ctx: { off: OFF, seed: 1924 } }, c2).members.filter(m => m.kind === 'trick' || m.kind === 'zombie').length, 0);
});

test('folkAt: the procession fills the near lane, no car / bus enters, nobody crosses; capByTier thins it on older phones', () => {
  const { L, M } = setup(), cache = new Map(), dusk = () => 17.55 + 0.42, ctx = { off: -300, seed: 1924, dusk };
  let minN = 1e9, cross = 0, cars = 0;
  for (let t = abs('2026-11-02T18:15', -300); t < abs('2026-11-02T18:45', -300); t += 20) {
    const w = folkAt(t, { L, M, ctx }, cache), pr = w.members.filter(m => m.kind === 'proc');
    minN = Math.min(minN, pr.length);
    cross += w.members.filter(m => m.s.cross).length;
    cars += w.cars.length + w.buses.length;
    const t0 = capByTier(w.members, 0).filter(m => m.kind === 'proc').length, t1 = capByTier(w.members, 1).filter(m => m.kind === 'proc').length;
    assert.ok(t0 <= t1 && t1 <= pr.length && (pr.length < 4 || t0 < pr.length), `tiers ${t0} ≤ ${t1} ≤ ${pr.length}`);
  }
  assert.ok(minN >= 8, `the line is never thin mid-way: ${minN} walkers`);
  assert.equal(cross, 0, 'nobody crosses through it');
  assert.equal(cars, 0, 'the street is closed');
});

test('the people of the holidays: a replay of the same moment gives the same people (host-free, phone-free)', () => {
  const { L, M } = setup();
  for (const [iso, off] of [['2026-10-31T19:31', OFF], ['2026-10-31T22:41', OFF], ['2026-11-02T18:27', -300]]) {
    const t = abs(iso, off), ctx = { off, seed: 1924, dusk: () => 17.97 };
    const a = folkAt(t, { L, M, ctx }, new Map()), b = folkAt(t, { L, M, ctx }, new Map());
    const sig = w => w.members.map(m => `${m.vid}|${m.m.role}|${m.s.x.toFixed(3)}|${m.s.z.toFixed(3)}|${m.s.pose}`).join(';');
    assert.equal(sig(a), sig(b), iso);
  }
});
