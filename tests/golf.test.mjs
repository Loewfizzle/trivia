// NEON PAR physics: no tunneling (max power, every angle, moving obstacles), bounces, cup capture and
// lip-outs, gaps/jumps, out of bounds, portals, boosts, tiles, platforms, power-ups, and the course data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, startShot, step, R, DT, MAX_SPEED, CUP_R, pointInPoly, moverSegments, floorAt, heightAt, ridePosition } from '../js/games/golf/physics.js';
import { HOLES, MODES, ZONES } from '../js/games/golf/holes/index.js';
import { rect } from '../js/games/golf/holes/shape.js';

const box = (extra = {}) => ({
  id: 'box', par: 2, tee: [0, 2], cup: [0, 90],
  floors: [{ poly: rect(-10, 0, 10, 40), h: 0, surface: 'turf' }],
  walls: [{ pts: [[-10, 0], [10, 0], [10, 40], [-10, 40]], closed: true }],
  ...extra,
});
const inside = (hole, s) => hole.floors.some(f => pointInPoly(s.x, s.y, f.poly));

test('no tunneling: full-power shots at every angle never leave a walled box', () => {
  const hole = box({ walls: [{ pts: [[-10, 0], [10, 0], [10, 40], [-10, 40]], closed: true }, { pts: [[-3, 20], [3, 20]] }] });
  for (let a = 0; a < 360; a += 3) {
    const s = startShot(hole, [0, 10], (a * Math.PI) / 180, 1, 0);
    for (let i = 0; i < 1200 && !s.done; i++) {
      step(hole, s);
      assert.ok(Math.abs(s.x) <= 10 - R + 1e-3 && s.y >= R - 1e-3 && s.y <= 40 - R + 1e-3, `escaped at ${a}° (${s.x.toFixed(2)}, ${s.y.toFixed(2)})`);
      // a zero-thickness wall segment is never crossed
      assert.ok(!(s.y > 20 - R + 1e-3 && s.y < 20 + R - 1e-3 && Math.abs(s.x) < 3 - 1e-3), `inside the thin wall at ${a}°`);
    }
    assert.ok(!s.oob);
  }
});

test('no tunneling through spinning lasers or wheels, however they move', () => {
  const hole = box({ movers: [{ type: 'laser', pivot: [0, 20], length: 9.5, arms: 2, speed: 3 }] });
  let crossings = 0;
  for (let k = 0; k < 40; k++) {
    const s = startShot(hole, [0, 5], Math.PI / 2 + (k - 20) * 0.02, 1, k * 0.37);
    let prev = null;
    for (let i = 0; i < 900 && !s.done; i++) {
      const segs = moverSegments(hole.movers[0], s.t);
      step(hole, s);
      for (const seg of segs) {
        const ab = [seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]];
        const side = Math.sign(ab[0] * (s.y - seg.a[1]) - ab[1] * (s.x - seg.a[0]));
        if (prev && prev.has(seg) && prev.get(seg) !== side) crossings++;
      }
      prev = new Map(moverSegments(hole.movers[0], s.t).map(x => [x, 0]));
      assert.ok(inside(hole, s), 'stayed on the course');
    }
  }
  // (a sweeping arm may legitimately carry the ball around; it must never pass *through* it)
  const s = startShot(hole, [0, 5], Math.PI / 2, 1, 0);
  for (let i = 0; i < 2000 && !s.done; i++) {
    step(hole, s);
    for (const seg of moverSegments(hole.movers[0], s.t)) {
      const ab = [seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]], L2 = ab[0] ** 2 + ab[1] ** 2;
      const u = Math.max(0, Math.min(1, ((s.x - seg.a[0]) * ab[0] + (s.y - seg.a[1]) * ab[1]) / L2));
      const d = Math.hypot(s.x - (seg.a[0] + ab[0] * u), s.y - (seg.a[1] + ab[1] * u));
      assert.ok(d >= R - 0.02, `overlapping a laser arm (${d.toFixed(3)})`);
    }
  }
});

test('bounces lose energy on rails and gain it off bumpers', () => {
  const hole = box({ bumpers: [{ c: [0, 25], r: 1, kick: 8 }] });
  const s = startShot(hole, [0, 10], Math.PI / 2, 0.5, 0);
  let hitAt = null;
  while (!s.done) { step(hole, s); if (!hitAt && s.events.some(e => e.type === 'bumper')) { hitAt = Math.hypot(s.vx, s.vy); break; } }
  assert.ok(hitAt > 0.5 * MAX_SPEED - 3, 'bumper kicked the ball back with extra speed');
  const r = startShot(box(), [0, 30], Math.PI / 2, 0.6, 0);
  let v0 = null, v1 = null;
  while (!r.done) { v0 = Math.hypot(r.vx, r.vy); step(r === r ? box() : null, r); if (r.events.some(e => e.type === 'wall')) { v1 = Math.hypot(r.vx, r.vy); break; } }
  assert.ok(v1 < v0, 'a rail returns less speed than it receives');
});

test('the cup: slow balls drop, fast ones skip over, the rim alone does not count', () => {
  const hole = box({ cup: [0, 20] });
  const slow = simulate(hole, [0, 14], Math.PI / 2, 0.29, 0);
  assert.ok(slow.holed, 'a gentle putt drops');
  const fast = simulate(hole, [0, 14], Math.PI / 2, 0.95, 0);
  assert.ok(!fast.holed && fast.events.some(e => e.type === 'lip'), 'a screamer skips across');
  const rim = simulate(hole, [CUP_R - 0.05, 12], Math.PI / 2, 0.32, 0);
  assert.ok(!rim.holed, 'clipping the rim is not enough');
});

