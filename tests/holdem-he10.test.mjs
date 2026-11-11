// HOLD'EM — HE10: THE FIX PASS (the Fable review's findings, docs/games/plan.md "HE10"). Each test names its finding. Pure (the engine + the
// dealer's core); the database half is tests/integration/holdem-server.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRecord, applyOp, advance, dueOf, holeOf, resultRows, PAUSE, DealerError, EV_KEEP, COUNTS, counts, cleanAt, CLEAN_AFTER_MS } from '../api/_lib/holdem-dealer.js';
import { legalActions, running, seatById, seatAt, preAction } from '../js/games/holdem/table.js';
import { createMatch, nextHand, act, leave, join, ledgerOf, chipCount } from '../js/games/holdem/match.js';
import { SHOT_MS, BANK_MS, CASH } from '../js/games/holdem/structure.js';
import { rngFrom } from '../js/core/rng.js';

const T0 = 1_800_000_000_000;
const ids = n => Array.from({ length: n }, (_, i) => `u${i + 1}`);
const start = (n = 3, opts = {}) => {
  const rng = rngFrom(opts.seed || 'he10');
  const rec = newRecord({ code: 'ABCD', uids: ids(n), mode: opts.mode || 'tournament', speed: opts.speed, now: T0, rng });
  advance(rec, T0, rng);
  return { rec, rng };
};
const op = (rec, o, uid, body, now, rng, extra = {}) => applyOp(rec, o, uid, { hand: rec.m.table.hand, seq: rec.seq, ...body }, { now, rng, ...extra });
const refused = (fn, code) => {
  try { fn(); } catch (e) { assert.ok(e instanceof DealerError, e.message); assert.equal(e.code, code, e.message); return e; }
  assert.fail(`expected ${code}`);
};

// ------------------------------------------------------------------------------------------------ A1 — THE TRUE CHECK
test('A1: the free toggle CHECK never calls — Fable\'s scenario: the big blind queues CHECK, UTG shoves, the small blind folds → the big blind is to act with every chip', () => {
  const { rec, rng } = start(3, { seed: 'pre1' });
  const t0 = rec.m.table, bb = seatAt(t0, t0.bbSeat), first = legalActions(t0);
  const stack0 = bb.stack;
  op(rec, 'pre', bb.id, { pre: 'check' }, T0 + 10, rng);
  assert.equal(holeOf(rec, bb.id).pre, 'check');
  op(rec, 'act', first.id, { action: 'allin' }, T0 + 500, rng);
  // the shove cancels it at once (the seat's private node says so — the toggle goes dark on the phone)
  assert.equal(rec.pre[bb.id], undefined, 'dropped the moment the bet came in');
  assert.equal(holeOf(rec, bb.id).pre, undefined);
  const L2 = legalActions(rec.m.table);
  if (L2 && L2.id !== bb.id) op(rec, 'act', L2.id, { action: 'fold' }, T0 + 900, rng);
  const x = seatById(rec.m.table, bb.id);
  assert.equal(x.stack, stack0, 'not a chip called');
  assert.equal(x.status, 'in');
  assert.equal(legalActions(rec.m.table).id, bb.id, 'their own decision');
});

test('A1: CHECK fires when the turn comes free · is refused while a bet is owed · CALL ANY still calls · CHECK / FOLD still folds to a bet', () => {
  // free: everyone limps / checks round to the big blind → the queued CHECK checks
  const { rec, rng } = start(3, { seed: 'pre2' });
  const t = rec.m.table, bb = seatAt(t, t.bbSeat);
  op(rec, 'pre', bb.id, { pre: 'check' }, T0 + 10, rng);
  for (let i = 0; i < 2; i++) { const L = legalActions(rec.m.table); if (L.id === bb.id) break; op(rec, 'act', L.id, { action: 'call' }, T0 + 100 + i, rng); }
  assert.equal(rec.m.table.street, 'flop', 'the big blind checked on its own → the flop');
  assert.ok(rec.ev.some(e => e.t === 'checked' && e.id === bb.id));
  // owed: refused
  const { rec: r2, rng: g2 } = start(3, { seed: 'pre3' });
  const sb = seatAt(r2.m.table, r2.m.table.sbSeat);
  refused(() => op(r2, 'pre', sb.id, { pre: 'check' }, T0 + 10, g2), 'illegal');
  // pure preAction: CALL ANY calls a bet; CHECK / FOLD folds it; CHECK cancels
  const L = legalActions(r2.m.table), id = L.id, pre = k => preAction(r2.m.table, id, { kind: k, hand: r2.m.table.hand, street: r2.m.table.street });
  assert.equal(pre('callany').action.type, 'call');
  assert.equal(pre('checkfold').action.type, 'fold');
  assert.ok(pre('check').cancel);
});

