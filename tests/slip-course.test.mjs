// SLIPSTREAM: course generation, physics, and the bot proving the courses are survivable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCourse, floorAt, baseSpeed, SUDDEN_T, biomeAt, BIOMES, MIDDLE, isSolid,
} from '../js/games/slip/course.js';
import { createRider, step, advance, TOL, STEP, safeSpot, laserOn, zapLine, pose } from '../js/games/slip/physics.js';
import { decide } from '../js/games/slip/bot.js';

const course = createCourse('test-seed-1');
const xAtNominal = (c, T) => { let x = 0; while (x < c.L - 10 && c.timeAt(x) < T) x += 8; return x; };

test('the same seed gives the identical course; another seed a different one', () => {
  const a = createCourse('room-ABCD-m1'), b = createCourse('room-ABCD-m1'), c = createCourse('room-ABCD-m2');
  assert.equal(a.sig, b.sig);
  assert.deepEqual(Array.from(a.h.subarray(0, 4000)), Array.from(b.h.subarray(0, 4000)));
  assert.deepEqual(a.hz.lasers, b.hz.lasers);
  assert.notEqual(a.sig, c.sig);
});

test('generation is quick and the course is long enough for any ride', () => {
  const t0 = performance.now();
  const c = createCourse('speed');
  assert.ok(performance.now() - t0 < 300, 'generated in under 300 ms');
  assert.ok(xAtNominal(c, SUDDEN_T + 120) < c.L - 500);
});

test('calm start: no hazards in the first 45 s, then each kind arrives in order', () => {
  const c = course;
  const firstX = list => (list.length ? (list[0].x ?? list[0].x0) : Infinity);
  const tOf = x => c.timeAt(x);
  assert.ok(tOf(firstX(c.hz.gaps)) >= 44, 'gaps after the calm opening');
  assert.ok(tOf(firstX(c.hz.zaps)) >= 74);
  assert.ok(tOf(firstX(c.hz.lasers)) >= 99);
  assert.ok(tOf(firstX(c.hz.crumbles)) >= 129);
  assert.ok(tOf(firstX(c.hz.flips)) >= 159);
  assert.ok(c.hz.rings.length > 10 && tOf(firstX(c.hz.rings)) >= 19);
  for (const k of ['gaps', 'lasers', 'zaps', 'crumbles', 'flips']) assert.ok(c.hz[k].length >= 5, `${k}: ${c.hz[k].length}`);
  // density rises: hazards in the last minute before sudden death vs the first minute after the calm
  const all = [...c.hz.gaps, ...c.hz.lasers, ...c.hz.zaps, ...c.hz.crumbles].map(h => tOf(h.x ?? h.x0));
  const early = all.filter(t => t >= 45 && t < 105).length, late = all.filter(t => t >= 300 && t < 360).length;
  assert.ok(late > early, `denser later (${early} → ${late})`);
});

test('biomes: dunes first, the middle three twice in seeded orders, open space last; 3 variants', () => {
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const c = createCourse(seed);
    const ids = c.biomes.map(b => b.id);
    assert.equal(ids[0], 'dunes');
    assert.equal(ids.at(-1), 'space');
    assert.deepEqual(ids.slice(1, 4).sort(), MIDDLE.slice().sort());
    assert.deepEqual(ids.slice(4, 7).sort(), MIDDLE.slice().sort());
    assert.notEqual(ids[3], ids[4], 'never the same biome twice in a row');
    for (const b of c.biomes) assert.ok(b.variant >= 0 && b.variant <= 2 && BIOMES.includes(b.id));
  }
  const orders = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(s => createCourse(s).biomes.map(b => b.id + b.variant).join()));
  assert.ok(orders.size >= 6, 'rides look different');
  const mid = course.biomes[2];
  const bl = biomeAt(course, mid.x0 - 10);
  assert.ok(bl.b && bl.mix > 0 && bl.mix < 1, 'biomes blend over a stretch');
});

