// JAYWALK H4 ADD-ON (the owner, Nov 16 — hit by a truck, the end screen said "HIT BY A CAR"): THE CAUSE LINE NAMES THE VEHICLE THAT HIT
// YOU. ONE source of truth for which vehicle a car is — causes.js#vehicleAt(course, lane, j), from the course's seed — read by THE
// DRAWING (night.js) and THE WORDS (hitVehicle → runLine) alike, in the game AND the lab; no generic "HIT BY A CAR" anywhere. For EVERY
// vehicle kind (sedan · hatchback · taxi · van · box truck · the train): a real run hit by it → the end line names that exact vehicle
// through the game's path (view.js#lineOf · victory.js#endOf from the result row) and the lab's (lab.js: runLine(course, the live result)).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse, moverLeft, pulseAt } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver, resultOf } from '../js/games/jaywalk/engine.js';
import { CAUSE_LINES, VEHICLES, CAR_KINDS, vehicleAt, hitVehicle, causeLine, runLine } from '../js/games/jaywalk/causes.js';
import { endOf } from '../js/games/jaywalk/victory.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const NAMES = { sedan: 'A SEDAN', hatchback: 'A HATCHBACK', taxi: 'A TAXI', van: 'A VAN', truck: 'A BOX TRUCK' };

/** a kid stood on lane `y` of this course (a view-free pose: the engine itself then decides what hits him, and when) → the run's result */
function standOn(seed, y, mode = 'solo') {
  const course = createCourse(seed), run = createRun({ seed, mode });
  Object.assign(run, { y, best: y, x: 4 * T.FP + T.FP / 2, wall: (y - 5) * T.FP });
  while (!isOver(run) && run.t < 3000) step(run, course, '');
  return { course, r: resultOf(run) };
}
/** the vehicle really ON the kid at the tick he went out — found from the lane's movers, the way the scene lays them out */
function onHim(course, r) {
  const L = course.lane(r.y);
  const j = L.items.findIndex(it => { const l = moverLeft(L, it, r.end); return l < r.x + T.KID_HALF && l + it.len > r.x - T.KID_HALF; });
  return { j, kind: j < 0 ? '' : vehicleAt(course, r.y, j), cells: j < 0 ? 0 : L.items[j].len / T.FP };
}

test('ONE SOURCE OF TRUTH: vehicleAt(course, lane, j) — every vehicle has its line, there is NO generic car line, a size is always its model', () => {
  assert.deepEqual([...VEHICLES].slice(0, 5), ['sedan', 'hatchback', 'taxi', 'van', 'truck']);   // (VARIETY B1: + the area traffic — its own lines, tests/jaywalk-variety-b1.test.mjs)
  for (const v of VEHICLES.slice(0, 5)) assert.match(CAUSE_LINES[`car:${v}`] || '', new RegExp(`BY ${NAMES[v]}$`), `the ${v}'s line names it`);
  assert.equal(CAUSE_LINES.car, undefined, 'no generic car line in the table');
  assert.ok(!Object.values(CAUSE_LINES).some(l => /\bA CAR\b/.test(l)), 'no line says "a car"');
  assert.equal(CAUSE_LINES.train, 'HIT BY THE 6:15', 'the train is THE 6:15');
  assert.equal(causeLine({ cause: 'car' }), 'OUT', 'a car hit with no vehicle is never "HIT BY A CAR"');
  // the same answer however often it is asked; a 2-cell mover is always the van, a 3-cell one always THE BOX TRUCK, a 1-cell one a car
  const course = createCourse('one-source');
  let cars = 0;
  for (let i = 4; i < 300; i++) {
    const L = course.lane(i);
    if (L.type !== 'road') { assert.equal(vehicleAt(course, i, 0), '', 'not a road: no vehicle'); continue; }
    L.items.forEach((it, j) => {
      const v = vehicleAt(course, i, j), cells = it.len / T.FP;
      assert.equal(v, vehicleAt(createCourse('one-source'), i, j), 'from the seed alone: the same on every phone');
      assert.ok(cells === 3 ? v === 'truck' : cells === 2 ? v === 'van' : CAR_KINDS.includes(v), `lane ${i} mover ${j}: ${cells} cells = ${v}`);
      cars++;
    });
  }
  assert.ok(cars > 200);
});

