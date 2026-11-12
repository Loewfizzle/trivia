// HOLD'EM — HE11: FR7-B's HOLD'EM leftovers (docs/games/review-7b.md "## HOLD'EM" → its NICE lines; docs/holdem.md "HE11"). Each test names
// its line. Pure (the engine + the dealer's core + the phone's pure side); the database half is tests/integration/holdem-server.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTable, startHand, legalActions, apply, seatAt, newSeat, seatById } from '../js/games/holdem/table.js';
import { newRecord, advance, applyOp, watchOf } from '../api/_lib/holdem-dealer.js';
import { pokeIn, hostPoke, GUEST_POKE_MS, seatTag, backOffered } from '../js/games/holdem/logic.js';
import { rngFrom } from '../js/core/rng.js';

const T0 = 1_800_000_000_000;

// ------------------------------------------------------------------------------------------------ 1 — the short big blind
test('HE11-1: a big blind all in for LESS than the small blind — the small blind is covered: CHECK, never a forfeiting FOLD', () => {
  const seats = [newSeat({ id: 'a', seat: 0, stack: 2000 }), newSeat({ id: 'b', seat: 1, stack: 40 })];
  const { state: t, events } = startHand(createTable({ seats, sb: 100, bb: 200 }), { rng: () => 0.01, now: T0 });
  const posted = events.filter(e => e.t === 'posted');
  assert.deepEqual(posted.map(e => [e.id, e.amount, e.allin]), [['a', 100, false], ['b', 40, true]], 'the button posts 100, the big blind only 40 (all in)');
  // (before HE11 the bet stayed the nominal 200: the small blind was asked to put in 100 more — and a FOLD / the clock / AWAY handed the
  //  pot to the 40-chip big blind: Fable's repro "byFold bb". Now the small blind covers it, nobody can act: the hand runs to a showdown)
  assert.equal(legalActions(t), null, 'nobody is asked to act');
  assert.equal(t.street, 'done');
  assert.ok(t.result && !t.result.byFold, 'a SHOWDOWN, never a fold-win');
  assert.equal(t.result.total, 80, 'the pot = 40 + 40 (the other 60 of the small blind back to it)');
  assert.equal(t.seats.reduce((n, x) => n + x.stack, 0), 2040, 'chips conserved');
});

test('HE11-1: three seats, a big blind short of the small blind — HE1’s FULL big blind rule stands while another seat can act; once the small blind is alone against the all in, it is never asked to act', () => {
  const seats = [newSeat({ id: 'a', seat: 0, stack: 2000 }), newSeat({ id: 'b', seat: 1, stack: 2000 }), newSeat({ id: 'c', seat: 2, stack: 40 })];
  const { state: t } = startHand(createTable({ seats, sb: 100, bb: 200 }), { rng: () => 0.01, now: T0 });   // (the button = a; b small blind; c big blind for 40)
  assert.equal(seatAt(t, t.bbSeat).bet, 40);
  const L = legalActions(t);
  assert.equal(L.id, 'a');
  assert.equal(L.callAmount, 200, 'UTG still calls the full big blind (HE1)');
  // a folds → the small blind (100 in) is the only seat that can act, against a 40 all in: the hand runs out — no FOLD offered
  const r1 = apply(t, { id: 'a', type: 'fold' }, T0 + 10);
  assert.equal(legalActions(r1.state), null, 'nobody is asked to act');
  assert.ok(r1.state.result && !r1.state.result.byFold, 'a showdown between the small + the big blind');
  assert.equal(r1.state.seats.reduce((n, x) => n + x.stack, 0), 4040, 'chips conserved');
});

test('HE11-1: full blinds — unchanged (the bet = the big blind)', () => {
  const seats = [newSeat({ id: 'a', seat: 0, stack: 2000 }), newSeat({ id: 'b', seat: 1, stack: 2000 }), newSeat({ id: 'c', seat: 2, stack: 2000 })];
  const { state: t } = startHand(createTable({ seats, sb: 100, bb: 200 }), { rng: () => 0.01, now: T0 });
  assert.equal(t.bet, 200);
  const L = legalActions(t);
  assert.equal(L.callAmount, 200);
  assert.equal(L.minTo, 400);
});

// ------------------------------------------------------------------------------------------------ 2 — AWAY on the very next poke (the dealer's half)
test('HE11-2: THE WATCH LIST — the seats a leave / a kick would still change (the cheap poke reads it beside the room players)', () => {
  const rng = rngFrom('he11-2');
  const rec = newRecord({ code: 'ABCD', uids: ['u1', 'u2', 'u3'], mode: 'tournament', speed: 'turbo', now: T0, rng });
  advance(rec, T0, rng);
  assert.deepEqual(watchOf(rec).sort(), ['u1', 'u2', 'u3']);
  // u2 leaves the room → the full path puts them AWAY → off the list (nothing more a leave could change in a TOURNAMENT)
  applyOp(rec, 'poke', 'u1', {}, { now: T0 + 5, rng, gone: { u2: true } });
  assert.ok(seatById(rec.m.table, 'u2').away);
  assert.deepEqual(watchOf(rec).sort(), ['u1', 'u3']);
  // CASH: an AWAY (SAT OUT) seat stays watched — a kick there means it LEAVES
  const cash = newRecord({ code: 'ABCD', uids: ['u1', 'u2', 'u3'], mode: 'cash', now: T0, rng });
  advance(cash, T0, rng);
  applyOp(cash, 'poke', 'u1', {}, { now: T0 + 5, rng, gone: { u2: true } });
  assert.ok(watchOf(cash).includes('u2'));
});