function ride(c, r, { until, maxCrashes = Infinity, flips = false } = {}) {
  const input = { hold: false, pressT: 0, taps: 0 };
  let next = 0;
  const events = [];
  const mem = {};
  while (r.st !== 'out' && until(r)) {
    if (r.t >= next) { const d = decide(r, c, { flips, mem, pressT: input.pressT }); input.hold = d.hold; if (d.tap) input.taps++; next = r.t + 0.1; }
    input.pressT = input.hold ? input.pressT + STEP : 0;
    r.t += STEP;
    step(r, c, input);
    for (const e of r.events) events.push({ ...e, x: r.x, t: r.t });
    r.events.length = 0;
    if (r.crashes > maxCrashes) break;
  }
  return events;
}

test('the bot rides 4 courses cleanly until sudden death (survivable)', () => {
  for (const seed of ['val-1', 'val-2', 'val-3', 'val-4']) {
    const c = createCourse(seed);
    const xSD = xAtNominal(c, SUDDEN_T - 15);
    const r = createRider({ lives: 1, course: c });
    const ev = ride(c, r, { until: s => s.t < SUDDEN_T && s.x < xSD });
    const crash = ev.find(e => e.e === 'crash');
    assert.ok(!crash, `${seed}: crashed (${crash && crash.why}) at ${crash && Math.round(crash.x)} m, t ${crash && crash.t.toFixed(0)} s`);
    assert.ok(ev.filter(e => e.e === 'gate').length >= 3 && ev.filter(e => e.e === 'gflip').length >= 4, `${seed}: met gates + flip zones`);
  }
});

test('every hazard section is survivable from a respawn just before it at the minimum speed', () => {
  const c = createCourse('val-sections');
  const xSD = xAtNominal(c, SUDDEN_T);
  const items = [
    ...c.hz.gaps.map(h => ['gap', h.x0]), ...c.hz.lasers.map(h => ['laser', h.x]), ...c.hz.zaps.map(h => ['zap', h.x0]),
    ...c.hz.crumbles.map(h => ['crumble', h.x0]), ...c.hz.flips.map(h => ['flip', h.x0]),
  ].filter(([, x]) => x < xSD).sort((a, b) => a[1] - b[1]);
  let failed = [];
  for (const [kind, x] of items) {
    const start = safeSpot(c, x - 110);
    const r = createRider({ lives: 1, course: c, x: start, t: c.timeAt(x) });
    r.sp = baseSpeed(r.t);
    const end = kind === 'flip' ? c.hz.flips.find(f => f.x0 === x).x1 + 60 : kind === 'zap' ? c.hz.zaps.find(z => z.x0 === x).x1 + 30 : kind === 'crumble' ? c.hz.crumbles.find(z => z.x0 === x).x1 + 30 : x + 40;
    const ev = ride(c, r, { until: s => s.x < end && s.t < c.timeAt(x) + 25 });
    const crash = ev.find(e => e.e === 'crash');
    if (crash) failed.push(`${kind}@${Math.round(x)}(${crash.why})`);
  }
  assert.ok(items.length > 25, `sections checked: ${items.length}`);
  assert.deepEqual(failed, [], `unsurvivable sections: ${failed.join(', ')}`);
});

test('physics: hold dives faster downhill; release on a crest launches; a plain jump lands clean', () => {
  const c = course;
  // find a descent and compare speed gain holding vs not
  const x0 = c.pts.find(([x, y], i) => x > 400 && c.pts[i + 1] && c.pts[i + 1][1] < y - 4)[0];
  const a = createRider({ course: c, x: x0 + 1, t: 30 }), b = createRider({ course: c, x: x0 + 1, t: 30 });
  advance(a, c, { hold: true, pressT: 1 }, 0.6);
  advance(b, c, { hold: false, pressT: 0 }, 0.6);
  assert.ok(a.sp > b.sp + 1, `diving gains speed (${a.sp.toFixed(1)} vs ${b.sp.toFixed(1)})`);
  // a fast release before a crest launches, and lands clean (the assist aligns the board)
  const r = createRider({ course: c, x: 400, t: 40 });
  const ev = ride(c, r, { until: s => s.t < 70 });
  assert.ok(ev.filter(e => e.e === 'launch').length >= 5, 'launches');
  assert.ok(ev.filter(e => e.e === 'land').length >= 5 && !ev.some(e => e.e === 'crash'), 'clean landings');
});

