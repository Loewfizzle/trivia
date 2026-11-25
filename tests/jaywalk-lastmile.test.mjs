// JAYWALK — LAST MILE (Nov 24 2026 — docs/games/passes/jaywalk-lastmile.md): the reused start (host.js) · tier switches only at quiet moments ·
// the lighter match sync · the winter ground · the GO + visibility guards · the crouch on touch. The browser proofs: e2e-play-bounce `quick`,
// jaywalk-lab.mjs --smooth=tier, e2e-jaywalk-match.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const tick = () => new Promise(r => setTimeout(r, 0));

// ---- GROUP 0 — THE REUSED START
test('THE REUSED START: a start in flight is reused only for the SAME room code — never after the code changed or a leave', async () => {
  const { startLock } = await import('../js/core/room-show.js');
  const timers = [];
  const L = startLock((fn, ms) => timers.push({ fn, ms }));
  let done; const p1 = new Promise(r => { done = r; });
  assert.equal(L.of('ROOM'), null, 'nothing in flight');
  assert.equal(L.hold('ROOM', p1, () => 2000), p1);
  assert.equal(L.of('ROOM'), p1, 'a double tap in the same room: the SAME start (ONE START AT A TIME)');
  assert.equal(L.of('NEXT'), null, 'another room never gets it');
  done(true); await tick();
  assert.equal(timers.length, 1); assert.equal(timers[0].ms, 2000, 'held through the walk inside (the start kind\'s length)');
  assert.equal(L.of('ROOM'), p1, 'still the same start during the walk');
  assert.equal(L.of('NEXT'), null, 'THE BUG: play → leave → play inside the walk got the last room\'s `true`');
  // the room code moved (host.js#syncStallClock) → dropped, even for a later return to the same word
  L.drop('NEXT');
  assert.equal(L.of('ROOM'), null, 'a code change drops it');
  // a leave drops it outright (room.js#leaveRoom / exitRoom → the hook)
  const p2 = Promise.resolve(true); L.hold('ROOM', p2, () => 2000);
  L.drop();
  assert.equal(L.of('ROOM'), null, 'a leave drops it');
  // the old start's late timer never clears a NEWER start
  const p3 = new Promise(() => {}); L.hold('ROOM', p3, () => 2000);
  timers[0].fn();
  assert.equal(L.of('ROOM'), p3, 'an old start\'s timer leaves the new one alone');
  // a start that fails lets go at once (0 ms); one that throws too
  const t0 = timers.length; L.hold('R2', Promise.resolve(false), () => 2000); await tick();
  assert.equal(timers[timers.length - 1].ms, 0, 'a failed start: no hold');
  L.hold('R3', Promise.reject(new Error('x')), () => 2000).catch(() => {}); await tick();
  assert.equal(L.of('R3'), null, 'a thrown start lets go');
});

test('THE REUSED START: host.js keys the start by the room, room.js drops it at a leave, PLAY NOW checks the match is THIS room\'s', () => {
  const h = src('js/host.js'), r = src('js/room.js');
  assert.match(h, /const starting = startLock\(\);\nonRoomLeft\(\(\) => starting\.drop\(\)\);/);
  assert.doesNotMatch(h, /if \(starting\) return starting;/, 'the old reuse is gone');
  const sg = h.slice(h.indexOf('export function startGame('), h.indexOf('async function startGameNow('));
  assert.match(sg, /syncStallClock\(\);\n  const going = starting\.of\(state\.code\);\n  if \(going\) return going;/);
  assert.match(sg, /return starting\.hold\(state\.code, startGameNow\(/);
  const sync = h.slice(h.indexOf('function syncStallClock()'), h.indexOf('export const justWoke'));
  assert.match(sync, /starting\.drop\(state\.code\);/, 'next to the city pass\'s tickCode reset');
  const solo = h.slice(h.indexOf('async function playSoloNow('), h.indexOf('async function soloLeave()'));
  assert.match(solo, /const mine = \(\) => state\.code === room && !!state\.game && state\.game\.id === gameId && state\.game\.matchId !== was;/);
  assert.match(solo, /if \(ok && !mine\(\)\) ok = state\.code === room && await until\(mine, 1500\);/, 'a `true` with no game = the failed-start path (toast + leave)');
  // room.js: both the leave's start and every exit call the hook
  const leave = r.slice(r.indexOf('export async function leaveRoom('), r.indexOf('// (SHELL 2.0 B2 — the rules take a hand-off'));
  assert.match(leave, /leavingCode = code;\n  if \(roomLeft\) roomLeft\(\);/);
  const exit = r.slice(r.indexOf('export function exitRoom('), r.indexOf('export async function leaveRoom('));
  assert.match(exit, /if \(roomLeft\) roomLeft\(\);/);
});
