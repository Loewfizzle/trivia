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

// ---- GROUP 2 — THE LIGHTER MATCH SYNC (core/room-logic.js#mirrorTree)
/** a DataSnapshot stand-in over plain JSON, with the SDK's `val()` (a list for dense integer keys) + a counter of how much `val()` built */
function snapOf(v, key = null, cost = { leaves: 0 }) {
  const isObj = v != null && typeof v === 'object';
  const keys = isObj ? Object.keys(v).sort((a, b) => (/^\d+$/.test(a) && /^\d+$/.test(b) ? a - b : a < b ? -1 : 1)) : [];
  const val = x => {
    if (x == null || typeof x !== 'object') { cost.leaves++; return x; }
    const ks = Object.keys(x), ints = ks.every(k => /^(0|[1-9]\d*)$/.test(k)), max = ints ? Math.max(...ks.map(Number)) : -1;
    if (ints && ks.length && max < 2 * ks.length) { const a = []; for (const k of ks) a[Number(k)] = val(x[k]); return a; }
    return Object.fromEntries(ks.map(k => [k, val(x[k])]));
  };
  return {
    key, exists: () => v != null, val: () => (v == null ? null : val(v)), size: keys.length, hasChildren: () => keys.length > 0,
    hasChild: k => isObj && v[k] != null, child: k => snapOf(isObj ? v[k] : null, k, cost),
    forEach: fn => { for (const k of keys) fn(snapOf(v[k], k, cost)); },
  };
}
test('THE LIGHTER MATCH SYNC: the mirror kept in place deep-equals `val()` after every event of a 4-player match — and builds a fraction of it', async () => {
  const { mirrorTree } = await import('../js/core/room-logic.js');
  const db = {}, cost = { leaves: 0 };
  let mirror, total = 0, built = 0, events = 0;
  const event = () => {
    events++;
    const before = cost.leaves; mirror = mirrorTree(snapOf(db, null, cost), mirror); built += cost.leaves - before;
    const full = snapOf(db).val() || {};
    assert.deepEqual(mirror, full, `event ${events}`);
    const c2 = { leaves: 0 }; snapOf(db, null, c2).val(); total += c2.leaves;
    return mirror;
  };
  assert.deepEqual(mirrorTree(snapOf(null), undefined), {}, 'no tree yet');
  const uids = ['alice', 'bob', 'carl', 'dee'];
  db.t0 = 1764000000000; event();                                   // the stamp: a plain leaf beside the players
  for (const u of uids) { db[u] = { go: 1764000001000 }; event(); db[u].cv = 2; event(); }
  const first = mirror;
  for (let i = 0; i < 60; i++) for (const u of uids) {               // 60 chunks each, one event a chunk
    (db[u].c ||= {})[i] = { s: `U${i.toString(36)}R${(i + 3).toString(36)}`, at: 1764000002000 + i * 120 + 7 };   // this phone's own: an estimated `at` first …
    event();
    if (u === 'alice') { db[u].c[i].at -= 7; event(); }              // … then the server's
  }
  assert.equal(mirror, first, 'the SAME object throughout (mirrored in place)');
  assert.ok(Array.isArray(mirror.alice.c) && mirror.alice.c.length === 60, 'chunks as the SDK gives them: a list');
  db.bob.e = { w: 'car', l: 31, t: 2400 }; db.bob.k = 'k1'; event();   // an end
  // the odd cases fall back to that player's whole list: a hole (a chunk refused behind a later one), a chunk taken back, a node gone
  db.carl.c[61] = { s: 'U1', at: 5 }; event();
  delete db.carl.c[61]; event();
  delete db.carl.c[59]; event();
  delete db.dee.cv; event();
  delete db.dee; event();
  delete db.t0; event();
  assert.ok(built < total / 6, `built ${built} values where rebuilding the whole tree each time builds ${total} (${(total / built).toFixed(0)}× less)`);
  // a snapshot without the walk (a fake database in a preview): the old way
  assert.deepEqual(mirrorTree({ exists: () => true, val: () => ({ a: 1 }) }, null), { a: 1 });
});