test('physics: landing tolerance — within 40° is clean, beyond is a crash; flips boost and build a combo', () => {
  const c = course;
  const mk = (phi, airRot) => {
    const r = createRider({ course: c, x: 300, t: 20 });
    const fy = floorAt(c, 300.5);
    Object.assign(r, { gnd: false, x: 300, y: fy + 0.05, vx: 18, vy: -6, phi, spin: 0, airRot, airT: 1 });
    step(r, c, { hold: false, pressT: 0, taps: 0 });
    return r;
  };
  const slope = Math.atan(c.dh[Math.round(300 / 0.25)]);
  const ok1 = mk(slope + TOL * 0.9, 0);
  assert.equal(ok1.st, 'ride');
  const bad = mk(slope + TOL * 1.15, 0);
  assert.notEqual(bad.st, 'ride', 'off-angle landing crashes');
  assert.equal(bad.lives, 1);
  const flip = mk(slope, Math.PI * 2 * 2);
  assert.equal(flip.combo, 2);
  assert.ok(flip.sp > 20, `two flips boost (${flip.sp.toFixed(1)})`);
});

test('physics: a tap flips one full turn in ~0.5 s; a long press in the air dives', () => {
  const c = course;
  const r = createRider({ course: c, x: 300, t: 20 });
  Object.assign(r, { gnd: false, y: floorAt(c, 300) + 60, vx: 15, vy: 0, phi: 0, airT: 0.1 });
  const input = { hold: false, pressT: 0, taps: 1 };
  advance(r, c, input, 0.3);
  assert.ok(r.spin > 0 && r.airRot > 2, 'turning');
  advance(r, c, input, 0.4);
  assert.equal(r.spin, 0);
  assert.ok(Math.abs(r.airRot - Math.PI * 2) < 1e-6, 'exactly one full turn');
  const a = createRider({ course: c, x: 300, t: 20 }), b = createRider({ course: c, x: 300, t: 20 });
  for (const s of [a, b]) Object.assign(s, { gnd: false, y: floorAt(c, 300) + 60, vx: 15, vy: 0, airT: 0.1 });
  advance(a, c, { hold: true, pressT: 0.5 }, 0.5);
  advance(b, c, { hold: true, pressT: 0.05 }, 0.5); // a tap-length press is not a dive
  assert.ok(a.vy < b.vy - 5, 'held = dive');
});

test('hazards: gap fall, laser beam (and the blinking low beam), low ceiling, crumbling ground, rings', () => {
  const c = course;
  // gap: a slow rider holding over the edge falls in
  const gp = c.hz.gaps[0];
  const r = createRider({ course: c, x: gp.x0 - 6, t: c.timeAt(gp.x0) });
  advance(r, c, { hold: true, pressT: 1 }, 1.5);
  assert.equal(r.lives, 1, 'fell in');
  // laser: skimming the ground at the gate = crash (unless the low beam is off)
  const L = c.hz.lasers.find(l => !l.blink);
  const s = createRider({ course: c, x: L.x - 0.1, t: 100 });
  Object.assign(s, { gnd: false, y: L.lo - 0.4, vx: 20, vy: 0 });
  step(s, c, { hold: false, pressT: 0 });
  assert.notEqual(s.st, 'ride', 'hit the low beam');
  const s2 = createRider({ course: c, x: L.x - 0.1, t: 100 });
  Object.assign(s2, { gnd: false, y: (L.lo + L.hi) / 2, vx: 20, vy: 0 });
  step(s2, c, { hold: false, pressT: 0 });
  assert.equal(s2.st, 'ride', 'through the opening');
  const B = { ...L, blink: true, period: 2, on: 0.5, phase: 0 };
  assert.equal(laserOn(B, 0.2), true);
  assert.equal(laserOn(B, 1.2), false);
  // low ceiling: flying above the zap line
  const z = c.hz.zaps[0];
  const zx = (z.x0 + z.x1) / 2;
  const u = createRider({ course: c, x: zx, t: 90 });
  Object.assign(u, { gnd: false, y: zapLine(c, z, zx) + 0.2, vx: 20, vy: 0 });
  step(u, c, { hold: false, pressT: 0 });
  assert.notEqual(u.st, 'ride', 'zapped');
  // crumbling: a tile gives way after its delay; standing on it then = falling
  const cr = c.hz.crumbles[0];
  const tile = c.hz.crumbleTiles.find(t => t.x0 >= cr.x0);
  const w = createRider({ course: c, x: tile.x0 + 0.5, t: 140 });
  w.sp = 0.1; // pinned in place (as if very slow) to watch the tile go
  w.touched.push([tile.id, 140 - tile.delay - 0.05]);
  step(w, c, { hold: false, pressT: 0 });
  assert.equal(w.gnd, false, 'the tile gave way');
  // rings boost
  const ring = c.hz.rings[0];
  const v = createRider({ course: c, x: ring.x - 0.1, t: 30 });
  Object.assign(v, { gnd: false, y: ring.y, vx: 20, vy: 0 });
  step(v, c, { hold: false, pressT: 0 });
  assert.equal(v.rings, 1);
  assert.ok(v.vx > 23);
});