// ------------------------------------------------------------------------------------------------ A4 / A6 — THE BIGGEST CALL + no second `shown`
function bigAllIn(n, { stacks, callAny = false, seed }) {
  const { rec, rng } = start(n, { seed });
  // distinct stacks (the most side pots): set before any chip moves beyond the blinds — the count stays honest
  rec.m.table.seats.forEach((x, i) => { const add = stacks[i] - (x.stack + x.total); x.stack += add; rec.m.players[x.id].buyins += add; x.start = x.stack + x.total; });
  let now = T0 + 1, worst = 0, shownTwice = 0;
  const step = fn => { const a = rec.evn; fn(); worst = Math.max(worst, rec.evn - a); };
  const first = legalActions(rec.m.table).id;
  if (callAny) for (const x of rec.m.table.seats) if (x.id !== first) step(() => op(rec, 'pre', x.id, { pre: 'callany' }, now, rng));
  while (running(rec.m.table)) {
    const L = legalActions(rec.m.table);
    if (L) step(() => op(rec, 'act', L.id, { action: L.canRaise ? 'allin' : 'call' }, now += 50, rng));
    else step(() => advance(rec, now = Math.max(now + 1, dueOf(rec)), rng));
  }
  const seen = new Map();
  for (const e of rec.ev) if (e.t === 'shown' && e.hand === rec.m.table.hand) { if (seen.has(e.id)) shownTwice++; seen.set(e.id, true); }
  return { rec, worst, shownTwice };
}

