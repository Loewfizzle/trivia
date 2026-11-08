// FRIENDS A — the pure friends rules (js/core/friends.js): request → accept, the quiet decline, cancel, remove, block, the caps,
// RECENTLY PLAYED WITH, YOUR TABLE's pick, a waiting invite's life. The server's own run of these: tests/integration/friends.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FR, friendStep, relOf, suggestions, recentPatch, tablePids, inviteLive, fresh } from '../js/core/friends.js';

const T = Date.UTC(2026, 10, 8, 2);
const P = i => `p${'abcdefghijkmnpqrstuvwxyz23456789'[i % 32]}${'a'.repeat(10)}`.slice(0, 12);
const A = P(0), B = P(1), C = P(2);
/** apply a step's up to a little world { pid: node } */
function apply(W, a, b, r) {
  assert.ok(r.ok, r.why);
  for (const [k, v] of Object.entries(r.up)) {
    const who = k.startsWith('a/') ? a : b, [, map, p] = k.split('/');
    W[who] ||= {}; W[who][map] ||= {};
    if (v == null) delete W[who][map][p]; else W[who][map][p] = v;
  }
  return r;
}
const step = (W, kind, a, b, now = T) => apply(W, a, b, friendStep(kind, a, b, W[a], W[b], now));

test('ADD → a request; ACCEPT → friends on BOTH sides; nobody is a friend without saying yes', () => {
  const W = {};
  assert.equal(step(W, 'add', A, B).rel, 'out');
  assert.equal(relOf(W[A], A, B, T), 'out');
  assert.equal(relOf(W[B], B, A, T), 'in');
  assert.equal(relOf(W[A], A, B, T) === 'friend', false);
  assert.equal(step(W, 'add', A, B).rel, 'out', 'a second ADD writes nothing new');
  assert.equal(step(W, 'accept', B, A).rel, 'friend');
  assert.equal(relOf(W[A], A, B, T), 'friend'); assert.equal(relOf(W[B], B, A, T), 'friend');
  assert.deepEqual(Object.keys(W[A].out || {}), []); assert.deepEqual(Object.keys(W[B].in || {}), []);
  // (they asked first: your ADD accepts)
  const W2 = {}; step(W2, 'add', A, C); assert.equal(step(W2, 'add', C, A).rel, 'friend');
});

test('DECLINE is quiet (theirs still says REQUESTED, no re-request); CANCEL clears both; REMOVE clears both quietly', () => {
  const W = {};
  step(W, 'add', A, B); step(W, 'decline', B, A);
  assert.equal(relOf(W[B], B, A, T), 'none'); assert.equal(relOf(W[A], A, B, T), 'out', 'the sender never learns');
  assert.equal(friendStep('add', A, B, W[A], W[B], T).rel, 'out'); assert.deepEqual(friendStep('add', A, B, W[A], W[B], T).up, {}, 'no second request lands');
  step(W, 'cancel', A, B); assert.equal(relOf(W[A], A, B, T), 'none');
  step(W, 'add', A, B); assert.equal(relOf(W[B], B, A, T), 'in', 'after a cancel a new request lands again');
  step(W, 'accept', B, A); step(W, 'remove', A, B);
  assert.equal(relOf(W[A], A, B, T), 'none'); assert.equal(relOf(W[B], B, A, T), 'none');
  assert.equal(friendStep('accept', A, B, W[A], W[B], T).why, 'no_request');
});

test('BLOCK: no more requests from them (it looks sent, never lands), gone from suggestions; UNBLOCK', () => {
  const W = { [A]: { rp: { [B]: T - 1000, [C]: T - 2000 } } };
  step(W, 'add', A, B); step(W, 'accept', B, A);
  step(W, 'block', A, B);
  assert.equal(relOf(W[A], A, B, T), 'blocked'); assert.equal(relOf(W[B], B, A, T), 'none', 'the friendship goes on both sides');
  const r = step(W, 'add', B, A);
  assert.equal(r.rel, 'out', 'to the blocked one it looks sent');
  assert.equal(relOf(W[A], A, B, T), 'blocked', 'it never reaches the blocker');
  assert.ok(!(W[A].in || {})[B]);
  assert.deepEqual(suggestions(W[A], A, T), [C], 'the blocked player is out of the suggestions');
  assert.equal(friendStep('add', A, B, W[A], W[B], T).why, 'blocked', 'you unblock before you add');
  step(W, 'unblock', A, B); assert.equal(relOf(W[A], A, B, T), 'none');
});

