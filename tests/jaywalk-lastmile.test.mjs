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

// ---- GROUP 1 — TIER SWITCHES ONLY AT QUIET MOMENTS (kit/tiers.js `quiet`)
test('QUIET TIERS: a step the rule decides in play WAITS (nothing applied, the rule rests) and is made at the next quiet moment', async () => {
  const { createTiers } = await import('../js/games/kit/tiers.js');
  const applied = []; let quiet = false, now = 1000;
  const T = createTiers({ apply: t => applied.push(t), initial: 2, quiet: () => quiet });
  const feed = (n, ms, work = 14) => { for (let i = 0; i < n; i++) { now += ms; T.sample(now, work); T.tick(now); } };
  feed(1, 16.7);                       // (the first tick in play after the start's quiet state — none yet: straight in)
  feed(140, 24);                       // slow frames: p75 > 19.5 → the rule decides a step down
  assert.deepEqual(applied, [], 'nothing applied mid-run');
  assert.equal(T.get(), 2); assert.equal(T.pending(), 1, 'the step waits');
  feed(400, 30);                       // still slow: the rule RESTS — one decision at a time, never 2 → 0 behind the player's back
  assert.deepEqual(applied, []); assert.equal(T.pending(), 1);
  quiet = true; feed(1, 16.7);         // the run's end / the start line: the game still ticks
  assert.deepEqual(applied, [1], 'made at the quiet moment'); assert.equal(T.get(), 1); assert.equal(T.pending(), -1);
  // a still screen is never judged: loading hitches there decide nothing, and its samples are dropped when play resumes
  feed(300, 60);
  assert.deepEqual(applied, [1]); assert.equal(T.pending(), -1);
  quiet = false; feed(1, 16.7);
  assert.equal(T.fps().length, 0, 'the still screen\'s samples are gone at the first frame of play');
  feed(60, 16.7, 3);
  assert.deepEqual(applied, [1], 'smooth play right after: no step');
});

test('QUIET TIERS: ask(t) goes through the same queue; set(t) (a pin) is at once; without `quiet` the rule is the old one', async () => {
  const { createTiers } = await import('../js/games/kit/tiers.js');
  const applied = []; let quiet = false, now = 0;
  const T = createTiers({ apply: t => applied.push(t), initial: 2, quiet: () => quiet });
  T.ask(0);
  assert.deepEqual(applied, []); assert.equal(T.pending(), 0); assert.equal(T.get(), 2);
  T.set(1);
  assert.deepEqual(applied, [1], 'a pin is at once'); assert.equal(T.pending(), -1, '… and drops what waited');
  T.ask(2); now += 16; T.sample(now, 3); T.tick(now);
  assert.deepEqual(applied, [1], 'still in play');
  quiet = true; now += 16; T.tick(now);
  assert.deepEqual(applied, [1, 2]);
  T.ask(0);
  assert.deepEqual(applied, [1, 2, 0], 'asked on a quiet screen: at once');
  // no `quiet`: step for step the old rule — the step is applied in the tick that decides it (HIGH RISE + HOLD'EM never opt in)
  const A = []; const O = createTiers({ apply: t => A.push(t), initial: 2 }); let n2 = 1000;
  for (let i = 0; i < 140; i++) { n2 += 24; O.sample(n2, 14); O.tick(n2); }
  assert.deepEqual(A, [1]); assert.equal(O.pending(), -1);
  O.ask(0); assert.deepEqual(A, [1, 0]);
  const hr = src('js/games/highrise/view.js') + src('js/games/holdem/view.js');
  assert.doesNotMatch(hr, /createTiers\(\{[^}]*quiet:/, 'only JAYWALK opts in');
});

test('QUIET TIERS: JAYWALK\'s view + lab opt in, tick on the final screen too; tier 2\'s programs stay warm (the glow parked, the sun\'s material kept)', () => {
  const v = src('js/games/jaywalk/view.js'), l = src('js/games/jaywalk/lab.js'), n = src('js/games/jaywalk/night.js');
  assert.match(v, /stutter: true, quiet: \(\) => quietNow \}\);/);
  assert.match(v, /quietNow = mode !== 'run' \|\| isOver\(run\) \|\| !c \|\| c\.t < 0 \|\| !!final \|\| !!localEnd;\n    if \(!final && !localEnd\) tiers\.sample\(now, performance\.now\(\) - t0\);\n    if \(!pinned\) tiers\.tick\(now\);/, 'the start line, a match\'s count, a run\'s end, the final screen');
  assert.match(l, /quiet: QUIET_TIERS \? \(\) => !started \|\| isOver\(run\) : null \}\);/);
  // the glow: ONE object, parked — never disposed before the scene goes; the warm-up draws through it at any tier
  assert.equal([...n.matchAll(/createBloom\(renderer\)/g)].length, 2, 'made at tier 2 or at the warm-up, once');
  assert.match(n, /const bloomWarm = \(\) => \{ if \(!bloomKeep\) bloomKeep = createBloom\(renderer\); \(bloom \|\| bloomKeep\)\.render\(scene, cam\); \};/);
  assert.doesNotMatch(n, /bloom\.dispose\(\)/, 'only bloomKeep is ever disposed (destroy)');
  assert.match(n, /if \(warmStage === 1\) \{ renderer\.render\(scene, cam\); sunWarm\(\); \}\n      else if \(warmStage === 2\) bloomWarm\(\);/);
  assert.match(n, /function sunFree\(\) \{ if \(!SHD\) return; SHD\.rt\.dispose\(\); SHD = null;/, 'the sun map goes, its material + program stay');
  assert.match(n, /sunFree\(\); SUN_MAT\.dispose\(\); if \(sunWarmRT\) sunWarmRT\.dispose\(\);/);
  assert.match(n, /const DPR_AT = \[1\.5, 2, 3\];/, 'DPR_AT unchanged (the owner\'s decision)');
});