test('A4: THE BIGGEST CALL fits the event feed — an 8-way all-in (every stack different: 7 pots, 7 KOs, the end) + a shove firing 7 queued CALL ANYs', () => {
  const stacks = [1500, 1300, 1100, 900, 700, 500, 300, 2000];
  let worst = 0;
  for (let s = 0; s < 40; s++) {
    const shuffled = stacks.map((v, i) => [v, (i * 7919 + s * 104729) % 97]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
    for (const callAny of [false, true]) {
      const r = bigAllIn(8, { stacks: shuffled, callAny, seed: `big${s}` });
      worst = Math.max(worst, r.worst);
      assert.equal(r.shownTwice, 0, 'A6: no hand shown twice');
      assert.ok(chipCount(r.rec.m).ok);
    }
  }
  console.log(`# A4: the biggest call = ${worst} events`);
  assert.ok(worst <= EV_KEEP, `the biggest call made ${worst} events — the feed keeps ${EV_KEEP}`);
});

test('A6: an all-in run-out turns each hand up ONCE (at the reveal) — the river\'s showdown adds no second `shown` for them', () => {
  const { rec, rng } = start(2, { seed: 'flip' });
  let now = T0 + 1;
  op(rec, 'act', legalActions(rec.m.table).id, { action: 'allin' }, now += 10, rng);
  op(rec, 'act', legalActions(rec.m.table).id, { action: 'call' }, now += 10, rng);
  const reveal = rec.ev.filter(e => e.t === 'shown').length;
  assert.equal(reveal, 2);
  const before = rec.evn;
  while (running(rec.m.table)) advance(rec, now = Math.max(now + 1, dueOf(rec)), rng);
  assert.equal(rec.ev.filter(e => e.t === 'shown' && e.n > before).length, 0);
  assert.ok(rec.ev.some(e => e.t === 'pot' && e.n > before));
});

// ------------------------------------------------------------------------------------------------ A13 — a bad speed
test('A13: start refuses any speed that isn\'t one of the three (prototype keys, arrays, numbers, empty)', () => {
  for (const sp of ['constructor', '__proto__', 'toString', 'hasOwnProperty', ['turbo'], 0, '', 'warp']) {
    refused(() => newRecord({ code: 'ABCD', uids: ['a', 'b'], mode: 'tournament', speed: sp, now: 1, rng: rngFrom('s') }), 'bad_speed');
  }
  for (const sp of ['turbo', 'standard', 'deep', undefined]) assert.ok(newRecord({ code: 'ABCD', uids: ['a', 'b'], mode: 'tournament', speed: sp, now: 1, rng: rngFrom('s') }).m.table.seats.every(x => x.stack > 0));
});

// ------------------------------------------------------------------------------------------------ A14 — a late tap
test('A14: a tap after the shot clock runs FIRST through the clock — inside the bank it lands and the bank is charged from the deadline; past it the clock already acted', () => {
  const { rec, rng } = start(3, { seed: 'late' });
  const t = rec.m.table, L = legalActions(t), dl = t.deadline;
  op(rec, 'act', L.id, { action: 'call' }, dl + 12_000, rng);
  const x = seatById(rec.m.table, L.id);
  assert.equal(x.bank, BANK_MS - 12_000, 'charged 12 s of the bank');
  assert.ok(rec.ev.some(e => e.t === 'timebank' && e.id === L.id));
  // past the bank: the clock folds them first, the tap is refused — but the caught-up table is kept (`advanced`)
  const { rec: r2, rng: g2 } = start(3, { seed: 'late2' });
  const L2 = legalActions(r2.m.table), dl2 = r2.m.table.deadline;
  const e = refused(() => op(r2, 'act', L2.id, { action: 'call' }, dl2 + BANK_MS + 1000, g2), 'illegal');
  assert.equal(e.advanced, true);
  assert.equal(seatById(r2.m.table, L2.id).status, 'folded');
  assert.equal(seatById(r2.m.table, L2.id).bank, 0);
  // in time: nothing to catch up — a refusal carries no `advanced`
  const { rec: r3, rng: g3 } = start(3, { seed: 'late3' });
  const L3 = legalActions(r3.m.table);
  const other = r3.m.table.seats.find(x => x.id !== L3.id).id;
  assert.ok(!refused(() => op(r3, 'act', other, { action: 'call' }, T0 + 100, g3), 'illegal').advanced);
  assert.ok(SHOT_MS > 0);
});

// ------------------------------------------------------------------------------------------------ A15 — a player who left
test('A15: a TOURNAMENT seat whose player left the room goes AWAY at once — on its turn it checks / folds now (no 20 s + 30 s wait); back undoes it', () => {
  const { rec, rng } = start(4, { seed: 'gone' });
  const L = legalActions(rec.m.table);
  advance(rec, T0 + 50, rng, { gone: { [L.id]: true } });
  const x = seatById(rec.m.table, L.id);
  assert.equal(x.away, true);
  assert.equal(x.status, 'folded', 'its turn: folded at once');
  assert.notEqual(legalActions(rec.m.table)?.id, L.id);
  assert.ok(rec.ev.some(e => e.t === 'away' && e.id === L.id && e.gone));
  // a kicked TOURNAMENT seat the same (CASH's kick still leaves the table)
  const { rec: r2, rng: g2 } = start(4, { seed: 'gone2' });
  const other = r2.m.table.seats.find(s => s.id !== legalActions(r2.m.table).id).id;
  advance(r2, T0 + 50, g2, { kicked: { [other]: true } });
  assert.equal(seatById(r2.m.table, other).away, true);
  // back in the room: their own BACK
  op(r2, 'back', other, {}, T0 + 100, g2);
  assert.equal(seatById(r2.m.table, other).away, false);
  // CASH: gone → AWAY (SAT OUT next hand), kicked → leaves
  const { rec: r3, rng: g3 } = start(3, { mode: 'cash', seed: 'gone3' });
  advance(r3, T0 + 50, g3, { gone: { u2: true }, kicked: { u3: true } });
  assert.equal(seatById(r3.m.table, 'u2').away, true);
  assert.ok(r3.m.players.u3.leaving || r3.m.players.u3.left);
});

// ------------------------------------------------------------------------------------------------ A16 — the clean-up moment
test('A16: once the result is sent the record has ONE more moment — its clean-up, CLEAN_AFTER_MS after the end', () => {
  const { rec, rng } = start(2, { seed: 'clean' });
  let now = T0 + 1;
  while (!rec.m.ended) {
    const L = legalActions(rec.m.table);
    if (L) op(rec, 'act', L.id, { action: L.canRaise ? 'allin' : 'call' }, now += 50, rng);
    else advance(rec, now = Math.max(now + 1, dueOf(rec)), rng);
  }
  assert.equal(dueOf(rec), 0);
  assert.equal(cleanAt(rec), null);
  rec.rep = 'short';
  assert.equal(cleanAt(rec), rec.m.endAt + CLEAN_AFTER_MS);
  assert.equal(dueOf(rec), cleanAt(rec));
});

// ------------------------------------------------------------------------------------------------ A7 — when a match counts
test('A7: a match COUNTS only after real play — CASH ≥ 10 hands AND ≥ 5 min, a TOURNAMENT ≥ 3 hands', () => {
  assert.deepEqual(COUNTS, { cash: { hands: 10, ms: 300_000 }, tournament: { hands: 3 } });
  const mk = (mode, hands, ms) => ({ mode, m: { hands, startAt: 0, endAt: ms } });
  assert.equal(counts(mk('cash', 9, 600_000)), false);
  assert.equal(counts(mk('cash', 40, 299_999)), false);
  assert.equal(counts(mk('cash', 10, 300_000)), true);
  assert.equal(counts(mk('tournament', 2, 1e9)), false);
  assert.equal(counts(mk('tournament', 3, 1000)), true);
  // Fable's farm: CASH start → one fold → END SESSION = nothing credited
  const { rec, rng } = start(2, { mode: 'cash', seed: 'farm' });
  op(rec, 'act', legalActions(rec.m.table).id, { action: 'fold' }, T0 + 300, rng);
  op(rec, 'endSession', 'u1', {}, T0 + 600, rng, { isHost: true });
  assert.ok(rec.m.ended);
  assert.equal(resultRows(rec), null);
});

// ------------------------------------------------------------------------------------------------ A18 — LEAVE → SIT BACK DOWN
test('A18: CASH — LEAVE then SIT BACK DOWN sits you down with the chips you LEFT WITH; left at zero = a fresh 1,000; THE LEDGER Σ net = 0', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b', 'c'], now: 0 });
  m.table.seats.find(x => x.id === 'a').stack = 1800; m.table.seats.find(x => x.id === 'b').stack = 200;   // (a won 800 from b)
  m = leave(m, 'a', 1).match;
  assert.equal(m.players.a.banked, 1800);
  m = join(m, 'a', 2).match;
  assert.equal(seatById(m.table, 'a').stack, 1800, 'back with what they left with');
  assert.equal(m.players.a.buyins, CASH.stack, 'no new buy-in');
  assert.equal(m.players.a.banked, 0);
  // left at zero → a fresh 1,000 (a buy-in)
  m.table.seats.find(x => x.id === 'b').stack = 0; m.table.seats.find(x => x.id === 'c').stack += 200;
  m = leave(m, 'b', 3).match;
  m = join(m, 'b', 4).match;
  assert.equal(seatById(m.table, 'b').stack, CASH.stack);
  assert.equal(m.players.b.buyins, 2 * CASH.stack);
  assert.ok(chipCount(m).ok);
  assert.equal(ledgerOf(m).reduce((n, r) => n + r.net, 0), 0);
  // and a hand still deals
  assert.ok(!nextHand(m, { rng: rngFrom('x'), now: 5 }).error);
  assert.ok(act);
});
