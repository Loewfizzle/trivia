// LOBBY FIXES (Nov 4 — the owner's real-phone test of the room): the PURE parts. docs/harbor/passes/lobby-fixes.md
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { overlaps, matchStep, OV_KEEP, dedupePids } from '../js/core/progress.js';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('ONE ACCOUNT, ONE ROOM: a match overlapping one counted in ANOTHER room is never credited; the same room + back-to-back are', () => {
  const A = [{ c: 'MINT', s: 1000, e: 5000 }];
  assert.equal(overlaps(A, { c: 'SODA', s: 2000, e: 6000 }), true, 'two rooms at once');
  assert.equal(overlaps(A, { c: 'SODA', s: 3000, e: 3000 }), true, 'a snapshot report (its end only) inside the other');
  assert.equal(overlaps(A, { c: 'SODA', s: 5000, e: 9000 }), false, 'back to back');
  assert.equal(overlaps(A, { c: 'MINT', s: 2000, e: 6000 }), false, 'the same room (a rematch) is never an overlap');
  assert.equal(overlaps(null, { c: 'SODA', s: 1, e: 2 }), false);
  assert.equal(overlaps(A, null), false, 'no window (an old caller): no check');
  // through the step: the window is kept (the last OV_KEEP), an overlap skips the whole match
  const row = { rank: 1, win: true, c: { p: 1, w: 1 } };
  const a = matchStep(null, { key: 'MINT_m1', gid: 'overclock', row, n: 2, now: 5000, ctx: { win: { c: 'MINT', s: 1000, e: 5000 } } });
  assert.deepEqual(a.next.ov, [{ c: 'MINT', s: 1000, e: 5000 }]);
  const b = matchStep(a.next, { key: 'SODA_m1', gid: 'overclock', row, n: 2, now: 99_000, ctx: { win: { c: 'SODA', s: 2000, e: 6000 } } });
  assert.equal(b.skip, 'overlap');
  let s = a.next;
  for (let i = 0; i < OV_KEEP + 3; i++) s = matchStep(s, { key: `MINT_x${i}`, gid: 'overclock', row, n: 2, now: 200_000 + i * 100_000, ctx: { win: { c: 'MINT', s: 150_000 + i * 100_000, e: 200_000 + i * 100_000 } } }).next;
  assert.equal(s.ov.length, OV_KEEP, 'a small list');
});

test('ONE PROFILE, ONE SEAT: two seats of one profile in a match keep only the WORSE row', () => {
  const rows = { u1: { rank: 1 }, u2: { rank: 3 }, u3: { rank: 2 } };
  const pids = dedupePids(rows, { u1: 'pA', u2: 'pA', u3: 'pB' });
  assert.deepEqual(pids, { u2: 'pA', u3: 'pB' });
});

test('ONE ACCOUNT, ONE ROOM: HOST, JOIN + a resume ask the seat first; leaving gives it back; the rules hold the seat', () => {
  const room = src('js/room.js');
  assert.ok(/createRoom = joining\(async profile => \{[\s\S]*?claimSeatFor\(null\)[\s\S]*?takeSeat\(code\)[\s\S]*?writePlayer/.test(room), 'HOST: the question, then the seat, then the player node');
  assert.ok(/joinRoom = joining\([\s\S]*?claimSeatFor\(code\)[\s\S]*?takeSeat\(code\)[\s\S]*?writePlayer/.test(room), 'JOIN: the same order');
  assert.ok(/resumeSaved[\s\S]*?seatConflict\(session\.code\)[\s\S]*?return 'moved'/.test(room), 'a resume never takes a seat another device holds');
  assert.ok(/watchSeat\(code/.test(room) && /freeSeat\(code\)/.test(room), 'watched while in the room; freed on the way out');
  const rules = JSON.parse(src('database.rules.json')).rules;
  assert.ok(rules.seats && rules.seats.$pid['.write'].includes("root.child('uids/' + auth.uid).val() === $pid"), 'seats/{pid}: the profile’s own devices');
  assert.ok(rules.rooms.$code.players.$uid.pid['.validate'].includes("seats/"), 'a player node with the pid needs the seat');
});

test('THE NEW GAME START: the FULL start (~5 s — the sign ignites, holds, the walk-in, the fade) and the QUICK one (a same-game rematch, ~3 s) — read from the match id on every phone', async () => {
  const { START, startKind, startShow, newMatchId } = await import('../js/core/room-show.js');
  assert.equal(startKind('qab12c'), 'quick'); assert.equal(startKind('ab12cd'), 'full'); assert.equal(startKind(null), 'full');
  let r = 0; const seq = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 400; i++) { const f = newMatchId(false, seq), q = newMatchId(true, seq); assert.ok(/^[a-z0-9]{6}$/.test(f) && f[0] !== 'q', f); assert.ok(/^q[a-z0-9]{5}$/.test(q), q); }
  const F = START.full, Q = START.quick;
  assert.ok(F.sign < F.walkAt && F.walkAt < F.fadeAt && F.fadeAt < F.len, 'the sign lights, THEN the walk-in under it, THEN the fade');
  assert.ok(F.fadeAt - F.sign >= 3000, 'the lit sign HOLDS long enough to read (≥ 3 s before the fade)');
  assert.ok(Q.sign === 0 && Q.walkAt < Q.fadeAt && Q.fadeAt < Q.len, 'the quick start: the sign lit at once, the walk-in, the fade');
  const meta = m => ({ status: 'playing', go: { at: 1000, m, g: 'overclock' } });
  assert.equal(startShow(meta('abc123'), { matchId: 'abc123' }, 1000 + 4999).on, true);
  assert.equal(startShow(meta('qbc123'), { matchId: 'qbc123' }, 1000 + 3000).on, false, 'the quick start is over at 3 s');
  // the old rules' fallback (game.go): the same kind from the same id
  assert.equal(startShow({ status: 'playing' }, { matchId: 'qbc123', go: 1000, id: 'overclock' }, 2000).kind, 'quick');
  const host = src('js/host.js');
  assert.ok(/newMatchId\(quick\)/.test(host) && /\{ quick: true \}\);/.test(host), 'host.js: a REMATCH starts quick, every other start full');
  const city = src('js/screens/room-city.js'), css = src('css/title.css');
  assert.ok(!/rc-pushing|getBoundingClientRect\(\); el\.style\.transformOrigin/.test(city) && !/rc-pushb|@keyframes rc-push/.test(css), 'no camera push any more');
  assert.ok(/tint: T\.NEON_PINK/.test(city) && /@keyframes rc-tube-on/.test(css), 'the game’s sign in the NEON pink, tube by tube');
});