test('FOR EVERY VEHICLE KIND: a run hit by it → the end line names THAT vehicle — the game\'s path and the lab\'s, the same words', () => {
  const seen = {};
  for (let s = 0; s < 60 && Object.keys(seen).length < 5; s++) {
    const seed = `named${s}`, probe = createCourse(seed);
    for (let y = 4; y < 260 && Object.keys(seen).length < 5; y++) {
      if (probe.lane(y).type !== 'road') continue;
      const { course, r } = standOn(seed, y);
      if (r.cause !== 'car') continue;
      const hit = onHim(course, r);
      assert.ok(hit.j >= 0, `${seed} lane ${y}: a car hit means a mover is on the kid at tick ${r.end}`);
      // THE WORDS read the same function as THE DRAWING: the vehicle named = the mover on him
      assert.equal(hitVehicle(course, r), hit.kind);
      const want = CAUSE_LINES[`car:${hit.kind}`];
      // the lab's path: runLine(course, the live result) · the game's views: the same call with the run's own fields
      assert.equal(runLine(course, r), want, 'the lab\'s end line');
      assert.equal(runLine(course, { cause: r.cause, y: r.y, x: r.x, end: r.end, lanes: r.lanes, taken: r.taken }), want, 'the game view\'s line');
      // the podium's path: the result ROW (a match on the game's course) → victory.js#endOf
      const game = { mode: 'match', seed, matchId: 'm1', participants: { u1: true }, results: { u1: { l: r.lanes, t: r.tick, w: r.cause, e: r.end, y: r.y, px: r.x } } };
      const E = endOf(game, 'u1', 'CODE');
      assert.deepEqual([E.line, E.vehicle], [want, hit.kind], 'the podium\'s line');
      assert.match(want, new RegExp(`BY ${NAMES[hit.kind]}$`));
      assert.ok(hit.kind === 'truck' ? hit.cells === 3 : hit.kind === 'van' ? hit.cells === 2 : hit.cells === 1, 'the words fit the size on the screen');
      seen[hit.kind] = (seen[hit.kind] || 0) + 1;
    }
  }
  assert.deepEqual(Object.keys(seen).sort(), [...VEHICLES].slice(0, 5).sort(), `every plain vehicle kind (no area model in on this page) has hit a kid and been named (${JSON.stringify(seen)})`);
});

test('THE BOX TRUCK (the owner\'s case) + THE TRAIN: hit by a truck → "FLATTENED BY A BOX TRUCK", never "a car"; hit by the train → "HIT BY THE 6:15"', () => {
  // a 3-cell mover: stand a kid in its way on many lanes until a truck is what gets him
  let truck = null;
  for (let s = 0; s < 80 && !truck; s++) {
    const seed = `truck${s}`, probe = createCourse(seed);
    for (let y = 4; y < 200 && !truck; y++) {
      const L = probe.lane(y);
      if (L.type !== 'road' || !L.items.some(it => it.len === 3 * T.FP)) continue;
      const { course, r } = standOn(seed, y);
      if (r.cause === 'car' && onHim(course, r).kind === 'truck') truck = { course, r };
    }
  }
  assert.ok(truck, 'a run a box truck ended');
  assert.equal(runLine(truck.course, truck.r), 'FLATTENED BY A BOX TRUCK');
  // the train: a kid on the rails when it passes
  let train = null;
  for (let s = 0; s < 40 && !train; s++) {
    const seed = `rail${s}`, probe = createCourse(seed);
    for (let y = 25; y < 200 && !train; y++) {
      if (probe.lane(y).type !== 'rail') continue;
      const { course, r } = standOn(seed, y);
      if (r.cause === 'train') { assert.equal(pulseAt(course.lane(y).pulse, r.end).st, 'pass'); train = { course, r }; }
    }
  }
  assert.ok(train, 'a run the train ended');
  assert.equal(runLine(train.course, train.r), 'HIT BY THE 6:15');
});