test('THE LIGHTER MATCH SYNC: only a cartridge\'s `liveTrees` are mirrored in place; the write side is untouched', () => {
  const r = src('js/room.js'), ix = src('js/games/jaywalk/index.js'), reg = src('js/games/registry.js'), tu = src('js/games/jaywalk/tuning.js');
  assert.match(ix, /export const liveTrees = \['runs'\];/);
  assert.match(reg, /export const liveTreesFor = game => \{ const mod = game && GAME_MODULES\[game\.id\]; return \(mod && mod\.liveTrees\) \|\| NO_TREES; \};/);
  assert.match(r, /const tree = trees\.includes\(name\);/);
  assert.match(r, /if \(tree && !\(T && T\.old\)\) \{ try \{ live\[name\] = mirrorTree\(s, live\[name\]\); \} catch \{ live\[name\] = s\.val\(\) \|\| \{\}; \} \}\n      else live\[name\] = s\.val\(\) \|\| \{\};/, 'every other path: `val()` as before');
  assert.match(tu, /flushMatchMs: 120\b/, 'flushMatchMs unchanged');
  assert.doesNotMatch(src('js/games/highrise/index.js'), /liveTrees/, 'HIGH RISE keeps the old mirror');
});

// ---- GROUP 5 — SMALL GUARDS
test('THE GO GUARD: a 2 s stamp + a 2.4 s start hold still adopt a PROVEN run; no GO is written once the run stopped waiting', async t => {
  const { goBehind } = await import('../js/games/kit/proof-writer.js');
  const GO_WAIT_MS = 4000;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const later = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
  /** the view's wiring around the helper (view.js#askGo): the no-answer timer from the ask, re-armed behind the gate */
  const ask = ({ stampMs, holdMs, writeMs, leaveAt = -1 }) => {
    const S = { mode: 'wait', gone: false, wrote: 0, adopted: null, unproven: '' };
    let goTimer = setTimeout(() => { if (!S.gone && S.mode === 'wait') { S.mode = 'run'; S.unproven = 'no answer'; } }, GO_WAIT_MS);
    if (leaveAt >= 0) setTimeout(() => { S.gone = true; }, leaveAt);
    goBehind({ stamp: () => later(stampMs), gate: () => later(holdMs), waiting: () => !S.gone && S.mode === 'wait',
      rearm() { clearTimeout(goTimer); goTimer = setTimeout(() => { if (!S.gone && S.mode === 'wait') { S.mode = 'run'; S.unproven = 'no answer'; } }, GO_WAIT_MS); },
      write: () => { S.wrote++; return later(writeMs); }, read: () => ({ val: () => 1764000000000 }) })
      .then(snap => { if (!snap || S.gone || S.mode !== 'wait') return; S.adopted = snap.val(); S.mode = 'run'; clearTimeout(goTimer); });
    return S;
  };
  const run = async ms => { for (let i = 0; i < ms; i += 50) { t.mock.timers.tick(50); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); } };
  // the slow start: the stamp answers after 2 s, the hold lasts 2.4 s, the GO's own round trip 1.8 s — 4.2 s after the tap, past the first 4 s timer
  const A = ask({ stampMs: 2000, holdMs: 2400, writeMs: 1800 });
  await run(2300); assert.equal(A.wrote, 0, 'the GO waits for the stamp AND the hold');
  await run(200); assert.equal(A.wrote, 1, 'the GO goes up behind both');
  await run(2500);
  assert.equal(A.adopted, 1764000000000, 'adopted — PROVEN'); assert.equal(A.unproven, '', 'never the no-answer line (the wait counts from the GO\'s own write)');
  // the player left while the hold was in the air: NO stray GO
  const B = ask({ stampMs: 2000, holdMs: 2400, writeMs: 100, leaveAt: 1000 });
  await run(6000); assert.equal(B.wrote, 0, 'no GO after the player left'); assert.equal(B.adopted, null);
  // the run went unproven meanwhile (a stamp that never answered inside the wait): no GO behind it either
  const C = ask({ stampMs: 4500, holdMs: 100, writeMs: 100 });
  await run(7000); assert.equal(C.unproven, 'no answer'); assert.equal(C.wrote, 0, 'no GO once mode !== wait');
  t.mock.timers.reset();
  const v = src('js/games/jaywalk/view.js');
  assert.match(v, /goBehind\(\{ stamp: \(\) => stampT0\(treePath\(\), 'jaywalk'\), gate: startGate, waiting: \(\) => !gone && m === matchId && mode === 'wait',/);
  assert.match(v, /if \(!snap \|\| gone \|\| m !== matchId \|\| mode !== 'wait'\) return;/);
});

test('THE VISIBILITY GUARD: done() re-shows only the emptiness it hid itself, and never once the owner set the visibility', async () => {
  const { emptyHide } = await import('../js/games/jaywalk/gl-upload.js');
  const m = { visible: true }; let hid = false;
  hid = emptyHide(m, 0, hid); assert.deepEqual([m.visible, hid], [false, true], 'empty: hidden, the hide remembered');
  hid = emptyHide(m, 3, hid); assert.deepEqual([m.visible, hid], [true, false], 'filled again: shown');
  // the owner hides it (the pack, until its quiet frame) — instances put meanwhile never show it
  hid = emptyHide(m, 0, hid); assert.equal(hid, true);
  hid = false; m.visible = false;                                    // kind().show(false): the owner's call resets `hid`
  hid = emptyHide(m, 5, hid); assert.deepEqual([m.visible, hid], [false, false], 'the owner\'s hide stays');
  hid = emptyHide(m, 0, hid); assert.deepEqual([m.visible, hid], [false, false], 'an empty frame of an owner-hidden kind is not "its own hide"');
  hid = emptyHide(m, 5, hid); assert.equal(m.visible, false);
  hid = false; m.visible = true;                                     // kind().show(true)
  hid = emptyHide(m, 0, hid); hid = emptyHide(m, 2, hid); assert.equal(m.visible, true, 'the usual cycle again');
  // someone showed the mesh directly after done() hid it, then hid it again: the stale flag is dropped the moment it is seen shown
  hid = emptyHide(m, 0, hid); assert.equal(hid, true);
  m.visible = true; hid = emptyHide(m, 4, hid); assert.equal(hid, false);
  m.visible = false; hid = emptyHide(m, 4, hid); assert.equal(m.visible, false, 'never re-shown on a stale flag');
  const n = src('js/games/jaywalk/night.js'), se = src('js/games/jaywalk/seasonal.js');
  assert.match(n, /show\(v\) \{ hid = false; m\.visible = !!v; \},/);
  assert.doesNotMatch(se, /KM\[k\]\.mesh\.visible = |KP\.mesh\.visible = /, 'the pack sets its kinds\' visibility through show()');
});

// ---- GROUP 6 — THE CROUCH ON TOUCH
test('THE CROUCH ON TOUCH: a press is on from the touch\'s start until it is spent (its hop fired, lifted, cancelled); visual only', async () => {
  const { pressCount, touchStory } = await import('../js/games/jaywalk/controls.js');
  const P = pressCount();
  assert.equal(P.down(1), 1); assert.equal(P.spent(1), 0, 'a tap: down → up');
  assert.equal(P.down(1), 1); assert.equal(P.down(2), 2); assert.equal(P.spent(2), 1, 'two fingers: the crouch holds while one is still armed'); assert.equal(P.spent(1), 0);
  assert.equal(P.spent(9), 0, 'an unknown touch (a cancel after the hop fired) changes nothing');
  // the hop still fires exactly as before: a tap on the release, a swipe at 18 px
  const T = touchStory(100, 100); assert.equal(T.move(104, 103), null); assert.equal(T.end(104, 103), 'u');
  const c = src('js/games/jaywalk/controls.js'), n = src('js/games/jaywalk/night.js'), v = src('js/games/jaywalk/view.js');
  assert.match(c, /const down = e => \{[^\n]*press\(P\.down\(e\.pointerId\)\);/, 'the crouch starts at pointerdown');
  assert.match(c, /const cancel = e => \{ touches\.delete\(e\.pointerId\); press\(P\.spent\(e\.pointerId\)\); \};/, 'a cancelled touch lets go');
  assert.match(c, /if \(d\) \{ press\(P\.spent\(e\.pointerId\)\); onHop\(d\); \}/, 'a swipe that fired its hop is spent');
  assert.match(n, /const want = pressOn && !reduce && run\.st === 'idle' && \(!o \|\| o\.own !== false\) \? 1 : 0;/, 'the player\'s own standing kid only; never with reduce motion');
  assert.match(n, /if \(crouch && run\.st !== 'hop'\) sy \*= 1 - CROUCH \* crouch;/, 'a scale on the drawn kid — the run, the log and the replay never see it');
  assert.doesNotMatch(src('js/games/jaywalk/engine.js') + src('js/games/jaywalk/replay.js'), /crouch|press/i);
  assert.match(v, /onPress: on => \{ if \(night\) night\.press\(/);
});

// ---- GROUP 3 — THE WINTER GROUND · GROUP 4 — SUN SHADOWS
test('THE WINTER GROUND: the sparkle is tier 2\'s; THE HASH TABLE is built + OFF (the same picture here — its speed is the iPhone\'s to judge)', () => {
  const fx = src('js/games/jaywalk/seasonal-fx.js'), se = src('js/games/jaywalk/seasonal.js'), n = src('js/games/jaywalk/night.js'), nf = src('js/games/jaywalk/night-fx.js');
  assert.match(fx, /if \(uQ > 1\.5\) \{   \/\/ \(the sparkle:/, 'the snow\'s sparkle: tier 2 only');
  assert.match(n, /ground\.uniforms\.uQ\.value = tier;/, 'uQ carries the tier (0 · 1 · 2)');
  assert.match(nf, /if \(uQ > 0\.5\) \{/, '… and the ground\'s own tier ≥ 1 check reads it as before');
  // the table: the SAME hash expression in the bake and in the ground, the snow's five noises through it only when JW_HT is defined
  const hash = 'fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453)';
  assert.ok(nf.includes(`float hash(vec2 p) { return ${hash}; }`) && fx.includes(`float hash(vec2 p) { return ${hash}; }`), 'one hash, to the letter');
  assert.match(fx, /#ifdef JW_HT\nuniform highp sampler2D uHashT;\nfloat hT\(vec2 i\) \{ return texelFetch\(uHashT, clamp\(ivec2\(i\) \+ ivec2\(128, 8\), ivec2\(0\), ivec2\(255\)\), 0\)\.r; \}/);
  assert.match(fx, /#else\n#define snoise vnoise\n#endif/, 'without the table: the sin path, to the letter');
  assert.equal([...fx.slice(fx.indexOf('vec3 snowOn('), fx.indexOf('// J4 — WET NEON STREETS')).matchAll(/snoise\(/g)].length, 5, 'the snow\'s five noises');
  assert.match(fx, /hash\(floor\(gl_FragCoord\.xy\) - vec2\(128\.0, 8\.0\)\)/, 'the bake\'s offset = the lookup\'s');
  assert.match(fx, /if \(!ok\) \{ rt\.dispose\(\); return null; \}/, 'no half-float target: the ground keeps its sin path');
  assert.match(se, /export const HASH_TABLE_LIVE = false;/);
  assert.match(se, /const HT_ON = HASH_TABLE_LIVE \|\| \(typeof location !== 'undefined' && \/\[\?&\]snowht=1\(\?:&\|\$\)\/\.test\(location\.search \|\| ''\)\);/);
  assert.match(se, /A\.ground\.setSea\(HT \? SEA_GLSL\.replace\('\/\/SEA\{', '\/\/SEA\{\\n#define JW_HT 1'\) : SEA_GLSL\);/);
  // the wet-road loop is untouched (wet roads are off)
  assert.match(fx, /float mot = vnoise\(vec2\(x \* 1\.6, ly \* 0\.9\)\) \* 0\.6 \+ 0\.4 \* vnoise\(vec2\(x \* 5\.0, ly \* 3\.0\)\);/);
});

test('SUN SHADOWS: nothing kept — the map is 1024 × 2048, drawn every frame (a 512 map moved ~1 % of pixels; a half-rate map lags a moving car)', () => {
  const n = src('js/games/jaywalk/night.js');
  assert.match(n, /const SUN_LAYER = 5, SUN_MAP = \[1024, 2048\], NO_DEPTH = \[36096\];/);
  assert.match(n, /if \(sunReal\) sunPass\(camY\); else if \(SHD && tier < 2\) sunFree\(\);/, 'every frame the sun is real');
});

test('QUIET TIERS: flush(now) makes the waiting step at a quiet moment shorter than a frame (a new run\'s start line — the view\'s reset, the lab\'s restart)', async () => {
  const { createTiers } = await import('../js/games/kit/tiers.js');
  const applied = [];
  const T = createTiers({ apply: t => applied.push(t), initial: 2, quiet: () => false });
  T.flush(10); assert.deepEqual(applied, [], 'nothing waits: nothing happens');
  T.ask(1); assert.equal(T.pending(), 1);
  T.flush(20); assert.deepEqual(applied, [1]); assert.equal(T.pending(), -1); assert.equal(T.get(), 1);
  assert.match(src('js/games/jaywalk/view.js'), /if \(tiers && !pinned\) tiers\.flush\(performance\.now\(\)\);/);
  assert.match(src('js/games/jaywalk/lab.js'), /if \(pin == null && QUIET_TIERS\) tiers\.flush\(performance\.now\(\)\);/);
});