test('the caps: 100 friends, 20 out, 50 in; old requests age out after 30 days; never yourself', () => {
  const AL = 'abcdefghijkmnpqrstuvwxyz23456789';
  const many = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`px${AL[i >> 5]}${AL[i & 31]}aaaaaaaa`, T]));
  assert.equal(friendStep('add', A, B, { f: many(FR.max) }, {}, T).why, 'your_list_full');
  assert.equal(friendStep('add', A, B, { out: many(FR.outMax) }, {}, T).why, 'too_many_out');
  assert.equal(friendStep('add', A, B, {}, { in: many(FR.inMax) }, T).why, 'their_requests_full');
  assert.equal(friendStep('accept', A, B, { in: { [B]: T } }, { f: many(FR.max) }, T).why, 'their_list_full');
  assert.equal(friendStep('add', A, A, {}, {}, T).why, 'self');
  assert.equal(friendStep('add', A, 'nope', {}, {}, T).why, 'no_profile');
  const old = { out: { [B]: T - FR.pendingMs - 1 } };
  assert.equal(relOf(old, A, B, T), 'none'); assert.deepEqual(fresh(old, T).out, {});
  assert.equal(friendStep('add', A, C, { out: Object.fromEntries(Object.keys(many(FR.outMax)).map(p => [p, T - FR.pendingMs - 5])) }, {}, T).ok, true, 'aged-out requests free their slots');
});

test('RECENTLY PLAYED WITH: everyone gets the others, newest first, trimmed; YOUR TABLE picks ≤ 12 friends', () => {
  const up = recentPatch([A, B, C, A], {}, T);
  assert.equal(up[`${A}/rp/${B}`], T); assert.equal(up[`${C}/rp/${A}`], T); assert.equal(up[`${A}/rp/${A}`], undefined);
  assert.deepEqual(recentPatch([A], {}, T), {}, 'a solo match notes nobody');
  const big = { [A]: { rp: Object.fromEntries(Array.from({ length: FR.recentKeep }, (_, i) => [P(i + 5) + i, T - 1e6 - i])) } };
  const up2 = recentPatch([A, B], big, T);
  assert.equal(Object.values(up2).filter(v => v === null).length, 1, 'the oldest drops off');
  const F = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`pf${'abcdefghijkmnpqrstuvwxyz'[i]}aaaaaaaaa`, T - i * 1000]));
  const node = { f: F, rp: { [Object.keys(F)[19]]: T } };
  const t = tablePids(node, A, null, T);
  assert.equal(t.length, FR.tableN); assert.equal(t[0], Object.keys(F)[19], 'the one you played with last leads');
  assert.deepEqual(tablePids(node, A, [Object.keys(F)[3], C, Object.keys(F)[3]], T), [Object.keys(F)[3]], 'a pick keeps only friends, once');
});

test('a waiting invite lives while its room is open (the SAME room) and ~30 min', () => {
  const inv = { r: 'MOON', ca: 111, at: T, until: T + FR.inviteMs };
  assert.equal(inviteLive(inv, { createdAt: 111 }, T + 60e3), true);
  assert.equal(inviteLive(inv, null, T + 60e3), false, 'the room closed');
  assert.equal(inviteLive(inv, { createdAt: 222 }, T + 60e3), false, 'the hush word reused by a new room');
  assert.equal(inviteLive(inv, { createdAt: 111 }, T + FR.inviteMs + 1), false, 'expired');
});
