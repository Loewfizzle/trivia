// HOLD'EM (HE2) — THE DEALER's PURE core (api/_lib/holdem-dealer.js): the record around HE1's engine, THE POKE's due times (the turn's
// deadline + the time bank, the step run-out's reveals, the pauses between hands), the server-side PRE-ACTIONS, stale taps refused, the
// public view + each seat's private view, the result rows. No database (the emulator suite is tests/integration/holdem-server.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRecord, applyOp, advance, dueOf, publicOf, holeOf, resultRows, PAUSE, DealerError, VOID_AFTER_MS } from '../api/_lib/holdem-dealer.js';
import { legalActions, running, seatById } from '../js/games/holdem/table.js';
import { SHOT_MS, BANK_MS } from '../js/games/holdem/structure.js';
import { rngFrom } from '../js/core/rng.js';

const T0 = 1_800_000_000_000;
const start = (n = 3, opts = {}) => {
  const rng = rngFrom(opts.seed || 'dealer');
  const rec = newRecord({ code: 'ABCD', uids: Array.from({ length: n }, (_, i) => `u${i + 1}`), mode: opts.mode || 'tournament', speed: opts.speed, now: T0, rng });
  advance(rec, T0, rng);
  return { rec, rng };
};
const turnOf = rec => legalActions(rec.m.table)?.id;
const op = (rec, o, uid, body, now, rng, extra = {}) => applyOp(rec, o, uid, { hand: rec.m.table.hand, seq: rec.seq, ...body }, { now, rng, ...extra });
const refused = (fn, code) => {
  try { fn(); } catch (e) { assert.ok(e instanceof DealerError, e.message); assert.equal(e.code, code, e.message); return e; }
  assert.fail(`expected ${code}`);
};
/** every string anywhere in a value */
const strings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); strings(x, out); }
  return out;
};
function assertNoLeak(rec) {
  const t = rec.m.table;
  const hidden = new Set([...t.seats.filter(x => !x.shown).flatMap(x => x.cards), ...t.deck]);
  const pub = publicOf(rec);
  for (const s of strings(pub)) assert.ok(!hidden.has(s), `the public view holds ${s}`);
  for (const x of t.seats) {
    const h = holeOf(rec, x.id);
    const others = new Set([...t.seats.filter(y => y.id !== x.id && !y.shown).flatMap(y => y.cards), ...t.deck]);
    for (const s of strings(h)) assert.ok(!others.has(s), `${x.id}'s private view holds ${s}`);
  }
}

test('START: seats in a random order, hand 1 dealt at once, the seq from the room\'s last + 1; bad modes refused', () => {
  const { rec } = start(4);
  assert.equal(rec.m.table.hand, 1);
  assert.ok(running(rec.m.table));
  assert.equal(rec.seq, 1);
  assert.match(rec.id, /^h[a-z0-9]{2,15}$/);
  assert.equal(dueOf(rec), T0 + SHOT_MS, 'the turn\'s deadline');
  const a = newRecord({ code: 'ABCD', uids: ['a', 'b', 'c', 'd', 'e'], now: T0, rng: rngFrom('o1'), prevSeq: 9 });
  const b = newRecord({ code: 'ABCD', uids: ['a', 'b', 'c', 'd', 'e'], now: T0, rng: rngFrom('o2') });
  assert.notDeepEqual(a.m.table.seats.map(x => x.id), b.m.table.seats.map(x => x.id), 'the server shuffles the seats');
  assert.equal(a.seq, 10);
  refused(() => newRecord({ code: 'ABCD', uids: ['a'], now: T0, rng: rngFrom('x') }), 'too_few');
  refused(() => newRecord({ code: 'ABCD', uids: 'abcdefghi'.split(''), now: T0, rng: rngFrom('x') }), 'too_many');
  refused(() => newRecord({ code: 'ABCD', uids: ['a', 'b'], mode: 'poker', now: T0, rng: rngFrom('x') }), 'bad_mode');
  refused(() => newRecord({ code: 'ABCD', uids: ['a', 'b'], speed: 'warp', now: T0, rng: rngFrom('x') }), 'bad_speed');
  assert.equal(newRecord({ code: 'ABCD', uids: ['a', 'b'], speed: 'deep', now: T0, rng: rngFrom('x') }).m.levelMs, 15 * 60_000);
});

