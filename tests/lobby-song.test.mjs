// THE SONG DOESN'T CHANGE when entering a lobby (js/core/lobby-song.js, audio/lobby-music.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { rideDecision, seedQueue, RIDE_TOLERANCE_S } from '../js/core/lobby-song.js';
import { songStarts, XF_MS } from '../js/core/playlist.js';

const NOW = 1_800_000_000_000;

test('the host: the new room starts with the song already playing, at its place (no change, no restart)', () => {
  const np = { id: 'late3', at: 83.4, dur: 214.2 };
  const lm = seedQueue(np, NOW, 'late');
  assert.deepEqual(lm.songs, ['late3'], 'the same song');
  assert.equal(lm.sd[0], 214200, 'its real length');
  assert.equal(lm.t0, Math.round(NOW - 83400), 't0 = now − position');
  assert.equal(lm.bag.mood, 'late');
  // a moment later in the lobby, this phone is still on it at the right place → it keeps playing its own copy
  for (const later of [0, 1000, 30_000, 120_000]) {
    const d = rideDecision({ id: 'late3', at: 83.4 + later / 1000 }, lm, NOW + later);
    assert.ok(d.riding && d.cur === 0, `riding ${later / 1000}s in`);
    assert.ok(Math.abs(d.expected - (83.4 + later / 1000)) < 0.01, 'position continuous');
  }
});

test('the handover at the next song: the synced player takes it, crossfading on the server clock', () => {
  const lm = { ...seedQueue({ id: 'late3', at: 100, dur: 200 }, NOW, 'late'), songs: ['late3', 'late5'], sd: [200_000, 180_000] };
  const starts = songStarts({ songStartAt: lm.t0, songs: lm.songs, sd: lm.sd });
  const before = rideDecision({ id: 'late3', at: (starts[1] - 500 - lm.t0) / 1000 }, lm, starts[1] - 500);
  assert.ok(before.riding && before.cur === 0, 'still its own copy just before the next song');
  const after = rideDecision({ id: 'late3', at: (starts[1] + 100 - lm.t0) / 1000 }, lm, starts[1] + 100);
  assert.ok(!after.riding && after.cur === 1 && after.expected < XF_MS / 1000, 'the next song is the room’s (its crossfade window)');
});

test('a joiner on another song crossfades into the room’s song at the right place', () => {
  const lm = seedQueue({ id: 'day2', at: 40, dur: 190 }, NOW, 'day');
  const d = rideDecision({ id: 'day7', at: 12 }, lm, NOW + 15_000);
  assert.ok(!d.riding, 'a different song: the room’s song takes over');
  assert.ok(Math.abs(d.expected - 55) < 0.01, `at the room’s place (${d.expected}s)`);
  // music off / CLASSIC / not yet unlocked: nothing to ride
  assert.ok(!rideDecision(null, lm, NOW + 1000).riding);
});

test('a joiner already on the same song at the same place keeps playing (no restart); far off → the room’s place wins', () => {
  const lm = seedQueue({ id: 'eve1', at: 60, dur: 230 }, NOW, 'evening');
  assert.ok(rideDecision({ id: 'eve1', at: 61.2 }, lm, NOW + 1000).riding, 'within the tolerance');
  assert.ok(rideDecision({ id: 'eve1', at: 61 + RIDE_TOLERANCE_S - 0.1 }, lm, NOW + 1000).riding);
  assert.ok(!rideDecision({ id: 'eve1', at: 20 }, lm, NOW + 1000).riding, 'the same song but far from the room’s place');
});

test('a mood change still waits for the song: the seeded queue holds only the current song; the next comes from the room bag', () => {
  const lm = seedQueue({ id: 'eve1', at: 60, dur: 230 }, NOW, 'evening');
  assert.equal(lm.songs.length, 1, 'nothing queued after it yet (the host appends ~40 s before it ends, from its mood then)');
  assert.deepEqual(lm.bag.left, [], 'the room bag starts fresh');
});

test('the fallback: nothing playing, or nearly over → no seed (the room picks its song as before)', () => {
  assert.equal(seedQueue(null, NOW, 'day'), null);
  assert.equal(seedQueue({ id: 'day2', at: 186, dur: 190 }, NOW, 'day'), null, 'within 5 s of its end');
  assert.equal(seedQueue({ id: 'day2', at: 10, dur: 0 }, NOW, 'day'), null, 'no length known');
  assert.equal(seedQueue({ id: 'day2', at: 10, dur: 0 }, NOW, 'day', () => 200).sd[0], 200_000, 'the song list’s length as a fallback');
  assert.ok(!rideDecision({ id: 'x', at: 1 }, null, NOW).riding);
});
