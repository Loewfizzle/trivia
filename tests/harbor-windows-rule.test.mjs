// CITY 2.0 — 9c: WINDOW SCENES NEVER POP IN (the owner's rule, Oct 27): every window moment starts + ends by a walk (its painter brings its
// people in + out) or by THE BLIND CYCLE (core/harbor-moments.js#blindAt) — never a cut. Every moment is classified; the blind is fully
// down at the instant a scene starts + ends (the swap happens under it) and never jumps between two frames.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOMENTS, ENTERS_BY_MOTION, usesBlind, blindAt, blindsAt, BLIND } from '../js/core/harbor-moments.js';

test('9c: every window moment enters by motion (a walk-up / its own action) or by the blind — none left unclassified', () => {
  for (const m of MOMENTS) assert.ok(ENTERS_BY_MOTION.includes(m.id) || usesBlind(m.id), `${m.id} has a way in`);
  for (const id of ENTERS_BY_MOTION) assert.ok(MOMENTS.some(m => m.id === id), `${id} is a real moment`);
  assert.ok(MOMENTS.filter(m => usesBlind(m.id)).length >= 5, 'the blind covers the moments that would otherwise pop (the peek, the ghost, the shadows on the shade…)');
});

test('9c: the blind is DOWN at the instant a scene starts + ends (the swap happens under it) and never jumps between frames', () => {
  for (const m of MOMENTS.filter(q => usesBlind(q.id))) {
    const len = m.len;
    assert.equal(blindAt(0, len), 1, `${m.id}: down as it starts`);
    assert.equal(blindAt(-0.01, len), 1, `${m.id}: down just before`);
    assert.ok(blindAt(len - 1e-6, len) > 0.99 && blindAt(len, len) === 1, `${m.id}: down as it ends`);
    assert.equal(blindAt(-(BLIND.down + BLIND.hold) - 0.01, len), 0, `${m.id}: up long before`);
    assert.equal(blindAt(len + BLIND.down + BLIND.hold + 0.01, len), 0, `${m.id}: up long after`);
    assert.equal(blindAt(len / 2, len), 0, `${m.id}: up while it plays`);
    let prev = blindAt(-4, len);
    for (let r = -4; r < len + 4; r += 1 / 60) { const b = blindAt(r, len); assert.ok(Math.abs(b - prev) < 0.06, `${m.id}: a jump at ${r.toFixed(2)} s (${prev.toFixed(3)} → ${b.toFixed(3)})`); prev = b; }
  }
});

test('9c: blindsAt — the cycle runs in the moment\'s own window, before + after its time; the walking moments never get one', () => {
  const peek = MOMENTS.find(m => m.id === 'peek'), toast = MOMENTS.find(m => m.id === 'toast');
  const entries = [{ id: 'peek', win: 'jazz', t0: 1000, len: peek.len }, { id: 'toast', win: 'bar', t0: 1000, len: toast.len }];
  assert.deepEqual(blindsAt(entries, 999), { jazz: 1 });
  assert.deepEqual(blindsAt(entries, 1000 + peek.len / 2), {});
  assert.ok(blindsAt(entries, 1000 + peek.len + 1).jazz === 1 && !('bar' in blindsAt(entries, 999)));
});