test('gravity flip zones: the rider rides the ceiling inverted and drops back after', () => {
  const c = course;
  const f = c.hz.flips[0];
  const r = createRider({ course: c, x: safeSpot(c, f.x0 - 90), t: c.timeAt(f.x0) });
  const ev = ride(c, r, { until: s => s.x < f.x1 + 60 && s.t < c.timeAt(f.x0) + 20 });
  const flips = ev.filter(e => e.e === 'gflip');
  assert.equal(flips.length, 2, 'in and out');
  assert.equal(flips[0].g, -1);
  assert.ok(!ev.some(e => e.e === 'crash'), 'survived');
  const onCeiling = ev.filter(e => e.e === 'land' && e.x > f.x0 && e.x < f.x1);
  assert.ok(onCeiling.length >= 1, 'landed on the ceiling track');
  // pose() reports world coordinates while inverted
  const p = createRider({ course: c, x: f.x0 + 20, t: 200 });
  Object.assign(p, { g: -1, y: -f.cy, phi: 0.2 });
  const w = pose(p);
  assert.ok(Math.abs(w.y - f.cy) < 1e-9 && Math.abs(w.a + 0.2) < 1e-9);
});

test('lives: crash -> rewind -> respawn behind the crash on safe ground, invulnerable for 2 s; out of lives = out', () => {
  const c = course;
  const gp = c.hz.gaps[1];
  const r = createRider({ course: c, x: gp.x0 - 30, t: c.timeAt(gp.x0), lives: 2 });
  const input = { hold: true, pressT: 1 };
  while (r.lives === 2 && r.t < c.timeAt(gp.x0) + 6) advance(r, c, input, 0.05);
  assert.equal(r.lives, 1);
  assert.equal(r.st, 'rewind');
  advance(r, c, { hold: false, pressT: 0 }, 0.95);
  assert.equal(r.st, 'ride');
  assert.ok(r.x < gp.x0 && isSolid(c, r.x), `respawned behind the gap on solid ground (${r.x.toFixed(1)} < ${gp.x0})`);
  assert.ok(r.inv > 0.5, 'invulnerable');
  // invulnerable: even holding through the gap, the rider floats over it
  advance(r, c, { hold: true, pressT: 1 }, 1);
  assert.equal(r.st, 'ride');
  const o = createRider({ course: c, x: gp.x0 - 6, t: c.timeAt(gp.x0), lives: 1 });
  advance(o, c, { hold: true, pressT: 1 }, 4);
  assert.equal(o.st, 'out');
});

test('base speed ramps for 6 minutes, then sudden death surges', () => {
  assert.equal(Math.round(baseSpeed(0)), 12);
  assert.ok(baseSpeed(180) > 17 && baseSpeed(180) < 22);
  assert.equal(Math.round(baseSpeed(360)), 26);
  assert.ok(baseSpeed(420) - baseSpeed(360) > 12, 'sudden death surge');
});

test('the bot can flip and still land (combos happen)', () => {
  const c = course;
  const r = createRider({ course: c, x: 300, t: 30, lives: 3 });
  const ev = ride(c, r, { until: s => s.t < 110, flips: true });
  assert.ok(r.flips >= 3, `flips: ${r.flips}`);
  assert.ok(r.bestCombo >= 2, `combo ${r.bestCombo}`);
  assert.ok(ev.filter(e => e.e === 'crash').length <= 1);
});
