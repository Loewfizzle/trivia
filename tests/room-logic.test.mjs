import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCode, normalizeCode, hostGoneFor, shouldClaimHost, nextHost, pickColor, playerOrder, sanitizeName,
} from '../js/core/room-logic.js';
import { HOST_TIMEOUT_MS, HOST_CANDIDATE_STAGGER_MS, CODE_ALPHABET } from '../js/config.js';

test('room codes avoid confusing glyphs', () => {
  for (const ch of 'IO01') assert.ok(!CODE_ALPHABET.includes(ch));
  for (let i = 0; i < 500; i++) assert.match(generateCode(), /^[A-HJ-NP-Z]{4}$/);
  assert.equal(normalizeCode(' ab-cd '), 'ABCD');
  assert.equal(normalizeCode('abio'), null);
  assert.equal(normalizeCode('abc'), null);
});

const players = {
  host: { joinedAt: 1 },
  p2: { joinedAt: 2 },
  p3: { joinedAt: 3 },
  p4: { joinedAt: 4 },
};
const now = 100_000;

test('host that is online is never replaced', () => {
  const presence = { host: { online: true }, p2: { online: true } };
  const meta = { hostId: 'host', status: 'lobby' };
  assert.equal(hostGoneFor({ meta, players, presence, now }), 0);
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'p2' }), false);
});

test('offline host is replaced by first online player after the timeout', () => {
  const meta = { hostId: 'host', status: 'lobby' };
  const presence = { host: { online: false, lastSeen: now }, p2: { online: true }, p3: { online: true } };
  assert.equal(shouldClaimHost({ meta, players, presence, now: now + 5000, me: 'p2' }), false, 'too early');
  const later = now + HOST_TIMEOUT_MS;
  assert.equal(shouldClaimHost({ meta, players, presence, now: later, me: 'p2' }), true);
  assert.equal(shouldClaimHost({ meta, players, presence, now: later, me: 'p3' }), false, 'p3 waits its stagger');
  assert.equal(shouldClaimHost({ meta, players, presence, now: later + HOST_CANDIDATE_STAGGER_MS, me: 'p3' }), true);
});

test('offline candidates are skipped', () => {
  const meta = { hostId: 'host', status: 'lobby' };
  const presence = { host: { online: false, lastSeen: 0 }, p2: { online: false, lastSeen: 0 }, p3: { online: true } };
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'p3' }), true);
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'p2' }), false);
});

test('frozen host (locked phone, socket still up) is replaced during a game via heartbeat', () => {
  const presence = { host: { online: true }, p2: { online: true } };
  const meta = { hostId: 'host', status: 'playing', hostBeat: now - HOST_TIMEOUT_MS - 1 };
  assert.ok(hostGoneFor({ meta, players, presence, now }) > HOST_TIMEOUT_MS);
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'p2' }), true);
  // ...but in the lobby the heartbeat is ignored
  assert.equal(shouldClaimHost({ meta: { ...meta, status: 'lobby' }, players, presence, now, me: 'p2' }), false);
});

test('host that left the room is replaced immediately', () => {
  const { host, ...rest } = players;
  const meta = { hostId: 'host', status: 'playing' };
  const presence = { p2: { online: true }, p3: { online: true } };
  assert.equal(hostGoneFor({ meta, players: rest, presence, now }), Infinity);
  assert.equal(shouldClaimHost({ meta, players: rest, presence, now, me: 'p2' }), true);
});

test('host and non-members never claim', () => {
  const meta = { hostId: 'host', status: 'lobby' };
  const presence = { host: { online: false, lastSeen: 0 }, p2: { online: true } };
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'host' }), false);
  assert.equal(shouldClaimHost({ meta, players, presence, now, me: 'stranger' }), false);
});

test('nextHost prefers online players in join order', () => {
  const presence = { p2: { online: false }, p3: { online: true }, p4: { online: true } };
  assert.equal(nextHost({ players, presence, exclude: 'host' }), 'p3');
  assert.equal(nextHost({ players, presence: {}, exclude: 'host' }), 'p2');
  assert.equal(nextHost({ players: { host: {} }, presence: {}, exclude: 'host' }), null);
});

test('playerOrder is deterministic with ties', () => {
  assert.deepEqual(playerOrder({ b: { joinedAt: 5 }, a: { joinedAt: 5 }, c: { joinedAt: 1 } }), ['c', 'a', 'b']);
});

test('pickColor avoids taken colors', () => {
  const ps = { x: { color: 'cyan' }, y: { color: 'magenta' } };
  assert.equal(pickColor('cyan', ps, 'me'), 'yellow');
  assert.equal(pickColor('cyan', ps, 'x'), 'cyan', 'my own color is not taken from me');
  assert.equal(pickColor('green', ps, 'me'), 'green');
});

test('sanitizeName', () => {
  assert.equal(sanitizeName('  <b>Neo</b>   Anderson  ', 12), 'bNeo/b Ander');
  assert.equal(sanitizeName(''), '');
});