// ------------------------------------------------------------------------------------------------ 3 — one poke at a match's end
test('HE11-3: due 0 (a result still to send) — the HOST pokes at once, a guest only 2–3 s later (never every phone at once)', () => {
  const now = T0 + 123_456;
  assert.equal(pokeIn({ due: 0, now, host: true }), 0);
  assert.equal(pokeIn({ due: 0, now, host: false, jitter: 400 }), GUEST_POKE_MS + 400);
  assert.equal(pokeIn({ due: 0, now, host: false, jitter: 5000 }), GUEST_POKE_MS + 1000, 'the jitter capped at 1 s');
  assert.equal(hostPoke({ pub: { seq: 9, due: 0 }, now }).poke, true, 'the room tick of the host pokes it too');
  // a normal due — unchanged
  assert.equal(pokeIn({ due: now + 500, now, host: true }), 600);
  assert.equal(pokeIn({ due: now - 100, now, host: false, jitter: 0 }), GUEST_POKE_MS - 100);
});

// ------------------------------------------------------------------------------------------------ 5 — no SAT OUT flash; SIT BACK IN only when it works
test('HE11-5: a seat waiting for its FIRST deal shows no SAT OUT + offers no I’M BACK; an AWAY seat gets both — and the dealer accepts exactly those', () => {
  const fresh = newSeat({ id: 'a', seat: 0, stack: 1000 });   // (every seat before hand 1 — and a CASH seat taken mid-hand)
  assert.equal(fresh.status, 'sitout');
  assert.equal(seatTag(fresh, {}, false), '', 'no SAT OUT before the first deal');
  assert.equal(backOffered(fresh, {}), false, 'nothing to tap');
  const t0 = createTable({ seats: [fresh, newSeat({ id: 'b', seat: 1, stack: 1000 })], sb: 5, bb: 10, awaySitsOut: true });
  assert.ok(apply(t0, { type: 'back', id: 'a' }, T0).error, 'the dealer refuses a back for a seat that is not away (the old silent 409)');
  // a CASH seat that went AWAY → SAT OUT at the next deal: the tag + SIT BACK IN, and the dealer takes it
  const away = { ...fresh, away: true };
  assert.equal(seatTag(away, {}, true), 'SAT OUT');
  assert.equal(seatTag({ ...away, status: 'in' }, {}, true), 'AWAY', 'a TOURNAMENT seat away is still dealt in: AWAY');
  assert.ok(backOffered(away, {}));
  assert.equal(backOffered(away, { left: true }), false, 'a player who left gets SIT BACK DOWN instead');
  const t1 = createTable({ seats: [fresh, newSeat({ id: 'b', seat: 1, stack: 1000 })], sb: 5, bb: 10, awaySitsOut: true });
  seatById(t1, 'a').away = true;
  assert.ok(backOffered(seatById(t1, 'a'), {}));
  assert.ok(!apply(t1, { type: 'back', id: 'a' }, T0).error, 'the dealer accepts it');
  // the others unchanged
  assert.equal(seatTag({ status: 'out' }, {}, true), 'OUT');
  assert.equal(seatTag({ status: 'in' }, { left: true }, true), 'LEFT');
  assert.equal(seatTag({ status: 'allin' }, {}, true), 'ALL IN');
  assert.equal(seatTag({ status: 'folded' }, {}, true), 'FOLD');
  assert.equal(seatTag({ status: 'folded' }, {}, false), '');
});

// ------------------------------------------------------------------------------------------------ 6 — 9 in the room
test('HE11-6: the host is told when the table seats 8 of more (the server seats the first 8 — holdem-server.test.mjs)', async () => {
  const { watchersLine } = await import('../js/games/holdem/logic.js');
  assert.equal(watchersLine(8), null);
  assert.equal(watchersLine(2), null);
  assert.equal(watchersLine(9), 'Hold’em seats 8 — 1 will watch');
  assert.equal(watchersLine(11), 'Hold’em seats 8 — 3 will watch');
});

// ------------------------------------------------------------------------------------------------ 7 — the SE at an 8-player showdown
test('HE11-7: the SE (375 × 667, with or without a status bar) at 8 players — two side seats keep ROW_AIR between their blocks (a showdown tag sat 1–2 pt off the next seat)', async () => {
  const { tableLayout, blocks, overlaps, ROW_AIR } = await import('../js/games/holdem/layout.js');
  for (const [w, h, top, bottom] of [[375, 667, 20, 0], [375, 667, 0, 0], [375, 812, 47, 34], [393, 852, 59, 34]]) {
    const L = tableLayout({ w, h, top, bottom, k: 7 }), B = blocks(L);
    assert.ok(L.ss >= 0.74, `${w}×${h}: the seats never below 0.74 (${L.ss.toFixed(3)})`);
    const side = L.seats.map((q, i) => [q, B.seats[i]]).filter(([q]) => q.side !== 'top');
    for (const [qa, A] of side) for (const [qc, C] of side) {
      if (qa === qc || qa.side !== qc.side) continue;
      assert.ok(!overlaps(A.main, C.main, ROW_AIR - 1e-6), `${w}×${h} (${top}/${bottom}): two ${qa.side} seats ≥ ${ROW_AIR} pt apart`);
    }
  }
});
