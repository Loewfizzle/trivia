// CITY 2.0 — THE HARBOR, PART 8b1 (Group 3): THE WITNESSES (core/harbor-witness.js) + THE HARBOR'S TIMETABLE (core/harbor-boats.js#
// ROSIE_TABLE, FISH, tableAt, hornsBetween). PURE: node --test tests/harbor-life.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, REF_TITLE } from '../js/core/harbor-layout.js';
import { folkMap, folkAt } from '../js/core/harbor-people.js';
import { WITNESS } from '../js/core/harbor-witness.js';
import { boatRoutes, boatAt, ROSIE_TABLE, hornsBetween } from '../js/core/harbor-boats.js';

const OFF = -240;
const setup = (W = 402, H = 874) => { const cam = cameraFor(W, H, { tag: REF_TITLE.tag, dock: { ...REF_TITLE.dock, w: W - 28, y: H - 116 } }, REF_TITLE.safe); const L = harborLayout(cam, 1924); return { cam, L, M: folkMap(L) }; };
const local = (y, m, d, h) => Date.UTC(y, m - 1, d) / 1000 - OFF * 60 + h * 3600;          // (abs s of a local hour in Grand Rapids)
const heads = f => f.members.filter(m => m.m.role !== 'dog');

test('8b1 — WITNESSES FLEE THE ABDUCTION: they stop + look up (a couple point), RUN when the beam opens, the promenade empty for a while, then people drift back + the regulars return to their posts', () => {
  const { L, M } = setup();
  for (const [y, m, d, h] of [[2026, 10, 24, 22.2], [2026, 10, 22, 20], [2026, 7, 11, 21.6]]) {
    const t0 = local(y, m, d, h), lg = { kind: 'ufo', t0 }, cache = new Map(), at = s => folkAt(t0 + s, { L, M, ctx: { off: OFF, legend: lg } }, cache);
    const before = heads(folkAt(t0 - 3, { L, M, ctx: { off: OFF } }, new Map()));
    if (!before.length) continue;
    const look = heads(at(4.5));
    assert.ok(look.length && look.filter(x => ['watch', 'point'].includes(x.s.pose)).length >= Math.ceil(look.length * 0.6), `${y}-${m}-${d}: they stop + look up (${look.map(x => x.s.pose).join(' ')})`);
    const run = heads(at(8.5));
    assert.ok(run.some(x => x.s.run), `${y}-${m}-${d}: they flee at a RUN when the beam opens`);
    assert.ok(run.every(x => x.s.run || x.s.pose === 'garden' || x.s.door || x.s.z > 53), `${y}-${m}-${d}: nobody stands calmly watching (${run.filter(x => !x.s.run).map(x => x.kind + ':' + x.s.pose).join(' ')})`);
    for (const s of [40, 120, 200, WITNESS.ufo.len + WITNESS.ufo.empty - 10]) { const n = heads(at(s)).filter(x => !x.routine || x.s.run).length; assert.equal(heads(at(s)).filter(x => x.s.z <= 53).length, 0, `${y}-${m}-${d}: the promenade EMPTY ${s} s in (${n})`); }
    let back = 0; for (let s = WITNESS.ufo.len + WITNESS.ufo.empty; s < WITNESS.ufo.len + WITNESS.ufo.empty + 400; s += 20) back = Math.max(back, heads(at(s)).length);
    assert.ok(back > 0, `${y}-${m}-${d}: people drift back after`);
  }
});

test('8b1 — THE TR-3B: people stop + stare up as the city goes dark, a few hurry indoors; the regulars stay at their posts', () => {
  const { L, M } = setup(), t0 = local(2026, 10, 22, 21.5), lg = { kind: 'tr3b', t0 }, cache = new Map(), at = s => folkAt(t0 + s, { L, M, ctx: { off: OFF, legend: lg } }, cache);
  const mid = heads(at(25));
  assert.ok(mid.length > 0, 'someone out to see it');
  assert.ok(mid.filter(x => ['watch', 'point'].includes(x.s.pose) || x.s.door || x.s.pose === 'walk').length === mid.length, `staring up or hurrying in (${mid.map(x => x.kind + ':' + x.s.pose).join(' ')})`);
  assert.ok(mid.filter(x => ['watch', 'point'].includes(x.s.pose)).length >= 1, 'some stare');
});

test('8b1 — THE HARBOR\'S TIMETABLE: Rosie at her landing between runs, out at 10 / 2 / 6 + the 7 pm dinner cruise, a horn each; the fishing tug out at dawn (its lantern), back late afternoon', () => {
  const { cam, L } = setup(), R = boatRoutes(L), rosie = R.find(r => r.id === 'rosie'), fish = R.find(r => r.id === 'fish'), ms = h => local(2026, 10, 26, h) * 1000, o = { off: OFF };
  assert.equal(boatAt(rosie, ms(9), undefined, o).seg, 'hold', '9 am: at her landing');
  const out = boatAt(rosie, ms(10 + 50 / 3600), undefined, o);
  assert.ok(out.on && out.moving && out.x > rosie.lane[0], '10:00:50: casting off, steaming out');
  assert.equal(boatAt(rosie, ms(11), undefined, o).seg, 'away', '11 am: out on her cruise');
  assert.ok(boatAt(rosie, ms(11.66), undefined, o).astern, '11:40: backing in to her landing');
  assert.equal(boatAt(rosie, ms(12.5), undefined, o).seg, 'hold', 'lunchtime: at her landing (the noon whistle off her stacks)');
  assert.equal(boatAt(rosie, ms(20), undefined, o).seg, 'away', '8 pm: the dinner cruise');
  assert.equal(boatAt(rosie, ms(23), undefined, o).seg, 'hold', '11 pm: home');
  const horns = hornsBetween(ms(0), ms(24), OFF);
  assert.equal(horns.length, ROSIE_TABLE.length, 'a horn for each departure');
  assert.equal(horns.filter(h => h.kind === 'rosie-dinner').length, 1, 'the dinner cruise\'s own blast');
  const dawn = boatAt(fish, ms(6.165), undefined, o);
  assert.ok(dawn.on && dawn.moving && dawn.lantern, 'dawn: the fishing tug heading out, its bow lantern lit');
  assert.equal(boatAt(fish, ms(12), undefined, o).seg, 'away', 'midday: out fishing');
  assert.ok(boatAt(fish, ms(16.48), undefined, o).moving, 'late afternoon: coming home');
  assert.ok(boatAt(fish, ms(21), undefined, o).moored, 'night: moored');
  // the far boats turn + idle CLEAR of Rosie's docked hull on screen (never hidden behind her) — at every phone size
  for (const [W, H] of [[390, 844], [402, 874], [430, 932]]) {
    const { cam: c2, L: L2 } = setup(W, H), R2 = boatRoutes(L2), r2 = R2.find(r => r.id === 'rosie'), right = c2.VPX + c2.F * (r2.lane[0] + r2.len / 2) / r2.z;
    for (const b of R2.filter(r => r.id === 'tug' || r.id.startsWith('sail'))) { const xs = Math.min(...b.segs.filter(g => g.type !== 'away').map(g => Math.min(g.xa, g.xb ?? g.xa))); assert.ok(c2.VPX + c2.F * (xs - b.len / 2) / b.z > right, `${W}: ${b.id} clear of Rosie`); }
  }
  void cam;
});
