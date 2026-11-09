// BOARD 2.0 A — THE PLAYER PAGE's DATA (pure — js/core/player.js): THE TOP 3 RAREST (the lowest share first; a tie → the newest; three at most;
// only what is held) + the flame (alive = played today or yesterday). The answer itself: server.test.mjs on the emulators.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rarestThree, flameOf, CARD_FIELDS } from '../js/core/player.js';
import { dayStartAt } from '../js/core/streak.js';

test('rarestThree — the lowest X% first, a tie → the newest, at most 3, only the held ones', () => {
  const held = { a: 1, b: 5, c: 3, d: 9 };
  const counts = { a: 50, b: 3, c: 3, d: 10, e: 1 };
  assert.deepEqual(rarestThree(held, counts, 100).map(x => x.id), ['b', 'c', 'd']);
  assert.deepEqual(rarestThree({ x: 1 }, {}, 0).map(x => x.id), ['x'], 'no counts yet: still shown (a count of 1)');
  assert.deepEqual(rarestThree({}, counts, 100), []);
  assert.ok(!rarestThree(held, counts, 100).some(x => x.id === 'e'), 'never one not held');
});

test('flameOf — alive today or yesterday, out after that (the count shown only while alive)', () => {
  const now = dayStartAt('d20261110') + 10 * 3600e3;
  assert.deepEqual(flameOf(12, 'd20261110', now), { n: 12, alive: true });
  assert.deepEqual(flameOf(12, 'd20261109', now), { n: 12, alive: true }, 'yesterday: waiting for tonight');
  assert.deepEqual(flameOf(12, 'd20261108', now), { n: 0, alive: false });
  assert.deepEqual(flameOf(0, null, now), { n: 0, alive: false });
});

test('CARD_FIELDS — display ids only (never the pid, the tag, the member Nº, the XP)', () => {
  for (const bad of ['pid', 't', 'mn', 'x', 'key', 'bid']) assert.ok(!CARD_FIELDS.includes(bad), bad);
});