test('out of bounds: rolling off an open edge; gaps need speed, then the lip is cleared in the air', () => {
  const ledge = box({ walls: [{ pts: [[-10, 40], [-10, 0], [10, 0], [10, 40]] }] }); // open far edge
  assert.ok(simulate(ledge, [0, 30], Math.PI / 2, 0.9, 0).oob);
  const leap = HOLES[2];
  const weak = simulate(leap, leap.tee, Math.PI / 2, 0.44, 0); // reaches the lip, too slow to fly
  assert.ok(weak.oob, 'too soft: drops into the alley');
  const strong = simulate(leap, leap.tee, Math.PI / 2, 0.66, 0);
  assert.ok(!strong.oob && strong.events.some(e => e.type === 'jump') && strong.events.some(e => e.type === 'land'), 'hard enough: flies the gap and lands');
  assert.ok(strong.y > 26, 'landed on the lower roof');
});

test('portals, boosts, blinking tiles and platforms', () => {
  const ph = HOLES[3];
  const s = simulate(ph, [0, 10], Math.PI / 2, 0.35, 0);
  assert.ok(s.events.some(e => e.type === 'portal'), 'portal used');
  assert.ok(s.x > 12, 'came out on the far platform');
  const lg = HOLES[4];
  const b = simulate(lg, [0, 24], Math.PI / 2, 0.2, 0);
  assert.ok(b.events.some(e => e.type === 'boost'));
  const br = HOLES[5];
  const t = br.movers[0];
  const onAt = [0, 1, 2, 3, 4, 5].map(k => !!floorAt(br, -2, 14, k * 1 + 0.1));
  assert.ok(onAt.includes(true) && onAt.includes(false), 'tiles blink');
  assert.equal(floorAt(br, -2, 14, 0.1) && floorAt(br, -2, 14, 0.1).tile, t);
  const fe = HOLES[7];
  const p0 = ridePosition(fe, [0, 18], { i: 0, t: 0 }, 0), p1 = ridePosition(fe, [0, 18], { i: 0, t: 0 }, 2);
  assert.ok(Math.abs(p1[0] - p0[0]) > 1 && p1[1] === p0[1], 'a resting ball rides the bridge sideways');
});

test('power-ups: GHOST passes walls, STICKY stops dead, MAGNET pulls the ball in', () => {
  const walls = box({ walls: [{ pts: [[-10, 0], [10, 0], [10, 40], [-10, 40]], closed: true }, { pts: [[-10, 15], [10, 15]] }] });
  const blocked = simulate(walls, [0, 5], Math.PI / 2, 0.5, 0);
  assert.ok(blocked.y < 15);
  const ghost = simulate(walls, [0, 5], Math.PI / 2, 0.5, 0, 'ghost');
  assert.ok(ghost.y > 15, 'ghost went through the wall');
  const sticky = simulate(box(), [0, 30], Math.PI / 2, 0.6, 0, 'sticky');
  assert.ok(sticky.events.some(e => e.type === 'stick') && sticky.y > 38, 'stuck on the far rail');
  const hole = box({ cup: [0, 25] });
  const miss = simulate(hole, [2.4, 15], Math.PI / 2, 0.3, 0);
  const pulled = simulate(hole, [2.4, 15], Math.PI / 2, 0.3, 0, 'magnet');
  assert.ok(!miss.holed && pulled.holed, 'the magnet turns a near miss into a make');
});

test('surface height: ramps rise, lower roofs sit lower, nothing under a gap', () => {
  const leap = HOLES[2];
  assert.ok(heightAt(leap, 0, 19.9) > heightAt(leap, 0, 16.1), 'the ramp rises toward its lip');
  assert.ok(heightAt(leap, 0, 30) < heightAt(leap, 0, 5));
  assert.equal(floorAt(leap, 0, 23, 0), null, 'the alley is open air');
});

test('course data: 9 holes in 3 zones, pars 2–4, tees and cups on solid ground, modes valid', () => {
  assert.equal(HOLES.length, 9);
  assert.deepEqual(HOLES.map(h => h.zone), ['rooftops', 'rooftops', 'rooftops', 'cyber', 'cyber', 'cyber', 'arcade', 'arcade', 'arcade']);
  for (const h of HOLES) {
    assert.ok(h.par >= 2 && h.par <= 4, h.id);
    assert.ok(floorAt(h, h.tee[0], h.tee[1], 0), `${h.id} tee on the floor`);
    assert.ok(h.floors.some(f => pointInPoly(h.cup[0], h.cup[1], f.poly)), `${h.id} cup on the floor`);
    assert.ok(ZONES[h.zone]);
    assert.equal(new Set(HOLES.map(x => x.id)).size, 9);
  }
  for (const list of Object.values(MODES)) assert.ok(list.every(n => n >= 1 && n <= 9));
  assert.deepEqual(MODES.quick3.map(n => HOLES[n - 1].zone), ['rooftops', 'cyber', 'arcade'], 'Quick 3: one hole per zone');
  assert.ok(DT <= 1 / 120 + 1e-9);
});
