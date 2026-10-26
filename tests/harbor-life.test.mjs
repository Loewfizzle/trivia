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

test('SP3 — ROSIE ON THE MOVE: every hour 7 am → 11 pm she comes in, docks AT :00, boards ~3 min, steams off by ~:06 (off screen between + overnight), a horn as she casts off (7 pm = the dinner cruise); the fishing tug out at dawn (its lantern), back late afternoon', () => {
  const { cam, L } = setup(), R = boatRoutes(L), rosie = R.find(r => r.id === 'rosie'), fish = R.find(r => r.id === 'fish'), ms = h => local(2026, 10, 26, h) * 1000, o = { off: OFF };
  const at = (h, s = 0) => boatAt(rosie, ms(h) + s * 1000, undefined, o);
  assert.equal(at(3).seg, 'away', '3 am: no service — off screen');
  assert.equal(at(9, -10 * 60).seg, 'away', '8:50: off screen between visits');
  // the arrival: ~4 min before the hour, bow-first from the right, the swing, the last half length astern — docked at :00
  assert.ok(at(9, -230).on && !at(9, -230).astern && Math.abs(at(9, -230).hd - Math.PI) < 1e-9, '8:56:10: coming in bow-first, heading left');
  assert.equal(at(9, -120).phase, 'turn', '8:58: swinging round right of her pier');
  assert.ok(at(9, -25).astern && at(9, -25).x > rosie.lane[0], '8:59:35: easing astern into her landing');
  assert.ok(at(9, 30).boarding && at(9, 30).seg === 'hold' && Math.abs(Math.cos(at(9, 30).hd) - 1) < 0.01, '9:00:30: docked bow-out, boarding');
  const out = at(9, 200);
  assert.ok(out.on && out.moving && out.x > rosie.lane[0], '9:03:20: cast off, steaming out');
  assert.equal(at(9, 7 * 60).seg, 'away', '9:07: gone off screen');
  let held = 0; for (let s = -600; s < 3000; s += 10) if (at(14, s).seg === 'hold') held += 10;
  assert.ok(held >= 170 && held <= 190, `docked ~3 min an hour, in motion the rest of her visit (${held} s)`);
  assert.equal(at(12, 60).seg, 'hold', '12:01: at her pier (the noon whistle off her stacks)');
  assert.equal(at(23, 60).seg, 'hold', '11:01 pm: the last visit');
  assert.equal(at(23, 15 * 60).seg, 'away', '11:15 pm: done for the night');
  const horns = hornsBetween(ms(0), ms(24), OFF);
  assert.equal(horns.length, ROSIE_TABLE.length, 'a horn for each departure');
  assert.equal(ROSIE_TABLE.length, 17, 'seventeen visits: 7 am → 11 pm');
  assert.equal(horns.filter(h => h.kind === 'rosie-dinner').length, 1, 'the dinner cruise\'s own blast');
  // the fishing tug's dawn: it swings from its mooring (bow toward the pier, heading left) to head out right, its bow toward us mid-swing
  const fo = ms(6.15), fishAt = s => boatAt(fish, fo + s * 1000, undefined, o);
  assert.ok(Math.abs(boatAt(fish, fo - 5000, undefined, o).hd - Math.PI) < 1e-9, 'moored bow toward the pier');
  // (C2: it backs out into open water first — 80 s — and swings there: tests/harbor-boats.test.mjs)
  assert.ok(Math.sin(fishAt(102).hd) < -0.9 && fishAt(102).lantern, 'dawn: mid-swing, its bow toward us, the lantern lit');
  assert.ok(Math.abs(Math.cos(fishAt(140).hd) - 1) < 1e-9 && fishAt(140).x > fishAt(126).x, 'then out bow-first to the right');
  assert.ok(Math.abs(boatAt(fish, ms(16.48), undefined, o).hd - Math.PI) < 1e-9, 'home bow-first, heading left');
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
