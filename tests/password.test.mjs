// THE PASSWORD — THE RULES (PW1 — docs/password.md): the judge with every duplicate-letter case, the run (two doors, 6 guesses each, nothing
// after the end), the score for every outcome, the phone's copy following the server's answers, the resume view, the server's replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import { judge, createRun, canGuess, serverGuess, applyGuess, runView, recordOf, scoreOf, resultOf, replay, statusLine, keyStates, guessesLeft, cleanWord, rankOf, SCORE_MIN, SCORE_MAX, HIT, NEAR, MISS, WORD_LEN, DOORS, GUESSES } from '../js/games/password/logic.js';
import * as META from '../js/games/password/meta.js';

const M = s => [...s].map(c => ({ H: HIT, N: NEAR, M: MISS })[c]);
const ANS = ['CRANE', 'LIGHT'];
const play = (words, run = createRun({ startedAt: 1000 }), now = 5000) => {
  let resp = null;
  for (const w of words) ({ run, resp } = serverGuess(run, w, ANS, now));
  return { run, resp };
};

test('the judge: hits, nears, misses — the standard duplicate-letter rule', () => {
  assert.deepEqual(judge('CRANE', 'CRANE'), M('HHHHH'));
  assert.deepEqual(judge('CRANE', 'PLUMB'), M('MMMMM'));
  assert.deepEqual(judge('CRANE', 'NACRE'), M('NNNNH'));
  // a double letter in the GUESS, one in the answer: the first copy NEAR, the second MISS (not two nears)
  assert.deepEqual(judge('CRANE', 'EERIE'), M('MMNMH'));
  // a double letter in the GUESS where the second is the hit: the hit wins, the first copy misses
  assert.deepEqual(judge('ABBEY', 'BABES'), M('NNHHM'));
  // a double letter in the ANSWER, one in the guess: one near only
  assert.deepEqual(judge('ABBEY', 'BLIMP'), M('NMMMM'));
  // doubles in BOTH: two hits
  assert.deepEqual(judge('ABBEY', 'ABBOT'), M('HHHMM'));
  // doubles in both, misplaced: two nears
  assert.deepEqual(judge('ABBEY', 'BUBBA'), M('NMHNN'.replace('NMHNN', 'NMHMN')));
  // (BUBBA vs ABBEY: B·U·B·B·A — pos 2 B is a hit; answer has B left once (pos 1): the first B (pos 0) takes it, the fourth B misses; A near)
  assert.deepEqual(judge('ABBEY', 'BUBBA'), [NEAR, MISS, HIT, MISS, NEAR]);
  // a triple in the guess, one in the answer, hit in place
  assert.deepEqual(judge('LLAMA', 'LULLS'), M('HMNMM'));
  assert.throws(() => judge('CRANE', 'CRAN'));
  assert.throws(() => judge('CRAN3', 'CRANE'));
  assert.equal(judge('crane', 'Crane').every(m => m === HIT), true, 'case-blind');
  assert.equal(cleanWord(' light '), 'LIGHT'); assert.equal(cleanWord('lite'), null); assert.equal(cleanWord('éclat'), null);
});

