// APP FIXES — Group 3: THE SEAL (games/kit/seal.js), CIPHER's re-grade (Grok 4.6), GRIDLOCK's relocate check (Grok 4.3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { sealGate, mergeSealed, unsealed } from '../js/games/kit/seal.js';
import { regradeBoards, encodeWord, secretKey, computeRoundResults } from '../js/games/cipher/logic.js';
import { legalRelocate } from '../js/games/gridlock/abilities.js';
import { canPlace } from '../js/games/gridlock/logic.js';

test('THE SEAL: leaving the phase before the envelopes are read becomes PENCILS DOWN; then the real step goes through', () => {
  const game = { phase: 'write', rk: '2', round: 2 };
  const leave = { phase: 'vote', phaseStartAt: 1 };
  assert.deepEqual(sealGate(game, leave, { node: 'lies', key: '2', phase: 'write' }), { 'unseal/lies': '2' });
  const after = { ...game, unseal: { lies: '2' } };
  assert.equal(sealGate(after, leave, { node: 'lies', key: '2', phase: 'write' }), leave, 'unsealed: the director\'s own patch');
  assert.equal(sealGate(game, null, { node: 'lies', key: '2', phase: 'write' }), null, 'nothing to do: nothing');
  const mid = { 'results/2': {} };
  assert.equal(sealGate(game, mid, { node: 'lies', key: '2', phase: 'write' }), mid, 'a patch that stays in the phase is untouched');
  assert.equal(sealGate({ ...game, phase: 'vote' }, leave, { node: 'lies', key: '2', phase: 'write' }), leave, 'another phase: not this gate');
  // last round's unseal never counts for this one
  assert.equal(unsealed({ unseal: { lies: '1' } }, 'lies', '2'), false);
  assert.equal(unsealed({ unseal: { lies: 2 } }, 'lies', '2'), true, 'a number key matches its string');
});

test('THE SEAL: the public flags + the host\'s envelopes merge (the envelope wins; an older client\'s secret still counts)', () => {
  const pub = { a: { done: true, at: 5 }, b: { t: 'OLD CLIENT', at: 6 } };
  const sealed = { a: { t: 'a lie', at: 5 } };
  assert.deepEqual(mergeSealed(pub, sealed), { a: { done: true, at: 5, t: 'a lie' }, b: { t: 'OLD CLIENT', at: 6 } });
  assert.deepEqual(mergeSealed(undefined, undefined), {});
});

test('CIPHER (Grok 4.6): the host re-grades the colours from the guesses — five greens it never earned are worth nothing', () => {
  const code = 'ABCD', game = { matchId: 'm1', round: 0, lengths: [5], roundMs: 60000, roundStartAt: 0, participants: { a: true, b: true, c: true } };
  const sk = secretKey(code, game.matchId, game.round);
  game.secret = encodeWord('crane', sk);
  const boards = {
    a: { g: [encodeWord('slate', sk), encodeWord('crane', sk)], p: ['00202', '22222'], solved: true, done: true, solvedAt: 2000 },
    // the cheat: claims a one-guess solve with a wrong guess
    b: { g: [encodeWord('mouse', sk)], p: ['22222'], solved: true, done: true, solvedAt: 1000 },
    // no guesses at all, colours written by hand
    c: { p: ['22222'], solved: true, done: true, solvedAt: 900 },
    // junk that isn't base64 must not crash the host
    d: { g: ['%%%'], p: ['22222'], solved: true, done: true },
  };
  const r = regradeBoards(game, boards, code);
  assert.deepEqual(r.a.p, ['00202', '22222']); assert.equal(r.a.solved, true);
  assert.equal(r.b.solved, false, 'the wrong guess is graded as what it is'); assert.notEqual(r.b.p[0], '22222');
  assert.deepEqual(r.c.p, []); assert.equal(r.c.solved, false);
  assert.equal(r.d.solved, false);
  const res = computeRoundResults(game, r);
  assert.ok(res.a.pts > 0 && res.b.pts === 0 && res.c.pts === 0, JSON.stringify(res));
});

test('GRIDLOCK (Grok 4.3): the host only takes a fleet change that is ONE legal relocate', () => {
  const size = 8;
  const prev = [{ r: 0, c: 0, len: 2, d: 0 }, { r: 2, c: 0, len: 3, d: 0 }, { r: 4, c: 0, len: 4, d: 0 }];
  const board = { cells: { '0,0': { h: 1 }, '7,7': { h: 0 } } };
  assert.equal(legalRelocate(prev, prev.map(s => ({ ...s })), board, size, canPlace), true, 'unchanged');
  const one = prev.map((s, i) => (i === 1 ? { r: 6, c: 2, len: 3, d: 0 } : s));
  assert.equal(legalRelocate(prev, one, board, size, canPlace), true, 'one undamaged ship moved to clear water');
  const two = one.map((s, i) => (i === 2 ? { r: 5, c: 4, len: 4, d: 0 } : s));
  assert.equal(legalRelocate(prev, two, board, size, canPlace), false, 'two ships moved');
  const hitShip = prev.map((s, i) => (i === 0 ? { r: 7, c: 0, len: 2, d: 0 } : s));
  assert.equal(legalRelocate(prev, hitShip, board, size, canPlace), false, 'a damaged ship stays');
  const longer = prev.map((s, i) => (i === 1 ? { r: 6, c: 0, len: 5, d: 0 } : s));
  assert.equal(legalRelocate(prev, longer, board, size, canPlace), false, 'the same lengths');
  const ontoShot = prev.map((s, i) => (i === 1 ? { r: 7, c: 5, len: 3, d: 0 } : s));
  assert.equal(legalRelocate(prev, ontoShot, board, size, canPlace), false, 'never onto a cell already shot');
  const outside = prev.map((s, i) => (i === 1 ? { r: 6, c: 6, len: 3, d: 0 } : s));
  assert.equal(legalRelocate(prev, outside, board, size, canPlace), false, 'inside the board');
  assert.equal(legalRelocate(prev, prev.slice(0, 2), board, size, canPlace), false, 'a ship can\'t vanish');
});
