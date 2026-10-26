// 11a-1 — HALLOWEEN's SKY + WATER heroes, the pure WHEN + WHERE (core/harbor-ghost.js): the ghost ship's crossing, the forced loop,
// the witch's passes on the clock, the bat colony at dusk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GHOST, ghostCrossing, ghostForced, GHOST_LOOP, witchAt, witchPath, WITCH_LEN, batColonyAt, batColonyForced, batJinkAt, colonyBat, COLONY_LEN } from '../js/core/harbor-ghost.js';
import { GHOST_LEN, ghostShipAt, ghostShipTimes } from '../js/core/harbor-holiday.js';

test('the ghost ship materialises, drifts between the lighthouse + the pier head, and dissolves', () => {
  for (const n of [0, 1]) {
    const a = ghostCrossing(0, n), m = ghostCrossing(GHOST_LEN / 2, n), z = ghostCrossing(GHOST_LEN - 0.01, n);
    assert.ok(a.alpha < 0.01, 'out of nothing');
    assert.ok(m.alpha > 0.99, 'solid mid-way');
    assert.ok(z.alpha < 0.05, 'gone at the end');
    for (let s = 0; s <= GHOST_LEN; s += 5) { const g = ghostCrossing(s, n); assert.ok(g.fx >= 0.74 && g.fx <= 0.92, `on the open water right of the wheel (fx ${g.fx})`); }
    // it always moves the way it heads (never stops, never backs)
    let prev = ghostCrossing(0, n).fx;
    for (let s = 1; s <= GHOST_LEN; s++) { const f = ghostCrossing(s, n).fx; assert.ok((f - prev) * a.dir > 0, 'drifting on'); prev = f; }
  }
  assert.equal(ghostCrossing(10, 0).dir, -1); assert.equal(ghostCrossing(10, 1).dir, 1);
  // the depth: in front of the breakwater + the lighthouse (z 150) — behind them its hull hid — behind the wheel (132)
  assert.ok(GHOST.z > 133.7 && GHOST.z < 150);
});
test('the forced ghost ship loops from 1.5 s after the flag', () => {
  assert.equal(ghostForced(100, null), null);
  assert.equal(ghostForced(101, 100), null);
  assert.equal(ghostForced(101.5 + 20, 100).s, 20);
  assert.equal(ghostForced(101.5 + GHOST_LOOP + 3, 100).n, 1);
  assert.equal(ghostForced(101.5 + GHOST_LEN + 1, 100), null, 'the gap between loops');
});
test('the ghost ship sails on Halloween night only, twice', () => {
  const [t0, t1] = ghostShipTimes(2026);
  const at = h => ({ y: 2026, m: h >= 24 ? 11 : 10, d: h >= 24 ? 1 : 31, h: Math.floor(h % 24), mi: Math.round((h % 1) * 60), s: 30 });
  assert.ok(ghostShipAt(at(t0)), 'the early crossing'); assert.ok(ghostShipAt(at(t1)), 'the late crossing');
  assert.equal(ghostShipAt({ y: 2026, m: 10, d: 30, h: Math.floor(t0), mi: Math.round((t0 % 1) * 60), s: 30 }), null, 'not the night before');
});
test('the witch passes on the clock: every ~7 min on the night, rarer the last week, never by day', () => {
  let on = 0, starts = 0, prev = false;
  for (let s = 0; s < 3 * 3600; s++) {
    const w = witchAt({ y: 2026, m: 10, d: 31, h: 20 + Math.floor(s / 3600), mi: Math.floor(s / 60) % 60, s: s % 60 }, 1);
    if (w) { on++; assert.ok(w.s >= 0 && w.s < WITCH_LEN); }
    if (w && !prev) starts++; prev = !!w;
  }
  assert.ok(starts >= 22 && starts <= 27, `~26 passes in 3 h (${starts})`);
  let rare = 0; prev = false;
  for (let s = 0; s < 3 * 3600; s++) { const w = witchAt({ y: 2026, m: 10, d: 27, h: 20 + Math.floor(s / 3600), mi: Math.floor(s / 60) % 60, s: s % 60 }, 0.3); if (w && !prev) rare++; prev = !!w; }
  assert.ok(rare >= 6 && rare <= 8, `~7 in 3 h on a build-up night (${rare})`);
  assert.equal(witchAt({ y: 2026, m: 10, d: 31, h: 14, mi: 0 }, 1), null);
  assert.equal(witchAt({ y: 2026, m: 10, d: 31, h: 21, mi: 0 }, 0), null);
  const p0 = witchPath(0, 1), p1 = witchPath(1, 1); assert.ok(p0.x < 0 && p1.x > 1, 'edge to edge');
});
test('the bats pour out of the crown at dusk and spread; the night keeps a few jinking', () => {
  const lc = (h, mi, s = 0) => ({ y: 2026, m: 10, d: 31, h, mi, s });
  assert.equal(batColonyAt(lc(17, 30), 1, 17.6), null, 'before dusk');
  assert.ok(batColonyAt(lc(17, 57), 1, 17.6) != null, '~20 min after sunset');
  assert.equal(batColonyAt(lc(19, 0), 1, 17.6), null, 'over by 7 pm');
  assert.equal(batColonyForced(10, null), null); assert.equal(batColonyForced(11.5 + 5, 10), 5);
  // the stream: the bats leave one after another; each starts AT the crown and rises out of it
  const n = 40, late = colonyBat(n - 1, n, 1);
  let early = null; for (let t = 0; t < 4 && !early; t += 0.05) early = colonyBat(0, n, t);
  assert.ok(early && Math.hypot(early.x, early.y) < 14, 'the first leaves within seconds, from the crown');
  assert.equal(late, null, 'the last is still inside');
  let up = 0; for (let i = 0; i < n; i++) { const b = colonyBat(i, n, COLONY_LEN * 0.6); if (b && b.y < 0) up++; }
  assert.ok(up > n * 0.5, 'they rise out over the city');
  let j = 0; for (let m = 0; m < 120; m++) if (batJinkAt(lc(21 + Math.floor(m / 60), m % 60), 1, 17.6)) j++;
  assert.ok(j > 5, 'a few jinking through the night');
});
