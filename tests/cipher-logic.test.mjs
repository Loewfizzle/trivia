import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGuess, keyStates, scoreRound, computeRoundResults, totals, standings,
  encodeWord, decodeWord, secretKey, roundLengths, asArray, MAX_GUESSES,
} from '../js/games/cipher/logic.js';

test('evaluateGuess: basic cases', () => {
  assert.equal(evaluateGuess('crane', 'crane'), '22222');
  assert.equal(evaluateGuess('stomp', 'crane'), '00000');
  assert.equal(evaluateGuess('nacre', 'crane'), '11112');
  assert.equal(evaluateGuess('CRANE', 'crane'), '22222', 'case-insensitive');
});

test('evaluateGuess: duplicate letters in guess, single in answer', () => {
  // answer has one E; guess has two. Exact match wins, the other is grey.
  assert.equal(evaluateGuess('geese', 'those'), '00022');
  // two Ls guessed, one L in answer and not in either guessed spot: first gets yellow only
  assert.equal(evaluateGuess('llama', 'world'), '10000');
  // only one present-mark when answer has a single copy
  assert.equal(evaluateGuess('speed', 'abide'), '00101');
  assert.equal(evaluateGuess('eerie', 'crane'), '00102');
});

test('evaluateGuess: duplicates in answer', () => {
  // answer has two Os
  assert.equal(evaluateGuess('robot', 'floor'), '11020');
  assert.equal(evaluateGuess('ooozy', 'floor'), '10200');
  // answer has two Es, guess has three
  assert.equal(evaluateGuess('eeeee', 'geese'), '02202');
  assert.equal(evaluateGuess('elder', 'eerie'), '20011');
  // exact matches are reserved before present marks even when they come later
  assert.equal(evaluateGuess('abbey', 'kebab'), '11210');
  assert.equal(evaluateGuess('babes', 'abbey'), '11220');
});

test('evaluateGuess: 6 and 7 letters', () => {
  assert.equal(evaluateGuess('banana', 'bandit'), '222000');
  assert.equal(evaluateGuess('letters', 'settled'), '1222101');
});

test('keyStates keeps the best state per letter', () => {
  const g = ['geese', 'those'];
  const p = g.map(w => evaluateGuess(w, 'those'));
  const k = keyStates(g, p);
  assert.equal(k.e, 2);
  assert.equal(k.g, 0);
  assert.equal(k.s, 2);
  assert.equal(k.t, 2);
});

test('scoreRound', () => {
  assert.equal(scoreRound({ solved: false, guessesUsed: 6, elapsedMs: 1000, roundMs: 120000, length: 5 }).total, 0);
  // instant first-guess solve on 5 letters: 100 + 100 + 5*20
  assert.equal(scoreRound({ solved: true, guessesUsed: 1, elapsedMs: 0, roundMs: 120000, length: 5 }).total, 300);
  // last guess, at the buzzer, 7 letters: base 150, speed 0, eff 0
  assert.equal(scoreRound({ solved: true, guessesUsed: 6, elapsedMs: 120000, roundMs: 120000, length: 7 }).total, 150);
  // halfway, 3 guesses, 6 letters: 125 + 50 + 60
  assert.equal(scoreRound({ solved: true, guessesUsed: 3, elapsedMs: 60000, roundMs: 120000, length: 6 }).total, 235);
  // elapsed beyond round is clamped
  assert.equal(scoreRound({ solved: true, guessesUsed: MAX_GUESSES, elapsedMs: 999999, roundMs: 120000, length: 5 }).speed, 0);
});

test('roundLengths escalate', () => {
  assert.deepEqual(roundLengths(3), [5, 6, 7]);
  assert.deepEqual(roundLengths(5), [5, 5, 6, 6, 7]);
  assert.deepEqual(roundLengths(8), [5, 5, 5, 6, 6, 6, 7, 7]);
  assert.deepEqual(roundLengths(99), [5, 5, 6, 6, 7]);
});

test('computeRoundResults handles solved, failed, missing and object-shaped arrays', () => {
  const game = { round: 0, lengths: [5], roundMs: 100000, roundStartAt: 1000, participants: { a: true, b: true, c: true, d: true } };
  const boards = {
    a: { p: { 0: '01000', 1: '22222' }, solved: true, done: true, solvedAt: 51000 }, // RTDB object form
    b: { p: ['00000', '00000', '00000', '00000', '00000', '00000'], solved: false, done: true },
    c: { p: ['22220'], solved: true, done: true, solvedAt: 2000 }, // claims solved but last row not all green
  };
  const r = computeRoundResults(game, boards);
  assert.equal(r.a.pts, 100 + 50 + 80);
  assert.equal(r.a.n, 2);
  assert.equal(r.a.t, 50000);
  assert.equal(r.b.pts, 0);
  assert.equal(r.c.pts, 0);
  assert.equal(r.d.pts, 0);
  assert.equal(r.d.n, 0);
});

test('totals/standings never double count and share ranks on ties', () => {
  const game = {
    participants: { a: true, b: true, c: true },
    results: { 0: { a: { pts: 100 }, b: { pts: 200 }, c: { pts: 0 } }, 1: { a: { pts: 100 }, b: { pts: 0 }, c: { pts: 50 } } },
  };
  assert.deepEqual(totals(game), { a: 200, b: 200, c: 50 });
  assert.deepEqual(totals(game, 0), { a: 100, b: 200, c: 0 });
  const s = standings(game);
  assert.deepEqual(s.map(r => r.rank), [1, 1, 3]);
  assert.equal(s[2].uid, 'c');
});

test('asArray', () => {
  assert.deepEqual(asArray(null), []);
  assert.deepEqual(asArray({ 1: 'b', 0: 'a', 10: 'k', 2: 'c' }), ['a', 'b', 'c', 'k']);
});

test('encode/decode secret round-trips and hides the word', () => {
  const key = secretKey('ABCD', 'm1', 3);
  for (const w of ['crane', 'bandit', 'letters']) {
    const enc = encodeWord(w, key);
    assert.ok(!enc.toLowerCase().includes(w));
    assert.equal(decodeWord(enc, key), w);
    assert.notEqual(decodeWord(enc, secretKey('ABCD', 'm1', 4)), w);
  }
});