test('ACT: only your own seat on your turn; a stale hand / seq or a repeat is refused with the current seq', () => {
  const { rec, rng } = start(3);
  const who = turnOf(rec), other = rec.m.table.seats.find(x => x.id !== who).id;
  refused(() => op(rec, 'act', other, { action: 'fold' }, T0 + 1, rng), 'illegal');
  const e = refused(() => op(rec, 'act', who, { action: 'call', seq: rec.seq - 1 }, T0 + 1, rng), 'stale');
  assert.equal(e.extra.seq, rec.seq);
  refused(() => op(rec, 'act', who, { action: 'call', hand: 7 }, T0 + 1, rng), 'stale');
  refused(() => op(rec, 'act', 'nobody', { action: 'call' }, T0 + 1, rng), 'not_seated');
  refused(() => op(rec, 'act', who, { action: 'dance' }, T0 + 1, rng), 'bad_action');
  refused(() => op(rec, 'act', who, { action: 'raise', amount: 21 }, T0 + 1, rng), 'illegal');
  const body = { hand: rec.m.table.hand, seq: rec.seq, action: 'call' };
  applyOp(rec, 'act', who, body, { now: T0 + 1, rng });
  rec.seq += 1;                                     // (the store moves seq when the public view changes)
  refused(() => applyOp(rec, 'act', who, body, { now: T0 + 2, rng }), 'stale');   // a double tap
});

test('THE CLOCK on pokes: nothing before the deadline; then the 30 s bank; then the fold — each due once', () => {
  const { rec, rng } = start(3);
  const who = turnOf(rec);
  assert.equal(advance(rec, T0 + SHOT_MS - 1, rng), false, 'not due: nothing changes');
  assert.equal(advance(rec, T0 + SHOT_MS, rng), true);
  assert.ok(rec.m.table.bankOn);
  assert.equal(dueOf(rec), T0 + SHOT_MS + BANK_MS);
  assert.equal(advance(rec, T0 + SHOT_MS + 5, rng), false, 'the same moment poked again: applied once');
  advance(rec, T0 + SHOT_MS + BANK_MS, rng);
  assert.equal(seatById(rec.m.table, who).status, 'folded');
  assert.equal(seatById(rec.m.table, who).bank, 0);
  assert.ok(rec.ev.some(e => e.t === 'timeout' && e.id === who));
});

test('PRE-ACTIONS live on the server: CALL ANY fires the moment the turn arrives (the phone asleep); a new street drops a toggle', () => {
  const { rec, rng } = start(3, { seed: 'pre' });
  const first = turnOf(rec);
  const later = rec.m.table.seats.find(x => x.id !== first && x.status === 'in').id;
  op(rec, 'pre', later, { pre: 'callany' }, T0 + 1, rng);
  assert.equal(holeOf(rec, later).pre, 'callany', 'the toggle in the seat\'s own private view');
  assert.equal(publicOf(rec).pre, undefined);
  op(rec, 'act', first, { action: 'raise', amount: 100 }, T0 + 2, rng);
  // the toggle fired for `later` when their turn came (unless someone between them is still to act)
  let guard = 0;
  while (turnOf(rec) !== later && turnOf(rec) && ++guard < 5) op(rec, 'act', turnOf(rec), { action: 'call' }, T0 + 3, rng);
  assert.ok(rec.ev.some(e => (e.t === 'called' || e.t === 'allin') && e.id === later), 'CALL ANY called the raise');
  assert.equal(rec.pre[later], undefined, 'used once');
  // CHECK/FOLD set, then the street changes before the turn → dropped
  const { rec: r2, rng: g2 } = start(3, { seed: 'pre2' });
  const a = turnOf(r2), c = r2.m.table.seats.find(x => x.id !== a && x.status === 'in').id;
  r2.pre[c] = { kind: 'checkfold', hand: r2.m.table.hand, street: 'turn' };   // (a toggle from another street)
  advance(r2, T0 + 1, g2);
  assert.equal(r2.pre[c], undefined, 'a toggle from another street never fires');
  refused(() => op(r2, 'pre', c, { pre: 'raiseall' }, T0 + 1, g2), 'bad_pre');
});

test('THE STEP RUN-OUT: hands face up, then a street per 1.5 s on pokes — the board never ahead of the clock, the deck never public', () => {
  const { rec, rng } = start(2, { seed: 'runout' });
  let now = T0 + 1;
  while (!rec.m.table.runout && running(rec.m.table)) { const L = legalActions(rec.m.table); op(rec, 'act', L.id, { action: L.canRaise ? 'allin' : 'call' }, now, rng); }
  assert.ok(rec.m.table.runout, 'a run-out');
  assert.equal(rec.m.table.board.length, 0);
  assert.ok(rec.m.table.seats.every(x => x.shown), 'the all-in hands are face up');
  assertNoLeak(rec);
  assert.equal(dueOf(rec), now + PAUSE.street);
  assert.equal(advance(rec, now + PAUSE.street - 1, rng), false);
  for (const want of [3, 4]) { now += PAUSE.street; advance(rec, now, rng); assert.equal(rec.m.table.board.length, want); assertNoLeak(rec); }
  now += PAUSE.street; advance(rec, now, rng);
  assert.equal(rec.m.table.board.length, 5);
  assert.ok(rec.m.ended || rec.m.table.street === 'done', 'the river settles the hand');
});

