// THE HOUSEKEEPING + AUDIO PASS (Nov 25) — A START THAT DIES STILL SAYS SO (found by the cloud's harbor run on this pass's push: the audio
// job's `gameflows` B2, red; bisected to cf3d7271 — JAYWALK LAST MILE's THE REUSED START). host.js's `starting` used to be "the start's
// promise, or null"; LAST MILE made it THE LOCK (core/room-show.js#startLock — an object that is always there), and the dead-start cleanup
// still asked `|| starting ||`: always true, so a stamp whose host died never came down — every guest stayed under the veil, no message.
// The cleanup now asks the lock for THIS ROOM's start in flight. The browser proof: the harbor suite's `gameflows` group (B2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startLock, GO_ORPHAN_MS, goWaiting } from '../js/core/room-show.js';

const host = readFileSync(new URL('../js/host.js', import.meta.url), 'utf8');

test('the dead-start cleanup asks THE LOCK for this room\'s start in flight — never the lock object itself', () => {
  assert.match(host, /if \(age == null \|\| age < GO_ORPHAN_MS \|\| starting\.of\(state\.code\) \|\| clearedGo === go\.m \|\| !hostWriteOk\(\)\) return;/);
  assert.match(host, /const starting = startLock\(\);/);
  // `starting` is an object for the page's life: every use of it is a call on it
  const bare = host.split('\n').filter(l => /\bstarting\b/.test(l) && !/^\s*\/\//.test(l)).filter(l => /\bstarting\b(?!\.(of|hold|drop)\()/.test(l.replace(/const starting = startLock\(\);/, '').replace(/\/\/.*$/, '')));
  assert.deepEqual(bare, [], 'no bare `starting` left (a truthy object where a promise-or-null was meant)');
});

test('the lock: no start in flight for a room = null (the cleanup may run); a start in flight for THIS room holds it; another room\'s does not', async () => {
  const L = startLock((fn, ms) => setTimeout(fn, Math.min(ms, 5)));
  assert.equal(L.of('MOON'), null, 'nothing in flight: the cleanup runs');
  let done;
  const p = new Promise(r => { done = r; });
  L.hold('MOON', p, () => 5);
  assert.equal(L.of('MOON'), p, 'this room\'s start in flight: the cleanup waits');
  assert.equal(L.of('STAR'), null, 'another room\'s start never holds this room\'s cleanup');
  done(false);
  await p; await new Promise(r => setTimeout(r, 20));
  assert.equal(L.of('MOON'), null, 'the start came back false: nothing in flight — a dead stamp may come down');
  assert.equal(GO_ORPHAN_MS, 3000);
  assert.equal(typeof goWaiting, 'function');
});