test('A NEAR THING STILL NAMES A VEHICLE: hitVehicle never comes back empty on a road — and nothing on a lane that is no road', () => {
  const course = createCourse('near');
  let roads = 0;
  for (let i = 4; i < 120; i++) {
    const L = course.lane(i);
    if (L.type === 'road') { roads++; for (const x of [500, 4500, 8500]) for (const end of [0, 37, 911]) assert.ok(VEHICLES.includes(hitVehicle(course, { y: i, x, end })), `lane ${i}: a vehicle named`); }
    else assert.equal(hitVehicle(course, { y: i, x: 4500, end: 10 }), '');
  }
  assert.ok(roads > 20);
});

test('THE SOURCES: the drawing, the game\'s views, the podium + THE LAB all read causes.js — no second picker, no generic line anywhere', () => {
  const night = code('js/games/jaywalk/night.js'), lab = code('js/games/jaywalk/lab.js'), view = code('js/games/jaywalk/view.js'), vic = code('js/games/jaywalk/victory.js');
  // THE DRAWING: which model a car is = vehicleAt — nothing else in the view picks a kind
  assert.match(night, /import \{ hsh, strSeed, vehicleAt, plainAt \} from '\.\/causes\.js';/);
  assert.match(night, /let what = vehicleAt\(course, i, j\);/, 'night.js draws the model vehicleAt names');   /* (VARIETY B1: an area model not in → plainAt, which vehicleAt then names too) */
  assert.doesNotMatch(night, /CAR_KINDS|vehicleOf/, 'no picker of its own');
  assert.match(night, /cKey = id => C_KEY\[id\] \|\| \(C_KEY\[id\] = `car-\$\{id\}`\)/, 'SMOOTH 2: the car model names are built once, not per car per frame');
  assert.match(night, /const name = what === 'truck' \? 'car-van' : cKey\(what\)/, 'the model drawn IS the kind (car-sedan · car-hatchback · car-taxi · car-van; the truck its own mesh)');
  // THE LAB: the same table, the same function — its own CAUSE words are gone
  assert.match(lab, /import \{ runLine, hitVehicle, vehicleAt \} from '\.\/causes\.js';/);
  assert.match(lab, /endT\.textContent = runLine\(course, live, look\);/, 'the lab\'s end line = causes.js#runLine on the live result');
  assert.doesNotMatch(lab, /const CAUSE\b|IN THE WATER|HIT BY THE TRAIN/, 'no table of the lab\'s own');
  // THE GAME: every line through runLine
  assert.match(view, /const lineOf = \(r, course\) => runLine\(course, \{ cause: r\.cause, y: r\.y, x: r\.x, end: r\.end, lanes: r\.best, taken: r\.st === 'taken' \}, lookNow\(\)\);/);
  assert.doesNotMatch(view, /causeLine\(|hitVehicle\(/, 'the view never builds a line by hand');
  assert.match(vic, /runLine\(course, \{ cause: r\.w, y: r\.y, x: r\.px, end: r\.e, lanes: r\.l \|\| 0, taken: !!r\.x \}, look\)/);
  // no generic line in ANY shipped JAYWALK file
  for (const f of readdirSync(new URL('../js/games/jaywalk/', import.meta.url)).filter(n => n.endsWith('.js'))) assert.doesNotMatch(code(`js/games/jaywalk/${f}`), /HIT BY A CAR/, `${f}: no generic "HIT BY A CAR"`);
  assert.doesNotMatch(code('api/_lib/jaywalk.js') + code('css/jaywalk.css'), /HIT BY A CAR/);
});