test('THE PAUSES: the next hand ~3 s after a fold-win, ~6 s after a showdown — never sooner', () => {
  const { rec, rng } = start(3, { seed: 'pause' });
  let now = T0 + 10;
  while (running(rec.m.table)) op(rec, 'act', turnOf(rec), { action: 'fold' }, now, rng);
  assert.equal(rec.m.table.result.byFold != null, true);
  assert.equal(dueOf(rec), now + PAUSE.fold);
  advance(rec, now + PAUSE.fold - 1, rng);
  assert.equal(rec.m.table.hand, 1, 'not yet');
  advance(rec, now + PAUSE.fold, rng);
  assert.equal(rec.m.table.hand, 2, 'dealt on the poke after the pause');
  // a showdown: check it down
  now += PAUSE.fold + 1;
  while (running(rec.m.table)) { const L = legalActions(rec.m.table); if (!L) { advance(rec, now += PAUSE.street, rng); continue; } op(rec, 'act', L.id, { action: L.canCheck ? 'check' : 'call' }, now, rng); }
  assert.equal(rec.m.table.result.byFold, null);
  assert.equal(dueOf(rec), rec.doneAt + PAUSE.showdown);
});

test('CASH via the dealer: sit (late join), AWAY → SAT OUT → back, rebuy, leave, END SESSION waits for the hand; the void only as a late fallback', () => {
  const { rec, rng } = start(3, { mode: 'cash', seed: 'cashd' });
  let now = T0 + 1;
  op(rec, 'sit', 'late', {}, now, rng);
  assert.equal(seatById(rec.m.table, 'late').status, 'sitout');
  refused(() => op(rec, 'endSession', 'u1', {}, now, rng, { isHost: false }), 'not_host');
  op(rec, 'endSession', 'u1', {}, now, rng, { isHost: true });
  assert.ok(rec.m.ending && !rec.m.ended, 'mid-hand: it waits for the hand');
  refused(() => op(rec, 'endSession', 'u1', { voidHand: true }, now + 1000, rng, { isHost: true }), 'too_soon');
  // play the hand out → the session closes, THE LEDGER sums to 0
  while (running(rec.m.table)) { const L = legalActions(rec.m.table); if (!L) { advance(rec, now += PAUSE.street, rng); continue; } op(rec, 'act', L.id, { action: 'fold' }, now += 100, rng); }
  assert.ok(rec.m.ended);
  assert.equal(rec.m.ledger.reduce((a, r) => a + r.net, 0), 0);
  const ex = resultRows(rec);
  assert.ok(ex.rows.u1 && !ex.rows.late, 'a player dealt no hand is not credited');
  // the void fallback after VOID_AFTER_MS
  const { rec: r2, rng: g2 } = start(2, { mode: 'cash', seed: 'void' });
  op(r2, 'endSession', 'u1', {}, T0 + 1, g2, { isHost: true });
  op(r2, 'endSession', 'u1', { voidHand: true }, T0 + 1 + VOID_AFTER_MS, g2, { isHost: true });
  assert.ok(r2.m.ended);
  assert.deepEqual(r2.m.ledger.map(x => x.net), [0, 0]);
  // a CASH seat whose player was kicked from the room leaves on the next poke
  const { rec: r3, rng: g3 } = start(3, { mode: 'cash', seed: 'kick' });
  advance(r3, T0 + 2, g3, { kicked: { u2: true } });
  assert.ok(r3.m.players.u2.leaving || r3.m.players.u2.left);
});

test('THE TOURNAMENT to the end on the dealer: places → result rows (1st = the win), the public view never leaks along the way', () => {
  const { rec, rng } = start(4, { seed: 'tour', speed: 'turbo' });
  let now = T0 + 1, guard = 0;
  while (!rec.m.ended && ++guard < 20000) {
    const L = legalActions(rec.m.table);
    if (L) op(rec, 'act', L.id, { action: L.canRaise && rng() < 0.4 ? 'allin' : L.canCheck ? 'check' : 'call' }, now += 500, rng);
    else { now = Math.max(now + 100, dueOf(rec) ?? now); advance(rec, now, rng); }
    assertNoLeak(rec);
  }
  assert.ok(rec.m.ended, 'a winner');
  const ex = resultRows(rec);
  assert.equal(Object.keys(ex.rows).length, 4);
  assert.equal(Object.values(ex.rows).filter(r => r.win).length, 1);
  assert.equal(ex.rows[rec.m.winner].rank, 1);
  assert.equal(ex.gid, 'holdem');
  assert.equal(dueOf(rec), 0, 'the result not yet sent → due now (a poke retries it)');
  rec.rep = 'done';
  assert.equal(dueOf(rec), null);
});