test('the run: two doors, 6 guesses each; THE BACK ROOM opens on a solved DOOR; a miss on door 1 ends the run; nothing after the end', () => {
  let run = createRun({ day: 'd20261107', uid: 'u1', startedAt: 1000 });
  assert.equal(run.door, 0); assert.equal(canGuess(run), null); assert.equal(guessesLeft(run), GUESSES);
  assert.equal(statusLine(run), 'DOOR 1 · THE DOOR · 6 OF 6 LEFT');
  // five misses then the crack
  const r1 = play(['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK'], run);
  assert.equal(r1.run.doors[0].guesses.length, 5); assert.equal(guessesLeft(r1.run), 1);
  assert.equal(r1.resp.word, undefined, 'the answer is NOT in a mid-door answer');
  assert.equal(r1.run.doors[0].word, null);
  const r2 = play(['CRANE'], r1.run);
  assert.equal(r2.resp.solved, true); assert.equal(r2.resp.word, 'CRANE'); assert.equal(r2.resp.next, 1); assert.equal(r2.resp.done, false);
  assert.equal(r2.run.door, 1); assert.equal(r2.run.doors[0].state, 'solved'); assert.equal(r2.run.doors[1].word, null, 'THE BACK ROOM\'s word stays hidden');
  assert.equal(statusLine(r2.run), 'DOOR 2 · THE BACK ROOM · 6 OF 6 LEFT');
  // six misses on door 2 → failed, its word shown, done
  const r3 = play(['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], r2.run, 9000);
  assert.equal(r3.resp.failed, true); assert.equal(r3.resp.word, 'LIGHT'); assert.equal(r3.resp.done, true);
  assert.equal(r3.run.done, true); assert.equal(r3.run.finishedAt, 9000);
  assert.equal(canGuess(r3.run), 'done');
  assert.throws(() => serverGuess(r3.run, 'LIGHT', ANS, 9100), /over/);
  // door 1 failed → the run ends with THE BACK ROOM never opened and its word never in any answer
  const f1 = play(['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], createRun({ startedAt: 0 }), 7000);
  assert.equal(f1.resp.failed, true); assert.equal(f1.resp.done, true); assert.equal(f1.resp.word, 'CRANE'); assert.equal(f1.resp.next, undefined);
  assert.equal(f1.run.doors[1].state, 'open'); assert.equal(f1.run.doors[1].word, null); assert.equal(f1.run.doors[1].guesses.length, 0);
  assert.equal(canGuess(f1.run), 'done');
  assert.doesNotMatch(JSON.stringify(f1.run) + JSON.stringify(f1.resp), /LIGHT/, 'an unplayed door\'s word appears nowhere');
  // a 7th guess on an open door never happens: the 6th closes it
  assert.throws(() => serverGuess(createRun(), 'CRAN', ANS, 1), /5-letter/);
  assert.equal(WORD_LEN, 5); assert.equal(DOORS, 2); assert.equal(GUESSES, 6);
});

test('the score: doors opened first, then guesses — (2 − doors) × 100 + guesses; the time breaks a tie; only a finished run has a result', () => {
  const crack = play(['CRANE', 'LIGHT'], createRun({ startedAt: 1000 }), 61000).run;
  assert.deepEqual(scoreOf(crack), { doors: 2, guesses: 2, score: 2, time: 60000 });
  const slow = play(['PLUMB', 'STORK', 'CRANE', 'PLUMB', 'STORK', 'TRAIN', 'LIGHT'], createRun({ startedAt: 1000 }), 121000).run;
  assert.deepEqual(scoreOf(slow), { doors: 2, guesses: 7, score: 7, time: 120000 });
  const fail2 = play(['CRANE', 'PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], createRun({ startedAt: 1000 }), 5000).run;
  assert.deepEqual(scoreOf(fail2), { doors: 1, guesses: 7, score: 107, time: 4000 });
  const fail1 = play(['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], createRun({ startedAt: 1000 }), 5000).run;
  assert.deepEqual(scoreOf(fail1), { doors: 0, guesses: 6, score: 206, time: 4000 });
  assert.equal(SCORE_MIN, 2); assert.equal(SCORE_MAX, 206);
  // every clean crack beats every door-2 fail beats the door-1 fail; the faster of two equal scores ranks first
  assert.ok(scoreOf(slow).score < scoreOf(fail2).score && scoreOf(fail2).score < scoreOf(fail1).score);
  assert.ok(rankOf(2, 60000) < rankOf(2, 61000)); assert.ok(rankOf(2, 1e7) < rankOf(3, 0));
  assert.equal(resultOf(createRun()), null);
  assert.equal(resultOf(crack).rank, rankOf(2, 60000));
  assert.equal(statusLine(crack), 'BOTH DOORS OPEN'); assert.equal(statusLine(fail2), 'THE BACK ROOM HELD'); assert.equal(statusLine(fail1), 'THE DOOR HELD');
});

test('the phone follows the server: applyGuess folds each answer in → the same run; out of step is refused; the keys\' marks', () => {
  let server = createRun({ day: 'd20261107', uid: 'u1', startedAt: 1000 });
  let phone = createRun({ day: 'd20261107', uid: 'u1', startedAt: 1000 });
  for (const w of ['TRAIN', 'CRANE', 'LIGHT']) {
    const { run, resp } = serverGuess(server, w, ANS, 8000);
    server = run;
    assert.doesNotMatch(JSON.stringify(resp), resp.word ? /LIGHT(?!"|$)/ : /CRANE|LIGHT/, 'no answer leaks before its door closes');
    phone = applyGuess(phone, resp, w);
  }
  assert.deepEqual(phone, { ...server, finishedAt: phone.finishedAt });
  assert.equal(phone.done, true);
  // the same answer twice = out of step
  const { resp } = serverGuess(createRun(), 'TRAIN', ANS, 1);
  const once = applyGuess(createRun(), resp, 'TRAIN');
  assert.throws(() => applyGuess(once, resp, 'TRAIN'), /out of step/);
  // the keyboard's marks: the best mark a letter earned on the open door (hit > near > miss)
  const r = play(['TRAIN', 'CRATE'], createRun()).run;
  const ks = keyStates(r);
  assert.equal(ks.T, MISS, 'T: missed in TRAIN… then NEAR? CRATE has T at 3, CRANE has no T → miss');
  assert.equal(ks.R, HIT); assert.equal(ks.A, HIT); assert.equal(ks.C, HIT); assert.equal(ks.E, HIT); assert.equal(ks.N, NEAR); assert.equal(ks.I, MISS);
  assert.equal(ks.Z, undefined);
});

test('the resume view: the stored record (words only) → the run — closed doors show their word, an unplayed door never does; the record round-trips', () => {
  const r = play(['TRAIN', 'CRANE', 'PLUMB'], createRun({ startedAt: 1000 })).run;
  const rec = recordOf(r);
  assert.deepEqual(rec, { g: { 0: ['TRAIN', 'CRANE'], 1: ['PLUMB'] } });
  assert.doesNotMatch(JSON.stringify(rec), /hit|near|miss|LIGHT/);
  const v = runView(rec, ANS, { day: 'd20261107', uid: 'u1', startedAt: 1000 });
  assert.deepEqual(v.doors[0].marks, r.doors[0].marks); assert.equal(v.doors[0].word, 'CRANE'); assert.equal(v.doors[1].word, null); assert.equal(v.door, 1);
  assert.equal(v.doors[1].guesses.length, 1);
  // firebase hands arrays back as objects sometimes
  const v2 = runView({ g: { 0: { 0: 'TRAIN', 1: 'CRANE' }, 1: { 0: 'PLUMB' } } }, ANS);
  assert.deepEqual(v2.doors[1].marks, v.doors[1].marks);
  // a finished record carries its end time
  const done = play(['CRANE', 'LIGHT'], createRun({ startedAt: 1000 }), 4000).run;
  const recD = recordOf(done);
  assert.equal(recD.e, 4000);
  const vD = runView(recD, ANS, { startedAt: 1000 });
  assert.equal(vD.done, true); assert.equal(vD.finishedAt, 4000); assert.deepEqual(scoreOf(vD), scoreOf(done));
  assert.equal(runView(null, ANS).door, 0);
});

test('THE SERVER\'s REPLAY: a finished record re-scores to the same result; a record no run makes is refused', () => {
  const crack = play(['TRAIN', 'CRANE', 'LIGHT'], createRun({ startedAt: 1000 }), 61000).run;
  assert.deepEqual(replay(recordOf(crack), ANS, { startedAt: 1000 }), resultOf(crack));
  const fail1 = play(['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], createRun({ startedAt: 1000 }), 5000).run;
  assert.deepEqual(replay(recordOf(fail1), ANS, { startedAt: 1000 }), resultOf(fail1));
  const fail2 = play(['CRANE', 'PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], createRun({ startedAt: 1000 }), 5000).run;
  assert.deepEqual(replay(recordOf(fail2), ANS, { startedAt: 1000 }), resultOf(fail2));
  // refused: unfinished · a 7th guess · a guess after the crack · THE BACK ROOM without THE DOOR · a bad word · no end time · a third door
  assert.equal(replay({ g: { 0: ['TRAIN'] } }, ANS), null);
  assert.equal(replay({ g: { 0: ['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB', 'STORK'] }, e: 5 }, ANS), null);
  assert.equal(replay({ g: { 0: ['CRANE', 'TRAIN'], 1: ['LIGHT'] }, e: 5 }, ANS), null);
  assert.equal(replay({ g: { 1: ['LIGHT'] }, e: 5 }, ANS), null);
  assert.equal(replay({ g: { 0: ['PLUMB', 'STORK', 'TRAIN', 'CRATE', 'CRANK', 'PLUMB'], 1: ['LIGHT'] }, e: 5 }, ANS), null, 'door 1 failed: THE BACK ROOM never opened');
  assert.equal(replay({ g: { 0: ['CRAN3'], 1: [] }, e: 5 }, ANS), null);
  assert.equal(replay({ g: { 0: ['CRANE'], 1: ['LIGHT'] } }, ANS), null, 'no end time');
  assert.equal(replay({ g: { 0: ['CRANE'], 1: ['LIGHT'], 2: ['X'] }, e: 5 }, ANS), null);
  assert.equal(replay(null, ANS), null); assert.equal(replay({ g: {} }, ['CRANE']), null);
});

test('THE THIN META: pure, the one source for the rules\' constants; a solo daily, the chat never locked', () => {
  assert.equal(META.WORD_LEN, 5); assert.equal(META.DOORS, 2); assert.equal(META.GUESSES, 6);
  assert.deepEqual(META.DOOR_NAMES, ['THE DOOR', 'THE BACK ROOM']);
  assert.equal(META.SOLO, true); assert.equal(META.MIN_PLAYERS, 1); assert.equal(META.BANNER_NAME, 'THE PASSWORD');
  assert.equal(META.chatLocked({ phase: 'play' }, 'u', {}), false);
  assert.equal(META.estimateMinutes({}), 4);
  assert.deepEqual(META.OPTIONS, []); assert.deepEqual(META.DEFAULT_SETTINGS, {});
});
